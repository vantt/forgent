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

/// Parse `fgos list --all --json`'s stdout, keeping `status: doing` and
/// `status: awaiting-approval` items (tsk-4vo D1's expanded "in-process"
/// definition), sorted by D2's tier (id ascending breaks ties within a
/// tier, for determinism).
pub fn parse_doing(json: &str) -> Result<Vec<DoingRow>, serde_json::Error> {
    let envelope: ListEnvelope = serde_json::from_str(json)?;
    let mut rows: Vec<DoingRow> = envelope
        .data
        .work
        .into_iter()
        .filter(|(_, item)| item.status == "doing" || item.status == "awaiting-approval")
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
                    "stage": "executing"
                },
                "tsk-done-item": {
                    "title": "Already finished",
                    "status": "done",
                    "stage": "compound-learn"
                },
                "choke-point-createworktree-callsite-wrapper": {
                    "title": "Choke-point: createWorktree's 6 call sites",
                    "status": "doing",
                    "stage": "executing"
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
                    "stage": "clarify"
                },
                "tsk-approval": {
                    "title": "Awaiting approval",
                    "status": "awaiting-approval",
                    "stage": "executing"
                },
                "tsk-executing": {
                    "title": "Building",
                    "status": "doing",
                    "stage": "executing"
                },
                "tsk-decompose": {
                    "title": "Shaping",
                    "status": "doing",
                    "stage": "decompose"
                },
                "tsk-blocked": {
                    "title": "Not in-process",
                    "status": "blocked",
                    "stage": "executing"
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
        // decompose -> clarify. "blocked" status never appears (D1's
        // expanded set is still only doing/awaiting-approval).
        assert_eq!(
            ids,
            vec!["tsk-approval", "tsk-executing", "tsk-decompose", "tsk-clarify"]
        );
        assert!(rows.iter().all(|r| r.id != "tsk-blocked"));
    }
}
