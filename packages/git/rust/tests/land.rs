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
