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

use fgos_run_supervisor::go_channel::{read_frame, write_frame, MAX_FRAME_BYTES};
use fgos_run_supervisor::head_request::{Config, HeadRequests};
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
        holds_role: Box::new(move || holds.clone()),
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
    for holds in [Ok(false), Err("identity unreadable".to_string())] {
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
            "verb-failed",
            "verb-not-granted",
            "verb-timeout"
        ]
    );
    assert_eq!(contract["framing"]["maxFrameBytes"], MAX_FRAME_BYTES);
    assert_eq!(
        contract["run"]["verbTimeoutMs"],
        fgos_run_supervisor::head_request::VERB_TIMEOUT.as_millis() as u64
    );
}
