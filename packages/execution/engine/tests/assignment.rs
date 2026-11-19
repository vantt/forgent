//! Assignment model: ids, the declared and inline builders, the prompt, the brief, the layout on disk, the tier cell
//! and the Work-item refusal replay the vectors the Node modules recorded
//! (`test/golden-recorders/assignment.recorder.mjs`). Every written value is compared with its key order, which is
//! what the previous Node release reads back.

use std::fs;
use std::path::{Path, PathBuf};

use fgos_execution_engine::assignment::brief::{
    brief_paths, deadline_text, render_brief, render_pointer,
};
use fgos_execution_engine::assignment::builder::{
    build_assignment, build_unit_run_assignment, claim_assignment_id, create_assignment_id,
    is_read_only_assignment, render_assignment_prompt, BuildOptions, ContractPort, NoPromptSeams,
    PromptOptions, SeatAttempt,
};
use fgos_execution_engine::assignment::layout::{
    assignment_dir, find_run_dir, is_within_dir, scan_assignment_layout, skipped_json,
};
use fgos_execution_engine::assignment::normalizer::{
    stamp_declared_assignment, stamp_inline_assignment, KNOWN_MUTATING_OPS, NORMALIZER_VERSION,
    READ_ONLY_OPS, READ_ONLY_ROLES,
};
use fgos_execution_engine::assignment::tier_cell::{parse_tier_cell, REASONING_EFFORT_VALUES};
use fgos_execution_engine::assignment::work_item_input::{
    refuse_work_item_input, WORK_ITEM_INPUT_KEYS, WORK_ITEM_KEYS,
};
use fgos_execution_engine::assignment::Refusal;
use serde_json::{json, Value};

fn vector(name: &str) -> Value {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../contracts/assignment")
        .join(name);
    let text = fs::read_to_string(&path).unwrap_or_else(|e| panic!("{name}: {e}"));
    serde_json::from_str(&text).unwrap_or_else(|e| panic!("{name}: {e}"))
}

fn same_bytes(label: &str, got: &Value, want: &Value) {
    assert_eq!(
        serde_json::to_string(got).unwrap(),
        serde_json::to_string(want).unwrap(),
        "{label}"
    );
}

fn cases<'a>(v: &'a Value, key: &str) -> &'a Vec<Value> {
    v[key]
        .as_array()
        .unwrap_or_else(|| panic!("{key} is not a list"))
}

/// What a vector's `{ ok } | { error: { message } }` says a call gave.
fn expect(label: &str, got: Result<Value, Refusal>, want: &Value) {
    match (got, want.get("ok"), want.get("error")) {
        (Ok(value), Some(ok), _) => same_bytes(label, &value, ok),
        (Err(refusal), _, Some(error)) => {
            assert_eq!(
                Value::String(refusal.message.clone()),
                error["message"],
                "{label}"
            )
        }
        (got, ..) => panic!("{label}: got {got:?}, vector says {want}"),
    }
}

/// A scratch directory under the system temp dir, removed on drop.
struct Scratch(PathBuf);

impl Scratch {
    fn new(tag: &str) -> Scratch {
        let dir =
            std::env::temp_dir().join(format!("fgos-assignment-{tag}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        Scratch(dir)
    }
}

impl Drop for Scratch {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

/// The contract validator belongs to the `contract` module; the builder only asks it. This port answers with what
/// the Node validator answered for the same contract, so the vectors judge the builder and not a second validator.
struct Recorded {
    verdict: Value,
}

impl ContractPort for Recorded {
    fn validate(&self, _: &Value, _: &Value) -> Result<(), Refusal> {
        match self.verdict.get("error") {
            Some(error) => Err(Refusal::new(error["message"].as_str().unwrap())),
            None => Ok(()),
        }
    }
    fn carries_protocol_stamp(&self, contract: &Value) -> bool {
        contract["constraints"].as_array().is_some_and(|list| {
            list.iter().any(|c| {
                c.as_str()
                    .is_some_and(|c| c.starts_with("protocol-operation:"))
            })
        })
    }
}

fn recorded_for(case: &Value) -> Recorded {
    Recorded {
        verdict: case["validator"].clone(),
    }
}

#[test]
fn the_normalizer_stamps_declared_and_inline_assignments_as_node_did() {
    let v = vector("normalizer.json");
    assert_eq!(v["version"], NORMALIZER_VERSION);
    let names = |value: &Value| -> Vec<String> {
        let mut out: Vec<String> = value
            .as_array()
            .unwrap()
            .iter()
            .map(|n| n.as_str().unwrap().to_string())
            .collect();
        out.sort();
        out
    };
    let sorted = |list: &[&str]| -> Vec<String> {
        let mut out: Vec<String> = list.iter().map(|s| s.to_string()).collect();
        out.sort();
        out
    };
    assert_eq!(names(&v["readOnlyRoles"]), sorted(&READ_ONLY_ROLES));
    assert_eq!(names(&v["knownMutatingOps"]), sorted(&KNOWN_MUTATING_OPS));
    assert_eq!(names(&v["readOnlyOps"]), sorted(&READ_ONLY_OPS));
    for case in cases(&v, "declared") {
        let stamp =
            stamp_declared_assignment(case["role"].as_str(), case["operation"].as_str().unwrap());
        same_bytes(
            &format!("declared {} {}", case["role"], case["operation"]),
            &stamp.to_json(),
            &case["stamp"],
        );
    }
    for case in cases(&v, "inline") {
        let carries = case["carriesStamp"].as_bool().unwrap();
        let got = stamp_inline_assignment(&case["contract"], carries);
        expect(case["name"].as_str().unwrap(), got, &case["result"]);
    }
}

#[test]
fn assignment_ids_count_up_past_the_directories_and_ids_already_present() {
    let v = vector("builder.json");
    let scratch = Scratch::new("ids");
    for case in cases(&v, "ids") {
        let input = &case["input"];
        let existing: Vec<String> = input["existingIds"]
            .as_array()
            .map(|l| l.iter().map(|i| i.as_str().unwrap().to_string()).collect())
            .unwrap_or_default();
        let id = create_assignment_id(
            input["workId"].as_str(),
            input["stage"].as_str(),
            input["operation"].as_str(),
            input["caller"]["writerId"].as_str(),
            &existing,
            Some(&scratch.0),
        );
        assert_eq!(Value::String(id), case["id"], "{}", case["label"]);
        for dir in case["existingDirs"].as_array().unwrap() {
            fs::create_dir_all(scratch.0.join(dir.as_str().unwrap())).unwrap();
        }
    }
}

fn options_of(case: &Value, repo: Option<&Path>, dir: &Path) -> BuildOptionsOwned {
    BuildOptionsOwned {
        created_at: case["options"]["createdAt"].as_str().map(str::to_string),
        allow_synthetic: case["options"]["allowSyntheticCompatibilityOperation"]
            .as_bool()
            .unwrap_or(false),
        repo_root: repo.map(Path::to_path_buf),
        dir: dir.to_path_buf(),
    }
}

struct BuildOptionsOwned {
    created_at: Option<String>,
    allow_synthetic: bool,
    repo_root: Option<PathBuf>,
    dir: PathBuf,
}

impl BuildOptionsOwned {
    fn as_options(&self) -> BuildOptions<'static> {
        BuildOptions {
            created_at: self.created_at.clone(),
            allow_synthetic_compatibility_operation: self.allow_synthetic,
            repo_root: self.repo_root.clone(),
            assignments_dir: Some(self.dir.clone()),
            ..BuildOptions::default()
        }
    }
}

#[test]
fn declared_assignments_are_built_stamped_and_refused_as_node_did() {
    let v = vector("builder.json");
    let scratch = Scratch::new("declared");
    let repo = scratch.0.join("repo");
    fs::create_dir_all(repo.join("domains/coding/task-specs")).unwrap();
    fs::write(
        repo.join("domains/coding/task-specs/validate-plan.md"),
        "# spec\n",
    )
    .unwrap();
    let none = scratch.0.join("none");
    for case in cases(&v, "declared") {
        let name = case["name"].as_str().unwrap();
        let repo_root = case.get("taskSpecs").map(|_| repo.as_path());
        let options = options_of(case, repo_root, &none);
        let got = build_assignment(
            &case["input"],
            &options.as_options(),
            &Recorded { verdict: json!({}) },
        );
        let want = &case["result"];
        let want = if want["error"]["message"]
            .as_str()
            .is_some_and(|m| m.contains("<repo>"))
        {
            json!({ "error": { "message": want["error"]["message"].as_str().unwrap().replace("<repo>", repo.to_str().unwrap()) } })
        } else {
            want.clone()
        };
        expect(name, got, &want);
    }
}

#[test]
fn inline_assignments_freeze_the_contract_and_caller_as_node_did() {
    let v = vector("builder.json");
    let scratch = Scratch::new("inline");
    let none = scratch.0.join("none");
    for case in cases(&v, "inline") {
        let name = case["name"].as_str().unwrap();
        let options = options_of(case, None, &none);
        let params = &case["input"];
        let got = build_assignment(params, &options.as_options(), &recorded_for(case));
        expect(name, got, &case["result"]);
    }
}

#[test]
fn a_domain_harness_runs_between_the_validator_and_the_stamp() {
    let v = vector("builder.json");
    let case = &cases(&v, "inline")[0];
    let seam = |contract: &Value| -> Result<(Value, Option<Value>), Refusal> {
        let mut enriched = contract.clone();
        enriched["objective"] = json!("enriched objective");
        Ok((enriched, Some(json!({ "persona": "p", "tier": "nano" }))))
    };
    let mut options = BuildOptions {
        created_at: Some("2026-11-19T00:00:00.000Z".into()),
        ..BuildOptions::default()
    };
    options.domain_harness = Some(&seam);
    let got = build_assignment(&case["input"], &options, &recorded_for(case)).unwrap();
    assert_eq!(got["objective"], "enriched objective");
    assert_eq!(
        got["provenance"]["validators"],
        json!(["execution-contract-schema", "domain-harness-seam"])
    );
    // the contract's own tier wins over the harness's, and the harness's other keys stay
    let mut with_tier = case["input"].clone();
    with_tier["provenance"]["contract"]["policy"] = json!({ "tier": "standard" });
    let got = build_assignment(&with_tier, &options, &recorded_for(case)).unwrap();
    same_bytes(
        "merged policy",
        &got["policy"],
        &json!({ "persona": "p", "tier": "standard" }),
    );
    // a harness that throws surfaces its refusal
    let failing =
        |_: &Value| -> Result<(Value, Option<Value>), Refusal> { Err(Refusal::new("harness bug")) };
    options.domain_harness = Some(&failing);
    assert_eq!(
        build_assignment(&case["input"], &options, &recorded_for(case))
            .unwrap_err()
            .message,
        "harness bug"
    );
}

#[test]
fn claiming_an_id_reserves_its_directory_and_a_refused_build_leaves_no_trace() {
    let v = vector("builder.json");
    let inline = cases(&v, "inline");
    let scratch = Scratch::new("claims");
    let dir = scratch.0.join("claims");
    let options = BuildOptions {
        created_at: Some("2026-11-19T00:00:00.000Z".into()),
        assignments_dir: Some(dir.clone()),
        ..BuildOptions::default()
    };
    let steps = cases(&v, "claim");
    let refused_case = &inline[5];
    let refused = claim_assignment_id(
        &mut || {
            build_assignment(
                &refused_case["input"],
                &BuildOptions::default(),
                &recorded_for(refused_case),
            )
        },
        &dir,
    );
    assert_eq!(steps[0]["step"], "refused-build");
    assert_eq!(
        Value::String(refused.unwrap_err().message),
        steps[0]["result"]["error"]["message"]
    );
    assert_eq!(dir.exists(), steps[0]["dirCreated"].as_bool().unwrap());

    let good = &inline[0];
    let mut build = || build_assignment(&good["input"], &options, &recorded_for(good));
    let first = claim_assignment_id(&mut build, &dir).unwrap();
    let second = claim_assignment_id(&mut build, &dir).unwrap();
    let ids = json!([first["assignmentId"], second["assignmentId"]]);
    assert_eq!(ids, steps[1]["ids"]);
    let mut dirs: Vec<String> = fs::read_dir(&dir)
        .unwrap()
        .map(|e| e.unwrap().file_name().into_string().unwrap())
        .collect();
    dirs.sort();
    assert_eq!(json!(dirs), steps[1]["dirs"]);
}

fn prompt_options(value: &Value) -> PromptOptions {
    PromptOptions {
        cwd: value["cwd"].as_str().map(PathBuf::from),
        run_dir: value["runDir"].as_str().map(str::to_string),
        effective_contract: value.get("effectiveContract").cloned(),
        ..PromptOptions::default()
    }
}

#[test]
fn the_worker_prompt_is_the_text_node_rendered() {
    let v = vector("prompt.json");
    for case in cases(&v, "prompts") {
        let got = render_assignment_prompt(
            &case["assignment"],
            &prompt_options(&case["options"]),
            &NoPromptSeams,
        )
        .map(Value::String);
        expect(case["name"].as_str().unwrap(), got, &case["result"]);
    }
}

#[test]
fn a_prompt_names_a_template_it_cannot_render_instead_of_dropping_it() {
    let assignment = json!({ "assignmentId": "asgn_x_001", "contractTemplate": "t", "role": "r" });
    let refusal = render_assignment_prompt(&assignment, &PromptOptions::default(), &NoPromptSeams)
        .unwrap_err();
    assert!(
        refusal.message.contains("contractTemplate"),
        "{}",
        refusal.message
    );
    let refusal =
        render_assignment_prompt(&json!("text"), &PromptOptions::default(), &NoPromptSeams)
            .unwrap_err();
    assert_eq!(
        refusal.message,
        "renderAssignmentPrompt requires an assignment object"
    );
}

#[test]
fn read_only_is_what_the_stamped_mutation_says() {
    let v = vector("prompt.json");
    for case in cases(&v, "readOnly") {
        assert_eq!(
            is_read_only_assignment(&case["assignment"]),
            case["readOnly"].as_bool().unwrap(),
            "{}",
            case["assignment"]
        );
    }
}

#[test]
fn a_unit_run_assignment_carries_its_seat_binding_policy_and_persona_pin() {
    let v = vector("prompt.json");
    for case in cases(&v, "unitRun") {
        let (ctx, role, extra) = (&case["ctx"], &case["role"], &case["extra"]);
        let attempt = SeatAttempt {
            seat: &role["seat"],
            round: &role["round"],
            read_only: role["readOnly"].as_bool().unwrap(),
            bound: &extra["bound"],
            assignment_id: extra["assignmentId"].as_str().unwrap(),
            objective: extra["objective"].as_str().unwrap(),
            context_refs: &extra["contextRefs"],
            carries_operation: extra["carriesOperation"].as_bool().unwrap(),
            writes: &extra["writes"],
        };
        let got = build_unit_run_assignment(
            &ctx["unitRecord"],
            ctx["unitRunId"].as_str().unwrap(),
            &ctx["declaredOp"],
            &ctx["unit"],
            &attempt,
        );
        same_bytes(case["name"].as_str().unwrap(), &got, &case["assignment"]);
        assert_eq!(
            is_read_only_assignment(&got),
            case["readOnly"].as_bool().unwrap()
        );
    }
}

#[test]
fn the_brief_and_its_pointer_are_the_text_node_wrote() {
    let v = vector("brief.json");
    for case in cases(&v, "paths") {
        let paths = brief_paths(
            case["runDir"].as_str().unwrap(),
            case["round"].as_u64().unwrap(),
        );
        let want = &case["paths"];
        assert_eq!(
            vec![
                &paths.run_dir,
                &paths.outbox,
                &paths.brief_path,
                &paths.ack_path,
                &paths.report_path,
                &paths.result_path,
                &paths.effective_execution_contract_path
            ],
            [
                "runDir",
                "outbox",
                "briefPath",
                "ackPath",
                "reportPath",
                "resultPath",
                "effectiveExecutionContractPath"
            ]
            .iter()
            .map(|k| want[k].as_str().unwrap().to_string())
            .collect::<Vec<_>>()
            .iter()
            .collect::<Vec<_>>(),
            "{}",
            case["runDir"]
        );
    }
    for case in cases(&v, "deadlines") {
        let got = deadline_text(
            Some(&case["timeoutMs"]).filter(|t| !t.is_null()),
            case["now"].as_i64().unwrap(),
            &|_| 0,
        );
        assert_eq!(
            got.map(Value::String).unwrap_or(Value::Null),
            case["text"],
            "{}",
            case["timeoutMs"]
        );
    }
    let now = v["nowMs"].as_i64().unwrap();
    for case in cases(&v, "briefs") {
        let contract = Some(&case["effectiveContract"]).filter(|c| !c.is_null());
        let got = render_brief(
            case["prompt"].as_str().unwrap(),
            case["round"].as_u64().unwrap(),
            case["runDir"].as_str().unwrap(),
            case["agentName"].as_str(),
            contract,
            now,
            &|_| 0,
        );
        assert_eq!(got, case["text"].as_str().unwrap(), "{}", case["name"]);
    }
    for case in cases(&v, "pointers") {
        assert_eq!(
            render_pointer(
                case["runDir"].as_str().unwrap(),
                case["round"].as_u64().unwrap()
            ),
            case["text"].as_str().unwrap()
        );
    }
}

#[test]
fn a_tier_cell_parses_to_its_ordered_entries_or_names_what_is_wrong() {
    let v = vector("tier-cell.json");
    let efforts: Vec<&str> = v["effortValues"]
        .as_array()
        .unwrap()
        .iter()
        .map(|e| e.as_str().unwrap())
        .collect();
    assert_eq!(efforts, REASONING_EFFORT_VALUES);
    for case in cases(&v, "cells") {
        let got = parse_tier_cell(&case["cell"], case["family"].as_str().unwrap());
        let want = &case["result"];
        match (got, want.get("ok"), want.get("error")) {
            (Ok(entries), Some(ok), _) => {
                let got: Vec<Value> = entries.iter().map(|e| e.to_json()).collect();
                same_bytes(&case["cell"].to_string(), &Value::Array(got), ok);
            }
            (Err(message), _, Some(error)) => {
                assert_eq!(Value::String(message), error["message"], "{}", case["cell"])
            }
            (got, ..) => panic!("{}: got {got:?}, vector says {want}", case["cell"]),
        }
    }
}

#[test]
fn a_work_item_input_is_refused_naming_the_keys_found() {
    let v = vector("work-item-input.json");
    let keys: Vec<&str> = v["keys"]
        .as_array()
        .unwrap()
        .iter()
        .map(|k| k.as_str().unwrap())
        .collect();
    assert_eq!(keys, WORK_ITEM_KEYS);
    for case in cases(&v, "cases") {
        let narrowed: Option<Vec<&str>> = case["keys"]
            .as_array()
            .map(|k| k.iter().map(|k| k.as_str().unwrap()).collect());
        let got = refuse_work_item_input(
            &case["params"],
            case["where"].as_str().unwrap(),
            narrowed.as_deref().unwrap_or(&WORK_ITEM_INPUT_KEYS),
        )
        .map(|()| Value::Null);
        expect(&case["params"].to_string(), got, &case["result"]);
    }
}

#[cfg(unix)]
#[test]
fn the_assignment_tree_lists_run_directories_and_stops_at_every_barrier() {
    let v = vector("layout.json");
    let scratch = Scratch::new("layout");
    let fgos = scratch.0.join(".fgos");
    for entry in cases(&v, "tree") {
        let rel = entry[0].as_str().unwrap();
        let path = fgos.join(rel);
        if entry[1].is_null() {
            fs::create_dir_all(&path).unwrap();
        } else {
            fs::create_dir_all(path.parent().unwrap()).unwrap();
            fs::write(&path, entry[1].to_string()).unwrap();
        }
    }
    for link in cases(&v, "symlinks") {
        let elsewhere = scratch.0.join("elsewhere");
        fs::create_dir_all(&elsewhere).unwrap();
        std::os::unix::fs::symlink(&elsewhere, fgos.join(link[0].as_str().unwrap())).unwrap();
    }
    let rel = |p: &Path| {
        p.strip_prefix(&fgos)
            .unwrap()
            .to_string_lossy()
            .into_owned()
    };
    assert_eq!(v["maxDepth"], 16);
    let scan = scan_assignment_layout(&fgos);
    let runs: Vec<Value> = scan
        .runs
        .iter()
        .map(|r| json!({ "assignmentId": r.assignment_id, "attempt": r.attempt, "runDir": rel(&r.run_dir), "hasAssignmentJson": r.has_assignment_json }))
        .collect();
    same_bytes("runs", &Value::Array(runs), &v["scan"]["runs"]);
    same_bytes("skipped", &skipped_json(&scan), &v["scan"]["skipped"]);
    assert_eq!(
        scan.run_dirs_seen,
        v["scan"]["runDirsSeen"].as_u64().unwrap()
    );
    for case in cases(&v, "assignmentDir") {
        let got =
            assignment_dir(&fgos, case["id"].as_str().unwrap()).map(|d| Value::String(rel(&d)));
        assert_eq!(got.unwrap_or(Value::Null), case["dir"], "{}", case["id"]);
    }
    for case in cases(&v, "within") {
        let got = is_within_dir(
            Path::new(case["parent"].as_str().unwrap()),
            Path::new(case["candidate"].as_str().unwrap()),
        );
        assert_eq!(
            got,
            case["within"].as_bool().unwrap(),
            "{} {}",
            case["parent"],
            case["candidate"]
        );
    }
    for case in cases(&v, "findRunDir") {
        let id = case["runId"].as_str().unwrap();
        match find_run_dir(&fgos, id) {
            Ok(found) => assert_eq!(
                found.map(|d| Value::String(rel(&d))).unwrap_or(Value::Null),
                case["dir"],
                "{id}"
            ),
            Err(error) => {
                assert_eq!(Value::String("run-ambiguous".into()), case["error"]["code"]);
                let message = error.to_string().replace(fgos.to_str().unwrap(), "<fgos>");
                assert_eq!(Value::String(message), case["error"]["message"], "{id}");
            }
        }
    }
}

fn copy_tree(from: &Path, to: &Path) {
    fs::create_dir_all(to).unwrap();
    for entry in fs::read_dir(from).unwrap() {
        let entry = entry.unwrap();
        let target = to.join(entry.file_name());
        if entry.file_type().unwrap().is_dir() {
            copy_tree(&entry.path(), &target);
        } else {
            fs::copy(entry.path(), target).unwrap();
        }
    }
}

/// The records the Node tier really wrote (`packages/execution/contracts/corpus/`), each placed as one assignment, are
/// listed and found by run id exactly as Node's layout reader did; the synthetic tree above cannot show that the
/// readers accept the shapes and layouts older Node releases left on disk.
#[test]
fn the_node_era_corpus_is_listed_and_found_by_run_id_as_node_did() {
    let v = vector("corpus.json");
    let corpus = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../contracts/corpus");
    let scratch = Scratch::new("corpus");
    let fgos = scratch.0.join(".fgos");
    for sample in cases(&v, "samples") {
        let sample = sample.as_str().unwrap();
        copy_tree(&corpus.join(sample), &fgos.join("assignments").join(sample));
    }
    let rel = |p: &Path| {
        p.strip_prefix(&fgos)
            .unwrap()
            .to_string_lossy()
            .replace('\\', "/")
    };
    let scan = scan_assignment_layout(&fgos);
    let runs: Vec<Value> = scan
        .runs
        .iter()
        .map(|r| json!({ "assignmentId": r.assignment_id, "attempt": r.attempt, "runDir": rel(&r.run_dir), "hasAssignmentJson": r.has_assignment_json }))
        .collect();
    same_bytes("runs", &Value::Array(runs), &v["scan"]["runs"]);
    same_bytes("skipped", &skipped_json(&scan), &v["scan"]["skipped"]);
    assert_eq!(
        scan.run_dirs_seen,
        v["scan"]["runDirsSeen"].as_u64().unwrap()
    );
    assert!(!cases(&v, "findRunDir").is_empty());
    for case in cases(&v, "findRunDir") {
        let id = case["runId"].as_str().unwrap();
        let found = find_run_dir(&fgos, id).unwrap_or_else(|e| panic!("{id}: {e}"));
        assert_eq!(
            found.map(|d| Value::String(rel(&d))).unwrap_or(Value::Null),
            case["dir"],
            "{id}"
        );
    }
}
