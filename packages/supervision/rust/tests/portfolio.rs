use std::fs;
use std::path::PathBuf;

use fgos_supervision::portfolio::{
    active_overlaps, admissible, admitted_text, collisions, footprint_problem, head_name,
    name_tag, order, read_plan, running_overlaps, supervisor_name, widened_text, Plan,
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

// Successful plan parsing does not classify the admission duty of a refused document.
#[test]
fn only_refused_ready_plans_need_admission_judgement() {
    use fgos_supervision::portfolio::refused_ready_plan;
    for status in ["ready", "done", "withdrawn", "running", "draft", "old"] {
        for broken in ["priority: invalid", "priority: P1\nfootprint: invalid"] {
            let text = format!("---\nstatus: {status}\n{broken}\n---\n# No phase table\n");
            assert!(read_plan("refused", &text).is_err());
            assert_eq!(refused_ready_plan(&text), status == "ready");
        }
    }
    for text in [
        "old plan without frontmatter",
        "---\nstatus: [\n---\n",
        "---\n- ready\n---\n",
    ] {
        assert!(!refused_ready_plan(text));
    }
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
fn a_plan_whose_footprint_overlaps_a_running_plan_is_admissible_and_its_row_lists_the_overlap() {
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
    assert_eq!(dirs, ["hit", "free"]);

    use fgos_supervision::{supervisor, wake::Holder};
    struct NoQuestions;
    impl supervisor::OpenQuestions for NoQuestions {
        fn has_open(&self, _: &str) -> bool {
            false
        }
    }
    let view = supervisor::plans(
        &plans,
        &[],
        "project",
        "p1",
        &|_| Holder::NotLive,
        2,
        &NoQuestions,
    );
    let json = view.to_json();
    assert_eq!(json["plans"][1]["admissible"], true);
    assert_eq!(
        json["plans"][1]["overlaps"],
        serde_json::json!([{"plan": "run", "paths": ["src/a/inner.mjs"]}])
    );
    for i in [0, 2] {
        assert!(json["plans"][i].get("overlaps").is_none());
    }
}

#[test]
fn head_name_keeps_the_handle_prefix_and_fits_the_limit() {
    let long = "261118-0947-session-verb-for-agent-sessions";
    let name = head_name("forgent", long);
    assert_eq!(name.chars().count(), 32);
    assert!(name.starts_with("forgent-261118-0947-sessio-"));
    assert_eq!(supervisor_name(&"p".repeat(50)).chars().count(), 32);
    // A directory that fits is kept whole, with no tag.
    assert_eq!(
        head_name("forgent", "261121-0707-head-tab"),
        "forgent-261121-0707-head-tab"
    );
}

#[test]
fn head_names_of_plans_sharing_their_first_24_characters_differ_and_the_tag_is_pinned() {
    let long = "261118-0947-session-verb-for-agent-sessions";
    let twin = format!("{long}-2");
    assert_ne!(head_name("forgent", long), head_name("forgent", &twin));
    // The Node resolver computes the same tag; test/session-host/head-name-labels.test.mjs pins the same values.
    assert_eq!(name_tag(long, 5), "f24d0");
    assert_eq!(name_tag(&twin, 5), "1062f");
    let plans = vec![
        plan(long, "ready", "P1", "2026-11-18", &[], &[]),
        plan(&twin, "draft", "P1", "2026-11-18", &[], &[]),
    ];
    assert!(collisions(&plans, "forgent").is_empty());
}

#[test]
fn a_whole_name_that_starts_another_collides_unless_the_plan_is_done() {
    let plans = vec![
        plan("short", "ready", "P1", "2026-11-18", &[], &[]),
        plan("short-2", "ready", "P1", "2026-11-18", &[], &[]),
    ];
    assert_eq!(
        collisions(&plans, "forgent"),
        [("short".to_string(), "short-2".to_string())]
    );
    let plans = vec![
        plan("short", "done", "P1", "2026-11-18", &[], &[]),
        plan("short-2", "ready", "P1", "2026-11-18", &[], &[]),
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
    if !running_overlaps(&plans[1], &plans).is_empty() {
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
    assert!(running_overlaps(&plans[0], &plans).is_empty());
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
    assert!(running_overlaps(&plans[0], &plans).is_empty());
    let dirs: Vec<&str> = admissible(&plans, &[])
        .iter()
        .map(|p| p.dir.as_str())
        .collect();
    assert_eq!(dirs, ["free"]);
}

#[test]
fn only_comparable_running_plans_contribute_overlap_advice() {
    // The JSON wiring test covers one pair; this owns status filtering and incomparable peers.
    let mut plans = vec![
        plan("peer", "running", "P1", "2026-11-01", &[], &["src/**"]),
        plan("mine", "ready", "P1", "2026-11-02", &[], &["src/b/"]),
    ];
    for status in ["ready", "draft", "done", "withdrawn"] {
        plans[0].status = status.into();
        assert!(running_overlaps(&plans[1], &plans).is_empty(), "{status}");
    }
    plans[0].status = "running".into();
    for footprint in [vec![], vec!["src/**".into(), "/abs".into()]] {
        plans[0].footprint = footprint;
        assert_eq!(admissible(&plans, &[]).len(), 1);
        assert!(running_overlaps(&plans[1], &plans).is_empty());
    }
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

// The reader's existing cases do not prove admission's byte edit or publication fields.
#[test]
fn admission_edits_only_status_lead_and_base_and_keeps_the_plan_body_and_notes() {
    for newline in ["\n", "\r\n"] {
        let body = format!("{HEAD}| 1 | a | - | x/ | 1 | todo |\n\nKeep this body.\n");
        let original = text_with(
            "# keep above\nlead: 'old' # keep inline\nbase: old-base\n",
            &body,
        )
        .replace('\n', newline);
        let edited = admitted_text(&original, "head:lead-project-plan", "abc123").unwrap();
        let read = read_plan("p", &edited).unwrap();
        assert_eq!(read.status, "running");
        assert_eq!(read.lead.as_deref(), Some("head:lead-project-plan"));
        assert!(edited.contains("base: abc123"));
        assert!(edited.contains("# keep above"));
        assert!(edited.contains("# keep inline"));
        assert!(edited.ends_with(&body.replace('\n', newline)));
    }
}

#[test]
fn admission_adds_missing_lead_and_base_through_the_frontmatter_editor() {
    let body = format!("{HEAD}| 1 | a | - | x/ | 1 | todo |\n");
    let original = text_with("", &body);
    let edited = admitted_text(&original, "head:lead-project-plan", "abc123").unwrap();
    assert_eq!(
        read_plan("p", &edited).unwrap().lead.as_deref(),
        Some("head:lead-project-plan")
    );
    assert!(edited.contains("base: abc123"));
    assert!(edited.ends_with(&body));
}

#[test]
fn widened_text_writes_both_copies_when_path_is_new_to_both() {
    let body = format!(
        "## Acceptance criteria\n\n1. Criterion one.\n2. Criterion two.\n\n{HEAD}| 1 | a | - | `src/**` | 1 | ready |\n"
    );
    let original = text_with("footprint:\n  - src/**\n", &body);
    let widened =
        widened_text(&original, "1", &["packages/supervision/rust/src/lib.rs"], 2).unwrap();
    assert!(widened.text.is_some());
    assert_eq!(widened.added, ["packages/supervision/rust/src/lib.rs"]);
    assert!(widened.unchanged.is_empty());
    assert_eq!(widened.criterion_text, "Criterion two.");

    let edited = widened.text.unwrap();
    let read = read_plan("p", &edited).unwrap();
    assert!(read
        .footprint
        .contains(&"packages/supervision/rust/src/lib.rs".to_string()));
    assert!(read.phases[0]
        .footprint
        .contains(&"packages/supervision/rust/src/lib.rs".to_string()));
}

#[test]
fn widened_text_keeps_every_other_byte_of_plan_md() {
    let body = format!(
        "# Title\n\nSome introductory notes.\n\n## Acceptance criteria\n\n1. First criterion.\n2. Second criterion.\n\n## Phases\n\n{HEAD}| 1 | a | - | `src/**` | 1 | ready |\n| 2 | b | 1 | `tests/**` | 2 | ready |\n\nSome trailing notes.\n"
    );
    let original = text_with(
        "# Frontmatter comment\nfootprint:\n  - src/**\n",
        &body,
    );
    let widened = widened_text(&original, "1", &["lib/new_module.rs"], 1).unwrap();
    let edited = widened.text.unwrap();

    let expected = format!(
        "---\ntitle: t\nstatus: ready\npriority: P1\ncreated: 2026-11-01\n# Frontmatter comment\nfootprint:\n  - src/**\n  - lib/new_module.rs\n---\n\n# Title\n\nSome introductory notes.\n\n## Acceptance criteria\n\n1. First criterion.\n2. Second criterion.\n\n## Phases\n\n{HEAD}| 1 | a | - | `src/**`, `lib/new_module.rs` | 1 | ready |\n| 2 | b | 1 | `tests/**` | 2 | ready |\n\nSome trailing notes.\n"
    );
    assert_eq!(edited, expected);
}

#[test]
fn widened_text_canonicalizes_phase_cell_entries_before_comparing() {
    let body = format!(
        "## Acceptance criteria\n\n1. Item one.\n\n{HEAD}| 1 | a | - | `./src/existing.rs` | 1 | ready |\n"
    );
    let original = text_with("footprint:\n  - src/**\n", &body);
    let widened = widened_text(&original, "1", &["src/existing.rs"], 1).unwrap();
    assert!(widened.text.is_none());
    assert!(widened.added.is_empty());
    assert_eq!(widened.unchanged, ["src/existing.rs"]);
}

#[test]
fn widened_text_refuses_when_comment_inside_footprint_list() {
    let body = format!(
        "## Acceptance criteria\n\n1. Item one.\n\n{HEAD}| 1 | a | - | `src/**` | 1 | ready |\n"
    );
    let original = text_with(
        "footprint:\n  # comment inside list\n  - src/**\n",
        &body,
    );
    let err = widened_text(&original, "1", &["tests/new.rs"], 1).unwrap_err();
    assert_eq!(err.code(), "comment-would-be-lost");
}

#[test]
fn widened_text_treats_covered_path_as_frontmatter_noop_and_adds_to_phase_cell() {
    let body = format!(
        "## Acceptance criteria\n\n1. Item one.\n\n{HEAD}| 1 | a | - | `src/existing.rs` | 1 | ready |\n"
    );
    let original = text_with("footprint:\n  - src/**\n", &body);
    let widened = widened_text(&original, "1", &["src/new.rs"], 1).unwrap();
    assert!(widened.text.is_some());
    assert_eq!(widened.added, ["src/new.rs"]);
    assert!(widened.unchanged.is_empty());

    let edited = widened.text.unwrap();
    let read = read_plan("p", &edited).unwrap();
    // Frontmatter was NOT modified because src/** already covers src/new.rs
    assert_eq!(read.footprint, ["src/**"]);
    // Phase 1 footprint cell added src/new.rs
    assert_eq!(read.phases[0].footprint, ["src/existing.rs", "src/new.rs"]);
}

#[test]
fn widened_text_returns_none_and_reports_unchanged_when_neither_copy_changes() {
    let body = format!(
        "## Acceptance criteria\n\n1. Item one.\n\n{HEAD}| 1 | a | - | `src/**` | 1 | ready |\n"
    );
    let original = text_with("footprint:\n  - src/**\n", &body);
    let widened = widened_text(&original, "1", &["src/**"], 1).unwrap();
    assert!(widened.text.is_none());
    assert!(widened.added.is_empty());
    assert_eq!(widened.unchanged, ["src/**"]);
    assert_eq!(widened.criterion_text, "Item one.");
}

#[test]
fn widened_text_refuses_when_plan_is_not_widenable() {
    let body = format!(
        "## Acceptance criteria\n\n1. Item one.\n\n{HEAD}| 1 | a | - | `src/**` | 1 | ready |\n"
    );
    for status in ["draft", "done", "withdrawn"] {
        let text = format!("---\ntitle: t\nstatus: {status}\npriority: P1\ncreated: 2026-11-01\nfootprint:\n  - src/**\n---\n\n{body}");
        let err = widened_text(&text, "1", &["src/foo.rs"], 1).unwrap_err();
        assert_eq!(err.code(), "plan-not-widenable", "{status}");
    }
}

#[test]
fn widened_text_refuses_when_criterion_is_not_found() {
    let body = format!(
        "## Acceptance criteria\n\n1. Item one.\n\n{HEAD}| 1 | a | - | `src/**` | 1 | ready |\n"
    );
    let original = text_with("footprint:\n  - src/**\n", &body);
    let err = widened_text(&original, "1", &["src/foo.rs"], 2).unwrap_err();
    assert_eq!(err.code(), "criterion-not-found");

    let no_criteria_body = format!("{HEAD}| 1 | a | - | `src/**` | 1 | ready |\n");
    let original_no_criteria = text_with("footprint:\n  - src/**\n", &no_criteria_body);
    let err = widened_text(&original_no_criteria, "1", &["src/foo.rs"], 1).unwrap_err();
    assert_eq!(err.code(), "criterion-not-found");
}

#[test]
fn widened_text_refuses_when_phase_is_not_found_or_ended() {
    let body = format!(
        "## Acceptance criteria\n\n1. Item one.\n\n{HEAD}| 1 | a | - | src/** | 1 | ready |\n| 2 | b | 1 | tests/** | 2 | done |\n| 3 | c | 2 | docs/** | 3 | withdrawn |\n"
    );
    let original = text_with("footprint:\n  - src/**\n", &body);

    // Missing phase id
    let err = widened_text(&original, "99", &["src/foo.rs"], 1).unwrap_err();
    assert_eq!(err.code(), "phase-not-found");

    // Phase 2 is done
    let err = widened_text(&original, "2", &["src/foo.rs"], 1).unwrap_err();
    assert_eq!(err.code(), "phase-not-found");

    // Phase 3 is withdrawn
    let err = widened_text(&original, "3", &["src/foo.rs"], 1).unwrap_err();
    assert_eq!(err.code(), "phase-not-found");
}

#[test]
fn widened_text_refuses_invalid_footprint_entries() {
    let body = format!(
        "## Acceptance criteria\n\n1. Item one.\n\n{HEAD}| 1 | a | - | src/** | 1 | ready |\n"
    );
    let original = text_with("footprint:\n  - src/**\n", &body);

    for bad in ["-leading-dash", "./-leading-dash", "", "/abs/path", "../escape"] {
        let err = widened_text(&original, "1", &[bad], 1).unwrap_err();
        assert_eq!(err.code(), "footprint-entry-invalid", "{bad}");
    }
}

#[test]
fn active_overlaps_compares_ready_and_running_plans_and_skips_self() {
    let plans = vec![
        plan("mine", "running", "P1", "2026-11-01", &[], &["src/shared/**"]),
        plan(
            "peer_running",
            "running",
            "P1",
            "2026-11-02",
            &[],
            &["src/shared/a.rs"],
        ),
        plan(
            "peer_ready",
            "ready",
            "P1",
            "2026-11-03",
            &[],
            &["src/shared/b.rs"],
        ),
        plan(
            "peer_done",
            "done",
            "P1",
            "2026-11-04",
            &[],
            &["src/shared/c.rs"],
        ),
    ];
    let overlaps = active_overlaps(&plans[0], &plans);
    let dirs: Vec<&str> = overlaps.iter().map(|(d, _)| d.as_str()).collect();
    assert_eq!(dirs, ["peer_running", "peer_ready"]);
    assert_eq!(overlaps[0].1, ["src/shared/a.rs"]);
    assert_eq!(overlaps[1].1, ["src/shared/b.rs"]);
}
