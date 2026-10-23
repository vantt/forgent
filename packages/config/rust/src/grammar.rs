//! Config's comment grammar on top of YAML Document's text guard (spec section 7): reasons, the
//! `@fgos:why` and `@fgos:doc` lines, the new-file header and the block of lines above a key. Pure
//! over text; applying the lines to a document belongs to the write transaction. Lists live in
//! `contracts/comment-grammar.v1.json`.
// `ConfigRefusal` is the crate's one refusal type and carries its whole location; boxing it is a crate-wide
// decision for its owner, not for this module.
#![allow(clippy::result_large_err)]

use std::sync::OnceLock;

use fgos_identity::WriterIdentity;
use fgos_yaml_doc::comment::sanitize;
use fgos_yaml_doc::Comments;
use serde_json::Value;

use crate::ConfigRefusal;

const REASON_REQUIRED: &str = "config-comment-reason-required";

fn contract() -> &'static Value {
    static CONTRACT: OnceLock<Value> = OnceLock::new();
    CONTRACT.get_or_init(|| {
        serde_json::from_str(include_str!("../../contracts/comment-grammar.v1.json"))
            .unwrap_or(Value::Null)
    })
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
            yaml: Some(yaml),
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

/// The `@fgos:doc` line of a schema node: its description, then allowed values or bounds, then the
/// standard value. A secret kind gets the description only. `None` without a description.
pub fn doc_line(node: &Value) -> Option<String> {
    let mut doc = node["description"]
        .as_str()?
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ");
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
            ends(&mut doc);
            let values: Vec<String> = values.iter().map(plain).collect();
            doc += &format!(" Values: {}.", values.join(" | "));
        }
        for (key, label) in [("minimum", "Minimum"), ("maximum", "Maximum")] {
            if !node[key].is_null() {
                ends(&mut doc);
                doc += &format!(" {label}: {}.", plain(&node[key]));
            }
        }
        if !node["default"].is_null() {
            ends(&mut doc);
            doc += &format!(" Default: {}.", plain(&node["default"]));
        }
    }
    Some(format!("{}{doc}", text("doc-prefix")))
}

/// What a person or tool reads above a key.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct Block {
    pub doc: Option<String>,
    /// `(actor, reason text)`.
    pub why: Option<(String, String)>,
    pub free: Vec<String>,
}

/// Only the exact ASCII prefixes are grammar; a malformed or repeated lookalike is a free note.
pub fn parse_block(comments: &Comments) -> Block {
    let mut block = Block::default();
    for line in &comments.above {
        let doc = line.starts_with(text("doc-prefix")).then_some(line);
        let why = line.strip_prefix(text("why-prefix")).and_then(|rest| {
            let (actor, reason) = rest.strip_prefix('[')?.split_once("] ")?;
            (!actor.is_empty() && !reason.trim().is_empty())
                .then(|| (actor.to_string(), reason.to_string()))
        });
        match (doc, why) {
            (Some(doc), _) if block.doc.is_none() => block.doc = Some(doc.clone()),
            (_, Some(why)) if block.why.is_none() => block.why = Some(why),
            _ => block.free.push(line.clone()),
        }
    }
    block
}

/// Lines above a key that is new: doc (when the schema describes it), then why.
pub fn block_for_new_key(node: &Value, actor: &Actor, reason: &Reason) -> Vec<String> {
    doc_line(node)
        .into_iter()
        .chain([why_line(actor, reason)])
        .collect()
}

/// Lines above a key whose value changed: the existing doc line and notes stay, the why is replaced.
pub fn block_for_changed_key(existing: &Comments, actor: &Actor, reason: &Reason) -> Vec<String> {
    let block = parse_block(existing);
    block
        .doc
        .into_iter()
        .chain([why_line(actor, reason)])
        .chain(block.free)
        .collect()
}
