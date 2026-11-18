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

#[test]
fn every_driving_definition_answers_its_numbers_or_names_why_it_is_unmeasured() {
    let root = project();
    let all = run_all(&root);
    assert_eq!(all["definitions"].as_array().unwrap().len(), 14);
    for def in all["definitions"].as_array().unwrap() {
        assert!(def["error"].is_null(), "{def}");
    }

    // Plan lead time: ready 09:00 to done 15:00 is six hours; a plan not yet done has one matching record, below the
    // minimum sample of two, and reports no value.
    let lead = answer(&all, "plan-lead-time");
    assert_eq!(cell(lead, &[("subject.id", PLAN)], "span"), 21600);
    let other = lead["rows"]
        .as_array()
        .unwrap()
        .iter()
        .find(|r| r["group"]["subject.id"] == "plans/261118-0800-other-plan")
        .unwrap();
    assert_eq!(other["insufficient"], true);

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

    // Tokens by plan, provider, account and model.
    let tokens = answer(&all, "plan-tokens");
    let by = |p: &'static str, a: &'static str, m: &'static str| {
        cell(
            tokens,
            &[
                ("gen_ai.provider.name", p),
                ("fgos.account.id", a),
                ("gen_ai.request.model", m),
            ],
            "sum:fgos.usage.total_tokens",
        )
        .clone()
    };
    assert_eq!(by("anthropic", "a1", "claude-x"), 3300);
    assert_eq!(by("openai", "a2", "gpt-y"), 4500);

    // Failure rate: counts per outcome; the rate is the failed share of the plan's attempts, one of five.
    let failure = answer(&all, "plan-failure-rate");
    assert_eq!(cell(failure, &[("fgos.outcome", "pass")], "count"), 4);
    assert_eq!(cell(failure, &[("fgos.outcome", "fail")], "count"), 1);

    // M1: the current status per plan, ignoring the later priority change.
    let completion = answer(&all, "m1-completion");
    for status in ["done", "running", "ready"] {
        assert_eq!(
            cell(completion, &[("fgos.plan.to", status)], "count"),
            1,
            "{status}"
        );
    }

    // M2: worker time of passing attempts, failed runs, and the verify span.
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
    assert_eq!(
        cell(
            answer(&all, "m2-recheck-time"),
            &[("ref:plan", PLAN)],
            "sum:fgos.duration"
        ),
        300_000
    );

    // M7: verify outcomes per phase; phase two needed a second unit after findings.
    let first_pass = answer(&all, "m7-first-pass");
    assert_eq!(
        cell(
            first_pass,
            &[("ref:phase", "1"), ("fgos.verify.outcome", "pass")],
            "count"
        ),
        1
    );
    assert_eq!(
        cell(
            first_pass,
            &[("ref:phase", "2"), ("fgos.verify.outcome", "findings")],
            "count"
        ),
        1
    );
    assert_eq!(
        cell(
            first_pass,
            &[("ref:phase", "2"), ("fgos.verify.outcome", "pass")],
            "count"
        ),
        1
    );

    // Measures whose kinds nothing declares yet report unmeasured with the kind named.
    for (name, kind) in [
        ("m2-owner-wait", "fgos.question.asked"),
        ("m3-interventions", "fgos.question.asked"),
        ("m4-scope-fidelity", "fgos.plan.scope.checked"),
        ("m5-plan-defects", "fgos.plan.defect.found"),
        ("m6-detection-latency", "fgos.plan.defect.detected"),
    ] {
        assert_eq!(
            answer(&all, name)["unmeasured"],
            format!("kind-undeclared: {kind}"),
            "{name}"
        );
    }
    let _ = std::fs::remove_dir_all(&root);
}
