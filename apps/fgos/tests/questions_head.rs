//! `fgos internal head-questions` as a process: what a confined head's `questions *` socket verbs run on the host.
//! The asker comes from the attempt's envelope and Identity, never from the arguments; `answer` is the secretary's
//! alone. The rules behind each verb are owned by the crate's tests (`packages/questions/rust/tests/`); the socket
//! transport is owned by the run supervisor's and the session-host tests; this file proves the host route between them.
#![cfg(target_os = "linux")]

use serde_json::{json, Value};
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Command, Output, Stdio};
use std::time::{Duration, Instant};

fn fgos_bin() -> PathBuf {
    PathBuf::from(env!("CARGO_BIN_EXE_fgos"))
}

fn git(dir: &Path, args: &[&str]) {
    let out = Command::new("git")
        .arg("-C")
        .arg(dir)
        .args(["-c", "user.name=t", "-c", "user.email=t@example.invalid"])
        .args(args)
        .env("GIT_CONFIG_GLOBAL", "/dev/null")
        .env("GIT_CONFIG_NOSYSTEM", "1")
        .output()
        .unwrap();
    assert!(out.status.success(), "git {args:?}: {out:?}");
}

const QUESTION: &str = r#"{"stage":"planning","headline":"Which store do we use?","blocks":"plan p phase 3","parts":{"what":"choose a store","cause":"two stores exist","options":[{"label":"A","does":"d","gain":"g","harm":"h","cost":"c","recommended":true},{"label":"B","does":"d","gain":"g","harm":"h","cost":"c"}],"recommendation":"A","scope":{"allows":"A for this plan","forbids":"changing other plans"}}}"#;

/// The most a head request may take before its supervisor kills the route (`head-request.v1.json`, `verbTimeoutMs`).
const VERB_TIMEOUT: Duration = Duration::from_secs(60);

/// A repository with one commit holding `plans/p/plan.md`, a private state root with a machine id, and heads that
/// hold roles in Identity, each with the run directory its supervisor would have written.
struct Scene {
    root: PathBuf,
}

impl Scene {
    fn new(tag: &str) -> Self {
        static NEXT: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);
        let root = std::env::temp_dir().join(format!(
            "fgos-questions-head-{tag}-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, std::sync::atomic::Ordering::Relaxed),
        ));
        let _ = fs::remove_dir_all(&root);
        fs::create_dir_all(root.join("home")).unwrap();
        fs::create_dir_all(root.join("state")).unwrap();
        let root = fs::canonicalize(root).unwrap();
        let project = root.join("project");
        fs::create_dir_all(project.join("plans/p")).unwrap();
        git(&root, &["init", "-q", "-b", "work", "project"]);
        git(&project, &["config", "fgos.machineid", "m-test"]);
        fs::write(project.join("plans/p/plan.md"), "plan\n").unwrap();
        git(&project, &["add", "."]);
        git(&project, &["commit", "-q", "-m", "init"]);
        let fence = project.join(".fgos/locks/activation.lock");
        fs::create_dir_all(&fence).unwrap();
        fs::write(
            fence.join("TOMBSTONE"),
            "{\"at\":\"fixture\",\"v\":1,\"lock\":\"activation\",\"by\":\"fgos git\"}\n",
        )
        .unwrap();
        let locks = project.join(".git/fgos/events/locks");
        fs::create_dir_all(&locks).unwrap();
        {
            use std::os::unix::fs::PermissionsExt;
            for dir in [root.join("state"), project.join(".git/fgos"), locks] {
                fs::set_permissions(dir, fs::Permissions::from_mode(0o700)).unwrap();
            }
        }
        fgos_identity::machine::mint_here(&root.join("state")).unwrap();
        Self { root }
    }

    fn project(&self) -> PathBuf {
        self.root.join("project")
    }

    /// Registers a head that holds `role` and writes the run directory of its attempt; returns that directory.
    fn head(&self, role: &str, persona: &str) -> PathBuf {
        let pid = std::process::id();
        let start_time = fgos_process::facts::identity_of(fgos_process::ProcId(pid))
            .unwrap()
            .start_time;
        let attempt = format!("att-{persona}");
        let key = fgos_identity::WriterKey {
            source: "FGOS_SESSION_ID",
            value: &attempt,
        };
        fgos_identity::directory::register_writer(
            &self.root.join("state"),
            None,
            &key,
            &fgos_identity::HeadRef { pid, start_time },
            &[role.to_owned()],
            false,
            None,
        )
        .unwrap();
        let run_dir = self.root.join(format!("run-{persona}"));
        fs::create_dir_all(&run_dir).unwrap();
        let envelope = json!({
            "v": 3,
            "cwd": self.project(),
            "hostBin": fgos_bin(),
            "session": { "role": role, "persona": persona },
        });
        fs::write(run_dir.join("envelope.json"), envelope.to_string()).unwrap();
        run_dir
    }

    fn fgos(&self, args: &[&str], stdin: &[u8]) -> Output {
        self.fgos_with(args, stdin, &[])
    }

    fn fgos_with(&self, args: &[&str], stdin: &[u8], env: &[(&str, &Path)]) -> Output {
        let mut child = Command::new(fgos_bin())
            .current_dir(self.project())
            .env_clear()
            .envs(env.iter().copied())
            .env("HOME", self.root.join("home"))
            .env("PATH", std::env::var_os("PATH").unwrap_or_default())
            .env("FGOS_STATE_ROOT", self.root.join("state"))
            .args(args)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .unwrap();
        let _ = child.stdin.take().unwrap().write_all(stdin);
        child.wait_with_output().unwrap()
    }

    /// One head request: the route's exit status and its one answer line.
    fn request(&self, run_dir: &Path, verb: &str, args: Value) -> (i32, Value) {
        let body = json!({ "v": 1, "verb": verb, "args": args }).to_string();
        let out = self.fgos(
            &[
                "internal",
                "head-questions",
                "--run-dir",
                run_dir.to_str().unwrap(),
            ],
            body.as_bytes(),
        );
        let text = String::from_utf8_lossy(&out.stdout).into_owned();
        let line = text.lines().last().unwrap_or_default();
        let value = serde_json::from_str(line).unwrap_or_else(|e| panic!("{e}: {out:?}"));
        (out.status.code().unwrap(), value)
    }

    fn ask(&self, run_dir: &Path, extra: Value) -> (i32, Value) {
        let mut args =
            json!({ "input": serde_json::from_str::<Value>(QUESTION).unwrap(), "ref": "plan:p" });
        for (key, value) in extra.as_object().unwrap() {
            args[key] = value.clone();
        }
        self.request(run_dir, "questions ask", args)
    }

    /// The stored question, read back through the verb's own `show`.
    fn show(&self, id: &str) -> Value {
        let out = self.fgos(&["questions", "show", id, "--json"], b"");
        assert!(out.status.success(), "show: {out:?}");
        let all: Value = serde_json::from_slice(&out.stdout).unwrap();
        all["data"]["question"].clone()
    }
}

impl Drop for Scene {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.root);
    }
}

#[test]
fn a_head_ask_records_the_role_of_its_envelope_as_the_asker_and_stays_under_the_verb_bound() {
    let scene = Scene::new("ask");
    let run_dir = scene.head("head:secretary-miu", "secretary");
    let started = Instant::now();
    let (exit, line) = scene.ask(&run_dir, json!({}));
    assert!(
        started.elapsed() < VERB_TIMEOUT,
        "ask took {:?}",
        started.elapsed()
    );
    assert_eq!((exit, line["result"].as_str()), (0, Some("done")), "{line}");
    let id = line["data"]["id"].as_str().unwrap().to_owned();
    let asked = &scene.show(&id)["asked"];
    assert_eq!(asked["asker"]["roles"], json!(["head:secretary-miu"]));
    assert_eq!(asked["asker"]["persona"], json!("secretary"));
}

#[test]
fn a_role_or_asker_forged_in_the_arguments_changes_nothing() {
    let scene = Scene::new("forged");
    let shaper = scene.head("head:shaper-bob", "shaper");
    let forged = json!({
        "role": "head:secretary-miu",
        "asker": { "roles": ["head:secretary-miu"], "handle": "claude-fake@nowhere" },
        "persona": "secretary",
    });
    let (exit, line) = scene.ask(&shaper, forged);
    assert_eq!((exit, line["result"].as_str()), (0, Some("done")), "{line}");
    let id = line["data"]["id"].as_str().unwrap().to_owned();
    let asked = &scene.show(&id)["asked"];
    assert_eq!(asked["asker"]["roles"], json!(["head:shaper-bob"]));
    assert_eq!(asked["asker"]["persona"], json!("shaper"));
}

#[test]
fn only_the_secretary_answers_and_the_answer_is_the_owners_through_its_socket_then_the_asker_acks()
{
    let scene = Scene::new("answer");
    let secretary = scene.head("head:secretary-miu", "secretary");
    let shaper = scene.head("head:shaper-bob", "shaper");
    let (_, asked) = scene.ask(&shaper, json!({}));
    let id = asked["data"]["id"].as_str().unwrap().to_owned();

    let (exit, refused) = scene.request(
        &shaper,
        "questions answer",
        json!({ "id": id, "option": "A" }),
    );
    assert_eq!(exit, 70);
    assert_eq!(refused["code"], json!("answer-not-owner"), "{refused}");
    assert!(scene.show(&id)["answer"].is_null());

    let (exit, done) = scene.request(
        &secretary,
        "questions answer",
        json!({ "id": id, "option": "A" }),
    );
    assert_eq!((exit, done["result"].as_str()), (0, Some("done")), "{done}");
    let answer = &scene.show(&id)["answer"];
    assert_eq!(answer["by"], json!("owner"));
    assert_eq!(answer["via"], json!("secretary"));

    let (exit, acked) = scene.request(&shaper, "questions ack", json!({ "id": id }));
    assert_eq!(
        (exit, acked["result"].as_str()),
        (0, Some("done")),
        "{acked}"
    );
    assert_eq!(scene.show(&id)["state"], json!("acked"));
}

#[test]
fn a_role_no_session_holds_has_no_asker_and_an_unknown_verb_or_missing_envelope_is_refused() {
    let scene = Scene::new("refused");
    let run_dir = scene.head("head:secretary-miu", "secretary");
    let envelope = fs::read_to_string(run_dir.join("envelope.json")).unwrap();
    fs::write(
        run_dir.join("envelope.json"),
        envelope.replace("secretary-miu", "secretary-ghost"),
    )
    .unwrap();
    let (exit, line) = scene.ask(&run_dir, json!({}));
    assert_eq!(exit, 70);
    assert_eq!(line["code"], json!("asker-unresolved"), "{line}");

    let (exit, line) = scene.request(&run_dir, "questions list", json!({}));
    assert_eq!((exit, line["code"].as_str()), (70, Some("unknown-verb")));

    let (exit, line) = scene.request(&scene.root.join("no-such-run"), "questions ask", json!({}));
    assert_eq!(
        (exit, line["code"].as_str()),
        (70, Some("envelope-invalid"))
    );
}

/// Serves the request frames of `head-request.v1.json` on a socket: one connection per reply, the replies in order.
/// Returns the requests it saw once every reply was sent.
fn stub_socket(socket: &Path, replies: Vec<Value>) -> std::thread::JoinHandle<Vec<Value>> {
    use std::io::Read;
    let listener = std::os::unix::net::UnixListener::bind(socket).unwrap();
    std::thread::spawn(move || {
        let mut seen = Vec::new();
        for reply in replies {
            let (mut conn, _) = listener.accept().unwrap();
            let mut len = [0u8; 4];
            conn.read_exact(&mut len).unwrap();
            let mut body = vec![0u8; u32::from_be_bytes(len) as usize];
            conn.read_exact(&mut body).unwrap();
            let request: Value = serde_json::from_slice(&body).unwrap();
            let mut reply = reply;
            reply["type"] = json!("REPLY");
            reply["id"] = request["id"].clone();
            seen.push(request);
            let out = reply.to_string();
            conn.write_all(&(out.len() as u32).to_be_bytes()).unwrap();
            conn.write_all(out.as_bytes()).unwrap();
        }
        seen
    })
}

#[test]
fn a_confined_ask_retries_a_busy_reply_over_its_request_socket_and_a_route_refusal_keeps_its_exit_category(
) {
    let scene = Scene::new("socket");
    let socket = scene.root.join("req.sock");
    let server = stub_socket(
        &socket,
        vec![
            json!({ "result": "refused", "code": "busy" }),
            json!({ "result": "done", "data": { "id": "q-stub" } }),
            json!({ "result": "refused", "code": "verb-failed", "detail": "answer-not-owner" }),
        ],
    );
    let env = [("FGOS_HEAD_REQUEST_SOCKET", socket.as_path())];
    let ask = scene.fgos_with(
        &["questions", "ask", "--ref", "plan:p", "--input", "-"],
        QUESTION.as_bytes(),
        &env,
    );
    assert!(ask.status.success(), "{ask:?}");
    assert!(String::from_utf8_lossy(&ask.stdout).contains("q-stub"));
    let refused = scene.fgos_with(
        &["questions", "answer", "q-stub", "--option", "A"],
        b"",
        &env,
    );
    assert_eq!(refused.status.code(), Some(2), "{refused:?}");
    let seen = server.join().unwrap();
    assert_eq!(seen.len(), 3);
    assert_eq!(seen[0]["verb"], json!("questions ask"));
    assert_eq!(seen[0]["args"], seen[1]["args"]);
    assert_eq!(seen[2]["verb"], json!("questions answer"));
}

#[test]
fn the_payload_entry_runs_a_head_ask_through_the_real_host_route_and_records_the_envelope_role_as_the_asker(
) {
    let scene = Scene::new("payload");
    let shaper = scene.head("head:shaper-bob", "shaper");
    let repo = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
    let body = json!({
        "v": 1,
        "verb": "questions ask",
        "args": { "input": serde_json::from_str::<Value>(QUESTION).unwrap(), "ref": "plan:p" },
    })
    .to_string();
    let mut child = Command::new("node")
        .arg(repo.join("src/session-host/head-request.mjs"))
        .args(["--run-dir", shaper.to_str().unwrap()])
        .current_dir(scene.project())
        .env_clear()
        .env("HOME", scene.root.join("home"))
        .env("PATH", std::env::var_os("PATH").unwrap_or_default())
        .env("FGOS_STATE_ROOT", scene.root.join("state"))
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();
    child
        .stdin
        .take()
        .unwrap()
        .write_all(body.as_bytes())
        .unwrap();
    let out = child.wait_with_output().unwrap();
    let text = String::from_utf8_lossy(&out.stdout).into_owned();
    let line: Value = serde_json::from_str(text.lines().last().unwrap_or_default())
        .unwrap_or_else(|e| panic!("{e}: {out:?}"));
    assert_eq!(line["result"], json!("done"), "{line}");
    let id = line["data"]["id"].as_str().unwrap().to_owned();
    assert_eq!(
        scene.show(&id)["asked"]["asker"]["roles"],
        json!(["head:shaper-bob"])
    );
}

/// The supervisor's side of a head's socket for real: its request server over the attempt's envelope (Identity
/// asked unstubbed), a route child that is the real Node payload entry, and the real host for the host verbs. The
/// host binary the envelope names is a one-line forwarder because the route child is started as
/// `<hostBin> internal head-request`, which the Node payload entry, not the host, serves in a checkout.
struct ServedSupervisor {
    stop: std::sync::Arc<std::sync::atomic::AtomicBool>,
    pump: Option<std::thread::JoinHandle<()>>,
    host_log: PathBuf,
}

impl ServedSupervisor {
    /// Serves a supervisor head holding `verbs`, on `socket`.
    fn start(scene: &Scene, socket: &Path, verbs: &[&str]) -> Self {
        use fgos_run_supervisor::head_request::HeadRequests;
        use fgos_run_supervisor::route::WritePublisher;
        use std::os::unix::fs::PermissionsExt;
        use std::sync::atomic::{AtomicBool, Ordering};
        use std::sync::Arc;

        let init = scene.fgos(&["identity", "project", "--init", "--json"], b"");
        assert!(init.status.success(), "identity project --init: {init:?}");
        let run_dir = scene.head("head:supervisor-bob", "supervisor");
        let repo = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
        let forwarder = scene.root.join("host.sh");
        let host_log = scene.root.join("host-argv.log");
        fs::write(
            &forwarder,
            format!(
                "#!/bin/sh\necho \"$@\" >> {}\nif [ \"$1\" = internal ] && [ \"$2\" = head-request ]; then\n  shift 2\n  [ \"$1\" = --protocol ] && shift 2\n  exec node {} \"$@\"\nfi\nexec {} \"$@\"\n",
                host_log.display(),
                repo.join("src/session-host/head-request.mjs").display(),
                fgos_bin().display()
            ),
        )
        .unwrap();
        fs::set_permissions(&forwarder, fs::Permissions::from_mode(0o755)).unwrap();
        let envelope = json!({
            "v": 3,
            "cwd": scene.project(),
            "hostBin": forwarder,
            "identity": { "writerId": "att-supervisor" },
            "session": {
                "role": "head:supervisor-bob",
                "persona": "supervisor",
                "verbs": verbs,
                "requestSocketPath": socket,
            },
            "steps": [{ "stepId": "finalize-home", "env": {
                "HOME": scene.root.join("home"),
                "PATH": std::env::var("PATH").unwrap_or_default(),
                "FGOS_STATE_ROOT": scene.root.join("state"),
            }}],
        });
        fs::write(run_dir.join("envelope.json"), envelope.to_string()).unwrap();
        let publisher = WritePublisher {
            catch_up: Arc::new(|_, _| unreachable!("no session write here")),
            path_clean: Arc::new(|_, _| unreachable!("no session write here")),
            publish: Arc::new(|_, _, _, _| unreachable!("no session write here")),
        };
        let (path, server) =
            HeadRequests::from_envelope(&envelope, &run_dir, &scene.root.join("state"), &publisher)
                .unwrap()
                .expect("a socket");
        let listener = std::os::unix::net::UnixListener::bind(&path).unwrap();
        listener.set_nonblocking(true).unwrap();
        let stop = Arc::new(AtomicBool::new(false));
        let flag = stop.clone();
        let pump = std::thread::spawn(move || {
            while !flag.load(Ordering::SeqCst) {
                server.poll(&listener);
                std::thread::sleep(Duration::from_millis(10));
            }
        });
        Self {
            stop,
            pump: Some(pump),
            host_log,
        }
    }

    fn finish(&mut self) {
        self.stop.store(true, std::sync::atomic::Ordering::SeqCst);
        if let Some(pump) = self.pump.take() {
            pump.join().unwrap();
        }
    }
}

impl Drop for ServedSupervisor {
    fn drop(&mut self) {
        self.finish();
    }
}

#[test]
fn a_confined_supervisor_reads_its_queue_plans_and_lanes_and_marks_several_events_through_the_real_request_server(
) {
    let scene = Scene::new("confined-reads");
    let socket = scene.root.join("req.sock");
    let mut served = ServedSupervisor::start(&scene, &socket, SUPERVISOR_VERBS);
    let confined = |args: &[&str]| {
        scene.fgos_with(
            args,
            b"",
            &[
                ("FGOS_CONFINED", Path::new("1")),
                ("FGOS_HEAD_REQUEST_SOCKET", &socket),
            ],
        )
    };
    let json_of = |out: &Output| -> Value {
        serde_json::from_slice(&out.stdout).unwrap_or_else(|e| panic!("{e}: {out:?}"))
    };
    let queue = confined(&["supervisor", "queue", "--json"]);
    let slots = confined(&["slots", "--json"]);
    let plans = confined(&["supervisor", "plans", "--json"]);
    let handled = confined(&["supervisor", "handled", "no-such-a", "no-such-b", "--json"]);
    served.finish();

    assert!(queue.status.success(), "{queue:?}");
    assert_eq!(json_of(&queue)["events"], json!([]), "{queue:?}");
    assert!(slots.status.success(), "{slots:?}");
    assert!(json_of(&slots)["lanes"].is_object(), "{slots:?}");
    assert!(plans.status.success(), "{plans:?}");
    assert!(json_of(&plans)["plans"].is_array(), "{plans:?}");
    // Both ids reached the host verb, which names the first one it does not know.
    assert!(!handled.status.success());
    assert_eq!(json_of(&handled)["code"], "event-unknown", "{handled:?}");
    let host_calls = fs::read_to_string(&served.host_log).unwrap();
    assert!(
        host_calls
            .lines()
            .any(|l| l == "supervisor handled no-such-a no-such-b --json"),
        "both ids reach the host verb: {host_calls}"
    );
}

/// The bwrap command of a confined head, built by the real resolver and driver (`test/helpers/head-sandbox-argv.mjs`),
/// or the named reason this machine cannot run one.
fn head_sandbox(scene: &Scene, socket: &Path) -> Result<(String, Vec<String>, PathBuf), String> {
    let bwrap_runs = Command::new("bwrap")
        .args(["--ro-bind", "/", "/", "true"])
        .output()
        .map(|out| out.status.success())
        .unwrap_or(false);
    if !bwrap_runs {
        return Err("no-bwrap: bwrap is absent or cannot create a sandbox here".to_owned());
    }
    let repo = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
    let runtime_dir = scene.root.join("rt");
    // The go socket the driver binds back must exist; nothing in this proof dials it.
    fs::create_dir_all(runtime_dir.join("fgos")).unwrap();
    fs::write(runtime_dir.join("fgos/go.sock"), "").unwrap();
    let request = json!({
        "project": scene.project(),
        "scratch": scene.root.join("scratch"),
        "home": scene.root.join("home"),
        "runtimeDir": runtime_dir,
        "requestSocket": socket,
        "gateBin": "/bin/true",
        // The fixture lives under /tmp, which the sandbox replaces with its own; a real project does not.
        "bindBack": [scene.project(), fgos_bin()],
    });
    let out = Command::new("node")
        .current_dir(&repo)
        .arg(repo.join("test/helpers/head-sandbox-argv.mjs"))
        .arg(request.to_string())
        .env("FGOS_STATE_ROOT", scene.root.join("state"))
        .output()
        .unwrap();
    assert!(
        out.status.success(),
        "head-sandbox-argv: {}",
        String::from_utf8_lossy(&out.stderr)
    );
    let line = String::from_utf8_lossy(&out.stdout);
    let built: Value = serde_json::from_str(line.lines().last().unwrap()).unwrap();
    let args = built["args"]
        .as_array()
        .unwrap()
        .iter()
        .map(|a| a.as_str().unwrap().to_owned())
        .collect();
    Ok((
        built["command"].as_str().unwrap().to_owned(),
        args,
        PathBuf::from(built["home"].as_str().unwrap()),
    ))
}

/// The verbs of a supervisor head that reads through its socket.
const SUPERVISOR_VERBS: &[&str] = &[
    "questions list",
    "supervisor queue",
    "supervisor plans",
    "slots",
    "supervisor handled",
];

/// Serves a head granted `verbs` and runs each call inside the sandbox a head gets (read-only root, private /tmp,
/// private home that is not the machine's, no state root pinned). `None`: this machine cannot run the sandbox; the
/// reason is named, and it fails instead of skipping when `CI` is set, so CI never passes without the proof.
fn run_in_head_sandbox(tag: &str, verbs: &[&str], calls: &[&[&str]]) -> Option<Vec<Output>> {
    let scene = Scene::new(tag);
    let runtime_dir = scene.root.join("rt");
    let socket = runtime_dir.join("fgos/req.sock");
    fs::create_dir_all(socket.parent().unwrap()).unwrap();
    let (command, sandbox_args, home) = match head_sandbox(&scene, &socket) {
        Ok(built) => built,
        Err(reason) => {
            assert!(
                std::env::var_os("CI").is_none(),
                "the head sandbox proof cannot run in CI: {reason}"
            );
            eprintln!("skip: {tag}: {reason}");
            return None;
        }
    };
    let mut served = ServedSupervisor::start(&scene, &socket, verbs);
    let outputs = calls
        .iter()
        .map(|args| {
            Command::new(&command)
                .args(&sandbox_args)
                .arg(fgos_bin())
                .args(*args)
                .current_dir(scene.project())
                .env_clear()
                .env("HOME", &home)
                .env("PATH", std::env::var_os("PATH").unwrap_or_default())
                .env("FGOS_HEAD_REQUEST_SOCKET", &socket)
                .output()
                .unwrap()
        })
        .collect();
    served.finish();
    Some(outputs)
}

/// The start ritual of a head and the supervisor's reads, run inside the head sandbox against a real request server:
/// each must be answered by the host through the socket, never refused for the sandbox's read-only or empty state.
#[test]
fn a_head_sandbox_answers_the_start_ritual_and_the_supervisor_reads_through_the_request_socket() {
    let calls: [&[&str]; 6] = [
        &["questions"],
        &["questions", "--json"],
        &["supervisor", "queue", "--json"],
        &["supervisor", "plans", "--json"],
        &["slots", "--json"],
        // No event carries this id: the host's own refusal is the answer, so the verb reached it.
        &["supervisor", "handled", "no-such-event", "--json"],
    ];
    let Some(outputs) = run_in_head_sandbox("head-sandbox", SUPERVISOR_VERBS, &calls) else {
        return;
    };
    for (args, out) in calls.iter().zip(&outputs) {
        let label = format!("fgos {}: {out:?}", args.join(" "));
        let reply: Value =
            serde_json::from_slice(&out.stdout).unwrap_or_else(|e| panic!("{e}: {label}"));
        if args[0] == "supervisor" && args[1] == "handled" {
            assert!(!out.status.success(), "{label}");
            assert_eq!(reply["code"], "event-unknown", "{label}");
        } else {
            assert!(out.status.success(), "{label}");
        }
    }
}

/// The negative control of the proof above: a head whose grant lacks `questions list` is refused at the socket, so the
/// proof's answers come from the grant and the host, not from the sandbox letting everything through.
#[test]
fn a_head_sandbox_refuses_questions_when_the_grant_lacks_questions_list() {
    let verbs: Vec<&str> = SUPERVISOR_VERBS
        .iter()
        .copied()
        .filter(|v| *v != "questions list")
        .collect();
    let Some(outputs) = run_in_head_sandbox(
        "head-sandbox-ungranted",
        &verbs,
        &[&["questions", "--json"]],
    ) else {
        return;
    };
    let out = &outputs[0];
    assert!(!out.status.success(), "{out:?}");
    let reply: Value =
        serde_json::from_slice(&out.stdout).unwrap_or_else(|e| panic!("{e}: {out:?}"));
    assert_eq!(reply["code"], "verb-not-granted", "{out:?}");
}
