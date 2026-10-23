//! The standard layer (spec section 4, decision on shape and values): the bundled standard files
//! `core/config-standard/<section>.yaml`, merged in schema-set order into one value. A standard
//! value keeps the file, line and column it came from. No `default` keyword is ever read.
use fgos_yaml_doc::merge::{merge, NoRules};
use fgos_yaml_doc::{Document, Segment, Span};
use serde_json::Value;

use crate::schema::{load, Schemas};
use crate::{bundle, ConfigRefusal};

/// One standard file: its section (the file stem), the parsed file and its JSON form.
pub struct StandardFile {
    pub name: String,
    pub doc: Document,
    pub value: Value,
}

pub struct Standard {
    pub files: Vec<StandardFile>,
    value: Value,
    layer: fgos_yaml_doc::Value,
}

impl Standard {
    /// `files` are `(section, YAML bytes)`. Files of sections with a schema come first, in schema-set
    /// order; a file with no schema (lint refuses it) follows in the order given.
    pub fn parse(files: &[(&str, &[u8])], schemas: &Schemas) -> Result<Standard, ConfigRefusal> {
        let order = |name: &str| schemas.sections.iter().position(|s| s.name == name);
        let mut files = files.to_vec();
        files.sort_by_key(|(name, _)| order(name).unwrap_or(usize::MAX));
        let files = files
            .iter()
            .map(|(name, bytes)| {
                let (doc, value) = load(&format!("{name}.yaml"), bytes)?;
                Ok(StandardFile {
                    name: name.to_string(),
                    doc,
                    value,
                })
            })
            .collect::<Result<Vec<_>, ConfigRefusal>>()?;
        // `merge` takes the highest priority first; the files hold different sections, so the order
        // only matters for a file lint refuses.
        let layers: Vec<_> = files.iter().rev().map(|f| f.doc.value()).collect();
        let merged = merge(&layers, &NoRules).map_err(ConfigRefusal::parse)?;
        Ok(Standard {
            value: merged.value.to_json(),
            layer: merged.value,
            files,
        })
    }

    pub fn bundled(schemas: &Schemas) -> Result<Standard, ConfigRefusal> {
        Standard::parse(&bundle::as_bytes(bundle::STANDARD), schemas)
    }

    /// The merged standard layer; null when there is no standard file.
    pub fn value(&self) -> &Value {
        &self.value
    }

    /// The merged layer as the YAML Document value, the form the validator takes.
    pub fn layer(&self) -> &fgos_yaml_doc::Value {
        &self.layer
    }

    pub fn value_at(&self, path: &[Segment]) -> Option<&Value> {
        path.iter()
            .try_fold(&self.value, |node, segment| match segment {
                Segment::Key(key) => node.get(key.as_str()),
                Segment::Index(index) => node.get(*index),
            })
    }

    /// The file name, line and column a standard value was written at.
    pub fn span_of(&self, path: &[Segment]) -> Option<(&str, Span)> {
        let Some(Segment::Key(section)) = path.first() else {
            return None;
        };
        let file = self.files.iter().find(|f| f.name == *section)?;
        let spans = file.doc.span_of(path)?;
        Some((file.doc.file(), spans.key.unwrap_or(spans.value)))
    }
}
