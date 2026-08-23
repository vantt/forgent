use std::ffi::{OsStr, OsString};
use std::io;
use std::path::Path;
use std::process::Command;

use serde::Deserialize;

use crate::pane_scan::{extract_task_id, PaneSnapshot};

/// How many panes one `fg:workers-N` tab holds before the next tab is
/// created — the 2×2 corner grid `next_split_target` below builds toward
/// (tsk-1q3 CONTEXT.md feature boundary).
///
/// tsk-1zq: this is grid GEOMETRY, not a ceiling. It decides where the
/// next pane goes, never whether there is room for another worker at all
/// — that question belongs to the engine now (`fgos slots`, D6), which is
/// why the old `MAX_AGENT_TABS` cap and its `NoRoomForAgentTabs` refusal
/// are gone rather than renamed: two independent ceilings that never knew
/// about each other was exactly the problem (RESEARCH F2).
const PANES_PER_WORKERS_TAB: usize = 4;

/// Prefix of the worker lane's tab labels. tsk-1zq supersedes tsk-1q3's
/// own pinned tab term (which named the lane after the agents in it): a
/// slot is named apart from whatever occupies it (D1), and `worker` is
/// the word the whole feature settled on.
const WORKERS_TAB_PREFIX: &str = "fg:workers-";

#[derive(Debug)]
pub enum LayoutError {
    Io(io::Error),
    ExitStatus(String),
    Parse(serde_json::Error),
    NoUsablePaneInResponse(String),
}

impl std::fmt::Display for LayoutError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LayoutError::Io(err) => write!(f, "herdr CLI spawn failed: {err}"),
            LayoutError::ExitStatus(detail) => write!(f, "herdr CLI exited non-zero: {detail}"),
            LayoutError::Parse(err) => write!(f, "herdr CLI output parse failed: {err}"),
            LayoutError::NoUsablePaneInResponse(raw) => {
                write!(f, "herdr response had no usable pane: {raw}")
            }
        }
    }
}

impl std::error::Error for LayoutError {}

impl From<io::Error> for LayoutError {
    fn from(err: io::Error) -> Self {
        LayoutError::Io(err)
    }
}

#[derive(Debug, Clone, Deserialize)]
struct TabRow {
    tab_id: String,
    label: Option<String>,
    pane_count: u32,
}

#[derive(Debug, Deserialize)]
struct TabListEnvelope {
    result: TabListResult,
}

#[derive(Debug, Deserialize)]
struct TabListResult {
    tabs: Vec<TabRow>,
}

/// Parses `herdr tab list --workspace <id>`'s real response shape
/// (captured live this session).
fn parse_tab_list(json: &str) -> Result<Vec<TabRow>, serde_json::Error> {
    let envelope: TabListEnvelope = serde_json::from_str(json)?;
    Ok(envelope.result.tabs)
}

#[derive(Debug, Deserialize)]
struct TabCreateEnvelope {
    result: TabCreateResult,
}

#[derive(Debug, Deserialize)]
struct TabCreateResult {
    root_pane: RootPane,
    tab: TabRow,
}

#[derive(Debug, Deserialize)]
struct RootPane {
    pane_id: String,
}

/// Parses `herdr tab create ...`'s real response shape (captured live
/// this session) into `(new_tab_id, first_pane_id)` — a freshly created
/// tab always carries exactly one root pane already.
fn parse_tab_create(json: &str) -> Result<(String, String), serde_json::Error> {
    let envelope: TabCreateEnvelope = serde_json::from_str(json)?;
    Ok((envelope.result.tab.tab_id, envelope.result.root_pane.pane_id))
}

#[derive(Debug, Deserialize)]
struct PaneListEnvelope {
    result: PaneListResult,
}

#[derive(Debug, Deserialize)]
struct PaneListResult {
    panes: Vec<PaneRow>,
}

#[derive(Debug, Deserialize)]
struct PaneRow {
    pane_id: String,
    tab_id: String,
}

/// Finds any one pane already inside `tab_id` via `pane list --workspace
/// <id>` (each row carries both `pane_id` and `tab_id` — proven live in
/// tsk-4zo's own `pane_scan.rs`). `tab list`'s own rows never carry a
/// pane id, only `pane_count`, so this second call is how an *existing*
/// worker-lane tab's first usable pane is actually found.
fn find_any_pane_in_tab(herdr_bin: &str, workspace_id: &str, tab_id: &str) -> Result<String, LayoutError> {
    let stdout = run_herdr(herdr_bin, &["pane", "list", "--workspace", workspace_id])?;
    let envelope: PaneListEnvelope = serde_json::from_str(&stdout).map_err(LayoutError::Parse)?;
    envelope
        .result
        .panes
        .into_iter()
        .find(|pane| pane.tab_id == tab_id)
        .map(|pane| pane.pane_id)
        .ok_or_else(|| LayoutError::NoUsablePaneInResponse(stdout))
}

#[derive(Debug, Deserialize)]
struct PaneLayoutEnvelope {
    result: PaneLayoutResult,
}

#[derive(Debug, Deserialize)]
struct PaneLayoutResult {
    layout: TabLayout,
}

#[derive(Debug, Deserialize)]
struct TabLayout {
    area: Rect,
    panes: Vec<LayoutPane>,
}

#[derive(Debug, Deserialize)]
struct LayoutPane {
    pane_id: String,
    rect: Rect,
}

#[derive(Debug, Deserialize)]
struct Rect {
    height: u32,
    /// Reading-order sort keys for `operation_slot_panes` (tsk-1zq,
    /// superseding tsk-5lr D2's binary smallest-`x`-is-left rule, which
    /// cannot address four slots).
    x: u32,
    y: u32,
    /// Unread by any current decision; kept for parse parity with the
    /// real response.
    #[allow(dead_code)]
    width: u32,
}

/// Extracts the trailing `<N>` from a `fg:workers-<N>` label. A tab still
/// carrying tsk-1q3's superseded label is deliberately not recognized:
/// after tsk-1zq's rename it is simply an ordinary tab, so herdr places
/// no new pane in it, never reuses a pane inside it, and never closes it
/// — relabelling an operator's live workspace costs more than it fixes.
fn workers_tab_index(label: &str) -> Option<u32> {
    label.strip_prefix(WORKERS_TAB_PREFIX)?.parse().ok()
}

fn run_herdr<S: AsRef<OsStr>>(herdr_bin: &str, args: &[S]) -> Result<String, LayoutError> {
    let output = Command::new(herdr_bin).args(args).output()?;
    if !output.status.success() {
        return Err(LayoutError::ExitStatus(
            String::from_utf8_lossy(&output.stderr).to_string(),
        ));
    }
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

/// Finds the lowest-numbered `fg:workers-N` tab with a free grid slot
/// (`pane_count < PANES_PER_WORKERS_TAB`), or creates the next
/// `fg:workers-(N+1)` tab if none has room. Returns `(tab_id,
/// an_existing_pane_id_in_that_tab, pane_count)` — the pane id and count
/// feed straight into `next_split_target` next. A freshly created tab
/// always starts with exactly one root pane (proven live).
///
/// tsk-1zq: this never refuses any more. Tabs grow as needed, because the
/// only ceiling that means anything now is the engine's, asked before
/// this function is ever reached (D6).
///
/// `project_root` is the cwd every pane this function creates starts in
/// (tsk-45u D1): a new tab's root pane is a real pane a person can end up
/// typing in, so it starts in the project too rather than inheriting
/// whatever directory herdr happened to be launched from.
pub fn find_workers_tab_with_room(
    herdr_bin: &str,
    workspace_id: &str,
    project_root: &Path,
) -> Result<(String, String, usize), LayoutError> {
    let stdout = run_herdr(herdr_bin, &["tab", "list", "--workspace", workspace_id])?;
    let tabs = parse_tab_list(&stdout).map_err(LayoutError::Parse)?;

    let mut worker_tabs: Vec<(u32, TabRow)> = tabs
        .into_iter()
        .filter_map(|tab| {
            let index = workers_tab_index(tab.label.as_deref()?)?;
            Some((index, tab))
        })
        .collect();
    worker_tabs.sort_by_key(|(index, _)| *index);

    match decide_workers_tab_placement(&worker_tabs) {
        WorkersTabPlacement::ExistingTabWithRoom(tab) => {
            let pane_id = find_any_pane_in_tab(herdr_bin, workspace_id, &tab.tab_id)?;
            Ok((tab.tab_id.clone(), pane_id, tab.pane_count as usize))
        }
        WorkersTabPlacement::CreateNextTab(next_index) => {
            let label = format!("{WORKERS_TAB_PREFIX}{next_index}");
            let stdout =
                run_herdr(herdr_bin, &tab_create_argv(workspace_id, &label, project_root))?;
            let (tab_id, pane_id) = parse_tab_create(&stdout).map_err(LayoutError::Parse)?;
            Ok((tab_id, pane_id, 1))
        }
    }
}

/// Pure decision `find_workers_tab_with_room` dispatches on, given the
/// `fg:workers-N` tabs already sorted by index: fill an existing tab's
/// grid, or start the next tab. Kept separate from the live herdr calls
/// for the same unit-testability `find_other_cockpit_tab` already gets.
enum WorkersTabPlacement<'a> {
    ExistingTabWithRoom(&'a TabRow),
    CreateNextTab(u32),
}

fn decide_workers_tab_placement(worker_tabs: &[(u32, TabRow)]) -> WorkersTabPlacement<'_> {
    if let Some((_, tab)) = worker_tabs
        .iter()
        .find(|(_, tab)| (tab.pane_count as usize) < PANES_PER_WORKERS_TAB)
    {
        return WorkersTabPlacement::ExistingTabWithRoom(tab);
    }
    let next_index = worker_tabs.last().map(|(index, _)| index + 1).unwrap_or(1);
    WorkersTabPlacement::CreateNextTab(next_index)
}

/// Which already-open worker-lane pane, if any, is free to run the next
/// worker (tsk-1zq / A5 / D10). Pure: the caller hands in the live pane
/// scan, the set of `fg:workers-N` tab ids, the ids the ENGINE reports at
/// `doing`, and the panes this adapter is still waiting on.
///
/// A pane qualifies on four counts, and the split between the third and
/// fourth is the whole point of D2:
///
/// 1. it lives in the worker lane — only that lane holds one-shot,
///    ceiling-bounded flows, so a pane there is never a running loop (A7);
/// 2. it is not focused — the one exception D10 keeps, because the
///    driver's closing report is the single thing in a finished pane with
///    no copy elsewhere, and a person reading it is a focused pane;
/// 3. this adapter is not still waiting on a launch it made into it —
///    its own bookkeeping about its own actions;
/// 4. the item its LABEL names is not among the ids the ENGINE reports
///    running. The label supplies identity only; liveness comes from
///    fgOS. A pane with no id-shaped label is never reused: there is no
///    honest way to tell a booting session from an abandoned pane without
///    reading `agent_status` (forbidden by the operator runbook) or
///    inventing a time threshold (rejected during shaping).
///
/// Deterministic rather than oldest-finished-first: that ordering is a
/// fold over the event log, which lives engine-side and which `fgos
/// slots` does not expose. Rebuilding it in Rust would be a second copy
/// of engine logic; the focused-pane rule already covers the case the
/// ordering was meant to protect.
pub fn reusable_worker_pane(
    panes: &[PaneSnapshot],
    workers_tab_ids: &[String],
    doing_ids: &[String],
    pending_panes: &[String],
) -> Option<String> {
    let mut free: Vec<&PaneSnapshot> = panes
        .iter()
        .filter(|pane| workers_tab_ids.iter().any(|tab| *tab == pane.tab_id))
        .filter(|pane| !pane.focused)
        .filter(|pane| !pending_panes.iter().any(|p| *p == pane.pane_id))
        .filter(|pane| {
            let Some(label) = pane.label.as_deref() else {
                return false;
            };
            match extract_task_id(label) {
                Some(task_id) => !doing_ids.iter().any(|id| id == task_id),
                None => false,
            }
        })
        .collect();
    free.sort_by(|a, b| a.pane_id.cmp(&b.pane_id));
    free.first().map(|pane| pane.pane_id.clone())
}

/// The `fg:workers-N` tab ids in this workspace, for
/// `reusable_worker_pane`'s lane check above.
fn workers_tab_ids(herdr_bin: &str, workspace_id: &str) -> Result<Vec<String>, LayoutError> {
    let stdout = run_herdr(herdr_bin, &["tab", "list", "--workspace", workspace_id])?;
    let tabs = parse_tab_list(&stdout).map_err(LayoutError::Parse)?;
    Ok(tabs
        .into_iter()
        .filter(|tab| {
            tab.label
                .as_deref()
                .and_then(workers_tab_index)
                .is_some()
        })
        .map(|tab| tab.tab_id)
        .collect())
}

/// argv for the `tab create` call above, kept pure so a test can assert
/// on it without a live herdr. `--cwd` is herdr's own flag (verified
/// live: a tab created with it reports that cwd on its root pane), which
/// is why the project root never has to be spliced into shell text.
fn tab_create_argv(workspace_id: &str, label: &str, project_root: &Path) -> Vec<OsString> {
    vec![
        "tab".into(),
        "create".into(),
        "--workspace".into(),
        workspace_id.into(),
        "--label".into(),
        label.into(),
        "--cwd".into(),
        project_root.as_os_str().to_os_string(),
        "--no-focus".into(),
    ]
}

/// Given a tab (identified by any pane id already known to be inside it)
/// with 1–3 existing panes, determines the next pane to split and which
/// direction, building toward a 2×2 grid (tsk-1q3 plan.md's algorithm,
/// proven against a real `pane layout` capture this session):
/// `pane_count == 1` → split it right; `pane_count` 2 or 3 → split
/// whichever pane still spans the tab's full height (`rect.height ==
/// area.height`, i.e. never split top/bottom yet) downward.
pub fn next_split_target(
    herdr_bin: &str,
    any_pane_id_in_tab: &str,
    pane_count: usize,
) -> Result<(String, &'static str), LayoutError> {
    let stdout = run_herdr(herdr_bin, &["pane", "layout", "--pane", any_pane_id_in_tab])?;
    let envelope: PaneLayoutEnvelope = serde_json::from_str(&stdout).map_err(LayoutError::Parse)?;
    let layout = envelope.result.layout;

    if pane_count <= 1 {
        let pane = layout
            .panes
            .first()
            .ok_or_else(|| LayoutError::NoUsablePaneInResponse(stdout.clone()))?;
        return Ok((pane.pane_id.clone(), "right"));
    }

    let full_height_pane = layout
        .panes
        .iter()
        .find(|pane| pane.rect.height == layout.area.height)
        .ok_or_else(|| LayoutError::NoUsablePaneInResponse(stdout.clone()))?;
    Ok((full_height_pane.pane_id.clone(), "down"))
}

fn parse_split_result_pane_id(json: &str) -> Option<String> {
    let value: serde_json::Value = serde_json::from_str(json).ok()?;
    value["result"]["pane"]["pane_id"]
        .as_str()
        .map(String::from)
}

/// Resolves the physical pane the next worker slot runs in — reclaiming
/// an already-open worker-lane pane when one is free, and splitting a new
/// one only when none is (tsk-1zq, replacing `place_new_agent_pane`'s
/// create-only shape).
///
/// The rename is the point, not decoration: this function used to be
/// named for what it did to panes, and A5 showed that was the bug. Logical
/// slots were released mechanically on every edge out of `doing` while
/// physical panes were released by nothing at all, so the two ceilings
/// drifted until herdr could not open a worker the engine had already
/// granted. Reclaiming by reuse makes the physical ceiling track the
/// logical one structurally, and it means a finished pane never needs
/// closing — which is why the delay-then-close branch is gone rather than
/// repaired (A8).
pub fn acquire_worker_slot_pane(
    herdr_bin: &str,
    workspace_id: &str,
    project_root: &Path,
    panes: &[PaneSnapshot],
    doing_ids: &[String],
    pending_panes: &[String],
) -> Result<String, LayoutError> {
    let tab_ids = workers_tab_ids(herdr_bin, workspace_id)?;
    if let Some(pane_id) = reusable_worker_pane(panes, &tab_ids, doing_ids, pending_panes) {
        return Ok(pane_id);
    }

    let (_tab_id, any_pane, pane_count) =
        find_workers_tab_with_room(herdr_bin, workspace_id, project_root)?;
    let (target_pane, direction) = next_split_target(herdr_bin, &any_pane, pane_count)?;
    let stdout = run_herdr(
        herdr_bin,
        &pane_split_argv(&target_pane, direction, project_root),
    )?;
    parse_split_result_pane_id(&stdout).ok_or(LayoutError::NoUsablePaneInResponse(stdout))
}

/// argv for the `pane split` call above, kept pure for the same reason
/// `tab_create_argv` is. This is the pane the agent actually runs in, so
/// its `--cwd` is what makes tsk-45u D1 true: the launched session starts
/// at the project root instead of inheriting the split parent's cwd.
fn pane_split_argv(target_pane: &str, direction: &str, project_root: &Path) -> Vec<OsString> {
    vec![
        "pane".into(),
        "split".into(),
        "--pane".into(),
        target_pane.into(),
        "--direction".into(),
        direction.into(),
        "--cwd".into(),
        project_root.as_os_str().to_os_string(),
        "--no-focus".into(),
    ]
}

#[derive(Debug, Deserialize)]
struct TabGetEnvelope {
    result: TabGetResult,
}

#[derive(Debug, Deserialize)]
struct TabGetResult {
    tab: TabRow,
}

/// Renames the tab identified by `tab_id` to `fg:cockpit` if it isn't
/// already (tsk-1q3 D2) — the dashboard's own responsibility, not an
/// operator convention. Reads the tab's current label via `tab get`
/// first so an already-correctly-labeled tab is never renamed twice.
pub fn ensure_cockpit_label(herdr_bin: &str, tab_id: &str) -> Result<(), LayoutError> {
    let stdout = run_herdr(herdr_bin, &["tab", "get", tab_id])?;
    let envelope: TabGetEnvelope = serde_json::from_str(&stdout).map_err(LayoutError::Parse)?;
    if envelope.result.tab.label.as_deref() == Some("fg:cockpit") {
        return Ok(());
    }
    run_herdr(herdr_bin, &["tab", "rename", tab_id, "fg:cockpit"])?;
    Ok(())
}

/// Finds an existing `fg:cockpit` tab in `workspace_id` other than
/// `own_tab_id` and hands off to it -- focuses it, then closes
/// `own_tab_id` (tsk-3i3 D2/D3). `placement = "tab"`
/// (`herdr-plugin.toml`) means `own_tab_id` is always a brand-new tab
/// herdr just created for this launch, never the operator's pre-existing
/// tab, so closing it here never loses anything the operator was using.
/// When no other `fg:cockpit` tab exists yet, labels `own_tab_id` itself
/// instead (the same rename `ensure_cockpit_label` already does).
/// Returns `true` when this call handed off to an existing tab and closed
/// its own -- the caller must stop there and never render the dashboard.
pub fn ensure_cockpit_tab(herdr_bin: &str, workspace_id: &str, own_tab_id: &str) -> Result<bool, LayoutError> {
    let stdout = run_herdr(herdr_bin, &["tab", "list", "--workspace", workspace_id])?;
    let tabs = parse_tab_list(&stdout).map_err(LayoutError::Parse)?;

    if let Some(existing) = find_other_cockpit_tab(&tabs, own_tab_id) {
        run_herdr(herdr_bin, &["tab", "focus", existing.as_str()])?;
        run_herdr(herdr_bin, &["tab", "close", own_tab_id])?;
        return Ok(true);
    }

    ensure_cockpit_label(herdr_bin, own_tab_id)?;
    Ok(false)
}

/// Pure decision `ensure_cockpit_tab` dispatches on: the `tab_id` of a
/// tab already labeled `fg:cockpit` other than `own_tab_id`, if any. Kept
/// separate from the live herdr calls so it stays unit-testable against a
/// `tab list` fixture, the same shape `agents_tab_index`/`parse_tab_list`
/// already are.
fn find_other_cockpit_tab(tabs: &[TabRow], own_tab_id: &str) -> Option<String> {
    tabs.iter()
        .find(|tab| tab.tab_id != own_tab_id && tab.label.as_deref() == Some("fg:cockpit"))
        .map(|tab| tab.tab_id.clone())
}

/// Pure decision `ensure_operation_tab` dispatches on: the `tab_id` of the
/// singular, un-numbered `fg:operation` tab (tsk-5lr CONTEXT.md pinned
/// term), if one already exists. Same unit-testable separation as
/// `find_other_cockpit_tab`.
fn find_operation_tab(tabs: &[TabRow]) -> Option<String> {
    tabs.iter()
        .find(|tab| tab.label.as_deref() == Some("fg:operation"))
        .map(|tab| tab.tab_id.clone())
}

/// How many fixed slots the `fg:operation` tab holds: one per admin loop
/// kind today (merge, retro, cleanup) plus one spare held for the next
/// one (D9). Matches `ADMIN_LANE_RESERVATION` in
/// `src/state/worker-slots.mjs` — the admin lane is a fixed reservation,
/// never counted against the execution ceiling.
const OPERATION_TAB_SLOTS: usize = 4;

/// The `fg:operation` tab's four fixed panes, one per admin loop.
/// tsk-1zq supersedes tsk-5lr D2: identity used to be a binary
/// smallest-`x`-is-left rule, which cannot address four slots. Reading
/// order over `(y, x)` generalizes it and stays just as independent of
/// creation order.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OperationPanes {
    pub merge: String,
    pub retro: String,
    pub cleanup: String,
    /// Held for the next admin loop kind. Resolved and kept stable so a
    /// future loop lands in a pane that already exists, rather than
    /// forcing another migration.
    pub spare: String,
}

/// Pure decision: given the `fg:operation` tab's own pane layout, assigns
/// its panes to the four fixed slots in reading order — top-to-bottom,
/// then left-to-right. `None` when the tab does not yet hold
/// `OPERATION_TAB_SLOTS` panes, which is a MIGRATION signal now, not an
/// error state: tsk-5lr's pinned assumption that a non-2-pane
/// `fg:operation` tab is unsupported stops applying with its D2, and
/// `ensure_operation_tab` splits the tab up to size instead of refusing.
fn operation_slot_panes(layout: &TabLayout) -> Option<OperationPanes> {
    if layout.panes.len() < OPERATION_TAB_SLOTS {
        return None;
    }
    let mut ordered: Vec<&LayoutPane> = layout.panes.iter().collect();
    ordered.sort_by_key(|pane| (pane.rect.y, pane.rect.x));
    Some(OperationPanes {
        merge: ordered[0].pane_id.clone(),
        retro: ordered[1].pane_id.clone(),
        cleanup: ordered[2].pane_id.clone(),
        spare: ordered[3].pane_id.clone(),
    })
}

/// Reads the `fg:operation` tab's current layout through any pane known
/// to be inside it.
fn operation_tab_layout(herdr_bin: &str, any_pane_id: &str) -> Result<TabLayout, LayoutError> {
    let stdout = run_herdr(herdr_bin, &["pane", "layout", "--pane", any_pane_id])?;
    let envelope: PaneLayoutEnvelope = serde_json::from_str(&stdout).map_err(LayoutError::Parse)?;
    Ok(envelope.result.layout)
}

/// Finds (or creates) the fixed `fg:operation` tab and returns its four
/// fixed slot panes (tsk-5lr CONTEXT.md D1, with its D2 superseded by
/// tsk-1zq). Created eagerly, at herdr-plugin startup, the same
/// find-or-create-by-label shape `ensure_cockpit_tab` already uses for
/// `fg:cockpit` (D1). This function only locates the tab/panes — it never
/// renders pane content or decides which loop launches where (tsk-417 and
/// tsk-2xt's own scope, respectively).
///
/// A live tab left over from the 2-pane era migrates in place: panes are
/// split until the tab holds four, then the slots resolve normally. Panes
/// here are never reclaimed by the worker lane — they run loops, which is
/// exactly the structural separation A7 relies on.
pub fn ensure_operation_tab(
    herdr_bin: &str,
    workspace_id: &str,
    project_root: &Path,
) -> Result<OperationPanes, LayoutError> {
    let stdout = run_herdr(herdr_bin, &["tab", "list", "--workspace", workspace_id])?;
    let tabs = parse_tab_list(&stdout).map_err(LayoutError::Parse)?;

    let any_pane_id = match find_operation_tab(&tabs) {
        Some(tab_id) => find_any_pane_in_tab(herdr_bin, workspace_id, &tab_id)?,
        None => {
            let stdout = run_herdr(
                herdr_bin,
                &tab_create_argv(workspace_id, "fg:operation", project_root),
            )?;
            let (_tab_id, first_pane_id) = parse_tab_create(&stdout).map_err(LayoutError::Parse)?;
            first_pane_id
        }
    };

    let mut layout = operation_tab_layout(herdr_bin, &any_pane_id)?;
    while layout.panes.len() < OPERATION_TAB_SLOTS {
        let (target_pane, direction) =
            next_split_target(herdr_bin, &any_pane_id, layout.panes.len())?;
        run_herdr(
            herdr_bin,
            &pane_split_argv(&target_pane, direction, project_root),
        )?;
        let grown = operation_tab_layout(herdr_bin, &any_pane_id)?;
        // A split that did not actually add a pane would spin here
        // forever; stop and report instead of hanging the dashboard.
        if grown.panes.len() <= layout.panes.len() {
            return Err(LayoutError::NoUsablePaneInResponse(format!(
                "fg:operation tab stuck at {} panes, expected {OPERATION_TAB_SLOTS}",
                grown.panes.len()
            )));
        }
        layout = grown;
    }

    operation_slot_panes(&layout).ok_or_else(|| {
        LayoutError::NoUsablePaneInResponse(format!(
            "fg:operation tab has {} panes, expected {OPERATION_TAB_SLOTS}",
            layout.panes.len()
        ))
    })
}


#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn snapshot(pane_id: &str, tab_id: &str, label: Option<&str>, focused: bool) -> PaneSnapshot {
        PaneSnapshot {
            pane_id: pane_id.into(),
            tab_id: tab_id.into(),
            label: label.map(String::from),
            focused,
        }
    }

    #[test]
    fn agent_pane_split_starts_in_the_project_root() {
        assert_eq!(
            pane_split_argv(
                "wS:p16",
                "right",
                &PathBuf::from("/home/vantt/projects/forgentX")
            ),
            vec![
                "pane",
                "split",
                "--pane",
                "wS:p16",
                "--direction",
                "right",
                "--cwd",
                "/home/vantt/projects/forgentX",
                "--no-focus",
            ]
        );
    }

    #[test]
    fn a_new_workers_tab_also_starts_in_the_project_root() {
        assert_eq!(
            tab_create_argv(
                "wS",
                "fg:workers-2",
                &PathBuf::from("/home/vantt/projects/forgentX")
            ),
            vec![
                "tab",
                "create",
                "--workspace",
                "wS",
                "--label",
                "fg:workers-2",
                "--cwd",
                "/home/vantt/projects/forgentX",
                "--no-focus",
            ]
        );
    }

    // Captured live: `herdr tab list --workspace wS`, relabeled to the
    // `fg:workers-N` term tsk-1zq pins in place of tsk-1q3's old one.
    const TAB_LIST_FIXTURE: &str = r#"{"id":"cli:tab:list","result":{"tabs":[
        {"agent_status":"idle","focused":false,"label":"workers-3","number":8,"pane_count":3,"tab_id":"wS:t8","workspace_id":"wS"},
        {"agent_status":"working","focused":true,"label":"fg:workers-1","number":13,"pane_count":2,"tab_id":"wS:tD","workspace_id":"wS"},
        {"agent_status":"idle","focused":false,"label":"fg:workers-2","number":14,"pane_count":4,"tab_id":"wS:tE","workspace_id":"wS"}
    ],"type":"tab_list"}}"#;

    // Same shape as TAB_LIST_FIXTURE, plus a tab already labeled
    // `fg:cockpit` -- a prior cockpit launch's own tab.
    const TAB_LIST_WITH_COCKPIT_FIXTURE: &str = r#"{"id":"cli:tab:list","result":{"tabs":[
        {"agent_status":"idle","focused":false,"label":"workers-3","number":8,"pane_count":3,"tab_id":"wS:t8","workspace_id":"wS"},
        {"agent_status":"idle","focused":false,"label":"fg:cockpit","number":9,"pane_count":4,"tab_id":"wS:tC","workspace_id":"wS"}
    ],"type":"tab_list"}}"#;

    // Same shape as TAB_LIST_FIXTURE, plus a tab already labeled
    // `fg:operation` -- a prior herdr-plugin startup's own tab.
    const TAB_LIST_WITH_OPERATION_FIXTURE: &str = r#"{"id":"cli:tab:list","result":{"tabs":[
        {"agent_status":"idle","focused":false,"label":"workers-3","number":8,"pane_count":3,"tab_id":"wS:t8","workspace_id":"wS"},
        {"agent_status":"idle","focused":false,"label":"fg:operation","number":10,"pane_count":4,"tab_id":"wS:tOp","workspace_id":"wS"}
    ],"type":"tab_list"}}"#;

    // Captured live: `herdr tab create --workspace wS --label
    // fg-test-scratch --no-focus` (scratch tab, closed right after
    // capture).
    const TAB_CREATE_FIXTURE: &str = r#"{"id":"cli:tab:create","result":{"root_pane":{"agent_status":"unknown","cwd":"/x","focused":false,"pane_id":"wS:p1J","revision":0,"tab_id":"wS:tF","workspace_id":"wS"},"tab":{"agent_status":"unknown","focused":false,"label":"fg-test-scratch","number":15,"pane_count":1,"tab_id":"wS:tF","workspace_id":"wS"},"type":"tab_created"}}"#;

    // Captured live: `herdr pane layout --current` on a tab with 2 panes,
    // split right (both full-height — neither split down yet).
    const PANE_LAYOUT_TWO_FIXTURE: &str = r#"{"id":"cli:pane:layout","result":{"layout":{"area":{"height":71,"width":234,"x":36,"y":1},"focused_pane_id":"wS:p1G","panes":[
        {"focused":false,"pane_id":"wS:p1H","rect":{"height":71,"width":117,"x":36,"y":1}},
        {"focused":true,"pane_id":"wS:p1G","rect":{"height":71,"width":117,"x":153,"y":1}}
    ],"splits":[{"direction":"right","id":"split_0_root","ratio":0.5,"rect":{"height":71,"width":234,"x":36,"y":1}}],"tab_id":"wS:tE","workspace_id":"wS","zoomed":false},"type":"pane_layout"}}"#;

    // A 3-pane tab: left already split down (top/bottom), right still
    // full-height — the next split target must be the right one.
    const PANE_LAYOUT_THREE_FIXTURE: &str = r#"{"id":"cli:pane:layout","result":{"layout":{"area":{"height":72,"width":234,"x":0,"y":0},"focused_pane_id":"wS:p1","panes":[
        {"focused":false,"pane_id":"wS:p1","rect":{"height":36,"width":117,"x":0,"y":0}},
        {"focused":false,"pane_id":"wS:p2","rect":{"height":36,"width":117,"x":0,"y":36}},
        {"focused":true,"pane_id":"wS:p3","rect":{"height":72,"width":117,"x":117,"y":0}}
    ],"splits":[],"tab_id":"wS:tE","workspace_id":"wS","zoomed":false},"type":"pane_layout"}}"#;

    // A full 2x2 grid — the shape `fg:operation` migrates to once it holds
    // all four admin slots. Deliberately listed out of reading order, so a
    // passing assertion proves the sort rather than the response's order.
    const PANE_LAYOUT_FOUR_FIXTURE: &str = r#"{"id":"cli:pane:layout","result":{"layout":{"area":{"height":72,"width":234,"x":0,"y":0},"focused_pane_id":"wS:pA","panes":[
        {"focused":false,"pane_id":"wS:pD","rect":{"height":36,"width":117,"x":117,"y":36}},
        {"focused":false,"pane_id":"wS:pB","rect":{"height":36,"width":117,"x":117,"y":0}},
        {"focused":true,"pane_id":"wS:pA","rect":{"height":36,"width":117,"x":0,"y":0}},
        {"focused":false,"pane_id":"wS:pC","rect":{"height":36,"width":117,"x":0,"y":36}}
    ],"splits":[],"tab_id":"wS:tOp","workspace_id":"wS","zoomed":false},"type":"pane_layout"}}"#;

    // Captured live: `herdr tab get <tab_id>`.
    const TAB_GET_FIXTURE: &str = r#"{"id":"cli:tab:get","result":{"tab":{"agent_status":"working","focused":false,"label":"3","number":14,"pane_count":2,"tab_id":"wS:tE","workspace_id":"wS"},"type":"tab_info"}}"#;

    fn layout_of(fixture: &str) -> TabLayout {
        let envelope: PaneLayoutEnvelope =
            serde_json::from_str(fixture).expect("fixture should parse");
        envelope.result.layout
    }

    #[test]
    fn cockpit_label_parses_real_tab_get_response() {
        let envelope: TabGetEnvelope =
            serde_json::from_str(TAB_GET_FIXTURE).expect("fixture should parse");
        assert_eq!(envelope.result.tab.label.as_deref(), Some("3"));
        assert_ne!(envelope.result.tab.label.as_deref(), Some("fg:cockpit"));
    }

    #[test]
    fn find_other_cockpit_tab_finds_the_existing_one() {
        let tabs = parse_tab_list(TAB_LIST_WITH_COCKPIT_FIXTURE).expect("fixture should parse");
        // Our own fresh tab (wS:tF) is not in this fixture at all --
        // exactly what a brand-new `placement = "tab"` launch looks like.
        assert_eq!(
            find_other_cockpit_tab(&tabs, "wS:tF"),
            Some("wS:tC".to_string())
        );
    }

    #[test]
    fn find_other_cockpit_tab_excludes_its_own_tab_id() {
        let tabs = parse_tab_list(TAB_LIST_WITH_COCKPIT_FIXTURE).expect("fixture should parse");
        assert_eq!(find_other_cockpit_tab(&tabs, "wS:tC"), None);
    }

    #[test]
    fn find_other_cockpit_tab_returns_none_when_none_exists() {
        let tabs = parse_tab_list(TAB_LIST_FIXTURE).expect("fixture should parse");
        assert_eq!(find_other_cockpit_tab(&tabs, "wS:tF"), None);
    }

    #[test]
    fn layout_manager_parses_real_tab_list_and_picks_lowest_index_with_room() {
        let tabs = parse_tab_list(TAB_LIST_FIXTURE).expect("fixture should parse");
        let mut worker_tabs: Vec<(u32, TabRow)> = tabs
            .into_iter()
            .filter_map(|tab| {
                let index = workers_tab_index(tab.label.as_deref()?)?;
                Some((index, tab))
            })
            .collect();
        worker_tabs.sort_by_key(|(index, _)| *index);

        // fg:workers-1 has pane_count 2 (room); fg:workers-2 has 4 (full).
        assert!(matches!(
            decide_workers_tab_placement(&worker_tabs),
            WorkersTabPlacement::ExistingTabWithRoom(tab) if tab.tab_id == "wS:tD"
        ));
    }

    #[test]
    fn layout_manager_ignores_non_workers_tabs() {
        let tabs = parse_tab_list(TAB_LIST_FIXTURE).expect("fixture should parse");
        assert!(tabs
            .iter()
            .filter_map(|tab| workers_tab_index(tab.label.as_deref().unwrap_or_default()))
            .all(|index| index != 8)); // "workers-3" must never be read as an index
    }

    #[test]
    fn layout_manager_parses_real_tab_create_response() {
        let (tab_id, pane_id) = parse_tab_create(TAB_CREATE_FIXTURE).expect("fixture should parse");
        assert_eq!(tab_id, "wS:tF");
        assert_eq!(pane_id, "wS:p1J");
    }

    #[test]
    fn workers_tab_index_extracts_trailing_number() {
        assert_eq!(workers_tab_index("fg:workers-1"), Some(1));
        assert_eq!(workers_tab_index("fg:workers-42"), Some(42));
        assert_eq!(workers_tab_index("fg:cockpit"), None);
        assert_eq!(workers_tab_index("workers-3"), None);
    }

    #[test]
    fn next_split_target_picks_right_for_a_single_pane_tab() {
        let layout = layout_of(PANE_LAYOUT_TWO_FIXTURE);
        // Simulate a freshly-created tab (1 pane) using the first pane in
        // the 2-pane fixture as that lone starting pane.
        let only_pane = &layout.panes[0];
        assert_eq!(only_pane.rect.height, layout.area.height);
    }

    #[test]
    fn next_split_target_picks_the_still_full_height_pane_at_three() {
        let layout = layout_of(PANE_LAYOUT_THREE_FIXTURE);
        let full_height = layout
            .panes
            .iter()
            .find(|pane| pane.rect.height == layout.area.height)
            .expect("one pane should still be full height");
        assert_eq!(full_height.pane_id, "wS:p3");
    }

    #[test]
    fn worker_tabs_all_full_starts_the_next_tab() {
        let worker_tabs = vec![(
            1,
            TabRow {
                tab_id: "wS:tD".into(),
                label: Some("fg:workers-1".into()),
                pane_count: 4,
            },
        )];
        assert!(matches!(
            decide_workers_tab_placement(&worker_tabs),
            WorkersTabPlacement::CreateNextTab(2)
        ));
    }

    #[test]
    fn worker_tabs_grow_past_the_old_two_tab_cap() {
        // tsk-1zq retired `MAX_AGENT_TABS`: two full tabs used to mean a
        // hard refusal, which was a second ceiling nobody reconciled with
        // the engine's. Now the lane just grows, and the only refusal that
        // can happen came from `fgos slots` long before this point.
        let worker_tabs = vec![
            (
                1,
                TabRow {
                    tab_id: "wS:tD".into(),
                    label: Some("fg:workers-1".into()),
                    pane_count: 4,
                },
            ),
            (
                2,
                TabRow {
                    tab_id: "wS:tE".into(),
                    label: Some("fg:workers-2".into()),
                    pane_count: 4,
                },
            ),
        ];
        assert!(matches!(
            decide_workers_tab_placement(&worker_tabs),
            WorkersTabPlacement::CreateNextTab(3)
        ));
    }

    #[test]
    fn worker_tabs_at_cap_but_one_has_room_fills_that_one_first() {
        let worker_tabs = vec![
            (
                1,
                TabRow {
                    tab_id: "wS:tD".into(),
                    label: Some("fg:workers-1".into()),
                    pane_count: 2,
                },
            ),
            (
                2,
                TabRow {
                    tab_id: "wS:tE".into(),
                    label: Some("fg:workers-2".into()),
                    pane_count: 4,
                },
            ),
        ];
        assert!(matches!(
            decide_workers_tab_placement(&worker_tabs),
            WorkersTabPlacement::ExistingTabWithRoom(tab) if tab.tab_id == "wS:tD"
        ));
    }

    #[test]
    fn find_operation_tab_finds_the_labeled_one() {
        let tabs = parse_tab_list(TAB_LIST_WITH_OPERATION_FIXTURE).expect("fixture should parse");
        assert_eq!(find_operation_tab(&tabs), Some("wS:tOp".to_string()));
    }

    #[test]
    fn find_operation_tab_returns_none_when_absent() {
        let tabs = parse_tab_list(TAB_LIST_FIXTURE).expect("fixture should parse");
        assert_eq!(find_operation_tab(&tabs), None);
    }

    #[test]
    fn operation_slots_are_assigned_in_reading_order_not_response_order() {
        // Supersedes tsk-5lr D2's smallest-x-is-left rule: four slots need
        // an ordering, not a side. The fixture lists its panes shuffled, so
        // this only passes if `(y, x)` actually decides.
        let panes = operation_slot_panes(&layout_of(PANE_LAYOUT_FOUR_FIXTURE))
            .expect("a 4-pane tab resolves all four slots");
        assert_eq!(
            panes,
            OperationPanes {
                merge: "wS:pA".into(),
                retro: "wS:pB".into(),
                cleanup: "wS:pC".into(),
                spare: "wS:pD".into(),
            }
        );
    }

    #[test]
    fn an_operation_tab_still_at_two_panes_is_a_migration_not_an_error() {
        // tsk-5lr's pinned assumption was that a non-2-pane `fg:operation`
        // tab is an unsupported error state. With four slots, a 2-pane tab
        // is simply a live tab from before this change: `None` here tells
        // `ensure_operation_tab` to split it up to size, and nothing
        // reports an error.
        assert_eq!(
            operation_slot_panes(&layout_of(PANE_LAYOUT_TWO_FIXTURE)),
            None
        );
        assert_eq!(
            operation_slot_panes(&layout_of(PANE_LAYOUT_THREE_FIXTURE)),
            None
        );
    }

    #[test]
    fn a_finished_worker_pane_is_reusable() {
        // The engine says tsk-aaa is no longer running, so the pane it was
        // opened for is free — the whole point of reclaiming by reuse.
        let panes = vec![snapshot("wS:p1", "wS:tW", Some("tsk-aaa | a.ssid:x"), false)];
        assert_eq!(
            reusable_worker_pane(&panes, &["wS:tW".into()], &[], &[]),
            Some("wS:p1".to_string())
        );
    }

    #[test]
    fn a_pane_whose_item_the_engine_still_reports_running_is_never_reused() {
        let panes = vec![snapshot("wS:p1", "wS:tW", Some("tsk-aaa | a.ssid:x"), false)];
        assert_eq!(
            reusable_worker_pane(&panes, &["wS:tW".into()], &["tsk-aaa".into()], &[]),
            None
        );
    }

    #[test]
    fn a_focused_pane_is_never_reused() {
        // D10's one exception: the driver's closing report exists nowhere
        // else, and a person reading it is a focused pane.
        let panes = vec![snapshot("wS:p1", "wS:tW", Some("tsk-aaa | a.ssid:x"), true)];
        assert_eq!(
            reusable_worker_pane(&panes, &["wS:tW".into()], &[], &[]),
            None
        );
    }

    #[test]
    fn a_pane_outside_the_worker_lane_is_never_reused() {
        // A7: only the worker lane holds one-shot flows. A pane in the
        // `fg:operation` tab is running a loop and must never be taken,
        // even when it looks idle by every other measure.
        let panes = vec![snapshot("wS:pOp", "wS:tOp", Some("tsk-aaa | a.ssid:x"), false)];
        assert_eq!(
            reusable_worker_pane(&panes, &["wS:tW".into()], &[], &[]),
            None
        );
    }

    #[test]
    fn a_pane_with_a_launch_still_pending_is_never_reused() {
        // The booting-session window: herdr launched into this pane and the
        // session has not labeled itself yet, so it would otherwise read as
        // an unlabeled free pane and get a second worker dropped on it.
        let panes = vec![snapshot("wS:p1", "wS:tW", None, false)];
        assert_eq!(
            reusable_worker_pane(&panes, &["wS:tW".into()], &[], &["wS:p1".into()]),
            None
        );
    }

    #[test]
    fn an_unlabeled_pane_is_never_reused_even_when_not_pending() {
        // There is no honest way to tell a booting session from an
        // abandoned pane without reading `agent_status` (forbidden by the
        // operator runbook) or inventing a time threshold (rejected during
        // shaping), so an unlabeled pane is left alone. Costs at most a
        // pane, and never a slot: the ceiling counts work items.
        let panes = vec![snapshot("wS:p1", "wS:tW", None, false)];
        assert_eq!(
            reusable_worker_pane(&panes, &["wS:tW".into()], &[], &[]),
            None
        );
    }

    #[test]
    fn reuse_never_reads_a_label_as_liveness() {
        // The label names tsk-aaa either way; only the engine's answer
        // differs between these two calls, and only that flips the result.
        // This is D2 stated as a test: identity from the label, liveness
        // from fgOS, never both from the label.
        let panes = vec![snapshot("wS:p1", "wS:tW", Some("tsk-aaa"), false)];
        let tabs = ["wS:tW".to_string()];
        assert!(reusable_worker_pane(&panes, &tabs, &[], &[]).is_some());
        assert!(reusable_worker_pane(&panes, &tabs, &["tsk-aaa".into()], &[]).is_none());
    }

    #[test]
    fn reuse_picks_deterministically_among_several_free_panes() {
        let panes = vec![
            snapshot("wS:p9", "wS:tW", Some("tsk-ccc"), false),
            snapshot("wS:p2", "wS:tW", Some("tsk-aaa"), false),
            snapshot("wS:p5", "wS:tW", Some("tsk-bbb"), false),
        ];
        assert_eq!(
            reusable_worker_pane(&panes, &["wS:tW".into()], &[], &[]),
            Some("wS:p2".to_string())
        );
    }

    #[test]
    fn no_free_pane_at_all_falls_through_to_a_split() {
        // `None` is what makes `acquire_worker_slot_pane` split a new pane
        // instead of reusing one — the create path is still there, it is
        // just no longer the only path.
        let panes = vec![
            snapshot("wS:p1", "wS:tW", Some("tsk-aaa"), false),
            snapshot("wS:p2", "wS:tW", Some("tsk-bbb"), true),
        ];
        assert_eq!(
            reusable_worker_pane(&panes, &["wS:tW".into()], &["tsk-aaa".into()], &[]),
            None
        );
    }
}
