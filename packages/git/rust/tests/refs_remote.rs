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
        let lock = f.path.join(dispatch_cwd_lock_name(&linked));
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

#[test]
fn pinned_remote_refuses_rewrites_and_repository_transport_config() {
    let f = Fixture::new("files");
    let remote = f.remote();
    let evil = f.root.join("evil.git");
    git(&f.path, &["init", "-q", "--bare", evil.to_str().unwrap()]);
    let mappings = [RefMapping {
        source: RefName::parse("refs/heads/trunk").unwrap(),
        destination: RefName::parse("refs/heads/shared").unwrap(),
    }];
    for suffix in ["insteadOf", "pushInsteadOf"] {
        let key = format!("url.{}.{}", evil.display(), suffix);
        git(&f.path, &["config", &key, &remote.pinned_url]);
        // Reproduce Git's explicit-URL redirect before checking the hardened door.
        git(
            &f.path,
            &[
                "push",
                "--",
                &remote.pinned_url,
                "trunk:refs/heads/reproduced",
            ],
        );
        assert_eq!(
            git(&evil, &["rev-parse", "refs/heads/reproduced"]),
            f.second.as_str()
        );
        assert!(git(Path::new(&remote.pinned_url), &["for-each-ref"]).is_empty());
        git(&evil, &["update-ref", "-d", "refs/heads/reproduced"]);
        assert!(f
            .driver
            .push_refs(&f.repo, vec![], &remote, &mappings, "fixture", suffix)
            .unwrap_err()
            .cause
            .contains("repository-config-untrusted"));
        git(&f.path, &["config", "--unset", &key]);
        assert!(git(&evil, &["for-each-ref"]).is_empty());
        assert!(git(Path::new(&remote.pinned_url), &["for-each-ref"]).is_empty());
    }
    // Safe generic values are overridden; a nonexistent proxy cannot redirect
    // or prevent a real transfer. Scoped values still refuse below.
    git(&f.path, &["config", "http.proxy", "http://127.0.0.1:1"]);
    git(&f.path, &["config", "http.sslVerify", "false"]);
    git(
        &f.path,
        &["config", "http.extraHeader", "Authorization: untrusted"],
    );
    f.driver
        .push_refs(
            &f.repo,
            vec![],
            &remote,
            &mappings,
            "fixture",
            "safe-overrides",
        )
        .unwrap();
    for key in ["http.proxy", "http.sslVerify", "http.extraHeader"] {
        git(&f.path, &["config", "--unset", key]);
    }
    for key in [
        "http.sslCAInfo",
        "http.https://example.invalid/.proxy",
        "http.https://example.invalid/.extraHeader",
        "remote.origin.proxy",
        "protocol.file.allow",
    ] {
        git(&f.path, &["config", key, "false"]);
        assert!(
            f.driver
                .push_refs(&f.repo, vec![], &remote, &mappings, "fixture", "transport")
                .unwrap_err()
                .cause
                .contains("repository-transport-config-untrusted"),
            "{key}"
        );
        git(&f.path, &["config", "--unset", key]);
    }
}

#[test]
fn transport_trust_uses_scope_for_main_worktree_config_and_symlinked_paths() {
    use std::os::unix::fs::symlink;
    let f = Fixture::new("files");
    let remote = f.remote();
    let linked = f.root.join("linked");
    git(
        &f.path,
        &["worktree", "add", "-qb", "linked", linked.to_str().unwrap()],
    );
    git(&f.path, &["config", "extensions.worktreeConfig", "true"]);
    let key = "http.https://example.invalid/.extraheader";
    git(&f.path, &["config", "--worktree", key, "secret"]);
    let alias = f.root.join("alias");
    symlink(&f.path, &alias).unwrap();
    let mappings = [RefMapping {
        source: RefName::parse("refs/heads/trunk").unwrap(),
        destination: RefName::parse("refs/heads/shared").unwrap(),
    }];
    for (cwd, main) in [(&linked, &f.path), (&alias, &alias)] {
        let ResolveRepo::Repository(repo) = f.driver.resolve_repo(cwd, main).unwrap() else {
            panic!()
        };
        assert_eq!(
            f.driver.untrusted_transport_config(&repo).unwrap(),
            vec![key]
        );
        let error = f
            .driver
            .push_refs(
                &repo,
                vec![],
                &remote,
                &mappings,
                "fixture",
                "scope-refusal",
            )
            .unwrap_err();
        assert!(
            error
                .cause
                .contains("repository-transport-config-untrusted"),
            "{error:?}"
        );
    }
    assert!(git(Path::new(&remote.pinned_url), &["for-each-ref"]).is_empty());
    // The main config file can itself have a different filesystem spelling.
    git(&f.path, &["config", "--worktree", "--unset", key]);
    let config = f.path.join(".git/config");
    let actual = f.root.join("actual-config");
    fs::rename(&config, &actual).unwrap();
    symlink(&actual, &config).unwrap();
    git(&f.path, &["config", "--local", key, "secret"]);
    assert_eq!(
        f.driver.untrusted_transport_config(&f.repo).unwrap(),
        vec![key]
    );
    assert!(f
        .driver
        .push_refs(
            &f.repo,
            vec![],
            &remote,
            &mappings,
            "fixture",
            "symlink-refusal"
        )
        .unwrap_err()
        .cause
        .contains("repository-transport-config-untrusted"));
}

#[test]
fn atomic_push_rejection_leaves_every_target_unchanged() {
    let f = Fixture::new("files");
    let remote = f.remote();
    git(
        &f.path,
        &["push", &remote.pinned_url, "trunk:refs/heads/existing"],
    );
    git(&f.path, &["branch", "old", f.first.as_str()]);
    let mappings = [
        RefMapping {
            source: RefName::parse("refs/heads/trunk").unwrap(),
            destination: RefName::parse("refs/heads/new").unwrap(),
        },
        RefMapping {
            source: RefName::parse("refs/heads/old").unwrap(),
            destination: RefName::parse("refs/heads/existing").unwrap(),
        },
    ];
    assert!(matches!(
        f.driver
            .push_refs(&f.repo, vec![], &remote, &mappings, "fixture", "atomic")
            .unwrap()
            .remote,
        Remote::Rejected
    ));
    assert_eq!(
        git(
            Path::new(&remote.pinned_url),
            &["for-each-ref", "--format=%(refname)"]
        ),
        "refs/heads/existing"
    );
    let chain = wal::Wal::open(&f.repo).unwrap().inspect("atomic").unwrap();
    assert!(
        matches!(chain.outcome(), Some(wal::Outcome::Transfer { acknowledged:false, unknown:false, observations, .. }) if observations.len() == 2)
    );
}

#[test]
fn fetch_rewind_and_stale_destinations_settle_with_observations() {
    struct Move(PathBuf, String);
    impl FileSystem for Move {
        fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
            if step == "after-remote-transfer" {
                git(
                    &self.0,
                    &["update-ref", "refs/remotes/origin/shared", &self.1],
                );
            }
            Ok(())
        }
    }
    for backend in ["files", "reftable"] {
        let f = Fixture::new(backend);
        let remote = f.remote();
        git(
            &f.path,
            &[
                "push",
                &remote.pinned_url,
                &format!("{}:refs/heads/shared", f.first.as_str()),
            ],
        );
        git(
            &f.path,
            &[
                "update-ref",
                "refs/remotes/origin/shared",
                f.second.as_str(),
            ],
        );
        let mappings = [RefMapping {
            source: RefName::parse("refs/heads/shared").unwrap(),
            destination: RefName::parse("refs/remotes/origin/shared").unwrap(),
        }];
        let stopped = f
            .driver
            .transfer_refs(
                &f.repo,
                vec![],
                &remote,
                &mappings,
                "fixture",
                "before-install",
                false,
                &Stop("after-remote-transfer"),
            )
            .unwrap();
        assert!(matches!(stopped.remote, Remote::Rejected));
        let stopped_chain = wal::Wal::open(&f.repo)
            .unwrap()
            .inspect("before-install")
            .unwrap();
        assert!(matches!(
            stopped_chain.outcome(),
            Some(wal::Outcome::Transfer {
                acknowledged: false,
                unknown: false,
                ..
            })
        ));
        assert!(matches!(
            f.driver
                .fetch_refs(&f.repo, vec![], &remote, &mappings, "fixture", "rewind")
                .unwrap()
                .remote,
            Remote::Acknowledged
        ));
        assert_eq!(
            git(&f.path, &["rev-parse", "refs/remotes/origin/shared"]),
            f.first.as_str()
        );
        let untouched = RefName::parse("refs/remotes/origin/untouched").unwrap();
        let stale_mappings = [
            RefMapping {
                source: mappings[0].source.clone(),
                destination: untouched.clone(),
            },
            mappings[0].clone(),
        ];
        assert!(matches!(
            f.driver
                .transfer_refs(
                    &f.repo,
                    vec![],
                    &remote,
                    &stale_mappings,
                    "fixture",
                    "stale",
                    false,
                    &Move(f.path.clone(), f.second.as_str().into())
                )
                .unwrap()
                .remote,
            Remote::Rejected
        ));
        assert!(matches!(
            f.driver.resolve_ref(&f.repo, &untouched).unwrap(),
            RefValue::Absent
        ));
        let chain = wal::Wal::open(&f.repo).unwrap().inspect("stale").unwrap();
        assert!(
            matches!(chain.outcome(), Some(wal::Outcome::Transfer { acknowledged:false, observations, .. }) if observations.len() == 2)
        );
    }
}

#[test]
fn rebase_bisect_and_user_locked_worktrees_have_precise_membership() {
    let f = Fixture::new("files");
    let linked = f.root.join("linked");
    git(&f.path, &["branch", "topic", f.first.as_str()]);
    git(
        &f.path,
        &["worktree", "add", "-q", linked.to_str().unwrap(), "topic"],
    );
    git(&f.path, &["worktree", "lock", linked.to_str().unwrap()]);
    let other = RefName::parse("refs/heads/other").unwrap();
    f.driver
        .ensure_branch(&f.repo, vec![], &other, &f.first, "fixture", "locked-user")
        .unwrap();
    git(&linked, &["checkout", "--detach", "-q"]);
    let admin = f.path.join(".git/worktrees/linked");
    let name = RefName::parse("refs/heads/topic").unwrap();
    for (i, (state, value)) in [
        ("rebase-merge/head-name", "refs/heads/topic"),
        ("rebase-apply/head-name", "refs/heads/topic"),
        ("BISECT_START", "topic"),
    ]
    .into_iter()
    .enumerate()
    {
        let p = admin.join(state);
        fs::create_dir_all(p.parent().unwrap()).unwrap();
        fs::write(&p, value).unwrap();
        assert_eq!(
            f.driver
                .delete_ref(
                    &f.repo,
                    vec![],
                    &name,
                    &f.first,
                    "fixture",
                    &format!("busy-{i}")
                )
                .unwrap_err()
                .cause,
            "branch-in-use"
        );
        fs::remove_file(p).unwrap();
    }
}

#[test]
fn main_checkout_fast_forward_is_refused() {
    let f = Fixture::new("files");
    let name = RefName::parse("refs/heads/trunk").unwrap();
    assert_eq!(
        f.driver
            .fast_forward_checked_out(
                &f.repo,
                vec![],
                &name,
                &f.second,
                &f.first,
                "fixture",
                "main"
            )
            .unwrap_err()
            .cause,
        "main-checkout-fast-forward-refused"
    );
}

#[test]
fn unchanged_ref_lock_failure_is_not_cas_loss() {
    let f = Fixture::new("files");
    let name = RefName::parse("refs/heads/topic").unwrap();
    git(&f.path, &["branch", "topic", f.first.as_str()]);
    fs::write(f.path.join(".git/refs/heads/topic.lock"), b"foreign").unwrap();
    let error = f
        .driver
        .advance_ref(
            &f.repo,
            vec![],
            &name,
            &f.first,
            &f.second,
            "fixture",
            "locked-ref",
        )
        .unwrap_err();
    assert_eq!(error.code, ResultCode::RecoveryRequired);
    assert_ne!(error.cause, "compare-and-swap-stale");
    let chain = wal::Wal::open(&f.repo)
        .unwrap()
        .inspect("locked-ref")
        .unwrap();
    assert!(!matches!(chain.outcome(), Some(wal::Outcome::Loss { .. })));
}

#[test]
fn ignored_checkout_collision_refuses_before_target_attempt() {
    let f = Fixture::new("files");
    fs::write(f.path.join("collision"), b"new tracked data").unwrap();
    git(&f.path, &["add", "collision"]);
    git(&f.path, &["commit", "-qm", "track collision"]);
    let next = Oid::parse(
        &git(&f.path, &["rev-parse", "HEAD"]),
        f.repo.object_format(),
    )
    .unwrap();
    let linked = f.root.join("linked");
    git(
        &f.path,
        &[
            "worktree",
            "add",
            "-qb",
            "topic",
            linked.to_str().unwrap(),
            f.second.as_str(),
        ],
    );
    fs::write(f.path.join(".git/info/exclude"), "collision\n").unwrap();
    fs::create_dir(linked.join("collision")).unwrap();
    fs::write(linked.join("collision/precious"), b"precious ignored data").unwrap();
    let lease = match acquire(
        &Resource::new("dispatch-cwd", f.path.join(dispatch_cwd_lock_name(&linked))),
        Mode::Ex,
        Wait::Try,
        1000,
    ) {
        Acquire::Acquired(h) => h,
        _ => panic!(),
    };
    let error = f
        .driver
        .fast_forward_checked_out(
            &f.repo,
            vec![BorrowedHandle::new(&lease).unwrap()],
            &RefName::parse("refs/heads/topic").unwrap(),
            &f.second,
            &next,
            "fixture",
            "collision",
        )
        .unwrap_err();
    assert_eq!(error.cause, "checkout-preflight-failed");
    assert_eq!(git(&f.path, &["rev-parse", "topic"]), f.second.as_str());
    assert_eq!(
        fs::read(linked.join("collision/precious")).unwrap(),
        b"precious ignored data"
    );
    let chain = wal::Wal::open(&f.repo)
        .unwrap()
        .inspect("collision")
        .unwrap();
    assert!(!chain
        .records()
        .iter()
        .any(|r| matches!(r.phase, Phase::TargetAttempt { .. })));
}

#[test]
fn nested_registered_worktree_resolution_uses_longest_prefix() {
    let f = Fixture::new("files");
    let outer = f.root.join("outer");
    let inner = outer.join("inner");
    git(
        &f.path,
        &["worktree", "add", "-qb", "outer", outer.to_str().unwrap()],
    );
    git(
        &f.path,
        &["worktree", "add", "-qb", "inner", inner.to_str().unwrap()],
    );
    for _ in 0..3 {
        let ResolveRepo::Repository(repo) = f.driver.resolve_repo(&inner, &f.path).unwrap() else {
            panic!()
        };
        assert_eq!(repo.git_dir(), f.path.join(".git/worktrees/inner"));
    }
}

#[test]
fn wal_schema_records_from_real_refs_and_transfers() {
    let f = Fixture::new("files");
    let name = RefName::parse("refs/heads/topic").unwrap();
    f.driver
        .ensure_branch(&f.repo, vec![], &name, &f.first, "fixture", "schema-create")
        .unwrap();
    f.driver
        .delete_ref(&f.repo, vec![], &name, &f.first, "fixture", "schema-delete")
        .unwrap();
    let remote = f.remote();
    f.driver
        .push_refs(
            &f.repo,
            vec![],
            &remote,
            &[RefMapping {
                source: RefName::parse("refs/heads/trunk").unwrap(),
                destination: RefName::parse("refs/heads/shared").unwrap(),
            }],
            "fixture",
            "schema-push",
        )
        .unwrap();
    f.driver
        .fetch_refs(
            &f.repo,
            vec![],
            &remote,
            &[RefMapping {
                source: RefName::parse("refs/heads/shared").unwrap(),
                destination: RefName::parse("refs/remotes/origin/shared").unwrap(),
            }],
            "fixture",
            "schema-fetch",
        )
        .unwrap();
    let wal = wal::Wal::open(&f.repo).unwrap();
    for id in [
        "schema-create",
        "schema-delete",
        "schema-push",
        "schema-fetch",
    ] {
        let chain = wal.inspect(id).unwrap();
        for record in chain.records() {
            let bytes = serde_json::to_vec(record).unwrap();
            let decoded: wal::Record = serde_json::from_slice(&bytes).unwrap();
            assert_eq!(decoded.digest, record.digest);
            // --nocapture supplies actual serialized evidence to a schema validator.
            println!("WAL_SCHEMA_RECORD {}", String::from_utf8(bytes).unwrap());
        }
    }
}

/// The registry's `dispatch-cwd--<dev>-<ino>-<birthtimeNs>.lock` for a checkout directory.
fn dispatch_cwd_lock_name(dir: &std::path::Path) -> String {
    use std::os::unix::fs::MetadataExt;
    let m = fs::metadata(fs::canonicalize(dir).unwrap()).unwrap();
    let birth = m
        .created()
        .unwrap()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    format!(
        ".fgos/locks/dispatch-cwd--{}-{}-{}.lock",
        m.dev(),
        m.ino(),
        birth
    )
}

#[test]
fn non_event_transfer_accepts_main_checkout_loan_without_worktree_admin() {
    let f = Fixture::new("files");
    let remote = f.remote();
    let main = match acquire(&Resource::new("main-checkout", f.path.join(".fgos/locks/main-checkout.lock")), Mode::Ex, Wait::Try, 2000) {
        Acquire::Acquired(h) => h, e => panic!("{e:?}"),
    };
    let mappings = [RefMapping { source: RefName::parse("refs/heads/trunk").unwrap(), destination: RefName::parse("refs/heads/shared").unwrap() }];
    f.driver.push_refs(&f.repo, vec![BorrowedHandle::new(&main).unwrap()], &remote, &mappings, "fixture", "main-loan-push").unwrap();
    assert_eq!(git(Path::new(&remote.pinned_url), &["rev-parse", "refs/heads/shared"]), f.second.as_str());
    assert!(!f.path.join(".fgos/locks/worktree-admin.lock").exists());
}
