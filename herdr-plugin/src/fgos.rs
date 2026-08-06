use std::io;
use std::path::{Path, PathBuf};
use std::process::Command;

use serde::Deserialize;

use crate::ports::WorkItemSource;

/// One row from `fgos triage --json`'s `data` array — already sorted by
/// `rankImpact` (D5), so this module never re-sorts it.
#[derive(Debug, Clone, Deserialize, PartialEq)]
pub struct TriageRow {
    pub id: String,
    pub title: String,
    #[serde(rename = "goalTier")]
    pub goal_tier: Option<String>,
    /// tsk-1e3 D4: the detail modal's Discover button is only enabled at
    /// `"clarify"` — carried through from `rankImpact`'s own `stage` field
    /// (`src/state/impact.mjs`, defaults to `"executing"` when the item
    /// carries none), never re-derived here.
    pub stage: String,
}

#[derive(Debug, Deserialize)]
struct TriageEnvelope {
    data: Vec<TriageRow>,
}

/// One row from `fgos list --all --json`'s `data.work` map, kept only when
/// `status` is `doing` or `awaiting-approval` (tsk-4vo D1, amending
/// tsk-19y's original D4 — never herdr's own `agent_status` either way).
#[derive(Debug, Clone, Deserialize, PartialEq)]
pub struct DoingRow {
    pub id: String,
    pub title: String,
    pub status: String,
    pub stage: String,
}

#[derive(Debug, Deserialize)]
struct WorkItemRaw {
    title: String,
    status: String,
    stage: String,
    #[serde(rename = "parkReason")]
    park_reason: Option<String>,
    #[serde(rename = "statusCategory")]
    status_category: Option<String>,
}

/// tsk-4vo D2: Tier A (`awaiting-approval`, closest to done) sorts first;
/// Tier B (`doing`) sub-sorts by stage in pipeline order — `executing`
/// (closest to `compound-learn`) before `decompose` before `clarify`.
fn doing_tier(status: &str, stage: &str) -> u8 {
    if status == "awaiting-approval" {
        return 0;
    }
    match stage {
        "executing" => 1,
        "decompose" => 2,
        "clarify" => 3,
        _ => 4,
    }
}

#[derive(Debug, Deserialize)]
struct ListEnvelope {
    data: ListData,
}

#[derive(Debug, Deserialize)]
struct ListData {
    work: std::collections::BTreeMap<String, WorkItemRaw>,
}

#[derive(Debug)]
pub enum FgosError {
    Io(io::Error),
    ExitStatus(String),
    Parse(serde_json::Error),
}

impl std::fmt::Display for FgosError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            FgosError::Io(err) => write!(f, "fgos CLI spawn failed: {err}"),
            FgosError::ExitStatus(detail) => write!(f, "fgos CLI exited non-zero: {detail}"),
            FgosError::Parse(err) => write!(f, "fgos CLI output parse failed: {err}"),
        }
    }
}

impl From<io::Error> for FgosError {
    fn from(err: io::Error) -> Self {
        FgosError::Io(err)
    }
}

/// Parse `fgos triage --json`'s stdout, preserving the CLI's own row order
/// — already the impact-first sort tsk-4vo asks for (see
/// `parse_triage_preserves_rank_impact_order` below); no change needed
/// here for that part of the item, only `parse_doing`'s sort (D1/D2).
/// (the D5 `rankImpact` order) without re-sorting it here.
pub fn parse_triage(json: &str) -> Result<Vec<TriageRow>, serde_json::Error> {
    let envelope: TriageEnvelope = serde_json::from_str(json)?;
    Ok(envelope.data)
}

/// Parse `fgos list --all --json`'s stdout, keeping items whose `parkReason`
/// is absent (actively worked, the `doing`-equivalent case) or
/// `"natural-finish"` (the `awaiting-approval`-equivalent case) AND whose
/// `statusCategory` is `"in-progress"` or `"review"` (tsk-1hb D2/D4,
/// replacing tsk-4vo D1's literal-status membership: no parallel
/// status-literal fallback is kept). The `statusCategory` half excludes
/// `todo`/`wontfix`/`done`/`delivered`/`retrospective`/`cleanup` -- every
/// status besides `doing`/`blocked`/`awaiting-human`/`awaiting-approval`
/// also has no `parkReason`, so `parkReason` alone can't tell them apart
/// (D4). Sorted by D2's tier (id ascending breaks ties within a tier, for
/// determinism); `status`/`stage` stay available on `DoingRow` for
/// display/sort, just no longer used for pane membership.
pub fn parse_doing(json: &str) -> Result<Vec<DoingRow>, serde_json::Error> {
    let envelope: ListEnvelope = serde_json::from_str(json)?;
    let mut rows: Vec<DoingRow> = envelope
        .data
        .work
        .into_iter()
        .filter(|(_, item)| {
            matches!(item.park_reason.as_deref(), None | Some("natural-finish"))
                && matches!(item.status_category.as_deref(), Some("in-progress") | Some("review"))
        })
        .map(|(id, item)| DoingRow {
            id,
            title: item.title,
            status: item.status,
            stage: item.stage,
        })
        .collect();
    rows.sort_by(|a, b| {
        doing_tier(&a.status, &a.stage)
            .cmp(&doing_tier(&b.status, &b.stage))
            .then_with(|| a.id.cmp(&b.id))
    });
    Ok(rows)
}

/// Resolve the main fgOS checkout root (never a linked worktree's own
/// checkout — ADR0020) via `git rev-parse --git-common-dir`, the same
/// resolution every fgOS skill in this repo uses.
pub fn repo_root() -> io::Result<PathBuf> {
    let output = Command::new("git")
        .args(["rev-parse", "--path-format=absolute", "--git-common-dir"])
        .output()?;
    if !output.status.success() {
        return Err(io::Error::other(format!(
            "git rev-parse --git-common-dir failed: {}",
            String::from_utf8_lossy(&output.stderr)
        )));
    }
    let common_dir = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let common_dir_path = Path::new(&common_dir);
    let root = common_dir_path
        .parent()
        .ok_or_else(|| io::Error::other("git-common-dir has no parent directory"))?;
    Ok(root.to_path_buf())
}

fn run_fgos(root: &Path, args: &[&str]) -> Result<String, FgosError> {
    let mut cmd_args: Vec<String> = vec![root.join("bin/fgos.mjs").to_string_lossy().to_string()];
    cmd_args.extend(args.iter().map(|s| s.to_string()));
    cmd_args.push("--dir".to_string());
    cmd_args.push(root.to_string_lossy().to_string());

    let output = Command::new("node").args(&cmd_args).output()?;
    if !output.status.success() {
        return Err(FgosError::ExitStatus(
            String::from_utf8_lossy(&output.stderr).to_string(),
        ));
    }
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

/// Fetch the impact-sorted work list via `fgos triage --json` (D5).
pub fn fetch_triage(root: &Path) -> Result<Vec<TriageRow>, FgosError> {
    let stdout = run_fgos(root, &["triage", "--json"])?;
    parse_triage(&stdout).map_err(FgosError::Parse)
}

/// Fetch the in-process (`status: doing`) list via `fgos list --all --json` (D4).
pub fn fetch_doing(root: &Path) -> Result<Vec<DoingRow>, FgosError> {
    let stdout = run_fgos(root, &["list", "--all", "--json"])?;
    parse_doing(&stdout).map_err(FgosError::Parse)
}

/// The `WorkItemSource` adapter (tsk-3t9 D1): the concrete fgOS-CLI
/// implementation of the port `app.rs`'s domain depends on. Holds `root`
/// so the composition root (`main.rs`) resolves it once, not per call.
pub struct FgosCliSource {
    pub root: PathBuf,
}

impl WorkItemSource for FgosCliSource {
    fn fetch_triage(&self) -> Result<Vec<TriageRow>, FgosError> {
        fetch_triage(&self.root)
    }

    fn fetch_doing(&self) -> Result<Vec<DoingRow>, FgosError> {
        fetch_doing(&self.root)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const TRIAGE_FIXTURE: &str = r#"{
        "contract": "fgos.v1",
        "generated_at": "2026-07-29T15:41:13.319Z",
        "data_hash": "abc",
        "data": [
            {
                "id": "tsk-mvp-test-1",
                "title": "MVP goalTier test item",
                "status": "wontfix",
                "blocks": 0,
                "stage": "executing",
                "goalTier": "mvp",
                "componentId": 4,
                "componentSize": 1,
                "isIsolated": true
            },
            {
                "id": "tsk-19y-2",
                "title": "Wire real fgOS data into the dashboard",
                "status": "doing",
                "blocks": 2,
                "stage": "executing",
                "goalTier": null,
                "componentId": 27,
                "componentSize": 3,
                "isIsolated": false
            },
            {
                "id": "choke-point-createworktree-callsite-wrapper",
                "title": "Choke-point: createWorktree's 6 call sites",
                "status": "doing",
                "blocks": 1,
                "stage": "executing",
                "goalTier": null,
                "componentId": 31,
                "componentSize": 4,
                "isIsolated": false
            }
        ]
    }"#;

    const LIST_FIXTURE: &str = r#"{
        "contract": "fgos.v1",
        "generated_at": "2026-07-29T15:41:13.319Z",
        "data_hash": "abc",
        "data": {
            "work": {
                "tsk-19y-2": {
                    "title": "Wire real fgOS data into the dashboard",
                    "status": "doing",
                    "stage": "executing",
                    "statusCategory": "in-progress"
                },
                "tsk-done-item": {
                    "title": "Already finished",
                    "status": "done",
                    "stage": "compound-learn"
                },
                "choke-point-createworktree-callsite-wrapper": {
                    "title": "Choke-point: createWorktree's 6 call sites",
                    "status": "doing",
                    "stage": "executing",
                    "statusCategory": "in-progress"
                }
            }
        }
    }"#;

    /// tsk-4vo D1/D2: one `awaiting-approval` row, plus `doing` rows at
    /// every pipeline stage, deliberately listed out of sort order in the
    /// raw JSON to prove `parse_doing` does the sorting itself.
    const TIER_SORT_FIXTURE: &str = r#"{
        "contract": "fgos.v1",
        "generated_at": "2026-07-29T15:41:13.319Z",
        "data_hash": "abc",
        "data": {
            "work": {
                "tsk-clarify": {
                    "title": "Still fuzzy",
                    "status": "doing",
                    "stage": "clarify",
                    "statusCategory": "in-progress"
                },
                "tsk-approval": {
                    "title": "Awaiting approval",
                    "status": "awaiting-approval",
                    "stage": "executing",
                    "statusCategory": "review",
                    "parkReason": "natural-finish"
                },
                "tsk-executing": {
                    "title": "Building",
                    "status": "doing",
                    "stage": "executing",
                    "statusCategory": "in-progress"
                },
                "tsk-decompose": {
                    "title": "Shaping",
                    "status": "doing",
                    "stage": "decompose",
                    "statusCategory": "in-progress"
                },
                "tsk-blocked": {
                    "title": "Not in-process",
                    "status": "blocked",
                    "stage": "executing",
                    "statusCategory": "in-progress",
                    "parkReason": "system-error"
                }
            }
        }
    }"#;

    #[test]
    fn parse_triage_preserves_rank_impact_order() {
        let rows = parse_triage(TRIAGE_FIXTURE).expect("fixture should parse");
        let ids: Vec<&str> = rows.iter().map(|r| r.id.as_str()).collect();
        // Byte-for-byte match against D5's rankImpact order: goalTier tier
        // first (mvp before none), then this fixture's own given order for
        // the rest — parsing must never re-sort what the CLI already sorted.
        assert_eq!(
            ids,
            vec![
                "tsk-mvp-test-1",
                "tsk-19y-2",
                "choke-point-createworktree-callsite-wrapper",
            ]
        );
        assert_eq!(rows[0].goal_tier.as_deref(), Some("mvp"));
        assert_eq!(rows[1].goal_tier, None);
    }

    #[test]
    fn parse_doing_excludes_done_items() {
        let rows = parse_doing(LIST_FIXTURE).expect("fixture should parse");
        let ids: Vec<&str> = rows.iter().map(|r| r.id.as_str()).collect();
        assert_eq!(
            ids,
            vec!["choke-point-createworktree-callsite-wrapper", "tsk-19y-2"]
        );
        assert!(rows.iter().all(|r| r.title != "Already finished"));
    }

    #[test]
    fn sort_status_tier_ranks_awaiting_approval_first_then_stage_order() {
        let rows = parse_doing(TIER_SORT_FIXTURE).expect("fixture should parse");
        let ids: Vec<&str> = rows.iter().map(|r| r.id.as_str()).collect();
        // D2: awaiting-approval first, then doing sub-sorted executing ->
        // decompose -> clarify. "blocked" status never appears (D4's
        // combined parkReason+statusCategory predicate excludes it via
        // parkReason == "system-error").
        assert_eq!(
            ids,
            vec!["tsk-approval", "tsk-executing", "tsk-decompose", "tsk-clarify"]
        );
        assert!(rows.iter().all(|r| r.id != "tsk-blocked"));
    }

    /// tsk-1hb D2/D4 (docs/history/herdr-plugin-parkreason-pane-filter/
    /// CONTEXT.md), superseding tsk-4ot's own `parse_doing_pins_literal_
    /// status_membership`: pins `parse_doing`'s `parkReason`+`statusCategory`
    /// combined membership. `blocked`/`awaiting-human` deliberately share the
    /// coding domain's `"in-progress"` `statusCategory` with `doing`
    /// (`DOMAINS.coding.statusLabels`, `src/state/workflow-stage-graphs.mjs`)
    /// — this is exactly why `statusCategory` alone is insufficient and
    /// `parkReason` (`"system-error"`/`"human-question"`) is still needed to
    /// split them out; `tsk-todo` (no `statusCategory` entry) pins the D4
    /// half of the fix (a `parkReason`-only filter would wrongly include it,
    /// same failure shape as `tsk-done-item` in `parse_doing_excludes_done_
    /// items` above).
    const STATUS_MEMBERSHIP_FIXTURE: &str = r#"{
        "contract": "fgos.v1",
        "generated_at": "2026-07-29T15:41:13.319Z",
        "data_hash": "abc",
        "data": {
            "work": {
                "tsk-doing": {
                    "title": "Actively worked",
                    "status": "doing",
                    "stage": "executing",
                    "statusCategory": "in-progress"
                },
                "tsk-awaiting-approval": {
                    "title": "Ready for review",
                    "status": "awaiting-approval",
                    "stage": "executing",
                    "statusCategory": "review",
                    "parkReason": "natural-finish"
                },
                "tsk-blocked": {
                    "title": "Parked, not actively worked",
                    "status": "blocked",
                    "stage": "executing",
                    "statusCategory": "in-progress",
                    "parkReason": "system-error"
                },
                "tsk-awaiting-human": {
                    "title": "Parked on a question",
                    "status": "awaiting-human",
                    "stage": "clarify",
                    "statusCategory": "in-progress",
                    "parkReason": "human-question"
                },
                "tsk-todo": {
                    "title": "Not started",
                    "status": "todo",
                    "stage": "clarify",
                    "statusCategory": "todo"
                }
            }
        }
    }"#;

    #[test]
    fn parse_doing_filters_by_park_reason_and_status_category() {
        let rows = parse_doing(STATUS_MEMBERSHIP_FIXTURE).expect("fixture should parse");
        let ids: Vec<&str> = rows.iter().map(|r| r.id.as_str()).collect();
        assert_eq!(ids.len(), 2, "only doing/awaiting-approval belong in the in-process pane");
        assert!(ids.contains(&"tsk-doing"));
        assert!(ids.contains(&"tsk-awaiting-approval"));
        assert!(!ids.contains(&"tsk-blocked"));
        assert!(!ids.contains(&"tsk-awaiting-human"));
        assert!(!ids.contains(&"tsk-todo"));
    }
}
