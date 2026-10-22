//! A parsed document: the source bytes unchanged, the semantic value, and the position of every
//! node (spec section 3). `parse` is the one entry; it runs the pre-scan, the parser adapter, the
//! profile walk and the expansion in that order, inside the panic guard.

use sha2::{Digest, Sha256};

use crate::backend::{self, Failure, Kind, Tree};
use crate::expand;
use crate::guard::guard;
use crate::model::{rule, Profile, Refusal, Segment, Span, Value};
use crate::prescan;
use crate::profile::{self, key_scalar, key_text};

/// Line starts of a text, to turn a byte offset into a 1-based line and column (a column counts
/// characters). A leading BOM is not part of the first line.
pub(crate) struct LineIndex {
    base: usize,
    starts: Vec<usize>,
}

impl LineIndex {
    fn new(text: &str, base: usize) -> LineIndex {
        let bytes = text.as_bytes();
        let mut starts = vec![base];
        let mut at = base;
        while at < bytes.len() {
            match bytes[at] {
                b'\n' => starts.push(at + 1),
                // A lone CR is a line break; CRLF is one break, closed by its LF.
                b'\r' if bytes.get(at + 1) != Some(&b'\n') => starts.push(at + 1),
                _ => {}
            }
            at += 1;
        }
        LineIndex { base, starts }
    }

    fn position(&self, text: &str, byte: usize) -> (u32, u32) {
        let byte = byte.clamp(self.base, text.len());
        let line = self.starts.partition_point(|start| *start <= byte) - 1;
        let from = self.starts[line];
        // `byte` is a character boundary for every offset this crate computes; stay safe anyway.
        let upto = (0..=byte)
            .rev()
            .find(|at| text.is_char_boundary(*at))
            .unwrap_or(0);
        let column = text.get(from..upto).map_or(0, |part| part.chars().count());
        (line as u32 + 1, column as u32 + 1)
    }
}

/// The text and the way to place a refusal in it.
pub(crate) struct Ctx<'a> {
    pub src: &'a str,
    lines: &'a LineIndex,
    file: &'a str,
}

impl Ctx<'_> {
    /// A refusal of `rule` at a byte offset of the source, naming the file.
    pub(crate) fn refuse(&self, rule: &'static str, byte: usize) -> Refusal {
        let (line, column) = self.lines.position(self.src, byte);
        Refusal::new(rule).with_file(self.file).at(line, column)
    }
}

/// Byte spans of a node's key (a mapping entry) and value.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct NodeSpans {
    pub key: Option<Span>,
    pub value: Span,
}

/// One YAML document under one profile.
#[derive(Debug)]
pub struct Document {
    pub(crate) text: String,
    profile: Profile,
    file: String,
    value: Value,
    pub(crate) tree: Tree,
    lines: LineIndex,
    revision: String,
}

impl std::fmt::Debug for LineIndex {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "LineIndex({} lines)", self.starts.len())
    }
}

/// Parses `bytes` under `profile`. `file` is the name refusals carry. Input that breaks a rule of
/// the profile is refused as a whole; no partial value is returned.
pub fn parse(bytes: &[u8], profile: Profile, file: &str) -> Result<Document, Refusal> {
    guard(|| parse_checked(bytes, profile, file)).map_err(|refusal| {
        if refusal.file.is_empty() {
            refusal.with_file(file)
        } else {
            refusal
        }
    })
}

fn parse_checked(bytes: &[u8], profile: Profile, file: &str) -> Result<Document, Refusal> {
    prescan::check(bytes, profile, file)?;
    // The pre-scan accepted these bytes as UTF-8.
    let text = String::from_utf8(bytes.to_vec())
        .map_err(|_| Refusal::new(rule::INVALID_UTF8).with_file(file))?;
    let base = if text.starts_with('\u{FEFF}') {
        '\u{FEFF}'.len_utf8()
    } else {
        0
    };
    let lines = LineIndex::new(&text, base);
    let limits = profile.limits();
    let ctx = Ctx {
        src: &text,
        lines: &lines,
        file,
    };
    let tree = backend::parse(&text, base, limits.key_bytes).map_err(|failure| match failure {
        Failure::Syntax { line, column } => Refusal::new(rule::SYNTAX_ERROR)
            .with_file(file)
            .at(line, column),
        Failure::KeyTooLarge { at } => ctx
            .refuse(rule::KEY_TOO_LARGE, at)
            .with_detail(format!("limit is {} bytes", limits.key_bytes)),
        Failure::Internal => Refusal::new(rule::YAML_INTERNAL_ERROR)
            .with_file(file)
            .with_detail("the parser produced an event order it never should"),
    })?;
    profile::check(&tree, profile::policy(profile), limits, &ctx)?;
    let value = expand::build(&tree, limits, &ctx)?;
    let revision: String = Sha256::digest(bytes)
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect();
    Ok(Document {
        text,
        profile,
        file: file.to_string(),
        value,
        tree,
        lines,
        revision,
    })
}

impl Document {
    /// The source bytes, exactly as given.
    pub fn source(&self) -> &[u8] {
        self.text.as_bytes()
    }

    pub fn profile(&self) -> Profile {
        self.profile
    }

    pub fn file(&self) -> &str {
        &self.file
    }

    /// The semantic value: the only view a caller should base decisions on.
    pub fn value(&self) -> &Value {
        &self.value
    }

    /// The sha256 of the source bytes as lowercase hex.
    pub fn revision(&self) -> &str {
        &self.revision
    }

    /// Where the node at `path` sits in the source. A path ends at the node as written: it does not
    /// continue through an alias, whose target sits where its anchor is.
    pub fn span_of(&self, path: &[Segment]) -> Option<NodeSpans> {
        let mut id = self.tree.docs.first()?.root?;
        let mut key = None;
        for segment in path {
            match (&self.tree.nodes[id].kind, segment) {
                (Kind::Map(entries), Segment::Key(wanted)) => {
                    let (key_id, value_id) = entries.iter().find(|(key_id, _)| {
                        key_scalar(&self.tree, *key_id)
                            .is_some_and(|(_, text, resolved)| key_text(resolved, text) == *wanted)
                    })?;
                    key = Some(self.span(*key_id));
                    id = *value_id;
                }
                (Kind::Seq(items), Segment::Index(index)) => {
                    id = *items.get(*index)?;
                    key = None;
                }
                _ => return None,
            }
        }
        Some(NodeSpans {
            key,
            value: self.span(id),
        })
    }

    fn span(&self, id: usize) -> Span {
        let node = &self.tree.nodes[id];
        let (line, column) = self.lines.position(&self.text, node.start);
        Span {
            start: node.start,
            end: node.end,
            line,
            column,
        }
    }

    /// The value as JSON, for callers that deserialize it into their own types. A mapping's keys
    /// come out sorted (JSON objects here do not keep order). A float with no JSON form (`.nan`,
    /// `.inf`; only the `tool` profile allows them) is refused.
    pub fn to_json(&self) -> Result<serde_json::Value, Refusal> {
        json_of(&self.value).map_err(|()| {
            Refusal::new(rule::NON_FINITE_NUMBER)
                .with_file(&self.file)
                .with_detail("a float with no JSON form")
        })
    }
}

fn json_of(value: &Value) -> Result<serde_json::Value, ()> {
    Ok(match value {
        Value::Null => serde_json::Value::Null,
        Value::Bool(b) => serde_json::Value::Bool(*b),
        Value::Int(i) => serde_json::Value::from(*i),
        Value::Float(f) => serde_json::Number::from_f64(*f)
            .map(serde_json::Value::Number)
            .ok_or(())?,
        Value::Str(s) => serde_json::Value::String(s.clone()),
        Value::Seq(items) => {
            serde_json::Value::Array(items.iter().map(json_of).collect::<Result<_, _>>()?)
        }
        Value::Map(entries) => serde_json::Value::Object(
            entries
                .iter()
                .map(|(key, value)| json_of(value).map(|json| (key.clone(), json)))
                .collect::<Result<_, _>>()?,
        ),
    })
}
