mod common;
use common::{batch, inputs, Repo};
use fgos_event_store::{
    append::{append_with_fs, AppendRequest, Positions},
    fsio::{FileSystem, OsFileSystem, Point},
    identity::StoreIdentity,
    locks::acquire_append,
    open_read::{read_in_gate, read_own},
    rotate::rotate,
};
use serde_json::json;
use std::{fs, io};
fn hint(path: &std::path::Path, seq: u64) {
    fs::write(path, serde_json::to_vec(&json!({"lastSeq":seq})).unwrap()).unwrap();
}
fn code(e: fgos_event_store::errors::Error, want: &str) {
    assert_eq!(e.code.as_str(), want, "{e}");
}
#[test]
fn append_ack_hashes_seen_and_cursor_are_verified() {
    let r = Repo::new();
    let a = r.append(3);
    assert_eq!((a.ack.first_seq, a.ack.last_seq), (1, 3));
    assert_eq!(a.ack.h.len(), 3);
    assert!(a.guarantee.usable());
    let own = format!("{}:project", a.ack.origin);
    let foreign = format!("{}:project", "a".repeat(32));
    let cursor = Positions::from([(own.clone(), 3), (foreign.clone(), 4)]);
    let b = r.append_cursor(2, &cursor).unwrap();
    assert_eq!((b.ack.first_seq, b.ack.last_seq), (4, 5));
    assert_eq!(b.events[0].seen, Positions::from([(foreign, 4)]));
    code(r.append_cursor(1, &cursor).unwrap_err(), "stale-cursor");
    let got = read_in_gate(&r.layout, &a.ack.origin, &r.stream, 3).unwrap();
    assert_eq!(got.events.len(), 2);
    assert_eq!(
        read_own(&r.layout, &a.ack.origin, &r.stream)
            .unwrap()
            .events
            .len(),
        5
    );
}
#[test]
fn append_returns_each_event_as_it_is_stored_whatever_the_payload_key_order() {
    // This test binary is built with serde_json's preserve_order (unified from a dev-dependency), as the
    // native addon is, so a payload map keeps the caller's key order unless append hands back the stored line.
    // Without preserve_order every map is sorted and the asserts below pass with or without the fix.
    assert_eq!(
        serde_json::to_string(&json!({"z":1,"a":2})).unwrap(),
        r#"{"z":1,"a":2}"#,
        "this test needs serde_json's preserve_order"
    );
    let r = Repo::new();
    let events = [fgos_event_store::append::EventInput {
        event_type: "work.add".into(),
        schema_version: 1,
        payload: json!({"title":"t","id":"a","kind":{"z":1,"b":2}}),
        ts: "2026-10-18T05:00:00.000Z".into(),
    }];
    let a = fgos_event_store::append::append(
        &r.layout,
        &r.registry,
        AppendRequest {
            stream: &r.stream,
            events: &events,
            cursor: &Positions::new(),
            writer: "writer-one",
            machine: "test-aa2345",
            held_ranks: &[60],
        },
    )
    .unwrap();
    let stored = read_own(&r.layout, &a.ack.origin, &r.stream)
        .unwrap()
        .events;
    assert_eq!(
        serde_json::to_string(&a.events).unwrap(),
        serde_json::to_string(&stored).unwrap()
    );
    assert!(serde_json::to_string(&a.events[0].payload)
        .unwrap()
        .starts_with(r#"{"id":"a","kind":{"b":2,"z":1}"#));
}
#[test]
fn high_water_recovers_receipt_closed_active_and_stale_hint() {
    let r = Repo::new();
    let a = r.append(1);
    let p = r.layout.stream(&r.stream);
    hint(&p.sealed(), 2);
    hint(&p.hwm(), 1);
    fs::write(p.segment(3, 4).unwrap(), batch(&a.ack.origin, 3, 2)).unwrap();
    fs::write(p.active(), batch(&a.ack.origin, 5, 1)).unwrap();
    let b = r.append(1);
    assert_eq!(b.ack.first_seq, 6);
    assert_eq!(
        serde_json::from_slice::<serde_json::Value>(&fs::read(p.hwm()).unwrap()).unwrap()
            ["lastSeq"],
        4
    );
    // Already receipted closed segments can remain until publication cleans up.
    fs::write(p.segment(1, 2).unwrap(), batch(&a.ack.origin, 1, 2)).unwrap();
    assert_eq!(r.append(1).ack.first_seq, 7);
}
#[test]
fn receipt_alone_prevents_sequence_reuse_after_segment_deletion() {
    let r = Repo::new();
    let a = r.append(2);
    let p = r.layout.stream(&r.stream);
    fs::remove_file(p.active()).unwrap();
    hint(&p.sealed(), 2);
    fs::remove_file(p.hwm()).unwrap();
    assert_eq!(r.append(1).ack.first_seq, 3);
    code(
        read_in_gate(&r.layout, &a.ack.origin, &r.stream, 0).unwrap_err(),
        "catch-up-required",
    );
    assert_eq!(
        read_in_gate(&r.layout, &a.ack.origin, &r.stream, 2)
            .unwrap()
            .events[0]
            .seq,
        3
    );
}
#[test]
fn gaps_overlaps_and_unbacked_hints_refuse_without_assigning() {
    for case in [
        "closed-gap",
        "closed-overlap",
        "receipt-overlap",
        "active-gap",
        "active-overlap",
        "active-batch-gap",
        "hint",
    ] {
        let r = Repo::new();
        let a = r.append(2);
        let p = r.layout.stream(&r.stream);
        fs::remove_file(p.active()).unwrap();
        hint(&p.sealed(), 2);
        hint(&p.hwm(), 0);
        match case {
            "closed-gap" => {
                fs::write(p.segment(4, 4).unwrap(), batch(&a.ack.origin, 4, 1)).unwrap()
            }
            "closed-overlap" => {
                fs::write(p.segment(3, 4).unwrap(), batch(&a.ack.origin, 3, 2)).unwrap();
                fs::write(p.segment(4, 5).unwrap(), batch(&a.ack.origin, 4, 2)).unwrap();
            }
            "receipt-overlap" => {
                fs::write(p.segment(2, 3).unwrap(), batch(&a.ack.origin, 2, 2)).unwrap()
            }
            "active-gap" => fs::write(p.active(), batch(&a.ack.origin, 4, 1)).unwrap(),
            "active-overlap" => fs::write(p.active(), batch(&a.ack.origin, 2, 1)).unwrap(),
            "active-batch-gap" => {
                let mut bytes = batch(&a.ack.origin, 3, 1);
                bytes.extend(batch(&a.ack.origin, 5, 1));
                fs::write(p.active(), bytes).unwrap();
            }
            "hint" => hint(&p.hwm(), 3),
            _ => unreachable!(),
        }
        let before = fs::read(p.active()).ok();
        code(
            r.append_cursor(1, &Positions::new()).unwrap_err(),
            "event-store-seq-recovery-conflict",
        );
        assert_eq!(fs::read(p.active()).ok(), before, "{case}: no new events");
    }
}
#[test]
fn corrupt_immutable_segments_refuse_and_are_never_truncated() {
    for case in ["checksum", "name", "partial", "identity"] {
        let r = Repo::new();
        let a = r.append(2);
        let p = r.layout.stream(&r.stream);
        fs::remove_file(p.active()).unwrap();
        let mut bytes = batch(&a.ack.origin, 1, 2);
        let target = if case == "name" {
            p.segment(1, 3).unwrap()
        } else {
            p.segment(1, 2).unwrap()
        };
        if case == "checksum" {
            let pos = bytes.iter().position(|b| *b == b'2').unwrap();
            bytes[pos] = b'3';
        }
        if case == "partial" {
            bytes.pop();
        }
        if case == "identity" {
            bytes = batch(&"f".repeat(32), 1, 2);
        }
        fs::write(&target, &bytes).unwrap();
        code(
            r.append_cursor(1, &Positions::new()).unwrap_err(),
            "event-store-integrity",
        );
        assert_eq!(fs::read(target).unwrap(), bytes);
    }
}
#[test]
fn rotation_has_no_sequence_reset_and_syncs_both_directories() {
    struct Trace(std::cell::RefCell<Vec<Point>>);
    impl FileSystem for Trace {
        fn checkpoint(&self, p: Point) -> io::Result<()> {
            self.0.borrow_mut().push(p);
            Ok(())
        }
    }
    let r = Repo::new();
    let a = r.append(3);
    let trace = Trace(Default::default());
    let rotated =
        fgos_event_store::rotate::rotate_with_fs(&r.layout, "test-aa2345", &r.stream, &[], &trace)
            .unwrap();
    assert_eq!(rotated.last_seq, 3);
    assert!(rotated.segment.unwrap().exists());
    let points = trace.0.borrow();
    let at = |p| points.iter().rposition(|x| *x == p).unwrap();
    assert!(at(Point::AfterRotationFsync) < at(Point::AfterRotationRename));
    assert!(at(Point::AfterRotationRename) < at(Point::AfterClosedDirFsync));
    assert!(at(Point::AfterClosedDirFsync) < at(Point::AfterStreamDirFsync));
    assert!(at(Point::AfterStreamDirFsync) < at(Point::BeforeHwm));
    assert_eq!(r.append(2).ack.first_seq, 4);
    assert_eq!(
        read_in_gate(&r.layout, &a.ack.origin, &r.stream, 0)
            .unwrap()
            .events
            .len(),
        5
    );
    rotate(&r.layout, "test-aa2345", &r.stream, &[]).unwrap();
    assert_eq!(r.append(1).ack.first_seq, 6);
}
#[test]
fn read_dedupes_a_rotation_snapshot_and_detects_conflicting_identity() {
    let r = Repo::new();
    let a = r.append(2);
    let p = r.layout.stream(&r.stream);
    let bytes = fs::read(p.active()).unwrap();
    fs::write(p.segment(1, 2).unwrap(), bytes).unwrap();
    assert_eq!(
        read_own(&r.layout, &a.ack.origin, &r.stream)
            .unwrap()
            .events
            .len(),
        2
    );
    let mut other = batch(&a.ack.origin, 1, 2);
    // Produce a valid alternate hash, not an invalid record.
    let mut events = fgos_event_store::open_read::decode(&other, &a.ack.origin, &r.stream, true)
        .unwrap()
        .events;
    events[0].payload = json!({"different":true});
    events[0].h = events[0].compute_hash().unwrap();
    other.clear();
    for e in &events {
        other.extend(e.canonical_line().unwrap());
    }
    let marker = fgos_event_store::envelope::BatchCommit {
        v: 4,
        kind: "batch-commit".into(),
        origin: a.ack.origin.clone(),
        stream: "project".into(),
        first_seq: 1,
        last_seq: 2,
        count: 2,
        sha256: fgos_event_store::envelope::sha256(&other),
    };
    other.extend(marker.canonical_line().unwrap());
    fs::write(p.segment(1, 2).unwrap(), other).unwrap();
    code(
        read_own(&r.layout, &a.ack.origin, &r.stream).unwrap_err(),
        "event-store-seq-conflict",
    );
}
#[test]
fn gate_refuses_missing_prefix_and_a_receipted_deleted_tail() {
    let r = Repo::new();
    let a = r.append(4);
    let p = r.layout.stream(&r.stream);
    fs::write(p.active(), batch(&a.ack.origin, 3, 2)).unwrap();
    hint(&p.sealed(), 2);
    code(
        read_in_gate(&r.layout, &a.ack.origin, &r.stream, 0).unwrap_err(),
        "catch-up-required",
    );
    assert_eq!(
        read_in_gate(&r.layout, &a.ack.origin, &r.stream, 2)
            .unwrap()
            .events
            .len(),
        2
    );
    fs::remove_file(p.active()).unwrap();
    hint(&p.sealed(), 4);
    code(
        read_in_gate(&r.layout, &a.ack.origin, &r.stream, 2).unwrap_err(),
        "catch-up-required",
    );
    assert!(read_in_gate(&r.layout, &a.ack.origin, &r.stream, 4)
        .unwrap()
        .events
        .is_empty());
}
#[test]
fn validation_precedes_lock_and_initialization() {
    let r = Repo::new();
    fs::remove_dir(r.layout.root.join("locks")).unwrap();
    let mut input = inputs(1);
    input[0].event_type = "work.unknown".into();
    let err = append_with_fs(
        &r.layout,
        &r.registry,
        AppendRequest {
            stream: &r.stream,
            events: &input,
            cursor: &Positions::new(),
            writer: "writer",
            machine: "test-aa2345",
            held_ranks: &[],
        },
        &OsFileSystem,
    )
    .unwrap_err();
    code(err, "event-store-unregistered-type");
    assert!(!r.layout.store().exists());
}
#[test]
fn missing_wide_and_symlink_lock_dirs_refuse() {
    use std::os::unix::fs::{symlink, PermissionsExt};
    let r = Repo::new();
    let dir = r.layout.root.join("locks");
    fs::set_permissions(&dir, fs::Permissions::from_mode(0o755)).unwrap();
    code(
        r.append_cursor(1, &Positions::new()).unwrap_err(),
        "event-store-lock-dir-invalid",
    );
    fs::remove_dir(&dir).unwrap();
    let missing = r.append_cursor(1, &Positions::new()).unwrap_err();
    assert!(
        missing
            .detail
            .ends_with("locks must be an existing 0700 directory; run fgos setup"),
        "the refusal names the directory and the next step: {missing}"
    );
    code(missing, "event-store-lock-dir-invalid");
    let other = r.root.join("other");
    fs::create_dir(&other).unwrap();
    fs::set_permissions(&other, fs::Permissions::from_mode(0o700)).unwrap();
    symlink(other, dir).unwrap();
    code(
        r.append_cursor(1, &Positions::new()).unwrap_err(),
        "event-store-lock-dir-invalid",
    );
}
#[test]
fn guarantee_none_refuses_and_rank_order_is_enforced() {
    struct Network;
    impl FileSystem for Network {
        fn guarantee(&self, path: &std::path::Path) -> fgos_holder_lock::Guarantee {
            let mut g = fgos_holder_lock::guarantee(path);
            g.exclusion = fgos_holder_lock::Level::None;
            g
        }
    }
    let r = Repo::new();
    let err = acquire_append(&r.layout, &[], &Network).err().unwrap();
    code(err, "event-store-unsupported-filesystem");
    for held in [&[70][..], &[80][..]] {
        code(
            acquire_append(&r.layout, held, &OsFileSystem)
                .err()
                .unwrap(),
            "lock-order-violation",
        );
    }
    let guard = acquire_append(&r.layout, &[58, 60], &OsFileSystem).unwrap();
    assert!(guard.guarantee.usable());
    drop(guard);
}
#[test]
fn real_guarantee_on_os_temp_and_tmpfs() {
    let r = Repo::new();
    assert!(fgos_holder_lock::guarantee(&r.layout.root.join("locks")).usable());
    // /var/tmp is ext4 on the validation host, /dev/shm is tmpfs. The
    // guarantee port is a read-only filesystem query; do not assume either
    // directory is writable inside a confined worker.
    for name in ["/var/tmp", "/dev/shm"] {
        let path = std::path::Path::new(name);
        if path.is_dir() {
            assert!(fgos_holder_lock::guarantee(path).usable());
        }
    }
}
#[test]
fn append_sweeps_old_and_shared_identity_temps_under_the_lock() {
    let r = Repo::new();
    let stale = r.layout.root.join(format!("store.{}.tmp", "a".repeat(32)));
    fs::write(&stale, b"partial").unwrap();
    let shared = r.layout.root.join(".durable-file-123-45.tmp");
    fs::write(&shared, b"partial").unwrap();
    let unrelated = r.layout.root.join(".durable-file-not-ours.tmp");
    fs::write(&unrelated, b"keep").unwrap();
    r.append(1);
    assert!(!stale.exists());
    assert!(!shared.exists());
    assert!(unrelated.exists());
    StoreIdentity::open(&r.layout, "test-aa2345").unwrap();
}

#[test]
fn reader_keeps_one_active_descriptor_and_dedupes_rotation_at_each_boundary() {
    use fgos_event_store::open_read::read_own_with_fs;
    struct Move<'a> {
        repo: &'a Repo,
        at: Point,
    }
    impl FileSystem for Move<'_> {
        fn checkpoint(&self, p: Point) -> io::Result<()> {
            if p == self.at {
                rotate(&self.repo.layout, "test-aa2345", &self.repo.stream, &[]).unwrap();
            }
            Ok(())
        }
    }
    for at in [Point::AfterActiveOpen, Point::AfterActiveRead] {
        let r = Repo::new();
        let a = r.append(3);
        let got =
            read_own_with_fs(&r.layout, &a.ack.origin, &r.stream, &Move { repo: &r, at }).unwrap();
        assert_eq!(got.events.len(), 3);
        assert!(got.vanished.is_empty());
        for (i, event) in got.events.iter().enumerate() {
            assert_eq!(event.seq, i as u64 + 1);
        }
    }
}
#[test]
fn vanished_closed_segment_is_recorded_and_gate_requires_catch_up() {
    use fgos_event_store::open_read::read_own_with_fs;
    struct Publish<'a>(&'a Repo);
    impl FileSystem for Publish<'_> {
        fn checkpoint(&self, p: Point) -> io::Result<()> {
            if p == Point::AfterClosedList {
                let paths = self.0.layout.stream(&self.0.stream);
                // Simulate the later publisher's receipt-before-delete contract
                // using actual files, without claiming to implement Git phase 04.
                hint(&paths.sealed(), 3);
                fs::remove_file(paths.segment(1, 3).unwrap())?;
            }
            Ok(())
        }
    }
    let r = Repo::new();
    let a = r.append(3);
    rotate(&r.layout, "test-aa2345", &r.stream, &[]).unwrap();
    let got = read_own_with_fs(&r.layout, &a.ack.origin, &r.stream, &Publish(&r)).unwrap();
    assert!(got.events.is_empty());
    assert_eq!(
        got.vanished,
        vec![(1, 3, r.layout.stream(&r.stream).segment(1, 3).unwrap())]
    );
    code(
        read_in_gate(&r.layout, &a.ack.origin, &r.stream, 0).unwrap_err(),
        "catch-up-required",
    );
}
#[test]
fn one_batch_write_contains_marker_and_a_short_write_never_acknowledges() {
    use std::io::Write;
    struct Short(std::cell::Cell<usize>);
    impl FileSystem for Short {
        fn write_batch(&self, f: &mut fs::File, bytes: &[u8]) -> io::Result<usize> {
            self.0.set(self.0.get() + 1);
            f.write_all(&bytes[..bytes.len() - 1])?;
            Ok(bytes.len() - 1)
        }
    }
    let r = Repo::new();
    let a = r.append(2);
    let short = Short(std::cell::Cell::new(0));
    let err = append_with_fs(
        &r.layout,
        &r.registry,
        AppendRequest {
            stream: &r.stream,
            events: &inputs(3),
            cursor: &Positions::new(),
            writer: "writer",
            machine: "test-aa2345",
            held_ranks: &[],
        },
        &short,
    )
    .unwrap_err();
    code(err, "event-store-io");
    assert_eq!(short.0.get(), 1);
    assert_eq!(
        read_own(&r.layout, &a.ack.origin, &r.stream)
            .unwrap()
            .events
            .len(),
        2
    );
    assert_eq!(r.append(1).ack.first_seq, 3);
}

#[test]
fn a_verifying_marker_with_internal_sequence_overlap_refuses_instead_of_truncating() {
    let r = Repo::new();
    let a = r.append(3);
    let p = r.layout.stream(&r.stream);
    let original = fs::read(p.active()).unwrap();
    let mut events = fgos_event_store::open_read::decode(&original, &a.ack.origin, &r.stream, true)
        .unwrap()
        .events;
    events[1].seq = 1;
    events[1].h = events[1].compute_hash().unwrap();
    let mut bytes = Vec::new();
    for e in &events {
        bytes.extend(e.canonical_line().unwrap());
    }
    let marker = fgos_event_store::envelope::BatchCommit {
        v: 4,
        kind: "batch-commit".into(),
        origin: a.ack.origin.clone(),
        stream: "project".into(),
        first_seq: 1,
        last_seq: 3,
        count: 3,
        sha256: fgos_event_store::envelope::sha256(&bytes),
    };
    bytes.extend(marker.canonical_line().unwrap());
    fs::write(p.active(), &bytes).unwrap();
    code(
        r.append_cursor(1, &Positions::new()).unwrap_err(),
        "event-store-seq-recovery-conflict",
    );
    assert_eq!(fs::read(p.active()).unwrap(), bytes);
}

#[test]
fn repeated_verified_reads_still_detect_changed_bytes_and_authority() {
    let r = Repo::new();
    let a = r.append(2);
    let p = r.layout.stream(&r.stream);
    let original = fs::read(p.active()).unwrap();
    for _ in 0..2 {
        assert_eq!(
            read_in_gate(&r.layout, &a.ack.origin, &r.stream, 0)
                .unwrap()
                .events
                .len(),
            2
        );
    }
    let mut changed = original.clone();
    let position = changed.windows(8).position(|b| b == b"work.add").unwrap();
    changed[position] = b'X';
    fs::write(p.active(), &changed).unwrap();
    code(
        read_in_gate(&r.layout, &a.ack.origin, &r.stream, 0).unwrap_err(),
        "event-store-integrity",
    );
    fs::write(p.active(), &original).unwrap();
    assert!(
        fgos_event_store::open_read::decode(&original, &"f".repeat(32), &r.stream, false).is_err()
    );
    // A speculative suffix accepted for an active file is never accepted as
    // an immutable segment merely because its bytes were previously verified.
    let torn = [original.as_slice(), b"{"].concat();
    assert!(fgos_event_store::open_read::decode(&torn, &a.ack.origin, &r.stream, false).is_ok());
    assert!(fgos_event_store::open_read::decode(&torn, &a.ack.origin, &r.stream, true).is_err());
    assert_eq!(r.append(1).ack.first_seq, 3);
}
