//! The driving measures as definitions: the files under `domains/coding/observe/definitions`, run through
//! `fgos metrics query --def` over the kinds the composition root embeds, with run records projected from unit
//! summaries by the run source and plan status records from the record store. Observe names none of these measures;
//! this is the one place the run and plan kinds meet the definitions.

use fgos_observe::metrics_cli::query::dispatch_query;
use fgos_observe::metrics_cli::RecordEnvironment;
use fgos_observe::record::registry::EmbeddedDeclaration;
use fgos_observe::record::store::{RecordDoor, WriteOutcome};
use fgos_observe::record::types::Record;
use fgos_observe::{ObserveRequest, RecordSource};
use fgos_run_result::{RunProjectionSource, RUN_DECLARATION};
use serde_json::Value;
use std::path::{Path, PathBuf};

const NOW: &str = "2026-11-18T18:00:00Z";
const PLAN: &str = "plans/261118-1000-demo-plan";

fn repo() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../..")
}

/// The embedded list the host wires for run and plan kinds; the question and detection kinds are not declared.
struct DrivingEnvironment;

impl RecordEnvironment for DrivingEnvironment {
    fn embedded_declarations(&self) -> Vec<EmbeddedDeclaration> {
        vec![
            fgos_observe::record::store::HEALTH_DECLARATION,
            RUN_DECLARATION,
            EmbeddedDeclaration {
                label: "fgos",
                json: include_str!("../observe-kinds.json"),
            },
        ]
    }
    fn payload_root(&self) -> Option<PathBuf> {
        None
    }
    fn record_sources(&self) -> Vec<Box<dyn RecordSource>> {
        vec![Box::new(RunProjectionSource::new())]
    }
    fn config_number(&self, _: &Path, _: &str) -> Result<Option<f64>, String> {
        Ok(None)
    }
}

/// A project root holding the fixture unit summaries and the fixture plan status records.
fn project() -> PathBuf {
    let root = std::env::temp_dir().join(format!("fgos-driving-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&root);
    let fixtures = repo().join("test/fixtures/observe/driving");
    for entry in std::fs::read_dir(fixtures.join("units")).unwrap() {
        let file = entry.unwrap().path();
        let id = file.file_stem().unwrap().to_str().unwrap().to_owned();
        let dir = root.join(".fgos/assignments").join(id);
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::copy(&file, dir.join("unit-summary.json")).unwrap();
    }
    let door = RecordDoor::new(
        root.clone(),
        DrivingEnvironment.embedded_declarations(),
        None,
    );
    for line in std::fs::read_to_string(fixtures.join("plan-status.jsonl"))
        .unwrap()
        .lines()
    {
        let record: Record = serde_json::from_str(line).unwrap();
        assert_eq!(door.write(record), WriteOutcome::Written);
    }
    root
}

fn run_all(root: &Path) -> Value {
    let defs = repo().join("domains/coding/observe/definitions");
    let request = ObserveRequest {
        operation: "observe.metrics".to_owned(),
        sub: "query".to_owned(),
        args: ["--def", defs.to_str().unwrap(), "--now", NOW]
            .iter()
            .map(|a| (*a).to_owned())
            .collect(),
        root: root.to_path_buf(),
        stdin: None,
    };
    dispatch_query(&request, &DrivingEnvironment).unwrap()
}

fn answer<'a>(all: &'a Value, name: &str) -> &'a Value {
    all["definitions"]
        .as_array()
        .unwrap()
        .iter()
        .find(|d| d["name"] == name)
        .unwrap_or_else(|| panic!("no answer named {name}"))
}

/// The aggregate `agg` of the row whose group holds every `(key, value)` pair.
fn cell<'a>(answer: &'a Value, group: &[(&str, &str)], agg: &str) -> &'a Value {
    let row = answer["rows"]
        .as_array()
        .unwrap()
        .iter()
        .find(|r| group.iter().all(|(k, v)| r["group"][*k] == *v))
        .unwrap_or_else(|| panic!("no row for {group:?} in {answer}"));
    &row["aggs"][agg]
}

fn row<'a>(answer: &'a Value, group: &[(&str, &str)]) -> Option<&'a Value> {
    answer["rows"]
        .as_array()
        .unwrap()
        .iter()
        .find(|r| group.iter().all(|(k, v)| r["group"][*k] == *v))
}

#[test]
fn every_driving_definition_answers_its_numbers_or_names_why_it_is_unmeasured() {
    let root = project();
    let all = run_all(&root);
    assert_eq!(all["definitions"].as_array().unwrap().len(), 19);
    for def in all["definitions"].as_array().unwrap() {
        assert!(def["error"].is_null(), "{def}");
    }

    // Plan lead time: from the last move to ready to the done after it. Ready 09:00 to done 15:00 is six hours; a
    // plan that went ready again at 10:00 counts from there to its done at 14:00. A plan not yet done, and one
    // reopened to ready after its done, keep one matching record, below the minimum sample of two, and report no
    // value.
    let lead = answer(&all, "plan-lead-time");
    assert_eq!(cell(lead, &[("subject.id", PLAN)], "span"), 21600);
    assert_eq!(
        cell(
            lead,
            &[("subject.id", "plans/261118-0700-twice-ready")],
            "span"
        ),
        14400
    );
    for plan in [
        "plans/261118-0800-other-plan",
        "plans/261118-1200-waiting-plan",
        "plans/261118-0600-reopened",
    ] {
        let r = row(lead, &[("subject.id", plan)]).unwrap();
        assert_eq!(r["insufficient"], true, "{plan}");
    }

    // Phase time: the attempts' own durations, by plan and phase.
    let phase = answer(&all, "phase-time");
    for (name, ms) in [("1", 600_000), ("2", 1_320_000), ("3", 1_200_000)] {
        assert_eq!(
            cell(
                phase,
                &[("ref:plan", PLAN), ("ref:phase", name)],
                "sum:fgos.duration"
            ),
            ms
        );
    }

    // Tokens by plan, phase, provider, account and model, and per run.
    let tokens = answer(&all, "plan-tokens");
    let by = |ph: &'static str, p: &'static str, a: &'static str, m: &'static str| {
        cell(
            tokens,
            &[
                ("ref:plan", PLAN),
                ("ref:phase", ph),
                ("gen_ai.provider.name", p),
                ("fgos.account.id", a),
                ("gen_ai.request.model", m),
            ],
            "sum:fgos.usage.total_tokens",
        )
        .clone()
    };
    assert_eq!(by("1", "anthropic", "a1", "claude-x"), 1000);
    assert_eq!(by("2", "anthropic", "a1", "claude-x"), 2300);
    assert_eq!(by("2", "openai", "a2", "gpt-y"), 500);
    assert_eq!(by("3", "openai", "a2", "gpt-y"), 4000);
    let runs = answer(&all, "run-tokens");
    for (run, total) in [("run-b", 500), ("run-c", 2000), ("run-f", 700)] {
        assert_eq!(
            cell(runs, &[("subject.id", run)], "sum:fgos.usage.total_tokens"),
            total,
            "{run}"
        );
    }
    assert_eq!(
        cell(
            runs,
            &[("subject.id", "run-f")],
            "sum:gen_ai.usage.input_tokens"
        ),
        500
    );

    // Failure rate: counts per outcome, per plan and per provider, account, model and executor; the rate is the
    // reader's division.
    let failure = answer(&all, "plan-failure-rate");
    assert_eq!(
        cell(
            failure,
            &[("ref:plan", PLAN), ("fgos.outcome", "pass")],
            "count"
        ),
        4
    );
    assert_eq!(
        cell(
            failure,
            &[("ref:plan", PLAN), ("fgos.outcome", "fail")],
            "count"
        ),
        1
    );
    for (name, attr, value, pass, fail) in [
        (
            "failure-rate-by-provider",
            "gen_ai.provider.name",
            "openai",
            Some(1),
            Some(1),
        ),
        (
            "failure-rate-by-provider",
            "gen_ai.provider.name",
            "anthropic",
            Some(3),
            None,
        ),
        (
            "failure-rate-by-provider",
            "gen_ai.provider.name",
            "google",
            None,
            Some(1),
        ),
        (
            "failure-rate-by-account",
            "fgos.account.id",
            "a2",
            Some(1),
            Some(1),
        ),
        (
            "failure-rate-by-model",
            "gen_ai.request.model",
            "gpt-y",
            Some(1),
            Some(1),
        ),
        (
            "failure-rate-by-executor",
            "fgos.executor.id",
            "alpha",
            Some(4),
            Some(1),
        ),
        (
            "failure-rate-by-executor",
            "fgos.executor.id",
            "beta",
            None,
            Some(1),
        ),
    ] {
        let a = answer(&all, name);
        for (outcome, want) in [("pass", pass), ("fail", fail)] {
            let got =
                row(a, &[(attr, value), ("fgos.outcome", outcome)]).map(|r| &r["aggs"]["count"]);
            assert_eq!(
                got.cloned(),
                want.map(Value::from),
                "{name} {value} {outcome}"
            );
        }
    }

    // M1: the current status per plan, ignoring the later priority change.
    let completion = answer(&all, "m1-completion");
    for (status, plans) in [("done", 2), ("running", 1), ("ready", 2)] {
        assert_eq!(
            cell(completion, &[("fgos.plan.to", status)], "count"),
            plans,
            "{status}"
        );
    }

    // M2: worker time of passing attempts, failed runs, and the verify span; a verify that did not run is not
    // re-check time.
    assert_eq!(
        cell(
            answer(&all, "m2-worker-time"),
            &[("ref:plan", PLAN)],
            "sum:fgos.duration"
        ),
        2_820_000
    );
    let failed = answer(&all, "m2-failed-runs");
    assert_eq!(cell(failed, &[("ref:plan", PLAN)], "count"), 1);
    assert_eq!(
        cell(failed, &[("ref:plan", PLAN)], "sum:fgos.duration"),
        300_000
    );
    let recheck = answer(&all, "m2-recheck-time");
    assert_eq!(
        cell(recheck, &[("ref:plan", PLAN)], "sum:fgos.duration"),
        300_000
    );
    assert_eq!(cell(recheck, &[("ref:plan", PLAN)], "count"), 4);
    assert!(row(recheck, &[("ref:plan", "plans/261118-0800-other-plan")]).is_none());

    // M7: a count of verify outcomes per plan and phase; phase two needed a second unit after findings.
    let first_pass = answer(&all, "m7-first-pass");
    assert!(first_pass["row"]["reason"]
        .as_str()
        .unwrap()
        .contains("count of verify outcomes"));
    for (plan, ph, outcome) in [
        (PLAN, "1", "pass"),
        (PLAN, "2", "findings"),
        (PLAN, "2", "pass"),
        ("plans/261118-0800-other-plan", "1", "not-run"),
    ] {
        assert_eq!(
            cell(
                first_pass,
                &[
                    ("ref:plan", plan),
                    ("ref:phase", ph),
                    ("fgos.verify.outcome", outcome)
                ],
                "count"
            ),
            1,
            "{plan} {ph} {outcome}"
        );
    }

    // Measures whose kinds nothing declares yet report unmeasured with the kind named, and carry a reason.
    for (name, kind) in [
        ("m2-owner-wait", "fgos.question.asked"),
        ("m3-interventions", "fgos.question.asked"),
        ("m4-scope-fidelity", "fgos.plan.scope.checked"),
        ("m5-plan-defects", "fgos.plan.defect.found"),
        ("m6-detection-latency", "fgos.plan.defect.detected"),
    ] {
        let a = answer(&all, name);
        assert_eq!(
            a["unmeasured"],
            format!("kind-undeclared: {kind}"),
            "{name}"
        );
        let reason = a["row"]["reason"].as_str().unwrap();
        if !name.starts_with("m2") && !name.starts_with("m3") {
            assert!(reason.contains("backlog row opened by phase 16"), "{name}");
        } else {
            assert!(reason.contains("fgos.question.asked"), "{name}");
        }
    }
    let _ = std::fs::remove_dir_all(&root);
}

/// The real binary over a git plan history: the composition root's plan source turns `plan.md` status commits into
/// `fgos.plan.status`, and the shipped lead-time definition counts from the last ready to the done after it.
#[cfg(unix)]
#[test]
fn the_real_binary_measures_lead_time_from_the_last_ready_in_git_plan_history() {
    use std::os::unix::fs::PermissionsExt;
    use std::process::Command;

    let base = std::env::temp_dir().join(format!("fgos_driving_git_{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&base);
    let root = base.join("root");
    for dir in [&root, &base.join("state"), &base.join("home")] {
        std::fs::create_dir_all(dir).unwrap();
        std::fs::set_permissions(dir, std::fs::Permissions::from_mode(0o700)).unwrap();
    }
    let command = |program: &str| {
        let mut command = Command::new(program);
        command
            .current_dir(&root)
            .env("FGOS_STATE_ROOT", base.join("state"))
            .env("HOME", base.join("home"));
        command
    };
    let git = |args: &[&str], at: &str| {
        let status = command("git")
            .args(["-c", "user.name=t", "-c", "user.email=t@example.invalid"])
            .args(args)
            .env("GIT_AUTHOR_DATE", at)
            .env("GIT_COMMITTER_DATE", at)
            .status()
            .unwrap();
        assert!(status.success(), "git {args:?}");
    };
    let status = |dir: &str, to: &str, at: &str| {
        let plan = root.join("plans").join(dir);
        std::fs::create_dir_all(&plan).unwrap();
        std::fs::write(
            plan.join("plan.md"),
            format!("---\ncontract: plan-v1\nstatus: {to}\npriority: P1\n---\n"),
        )
        .unwrap();
        git(&["add", "-A"], at);
        git(&["commit", "-qm", &format!("{dir} {to}")], at);
    };
    git(&["init", "-q", "-b", "main"], "2026-11-18T05:00:00Z");
    git(
        &["commit", "-q", "--allow-empty", "-m", "root"],
        "2026-11-18T05:00:00Z",
    );
    // Ready, running, back to ready at 11:00, done at 15:00: four hours from the last ready.
    status("261118-0900-again", "ready", "2026-11-18T09:00:00Z");
    status("261118-0900-again", "running", "2026-11-18T10:00:00Z");
    status("261118-0900-again", "ready", "2026-11-18T11:00:00Z");
    status("261118-0900-again", "done", "2026-11-18T15:00:00Z");
    // Done at 12:00, then reopened to ready: no done follows the last ready.
    status("261118-0900-reopened", "ready", "2026-11-18T09:30:00Z");
    status("261118-0900-reopened", "done", "2026-11-18T12:00:00Z");
    status("261118-0900-reopened", "ready", "2026-11-18T13:00:00Z");

    let defs = repo().join("domains/coding/observe/definitions");
    let output = command(env!("CARGO_BIN_EXE_fgos"))
        .args([
            "metrics",
            "query",
            "--def",
            defs.to_str().unwrap(),
            "--now",
            NOW,
        ])
        .arg("--dir")
        .arg(&root)
        .arg("--json")
        .output()
        .unwrap();
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(
        output.status.success(),
        "stdout={stdout} stderr={}",
        String::from_utf8_lossy(&output.stderr)
    );
    let all = serde_json::from_str::<Value>(&stdout).unwrap()["data"].clone();
    for def in all["definitions"].as_array().unwrap() {
        assert!(def["error"].is_null(), "{def}");
    }
    let lead = answer(&all, "plan-lead-time");
    assert_eq!(
        cell(lead, &[("subject.id", "plans/261118-0900-again")], "span"),
        14400
    );
    let reopened = row(lead, &[("subject.id", "plans/261118-0900-reopened")]).unwrap();
    assert_eq!(reopened["insufficient"], true);
    let _ = std::fs::remove_dir_all(&base);
}
