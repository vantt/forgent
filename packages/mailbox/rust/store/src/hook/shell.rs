//! The shell around the drain (spec §6.1 shell duties, §8 item 7): every
//! effect of one hook call, in the order `drain.rs` names. An entry (V4's
//! test-only example, V5's host route) wires the real stdin, stdout, clock
//! and process table into [`run`] and exits 0 whatever it returns; it
//! calls [`silence_panics`] and [`arm_budget`] from its `main` only.
//!
//! The order: read stdin with a cap; resolve the writer and the head;
//! read the ancestry again and check that the caller is that head; hold 1
//! runs `begin` and reads each claimed message's size; the bodies are
//! read outside the lock and rendered; stdout is written and flushed; only
//! after a successful write, hold 2 runs `finish`. After a failed write the
//! claim is never finished: it expires and the mail is offered again (the
//! duplicate window of spec §5.2), instead of being marked offered and lost.
use super::{
    begin, finish, render_reply, Adapter, Begun, HeadFacts, HookCall, HookEvent, HookLimits,
    QuietReason,
};
use crate::adapters::TestedClis;
use crate::head::{caller_is_head, Ancestry, NoHead, Topology};
use crate::record::{Record, RecordError, Reported, Wait};
use fgos_mailbox_core::{Limits, MessageId, Timestamp, WriterKey};
use std::collections::BTreeMap;
use std::io::{Read, Write};
use std::panic::{catch_unwind, AssertUnwindSafe};
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
    pub record: &'a Record,
    pub limits: &'a Limits,
    pub hook: &'a HookLimits,
    pub tested: &'a TestedClis,
    pub clock: &'a dyn Fn() -> Timestamp,
    /// Reads the entry's ancestry now; called before the resolver and
    /// again just before hold 1, for the caller check.
    pub ancestry: &'a dyn Fn() -> Option<Ancestry>,
    pub topology: Topology,
    pub resolve: &'a Resolver<'a>,
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
    /// The drain's own reason (a payload over the read cap is `Malformed`).
    Drain(QuietReason),
    /// The entry's ancestry could not be read.
    NoAncestry,
    /// The resolver found no head.
    NoHead(NoHead),
    /// The process at the topology's head position, read again, is not the
    /// head the resolver found: no record is opened.
    NotTheHead,
    /// A hold failed before its commit point; its code.
    Record(&'static str),
}

/// What an entry logs about one call. It carries no body text.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct ShellOutcome {
    pub quiet: Option<Quiet>,
    /// The ids of the claimed items, in frame order.
    pub claimed: Vec<MessageId>,
    /// Whether hold 1 installed a new snapshot.
    pub state_written: bool,
    pub stdout_written: bool,
    /// Whether hold 2 ran `finish` and installed it.
    pub finished: bool,
    pub warnings: Vec<String>,
    pub panicked: bool,
}

/// One hook call. Never panics: a panic anywhere is caught and reported as
/// `panicked`, with nothing further written.
pub fn run(input: ShellInput<'_>, stdin: &mut dyn Read, stdout: &mut dyn Write) -> ShellOutcome {
    catch_unwind(AssertUnwindSafe(|| drive(&input, stdin, stdout))).unwrap_or_else(|_| {
        ShellOutcome {
            panicked: true,
            ..ShellOutcome::default()
        }
    })
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
    let read = stdin.take(cap.saturating_add(1)).read_to_end(&mut payload);
    if read.is_err() || payload.len() as u64 > cap {
        return quiet(Quiet::Drain(QuietReason::Malformed));
    }
    let Some(ancestry) = (input.ancestry)() else {
        return quiet(Quiet::NoAncestry);
    };
    let resolved = match (input.resolve)(&payload, &ancestry) {
        Ok(resolved) => resolved,
        Err(cause) => return quiet(Quiet::NoHead(cause)),
    };
    let again = (input.ancestry)();
    if !again.is_some_and(|a| caller_is_head(&a, input.topology, &resolved.head.record)) {
        return quiet(Quiet::NotTheHead);
    }

    let wait = Wait::Ms(input.hook.hook.lock_wait_ms);
    let call = HookCall {
        adapter: input.adapter,
        event: input.event,
        stdin: &payload,
        writer: resolved.writer,
        project: input.project,
        head: resolved.head,
    };
    let now = (input.clock)();
    let held = input.record.hold(wait, now, input.limits, |state, ids| {
        let begun = begin(
            state,
            &call,
            now,
            input.limits,
            input.hook,
            input.tested,
            ids,
        );
        // The size of each claimed body, read in the hold that claimed it
        // (spec §6.4).
        let sizes: BTreeMap<MessageId, u64> = match &begun {
            Begun::Claimed(claimed) => claimed
                .items
                .iter()
                .filter_map(|item| {
                    state
                        .message(&item.id)
                        .map(|h| (item.id.clone(), h.body_bytes))
                })
                .collect(),
            Begun::Quiet { .. } => BTreeMap::new(),
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
        state_written: held.wrote,
        warnings: held
            .warning
            .iter()
            .map(|w| format!("{:?}: {}", w.step, w.detail))
            .collect(),
        ..ShellOutcome::default()
    };
    let (begun, sizes) = held.value.value;
    let claimed = match begun {
        Begun::Quiet { reason, .. } => {
            outcome.quiet = Some(Quiet::Drain(reason));
            return outcome;
        }
        Begun::Claimed(claimed) => claimed,
    };
    outcome.claimed = claimed.items.iter().map(|item| item.id.clone()).collect();

    let bodies: BTreeMap<MessageId, String> = sizes
        .iter()
        .filter_map(|(id, bytes)| {
            input
                .record
                .body(id, *bytes, input.limits)
                .map(|text| (id.clone(), text))
        })
        .collect();
    let reply = render_reply(&claimed, &|id| bodies.get(id).cloned(), input.limits);

    if !input.gate.begin_write() {
        // The budget passed: the watchdog is ending the process.
        return outcome;
    }
    if stdout
        .write_all(reply.stdout.as_bytes())
        .and_then(|()| stdout.flush())
        .is_err()
    {
        return outcome;
    }
    outcome.stdout_written = true;

    let now = (input.clock)();
    match input.record.hold(wait, now, input.limits, |state, _| {
        finish(state, claimed.ticket(), now)
    }) {
        Ok(held) => {
            outcome.finished = held.wrote;
            outcome.warnings.extend(
                held.warning
                    .iter()
                    .map(|w| format!("{:?}: {}", w.step, w.detail)),
            );
        }
        Err(error) => outcome.warnings.push(format!("finish: {error}")),
    }
    outcome
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
