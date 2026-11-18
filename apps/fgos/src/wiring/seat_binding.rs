//! `fgos internal seat-binding <op> --protocol 2`: the Node payload's one door to every Execution decision
//! it must not copy (the bind, its explanation, the dispatch plan, the pre-admission facts, the seat config
//! digest and the tier ladder).
//!
//! The request is one JSON document on stdin: `{ v: 2, runner, ... }`, the `runner` section being the run's
//! snapshot (the route reads no config of its own). The answer is one JSON line on stdout:
//! `{ v: 2, protocol: 2, hostVersion, op, result, ... }` with `result`:
//!
//! - `ok`: the decision, under the key of its op (`binding`, `explanation`, `plan`, `preflight`, `digest`,
//!   `ladder`); `bind` answers `refused` instead when the binding is `{ refused }` (a refusal is a decision);
//! - `failed`: the derivation refused the request as a model error (an override naming a tier no seat could
//!   take, a runner that does not check), under `failure: { name, code, message }`;
//! - `error`: anything that is not a decision, with a `code` and a `message`.
//!
//! The protocol is checked before the op, so a client of another protocol gets the named mismatch whatever it
//! asked. Per-op request fields:
//!
//! - `bind`, `explain`: `ask`, `walk`, `session`, `accountState`, `now`;
//! - `plan`: `for`, `needsSoul`, `hasLiveTaskAccess`, `repoRoot`, `session`, `now` (the binding selectors only);
//!   the answer carries the purpose's `binding` when a seat was bound for it;
//! - `preflight`: `session`, `pin: { pool, id }`, `accountState`, `now`;
//! - `digest`, `ladder`: the runner alone (`ladder` needs none).
//!
//! `session` is `{ headless, hasNativeAgent, postureAtLaunch, pathEnv }`; `pathEnv` replaces the PATH the
//! machine looks programs up on. Every file the machine reads is opened no-follow beneath its root and read
//! under a byte cap.

use std::cell::OnceCell;
use std::ffi::OsString;
use std::io::Read;
use std::path::{Path, PathBuf};

use fgos_execution::bind::{
    bind, preflight, seat_config_digest, AccountPin, BindRequest, BindSession,
};
use fgos_execution::decide::{decide_over, CrateBinder, DecideFailure, DecideRequest};
use fgos_execution::executor_model::ModelError;
use fgos_execution::explain::explain_seat;
use fgos_execution::ports::{Backend, Machine};
use fgos_execution::tools::{Head, ToolProbe};
use fgos_host_runtime::cli_args::{parse_args, FlagScalar, FlagValue};
use fgos_seat_binding::ladder;
use serde_json::{json, Value};

/// The protocol this route speaks.
pub const PROTOCOL: u64 = 2;
pub const EXIT_USAGE: i32 = 2;
pub const EXIT_VERSION_MISMATCH: i32 = 3;
/// The request on stdin is not valid JSON or does not match the contract.
pub const EXIT_INVALID_REQUEST: i32 = 65;

/// Version of the host component that answers; recorded by callers next to the decision it produced.
pub const HOST_VERSION: &str = env!("CARGO_PKG_VERSION");

const OPS: [&str; 6] = ["bind", "explain", "plan", "preflight", "digest", "ladder"];
const OPS_TEXT: &str = "bind, explain, plan, preflight, digest or ladder";

/// The most bytes of any file the machine reads (the registry, a tool index's `meta.json`).
const READ_CAP: usize = 1024 * 1024;

const REGISTRY_ENV: &str = "FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH";
const REGISTRY_FILE: &str = "confinement-backends.json";
const REGISTRY_CONTRACT: &str = "confinement-backend-registry.v1";

/// Run the route with the args after `seat-binding`, reading the request from stdin; returns the exit code.
pub fn main(args: &[String]) -> i32 {
    let mut stdin = String::new();
    // A missing or unreadable stdin is an empty request, refused below.
    let _ = std::io::stdin().read_to_string(&mut stdin);
    let (code, line) = run(args, &stdin);
    println!("{line}");
    code
}

/// The route without a process around it: the exit code and the one answer line.
pub fn run(args: &[String], stdin: &str) -> (i32, Value) {
    let parsed = match parse_args(&args.iter().map(OsString::from).collect::<Vec<_>>()) {
        Ok(parsed) => parsed,
        Err(err) => return error("", "usage", &err.to_string(), EXIT_USAGE),
    };
    let op = parsed.positional.first().map(String::as_str);
    if let Some(extra) = parsed.positional.get(1) {
        return error(
            op.unwrap_or(""),
            "usage",
            &format!("unknown argument {extra}"),
            EXIT_USAGE,
        );
    }
    if let Some((name, _)) = parsed.flags.iter().find(|(name, _)| name != "protocol") {
        return error(
            op.unwrap_or(""),
            "usage",
            &format!("unknown argument --{name}"),
            EXIT_USAGE,
        );
    }
    let protocol = match parsed.flag("protocol") {
        None => None,
        Some(FlagValue::One(FlagScalar::Str(value))) => Some(value.as_str()),
        Some(_) => {
            return error(
                op.unwrap_or(""),
                "usage",
                "--protocol needs a value",
                EXIT_USAGE,
            )
        }
    };
    let op_name = op.unwrap_or("");
    if protocol != Some(PROTOCOL.to_string().as_str()) {
        return error(
            op_name,
            "host-version-mismatch",
            &format!("needs --protocol {PROTOCOL}"),
            EXIT_VERSION_MISMATCH,
        );
    }
    let Some(op) = op else {
        return error(
            "",
            "usage",
            &format!("needs an operation: {OPS_TEXT}"),
            EXIT_USAGE,
        );
    };
    if !OPS.contains(&op) {
        return error(
            op,
            "usage",
            &format!("unknown operation {op}; expected {OPS_TEXT}"),
            EXIT_USAGE,
        );
    }
    let request: Value = match serde_json::from_str(stdin) {
        Ok(value) => value,
        Err(err) => {
            return invalid(op, &format!("stdin is not JSON: {err}"));
        }
    };
    if request.get("v").and_then(Value::as_u64) != Some(PROTOCOL) {
        return error(
            op,
            "host-version-mismatch",
            &format!("the request must carry v: {PROTOCOL}"),
            EXIT_VERSION_MISMATCH,
        );
    }
    serve(op, &request)
}

fn serve(op: &str, request: &Value) -> (i32, Value) {
    if op == "ladder" {
        return (0, answer(op, "ok", json!({ "ladder": ladder() })));
    }
    let Some(runner) = request.get("runner").filter(|runner| runner.is_object()) else {
        return invalid(op, &format!("{op} needs a runner section"));
    };
    if op == "digest" {
        return (
            0,
            answer(op, "ok", json!({ "digest": seat_config_digest(runner) })),
        );
    }
    let session = session_of(request);
    let machine = HostMachine::new(session.path_env.as_deref(), session.herdr_present);
    let now = now_of(request);
    let account_state = request.get("accountState").filter(|state| !state.is_null());
    match op {
        "bind" | "explain" => {
            let Some(ask) = request.get("ask").filter(|ask| ask.is_object()) else {
                return invalid(op, &format!("{op} needs an ask"));
            };
            let empty_walk = json!({});
            let bind_request = BindRequest {
                ask,
                runner,
                session: session.bind,
                walk: request.get("walk").unwrap_or(&empty_walk),
                account_state,
            };
            if op == "bind" {
                return match bind(&bind_request, &machine, now) {
                    Ok(binding) => {
                        let result = if binding.get("refused").is_some() {
                            "refused"
                        } else {
                            "ok"
                        };
                        (0, answer(op, result, json!({ "binding": binding })))
                    }
                    Err(failure) => failed(op, &failure),
                };
            }
            match explain_seat(&bind_request, &machine, now) {
                Ok(explained) => (
                    0,
                    answer(
                        op,
                        "ok",
                        json!({ "explanation": {
                            "binding": explained.binding,
                            "output": explained.output,
                            "launchView": explained.launch_view,
                            "walk": explained.walk,
                        } }),
                    ),
                ),
                Err(failure) => failed(op, &failure),
            }
        }
        "plan" => {
            let text = |key: &str| {
                request
                    .get(key)
                    .and_then(Value::as_str)
                    .filter(|text| !text.is_empty())
                    .map(str::to_string)
            };
            let flag = |key: &str| request.get(key) == Some(&Value::Bool(true));
            let decide = DecideRequest {
                purpose: text("for"),
                needs_soul: flag("needsSoul"),
                has_live_task_access: flag("hasLiveTaskAccess"),
                ..DecideRequest::default()
            };
            let probe = HostProbe::new(&machine, text("repoRoot").map(PathBuf::from));
            let binder = CrateBinder {
                machine: &machine,
                now,
            };
            match decide_over(runner, &decide, &probe, &binder) {
                Ok(plan) => {
                    // The seat bound for a purpose rides along, so a caller reading its policy binds no second time.
                    let mut body = plan.to_json();
                    if let (Some(body), Some(binding)) = (body.as_object_mut(), &plan.binding) {
                        body.insert("binding".into(), binding.clone());
                    }
                    (0, answer(op, "ok", json!({ "plan": body })))
                }
                Err(failure) => match failure {
                    DecideFailure::Refused(model) => failed(op, &model),
                    DecideFailure::SeatRefused { code, message } => (
                        0,
                        answer(
                            op,
                            "failed",
                            json!({ "failure": { "name": "SeatRefused", "code": code, "message": message } }),
                        ),
                    ),
                    DecideFailure::ConfigDoor { code, message } => (
                        0,
                        answer(
                            op,
                            "failed",
                            json!({ "failure": { "name": "ConfigDoor", "code": code, "message": message } }),
                        ),
                    ),
                },
            }
        }
        _ => {
            let pin = request
                .get("pin")
                .filter(|pin| pin.is_object())
                .map(|pin| AccountPin {
                    pool: pin["pool"].as_str().unwrap_or_default().to_string(),
                    id: pin["id"].as_str().unwrap_or_default().to_string(),
                });
            let facts = preflight(
                runner,
                &session.bind,
                pin.as_ref(),
                account_state,
                &machine,
                now,
            );
            match serde_json::to_value(&facts) {
                Ok(facts) => (0, answer(op, "ok", json!({ "preflight": facts }))),
                Err(err) => invalid(op, &format!("the answer cannot be encoded: {err}")),
            }
        }
    }
}

// ---- the request ------------------------------------------------------------------------------------------

struct Session {
    bind: BindSession,
    path_env: Option<String>,
    /// What the caller states about herdr; the host's own detection answers when it states nothing.
    herdr_present: Option<bool>,
}

fn session_of(request: &Value) -> Session {
    let session = request.get("session").unwrap_or(&Value::Null);
    let flag = |key: &str| session.get(key) == Some(&Value::Bool(true));
    Session {
        bind: BindSession {
            headless: flag("headless"),
            has_native_agent: flag("hasNativeAgent"),
            posture_at_launch: flag("postureAtLaunch"),
        },
        path_env: session
            .get("pathEnv")
            .and_then(Value::as_str)
            .map(str::to_string),
        herdr_present: session.get("herdrPresent").and_then(Value::as_bool),
    }
}

/// Epoch milliseconds the request names, else the clock.
fn now_of(request: &Value) -> u64 {
    request
        .get("now")
        .and_then(Value::as_u64)
        .unwrap_or_else(|| {
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map_or(0, |elapsed| elapsed.as_millis() as u64)
        })
}

// ---- the answer -------------------------------------------------------------------------------------------

fn answer(op: &str, result: &str, body: Value) -> Value {
    let mut line = json!({
        "v": PROTOCOL,
        "protocol": PROTOCOL,
        "hostVersion": HOST_VERSION,
        "op": op,
        "result": result,
    });
    if let (Some(line), Value::Object(body)) = (line.as_object_mut(), body) {
        line.extend(body);
    }
    line
}

fn error(op: &str, code: &str, message: &str, exit: i32) -> (i32, Value) {
    (
        exit,
        answer(op, "error", json!({ "code": code, "message": message })),
    )
}

fn invalid(op: &str, message: &str) -> (i32, Value) {
    error(op, "invalid-request", message, EXIT_INVALID_REQUEST)
}

/// A derivation refused as a model error: a decision of the model, not a fault of the route.
fn failed(op: &str, failure: &ModelError) -> (i32, Value) {
    (
        0,
        answer(
            op,
            "failed",
            json!({ "failure": { "name": failure.name, "code": failure.code, "message": failure.message } }),
        ),
    )
}

// ---- the machine ------------------------------------------------------------------------------------------

/// A file's bytes, opened no-follow beneath `root` and read under [`READ_CAP`]. A missing file, a link, a
/// non-regular file or a file over the cap is `None`: nothing this route reads is worth following out of its root.
#[cfg(unix)]
fn read_beneath(root: &Path, relative: &Path) -> Option<Vec<u8>> {
    fgos_durable_file::open_beneath(root, relative)
        .ok()
        .flatten()?
        .read(READ_CAP)
        .ok()
        .map(|read| read.bytes)
}

#[cfg(not(unix))]
fn read_beneath(root: &Path, relative: &Path) -> Option<Vec<u8>> {
    let path = root.join(relative);
    let meta = std::fs::symlink_metadata(&path).ok()?;
    if !meta.is_file() || meta.len() > READ_CAP as u64 {
        return None;
    }
    std::fs::read(path).ok()
}

/// Whether the directory `relative` exists beneath `root`, no link followed.
#[cfg(unix)]
fn dir_exists_beneath(root: &Path, relative: &Path) -> bool {
    matches!(
        fgos_durable_file::open_dir_beneath(root, relative),
        Ok(Some(_))
    )
}

#[cfg(not(unix))]
fn dir_exists_beneath(root: &Path, relative: &Path) -> bool {
    std::fs::symlink_metadata(root.join(relative)).is_ok_and(|meta| meta.is_dir())
}

/// Where a path is read from: its parent directory as the root, its last name as the relative path.
fn split_root(path: &Path) -> Option<(PathBuf, PathBuf)> {
    Some((
        path.parent()?.to_path_buf(),
        PathBuf::from(path.file_name()?),
    ))
}

/// The real machine, as the executor model and the tool probe read it.
struct HostMachine {
    path_env: String,
    herdr_present: Option<bool>,
    registry: OnceCell<Option<Value>>,
}

impl HostMachine {
    fn new(path_env: Option<&str>, herdr_present: Option<bool>) -> Self {
        HostMachine {
            herdr_present,
            path_env: path_env.map(str::to_string).unwrap_or_else(|| {
                std::env::var_os("PATH")
                    .map(|path| path.to_string_lossy().into_owned())
                    .unwrap_or_default()
            }),
            registry: OnceCell::new(),
        }
    }

    /// The machine confinement backend registry: `FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH`, else
    /// `<global dir>/confinement-backends.json`. A missing, unreadable or invalid registry carries nothing.
    fn registry(&self) -> Option<&Value> {
        self.registry
            .get_or_init(|| {
                let path = std::env::var(REGISTRY_ENV)
                    .ok()
                    .filter(|path| !path.is_empty())
                    .map(PathBuf::from)
                    .or_else(|| {
                        fgos_config::machine::global_dir(|key| std::env::var(key).ok())
                            .map(|dir| dir.join(REGISTRY_FILE))
                    })?;
                let (root, relative) = split_root(&path)?;
                let doc: Value = serde_json::from_slice(&read_beneath(&root, &relative)?).ok()?;
                (doc.get("contract") == Some(&json!(REGISTRY_CONTRACT))
                    && doc.get("confinementBackends").is_some_and(Value::is_object))
                .then_some(doc)
            })
            .as_ref()
    }
}

/// Herdr as the process environment shows it: `HERDR_ENV=1` and an existing `HERDR_SOCKET_PATH`.
fn herdr_in_environment() -> bool {
    std::env::var("HERDR_ENV").is_ok_and(|env| env == "1")
        && std::env::var_os("HERDR_SOCKET_PATH")
            .filter(|socket| !socket.is_empty())
            .is_some_and(|socket| Path::new(&socket).exists())
}

/// A path with a separator is judged by its executable bit, as Node does; a bare name is looked up on `path_env`
/// through the one PATH door.
fn program_present(program: &str, path_env: &str) -> bool {
    if program.is_empty() {
        return false;
    }
    if program.contains(['/', '\\']) {
        let path = Path::new(program);
        return path.metadata().is_ok_and(|meta| {
            !meta.is_dir() && {
                #[cfg(unix)]
                {
                    use std::os::unix::fs::PermissionsExt;
                    meta.permissions().mode() & 0o111 != 0
                }
                #[cfg(not(unix))]
                {
                    true
                }
            }
        });
    }
    let pathext = std::env::var("PATHEXT").unwrap_or_default();
    fgos_process::spawn::resolve_program(program, path_env, &pathext, cfg!(windows)).is_some()
}

impl Machine for HostMachine {
    fn on_path(&self, program: &str) -> bool {
        program_present(program, &self.path_env)
    }

    fn posture_backend(&self, id: &str) -> Option<Backend> {
        let instance = self.registry()?.get("confinementBackends")?.get(id)?;
        Some(Backend {
            enabled: instance.get("enabled") != Some(&Value::Bool(false)),
            kind: instance
                .get("type")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string(),
            executable: instance
                .get("executable")
                .and_then(Value::as_str)
                .filter(|executable| !executable.is_empty())
                .map(str::to_string),
        })
    }

    fn herdr_present(&self) -> bool {
        self.herdr_present.unwrap_or_else(herdr_in_environment)
    }

    fn home_dir(&self) -> Option<String> {
        let var = if cfg!(unix) { "HOME" } else { "USERPROFILE" };
        std::env::var(var).ok().filter(|home| !home.is_empty())
    }
}

/// The tool probe: the machine's PATH, and the repository root a tool's `scanTarget` and `HEAD` resolve against.
struct HostProbe<'a> {
    machine: &'a HostMachine,
    repo_root: PathBuf,
}

impl<'a> HostProbe<'a> {
    fn new(machine: &'a HostMachine, repo_root: Option<PathBuf>) -> Self {
        HostProbe {
            machine,
            repo_root: repo_root
                .or_else(|| std::env::current_dir().ok())
                .unwrap_or_else(|| PathBuf::from(".")),
        }
    }

    /// The root and the relative path a scan target is read from: an absolute target is its own filesystem root.
    fn scan_path(&self, scan_target: &str, leaf: Option<&str>) -> (PathBuf, PathBuf) {
        let target = Path::new(scan_target);
        let (root, relative) = if target.is_absolute() {
            let relative: PathBuf = target.components().skip(1).collect();
            (
                PathBuf::from(std::path::MAIN_SEPARATOR.to_string()),
                relative,
            )
        } else {
            // `.` and `./x` name the root and what lies beneath it: the current-directory steps carry nothing.
            let relative: PathBuf = target
                .components()
                .filter(|part| !matches!(part, std::path::Component::CurDir))
                .collect();
            (self.repo_root.clone(), relative)
        };
        (
            root,
            leaf.map_or(relative.clone(), |leaf| relative.join(leaf)),
        )
    }
}

impl ToolProbe for HostProbe<'_> {
    fn present(&self, command: &str) -> bool {
        self.machine.on_path(command)
    }

    fn scan_target_exists(&self, scan_target: &str) -> bool {
        let (root, relative) = self.scan_path(scan_target, None);
        if relative.as_os_str().is_empty() {
            // The target is the root itself: a directory is judged from its parent.
            return split_root(&root)
                .is_some_and(|(parent, name)| dir_exists_beneath(&parent, &name))
                || root.parent().is_none() && root.is_dir();
        }
        dir_exists_beneath(&root, &relative)
    }

    fn index_commit(&self, scan_target: &str) -> Option<String> {
        let (root, relative) = self.scan_path(scan_target, Some("meta.json"));
        let meta: Value = serde_json::from_slice(&read_beneath(&root, &relative)?).ok()?;
        meta.get("lastCommit")?.as_str().map(str::to_string)
    }

    fn head(&self) -> Head {
        use fgos_git::{GitDriver, ResolveRepo};
        // The driver reads; it is only opened when its state root already exists, so a probe writes nothing. A
        // `HEAD` that cannot be read is never a staleness the probe saw.
        let state_root = fgos_holder_lock::state_root().0;
        let Ok(Some(driver)) = GitDriver::new_if_root_exists(&state_root) else {
            return Head::Unresolved;
        };
        match driver.resolve_repo(&self.repo_root, &self.repo_root) {
            Ok(ResolveRepo::Repository(repo)) => match driver.resolve_commit_ref(&repo, "HEAD") {
                Ok(Some(oid)) => Head::Commit(oid.as_str().to_string()),
                _ => Head::Unresolved,
            },
            Ok(ResolveRepo::NotARepository) => Head::NotARepository,
            Err(_) => Head::Unresolved,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn args(list: &[&str]) -> Vec<String> {
        list.iter().map(|a| a.to_string()).collect()
    }

    #[test]
    fn the_protocol_is_checked_before_the_operation() {
        // A client of protocol 1 asking a valid op, an unknown op, or no op at all gets the same named mismatch.
        for list in [
            &["bind", "--protocol", "1"][..],
            &["nope", "--protocol", "1"][..],
            &["--protocol", "1"][..],
            &["bind"][..],
            &["ladder", "--protocol", "3"][..],
        ] {
            let (code, line) = run(&args(list), r#"{"v":1}"#);
            assert_eq!(code, EXIT_VERSION_MISMATCH, "{list:?}");
            assert_eq!(line["result"], "error");
            assert_eq!(line["code"], "host-version-mismatch");
        }
    }

    #[test]
    fn usage_faults_exit_two_once_the_protocol_is_right() {
        for list in [
            &["--protocol", "2"][..],
            &["nope", "--protocol", "2"][..],
            &["bind", "--protocol"][..],
            &["bind", "--protocol", "2", "--x", "1"][..],
            &["bind", "extra", "--protocol", "2"][..],
        ] {
            let (code, line) = run(&args(list), "{}");
            assert_eq!(code, EXIT_USAGE, "{list:?}");
            assert_eq!(line["result"], "error");
        }
    }

    #[test]
    fn a_request_that_is_not_the_contract_is_invalid_not_a_decision() {
        for (op, stdin) in [
            ("bind", ""),
            ("bind", "not json"),
            ("bind", r#"{"v":2}"#),
            ("bind", r#"{"v":2,"runner":{}}"#),
            ("explain", r#"{"v":2,"runner":[],"ask":{}}"#),
            ("plan", r#"{"v":2}"#),
            ("digest", r#"{"v":2}"#),
        ] {
            let (code, line) = run(&args(&[op, "--protocol", "2"]), stdin);
            assert_eq!(code, EXIT_INVALID_REQUEST, "{op} {stdin}");
            assert_eq!(line["code"], "invalid-request");
        }
        let (code, line) = run(&args(&["ladder", "--protocol", "2"]), r#"{"v":1}"#);
        assert_eq!(
            (code, line["code"].as_str()),
            (EXIT_VERSION_MISMATCH, Some("host-version-mismatch"))
        );
    }

    #[test]
    fn ladder_answers_with_the_tier_vocabulary_and_the_host_version() {
        let (code, line) = run(&args(&["ladder", "--protocol", "2"]), r#"{"v":2}"#);
        assert_eq!(code, 0);
        assert_eq!(line["result"], "ok");
        assert_eq!(line["protocol"], 2);
        assert_eq!(line["hostVersion"], HOST_VERSION);
        assert_eq!(line["ladder"]["vocabulary"].as_array().unwrap().len(), 6);
    }

    #[test]
    fn digest_is_the_seat_config_digest_of_the_runner() {
        let (code, line) = run(
            &args(&["digest", "--protocol", "2"]),
            r#"{"v":2,"runner":{}}"#,
        );
        assert_eq!(code, 0);
        assert_eq!(
            line["digest"],
            "sha256:405336c7ec05446658dd47649864dc7c4cf220d98732218da30efdbbad744d1c"
        );
    }

    #[test]
    fn preflight_names_the_agent_clis_looked_for_when_none_is_on_the_given_path() {
        let runner = json!({ "executors": { "claude": {
            "kind": "agent", "providerModel": "claude",
            "invocations": [{ "id": "claude-cli", "via": "cli", "adapter": "cli-spawn", "command": "claude" }]
        } } });
        let request = json!({
            "v": 2, "runner": runner,
            "session": { "headless": true, "pathEnv": "/nonexistent-directory" },
            "now": 1_800_000_000_000_u64,
        });
        let (code, line) = run(
            &args(&["preflight", "--protocol", "2"]),
            &request.to_string(),
        );
        assert_eq!(code, 0);
        assert_eq!(line["result"], "ok");
        assert_eq!(
            line["preflight"]["agentCliMissing"]["reason"],
            "agent-cli-missing"
        );
    }

    #[test]
    fn a_program_is_found_on_the_given_path_or_by_its_executable_bit() {
        let dir = std::env::temp_dir().join(format!("fgos-seat-binding-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let tool = dir.join("agent-tool");
        std::fs::write(&tool, "#!/bin/sh\n").unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&tool, std::fs::Permissions::from_mode(0o755)).unwrap();
            let plain = dir.join("plain");
            std::fs::write(&plain, "x").unwrap();
            std::fs::set_permissions(&plain, std::fs::Permissions::from_mode(0o644)).unwrap();
            assert!(program_present("agent-tool", dir.to_str().unwrap()));
            assert!(program_present(tool.to_str().unwrap(), ""));
            assert!(!program_present(plain.to_str().unwrap(), ""));
            assert!(!program_present(dir.to_str().unwrap(), ""));
        }
        assert!(!program_present("agent-tool", "/nonexistent-directory"));
        std::fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn herdr_presence_is_what_the_request_states_else_what_the_environment_shows() {
        assert!(HostMachine::new(None, Some(true)).herdr_present());
        assert!(!HostMachine::new(None, Some(false)).herdr_present());
        assert_eq!(
            HostMachine::new(None, None).herdr_present(),
            herdr_in_environment()
        );
    }

    #[test]
    fn a_scan_target_of_dot_is_the_root_and_a_dot_prefixed_path_is_beneath_it() {
        let root = std::env::temp_dir().join(format!("fgos-scan-target-{}", std::process::id()));
        std::fs::create_dir_all(root.join(".index")).unwrap();
        std::fs::write(root.join("meta.json"), r#"{"lastCommit":"abc"}"#).unwrap();
        std::fs::write(root.join(".index/meta.json"), r#"{"lastCommit":"def"}"#).unwrap();
        let machine = HostMachine::new(Some(""), None);
        let probe = HostProbe::new(&machine, Some(root.clone()));
        assert!(probe.scan_target_exists("."));
        assert!(probe.scan_target_exists("./.index"));
        assert!(!probe.scan_target_exists(".missing"));
        assert_eq!(probe.index_commit(".").as_deref(), Some("abc"));
        assert_eq!(probe.index_commit("./.index").as_deref(), Some("def"));
        std::fs::remove_dir_all(&root).unwrap();
    }

    #[test]
    fn the_plan_answer_carries_the_binding_of_a_purpose_with_a_prefer_pool() {
        let request = json!({
            "v": 2,
            "runner": {
                "executors": { "vec-agent": { "kind": "agent", "providerModel": "claude", "agentType": "vec-agent-type" } },
                "modelPolicies": { "claude": { "standard": "sonnet" } },
                "capabilities": { "vec-row": { "prefer": "vec-agent", "tier": "standard" }, "vec-plain": {} }
            },
            "for": "vec-row",
            "hasLiveTaskAccess": true,
            "now": 1_800_000_000_000_u64,
        });
        let (code, line) = run(&args(&["plan", "--protocol", "2"]), &request.to_string());
        assert_eq!(code, 0, "{line}");
        assert_eq!(line["plan"]["executorId"], "vec-agent");
        assert_eq!(line["plan"]["binding"]["executor"], "vec-agent");
        // A purpose no seat was bound for carries none.
        let mut plain = request.clone();
        plain["for"] = json!("vec-plain");
        let (code, line) = run(&args(&["plan", "--protocol", "2"]), &plain.to_string());
        assert_eq!(code, 0, "{line}");
        assert!(line["plan"].get("binding").is_none());
    }
}
