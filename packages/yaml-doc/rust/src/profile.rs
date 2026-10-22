//! The two parse profiles, enforced on the crate's own tree (spec section 4), never by a parser
//! setting. The rule table is data: `contracts/profiles.v1.json`, embedded at build time and read
//! once. The walk below looks a rule up and applies it; it holds no per-profile branch.
//!
//! Order of refusals (fixed, so output is deterministic): byte size, UTF-8 and depth by the
//! pre-scan, a syntax error by the parser, then this walk in document order, the first violation
//! wins. Alias tokens are counted here in document order, before any expansion; node and byte
//! bounds after expansion are `expand.rs`.

use std::collections::HashSet;
use std::sync::OnceLock;

use crate::backend::{CoreTag, Kind, Node, Style, TagKind, Tree};
use crate::comment::Hidden;
use crate::document::Ctx;
use crate::model::{rule, Limits, Profile, Refusal};

/// What a profile does about tags.
#[derive(Debug, Clone, Copy)]
enum TagRule {
    Refuse(&'static str),
    RefuseOutsideCore(&'static str),
}

/// What a profile does about anchors. Aliases follow: refused with the anchor, or bounded.
#[derive(Debug, Clone, Copy)]
enum AnchorRule {
    Refuse(&'static str),
    Bounded(&'static str),
}

/// Where a hidden-character rule applies.
#[derive(Debug, Clone, Copy)]
struct HiddenRule {
    rule: &'static str,
    keys_only: bool,
}

/// One profile's answer to every row of the table.
#[derive(Debug)]
pub(crate) struct Policy {
    duplicate_key: &'static str,
    tags: TagRule,
    anchors: AnchorRule,
    /// `<<` as a key: refused, or an ordinary key.
    merge_key: Option<&'static str>,
    multiple_documents: &'static str,
    complex_key: &'static str,
    /// A key that resolves to a non-string: refused, or stringified.
    non_string_key: Option<&'static str>,
    prototype_key: Option<&'static str>,
    bidi: Option<HiddenRule>,
    zero_width: Option<HiddenRule>,
    /// Integers past 2^53-1, `-0`, `.nan`, `.inf`: refused, or converted.
    number_edge: Option<&'static str>,
}

pub(crate) fn policy(profile: Profile) -> &'static Policy {
    static POLICIES: OnceLock<[Policy; 2]> = OnceLock::new();
    &POLICIES.get_or_init(|| Profile::ALL.map(Policy::from_contract))[profile as usize]
}

impl Policy {
    fn from_contract(profile: Profile) -> Policy {
        // Embedded at build time and checked by the fixture-shape test: a malformed table is a
        // build defect, never a runtime input.
        const MALFORMED: &str = "profiles.v1.json is malformed";
        let table: serde_json::Value =
            serde_json::from_str(include_str!("../../contracts/profiles.v1.json"))
                .expect(MALFORMED);
        let cell = |row: &str| -> (&str, Option<&'static str>) {
            let cell = &table["rows"][row][profile.name()];
            let action = cell["action"].as_str().expect(MALFORMED);
            let rule = cell["rule"].as_str().map(|id| {
                rule::ALL
                    .iter()
                    .copied()
                    .find(|r| *r == id)
                    .expect(MALFORMED)
            });
            (action, rule)
        };
        let refusal = |row: &str| cell(row).1.expect(MALFORMED);
        let optional = |row: &str| match cell(row) {
            ("refuse", rule) => rule,
            _ => None,
        };
        let hidden = |row: &str| match cell(row) {
            ("refuse", Some(rule)) => Some(HiddenRule {
                rule,
                keys_only: false,
            }),
            ("refuse-keys-only", Some(rule)) => Some(HiddenRule {
                rule,
                keys_only: true,
            }),
            _ => None,
        };
        Policy {
            duplicate_key: refusal("duplicate-key"),
            tags: match cell("tags") {
                ("refuse", Some(rule)) => TagRule::Refuse(rule),
                ("refuse-outside-core", Some(rule)) => TagRule::RefuseOutsideCore(rule),
                _ => panic!("{MALFORMED}"),
            },
            anchors: match cell("anchors-aliases") {
                ("refuse", Some(rule)) => AnchorRule::Refuse(rule),
                ("allow-bounded", Some(rule)) => AnchorRule::Bounded(rule),
                _ => panic!("{MALFORMED}"),
            },
            merge_key: optional("merge-key"),
            multiple_documents: refusal("multiple-documents"),
            complex_key: refusal("complex-keys"),
            non_string_key: optional("non-string-keys"),
            prototype_key: optional("prototype-keys"),
            bidi: hidden("bidi-controls"),
            zero_width: hidden("zero-width"),
            number_edge: optional("numbers-edge"),
        }
    }

    fn hidden(&self, kind: Hidden) -> Option<HiddenRule> {
        match kind {
            Hidden::Bidi => self.bidi,
            Hidden::ZeroWidth => self.zero_width,
        }
    }
}

// ---- scalar resolution: the YAML 1.2 core schema ----

/// What a scalar means. `BigInt` is an integer form outside +-(2^53-1); `tool` reads it as a float.
#[derive(Debug, Clone, Copy, PartialEq)]
pub(crate) enum Resolved {
    Null,
    Bool(bool),
    Int(i64),
    Float(f64),
    BigInt(f64),
    Str,
}

/// The largest integer a JavaScript number holds exactly.
const MAX_SAFE_INT: i64 = (1 << 53) - 1;

/// An explicit tag whose value or shape does not fit it (`!!int abc`).
pub(crate) struct TagMismatch;

/// Resolves a scalar: quoted and block styles are strings, a plain scalar follows the core schema,
/// and a core tag forces its own reading of the text.
pub(crate) fn resolve(
    text: &str,
    style: Style,
    tag: Option<TagKind>,
) -> Result<Resolved, TagMismatch> {
    let tag = match tag {
        None | Some(TagKind::Other) => {
            return Ok(if style == Style::Plain {
                resolve_plain(text)
            } else {
                Resolved::Str
            })
        }
        Some(TagKind::Core(tag)) => tag,
    };
    let plain = resolve_plain(text);
    match (tag, plain) {
        (CoreTag::Str, _) => Ok(Resolved::Str),
        (CoreTag::Null, Resolved::Null) => Ok(plain),
        (CoreTag::Bool, Resolved::Bool(_)) => Ok(plain),
        (CoreTag::Int, Resolved::Int(_) | Resolved::BigInt(_)) => Ok(plain),
        (CoreTag::Float, Resolved::Int(int)) => Ok(Resolved::Float(int as f64)),
        (CoreTag::Float, Resolved::Float(_) | Resolved::BigInt(_)) => Ok(plain),
        _ => Err(TagMismatch),
    }
}

fn resolve_plain(text: &str) -> Resolved {
    match text {
        "" | "~" | "null" | "Null" | "NULL" => return Resolved::Null,
        "true" | "True" | "TRUE" => return Resolved::Bool(true),
        "false" | "False" | "FALSE" => return Resolved::Bool(false),
        ".nan" | ".NaN" | ".NAN" => return Resolved::Float(f64::NAN),
        ".inf" | ".Inf" | ".INF" | "+.inf" | "+.Inf" | "+.INF" => {
            return Resolved::Float(f64::INFINITY)
        }
        "-.inf" | "-.Inf" | "-.INF" => return Resolved::Float(f64::NEG_INFINITY),
        _ => {}
    }
    let signed = text.strip_prefix(['-', '+']);
    let body = signed.unwrap_or(text);
    if !body.is_empty() && body.bytes().all(|b| b.is_ascii_digit()) {
        return match text.parse::<i64>() {
            Ok(0) if text.starts_with('-') => Resolved::Float(-0.0),
            Ok(int) => safe_int(int),
            Err(_) => Resolved::BigInt(text.parse::<f64>().unwrap_or(f64::INFINITY)),
        };
    }
    for (prefix, radix) in [("0x", 16), ("0o", 8)] {
        if let Some(digits) = text.strip_prefix(prefix) {
            if !digits.is_empty() && digits.chars().all(|c| c.is_digit(radix)) {
                return match i64::from_str_radix(digits, radix) {
                    Ok(int) => safe_int(int),
                    Err(_) => Resolved::BigInt(digits.chars().fold(0.0, |acc, c| {
                        acc * f64::from(radix) + f64::from(c.to_digit(radix).unwrap_or(0))
                    })),
                };
            }
        }
    }
    if is_float_form(body) {
        if let Ok(float) = text.parse::<f64>() {
            return Resolved::Float(float);
        }
    }
    Resolved::Str
}

fn safe_int(int: i64) -> Resolved {
    if int.unsigned_abs() <= MAX_SAFE_INT as u64 {
        Resolved::Int(int)
    } else {
        Resolved::BigInt(int as f64)
    }
}

/// `(\.[0-9]+ | [0-9]+(\.[0-9]*)?) ([eE][-+]?[0-9]+)?` with a dot or an exponent present.
fn is_float_form(body: &str) -> bool {
    let bytes = body.as_bytes();
    let digits = |from: usize| {
        bytes[from..]
            .iter()
            .take_while(|b| b.is_ascii_digit())
            .count()
    };
    let mut at = digits(0);
    let whole = at;
    let mut dotted = false;
    let mut fraction = 0;
    if bytes.get(at) == Some(&b'.') {
        dotted = true;
        fraction = digits(at + 1);
        at += 1 + fraction;
    }
    if whole == 0 && fraction == 0 {
        return false;
    }
    let mut exponent = false;
    if matches!(bytes.get(at), Some(b'e' | b'E')) {
        let sign = usize::from(matches!(bytes.get(at + 1), Some(b'-' | b'+')));
        let count = digits(at + 1 + sign);
        if count == 0 {
            return false;
        }
        exponent = true;
        at += 1 + sign + count;
    }
    at == bytes.len() && (dotted || exponent)
}

/// A key as the text it stands for: a number or boolean key becomes the string a JavaScript object
/// would hold, so `1` and `"1"` are one key.
pub(crate) fn key_text(resolved: Resolved, text: &str) -> String {
    match resolved {
        Resolved::Str => text.to_string(),
        Resolved::Null => "null".to_string(),
        Resolved::Bool(value) => value.to_string(),
        Resolved::Int(int) => int.to_string(),
        Resolved::Float(float) | Resolved::BigInt(float) => {
            if float.is_nan() {
                "NaN".to_string()
            } else if float.is_infinite() {
                if float > 0.0 { "Infinity" } else { "-Infinity" }.to_string()
            } else if float == 0.0 {
                "0".to_string()
            } else if float == float.trunc() && float.abs() < 1e21 {
                format!("{float:.0}")
            } else {
                float.to_string()
            }
        }
    }
}

/// The text of a key node and what it resolves to, following an alias to its target; `None` for a
/// collection (a complex key).
pub(crate) fn key_scalar(tree: &Tree, mut id: usize) -> Option<(&Node, &str, Resolved)> {
    if let Kind::Alias(target) = tree.nodes[id].kind {
        id = target;
    }
    let node = &tree.nodes[id];
    let Kind::Scalar { style, text } = &node.kind else {
        return None;
    };
    let resolved = resolve(text, *style, node.tag).unwrap_or(Resolved::Str);
    Some((node, text, resolved))
}

// ---- the walk ----

/// Checks every rule of the profile on the parsed tree, in document order.
pub(crate) fn check(
    tree: &Tree,
    policy: &Policy,
    limits: &Limits,
    ctx: &Ctx,
) -> Result<(), Refusal> {
    let mut walk = Walk {
        tree,
        policy,
        limits,
        ctx,
        aliases: 0,
    };
    for (index, doc) in tree.docs.iter().enumerate() {
        if index > 0 {
            return Err(ctx.refuse(policy.multiple_documents, doc.at));
        }
        if let Some(root) = doc.root {
            walk.node(root, 0)?;
        }
    }
    Ok(())
}

struct Walk<'a> {
    tree: &'a Tree,
    policy: &'a Policy,
    limits: &'a Limits,
    ctx: &'a Ctx<'a>,
    aliases: usize,
}

impl Walk<'_> {
    /// `depth` is the number of collections around `id`; the root collection is depth 1. The
    /// recursion is bounded by the profile's depth, which is checked before going down.
    fn node(&mut self, id: usize, depth: usize) -> Result<(), Refusal> {
        let node = &self.tree.nodes[id];
        self.properties(node)?;
        match &node.kind {
            Kind::Alias(_) => self.alias(node),
            Kind::Scalar { style, text } => self.value(node, *style, text),
            Kind::Seq(items) => {
                self.enter(node, depth + 1, CoreTag::Seq)?;
                items
                    .iter()
                    .try_for_each(|item| self.node(*item, depth + 1))
            }
            Kind::Map(entries) => {
                self.enter(node, depth + 1, CoreTag::Map)?;
                let mut seen = HashSet::with_capacity(entries.len());
                for (key, value) in entries {
                    self.key(*key, &mut seen)?;
                    self.node(*value, depth + 1)?;
                }
                Ok(())
            }
        }
    }

    fn enter(&self, node: &Node, depth: usize, shape: CoreTag) -> Result<(), Refusal> {
        if depth > self.limits.depth {
            return Err(self
                .ctx
                .refuse(rule::DEPTH_EXCEEDED, node.start)
                .with_detail(format!("limit is {} levels", self.limits.depth)));
        }
        match node.tag {
            Some(TagKind::Core(tag)) if tag != shape => Err(self.tag_mismatch(node)),
            _ => Ok(()),
        }
    }

    fn tag_mismatch(&self, node: &Node) -> Refusal {
        self.ctx
            .refuse(rule::SYNTAX_ERROR, node.tag_at)
            .with_detail("an explicit tag does not fit its value")
    }

    /// Tag and anchor of a node, the one written first in the source judged first.
    fn properties(&self, node: &Node) -> Result<(), Refusal> {
        let tag = node.tag.and_then(|tag| match (tag, self.policy.tags) {
            (_, TagRule::Refuse(rule)) | (TagKind::Other, TagRule::RefuseOutsideCore(rule)) => {
                Some((node.tag_at, rule))
            }
            _ => None,
        });
        let anchor = match (node.anchored, self.policy.anchors) {
            (true, AnchorRule::Refuse(rule)) => Some((node.anchor_at, rule)),
            _ => None,
        };
        match [tag, anchor]
            .into_iter()
            .flatten()
            .min_by_key(|(at, _)| *at)
        {
            Some((at, rule)) => Err(self.ctx.refuse(rule, at)),
            None => Ok(()),
        }
    }

    fn alias(&mut self, node: &Node) -> Result<(), Refusal> {
        match self.policy.anchors {
            AnchorRule::Refuse(_) => Err(self.ctx.refuse(rule::ALIAS_REFUSED, node.start)),
            AnchorRule::Bounded(rule) => {
                self.aliases += 1;
                let limit = self.limits.aliases.unwrap_or(usize::MAX);
                if self.aliases > limit {
                    return Err(self
                        .ctx
                        .refuse(rule, node.start)
                        .with_detail(format!("limit is {limit} aliases")));
                }
                Ok(())
            }
        }
    }

    /// A scalar in value position.
    fn value(&self, node: &Node, style: Style, text: &str) -> Result<(), Refusal> {
        if text.len() > self.limits.scalar_bytes {
            return Err(self
                .ctx
                .refuse(rule::SCALAR_TOO_LARGE, node.start)
                .with_detail(format!("limit is {} bytes", self.limits.scalar_bytes)));
        }
        self.hidden(node, text, false)?;
        let resolved = resolve(text, style, node.tag).map_err(|_| self.tag_mismatch(node))?;
        if let Some(rule) = self.policy.number_edge {
            let refusal = match resolved {
                Resolved::BigInt(_) => Some(rule),
                Resolved::Float(float) if float.is_nan() || float.is_infinite() => {
                    Some(rule::NON_FINITE_NUMBER)
                }
                Resolved::Float(float) if float == 0.0 && float.is_sign_negative() => Some(rule),
                _ => None,
            };
            if let Some(rule) = refusal {
                return Err(self.ctx.refuse(rule, node.start));
            }
        }
        Ok(())
    }

    /// Looks for a hidden character in the resolved text. It is pointed at where it sits in the
    /// source; a character that came from an escape has no place there, so the scalar start stands.
    fn hidden(&self, node: &Node, text: &str, is_key: bool) -> Result<(), Refusal> {
        let Some((ch, kind)) = text
            .chars()
            .find_map(|ch| Hidden::of(ch).map(|kind| (ch, kind)))
        else {
            return Ok(());
        };
        match self.policy.hidden(kind) {
            Some(rule) if !rule.keys_only || is_key => {
                let raw = self.ctx.src.get(node.start..node.end).unwrap_or("");
                let at = raw
                    .find(ch)
                    .map_or(node.start, |offset| node.start + offset);
                Err(self.ctx.refuse(rule.rule, at))
            }
            _ => Ok(()),
        }
    }

    fn key(&mut self, id: usize, seen: &mut HashSet<String>) -> Result<(), Refusal> {
        let node = &self.tree.nodes[id];
        self.properties(node)?;
        if matches!(node.kind, Kind::Alias(_)) {
            self.alias(node)?;
        }
        let Some((target, text, resolved)) = key_scalar(self.tree, id) else {
            return Err(self.ctx.refuse(self.policy.complex_key, node.start));
        };
        if text.len() > self.limits.key_bytes {
            return Err(self
                .ctx
                .refuse(rule::KEY_TOO_LARGE, node.start)
                .with_detail(format!("limit is {} bytes", self.limits.key_bytes)));
        }
        self.hidden(target, text, true)?;
        if let Some(rule) = self.policy.non_string_key {
            if resolved != Resolved::Str {
                return Err(self.ctx.refuse(rule, node.start));
            }
        }
        let key = key_text(resolved, text);
        if let Some(rule) = self.policy.prototype_key {
            if matches!(key.as_str(), "__proto__" | "constructor" | "prototype") {
                return Err(self.ctx.refuse(rule, node.start));
            }
        }
        if let Some(rule) = self.policy.merge_key {
            if key == "<<"
                && matches!(
                    target.kind,
                    Kind::Scalar {
                        style: Style::Plain,
                        ..
                    }
                )
            {
                return Err(self.ctx.refuse(rule, node.start));
            }
        }
        if !seen.insert(key) {
            return Err(self.ctx.refuse(self.policy.duplicate_key, node.start));
        }
        Ok(())
    }
}
