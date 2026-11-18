//! The query engine: each operator once on a fixed clock, and the detections and measures that consumers define as
//! plain queries over test-local declarations (no engine code names them).

use fgos_observe::query::{run, AggValue, Query, QueryContext, QueryError, QueryResult};
use fgos_observe::record::registry::{DeclarationSource, Registry};
use fgos_observe::record::types::Record;
use fgos_observe::{RecordSource, SourceError, Window};
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

fn fixtures() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../test/fixtures/observe/query")
}

fn text(rel: &str) -> String {
    std::fs::read_to_string(fixtures().join(rel)).unwrap()
}

fn registry() -> Registry {
    Registry::from_sources(&[DeclarationSource {
        origin: "fixture".into(),
        text: text("declarations.json"),
    }])
    .unwrap()
}

struct MemorySource {
    id: &'static str,
    kinds: &'static [&'static str],
    records: Vec<Record>,
}

impl RecordSource for MemorySource {
    fn source_id(&self) -> &'static str {
        self.id
    }
    fn kinds(&self) -> &[&str] {
        self.kinds
    }
    fn records(&self, _: &Path, _: &Window) -> Result<Vec<Record>, SourceError> {
        Ok(self.records.clone())
    }
}

struct FailingSource;

impl RecordSource for FailingSource {
    fn source_id(&self) -> &'static str {
        "failing"
    }
    fn kinds(&self) -> &[&str] {
        &["fgos.stale.kind"]
    }
    fn records(&self, _: &Path, _: &Window) -> Result<Vec<Record>, SourceError> {
        Err(SourceError::ReadFailed {
            source_id: "failing",
            message: "disk gone".into(),
        })
    }
}

const KINDS: &[&str] = &[
    "fgos.run.attempt",
    "fgos.head.state",
    "fgos.plan.status",
    "fgos.plan.activity",
    "fgos.watcher.tick",
    "fgos.supervisor.wake",
    "fgos.session.usage",
    "fgos.question.asked",
    "fgos.question.answered",
];

fn records() -> Vec<Record> {
    text("records.jsonl")
        .lines()
        .map(|l| serde_json::from_str(l).unwrap())
        .collect()
}

fn instant(stamp: &str) -> i64 {
    fgos_host_runtime::civil_time::parse_rfc3339_millis(stamp).unwrap()
}

const NOW: &str = "2026-11-18T12:00:00Z";

fn query(json: &str) -> Query {
    serde_json::from_str(json).unwrap()
}

fn definition(name: &str) -> Query {
    query(&text(&format!("definitions/{name}.json")))
}

fn ask_at(q: &Query, now: &str, params: &[(&str, f64)]) -> Result<QueryResult, QueryError> {
    ask_with(q, now, params, &[])
}

/// Like `ask_at`, over the fixture records plus `extra` JSON lines.
fn ask_with(
    q: &Query,
    now: &str,
    params: &[(&str, f64)],
    extra: &[&str],
) -> Result<QueryResult, QueryError> {
    let reg = registry();
    let mut all = records();
    all.extend(
        extra
            .iter()
            .map(|l| serde_json::from_str::<Record>(l).unwrap()),
    );
    let source = MemorySource {
        id: "memory",
        kinds: KINDS,
        records: all,
    };
    let sources: [&dyn RecordSource; 1] = [&source];
    run(
        q,
        &QueryContext {
            registry: &reg,
            sources: &sources,
            root: Path::new("."),
            now_millis: instant(now),
            params: params.iter().map(|(k, v)| ((*k).to_owned(), *v)).collect(),
        },
    )
}

fn ask(q: &Query) -> QueryResult {
    ask_at(q, NOW, &[("min_running", 0.0)]).unwrap()
}

fn num(row: &fgos_observe::query::ResultRow, agg: &str) -> f64 {
    row.aggs[agg].unwrap().as_f64()
}

fn groups(result: &QueryResult, key: &str) -> Vec<String> {
    result.rows.iter().map(|r| r.group[key].clone()).collect()
}

// ---- operators -------------------------------------------------------------------------------------------------

#[test]
fn where_operators_filter_on_attrs_measures_and_record_fields() {
    let count = |where_: &str| {
        let q = query(&format!(
            r#"{{"kind":["fgos.run.attempt"],"where":[{where_}],"agg":["count"]}}"#
        ));
        ask(&q).rows[0].count
    };
    assert_eq!(
        count(r#"{"field":"fgos.outcome","op":"eq","value":"fail"}"#),
        2
    );
    assert_eq!(
        count(r#"{"field":"fgos.outcome","op":"ne","value":"pass"}"#),
        2
    );
    assert_eq!(
        count(r#"{"field":"fgos.outcome","op":"in","value":["fail","partial"]}"#),
        2
    );
    // R7 is the only attempt without a provider.
    assert_eq!(
        count(r#"{"field":"gen_ai.provider.name","op":"exists","value":false}"#),
        1
    );
    assert_eq!(
        count(r#"{"field":"gen_ai.provider.name","op":"exists"}"#),
        6
    );
    assert_eq!(
        count(r#"{"field":"fgos.duration","op":"gt","value":3000000}"#),
        2
    );
    assert_eq!(
        count(r#"{"field":"fgos.duration","op":"lt","value":100000}"#),
        1
    );
    assert_eq!(
        count(r#"{"field":"origin.host","op":"eq","value":"beta"}"#),
        2
    );
    // An alias reads the canonical name.
    assert_eq!(
        count(r#"{"field":"gen_ai.system","op":"eq","value":"google"}"#),
        1
    );
}

#[test]
fn ref_keeps_records_that_carry_the_ref_on_subject_or_refs() {
    let q = query(r#"{"kind":["fgos.run.attempt"],"ref":["plan:A"],"agg":["count"]}"#);
    assert_eq!(ask(&q).rows[0].count, 4);
    let q = query(r#"{"kind":["fgos.plan.status"],"ref":["plan:A"],"agg":["count"]}"#);
    assert_eq!(ask(&q).rows[0].count, 2);
    let q =
        query(r#"{"kind":["fgos.run.attempt"],"ref":["plan:A","run:unit/R1"],"agg":["count"]}"#);
    assert_eq!(ask(&q).rows[0].count, 1);
}

#[test]
fn since_and_until_take_absolute_dates_and_relative_offsets_from_the_clock() {
    let count = |window: &str| {
        let q = query(&format!(
            r#"{{"kind":["fgos.run.attempt"],{window},"agg":["count"]}}"#
        ));
        ask(&q).rows[0].count
    };
    assert_eq!(count(r#""since":"-1h""#), 1);
    assert_eq!(count(r#""since":"-1d""#), 6);
    assert_eq!(
        count(r#""since":"2026-11-18","until":"2026-11-18T10:30:00Z""#),
        3
    );
    assert_eq!(count(r#""until":"2026-11-11""#), 1);
    let reversed =
        query(r#"{"kind":["fgos.run.attempt"],"since":"2026-11-18","until":"2026-11-10"}"#);
    assert!(matches!(
        ask_at(&reversed, NOW, &[]),
        Err(QueryError::Invalid { .. })
    ));
    let bad = query(r#"{"kind":["fgos.run.attempt"],"since":"-3x"}"#);
    assert!(matches!(
        ask_at(&bad, NOW, &[]),
        Err(QueryError::Invalid { .. })
    ));
}

#[test]
fn by_groups_and_every_aggregate_computes_over_the_group() {
    let q = query(
        r#"{"kind":["fgos.run.attempt"],"by":["gen_ai.provider.name"],
            "agg":["count","sum:gen_ai.usage.input_tokens","p50:fgos.duration","p90:fgos.duration",
                   "min:fgos.duration","max:fgos.duration","avg:fgos.duration","max:ts","age:ts","span"]}"#,
    );
    let result = ask(&q);
    assert_eq!(
        groups(&result, "gen_ai.provider.name"),
        ["anthropic", "google", "openai"]
    );
    let anthropic = &result.rows[0];
    assert_eq!(anthropic.count, 3);
    assert_eq!(num(anthropic, "sum:gen_ai.usage.input_tokens"), 6000.0);
    assert_eq!(num(anthropic, "p50:fgos.duration"), 3_600_000.0);
    assert_eq!(num(anthropic, "p90:fgos.duration"), 4_200_000.0);
    assert_eq!(num(anthropic, "min:fgos.duration"), 1_800_000.0);
    assert_eq!(num(anthropic, "max:fgos.duration"), 4_200_000.0);
    assert_eq!(num(anthropic, "avg:fgos.duration"), 3_200_000.0);
    assert_eq!(
        anthropic.aggs["max:ts"],
        Some(AggValue::Instant(instant("2026-11-18T10:45:00Z")))
    );
    // 12:00 - 10:45
    assert_eq!(num(anthropic, "age:ts"), 4500.0);
    // 10:00 to the latest end, 11:30
    assert_eq!(num(anthropic, "span"), 5400.0);
    let json = serde_json::to_value(anthropic).unwrap();
    assert_eq!(json["aggs"]["max:ts"], "2026-11-18T10:45:00.000Z");
    assert_eq!(json["aggs"]["count"], 3);
    // The provider name an alias spelled groups the same.
    assert_eq!(result.coverage.matched, 7);
    assert_eq!(result.coverage.missing["gen_ai.provider.name"], 1);
}

#[test]
fn a_group_under_the_minimum_sample_is_insufficient_and_carries_no_numbers() {
    let q = query(
        r#"{"kind":["fgos.run.attempt"],"by":["gen_ai.provider.name"],"min_sample":3,"agg":["count","p90:fgos.duration"]}"#,
    );
    let result = ask(&q);
    let by_name: BTreeMap<_, _> = result
        .rows
        .iter()
        .map(|r| (r.group["gen_ai.provider.name"].as_str(), r))
        .collect();
    assert!(!by_name["anthropic"].insufficient);
    assert!(by_name["openai"].insufficient);
    assert_eq!(by_name["openai"].count, 2);
    assert_eq!(by_name["openai"].aggs["p90:fgos.duration"], None);
    assert_eq!(by_name["openai"].aggs["count"], None);
    assert!(by_name["google"].insufficient);
}

#[test]
fn an_insufficient_group_is_reported_without_evaluating_having() {
    // `count >= 1` would pass every group and `count > 100` none; the under-sample groups stay insufficient either way.
    let rows = |having: &str| {
        let q = query(&format!(
            r#"{{"kind":["fgos.run.attempt"],"by":["gen_ai.provider.name"],"min_sample":3,"agg":["count"],
                "having":[{{"lhs":{{"agg":{{"agg":"count"}}}},"op":"{having}","rhs":{{"const":100}}}}]}}"#
        ));
        ask(&q)
            .rows
            .into_iter()
            .map(|r| (r.group["gen_ai.provider.name"].clone(), r.insufficient))
            .collect::<Vec<_>>()
    };
    let under_sample = [("google".to_owned(), true), ("openai".to_owned(), true)];
    assert_eq!(rows("gt"), under_sample);
    let mut all = vec![("anthropic".to_owned(), false)];
    all.extend(under_sample.clone());
    assert_eq!(rows("lt"), all);
}

#[test]
fn bucket_groups_by_utc_hour_day_and_monday_week() {
    let rows = |bucket: &str| {
        let q = query(&format!(
            r#"{{"kind":["fgos.run.attempt"],"bucket":"{bucket}","agg":["count"]}}"#
        ));
        ask(&q)
            .rows
            .into_iter()
            .map(|r| (r.bucket.unwrap(), r.count))
            .collect::<Vec<_>>()
    };
    assert_eq!(
        rows("week"),
        [
            ("2026-11-09T00:00:00.000Z".to_owned(), 1),
            ("2026-11-16T00:00:00.000Z".to_owned(), 6)
        ]
    );
    assert_eq!(rows("day").len(), 2);
    let hours = rows("hour");
    assert_eq!(hours.first().unwrap().0, "2026-11-10T09:00:00.000Z");
    assert!(hours.contains(&("2026-11-18T10:00:00.000Z".to_owned(), 4)));
}

#[test]
fn latest_per_keeps_the_newest_record_per_subject_or_ref_and_where_runs_before_and_after_it() {
    // The newest status per plan: A running, B running, C running, D done, E ready.
    let q = query(
        r#"{"kind":["fgos.plan.status"],"latest_per":"subject","by":["fgos.plan.status"],"agg":["count"]}"#,
    );
    let result = ask(&q);
    let counts: BTreeMap<_, _> = result
        .rows
        .iter()
        .map(|r| (r.group["fgos.plan.status"].clone(), r.count))
        .collect();
    assert_eq!(counts["running"], 3);
    assert_eq!(counts["done"], 1);
    assert_eq!(counts["ready"], 1);
    // `where` filters before the newest is chosen, so plan D's older `running` wins once `done` is filtered out.
    let before = query(
        r#"{"kind":["fgos.plan.status"],"latest_per":"subject",
            "where":[{"field":"fgos.plan.status","op":"ne","value":"done"}],
            "where_latest":[{"field":"fgos.plan.status","op":"eq","value":"running"}],"agg":["count"]}"#,
    );
    assert_eq!(ask(&before).rows[0].count, 4);
    // Per ref kind: the newest attempt of each plan.
    let by_ref = query(
        r#"{"kind":["fgos.run.attempt"],"latest_per":"ref:plan","by":["ref:plan"],"agg":["max:ts"]}"#,
    );
    let result = ask(&by_ref);
    assert_eq!(groups(&result, "ref:plan"), ["A", "B", "C", "Z"]);
    assert_eq!(
        result.rows[0].aggs["max:ts"],
        Some(AggValue::Instant(instant("2026-11-18T10:50:00Z")))
    );
}

#[test]
fn having_compares_an_aggregate_with_a_constant_a_parameter_and_k_times_another_value() {
    let attempts = |having: &str| {
        let q = query(&format!(
            r#"{{"kind":["fgos.run.attempt"],"by":["gen_ai.provider.name"],"agg":["count"],"having":[{having}]}}"#
        ));
        groups(&ask(&q), "gen_ai.provider.name")
    };
    assert_eq!(
        attempts(r#"{"lhs":{"agg":{"agg":"count"}},"op":"ge","rhs":{"const":3}}"#),
        ["anthropic"]
    );
    let q = query(
        r#"{"kind":["fgos.run.attempt"],"by":["gen_ai.provider.name"],
            "having":[{"lhs":{"agg":{"agg":"count"}},"op":"lt","rhs":{"param":"cap"}}]}"#,
    );
    assert_eq!(
        groups(
            &ask_at(&q, NOW, &[("cap", 3.0)]).unwrap(),
            "gen_ai.provider.name"
        ),
        ["google", "openai"]
    );
    assert_eq!(
        ask_at(&q, NOW, &[]).unwrap_err(),
        QueryError::MissingParam { name: "cap".into() }
    );
    // k x an aggregate: the group's max duration against twice its p50.
    assert_eq!(
        attempts(
            r#"{"lhs":{"agg":{"agg":"max:fgos.duration"}},"op":"gt","rhs":{"agg":{"agg":"p50:fgos.duration","k":1.1}}}"#
        ),
        ["anthropic", "openai"]
    );
}

#[test]
fn join_adds_the_measures_of_records_that_share_a_ref_and_can_stay_inside_the_span() {
    let by_trigger = |within_span: bool| {
        let q = query(&format!(
            r#"{{"kind":["fgos.supervisor.wake"],"by":["fgos.supervisor.trigger"],
                "join":[{{"kind":["fgos.session.usage"],"on":"session","within_span":{within_span}}}],
                "agg":["sum:join.gen_ai.usage.input_tokens","sum:join.count"]}}"#
        ));
        ask(&q)
            .rows
            .into_iter()
            .map(|r| {
                (
                    r.group["fgos.supervisor.trigger"].clone(),
                    num(&r, "sum:join.gen_ai.usage.input_tokens"),
                    num(&r, "sum:join.count"),
                )
            })
            .collect::<Vec<_>>()
    };
    assert_eq!(
        by_trigger(true),
        [
            ("head-gone".into(), 7500.0, 2.0),
            ("plan-no-progress".into(), 300.0, 1.0)
        ]
    );
    assert_eq!(
        by_trigger(false),
        [
            ("head-gone".into(), 16500.0, 3.0),
            ("plan-no-progress".into(), 300.0, 1.0)
        ]
    );
}

#[test]
fn sum_over_a_joined_measure_counts_each_joined_record_once_per_group() {
    // Both status records of plan A join the same four attempts of plan A. Each record's own sum is 6010 tokens, but
    // the group sum counts the four attempts once. Attempt subjects are of kind run, so they join only through refs.
    let q = query(
        r#"{"kind":["fgos.plan.status"],"ref":["plan:A"],
            "join":[{"kind":["fgos.run.attempt"],"on":"plan"}],
            "agg":["count","sum:join.gen_ai.usage.input_tokens","sum:join.count","max:join.gen_ai.usage.input_tokens"]}"#,
    );
    let row = &ask(&q).rows[0];
    assert_eq!(row.count, 2);
    assert_eq!(num(row, "sum:join.gen_ai.usage.input_tokens"), 6010.0);
    assert_eq!(num(row, "sum:join.count"), 4.0);
    assert_eq!(num(row, "max:join.gen_ai.usage.input_tokens"), 6010.0);
}

#[test]
fn a_joined_name_in_a_filter_that_runs_before_the_join_is_refused() {
    let join = r#""join":[{"kind":["fgos.session.usage"],"on":"session"}]"#;
    let cond = r#"{"field":"join.gen_ai.usage.input_tokens","op":"gt","value":0}"#;
    for (what, json) in [
        (
            "where",
            format!(r#"{{"kind":["fgos.supervisor.wake"],{join},"where":[{cond}]}}"#),
        ),
        (
            "where_latest",
            format!(
                r#"{{"kind":["fgos.supervisor.wake"],{join},"latest_per":"subject","where_latest":[{cond}]}}"#
            ),
        ),
        (
            "without where",
            format!(
                r#"{{"kind":["fgos.supervisor.wake"],{join},
                    "without":[{{"kind":["fgos.watcher.tick"],"where":[{cond}],"within":"5m"}}]}}"#
            ),
        ),
    ] {
        match ask_at(&query(&json), NOW, &[]).unwrap_err() {
            QueryError::Invalid {
                what: got, value, ..
            } => {
                assert_eq!(
                    (got, value.as_str()),
                    (what, "join.gen_ai.usage.input_tokens")
                );
            }
            other => panic!("{what}: {other:?}"),
        }
    }
}

#[test]
fn a_malformed_signed_or_overflowing_duration_or_relative_instant_is_refused() {
    let since = |s: &str| {
        ask_at(
            &query(&format!(r#"{{"kind":["fgos.run.attempt"],"since":"{s}"}}"#)),
            NOW,
            &[],
        )
    };
    let within = |w: &str| {
        ask_at(
            &query(&format!(
                r#"{{"kind":["fgos.supervisor.wake"],"without":[{{"kind":["fgos.watcher.tick"],"within":"{w}"}}]}}"#
            )),
            NOW,
            &[],
        )
    };
    let refused = |r: Result<QueryResult, QueryError>| matches!(r, Err(QueryError::Invalid { .. }));
    // A multi-byte unit, a doubled or explicit sign, a missing amount or unit.
    for bad in ["-5µ", "--5m", "-+5m", "-m", "-", "-5", "-5 m"] {
        assert!(refused(since(bad)), "since {bad}");
    }
    for bad in ["5µ", "-5m", "+5m", "m", "", "µ"] {
        assert!(refused(within(bad)), "within {bad}");
    }
    // Seconds that overflow once scaled to milliseconds are refused; the longest span that fits still runs.
    let huge = format!("{}s", i64::MAX / 500);
    assert!(refused(within(&huge)), "within {huge}");
    assert!(refused(since(&format!("-{huge}"))));
    let far = format!("{}w", i64::MAX / 604_800 / 1000);
    assert!(since(&format!("-{far}")).is_ok());
    assert!(within(&far).is_ok());
    // Well-formed values still run.
    assert!(since("-5m").is_ok());
    assert!(within("5m").is_ok());
}

#[test]
fn without_drops_a_record_that_has_a_match_in_the_window_from_now_or_from_the_record() {
    let q = |anchor: &str, within: &str| {
        query(&format!(
            r#"{{"kind":["fgos.supervisor.wake"],"by":["fgos.supervisor.trigger"],
                "without":[{{"kind":["fgos.watcher.tick"],"where":[{{"field":"fgos.plans.running","op":"gt","value":0}}],
                            "within":"{within}","anchor":"{anchor}"}}]}}"#
        ))
    };
    // Anchored at each wake, a busy tick lies within 10 minutes of the first only.
    assert_eq!(
        groups(&ask(&q("record", "10m")), "fgos.supervisor.trigger"),
        ["plan-no-progress"]
    );
    // Anchored at 12:00, a 5-minute look-back sees no busy tick at all, so both wakes stay.
    assert_eq!(
        groups(&ask(&q("now", "5m")), "fgos.supervisor.trigger").len(),
        2
    );
    // A 45-minute look-back from 12:00 reaches the 11:20 tick, so both go.
    assert!(ask(&q("now", "45m")).rows.is_empty());
}

#[test]
fn a_group_that_matches_nothing_is_one_empty_row_only_when_nothing_groups_it() {
    let none = query(
        r#"{"kind":["fgos.run.attempt"],"where":[{"field":"fgos.outcome","op":"eq","value":"partial"}],"agg":["count","sum:fgos.duration"]}"#,
    );
    let result = ask(&none);
    assert_eq!(result.rows.len(), 1);
    assert_eq!(result.rows[0].count, 0);
    assert_eq!(result.rows[0].aggs["sum:fgos.duration"], None);
    let grouped = query(
        r#"{"kind":["fgos.run.attempt"],"where":[{"field":"fgos.outcome","op":"eq","value":"partial"}],"by":["origin.host"]}"#,
    );
    assert!(ask(&grouped).rows.is_empty());
}

#[test]
fn records_with_the_same_id_from_two_sources_count_once() {
    let reg = registry();
    let (a, b) = (
        MemorySource {
            id: "one",
            kinds: KINDS,
            records: records(),
        },
        MemorySource {
            id: "two",
            kinds: KINDS,
            records: records(),
        },
    );
    let sources: [&dyn RecordSource; 2] = [&a, &b];
    let q = query(r#"{"kind":["fgos.run.attempt"],"agg":["count"]}"#);
    let result = run(
        &q,
        &QueryContext {
            registry: &reg,
            sources: &sources,
            root: Path::new("."),
            now_millis: instant(NOW),
            params: BTreeMap::new(),
        },
    )
    .unwrap();
    assert_eq!(result.rows[0].count, 7);
}

#[test]
fn a_record_with_an_unreadable_timestamp_is_skipped_and_counted() {
    let reg = registry();
    let mut bad = records();
    bad[0].ts = "yesterday".into();
    let source = MemorySource {
        id: "memory",
        kinds: KINDS,
        records: bad,
    };
    let sources: [&dyn RecordSource; 1] = [&source];
    let q = query(r#"{"kind":["fgos.head.state"],"agg":["count"]}"#);
    let result = run(
        &q,
        &QueryContext {
            registry: &reg,
            sources: &sources,
            root: Path::new("."),
            now_millis: instant(NOW),
            params: BTreeMap::new(),
        },
    )
    .unwrap();
    assert_eq!((result.rows[0].count, result.skipped), (6, 1));
}

// ---- unmeasured and refusals ----------------------------------------------------------------------------------

#[test]
fn a_query_over_an_undeclared_or_unserved_kind_is_unmeasured_with_the_reason() {
    let reason = |json: &str| ask(&query(json)).unmeasured.unwrap();
    assert_eq!(
        reason(r#"{"kind":["fgos.nothing"]}"#),
        "kind-undeclared: fgos.nothing"
    );
    assert_eq!(
        reason(r#"{"kind":["fgos.stale.kind"]}"#),
        "no-source: fgos.stale.kind"
    );
    assert_eq!(
        reason(
            r#"{"kind":["fgos.run.attempt"],"without":[{"kind":["fgos.nothing"],"within":"1h"}]}"#
        ),
        "kind-undeclared: fgos.nothing"
    );
    assert!(ask(&query(r#"{"kind":["fgos.nothing"]}"#)).rows.is_empty());
}

#[test]
fn a_failing_source_makes_the_answer_unmeasured_not_empty() {
    let reg = registry();
    let sources: [&dyn RecordSource; 1] = [&FailingSource];
    let q = query(r#"{"kind":["fgos.stale.kind"]}"#);
    let result = run(
        &q,
        &QueryContext {
            registry: &reg,
            sources: &sources,
            root: Path::new("."),
            now_millis: instant(NOW),
            params: BTreeMap::new(),
        },
    )
    .unwrap();
    assert!(result
        .unmeasured
        .unwrap()
        .starts_with("source-failed: failing"));
}

#[test]
fn a_query_that_names_an_unknown_field_or_an_aggregate_a_measure_forbids_is_refused() {
    let err = |json: &str| ask_at(&query(json), NOW, &[]).unwrap_err();
    assert_eq!(
        err(r#"{"kind":["fgos.run.attempt"],"by":["fgos.typo"]}"#),
        QueryError::UnknownField {
            name: "fgos.typo".into()
        }
    );
    assert_eq!(
        err(r#"{"kind":["fgos.watcher.tick"],"agg":["sum:fgos.watcher.interval"]}"#),
        QueryError::AggNotValid {
            measure: "fgos.watcher.interval".into(),
            agg: "sum".into()
        }
    );
    assert_eq!(err(r#"{"kind":[]}"#), QueryError::NoKind);
    // A malformed ref, aggregate or latest-per never becomes a query.
    for bad in [
        r#"{"kind":["fgos.run.attempt"],"ref":["plan"]}"#,
        r#"{"kind":["fgos.run.attempt"],"agg":["sum"]}"#,
        r#"{"kind":["fgos.run.attempt"],"latest_per":"plan"}"#,
    ] {
        assert!(serde_json::from_str::<Query>(bad).is_err(), "{bad}");
    }
}

// ---- detections and measures as plain queries -----------------------------------------------------------------

#[test]
fn head_gone_is_a_latest_state_query_and_a_retired_head_is_not_gone() {
    let result = ask(&definition("head-gone"));
    assert_eq!(groups(&result, "subject.id"), ["h1"]);
}

#[test]
fn plan_no_progress_is_a_running_plan_without_activity_or_attempt_in_the_window() {
    let result = ask(&definition("plan-no-progress"));
    assert_eq!(groups(&result, "subject.id"), ["B"]);
}

#[test]
fn lane_freed_is_attempt_spans_that_ended_since_the_window_by_host() {
    let result = ask(&definition("lane-freed"));
    assert_eq!(groups(&result, "origin.host"), ["alpha", "beta"]);
    assert_eq!((result.rows[0].count, result.rows[1].count), (2, 1));
    // alpha: first start 10:00, last end 11:30. beta: 11:45 to 11:50.
    assert_eq!(
        (num(&result.rows[0], "span"), num(&result.rows[1], "span")),
        (5400.0, 300.0)
    );
}

#[test]
fn plan_became_ready_is_a_latest_ready_status_younger_than_the_threshold() {
    // A, B and C were ready once but run now; E turned ready at 11:40.
    assert_eq!(
        groups(&ask(&definition("plan-became-ready")), "subject.id"),
        ["E"]
    );
    // At 12:30 E has been ready for 50 minutes, past the 30-minute threshold.
    let later = ask_at(
        &definition("plan-became-ready"),
        "2026-11-18T12:30:00Z",
        &[],
    )
    .unwrap();
    assert!(later.rows.is_empty());
}

#[test]
fn watcher_overdue_compares_the_age_of_the_newest_tick_with_k_times_its_interval_while_plans_run() {
    let host = |h: &str| {
        let mut q = definition("watcher-overdue");
        q.where_.push(
            serde_json::from_str(&format!(
                r#"{{"field":"origin.host","op":"eq","value":"{h}"}}"#
            ))
            .unwrap(),
        );
        q
    };
    let overdue = |h: &str, now: &str| {
        ask_at(&host(h), now, &[("min_running", 0.0)])
            .unwrap()
            .rows
            .len()
    };
    // Newest alpha tick 11:20, interval 300 s: 2400 s old at 12:00 is over 3 x 300 s.
    assert_eq!(overdue("alpha", NOW), 1);
    // 300 s old at 11:25 is not.
    assert_eq!(overdue("alpha", "2026-11-18T11:25:00Z"), 0);
    // gamma's tick is just as old but no plan is running.
    assert_eq!(overdue("gamma", NOW), 0);
    // The threshold on running plans is the caller's parameter.
    assert_eq!(
        ask_at(&host("alpha"), NOW, &[("min_running", 1.0)])
            .unwrap()
            .rows
            .len(),
        0
    );
    assert_eq!(
        num(
            &ask_at(&host("alpha"), NOW, &[("min_running", 0.0)])
                .unwrap()
                .rows[0],
            "age:ts"
        ),
        2400.0
    );
}

#[test]
fn supervisor_idle_burn_joins_wake_sessions_to_their_tokens_when_no_busy_tick_is_near() {
    let result = ask(&definition("supervisor-idle-burn"));
    assert_eq!(result.rows.len(), 1);
    assert_eq!(result.rows[0].count, 1);
    assert_eq!(
        num(&result.rows[0], "sum:join.gen_ai.usage.input_tokens"),
        300.0
    );
    // A tick with a ready plan near the second wake means the supervisor had work, so it is no idle burn either.
    let ready_tick = r#"{"v":2,"id":"tick-ready","kind":"fgos.watcher.tick","ts":"2026-11-18T11:52:00Z","subject":{"kind":"session","id":"watcher"},"measures":{"fgos.watcher.interval":300,"fgos.plans.ready":1,"fgos.plans.running":0},"basis":"observed","origin":{"source":"fixture","host":"delta"}}"#;
    let busy = ask_with(&definition("supervisor-idle-burn"), NOW, &[], &[ready_tick]).unwrap();
    assert_eq!(busy.rows[0].count, 0);
}

#[test]
fn every_definition_round_trips_through_its_serialized_form() {
    let dir = fixtures().join("definitions");
    let mut seen = 0;
    for entry in std::fs::read_dir(&dir).unwrap() {
        let path = entry.unwrap().path();
        let parsed: Query = serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
        let written = serde_json::to_string(&parsed).unwrap();
        let reparsed: Query = serde_json::from_str(&written).unwrap();
        assert_eq!(reparsed, parsed, "{}", path.display());
        assert_eq!(serde_json::to_string(&reparsed).unwrap(), written);
        seen += 1;
    }
    assert_eq!(seen, 7);
}

#[test]
fn owner_wait_is_the_span_between_asked_and_answered_grouped_by_the_question_ref() {
    let result = ask(&definition("owner-wait"));
    assert_eq!(groups(&result, "ref:question"), ["q1", "q2"]);
    assert_eq!(
        (num(&result.rows[0], "span"), num(&result.rows[1], "span")),
        (1800.0, 3600.0)
    );
}
