//! The hook shell over a real record: the order write, then finish; the
//! read cap; the caller check; a record error; a panic; the budget
//! watchdog. Heads are real child processes; the payloads are the recorded
//! Claude Code fixtures. The drain's own reasons and shapes are owned by
//! `hook_payloads.rs`, the change-report write rule by `record_snapshot.rs`.
#![cfg(unix)]
mod common;

use common::record::{self as rec, read_state, send_req, wait_exit, TempFgos, T0};
use common::{files, fixture, hook_limits, limits};
use fgos_mailbox::adapters::TestedClis;
use fgos_mailbox::head::{Ancestry, Topology};
use fgos_mailbox::hook::shell::{
    arm_budget, run, GateState, Quiet, Resolved, ShellInput, ShellOutcome, WriteGate,
};
use fgos_mailbox::hook::{Adapter, HeadFacts, HookEvent, QuietReason};
use fgos_mailbox::record::{Record, Wait};
use fgos_mailbox_core::{MessageId, MessageState, Timestamp, WriterKey};
use fgos_process::facts::{identity_of, Record as ProcRecord};
use fgos_process::ProcId;
use std::io::{self, Write};
use std::process::{Child, Command};
use std::time::Duration;

/// A head process the test spawns; killed when the test ends.
struct Head(Child);

impl Drop for Head {
    fn drop(&mut self) {
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}

impl Head {
    fn spawn() -> Self {
        Self(Command::new("sleep").arg("60").spawn().unwrap())
    }

    fn record(&self) -> ProcRecord {
        identity_of(ProcId(self.0.id())).unwrap().to_record()
    }

    /// The ancestry of an entry the head started directly.
    fn ancestry(&self) -> Ancestry {
        Ancestry {
            parent: self.record(),
            parent_comm: "sleep".to_string(),
            grandparent: None,
        }
    }
}

/// The recorded payload and the writer key it names.
fn payload(file: &str) -> (Vec<u8>, WriterKey) {
    let value = fixture(Adapter::Claude, file);
    let writer = WriterKey::new(value["session_id"].as_str().unwrap()).unwrap();
    (serde_json::to_vec(&value).unwrap(), writer)
}

/// One call of the shell at `now`, with the caller's ancestry `caller`
/// (the resolver always finds `head`).
fn call(
    record: &Record,
    head: &Head,
    caller: Ancestry,
    stdin: &[u8],
    stdout: &mut dyn Write,
    now: Timestamp,
) -> ShellOutcome {
    gated_call(record, head, caller, stdin, stdout, now, WriteGate::new())
}

/// [`call`] with the write gate the watchdog would share.
fn gated_call(
    record: &Record,
    head: &Head,
    caller: Ancestry,
    stdin: &[u8],
    stdout: &mut dyn Write,
    now: Timestamp,
    gate: WriteGate,
) -> ShellOutcome {
    let (_, writer) = payload(files::POST_TOOL_USE);
    let limits = limits();
    let hook = hook_limits();
    let head_facts = HeadFacts {
        record: head.record(),
        own_suffix: None,
        handle: None,
    };
    let resolve = move |_: &[u8], _: &Ancestry| {
        Ok(Resolved {
            writer: writer.clone(),
            head: head_facts.clone(),
        })
    };
    let ancestry = move || Some(caller.clone());
    let clock = move || now;
    let input = ShellInput {
        adapter: Adapter::Claude,
        event: HookEvent::PostToolUse,
        project: "forgent",
        record,
        limits: &limits,
        hook: &hook,
        tested: TestedClis::embedded(),
        clock: &clock,
        ancestry: &ancestry,
        topology: Topology::Direct,
        resolve: &resolve,
        gate,
    };
    run(input, &mut &stdin[..], stdout)
}

/// Registers the head with a first call, then records one message to it
/// from a sender with no head; returns the message id.
fn registered_with_mail(record: &Record, head: &Head) -> MessageId {
    let (stdin, writer) = payload(files::POST_TOOL_USE);
    let first = call(record, head, head.ancestry(), &stdin, &mut Vec::new(), T0);
    assert_eq!(
        first.quiet,
        Some(Quiet::Drain(QuietReason::NothingEligible))
    );
    assert!(first.state_written, "the registration is written");
    let name = read_state(record)
        .binding(&writer)
        .unwrap()
        .name
        .as_str()
        .to_string();
    let held = record
        .send(
            send_req("sender-without-head", &name, "hello"),
            Wait::Try,
            T0,
            &limits(),
        )
        .unwrap();
    held.value.unwrap().id
}

fn state_of(record: &Record, id: &MessageId) -> MessageState {
    read_state(record).message(id).unwrap().state.clone()
}

/// A stdout that reads the snapshot when the frame is written to it.
struct Observing<'a> {
    record: &'a Record,
    id: MessageId,
    seen: Option<MessageState>,
    bytes: Vec<u8>,
}

impl Write for Observing<'_> {
    fn write(&mut self, buf: &[u8]) -> io::Result<usize> {
        if self.seen.is_none() {
            self.seen = Some(state_of(self.record, &self.id));
        }
        self.bytes.extend_from_slice(buf);
        Ok(buf.len())
    }

    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}

/// A stdout that reads the write gate at its first write.
struct GateWatching {
    gate: WriteGate,
    seen: Option<GateState>,
}

impl Write for GateWatching {
    fn write(&mut self, buf: &[u8]) -> io::Result<usize> {
        self.seen.get_or_insert(self.gate.state());
        Ok(buf.len())
    }

    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}

/// A stdout whose every write fails.
struct Broken;

impl Write for Broken {
    fn write(&mut self, _: &[u8]) -> io::Result<usize> {
        Err(io::Error::other("stdout closed"))
    }

    fn flush(&mut self) -> io::Result<()> {
        Err(io::Error::other("stdout closed"))
    }
}

/// A stdout that panics on its first write.
struct Panicking;

impl Write for Panicking {
    fn write(&mut self, _: &[u8]) -> io::Result<usize> {
        panic!("stdout panicked")
    }

    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}

#[test]
fn a_claimed_frame_is_on_stdout_while_the_message_is_still_in_flight_and_offered_after_the_finish()
{
    let fgos = TempFgos::new("shell-order");
    let record = fgos.record();
    let head = Head::spawn();
    let id = registered_with_mail(&record, &head);
    let (stdin, _) = payload(files::POST_TOOL_USE);

    let mut out = Observing {
        record: &record,
        id: id.clone(),
        seen: None,
        bytes: Vec::new(),
    };
    let outcome = call(&record, &head, head.ancestry(), &stdin, &mut out, T0);

    assert!(
        matches!(out.seen, Some(MessageState::InFlight { .. })),
        "at the write the message is in flight, got {:?}",
        out.seen
    );
    assert!(String::from_utf8(out.bytes).unwrap().contains("hello"));
    assert_eq!(outcome.claimed, vec![id.clone()]);
    assert!(outcome.stdout_written && outcome.finished);
    assert!(matches!(
        state_of(&record, &id),
        MessageState::Offered { .. }
    ));
}

#[test]
fn a_failed_stdout_write_never_finishes_and_the_message_is_offered_again_after_its_deadline() {
    let fgos = TempFgos::new("shell-broken");
    let record = fgos.record();
    let head = Head::spawn();
    let id = registered_with_mail(&record, &head);
    let (stdin, _) = payload(files::POST_TOOL_USE);

    let outcome = call(&record, &head, head.ancestry(), &stdin, &mut Broken, T0);
    assert!(!outcome.stdout_written && !outcome.finished);
    assert!(matches!(
        state_of(&record, &id),
        MessageState::InFlight { .. }
    ));

    let later = T0.plus_secs(limits().in_flight_ttl_sec + 1);
    let mut again = Vec::new();
    let outcome = call(&record, &head, head.ancestry(), &stdin, &mut again, later);
    assert_eq!(outcome.claimed, vec![id.clone()]);
    assert!(String::from_utf8(again)
        .unwrap()
        .contains(r#"attempt=\"2\""#));
    assert!(matches!(
        state_of(&record, &id),
        MessageState::Offered { .. }
    ));
}

#[test]
fn a_payload_one_byte_over_the_read_cap_skips_the_drain_with_its_own_reason_and_leaves_the_snapshot_unwritten(
) {
    let fgos = TempFgos::new("shell-cap");
    let record = fgos.record();
    let head = Head::spawn();
    let cap = hook_limits().hook.max_read_bytes as usize;
    let (fixture, _) = payload(files::POST_TOOL_USE);
    let mut stdin = fixture.clone();
    stdin.resize(cap + 1, b' ');

    let mut out = Vec::new();
    let outcome = call(&record, &head, head.ancestry(), &stdin, &mut out, T0);

    assert_eq!(outcome.quiet, Some(Quiet::OverReadCap));
    assert!(out.is_empty());
    assert!(!fgos.paths().snapshot().exists());
}

#[test]
fn a_caller_that_is_not_the_head_drains_nothing_and_opens_no_record() {
    let fgos = TempFgos::new("shell-caller");
    let record = fgos.record();
    let head = Head::spawn();
    let other = Head::spawn();
    let (stdin, _) = payload(files::POST_TOOL_USE);

    let mut out = Vec::new();
    let outcome = call(&record, &head, other.ancestry(), &stdin, &mut out, T0);

    assert_eq!(outcome.quiet, Some(Quiet::NotTheHead));
    assert!(out.is_empty());
    assert!(!fgos.paths().snapshot().exists(), "no snapshot was written");
}

#[test]
fn a_record_error_makes_the_hook_quiet_and_print_nothing() {
    let fgos = TempFgos::new("shell-record");
    let record = fgos.record();
    let head = Head::spawn();
    registered_with_mail(&record, &head);
    let snapshot = fgos.paths().snapshot();
    let mut value: serde_json::Value =
        serde_json::from_slice(&std::fs::read(&snapshot).unwrap()).unwrap();
    value["schema_version"] = 2.into();
    let newer = serde_json::to_vec(&value).unwrap();
    std::fs::write(&snapshot, &newer).unwrap();
    let (stdin, _) = payload(files::POST_TOOL_USE);

    let mut out = Vec::new();
    let outcome = call(&record, &head, head.ancestry(), &stdin, &mut out, T0);

    assert_eq!(outcome.quiet, Some(Quiet::Record("snapshot-newer")));
    assert!(out.is_empty());
    assert_eq!(std::fs::read(&snapshot).unwrap(), newer);
}

#[test]
fn a_panic_while_writing_is_caught_prints_nothing_more_and_leaves_the_claim_unfinished() {
    let fgos = TempFgos::new("shell-panic");
    let record = fgos.record();
    let head = Head::spawn();
    let id = registered_with_mail(&record, &head);
    let (stdin, _) = payload(files::POST_TOOL_USE);

    let outcome = call(&record, &head, head.ancestry(), &stdin, &mut Panicking, T0);

    assert!(outcome.panicked);
    assert!(!outcome.stdout_written && !outcome.finished);
    assert!(matches!(
        state_of(&record, &id),
        MessageState::InFlight { .. }
    ));
}

#[test]
fn the_shell_moves_the_write_gate_to_writing_before_the_first_byte_of_stdout() {
    let fgos = TempFgos::new("shell-gate");
    let record = fgos.record();
    let head = Head::spawn();
    registered_with_mail(&record, &head);
    let (stdin, _) = payload(files::POST_TOOL_USE);
    let gate = WriteGate::new();
    let mut out = GateWatching {
        gate: gate.clone(),
        seen: None,
    };

    let outcome = gated_call(
        &record,
        &head,
        head.ancestry(),
        &stdin,
        &mut out,
        T0,
        gate.clone(),
    );

    assert_eq!(
        out.seen,
        Some(GateState::Writing),
        "the watchdog cannot claim it now"
    );
    assert!(outcome.stdout_written && outcome.finished);
    assert!(
        !gate.claim_exit(),
        "a watchdog firing after the write stays"
    );
}

#[test]
fn a_shell_whose_gate_the_watchdog_claimed_writes_nothing_and_leaves_the_claim_unfinished() {
    let fgos = TempFgos::new("shell-gate-claimed");
    let record = fgos.record();
    let head = Head::spawn();
    let id = registered_with_mail(&record, &head);
    let (stdin, _) = payload(files::POST_TOOL_USE);
    let gate = WriteGate::new();
    assert!(gate.claim_exit(), "the budget passed first");

    let mut out = Vec::new();
    let outcome = gated_call(&record, &head, head.ancestry(), &stdin, &mut out, T0, gate);

    assert!(out.is_empty());
    assert!(!outcome.stdout_written && !outcome.finished);
    assert!(matches!(
        state_of(&record, &id),
        MessageState::InFlight { .. }
    ));
}

/// The budget the watchdog children use: short, passed in by the test; the
/// product value stays in the contract.
const CHILD_BUDGET: Duration = Duration::from_millis(300);

#[test]
fn child_entry() {
    let Some(role) = rec::role() else {
        return;
    };
    let scratch = rec::child_scratch();
    let gate = WriteGate::new();
    if role == "writing" {
        assert!(gate.begin_write());
    }
    let mark = scratch.join("budget-exit");
    arm_budget(CHILD_BUDGET, gate, move || {
        std::fs::write(mark, "exit").unwrap();
    });
    match role.as_str() {
        // Blocked before the write: the watchdog ends the process.
        "blocked" => rec::park_forever(),
        // The write has started: the watchdog lets it finish.
        "writing" => {
            std::thread::sleep(CHILD_BUDGET * 3);
            std::fs::write(scratch.join("write-finished"), "done").unwrap();
        }
        other => panic!("unknown role {other}"),
    }
}

#[test]
fn the_budget_watchdog_waits_for_a_started_write_and_exits_otherwise() {
    let blocked = TempFgos::new("budget-blocked");
    let scratch = blocked.scratch();
    let mut child = rec::spawn("blocked", &blocked, "");
    let status = wait_exit(&mut child);
    drop(child);
    assert!(status.success(), "the watchdog exits 0: {status}");
    assert!(scratch.join("budget-exit").exists(), "on_exit ran");
    drop(blocked);

    let writing = TempFgos::new("budget-writing");
    let scratch = writing.scratch();
    let mut child = rec::spawn("writing", &writing, "");
    let status = wait_exit(&mut child);
    assert!(status.success(), "{status}");
    assert!(
        scratch.join("write-finished").exists(),
        "the started write finished"
    );
    assert!(
        !scratch.join("budget-exit").exists(),
        "the watchdog did not end it"
    );
}
