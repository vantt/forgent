//! Config's comment grammar on top of YAML Document's text guard (spec section 7): reasons, the
//! `@fgos:why` and `@fgos:doc` lines, the new-file header and the block of lines above a key. Pure
//! over text; applying the lines to a document belongs to the write transaction. Lists live in
//! `contracts/comment-grammar.v1.json`.

use fgos_identity::WriterIdentity;
use fgos_yaml_doc::comment::sanitize;
use fgos_yaml_doc::Comments;
use serde_json::Value;

use crate::ConfigRefusal;

const REASON_REQUIRED: &str = "config-comment-reason-required";

fn contract() -> &'static Value {
    contract!("comment-grammar.v1.json")
}

fn text(key: &str) -> &'static str {
    contract()[key].as_str().unwrap_or_default()
}

fn list(key: &str) -> impl Iterator<Item = &'static str> {
    contract()[key]
        .as_array()
        .into_iter()
        .flatten()
        .filter_map(Value::as_str)
}

/// One validated, single-line reason.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Reason(String);

impl Reason {
    pub fn parse(raw: &str) -> Result<Reason, ConfigRefusal> {
        let reason = raw.trim();
        let breaks = list("line-break-codepoints")
            .filter_map(|hex| u32::from_str_radix(hex, 16).ok().and_then(char::from_u32));
        let breaks: Vec<char> = breaks.collect();
        let word = reason
            .trim_end_matches(|c: char| c.is_ascii_punctuation())
            .to_lowercase();
        let generic = !word.contains(char::is_whitespace)
            && list("generic-reason-words").any(|generic| generic == word);
        let forged = reason
            .trim_start_matches('#')
            .trim_start()
            .starts_with(text("forbidden-line-start"));
        if reason.is_empty() || generic || forged || reason.contains(breaks.as_slice()) {
            return Err(ConfigRefusal::new(REASON_REQUIRED));
        }
        // Hidden-text characters are refused by the Document guard; keep its refusal as the cause.
        sanitize(reason).map_err(|yaml| ConfigRefusal {
            yaml: Some(Box::new(yaml)),
            ..ConfigRefusal::new(REASON_REQUIRED)
        })?;
        Ok(Reason(reason.to_string()))
    }

    /// The reason of a value `init` or `doctor --fix` suggests: it names its source.
    pub fn suggested(source: &str) -> Result<Reason, ConfigRefusal> {
        let source = Reason::parse(source)?;
        Ok(Reason(format!(
            "{} {}",
            text("suggested-source-tag"),
            source.0
        )))
    }
}

impl Reason {
    /// The reason of a value carried over from a legacy file: it names the migration as its source.
    pub fn migrated(text: &str) -> Result<Reason, ConfigRefusal> {
        let text = Reason::parse(text)?;
        Ok(Reason(format!(
            "{} {}",
            self::text("migrated-source-tag"),
            text.0
        )))
    }
}

/// Whether a `@fgos:why` reason is the one a migration wrote (doctor lists these until a person replaces them).
pub fn is_migrated_reason(reason: &str) -> bool {
    reason.starts_with(text("migrated-source-tag"))
}

/// Who wrote a value: always the writer identity, never caller text.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Actor(String);

impl Actor {
    /// An id outside `[A-Za-z0-9._-]{1,200}` is written as `unknown`: provenance text must not
    /// fail a write, and the transaction result keeps the real id.
    pub fn from_writer(identity: &WriterIdentity) -> Actor {
        let id = identity.id.to_string();
        let max = contract()["actor"]["max-length"].as_u64().unwrap_or(200) as usize;
        let valid = !id.is_empty()
            && id.len() <= max
            && id
                .chars()
                .all(|c| c.is_ascii_alphanumeric() || "._-".contains(c));
        let fallback = contract()["actor"]["fallback"]
            .as_str()
            .unwrap_or("unknown");
        Actor(if valid { id } else { fallback.to_string() })
    }
}

pub fn header_lines(version: u32) -> Vec<String> {
    let mut lines: Vec<String> = list("header").map(str::to_string).collect();
    lines[0] = format!("@fgos:v{version}");
    lines
}

pub fn why_line(actor: &Actor, reason: &Reason) -> String {
    format!("{}[{}] {}", text("why-prefix"), actor.0, reason.0)
}

fn plain(value: &Value) -> String {
    value
        .as_str()
        .map_or_else(|| value.to_string(), str::to_string)
}

/// The `@fgos:doc` lines of a schema node, one per non-blank line of its description, in order. The
/// first line then carries the allowed values or bounds and the standard value, shown when it is a
/// scalar or a list of at most 120 characters (a map shows through its own keys, null is not shown).
/// A secret kind gets the description only. Empty without a description.
pub fn doc_lines(node: &Value, standard: Option<&Value>) -> Vec<String> {
    let mut lines = node["description"].as_str().into_iter().flat_map(|text| {
        text.lines()
            .map(|line| line.split_whitespace().collect::<Vec<_>>().join(" "))
            .filter(|line| !line.is_empty())
    });
    let Some(mut first) = lines.next() else {
        return Vec::new();
    };
    let secret = node["x-fgos-sensitivity"]
        .as_str()
        .is_some_and(|s| s.starts_with("secret-"));
    if !secret {
        let ends = |doc: &mut String| {
            if !doc.ends_with('.') {
                doc.push('.');
            }
        };
        if let Some(values) = node["enum"].as_array() {
            ends(&mut first);
            let values: Vec<String> = values.iter().map(plain).collect();
            first += &format!(" Values: {}.", values.join(" | "));
        }
        for (key, label) in [("minimum", "Minimum"), ("maximum", "Maximum")] {
            if !node[key].is_null() {
                ends(&mut first);
                first += &format!(" {label}: {}.", plain(&node[key]));
            }
        }
        let shown =
            standard.filter(|v| !v.is_null() && !v.is_object() && v.to_string().len() <= 120);
        if let Some(value) = shown {
            ends(&mut first);
            first += &format!(" Default: {}.", plain(value));
        }
    }
    let prefix = text("doc-prefix");
    std::iter::once(first)
        .chain(lines)
        .map(|line| format!("{prefix}{line}"))
        .collect()
}

/// Whether a comment line is written in the doc form.
pub(crate) fn is_doc_line(line: &str) -> bool {
    line.starts_with(text("doc-prefix"))
}

/// Whether a line starts the grammar (`@fgos:`): text carried from outside must never.
#[cfg(unix)]
pub(crate) fn is_grammar_line(line: &str) -> bool {
    line.starts_with(text("forbidden-line-start"))
}

/// What a person or tool reads above a key.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct Block {
    /// The run of `@fgos:doc` lines, in order.
    pub doc: Vec<String>,
    /// `(actor, reason text)`.
    pub why: Option<(String, String)>,
    pub free: Vec<String>,
}

/// Only the exact ASCII prefixes are grammar; a malformed or repeated lookalike is a free note. The
/// doc lines are the first unbroken run of `@fgos:doc` lines; a doc line after anything else is a
/// free note.
pub fn parse_block(comments: &Comments) -> Block {
    let mut block = Block::default();
    let mut run_open = true;
    for line in &comments.above {
        let is_doc = is_doc_line(line);
        let why = line.strip_prefix(text("why-prefix")).and_then(|rest| {
            let (actor, reason) = rest.strip_prefix('[')?.split_once("] ")?;
            (!actor.is_empty() && !reason.trim().is_empty())
                .then(|| (actor.to_string(), reason.to_string()))
        });
        if is_doc && run_open {
            block.doc.push(line.clone());
            continue;
        }
        run_open = run_open && block.doc.is_empty();
        match why {
            Some(why) if block.why.is_none() => block.why = Some(why),
            _ => block.free.push(line.clone()),
        }
    }
    block
}

/// Lines above a key that is new: doc (when the schema describes it), then why.
pub fn block_for_new_key(
    node: &Value,
    standard: Option<&Value>,
    actor: &Actor,
    reason: &Reason,
) -> Vec<String> {
    let mut lines = doc_lines(node, standard);
    lines.push(why_line(actor, reason));
    lines
}

/// Lines above a key whose value changed: the existing doc lines and notes stay, the why is replaced.
pub fn block_for_changed_key(existing: &Comments, actor: &Actor, reason: &Reason) -> Vec<String> {
    let block = parse_block(existing);
    block
        .doc
        .into_iter()
        .chain([why_line(actor, reason)])
        .chain(block.free)
        .collect()
}
