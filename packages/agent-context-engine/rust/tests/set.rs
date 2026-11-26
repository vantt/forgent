//! The compiled set: canonical bytes, the digest, and the reader that verifies versions and digest.

use fgos_agent_context_engine::refusal::RefusalCode;
use fgos_agent_context_engine::set::{digest_of, EffectiveRule, EffectiveSet};
use serde_json::{json, Value};

fn rule(id: &str) -> EffectiveRule {
    EffectiveRule {
        id: id.into(),
        owner: "core".into(),
        kind: "procedure".into(),
        scope: "repo".into(),
        specificity: 10,
        title: Some(id.into()),
        body: format!("{id} body"),
        sources: vec![format!("core/instructions/{id}.md")],
        when: Default::default(),
    }
}

fn written(set: &EffectiveSet) -> Value {
    serde_json::from_slice(&set.to_bytes()).unwrap()
}

fn refused(bytes: &[u8]) -> RefusalCode {
    EffectiveSet::read(bytes)
        .expect_err("the set is refused")
        .code
}

#[test]
fn a_written_set_reads_back_equal_with_its_digest_verified() {
    let set = EffectiveSet::new(vec![rule("rule-a"), rule("rule-b")]);
    assert_eq!(EffectiveSet::read(&set.to_bytes()).unwrap(), set);
}

#[test]
fn the_same_set_is_always_the_same_bytes_with_sorted_keys_and_one_newline() {
    let set = EffectiveSet::new(vec![rule("rule-a")]);
    let bytes = set.to_bytes();
    assert_eq!(bytes, EffectiveSet::new(vec![rule("rule-a")]).to_bytes());
    let text = String::from_utf8(bytes).unwrap();
    assert!(text.ends_with("}\n") && !text[..text.len() - 1].contains('\n'));
    assert!(text.find("\"digest\"").unwrap() < text.find("\"rules\"").unwrap());
    assert!(text.find("\"schemaVersion\"").unwrap() < text.find("\"whenKeysVersion\"").unwrap());
}

#[test]
fn the_digest_is_over_the_rules_array_only() {
    let one = EffectiveSet::new(vec![rule("rule-a")]);
    assert_eq!(digest_of(&json!(one.rules)), one.digest);
    assert_ne!(EffectiveSet::new(vec![rule("rule-b")]).digest, one.digest);
}

#[test]
fn the_digest_does_not_depend_on_key_order_in_the_file() {
    let set = EffectiveSet::new(vec![rule("rule-a")]);
    let reordered = format!(
        "{{\"rules\":[{{\"when\":{{}},\"sources\":[\"core/instructions/rule-a.md\"],\"body\":\"rule-a body\",\"title\":\"rule-a\",\"specificity\":10,\"scope\":\"repo\",\"kind\":\"procedure\",\"owner\":\"core\",\"id\":\"rule-a\"}}],\"digest\":\"{}\",\"whenKeysVersion\":1,\"schemaVersion\":1}}",
        set.digest
    );
    assert_eq!(EffectiveSet::read(reordered.as_bytes()).unwrap(), set);
}

#[test]
fn a_changed_rule_fails_the_digest() {
    let mut doc = written(&EffectiveSet::new(vec![rule("rule-a")]));
    doc["rules"][0]["body"] = json!("tampered");
    assert_eq!(
        refused(&serde_json::to_vec(&doc).unwrap()),
        RefusalCode::SetDigestMismatch
    );
}

#[test]
fn an_unsupported_schema_or_when_keys_version_is_refused_before_the_digest() {
    for (field, value) in [("schemaVersion", 2), ("whenKeysVersion", 7)] {
        let mut doc = written(&EffectiveSet::new(vec![rule("rule-a")]));
        doc[field] = json!(value);
        doc["digest"] = json!("0".repeat(64));
        assert_eq!(
            refused(&serde_json::to_vec(&doc).unwrap()),
            RefusalCode::SetVersionUnsupported,
            "{field}"
        );
    }
}

#[test]
fn a_file_that_is_not_a_set_is_malformed() {
    assert_eq!(refused(b"not json"), RefusalCode::SetMalformed);
    assert_eq!(refused(b"[]"), RefusalCode::SetMalformed);
    assert_eq!(refused(b"{}"), RefusalCode::SetMalformed);
    let mut doc = written(&EffectiveSet::new(vec![rule("rule-a")]));
    doc.as_object_mut().unwrap().remove("rules");
    assert_eq!(
        refused(&serde_json::to_vec(&doc).unwrap()),
        RefusalCode::SetMalformed
    );
    let mut doc = written(&EffectiveSet::new(vec![rule("rule-a")]));
    doc["extra"] = json!(1);
    assert_eq!(
        refused(&serde_json::to_vec(&doc).unwrap()),
        RefusalCode::SetMalformed
    );
    let mut doc = written(&EffectiveSet::new(vec![rule("rule-a")]));
    doc["digest"] = json!("XYZ");
    assert_eq!(
        refused(&serde_json::to_vec(&doc).unwrap()),
        RefusalCode::SetMalformed
    );
}

#[test]
fn a_rule_with_an_unknown_kind_scope_or_no_source_is_malformed() {
    for (field, value) in [
        ("kind", json!("decree")),
        ("scope", json!("galaxy")),
        ("sources", json!([])),
    ] {
        let mut doc = written(&EffectiveSet::new(vec![rule("rule-a")]));
        doc["rules"][0][field] = value;
        let digest = digest_of(&doc["rules"]);
        doc["digest"] = json!(digest);
        assert_eq!(
            refused(&serde_json::to_vec(&doc).unwrap()),
            RefusalCode::SetMalformed,
            "{field}"
        );
    }
}
