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

/// The nearest-rule search could not run; the text says why and what to do.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SearchUnavailable(pub String);

/// The port behind the nearest-rule check: the rules nearest in meaning to a unit, best first, each with its cosine
/// score. The hits may include the unit itself and rules that are not in force; the check drops both.
pub trait NearestRules {
    fn nearest(&self, unit: &RuleFile) -> Result<Vec<NearestHit>, SearchUnavailable>;
}

/// The refusal threshold is the pack profile's `audit.implicit.min`. A hit below it is only a candidate: the probe
/// of the embedding model found 1 of 7 verified paraphrase pairs at 0.93 and 4 of 7 in the top three, so the
/// semantic part of the check is a recall aid below the threshold and never refuses there.
pub const ADVISORY_MIN: f32 = 0.84;
/// How many of the best-ranked hits below the threshold are offered as candidates.
pub const ADVISORY_TOP: usize = 3;
/// The doctor fix that fetches the embedding model the search needs.
pub const MODEL_FIX: &str = "doc-locate-model-fetch";

/// A rule below the refusal threshold that is close enough to be worth a look. Never a refusal.
#[derive(Debug, Clone, PartialEq)]
pub struct Advisory {
    pub id: String,
    pub source: String,
    pub nearest: String,
    pub score: f32,
}

/// What the nearest-rule check found: the refusals, and the candidates printed beside them.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct NearestOutcome {
    pub refusals: Vec<Refusal>,
    pub advisories: Vec<Advisory>,
}

fn mentions(unit: &crate::rule::RuleUnit, other: &str) -> bool {
    [
        &unit.refines,
        &unit.depends_on,
        &unit.conflicts_with,
        &unit.related,
    ]
    .iter()
    .any(|ids| ids.iter().any(|id| id == other))
        || unit.superseded_by.as_deref() == Some(other)
}

/// Whether either rule declares a relation to the other: `superseded_by`, `refines`, `depends_on`, `conflicts_with`
/// or `related` ("checked, distinct"), written on either side.
pub fn related_either_way(a: &crate::rule::RuleUnit, b: &crate::rule::RuleUnit) -> bool {
    mentions(a, &b.id) || mentions(b, &a.id)
}

/// Asks the search for the rules nearest to each changed unit that is in force. A hit at or above `refuse_min` that
/// the unit does not relate to refuses the unit; the best-ranked hits below it, down to [`ADVISORY_MIN`], become
/// advisories. A search that cannot run is one refusal for the whole run, never a silent skip.
pub fn check_nearest(
    changed: &[&RuleFile],
    corpus: &[RuleFile],
    in_force: &BTreeSet<String>,
    refuse_min: f32,
    nearest: &dyn NearestRules,
) -> NearestOutcome {
    let by_id: BTreeMap<&str, &RuleFile> = corpus.iter().map(|f| (f.unit.id.as_str(), f)).collect();
    let mut out = NearestOutcome::default();
    for file in changed.iter().filter(|f| in_force.contains(&f.unit.id)) {
        let unit = &file.unit;
        if !in_force.iter().any(|id| id != &unit.id) {
            continue; // nothing else is in force: nothing to be near
        }
        let hits = match nearest.nearest(file) {
            Ok(hits) => hits,
            Err(SearchUnavailable(why)) => {
                return NearestOutcome {
                    refusals: vec![Refusal::new(
                        RefusalCode::SearchUnavailable,
                        format!(
                            "the nearest-rule search cannot run ({why}); fix: {MODEL_FIX} (run `fgos doctor --fix {MODEL_FIX}`)"
                        ),
                    )
                    .with_ids([unit.id.as_str()])
                    .with_source(&file.source)],
                    advisories: Vec::new(),
                };
            }
        };
        let hits: Vec<NearestHit> = keep_in_force(hits, in_force)
            .into_iter()
            .filter(|h| h.id != unit.id)
            .filter(|h| {
                by_id
                    .get(h.id.as_str())
                    .is_some_and(|o| !related_either_way(unit, &o.unit))
            })
            .collect();
        let mut ranked = hits.iter().enumerate();
        if let Some((_, top)) = ranked.find(|(_, h)| h.score >= refuse_min) {
            out.refusals.push(
                Refusal::new(
                    RefusalCode::NearDuplicate,
                    format!(
                        "rule \"{}\" restates in-force rule \"{}\" (score {:.3}, threshold {refuse_min:.2}); fix: declare the relation in \"{}\" or in \"{}\": superseded_by (the old rule), refines, depends_on, conflicts_with, or related meaning \"checked, distinct\"",
                        unit.id, top.id, top.score, unit.id, top.id
                    ),
                )
                .with_ids([unit.id.as_str(), top.id.as_str()])
                .with_source(&file.source),
            );
            continue;
        }
        for hit in hits
            .iter()
            .take(ADVISORY_TOP)
            .filter(|h| h.score >= ADVISORY_MIN)
        {
            out.advisories.push(Advisory {
                id: unit.id.clone(),
                source: file.source.clone(),
                nearest: hit.id.clone(),
                score: hit.score,
            });
        }
    }
    out.refusals.sort();
    out
}
