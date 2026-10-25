#![cfg(target_os = "linux")]
mod reader_support;
use fgos_event_store::{
    checkpoint::Checkpoint,
    cursor::Cursor,
    envelope::Envelope,
    layout::StreamId,
    read::{read, read_checkpointed, ReadRequest, ReadResult},
};
use fgos_git::{Inspect, Oid, Publication, PublicationPort, RefName, RefValue};
use reader_support::*;
use std::{collections::BTreeSet, fs, path::PathBuf};

const REF: &str = "refs/fgos/events/test-aa";

fn request<'a>(
    f: &'a Fixture,
    origin: &'a str,
    streams: &'a [StreamId],
    cursor: &'a Cursor,
) -> ReadRequest<'a> {
    ReadRequest {
        layout: &f.layout,
        origin,
        machine: "test-aa",
        streams,
        cursor,
        folded: &[],
        project: true,
    }
}
fn checkpoint(f: &Fixture, reuse: bool) -> Checkpoint {
    Checkpoint {
        path: f.root.join("cache/event-history.json"),
        reuse,
    }
}
/// A fresh process: no retained cursor, only the checkpoint file.
fn fresh(
    port: &dyn Inspect,
    f: &Fixture,
    streams: &[StreamId],
    checkpoint: &Checkpoint,
) -> ReadResult {
    let empty = Cursor::default();
    read_checkpointed(
        port,
        &f.repo,
        request(f, &"d".repeat(32), streams, &empty),
        None,
        checkpoint,
        None,
    )
    .unwrap()
}
fn truth(port: &dyn Inspect, f: &Fixture, streams: &[StreamId]) -> Vec<Envelope> {
    let empty = Cursor::default();
    read(port, &f.repo, request(f, &"d".repeat(32), streams, &empty))
        .unwrap()
        .sequence
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
fn streams() -> [StreamId; 1] {
    [StreamId::parse("project").unwrap()]
}
fn file(c: &Checkpoint) -> PathBuf {
    c.path.clone()
}

#[test]
fn a_second_process_reads_only_the_sealed_commits_added_after_the_checkpoint() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, REF);
    let cp = checkpoint(&f, true);
    let tip = extend(&p, &f, None, 1..=40);

    let counting = CountingPort::new(&p);
    let first = fresh(&counting, &f, &streams(), &cp);
    assert_eq!(first.sequence.len(), 40);
    assert!(!first.checkpoint.continued && first.checkpoint.written);
    assert_eq!(
        counting.read_commits.get(),
        40,
        "no checkpoint: every commit"
    );

    let counting = CountingPort::new(&p);
    let unchanged = fresh(&counting, &f, &streams(), &cp);
    assert!(unchanged.checkpoint.continued && !unchanged.checkpoint.written);
    assert_eq!(counting.read_commits.get(), 0, "nothing new: nothing read");
    assert_eq!(unchanged.sequence, first.sequence);

    extend(&p, &f, Some(tip), 41..=42);
    let counting = CountingPort::new(&p);
    let next = fresh(&counting, &f, &streams(), &cp);
    assert!(next.checkpoint.continued && next.checkpoint.written);
    // The two new commits, and the certified commit they sit on, whose header
    // authenticates the chain they extend; nothing older.
    assert_eq!(counting.read_commits.get(), 3);
    assert_eq!(next.sequence.len(), 42);
    assert_eq!(next.sequence, truth(&p, &f, &streams()));
    // The caller's own empty cursor is answered in full, not against the file.
    assert_eq!(next.events, next.sequence);
    assert!(matches!(
        next.fold,
        fgos_event_store::cursor::Fold::RebuildRequired { .. }
    ));

    // A rebuild ignores the file, verifies from zero and replaces it.
    let counting = CountingPort::new(&p);
    let rebuilt = fresh(&counting, &f, &streams(), &checkpoint(&f, false));
    assert!(!rebuilt.checkpoint.continued && rebuilt.checkpoint.written);
    assert_eq!(counting.read_commits.get(), 42);
    assert_eq!(rebuilt.sequence, next.sequence);
}

#[test]
fn a_checkpoint_that_does_not_match_the_store_is_ignored_and_rewritten() {
    let ignored = |name: &str, spoil: &dyn Fn(&Fixture, &PublicationPort<'_>, &Checkpoint)| {
        let f = Fixture::new();
        let mut h = f.handle();
        let p = f.port(&mut h, REF);
        let cp = checkpoint(&f, true);
        extend(&p, &f, None, 1..=6);
        assert!(fresh(&p, &f, &streams(), &cp).checkpoint.written);
        spoil(&f, &p, &cp);
        let counting = CountingPort::new(&p);
        let got = fresh(&counting, &f, &streams(), &cp);
        assert!(!got.checkpoint.continued, "{name}: used a bad checkpoint");
        assert!(got.checkpoint.written, "{name}: not rewritten");
        assert_eq!(got.sequence, truth(&p, &f, &streams()), "{name}");
        // The rewritten file serves the next process.
        let counting = CountingPort::new(&p);
        let again = fresh(&counting, &f, &streams(), &cp);
        assert!(again.checkpoint.continued, "{name}: rewrite unusable");
        assert_eq!(counting.read_commits.get(), 0, "{name}");
        got.checkpoint
            .ignored
            .unwrap_or_else(|| panic!("{name}: no reason"))
    };
    let edit = |cp: &Checkpoint, change: &dyn Fn(&mut serde_json::Value)| {
        let mut value: serde_json::Value =
            serde_json::from_slice(&fs::read(file(cp)).unwrap()).unwrap();
        change(&mut value);
        fs::write(file(cp), serde_json::to_vec(&value).unwrap()).unwrap();
    };

    ignored("truncated file", &|_, _, cp| {
        let bytes = fs::read(file(cp)).unwrap();
        fs::write(file(cp), &bytes[..bytes.len() / 2]).unwrap();
    });
    ignored("another store", &|_, _, cp| {
        edit(cp, &|v| v["storeId"] = "e".repeat(32).into());
    });
    ignored("another version", &|_, _, cp| {
        edit(cp, &|v| v["v"] = 9.into())
    });
    ignored("coverage that its events do not carry", &|_, _, cp| {
        edit(cp, &|v| {
            let cover = v["cursor"]["cover"].as_object_mut().unwrap();
            for n in cover.values_mut() {
                *n = 99.into();
            }
        });
    });
    ignored("an event cut out of the middle", &|_, _, cp| {
        edit(cp, &|v| {
            v["events"].as_array_mut().unwrap().remove(2);
        });
    });
    let reason = ignored(
        "a ref that no longer descends from the certified commit",
        &|f, p, _| {
            // Replace the whole chain by another history under the same name.
            let RefValue::Direct(old) = p.read_ref(&f.repo, &RefName::parse(REF).unwrap()).unwrap()
            else {
                panic!("own ref is not direct")
            };
            let other = seal(p, &f.repo, vec![], &[event('a', 1, 1)], "test-aa");
            let mut next = other.clone();
            for seq in 2..=7 {
                next = seal(p, &f.repo, vec![next], &[event('a', seq, 2)], "test-aa");
            }
            publish(p, &f.repo, REF, Some(old), next, "replaced");
        },
    );
    assert!(reason.contains("descends"), "{reason}");
}

#[test]
fn a_folded_own_event_that_is_neither_published_nor_local_voids_the_checkpoint() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, REF);
    let cp = checkpoint(&f, true);
    let own = "a".repeat(32);
    let stream = &streams()[0];
    extend(&p, &f, None, 1..=2);
    let paths = f.layout.stream(stream);
    fs::create_dir_all(&paths.root).unwrap();
    fs::write(paths.sealed(), b"{\"lastSeq\":2}").unwrap();
    let unsealed = event('a', 3, 9);
    fs::write(paths.active(), batch(std::slice::from_ref(&unsealed))).unwrap();
    let empty = Cursor::default();
    let read_own = |reuse| {
        read_checkpointed(
            &p,
            &f.repo,
            request(&f, &own, &streams(), &empty),
            None,
            &Checkpoint {
                reuse,
                ..cp.clone()
            },
            None,
        )
        .unwrap()
    };
    let first = read_own(true);
    assert_eq!(first.sequence.len(), 3);
    assert!(first.checkpoint.written);
    // The active file is the only copy of seq 3; losing it must not be papered over.
    fs::remove_file(paths.active()).unwrap();
    // The file lists the unsealed event, but it is not in git and not local any more.
    let stale = read_own(true);
    assert!(!stale.checkpoint.continued);
    assert!(stale.checkpoint.ignored.unwrap().contains("own event"));
    assert_eq!(stale.sequence.len(), 2);
}

#[test]
fn concurrent_readers_never_leave_a_checkpoint_that_cannot_be_used() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, REF);
    let cp = checkpoint(&f, true);
    extend(&p, &f, None, 1..=12);
    drop(p);
    let streams = streams();
    std::thread::scope(|scope| {
        for _ in 0..6 {
            scope.spawn(|| {
                for _ in 0..4 {
                    // Each read rewrites the file (rebuild), racing the others.
                    let got = fresh(
                        &f.driver,
                        &f,
                        &streams,
                        &Checkpoint {
                            reuse: false,
                            ..cp.clone()
                        },
                    );
                    assert_eq!(got.sequence.len(), 12);
                    let got = fresh(&f.driver, &f, &streams, &cp);
                    assert_eq!(got.sequence.len(), 12);
                    assert!(got.checkpoint.ignored.is_none(), "{:?}", got.checkpoint);
                }
            });
        }
    });
    let leftovers: BTreeSet<_> = fs::read_dir(f.root.join("cache"))
        .unwrap()
        .map(|e| e.unwrap().file_name().to_string_lossy().into_owned())
        .collect();
    assert_eq!(leftovers, BTreeSet::from(["event-history.json".to_owned()]));
}

#[test]
fn a_read_that_defers_an_event_writes_no_checkpoint() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, "refs/fgos/events/test-bb");
    let a = event('a', 1, 2);
    let mut b = event('b', 1, 1);
    b.seen.insert(format!("{}:project", a.origin), 1);
    rehash(&mut b);
    let oid = seal(&p, &f.repo, vec![], std::slice::from_ref(&b), "test-bb");
    publish(&p, &f.repo, "refs/fgos/events/test-bb", None, oid, "b-ref");
    let cp = checkpoint(&f, true);
    let got = fresh(&p, &f, &streams(), &cp);
    assert_eq!(got.deferred.len(), 1);
    assert!(!got.checkpoint.written);
    assert!(!file(&cp).exists());
}

/// A peer mirror that was force-rewound after the checkpoint was written no
/// longer descends from the checkpoint's tip. The events the peer's earlier
/// tip authenticated stay in the answer (a sync keeps such a baseline, see
/// `rewound_mirror_keeps_authenticated_baseline_and_forged_own_origin_is_refused`)
/// and the mirror is named. It lives here because only the checkpointed read
/// falls back to a walk from zero, which would drop them; the retained-cursor
/// case is owned by `cursor_incremental.rs`. The mirror is planted, not
/// published: publishing through this fixture also writes and rewinds the
/// local `refs/fgos/events/test-bb`, and a ref outside `refs/fgos/remotes/`
/// stays fail-closed.
#[test]
fn a_rewound_peer_mirror_does_not_silently_drop_the_events_it_already_authenticated() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, REF);
    let cp = checkpoint(&f, true);
    let first = seal(&p, &f.repo, vec![], &[event('b', 1, 1)], "test-bb");
    let second = seal(
        &p,
        &f.repo,
        vec![first.clone()],
        &[event('b', 2, 2)],
        "test-bb",
    );
    plant_foreign_mirror(&f, "test-bb", &second);
    let before = fresh(&p, &f, &streams(), &cp);
    assert_eq!(before.sequence.len(), 2);
    assert!(before.checkpoint.written);

    plant_foreign_mirror(&f, "test-bb", &first);
    let after = fresh(&p, &f, &streams(), &cp);
    assert!(
        after
            .sequence
            .iter()
            .any(|e| e.origin == "b".repeat(32) && e.seq == 2),
        "the rewind dropped the peer's event 2 without a trace (checkpoint report: {:?})",
        after.checkpoint
    );
    assert!(after.checkpoint.continued, "{:?}", after.checkpoint);
    assert_eq!(
        after
            .skipped_mirrors
            .iter()
            .map(|m| (m.ref_name.as_str(), m.code.as_str()))
            .collect::<Vec<_>>(),
        [(
            "refs/fgos/remotes/origin/events/test-bb",
            "event-store-mirror-rewound"
        )]
    );
}
