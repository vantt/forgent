//! `fgos doc locate` as a process, the wiring proof over the locate use case: on a project with a small `docs/` tree
//! and no embedding model, the first call answers partial and starts the index worker as a detached process; a later
//! call finds text candidates; every call leaves one `fgos.doc.locate` record; a bad question is the caller's error.
//! What locate answers is owned by the `fgos-documentation` crate's tests; this file proves the binary over them.
#![cfg(target_os = "linux")]

use fgos_documentation::pkm::{self, LocatePaths};
use serde_json::Value;
use std::fs;
use std::os::unix::fs::PermissionsExt;
use std::path::{Path, PathBuf};
use std::process::{Command, Output};
use std::time::{Duration, Instant};

fn fgos_bin() -> PathBuf {
    PathBuf::from(env!("CARGO_BIN_EXE_fgos"))
}

const SESSION: &str = "00000000-0000-4000-8000-0000000000dd";
const DRAFT: &str = "the land door rebases and pushes branches to main";

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

fn copy_tree(from: &Path, to: &Path) {
    fs::create_dir_all(to).unwrap();
    for entry in fs::read_dir(from).unwrap() {
        let entry = entry.unwrap();
        let target = to.join(entry.file_name());
        if entry.file_type().unwrap().is_dir() {
            copy_tree(&entry.path(), &target);
        } else {
            fs::copy(entry.path(), target).unwrap();
        }
    }
}

/// A repository whose `docs/` is the documentation crate's fixture corpus, a private state root (so the model
/// folder is empty) and no release.
struct Scene {
    root: PathBuf,
}

impl Scene {
    fn new() -> Self {
        let root = std::env::temp_dir().join(format!("fgos-doc-locate-{}", std::process::id()));
        let _ = fs::remove_dir_all(&root);
        fs::create_dir_all(root.join("home")).unwrap();
        fs::create_dir_all(root.join("state")).unwrap();
        let root = fs::canonicalize(root).unwrap();
        git(&root, &["init", "-q", "-b", "main", "project"]);
        let project = root.join("project");
        git(&project, &["config", "fgos.machineid", "m-test"]);
        copy_tree(
            &Path::new(env!("CARGO_MANIFEST_DIR"))
                .join("../../packages/documentation/rust/tests/fixtures/vault"),
            &project.join("docs"),
        );
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
        for dir in [root.join("state"), project.join(".git/fgos"), locks] {
            fs::set_permissions(dir, fs::Permissions::from_mode(0o700)).unwrap();
        }
        fgos_identity::machine::mint_here(&root.join("state")).unwrap();
        Self { root }
    }

    fn project(&self) -> PathBuf {
        self.root.join("project")
    }

    /// The paths the host's wiring derives for this project (the model folder sits in the private state root).
    fn paths(&self) -> LocatePaths {
        let runtime = self.project().join(".fgos/runtime/doc-locate");
        LocatePaths {
            docs_root: self.project().join("docs"),
            graph_db: runtime.join("graph.db"),
            search_db: runtime.join("search/search.db"),
            model_dir: self.root.join("state/models"),
            profile: runtime.join("profile.yaml"),
        }
    }

    fn run(&self, args: &[&str]) -> Output {
        Command::new(fgos_bin())
            .current_dir(self.project())
            .env_clear()
            .env("HOME", self.root.join("home"))
            .env("PATH", std::env::var_os("PATH").unwrap_or_default())
            .env("FGOS_STATE_ROOT", self.root.join("state"))
            .env("FGOS_SESSION_ID", SESSION)
            .args(args)
            .output()
            .unwrap()
    }

    /// The `data` of a successful `--json` call.
    fn data(&self, args: &[&str]) -> Value {
        let out = self.run(args);
        assert!(out.status.success(), "{args:?}: {out:?}");
        let envelope: Value = serde_json::from_slice(&out.stdout)
            .unwrap_or_else(|e| panic!("{args:?}: {e}: {}", String::from_utf8_lossy(&out.stdout)));
        assert_eq!(envelope["contract"], "fgos.v1", "{envelope}");
        envelope["data"].clone()
    }
}

/// Stops the worker the first call started, also when an assertion failed, then removes the scene.
impl Drop for Scene {
    fn drop(&mut self) {
        let _ = pkm::stop_worker(&self.paths(), Duration::from_secs(30));
        let _ = fs::remove_dir_all(&self.root);
    }
}

#[test]
fn locate_answers_partial_starts_the_worker_finds_text_candidates_and_logs_every_call() {
    let scene = Scene::new();
    let first = scene.data(&["doc", "locate", "--draft", DRAFT, "--json"]);
    assert_eq!(
        first["partial"], true,
        "no model, so never a full answer: {first}"
    );
    for key in ["partial", "state", "action", "parts", "group"] {
        assert!(
            first.get(key).is_some(),
            "the answer carries {key}: {first}"
        );
    }
    assert!(
        pkm::worker_running(&scene.paths()),
        "the first call started the index worker"
    );

    // The worker indexes text without the model; a later call answers from it.
    let deadline = Instant::now() + Duration::from_secs(120);
    let mut calls = 1;
    let answer = loop {
        let answer = scene.data(&["doc", "locate", "--draft", DRAFT, "--json"]);
        calls += 1;
        if answer["parts"][0]["candidates"]
            .as_array()
            .is_some_and(|c| !c.is_empty())
        {
            break answer;
        }
        assert!(
            Instant::now() < deadline,
            "no text candidates within 120 s: {answer}"
        );
        std::thread::sleep(Duration::from_millis(500));
    };
    assert_eq!(answer["partial"], true, "{answer}");
    assert_eq!(answer["state"], "model-missing", "{answer}");
    assert_eq!(
        answer["parts"][0]["candidates"][0]["path"], "docs/platform/git/decisions/land-door.md",
        "{answer}"
    );

    let records = scene.data(&["metrics", "query", "--kind", "fgos.doc.locate", "--json"]);
    assert_eq!(
        records["rows"][0]["count"], calls,
        "one record per call: {records}"
    );

    // A question with no draft, or a region the corpus does not have, is refused before anything runs.
    let empty = scene.run(&["doc", "locate", "--json"]);
    assert_eq!(empty.status.code(), Some(4), "{empty:?}");
    let area = scene.run(&["doc", "locate", "--draft", DRAFT, "--area", "nowhere"]);
    assert_eq!(area.status.code(), Some(4), "{area:?}");
    assert!(
        String::from_utf8_lossy(&area.stderr).contains("unknown area \"nowhere\""),
        "{area:?}"
    );

    // The index verbs: status sees the running worker and its state, stop ends it, reset needs it stopped.
    let status = scene.data(&["doc", "index", "status", "--json"]);
    assert_eq!(status["state"], "model-missing", "{status}");
    assert_eq!(status["workerRunning"], true, "{status}");
    let busy = scene.run(&["doc", "index", "reset"]);
    assert_eq!(
        busy.status.code(),
        Some(2),
        "a running worker refuses reset: {busy:?}"
    );
    assert_eq!(
        scene.data(&["doc", "index", "stop", "--json"]),
        serde_json::json!({ "stopped": true })
    );
    let status = scene.data(&["doc", "index", "status", "--json"]);
    assert_eq!(status["workerRunning"], false, "{status}");
    assert!(!pkm::worker_running(&scene.paths()), "no worker remains");
    assert_eq!(
        scene.data(&["doc", "index", "stop", "--json"]),
        serde_json::json!({ "stopped": false })
    );
    let reset = scene.data(&["doc", "index", "reset", "--json"]);
    assert_eq!(reset["result"], "reset", "{reset}");
}
