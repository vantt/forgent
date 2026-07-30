use std::io;
use std::process::Command;

use crate::layout;
use crate::ports::PaneOrchestrator;

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
/// containing a stray quote would break out of it. `pub(crate)` so
/// `pane_scan.rs` can validate a parsed pane label's leading segment
/// against the same grammar (tsk-4zo) instead of duplicating this check.
pub(crate) fn is_valid_id(id: &str) -> bool {
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

/// D1: `--dangerously-skip-permissions` is on by default for every agent
/// launched through this shared function (including a future unattended
/// auto-dispatcher, per the item's own description) — set
/// `FGOS_HERDR_SKIP_PERMISSIONS=0` (or `false`) to opt out for a more
/// cautious launch. Read once per launch, never cached, so a change takes
/// effect on the very next agent this function opens.
pub fn skip_permissions_enabled() -> bool {
    match std::env::var("FGOS_HERDR_SKIP_PERMISSIONS") {
        Ok(value) => value != "0" && value.to_lowercase() != "false",
        Err(_) => true,
    }
}

/// argv for launching `claude` in the newly opened pane with
/// `/fgOS:pick <id>` piped in as the initial prompt — the automated
/// equivalent of a person typing the slash command by hand.
/// `skip_permissions` is threaded in explicitly (never read from env
/// inside this pure function) so it stays deterministically testable —
/// D1's actual env resolution lives in `skip_permissions_enabled` above.
pub fn run_argv(pane_id: &str, id: &str, skip_permissions: bool) -> Result<Vec<String>, InvalidId> {
    if !is_valid_id(id) {
        return Err(InvalidId(id.to_string()));
    }
    let command = if skip_permissions {
        format!("claude --dangerously-skip-permissions '{PICK_SLASH_COMMAND} {id}'")
    } else {
        format!("claude '{PICK_SLASH_COMMAND} {id}'")
    };
    Ok(vec!["pane".into(), "run".into(), pane_id.into(), command])
}

/// Resolve the herdr binary the same way the plugin docs recommend:
/// `HERDR_BIN_PATH`, injected into every plugin runtime command, falling
/// back to a bare `herdr` (PATH lookup) outside a live herdr session.
pub fn herdr_bin() -> String {
    std::env::var("HERDR_BIN_PATH").unwrap_or_else(|_| "herdr".into())
}

/// Open a new agent pane for `id` and launch `claude` in it with
/// `/fgOS:pick <id>` as the initial prompt — the shared launch-agent
/// function (tsk-1q3), used identically by the manual dashboard action
/// and, later, an auto-dispatcher. Pane placement goes through the
/// layout manager (`layout::place_new_agent_pane`, tsk-1q3's `fg:agents-N`
/// tab/grid logic) instead of always splitting the caller's own pane —
/// superseding this function's old `pane split --current`-only shape.
pub fn open_pick_pane(herdr_bin: &str, workspace_id: &str, id: &str) -> io::Result<()> {
    let pane_id = layout::place_new_agent_pane(herdr_bin, workspace_id).map_err(io::Error::other)?;

    let run_args = run_argv(&pane_id, id, skip_permissions_enabled()).map_err(io::Error::other)?;
    // Fire-and-forget: the dashboard never waits on the launched claude
    // session's own lifetime, only on herdr accepting the typed command.
    Command::new(herdr_bin).args(run_args).spawn()?;
    Ok(())
}

/// argv for `focus_pane` below (tsk-1eu D2).
fn focus_pane_argv(pane_id: &str) -> Vec<String> {
    ["pane", "zoom", pane_id, "--on"]
        .into_iter()
        .map(String::from)
        .collect()
}

/// Switches herdr's focus directly to `pane_id` (tsk-1eu D2) via `pane
/// zoom <pane_id> --on` — the only herdr CLI command proven (live, that
/// item's own CONTEXT.md) to deterministically focus an arbitrary
/// existing pane id regardless of which tab it lives in. This zooms the
/// target pane full-screen within its tab as a real, accepted side
/// effect; this function never un-zooms anything.
pub fn focus_pane(herdr_bin: &str, pane_id: &str) -> io::Result<()> {
    let output = Command::new(herdr_bin).args(focus_pane_argv(pane_id)).output()?;
    if !output.status.success() {
        return Err(io::Error::other(format!(
            "herdr pane zoom failed: {}",
            String::from_utf8_lossy(&output.stderr)
        )));
    }
    Ok(())
}

/// The `PaneOrchestrator` adapter (tsk-3t9 D1): the concrete herdr-CLI
/// implementation of the pane-orchestration port. Holds the resolved
/// `herdr_bin`/`workspace_id` so the composition root (`main.rs`)
/// resolves them once.
pub struct HerdrPaneAdapter {
    pub herdr_bin: String,
    pub workspace_id: String,
}

impl PaneOrchestrator for HerdrPaneAdapter {
    fn open_pick_pane(&self, id: &str) -> io::Result<()> {
        open_pick_pane(&self.herdr_bin, &self.workspace_id, id)
    }

    fn focus_pane(&self, pane_id: &str) -> io::Result<()> {
        focus_pane(&self.herdr_bin, pane_id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pane_focus_argv_targets_the_given_pane_id() {
        assert_eq!(
            focus_pane_argv("wS:p1H"),
            vec!["pane", "zoom", "wS:p1H", "--on"]
        );
    }

    #[test]
    fn launch_agent_run_argv_includes_skip_permissions_by_default() {
        let argv = run_argv("wS:p16", "tsk-19y-3", true).expect("valid id");
        assert_eq!(
            argv,
            vec![
                "pane",
                "run",
                "wS:p16",
                "claude --dangerously-skip-permissions '/fgOS:pick tsk-19y-3'",
            ]
        );
    }

    #[test]
    fn launch_agent_run_argv_omits_skip_permissions_when_disabled() {
        let argv = run_argv("wS:p16", "tsk-19y-3", false).expect("valid id");
        assert_eq!(
            argv,
            vec!["pane", "run", "wS:p16", "claude '/fgOS:pick tsk-19y-3'",]
        );
    }

    #[test]
    fn launch_agent_skip_permissions_enabled_reads_env_with_safe_default() {
        // All assertions run sequentially inside one test (not split
        // across several) to avoid a real race: `cargo test` runs test
        // functions in parallel threads, and env vars are process-global
        // — two tests mutating the same var concurrently would flake.
        std::env::remove_var("FGOS_HERDR_SKIP_PERMISSIONS");
        assert!(skip_permissions_enabled(), "unset must default to on (D1)");

        std::env::set_var("FGOS_HERDR_SKIP_PERMISSIONS", "0");
        assert!(!skip_permissions_enabled(), "\"0\" must disable it");

        std::env::set_var("FGOS_HERDR_SKIP_PERMISSIONS", "false");
        assert!(!skip_permissions_enabled(), "\"false\" must disable it");

        std::env::set_var("FGOS_HERDR_SKIP_PERMISSIONS", "1");
        assert!(skip_permissions_enabled(), "any other value stays enabled");

        std::env::remove_var("FGOS_HERDR_SKIP_PERMISSIONS");
    }

    #[test]
    fn run_argv_rejects_an_id_that_could_break_out_of_the_typed_command() {
        let err = run_argv("wS:p16", "tsk'; rm -rf ~ #", true).unwrap_err();
        assert_eq!(err, InvalidId("tsk'; rm -rf ~ #".to_string()));
    }

    #[test]
    fn run_argv_rejects_ids_fgos_itself_would_reject() {
        // Mirrors src/state/work.mjs's ID_PATTERN test cases.
        assert!(run_argv("p", "", true).is_err());
        assert!(run_argv("p", "-leading-hyphen", true).is_err());
        assert!(run_argv("p", "trailing-hyphen-", true).is_err());
        assert!(run_argv("p", "double--hyphen", true).is_err());
        assert!(run_argv("p", "1starts-with-digit", true).is_err());
        assert!(run_argv("p", "Has-Upper-Case", true).is_err());
        assert!(run_argv("p", "tsk-19y-3", true).is_ok());
        assert!(run_argv("p", "choke-point-take-vs-pick-claim-eligibility", true).is_ok());
    }
}
