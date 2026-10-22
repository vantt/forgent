//! Process-crash safety of the record (spec §6.4, §10): a holder killed
//! (SIGKILL) at any step of a hold leaves the lock free at once, the
//! snapshot whole (the old one before the rename, the new one after), no
//! header naming a missing body, and orphans the next send removes. An
//! observer error at a step leaves the same state as a kill there.
//!
//! Process crash only: power loss is out of scope (spec §6.4 claims none).
#![cfg(unix)]
mod common;

use common::record::{self as rec, TempFgos, T0};
use fgos_holder_lock::LockScope;
use fgos_mailbox::record::{Paths, Record, RecordError, Step, Wait};
use fgos_mailbox_core::{Limits, MailboxState};
use std::collections::BTreeSet;
use std::path::Path;

const STEPS: [Step; 9] = [
    Step::Locked,
    Step::Read,
    Step::Mutated,
    Step::BodyInstalled,
    Step::Written,
    Step::Synced,
    Step::Renamed,
    Step::DirectorySynced,
    Step::Collected,
];
const BODY: &str = "a body sent while the writer dies";
/// The file a child installs when it reached its step.
const READY: &str = "ready";

/// Whether a kill or a failure at `step` comes after the commit point.
fn committed(step: Step) -> bool {
    matches!(
        step,
        Step::Renamed | Step::DirectorySynced | Step::Collected
    )
}

fn step_named(name: &str) -> Step {
    STEPS
        .into_iter()
        .find(|step| format!("{step:?}") == name)
        .unwrap()
}

/// Re-executed by the tests below as a child process; does nothing in an
/// ordinary run. At its step the child installs the ready file and then
/// blocks until it is killed.
#[test]
fn child_entry() {
    let Some(role) = rec::role() else {
        return;
    };
    let arg = rec::child_arg();
    let (step, to) = arg.split_once('|').unwrap();
    let step = step_named(step);
    let ready = rec::child_scratch().join(READY);
    let block_at = |at: Step| {
        if at == step {
            rec::publish(&ready, &format!("{at:?}"));
            loop {
                std::thread::park();
            }
        }
        Ok(())
    };
    let record = Record::open(rec::child_fgos_dir()).unwrap();
    let limits = common::limits();
    match role.as_str() {
        "send" => {
            record
                .send_observed(
                    rec::send_req("head-a", to, BODY),
                    Wait::Try,
                    T0,
                    &limits,
                    block_at,
                )
                .unwrap();
        }
        "register" => {
            record
                .hold_observed(Wait::Try, block_at, |state, ids| {
                    rec::register(state, "head-c", T0, &limits, ids)
                })
                .unwrap();
        }
        other => panic!("unknown role {other}"),
    }
    panic!("the child passed its step {step:?} without stopping");
}

/// Two heads and one delivered message, so the old snapshot already
/// references a body. Returns the record and the recipient's name.
fn set_up(fgos: &TempFgos, limits: &Limits) -> (Record, String) {
    let record = fgos.record();
    let to = record
        .hold(Wait::Try, |state, ids| {
            rec::register(state, "head-a", T0, limits, ids);
            rec::name_of(&rec::register(state, "head-b", T0, limits, ids))
        })
        .unwrap()
        .value;
    record
        .send(rec::send_req("head-a", &to, "first"), Wait::Try, T0, limits)
        .unwrap()
        .value
        .unwrap();
    (record, to)
}

fn listing(dir: &Path) -> BTreeSet<String> {
    std::fs::read_dir(dir)
        .unwrap()
        .map(|e| e.unwrap().file_name().into_string().unwrap())
        .collect()
}

fn name(path: &Path) -> String {
    path.file_name().unwrap().to_str().unwrap().to_string()
}

/// What the interrupted hold was changing.
#[derive(Clone, Copy)]
enum Change {
    /// One more header, to `head-b`, carrying [`BODY`].
    Send,
    /// A new binding for `head-c`.
    Register,
}

/// The state before the interrupted hold, and what to check after it.
struct Before {
    bytes: Vec<u8>,
    state: MailboxState,
}

impl Before {
    fn take(paths: &Paths, record: &Record) -> Self {
        Self {
            bytes: std::fs::read(paths.snapshot()).unwrap(),
            state: rec::read_state(record),
        }
    }

    /// (a) the lock is free, (b) the snapshot is whole: the old bytes
    /// before the commit point, exactly the interrupted change after it,
    /// (c) every kept body is readable.
    fn assert_whole(&self, fgos: &TempFgos, record: &Record, step: Step, change: Change) {
        let paths = fgos.paths();
        let mut scope = LockScope::seeded(vec![]).unwrap();
        assert!(
            scope
                .acquire(Paths::lock_name(), &paths.lock_params().unwrap(), Wait::Try)
                .is_ok(),
            "the lock is free at once after {step:?}"
        );
        drop(scope);
        let bytes = std::fs::read(paths.snapshot()).unwrap();
        let after: MailboxState = serde_json::from_slice(&bytes)
            .unwrap_or_else(|e| panic!("snapshot after {step:?} does not parse: {e}"));
        if !committed(step) {
            assert_eq!(
                bytes, self.bytes,
                "old snapshot before the rename ({step:?})"
            );
        } else {
            assert_ne!(
                bytes, self.bytes,
                "new snapshot after the rename ({step:?})"
            );
            match change {
                Change::Send => {
                    let old: Vec<_> = self.state.messages().cloned().collect();
                    let new: Vec<_> = after.messages().cloned().collect();
                    assert_eq!(new.len(), old.len() + 1);
                    assert_eq!(new[..old.len()], old[..]);
                    let added = &new[old.len()];
                    assert_eq!(added.to, rec::key("head-b"));
                    assert_eq!(added.body_bytes, BODY.len() as u64);
                    assert!(added.body_kept);
                    let old: Vec<_> = self.state.bindings().collect();
                    assert_eq!(after.bindings().collect::<Vec<_>>(), old);
                }
                Change::Register => {
                    assert!(after.binding(&rec::key("head-c")).is_some());
                    assert_eq!(
                        after.messages().collect::<Vec<_>>(),
                        self.state.messages().collect::<Vec<_>>()
                    );
                }
            }
        }
        let limits = common::limits();
        for header in after.messages().filter(|h| h.body_kept) {
            assert!(
                record
                    .body(&header.id, header.body_bytes, &limits)
                    .is_some(),
                "header {} names a missing body after {step:?}",
                header.id
            );
        }
    }
}

/// (d) the next send leaves exactly the snapshot, the bodies directory and
/// the referenced bodies.
fn assert_next_send_leaves_no_orphan(fgos: &TempFgos, record: &Record, to: &str) {
    let limits = common::limits();
    record
        .send(rec::send_req("head-a", to, "next"), Wait::Try, T0, &limits)
        .unwrap()
        .value
        .unwrap();
    let paths = fgos.paths();
    assert_eq!(
        listing(&paths.record_dir()),
        BTreeSet::from([name(&paths.snapshot()), name(&paths.bodies_dir())])
    );
    let referenced: BTreeSet<String> = rec::read_state(record)
        .messages()
        .filter(|h| h.body_kept)
        .map(|h| name(&paths.body(&h.id).unwrap()))
        .collect();
    assert_eq!(listing(&paths.bodies_dir()), referenced);
}

/// Starts the child at `step`, waits until it stands there, kills it.
fn kill_at(fgos: &TempFgos, role: &str, step: Step, to: &str) {
    let mut child = rec::spawn(role, fgos, &format!("{step:?}|{to}"));
    rec::wait_for(&mut child, &fgos.scratch().join(READY));
    child.kill().unwrap();
    child.wait().unwrap();
}

fn send_killed_at(step: Step) {
    let fgos = TempFgos::new("kill-send");
    let limits = common::limits();
    let (record, to) = set_up(&fgos, &limits);
    let before = Before::take(&fgos.paths(), &record);
    kill_at(&fgos, "send", step, &to);
    before.assert_whole(&fgos, &record, step, Change::Send);
    assert_next_send_leaves_no_orphan(&fgos, &record, &to);
}

fn observer_fails_at(step: Step) {
    let fgos = TempFgos::new("observer-send");
    let limits = common::limits();
    let (record, to) = set_up(&fgos, &limits);
    let before = Before::take(&fgos.paths(), &record);
    let result = record.send_observed(
        rec::send_req("head-a", &to, BODY),
        Wait::Try,
        T0,
        &limits,
        |at| {
            if at == step {
                Err(std::io::Error::other("the observer stops here"))
            } else {
                Ok(())
            }
        },
    );
    if committed(step) {
        let held = result.unwrap();
        assert!(held.wrote);
        assert_eq!(held.warning.unwrap().step, step);
    } else {
        let err = result.unwrap_err();
        assert!(
            matches!(err, RecordError::Observer { step: at, .. } if at == step),
            "{err}"
        );
    }
    before.assert_whole(&fgos, &record, step, Change::Send);
    assert_next_send_leaves_no_orphan(&fgos, &record, &to);
}

macro_rules! rows {
    ($check:ident: $($name:ident => $step:ident,)*) => {
        $(
            #[test]
            fn $name() {
                $check(Step::$step);
            }
        )*
    };
}

rows! { send_killed_at:
    a_send_killed_at_locked_leaves_a_whole_snapshot => Locked,
    a_send_killed_at_read_leaves_a_whole_snapshot => Read,
    a_send_killed_at_mutated_leaves_a_whole_snapshot => Mutated,
    a_send_killed_at_body_installed_leaves_a_whole_snapshot => BodyInstalled,
    a_send_killed_at_written_leaves_a_whole_snapshot => Written,
    a_send_killed_at_synced_leaves_a_whole_snapshot => Synced,
    a_send_killed_at_renamed_leaves_a_whole_snapshot => Renamed,
    a_send_killed_at_directory_synced_leaves_a_whole_snapshot => DirectorySynced,
    a_send_killed_at_collected_leaves_a_whole_snapshot => Collected,
}

rows! { observer_fails_at:
    an_observer_error_at_locked_leaves_the_same_state_as_a_kill_there => Locked,
    an_observer_error_at_read_leaves_the_same_state_as_a_kill_there => Read,
    an_observer_error_at_mutated_leaves_the_same_state_as_a_kill_there => Mutated,
    an_observer_error_at_body_installed_leaves_the_same_state_as_a_kill_there => BodyInstalled,
    an_observer_error_at_written_leaves_the_same_state_as_a_kill_there => Written,
    an_observer_error_at_synced_leaves_the_same_state_as_a_kill_there => Synced,
    an_observer_error_at_renamed_leaves_the_same_state_as_a_kill_there => Renamed,
    an_observer_error_at_directory_synced_leaves_the_same_state_as_a_kill_there => DirectorySynced,
    an_observer_error_at_collected_leaves_the_same_state_as_a_kill_there => Collected,
}

#[test]
fn a_registering_hold_killed_after_its_closure_leaves_a_whole_snapshot() {
    let fgos = TempFgos::new("kill-register");
    let limits = common::limits();
    let (record, _) = set_up(&fgos, &limits);
    let before = Before::take(&fgos.paths(), &record);
    kill_at(&fgos, "register", Step::Mutated, "");
    before.assert_whole(&fgos, &record, Step::Mutated, Change::Register);
}
