//! The lint rules a meta-schema cannot state (`contracts/config-schema.meta.v1.json` holds the rest):
//! the `$id` section equals the file stem, a `$ref` that dangles or loops, a scope that contradicts
//! an ancestor's, an `x-fgos-absent` the standard answers, and what a standard file may hold.
//! Findings carry an id, file, location and position, never a value.
use fgos_yaml_doc::path::format_path;
use fgos_yaml_doc::{Document, Segment};

use crate::schema::{descend, key_span, own, At, Schemas};
use crate::standard::Standard;
use crate::validate::meta_check;

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct Finding {
    pub id: &'static str,
    pub file: String,
    /// The YAML location in a schema file, the config path in a standard file.
    pub path: String,
    pub line: Option<u32>,
    pub column: Option<u32>,
}

fn finding(id: &'static str, doc: &Document, at: &[Segment], path: &[Segment]) -> Finding {
    let span = key_span(doc, at);
    Finding {
        id,
        file: doc.file().to_string(),
        path: format_path(path),
        line: span.map(|s| s.line),
        column: span.map(|s| s.column),
    }
}

/// Every rule: the meta-schema's per-node rules, then the cross-node and standard rules.
pub fn lint(schemas: &Schemas, standard: &Standard) -> Vec<Finding> {
    let mut out = meta(schemas);
    out.extend(cross_node(schemas, standard));
    out.sort();
    out.dedup();
    out
}

/// The per-node rules, stated as data in `contracts/config-schema.meta.v1.json`.
pub fn meta(schemas: &Schemas) -> Vec<Finding> {
    let mut out = Vec::new();
    for section in &schemas.sections {
        // A meta-schema that cannot compile judges nothing: the file counts as not a 2020-12 schema.
        let broken = meta_check(section.doc.value())
            .unwrap_or_else(|_| vec![("schema-dialect", Vec::new())]);
        out.extend(
            broken
                .iter()
                .map(|(id, at)| finding(id, &section.doc, at, at)),
        );
    }
    out.sort();
    out.dedup();
    out
}

/// The rules that read more than one node or file, and the standard files.
pub fn cross_node(schemas: &Schemas, standard: &Standard) -> Vec<Finding> {
    let mut out = Vec::new();
    for (sec, section) in schemas.sections.iter().enumerate() {
        let id = section.root["$id"].as_str().unwrap_or_default();
        if !id.starts_with("urn:fgos:config-schema:") || id.split(':').nth(3) != Some(&section.name)
        {
            out.push(finding("schema-id", &section.doc, &[], &[]));
        }
        walk(
            schemas,
            standard,
            schemas.root(sec),
            Some(section.path()),
            "both",
            &mut Vec::new(),
            &mut out,
        );
    }
    standard_files(schemas, standard, &mut out);
    standard_valid(schemas, standard, &mut out);
    out.sort();
    out.dedup();
    out
}

/// The nodes reachable by a config path. `path` is `None` below an entry with no fixed name.
fn walk(
    schemas: &Schemas,
    standard: &Standard,
    at: At<'_>,
    path: Option<Vec<Segment>>,
    parent_scope: &str,
    stack: &mut Vec<(usize, Vec<Segment>)>,
    out: &mut Vec<Finding>,
) {
    let doc = &schemas.sections[at.sec].doc;
    let place = |id| finding(id, doc, &at.loc, path.as_deref().unwrap_or_default());
    let Some(chain) = schemas.chain(at.clone()) else {
        return out.push(place("schema-dialect"));
    };
    let last = chain[chain.len() - 1].clone();
    let key = (last.sec, last.loc.clone());
    if stack.contains(&key) {
        return out.push(place("schema-dialect"));
    }
    let own_scope = own(&chain, "x-fgos-scope");
    if own_scope.is_some_and(|s| s != "both" && parent_scope != "both" && s != parent_scope) {
        out.push(place("schema-scope-conflict"));
    }
    if own(&chain, "x-fgos-absent").is_some()
        && path
            .as_ref()
            .is_some_and(|p| standard.value_at(p).is_some())
    {
        out.push(place("schema-absent-conflict"));
    }
    let scope = own_scope.unwrap_or(parent_scope);
    stack.push(key);
    for (name, child) in schemas.children(&last) {
        let path = name
            .and_then(|name| Some([path.clone()?, vec![Segment::Key(name.to_string())]].concat()));
        walk(schemas, standard, child, path, scope, stack, out);
    }
    stack.pop();
}

fn standard_files(schemas: &Schemas, standard: &Standard, out: &mut Vec<Finding>) {
    for file in &standard.files {
        let alone = file
            .value
            .as_object()
            .is_some_and(|m| m.len() == 1 && m.contains_key(&file.name));
        if schemas.section(&file.name).is_none() || !alone {
            out.push(finding("standard-orphan", &file.doc, &[], &[]));
            continue;
        }
        descend(&file.value, &mut Vec::new(), &mut |path, value| {
            let leaf = value.as_object().map_or_else(
                || value.as_array().is_none_or(|a| a.is_empty()),
                |m| m.is_empty(),
            );
            let held_back = leaf
                && schemas.resolve(path).is_some_and(|r| {
                    r.sensitivity.starts_with("secret-")
                        || r.file != "config"
                        || r.absent == Some("detected")
                });
            if held_back {
                out.push(finding("standard-forbidden-key", &file.doc, path, path));
            }
            !leaf
        });
    }
}

/// The standard layer against its own schemas. A standard file holds differences only, so a
/// missing `required` key is for the merge to judge, not for the standard.
fn standard_valid(schemas: &Schemas, standard: &Standard, out: &mut Vec<Finding>) {
    if standard.files.is_empty() {
        return;
    }
    let Ok(violations) = schemas.validate(standard.layer()) else {
        return;
    };
    for v in violations.iter().filter(|v| v.keyword != "required") {
        let (file, span) = standard.span_of(&v.path).unzip();
        out.push(Finding {
            id: "standard-invalid",
            file: file.unwrap_or_default().to_string(),
            path: format_path(&v.path),
            line: span.map(|s| s.line),
            column: span.map(|s| s.column),
        });
    }
}
