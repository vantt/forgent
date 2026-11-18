//! The run, unit and verify kinds projected from unit summaries: every fact copied, every absent fact left absent,
//! and every record valid against the registry the host merges.

use fgos_observe::record::registry::Registry;
use fgos_observe::record::types::{AttrValue, Record};
use fgos_observe::{RecordSource, Window};
use fgos_run_result::projection::{ATTEMPT_KIND, UNIT_KIND, VERIFY_KIND};
use fgos_run_result::{RunProjectionSource, RUN_DECLARATION};
use serde_json::{json, Value};
use std::path::PathBuf;

struct Root(PathBuf);

impl Root {
    fn new(tag: &str) -> Self {
        let root = std::env::temp_dir().join(format!("projection_{tag}_{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(root.join(".fgos/assignments")).unwrap();
        Root(root)
    }

    fn write(&self, summary: &Value) {
        let id = summary["unitRunId"].as_str().unwrap();
        let dir = self.0.join(".fgos/assignments").join(id);
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join("unit-summary.json"), summary.to_string()).unwrap();
    }

    fn records(&self) -> Vec<Record> {
        RunProjectionSource::new()
            .records(&self.0, &Window::default())
            .unwrap()
    }
}

impl Drop for Root {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.0);
    }
}

fn attempt(extra: Value) -> Value {
    let mut base = json!({
        "assignmentId": "unit-run-1/producer/1", "runId": "run-a",
        "executor": "alpha", "provider": "openai", "persona": "builder", "model": "alpha-std",
        "outcome": "pass", "fallbackFrom": null
    });
    base.as_object_mut()
        .unwrap()
        .extend(extra.as_object().unwrap().clone());
    base
}

fn summary(unit: &str, attempts: Vec<Value>, extra: Value) -> Value {
    let mut base = json!({
        "contract": {"id": "unit-summary", "version": 3},
        "unitRunId": unit, "workflow": {"runId": "wf-1", "stepId": "s", "unitId": "u"},
        "pattern": "solo", "capability": "execute", "outcome": "pass",
        "infrastructure": false, "infrastructureReason": null, "refused": [],
        "startedAt": "2026-11-18T01:00:00.000Z", "settledAt": "2026-11-18T01:10:00.000Z",
        "stanceOptions": [],
        "seats": [{
            "seat": "producer", "role": "producer", "kind": "producer", "round": 1,
            "final": {
                "assignmentId": "unit-run-1/producer/1", "runId": "run-a", "executor": "alpha",
                "provider": "openai", "persona": null, "model": null, "outcome": "pass",
                "fallbackFrom": null, "stance": {"status": "missing"}
            },
            "attempts": attempts
        }]
    });
    base.as_object_mut()
        .unwrap()
        .extend(extra.as_object().unwrap().clone());
    base
}

fn of_kind<'a>(records: &'a [Record], kind: &str) -> Vec<&'a Record> {
    records.iter().filter(|r| r.kind == kind).collect()
}

fn registry() -> Registry {
    Registry::from_embedded(&[RUN_DECLARATION]).expect("the run declaration merges with the names")
}

#[test]
fn a_summary_with_every_new_field_projects_the_attempt_unit_and_verify_records() {
    let root = Root::new("full");
    let first = attempt(json!({
        "accountId": "work", "durationMs": 41250,
        "usage": {"inputTokens": 100, "outputTokens": 20, "cacheReadTokens": 5, "cacheCreationTokens": 7,
                  "totalTokens": 120, "reasoningTokens": 3, "source": "stdout", "reason": null},
        "fallbackFrom": {"executor": "beta", "reason": "provider-limit"}
    }));
    let second = attempt(json!({"runId": null}));
    root.write(&summary(
        "unit-run-1",
        vec![first, second],
        json!({
            "plan": {"dir": "plans/261118-0936-ops-metrics", "phase": "8"},
            "verify": {"ran": true, "command": "npm test", "outcome": "pass", "exit": 0, "passed": true,
                       "durationMs": 60000, "how": "shell", "outputDigest": "sha256:abc"}
        }),
    ));
    let records = root.records();
    let registry = registry();
    for record in &records {
        registry
            .validate(record)
            .unwrap_or_else(|e| panic!("{}: {e}", record.id));
    }

    let attempts = of_kind(&records, ATTEMPT_KIND);
    assert_eq!(
        attempts.len(),
        1,
        "an attempt that never got a run id is not a dispatch attempt"
    );
    let a = attempts[0];
    assert_eq!(a.id, "run-attempt:unit-run-1:producer:1:0");
    assert_eq!(a.subject.id, "run-a");
    let text = |name: &str| match a.attrs.get(name) {
        Some(AttrValue::Str(s)) => s.clone(),
        other => panic!("{name}: {other:?}"),
    };
    assert_eq!(text("gen_ai.provider.name"), "openai");
    assert_eq!(text("gen_ai.request.model"), "alpha-std");
    assert_eq!(text("fgos.account.id"), "work");
    assert_eq!(text("fgos.executor.id"), "alpha");
    assert_eq!(text("fgos.seat.role"), "producer");
    assert_eq!(text("fgos.usage.source"), "stdout");
    assert_eq!(a.attrs["fgos.fallback"], AttrValue::Bool(true));
    assert!(
        !a.attrs.contains_key("fgos.usage.reason"),
        "a null reason is no attr"
    );
    let measure = |name: &str| a.measures[name].as_u64().unwrap();
    assert_eq!(measure("fgos.duration"), 41250);
    assert_eq!(measure("gen_ai.usage.input_tokens"), 100);
    assert_eq!(measure("gen_ai.usage.output_tokens"), 20);
    assert_eq!(measure("gen_ai.usage.cache_read.input_tokens"), 5);
    assert_eq!(measure("gen_ai.usage.cache_creation.input_tokens"), 7);
    assert_eq!(measure("fgos.usage.total_tokens"), 120);
    assert_eq!(measure("fgos.usage.reasoning_tokens"), 3);
    assert_eq!(a.end_ts.as_deref(), Some("2026-11-18T01:10:00.000Z"));
    let refs: Vec<_> = a
        .refs
        .iter()
        .map(|r| format!("{}:{}", r.kind, r.id))
        .collect();
    assert_eq!(
        refs,
        [
            "unit:unit-run-1",
            "plan:plans/261118-0936-ops-metrics",
            "phase:8"
        ]
    );

    let unit = of_kind(&records, UNIT_KIND);
    assert_eq!(unit.len(), 1);
    assert_eq!(
        unit[0].attrs["fgos.workflow"],
        AttrValue::Str("wf-1".into())
    );
    assert_eq!(unit[0].attrs["fgos.infrastructure"], AttrValue::Bool(false));
    assert_eq!(unit[0].measures["fgos.attempts"].as_u64(), Some(1));
    assert_eq!(unit[0].measures["fgos.seats"].as_u64(), Some(1));

    let verify = of_kind(&records, VERIFY_KIND);
    assert_eq!(verify.len(), 1);
    assert_eq!(verify[0].measures["fgos.duration"].as_u64(), Some(60000));
    assert_eq!(
        verify[0].ts, "2026-11-18T01:09:00.000Z",
        "the verify span ends where the unit settled"
    );
    assert_eq!(
        verify[0].attrs["fgos.verify.how"],
        AttrValue::Str("shell".into())
    );
    assert!(records
        .iter()
        .all(|r| r.basis == fgos_observe::record::types::Basis::Derived));
}

#[test]
fn a_summary_without_the_new_fields_projects_records_that_lack_them() {
    let root = Root::new("bare");
    root.write(&summary("unit-run-2", vec![attempt(json!({}))], json!({})));
    let records = root.records();
    let registry = registry();
    for record in &records {
        registry.validate(record).unwrap();
    }
    assert!(
        of_kind(&records, VERIFY_KIND).is_empty(),
        "an unrecorded verify is no record, never a pass"
    );
    let a = of_kind(&records, ATTEMPT_KIND)[0];
    assert!(!a.attrs.contains_key("fgos.account.id"));
    assert!(!a.measures.contains_key("fgos.duration"));
    assert!(!a.measures.contains_key("gen_ai.usage.input_tokens"));
    assert!(
        a.refs.iter().all(|r| r.kind == "unit"),
        "no plan key, no plan ref"
    );
    assert_eq!(of_kind(&records, UNIT_KIND).len(), 1);
}

#[test]
fn a_verify_that_did_not_run_is_a_not_run_record_and_a_usage_reason_is_an_attr() {
    let root = Root::new("notrun");
    let named = attempt(
        json!({"usage": {"inputTokens": null, "source": "stdout", "reason": "no-usage-line"}}),
    );
    root.write(&summary(
        "unit-run-3",
        vec![named],
        json!({"verify": {"ran": false, "reason": "no verify command"}}),
    ));
    let records = root.records();
    let verify = of_kind(&records, VERIFY_KIND)[0];
    assert_eq!(
        verify.attrs["fgos.verify.outcome"],
        AttrValue::Str("not-run".into())
    );
    assert!(verify.measures.is_empty());
    let a = of_kind(&records, ATTEMPT_KIND)[0];
    assert_eq!(
        a.attrs["fgos.usage.reason"],
        AttrValue::Str("no-usage-line".into())
    );
    assert!(
        !a.measures.contains_key("gen_ai.usage.input_tokens"),
        "a count never reported is unknown, never zero"
    );
}

#[test]
fn the_source_states_only_declared_kinds() {
    let registry = registry();
    registry
        .check_source_kinds(&RunProjectionSource::new())
        .unwrap();
}
