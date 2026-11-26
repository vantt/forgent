//! The start request and the refusals (contracts/start-request.v1.json, contracts/refusals.v1.json).

use serde_json::Value;
use std::collections::BTreeMap;
use std::sync::OnceLock;

/// The schema of the request, read as data for the required facts of each start kind (one source of that list).
const START_REQUEST_SCHEMA: &str = include_str!("../../contracts/start-request.v1.json");

/// How the text reaches the agent.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Delivery {
    Opening,
    PromptArg,
    AgentFile,
    HookContext,
}

impl Delivery {
    pub fn parse(text: &str) -> Option<Delivery> {
        Some(match text {
            "opening" => Delivery::Opening,
            "prompt-arg" => Delivery::PromptArg,
            "agent-file" => Delivery::AgentFile,
            "hook-context" => Delivery::HookContext,
            _ => return None,
        })
    }
    pub fn as_str(self) -> &'static str {
        match self {
            Delivery::Opening => "opening",
            Delivery::PromptArg => "prompt-arg",
            Delivery::AgentFile => "agent-file",
            Delivery::HookContext => "hook-context",
        }
    }
}

/// The kind of a head's bound item.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ItemKind {
    Plan,
    Discussion,
    Backlog,
    Question,
}

/// Content its producer owns; compose places it and never rewrites it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Payload {
    /// Execution's rendered assignment block.
    Assignment { text: String },
    /// A head's bound item.
    Task { path: String, item_kind: ItemKind },
    /// The rotation handoff for a successor head.
    Handoff { text: String },
    /// The question a head continues.
    ForQuestion { question_id: String },
}

impl Payload {
    pub fn kind(&self) -> &'static str {
        match self {
            Payload::Assignment { .. } => "assignment",
            Payload::Task { .. } => "task",
            Payload::Handoff { .. } => "handoff",
            Payload::ForQuestion { .. } => "for-question",
        }
    }

    /// The block text. Assignment and handoff text is the producer's own; task and for-question are rendered in the
    /// words a head receives today (packages/agent-start-context/goldens/).
    pub fn text(&self) -> String {
        match self {
            Payload::Assignment { text } | Payload::Handoff { text } => text.clone(),
            Payload::Task { path, .. } => format!("# Task\nYour task is {path}."),
            Payload::ForQuestion { question_id } => format!(
                "You continue question {question_id}: write its answer back to its origin, then `fgos questions ack {question_id}` (or `cancel`)."
            ),
        }
    }

    fn parse(value: &Value) -> Result<Payload, Refusal> {
        let invalid = |why: &str| Refusal::new(RefusalCode::StartPayloadInvalid, why);
        let object = value
            .as_object()
            .ok_or_else(|| invalid("a payload is not an object"))?;
        let kind = object
            .get("kind")
            .and_then(Value::as_str)
            .ok_or_else(|| invalid("a payload has no kind"))?;
        let field = |name: &str| -> Result<String, Refusal> {
            object
                .get(name)
                .and_then(Value::as_str)
                .filter(|text| !text.is_empty())
                .map(str::to_owned)
                .ok_or_else(|| invalid(&format!("payload {kind} needs a non-empty {name}")))
        };
        let only = |names: &[&str]| -> Result<(), Refusal> {
            match object.keys().find(|key| !names.contains(&key.as_str())) {
                Some(extra) => Err(invalid(&format!(
                    "payload {kind} has an unknown field {extra}"
                ))),
                None => Ok(()),
            }
        };
        match kind {
            "assignment" => {
                only(&["kind", "text"])?;
                Ok(Payload::Assignment {
                    text: field("text")?,
                })
            }
            "handoff" => {
                only(&["kind", "text"])?;
                Ok(Payload::Handoff {
                    text: field("text")?,
                })
            }
            "task" => {
                only(&["kind", "path", "itemKind"])?;
                let item_kind = match field("itemKind")?.as_str() {
                    "plan" => ItemKind::Plan,
                    "discussion" => ItemKind::Discussion,
                    "backlog" => ItemKind::Backlog,
                    "question" => ItemKind::Question,
                    other => {
                        return Err(invalid(&format!(
                            "itemKind {other} is not plan, discussion, backlog or question"
                        )))
                    }
                };
                Ok(Payload::Task {
                    path: field("path")?,
                    item_kind,
                })
            }
            "for-question" => {
                only(&["kind", "questionId"])?;
                let question_id = field("questionId")?;
                let well_formed = question_id.strip_prefix("q-").is_some_and(|rest| {
                    !rest.is_empty()
                        && rest
                            .chars()
                            .all(|c| c.is_ascii_digit() || c.is_ascii_lowercase())
                });
                if !well_formed {
                    return Err(invalid(&format!("questionId {question_id} is not q-<id>")));
                }
                Ok(Payload::ForQuestion { question_id })
            }
            other => Err(invalid(&format!(
                "{other} is not a payload kind (assignment, task, handoff, for-question)"
            ))),
        }
    }
}

/// The kind of start, derived from the facts and the delivery, never sent.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StartKind {
    Head,
    Worker,
    HandOpened,
    AgentFile,
    Setup,
}

impl StartKind {
    pub fn as_str(self) -> &'static str {
        match self {
            StartKind::Head => "head",
            StartKind::Worker => "worker",
            StartKind::HandOpened => "hand-opened",
            StartKind::AgentFile => "agent-file",
            StartKind::Setup => "setup",
        }
    }

    /// The keys this start kind must supply, read from `x-requiredFacts` of start-request.v1.json.
    pub fn required_facts(self) -> &'static [String] {
        static REQUIRED: OnceLock<BTreeMap<String, Vec<String>>> = OnceLock::new();
        let table = REQUIRED.get_or_init(|| {
            let schema: Value =
                serde_json::from_str(START_REQUEST_SCHEMA).expect("start-request.v1.json is JSON");
            schema["x-requiredFacts"]
                .as_object()
                .expect("start-request.v1.json carries x-requiredFacts")
                .iter()
                .map(|(kind, keys)| {
                    let keys = keys
                        .as_array()
                        .expect("x-requiredFacts lists keys")
                        .iter()
                        .map(|key| {
                            key.as_str()
                                .expect("a required fact is a string")
                                .to_owned()
                        })
                        .collect();
                    (kind.clone(), keys)
                })
                .collect()
        });
        table.get(self.as_str()).map(Vec::as_slice).unwrap_or(&[])
    }
}

/// The one argument of compose.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StartRequest {
    pub facts: BTreeMap<String, String>,
    pub payloads: Vec<Payload>,
    pub delivery: Delivery,
}

impl StartRequest {
    /// Reads a request in the shape of start-request.v1.json. The delivery is checked first, then the payloads; the
    /// facts are checked by compose against the live registry.
    pub fn from_json(value: &Value) -> Result<StartRequest, Refusal> {
        let object = value.as_object().ok_or_else(|| {
            Refusal::new(
                RefusalCode::StartPayloadInvalid,
                "the request is not an object",
            )
        })?;
        if let Some(extra) = object
            .keys()
            .find(|key| !["facts", "payloads", "delivery"].contains(&key.as_str()))
        {
            return Err(Refusal::new(
                RefusalCode::StartPayloadInvalid,
                &format!("the request has an unknown field {extra}"),
            ));
        }
        let delivery_text = object.get("delivery").and_then(Value::as_str).unwrap_or("");
        let delivery = Delivery::parse(delivery_text).ok_or_else(|| {
            Refusal::new(
                RefusalCode::StartDeliveryUnsupported,
                &format!("{delivery_text:?} is not a delivery (opening, prompt-arg, agent-file, hook-context)"),
            )
        })?;
        let payloads = match object.get("payloads") {
            None => Vec::new(),
            Some(Value::Array(items)) => {
                items.iter().map(Payload::parse).collect::<Result<_, _>>()?
            }
            Some(_) => {
                return Err(Refusal::new(
                    RefusalCode::StartPayloadInvalid,
                    "payloads is not a list",
                ))
            }
        };
        let mut facts = BTreeMap::new();
        match object.get("facts") {
            None => {}
            Some(Value::Object(map)) => {
                for (key, value) in map {
                    let text = value
                        .as_str()
                        .filter(|text| !text.is_empty())
                        .ok_or_else(|| {
                            Refusal::new(
                                RefusalCode::StartFactValueInvalid,
                                &format!("fact {key} is not a non-empty string"),
                            )
                        })?;
                    facts.insert(key.clone(), text.to_owned());
                }
            }
            Some(_) => {
                return Err(Refusal::new(
                    RefusalCode::StartFactValueInvalid,
                    "facts is not an object",
                ))
            }
        }
        Ok(StartRequest {
            facts,
            payloads,
            delivery,
        })
    }

    /// The start kind: the `sessionType` fact when present, otherwise an agent file with a persona, else setup.
    pub fn start_kind(&self) -> Option<StartKind> {
        match self.facts.get("sessionType").map(String::as_str) {
            Some("head") => Some(StartKind::Head),
            Some("worker") => Some(StartKind::Worker),
            Some("hand-opened") => Some(StartKind::HandOpened),
            Some(_) => None,
            None if self.facts.contains_key("persona") => Some(StartKind::AgentFile),
            None => Some(StartKind::Setup),
        }
    }
}

/// The named refusals of contracts/refusals.v1.json.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RefusalCode {
    StartFactUnknown,
    StartFactValueInvalid,
    StartFactMissing,
    StartPayloadInvalid,
    StartRuleSetInvalid,
    StartDeliveryUnsupported,
}

impl RefusalCode {
    pub fn as_str(self) -> &'static str {
        match self {
            RefusalCode::StartFactUnknown => "start-fact-unknown",
            RefusalCode::StartFactValueInvalid => "start-fact-value-invalid",
            RefusalCode::StartFactMissing => "start-fact-missing",
            RefusalCode::StartPayloadInvalid => "start-payload-invalid",
            RefusalCode::StartRuleSetInvalid => "start-rule-set-invalid",
            RefusalCode::StartDeliveryUnsupported => "start-delivery-unsupported",
        }
    }
}

/// A named refusal: the whole start fails closed.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Refusal {
    pub code: RefusalCode,
    pub message: String,
    /// The required keys that were absent (start-fact-missing only).
    pub missing: Vec<String>,
}

impl Refusal {
    pub fn new(code: RefusalCode, message: &str) -> Refusal {
        Refusal {
            code,
            message: message.to_owned(),
            missing: Vec::new(),
        }
    }
}

impl std::fmt::Display for Refusal {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}: {}", self.code.as_str(), self.message)
    }
}

impl std::error::Error for Refusal {}
