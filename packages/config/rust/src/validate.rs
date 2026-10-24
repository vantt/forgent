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
use serde_json::Value;

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
    /// The effective value against every section schema.
    pub fn validate(&self, effective: &Doc) -> Result<Vec<Violation>, ConfigRefusal> {
        self.validate_sections(effective, |_| true)
    }

    /// The effective value against the schemas of the sections `wanted` names. A section's validator
    /// is compiled the first time it is needed and kept, so a read pays only for the sections its
    /// files hold; a section no file wrote is the bundled standard, which the crate's own tests
    /// validate. A top-level key no schema describes is not judged here (scope judges it).
    pub fn validate_sections(
        &self,
        effective: &Doc,
        wanted: impl Fn(&str) -> bool,
    ) -> Result<Vec<Violation>, ConfigRefusal> {
        let Doc::Map(entries) = effective else {
            return Ok(Vec::new());
        };
        let mut out = Vec::new();
        for (at, section) in self.sections.iter().enumerate() {
            let Some((_, value)) = entries.iter().find(|(key, _)| *key == section.name) else {
                continue;
            };
            if !wanted(&section.name) {
                continue;
            }
            let checker = self.checkers[at]
                .get_or_init(|| Checker::new(section.doc.value(), &[]))
                .as_ref()
                .map_err(Clone::clone)?;
            for mut found in checker.check(value)? {
                found.path.insert(0, Segment::Key(section.name.clone()));
                out.push(found);
            }
        }
        out.sort_by_cached_key(|v| {
            (
                format_path(&v.path),
                v.keyword.clone(),
                v.schema_path.clone(),
            )
        });
        out.dedup();
        Ok(out)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn only_the_sections_asked_for_are_compiled_and_judged() {
        let (schemas, _) = Schemas::bundled().unwrap();
        let bad = |name: &str| Doc::from_json(&json!({ name: { "port": "not a number" } }));
        let mixed = Doc::from_json(
            &json!({ "gateway": { "port": "x" }, "terminal": { "allocationGraceMs": "y" } }),
        );
        let found = schemas
            .validate_sections(&mixed, |s| s == "gateway")
            .unwrap();
        assert!(
            found
                .iter()
                .all(|v| v.path[0] == Segment::Key("gateway".into()))
                && !found.is_empty()
        );
        let compiled: Vec<_> = (0..schemas.sections.len())
            .filter(|i| schemas.checkers[*i].get().is_some())
            .collect();
        assert_eq!(compiled.len(), 1, "one validator, the section asked for");
        assert_eq!(schemas.sections[compiled[0]].name, "gateway");
        // The full check compiles the rest once and keeps them.
        assert!(!schemas.validate(&bad("gateway")).unwrap().is_empty());
        assert!(schemas
            .validate(&mixed)
            .unwrap()
            .iter()
            .any(|v| v.path[0] == Segment::Key("terminal".into())));
    }
}
