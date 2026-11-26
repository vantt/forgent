//! The four ports. Each has one adapter today, wired by the host; tests use their own under tests/.

use crate::compose::StartRecord;
use crate::persona::PersonaLookup;
use std::collections::BTreeMap;
use std::time::Duration;

/// One rule of the effective set, as ACE compiled it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Rule {
    pub id: String,
    pub owner: String,
    /// `law`, `procedure`, `boundary`, `preference`, ... A `law` is never dropped by the budget.
    pub kind: String,
    pub body: String,
    /// Fact key to allowed values (any-of); every key must match; empty means always.
    pub when: BTreeMap<String, Vec<String>>,
}

/// ACE's effective rule set, already verified (digest and versions) by ACE's reader.
pub trait RuleSet {
    fn digest(&self) -> &str;
    /// The rules in force, in ACE's composition order.
    fn rules(&self) -> &[Rule];
}

/// The value type of a fact key in ACE's registry.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ValueType {
    Enum,
    String,
}

/// ACE's `when:` key registry and the live values of each key.
pub trait FactRegistry {
    /// The value type of a registered key, or None for a key the registry does not know.
    fn value_type(&self, key: &str) -> Option<ValueType>;
    /// The values the key's source allows now; None when any non-empty value is allowed.
    fn allowed(&self, key: &str) -> Option<Vec<String>>;
}

/// Where the per-start record goes (Observe's record door in production).
pub trait RecordSink {
    /// Appends the record and answers its id.
    fn append(&self, record: &StartRecord) -> String;
}

/// Why a contributor gave no block.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ContributorError {
    Failed(String),
    Timeout,
}

/// The live door: a component's adapter that adds context computed at start time.
pub trait Contributor {
    /// The block text for these facts, or None when there is nothing to add. It must answer within `timeout`.
    fn contribute(
        &self,
        facts: &BTreeMap<String, String>,
        timeout: Duration,
    ) -> Result<Option<String>, ContributorError>;
}

/// The host's persona definitions: what it finds for a name (its agent-definition layers, pinned text first).
pub trait Personas {
    fn lookup(&self, persona: &str) -> PersonaLookup;
}

/// A contributor's registration (contracts/start-contributors.v1.json).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ContributorRow {
    pub id: String,
    pub when: BTreeMap<String, Vec<String>>,
    pub owner: String,
    pub budget_bytes: usize,
    pub timeout_ms: u64,
}

/// The registered contributors in registration order: the rows of `contracts/start-contributors.v1.json`, embedded
/// at build time. A row that does not read is left out; the contract test fails on it.
pub fn registered_contributors() -> Vec<ContributorRow> {
    let doc: serde_json::Value =
        serde_json::from_str(include_str!("../../contracts/start-contributors.v1.json"))
            .unwrap_or_default();
    doc["contributors"]
        .as_array()
        .into_iter()
        .flatten()
        .filter_map(contributor_row)
        .collect()
}

fn contributor_row(row: &serde_json::Value) -> Option<ContributorRow> {
    let when = row["when"]
        .as_object()?
        .iter()
        .map(|(key, values)| {
            let values = values
                .as_array()?
                .iter()
                .map(|v| v.as_str().map(str::to_owned));
            Some((key.clone(), values.collect::<Option<Vec<_>>>()?))
        })
        .collect::<Option<BTreeMap<_, _>>>()?;
    Some(ContributorRow {
        id: row["id"].as_str()?.to_owned(),
        when,
        owner: row["owner"].as_str()?.to_owned(),
        budget_bytes: usize::try_from(row["budgetBytes"].as_u64()?).ok()?,
        timeout_ms: row["timeoutMs"].as_u64()?,
    })
}

/// Everything compose reads, wired by the host.
pub struct Ports<'a> {
    pub rules: &'a dyn RuleSet,
    pub facts: &'a dyn FactRegistry,
    pub record: &'a dyn RecordSink,
    /// The persona definitions; a start with a `persona` fact and no port renders no persona block.
    pub personas: Option<&'a dyn Personas>,
    /// Registered contributors in registration order.
    pub contributors: Vec<(ContributorRow, &'a dyn Contributor)>,
    /// The byte budget of the request's delivery; None for no budget.
    pub budget_bytes: Option<usize>,
}
