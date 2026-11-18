//! `fgos hook questions` as a process: two sessions each get only the answers to their own questions, a stop blocks
//! once and passes when `stop_hook_active` is set or the notice is already in the transcript, the hook writes no
//! file, and a session whose question was acked is told nothing. The rule behind who is told (the session or one of
//! its `head:` roles, rotation included) is owned by the module's unit tests; this file proves the wiring of the
//! binary over the view `.fgos/cache/questions.json`.
#![cfg(target_os = "linux")]

use serde_json::{json, Value};
use std::collections::BTreeMap;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Command, Output, Stdio};

const SESSION_A: &str = "00000000-0000-4000-8000-0000000000aa";
const SESSION_B: &str = "00000000-0000-4000-8000-0000000000bb";

struct Scene {
    root: PathBuf,
}

impl Scene {
    fn new(tag: &str) -> Self {
        let root =
            std::env::temp_dir().join(format!("fgos-questions-hook-{tag}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&root);
        fs::create_dir_all(root.join("state")).unwrap();
        fs::create_dir_all(root.join("project/.fgos/cache")).unwrap();
        let root = fs::canonicalize(root).unwrap();
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(root.join("state"), fs::Permissions::from_mode(0o700)).unwrap();
        }
        fgos_identity::machine::mint_here(&root.join("state")).unwrap();
        Self { root }
    }

    fn view_path(&self) -> PathBuf {
        self.root.join("project/.fgos/cache/questions.json")
    }

    fn write_view(&self, questions: Vec<Value>) {
        fs::write(
            self.view_path(),
            json!({ "v": 1, "questions": questions }).to_string(),
        )
        .unwrap();
    }

    fn fgos(&self, session: &str, args: &[&str]) -> Command {
        let mut command = Command::new(PathBuf::from(env!("CARGO_BIN_EXE_fgos")));
        command
            .current_dir(self.root.join("project"))
            .env_clear()
            .env("HOME", self.root.join("home"))
            .env("PATH", std::env::var_os("PATH").unwrap_or_default())
            .env("FGOS_STATE_ROOT", self.root.join("state"))
            .env("FGOS_SESSION_ID", session)
            .args(args);
        command
    }

    /// The Identity id of the session the environment names (machine id, slash, the environment's id).
    fn identity_of(&self, session: &str) -> String {
        let out = self
            .fgos(session, &["identity", "session", "--json"])
            .output()
            .unwrap();
        assert!(out.status.success(), "identity session: {out:?}");
        let doc: Value = serde_json::from_slice(&out.stdout).unwrap();
        doc["data"]["id"].as_str().unwrap().to_owned()
    }

    fn run(&self, session: &str, event: &str, stdin: &str) -> Output {
        let mut child = self
            .fgos(session, &["hook", "questions", "--event", event])
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .unwrap();
        let _ = child.stdin.take().unwrap().write_all(stdin.as_bytes());
        child.wait_with_output().unwrap()
    }

    /// The files under the project, with their bytes, to prove the hook wrote nothing.
    fn tree(&self) -> BTreeMap<PathBuf, Vec<u8>> {
        fn walk(dir: &Path, out: &mut BTreeMap<PathBuf, Vec<u8>>) {
            for entry in fs::read_dir(dir).unwrap().flatten() {
                let path = entry.path();
                if path.is_dir() {
                    walk(&path, out);
                } else {
                    out.insert(path.clone(), fs::read(&path).unwrap());
                }
            }
        }
        let mut out = BTreeMap::new();
        walk(&self.root, &mut out);
        out
    }
}

impl Drop for Scene {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.root);
    }
}

fn question(id: &str, state: &str, session: &str, handle: &str) -> Value {
    json!({
        "state": state,
        "asked": { "id": id, "ref": { "value": "plan:p", "branch": "work", "commit": "c" },
                   "asker": { "sessionId": session, "handle": handle, "roles": [], "machine": "m-test" } },
        "answer": { "id": id, "option": "A", "by": "owner", "answeredAt": "2026-11-19T00:00:00Z" }
    })
}

fn out(o: &Output) -> String {
    String::from_utf8_lossy(&o.stdout).into_owned()
}

#[test]
fn each_session_is_told_only_the_answers_to_its_own_questions_and_the_hook_writes_nothing() {
    let scene = Scene::new("prompt");
    let (id_a, id_b) = (scene.identity_of(SESSION_A), scene.identity_of(SESSION_B));
    scene.write_view(vec![
        question("q-a", "answered", &id_a, "miu"),
        question("q-b", "answered", &id_b, "kai"),
        question("q-open", "open", &id_a, "miu"),
    ]);
    let before = scene.tree();

    let a = scene.run(SESSION_A, "user-prompt-submit", "");
    assert!(a.status.success(), "{a:?}");
    assert_eq!(
        out(&a),
        "owner answered q-a (plan:p, asked by miu): A; write it back to plan:p, then: fgos questions ack q-a\n"
    );
    let b = scene.run(SESSION_B, "user-prompt-submit", "");
    assert_eq!(
        out(&b),
        "owner answered q-b (plan:p, asked by kai): A; write it back to plan:p, then: fgos questions ack q-b\n"
    );
    let other = scene.run(
        "00000000-0000-4000-8000-0000000000cc",
        "user-prompt-submit",
        "",
    );
    assert!(other.status.success() && out(&other).is_empty());
    assert_eq!(scene.tree(), before, "the hook wrote a file");
}

#[test]
fn a_stop_blocks_once_passes_when_the_hook_is_active_or_the_notice_is_in_the_transcript_and_a_missing_view_prints_nothing(
) {
    let scene = Scene::new("stop");
    let id_a = scene.identity_of(SESSION_A);
    scene.write_view(vec![question("q-a", "answered", &id_a, "miu")]);
    let transcript = scene.root.join("transcript.jsonl");
    fs::write(&transcript, "{\"type\":\"user\"}\n").unwrap();
    let payload = |active: bool| {
        json!({ "stop_hook_active": active, "transcript_path": transcript }).to_string()
    };
    let before = scene.tree();

    let blocked = scene.run(SESSION_A, "stop", &payload(false));
    assert!(blocked.status.success(), "{blocked:?}");
    let doc: Value = serde_json::from_str(out(&blocked).trim()).unwrap();
    assert_eq!(doc["decision"], "block");
    assert!(doc["reason"]
        .as_str()
        .unwrap()
        .contains("fgos questions ack q-a"));
    assert!(out(&scene.run(SESSION_A, "stop", &payload(true))).is_empty());
    assert!(out(&scene.run(SESSION_B, "stop", &payload(false))).is_empty());

    // The notice was shown on the prompt, so the transcript holds its line: the stop passes.
    fs::write(
        &transcript,
        "{\"context\":\"owner answered q-a: write it back, then: fgos questions ack q-a\"}\n",
    )
    .unwrap();
    assert!(out(&scene.run(SESSION_A, "stop", &payload(false))).is_empty());
    let before = {
        let mut tree = before;
        tree.insert(transcript.clone(), fs::read(&transcript).unwrap());
        tree
    };
    assert_eq!(scene.tree(), before, "the hook wrote a file");

    fs::remove_file(scene.view_path()).unwrap();
    let none = scene.run(SESSION_A, "user-prompt-submit", "");
    assert!(none.status.success() && out(&none).is_empty());
}

#[test]
fn after_the_ack_the_session_is_told_nothing() {
    let scene = Scene::new("ack");
    let id_a = scene.identity_of(SESSION_A);
    scene.write_view(vec![question("q-a", "answered", &id_a, "miu")]);
    assert!(!out(&scene.run(SESSION_A, "user-prompt-submit", "")).is_empty());
    // What the verb leaves in the view after `fgos questions ack q-a`.
    scene.write_view(vec![question("q-a", "acked", &id_a, "miu")]);
    assert!(out(&scene.run(SESSION_A, "user-prompt-submit", "")).is_empty());
    assert!(out(&scene.run(SESSION_A, "stop", "{}")).is_empty());
}
