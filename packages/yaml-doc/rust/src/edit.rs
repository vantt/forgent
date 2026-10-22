//! Surgical edits on a parsed document (spec sections 5 and 6): every operation computes one
//! byte splice from the node spans and the line structure of the source, applies it to a copy,
//! parses the copy again under the same profile and replaces the document only when the result
//! means exactly the intended change. A refusal leaves the document as it was, byte for byte.
//!
//! New content follows the file: the indentation unit, the line ending and the quoting style
//! already in use. A `set` that has to turn a flow collection or a block scalar into something else
//! rewrites that node in the document's block style (spec section 13); a note inside a node an
//! edit would rewrite is never dropped silently (`comment-would-be-lost`).

use crate::backend::{Kind, Node, Style};
use crate::comment::{sanitize, sanitize_inline};
use crate::document::{parse, Document};
use crate::guard::guard;
use crate::model::{rule, Refusal, Segment, Value};
use crate::profile::{resolve, Resolved};

/// Where `insert` puts the new entry.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Position<'a> {
    /// After the last entry of the mapping.
    End,
    /// Right after the named sibling entry.
    After(&'a str),
}

/// Whether an edit may drop a note: `set`, `insert` and `remove` all take it.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CommentLoss {
    /// A note the edit would drop makes it a `comment-would-be-lost` refusal.
    Refuse,
    /// The caller has decided the note goes with the node.
    Acknowledge,
}

/// The notes on a node, as text without the `#`.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct Comments {
    /// The contiguous comment lines directly above the node, top to bottom.
    pub above: Vec<String>,
    /// The comment after the node on its line.
    pub inline: Option<String>,
}

// ---- the public operations ----

impl Document {
    /// The document after every edit.
    pub fn to_bytes(&self) -> Vec<u8> {
        self.text.as_bytes().to_vec()
    }

    /// Replaces the node at `path` with `value`, creating missing parents as block mappings. A
    /// scalar replacing a scalar changes only the scalar's bytes (quoting style and inline comment
    /// stay); an empty path replaces the whole document. A note inside a node the edit has to
    /// rewrite makes it refuse `comment-would-be-lost` unless `ack` is `Acknowledge`.
    pub fn set(&mut self, path: &[Segment], value: Value, ack: CommentLoss) -> Result<(), Refusal> {
        guard(|| self.set_inner(path, value, ack))
    }

    /// Adds `key: value` to the mapping at `mapping_path` (the empty path is the document root).
    /// Refuses `comment-would-be-lost` like `set` when the mapping is a flow collection holding a
    /// note that the rewrite would drop.
    pub fn insert(
        &mut self,
        mapping_path: &[Segment],
        key: &str,
        value: Value,
        position: Position<'_>,
        ack: CommentLoss,
    ) -> Result<(), Refusal> {
        guard(|| self.insert_inner(mapping_path, key, value, position, ack))
    }

    /// Deletes the entry or sequence item at `path`, with its line. A note on the node (above it
    /// or on its lines) makes this refuse unless `ack` is `Acknowledge`.
    pub fn remove(&mut self, path: &[Segment], ack: CommentLoss) -> Result<(), Refusal> {
        guard(|| self.remove_inner(path, ack))
    }

    /// Replaces the comment lines directly above the node (no blank line between) with `lines`;
    /// an element holding a line break becomes several comment lines. No lines delete the block.
    pub fn set_comment_block(&mut self, path: &[Segment], lines: &[String]) -> Result<(), Refusal> {
        guard(|| self.set_comment_block_inner(path, lines))
    }

    /// Replaces the comment after the node on its line; `None` removes it, empty text is refused
    /// `inline-comment-empty`. A node whose last line is not a line of its own (block scalar,
    /// multi-line value, item of a flow collection with more on the line) is refused
    /// `inline-comment-unplaceable`.
    pub fn set_inline_comment(
        &mut self,
        path: &[Segment],
        text: Option<&str>,
    ) -> Result<(), Refusal> {
        guard(|| self.set_inline_comment_inner(path, text))
    }

    /// The comment lines above the node and the comment on its line, as text without the `#`.
    pub fn comments_at(&self, path: &[Segment]) -> Result<Comments, Refusal> {
        guard(|| self.comments_at_inner(path))
    }
}

impl Document {
    fn set_inner(
        &mut self,
        path: &[Segment],
        value: Value,
        ack: CommentLoss,
    ) -> Result<(), Refusal> {
        let allow_loss = ack == CommentLoss::Acknowledge;
        self.check_value(&value, path)?;
        let (chain, matched) = self.locate(path);
        let mut expected = self.value().clone();
        if matched == path.len() && !chain.is_empty() {
            apply_set(&mut expected, path, value.clone()).map_err(|()| self.not_found(path))?;
            let splice = self.plan_set_existing(&chain, path, &value, allow_loss)?;
            return self.commit(splice, expected);
        }
        apply_set(&mut expected, path, value.clone()).map_err(|()| self.not_found(path))?;
        // Some of the path does not exist: the new content goes below the deepest node that does.
        let rest = &path[matched..];
        let Some(nested) = nested_map(rest, value.clone()) else {
            return Err(self.not_found(path));
        };
        let Value::Map(mut entries) = nested else {
            return Err(self.not_found(path));
        };
        let (key, below) = entries.remove(0);
        let splice = if chain.is_empty() {
            self.plan_append_root(&key, &below)
        } else if let Some(index) = self.flow_index(&chain) {
            let mut rewritten = value_at(self.value(), &path[..index])
                .cloned()
                .ok_or_else(|| self.not_found(path))?;
            apply_set(&mut rewritten, &path[index..], value).map_err(|()| self.not_found(path))?;
            self.plan_replace(&chain[..=index], &rewritten, allow_loss, &path[..index])?
        } else {
            // Cannot fail: the chain is never empty here (every caller has taken it from `full_chain`,
            // or checked `chain.is_empty()`, or checked `chain.len() >= 2` for the parent).
            let at = chain[chain.len() - 1];
            let parent_path = &path[..matched];
            match &self.node(at.id).kind {
                Kind::Map(_) => {
                    self.plan_insert(&chain, parent_path, &key, &below, Position::End)?
                }
                Kind::Scalar { .. } if self.is_empty_null(at.id) => {
                    let filled = Value::Map(vec![(key, below)]);
                    self.plan_replace(&chain, &filled, allow_loss, parent_path)?
                }
                _ => return Err(self.not_found(path)),
            }
        };
        self.commit(splice, expected)
    }

    fn plan_set_existing(
        &self,
        chain: &[Step],
        path: &[Segment],
        value: &Value,
        allow_loss: bool,
    ) -> Result<Splice, Refusal> {
        // Cannot fail: the chain is never empty here (every caller has taken it from `full_chain`,
        // or checked `chain.is_empty()`, or checked `chain.len() >= 2` for the parent).
        let target = chain[chain.len() - 1];
        match self.flow_index(chain) {
            Some(index) if index + 1 < chain.len() => {
                if !is_collection(value) && self.is_plain_leaf(target.id) {
                    return Ok(self.plan_scalar_in_flow(chain, value));
                }
                let mut rewritten = value_at(self.value(), &path[..index])
                    .cloned()
                    .ok_or_else(|| self.not_found(path))?;
                apply_set(&mut rewritten, &path[index..], value.clone())
                    .map_err(|()| self.not_found(path))?;
                self.plan_replace(&chain[..=index], &rewritten, allow_loss, &path[..index])
            }
            _ => self.plan_replace(chain, value, allow_loss, path),
        }
    }

    fn insert_inner(
        &mut self,
        mapping_path: &[Segment],
        key: &str,
        value: Value,
        position: Position<'_>,
        ack: CommentLoss,
    ) -> Result<(), Refusal> {
        let allow_loss = ack == CommentLoss::Acknowledge;
        self.check_value(&value, mapping_path)?;
        let (chain, matched) = self.locate(mapping_path);
        let mut expected = self.value().clone();
        apply_insert(&mut expected, mapping_path, key, value.clone(), position)
            .map_err(|()| self.not_found(mapping_path))?;
        if chain.is_empty() {
            if matched != mapping_path.len() || !mapping_path.is_empty() {
                return Err(self.not_found(mapping_path));
            }
            let splice = self.plan_append_root(key, &value);
            return self.commit(splice, expected);
        }
        if matched != mapping_path.len() {
            return Err(self.not_found(mapping_path));
        }
        // Cannot fail: the chain is never empty here (every caller has taken it from `full_chain`,
        // or checked `chain.is_empty()`, or checked `chain.len() >= 2` for the parent).
        let at = chain[chain.len() - 1];
        let splice = match (&self.node(at.id).kind, self.flow_index(&chain)) {
            (_, Some(index)) => {
                let mut rewritten = value_at(self.value(), &mapping_path[..index])
                    .cloned()
                    .ok_or_else(|| self.not_found(mapping_path))?;
                apply_insert(&mut rewritten, &mapping_path[index..], key, value, position)
                    .map_err(|()| self.not_found(mapping_path))?;
                self.plan_replace(
                    &chain[..=index],
                    &rewritten,
                    allow_loss,
                    &mapping_path[..index],
                )?
            }
            (Kind::Map(_), None) => {
                self.plan_insert(&chain, mapping_path, key, &value, position)?
            }
            (Kind::Scalar { .. }, None) if self.is_empty_null(at.id) => {
                let filled = Value::Map(vec![(key.to_string(), value)]);
                self.plan_replace(&chain, &filled, allow_loss, mapping_path)?
            }
            _ => return Err(self.not_found(mapping_path)),
        };
        self.commit(splice, expected)
    }

    fn remove_inner(&mut self, path: &[Segment], ack: CommentLoss) -> Result<(), Refusal> {
        let chain = self.full_chain(path)?;
        if chain.len() < 2 {
            return Err(Refusal::new(rule::INVALID_PATH)
                .with_file(self.file())
                .with_detail("the document root cannot be removed"));
        }
        let mut expected = self.value().clone();
        apply_remove(&mut expected, path).map_err(|()| self.not_found(path))?;
        let allow_loss = ack == CommentLoss::Acknowledge;
        // Cannot fail: the chain is never empty here (every caller has taken it from `full_chain`,
        // or checked `chain.is_empty()`, or checked `chain.len() >= 2` for the parent).
        let parent = chain[chain.len() - 2];
        // Cannot fail: the chain is never empty here (every caller has taken it from `full_chain`,
        // or checked `chain.is_empty()`, or checked `chain.len() >= 2` for the parent).
        let target = chain[chain.len() - 1];
        let splice = if let Some(index) = self.flow_index(&chain).filter(|i| i + 1 < chain.len()) {
            let mut rewritten = value_at(self.value(), &path[..index])
                .cloned()
                .ok_or_else(|| self.not_found(path))?;
            apply_remove(&mut rewritten, &path[index..]).map_err(|()| self.not_found(path))?;
            self.plan_replace(&chain[..=index], &rewritten, allow_loss, &path[..index])?
        } else if self.child_count(parent.id) == 1 && chain.len() > 2 {
            // The last child goes: the parent stays as an empty collection.
            let emptied = if target.in_seq {
                Value::Seq(Vec::new())
            } else {
                Value::Map(Vec::new())
            };
            self.plan_replace(
                &chain[..chain.len() - 1],
                &emptied,
                allow_loss,
                &path[..path.len() - 1],
            )?
        } else {
            self.plan_remove_lines(&chain, path, allow_loss)?
        };
        self.commit(splice, expected)
    }

    fn set_comment_block_inner(
        &mut self,
        path: &[Segment],
        lines: &[String],
    ) -> Result<(), Refusal> {
        let mut written = Vec::new();
        for line in lines {
            written.extend(sanitize(line).map_err(|r| r.with_file(self.file()))?);
        }
        let chain = self.full_chain(path)?;
        let src = self.src();
        let first = self
            .entry_first_line(&chain)
            .ok_or_else(|| self.layout_refusal(path))?;
        let above = self.comment_block_start(first);
        let indent = src.indent_of(first);
        let eol = self.layout().eol;
        let text: String = written
            .iter()
            .map(|line| format!("{indent}{line}{eol}"))
            .collect();
        let splice = Splice {
            start: above,
            end: first,
            text,
        };
        let expected = self.value().clone();
        self.commit(splice, expected)
    }

    fn set_inline_comment_inner(
        &mut self,
        path: &[Segment],
        text: Option<&str>,
    ) -> Result<(), Refusal> {
        let token = match text {
            None => None,
            Some("") => return Err(Refusal::new(rule::INLINE_COMMENT_EMPTY).with_file(self.file())),
            Some(text) => Some(sanitize_inline(text).map_err(|r| r.with_file(self.file()))?),
        };
        let chain = self.full_chain(path)?;
        let Some((tail_start, line_end)) = self.inline_slot(&chain) else {
            return Err(self.refuse_at(rule::INLINE_COMMENT_UNPLACEABLE, path));
        };
        let src = self.src();
        let existing = src.tail_comment(tail_start, line_end);
        let splice = match (existing, token) {
            (Some((at, _)), Some(token)) => Splice {
                start: at,
                end: line_end,
                text: token,
            },
            (Some(_), None) => Splice {
                start: tail_start,
                end: line_end,
                text: String::new(),
            },
            (None, Some(token)) => Splice {
                start: tail_start,
                end: line_end,
                text: format!("  {token}"),
            },
            (None, None) => return Ok(()),
        };
        let expected = self.value().clone();
        self.commit(splice, expected)
    }

    fn comments_at_inner(&self, path: &[Segment]) -> Result<Comments, Refusal> {
        let chain = self.full_chain(path)?;
        let src = self.src();
        let first = self
            .entry_first_line(&chain)
            .ok_or_else(|| self.layout_refusal(path))?;
        let above_start = self.comment_block_start(first);
        let above = src.text[above_start..first]
            .lines()
            .map(|line| comment_body(line.trim()))
            .collect();
        // Cannot fail: the chain is never empty here (every caller has taken it from `full_chain`,
        // or checked `chain.is_empty()`, or checked `chain.len() >= 2` for the parent).
        let target = self.node(chain[chain.len() - 1].id);
        let inline = if matches!(
            target.kind,
            Kind::Scalar {
                style: Style::Literal | Style::Folded,
                ..
            }
        ) {
            self.block_header_comment(target)
        } else {
            self.inline_slot(&chain)
                .and_then(|(from, to)| src.tail_comment(from, to))
        }
        .map(|(at, to)| comment_body(src.text[at..to].trim_end()));
        Ok(Comments { above, inline })
    }
}

// ---- the splice and the re-parse check ----

/// Bytes `start..end` of the source become `text`; nothing else changes.
struct Splice {
    start: usize,
    end: usize,
    text: String,
}

impl Document {
    /// Applies the splice to a copy, parses the copy, and replaces `self` only when the result is
    /// valid under the profile and its value is exactly `expected`.
    fn commit(&mut self, splice: Splice, expected: Value) -> Result<(), Refusal> {
        let old = &self.text;
        let (start, end) = (splice.start, splice.end);
        if start > end
            || end > old.len()
            || !old.is_char_boundary(start)
            || !old.is_char_boundary(end)
        {
            return Err(Refusal::new(rule::YAML_INTERNAL_ERROR)
                .with_file(self.file())
                .with_detail("an edit computed a byte range that is not on character boundaries"));
        }
        let mut bytes = Vec::with_capacity(old.len() - (end - start) + splice.text.len());
        bytes.extend_from_slice(&old.as_bytes()[..start]);
        bytes.extend_from_slice(splice.text.as_bytes());
        bytes.extend_from_slice(&old.as_bytes()[end..]);
        let next = match parse(&bytes, self.profile(), self.file()) {
            Ok(next) => next,
            Err(refusal) if refusal.rule == rule::SYNTAX_ERROR => {
                return Err(Refusal::new(rule::EDIT_CHANGED_MEANING)
                    .with_file(self.file())
                    .with_detail("the result no longer parses"))
            }
            Err(refusal) => return Err(refusal),
        };
        if !same_value(next.value(), &expected) {
            return Err(Refusal::new(rule::EDIT_CHANGED_MEANING)
                .with_file(self.file())
                .with_detail("the result does not mean the intended change"));
        }
        *self = next;
        Ok(())
    }
}

// ---- reading the tree and the source ----

/// One node on the way from the root to a target, with the key node that names it in a mapping.
#[derive(Debug, Clone, Copy)]
struct Step {
    id: usize,
    key: Option<usize>,
    in_seq: bool,
}

/// The source text with its line structure. `base` skips a leading byte-order mark.
#[derive(Clone, Copy)]
struct Src<'a> {
    text: &'a str,
    base: usize,
}

impl<'a> Src<'a> {
    fn bytes(&self) -> &'a [u8] {
        self.text.as_bytes()
    }

    fn line_start(&self, pos: usize) -> usize {
        self.bytes()[..pos]
            .iter()
            .rposition(|b| *b == b'\n')
            .map_or(self.base, |i| i + 1)
            .max(self.base)
    }

    /// The end of the line text: before its CR LF or LF, or the end of the source.
    fn line_end(&self, pos: usize) -> usize {
        match self.bytes()[pos..].iter().position(|b| *b == b'\n') {
            Some(i) => {
                let at = pos + i;
                if at > pos && self.bytes()[at - 1] == b'\r' {
                    at - 1
                } else {
                    at
                }
            }
            None => self.text.len(),
        }
    }

    /// The start of the line after the one holding `pos`, if there is one.
    fn next_line_start(&self, pos: usize) -> Option<usize> {
        self.bytes()[pos..]
            .iter()
            .position(|b| *b == b'\n')
            .map(|i| pos + i + 1)
    }

    /// The end of the line a span ending at `end` ends on.
    fn last_line_end(&self, end: usize) -> usize {
        if end > self.base && self.bytes()[end - 1] == b'\n' {
            self.line_end(end - 1)
        } else {
            self.line_end(end)
        }
    }

    /// The whitespace the line starting at `line_start` begins with.
    fn indent_of(&self, line_start: usize) -> &'a str {
        let rest = &self.text[line_start..];
        let width = rest.len() - rest.trim_start_matches([' ', '\t']).len();
        &rest[..width]
    }

    /// The comment on the rest of a line, if `from..to` holds only blanks and then a comment.
    fn tail_comment(&self, from: usize, to: usize) -> Option<(usize, usize)> {
        let tail = &self.text[from..to];
        let trimmed = tail.trim_start_matches([' ', '\t']);
        if !trimmed.starts_with('#') {
            return None;
        }
        let at = from + (tail.len() - trimmed.len());
        Some((at, at + trimmed.trim_end().len()))
    }

    fn is_blank_or_comment(&self, from: usize, to: usize) -> bool {
        let tail = self.text[from..to].trim_start_matches([' ', '\t']);
        tail.is_empty() || tail.starts_with('#')
    }

    fn col(&self, pos: usize) -> usize {
        pos - self.line_start(pos)
    }
}

fn comment_body(comment: &str) -> String {
    let body = comment.strip_prefix('#').unwrap_or(comment);
    body.strip_prefix(' ')
        .unwrap_or(body)
        .trim_end()
        .to_string()
}

/// Where the node's text starts, its tag and anchor included (they are only read back from the
/// source when the node has one).
fn first_pos(node: &Node) -> usize {
    if node.tag.is_some() || node.anchored {
        node.start.min(node.tag_at).min(node.anchor_at)
    } else {
        node.start
    }
}

fn is_collection(value: &Value) -> bool {
    matches!(value, Value::Seq(_) | Value::Map(_))
}

impl Document {
    fn src(&self) -> Src<'_> {
        Src {
            text: &self.text,
            base: if self.text.starts_with('\u{FEFF}') {
                3
            } else {
                0
            },
        }
    }

    fn node(&self, id: usize) -> &Node {
        &self.tree.nodes[id]
    }

    fn refuse_at(&self, rule: &'static str, path: &[Segment]) -> Refusal {
        Refusal::new(rule).with_file(self.file()).with_path(path)
    }

    fn not_found(&self, path: &[Segment]) -> Refusal {
        self.refuse_at(rule::PATH_NOT_FOUND, path)
    }

    fn layout_refusal(&self, path: &[Segment]) -> Refusal {
        self.refuse_at(rule::EDIT_CHANGED_MEANING, path)
            .with_detail("the layout around this node is not one an edit can place bytes in")
    }

    /// A value the caller hands in must fit the profile's depth bound before anything recurses on it.
    fn check_value(&self, value: &Value, path: &[Segment]) -> Result<(), Refusal> {
        if depth_of(value) > self.profile().limits().depth {
            return Err(self.refuse_at(rule::DEPTH_EXCEEDED, path));
        }
        Ok(())
    }

    /// The nodes from the root along `path`, and how many segments matched.
    fn locate(&self, path: &[Segment]) -> (Vec<Step>, usize) {
        let mut chain = Vec::new();
        let Some(root) = self.tree.docs.first().and_then(|doc| doc.root) else {
            return (chain, 0);
        };
        chain.push(Step {
            id: root,
            key: None,
            in_seq: false,
        });
        for (i, segment) in path.iter().enumerate() {
            let current = chain[chain.len() - 1].id;
            let next = match (&self.node(current).kind, segment) {
                (Kind::Map(entries), Segment::Key(wanted)) => {
                    entries.iter().find_map(|(key_id, value_id)| {
                        crate::profile::key_scalar(&self.tree, *key_id)
                            .filter(|(_, text, resolved)| {
                                crate::profile::key_text(*resolved, text) == *wanted
                            })
                            .map(|_| Step {
                                id: *value_id,
                                key: Some(*key_id),
                                in_seq: false,
                            })
                    })
                }
                (Kind::Seq(items), Segment::Index(index)) => items.get(*index).map(|id| Step {
                    id: *id,
                    key: None,
                    in_seq: true,
                }),
                _ => None,
            };
            match next {
                Some(step) => chain.push(step),
                None => return (chain, i),
            }
        }
        (chain, path.len())
    }

    fn full_chain(&self, path: &[Segment]) -> Result<Vec<Step>, Refusal> {
        let (chain, matched) = self.locate(path);
        if chain.is_empty() || matched != path.len() {
            return Err(self.not_found(path));
        }
        Ok(chain)
    }

    /// A flow collection: its first byte is a bracket the first child does not share (a block
    /// sequence of flow items starts where its first item starts).
    fn is_flow(&self, id: usize) -> bool {
        self.is_flow_node(self.node(id))
    }

    /// The outermost flow collection on the chain, itself included.
    fn flow_index(&self, chain: &[Step]) -> Option<usize> {
        chain.iter().position(|step| self.is_flow(step.id))
    }

    fn is_plain_leaf(&self, id: usize) -> bool {
        matches!(
            self.node(id).kind,
            Kind::Scalar {
                style: Style::Plain | Style::Single | Style::Double,
                ..
            }
        )
    }

    fn is_empty_null(&self, id: usize) -> bool {
        let node = self.node(id);
        matches!(&node.kind, Kind::Scalar { style: Style::Plain, text } if text.is_empty())
            && node.start == node.end
    }

    fn child_count(&self, id: usize) -> usize {
        match &self.node(id).kind {
            Kind::Seq(items) => items.len(),
            Kind::Map(entries) => entries.len(),
            _ => 0,
        }
    }

    /// The value nodes of a collection (the scope siblings are compared in).
    fn children(&self, id: usize) -> Vec<usize> {
        match &self.node(id).kind {
            Kind::Seq(items) => items.clone(),
            Kind::Map(entries) => entries.iter().map(|(_, v)| *v).collect(),
            _ => Vec::new(),
        }
    }

    /// The byte of a sequence item's `-`.
    fn dash_at(&self, node: &Node) -> Option<usize> {
        let bytes = self.text.as_bytes();
        let mut at = first_pos(node);
        while at > 0 && matches!(bytes[at - 1], b' ' | b'\t' | b'\r' | b'\n') {
            at -= 1;
        }
        (at > 0 && bytes[at - 1] == b'-').then(|| at - 1)
    }

    /// The `:` that follows a key.
    fn colon_after(&self, key_end: usize) -> Option<usize> {
        let bytes = self.text.as_bytes();
        let mut at = key_end;
        while matches!(bytes.get(at), Some(b' ' | b'\t')) {
            at += 1;
        }
        (bytes.get(at) == Some(&b':')).then_some(at)
    }

    /// The start of the first line of the entry or item the chain ends at.
    fn entry_first_line(&self, chain: &[Step]) -> Option<usize> {
        // Cannot fail: the chain is never empty here (every caller has taken it from `full_chain`,
        // or checked `chain.is_empty()`, or checked `chain.len() >= 2` for the parent).
        let step = chain[chain.len() - 1];
        let src = self.src();
        let at = if step.in_seq {
            self.dash_at(self.node(step.id))
                .unwrap_or_else(|| first_pos(self.node(step.id)))
        } else if let Some(key) = step.key {
            first_pos(self.node(key))
        } else {
            first_pos(self.node(step.id))
        };
        Some(src.line_start(at))
    }

    /// Whether `pos`, the start of a line, is inside a scalar (a block scalar's content or a
    /// multi-line quoted scalar), where a line that looks like a comment is text.
    fn inside_scalar(&self, pos: usize) -> bool {
        self.tree.nodes.iter().any(|node| {
            matches!(node.kind, Kind::Scalar { .. }) && node.start < pos && pos < node.end
        })
    }

    /// The start of the contiguous comment lines directly above the line starting at `first`;
    /// `first` itself when there are none.
    fn comment_block_start(&self, first: usize) -> usize {
        let src = self.src();
        let mut start = first;
        while start > src.base {
            let previous = src.line_start(start - 1);
            let line = &self.text[previous..start];
            if !line.trim_start().starts_with('#') || self.inside_scalar(previous) {
                break;
            }
            start = previous;
        }
        start
    }

    /// The comment on the header line of a block scalar.
    fn block_header_comment(&self, node: &Node) -> Option<(usize, usize)> {
        let src = self.src();
        let bytes = self.text.as_bytes();
        let mut at = node.start + 1;
        while matches!(bytes.get(at), Some(b'+' | b'-' | b'0'..=b'9')) {
            at += 1;
        }
        src.tail_comment(at, src.line_end(at))
    }

    /// Where an inline comment of the node goes: the byte after the node's text on its line and the
    /// line end. `None` when the node has no such place.
    fn inline_slot(&self, chain: &[Step]) -> Option<(usize, usize)> {
        if chain.len() < 2 {
            return None;
        }
        // Cannot fail: the chain is never empty here (every caller has taken it from `full_chain`,
        // or checked `chain.is_empty()`, or checked `chain.len() >= 2` for the parent).
        let step = chain[chain.len() - 1];
        let node = self.node(step.id);
        let src = self.src();
        let single_line = |node: &Node| !self.text[node.start..node.end].contains(['\n', '\r']);
        let tail_start = match &node.kind {
            Kind::Scalar {
                style: Style::Literal | Style::Folded,
                ..
            } => return None,
            Kind::Scalar { .. } | Kind::Alias(_) => single_line(node).then_some(node.end)?,
            Kind::Seq(_) | Kind::Map(_) if self.is_flow(step.id) => {
                single_line(node).then_some(node.end)?
            }
            Kind::Seq(_) | Kind::Map(_) => {
                if step.in_seq {
                    return None;
                }
                self.colon_after(self.node(step.key?).end)? + 1
            }
        };
        let line_end = src.line_end(tail_start);
        src.is_blank_or_comment(tail_start, line_end)
            .then_some((tail_start, line_end))
    }

    /// Every comment token (from its `#` to the end of the line) in `from..to`. Comments live only
    /// in the text between scalars, plus the header line of a block scalar.
    fn comment_tokens(&self, from: usize, to: usize) -> Vec<(usize, usize)> {
        let src = self.src();
        let mut leaves = Vec::new();
        let mut found = Vec::new();
        for node in &self.tree.nodes {
            if !matches!(node.kind, Kind::Scalar { .. } | Kind::Alias(_))
                || node.end <= node.start
                || node.end <= from
                || node.start >= to
            {
                continue;
            }
            leaves.push((node.start.max(from), node.end.min(to)));
            if matches!(
                node.kind,
                Kind::Scalar {
                    style: Style::Literal | Style::Folded,
                    ..
                }
            ) {
                found.extend(
                    self.block_header_comment(node)
                        .filter(|(at, _)| *at >= from && *at < to),
                );
            }
        }
        leaves.sort_unstable();
        let scan = |a: usize, b: usize, found: &mut Vec<(usize, usize)>| {
            let mut at = a;
            while at < b {
                if self.text.as_bytes()[at] == b'#' {
                    let end = src.line_end(at).min(b);
                    found.push((at, end));
                    at = end.max(at + 1);
                } else {
                    at += 1;
                }
            }
        };
        let mut pos = from;
        for (start, end) in leaves {
            if start > pos {
                scan(pos, start, &mut found);
            }
            pos = pos.max(end);
        }
        if to > pos {
            scan(pos, to, &mut found);
        }
        found.sort_unstable();
        found.dedup();
        found
    }

    /// Refuses `comment-would-be-lost` when `from..to` holds a comment other than `kept`.
    fn check_loss(
        &self,
        from: usize,
        to: usize,
        kept: Option<(usize, usize)>,
        allow: bool,
        path: &[Segment],
    ) -> Result<(), Refusal> {
        if allow {
            return Ok(());
        }
        let lost = self
            .comment_tokens(from, to)
            .into_iter()
            .any(|token| Some(token) != kept);
        if lost {
            Err(self.refuse_at(rule::COMMENT_WOULD_BE_LOST, path))
        } else {
            Ok(())
        }
    }
}

// ---- style detection ----

struct Layout {
    eol: &'static str,
    unit: usize,
    block_scalars: bool,
}

impl Document {
    fn layout(&self) -> Layout {
        let src = self.src();
        let eol = match self.text.find('\n') {
            Some(i) if i > 0 && src.bytes()[i - 1] == b'\r' => "\r\n",
            _ => "\n",
        };
        let mut unit = None;
        let mut block_scalars = false;
        for node in &self.tree.nodes {
            match &node.kind {
                Kind::Scalar {
                    style: Style::Literal | Style::Folded,
                    ..
                } => block_scalars = true,
                Kind::Map(entries) if unit.is_none() => {
                    for (key, value) in entries {
                        let (key, value) = (self.node(*key), self.node(*value));
                        if matches!(value.kind, Kind::Map(_))
                            && !self.is_flow_node(value)
                            && src.line_start(value.start) > src.line_start(key.start)
                            && src.col(value.start) > src.col(key.start)
                        {
                            unit = Some(src.col(value.start) - src.col(key.start));
                            break;
                        }
                    }
                }
                _ => {}
            }
        }
        Layout {
            eol,
            unit: unit.unwrap_or(2),
            block_scalars,
        }
    }

    fn is_flow_node(&self, node: &Node) -> bool {
        matches!(self.text.as_bytes().get(node.start), Some(b'[' | b'{'))
            && match &node.kind {
                Kind::Seq(items) => items
                    .first()
                    .is_none_or(|c| self.node(*c).start > node.start),
                Kind::Map(entries) => entries
                    .first()
                    .is_none_or(|(k, _)| self.node(*k).start > node.start),
                _ => false,
            }
    }

    /// How a new string is written: the style of the strings next to it, else of the strings of
    /// the document, else plain. `old` is the node being replaced.
    fn pref(&self, scope: &[usize], old: Option<usize>) -> Pref {
        let siblings = self.style_counts(scope.iter().copied());
        let counts = if siblings.iter().sum::<usize>() > 0 {
            siblings
        } else {
            let mut values = Vec::new();
            for node in &self.tree.nodes {
                match &node.kind {
                    Kind::Seq(items) => values.extend(items.iter().copied()),
                    Kind::Map(entries) => values.extend(entries.iter().map(|(_, v)| *v)),
                    _ => {}
                }
            }
            self.style_counts(values.into_iter())
        };
        let old_style = old.and_then(|id| self.string_style(id));
        let mut prefer = Quote::Plain;
        let mut best = 0;
        for (style, count) in [Quote::Plain, Quote::Double, Quote::Single]
            .into_iter()
            .zip([counts[0], counts[2], counts[1]])
        {
            if count > best {
                best = count;
                prefer = style;
            }
        }
        Pref {
            prefer: old_style.unwrap_or(prefer),
            single: old_style == Some(Quote::Single) || counts[1] > counts[2],
        }
    }

    /// Counts of plain, single-quoted and double-quoted string scalars among `ids`.
    fn style_counts(&self, ids: impl Iterator<Item = usize>) -> [usize; 3] {
        let mut counts = [0; 3];
        for id in ids {
            match self.string_style(id) {
                Some(Quote::Plain) => counts[0] += 1,
                Some(Quote::Single) => counts[1] += 1,
                Some(Quote::Double) => counts[2] += 1,
                None => {}
            }
        }
        counts
    }

    fn string_style(&self, id: usize) -> Option<Quote> {
        let node = self.node(id);
        let Kind::Scalar { style, text } = &node.kind else {
            return None;
        };
        if !matches!(resolve(text, *style, node.tag), Ok(Resolved::Str)) {
            return None;
        }
        match style {
            Style::Plain => Some(Quote::Plain),
            Style::Single => Some(Quote::Single),
            Style::Double => Some(Quote::Double),
            Style::Literal | Style::Folded => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Quote {
    Plain,
    Single,
    Double,
}

#[derive(Clone, Copy)]
struct Pref {
    prefer: Quote,
    /// A string that cannot stay plain takes single quotes (the document uses them more).
    single: bool,
}

// ---- rendering new content ----

/// A rendered value: on the key's line, or a block below it.
enum Rendered {
    Inline(String),
    Block { header: String, lines: Vec<String> },
}

struct Render {
    eol: &'static str,
    unit: usize,
    pref: Pref,
    block_scalars: bool,
}

impl Render {
    fn scalar(&self, value: &Value, in_flow: bool) -> String {
        match value {
            Value::Null | Value::Seq(_) | Value::Map(_) => "null".to_string(),
            Value::Bool(b) => b.to_string(),
            Value::Int(i) => i.to_string(),
            Value::Float(f) => float_text(*f),
            Value::Str(s) => self.string(s, in_flow),
        }
    }

    fn string(&self, text: &str, in_flow: bool) -> String {
        if self.pref.prefer == Quote::Plain && plain_ok(text, in_flow) {
            return text.to_string();
        }
        let single = self.pref.prefer == Quote::Single
            || (self.pref.prefer == Quote::Plain && self.pref.single);
        if single && single_ok(text) {
            format!("'{}'", text.replace('\'', "''"))
        } else {
            double_quoted(text)
        }
    }

    fn key(&self, key: &str) -> String {
        if plain_ok(key, false) {
            key.to_string()
        } else if self.pref.single && single_ok(key) {
            format!("'{}'", key.replace('\'', "''"))
        } else {
            double_quoted(key)
        }
    }

    /// `value` as the right-hand side of a key or an item. A multi-line string becomes a block
    /// scalar only where the document already uses them (and `block_scalar` allows it).
    fn rendered(
        &self,
        value: &Value,
        indent: usize,
        content_indent: usize,
        block_scalar: BlockScalar,
    ) -> Rendered {
        match value {
            Value::Map(entries) if entries.is_empty() => Rendered::Inline("{}".to_string()),
            Value::Seq(items) if items.is_empty() => Rendered::Inline("[]".to_string()),
            Value::Map(entries) => {
                let mut lines = Vec::new();
                self.map_lines(entries, indent, &mut lines);
                Rendered::Block {
                    header: String::new(),
                    lines,
                }
            }
            Value::Seq(items) => {
                let mut lines = Vec::new();
                self.seq_lines(items, indent, &mut lines);
                Rendered::Block {
                    header: String::new(),
                    lines,
                }
            }
            Value::Str(text) if block_scalar.holds(text, self.block_scalars) => {
                let chomp = if text.ends_with('\n') { "" } else { "-" };
                let style = match block_scalar {
                    BlockScalar::Keep(style) if !text.trim_end_matches('\n').contains('\n') => {
                        style
                    }
                    _ => '|',
                };
                let header = format!("{style}{chomp}");
                let body = text.strip_suffix('\n').unwrap_or(text);
                let pad = " ".repeat(content_indent);
                let lines = body
                    .split('\n')
                    .map(|line| {
                        if line.is_empty() {
                            String::new()
                        } else {
                            format!("{pad}{line}")
                        }
                    })
                    .collect();
                Rendered::Block { header, lines }
            }
            scalar => Rendered::Inline(self.scalar(scalar, false)),
        }
    }

    fn map_lines(&self, entries: &[(String, Value)], indent: usize, out: &mut Vec<String>) {
        for (key, value) in entries {
            self.entry_lines(key, value, indent, out);
        }
    }

    fn entry_lines(&self, key: &str, value: &Value, indent: usize, out: &mut Vec<String>) {
        let pad = " ".repeat(indent);
        let child = indent + self.unit;
        match self.rendered(value, child, child, BlockScalar::Doc) {
            Rendered::Inline(text) => out.push(format!("{pad}{}: {text}", self.key(key))),
            Rendered::Block { header, lines } => {
                let space = if header.is_empty() { "" } else { " " };
                out.push(format!("{pad}{}:{space}{header}", self.key(key)));
                out.extend(lines);
            }
        }
    }

    /// Sequence items in the compact form: a collection starts on its dash's line.
    fn seq_lines(&self, items: &[Value], indent: usize, out: &mut Vec<String>) {
        let pad = " ".repeat(indent);
        for item in items {
            match self.rendered(item, indent + 2, indent + 2, BlockScalar::No) {
                Rendered::Inline(text) => out.push(format!("{pad}- {text}")),
                Rendered::Block { lines, .. } => {
                    for (i, line) in lines.into_iter().enumerate() {
                        if i == 0 {
                            out.push(format!("{pad}- {}", &line[indent + 2..]));
                        } else {
                            out.push(line);
                        }
                    }
                }
            }
        }
    }
}

/// Plain scalar that reads back as the same string.
fn plain_ok(text: &str, in_flow: bool) -> bool {
    if text.is_empty() || text != text.trim() {
        return false;
    }
    if text
        .chars()
        .any(|c| (c.is_control() && c != '\t') || matches!(c, '\u{2028}' | '\u{2029}' | '\u{FEFF}'))
    {
        return false;
    }
    let mut chars = text.chars();
    let first = chars.next().unwrap_or(' ');
    if ",[]{}#&*!|>'\"%@`".contains(first) {
        return false;
    }
    if matches!(first, '-' | '?' | ':') && matches!(chars.next(), None | Some(' ' | '\t')) {
        return false;
    }
    if text.contains(": ")
        || text.contains(":\t")
        || text.contains(" #")
        || text.contains("\t#")
        || text.ends_with(':')
        || text.starts_with("---")
        || text.starts_with("...")
    {
        return false;
    }
    if in_flow && text.contains([',', '[', ']', '{', '}']) {
        return false;
    }
    matches!(resolve(text, Style::Plain, None), Ok(Resolved::Str))
}

fn single_ok(text: &str) -> bool {
    !text
        .chars()
        .any(|c| c.is_control() || matches!(c, '\u{2028}' | '\u{2029}' | '\u{FEFF}'))
}

fn double_quoted(text: &str) -> String {
    let mut out = String::with_capacity(text.len() + 2);
    out.push('"');
    for c in text.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\t' => out.push_str("\\t"),
            '\r' => out.push_str("\\r"),
            c if c.is_control() || matches!(c, '\u{2028}' | '\u{2029}' | '\u{FEFF}') => {
                out.push_str(&format!("\\u{:04X}", c as u32));
            }
            c => out.push(c),
        }
    }
    out.push('"');
    out
}

/// A string a block scalar holds exactly: no control characters, no line that is only blanks, a
/// first line that does not start with a blank, and no blank line at the end.
fn block_ok(text: &str) -> bool {
    let body = text.strip_suffix('\n').unwrap_or(text);
    !body.is_empty()
        && !body.ends_with('\n')
        && !text.chars().any(|c| {
            (c.is_control() && c != '\n' && c != '\t')
                || matches!(c, '\u{2028}' | '\u{2029}' | '\u{FEFF}')
        })
        && !body.starts_with([' ', '\t', '\n'])
        && body
            .split('\n')
            .all(|line| line.is_empty() || !line.trim().is_empty())
}

/// When a string may be written as a block scalar.
#[derive(Clone, Copy)]
enum BlockScalar {
    /// Never (sequence items, the document root).
    No,
    /// A multi-line string, in a document that already uses block scalars.
    Doc,
    /// The node being replaced is a block scalar of this style: it stays one.
    Keep(char),
}

impl BlockScalar {
    fn holds(self, text: &str, document_uses_them: bool) -> bool {
        match self {
            BlockScalar::No => false,
            BlockScalar::Doc => {
                document_uses_them && text.trim_end_matches('\n').contains('\n') && block_ok(text)
            }
            BlockScalar::Keep(_) => block_ok(text),
        }
    }
}

fn float_text(value: f64) -> String {
    if value.is_nan() {
        ".nan".to_string()
    } else if value.is_infinite() {
        if value > 0.0 { ".inf" } else { "-.inf" }.to_string()
    } else {
        format!("{value:?}")
    }
}

// ---- planning each operation ----

impl Document {
    fn render_for(&self, scope: &[usize], old: Option<usize>) -> Render {
        let layout = self.layout();
        Render {
            eol: layout.eol,
            unit: layout.unit,
            pref: self.pref(scope, old),
            block_scalars: layout.block_scalars,
        }
    }

    /// A scalar replacing a scalar inside a flow collection: only the scalar's bytes change.
    fn plan_scalar_in_flow(&self, chain: &[Step], value: &Value) -> Splice {
        // Cannot fail: the chain is never empty here (every caller has taken it from `full_chain`,
        // or checked `chain.is_empty()`, or checked `chain.len() >= 2` for the parent).
        let target = chain[chain.len() - 1];
        let node = self.node(target.id);
        let scope = if chain.len() > 1 {
            self.children(chain[chain.len() - 2].id)
        } else {
            Vec::new()
        };
        let render = self.render_for(&scope, Some(target.id));
        Splice {
            start: node.start,
            end: node.end,
            text: render.scalar(value, true),
        }
    }

    /// Replaces the node the chain ends at with `value`, written in the document's block style.
    fn plan_replace(
        &self,
        chain: &[Step],
        value: &Value,
        allow_loss: bool,
        path: &[Segment],
    ) -> Result<Splice, Refusal> {
        let src = self.src();
        // Cannot fail: the chain is never empty here (every caller has taken it from `full_chain`,
        // or checked `chain.is_empty()`, or checked `chain.len() >= 2` for the parent).
        let target = chain[chain.len() - 1];
        let node = self.node(target.id);
        let layout = self.layout();
        let eol = layout.eol;
        let scope = if chain.len() > 1 {
            self.children(chain[chain.len() - 2].id)
        } else {
            Vec::new()
        };
        let render = self.render_for(&scope, Some(target.id));
        let start = first_pos(node);
        // A scalar replaced by a scalar keeps its tag and anchor; anything else drops them.
        let inline_start = if matches!(node.kind, Kind::Scalar { .. } | Kind::Alias(_)) {
            node.start
        } else {
            start
        };
        let is_block_scalar = matches!(
            node.kind,
            Kind::Scalar {
                style: Style::Literal | Style::Folded,
                ..
            }
        );

        // The whole document.
        if chain.len() == 1 {
            let end = node.end.max(start);
            self.check_loss(start, end, None, allow_loss, path)?;
            let text = match render.rendered(value, 0, 0, BlockScalar::No) {
                Rendered::Inline(text) => text,
                Rendered::Block { lines, .. } => lines.join(eol),
            };
            return Ok(Splice { start, end, text });
        }

        // A sequence item: its content starts right after the dash.
        if target.in_seq {
            let end = node.end.max(start);
            let dash = self
                .dash_at(node)
                .ok_or_else(|| self.layout_refusal(path))?;
            let indent = src.col(dash) + 2;
            let (block, content_indent) = match &node.kind {
                Kind::Scalar {
                    style: Style::Folded,
                    ..
                } => (BlockScalar::Keep('>'), self.block_content_indent(node)),
                Kind::Scalar {
                    style: Style::Literal,
                    ..
                } => (BlockScalar::Keep('|'), self.block_content_indent(node)),
                _ => (BlockScalar::No, None),
            };
            let rendered = render.rendered(value, indent, content_indent.unwrap_or(indent), block);
            let kept = if is_block_scalar {
                self.block_header_comment(node)
            } else {
                None
            };
            self.check_loss(start, end, kept, allow_loss, path)?;
            let mut start = start;
            let text = match rendered {
                Rendered::Inline(text) => {
                    start = inline_start;
                    if start == end && !self.text[..start].ends_with([' ', '\t']) {
                        format!(" {text}")
                    } else {
                        text
                    }
                }
                Rendered::Block { header, lines } if !header.is_empty() => {
                    let comment = kept
                        .map(|(at, to)| format!("  {}", &self.text[at..to]))
                        .unwrap_or_default();
                    format!("{header}{comment}{eol}{}", lines.join(eol))
                }
                Rendered::Block { lines, .. } => {
                    let joined = lines.join(eol);
                    joined[indent.min(joined.len())..].to_string()
                }
            };
            return Ok(Splice { start, end, text });
        }

        // A mapping entry.
        let key = self.node(target.key.ok_or_else(|| self.layout_refusal(path))?);
        let colon = self
            .colon_after(key.end)
            .ok_or_else(|| self.layout_refusal(path))?;
        let key_col = src.col(first_pos(key));
        let child = key_col + layout.unit;
        let key_line_end = src.line_end(colon);
        let on_key_line = start <= key_line_end;
        // A block scalar keeps the indentation its content already has.
        let content_indent = if is_block_scalar {
            self.block_content_indent(node).unwrap_or(child)
        } else {
            child
        };
        let block = match &node.kind {
            Kind::Scalar {
                style: Style::Folded,
                ..
            } => BlockScalar::Keep('>'),
            Kind::Scalar {
                style: Style::Literal,
                ..
            } => BlockScalar::Keep('|'),
            _ => BlockScalar::Doc,
        };
        let rendered = render.rendered(value, child, content_indent, block);

        if let (Rendered::Inline(text), true, false) = (&rendered, on_key_line, is_block_scalar) {
            let end = node.end.max(start);
            self.check_loss(start, end, None, allow_loss, path)?;
            let start = inline_start;
            let text = if start == end && !self.text[..start].ends_with([' ', '\t']) {
                format!(" {text}")
            } else {
                text.clone()
            };
            return Ok(Splice { start, end, text });
        }

        let range_start = colon + 1;
        let range_end = src.last_line_end(node.end.max(range_start));
        let kept = if is_block_scalar {
            self.block_header_comment(node)
        } else if on_key_line {
            src.tail_comment(
                node.end.max(range_start),
                src.line_end(node.end.max(range_start)),
            )
        } else {
            src.tail_comment(range_start, key_line_end)
        };
        self.check_loss(range_start, range_end, kept, allow_loss, path)?;
        let comment = kept
            .map(|(at, to)| format!("  {}", &self.text[at..to]))
            .unwrap_or_default();
        let text = match rendered {
            Rendered::Inline(text) => format!(" {text}{comment}"),
            Rendered::Block { header, lines } => {
                let space = if header.is_empty() { "" } else { " " };
                format!("{space}{header}{comment}{eol}{}", lines.join(eol))
            }
        };
        Ok(Splice {
            start: range_start,
            end: range_end,
            text,
        })
    }

    /// The indentation of a block scalar's first content line.
    fn block_content_indent(&self, node: &Node) -> Option<usize> {
        let src = self.src();
        let header_line_end = src.line_end(node.start);
        let content_start = src.next_line_start(header_line_end)?;
        if content_start >= node.end {
            return None;
        }
        self.text[content_start..node.end]
            .lines()
            .find(|line| !line.trim().is_empty())
            .map(|line| line.len() - line.trim_start_matches(' ').len())
    }

    /// New entry lines after an existing entry of a block mapping.
    fn plan_insert(
        &self,
        chain: &[Step],
        mapping_path: &[Segment],
        key: &str,
        value: &Value,
        position: Position<'_>,
    ) -> Result<Splice, Refusal> {
        let src = self.src();
        // Cannot fail: the chain is never empty here (every caller has taken it from `full_chain`,
        // or checked `chain.is_empty()`, or checked `chain.len() >= 2` for the parent).
        let map = chain[chain.len() - 1];
        let Kind::Map(entries) = &self.node(map.id).kind else {
            return Err(self.not_found(mapping_path));
        };
        let index = match position {
            Position::End => entries.len().checked_sub(1),
            Position::After(name) => entries.iter().position(|(key_id, _)| {
                crate::profile::key_scalar(&self.tree, *key_id).is_some_and(
                    |(_, text, resolved)| crate::profile::key_text(resolved, text) == name,
                )
            }),
        };
        let Some(index) = index else {
            let mut path = mapping_path.to_vec();
            if let Position::After(name) = position {
                path.push(Segment::Key(name.to_string()));
            }
            return Err(self.not_found(&path));
        };
        let scope = self.children(map.id);
        let render = self.render_for(&scope, None);
        let key_col = src.col(first_pos(self.node(entries[0].0)));
        let mut lines = Vec::new();
        render.entry_lines(key, value, key_col, &mut lines);
        let (key_id, value_id) = entries[index];
        let end = src.last_line_end(self.node(value_id).end.max(self.node(key_id).end));
        Ok(self.splice_lines_after(end, &lines, render.eol))
    }

    /// Lines written after the line ending at `line_end`, whether or not that line has a break.
    fn splice_lines_after(&self, line_end: usize, lines: &[String], eol: &str) -> Splice {
        let src = self.src();
        let joined = lines.join(eol);
        match src.next_line_start(line_end) {
            Some(next) => Splice {
                start: next,
                end: next,
                text: format!("{joined}{eol}"),
            },
            None => Splice {
                start: self.text.len(),
                end: self.text.len(),
                text: format!("{eol}{joined}"),
            },
        }
    }

    /// An entry in a document that has no content yet: written at the end, after any comments.
    fn plan_append_root(&self, key: &str, value: &Value) -> Splice {
        let render = self.render_for(&[], None);
        let mut lines = Vec::new();
        render.entry_lines(key, value, 0, &mut lines);
        let joined = lines.join(render.eol);
        let end = self.text.len();
        let text = if end == self.src().base || self.text.ends_with('\n') {
            format!("{joined}{}", render.eol)
        } else {
            format!("{}{joined}{}", render.eol, render.eol)
        };
        Splice {
            start: end,
            end,
            text,
        }
    }

    /// Deletes the lines of an entry or item, and the note block above it when acknowledged.
    fn plan_remove_lines(
        &self,
        chain: &[Step],
        path: &[Segment],
        allow_loss: bool,
    ) -> Result<Splice, Refusal> {
        let src = self.src();
        // Cannot fail: the chain is never empty here (every caller has taken it from `full_chain`,
        // or checked `chain.is_empty()`, or checked `chain.len() >= 2` for the parent).
        let target = chain[chain.len() - 1];
        let node = self.node(target.id);
        let first = self
            .entry_first_line(chain)
            .ok_or_else(|| self.layout_refusal(path))?;
        let end_pos = match target.key {
            Some(key) => node.end.max(self.node(key).end),
            None => node.end,
        };
        // The first key of a mapping that starts on its sequence item's dash line: the dash stays,
        // and the next key moves up to take the key's place.
        if let (Some(key), Kind::Map(entries)) =
            (target.key, &self.node(chain[chain.len() - 2].id).kind)
        {
            let key_at = first_pos(self.node(key));
            if !self.text[first..key_at].trim().is_empty() {
                let next = entries
                    .iter()
                    .position(|(k, _)| *k == key)
                    .and_then(|i| entries.get(i + 1))
                    .ok_or_else(|| self.layout_refusal(path))?;
                let end = first_pos(self.node(next.0));
                self.check_loss(key_at, end, None, allow_loss, path)?;
                return Ok(Splice {
                    start: key_at,
                    end,
                    text: String::new(),
                });
            }
        }
        let last_end = src.last_line_end(end_pos);
        let above = self.comment_block_start(first);
        if !allow_loss && (above < first || !self.comment_tokens(first, last_end).is_empty()) {
            return Err(self.refuse_at(rule::COMMENT_WOULD_BE_LOST, path));
        }
        let mut start = if allow_loss { above } else { first };
        let end = src.next_line_start(last_end).unwrap_or(self.text.len());
        // The last line has no break: the line before loses its break so the file still ends as it did.
        if end == self.text.len() && !self.text.ends_with('\n') && start > src.base {
            start = src.line_end(start - 1);
        }
        Ok(Splice {
            start,
            end,
            text: String::new(),
        })
    }
}

// ---- the same operation on the value ----

fn value_at<'a>(value: &'a Value, path: &[Segment]) -> Option<&'a Value> {
    let mut current = value;
    for segment in path {
        current = match (current, segment) {
            (Value::Map(entries), Segment::Key(key)) => &entries.iter().find(|(k, _)| k == key)?.1,
            (Value::Seq(items), Segment::Index(index)) => items.get(*index)?,
            _ => return None,
        };
    }
    Some(current)
}

fn value_at_mut<'a>(value: &'a mut Value, path: &[Segment]) -> Option<&'a mut Value> {
    let mut current = value;
    for segment in path {
        current = match (current, segment) {
            (Value::Map(entries), Segment::Key(key)) => {
                &mut entries.iter_mut().find(|(k, _)| k == key)?.1
            }
            (Value::Seq(items), Segment::Index(index)) => items.get_mut(*index)?,
            _ => return None,
        };
    }
    Some(current)
}

/// `{k1: {k2: ... leaf}}` for key segments only.
fn nested_map(rest: &[Segment], leaf: Value) -> Option<Value> {
    let mut value = leaf;
    for segment in rest.iter().rev() {
        let Segment::Key(key) = segment else {
            return None;
        };
        value = Value::Map(vec![(key.clone(), value)]);
    }
    Some(value)
}

fn apply_set(root: &mut Value, path: &[Segment], new: Value) -> Result<(), ()> {
    let mut current = root;
    for (i, segment) in path.iter().enumerate() {
        if matches!(current, Value::Null) && matches!(segment, Segment::Key(_)) {
            *current = Value::Map(Vec::new());
        }
        match (current, segment) {
            (Value::Map(entries), Segment::Key(key)) => {
                match entries.iter().position(|(k, _)| k == key) {
                    Some(at) => current = &mut entries[at].1,
                    None => {
                        let leaf = nested_map(&path[i + 1..], new).ok_or(())?;
                        entries.push((key.clone(), leaf));
                        return Ok(());
                    }
                }
            }
            (Value::Seq(items), Segment::Index(index)) => {
                current = items.get_mut(*index).ok_or(())?;
            }
            _ => return Err(()),
        }
    }
    *current = new;
    Ok(())
}

fn apply_insert(
    root: &mut Value,
    path: &[Segment],
    key: &str,
    value: Value,
    position: Position<'_>,
) -> Result<(), ()> {
    let target = value_at_mut(root, path).ok_or(())?;
    if matches!(target, Value::Null) {
        *target = Value::Map(Vec::new());
    }
    let Value::Map(entries) = target else {
        return Err(());
    };
    let at = match position {
        Position::End => entries.len(),
        Position::After(name) => entries.iter().position(|(k, _)| k == name).ok_or(())? + 1,
    };
    entries.insert(at, (key.to_string(), value));
    Ok(())
}

fn apply_remove(root: &mut Value, path: &[Segment]) -> Result<(), ()> {
    let (last, parent) = path.split_last().ok_or(())?;
    match (value_at_mut(root, parent).ok_or(())?, last) {
        (Value::Map(entries), Segment::Key(key)) => {
            let at = entries.iter().position(|(k, _)| k == key).ok_or(())?;
            entries.remove(at);
        }
        (Value::Seq(items), Segment::Index(index)) if *index < items.len() => {
            items.remove(*index);
        }
        _ => return Err(()),
    }
    Ok(())
}

/// Equality that treats two NaNs as equal (a `.nan` the edit wrote reads back as NaN).
fn same_value(a: &Value, b: &Value) -> bool {
    let mut stack = vec![(a, b)];
    while let Some((a, b)) = stack.pop() {
        let equal = match (a, b) {
            (Value::Float(x), Value::Float(y)) => x == y || (x.is_nan() && y.is_nan()),
            (Value::Seq(x), Value::Seq(y)) => {
                stack.extend(x.iter().zip(y));
                x.len() == y.len()
            }
            (Value::Map(x), Value::Map(y)) => {
                let same_keys = x.len() == y.len() && x.iter().zip(y).all(|(p, q)| p.0 == q.0);
                stack.extend(x.iter().zip(y).map(|(p, q)| (&p.1, &q.1)));
                same_keys
            }
            _ => a == b,
        };
        if !equal {
            return false;
        }
    }
    true
}

/// Nesting depth of a value, without recursion: a scalar is 0, the root collection 1.
fn depth_of(value: &Value) -> usize {
    let mut deepest = 0;
    let mut stack = vec![(value, 0usize)];
    while let Some((value, depth)) = stack.pop() {
        match value {
            Value::Seq(items) => {
                deepest = deepest.max(depth + 1);
                stack.extend(items.iter().map(|v| (v, depth + 1)));
            }
            Value::Map(entries) => {
                deepest = deepest.max(depth + 1);
                stack.extend(entries.iter().map(|(_, v)| (v, depth + 1)));
            }
            _ => {}
        }
    }
    deepest
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::Profile;

    #[test]
    fn a_value_nested_past_the_profile_depth_is_refused_before_anything_recurses_on_it() {
        let mut doc = parse(b"a: 1\n", Profile::StrictConfig, "t.yaml").unwrap();
        let mut deep = Value::Int(1);
        for _ in 0..(Profile::StrictConfig.limits().depth + 1) {
            deep = Value::Seq(vec![deep]);
        }
        let refusal = doc
            .set(&[Segment::Key("a".into())], deep, CommentLoss::Refuse)
            .unwrap_err();
        assert_eq!(refusal.rule, rule::DEPTH_EXCEEDED);
        assert_eq!(doc.to_bytes(), b"a: 1\n");
    }
}
