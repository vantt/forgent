//! Attribution dimensions and the policy that reads them.
//!
//! Observation states what changed. Attribution states how strongly evidence ties that change to a Run. Policy
//! decides whether the round may be accepted. The three are independent and stored and read independently.

use fgos_write_scope::{matches as scope_matches, ScopeError};
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};

pub const ATTRIBUTION_LEVELS: [&str; 4] = ["proven", "correlated", "excluded", "unattributed"];

/// How strongly the evidence ties a change to the run.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Level {
    Proven,
    Correlated,
    Excluded,
    Unattributed,
}

/// When a change was first seen.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum FirstObserved {
    PreLaunch,
    PostRun,
}

/// One change and the strength of the evidence that it belongs to the run.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Attribution {
    pub path: String,
    pub first_observed: FirstObserved,
    pub level: Level,
    pub basis: Vec<String>,
    pub coverage_matched: bool,
}

/// The checkout as seen before launch and after the run, and what the run's observer vouches for.
#[derive(Debug, Clone, Default)]
pub struct WorkspaceObservation<'a> {
    pub pre_launch_dirt: &'a [String],
    pub post_run_dirt: &'a [String],
    /// Pre-launch file hashes, path to sha256; an empty hash reads as missing.
    pub dirty_before_hashes: BTreeMap<String, String>,
    pub post_run_hashes: BTreeMap<String, String>,
    /// The write scope the run's confinement covers; `None` when none was declared.
    pub declared_coverage: Option<&'a [String]>,
    /// The paths the adapter or confinement positively attests the run wrote.
    pub attested_paths: Option<&'a [String]>,
}

fn record(
    path: &str,
    first: FirstObserved,
    level: Level,
    basis: &[&str],
    coverage_matched: bool,
) -> Attribution {
    Attribution {
        path: path.to_string(),
        first_observed: first,
        level,
        basis: basis.iter().map(|b| (*b).to_string()).collect(),
        coverage_matched,
    }
}

fn covered(path: &str, coverage: Option<&[String]>) -> Result<bool, ScopeError> {
    match coverage {
        Some(paths) if !paths.is_empty() => scope_matches(path.as_bytes(), paths),
        _ => Ok(false),
    }
}

fn attested(path: &str, attested: Option<&[String]>) -> bool {
    attested.is_some_and(|paths| paths.iter().any(|p| p == path))
}

/// Attribute workspace changes (pre-launch dirt against post-run dirt).
///
/// - Pre-existing dirt with an unchanged hash is `excluded` from this run.
/// - Post-run dirt without a positive observer is at most `correlated`.
/// - A positive attestation yields `proven` only within the declared coverage.
/// - Dirt present both times without both hashes is `excluded` by timing.
pub fn attribute_workspace_changes(
    observation: &WorkspaceObservation<'_>,
) -> Result<Vec<Attribution>, ScopeError> {
    let pre: BTreeSet<&String> = observation.pre_launch_dirt.iter().collect();
    let post: BTreeSet<&String> = observation.post_run_dirt.iter().collect();
    let hash = |map: &BTreeMap<String, String>, path: &str| {
        map.get(path).filter(|h| !h.is_empty()).cloned()
    };
    let mut records = Vec::new();
    for path in pre.union(&post) {
        let (was_pre, is_post) = (pre.contains(*path), post.contains(*path));
        let path = path.as_str();
        use FirstObserved::{PostRun, PreLaunch};
        use Level::{Correlated, Excluded, Proven};
        if was_pre && is_post {
            match (
                hash(&observation.dirty_before_hashes, path),
                hash(&observation.post_run_hashes, path),
            ) {
                (Some(before), Some(after)) if before == after => {
                    records.push(record(
                        path,
                        PreLaunch,
                        Excluded,
                        &["dirty-before-hash-match"],
                        false,
                    ));
                }
                (Some(_), Some(_)) => {
                    let is_covered = covered(path, observation.declared_coverage)?;
                    let positive = attested(path, observation.attested_paths) && is_covered;
                    records.push(if positive {
                        record(
                            path,
                            PreLaunch,
                            Proven,
                            &[
                                "adapter-confinement-attestation",
                                "pre-existing-dirt-mutated",
                            ],
                            is_covered,
                        )
                    } else {
                        record(
                            path,
                            PreLaunch,
                            Correlated,
                            &["pre-existing-dirt-mutated", "pre-post-git-snapshot"],
                            is_covered,
                        )
                    });
                }
                _ => records.push(record(
                    path,
                    PreLaunch,
                    Excluded,
                    &["pre-launch-git-status"],
                    false,
                )),
            }
        } else if was_pre {
            records.push(record(
                path,
                PreLaunch,
                Excluded,
                &["pre-launch-dirt-cleared"],
                false,
            ));
        } else {
            let is_covered = covered(path, observation.declared_coverage)?;
            records.push(
                if attested(path, observation.attested_paths) && is_covered {
                    record(
                        path,
                        PostRun,
                        Proven,
                        &["adapter-confinement-attestation"],
                        true,
                    )
                } else {
                    // Without a positive observer, post-run git dirt is at most correlated.
                    record(
                        path,
                        PostRun,
                        Correlated,
                        &["pre-post-git-snapshot"],
                        is_covered,
                    )
                },
            );
        }
    }
    Ok(records)
}

/// An evidence reference the worker's claim carries, and how far it is believed.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct ClaimRefAttribution {
    #[serde(rename = "ref")]
    pub reference: serde_json::Value,
    pub level: Level,
    pub basis: Vec<String>,
}

/// Worker-provided evidence refs are untrusted claims: correlated by default.
pub fn attribute_claim_evidence_refs(refs: &[serde_json::Value]) -> Vec<ClaimRefAttribution> {
    refs.iter()
        .map(|reference| ClaimRefAttribution {
            reference: reference.clone(),
            level: Level::Correlated,
            basis: vec!["worker-claim-ref".to_string()],
        })
        .collect()
}

/// Whether the round may be accepted.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum Disposition {
    Allow,
    Refuse,
}

/// A finding that rests on correlated evidence only: reported, never a reason to refuse.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct AttributionWarning {
    pub code: String,
    pub level: Level,
    pub basis: Vec<String>,
    pub paths: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct PolicyVerdict {
    pub disposition: Disposition,
    pub code: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
    pub warnings: Vec<AttributionWarning>,
}

#[derive(Debug, Clone, Default)]
pub struct PolicyInput<'a> {
    pub attributions: &'a [Attribution],
    pub is_read_only: bool,
    pub write_scope: Option<&'a [String]>,
    /// Files that were dirty before and changed content during the run.
    pub mutated_dirty_before_files: &'a [String],
    /// Whether the worker's claim contradicts independent evidence.
    pub contradictory_claim: bool,
}

fn refuse(code: &str, reason: String) -> PolicyVerdict {
    PolicyVerdict {
        disposition: Disposition::Refuse,
        code: Some(code.to_string()),
        reason: Some(reason),
        warnings: Vec::new(),
    }
}

fn paths_of(items: &[&Attribution]) -> Vec<String> {
    items.iter().map(|a| a.path.clone()).collect()
}

/// Evaluate the safety and attribution policy.
///
/// A before/after snapshot of a checkout shows what changed there, never who changed it: the checkout may be
/// shared with other sessions that write and commit while a run is in flight. So every finding resting on
/// correlated evidence is a warning and the run is accepted. Only a write proven to belong to the run, attested by
/// a run-bound observer within its coverage, is refused. A refusal preserves execution and assessment facts.
pub fn evaluate_attribution_policy(input: &PolicyInput<'_>) -> Result<PolicyVerdict, ScopeError> {
    if input.contradictory_claim {
        return Ok(refuse(
            "contradictory-worker-claim",
            "Worker claim contradicts independent evidence".to_string(),
        ));
    }
    let post_run: Vec<&Attribution> = input
        .attributions
        .iter()
        .filter(|a| a.first_observed == FirstObserved::PostRun)
        .collect();
    let proven: Vec<&Attribution> = post_run
        .iter()
        .copied()
        .filter(|a| a.level == Level::Proven)
        .collect();
    let correlated: Vec<&Attribution> = post_run
        .iter()
        .copied()
        .filter(|a| a.level == Level::Correlated)
        .collect();

    if input.is_read_only && !proven.is_empty() {
        return Ok(refuse(
            "read-only-mutation",
            format!(
                "Read-only operation wrote: {}",
                paths_of(&proven).join(", ")
            ),
        ));
    }
    let scope = input.write_scope.filter(|s| !s.is_empty());
    let outside = |items: &[&Attribution], scope: &[String]| -> Result<Vec<String>, ScopeError> {
        let mut out = Vec::new();
        for item in items {
            if !scope_matches(item.path.as_bytes(), scope)? {
                out.push(item.path.clone());
            }
        }
        Ok(out)
    };
    if let Some(scope) = scope {
        let proven_outside = outside(&proven, scope)?;
        if !proven_outside.is_empty() {
            return Ok(refuse(
                "outside-write-scope",
                format!(
                    "Run wrote outside its allowed write scope: {}",
                    proven_outside.join(", ")
                ),
            ));
        }
    }

    let mut warnings = Vec::new();
    if !input.mutated_dirty_before_files.is_empty() {
        warnings.push(AttributionWarning {
            code: "mutated-dirty-before-correlated".to_string(),
            level: Level::Correlated,
            basis: vec!["dirty-before-hash-changed".to_string()],
            paths: input.mutated_dirty_before_files.to_vec(),
        });
    }
    if input.is_read_only && !correlated.is_empty() {
        warnings.push(AttributionWarning {
            code: "read-only-mutation-correlated".to_string(),
            level: Level::Correlated,
            basis: vec!["pre-post-git-snapshot".to_string()],
            paths: paths_of(&correlated),
        });
    } else if let Some(scope) = scope {
        let correlated_outside = outside(&correlated, scope)?;
        if !correlated_outside.is_empty() {
            warnings.push(AttributionWarning {
                code: "outside-write-scope-correlated".to_string(),
                level: Level::Correlated,
                basis: vec!["pre-post-git-snapshot".to_string()],
                paths: correlated_outside,
            });
        }
    }
    Ok(PolicyVerdict {
        disposition: Disposition::Allow,
        code: None,
        reason: None,
        warnings,
    })
}
