use std::io;
use std::process::Command;

use serde_json::Value;

/// The exact slash command a person would type by hand to claim and route
/// into an item — this action never calls `fgos pick` itself, only opens
/// the same door (D4/STR40: never make herdr, or a plugin, a second
/// decision-maker).
const PICK_SLASH_COMMAND: &str = "/fgOS:pick";

#[derive(Debug, PartialEq)]
pub struct InvalidId(pub String);

impl std::fmt::Display for InvalidId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "not a valid fgOS work-item id: {:?}", self.0)
    }
}

impl std::error::Error for InvalidId {}

/// Mirrors fgOS's own id grammar (`src/state/work.mjs` `ID_PATTERN`:
/// `/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/`), re-checked here defensively:
/// `herdr pane run` types its command text literally into whatever shell
/// is running in the target pane (no shell-safe argv boundary), so an id
/// containing a stray quote would break out of it.
fn is_valid_id(id: &str) -> bool {
    let mut segments = id.split('-');
    let Some(first) = segments.next() else {
        return false;
    };
    if first.is_empty() || !first.starts_with(|c: char| c.is_ascii_lowercase()) {
        return false;
    }
    if !first
        .chars()
        .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit())
    {
        return false;
    }
    segments.all(|seg| {
        !seg.is_empty()
            && seg
                .chars()
                .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit())
    })
}

/// argv (excluding the `herdr` binary itself) for opening a new pane
/// beside the dashboard's own — `--current` resolves to the calling
/// plugin process's own pane via herdr's own `HERDR_PANE_ID` injection.
pub fn split_argv() -> Vec<String> {
    ["pane", "split", "--current", "--direction", "right", "--focus"]
        .into_iter()
        .map(String::from)
        .collect()
}

/// argv for launching `claude` in the newly opened pane with
/// `/fgOS:pick <id>` piped in as the initial prompt — the automated
/// equivalent of a person typing the slash command by hand.
pub fn run_argv(pane_id: &str, id: &str) -> Result<Vec<String>, InvalidId> {
    if !is_valid_id(id) {
        return Err(InvalidId(id.to_string()));
    }
    let command = format!("claude '{PICK_SLASH_COMMAND} {id}'");
    Ok(vec!["pane".into(), "run".into(), pane_id.into(), command])
}

fn parse_split_pane_id(json: &str) -> Option<String> {
    let value: Value = serde_json::from_str(json).ok()?;
    value["result"]["pane"]["pane_id"]
        .as_str()
        .map(String::from)
}

/// Resolve the herdr binary the same way the plugin docs recommend:
/// `HERDR_BIN_PATH`, injected into every plugin runtime command, falling
/// back to a bare `herdr` (PATH lookup) outside a live herdr session.
pub fn herdr_bin() -> String {
    std::env::var("HERDR_BIN_PATH").unwrap_or_else(|_| "herdr".into())
}

/// Open a new pane beside the dashboard and launch `claude` in it with
/// `/fgOS:pick <id>` as the initial prompt (D1's "Pick action").
pub fn open_pick_pane(herdr_bin: &str, id: &str) -> io::Result<()> {
    let split_output = Command::new(herdr_bin).args(split_argv()).output()?;
    if !split_output.status.success() {
        return Err(io::Error::other(format!(
            "herdr pane split failed: {}",
            String::from_utf8_lossy(&split_output.stderr)
        )));
    }
    let stdout = String::from_utf8_lossy(&split_output.stdout);
    let pane_id = parse_split_pane_id(&stdout).ok_or_else(|| {
        io::Error::other(format!(
            "herdr pane split: could not read pane_id from response: {stdout}"
        ))
    })?;

    let run_args = run_argv(&pane_id, id).map_err(io::Error::other)?;
    // Fire-and-forget: the dashboard never waits on the launched claude
    // session's own lifetime, only on herdr accepting the typed command.
    Command::new(herdr_bin).args(run_args).spawn()?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn split_argv_targets_the_calling_pane() {
        assert_eq!(
            split_argv(),
            vec!["pane", "split", "--current", "--direction", "right", "--focus"]
        );
    }

    #[test]
    fn run_argv_matches_exact_pane_run_shape() {
        let argv = run_argv("wS:p16", "tsk-19y-3").expect("valid id");
        assert_eq!(
            argv,
            vec![
                "pane",
                "run",
                "wS:p16",
                "claude '/fgOS:pick tsk-19y-3'",
            ]
        );
    }

    #[test]
    fn run_argv_rejects_an_id_that_could_break_out_of_the_typed_command() {
        let err = run_argv("wS:p16", "tsk'; rm -rf ~ #").unwrap_err();
        assert_eq!(err, InvalidId("tsk'; rm -rf ~ #".to_string()));
    }

    #[test]
    fn run_argv_rejects_ids_fgos_itself_would_reject() {
        // Mirrors src/state/work.mjs's ID_PATTERN test cases.
        assert!(run_argv("p", "").is_err());
        assert!(run_argv("p", "-leading-hyphen").is_err());
        assert!(run_argv("p", "trailing-hyphen-").is_err());
        assert!(run_argv("p", "double--hyphen").is_err());
        assert!(run_argv("p", "1starts-with-digit").is_err());
        assert!(run_argv("p", "Has-Upper-Case").is_err());
        assert!(run_argv("p", "tsk-19y-3").is_ok());
        assert!(run_argv("p", "choke-point-take-vs-pick-claim-eligibility").is_ok());
    }

    #[test]
    fn parse_split_pane_id_reads_the_real_herdr_response_shape() {
        // Captured live from `herdr pane split --current --direction right`.
        let response = r#"{"id":"cli:pane:split","result":{"pane":{"agent_status":"unknown","cwd":"/x","focused":false,"pane_id":"wS:p16","tab_id":"wS:t9","workspace_id":"wS"},"type":"pane_info"}}"#;
        assert_eq!(parse_split_pane_id(response).as_deref(), Some("wS:p16"));
    }

    #[test]
    fn parse_split_pane_id_returns_none_on_unexpected_shape() {
        assert_eq!(parse_split_pane_id(r#"{"error":{"message":"boom"}}"#), None);
    }
}
