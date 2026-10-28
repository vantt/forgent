#![cfg(target_os = "linux")]
//! A process's repeat read: answered from what the last read concluded only
//! while every real input it observes is exactly the remembered one.
mod reader_support;
use fgos_event_store::{
    cursor::{Cursor, Fold},
    envelope::Envelope,
    errors::Error,
    layout::StreamId,
    read::{read_with_view, Memoized, ReadMemo, ReadRequest, ReadResult},
};
use fgos_git::{Inspect, Oid, Publication, PublicationPort, RefName, RefValue};
use reader_support::*;
use std::fs;

const REF: &str = "refs/fgos/events/test-aa";

fn streams() -> [StreamId; 1] {
    [StreamId::parse("project").unwrap()]
}
fn reader() -> String {
    "d".repeat(32)
}
/// One read as a process that holds `held` (the previous answer's cursor and
/// events), with or without the process memo.
fn read_as(
    port: &dyn Inspect,
    f: &Fixture,
    origin: &str,
    held: Option<&ReadResult>,
    memo: Option<&ReadMemo>,
) -> Result<ReadResult, Error> {
    read_holding(port, f, origin, held, memo, None)
}
/// The same read, naming the digest of the legacy events the caller holds.
fn read_holding(
    port: &dyn Inspect,
    f: &Fixture,
    origin: &str,
    held: Option<&ReadResult>,
    memo: Option<&ReadMemo>,
    legacy_held: Option<&str>,
) -> Result<ReadResult, Error> {
    let empty = Cursor::default();
    let streams = streams();
    read_with_view(
        port,
        &f.repo,
        ReadRequest {
            layout: &f.layout,
            origin,
            machine: "test-aa",
            streams: &streams,
            cursor: held.map_or(&empty, |h| &h.cursor),
            folded: held.map_or(&[], |h| &h.sequence),
            project: true,
        },
        None,
        memo.map(|memo| Memoized { memo, legacy_held }),
    )
}
/// Seal `seqs` of origin `a` on the own ref, one commit each, after `tip`.
fn extend(
    p: &PublicationPort<'_>,
    f: &Fixture,
    mut tip: Option<Oid>,
    seqs: std::ops::RangeInclusive<u64>,
) -> Oid {
    let old = tip.clone();
    for seq in seqs {
        tip = Some(seal(
            p,
            &f.repo,
            tip.into_iter().collect(),
            &[event('a', seq, 1)],
            "test-aa",
        ));
    }
    let tip = tip.unwrap();
    publish(
        p,
        &f.repo,
        REF,
        old,
        tip.clone(),
        &format!("tip-{}", tip.as_str()),
    );
    tip
}
fn sequences(read: &ReadResult) -> Vec<(String, u64)> {
    read.sequence
        .iter()
        .map(|e| (e.origin.clone(), e.seq))
        .collect()
}

#[test]
fn a_repeat_read_of_unchanged_inputs_is_answered_from_the_memo_after_one_ref_probe() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, REF);
    extend(&p, &f, None, 1..=12);
    let memo = ReadMemo::new();

    let first = read_as(&p, &f, &reader(), None, Some(&memo)).unwrap();
    assert!(!first.memoized, "a memo with nothing in it answers nothing");
    assert_eq!(first.sequence.len(), 12);

    let counting = CountingPort::new(&p);
    let again = read_as(&counting, &f, &reader(), Some(&first), Some(&memo)).unwrap();
    assert!(again.memoized);
    assert_eq!(
        counting.refs.get(),
        1,
        "the real ref tips are observed on every call"
    );
    assert_eq!(counting.read_commits.get(), 0);
    assert!(
        again.events.is_empty(),
        "the caller already holds everything"
    );
    assert_eq!(again.fold, Fold::Incremental);

    // The memo answer is the answer a full read gives for the same request.
    let plain = read_as(&p, &f, &reader(), Some(&first), None).unwrap();
    assert!(!plain.memoized);
    assert_eq!(again.sequence, plain.sequence);
    assert_eq!(again.cursor, plain.cursor);
    assert_eq!(again.full_order, plain.full_order);
    assert_eq!(again.legacy.len(), plain.legacy.len());
    assert_eq!(again.fold, plain.fold);
    assert_eq!(again.events, plain.events);
}

#[test]
fn a_write_by_another_process_is_seen_by_the_next_read_of_the_same_process() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, REF);
    let tip = extend(&p, &f, None, 1..=12);
    let memo = ReadMemo::new();
    let first = read_as(&p, &f, &reader(), None, Some(&memo)).unwrap();
    assert!(
        read_as(&p, &f, &reader(), Some(&first), Some(&memo))
            .unwrap()
            .memoized
    );

    // Another process appends, seals and publishes while this one holds its memo.
    extend(&p, &f, Some(tip), 13..=14);

    let next = read_as(&p, &f, &reader(), Some(&first), Some(&memo)).unwrap();
    assert!(
        !next.memoized,
        "a moved tip is never answered from the memo"
    );
    assert_eq!(next.sequence.len(), 14);
    assert_eq!(
        next.events.iter().map(|e| e.seq).collect::<Vec<_>>(),
        [13, 14],
        "the caller is handed exactly what it lacks"
    );
    let plain = read_as(&p, &f, &reader(), None, None).unwrap();
    assert_eq!(sequences(&next), sequences(&plain));

    // The read that saw the write is itself remembered.
    let after = read_as(&p, &f, &reader(), Some(&next), Some(&memo)).unwrap();
    assert!(after.memoized);
    assert_eq!(sequences(&after), sequences(&plain));
}

#[test]
fn a_change_to_the_own_local_files_is_seen_by_the_next_read() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, REF);
    let own = "a".repeat(32);
    let stream = &streams()[0];
    extend(&p, &f, None, 1..=2);
    let paths = f.layout.stream(stream);
    fs::create_dir_all(&paths.root).unwrap();
    fs::write(paths.sealed(), b"{\"lastSeq\":2}").unwrap();
    let memo = ReadMemo::new();
    let first = read_as(&p, &f, &own, None, Some(&memo)).unwrap();
    assert_eq!(first.sequence.len(), 2);
    assert!(
        read_as(&p, &f, &own, Some(&first), Some(&memo))
            .unwrap()
            .memoized
    );

    fs::write(paths.active(), batch(&[event('a', 3, 9)])).unwrap();
    let with_local = read_as(&p, &f, &own, Some(&first), Some(&memo)).unwrap();
    assert!(
        !with_local.memoized,
        "a new unsealed event is a changed input"
    );
    assert_eq!(with_local.sequence.len(), 3);
    assert_eq!(with_local.events.len(), 1);

    fs::remove_file(paths.active()).unwrap();
    let without = read_as(&p, &f, &own, Some(&with_local), Some(&memo)).unwrap();
    assert!(
        !without.memoized,
        "a lost unsealed event is a changed input too"
    );
    let plain = read_as(&p, &f, &own, Some(&with_local), None);
    assert_eq!(
        without.sequence.len(),
        plain.as_ref().map_or(0, |r| r.sequence.len())
    );
}

#[test]
fn a_replaced_ref_history_is_never_answered_from_the_memo() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, REF);
    let tip = extend(&p, &f, None, 1..=6);
    let memo = ReadMemo::new();
    let first = read_as(&p, &f, &reader(), None, Some(&memo)).unwrap();
    assert!(
        read_as(&p, &f, &reader(), Some(&first), Some(&memo))
            .unwrap()
            .memoized
    );

    // The whole chain is replaced by another history under the same name.
    let RefValue::Direct(old) = p.read_ref(&f.repo, &RefName::parse(REF).unwrap()).unwrap() else {
        panic!("own ref is not direct")
    };
    assert_eq!(old, tip);
    let mut next = seal(&p, &f.repo, vec![], &[event('a', 1, 1)], "test-aa");
    for seq in 2..=7 {
        next = seal(&p, &f.repo, vec![next], &[event('a', seq, 2)], "test-aa");
    }
    publish(&p, &f.repo, REF, Some(old), next, "replaced");

    let remembered = read_as(&p, &f, &reader(), Some(&first), Some(&memo));
    let plain = read_as(&p, &f, &reader(), Some(&first), None);
    match (remembered, plain) {
        (Ok(a), Ok(b)) => {
            assert!(!a.memoized);
            assert_eq!(a.sequence, b.sequence);
        }
        (Err(a), Err(b)) => assert_eq!(a.code, b.code),
        (a, b) => panic!("memo {:?} and plain {:?} disagree", a.is_ok(), b.is_ok()),
    }
}

#[test]
fn a_caller_that_holds_another_history_than_the_memo_gets_a_full_read() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, REF);
    extend(&p, &f, None, 1..=5);
    let memo = ReadMemo::new();
    let first = read_as(&p, &f, &reader(), None, Some(&memo)).unwrap();

    // A caller that lost its events cannot be told "nothing new": the cursor
    // alone is only coverage.
    let lost = ReadResult {
        sequence: Vec::<Envelope>::new(),
        ..read_as(&p, &f, &reader(), Some(&first), None).unwrap()
    };
    let answer = read_as(&p, &f, &reader(), Some(&lost), Some(&memo)).unwrap();
    assert!(!answer.memoized);
    assert_eq!(answer.sequence.len(), 5);
    assert!(matches!(answer.fold, Fold::RebuildRequired { .. }));

    // A different stream query is another question, never answered from the memo.
    let other = [StreamId::parse("project:porting").unwrap()];
    let mismatched = read_with_view(
        &p,
        &f.repo,
        ReadRequest {
            layout: &f.layout,
            origin: &reader(),
            machine: "test-aa",
            streams: &other,
            cursor: &first.cursor,
            folded: &first.sequence,
            project: true,
        },
        None,
        Some(Memoized {
            memo: &memo,
            legacy_held: None,
        }),
    )
    .unwrap();
    assert!(!mismatched.memoized);
}

#[test]
fn a_memo_answer_leaves_out_legacy_events_only_for_a_caller_that_holds_them() {
    let f = Fixture::new();
    let mut h = f.handle();
    let line = "{\"ts\":\"2026-01-01T00:00:00.000Z\",\"seq\":1,\"type\":\"work.add\"}\n";
    fenced_legacy(&f, &mut h, &[("events.jsonl", line.as_bytes().to_vec())]);
    let p = f.port(&mut h, REF);
    let memo = ReadMemo::new();
    let first = read_as(&p, &f, &reader(), None, Some(&memo)).unwrap();
    assert_eq!(first.legacy.len(), 1);
    let digest = first
        .cursor
        .legacy_digest
        .clone()
        .expect("legacy has a digest");

    let unaware = read_as(&p, &f, &reader(), Some(&first), Some(&memo)).unwrap();
    assert!(unaware.memoized);
    assert_eq!(
        unaware.legacy.len(),
        1,
        "a caller that names nothing is given the events"
    );

    let wrong = read_holding(
        &p,
        &f,
        &reader(),
        Some(&first),
        Some(&memo),
        Some("not-held"),
    )
    .unwrap();
    assert!(wrong.memoized);
    assert_eq!(
        wrong.legacy.len(),
        1,
        "another digest is not the caller's history"
    );

    let aware = read_holding(&p, &f, &reader(), Some(&first), Some(&memo), Some(&digest)).unwrap();
    assert!(aware.memoized);
    assert!(aware.legacy.is_empty(), "the caller keeps its own copy");
    assert_eq!(aware.cursor.legacy_digest.as_deref(), Some(digest.as_str()));

}
