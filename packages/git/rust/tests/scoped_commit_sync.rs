#![cfg(target_os = "linux")]
use fgos_git::*;
use fgos_holder_lock::{acquire, Acquire, BorrowedHandle, Handle, Mode, Resource, Wait};
use std::{
    fs,
    path::{Path, PathBuf},
    process::Command,
    sync::atomic::{AtomicU64, Ordering},
};
include!("support/signing.rs");
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
    let baseline = f.driver.preflight_commit(&f.repo, f.held(), None).unwrap();
    fs::write(f.tree.join("[literal]"), "selected").unwrap();
    fs::write(f.tree.join("outside"), "outside").unwrap();
    let request = CommitRequest {
        writes: vec!["[literal]".into()],
        message: "consumer message\n\nbody\n".into(),
        cutover_grant: None,
        legacy_events: None,
    };
    let result = f
        .driver
        .scoped_commit(&f.repo, f.held(), &baseline, &request, "fixture", "exact", &wal::OsFileSystem)
        .unwrap();
    assert_eq!(result.status, ResultCode::Committed);
    assert_eq!(result.files, vec!["[literal]"]);
    assert_eq!(
        f.driver
            .scoped_commit(&f.repo, f.held(), &baseline, &request, "fixture", "exact", &wal::OsFileSystem)
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
    let baseline = f.driver.preflight_commit(&f.repo, f.held(), None).unwrap();
    fs::write(f.tree.join("a"), "producer").unwrap();
    let request = CommitRequest {
        writes: vec!["a".into()],
        message: "commit".into(),
        cutover_grant: None,
        legacy_events: None,
    };
    let result = f
        .driver
        .scoped_commit(&f.repo, f.held(), &baseline, &request, "fixture", "hook", &wal::OsFileSystem)
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
fn a_sync_commit_hook_reads_the_operation_id_the_way_a_scoped_commit_hook_does() {
    use std::os::unix::fs::PermissionsExt;
    let f = Fixture::new();
    fs::write(f.main.join("incoming"), "target\n").unwrap();
    git(&f.main, &["add", "."]);
    git(&f.main, &["commit", "-qm", "target"]);
    let target = Oid::parse(&git(&f.main, &["rev-parse", "HEAD"]), ObjectFormat::Sha1).unwrap();
    let seen = f.temp.join("seen");
    let hooks = f.main.join("hooks");
    fs::create_dir(&hooks).unwrap();
    let hook = hooks.join("pre-commit");
    fs::write(&hook, format!("#!/bin/sh\ngit config --get fgos.operationId > '{}'\n", seen.display())).unwrap();
    fs::set_permissions(&hook, fs::Permissions::from_mode(0o755)).unwrap();
    git(&f.main, &["config", "core.hooksPath", "hooks"]);
    let done = f
        .driver
        .start_sync(&f.repo, f.held(), &target, "consumer sync", "fixture", "sync-hook")
        .unwrap();
    assert_eq!(done.state, "done");
    assert_eq!(fs::read_to_string(seen).unwrap().trim(), "sync-hook");
}
#[test]
fn sync_prepare_applies_declared_bytes_for_a_store_path_the_producer_deleted() {
    for finish in [true, false] {
        let f = Fixture::new();
        let shard = ".fgos/events/s.jsonl";
        fs::create_dir_all(f.main.join(".fgos/events")).unwrap();
        fs::write(f.main.join(shard), "1\n").unwrap();
        git(&f.main, &["add", shard]);
        git(&f.main, &["commit", "-qm", "shard"]);
        git(&f.tree, &["merge", "-q", "--ff-only", "trunk"]);
        git(&f.tree, &["rm", "-q", shard]);
        git(&f.tree, &["commit", "-qm", "producer strips the store"]);
        fs::write(f.main.join(shard), "1\n2\n").unwrap();
        git(&f.main, &["commit", "-qam", "target grows the shard"]);
        let head = git(&f.tree, &["rev-parse", "HEAD"]);
        let oid = Oid::parse(&git(&f.main, &["rev-parse", "HEAD"]), ObjectFormat::Sha1).unwrap();
        let files = vec![LandFile { path: shard.into(), bytes: Some(b"1\n2\n".to_vec()) }];
        let prepared = f
            .driver
            .prepare_sync(&f.repo, f.held(), &oid, "catch-up", &files, "fixture", "declared")
            .unwrap();
        assert_eq!(prepared.state, "prepared");
        assert!(prepared.resolver_grant.is_empty());
        assert!(prepared.staged.contains(&shard.to_string()));
        assert_eq!(git(&f.tree, &["show", &format!(":{shard}")]), "1\n2");
        let other = vec![LandFile { path: shard.into(), bytes: None }];
        assert_eq!(
            f.driver
                .prepare_sync(&f.repo, f.held(), &oid, "catch-up", &other, "fixture", "declared")
                .unwrap_err()
                .cause,
            "operation-id-reused"
        );
        if finish {
            let done = f.driver.continue_sync(&f.repo, f.held(), "fixture", "declared").unwrap();
            assert_eq!(done.state, "done");
            assert_eq!(git(&f.tree, &["show", &format!("HEAD:{shard}")]), "1\n2");
            assert_eq!(
                git(&f.tree, &["show", "-s", "--format=%P"]),
                format!("{head} {}", oid.as_str())
            );
        } else {
            let aborted = f.driver.abort_sync(&f.repo, f.held(), "fixture", "declared").unwrap();
            assert_eq!(aborted.state, "conflict-aborted");
            assert!(!f.tree.join(shard).exists());
            assert_eq!(git(&f.tree, &["rev-parse", "HEAD"]), head);
            assert_eq!(git(&f.tree, &["status", "--porcelain"]), "");
        }
    }
}
#[test]
fn sync_prepare_applies_declarations_to_skip_worktree_store_paths_in_the_index_only() {
    let f = Fixture::new();
    let (kept, gone) = (".fgos/events/kept.jsonl", ".fgos/events/gone.jsonl");
    fs::create_dir_all(f.main.join(".fgos/events")).unwrap();
    fs::write(f.main.join(kept), "1\n").unwrap();
    fs::write(f.main.join(gone), "1\n").unwrap();
    git(&f.main, &["add", kept, gone]);
    git(&f.main, &["commit", "-qm", "store"]);
    git(&f.tree, &["merge", "-q", "--ff-only", "trunk"]);
    // The shape Worktree creation leaves: tracked store paths absent on disk.
    git(&f.tree, &["update-index", "--skip-worktree", kept, gone]);
    fs::remove_dir_all(f.tree.join(".fgos")).unwrap();
    fs::write(f.tree.join("own"), "producer\n").unwrap();
    git(&f.tree, &["add", "own"]);
    git(&f.tree, &["commit", "-qm", "producer"]);
    fs::write(f.main.join(kept), "1\n2\n").unwrap();
    git(&f.main, &["rm", "-q", gone]);
    git(&f.main, &["commit", "-qam", "target store moves on"]);
    let oid = Oid::parse(&git(&f.main, &["rev-parse", "HEAD"]), ObjectFormat::Sha1).unwrap();
    let files = vec![
        LandFile { path: kept.into(), bytes: Some(b"1\n2\n".to_vec()) },
        LandFile { path: gone.into(), bytes: None },
    ];
    let prepared = f
        .driver
        .prepare_sync(&f.repo, f.held(), &oid, "catch-up", &files, "fixture", "sparse")
        .unwrap();
    assert_eq!(prepared.state, "prepared");
    assert!(!f.tree.join(kept).exists() && !f.tree.join(gone).exists());
    let done = f.driver.continue_sync(&f.repo, f.held(), "fixture", "sparse").unwrap();
    assert_eq!(done.state, "done");
    assert_eq!(git(&f.tree, &["show", &format!("HEAD:{kept}")]), "1\n2");
    assert_eq!(git(&f.tree, &["ls-tree", "--name-only", "HEAD", "--", gone]), "");
    assert!(git(&f.tree, &["ls-files", "-v", "--", kept]).starts_with("S "));
    assert!(!f.tree.join(kept).exists() && !f.tree.join(gone).exists());
    assert_eq!(git(&f.tree, &["status", "--porcelain"]), "");
}

#[test]
fn noop_is_durable_and_checkpoint_selects_only_non_event_tracked_files() {
    let f = Fixture::new();
    let baseline = f.driver.preflight_commit(&f.repo, f.held(), None).unwrap();
    let request = CommitRequest {
        writes: vec!["a".into()],
        message: "noop".into(),
        cutover_grant: None,
        legacy_events: None,
    };
    assert_eq!(
        f.driver
            .scoped_commit(&f.repo, f.held(), &baseline, &request, "fixture", "noop", &wal::OsFileSystem)
            .unwrap()
            .status,
        ResultCode::Unchanged
    );
    fs::write(f.tree.join("a"), "later bytes").unwrap();
    assert_eq!(
        f.driver
            .scoped_commit(&f.repo, f.held(), &baseline, &request, "fixture", "noop", &wal::OsFileSystem)
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
            CheckpointRequest {
                files: vec![".fgos/events.jsonl".into()],
                message: "refuse".into(),
                legacy_events: None
            },
            "fixture",
            "bad-checkpoint"
        )
        .is_err());
    let result = f
        .driver
        .checkpoint_tracked_files(
            &main,
            vec![],
            CheckpointRequest {
                files: vec!["a".into()],
                message: "consumer checkpoint".into(),
                legacy_events: None,
            },
            "fixture",
            "checkpoint",
        )
        .unwrap();
    assert_eq!(result.status, ResultCode::Committed);
    assert_eq!(result.files, vec!["a"]);
    assert!(f.main.join("untracked").exists());
}
#[test]
fn baseline_only_cutover_commits_the_event_fence() {
    use sha2::{Digest, Sha256};
    for tracked_fence in [false, true] {
        let f = Fixture::new();
        let deleted = vec![".fgos/events.jsonl".to_string(), ".fgos/state.json".into()];
        for p in &deleted {
            fs::write(f.main.join(p), "legacy\n").unwrap();
        }
        fs::write(f.main.join("seal.json"), "sealed\n").unwrap();
        let mut add = vec!["add", "--", "seal.json"];
        add.extend(deleted.iter().map(String::as_str));
        if tracked_fence {
            fs::write(f.main.join(".fgos/events"), "legacy fence\n").unwrap();
            add.push(".fgos/events");
        }
        git(&f.main, &add);
        git(&f.main, &["commit", "-qm", "legacy"]);
        let legacy = git(&f.main, &["rev-parse", "HEAD"]);
        git(&f.main, &["update-ref", "refs/fgos/legacy", &legacy]);
        let main = match f.driver.resolve_repo(&f.main, &f.main).unwrap() {
            ResolveRepo::Repository(r) => r,
            _ => panic!(),
        };
        let baseline = f.driver.preflight_commit(&main, vec![], None).unwrap();
        for p in &deleted {
            fs::remove_file(f.main.join(p)).unwrap();
        }
        assert_eq!(f.main.join(".fgos/events").exists(), tracked_fence);
        fs::write(f.main.join(".fgos/events"), "legacy fence\n").unwrap();
        let request = CommitRequest {
            writes: vec!["logs".into()],
            message: "cutover".into(),
            cutover_grant: Some(CutoverGrant {
                exact_paths: deleted.clone(),
                legacy_ref_oid: legacy,
                seal_digest: format!("{:x}", Sha256::digest(b"sealed\n")),
            }),
            legacy_events: None,
        };
        let result = f
            .driver
            .scoped_commit(&main, vec![], &baseline, &request, "fixture", "cutover", &wal::OsFileSystem)
            .unwrap();
        assert_eq!(result.status, ResultCode::Committed);
        assert_eq!(
            result.files,
            if tracked_fence {
                vec![".fgos/events.jsonl", ".fgos/state.json"]
            } else {
                vec![".fgos/events", ".fgos/events.jsonl", ".fgos/state.json"]
            }
        );
        assert_eq!(git(&f.main, &["show", "HEAD:.fgos/events"]), "legacy fence");
        assert_eq!(
            git(&f.main, &["ls-tree", "--name-only", "HEAD", ".fgos/"]),
            ".fgos/events"
        );
    }
}

/// Construct real durable interruption states under the fixture's held custody.
fn interrupted(f: &Fixture, id: &str, phase: u8, sync: bool) -> wal::Chain {
    interrupted_resources(f, id, phase, sync, false)
}
fn interrupted_resources(f: &Fixture, id: &str, phase: u8, sync: bool, legacy: bool) -> wal::Chain {
    use wal::*;
    struct Held<'a>(&'a Handle);
    impl PublicationAuthority for Held<'_> {
        fn validate_publication_borrow(&self, i: &Intent) -> WalResult<()> {
            fgos_holder_lock::validate(self.0)
                .map_err(|_| WalError::PublicationBorrowUnavailable)?;
            use std::os::unix::fs::MetadataExt;
            let m = fs::metadata(self.0.path())?;
            if i.authority_binding != format!("{}:{}", m.dev(), m.ino()) {
                return Err(WalError::PublicationBorrowUnavailable);
            }
            Ok(())
        }
    }
    let baseline = f.driver.preflight_commit(&f.repo, f.held(), None).unwrap();
    let request = CommitRequest {
        writes: vec!["a".into()],
        message: "interrupted".into(),
        cutover_grant: None,
        legacy_events: None,
    };
    fs::write(f.tree.join("a"), "interrupted producer").unwrap();
    git(&f.tree, &["add", "a"]);
    let tree = git(&f.tree, &["write-tree"]);
    let wal = Wal::open(&f.repo).unwrap();
    let kind = if sync {
        OperationKind::Sync(Box::new(SyncIntent {
            reference: Some(baseline.reference.clone()),
            worktree: baseline.worktree.clone(),
            head: baseline.head.clone(),
            target: baseline.head.clone(),
            message: "interrupted".into(),
            files: vec![],
        }))
    } else {
        OperationKind::ScopedCommit(Box::new(ScopedCommitIntent {
            worktree: baseline.worktree.clone(),
            baseline: serde_json::to_string(&baseline).unwrap(),
            request: serde_json::to_string(&request).unwrap(),
            paths: vec!["a".into()],
            tree,
            cutover_grant: None,
        }))
    };
    let intent = Intent {
        request_digest: if sync {
            canonical_digest(&(&kind, "fixture")).unwrap()
        } else {
            canonical_digest(&(&baseline, &request, "fixture")).unwrap()
        },
        kind,
        repo_identity: wal.repository_identity().into(),
        resource_set: vec![if legacy {
            format!("worktree:{}", baseline.worktree)
        } else {
            format!(
                "worktree:{}:custody:{}",
                baseline.worktree,
                f.lease.as_ref().unwrap().path().display()
            )
        }],
        authority_binding: baseline.authority,
        writer_identity: "fixture".into(),
        object_format: f.repo.object_format(),
        expected: Tip::Oid(baseline.head.clone()),
        next: Tip::Oid(baseline.head),
    };
    let Begin::Created(mut chain) = wal
        .begin(id, intent, &Held(f.lease.as_ref().unwrap()))
        .unwrap()
    else {
        panic!()
    };
    if phase >= 1 {
        chain = wal.append(&chain, Phase::Prepared).unwrap();
    }
    if phase >= 2 {
        chain = wal
            .append(
                &chain,
                Phase::TargetAttempt {
                    prior_target_attempt: None,
                    expected: chain.intent().expected.clone(),
                    next: chain.intent().next.clone(),
                },
            )
            .unwrap();
    }
    if sync {
        git(&f.tree, &["reset", "-q", "HEAD"]);
    }
    chain
}
fn fresh_commit(f: &Fixture, id: &str) {
    let baseline = f.driver.preflight_commit(&f.repo, f.held(), None).unwrap();
    fs::write(f.tree.join("fresh"), id).unwrap();
    let request = CommitRequest {
        writes: vec!["fresh".into()],
        message: "fresh".into(),
        cutover_grant: None,
        legacy_events: None,
    };
    assert_eq!(
        f.driver
            .scoped_commit(&f.repo, f.held(), &baseline, &request, "fixture", id, &wal::OsFileSystem)
            .unwrap()
            .status,
        ResultCode::Committed
    );
}
#[test]
fn admission_abandons_pre_attempt_commit_and_sync_without_blocking_fresh_ids() {
    for sync in [false, true] {
        for phase in [0, 1] {
            let f = Fixture::new();
            interrupted(&f, "interrupted", phase, sync);
            // Admission runs before the foreign-index check and unstages only the
            // exact paths of a pre-attempt scoped commit, preserving producer bytes.
            let baseline = CommitBaseline {
                head: git(&f.tree, &["rev-parse", "HEAD"]),
                reference: "refs/heads/producer".into(),
                worktree: f.tree.to_string_lossy().into(),
                authority: {
                    use std::os::unix::fs::MetadataExt;
                    let m = fs::metadata(f.lease.as_ref().unwrap().path()).unwrap();
                    format!("{}:{}", m.dev(), m.ino())
                },
                dirty: vec![],
            };
            fs::write(f.tree.join("fresh"), "fresh").unwrap();
            let request = CommitRequest {
                writes: vec!["fresh".into()],
                message: "fresh".into(),
                cutover_grant: None,
                legacy_events: None,
            };
            assert_eq!(
                f.driver
                    .scoped_commit(&f.repo, f.held(), &baseline, &request, "fixture", "fresh", &wal::OsFileSystem)
                    .unwrap()
                    .status,
                ResultCode::Committed
            );
            assert_eq!(
                wal::Wal::open(&f.repo)
                    .unwrap()
                    .compacted("interrupted")
                    .unwrap()
                    .unwrap()
                    .outcome()
                    .unwrap(),
                wal::Outcome::AbandonedBeforeAttempt
            );
            assert_eq!(
                fs::read_to_string(f.tree.join("a")).unwrap(),
                "interrupted producer"
            );
        }
    }
}
#[test]
fn explicit_recovery_observes_signed_commit_or_closes_unknown_without_replaying() {
    for committed in [false, true] {
        let f = Fixture::new();
        enable_signing(&f.tree, &f.temp);
        interrupted(&f, "interrupted", 2, false);
        if committed {
            git(&f.tree, &["commit", "-qm", "interrupted"]);
        }
        let head = git(&f.tree, &["rev-parse", "HEAD"]);
        let outcome = f
            .driver
            .recover_scoped_commit(&f.repo, f.held(), "fixture", "interrupted", &wal::OsFileSystem)
            .unwrap();
        assert!(if committed {
            matches!(outcome, wal::Outcome::Commit { .. })
        } else {
            matches!(outcome, wal::Outcome::CommitRejected { .. })
        });
        assert_eq!(head, git(&f.tree, &["rev-parse", "HEAD"]));
        fresh_commit(&f, "fresh");
    }
}
#[test]
fn recovery_preserves_attempt_while_native_index_lock_exists() {
    let f = Fixture::new();
    interrupted(&f, "interrupted", 2, false);
    let gitdir = git(&f.tree, &["rev-parse", "--absolute-git-dir"]);
    fs::write(Path::new(&gitdir).join("index.lock"), "native residue").unwrap();
    let error = f.driver
        .recover_scoped_commit(&f.repo, f.held(), "fixture", "interrupted", &wal::OsFileSystem)
        .unwrap_err();
    assert!(error.cause.starts_with("native-index-lock-unowned:"));
    assert!(error.cause.contains("repairNativeIndexLock"));
    assert!(error.cause.contains("§11"));
    assert!(wal::Wal::open(&f.repo)
        .unwrap()
        .inspect("interrupted")
        .unwrap()
        .outcome()
        .is_none());
    fs::remove_file(Path::new(&gitdir).join("index.lock")).unwrap();
    git(&f.tree, &["reset", "-q", "HEAD"]);
    f.driver
        .recover_scoped_commit(&f.repo, f.held(), "fixture", "interrupted", &wal::OsFileSystem)
        .unwrap();
    fresh_commit(&f, "fresh");
}
#[test]
fn terminal_commit_history_is_bounded_and_compacted_receipts_replay() {
    let f = Fixture::new();
    let mut first = None;
    for n in 0..9 {
        let baseline = f.driver.preflight_commit(&f.repo, f.held(), None).unwrap();
        fs::write(f.tree.join("a"), format!("version {n}")).unwrap();
        let request = CommitRequest {
            writes: vec!["a".into()],
            message: "bounded".into(),
            cutover_grant: None,
            legacy_events: None,
        };
        let id = format!("bounded-{n}");
        let result = f
            .driver
            .scoped_commit(&f.repo, f.held(), &baseline, &request, "fixture", &id, &wal::OsFileSystem)
            .unwrap();
        if n == 0 {
            first = Some((baseline, request, result.oid));
        }
    }
    let wal = wal::Wal::open(&f.repo).unwrap();
    assert!(wal.retained(100).unwrap().is_empty());
    assert!(wal.compacted("bounded-0").unwrap().is_some());
    let (baseline, request, oid) = first.unwrap();
    assert_eq!(
        f.driver
            .scoped_commit(
                &f.repo,
                f.held(),
                &baseline,
                &request,
                "fixture",
                "bounded-0", &wal::OsFileSystem
            )
            .unwrap()
            .oid,
        oid
    );
}

#[test]
fn sync_inspection_closes_interruption_before_merge_and_allows_fresh_commit() {
    for phase in [0, 1, 2] {
        let f = Fixture::new();
        interrupted(&f, "interrupted", phase, true);
        assert_eq!(
            f.driver
                .inspect_sync(&f.repo, f.held(), "fixture", "interrupted")
                .unwrap()
                .state,
            if phase == 2 {
                "merge-effect-unknown"
            } else {
                "not-started"
            }
        );
        fresh_commit(&f, "fresh");
        assert!(wal::Wal::open(&f.repo)
            .unwrap()
            .active(100)
            .unwrap()
            .is_empty());
    }
}

#[test]
fn recovery_observes_hook_modified_overtaken_and_aba_commits() {
    for (modified, moved) in [(true, 0), (true, 1), (false, 1), (false, 2)] {
        let f = Fixture::new();
        let chain = interrupted(&f, "observe", 2, false);
        let wal::OperationKind::ScopedCommit(payload) = &chain.intent().kind else {
            panic!()
        };
        let baseline: CommitBaseline = serde_json::from_str(&payload.baseline).unwrap();
        if modified {
            fs::write(f.tree.join("a"), "hook formatter bytes").unwrap();
            git(&f.tree, &["add", "a"]);
        }
        git(&f.tree, &["commit", "-qm", "interrupted"]);
        let landed = git(&f.tree, &["rev-parse", "HEAD"]);
        if moved == 1 {
            fs::write(f.tree.join("later"), "later").unwrap();
            git(&f.tree, &["add", "later"]);
            git(&f.tree, &["commit", "-qm", "later"]);
        } else if moved == 2 {
            git(&f.tree, &["reset", "--hard", &baseline.head]);
        }
        let result = f
            .driver
            .recover_scoped_commit(&f.repo, f.held(), "fixture", "observe", &wal::OsFileSystem);
        if moved == 2 {
            let err = result.unwrap_err();
            assert_eq!(err.code, ResultCode::RecoveryRequired);
            assert!(format!("{err:?}").contains(&landed));
            assert!(wal::Wal::open(&f.repo)
                .unwrap()
                .inspect("observe")
                .unwrap()
                .outcome()
                .is_none());
            continue;
        }
        let result = result.unwrap();
        assert!(
            matches!(result, wal::Outcome::Commit { observed, contract_violation } if observed == landed && contract_violation == modified)
        );
    }
}

#[test]
fn unknown_replay_keeps_cause_and_recovery_preserves_foreign_staging() {
    let f = Fixture::new();
    let chain = interrupted(&f, "unknown", 2, false);
    let wal::OperationKind::ScopedCommit(payload) = &chain.intent().kind else {
        panic!()
    };
    let baseline: CommitBaseline = serde_json::from_str(&payload.baseline).unwrap();
    let request: CommitRequest = serde_json::from_str(&payload.request).unwrap();
    fs::write(f.tree.join("human"), "keep staged").unwrap();
    git(&f.tree, &["add", "human"]);
    let outcome = f
        .driver
        .recover_scoped_commit(&f.repo, f.held(), "fixture", "unknown", &wal::OsFileSystem)
        .unwrap();
    assert!(
        matches!(outcome, wal::Outcome::CommitRejected { cause } if cause == "commit-effect-unknown")
    );
    assert_eq!(git(&f.tree, &["diff", "--cached", "--name-only"]), "human");
    let error = f
        .driver
        .scoped_commit(&f.repo, f.held(), &baseline, &request, "fixture", "unknown", &wal::OsFileSystem)
        .unwrap_err();
    assert!(format!("{error:?}").contains("commit-effect-unknown"));
    assert_eq!(error.code, ResultCode::RecoveryRequired);
}

#[test]
fn pre_attempt_recovery_does_not_unstage_a_changed_index() {
    let f = Fixture::new();
    interrupted(&f, "prepared", 1, false);
    fs::write(f.tree.join("human"), "keep staged").unwrap();
    git(&f.tree, &["add", "human"]);
    f.driver
        .recover_scoped_commit(&f.repo, f.held(), "fixture", "prepared", &wal::OsFileSystem)
        .unwrap();
    assert_eq!(
        git(&f.tree, &["diff", "--cached", "--name-only"]),
        "a\nhuman"
    );
}

#[test]
fn legacy_chains_from_a_dead_checkout_are_abandoned_without_replay() {
    use std::os::unix::fs::MetadataExt;
    for (phase, residue) in [(0, false), (2, false), (0, true), (2, true)] {
        let mut f = Fixture::new();
        interrupted_resources(&f, "dead", phase, false, true);
        drop(f.lease.take());
        git(
            &f.main,
            &["worktree", "remove", "--force", f.tree.to_str().unwrap()],
        );
        git(
            &f.main,
            &["worktree", "add", f.tree.to_str().unwrap(), "producer"],
        );
        let m = fs::metadata(&f.tree).unwrap();
        let birth = m
            .created()
            .unwrap()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let path = f.main.join(format!(
            ".fgos/locks/dispatch-cwd--{}-{}-{birth}.lock",
            m.dev(),
            m.ino()
        ));
        f.lease = Some(
            match acquire(
                &Resource::new("dispatch-cwd", path),
                Mode::Ex,
                Wait::Ms(100),
                5000,
            ) {
                Acquire::Acquired(h) => h,
                other => panic!("{other:?}"),
            },
        );
        let residue_path = f
            .repo
            .common_dir()
            .join("fgos/git/operations/dead/.durable-file-stray.tmp");
        if residue {
            fs::write(&residue_path, "interrupted append").unwrap();
        }
        let baseline = f.driver.preflight_commit(&f.repo, f.held(), None).unwrap();
        fs::write(f.tree.join("fresh"), "new checkout").unwrap();
        let receipt = f
            .driver
            .scoped_commit(
                &f.repo,
                f.held(),
                &baseline,
                &CommitRequest {
                    writes: vec!["fresh".into()],
                    message: "fresh".into(),
                    cutover_grant: None,
                    legacy_events: None,
                },
                "fixture",
                "new-checkout",
                &wal::OsFileSystem,
            )
            .unwrap();
        assert_eq!(receipt.status, ResultCode::Committed);
        assert_eq!(
            receipt
                .warnings
                .iter()
                .any(|w| w.starts_with("checkout-compaction-deferred:")),
            residue
        );
        if residue {
            assert!(residue_path.exists());
            fs::remove_file(&residue_path).unwrap();
            fresh_commit(&f, "retry-cleanup");
        }
        let old = wal::Wal::open(&f.repo)
            .unwrap()
            .compacted("dead")
            .unwrap()
            .unwrap();
        assert!(
            matches!(old.outcome().unwrap(), wal::Outcome::CommitRejected { cause } if cause == if phase == 0 { "foreign-checkout-abandoned" } else { "foreign-checkout-effect-unknown" })
        );
        assert!(f
            .driver
            .recover_scoped_commit(&f.repo, f.held(), "fixture", "dead", &wal::OsFileSystem)
            .is_err());
    }
}

#[test]
fn sync_recovery_observes_modified_overtaken_and_reset_merge_commits() {
    for moved in [0, 1, 2, 3] {
        let f = Fixture::new();
        let baseline = git(&f.tree, &["rev-parse", "HEAD"]);
        fs::write(f.main.join("incoming"), "target").unwrap();
        git(&f.main, &["add", "incoming"]);
        git(&f.main, &["commit", "-qm", "target"]);
        fs::write(f.tree.join("a"), "producer").unwrap();
        git(&f.tree, &["commit", "-qam", "producer"]);
        // Force a resolver barrier, then perform the already-recorded commit
        // manually as a crashed process would, without installing its outcome.
        fs::write(f.main.join("a"), "target a").unwrap();
        git(&f.main, &["commit", "-qam", "conflict target"]);
        let target = Oid::parse(
            &git(&f.main, &["rev-parse", "HEAD"]),
            f.repo.object_format(),
        )
        .unwrap();
        assert_ne!(target.as_str(), baseline);
        assert_ne!(target.as_str(), git(&f.tree, &["rev-parse", "HEAD"]));
        let result = f
            .driver
            .start_sync(
                &f.repo,
                f.held(),
                &target,
                "recover merge",
                "fixture",
                "merge-observe",
            )
            .unwrap();
        assert_eq!(result.state, "conflicted-open");
        fs::write(f.tree.join("a"), "resolved").unwrap();
        git(&f.tree, &["add", "a"]);
        let wal = wal::Wal::open(&f.repo).unwrap();
        let chain = wal.inspect("merge-observe").unwrap();
        let chain = wal
            .append(
                &chain,
                wal::Phase::SyncCommitAttempt {
                    tree: git(&f.tree, &["write-tree"]),
                },
            )
            .unwrap();
        let wal::OperationKind::Sync(payload) = &chain.intent().kind else {
            panic!()
        };
        fs::write(f.tree.join("a"), "formatter changed resolution").unwrap();
        git(&f.tree, &["add", "a"]);
        git(&f.tree, &["commit", "-qm", "recover merge"]);
        let observed = git(&f.tree, &["rev-parse", "HEAD"]);
        if moved == 1 {
            fs::write(f.tree.join("later"), "later").unwrap();
            git(&f.tree, &["add", "later"]);
            git(&f.tree, &["commit", "-qm", "later"]);
        }
        if moved == 2 {
            git(&f.tree, &["reset", "--hard", &payload.head]);
        }
        if moved == 3 {
            git(&f.tree, &["checkout", "-qb", "switched"]);
        }
        let receipt = f
            .driver
            .inspect_sync(&f.repo, f.held(), "fixture", "merge-observe");
        if moved == 3 {
            let err = receipt.unwrap_err();
            assert_eq!(err.code, ResultCode::RecoveryRequired);
            assert!(format!("{err:?}").contains("checkout-reference-changed"));
            assert!(wal.inspect("merge-observe").unwrap().outcome().is_none());
            continue;
        }
        if moved == 2 {
            let err = receipt.unwrap_err();
            assert_eq!(err.code, ResultCode::RecoveryRequired);
            assert!(format!("{err:?}").contains(&observed));
            assert!(wal.inspect("merge-observe").unwrap().outcome().is_none());
            continue;
        }
        let receipt = receipt.unwrap();
        assert_eq!(receipt.state, "done");
        let commit = receipt.commit.unwrap();
        assert_eq!(commit.status, ResultCode::CommittedButContractViolation);
        assert_eq!(commit.oid.unwrap().as_str(), observed);
    }
}

#[test]
fn checkout_attempts_exclude_remove_and_move() {
    for sync in [false, true] {
        for remove in [false, true] {
            let mut f = Fixture::new();
            interrupted(&f, "pending", 2, sync);
            // The effect landed but its outcome did not. The checkout is clean.
            git(&f.tree, &["add", "a"]);
            git(&f.tree, &["commit", "-qm", "interrupted"]);
            let tip = Oid::parse(
                &git(&f.tree, &["rev-parse", "HEAD"]),
                f.repo.object_format(),
            )
            .unwrap();
            drop(f.lease.take());
            let result = if remove {
                f.driver.remove_worktree(
                    &f.repo,
                    vec![],
                    &f.tree,
                    &WorktreeDelivery {
                        expected_tip: tip.clone(),
                        delivered_to: tip.clone(),
                        evidence_digest: "a".repeat(64),
                    },
                    "fixture",
                    "lifecycle",
                )
            } else {
                f.driver
                    .relocate_worktree(
                        &f.repo,
                        vec![],
                        &f.tree,
                        &f.temp.join("moved"),
                        &tip,
                        "fixture",
                        "lifecycle",
                    )
                    .map(|_| ())
            };
            let err = result.unwrap_err();
            assert_eq!(err.code, ResultCode::RecoveryRequired, "{err:?}");
            assert!(format!("{err:?}").contains("resource-recovery-required"));
            assert!(f.tree.exists());
            assert!(wal::Wal::open(&f.repo)
                .unwrap()
                .inspect("lifecycle")
                .is_err());
        }
    }
}

#[test]
fn lifecycle_attempts_exclude_commit_and_sync() {
    struct Held;
    impl wal::PublicationAuthority for Held {
        fn validate_publication_borrow(&self, _: &wal::Intent) -> wal::WalResult<()> {
            Ok(())
        }
    }
    for action in ["create", "remove", "move"] {
        let f = Fixture::new();
        let baseline = f.driver.preflight_commit(&f.repo, f.held(), None).unwrap();
        let path = f.tree.to_str().unwrap();
        let kind = match action {
            "create" => wal::OperationKind::WorktreeCreate {
                path: path.into(),
                registration: "producer".into(),
                branch: None,
                session_id: None,
            },
            "remove" => wal::OperationKind::WorktreeRemove {
                path: path.into(),
                registration: "producer".into(),
                registration_identity: "original".into(),
                delivery: Box::new(wal::WorktreeDeliveryBinding {
                    delivered_to: baseline.head.clone(),
                    evidence_digest: "a".repeat(64),
                }),
            },
            _ => wal::OperationKind::WorktreeMove {
                source: path.into(),
                destination: f.temp.join("moved").to_str().unwrap().into(),
                registration: "producer".into(),
                registration_identity: "original".into(),
            },
        };
        let mut resources = vec![format!("worktree:{path}")];
        if action == "move" {
            resources.push(format!("worktree:{}", f.temp.join("moved").display()));
        }
        resources.sort();
        let wal = wal::Wal::open(&f.repo).unwrap();
        let wal::Begin::Created(chain) = wal
            .begin(
                "lifecycle",
                wal::Intent {
                    kind,
                    request_digest: "a".repeat(64),
                    repo_identity: wal.repository_identity().into(),
                    resource_set: resources,
                    authority_binding: "admin".into(),
                    writer_identity: "fixture".into(),
                    object_format: f.repo.object_format(),
                    expected: if action == "create" {
                        wal::Tip::Absent
                    } else {
                        wal::Tip::Oid(baseline.head.clone())
                    },
                    next: if action == "remove" {
                        wal::Tip::Absent
                    } else {
                        wal::Tip::Oid(baseline.head.clone())
                    },
                },
                &Held,
            )
            .unwrap()
        else {
            panic!()
        };
        let chain = wal.append(&chain, wal::Phase::Prepared).unwrap();
        wal.append(
            &chain,
            wal::Phase::TargetAttempt {
                prior_target_attempt: None,
                expected: chain.intent().expected.clone(),
                next: chain.intent().next.clone(),
            },
        )
        .unwrap();
        fs::write(f.tree.join("a"), "producer edit").unwrap();
        let err = f
            .driver
            .scoped_commit(
                &f.repo,
                f.held(),
                &baseline,
                &CommitRequest {
                    writes: vec!["a".into()],
                    message: "new".into(),
                    cutover_grant: None,
                    legacy_events: None,
                },
                "fixture",
                "new",
                &wal::OsFileSystem,
            )
            .unwrap_err();
        assert_eq!(err.code, ResultCode::RecoveryRequired, "{err:?}");
        fs::write(f.main.join("incoming"), "target").unwrap();
        git(&f.main, &["add", "incoming"]);
        git(&f.main, &["commit", "-qm", "target"]);
        let target = Oid::parse(
            &git(&f.main, &["rev-parse", "HEAD"]),
            f.repo.object_format(),
        )
        .unwrap();
        let err = f
            .driver
            .start_sync(&f.repo, f.held(), &target, "sync", "fixture", "new-sync")
            .unwrap_err();
        assert_eq!(err.code, ResultCode::RecoveryRequired, "{err:?}");
        assert!(wal.inspect("lifecycle").unwrap().outcome().is_none());
    }
}

#[test]
fn preexisting_reset_away_commit_is_evidence_not_a_receipt() {
    let f = Fixture::new();
    let baseline = git(&f.tree, &["rev-parse", "HEAD"]);
    fs::write(f.tree.join("a"), "interrupted producer").unwrap();
    git(&f.tree, &["add", "a"]);
    git(&f.tree, &["commit", "-qm", "interrupted"]);
    let old = git(&f.tree, &["rev-parse", "HEAD"]);
    git(&f.tree, &["reset", "--hard", &baseline]);
    interrupted(&f, "never-ran", 2, false);
    let err = f
        .driver
        .recover_scoped_commit(&f.repo, f.held(), "fixture", "never-ran", &wal::OsFileSystem)
        .unwrap_err();
    assert_eq!(err.code, ResultCode::RecoveryRequired);
    assert!(format!("{err:?}").contains(&old));
    assert_eq!(git(&f.tree, &["rev-parse", "HEAD"]), baseline);
    assert_eq!(git(&f.tree, &["diff", "--cached", "--name-only"]), "a");
    assert!(wal::Wal::open(&f.repo)
        .unwrap()
        .inspect("never-ran")
        .unwrap()
        .outcome()
        .is_none());
}

#[test]
fn sync_terminal_replay_ignores_live_branch_and_detached_head() {
    for retained in [false, true] {
        let f = Fixture::new();
        fs::write(f.main.join("a"), "incoming").unwrap();
        git(&f.main, &["add", "a"]);
        git(&f.main, &["commit", "-qm", "target"]);
        fs::write(f.tree.join("a"), "producer").unwrap();
        git(&f.tree, &["add", "a"]);
        git(&f.tree, &["commit", "-qm", "producer"]);
        let target = Oid::parse(&git(&f.main, &["rev-parse", "HEAD"]), ObjectFormat::Sha1).unwrap();
        assert_eq!(
            f.driver
                .start_sync(&f.repo, f.held(), &target, "sync", "fixture", "replay")
                .unwrap()
                .state,
            "conflicted-open"
        );
        if retained {
            fs::write(
                f.repo
                    .common_dir()
                    .join("fgos/git/operations/replay/.durable-file-stray.tmp"),
                "evidence",
            )
            .unwrap();
        }
        assert_eq!(
            f.driver
                .abort_sync(&f.repo, f.held(), "fixture", "replay")
                .unwrap()
                .state,
            "conflict-aborted"
        );
        git(&f.tree, &["switch", "-c", "other"]);
        for detached in [false, true] {
            if detached {
                git(&f.tree, &["checkout", "--detach"]);
            }
            assert_eq!(
                f.driver
                    .start_sync(&f.repo, f.held(), &target, "sync", "fixture", "replay")
                    .unwrap()
                    .state,
                "conflict-aborted"
            );
            if detached {
                assert_eq!(
                    f.driver
                        .start_sync(
                            &f.repo,
                            f.held(),
                            &target,
                            "sync",
                            "fixture",
                            "new-detached"
                        )
                        .unwrap_err()
                        .cause,
                    "sync-detached-head-refused"
                );
            }
        }
        if !retained {
            // A receipt written before Sync recorded references hashes None.
            let wal = wal::Wal::open(&f.repo).unwrap();
            let mut old = wal.compacted("replay").unwrap().unwrap();
            assert_eq!(old.reference.as_deref(), Some("refs/heads/producer"));
            let kind = wal::OperationKind::Sync(Box::new(wal::SyncIntent {
                reference: None,
                worktree: f.tree.to_string_lossy().into_owned(),
                head: old.expected.clone(),
                target: target.as_str().into(),
                message: "sync".into(),
                files: vec![],
            }));
            old.v = 2;
            old.reference = None;
            old.request = wal::canonical_digest(&(&kind, "fixture")).unwrap();
            old.digest = wal::canonical_digest(&(
                old.v,
                &old.id,
                &old.request,
                &old.binding,
                &old.receipt,
                &old.expected,
                &old.next,
            ))
            .unwrap();
            fs::write(
                f.repo.common_dir().join("fgos/git/compacted/replay"),
                serde_json::to_vec(&old).unwrap(),
            )
            .unwrap();
            assert_eq!(
                f.driver
                    .start_sync(&f.repo, f.held(), &target, "sync", "fixture", "replay")
                    .unwrap()
                    .state,
                "conflict-aborted"
            );
            assert_eq!(
                f.driver
                    .start_sync(&f.repo, f.held(), &target, "different", "fixture", "replay")
                    .unwrap_err()
                    .cause,
                "operation-id-reused"
            );
        }
    }
}

#[test]
fn sync_native_index_lock_refusal_names_inspection_and_preserves_bytes() {
    let f = Fixture::new();
    interrupted(&f, "interrupted", 2, true);
    let gitdir = git(&f.tree, &["rev-parse", "--absolute-git-dir"]);
    let path = Path::new(&gitdir).join("index.lock");
    fs::write(&path, b"external sync lock").unwrap();
    let error = f.driver.inspect_sync(&f.repo, f.held(), "fixture", "interrupted").unwrap_err();
    assert!(error.cause.starts_with("native-index-lock-unowned:"));
    assert!(error.cause.contains("repairNativeIndexLock"));
    assert!(error.cause.contains("§11"));
    assert_eq!(fs::read(&path).unwrap(), b"external sync lock");
    assert!(wal::Wal::open(&f.repo).unwrap().inspect("interrupted").unwrap().outcome().is_none());
}

#[test]
fn scoped_commit_ignores_signature_and_display_config() {
    let f = Fixture::new();
    enable_signing(&f.tree, &f.temp);
    fresh_commit(&f, "signed");
    assert!(git(&f.tree, &["cat-file", "-p", "HEAD"]).contains("gpgsig -----BEGIN SSH SIGNATURE-----"));
    assert!(git(&f.tree, &["show", "-s", "--format=%H"]).contains("Good "));
}

#[test]
fn sync_observed_rejection_retry_recovers_each_pre_commit_interruption() {
    use std::os::unix::fs::PermissionsExt;
    use wal::*;
    struct Held<'a>(&'a Handle);
    impl PublicationAuthority for Held<'_> {
        fn validate_publication_borrow(&self, _: &Intent) -> WalResult<()> {
            fgos_holder_lock::validate(self.0).map_err(|_| WalError::PublicationBorrowUnavailable)
        }
    }
    for phase in 0..4 {
        let f = Fixture::new();
        fs::write(f.main.join("a"), "target\n").unwrap();
        git(&f.main, &["commit", "-qam", "target"]);
        let target = Oid::parse(
            &git(&f.main, &["rev-parse", "HEAD"]),
            f.repo.object_format(),
        )
        .unwrap();
        fs::write(f.tree.join("a"), "source\n").unwrap();
        git(&f.tree, &["commit", "-qam", "source"]);
        f.driver
            .start_sync(&f.repo, f.held(), &target, "sync", "fixture", "prior")
            .unwrap();
        fs::write(f.tree.join("a"), "resolved\n").unwrap();
        let hooks = f.main.join("hooks");
        fs::create_dir(&hooks).unwrap();
        let hook = hooks.join("pre-commit");
        fs::write(&hook, "#!/bin/sh\necho original >&2\nexit 1\n").unwrap();
        fs::set_permissions(&hook, fs::Permissions::from_mode(0o755)).unwrap();
        git(
            &f.main,
            &["config", "core.hooksPath", hooks.to_str().unwrap()],
        );
        let refusal = f
            .driver
            .continue_sync(&f.repo, f.held(), "fixture", "prior")
            .unwrap_err();
        assert_eq!(refusal.cause, "commit-rejected");
        assert_eq!(refusal.stderr, b"original\n");
        let wal = Wal::open(&f.repo).unwrap();
        let prior = wal.inspect("prior").unwrap();
        let mut next = match wal
            .begin(
                "next",
                prior.intent().clone(),
                &Held(f.lease.as_ref().unwrap()),
            )
            .unwrap()
        {
            Begin::Created(c) => c,
            _ => panic!(),
        };
        if phase >= 1 {
            git(
                &f.main,
                &[
                    "update-ref",
                    "refs/fgos/git-operations/next/candidate",
                    target.as_str(),
                ],
            );
        }
        if phase >= 2 {
            next = wal.append(&next, Phase::Prepared).unwrap();
        }
        if phase >= 3 {
            wal.append(
                &next,
                Phase::TargetAttempt {
                    prior_target_attempt: None,
                    expected: next.intent().expected.clone(),
                    next: next.intent().next.clone(),
                },
            )
            .unwrap();
        }
        fs::write(&hook, "#!/bin/sh\nexit 0\n").unwrap();
        let result = f
            .driver
            .retry_sync_commit(&f.repo, f.held(), "fixture", "prior", "next")
            .unwrap();
        assert_eq!(result.state, "done");
        assert_eq!(git(&f.tree, &["show", "HEAD:a"]), "resolved");
        let again = f
            .driver
            .retry_sync_commit(&f.repo, f.held(), "fixture", "prior", "next")
            .unwrap();
        assert_eq!(again.commit.unwrap().oid, result.commit.unwrap().oid);
        assert!(
            matches!(wal.inspect("prior").unwrap().outcome(),Some(Outcome::CommitRejected {cause}) if cause == "commit-rejected")
        );
    }
}

#[test]
fn unknown_commit_recovery_is_an_error_but_pending_intent_can_be_abandoned() {
    let f = Fixture::new();
    let head = git(&f.tree, &["rev-parse", "HEAD"]);
    let error = f.driver.recover_scoped_commit(&f.repo, f.held(), "fixture", "missing", &wal::OsFileSystem).unwrap_err();
    assert_eq!(error.cause, "unknown-scoped-commit-operation");
    interrupted(&f, "pending", 0, false);
    let outcome = f.driver.recover_scoped_commit(&f.repo, f.held(), "fixture", "pending", &wal::OsFileSystem).unwrap();
    assert_eq!(outcome, wal::Outcome::AbandonedBeforeAttempt);
    assert_eq!(git(&f.tree, &["rev-parse", "HEAD"]), head);
    assert_eq!(wal::Wal::open(&f.repo).unwrap().compacted("pending").unwrap().unwrap().outcome().unwrap(), wal::Outcome::AbandonedBeforeAttempt);
    assert!(wal::Wal::open(&f.repo).unwrap().inspect("missing").is_err());
}

/// Counts the durability steps of a scoped commit and checks, at each one, the
/// order it must hold: `staged-object-durable` runs while the branch still names
/// the baseline, `object-durable` after the branch moved and before any receipt.
/// Optionally refuses the n-th (1-based) step of either kind.
struct ObjectSteps {
    common: PathBuf,
    tree: PathBuf,
    base: String,
    id: &'static str,
    staged: AtomicU64,
    seen: AtomicU64,
    refuse_staged_at: Option<u64>,
    refuse_at: Option<u64>,
}
impl ObjectSteps {
    fn new(f: &Fixture, id: &'static str, refuse_at: Option<u64>) -> Self {
        Self {
            common: f.repo.common_dir().to_path_buf(),
            tree: f.tree.clone(),
            base: git(&f.tree, &["rev-parse", "HEAD"]),
            id,
            staged: AtomicU64::new(0),
            seen: AtomicU64::new(0),
            refuse_staged_at: None,
            refuse_at,
        }
    }
    /// The branch tip the operation started from, when it is not the current one.
    fn based_on(mut self, base: &str) -> Self {
        self.base = base.to_owned();
        self
    }
    fn refusing_staged_at(mut self, n: u64) -> Self {
        self.refuse_staged_at = Some(n);
        self
    }
    fn seen(&self) -> u64 {
        self.seen.load(Ordering::SeqCst)
    }
    fn staged(&self) -> u64 {
        self.staged.load(Ordering::SeqCst)
    }
}
impl wal::FileSystem for ObjectSteps {
    fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
        let head = git(&self.tree, &["rev-parse", "HEAD"]);
        let (counter, refuse) = match step {
            "staged-object-durable" => {
                assert_eq!(head, self.base, "branch moved before the staged objects were durable");
                (&self.staged, self.refuse_staged_at)
            }
            "object-durable" => {
                assert_ne!(head, self.base, "commit objects synced before the branch moved");
                let wal = wal::Wal::open_existing(&self.common, wal::OsFileSystem).unwrap();
                assert!(wal.inspect(self.id).unwrap().outcome().is_none(), "receipt installed before the objects were durable");
                (&self.seen, self.refuse_at)
            }
            _ => return Ok(()),
        };
        let n = counter.fetch_add(1, Ordering::SeqCst) + 1;
        if refuse == Some(n) {
            return Err(std::io::Error::other(format!("injected {step} fault")));
        }
        Ok(())
    }
}
fn nested_request() -> CommitRequest {
    CommitRequest {
        writes: vec!["deep/er/file".into()],
        message: "nested\n".into(),
        cutover_grant: None,
        legacy_events: None,
    }
}
fn objects_of_commit(f: &Fixture, base: &str) -> u64 {
    git(&f.tree, &["rev-list", "--objects", "HEAD", &format!("^{base}")]).lines().count() as u64
}
/// A nested file is written and committed with the commit's receipt refused at
/// its first object: the commit is on the branch, the chain has no outcome.
fn unacknowledged_nested_commit(f: &Fixture, id: &'static str) -> String {
    let baseline = f.driver.preflight_commit(&f.repo, f.held(), None).unwrap();
    fs::create_dir_all(f.tree.join("deep/er")).unwrap();
    fs::write(f.tree.join("deep/er/file"), "new blob").unwrap();
    let refusing = ObjectSteps::new(f, id, Some(1));
    assert!(f
        .driver
        .scoped_commit(&f.repo, f.held(), &baseline, &nested_request(), "fixture", id, &refusing)
        .is_err());
    assert_eq!(objects_of_commit(f, &baseline.head), 5);
    baseline.head
}
fn loose_object(f: &Fixture, oid: &str) -> PathBuf {
    f.repo.common_dir().join("objects").join(&oid[..2]).join(&oid[2..])
}

#[test]
fn scoped_commit_makes_staged_objects_durable_before_the_branch_moves_and_the_commit_before_the_receipt() {
    let f = Fixture::new();
    let baseline = f.driver.preflight_commit(&f.repo, f.held(), None).unwrap();
    fs::create_dir_all(f.tree.join("deep/er")).unwrap();
    fs::write(f.tree.join("deep/er/file"), "new blob").unwrap();
    let steps = ObjectSteps::new(&f, "durable", None);
    let result = f
        .driver
        .scoped_commit(&f.repo, f.held(), &baseline, &nested_request(), "fixture", "durable", &steps)
        .unwrap();
    assert_eq!(result.status, ResultCode::Committed);
    // Commit, root tree, two subtrees and the blob; the commit alone is new after the branch moved.
    assert_eq!(objects_of_commit(&f, &baseline.head), 5);
    assert_eq!(steps.staged(), 4);
    assert_eq!(steps.seen(), 5);
}

#[test]
fn a_refused_staged_object_sync_never_reaches_git_commit() {
    let f = Fixture::new();
    let baseline = f.driver.preflight_commit(&f.repo, f.held(), None).unwrap();
    fs::create_dir_all(f.tree.join("deep/er")).unwrap();
    fs::write(f.tree.join("deep/er/file"), "new blob").unwrap();
    let steps = ObjectSteps::new(&f, "refused", None).refusing_staged_at(2);
    let refused = f.driver.scoped_commit(
        &f.repo, f.held(), &baseline, &nested_request(), "fixture", "refused", &steps,
    );
    assert!(refused.is_err());
    assert_eq!(git(&f.tree, &["rev-parse", "HEAD"]), baseline.head);
    assert_eq!(git(&f.tree, &["diff", "--cached", "--name-only"]), "");
    assert_eq!(fs::read_to_string(f.tree.join("deep/er/file")).unwrap(), "new blob");
    assert_eq!(steps.seen(), 0);
}

#[test]
fn recovery_makes_the_new_objects_durable_before_it_reports_the_commit() {
    let f = Fixture::new();
    let base = unacknowledged_nested_commit(&f, "interrupted");
    let recovering = ObjectSteps::new(&f, "interrupted", None).based_on(&base);
    let outcome = f
        .driver
        .recover_scoped_commit(&f.repo, f.held(), "fixture", "interrupted", &recovering)
        .unwrap();
    assert!(matches!(outcome, wal::Outcome::Commit { contract_violation: false, .. }), "{outcome:?}");
    assert_eq!(recovering.seen(), objects_of_commit(&f, &base));
}

#[test]
fn recovery_of_a_tip_with_an_unreadable_object_names_the_cause_and_keeps_the_evidence() {
    for (id, lost) in [("lost-blob", "HEAD:deep/er/file"), ("lost-commit", "HEAD")] {
        let f = Fixture::new();
        unacknowledged_nested_commit(&f, id);
        let tip = git(&f.tree, &["rev-parse", "HEAD"]);
        let object = git(&f.tree, &["rev-parse", lost]);
        let file = loose_object(&f, &object);
        fs::set_permissions(&file, std::os::unix::fs::PermissionsExt::from_mode(0o644)).unwrap();
        fs::remove_file(&file).unwrap();
        let error = f.driver.recover_scoped_commit(&f.repo, f.held(), "fixture", id, &wal::OsFileSystem).unwrap_err();
        assert_eq!(error.code, ResultCode::RecoveryRequired, "{lost}");
        assert_eq!(error.cause, "commit-objects-unreadable", "{lost}");
        // The branch is not reset and the chain stays open for the owner.
        assert_eq!(git(&f.tree, &["rev-parse", "HEAD"]), tip);
        assert!(wal::Wal::open(&f.repo).unwrap().inspect(id).unwrap().outcome().is_none());
    }
}

/// Leaves the objects of a staged `deep/er/file` on disk as a power cut in the
/// old window did: every blob and tree present under its name, but empty, and
/// the index back at HEAD. With `blob_only`, only the blob is emptied. Returns
/// the emptied oids, the blob last.
fn leave_staged_objects_empty(f: &Fixture, blob_only: bool) -> Vec<String> {
    use std::os::unix::fs::PermissionsExt;
    fs::create_dir_all(f.tree.join("deep/er")).unwrap();
    fs::write(f.tree.join("deep/er/file"), "new blob").unwrap();
    git(&f.tree, &["add", "-A", "deep"]);
    let root = git(&f.tree, &["write-tree"]);
    let mut oids = vec![root.clone()];
    oids.extend(git(&f.tree, &["ls-tree", "-r", "-t", &root, "deep"]).lines().map(|l| l.split_whitespace().nth(2).unwrap().to_owned()));
    git(&f.tree, &["reset", "-q"]);
    if blob_only {
        oids = oids.split_off(oids.len() - 1);
    }
    for oid in &oids {
        let file = loose_object(f, oid);
        fs::set_permissions(&file, fs::Permissions::from_mode(0o644)).unwrap();
        fs::write(&file, b"").unwrap();
    }
    oids
}

#[test]
fn staged_objects_a_cut_left_empty_are_healed_so_the_commit_names_readable_objects() {
    // Every object of the change emptied (Git cannot even list the trees), then only the blob.
    for blob_only in [false, true] {
        let f = Fixture::new();
        let baseline = f.driver.preflight_commit(&f.repo, f.held(), None).unwrap();
        let emptied = leave_staged_objects_empty(&f, blob_only);
        assert_eq!(emptied.len(), if blob_only { 1 } else { 4 });
        let result = f
            .driver
            .scoped_commit(&f.repo, f.held(), &baseline, &nested_request(), "fixture", "healed", &wal::OsFileSystem)
            .unwrap();
        assert_eq!(result.status, ResultCode::Committed);
        assert_eq!(git(&f.tree, &["show", "HEAD:deep/er/file"]), "new blob");
        git(&f.tree, &["fsck", "--full", "--strict"]);
        for oid in &emptied {
            assert!(fs::metadata(loose_object(&f, oid)).unwrap().len() > 0, "{oid}");
        }
    }
}

#[test]
fn a_corrupt_staged_object_that_cannot_be_healed_refuses_before_git_commit() {
    use std::os::unix::fs::{MetadataExt, PermissionsExt};
    let f = Fixture::new();
    // Permission bits do not stop the superuser from removing the file.
    if fs::metadata("/proc/self").unwrap().uid() == 0 {
        return;
    }
    let baseline = f.driver.preflight_commit(&f.repo, f.held(), None).unwrap();
    let emptied = leave_staged_objects_empty(&f, false);
    let blob = git(&f.tree, &["hash-object", "deep/er/file"]);
    assert!(emptied.contains(&blob));
    let fanout = loose_object(&f, &blob).parent().unwrap().to_owned();
    fs::set_permissions(&fanout, fs::Permissions::from_mode(0o555)).unwrap();
    let refused = f
        .driver
        .scoped_commit(&f.repo, f.held(), &baseline, &nested_request(), "fixture", "unhealable", &wal::OsFileSystem);
    fs::set_permissions(&fanout, fs::Permissions::from_mode(0o755)).unwrap();
    assert_eq!(refused.unwrap_err().cause, "object-file-corrupt");
    assert_eq!(git(&f.tree, &["rev-parse", "HEAD"]), baseline.head);
    assert_eq!(git(&f.tree, &["diff", "--cached", "--name-only"]), "");
    assert_eq!(fs::read_to_string(f.tree.join("deep/er/file")).unwrap(), "new blob");
}
