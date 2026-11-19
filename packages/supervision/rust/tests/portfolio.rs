use std::fs;
use std::path::PathBuf;

use fgos_supervision::portfolio::{
    admissible, collisions, footprint_problem, head_name, order, read_plan, supervisor_name, Plan,
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
        "---\ncontract: plan-v1\ntitle: t\nstatus: {status}\npriority: {priority}\nblockedBy:{}\nfootprint:{}\ncreated: {created}\n---\n\n# t\n\n| ID | Title | DependsOn | Footprint | Wave | Status |\n|---|---|---|---|---|---|\n| 1 | t | - | `x/` | 1 | todo |\n",
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

// ---- footprint rule: the old cut-at-first-star rule against the shared write-scope rule ---------

#[derive(Debug, PartialEq)]
enum Verdict {
    Overlap,
    Disjoint,
    Refused,
}

fn verdict(a: &[&str], b: &[&str]) -> Verdict {
    let run = |status: &str, name: &str, f: &[&str]| plan(name, status, "P1", "2026-11-01", &[], f);
    // Only the candidate's own footprint decides refusal; build both sides without a table check.
    let mut mine = run("ready", "mine", &["x/"]);
    let mut theirs = run("running", "theirs", &["y/"]);
    mine.footprint = a.iter().map(|s| s.to_string()).collect();
    theirs.footprint = b.iter().map(|s| s.to_string()).collect();
    if footprint_problem(&mine).is_some() || footprint_problem(&theirs).is_some() {
        return Verdict::Refused;
    }
    let plans = vec![theirs, mine];
    if admissible(&plans, &[]).is_empty() {
        Verdict::Overlap
    } else {
        Verdict::Disjoint
    }
}

/// (a, b, outcome of the removed rule, outcome now). The old column was recorded by running the
/// removed function over these inputs before it was replaced.
#[test]
fn the_footprint_rule_outcomes_are_recorded_against_the_removed_rule() {
    use Verdict::*;
    let table: &[(&str, &str, bool, Verdict)] = &[
        // Divergence: a glob is cut to its whole-segment prefix, so two globs in one directory meet.
        (
            "apps/fgos/tests/questions_*.rs",
            "apps/fgos/tests/supervision_*.rs",
            false,
            Overlap,
        ),
        ("src/a*", "src/ab/x", false, Overlap),
        ("src/a*/x", "src/b/x", false, Overlap),
        // Same outcome.
        ("src/**", "src/a/b.rs", true, Overlap),
        ("src/**", "lib/x", false, Disjoint),
        ("*", "src/x", true, Overlap),
        ("src/a/", "src/a/b.rs", true, Overlap),
        ("src/*.rs", "src/x/y", true, Overlap),
        ("src/a", "src/b", false, Disjoint),
        // Divergence: an entry that is no repo-relative path is refused, not compared.
        ("", "src/x", true, Refused),
        (".", "src/x", false, Refused),
        ("..", "src/x", false, Refused),
        ("/etc/x", "etc/x", false, Refused),
        ("/etc/x", "/etc", true, Refused),
        ("src\\a\\b", "src/a", true, Refused),
        ("ab**", "ab/x", true, Refused),
    ];
    for (a, b, old_overlapped, now) in table {
        assert_eq!(
            verdict(&[a], &[b]),
            *now,
            "{a:?} against {b:?} (the removed rule said overlap={old_overlapped})"
        );
    }
    // An empty list: the removed rule found no overlap; now the plan is refused as empty.
    assert_eq!(
        footprint_problem(&plan("e", "ready", "P1", "2026-11-01", &[], &[])),
        Some("footprint-empty")
    );
}

#[test]
fn a_plan_with_a_malformed_footprint_entry_is_not_admissible_and_names_its_reason() {
    let plans = vec![
        plan("bad", "ready", "P1", "2026-11-01", &[], &["../escape"]),
        plan("free", "ready", "P1", "2026-11-02", &[], &["src/b/"]),
    ];
    assert_eq!(
        footprint_problem(&plans[0]),
        Some("footprint-entry-invalid")
    );
    assert_eq!(footprint_problem(&plans[1]), None);
    let dirs: Vec<&str> = admissible(&plans, &[])
        .iter()
        .map(|p| p.dir.as_str())
        .collect();
    assert_eq!(dirs, ["free"]);
}

#[test]
fn a_plan_with_an_empty_footprint_is_not_admissible_and_names_its_reason() {
    let plans = vec![
        plan("none", "ready", "P1", "2026-11-01", &[], &[]),
        plan("free", "ready", "P1", "2026-11-02", &[], &["src/b/"]),
    ];
    assert_eq!(footprint_problem(&plans[0]), Some("footprint-empty"));
    let dirs: Vec<&str> = admissible(&plans, &[])
        .iter()
        .map(|p| p.dir.as_str())
        .collect();
    assert_eq!(dirs, ["free"]);
}

#[test]
fn a_running_plan_with_a_malformed_footprint_holds_back_no_other_plan() {
    let plans = vec![
        plan("run", "running", "P1", "2026-11-01", &[], &["/abs"]),
        plan("free", "ready", "P1", "2026-11-02", &[], &["src/b/"]),
    ];
    assert_eq!(admissible(&plans, &[]).len(), 1);
}

// ---- the honest phase-table reader ---------------------------------------------------------------

fn text_with(front_extra: &str, body: &str) -> String {
    format!("---\ntitle: t\nstatus: ready\npriority: P1\ncreated: 2026-11-01\n{front_extra}---\n\n{body}")
}

const HEAD: &str =
    "| ID | Title | DependsOn | Footprint | Wave | Status |\n|---|---|---|---|---|---|\n";

fn refusal(front_extra: &str, body: &str) -> String {
    read_plan("p", &text_with(front_extra, body))
        .unwrap_err()
        .code()
        .to_string()
}

#[test]
fn the_reader_keeps_every_star_in_a_footprint_cell() {
    let body =
        format!("{HEAD}| 1 | a | - | `apps/fgos/tests/questions_*.rs`, `src/**` | 1 | todo |\n");
    let plan = read_plan("p", &text_with("", &body)).unwrap();
    assert_eq!(
        plan.phases[0].footprint,
        ["apps/fgos/tests/questions_*.rs", "src/**"][..]
    );
    let body = format!("{HEAD}| 1 | a | - | [src/**](x.md) | 2 | todo |\n");
    let plan = read_plan("p", &text_with("", &body)).unwrap();
    assert_eq!(plan.phases[0].footprint, ["src/**"]);
    assert_eq!(plan.phases[0].wave, 2);
}

#[test]
fn a_ready_plan_whose_phase_table_is_unsound_is_refused_by_name() {
    assert_eq!(refusal("", "# no table\n"), "phase-table-missing");
    assert_eq!(
        refusal("", "| a | b |\n|---|---|\n| 1 | 2 |\n"),
        "phase-table-missing"
    );
    assert_eq!(refusal("", HEAD), "phase-table-empty");
    let two = format!(
        "{HEAD}| 1 | a | - | x/ | 1 | todo |\n\ntext\n\n{HEAD}| 2 | a | - | y/ | 1 | todo |\n"
    );
    assert_eq!(refusal("", &two), "phase-table-ambiguous");
    let no_wave = "| ID | Title | DependsOn | Footprint | Status |\n|---|---|---|---|---|\n| 1 | a | - | x/ | todo |\n";
    assert_eq!(refusal("", no_wave), "phase-table-column-missing");
    for wave in ["0", "x", "", "1.5", "-1"] {
        let body = format!("{HEAD}| 1 | a | - | x/ | {wave} | todo |\n");
        assert_eq!(refusal("", &body), "phase-wave-invalid", "wave {wave:?}");
    }
    let dup = format!("{HEAD}| 1 | a | - | x/ | 1 | todo |\n| 1 | b | - | y/ | 2 | todo |\n");
    assert_eq!(refusal("", &dup), "phase-id-duplicate");
}

#[test]
fn a_non_string_frontmatter_entry_is_refused_not_dropped() {
    let body = format!("{HEAD}| 1 | a | - | x/ | 1 | todo |\n");
    assert_eq!(
        refusal("footprint:\n  - src/a/\n  - 7\n", &body),
        "plan-frontmatter-entry-invalid"
    );
    assert_eq!(
        refusal("blockedBy:\n  - [a]\n", &body),
        "plan-frontmatter-entry-invalid"
    );
}

#[test]
fn a_draft_plan_without_a_table_still_reads() {
    let text =
        "---\ntitle: t\nstatus: draft\npriority: P1\ncreated: 2026-11-01\n---\n\nno table yet\n";
    assert!(read_plan("p", text).unwrap().phases.is_empty());
}

#[test]
fn a_present_frontmatter_list_key_that_is_not_a_list_is_refused() {
    let body = format!("{HEAD}| 1 | a | - | x/ | 1 | todo |\n");
    for key in ["blockedBy: 7\n", "footprint: src/a/\n", "source: true\n"] {
        assert_eq!(
            refusal(key, &body),
            "plan-frontmatter-entry-invalid",
            "{key:?}"
        );
    }
}

#[test]
fn a_malformed_table_is_refused_for_every_status_but_no_table_stays_readable() {
    let head = "---\ntitle: t\nstatus: draft\npriority: P1\ncreated: 2026-11-01\n---\n\n";
    let wave0 = format!("{head}{HEAD}| 1 | a | - | x/ | 0 | todo |\n");
    assert_eq!(
        read_plan("p", &wave0).unwrap_err().code(),
        "phase-wave-invalid"
    );
    assert_eq!(
        read_plan("p", &format!("{head}{HEAD}")).unwrap_err().code(),
        "phase-table-empty"
    );
    assert!(read_plan("p", &format!("{head}no table\n")).is_ok());
}

#[test]
fn only_whole_entry_markdown_is_unwrapped_in_a_footprint_cell() {
    let body = format!(
        "{HEAD}| 1 | a | - | `src/[a](b)/x`, [`src/c/**`](d.md), src/[e](f)/g | 1 | todo |\n"
    );
    let plan = read_plan("p", &text_with("", &body)).unwrap();
    assert_eq!(
        plan.phases[0].footprint,
        ["src/[a](b)/x", "src/c/**", "src/[e](f)/g"][..]
    );
}
