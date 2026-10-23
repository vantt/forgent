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
use crate::head::{head_text, is_complete, judge_stored, record_of_head_text};
use fgos_mailbox_core::{
    mode_pointer, render, too_large_pointer, AttemptToken, Checkpoint, ClaimedItem, ClaimedWhat,
    Cli, Finished, Generation, IdSource, Limits, MailboxState, MessageId, RegisterRefusal,
    RegisterRequest, Registered, Timestamp, WriterKey, FRAME_SEPARATOR,
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
    /// A `Stop` of a CLI whose Stop channel takes no mail (the adapters
    /// contract's `channels.stop.deliver`): the head is registered, nothing
    /// is claimed and its Stop-block count is never read or written.
    StopChannelOff,
    /// A `PostToolUse` call of a CLI whose adapter has no measured output
    /// bound: nothing is claimed at a step; its mail waits for Stop or
    /// `inbox --claim`.
    NoStepBound,
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
    /// Items left recorded because each is too large alone for the
    /// channel; the reply then ends with the pointer line.
    pub too_large: u32,
    shape: Shape,
    ticket: FinishTicket,
}

/// Why a step drain prints only the pointer line.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PointerReason {
    /// Every pending item is too large alone for the channel.
    TooLarge,
    /// The CLI is in pointer mode (`mailbox.postToolUse.pointerClis`): its
    /// step drain never claims; the model reads its mail with
    /// `inbox --claim`.
    Mode,
}

/// A step drain that writes the pointer line alone and finishes nothing.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PointerOnly {
    pub reason: PointerReason,
    /// The items the line names.
    pub count: u32,
    /// Whether the drain stamped `last_drain_at`: only when the stamp was
    /// older than the newest pending item, so a repeated pointer writes the
    /// snapshot once per new mail.
    changed: bool,
    shape: Shape,
}

impl PointerOnly {
    /// The pointer line in the CLI's output shape.
    pub fn reply(&self) -> HookReply {
        let line = match self.reason {
            PointerReason::TooLarge => too_large_pointer(self.count),
            PointerReason::Mode => mode_pointer(self.count),
        };
        HookReply {
            stdout: self.shape.render(&line),
        }
    }
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
        /// The generation this call created or replaced the binding with;
        /// `None` when the head was already bound (or nothing registered).
        /// A registering call is always quiet: a new generation has no mail.
        registered: Option<Generation>,
    },
    /// A claim to render, write and finish; a claim always changes the
    /// snapshot.
    Claimed(Claimed),
    /// Only the pointer line to write; nothing is claimed.
    Pointer(PointerOnly),
}

impl Begun {
    /// Whether `begin` changed the snapshot, so the shell must write it.
    pub fn state_changed(&self) -> bool {
        match self {
            Self::Quiet { state_changed, .. } => *state_changed,
            Self::Claimed(_) => true,
            Self::Pointer(pointer) => pointer.changed,
        }
    }

    /// Whether the call got past registration: the head is bound to the
    /// record (refreshed, created or replaced).
    pub fn bound(&self) -> bool {
        match self {
            Self::Quiet { reason, .. } => matches!(
                reason,
                QuietReason::StopChannelOff
                    | QuietReason::StopBlockCap
                    | QuietReason::NoStepBound
                    | QuietReason::NothingEligible
            ),
            Self::Claimed(_) | Self::Pointer(_) => true,
        }
    }

    /// The generation a registering call created or replaced.
    pub fn registered(&self) -> Option<Generation> {
        match self {
            Self::Quiet { registered, .. } => *registered,
            Self::Claimed(_) | Self::Pointer(_) => None,
        }
    }
}

/// Derives a sender's Identity handle from its writer key, its CLI and its
/// head process (the binding's stored head, so the handle is the one
/// Identity registered: a shared session variable labels its CLI from that
/// process's ancestry) when a frame is rendered; `None` when it cannot be
/// derived. The wiring builds it from Identity's doors; the store never
/// derives a handle itself.
pub type HandleOf<'a> = dyn Fn(&WriterKey, &Cli, Option<&Record>) -> Option<String> + 'a;

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
        registered: None,
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
    let (generation, registered) = match state.register(request, judged, now, limits, ids) {
        Ok(Registered::Refreshed { generation, .. }) => (generation, None),
        Ok(Registered::Created { generation, .. } | Registered::Replaced { generation, .. }) => {
            (generation, Some(generation))
        }
        Err(refusal) => return quiet(QuietReason::Registration(refusal)),
    };
    let mut changed = registered.is_some();
    let after = |reason, state_changed| Begun::Quiet {
        reason,
        state_changed,
        registered,
    };
    let key = &call.writer;
    let checkpoint = match call.event {
        HookEvent::Stop => {
            // Before the first-Stop reset and the cap: a CLI whose Stop
            // takes no mail never reads or writes its Stop-block count.
            if !tested
                .facts(call.adapter)
                .is_some_and(|facts| facts.stop_delivers)
            {
                return after(QuietReason::StopChannelOff, changed);
            }
            if payload.first_stop == Some(true) {
                changed |= state.note_stop(key, generation, false);
            }
            let blocks = state.binding(key).map_or(0, |b| b.stop_blocks);
            if blocks >= hook.stop_block.max {
                changed |= state.note_stop(key, generation, false);
                return after(QuietReason::StopBlockCap, changed);
            }
            Checkpoint::Stop
        }
        HookEvent::PostToolUse => match tested
            .facts(call.adapter)
            .and_then(|facts| facts.post_tool_use_max_bytes)
        {
            Some(_) if hook.post_tool_use.pointer_clis.contains(&call.adapter) => {
                let pointed = state.point(key, generation, now, limits, ids);
                if pointed.count == 0 {
                    return after(QuietReason::NothingEligible, changed | pointed.changed);
                }
                // A registering call has no mail, so `changed` is the stamp alone.
                return Begun::Pointer(PointerOnly {
                    reason: PointerReason::Mode,
                    count: pointed.count,
                    changed: changed | pointed.changed,
                    shape,
                });
            }
            Some(bound) => Checkpoint::BoundedStep(bound),
            None => return after(QuietReason::NoStepBound, changed),
        },
    };
    let claim = state.claim(key, generation, checkpoint, now, limits, ids);
    changed |= claim.changed;
    let Some(token) = claim.token else {
        if claim.too_large > 0 {
            return Begun::Pointer(PointerOnly {
                reason: PointerReason::TooLarge,
                count: claim.too_large,
                changed,
                shape,
            });
        }
        if checkpoint.is_stop() {
            changed |= state.note_stop(key, generation, false);
        }
        return after(QuietReason::NothingEligible, changed);
    };
    Begun::Claimed(Claimed {
        items: claim.items,
        too_large: claim.too_large,
        shape,
        ticket: FinishTicket {
            key: key.clone(),
            generation,
            token,
            stop_block: checkpoint.is_stop(),
        },
    })
}

/// Outside the mutex: every claimed item's frame, joined by one blank line,
/// then the pointer line when items were left as too large, in the output
/// shape the CLI was recorded injecting. A body the store could not read
/// gets the contract's body-missing line. A sender's handle is derived
/// here, through `handle_of`, for the frame header only.
pub fn render_reply(
    claimed: &Claimed,
    bodies: &dyn Fn(&MessageId) -> Option<String>,
    handle_of: &HandleOf<'_>,
    limits: &Limits,
) -> HookReply {
    let mut parts: Vec<String> = claimed
        .items
        .iter()
        .map(|item| {
            let mut item = item.clone();
            if let ClaimedWhat::Mail(from) = &mut item.what {
                let head = from.head.as_deref().map(record_of_head_text);
                from.handle = from
                    .cli
                    .as_ref()
                    .and_then(|cli| handle_of(&from.key, cli, head.as_ref()));
            }
            render(&item, bodies(&item.id).as_deref(), limits)
        })
        .collect();
    if claimed.too_large > 0 {
        parts.push(too_large_pointer(claimed.too_large));
    }
    HookReply {
        stdout: claimed.shape.render(&parts.join(FRAME_SEPARATOR)),
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

/// What `inbox --claim` found for one caller.
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum InboxClaim {
    /// The caller has no binding.
    NoAddress,
    /// Nothing pending.
    Empty,
    /// Every pending item, to write as plain text and then finish.
    Claimed(Claimed),
}

/// Under mutex hold 1 of `inbox --claim`: every pending item of `key`'s
/// current generation, unbounded (a tool's stdout has no inline limit),
/// claimed like a step drain. Returns whether the state changed.
pub(crate) fn claim_inbox(
    state: &mut MailboxState,
    key: &WriterKey,
    now: Timestamp,
    limits: &Limits,
    ids: &mut dyn IdSource,
) -> (InboxClaim, bool) {
    let Some(generation) = state.binding(key).map(|b| b.generation) else {
        return (InboxClaim::NoAddress, false);
    };
    let claim = state.claim(key, generation, Checkpoint::Step, now, limits, ids);
    let Some(token) = claim.token else {
        return (InboxClaim::Empty, claim.changed);
    };
    let claimed = Claimed {
        items: claim.items,
        too_large: 0,
        shape: Shape::Plain,
        ticket: FinishTicket {
            key: key.clone(),
            generation,
            token,
            stop_block: false,
        },
    };
    (InboxClaim::Claimed(claimed), true)
}
