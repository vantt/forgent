//! The registry: shared names, merging of three declaration sources, collisions, and the refusals a write door
//! counts. Every fixture carries fixed timestamps, so no test reads a clock.

use fgos_observe::record::registry::{
    discover_payload_declarations, load_registry, EmbeddedDeclaration, RecordError, Registry,
    RegistryError,
};
use fgos_observe::record::types::{AttrValue, Record};
use std::path::{Path, PathBuf};

fn fixtures() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../test/fixtures/observe/record")
}

fn text(rel: &str) -> String {
    std::fs::read_to_string(fixtures().join(rel)).unwrap()
}

fn record(rel: &str) -> Record {
    serde_json::from_str(&text(rel)).unwrap()
}

const EMBEDDED_RUN: EmbeddedDeclaration = EmbeddedDeclaration {
    label: "fixture-run",
    json: include_str!("../../../../test/fixtures/observe/record/declarations/embedded-run.json"),
};

fn embedded_registry() -> Registry {
    Registry::from_embedded(&[EMBEDDED_RUN]).unwrap()
}

fn declaration(label: &str, rel: &str) -> fgos_observe::record::registry::DeclarationSource {
    fgos_observe::record::registry::DeclarationSource {
        origin: label.to_owned(),
        text: text(rel),
    }
}

#[test]
fn shared_names_carry_the_genai_names_subject_kinds_and_aliases() {
    let r = Registry::shared().unwrap();
    for kind in [
        "run", "unit", "plan", "phase", "backlog", "session", "head", "account", "provider",
    ] {
        assert!(r.has_subject_kind(kind), "missing subject kind {kind}");
    }
    assert!(r.attr("gen_ai.provider.name").is_some());
    let tokens = r.measure("gen_ai.usage.input_tokens").unwrap();
    assert_eq!(tokens.unit, "token");
    assert!(tokens.aggs.contains("sum"));
    assert_eq!(r.canonical_name("gen_ai.system"), "gen_ai.provider.name");
    assert_eq!(
        r.canonical_name("gen_ai.usage.prompt_tokens"),
        "gen_ai.usage.input_tokens"
    );
    assert_eq!(r.canonical_name("something.else"), "something.else");
}

#[test]
fn a_declared_record_validates_and_round_trips_through_the_registry() {
    let r = embedded_registry();
    let rec = record("records/run-attempt.json");
    r.validate(&rec).unwrap();
    let again: Record = serde_json::from_str(&serde_json::to_string(&rec).unwrap()).unwrap();
    assert_eq!(again, rec);
}

#[test]
fn an_unknown_kind_is_refused() {
    let r = embedded_registry();
    let mut rec = record("records/run-attempt.json");
    rec.kind = "fixture.not.declared".into();
    assert_eq!(
        r.validate(&rec),
        Err(RecordError::UnknownKind("fixture.not.declared".into()))
    );
}

#[test]
fn a_wrong_type_or_value_outside_the_closed_set_is_refused() {
    let r = embedded_registry();
    let mut rec = record("records/run-attempt.json");
    rec.attrs
        .insert("fixture.attempt".into(), AttrValue::Str("one".into()));
    assert!(matches!(
        r.validate(&rec),
        Err(RecordError::WrongType { .. })
    ));

    let mut rec = record("records/run-attempt.json");
    rec.attrs
        .insert("fixture.outcome".into(), AttrValue::Str("maybe".into()));
    assert!(matches!(
        r.validate(&rec),
        Err(RecordError::ValueNotAllowed { .. })
    ));
}

#[test]
fn undeclared_attrs_measures_subjects_and_refs_are_refused() {
    let r = embedded_registry();
    let mut rec = record("records/run-attempt.json");
    rec.attrs
        .insert("fixture.extra".into(), AttrValue::Bool(true));
    assert!(matches!(
        r.validate(&rec),
        Err(RecordError::UnknownAttr { .. })
    ));

    let mut rec = record("records/run-attempt.json");
    rec.measures
        .insert("gen_ai.usage.cache_read.input_tokens".into(), 1.into());
    assert!(matches!(
        r.validate(&rec),
        Err(RecordError::UnknownMeasure { .. })
    ));

    let mut rec = record("records/run-attempt.json");
    rec.subject.kind = "plan".into();
    assert!(matches!(
        r.validate(&rec),
        Err(RecordError::SubjectNotAllowed { .. })
    ));

    let mut rec = record("records/run-attempt.json");
    rec.refs[0].kind = "galaxy".into();
    assert_eq!(
        r.validate(&rec),
        Err(RecordError::UnknownSubjectKind("galaxy".into()))
    );
}

#[test]
fn an_alias_is_refused_with_its_canonical_name() {
    let r = embedded_registry();
    let mut rec = record("records/run-attempt.json");
    let value = rec.attrs.remove("gen_ai.provider.name").unwrap();
    rec.attrs.insert("gen_ai.system".into(), value);
    assert_eq!(
        r.validate(&rec),
        Err(RecordError::AliasUsed {
            name: "gen_ai.system".into(),
            canonical: "gen_ai.provider.name".into()
        })
    );
}

#[test]
fn version_timestamps_span_and_detail_cap_are_checked() {
    let r = embedded_registry();
    let mut rec = record("records/run-attempt.json");
    rec.v = 3;
    assert_eq!(r.validate(&rec), Err(RecordError::UnsupportedVersion(3)));

    let mut rec = record("records/run-attempt.json");
    rec.ts = "yesterday".into();
    assert!(matches!(
        r.validate(&rec),
        Err(RecordError::BadTimestamp { field: "ts", .. })
    ));

    let mut rec = record("records/run-attempt.json");
    rec.end_ts = Some("2026-11-18T02:00:00Z".into());
    assert_eq!(r.validate(&rec), Err(RecordError::SpanEndsBeforeStart));

    let mut rec = record("records/run-attempt.json");
    rec.detail = Some("x".repeat(2049));
    assert_eq!(r.validate(&rec), Err(RecordError::DetailTooLong(2049)));
}

#[test]
fn two_declarations_of_one_name_with_different_meanings_are_refused_naming_both_sources() {
    let err = Registry::from_sources(&[
        declaration("source-a", "collision/a.json"),
        declaration("source-b", "collision/b-different-unit.json"),
    ])
    .unwrap_err();
    assert_eq!(
        err,
        RegistryError::Collision {
            what: "measure",
            name: "fixture.latency".into(),
            first: "source-a".into(),
            second: "source-b".into()
        }
    );
    assert!(err.to_string().contains("source-a") && err.to_string().contains("source-b"));
}

#[test]
fn the_same_meaning_declared_twice_is_one_declaration() {
    let r = Registry::from_sources(&[
        declaration("source-a", "collision/a.json"),
        declaration("source-c", "collision/c-same-meaning.json"),
    ])
    .unwrap();
    assert_eq!(r.measure("fixture.latency").unwrap().unit, "ms");
}

#[test]
fn redeclaring_a_shared_name_with_a_different_meaning_names_the_shared_source() {
    let err = Registry::from_sources(&[declaration("source-d", "collision/d-shared-name.json")])
        .unwrap_err();
    assert!(matches!(
        &err,
        RegistryError::Collision { name, first, second, .. }
            if name == "gen_ai.usage.input_tokens" && first == "observe-names" && second == "source-d"
    ));
}

#[test]
fn a_kind_naming_an_undeclared_attr_is_refused_at_load() {
    let json =
        r#"{"contract":"observe-kinds.v1","kinds":{"x.y":{"subjects":["run"],"attrs":["nope"]}}}"#;
    let err = Registry::from_sources(&[fgos_observe::record::registry::DeclarationSource {
        origin: "inline".into(),
        text: json.into(),
    }])
    .unwrap_err();
    assert!(matches!(
        err,
        RegistryError::UnknownName { what: "attr", .. }
    ));
}

#[test]
fn embedded_payload_glob_and_project_declarations_merge_into_one_registry() {
    let payload = fixtures().join("payload");
    let found = discover_payload_declarations(&payload).unwrap();
    let origins: Vec<&str> = found.iter().map(|s| s.origin.as_str()).collect();
    assert_eq!(
        origins,
        [
            "payload:core/demo/observe/kinds/demo.json",
            "payload:domains/coding/observe/kinds/coding.json"
        ]
    );

    // The project declaration sits under `.fgos/observe/kinds` of a project root, built in a temp dir.
    let project =
        std::env::temp_dir().join(format!("fgos-observe-record-merge-{}", std::process::id()));
    let kinds = project.join(".fgos/observe/kinds");
    std::fs::create_dir_all(&kinds).unwrap();
    std::fs::copy(
        fixtures().join("project-kinds/project.json"),
        kinds.join("project.json"),
    )
    .unwrap();

    let registry = load_registry(&[EMBEDDED_RUN], Some(&payload), Some(&project)).unwrap();
    std::fs::remove_dir_all(&project).unwrap();

    for kind in [
        "fixture.run.attempt",
        "fixture.lane.state",
        "fixture.phase.status",
        "fixture.project.widgets",
    ] {
        assert!(registry.kind(kind).is_some(), "missing {kind}");
    }
    // A subject kind declared by a payload file is usable by the other sources' records.
    assert!(registry.has_subject_kind("lane"));
    registry
        .validate(&record("records/run-attempt.json"))
        .unwrap();
}

#[test]
fn the_merged_result_does_not_depend_on_declaration_order() {
    let forward = Registry::from_sources(&[
        declaration("a", "declarations/embedded-run.json"),
        declaration("b", "declarations/deferred.json"),
    ])
    .unwrap();
    let backward = Registry::from_sources(&[
        declaration("b", "declarations/deferred.json"),
        declaration("a", "declarations/embedded-run.json"),
    ])
    .unwrap();
    // Registry derives only Debug; its maps are ordered, so the dump is the full merged content
    // (kinds, attrs, measures, aliases, subject kinds).
    assert_eq!(format!("{forward:?}"), format!("{backward:?}"));
}

fn inline(origin: &str, body: &str) -> fgos_observe::record::registry::DeclarationSource {
    fgos_observe::record::registry::DeclarationSource {
        origin: origin.to_owned(),
        text: format!(r#"{{"contract":"observe-kinds.v1",{body}}}"#),
    }
}

#[test]
fn a_kind_name_that_is_empty_or_not_dot_separated_is_refused_naming_the_source() {
    for bad in ["", "a..b", ".a", "a."] {
        let source = inline(
            "test:bad-kind",
            &format!(r#""kinds":{{"{bad}":{{"subjects":[]}}}}"#),
        );
        match Registry::from_sources(&[source]) {
            Err(RegistryError::Parse { origin, message }) => {
                assert_eq!(origin, "test:bad-kind");
                assert!(message.contains("kind name"), "{message}");
            }
            other => panic!("'{bad}': {other:?}"),
        }
    }
}

#[test]
fn a_name_listed_as_its_own_alias_is_not_a_collision() {
    let source = inline(
        "test:self-alias",
        r#""attrs":{"x.self":{"type":"string","aliases":["x.self"]}},
           "measures":{"x.count":{"unit":"1","aggs":["sum"],"aliases":["x.count"]}}"#,
    );
    let registry = Registry::from_sources(&[source.clone(), source]).unwrap();
    assert_eq!(registry.canonical_name("x.self"), "x.self");
    assert!(registry.attr("x.self").is_some());
    assert!(registry.measure("x.count").is_some());
}

#[test]
fn kinds_that_arrive_later_validate_from_test_local_declarations_without_touching_observe() {
    let registry = Registry::from_sources(&[declaration(
        "test-local:deferred",
        "declarations/deferred.json",
    )])
    .unwrap();
    for rel in [
        "records/watcher-tick.json",
        "records/supervisor-wake.json",
        "records/question-asked.json",
        "records/question-answered.json",
    ] {
        registry
            .validate(&record(rel))
            .unwrap_or_else(|e| panic!("{rel}: {e}"));
    }
    // The shared names alone know none of them.
    let shared = Registry::shared().unwrap();
    assert!(shared.kind("fgos.watcher.tick").is_none());
    assert!(matches!(
        shared.validate(&record("records/watcher-tick.json")),
        Err(RecordError::UnknownKind(_))
    ));
}
