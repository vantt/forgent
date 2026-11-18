//! `fgos metrics record` and `fgos metrics query` as one pair: a record written through the verb is read back by
//! the query verb, and a refused record is reported, counted and never an error.

use fgos_observe::metrics_cli::query::dispatch_query;
use fgos_observe::metrics_cli::record::dispatch_record;
use fgos_observe::ObserveRequest;
use serde_json::json;

fn request(
    sub: &str,
    args: &[&str],
    root: &std::path::Path,
    stdin: Option<&str>,
) -> ObserveRequest {
    ObserveRequest {
        operation: "observe.metrics".to_owned(),
        sub: sub.to_owned(),
        args: args.iter().map(|a| (*a).to_owned()).collect(),
        root: root.to_path_buf(),
        stdin: stdin.map(|s| s.as_bytes().to_vec()),
    }
}

#[test]
fn a_recorded_record_is_read_back_and_a_refused_one_is_reported_not_raised() {
    let root = std::env::temp_dir().join(format!("fgos-record-roundtrip-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&root);
    let kinds = root.join(".fgos/observe/kinds");
    std::fs::create_dir_all(&kinds).unwrap();
    std::fs::write(
        kinds.join("probe.json"),
        r#"{"contract":"observe-kinds.v1","subjectKinds":["probe"],"measures":{"probe.size":{"unit":"count","aggs":["sum"]}},"kinds":{"probe.sample":{"subjects":["probe"],"measures":["probe.size"]}}}"#,
    )
    .unwrap();

    let good = json!({
        "id": "probe-1", "kind": "probe.sample", "ts": "2026-11-18T10:00:00Z",
        "subject": {"kind": "probe", "id": "p"}, "measures": {"probe.size": 4}
    });
    let bad = json!({
        "id": "probe-2", "kind": "probe.nope", "ts": "2026-11-18T10:00:00Z",
        "subject": {"kind": "probe", "id": "p"}
    });
    let written = dispatch_record(&request(
        "record",
        &["--json", "-"],
        &root,
        Some(&json!([good, bad]).to_string()),
    ))
    .unwrap();
    assert_eq!(
        (written["written"].clone(), written["rejected"].clone()),
        (json!(1), json!(1))
    );

    let again = dispatch_record(&request(
        "record",
        &["--json", "-"],
        &root,
        Some(&good.to_string()),
    ))
    .unwrap();
    assert_eq!(again["duplicate"], 1);

    let read = dispatch_query(&request(
        "query",
        &[
            "--kind",
            "probe.sample",
            "--agg",
            "count,sum:probe.size",
            "--now",
            "2026-11-18T12:00:00Z",
        ],
        &root,
        None,
    ))
    .unwrap();
    assert_eq!(read["rows"][0]["count"], 1);
    assert_eq!(read["rows"][0]["aggs"]["sum:probe.size"], 4);

    let unreadable = dispatch_record(&request(
        "record",
        &["--json", "-"],
        &root,
        Some("not json"),
    ))
    .unwrap_err();
    assert!(unreadable.contains("not JSON"), "{unreadable}");
}
