//! `fgos.head.state`: a live projection of every placed head, joined from three owners and stored nowhere.
//!
//! - the placement the head's start wrote under `.fgos/runtime/session-rotation/<persona>-<name>/placement.json`;
//! - Session Host `alive(placement)`, which answers `live`, `gone` or `unknown`;
//! - Identity's role directory, which says whether the head's `head:<persona>-<name>` role is held by a live session.
//!
//! The state is Session Host's answer, copied: `unknown` is never turned into `gone`. Identity's view travels as the
//! separate attr `fgos.head.identity`, so a pane that answers `unknown` while the role is held alive stays visible as
//! exactly that. The role string itself (`head:<persona>-<name>`, `lead:<LANE>`) travels as `fgos.head.role`.
//!
//! `retired` is the signal that a head or lead ended on purpose: its owner (the project supervisor, for a lead) adds
//! `retiredAt` (an RFC 3339 instant) to the head's `placement.json`. A placement carrying a valid `retiredAt` answers
//! `retired` with record `ts` = `retiredAt`, and Session Host is not asked. A `retiredAt` that is not a valid instant
//! is no signal: the head is projected as if it had none. The placement writer's schema
//! (`{ role, gen, placement, runDir, persona, startedAt }`, session-host spec 8.4) has no field that already means
//! retired; the next `session start` of the lineage replaces the file and so clears it.

use super::HEAD_STATE_KIND;
use fgos_observe::record::types::{AttrValue, Basis, Origin, Record, SubjectRef, RECORD_VERSION};
use fgos_observe::{RecordSource, SourceError, Window};
use fgos_session_host::{Liveness, Placement};
use serde_json::Value;
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

const SOURCE_ID: &str = "head-state";

/// What the source asks of the outside world: the one question to Session Host and the one read of Identity.
pub trait HeadFacts: Send + Sync {
    /// Session Host `alive` for a placement; `run_dir` is the head's own attempt directory (it names the terminal
    /// endpoint the head was placed on).
    fn alive(&self, placement: &Placement, run_dir: &Path) -> Liveness;
    /// Role alias → Identity liveness (`alive`, `unknown`, `remote`) of the session holding it.
    fn identity_roles(&self) -> BTreeMap<String, &'static str>;
}

/// The real owners: the terminal host of the head's own endpoint and this machine's Identity directory.
#[derive(Debug, Default, Clone, Copy)]
pub struct HostHeadFacts;

impl HeadFacts for HostHeadFacts {
    fn alive(&self, placement: &Placement, run_dir: &Path) -> Liveness {
        let backend = fgos_run_supervisor::terminal_slot::Backend::from_env(run_dir);
        let core = backend.core();
        fgos_session_host::SessionHost { panes: &core }
            .alive(placement)
            .result
    }

    fn identity_roles(&self) -> BTreeMap<String, &'static str> {
        let root = fgos_holder_lock::state_root::state_root().0;
        let Ok(listed) = fgos_identity::directory::list(
            &root,
            None,
            false,
            &fgos_process::facts::judge_here,
            None,
        ) else {
            return BTreeMap::new();
        };
        let mut roles = BTreeMap::new();
        for session in listed.sessions {
            let liveness = match session.liveness {
                fgos_identity::Liveness::Alive => "alive",
                fgos_identity::Liveness::Unknown => "unknown",
                fgos_identity::Liveness::Remote => "remote",
            };
            for role in session.roles {
                roles.insert(role, liveness);
            }
        }
        roles
    }
}

pub struct HeadStateSource {
    facts: Box<dyn HeadFacts>,
    now_ms: fn() -> i64,
}

impl HeadStateSource {
    pub fn new() -> Self {
        Self::with_facts(Box::new(HostHeadFacts))
    }

    pub fn with_facts(facts: Box<dyn HeadFacts>) -> Self {
        Self {
            facts,
            now_ms: system_now_ms,
        }
    }
}

impl Default for HeadStateSource {
    fn default() -> Self {
        Self::new()
    }
}

fn system_now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |d| d.as_millis() as i64)
}

fn state_name(liveness: Liveness) -> &'static str {
    match liveness {
        Liveness::Live => "live",
        Liveness::Gone => "gone",
        Liveness::Unknown => "unknown",
    }
}

/// One placement file, as `session start` wrote it.
struct Head {
    role: String,
    persona: Option<String>,
    gen: Option<i64>,
    placement: Placement,
    run_dir: PathBuf,
    /// `retiredAt`, normalized to RFC 3339 UTC; `None` when absent or not a valid instant.
    retired_at: Option<String>,
}

fn read_head(path: &Path) -> Option<Head> {
    let value: Value = serde_json::from_slice(&std::fs::read(path).ok()?).ok()?;
    let role = value["role"].as_str().filter(|r| !r.is_empty())?.to_owned();
    let placement: Placement = serde_json::from_value(value["placement"].clone()).ok()?;
    Some(Head {
        role,
        persona: value["persona"].as_str().map(str::to_owned),
        gen: value["gen"].as_i64(),
        placement,
        run_dir: PathBuf::from(value["runDir"].as_str().unwrap_or_default()),
        retired_at: value["retiredAt"]
            .as_str()
            .and_then(fgos_host_runtime::civil_time::parse_rfc3339_millis)
            .and_then(|ms| fgos_host_runtime::civil_time::format_unix_millis_rfc3339(ms, 0)),
    })
}

impl RecordSource for HeadStateSource {
    fn source_id(&self) -> &'static str {
        SOURCE_ID
    }

    fn kinds(&self) -> &[&str] {
        &[HEAD_STATE_KIND]
    }

    /// A projection of now: every placed head answers once, whatever the window. The engine's own window test on
    /// `ts` decides whether now is inside it.
    fn records(&self, root: &Path, _w: &Window) -> Result<Vec<Record>, SourceError> {
        let lineages = root.join(".fgos/runtime/session-rotation");
        let Ok(entries) = std::fs::read_dir(&lineages) else {
            return Ok(Vec::new()); // No head was ever started in this project.
        };
        let mut placements: Vec<PathBuf> = entries
            .filter_map(Result::ok)
            .map(|e| e.path().join("placement.json"))
            .filter(|p| p.is_file())
            .collect();
        placements.sort();
        let heads: Vec<Head> = placements.iter().filter_map(|p| read_head(p)).collect();
        if heads.is_empty() {
            return Ok(Vec::new());
        }
        let identity = self.facts.identity_roles();
        let ts = fgos_host_runtime::civil_time::format_unix_millis_rfc3339((self.now_ms)(), 0)
            .ok_or_else(|| SourceError::ReadFailed {
                source_id: SOURCE_ID,
                message: "the clock is outside the representable range".to_owned(),
            })?;
        Ok(heads
            .into_iter()
            .map(|head| {
                let (state, ts) = match head.retired_at {
                    Some(at) => ("retired", at),
                    None => (
                        state_name(self.facts.alive(&head.placement, &head.run_dir)),
                        ts.clone(),
                    ),
                };
                let mut attrs = BTreeMap::from([
                    (
                        "fgos.head.state".to_owned(),
                        AttrValue::Str(state.to_owned()),
                    ),
                    (
                        "fgos.head.role".to_owned(),
                        AttrValue::Str(head.role.clone()),
                    ),
                    (
                        "fgos.head.identity".to_owned(),
                        AttrValue::Str(
                            identity
                                .get(&head.role)
                                .copied()
                                .unwrap_or("absent")
                                .to_owned(),
                        ),
                    ),
                ]);
                if let Some(persona) = head.persona {
                    attrs.insert("fgos.head.persona".to_owned(), AttrValue::Str(persona));
                }
                if let Some(gen) = head.gen {
                    attrs.insert("fgos.head.gen".to_owned(), AttrValue::Int(gen));
                }
                Record {
                    v: RECORD_VERSION,
                    id: format!("head-state:{}", head.role),
                    kind: HEAD_STATE_KIND.to_owned(),
                    ts,
                    end_ts: None,
                    subject: SubjectRef {
                        kind: "head".to_owned(),
                        id: head.role,
                    },
                    refs: Vec::new(),
                    attrs,
                    measures: BTreeMap::new(),
                    basis: Basis::Observed,
                    origin: Origin {
                        source: SOURCE_ID.to_owned(),
                        component: Some("host".to_owned()),
                        host: Some(fgos_process::facts::host()),
                        ..Origin::default()
                    },
                    detail: None,
                    redaction: None,
                }
            })
            .collect())
    }
}
