#![cfg(target_os = "linux")]
include!("support/land.rs");
#[test]
fn real_merge_evidence_and_same_id_replay() {
    let f = Fixture::new();
    let mut s = f
        .driver
        .prepare_land(&f.repo, vec![], &f.request, "fixture", "merge")
        .unwrap();
    let e = evidence(&s);
    let c = s.candidate().unwrap();
    assert_eq!(
        git(&c.worktree, &["show", "-s", "--format=%P"]),
        format!("{} {}", f.request.target, f.request.source)
    );
    let r = f.driver.publish_land(&f.repo, &mut s, &e).unwrap();
    assert_eq!(r.operation_id, "merge");
    for record in wal::Wal::open(&f.repo)
        .unwrap()
        .inspect("merge")
        .unwrap()
        .records()
    {
        println!(
            "WAL_SCHEMA_RECORD {}",
            serde_json::to_string(record).unwrap()
        );
    }
    assert!(matches!(r.checkout, Checkout::Reconciled));
    let encoded = serde_json::to_value(&r).unwrap();
    drop(s);
    // A raw external ABA does not authorize a second CAS for this identity.
    git(
        &f.main,
        &["update-ref", "refs/heads/trunk", &f.request.target],
    );
    let replay = f
        .driver
        .prepare_land(&f.repo, vec![], &f.request, "fixture", "merge")
        .unwrap();
    assert_eq!(
        serde_json::to_value(replay.receipt().unwrap()).unwrap(),
        encoded
    );
    assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), f.request.target);
}
#[test]
fn mismatch_and_candidate_edits_never_publish() {
    let f = Fixture::new();
    let mut s = f
        .driver
        .prepare_land(&f.repo, vec![], &f.request, "fixture", "verify")
        .unwrap();
    let mut e = evidence(&s);
    e.tree_digest = "wrong".into();
    assert_eq!(
        f.driver
            .publish_land(&f.repo, &mut s, &e)
            .unwrap_err()
            .cause,
        "land-verification-mismatch"
    );
    e = evidence(&s);
    fs::write(s.candidate().unwrap().worktree.join("a"), "tampered").unwrap();
    assert_eq!(
        f.driver
            .publish_land(&f.repo, &mut s, &e)
            .unwrap_err()
            .cause,
        "land-candidate-dirty"
    );
    assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), f.request.target);
}
#[test]
fn dirty_nonoverlap_is_preserved_and_reported_lagging() {
    let f = Fixture::new();
    fs::write(f.main.join("b"), "keep local\n").unwrap();
    let mut s = f
        .driver
        .prepare_land(&f.repo, vec![], &f.request, "fixture", "dirty")
        .unwrap();
    let e = evidence(&s);
    let r = f.driver.publish_land(&f.repo, &mut s, &e).unwrap();
    assert!(matches!(r.checkout, Checkout::Pending));
    assert_eq!(
        fs::read_to_string(f.main.join("b")).unwrap(),
        "keep local\n"
    );
}
#[test]
fn dirty_own_paths_block_before_cas() {
    let f = Fixture::new();
    let mut s = f
        .driver
        .prepare_land(&f.repo, vec![], &f.request, "fixture", "own")
        .unwrap();
    fs::write(f.main.join("a"), "keep local\n").unwrap();
    let e = evidence(&s);
    assert_eq!(
        f.driver
            .publish_land(&f.repo, &mut s, &e)
            .unwrap_err()
            .cause,
        "main-checkout-dirty-mid-merge"
    );
    assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), f.request.target);
}
#[test]
fn slot_excludes_same_destination_through_verification() {
    let f = Fixture::new();
    let s = f
        .driver
        .prepare_land(&f.repo, vec![], &f.request, "fixture", "first")
        .unwrap();
    assert!(f
        .driver
        .prepare_land(&f.repo, vec![], &f.request, "fixture", "second")
        .err()
        .unwrap()
        .cause
        .contains("lock-acquire"));
    drop(s);
}
#[test]
fn held_custody_refuses_before_effect() {
    use fgos_holder_lock::{acquire, Acquire, BorrowedHandle, Mode, Resource, Wait};
    let f = Fixture::new();
    let h = match acquire(
        &Resource::new("dispatch-cwd", f.main.join(".fgos/locks/test-cwd.lock")),
        Mode::Ex,
        Wait::Ms(0),
        5000,
    ) {
        Acquire::Acquired(h) => h,
        _ => panic!(),
    };
    let e = f
        .driver
        .prepare_land(
            &f.repo,
            vec![BorrowedHandle::new(&h).unwrap()],
            &f.request,
            "fixture",
            "order",
        )
        .err()
        .unwrap();
    assert_eq!(e.cause, "lock-order-violation");
    assert!(!f.main.join(".fgos/runtime/git-candidates").exists());
    assert!(!f.main.join(".git/fgos/git/operations/order").exists());
}
#[test]
fn squash_has_one_parent() {
    let mut f = Fixture::new();
    f.request.squash = true;
    let s = f
        .driver
        .prepare_land(&f.repo, vec![], &f.request, "fixture", "squash")
        .unwrap();
    assert_eq!(
        git(
            &s.candidate().unwrap().worktree,
            &["show", "-s", "--format=%P"]
        ),
        f.request.target
    );
}
#[test]
fn land_candidate_excludes_worktree_lifecycle_changes() {
    let f = Fixture::new();
    let session = f
        .driver
        .prepare_land(&f.repo, vec![], &f.request, "fixture", "lifecycle")
        .unwrap();
    let candidate = session.candidate().unwrap();
    let oid = Oid::parse(&candidate.candidate, f.repo.object_format()).unwrap();
    // Satisfy delivery proof independently, so this checks WAL exclusion itself.
    git(
        &f.main,
        &[
            "update-ref",
            "refs/heads/delivery-proof",
            &candidate.candidate,
        ],
    );
    let error = f
        .driver
        .remove_worktree(
            &f.repo,
            vec![],
            &candidate.worktree,
            &WorktreeDelivery {
                expected_tip: oid.clone(),
                delivered_to: oid,
                evidence_digest: "a".repeat(64),
            },
            "fixture",
            "remove-candidate",
        )
        .unwrap_err();
    assert_eq!(error.cause, "resource-recovery-required");
    assert!(candidate.worktree.exists());
}
#[test]
fn staged_dirt_survives_publish_and_exact_old_recovery() {
    for stop_at in [
        None,
        Some("land-before-read-tree"),
        Some("land-after-read-tree"),
    ] {
        let f = Fixture::new();
        fs::write(f.main.join("b"), "staged b\n").unwrap();
        fs::write(f.main.join("newstaged"), "staged addition\n").unwrap();
        git(&f.main, &["add", "b", "newstaged"]);
        let staged = git(&f.main, &["diff", "--cached", "--", "b", "newstaged"]);
        struct Stop(Option<&'static str>);
        impl wal::FileSystem for Stop {
            fn checkpoint(&self, name: &'static str) -> std::io::Result<()> {
                if self.0 == Some(name) {
                    Err(std::io::Error::other("interrupted"))
                } else {
                    Ok(())
                }
            }
        }
        let mut s = f
            .driver
            .prepare_land(&f.repo, vec![], &f.request, "fixture", "staged")
            .unwrap();
        let e = evidence(&s);
        let result = f
            .driver
            .publish_land_with_filesystem(&f.repo, &mut s, &e, &Stop(stop_at));
        let r = if stop_at.is_some() {
            assert!(result.is_err());
            let retry = f.driver.publish_land(&f.repo, &mut s, &e).unwrap_err();
            assert_eq!(retry.code, ResultCode::RecoveryRequired);
            assert_eq!(retry.cause, "land-recovery-required");
            drop(s);
            f.driver
                .recover_land(&f.repo, vec![], "fixture", "staged")
                .unwrap()
        } else {
            result.unwrap()
        };
        assert!(matches!(r.checkout, Checkout::Pending));
        assert_eq!(
            git(&f.main, &["diff", "--cached", "--", "b", "newstaged"]),
            staged
        );
        assert_eq!(fs::read_to_string(f.main.join("b")).unwrap(), "staged b\n");
        assert_eq!(
            fs::read_to_string(f.main.join("newstaged")).unwrap(),
            "staged addition\n"
        );
        assert_eq!(fs::read_to_string(f.main.join("a")).unwrap(), "incoming\n");
    }
}
#[test]
fn cas_failure_uses_shared_refs_classification_and_loss_replays_as_error() {
    for lose in [false, true] {
        let f = Fixture::new();
        struct Race<'a>(&'a Fixture, bool);
        impl wal::FileSystem for Race<'_> {
            fn checkpoint(&self, name: &'static str) -> std::io::Result<()> {
                if name == "land-before-cas" {
                    if self.1 {
                        git(
                            &self.0.main,
                            &["update-ref", "refs/heads/trunk", &self.0.request.source],
                        );
                    } else {
                        fs::write(self.0.main.join(".git/refs/heads/trunk.lock"), "external")
                            .unwrap();
                    }
                }
                Ok(())
            }
        }
        let mut s = f
            .driver
            .prepare_land(&f.repo, vec![], &f.request, "fixture", "cas")
            .unwrap();
        let e = evidence(&s);
        let error = f
            .driver
            .publish_land_with_filesystem(&f.repo, &mut s, &e, &Race(&f, lose))
            .unwrap_err();
        let chain = wal::Wal::open(&f.repo).unwrap().inspect("cas").unwrap();
        if lose {
            assert_eq!(error.cause, "land-cas-lost");
            let receipt = serde_json::to_value(error.receipt.unwrap()).unwrap();
            assert_eq!(
                serde_json::to_value(
                    f.driver
                        .publish_land(&f.repo, &mut s, &e)
                        .unwrap_err()
                        .receipt
                        .unwrap()
                )
                .unwrap(),
                receipt
            );
            drop(s);
            let replay = f
                .driver
                .prepare_land(&f.repo, vec![], &f.request, "fixture", "cas")
                .err()
                .unwrap();
            assert_eq!(replay.cause, "land-cas-lost");
            assert_eq!(
                serde_json::to_value(replay.receipt.unwrap()).unwrap(),
                receipt
            );
            let candidate = match &chain.intent().kind {
                wal::OperationKind::Land(p) => p.candidate.worktree.clone(),
                _ => panic!(),
            };
            assert!(f
                .driver
                .acknowledge_land(&f.repo, "fixture", "cas", "durable-loss")
                .unwrap()
                .is_empty());
            assert!(!candidate.exists());
        } else {
            assert_eq!(error.cause, "ref-write-failed-recovery-required");
            assert!(chain.outcome().is_none());
            assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), f.request.target);
            assert_eq!(
                f.driver.publish_land(&f.repo, &mut s, &e).unwrap_err().code,
                ResultCode::RecoveryRequired
            );
        }
    }
}
#[test]
fn invalid_file_is_rejected_before_candidate_allocation() {
    let f = Fixture::new();
    let mut req = f.request.clone();
    req.files.push(LandFile {
        path: "../escape".into(),
        bytes: Some(vec![1]),
    });
    assert_eq!(
        f.driver
            .prepare_land(&f.repo, vec![], &req, "fixture", "invalid")
            .err()
            .unwrap()
            .cause,
        "invalid-land-file"
    );
    assert!(!f.main.join(".fgos/runtime/git-candidates").exists());
}
#[test]
fn failed_cas_at_candidate_and_checkout_switch_require_recovery() {
    for switch in [false, true] {
        let f = Fixture::new();
        let mut s = f
            .driver
            .prepare_land(&f.repo, vec![], &f.request, "fixture", "observed")
            .unwrap();
        let e = evidence(&s);
        struct Race<'a> {
            f: &'a Fixture,
            next: String,
            switch: bool,
        }
        impl wal::FileSystem for Race<'_> {
            fn checkpoint(&self, name: &'static str) -> std::io::Result<()> {
                if name == "land-before-cas" {
                    if self.switch {
                        git(&self.f.main, &["checkout", "-q", "source"]);
                    } else {
                        git(
                            &self.f.main,
                            &["update-ref", "refs/heads/trunk", &self.next],
                        );
                        fs::write(self.f.main.join(".git/refs/heads/trunk.lock"), "external")
                            .unwrap();
                    }
                }
                Ok(())
            }
        }
        let error = f
            .driver
            .publish_land_with_filesystem(
                &f.repo,
                &mut s,
                &e,
                &Race {
                    f: &f,
                    next: e.candidate.clone(),
                    switch,
                },
            )
            .unwrap_err();
        assert_eq!(
            error.cause,
            if switch {
                "checkout-switch-recovery-required"
            } else {
                "ref-write-failed-recovery-required"
            }
        );
        assert!(wal::Wal::open(&f.repo)
            .unwrap()
            .inspect("observed")
            .unwrap()
            .outcome()
            .is_none());
        assert_eq!(
            f.driver
                .publish_land(&f.repo, &mut s, &e)
                .unwrap_err()
                .cause,
            "land-recovery-required"
        );
    }
}
#[test]
fn fresh_id_refuses_an_already_landed_source() {
    let f = Fixture::new();
    let mut s = f
        .driver
        .prepare_land(&f.repo, vec![], &f.request, "fixture", "original")
        .unwrap();
    let e = evidence(&s);
    f.driver.publish_land(&f.repo, &mut s, &e).unwrap();
    drop(s);
    let mut req = f.request.clone();
    req.target = e.candidate;
    let error = f
        .driver
        .prepare_land(&f.repo, vec![], &req, "fixture", "duplicate")
        .err()
        .unwrap();
    assert_eq!(error.cause, "land-already-merged");
    assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), req.target);
}
