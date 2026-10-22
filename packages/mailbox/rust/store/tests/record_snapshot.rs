//! The record's snapshot hold (spec §6.4): one hold takes the mailbox lock,
//! reads the snapshot, changes it in memory and installs it, or writes
//! nothing; versions it cannot use are refused and never overwritten.
#![cfg(unix)]
mod common;

use common::record::{self as rec, TempFgos, T0};
use fgos_holder_lock::LockScope;
use fgos_mailbox::record::{OsIds, Paths, RecordError, Step, Wait};
use fgos_mailbox_core::{Checkpoint, CounterReason, Generation, IdSource, MailboxState, Refusal};
use std::collections::BTreeSet;
use std::os::unix::fs::{MetadataExt, PermissionsExt};
use std::time::Duration;

/// Re-executed by the tests below as a child process; does nothing in an
/// ordinary run.
#[test]
fn child_entry() {
    let Some(role) = rec::role() else {
        return;
    };
    match role.as_str() {
        "draw-ids" => {
            let limits = common::limits();
            let mut ids = OsIds::open().unwrap();
            let drawn: Vec<String> = (0..limits.queue.cap)
                .map(|_| ids.next_u64().to_string())
                .collect();
            assert!(!ids.failed());
            rec::publish(
                &rec::child_scratch().join(rec::child_arg()),
                &drawn.join("\n"),
            );
        }
        other => panic!("unknown role {other}"),
    }
}

fn snapshot_bytes(paths: &Paths) -> Vec<u8> {
    std::fs::read(paths.snapshot()).unwrap()
}

/// A snapshot written by a real hold, with one registered head.
fn registered(fgos: &TempFgos) -> Vec<u8> {
    let limits = common::limits();
    fgos.record()
        .hold(Wait::Try, |state, ids| {
            rec::register(state, "head-a", T0, &limits, ids);
        })
        .unwrap();
    snapshot_bytes(&fgos.paths())
}

/// `bytes` with its `schema_version` replaced.
fn with_version(bytes: &[u8], version: u32) -> Vec<u8> {
    let mut value: serde_json::Value = serde_json::from_slice(bytes).unwrap();
    value["schema_version"] = version.into();
    serde_json::to_vec(&value).unwrap()
}

fn lock_is_free(paths: &Paths) -> bool {
    let mut scope = LockScope::seeded(vec![]).unwrap();
    scope
        .acquire(Paths::lock_name(), &paths.lock_params().unwrap(), Wait::Try)
        .is_ok()
}

#[test]
fn a_first_hold_on_an_empty_record_creates_the_snapshot_through_the_mailbox_lock() {
    let fgos = TempFgos::new("first-hold");
    let limits = common::limits();
    let held = fgos
        .record()
        .hold(Wait::Try, |state, ids| {
            rec::register(state, "head-a", T0, &limits, ids)
        })
        .unwrap();
    assert!(held.wrote);
    assert!(held.warning.is_none());
    let meta = std::fs::metadata(fgos.paths().snapshot()).unwrap();
    assert_eq!(meta.permissions().mode() & 0o777, 0o600);
    let state: MailboxState = serde_json::from_slice(&snapshot_bytes(&fgos.paths())).unwrap();
    assert!(state.binding(&rec::key("head-a")).is_some());
    assert!(lock_is_free(&fgos.paths()), "the hold released the lock");
}

#[test]
fn a_hold_whose_closure_changes_nothing_installs_nothing() {
    let fgos = TempFgos::new("no-change");
    // On an empty record the comparison is against the empty state.
    let held = fgos
        .record()
        .hold(Wait::Try, |state, _| state.bindings().count())
        .unwrap();
    assert!(!held.wrote);
    assert!(!fgos.paths().snapshot().exists());

    registered(&fgos);
    let limits = common::limits();
    let before = std::fs::metadata(fgos.paths().snapshot()).unwrap();
    let held = fgos
        .record()
        .hold(Wait::Try, |state, ids| {
            state
                .claim(
                    &rec::key("head-a"),
                    Generation::FIRST,
                    Checkpoint::Step,
                    T0,
                    &limits,
                    ids,
                )
                .items
                .len()
        })
        .unwrap();
    assert_eq!(held.value, 0, "the closure's value is returned");
    assert!(!held.wrote);
    let after = std::fs::metadata(fgos.paths().snapshot()).unwrap();
    assert_eq!(after.ino(), before.ino());
    assert_eq!(after.modified().unwrap(), before.modified().unwrap());
}

#[test]
fn a_refused_send_is_still_saved() {
    let fgos = TempFgos::new("refused-send");
    let limits = common::limits();
    let held = fgos
        .record()
        .hold(Wait::Try, |state, ids| {
            state.send(
                rec::send_req("head-a", "nobody-claude-zz", "hello"),
                T0,
                &limits,
                ids,
            )
        })
        .unwrap();
    assert!(matches!(held.value, Err(Refusal::UnknownName { .. })));
    assert!(held.wrote);
    let fresh = fgos.record();
    assert_eq!(
        rec::read_state(&fresh)
            .counters()
            .total(CounterReason::UnknownName),
        1
    );
}

#[test]
fn a_newer_snapshot_is_refused_and_left_byte_for_byte() {
    let fgos = TempFgos::new("newer");
    let newer = with_version(&registered(&fgos), 2);
    std::fs::write(fgos.paths().snapshot(), &newer).unwrap();
    let err = fgos
        .record()
        .hold(Wait::Try, |state, ids| {
            rec::register(state, "head-b", T0, &common::limits(), ids)
        })
        .unwrap_err();
    assert_eq!(err.code(), "snapshot-newer");
    assert_eq!(snapshot_bytes(&fgos.paths()), newer);
}

#[test]
fn an_older_snapshot_is_refused_as_unsupported() {
    let fgos = TempFgos::new("older");
    let older = with_version(&registered(&fgos), 0);
    std::fs::write(fgos.paths().snapshot(), &older).unwrap();
    let err = fgos
        .record()
        .hold(Wait::Try, |state, ids| {
            rec::register(state, "head-b", T0, &common::limits(), ids)
        })
        .unwrap_err();
    assert_eq!(err.code(), "snapshot-unsupported-older");
    assert_eq!(snapshot_bytes(&fgos.paths()), older);
}

#[test]
fn an_unreadable_snapshot_is_refused_and_never_overwritten() {
    let fgos = TempFgos::new("unreadable");
    let whole = registered(&fgos);
    let cut = whole[..whole.len() / 2].to_vec();
    std::fs::write(fgos.paths().snapshot(), &cut).unwrap();
    let err = fgos
        .record()
        .hold(Wait::Try, |state, ids| {
            rec::register(state, "head-b", T0, &common::limits(), ids)
        })
        .unwrap_err();
    assert_eq!(err.code(), "snapshot-unreadable");
    assert_eq!(snapshot_bytes(&fgos.paths()), cut);
}

#[test]
fn a_snapshot_that_is_a_symlink_is_never_followed() {
    let fgos = TempFgos::new("symlink-snapshot");
    let whole = registered(&fgos);
    let outside = fgos.scratch().join("elsewhere");
    std::fs::write(&outside, &whole).unwrap();
    std::fs::remove_file(fgos.paths().snapshot()).unwrap();
    std::os::unix::fs::symlink(&outside, fgos.paths().snapshot()).unwrap();
    let err = fgos
        .record()
        .hold(Wait::Try, |state, ids| {
            rec::register(state, "head-b", T0, &common::limits(), ids)
        })
        .unwrap_err();
    assert_eq!(err.code(), "snapshot-unreadable");
    assert_eq!(std::fs::read(&outside).unwrap(), whole);
}

#[test]
fn a_snapshot_that_is_a_fifo_never_blocks_the_hold() {
    let fgos = TempFgos::new("fifo-snapshot");
    let record = fgos.record();
    rec::mkfifo(&fgos.paths().snapshot());
    let err = rec::within(Duration::from_secs(10), move || {
        record
            .hold(Wait::Try, |state, _| state.bindings().count())
            .unwrap_err()
    });
    assert_eq!(err.code(), "snapshot-unreadable");
    assert!(lock_is_free(&fgos.paths()));
}

#[test]
fn a_symlinked_record_directory_is_refused_before_any_write() {
    let fgos = TempFgos::new("symlink-record");
    let record = fgos.record();
    let elsewhere = fgos.scratch().join("record-elsewhere");
    std::fs::create_dir(&elsewhere).unwrap();
    std::fs::remove_dir_all(fgos.paths().record_dir()).unwrap();
    std::os::unix::fs::symlink(&elsewhere, fgos.paths().record_dir()).unwrap();
    let err = record
        .hold(Wait::Try, |state, ids| {
            rec::register(state, "head-a", T0, &common::limits(), ids)
        })
        .unwrap_err();
    assert_eq!(err.code(), "record-dir-untrusted");
    assert_eq!(std::fs::read_dir(&elsewhere).unwrap().count(), 0);
}

#[test]
fn a_failure_after_the_rename_is_reported_as_written() {
    let fgos = TempFgos::new("after-rename");
    let old = registered(&fgos);
    let limits = common::limits();
    let fail_at = |at: Step| {
        move |step: Step| {
            if step == at {
                Err(std::io::Error::other("observer stops here"))
            } else {
                Ok(())
            }
        }
    };

    let err = fgos
        .record()
        .hold_observed(Wait::Try, fail_at(Step::Synced), |state, ids| {
            rec::register(state, "head-b", T0, &limits, ids)
        })
        .unwrap_err();
    assert!(matches!(
        err,
        RecordError::Observer {
            step: Step::Synced,
            ..
        }
    ));
    assert_eq!(err.code(), "observer");
    assert_eq!(snapshot_bytes(&fgos.paths()), old);

    let held = fgos
        .record()
        .hold_observed(Wait::Try, fail_at(Step::Renamed), |state, ids| {
            rec::register(state, "head-c", T0, &limits, ids)
        })
        .unwrap();
    assert!(held.wrote);
    assert_eq!(held.warning.unwrap().step, Step::Renamed);
    let state: MailboxState = serde_json::from_slice(&snapshot_bytes(&fgos.paths())).unwrap();
    assert!(state.binding(&rec::key("head-c")).is_some());
}

#[test]
fn the_frozen_version_1_snapshot_still_reads() {
    let fgos = TempFgos::new("frozen-v1");
    let fixture = std::fs::read(common::snapshot_fixture()).unwrap();
    let expected: serde_json::Value = serde_json::from_slice(&fixture).unwrap();
    // The fixture is only worth freezing while every part of the shape
    // carries a value.
    for (field, value) in expected.as_object().unwrap() {
        let empty = value.as_object().is_some_and(|o| o.is_empty())
            || value.as_array().is_some_and(|a| a.is_empty());
        assert!(!empty, "fixture field {field} is empty");
    }
    let states: BTreeSet<String> = expected["messages"]
        .as_array()
        .unwrap()
        .iter()
        .map(|h| {
            h["state"]
                .as_object()
                .and_then(|o| o.keys().next().cloned())
                .unwrap_or_else(|| h["state"].as_str().unwrap().to_string())
        })
        .collect();
    assert_eq!(states.len(), 4, "a message in each state: {states:?}");

    let record = fgos.record();
    std::fs::write(fgos.paths().snapshot(), &fixture).unwrap();
    let state = rec::read_state(&record);
    assert_eq!(serde_json::to_value(&state).unwrap(), expected);
}

#[test]
fn ids_drawn_by_two_processes_do_not_collide() {
    let _serial = rec::serial();
    let fgos = TempFgos::new("ids");
    let mut children: Vec<_> = ["one", "two"]
        .iter()
        .map(|name| rec::spawn("draw-ids", &fgos, name))
        .collect();
    for child in &mut children {
        assert!(rec::wait_exit(child).success());
    }
    let mut all = Vec::new();
    for name in ["one", "two"] {
        let text = std::fs::read_to_string(fgos.scratch().join(name)).unwrap();
        all.extend(text.lines().map(str::to_string));
    }
    let cap = common::limits().queue.cap as usize;
    assert_eq!(all.len(), 2 * cap);
    let unique: BTreeSet<_> = all.iter().collect();
    assert_eq!(unique.len(), all.len(), "an id was drawn twice");
}
