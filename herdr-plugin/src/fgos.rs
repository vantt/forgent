use std::io;
use std::path::{Path, PathBuf};
use std::process::Command;

use serde::Deserialize;

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
/// `status == "doing"` (D4 — never herdr's own `agent_status`).
#[derive(Debug, Clone, Deserialize, PartialEq)]
pub struct DoingRow {
    pub id: String,
    pub title: String,
}

#[derive(Debug, Deserialize)]
struct WorkItemRaw {
    title: String,
    status: String,
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
/// (the D5 `rankImpact` order) without re-sorting it here.
pub fn parse_triage(json: &str) -> Result<Vec<TriageRow>, serde_json::Error> {
    let envelope: TriageEnvelope = serde_json::from_str(json)?;
    Ok(envelope.data)
}

/// Parse `fgos list --all --json`'s stdout, keeping only `status: "doing"`
/// items (D4's definition of "in-process task").
pub fn parse_doing(json: &str) -> Result<Vec<DoingRow>, serde_json::Error> {
    let envelope: ListEnvelope = serde_json::from_str(json)?;
    let mut rows: Vec<DoingRow> = envelope
        .data
        .work
        .into_iter()
        .filter(|(_, item)| item.status == "doing")
        .map(|(id, item)| DoingRow {
            id,
            title: item.title,
        })
        .collect();
    rows.sort_by(|a, b| a.id.cmp(&b.id));
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
                    "status": "doing"
                },
                "tsk-done-item": {
                    "title": "Already finished",
                    "status": "done"
                },
                "choke-point-createworktree-callsite-wrapper": {
                    "title": "Choke-point: createWorktree's 6 call sites",
                    "status": "doing"
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
    fn parse_doing_keeps_only_doing_status() {
        let rows = parse_doing(LIST_FIXTURE).expect("fixture should parse");
        let ids: Vec<&str> = rows.iter().map(|r| r.id.as_str()).collect();
        assert_eq!(
            ids,
            vec!["choke-point-createworktree-callsite-wrapper", "tsk-19y-2"]
        );
        assert!(rows.iter().all(|r| r.title != "Already finished"));
    }
}
