//! Domain projections and their read ports. A failed source contributes no guessed records.
use crate::{keeper::*, portfolio::Plan};
use std::collections::{BTreeMap, BTreeSet};

#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
#[error("{0}")]
pub struct SourceError(pub String);

pub trait Source {
    fn records(&self) -> Result<Vec<Record>, SourceError>;
    fn closed(&self, item: &str) -> bool;
}

/// Source-owned head facts. Only proven absence permits projecting a sleep deadline.
pub trait Heads {
    fn state(&self, role: &str) -> ActorState;
    fn sleep_until(&self, role: &str) -> Option<String>;
}

pub struct Plans<'a> {
    pub plans: &'a [Plan],
    pub heads: &'a dyn Heads,
}
impl Source for Plans<'_> {
    fn records(&self) -> Result<Vec<Record>, SourceError> {
        Ok(self
            .plans
            .iter()
            .filter(|p| p.status == "running")
            .map(|p| {
                let role = p.lead.as_deref();
                let waiting_on = role
                    .filter(|role| self.heads.state(role) == ActorState::NotLive)
                    .and_then(|role| self.heads.sleep_until(role))
                    // The keeper's codec is the authority for instants. Invalid wakeAt is not a wait.
                    .and_then(|until| {
                        serde_json::from_value::<WaitingOn>(serde_json::json!({
                            "kind": "time", "ref": role, "until": until
                        }))
                        .ok()
                    });
                Record {
                    item: p.dir.clone(),
                    step: "lead".into(),
                    waiting_on,
                    // An unnamed running lead needs judgement, not a guessed Identity role.
                    needs: role.map(|role| Need {
                        kind: NeedKind::Role,
                        reference: role.into(),
                        max_rounds: None,
                    }),
                    outcome: None,
                }
            })
            .collect())
    }
    fn closed(&self, item: &str) -> bool {
        self.plans
            .iter()
            .any(|p| p.dir == item && matches!(p.status.as_str(), "done" | "withdrawn"))
    }
}

/// A host verb's validated projection. No second case-ledger parser exists in Rust.
#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct WorkflowCases {
    pub records: Vec<Record>,
    pub closed_items: Vec<String>,
}
impl Source for WorkflowCases {
    fn records(&self) -> Result<Vec<Record>, SourceError> {
        Ok(self.records.clone())
    }
    fn closed(&self, item: &str) -> bool {
        self.closed_items.iter().any(|id| id == item)
    }
}

/// Need and question adapters supply facts; the keeper alone chooses actions.
pub trait Resolver {
    fn actor(&self, record: &Record) -> ActorState;
    fn answered(&self, question: &str) -> bool;
    fn start_hold(&self, record: &Record) -> Result<Option<String>, String>;
}

/// A live reservation is authoritative; a recorded start protects the registration gap only.
pub fn capability_actor(
    record: &Record,
    last_start: Option<u64>,
    now: u64,
    start_window: u64,
) -> ActorState {
    if record
        .waiting_on
        .as_ref()
        .is_some_and(|w| w.kind == WaitKind::Actor)
    {
        ActorState::Live
    } else if last_start.is_some_and(|at| now.saturating_sub(at) < start_window) {
        ActorState::Unknown
    } else {
        ActorState::NotLive
    }
}

/// Record source state edges, including recovery so a subsequent outage is observable again.
pub fn source_status_decisions(
    names: &[String],
    unavailable: &[Decision],
    past: &[Decision],
) -> Vec<Decision> {
    names
        .iter()
        .filter_map(|name| {
            let previous = past
                .iter()
                .rev()
                .find(|d| d.item == *name && d.step == "source");
            let failed = unavailable.iter().find(|d| d.item == *name);
            match failed {
                Some(decision) if previous != Some(decision) => Some(decision.clone()),
                None if previous.is_some_and(|d| d.reason == "source-unavailable") => {
                    Some(Decision {
                        item: name.clone(),
                        step: "source".into(),
                        action: Action::Hold,
                        reason: "source-recovered".into(),
                    })
                }
                _ => None,
            }
        })
        .collect()
}

pub struct Collected {
    pub inputs: Vec<Input>,
    pub caps: Caps,
    pub unavailable: Vec<Decision>,
}

/// Each source fails independently. Question answers clear only their own person wait.
pub fn collect_records(
    sources: &[(&str, Result<&dyn Source, SourceError>)],
    resolver: &dyn Resolver,
    starts: usize,
) -> Result<Collected, String> {
    let mut result = Collected {
        inputs: vec![],
        caps: Caps {
            starts,
            held: BTreeMap::new(),
        },
        unavailable: vec![],
    };
    let mut seen = BTreeSet::new();
    for (name, source) in sources {
        let records = source
            .as_ref()
            .map_err(Clone::clone)
            .and_then(|s| s.records());
        match records {
            Err(_) => result.unavailable.push(Decision {
                item: (*name).into(),
                step: "source".into(),
                action: Action::Hold,
                reason: "source-unavailable".into(),
            }),
            Ok(records) => {
                for mut record in records {
                    // Match the keeper's first projection per key before claiming any capacity.
                    if !seen.insert(record.key()) {
                        continue;
                    }
                    let item_closed = source.as_ref().is_ok_and(|s| s.closed(&record.item));
                    if record.waiting_on.as_ref().is_some_and(|w| {
                        w.kind == WaitKind::Person && resolver.answered(&w.reference)
                    }) {
                        record.waiting_on = None;
                    }
                    let actor = resolver.actor(&record);
                    if !item_closed
                        && actor == ActorState::NotLive
                        && record.outcome.is_none()
                        && record.waiting_on.is_none()
                        && record.needs.is_some()
                    {
                        match resolver.start_hold(&record) {
                            Ok(None) => {}
                            Ok(Some(reason)) => {
                                result.caps.held.insert(record.key(), reason);
                            }
                            Err(_) => {
                                result
                                    .caps
                                    .held
                                    .insert(record.key(), "start-check-unavailable".into());
                            }
                        }
                    }
                    result.inputs.push(Input {
                        item_closed,
                        record,
                        actor,
                    });
                }
            }
        }
    }
    Ok(result)
}
