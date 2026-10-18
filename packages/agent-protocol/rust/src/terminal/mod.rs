//! Adapters for the `terminal` launch mode: the agent runs interactively in a
//! pane, and what happens is read off the screen and the detector's verdict.
//! One pure state machine per CLI over [`AgentIo`]; time only passes through
//! `AgentIo::pause`. An adapter never opens a pane, builds argv, changes a
//! timeout or decides a retry beyond the bounded re-type described on
//! [`Terminal::deliver_brief`].
//! Contract: `packages/agent-protocol/contracts/terminal-outcomes.v1.json`.

use std::path::PathBuf;

use serde_json::{json, Value};

use crate::direct::{is_auth_failure, is_quota_limit, newest_result};
use crate::port::{AgentIo, Inspection, IoError, SendInput};

mod agy;
mod claude;
mod codex;
pub mod common;
mod omp;
mod pi;

use common::*;

/// What only a person can fix before the CLI can serve a round.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TerminalBlock {
    TrustDialog,
    Login,
}

impl TerminalBlock {
    pub fn as_str(self) -> &'static str {
        match self {
            TerminalBlock::TrustDialog => "trust-dialog",
            TerminalBlock::Login => "login",
        }
    }
}

/// One outcome per step, exactly the contract's `outcomes`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TerminalOutcome {
    Ready,
    Blocked(TerminalBlock),
    Delivered,
    DeliveryUnknown,
    Completed { result_path: PathBuf },
    NeedsHuman,
}

impl TerminalOutcome {
    /// The wire shape: `{ "outcome": <name>, ...fields }`.
    pub fn to_json(&self) -> Value {
        match self {
            TerminalOutcome::Ready => json!({ "outcome": "ready" }),
            TerminalOutcome::Blocked(reason) => {
                json!({ "outcome": "blocked", "reason": reason.as_str() })
            }
            TerminalOutcome::Delivered => json!({ "outcome": "delivered" }),
            TerminalOutcome::DeliveryUnknown => json!({ "outcome": "delivery-unknown" }),
            TerminalOutcome::Completed { result_path } => {
                json!({ "outcome": "completed", "resultPath": result_path.to_string_lossy() })
            }
            TerminalOutcome::NeedsHuman => json!({ "outcome": "needs-human" }),
        }
    }
}

/// What ended the wait for the prompt, before any brief is typed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Readiness {
    /// A screen rule (or a drawn, still screen) says the prompt takes input.
    Ready,
    /// The detector has no rule for this agent and the screen never settled:
    /// typed at anyway, as the Node controller did.
    Unverified,
    /// The detector has no verdict; typed at without waiting.
    NoDetector,
    Blocked(TerminalBlock),
    /// A dialog that is neither a trust dialog nor a login: only a person can answer it.
    NeedsHuman,
    /// The agent never reached a prompt that takes input. Nothing was typed.
    NotReady,
}

impl Readiness {
    /// The contract outcome for this wait. A pane that never became ready was
    /// never handed the brief, so it reports `delivery-unknown`.
    pub fn outcome(self) -> TerminalOutcome {
        match self {
            Readiness::Ready | Readiness::Unverified | Readiness::NoDetector => {
                TerminalOutcome::Ready
            }
            Readiness::Blocked(reason) => TerminalOutcome::Blocked(reason),
            Readiness::NeedsHuman => TerminalOutcome::NeedsHuman,
            Readiness::NotReady => TerminalOutcome::DeliveryUnknown,
        }
    }

    pub fn takes_brief(self) -> bool {
        matches!(
            self,
            Readiness::Ready | Readiness::Unverified | Readiness::NoDetector
        )
    }
}

/// How the supervisor asks the CLI to leave once the result file exists.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ExitCommand {
    /// Typed, then Enter.
    Text(&'static str),
    /// Sent as keys.
    Keys(&'static [&'static str]),
}

/// The outbox as the adapter sees it: the newest result file that is complete.
pub trait Outbox {
    fn newest_complete(&mut self) -> Option<PathBuf>;
}

/// Reads `launch.outboxDir`. A result counts only when it parses as a JSON
/// object and keeps its size across a short wait: pi creates `result-N.json`
/// empty and fills it a moment later, and only claude publishes by rename.
pub struct FsOutbox {
    dir: PathBuf,
    stable_wait_ms: u64,
}

impl FsOutbox {
    pub fn new(dir: impl Into<PathBuf>) -> Self {
        Self {
            dir: dir.into(),
            stable_wait_ms: 20,
        }
    }
}

impl Outbox for FsOutbox {
    fn newest_complete(&mut self) -> Option<PathBuf> {
        let names: Vec<String> = std::fs::read_dir(&self.dir)
            .ok()?
            .filter_map(|entry| entry.ok()?.file_name().into_string().ok())
            .collect();
        let path = newest_result(&self.dir, names.iter().map(String::as_str))?;
        let first = std::fs::read(&path).ok()?;
        if !serde_json::from_slice::<Value>(&first).ok()?.is_object() {
            return None;
        }
        std::thread::sleep(std::time::Duration::from_millis(self.stable_wait_ms));
        let second = std::fs::read(&path).ok()?;
        (second.len() == first.len()).then_some(path)
    }
}

/// What differs between CLIs; everything else is shared.
pub struct Profile {
    pub cli: &'static str,
    pub exit: ExitCommand,
    /// Gap between typing the brief and pressing Enter. A CLI that reads a
    /// quick text-then-Enter as one paste turns the Enter into a newline.
    pub enter_gap_ms: u64,
    /// The brief goes in one prompt-door send (text plus submit) instead of
    /// typed text, a gap and a separate Enter. For a CLI whose composer
    /// swallows Enter after a long typed paste.
    pub submit_by_prompt_door: bool,
    /// Lowercase wordings of this CLI's folder-trust dialog.
    pub trust_markers: &'static [&'static str],
}

/// The adapter for one CLI.
#[derive(Clone, Copy)]
pub struct Terminal {
    profile: &'static Profile,
}

/// The adapter for an envelope's `agentProtocol.cli`; a CLI without a terminal
/// adapter is refused before launch (`agent-protocol-unsupported`).
pub fn adapter_for(cli: &str) -> Option<Terminal> {
    let profile = match cli.trim().to_ascii_lowercase().as_str() {
        "claude" => &claude::PROFILE,
        "codex" => &codex::PROFILE,
        "agy" => &agy::PROFILE,
        "pi" => &pi::PROFILE,
        "omp" => &omp::PROFILE,
        _ => return None,
    };
    Some(Terminal { profile })
}

fn lines_of_interest(screen: &str) -> Vec<String> {
    bottom_lines(screen, 12)
        .lines()
        .map(|l| l.trim().to_string())
        .collect()
}

impl Terminal {
    pub fn cli(&self) -> &'static str {
        self.profile.cli
    }

    pub fn exit_command(&self) -> ExitCommand {
        self.profile.exit
    }

    /// A dialog or error on screen that only a person can clear.
    pub fn classify_blocked(&self, screen: &str) -> Option<TerminalBlock> {
        let lowered = bottom_lines(screen, 20).to_lowercase();
        if self
            .profile
            .trust_markers
            .iter()
            .any(|marker| lowered.contains(marker))
        {
            return Some(TerminalBlock::TrustDialog);
        }
        lines_of_interest(screen)
            .iter()
            .any(|line| is_auth_failure(line))
            .then_some(TerminalBlock::Login)
    }

    fn blocked_readiness(&self, io: &mut dyn AgentIo) -> Readiness {
        match io
            .screen()
            .ok()
            .and_then(|screen| self.classify_blocked(&screen))
        {
            Some(reason) => Readiness::Blocked(reason),
            None => Readiness::NeedsHuman,
        }
    }

    fn blocked_outcome(&self, io: &mut dyn AgentIo) -> TerminalOutcome {
        match self.blocked_readiness(io) {
            Readiness::Blocked(reason) => TerminalOutcome::Blocked(reason),
            _ => TerminalOutcome::NeedsHuman,
        }
    }

    /// A ready verdict is only believed when the screen shows neither a trust
    /// dialog nor a dead login.
    fn ready_gate(&self, io: &mut dyn AgentIo, verdict: Readiness) -> Readiness {
        // A dialog can open over a prompt that already looked ready (codex asks about the folder a
        // moment after its first screen), so the detector is asked again after the settle wait.
        if io
            .inspect()
            .is_ok_and(|seen| seen.visible_blocker || seen.state.as_deref() == Some("blocked"))
        {
            return self.blocked_readiness(io);
        }
        match io
            .screen()
            .ok()
            .and_then(|screen| self.classify_blocked(&screen))
        {
            Some(reason) => Readiness::Blocked(reason),
            None => verdict,
        }
    }

    /// Wait until the prompt is up and takes input, before the brief is typed.
    ///
    /// The detector says `idle` both for an agent whose prompt is up and, for
    /// an agent it has no screen rule for, for a process that has not drawn
    /// its UI yet. A rule (or a visible idle prompt) is trusted; without one
    /// the screen has to change from the launch and then hold still for a
    /// settle period. A blocking dialog stops the wait at once (typing at it
    /// answers it), and so does a detector with no verdict.
    pub fn await_ready(&self, io: &mut dyn AgentIo, ready_ms: u64) -> Readiness {
        let deadline = io.now_ms() + ready_ms;
        let mut launch_screen: Option<String> = None;
        let mut last_screen: Option<String> = None;
        let mut stable_since: Option<u64> = None;
        let mut unruled_since: Option<u64> = None;
        loop {
            let seen = match io.inspect() {
                Ok(seen) => seen,
                Err(_) => return Readiness::NoDetector,
            };
            let Some(state) = seen.state.as_deref() else {
                return Readiness::NoDetector;
            };
            if seen.visible_blocker || state == "blocked" {
                return self.blocked_readiness(io);
            }
            if state == "idle" && !seen.visible_working {
                if seen.matched_rule || seen.visible_idle {
                    io.pause(PROMPT_SETTLE_MS);
                    return self.ready_gate(io, Readiness::Ready);
                }
                let since = *unruled_since.get_or_insert_with(|| io.now_ms());
                let Ok(screen) = io.screen() else {
                    io.pause(PROMPT_SETTLE_MS);
                    return Readiness::Ready;
                };
                if let Some(reason) = self.classify_blocked(&screen) {
                    return Readiness::Blocked(reason);
                }
                if io.now_ms().saturating_sub(since) >= UNRULED_READY_MS.min(ready_ms) {
                    return Readiness::Unverified;
                }
                match &launch_screen {
                    None => launch_screen = Some(screen.clone()),
                    Some(launch) if &screen != launch && last_screen.as_ref() == Some(&screen) => {
                        let stable = *stable_since.get_or_insert_with(|| io.now_ms());
                        if io.now_ms().saturating_sub(stable) >= PROMPT_SETTLE_MS {
                            return Readiness::Ready;
                        }
                    }
                    Some(_) => stable_since = None,
                }
                last_screen = Some(screen);
            }
            if io.now_ms() >= deadline {
                return Readiness::NotReady;
            }
            io.pause(POLL_MS);
        }
    }

    fn type_brief(&self, io: &mut dyn AgentIo, message: &str) -> Result<(), IoError> {
        io.send(&SendInput {
            text: Some(message.to_string()),
            keys: None,
            submit: false,
        })
    }

    fn submit_brief(&self, io: &mut dyn AgentIo, message: &str) -> Result<(), IoError> {
        io.send(&SendInput {
            text: Some(message.to_string()),
            keys: None,
            submit: true,
        })
    }

    fn press_enter(&self, io: &mut dyn AgentIo) -> Result<(), IoError> {
        io.send(&SendInput {
            text: None,
            keys: Some(vec!["Enter".to_string()]),
            submit: false,
        })
    }

    /// Deliver the brief and confirm it, re-typing only when sure it was not
    /// taken: the typing call itself failed AND the pane is still showing what
    /// it showed before, idle, with no draft in the composer. At most
    /// `MAX_RESENDS` re-types; a brief whose typing call succeeded is never
    /// typed again, however quiet the screen stays.
    pub fn deliver_brief(
        &self,
        io: &mut dyn AgentIo,
        message: &str,
        outbox: &mut dyn Outbox,
    ) -> TerminalOutcome {
        let before = io.screen().unwrap_or_default();
        let mut resends = 0;
        loop {
            let sent = if self.profile.submit_by_prompt_door {
                self.submit_brief(io, message)
            } else {
                self.type_brief(io, message)
            };
            match sent {
                Ok(()) => {
                    if !self.profile.submit_by_prompt_door {
                        io.pause(self.profile.enter_gap_ms);
                        // A lost Enter leaves the draft in the composer; the confirm loop presses it again.
                        let _ = self.press_enter(io);
                    }
                    return self.confirm_submitted(io, message, outbox);
                }
                Err(_) => {
                    // A refused call may still have reached the CLI; give the
                    // TUI a render interval before judging the pane untouched.
                    io.pause(POLL_MS);
                    if resends >= MAX_RESENDS || !self.surely_untouched(io, message, &before) {
                        return TerminalOutcome::DeliveryUnknown;
                    }
                    resends += 1;
                }
            }
        }
    }

    fn surely_untouched(&self, io: &mut dyn AgentIo, message: &str, before: &str) -> bool {
        let Ok(now) = io.screen() else { return false };
        let Ok(seen) = io.inspect() else { return false };
        now == before
            && seen.state.as_deref() == Some("idle")
            && !seen.visible_working
            && !seen.visible_blocker
            && !draft_still_in_composer(message, &seen.prompt_text, &now)
    }

    /// After the brief is typed, make sure the CLI took it: an unsent draft or
    /// collapsed paste chip left in the composer is submitted with Enter
    /// (bounded, spaced). `Delivered` means the CLI shows working or an empty
    /// composer with the brief echoed in its conversation, or a complete result
    /// already exists; anything else it cannot confirm is `DeliveryUnknown`.
    pub fn confirm_submitted(
        &self,
        io: &mut dyn AgentIo,
        message: &str,
        outbox: &mut dyn Outbox,
    ) -> TerminalOutcome {
        let deadline = io.now_ms() + SUBMIT_CONFIRM_MS;
        let mut enters = 0;
        let mut last_enter: Option<u64> = None;
        let mut no_draft = 0;
        let mut working_since: Option<u64> = None;
        while io.now_ms() < deadline {
            if outbox.newest_complete().is_some() {
                return TerminalOutcome::Delivered;
            }
            let seen: Inspection = match io.inspect() {
                Ok(seen) => seen,
                Err(_) => return TerminalOutcome::DeliveryUnknown,
            };
            let Some(state) = seen.state.as_deref() else {
                return TerminalOutcome::DeliveryUnknown;
            };
            if seen.visible_blocker || state == "blocked" {
                return self.blocked_outcome(io);
            }
            // The TUI shows `working` while it takes in a long paste, before the Enter has submitted
            // anything. A working agent counts as having the brief when the composer no longer holds
            // it, or when it keeps working for longer than a paste takes to be ingested.
            if seen.visible_working || state == "working" {
                let screen = io.screen().unwrap_or_default();
                if !draft_still_in_composer(message, &seen.prompt_text, &screen) {
                    return TerminalOutcome::Delivered;
                }
                let since = *working_since.get_or_insert(io.now_ms());
                if io.now_ms().saturating_sub(since) >= SUBMIT_WORKING_MS {
                    return TerminalOutcome::Delivered;
                }
                io.pause(POLL_MS);
                continue;
            }
            working_since = None;
            let idle = state == "idle";
            let mut screen = String::new();
            if idle {
                // The detector's prompt text can be the window title, not the composer: look at the screen.
                screen = io.screen().unwrap_or_default();
                if seen.prompt_text.is_empty() && has_working_tail(&bottom_lines(&screen, 6)) {
                    return TerminalOutcome::Delivered;
                }
            }
            let draft = idle && draft_still_in_composer(message, &seen.prompt_text, &screen);
            no_draft = if draft { 0 } else { no_draft + 1 };
            if !draft && no_draft >= SUBMIT_NO_DRAFT_POLLS {
                let shown = if screen.is_empty() {
                    io.screen().unwrap_or_default()
                } else {
                    screen
                };
                return if brief_echoed(message, &shown) {
                    TerminalOutcome::Delivered
                } else {
                    TerminalOutcome::DeliveryUnknown
                };
            }
            if draft {
                if enters >= SUBMIT_MAX_ENTERS {
                    return TerminalOutcome::DeliveryUnknown;
                }
                let now = io.now_ms();
                if last_enter.is_none_or(|at| now.saturating_sub(at) >= SUBMIT_ENTER_EVERY_MS) {
                    if self.press_enter(io).is_err() {
                        return TerminalOutcome::DeliveryUnknown;
                    }
                    enters += 1;
                    last_enter = Some(now);
                }
            }
            io.pause(POLL_MS);
        }
        TerminalOutcome::DeliveryUnknown
    }

    /// One look while the agent works: a complete result file wins over
    /// anything on screen; otherwise a dialog or a provider limit the agent
    /// cannot get past without a person ends the wait. `None` keeps waiting.
    pub fn detect_completed(
        &self,
        io: &mut dyn AgentIo,
        outbox: &mut dyn Outbox,
    ) -> Option<TerminalOutcome> {
        if let Some(result_path) = outbox.newest_complete() {
            return Some(TerminalOutcome::Completed { result_path });
        }
        let seen = io.inspect().ok()?;
        let state = seen.state.as_deref()?;
        if seen.visible_blocker || state == "blocked" {
            return Some(self.blocked_outcome(io));
        }
        if state != "working" && !seen.visible_working {
            let screen = io.screen().ok()?;
            if lines_of_interest(&screen)
                .iter()
                .any(|line| is_quota_limit(line))
            {
                return Some(TerminalOutcome::NeedsHuman);
            }
        }
        None
    }
}

/// The brief shows in the conversation: its first or last 24 characters
/// (whitespace removed) are on screen.
fn brief_echoed(message: &str, screen: &str) -> bool {
    let chars: Vec<char> = squash(message).chars().collect();
    if chars.is_empty() {
        return false;
    }
    let head: String = chars.iter().take(24).collect();
    let tail: String = chars[chars.len().saturating_sub(24)..].iter().collect();
    let screen = squash(screen);
    screen.contains(&head) || screen.contains(&tail)
}
