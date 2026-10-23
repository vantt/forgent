//! The one place that names the JSON Schema validator crate (`jsonschema`, pinned in
//! `packages/config/upgrade-record.md`). Two facts keep its known defects out of reach:
//!
//! - Every schema and instance enters as a `fgos_yaml_doc::Value` (`Doc` below) and becomes JSON
//!   inside this module only. That value holds finite floats and `i64`, so a number the crate
//!   cannot compare (an out-of-range literal read from JSON text) has no way in.
//! - A finding is built from the error kind, the instance path and the schema location, never from
//!   the crate's message, so no instance value reaches a finding.
use std::sync::OnceLock;

use fgos_yaml_doc::guard::guard;
use fgos_yaml_doc::path::format_path;
use fgos_yaml_doc::{Segment, Value as Doc};
use jsonschema::error::ValidationErrorKind as Kind;
use jsonschema::{Draft, Registry, Validator};
use serde_json::{json, Value};

use crate::schema::{unescape_pointer, Schemas};
use crate::ConfigRefusal;

/// One failed keyword: where in the checked value, which keyword, and the schema location of that
/// keyword (`<$id>#/<pointer>`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Violation {
    pub path: Vec<Segment>,
    pub keyword: String,
    pub schema_path: String,
}

impl Violation {
    /// The `config-schema` refusal of this violation, without a file position.
    pub(crate) fn into_refusal(self) -> ConfigRefusal {
        let mut refusal = ConfigRefusal::new("config-schema").at_path(&self.path);
        let detail = refusal.detail_mut();
        (detail.keyword, detail.schema_path) = (Some(self.keyword), Some(self.schema_path));
        refusal
    }
}

/// A refusal of the crate itself (a panic caught, a schema it cannot build) carries no value.
fn guarded<T>(f: impl FnOnce() -> Result<T, ConfigRefusal>) -> Result<T, ConfigRefusal> {
    guard(|| Ok(f())).map_err(ConfigRefusal::parse)?
}

/// `/a/0/b` over `instance`: an index when the node there is an array, else a key.
fn segments(instance: &Value, pointer: &str) -> Vec<Segment> {
    let mut node = instance;
    let mut out = Vec::new();
    for token in pointer.split('/').skip(1) {
        let token = unescape_pointer(token);
        let (segment, next) = match (node, token.parse::<usize>()) {
            (Value::Array(items), Ok(i)) => (Segment::Index(i), items.get(i)),
            _ => (Segment::Key(token.clone()), node.get(&token)),
        };
        out.push(segment);
        let Some(next) = next else { break };
        node = next;
    }
    out
}

/// A schema compiled once, with the schemas it refers to registered in memory (no retriever: a
/// reference outside the registered set is an error, never a fetch).
pub(crate) struct Checker(Validator);

impl Checker {
    pub fn new(schema: &Doc, registered: &[&Doc]) -> Result<Checker, ConfigRefusal> {
        guarded(|| {
            let refused = || ConfigRefusal::new("config-schema");
            let mut registry = Registry::new();
            for resource in registered {
                let json = resource.to_json();
                let id = json["$id"].as_str().ok_or_else(refused)?.to_string();
                registry = registry.add(id, json).map_err(|_| refused())?;
            }
            let registry = registry.prepare().map_err(|_| refused())?;
            let validator = jsonschema::options()
                .with_draft(Draft::Draft202012)
                .with_registry(&registry)
                .build(&schema.to_json())
                .map_err(|_| refused())?;
            Ok(Checker(validator))
        })
    }

    /// Every violation, sorted by path, keyword and schema location.
    pub fn check(&self, instance: &Doc) -> Result<Vec<Violation>, ConfigRefusal> {
        guarded(|| {
            let json = instance.to_json();
            let mut out: Vec<Violation> = self
                .0
                .iter_errors(&json)
                .map(|e| {
                    let mut path = segments(&json, e.instance_path().as_str());
                    if let Kind::Required {
                        property: Value::String(name),
                    } = e.kind()
                    {
                        path.push(Segment::Key(name.clone()));
                    }
                    Violation {
                        path,
                        keyword: e.kind().keyword().to_string(),
                        schema_path: e.absolute_keyword_location().map_or_else(
                            || e.schema_path().as_str().to_string(),
                            |uri| uri.to_string(),
                        ),
                    }
                })
                .collect();
            out.sort_by_cached_key(|v| {
                (
                    format_path(&v.path),
                    v.keyword.clone(),
                    v.schema_path.clone(),
                )
            });
            out.dedup();
            Ok(out)
        })
    }
}

const META_ID: &str = "urn:fgos:config-schema-meta:v1";

/// The rules every section schema must satisfy, as data: a `$defs` entry per rule id, named after it
/// (`contracts/config-schema.meta.v1.json`).
fn contract() -> &'static Value {
    contract!("config-schema.meta.v1.json")
}

/// The rule ids a section schema `doc` breaks, each with the path in `doc` of the failing keyword.
/// The crate reports the absolute location of the failing keyword, `<$id>#/$defs/<rule>[.part]/...`,
/// so the `$defs` name gives the id directly. A failure inside the official 2020-12 meta-schema
/// (`$id` elsewhere) is `schema-dialect`: the file is not a 2020-12 schema.
pub(crate) fn meta_check(doc: &Doc) -> Result<Vec<(&'static str, Vec<Segment>)>, ConfigRefusal> {
    static META: OnceLock<Result<Checker, ConfigRefusal>> = OnceLock::new();
    let checker = META
        .get_or_init(|| Checker::new(&Doc::from_json(contract()), &[]))
        .as_ref()
        .map_err(Clone::clone)?;
    let rule = |at: &str| {
        let part = at.strip_prefix(META_ID)?.strip_prefix("#/$defs/")?;
        let id = part.split('/').next()?.split('.').next()?;
        contract()["$defs"].as_object()?.keys().find(|k| *k == id)
    };
    Ok(checker
        .check(doc)?
        .into_iter()
        .map(|v| {
            (
                rule(&v.schema_path).map_or("schema-dialect", String::as_str),
                v.path,
            )
        })
        .collect())
}

impl Schemas {
    /// The effective value against the section schemas: one root whose properties each refer to a
    /// section schema by its `$id`, compiled on first use.
    pub fn validate(&self, effective: &Doc) -> Result<Vec<Violation>, ConfigRefusal> {
        self.checker
            .get_or_init(|| {
                let sections: Vec<&Doc> = self.sections.iter().map(|s| s.doc.value()).collect();
                let properties: serde_json::Map<String, Value> = self
                    .sections
                    .iter()
                    .map(|s| (s.name.clone(), json!({ "$ref": s.root["$id"] })))
                    .collect();
                let root = json!({
                    "$schema": "https://json-schema.org/draft/2020-12/schema",
                    "type": "object",
                    "properties": properties,
                });
                Checker::new(&Doc::from_json(&root), &sections)
            })
            .as_ref()
            .map_err(Clone::clone)?
            .check(effective)
    }
}
