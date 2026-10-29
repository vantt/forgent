//! Value, span, profile and refusal types shared by every module.

use std::fmt;
use std::sync::OnceLock;

use crate::path::format_path;

/// The semantic view of a document. A mapping keeps source order; keys are always strings
/// (the `tool` profile stringifies scalar keys, `strict-config` refuses them).
#[derive(Debug, Clone, PartialEq)]
pub enum Value {
    Null,
    Bool(bool),
    Int(i64),
    Float(f64),
    Str(String),
    Seq(Vec<Value>),
    Map(Vec<(String, Value)>),
}

impl Value {
    /// Builds a value from JSON. A JSON number that is not an `i64` becomes a float.
    pub fn from_json(json: &serde_json::Value) -> Value {
        match json {
            serde_json::Value::Null => Value::Null,
            serde_json::Value::Bool(b) => Value::Bool(*b),
            serde_json::Value::Number(n) => match n.as_i64() {
                Some(i) => Value::Int(i),
                None => Value::Float(n.as_f64().unwrap_or(f64::NAN)),
            },
            serde_json::Value::String(s) => Value::Str(s.clone()),
            serde_json::Value::Array(items) => {
                Value::Seq(items.iter().map(Value::from_json).collect())
            }
            serde_json::Value::Object(map) => Value::Map(
                map.iter()
                    .map(|(k, v)| (k.clone(), Value::from_json(v)))
                    .collect(),
            ),
        }
    }

    /// JSON view of a value. A non-finite float has no JSON form and becomes null.
    pub fn to_json(&self) -> serde_json::Value {
        self.json(false).unwrap_or_default()
    }

    /// The one walk from a value to JSON. With `refuse_non_finite` a float with no JSON form is
    /// an error; without it the float becomes null and the walk cannot fail.
    pub(crate) fn json(&self, refuse_non_finite: bool) -> Result<serde_json::Value, ()> {
        Ok(match self {
            Value::Null => serde_json::Value::Null,
            Value::Bool(b) => serde_json::Value::Bool(*b),
            Value::Int(i) => serde_json::Value::from(*i),
            Value::Float(f) => match serde_json::Number::from_f64(*f) {
                Some(number) => serde_json::Value::Number(number),
                None if refuse_non_finite => return Err(()),
                None => serde_json::Value::Null,
            },
            Value::Str(s) => serde_json::Value::String(s.clone()),
            Value::Seq(items) => serde_json::Value::Array(
                items
                    .iter()
                    .map(|item| item.json(refuse_non_finite))
                    .collect::<Result<_, _>>()?,
            ),
            Value::Map(entries) => serde_json::Value::Object(
                entries
                    .iter()
                    .map(|(key, value)| {
                        value
                            .json(refuse_non_finite)
                            .map(|json| (key.clone(), json))
                    })
                    .collect::<Result<_, _>>()?,
            ),
        })
    }
}

/// One step of a path: a mapping key (any string) or a sequence index.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum Segment {
    Key(String),
    Index(usize),
}

/// Byte span of a node in the source, with the line and column (both 1-based) where it starts.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Span {
    pub start: usize,
    pub end: usize,
    pub line: u32,
    pub column: u32,
}

/// The two parse profiles of the spec (section 4).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Profile {
    StrictConfig,
    Tool,
}

impl Profile {
    pub const ALL: [Profile; 2] = [Profile::StrictConfig, Profile::Tool];

    /// Name used in the contract files.
    pub fn name(self) -> &'static str {
        match self {
            Profile::StrictConfig => "strict-config",
            Profile::Tool => "tool",
        }
    }

    pub fn from_name(name: &str) -> Option<Profile> {
        Profile::ALL.into_iter().find(|p| p.name() == name)
    }

    /// The bounds of this profile, read once from `contracts/limits.v1.json`.
    pub fn limits(self) -> &'static Limits {
        static LIMITS: OnceLock<[Limits; 2]> = OnceLock::new();
        &LIMITS.get_or_init(|| Profile::ALL.map(Limits::from_contract))[self as usize]
    }
}

/// Bounds of one profile (spec section 8). `None` means the bound does not apply.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Limits {
    pub input_bytes: usize,
    pub depth: usize,
    pub nodes: usize,
    pub scalar_bytes: usize,
    pub expanded_bytes: Option<usize>,
    pub key_bytes: usize,
    pub aliases: Option<usize>,
}

impl Limits {
    fn from_contract(profile: Profile) -> Limits {
        // The file is embedded at build time and checked by the fixture-shape test, so a
        // malformed contract is a build defect, never a runtime input.
        const MALFORMED: &str = "limits.v1.json is malformed";
        let doc: serde_json::Value =
            serde_json::from_str(include_str!("../../contracts/limits.v1.json")).expect(MALFORMED);
        let row = &doc["profiles"][profile.name()];
        let required = |key: &str| row[key].as_u64().expect(MALFORMED) as usize;
        let optional = |key: &str| row[key].as_u64().map(|n| n as usize);
        Limits {
            input_bytes: required("input_bytes"),
            depth: required("depth"),
            nodes: required("nodes"),
            scalar_bytes: required("scalar_bytes"),
            expanded_bytes: optional("expanded_bytes"),
            key_bytes: required("key_bytes"),
            aliases: optional("aliases"),
        }
    }
}

/// Refusal rule ids: the closed list of `contracts/refusal-rules.v1.json`.
pub mod rule {
    pub const DUPLICATE_KEY: &str = "duplicate-key";
    pub const TAG_REFUSED: &str = "tag-refused";
    pub const UNKNOWN_TAG: &str = "unknown-tag";
    pub const ANCHOR_REFUSED: &str = "anchor-refused";
    pub const ALIAS_REFUSED: &str = "alias-refused";
    pub const ALIAS_LIMIT: &str = "alias-limit";
    pub const MERGE_KEY_REFUSED: &str = "merge-key-refused";
    pub const MULTIPLE_DOCUMENTS: &str = "multiple-documents";
    pub const COMPLEX_KEY: &str = "complex-key";
    pub const NON_STRING_KEY: &str = "non-string-key";
    pub const PROTOTYPE_KEY: &str = "prototype-key";
    pub const BIDI_CONTROL: &str = "bidi-control";
    pub const ZERO_WIDTH: &str = "zero-width";
    pub const NUMBER_OUT_OF_RANGE: &str = "number-out-of-range";
    pub const NON_FINITE_NUMBER: &str = "non-finite-number";
    pub const INPUT_TOO_LARGE: &str = "input-too-large";
    pub const INVALID_UTF8: &str = "invalid-utf8";
    pub const DEPTH_EXCEEDED: &str = "depth-exceeded";
    pub const NODE_LIMIT: &str = "node-limit";
    pub const SCALAR_TOO_LARGE: &str = "scalar-too-large";
    pub const KEY_TOO_LARGE: &str = "key-too-large";
    pub const EXPANDED_TOO_LARGE: &str = "expanded-too-large";
    pub const SYNTAX_ERROR: &str = "syntax-error";
    pub const COMMENT_WOULD_BE_LOST: &str = "comment-would-be-lost";
    pub const INLINE_COMMENT_MULTILINE: &str = "inline-comment-multiline";
    pub const INLINE_COMMENT_EMPTY: &str = "inline-comment-empty";
    pub const EDIT_CHANGED_MEANING: &str = "edit-changed-meaning";
    pub const PATH_NOT_FOUND: &str = "path-not-found";
    pub const INLINE_COMMENT_UNPLACEABLE: &str = "inline-comment-unplaceable";
    pub const MERGE_TYPE_MISMATCH: &str = "merge-type-mismatch";
    pub const INVALID_PATH: &str = "invalid-path";
    pub const YAML_INTERNAL_ERROR: &str = "yaml-internal-error";

    /// Every rule id, in the order of the contract file.
    pub const ALL: [&str; 32] = [
        DUPLICATE_KEY,
        TAG_REFUSED,
        UNKNOWN_TAG,
        ANCHOR_REFUSED,
        ALIAS_REFUSED,
        ALIAS_LIMIT,
        MERGE_KEY_REFUSED,
        MULTIPLE_DOCUMENTS,
        COMPLEX_KEY,
        NON_STRING_KEY,
        PROTOTYPE_KEY,
        BIDI_CONTROL,
        ZERO_WIDTH,
        NUMBER_OUT_OF_RANGE,
        NON_FINITE_NUMBER,
        INPUT_TOO_LARGE,
        INVALID_UTF8,
        DEPTH_EXCEEDED,
        NODE_LIMIT,
        SCALAR_TOO_LARGE,
        KEY_TOO_LARGE,
        EXPANDED_TOO_LARGE,
        SYNTAX_ERROR,
        COMMENT_WOULD_BE_LOST,
        INLINE_COMMENT_MULTILINE,
        INLINE_COMMENT_EMPTY,
        EDIT_CHANGED_MEANING,
        PATH_NOT_FOUND,
        INLINE_COMMENT_UNPLACEABLE,
        MERGE_TYPE_MISMATCH,
        INVALID_PATH,
        YAML_INTERNAL_ERROR,
    ];
}

/// A refusal names the rule, the file the caller passed, the path and the position (line and
/// column, both 1-based). It never carries a scalar value or a snippet of the source, so a secret
/// on a malformed line cannot reach a log through it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Refusal {
    pub rule: &'static str,
    /// File name as the caller passed it; empty when the refusing function does not know it.
    pub file: String,
    pub path: Vec<Segment>,
    pub line: Option<u32>,
    pub column: Option<u32>,
    /// Fixed, value-free wording (limit sizes, layer numbers), never text taken from the input.
    pub detail: Option<String>,
}

impl Refusal {
    pub fn new(rule: &'static str) -> Refusal {
        Refusal {
            rule,
            file: String::new(),
            path: Vec::new(),
            line: None,
            column: None,
            detail: None,
        }
    }

    pub fn with_file(mut self, file: &str) -> Refusal {
        self.file = file.to_string();
        self
    }

    pub fn with_path(mut self, path: &[Segment]) -> Refusal {
        self.path = path.to_vec();
        self
    }

    pub fn at(mut self, line: u32, column: u32) -> Refusal {
        self.line = Some(line);
        self.column = Some(column);
        self
    }

    pub fn with_detail(mut self, detail: impl Into<String>) -> Refusal {
        self.detail = Some(detail.into());
        self
    }
}

impl fmt::Display for Refusal {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        if !self.file.is_empty() {
            write!(f, "{}: ", self.file)?;
        }
        write!(f, "{}", self.rule)?;
        if !self.path.is_empty() {
            write!(f, " at {}", format_path(&self.path))?;
        }
        if let (Some(line), Some(column)) = (self.line, self.column) {
            write!(f, " (line {line}, column {column})")?;
        }
        if let Some(detail) = &self.detail {
            write!(f, ": {detail}")?;
        }
        Ok(())
    }
}

impl std::error::Error for Refusal {}
