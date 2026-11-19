//! Replays the vectors of `packages/execution/contracts/core-runner-config/` (the runner config loader over the
//! documents the config door reads) and `core-run-facts/` (the Unit-run judgements over facts the caller reads).
//! The vectors are read, never copied; `$ROOT` stands for the directory the vectors' paths live under.

use fgos_execution::run_facts::{
    custody_held, judge_unit_run, unit_run_facts, CustodyHolders, DirectoryReads, Standing,
    UnitState,
};
use fgos_execution::runner_config::{load_runner_config, DoorRead};
use serde_json::{json, Value};

const ROOT: &str = "/vector-root";

fn rooted(value: &Value) -> Value {
    serde_json::from_str(&value.to_string().replace("$ROOT", ROOT)).unwrap()
}

fn list(value: &Value) -> Vec<Value> {
    value.as_array().cloned().unwrap_or_default()
}

fn config_vectors() -> Value {
    serde_json::from_str(include_str!(
        "../../contracts/core-runner-config/core-runner-config.v1.json"
    ))
    .unwrap()
}

fn facts_vectors() -> Value {
    serde_json::from_str(include_str!(
        "../../contracts/core-run-facts/core-run-facts.v1.json"
    ))
    .unwrap()
}

fn door_of(vector: &Value) -> DoorRead {
    let door = &vector["door"];
    match door.get("refused") {
        Some(refused) => DoorRead::Refused {
            code: refused["code"].as_str().unwrap().to_string(),
            message: refused["message"].as_str().unwrap().to_string(),
            refusals: list(&refused["refusals"]),
            check_findings: list(&door["checkFindings"]),
        },
        None => DoorRead::Read {
            runner: door["runner"].clone(),
            origins: list(&door["origins"]),
        },
    }
}

fn replay_config(vector: &Value) {
    let vector = rooted(vector);
    let name = vector["name"].as_str().unwrap();
    let root = vector["root"].as_str().unwrap();
    let got = match load_runner_config(root, door_of(&vector)) {
        Ok(loaded) => json!({"ok": {"config": loaded.config, "origins": loaded.origins}}),
        Err(error) => json!({"error": error.to_json()}),
    };
    assert_eq!(got, vector["expect"], "{name}");
}

#[test]
fn the_loader_gives_the_checked_config_or_the_refusal_node_gave_for_every_recorded_document() {
    let vectors = config_vectors();
    let all = list(&vectors["vectors"]);
    assert!(all.len() >= 20, "the vectors cover every refusal path");
    all.iter().for_each(replay_config);
}

#[test]
fn a_refused_door_gives_the_door_message_or_the_retired_key_sentence_with_its_position() {
    let vectors = config_vectors();
    let all = list(&vectors["refusals"]);
    assert!(all.len() >= 6);
    all.iter().for_each(replay_config);
}

#[test]
fn the_unit_run_facts_read_the_record_and_the_two_reads_the_caller_made() {
    for vector in list(&facts_vectors()["unitRunFacts"]) {
        let vector = rooted(&vector);
        let name = vector["name"].as_str().unwrap();
        let text = vector["recordText"].as_str().map(str::as_bytes);
        let facts = unit_run_facts(
            text,
            vector["controlHeld"].as_bool().unwrap(),
            vector["worktreeExists"].as_bool().unwrap(),
        );
        assert_eq!(facts.to_json(), vector["expect"], "{name}");
    }
}

fn standing_of(standing: &Value) -> Standing {
    match standing["kind"].as_str().unwrap() {
        "unsafe" => Standing::Unsafe,
        "unsafe-link" => Standing::UnsafeLink,
        "missing" => Standing::Missing,
        "link" => Standing::Link,
        "directory" => Standing::Directory(DirectoryReads {
            expected: standing["expected"].as_str().unwrap().to_string(),
            unit_json_is_file: standing["unitJsonIsFile"].as_bool().unwrap(),
            record_bytes: standing["recordText"]
                .as_str()
                .map(|t| t.as_bytes().to_vec()),
            controller_held: standing["controllerHeld"].as_bool().unwrap(),
            custody_held: standing["custodyHeld"].as_bool().unwrap(),
            unit_state: match standing["unitState"].as_str().unwrap() {
                "running" => UnitState::Running,
                "awaiting-resume" => UnitState::AwaitingResume,
                "completed" => UnitState::Completed,
                "failed" => UnitState::Failed,
                other => panic!("unit state {other}"),
            },
        }),
        other => panic!("standing {other}"),
    }
}

#[test]
fn a_unit_run_is_judged_by_the_first_keep_reason_that_fires_else_it_may_go() {
    let all = list(&facts_vectors()["judgeUnitRun"]);
    assert!(all.len() >= 12, "every keep reason has its vector");
    for vector in all {
        let vector = rooted(&vector);
        let name = vector["name"].as_str().unwrap();
        let unless: Vec<String> = list(&vector["unless"])
            .iter()
            .map(|id| id.as_str().unwrap().to_string())
            .collect();
        let verdict = judge_unit_run(
            vector["unitRunId"].as_str().unwrap(),
            vector["caseId"].as_str().unwrap(),
            &unless,
            &standing_of(&vector["standing"]),
        );
        assert_eq!(verdict.to_json(), vector["expect"], "{name}");
    }
}

#[test]
fn custody_is_held_when_the_kernel_lists_a_holder_or_a_probe_finds_the_lock_busy() {
    for vector in list(&facts_vectors()["custodyHeld"]) {
        let name = vector["name"].as_str().unwrap();
        let holders = &vector["holders"];
        let read = match holders["kind"].as_str().unwrap() {
            "none" => CustodyHolders::None,
            "listed" => CustodyHolders::Listed(
                list(&holders["pids"])
                    .iter()
                    .map(|p| p.as_u64().unwrap() as u32)
                    .collect(),
            ),
            "unlisted" => CustodyHolders::Unlisted {
                free: holders["free"].as_bool().unwrap(),
            },
            other => panic!("holders {other}"),
        };
        assert_eq!(json!(custody_held(&read)), vector["expect"], "{name}");
    }
}
