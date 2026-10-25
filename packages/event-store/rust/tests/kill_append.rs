#![cfg(target_os = "linux")]
mod common;
use common::{batch, Repo};
use fgos_event_store::{append::Positions, open_read::read_own, rotate::rotate};
use std::os::unix::process::ExitStatusExt;
use std::{
    fs,
    io::{BufRead, BufReader, Write},
    process::{Command, Stdio},
    time::Duration,
};
fn kill_at(r: &Repo, op: &str, point: &str, prefix: Option<usize>) {
    let mut cmd = Command::new(env!("CARGO_BIN_EXE_fgos-event-store-file-driver"));
    cmd.arg(op).arg(&r.layout.common_dir).arg(point);
    if let Some(prefix) = prefix {
        cmd.arg(prefix.to_string());
    }
    let mut child = cmd
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::inherit())
        .spawn()
        .unwrap();
    let stdout = child.stdout.take().unwrap();
    let (tx, rx) = std::sync::mpsc::channel();
    let reader = std::thread::spawn(move || {
        let mut line = String::new();
        let result = BufReader::new(stdout).read_line(&mut line);
        let _ = tx.send((result, line));
    });
    let reached = rx.recv_timeout(Duration::from_secs(20));
    // Kill and reap on every path, so a failed rendezvous cannot strand a lock.
    let _ = child.kill();
    let status = child.wait().unwrap();
    reader.join().unwrap();
    let (result, line) = reached.expect("child never reached checkpoint");
    result.unwrap();
    assert_eq!(line.trim(), "STOP", "{op} {point}");
    assert_eq!(status.signal(), Some(9));
}
fn recover_and_check(r: &Repo, origin: &str, minimum: u64, maximum: u64) {
    let next = r.append(1);
    assert!((minimum + 1..=maximum + 1).contains(&next.ack.first_seq));
    let events = read_own(&r.layout, origin, &r.stream).unwrap().events;
    assert_eq!(events.len() as u64, next.ack.last_seq);
    for (i, event) in events.iter().enumerate() {
        assert_eq!(event.seq, i as u64 + 1);
    }
    let hashes: std::collections::BTreeSet<_> = events.iter().map(|e| &e.h).collect();
    assert_eq!(hashes.len(), events.len());
}
#[test]
fn sigkill_at_every_append_and_ack_boundary_preserves_acknowledged_prefix() {
    for point in [
        "BeforeAppendWrite",
        "AfterAppendWrite",
        "AfterAppendFsync",
        "AfterAppendDirFsync",
    ] {
        let r = Repo::new();
        let a = r.append(2);
        kill_at(&r, "append", point, None);
        let expected = if point == "BeforeAppendWrite" { 2 } else { 5 };
        recover_and_check(&r, &a.ack.origin, expected, expected);
    }
}
#[test]
fn sigkill_during_real_write_never_exposes_a_partial_batch() {
    for prefix in (1..1000).step_by(17) {
        let r = Repo::new();
        let a = r.append(2);
        kill_at(&r, "append", "", Some(prefix));
        assert_eq!(
            read_own(&r.layout, &a.ack.origin, &r.stream)
                .unwrap()
                .events
                .len(),
            2
        );
        recover_and_check(&r, &a.ack.origin, 2, 2);
    }
}
#[test]
fn sigkill_during_truncation_recovery_is_idempotent() {
    for point in ["AfterTruncate", "AfterTruncateFsync"] {
        let r = Repo::new();
        let a = r.append(2);
        let p = r.layout.stream(&r.stream);
        let mut bytes = fs::read(p.active()).unwrap();
        let suffix = batch(&a.ack.origin, 3, 3);
        bytes.extend(&suffix[..suffix.len() - 1]);
        fs::write(p.active(), bytes).unwrap();
        kill_at(&r, "append", point, None);
        recover_and_check(&r, &a.ack.origin, 2, 2);
    }
}
#[test]
fn sigkill_at_every_rotation_boundary_never_reuses_sequence() {
    for point in [
        "AfterRotationFsync",
        "BeforeRotationRename",
        "AfterRotationRename",
        "AfterClosedDirFsync",
        "AfterStreamDirFsync",
        "BeforeHwm",
        "AfterHwmWrite",
        "AfterHwmFsync",
        "AfterHwmRename",
        "AfterHwmDirFsync",
    ] {
        let r = Repo::new();
        let a = r.append(3);
        let p = r.layout.stream(&r.stream);
        // Active data is self-describing; rotation persists the new high.
        fs::write(p.hwm(), b"{\"lastSeq\":0}\n").unwrap();
        kill_at(&r, "rotate", point, None);
        recover_and_check(&r, &a.ack.origin, 3, 3);
        rotate(&r.layout, "test-aa2345", &r.stream, &[]).unwrap();
        assert_eq!(r.append(1).ack.first_seq, 5);
    }
}
#[test]
fn sigkill_during_hint_repair_and_rotation_crash_with_stale_hint() {
    for point in [
        "BeforeHwm",
        "AfterHwmWrite",
        "AfterHwmFsync",
        "AfterHwmRename",
        "AfterHwmDirFsync",
    ] {
        let r = Repo::new();
        let a = r.append(3);
        fs::remove_file(r.layout.stream(&r.stream).hwm()).unwrap();
        kill_at(&r, "append", point, None);
        recover_and_check(&r, &a.ack.origin, 3, 3);
    }
    let r = Repo::new();
    let a = r.append(3);
    let p = r.layout.stream(&r.stream);
    fs::write(p.hwm(), b"{\"lastSeq\":3}\n").unwrap();
    kill_at(&r, "rotate", "AfterRotationRename", None);
    fs::write(p.hwm(), b"{\"lastSeq\":0}\n").unwrap();
    assert_eq!(r.append(1).ack.first_seq, 4);
    assert_eq!(
        read_own(&r.layout, &a.ack.origin, &r.stream)
            .unwrap()
            .events
            .len(),
        4
    );
}
#[test]
fn eight_real_processes_append_with_one_contiguous_sequence_and_identity() {
    let r = Repo::new();
    let mut children = Vec::new();
    for _ in 0..8 {
        children.push(
            Command::new(env!("CARGO_BIN_EXE_fgos-event-store-file-driver"))
                .arg("append")
                .arg(&r.layout.common_dir)
                .arg("barrier")
                .stdin(Stdio::piped())
                .stdout(Stdio::piped())
                .spawn()
                .unwrap(),
        );
    }
    for child in &mut children {
        let mut ready = String::new();
        BufReader::new(child.stdout.as_mut().unwrap())
            .read_line(&mut ready)
            .unwrap();
        assert_eq!(ready.trim(), "READY");
    }
    for child in &mut children {
        child.stdin.take().unwrap().write_all(b"GO\n").unwrap();
    }
    for child in children {
        let out = child.wait_with_output().unwrap();
        assert!(
            out.status.success(),
            "{}",
            String::from_utf8_lossy(&out.stdout)
        );
        assert!(String::from_utf8_lossy(&out.stdout).starts_with("ACK "));
    }
    let id = fgos_event_store::identity::StoreIdentity::open(&r.layout, "test-aa2345").unwrap();
    let events = read_own(&r.layout, &id.store_id, &r.stream).unwrap().events;
    assert_eq!(events.len(), 24);
    for (i, e) in events.iter().enumerate() {
        assert_eq!(e.seq, i as u64 + 1);
    }
    assert_eq!(
        r.append_cursor(1, &Positions::new()).unwrap().ack.first_seq,
        25
    );
}

#[test]
fn sigkill_at_new_active_file_ack_boundaries_preserves_rotated_and_new_events() {
    for point in [
        "BeforeAppendWrite",
        "AfterAppendWrite",
        "AfterAppendFsync",
        "AfterAppendDirFsync",
    ] {
        let r = Repo::new();
        let a = r.append(2);
        rotate(&r.layout, "test-aa2345", &r.stream, &[]).unwrap();
        kill_at(&r, "append", point, None);
        let expected = if point == "BeforeAppendWrite" { 2 } else { 5 };
        recover_and_check(&r, &a.ack.origin, expected, expected);
    }
}

#[test]
fn sigkill_at_seven_seal_boundaries_recovers_without_loss_or_duplicate() {
    for point in [
        "AfterSealObjects",
        "BeforeSealTargetCas",
        "AfterSealTargetCas",
        "AfterSealCas",
        "AfterSealReceiptWrite",
        "AfterSealReceiptFsync",
        "AfterSealReceiptRename",
        "AfterSealReceiptDirectoryFsync",
        "AfterSealReceipt",
        "AfterSealDelete",
        "AfterSealDeleteDirFsync",
    ] {
        let r = Repo::new();
        let a = r.append(3);
        kill_at(&r, "seal", point, None);
        let driver = fgos_git::GitDriver::new(&r.root).unwrap();
        let repo = match driver.resolve_repo(&r.root, &r.root).unwrap() {
            fgos_git::ResolveRepo::Repository(r) => r,
            _ => panic!(),
        };
        fgos_event_store::seal::seal(
            &driver,
            &repo,
            fgos_event_store::seal::SealRequest {
                layout: &r.layout,
                machine: "test-aa2345",
                stream: &r.stream,
                held_ranks: &[],
                hot_lock_depth: 0,
                opportunistic: false,
            },
        )
        .unwrap();
        let receipt =
            fgos_event_store::receipt::Receipt::read(&r.layout.stream(&r.stream).sealed()).unwrap();
        assert_eq!(receipt.last_seq, 3, "{point}");
        let tip = fgos_git::Oid::parse(&receipt.commit, repo.object_format()).unwrap();
        let walked = fgos_event_store::walk::walk(
            &driver,
            &repo,
            &[tip],
            &Default::default(),
            &Default::default(),
        )
        .unwrap();
        assert_eq!(
            walked
                .events
                .iter()
                .map(|e| &e.h)
                .collect::<std::collections::BTreeSet<_>>()
                .len(),
            3,
            "{point}"
        );
        assert_eq!(
            walked
                .events
                .iter()
                .map(|e| e.origin.as_str())
                .collect::<std::collections::BTreeSet<_>>(),
            std::collections::BTreeSet::from([a.ack.origin.as_str()])
        );
        assert_eq!(r.append(1).ack.first_seq, 4);
        assert!(
            fgos_git::wal::Wal::open(&repo)
                .unwrap()
                .active(100)
                .unwrap()
                .is_empty(),
            "{point}"
        );
    }
}

#[test]
fn shared_ref_sigkill_then_sibling_and_seal_all_recover() {
    use fgos_event_store::{
        append::{append, AppendRequest},
        layout::StreamId,
        receipt::Receipt,
        seal::seal_all,
    };
    for all_first in [false, true] {
        let r = Repo::new();
        r.append(2);
        kill_at(&r, "seal", "AfterSealTargetCas", None);
        let sibling = StreamId::parse("project:porting").unwrap();
        append(
            &r.layout,
            &r.registry,
            AppendRequest {
                stream: &sibling,
                events: &common::inputs(1),
                cursor: &Positions::new(),
                writer: "test",
                machine: "test-aa2345",
                held_ranks: &[],
            },
        )
        .unwrap();
        let d = fgos_git::GitDriver::new(&r.root).unwrap();
        let repo = match d.resolve_repo(&r.root, &r.root).unwrap() {
            fgos_git::ResolveRepo::Repository(r) => r,
            _ => panic!(),
        };
        let streams = if all_first {
            vec![sibling.clone(), r.stream.clone()]
        } else {
            vec![sibling.clone()]
        };
        seal_all(&d, &repo, &r.layout, "test-aa2345", &streams, &[], 0).unwrap();
        seal_all(
            &d,
            &repo,
            &r.layout,
            "test-aa2345",
            &[sibling.clone(), r.stream.clone()],
            &[],
            0,
        )
        .unwrap();
        assert_eq!(
            Receipt::read(&r.layout.stream(&r.stream).sealed())
                .unwrap()
                .last_seq,
            2
        );
        assert_eq!(
            Receipt::read(&r.layout.stream(&sibling).sealed())
                .unwrap()
                .last_seq,
            1
        );
    }
}
