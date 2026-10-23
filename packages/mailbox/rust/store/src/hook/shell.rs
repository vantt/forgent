//! The shell around the drain (spec §6.1 shell duties, §8 item 7): every
//! effect of one hook call, in the order `drain.rs` names. An entry (V4's
//! test-only example, V5's host route) wires the real stdin, stdout, clock
//! and process table into [`run`] and exits 0 whatever it returns; it
//! calls [`silence_panics`] and [`arm_budget`] from its `main` only.
//!
//! The order: read stdin with a cap (a larger payload skips the drain); resolve the writer and the head;
//! read the ancestry again and check that the caller is that head; hold 1
//! runs `begin` and reads each claimed message's size; the bodies are
//! read outside the lock and rendered; stdout is written and flushed; only
//! after a successful write, hold 2 runs `finish`. After a failed write the
//! claim is never finished: it expires and the mail is offered again (the
//! duplicate window of spec §5.2), instead of being marked offered and lost.
use super::breaker::Breaker;
use super::{
    begin, finish, render_reply, Adapter, Begun, Claimed, HandleOf, HeadFacts, HookCall, HookEvent,
    HookLimits, QuietReason,
};
use crate::adapters::TestedClis;
use crate::head::{caller_is_head, Ancestry, NoHead};
use crate::record::{Paths, Record, RecordError, Reported, Wait};
use fgos_mailbox_core::{Limits, MessageId, Timestamp, WriterKey};
use std::collections::BTreeMap;
use std::io::{Read, Write};
use std::panic::{catch_unwind, AssertUnwindSafe};
use std::path::Path;
use std::sync::atomic::{AtomicU8, Ordering};
use std::sync::Arc;
use std::time::Duration;

/// The writer and the head a resolver found for one call.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Resolved {
    pub writer: WriterKey,
    pub head: HeadFacts,
}

/// Finds the writer and the head from the payload and the ancestry; the
/// entry decides how (Claude Code: session identity's writer and the
/// session-file finder). The shell never names a CLI.
pub type Resolver<'a> = dyn Fn(&[u8], &Ancestry) -> Result<Resolved, NoHead> + 'a;

/// Everything one call needs besides stdin and stdout.
pub struct ShellInput<'a> {
    pub adapter: Adapter,
    pub event: HookEvent,
    /// The main checkout's folder name.
    pub project: &'a str,
    /// The `.fgos` directory of the record. The record is opened (and its
    /// directories created) only after the payload parsed, the resolver
    /// found the head and the caller check passed, so a malformed or foreign
    /// call creates nothing and takes no lock.
    pub fgos_dir: &'a Path,
    pub limits: &'a Limits,
    pub hook: &'a HookLimits,
    pub tested: &'a TestedClis,
    pub clock: &'a dyn Fn() -> Timestamp,
    /// Reads the entry's ancestry now; called before the resolver and
    /// again just before hold 1, for the caller check.
    pub ancestry: &'a dyn Fn() -> Option<Ancestry>,
    pub resolve: &'a Resolver<'a>,
    /// Derives a sender's handle for a frame header (see [`HandleOf`]).
    pub handle_of: &'a HandleOf<'a>,
    /// Shared with the budget watchdog: the shell writes stdout only after
    /// it moved the gate from idle to writing, and the watchdog ends the
    /// process only after it moved it from idle to done.
    pub gate: WriteGate,
}

/// The state of a [`WriteGate`].
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GateState {
    /// Neither the write nor the watchdog's exit has started.
    Idle,
    /// The shell is writing stdout, or has written it: the watchdog stays.
    Writing,
    /// The budget passed and the watchdog ends the process: no write starts.
    Done,
}

/// The one flag the shell and the budget watchdog decide by. Each side
/// moves it out of idle by compare-and-swap, so exactly one of them wins:
/// the process can never end in the middle of a stdout write, and a write
/// never starts once the watchdog has begun to end the process.
#[derive(Debug, Clone, Default)]
pub struct WriteGate(Arc<AtomicU8>);

const IDLE: u8 = 0;
const WRITING: u8 = 1;
const DONE: u8 = 2;

impl WriteGate {
    pub fn new() -> Self {
        Self::default()
    }

    /// Idle to writing; `false` when the watchdog got there first.
    pub fn begin_write(&self) -> bool {
        self.swap_from_idle(WRITING)
    }

    /// Idle to done; `false` when a write has started.
    pub fn claim_exit(&self) -> bool {
        self.swap_from_idle(DONE)
    }

    pub fn state(&self) -> GateState {
        match self.0.load(Ordering::SeqCst) {
            IDLE => GateState::Idle,
            WRITING => GateState::Writing,
            _ => GateState::Done,
        }
    }

    fn swap_from_idle(&self, to: u8) -> bool {
        self.0
            .compare_exchange(IDLE, to, Ordering::SeqCst, Ordering::SeqCst)
            .is_ok()
    }
}

/// Why a call printed nothing.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Quiet {
    /// The drain's own reason.
    Drain(QuietReason),
    /// The stdin payload is larger than `mailbox.hook.maxReadBytes`: the
    /// drain is skipped, nothing is read further and the mail stays
    /// pending; the entry logs this reason.
    OverReadCap,
    /// The entry's ancestry could not be read.
    NoAncestry,
    /// The resolver found no head.
    NoHead(NoHead),
    /// The process at the topology's head position, read again, is not the
    /// head the resolver found: no record is opened.
    NotTheHead,
    /// A hold failed before its commit point; its code.
    Record(&'static str),
    /// The circuit breaker is open: the drain is skipped before stdin is
    /// read.
    BreakerOpen,
    /// The resolved writer is a runner attempt's (`att-…`): a runner head
    /// is never registered and drains nothing.
    RunnerHead,
}

/// A head this call bound to a new generation (created or replaced): what
/// the entry needs to make sure Identity knows it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegisteredHead {
    pub generation: fgos_mailbox_core::Generation,
    pub writer: WriterKey,
    pub head: HeadFacts,
}

/// What an entry logs about one call. It carries no body text.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct ShellOutcome {
    pub quiet: Option<Quiet>,
    /// Set only by a call that created or replaced the head's binding.
    pub registered: Option<RegisteredHead>,
    /// The ids of the claimed items, in frame order.
    pub claimed: Vec<MessageId>,
    /// Whether hold 1 installed a new snapshot.
    pub state_written: bool,
    pub stdout_written: bool,
    /// Whether hold 2 ran `finish` and installed it.
    pub finished: bool,
    /// Whether hold 1 ran: the call read the record.
    pub reached_record: bool,
    pub warnings: Vec<String>,
    pub panicked: bool,
}

/// One hook call. Never panics: a panic anywhere is caught and reported as
/// `panicked`, with nothing further written.
///
/// The circuit breaker is read first: while it is open the call answers
/// quiet before reading stdin. After the call, the outcome is counted.
pub fn run(input: ShellInput<'_>, stdin: &mut dyn Read, stdout: &mut dyn Write) -> ShellOutcome {
    let paths = Paths::new(input.fgos_dir);
    let breaker = catch_unwind(AssertUnwindSafe(|| {
        Breaker::load(&paths, &input.hook.hook.breaker)
    }))
    .ok();
    if breaker
        .as_ref()
        .is_some_and(|breaker| breaker.is_open((input.clock)()))
    {
        return quiet(Quiet::BreakerOpen);
    }
    let outcome =
        catch_unwind(AssertUnwindSafe(|| drive(&input, stdin, stdout))).unwrap_or_else(|_| {
            ShellOutcome {
                panicked: true,
                ..ShellOutcome::default()
            }
        });
    if let Some(breaker) = breaker {
        let _ = catch_unwind(AssertUnwindSafe(|| {
            breaker.after(&outcome, (input.clock)());
        }));
    }
    outcome
}

fn quiet(reason: Quiet) -> ShellOutcome {
    ShellOutcome {
        quiet: Some(reason),
        ..ShellOutcome::default()
    }
}

fn drive(input: &ShellInput<'_>, stdin: &mut dyn Read, stdout: &mut dyn Write) -> ShellOutcome {
    let cap = input.hook.hook.max_read_bytes;
    let mut payload = Vec::new();
    if stdin
        .take(cap.saturating_add(1))
        .read_to_end(&mut payload)
        .is_err()
    {
        return quiet(Quiet::Drain(QuietReason::Malformed));
    }
    if payload.len() as u64 > cap {
        return quiet(Quiet::OverReadCap);
    }
    let Some(ancestry) = (input.ancestry)() else {
        return quiet(Quiet::NoAncestry);
    };
    let resolved = match (input.resolve)(&payload, &ancestry) {
        Ok(resolved) => resolved,
        Err(cause) => return quiet(Quiet::NoHead(cause)),
    };
    if fgos_identity::is_attempt_writer_id(resolved.writer.as_str()) {
        return quiet(Quiet::RunnerHead);
    }
    let Some(facts) = input.tested.facts(input.adapter) else {
        return quiet(Quiet::Drain(QuietReason::Untested));
    };
    let again = (input.ancestry)();
    if !again.is_some_and(|a| caller_is_head(&a, facts, &resolved.head.record)) {
        return quiet(Quiet::NotTheHead);
    }
    let record = match Record::open(input.fgos_dir) {
        Ok(record) => record,
        Err(error) => return quiet(Quiet::Record(record_code(&error))),
    };

    let wait = Wait::Ms(input.hook.hook.lock_wait_ms);
    let call = HookCall {
        adapter: input.adapter,
        event: input.event,
        stdin: &payload,
        writer: resolved.writer.clone(),
        project: input.project,
        head: resolved.head.clone(),
    };
    let now = (input.clock)();
    let held = record.hold(wait, now, input.limits, |state, ids| {
        let begun = begin(
            state,
            &call,
            now,
            input.limits,
            input.hook,
            input.tested,
            ids,
        );
        let sizes = match &begun {
            Begun::Claimed(claimed) => claimed_sizes(state, claimed),
            Begun::Quiet { .. } | Begun::Pointer(_) => BTreeMap::new(),
        };
        let changed = begun.state_changed();
        Reported {
            value: (begun, sizes),
            changed,
        }
    });
    let held = match held {
        Ok(held) => held,
        Err(error) => return quiet(Quiet::Record(record_code(&error))),
    };
    let mut outcome = ShellOutcome {
        reached_record: true,
        state_written: held.wrote,
        warnings: held
            .warning
            .iter()
            .map(|w| format!("{:?}: {}", w.step, w.detail))
            .collect(),
        ..ShellOutcome::default()
    };
    let (begun, sizes) = held.value.value;
    outcome.registered = begun.registered().map(|generation| RegisteredHead {
        generation,
        writer: resolved.writer,
        head: resolved.head,
    });
    let claimed = match begun {
        Begun::Quiet { reason, .. } => {
            outcome.quiet = Some(Quiet::Drain(reason));
            return outcome;
        }
        Begun::Pointer(pointer) => {
            // Nothing was claimed, so nothing is finished.
            outcome.stdout_written = write_reply(&input.gate, stdout, &pointer.reply().stdout);
            return outcome;
        }
        Begun::Claimed(claimed) => claimed,
    };
    outcome.claimed = claimed.items.iter().map(|item| item.id.clone()).collect();
    let emitted = emit_and_finish(
        &Emit {
            record: &record,
            wait,
            limits: input.limits,
            clock: input.clock,
            gate: &input.gate,
            handle_of: input.handle_of,
        },
        &claimed,
        &sizes,
        stdout,
    );
    outcome.stdout_written = emitted.stdout_written;
    outcome.finished = emitted.finished;
    outcome.warnings.extend(emitted.warnings);
    outcome
}

/// What [`emit_and_finish`] needs besides the claim.
pub(crate) struct Emit<'a> {
    pub record: &'a Record,
    pub wait: Wait,
    pub limits: &'a Limits,
    pub clock: &'a dyn Fn() -> Timestamp,
    pub gate: &'a WriteGate,
    pub handle_of: &'a HandleOf<'a>,
}

/// What the write and the finish did.
pub(crate) struct Emitted {
    pub stdout_written: bool,
    pub finished: bool,
    pub warnings: Vec<String>,
}

/// After hold 1, outside the lock: read the claimed bodies, render, write
/// and flush stdout, and only after a successful write take hold 2 to
/// finish. A failed write never finishes. The one write-then-finish order,
/// shared by the hook and `inbox --claim`.
pub(crate) fn emit_and_finish(
    emit: &Emit<'_>,
    claimed: &Claimed,
    sizes: &BTreeMap<MessageId, u64>,
    stdout: &mut dyn Write,
) -> Emitted {
    let mut emitted = Emitted {
        stdout_written: false,
        finished: false,
        warnings: Vec::new(),
    };
    let bodies: BTreeMap<MessageId, String> = sizes
        .iter()
        .filter_map(|(id, bytes)| {
            emit.record
                .body(id, *bytes, emit.limits)
                .map(|text| (id.clone(), text))
        })
        .collect();
    let reply = render_reply(
        claimed,
        &|id| bodies.get(id).cloned(),
        emit.handle_of,
        emit.limits,
    );
    if !write_reply(emit.gate, stdout, &reply.stdout) {
        return emitted;
    }
    emitted.stdout_written = true;

    let now = (emit.clock)();
    match emit.record.hold(emit.wait, now, emit.limits, |state, _| {
        finish(state, claimed.ticket(), now)
    }) {
        Ok(held) => {
            emitted.finished = held.wrote;
            emitted.warnings.extend(
                held.warning
                    .iter()
                    .map(|w| format!("{:?}: {}", w.step, w.detail)),
            );
        }
        Err(error) => emitted.warnings.push(format!("finish: {error}")),
    }
    emitted
}

/// The sizes of the claimed bodies, read in the hold that claimed them
/// (spec §6.4).
pub(crate) fn claimed_sizes(
    state: &fgos_mailbox_core::MailboxState,
    claimed: &Claimed,
) -> BTreeMap<MessageId, u64> {
    claimed
        .items
        .iter()
        .filter_map(|item| {
            state
                .message(&item.id)
                .map(|h| (item.id.clone(), h.body_bytes))
        })
        .collect()
}

/// Writes and flushes `text` once the gate moved from idle to writing;
/// `false` when the watchdog got there first (the budget passed and the
/// process is ending) or the write failed.
fn write_reply(gate: &WriteGate, stdout: &mut dyn Write, text: &str) -> bool {
    gate.begin_write()
        && stdout
            .write_all(text.as_bytes())
            .and_then(|()| stdout.flush())
            .is_ok()
}

fn record_code(error: &RecordError) -> &'static str {
    error.code()
}

/// Entry only: a panic writes nothing to stderr (the CLI shows a hook's
/// stderr), so only the outcome the entry logs reports it.
pub fn silence_panics() {
    std::panic::set_hook(Box::new(|_| {}));
}

/// Entry only: when `budget` passes, claim `gate` and, when the claim
/// wins, run `on_exit` and end the process with status 0. When the stdout
/// write has started the claim loses and the write is left to finish: a
/// cut-off stdout would hand the CLI a truncated document with status 0,
/// which is worse than a late one (the CLI's own hook timeout still bounds
/// it).
pub fn arm_budget(budget: Duration, gate: WriteGate, on_exit: impl FnOnce() + Send + 'static) {
    std::thread::spawn(move || {
        std::thread::sleep(budget);
        if !gate.claim_exit() {
            return;
        }
        on_exit();
        std::process::exit(0);
    });
}
