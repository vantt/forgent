#![cfg(target_os = "linux")]
use fgos_git::*;
use fgos_holder_lock::{acquire, Acquire, BorrowedHandle, Handle, Mode, Resource, Wait};
use std::{
    fs,
    path::{Path, PathBuf},
    process::Command,
    sync::atomic::{AtomicU64, Ordering},
};
static SERIAL: AtomicU64 = AtomicU64::new(0);
fn git(root: &Path, args: &[&str]) -> String {
    let out = Command::new("git")
        .arg("-C")
        .arg(root)
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
struct Fixture {
    temp: PathBuf,
    main: PathBuf,
    tree: PathBuf,
    driver: GitDriver,
    repo: RepoHandle,
    lease: Option<Handle>,
}
impl Fixture {
    fn new() -> Self {
        use std::os::unix::fs::{MetadataExt, PermissionsExt};
        let temp = std::env::temp_dir().join(format!(
            "fgos-p05-{}-{}",
            std::process::id(),
            SERIAL.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir(&temp).unwrap();
        fs::set_permissions(&temp, fs::Permissions::from_mode(0o700)).unwrap();
        let main = temp.join("repo");
        fs::create_dir(&main).unwrap();
        git(&main, &["init", "-q", "--initial-branch=trunk"]);
        git(&main, &["config", "user.name", "Fixture"]);
        git(&main, &["config", "user.email", "fixture@example.invalid"]);
        fs::write(main.join("a"), "base\n").unwrap();
        git(&main, &["add", "."]);
        git(&main, &["commit", "-qm", "base"]);
        let tree = temp.join("producer");
        git(
            &main,
            &["worktree", "add", "-qb", "producer", tree.to_str().unwrap()],
        );
        let fence = main.join(".fgos/locks/activation.lock");
        fs::create_dir_all(&fence).unwrap();
        fs::write(
            fence.join("TOMBSTONE"),
            r#"{"lock":"activation","by":"fgos git","at":"fixture"}"#,
        )
        .unwrap();
        let m = fs::metadata(&tree).unwrap();
        let birth = m
            .created()
            .unwrap()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let key = format!("dispatch-cwd--{}-{}-{}.lock", m.dev(), m.ino(), birth);
        let lease = match acquire(
            &Resource::new("dispatch-cwd", main.join(".fgos/locks").join(key)),
            Mode::Ex,
            Wait::Ms(100),
            5000,
        ) {
            Acquire::Acquired(h) => h,
            other => panic!("{other:?}"),
        };
        let driver = GitDriver::new(&temp).unwrap();
        let repo = match driver.resolve_repo(&tree, &main).unwrap() {
            ResolveRepo::Repository(r) => r,
            _ => panic!(),
        };
        Self {
            temp,
            main,
            tree,
            driver,
            repo,
            lease: Some(lease),
        }
    }
    fn held(&self) -> Vec<BorrowedHandle<'_>> {
        vec![BorrowedHandle::new(self.lease.as_ref().unwrap()).unwrap()]
    }
}
impl Drop for Fixture {
    fn drop(&mut self) {
        drop(self.lease.take());
        fs::remove_dir_all(&self.temp).unwrap();
    }
}
#[test]
fn literal_scoped_commit_real_hook_and_replay() {
    let f = Fixture::new();
    let baseline = f.driver.preflight_commit(&f.repo, f.held()).unwrap();
    fs::write(f.tree.join("[literal]"), "selected").unwrap();
    fs::write(f.tree.join("outside"), "outside").unwrap();
    let request = CommitRequest {
        writes: vec!["[literal]".into()],
        message: "consumer message\n\nbody\n".into(),
        cutover_grant: None,
    };
    let result = f
        .driver
        .scoped_commit(&f.repo, f.held(), &baseline, &request, "fixture", "exact")
        .unwrap();
    assert_eq!(result.status, ResultCode::Committed);
    assert_eq!(result.files, vec!["[literal]"]);
    assert_eq!(
        f.driver
            .scoped_commit(&f.repo, f.held(), &baseline, &request, "fixture", "exact")
            .unwrap()
            .oid,
        result.oid
    );
    assert_eq!(
        git(&f.tree, &["show", "-s", "--format=%B"]),
        "consumer message\n\nbody"
    );
    assert!(f.tree.join("outside").exists());
}
#[test]
fn hook_tree_tampering_reports_real_effect() {
    use std::os::unix::fs::PermissionsExt;
    let f = Fixture::new();
    let hooks = f.main.join("hooks");
    fs::create_dir(&hooks).unwrap();
    let hook = hooks.join("pre-commit");
    fs::write(&hook, "#!/bin/sh\nprintf hook > a\ngit add a\n").unwrap();
    fs::set_permissions(&hook, fs::Permissions::from_mode(0o755)).unwrap();
    git(&f.main, &["config", "core.hooksPath", "hooks"]);
    let baseline = f.driver.preflight_commit(&f.repo, f.held()).unwrap();
    fs::write(f.tree.join("a"), "producer").unwrap();
    let request = CommitRequest {
        writes: vec!["a".into()],
        message: "commit".into(),
        cutover_grant: None,
    };
    let result = f
        .driver
        .scoped_commit(&f.repo, f.held(), &baseline, &request, "fixture", "hook")
        .unwrap();
    assert_eq!(result.status, ResultCode::CommittedButContractViolation);
    assert!(result.oid.is_some());
    assert_eq!(git(&f.tree, &["show", "HEAD:a"]), "hook");
}
#[test]
fn sync_clean_and_conflict_resolution_have_exact_parents() {
    for conflict in [false, true] {
        let f = Fixture::new();
        if conflict {
            fs::write(f.tree.join("a"), "producer\n").unwrap();
            git(&f.tree, &["commit", "-qam", "producer"]);
        }
        fs::write(
            f.main.join(if conflict { "a" } else { "incoming" }),
            "target\n",
        )
        .unwrap();
        git(&f.main, &["add", "."]);
        git(&f.main, &["commit", "-qm", "target"]);
        let head = git(&f.tree, &["rev-parse", "HEAD"]);
        let target = git(&f.main, &["rev-parse", "HEAD"]);
        let oid = Oid::parse(&target, ObjectFormat::Sha1).unwrap();
        let first = f
            .driver
            .start_sync(&f.repo, f.held(), &oid, "consumer sync", "fixture", "sync")
            .unwrap();
        if conflict {
            assert_eq!(first.state, "conflicted-open");
            assert_eq!(first.resolver_grant, vec!["a"]);
            assert!(f
                .driver
                .continue_sync(&f.repo, f.held(), "fixture", "sync")
                .unwrap_err()
                .cause
                .contains("conflict-markers"));
            fs::write(f.tree.join("a"), "resolved\n").unwrap();
            let result = f
                .driver
                .continue_sync(&f.repo, f.held(), "fixture", "sync")
                .unwrap();
            assert_eq!(result.state, "done");
        } else {
            assert_eq!(first.state, "done");
        }
        assert_eq!(
            git(&f.tree, &["show", "-s", "--format=%P"]),
            format!("{head} {target}")
        );
    }
}
#[test]
fn markers_include_tabs_and_diff3_but_skip_binary() {
    for m in [b"<<<<<<<\tleft".as_slice(), b"|||||||| base", b">>>>>>>"] {
        assert!(has_conflict_markers(m));
    }
    assert!(!has_conflict_markers(b"\0<<<<<<< left"));
}

#[test]
fn noop_is_durable_and_checkpoint_selects_only_non_event_tracked_files() {
    let f = Fixture::new();
    let baseline = f.driver.preflight_commit(&f.repo, f.held()).unwrap();
    let request = CommitRequest {
        writes: vec!["a".into()],
        message: "noop".into(),
        cutover_grant: None,
    };
    assert_eq!(
        f.driver
            .scoped_commit(&f.repo, f.held(), &baseline, &request, "fixture", "noop")
            .unwrap()
            .status,
        ResultCode::Unchanged
    );
    fs::write(f.tree.join("a"), "later bytes").unwrap();
    assert_eq!(
        f.driver
            .scoped_commit(&f.repo, f.held(), &baseline, &request, "fixture", "noop")
            .unwrap()
            .status,
        ResultCode::Unchanged
    );
    assert_eq!(git(&f.tree, &["rev-parse", "HEAD"]), baseline.head);
    let main = match f.driver.resolve_repo(&f.main, &f.main).unwrap() {
        ResolveRepo::Repository(r) => r,
        _ => panic!(),
    };
    fs::write(f.main.join("a"), "checkpoint").unwrap();
    fs::write(f.main.join("untracked"), "leave").unwrap();
    assert!(f
        .driver
        .checkpoint_tracked_files(
            &main,
            vec![],
            vec![".fgos/events.jsonl".into()],
            "refuse".into(),
            "fixture",
            "bad-checkpoint"
        )
        .is_err());
    let result = f
        .driver
        .checkpoint_tracked_files(
            &main,
            vec![],
            vec!["a".into()],
            "consumer checkpoint".into(),
            "fixture",
            "checkpoint",
        )
        .unwrap();
    assert_eq!(result.status, ResultCode::Committed);
    assert_eq!(result.files, vec!["a"]);
    assert!(f.main.join("untracked").exists());
}
