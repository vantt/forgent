use fgos_observe::{ObservationSource, ObserveRequest, Window};
use fgos_run_result::{scan_coverage, scan_runs, RunResultSource, MAX_ASSIGNMENT_DEPTH};
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
        fgos_observe::metrics_cli::dispatch(&req, &sources, None, scan_coverage).unwrap();
    assert_eq!(coverage["layoutRule"], expected["layoutRule"]);
    assert_eq!(coverage["observed"], scan.runs.len());
    assert_eq!(coverage["recentRuns"], 9);
    req.sub = "runs".to_string();
    let runs = fgos_observe::metrics_cli::dispatch(&req, &sources, None, scan_coverage).unwrap();
    assert_eq!(runs["total"], coverage["observed"]);
    req.sub = "harness".to_string();
    let harness = fgos_observe::metrics_cli::dispatch(&req, &sources, None, scan_coverage).unwrap();
    assert_eq!(harness["runs"]["total"], coverage["observed"]);
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
    assert_eq!(scan.skipped["unparseable"], 1);
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
