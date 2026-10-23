//! Owning proof of the findings engine over `contracts/fixtures/doctor.v1.json`: which row each
//! file state raises, with which fix and severity per consumer, that each source is judged on its
//! own, that no finding holds a value, and that the repairs are idempotent.
#![cfg(unix)]
mod common;

use std::collections::BTreeSet;
use std::fs;
use std::time::{Duration, SystemTime};

use fgos_config::detect::NoDetectors;
use fgos_config::doctor::{check, fix, Consumer, Destination, Finding, MachineFacts, Severity};
use fgos_config::files::ModeFinding;
use fgos_config::scope::SourceKind;
use fgos_config::snapshot::{Context, SnapshotError};
use serde_json::{json, Value};

const DAY: u64 = 86_400;

fn facts(spec: &Value) -> MachineFacts {
    let state = |s: &Value| match s.as_str() {
        Some("equal") => Destination::Equal,
        Some("different") => Destination::Different,
        _ => Destination::Absent,
    };
    MachineFacts {
        modes: spec["modes"]
            .as_array()
            .into_iter()
            .flatten()
            .map(|m| ModeFinding {
                file: m[0].as_str().unwrap().into(),
                expected: m[1].as_u64().unwrap() as u32,
                actual: m[2].as_u64().unwrap() as u32,
            })
            .collect(),
        machine_files: spec["machine_files"].as_str().map(String::from),
        destinations: spec["destinations"]
            .as_array()
            .into_iter()
            .flatten()
            .map(|d| (d[0].as_str().unwrap().into(), state(&d[1])))
            .collect(),
    }
}

fn triple(f: &Finding) -> Value {
    json!([f.row, f.file, f.path])
}

fn age(dir: &std::path::Path, rels: &Value, days: u64, now: SystemTime) {
    for rel in rels.as_array().into_iter().flatten() {
        let file = fs::File::options()
            .write(true)
            .open(dir.join(rel.as_str().unwrap()))
            .unwrap();
        file.set_modified(now - Duration::from_secs(days * DAY))
            .unwrap();
    }
}

#[test]
fn doctor_cases() {
    let fixture = common::fixture("doctor.v1.json");
    let (schemas, standard) = common::schemas_and_standard(&fixture);
    let ctx = Context {
        schemas: &schemas,
        standard: &standard,
        digest: "d",
        detectors: &NoDetectors,
    };
    let now = SystemTime::now();
    for case in common::cases("doctor.v1.json") {
        let (id, input, want) = (
            case["id"].as_str().unwrap(),
            &case["input"],
            &case["expect"],
        );
        let dir = common::temp("doctor", id);
        let roots = common::lay_out(&dir, input);
        fs::create_dir_all(dir.join("project")).unwrap();
        fs::create_dir_all(dir.join("home/.fgos")).unwrap();
        age(&dir, &input["stale"], 40, now);
        age(&dir, &input["fresh"], 1, now);
        if input["fix"].is_array() {
            run_fix(&ctx, &dir, &roots, input, want, id);
            let _ = fs::remove_dir_all(&dir);
            continue;
        }
        let found = check(&ctx, &roots, &facts(&input["facts"]), now);
        let got: BTreeSet<String> = found.iter().map(|f| triple(f).to_string()).collect();
        let expect: BTreeSet<String> = want["rows"]
            .as_array()
            .unwrap()
            .iter()
            .map(Value::to_string)
            .collect();
        assert_eq!(got, expect, "{id}: rows");
        for f in &found {
            let at = f.path.as_deref().unwrap_or_default();
            if let Some(detail) = want["details"][format!("{} {at}", f.row)].as_str() {
                assert_eq!(
                    f.detail.split(' ').next_back().unwrap_or(""),
                    detail.trim(),
                    "{id}: detail of {at}"
                );
            }
            if let Some(fix) = want["fixes"].get(f.row) {
                assert_eq!(f.fix, fix.as_str(), "{id}: fix of {}", f.row);
            }
            if let Some([doctor, check]) = want["severity"][f.row].as_array().map(Vec::as_slice) {
                let level = |s: Severity| if s == Severity::Fail { "fail" } else { "warn" };
                let seen = [
                    level(f.severity(Consumer::Doctor)),
                    level(f.severity(Consumer::Check)),
                ];
                assert_eq!(
                    seen,
                    [doctor.as_str().unwrap(), check.as_str().unwrap()],
                    "{id}: severity of {}",
                    f.row
                );
            }
        }
        for needle in want["absent"].as_array().into_iter().flatten() {
            assert!(
                !format!("{found:?}").contains(needle.as_str().unwrap()),
                "{id}: a finding holds a value"
            );
        }
        let _ = fs::remove_dir_all(&dir);
    }
}

fn run_fix(
    ctx: &Context,
    dir: &std::path::Path,
    roots: &fgos_config::snapshot::SnapshotRequest,
    input: &Value,
    want: &Value,
    id: &str,
) {
    let ids: Vec<&str> = input["fix"]
        .as_array()
        .unwrap()
        .iter()
        .map(|i| i.as_str().unwrap())
        .collect();
    let writer = common::writer(&input["writer"]);
    let build = |kind: SourceKind| {
        let target = if kind == SourceKind::Global {
            "global"
        } else {
            "project"
        };
        common::write_request(
            dir,
            &json!({"target": target, "edits": [], "reason": "r"}),
            roots.clone(),
        )
        .0
    };
    let ack = input["ack"] == true;
    let got = fix(ctx, build, &writer, &ids, ack);
    match (&got, want["code"].as_str()) {
        (Err(SnapshotError::Refused(found)), Some(code)) => {
            let rule = found[0].yaml.as_ref().map(|y| y.rule);
            assert!(
                found[0].code == code || rule == Some(code),
                "{id}: {}",
                found[0]
            );
            return;
        }
        (Ok(report), None) => {
            let applied: Vec<Value> = report.applied.iter().map(|(f, p)| json!([f, p])).collect();
            assert_eq!(Value::Array(applied), want["applied"], "{id}: applied");
        }
        _ => panic!("{id}: fix gave {got:?}"),
    }
    for (rel, lines) in want["files"].as_object().into_iter().flatten() {
        assert_eq!(
            fs::read_to_string(dir.join(rel)).unwrap(),
            common::text(lines),
            "{id}: {rel}"
        );
    }
    let again = fix(ctx, build, &writer, &ids, ack).unwrap();
    assert!(
        again.applied.is_empty(),
        "{id}: the second run applied {:?}",
        again.applied
    );
}
