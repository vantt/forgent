//! Tests for portfolio check, item contract, and index generation (D-ADR0082, phase 2).

#[allow(dead_code)]
#[path = "../src/wiring/portfolio.rs"]
mod portfolio;

use std::fs;
use std::path::{Path, PathBuf};

use portfolio::{
    check_portfolio, create_item, edit_item, format_backlog_item, generate_backlog_index,
    parse_backlog_item, parse_discussion, BacklogItem, BacklogItemFields, CheckOptions,
    CreateItemRequest, Discussion, EditItemRequest, PlanRef, PortfolioRefusal,
};

fn temp_dir(prefix: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("fgos-{prefix}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    dir
}

#[test]
fn test_parse_backlog_item_valid() {
    let text = r#"---
id: p-rw5iadsp2p
title: Item contract, check and generated index
status: proposed
priority: P1
area: portfolio
created: 2026-11-21
---

# Why

Need unified portfolio schema.

# Done when

Check passes.

# Notes

Pre-plan detail.
"#;

    let item = parse_backlog_item(Path::new("plans/backlog/p-rw5iadsp2p-item.md"), text).unwrap();
    assert_eq!(item.id, "p-rw5iadsp2p");
    assert_eq!(item.title, "Item contract, check and generated index");
    assert_eq!(item.status, "proposed");
    assert_eq!(item.priority, "P1");
    assert_eq!(item.area, "portfolio");
    assert_eq!(item.created, "2026-11-21");
    assert_eq!(item.why, "Need unified portfolio schema.");
    assert_eq!(item.done_when, "Check passes.");
    assert_eq!(item.notes, "Pre-plan detail.");

    // Rows written before minting keep their ids (convention rule `backlog-id`).
    for (legacy, file) in [
        ("p-d2dc4f2e", "plans/backlog/p-d2dc4f2e-item.md"),
        ("STR27", "plans/backlog/STR27-item.md"),
        (
            "wf-coding-cutover",
            "plans/backlog/wf-coding-cutover-item.md",
        ),
    ] {
        let legacy_text = text.replace("p-rw5iadsp2p", legacy);
        let parsed = parse_backlog_item(Path::new(file), &legacy_text).unwrap();
        assert_eq!(parsed.id, legacy);
    }
}

#[test]
fn test_parse_backlog_item_missing_key() {
    let text = r#"---
id: p-rw5iadsp2p
status: proposed
priority: P1
area: portfolio
created: 2026-11-21
---

# Why
why
# Done when
done
# Notes
notes
"#;

    let res = parse_backlog_item(Path::new("bad.md"), text);
    assert!(matches!(res, Err(PortfolioRefusal::KeyMissing(_))));
}

#[test]
fn test_parse_backlog_item_invalid_status_and_priority() {
    let text_bad_status = r#"---
id: p-rw5iadsp2p
title: Valid title
status: in-progress
priority: P1
area: portfolio
created: 2026-11-21
---

# Why
why
# Done when
done
# Notes
notes
"#;

    let res1 = parse_backlog_item(Path::new("bad.md"), text_bad_status);
    assert!(matches!(res1, Err(PortfolioRefusal::StatusUnknown(_))));

    let text_bad_priority = text_bad_status
        .replace("status: in-progress", "status: proposed")
        .replace("priority: P1", "priority: P9");

    let res2 = parse_backlog_item(Path::new("bad.md"), &text_bad_priority);
    assert!(matches!(res2, Err(PortfolioRefusal::PriorityUnknown(_))));
}

#[test]
fn test_parse_backlog_item_missing_body_section() {
    let text_missing_notes = r#"---
id: p-rw5iadsp2p
title: Valid title
status: proposed
priority: P1
area: portfolio
created: 2026-11-21
---

# Why
why
# Done when
done
"#;

    let res = parse_backlog_item(Path::new("bad.md"), text_missing_notes);
    assert!(matches!(res, Err(PortfolioRefusal::BodySectionMissing(_))));
}

#[test]
fn test_parse_discussion_valid() {
    let text = r#"---
id: ds-234567abcd
title: Work data model
status: settled
source:
  - p-rw5iadsp2p
created: 2026-11-20
---

# Discussion content
"#;

    let d = parse_discussion(
        Path::new("plans/discussions/ds-234567abcd-shaping/DISCUSSION.md"),
        text,
    )
    .unwrap();
    assert_eq!(d.id, "ds-234567abcd");
    assert_eq!(d.title, "Work data model");
    assert_eq!(d.status, "settled");
    assert_eq!(d.source, vec!["p-rw5iadsp2p"]);

    let bad_status = text.replace("status: settled", "status: closed");
    let res_bad_status = parse_discussion(Path::new("bad.md"), &bad_status);
    assert!(matches!(
        res_bad_status,
        Err(PortfolioRefusal::StatusUnknown(_))
    ));

    let bad_id = text.replace("id: ds-234567abcd", "id: ds-bad_id!");
    let res_bad_id = parse_discussion(Path::new("bad.md"), &bad_id);
    assert!(matches!(res_bad_id, Err(PortfolioRefusal::InvalidId(_))));
}

#[test]
fn test_create_and_edit_item() {
    let dir = temp_dir("portfolio-create-edit");
    let req = CreateItemRequest {
        id: Some("p-234567abcd".to_string()),
        slug: Some("test-item".to_string()),
        title: "Test Create Item".to_string(),
        status: Some("proposed".to_string()),
        priority: Some("P2".to_string()),
        area: Some("test".to_string()),
        created: Some("2026-11-21".to_string()),
        why: Some("Because we need it".to_string()),
        done_when: Some("Tests pass".to_string()),
        notes: Some("Initial notes".to_string()),
    };

    let created = create_item(&dir, &req).unwrap();
    assert_eq!(created.id, "p-234567abcd");
    assert_eq!(created.filename, "p-234567abcd-test-item.md");
    assert!(created.full_path.exists());

    // Edit item
    let edit_req = EditItemRequest {
        id: "p-234567abcd".to_string(),
        title: None,
        status: Some("in-flight".to_string()),
        priority: Some("P0".to_string()),
        area: None,
        why: None,
        done_when: None,
        notes: Some("Updated notes".to_string()),
    };

    let edited = edit_item(&dir, &edit_req).unwrap();
    assert_eq!(edited.id, "p-234567abcd");

    let read_back = fs::read_to_string(&edited.full_path).unwrap();
    let parsed = parse_backlog_item(&edited.rel_path, &read_back).unwrap();
    assert_eq!(parsed.status, "in-flight");
    assert_eq!(parsed.priority, "P0");
    assert_eq!(parsed.notes, "Updated notes");

    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn test_generate_backlog_index() {
    let items = vec![
        BacklogItem {
            id: "p-nsngcpgoi2".to_string(),
            title: "Second item".to_string(),
            status: "in-flight".to_string(),
            priority: "P0".to_string(),
            area: "core".to_string(),
            created: "2026-11-20".to_string(),
            filename: "p-nsngcpgoi2-second.md".to_string(),
            rel_path: PathBuf::from("plans/backlog/p-nsngcpgoi2-second.md"),
            why: "why".to_string(),
            done_when: "done".to_string(),
            notes: "notes".to_string(),
        },
        BacklogItem {
            id: "p-rw5iadsp2p".to_string(),
            title: "First item".to_string(),
            status: "proposed".to_string(),
            priority: "P1".to_string(),
            area: "runner".to_string(),
            created: "2026-11-19".to_string(),
            filename: "p-rw5iadsp2p-first.md".to_string(),
            rel_path: PathBuf::from("plans/backlog/p-rw5iadsp2p-first.md"),
            why: "why".to_string(),
            done_when: "done".to_string(),
            notes: "notes".to_string(),
        },
    ];

    let discussions = vec![Discussion {
        id: "ds-234567abcd".to_string(),
        title: "Discussion Title".to_string(),
        status: "open".to_string(),
        source: vec!["p-nsngcpgoi2".to_string()],
        created: "2026-11-20".to_string(),
        dir: "ds-234567abcd-shaping".to_string(),
        rel_path: PathBuf::from("plans/discussions/ds-234567abcd-shaping/DISCUSSION.md"),
    }];

    let plans = vec![PlanRef {
        dir: "261120-1200-plan".to_string(),
        title: "Plan Title".to_string(),
        status: "running".to_string(),
        source: vec!["p-nsngcpgoi2".to_string()],
        rel_path: PathBuf::from("plans/261120-1200-plan/plan.md"),
    }];

    let index = generate_backlog_index(&items, &discussions, &plans);
    assert!(index.contains("| ID | Title | Status | Priority | Area | Citing |"));

    let pos_p0 = index.find("p-nsngcpgoi2").unwrap();
    let pos_p1 = index.find("p-rw5iadsp2p").unwrap();
    assert!(pos_p0 < pos_p1, "P0 item must precede P1 item");

    assert!(
        index.contains("[ds-234567abcd](discussions/ds-234567abcd-shaping/DISCUSSION.md) (open)")
    );
    assert!(index.contains("[261120-1200-plan](261120-1200-plan/plan.md) (running)"));
}

#[test]
fn test_check_portfolio_clean() {
    let dir = temp_dir("portfolio-check-clean");
    let backlog_dir = dir.join("plans").join("backlog");
    let disc_dir = dir
        .join("plans")
        .join("discussions")
        .join("ds-234567abcd-disc");
    let plan_dir = dir.join("plans").join("261120-0625-plan");

    fs::create_dir_all(&backlog_dir).unwrap();
    fs::create_dir_all(&disc_dir).unwrap();
    fs::create_dir_all(&plan_dir).unwrap();

    let item_text = format_backlog_item(&BacklogItemFields {
        id: "p-rw5iadsp2p",
        title: "Portfolio Item",
        status: "in-flight",
        priority: "P1",
        area: "portfolio",
        created: "2026-11-21",
        why: "Why explanation",
        done_when: "Criteria met",
        notes: "Notes here",
    })
    .unwrap();
    fs::write(backlog_dir.join("p-rw5iadsp2p-item.md"), item_text).unwrap();

    let disc_text = r#"---
id: ds-234567abcd
title: Discussion Title
status: settled
source:
  - p-rw5iadsp2p
created: 2026-11-20
---

# Discussion
"#;
    fs::write(disc_dir.join("DISCUSSION.md"), disc_text).unwrap();

    let plan_text = r#"---
contract: plan-v1
title: Phase Plan
status: running
source:
  - p-rw5iadsp2p
  - ds-234567abcd
---

# Outcome
Plan outcome
"#;
    fs::write(plan_dir.join("plan.md"), plan_text).unwrap();

    // Matching index
    let items = vec![BacklogItem {
        id: "p-rw5iadsp2p".to_string(),
        title: "Portfolio Item".to_string(),
        status: "in-flight".to_string(),
        priority: "P1".to_string(),
        area: "portfolio".to_string(),
        created: "2026-11-21".to_string(),
        filename: "p-rw5iadsp2p-item.md".to_string(),
        rel_path: PathBuf::from("plans/backlog/p-rw5iadsp2p-item.md"),
        why: "".to_string(),
        done_when: "".to_string(),
        notes: "".to_string(),
    }];
    let discussions = vec![Discussion {
        id: "ds-234567abcd".to_string(),
        title: "Discussion Title".to_string(),
        status: "settled".to_string(),
        source: vec!["p-rw5iadsp2p".to_string()],
        created: "2026-11-20".to_string(),
        dir: "ds-234567abcd-disc".to_string(),
        rel_path: PathBuf::from("plans/discussions/ds-234567abcd-disc/DISCUSSION.md"),
    }];
    let plans = vec![PlanRef {
        dir: "261120-0625-plan".to_string(),
        title: "Phase Plan".to_string(),
        status: "running".to_string(),
        source: vec!["p-rw5iadsp2p".to_string(), "ds-234567abcd".to_string()],
        rel_path: PathBuf::from("plans/261120-0625-plan/plan.md"),
    }];

    let index = generate_backlog_index(&items, &discussions, &plans);
    fs::write(dir.join("plans").join("backlog.md"), index).unwrap();

    let report = check_portfolio(&dir, &CheckOptions::default()).unwrap();
    assert!(report.ok);
    assert!(report.errors.is_empty());

    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn test_check_portfolio_unknown_source() {
    let dir = temp_dir("portfolio-check-unknown-source");
    let disc_dir = dir
        .join("plans")
        .join("discussions")
        .join("ds-234567abcd-disc");
    fs::create_dir_all(&disc_dir).unwrap();

    let disc_text = r#"---
id: ds-234567abcd
title: Discussion Title
status: open
source:
  - p-234567nonx
created: 2026-11-20
---

# Content
"#;
    fs::write(disc_dir.join("DISCUSSION.md"), disc_text).unwrap();

    let report = check_portfolio(
        &dir,
        &CheckOptions {
            check_index: false,
            ..Default::default()
        },
    )
    .unwrap();
    assert!(!report.ok);
    assert!(report
        .errors
        .iter()
        .any(|e| e.contains("cites non-existent backlog item 'p-234567nonx'")));

    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn test_check_portfolio_in_flight_uncited() {
    let dir = temp_dir("portfolio-check-in-flight-uncited");
    let backlog_dir = dir.join("plans").join("backlog");
    fs::create_dir_all(&backlog_dir).unwrap();

    let item_text = format_backlog_item(&BacklogItemFields {
        id: "p-rw5iadsp2p",
        title: "Uncited In-flight Item",
        status: "in-flight",
        priority: "P1",
        area: "portfolio",
        created: "2026-11-21",
        why: "Why",
        done_when: "Done",
        notes: "Notes",
    })
    .unwrap();
    fs::write(backlog_dir.join("p-rw5iadsp2p-item.md"), item_text).unwrap();

    let report = check_portfolio(
        &dir,
        &CheckOptions {
            check_index: false,
            ..Default::default()
        },
    )
    .unwrap();
    assert!(!report.ok);
    assert!(report
        .errors
        .iter()
        .any(|e| e.contains("in-flight-uncited: backlog item 'p-rw5iadsp2p'")));

    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn test_check_portfolio_strict_missing_backlog_source() {
    let dir = temp_dir("portfolio-check-strict-missing-backlog");
    let disc_dir = dir
        .join("plans")
        .join("discussions")
        .join("ds-234567abcd-disc");
    fs::create_dir_all(&disc_dir).unwrap();

    let disc_text = r#"---
id: ds-234567abcd
title: Discussion Title
status: open
source: []
created: 2026-11-20
---

# Content
"#;
    fs::write(disc_dir.join("DISCUSSION.md"), disc_text).unwrap();

    // Strict mode -> error
    let report_strict = check_portfolio(
        &dir,
        &CheckOptions {
            strict: true,
            check_index: false,
            ..Default::default()
        },
    )
    .unwrap();
    assert!(!report_strict.ok);
    assert!(report_strict
        .errors
        .iter()
        .any(|e| e.contains("missing-backlog-source")));

    // Non-strict -> warning
    let report_warn = check_portfolio(
        &dir,
        &CheckOptions {
            strict: false,
            check_index: false,
            ..Default::default()
        },
    )
    .unwrap();
    assert!(report_warn.ok);
    assert!(report_warn
        .warnings
        .iter()
        .any(|w| w.contains("missing-backlog-source")));

    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn a_new_item_takes_a_minted_id_and_a_malformed_plan_source_is_unknown() {
    let dir = temp_dir("portfolio-new-id-and-source");
    for id in ["STR999", "wf-x", "p-deadbeef"] {
        let req = CreateItemRequest {
            id: Some(id.to_string()),
            slug: Some("x".to_string()),
            title: "T".to_string(),
            status: None,
            priority: None,
            area: None,
            created: None,
            why: None,
            done_when: None,
            notes: None,
        };
        assert!(
            matches!(create_item(&dir, &req), Err(PortfolioRefusal::InvalidId(_))),
            "{id} must not be accepted for a new item"
        );
    }

    let plan_dir = dir.join("plans").join("some-plan");
    fs::create_dir_all(&plan_dir).unwrap();
    fs::write(
        plan_dir.join("plan.md"),
        "---\ncontract: plan-v1\ntitle: P\nstatus: draft\nsource:\n  - p-abc\n---\n",
    )
    .unwrap();
    let report = check_portfolio(
        &dir,
        &CheckOptions {
            check_index: false,
            ..Default::default()
        },
    )
    .unwrap();
    assert!(
        report.errors.iter().any(|e| e.contains("unknown-source")),
        "{:?}",
        report.errors
    );
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn test_check_portfolio_drift_detection() {
    let dir = temp_dir("portfolio-check-drift");
    let backlog_dir = dir.join("plans").join("backlog");
    let plan_dir = dir.join("plans").join("261120-0625-plan");
    fs::create_dir_all(&backlog_dir).unwrap();
    fs::create_dir_all(&plan_dir).unwrap();

    // Item done with plan running
    let done_item = format_backlog_item(&BacklogItemFields {
        id: "p-rw5iadsp2p",
        title: "Done Item",
        status: "done",
        priority: "P1",
        area: "portfolio",
        created: "2026-11-21",
        why: "Why",
        done_when: "Done",
        notes: "Notes",
    })
    .unwrap();
    fs::write(backlog_dir.join("p-rw5iadsp2p-item.md"), done_item).unwrap();

    let plan_text = r#"---
contract: plan-v1
title: Running Plan
status: running
source:
  - p-rw5iadsp2p
---
"#;
    fs::write(plan_dir.join("plan.md"), plan_text).unwrap();

    let report1 = check_portfolio(
        &dir,
        &CheckOptions {
            check_index: false,
            ..Default::default()
        },
    )
    .unwrap();
    assert!(!report1.ok);
    assert!(report1
        .errors
        .iter()
        .any(|e| e.contains("drift-done-item-plan-running")));

    // Item in-flight with all citing plans ended
    let inflight_item = format_backlog_item(&BacklogItemFields {
        id: "p-rw5iadsp2p",
        title: "Inflight Item",
        status: "in-flight",
        priority: "P1",
        area: "portfolio",
        created: "2026-11-21",
        why: "Why",
        done_when: "Done",
        notes: "Notes",
    })
    .unwrap();
    fs::write(backlog_dir.join("p-rw5iadsp2p-item.md"), inflight_item).unwrap();

    let done_plan_text = r#"---
contract: plan-v1
title: Done Plan
status: done
source:
  - p-rw5iadsp2p
---
"#;
    fs::write(plan_dir.join("plan.md"), done_plan_text).unwrap();

    let report2 = check_portfolio(
        &dir,
        &CheckOptions {
            check_index: false,
            ..Default::default()
        },
    )
    .unwrap();
    assert!(!report2.ok);
    assert!(report2
        .errors
        .iter()
        .any(|e| e.contains("drift-in-flight-plans-ended")));

    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn test_check_portfolio_index_drift() {
    let dir = temp_dir("portfolio-check-index-drift");
    let backlog_dir = dir.join("plans").join("backlog");
    fs::create_dir_all(&backlog_dir).unwrap();

    let item_text = format_backlog_item(&BacklogItemFields {
        id: "p-rw5iadsp2p",
        title: "Item",
        status: "proposed",
        priority: "P1",
        area: "portfolio",
        created: "2026-11-21",
        why: "Why",
        done_when: "Done",
        notes: "Notes",
    })
    .unwrap();
    fs::write(backlog_dir.join("p-rw5iadsp2p-item.md"), item_text).unwrap();

    // Missing index
    let report_missing = check_portfolio(
        &dir,
        &CheckOptions {
            check_index: true,
            ..Default::default()
        },
    )
    .unwrap();
    assert!(!report_missing.ok);
    assert!(report_missing
        .errors
        .iter()
        .any(|e| e.contains("index-missing")));

    // Stale index
    fs::write(dir.join("plans").join("backlog.md"), "# Stale index\n").unwrap();
    let report_drift = check_portfolio(
        &dir,
        &CheckOptions {
            check_index: true,
            ..Default::default()
        },
    )
    .unwrap();
    assert!(!report_drift.ok);
    assert!(report_drift
        .errors
        .iter()
        .any(|e| e.contains("index-drift")));

    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn test_classify_backlog_ref_reads_each_id_shape_once() {
    use fgos_supervision::land::BacklogRef;
    for (src, want) in [
        ("p-aaaaaaaaaa", BacklogRef::Minted),
        ("p-0123abcd", BacklogRef::Legacy),
        ("STR12", BacklogRef::Legacy),
        ("wf-some-flow", BacklogRef::Legacy),
        ("p-XYZ", BacklogRef::Invalid),
        ("docs/discussions/x/DISCUSSION.md", BacklogRef::NotBacklog),
    ] {
        assert_eq!(portfolio::classify_backlog_ref(src), want, "{src}");
    }
}
