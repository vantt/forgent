//! `fgos internal seat-binding <op> --protocol 2`: the Node payload's door to the bind it must not copy.
//!
//! One JSON request on stdin, one JSON answer line on stdout:
//! `{v, protocol, hostVersion, op, result: "ok"|"failed"|"error", ...}`. The protocol is checked before the
//! operation, so a client of another protocol meets the named mismatch whatever it asks. Every request but `ladder`
//! carries the runner section it is decided under (the caller's run snapshot); nothing here reads a config.
//!
//! - `bind`: `{runner, ask, session, walk, accountState?, now}` -> `{binding}` (a refusal is `binding.refused`).
//! - `explain`: the same request -> `{binding, policy?, ranked?, explain?, launchView?, walk}`: the binding and the
//!   walk its failures would take, in one call.
//! - `plan`: `{runner, purpose, repoRoot, session, now}` -> `{seat}`: what serves a purpose (`dispatch decide --for`).
//! - `preflight`: `{runner, session, pin?, accountState?, now}` -> `{preflight}`: what a run start refuses first.
//! - `digest`: `{runner}` -> `{config, digest}`: the seat config slice a replay compares.
//! - `ladder`: `{}` -> `{ladder}`: the tier vocabulary.
//!
//! `result: "failed"` carries a decision the request cannot make (`failure: {name, code?, message}`, the error class
//! Node throws it under); `result: "error"` is a fault of the call itself (`code`, `message`). The machine facts the
//! decisions read come from this process: PATH through the one PATH door, the confinement backend registry, herdr
//! presence, the home directory, a tool's index and the repository `HEAD` through the Git port. Every file read is
//! opened without following a link and read under a byte cap.

use std::io::Read;
use std::path::{Path, PathBuf};

use fgos_execution::bind::{
    bind, preflight, seat_config, seat_config_digest, AccountPin, BindRequest, BindSession,
};
use fgos_execution::decide::{purpose_seat_answer, CrateBinder};
use fgos_execution::executor_model::ModelError;
use fgos_execution::explain::explain_seat;
use fgos_execution::ports::{Backend, Machine};
use fgos_execution::tools::{Head, ToolProbe};
use fgos_git::{GitDriver, ResolveRepo};
use serde_json::{json, Value};

pub const PROTOCOL: u64 = 2;
pub const EXIT_USAGE: i32 = 2;
pub const EXIT_VERSION_MISMATCH: i32 = 3;
/// The request on stdin is not valid JSON or does not match the contract.
pub const EXIT_INVALID_REQUEST: i32 = 65;

/// Version of the host that answers; recorded by callers next to the decision it produced.
pub const HOST_VERSION: &str = env!("CARGO_PKG_VERSION");

const OPS: [&str; 6] = ["bind", "explain", "plan", "preflight", "digest", "ladder"];
const REGISTRY_ENV: &str = "FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH";
const REGISTRY_FILE: &str = "confinement-backends.json";
const REGISTRY_CONTRACT: &str = "confinement-backend-registry.v1";
/// The largest machine registry or tool index record read.
const MAX_FILE_BYTES: usize = 1024 * 1024;

/// Run the route with the args after `seat-binding`, reading the request from stdin; returns the exit code.
pub fn main(args: &[String]) -> i32 {
    let mut stdin = String::new();
    // A missing or unreadable stdin is an empty request, refused below.
    let _ = std::io::stdin().read_to_string(&mut stdin);
    let env = |key: &str| std::env::var(key).ok();
    let (code, line) = run(args, &stdin, &env);
    println!("{line}");
    code
}

/// The route over a request and an environment: the exit code and the one answer line.
pub fn run(args: &[String], stdin: &str, env: &dyn Fn(&str) -> Option<String>) -> (i32, Value) {
    // `<op> --protocol <n>`: the first other word is the operation, any further one is unknown.
    let mut op = "";
    let mut protocol: Option<&str> = None;
    let mut unknown: Option<&str> = None;
    let mut iter = args.iter();
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--protocol" => protocol = iter.next().map(String::as_str).or(Some("")),
            word if op.is_empty() => op = word,
            other => unknown = unknown.or(Some(other)),
        }
    }
    if protocol != Some("2") {
        return error(
            op,
            "host-version-mismatch",
            "needs --protocol 2",
            EXIT_VERSION_MISMATCH,
        );
    }
    if !OPS.contains(&op) {
        let message = if op.is_empty() {
            format!("needs an operation: {}", OPS.join(", "))
        } else {
            format!("unknown operation {op}; expected {}", OPS.join(", "))
        };
        return error(op, "usage", &message, EXIT_USAGE);
    }
    if let Some(other) = unknown {
        return error(
            op,
            "usage",
            &format!("unknown argument {other}"),
            EXIT_USAGE,
        );
    }
    let request: Value = match serde_json::from_str(stdin) {
        Ok(value) => value,
        Err(err) => return invalid(op, &format!("stdin is not JSON: {err}")),
    };
    if request.get("v").and_then(Value::as_u64) != Some(PROTOCOL) {
        return error(
            op,
            "host-version-mismatch",
            "the request must carry v: 2",
            EXIT_VERSION_MISMATCH,
        );
    }
    match answer_op(op, &request, env) {
        Ok(Ok(body)) => (0, answer(op, "ok", body)),
        Ok(Err(failure)) => (
            0,
            answer(op, "failed", json!({ "failure": failure.to_json() })),
        ),
        Err(message) => invalid(op, &message),
    }
}

/// The answer body of one operation, a decision it cannot make, or why the request is not the contract.
fn answer_op(
    op: &str,
    request: &Value,
    env: &dyn Fn(&str) -> Option<String>,
) -> Result<Result<Value, ModelError>, String> {
    if op == "ladder" {
        return Ok(Ok(json!({ "ladder": fgos_seat_binding::ladder() })));
    }
    let runner = request
        .get("runner")
        .filter(|runner| runner.is_object())
        .ok_or_else(|| format!("{op} needs the runner section it is decided under"))?;
    if op == "digest" {
        return Ok(Ok(
            json!({ "config": seat_config(runner), "digest": seat_config_digest(runner) }),
        ));
    }
    let now = request
        .get("now")
        .and_then(Value::as_u64)
        .ok_or_else(|| format!("{op} needs now, epoch milliseconds"))?;
    let empty = json!({});
    let session_doc = request.get("session").unwrap_or(&empty);
    let session = BindSession {
        headless: session_doc.get("headless") == Some(&json!(true)),
        has_native_agent: session_doc.get("hasNativeAgent") == Some(&json!(true)),
        posture_at_launch: session_doc.get("postureAtLaunch") == Some(&json!(true)),
    };
    let machine = HostMachine::new(session_doc, env);
    let account_state = request.get("accountState").filter(|state| !state.is_null());
    match op {
        "bind" | "explain" => {
            let ask = request
                .get("ask")
                .filter(|ask| ask.is_object())
                .ok_or_else(|| format!("{op} needs the ask of one seat"))?;
            let walk = request.get("walk").unwrap_or(&Value::Null);
            let bind_request = BindRequest {
                ask,
                runner,
                session,
                walk,
                account_state,
            };
            if op == "bind" {
                return Ok(bind(&bind_request, &machine, now)
                    .map(|binding| json!({ "binding": with_host_version(binding) })));
            }
            Ok(explain_seat(&bind_request, &machine, now).map(|seat| {
                let mut body = json!({
                    "binding": with_host_version(seat.binding),
                    "walk": seat.walk.into_iter().map(with_host_version).collect::<Vec<_>>(),
                });
                if let Some(output) = seat.output {
                    for key in ["policy", "ranked", "explain"] {
                        if let Some(value) = output.get(key).filter(|value| !value.is_null()) {
                            body[key] = value.clone();
                        }
                    }
                }
                if let Some(launch_view) = seat.launch_view {
                    body["launchView"] = launch_view;
                }
                body
            }))
        }
        "plan" => {
            let purpose = request.get("purpose").and_then(Value::as_str);
            let repo_root = request
                .get("repoRoot")
                .and_then(Value::as_str)
                .filter(|root| !root.is_empty())
                .ok_or_else(|| "plan needs the repoRoot a tool is probed under".to_string())?;
            let probe = HostProbe {
                repo_root: PathBuf::from(repo_root),
                path_env: machine.path_env.clone(),
                pathext: machine.pathext.clone(),
                env,
            };
            let binder = CrateBinder {
                machine: &machine,
                now,
            };
            Ok(
                purpose_seat_answer(runner, purpose, &probe, &binder).map(|mut seat| {
                    if let Some(binding) = seat.get_mut("binding") {
                        *binding = with_host_version(binding.take());
                    }
                    json!({ "seat": seat })
                }),
            )
        }
        _ => {
            let pin = match request.get("pin").filter(|pin| !pin.is_null()) {
                None => None,
                Some(pin) => {
                    let part = |key: &str| pin.get(key).and_then(Value::as_str).map(str::to_string);
                    let (Some(pool), Some(id)) = (part("pool"), part("id")) else {
                        return Err("preflight's pin names a pool and an id".into());
                    };
                    Some(AccountPin { pool, id })
                }
            };
            let answer = preflight(runner, &session, pin.as_ref(), account_state, &machine, now);
            Ok(Ok(json!({ "preflight": answer })))
        }
    }
}

/// A binding with the version of the host that bound it in its `bindingInput`; a refusal has none.
fn with_host_version(mut binding: Value) -> Value {
    if let Some(input) = binding
        .get_mut("bindingInput")
        .and_then(Value::as_object_mut)
    {
        input.insert("hostVersion".into(), json!(HOST_VERSION));
    }
    binding
}

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

// ---- the machine ------------------------------------------------------------------------------------------------

/// The bytes of `name` in `dir`, opened without following a link and read under the cap; `None` when it is
/// missing, a link, not a regular file, larger than the cap or unreadable.
#[cfg(unix)]
fn read_capped(dir: &Path, name: &str) -> Option<Vec<u8>> {
    let opened = fgos_durable_file::open_beneath(dir, Path::new(name)).ok()??;
    opened.read(MAX_FILE_BYTES).ok().map(|read| read.bytes)
}

/// No no-follow open exists here: a link is refused by its own metadata before the file is read.
#[cfg(not(unix))]
fn read_capped(dir: &Path, name: &str) -> Option<Vec<u8>> {
    let path = dir.join(name);
    let meta = std::fs::symlink_metadata(&path).ok()?;
    if !meta.is_file() || meta.len() > MAX_FILE_BYTES as u64 {
        return None;
    }
    let mut bytes = Vec::new();
    std::fs::File::open(&path)
        .ok()?
        .take(MAX_FILE_BYTES as u64 + 1)
        .read_to_end(&mut bytes)
        .ok()?;
    (bytes.len() <= MAX_FILE_BYTES).then_some(bytes)
}

/// Whether `program` can be started: a bare name found on `path_env`, or a path to an executable file.
fn startable(program: &str, path_env: &str, pathext: &str) -> bool {
    fgos_process::spawn::resolve_program(program, path_env, pathext, cfg!(windows)).is_some()
}

/// The machine this process runs on, with the session's own facts where the request states them.
struct HostMachine {
    path_env: String,
    pathext: String,
    herdr: bool,
    home: Option<String>,
    /// The machine confinement backend registry, when there is a valid one.
    registry: Option<Value>,
}

impl HostMachine {
    fn new(session: &Value, env: &dyn Fn(&str) -> Option<String>) -> Self {
        let herdr = match session.get("herdrPresent").and_then(Value::as_bool) {
            Some(stated) => stated,
            None => {
                env("HERDR_ENV").as_deref() == Some("1")
                    && env("HERDR_SOCKET_PATH")
                        .filter(|socket| !socket.is_empty())
                        .is_some_and(|socket| Path::new(&socket).exists())
            }
        };
        HostMachine {
            path_env: session
                .get("pathEnv")
                .and_then(Value::as_str)
                .map(str::to_string)
                .or_else(|| env("PATH"))
                .unwrap_or_default(),
            pathext: env("PATHEXT").unwrap_or_default(),
            herdr,
            home: fgos_config::machine::home_dir(env)
                .map(|home| home.to_string_lossy().into_owned()),
            registry: machine_registry(env),
        }
    }
}

/// The machine backend registry: the file `FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH` names, else the one in the
/// global fgOS directory. A missing, unreadable, invalid or foreign document carries nothing.
fn machine_registry(env: &dyn Fn(&str) -> Option<String>) -> Option<Value> {
    let path = env(REGISTRY_ENV)
        .filter(|path| !path.is_empty())
        .map(PathBuf::from)
        .or_else(|| fgos_config::machine::global_dir(env).map(|dir| dir.join(REGISTRY_FILE)))?;
    let dir = path.parent()?;
    let name = path.file_name()?.to_str()?;
    let document: Value = serde_json::from_slice(&read_capped(dir, name)?).ok()?;
    (document.get("contract") == Some(&json!(REGISTRY_CONTRACT))
        && document
            .get("confinementBackends")
            .is_some_and(Value::is_object))
    .then_some(document)
}

impl Machine for HostMachine {
    fn on_path(&self, program: &str) -> bool {
        startable(program, &self.path_env, &self.pathext)
    }

    fn posture_backend(&self, id: &str) -> Option<Backend> {
        let instance = self
            .registry
            .as_ref()?
            .get("confinementBackends")?
            .get(id)?;
        Some(Backend {
            enabled: instance.get("enabled") != Some(&json!(false)),
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
        self.herdr
    }

    fn home_dir(&self) -> Option<String> {
        self.home.clone()
    }
}

/// The tool probe over this machine and the repository a dispatch reads its config from.
struct HostProbe<'a> {
    repo_root: PathBuf,
    path_env: String,
    pathext: String,
    env: &'a dyn Fn(&str) -> Option<String>,
}

impl ToolProbe for HostProbe<'_> {
    fn present(&self, command: &str) -> bool {
        startable(command, &self.path_env, &self.pathext)
    }

    fn scan_target_exists(&self, scan_target: &str) -> bool {
        self.repo_root.join(scan_target).exists()
    }

    fn index_commit(&self, scan_target: &str) -> Option<String> {
        let bytes = read_capped(&self.repo_root.join(scan_target), "meta.json")?;
        serde_json::from_slice::<Value>(&bytes)
            .ok()?
            .get("lastCommit")?
            .as_str()
            .map(str::to_string)
    }

    fn head(&self) -> Head {
        let state_root = fgos_holder_lock::state_root::state_root_from(self.env).0;
        let read = || -> Result<Head, fgos_git::OperationError> {
            let driver = GitDriver::new(&state_root)?;
            match driver.resolve_repo(&self.repo_root, &self.repo_root)? {
                ResolveRepo::NotARepository => Ok(Head::NotARepository),
                ResolveRepo::Repository(repo) => {
                    Ok(match driver.resolve_commit_ref(&repo, "HEAD")? {
                        Some(oid) => Head::Commit(oid.as_str().to_string()),
                        None => Head::Unresolved,
                    })
                }
            }
        };
        // A Git port that cannot answer reads as a HEAD that does not resolve: no staleness is reported unseen.
        read().unwrap_or(Head::Unresolved)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn args(list: &[&str]) -> Vec<String> {
        list.iter().map(|a| a.to_string()).collect()
    }

    fn no_env(_: &str) -> Option<String> {
        None
    }

    #[test]
    fn ladder_answers_with_the_tier_vocabulary_and_the_host_version() {
        let (code, line) = run(&args(&["ladder", "--protocol", "2"]), r#"{"v":2}"#, &no_env);
        assert_eq!(code, 0);
        assert_eq!(line["result"], "ok");
        assert_eq!(line["protocol"], 2);
        assert_eq!(line["hostVersion"], HOST_VERSION);
        assert_eq!(line["ladder"]["vocabulary"].as_array().unwrap().len(), 6);
    }

    #[test]
    fn the_protocol_is_checked_before_the_operation() {
        for list in [
            &["ladder"][..],
            &["ladder", "--protocol", "1"][..],
            &["plan", "--protocol", "1"][..],
            &["nope", "--protocol", "1"][..],
            &["bind", "--protocol"][..],
        ] {
            let (code, line) = run(&args(list), r#"{"v":2}"#, &no_env);
            assert_eq!(code, EXIT_VERSION_MISMATCH, "{list:?}");
            assert_eq!(line["code"], "host-version-mismatch", "{list:?}");
        }
        let (code, line) = run(&args(&["ladder", "--protocol", "2"]), r#"{"v":1}"#, &no_env);
        assert_eq!(
            (code, line["code"].as_str()),
            (EXIT_VERSION_MISMATCH, Some("host-version-mismatch"))
        );
    }

    #[test]
    fn usage_faults_exit_two() {
        for list in [
            &["--protocol", "2"][..],
            &["nope", "--protocol", "2"][..],
            &["bind", "--protocol", "2", "--x"][..],
        ] {
            let (code, line) = run(&args(list), "{}", &no_env);
            assert_eq!(code, EXIT_USAGE, "{list:?}");
            assert_eq!(line["result"], "error");
            assert_eq!(line["code"], "usage");
        }
    }

    #[test]
    fn a_request_that_is_not_the_contract_is_invalid_not_a_decision() {
        for (op, stdin) in [
            ("bind", ""),
            ("bind", "not json"),
            ("bind", r#"{"v":2}"#),
            ("bind", r#"{"v":2,"runner":{},"now":1}"#),
            ("bind", r#"{"v":2,"runner":{},"ask":{}}"#),
            ("digest", r#"{"v":2,"runner":[]}"#),
            ("plan", r#"{"v":2,"runner":{},"now":1,"purpose":"x"}"#),
            (
                "preflight",
                r#"{"v":2,"runner":{},"now":1,"pin":{"pool":"p"}}"#,
            ),
        ] {
            let (code, line) = run(&args(&[op, "--protocol", "2"]), stdin, &no_env);
            assert_eq!(code, EXIT_INVALID_REQUEST, "{op} {stdin}");
            assert_eq!(line["code"], "invalid-request", "{op} {stdin}");
        }
    }

    #[test]
    fn a_decision_the_request_cannot_make_is_failed_with_its_error_class() {
        let stdin = r#"{"v":2,"runner":{},"now":1,"ask":{"unit":{"id":"u"},"overrides":[{"tier":"huge"}]}}"#;
        let (code, line) = run(&args(&["bind", "--protocol", "2"]), stdin, &no_env);
        assert_eq!(code, 0);
        assert_eq!(line["result"], "failed");
        assert_eq!(line["failure"]["name"], "RunnerConfigError");
    }

    #[test]
    fn the_session_states_herdr_presence_and_path_else_the_environment_does() {
        let socket = std::env::temp_dir();
        let socket_text = socket.to_string_lossy().into_owned();
        let env = move |key: &str| match key {
            "HERDR_ENV" => Some("1".to_string()),
            "HERDR_SOCKET_PATH" => Some(socket_text.clone()),
            "PATH" => Some("/from/env".to_string()),
            _ => None,
        };
        let machine = HostMachine::new(&json!({}), &env);
        assert!(machine.herdr_present());
        assert_eq!(machine.path_env, "/from/env");
        let stated = HostMachine::new(
            &json!({ "herdrPresent": false, "pathEnv": "/stated" }),
            &env,
        );
        assert!(!stated.herdr_present());
        assert_eq!(stated.path_env, "/stated");
    }

    #[test]
    fn an_empty_home_is_no_home() {
        let env = |key: &str| (key == "HOME").then(String::new);
        assert_eq!(HostMachine::new(&json!({}), &env).home_dir(), None);
    }
}
