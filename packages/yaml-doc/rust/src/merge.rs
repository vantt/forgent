//! Merge primitive over semantic values (spec section 7). It reads no files and picks no
//! priorities: layers arrive highest priority first and the caller supplies the rule per path.
//!
//! - Absent is not null: a path missing from a layer falls through to the next layer; a path
//!   present with null wins as null.
//! - At a `Deep` path mappings merge key by key; a present null in a lower layer masks the layers
//!   below it; layers whose values differ in kind (mapping, sequence, scalar) are a
//!   `merge-type-mismatch` naming both layers, never repaired.
//! - `Replace` and `Leaf` take the highest layer that has the path, whole, and look at no lower
//!   layer. Without a rule a mapping is `Deep` and anything else is `Leaf`.
//! - Origins list every leaf of the result (scalars, nulls, empty collections) with the index of
//!   the layer that supplied it, in result order.

use std::collections::{HashMap, HashSet};

use crate::model::{rule, Refusal, Segment, Value};

/// Nesting bound of a merged value: the deepest profile bound, so values that already passed a
/// parse always fit and a caller's own pathological `Value` ends in a refusal, not a stack overflow.
const MAX_DEPTH: usize = 64;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MergeRule {
    Deep,
    Replace,
    Leaf,
}

/// Source of the per-path rule. Paths are matched exactly; `None` means "use the default".
pub trait RuleSource {
    fn rule(&self, path: &[Segment]) -> Option<MergeRule>;
}

/// No caller rules: every path takes the default.
pub struct NoRules;

impl RuleSource for NoRules {
    fn rule(&self, _path: &[Segment]) -> Option<MergeRule> {
        None
    }
}

impl<F: Fn(&[Segment]) -> Option<MergeRule>> RuleSource for F {
    fn rule(&self, path: &[Segment]) -> Option<MergeRule> {
        self(path)
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Merged {
    pub value: Value,
    /// `(path, index into layers)` for every leaf of `value`.
    pub origins: Vec<(Vec<Segment>, usize)>,
}

/// One mapping layer with an index of its keys.
struct MapLayer<'a> {
    index: usize,
    entries: &'a [(String, Value)],
    by_key: HashMap<&'a str, &'a Value>,
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum Kind {
    Map,
    Seq,
    Scalar,
}

impl Kind {
    fn of(value: &Value) -> Kind {
        match value {
            Value::Map(_) => Kind::Map,
            Value::Seq(_) => Kind::Seq,
            _ => Kind::Scalar,
        }
    }

    fn noun(self) -> &'static str {
        match self {
            Kind::Map => "a mapping",
            Kind::Seq => "a sequence",
            Kind::Scalar => "a scalar",
        }
    }
}

/// Merges `layers`, highest priority first. No layers merge to null with no origins.
pub fn merge(layers: &[&Value], rules: &dyn RuleSource) -> Result<Merged, Refusal> {
    let mut origins = Vec::new();
    let present: Vec<(usize, &Value)> = layers.iter().copied().enumerate().collect();
    if present.is_empty() {
        return Ok(Merged {
            value: Value::Null,
            origins,
        });
    }
    let mut path = Vec::new();
    let value = merge_node(&mut path, &present, rules, &mut origins)?;
    Ok(Merged { value, origins })
}

fn too_deep(path: &[Segment]) -> Refusal {
    Refusal::new(rule::DEPTH_EXCEEDED)
        .with_path(path)
        .with_detail(format!("merge depth limit {MAX_DEPTH}"))
}

/// `layers` holds the layers that have this path, highest priority first; never empty.
fn merge_node(
    path: &mut Vec<Segment>,
    layers: &[(usize, &Value)],
    rules: &dyn RuleSource,
    origins: &mut Vec<(Vec<Segment>, usize)>,
) -> Result<Value, Refusal> {
    if path.len() > MAX_DEPTH {
        return Err(too_deep(path));
    }
    let (top_index, top) = layers[0];
    let chosen = rules.rule(path).unwrap_or(if matches!(top, Value::Map(_)) {
        MergeRule::Deep
    } else {
        MergeRule::Leaf
    });
    if chosen != MergeRule::Deep || matches!(top, Value::Null) {
        return take_whole(path, top, top_index, origins);
    }

    // A present null below the top masks every layer under it.
    let masked_at = layers
        .iter()
        .skip(1)
        .position(|(_, v)| matches!(v, Value::Null))
        .map(|p| p + 1);
    let considered = &layers[..masked_at.unwrap_or(layers.len())];
    let top_kind = Kind::of(top);
    if let Some((other_index, other)) = considered
        .iter()
        .skip(1)
        .find(|(_, v)| Kind::of(v) != top_kind)
    {
        return Err(Refusal::new(rule::MERGE_TYPE_MISMATCH)
            .with_path(path)
            .with_detail(format!(
                "layer {top_index} is {}, layer {other_index} is {}",
                top_kind.noun(),
                Kind::of(other).noun()
            )));
    }
    if top_kind != Kind::Map {
        return take_whole(path, top, top_index, origins);
    }

    // Per-layer key index keeps the merge linear in the total node count.
    let maps: Vec<MapLayer> = considered
        .iter()
        .filter_map(|(index, value)| match value {
            Value::Map(entries) => {
                let mut by_key = HashMap::new();
                for (key, child) in entries {
                    by_key.entry(key.as_str()).or_insert(child);
                }
                Some(MapLayer {
                    index: *index,
                    entries,
                    by_key,
                })
            }
            _ => None,
        })
        .collect();

    let mut seen: HashSet<&str> = HashSet::new();
    let mut merged = Vec::new();
    for layer in &maps {
        for (key, _) in layer.entries {
            if !seen.insert(key.as_str()) {
                continue;
            }
            let holders: Vec<(usize, &Value)> = maps
                .iter()
                .filter_map(|other| {
                    other
                        .by_key
                        .get(key.as_str())
                        .map(|child| (other.index, *child))
                })
                .collect();
            path.push(Segment::Key(key.clone()));
            let child = merge_node(path, &holders, rules, origins);
            path.pop();
            merged.push((key.clone(), child?));
        }
    }
    if merged.is_empty() {
        origins.push((path.clone(), top_index));
    }
    Ok(Value::Map(merged))
}

/// The value of one layer, whole; every leaf under it is attributed to that layer.
fn take_whole(
    path: &mut Vec<Segment>,
    value: &Value,
    layer: usize,
    origins: &mut Vec<(Vec<Segment>, usize)>,
) -> Result<Value, Refusal> {
    record_origins(path, value, layer, origins)?;
    Ok(value.clone())
}

fn record_origins(
    path: &mut Vec<Segment>,
    value: &Value,
    layer: usize,
    origins: &mut Vec<(Vec<Segment>, usize)>,
) -> Result<(), Refusal> {
    if path.len() > MAX_DEPTH {
        return Err(too_deep(path));
    }
    match value {
        Value::Seq(items) if !items.is_empty() => {
            for (index, item) in items.iter().enumerate() {
                path.push(Segment::Index(index));
                let walked = record_origins(path, item, layer, origins);
                path.pop();
                walked?;
            }
        }
        Value::Map(entries) if !entries.is_empty() => {
            for (key, child) in entries {
                path.push(Segment::Key(key.clone()));
                let walked = record_origins(path, child, layer, origins);
                path.pop();
                walked?;
            }
        }
        _ => origins.push((path.clone(), layer)),
    }
    Ok(())
}
