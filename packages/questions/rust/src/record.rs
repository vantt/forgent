//! The four event payloads of `question-event-payloads.v1.json`. The store writes these and the fold reads
//! them; nothing else does.

use serde::{Deserialize, Serialize};

/// The Event Store stream the questions live in.
pub const STREAM: &str = "project:questions";
pub const ASKED: &str = "questions.asked";
pub const ANSWERED: &str = "questions.answered";
pub const ACKED: &str = "questions.acked";
pub const CANCELLED: &str = "questions.cancelled";

/// The Observe kinds and attrs this crate's record source projects (declared to Observe by the host).
pub const OBSERVE_KINDS: &str = include_str!("../observe-kinds.json");

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Asker {
    pub session_id: String,
    pub handle: String,
    pub roles: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub persona: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pane: Option<String>,
    pub machine: String,
}

impl Asker {
    /// The `head:` roles of the asker.
    pub fn head_roles(&self) -> impl Iterator<Item = &String> {
        self.roles.iter().filter(|role| role.starts_with("head:"))
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Ref {
    pub value: String,
    pub branch: String,
    pub commit: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct QuestionOption {
    pub label: String,
    pub does: String,
    pub gain: String,
    pub harm: String,
    pub cost: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub recommended: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Scope {
    pub allows: String,
    pub forbids: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Parts {
    pub what: String,
    pub cause: String,
    pub options: Vec<QuestionOption>,
    pub recommendation: String,
    pub scope: Scope,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Asked {
    pub id: String,
    pub asked_at: String,
    pub asker: Asker,
    pub stage: String,
    #[serde(rename = "ref")]
    pub origin: Ref,
    pub headline: String,
    pub blocks: String,
    pub parts: Parts,
    pub migrated: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub supersedes: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Answered {
    pub id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub option: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    pub by: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub via: Option<String>,
    pub answered_at: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Acked {
    pub id: String,
    pub by: String,
    pub at: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Cancelled {
    pub id: String,
    pub by: String,
    pub reason: String,
    pub at: String,
}

/// One event of the stream, parsed.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Event {
    Asked(Box<Asked>),
    Answered(Answered),
    Acked(Acked),
    Cancelled(Cancelled),
}

impl Event {
    /// `None` for a type or payload this crate does not know, which the fold skips.
    pub fn parse(event_type: &str, payload: &serde_json::Value) -> Option<Self> {
        let value = payload.clone();
        match event_type {
            ASKED => serde_json::from_value(value)
                .ok()
                .map(|e| Self::Asked(Box::new(e))),
            ANSWERED => serde_json::from_value(value).ok().map(Self::Answered),
            ACKED => serde_json::from_value(value).ok().map(Self::Acked),
            CANCELLED => serde_json::from_value(value).ok().map(Self::Cancelled),
            _ => None,
        }
    }

    pub fn id(&self) -> &str {
        match self {
            Self::Asked(e) => &e.id,
            Self::Answered(e) => &e.id,
            Self::Acked(e) => &e.id,
            Self::Cancelled(e) => &e.id,
        }
    }
}
