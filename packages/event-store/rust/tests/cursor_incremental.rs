#![cfg(target_os = "linux")]
mod reader_support;
use fgos_event_store::{
    append::Positions,
    cursor::{Cursor, Fold},
    layout::StreamId,
    order::stream_key,
    read::{read, reconcile_durable_history, ReadRequest},
};
use reader_support::*;
use std::fs;
fn request<'a>(
    f: &'a Fixture,
    origin: &'a str,
    streams: &'a [StreamId],
    cursor: &'a Cursor,
    folded: &'a [fgos_event_store::envelope::Envelope],
) -> ReadRequest<'a> {
    ReadRequest {
        layout: &f.layout,
        origin,
        streams,
        cursor,
        folded,
        project: true,
    }
}
#[test]
fn c5_ref_deferral_advances_no_coverage_and_certifies_nothing_until_predecessor_arrives() {
    let f = Fixture::new();
    let mut h = f.handle();
    let streams = [StreamId::parse("project").unwrap()];
    let own = "d".repeat(32);
    let a = event('a', 1, 2);
    let mut b = event('b', 1, 1);
    b.seen.insert(stream_key(&a), 1);
    rehash(&mut b);
    {
        let p = f.port(&mut h, "refs/fgos/events/test-bb");
        let oid = seal(&p, &f.repo, vec![], std::slice::from_ref(&b), "test-bb");
        publish(&p, &f.repo, "refs/fgos/events/test-bb", None, oid, "b-ref");
    }
    let first = {
        let p = f.port(&mut h, "refs/fgos/events/test-aa");
        read(
            &p,
            &f.repo,
            request(&f, &own, &streams, &Cursor::default(), &[]),
        )
        .unwrap()
    };
    assert_eq!(first.deferred.len(), 1);
    assert!(first.cursor.cover.is_empty());
    assert!(first.cursor.certified.is_empty());
    let p = f.port(&mut h, "refs/fgos/events/test-aa");
    let oid = seal(&p, &f.repo, vec![], std::slice::from_ref(&a), "test-aa");
    publish(&p, &f.repo, "refs/fgos/events/test-aa", None, oid, "a-ref");
    let next = read(&p, &f.repo, request(&f, &own, &streams, &first.cursor, &[])).unwrap();
    assert_eq!(next.sequence, vec![a, b]);
    assert!(next.deferred.is_empty());
    assert_eq!(next.cursor.certified.len(), 2);
    assert!(matches!(next.fold, Fold::RebuildRequired { .. }));
    let again = read(
        &p,
        &f.repo,
        request(&f, &own, &streams, &next.cursor, &next.sequence),
    )
    .unwrap();
    assert!(again.events.is_empty());
}
#[test]
fn c6_new_origin_discovered_on_mirror_replays_from_first_difference() {
    let f = Fixture::new();
    let mut h = f.handle();
    let streams = [StreamId::parse("project").unwrap()];
    let own = "a".repeat(32);
    let x = event('a', 1, 2);
    let y = event('b', 1, 1);
    let first = {
        let p = f.port(&mut h, "refs/fgos/events/test-aa");
        let oid = seal(&p, &f.repo, vec![], std::slice::from_ref(&x), "test-aa");
        publish(&p, &f.repo, "refs/fgos/events/test-aa", None, oid, "x");
        read(
            &p,
            &f.repo,
            request(&f, &own, &streams, &Cursor::default(), &[]),
        )
        .unwrap()
    };
    let paths = f.layout.stream(&streams[0]);
    fs::create_dir_all(&paths.root).unwrap();
    fs::write(paths.sealed(), b"{\"lastSeq\":1}").unwrap();
    let p = f.port(&mut h, "refs/fgos/remotes/origin/events/test-bb");
    let oid = seal(&p, &f.repo, vec![], std::slice::from_ref(&y), "test-bb");
    publish(
        &p,
        &f.repo,
        "refs/fgos/remotes/origin/events/test-bb",
        None,
        oid,
        "y",
    );
    let next = read(
        &p,
        &f.repo,
        request(&f, &own, &streams, &first.cursor, &first.sequence),
    )
    .unwrap();
    assert_eq!(
        next.fold,
        Fold::RebuildRequired {
            first_difference: 0
        }
    );
    assert_eq!(next.sequence, vec![y, x]);
    let rebuild = read(
        &p,
        &f.repo,
        request(&f, &own, &streams, &Cursor::default(), &[]),
    )
    .unwrap();
    assert_eq!(next.sequence, rebuild.sequence);
}
#[test]
fn local_seal_restart_and_proven_incremental_fold_equal_full_rebuild() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, "refs/fgos/events/test-aa");
    tracked_head(
        &f,
        &p,
        b"events.jsonl",
        b"{\"ts\":\"2026-01-01T00:00:00.000Z\",\"seq\":1}\n",
    );
    let e = event('a', 1, 2);
    let own = e.origin.clone();
    let streams = [StreamId::parse("project").unwrap()];
    let paths = f.layout.stream(&streams[0]);
    fs::create_dir_all(&paths.root).unwrap();
    fs::write(paths.active(), batch(std::slice::from_ref(&e))).unwrap();
    let first = read(
        &p,
        &f.repo,
        request(&f, &own, &streams, &Cursor::default(), &[]),
    )
    .unwrap();
    assert_eq!(first.sequence, vec![e.clone()]);
    let oid = seal(&p, &f.repo, vec![], std::slice::from_ref(&e), "test-aa");
    publish(
        &p,
        &f.repo,
        "refs/fgos/events/test-aa",
        None,
        oid,
        "seal-first",
    );
    fs::remove_file(paths.active()).unwrap();
    let mut second = event('a', 2, 0);
    second.seen = Positions::new();
    rehash(&mut second);
    fs::write(paths.active(), batch(std::slice::from_ref(&second))).unwrap();
    let next = read(
        &p,
        &f.repo,
        request(&f, &own, &streams, &first.cursor, &first.sequence),
    )
    .unwrap();
    assert_eq!(next.fold, Fold::Incremental);
    assert_eq!(next.events, vec![second]);
    assert_eq!(
        next.sequence,
        read(
            &p,
            &f.repo,
            request(&f, &own, &streams, &Cursor::default(), &[])
        )
        .unwrap()
        .sequence
    );
}
#[test]
fn l5_lost_receipt_and_hint_cannot_restart_published_sequence() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, "refs/fgos/events/test-aa");
    let e = event('a', 1, 1);
    let stream = StreamId::parse("project").unwrap();
    let paths = f.layout.stream(&stream);
    fs::create_dir_all(paths.closed()).unwrap();
    let oid = seal(&p, &f.repo, vec![], std::slice::from_ref(&e), "test-aa");
    publish(
        &p,
        &f.repo,
        "refs/fgos/events/test-aa",
        None,
        oid,
        "published",
    );
    fs::write(paths.sealed(), b"{\"lastSeq\":1}").unwrap();
    fs::write(paths.hwm(), b"{\"lastSeq\":1}").unwrap();
    fs::remove_file(paths.sealed()).unwrap();
    fs::remove_file(paths.hwm()).unwrap();
    let different = event('a', 1, 2);
    fs::write(paths.active(), batch(&[different])).unwrap();
    let name = fgos_git::RefName::parse("refs/fgos/events/test-aa").unwrap();
    assert_eq!(
        reconcile_durable_history(&p, &f.repo, &f.layout, &e.origin, &stream, &name)
            .unwrap_err()
            .code
            .as_str(),
        "event-store-seq-recovery-conflict"
    );
    assert!(!paths.sealed().exists());
    assert!(!paths.hwm().exists());
    fs::remove_file(paths.active()).unwrap();
    assert_eq!(
        reconcile_durable_history(&p, &f.repo, &f.layout, &e.origin, &stream, &name).unwrap(),
        1
    );
}
#[test]
fn fetched_tip_machine_scope_and_own_origin_are_checked() {
    for case in ["machine", "scope", "own"] {
        let f = Fixture::new();
        let mut h = f.handle();
        let p = f.port(&mut h, "refs/fgos/remotes/origin/events/test-aa");
        let mut e = event('a', 1, 1);
        if case == "scope" {
            e.scope = fgos_event_store::envelope::Scope::Branch;
            e.stream = "branch:feature".into();
            rehash(&mut e);
        }
        let oid = seal(
            &p,
            &f.repo,
            vec![],
            &[e],
            if case == "machine" {
                "wrong-machine"
            } else {
                "test-aa"
            },
        );
        publish(
            &p,
            &f.repo,
            "refs/fgos/remotes/origin/events/test-aa",
            None,
            oid,
            "bad-ref",
        );
        if case == "own" {
            use fgos_git::{ExpectedTip, Publication, RefName};
            let name = RefName::parse("refs/fgos/events/test-aa").unwrap();
            let old = p.read_ref(&f.repo, &name).unwrap();
            if let fgos_git::RefValue::Direct(oid) = old {
                let unrelated = seal(&p, &f.repo, vec![], &[event('b', 1, 1)], "test-aa");
                p.compare_and_swap(
                    &f.repo,
                    &name,
                    &ExpectedTip::Oid(oid),
                    &ExpectedTip::Oid(unrelated),
                    "replace-own",
                )
                .unwrap();
            }
        }
        let own = if case == "own" {
            "a".repeat(32)
        } else {
            "b".repeat(32)
        };
        let error = read(
            &p,
            &f.repo,
            request(
                &f,
                &own,
                &[StreamId::parse("project").unwrap()],
                &Cursor::default(),
                &[],
            ),
        )
        .unwrap_err();
        assert_eq!(
            error.code.as_str(),
            "event-store-ref-tampered",
            "{case}: {error}"
        );
    }
}
#[test]
fn durable_history_reconciliation_restores_receipt_and_next_append_uses_next_sequence() {
    let f = Fixture::new();
    let stream = StreamId::parse("project").unwrap();
    let mut registry = fgos_event_store::registry::Registry::default();
    registry.register(serde_json::from_value(serde_json::json!({"v":1,"types":[{"type":"work.add","domain":"work","scope":"project","schemaVersion":1,"sealOnWrite":false}]})).unwrap()).unwrap();
    let input = [fgos_event_store::append::EventInput {
        event_type: "work.add".into(),
        schema_version: 1,
        payload: serde_json::json!({}),
        ts: "2026-01-01T00:00:01.000Z".into(),
    }];
    let append = || {
        fgos_event_store::append::append(
            &f.layout,
            &registry,
            fgos_event_store::append::AppendRequest {
                stream: &stream,
                events: &input,
                cursor: &Positions::new(),
                writer: "writer",
                machine: "test-aa",
                held_ranks: &[],
            },
        )
    };
    let first = append().unwrap();
    let paths = f.layout.stream(&stream);
    let mut h = f.handle();
    let p = f.port(&mut h, "refs/fgos/events/test-aa");
    let oid = seal(&p, &f.repo, vec![], &first.events, "test-aa");
    publish(
        &p,
        &f.repo,
        "refs/fgos/events/test-aa",
        None,
        oid,
        "recover-ref",
    );
    fs::remove_file(paths.active()).unwrap();
    fs::remove_file(paths.hwm()).unwrap();
    reconcile_durable_history(
        &p,
        &f.repo,
        &f.layout,
        &first.ack.origin,
        &stream,
        &fgos_git::RefName::parse("refs/fgos/events/test-aa").unwrap(),
    )
    .unwrap();
    assert_eq!(append().unwrap().ack.first_seq, 2);
}
#[test]
fn fetched_event_identity_must_match_seal_header() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, "refs/fgos/events/test-aa");
    let e = event('b', 1, 1);
    let bytes = batch(&[e]);
    let seal = fgos_event_store::envelope::Seal::Seal {
        v: 1,
        machine_id: "test-aa".into(),
        origin: "a".repeat(32),
        stream: "project".into(),
        scope: fgos_event_store::envelope::Scope::Project,
        first_seq: 1,
        last_seq: 1,
        count: 1,
        sha256: fgos_event_store::envelope::sha256(&bytes),
    };
    let oid = commit(
        &p,
        &f.repo,
        vec![],
        vec![
            (b"seal.json", seal.canonical_line().unwrap()),
            (b"events.jsonl", bytes),
        ],
    );
    publish(
        &p,
        &f.repo,
        "refs/fgos/events/test-aa",
        None,
        oid,
        "identity",
    );
    let cursor = Cursor::default();
    let copy = cursor.clone();
    assert_eq!(
        read(
            &p,
            &f.repo,
            request(
                &f,
                &"d".repeat(32),
                &[StreamId::parse("project").unwrap()],
                &cursor,
                &[]
            )
        )
        .unwrap_err()
        .code
        .as_str(),
        "event-store-ref-tampered"
    );
    assert_eq!(cursor, copy);
}
#[test]
fn a_ref_hole_is_not_silently_skipped_and_input_cursor_stays_unchanged() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, "refs/fgos/events/test-aa");
    let oid = seal(&p, &f.repo, vec![], &[event('a', 2, 1)], "test-aa");
    publish(&p, &f.repo, "refs/fgos/events/test-aa", None, oid, "gap");
    let c = Cursor::default();
    assert_eq!(
        read(
            &p,
            &f.repo,
            request(
                &f,
                &"d".repeat(32),
                &[StreamId::parse("project").unwrap()],
                &c,
                &[]
            )
        )
        .unwrap_err()
        .code
        .as_str(),
        "event-store-gap"
    );
    assert_eq!(c, Cursor::default());
}
/// A long-lived reader holding its cursor sees a mirror rewind. A peer's
/// mirror keeps the tip the cursor authenticated: the read answers with the
/// same history, names the mirror, and the next read from that answer does the
/// same. The own machine's mirror (published through this fixture, which also
/// writes the own ref) refuses and leaves the caller's cursor unchanged.
#[test]
fn a_rewound_mirror_keeps_the_peer_baseline_and_refuses_for_the_own_machine() {
    for own_machine in [false, true] {
        let f = Fixture::new();
        let mut h = f.handle();
        let streams = [StreamId::parse("project").unwrap()];
        let own = "d".repeat(32);
        let name = "refs/fgos/remotes/origin/events/test-bb";
        let p = f.port(&mut h, name);
        let a = seal(&p, &f.repo, vec![], &[event('b', 1, 1)], "test-bb");
        let b = seal(&p, &f.repo, vec![a.clone()], &[event('b', 2, 2)], "test-bb");
        if own_machine {
            publish(&p, &f.repo, name, None, b.clone(), "advance");
        } else {
            plant_foreign_mirror(&f, "test-bb", &b);
        }
        let first = read(
            &p,
            &f.repo,
            request(&f, &own, &streams, &Cursor::default(), &[]),
        )
        .unwrap();
        let saved = first.cursor.canonical_bytes().unwrap();
        if own_machine {
            publish(&p, &f.repo, name, Some(b), a, "rewind");
            let error = read(
                &p,
                &f.repo,
                request(&f, &own, &streams, &first.cursor, &first.sequence),
            )
            .unwrap_err();
            assert_eq!(error.code.as_str(), "event-store-mirror-rewound");
            assert_eq!(first.cursor.canonical_bytes().unwrap(), saved);
            continue;
        }
        plant_foreign_mirror(&f, "test-bb", &a);
        let mut cursor = first.cursor.clone();
        let mut folded = first.sequence.clone();
        for _ in 0..2 {
            let next = read(&p, &f.repo, request(&f, &own, &streams, &cursor, &folded)).unwrap();
            assert_eq!(
                next.sequence, first.sequence,
                "the authenticated history stays"
            );
            assert_eq!(
                next.skipped_mirrors
                    .iter()
                    .map(|m| (m.ref_name.as_str(), m.code.as_str()))
                    .collect::<Vec<_>>(),
                [(name, "event-store-mirror-rewound")]
            );
            assert_eq!(next.cursor.mirror_tips, first.cursor.mirror_tips);
            cursor = next.cursor;
            folded = next.sequence;
        }
    }
}

#[test]
fn lost_folded_history_with_coverage_requires_rebuild_from_zero() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, "refs/fgos/events/test-aa");
    let e = event('a', 1, 2);
    let streams = [StreamId::parse("project").unwrap()];
    let oid = seal(&p, &f.repo, vec![], std::slice::from_ref(&e), "test-aa");
    publish(&p, &f.repo, "refs/fgos/events/test-aa", None, oid, "first");
    let first = read(
        &p,
        &f.repo,
        request(&f, &e.origin, &streams, &Cursor::default(), &[]),
    )
    .unwrap();
    assert_eq!(first.sequence, vec![e.clone()]);
    assert!(!first.cursor.cover.is_empty());
    assert!(!first.cursor.certified.is_empty());
    let recovered = read(
        &p,
        &f.repo,
        request(&f, &e.origin, &streams, &first.cursor, &[]),
    )
    .unwrap();
    assert_eq!(
        recovered.fold,
        Fold::RebuildRequired {
            first_difference: 0
        }
    );
    // Delta is still relative to coverage; recovery must refold sequence.
    assert!(recovered.events.is_empty());
    assert_eq!(recovered.sequence, vec![e.clone()]);
    let full = read(
        &p,
        &f.repo,
        request(&f, &e.origin, &streams, &Cursor::default(), &[]),
    )
    .unwrap();
    assert_eq!(recovered.sequence, full.sequence);
    assert_eq!(recovered.full_order, full.full_order);
    assert_eq!(recovered.cursor, full.cursor);
}

#[test]
fn retained_folded_history_with_coverage_keeps_empty_delta_incremental() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, "refs/fgos/events/test-aa");
    let e = event('a', 1, 2);
    let streams = [StreamId::parse("project").unwrap()];
    let oid = seal(&p, &f.repo, vec![], std::slice::from_ref(&e), "test-aa");
    publish(&p, &f.repo, "refs/fgos/events/test-aa", None, oid, "first");
    let first = read(
        &p,
        &f.repo,
        request(&f, &e.origin, &streams, &Cursor::default(), &[]),
    )
    .unwrap();
    let next = read(
        &p,
        &f.repo,
        request(&f, &e.origin, &streams, &first.cursor, &first.sequence),
    )
    .unwrap();
    assert_eq!(next.fold, Fold::Incremental);
    assert!(next.events.is_empty());
    assert_eq!(next.sequence, vec![e]);
    assert_eq!(next.sequence, first.sequence);
}
