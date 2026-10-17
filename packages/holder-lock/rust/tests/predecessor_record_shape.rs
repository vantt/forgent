//! The `windows-job` record shape (`predecessor.v1.json`): the same object is
//! written and read on every platform, and the old string `domainId` stays an
//! unknown shape that `admit` refuses with the raw record.

use std::path::PathBuf;
use std::time::Duration;

use fgos_holder_lock::predecessor::{admit, declare, domain_json, parse_record, record_path, Admit};
use fgos_process::facts::ProcTuple;
use fgos_process::{Domain, ProcId, WindowsJob};
use serde_json::{json, Value};

fn tuple(pid: u32, start: &str) -> ProcTuple {
    ProcTuple { host: "HOST".into(), boot_id: None, pid_ns: "none".into(), pid: ProcId(pid), start_time: start.into() }
}

fn job(keeper: Option<ProcTuple>) -> WindowsJob {
    WindowsJob { job: "Local\\fgos-borrow-main-1-2-3".into(), session_id: 2, declared_at: 133_800_000_000_000_000, holder: tuple(4242, "133799999999999999"), keeper }
}

fn temp_record(tag: &str) -> PathBuf {
    let nanos = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos();
    let dir = std::env::temp_dir().join(format!("fgos-record-shape-{tag}-{}-{nanos}", std::process::id()));
    std::fs::create_dir_all(&dir).unwrap();
    record_path(&dir.join("lock"))
}

#[test]
fn the_record_shape_round_trips_with_and_without_a_keeper() {
    for keeper in [None, Some(tuple(77, "133800000000000001"))] {
        let domain = Domain::WindowsJob(job(keeper));
        let path = temp_record("round");
        declare(&path, &domain).unwrap();
        let record: Value = serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
        assert_eq!(record["v"], 1);
        assert_eq!(record["domainKind"], "windows-job");
        assert_eq!(parse_record(&record), Some(domain));
    }
}

#[test]
fn the_written_object_matches_the_contract() {
    let written = domain_json(&Domain::WindowsJob(job(Some(tuple(77, "9")))));
    assert_eq!(
        written["domainId"],
        json!({
            "job": "Local\\fgos-borrow-main-1-2-3",
            "sessionId": "2",
            "declaredAt": "133800000000000000",
            "holder": { "host": "HOST", "pid": 4242, "startTime": "133799999999999999" },
            "keeper": { "host": "HOST", "pid": 77, "startTime": "9" },
        })
    );
    let no_keeper = domain_json(&Domain::WindowsJob(job(None)));
    assert_eq!(no_keeper["domainId"]["keeper"], Value::Null);
}

#[test]
fn a_string_domain_id_is_refused_with_the_raw_record() {
    let path = temp_record("string");
    let raw = json!({ "v": 1, "domainKind": "windows-job", "domainId": "Local\\old-shape" });
    std::fs::write(&path, format!("{raw}\n")).unwrap();
    assert_eq!(parse_record(&raw), None);
    assert_eq!(admit(&path, Duration::from_millis(10)), Admit::NotEmpty { domain: raw });
    assert!(path.exists(), "an unknown shape is never deleted");
}

#[test]
fn a_malformed_windows_job_object_is_an_unknown_shape() {
    let good = domain_json(&Domain::WindowsJob(job(None)));
    for key in ["job", "sessionId", "declaredAt", "holder", "keeper"] {
        let mut record = good.clone();
        record["v"] = json!(1);
        record["domainId"].as_object_mut().unwrap().remove(key);
        assert_eq!(parse_record(&record), None, "missing {key}");
    }
    let mut numeric = good;
    numeric["v"] = json!(1);
    numeric["domainId"]["sessionId"] = json!(2);
    assert_eq!(parse_record(&numeric), None, "sessionId is a decimal string");
}
