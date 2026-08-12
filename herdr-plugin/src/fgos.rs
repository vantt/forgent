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
    /// tsk-64z D1: the Work Items panel's Status column and tab filter
    /// (TODO/DOING/REVIEW/DONE) both key off this raw literal
    /// (`docs/reference/triage-table-columns.md`'s own "rendered as-is").
    pub status: String,
    /// tsk-64z D1: "Blocked By" column — ids of OTHER still-open items
    /// this row directly waits on (`rankImpact`'s own `blockedBy`,
    /// `src/state/impact.mjs`). Comma-joined at render time, never here.
    #[serde(rename = "blockedBy")]
    pub blocked_by: Vec<String>,
    /// tsk-64z D1: "Blocks" column — count of OTHER still-open items that
    /// directly wait on this one.
    pub blocks: u32,
    /// tsk-64z D2: sort key, ASCENDING (smaller number = higher priority —
    /// `src/state/priority-formula.mjs`'s inverted scale). `None` when the
    /// item never had `computePriority` run on it yet (e.g. still at
    /// `todo`, pre-`discover`).
    pub priority: Option<i64>,
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
    /// tsk-1pg D1: real state can carry no `stage` at all (an item with no
    /// `stage` field, e.g. `status: wontfix`) — `Option` so one such item
    /// in the map doesn't fail `serde_json::from_str::<ListEnvelope>` for
    /// every other item alongside it. Defaulted to `"executing"` at each
    /// read site, matching the JS engine's own `item.stage ?? 'executing'`
    /// convention (`src/state/frontier.mjs`, `src/intake/decompose.mjs`).
    stage: Option<String>,
    #[serde(rename = "parkReason")]
    park_reason: Option<String>,
    #[serde(rename = "statusCategory")]
    status_category: Option<String>,
}

/// tsk-4vo D2: Tier A (`awaiting-approval`, closest to done) sorts first;
/// Tier B (`doing`) sub-sorts by stage in pipeline order — `executing`
/// (closest to `compound-learn`) before `planning` before `exploring`
/// before `discovery`.
///
/// The arms mirror `DOMAINS.coding.stages` (`src/state/workflow-stage-
/// graphs.mjs`) read back-to-front, so a stage the engine can actually
/// hand this dashboard always ranks. `decompose` is kept, sharing
/// `planning`'s rank rather than getting one of its own: it is that same
/// stage under its pre-rename name, still held by the few items open when
/// the rename landed, and the engine's own skill map aliases the two to
/// one skill. It goes when the last item drains off it. `clarify` is not
/// kept — that stage retired with its items migrated off, so no item can
/// hold it and an arm for it would rank nothing.
fn doing_tier(status: &str, stage: &str) -> u8 {
    if status == "awaiting-approval" {
        return 0;
    }
    match stage {
        "executing" => 1,
        "planning" | "decompose" => 2,
        "exploring" => 3,
        "discovery" => 4,
        _ => 5,
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

/// tsk-417 D3: NEED ANSWER box row — `status` is `"blocked"` (ERR,
/// `parkReason: system-error`) or `"awaiting-human"` (ASK, `parkReason:
/// human-question`), one box, distinct sub-tag per `status`.
#[derive(Debug, Clone, Deserialize, PartialEq)]
pub struct NeedAnswerRow {
    pub id: String,
    pub title: String,
    pub status: String,
}

/// tsk-417 D3: AFTER DELIVER box row — `status` is `"retrospective"` (RTR)
/// or `"cleanup"` (POL), one box, distinct sub-tag per `status`. Neither
/// status carries a `statusCategory` (the tail chain's own documented
/// gap, `workflow-stage-graphs.mjs`), so this filters on the literal
/// `status` string, same as `NeedAnswerRow` above.
#[derive(Debug, Clone, Deserialize, PartialEq)]
pub struct AfterDeliverRow {
    pub id: String,
    pub title: String,
    pub status: String,
}

/// tsk-59b: one node of `fgos merge list --json`'s `tree` field
/// (`mergeTree`, `src/state/graph-harness.mjs` — tsk-2x9k). Recursive:
/// `children` nests leaf-to-root items under their real parent, sorted by
/// the same `blocks`-descending order the JS engine already computed
/// (CONTEXT.md D3/D4 — this struct never re-sorts, only reflects). `status`
/// is one of `ready`/`waiting`/`blocked-sync`/`conflicted`/`superseded`/
/// `container` (a real ancestor item that is not itself a merge candidate,
/// existing purely so its children have somewhere to nest — D2/D3).
/// `reason` is present only on `blocked-sync`/`conflicted`/`superseded`
/// nodes, naming the specific cause and counterpart item (D7) — absent
/// (not empty-string) on every other status, matching the JS side's own
/// `reason?: string` optionality.
#[derive(Debug, Clone, Default, Deserialize, PartialEq)]
pub struct MergeTreeNode {
    pub id: String,
    pub title: String,
    pub status: String,
    pub reason: Option<String>,
    #[serde(default)]
    pub children: Vec<MergeTreeNode>,
}

/// tsk-59b: total node count across the whole tree, recursively — the MERGE
/// LIST box title's `(N)` count (was `ready.len() + waiting.len() +
/// blocked_on_sync.len()` before the tree existed; every id in those three
/// buckets is a node somewhere in `tree`, so this is the same count).
pub fn merge_tree_node_count(nodes: &[MergeTreeNode]) -> usize {
    nodes.iter().map(|n| 1 + merge_tree_node_count(&n.children)).sum()
}

/// tsk-59b: total RENDERED LINE count across the whole tree — one line per
/// node plus one extra line for each node that carries a `reason` (D7).
/// Distinct from `merge_tree_node_count` because `Paragraph::scroll`
/// scrolls by rendered line, not by node — the scroll bound must match
/// what is actually on screen.
pub fn merge_tree_line_count(nodes: &[MergeTreeNode]) -> usize {
    nodes
        .iter()
        .map(|n| 1 + usize::from(n.reason.is_some()) + merge_tree_line_count(&n.children))
        .sum()
}

/// tsk-417 D3: MERGE LIST box source — mirrors `fgos merge list --json`'s
/// own `ready`/`waiting`/`blockedOnSync` id lists directly (D3: "map
/// thẳng fgos merge list --json, không filter tự chế"). `conflicts`/
/// `mergeSets`/`mergeTier`/`supersededOut` are real fields on that same
/// response this box doesn't need — `serde` silently ignores them (no
/// `deny_unknown_fields`), so this struct only names what it uses.
/// `tree` (tsk-59b) is the one exception to "flat id lists only": it is
/// the nested view of the SAME data the flat lists already carry, meant to
/// replace them in rendering (never re-derived here — see `MergeTreeNode`
/// above).
#[derive(Debug, Clone, Default, PartialEq)]
pub struct MergeListSummary {
    pub ready: Vec<String>,
    pub waiting: Vec<String>,
    pub blocked_on_sync: Vec<String>,
    pub tree: Vec<MergeTreeNode>,
}

#[derive(Debug, Deserialize)]
struct MergeListEnvelope {
    data: MergeListData,
}

#[derive(Debug, Deserialize)]
struct MergeListData {
    ready: Vec<String>,
    waiting: Vec<String>,
    #[serde(rename = "blockedOnSync")]
    blocked_on_sync: Vec<String>,
    /// `#[serde(default)]`: defensive against a version-skewed fgOS CLI
    /// that predates tsk-2x9k's `tree` field — an empty tree parses
    /// cleanly instead of failing the whole envelope.
    #[serde(default)]
    tree: Vec<MergeTreeNode>,
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

/// Parse `fgos triage --json`'s stdout. tsk-64z D2: re-sorts by `priority`
/// ASCENDING (`priority-formula.mjs`'s inverted scale — smaller number =
/// higher priority), overriding `rankImpact`'s own default tier/blocks/
/// component order (the order tsk-4vo originally asked to preserve
/// byte-for-byte — see `parse_triage_preserves_rank_impact_order`, still
/// pinned for the CLI's own `--all`-less order, just no longer what this
/// function returns). An absent `priority` (`None` — an item that never
/// had `computePriority` run, e.g. still at `todo`) sorts LAST, same
/// absent-sorts-last convention `docs/reference/triage-table-columns.md`
/// already documents for `goalTier`.
pub fn parse_triage(json: &str) -> Result<Vec<TriageRow>, serde_json::Error> {
    let envelope: TriageEnvelope = serde_json::from_str(json)?;
    let mut rows = envelope.data;
    rows.sort_by_key(|row| row.priority.unwrap_or(i64::MAX));
    Ok(rows)
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
            stage: item.stage.unwrap_or_else(|| "executing".to_string()),
        })
        .collect();
    rows.sort_by(|a, b| {
        doing_tier(&a.status, &a.stage)
            .cmp(&doing_tier(&b.status, &b.stage))
            .then_with(|| a.id.cmp(&b.id))
    });
    Ok(rows)
}

/// tsk-417 D3: parse `fgos list --all --json`'s stdout, keeping items
/// whose `status` is `"blocked"` or `"awaiting-human"` — the NEED ANSWER
/// box's own bucket, real `status`/`parkReason` literals (`workflow-
/// stage-graphs.mjs`), never a second copy of `parse_doing`'s exclusion
/// logic.
pub fn parse_need_answer(json: &str) -> Result<Vec<NeedAnswerRow>, serde_json::Error> {
    let envelope: ListEnvelope = serde_json::from_str(json)?;
    let mut rows: Vec<NeedAnswerRow> = envelope
        .data
        .work
        .into_iter()
        .filter(|(_, item)| matches!(item.status.as_str(), "blocked" | "awaiting-human"))
        .map(|(id, item)| NeedAnswerRow {
            id,
            title: item.title,
            status: item.status,
        })
        .collect();
    rows.sort_by(|a, b| a.id.cmp(&b.id));
    Ok(rows)
}

/// tsk-417 D3: same shape as `parse_need_answer`, filtered to AFTER
/// DELIVER's own bucket — `"retrospective"` or `"cleanup"`.
pub fn parse_after_deliver(json: &str) -> Result<Vec<AfterDeliverRow>, serde_json::Error> {
    let envelope: ListEnvelope = serde_json::from_str(json)?;
    let mut rows: Vec<AfterDeliverRow> = envelope
        .data
        .work
        .into_iter()
        .filter(|(_, item)| matches!(item.status.as_str(), "retrospective" | "cleanup"))
        .map(|(id, item)| AfterDeliverRow {
            id,
            title: item.title,
            status: item.status,
        })
        .collect();
    rows.sort_by(|a, b| a.id.cmp(&b.id));
    Ok(rows)
}

/// tsk-417 D3: parse `fgos merge list --json`'s stdout — a direct field
/// mapping, never a re-derived filter (D3's own "map thẳng" instruction).
pub fn parse_merge_list(json: &str) -> Result<MergeListSummary, serde_json::Error> {
    let envelope: MergeListEnvelope = serde_json::from_str(json)?;
    Ok(MergeListSummary {
        ready: envelope.data.ready,
        waiting: envelope.data.waiting,
        blocked_on_sync: envelope.data.blocked_on_sync,
        tree: envelope.data.tree,
    })
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

/// tsk-417 D3: NEED ANSWER box's data source — `fgos list --all --json`,
/// same subprocess shape as `fetch_doing`, filtered by `parse_need_answer`.
pub fn fetch_need_answer(root: &Path) -> Result<Vec<NeedAnswerRow>, FgosError> {
    let stdout = run_fgos(root, &["list", "--all", "--json"])?;
    parse_need_answer(&stdout).map_err(FgosError::Parse)
}

/// tsk-417 D3: AFTER DELIVER box's data source.
pub fn fetch_after_deliver(root: &Path) -> Result<Vec<AfterDeliverRow>, FgosError> {
    let stdout = run_fgos(root, &["list", "--all", "--json"])?;
    parse_after_deliver(&stdout).map_err(FgosError::Parse)
}

/// tsk-417 D3: MERGE LIST box's data source — `fgos merge list --json`,
/// a distinct CLI verb from every other fetch function here.
pub fn fetch_merge_list(root: &Path) -> Result<MergeListSummary, FgosError> {
    let stdout = run_fgos(root, &["merge", "list", "--json"])?;
    parse_merge_list(&stdout).map_err(FgosError::Parse)
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

    fn fetch_need_answer(&self) -> Result<Vec<NeedAnswerRow>, FgosError> {
        fetch_need_answer(&self.root)
    }

    fn fetch_after_deliver(&self) -> Result<Vec<AfterDeliverRow>, FgosError> {
        fetch_after_deliver(&self.root)
    }

    fn fetch_merge_list(&self) -> Result<MergeListSummary, FgosError> {
        fetch_merge_list(&self.root)
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
                "blockedBy": [],
                "stage": "executing",
                "goalTier": "mvp",
                "priority": 300,
                "componentId": 4,
                "componentSize": 1,
                "isIsolated": true
            },
            {
                "id": "tsk-19y-2",
                "title": "Wire real fgOS data into the dashboard",
                "status": "doing",
                "blocks": 2,
                "blockedBy": ["tsk-mvp-test-1"],
                "stage": "executing",
                "goalTier": null,
                "priority": 100,
                "componentId": 27,
                "componentSize": 3,
                "isIsolated": false
            },
            {
                "id": "choke-point-createworktree-callsite-wrapper",
                "title": "Choke-point: createWorktree's 6 call sites",
                "status": "doing",
                "blocks": 1,
                "blockedBy": [],
                "stage": "executing",
                "goalTier": null,
                "priority": 200,
                "componentId": 31,
                "componentSize": 4,
                "isIsolated": false
            },
            {
                "id": "tsk-no-priority-yet",
                "title": "Never discovered, no priority computed yet",
                "status": "todo",
                "blocks": 0,
                "blockedBy": [],
                "stage": "clarify",
                "goalTier": null,
                "priority": null,
                "componentId": 5,
                "componentSize": 1,
                "isIsolated": true
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
    /// raw JSON to prove `parse_doing` does the sorting itself. The stages
    /// here are the ones the coding domain actually declares today
    /// (`DOMAINS.coding.stages`, `src/state/workflow-stage-graphs.mjs`) —
    /// `discovery`/`exploring`/`planning`/`executing` — plus the drain-only
    /// legacy alias `decompose` that a few pre-rename items still hold.
    const TIER_SORT_FIXTURE: &str = r#"{
        "contract": "fgos.v1",
        "generated_at": "2026-07-29T15:41:13.319Z",
        "data_hash": "abc",
        "data": {
            "work": {
                "tsk-exploring": {
                    "title": "Still fuzzy",
                    "status": "doing",
                    "stage": "exploring",
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
                "tsk-discovery": {
                    "title": "Machine-alone research",
                    "status": "doing",
                    "stage": "discovery",
                    "statusCategory": "in-progress"
                },
                "tsk-planning": {
                    "title": "Shaping",
                    "status": "doing",
                    "stage": "planning",
                    "statusCategory": "in-progress"
                },
                "tsk-decompose": {
                    "title": "Shaping, still on the legacy stage name",
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

    /// tsk-64z D2: priority ASCENDING drives the order, overriding
    /// `rankImpact`'s own given order — the fixture's raw array order is
    /// deliberately `[mvp-test-1 (300), 19y-2 (100), choke-point (200),
    /// no-priority (null)]`, none of which is priority-ascending, so a
    /// passing assertion here proves a real re-sort happened, not a
    /// coincidental preserve. `None` priority (never `computePriority`'d)
    /// sorts last.
    #[test]
    fn parse_triage_sorts_by_priority_ascending_overriding_rank_impact_order() {
        let rows = parse_triage(TRIAGE_FIXTURE).expect("fixture should parse");
        let ids: Vec<&str> = rows.iter().map(|r| r.id.as_str()).collect();
        assert_eq!(
            ids,
            vec![
                "tsk-19y-2",
                "choke-point-createworktree-callsite-wrapper",
                "tsk-mvp-test-1",
                "tsk-no-priority-yet",
            ]
        );
        assert_eq!(rows[0].priority, Some(100));
        assert_eq!(rows.last().unwrap().priority, None);
    }

    /// tsk-64z D1: `status`/`blockedBy`/`blocks`/`stage` all parse through
    /// unchanged from `rankImpact`'s own field names — grounds the Work
    /// Items panel's Status/BlockedBy/Blocks columns in real parsed data.
    #[test]
    fn triage_row_carries_status_stage_blocked_by_blocks_priority() {
        let rows = parse_triage(TRIAGE_FIXTURE).expect("fixture should parse");
        let by_id = |id: &str| rows.iter().find(|r| r.id == id).expect("row present");
        let wired = by_id("tsk-19y-2");
        assert_eq!(wired.status, "doing");
        assert_eq!(wired.stage, "executing");
        assert_eq!(wired.blocked_by, vec!["tsk-mvp-test-1".to_string()]);
        assert_eq!(wired.blocks, 2);
        assert_eq!(wired.priority, Some(100));
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
        // D2: awaiting-approval first, then doing sub-sorted in reverse
        // pipeline order — executing -> planning -> exploring -> discovery,
        // with the legacy `decompose` alias sharing planning's rank (it is
        // the same stage under its pre-rename name, so `tsk-decompose` and
        // `tsk-planning` tie and fall back to id ascending). A row at a
        // stage this dashboard doesn't know sorts after all of them.
        // "blocked" status never appears (D4's combined
        // parkReason+statusCategory predicate excludes it via
        // parkReason == "system-error").
        assert_eq!(
            ids,
            vec![
                "tsk-approval",
                "tsk-executing",
                "tsk-decompose",
                "tsk-planning",
                "tsk-exploring",
                "tsk-discovery",
            ]
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

    /// tsk-417 D3: NEED ANSWER = `blocked` + `awaiting-human`, nothing
    /// else — reuses `STATUS_MEMBERSHIP_FIXTURE` (already has both, plus
    /// `doing`/`awaiting-approval`/`todo` as real negative cases).
    #[test]
    fn fetch_need_answer_includes_blocked_and_awaiting_human() {
        let rows = parse_need_answer(STATUS_MEMBERSHIP_FIXTURE).expect("fixture should parse");
        let ids: Vec<&str> = rows.iter().map(|r| r.id.as_str()).collect();
        assert_eq!(ids, vec!["tsk-awaiting-human", "tsk-blocked"]);
        assert!(rows.iter().all(|r| r.status == "blocked" || r.status == "awaiting-human"));
    }

    /// tsk-1pg D1: real shape from `.fgos/` — `tsk-mvp-test-1` (`status:
    /// wontfix`) carries no `stage` field at all. Mixed alongside a real
    /// NEED ANSWER row (`tsk-awaiting-human`) and a real AFTER DELIVER row
    /// (`tsk-cleanup`) so a passing parse proves the stage-less item no
    /// longer fails `serde_json::from_str::<ListEnvelope>` for the whole
    /// map, not just that an empty map happens to parse.
    const MISSING_STAGE_FIXTURE: &str = r#"{
        "contract": "fgos.v1",
        "generated_at": "2026-08-06T05:28:45.827Z",
        "data_hash": "abc",
        "data": {
            "work": {
                "tsk-mvp-test-1": {
                    "title": "MVP goalTier test item",
                    "status": "wontfix"
                },
                "tsk-awaiting-human": {
                    "title": "Parked on a question",
                    "status": "awaiting-human",
                    "stage": "clarify",
                    "statusCategory": "in-progress",
                    "parkReason": "human-question"
                },
                "tsk-cleanup": {
                    "title": "TTL-bounded worktree park",
                    "status": "cleanup",
                    "stage": "executing"
                },
                "tsk-no-stage-doing": {
                    "title": "Actively worked, no stage field either",
                    "status": "doing",
                    "statusCategory": "in-progress"
                }
            }
        }
    }"#;

    #[test]
    fn need_answer_survives_missing_stage() {
        let need_answer =
            parse_need_answer(MISSING_STAGE_FIXTURE).expect("stage-less item must not fail the whole map's parse");
        let ids: Vec<&str> = need_answer.iter().map(|r| r.id.as_str()).collect();
        assert_eq!(ids, vec!["tsk-awaiting-human"]);

        let after_deliver = parse_after_deliver(MISSING_STAGE_FIXTURE)
            .expect("stage-less item must not fail the whole map's parse");
        let ids: Vec<&str> = after_deliver.iter().map(|r| r.id.as_str()).collect();
        assert_eq!(ids, vec!["tsk-cleanup"]);

        // D1: a stage-less `doing` row defaults to "executing", matching
        // the JS engine's own `item.stage ?? 'executing'` convention.
        let doing =
            parse_doing(MISSING_STAGE_FIXTURE).expect("stage-less item must not fail the whole map's parse");
        let row = doing.iter().find(|r| r.id == "tsk-no-stage-doing").expect("row present");
        assert_eq!(row.stage, "executing");
    }

    const AFTER_DELIVER_FIXTURE: &str = r#"{
        "contract": "fgos.v1",
        "generated_at": "2026-07-29T15:41:13.319Z",
        "data_hash": "abc",
        "data": {
            "work": {
                "tsk-retro": {
                    "title": "Batched learning-synthesis",
                    "status": "retrospective",
                    "stage": "executing"
                },
                "tsk-cleanup": {
                    "title": "TTL-bounded worktree park",
                    "status": "cleanup",
                    "stage": "executing"
                },
                "tsk-delivered": {
                    "title": "Merged, not yet retrospective",
                    "status": "delivered",
                    "stage": "executing"
                },
                "tsk-done": {
                    "title": "Fully closed out",
                    "status": "done",
                    "stage": "executing"
                }
            }
        }
    }"#;

    /// tsk-417 D3: AFTER DELIVER = `retrospective` + `cleanup` only —
    /// `delivered` (not yet retrospective) and `done` (already fully
    /// closed) are real negative cases, not this box's job.
    #[test]
    fn fetch_after_deliver_includes_retrospective_and_cleanup() {
        let rows = parse_after_deliver(AFTER_DELIVER_FIXTURE).expect("fixture should parse");
        let ids: Vec<&str> = rows.iter().map(|r| r.id.as_str()).collect();
        assert_eq!(ids, vec!["tsk-cleanup", "tsk-retro"]);
        assert!(rows.iter().all(|r| r.status == "retrospective" || r.status == "cleanup"));
    }

    /// tsk-417 D3: real `fgos merge list --json` response shape, captured
    /// live this session (the same call used to check tsk-48i/tsk-1hb
    /// mergeability) — `conflicts`/`mergeSets`/`mergeTier`/`supersededOut`
    /// are real fields on the response this fixture includes but
    /// `MergeListSummary` doesn't parse, proving the "map thẳng, không
    /// filter tự chế" field selection is deliberate, not an oversight.
    const MERGE_LIST_FIXTURE: &str = r#"{
        "contract": "fgos.v1",
        "generated_at": "2026-08-06T01:38:50.426Z",
        "data_hash": "fe7572c554271846ce3926e9358e91ef0370431fc1ac1c14ff256911a8345828",
        "data": {
            "ready": ["tsk-2ig", "tsk-3c7"],
            "waiting": ["tsk-blocked-dep"],
            "conflicts": [],
            "mergeSets": [
                {
                    "items": ["tsk-2ig", "tsk-3c7"],
                    "order": ["tsk-2ig", "tsk-3c7"],
                    "reason": "shared-root"
                }
            ],
            "blockedOnSync": ["tsk-stale-root"],
            "mergeTier": {"tsk-3c7": "leaf-to-root", "tsk-2ig": "leaf-to-root"},
            "supersededOut": [],
            "tree": [
                {
                    "id": "tsk-root",
                    "title": "Root item",
                    "status": "container",
                    "children": [
                        {"id": "tsk-2ig", "title": "Leaf 2ig", "status": "ready", "children": []},
                        {"id": "tsk-3c7", "title": "Leaf 3c7", "status": "ready", "children": []}
                    ]
                },
                {
                    "id": "tsk-stale-root",
                    "title": "Stale root",
                    "status": "blocked-sync",
                    "reason": "root cần sync: fgw/tsk-stale-root lệch 3 ahead / 2 behind main",
                    "children": []
                }
            ]
        }
    }"#;

    #[test]
    fn fetch_merge_list_mirrors_fgos_merge_list_json() {
        let summary = parse_merge_list(MERGE_LIST_FIXTURE).expect("fixture should parse");
        assert_eq!(summary.ready, vec!["tsk-2ig".to_string(), "tsk-3c7".to_string()]);
        assert_eq!(summary.waiting, vec!["tsk-blocked-dep".to_string()]);
        assert_eq!(summary.blocked_on_sync, vec!["tsk-stale-root".to_string()]);
    }

    /// tsk-59b: the tree parses as a real nested structure, not flattened —
    /// a container node (not itself a merge candidate, D2/D3) holding two
    /// ready leaves, sibling to a blocked-sync node carrying a real reason
    /// string (D7).
    #[test]
    fn fetch_merge_list_parses_the_nested_tree_field() {
        let summary = parse_merge_list(MERGE_LIST_FIXTURE).expect("fixture should parse");
        assert_eq!(summary.tree.len(), 2);

        let root = &summary.tree[0];
        assert_eq!(root.id, "tsk-root");
        assert_eq!(root.status, "container");
        assert_eq!(root.reason, None);
        assert_eq!(root.children.len(), 2);
        assert_eq!(root.children[0].id, "tsk-2ig");
        assert_eq!(root.children[0].status, "ready");
        assert!(root.children[0].children.is_empty());

        let stale_root = &summary.tree[1];
        assert_eq!(stale_root.id, "tsk-stale-root");
        assert_eq!(stale_root.status, "blocked-sync");
        assert_eq!(
            stale_root.reason.as_deref(),
            Some("root cần sync: fgw/tsk-stale-root lệch 3 ahead / 2 behind main")
        );
    }

    /// tsk-59b: a response with no `tree` field at all (a version-skewed
    /// fgOS CLI predating tsk-2x9k) still parses cleanly via
    /// `#[serde(default)]` — an empty tree, not a parse failure.
    #[test]
    fn fetch_merge_list_tolerates_a_missing_tree_field() {
        let json = r#"{
            "data": {
                "ready": [],
                "waiting": [],
                "conflicts": [],
                "mergeSets": [],
                "blockedOnSync": [],
                "mergeTier": {},
                "supersededOut": []
            }
        }"#;
        let summary = parse_merge_list(json).expect("missing tree field should still parse");
        assert!(summary.tree.is_empty());
    }
}
