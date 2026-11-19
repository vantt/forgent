//! The shape rule of a workspace-paths grant and the names of the grants a head session adds.

use serde_json::Value;

use super::error::{refuse, ConfinementPolicyError};
use super::js::show;

/// The grant that binds named paths of the project root writable: one entry of `paths`, relative to the root.
pub const WORKSPACE_PATHS_RESOURCE: &str = "workspace-paths";

/// The grant that binds the project's mailbox record writable: its lock file and its runtime directory, nothing
/// else of `.fgos`.
pub const MAILBOX_RECORD_RESOURCE: &str = "mailbox-record";

/// The grant that lets a head reach the agent sessions of its own machine: the launch keeps the host pid space,
/// and Claude Code's session socket directory and session registry are bound back read-write.
pub const PEER_SESSIONS_RESOURCE: &str = "peer-sessions";

fn is_separator(c: char) -> bool {
    c == '/' || c == '\\'
}

/// `paths` of a workspace-paths grant: relative, inside the root, no glob; refused by name, never normalized into
/// range.
pub fn validate_workspace_paths(
    paths: Option<&Value>,
    label: &str,
) -> Result<(), ConfinementPolicyError> {
    let entries = match paths {
        Some(Value::Array(list)) if !list.is_empty() => list,
        _ => {
            return refuse(format!(
                "runner config ({label}) \"paths\" must be a non-empty array of project-relative paths."
            ));
        }
    };
    for entry in entries {
        let text = match entry {
            Value::String(s) if !s.trim().is_empty() => s.as_str(),
            _ => {
                return refuse(format!(
                    "runner config ({label}) \"paths\" entries must be non-empty strings, got: {}.",
                    show(Some(entry))
                ));
            }
        };
        let shown = show(Some(entry));
        let mut chars = text.chars();
        let windows_drive =
            matches!((chars.next(), chars.next()), (Some(a), Some(':')) if a.is_ascii_alphabetic());
        if text.starts_with('/') || windows_drive {
            return refuse(format!(
                "runner config ({label}) path {shown} is absolute; a workspace path is relative to the project root."
            ));
        }
        if text.split(is_separator).any(|part| part == "..") {
            return refuse(format!(
                "runner config ({label}) path {shown} climbs out of the project root with \"..\"."
            ));
        }
        // The attempt's own run directory, its envelope and the request route's trust all live under .fgos; a grant
        // over any of it would let the sandbox rewrite what the supervisor trusts.
        let first = text
            .split(is_separator)
            .find(|part| !part.is_empty() && *part != ".");
        if first.is_some_and(|part| part.to_lowercase() == ".fgos") {
            return refuse(format!(
                "runner config ({label}) path {shown} lies under \".fgos\", which holds the attempt's own run directory; a grant never binds it writable."
            ));
        }
        if text.chars().any(|c| "*?[]{}".contains(c)) {
            return refuse(format!(
                "runner config ({label}) path {shown} contains a glob character; name the exact path."
            ));
        }
    }
    Ok(())
}
