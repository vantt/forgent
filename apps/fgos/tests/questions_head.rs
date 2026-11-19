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
