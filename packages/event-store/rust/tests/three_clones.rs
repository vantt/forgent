mod sync_support;
use sync_support::*;
#[test]
fn three_real_clones_join_offline_and_retain_a_departed_machine() {
    let w = World::new();
    let a = w.clone("a", "machine-aa");
    let b = w.clone("b", "machine-bb");
    let c = w.clone("c", "machine-cc");
    for clone in [&a, &b, &c] {
        clone.setup();
        clone.append(2);
        clone.sync(false).unwrap();
    }
    // A leaves; its ref remains history. B continues entirely locally for a period.
    std::fs::rename(&w.remote, w.root.join("offline.git")).unwrap();
    b.append(3);
    let error = b.sync(false).unwrap_err();
    assert_eq!(error.code.as_str(), "event-store-io");
    assert!(fgos_event_store::sync::sync_status(&b.layout)
        .unwrap()
        .error
        .is_some());
    assert_eq!(b.hashes().len(), 7);
    std::fs::rename(w.root.join("offline.git"), &w.remote).unwrap();
    b.sync(false).unwrap();
    c.append(1);
    c.sync(false).unwrap();
    for clone in [&b, &c] {
        clone.sync(false).unwrap();
    }
    assert_eq!(b.hashes(), c.hashes());
    assert_eq!(b.hashes().len(), 10);
    let join = w.clone("join", "machine-dd");
    join.setup();
    assert!(git(
        &join.root,
        &["for-each-ref", "--format=%(refname)", "refs/fgos/"]
    )
    .is_empty());
    join.sync(false).unwrap();
    assert_eq!(join.hashes(), b.hashes());
    assert!(git(
        &join.root,
        &["for-each-ref", "--format=%(refname)", "refs/fgos/events/"]
    )
    .is_empty());
    for root in [&a.root, &b.root, &c.root, &w.remote] {
        git(root, &["gc", "--prune=now"]);
    }
    assert_eq!(join.hashes(), b.hashes());
}
