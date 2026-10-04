use std::collections::HashMap;
use std::io;
use std::process::Command;

use serde::Deserialize;

use crate::pick::is_valid_id;
use crate::ports::PaneRegistry;

/// The two pane-identity fields tsk-4zo D1 requires — no `workspace_id`
/// field, since scan scope is the dashboard's own workspace by
/// construction (`HerdrPaneScanner` below is already scoped to one).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PaneIdentity {
    pub pane_id: String,
    pub tab_id: String,
}

/// One pane exactly as `herdr pane list` reports it (tsk-1zq). Kept whole
/// rather than pre-reduced to a task-id map, because two different
/// consumers now fold the same scan: the "In process" panel wants
/// `task_id_map` below, and the worker lane's reuse decision
/// (`layout::reusable_worker_pane`) wants `focused`/`tab_id`/`label` too.
///
/// `focused` is chrome-level data herdr already returns on the same row —
/// legitimate to read (D10-2), unlike `agent_status`, which
/// `docs/operator-runbook-herdr-cockpit.md`'s Hard rule forbids outright.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PaneSnapshot {
    pub pane_id: String,
    pub tab_id: String,
    pub label: Option<String>,
    pub focused: bool,
}

#[derive(Debug)]
pub enum PaneScanError {
    Io(io::Error),
    ExitStatus(String),
    Parse(serde_json::Error),
}

impl std::fmt::Display for PaneScanError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PaneScanError::Io(err) => write!(f, "herdr CLI spawn failed: {err}"),
            PaneScanError::ExitStatus(detail) => write!(f, "herdr CLI exited non-zero: {detail}"),
            PaneScanError::Parse(err) => write!(f, "herdr CLI output parse failed: {err}"),
        }
    }
}

impl From<io::Error> for PaneScanError {
    fn from(err: io::Error) -> Self {
        PaneScanError::Io(err)
    }
}

/// One row from `herdr pane list --workspace <id>`'s real `result.panes`
/// array — `label` is genuinely optional (a live capture showed panes
/// with no `label` key at all: never renamed by `/fgOS:pick`'s flow).
/// `focused` defaults to `false` when absent for the same reason.
#[derive(Debug, Deserialize)]
struct PaneRow {
    pane_id: String,
    tab_id: String,
    label: Option<String>,
    #[serde(default)]
    focused: bool,
}

#[derive(Debug, Deserialize)]
struct PaneListResult {
    panes: Vec<PaneRow>,
}

#[derive(Debug, Deserialize)]
struct PaneListEnvelope {
    result: PaneListResult,
}

/// Reserved prefix for auto-launch guard labels (tsk-2ja's
/// `pick::auto_discover_pane_label`, and any future `fgos-auto-*` sibling)
/// — a label in this namespace is never a real task id, even though it
/// syntactically passes `is_valid_id` (hyphenated lowercase segments are a
/// legal id shape). `extract_task_id` below carves it out explicitly so
/// this map never gets a phantom entry for a pane that isn't tracking any
/// real work item.
const AUTO_LAUNCH_LABEL_PREFIX: &str = "fgos-auto-";

/// Extracts the leading `<taskid>` segment from a pane label built per the
/// locked convention (`docs/history/fgos-terminal-pane-rename/CONTEXT.md`
/// D4: `<taskid> | fg.ssid:<v> | a.ssid:<v>`, unresolved segments
/// dropped) — splits on `" | "` and validates the leading segment against
/// fgOS's own id grammar (`pick::is_valid_id`), never trusting an
/// arbitrary leading substring as a task-id. Rejects the reserved
/// `fgos-auto-*` namespace first (tsk-2ja) — those labels pass
/// `is_valid_id`'s syntax check but are never real task ids.
pub(crate) fn extract_task_id(label: &str) -> Option<&str> {
    let leading = label.split(" | ").next()?;
    if leading.starts_with(AUTO_LAUNCH_LABEL_PREFIX) {
        return None;
    }
    is_valid_id(leading).then_some(leading)
}

/// Parses `herdr pane list --workspace <id>`'s real response shape
/// (`{"id":..., "result":{"panes":[...], "type":"pane_list"}}`, captured
/// live) into one snapshot per pane, losing nothing — the two folds
/// below each take what they need from it.
pub fn parse_pane_list(json: &str) -> Result<Vec<PaneSnapshot>, serde_json::Error> {
    let envelope: PaneListEnvelope = serde_json::from_str(json)?;
    Ok(envelope
        .result
        .panes
        .into_iter()
        .map(|pane| PaneSnapshot {
            pane_id: pane.pane_id,
            tab_id: pane.tab_id,
            label: pane.label,
            focused: pane.focused,
        })
        .collect())
}

/// Task-id → pane identity, for the "In process" panel's jump-to-pane
/// action (tsk-4zo D1, tsk-1eu D2). Skips any pane with no `label` or a
/// leading segment that isn't a valid fgOS task-id: only labeled,
/// agent-launched panes are tracked.
///
/// The label answers "which item was this pane opened for" and nothing
/// else — pure identity, written by the session itself through T3's
/// capability-gated helper (D5). Whether that item is still running is a
/// question only the engine answers (D2); no caller of this map may infer
/// liveness from the fact that an entry exists.
pub fn task_id_map(panes: &[PaneSnapshot]) -> HashMap<String, PaneIdentity> {
    let mut map = HashMap::new();
    for pane in panes {
        let Some(label) = &pane.label else { continue };
        let Some(task_id) = extract_task_id(label) else {
            continue;
        };
        map.insert(
            task_id.to_string(),
            PaneIdentity {
                pane_id: pane.pane_id.clone(),
                tab_id: pane.tab_id.clone(),
            },
        );
    }
    map
}

/// Guard check for a fixed, non-id-shaped pane title — the admin lane's
/// own `fgos-auto-merge`/`fgos-auto-retro`/`fgos-auto-cleanup` slot
/// titles (tsk-57q), which the adapter writes once per fixed pane and
/// which never change per item. `task_id_map` above only ever returns
/// id-shaped labels (`extract_task_id` rejects the whole `fgos-auto-*`
/// namespace), so a fixed literal title needs this separate exact-match
/// check instead.
///
/// tsk-1zq removed the one worker-lane caller (`fgos-auto-discover`):
/// there, this was a launch mutex, i.e. a label carrying orchestrator
/// state, which is precisely what D2 forbids. In the admin lane the
/// label names a fixed slot rather than a running item, which is the
/// distinction DISCUSSION.md §6 draws when it assigns admin-lane labels
/// to the adapter and execution-lane labels to the session itself.
pub fn pane_has_label(json: &str, label: &str) -> Result<bool, serde_json::Error> {
    let envelope: PaneListEnvelope = serde_json::from_str(json)?;
    Ok(envelope
        .result
        .panes
        .iter()
        .any(|pane| pane.label.as_deref() == Some(label)))
}

fn run_pane_list(herdr_bin: &str, workspace_id: &str) -> Result<String, PaneScanError> {
    let output = Command::new(herdr_bin)
        .args(["pane", "list", "--workspace", workspace_id])
        .output()?;
    if !output.status.success() {
        return Err(PaneScanError::ExitStatus(
            String::from_utf8_lossy(&output.stderr).to_string(),
        ));
    }
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

/// The `PaneRegistry` adapter (tsk-4zo D1): the concrete herdr-CLI
/// implementation of the pane-scan port, scoped to one workspace (the
/// dashboard's own). Already the port/adapter shape tsk-3t9-2 asked for —
/// `app.rs` only ever consumes pane tracking through `&dyn PaneRegistry`
/// (`refresh_pane_state`), never this concrete struct directly; only the
/// composition root (`main.rs`) constructs it. Built this way from the
/// start since `tsk-3t9-1`'s foundation had already merged, so there was
/// nothing left for tsk-3t9-2 to refactor.
pub struct HerdrPaneScanner {
    pub herdr_bin: String,
    pub workspace_id: String,
}

impl PaneRegistry for HerdrPaneScanner {
    fn scan_panes(&self) -> Result<Vec<PaneSnapshot>, PaneScanError> {
        let stdout = run_pane_list(&self.herdr_bin, &self.workspace_id)?;
        parse_pane_list(&stdout).map_err(PaneScanError::Parse)
    }

    fn has_labeled_pane(&self, label: &str) -> Result<bool, PaneScanError> {
        let stdout = run_pane_list(&self.herdr_bin, &self.workspace_id)?;
        pane_has_label(&stdout, label).map_err(PaneScanError::Parse)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Captured live this session: `herdr pane list --workspace wS` from
    // inside this very session's own herdr-managed pane. 7 real panes:
    // 2 with no `label` key at all, 5 with a 2-segment label
    // (`taskid | a.ssid:<v>` — no `fg.ssid`, dropped because unresolved
    // in these live sessions), never a 3-segment label in this capture.
    const PANE_LIST_FIXTURE: &str = r#"{"id":"cli:pane:list","result":{"panes":[
        {"agent":"claude","agent_status":"idle","cwd":"/x","focused":false,
         "pane_id":"wS:pW","tab_id":"wS:t8","workspace_id":"wS",
         "label":"tsk-n4i-2 | a.ssid:afffd875-be95-41cb-8eb2-fa2cf1276eb5"},
        {"agent":"claude","agent_status":"idle","cwd":"/x","focused":false,
         "pane_id":"wS:p1D","tab_id":"wS:t8","workspace_id":"wS"},
        {"agent":"claude","agent_status":"working","cwd":"/x","focused":false,
         "pane_id":"wS:p1C","tab_id":"wS:tD","workspace_id":"wS",
         "label":"tsk-4zo | a.ssid:01d4c06d-70dc-4e06-a4b0-2bcf85668f28"}
    ],"type":"pane_list"}}"#;

    fn map_of(json: &str) -> HashMap<String, PaneIdentity> {
        task_id_map(&parse_pane_list(json).expect("fixture should parse"))
    }

    #[test]
    fn pane_registry_parses_real_captured_pane_list_shape() {
        let map = map_of(PANE_LIST_FIXTURE);
        assert_eq!(map.len(), 2);
        assert_eq!(
            map.get("tsk-n4i-2"),
            Some(&PaneIdentity {
                pane_id: "wS:pW".into(),
                tab_id: "wS:t8".into(),
            })
        );
        assert_eq!(
            map.get("tsk-4zo"),
            Some(&PaneIdentity {
                pane_id: "wS:p1C".into(),
                tab_id: "wS:tD".into(),
            })
        );
    }

    #[test]
    fn pane_registry_skips_panes_with_no_label() {
        let map = map_of(PANE_LIST_FIXTURE);
        // wS:p1D carries no `label` key at all — must never appear.
        assert!(!map.values().any(|identity| identity.pane_id == "wS:p1D"));
    }

    #[test]
    fn pane_registry_extracts_taskid_from_two_segment_label() {
        // The real, live-observed shape: no fg.ssid segment at all.
        assert_eq!(
            extract_task_id("tsk-4zo | a.ssid:01d4c06d-70dc-4e06-a4b0-2bcf85668f28"),
            Some("tsk-4zo")
        );
    }

    #[test]
    fn pane_registry_extracts_taskid_from_three_segment_label() {
        assert_eq!(
            extract_task_id("tsk-62x-1 | fg.ssid:649e49f0-1ea5 | a.ssid:649e49f0-1ea5"),
            Some("tsk-62x-1")
        );
    }

    #[test]
    fn pane_registry_extracts_taskid_from_bare_taskid_label() {
        assert_eq!(extract_task_id("tsk-19y"), Some("tsk-19y"));
    }

    #[test]
    fn pane_registry_rejects_a_leading_segment_that_is_not_a_valid_taskid() {
        // A pane manually renamed by a person to something that doesn't
        // match fgOS's own id grammar (uppercase, here) must never be
        // mistaken for a task-id — mirrors pick.rs's own grammar tests.
        assert_eq!(extract_task_id("Reviewer | a.ssid:abc"), None);
        assert_eq!(extract_task_id(""), None);
    }

    // Fixture for the auto-merge/retro/cleanup launcher's own fixed-title
    // guard (tsk-57q) — one pane carries exactly the fixed, non-id-shaped
    // label `extract_task_id` would silently drop.
    const FIXED_LABEL_PANE_LIST_FIXTURE: &str = r#"{"id":"cli:pane:list","result":{"panes":[
        {"agent":"claude","agent_status":"working","cwd":"/x","focused":false,
         "pane_id":"wS:pOpL","tab_id":"wS:tOp","workspace_id":"wS",
         "label":"fgos-auto-merge"},
        {"agent":"claude","agent_status":"idle","cwd":"/x","focused":false,
         "pane_id":"wS:pOpR","tab_id":"wS:tOp","workspace_id":"wS"}
    ],"type":"pane_list"}}"#;

    #[test]
    fn pane_has_label_finds_an_exact_fixed_title_match() {
        assert!(
            pane_has_label(FIXED_LABEL_PANE_LIST_FIXTURE, "fgos-auto-merge")
                .expect("fixture should parse")
        );
    }

    #[test]
    fn pane_has_label_is_false_when_no_pane_carries_that_exact_title() {
        assert!(
            !pane_has_label(FIXED_LABEL_PANE_LIST_FIXTURE, "fgos-auto-retro")
                .expect("fixture should parse")
        );
    }

    #[test]
    fn pane_has_label_ignores_panes_with_no_label_at_all() {
        // wS:pOpR carries no label — must never be mistaken for a match.
        assert!(
            !pane_has_label(FIXED_LABEL_PANE_LIST_FIXTURE, "")
                .expect("fixture should parse")
        );
    }

    #[test]
    fn is_valid_id_s_grammar_happens_to_accept_the_fixed_operation_titles_too() {
        // `is_valid_id`'s grammar (hyphen-joined lowercase-alnum segments,
        // `pick.rs:47-67`) is not tied to any `tsk-`-style prefix, so
        // `fgos-auto-merge` etc. structurally pass it too — this is a
        // pre-existing property of the shared id grammar. It no longer
        // means these titles leak into `parse_pane_list`'s map (next
        // test): `extract_task_id` explicitly rejects the whole
        // `fgos-auto-*` namespace (tsk-2ja's `AUTO_LAUNCH_LABEL_PREFIX`,
        // closing the gap this test originally documented as a known,
        // unaddressed limitation). `pane_has_label` itself never depended
        // on this either way — it matches the exact literal label
        // regardless of shape.
        assert!(crate::pick::is_valid_id("fgos-auto-merge"));
        assert!(crate::pick::is_valid_id("fgos-auto-retro"));
        assert!(crate::pick::is_valid_id("fgos-auto-cleanup"));
    }

    #[test]
    fn pane_has_label_is_additive_and_extract_task_id_no_longer_matches_these_titles() {
        // Corrected during the tsk-2ja/tsk-57q merge: `extract_task_id`
        // now rejects the reserved `fgos-auto-*` namespace outright (see
        // `extract_task_id_rejects_the_reserved_auto_launch_label_namespace`
        // below), so `fgos-auto-merge` no longer parses as a bogus task id
        // — `pane_has_label` remains a second, independent check, never a
        // replacement for it, and its own exact-match result never
        // depended on what `extract_task_id` decided either way.
        let map = map_of(FIXED_LABEL_PANE_LIST_FIXTURE);
        assert!(
            !map.contains_key("fgos-auto-merge"),
            "the reserved fgos-auto-* namespace must never be read back as a task id"
        );
        assert!(
            pane_has_label(FIXED_LABEL_PANE_LIST_FIXTURE, "fgos-auto-merge")
                .expect("fixture should parse")
        );
    }

    #[test]
    fn extract_task_id_rejects_the_reserved_auto_launch_label_namespace() {
        // Syntactically id-shaped (passes `is_valid_id`) but must never
        // be read back as a real task id — tsk-2ja's own guard label.
        assert_eq!(extract_task_id("fgos-auto-discover-tsk-2ja"), None);
    }

    const AUTO_DISCOVER_PANE_FIXTURE: &str = r#"{"id":"cli:pane:list","result":{"panes":[
        {"agent":"claude","agent_status":"idle","cwd":"/x","focused":false,
         "pane_id":"wS:pZ","tab_id":"wS:t9","workspace_id":"wS",
         "label":"fgos-auto-discover-tsk-2ja"},
        {"agent":"claude","agent_status":"idle","cwd":"/x","focused":false,
         "pane_id":"wS:pW","tab_id":"wS:t8","workspace_id":"wS",
         "label":"tsk-n4i-2 | a.ssid:afffd875-be95-41cb-8eb2-fa2cf1276eb5"}
    ],"type":"pane_list"}}"#;

    #[test]
    fn auto_discover_guard_detects_a_pane_by_its_exact_synthetic_label() {
        assert!(pane_has_label(AUTO_DISCOVER_PANE_FIXTURE, "fgos-auto-discover-tsk-2ja").unwrap());
        assert!(!pane_has_label(AUTO_DISCOVER_PANE_FIXTURE, "fgos-auto-discover-tsk-9zz").unwrap());
    }

    #[test]
    fn auto_discover_pane_label_never_pollutes_the_dashboard_pane_map() {
        // The synthetic label passes `is_valid_id`'s syntax check (legal
        // hyphenated-lowercase shape) but must never surface as a task-id
        // key in `parse_pane_list`'s own map — that map stays exactly as
        // it was before this guard existed.
        let map = map_of(AUTO_DISCOVER_PANE_FIXTURE);
        assert!(
            !map.contains_key("fgos-auto-discover-tsk-2ja"),
            "a synthetic auto-discover label must never be read back as a task id"
        );
        assert_eq!(map.len(), 1, "only the real, id-labeled pane is tracked");
    }
}
