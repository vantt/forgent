//! Proofs of the head and plan sources: plan transitions from a fixture repository through the Git door, and head
//! state from a fake owner pair (the real Session Host needs a terminal).

use super::head_state::{HeadFacts, HeadStateSource};
use super::plan_history::PlanHistorySource;
use fgos_observe::record::types::{AttrValue, Record};
use fgos_observe::{RecordSource, Window};
use fgos_session_host::{Liveness, Placement};
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::process::Command;

fn scratch(name: &str) -> PathBuf {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let dir = std::env::temp_dir().join(format!(
        "fgos-sources-{name}-{}-{nanos}",
        std::process::id()
    ));
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

fn git(dir: &Path, args: &[&str]) {
    let out = Command::new("git")
        .current_dir(dir)
        .args([
            "-c",
            "user.name=t",
            "-c",
            "user.email=t@t",
            "-c",
            "commit.gpgsign=false",
        ])
        .args(args)
        .env("GIT_CONFIG_GLOBAL", "/dev/null")
        .env("GIT_CONFIG_SYSTEM", "/dev/null")
        .output()
        .unwrap();
    assert!(
        out.status.success(),
        "git {args:?}: {}",
        String::from_utf8_lossy(&out.stderr)
    );
}

fn plan_text(status: &str, priority: &str) -> String {
    format!(
        "---\ncontract: plan-v1\ntitle: t\nstatus: {status}\npriority: {priority}\n---\n\n# Plan\n"
    )
}

fn commit_plan(repo: &Path, dir: &str, status: &str, priority: &str) {
    let path = repo.join("plans").join(dir);
    std::fs::create_dir_all(&path).unwrap();
    std::fs::write(path.join("plan.md"), plan_text(status, priority)).unwrap();
    git(repo, &["add", "-A"]);
    git(
        repo,
        &["commit", "-m", &format!("plan {status} {priority}")],
    );
}

fn attr<'a>(record: &'a Record, name: &str) -> Option<&'a str> {
    match record.attrs.get(name) {
        Some(AttrValue::Str(s)) => Some(s),
        _ => None,
    }
}

fn all_time() -> Window {
    Window {
        since: None,
        until: None,
    }
}

#[test]
fn a_plan_going_draft_ready_running_done_with_one_priority_change_gives_four_transitions() {
    let repo = scratch("plan");
    git(&repo, &["init", "-q", "-b", "main"]);
    let dir = "261118-0936-fixture";
    commit_plan(&repo, dir, "draft", "P2");
    commit_plan(&repo, dir, "ready", "P2");
    commit_plan(&repo, dir, "ready", "P1");
    commit_plan(&repo, dir, "running", "P1");
    commit_plan(&repo, dir, "done", "P1");

    let records = PlanHistorySource::with_state_root(repo.join(".fgos-state"))
        .records(&repo, &all_time())
        .unwrap();
    let mut transitions: Vec<(String, String, String)> = records
        .iter()
        .filter(|r| r.kind == "fgos.plan.status")
        .map(|r| {
            assert_eq!(r.subject.id, dir);
            (
                attr(r, "fgos.plan.change").unwrap().to_owned(),
                attr(r, "fgos.plan.from").unwrap().to_owned(),
                attr(r, "fgos.plan.to").unwrap().to_owned(),
            )
        })
        .collect();
    transitions.sort();
    let expect = |c: &str, f: &str, t: &str| (c.to_owned(), f.to_owned(), t.to_owned());
    assert_eq!(
        transitions,
        [
            expect("priority", "P2", "P1"),
            expect("status", "draft", "ready"),
            expect("status", "ready", "running"),
            expect("status", "running", "done"),
        ]
    );
    let activity = records
        .iter()
        .filter(|r| r.kind == "fgos.plan.activity")
        .count();
    assert_eq!(
        activity, 4,
        "one activity record per commit after the creating one"
    );

    let again = PlanHistorySource::with_state_root(repo.join(".fgos-state"))
        .records(&repo, &all_time())
        .unwrap();
    let mut ids: Vec<&str> = records.iter().map(|r| r.id.as_str()).collect();
    let mut ids_again: Vec<&str> = again.iter().map(|r| r.id.as_str()).collect();
    ids.sort();
    ids_again.sort();
    assert_eq!(ids, ids_again, "ids are deterministic");
    let _ = std::fs::remove_dir_all(&repo);
}

#[test]
fn the_board_log_lines_naming_an_existing_plan_dir_are_activity() {
    let repo = scratch("board");
    git(&repo, &["init", "-q", "-b", "main"]);
    let dir = "261118-0936-fixture";
    commit_plan(&repo, dir, "ready", "P1");
    let board = repo.join("plans/261017-1313-fgos-platform-program-board");
    std::fs::create_dir_all(&board).unwrap();
    std::fs::write(
        board.join("log.md"),
        format!(
            "# log\n\n - 2026-11-18 15:15 OPS: p08 landed for plans/{dir}\n - 2026-11-18 15:10 OPS: names plans/261118-9999-missing only\n"
        ),
    )
    .unwrap();
    let records = PlanHistorySource::with_state_root(repo.join(".fgos-state"))
        .records(&repo, &all_time())
        .unwrap();
    let logged: Vec<&Record> = records
        .iter()
        .filter(|r| attr(r, "fgos.plan.activity.source") == Some("board-log"))
        .collect();
    assert_eq!(logged.len(), 1);
    assert_eq!(logged[0].subject.id, dir);
    assert_eq!(attr(logged[0], "fgos.board.lane"), Some("OPS"));
    let _ = std::fs::remove_dir_all(&repo);
}

struct FakeOwners {
    answer: Liveness,
}

impl HeadFacts for FakeOwners {
    fn alive(&self, _: &Placement, _: &Path) -> Liveness {
        self.answer
    }
    fn identity_roles(&self) -> BTreeMap<String, &'static str> {
        BTreeMap::from([("head:planner-x".to_owned(), "alive")])
    }
}

fn head_records(answer: Liveness) -> Vec<Record> {
    let root = scratch("head");
    let lineage = root.join(".fgos/runtime/session-rotation/planner-x");
    std::fs::create_dir_all(&lineage).unwrap();
    std::fs::write(
        lineage.join("placement.json"),
        r#"{"role":"head:planner-x","gen":2,"placement":{"host":"terminal","key":"cmd_1_abc"},"runDir":"/nowhere","persona":"planner","startedAt":"2026-11-18T06:58:44.815Z"}"#,
    )
    .unwrap();
    let records = HeadStateSource::with_facts(Box::new(FakeOwners { answer }))
        .records(&root, &all_time())
        .unwrap();
    let _ = std::fs::remove_dir_all(&root);
    records
}

#[test]
fn a_placement_whose_host_reports_gone_gives_gone_with_the_identity_view_alongside() {
    let records = head_records(Liveness::Gone);
    assert_eq!(records.len(), 1);
    assert_eq!(records[0].subject.id, "head:planner-x");
    assert_eq!(attr(&records[0], "fgos.head.state"), Some("gone"));
    assert_eq!(attr(&records[0], "fgos.head.identity"), Some("alive"));
    assert_eq!(attr(&records[0], "fgos.head.persona"), Some("planner"));
}

#[test]
fn an_unknown_host_answer_stays_unknown_and_a_live_one_is_live() {
    assert_eq!(
        attr(&head_records(Liveness::Unknown)[0], "fgos.head.state"),
        Some("unknown")
    );
    assert_eq!(
        attr(&head_records(Liveness::Live)[0], "fgos.head.state"),
        Some("live")
    );
}

#[test]
fn a_project_that_never_started_a_head_has_no_head_records() {
    let root = scratch("nohead");
    let records = HeadStateSource::with_facts(Box::new(FakeOwners {
        answer: Liveness::Live,
    }))
    .records(&root, &all_time())
    .unwrap();
    assert!(records.is_empty());
    let _ = std::fs::remove_dir_all(&root);
}
