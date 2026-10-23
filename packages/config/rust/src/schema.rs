//! The section schemas (spec section 4): JSON Schema 2020-12 documents authored as YAML, one per
//! section, plus the five `x-fgos-` annotations. This module loads them and answers the one
//! question every other module asks: which schema node (and which inherited annotations) governs
//! a config path. Judging a value against a schema belongs to the validator; judging the schemas
//! themselves belongs to `lint`.
use std::sync::OnceLock;

use fgos_yaml_doc::{parse, Document, Profile, Segment};
use serde_json::Value;

use crate::{bundle, ConfigRefusal};

fn contract() -> &'static Value {
    static CONTRACT: OnceLock<Value> = OnceLock::new();
    CONTRACT.get_or_init(|| {
        serde_json::from_str(include_str!("../../contracts/annotations.v1.json"))
            .unwrap_or(Value::Null)
    })
}

/// The closed annotation list: name, allowed values and default (when it has one).
pub(crate) fn annotations() -> impl Iterator<Item = &'static Value> {
    contract()["annotations"].as_array().into_iter().flatten()
}

/// What a node states for annotation `row`: its value when it is one of the allowed ones.
fn stated<'a>(row: &Value, node: &'a Value) -> Option<&'a str> {
    let value = node[row["name"].as_str()?].as_str()?;
    let allowed = row["values"].as_array()?;
    allowed.iter().any(|v| v == value).then_some(value)
}

/// What the first node of a `$ref` chain that states `name` states.
pub(crate) fn own<'a>(chain: &[At<'a>], name: &str) -> Option<&'a str> {
    let row = annotations().find(|r| r["name"] == name)?;
    chain.iter().find_map(|a| stated(row, a.node))
}

/// One section: its name (the file stem), the parsed file and its JSON form.
pub struct Section {
    pub name: String,
    pub doc: Document,
    pub root: Value,
}

/// Visits every node below `value` with its path; `visit` returns whether to look deeper.
pub(crate) fn descend(
    value: &Value,
    path: &mut Vec<Segment>,
    visit: &mut dyn FnMut(&[Segment], &Value) -> bool,
) {
    let kids: Vec<(Segment, &Value)> = match value {
        Value::Object(map) => map
            .iter()
            .map(|(k, v)| (Segment::Key(k.clone()), v))
            .collect(),
        Value::Array(items) => items
            .iter()
            .enumerate()
            .map(|(i, v)| (Segment::Index(i), v))
            .collect(),
        _ => return,
    };
    for (segment, kid) in kids {
        path.push(segment);
        if visit(path, kid) {
            descend(kid, path, visit);
        }
        path.pop();
    }
}

pub struct Schemas {
    pub(crate) sections: Vec<Section>,
}

/// A schema node with where it sits: the section and its YAML location in that file.
#[derive(Clone)]
pub(crate) struct At<'a> {
    pub sec: usize,
    pub node: &'a Value,
    pub loc: Vec<Segment>,
}

/// The annotations stated so far on the way down, in contract order.
#[derive(Clone, Default)]
pub(crate) struct Inherited<'a>(Vec<Option<&'a str>>);

impl<'a> Inherited<'a> {
    pub fn apply(&mut self, node: &'a Value) {
        self.0.resize(annotations().count(), None);
        for (slot, row) in self.0.iter_mut().zip(annotations()) {
            *slot = stated(row, node).or(*slot);
        }
    }

    /// The effective value of `name`: stated above, else the contract default.
    pub fn get(&self, name: &str) -> Option<&'a str> {
        let (at, row) = annotations().enumerate().find(|(_, r)| r["name"] == name)?;
        self.0
            .get(at)
            .copied()
            .flatten()
            .or(row["default"].as_str())
    }
}

/// The schema node of a config path and the annotations in force there.
pub struct Resolved<'a> {
    pub node: &'a Value,
    pub scope: &'a str,
    pub sensitivity: &'a str,
    pub file: &'a str,
    pub merge: Option<&'a str>,
    pub absent: Option<&'a str>,
}

impl<'a> Resolved<'a> {
    pub(crate) fn of(node: &'a Value, inh: &Inherited<'a>) -> Self {
        let get = |name| inh.get(name).unwrap_or_default();
        Resolved {
            node,
            scope: get("x-fgos-scope"),
            sensitivity: get("x-fgos-sensitivity"),
            file: get("x-fgos-file"),
            merge: inh.get("x-fgos-merge"),
            absent: inh.get("x-fgos-absent"),
        }
    }
}

fn refused(file: &str) -> ConfigRefusal {
    let mut refusal = ConfigRefusal::new("config-parse");
    refusal.file = Some(file.to_string());
    refusal
}

/// A bundled or fixture file: strict-config parse, JSON form, the document kept for positions.
pub(crate) fn load(file: &str, bytes: &[u8]) -> Result<(Document, Value), ConfigRefusal> {
    let doc = parse(bytes, Profile::StrictConfig, file).map_err(ConfigRefusal::parse)?;
    let json = doc.to_json().map_err(ConfigRefusal::parse)?;
    Ok((doc, json))
}

impl Schemas {
    /// Sections in the order given; `files` are `(section, YAML bytes)`.
    pub fn parse(files: &[(&str, &[u8])]) -> Result<Schemas, ConfigRefusal> {
        let mut sections = Vec::new();
        for (name, bytes) in files {
            let file = format!("{name}.schema.yaml");
            let (doc, root) = load(&file, bytes)?;
            if !root.is_object() {
                return Err(refused(&file));
            }
            sections.push(Section {
                name: name.to_string(),
                doc,
                root,
            });
        }
        Ok(Schemas { sections })
    }

    /// The bundled schemas and the bundle digest (schemas and standard files together).
    pub fn bundled() -> Result<(Schemas, String), ConfigRefusal> {
        let schemas = bundle::as_bytes(bundle::SCHEMAS);
        let digest = bundle::digest(&schemas, &bundle::as_bytes(bundle::STANDARD));
        Ok((Schemas::parse(&schemas)?, digest))
    }

    pub fn section(&self, name: &str) -> Option<&Section> {
        self.sections.iter().find(|s| s.name == name)
    }

    pub(crate) fn root(&self, sec: usize) -> At<'_> {
        At {
            sec,
            node: &self.sections[sec].root,
            loc: Vec::new(),
        }
    }

    /// The node a `$ref` names: `#/pointer` in the same section or `<$id>#/pointer` in another.
    pub(crate) fn target(&self, sec: usize, reference: &str) -> Option<At<'_>> {
        let (base, pointer) = reference.split_once('#').unwrap_or((reference, ""));
        let sec = match base {
            "" => sec,
            _ => self.sections.iter().position(|s| s.root["$id"] == base)?,
        };
        let node = self.sections[sec].root.pointer(pointer)?;
        let unescape = |t: &str| t.replace("~1", "/").replace("~0", "~");
        let loc = pointer
            .split('/')
            .skip(1)
            .map(|t| Segment::Key(unescape(t)))
            .collect();
        Some(At { sec, node, loc })
    }

    /// `at` followed through its `$ref` chain, referrer first; `None` when a ref dangles or loops.
    pub(crate) fn chain<'a>(&'a self, at: At<'a>) -> Option<Vec<At<'a>>> {
        let mut out = vec![at];
        for _ in 0..32 {
            let (sec, node) = out.last().map(|l| (l.sec, l.node))?;
            let Some(reference) = node["$ref"].as_str() else {
                return Some(out);
            };
            out.push(self.target(sec, reference)?);
        }
        None
    }

    /// The schema node at `key` (or `key.rest`) under `at`, before `$ref`.
    pub(crate) fn sub<'a>(&self, at: &At<'a>, key: &str, rest: Option<&str>) -> Option<At<'a>> {
        let node = at.node.get(key)?;
        let (node, names) = match rest {
            Some(name) => (node.get(name)?, vec![key, name]),
            None => (node.is_object().then_some(node)?, vec![key]),
        };
        let mut loc = at.loc.clone();
        loc.extend(names.into_iter().map(|k| Segment::Key(k.to_string())));
        Some(At {
            sec: at.sec,
            node,
            loc,
        })
    }

    /// The schema node (before `$ref`) of a child: `properties` wins over `additionalProperties`;
    /// an index takes `items`.
    pub(crate) fn child<'a>(&self, at: &At<'a>, segment: &Segment) -> Option<At<'a>> {
        match segment {
            Segment::Key(name) => self
                .sub(at, "properties", Some(name))
                .or_else(|| self.sub(at, "additionalProperties", None)),
            Segment::Index(_) => self.sub(at, "items", None),
        }
    }

    /// The one door from a config path to its schema node. The first segment names the section.
    pub fn resolve(&self, path: &[Segment]) -> Option<Resolved<'_>> {
        let (Segment::Key(name), rest) = path.split_first()? else {
            return None;
        };
        let sec = self.sections.iter().position(|s| s.name == *name)?;
        let mut at = self.root(sec);
        let mut inherited = Inherited::default();
        for segment in std::iter::once(None).chain(rest.iter().map(Some)) {
            if let Some(segment) = segment {
                at = self.child(&at, segment)?;
            }
            let chain = self.chain(at)?;
            chain.iter().rev().for_each(|a| inherited.apply(a.node));
            at = chain.into_iter().last()?;
        }
        Some(Resolved::of(at.node, &inherited))
    }

    /// Present paths of `value` with no schema node (a doctor warning, never an error). A missing
    /// schema node ends the walk there; its children are not listed again.
    pub fn undescribed(&self, value: &Value) -> Vec<Vec<Segment>> {
        let mut out = Vec::new();
        descend(value, &mut Vec::new(), &mut |path, _| {
            let known = self.resolve(path).is_some();
            if !known {
                out.push(path.to_vec());
            }
            known
        });
        out
    }
}
