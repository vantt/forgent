//! The agent protocol's port over a pane by key: `send`, `screen`, `inspect`. The one copy of these
//! three core calls; the run supervisor's `TermIo` wraps it, adding its own watch.

use crate::panes::Panes;
use fgos_agent_protocol::terminal::{Outbox, TerminalOutcome};
use fgos_agent_protocol::{AgentIo, Inspection, IoError, SendInput};
use fgos_terminal_control::core::Want;
use fgos_terminal_control::port::{PaneState, SendOutcome};
use std::path::PathBuf;

pub struct PaneIo<'a> {
    panes: &'a dyn Panes,
    key: &'a str,
    /// Replaces the real sleep, so a test sees each wait instead of spending it.
    pause: Option<&'a dyn Fn(u64)>,
}

impl<'a> PaneIo<'a> {
    pub fn new(panes: &'a dyn Panes, key: &'a str) -> Self {
        PaneIo {
            panes,
            key,
            pause: None,
        }
    }

    /// This pane's waits go to `pause` instead of sleeping.
    pub fn with_pause(mut self, pause: &'a dyn Fn(u64)) -> Self {
        self.pause = Some(pause);
        self
    }

    fn wait(&self, ms: u64) {
        match self.pause {
            Some(pause) => pause(ms),
            None => std::thread::sleep(std::time::Duration::from_millis(ms)),
        }
    }
}

fn io_err(refusal: impl std::fmt::Debug) -> IoError {
    IoError::Io(format!("{refusal:?}"))
}

/// Why a send through a pane typed nothing or failed.
#[derive(Debug)]
pub enum SendFailure {
    /// Nothing was typed: the agent is not the pane's foreground program, so it cannot take text.
    ForegroundNotAgent { reason: String },
    /// The send could not be made or confirmed.
    Io(IoError),
}

/// The answer of the one gate-and-submit call over a pane.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TypedWake {
    /// The pane showed the CLI took the line.
    Submitted,
    /// Nothing was typed. `draft` is the text a `composer-not-empty` refusal read in the composer.
    Refused {
        cause: &'static str,
        draft: Option<String>,
    },
    /// The line was typed, but the pane did not confirm the CLI took it.
    DeliveryUnknown,
}

impl TypedWake {
    /// The name of the answer: `submitted`, the refusal's cause, or `delivery-unknown`.
    pub fn cause(&self) -> &'static str {
        match self {
            TypedWake::Submitted => "submitted",
            TypedWake::Refused { cause, .. } => cause,
            TypedWake::DeliveryUnknown => "delivery-unknown",
        }
    }

    fn refused(cause: &'static str) -> Self {
        TypedWake::Refused { cause, draft: None }
    }
}

/// An outbox that never holds a result: a wake line is not a brief with a result file.
struct NoOutbox;

impl Outbox for NoOutbox {
    fn newest_complete(&mut self, _: &mut dyn AgentIo) -> Option<PathBuf> {
        None
    }
}

impl PaneIo<'_> {
    /// The one gate-and-submit call. Types only after two idle, empty, dialog-free observations at
    /// the pinned CLI version, then sends the raw text, waits the profile's `enter_gap_ms`, sends a
    /// separate `Enter`, and confirms the CLI took the line. Never the focus-moving prompt door.
    /// The external observation/type race remains.
    pub fn typed_wake(&self, cli: &str, version: Option<&str>, line: &str) -> TypedWake {
        use fgos_agent_protocol::terminal::{adapter_for, ComposerState};
        let Some(protocol) = adapter_for(cli) else {
            return TypedWake::refused("no-cli-profile");
        };
        if version != Some(protocol.pinned_version()) {
            return TypedWake::refused("unknown");
        }
        for _ in 0..2 {
            let inspection = match self.observe() {
                Ok(inspection) => inspection,
                Err(cause) => return TypedWake::refused(cause),
            };
            let Ok(screen) = self.panes.read(self.key, Some("visible")) else {
                return TypedWake::refused("unknown");
            };
            if inspection.visible_blocker || protocol.classify_blocked(&screen).is_some() {
                return TypedWake::refused("dialog-open");
            }
            match inspection.state.as_deref() {
                Some("idle") if !inspection.visible_working => {}
                Some("busy" | "working") => return TypedWake::refused("busy"),
                _ if inspection.visible_working => return TypedWake::refused("busy"),
                _ => return TypedWake::refused("unknown"),
            }
            match protocol.composer_state(&screen, &inspection) {
                ComposerState::Empty => {}
                ComposerState::NotEmpty => {
                    let draft = Some(inspection.prompt_text.trim().to_owned())
                        .filter(|text| !text.is_empty());
                    return TypedWake::Refused {
                        cause: "composer-not-empty",
                        draft,
                    };
                }
                ComposerState::Unknown => return TypedWake::refused("unknown"),
            }
        }
        match self.panes.send(self.key, Some(line), None, false) {
            Ok(SendOutcome::Sent) => {}
            Ok(SendOutcome::ForegroundNotAgent { .. }) => {
                return TypedWake::refused("foreground-not-agent")
            }
            Err(_) => return TypedWake::refused("unknown"),
        }
        // Let the CLI finish its paste before Enter, without routing through agent prompt.
        self.wait(protocol.enter_gap_ms());
        let enter = ["Enter".to_owned()];
        if !matches!(
            self.panes.send(self.key, None, Some(&enter), false),
            Ok(SendOutcome::Sent)
        ) {
            return TypedWake::DeliveryUnknown;
        }
        let mut io = PaneIo {
            panes: self.panes,
            key: self.key,
            pause: self.pause,
        };
        match protocol.confirm_submitted(&mut io, line, &mut NoOutbox) {
            TerminalOutcome::Delivered => TypedWake::Submitted,
            _ => TypedWake::DeliveryUnknown,
        }
    }

    /// `AgentIo::send` with the "not the foreground program" answer kept apart from a failed send.
    pub fn send_typed(&self, input: &SendInput) -> Result<(), SendFailure> {
        match self
            .panes
            .send(
                self.key,
                input.text.as_deref(),
                input.keys.as_deref(),
                input.submit,
            )
            .map_err(io_err)
            .map_err(SendFailure::Io)?
        {
            SendOutcome::Sent => Ok(()),
            SendOutcome::ForegroundNotAgent { reason } => {
                Err(SendFailure::ForegroundNotAgent { reason })
            }
        }
    }
}

impl AgentIo for PaneIo<'_> {
    fn send(&mut self, input: &SendInput) -> Result<(), IoError> {
        self.send_typed(input).map_err(|failure| match failure {
            SendFailure::ForegroundNotAgent { reason } => {
                IoError::Io(format!("nothing was typed: {reason}"))
            }
            SendFailure::Io(e) => e,
        })
    }

    fn screen(&mut self) -> Result<String, IoError> {
        self.panes.read(self.key, Some("visible")).map_err(io_err)
    }

    fn inspect(&mut self) -> Result<Inspection, IoError> {
        self.observe()
            .map_err(|_| IoError::Io("the pane gave no activity".into()))
    }

    fn pause(&mut self, ms: u64) {
        self.wait(ms);
    }
}

impl PaneIo<'_> {
    fn observe(&self) -> Result<Inspection, &'static str> {
        let seen = self.panes.inspect(
            self.key,
            Want {
                foreground: false,
                activity: true,
                detail: true,
            },
        );
        let activity = match (seen.pane, seen.activity) {
            (PaneState::Live, Some(activity)) => activity,
            (PaneState::Gone, _) => return Err("no-pane"),
            _ => return Err("unknown"),
        };
        Ok(match activity.detail {
            Some(detail) => Inspection {
                state: detail
                    .state
                    .or_else(|| Some(activity.state).filter(|s| !s.is_empty())),
                visible_blocker: detail.visible_blocker,
                visible_idle: detail.visible_idle,
                visible_working: detail.visible_working,
                matched_rule: detail.matched_rule.is_some(),
                prompt_text: detail.prompt_text,
            },
            None => Inspection {
                state: Some(activity.state).filter(|s| !s.is_empty()),
                ..Default::default()
            },
        })
    }
}
