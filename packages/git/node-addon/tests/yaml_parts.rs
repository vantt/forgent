//! The pure half of the addon's `yaml.parse`: JSON text, non-finite floats, refusals. The N-API entry
//! only wraps it in `marshal::guarded`; the Node wiring proof is `test/util/yaml.test.mjs`.
use fgos_node_addon::yaml::to_parts;
use serde_json::{json, Value};

#[test]
fn json_text_keeps_document_order_own_proto_keys_and_lists_non_finite_floats() {
    let (json, special) = to_parts(
        "b: 1\n__proto__: {x: .nan}\na: [.inf, -.inf, q]\n",
        "t.yaml",
    )
    .unwrap();
    assert_eq!(
        json,
        r#"{"b":1,"__proto__":{"x":null},"a":[null,null,"q"]}"#
    );
    assert_eq!(
        Value::from(special),
        json!([
            [["__proto__", "x"], "nan"],
            [["a", 0], "inf"],
            [["a", 1], "-inf"]
        ])
    );
}

#[test]
fn a_refusal_names_rule_file_and_position_and_never_the_input() {
    let failure = to_parts("a: [SECRET,\nb: }", "broken.yaml").unwrap_err();
    assert_eq!(
        (failure.id.as_str(), failure.file.as_str(), failure.line),
        ("syntax-error", "broken.yaml", Some(2))
    );
    assert!(!format!("{failure:?}").contains("SECRET"));
}
