use fgos_event_store::{
    envelope::*, errors::Error, identity::*, layout::branch_key, legacy, registry::*,
};
use serde_json::{json, Value};
fn integrity<T: std::fmt::Debug>(result: Result<T, Error>) {
    assert_eq!(result.unwrap_err().code.as_str(), "event-store-integrity");
}
fn base() -> Envelope {
    let vectors: Value = serde_json::from_str(include_str!(
        "../../contracts/vectors/canonical-hash.v1.json"
    ))
    .unwrap();
    serde_json::from_str(vectors[0]["canonical"].as_str().unwrap()).unwrap()
}
#[test]
fn only_canonical_framed_bytes_are_events() {
    let mut event = base();
    event.payload = json!({"x":1});
    event.h = event.compute_hash().unwrap();
    let raw = String::from_utf8(event.canonical_line().unwrap()).unwrap();
    for altered in [
        raw.trim_end().to_owned(),
        format!(" {raw}"),
        raw.replace("\"seq\":1", "\"seq\":1.0"),
        raw.replace("{\"x\":1}", "{\"x\":0,\"x\":1}"),
        raw.replacen("{\"h\":", "{\"v\":4,\"h\":", 1),
    ] {
        integrity(Envelope::parse(altered.as_bytes()));
    }
    let value = serde_json::to_value(&event).unwrap();
    let reordered = format!(
        "{{{}}}\n",
        value
            .as_object()
            .unwrap()
            .iter()
            .rev()
            .map(|(k, v)| format!("{}:{}", serde_json::to_string(k).unwrap(), v))
            .collect::<Vec<_>>()
            .join(",")
    );
    integrity(Envelope::parse(reordered.as_bytes()));
}
#[test]
fn identifier_grammars_apply_to_all_records() {
    for bad in ["origin", "a:b", "ABCDEF0123456789abcdef0123456789ab", "a"] {
        let mut e = base();
        e.origin = bad.into();
        e.h = e.compute_hash().unwrap();
        integrity(e.validate());
        let mut e = base();
        e.seen.insert(format!("{bad}:project"), 1);
        e.h = e.compute_hash().unwrap();
        integrity(e.validate());
        integrity(
            BatchCommit {
                v: 4,
                kind: "batch-commit".into(),
                origin: bad.into(),
                stream: "project".into(),
                first_seq: 1,
                last_seq: 1,
                count: 1,
                sha256: sha256(b"x"),
            }
            .validate(),
        );
    }
    for record in [
        json!({"v":1,"kind":"merge","machineId":"BAD","parents":["a".repeat(40),"b".repeat(40)]}),
        json!({"v":1,"kind":"merge","machineId":"machine-1","parents":["abc","b".repeat(40)]}),
        json!({"kind":"legacy","fromCommit":"A".repeat(40),"treeOfFgosEvents":"b".repeat(40)}),
    ] {
        integrity(serde_json::from_value::<Seal>(record).unwrap().validate());
    }
}
#[test]
fn branch_slug_mapping_is_shared() {
    for (input, expected) in [
        ("feature/Foo_bar", "feature-foo-bar"),
        ("---ABC---", "abc"),
        ("café/世界_x", "caf-x"),
        ("A//__B", "a-b"),
    ] {
        assert_eq!(branch_key(input).unwrap(), expected);
    }
    assert_eq!(branch_key(&"A".repeat(200)).unwrap(), "a".repeat(128));
    assert_eq!(
        branch_key(&("a".repeat(127) + "/b")).unwrap(),
        "a".repeat(127)
    );
    integrity(branch_key("世界/?!"));
}
fn contract(name: &str, domain: &str, scope: &str) -> ConsumerContract {
    serde_json::from_value(json!({"v":1,"types":[{"type":name,"domain":domain,"scope":scope,"schemaVersion":1,"sealOnWrite":false}]})).unwrap()
}
#[test]
fn reserved_owners_and_scope_survive_subsequent_registrations() {
    let mut r = Registry::default();
    r.register(contract("observe.trace", "observe", "local"))
        .unwrap();
    integrity(r.register(contract("observe.trace", "observe", "project")));
    for (name, domain) in [("store.anything", "store"), ("decision", "other")] {
        integrity(r.register(contract(name, domain, "project")));
    }
    assert_eq!(r.get("observe.trace").unwrap().scope, Scope::Local);
}
#[test]
fn legacy_hashes_are_verified_without_reencoding() {
    let vectors: Value =
        serde_json::from_str(include_str!("../../contracts/vectors/legacy-order.v1.json")).unwrap();
    for raw in vectors["invalidHashLines"].as_array().unwrap() {
        integrity(legacy::parse_file("tampered", raw.as_str().unwrap()));
    }
    for raw in [
        r#"{"ts":"x","h":""}"#,
        r#"{"ts":"x","seq":null}"#,
        r#"{"ts":"x","seq":1.5}"#,
        "{\"ts\":\"x\"}\r\n",
    ] {
        assert_eq!(legacy::parse_file("valid", raw).unwrap().len(), 1);
    }
    for raw in [
        "[]",
        r#"{"ts":5}"#,
        r#"{"ts":"x","seq":"5"}"#,
        r#"{"ts":"\ud800"}"#,
    ] {
        integrity(legacy::parse_file("deliberate-strictness", raw));
    }
}
#[test]
fn machine_setup_and_io_have_distinct_codes() {
    let root = std::env::temp_dir().join(format!("es-missing-{}", std::process::id()));
    assert_eq!(
        machine_id(None, &root).unwrap_err().code.as_str(),
        "event-store-machine-id"
    );
    assert_eq!(
        machine_id(Some("BAD"), &root).unwrap_err().code.as_str(),
        "event-store-machine-id"
    );
    assert_eq!(
        Registry::default()
            .load_files(&[root.join("missing.json")])
            .unwrap_err()
            .code
            .as_str(),
        "event-store-io"
    );
}

#[test]
fn reconstructed_registry_refuses_historical_scope_change() {
    let mut old = Registry::default();
    old.register(contract("observe.trace", "observe", "local"))
        .unwrap();
    let historical_scope = old.get("observe.trace").unwrap().scope;
    let mut next = Registry::default();
    next.register(contract("observe.trace", "observe", "project"))
        .unwrap();
    integrity(next.validate_historical_scope("observe.trace", historical_scope));
    old.validate_historical_scope("observe.trace", historical_scope)
        .unwrap();
}
