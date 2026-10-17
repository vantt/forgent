//! The judge against the shared vector file. The same file drives the Node
//! test (`test/process/process-facts-vectors.test.mjs`), so there is exactly
//! one judgement table.

use std::collections::HashMap;

use fgos_process::facts::{judge, Observed, Observer, ProcTable, Record, UnreadableCause, Verdict};
use fgos_process::ProcId;

const VECTORS: &str = include_str!("../../contracts/process-facts.judge.v1.json");

/// The process table one vector describes: the record's pid as `world.proc`
/// says, and the anchor's pid so that judging the anchor gives `anchorJudge`.
struct World(HashMap<u32, Observed>);

impl ProcTable for World {
    fn observe(&self, pid: ProcId) -> Observed {
        self.0.get(&pid.0).cloned().unwrap_or(Observed::Absent)
    }
}

fn observed_from(proc_world: &serde_json::Value) -> Observed {
    match proc_world["state"].as_str() {
        Some("absent") => Observed::Absent,
        Some("Z") | Some("X") => Observed::Zombie,
        Some(_) if proc_world["startTimeReadable"].as_bool() == Some(true) => {
            Observed::Live { start_time: proc_world["startTime"].as_str().expect("readable start time").to_string() }
        }
        Some(_) => Observed::Unreadable(match proc_world["unreadableCause"].as_str() {
            Some("permission") => UnreadableCause::Permission,
            Some("timeout") => UnreadableCause::Timeout,
            _ => UnreadableCause::DriverMissing,
        }),
        None => panic!("vector world without a proc state: {proc_world}"),
    }
}

fn verdict_from(text: &str) -> Verdict {
    match text {
        "alive" => Verdict::Alive,
        "dead" => Verdict::Dead,
        "unknown" => Verdict::Unknown,
        other => panic!("unknown verdict {other}"),
    }
}

fn observer_from(value: &serde_json::Value) -> Observer {
    Observer {
        host: value["host"].as_str().expect("observer host").to_string(),
        boot_id: value["bootId"].as_str().map(String::from),
        pid_ns: value["pidNs"].as_str().expect("observer pidNs").to_string(),
        in_init_pid_ns: value["inInitPidNs"].as_bool().expect("observer inInitPidNs"),
    }
}

fn world_from(record: &Record, world: &serde_json::Value) -> World {
    let mut table = HashMap::new();
    if let Some(pid) = record.pid {
        table.insert(pid.0, observed_from(&world["proc"]));
    }
    if let Some(anchor) = &record.anchor {
        let pid = anchor.pid.expect("anchor pid");
        let seen = match world["anchorJudge"].as_str() {
            Some("alive") => Observed::Live { start_time: anchor.start_time.clone().expect("anchor start time") },
            Some("dead") => Observed::Absent,
            _ => Observed::Unreadable(UnreadableCause::DriverMissing),
        };
        table.insert(pid.0, seen);
    }
    World(table)
}

#[test]
fn every_vector_judges_as_the_table_says() {
    let doc: serde_json::Value = serde_json::from_str(VECTORS).expect("vector file parses");
    assert_eq!(doc["contract"]["id"], "process-facts-judge");
    assert_eq!(doc["contract"]["version"], 1);
    let vectors = doc["vectors"].as_array().expect("vectors array");
    assert!(!vectors.is_empty());

    let mut failures = Vec::new();
    for vector in vectors {
        let name = vector["name"].as_str().expect("vector name");
        let observer = observer_from(&vector["observer"]);
        let record = Record::from_json(&vector["record"]);
        let world = world_from(&record, &vector["world"]);
        let expected = verdict_from(vector["expect"].as_str().expect("expect"));
        let got = judge(&record, &observer, &world);
        if got != expected {
            failures.push(format!("{name} ({}): expected {expected:?}, got {got:?}", vector["row"]));
        }
    }
    assert!(failures.is_empty(), "vectors that disagree with judge():\n{}", failures.join("\n"));
}

#[test]
fn every_rule_in_the_table_is_pinned_by_at_least_one_vector() {
    let doc: serde_json::Value = serde_json::from_str(VECTORS).expect("vector file parses");
    let rows: Vec<&str> = doc["vectors"].as_array().unwrap().iter().map(|v| v["row"].as_str().unwrap()).collect();
    for rule in doc["rules"].as_array().expect("rules array") {
        let id = rule["id"].as_str().unwrap();
        assert!(rows.contains(&id), "rule {id} has no vector");
    }
}
