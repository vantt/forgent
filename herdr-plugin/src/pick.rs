use std::io;
use std::path::{Path, PathBuf};
use std::process::Command;

use crate::layout;
use crate::pane_scan::{HerdrPaneScanner, PaneSnapshot};
use crate::ports::{PaneOrchestrator, PaneRegistry, WorkerLaneView};

/// The exact slash command a person would type by hand to claim and route
/// into an item — this action never calls `fgos pick` itself, only opens
/// the same door (D4/STR40: never make herdr, or a plugin, a second
/// decision-maker).
const PICK_SLASH_COMMAND: &str = "/fgOS:pick";

/// tsk-1e3 D4: same door-opening discipline as `PICK_SLASH_COMMAND` above —
/// the Discover button never calls `fgos discover` itself, only opens a
/// pane that types the slash command a person would type by hand.
const DISCOVER_SLASH_COMMAND: &str = "/fgOS:discover";

/// Same door-opening discipline, for the unattended auto-discover
/// launcher: unlike `DISCOVER_SLASH_COMMAND` above (a specific id a
/// person picked in the dashboard), the auto-launcher never picks an id
/// itself — it only ever confirms *some* discoverable item exists
/// (`next_auto_discover_candidate` in `main.rs`, backed by `fgos triage
/// --json`'s dependency data), then hands the actual pick off to
/// `pickNextDiscoverItem` (`src/state/discover-pool.mjs`) via this no-id
/// pool-sweep command — the same centralization `/fgOS:merge-next`/
/// `/fgOS:retro-next`/`/fgOS:cleanup-next` already use for their own
/// pool-sweep verbs, kept in one place instead of duplicated in Rust.
const DISCOVER_NEXT_SLASH_COMMAND: &str = "/fgOS:discover-next";

/// tsk-57q: same door-opening discipline as `PICK_SLASH_COMMAND` above —
/// the auto-merge launcher never calls `fgos approve`/`merge` itself, only
/// opens a pane that types the same pool-sweep slash command a person
/// would type by hand.
///
/// tsk-4ry: launches the single-item `-next` skill, not the perpetual
/// `-loop` skill it used to. The `-loop` skills stay unchanged and
/// callable manually; only the auto-launch target changes, so herdr's own
/// poll tick decides whether to relaunch (via `pending_merge_pane`/
/// `pending_retro_pane`/`pending_cleanup_pane` in `app.rs` plus each
/// lane's pool-nonempty check in `main.rs`) instead of one pane
/// self-repeating forever.
const MERGE_NEXT_SLASH_COMMAND: &str = "/fgOS:merge-next";
/// Same door-opening discipline, for the right (retro/cleanup) slot.
const RETRO_NEXT_SLASH_COMMAND: &str = "/fgOS:retro-next";
/// Same door-opening discipline, for the right (retro/cleanup) slot.
const CLEANUP_NEXT_SLASH_COMMAND: &str = "/fgOS:cleanup-next";

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

/// Mirrors `skip_permissions_enabled` above (tsk-4iz D2/D3): the model
/// every herdr-plugin-launched `claude` session is pinned to, read once
/// per launch, never cached. Set `FGOS_HERDR_MODEL` to override; defaults
/// to `sonnet` — this repo's own already-established `--model` alias
/// (`.fgos/config.json`'s `runner.executor.args`/`capacities.*.args`).
pub fn model_flag() -> String {
    std::env::var("FGOS_HERDR_MODEL").unwrap_or_else(|_| "sonnet".into())
}

/// argv for launching `claude` in the newly opened pane with
/// `<slash_command> <id>` piped in as the initial prompt — the automated
/// equivalent of a person typing the slash command by hand. Generalized
/// over which slash command (tsk-1e3 D4: `run_argv`/`discover_run_argv`
/// below are thin wrappers over this, so both stay covered by the same
/// id-validation and skip-permissions logic instead of duplicating it).
///
/// tsk-1zq dropped the `extra_args` tail this used to splice in after the
/// id: its only ever caller-supplied value was `--autoClose`, and no
/// herdr-launched command carries that any more.
fn run_argv_for_command(
    pane_id: &str,
    slash_command: &str,
    id: &str,
    model: &str,
    skip_permissions: bool,
) -> Result<Vec<String>, InvalidId> {
    if !is_valid_id(id) {
        return Err(InvalidId(id.to_string()));
    }
    let command = if skip_permissions {
        format!("claude --model {model} --dangerously-skip-permissions '{slash_command} {id}'")
    } else {
        format!("claude --model {model} '{slash_command} {id}'")
    };
    Ok(vec!["pane".into(), "run".into(), pane_id.into(), command])
}

/// argv for launching `claude` in the newly opened pane with
/// `/fgOS:pick <id>` piped in as the initial prompt — the automated
/// equivalent of a person typing the slash command by hand.
/// `skip_permissions` is threaded in explicitly (never read from env
/// inside this pure function) so it stays deterministically testable —
/// D1's actual env resolution lives in `skip_permissions_enabled` above.
pub fn run_argv(
    pane_id: &str,
    id: &str,
    model: &str,
    skip_permissions: bool,
) -> Result<Vec<String>, InvalidId> {
    run_argv_for_command(pane_id, PICK_SLASH_COMMAND, id, model, skip_permissions)
}

/// argv for launching `claude` with `/fgOS:discover <id>` (tsk-1e3 D4) —
/// used by `open_discover_pane`'s manual, per-item Discover button, the
/// only caller left with a specific id to hand over (the unattended
/// auto-launcher moved to the no-id `discover_next_run_argv` below it —
/// see `open_auto_discover_pane`). Same shape as `run_argv`, different
/// slash command.
///
/// tsk-1zq dropped tsk-358 D1's `--autoClose`: a finished worker pane is
/// now reclaimed by the next worker (`layout::acquire_worker_slot_pane`)
/// rather than closed after a delay, so asking the launched session to
/// close its own pane would destroy a slot herdr is about to reuse. A8
/// removes that branch rather than repairing it.
pub fn discover_run_argv(
    pane_id: &str,
    id: &str,
    model: &str,
    skip_permissions: bool,
) -> Result<Vec<String>, InvalidId> {
    run_argv_for_command(pane_id, DISCOVER_SLASH_COMMAND, id, model, skip_permissions)
}

/// argv for launching `claude` with a pool-sweep slash command that takes
/// no id argument (`/fgOS:merge-next`/`/fgOS:retro-next`/
/// `/fgOS:cleanup-next` since tsk-4ry, `/fgOS:merge-loop`/`/fgOS:retro-loop`/
/// `/fgOS:cleanup-loop` before it, tsk-57q) into an already-resolved pane.
/// Unlike `run_argv_for_command` above, there is no id to validate or
/// interpolate — every existing argv builder in this file assumes one,
/// so this is deliberately a separate, smaller function rather than a
/// third `run_argv_for_command` wrapper.
fn no_id_run_argv(pane_id: &str, slash_command: &str, model: &str, skip_permissions: bool) -> Vec<String> {
    let command = if skip_permissions {
        format!("claude --model {model} --dangerously-skip-permissions '{slash_command}'")
    } else {
        format!("claude --model {model} '{slash_command}'")
    };
    vec!["pane".into(), "run".into(), pane_id.into(), command]
}

/// argv for the unattended auto-discover launch's actual typed command,
/// `/fgOS:discover-next` — no id (same "never interpolates or validates
/// an id" shape `no_id_run_argv` above already established for
/// `/fgOS:merge-next`/`/fgOS:retro-next`/`/fgOS:cleanup-next`), and, since
/// tsk-1zq, no `--autoClose` either, for the same reason
/// `discover_run_argv` above dropped it: worker panes are reclaimed by
/// reuse, never closed.
fn discover_next_run_argv(pane_id: &str, model: &str, skip_permissions: bool) -> Vec<String> {
    let command = if skip_permissions {
        format!("claude --model {model} --dangerously-skip-permissions '{DISCOVER_NEXT_SLASH_COMMAND}'")
    } else {
        format!("claude --model {model} '{DISCOVER_NEXT_SLASH_COMMAND}'")
    };
    vec!["pane".into(), "run".into(), pane_id.into(), command]
}

/// Resolve the herdr binary the same way the plugin docs recommend:
/// `HERDR_BIN_PATH`, injected into every plugin runtime command, falling
/// back to a bare `herdr` (PATH lookup) outside a live herdr session.
pub fn herdr_bin() -> String {
    std::env::var("HERDR_BIN_PATH").unwrap_or_else(|_| "herdr".into())
}

/// Run `/fgOS:pick <id>` in a worker-lane pane — the shared launch-agent
/// function (tsk-1q3), used identically by the manual dashboard action
/// and the unattended dispatcher. Pane placement goes through the layout
/// manager (`layout::acquire_worker_slot_pane`), which reclaims a free
/// worker pane before splitting a new one (tsk-1zq). Already tsk-3t9-3's
/// asked-for port/adapter shape: `layout` is this function's own
/// implementation detail, never touched by `app.rs`/`main.rs`'s event
/// loop directly — the domain only ever calls
/// `PaneOrchestrator::open_pick_pane`/`focus_pane` (this `impl` block,
/// below), never `layout::` or this free function itself.
/// `project_root` is where the launched session starts (tsk-45u D1) — the
/// main fgOS checkout, so `/fgOS:pick` can reach `.fgos/` and switch into
/// the item's worktree itself.
///
/// Returns the pane it used, so the caller can hold it pending until the
/// launched session labels itself and stops looking free.
pub fn open_pick_pane(
    herdr_bin: &str,
    workspace_id: &str,
    id: &str,
    project_root: &Path,
    panes: &[PaneSnapshot],
    lane: &WorkerLaneView,
) -> io::Result<String> {
    let pane_id = layout::acquire_worker_slot_pane(
        herdr_bin,
        workspace_id,
        project_root,
        panes,
        lane.doing_ids,
        lane.pending_panes,
    )
    .map_err(io::Error::other)?;

    let run_args = run_argv(&pane_id, id, &model_flag(), skip_permissions_enabled())
        .map_err(io::Error::other)?;
    // Fire-and-forget: the dashboard never waits on the launched claude
    // session's own lifetime, only on herdr accepting the typed command.
    Command::new(herdr_bin).args(run_args).spawn()?;
    Ok(pane_id)
}

/// Same shape as `open_pick_pane` above, launching `/fgOS:discover <id>`
/// instead (tsk-1e3 D4).
pub fn open_discover_pane(
    herdr_bin: &str,
    workspace_id: &str,
    id: &str,
    project_root: &Path,
    panes: &[PaneSnapshot],
    lane: &WorkerLaneView,
) -> io::Result<String> {
    let pane_id = layout::acquire_worker_slot_pane(
        herdr_bin,
        workspace_id,
        project_root,
        panes,
        lane.doing_ids,
        lane.pending_panes,
    )
    .map_err(io::Error::other)?;

    let run_args = discover_run_argv(&pane_id, id, &model_flag(), skip_permissions_enabled())
        .map_err(io::Error::other)?;
    Command::new(herdr_bin).args(run_args).spawn()?;
    Ok(pane_id)
}

/// Runs `/fgOS:merge-next` directly into an already-resolved pane
/// (tsk-57q; single-item `-next` since tsk-4ry, was the perpetual
/// `/fgOS:merge-loop` before) — unlike `open_pick_pane`/`open_discover_pane`
/// above, this never calls `layout::place_new_agent_pane`: the fixed
/// `fg:operation` tab's four slot panes are resolved once, eagerly, at
/// herdr-plugin startup (`layout::ensure_operation_tab`, tsk-5lr) and
/// passed in by the caller.
pub fn run_merge_next(
    herdr_bin: &str,
    pane_id: &str,
    model: &str,
    skip_permissions: bool,
) -> io::Result<()> {
    let run_args = no_id_run_argv(pane_id, MERGE_NEXT_SLASH_COMMAND, model, skip_permissions);
    Command::new(herdr_bin).args(run_args).spawn()?;
    Ok(())
}

/// Same shape as `run_merge_next` above, running `/fgOS:retro-next`.
pub fn run_retro_next(
    herdr_bin: &str,
    pane_id: &str,
    model: &str,
    skip_permissions: bool,
) -> io::Result<()> {
    let run_args = no_id_run_argv(pane_id, RETRO_NEXT_SLASH_COMMAND, model, skip_permissions);
    Command::new(herdr_bin).args(run_args).spawn()?;
    Ok(())
}

/// Same shape as `run_merge_next` above, running `/fgOS:cleanup-next`.
pub fn run_cleanup_next(
    herdr_bin: &str,
    pane_id: &str,
    model: &str,
    skip_permissions: bool,
) -> io::Result<()> {
    let run_args = no_id_run_argv(pane_id, CLEANUP_NEXT_SLASH_COMMAND, model, skip_permissions);
    Command::new(herdr_bin).args(run_args).spawn()?;
    Ok(())
}

/// Unattended equivalent of `open_discover_pane` (tsk-2ja): acquires a
/// worker-lane pane and launches `/fgOS:discover-next`, no id — the
/// caller (`main.rs`'s poll tick) only ever confirms a discoverable item
/// exists before calling this function, it never resolves which one; that
/// pick stays inside the launched session, centralized in
/// `pickNextDiscoverItem`.
///
/// tsk-1zq removed the `herdr pane rename` step that used to run before
/// `claude` was spawned. That rename existed to plant the
/// `fgos-auto-discover` label as a launch mutex, and D2 forbids a label
/// carrying orchestrator state at all — a session was free to rename the
/// pane mid-flight, silently releasing the "lock", and a session that
/// died left it held forever. The question it answered ("is one already
/// running?") is put to the engine now, so its write side goes with it.
pub fn open_auto_discover_pane(
    herdr_bin: &str,
    workspace_id: &str,
    project_root: &Path,
    panes: &[PaneSnapshot],
    lane: &WorkerLaneView,
) -> io::Result<String> {
    let pane_id = layout::acquire_worker_slot_pane(
        herdr_bin,
        workspace_id,
        project_root,
        panes,
        lane.doing_ids,
        lane.pending_panes,
    )
    .map_err(io::Error::other)?;

    let run_args = discover_next_run_argv(&pane_id, &model_flag(), skip_permissions_enabled());
    Command::new(herdr_bin).args(run_args).spawn()?;
    Ok(pane_id)
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
    /// The main fgOS checkout the dashboard is bound to, `None` when it
    /// could not be resolved. tsk-45u D3: with no root there is nowhere
    /// correct to launch, so the launch is refused outright rather than
    /// opening a session in whatever directory herdr happened to inherit.
    pub project_root: Option<PathBuf>,
}

impl HerdrPaneAdapter {
    /// The live pane scan every worker-lane placement decision needs. Read
    /// here rather than threaded down from the domain because it is herdr
    /// chrome, not fgOS state — the domain's job is to supply the engine's
    /// answer (`WorkerLaneView`), which it alone holds.
    fn scan_panes(&self) -> io::Result<Vec<PaneSnapshot>> {
        let scanner = HerdrPaneScanner {
            herdr_bin: self.herdr_bin.clone(),
            workspace_id: self.workspace_id.clone(),
        };
        scanner
            .scan_panes()
            .map_err(|err| io::Error::other(err.to_string()))
    }
}

impl PaneOrchestrator for HerdrPaneAdapter {
    fn open_pick_pane(&self, id: &str, lane: &WorkerLaneView) -> io::Result<String> {
        let Some(project_root) = &self.project_root else {
            return Err(io::Error::other(
                "project root unresolved — refusing to launch an agent outside a project",
            ));
        };
        let panes = self.scan_panes()?;
        open_pick_pane(&self.herdr_bin, &self.workspace_id, id, project_root, &panes, lane)
    }

    fn open_discover_pane(&self, id: &str, lane: &WorkerLaneView) -> io::Result<String> {
        let Some(project_root) = &self.project_root else {
            return Err(io::Error::other(
                "project root unresolved — refusing to launch an agent outside a project",
            ));
        };
        let panes = self.scan_panes()?;
        open_discover_pane(&self.herdr_bin, &self.workspace_id, id, project_root, &panes, lane)
    }

    fn focus_pane(&self, pane_id: &str) -> io::Result<()> {
        focus_pane(&self.herdr_bin, pane_id)
    }

    fn launch_merge_loop(&self, pane_id: &str) -> io::Result<()> {
        run_merge_next(&self.herdr_bin, pane_id, &model_flag(), skip_permissions_enabled())
    }

    fn launch_retro_loop(&self, pane_id: &str) -> io::Result<()> {
        run_retro_next(&self.herdr_bin, pane_id, &model_flag(), skip_permissions_enabled())
    }

    fn launch_cleanup_loop(&self, pane_id: &str) -> io::Result<()> {
        run_cleanup_next(&self.herdr_bin, pane_id, &model_flag(), skip_permissions_enabled())
    }

    fn open_auto_discover_pane(&self, lane: &WorkerLaneView) -> io::Result<String> {
        let Some(project_root) = &self.project_root else {
            return Err(io::Error::other(
                "project root unresolved — refusing to launch an agent outside a project",
            ));
        };
        let panes = self.scan_panes()?;
        open_auto_discover_pane(&self.herdr_bin, &self.workspace_id, project_root, &panes, lane)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// tsk-45u D3: with no project root there is nowhere correct to
    /// launch, so the adapter refuses before touching herdr at all —
    /// `herdr_bin` here points at a binary that would fail loudly if it
    /// were ever spawned, which it must not be.
    /// An empty lane view — these refusal tests never reach the placement
    /// logic, so what the lane says is irrelevant to them.
    fn empty_lane() -> WorkerLaneView<'static> {
        WorkerLaneView {
            doing_ids: &[],
            pending_panes: &[],
        }
    }

    fn adapter_without_a_project_root_refuses_to_launch() -> io::Result<String> {
        let adapter = HerdrPaneAdapter {
            herdr_bin: "/nonexistent/herdr".into(),
            workspace_id: "wS".into(),
            project_root: None,
        };
        adapter.open_pick_pane("tsk-45u", &empty_lane())
    }

    #[test]
    fn launch_is_refused_when_the_project_root_is_unresolved() {
        let err = adapter_without_a_project_root_refuses_to_launch()
            .expect_err("a rootless dashboard must never open an agent pane");
        assert!(
            err.to_string().contains("project root unresolved"),
            "the refusal must say why: {err}"
        );
    }

    /// tsk-1e3 D4: same refusal, same reason, for the Discover pane —
    /// mirrors `launch_is_refused_when_the_project_root_is_unresolved`.
    #[test]
    fn discover_launch_is_refused_when_the_project_root_is_unresolved() {
        let adapter = HerdrPaneAdapter {
            herdr_bin: "/nonexistent/herdr".into(),
            workspace_id: "wS".into(),
            project_root: None,
        };
        let err = adapter
            .open_discover_pane("tsk-1e3", &empty_lane())
            .expect_err("a rootless dashboard must never open an agent pane");
        assert!(
            err.to_string().contains("project root unresolved"),
            "the refusal must say why: {err}"
        );
    }

    /// tsk-2ja: same refusal, same reason, for the auto-discover pane —
    /// mirrors `discover_launch_is_refused_when_the_project_root_is_unresolved`.
    #[test]
    fn auto_discover_launch_is_refused_when_the_project_root_is_unresolved() {
        let adapter = HerdrPaneAdapter {
            herdr_bin: "/nonexistent/herdr".into(),
            workspace_id: "wS".into(),
            project_root: None,
        };
        let err = adapter
            .open_auto_discover_pane(&empty_lane())
            .expect_err("a rootless dashboard must never open an agent pane");
        assert!(
            err.to_string().contains("project root unresolved"),
            "the refusal must say why: {err}"
        );
    }

    #[test]
    fn pane_focus_argv_targets_the_given_pane_id() {
        assert_eq!(
            focus_pane_argv("wS:p1H"),
            vec!["pane", "zoom", "wS:p1H", "--on"]
        );
    }

    #[test]
    fn launch_agent_run_argv_includes_skip_permissions_by_default() {
        let argv = run_argv("wS:p16", "tsk-19y-3", "sonnet", true).expect("valid id");
        assert_eq!(
            argv,
            vec![
                "pane",
                "run",
                "wS:p16",
                "claude --model sonnet --dangerously-skip-permissions '/fgOS:pick tsk-19y-3'",
            ]
        );
    }

    #[test]
    fn launch_agent_run_argv_omits_skip_permissions_when_disabled() {
        let argv = run_argv("wS:p16", "tsk-19y-3", "sonnet", false).expect("valid id");
        assert_eq!(
            argv,
            vec![
                "pane",
                "run",
                "wS:p16",
                "claude --model sonnet '/fgOS:pick tsk-19y-3'",
            ]
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

    /// tsk-4iz D2/D3: mirrors
    /// `launch_agent_skip_permissions_enabled_reads_env_with_safe_default`
    /// above, same sequential-in-one-test discipline to avoid the same
    /// process-global env-var race.
    #[test]
    fn launch_agent_model_flag_reads_env_with_safe_default() {
        std::env::remove_var("FGOS_HERDR_MODEL");
        assert_eq!(model_flag(), "sonnet", "unset must default to sonnet (D3)");

        std::env::set_var("FGOS_HERDR_MODEL", "haiku");
        assert_eq!(model_flag(), "haiku", "FGOS_HERDR_MODEL must override the default");

        std::env::remove_var("FGOS_HERDR_MODEL");
    }

    #[test]
    fn discover_run_argv_includes_skip_permissions_by_default() {
        let argv = discover_run_argv("wS:p16", "tsk-19y-3", "sonnet", true).expect("valid id");
        assert_eq!(
            argv,
            vec![
                "pane",
                "run",
                "wS:p16",
                "claude --model sonnet --dangerously-skip-permissions '/fgOS:discover tsk-19y-3'",
            ]
        );
    }

    /// tsk-1zq: the per-id discover launch carries no self-close flag, on
    /// either skip-permissions branch. Worker panes are reclaimed by the
    /// next worker, so a session closing its own pane would destroy a slot
    /// herdr is about to reuse.
    #[test]
    fn discover_run_argv_never_asks_the_session_to_close_its_own_pane() {
        let argv = discover_run_argv("wS:p16", "tsk-19y-3", "sonnet", false).expect("valid id");
        assert_eq!(
            argv,
            vec![
                "pane",
                "run",
                "wS:p16",
                "claude --model sonnet '/fgOS:discover tsk-19y-3'",
            ]
        );
    }

    #[test]
    fn discover_run_argv_rejects_ids_fgos_itself_would_reject() {
        assert!(discover_run_argv("p", "", "sonnet", true).is_err());
        assert!(discover_run_argv("p", "tsk-19y-3", "sonnet", true).is_ok());
    }

    #[test]
    fn run_argv_rejects_an_id_that_could_break_out_of_the_typed_command() {
        let err = run_argv("wS:p16", "tsk'; rm -rf ~ #", "sonnet", true).unwrap_err();
        assert_eq!(err, InvalidId("tsk'; rm -rf ~ #".to_string()));
    }

    #[test]
    fn no_id_run_argv_never_interpolates_or_validates_an_id() {
        // Every other argv builder in this file (`run_argv`,
        // `discover_run_argv`) requires and validates an id — this one is
        // the first that does not, since `/fgOS:merge-next`/
        // `/fgOS:retro-next`/`/fgOS:cleanup-next` are pool-sweep verbs
        // with no per-item argument (tsk-57q; single-item `-next` since
        // tsk-4ry, was the perpetual `-loop` skill before it).
        assert_eq!(
            no_id_run_argv("wS:pOpL", MERGE_NEXT_SLASH_COMMAND, "sonnet", true),
            vec![
                "pane",
                "run",
                "wS:pOpL",
                "claude --model sonnet --dangerously-skip-permissions '/fgOS:merge-next'",
            ]
        );
    }

    #[test]
    fn auto_discover_launch_is_a_plain_run_with_no_label_write() {
        // tsk-1zq: the launch used to plant a fixed guard label before
        // spawning claude, purely so a later tick could read it back as a
        // "one at a time" mutex. D2 forbids a label carrying orchestrator
        // state, so the read moved to the engine and the write disappeared
        // with it — a launch is now one `pane run` and nothing else.
        assert_eq!(
            discover_next_run_argv("wS:p16", "sonnet", true),
            vec![
                "pane",
                "run",
                "wS:p16",
                "claude --model sonnet --dangerously-skip-permissions '/fgOS:discover-next'",
            ]
        );
    }

    #[test]
    fn no_id_run_argv_respects_skip_permissions_false() {
        assert_eq!(
            no_id_run_argv("wS:pOpR", RETRO_NEXT_SLASH_COMMAND, "sonnet", false),
            vec![
                "pane",
                "run",
                "wS:pOpR",
                "claude --model sonnet '/fgOS:retro-next'",
            ]
        );
    }

    #[test]
    fn no_id_run_argv_builds_the_cleanup_next_command() {
        assert_eq!(
            no_id_run_argv("wS:pOpR", CLEANUP_NEXT_SLASH_COMMAND, "sonnet", false),
            vec![
                "pane",
                "run",
                "wS:pOpR",
                "claude --model sonnet '/fgOS:cleanup-next'",
            ]
        );
    }

    #[test]
    fn discover_next_run_argv_never_asks_the_session_to_close_its_own_pane() {
        assert_eq!(
            discover_next_run_argv("wS:p16", "sonnet", true),
            vec![
                "pane",
                "run",
                "wS:p16",
                "claude --model sonnet --dangerously-skip-permissions '/fgOS:discover-next'",
            ]
        );
        assert_eq!(
            discover_next_run_argv("wS:p16", "sonnet", false),
            vec![
                "pane",
                "run",
                "wS:p16",
                "claude --model sonnet '/fgOS:discover-next'",
            ]
        );
    }


    #[test]
    fn run_argv_rejects_ids_fgos_itself_would_reject() {
        // Mirrors src/state/work.mjs's ID_PATTERN test cases.
        assert!(run_argv("p", "", "sonnet", true).is_err());
        assert!(run_argv("p", "-leading-hyphen", "sonnet", true).is_err());
        assert!(run_argv("p", "trailing-hyphen-", "sonnet", true).is_err());
        assert!(run_argv("p", "double--hyphen", "sonnet", true).is_err());
        assert!(run_argv("p", "1starts-with-digit", "sonnet", true).is_err());
        assert!(run_argv("p", "Has-Upper-Case", "sonnet", true).is_err());
        assert!(run_argv("p", "tsk-19y-3", "sonnet", true).is_ok());
        assert!(run_argv(
            "p",
            "choke-point-take-vs-pick-claim-eligibility",
            "sonnet",
            true
        )
        .is_ok());
    }
}
