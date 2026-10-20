use fgos_secrets::Declaration;
use serde_json::{json, Value};

fn schema() -> Value {
    let text = std::fs::read_to_string(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../contracts/declaration.v1.schema.json"
    ))
    .unwrap();
    serde_json::from_str(&text).unwrap()
}

#[test]
fn schema_and_type_describe_the_same_fields() {
    let s = schema();
    assert_eq!(s["additionalProperties"], json!(false));
    let mut props: Vec<&str> = s["properties"]
        .as_object()
        .unwrap()
        .keys()
        .map(String::as_str)
        .collect();
    props.sort_unstable();
    assert_eq!(
        props,
        ["consumers", "loginStore", "name", "redact", "source"]
    );
    assert_eq!(s["required"], json!(["name", "source", "consumers"]));
}

#[test]
fn declaration_round_trips_and_has_no_value_field() {
    let d: Declaration = serde_json::from_value(json!({
        "name": "OPENROUTER_API_KEY", "source": "file", "consumers": ["pi"], "loginStore": "pi"
    }))
    .unwrap();
    assert!(d.redact);
    assert_eq!(d.login_store.as_deref(), Some("pi"));
    let back = serde_json::to_value(&d).unwrap();
    assert_eq!(back["redact"], json!(true));
    let with_value = serde_json::from_value::<Declaration>(json!({
        "name": "K", "source": "file", "consumers": [], "value": "fake-value-for-test"
    }));
    assert!(with_value.is_err());
}
