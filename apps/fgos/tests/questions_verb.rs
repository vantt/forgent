//! `fgos questions` as a process: the list over a real store with the Work section from a stubbed Node bridge,
//! the fail-open list when the bridge fails, an unknown `--open`, and an ask / show / answer / ack round trip.
//! The rules behind each verb (shape, ref, who may answer, the fold) are owned by the crate's tests
//! (`packages/questions/rust/tests/`); this file proves the wiring of the binary over them.
#![cfg(target_os = "linux")]

use sha2::{Digest, Sha256};
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Command, Output, Stdio};

fn fgos_bin() -> PathBuf {
    PathBuf::from(env!("CARGO_BIN_EXE_fgos"))
}

/// The session the calls run as: `FGOS_SESSION_ID` names it.
const SESSION: &str = "00000000-0000-4000-8000-0000000000aa";

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

fn digest(bytes: &[u8]) -> String {
    format!("sha256:{:x}", Sha256::digest(bytes))
}

/// A release whose legacy payload holds only a doctor bridge that prints `bridge_body` (a Node script body).
fn release_with_bridge(root: &Path, bridge_body: &str) {
    let release = root.join("release");
    fs::create_dir_all(release.join("bin")).unwrap();
    fs::create_dir_all(release.join("src/setup")).unwrap();
    let entry = b"process.exit(0);\n";
    let bridge = bridge_body.as_bytes();
    fs::write(release.join("bin/fgos.mjs"), entry).unwrap();
    fs::write(release.join("src/setup/doctor-bridge.mjs"), bridge).unwrap();
    let file = |path: &str, bytes: &[u8]| {
        serde_json::json!({
            "path": path, "kind": "file", "digest": digest(bytes), "mode": "755", "class": "legacy-node",
        })
    };
    let mut manifest = serde_json::json!({
        "schemaVersion": 1,
        "entries": { "fgos": "target/debug/fgos" },
        "components": { "legacyNode": { "root": ".", "entry": "bin/fgos.mjs", "digest": digest(entry) } },
        "requires": { "node": ">=18" },
        "target": { "os": "linux", "arch": "x64" },
        "stateSchemas": { "read": ["2"], "write": ["2"], "migrations": [] },
        "files": [file("bin/fgos.mjs", entry), file("src/setup/doctor-bridge.mjs", bridge)],
    });
    let canonical = fgos_distribution::verify::to_canonical_json(&manifest);
    manifest["artifactDigest"] = serde_json::json!(digest(canonical.as_bytes()));
    fs::write(
        release.join("manifest.json"),
        serde_json::to_string_pretty(&manifest).unwrap(),
    )
    .unwrap();
}

/// A bridge that answers the `work-questions` request with one open gate and one `fgos ask` item.
const BRIDGE_WITH_WORK: &str = r#"
const prefix = '\u001eFGOS-DOCTOR-BRIDGE ';
const line = (body) => process.stdout.write(prefix + JSON.stringify(body) + '\n');
let input = '';
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  const request = JSON.parse(input);
  if (request.phase !== 'work-questions') { line({ kind: 'refusal', message: 'unexpected phase ' + request.phase }); return; }
  line({ kind: 'data', data: {
    gates: [{ ref: 'workflow:case-1#approve', question: 'Ship it?', answerDoor: 'fgos workflow answer case-1 --step approve --answer "<answer>"' }],
    asks: [{ ref: 'work:tsk-1', title: 'A task', question: 'Which module?', answerDoor: 'fgos answer tsk-1 --text "<answer>"' }],
  } });
  line({ kind: 'end', count: 1 });
});
"#;

/// A bridge that dies before it answers.
const BRIDGE_THAT_FAILS: &str = "process.stderr.write('bridge broke\\n'); process.exit(3);\n";

const QUESTION: &str = r#"{"stage":"planning","headline":"Which store do we use?","blocks":"plan p phase 3","parts":{"what":"choose a store","cause":"two stores exist","options":[{"label":"A","does":"d","gain":"g","harm":"h","cost":"c","recommended":true},{"label":"B","does":"d","gain":"g","harm":"h","cost":"c"}],"recommendation":"A","scope":{"allows":"A for this plan","forbids":"changing other plans"}}}"#;

/// A repository with one commit holding `plans/p/plan.md`, a private state root with a machine id, and a release.
struct Scene {
    root: PathBuf,
}

impl Scene {
    fn new(tag: &str, bridge: &str) -> Self {
        static NEXT: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);
        let root = std::env::temp_dir().join(format!(
            "fgos-questions-verb-{tag}-{}-{}",
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
        // What an initialised project holds before its first append.
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
        release_with_bridge(&root, bridge);
        Self { root }
    }

    fn project(&self) -> PathBuf {
        self.root.join("project")
    }

    fn run(&self, args: &[&str], stdin: &[u8]) -> Output {
        let mut child = Command::new(fgos_bin())
            .current_dir(self.project())
            .env_clear()
            .env("HOME", self.root.join("home"))
            .env("PATH", std::env::var_os("PATH").unwrap_or_default())
            .env("FGOS_STATE_ROOT", self.root.join("state"))
            .env("FGOS_SESSION_ID", SESSION)
            .env("FGOS_ACTIVE_RELEASE_PATH", self.root.join("release"))
            .args(args)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .unwrap();
        let _ = child.stdin.take().unwrap().write_all(stdin);
        child.wait_with_output().unwrap()
    }

    /// Asks the standard question; returns its id.
    fn ask(&self) -> String {
        let out = self.run(
            &["questions", "ask", "--ref", "plan:p", "--input", "-"],
            QUESTION.as_bytes(),
        );
        assert!(out.status.success(), "ask: {out:?}");
        String::from_utf8(out.stdout).unwrap().trim().to_owned()
    }
}

impl Drop for Scene {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.root);
    }
}

fn text(out: &Output) -> String {
    String::from_utf8_lossy(&out.stdout).into_owned()
}

fn stderr(out: &Output) -> String {
    String::from_utf8_lossy(&out.stderr).into_owned()
}

/// Whether this test process runs under an agent CLI, which the owner rule of `answer` refuses.
fn under_an_agent() -> bool {
    let tree = fgos_identity::os_process_tree();
    fgos_identity::resolve::agent_in_ancestry(tree.as_ref(), Some(std::process::id())).is_some()
}

#[test]
fn the_list_puts_the_needs_you_count_first_then_the_store_rows_then_the_work_section() {
    let scene = Scene::new("list", BRIDGE_WITH_WORK);
    let id = scene.ask();

    let out = scene.run(&["questions"], b"");
    assert!(out.status.success(), "list: {out:?}");
    let listed = text(&out);
    let lines: Vec<&str> = listed.lines().collect();
    // One open store question, one open gate and one `fgos ask` item wait for the owner.
    assert_eq!(lines[0], "needs you: 3", "{listed}");
    assert!(lines[1].starts_with(&id), "{listed}");
    for part in [
        "Which store do we use?",
        "[recommended: A]",
        "blocks: plan p phase 3",
        "age: 0m",
        &format!("answer: fgos questions answer {id} --option \"A\""),
    ] {
        assert!(lines[1].contains(part), "{part} in {}", lines[1]);
    }
    assert_eq!(lines[2], "work (2):", "{listed}");
    assert!(lines[3].contains("workflow:case-1#approve"), "{listed}");
    assert!(lines[4].contains("work:tsk-1"), "{listed}");

    let json = scene.run(&["questions", "--json"], b"");
    assert!(json.status.success(), "json: {json:?}");
    let doc: serde_json::Value = serde_json::from_slice(&json.stdout).unwrap();
    assert_eq!(doc["data"]["needsYou"], 3);
    assert_eq!(doc["data"]["questions"][0]["id"], id.as_str());
    assert_eq!(doc["data"]["questions"][0]["recommended"], "A");
    assert_eq!(
        doc["data"]["work"]["gates"][0]["ref"],
        "workflow:case-1#approve"
    );
    assert_eq!(doc["data"]["work"]["asks"][0]["ref"], "work:tsk-1");
}

#[test]
fn a_failing_bridge_leaves_the_store_listed_and_says_why_the_work_is_missing() {
    let scene = Scene::new("failing-bridge", BRIDGE_THAT_FAILS);
    let id = scene.ask();

    let out = scene.run(&["questions"], b"");
    assert_eq!(out.status.code(), Some(0), "fail-open: {out:?}");
    let listed = text(&out);
    assert!(listed.starts_with("needs you: 1\n"), "{listed}");
    assert!(listed.contains(&id), "{listed}");
    assert!(
        listed
            .lines()
            .any(|l| l.starts_with("work-sources: unavailable ")),
        "{listed}"
    );

    let json = scene.run(&["questions", "--json"], b"");
    let doc: serde_json::Value = serde_json::from_slice(&json.stdout).unwrap();
    assert!(doc["data"]["work"]["unavailable"].is_string(), "{doc}");
    assert_eq!(doc["data"]["questions"][0]["id"], id.as_str());
}

#[test]
fn the_retired_open_flag_is_an_unknown_flag_and_an_unknown_sub_command_is_refused() {
    let scene = Scene::new("unknown", BRIDGE_WITH_WORK);

    let open = scene.run(&["questions", "--open"], b"");
    assert_eq!(open.status.code(), Some(4), "{open:?}");
    assert!(
        stderr(&open).contains("unknown flag \"--open\""),
        "{}",
        stderr(&open)
    );

    let sub = scene.run(&["questions", "frobnicate"], b"");
    assert_eq!(sub.status.code(), Some(4), "{sub:?}");
    assert!(
        stderr(&sub).contains("unknown questions subcommand \"frobnicate\""),
        "{}",
        stderr(&sub)
    );
}

#[test]
fn a_question_is_asked_and_shown_through_the_binary_and_answered_and_acknowledged_when_no_agent_cli_is_an_ancestor(
) {
    let scene = Scene::new("round-trip", BRIDGE_WITH_WORK);
    let id = scene.ask();

    let shown = scene.run(&["questions", "show", &id], b"");
    assert!(shown.status.success(), "show: {shown:?}");
    let shown = text(&shown);
    for part in [
        "What is happening: choose a store",
        "Cause: two stores exist",
        "(recommended)",
        "cost: c",
        "Scope of the answer: allows A for this plan; forbids changing other plans",
    ] {
        assert!(shown.contains(part), "{part} in {shown}");
    }

    let answered = scene.run(&["questions", "answer", &id, "--option", "A"], b"");
    if under_an_agent() {
        // The answer step needs an owner caller: the process tree of this run decides, and the owner rule itself
        // (an agent in the ancestry is refused as `answer-not-owner`) is proved in the crate with a stubbed caller
        // (`store_usecases.rs`), the refusal's exit category in the wiring unit test.
        assert_eq!(answered.status.code(), Some(2), "{answered:?}");
        assert!(
            stderr(&answered).contains("[answer-not-owner]"),
            "{}",
            stderr(&answered)
        );
        return;
    }
    assert!(answered.status.success(), "answer: {answered:?}");
    let again = scene.run(&["questions", "answer", &id, "--option", "B"], b"");
    assert_eq!(again.status.code(), Some(3), "{again:?}");
    assert!(
        stderr(&again).contains("[question-already-answered]"),
        "{}",
        stderr(&again)
    );

    let waiting = scene.run(&["questions", "--answered"], b"");
    assert!(text(&waiting).contains(&id), "{}", text(&waiting));

    let acked = scene.run(&["questions", "ack", &id], b"");
    assert!(acked.status.success(), "ack: {acked:?}");
    let all = scene.run(&["questions", "--all", "--json"], b"");
    let doc: serde_json::Value = serde_json::from_slice(&all.stdout).unwrap();
    assert_eq!(doc["data"]["questions"][0]["state"], "acked");
}
