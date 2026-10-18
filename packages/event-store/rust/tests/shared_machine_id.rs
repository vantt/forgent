mod sync_support;
use sync_support::*;
#[test]
fn shared_machine_diverges_merges_two_parents_and_can_append_after_merge() {
    let w = World::new();
    let a = w.clone("a", "machine-aa");
    let b = w.clone("b", "machine-aa");
    for c in [&a, &b] {
        c.setup();
        c.append(2);
    }
    a.sync(false).unwrap();
    let first = a.tip();
    // Seal B and fetch without pushing, so reconciliation observes the shared remote tip.
    b.sync(true).unwrap();
    let merged = b.tip();
    assert!(!b.sync(true).unwrap().warnings.is_empty());
    let parents = git(&b.root, &["show", "-s", "--format=%P", &merged]);
    assert_eq!(parents.split_whitespace().count(), 2);
    assert!(parents.contains(&first));
    let max_parent_date = parents
        .split_whitespace()
        .map(|parent| {
            git(&b.root, &["show", "-s", "--format=%ct", parent])
                .parse::<i64>()
                .unwrap()
        })
        .max()
        .unwrap();
    assert_eq!(
        git(&b.root, &["show", "-s", "--format=%ct", &merged])
            .parse::<i64>()
            .unwrap(),
        max_parent_date
    );

    b.sync(false).unwrap();
    a.sync(false).unwrap();
    assert_eq!(a.hashes(), b.hashes());
    b.append(1);
    b.sync(false).unwrap();
    a.append(1);
    a.sync(false).unwrap();
    b.sync(false).unwrap();
    assert_eq!(a.hashes(), b.hashes());
    assert_eq!(a.hashes().len(), 6);
}
