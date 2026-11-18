//! The four operations, over the adapters. This is the one place that chooses between them and
//! names a refusal; Terminal Control and the process door only carry the calls.

use crate::panes::Panes;
use crate::types::*;
use fgos_terminal_control::core::Want;
use fgos_terminal_control::port::{
    AllocateRequest, Display, Disposition, LaunchOutcome, LaunchSpec, PaneState,
    Refusal as PaneRefusal, ReleaseOutcome, Slot,
};

pub struct SessionHost<'a> {
    pub panes: &'a dyn Panes,
}

fn from_pane(refusal: PaneRefusal) -> Refusal {
    match refusal {
        PaneRefusal::Unsupported { capability, detail } => Refusal {
            capability: Some(capability.clone()),
            ..Refusal::unsupported(
                RefusalCode::HostUnsupportedHere,
                format!("{capability}: {detail}"),
            )
        },
        PaneRefusal::Unknown { reason } => Refusal::unknown(RefusalCode::PlacementUnknown, reason),
    }
}

fn bad_key(key: &str) -> Refusal {
    Refusal::unknown(
        RefusalCode::PlacementUnknown,
        format!("`{key}` is not a valid key"),
    )
}

impl SessionHost<'_> {
    /// Allocate the slot of a terminal placement and start nothing in it. A key whose pane is already
    /// live answers that placement with the slot it already holds and allocates nothing.
    pub fn open(&self, request: &OpenRequest) -> OpenAnswer {
        match self.open_slot(request) {
            Ok((placement, Some(slot))) => OpenAnswer::Opened {
                placement,
                slot: Some(slot),
            },
            // Terminal Control's allocation is idempotent for a live key: asking again returns the slot
            // the pane already has. The slot is a diagnostic, so a refusal here leaves it out.
            Ok((placement, None)) => OpenAnswer::Opened {
                slot: self.live_slot(request),
                placement,
            },
            Err(refusal) => OpenAnswer::Refused(refusal),
        }
    }

    /// The slot a live key's pane already holds.
    fn live_slot(&self, request: &OpenRequest) -> Option<Slot> {
        let display: Display = request
            .display
            .clone()
            .and_then(|v| serde_json::from_value(v).ok())
            .unwrap_or_default();
        self.panes
            .allocate(&AllocateRequest {
                key: request.key.clone(),
                group_key: request
                    .group_key
                    .clone()
                    .unwrap_or_else(|| request.key.clone()),
                display,
                group_size: request.group_size,
                cwd: Some(request.cwd.clone()),
                env: request.env.clone(),
            })
            .ok()
            .map(|a| a.slot)
    }

    /// The placement and the slot this call allocated (`None`: the key's pane was already live).
    fn open_slot(&self, request: &OpenRequest) -> Result<(Placement, Option<Slot>), Refusal> {
        if !valid_key(&request.key) {
            return Err(bad_key(&request.key));
        }
        let key = request.key.as_str();
        let placement = Placement {
            host: request.host,
            key: request.key.clone(),
            display: request.display.clone(),
        };
        let group_key = match (&request.group_key, &request.beside) {
            (Some(group), _) => group.clone(),
            (None, Some(_)) => {
                return Err(Refusal::unknown(
                    RefusalCode::PlacementUnknown,
                    "beside needs the groupKey of the placement it opens next to",
                ))
            }
            (None, None) => key.to_string(),
        };
        let probe = Want {
            foreground: false,
            activity: false,
            detail: false,
        };
        if let Some(beside) = &request.beside {
            if !valid_key(beside) {
                return Err(bad_key(beside));
            }
            if self.panes.inspect(beside, probe).pane != PaneState::Live {
                return Err(Refusal::unknown(
                    RefusalCode::PlacementUnknown,
                    format!("the placement `{beside}` to open beside is not live"),
                ));
            }
        }
        if self.panes.inspect(key, probe).pane == PaneState::Live {
            return Ok((placement, None));
        }
        let display: Display = request
            .display
            .clone()
            .and_then(|v| serde_json::from_value(v).ok())
            .unwrap_or_default();
        let allocation = self
            .panes
            .allocate(&AllocateRequest {
                key: key.to_string(),
                group_key,
                display,
                group_size: request.group_size,
                cwd: Some(request.cwd.clone()),
                env: request.env.clone(),
            })
            .map_err(from_pane)?;
        Ok((placement, Some(allocation.slot)))
    }

    /// Start a prepared command in the slot `open` allocated for the placement's key and answer the
    /// launched process root. The caller needs that identity before it lets the process run on.
    pub fn launch(&self, placement: &Placement, spec: &LaunchSpec) -> LaunchAnswer {
        if !valid_key(&placement.key) {
            return LaunchAnswer::Refused(bad_key(&placement.key));
        }
        match self.panes.launch(&placement.key, spec) {
            Ok(LaunchOutcome::Launched(identity)) => LaunchAnswer::Launched(identity),
            Ok(LaunchOutcome::NotStarted { reason }) => LaunchAnswer::NotStarted { reason },
            Err(r) => LaunchAnswer::Refused(from_pane(r)),
        }
    }

    pub fn alive(&self, placement: &Placement) -> AliveAnswer {
        if !valid_key(&placement.key) {
            return AliveAnswer {
                result: Liveness::Unknown,
                detail: Some(format!("`{}` is not a valid key", placement.key)),
            };
        }
        let seen = self.panes.inspect(
            &placement.key,
            Want {
                foreground: false,
                activity: false,
                detail: false,
            },
        );
        AliveAnswer {
            result: match seen.pane {
                PaneState::Live => Liveness::Live,
                PaneState::Gone => Liveness::Gone,
                PaneState::Unknown => Liveness::Unknown,
            },
            detail: None,
        }
    }

    pub fn front(&self, placement: &Placement) -> FrontAnswer {
        if !valid_key(&placement.key) {
            return FrontAnswer::Refused(bad_key(&placement.key));
        }
        match self.panes.focus(&placement.key) {
            Ok(()) => FrontAnswer::Fronted,
            Err(r) => FrontAnswer::Refused(from_pane(r)),
        }
    }

    pub fn retire(&self, placement: &Placement, disposition: Retirement) -> RetireAnswer {
        if !valid_key(&placement.key) {
            return RetireAnswer::Refused(bad_key(&placement.key));
        }
        self.retire_terminal(&placement.key, disposition)
    }

    fn retire_terminal(&self, key: &str, disposition: Retirement) -> RetireAnswer {
        let disposition = match disposition {
            Retirement::Close => Disposition::Close,
            Retirement::Retain => Disposition::Retain,
        };
        match self.panes.release(key, disposition) {
            Ok(ReleaseOutcome::Released { .. }) => RetireAnswer::Retired,
            Ok(ReleaseOutcome::KeptUnknown { reason }) => {
                let seen = self.panes.inspect(
                    key,
                    Want {
                        foreground: false,
                        activity: false,
                        detail: false,
                    },
                );
                if seen.pane == PaneState::Gone {
                    RetireAnswer::Retired
                } else {
                    RetireAnswer::Refused(Refusal::unknown(RefusalCode::PlacementUnknown, reason))
                }
            }
            Err(r) => RetireAnswer::Refused(from_pane(r)),
        }
    }
}
