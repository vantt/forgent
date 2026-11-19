//! Input parsing: the contract's refusals, limits and edge-kind registry.

use std::collections::HashMap;
use std::fmt;

use serde_json::Value;

pub const MAX_NODES: usize = 20_000;
pub const MAX_EDGES: usize = 200_000;
pub const MAX_EXCLUSIONS: usize = 100_000;
pub const MAX_ID_BYTES: usize = 256;
pub const MAX_INPUT_BYTES: usize = 4_194_304;

/// The edge-kind registry of `graph.v1.json`: `(kind, orders, groups)`.
pub const EDGE_KINDS: [(&str, bool, bool); 4] = [
    ("depends-on", true, true),
    ("parent-child", true, true),
    ("waits-for", true, true),
    ("related", false, true),
];

/// A refusal: malformed input, nothing computed. Carries the code, the field or limit name and the index of
/// the first offending item. It never quotes input text.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Refusal {
    pub code: &'static str,
    pub field: String,
    pub index: Option<usize>,
}

impl Refusal {
    fn new(code: &'static str, field: &str, index: Option<usize>) -> Self {
        Self {
            code,
            field: field.to_string(),
            index,
        }
    }
}

impl fmt::Display for Refusal {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self.index {
            Some(i) => write!(f, "{}: {}[{}]", self.code, self.field, i),
            None => write!(f, "{}: {}", self.code, self.field),
        }
    }
}

impl std::error::Error for Refusal {}

/// One edge whose ends are both nodes, by node position.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) struct Link {
    pub from: usize,
    pub to: usize,
    pub kind: usize,
}

/// A well-formed input, indexed by node position (input order).
#[derive(Debug, Clone)]
pub struct Graph {
    pub(crate) ids: Vec<String>,
    pub(crate) index: HashMap<String, usize>,
    /// Valid, de-duplicated links of every kind, in input order.
    pub(crate) links: Vec<Link>,
    pub(crate) exclusions: Vec<(usize, usize)>,
    /// Priority rank per node: listed ids first in list order, then the rest in input order.
    pub(crate) rank: Vec<usize>,
    pub(crate) dangling: Vec<crate::output::DanglingEntry>,
}

impl Graph {
    /// Parse JSON text; text longer than the input limit is refused before it is parsed. Text that is not
    /// valid JSON is refused as `input-not-object`.
    #[allow(clippy::should_implement_trait)]
    pub fn from_str(text: &str) -> Result<Self, Refusal> {
        if text.len() > MAX_INPUT_BYTES {
            return Err(Refusal::new("limit-exceeded", "maxInputBytes", None));
        }
        let Strict(value) = serde_json::from_str(text).map_err(|e| {
            match e.to_string().strip_prefix(DUPLICATE_KEY_MARK) {
                Some(rest) => {
                    let key = rest.rsplit_once(" at line ").map_or(rest, |(key, _)| key);
                    Refusal::new("duplicate-key", &truncate(key), None)
                }
                None => Refusal::new("input-not-object", "input", None),
            }
        })?;
        Self::build(&value)
    }

    /// Parse an already-decoded document; its serialised size is held to the input limit.
    pub fn from_value(value: &Value) -> Result<Self, Refusal> {
        let size = serde_json::to_vec(value)
            .map(|b| b.len())
            .unwrap_or(usize::MAX);
        if size > MAX_INPUT_BYTES {
            return Err(Refusal::new("limit-exceeded", "maxInputBytes", None));
        }
        Self::build(value)
    }

    fn build(value: &Value) -> Result<Self, Refusal> {
        let obj = value
            .as_object()
            .ok_or_else(|| Refusal::new("input-not-object", "input", None))?;
        for key in obj.keys() {
            if !matches!(key.as_str(), "nodes" | "edges" | "exclusions" | "priority") {
                return Err(Refusal::new("unknown-field", &truncate(key), None));
            }
        }
        let nodes = obj
            .get("nodes")
            .and_then(Value::as_array)
            .ok_or_else(|| Refusal::new("nodes-missing", "nodes", None))?;
        let empty = Vec::new();
        let edges = list(obj.get("edges"), "edges", "edge-malformed", &empty)?;
        let exclusions = list(
            obj.get("exclusions"),
            "exclusions",
            "exclusion-malformed",
            &empty,
        )?;
        let priority = list(
            obj.get("priority"),
            "priority",
            "priority-unknown-id",
            &empty,
        )?;
        if nodes.len() > MAX_NODES {
            return Err(Refusal::new("limit-exceeded", "maxNodes", None));
        }
        if edges.len() > MAX_EDGES {
            return Err(Refusal::new("limit-exceeded", "maxEdges", None));
        }
        if exclusions.len() > MAX_EXCLUSIONS {
            return Err(Refusal::new("limit-exceeded", "maxExclusions", None));
        }

        let mut ids = Vec::with_capacity(nodes.len());
        let mut index = HashMap::with_capacity(nodes.len());
        for (i, node) in nodes.iter().enumerate() {
            let node = node
                .as_object()
                .ok_or_else(|| Refusal::new("node-malformed", "nodes", Some(i)))?;
            if let Some(key) = node.keys().find(|k| k.as_str() != "id") {
                return Err(Refusal::new(
                    "unknown-field",
                    &format!("nodes.{}", truncate(key)),
                    Some(i),
                ));
            }
            let id = node
                .get("id")
                .ok_or_else(|| Refusal::new("node-malformed", "nodes", Some(i)))?;
            let id = id_text(id, "nodes", i)?;
            if index.insert(id.to_string(), i).is_some() {
                return Err(Refusal::new("duplicate-node-id", "nodes", Some(i)));
            }
            ids.push(id.to_string());
        }

        let mut links = Vec::new();
        let mut seen = std::collections::HashSet::new();
        let mut dangling = Vec::new();
        for (i, edge) in edges.iter().enumerate() {
            let edge = edge
                .as_object()
                .ok_or_else(|| Refusal::new("edge-malformed", "edges", Some(i)))?;
            if let Some(key) = edge
                .keys()
                .find(|k| !matches!(k.as_str(), "from" | "to" | "kind"))
            {
                return Err(Refusal::new(
                    "unknown-field",
                    &format!("edges.{}", truncate(key)),
                    Some(i),
                ));
            }
            let end = |name: &str| -> Result<&str, Refusal> {
                match edge.get(name) {
                    Some(Value::String(s)) if !s.is_empty() => {
                        id_text(&Value::String(s.clone()), "edges", i).map(|_| s.as_str())
                    }
                    _ => Err(Refusal::new(
                        "edge-malformed",
                        &format!("edges.{name}"),
                        Some(i),
                    )),
                }
            };
            let (from, to) = (end("from")?, end("to")?);
            let kind = match edge.get("kind") {
                Some(Value::String(k)) => EDGE_KINDS
                    .iter()
                    .position(|(name, _, _)| name == k)
                    .ok_or_else(|| Refusal::new("unknown-edge-kind", "edges.kind", Some(i)))?,
                _ => return Err(Refusal::new("edge-malformed", "edges.kind", Some(i))),
            };
            match (index.get(from), index.get(to)) {
                (Some(&f), Some(&t)) => {
                    let link = Link {
                        from: f,
                        to: t,
                        kind,
                    };
                    if seen.insert(link) {
                        links.push(link);
                    }
                }
                (f, t) => {
                    let mut missing = Vec::new();
                    if f.is_none() {
                        missing.push(from.to_string());
                    }
                    if t.is_none() && from != to {
                        missing.push(to.to_string());
                    }
                    dangling.push(crate::output::DanglingEntry {
                        source: crate::output::DanglingSource::Edge,
                        index: i,
                        from: Some(from.to_string()),
                        to: Some(to.to_string()),
                        a: None,
                        b: None,
                        missing,
                    });
                }
            }
        }

        let mut pairs = Vec::new();
        let mut seen_pairs = std::collections::HashSet::new();
        for (i, pair) in exclusions.iter().enumerate() {
            let pair = pair
                .as_object()
                .ok_or_else(|| Refusal::new("exclusion-malformed", "exclusions", Some(i)))?;
            if let Some(key) = pair.keys().find(|k| !matches!(k.as_str(), "a" | "b")) {
                return Err(Refusal::new(
                    "unknown-field",
                    &format!("exclusions.{}", truncate(key)),
                    Some(i),
                ));
            }
            let end = |name: &str| -> Result<&str, Refusal> {
                match pair.get(name) {
                    Some(Value::String(s)) if !s.is_empty() => {
                        id_text(&Value::String(s.clone()), "exclusions", i).map(|_| s.as_str())
                    }
                    _ => Err(Refusal::new(
                        "exclusion-malformed",
                        &format!("exclusions.{name}"),
                        Some(i),
                    )),
                }
            };
            let (a, b) = (end("a")?, end("b")?);
            if a == b {
                return Err(Refusal::new("exclusion-self-pair", "exclusions", Some(i)));
            }
            match (index.get(a), index.get(b)) {
                (Some(&x), Some(&y)) => {
                    let key = (x.min(y), x.max(y));
                    if seen_pairs.insert(key) {
                        pairs.push(key);
                    }
                }
                (x, y) => {
                    let mut missing = Vec::new();
                    if x.is_none() {
                        missing.push(a.to_string());
                    }
                    if y.is_none() {
                        missing.push(b.to_string());
                    }
                    dangling.push(crate::output::DanglingEntry {
                        source: crate::output::DanglingSource::Exclusion,
                        index: i,
                        from: None,
                        to: None,
                        a: Some(a.to_string()),
                        b: Some(b.to_string()),
                        missing,
                    });
                }
            }
        }

        let mut rank = vec![usize::MAX; ids.len()];
        let mut next = 0;
        for (i, entry) in priority.iter().enumerate() {
            let id = id_text(entry, "priority", i)?;
            let node = *index
                .get(id)
                .ok_or_else(|| Refusal::new("priority-unknown-id", "priority", Some(i)))?;
            if rank[node] != usize::MAX {
                return Err(Refusal::new("priority-duplicate", "priority", Some(i)));
            }
            rank[node] = next;
            next += 1;
        }
        for r in rank.iter_mut().filter(|r| **r == usize::MAX) {
            *r = next;
            next += 1;
        }

        Ok(Self {
            ids,
            index,
            links,
            exclusions: pairs,
            rank,
            dangling,
        })
    }
}

fn list<'a>(
    value: Option<&'a Value>,
    field: &str,
    code: &'static str,
    empty: &'a Vec<Value>,
) -> Result<&'a Vec<Value>, Refusal> {
    match value {
        None => Ok(empty),
        Some(Value::Array(items)) => Ok(items),
        Some(_) => Err(Refusal::new(code, field, None)),
    }
}

fn id_text<'a>(value: &'a Value, field: &str, index: usize) -> Result<&'a str, Refusal> {
    match value {
        Value::String(s) if s.is_empty() => Err(Refusal::new("id-empty", field, Some(index))),
        Value::String(s) if s.len() > MAX_ID_BYTES => {
            Err(Refusal::new("id-too-long", field, Some(index)))
        }
        Value::String(s) => Ok(s),
        _ => Err(Refusal::new("id-not-string", field, Some(index))),
    }
}

const DUPLICATE_KEY_MARK: &str = "duplicate-key:";

/// A JSON value read from text, refusing an object that repeats a key (`serde_json::Value` alone keeps the last).
struct Strict(Value);

impl<'de> serde::Deserialize<'de> for Strict {
    fn deserialize<D: serde::Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        struct V;
        impl<'de> serde::de::Visitor<'de> for V {
            type Value = Value;
            fn expecting(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
                f.write_str("a JSON value")
            }
            fn visit_unit<E>(self) -> Result<Value, E> {
                Ok(Value::Null)
            }
            fn visit_bool<E>(self, v: bool) -> Result<Value, E> {
                Ok(Value::Bool(v))
            }
            fn visit_i64<E>(self, v: i64) -> Result<Value, E> {
                Ok(v.into())
            }
            fn visit_u64<E>(self, v: u64) -> Result<Value, E> {
                Ok(v.into())
            }
            fn visit_f64<E>(self, v: f64) -> Result<Value, E> {
                Ok(serde_json::Number::from_f64(v).map_or(Value::Null, Value::Number))
            }
            fn visit_str<E>(self, v: &str) -> Result<Value, E> {
                Ok(Value::String(v.to_string()))
            }
            fn visit_string<E>(self, v: String) -> Result<Value, E> {
                Ok(Value::String(v))
            }
            fn visit_seq<A: serde::de::SeqAccess<'de>>(self, mut a: A) -> Result<Value, A::Error> {
                let mut items = Vec::new();
                while let Some(Strict(v)) = a.next_element()? {
                    items.push(v);
                }
                Ok(Value::Array(items))
            }
            fn visit_map<A: serde::de::MapAccess<'de>>(self, mut a: A) -> Result<Value, A::Error> {
                let mut map = serde_json::Map::new();
                while let Some((key, Strict(v))) = a.next_entry::<String, Strict>()? {
                    if map.contains_key(&key) {
                        return Err(serde::de::Error::custom(format!(
                            "{DUPLICATE_KEY_MARK}{}",
                            truncate(&key)
                        )));
                    }
                    map.insert(key, v);
                }
                Ok(Value::Object(map))
            }
        }
        d.deserialize_any(V).map(Strict)
    }
}

/// Field names echoed in a refusal are cut at the id-length limit, on a character boundary.
fn truncate(text: &str) -> String {
    let mut end = text.len().min(MAX_ID_BYTES);
    while !text.is_char_boundary(end) {
        end -= 1;
    }
    text[..end].to_string()
}
