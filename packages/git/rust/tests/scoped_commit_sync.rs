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
        let baseline = f.driver.preflight_commit(&main, vec![]).unwrap();
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
        };
        let result = f
            .driver
            .scoped_commit(&main, vec![], &baseline, &request, "fixture", "cutover")
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
    let baseline = f.driver.preflight_commit(&f.repo, f.held()).unwrap();
    let request = CommitRequest {
        writes: vec!["a".into()],
        message: "interrupted".into(),
        cutover_grant: None,
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
    let baseline = f.driver.preflight_commit(&f.repo, f.held()).unwrap();
    fs::write(f.tree.join("fresh"), id).unwrap();
    let request = CommitRequest {
        writes: vec!["fresh".into()],
        message: "fresh".into(),
        cutover_grant: None,
    };
    assert_eq!(
        f.driver
            .scoped_commit(&f.repo, f.held(), &baseline, &request, "fixture", id)
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
            };
            assert_eq!(
                f.driver
                    .scoped_commit(&f.repo, f.held(), &baseline, &request, "fixture", "fresh")
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
fn explicit_recovery_observes_commit_or_closes_unknown_without_replaying() {
    for committed in [false, true] {
        let f = Fixture::new();
        interrupted(&f, "interrupted", 2, false);
        if committed {
            git(&f.tree, &["commit", "-qm", "interrupted"]);
        }
        let head = git(&f.tree, &["rev-parse", "HEAD"]);
        let outcome = f
            .driver
            .recover_scoped_commit(&f.repo, f.held(), "fixture", "interrupted")
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
        .recover_scoped_commit(&f.repo, f.held(), "fixture", "interrupted")
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
        .recover_scoped_commit(&f.repo, f.held(), "fixture", "interrupted")
        .unwrap();
    fresh_commit(&f, "fresh");
}
#[test]
fn terminal_commit_history_is_bounded_and_compacted_receipts_replay() {
    let f = Fixture::new();
    let mut first = None;
    for n in 0..9 {
        let baseline = f.driver.preflight_commit(&f.repo, f.held()).unwrap();
        fs::write(f.tree.join("a"), format!("version {n}")).unwrap();
        let request = CommitRequest {
            writes: vec!["a".into()],
            message: "bounded".into(),
            cutover_grant: None,
        };
        let id = format!("bounded-{n}");
        let result = f
            .driver
            .scoped_commit(&f.repo, f.held(), &baseline, &request, "fixture", &id)
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
                "bounded-0"
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
            .recover_scoped_commit(&f.repo, f.held(), "fixture", "observe");
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
        .recover_scoped_commit(&f.repo, f.held(), "fixture", "unknown")
        .unwrap();
    assert!(
        matches!(outcome, wal::Outcome::CommitRejected { cause } if cause == "commit-effect-unknown")
    );
    assert_eq!(git(&f.tree, &["diff", "--cached", "--name-only"]), "human");
    let error = f
        .driver
        .scoped_commit(&f.repo, f.held(), &baseline, &request, "fixture", "unknown")
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
        .recover_scoped_commit(&f.repo, f.held(), "fixture", "prepared")
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
        let baseline = f.driver.preflight_commit(&f.repo, f.held()).unwrap();
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
                },
                "fixture",
                "new-checkout",
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
            .recover_scoped_commit(&f.repo, f.held(), "fixture", "dead")
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
        let baseline = f.driver.preflight_commit(&f.repo, f.held()).unwrap();
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
                },
                "fixture",
                "new",
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
        .recover_scoped_commit(&f.repo, f.held(), "fixture", "never-ran")
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
