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
//! definition takes no other query flag. `--now <rfc3339>` fixes the clock.

use super::definition::{self, Environment, ParamResolver};
use super::{environment, RecordEnvironment};
use crate::contract::{ObserveRequest, RecordSource, SourceError, Window};
use crate::query::{run, Cond, Op, Query, QueryContext};
use crate::record::registry::{load_registry, Registry};
use crate::record::types::Record;
use fgos_host_runtime::civil_time::parse_rfc3339_millis;
use serde_json::{json, Value};
use std::collections::BTreeMap;
use std::io::Read;
use std::path::Path;

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

/// Every use of every flag, in order. `--json` and `--dir` belong to the host and are skipped.
struct Scanned(Vec<(String, String)>);

impl Scanned {
    fn parse(args: &[String]) -> Result<Self, String> {
        let mut found = Vec::new();
        let mut i = 0;
        while i < args.len() {
            let token = &args[i];
            i += 1;
            if token == "--json" {
                continue;
            }
            if !token.starts_with("--") {
                return Err(format!("metrics query: unexpected argument {token}"));
            }
            let is_dir = token == "--dir";
            if !is_dir && !VALUE_FLAGS.contains(&token.as_str()) {
                return Err(format!("metrics query: unknown option {token}"));
            }
            match args.get(i) {
                Some(value) if !value.starts_with("--") => {
                    i += 1;
                    if !is_dir {
                        found.push((token.clone(), value.clone()));
                    }
                }
                _ => return Err(format!("metrics query: missing value for {token}")),
            }
        }
        Ok(Self(found))
    }

    fn all(&self, flag: &str) -> Vec<&str> {
        self.0
            .iter()
            .filter(|(name, _)| name == flag)
            .map(|(_, value)| value.as_str())
            .collect()
    }

    fn one(&self, flag: &str) -> Option<&str> {
        self.all(flag).last().copied()
    }

    /// Comma-separated entries of every use.
    fn list(&self, flag: &str) -> Vec<String> {
        self.all(flag)
            .into_iter()
            .flat_map(|v| v.split(','))
            .map(str::trim)
            .filter(|v| !v.is_empty())
            .map(str::to_owned)
            .collect()
    }
}

fn scalar(text: &str) -> Value {
    match text {
        "true" => json!(true),
        "false" => json!(false),
        _ => text
            .parse::<i64>()
            .map_or_else(|_| json!(text), |n| json!(n)),
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

fn build_query(req: &ObserveRequest, flags: &Scanned) -> Result<Query, String> {
    let mut query = match flags.one("--query") {
        Some(path) => read_query_file(req, path)?,
        None => Query::default(),
    };
    query.kind.extend(flags.list("--kind"));
    for text in flags.all("--where") {
        query.where_.push(parse_cond(text)?);
    }
    for text in flags.all("--where-latest") {
        query.where_latest.push(parse_cond(text)?);
    }
    query.refs.extend(parse_each(flags.list("--ref"))?);
    if let Some(since) = flags.one("--since") {
        query.since = Some(since.to_owned());
    }
    if let Some(until) = flags.one("--until") {
        query.until = Some(until.to_owned());
    }
    if let Some(on) = flags.one("--window-on") {
        query.window_on = serde_json::from_value(json!(on))
            .map_err(|_| format!("metrics query: invalid --window-on {on}: expected ts or end"))?;
    }
    query.by.extend(flags.list("--by"));
    if let Some(bucket) = flags.one("--bucket") {
        query.bucket = Some(serde_json::from_value(json!(bucket)).map_err(|_| {
            format!("metrics query: invalid --bucket {bucket}: expected hour, day or week")
        })?);
    }
    if let Some(latest) = flags.one("--latest-per") {
        query.latest_per = Some(
            latest
                .parse()
                .map_err(|e: crate::query::QueryError| e.to_string())?,
        );
    }
    query.agg.extend(parse_each(flags.list("--agg"))?);
    query
        .having
        .extend(json_each("--having", &flags.all("--having"))?);
    query
        .join
        .extend(json_each("--join", &flags.all("--join"))?);
    query
        .without
        .extend(json_each("--without", &flags.all("--without"))?);
    if let Some(n) = flags.one("--min-sample") {
        query.min_sample = n
            .parse()
            .map_err(|_| format!("metrics query: --min-sample requires a whole number, got {n}"))?;
    }
    Ok(query)
}

/// The record store, offered for every declared kind: the store holds any registered kind, so it names them all.
struct StoreSource {
    kinds: &'static [&'static str],
}

impl RecordSource for StoreSource {
    fn source_id(&self) -> &'static str {
        "fgos.observe.records"
    }
    fn kinds(&self) -> &'static [&'static str] {
        self.kinds
    }
    fn records(&self, root: &Path, w: &Window) -> Result<Vec<Record>, SourceError> {
        crate::record::store::RecordStoreSource.records(root, w)
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

fn now_millis(flags: &Scanned) -> Result<i64, String> {
    match flags.one("--now") {
        Some(text) => parse_rfc3339_millis(text)
            .ok_or_else(|| format!("metrics query: invalid --now {text}: expected RFC 3339")),
        None => parse_rfc3339_millis(&crate::time::now_iso())
            .ok_or_else(|| "metrics query: the clock gave no valid instant".to_owned()),
    }
}

pub fn dispatch_query(req: &ObserveRequest) -> Result<Value, String> {
    dispatch_query_with(req, environment())
}

/// `dispatch_query` over an explicit environment, so a test or a composition root decides what it can reach.
pub fn dispatch_query_with(
    req: &ObserveRequest,
    env: &dyn RecordEnvironment,
) -> Result<Value, String> {
    let flags = Scanned::parse(&req.args)?;
    let definitions = flags.all("--def");
    if !definitions.is_empty() {
        let others: Vec<&str> = flags
            .0
            .iter()
            .map(|(name, _)| name.as_str())
            .filter(|n| !matches!(*n, "--def" | "--now"))
            .collect();
        if let Some(other) = others.first() {
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
    // The sources live for this one call, so naming the kinds once for the store is bounded.
    let kinds: &'static [&'static str] = Box::leak(
        registry
            .kind_names()
            .map(|k| &*Box::leak(k.to_owned().into_boxed_str()))
            .collect::<Vec<&'static str>>()
            .into_boxed_slice(),
    );
    let store = StoreSource { kinds };
    let extra = env.record_sources();
    let mut sources: Vec<&dyn RecordSource> = vec![&store];
    sources.extend(extra.iter().map(|s| s.as_ref()));
    let now = now_millis(&flags)?;

    if !definitions.is_empty() {
        let mut loaded = Vec::new();
        for path in definitions {
            loaded.extend(
                definition::load(Path::new(path)).map_err(|e| format!("metrics query: {e}"))?,
            );
        }
        let mut names = BTreeMap::new();
        for d in &loaded {
            if names.insert(d.name.as_str(), ()).is_some() {
                return Err(format!(
                    "metrics query: definition name '{}' is defined twice",
                    d.name
                ));
            }
        }
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
    for pair in flags.all("--param") {
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
