#![cfg(target_os = "linux")]
include!("support/land.rs");
include!("support/signing.rs");
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
    let candidate = s.candidate().unwrap().candidate.clone();
    let r = f.driver.publish_land(&f.repo, &mut s, &e).unwrap();
    assert!(matches!(r.checkout, Checkout::Pending));
    assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), candidate, "the ref moves; only the checkout lags");
    assert_eq!(
        fs::read_to_string(f.main.join("b")).unwrap(),
        "keep local\n"
    );
}
#[test]
fn dirty_own_paths_block_before_cas() {
    // An own path edited, the same edit staged (the index alone differs), and a declared footprint
    // path renamed away (the rename source counts).
    for case in ["edited", "staged", "renamed"] {
        let f = Fixture::new();
        let mut request = f.request.clone();
        if case == "renamed" {
            request.footprint = Some(vec!["b".into()]);
        }
        let mut s = f
            .driver
            .prepare_land(&f.repo, vec![], &request, "fixture", "own")
            .unwrap();
        match case {
            "renamed" => {
                git(&f.main, &["mv", "b", "renamed"]);
            }
            _ => fs::write(f.main.join("a"), "keep local\n").unwrap(),
        }
        if case == "staged" {
            git(&f.main, &["add", "a"]);
        }
        let e = evidence(&s);
        assert_eq!(
            f.driver
                .publish_land(&f.repo, &mut s, &e)
                .unwrap_err()
                .cause,
            "main-checkout-dirty-mid-merge",
            "{case}"
        );
        assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), request.target, "{case}");
        if case == "staged" {
            assert_eq!(git(&f.main, &["show", ":a"]), "keep local", "the staged bytes stay in the index");
        }
    }
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

#[test]
fn recovery_candidate_parent_check_ignores_signature_display() {
    let f = Fixture::new();
    enable_signing(&f.main, &f.temp);
    let session = f.driver.prepare_land(&f.repo, vec![], &f.request, "fixture", "unsigned").unwrap();
    let candidate = session.candidate().unwrap();
    let signed = git(&f.main, &["commit-tree", "-S", &candidate.tree,
        "-p", &candidate.target, "-p", &candidate.source, "-m", "signed candidate"]);
    assert!(git(&f.main, &["show", "-s", "--format=%P", &signed]).contains("Good "));
    let wal = wal::Wal::open(&f.repo).unwrap();
    let mut intent = wal.inspect("unsigned").unwrap().intent().clone();
    let wal::OperationKind::Land(ref mut payload) = intent.kind else { panic!() };
    payload.candidate.candidate = signed.clone();
    intent.next = wal::Tip::Oid(signed.clone());
    // Seed a real signed candidate at the recovery boundary. A store collision
    // intentionally leaves checkout reconciliation pending after validation.
    struct Seed;
    impl wal::PublicationAuthority for Seed {
        fn validate_publication_borrow(&self, _: &wal::Intent) -> wal::WalResult<()> { Ok(()) }
    }
    let wal::Begin::Created(chain) = wal.begin("signed", intent, &Seed).unwrap() else { panic!() };
    let chain = wal.append(&chain, wal::Phase::Prepared).unwrap();
    let mut e = evidence(&session);
    e.candidate = signed.clone();
    let chain = wal.append(&chain, wal::Phase::LandVerified {
        evidence:e, checkout:Some(r#"{"storeCollision":true}"#.into()),
    }).unwrap();
    wal.append(&chain, wal::Phase::TargetAttempt {
        prior_target_attempt:None, expected:chain.intent().expected.clone(), next:chain.intent().next.clone(),
    }).unwrap();
    for (suffix, oid) in [("candidate", &signed), ("source/candidate", &f.request.source), ("target/candidate", &f.request.target)] {
        git(&f.main, &["update-ref", &format!("refs/fgos/git-operations/signed/{suffix}"), oid]);
    }
    git(&f.main, &["update-ref", "refs/heads/trunk", &signed]);
    drop(session);
    let receipt = f.driver.recover_land(&f.repo, vec![], "fixture", "signed").unwrap();
    assert!(matches!(receipt.checkout, Checkout::Pending));
}

#[test]
fn current_target_is_pinned_after_destination_acquisition_and_replays_after_cleanup() {
    let f = Fixture::new();
    fs::write(f.main.join("b"), "sibling\n").unwrap();
    git(&f.main, &["commit", "-qam", "sibling"]);
    let target = git(&f.main, &["rev-parse", "HEAD"]);
    let mut request = f.request.clone();
    request.target.clear();
    let mut session = f.driver.prepare_land(&f.repo, vec![], &request, "fixture", "current").unwrap();
    let candidate = session.candidate().unwrap().clone();
    assert_eq!(candidate.target, target);
    assert_eq!(git(&candidate.worktree, &["show", "-s", "--format=%P"]), format!("{} {}", target, request.source));
    assert_eq!(fs::read_to_string(candidate.worktree.join("b")).unwrap(), "sibling\n");
    assert_eq!(fs::read_to_string(candidate.worktree.join("a")).unwrap(), "incoming\n");
    let verification = evidence(&session);
    let receipt = f.driver.publish_land(&f.repo, &mut session, &verification).unwrap();
    drop(session);
    let retained = f.driver.list_retained_land(&f.repo, 100).unwrap();
    assert_eq!(retained["complete"], true);
    assert_eq!(retained["candidates"].as_array().unwrap().len(), 1);
    let kept = &retained["candidates"][0];
    assert_eq!(kept["operationId"], "current");
    assert_eq!(kept["worktree"], candidate.worktree.to_string_lossy().as_ref());
    assert_eq!(kept["worktreePresent"], true);
    assert_eq!(
        kept["pins"],
        serde_json::json!([
            "refs/fgos/git-operations/current/candidate",
            "refs/fgos/git-operations/current/source/candidate",
            "refs/fgos/git-operations/current/target/candidate"
        ])
    );
    assert!(kept["updatedAtMs"].as_u64().unwrap() > 0);
    assert!(f.driver.acknowledge_land(&f.repo, "fixture", "current", "durable-consumer-ack").unwrap().is_empty());
    assert!(f.driver.list_retained_land(&f.repo, 100).unwrap()["candidates"].as_array().unwrap().is_empty());
    assert!(!candidate.worktree.exists());
    git(&f.main, &["update-ref", "refs/heads/trunk", &f.request.target]);
    let replay = f.driver.prepare_land(&f.repo, vec![], &request, "fixture", "current").unwrap();
    assert_eq!(serde_json::to_value(replay.receipt().unwrap()).unwrap(), serde_json::to_value(receipt).unwrap());
    assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), f.request.target);
    let mut changed = request.clone();
    changed.message = "different request".into();
    assert_eq!(f.driver.prepare_land(&f.repo, vec![], &changed, "fixture", "current").err().unwrap().cause, "operation-id-reused");
}

#[test]
fn retained_listing_skips_chains_that_hold_nothing() {
    let f = Fixture::new();
    let mut session = f.driver.prepare_land(&f.repo, vec![], &f.request, "fixture", "gone").unwrap();
    let candidate = session.candidate().unwrap().clone();
    let verification = evidence(&session);
    f.driver.publish_land(&f.repo, &mut session, &verification).unwrap();
    drop(session);
    let listed = || f.driver.list_retained_land(&f.repo, 100).unwrap();
    assert_eq!(listed()["candidates"].as_array().unwrap().len(), 1);
    // The chain is terminal and uncompacted, but its worktree and every pin are gone.
    git(&f.main, &["worktree", "remove", "--force", candidate.worktree.to_str().unwrap()]);
    for suffix in ["", "/source", "/target"] {
        git(&f.main, &["update-ref", "-d", &format!("refs/fgos/git-operations/gone{suffix}/candidate")]);
    }
    assert!(listed()["candidates"].as_array().unwrap().is_empty());
    // An operation directory without an intent record never created a candidate.
    use std::os::unix::fs::DirBuilderExt;
    fs::DirBuilder::new().mode(0o700).create(f.main.join(".git/fgos/git/operations/no-intent")).unwrap();
    let after = listed();
    assert!(after["candidates"].as_array().unwrap().is_empty());
    assert_eq!(after["complete"], true);
}

#[test]
fn declared_resolution_bytes_are_frozen_before_consumer_verification() {
    let f = Fixture::new();
    fs::write(f.main.join("a"), "target disagrees\n").unwrap();
    git(&f.main, &["commit", "-qam", "target disagreement"]);
    let mut request = f.request.clone();
    request.target = git(&f.main, &["rev-parse", "HEAD"]);
    request.files = vec![LandFile { path: "a".into(), bytes: Some(b"consumer resolution\n".to_vec()) }];
    let mut session = f.driver.prepare_land(&f.repo, vec![], &request, "fixture", "resolved").unwrap();
    let candidate = session.candidate().unwrap();
    assert_eq!(fs::read_to_string(candidate.worktree.join("a")).unwrap(), "consumer resolution\n");
    assert_eq!(git(&candidate.worktree, &["diff", "--name-only", "--diff-filter=U"]), "");
    assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), request.target);
    assert!(!f.main.join(".git/MERGE_HEAD").exists(), "the conflict never reaches the main checkout");
    assert_eq!(git(&f.main, &["rev-parse", "source"]), request.source);
    let published = candidate.candidate.clone();
    let verification = evidence(&session);
    let receipt = f.driver.publish_land(&f.repo, &mut session, &verification).unwrap();
    assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), published, "{receipt:?}");
    assert_eq!(fs::read_to_string(f.main.join("a")).unwrap(), "consumer resolution\n");
}

#[test]
fn land_doors_refuse_an_unfenced_workspace_without_writing_records() {
    let f = Fixture::new();
    let mut s = f
        .driver
        .prepare_land(&f.repo, vec![], &f.request, "fixture", "fenced")
        .unwrap();
    let e = evidence(&s);
    let journal = || wal::Wal::with_filesystem(f.repo.common_dir(), wal::OsFileSystem).unwrap();
    let before = journal().inspect("fenced").unwrap().records().len();
    fs::remove_dir_all(
        f.repo
            .trusted_main_root()
            .join(".fgos/locks/activation.lock"),
    )
    .unwrap();
    fn refusal<T>(r: fgos_git::Result<T>) -> String {
        match r {
            Ok(_) => panic!("an unfenced workspace was admitted"),
            Err(e) => format!("{e:?}"),
        }
    }
    assert!(refusal(f.driver.publish_land(&f.repo, &mut s, &e)).contains("git-fence-missing"));
    assert!(refusal(f.driver.acknowledge_land(
        &f.repo,
        "fixture",
        "fenced",
        "durable-consumer-ack"
    ))
    .contains("git-fence-missing"));
    assert!(refusal(
        f.driver
            .prepare_land(&f.repo, vec![], &f.request, "fixture", "fresh")
    )
    .contains("git-fence-missing"));
    assert_eq!(journal().inspect("fenced").unwrap().records().len(), before);
    assert!(journal().inspect("fresh").is_err());
}
