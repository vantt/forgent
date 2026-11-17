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

impl PaneIo<'_> {
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
            _ => return Err(IoError::Io("the pane gave no activity".into())),
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
