//! The watcher's trigger and pace definitions (`core/watcher/**`), run through the real Observe query over test-local
//! records: each one answers exactly one row on its matching fixture and none on its non-matching one. No supervision
//! code names any of them; detection is the files.

use fgos_observe::metrics_cli::query::dispatch_query;
use fgos_observe::metrics_cli::RecordEnvironment;
use fgos_observe::record::registry::EmbeddedDeclaration;
use fgos_observe::record::store::{RecordDoor, WriteOutcome};
use fgos_observe::record::types::Record;
use fgos_observe::{ObserveRequest, RecordSource};
use serde_json::{json, Value};
use std::path::{Path, PathBuf};

const RAISED: [&str; 14] = [
    "main-notes-outrun-code",
    "plan-became-ready",
    "plan-done",
    "plan-drafted",
    "plan-priority-changed",
    "plan-ready-waiting",
    "lane-freed",
    "lead-ended",
    "discussion-settled",
    "supervisor-wake-failed",
    "supervisor-stuck",
    "session-gone",
    "session-idle",
    "session-no-result",
];
const QUESTIONS: [&str; 1] = ["question-answered"];
const PACE: [&str; 3] = ["watcher-active", "watcher-overdue", "supervisor-idle-burn"];
const SUPERVISION_KINDS: &str = include_str!("../observe-kinds.json");

fn repo() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../..")
}

fn definitions_dir() -> PathBuf {
    repo().join("core/watcher/definitions")
}

fn questions_dir() -> PathBuf {
    repo().join("core/questions/definitions")
}

fn pace_dir() -> PathBuf {
    repo().join("core/watcher/pace")
}

fn fixtures() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/definitions")
}

fn definition_file(name: &str) -> PathBuf {
    let dir = if name == "head-gone" {
        repo().join("core/attention/definitions")
    } else if PACE.contains(&name) {
        pace_dir()
    } else if QUESTIONS.contains(&name) {
        questions_dir()
    } else {
        definitions_dir()
    };
    dir.join(format!("{name}.query.json"))
}

/// The store's health declaration, and a fixed config value per key.
struct TestEnvironment {
    config: Vec<(String, f64)>,
}

impl RecordEnvironment for TestEnvironment {
    fn embedded_declarations(&self) -> Vec<EmbeddedDeclaration> {
        vec![
            fgos_observe::record::store::HEALTH_DECLARATION,
            fgos_supervision::watcher::REVIEW_DECLARATION,
        ]
    }
    fn payload_root(&self) -> Option<PathBuf> {
        None
    }
    fn record_sources(&self) -> Vec<Box<dyn RecordSource>> {
        Vec::new()
    }
    fn config_number(&self, _: &Path, key: &str) -> Result<Option<f64>, String> {
        Ok(self.config.iter().find(|(k, _)| k == key).map(|(_, v)| *v))
    }
}

fn environment(config: &[(&str, f64)]) -> TestEnvironment {
    TestEnvironment {
        config: config.iter().map(|(k, v)| ((*k).to_owned(), *v)).collect(),
    }
}

fn scratch(name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!(
        "fgos-supervision-definitions-{name}-{}",
        std::process::id()
    ));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

/// The declarations of the upstream kinds, read from the files that own them.
const UPSTREAM_KINDS: [(&str, &str); 4] = [
    (
        "questions.json",
        "packages/questions/rust/observe-kinds.json",
    ),
    ("heads-and-plans.json", "apps/fgos/observe-kinds.json"),
    ("runs.json", "packages/run-result/rust/observe-kinds.json"),
    (
        "transcripts.json",
        "packages/observe/rust/transcript-kinds.json",
    ),
];

/// A project root holding the upstream kinds as their owners declare them, this crate's own kinds and `lines`.
fn project(name: &str, lines: &[String], declared: bool) -> PathBuf {
    let root = scratch(name);
    if declared {
        let kinds = root.join(".fgos/observe/kinds");
        std::fs::create_dir_all(&kinds).unwrap();
        for (name, owner) in UPSTREAM_KINDS {
            std::fs::copy(repo().join(owner), kinds.join(name)).unwrap();
        }
        std::fs::write(kinds.join("supervision.json"), SUPERVISION_KINDS).unwrap();
        let door = RecordDoor::new(root.clone(), environment(&[]).embedded_declarations(), None);
        for line in lines {
            let record: Record = serde_json::from_str(line).unwrap();
            assert_eq!(door.write(record), WriteOutcome::Written, "{line}");
        }
    }
    root
}

fn fixture_lines(name: &str, file: &str) -> Vec<String> {
    std::fs::read_to_string(fixtures().join(name).join(file))
        .unwrap()
        .lines()
        .map(str::to_owned)
        .collect()
}

fn expected(name: &str) -> Value {
    serde_json::from_str(
        &std::fs::read_to_string(fixtures().join(name).join("expected.json")).unwrap(),
    )
    .unwrap()
}

fn query(root: &Path, args: &[&str], env: &TestEnvironment) -> Value {
    let request = ObserveRequest {
        operation: "observe.metrics".to_owned(),
        sub: "query".to_owned(),
        args: args.iter().map(|a| (*a).to_owned()).collect(),
        root: root.to_path_buf(),
        stdin: None,
    };
    dispatch_query(&request, env).unwrap()
}

/// The single definition `name`, answered over `root` at `now`. `since` is the lookback the watcher passes as
/// `--since`; a definition whose window is its own ignores it.
fn answer(root: &Path, name: &str, now: &str, since: Option<&str>, env: &TestEnvironment) -> Value {
    let file = definition_file(name);
    let mut args = vec!["--def", file.to_str().unwrap(), "--now", now];
    if let Some(since) = since {
        args.extend(["--since", since]);
    }
    let all = query(root, &args, env);
    let found: Vec<&Value> = all["definitions"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|d| d["name"] == name)
        .collect();
    assert_eq!(found.len(), 1, "one answer named {name}");
    found[0].clone()
}

fn rows(answer: &Value) -> &Vec<Value> {
    assert!(answer["unmeasured"].is_null(), "{answer}");
    assert!(answer["error"].is_null(), "{answer}");
    answer["rows"].as_array().unwrap()
}

fn millis(stamp: &str) -> i64 {
    // `YYYY-MM-DDTHH:MM:SS[.fff]Z`, civil-to-days from the proleptic Gregorian calendar.
    let n = |from: usize, to: usize| stamp[from..to].parse::<i64>().unwrap();
    let (y, m, d) = (n(0, 4), n(5, 7), n(8, 10));
    let (y, m) = if m <= 2 { (y - 1, m + 9) } else { (y, m - 3) };
    let era = y.div_euclid(400);
    let yoe = y - era * 400;
    let doy = (153 * m + 2) / 5 + d - 1;
    let days = era * 146_097 + yoe * 365 + yoe / 4 - yoe / 100 + doy - 719_468;
    ((days * 24 + n(11, 13)) * 60 + n(14, 16)) * 60_000 + n(17, 19) * 1000
}

fn stamp(millis: i64) -> String {
    let secs = millis / 1000;
    let (days, rem) = (secs.div_euclid(86_400), secs.rem_euclid(86_400));
    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = yoe + era * 400 + i64::from(m <= 2);
    format!(
        "{y:04}-{m:02}-{d:02}T{:02}:{:02}:{:02}.000Z",
        rem / 3600,
        rem % 3600 / 60,
        rem % 60
    )
}

/// The instant a row stands for, which is the id of its event (the README's row-to-event rule): the run's first
/// record (`min:ts`) when the row has one, else the end of the newest span (`max:end`), else the newest record
/// (`max:ts`).
fn row_ts(row: &Value) -> String {
    let aggs = &row["aggs"];
    ["min:ts", "max:end", "max:ts"]
        .iter()
        .find_map(|key| aggs.get(*key).and_then(Value::as_str))
        .map(|instant| stamp(millis(instant)))
        .unwrap()
}

/// Is the definition's window its own, so the caller's `--since` does not cut it?
fn own_window(name: &str) -> bool {
    let file: Value =
        serde_json::from_str(&std::fs::read_to_string(definition_file(name)).unwrap()).unwrap();
    file["window"] == "own"
}

fn config_of(expected: &Value) -> Vec<(String, f64)> {
    expected["config"]
        .as_object()
        .map(|c| {
            c.iter()
                .map(|(k, v)| (k.clone(), v.as_f64().unwrap()))
                .collect()
        })
        .unwrap_or_default()
}

fn group_of(row: &Value) -> Value {
    row["group"].clone()
}

#[test]
fn every_shipped_definition_has_a_fixture_pair_or_review_snapshot_proof_and_none_is_missing() {
    for (dir, names) in [
        (definitions_dir(), &RAISED[..]),
        (questions_dir(), &QUESTIONS[..]),
        (pace_dir(), &PACE[..]),
    ] {
        let mut found: Vec<String> = std::fs::read_dir(&dir)
            .unwrap()
            .map(|e| e.unwrap().file_name().into_string().unwrap())
            .map(|n| n.strip_suffix(".query.json").unwrap().to_owned())
            .collect();
        found.sort();
        let mut want: Vec<&str> = names.to_vec();
        if dir == definitions_dir() {
            want.push("review-due");
        }
        want.sort_unstable();
        assert_eq!(found, want, "{}", dir.display());
    }
    for name in RAISED.iter().chain(QUESTIONS.iter()).chain(PACE.iter()) {
        for file in ["records.jsonl", "nomatch.jsonl", "expected.json"] {
            assert!(fixtures().join(name).join(file).is_file(), "{name}/{file}");
        }
    }
}

#[test]
fn a_raised_definition_carries_its_row_template_and_a_pace_definition_carries_none() {
    for name in RAISED
        .iter()
        .chain(QUESTIONS.iter())
        .chain(["review-due"].iter())
    {
        let text = std::fs::read_to_string(definition_file(name)).unwrap();
        let file: Value = serde_json::from_str(&text).unwrap();
        assert_eq!(file["row"]["kind"], *name);
        assert!(!file["row"]["reason"].as_str().unwrap().is_empty());
        assert!(file["row"]["nextCommand"]
            .as_str()
            .unwrap()
            .starts_with("fgos "));
        assert!(
            file["window"] == "own"
                || (file["query"]["until"].is_null() && file["query"]["since"].is_null()),
            "{name}: the watcher owns the window unless the definition bounds itself"
        );
    }
    for name in PACE {
        let file: Value =
            serde_json::from_str(&std::fs::read_to_string(definition_file(name)).unwrap()).unwrap();
        assert!(file["row"].is_null(), "{name}");
    }
}

#[test]
fn each_definition_gives_exactly_one_row_on_its_matching_fixture_and_none_on_the_other() {
    for name in RAISED.iter().chain(QUESTIONS.iter()).chain(PACE.iter()) {
        let want = expected(name);
        let env = TestEnvironment {
            config: config_of(&want),
        };
        let now = want["now"].as_str().unwrap();
        let since = want["since"].as_str();

        let matching = project(
            &format!("{name}-match"),
            &fixture_lines(name, "records.jsonl"),
            true,
        );
        let got = answer(&matching, name, now, since, &env);
        let found = rows(&got);
        assert_eq!(found.len(), 1, "{name} on its matching fixture: {got}");
        assert_eq!(group_of(&found[0]), want["group"], "{name}");
        if !PACE.contains(name) {
            // The watcher drops a row it cannot name or date, so every raised definition's row carries both.
            let aggs = &found[0]["aggs"];
            assert!(
                ["min:ts", "max:end", "max:ts"]
                    .iter()
                    .any(|k| aggs.get(*k).and_then(Value::as_str).is_some()),
                "{name}: the row carries no instant: {}",
                found[0]
            );
            let group = &found[0]["group"];
            assert!(
                group["origin.host"].is_string() || group["subject.id"].is_string(),
                "{name}: the row carries no subject: {}",
                found[0]
            );
        }
        if let Some(ts) = want["ts"].as_str() {
            assert_eq!(row_ts(&found[0]), ts.replace("Z", ".000Z"), "{name}");
        }

        let other = project(
            &format!("{name}-nomatch"),
            &fixture_lines(name, "nomatch.jsonl"),
            true,
        );
        let got = answer(&other, name, now, since, &env);
        assert!(rows(&got).is_empty(), "{name} on its other fixture: {got}");
    }
}

#[test]
fn a_matching_fixture_run_again_over_an_overlapping_window_gives_the_same_subject_and_instant() {
    for name in RAISED {
        let want = expected(name);
        let env = TestEnvironment {
            config: config_of(&want),
        };
        let root = project(
            &format!("{name}-twice"),
            &fixture_lines(name, "records.jsonl"),
            true,
        );
        let first = answer(
            &root,
            name,
            want["now"].as_str().unwrap(),
            want["since"].as_str(),
            &env,
        );
        let second = answer(
            &root,
            name,
            want["later"]["now"].as_str().unwrap(),
            want["later"]["since"].as_str(),
            &env,
        );
        if own_window(name) {
            // The later window starts after the run's first record: the instant holds because the caller's window
            // never cuts this definition.
            let later_since = millis(want["later"]["since"].as_str().unwrap());
            let first_record = millis(want["ts"].as_str().unwrap());
            assert!(
                later_since > first_record,
                "{name}: the later window starts past the run's first record"
            );
        }
        let (a, b) = (&rows(&first)[0], &rows(&second)[0]);
        assert_eq!(group_of(a), group_of(b), "{name}");
        assert_eq!(row_ts(a), row_ts(b), "{name}");
        assert_ne!(
            want["since"], want["later"]["since"],
            "{name}: the windows differ"
        );
    }
}

#[test]
fn a_definition_whose_required_kind_is_undeclared_is_unmeasured_not_zero_rows() {
    let bare = project("undeclared", &[], false);
    for name in RAISED.iter().chain(PACE.iter()) {
        let file: Value =
            serde_json::from_str(&std::fs::read_to_string(definition_file(name)).unwrap()).unwrap();
        let first = file["requires"][0].as_str().unwrap();
        let got = answer(
            &bare,
            name,
            "2026-11-18T12:00:00Z",
            None,
            &environment(&[
                ("watcher.wakeFailureLimit", 3.0),
                ("watcher.stuckWakeLimit", 4.0),
                ("watcher.overdueFactor", 3.0),
                ("watcher.sessionGoneLimit", 0.0),
                ("watcher.sessionIdleLimit", 0.0),
                ("watcher.sessionNoResultLimit", 0.0),
            ]),
        );
        assert_eq!(
            got["unmeasured"],
            format!("kind-undeclared: {first}"),
            "{name}"
        );
        assert!(got["rows"].as_array().is_none_or(Vec::is_empty), "{name}");
    }
}

#[test]
fn the_failure_limits_come_from_config_and_a_count_at_the_limit_raises_nothing() {
    for (name, key, count) in [
        ("supervisor-wake-failed", "watcher.wakeFailureLimit", 4.0),
        ("supervisor-stuck", "watcher.stuckWakeLimit", 5.0),
    ] {
        let want = expected(name);
        let root = project(
            &format!("{name}-limit"),
            &fixture_lines(name, "records.jsonl"),
            true,
        );
        let now = want["now"].as_str().unwrap();
        let since = want["since"].as_str();
        let rows_at = |limit: f64| {
            let got = answer(&root, name, now, since, &environment(&[(key, limit)]));
            rows(&got).len()
        };
        assert_eq!(rows_at(count - 1.0), 1, "{name} above the limit");
        assert_eq!(rows_at(count), 0, "{name} at the limit");
        assert_eq!(rows_at(count + 10.0), 0, "{name} under the limit");

        let unset = answer(&root, name, now, since, &environment(&[]));
        assert_eq!(
            unset["unmeasured"],
            format!("config-unset: {key}"),
            "{name}"
        );
    }
}

fn main_commit_line(id: usize, ts: &str, kind: &str, note: u32) -> String {
    json!({
        "v": 2, "id": format!("main-commit:{id}"), "kind": "fgos.main.commit", "ts": ts,
        "subject": { "kind": "branch", "id": "branch:main" },
        "attrs": { "fgos.main.commit.kind": kind },
        "measures": { format!("fgos.main.commit.{kind}"): 1, "fgos.main.commit.note": note },
        "basis": "observed", "origin": { "source": "fixture" }
    })
    .to_string()
}

#[test]
fn a_main_commits_hour_over_the_rate_alone_raises_one_row_and_an_unset_threshold_key_is_unmeasured()
{
    // Thirteen code commits in one clock hour: a note share of 0, so only the rate branch holds.
    let lines: Vec<String> = (0..13)
        .map(|i| main_commit_line(i, &format!("2026-11-18T11:{:02}:00Z", 5 + i), "code", 0))
        .collect();
    let root = project("main-commits-rate", &lines, true);
    let keys = [
        "watcher.mainCommits.noteShareMax",
        "watcher.mainCommits.perHourMax",
        "watcher.mainCommits.minForShare",
    ];
    let config = |rate: f64| [(keys[0], 0.5), (keys[1], rate), (keys[2], 6.0)];
    let at = |config: &[(&str, f64)]| {
        answer(
            &root,
            "main-notes-outrun-code",
            "2026-11-18T12:00:00Z",
            Some("2026-11-18T11:00:00Z"),
            &environment(config),
        )
    };
    assert_eq!(rows(&at(&config(12.0))).len(), 1, "over the rate");
    assert_eq!(rows(&at(&config(13.0))).len(), 0, "at the rate");
    for unset in keys {
        let kept: Vec<(&str, f64)> = config(12.0)
            .into_iter()
            .filter(|(k, _)| *k != unset)
            .collect();
        assert_eq!(
            at(&kept)["unmeasured"],
            format!("config-unset: {unset}"),
            "{unset}"
        );
    }

    // A closed hour of two note commits is under the sample minimum and the rate: nothing raises.
    let quiet: Vec<String> = (0..2)
        .map(|i| {
            main_commit_line(
                i,
                &format!("2026-11-18T11:{:02}:00Z", 5 + i),
                "plan-note",
                1,
            )
        })
        .collect();
    let root = project("main-commits-all-notes", &quiet, true);
    let got = answer(
        &root,
        "main-notes-outrun-code",
        "2026-11-18T12:00:00Z",
        Some("2026-11-18T11:00:00Z"),
        &environment(&config(12.0)),
    );
    assert!(rows(&got).is_empty(), "two notes: {got}");
}

// This projection has no historical fixture pair: its absence watermark and open-work inputs
// are tested here through the real query, where the other definitions' fixtures cannot prove it.
#[test]
fn review_due_obeys_its_success_watermark_and_skips_only_a_quiet_closed_project() {
    use fgos_supervision::watcher::review_state_record;
    let now = "2026-11-18T12:00:00Z";
    for (name, done, open, event, count) in [
        ("absent", None, false, false, 1),
        ("fresh", Some("2026-11-18T11:59:00Z"), true, true, 0),
        (
            "old-open-plan",
            Some("2026-11-16T12:00:00Z"),
            true,
            false,
            1,
        ),
        (
            "old-open-question",
            Some("2026-11-16T12:00:00Z"),
            true,
            false,
            1,
        ),
        ("old-event", Some("2026-11-16T12:00:00Z"), false, true, 1),
        ("old-quiet", Some("2026-11-16T12:00:00Z"), false, false, 0),
        ("at-interval", Some("2026-11-17T12:00:00Z"), true, false, 1),
    ] {
        let record = review_state_record(done, open, event);
        let root = project(
            &format!("review-{name}"),
            &[serde_json::to_string(&record).unwrap()],
            true,
        );
        let env = environment(&[("watcher.reviewIntervalSec", 86400.0)]);
        let got = answer(&root, "review-due", now, Some("2026-11-18T11:00:00Z"), &env);
        assert_eq!(rows(&got).len(), count, "{name}: {got}");
        if count > 0 {
            assert_eq!(rows(&got)[0]["group"]["subject.id"], "periodic-review");
            assert_eq!(row_ts(&rows(&got)[0]), stamp(millis(&record.ts)));
        }
        if name == "at-interval" {
            let longer = answer(
                &root,
                "review-due",
                now,
                None,
                &environment(&[("watcher.reviewIntervalSec", 90000.0)]),
            );
            assert!(rows(&longer).is_empty(), "the interval is config-owned");
            let unset = answer(&root, "review-due", now, None, &environment(&[]));
            assert_eq!(
                unset["unmeasured"],
                "config-unset: watcher.reviewIntervalSec"
            );
        }
    }
}

fn tick_line(id: &str, ts: &str, interval: u32, running: u32) -> String {
    json!({
        "v": 2, "id": id, "kind": "fgos.watcher.tick", "ts": ts,
        "subject": { "kind": "session", "id": "w1" },
        "measures": { "fgos.watcher.interval": interval, "fgos.plans.running": running, "fgos.plans.ready": 0 },
        "basis": "observed", "origin": { "source": "fixture" }
    })
    .to_string()
}

#[test]
fn the_watcher_is_overdue_only_past_the_factor_times_its_interval_and_only_while_a_plan_runs() {
    let rows_for = |name: &str, last_tick: &str, interval: u32, running: u32| {
        let root = project(name, &[tick_line("t1", last_tick, interval, running)], true);
        let got = answer(
            &root,
            "watcher-overdue",
            "2026-11-18T12:00:00Z",
            None,
            &environment(&[("watcher.overdueFactor", 3.0)]),
        );
        rows(&got).len()
    };
    // The interval is 60 s and the factor 3: three minutes is the edge.
    assert_eq!(rows_for("overdue-fresh", "2026-11-18T11:58:00Z", 60, 1), 0);
    assert_eq!(rows_for("overdue-late", "2026-11-18T11:56:00Z", 60, 1), 1);
    assert_eq!(rows_for("overdue-idle", "2026-11-18T09:00:00Z", 60, 0), 0);
    // A longer interval in force moves the edge with it.
    assert_eq!(rows_for("overdue-slow", "2026-11-18T11:50:00Z", 600, 1), 0);
}

#[test]
fn the_overdue_factor_comes_from_config_and_an_unset_key_is_unmeasured() {
    let root = project(
        "overdue-factor",
        &[tick_line("t1", "2026-11-18T11:56:00Z", 60, 1)],
        true,
    );
    let rows_at = |factor: f64| {
        let got = answer(
            &root,
            "watcher-overdue",
            "2026-11-18T12:00:00Z",
            None,
            &environment(&[("watcher.overdueFactor", factor)]),
        );
        rows(&got).len()
    };
    // The newest tick is four minutes old and the interval a minute.
    assert_eq!(rows_at(3.0), 1);
    assert_eq!(rows_at(5.0), 0);
    let unset = answer(
        &root,
        "watcher-overdue",
        "2026-11-18T12:00:00Z",
        None,
        &environment(&[]),
    );
    assert_eq!(unset["unmeasured"], "config-unset: watcher.overdueFactor");
}

fn head_line(id: &str, ts: &str, head: &str, state: &str, role: &str) -> String {
    json!({
        "v": 2, "id": id, "kind": "fgos.head.state", "ts": ts,
        "subject": { "kind": "head", "id": head },
        "attrs": { "fgos.head.state": state, "fgos.head.role": role },
        "basis": "observed", "origin": { "source": "fixture" }
    })
    .to_string()
}

#[test]
fn a_lead_is_recognised_by_either_role_form_and_a_non_lead_head_is_never_one() {
    for (role, counted) in [
        ("head:lead-ops", 1),
        ("lead:OPS", 1),
        ("head:secretary-miu", 0),
        ("head:supervisor-sv", 0),
    ] {
        let name = format!("lead-role-{}", role.replace(':', "-"));
        let retired = project(
            &name,
            &[head_line(
                "h1",
                "2026-11-18T11:00:00Z",
                "h1",
                "retired",
                role,
            )],
            true,
        );
        let ended = answer(
            &retired,
            "lead-ended",
            "2026-11-18T12:00:00Z",
            None,
            &environment(&[]),
        );
        assert_eq!(rows(&ended).len(), counted, "{role} retired");

        let closed = project(
            &format!("{name}-ended"),
            &[head_line("h1", "2026-11-18T11:00:00Z", "h1", "ended", role)],
            true,
        );
        let closed_rows = answer(
            &closed,
            "lead-ended",
            "2026-11-18T12:00:00Z",
            None,
            &environment(&[]),
        );
        assert_eq!(rows(&closed_rows).len(), counted, "{role} ended");

        let live = project(
            &format!("{name}-live"),
            &[
                // The definition reads both kinds, so a source must serve each; this plan is merely ready.
                json!({
                    "v": 2, "id": "p1", "kind": "fgos.plan.status", "ts": "2026-11-18T10:00:00Z",
                    "subject": { "kind": "plan", "id": "plans/p1" },
                    "attrs": { "fgos.plan.change": "status", "fgos.plan.to": "ready" },
                    "basis": "observed", "origin": { "source": "fixture" }
                })
                .to_string(),
                head_line("h1", "2026-11-18T11:00:00Z", "h1", "live", role),
            ],
            true,
        );
        let active = answer(
            &live,
            "watcher-active",
            "2026-11-18T12:00:00Z",
            None,
            &environment(&[]),
        );
        assert_eq!(rows(&active).len(), counted, "{role} live");
    }
}

#[test]
fn an_ended_head_raises_session_gone_and_head_gone_like_a_gone_one_unless_it_is_a_lead() {
    // (role, state, rows each definition raises): a lead that ended belongs to lead-ended only.
    for (role, state, raised) in [
        ("head:shaper-x", "gone", 1),
        ("head:shaper-x", "ended", 1),
        ("head:planner-x", "ended", 1),
        ("head:secretary-miu", "ended", 1),
        ("head:supervisor-sv", "ended", 1),
        ("head:lead-ops", "ended", 0),
        ("lead:OPS", "ended", 0),
        ("head:shaper-x", "live", 0),
    ] {
        let name = format!("ended-{}-{state}", role.replace(':', "-"));
        let root = project(
            &name,
            &[
                head_line("h0", "2026-11-18T09:00:00Z", "h1", "live", role),
                head_line("h1", "2026-11-18T11:00:00Z", "h1", state, role),
            ],
            true,
        );
        let env = environment(&[("watcher.sessionGoneLimit", 0.0)]);
        let session_gone = answer(
            &root,
            "session-gone",
            "2026-11-18T12:00:00Z",
            Some("2026-11-18T10:00:00Z"),
            &env,
        );
        assert_eq!(
            rows(&session_gone).len(),
            raised,
            "{role} {state} session-gone"
        );
        let head_gone = answer(&root, "head-gone", "2026-11-18T12:00:00Z", None, &env);
        assert_eq!(rows(&head_gone).len(), raised, "{role} {state} head-gone");
    }
}

#[test]
fn a_head_whose_supervisor_is_gone_raises_session_gone() {
    // The session-gone definition matches supervisor-gone; head-gone is not asserted here.
    let root = project(
        "supervisor-gone-shaper",
        &[
            head_line("h0", "2026-11-18T09:00:00Z", "h1", "live", "head:shaper-x"),
            head_line(
                "h1",
                "2026-11-18T11:00:00Z",
                "h1",
                "supervisor-gone",
                "head:shaper-x",
            ),
        ],
        true,
    );
    let env = environment(&[("watcher.sessionGoneLimit", 0.0)]);
    let session_gone = answer(
        &root,
        "session-gone",
        "2026-11-18T12:00:00Z",
        Some("2026-11-18T10:00:00Z"),
        &env,
    );
    assert_eq!(rows(&session_gone).len(), 1, "supervisor-gone session-gone");
}
