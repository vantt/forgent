//! What a person may see (spec section 9). Config stores references to secrets and never expands
//! one (the crate has no resolver and does not depend on Secrets), so a `secret-reference` is shown
//! as stored. A `secret-value` is carried in the in-process `Snapshot::value` and shown as
//! `<redacted>` by every display form; a `command` value is shown as is, a reader must audit it.
use std::fmt;

use fgos_yaml_doc::Segment;
use serde_json::Value;

use crate::schema::Schemas;
use crate::snapshot::Snapshot;

pub const REDACTED: &str = "<redacted>";

fn redact(schemas: &Schemas, value: &Value, path: &mut Vec<Segment>) -> Value {
    if schemas
        .resolve(path)
        .is_some_and(|r| r.sensitivity == "secret-value")
    {
        return Value::String(REDACTED.into());
    }
    let mut below = |segment: Segment, value: &Value| {
        path.push(segment);
        let shown = redact(schemas, value, path);
        path.pop();
        shown
    };
    match value {
        Value::Object(map) => Value::Object(
            map.iter()
                .map(|(key, v)| (key.clone(), below(Segment::Key(key.clone()), v)))
                .collect(),
        ),
        Value::Array(items) => Value::Array(
            items
                .iter()
                .enumerate()
                .map(|(i, v)| below(Segment::Index(i), v))
                .collect(),
        ),
        other => other.clone(),
    }
}

/// The effective value as every display form shows it: `show`, `explain`, `check`, doctor output,
/// diffs and migration reports call this, never `Snapshot::value`.
pub fn render_for_display(snapshot: &Snapshot, schemas: &Schemas) -> Value {
    redact(schemas, &snapshot.value, &mut Vec::new())
}

/// Counts and source roles only: a debug print of a snapshot carries no value.
impl fmt::Debug for Snapshot {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let roles: Vec<_> = self.revisions.keys().collect();
        write!(
            f,
            "Snapshot({} paths, sources {roles:?}, accounts {:?})",
            self.origins.len(),
            self.accounts
        )
    }
}
