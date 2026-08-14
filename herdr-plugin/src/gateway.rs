//! tsk-7l9-2: fgOS gateway — the REST surface `docs/history/fgos-interface-daemon/`
//! locks (CONTEXT.md D1/D4/D5/D7/D8, `docs/contracts/fgos-gateway-api-v1.yaml`,
//! CTR010). Lives inside the `herdr-fgos` binary (D8) as a new async adapter
//! sitting beside the existing synchronous TUI/orchestrator code — nothing in
//! `app.rs`/`main.rs`'s TUI path changes shape or gains an async dependency.
//!
//! D7: this module is the SOLE place that spawns `fgos <verb>` on the
//! gateway's behalf (`spawn_fgos_verb`) — every route handler below funnels
//! through it, mirroring the CLI's own closed error taxonomy
//! (`src/state/store.mjs`'s `EXIT_CODES`) instead of inventing a new one.
//!
//! D4/D5: one auth token per machine, read from `~/.fgos/config.json`'s
//! `gateway.token` field (the global config file `docs/specs/distribution.md`
//! row 5b already establishes — this module only ever READS it; per that same
//! row ("not created by anything except fgos setup") it never writes or
//! creates the file itself, so a missing token is a startup refusal, not a
//! self-provisioned default).

use std::io::Read;
use std::net::SocketAddr;
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::sync::Arc;
use std::time::{Duration, Instant};

use axum::extract::{FromRequest, FromRequestParts, Path as AxPath, Query, Request, State};
use axum::http::request::Parts;
use axum::http::{HeaderMap, StatusCode};
use axum::middleware::{self, Next};
use axum::response::{IntoResponse, Response};
use axum::routing::{delete, get, post};
use axum::{Json, Router};
use serde::Deserialize;
use serde_json::{json, Value};

use crate::ports::VerbGateway;

/// Default listening port — same default `docs/contracts/fgos-gateway-api-v1.yaml`'s
/// `servers.variables.port` documents.
const DEFAULT_PORT: u16 = 4170;

// ---------------------------------------------------------------------------
// Config (D4/D5)
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize, Default)]
struct GlobalConfigFile {
    #[serde(default)]
    gateway: Option<GatewaySection>,
}

#[derive(Debug, Deserialize, Default)]
struct GatewaySection {
    token: Option<String>,
    port: Option<u16>,
}

#[derive(Debug, Clone)]
pub struct GatewayConfig {
    pub port: u16,
    pub token: String,
}

#[derive(Debug)]
pub enum GatewayConfigError {
    NoHomeDir,
    NotFound(PathBuf),
    Io(PathBuf, std::io::Error),
    Parse(PathBuf, serde_json::Error),
    MissingToken(PathBuf),
}

impl std::error::Error for GatewayConfigError {}

impl std::fmt::Display for GatewayConfigError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            GatewayConfigError::NoHomeDir => write!(f, "could not resolve $HOME to locate ~/.fgos/config.json"),
            GatewayConfigError::NotFound(p) => write!(
                f,
                "{} not found — the gateway needs a per-machine auth token (D4). Add a \"gateway\": {{ \"token\": \"<random-string>\" }} entry to it (run \"fgos setup\" first if the file itself doesn't exist yet).",
                p.display()
            ),
            GatewayConfigError::Io(p, err) => write!(f, "could not read {}: {err}", p.display()),
            GatewayConfigError::Parse(p, err) => write!(f, "could not parse {} as JSON: {err}", p.display()),
            GatewayConfigError::MissingToken(p) => write!(
                f,
                "{} has no \"gateway.token\" field — the gateway needs a per-machine auth token (D4). Add a \"gateway\": {{ \"token\": \"<random-string>\" }} entry to it.",
                p.display()
            ),
        }
    }
}

/// D4/D5: read the per-machine gateway token + optional port override from
/// `~/.fgos/config.json`. Never creates or writes this file — per
/// `docs/specs/distribution.md` row 5b it is only ever created by
/// `fgos setup`; a missing file or missing token is a refusal to start, not
/// a self-provisioned default (that would also defeat D4's whole point: an
/// auto-generated, never-persisted-anywhere-a-client-can-read-it token
/// would lock every caller out immediately).
pub fn load_gateway_config(home_dir: Option<&Path>) -> Result<GatewayConfig, GatewayConfigError> {
    let home = match home_dir {
        Some(p) => p.to_path_buf(),
        None => std::env::var_os("HOME")
            .map(PathBuf::from)
            .ok_or(GatewayConfigError::NoHomeDir)?,
    };
    let config_path = home.join(".fgos").join("config.json");
    if !config_path.exists() {
        return Err(GatewayConfigError::NotFound(config_path));
    }
    let raw = std::fs::read_to_string(&config_path)
        .map_err(|err| GatewayConfigError::Io(config_path.clone(), err))?;
    let parsed: GlobalConfigFile =
        serde_json::from_str(&raw).map_err(|err| GatewayConfigError::Parse(config_path.clone(), err))?;
    let section = parsed.gateway.unwrap_or_default();
    let token = section.token.ok_or_else(|| GatewayConfigError::MissingToken(config_path.clone()))?;
    if token.trim().is_empty() {
        return Err(GatewayConfigError::MissingToken(config_path));
    }
    Ok(GatewayConfig {
        port: section.port.unwrap_or(DEFAULT_PORT),
        token,
    })
}

// ---------------------------------------------------------------------------
// Verb chokepoint (D7) — the sole spawn point for `fgos <verb>`
// ---------------------------------------------------------------------------

/// The one CLOSED taxonomy `src/state/store.mjs`'s `EXIT_CODES` already
/// defines, mirrored here verbatim (D7's own note: this gateway adds no
/// categories of its own) — matches
/// `docs/contracts/fgos-gateway-api-v1.yaml`'s `ErrorEnvelope.category` enum.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ErrorCategory {
    Precondition,
    Conflict,
    Validation,
    CorruptLog,
    LockTimeout,
    SessionFail,
    MergeFail,
    Busy,
    Unexpected,
}

impl ErrorCategory {
    /// Reverse of `bin/fgos.mjs`'s own `EXIT_CODES` map
    /// (`src/state/store.mjs`) plus `loop.mjs`'s `EXIT_BUSY` (6) — the exact
    /// exit-code contract `fgos.mjs`'s own `main()` writes via
    /// `process.exitCode = EXIT_CODES[categoryOf(err)] ?? 1`.
    fn from_exit_code(code: i32) -> Self {
        match code {
            2 => ErrorCategory::Precondition,
            3 => ErrorCategory::Conflict,
            4 => ErrorCategory::Validation,
            5 => ErrorCategory::CorruptLog,
            6 => ErrorCategory::Busy,
            7 => ErrorCategory::LockTimeout,
            8 => ErrorCategory::SessionFail,
            9 => ErrorCategory::MergeFail,
            _ => ErrorCategory::Unexpected,
        }
    }

    fn as_str(self) -> &'static str {
        match self {
            ErrorCategory::Precondition => "precondition",
            ErrorCategory::Conflict => "conflict",
            ErrorCategory::Validation => "validation",
            ErrorCategory::CorruptLog => "corrupt-log",
            ErrorCategory::LockTimeout => "lock-timeout",
            ErrorCategory::SessionFail => "session-fail",
            ErrorCategory::MergeFail => "merge-fail",
            ErrorCategory::Busy => "busy",
            ErrorCategory::Unexpected => "unexpected",
        }
    }

    /// HTTP status this category maps to. The closed `category` enum is the
    /// field a client actually branches on (per the contract's own
    /// `ErrorEnvelope` doc: "never on message text") — the HTTP status is a
    /// courtesy for generic HTTP tooling, not a second source of truth.
    fn http_status(self) -> StatusCode {
        match self {
            ErrorCategory::Precondition => StatusCode::PRECONDITION_FAILED,
            ErrorCategory::Conflict => StatusCode::CONFLICT,
            ErrorCategory::Validation => StatusCode::BAD_REQUEST,
            ErrorCategory::CorruptLog => StatusCode::INTERNAL_SERVER_ERROR,
            ErrorCategory::LockTimeout => StatusCode::SERVICE_UNAVAILABLE,
            ErrorCategory::SessionFail => StatusCode::INTERNAL_SERVER_ERROR,
            ErrorCategory::MergeFail => StatusCode::CONFLICT,
            ErrorCategory::Busy => StatusCode::TOO_MANY_REQUESTS,
            ErrorCategory::Unexpected => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

/// `docs/contracts/fgos-gateway-api-v1.yaml`'s `ErrorEnvelope` shape.
#[derive(Debug)]
pub struct GatewayError {
    pub category: ErrorCategory,
    pub message: String,
    pub exit_code: Option<i32>,
}

impl GatewayError {
    pub(crate) fn validation(message: impl Into<String>) -> Self {
        GatewayError {
            category: ErrorCategory::Validation,
            message: message.into(),
            exit_code: None,
        }
    }

    fn unexpected(message: impl Into<String>) -> Self {
        GatewayError {
            category: ErrorCategory::Unexpected,
            message: message.into(),
            exit_code: None,
        }
    }
}

impl std::fmt::Display for GatewayError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{} ({}): {}", self.category.as_str(), self.exit_code.unwrap_or(-1), self.message)
    }
}

impl GatewayError {
    /// tsk-4qf: same `ErrorEnvelope` body `into_response` always builds,
    /// with an explicit status override at THIS call site instead of the
    /// blanket `category.http_status()` table. Lets a caller give a
    /// distinct HTTP-layer signal (e.g. 401 for an auth failure) without
    /// adding a new `category` value — D7 pins that enum as a closed
    /// mirror of the CLI's own exit-code taxonomy, never widened by the
    /// gateway itself.
    fn into_response_with_status(self, status: StatusCode) -> Response {
        let body = json!({
            "category": self.category.as_str(),
            "message": self.message,
            "exitCode": self.exit_code,
        });
        (status, Json(body)).into_response()
    }
}

impl IntoResponse for GatewayError {
    fn into_response(self) -> Response {
        let status = self.category.http_status();
        self.into_response_with_status(status)
    }
}

/// tsk-4lf: how long `spawn_fgos_verb` waits before it gives up on a still-
/// running `fgos` subprocess and kills it. Evidenced, not guessed:
/// `src/runner/main-checkout-lock.mjs`'s own `DEFAULT_TTL_MS` comment
/// measures ONE `mergeRunnerItem` verify/npm-ci hold at up to ~185s in
/// practice; `approve` can run that hold TWICE inside one call (catchup
/// worktree + merge worktree), so ~370s is this repo's own evidenced
/// worst-case legitimate duration for the slowest verb this chokepoint
/// spawns. 600s leaves real margin above that without ever mattering to a
/// lightweight route (`list`/`ready`/`graph`/...), which finishes in
/// milliseconds either way.
const VERB_SPAWN_TIMEOUT: Duration = Duration::from_secs(600);

/// Poll interval for the `try_wait()` loop below — small enough that the
/// timeout deadline is honored promptly, cheap enough to run for up to
/// `VERB_SPAWN_TIMEOUT` without meaningful CPU cost.
const VERB_SPAWN_POLL_INTERVAL: Duration = Duration::from_millis(50);

/// tsk-4lf: waits on `child` up to `timeout`, killing it and returning
/// `Err(())` if it is still running at the deadline. Drains `stdout`/
/// `stderr` on separate threads STARTED BEFORE the wait loop begins — the
/// same pattern `std::process::Command::output()` uses internally — so a
/// verb whose combined output exceeds the OS pipe buffer (64KiB on Linux)
/// can never deadlock this thread's `try_wait()` poll on a full,
/// undrained pipe. `child` must already have `stdout`/`stderr` set to
/// `Stdio::piped()` by the caller.
fn wait_with_timeout(
    mut child: std::process::Child,
    timeout: Duration,
    poll_interval: Duration,
) -> Result<(std::process::ExitStatus, Vec<u8>, Vec<u8>), ()> {
    let mut stdout_pipe = child.stdout.take().expect("caller must pipe stdout");
    let mut stderr_pipe = child.stderr.take().expect("caller must pipe stderr");
    let stdout_thread = std::thread::spawn(move || {
        let mut buf = Vec::new();
        let _ = stdout_pipe.read_to_end(&mut buf);
        buf
    });
    let stderr_thread = std::thread::spawn(move || {
        let mut buf = Vec::new();
        let _ = stderr_pipe.read_to_end(&mut buf);
        buf
    });

    let deadline = Instant::now() + timeout;
    loop {
        if let Ok(Some(status)) = child.try_wait() {
            let stdout = stdout_thread.join().unwrap_or_default();
            let stderr = stderr_thread.join().unwrap_or_default();
            return Ok((status, stdout, stderr));
        }
        if Instant::now() >= deadline {
            let _ = child.kill();
            let _ = child.wait();
            let _ = stdout_thread.join();
            let _ = stderr_thread.join();
            return Err(());
        }
        std::thread::sleep(poll_interval);
    }
}

/// D7: the sole function that ever spawns `fgos <verb>` on the gateway's
/// behalf. `args` is everything after the binary path (verb + its own
/// flags) — `--dir <root>` is appended here, once, so no call site can
/// forget it (the same worktree-vs-main-checkout hazard `fgos-coding-implement`'s
/// own hard rules exist for).
///
/// Blocking (`std::process::Command`, matching `fgos.rs`'s own `run_fgos`
/// convention) — callers on the async side always run this inside
/// `tokio::task::spawn_blocking` (see `run_verb_blocking` below), never
/// call it directly from an async handler body. tsk-4lf: bounded by
/// `VERB_SPAWN_TIMEOUT` via `wait_with_timeout` instead of a bare
/// `.output()` — a wedged verb can no longer pin this thread forever.
pub fn spawn_fgos_verb(root: &Path, args: &[String]) -> Result<Value, GatewayError> {
    let mut cmd_args: Vec<String> = vec![root.join("bin/fgos.mjs").to_string_lossy().to_string()];
    cmd_args.extend(args.iter().cloned());
    cmd_args.push("--dir".to_string());
    cmd_args.push(root.to_string_lossy().to_string());

    let child = std::process::Command::new("node")
        .args(&cmd_args)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|err| GatewayError::unexpected(format!("spawning fgos CLI failed: {err}")))?;

    let (status, stdout, stderr) =
        wait_with_timeout(child, VERB_SPAWN_TIMEOUT, VERB_SPAWN_POLL_INTERVAL).map_err(|()| GatewayError {
            category: ErrorCategory::Busy,
            message: format!(
                "fgos CLI did not finish within {VERB_SPAWN_TIMEOUT:?} and was killed -- try again"
            ),
            exit_code: None,
        })?;

    if !status.success() {
        let code = status.code().unwrap_or(1);
        let message = String::from_utf8_lossy(&stderr).trim().to_string();
        return Err(GatewayError {
            category: ErrorCategory::from_exit_code(code),
            message: if message.is_empty() {
                format!("fgos CLI exited with code {code}")
            } else {
                message
            },
            exit_code: Some(code),
        });
    }

    let stdout = String::from_utf8_lossy(&stdout);
    let envelope: Value = serde_json::from_str(stdout.trim())
        .map_err(|err| GatewayError::unexpected(format!("fgos CLI returned unparseable JSON: {err}")))?;
    // Envelope reuse (CTR001, contract's own top-level note): the HTTP body
    // carries the SAME {contract, generated_at, data_hash, data} shape the
    // CLI itself prints, unmodified — so the full envelope is returned here,
    // not just `data`, and route handlers below pass it straight through.
    Ok(envelope)
}

/// The `VerbGateway` port's one real adapter (`ports.rs`) — holds `root` so
/// the composition root (`main.rs`) resolves it once.
pub struct FgosCliGateway {
    pub root: PathBuf,
}

impl VerbGateway for FgosCliGateway {
    fn run_verb(&self, args: &[String]) -> Result<Value, GatewayError> {
        spawn_fgos_verb(&self.root, args)
    }
}

/// Runs a `VerbGateway` call on a blocking thread so the (synchronous,
/// subprocess-spawning) chokepoint never stalls axum's async runtime.
async fn run_verb_blocking(
    gw: Arc<dyn VerbGateway>,
    args: Vec<String>,
) -> Result<Value, GatewayError> {
    tokio::task::spawn_blocking(move || gw.run_verb(&args))
        .await
        .map_err(|err| GatewayError::unexpected(format!("verb task panicked: {err}")))?
}

// ---------------------------------------------------------------------------
// Auth middleware (D4)
// ---------------------------------------------------------------------------

async fn require_token(
    State(state): State<AppState>,
    headers: HeaderMap,
    request: axum::extract::Request,
    next: Next,
) -> Response {
    let supplied = headers
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "));
    match supplied {
        Some(token) if constant_time_eq(token.as_bytes(), state.config.token.as_bytes()) => {
            next.run(request).await
        }
        // tsk-4qf: 401, not category's own 400 -- gives a client a
        // distinct HTTP-layer auth signal (D7 forbids a new `category`
        // value, so the JSON body's `category` field stays "validation";
        // the status code alone carries the distinction).
        _ => GatewayError {
            category: ErrorCategory::Validation,
            message: "missing or invalid Authorization: Bearer <token> (D4: one token per machine, see ~/.fgos/config.json's \"gateway.token\")".to_string(),
            exit_code: None,
        }
        .into_response_with_status(StatusCode::UNAUTHORIZED),
    }
}

/// Avoids a timing side-channel on the token comparison. Small, fixed-size
/// tokens make this a cheap, worthwhile precaution rather than premature
/// hardening — D9's own note that this gateway takes no new privilege
/// stance doesn't mean the one gate it does have should leak timing.
fn constant_time_eq(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() {
        return false;
    }
    let mut diff = 0u8;
    for (x, y) in a.iter().zip(b.iter()) {
        diff |= x ^ y;
    }
    diff == 0
}

// ---------------------------------------------------------------------------
// Router + handlers
// ---------------------------------------------------------------------------

#[derive(Clone)]
struct AppState {
    gateway: Arc<dyn VerbGateway>,
    config: Arc<GatewayConfig>,
    root: PathBuf,
}

/// tsk-4qf: axum's own `Json<T>` rejects a malformed body with a
/// plain-text response, not this gateway's `ErrorEnvelope` -- the contract
/// (`docs/contracts/fgos-gateway-api-v1.yaml`) tells clients to "branch on
/// this body's `category`" for every non-2xx response, which a plain-text
/// body can't satisfy. Wraps `axum::Json` so its own rejection (already
/// `Display`, `axum::extract::rejection::JsonRejection`) becomes a real
/// `GatewayError` -- `IntoResponse` for the whole route then produces the
/// same envelope every other error already does.
struct AppJson<T>(T);

impl<S, T> FromRequest<S> for AppJson<T>
where
    T: serde::de::DeserializeOwned,
    S: Send + Sync,
{
    type Rejection = GatewayError;

    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        match Json::<T>::from_request(req, state).await {
            Ok(Json(value)) => Ok(AppJson(value)),
            Err(rejection) => Err(GatewayError::validation(format!("{rejection}"))),
        }
    }
}

/// Same fix as `AppJson`, for `axum::extract::Query` — a malformed query
/// string (`axum::extract::rejection::QueryRejection`) also defaulted to a
/// plain-text rejection body before this item.
struct AppQuery<T>(T);

impl<S, T> FromRequestParts<S> for AppQuery<T>
where
    T: serde::de::DeserializeOwned,
    S: Send + Sync,
{
    type Rejection = GatewayError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        match Query::<T>::from_request_parts(parts, state).await {
            Ok(Query(value)) => Ok(AppQuery(value)),
            Err(rejection) => Err(GatewayError::validation(format!("{rejection}"))),
        }
    }
}

/// tsk-1ah: `bin/fgos.mjs`'s `parseArgs` reinterprets ANY argv element
/// starting with `--` as a flag, regardless of position -- a value like
/// `POST /v1/work {"text": "--force"}` would silently become a boolean
/// `force` flag instead of `submit`'s own positional text. Every field
/// this guards (`id`, `role`, `to`, `expect`, `status`, `stage`, `cursor`)
/// is enum/id-shaped: no legitimate value in any of them ever begins with
/// `-`, so rejecting one here has zero false positives. Free-text fields
/// (`text`, `reason`) are a deliberate scope boundary -- see `plan.md`.
pub(crate) fn reject_leading_dash(value: &str, field: &str) -> Result<(), GatewayError> {
    if value.starts_with('-') {
        return Err(GatewayError::validation(format!(
            "{field} must not begin with \"-\" -- rejected to prevent it being misread as a CLI flag (tsk-1ah)"
        )));
    }
    Ok(())
}

#[derive(Debug, Deserialize, Default)]
struct ListWorkQuery {
    status: Option<String>,
    stage: Option<String>,
    #[serde(default)]
    all: bool,
    cursor: Option<String>,
    limit: Option<u32>,
}

async fn get_work(State(state): State<AppState>, AppQuery(q): AppQuery<ListWorkQuery>) -> Result<Json<Value>, GatewayError> {
    let mut args = vec!["list".to_string(), "--json".to_string()];
    if let Some(status) = q.status {
        reject_leading_dash(&status, "status")?;
        args.push("--status".to_string());
        args.push(status);
    }
    if let Some(stage) = q.stage {
        reject_leading_dash(&stage, "stage")?;
        args.push("--stage".to_string());
        args.push(stage);
    }
    if q.all {
        args.push("--all".to_string());
    }
    if let Some(cursor) = q.cursor {
        reject_leading_dash(&cursor, "cursor")?;
        args.push("--cursor".to_string());
        args.push(cursor);
    }
    if let Some(limit) = q.limit {
        args.push("--limit".to_string());
        args.push(limit.to_string());
    }
    let data = run_verb_blocking(state.gateway, args).await?;
    Ok(Json(data))
}

#[derive(Debug, Deserialize)]
struct SubmitWorkBody {
    text: String,
}

async fn post_work(State(state): State<AppState>, AppJson(body): AppJson<SubmitWorkBody>) -> Result<Json<Value>, GatewayError> {
    if body.text.trim().is_empty() {
        return Err(GatewayError::validation("submitWork requires a non-empty \"text\" field"));
    }
    let args = vec!["submit".to_string(), body.text, "--json".to_string()];
    let data = run_verb_blocking(state.gateway, args).await?;
    Ok(Json(data))
}

async fn get_work_by_id(State(state): State<AppState>, AxPath(id): AxPath<String>) -> Result<Json<Value>, GatewayError> {
    reject_leading_dash(&id, "id")?;
    let args = vec!["show".to_string(), id, "--json".to_string()];
    let data = run_verb_blocking(state.gateway, args).await?;
    Ok(Json(data))
}

#[derive(Debug, Deserialize)]
struct MoveWorkBody {
    to: String,
    expect: Option<String>,
}

async fn post_work_move(
    State(state): State<AppState>,
    AxPath(id): AxPath<String>,
    AppJson(body): AppJson<MoveWorkBody>,
) -> Result<Json<Value>, GatewayError> {
    reject_leading_dash(&id, "id")?;
    reject_leading_dash(&body.to, "to")?;
    let mut args = vec!["move".to_string(), id, "--to".to_string(), body.to, "--json".to_string()];
    if let Some(expect) = body.expect {
        reject_leading_dash(&expect, "expect")?;
        args.push("--expect".to_string());
        args.push(expect);
    }
    let data = run_verb_blocking(state.gateway, args).await?;
    Ok(Json(data))
}

#[derive(Debug, Deserialize)]
struct TextBody {
    text: String,
}

async fn post_work_ask(
    State(state): State<AppState>,
    AxPath(id): AxPath<String>,
    AppJson(body): AppJson<TextBody>,
) -> Result<Json<Value>, GatewayError> {
    reject_leading_dash(&id, "id")?;
    let args = vec!["ask".to_string(), id, "--text".to_string(), body.text, "--json".to_string()];
    let data = run_verb_blocking(state.gateway, args).await?;
    Ok(Json(data))
}

async fn post_work_answer(
    State(state): State<AppState>,
    AxPath(id): AxPath<String>,
    AppJson(body): AppJson<TextBody>,
) -> Result<Json<Value>, GatewayError> {
    reject_leading_dash(&id, "id")?;
    let args = vec!["answer".to_string(), id, "--text".to_string(), body.text, "--json".to_string()];
    let data = run_verb_blocking(state.gateway, args).await?;
    Ok(Json(data))
}

#[derive(Debug, Deserialize, Default)]
struct TakeWorkBody {
    role: Option<String>,
}

async fn post_work_take(
    State(state): State<AppState>,
    AxPath(id): AxPath<String>,
    body: Option<Json<TakeWorkBody>>,
) -> Result<Json<Value>, GatewayError> {
    let role = body.and_then(|Json(b)| b.role).unwrap_or_else(|| "session".to_string());
    reject_leading_dash(&id, "id")?;
    reject_leading_dash(&role, "role")?;
    let args = vec!["take".to_string(), id, "--role".to_string(), role, "--json".to_string()];
    let data = run_verb_blocking(state.gateway, args).await?;
    Ok(Json(data))
}

async fn post_work_return(State(state): State<AppState>, AxPath(id): AxPath<String>) -> Result<Json<Value>, GatewayError> {
    reject_leading_dash(&id, "id")?;
    let args = vec!["return".to_string(), id, "--json".to_string()];
    let data = run_verb_blocking(state.gateway, args).await?;
    Ok(Json(data))
}

async fn post_work_approve(State(state): State<AppState>, AxPath(id): AxPath<String>) -> Result<Json<Value>, GatewayError> {
    reject_leading_dash(&id, "id")?;
    let args = vec!["approve".to_string(), id, "--json".to_string()];
    let data = run_verb_blocking(state.gateway, args).await?;
    Ok(Json(data))
}

#[derive(Debug, Deserialize)]
struct ReasonBody {
    reason: String,
}

async fn post_work_reject(
    State(state): State<AppState>,
    AxPath(id): AxPath<String>,
    AppJson(body): AppJson<ReasonBody>,
) -> Result<Json<Value>, GatewayError> {
    reject_leading_dash(&id, "id")?;
    let args = vec!["reject".to_string(), id, "--reason".to_string(), body.reason, "--json".to_string()];
    let data = run_verb_blocking(state.gateway, args).await?;
    Ok(Json(data))
}

#[derive(Debug, Deserialize, Default)]
struct PageQuery {
    cursor: Option<String>,
    limit: Option<u32>,
}

async fn get_ready(State(state): State<AppState>, AppQuery(q): AppQuery<PageQuery>) -> Result<Json<Value>, GatewayError> {
    let mut args = vec!["ready".to_string(), "--json".to_string()];
    if let Some(cursor) = q.cursor {
        reject_leading_dash(&cursor, "cursor")?;
        args.push("--cursor".to_string());
        args.push(cursor);
    }
    if let Some(limit) = q.limit {
        args.push("--limit".to_string());
        args.push(limit.to_string());
    }
    let data = run_verb_blocking(state.gateway, args).await?;
    Ok(Json(data))
}

async fn get_rollup(State(state): State<AppState>, AxPath(id): AxPath<String>) -> Result<Json<Value>, GatewayError> {
    reject_leading_dash(&id, "id")?;
    let args = vec!["rollup".to_string(), id, "--json".to_string()];
    let data = run_verb_blocking(state.gateway, args).await?;
    Ok(Json(data))
}

async fn get_graph(State(state): State<AppState>) -> Result<Json<Value>, GatewayError> {
    let args = vec!["graph".to_string(), "--json".to_string()];
    let data = run_verb_blocking(state.gateway, args).await?;
    Ok(Json(data))
}

/// The cheap-poll digest (`/state/digest`, D-contract's own note: "a
/// genuinely new route no CLI verb returns only the digest for today") —
/// still goes through the same D7 chokepoint (`fgos list --json`), just
/// discards `data` before responding so a polling client never pays for the
/// full body it isn't asking for.
async fn get_state_digest(State(state): State<AppState>) -> Result<Json<Value>, GatewayError> {
    let args = vec!["list".to_string(), "--json".to_string()];
    let envelope = run_verb_blocking(state.gateway, args).await?;
    Ok(Json(json!({
        "contract": envelope.get("contract").cloned().unwrap_or(json!("fgos.v1")),
        "generated_at": envelope.get("generated_at").cloned().unwrap_or(Value::Null),
        "data_hash": envelope.get("data_hash").cloned().unwrap_or(Value::Null),
    })))
}

#[derive(Debug, Deserialize, Default)]
struct StartSessionBody {
    item: Option<String>,
}

async fn post_sessions(
    State(state): State<AppState>,
    body: Option<Json<StartSessionBody>>,
) -> Result<Json<Value>, GatewayError> {
    let mut args = vec!["session".to_string(), "start".to_string(), "--json".to_string()];
    if let Some(Json(b)) = body {
        if let Some(item) = b.item {
            reject_leading_dash(&item, "item")?;
            args.push("--item".to_string());
            args.push(item);
        }
    }
    let data = run_verb_blocking(state.gateway, args).await?;
    Ok(Json(data))
}

#[derive(Debug, Deserialize, Default)]
struct EndSessionQuery {
    #[serde(default)]
    force: bool,
}

async fn delete_session(
    State(state): State<AppState>,
    AxPath(session_id): AxPath<String>,
    AppQuery(q): AppQuery<EndSessionQuery>,
) -> Result<Json<Value>, GatewayError> {
    reject_leading_dash(&session_id, "sessionId")?;
    let mut args = vec!["session".to_string(), "end".to_string(), session_id, "--json".to_string()];
    if q.force {
        args.push("--force".to_string());
    }
    let data = run_verb_blocking(state.gateway, args).await?;
    Ok(Json(data))
}

/// `/sessions/{sessionId}/slots` (D-contract): worker-slot occupancy.
/// `fgos slots` itself is not session-scoped (no such filter exists on the
/// underlying verb) — `session_id` is accepted for route-shape parity with
/// the contract but currently unused; the response is the same
/// machine-wide occupancy `fgos slots --json` reports. Narrowing this to a
/// real per-session view is future work, not a v1 gap this route can close
/// on its own (there is no session-scoped slot data to return today).
async fn get_session_slots(
    State(state): State<AppState>,
    AxPath(_session_id): AxPath<String>,
) -> Result<Json<Value>, GatewayError> {
    let args = vec!["slots".to_string(), "--json".to_string()];
    let data = run_verb_blocking(state.gateway, args).await?;
    Ok(Json(data))
}

/// `POST /v1/runner/tick`: one bounded `fgos-runner --once` cycle
/// (`bin/fgos-runner.mjs`), the headless half of 0014's orchestration scope
/// (D-contract's own `/runner/tick` doc). Deliberately a single one-shot
/// spawn with no PID persistence or crash-recovery bookkeeping — CONTEXT.md
/// D6 defers that supervision design, not the ability to trigger one bounded
/// run. `fgos-runner.mjs` resolves its own repo root from the process's
/// current working directory (not a `--dir` flag, unlike `fgos.mjs`), so
/// this spawns with `current_dir(root)` instead of appending `--dir`.
async fn post_runner_tick(State(state): State<AppState>) -> Result<Json<Value>, GatewayError> {
    let root = state.root.clone();
    let result = tokio::task::spawn_blocking(move || {
        let output = std::process::Command::new("node")
            .arg(root.join("bin/fgos-runner.mjs"))
            .arg("--once")
            .current_dir(&root)
            .stdin(Stdio::null())
            .output()
            .map_err(|err| GatewayError::unexpected(format!("spawning fgos-runner failed: {err}")))?;

        if !output.status.success() {
            let code = output.status.code().unwrap_or(1);
            let message = String::from_utf8_lossy(&output.stderr).trim().to_string();
            return Err(GatewayError {
                category: ErrorCategory::from_exit_code(code),
                message: if message.is_empty() {
                    format!("fgos-runner exited with code {code}")
                } else {
                    message
                },
                exit_code: Some(code),
            });
        }
        let stdout = String::from_utf8_lossy(&output.stdout);
        serde_json::from_str::<Value>(stdout.trim())
            .map_err(|err| GatewayError::unexpected(format!("fgos-runner returned unparseable JSON: {err}")))
    })
    .await
    .map_err(|err| GatewayError::unexpected(format!("runner task panicked: {err}")))?;
    Ok(Json(result?))
}

/// `GET /v1/contract`: serves the gateway's own OpenAPI spec verbatim, so an
/// agent can read it and self-implement a client without hand-tracking a
/// separate doc (the whole point of D10's own "real, versioned, public
/// contract" — see `docs/contracts/fgos-gateway-api-v1.yaml`). Reads the
/// file fresh on every request rather than embedding it at compile time: the
/// spec doc is edited independently of this crate (piece 1 of this feature,
/// `tsk-7l9-1`), so a request always sees whatever is actually on disk
/// rather than a stale snapshot baked into the binary. Deliberately the ONE
/// route excluded from the auth gate (see `build_router` below) — a client
/// has to be able to read the contract before it can know it needs a token
/// at all.
async fn get_contract(State(state): State<AppState>) -> Response {
    let path = state.root.join("docs/contracts/fgos-gateway-api-v1.yaml");
    match tokio::fs::read_to_string(&path).await {
        Ok(contents) => (
            StatusCode::OK,
            [(axum::http::header::CONTENT_TYPE, "application/yaml")],
            contents,
        )
            .into_response(),
        Err(err) => GatewayError::unexpected(format!(
            "could not read the OpenAPI contract at {}: {err}",
            path.display()
        ))
        .into_response(),
    }
}

/// Builds the full router. `root` is the fgOS repo root every spawned
/// `fgos <verb>` call targets (D-contract's own per-machine, per-project
/// scope note — D2: one gateway process manages every project on a
/// machine, but this v1 build wires exactly one root per process, matching
/// how `main.rs` already resolves a single `root` for the whole TUI too;
/// multi-project routing within one process is future work, not designed
/// here).
pub fn build_router(gateway: Arc<dyn VerbGateway>, config: GatewayConfig, root: PathBuf) -> Router {
    let config = Arc::new(config);
    let state = AppState {
        gateway,
        config: config.clone(),
        root,
    };

    // tsk-7l9-3: MCP surface (search/execute) mounted onto this SAME router,
    // behind the SAME auth gate the REST routes already sit behind (plan.md's
    // own Assumptions: no second auth mechanism) -- built once here so
    // `state.gateway`/`state.root` never has to be threaded through a second
    // composition path.
    let mcp_service = crate::mcp::build_mcp_service(state.gateway.clone(), state.root.clone());

    let authenticated = Router::new()
        .route("/work", get(get_work).post(post_work))
        .route("/work/{id}", get(get_work_by_id))
        .route("/work/{id}/move", post(post_work_move))
        .route("/work/{id}/ask", post(post_work_ask))
        .route("/work/{id}/answer", post(post_work_answer))
        .route("/work/{id}/take", post(post_work_take))
        .route("/work/{id}/return", post(post_work_return))
        .route("/work/{id}/approve", post(post_work_approve))
        .route("/work/{id}/reject", post(post_work_reject))
        .route("/ready", get(get_ready))
        .route("/rollup/{id}", get(get_rollup))
        .route("/graph", get(get_graph))
        .route("/state/digest", get(get_state_digest))
        .route("/sessions", post(post_sessions))
        .route("/sessions/{sessionId}", delete(delete_session))
        .route("/sessions/{sessionId}/slots", get(get_session_slots))
        .route("/runner/tick", post(post_runner_tick))
        .nest_service("/mcp", mcp_service)
        .route_layer(middleware::from_fn_with_state(state.clone(), require_token));

    Router::new()
        .route("/contract", get(get_contract))
        .merge(authenticated)
        .with_state(state)
}

/// Runs the gateway to completion (i.e. forever, until the process is
/// killed). Builds its own multi-threaded tokio runtime — the rest of
/// `herdr-fgos` (the TUI) stays fully synchronous, so only this entry point
/// pays the async-runtime startup cost (`main.rs`'s dispatch, D1: one
/// process, gateway mode chosen at launch rather than the TUI's default).
pub fn run(root: PathBuf) -> std::io::Result<()> {
    let config = load_gateway_config(None).map_err(std::io::Error::other)?;
    let addr: SocketAddr = ([127, 0, 0, 1], config.port).into();
    let gateway: Arc<dyn VerbGateway> = Arc::new(FgosCliGateway { root: root.clone() });
    let router = build_router(gateway, config, root);

    let runtime = tokio::runtime::Runtime::new()?;
    runtime.block_on(async move {
        eprintln!("fgOS gateway listening on http://{addr}/v1 (contract: http://{addr}/v1/contract)");
        let listener = tokio::net::TcpListener::bind(addr).await?;
        axum::serve(listener, router).await
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn wait_with_timeout_kills_a_process_that_outlives_the_deadline() {
        let child = std::process::Command::new("sleep")
            .arg("30")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .expect("sleep must be spawnable in the test environment");
        let result = wait_with_timeout(child, Duration::from_millis(100), Duration::from_millis(10));
        assert!(result.is_err(), "a process outliving the deadline must be reported as killed, not waited on forever");
    }

    #[test]
    fn wait_with_timeout_returns_real_output_when_the_process_finishes_in_time() {
        let child = std::process::Command::new("printf")
            .arg("hello")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .expect("printf must be spawnable in the test environment");
        let (status, stdout, _stderr) =
            wait_with_timeout(child, Duration::from_secs(5), Duration::from_millis(10))
                .expect("a process finishing well before the deadline must not be treated as timed out");
        assert!(status.success());
        assert_eq!(stdout, b"hello");
    }

    struct FakeGateway {
        response: Result<Value, String>,
    }

    impl VerbGateway for FakeGateway {
        fn run_verb(&self, _args: &[String]) -> Result<Value, GatewayError> {
            match &self.response {
                Ok(v) => Ok(v.clone()),
                Err(msg) => Err(GatewayError::validation(msg.clone())),
            }
        }
    }

    fn test_config() -> GatewayConfig {
        GatewayConfig {
            port: 0,
            token: "test-token".to_string(),
        }
    }

    #[test]
    fn error_category_round_trips_known_exit_codes() {
        assert_eq!(ErrorCategory::from_exit_code(2).as_str(), "precondition");
        assert_eq!(ErrorCategory::from_exit_code(3).as_str(), "conflict");
        assert_eq!(ErrorCategory::from_exit_code(4).as_str(), "validation");
        assert_eq!(ErrorCategory::from_exit_code(5).as_str(), "corrupt-log");
        assert_eq!(ErrorCategory::from_exit_code(6).as_str(), "busy");
        assert_eq!(ErrorCategory::from_exit_code(7).as_str(), "lock-timeout");
        assert_eq!(ErrorCategory::from_exit_code(8).as_str(), "session-fail");
        assert_eq!(ErrorCategory::from_exit_code(9).as_str(), "merge-fail");
        assert_eq!(ErrorCategory::from_exit_code(1).as_str(), "unexpected");
        assert_eq!(ErrorCategory::from_exit_code(42).as_str(), "unexpected");
    }

    #[test]
    fn reject_leading_dash_rejects_only_a_leading_dash() {
        assert!(reject_leading_dash("-x", "id").is_err());
        assert!(reject_leading_dash("--force", "id").is_err());
        assert!(reject_leading_dash("tsk-123", "id").is_ok(), "a real id contains dashes, just not a LEADING one");
        assert!(reject_leading_dash("human", "role").is_ok());
        assert!(reject_leading_dash("", "cursor").is_ok(), "an empty value is the caller's own absent-field sentinel, not a dash");
    }

    #[tokio::test]
    async fn a_dash_prefixed_id_is_rejected_before_it_ever_reaches_the_verb_chokepoint() {
        let gateway: Arc<dyn VerbGateway> = Arc::new(FakeGateway { response: Ok(json!({"ok": true})) });
        let app = build_router(gateway, test_config(), PathBuf::from("/tmp"));

        use axum::body::Body;
        use axum::http::Request;
        use tower::ServiceExt;

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/work/--force")
                    .header(axum::http::header::AUTHORIZATION, "Bearer test-token")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(
            response.status(),
            StatusCode::BAD_REQUEST,
            "a dash-prefixed id must be refused as validation, never reach spawn_fgos_verb where it could be misread as a flag"
        );
    }

    #[test]
    fn constant_time_eq_matches_only_identical_bytes() {
        assert!(constant_time_eq(b"abc", b"abc"));
        assert!(!constant_time_eq(b"abc", b"abd"));
        assert!(!constant_time_eq(b"abc", b"ab"));
        assert!(!constant_time_eq(b"", b"x"));
        assert!(constant_time_eq(b"", b""));
    }

    #[tokio::test]
    async fn unauthenticated_request_to_a_gated_route_is_rejected() {
        let gateway: Arc<dyn VerbGateway> = Arc::new(FakeGateway { response: Ok(json!({"ok": true})) });
        let app = build_router(gateway, test_config(), PathBuf::from("/tmp"));

        use axum::body::Body;
        use axum::http::Request;
        use tower::ServiceExt;

        let response = app
            .oneshot(Request::builder().uri("/ready").body(Body::empty()).unwrap())
            .await
            .unwrap();
        // tsk-4qf: 401, not the category table's own 400 -- a distinct
        // HTTP-layer auth signal, see require_token's own comment.
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    async fn authenticated_request_reaches_the_verb_chokepoint() {
        let gateway: Arc<dyn VerbGateway> = Arc::new(FakeGateway { response: Ok(json!({"contract": "fgos.v1", "data": {"work": {}}})) });
        let app = build_router(gateway, test_config(), PathBuf::from("/tmp"));

        use axum::body::Body;
        use axum::http::Request;
        use tower::ServiceExt;

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/ready")
                    .header(axum::http::header::AUTHORIZATION, "Bearer test-token")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn gateway_error_maps_verb_failure_to_its_category_and_status() {
        let gateway: Arc<dyn VerbGateway> = Arc::new(FakeGateway { response: Err("bad input".to_string()) });
        let app = build_router(gateway, test_config(), PathBuf::from("/tmp"));

        use axum::body::Body;
        use axum::http::Request;
        use tower::ServiceExt;

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/ready")
                    .header(axum::http::header::AUTHORIZATION, "Bearer test-token")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn a_malformed_json_body_returns_the_same_error_envelope_every_other_error_uses() {
        let gateway: Arc<dyn VerbGateway> = Arc::new(FakeGateway { response: Ok(json!({"ok": true})) });
        let app = build_router(gateway, test_config(), PathBuf::from("/tmp"));

        use axum::body::Body;
        use axum::http::Request;
        use tower::ServiceExt;

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/work")
                    .header(axum::http::header::AUTHORIZATION, "Bearer test-token")
                    .header(axum::http::header::CONTENT_TYPE, "application/json")
                    .body(Body::from("{not valid json"))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let parsed: Value = serde_json::from_slice(&body).expect(
            "a malformed request body must still get the JSON ErrorEnvelope, never axum's own plain-text rejection",
        );
        assert!(parsed.get("category").is_some(), "expected an ErrorEnvelope-shaped body, got: {parsed}");
    }

    #[tokio::test]
    async fn a_malformed_query_string_returns_the_same_error_envelope_every_other_error_uses() {
        let gateway: Arc<dyn VerbGateway> = Arc::new(FakeGateway { response: Ok(json!({"ok": true})) });
        let app = build_router(gateway, test_config(), PathBuf::from("/tmp"));

        use axum::body::Body;
        use axum::http::Request;
        use tower::ServiceExt;

        // `limit` is typed `u32` in `ListWorkQuery` -- a non-numeric value
        // is what QueryRejection actually rejects on.
        let response = app
            .oneshot(
                Request::builder()
                    .uri("/work?limit=not-a-number")
                    .header(axum::http::header::AUTHORIZATION, "Bearer test-token")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let parsed: Value = serde_json::from_slice(&body).expect(
            "a malformed query string must still get the JSON ErrorEnvelope, never axum's own plain-text rejection",
        );
        assert!(parsed.get("category").is_some(), "expected an ErrorEnvelope-shaped body, got: {parsed}");
    }

    #[tokio::test]
    async fn contract_route_is_reachable_without_a_token() {
        let gateway: Arc<dyn VerbGateway> = Arc::new(FakeGateway { response: Ok(json!({})) });
        let root = std::env::temp_dir().join(format!("fgos-gateway-test-{}", std::process::id()));
        std::fs::create_dir_all(root.join("docs/contracts")).unwrap();
        std::fs::write(root.join("docs/contracts/fgos-gateway-api-v1.yaml"), "openapi: 3.1.0\n").unwrap();
        let app = build_router(gateway, test_config(), root.clone());

        use axum::body::Body;
        use axum::http::Request;
        use tower::ServiceExt;

        let response = app
            .oneshot(Request::builder().uri("/contract").body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        std::fs::remove_dir_all(&root).ok();
    }

    /// tsk-7l9-3: proves the MCP transport (`mcp.rs::build_mcp_service`) is
    /// actually mounted on THIS router (not just exercised in isolation by
    /// `mcp::tests`) and sits behind the SAME auth gate the REST routes do
    /// (plan.md's own Assumption: no second auth mechanism).
    #[tokio::test]
    async fn mcp_route_is_mounted_on_the_same_router_and_gated_by_the_same_token() {
        use axum::body::Body;
        use axum::http::Request;
        use tower::ServiceExt;

        let unauth_gateway: Arc<dyn VerbGateway> = Arc::new(FakeGateway { response: Ok(json!({})) });
        let unauth_app = build_router(unauth_gateway, test_config(), PathBuf::from("/tmp"));
        let response = unauth_app
            .oneshot(Request::builder().method("POST").uri("/mcp").body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(
            response.status(),
            StatusCode::UNAUTHORIZED,
            "unauthenticated /mcp must be blocked by the same require_token gate as every other route"
        );

        let auth_gateway: Arc<dyn VerbGateway> = Arc::new(FakeGateway { response: Ok(json!({})) });
        let auth_app = build_router(auth_gateway, test_config(), PathBuf::from("/tmp"));
        let response = auth_app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/mcp")
                    .header(axum::http::header::AUTHORIZATION, "Bearer test-token")
                    .header(axum::http::header::CONTENT_TYPE, "application/json")
                    .header("Mcp-Protocol-Version", "2025-06-18")
                    .header(axum::http::header::ACCEPT, "application/json, text/event-stream")
                    .body(Body::from(
                        r#"{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"0"}}}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_ne!(
            response.status(),
            StatusCode::NOT_FOUND,
            "an authenticated request to /mcp must reach the MCP transport, proving it is actually mounted"
        );
    }
}
