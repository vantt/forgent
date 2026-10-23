//! Owning proof of the write transaction's locking: one committer among racing writers, a held
//! lock, the second revision check and an observer that aborts. Real threads, real child processes,
//! real lock files; nothing is switched off for a test.
#![cfg(unix)]
mod common;

use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::{Duration, Instant};

use common::{files, refs};
use fgos_config::detect::NoDetectors;
use fgos_config::scope::SourceKind;
use fgos_config::snapshot::{Context, SessionClass, SnapshotError, SnapshotRequest};
use fgos_config::write::{commit, commit_observed, Edit, Step, WriteRequest};
use fgos_config::{schema::Schemas, standard::Standard};
use fgos_holder_lock::{acquire, Acquire, Mode, Resource, Wait};
use fgos_yaml_doc::path::parse_path;
use serde_json::json;
use sha2::{Digest, Sha256};

const ROLE: &str = "CONFIG_TEST_LOCK";
const READY: &str = "CONFIG_TEST_READY";

/// Tests of one binary run on parallel threads and a fork copies every open description until the
/// child execs, so each test that takes a lock runs alone.
fn serial() -> std::sync::MutexGuard<'static, ()> {
    static SERIAL: Mutex<()> = Mutex::new(());
    SERIAL
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
}

/// The body of the child: take the lock named by the environment, say so, keep it until killed.
#[test]
fn child_entry() {
    let Ok(path) = std::env::var(ROLE) else {
        return;
    };
    let resource = Resource::new("project-config", PathBuf::from(path));
    let Acquire::Acquired(held) = acquire(&resource, Mode::Ex, Wait::Ms(20_000), 2000) else {
        panic!("child could not take the lock");
    };
    fs::write(std::env::var(READY).unwrap(), "held").unwrap();
    let _keep = held;
    loop {
        std::thread::sleep(Duration::from_secs(3600));
    }
}

/// A child killed and reaped when dropped.
struct Holder(Child);
impl Drop for Holder {
    fn drop(&mut self) {
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}

fn hold(dir: &Path) -> Holder {
    let ready = dir.join("ready");
    let lock = dir.join("project/.fgos/locks/project-config.lock");
    fs::create_dir_all(lock.parent().unwrap()).unwrap();
    let mut child = Command::new(std::env::current_exe().unwrap())
        .args([
            "--exact",
            "child_entry",
            "--nocapture",
            "--test-threads",
            "1",
        ])
        .env(ROLE, &lock)
        .env(READY, &ready)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .spawn()
        .unwrap();
    let deadline = Instant::now() + Duration::from_secs(30);
    while !ready.exists() {
        assert!(
            child.try_wait().unwrap().is_none(),
            "the holder exited early"
        );
        assert!(Instant::now() < deadline, "the holder never took the lock");
        std::thread::sleep(Duration::from_millis(5));
    }
    Holder(child)
}

struct Fixture {
    dir: PathBuf,
    file: PathBuf,
    schemas: Schemas,
    standard: Standard,
}

fn fixture(tag: &str) -> Fixture {
    let dir = common::temp("conc", tag);
    let file = dir.join("project/.fgos/config.yaml");
    fs::create_dir_all(file.parent().unwrap()).unwrap();
    fs::create_dir_all(dir.join("home")).unwrap();
    fs::write(&file, "limits:\n  count: 8\n").unwrap();
    let schema = files(
        &json!({"limits": ["type: object", "properties:", "  count: {type: integer}"]}),
        true,
    );
    let schemas = Schemas::parse(&refs(&schema)).unwrap();
    let standard = Standard::parse(&[], &schemas).unwrap();
    Fixture {
        dir,
        file,
        schemas,
        standard,
    }
}

impl Fixture {
    fn revision(&self) -> Option<String> {
        fs::read(&self.file)
            .ok()
            .map(|bytes| format!("{:x}", Sha256::digest(bytes)))
    }

    fn request(&self, count: i64, wait: u64) -> WriteRequest {
        WriteRequest {
            roots: SnapshotRequest {
                project_root: self.dir.join("project"),
                trusted_root: self.dir.join("project"),
                global_dir: self.dir.join("home/.fgos"),
                class: SessionClass::Unconfined,
            },
            lock_root: self.dir.join("locks"),
            target: SourceKind::Project,
            expected: self.revision(),
            edits: vec![Edit::Set {
                path: parse_path("limits.count").unwrap(),
                value: json!(count),
            }],
            reason: "tune the limit for this repository".into(),
            acknowledge_comment_loss: false,
            lock_wait_ms: wait,
        }
    }

    fn ctx(&self) -> Context<'_> {
        Context {
            schemas: &self.schemas,
            standard: &self.standard,
            digest: "d",
            detectors: &NoDetectors,
        }
    }

    fn commit(&self, req: &WriteRequest) -> Result<(), SnapshotError> {
        commit(
            &self.ctx(),
            req,
            &common::writer(&json!({"session": "vantt"})),
        )
        .map(drop)
    }

    fn observed(
        &self,
        req: &WriteRequest,
        observe: impl FnMut(Step) -> std::io::Result<()>,
    ) -> Result<(), SnapshotError> {
        commit_observed(
            &self.ctx(),
            req,
            &common::writer(&json!({"session": "vantt"})),
            observe,
        )
        .map(drop)
    }
}

fn conflict(result: Result<(), SnapshotError>) -> Option<String> {
    match result {
        Err(SnapshotError::Refused(found)) if found[0].code == "config-write-conflict" => {
            found[0].detail.as_ref().and_then(|d| d.keyword.clone())
        }
        other => panic!("expected a conflict, got {other:?}"),
    }
}

#[test]
fn two_writers_from_one_revision_one_commits_and_the_file_holds_exactly_its_bytes() {
    let _serial = serial();
    let fx = fixture("race");
    let (first, second) = (fx.request(11, 5000), fx.request(22, 5000));
    let results = std::thread::scope(|scope| {
        let a = scope.spawn(|| fx.commit(&first));
        let b = scope.spawn(|| fx.commit(&second));
        [a.join().unwrap(), b.join().unwrap()]
    });
    let winner = results.iter().position(Result::is_ok).expect("one commits");
    assert_eq!(results.iter().filter(|r| r.is_ok()).count(), 1);
    let loser = results.into_iter().nth(1 - winner).unwrap();
    assert_eq!(conflict(loser).as_deref(), Some("revision-changed"));
    let text = fs::read_to_string(&fx.file).unwrap();
    assert!(
        text.contains(&format!("count: {}", [11, 22][winner])),
        "{text}"
    );
    assert_eq!(text.matches("count:").count(), 1, "{text}");
}

#[test]
fn a_lock_held_by_another_process_is_a_conflict_and_a_killed_holder_is_reclaimed() {
    let _serial = serial();
    let fx = fixture("held");
    let before = fs::read(&fx.file).unwrap();
    let mut holder = hold(&fx.dir);
    assert_eq!(
        conflict(fx.commit(&fx.request(9, 200))).as_deref(),
        Some("lock-held")
    );
    assert_eq!(
        fs::read(&fx.file).unwrap(),
        before,
        "a refused write changed the file"
    );
    holder.0.kill().unwrap();
    holder.0.wait().unwrap();
    fx.commit(&fx.request(9, 5000))
        .expect("the lock of a dead holder is reclaimed");
    assert!(fs::read_to_string(&fx.file).unwrap().contains("count: 9"));
}

#[test]
fn an_outside_rewrite_before_the_first_check_or_before_the_second_is_a_conflict_that_keeps_it() {
    let _serial = serial();
    for (tag, at) in [("first", Step::FirstCheck), ("second", Step::SecondCheck)] {
        let fx = fixture(tag);
        let req = fx.request(9, 5000);
        let rewrite = |step| {
            if step == at {
                // Another process, not this one, writes the file.
                let script = format!("printf 'limits:\\n  count: 77\\n' > {}", fx.file.display());
                assert!(Command::new("sh")
                    .args(["-c", &script])
                    .status()
                    .unwrap()
                    .success());
            }
            Ok(())
        };
        assert_eq!(
            conflict(fx.observed(&req, rewrite)).as_deref(),
            Some("revision-changed"),
            "{tag}"
        );
        assert_eq!(
            fs::read_to_string(&fx.file).unwrap(),
            "limits:\n  count: 77\n",
            "{tag}"
        );
    }
}

#[test]
fn an_observer_that_aborts_leaves_the_file_unchanged_and_no_temporary_file() {
    let _serial = serial();
    for at in [Step::Edited, Step::Validated, Step::SecondCheck] {
        let fx = fixture(&format!("abort-{at:?}"));
        let before = fs::read(&fx.file).unwrap();
        let abort = |step| {
            if step == at {
                Err(std::io::Error::other("stop"))
            } else {
                Ok(())
            }
        };
        assert!(
            matches!(
                fx.observed(&fx.request(9, 5000), abort),
                Err(SnapshotError::Io(_))
            ),
            "{at:?}"
        );
        assert_eq!(fs::read(&fx.file).unwrap(), before, "{at:?}");
        let names: Vec<_> = fs::read_dir(fx.file.parent().unwrap())
            .unwrap()
            .flatten()
            .map(|e| e.file_name())
            .collect();
        assert!(
            names.iter().all(|n| n == "config.yaml" || n == "locks"),
            "{at:?}: {names:?}"
        );
    }
}
