//! Run result: the writer, the readers and the attribution replay the vectors the Node modules recorded
//! (`test/golden-recorders/run-result.recorder.mjs`), and the readers replay the phase-00 corpus.

use fgos_execution_engine::run_result::vocabulary as vocab;
use fgos_execution_engine::run_result::{
    attribute_claim_evidence_refs, attribute_workspace_changes, claim_report_path,
    evaluate_attribution_policy, interpret_run_result, is_assessment_required, is_verdict_seat,
    legacy_confidence, legacy_status, normalize_run_result_v3, read_settled_result,
    render_agent_result_claim_instructions, run_outcome, validate_agent_result_claim_contract,
    validate_run_result_v2, validate_run_result_v3, Attribution, ClaimContext, PolicyInput,
    RunOutcome, WorkspaceObservation,
};
use serde_json::{json, Value};
use std::collections::BTreeMap;
use std::path::PathBuf;

fn contracts() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../contracts")
}

fn vector(name: &str) -> Value {
    let text = std::fs::read_to_string(contracts().join("run-result").join(name))
        .unwrap_or_else(|e| panic!("{name}: {e}"));
    serde_json::from_str(&text).unwrap_or_else(|e| panic!("{name}: {e}"))
}

/// Equality that also demands the same key order, which is what the written bytes carry.
fn same_bytes(label: &str, got: &Value, want: &Value) {
    assert_eq!(
        serde_json::to_string(got).unwrap(),
        serde_json::to_string(want).unwrap(),
        "{label}"
    );
}

fn strs(value: &Value) -> Vec<&str> {
    value
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_str().unwrap())
        .collect()
}

fn outcome_json(o: &RunOutcome) -> Value {
    json!({
        "category": o.category, "executed": o.executed, "verdict": o.verdict, "refused": o.refused, "evidence": o.evidence,
        "satisfied": o.satisfied, "infraFailure": o.infra_failure, "failure": o.failure,
    })
}

#[test]
fn vocabularies_and_contract_names_match_the_node_release() {
    let v = vector("vocabularies.json");
    assert_eq!(
        v["contract"],
        json!({"id": vocab::RUN_RESULT_CONTRACT_ID, "version": vocab::RUN_RESULT_CONTRACT_VERSION})
    );
    assert_eq!(strs(&v["executionStatuses"]), vocab::EXECUTION_STATUSES);
    assert_eq!(strs(&v["assessmentVerdicts"]), vocab::ASSESSMENT_VERDICTS);
    assert_eq!(strs(&v["confidenceLevels"]), vocab::CONFIDENCE_LEVELS);
    assert_eq!(strs(&v["failureFamilies"]), vocab::FAILURE_FAMILIES);
    assert_eq!(strs(&v["policyDispositions"]), vocab::POLICY_DISPOSITIONS);
    assert_eq!(strs(&v["deliveryModes"]), vocab::DELIVERY_MODES);
    assert_eq!(strs(&v["provenanceValues"]), vocab::PROVENANCE_VALUES);
    assert_eq!(
        strs(&v["recognizedLegacyStatuses"]),
        vocab::RECOGNIZED_LEGACY_STATUSES
    );
    assert_eq!(
        v["leaseConflictFailureCode"],
        vocab::LEASE_CONFLICT_FAILURE_CODE
    );
    same_bytes(
        "corrupt classification",
        &fgos_execution_engine::run_result::corrupt_classification(),
        &v["corruptClassification"],
    );
    assert_eq!(
        strs(&v["attributionLevels"]),
        fgos_execution_engine::run_result::attribution::ATTRIBUTION_LEVELS
    );
    assert_eq!(
        v["claimContract"],
        json!({"id": "agent-result-claim", "version": 2})
    );
    assert_eq!(
        strs(&v["claimStatuses"]),
        fgos_execution_engine::run_result::claim::ALLOWED_AGENT_CLAIM_STATUSES
    );
    assert_eq!(
        v["frictionsMax"],
        fgos_execution_engine::run_result::claim::CLAIM_FRICTIONS_MAX
    );
    assert_eq!(
        v["frictionFieldMax"],
        fgos_execution_engine::run_result::claim::CLAIM_FRICTION_FIELD_MAX
    );
}

#[test]
fn the_writer_writes_the_bytes_node_wrote_for_every_outcome_class() {
    for case in vector("writer.json").as_array().unwrap() {
        let name = case["name"].as_str().unwrap();
        let record = normalize_run_result_v3(&case["input"], "2026-11-19T01:02:03.000Z");
        same_bytes(name, &record, &case["record"]);
        assert_eq!(
            legacy_status(&record),
            case["status"].as_str().unwrap(),
            "{name}: status"
        );
        assert_eq!(
            legacy_confidence(&record),
            case["confidence"],
            "{name}: confidence"
        );
    }
}

#[test]
fn a_record_without_a_settled_time_takes_the_clock_it_is_given() {
    let record = normalize_run_result_v3(&json!({"runId": "r"}), "2026-11-19T01:02:03.000Z");
    assert_eq!(record["settledAt"], "2026-11-19T01:02:03.000Z");
}

#[test]
fn the_previous_node_release_reads_what_the_rust_writer_wrote() {
    // The writer test pins Rust's bytes to Node's; Node's own reading of those bytes is the recorded `nodeRead`.
    for case in vector("writer.json").as_array().unwrap() {
        let name = case["name"].as_str().unwrap();
        let record = normalize_run_result_v3(&case["input"], "2026-11-19T01:02:03.000Z");
        let read = interpret_run_result(&record, None);
        let node = &case["nodeRead"];
        assert_eq!(
            !read.corrupt,
            node["valid"].as_bool().unwrap(),
            "{name}: valid"
        );
        assert_eq!(
            read.status,
            node["status"].as_str().unwrap(),
            "{name}: status"
        );
        assert_eq!(read.confidence, node["confidence"], "{name}: confidence");
        assert_eq!(
            outcome_json(&run_outcome(&record, None)),
            node["outcome"],
            "{name}: outcome"
        );
    }
}

fn expected_run_id(case: &Value) -> Option<&str> {
    case["expectedRunId"].as_str()
}

#[test]
fn readers_give_v1_v2_v3_and_corrupt_records_the_reading_node_gave() {
    let readers = vector("readers.json");
    for case in readers["records"].as_array().unwrap() {
        let name = case["name"].as_str().unwrap();
        let read = interpret_run_result(&case["record"], expected_run_id(case));
        let want = &case["read"];
        same_bytes(&format!("{name}: record"), &read.record, &want["record"]);
        assert_eq!(
            read.status,
            want["status"].as_str().unwrap(),
            "{name}: status"
        );
        assert_eq!(read.confidence, want["confidence"], "{name}: confidence");
        assert_eq!(
            read.corrupt,
            want["corrupt"].as_bool().unwrap(),
            "{name}: corrupt"
        );
    }
}

#[test]
fn validators_name_the_same_reasons_for_v2_and_v3() {
    let readers = vector("readers.json");
    for case in readers["records"].as_array().unwrap() {
        let name = case["name"].as_str().unwrap();
        let expected = expected_run_id(case);
        let reasons = |v: &fgos_execution_engine::run_result::Validation| {
            v.reasons.iter().map(|r| json!(r)).collect::<Vec<_>>()
        };
        if let Some(want) = case.get("validateV2") {
            let got = validate_run_result_v2(&case["record"], expected);
            assert_eq!(
                got.valid,
                want["valid"].as_bool().unwrap(),
                "{name}: v2 valid"
            );
            assert_eq!(
                got.corrupt,
                want["corrupt"].as_bool().unwrap(),
                "{name}: v2 corrupt"
            );
            assert_eq!(
                Value::Array(reasons(&got)),
                want["reasons"],
                "{name}: v2 reasons"
            );
        }
        let want = &case["validateV3"];
        let got = validate_run_result_v3(&case["record"], expected);
        assert_eq!(
            got.valid,
            want["valid"].as_bool().unwrap(),
            "{name}: v3 valid"
        );
        assert_eq!(
            got.corrupt,
            want["corrupt"].as_bool().unwrap(),
            "{name}: v3 corrupt"
        );
        assert_eq!(
            Value::Array(reasons(&got)),
            want["reasons"],
            "{name}: v3 reasons"
        );
        let derived = got
            .derived_outcome
            .map(|o| json!({"category": o.category, "reason": o.reason}));
        assert_eq!(
            derived.unwrap_or(Value::Null),
            want.get("derivedOutcome").cloned().unwrap_or(Value::Null),
            "{name}: v3 derived outcome"
        );
    }
}

#[test]
fn run_outcome_reads_every_record_under_every_evidence_floor_as_node_did() {
    let readers = vector("readers.json");
    let floors = readers["floors"].as_array().unwrap();
    for case in readers["records"].as_array().unwrap() {
        let name = case["name"].as_str().unwrap();
        for (floor, want) in floors.iter().zip(case["outcomes"].as_array().unwrap()) {
            let got = run_outcome(&case["record"], (!floor.is_null()).then_some(floor));
            assert_eq!(&outcome_json(&got), want, "{name} under floor {floor}");
        }
    }
}

#[test]
fn deriving_an_outcome_from_a_classification_matches_the_recorded_rows() {
    for row in vector("readers.json")["deriveOutcomes"].as_array().unwrap() {
        let got = fgos_run_result::derive_outcome(&row["classification"]);
        assert_eq!(
            json!({"category": got.category, "reason": got.reason}),
            row["outcome"],
            "{}",
            row["classification"]
        );
    }
}

#[test]
fn readers_replay_the_phase_00_corpus_and_the_settled_read_of_each_run() {
    let readers = vector("readers.json");
    for case in readers["corpus"].as_array().unwrap() {
        let dir = case["dir"].as_str().unwrap();
        let run_dir = contracts().join("corpus").join(dir);
        let run_id = case["runId"].as_str().unwrap();
        let text = std::fs::read_to_string(run_dir.join("result.json")).unwrap();
        let record: Value = serde_json::from_str(&text).unwrap();
        let read = interpret_run_result(&record, Some(run_id));
        assert_eq!(
            read.status,
            case["status"].as_str().unwrap(),
            "{dir}: status"
        );
        assert_eq!(read.confidence, case["confidence"], "{dir}: confidence");
        assert_eq!(
            read.corrupt,
            case["corrupt"].as_bool().unwrap(),
            "{dir}: corrupt"
        );
        assert_eq!(
            run_outcome(&record, None).category,
            case["category"].as_str().unwrap(),
            "{dir}: category"
        );
        let settled = read_settled_result(&run_dir, run_id);
        assert_eq!(
            settled.is_some(),
            case["settledReadable"].as_bool().unwrap(),
            "{dir}: settled readable"
        );
        if let Some(settled) = settled {
            same_bytes(
                &format!("{dir}: settled record"),
                &settled.record,
                &case["settledRead"],
            );
        }
        assert!(
            read_settled_result(&run_dir, "run_other").is_none(),
            "{dir}: another run id never reads settled"
        );
    }
}

#[test]
fn a_directory_without_a_readable_sound_result_has_no_settled_result() {
    let edges = vector("readers.json")["settledEdges"].clone();
    assert_eq!(edges["missingFile"], Value::Null);
    assert_eq!(edges["invalidJson"], Value::Null);
    assert_eq!(edges["corruptRecord"], Value::Null);
    let dir = std::env::temp_dir().join(format!("run-result-edges-{}", std::process::id()));
    std::fs::create_dir_all(&dir).unwrap();
    assert!(read_settled_result(&dir, "r").is_none());
    std::fs::write(dir.join("result.json"), "{not json").unwrap();
    assert!(read_settled_result(&dir, "r").is_none());
    std::fs::write(
        dir.join("result.json"),
        r#"{"contract":{"id":"assignment-run-result","version":3},"runId":"r"}"#,
    )
    .unwrap();
    assert!(read_settled_result(&dir, "r").is_none());
    std::fs::remove_dir_all(&dir).unwrap();
}

fn string_list(value: Option<&Value>) -> Vec<String> {
    value
        .and_then(Value::as_array)
        .map(|a| {
            a.iter()
                .filter_map(|v| v.as_str().map(str::to_string))
                .collect()
        })
        .unwrap_or_default()
}

fn hash_map(value: Option<&Value>) -> BTreeMap<String, String> {
    value
        .and_then(Value::as_object)
        .map(|o| {
            o.iter()
                .filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string())))
                .collect()
        })
        .unwrap_or_default()
}

/// The list a `{paths|writeScope}`-shaped declaration names, or `None` when there is none or it is not a list.
fn declared_list(value: Option<&Value>, first: &str, second: &str) -> Option<Vec<String>> {
    let declaration = value.filter(|v| !v.is_null())?;
    let chosen = declaration
        .get(first)
        .filter(|v| !v.is_null() && *v != &json!(false))
        .or_else(|| declaration.get(second))
        .filter(|v| v.is_array())?;
    Some(string_list(Some(chosen)))
}

#[test]
fn workspace_changes_are_attributed_with_the_levels_node_gave() {
    for case in vector("attribution.json")["workspace"].as_array().unwrap() {
        let name = case["name"].as_str().unwrap();
        let input = &case["in"];
        let pre = string_list(input.get("preLaunchDirt"));
        let post = string_list(input.get("postRunDirt"));
        let coverage = declared_list(input.get("declaredCoverage"), "paths", "writeScope");
        let attested = declared_list(
            input.get("adapterAttestation"),
            "writtenPaths",
            "attestedPaths",
        );
        let got = attribute_workspace_changes(&WorkspaceObservation {
            pre_launch_dirt: &pre,
            post_run_dirt: &post,
            dirty_before_hashes: hash_map(input.get("dirtyBeforeHashes")),
            post_run_hashes: hash_map(input.get("postRunHashes")),
            declared_coverage: coverage.as_deref(),
            attested_paths: attested.as_deref(),
        })
        .unwrap();
        same_bytes(
            name,
            &serde_json::to_value(got).unwrap(),
            &case["out"]["ok"],
        );
    }
}

#[test]
fn worker_claim_evidence_refs_are_correlated_and_never_proven() {
    for case in vector("attribution.json")["claimRefs"].as_array().unwrap() {
        let refs = case["in"]
            .get("evidenceRefs")
            .and_then(Value::as_array)
            .cloned()
            .unwrap_or_default();
        same_bytes(
            "claim refs",
            &serde_json::to_value(attribute_claim_evidence_refs(&refs)).unwrap(),
            &case["out"],
        );
    }
}

#[test]
fn the_policy_refuses_only_proven_writes_and_reports_correlated_ones_as_warnings() {
    for case in vector("attribution.json")["policy"].as_array().unwrap() {
        let name = case["name"].as_str().unwrap();
        let input = &case["in"];
        let attributions: Vec<Attribution> =
            serde_json::from_value(input.get("attributions").cloned().unwrap_or(json!([])))
                .unwrap();
        let scope = input
            .get("writeScope")
            .filter(|v| v.is_array())
            .map(|v| string_list(Some(v)));
        let mutated = string_list(input.get("mutatedDirtyBeforeFiles"));
        let got = evaluate_attribution_policy(&PolicyInput {
            attributions: &attributions,
            is_read_only: input.get("isReadOnly") == Some(&json!(true)),
            write_scope: scope.as_deref(),
            mutated_dirty_before_files: &mutated,
            contradictory_claim: input.get("contradictoryClaim") == Some(&json!(true)),
        })
        .unwrap();
        same_bytes(
            name,
            &serde_json::to_value(got).unwrap(),
            &case["out"]["ok"],
        );
    }
}

fn claim_context(context: &Value) -> ClaimContext {
    let assignment = context.get("assignment").cloned().unwrap_or(Value::Null);
    let pick = |key: &str| {
        context
            .get(key)
            .filter(|v| !v.is_null())
            .or_else(|| assignment.get(key).filter(|v| !v.is_null()))
            .cloned()
    };
    ClaimContext {
        role: pick("role").and_then(|v| v.as_str().map(str::to_string)),
        operation: pick("operation").and_then(|v| v.as_str().map(str::to_string)),
        posture_verdict: pick("posture").map(|p| p.get("verdict") == Some(&json!(true))),
    }
}

#[test]
fn claim_validation_refuses_and_accepts_exactly_the_claims_node_did() {
    for case in vector("claim.json")["validate"].as_array().unwrap() {
        let got =
            validate_agent_result_claim_contract(&case["value"], &claim_context(&case["context"]));
        let want = &case["out"];
        assert_eq!(
            got.valid,
            want["valid"].as_bool().unwrap(),
            "{} in {}",
            case["value"],
            case["context"]
        );
        assert_eq!(
            got.reason.as_deref(),
            want["reason"].as_str(),
            "{} in {}",
            case["value"],
            case["context"]
        );
    }
}

#[test]
fn a_checker_seat_and_a_recheck_operation_require_an_assessment() {
    for case in vector("claim.json")["verdictSeat"].as_array().unwrap() {
        let context = claim_context(&case["context"]);
        assert_eq!(
            is_verdict_seat(&context),
            case["verdictSeat"].as_bool().unwrap(),
            "{}",
            case["context"]
        );
        assert_eq!(
            is_assessment_required(&context),
            case["assessmentRequired"].as_bool().unwrap(),
            "{}",
            case["context"]
        );
        assert_eq!(
            case["requirement"]["required"],
            is_assessment_required(&context),
            "{}",
            case["context"]
        );
    }
}

#[test]
fn claim_instructions_read_the_same_to_the_worker() {
    for case in vector("claim.json")["render"].as_array().unwrap() {
        let text = render_agent_result_claim_instructions(&claim_context(&case["context"]));
        assert_eq!(text, case["text"].as_str().unwrap(), "{}", case["context"]);
    }
}

#[test]
fn a_claim_file_pairs_with_the_report_beside_it() {
    for case in vector("claim.json")["reportPath"].as_array().unwrap() {
        assert_eq!(
            claim_report_path(case["in"].as_str().unwrap()),
            case["out"].as_str().unwrap(),
            "{}",
            case["in"]
        );
    }
}
