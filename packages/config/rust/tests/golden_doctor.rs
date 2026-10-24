//! Owning proof of the findings engine over `contracts/fixtures/doctor.v1.json`: which row each
//! file state raises, with which fix and severity per consumer, that each source is judged on its
//! own, that no finding holds a value, and that the repairs are idempotent.
#![cfg(unix)]
mod common;

use std::collections::BTreeSet;
use std::fs;
use std::os::unix::fs::PermissionsExt;
use std::time::{Duration, SystemTime};

use fgos_config::detect::NoDetectors;
use fgos_config::doctor::{check, Consumer, Finding, Severity};
use fgos_config::repair::fix;
use fgos_config::scope::SourceKind;
use fgos_config::snapshot::{Context, SnapshotError};
use serde_json::{json, Value};

const DAY: u64 = 86_400;

/// A healthy machine under `home/.fgos`: owner-only modes on the machine files, a private
/// directory and a token. The case's `machine: "bare"` leaves the token and directory out, and its
/// `modes` (file under the global directory to mode) state other modes.
fn settle(dir: &std::path::Path, input: &Value) {
    let (global, mode) = (dir.join("home/.fgos"), |p: &std::path::Path, m: u32| {
        fs::set_permissions(p, fs::Permissions::from_mode(m)).unwrap();
    });
    let private = global.join("private");
    if input["machine"] != "bare" {
        fs::create_dir_all(&private).unwrap();
        fs::write(private.join("gateway-token"), "tok-1\n").unwrap();
    }
    for rel in [
        "config.yaml",
        "config.json",
        "private/accounts.yaml",
        "private/gateway-token",
    ] {
        if global.join(rel).exists() {
            mode(&global.join(rel), 0o600);
        }
    }
    if private.exists() {
        mode(&private, 0o700);
    }
    for (rel, bits) in input["modes"].as_object().into_iter().flatten() {
        mode(&global.join(rel), bits.as_u64().unwrap() as u32);
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
        settle(&dir, input);
        age(&dir, &input["stale"], 40, now);
        age(&dir, &input["fresh"], 1, now);
        if input["fix"].is_array() {
            run_fix(&ctx, &dir, &roots, input, want, id);
            let _ = fs::remove_dir_all(&dir);
            continue;
        }
        let found = check(&ctx, &roots, now);
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
    for rel in want["absent"].as_array().into_iter().flatten() {
        assert!(
            !dir.join(rel.as_str().unwrap()).exists(),
            "{id}: {rel} is still there"
        );
    }
    for (rel, bits) in want["modes"].as_object().into_iter().flatten() {
        let found = fs::metadata(dir.join(rel)).unwrap().permissions().mode() & 0o777;
        assert_eq!(
            u64::from(found),
            bits.as_u64().unwrap(),
            "{id}: mode of {rel}"
        );
    }
    let again = fix(ctx, build, &writer, &ids, ack).unwrap();
    assert!(
        again.applied.is_empty(),
        "{id}: the second run applied {:?}",
        again.applied
    );
}
