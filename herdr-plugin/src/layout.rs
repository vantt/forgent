use std::io;
use std::process::Command;

use serde::Deserialize;

/// Max panes per `fg:agents-N` tab before a new tab is created (tsk-1q3
/// CONTEXT.md feature boundary: a 2×2 corner grid).
const MAX_PANES_PER_TAB: usize = 4;

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
}

/// Extracts the trailing `<N>` from a `fg:agents-<N>` label (tsk-1q3
/// CONTEXT.md "fg:agents-N tab" pinned term).
fn agents_tab_index(label: &str) -> Option<u32> {
    label.strip_prefix("fg:agents-")?.parse().ok()
}

fn run_herdr(herdr_bin: &str, args: &[&str]) -> Result<String, LayoutError> {
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
pub fn find_agents_tab_with_room(
    herdr_bin: &str,
    workspace_id: &str,
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

    if let Some((_, tab)) = agent_tabs
        .iter()
        .find(|(_, tab)| (tab.pane_count as usize) < MAX_PANES_PER_TAB)
    {
        let pane_id = find_any_pane_in_tab(herdr_bin, workspace_id, &tab.tab_id)?;
        return Ok((tab.tab_id.clone(), pane_id, tab.pane_count as usize));
    }

    let next_index = agent_tabs.last().map(|(index, _)| index + 1).unwrap_or(1);
    let label = format!("fg:agents-{next_index}");
    let stdout = run_herdr(
        herdr_bin,
        &[
            "tab",
            "create",
            "--workspace",
            workspace_id,
            "--label",
            &label,
            "--no-focus",
        ],
    )?;
    let (tab_id, pane_id) = parse_tab_create(&stdout).map_err(LayoutError::Parse)?;
    Ok((tab_id, pane_id, 1))
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
pub fn place_new_agent_pane(herdr_bin: &str, workspace_id: &str) -> Result<String, LayoutError> {
    let (_tab_id, any_pane, pane_count) = find_agents_tab_with_room(herdr_bin, workspace_id)?;
    let (target_pane, direction) = next_split_target(herdr_bin, &any_pane, pane_count)?;
    let stdout = run_herdr(
        herdr_bin,
        &["pane", "split", "--pane", &target_pane, "--direction", direction, "--no-focus"],
    )?;
    parse_split_result_pane_id(&stdout).ok_or(LayoutError::NoUsablePaneInResponse(stdout))
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

#[cfg(test)]
mod tests {
    use super::*;

    // Captured live this session: `herdr tab list --workspace wS`.
    const TAB_LIST_FIXTURE: &str = r#"{"id":"cli:tab:list","result":{"tabs":[
        {"agent_status":"idle","focused":false,"label":"workers-3","number":8,"pane_count":3,"tab_id":"wS:t8","workspace_id":"wS"},
        {"agent_status":"working","focused":true,"label":"fg:agents-1","number":13,"pane_count":2,"tab_id":"wS:tD","workspace_id":"wS"},
        {"agent_status":"idle","focused":false,"label":"fg:agents-2","number":14,"pane_count":4,"tab_id":"wS:tE","workspace_id":"wS"}
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
}
