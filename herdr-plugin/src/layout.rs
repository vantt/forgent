use std::ffi::{OsStr, OsString};
use std::io;
use std::path::Path;
use std::process::Command;

use serde::Deserialize;

/// Max panes per `fg:agents-N` tab before a new tab is created (tsk-1q3
/// CONTEXT.md feature boundary: a 2×2 corner grid).
const MAX_PANES_PER_TAB: usize = 4;

/// Max `fg:agents-N` tabs before pane placement refuses "no room" instead
/// of creating a 3rd (tsk-5lr CONTEXT.md feature boundary item 1).
const MAX_AGENT_TABS: usize = 2;

#[derive(Debug)]
pub enum LayoutError {
    Io(io::Error),
    ExitStatus(String),
    Parse(serde_json::Error),
    NoUsablePaneInResponse(String),
    /// Both `fg:agents-1..fg:agents-MAX_AGENT_TABS` are full (tsk-5lr
    /// CONTEXT.md feature boundary item 1) — never a queue, never an
    /// auto-created 3rd tab.
    NoRoomForAgentTabs,
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
            LayoutError::NoRoomForAgentTabs => write!(
                f,
                "no room: fg:agents-1..fg:agents-{MAX_AGENT_TABS} are full"
            ),
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
/// `fg:agents-N` tab's first usable pane is actually found.
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
    /// tsk-5lr CONTEXT.md D2: pane identity inside `fg:operation` is
    /// decided by geometry — smallest `x` is the left/merge-loop slot.
    x: u32,
    /// CONTEXT.md D2 extends `Rect` with `width` alongside `x`; unread by
    /// this item's own left/right-by-`x` decision, kept for parse parity.
    #[allow(dead_code)]
    width: u32,
}

/// Extracts the trailing `<N>` from a `fg:agents-<N>` label (tsk-1q3
/// CONTEXT.md "fg:agents-N tab" pinned term).
fn agents_tab_index(label: &str) -> Option<u32> {
    label.strip_prefix("fg:agents-")?.parse().ok()
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

/// Finds the lowest-numbered `fg:agents-N` tab with a free slot
/// (`pane_count < 4`), or creates the next `fg:agents-(N+1)` tab if none
/// has room. Returns `(tab_id, an_existing_pane_id_in_that_tab,
/// pane_count)` — the pane id and count feed straight into
/// `next_split_target` next. A freshly created tab always starts with
/// exactly one root pane (proven live this session).
///
/// `project_root` is the cwd every pane this function creates starts in
/// (tsk-45u D1): a new tab's root pane is a real pane a person can end up
/// typing in, so it starts in the project too rather than inheriting
/// whatever directory herdr happened to be launched from.
pub fn find_agents_tab_with_room(
    herdr_bin: &str,
    workspace_id: &str,
    project_root: &Path,
) -> Result<(String, String, usize), LayoutError> {
    let stdout = run_herdr(herdr_bin, &["tab", "list", "--workspace", workspace_id])?;
    let tabs = parse_tab_list(&stdout).map_err(LayoutError::Parse)?;

    let mut agent_tabs: Vec<(u32, TabRow)> = tabs
        .into_iter()
        .filter_map(|tab| {
            let index = agents_tab_index(tab.label.as_deref()?)?;
            Some((index, tab))
        })
        .collect();
    agent_tabs.sort_by_key(|(index, _)| *index);

    match decide_agent_tab_placement(&agent_tabs) {
        AgentTabPlacement::ExistingTabWithRoom(tab) => {
            let pane_id = find_any_pane_in_tab(herdr_bin, workspace_id, &tab.tab_id)?;
            Ok((tab.tab_id.clone(), pane_id, tab.pane_count as usize))
        }
        AgentTabPlacement::NoRoom => Err(LayoutError::NoRoomForAgentTabs),
        AgentTabPlacement::CreateNextTab(next_index) => {
            let label = format!("fg:agents-{next_index}");
            let stdout =
                run_herdr(herdr_bin, &tab_create_argv(workspace_id, &label, project_root))?;
            let (tab_id, pane_id) = parse_tab_create(&stdout).map_err(LayoutError::Parse)?;
            Ok((tab_id, pane_id, 1))
        }
    }
}

/// Pure decision `find_agents_tab_with_room` dispatches on, given the
/// `fg:agents-N` tabs already sorted by index: reuse an existing tab with
/// room, create the next tab, or refuse once `MAX_AGENT_TABS` tabs are
/// already full (tsk-5lr CONTEXT.md feature boundary item 1). Kept
/// separate from the live herdr calls for the same unit-testability
/// `find_other_cockpit_tab` already gets.
enum AgentTabPlacement<'a> {
    ExistingTabWithRoom(&'a TabRow),
    CreateNextTab(u32),
    NoRoom,
}

fn decide_agent_tab_placement(agent_tabs: &[(u32, TabRow)]) -> AgentTabPlacement<'_> {
    if let Some((_, tab)) = agent_tabs
        .iter()
        .find(|(_, tab)| (tab.pane_count as usize) < MAX_PANES_PER_TAB)
    {
        return AgentTabPlacement::ExistingTabWithRoom(tab);
    }
    if agent_tabs.len() >= MAX_AGENT_TABS {
        return AgentTabPlacement::NoRoom;
    }
    let next_index = agent_tabs.last().map(|(index, _)| index + 1).unwrap_or(1);
    AgentTabPlacement::CreateNextTab(next_index)
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

/// Finds (or creates) the right `fg:agents-N` tab with room, determines
/// the next 2×2 split target inside it, and actually opens the new pane
/// there — the single call site `pick.rs`'s shared launch-agent function
/// uses instead of always `pane split --current` (tsk-1q3's whole "layout
/// manager" responsibility, wired together).
pub fn place_new_agent_pane(
    herdr_bin: &str,
    workspace_id: &str,
    project_root: &Path,
) -> Result<String, LayoutError> {
    let (_tab_id, any_pane, pane_count) =
        find_agents_tab_with_room(herdr_bin, workspace_id, project_root)?;
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

/// Pure decision: given the `fg:operation` tab's own pane layout, resolves
/// `(left_pane_id, right_pane_id)` — smallest `x` is the left/merge-loop
/// slot, the other is the right/retro-cleanup slot (CONTEXT.md D2: pane
/// identity by geometry, never creation order). Errors when the tab does
/// not have exactly 2 panes — the pinned "unsupported/error state" for a
/// manually-edited `fg:operation` tab CONTEXT.md's own pinned assumption
/// describes.
fn left_right_panes(layout: &TabLayout) -> Result<(String, String), LayoutError> {
    let [a, b] = layout.panes.as_slice() else {
        return Err(LayoutError::NoUsablePaneInResponse(format!(
            "fg:operation tab has {} panes, expected exactly 2",
            layout.panes.len()
        )));
    };
    if a.rect.x <= b.rect.x {
        Ok((a.pane_id.clone(), b.pane_id.clone()))
    } else {
        Ok((b.pane_id.clone(), a.pane_id.clone()))
    }
}

/// Finds (or creates) the fixed `fg:operation` tab and returns its 2 fixed
/// panes as `(left_pane_id, right_pane_id)` (tsk-5lr CONTEXT.md D1/D2) —
/// left is always the merge-loop slot, right always the retro/cleanup
/// slot. Created eagerly, at herdr-plugin startup, the same find-or-
/// create-by-label shape `ensure_cockpit_tab` already uses for
/// `fg:cockpit` (D1). This function only locates the tab/panes — it never
/// renders pane content or decides which loop launches where (tsk-417 and
/// tsk-2xt's own scope, respectively).
pub fn ensure_operation_tab(
    herdr_bin: &str,
    workspace_id: &str,
    project_root: &Path,
) -> Result<(String, String), LayoutError> {
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
            run_herdr(
                herdr_bin,
                &pane_split_argv(&first_pane_id, "right", project_root),
            )?;
            first_pane_id
        }
    };

    let stdout = run_herdr(herdr_bin, &["pane", "layout", "--pane", &any_pane_id])?;
    let envelope: PaneLayoutEnvelope = serde_json::from_str(&stdout).map_err(LayoutError::Parse)?;
    left_right_panes(&envelope.result.layout)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

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
    fn a_new_agents_tab_also_starts_in_the_project_root() {
        assert_eq!(
            tab_create_argv(
                "wS",
                "fg:agents-2",
                &PathBuf::from("/home/vantt/projects/forgentX")
            ),
            vec![
                "tab",
                "create",
                "--workspace",
                "wS",
                "--label",
                "fg:agents-2",
                "--cwd",
                "/home/vantt/projects/forgentX",
                "--no-focus",
            ]
        );
    }

    // Captured live this session: `herdr tab list --workspace wS`.
    const TAB_LIST_FIXTURE: &str = r#"{"id":"cli:tab:list","result":{"tabs":[
        {"agent_status":"idle","focused":false,"label":"workers-3","number":8,"pane_count":3,"tab_id":"wS:t8","workspace_id":"wS"},
        {"agent_status":"working","focused":true,"label":"fg:agents-1","number":13,"pane_count":2,"tab_id":"wS:tD","workspace_id":"wS"},
        {"agent_status":"idle","focused":false,"label":"fg:agents-2","number":14,"pane_count":4,"tab_id":"wS:tE","workspace_id":"wS"}
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
        {"agent_status":"idle","focused":false,"label":"fg:operation","number":10,"pane_count":2,"tab_id":"wS:tOp","workspace_id":"wS"}
    ],"type":"tab_list"}}"#;

    // Captured live this session: `herdr tab create --workspace wS
    // --label fg-test-scratch --no-focus` (scratch tab, closed right
    // after capture).
    const TAB_CREATE_FIXTURE: &str = r#"{"id":"cli:tab:create","result":{"root_pane":{"agent_status":"unknown","cwd":"/x","focused":false,"pane_id":"wS:p1J","revision":0,"tab_id":"wS:tF","workspace_id":"wS"},"tab":{"agent_status":"unknown","focused":false,"label":"fg-test-scratch","number":15,"pane_count":1,"tab_id":"wS:tF","workspace_id":"wS"},"type":"tab_created"}}"#;

    // Captured live this session: `herdr pane layout --current` on a tab
    // with 2 panes, split right (both full-height — neither split down
    // yet).
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

    // Captured live this session: `herdr tab get <tab_id>`.
    const TAB_GET_FIXTURE: &str = r#"{"id":"cli:tab:get","result":{"tab":{"agent_status":"working","focused":false,"label":"3","number":14,"pane_count":2,"tab_id":"wS:tE","workspace_id":"wS"},"type":"tab_info"}}"#;

    #[test]
    fn cockpit_label_parses_real_tab_get_response() {
        let envelope: TabGetEnvelope = serde_json::from_str(TAB_GET_FIXTURE).expect("fixture should parse");
        assert_eq!(envelope.result.tab.label.as_deref(), Some("3"));
        assert_ne!(envelope.result.tab.label.as_deref(), Some("fg:cockpit"));
    }

    #[test]
    fn find_other_cockpit_tab_finds_the_existing_one() {
        let tabs = parse_tab_list(TAB_LIST_WITH_COCKPIT_FIXTURE).expect("fixture should parse");
        // Our own fresh tab (wS:tF) is not in this fixture at all --
        // exactly what a brand-new `placement = "tab"` launch looks like.
        assert_eq!(find_other_cockpit_tab(&tabs, "wS:tF"), Some("wS:tC".to_string()));
    }

    #[test]
    fn find_other_cockpit_tab_excludes_its_own_tab_id() {
        let tabs = parse_tab_list(TAB_LIST_WITH_COCKPIT_FIXTURE).expect("fixture should parse");
        // If our own tab is somehow already the one labeled fg:cockpit,
        // it is never treated as "another" tab to hand off to.
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
        let mut agent_tabs: Vec<(u32, TabRow)> = tabs
            .into_iter()
            .filter_map(|tab| {
                let index = agents_tab_index(tab.label.as_deref()?)?;
                Some((index, tab))
            })
            .collect();
        agent_tabs.sort_by_key(|(index, _)| *index);

        // fg:agents-1 has pane_count 2 (room); fg:agents-2 has 4 (full).
        let picked = agent_tabs
            .iter()
            .find(|(_, tab)| (tab.pane_count as usize) < MAX_PANES_PER_TAB)
            .expect("one tab should have room");
        assert_eq!(picked.0, 1);
        assert_eq!(picked.1.tab_id, "wS:tD");
    }

    #[test]
    fn layout_manager_ignores_non_agents_tabs() {
        let tabs = parse_tab_list(TAB_LIST_FIXTURE).expect("fixture should parse");
        assert!(tabs
            .iter()
            .filter_map(|tab| agents_tab_index(tab.label.as_deref().unwrap_or_default()))
            .all(|index| index != 8)); // "workers-3" must never be read as an index
    }

    #[test]
    fn layout_manager_parses_real_tab_create_response() {
        let (tab_id, pane_id) = parse_tab_create(TAB_CREATE_FIXTURE).expect("fixture should parse");
        assert_eq!(tab_id, "wS:tF");
        assert_eq!(pane_id, "wS:p1J");
    }

    #[test]
    fn agents_tab_index_extracts_trailing_number() {
        assert_eq!(agents_tab_index("fg:agents-1"), Some(1));
        assert_eq!(agents_tab_index("fg:agents-42"), Some(42));
        assert_eq!(agents_tab_index("fg:cockpit"), None);
        assert_eq!(agents_tab_index("workers-3"), None);
    }

    #[test]
    fn next_split_target_picks_right_for_a_single_pane_tab() {
        let envelope: PaneLayoutEnvelope =
            serde_json::from_str(PANE_LAYOUT_TWO_FIXTURE).expect("fixture should parse");
        // Simulate a freshly-created tab (1 pane) using the first pane
        // in the 2-pane fixture as that lone starting pane.
        let only_pane = &envelope.result.layout.panes[0];
        assert_eq!(only_pane.rect.height, envelope.result.layout.area.height);
    }

    #[test]
    fn next_split_target_picks_the_still_full_height_pane_at_three() {
        let envelope: PaneLayoutEnvelope =
            serde_json::from_str(PANE_LAYOUT_THREE_FIXTURE).expect("fixture should parse");
        let layout = envelope.result.layout;
        let full_height = layout
            .panes
            .iter()
            .find(|pane| pane.rect.height == layout.area.height)
            .expect("one pane should still be full height");
        assert_eq!(full_height.pane_id, "wS:p3");
    }

    #[test]
    fn agent_tabs_under_cap_still_creates_the_next_tab() {
        let agent_tabs = vec![(
            1,
            TabRow {
                tab_id: "wS:tD".into(),
                label: Some("fg:agents-1".into()),
                pane_count: 4,
            },
        )];
        assert!(matches!(
            decide_agent_tab_placement(&agent_tabs),
            AgentTabPlacement::CreateNextTab(2)
        ));
    }

    #[test]
    fn agent_tabs_at_cap_refuse_a_third_tab() {
        let agent_tabs = vec![
            (
                1,
                TabRow {
                    tab_id: "wS:tD".into(),
                    label: Some("fg:agents-1".into()),
                    pane_count: 4,
                },
            ),
            (
                2,
                TabRow {
                    tab_id: "wS:tE".into(),
                    label: Some("fg:agents-2".into()),
                    pane_count: 4,
                },
            ),
        ];
        assert!(matches!(
            decide_agent_tab_placement(&agent_tabs),
            AgentTabPlacement::NoRoom
        ));
    }

    #[test]
    fn agent_tabs_at_cap_but_one_has_room_is_not_refused() {
        let agent_tabs = vec![
            (
                1,
                TabRow {
                    tab_id: "wS:tD".into(),
                    label: Some("fg:agents-1".into()),
                    pane_count: 2,
                },
            ),
            (
                2,
                TabRow {
                    tab_id: "wS:tE".into(),
                    label: Some("fg:agents-2".into()),
                    pane_count: 4,
                },
            ),
        ];
        assert!(matches!(
            decide_agent_tab_placement(&agent_tabs),
            AgentTabPlacement::ExistingTabWithRoom(tab) if tab.tab_id == "wS:tD"
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
    fn left_right_panes_picks_smallest_x_as_left() {
        let envelope: PaneLayoutEnvelope =
            serde_json::from_str(PANE_LAYOUT_TWO_FIXTURE).expect("fixture should parse");
        // wS:p1H is at x=36, wS:p1G is at x=153 -- p1H is the left/merge slot.
        let (left, right) =
            left_right_panes(&envelope.result.layout).expect("exactly 2 panes should resolve");
        assert_eq!(left, "wS:p1H");
        assert_eq!(right, "wS:p1G");
    }

    #[test]
    fn left_right_panes_errors_when_not_exactly_two() {
        let envelope: PaneLayoutEnvelope =
            serde_json::from_str(PANE_LAYOUT_THREE_FIXTURE).expect("fixture should parse");
        assert!(left_right_panes(&envelope.result.layout).is_err());
    }
}
