//! The port to the stream the events travel in, and the fold of a read into one state per question.

use crate::record::{Acked, Answered, Asked, Cancelled, DeliveryPending, Event, DELIVERY_PENDING};
use crate::refusal::Refusal;
use serde::Serialize;
use serde_json::Value;
use std::collections::BTreeMap;
use std::path::Path;

/// One event as the store hands it back: type and payload, in the store's deterministic order.
#[derive(Debug, Clone, PartialEq)]
pub struct LoggedEvent {
    pub event_type: String,
    pub payload: Value,
}

/// The stream of one clone. The host implements it over the Event Store; a refusal of the store passes
/// through with its own code (`event-store-*`).
pub trait QuestionLog {
    fn append(&self, event_type: &str, payload: Value) -> Result<(), Refusal>;
    /// Every event of the stream the clone holds, in the store's order (never by timestamp).
    fn read(&self) -> Result<Vec<LoggedEvent>, Refusal>;
}

/// Opens the log of the clone `dir` is in; `Ok(None)` outside a repository.
pub trait LogOpener: Send + Sync {
    fn open(&self, dir: &Path) -> Result<Option<Box<dyn QuestionLog>>, Refusal>;
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum State {
    Open,
    Answered,
    Acked,
    Cancelled,
}

/// One question as the fold knows it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Question {
    pub state: State,
    /// Delivery is independent of the question's open/answered lifecycle.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub delivery_pending: Option<DeliveryPending>,
    pub asked: Asked,
    /// The answer that counts: the first in the store's order.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub answer: Option<Answered>,
    /// Answers that lost to `answer` (two machines answered before they synced).
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub conflicts: Vec<Answered>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub acked: Option<Acked>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cancelled: Option<Cancelled>,
}

/// The questions by id, with the order they were first asked in.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Fold {
    order: Vec<String>,
    by_id: BTreeMap<String, Question>,
}

impl Fold {
    pub fn get(&self, id: &str) -> Option<&Question> {
        self.by_id.get(id)
    }

    /// In the order they were asked.
    pub fn questions(&self) -> impl Iterator<Item = &Question> {
        self.order.iter().filter_map(|id| self.by_id.get(id))
    }
}

/// Folds events in the store's order. A record that does not fit the state is ignored: `answered` needs
/// `open`, `acked` needs `answered`, `cancelled` needs `open` or `answered`; a second answer is a conflict.
pub fn fold(events: &[LoggedEvent]) -> Fold {
    let mut out = Fold::default();
    for event in events {
        // Delivery metadata is not a lifecycle transition or an Observe kind.
        if event.event_type == DELIVERY_PENDING {
            if let Ok(pending) = serde_json::from_value::<DeliveryPending>(event.payload.clone()) {
                if let Some(question) = out.by_id.get_mut(&pending.id) {
                    if question.state == State::Open {
                        question.delivery_pending = Some(pending);
                    }
                }
            }
            continue;
        }
        let Some(event) = Event::parse(&event.event_type, &event.payload) else {
            continue;
        };
        match event {
            Event::Asked(asked) => {
                if !out.by_id.contains_key(&asked.id) {
                    out.order.push(asked.id.clone());
                    out.by_id.insert(
                        asked.id.clone(),
                        Question {
                            state: State::Open,
                            delivery_pending: None,
                            asked: *asked,
                            answer: None,
                            conflicts: Vec::new(),
                            acked: None,
                            cancelled: None,
                        },
                    );
                }
            }
            Event::Answered(answered) => {
                let Some(question) = out.by_id.get_mut(&answered.id) else {
                    continue;
                };
                match question.state {
                    State::Open => {
                        question.state = State::Answered;
                        question.delivery_pending = None;
                        question.answer = Some(answered);
                    }
                    State::Answered | State::Acked => question.conflicts.push(answered),
                    State::Cancelled => {}
                }
            }
            Event::Acked(acked) => {
                if let Some(question) = out.by_id.get_mut(&acked.id) {
                    if question.state == State::Answered {
                        question.state = State::Acked;
                        question.acked = Some(acked);
                    }
                }
            }
            Event::Cancelled(cancelled) => {
                if let Some(question) = out.by_id.get_mut(&cancelled.id) {
                    if matches!(question.state, State::Open | State::Answered) {
                        question.state = State::Cancelled;
                        question.delivery_pending = None;
                        question.cancelled = Some(cancelled);
                    }
                }
            }
        }
    }
    out
}
