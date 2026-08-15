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
use std::net::{IpAddr, Ipv4Addr, SocketAddr};
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
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::{ServeDir, ServeFile};
use serde_json::{json, Value};

use crate::ports::VerbGateway;

/// Default listening port — same default `docs/contracts/fgos-gateway-api-v1.yaml`'s
/// `servers.variables.port` documents.
const DEFAULT_PORT: u16 = 4170;

/// D7 of `docs/history/herdr-web-dashboard/CONTEXT.md`: bind mặc định
/// `0.0.0.0` (reachable from other machines on a LAN/Tailscale), cấu hình
/// được, cảnh báo khi không phải loopback (see `run`, below).
const DEFAULT_BIND: IpAddr = IpAddr::V4(Ipv4Addr::UNSPECIFIED);

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
    bind: Option<String>,
    // tsk-6arn (D8): both must be present together for cf-access to be
    // considered configured -- see `load_gateway_config`'s own partial-
    // config guard.
    #[serde(rename = "cfAccessTeamDomain")]
    cf_access_team_domain: Option<String>,
    #[serde(rename = "cfAccessAud")]
    cf_access_aud: Option<String>,
}

#[derive(Debug, Clone)]
pub struct GatewayConfig {
    pub port: u16,
    pub token: String,
    pub bind: IpAddr,
    // tsk-6arn: `Arc` (not a bare `Option<CfAccessVerifier>`) so
    // `GatewayConfig` stays cheaply `Clone` -- matches how `AppState`
    // already holds this whole struct behind an `Arc` on `build_router`'s
    // own state, but keeps `GatewayConfig` itself trivially cloneable
    // for tests that build one directly (`test_config()`).
    pub cf_access: Arc<Option<crate::cf_access::CfAccessVerifier>>,
}

#[derive(Debug)]
pub enum GatewayConfigError {
    NoHomeDir,
    NotFound(PathBuf),
    Io(PathBuf, std::io::Error),
    Parse(PathBuf, serde_json::Error),
    MissingToken(PathBuf),
    InvalidBind(PathBuf, String),
    PartialCfAccess(PathBuf),
}

impl std::error::Error for GatewayConfigError {}

impl std::fmt::Display for GatewayConfigError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            GatewayConfigError::NoHomeDir => write!(f, "could not resolve $HOME to locate ~/.fgos/config.json"),
            GatewayConfigError::NotFound(p) => write!(
                f,
                "{} not found — the gateway needs a per-machine auth token (D4). Run \"fgos setup\" to create it, then \"fgos doctor --fix\" to generate and write a real token (tsk-4r1: both are now registered in the setup/doctor gate).",
                p.display()
            ),
            GatewayConfigError::Io(p, err) => write!(f, "could not read {}: {err}", p.display()),
            GatewayConfigError::Parse(p, err) => write!(f, "could not parse {} as JSON: {err}", p.display()),
            GatewayConfigError::MissingToken(p) => write!(
                f,
                "{} has no \"gateway.token\" field — the gateway needs a per-machine auth token (D4). Run \"fgos doctor --fix\" to generate and write one (tsk-4r1).",
                p.display()
            ),
            GatewayConfigError::InvalidBind(p, raw) => write!(
                f,
                "{} has a \"gateway.bind\" value ({raw:?}) that is not a valid IP address — expected e.g. \"0.0.0.0\" or \"127.0.0.1\".",
                p.display()
            ),
            GatewayConfigError::PartialCfAccess(p) => write!(
                f,
                "{} has only one of \"gateway.cfAccessTeamDomain\"/\"gateway.cfAccessAud\" set (tsk-6arn, D8) — both are required together for cf-access to be configured, or neither.",
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
    let bind = match section.bind {
        Some(raw) => raw
            .parse::<IpAddr>()
            .map_err(|_| GatewayConfigError::InvalidBind(config_path.clone(), raw))?,
        None => DEFAULT_BIND,
    };
    // tsk-6arn (D8): additive layer-2 credential, configured only when
    // BOTH fields are present -- exactly one set is a real misconfiguration
    // (a person who set one almost certainly meant both), not silently
    // treated as "cf-access off".
    let cf_access = match (section.cf_access_team_domain, section.cf_access_aud) {
        (Some(team_domain), Some(aud)) => {
            Some(crate::cf_access::CfAccessVerifier::new(reqwest::Client::new(), team_domain, aud))
        }
        (None, None) => None,
        (Some(_), None) | (None, Some(_)) => return Err(GatewayConfigError::PartialCfAccess(config_path)),
    };
    Ok(GatewayConfig {
        port: section.port.unwrap_or(DEFAULT_PORT),
        token,
        bind,
        cf_access: Arc::new(cf_access),
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

/// tsk-og6: builds the exact `Command` `spawn_fgos_verb` runs, split out so
/// its `current_dir` is directly testable (`Command::get_current_dir`)
/// without spawning a real `node` process. `--dir <root>` alone is not
/// enough — `session start/end/list/gc` and `move --to delivered`'s
/// unmerged-branch guard both resolve their own repo root from
/// `process.cwd()` instead of reading `--dir` (`bin/fgos.mjs:4559,1497`),
/// so the spawned child's OWN working directory has to agree with `root`
/// too, or those two verbs silently act on wherever the gateway process
/// happened to be launched from.
fn build_fgos_command(root: &Path, args: &[String]) -> std::process::Command {
    let mut cmd_args: Vec<String> = vec![root.join("bin/fgos.mjs").to_string_lossy().to_string()];
    cmd_args.extend(args.iter().cloned());
    cmd_args.push("--dir".to_string());
    cmd_args.push(root.to_string_lossy().to_string());

    let mut cmd = std::process::Command::new("node");
    cmd.args(&cmd_args).current_dir(root).stdin(Stdio::null());
    cmd
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
    // tsk-og6 + tsk-4lf combined: build_fgos_command's own current_dir(root)
    // still applies to the piped/spawned child wait_with_timeout needs --
    // current_dir and the timeout wrapper are orthogonal, both required.
    let child = build_fgos_command(root, args)
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
    let bearer_ok = headers
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .is_some_and(|token| constant_time_eq(token.as_bytes(), state.config.token.as_bytes()));
    if bearer_ok {
        return next.run(request).await;
    }

    // tsk-6arn (D8): cf-access is an ADDITIVE alternate credential,
    // checked only when Bearer did not already pass and the operator has
    // configured it (`state.config.cf_access` is `Some`). Any failure
    // here -- verifier absent, header absent, signature/claims invalid --
    // falls through to the SAME 401 below; cf-access never gets its own,
    // different failure response.
    if let Some(verifier) = state.config.cf_access.as_ref() {
        if let Some(assertion) = headers.get("Cf-Access-Jwt-Assertion").and_then(|v| v.to_str().ok()) {
            if verifier.verify(assertion).await.is_ok() {
                return next.run(request).await;
            }
        }
    }

    // tsk-4qf: 401, not category's own 400 -- gives a client a
    // distinct HTTP-layer auth signal (D7 forbids a new `category`
    // value, so the JSON body's `category` field stays "validation";
    // the status code alone carries the distinction). cf-access shares
    // this SAME status/category rather than reintroducing the "404 câm"
    // framing tsk-18to's original description carried from a cookie-
    // session design (tsk-k4v) that never shipped (tsk-6arn RESEARCH.md).
    GatewayError {
        category: ErrorCategory::Validation,
        message: "missing or invalid Authorization: Bearer <token> (D4: one token per machine, see ~/.fgos/config.json's \"gateway.token\") -- or a valid Cf-Access-Jwt-Assertion, when cf-access is configured (D8)".to_string(),
        exit_code: None,
    }
    .into_response_with_status(StatusCode::UNAUTHORIZED)
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

/// tsk-41h: `PATCH /work/{id}` — partial update, matching `fgos edit`'s own
/// partial-update semantics (only fields present in the body change,
/// per D1 of docs/history/herdr-web-dashboard-plan-realignment/CONTEXT.md
/// — PATCH over PUT because PUT implies a full-resource replace this
/// endpoint never does). Accepts any subset of `src/state/store.mjs`'s
/// `EDITABLE_FIELDS` (21 entries, read directly from that file rather than
/// re-guessed) as a raw JSON object rather than a typed struct per field:
/// a field this handler does not recognize is silently dropped, mirroring
/// `bin/fgos.mjs`'s own `edit` case, which never errors on an unrecognized
/// flag either — this handler translates, it does not validate (R2 of the
/// area spec: validation stays at the engine, never re-implemented at a
/// client-facing layer; `fgos edit`'s own real rejection — including "no
/// field changed" — reaches the caller verbatim through the same
/// `run_verb_blocking`/`GatewayError` path every other write route uses).
async fn patch_work(
    State(state): State<AppState>,
    AxPath(id): AxPath<String>,
    AppJson(body): AppJson<serde_json::Map<String, Value>>,
) -> Result<Json<Value>, GatewayError> {
    reject_leading_dash(&id, "id")?;
    let mut args = vec!["edit".to_string(), id];

    // Plain string fields -- `bin/fgos.mjs`'s own same-name pass-through
    // loop (title/description/kind/risk/verify/tier), plus the fields it
    // handles in their own one-off blocks for the same reason (kebab flag
    // name vs camelCase JSON key): docs-ref, parent, superseded-by,
    // goal-tier. Every one is enum/id/short-text shaped, so the same
    // leading-dash guard the rest of this file already applies to
    // similarly-shaped fields (`to`, `expect`, `status`, `stage`) applies
    // here too -- title/description are the only borderline cases, kept
    // guarded for consistency rather than carved out like `text`/`reason`
    // (tsk-1ah's own exemption is for genuinely long free text, not a
    // one-line title).
    for (json_key, flag) in [
        ("title", "--title"),
        ("description", "--description"),
        ("kind", "--kind"),
        ("risk", "--risk"),
        ("verify", "--verify"),
        ("tier", "--tier"),
        // `urgent` reads as boolean-shaped from its name, but the engine
        // treats it as a string enum (`work.mjs`'s own real vocabulary:
        // "low"/"medium"/"high"/"critical", confirmed by a live `fgos
        // edit --urgent` smoke test at Execute -- `true` was REJECTED by
        // the engine: "work.urgent must be one of [...] when present, got:
        // true"). It shares this same plain pass-through shape with
        // title/kind/risk/tier above on the CLI's own side
        // (`bin/fgos.mjs`'s same-name loop), so it belongs here, not in a
        // bespoke boolean branch.
        ("urgent", "--urgent"),
        ("docsRef", "--docs-ref"),
        ("parent", "--parent"),
        ("supersededBy", "--superseded-by"),
        ("goalTier", "--goal-tier"),
    ] {
        if let Some(value) = body.get(json_key) {
            let Some(s) = value.as_str() else {
                return Err(GatewayError::validation(format!("\"{json_key}\" must be a string")));
            };
            reject_leading_dash(s, json_key)?;
            args.push(flag.to_string());
            args.push(s.to_string());
        }
    }

    // List fields -- comma-separated, matching `parseListFlag`'s own
    // shape (`bin/fgos.mjs:379-385`). Each element is guarded the same
    // way a scalar field above is; a comma embedded in one element would
    // silently re-split it on the CLI side, so this handler refuses that
    // up front rather than producing a patch that saves something
    // different from what was sent.
    for (json_key, flag) in [
        ("refs", "--refs"),
        ("deps", "--deps"),
        ("footprint", "--footprint"),
        ("mergeAfter", "--merge-after"),
        ("duplicates", "--duplicates"),
    ] {
        if let Some(value) = body.get(json_key) {
            let Some(items) = value.as_array() else {
                return Err(GatewayError::validation(format!("\"{json_key}\" must be an array of strings")));
            };
            let mut parts = Vec::with_capacity(items.len());
            for item in items {
                let Some(s) = item.as_str() else {
                    return Err(GatewayError::validation(format!("\"{json_key}\" must be an array of strings")));
                };
                reject_leading_dash(s, json_key)?;
                if s.contains(',') {
                    return Err(GatewayError::validation(format!(
                        "\"{json_key}\" elements must not contain \",\" -- the underlying CLI flag is comma-separated"
                    )));
                }
                parts.push(s.to_string());
            }
            args.push(flag.to_string());
            args.push(parts.join(","));
        }
    }

    // JSON-encoded fields -- `parseAcceptanceFlag`'s own shape
    // (`bin/fgos.mjs:395-405`): the CLI flag carries the value as a
    // JSON-encoded STRING (re-parsed on the other side), because clause
    // text/domain field values may contain commas that would corrupt the
    // comma-separated list shape above.
    for (json_key, flag) in [("acceptance", "--acceptance"), ("domainFields", "--domain-fields")] {
        if let Some(value) = body.get(json_key) {
            args.push(flag.to_string());
            args.push(value.to_string());
        }
    }

    // Numeric fields -- `priority`/`intent` (integers) and
    // `impact`/`effort` (numbers, may be fractional composite scores),
    // `bin/fgos.mjs:1826-1861`.
    for (json_key, flag) in [("priority", "--priority"), ("intent", "--intent"), ("impact", "--impact"), ("effort", "--effort")]
    {
        if let Some(value) = body.get(json_key) {
            let Some(n) = value.as_f64() else {
                return Err(GatewayError::validation(format!("\"{json_key}\" must be a number")));
            };
            args.push(flag.to_string());
            args.push(n.to_string());
        }
    }

    args.push("--json".to_string());
    let data = run_verb_blocking(state.gateway, args).await?;
    Ok(Json(data))
}

/// tsk-4id: `GET /work/{id}/docs` -- the item's `docsRef` narrative
/// (`CONTEXT.md`/`plan.md` content), the SOURCE the task-detail screen's
/// own "what the agent did" block must read from (D3 of docs/history/
/// herdr-web-dashboard/CONTEXT.md: CONTEXT.md/plan.md is the primary
/// account, `decisions[]` is expandable detail only). This did not exist
/// before this item: a browser client has no filesystem access, and no
/// other route in this file ever reads an arbitrary repo file -- the
/// gap this handler closes is real, not decorative (confirmed: `rg
/// 'docsRef'` across every existing route returns only the field passing
/// through `show`'s own JSON as a bare path STRING, never its content).
///
/// `docsRef` is untrusted input (an item's own field, editable via
/// `tsk-41h`'s `PATCH /work/{id}` among other paths) -- canonicalized and
/// checked to still resolve under `<root>/docs/history/` before any read,
/// the same directory every `docsRef` in this repo's own convention
/// already points into (confirmed: every real `docsRef` value observed
/// this session, e.g. `docs/history/<feature>/`, shares this prefix).
/// `..`/absolute-path/symlink escapes are all caught by canonicalizing
/// AFTER joining, not by string-matching the raw value.
async fn get_work_docs(State(state): State<AppState>, AxPath(id): AxPath<String>) -> Result<Json<Value>, GatewayError> {
    reject_leading_dash(&id, "id")?;
    let args = vec!["show".to_string(), id, "--json".to_string()];
    let envelope = run_verb_blocking(state.gateway, args).await?;
    // `envelope` is the FULL `{contract, generated_at, data_hash, data}`
    // shape `run_verb_blocking` always returns (CTR001 envelope reuse) --
    // `docsRef` lives at `envelope.data.work.docsRef`, not `envelope.work`.
    let docs_ref = envelope
        .get("data")
        .and_then(|d| d.get("work"))
        .and_then(|w| w.get("docsRef"))
        .and_then(Value::as_str);

    // Re-stamp this route's own custom `data` shape onto the SAME
    // contract/generated_at/data_hash the underlying `show` call already
    // produced -- same pattern `get_state_digest` already uses for a
    // hand-built response.
    let stamp = |data: Value| {
        json!({
            "contract": envelope.get("contract").cloned().unwrap_or(json!("fgos.v1")),
            "generated_at": envelope.get("generated_at").cloned().unwrap_or(Value::Null),
            "data_hash": envelope.get("data_hash").cloned().unwrap_or(Value::Null),
            "data": data,
        })
    };

    let Some(docs_ref) = docs_ref else {
        return Ok(Json(stamp(json!({ "docsRef": null, "contextMd": null, "planMd": null }))));
    };

    let docs_history_root = state
        .root
        .join("docs")
        .join("history")
        .canonicalize()
        .map_err(|err| GatewayError::unexpected(format!("could not resolve docs/history/: {err}")))?;

    let candidate = state.root.join(docs_ref);
    let resolved = match candidate.canonicalize() {
        Ok(p) => p,
        // A docsRef naming a directory that does not exist on this
        // machine is a real, expected case (area spec Edge Cases: "An
        // item whose narrative source is missing... shown without its
        // narrative rather than failing"), not a traversal attempt.
        Err(_) => {
            return Ok(Json(stamp(
                json!({ "docsRef": docs_ref, "contextMd": null, "planMd": null, "narrativeMissing": true }),
            )));
        }
    };
    if !resolved.starts_with(&docs_history_root) {
        return Err(GatewayError::validation(
            "docsRef must resolve inside docs/history/ -- refused (tsk-4id, path-traversal guard)",
        ));
    }

    let read_optional = |name: &str| -> Option<String> { std::fs::read_to_string(resolved.join(name)).ok() };

    Ok(Json(stamp(json!({
        "docsRef": docs_ref,
        "contextMd": read_optional("CONTEXT.md"),
        "planMd": read_optional("plan.md"),
    }))))
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
        .route("/work/{id}", get(get_work_by_id).patch(patch_work))
        .route("/work/{id}/docs", get(get_work_docs))
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

    // tsk-4uh: the contract's `servers.url` (docs/contracts/fgos-gateway-
    // api-v1.yaml:54-59) and this file's own startup log (`run`, below) both
    // already advertise `/v1` -- nesting the whole api router (contract +
    // authenticated together) under it here is what makes the code agree
    // with both instead of being the lone outlier. Nesting is pure path
    // prefixing (no layer is added or removed by `.nest`), so `/contract`
    // keeps sitting outside `authenticated`'s `require_token` layer exactly
    // as before, just reachable at `/v1/contract` instead of `/contract`.
    let api = Router::new()
        .route("/contract", get(get_contract))
        .merge(authenticated);

    // tsk-54y: the web client is a static bundle independent of this
    // gateway's own origin (D2 of docs/history/herdr-web-dashboard-plan-
    // realignment/CONTEXT.md), so cross-origin requests must be allowed.
    // Wildcard is safe here: D13 of the same CONTEXT.md locks
    // `Authorization: Bearer` (never a cookie), so there is no
    // credentialed request for a wildcard `Access-Control-Allow-Origin` to
    // put at risk the way it would for a cookie-based scheme.
    let cors = CorsLayer::new().allow_origin(Any).allow_methods(Any).allow_headers(Any);

    Router::new().nest("/v1", api).with_state(state).layer(cors)
}

/// tsk-48w (D14): `herdr-plugin/web`'s built bundle, embedded into the
/// binary at compile time. `herdr-plugin/build.rs` guarantees `static/`
/// exists even before `npm run bundle` has run, so this derive never
/// fails `cargo build`/`test`/`clippy` on a fresh checkout -- it just
/// embeds an empty directory until the bundle exists. `debug-embed`
/// forces real embedding in every profile (not just `--release`), same
/// choice the reference implementation herdr-gateway makes
/// (`herdr-gateway/src/web/mod.rs:28`) and for the same reason: a debug
/// build must be able to prove serving works, not just a release one.
#[derive(rust_embed::RustEmbed, Clone)]
#[folder = "static/"]
struct WebAssets;

/// tsk-48w (D14): wraps an already-built [`Router`] with the web
/// dashboard's static-serving fallback, gated by `enabled` (the
/// `herdrWebDashboard.staticServing` toggle, `settings::
/// read_web_dashboard_settings`). Deliberately NOT a `build_router`
/// parameter -- `build_router` already has 9+ existing tests (CORS, auth,
/// error-envelope behavior) that never touch this fallback; wrapping
/// keeps their blast radius at zero instead of forcing every one of them
/// to learn a new argument to reach code they don't exercise.
///
/// When `enabled` is `false`, `router` is returned unchanged -- an
/// unmatched route still gets axum's own default empty-body 404 (no
/// `.fallback()` was set on `build_router`'s own output before this
/// wrapper existed; confirmed by reading `build_router` directly, not
/// assumed). When `true`:
/// an on-disk `<static_dir>/index.html` (dev override, e.g. `vite`'s dev
/// build copied next to the binary) takes priority over the embedded
/// bundle; otherwise the compiled-in [`WebAssets`] serves. Both branches
/// SPA-fallback an unmatched path to `index.html` with 200, matching the
/// reference implementation's own router (`herdr-gateway/src/web/mod.rs:
/// 97-113`) this is ported from. The fallback only ever catches a route
/// `build_router`'s own `/v1/*` tree did NOT match -- every `/v1/*` route
/// keeps its existing `require_token` gate untouched, since `.nest("/v1",
/// ...)` inside `build_router` already claims that whole prefix before
/// this fallback is ever consulted.
pub fn with_static_serving(router: Router, enabled: bool, static_dir: &Path) -> Router {
    if !enabled {
        return router;
    }
    let index = static_dir.join("index.html");
    if index.exists() {
        let spa = ServeDir::new(static_dir).fallback(ServeFile::new(index));
        router.fallback_service(spa)
    } else {
        let embedded = axum_embed::ServeEmbed::<WebAssets>::with_parameters(
            Some("index.html".to_string()),
            axum_embed::FallbackBehavior::Ok,
            Some("index.html".to_string()),
        );
        router.fallback_service(embedded)
    }
}

/// Runs the gateway to completion (i.e. forever, until the process is
/// killed). Builds its own multi-threaded tokio runtime — the rest of
/// `herdr-fgos` (the TUI) stays fully synchronous, so only this entry point
/// pays the async-runtime startup cost (`main.rs`'s dispatch, D1: one
/// process, gateway mode chosen at launch rather than the TUI's default).
pub fn run(root: PathBuf) -> std::io::Result<()> {
    let config = load_gateway_config(None).map_err(std::io::Error::other)?;
    // D7: warn, don't refuse, when the resolved bind is not loopback --
    // this is the intended LAN/Tailscale-reachable default (DEFAULT_BIND),
    // not a misconfiguration. `eprintln!` matches this function's own
    // existing startup-log idiom below rather than introducing a logging
    // crate this binary does not otherwise depend on.
    if !config.bind.is_loopback() {
        eprintln!(
            "warning: fgOS gateway binding to a non-loopback address ({}) — reachable from other machines on this network",
            config.bind
        );
    }
    let addr: SocketAddr = (config.bind, config.port).into();
    let gateway: Arc<dyn VerbGateway> = Arc::new(FgosCliGateway { root: root.clone() });
    // tsk-48w (D14): static-serving toggle read from the SAME shared
    // config file `load_gateway_config` already reads (`~/.fgos/
    // config.json`'s sibling section `herdrWebDashboard`), fail-open
    // default per `settings::WebDashboardSettings`'s own doc comment.
    let web_settings = crate::settings::read_web_dashboard_settings(&root);
    let router = build_router(gateway, config, root);
    let router = with_static_serving(router, web_settings.static_serving, Path::new("static"));

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
    fn build_fgos_command_runs_in_root_not_the_ambient_process_cwd() {
        let root = PathBuf::from("/tmp/fgos-gateway-test-root");
        let cmd = build_fgos_command(&root, &["list".to_string()]);
        assert_eq!(cmd.get_current_dir(), Some(root.as_path()));
    }

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

    /// tsk-41h: captures the real args `patch_work` builds, so tests can
    /// assert the exact `fgos edit` CLI invocation this route translates
    /// to -- `FakeGateway` above only proves a response shape, never what
    /// was actually sent.
    struct CapturingGateway {
        captured: std::sync::Mutex<Vec<Vec<String>>>,
        response: Value,
    }

    impl VerbGateway for CapturingGateway {
        fn run_verb(&self, args: &[String]) -> Result<Value, GatewayError> {
            self.captured.lock().unwrap().push(args.to_vec());
            Ok(self.response.clone())
        }
    }

    fn test_config() -> GatewayConfig {
        GatewayConfig {
            port: 0,
            token: "test-token".to_string(),
            bind: IpAddr::V4(Ipv4Addr::LOCALHOST),
            cf_access: Arc::new(None),
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
                    .uri("/v1/work/--force")
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
            .oneshot(Request::builder().uri("/v1/ready").body(Body::empty()).unwrap())
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
                    .uri("/v1/ready")
                    .header(axum::http::header::AUTHORIZATION, "Bearer test-token")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
    }

    // tsk-6arn: cf-access wiring in `require_token` -- additive to Bearer,
    // never a replacement (D8).

    fn config_with_cf_access(verifier: crate::cf_access::CfAccessVerifier) -> GatewayConfig {
        let mut config = test_config();
        config.cf_access = Arc::new(Some(verifier));
        config
    }

    #[tokio::test]
    async fn cf_access_valid_assertion_is_accepted_when_bearer_is_absent() {
        let (verifier, token) = crate::cf_access::test_verifier_with_valid_token();
        let gateway: Arc<dyn VerbGateway> = Arc::new(FakeGateway { response: Ok(json!({"contract": "fgos.v1", "data": {"items": []}})) });
        let app = build_router(gateway, config_with_cf_access(verifier), PathBuf::from("/tmp"));

        use axum::body::Body;
        use axum::http::Request;
        use tower::ServiceExt;

        let response = app
            .oneshot(Request::builder().uri("/v1/ready").header("Cf-Access-Jwt-Assertion", token).body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn cf_access_invalid_assertion_still_returns_401_same_as_missing_bearer() {
        let (verifier, _valid_token) = crate::cf_access::test_verifier_with_valid_token();
        let gateway: Arc<dyn VerbGateway> = Arc::new(FakeGateway { response: Ok(json!({"ok": true})) });
        let app = build_router(gateway, config_with_cf_access(verifier), PathBuf::from("/tmp"));

        use axum::body::Body;
        use axum::http::Request;
        use tower::ServiceExt;

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/v1/ready")
                    .header("Cf-Access-Jwt-Assertion", "not-a-real-jwt")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    async fn cf_access_header_is_ignored_entirely_when_not_configured() {
        // Existing behavior (Bearer-only, D13) must be completely
        // unaffected for every deployment that never sets cf-access --
        // test_config()'s own cf_access is None.
        let (_verifier, token) = crate::cf_access::test_verifier_with_valid_token();
        let gateway: Arc<dyn VerbGateway> = Arc::new(FakeGateway { response: Ok(json!({"ok": true})) });
        let app = build_router(gateway, test_config(), PathBuf::from("/tmp"));

        use axum::body::Body;
        use axum::http::Request;
        use tower::ServiceExt;

        let response = app
            .oneshot(Request::builder().uri("/v1/ready").header("Cf-Access-Jwt-Assertion", token).body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED, "a real, valid CF token must still be rejected when cf-access is not configured");
    }

    #[tokio::test]
    async fn bearer_still_works_when_cf_access_is_also_configured() {
        let (verifier, _cf_token) = crate::cf_access::test_verifier_with_valid_token();
        let gateway: Arc<dyn VerbGateway> = Arc::new(FakeGateway { response: Ok(json!({"contract": "fgos.v1", "data": {"items": []}})) });
        let app = build_router(gateway, config_with_cf_access(verifier), PathBuf::from("/tmp"));

        use axum::body::Body;
        use axum::http::Request;
        use tower::ServiceExt;

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/v1/ready")
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
                    .uri("/v1/ready")
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
                    .uri("/v1/work")
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
                    .uri("/v1/work?limit=not-a-number")
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
            .oneshot(Request::builder().uri("/v1/contract").body(Body::empty()).unwrap())
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
            .oneshot(Request::builder().method("POST").uri("/v1/mcp").body(Body::empty()).unwrap())
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
                    .uri("/v1/mcp")
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

    fn write_test_home_config(home: &Path, extra_json: &str) {
        std::fs::create_dir_all(home.join(".fgos")).unwrap();
        std::fs::write(
            home.join(".fgos").join("config.json"),
            format!(r#"{{"gateway":{{"token":"test-token"{extra_json}}}}}"#),
        )
        .unwrap();
    }

    /// tsk-54y (D7): a `~/.fgos/config.json` with no `gateway.bind` field
    /// must resolve to the locked default (`0.0.0.0`, reachable from other
    /// machines), not the old hardcoded loopback-only behavior.
    #[test]
    fn load_gateway_config_resolves_default_bind_when_absent() {
        let home = std::env::temp_dir().join(format!("fgos-gateway-bind-default-{}", std::process::id()));
        write_test_home_config(&home, "");
        let config = load_gateway_config(Some(&home)).expect("a token-only config must still load");
        assert_eq!(config.bind, IpAddr::V4(Ipv4Addr::UNSPECIFIED));
        std::fs::remove_dir_all(&home).ok();
    }

    /// tsk-54y (D7): an explicit `gateway.bind` overrides the default.
    #[test]
    fn load_gateway_config_resolves_explicit_bind_override() {
        let home = std::env::temp_dir().join(format!("fgos-gateway-bind-override-{}", std::process::id()));
        write_test_home_config(&home, r#","bind":"127.0.0.1""#);
        let config = load_gateway_config(Some(&home)).expect("a valid bind override must load");
        assert_eq!(config.bind, IpAddr::V4(Ipv4Addr::LOCALHOST));
        std::fs::remove_dir_all(&home).ok();
    }

    /// tsk-54y: a malformed `gateway.bind` is a typed config error, not a
    /// silent fallback to the default -- a typo should surface loudly.
    #[test]
    fn load_gateway_config_rejects_invalid_bind() {
        let home = std::env::temp_dir().join(format!("fgos-gateway-bind-invalid-{}", std::process::id()));
        write_test_home_config(&home, r#","bind":"not-an-ip""#);
        let err = load_gateway_config(Some(&home)).expect_err("a malformed bind value must not silently resolve");
        assert!(matches!(err, GatewayConfigError::InvalidBind(_, ref raw) if raw == "not-an-ip"));
        std::fs::remove_dir_all(&home).ok();
    }

    /// tsk-6arn (D8): absent cf-access fields resolve to `None`, matching
    /// the item's own "additive, opt-in" scope -- no crash, no
    /// misconfiguration error over something the operator never set.
    #[test]
    fn load_gateway_config_resolves_no_cf_access_when_absent() {
        let home = std::env::temp_dir().join(format!("fgos-gateway-cfaccess-absent-{}", std::process::id()));
        write_test_home_config(&home, "");
        let config = load_gateway_config(Some(&home)).expect("a token-only config must still load");
        assert!(config.cf_access.is_none());
        std::fs::remove_dir_all(&home).ok();
    }

    /// tsk-6arn: both fields present resolves a real, configured verifier.
    #[test]
    fn load_gateway_config_resolves_cf_access_when_both_fields_present() {
        let home = std::env::temp_dir().join(format!("fgos-gateway-cfaccess-full-{}", std::process::id()));
        write_test_home_config(
            &home,
            r#","cfAccessTeamDomain":"https://team.cloudflareaccess.com","cfAccessAud":"aud-tag-123""#,
        );
        let config = load_gateway_config(Some(&home)).expect("a full cf-access config must load");
        assert!(config.cf_access.is_some());
        std::fs::remove_dir_all(&home).ok();
    }

    /// tsk-6arn: exactly one of the two fields present is a real
    /// misconfiguration, refused rather than silently treated as "off".
    #[test]
    fn load_gateway_config_rejects_partial_cf_access_team_domain_only() {
        let home = std::env::temp_dir().join(format!("fgos-gateway-cfaccess-partial-a-{}", std::process::id()));
        write_test_home_config(&home, r#","cfAccessTeamDomain":"https://team.cloudflareaccess.com""#);
        let err = load_gateway_config(Some(&home)).expect_err("team_domain without aud must not silently resolve to None");
        assert!(matches!(err, GatewayConfigError::PartialCfAccess(_)));
        std::fs::remove_dir_all(&home).ok();
    }

    #[test]
    fn load_gateway_config_rejects_partial_cf_access_aud_only() {
        let home = std::env::temp_dir().join(format!("fgos-gateway-cfaccess-partial-b-{}", std::process::id()));
        write_test_home_config(&home, r#","cfAccessAud":"aud-tag-123""#);
        let err = load_gateway_config(Some(&home)).expect_err("aud without team_domain must not silently resolve to None");
        assert!(matches!(err, GatewayConfigError::PartialCfAccess(_)));
        std::fs::remove_dir_all(&home).ok();
    }

    /// tsk-54y (D5a): the web client's static bundle is a separate origin
    /// from the gateway, so a cross-origin GET must come back with CORS
    /// headers allowing it -- proven end to end through `build_router`,
    /// not just at the `CorsLayer` construction call.
    #[tokio::test]
    async fn cors_layer_allows_cross_origin_requests() {
        use axum::body::Body;
        use axum::http::Request;
        use tower::ServiceExt;

        let gateway: Arc<dyn VerbGateway> = Arc::new(FakeGateway { response: Ok(json!({})) });
        let app = build_router(gateway, test_config(), PathBuf::from("/tmp"));

        let response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/v1/ready")
                    .header(axum::http::header::AUTHORIZATION, "Bearer test-token")
                    .header(axum::http::header::ORIGIN, "http://web-client.example")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(
            response.headers().get(axum::http::header::ACCESS_CONTROL_ALLOW_ORIGIN),
            Some(&axum::http::HeaderValue::from_static("*")),
            "a cross-origin request must come back with an Access-Control-Allow-Origin header"
        );
    }

    // tsk-48w: `with_static_serving` -- gated by the `herdrWebDashboard.
    // staticServing` toggle (settings.rs), disabled per-test unless the
    // test itself is about the enabled path.

    #[tokio::test]
    async fn static_serving_disabled_leaves_unmatched_route_as_plain_404() {
        use axum::body::Body;
        use axum::http::Request;
        use tower::ServiceExt;

        let gateway: Arc<dyn VerbGateway> = Arc::new(FakeGateway { response: Ok(json!({})) });
        let router = build_router(gateway, test_config(), PathBuf::from("/tmp"));
        let router = with_static_serving(router, false, Path::new("static"));

        let response = router
            .oneshot(Request::builder().uri("/some/unmatched/path").body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn static_serving_enabled_serves_the_embedded_bundle_for_an_unmatched_route() {
        use axum::body::Body;
        use axum::http::Request;
        use tower::ServiceExt;

        let gateway: Arc<dyn VerbGateway> = Arc::new(FakeGateway { response: Ok(json!({})) });
        let router = build_router(gateway, test_config(), PathBuf::from("/tmp"));
        // A static_dir with no index.html forces the embedded-bundle
        // branch (WebAssets, compiled from herdr-plugin/static/) rather
        // than the on-disk dev-override branch.
        let empty_dir = std::env::temp_dir().join(format!("fgos-gateway-embed-test-{}", std::process::id()));
        std::fs::create_dir_all(&empty_dir).unwrap();
        let router = with_static_serving(router, true, &empty_dir);

        let response = router
            .oneshot(Request::builder().uri("/dashboard").body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(
            response.status(),
            StatusCode::OK,
            "SPA fallback must serve index.html (200), not 404, for an unmatched client route"
        );
        std::fs::remove_dir_all(&empty_dir).ok();
    }

    #[tokio::test]
    async fn static_serving_enabled_prefers_the_on_disk_override_over_the_embedded_bundle() {
        use axum::body::Body;
        use axum::http::Request;
        use tower::ServiceExt;

        let gateway: Arc<dyn VerbGateway> = Arc::new(FakeGateway { response: Ok(json!({})) });
        let router = build_router(gateway, test_config(), PathBuf::from("/tmp"));
        let dev_dir = std::env::temp_dir().join(format!("fgos-gateway-override-test-{}", std::process::id()));
        std::fs::create_dir_all(&dev_dir).unwrap();
        let marker = "FGOS_DEV_OVERRIDE_MARKER_TSK_48W";
        std::fs::write(dev_dir.join("index.html"), format!("<html>{marker}</html>")).unwrap();
        let router = with_static_serving(router, true, &dev_dir);

        let response = router
            .oneshot(Request::builder().uri("/dashboard").body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        assert!(
            String::from_utf8_lossy(&body).contains(marker),
            "an on-disk <static_dir>/index.html must override the embedded bundle, not the other way around"
        );
        std::fs::remove_dir_all(&dev_dir).ok();
    }

    #[tokio::test]
    async fn static_serving_never_shadows_an_existing_v1_route_or_its_auth_gate() {
        use axum::body::Body;
        use axum::http::Request;
        use tower::ServiceExt;

        let gateway: Arc<dyn VerbGateway> = Arc::new(FakeGateway { response: Ok(json!({"items": []})) });
        let router = build_router(gateway, test_config(), PathBuf::from("/tmp"));
        let router = with_static_serving(router, true, Path::new("static"));

        // Unauthenticated -- must still be rejected by require_token, never
        // silently served the SPA fallback instead.
        let unauth = router
            .clone()
            .oneshot(Request::builder().uri("/v1/ready").body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(
            unauth.status(),
            StatusCode::UNAUTHORIZED,
            "the static-serving fallback must never shadow /v1/ready's own auth gate"
        );

        // Authenticated -- must reach the real handler, not the SPA
        // fallback's index.html.
        let auth = router
            .oneshot(
                Request::builder()
                    .uri("/v1/ready")
                    .header(axum::http::header::AUTHORIZATION, "Bearer test-token")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(auth.status(), StatusCode::OK);
        assert_eq!(
            auth.headers().get(axum::http::header::CONTENT_TYPE).map(|v| v.as_bytes()),
            Some(b"application/json".as_slice()),
            "an authenticated /v1/ready must still return the real JSON envelope, not the SPA's text/html index.html"
        );
    }

    // tsk-41h: PATCH /work/{id} -- partial update, translating a JSON body
    // into the exact `fgos edit` CLI invocation `bin/fgos.mjs`'s own
    // `edit` case builds.

    async fn patch_work_request(
        app: Router,
        id: &str,
        body: Value,
    ) -> axum::http::Response<axum::body::Body> {
        use axum::body::Body;
        use axum::http::Request;
        use tower::ServiceExt;

        app.oneshot(
            Request::builder()
                .method("PATCH")
                .uri(format!("/v1/work/{id}"))
                .header(axum::http::header::AUTHORIZATION, "Bearer test-token")
                .header(axum::http::header::CONTENT_TYPE, "application/json")
                .body(Body::from(serde_json::to_vec(&body).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap()
    }

    #[tokio::test]
    async fn patch_work_translates_scalar_string_fields_to_the_matching_cli_flags() {
        let capturing = Arc::new(CapturingGateway { captured: std::sync::Mutex::new(Vec::new()), response: json!({}) });
        let gateway: Arc<dyn VerbGateway> = capturing.clone();
        let app = build_router(gateway, test_config(), PathBuf::from("/tmp"));

        let response = patch_work_request(app, "tsk-41h", json!({"title": "New title", "risk": "high-risk"})).await;
        assert_eq!(response.status(), StatusCode::OK);

        let calls = capturing.captured.lock().unwrap();
        assert_eq!(calls.len(), 1);
        let args = &calls[0];
        assert_eq!(args[0], "edit");
        assert_eq!(args[1], "tsk-41h");
        assert!(args.windows(2).any(|w| w[0] == "--title" && w[1] == "New title"), "args: {args:?}");
        assert!(args.windows(2).any(|w| w[0] == "--risk" && w[1] == "high-risk"), "args: {args:?}");
        assert!(args.contains(&"--json".to_string()));
    }

    #[tokio::test]
    async fn patch_work_joins_array_fields_with_commas_matching_parse_list_flag() {
        let capturing = Arc::new(CapturingGateway { captured: std::sync::Mutex::new(Vec::new()), response: json!({}) });
        let gateway: Arc<dyn VerbGateway> = capturing.clone();
        let app = build_router(gateway, test_config(), PathBuf::from("/tmp"));

        patch_work_request(app, "tsk-41h", json!({"deps": ["tsk-a", "tsk-b"]})).await;

        let calls = capturing.captured.lock().unwrap();
        let args = &calls[0];
        assert!(args.windows(2).any(|w| w[0] == "--deps" && w[1] == "tsk-a,tsk-b"), "args: {args:?}");
    }

    #[tokio::test]
    async fn patch_work_rejects_an_array_element_containing_a_comma_instead_of_silently_corrupting_it() {
        let capturing = Arc::new(CapturingGateway { captured: std::sync::Mutex::new(Vec::new()), response: json!({}) });
        let gateway: Arc<dyn VerbGateway> = capturing.clone();
        let app = build_router(gateway, test_config(), PathBuf::from("/tmp"));

        let response = patch_work_request(app, "tsk-41h", json!({"deps": ["tsk-a,tsk-b"]})).await;
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        assert_eq!(capturing.captured.lock().unwrap().len(), 0, "must never reach the CLI with a corrupting value");
    }

    #[tokio::test]
    async fn patch_work_json_encodes_acceptance_and_domain_fields() {
        let capturing = Arc::new(CapturingGateway { captured: std::sync::Mutex::new(Vec::new()), response: json!({}) });
        let gateway: Arc<dyn VerbGateway> = capturing.clone();
        let app = build_router(gateway, test_config(), PathBuf::from("/tmp"));

        patch_work_request(
            app,
            "tsk-41h",
            json!({"acceptance": [{"text": "does the thing, even with a comma", "evidence": "test.mjs:1"}]}),
        )
        .await;

        let calls = capturing.captured.lock().unwrap();
        let args = &calls[0];
        let idx = args.iter().position(|a| a == "--acceptance").expect("--acceptance must be present");
        let parsed: Value = serde_json::from_str(&args[idx + 1]).expect("--acceptance value must be valid JSON");
        assert_eq!(parsed[0]["text"], "does the thing, even with a comma");
    }

    #[tokio::test]
    async fn patch_work_stringifies_numeric_fields() {
        let capturing = Arc::new(CapturingGateway { captured: std::sync::Mutex::new(Vec::new()), response: json!({}) });
        let gateway: Arc<dyn VerbGateway> = capturing.clone();
        let app = build_router(gateway, test_config(), PathBuf::from("/tmp"));

        patch_work_request(app, "tsk-41h", json!({"priority": 5000, "effort": 2.5})).await;

        let calls = capturing.captured.lock().unwrap();
        let args = &calls[0];
        assert!(args.windows(2).any(|w| w[0] == "--priority" && w[1] == "5000"), "args: {args:?}");
        assert!(args.windows(2).any(|w| w[0] == "--effort" && w[1] == "2.5"), "args: {args:?}");
    }

    #[tokio::test]
    async fn patch_work_urgent_is_a_string_enum_not_a_boolean() {
        // Real engine vocabulary confirmed via a live `fgos edit --urgent`
        // smoke test at Execute time: passing the literal boolean `true`
        // is REJECTED ("work.urgent must be one of [...] when present,
        // got: true") -- the real values are "low"/"medium"/"high"/
        // "critical", same plain pass-through shape as title/kind/risk.
        let capturing = Arc::new(CapturingGateway { captured: std::sync::Mutex::new(Vec::new()), response: json!({}) });
        let gateway: Arc<dyn VerbGateway> = capturing.clone();
        let app = build_router(gateway, test_config(), PathBuf::from("/tmp"));

        patch_work_request(app, "tsk-41h", json!({"urgent": "high"})).await;

        let calls = capturing.captured.lock().unwrap();
        assert!(calls[0].windows(2).any(|w| w[0] == "--urgent" && w[1] == "high"), "args: {:?}", calls[0]);
    }

    #[tokio::test]
    async fn patch_work_silently_drops_an_unrecognized_field_matching_the_cli_own_behavior() {
        let capturing = Arc::new(CapturingGateway { captured: std::sync::Mutex::new(Vec::new()), response: json!({}) });
        let gateway: Arc<dyn VerbGateway> = capturing.clone();
        let app = build_router(gateway, test_config(), PathBuf::from("/tmp"));

        let response = patch_work_request(app, "tsk-41h", json!({"status": "delivered", "notAField": 1})).await;
        assert_eq!(response.status(), StatusCode::OK, "an unrecognized field must never fail the whole patch");

        let calls = capturing.captured.lock().unwrap();
        let args = &calls[0];
        assert!(!args.contains(&"--status".to_string()), "status is not editable through this route, args: {args:?}");
        assert!(!args.iter().any(|a| a.contains("notAField")), "args: {args:?}");
    }

    #[tokio::test]
    async fn patch_work_rejects_a_field_value_beginning_with_a_dash() {
        let capturing = Arc::new(CapturingGateway { captured: std::sync::Mutex::new(Vec::new()), response: json!({}) });
        let gateway: Arc<dyn VerbGateway> = capturing.clone();
        let app = build_router(gateway, test_config(), PathBuf::from("/tmp"));

        let response = patch_work_request(app, "tsk-41h", json!({"kind": "--force"})).await;
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        assert_eq!(capturing.captured.lock().unwrap().len(), 0);
    }

    #[tokio::test]
    async fn patch_work_requires_authentication_like_every_other_v1_route() {
        use axum::body::Body;
        use axum::http::Request;
        use tower::ServiceExt;

        let gateway: Arc<dyn VerbGateway> = Arc::new(FakeGateway { response: Ok(json!({})) });
        let app = build_router(gateway, test_config(), PathBuf::from("/tmp"));
        let response = app
            .oneshot(
                Request::builder()
                    .method("PATCH")
                    .uri("/v1/work/tsk-41h")
                    .header(axum::http::header::CONTENT_TYPE, "application/json")
                    .body(Body::from(serde_json::to_vec(&json!({"title": "x"})).unwrap()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    // tsk-4id: GET /work/{id}/docs -- CONTEXT.md/plan.md content, real
    // filesystem reads under a real temp `docs/history/<feature>/` tree
    // (matching this repo's own real docsRef convention), never mocked.

    struct ShowGateway {
        docs_ref: Option<String>,
    }

    impl VerbGateway for ShowGateway {
        fn run_verb(&self, _args: &[String]) -> Result<Value, GatewayError> {
            // Real envelope shape run_verb_blocking always returns
            // (CTR001) -- docsRef lives at data.work.docsRef, not at the
            // envelope's own top level.
            Ok(json!({
                "contract": "fgos.v1",
                "generated_at": "2026-08-15T00:00:00Z",
                "data_hash": "h1",
                "data": { "work": { "id": "tsk-4id", "docsRef": self.docs_ref } },
            }))
        }
    }

    async fn get_work_docs_request(app: Router, id: &str) -> Value {
        use axum::body::Body;
        use axum::http::Request;
        use tower::ServiceExt;

        let response = app
            .oneshot(
                Request::builder()
                    .uri(format!("/v1/work/{id}/docs"))
                    .header(axum::http::header::AUTHORIZATION, "Bearer test-token")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        serde_json::from_slice(&body).unwrap()
    }

    #[tokio::test]
    async fn get_work_docs_reads_real_context_and_plan_md_from_a_real_docs_ref_directory() {
        let root = std::env::temp_dir().join(format!("fgos-gateway-docs-test-{}", std::process::id()));
        let feature_dir = root.join("docs/history/tsk-4id-smoke");
        std::fs::create_dir_all(&feature_dir).unwrap();
        std::fs::write(feature_dir.join("CONTEXT.md"), "# real context content\n").unwrap();
        std::fs::write(feature_dir.join("plan.md"), "# real plan content\n").unwrap();

        let gateway: Arc<dyn VerbGateway> =
            Arc::new(ShowGateway { docs_ref: Some("docs/history/tsk-4id-smoke/".to_string()) });
        let app = build_router(gateway, test_config(), root.clone());

        let data = get_work_docs_request(app, "tsk-4id").await;
        assert_eq!(data["data"]["contextMd"], "# real context content\n");
        assert_eq!(data["data"]["planMd"], "# real plan content\n");
        std::fs::remove_dir_all(&root).ok();
    }

    #[tokio::test]
    async fn get_work_docs_reports_narrative_missing_without_failing_when_the_directory_does_not_exist() {
        let root = std::env::temp_dir().join(format!("fgos-gateway-docs-missing-test-{}", std::process::id()));
        std::fs::create_dir_all(root.join("docs/history")).unwrap();

        let gateway: Arc<dyn VerbGateway> =
            Arc::new(ShowGateway { docs_ref: Some("docs/history/does-not-exist/".to_string()) });
        let app = build_router(gateway, test_config(), root.clone());

        let data = get_work_docs_request(app, "tsk-4id").await;
        assert_eq!(data["data"]["narrativeMissing"], true);
        assert_eq!(data["data"]["contextMd"], Value::Null);
        std::fs::remove_dir_all(&root).ok();
    }

    #[tokio::test]
    async fn get_work_docs_rejects_a_docs_ref_that_escapes_docs_history_via_traversal() {
        use axum::body::Body;
        use axum::http::Request;
        use tower::ServiceExt;

        let root = std::env::temp_dir().join(format!("fgos-gateway-docs-traversal-test-{}", std::process::id()));
        std::fs::create_dir_all(root.join("docs/history")).unwrap();
        // A real target OUTSIDE docs/history/ that the traversal payload
        // below would resolve to if the guard were only a string check.
        std::fs::write(root.join("secret.txt"), "should never be readable through this route").unwrap();

        let gateway: Arc<dyn VerbGateway> =
            Arc::new(ShowGateway { docs_ref: Some("docs/history/../../secret.txt".to_string()) });
        let app = build_router(gateway, test_config(), root.clone());

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/v1/work/tsk-4id/docs")
                    .header(axum::http::header::AUTHORIZATION, "Bearer test-token")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        std::fs::remove_dir_all(&root).ok();
    }

    #[tokio::test]
    async fn get_work_docs_returns_nulls_when_the_item_has_no_docs_ref_at_all() {
        let gateway: Arc<dyn VerbGateway> = Arc::new(ShowGateway { docs_ref: None });
        let app = build_router(gateway, test_config(), PathBuf::from("/tmp"));

        let data = get_work_docs_request(app, "tsk-4id").await;
        assert_eq!(data["data"]["docsRef"], Value::Null);
        assert_eq!(data["data"]["contextMd"], Value::Null);
    }
}
