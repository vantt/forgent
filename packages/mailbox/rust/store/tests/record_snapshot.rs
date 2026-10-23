//! The record's snapshot hold (spec §6.4): one hold takes the mailbox lock,
//! reads the snapshot, changes it in memory and installs it, or writes
//! nothing; versions it cannot use are refused and never overwritten.
#![cfg(unix)]
mod common;

use common::record::{self as rec, TempFgos, T0};
use fgos_holder_lock::LockScope;
use fgos_mailbox::hook::{Begun, QuietReason};
use fgos_mailbox::record::{OsIds, Paths, Reported, Wait};
use fgos_mailbox_core::{
    AttemptToken, Checkpoint, CounterReason, Generation, IdSource, Liveness, MailboxState, Refusal,
    RegisterRequest, Registered, StoredHead,
};
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
        .hold(Wait::Try, T0, &common::limits(), |state, ids| {
            rec::register(state, "head-a", T0, &limits, ids)
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
        .hold(Wait::Try, T0, &common::limits(), |state, ids| {
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

/// The hold decides to write from the core's own answer, never by encoding
/// the state to compare it: an unchanged hold neither encodes nor writes,
/// and a changed one writes even when its bytes would be equal.
#[test]
fn a_hold_writes_exactly_when_its_change_reports_one() {
    let fgos = TempFgos::new("change-report");
    let held = fgos
        .record()
        .hold(Wait::Try, T0, &common::limits(), |state, _| {
            Reported::unchanged(state.bindings().count())
        })
        .unwrap();
    assert!(!held.wrote);
    assert!(
        !fgos.paths().snapshot().exists(),
        "an empty record stays empty"
    );

    registered(&fgos);
    let limits = common::limits();
    let before = std::fs::metadata(fgos.paths().snapshot()).unwrap();
    let held = fgos
        .record()
        .hold(Wait::Try, T0, &limits, |state, ids| {
            state.claim(
                &rec::key("head-a"),
                Generation::FIRST,
                Checkpoint::Step,
                T0,
                &limits,
                ids,
            )
        })
        .unwrap();
    assert!(
        held.value.items.is_empty(),
        "the closure's value is returned"
    );
    assert!(!held.wrote);
    let after = std::fs::metadata(fgos.paths().snapshot()).unwrap();
    assert_eq!(after.ino(), before.ino());
    assert_eq!(after.modified().unwrap(), before.modified().unwrap());

    let held = fgos
        .record()
        .hold(Wait::Try, T0, &limits, |_, _| Reported::changing(()))
        .unwrap();
    assert!(held.wrote);
    let rewritten = std::fs::metadata(fgos.paths().snapshot()).unwrap();
    assert_ne!(
        rewritten.ino(),
        before.ino(),
        "a reported change is installed"
    );
}

/// Each core answer leads to a write exactly when it changed the state:
/// the same head again, a refused registration, a finish that matched no
/// claim and a quiet drain that changed nothing write nothing; a finish of
/// a real claim and a quiet drain that changed the state write.
#[test]
fn each_core_answer_writes_exactly_when_it_changed_the_state() {
    let fgos = TempFgos::new("core-answers");
    registered(&fgos);
    let record = fgos.record();
    let limits = common::limits();
    let wrote = |held: bool, what: &str, expected: bool| {
        assert_eq!(held, expected, "{what}");
    };

    let same_head = StoredHead {
        same_head: true,
        liveness: Liveness::Alive,
    };
    let held = record
        .hold(Wait::Try, T0, &limits, |state, ids| {
            let req = RegisterRequest {
                head: "head-of-head-a".to_string(),
                ..rec::register_request("head-a", &rec::own_head_record())
            };
            state.register(req, Some(same_head), T0, &limits, ids)
        })
        .unwrap();
    assert!(matches!(held.value, Ok(Registered::Refreshed { .. })));
    wrote(held.wrote, "the same head again", false);

    let too_long = "k".repeat(limits.frame.max_header_chars as usize + 1);
    let held = record
        .hold(Wait::Try, T0, &limits, |state, ids| {
            state.register(
                rec::register_request(&too_long, &rec::own_head_record()),
                None,
                T0,
                &limits,
                ids,
            )
        })
        .unwrap();
    assert!(held.value.is_err());
    wrote(held.wrote, "a refused registration", false);

    let held = record
        .hold(Wait::Try, T0, &limits, |state, _| {
            state.finish(
                &rec::key("head-a"),
                Generation::FIRST,
                &AttemptToken::from_text("no-such-claim"),
                T0,
            )
        })
        .unwrap();
    wrote(held.wrote, "a finish that matched no claim", false);

    for (state_changed, expected) in [(false, false), (true, true)] {
        let held = record
            .hold(Wait::Try, T0, &limits, |_, _| Begun::Quiet {
                reason: QuietReason::NothingEligible,
                state_changed,
                registered: None,
            })
            .unwrap();
        wrote(
            held.wrote,
            &format!("a quiet drain, state_changed {state_changed}"),
            expected,
        );
    }

    let to = rec::read_state(&record)
        .binding(&rec::key("head-a"))
        .unwrap()
        .name
        .as_str()
        .to_string();
    record
        .send(
            rec::send_req("cli-sender", &to, "hi"),
            Wait::Try,
            T0,
            &limits,
        )
        .unwrap();
    let claim = record
        .hold(Wait::Try, T0, &limits, |state, ids| {
            state.claim(
                &rec::key("head-a"),
                Generation::FIRST,
                Checkpoint::Step,
                T0,
                &limits,
                ids,
            )
        })
        .unwrap()
        .value;
    let held = record
        .hold(Wait::Try, T0, &limits, |state, _| {
            state.finish(
                &rec::key("head-a"),
                Generation::FIRST,
                &claim.token.unwrap(),
                T0,
            )
        })
        .unwrap();
    wrote(held.wrote, "a finish of a real claim", true);
}

#[test]
fn a_refused_send_is_still_saved() {
    let fgos = TempFgos::new("refused-send");
    let limits = common::limits();
    let held = fgos
        .record()
        .hold(Wait::Try, T0, &common::limits(), |state, ids| {
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
        .hold(Wait::Try, T0, &common::limits(), |state, ids| {
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
        .hold(Wait::Try, T0, &common::limits(), |state, ids| {
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
        .hold(Wait::Try, T0, &common::limits(), |state, ids| {
            rec::register(state, "head-b", T0, &common::limits(), ids)
        })
        .unwrap_err();
    assert_eq!(err.code(), "snapshot-unreadable");
    assert_eq!(snapshot_bytes(&fgos.paths()), cut);
}

/// The snapshot is read only up to the read cap derived from the limits
/// contract (`record::snapshot_read_cap`). A larger snapshot, which only a
/// writer other than the record can produce, is not parsed, refused with
/// its own code and never overwritten; one at the cap reads.
#[test]
fn a_snapshot_larger_than_the_contract_cap_is_never_parsed() {
    let fgos = TempFgos::new("snapshot-cap");
    let whole = registered(&fgos);
    let limits = common::limits();
    let cap = fgos_mailbox::record::snapshot_read_cap(&limits) as usize;
    assert!(whole.len() < cap);
    let padded = |len: usize| {
        let mut bytes = whole.clone();
        bytes.resize(len, b' ');
        bytes
    };
    let record = fgos.record();

    std::fs::write(fgos.paths().snapshot(), padded(cap)).unwrap();
    assert!(rec::read_state(&record)
        .binding(&rec::key("head-a"))
        .is_some());

    let over = padded(cap + 1);
    std::fs::write(fgos.paths().snapshot(), &over).unwrap();
    let err = record
        .hold(Wait::Try, T0, &limits, |state, ids| {
            rec::register(state, "head-b", T0, &limits, ids)
        })
        .unwrap_err();
    assert_eq!(err.code(), "snapshot-too-large");
    assert_eq!(snapshot_bytes(&fgos.paths()), over);
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
        .hold(Wait::Try, T0, &common::limits(), |state, ids| {
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
            .hold(Wait::Try, T0, &common::limits(), |state, _| {
                Reported::unchanged(state.bindings().count())
            })
            .unwrap_err()
    });
    assert_eq!(err.code(), "snapshot-unreadable");
    assert!(lock_is_free(&fgos.paths()));
}

/// Every directory from the `.fgos` directory down to `bodies/` is checked
/// on every hold before anything is read or written: not a symlink, owned
/// by this user, and the mode its creator gives it. The record's own
/// directories (`mailbox/`, `record/`, `bodies/`) carry no group or other
/// bits; `.fgos` and `runtime/`, which others create, must not be
/// world-writable (a group-writable `.fgos` is this machine's normal).
#[test]
fn an_untrusted_record_directory_is_refused_before_any_write() {
    use std::os::unix::fs::PermissionsExt;
    let limits = common::limits();
    let hold = |record: &fgos_mailbox::record::Record| {
        record
            .hold(Wait::Try, T0, &limits, |state, ids| {
                rec::register(state, "head-a", T0, &limits, ids)
            })
            .map(|held| held.wrote)
    };
    let chmod = |path: &std::path::Path, mode: u32| {
        std::fs::set_permissions(path, std::fs::Permissions::from_mode(mode)).unwrap()
    };

    // One temporary .fgos at a time: each case ends its own.
    {
        let fgos = TempFgos::new("symlink-record");
        let record = fgos.record();
        let elsewhere = fgos.scratch().join("record-elsewhere");
        std::fs::create_dir(&elsewhere).unwrap();
        std::fs::remove_dir_all(fgos.paths().record_dir()).unwrap();
        std::os::unix::fs::symlink(&elsewhere, fgos.paths().record_dir()).unwrap();
        assert_eq!(hold(&record).unwrap_err().code(), "record-dir-untrusted");
        assert_eq!(std::fs::read_dir(&elsewhere).unwrap().count(), 0);
    }
    {
        let fgos = TempFgos::new("group-record");
        let record = fgos.record();
        chmod(&fgos.paths().record_dir(), 0o770);
        assert_eq!(hold(&record).unwrap_err().code(), "record-dir-untrusted");
        assert!(!fgos.paths().snapshot().exists());
    }
    {
        let fgos = TempFgos::new("world-fgos");
        let record = fgos.record();
        chmod(&fgos.fgos_dir(), 0o777);
        assert_eq!(hold(&record).unwrap_err().code(), "record-dir-untrusted");
        chmod(&fgos.fgos_dir(), 0o775);
        assert!(hold(&record).unwrap(), "a group-writable .fgos is accepted");
    }
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
