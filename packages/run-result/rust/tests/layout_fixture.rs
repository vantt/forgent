use fgos_observe::{ObservationSource, ObserveRequest, Window};
use fgos_run_result::{scan_coverage, scan_runs, scan_unit_summaries, RunResultSource, MAX_ASSIGNMENT_DEPTH};
use serde_json::{json, Value};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};

static NEXT_TEMP: AtomicU64 = AtomicU64::new(0);

struct FixtureRoot(PathBuf);

impl FixtureRoot {
    fn new() -> Self {
        let path = std::env::temp_dir().join(format!(
            "fgos-run-layout-{}-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos(),
            NEXT_TEMP.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir_all(path.join(".fgos/assignments")).unwrap();
        Self(path)
    }

    fn assignments(&self) -> PathBuf {
        self.0.join(".fgos/assignments")
    }

    fn result(&self, assignment: &str, attempt: &str, record: &Value) -> PathBuf {
        let dir = self
            .assignments()
            .join(assignment)
            .join("runs")
            .join(attempt);
        fs::create_dir_all(&dir).unwrap();
        let path = dir.join("result.json");
        fs::write(&path, serde_json::to_vec(record).unwrap()).unwrap();
        path
    }
}

impl Drop for FixtureRoot {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

fn assert_accounting(root: &Path) {
    let scan = scan_runs(root).unwrap();
    assert_eq!(
        scan.run_dirs_seen,
        scan.runs.len() + scan.skipped.values().sum::<usize>()
    );
}

#[cfg(unix)]
#[test]
fn shared_layout_fixture_and_consumers_have_identical_run_sets() {
    let expected: Value = serde_json::from_str(include_str!(
        "../../../../test/fixtures/run-layout/expected.json"
    ))
    .unwrap();
    let root = FixtureRoot::new();
    for entry in expected["entries"].as_array().unwrap() {
        let assignment = entry["assignmentId"].as_str().unwrap();
        let attempt = entry["attempt"].as_str().unwrap();
        if entry["assignmentJson"] != false {
            let dir = root.assignments().join(assignment);
            fs::create_dir_all(&dir).unwrap();
            fs::write(
                dir.join("assignment.json"),
                serde_json::to_vec(&json!({
                    "role": entry.get("role").unwrap_or(&Value::Null),
                    "createdAt": expected["timestamp"]
                }))
                .unwrap(),
            )
            .unwrap();
        }
        let mut record = json!({"status": "done"});
        if let Some(id) = entry.get("runId") {
            record["runId"] = id.clone();
        }
        if let Some(id) = entry.get("unitRunId") {
            record["unitRunId"] = id.clone();
        }
        if entry["skip"] != "no-timestamp" {
            record["settledAt"] = expected["timestamp"].clone();
        }
        if let Some(fields) = entry["result"].as_object() {
            record.as_object_mut().unwrap().extend(fields.clone());
        }
        let dir = root.assignments().join(assignment).join("runs").join(attempt);
        fs::create_dir_all(&dir).unwrap();
        let mut run = json!({
            "runId": entry.get("runId").unwrap_or(&Value::Null),
            "startedAt": expected["timestamp"]
        });
        if let Some(fields) = entry["run"].as_object() {
            run.as_object_mut().unwrap().extend(fields.clone());
        }
        fs::write(dir.join("run.json"), serde_json::to_vec(&run).unwrap()).unwrap();
        if entry["skip"] == "missing-result" {
            continue;
        }
        let path = root.result(assignment, attempt, &record);
        if entry["skip"] == "unparseable" {
            fs::write(path, "NOT JSON").unwrap();
        }
    }
    let planted = &expected["planted"];
    let planted_dir = root.assignments().join(planted["path"].as_str().unwrap());
    fs::create_dir_all(&planted_dir).unwrap();
    fs::write(
        planted_dir.join("result.json"),
        serde_json::to_vec(&json!({
            "runId": planted["runId"], "settledAt": expected["timestamp"]
        }))
        .unwrap(),
    )
    .unwrap();
    let symlink = &expected["symlink"];
    let link = root.assignments().join(symlink["path"].as_str().unwrap());
    fs::create_dir_all(link.parent().unwrap()).unwrap();
    std::os::unix::fs::symlink(
        root.assignments().join(symlink["target"].as_str().unwrap()),
        &link,
    )
    .unwrap();

    let scan = scan_runs(&root.0).unwrap();
    let mut ids: Vec<&str> = scan.runs.iter().map(|o| o.subject.id.as_str()).collect();
    ids.sort_unstable();
    assert_eq!(
        serde_json::to_value(ids).unwrap(),
        expected["observedRunIds"]
    );
    assert_eq!(
        scan.run_dirs_seen,
        expected["runDirsSeen"].as_u64().unwrap() as usize
    );
    let nonzero: std::collections::BTreeMap<_, _> =
        scan.skipped.iter().filter(|(_, n)| **n != 0).collect();
    assert_eq!(serde_json::to_value(nonzero).unwrap(), expected["skipped"]);
    assert_accounting(&root.0);
    let no_assignment = scan
        .runs
        .iter()
        .find(|o| o.subject.id == "no-assignment")
        .unwrap();
    assert_eq!(no_assignment.attrs["role"], Value::Null);
    let nested = scan.runs.iter().find(|o| o.subject.id == "nested").unwrap();
    assert_eq!(
        nested.attrs["assignmentId"],
        "unit-run-example/panelist-1/1"
    );
    let flat = scan.runs.iter().find(|o| o.subject.id == "flat").unwrap();
    assert_eq!(flat.attrs["assignmentId"], "legacy");

    let sources: Vec<Box<dyn ObservationSource>> = vec![Box::new(RunResultSource::new())];
    let mut req = ObserveRequest {
        operation: "observe.metrics".to_string(),
        sub: "coverage".to_string(),
        args: vec![],
        root: root.0.clone(),
        stdin: None,
    };
    let coverage =
        fgos_observe::metrics_cli::dispatch(&req, &sources, None, scan_coverage, scan_unit_summaries).unwrap();
    assert_eq!(coverage["layoutRule"], expected["layoutRule"]);
    assert_eq!(coverage["observed"], scan.runs.len());
    assert_eq!(coverage["recentRuns"], 13);
    req.sub = "runs".to_string();
    let runs = fgos_observe::metrics_cli::dispatch(&req, &sources, None, scan_coverage, scan_unit_summaries).unwrap();
    assert_eq!(runs["total"], coverage["observed"]);
    req.sub = "harness".to_string();
    let harness = fgos_observe::metrics_cli::dispatch(&req, &sources, None, scan_coverage, scan_unit_summaries).unwrap();
    assert_eq!(harness["runs"]["total"], coverage["observed"]);
    for (id, timestamp) in [
        ("owner-settled", "2026-10-05T11:00:00Z"),
        ("result-time", "2026-10-05T12:00:00Z"),
        ("settled-precedence", "2026-10-05T13:00:00Z"),
    ] {
        let observation = scan.runs.iter().find(|o| o.subject.id == id).unwrap();
        assert_eq!(observation.ts, timestamp);
        assert_eq!(observation.source, "run-result");
        assert_eq!(observation.kind, "run.settled");
        assert_eq!(observation.attrs["assignmentId"], id);
        assert_eq!(observation.attrs["status"], "done");
    }
    req.args = vec![
        "--since".to_string(), "2026-10-05T11:00:00Z".to_string(),
        "--until".to_string(), "2026-10-05T12:00:00Z".to_string(),
    ];
    req.sub = "runs".to_string();
    let windowed_runs = fgos_observe::metrics_cli::dispatch(
        &req, &sources, None, scan_coverage, scan_unit_summaries,
    ).unwrap();
    assert_eq!(windowed_runs["total"], 2);
    req.sub = "harness".to_string();
    let windowed_harness = fgos_observe::metrics_cli::dispatch(
        &req, &sources, None, scan_coverage, scan_unit_summaries,
    ).unwrap();
    assert_eq!(windowed_harness["runs"]["total"], 2);
    req.sub = "coverage".to_string();
    assert!(fgos_observe::metrics_cli::dispatch(
        &req, &sources, None, scan_coverage, scan_unit_summaries,
    ).unwrap_err().contains("unexpected argument for metrics coverage"));
    req.args.clear();
    let windowed_coverage = fgos_observe::metrics_cli::dispatch(
        &req, &sources, None, scan_coverage, scan_unit_summaries,
    ).unwrap();
    assert_eq!(windowed_coverage["observed"], 7);
    assert_eq!(windowed_coverage["runDirsSeen"], 15);
    assert_eq!(windowed_coverage["skipped"], expected["skipped"]);
    let window = Window {
        since: Some("2026-10-06".to_string()),
        until: None,
    };
    assert!(sources[0]
        .observations(&root.0, &window)
        .unwrap()
        .is_empty());
}

#[test]
fn timestamps_come_from_results_and_unsettled_attempts_are_accounted() {
    let root = FixtureRoot::new();
    root.result(
        "fallback-time",
        "01",
        &json!({
            "runId": "fallback-time", "timestamp": "2026-10-05T10:00:00Z"
        }),
    );
    root.result(
        "empty-time",
        "01",
        &json!({"runId": "empty", "settledAt": ""}),
    );
    root.result(
        "empty-id",
        "01",
        &json!({"runId": "", "settledAt": "2026-10-05T10:00:00Z"}),
    );
    fs::create_dir_all(root.assignments().join("unsettled/runs/01")).unwrap();
    let scan = scan_runs(&root.0).unwrap();
    assert_eq!(scan.runs.len(), 1);
    assert_eq!(scan.skipped["no-timestamp"], 1);
    assert_eq!(scan.skipped["no-run-id"], 1);
    assert_eq!(scan.skipped["missing-result"], 1);
    assert_eq!(scan.recent_runs, 3);
    assert_accounting(&root.0);
}

#[cfg(unix)]
#[test]
fn result_and_assignment_symlinks_are_never_read() {
    let root = FixtureRoot::new();
    let target = root.result(
        "real",
        "01",
        &json!({
            "runId": "real", "settledAt": "2026-10-05T10:00:00Z"
        }),
    );
    let result_dir = root.assignments().join("result-link/runs/01");
    fs::create_dir_all(&result_dir).unwrap();
    std::os::unix::fs::symlink(target, result_dir.join("result.json")).unwrap();
    root.result(
        "assignment-link",
        "01",
        &json!({
            "runId": "assignment-link", "settledAt": "2026-10-05T10:00:00Z"
        }),
    );
    let assignment_target = root.0.join("outside-assignment.json");
    fs::write(&assignment_target, r#"{"role":"forged"}"#).unwrap();
    std::os::unix::fs::symlink(
        assignment_target,
        root.assignments().join("assignment-link/assignment.json"),
    )
    .unwrap();
    let scan = scan_runs(&root.0).unwrap();
    assert_eq!(scan.runs.len(), 2);
    assert_eq!(scan.skipped["symlink"], 2);
    assert_eq!(scan.recent_runs, 2);
    assert_eq!(
        scan.runs
            .iter()
            .find(|o| o.subject.id == "assignment-link")
            .unwrap()
            .attrs["role"],
        Value::Null
    );
    assert_accounting(&root.0);
}

#[test]
fn depth_cap_keeps_the_boundary_assignment_and_counts_the_barrier() {
    let root = FixtureRoot::new();
    let boundary = vec!["nested"; MAX_ASSIGNMENT_DEPTH].join("/");
    root.result(
        &boundary,
        "01",
        &json!({
            "runId": "boundary", "settledAt": "2026-10-05T10:00:00Z"
        }),
    );
    root.result(
        &format!("{}/beyond", boundary),
        "01",
        &json!({
            "runId": "beyond", "settledAt": "2026-10-05T10:00:00Z"
        }),
    );
    let scan = scan_runs(&root.0).unwrap();
    assert_eq!(scan.runs.len(), 1);
    assert_eq!(scan.runs[0].subject.id, "boundary");
    assert_eq!(scan.skipped["depth"], 1);
    assert_accounting(&root.0);
}

#[test]
fn absent_assignments_are_an_empty_source() {
    let root = FixtureRoot::new();
    fs::remove_dir_all(root.assignments()).unwrap();
    let scan = scan_runs(&root.0).unwrap();
    assert_eq!(scan.run_dirs_seen, 0);
    assert!(scan.runs.is_empty());
    assert_accounting(&root.0);
}

#[test]
fn recent_runs_use_result_mtime_and_include_clock_skew() {
    let root = FixtureRoot::new();
    let now = std::time::SystemTime::now();
    for (id, mtime) in [
        ("old", now - std::time::Duration::from_secs(120)),
        ("future", now + std::time::Duration::from_secs(120)),
    ] {
        let path = root.result(
            id,
            "01",
            &json!({
                "runId": id, "settledAt": "2026-10-05T10:00:00Z"
            }),
        );
        fs::File::options()
            .write(true)
            .open(path)
            .unwrap()
            .set_times(fs::FileTimes::new().set_modified(mtime))
            .unwrap();
    }
    let scan = scan_runs(&root.0).unwrap();
    assert_eq!(scan.runs.len(), 2);
    assert_eq!(scan.recent_runs, 1);
    assert_accounting(&root.0);
}

#[test]
fn an_invalid_duplicate_does_not_hide_the_first_valid_record() {
    let root = FixtureRoot::new();
    root.result("a-invalid", "01", &json!({"runId": "shared"}));
    root.result(
        "b-valid",
        "01",
        &json!({
            "runId": "shared", "settledAt": "2026-10-05T10:00:00Z"
        }),
    );
    root.result(
        "z-duplicate",
        "01",
        &json!({
            "runId": "shared", "settledAt": "2026-10-06T10:00:00Z"
        }),
    );
    let scan = scan_runs(&root.0).unwrap();
    assert_eq!(scan.runs.len(), 1);
    assert_eq!(scan.runs[0].attrs["assignmentId"], "b-valid");
    assert_eq!(scan.skipped["no-timestamp"], 1);
    assert_eq!(scan.skipped["duplicate-run-id"], 1);
    let later = Window {
        since: Some("2026-10-06".to_string()),
        until: None,
    };
    assert!(RunResultSource::new()
        .observations(&root.0, &later)
        .unwrap()
        .is_empty());
    assert_accounting(&root.0);
}

#[cfg(unix)]
#[test]
fn owner_settlement_requires_regular_parseable_metadata_without_changing_results() {
    let root = FixtureRoot::new();
    let owner_time = "2026-10-05T11:00:00Z";
    let target = root.0.join("outside-run.json");
    fs::write(&target, serde_json::to_vec(&json!({"settledAt": owner_time})).unwrap()).unwrap();
    for metadata_kind in ["valid", "invalid", "symlink", "directory", "blank", "started"] {
        for primary in [false, true] {
            let id = format!("{metadata_kind}-{primary}");
            let record = if primary {
                json!({"runId": id, "settledAt": "2026-10-05T12:00:00Z", "timestamp": owner_time,
                    "executorId": "executor", "role": "producer", "status": "done"})
            } else {
                json!({"runId": id, "settledAt": null, "timestamp": " "})
            };
            let result = root.result(&id, "01", &record);
            let run = result.parent().unwrap().join("run.json");
            match metadata_kind {
                "valid" => fs::write(&run, serde_json::to_vec(&json!({"settledAt": owner_time})).unwrap()).unwrap(),
                "invalid" => fs::write(&run, "NOT JSON").unwrap(),
                "symlink" => std::os::unix::fs::symlink(&target, &run).unwrap(),
                "directory" => fs::create_dir(&run).unwrap(),
                "blank" => fs::write(&run, r#"{"settledAt":" ","startedAt":"2026-10-05T11:00:00Z"}"#).unwrap(),
                "started" => fs::write(&run, r#"{"startedAt":"2026-10-05T11:00:00Z"}"#).unwrap(),
                _ => unreachable!(),
            }
            fs::write(result.parent().unwrap().parent().unwrap().parent().unwrap().join("assignment.json"),
                r#"{"createdAt":"2026-10-05T11:00:00Z"}"#).unwrap();
        }
    }
    let scan = scan_runs(&root.0).unwrap();
    assert_eq!(scan.runs.len(), 7);
    assert_eq!(scan.skipped["no-timestamp"], 5);
    assert_eq!(scan.recent_runs, 12);
    for observation in &scan.runs {
        assert_eq!(observation.source, "run-result");
        assert_eq!(observation.kind, "run.settled");
        assert_eq!(observation.attrs["assignmentId"], observation.subject.id);
        if observation.subject.id.ends_with("-true") {
            assert_eq!(observation.ts, "2026-10-05T12:00:00Z");
            assert_eq!(observation.attrs["executor"], "executor");
            assert_eq!(observation.attrs["role"], "producer");
            assert_eq!(observation.attrs["status"], "done");
        } else {
            assert_eq!(observation.subject.id, "valid-false");
            assert_eq!(observation.ts, owner_time);
        }
        let result = root.assignments().join(&observation.subject.id).join("runs/01/result.json");
        let record: Value = serde_json::from_slice(&fs::read(result).unwrap()).unwrap();
        if observation.subject.id == "valid-false" {
            assert_eq!(record["settledAt"], Value::Null);
            assert_eq!(record["timestamp"], " ");
        } else {
            assert_eq!(record["settledAt"], "2026-10-05T12:00:00Z");
            assert_eq!(record["timestamp"], owner_time);
        }
    }
    assert_accounting(&root.0);
}

#[test]
fn absent_and_malformed_results_have_distinct_accounting() {
    let root = FixtureRoot::new();
    let missing = root.assignments().join("missing/runs/01");
    fs::create_dir_all(&missing).unwrap();
    fs::write(missing.join("run.json"), r#"{"settledAt":"2026-10-05T11:00:00Z"}"#).unwrap();
    let malformed = root.result("malformed", "01", &json!({}));
    fs::write(malformed, "NOT JSON").unwrap();
    fs::create_dir_all(root.assignments().join("nonregular/runs/01/result.json")).unwrap();
    root.result("verbatim", "01", &json!({"runId": " id ", "settledAt": " non-date "}));
    root.result("blank-id", "01", &json!({"runId": " ", "settledAt": "non-date"}));
    let scan = scan_runs(&root.0).unwrap();
    assert_eq!(scan.run_dirs_seen, 5);
    assert_eq!(scan.runs.len(), 1);
    assert_eq!(scan.runs[0].subject.id, " id ");
    assert_eq!(scan.runs[0].ts, " non-date ");
    assert_eq!(scan.skipped["missing-result"], 1);
    assert_eq!(scan.skipped["unparseable"], 2);
    assert_eq!(scan.skipped["no-run-id"], 1);
    assert_eq!(scan.recent_runs, 3);
    assert_accounting(&root.0);
}

#[test]
fn owner_settlement_duplicates_keep_component_lexical_order_before_windowing() {
    let root = FixtureRoot::new();
    let first = root.result("a", "01", &json!({"runId": "shared", "settledAt": " "}));
    fs::write(first.parent().unwrap().join("run.json"),
        r#"{"settledAt":"2026-10-05T11:00:00Z"}"#).unwrap();
    root.result("a-", "01", &json!({
        "runId": "shared", "settledAt": "2026-10-06T11:00:00Z"
    }));
    let scan = scan_runs(&root.0).unwrap();
    assert_eq!(scan.runs.len(), 1);
    assert_eq!(scan.runs[0].attrs["assignmentId"], "a");
    assert_eq!(scan.runs[0].ts, "2026-10-05T11:00:00Z");
    assert_eq!(scan.skipped["duplicate-run-id"], 1);
    let window = Window {
        since: Some("2026-10-06T00:00:00Z".to_string()),
        until: None,
    };
    assert!(RunResultSource::new().observations(&root.0, &window).unwrap().is_empty());
    assert_eq!(scan_coverage(&root.0).unwrap()["observed"], 1);
    assert_accounting(&root.0);
}

#[test]
fn unicode_duplicate_winner_uses_utf8_component_order() {
    let root = FixtureRoot::new();
    for (name, timestamp) in [
        ("\u{10000}", "2026-10-05T11:00:00Z"),
        ("\u{e000}", "2026-10-05T10:00:00Z"),
    ] {
        root.result(name, "01", &json!({"runId": "same", "settledAt": timestamp}));
    }
    let scan = scan_runs(&root.0).unwrap();
    assert_eq!(scan.runs.len(), 1);
    assert_eq!(scan.runs[0].attrs["assignmentId"], "\u{e000}");
    assert_eq!(scan.runs[0].ts, "2026-10-05T10:00:00Z");
    assert_eq!(scan.skipped.get("duplicate-run-id"), Some(&1));
}
