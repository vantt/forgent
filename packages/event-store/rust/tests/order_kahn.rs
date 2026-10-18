use fgos_event_store::{
    append::Positions,
    cursor::{fold_answer, Cursor, Fold},
    envelope::{Envelope, Scope},
    order::{order, stream_key},
};
use serde_json::json;
fn event(origin: char, seq: u64, ts: u32) -> Envelope {
    let mut e = Envelope {
        v: 4,
        event_type: "work.add".into(),
        scope: Scope::Project,
        origin: origin.to_string().repeat(32),
        stream: "project".into(),
        seq,
        seen: Positions::new(),
        ts: format!("2026-01-01T00:00:{ts:02}.000Z"),
        src: "writer".into(),
        schema_version: 1,
        payload: json!({}),
        h: String::new(),
    };
    e.h = e.compute_hash().unwrap();
    e
}
fn rehash(e: &mut Envelope) {
    e.h = e.compute_hash().unwrap();
}
fn permutations<T: Clone>(v: &mut [T], n: usize, f: &mut impl FnMut(&[T])) {
    if n == v.len() {
        f(v);
        return;
    }
    for i in n..v.len() {
        v.swap(n, i);
        permutations(v, n + 1, f);
        v.swap(n, i);
    }
}
#[test]
fn v_seq_01_clock_rollback_equal_times_all_permutations_through_seven() {
    let mut all = vec![
        event('a', 1, 5),
        event('a', 2, 1),
        event('b', 1, 5),
        event('b', 2, 5),
        event('c', 1, 0),
        event('d', 1, 2),
        event('d', 2, 0),
    ];
    for n in 1..=7 {
        let mut input = all[..n].to_vec();
        let expected = order(&input, &Positions::new(), true).unwrap().events;
        permutations(&mut input, 0, &mut |v| {
            assert_eq!(order(v, &Positions::new(), true).unwrap().events, expected)
        });
    }
    all.extend([event('e', 1, 5), event('f', 1, 2)]);
    let expected = order(&all, &Positions::new(), true).unwrap().events;
    let mut seed = 7u64;
    for _ in 0..10_000 {
        for i in (1..all.len()).rev() {
            seed = seed.wrapping_mul(6364136223846793005).wrapping_add(1);
            all.swap(i, seed as usize % (i + 1));
        }
        assert_eq!(
            order(&all, &Positions::new(), true).unwrap().events,
            expected
        );
    }
}
#[test]
fn c5_missing_predecessor_defers_transitively_then_emits_once() {
    let a = event('a', 1, 3);
    let mut b = event('b', 1, 1);
    b.seen.insert(stream_key(&a), 1);
    rehash(&mut b);
    let c = event('b', 2, 0);
    let held = order(&[b.clone(), c.clone()], &Positions::new(), true).unwrap();
    assert!(held.events.is_empty());
    assert_eq!(held.deferred.len(), 2);
    let got = order(&[c, b.clone(), a.clone(), b], &Positions::new(), true).unwrap();
    assert_eq!(got.events[0], a);
    assert_eq!(got.events.len(), 3);
    assert!(got.deferred.is_empty());
}
#[test]
fn cycles_and_sequence_conflicts_are_named_errors() {
    let mut a = event('a', 1, 1);
    let mut b = event('b', 1, 2);
    a.seen.insert(stream_key(&b), 1);
    b.seen.insert(stream_key(&a), 1);
    rehash(&mut a);
    rehash(&mut b);
    assert_eq!(
        order(&[a.clone(), b], &Positions::new(), true)
            .unwrap_err()
            .code
            .as_str(),
        "event-store-order-cycle"
    );
    let mut other = a.clone();
    other.payload = json!({"different":true});
    rehash(&mut other);
    assert_eq!(
        order(&[a, other], &Positions::new(), true)
            .unwrap_err()
            .code
            .as_str(),
        "event-store-seq-conflict"
    );
}
#[test]
fn c6_delayed_concurrent_event_requires_suffix_replay_at_zero() {
    let x = event('a', 1, 2);
    let y = event('b', 1, 1);
    let old = Cursor {
        cover: Positions::from([(stream_key(&x), 1)]),
        ..Cursor::default()
    };
    let full = order(&[x.clone(), y.clone()], &Positions::new(), true).unwrap();
    assert_eq!(
        fold_answer(
            &old,
            &old,
            std::slice::from_ref(&x.h),
            &full.events.iter().map(|e| e.h.clone()).collect::<Vec<_>>(),
            &[y],
            &x.origin
        ),
        Fold::RebuildRequired {
            first_difference: 0
        }
    );
    assert_eq!(full.events[1], x);
}
#[test]
fn proven_own_stream_incremental_fold_matches_full_rebuild() {
    let first = event('a', 1, 2);
    let next = event('a', 2, 0);
    let old = Cursor {
        cover: Positions::from([(stream_key(&first), 1)]),
        ..Cursor::default()
    };
    let full = order(&[next.clone(), first.clone()], &Positions::new(), true).unwrap();
    assert_eq!(full.events, vec![first.clone(), next.clone()]);
    assert_eq!(
        fold_answer(
            &old,
            &old,
            std::slice::from_ref(&first.h),
            &[first.h.clone(), next.h.clone()],
            &[next],
            &first.origin
        ),
        Fold::Incremental
    );
    let bytes = old.canonical_bytes().unwrap();
    assert!(serde_json::from_slice::<serde_json::Value>(&bytes)
        .unwrap()
        .get("emitted")
        .is_none());
    assert_eq!(Cursor::parse(&bytes).unwrap(), old);
}
#[test]
fn promote_is_one_node_with_branch_inputs_and_unpromoted_events_hidden() {
    let a = event('b', 1, 4);
    let mut branch = event('a', 1, 0);
    branch.scope = Scope::Branch;
    branch.stream = "branch:feature".into();
    branch.seen.insert(stream_key(&a), 1);
    rehash(&mut branch);
    let mut promote = event('a', 1, 1);
    promote.event_type = "store.promote".into();
    promote.payload = json!({"stream":"branch:feature","throughSeq":1,"tip":"a".repeat(40)});
    rehash(&mut promote);
    let mut orphan = branch.clone();
    orphan.stream = "branch:orphan".into();
    rehash(&mut orphan);
    let result = order(
        &[orphan, branch.clone(), promote.clone(), a.clone()],
        &Positions::new(),
        true,
    )
    .unwrap();
    assert_eq!(result.events, vec![a, promote, branch]);
}
#[test]
fn unpromoted_branch_cycles_do_not_enter_project_order() {
    let a = event('a', 1, 1);
    let mut b = event('b', 1, 1);
    let mut c = event('c', 1, 1);
    b.stream = "branch:hidden".into();
    b.scope = Scope::Branch;
    c.stream = b.stream.clone();
    c.scope = Scope::Branch;
    b.seen.insert(stream_key(&c), 1);
    c.seen.insert(stream_key(&b), 1);
    rehash(&mut b);
    rehash(&mut c);
    assert_eq!(
        order(&[a.clone(), b, c], &Positions::new(), true)
            .unwrap()
            .events,
        vec![a]
    );
}
