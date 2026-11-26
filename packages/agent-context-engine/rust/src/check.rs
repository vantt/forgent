//! The write-time check over a whole corpus of units, and the compile that follows a clean check. Every refusal is
//! raised when a rule is written (the pre-commit hook, the `check` verb), never at agent start.
//!
//! Which rules are in force is pkm's answer (lifecycle classes and dates); the caller passes it in, so this module
//! holds no copy of that logic and links no pkm.

use std::collections::{BTreeMap, BTreeSet};

use crate::compose::compose;
use crate::refusal::{Refusal, RefusalCode};
use crate::rule::{Lifecycle, RuleFile};
use crate::set::EffectiveSet;
use crate::when_keys::{check_when, ValueSource};

/// Says whether an owner is a component or a domain of the authority model. `core` is always an owner.
pub trait OwnerRegistry {
    fn is_owner(&self, owner: &str) -> bool;
}

/// An owner registry over a fixed list of ids.
pub struct OwnerList(pub BTreeSet<String>);

impl OwnerRegistry for OwnerList {
    fn is_owner(&self, owner: &str) -> bool {
        self.0.contains(owner)
    }
}

fn run(
    corpus: &[RuleFile],
    in_force: &BTreeSet<String>,
    owners: &dyn OwnerRegistry,
    live: &dyn ValueSource,
) -> (Vec<Refusal>, Option<Vec<RuleFile>>) {
    let mut out: Vec<Refusal> = Vec::new();

    for file in corpus {
        let u = &file.unit;
        if u.owner != "core" && !owners.is_owner(&u.owner) {
            out.push(
                Refusal::new(
                    RefusalCode::OwnerUnknown,
                    format!(
                        "owner \"{}\" is not a component or domain of the authority model",
                        u.owner
                    ),
                )
                .with_ids([u.id.as_str()])
                .with_source(&file.source),
            );
        }
        if let Err(refusal) = check_when(&u.id, &u.when, live) {
            out.push(refusal.with_source(&file.source));
        }
    }

    let mut files_by_id: BTreeMap<&str, Vec<&RuleFile>> = BTreeMap::new();
    for file in corpus {
        files_by_id
            .entry(file.unit.id.as_str())
            .or_default()
            .push(file);
    }
    for (id, files) in &files_by_id {
        if files.len() > 1 {
            let sources: Vec<&str> = files.iter().map(|f| f.source.as_str()).collect();
            out.push(
                Refusal::new(
                    RefusalCode::IdDuplicate,
                    format!(
                        "rule id \"{id}\" is used by {} files: {}",
                        files.len(),
                        sources.join(", ")
                    ),
                )
                .with_ids([*id]),
            );
        }
    }

    for file in corpus
        .iter()
        .filter(|f| f.unit.lifecycle == Lifecycle::Replaced)
    {
        if let Some(successor) = file.unit.superseded_by.as_deref() {
            if !files_by_id.contains_key(successor) {
                out.push(
                    Refusal::new(
                        RefusalCode::ReplacementIncomplete,
                        format!("replaced by \"{successor}\", which does not exist"),
                    )
                    .with_ids([file.unit.id.as_str()])
                    .with_source(&file.source),
                );
            }
        }
    }

    let ordered = match compose(corpus, in_force) {
        Ok(ordered) => Some(ordered),
        Err(conflicts) => {
            out.extend(conflicts.iter().map(|c| c.to_refusal()));
            None
        }
    };

    let mut seen = BTreeSet::new();
    out.retain(|r| seen.insert((r.code, r.ids.clone(), r.message.clone())));
    out.sort();
    let ordered = if out.is_empty() { ordered } else { None };
    (out, ordered)
}

/// Every refusal the corpus earns, sorted; empty when the corpus is clean.
pub fn check(
    corpus: &[RuleFile],
    in_force: &BTreeSet<String>,
    owners: &dyn OwnerRegistry,
    live: &dyn ValueSource,
) -> Vec<Refusal> {
    run(corpus, in_force, owners, live).0
}

/// Checks the corpus and, when it is clean, compiles the effective set.
pub fn compile(
    corpus: &[RuleFile],
    in_force: &BTreeSet<String>,
    owners: &dyn OwnerRegistry,
    live: &dyn ValueSource,
) -> Result<EffectiveSet, Vec<Refusal>> {
    match run(corpus, in_force, owners, live) {
        (_, Some(ordered)) => Ok(EffectiveSet::from_composed(&ordered)),
        (refusals, None) => Err(refusals),
    }
}

/// A rule the nearest-rule search found, by rule id.
#[derive(Debug, Clone, PartialEq)]
pub struct NearestHit {
    pub id: String,
    pub score: f32,
}

/// Keeps the hits of a nearest-rule search that are in force. A search hit carries no lifecycle, so a draft, rejected
/// or retracted rule would otherwise be offered as "the rule you duplicate".
pub fn keep_in_force(hits: Vec<NearestHit>, in_force: &BTreeSet<String>) -> Vec<NearestHit> {
    hits.into_iter()
        .filter(|h| in_force.contains(&h.id))
        .collect()
}
