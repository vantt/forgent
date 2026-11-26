//! Domain-neutral scheduling. The decision function is pure; ports supply source facts, current
//! actor/capacity facts and the keeper's Event Store history, and execute its decisions.
use fgos_identity::text::{iso_utc, iso_utc_secs};
use serde::{de::Error, Deserialize, Deserializer, Serialize};
use std::collections::{BTreeMap, BTreeSet};

fn nonempty<'de, D: Deserializer<'de>>(d: D) -> Result<String, D::Error> {
    let value = String::deserialize(d)?;
    if value.is_empty() {
        return Err(D::Error::custom("must not be empty"));
    }
    Ok(value)
}

// Optional means absent, not null, as in the JSON contract.
fn present<'de, D: Deserializer<'de>, T: Deserialize<'de>>(d: D) -> Result<Option<T>, D::Error> {
    T::deserialize(d).map(Some)
}

/// Milliseconds of a canonical UTC instant. Reuse Identity's civil-time conversion and formatter
/// to reject normalized invalid dates, malformed fractions and pre-epoch input.
fn instant(text: &str) -> Option<i128> {
    if !matches!(text.len(), 20 | 24) || !text.is_ascii() {
        return None;
    }
    let seconds = iso_utc_secs(text)?;
    let millis = match text.split_once('.') {
        Some((_, fraction)) => fraction.strip_suffix('Z')?.parse::<u32>().ok()?,
        None => 0,
    };
    let canonical = iso_utc(seconds, millis);
    if text != canonical && text != canonical.replace(".000Z", "Z") {
        return None;
    }
    Some(i128::from(seconds) * 1000 + i128::from(millis))
}

fn until<'de, D: Deserializer<'de>>(d: D) -> Result<Option<String>, D::Error> {
    let text = String::deserialize(d)?;
    if instant(&text).is_none() {
        return Err(D::Error::custom(format!("invalid until: {text}")));
    }
    Ok(Some(text))
}

/// IDs are supplied by the domain. Deserialization refuses unknown fields by name at every level.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Record {
    #[serde(deserialize_with = "nonempty")]
    pub item: String,
    #[serde(deserialize_with = "nonempty")]
    pub step: String,
    #[serde(
        default,
        deserialize_with = "present",
        skip_serializing_if = "Option::is_none"
    )]
    pub waiting_on: Option<WaitingOn>,
    #[serde(
        default,
        deserialize_with = "present",
        skip_serializing_if = "Option::is_none"
    )]
    pub needs: Option<Need>,
    #[serde(
        default,
        deserialize_with = "present",
        skip_serializing_if = "Option::is_none"
    )]
    pub outcome: Option<Outcome>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct WaitingOn {
    pub kind: WaitKind,
    #[serde(rename = "ref", deserialize_with = "nonempty")]
    pub reference: String,
    #[serde(
        default,
        deserialize_with = "until",
        skip_serializing_if = "Option::is_none"
    )]
    pub until: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum WaitKind {
    Actor,
    Time,
    Event,
    Person,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Need {
    pub kind: NeedKind,
    #[serde(rename = "ref", deserialize_with = "nonempty")]
    pub reference: String,
    #[serde(
        default,
        deserialize_with = "present",
        skip_serializing_if = "Option::is_none"
    )]
    pub max_rounds: Option<u32>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum NeedKind {
    Role,
    Actor,
    Capability,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Outcome {
    Done,
    Withdrawn,
    Wontfix,
    Cancelled,
}

pub type Key = (String, String);
impl Record {
    pub fn key(&self) -> Key {
        (self.item.clone(), self.step.clone())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ActorState {
    Live,
    NotLive,
    /// Includes unresolved identity and a holder in another project. Neither is free.
    Unknown,
}

/// Facts from the record's own source and the need resolver, not domain state interpreted here.
#[derive(Debug, Clone)]
pub struct Input {
    pub record: Record,
    pub item_closed: bool,
    pub actor: ActorState,
}

/// Remaining start budget after admission, and per-step holds from the existing cap/referee doors.
/// A hold's value is the owning door's reason code (for example `resource-held`).
#[derive(Debug, Clone)]
pub struct Caps {
    pub starts: usize,
    pub held: BTreeMap<Key, String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "kebab-case", deny_unknown_fields)]
pub enum Action {
    Start,
    Wake,
    Hold,
    Raise {
        event: String,
        /// Logical deduplication key; Queue's adapter encodes this into its 16-hex id vocabulary.
        id: String,
    },
}

/// The payload of the corresponding `supervision.keeper-*` Event Store record. Only executed
/// decisions enter history: starts are recorded before attempting the effect (a failed attempt
/// consumes a round); raises are recorded after the raise door accepts them so failures retry.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Decision {
    pub item: String,
    pub step: String,
    pub action: Action,
    pub reason: String,
}
impl Decision {
    pub fn event_type(&self) -> &'static str {
        match self.action {
            Action::Start => "supervision.keeper-start",
            Action::Wake => "supervision.keeper-wake",
            Action::Hold => "supervision.keeper-hold",
            Action::Raise { .. } => "supervision.keeper-raise",
        }
    }
}

/// Decide for all sources together. This never changes or closes a domain record. A wait is not
/// cleared by expiry, and caps block starts, not delivery to an already-live actor.
pub fn decide(records: &[Input], now: i64, past: &[Decision], caps: &Caps) -> Vec<Decision> {
    let mut decisions = Vec::new();
    let mut remaining = caps.starts;
    let mut seen = BTreeSet::new();
    for input in records {
        let r = &input.record;
        if r.outcome.is_some() || !seen.insert(r.key()) {
            continue;
        }
        let judgement = |reason: &str| Action::Raise {
            event: "needs-judgement".into(),
            id: format!("judgement:{}:{}:{reason}", r.item, r.step),
        };
        let (action, reason) =
            if input.item_closed {
                (judgement("orphan-record"), "orphan-record".to_owned())
            } else if let Some(wait) = &r.waiting_on {
                let Some(until) = wait.until.as_ref().filter(|s| {
                    instant(s).is_some_and(|deadline| i128::from(now) * 1000 >= deadline)
                }) else {
                    continue;
                };
                let id = format!("until:{}:{}:{until}", r.item, r.step);
                if past.iter().any(|d| {
                    d.item == r.item
                        && d.step == r.step
                        && matches!(&d.action, Action::Raise { id: old, .. } if old == &id)
                }) {
                    continue;
                }
                (
                    Action::Raise {
                        event: "until-expired".into(),
                        id,
                    },
                    "until-expired".into(),
                )
            } else if let Some(need) = &r.needs {
                let rounds = past
                    .iter()
                    .filter(|d| d.item == r.item && d.step == r.step && d.action == Action::Start)
                    .count();
                if need.max_rounds.is_some_and(|cap| rounds >= cap as usize) {
                    (judgement("round-cap"), "round-cap".into())
                } else if input.actor == ActorState::Live {
                    (Action::Wake, "actor-live".into())
                } else if input.actor == ActorState::Unknown {
                    (Action::Hold, "identity-unknown".into())
                } else if let Some(reason) = caps.held.get(&r.key()) {
                    (Action::Hold, reason.clone())
                } else if remaining == 0 {
                    (Action::Hold, "start-cap".into())
                } else {
                    remaining -= 1;
                    (Action::Start, "actionable".into())
                }
            } else {
                (judgement("needs-missing"), "needs-missing".into())
            };
        let decision = Decision {
            item: r.item.clone(),
            step: r.step.clone(),
            action,
            reason,
        };
        // Starts consume rounds; unchanged open holds, alarms and live-player delivery do not
        // need another event or effect until this step's recorded decision changes.
        if decision.action != Action::Start
            && past
                .iter()
                .rev()
                .find(|d| d.item == r.item && d.step == r.step)
                == Some(&decision)
        {
            continue;
        }
        decisions.push(decision);
    }
    decisions
}

/// The adapter in the next phase reads registered sources and resolves needs through their doors.
/// Called after admission, so the caps snapshot must include that wake's admissions.
/// An adapter must report a just-started player as `Live` or `Unknown`, never `NotLive`,
/// including while its Identity registration is still pending, to prevent duplicate starts.
pub trait Snapshot {
    fn read(&self) -> Result<(Vec<Input>, Caps), String>;
}

/// Full keeper history, not just unhandled queue events: handled expiry events still deduplicate,
/// and every start attempt for an item/step still counts toward the domain's round cap.
pub trait History {
    /// Decisions in append order (oldest first), so the last decision per step is authoritative.
    fn read(&self) -> Result<Vec<Decision>, String>;
    fn record(&self, decision: &Decision) -> Result<(), String>;
}

pub trait Players {
    fn start(&self, decision: &Decision, need: &Need) -> Result<(), String>;
    fn wake(&self, decision: &Decision, need: &Need) -> Result<(), String>;
}

pub trait Raise {
    fn raise(&self, decision: &Decision, now: i64) -> Result<(), String>;
}
pub struct Ports<'a> {
    pub snapshot: &'a dyn Snapshot,
    pub history: &'a dyn History,
    pub players: &'a dyn Players,
    pub raise: &'a dyn Raise,
}
