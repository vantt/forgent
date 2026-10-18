#![cfg(target_os = "linux")]
mod reader_support;
use fgos_event_store::{
    append::Positions,
    order::{order, stream_key},
    walk::walk,
};
use reader_support::*;
use std::collections::BTreeSet;
#[test]
fn c4_covered_seal_does_not_prune_unseen_origin_below_merge_and_promote() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, "refs/fgos/events/test-aa");
    let a1 = event('a', 1, 1);
    let a2 = event('a', 2, 2);
    let b1 = event('b', 1, 0);
    let mut q1 = event('a', 1, 3);
    q1.scope = fgos_event_store::envelope::Scope::Branch;
    q1.stream = "branch:feature".into();
    rehash(&mut q1);
    let mut promote = event('a', 3, 4);
    let a = seal(&p, &f.repo, vec![], std::slice::from_ref(&a1), "test-aa");
    let b = seal(&p, &f.repo, vec![], std::slice::from_ref(&b1), "test-bb");
    let m = merge(&p, &f.repo, &a, &b, "test-aa");
    let c = seal(&p, &f.repo, vec![m], std::slice::from_ref(&a2), "test-aa");
    let q = seal(&p, &f.repo, vec![], std::slice::from_ref(&q1), "test-cc");
    promote.event_type = "store.promote".into();
    promote.payload =
        serde_json::json!({"stream":"branch:feature","throughSeq":1,"tip":q.as_str()});
    rehash(&mut promote);
    let final_tip = seal(
        &p,
        &f.repo,
        vec![c.clone(), q],
        std::slice::from_ref(&promote),
        "test-aa",
    );
    publish(
        &p,
        &f.repo,
        "refs/fgos/events/test-aa",
        None,
        final_tip.clone(),
        "c4-tip",
    );
    let cover = Positions::from([(stream_key(&a1), 2)]);
    let certified = BTreeSet::from([a.as_str().into()]);
    let got = walk(
        &p,
        &f.repo,
        &[final_tip.clone(), final_tip],
        &cover,
        &certified,
    )
    .unwrap();
    let hashes: BTreeSet<_> = got.events.iter().map(|e| e.h.clone()).collect();
    assert_eq!(hashes, BTreeSet::from([b1.h.clone(), q1.h, promote.h]));
    assert!(got.visited.contains(a.as_str()));
    assert_eq!(got.visited.len(), 6);
    assert!(walk(&p, &f.repo, &[c], &cover, &certified)
        .unwrap()
        .events
        .iter()
        .any(|e| e.h == b1.h));
    let rebuilt = walk(&p, &f.repo, &[a], &Positions::new(), &BTreeSet::new()).unwrap();
    assert_eq!(
        order(&rebuilt.events, &Positions::new(), false)
            .unwrap()
            .events,
        vec![a1]
    );
}
#[test]
fn bounded_walk_terminates_and_lost_certificates_only_lengthen_it() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, "refs/fgos/events/test-aa");
    let mut tip = None;
    let mut mid = None;
    for seq in 1..=260 {
        let oid = seal(
            &p,
            &f.repo,
            tip.into_iter().collect(),
            &[event('a', seq, 1)],
            "test-aa",
        );
        if seq == 257 {
            mid = Some(oid.clone());
        }
        tip = Some(oid);
    }
    let tips = [tip.unwrap()];
    let full = walk(&p, &f.repo, &tips, &Positions::new(), &BTreeSet::new()).unwrap();
    assert_eq!(full.visited.len(), 260);
    let cover = Positions::from([(format!("{}:project", "a".repeat(32)), 257)]);
    let short = walk(
        &p,
        &f.repo,
        &tips,
        &cover,
        &BTreeSet::from([mid.unwrap().as_str().into()]),
    )
    .unwrap();
    assert_eq!(short.visited.len(), 4);
    assert_eq!(short.events.len(), 3);
    assert_eq!(
        walk(&p, &f.repo, &tips, &cover, &BTreeSet::new())
            .unwrap()
            .events,
        short.events
    );
}
