use fgos_observe::{Observation, ObservationSource, ObserveRequest, SourceError, Window};
use fgos_observe::metrics_cli::discussions::dispatch_discussions;
use fgos_run_result::{RunResultSource, UnitSummarySource};
use serde_json::{json, Value};
use std::fs;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};

static NEXT: AtomicU64 = AtomicU64::new(0);

struct Fixture(PathBuf);

// A read barrier, not fixture observations: measuring a discussion must remain
// available even if the unrelated transcript store is unavailable.
struct UnavailableTranscripts;

impl ObservationSource for UnavailableTranscripts {
    fn source_id(&self) -> &'static str { "claude-transcripts" }

    fn observations(&self, _: &std::path::Path, _: &Window) -> Result<Vec<Observation>, SourceError> {
        Err(SourceError::ReadFailed {
            source_id: "claude-transcripts",
            message: "unrelated transcript source must not be read".to_owned(),
        })
    }
}

impl Fixture {
    fn new() -> Self {
        let root = std::env::temp_dir().join(format!("fgos-unit-summary-{}-{}", std::process::id(), NEXT.fetch_add(1, Ordering::Relaxed)));
        fs::create_dir_all(root.join(".fgos/assignments")).unwrap();
        Self(root)
    }

    fn summary(&self, summary: &Value) -> PathBuf {
        let dir = self.0.join(".fgos/assignments").join(summary["unitRunId"].as_str().unwrap());
        fs::create_dir_all(&dir).unwrap();
        let path = dir.join("unit-summary.json");
        fs::write(&path, serde_json::to_vec(summary).unwrap()).unwrap();
        path
    }

    fn metrics(&self, args: &[&str]) -> Value {
        let request = ObserveRequest {
            operation: "metrics".to_owned(), sub: "discussions".to_owned(),
            args: args.iter().map(|arg| (*arg).to_owned()).collect(), root: self.0.clone(), stdin: None,
        };
        let sources: Vec<Box<dyn ObservationSource>> = vec![
            Box::new(RunResultSource::new()), Box::new(UnitSummarySource::new()), Box::new(UnavailableTranscripts),
        ];
        dispatch_discussions(&request, &sources).unwrap()
    }
}

impl Drop for Fixture {
    fn drop(&mut self) { let _ = fs::remove_dir_all(&self.0); }
}

fn attempt(run_id: Option<&str>, executor: &str, outcome: &str, fallback: Option<&str>) -> Value {
    json!({
        "assignmentId": "unit-run-synthetic/panelist-1/1", "runId": run_id,
        "executor": executor, "provider": executor, "persona": format!("lens-{executor}"),
        "model": "synthetic-model", "outcome": outcome,
        "fallbackFrom": fallback.map(|executor| json!({
            "executor": executor, "invocation": "synthetic-invocation",
            "transport": "herdr", "reason": "provider-limit"
        })),
    })
}

fn seat(role: &str, choice: Option<&str>) -> Value {
    let mut final_attempt = attempt(Some(role), "alpha", "pass", None);
    final_attempt["stance"] = match choice {
        Some(choice) => json!({"status": "valid", "choice": choice, "confidence": 0.8}),
        None => json!({"status": "missing"}),
    };
    json!({"role": role, "round": 1, "final": final_attempt, "attempts": [attempt(Some(role), "alpha", "pass", None)]})
}

fn unit(id: &str, choices: &[Option<&str>]) -> Value {
    json!({
        "contract": {"id": "unit-summary", "version": 1}, "unitRunId": id,
        "workflow": {"runId": "workflow-synthetic", "stepId": "discuss", "unitId": "panel"},
        "pattern": "panel", "capability": "analysis", "outcome": "pass",
        "startedAt": "2026-10-05T12:00:00.000Z", "settledAt": "2026-10-05T12:01:00.000Z",
        "seats": choices.iter().enumerate().map(|(i, choice)| seat(&format!("panelist-{}", i + 1), *choice)).collect::<Vec<_>>(),
        "inline": false, "stanceOptions": ["a", "b", "c"],
    })
}

#[test]
fn consumer_separates_all_attempts_final_seats_groups_and_refusals() {
    let root = Fixture::new();
    let mut fallback = unit("unit-run-fallback", &[Some("b")]);
    let mut final_attempt = attempt(Some("fallback-final"), "beta", "pass", Some("alpha"));
    final_attempt["stance"] = json!({"status": "valid", "choice": "b", "confidence": null});
    fallback["seats"][0]["final"] = final_attempt;
    // Deliberately not ordered by winner: the consumer must not reselect attempts.
    fallback["seats"][0]["attempts"] = json!([
        attempt(Some("fallback-final"), "beta", "pass", Some("alpha")),
        attempt(Some("fallback-first"), "alpha", "provider-limit", None),
        attempt(Some("resumed-first"), "alpha", "provider-limit", None)
    ]);
    fallback["seats"].as_array_mut().unwrap().push(seat("synthesizer", None));
    root.summary(&fallback);
    let mut refusal = unit("unit-run-refusal", &[]);
    refusal["outcome"] = json!("policy-refusal");
    refusal["settledAt"] = json!("2026-10-05T12:02:00.000Z");
    root.summary(&refusal);
    let mut inline = unit("unit-run-inline", &[]);
    inline["inline"] = json!(true);
    inline["workflow"] = Value::Null;
    let mut inline_seat = seat("producer", None);
    inline_seat["final"]["runId"] = Value::Null;
    inline_seat["attempts"][0]["runId"] = Value::Null;
    inline["seats"] = json!([inline_seat]);
    root.summary(&inline);
    let report = root.metrics(&["--since=2026-10-05"]);
    assert_eq!(report["totals"]["unitRuns"], 3);
    assert_eq!(report["totals"]["passRate"], json!(2.0 / 3.0));
    assert_eq!(report["totals"]["seats"], 3);
    assert_eq!(report["totals"]["attempts"], 4);
    assert_eq!(report["totals"]["inlineSeats"], 1);
    assert_eq!(report["totals"]["fallbackSeats"], 1);
    assert_eq!(report["totals"]["fallbackRate"], json!(1.0 / 3.0));
    assert_eq!(report["totals"]["medianDurationSec"], 60.0);
    assert_eq!(report["groups"]["workflow-synthetic"]["unitRuns"], 2);
    assert_eq!(report["groups"]["unlinked"]["inlineSeats"], 1);
    let units = report["units"].as_array().unwrap();
    let refusal = units.iter().find(|unit| unit["unitRunId"] == "unit-run-refusal").unwrap();
    assert_eq!(refusal["seats"], 0);
    assert_eq!(refusal["workflow"]["runId"], "workflow-synthetic");
    let fallback = units.iter().find(|unit| unit["unitRunId"] == "unit-run-fallback").unwrap();
    assert_eq!(fallback["seatDetails"][0]["final"]["executor"], "beta");
    assert_eq!(fallback["stanceSeats"], 1);
    assert_eq!(fallback["stancesMissing"], 0); // synthesizer is not a voter
    let grouped = root.metrics(&["--by", "executor"]);
    assert_eq!(grouped["groups"]["alpha"]["attempts"], 3);
    assert_eq!(grouped["groups"]["alpha"]["seats"], 2);
    assert_eq!(grouped["groups"]["beta"]["attempts"], 1);
    assert_eq!(grouped["groups"]["beta"]["seats"], 1);
    assert_eq!(grouped["groups"]["beta"]["fallbackSeats"], 1);
    let personas = root.metrics(&["--by=persona"]);
    assert_eq!(personas["groups"]["lens-beta"]["seats"], 1);
    assert_eq!(personas["groups"]["lens-alpha"]["attempts"], 3);
}

#[test]
fn passive_threshold_uses_all_final_voting_seats_without_changing_outcomes() {
    let root = Fixture::new();
    let cases = [
        ("unit-run-unanimous", [Some("a"), Some("a"), Some("a")], 1.0, false, 0),
        ("unit-run-two-one", [Some("a"), Some("a"), Some("b")], 2.0 / 3.0, false, 0),
        ("unit-run-split", [Some("a"), Some("b"), Some("c")], 1.0 / 3.0, true, 0),
        ("unit-run-one-missing", [Some("a"), Some("a"), None], 2.0 / 3.0, false, 1),
        ("unit-run-two-missing", [Some("a"), None, None], 1.0 / 3.0, true, 2),
        ("unit-run-all-missing", [None, None, None], 0.0, true, 3),
        ("unit-run-other", [Some("other"), Some("other"), Some("a")], 2.0 / 3.0, false, 0),
    ];
    for (id, choices, _, _, _) in &cases { root.summary(&unit(id, choices)); }
    let mut invalid = unit("unit-run-invalid", &[Some("a"), Some("a"), Some("a")]);
    invalid["seats"][2]["final"]["stance"] = json!({"status": "invalid", "reason": "wrong-type"});
    root.summary(&invalid);
    let mut out_of_set = unit("unit-run-out-of-set", &[Some("a"), Some("a"), Some("undeclared")]);
    out_of_set["seats"][2]["final"]["stance"]["confidence"] = Value::Null;
    root.summary(&out_of_set);
    let mut no_options = unit("unit-run-unmeasured", &[Some("a")]);
    no_options["stanceOptions"] = json!([]);
    root.summary(&no_options);
    let mut solo = unit("unit-run-solo", &[]);
    solo["seats"] = json!([seat("producer", Some("a"))]);
    root.summary(&solo);
    let report = root.metrics(&[]);
    let units = report["units"].as_array().unwrap();
    for (id, _, expected_agreement, split, missing) in cases {
        let row = units.iter().find(|unit| unit["unitRunId"] == id).unwrap();
        assert_eq!(row["agreement"], expected_agreement);
        assert_eq!(row["genuineSplit"], split);
        assert_eq!(row["stancesMissing"], missing);
        assert_eq!(row["measurement"], "measured");
        assert_eq!(row["seatsFailed"], 0);
    }
    let row = units.iter().find(|unit| unit["unitRunId"] == "unit-run-invalid").unwrap();
    assert_eq!(row["stancesInvalid"], 1);
    assert_eq!(row["agreement"], json!(2.0 / 3.0));
    assert_eq!(row["genuineSplit"], false);
    assert_eq!(row["seatsFailed"], 0);
    let row = units.iter().find(|unit| unit["unitRunId"] == "unit-run-out-of-set").unwrap();
    assert_eq!(row["stancesInvalid"], 1);
    assert_eq!(row["agreement"], json!(2.0 / 3.0));
    assert_eq!(row["genuineSplit"], false);
    assert_eq!(row["seatsFailed"], 0);
    for id in ["unit-run-unmeasured", "unit-run-solo"] {
        let row = units.iter().find(|unit| unit["unitRunId"] == id).unwrap();
        assert_eq!(row["measurement"], "unmeasured");
        assert!(row["agreement"].is_null());
        assert!(row["genuineSplit"].is_null());
    }
}

#[test]
fn summary_source_never_rebuilds_results_and_does_not_double_count_runs() {
    let root = Fixture::new();
    root.summary(&unit("unit-run-summary-only", &[Some("a")]));
    let dir = root.0.join(".fgos/assignments/unit-run-dispatch/panelist-1/1/runs/01");
    fs::create_dir_all(&dir).unwrap();
    fs::write(dir.join("result.json"), serde_json::to_vec(&json!({
        "runId": "dispatch-run", "settledAt": "2026-10-05T12:00:01Z", "status": "done"
    })).unwrap()).unwrap();
    let source = UnitSummarySource::new();
    let mut observations = source.observations(&root.0, &Window::default()).unwrap();
    assert_eq!(observations.len(), 1); // result-only unit does not become a discussion
    assert_eq!(observations[0].source, "unit-summary");
    assert_eq!(observations[0].kind, "unit.settled");
    assert_eq!(observations[0].subject.id, "unit-run:unit-run-summary-only");
    observations.extend(RunResultSource::new().observations(&root.0, &Window::default()).unwrap());
    assert_eq!(fgos_observe::scorecard::compute_runs(&observations).total, 1);
    assert_eq!(root.metrics(&[])["totals"]["unitRuns"], 1);
}

#[test]
fn reader_skips_missing_timestamps_bad_contracts_oversized_and_nested_summaries() {
    let root = Fixture::new();
    root.summary(&unit("unit-run-good", &[]));
    let mut no_timestamp = unit("unit-run-no-time", &[]);
    no_timestamp["settledAt"] = Value::Null;
    root.summary(&no_timestamp);
    let mut bad_contract = unit("unit-run-contract", &[]);
    bad_contract["contract"]["version"] = json!(2);
    root.summary(&bad_contract);
    let malformed = root.summary(&unit("unit-run-malformed", &[]));
    fs::write(malformed, "{").unwrap();
    let oversized = root.summary(&unit("unit-run-oversized", &[]));
    fs::write(oversized, vec![b' '; 1024 * 1024 + 1]).unwrap();
    let mismatch = root.summary(&unit("unit-run-mismatch", &[]));
    fs::write(mismatch, serde_json::to_vec(&unit("unit-run-elsewhere", &[])).unwrap()).unwrap();
    let planted = root.0.join(".fgos/assignments/unit-run-good/panelist-1/1/runs/01/outbox/unit-run-planted");
    fs::create_dir_all(&planted).unwrap();
    fs::write(planted.join("unit-summary.json"), serde_json::to_vec(&unit("unit-run-planted", &[])).unwrap()).unwrap();
    assert_eq!(root.metrics(&[])["totals"]["unitRuns"], 1);
    assert_eq!(root.metrics(&["--since=2026-10-06"])["totals"]["unitRuns"], 0);
    assert_eq!(root.metrics(&["--until", "2026-10-04"])["totals"]["unitRuns"], 0);
}

#[cfg(unix)]
#[test]
fn reader_does_not_follow_unit_file_or_state_symlinks() {
    use std::os::unix::fs::symlink;
    let root = Fixture::new();
    let real = root.summary(&unit("unit-run-real", &[]));
    let linked_dir = root.0.join(".fgos/assignments/unit-run-linked");
    symlink(real.parent().unwrap(), linked_dir).unwrap();
    let link_file = root.summary(&unit("unit-run-link-file", &[]));
    fs::remove_file(&link_file).unwrap();
    symlink(&real, &link_file).unwrap();
    assert_eq!(root.metrics(&[])["totals"]["unitRuns"], 1);
    let other = Fixture::new();
    fs::remove_dir_all(other.0.join(".fgos/assignments")).unwrap();
    symlink(root.0.join(".fgos/assignments"), other.0.join(".fgos/assignments")).unwrap();
    assert_eq!(other.metrics(&[])["totals"]["unitRuns"], 0);
    let state = Fixture::new();
    fs::remove_dir_all(state.0.join(".fgos")).unwrap();
    symlink(root.0.join(".fgos"), state.0.join(".fgos")).unwrap();
    assert_eq!(state.metrics(&[])["totals"]["unitRuns"], 0);
}

#[test]
fn duration_is_fractional_offset_aware_and_never_fabricated() {
    let root = Fixture::new();
    let mut sample = unit("unit-run-duration", &[]);
    sample["startedAt"] = json!("2026-10-05T13:00:00.250+01:00");
    sample["settledAt"] = json!("2026-10-05T12:00:01.750Z");
    root.summary(&sample);
    let mut unknown = unit("unit-run-duration-unknown", &[]);
    unknown["startedAt"] = Value::Null;
    root.summary(&unknown);
    let report = root.metrics(&[]);
    assert_eq!(report["totals"]["durationSamples"], 1);
    assert_eq!(report["totals"]["medianDurationSec"], 1.5);
    let unknown = report["units"].as_array().unwrap().iter().find(|unit| unit["unitRunId"] == "unit-run-duration-unknown").unwrap();
    assert!(unknown["medianDurationSec"].is_null());
}

#[test]
fn fallback_provenance_objects_are_consumed_and_preserved_without_reselection() {
    let root = Fixture::new();
    let provenance = json!({
        "executor": "gemini", "invocation": "synthetic-herdr",
        "transport": "herdr", "reason": "provider-limit"
    });
    let mut summary = unit("unit-run-provenance", &[None]);
    summary["seats"][0]["final"]["fallbackFrom"] = provenance.clone();
    summary["seats"][0]["attempts"][0]["fallbackFrom"] = provenance.clone();
    summary["seats"][0]["attempts"].as_array_mut().unwrap()
        .push(attempt(Some("provider-limited"), "gemini", "provider-limit", None));
    root.summary(&summary);
    let source = UnitSummarySource::new().observations(&root.0, &Window::default()).unwrap();
    assert_eq!(source.len(), 1);
    assert_eq!(source[0].attrs["seats"][0]["final"]["fallbackFrom"], provenance);
    assert_eq!(source[0].attrs["seats"][0]["attempts"][0]["fallbackFrom"], provenance);
    let report = root.metrics(&[]);
    assert_eq!(report["totals"]["unitRuns"], 1);
    assert_eq!(report["totals"]["seats"], 1);
    assert_eq!(report["totals"]["attempts"], 2);
    assert_eq!(report["totals"]["fallbackSeats"], 1);
    assert_eq!(report["totals"]["fallbackAttempts"], 1);
    assert_eq!(report["units"][0]["seatDetails"][0]["final"]["fallbackFrom"], provenance);
    assert_eq!(report["units"][0]["seatDetails"][0]["final"]["outcome"], "pass");
    assert_eq!(report["units"][0]["seatDetails"][0]["attempts"][1]["outcome"], "provider-limit");

    let mut minimal = unit("unit-run-minimal-provenance", &[None]);
    minimal["seats"][0]["final"]["fallbackFrom"] = json!({"executor": "gemini", "reason": "provider-limit"});
    minimal["seats"][0]["attempts"][0]["fallbackFrom"] = json!({"executor": "gemini", "reason": "provider-limit"});
    root.summary(&minimal);
    assert_eq!(root.metrics(&[])["totals"]["unitRuns"], 2);
    assert_eq!(root.metrics(&[])["totals"]["fallbackSeats"], 2);
}

#[test]
fn summary_and_cli_windows_compare_offset_timestamps_temporally_and_include_equal_bounds() {
    let root = Fixture::new();
    for (id, timestamp) in [
        ("unit-run-before", "2026-10-05T01:00:00+02:00"),
        ("unit-run-equal-positive", "2026-10-05T02:00:00.000+02:00"),
        ("unit-run-equal-negative", "2026-10-04T19:00:00-05:00"),
        ("unit-run-after", "2026-10-04T23:30:00-02:00"),
    ] {
        let mut summary = unit(id, &[]);
        summary["settledAt"] = json!(timestamp);
        root.summary(&summary);
    }
    let source = UnitSummarySource::new();
    let bounds = Window {
        since: Some("2026-10-05T00:00:00Z".into()),
        until: Some("2026-10-05T00:00:00.000Z".into()),
    };
    let observations = source.observations(&root.0, &bounds).unwrap();
    assert_eq!(observations.len(), 2);
    assert!(observations.iter().all(|observation| observation.attrs["unitRunId"].as_str().unwrap().starts_with("unit-run-equal")));
    let exact = root.metrics(&["--since=2026-10-05T00:00:00Z", "--until=2026-10-05T00:00:00Z"]);
    assert_eq!(exact["totals"]["unitRuns"], 2);
    let date = root.metrics(&["--since=2026-10-05"]);
    assert_eq!(date["totals"]["unitRuns"], 3);
    assert!(!date["units"].as_array().unwrap().iter().any(|unit| unit["unitRunId"] == "unit-run-before"));
    let until = root.metrics(&["--until=2026-10-05"]);
    assert_eq!(until["totals"]["unitRuns"], 3);
    assert!(!until["units"].as_array().unwrap().iter().any(|unit| unit["unitRunId"] == "unit-run-after"));
    // Lexicographic bound ordering would reject this equal-instant window.
    assert_eq!(root.metrics(&[
        "--since=2026-10-05T02:00:00+02:00", "--until=2026-10-05T00:00:00Z"
    ])["totals"]["unitRuns"], 2);
}

#[test]
fn invalid_timestamp_bounds_are_named_errors_before_scanning() {
    let root = Fixture::new();
    let source = UnitSummarySource::new();
    for (flag, value) in [("--since", "2026-02-30"), ("--until", "not-a-timestamp")] {
        let request = ObserveRequest {
            operation: "metrics".into(), sub: "discussions".into(),
            args: vec![flag.into(), value.into()], root: root.0.clone(), stdin: None,
        };
        assert!(dispatch_discussions(&request, &[]).unwrap_err().contains(&format!("invalid {flag}")));
        let window = Window {
            since: (flag == "--since").then(|| value.to_owned()),
            until: (flag == "--until").then(|| value.to_owned()),
        };
        assert!(source.observations(&root.0, &window).unwrap_err().to_string().contains(&format!("invalid {flag}")));
    }
}
