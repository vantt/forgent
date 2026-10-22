//! The drain of one checkpoint hook call (spec §6.1), as three infallible
//! steps over the mailbox snapshot. The shell around them (V4's test entry,
//! V5's host entry) owns every effect, in this order:
//!
//! 1. Before `begin`, check that the calling process is the head CLI itself
//!    and not a tool process below it: the `agent_id` skip is not a
//!    security boundary, since anything that inherits the head's
//!    environment can pipe a payload into the entry.
//! 2. Take the snapshot mutex (hold 1), call [`begin`], release it.
//! 3. Read the claimed bodies, call [`render_reply`], then write and flush
//!    stdout.
//! 4. Only after a successful write, take the mutex again (hold 2) and call
//!    [`finish`]. After a failed write, never finish: the claim then expires
//!    and the mail is offered again, instead of being marked offered and
//!    lost.
//! 5. Exit 0 in every case, and run the circuit breaker on repeated quiet
//!    reasons.
//!
//! The shell also reads stdin with a cap, resolves the writer key through
//! session identity, finds the head process with the CLI's head finder, and
//! never passes a runner attempt's writer id (V5). The drain opens no
//! mailbox file: the record directory comes from the storage-root owner
//! (`resolve_workspace_root`) to the shell, and the bodies arrive through
//! the `bodies` lookup. It is not pure: when the stored head is not the
//! registering one, [`begin`] asks the process-facts judge, which reads the
//! operating system's process table (`/proc`, the boot id, the host name).
//!
//! The caller check of step 1 must compare the calling process against the
//! head's process record from process facts, not its parent pid alone:
//! `bash -c '… fgos hook mailbox …'` execs its last command, so a tool
//! process's entry can have the head CLI as its parent pid (V5).
use super::{Adapter, HookEvent, HookLimits};
use crate::adapters::{Shape, TestedClis};
use crate::head::{head_text, is_complete, judge_stored};
use fgos_mailbox_core::{
    render, AttemptToken, Checkpoint, ClaimedItem, Finished, Generation, IdSource, Limits,
    MailboxState, MessageId, RegisterRefusal, RegisterRequest, Registered, Timestamp, WriterKey,
};
use fgos_process::facts::Record;

/// The head process of the calling CLI, as the shell found it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HeadFacts {
    /// The head process, never the hook's own process.
    pub record: Record,
    /// The head's own two characters, when its CLI names it (Claude Code).
    pub own_suffix: Option<String>,
    /// The head's native channel, when the shell knows it.
    pub handle: Option<String>,
}

/// One hook call, with everything the shell resolved.
#[derive(Debug, Clone)]
pub struct HookCall<'a> {
    pub adapter: Adapter,
    pub event: HookEvent,
    pub stdin: &'a [u8],
    /// The calling head's writer key, from session identity.
    pub writer: WriterKey,
    /// The main checkout's folder name.
    pub project: &'a str,
    pub head: HeadFacts,
}

/// Why a hook call prints nothing.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum QuietReason {
    Malformed,
    EventMismatch,
    /// A subagent's event, or one that cannot be told to be the head's.
    Subordinate,
    /// The CLI is not listed as tested in the adapters contract, or has no
    /// recorded output shape for this event.
    Untested,
    /// The payload names a session other than the writer key the caller
    /// resolved: the event is not this writer's own.
    WriterMismatch,
    /// The head record names no process (no pid or no start time).
    HeadUnknown,
    Registration(RegisterRefusal),
    NothingEligible,
    StopBlockCap,
}

/// What `finish` needs; only `begin` builds one.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FinishTicket {
    key: WriterKey,
    generation: Generation,
    token: AttemptToken,
    stop_block: bool,
}

impl FinishTicket {
    /// Whether finishing records a Stop block.
    pub fn is_stop_block(&self) -> bool {
        self.stop_block
    }
}

/// A claim that the shell renders, writes and then finishes.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Claimed {
    pub items: Vec<ClaimedItem>,
    shape: Shape,
    ticket: FinishTicket,
}

impl Claimed {
    pub fn ticket(&self) -> &FinishTicket {
        &self.ticket
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Begun {
    /// Nothing to print. `state_changed` tells the shell whether the
    /// snapshot must be written (a registration, a Stop-count change, or a
    /// drain that found mail pending).
    Quiet {
        reason: QuietReason,
        state_changed: bool,
    },
    /// A claim to render, write and finish; a claim always changes the
    /// snapshot.
    Claimed(Claimed),
}

impl Begun {
    /// Whether `begin` changed the snapshot, so the shell must write it.
    pub fn state_changed(&self) -> bool {
        match self {
            Self::Quiet { state_changed, .. } => *state_changed,
            Self::Claimed(_) => true,
        }
    }
}

/// What the shell writes to stdout; empty when quiet.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HookReply {
    pub stdout: String,
}

/// A quiet result that changed nothing.
fn quiet(reason: QuietReason) -> Begun {
    Begun::Quiet {
        reason,
        state_changed: false,
    }
}

/// Under mutex hold 1: parse, skip what is not the head's, register the
/// head, apply the Stop rule and claim. Every quiet reason before the
/// registration leaves the snapshot as it was; the result says whether
/// anything changed. `tested` is the adapters contract's tested list.
pub fn begin(
    state: &mut MailboxState,
    call: &HookCall<'_>,
    now: Timestamp,
    limits: &Limits,
    hook: &HookLimits,
    tested: &TestedClis,
    ids: &mut dyn IdSource,
) -> Begun {
    let payload = match call.adapter.parse(call.event, call.stdin) {
        Ok(payload) => payload,
        Err(super::Unparsed::Malformed) => return quiet(QuietReason::Malformed),
        Err(super::Unparsed::EventMismatch) => return quiet(QuietReason::EventMismatch),
    };
    if payload.subordinate {
        return quiet(QuietReason::Subordinate);
    }
    let (Some(shape), Some(cli), true) = (
        call.adapter.shape(call.event),
        call.adapter.cli(),
        tested.contains(call.adapter),
    ) else {
        return quiet(QuietReason::Untested);
    };
    if payload
        .session
        .as_deref()
        .is_some_and(|session| session != call.writer.as_str())
    {
        return quiet(QuietReason::WriterMismatch);
    }
    if !is_complete(&call.head.record) {
        return quiet(QuietReason::HeadUnknown);
    }
    let judged = state
        .binding(&call.writer)
        .map(|binding| judge_stored(binding, &call.head.record));
    // The payload's session is the writer itself here, so for a CLI whose
    // session id is its native thread handle (Codex) it is the handle.
    let session_handle = payload
        .session
        .clone()
        .filter(|_| call.adapter.session_is_handle());
    let request = RegisterRequest {
        key: call.writer.clone(),
        cli,
        project: call.project.to_string(),
        own_suffix: call.head.own_suffix.clone(),
        head: head_text(&call.head.record),
        handle: call.head.handle.clone().or(session_handle),
    };
    let (generation, mut changed) = match state.register(request, judged, now, limits, ids) {
        Ok(Registered::Refreshed { generation, .. }) => (generation, false),
        Ok(Registered::Created { generation, .. } | Registered::Replaced { generation, .. }) => {
            (generation, true)
        }
        Err(refusal) => return quiet(QuietReason::Registration(refusal)),
    };
    let key = &call.writer;
    let checkpoint = match call.event {
        HookEvent::Stop => {
            if payload.first_stop == Some(true) {
                changed |= state.note_stop(key, generation, false);
            }
            let blocks = state.binding(key).map_or(0, |b| b.stop_blocks);
            if blocks >= hook.stop_block.max {
                changed |= state.note_stop(key, generation, false);
                return Begun::Quiet {
                    reason: QuietReason::StopBlockCap,
                    state_changed: changed,
                };
            }
            Checkpoint::Stop
        }
        HookEvent::PostToolUse => Checkpoint::Step,
    };
    let claim = state.claim(key, generation, checkpoint, now, limits, ids);
    changed |= claim.changed;
    let Some(token) = claim.token else {
        if checkpoint == Checkpoint::Stop {
            changed |= state.note_stop(key, generation, false);
        }
        return Begun::Quiet {
            reason: QuietReason::NothingEligible,
            state_changed: changed,
        };
    };
    Begun::Claimed(Claimed {
        items: claim.items,
        shape,
        ticket: FinishTicket {
            key: key.clone(),
            generation,
            token,
            stop_block: checkpoint == Checkpoint::Stop,
        },
    })
}

/// Outside the mutex: every claimed item's frame, joined by one blank line,
/// in the output shape the CLI was recorded injecting. A body the store
/// could not read gets the contract's body-missing line.
pub fn render_reply(
    claimed: &Claimed,
    bodies: &dyn Fn(&MessageId) -> Option<String>,
    limits: &Limits,
) -> HookReply {
    let frames: Vec<String> = claimed
        .items
        .iter()
        .map(|item| render(item, bodies(&item.id).as_deref(), limits))
        .collect();
    HookReply {
        stdout: claimed.shape.render(&frames.join("\n\n")),
    }
}

/// Under mutex hold 2, only after stdout was written: the claim's items
/// become offered, and a Stop block is counted.
pub fn finish(state: &mut MailboxState, ticket: &FinishTicket, now: Timestamp) -> Finished {
    let finished = state.finish(&ticket.key, ticket.generation, &ticket.token, now);
    if ticket.stop_block {
        state.note_stop(&ticket.key, ticket.generation, true);
    }
    finished
}
