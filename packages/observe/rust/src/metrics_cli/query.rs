//! `fgos metrics query`: the query grammar as flags, or named definitions with `--def`.
//!
//! Grammar flags (each repeatable one adds to the list; list flags also take commas):
//! `--kind`, `--where`, `--where-latest`, `--ref <kind>:<id>`, `--since`, `--until`, `--window-on ts|end`,
//! `--by`, `--bucket hour|day|week`, `--latest-per subject|ref:<kind>`, `--agg`, `--having`, `--join`,
//! `--without`, `--min-sample`, `--param name=value`, `--query <file|->` (a whole query as JSON; flags add to it).
//!
//! A condition is `field=value`, `field!=value`, `field=a|b` (in), `field<n`, `field>n` or `field?` (exists), or
//! the JSON object a definition file holds. `--having`, `--join` and `--without` take that JSON object.
//! `--def <file|dir>` runs the named definitions in it and returns every definition's rows in one answer; a
//! definition takes no other query flag but `--since`/`--until`, which window every definition it runs.
//! `--now <rfc3339>` fixes the clock.

use super::{parse_flags, RecordEnvironment};
use crate::contract::{ObserveRequest, RecordSource, SourceError, Window};
use crate::definition::{self, Environment, ParamResolver};
use crate::flags::Flags;
use crate::query::{run, Cond, Op, Query, QueryContext};
use crate::record::registry::{load_registry, Registry};
use crate::record::store::{HealthSource, RecordStoreSource};
use crate::record::types::Record;
use crate::time::ParsedWindow;
use fgos_host_runtime::civil_time::parse_rfc3339_millis;
use serde_json::{json, Value};
use std::collections::{BTreeMap, HashSet};
use std::io::Read;
use std::path::Path;
use std::sync::OnceLock;

const VALUE_FLAGS: &[&str] = &[
    "--kind",
    "--where",
    "--where-latest",
    "--ref",
    "--since",
    "--until",
    "--window-on",
    "--by",
    "--bucket",
    "--latest-per",
    "--agg",
    "--having",
    "--join",
    "--without",
    "--min-sample",
    "--param",
    "--query",
    "--def",
    "--now",
];

/// Comma-separated entries of every use of a list flag.
fn list(flags: &Flags, flag: &str) -> Vec<String> {
    flags
        .values(flag)
        .into_iter()
        .flat_map(|v| v.split(','))
        .map(str::trim)
        .filter(|v| !v.is_empty())
        .map(str::to_owned)
        .collect()
}

/// A condition value: a boolean, a whole number, a decimal, or else the text itself.
fn scalar(text: &str) -> Value {
    match text {
        "true" => json!(true),
        "false" => json!(false),
        _ => match (text.parse::<i64>(), text.parse::<f64>()) {
            (Ok(n), _) => json!(n),
            (_, Ok(x)) if x.is_finite() => json!(x),
            _ => json!(text),
        },
    }
}

/// One condition in its short text form, or as the JSON object a definition holds.
fn parse_cond(text: &str) -> Result<Cond, String> {
    if text.trim_start().starts_with('{') {
        return serde_json::from_str(text).map_err(|e| format!("invalid condition {text}: {e}"));
    }
    let cond = |field: &str, op: Op, value: Option<Value>| Cond {
        field: field.to_owned(),
        op,
        value,
    };
    if let Some(field) = text.strip_suffix('?') {
        return Ok(cond(field, Op::Exists, None));
    }
    if let Some((field, value)) = text.split_once("!=") {
        return Ok(cond(field, Op::Ne, Some(scalar(value))));
    }
    if let Some((field, value)) = text.split_once('=') {
        return Ok(if value.contains('|') {
            cond(
                field,
                Op::In,
                Some(Value::Array(value.split('|').map(scalar).collect())),
            )
        } else {
            cond(field, Op::Eq, Some(scalar(value)))
        });
    }
    for (symbol, op) in [('<', Op::Lt), ('>', Op::Gt)] {
        if let Some((field, value)) = text.split_once(symbol) {
            return Ok(cond(field, op, Some(scalar(value))));
        }
    }
    Err(format!(
        "invalid condition {text}: expected field=value, field!=value, field=a|b, field<n, field>n, field? or a JSON object"
    ))
}

fn json_each<T: serde::de::DeserializeOwned>(what: &str, texts: &[&str]) -> Result<Vec<T>, String> {
    texts
        .iter()
        .map(|t| serde_json::from_str(t).map_err(|e| format!("invalid {what} {t}: {e}")))
        .collect()
}

fn parse_each<T: std::str::FromStr<Err = crate::query::QueryError>>(
    items: Vec<String>,
) -> Result<Vec<T>, String> {
    items
        .iter()
        .map(|i| i.parse::<T>().map_err(|e| e.to_string()))
        .collect()
}

fn read_query_file(req: &ObserveRequest, path: &str) -> Result<Query, String> {
    let mut bytes = Vec::new();
    if path == "-" {
        bytes = req
            .stdin
            .clone()
            .ok_or_else(|| "metrics query: --query - needs the query on stdin".to_owned())?;
    } else {
        std::fs::File::open(path)
            .and_then(|f| f.take(1024 * 1024).read_to_end(&mut bytes))
            .map_err(|e| format!("metrics query: cannot read {path}: {e}"))?;
    }
    serde_json::from_slice(&bytes).map_err(|e| format!("metrics query: invalid query {path}: {e}"))
}

fn build_query(req: &ObserveRequest, flags: &Flags) -> Result<Query, String> {
    let mut query = match flags.value("--query") {
        Some(path) => read_query_file(req, path)?,
        None => Query::default(),
    };
    query.kind.extend(list(flags, "--kind"));
    for text in flags.values("--where") {
        query.where_.push(parse_cond(text)?);
    }
    for text in flags.values("--where-latest") {
        query.where_latest.push(parse_cond(text)?);
    }
    query.refs.extend(parse_each(list(flags, "--ref"))?);
    if let Some(since) = flags.value("--since") {
        query.since = Some(since.to_owned());
    }
    if let Some(until) = flags.value("--until") {
        query.until = Some(until.to_owned());
    }
    if let Some(on) = flags.value("--window-on") {
        query.window_on = serde_json::from_value(json!(on))
            .map_err(|_| format!("metrics query: invalid --window-on {on}: expected ts or end"))?;
    }
    query.by.extend(list(flags, "--by"));
    if let Some(bucket) = flags.value("--bucket") {
        query.bucket = Some(serde_json::from_value(json!(bucket)).map_err(|_| {
            format!("metrics query: invalid --bucket {bucket}: expected hour, day or week")
        })?);
    }
    if let Some(latest) = flags.value("--latest-per") {
        query.latest_per = Some(
            latest
                .parse()
                .map_err(|e: crate::query::QueryError| e.to_string())?,
        );
    }
    query.agg.extend(parse_each(list(flags, "--agg"))?);
    query
        .having
        .extend(json_each("--having", &flags.values("--having"))?);
    query
        .join
        .extend(json_each("--join", &flags.values("--join"))?);
    query
        .without
        .extend(json_each("--without", &flags.values("--without"))?);
    if let Some(n) = flags.value("--min-sample") {
        query.min_sample = n
            .parse()
            .map_err(|_| format!("metrics query: --min-sample requires a whole number, got {n}"))?;
    }
    Ok(query)
}

/// The record store, offered for the declared kinds it holds, so a declared kind nobody has written answers
/// `no-source`. The store is read once per call; a read that fails offers every declared kind, so the failure
/// answers `source-failed` instead of a missing source.
struct StoreSource<'a> {
    root: &'a Path,
    declared: Vec<&'a str>,
    read: OnceLock<StoreRead<'a>>,
}

struct StoreRead<'a> {
    kinds: Vec<&'a str>,
    records: Result<Vec<Record>, String>,
}

const STORE_SOURCE_ID: &str = "fgos.observe.records";

impl<'a> StoreSource<'a> {
    fn read(&self) -> &StoreRead<'a> {
        self.read.get_or_init(
            || match RecordStoreSource.records(self.root, &Window::default()) {
                Ok(records) => {
                    let held: HashSet<&str> = records.iter().map(|r| r.kind.as_str()).collect();
                    StoreRead {
                        kinds: self
                            .declared
                            .iter()
                            .copied()
                            .filter(|k| held.contains(k))
                            .collect(),
                        records: Ok(records),
                    }
                }
                Err(e) => StoreRead {
                    kinds: self.declared.clone(),
                    records: Err(e.to_string()),
                },
            },
        )
    }
}

impl RecordSource for StoreSource<'_> {
    fn source_id(&self) -> &'static str {
        STORE_SOURCE_ID
    }
    fn kinds(&self) -> &[&str] {
        &self.read().kinds
    }
    /// The records of the one read, inside the window; the root is the one this source was built for.
    fn records(&self, _: &Path, w: &Window) -> Result<Vec<Record>, SourceError> {
        let failed = |message: String| SourceError::ReadFailed {
            source_id: STORE_SOURCE_ID,
            message,
        };
        let window = ParsedWindow::parse(w).map_err(failed)?;
        match &self.read().records {
            Err(message) => Err(failed(message.clone())),
            Ok(records) => Ok(records
                .iter()
                .filter(|r| parse_rfc3339_millis(&r.ts).is_some_and(|ms| window.contains(ms)))
                .cloned()
                .collect()),
        }
    }
}

struct Resolver<'a> {
    env: &'a dyn RecordEnvironment,
    root: &'a Path,
}

impl ParamResolver for Resolver<'_> {
    fn config_number(&self, key: &str) -> Result<Option<f64>, String> {
        self.env.config_number(self.root, key)
    }
}

fn now_millis(flags: &Flags) -> Result<i64, String> {
    match flags.value("--now") {
        Some(text) => parse_rfc3339_millis(text)
            .ok_or_else(|| format!("metrics query: invalid --now {text}: expected RFC 3339")),
        None => parse_rfc3339_millis(&crate::time::now_iso())
            .ok_or_else(|| "metrics query: the clock gave no valid instant".to_owned()),
    }
}

/// Runs the query over what the environment reaches: the composition root's in the binary, a test's own in tests.
pub fn dispatch_query(req: &ObserveRequest, env: &dyn RecordEnvironment) -> Result<Value, String> {
    let flags = parse_flags("query", &req.args, VALUE_FLAGS, &[], false)?;
    let definitions = flags.values("--def");
    if !definitions.is_empty() {
        let other = VALUE_FLAGS
            .iter()
            .filter(|f| !matches!(**f, "--def" | "--now" | "--since" | "--until"))
            .find(|f| flags.value(f).is_some());
        if let Some(other) = other {
            return Err(format!(
                "metrics query: {other} cannot be used with --def; a definition holds its own query"
            ));
        }
    }
    let registry: Registry = load_registry(
        &env.embedded_declarations(),
        env.payload_root().as_deref(),
        Some(&req.root),
    )
    .map_err(|e| format!("metrics query: registry load failed: {e}"))?;
    let store = StoreSource {
        root: &req.root,
        declared: registry.kind_names().collect(),
        read: OnceLock::new(),
    };
    let extra = env.record_sources();
    let mut sources: Vec<&dyn RecordSource> = vec![&store, &HealthSource];
    sources.extend(extra.iter().map(|s| s.as_ref()));
    let now = now_millis(&flags)?;

    if !definitions.is_empty() {
        let paths: Vec<&Path> = definitions.iter().map(Path::new).collect();
        let mut loaded = definition::load(&paths).map_err(|e| format!("metrics query: {e}"))?;
        definition::window(&mut loaded, flags.value("--since"), flags.value("--until"));
        let resolver = Resolver {
            env,
            root: &req.root,
        };
        let answers = definition::run_definitions(
            &loaded,
            &Environment {
                registry: &registry,
                sources: &sources,
                root: &req.root,
                now_millis: now,
                resolver: &resolver,
            },
        );
        return Ok(json!({ "ok": true, "definitions": answers }));
    }

    let query = build_query(req, &flags)?;
    let mut params = BTreeMap::new();
    for pair in flags.values("--param") {
        let (name, value) = pair
            .split_once('=')
            .ok_or_else(|| format!("metrics query: --param {pair}: expected name=value"))?;
        let value: f64 = value
            .parse()
            .map_err(|_| format!("metrics query: --param {name} needs a number, got {value}"))?;
        params.insert(name.to_owned(), value);
    }
    let result = run(
        &query,
        &QueryContext {
            registry: &registry,
            sources: &sources,
            root: &req.root,
            now_millis: now,
            params,
        },
    )
    .map_err(|e| format!("metrics query: {e}"))?;
    let mut answer = serde_json::to_value(&result).map_err(|e| e.to_string())?;
    if let Value::Object(map) = &mut answer {
        map.insert("ok".to_owned(), json!(true));
    }
    Ok(answer)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::query::LatestPer;

    fn built(args: &[&str]) -> Result<Query, String> {
        let req = ObserveRequest {
            operation: "observe.metrics".to_owned(),
            sub: "query".to_owned(),
            args: args.iter().map(|a| (*a).to_owned()).collect(),
            root: std::path::PathBuf::from("/no-such-query-root"),
            stdin: None,
        };
        let flags = parse_flags("query", &req.args, VALUE_FLAGS, &[], false)?;
        build_query(&req, &flags)
    }

    #[test]
    fn every_grammar_flag_reaches_the_query_and_repeated_flags_add_up() {
        let having = r#"{"lhs":{"agg":{"agg":"count"}},"op":"gt","rhs":{"const":2}}"#;
        let join = r#"{"kind":["fgos.run.attempt"],"on":"plan"}"#;
        let without = r#"{"kind":["fgos.plan.status"],"within":"1h"}"#;
        let query = built(&[
            "--kind",
            "a.kind,b.kind",
            "--where",
            "x=1",
            "--where",
            "y?",
            "--where-latest",
            "z!=off",
            "--ref",
            "plan:p1",
            "--ref",
            "lane:l1",
            "--since",
            "-1h",
            "--latest-per",
            "ref:plan",
            "--having",
            having,
            "--join",
            join,
            "--without",
            without,
            "--min-sample",
            "3",
        ])
        .unwrap();
        assert_eq!(query.kind, ["a.kind", "b.kind"]);
        assert_eq!(
            query.where_,
            [
                Cond {
                    field: "x".into(),
                    op: Op::Eq,
                    value: Some(json!(1))
                },
                Cond {
                    field: "y".into(),
                    op: Op::Exists,
                    value: None
                },
            ]
        );
        assert_eq!(query.where_latest[0].op, Op::Ne);
        let refs: Vec<(&str, &str)> = query
            .refs
            .iter()
            .map(|r| (r.kind.as_str(), r.id.as_str()))
            .collect();
        assert_eq!(refs, [("plan", "p1"), ("lane", "l1")]);
        assert_eq!(query.since.as_deref(), Some("-1h"));
        assert_eq!(query.latest_per, Some(LatestPer::Ref("plan".into())));
        assert_eq!(query.having, [serde_json::from_str(having).unwrap()]);
        assert_eq!(query.join, [serde_json::from_str(join).unwrap()]);
        assert_eq!(query.without, [serde_json::from_str(without).unwrap()]);
        assert_eq!(query.min_sample, 3);
    }

    #[test]
    fn bad_grammar_values_are_named_errors() {
        let error = |args: &[&str]| built(args).unwrap_err();
        assert!(error(&["--latest-per", "lane"]).contains("expected subject or ref:<kind>"));
        assert!(error(&["--min-sample", "-1"]).contains("--min-sample requires a whole number"));
        assert!(error(&["--having", "{"]).starts_with("invalid --having {"));
        assert!(error(&["--join", "[]"]).starts_with("invalid --join []"));
        assert!(error(&["--without", "{}"]).starts_with("invalid --without {}"));
        assert!(error(&["--where", "nothing"]).starts_with("invalid condition nothing"));
        assert_eq!(
            error(&["--nope", "1"]),
            "metrics query: unknown option --nope"
        );
        assert_eq!(
            error(&["--kind"]),
            "metrics query: missing value for --kind"
        );
    }

    #[test]
    fn a_condition_value_reads_as_a_whole_number_a_decimal_a_boolean_or_text() {
        let value = |text: &str| parse_cond(text).unwrap().value.unwrap();
        assert_eq!(value("x<0.5"), json!(0.5));
        assert_eq!(value("x>-2.25"), json!(-2.25));
        assert_eq!(value("x=7"), json!(7));
        assert_eq!(value("x=true"), json!(true));
        assert_eq!(value("x=1.2.3"), json!("1.2.3"));
        assert_eq!(value("x=NaN"), json!("NaN"));
        assert_eq!(value("x=0.5|2"), json!([0.5, 2]));
    }
}
