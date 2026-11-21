//! A confined head's `session write` through the real door: the run supervisor's request socket served from an
//! envelope, filled with the host's own publisher (the paths land, `wiring/session_write_publish.rs`, compiled here
//! from its source), against a real repository with a bare remote. The order of the checks and the reply shapes are
//! owned by `packages/run-supervisor/rust/tests/head_request.rs` with stub ports; this file proves what only the real
//! composition can: the land's fast-forward, scoped commit and non-forced push.
#![cfg(target_os = "linux")]

#[allow(dead_code)]
#[path = "../src/wiring/portfolio.rs"]
mod portfolio;
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
            "session": {"role": ROLE, "verbs": ["session write"], "writes": ["docs/backlog.md", "plans/backlog/*"],
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
        self.request(json!({"path": path, "content": content}))
    }

    /// A `session write` that names the blob id of the content its writer read.
    fn write_based(&self, path: &str, content: &str, base: &str) -> Value {
        self.request(json!({"path": path, "content": content, "base": base}))
    }

    fn request(&self, args: Value) -> Value {
        let body = serde_json::to_vec(
            &json!({"type": "REQUEST", "id": "w1", "verb": "session write", "args": args}),
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

/// A write based on a blob a newer remote commit replaced is refused and the newer content survives; the current
/// blob id is accepted. (A step of the scene's one scenario: the scene holds process-wide state, so only one runs.)
fn a_stale_base_is_refused_and_the_current_one_written(scene: &Scene) {
    let read = git(&scene.project, &["hash-object", "docs/backlog.md"]);

    // A newer row lands on the remote after the writer read the file.
    git(
        &scene.other,
        &["pull", "-q", "--ff-only", "origin", "trunk"],
    );
    fs::write(scene.other.join("docs/backlog.md"), "old\nnewer row\n").unwrap();
    git(&scene.other, &["commit", "-qam", "newer row"]);
    git(&scene.other, &["push", "-q", "origin", "trunk"]);
    let tip = scene.remote_tip();

    let reply = scene.write_based("docs/backlog.md", "stale edit\n", &read);
    assert_eq!(reply["code"], "write-base-stale", "{reply}");
    assert_eq!(
        fs::read_to_string(scene.project.join("docs/backlog.md")).unwrap(),
        "old\nnewer row\n"
    );
    assert_eq!(scene.remote_tip(), tip, "nothing was published");

    // Re-read, same edit on the new content: the current blob id is accepted.
    let current = git(&scene.project, &["hash-object", "docs/backlog.md"]);
    let reply = scene.write_based("docs/backlog.md", "old\nnewer row\nmine\n", &current);
    assert_eq!(reply["result"], "done", "{reply}");
    assert_eq!(reply["data"]["commit"], scene.remote_tip());
}

/// Holds the project's worktree-admin lock, as another live Git writer does, until dropped.
fn hold_worktree_admin(scene: &Scene) -> fgos_holder_lock::LockScope<'static> {
    let mut holder = fgos_holder_lock::LockScope::seeded(vec![]).unwrap();
    let params = std::collections::BTreeMap::from([(
        "fgosDir".to_string(),
        scene.project.join(".fgos").to_string_lossy().into_owned(),
    )]);
    holder
        .acquire("worktree-admin", &params, fgos_holder_lock::Wait::Ms(0))
        .unwrap();
    holder
}

/// The real catch-up against a held worktree-admin lock: released before the budget ends the write catches up and
/// lands; never released it is Busy naming Git's own code, and the checkout is untouched. (A step of the scene's one
/// scenario.) Each attempt itself waits 5 s on the lock, so the budgets here are small.
fn a_held_worktree_admin_is_waited_out_or_answered_busy(scene: &Scene) {
    use fgos_run_supervisor::route::CatchUpRefusal;
    let before = git(&scene.project, &["rev-parse", "HEAD"]);

    scene.move_remote("busy-never.md");
    let holder = hold_worktree_admin(scene);
    let result = session_write_publish::catch_up_main_within(
        &scene.project,
        "att-own",
        Duration::from_secs(1),
    );
    let Err(CatchUpRefusal::Busy { code, .. }) = result else {
        panic!("not Busy: {result:?}");
    };
    assert_eq!(code, "worktree-admin-held");
    assert_eq!(git(&scene.project, &["rev-parse", "HEAD"]), before);

    // Released after the first attempt's own wait ran out: the retry catches up.
    let releaser = std::thread::spawn(move || {
        std::thread::sleep(Duration::from_secs(6));
        drop(holder);
    });
    session_write_publish::catch_up_main_within(&scene.project, "att-own", Duration::from_secs(40))
        .expect("the catch-up lands once the lock is released");
    releaser.join().unwrap();
    assert_eq!(
        git(&scene.project, &["rev-parse", "HEAD"]),
        scene.remote_tip()
    );
    assert!(scene.project.join("busy-never.md").exists());
}

#[test]
fn a_secretary_heads_write_is_fast_forwarded_committed_alone_pushed_and_never_forced_or_silently_lost(
) {
    let scene = Scene::new();
    a_stale_base_is_refused_and_the_current_one_written(&scene);
    a_held_worktree_admin_is_waited_out_or_answered_busy(&scene);

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

    // 3. The remote moves outside fgos while the land runs: the push is rejected, the commit is undone, and the
    // land starts over from a fresh sync, so the write ends on the remote with no hand push. A remote that moves
    // on every try ends `land-retries-exhausted` with local main not ahead of the remote and the bytes in place; the
    // next write is not refused `write-branch-ahead`.
    let mover = scene.root.join("mover.sh");
    let marker = scene.root.join("moved-once");
    fs::write(
        &mover,
        format!(
            "[ -e {m} ] && exit 0; touch {m}; cd {o} && git pull -q --ff-only origin trunk && echo x > moved-late.md && git add . && git commit -qm late && git push -q origin trunk\n",
            m = marker.display(),
            o = scene.other.display()
        ),
    )
    .unwrap();
    scene.gates("docs/**", &format!("sh {}", mover.display()));
    let reply = scene.write("docs/backlog.md", "third\n");
    assert_eq!(reply["result"], "done", "{reply}");
    assert_eq!(reply["data"]["bytes"], 6);
    let commit = reply["data"]["commit"]
        .as_str()
        .expect("published")
        .to_owned();
    assert_eq!(commit, scene.remote_tip(), "{reply}");
    assert!(scene.project.join("moved-late.md").exists());
    assert_eq!(
        git(&scene.project, &["rev-parse", "refs/heads/trunk"]),
        scene.remote_tip(),
        "local main equals the remote tip"
    );
    let tip = scene.remote_tip();
    let reply = scene.write("docs/backlog.md", "fourth\n");
    assert_eq!(
        reply["result"], "done",
        "a later write is not refused: {reply}"
    );
    assert_ne!(scene.remote_tip(), tip);

    a_new_backlog_item_is_created_validated_and_indexed_in_one_commit(&scene);
}

/// A backlog item's text: the frontmatter contract and the three body sections.
fn item_text(id: &str, title: &str) -> String {
    let fence = concat!("-", "-", "-");
    format!(
        "{fence}\nid: {id}\ntitle: {title}\nstatus: proposed\npriority: P2\narea: general\ncreated: 2026-11-21\n{fence}\n\n# Why\n\nbecause\n\n# Done when\n\ndone\n\n# Notes\n\nnone\n"
    )
}

/// A head's `session write` of a file that does not exist yet beneath `plans/backlog/*` creates it atomically,
/// validates the item contract and its `<id>-<slug>.md` name, regenerates `plans/backlog.md` and commits both in one
/// published commit; an invalid item, a misnamed one and a nested path publish nothing. (A step of the scene's one
/// scenario.)
fn a_new_backlog_item_is_created_validated_and_indexed_in_one_commit(scene: &Scene) {
    fs::create_dir_all(scene.project.join("plans/backlog")).unwrap();
    let path = "plans/backlog/p-abcdefghi2-first-item.md";
    let reply = scene.write(path, &item_text("p-abcdefghi2", "First item"));
    assert_eq!(reply["result"], "done", "{reply}");
    let commit = reply["data"]["commit"]
        .as_str()
        .expect("published")
        .to_owned();
    assert_eq!(commit, scene.remote_tip(), "the remote holds the commit");
    let mut files: Vec<String> = git(
        &scene.project,
        &["show", "--format=", "--name-only", &commit],
    )
    .lines()
    .map(str::to_owned)
    .collect();
    files.sort();
    assert_eq!(files, ["plans/backlog.md", path]);
    let index = fs::read_to_string(scene.project.join("plans/backlog.md")).unwrap();
    assert!(
        index.contains(
            "[p-abcdefghi2](backlog/p-abcdefghi2-first-item.md) | First item | proposed | P2"
        ),
        "{index}"
    );
    assert_eq!(
        git(&scene.project, &["status", "--porcelain", "--", "plans"]),
        ""
    );

    // A second item joins the same index; replacing the first keeps one row each.
    let second = "plans/backlog/p-bcdefghij2-second.md";
    let reply = scene.write(second, &item_text("p-bcdefghij2", "Second"));
    assert_eq!(reply["result"], "done", "{reply}");
    let index = fs::read_to_string(scene.project.join("plans/backlog.md")).unwrap();
    assert_eq!(index.matches("| [p-").count(), 2, "{index}");

    // Refused: the item contract, the file name, a nested path. Nothing is published.
    let tip = scene.remote_tip();
    let broken = scene.write(
        "plans/backlog/p-cdefghij23-broken.md",
        "no frontmatter at all\n",
    );
    assert_eq!(
        broken["data"]["publish"]["refusal"], "write-item-invalid",
        "{broken}"
    );
    let misnamed = scene.write(
        "plans/backlog/wrong-name.md",
        &item_text("p-defghij234", "Misnamed"),
    );
    assert_eq!(
        misnamed["data"]["publish"]["refusal"], "write-item-invalid",
        "{misnamed}"
    );
    let nested = scene.write("plans/backlog/sub/p-efghij2345-deep.md", "x\n");
    assert_eq!(nested["code"], "path-not-granted", "{nested}");
    assert_eq!(scene.remote_tip(), tip, "nothing was published");

    // A refused new item leaves no file, so the same path retried with valid content is published.
    assert!(!scene
        .project
        .join("plans/backlog/p-cdefghij23-broken.md")
        .exists());
    assert!(!scene.project.join("plans/backlog/wrong-name.md").exists());
    let retry = scene.write(
        "plans/backlog/p-cdefghij23-broken.md",
        &item_text("p-cdefghij23", "Fixed"),
    );
    assert_eq!(retry["result"], "done", "{retry}");
    assert!(retry["data"]["commit"].is_string(), "{retry}");

    // A duplicate id is refused by the portfolio check and leaves no file behind.
    let tip = scene.remote_tip();
    let dup = scene.write(
        "plans/backlog/p-cdefghij23-again.md",
        &item_text("p-cdefghij23", "Again"),
    );
    assert_eq!(
        dup["data"]["publish"]["refusal"], "write-item-invalid",
        "{dup}"
    );
    assert!(!scene
        .project
        .join("plans/backlog/p-cdefghij23-again.md")
        .exists());
    assert_eq!(scene.remote_tip(), tip);

    // An untracked stray item file never reaches the committed index.
    fs::write(
        scene.project.join("plans/backlog/p-stray23456-stray.md"),
        item_text("p-stray23456", "Stray"),
    )
    .unwrap();
    let last = scene.write(
        "plans/backlog/p-fghij23456-last.md",
        &item_text("p-fghij23456", "Last"),
    );
    assert_eq!(last["result"], "done", "{last}");
    let commit = last["data"]["commit"].as_str().expect("published");
    let committed = git(
        &scene.project,
        &["show", &format!("{commit}:plans/backlog.md")],
    );
    assert!(committed.contains("p-fghij23456"), "{committed}");
    assert!(!committed.contains("p-stray23456"), "{committed}");
}

/// A virtual clock: `sleep` advances it, so the retry schedule is proven without waiting.
struct Clock {
    origin: std::time::Instant,
    slept: std::cell::RefCell<Vec<Duration>>,
}

impl Clock {
    fn new() -> Self {
        Self {
            origin: std::time::Instant::now(),
            slept: Default::default(),
        }
    }
    fn now(&self) -> std::time::Instant {
        self.origin + self.slept.borrow().iter().sum::<Duration>()
    }
}

fn busy(code: &str) -> fgos_run_supervisor::route::CatchUpRefusal {
    fgos_run_supervisor::route::CatchUpRefusal::Busy {
        code: code.to_owned(),
        detail: "pending fetch".to_owned(),
    }
}

#[test]
fn a_catch_up_refused_busy_while_a_writer_is_pending_lands_once_the_writer_settles() {
    let clock = Clock::new();
    let mut tries = 0;
    let result = session_write_publish::retry_busy(
        Duration::from_secs(45),
        || {
            tries += 1;
            match tries {
                1 => Err(busy("resource-busy")),
                2 => Err(busy("merge-slot-busy")),
                _ => Ok(()),
            }
        },
        |d| clock.slept.borrow_mut().push(d),
        || clock.now(),
    );
    assert_eq!(result, Ok(()));
    assert_eq!(tries, 3);
    assert_eq!(
        *clock.slept.borrow(),
        [Duration::from_millis(500), Duration::from_millis(1000)],
        "backoff doubles"
    );
}

#[test]
fn a_catch_up_whose_writer_never_settles_is_busy_naming_the_last_code_inside_the_budget() {
    let clock = Clock::new();
    let budget = Duration::from_secs(45);
    let result = session_write_publish::retry_busy(
        budget,
        || Err(busy("resource-busy")),
        |d| clock.slept.borrow_mut().push(d),
        || clock.now(),
    );
    assert_eq!(
        result,
        Err(busy("resource-busy")),
        "the last Busy is returned"
    );
    let waited: Duration = clock.slept.borrow().iter().sum();
    assert!(waited <= budget, "{waited:?}");
    assert!(
        clock
            .slept
            .borrow()
            .iter()
            .all(|d| *d <= Duration::from_secs(4)),
        "backoff is capped"
    );
}

#[test]
fn a_catch_up_refusal_that_is_not_busy_is_returned_at_once_not_retried() {
    use fgos_run_supervisor::route::{CatchUpRefusal, PublishRefusal};
    let mut tries = 0;
    let result = session_write_publish::retry_busy(
        Duration::from_secs(45),
        || {
            tries += 1;
            Err(CatchUpRefusal::Refused(PublishRefusal {
                code: "resource-recovery-required".to_owned(),
                detail: "chain gone".to_owned(),
            }))
        },
        |_| panic!("no pause"),
        std::time::Instant::now,
    );
    assert_eq!(tries, 1);
    assert!(
        matches!(result, Err(CatchUpRefusal::Refused(_))),
        "{result:?}"
    );
}
