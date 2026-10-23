//! The launcher half of identity: what an agent process is allowed to see of
//! "who am I". The launcher (the gate, the step runner) applies this to the
//! env it hands the agent, so the agent's writer id is the attempt's minted
//! id and never a parent's id leaking through an inherited variable.

use std::collections::BTreeMap;

/// Variables the agent must not inherit: another session's id would outrank
/// or confuse the minted one (resolve order is `FGOS_SESSION_ID`, then
/// `CODEX_THREAD_ID`, then `PI_SESSION_ID`, then `CLAUDE_CODE_SESSION_ID`).
/// pi and omp also hand `PI_SESSION_FILE` to their children; it names the
/// parent's session file, so it goes too.
pub const SCRUBBED: [&str; 5] = [
    "CLAUDE_CODE_SESSION_ID",
    "CODEX_THREAD_ID",
    "PI_SESSION_ID",
    "PI_SESSION_FILE",
    "FGOS_PARENT_WRITER_ID",
];

/// The writer id to export is empty: an empty `FGOS_SESSION_ID` would be
/// ignored by the resolve rule and fall through to the process tree.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EmptyWriterId;

impl std::fmt::Display for EmptyWriterId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("the agent's writer id must not be empty")
    }
}

impl std::error::Error for EmptyWriterId {}

/// Drop the inherited session ids from `env`, then set `FGOS_SESSION_ID` to
/// `writer_id` and `FGOS_PARENT_WRITER_ID` to `parent` (left out when `None`
/// or empty). An empty `FGOS_SESSION_ID` already in `env` is overwritten, not
/// kept, so it can never reach the agent.
pub fn scrub_and_set(
    env: &mut BTreeMap<String, String>,
    writer_id: &str,
    parent: Option<&str>,
) -> Result<(), EmptyWriterId> {
    if writer_id.is_empty() {
        return Err(EmptyWriterId);
    }
    for name in SCRUBBED {
        env.remove(name);
    }
    env.insert("FGOS_SESSION_ID".into(), writer_id.into());
    if let Some(parent) = parent.filter(|p| !p.is_empty()) {
        env.insert("FGOS_PARENT_WRITER_ID".into(), parent.into());
    }
    Ok(())
}
