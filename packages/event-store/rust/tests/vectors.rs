use fgos_event_store::{envelope::*, legacy};
use serde_json::{json, Value};
#[test]
fn canonical_hash_vectors() {
    let vectors: Value = serde_json::from_str(include_str!(
        "../../contracts/vectors/canonical-hash.v1.json"
    ))
    .unwrap();
    for v in vectors.as_array().unwrap() {
        let mut input = v
            .get("rawInput")
            .and_then(Value::as_str)
            .map(|raw| serde_json::from_str(raw).unwrap())
            .unwrap_or_else(|| v["input"].clone());
        input["h"] = v["h"].clone();
        let event: Envelope = serde_json::from_value(input).unwrap();
        assert_eq!(event.compute_hash().unwrap(), v["h"]);
        let mut without = serde_json::to_value(&event).unwrap();
        without.as_object_mut().unwrap().remove("h");
        assert_eq!(
            line(&without).unwrap(),
            v["canonicalWithoutHash"].as_str().unwrap().as_bytes()
        );
        assert_eq!(
            event.canonical_line().unwrap(),
            v["canonical"].as_str().unwrap().as_bytes()
        );
        assert_eq!(
            Envelope::parse(v["canonical"].as_str().unwrap().as_bytes())
                .unwrap()
                .canonical_line()
                .unwrap(),
            event.canonical_line().unwrap()
        );
        let mut tampered = event.clone();
        tampered.payload = json!({"tampered":true});
        assert!(tampered.validate().is_err());
        let mut own = event.clone();
        own.seen.insert(format!("{}:{}", own.origin, own.stream), 1);
        own.h = own.compute_hash().unwrap();
        assert!(own.validate().is_err());
    }
}
#[test]
fn timestamps_are_fixed_width_and_calendar_valid() {
    for valid in ["2024-02-29T23:59:59.999Z", "2000-02-29T00:00:00.000Z"] {
        assert!(valid_timestamp(valid));
    }
    for invalid in [
        "2026-02-29T00:00:00.000Z",
        "1900-02-29T00:00:00.000Z",
        "2026-10-18T24:00:00.000Z",
        "2026-10-18T00:00:00Z",
        "2026-13-01T00:00:00.000Z",
        "2026-01-00T00:00:00.000Z",
        "2026-10-18T00:00:00.000+00:00",
    ] {
        assert!(!valid_timestamp(invalid));
    }
}
#[test]
fn batch_marker_is_a_distinct_record() {
    let marker = BatchCommit {
        v: 4,
        kind: "batch-commit".into(),
        origin: "0123456789abcdef0123456789abcdef".into(),
        stream: "project".into(),
        first_seq: 1,
        last_seq: 2,
        count: 2,
        sha256: sha256(b"events\n"),
    };
    let bytes = marker.canonical_line().unwrap();
    assert!(Envelope::parse(&bytes).is_err());
    assert!(!serde_json::from_slice::<Value>(&bytes)
        .unwrap()
        .as_object()
        .unwrap()
        .contains_key("h"));
    let mut broken = marker.clone();
    broken.count = 1;
    assert!(broken.validate().is_err());
}
#[test]
fn seal_kinds_roundtrip() {
    let records = [
        json!({"v":1,"kind":"seal","machineId":"machine-1","origin":"0123456789abcdef0123456789abcdef","stream":"project","scope":"project","firstSeq":1,"lastSeq":1,"count":1,"sha256":sha256(b"segment")}),
        json!({"v":1,"kind":"merge","machineId":"machine-1","parents":["a".repeat(40),"b".repeat(40)]}),
        json!({"kind":"legacy","fromCommit":"a".repeat(40),"treeOfFgosEvents":"b".repeat(40)}),
    ];
    for value in records {
        let seal: Seal = serde_json::from_value(value.clone()).unwrap();
        assert_eq!(
            serde_json::from_slice::<Value>(&seal.canonical_line().unwrap()).unwrap(),
            value
        );
        assert_eq!(
            seal.digest().unwrap(),
            sha256(&seal.canonical_line().unwrap())
        );
    }
}
#[test]
fn frozen_legacy_order_and_provenance() {
    let vectors: Value =
        serde_json::from_str(include_str!("../../contracts/vectors/legacy-order.v1.json")).unwrap();
    let mut events = vec![];
    for file in vectors["files"].as_array().unwrap() {
        let raw = file["lines"]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| v.as_str().unwrap())
            .collect::<Vec<_>>()
            .join("\n")
            + "\n";
        events.extend(legacy::parse_file(file["file"].as_str().unwrap(), &raw).unwrap());
    }
    let ordered = legacy::order(events);
    assert_eq!(ordered.len(), vectors["expected"].as_array().unwrap().len());
    for (actual, expected) in ordered.iter().zip(vectors["expected"].as_array().unwrap()) {
        assert_eq!(actual.event, expected["event"]);
        assert_eq!(actual.raw, expected["raw"]);
        assert_eq!(actual.provenance.file, expected["file"]);
        assert_eq!(actual.provenance.line as u64, expected["line"]);
    }
    assert!(legacy::parse_file("broken", "{\n").is_err());
    assert!(legacy::parse_file("blank", "\n").is_err());
}

#[test]
fn malformed_record_headers_are_refused() {
    for value in [
        json!({"v":2,"kind":"merge","machineId":"machine","parents":["a".repeat(40),"b".repeat(40)]}),
        json!({"v":1,"kind":"merge","machineId":"machine","parents":["a","a"]}),
        json!({"kind":"legacy","fromCommit":"","treeOfFgosEvents":"b"}),
        json!({"v":1,"kind":"seal","machineId":"machine","origin":"0123456789abcdef0123456789abcdef","stream":"local","scope":"project","firstSeq":1,"lastSeq":2,"count":1,"sha256":sha256(b"bytes")}),
    ] {
        let seal: Seal = serde_json::from_value(value).unwrap();
        assert!(seal.canonical_line().is_err());
    }
    assert!(serde_json::from_value::<Seal>(json!({"kind":"batch-commit"})).is_err());
}

#[test]
fn protocol_counters_cannot_collapse_to_the_same_jcs_number() {
    let vectors: Value = serde_json::from_str(include_str!(
        "../../contracts/vectors/canonical-hash.v1.json"
    ))
    .unwrap();
    let mut value = vectors[0]["input"].clone();
    value["h"] = vectors[0]["h"].clone();
    let base: Envelope = serde_json::from_value(value).unwrap();
    for field in ["seq", "schemaVersion", "seen"] {
        let mut event = base.clone();
        match field {
            "seq" => event.seq = 9007199254740993,
            "schemaVersion" => event.schema_version = 9007199254740993,
            _ => {
                event.seen.insert("other:project".into(), 9007199254740993);
            }
        }
        event.h = event.compute_hash().unwrap();
        assert!(event.validate().is_err());
    }
}

#[test]
fn shared_record_bytes_and_digests() {
    let records: Value =
        serde_json::from_str(include_str!("../../contracts/vectors/records.v1.json")).unwrap();
    for record in records.as_array().unwrap() {
        let bytes = if record["input"]["kind"] == "batch-commit" {
            serde_json::from_value::<BatchCommit>(record["input"].clone())
                .unwrap()
                .canonical_line()
                .unwrap()
        } else {
            serde_json::from_value::<Seal>(record["input"].clone())
                .unwrap()
                .canonical_line()
                .unwrap()
        };
        assert_eq!(bytes, record["canonical"].as_str().unwrap().as_bytes());
        assert_eq!(sha256(&bytes), record["sha256"]);
    }
}
