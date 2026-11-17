//! The four operations, over the adapters. This is the one place that chooses between them and
//! names a refusal; Terminal Control and the process door only carry the calls.

use crate::direct::Screenless;
use crate::pane_io::PaneIo;
use crate::panes::Panes;
use crate::types::*;
use fgos_agent_protocol::terminal::{adapter_for, Outbox, TerminalOutcome};
use fgos_agent_protocol::AgentIo;
use fgos_terminal_control::core::Want;
use fgos_terminal_control::port::{
    AllocateRequest, Display, Disposition, LaunchOutcome, LaunchSpec, PaneState,
    Refusal as PaneRefusal, ReleaseOutcome, Slot,
};
use std::path::PathBuf;

/// How long an agent gets to put its prompt up before an opening text is typed.
pub const DEFAULT_READY_MS: u64 = 60_000;
/// How long a screenless process gets to leave after SIGTERM before it is killed.
pub const DEFAULT_GRACE_MS: u64 = 10_000;

/// A head session has no result claim, so the delivery step never finds one.
struct NoOutbox;

impl Outbox for NoOutbox {
    fn newest_complete(&mut self, _io: &mut dyn AgentIo) -> Option<PathBuf> {
        None
    }
}

pub struct SessionHost<'a> {
    pub panes: &'a dyn Panes,
    pub direct: &'a dyn Screenless,
    pub ready_ms: u64,
    pub grace_ms: u64,
}

fn from_pane(refusal: PaneRefusal) -> Refusal {
    match refusal {
        PaneRefusal::Unsupported { capability, detail } => Refusal::unsupported(
            RefusalCode::HostUnsupportedHere,
            format!("{capability}: {detail}"),
        ),
        PaneRefusal::Unknown { reason } => Refusal::unknown(RefusalCode::PlacementUnknown, reason),
    }
}

fn bad_key(key: &str) -> Refusal {
    Refusal::unknown(
        RefusalCode::PlacementUnknown,
        format!("`{key}` is not a valid key"),
    )
}

/// The agent CLI an opening is typed for: the caller's, else the command's own file name.
fn cli_of<'c>(cli: Option<&'c str>, command: &'c str) -> &'c str {
    cli.unwrap_or_else(|| {
        std::path::Path::new(command)
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or(command)
    })
}

impl SessionHost<'_> {
    /// `cli` selects the agent-protocol adapter that types an opening; it defaults to the command's name.
    pub fn start(&self, request: &StartRequest, cli: Option<&str>) -> StartAnswer {
        if !valid_key(&request.key) {
            return StartAnswer::Refused(bad_key(&request.key));
        }
        match request.host {
            HostKind::Terminal => self.start_terminal(request, cli),
            HostKind::Direct => self.start_direct(request),
        }
    }

    fn placement(request: &StartRequest) -> Placement {
        Placement {
            host: request.host,
            key: request.key.clone(),
            display: request.display.clone(),
        }
    }

    fn start_terminal(&self, request: &StartRequest, cli: Option<&str>) -> StartAnswer {
        let refuse = |r: Refusal| StartAnswer::Refused(r);
        let key = request.key.as_str();
        if let Some(opening) = &request.opening {
            if opening.delivery != Delivery::Typed {
                return refuse(Refusal::unsupported(
                    RefusalCode::OpeningDeliveryUnsupported,
                    "a pane takes the opening typed into its composer",
                ));
            }
        }
        // Refuse before anything is opened: an opening that cannot be typed must not leave a pane behind.
        let adapter = match &request.opening {
            Some(_) => match adapter_for(cli_of(cli, &request.command)) {
                Some(adapter) => Some(adapter),
                None => {
                    return refuse(Refusal::unsupported(
                        RefusalCode::OpeningDeliveryUnsupported,
                        format!(
                            "no terminal adapter for `{}`",
                            cli_of(cli, &request.command)
                        ),
                    ))
                }
            },
            None => None,
        };
        let (placement, slot) = match self.open_slot(&OpenRequest {
            host: request.host,
            key: request.key.clone(),
            group_key: request.group_key.clone(),
            beside: request.beside.clone(),
            group_size: None,
            cwd: request.cwd.clone(),
            env: request.env.clone(),
            display: request.display.clone(),
        }) {
            Ok(opened) => opened,
            Err(r) => return refuse(r),
        };
        // A key with a live placement answers that placement; it never starts a second one.
        if slot.is_none() {
            return StartAnswer::Placed(placement);
        }
        let spec = LaunchSpec {
            command: request.command.clone(),
            args: request.args.clone(),
            cwd: request.cwd.clone(),
            env: request.env.clone(),
            expect: None,
        };
        match self.launch(&placement, &spec) {
            LaunchAnswer::Launched(_) => {}
            LaunchAnswer::NotStarted { reason } => {
                return refuse(Refusal::unknown(RefusalCode::PlacementUnknown, reason))
            }
            LaunchAnswer::Refused(r) => return refuse(r),
        }
        if let (Some(opening), Some(adapter)) = (&request.opening, adapter) {
            let mut io = PaneIo::new(self.panes, key);
            if !adapter.await_ready(&mut io, self.ready_ms).takes_brief() {
                // Nothing was typed; the pane this call opened is closed so a retry starts clean.
                let _ = self.panes.release(key, Disposition::Close);
                return refuse(Refusal::unknown(
                    RefusalCode::PaneNotReady,
                    "the agent never put up a prompt that takes input",
                ));
            }
            match adapter.deliver_brief(&mut io, &opening.text, &mut NoOutbox) {
                TerminalOutcome::Delivered => {}
                other => {
                    // A retry must start clean, never answer `placed` for a session that got no opening.
                    let _ = self.panes.release(key, Disposition::Close);
                    return refuse(Refusal::unknown(
                        RefusalCode::PaneNotReady,
                        format!("the opening text was typed but not confirmed: {other:?}"),
                    ));
                }
            }
        }
        StartAnswer::Placed(Self::placement(request))
    }

    /// Allocate the slot of a terminal placement and start nothing in it. A key whose pane is already
    /// live answers that placement and allocates nothing.
    pub fn open(&self, request: &OpenRequest) -> OpenAnswer {
        match self.open_slot(request) {
            Ok((placement, slot)) => OpenAnswer::Opened { placement, slot },
            Err(refusal) => OpenAnswer::Refused(refusal),
        }
    }

    /// The placement and the slot this call allocated (`None`: the key's pane was already live).
    fn open_slot(&self, request: &OpenRequest) -> Result<(Placement, Option<Slot>), Refusal> {
        if !valid_key(&request.key) {
            return Err(bad_key(&request.key));
        }
        if request.host != HostKind::Terminal {
            return Err(Refusal::unsupported(
                RefusalCode::HostUnsupportedHere,
                "a screenless host has no slot to open; `start` runs its process",
            ));
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
        if placement.host != HostKind::Terminal {
            return LaunchAnswer::Refused(Refusal::unsupported(
                RefusalCode::HostUnsupportedHere,
                "a screenless host has no slot to launch into; `start` runs its process",
            ));
        }
        match self.panes.launch(&placement.key, spec) {
            Ok(LaunchOutcome::Launched(identity)) => LaunchAnswer::Launched(identity),
            Ok(LaunchOutcome::NotStarted { reason }) => LaunchAnswer::NotStarted { reason },
            Err(r) => LaunchAnswer::Refused(from_pane(r)),
        }
    }

    fn start_direct(&self, request: &StartRequest) -> StartAnswer {
        let refuse = |r: Refusal| StartAnswer::Refused(r);
        if request.role == Role::Head {
            return refuse(Refusal::unsupported(
                RefusalCode::HeadNeedsInteractiveHost,
                "a head session needs a host with a message channel; a screenless host has none yet",
            ));
        }
        if let Some(opening) = &request.opening {
            if opening.delivery == Delivery::Typed {
                return refuse(Refusal::unsupported(
                    RefusalCode::OpeningDeliveryUnsupported,
                    "a screenless host has no composer to type into; pass the opening by argument or file",
                ));
            }
        }
        match self.direct.liveness(&request.key) {
            Liveness::Live => return StartAnswer::Placed(Self::placement(request)),
            Liveness::Unknown => {
                return refuse(Refusal::unknown(
                    RefusalCode::KeyInUse,
                    "the key's process cannot be judged from here; it is not started a second time",
                ))
            }
            Liveness::Gone => {}
        }
        let mut prepared = request.clone();
        if let Some(opening) = &request.opening {
            match opening.delivery {
                Delivery::Typed => unreachable!("refused before the key was judged"),
                Delivery::Argument => prepared.args.push(opening.text.clone()),
                Delivery::File => match self.direct.opening_file(&request.key, &opening.text) {
                    Ok(path) => prepared.args.push(path.to_string_lossy().into_owned()),
                    Err(e) => return refuse(Refusal::unknown(RefusalCode::PlacementUnknown, e)),
                },
            }
        }
        match self.direct.spawn(&prepared) {
            Ok(()) => StartAnswer::Placed(Self::placement(request)),
            Err(e) => refuse(Refusal::unknown(RefusalCode::PlacementUnknown, e)),
        }
    }

    pub fn alive(&self, placement: &Placement) -> AliveAnswer {
        if !valid_key(&placement.key) {
            return AliveAnswer {
                result: Liveness::Unknown,
                detail: Some(format!("`{}` is not a valid key", placement.key)),
            };
        }
        match placement.host {
            HostKind::Terminal => {
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
            HostKind::Direct => AliveAnswer {
                result: self.direct.liveness(&placement.key),
                detail: None,
            },
        }
    }

    pub fn front(&self, placement: &Placement) -> FrontAnswer {
        match placement.host {
            HostKind::Direct => FrontAnswer::Refused(Refusal::unsupported(
                RefusalCode::HostUnsupportedHere,
                "a screenless host has nothing to bring to the front",
            )),
            HostKind::Terminal => {
                if !valid_key(&placement.key) {
                    return FrontAnswer::Refused(bad_key(&placement.key));
                }
                match self.panes.focus(&placement.key) {
                    Ok(()) => FrontAnswer::Fronted,
                    Err(r) => FrontAnswer::Refused(from_pane(r)),
                }
            }
        }
    }

    pub fn retire(&self, placement: &Placement, disposition: Retirement) -> RetireAnswer {
        if !valid_key(&placement.key) {
            return RetireAnswer::Refused(bad_key(&placement.key));
        }
        match placement.host {
            HostKind::Terminal => self.retire_terminal(&placement.key, disposition),
            HostKind::Direct => self.retire_direct(&placement.key, disposition),
        }
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

    fn retire_direct(&self, key: &str, disposition: Retirement) -> RetireAnswer {
        // Retain keeps the session as it is: nothing is signalled.
        if disposition == Retirement::Retain {
            return RetireAnswer::Retired;
        }
        let unknown = |detail: String| {
            RetireAnswer::Refused(Refusal::unknown(RefusalCode::PlacementUnknown, detail))
        };
        if self.direct.liveness(key) == Liveness::Gone {
            self.direct.forget(key);
            return RetireAnswer::Retired;
        }
        // The ask, the grace and the kill belong to the shared primitive behind `end`.
        match self.direct.end(key, self.grace_ms) {
            Ok(Liveness::Gone) => {
                self.direct.forget(key);
                return RetireAnswer::Retired;
            }
            Ok(_) => {}
            Err(e) => return unknown(e),
        }
        unknown(format!(
            "`{key}` is still not judged gone after the grace; its handle is kept"
        ))
    }
}
