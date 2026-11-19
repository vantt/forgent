//! Collaboration patterns: the catalog of named patterns a project may use, the check every entry passes, and
//! the rules for naming the loop of a pattern, the resolution of a unit run's collaboration, and the retired config
//! keys.
//!
//! The vectors of `packages/execution/contracts/core-unit/patterns.v1.json` are the proof. What the catalog reads
//! from the loop and seat modules (loop names, parameter tables, checker seats, the declared-seat check) comes
//! through [`LoopTables`]; what the resolution asks of the seat modules (seats, launch bound, checker plan) comes
//! through [`Seating`]. The module is pure: no file, clock, environment or process.

mod catalog_entries;
mod collaboration;
mod retired_keys;

pub use catalog_entries::{
    check_catalog, deep_equal, CatalogCheck, DeclaredSeat, LoopTables, ParamDef, SeatError,
};
pub use collaboration::{
    resolve_collaboration, Collaboration, CollaborationFailure, ResolveOptions, Seating,
};
pub use retired_keys::{
    detect_retired_pattern_keys, format_retired_key_sentence, RetiredFinding, RetiredKey,
    RESERVED_PATTERN_NAMES, RETIRED_CONFIG_KEYS, RETIRED_GATED_NAME, SEAT_BINDING_MARKER_PATH,
};

use serde_json::Value;

/// A refusal of the catalog or of a collaboration request, with a stable code and the config layer it came from.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CollaborationError {
    pub code: String,
    /// The sentence a reader sees; ends in `(source layer: <layer>)` when the layer is known.
    pub message: String,
    /// The sentence without the layer.
    pub detail: String,
    pub source: Option<String>,
    pub path: Option<String>,
}

impl CollaborationError {
    /// A refusal. A caller that swapped the arguments (a sentence with spaces as the code and a bare slug as the
    /// message) still gets the slug as the code; a refusal with no message takes the code as its sentence.
    pub fn new(
        code: &str,
        message: Option<&str>,
        source: Option<&str>,
        path: Option<&str>,
    ) -> Self {
        let is_slug = |text: &str| {
            !text.is_empty()
                && text
                    .chars()
                    .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
        };
        let (final_code, final_message) = match message {
            Some(m) if code.contains(' ') && !m.contains(' ') && is_slug(m) => (m, code),
            Some(m) => (code, m),
            None => (code, code),
        };
        let detail = if final_message.is_empty() {
            final_code
        } else {
            final_message
        };
        CollaborationError {
            code: final_code.to_string(),
            message: match source {
                Some(layer) => format!("{detail} (source layer: {layer})"),
                None => detail.to_string(),
            },
            detail: detail.to_string(),
            source: source.map(str::to_string),
            path: path.map(str::to_string),
        }
    }
}

impl std::fmt::Display for CollaborationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.message)
    }
}

impl std::error::Error for CollaborationError {}

fn prop<'a>(value: &'a Value, key: &str) -> Option<&'a Value> {
    value
        .as_object()
        .and_then(|o| o.get(key))
        .filter(|v| !v.is_null())
}

/// The loop name of a pattern name from the effective configuration, or `None` when unknown. `options` is the
/// effective config, `{ effective }` around it, or the pattern map itself; `runner.patterns`, `patterns` and the
/// object itself are tried in that order.
pub fn loop_of(name: Option<&Value>, options: Option<&Value>) -> Option<String> {
    let name = name?.as_str().filter(|n| !n.is_empty())?;
    let options = options.filter(|o| !o.is_null())?;
    let effective = prop(options, "effective").unwrap_or(options);
    let patterns = prop(effective, "runner")
        .and_then(|runner| prop(runner, "patterns"))
        .or_else(|| prop(effective, "patterns"))
        .unwrap_or(effective);
    let entry = patterns.as_object()?.get(name)?;
    entry.get("loop")?.as_str().map(str::to_string)
}
