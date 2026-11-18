use std::fs;
use std::path::PathBuf;

use fgos_supervision::portfolio::{
    admissible, collisions, head_name, order, read_plan, supervisor_name, Plan,
};

fn plan(
    dir: &str,
    status: &str,
    priority: &str,
    created: &str,
    blocked_by: &[&str],
    footprint: &[&str],
) -> Plan {
    let list = |items: &[&str]| {
        items
            .iter()
            .map(|s| format!("\n  - {s}"))
            .collect::<String>()
    };
    let text = format!(
        "---\ncontract: plan-v1\ntitle: t\nstatus: {status}\npriority: {priority}\nblockedBy:{}\nfootprint:{}\ncreated: {created}\n---\n\n# t\n",
        if blocked_by.is_empty() { " []".to_string() } else { list(blocked_by) },
        if footprint.is_empty() { " []".to_string() } else { list(footprint) },
    );
    read_plan(dir, &text).expect("fixture plan reads")
}

#[test]
fn order_sorts_by_priority_then_created_then_dir() {
    let mut plans = vec![
        plan("b", "ready", "P2", "2026-11-02", &[], &[]),
        plan("c", "ready", "P1", "2026-11-09", &[], &[]),
        plan("a", "ready", "P2", "2026-11-02", &[], &[]),
        plan("d", "ready", "P2", "2026-11-01", &[], &[]),
    ];
    order(&mut plans);
    let dirs: Vec<&str> = plans.iter().map(|p| p.dir.as_str()).collect();
    assert_eq!(dirs, ["c", "d", "a", "b"]);
}

#[test]
fn a_plan_blocked_by_a_plan_that_is_not_done_is_not_admissible() {
    let plans = vec![plan(
        "x",
        "ready",
        "P1",
        "2026-11-01",
        &["dep"],
        &["src/x/"],
    )];
    assert!(admissible(&plans, &[]).is_empty());
    assert_eq!(admissible(&plans, &["dep".to_string()]).len(), 1);
}

#[test]
fn a_plan_whose_footprint_overlaps_a_running_plan_is_not_admissible() {
    let plans = vec![
        plan("run", "running", "P1", "2026-11-01", &[], &["src/a/**"]),
        plan(
            "hit",
            "ready",
            "P1",
            "2026-11-02",
            &[],
            &["src/a/inner.mjs"],
        ),
        plan("free", "ready", "P1", "2026-11-03", &[], &["src/b/"]),
    ];
    let dirs: Vec<&str> = admissible(&plans, &[])
        .iter()
        .map(|p| p.dir.as_str())
        .collect();
    assert_eq!(dirs, ["free"]);
}

#[test]
fn head_name_keeps_the_handle_prefix_and_fits_the_limit_and_a_colliding_pair_is_reported() {
    let long = "261118-0947-session-verb-for-agent-sessions";
    let name = head_name("forgent", long);
    assert_eq!(name.chars().count(), 32);
    assert!(name.starts_with("forgent-"));
    assert_eq!(supervisor_name(&"p".repeat(50)).chars().count(), 32);

    let twin = format!("{long}-2");
    let plans = vec![
        plan(long, "ready", "P1", "2026-11-18", &[], &[]),
        plan(&twin, "draft", "P1", "2026-11-18", &[], &[]),
        plan("261118-1000-other", "ready", "P1", "2026-11-18", &[], &[]),
    ];
    assert_eq!(collisions(&plans, "forgent"), [(long.to_string(), twin)]);
}

#[test]
fn a_done_plan_never_collides() {
    let long = "261118-0947-session-verb-for-agent-sessions";
    let plans = vec![
        plan(long, "done", "P1", "2026-11-18", &[], &[]),
        plan(&format!("{long}-2"), "ready", "P1", "2026-11-18", &[], &[]),
    ];
    assert!(collisions(&plans, "forgent").is_empty());
}

#[test]
fn every_contract_plan_of_this_repo_reads() {
    let plans_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../../plans");
    let mut read = 0;
    for entry in fs::read_dir(&plans_dir).expect("plans dir") {
        let path = entry.expect("entry").path().join("plan.md");
        let Ok(text) = fs::read_to_string(&path) else {
            continue;
        };
        if !text
            .lines()
            .take(12)
            .any(|l| l.trim() == "contract: plan-v1")
        {
            continue;
        }
        let dir = path
            .parent()
            .and_then(|p| p.file_name())
            .and_then(|n| n.to_str())
            .expect("dir name");
        let plan = read_plan(dir, &text).unwrap_or_else(|e| panic!("{dir}: {e}"));
        if plan.status != "draft" {
            assert!(!plan.phases.is_empty(), "{dir}: phase table read");
        }
        read += 1;
    }
    assert!(read > 0, "at least one contract plan exists");
}

#[test]
fn the_observe_kinds_declaration_parses_and_accepts_a_tick_record() {
    use fgos_observe::record::registry::{EmbeddedDeclaration, Registry};
    use fgos_observe::record::types::Record;
    let registry = Registry::from_embedded(&[EmbeddedDeclaration {
        label: "supervision",
        json: include_str!("../observe-kinds.json"),
    }])
    .expect("declaration parses and merges with the shared names");
    let tick: Record = serde_json::from_str(
        r#"{"v": 2, "id": "tick-1", "kind": "fgos.watcher.tick",
            "ts": "2026-11-18T03:00:00Z", "endTs": "2026-11-18T03:00:01Z",
            "subject": {"kind": "session", "id": "watcher-1"},
            "attrs": {"fgos.watcher.mode": "active", "fgos.watcher.outcome": "noop"},
            "measures": {"fgos.watcher.interval": 60, "fgos.plans.ready": 2, "fgos.watcher.raised": 1},
            "basis": "observed", "origin": {"source": "supervision-test"}}"#,
    )
    .expect("record shape");
    registry.validate(&tick).expect("tick record is valid");
}
