//! A confined head's `session write` through the real door: the run supervisor's request socket served from an
//! envelope, filled with the host's own publisher (the paths land, `wiring/session_write_publish.rs`, compiled here
//! from its source), against a real repository with a bare remote. The order of the checks and the reply shapes are
//! owned by `packages/run-supervisor/rust/tests/head_request.rs` with stub ports; this file proves what only the real
//! composition can: the land's fast-forward, scoped commit and non-forced push.
#![cfg(target_os = "linux")]

#[path = "../src/wiring/session_write_publish.rs"]
mod session_write_publish;

use fgos_run_supervisor::go_channel::read_frame;
use fgos_run_supervisor::head_request::HeadRequests;
use serde_json::{json, Value};
use std::fs;
use std::io::Write;
use std::os::unix::fs::PermissionsExt;
use std::os::unix::net::{UnixListener, UnixStream};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;

const ROLE: &str = "head:secretary-x";

fn git(dir: &Path, args: &[&str]) -> String {
    let out = Command::new("git")
        .arg("-C")
        .arg(dir)
        .args(args)
        .env("GIT_CONFIG_GLOBAL", "/dev/null")
        .env("GIT_CONFIG_NOSYSTEM", "1")
        .output()
        .unwrap();
    assert!(
        out.status.success(),
        "git {args:?}: {}",
        String::from_utf8_lossy(&out.stderr)
    );
    String::from_utf8(out.stdout).unwrap().trim().to_owned()
}

/// A repository on `trunk` with a bare remote and a second clone, the state root and home of the process, the
/// project's land gates, and the head's request socket served from its envelope.
struct Scene {
    root: PathBuf,
    project: PathBuf,
    remote: PathBuf,
    other: PathBuf,
    socket: PathBuf,
    stop: Arc<AtomicBool>,
    pump: Option<std::thread::JoinHandle<()>>,
}

impl Scene {
    fn new() -> Self {
        let root = fs::canonicalize({
            let root = std::env::temp_dir()
                .join(format!("fgos-session-write-publish-{}", std::process::id()));
            let _ = fs::remove_dir_all(&root);
            fs::create_dir_all(root.join("home")).unwrap();
            fs::create_dir_all(root.join("state")).unwrap();
            root
        })
        .unwrap();
        let (project, remote, other) = (
            root.join("project"),
            root.join("remote.git"),
            root.join("other"),
        );
        git(
            &root,
            &[
                "init",
                "-q",
                "--bare",
                "--initial-branch=trunk",
                "remote.git",
            ],
        );
        git(&root, &["init", "-q", "--initial-branch=trunk", "project"]);
        git(&project, &["config", "user.name", "Fixture"]);
        git(
            &project,
            &["config", "user.email", "fixture@example.invalid"],
        );
        git(&project, &["config", "fgos.machineid", "m-test"]);
        fs::create_dir_all(project.join("docs")).unwrap();
        fs::write(project.join("docs/backlog.md"), "old\n").unwrap();
        fs::write(project.join("docs/other.md"), "keep\n").unwrap();
        git(&project, &["add", "."]);
        git(&project, &["commit", "-qm", "base"]);
        git(
            &project,
            &["remote", "add", "origin", remote.to_str().unwrap()],
        );
        git(&project, &["push", "-q", "-u", "origin", "trunk"]);
        let fence = project.join(".fgos/locks/activation.lock");
        fs::create_dir_all(&fence).unwrap();
        fs::write(
            fence.join("TOMBSTONE"),
            r#"{"lock":"activation","by":"fgos git","at":"fixture"}"#,
        )
        .unwrap();
        for dir in [root.join("state"), project.join(".git")] {
            fs::set_permissions(dir, fs::Permissions::from_mode(0o700)).unwrap();
        }
        git(&root, &["clone", "-q", remote.to_str().unwrap(), "other"]);
        git(&other, &["config", "user.name", "Other"]);
        git(&other, &["config", "user.email", "other@example.invalid"]);
        fgos_identity::machine::mint_here(&root.join("state")).unwrap();
        // The host's own state root and home, as its supervisor process reads them.
        std::env::set_var("FGOS_STATE_ROOT", root.join("state"));
        std::env::set_var("HOME", root.join("home"));

        let pid = std::process::id();
        let head = fgos_identity::HeadRef {
            pid,
            start_time: fgos_process::facts::identity_of(fgos_process::ProcId(pid))
                .unwrap()
                .start_time,
        };
        let key = fgos_identity::WriterKey {
            source: "FGOS_SESSION_ID",
            value: "att-own",
        };
        fgos_identity::directory::register_writer(
            &root.join("state"),
            None,
            &key,
            &head,
            &[ROLE.to_owned()],
            false,
            None,
        )
        .unwrap();
        let run_dir = root.join("run");
        fs::create_dir_all(&run_dir).unwrap();
        let socket = root.join("req.sock");
        let envelope = json!({
            "hostBin": "/bin/false",
            "cwd": project,
            "identity": {"writerId": "att-own"},
            "session": {"role": ROLE, "verbs": ["session write"], "writes": ["docs/backlog.md"],
                        "requestSocketPath": socket},
            "steps": [{"stepId": "finalize-home", "env": {}}]
        });
        let (path, server) = HeadRequests::from_envelope(
            &envelope,
            &run_dir,
            &root.join("state"),
            &session_write_publish::publisher(),
        )
        .unwrap()
        .expect("a socket");
        server.set_gate(head);
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
        let scene = Scene {
            root,
            project,
            remote,
            other,
            socket,
            stop,
            pump: Some(pump),
        };
        scene.gates("nothing/**", "true");
        scene
    }

    /// The project's one land gate: `run`, only for paths matching `when`.
    fn gates(&self, when: &str, run: &str) {
        fs::write(
            self.project.join(".fgos/config.yaml"),
            format!("land:\n  gates:\n    - run: {run:?}\n      when: [{when:?}]\n"),
        )
        .unwrap();
    }

    /// One `session write` request over the socket.
    fn write(&self, path: &str, content: &str) -> Value {
        let body = serde_json::to_vec(
            &json!({"type": "REQUEST", "id": "w1", "verb": "session write",
            "args": {"path": path, "content": content}}),
        )
        .unwrap();
        let mut stream = UnixStream::connect(&self.socket).unwrap();
        stream
            .set_read_timeout(Some(Duration::from_secs(120)))
            .unwrap();
        stream
            .write_all(&(body.len() as u32).to_be_bytes())
            .unwrap();
        stream.write_all(&body).unwrap();
        read_frame(&mut stream).expect("a REPLY frame")
    }

    fn remote_tip(&self) -> String {
        git(&self.remote, &["rev-parse", "refs/heads/trunk"])
    }

    /// The remote's trunk moved from the other clone.
    fn move_remote(&self, file: &str) {
        git(&self.other, &["pull", "-q", "--ff-only", "origin", "trunk"]);
        fs::write(self.other.join(file), "moved\n").unwrap();
        git(&self.other, &["add", "."]);
        git(&self.other, &["commit", "-qm", "moved"]);
        git(&self.other, &["push", "-q", "origin", "trunk"]);
    }
}

impl Drop for Scene {
    fn drop(&mut self) {
        self.stop.store(true, Ordering::SeqCst);
        if let Some(pump) = self.pump.take() {
            let _ = pump.join();
        }
        let _ = fs::remove_dir_all(&self.root);
    }
}

#[test]
fn land_config_reads_gates_with_and_without_when_and_a_regenerate() {
    let config = json!({"land": {
        "gates": [{"run": "true"}, {"run": "make", "when": ["docs/**"]}],
        "regenerate": {"run": "gen", "files": ["a.json"]},
    }});
    let read = session_write_publish::land_config_of(&config).unwrap();
    assert_eq!(read.gates.len(), 2);
    assert!(read.gates[0].when.is_empty());
    assert_eq!(read.gates[1].when, vec!["docs/**".to_owned()]);
    assert_eq!(read.regenerate.unwrap().files, vec!["a.json".to_owned()]);
    assert!(
        session_write_publish::land_config_of(&json!({"land": {"gates": [{"when": []}]}})).is_err()
    );
}

#[test]
fn a_secretary_heads_write_is_fast_forwarded_committed_alone_pushed_and_never_forced_or_silently_lost(
) {
    let scene = Scene::new();

    // 1. Published: the main checkout first catches up to the remote tip, only the written path is committed (the
    // other dirty path stays out), the subject names the head role, and the remote then holds the commit.
    scene.move_remote("moved-first.md");
    fs::write(scene.project.join("docs/other.md"), "dirty elsewhere\n").unwrap();
    let reply = scene.write("docs/backlog.md", "new\n");
    assert_eq!(reply["result"], "done", "{reply}");
    let commit = reply["data"]["commit"]
        .as_str()
        .unwrap_or_else(|| panic!("no commit: {reply}"))
        .to_owned();
    assert_eq!(reply["data"]["path"], "docs/backlog.md");
    assert_eq!(reply["data"]["bytes"], 4);
    assert_eq!(commit, scene.remote_tip(), "the remote holds the commit");
    assert_eq!(
        git(&scene.project, &["log", "-1", "--format=%s", &commit]),
        format!("docs({ROLE}): write docs/backlog.md")
    );
    assert_eq!(
        git(
            &scene.project,
            &["show", "--format=", "--name-only", &commit]
        ),
        "docs/backlog.md"
    );
    assert!(
        scene.project.join("moved-first.md").exists(),
        "the main checkout caught up to the remote tip first"
    );
    assert_eq!(
        fs::read_to_string(scene.project.join("docs/other.md")).unwrap(),
        "dirty elsewhere\n"
    );
    git(&scene.project, &["checkout", "--", "docs/other.md"]);

    // 2. A path with an uncommitted change is refused and nothing is written.
    fs::write(scene.project.join("docs/backlog.md"), "edited by hand\n").unwrap();
    let before = scene.remote_tip();
    let reply = scene.write("docs/backlog.md", "newer\n");
    assert_eq!(reply["result"], "refused", "{reply}");
    assert_eq!(reply["code"], "write-path-dirty");
    assert_eq!(
        fs::read_to_string(scene.project.join("docs/backlog.md")).unwrap(),
        "edited by hand\n"
    );
    assert_eq!(scene.remote_tip(), before);
    git(&scene.project, &["checkout", "--", "docs/backlog.md"]);

    // 3. The remote moves outside fgos while the land runs: the push is refused by its own name and nothing is
    // forced. The commit was already made, so it stays local: the path is committed, the branch is one commit ahead
    // of its remote, and the next write is refused `write-branch-ahead` before it writes anything.
    let mover = scene.root.join("mover.sh");
    fs::write(
        &mover,
        format!(
            "cd {o} && git pull -q --ff-only origin trunk && echo x > moved-late.md && git add . && git commit -qm late && git push -q origin trunk\n",
            o = scene.other.display()
        ),
    )
    .unwrap();
    scene.gates("docs/**", &format!("sh {}", mover.display()));
    let reply = scene.write("docs/backlog.md", "third\n");
    assert_eq!(reply["result"], "done", "{reply}");
    assert_eq!(reply["data"]["bytes"], 6);
    assert_eq!(
        reply["data"]["publish"]["refusal"], "land-paths-push-rejected",
        "{reply}"
    );
    assert!(reply["data"].get("commit").is_none());
    assert_eq!(
        fs::read_to_string(scene.project.join("docs/backlog.md")).unwrap(),
        "third\n"
    );
    assert_ne!(
        git(&scene.project, &["rev-parse", "refs/heads/trunk"]),
        scene.remote_tip(),
        "the remote keeps its own tip; nothing was forced"
    );
    assert_eq!(
        git(
            &scene.project,
            &["status", "--porcelain", "--", "docs/backlog.md"]
        ),
        "",
        "the path is committed locally"
    );
    assert_eq!(
        git(&scene.project, &["rev-list", "--count", "@{u}..HEAD"]),
        "1",
        "one local commit the remote lacks"
    );
    let tip = scene.remote_tip();
    let reply = scene.write("docs/backlog.md", "fourth\n");
    assert_eq!(reply["result"], "refused", "{reply}");
    assert_eq!(reply["code"], "write-branch-ahead", "{reply}");
    assert_eq!(
        fs::read_to_string(scene.project.join("docs/backlog.md")).unwrap(),
        "third\n"
    );
    assert_eq!(scene.remote_tip(), tip);
}
