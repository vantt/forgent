//! The hand-off, file side: which report a `unit-run:` input names (the highest round, the latest fallback attempt,
//! the wanted seat only), the byte copies a blind or anonymizing unit gets, and the refusal each failure is named by.
//! The pure naming and acceptance rules are replayed in `fgos-execution`'s `core_loops.rs`; these cases need files.

use std::path::{Path, PathBuf};

use fgos_execution::handoff::sha256_hex;
use fgos_execution_engine::unit_run::handoff::{copy_handoffs_into, resolve_inputs};
use fgos_execution_engine::unit_run::run_unit_contract::RunUnitError;
use serde_json::{json, Value};

fn scratch(tag: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("fgos-handoff-{tag}-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

/// One settled attempt of `seat` in `unit_run_id`, the way the runner leaves it; the attempt's run directory.
fn settle(
    root: &Path,
    unit_run_id: &str,
    seat: &str,
    attempt: &str,
    report: Option<&str>,
) -> PathBuf {
    let run_dir = root
        .join(".fgos/assignments")
        .join(unit_run_id)
        .join(seat)
        .join(attempt)
        .join("runs/01");
    std::fs::create_dir_all(&run_dir).unwrap();
    let rel = |file: &str| {
        run_dir
            .join(file)
            .strip_prefix(root)
            .unwrap()
            .to_string_lossy()
            .into_owned()
    };
    let mut result = json!({ "evidence": { "artifacts": [] }, "settleReports": [] });
    if let Some(text) = report {
        std::fs::write(run_dir.join("report.md"), text).unwrap();
        result["settleReports"] =
            json!([{ "path": rel("report.md"), "sha256": sha256_hex(text.as_bytes()) }]);
        result["evidence"]["artifacts"] = json!([rel("report.md")]);
    }
    std::fs::write(run_dir.join("result.json"), result.to_string()).unwrap();
    run_dir
}

fn answer(root: &Path, case_id: &str, step: &str) -> PathBuf {
    let dir = root
        .join(".fgos/workflow-runs")
        .join(case_id)
        .join("gate-answers");
    std::fs::create_dir_all(&dir).unwrap();
    let file = dir.join(format!("{step}.md"));
    std::fs::write(&file, "# answer\n").unwrap();
    file
}

fn reason(error: RunUnitError) -> String {
    error
        .fields
        .get("reason")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string()
}

fn refs(root: &Path, inputs: Value) -> Vec<String> {
    let resolved = resolve_inputs(&inputs, root, &json!({})).unwrap();
    resolved["refs"]
        .as_array()
        .unwrap()
        .iter()
        .map(|r| r.as_str().unwrap().to_string())
        .collect()
}

fn refused(root: &Path, inputs: Value, ask: Value) -> String {
    reason(resolve_inputs(&inputs, root, &ask).unwrap_err())
}

fn path_text(path: &Path) -> String {
    path.to_string_lossy().into_owned()
}

#[test]
fn the_highest_round_of_a_seat_wins_and_within_a_round_the_latest_fallback_attempt() {
    let root = scratch("rounds");
    settle(&root, "unit-run-a", "producer", "1", Some("round one\n"));
    let second = settle(&root, "unit-run-a", "producer", "2", Some("round two\n"));
    assert_eq!(
        refs(&root, json!(["unit-run:unit-run-a/producer"])),
        [path_text(&second.join("report.md"))]
    );
    settle(
        &root,
        "unit-run-b",
        "reviewer",
        "1",
        Some("first binding\n"),
    );
    let fallback = settle(
        &root,
        "unit-run-b",
        "reviewer",
        "1-fb1",
        Some("after the provider limit\n"),
    );
    assert_eq!(
        refs(&root, json!(["unit-run:unit-run-b/reviewer"])),
        [path_text(&fallback.join("report.md"))]
    );
    let _ = std::fs::remove_dir_all(&root);
}

/// Another seat's directory that cannot even be listed does not stop the wanted seat: only its files are read.
#[cfg(unix)]
#[test]
fn a_unit_run_input_reads_the_result_files_of_the_wanted_seat_only() {
    use std::os::unix::fs::PermissionsExt;
    let root = scratch("wanted");
    let wanted = settle(&root, "unit-run-a", "producer", "1", Some("# done\n"));
    let other = settle(&root, "unit-run-a", "reviewer", "1", Some("# other\n"));
    std::fs::write(other.join("result.json"), "not json").unwrap();
    let reviewer = root.join(".fgos/assignments/unit-run-a/reviewer");
    std::fs::set_permissions(&reviewer, std::fs::Permissions::from_mode(0o000)).unwrap();
    let got = refs(&root, json!(["unit-run:unit-run-a/producer"]));
    std::fs::set_permissions(&reviewer, std::fs::Permissions::from_mode(0o755)).unwrap();
    assert_eq!(got, [path_text(&wanted.join("report.md"))]);
    let _ = std::fs::remove_dir_all(&root);
}

#[test]
fn each_input_that_cannot_be_handed_over_names_its_reason() {
    let root = scratch("reasons");
    settle(&root, "unit-run-a", "panelist-1", "1", Some("one\n"));
    answer(&root, "wf-run-1", "voting-ranking");
    let none = json!({});
    assert_eq!(
        refused(&root, json!(["unit-run:unit-run-a/reviewer"]), none.clone()),
        "no-such-role"
    );
    assert_eq!(
        refused(
            &root,
            json!(["unit-run:unit-run-missing/producer"]),
            none.clone()
        ),
        "no-such-run"
    );
    for input in [
        "gate-answer:wf-run-1/other-step",
        "gate-answer:wf-run-missing/voting-ranking",
        "gate-answer:../wf-run-1/voting-ranking",
        "gate-answer:wf-run-1/..",
        "gate-answer:malformed",
    ] {
        assert_eq!(
            refused(&root, json!([input]), none.clone()),
            "no-such-answer",
            "{input}"
        );
    }
    assert_eq!(
        refused(
            &root,
            json!(["unit-run:unit-run-a/{seat}"]),
            json!({ "seat": "panelist-9" })
        ),
        "no-such-seat",
        "an own-seat input for a seat the earlier run did not have"
    );
    let _ = std::fs::remove_dir_all(&root);
}

#[test]
fn anonymized_inputs_are_byte_copies_and_a_refused_one_leaves_no_directory() {
    let root = scratch("anonymize");
    let a = settle(
        &root,
        "unit-run-a",
        "panelist-1",
        "1",
        Some("first opinion é\n"),
    );
    let b = settle(
        &root,
        "unit-run-a",
        "panelist-2",
        "1",
        Some("second opinion\n"),
    );
    let into = root.join("own-unit-dir/inputs");
    let resolved = resolve_inputs(
        &json!([
            "unit-run:unit-run-a/panelist-2",
            "unit-run:unit-run-a/panelist-1"
        ]),
        &root,
        &json!({ "anonymizeInto": path_text(&into) }),
    )
    .unwrap();
    assert_eq!(
        resolved["refs"],
        json!([
            path_text(&into.join("seat-A.md")),
            path_text(&into.join("seat-B.md"))
        ])
    );
    assert_eq!(
        std::fs::read(into.join("seat-A.md")).unwrap(),
        std::fs::read(b.join("report.md")).unwrap()
    );
    assert_eq!(
        std::fs::read(into.join("seat-B.md")).unwrap(),
        std::fs::read(a.join("report.md")).unwrap()
    );

    std::fs::write(a.join("report.md"), "changed\n").unwrap();
    let elsewhere = root.join("second-unit-dir/inputs");
    let ask = json!({ "anonymizeInto": path_text(&elsewhere) });
    assert_eq!(
        refused(
            &root,
            json!(["unit-run:unit-run-a/panelist-1"]),
            ask.clone()
        ),
        "report-changed-after-settle"
    );
    assert_eq!(
        refused(&root, json!(["unit-run:unit-run-a/nobody"]), ask),
        "no-such-role"
    );
    assert!(
        !elsewhere.exists(),
        "a refused hand-off leaves no directory behind"
    );
    let _ = std::fs::remove_dir_all(&root);
}

#[test]
fn a_copy_that_cannot_be_made_is_a_named_hand_off_failure() {
    let root = scratch("copy-failed");
    settle(&root, "unit-run-a", "panelist-1", "1", Some("x\n"));
    let blocker = root.join("blocker");
    std::fs::write(&blocker, "a file where a directory is needed").unwrap();
    let got = refused(
        &root,
        json!(["unit-run:unit-run-a/panelist-1"]),
        json!({ "anonymizeInto": path_text(&blocker.join("inputs")) }),
    );
    assert!(got.starts_with("copy-failed"), "{got}");
    let _ = std::fs::remove_dir_all(&root);
}

#[test]
fn blind_copies_are_kept_on_a_resume_and_refused_when_the_source_changed() {
    let root = scratch("blind-copy");
    let run_dir = settle(&root, "unit-run-a", "producer", "1", Some("opinion é\n"));
    let resolved = resolve_inputs(
        &json!(["unit-run:unit-run-a/producer"]),
        &root,
        &json!({ "blind": true }),
    )
    .unwrap();
    let map: Vec<Value> = resolved["inputMap"].as_array().unwrap().clone();
    let role_dir = root.join("role-dir");
    let copies = copy_handoffs_into(&role_dir, &map).unwrap();
    assert_eq!(
        copies,
        [path_text(
            &role_dir
                .join("inputs")
                .join(map[0]["name"].as_str().unwrap())
        )]
    );
    assert_eq!(std::fs::read(&copies[0]).unwrap(), b"opinion \xc3\xa9\n");

    // The same role again (a resume) keeps its copy without touching the source.
    std::fs::remove_file(run_dir.join("report.md")).unwrap();
    assert_eq!(copy_handoffs_into(&role_dir, &map).unwrap(), copies);
    let missing = reason(copy_handoffs_into(&root.join("third-role-dir"), &map).unwrap_err());
    assert!(missing.starts_with("copy-failed"), "{missing}");

    // Another role cannot be filled from a source that changed since resolution.
    std::fs::write(run_dir.join("report.md"), "changed\n").unwrap();
    assert_eq!(
        reason(copy_handoffs_into(&root.join("other-role-dir"), &map).unwrap_err()),
        "report-changed-after-settle"
    );
    let _ = std::fs::remove_dir_all(&root);
}
