#![cfg(target_os = "linux")]
use fgos_git::{
    wal::{self, FileSystem, Phase},
    *,
};
use fgos_holder_lock::{acquire, Acquire, BorrowedHandle, Mode, Resource, Wait};
use std::{
    fs,
    path::{Path, PathBuf},
    process::Command,
    sync::atomic::{AtomicU64, Ordering},
};
static NEXT: AtomicU64 = AtomicU64::new(0);
struct Fixture {
    root: PathBuf,
    path: PathBuf,
    driver: GitDriver,
    repo: RepoHandle,
    first: Oid,
    second: Oid,
}
fn git(path: &Path, args: &[&str]) -> String {
    let out = Command::new("git")
        .arg("-C")
        .arg(path)
        .args(args)
        .output()
        .unwrap();
    assert!(
        out.status.success(),
        "{args:?}: {}",
        String::from_utf8_lossy(&out.stderr)
    );
    String::from_utf8(out.stdout).unwrap().trim().into()
}
impl Fixture {
    fn new(backend: &str) -> Self {
        use std::os::unix::fs::PermissionsExt;
        let root = std::env::temp_dir().join(format!(
            "fgos-refs-remote-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir(&root).unwrap();
        fs::set_permissions(&root, fs::Permissions::from_mode(0o700)).unwrap();
        git(
            &root,
            &[
                "init",
                "-q",
                "--initial-branch=trunk",
                &format!("--ref-format={backend}"),
                "repo",
            ],
        );
        let path = root.join("repo");
        git(&path, &["config", "user.name", "Fixture"]);
        git(&path, &["config", "user.email", "fixture@example.invalid"]);
        fs::write(path.join("file"), "one").unwrap();
        git(&path, &["add", "."]);
        git(&path, &["commit", "-qm", "one"]);
        let first = git(&path, &["rev-parse", "HEAD"]);
        fs::write(path.join("file"), "two").unwrap();
        git(&path, &["commit", "-qam", "two"]);
        let second = git(&path, &["rev-parse", "HEAD"]);
        let fence = path.join(".fgos/locks/activation.lock");
        fs::create_dir_all(&fence).unwrap();
        fs::write(
            fence.join("TOMBSTONE"),
            r#"{"lock":"activation","by":"fgos git","at":"fixture"}"#,
        )
        .unwrap();
        let driver = GitDriver::new(&root).unwrap();
        let repo = match driver.resolve_repo(&path, &path).unwrap() {
            ResolveRepo::Repository(r) => r,
            _ => panic!(),
        };
        let first = Oid::parse(&first, repo.object_format()).unwrap();
        let second = Oid::parse(&second, repo.object_format()).unwrap();
        Self {
            root,
            path,
            driver,
            repo,
            first,
            second,
        }
    }
    fn remote(&self) -> RemoteGrant {
        let bare = self.root.join("remote.git");
        git(
            &self.path,
            &["init", "-q", "--bare", bare.to_str().unwrap()],
        );
        git(
            &self.path,
            &["remote", "add", "origin", bare.to_str().unwrap()],
        );
        RemoteGrant {
            name: "origin".into(),
            pinned_url: bare.to_str().unwrap().into(),
        }
    }
}
impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.root);
    }
}
struct Stop(&'static str);
impl FileSystem for Stop {
    fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
        if step == self.0 {
            Err(std::io::Error::other("crash probe"))
        } else {
            Ok(())
        }
    }
}
#[test]
fn target_attempt_survives_aba_and_never_reissues() {
    for backend in ["files", "reftable"] {
        let f = Fixture::new(backend);
        let name = RefName::parse("refs/heads/topic").unwrap();
        git(&f.path, &["update-ref", name.as_str(), f.first.as_str()]);
        let error = f
            .driver
            .change_ref(
                &f.repo,
                vec![],
                &name,
                &ExpectedTip::Oid(f.first.clone()),
                &ExpectedTip::Oid(f.second.clone()),
                false,
                "fixture",
                "crash",
                &Stop("after-target-cas"),
            )
            .unwrap_err();
        assert_eq!(error.code, ResultCode::RecoveryRequired);
        assert!(error.receipt.is_some());
        git(&f.path, &["update-ref", name.as_str(), f.first.as_str()]); // ABA cannot grant another attempt.
        assert_eq!(
            f.driver
                .advance_ref(
                    &f.repo,
                    vec![],
                    &name,
                    &f.first,
                    &f.second,
                    "fixture",
                    "crash"
                )
                .unwrap_err()
                .code,
            ResultCode::RecoveryRequired
        );
        assert_eq!(
            git(&f.path, &["rev-parse", name.as_str()]),
            f.first.as_str()
        );
        let wal = wal::Wal::open(&f.repo).unwrap();
        let chain = wal.inspect("crash").unwrap();
        assert!(matches!(chain.last().phase, Phase::TargetAttempt { .. }));
        assert!(
            git(
                &f.path,
                &["rev-parse", "refs/fgos/git-operations/crash/candidate"]
            ) == f.second.as_str()
        );
        assert!(f
            .driver
            .delete_ref(&f.repo, vec![], &name, &f.first, "fixture", "other")
            .unwrap_err()
            .cause
            .contains("recovery"));
    }
}
#[test]
fn late_raw_checkout_switch_is_recovery_required_and_unborn_is_in_use() {
    struct Switch(PathBuf, PathBuf);
    impl FileSystem for Switch {
        fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
            if step == "before-target-cas" {
                git(
                    &self.0,
                    &["worktree", "add", "-q", self.1.to_str().unwrap(), "topic"],
                );
            }
            Ok(())
        }
    }
    for backend in ["files", "reftable"] {
        let f = Fixture::new(backend);
        let name = RefName::parse("refs/heads/topic").unwrap();
        git(&f.path, &["update-ref", name.as_str(), f.first.as_str()]);
        let switch = Switch(f.path.clone(), f.root.join("late"));
        let error = f
            .driver
            .change_ref(
                &f.repo,
                vec![],
                &name,
                &ExpectedTip::Oid(f.first.clone()),
                &ExpectedTip::Absent,
                false,
                "fixture",
                "switch",
                &switch,
            )
            .unwrap_err();
        assert!(error.cause.contains("checkout-switch"));
        assert_eq!(error.code, ResultCode::RecoveryRequired);
        git(&f.path, &["symbolic-ref", "HEAD", "refs/heads/unborn"]);
        let unborn = RefName::parse("refs/heads/unborn").unwrap();
        assert!(f
            .driver
            .ensure_branch(&f.repo, vec![], &unborn, &f.first, "fixture", "unborn")
            .unwrap_err()
            .cause
            .contains("branch-in-use"));
    }
}
#[test]
fn fast_forward_requires_exact_lease_and_clean_tree() {
    use std::os::unix::fs::MetadataExt;
    for backend in ["files", "reftable"] {
        let f = Fixture::new(backend);
        let linked = f.root.join("linked");
        git(&f.path, &["branch", "topic", f.first.as_str()]);
        git(
            &f.path,
            &["worktree", "add", "-q", linked.to_str().unwrap(), "topic"],
        );
        let name = RefName::parse("refs/heads/topic").unwrap();
        assert!(f
            .driver
            .fast_forward_checked_out(
                &f.repo,
                vec![],
                &name,
                &f.first,
                &f.second,
                "fixture",
                "no-lease"
            )
            .unwrap_err()
            .cause
            .contains("custody"));
        let m = fs::metadata(&linked).unwrap();
        let lock = f.path.join(format!(
            ".fgos/locks/dispatch-cwd--{}-{}.lock",
            m.dev(),
            m.ino()
        ));
        let lease = match acquire(
            &Resource::new("dispatch-cwd", lock),
            Mode::Ex,
            Wait::Try,
            1000,
        ) {
            Acquire::Acquired(h) => h,
            _ => panic!(),
        };
        fs::write(linked.join("file"), "dirty").unwrap();
        assert!(f
            .driver
            .fast_forward_checked_out(
                &f.repo,
                vec![BorrowedHandle::new(&lease).unwrap()],
                &name,
                &f.first,
                &f.second,
                "fixture",
                "dirty"
            )
            .unwrap_err()
            .cause
            .contains("dirty"));
        fs::write(linked.join("file"), "one").unwrap();
        // Equal content with a changed stat cache must still be a clean FF.
        fs::File::open(linked.join("file"))
            .unwrap()
            .set_times(
                fs::FileTimes::new().set_modified(
                    std::time::UNIX_EPOCH + std::time::Duration::from_secs(1700000000),
                ),
            )
            .unwrap();
        let result = f
            .driver
            .fast_forward_checked_out(
                &f.repo,
                vec![BorrowedHandle::new(&lease).unwrap()],
                &name,
                &f.first,
                &f.second,
                "fixture",
                "ff",
            )
            .unwrap();
        assert!(matches!(result.checkout, Checkout::Reconciled));
        assert_eq!(fs::read(linked.join("file")).unwrap(), b"two");
    }
}
#[test]
fn lost_remote_ack_preserves_attempt_and_does_not_send_again() {
    let f = Fixture::new("files");
    let remote = f.remote();
    let mappings = [RefMapping {
        source: RefName::parse("refs/heads/trunk").unwrap(),
        destination: RefName::parse("refs/heads/shared").unwrap(),
    }];
    let error = f
        .driver
        .transfer_refs(
            &f.repo,
            vec![],
            &remote,
            &mappings,
            "fixture",
            "push-crash",
            true,
            &Stop("after-remote-transfer"),
        )
        .unwrap_err();
    assert_eq!(error.code, ResultCode::RemoteOutcomeUnknown);
    let names = [RefName::parse("refs/heads/shared").unwrap()];
    assert_eq!(
        f.driver
            .inspect_remote(&f.repo, vec![], &remote, &names)
            .unwrap()[0]
            .oid,
        f.second
    );
    git(
        Path::new(&remote.pinned_url),
        &["update-ref", "refs/heads/shared", f.first.as_str()],
    );
    assert!(f
        .driver
        .push_refs(&f.repo, vec![], &remote, &mappings, "fixture", "push-crash")
        .is_err());
    assert_eq!(
        git(
            Path::new(&remote.pinned_url),
            &["rev-parse", "refs/heads/shared"]
        ),
        f.first.as_str()
    );
    let wal = wal::Wal::open(&f.repo).unwrap();
    let chain = wal.inspect("push-crash").unwrap();
    assert!(matches!(chain.last().phase, Phase::TargetAttempt { .. }));
}

// A separate fgOS-style worktree creator queues on the same real rank-40
// description. Fixture parameters affect this test process only.
#[test]
fn queued_worktree_add_child() {
    let root = std::env::current_dir().unwrap();
    if !root.join("waiter-fixture").is_file() {
        return;
    }
    fs::write(root.join("waiting"), b"ready").unwrap();
    let lock = root.join("repo/.fgos/locks/worktree-admin.lock");
    let handle = match acquire(
        &Resource::new("worktree-admin", lock),
        Mode::Ex,
        Wait::Ms(5000),
        1000,
    ) {
        Acquire::Acquired(h) => h,
        other => panic!("{other:?}"),
    };
    let out = Command::new("git")
        .arg("-C")
        .arg(root.join("repo"))
        .args(["worktree", "add", "-q"])
        .arg(root.join("late"))
        .arg("topic")
        .output()
        .unwrap();
    assert!(
        !out.status.success(),
        "deleted branch must not be recreated by the queued add"
    );
    drop(handle);
}
#[test]
fn worktree_add_queued_on_admin_cannot_attach_after_delete() {
    use std::sync::Mutex;
    struct Queue {
        root: PathBuf,
        child: Mutex<Option<std::process::Child>>,
    }
    impl FileSystem for Queue {
        fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
            if step == "before-target-cas" {
                let child = Command::new(std::env::current_exe()?)
                    .args(["--exact", "queued_worktree_add_child", "--nocapture"])
                    .current_dir(&self.root)
                    .spawn()?;
                *self.child.lock().unwrap() = Some(child);
                let end = std::time::Instant::now() + std::time::Duration::from_secs(5);
                while !self.root.join("waiting").exists() {
                    if std::time::Instant::now() > end {
                        return Err(std::io::Error::other("waiter did not start"));
                    }
                    std::thread::sleep(std::time::Duration::from_millis(1));
                }
                assert!(self
                    .child
                    .lock()
                    .unwrap()
                    .as_mut()
                    .unwrap()
                    .try_wait()?
                    .is_none());
            }
            Ok(())
        }
    }
    for backend in ["files", "reftable"] {
        let f = Fixture::new(backend);
        let name = RefName::parse("refs/heads/topic").unwrap();
        git(&f.path, &["update-ref", name.as_str(), f.first.as_str()]);
        fs::write(f.root.join("waiter-fixture"), b"fixture").unwrap();
        let queue = Queue {
            root: f.root.clone(),
            child: Mutex::new(None),
        };
        f.driver
            .change_ref(
                &f.repo,
                vec![],
                &name,
                &ExpectedTip::Oid(f.first.clone()),
                &ExpectedTip::Absent,
                false,
                "fixture",
                "delete-queued",
                &queue,
            )
            .unwrap();
        assert!(queue
            .child
            .lock()
            .unwrap()
            .take()
            .unwrap()
            .wait()
            .unwrap()
            .success());
        assert!(!f.root.join("late").exists());
    }
}
