//! Alias expansion and the node and byte bounds after it (spec section 8), producing the semantic
//! value. The walk keeps its own stack and counts every visit, so a document whose anchors refer
//! to themselves, or to each other many times over, ends at the bound and never recurses on the
//! call stack. A shared alias target is visited once per use; the source text stays small while
//! the counters see the full size.

use std::slice::Iter;

use crate::backend::{Kind, Tree};
use crate::document::Ctx;
use crate::model::{rule, Limits, Refusal, Value};
use crate::profile::{key_scalar, key_text, resolve, Resolved};

enum Frame<'t> {
    Seq {
        items: Vec<Value>,
        rest: Iter<'t, usize>,
    },
    Map {
        entries: Vec<(String, Value)>,
        rest: Iter<'t, (usize, usize)>,
        key: Option<String>,
    },
}

impl Frame<'_> {
    fn accept(&mut self, value: Value) {
        match self {
            Frame::Seq { items, .. } => items.push(value),
            Frame::Map { entries, key, .. } => {
                // A value always follows its key (see `next_child`).
                entries.push((key.take().unwrap_or_default(), value));
            }
        }
    }

    fn finish(self) -> Value {
        match self {
            Frame::Seq { items, .. } => Value::Seq(items),
            Frame::Map { entries, .. } => Value::Map(entries),
        }
    }
}

/// The value of the first document, or null when there is none.
pub(crate) fn build(tree: &Tree, limits: &Limits, ctx: &Ctx) -> Result<Value, Refusal> {
    let Some(root) = tree.docs.first().and_then(|doc| doc.root) else {
        return Ok(Value::Null);
    };
    let (mut nodes, mut bytes) = (0usize, 0usize);
    let mut stack: Vec<Frame> = Vec::new();
    let mut next = Some(root);
    let mut done: Option<Value> = None;
    loop {
        if let Some(mut id) = next.take() {
            // An alias stands for the node it points at.
            if let Kind::Alias(target) = tree.nodes[id].kind {
                id = target;
            }
            let node = &tree.nodes[id];
            nodes += 1;
            if nodes > limits.nodes {
                return Err(ctx
                    .refuse(rule::NODE_LIMIT, node.start)
                    .with_detail(format!("limit is {} nodes", limits.nodes)));
            }
            match &node.kind {
                Kind::Scalar { style, text } => {
                    bytes += text.len();
                    if limits.expanded_bytes.is_some_and(|limit| bytes > limit) {
                        return Err(ctx
                            .refuse(rule::EXPANDED_TOO_LARGE, node.start)
                            .with_detail(format!(
                                "limit is {} bytes",
                                limits.expanded_bytes.unwrap_or(0)
                            )));
                    }
                    done = Some(
                        match resolve(text, *style, node.tag).unwrap_or(Resolved::Str) {
                            Resolved::Null => Value::Null,
                            Resolved::Bool(value) => Value::Bool(value),
                            Resolved::Int(int) => Value::Int(int),
                            Resolved::Float(float) | Resolved::BigInt(float) => Value::Float(float),
                            Resolved::Str => Value::Str(text.clone()),
                        },
                    );
                }
                Kind::Seq(items) => stack.push(Frame::Seq {
                    items: Vec::new(),
                    rest: items.iter(),
                }),
                Kind::Map(entries) => stack.push(Frame::Map {
                    entries: Vec::new(),
                    rest: entries.iter(),
                    key: None,
                }),
                // Unreachable: the backend resolves an anchor to the node it names, never to an alias.
                Kind::Alias(_) => unreachable!("an alias points at a node that is not an alias"),
            }
        }
        if let Some(value) = done.take() {
            match stack.last_mut() {
                None => return Ok(value),
                Some(frame) => frame.accept(value),
            }
        }
        // The innermost collection asks for its next child, or is complete.
        let Some(top) = stack.last_mut() else {
            return Ok(Value::Null);
        };
        let child = match top {
            Frame::Seq { rest, .. } => rest.next().copied(),
            Frame::Map { rest, key, .. } => rest.next().map(|(key_id, value_id)| {
                *key = Some(
                    key_scalar(tree, *key_id)
                        .map(|(_, text, resolved)| key_text(resolved, text))
                        .unwrap_or_default(),
                );
                *value_id
            }),
        };
        match child {
            Some(id) => next = Some(id),
            None => done = stack.pop().map(Frame::finish),
        }
    }
}
