//! The agent protocol's port over a pane by key: `send`, `screen`, `inspect`. The one copy of these
//! three core calls; the run supervisor's `TermIo` wraps it, adding its own watch.

use crate::panes::Panes;
use fgos_agent_protocol::{AgentIo, Inspection, IoError, SendInput};
use fgos_terminal_control::core::Want;
use fgos_terminal_control::port::{PaneState, SendOutcome};

pub struct PaneIo<'a> {
    panes: &'a dyn Panes,
    key: &'a str,
}

impl<'a> PaneIo<'a> {
    pub fn new(panes: &'a dyn Panes, key: &'a str) -> Self {
        PaneIo { panes, key }
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

/// The result of a conservative, focus-neutral typed wake.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TypedWake {
    Typed,
    Refused(&'static str),
}

impl PaneIo<'_> {
    /// Types only after two idle, empty, dialog-free observations at the pinned CLI version.
    /// Text and Enter use raw sends, never the focus-moving prompt door. The caller supplies
    /// a labelled signal, not the message body. The external observation/type race remains.
    pub fn typed_wake(&self, cli: &str, version: Option<&str>, line: &str) -> TypedWake {
        use fgos_agent_protocol::terminal::{adapter_for, ComposerState};
        let Some(protocol) = adapter_for(cli) else {
            return TypedWake::Refused("unknown");
        };
        if version != Some(protocol.pinned_version()) {
            return TypedWake::Refused("unknown");
        }
        for _ in 0..2 {
            let inspection = match self.observe() {
                Ok(inspection) => inspection,
                Err(cause) => return TypedWake::Refused(cause),
            };
            let Ok(screen) = self.panes.read(self.key, Some("visible")) else {
                return TypedWake::Refused("unknown");
            };
            if inspection.visible_blocker || protocol.classify_blocked(&screen).is_some() {
                return TypedWake::Refused("dialog-open");
            }
            match inspection.state.as_deref() {
                Some("idle") if !inspection.visible_working => {}
                Some("busy" | "working") => return TypedWake::Refused("busy"),
                _ if inspection.visible_working => return TypedWake::Refused("busy"),
                _ => return TypedWake::Refused("unknown"),
            }
            match protocol.composer_state(&screen, &inspection) {
                ComposerState::Empty => {}
                ComposerState::NotEmpty => return TypedWake::Refused("composer-not-empty"),
                ComposerState::Unknown => return TypedWake::Refused("unknown"),
            }
        }
        if !matches!(
            self.panes.send(self.key, Some(line), None, false),
            Ok(SendOutcome::Sent)
        ) {
            return TypedWake::Refused("unknown");
        }
        // Let the CLI finish its paste before Enter, without routing through agent prompt.
        std::thread::sleep(std::time::Duration::from_millis(300));
        match self
            .panes
            .send(self.key, None, Some(&["Enter".into()]), false)
        {
            Ok(SendOutcome::Sent) => TypedWake::Typed,
            _ => TypedWake::Refused("unknown"),
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
