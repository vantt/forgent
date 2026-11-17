//! Which tool executors serve a capability, and whether each is there now.
//!
//! A tool executor (`kind: "tool"`) declares the capabilities it serves in `for`; what an entry says of them is
//! [`crate::executor_model::tool_for_entries`]. This module adds the live probe: whether each tool is present,
//! stale, missing or cannot be probed, asked of the machine on every call through [`ToolProbe`], so an answer is
//! as fresh as the machine. `decide --for` answers from it and the doctor judges the tool posture from it.

use crate::executor_model::tool_for_entries;
use serde_json::{json, Map, Value};

/// What the repository's `HEAD` reads as, for the staleness of a tool's index.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Head {
    /// `HEAD` names this commit.
    Commit(String),
    /// A repository whose `HEAD` does not resolve (no commit yet).
    Unresolved,
    /// The directory is not inside a repository.
    NotARepository,
}

/// The machine facts the probe reads. The host implements it over the real machine and the repository root
/// the dispatch reads its config from; a test implements it over a described machine.
pub trait ToolProbe {
    /// Whether a `cli`/`binary` command can be started (found on PATH, or a path to an executable file).
    fn present(&self, command: &str) -> bool;
    /// Whether the tool's `scanTarget`, resolved against the repository root, exists.
    fn scan_target_exists(&self, scan_target: &str) -> bool;
    /// The `lastCommit` the tool's own index records in `<scanTarget>/meta.json`; `None` when the file is
    /// missing, unreadable or not JSON, or records no `lastCommit` string.
    fn index_commit(&self, scan_target: &str) -> Option<String>;
    /// The repository's `HEAD`.
    fn head(&self) -> Head;
}

/// The live status of one tool.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ToolStatus {
    Present,
    Stale,
    Missing,
    /// No invocation to probe, or an `mcp`/`skill` one without a `scanTarget`.
    Unknown,
}

impl ToolStatus {
    pub fn as_str(self) -> &'static str {
        match self {
            ToolStatus::Present => "present",
            ToolStatus::Stale => "stale",
            ToolStatus::Missing => "missing",
            ToolStatus::Unknown => "unknown",
        }
    }
}

/// A tool executor serving a capability, with how to reach it and whether it is there now.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ToolProvider {
    pub executor_id: String,
    pub capability: String,
    pub status: ToolStatus,
    pub mcp_tool: Option<String>,
    pub command: Option<String>,
}

impl ToolProvider {
    /// The provider as `decide` and the vectors state it: `{ executorId, capability, status, mcpTool?, command? }`.
    pub fn to_json(&self) -> Value {
        let mut out = Map::new();
        out.insert("executorId".into(), json!(self.executor_id));
        out.insert("capability".into(), json!(self.capability));
        out.insert("status".into(), json!(self.status.as_str()));
        if let Some(tool) = &self.mcp_tool {
            out.insert("mcpTool".into(), json!(tool));
        }
        if let Some(command) = &self.command {
            out.insert("command".into(), json!(command));
        }
        Value::Object(out)
    }
}

/// Whether the tool's own index records a commit behind `HEAD`. No record (or no `lastCommit`) and a `HEAD`
/// that does not resolve read as not stale: a probe never reports a staleness it did not see. A directory that
/// is not a repository reads as stale whenever a commit is recorded, as the Node probe answers today (it
/// compares the recorded commit with the Git port's not-a-repository answer, which never equals it).
fn index_is_stale(probe: &dyn ToolProbe, scan_target: &str) -> bool {
    let Some(last_commit) = probe.index_commit(scan_target).filter(|c| !c.is_empty()) else {
        return false;
    };
    match probe.head() {
        Head::Commit(head) => head != last_commit,
        Head::Unresolved => false,
        Head::NotARepository => true,
    }
}

/// The presence of one tool, per its first invocation: a `cli`/`binary` command is found on PATH; an
/// `mcp`/`skill` tool is found by its `scanTarget` on disk, and is stale when its own index is behind `HEAD`.
fn probe_status(executor: &Value, probe: &dyn ToolProbe) -> ToolStatus {
    let first = executor
        .get("invocations")
        .and_then(Value::as_array)
        .and_then(|list| list.first());
    let via = first.and_then(|inv| inv.get("via")).and_then(Value::as_str);
    match via {
        Some("cli") | Some("binary") => {
            let command = first
                .and_then(|inv| inv.get("command"))
                .and_then(Value::as_str);
            match command {
                Some(command) if !command.is_empty() && probe.present(command) => {
                    ToolStatus::Present
                }
                _ => ToolStatus::Missing,
            }
        }
        Some("mcp") | Some("skill") => {
            let Some(scan_target) = executor
                .get("scanTarget")
                .and_then(Value::as_str)
                .filter(|t| !t.is_empty())
            else {
                return ToolStatus::Unknown;
            };
            if !probe.scan_target_exists(scan_target) {
                ToolStatus::Missing
            } else if index_is_stale(probe, scan_target) {
                ToolStatus::Stale
            } else {
                ToolStatus::Present
            }
        }
        _ => ToolStatus::Unknown,
    }
}

/// Every tool executor that serves `capability` (compared folded), in the registry's order, each with its live
/// status; without a capability, every tool once per capability it serves.
pub fn tool_providers(
    runner: &Value,
    capability: Option<&str>,
    probe: &dyn ToolProbe,
) -> Vec<ToolProvider> {
    let entries = tool_for_entries(runner, capability);
    let mut statuses: Vec<(String, ToolStatus)> = Vec::new();
    entries
        .into_iter()
        .map(|entry| {
            let status = match statuses.iter().find(|(id, _)| *id == entry.executor_id) {
                Some((_, status)) => *status,
                None => {
                    let status = probe_status(&runner["executors"][&entry.executor_id], probe);
                    statuses.push((entry.executor_id.clone(), status));
                    status
                }
            };
            ToolProvider {
                executor_id: entry.executor_id,
                capability: entry.capability,
                status,
                mcp_tool: entry.mcp_tool,
                command: entry.command,
            }
        })
        .collect()
}

/// The posture of the tools a config declares, counted once per tool executor.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ToolPosture {
    /// No tool executor is declared.
    Inactive,
    /// Every declared tool is present.
    Full { present: usize },
    /// Some declared tool is stale, missing or cannot be probed.
    Degraded {
        present: usize,
        total: usize,
        stale: usize,
        missing: usize,
        unknown: usize,
    },
}

/// The posture of every declared tool: one tool executor serving several capabilities is one tool.
pub fn tool_posture(runner: &Value, probe: &dyn ToolProbe) -> ToolPosture {
    let mut tools: Vec<(String, ToolStatus)> = Vec::new();
    for provider in tool_providers(runner, None, probe) {
        if !tools.iter().any(|(id, _)| *id == provider.executor_id) {
            tools.push((provider.executor_id, provider.status));
        }
    }
    let count = |wanted: ToolStatus| tools.iter().filter(|(_, s)| *s == wanted).count();
    let present = count(ToolStatus::Present);
    match tools.len() {
        0 => ToolPosture::Inactive,
        total if present == total => ToolPosture::Full { present },
        total => ToolPosture::Degraded {
            present,
            total,
            stale: count(ToolStatus::Stale),
            missing: count(ToolStatus::Missing),
            unknown: count(ToolStatus::Unknown),
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    struct Machine {
        on_path: &'static [&'static str],
    }

    impl ToolProbe for Machine {
        fn present(&self, command: &str) -> bool {
            self.on_path.contains(&command)
        }
        fn scan_target_exists(&self, _: &str) -> bool {
            false
        }
        fn index_commit(&self, _: &str) -> Option<String> {
            None
        }
        fn head(&self) -> Head {
            Head::Unresolved
        }
    }

    fn tool(command: &str, serves: &[&str]) -> Value {
        json!({ "kind": "tool", "for": serves, "invocations": [{ "via": "cli", "command": command }] })
    }

    #[test]
    fn the_posture_counts_each_tool_once_inactive_full_or_degraded() {
        let machine = Machine { on_path: &["a"] };
        assert_eq!(
            tool_posture(
                &json!({ "executors": { "x": { "kind": "agent" } } }),
                &machine
            ),
            ToolPosture::Inactive
        );
        let one = json!({ "executors": { "a": tool("a", &["p", "q"]) } });
        assert_eq!(
            tool_posture(&one, &machine),
            ToolPosture::Full { present: 1 }
        );
        let two = json!({ "executors": { "a": tool("a", &["p", "q"]), "b": tool("b", &["p"]) } });
        assert_eq!(
            tool_posture(&two, &machine),
            ToolPosture::Degraded {
                present: 1,
                total: 2,
                stale: 0,
                missing: 1,
                unknown: 0
            }
        );
    }
}
