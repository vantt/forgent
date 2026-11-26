//! compose: validate, select, place, contribute, budget, record.

use crate::ports::{ContributorError, Ports};
use crate::request::{Refusal, RefusalCode, StartRequest};
use std::collections::BTreeMap;
use std::time::Duration;

/// One block of the answer, in the order the agent receives it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Block {
    pub id: String,
    /// `rule:<id>`, `payload:<kind>` or `contributor:<id>`.
    pub source: String,
    pub text: String,
    pub bytes: usize,
}

/// Why a block was left out.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DropReason {
    OverBudget,
    ContributorFailed,
    ContributorTimeout,
}

impl DropReason {
    pub fn as_str(self) -> &'static str {
        match self {
            DropReason::OverBudget => "over-budget",
            DropReason::ContributorFailed => "contributor-failed",
            DropReason::ContributorTimeout => "contributor-timeout",
        }
    }
}

/// A block left out, with its reason.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Dropped {
    pub id: String,
    pub reason: DropReason,
}

/// The answer of compose (contracts/start-context.v1.json).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StartContext {
    pub blocks: Vec<Block>,
    pub matched: Vec<String>,
    pub rule_set_digest: String,
    pub record: String,
    pub dropped: Vec<Dropped>,
}

/// The per-start record handed to the record sink.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StartRecord {
    pub facts: BTreeMap<String, String>,
    pub delivery: String,
    pub rule_set_digest: String,
    pub matched: Vec<String>,
    /// Block id and bytes, in order.
    pub blocks: Vec<(String, usize)>,
    pub dropped: Vec<Dropped>,
}

/// A candidate block with what the budget needs to know about it.
struct Candidate {
    block: Block,
    /// Payloads and laws are never dropped.
    required: bool,
}

fn matches(when: &BTreeMap<String, Vec<String>>, facts: &BTreeMap<String, String>) -> bool {
    when.iter()
        .all(|(key, allowed)| facts.get(key).is_some_and(|value| allowed.contains(value)))
}

fn block(id: &str, source: String, text: String) -> Block {
    let bytes = text.len();
    Block {
        id: id.to_owned(),
        source,
        text,
        bytes,
    }
}

fn validate(request: &StartRequest, ports: &Ports<'_>) -> Result<(), Refusal> {
    for (key, value) in &request.facts {
        let Some(value_type) = ports.facts.value_type(key) else {
            return Err(Refusal::new(
                RefusalCode::StartFactUnknown,
                &format!("fact key {key} is not in the when-keys registry"),
            ));
        };
        let allowed = ports.facts.allowed(key);
        let ok = match (value_type, allowed) {
            (_, Some(values)) => values.iter().any(|allowed| allowed == value),
            // A live source with no list leaves the value unchecked, as the agent context engine treats it.
            (_, None) => !value.is_empty(),
        };
        if !ok {
            return Err(Refusal::new(
                RefusalCode::StartFactValueInvalid,
                &format!("fact {key}={value} is not a value its source allows now"),
            ));
        }
    }
    let kind = request.start_kind().ok_or_else(|| {
        Refusal::new(
            RefusalCode::StartFactValueInvalid,
            "sessionType names no start kind",
        )
    })?;
    let missing: Vec<String> = kind
        .required_facts()
        .iter()
        .filter(|key| !request.facts.contains_key(*key))
        .cloned()
        .collect();
    if !missing.is_empty() {
        let mut refusal = Refusal::new(
            RefusalCode::StartFactMissing,
            &format!(
                "a {} start must supply {}",
                kind.as_str(),
                missing.join(", ")
            ),
        );
        refusal.missing = missing;
        return Err(refusal);
    }
    Ok(())
}

/// Composes the start text: the matching rules in ACE's order, then the payloads in request order, then the
/// contributors in registration order; optional blocks over the budget are dropped lowest priority first
/// (contributors before rules, later before earlier); payloads and laws are never dropped.
pub fn compose(request: &StartRequest, ports: &Ports<'_>) -> Result<StartContext, Refusal> {
    validate(request, ports)?;

    let mut candidates = Vec::new();
    let mut matched = Vec::new();
    for rule in ports.rules.rules() {
        if matches(&rule.when, &request.facts) {
            matched.push(rule.id.clone());
            candidates.push(Candidate {
                block: block(&rule.id, format!("rule:{}", rule.id), rule.body.clone()),
                required: rule.kind == "law",
            });
        }
    }
    let mut seen = BTreeMap::<&str, usize>::new();
    for payload in &request.payloads {
        let n = seen.entry(payload.kind()).or_insert(0);
        *n += 1;
        let id = if *n == 1 {
            payload.kind().to_owned()
        } else {
            format!("{}-{}", payload.kind(), n)
        };
        candidates.push(Candidate {
            block: block(&id, format!("payload:{}", payload.kind()), payload.text()),
            required: true,
        });
    }

    let mut dropped = Vec::new();
    for (row, contributor) in &ports.contributors {
        if !matches(&row.when, &request.facts) {
            continue;
        }
        match contributor.contribute(&request.facts, Duration::from_millis(row.timeout_ms)) {
            Ok(Some(text)) if text.len() <= row.budget_bytes => candidates.push(Candidate {
                block: block(&row.id, format!("contributor:{}", row.id), text),
                required: false,
            }),
            Ok(Some(_)) => dropped.push(Dropped {
                id: row.id.clone(),
                reason: DropReason::OverBudget,
            }),
            Ok(None) => {}
            Err(ContributorError::Timeout) => dropped.push(Dropped {
                id: row.id.clone(),
                reason: DropReason::ContributorTimeout,
            }),
            Err(ContributorError::Failed(_)) => dropped.push(Dropped {
                id: row.id.clone(),
                reason: DropReason::ContributorFailed,
            }),
        }
    }

    if let Some(budget) = ports.budget_bytes {
        let mut total: usize = candidates.iter().map(|c| c.block.bytes).sum();
        // Contributors are placed last, so walking back from the end drops contributors first, then the latest rules.
        let mut index = candidates.len();
        while total > budget && index > 0 {
            index -= 1;
            if candidates[index].required {
                continue;
            }
            let removed = candidates.remove(index);
            total -= removed.block.bytes;
            if removed.block.source.starts_with("rule:") {
                matched.retain(|id| id != &removed.block.id);
            }
            dropped.push(Dropped {
                id: removed.block.id,
                reason: DropReason::OverBudget,
            });
        }
    }

    let blocks: Vec<Block> = candidates.into_iter().map(|c| c.block).collect();
    let record = StartRecord {
        facts: request.facts.clone(),
        delivery: request.delivery.as_str().to_owned(),
        rule_set_digest: ports.rules.digest().to_owned(),
        matched: matched.clone(),
        blocks: blocks.iter().map(|b| (b.id.clone(), b.bytes)).collect(),
        dropped: dropped.clone(),
    };
    let record_id = ports.record.append(&record);
    Ok(StartContext {
        blocks,
        matched,
        rule_set_digest: ports.rules.digest().to_owned(),
        record: record_id,
        dropped,
    })
}
