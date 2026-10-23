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
use fgos_mailbox::head::Ancestry;
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

    /// The ancestry of an entry the head started through the hook shell
    /// the adapters contract names for Claude Code.
    fn ancestry(&self) -> Ancestry {
        let shell = std::fs::canonicalize("/bin/sh").unwrap();
        Ancestry {
            parent: identity_of(ProcId(std::process::id())).unwrap().to_record(),
            parent_relation: fgos_process::facts::relation_of(ProcId(std::process::id())).unwrap(),
            parent_exe: Some(shell),
            parent_argv0: Some("/bin/sh".to_string()),
            grandparent: Some(self.record()),
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
        fgos_dir: record.paths().fgos_dir(),
        limits: &limits,
        hook: &hook,
        tested: TestedClis::embedded(),
        clock: &clock,
        ancestry: &ancestry,
        resolve: &resolve,
        handle_of: &|_, _| None,
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

#[test]
fn a_shell_whose_step_drain_finds_only_too_large_mail_writes_the_pointer_and_finishes_nothing() {
    let fgos = TempFgos::new("shell-pointer");
    let record = fgos.record();
    let head = Head::spawn();
    let (stdin, writer) = payload(files::POST_TOOL_USE);
    call(&record, &head, head.ancestry(), &stdin, &mut Vec::new(), T0);
    let name = read_state(&record)
        .binding(&writer)
        .unwrap()
        .name
        .to_string();
    let bound = TestedClis::embedded()
        .facts(Adapter::Claude)
        .and_then(|f| f.post_tool_use_max_bytes)
        .unwrap();
    let body = "x".repeat(bound as usize);
    let id = record
        .send(
            send_req("sender-without-head", &name, &body),
            Wait::Try,
            T0,
            &limits(),
        )
        .unwrap()
        .value
        .unwrap()
        .id;

    let mut stdout = Vec::new();
    let outcome = call(&record, &head, head.ancestry(), &stdin, &mut stdout, T0);

    assert!(outcome.stdout_written);
    assert!(
        !outcome.finished,
        "nothing was claimed, so nothing is finished"
    );
    assert!(outcome.claimed.is_empty());
    let out: serde_json::Value = serde_json::from_slice(&stdout).unwrap();
    assert_eq!(
        out["hookSpecificOutput"]["additionalContext"],
        fgos_mailbox_core::too_large_pointer(1)
    );
    assert_eq!(state_of(&record, &id), MessageState::Recorded);
}

/// [`call`] with a resolver that answers `writer` instead of the payload's.
fn call_as(
    record: &Record,
    head: &Head,
    writer: WriterKey,
    stdin: &[u8],
    stdout: &mut dyn Write,
) -> ShellOutcome {
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
    let caller = head.ancestry();
    let ancestry = move || Some(caller.clone());
    let clock = || T0;
    let input = ShellInput {
        adapter: Adapter::Claude,
        event: HookEvent::PostToolUse,
        project: "forgent",
        fgos_dir: record.paths().fgos_dir(),
        limits: &limits,
        hook: &hook,
        tested: TestedClis::embedded(),
        clock: &clock,
        ancestry: &ancestry,
        resolve: &resolve,
        handle_of: &|_, _| None,
        gate: WriteGate::new(),
    };
    run(input, &mut &stdin[..], stdout)
}

#[test]
fn a_runner_head_writer_is_quiet_and_registers_nothing() {
    let fgos = TempFgos::new("shell-runner");
    let record = fgos.record();
    let head = Head::spawn();
    let (stdin, _) = payload(files::POST_TOOL_USE);
    let runner =
        WriterKey::new(fgos_identity::mint_attempt_writer_id("asgn-1_x").unwrap()).unwrap();

    let mut out = Vec::new();
    let outcome = call_as(&record, &head, runner, &stdin, &mut out);

    assert_eq!(outcome.quiet, Some(Quiet::RunnerHead));
    assert!(out.is_empty());
    assert!(!fgos.paths().snapshot().exists(), "nothing was registered");
}

/// Makes every hold fail with `snapshot-newer`, a counted failure.
fn break_snapshot(fgos: &TempFgos) {
    let snapshot = fgos.paths().snapshot();
    let mut value: serde_json::Value =
        serde_json::from_slice(&std::fs::read(&snapshot).unwrap()).unwrap();
    value["schema_version"] = 2.into();
    std::fs::write(&snapshot, serde_json::to_vec(&value).unwrap()).unwrap();
}

/// A stdin that records whether anything read it.
struct Watched<'a> {
    bytes: &'a [u8],
    read: bool,
}

impl io::Read for Watched<'_> {
    fn read(&mut self, buf: &mut [u8]) -> io::Result<usize> {
        self.read = true;
        self.bytes.read(buf)
    }
}

fn breaker_limits() -> fgos_mailbox::hook::BreakerLimits {
    hook_limits().hook.breaker
}

#[test]
fn the_breaker_opens_after_the_configured_counted_failures_and_answers_quiet_before_reading_stdin()
{
    let fgos = TempFgos::new("shell-breaker-open");
    let record = fgos.record();
    let head = Head::spawn();
    registered_with_mail(&record, &head);
    break_snapshot(&fgos);
    let (stdin, _) = payload(files::POST_TOOL_USE);

    for _ in 0..breaker_limits().failures {
        let outcome = call(&record, &head, head.ancestry(), &stdin, &mut Vec::new(), T0);
        assert_eq!(outcome.quiet, Some(Quiet::Record("snapshot-newer")));
    }
    let mut watched = Watched {
        bytes: &stdin,
        read: false,
    };
    let limits = limits();
    let hook = hook_limits();
    let clock = || T0;
    let ancestry = || Some(head.ancestry());
    let resolve = |_: &[u8], _: &Ancestry| -> Result<Resolved, fgos_mailbox::head::NoHead> {
        panic!("an open breaker resolves nothing")
    };
    let input = ShellInput {
        adapter: Adapter::Claude,
        event: HookEvent::PostToolUse,
        project: "forgent",
        fgos_dir: record.paths().fgos_dir(),
        limits: &limits,
        hook: &hook,
        tested: TestedClis::embedded(),
        clock: &clock,
        ancestry: &ancestry,
        resolve: &resolve,
        handle_of: &|_, _| None,
        gate: WriteGate::new(),
    };
    let outcome = run(input, &mut watched, &mut Vec::new());

    assert_eq!(outcome.quiet, Some(Quiet::BreakerOpen));
    assert!(
        !watched.read,
        "an open breaker answers before stdin is read"
    );
}

#[test]
fn an_open_breaker_closes_after_its_pause() {
    let fgos = TempFgos::new("shell-breaker-pause");
    let record = fgos.record();
    let head = Head::spawn();
    let id = registered_with_mail(&record, &head);
    let snapshot = fgos.paths().snapshot();
    let good = std::fs::read(&snapshot).unwrap();
    break_snapshot(&fgos);
    let (stdin, _) = payload(files::POST_TOOL_USE);
    for _ in 0..breaker_limits().failures {
        call(&record, &head, head.ancestry(), &stdin, &mut Vec::new(), T0);
    }
    std::fs::write(&snapshot, &good).unwrap();
    let pause = breaker_limits().pause_sec;

    let inside = Timestamp::from_millis(T0.plus_secs(pause).as_millis() - 1);
    let outcome = call(
        &record,
        &head,
        head.ancestry(),
        &stdin,
        &mut Vec::new(),
        inside,
    );
    assert_eq!(outcome.quiet, Some(Quiet::BreakerOpen));

    let after = T0.plus_secs(pause);
    let outcome = call(
        &record,
        &head,
        head.ancestry(),
        &stdin,
        &mut Vec::new(),
        after,
    );
    assert_eq!(outcome.claimed, vec![id]);
    let breaker: serde_json::Value =
        serde_json::from_slice(&std::fs::read(fgos.paths().breaker()).unwrap()).unwrap();
    assert_eq!(breaker["failures"], 0, "a success resets the count");
    assert_eq!(breaker["openedAtMs"], serde_json::Value::Null);
}

#[test]
fn lock_contention_config_errors_budget_exits_and_benign_quiets_never_count() {
    use fgos_mailbox::hook::breaker::Breaker;
    let fgos = TempFgos::new("shell-breaker-benign");
    let record = fgos.record();
    let limits = breaker_limits();
    // Config errors stop the entry before the shell, and a budget exit ends
    // the process from the watchdog: neither reaches the count. What does
    // reach it and must not count: lock contention and every benign quiet.
    let benign = [
        Quiet::Record(fgos_mailbox::record::LOCK_BUSY),
        Quiet::Drain(QuietReason::NothingEligible),
        Quiet::NotTheHead,
        Quiet::OverReadCap,
        Quiet::RunnerHead,
    ];
    for quiet in benign {
        for _ in 0..limits.failures + 1 {
            let outcome = ShellOutcome {
                quiet: Some(quiet.clone()),
                ..ShellOutcome::default()
            };
            Breaker::load(record.paths(), &limits).after(&outcome, T0);
        }
        assert!(
            !Breaker::load(record.paths(), &limits).is_open(T0),
            "{quiet:?} counted"
        );
    }
    assert!(
        !fgos.paths().breaker().exists(),
        "nothing counted, nothing written"
    );
    let panicked = ShellOutcome {
        panicked: true,
        ..ShellOutcome::default()
    };
    for _ in 0..limits.failures {
        Breaker::load(record.paths(), &limits).after(&panicked, T0);
    }
    assert!(
        Breaker::load(record.paths(), &limits).is_open(T0),
        "a caught panic counts"
    );
}

/// Writes a breaker file holding `text`.
fn plant_breaker(fgos: &TempFgos, text: &str) {
    std::fs::write(fgos.paths().breaker(), text).unwrap();
}

#[test]
fn a_planted_future_open_time_cannot_extend_the_pause() {
    use fgos_mailbox::hook::breaker::Breaker;
    let fgos = TempFgos::new("shell-breaker-future");
    let record = fgos.record();
    let limits = breaker_limits();
    let at = |ms: u64| format!(r#"{{"schema":1,"failures":3,"openedAtMs":{ms}}}"#);
    let now = T0.as_millis();

    plant_breaker(&fgos, &at(now + 3_600_000));
    assert!(
        !Breaker::load(record.paths(), &limits).is_open(T0),
        "an hour ahead reads as closed"
    );
    plant_breaker(&fgos, &at(now + 2_000));
    assert!(
        Breaker::load(record.paths(), &limits).is_open(T0),
        "within the clock skew it counts"
    );
    plant_breaker(&fgos, &at(now - 1_000));
    assert!(Breaker::load(record.paths(), &limits).is_open(T0));
    plant_breaker(&fgos, &at(now - limits.pause_sec * 1000));
    assert!(
        !Breaker::load(record.paths(), &limits).is_open(T0),
        "the pause has passed"
    );
}

#[test]
fn a_corrupt_symlinked_or_oversized_breaker_file_reads_as_closed() {
    use fgos_mailbox::hook::breaker::Breaker;
    let fgos = TempFgos::new("shell-breaker-corrupt");
    let record = fgos.record();
    let limits = breaker_limits();
    let open = format!(
        r#"{{"schema":1,"failures":3,"openedAtMs":{}}}"#,
        T0.as_millis()
    );
    plant_breaker(&fgos, &open);
    assert!(
        Breaker::load(record.paths(), &limits).is_open(T0),
        "the planted state is open"
    );

    for text in [
        "not json".to_string(),
        open.replace("\"schema\":1", "\"schema\":2"),
        open.replace('}', r#","extra":1}"#),
        format!("{open}{}", " ".repeat(5000)),
    ] {
        plant_breaker(&fgos, &text);
        assert!(
            !Breaker::load(record.paths(), &limits).is_open(T0),
            "{text:.40}"
        );
    }
    std::fs::remove_file(fgos.paths().breaker()).unwrap();
    let elsewhere = fgos.scratch().join("breaker-elsewhere.json");
    std::fs::write(&elsewhere, &open).unwrap();
    std::os::unix::fs::symlink(&elsewhere, fgos.paths().breaker()).unwrap();
    assert!(
        !Breaker::load(record.paths(), &limits).is_open(T0),
        "a symlink is never followed"
    );
}

#[test]
fn the_breaker_is_never_read_or_written_under_an_untrusted_directory() {
    use fgos_mailbox::hook::breaker::Breaker;
    use std::os::unix::fs::PermissionsExt;
    let fgos = TempFgos::new("shell-breaker-untrusted");
    let record = fgos.record();
    let limits = breaker_limits();
    let open = format!(
        r#"{{"schema":1,"failures":3,"openedAtMs":{}}}"#,
        T0.as_millis()
    );
    plant_breaker(&fgos, &open);
    let runtime = fgos.fgos_dir().join("runtime");
    let mode = std::fs::metadata(&runtime).unwrap().permissions().mode();
    std::fs::set_permissions(&runtime, std::fs::Permissions::from_mode(mode | 0o002)).unwrap();

    assert!(
        !Breaker::load(record.paths(), &limits).is_open(T0),
        "an untrusted chain reads as closed"
    );
    let panicked = ShellOutcome {
        panicked: true,
        ..ShellOutcome::default()
    };
    Breaker::load(record.paths(), &limits).after(&panicked, T0);
    std::fs::set_permissions(&runtime, std::fs::Permissions::from_mode(mode)).unwrap();
    assert_eq!(
        std::fs::read_to_string(fgos.paths().breaker()).unwrap(),
        open,
        "nothing was written"
    );
}

#[test]
fn the_no_mail_path_writes_neither_snapshot_nor_breaker_file() {
    let fgos = TempFgos::new("shell-no-mail");
    let record = fgos.record();
    let head = Head::spawn();
    let (stdin, _) = payload(files::POST_TOOL_USE);
    call(&record, &head, head.ancestry(), &stdin, &mut Vec::new(), T0);
    let snapshot = fgos.paths().snapshot();
    let before = std::fs::metadata(&snapshot).unwrap();
    let before = (
        before.modified().unwrap(),
        std::os::unix::fs::MetadataExt::ino(&before),
    );

    let mut out = Vec::new();
    let outcome = call(
        &record,
        &head,
        head.ancestry(),
        &stdin,
        &mut out,
        T0.plus_secs(1),
    );

    assert_eq!(
        outcome.quiet,
        Some(Quiet::Drain(QuietReason::NothingEligible))
    );
    assert!(out.is_empty() && !outcome.state_written);
    let after = std::fs::metadata(&snapshot).unwrap();
    assert_eq!(
        (
            after.modified().unwrap(),
            std::os::unix::fs::MetadataExt::ino(&after)
        ),
        before
    );
    assert!(!fgos.paths().breaker().exists());
}

#[test]
fn the_caller_check_runs_again_just_before_hold_1_with_the_adapters_facts() {
    let fgos = TempFgos::new("shell-caller-facts");
    let record = fgos.record();
    let head = Head::spawn();
    let (stdin, _) = payload(files::POST_TOOL_USE);
    // The resolver found the head, but the ancestry read again just before
    // hold 1 has a tool's login shell where the contract's hook shell must be.
    let mut tool_shell = head.ancestry();
    tool_shell.parent_exe = Some("/usr/bin/zsh".into());
    tool_shell.parent_argv0 = Some("/usr/bin/zsh".to_string());

    let mut out = Vec::new();
    let outcome = call(&record, &head, tool_shell, &stdin, &mut out, T0);

    assert_eq!(outcome.quiet, Some(Quiet::NotTheHead));
    assert!(out.is_empty());
    assert!(!fgos.paths().snapshot().exists(), "no record was opened");
}

#[test]
fn a_codex_entry_whose_environment_names_another_session_than_its_payload_is_quiet() {
    use fgos_mailbox::hook::resolve::{resolver_for, HookEnv};
    let fgos = TempFgos::new("shell-codex-env");
    let record = fgos.record();
    let payload = serde_json::to_vec(&fixture(Adapter::Codex, files::POST_TOOL_USE)).unwrap();
    let facts = TestedClis::embedded().facts(Adapter::Codex).unwrap();
    let hook = hook_limits();
    let env = HookEnv {
        home: None,
        claude_config_dir: None,
        session_writer: None,
        session_env: Some("00000000-0000-4000-8000-00000000ffff".to_string()),
    };
    let resolve = resolver_for(Adapter::Codex, facts, &env, &hook.hook);
    let limits = limits();
    let clock = || T0;
    let ancestry = || {
        Some(Ancestry {
            parent: identity_of(ProcId(std::process::id())).unwrap().to_record(),
            parent_relation: fgos_process::facts::relation_of(ProcId(std::process::id())).unwrap(),
            parent_exe: Some("/opt/codex/bin/codex".into()),
            parent_argv0: Some("codex".to_string()),
            grandparent: None,
        })
    };
    let input = ShellInput {
        adapter: Adapter::Codex,
        event: HookEvent::PostToolUse,
        project: "forgent",
        fgos_dir: record.paths().fgos_dir(),
        limits: &limits,
        hook: &hook,
        tested: TestedClis::embedded(),
        clock: &clock,
        ancestry: &ancestry,
        resolve: &resolve,
        handle_of: &|_, _| None,
        gate: WriteGate::new(),
    };
    let mut out = Vec::new();
    let outcome = run(input, &mut &payload[..], &mut out);

    assert_eq!(
        outcome.quiet,
        Some(Quiet::NoHead(fgos_mailbox::head::NoHead::WriterMismatch))
    );
    assert!(out.is_empty() && !fgos.paths().snapshot().exists());
}

#[test]
fn a_malformed_payload_never_opens_or_creates_the_record() {
    let fgos = TempFgos::new("shell-lazy-open");
    let head = Head::spawn();
    let paths = fgos.paths();
    let limits = limits();
    let hook = hook_limits();
    let clock = || T0;
    let ancestry = || Some(head.ancestry());
    let resolve = |_: &[u8], _: &Ancestry| -> Result<Resolved, fgos_mailbox::head::NoHead> {
        Err(fgos_mailbox::head::NoHead::NoWriter)
    };
    for stdin in [&b"not json"[..], b"{}"] {
        let input = ShellInput {
            adapter: Adapter::Claude,
            event: HookEvent::PostToolUse,
            project: "forgent",
            fgos_dir: paths.fgos_dir(),
            limits: &limits,
            hook: &hook,
            tested: TestedClis::embedded(),
            clock: &clock,
            ancestry: &ancestry,
            resolve: &resolve,
            handle_of: &|_, _| None,
            gate: WriteGate::new(),
        };
        let outcome = run(input, &mut &stdin[..], &mut Vec::new());
        assert!(outcome.quiet.is_some());
    }
    assert!(
        !paths.mailbox_dir().exists(),
        "nothing under runtime/mailbox was created"
    );
    assert!(!fgos.fgos_dir().join("runtime").exists());
}

#[test]
fn only_a_call_that_reached_the_record_resets_the_breaker_count() {
    use fgos_mailbox::hook::breaker::Breaker;
    let fgos = TempFgos::new("shell-breaker-reach");
    let record = fgos.record();
    let limits = breaker_limits();
    let panicked = ShellOutcome {
        panicked: true,
        ..ShellOutcome::default()
    };
    for _ in 0..limits.failures - 1 {
        Breaker::load(record.paths(), &limits).after(&panicked, T0);
    }
    let failures = || -> serde_json::Value {
        serde_json::from_slice::<serde_json::Value>(&std::fs::read(fgos.paths().breaker()).unwrap())
            .unwrap()["failures"]
            .clone()
    };
    assert_eq!(failures(), limits.failures - 1);
    // A call that never reached the record (the doctor probe's `{}`, a foreign
    // caller) neither counts nor resets.
    for quiet in [Quiet::NotTheHead, Quiet::OverReadCap, Quiet::NoAncestry] {
        let outcome = ShellOutcome {
            quiet: Some(quiet.clone()),
            ..ShellOutcome::default()
        };
        Breaker::load(record.paths(), &limits).after(&outcome, T0);
        assert_eq!(failures(), limits.failures - 1, "{quiet:?} reset the count");
    }
    let reached = ShellOutcome {
        quiet: Some(Quiet::Drain(QuietReason::NothingEligible)),
        reached_record: true,
        ..ShellOutcome::default()
    };
    Breaker::load(record.paths(), &limits).after(&reached, T0);
    assert_eq!(failures(), 0, "a call through the record resets it");
}

#[test]
fn a_call_that_skipped_or_failed_its_drain_leaves_its_reason_in_the_hook_outcome_file_and_a_benign_one_writes_nothing(
) {
    use fgos_mailbox::hook::outcome_log;
    let fgos = TempFgos::new("shell-outcome-log");
    let record = fgos.record();
    let paths = record.paths();
    let benign = [
        ShellOutcome::default(),
        ShellOutcome {
            quiet: Some(Quiet::Drain(QuietReason::NothingEligible)),
            ..ShellOutcome::default()
        },
        ShellOutcome {
            quiet: Some(Quiet::RunnerHead),
            ..ShellOutcome::default()
        },
    ];
    for outcome in &benign {
        outcome_log::record(paths, Adapter::Claude, HookEvent::PostToolUse, outcome, T0);
    }
    assert!(
        !paths.hook_outcome().exists(),
        "a benign call writes nothing"
    );

    let logged = [
        (Quiet::OverReadCap, "over-read-cap"),
        (Quiet::BreakerOpen, "breaker-open"),
        (Quiet::NotTheHead, "not-the-head"),
        (Quiet::Record("snapshot-newer"), "record:snapshot-newer"),
    ];
    for (quiet, reason) in logged {
        let outcome = ShellOutcome {
            quiet: Some(quiet),
            ..ShellOutcome::default()
        };
        outcome_log::record(paths, Adapter::Codex, HookEvent::Stop, &outcome, T0);
        let line: serde_json::Value =
            serde_json::from_slice(&std::fs::read(paths.hook_outcome()).unwrap()).unwrap();
        assert_eq!(line["reason"], reason);
        assert_eq!(line["cli"], "codex");
        assert_eq!(line["event"], "stop");
        assert_eq!(line["atMs"], T0.as_millis());
    }
    let panicked = ShellOutcome {
        panicked: true,
        ..ShellOutcome::default()
    };
    outcome_log::record(
        paths,
        Adapter::Claude,
        HookEvent::PostToolUse,
        &panicked,
        T0,
    );
    let line: serde_json::Value =
        serde_json::from_slice(&std::fs::read(paths.hook_outcome()).unwrap()).unwrap();
    assert_eq!(line["reason"], "panic");
    let warned = ShellOutcome {
        warnings: vec!["Finish: disk".into()],
        ..ShellOutcome::default()
    };
    outcome_log::record(paths, Adapter::Claude, HookEvent::PostToolUse, &warned, T0);
    let line: serde_json::Value =
        serde_json::from_slice(&std::fs::read(paths.hook_outcome()).unwrap()).unwrap();
    assert_eq!(line["reason"], "warning");
}

#[test]
fn a_hook_call_names_the_head_it_bound_and_reports_it_as_registered_only_when_it_created_or_replaced_the_binding(
) {
    let fgos = TempFgos::new("shell-registered");
    let record = fgos.record();
    let (stdin, writer) = payload(files::POST_TOOL_USE);
    let first_head = Head::spawn();

    let created = call(
        &record,
        &first_head,
        first_head.ancestry(),
        &stdin,
        &mut Vec::new(),
        T0,
    );
    let refreshed = call(
        &record,
        &first_head,
        first_head.ancestry(),
        &stdin,
        &mut Vec::new(),
        T0,
    );
    drop(first_head);
    let second_head = Head::spawn();
    let replaced = call(
        &record,
        &second_head,
        second_head.ancestry(),
        &stdin,
        &mut Vec::new(),
        T0,
    );

    let created = created.bound.expect("the first call bound the head");
    assert_eq!(
        created.registered,
        Some(fgos_mailbox_core::Generation::FIRST)
    );
    assert_eq!(created.writer, writer);
    let refreshed = refreshed
        .bound
        .expect("a refreshing call still names its head");
    assert_eq!(refreshed.registered, None);
    let replaced = replaced.bound.expect("a new head replaced the dead one");
    assert_eq!(
        replaced.registered,
        Some(fgos_mailbox_core::Generation::FIRST.next().unwrap())
    );
    assert_eq!(replaced.head.record, second_head.record());
}

#[test]
fn a_registering_hook_call_emits_no_frame() {
    let fgos = TempFgos::new("shell-registering-quiet");
    let record = fgos.record();
    let first_head = Head::spawn();
    // Mail waits for the first generation; a takeover must never offer it.
    registered_with_mail(&record, &first_head);
    drop(first_head);
    let second_head = Head::spawn();
    let (stdin, _) = payload(files::POST_TOOL_USE);
    let mut stdout = Vec::new();

    let outcome = call(
        &record,
        &second_head,
        second_head.ancestry(),
        &stdin,
        &mut stdout,
        T0,
    );

    assert!(outcome.bound.and_then(|b| b.registered).is_some());
    assert!(stdout.is_empty(), "{}", String::from_utf8_lossy(&stdout));
    assert!(outcome.claimed.is_empty());
}
