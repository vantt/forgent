//! The head request socket's wire contract and its enforcement
//! (`packages/run-supervisor/contracts/head-request.v1.json`): who may connect, what a frame may be, which
//! checks come in which order, one request at a time, a bounded verb, and the route child that runs it.
//! The route child is a script standing in for the host binary; what the verb itself does is the Node
//! payload's own proof. A wrong uid cannot be produced unprivileged, so that predicate is unit-tested in
//! `src/head_request.rs`.
#![cfg(unix)]

use std::collections::BTreeMap;
use std::fs;
use std::io::Write;
use std::os::unix::fs::{OpenOptionsExt, PermissionsExt};
use std::os::unix::net::{UnixListener, UnixStream};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread::JoinHandle;
use std::time::{Duration, Instant};

use fgos_identity::resolve::{HeadRef, WriterKey, ENV_ORDER};
use fgos_process::{facts, ProcId};
use fgos_run_supervisor::go_channel::{read_frame, write_frame, MAX_FRAME_BYTES};
use fgos_run_supervisor::head_request::{
    identity_holds, identity_registered, identity_take, Config, HeadRequests, HoldError,
};
use serde_json::{json, Value};

struct Served {
    dir: PathBuf,
    socket: PathBuf,
    log: Arc<Mutex<Vec<String>>>,
    stop: Arc<AtomicBool>,
    pump: Option<JoinHandle<()>>,
    /// The longest one `poll` call took: the supervisor's tick must never wait on a request.
    slowest_poll: Arc<Mutex<Duration>>,
}

impl Drop for Served {
    fn drop(&mut self) {
        self.stop.store(true, Ordering::SeqCst);
        if let Some(pump) = self.pump.take() {
            let _ = pump.join();
        }
        let _ = fs::remove_dir_all(&self.dir);
    }
}

/// A server over a script that stands in for the host binary, polled the way the supervisor's tick polls it.
fn serve(
    name: &str,
    script_body: &str,
    holds: Result<bool, String>,
    verbs: &[&str],
    timeout: Duration,
) -> Served {
    serve_with(
        name,
        script_body,
        holds,
        Identity::default(),
        verbs,
        timeout,
    )
}

/// What the answered verb asks Identity: is the attempt registered, and the move of the role (counted).
struct Identity {
    registered: Result<bool, String>,
    take: Result<(), String>,
    took: Arc<Mutex<u32>>,
}

impl Default for Identity {
    fn default() -> Identity {
        Identity {
            registered: Ok(true),
            take: Ok(()),
            took: Arc::new(Mutex::new(0)),
        }
    }
}

fn serve_with(
    name: &str,
    script_body: &str,
    holds: Result<bool, String>,
    identity: Identity,
    verbs: &[&str],
    timeout: Duration,
) -> Served {
    let dir = std::env::temp_dir().join(format!("fgos-head-req-{name}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    let script = dir.join("host.sh");
    let mut file = fs::OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(true)
        .mode(0o755)
        .open(&script)
        .unwrap();
    file.write_all(format!("#!/bin/sh\n{script_body}\n").as_bytes())
        .unwrap();
    drop(file);
    fs::set_permissions(&script, fs::Permissions::from_mode(0o755)).unwrap();

    let socket = dir.join("req.sock");
    let listener = UnixListener::bind(&socket).unwrap();
    listener.set_nonblocking(true).unwrap();
    let log = Arc::new(Mutex::new(Vec::new()));
    let sink = log.clone();
    let server = HeadRequests::new(Config {
        run_dir: dir.clone(),
        host_bin: script.to_string_lossy().into_owned(),
        cwd: dir.clone(),
        env: BTreeMap::from([("OUT".to_string(), dir.to_string_lossy().into_owned())]),
        verbs: verbs.iter().map(|v| v.to_string()).collect(),
        verb_timeout: timeout,
        holds_role: Box::new(move || {
            holds.clone().map_err(|code| HoldError {
                code,
                detail: "internal identity text".into(),
            })
        }),
        registered: Box::new({
            let registered = identity.registered.clone();
            move || {
                registered.clone().map_err(|code| HoldError {
                    code,
                    detail: "internal identity text".into(),
                })
            }
        }),
        take_role: Box::new({
            let (take, took) = (identity.take.clone(), identity.took.clone());
            move || {
                *took.lock().unwrap() += 1;
                take.clone().map_err(|code| HoldError {
                    code,
                    detail: "internal identity text".into(),
                })
            }
        }),
        log: Box::new(move |line| sink.lock().unwrap().push(line.to_string())),
    });
    let stop = Arc::new(AtomicBool::new(false));
    let slowest = Arc::new(Mutex::new(Duration::ZERO));
    let (stop_flag, slowest_poll) = (stop.clone(), slowest.clone());
    let pump = std::thread::spawn(move || {
        while !stop_flag.load(Ordering::SeqCst) {
            let at = Instant::now();
            server.poll(&listener);
            let took = at.elapsed();
            let mut worst = slowest_poll.lock().unwrap();
            *worst = (*worst).max(took);
            drop(worst);
            std::thread::sleep(Duration::from_millis(10));
        }
    });
    Served {
        dir,
        socket,
        log,
        stop,
        pump: Some(pump),
        slowest_poll: slowest,
    }
}

const DONE_LINE: &str = r#"cat > "$OUT/stdin.json"; echo "$@" > "$OUT/argv"; echo '{"v":1,"protocol":1,"result":"done","data":{"key":"head-planner-x-1"}}'"#;

fn granted(name: &str, body: &str) -> Served {
    serve(
        name,
        body,
        Ok(true),
        &["head start"],
        Duration::from_secs(20),
    )
}

fn request(socket: &Path, frame: &Value) -> Value {
    let mut stream = UnixStream::connect(socket).unwrap();
    stream
        .set_read_timeout(Some(Duration::from_secs(15)))
        .unwrap();
    write_frame(&mut stream, frame).unwrap();
    read_frame(&mut stream).expect("a REPLY frame")
}

fn ask(socket: &Path, verb: &str) -> Value {
    request(
        socket,
        &json!({"type": "REQUEST", "id": "r1", "verb": verb, "args": {"persona": "planner", "name": "x"}}),
    )
}

fn wait_for_log(served: &Served, needle: &str) -> Vec<String> {
    let until = Instant::now() + Duration::from_secs(5);
    loop {
        let lines = served.log.lock().unwrap().clone();
        if lines.iter().any(|l| l.contains(needle)) || Instant::now() > until {
            return lines;
        }
        std::thread::sleep(Duration::from_millis(10));
    }
}

#[test]
fn a_granted_request_runs_the_route_child_and_returns_its_line() {
    let served = granted("granted", DONE_LINE);
    let reply = ask(&served.socket, "head start");
    assert_eq!(reply["type"], "REPLY");
    assert_eq!(reply["id"], "r1");
    assert_eq!(reply["result"], "done");
    assert_eq!(reply["data"]["key"], "head-planner-x-1");
    let argv = fs::read_to_string(served.dir.join("argv")).unwrap();
    assert!(
        argv.starts_with("internal head-request --protocol 1 --run-dir "),
        "{argv}"
    );
    let stdin: Value =
        serde_json::from_str(&fs::read_to_string(served.dir.join("stdin.json")).unwrap()).unwrap();
    assert_eq!(stdin["verb"], "head start");
    assert_eq!(stdin["args"]["persona"], "planner");
    // One log line per request, never its arguments.
    let lines = wait_for_log(&served, "done");
    assert_eq!(lines, vec!["head-request r1 head start done -"]);
}

#[test]
fn a_role_identity_does_not_give_this_session_is_refused_before_the_verb_is_looked_at() {
    for holds in [Ok(false), Err("machine-id-missing".to_string())] {
        let failed = holds.is_err();
        let served = serve(
            "role",
            DONE_LINE,
            holds,
            &["head start"],
            Duration::from_secs(5),
        );
        let reply = ask(&served.socket, "not even a verb");
        assert_eq!(reply["result"], "refused");
        assert_eq!(reply["code"], "role-not-held");
        assert!(!served.dir.join("argv").exists(), "no route child ran");
        if failed {
            // The client is told Identity's code only; its text goes to the log.
            assert_eq!(reply["detail"], "machine-id-missing");
            let lines = wait_for_log(&served, "internal identity text");
            assert!(
                lines
                    .iter()
                    .any(|l| l
                        == "head-request r1 identity machine-id-missing: internal identity text"),
                "{lines:?}"
            );
        } else {
            assert!(reply.get("detail").is_none());
        }
    }
}

#[test]
fn a_verb_the_envelope_does_not_grant_is_refused() {
    let served = granted("verb", DONE_LINE);
    let reply = ask(&served.socket, "land");
    assert_eq!(reply["code"], "verb-not-granted");
    assert!(!served.dir.join("argv").exists());
    assert_eq!(
        wait_for_log(&served, "refused"),
        vec!["head-request r1 land refused verb-not-granted"]
    );
}

#[test]
fn an_oversize_or_malformed_frame_gets_bad_frame_and_the_connection_closes() {
    let served = granted("frame", DONE_LINE);
    let mut oversize = UnixStream::connect(&served.socket).unwrap();
    oversize
        .set_read_timeout(Some(Duration::from_secs(10)))
        .unwrap();
    oversize
        .write_all(&((MAX_FRAME_BYTES + 1) as u32).to_be_bytes())
        .unwrap();
    let reply = read_frame(&mut oversize).expect("a refusal");
    assert_eq!(
        (reply["result"].as_str(), reply["code"].as_str()),
        (Some("refused"), Some("bad-frame"))
    );
    assert!(
        read_frame(&mut oversize).is_err(),
        "closed after the refusal"
    );
    for frame in [
        json!({"type": "HELLO", "id": "r1", "verb": "head start", "args": {}}),
        json!({"type": "REQUEST", "id": "bad id!", "verb": "head start", "args": {}}),
        json!({"type": "REQUEST", "id": "r1", "verb": "head start", "args": []}),
    ] {
        assert_eq!(
            request(&served.socket, &frame)["code"],
            "bad-frame",
            "{frame}"
        );
    }
    assert!(!served.dir.join("argv").exists());
}

#[test]
fn a_second_request_while_one_runs_is_busy_and_the_tick_is_never_held() {
    let served = granted(
        "busy",
        r#"cat > /dev/null; sleep 1; echo '{"v":1,"protocol":1,"result":"done","data":{}}'"#,
    );
    let socket = served.socket.clone();
    let first = std::thread::spawn(move || ask(&socket, "head start"));
    std::thread::sleep(Duration::from_millis(400));
    assert_eq!(ask(&served.socket, "head start")["code"], "busy");
    assert_eq!(first.join().unwrap()["result"], "done");
    assert!(
        *served.slowest_poll.lock().unwrap() < Duration::from_millis(250),
        "a pending request held the supervisor's poll"
    );
    // After it ended the next one runs again.
    assert_eq!(ask(&served.socket, "head start")["result"], "done");
}

#[test]
fn a_verb_that_outlives_its_limit_is_killed_and_refused_verb_timeout() {
    let served = serve(
        "timeout",
        "cat > /dev/null; sleep 30",
        Ok(true),
        &["head start"],
        Duration::from_millis(400),
    );
    let started = Instant::now();
    let reply = ask(&served.socket, "head start");
    assert_eq!(reply["code"], "verb-timeout");
    assert!(started.elapsed() < Duration::from_secs(10));
}

#[test]
fn a_failing_route_child_is_verb_failed_with_its_own_code_in_the_detail() {
    let served = granted(
        "failed",
        r#"cat > /dev/null; echo '{"v":1,"protocol":1,"result":"error","code":"head-key-used","message":"x"}'; exit 70"#,
    );
    let reply = ask(&served.socket, "head start");
    assert_eq!(reply["result"], "refused");
    assert_eq!(reply["code"], "verb-failed");
    assert_eq!(reply["detail"], "head-key-used");

    let silent = granted("silent", "cat > /dev/null; exit 3");
    let reply = ask(&silent.socket, "head start");
    assert_eq!(reply["code"], "verb-failed");
    assert_eq!(reply["detail"], "the route ended with exit 3");
}

#[test]
fn the_contract_names_exactly_the_refusal_codes_and_verbs_the_server_speaks() {
    let contract: Value =
        serde_json::from_str(include_str!("../../contracts/head-request.v1.json")).unwrap();
    let mut codes: Vec<&str> = contract["refusalCodes"]
        .as_object()
        .unwrap()
        .keys()
        .map(String::as_str)
        .collect();
    codes.sort();
    assert_eq!(
        codes,
        [
            "bad-frame",
            "busy",
            "peer-uid",
            "role-not-held",
            "role-take-failed",
            "session-not-registered",
            "verb-failed",
            "verb-not-granted",
            "verb-timeout"
        ]
    );
    let mut verbs: Vec<&str> = contract["verbs"]
        .as_object()
        .unwrap()
        .keys()
        .map(String::as_str)
        .collect();
    verbs.sort();
    assert_eq!(verbs, ["head answered", "head rotate", "head start"]);
    assert_eq!(
        contract["verbs"][fgos_run_supervisor::head_request::ANSWERED_VERB]["identity"],
        "registered-then-take"
    );
    assert_eq!(contract["framing"]["maxFrameBytes"], MAX_FRAME_BYTES);
    assert_eq!(
        contract["run"]["verbTimeoutMs"],
        fgos_run_supervisor::head_request::VERB_TIMEOUT.as_millis() as u64
    );
}

// ---- Identity's side of the role check, against a real state root -----------------------------------

fn state_root(name: &str, machine_id: bool) -> PathBuf {
    let root = std::env::temp_dir().join(format!("fgos-head-id-{name}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&root);
    fs::create_dir_all(&root).unwrap();
    if machine_id {
        fs::write(root.join("machine-id"), "fg-abc234\n").unwrap();
    }
    root
}

/// Registers the attempt `writer_id` as a live session (this test process is its head) holding `roles`.
fn register(root: &Path, writer_id: &str, roles: &[&str]) {
    let pid = std::process::id();
    let head = HeadRef {
        pid,
        start_time: facts::identity_of(ProcId(pid)).unwrap().start_time,
    };
    let key = WriterKey {
        source: ENV_ORDER[0],
        value: writer_id,
    };
    let roles: Vec<String> = roles.iter().map(|r| r.to_string()).collect();
    fgos_identity::directory::register_writer(root, None, &key, &head, &roles, false)
        .unwrap_or_else(|r| panic!("register {writer_id}: {} {}", r.reason, r.detail));
}

#[test]
fn identity_gives_the_role_only_to_the_attempts_own_session_and_fails_closed_when_it_cannot_answer()
{
    let role = "head:planner-x";
    // (a) the attempt's own session holds the role.
    let own = state_root("own", true);
    register(&own, "att-own", &[role]);
    assert_eq!(identity_holds(&own, role, "att-own"), Ok(true));
    // (b) another live session holds it, or nobody does.
    let other = state_root("other", true);
    register(&other, "att-other", &[role]);
    register(&other, "att-own", &[]);
    assert_eq!(identity_holds(&other, role, "att-own"), Ok(false));
    assert_eq!(
        identity_holds(&other, role, "att-never-registered"),
        Ok(false)
    );
    let none = state_root("none", true);
    register(&none, "att-own", &[]);
    assert_eq!(identity_holds(&none, role, "att-own"), Ok(false));
    // (c) Identity cannot answer: an error with its refusal code, never a yes.
    let broken = state_root("broken", false);
    let err = identity_holds(&broken, role, "att-own").unwrap_err();
    assert!(err.code.starts_with("machine-id"), "{err:?}");
    assert!(!err.detail.is_empty());
}

// ---- the envelope a server is built from ---------------------------------------------------------

fn session_envelope(dir: &Path, script: &Path) -> Value {
    json!({
        "hostBin": script,
        "cwd": dir,
        "identity": {"writerId": "att-own"},
        "session": {"role": "head:planner-x", "verbs": ["head start"], "requestSocketPath": dir.join("req.sock")},
        "steps": [
            {"stepId": "release-slot", "builtin": true},
            {"stepId": "finalize-home", "env": {"OUT": dir, "FOO": "first"}},
            {"stepId": "cleanup-trust", "env": {"FOO": "second"}}
        ]
    })
}

#[test]
fn an_envelope_that_cannot_serve_a_socket_is_envelope_invalid_and_one_without_a_session_asks_for_none(
) {
    let dir = std::env::temp_dir().join(format!("fgos-head-env-bad-{}", std::process::id()));
    fs::create_dir_all(&dir).unwrap();
    let root = state_root("env-bad", true);
    let script = dir.join("host.sh");
    let build = |shape: &dyn Fn(&mut Value)| {
        let mut envelope = session_envelope(&dir, &script);
        shape(&mut envelope);
        HeadRequests::from_envelope(&envelope, &dir, &root)
    };
    let invalid = |result: Result<_, fgos_run_supervisor::head_request::EnvelopeError>,
                   needle: &str| {
        let err = result.err().expect("refused");
        assert_eq!(err.code, "envelope-invalid");
        assert!(err.why.contains(needle), "{}", err.why);
    };
    invalid(
        build(&|e| {
            e["session"]
                .as_object_mut()
                .unwrap()
                .remove("requestSocketPath");
        }),
        "requestSocketPath is missing",
    );
    invalid(
        build(&|e| e["session"]["verbs"] = json!([])),
        "verbs is empty",
    );
    invalid(
        build(&|e| e["steps"] = json!([{"stepId": "release-slot", "builtin": true}])),
        "no process step",
    );
    invalid(
        build(&|e| {
            e["identity"] = json!({});
        }),
        "identity.writerId",
    );
    assert!(build(&|e| e["session"] = Value::Null).unwrap().is_none());
    assert!(
        build(&|e| {
            e["session"] = json!({"role": "head:planner-x", "verbs": []});
        })
        .unwrap()
        .is_none(),
        "no verbs, no socket"
    );
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn a_server_built_from_an_envelope_runs_the_route_with_the_first_process_steps_environment_only() {
    let dir = std::env::temp_dir().join(format!("fgos-head-env-ok-{}", std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    let script = dir.join("host.sh");
    let mut file = fs::OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(true)
        .mode(0o755)
        .open(&script)
        .unwrap();
    file.write_all(
        br#"#!/bin/sh
cat > /dev/null
env > "$OUT/env.txt"
echo '{"v":1,"protocol":1,"result":"done","data":{"ok":true}}'
"#,
    )
    .unwrap();
    drop(file);
    let root = state_root("env-ok", true);
    let envelope = session_envelope(&dir, &script);
    // The attempt's own session holds the role in the real Identity, so the whole check runs unstubbed.
    register(&root, "att-own", &["head:planner-x"]);
    let (path, server) = HeadRequests::from_envelope(&envelope, &dir, &root)
        .unwrap()
        .expect("a socket");
    assert_eq!(path, dir.join("req.sock"));
    let listener = UnixListener::bind(&path).unwrap();
    listener.set_nonblocking(true).unwrap();
    let stop = Arc::new(AtomicBool::new(false));
    let flag = stop.clone();
    let pump = std::thread::spawn(move || {
        while !flag.load(Ordering::SeqCst) {
            server.poll(&listener);
            std::thread::sleep(Duration::from_millis(10));
        }
    });
    let reply = ask(&path, "head start");
    stop.store(true, Ordering::SeqCst);
    pump.join().unwrap();
    assert_eq!(reply["result"], "done", "{reply}");
    let env = fs::read_to_string(dir.join("env.txt")).unwrap();
    assert!(env.lines().any(|l| l == "FOO=first"), "{env}");
    assert!(env.lines().any(|l| l.starts_with("OUT=")));
    assert!(
        !env.contains("second") && !env.lines().any(|l| l.starts_with("HOME=")),
        "nothing but the step environment: {env}"
    );

    // The same server with a state root Identity cannot read refuses closed and names only the code.
    let broken = state_root("env-broken", false);
    let (path, server) = HeadRequests::from_envelope(&envelope, &dir, &broken)
        .unwrap()
        .unwrap();
    let _ = fs::remove_file(&path);
    let listener = UnixListener::bind(&path).unwrap();
    listener.set_nonblocking(true).unwrap();
    let stop = Arc::new(AtomicBool::new(false));
    let flag = stop.clone();
    let pump = std::thread::spawn(move || {
        while !flag.load(Ordering::SeqCst) {
            server.poll(&listener);
            std::thread::sleep(Duration::from_millis(10));
        }
    });
    let reply = ask(&path, "head start");
    stop.store(true, Ordering::SeqCst);
    pump.join().unwrap();
    assert_eq!(reply["code"], "role-not-held");
    assert!(
        reply["detail"].as_str().unwrap().starts_with("machine-id"),
        "{reply}"
    );
    let _ = fs::remove_dir_all(&dir);
}

// ---- the successor's verb: registered, not yet holding the role ----------------------------------

const ANSWERED: &str = "head answered";

fn answered_server(name: &str, body: &str, identity: Identity) -> Served {
    // The role is held by the predecessor: the role check would refuse, the registered check must not.
    serve_with(
        name,
        body,
        Ok(false),
        identity,
        &[ANSWERED, "head start"],
        Duration::from_secs(20),
    )
}

#[test]
fn the_answered_verb_needs_only_a_registered_session_and_moves_the_role_after_the_route_says_done()
{
    let identity = Identity::default();
    let took = identity.took.clone();
    let served = answered_server("answered-ok", DONE_LINE, identity);
    let reply = ask(&served.socket, ANSWERED);
    assert_eq!(reply["result"], "done", "{reply}");
    assert_eq!(*took.lock().unwrap(), 1, "the role moves once, after done");
    assert_eq!(
        served.log.lock().unwrap().clone(),
        vec!["head-request r1 head answered done -"]
    );
    // Another verb of the same successor is still checked against the role it does not hold yet.
    let refused = ask(&served.socket, "head start");
    assert_eq!(refused["code"], "role-not-held");
    assert_eq!(
        *took.lock().unwrap(),
        1,
        "only the answered verb moves a role"
    );
}

#[test]
fn the_answered_verb_refuses_an_unregistered_session_and_never_runs_the_route_or_moves_the_role() {
    let identity = Identity {
        registered: Ok(false),
        ..Identity::default()
    };
    let took = identity.took.clone();
    let served = answered_server("answered-unregistered", DONE_LINE, identity);
    let reply = ask(&served.socket, ANSWERED);
    assert_eq!(reply["code"], "session-not-registered");
    assert!(!served.dir.join("argv").exists(), "the route did not run");
    assert_eq!(*took.lock().unwrap(), 0);
    let broken = Identity {
        registered: Err("machine-id-missing".into()),
        ..Identity::default()
    };
    let served = answered_server("answered-broken", DONE_LINE, broken);
    let reply = ask(&served.socket, ANSWERED);
    assert_eq!(reply["code"], "session-not-registered");
    assert_eq!(
        reply["detail"], "machine-id-missing",
        "only Identity's code reaches the client"
    );
}

#[test]
fn a_route_that_refuses_the_answer_moves_no_role_and_a_failed_move_is_named() {
    let identity = Identity::default();
    let took = identity.took.clone();
    let served = answered_server(
        "answered-refused",
        r#"cat > /dev/null; echo '{"v":1,"protocol":1,"result":"error","code":"answer-mismatch","message":"x"}'; exit 70"#,
        identity,
    );
    let reply = ask(&served.socket, ANSWERED);
    assert_eq!(reply["code"], "verb-failed");
    assert_eq!(reply["detail"], "answer-mismatch");
    assert_eq!(
        *took.lock().unwrap(),
        0,
        "no role moved on a refused answer"
    );

    let failing = Identity {
        take: Err("head-not-live".into()),
        ..Identity::default()
    };
    let served = answered_server("answered-take-fails", DONE_LINE, failing);
    let reply = ask(&served.socket, ANSWERED);
    assert_eq!(reply["code"], "role-take-failed");
    assert_eq!(reply["detail"], "head-not-live");
}

#[test]
fn identity_registers_a_successor_without_the_role_and_take_moves_it_from_the_predecessor() {
    let role = "head:planner-x";
    let root = state_root("take", true);
    register(&root, "att-old", &[role]);
    register(&root, "att-new", &[]);
    assert_eq!(identity_registered(&root, "att-new"), Ok(true));
    assert_eq!(
        identity_registered(&root, "att-never-registered"),
        Ok(false)
    );
    assert_eq!(identity_holds(&root, role, "att-new"), Ok(false));

    let pid = std::process::id();
    let head = HeadRef {
        pid,
        start_time: facts::identity_of(ProcId(pid)).unwrap().start_time,
    };
    identity_take(&root, &root, role, "att-new", &head).expect("take");
    assert_eq!(identity_holds(&root, role, "att-new"), Ok(true));
    assert_eq!(identity_holds(&root, role, "att-old"), Ok(false));

    let broken = state_root("take-broken", false);
    assert!(identity_registered(&broken, "att-new")
        .unwrap_err()
        .code
        .starts_with("machine-id"));
}
