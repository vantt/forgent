use std::collections::{HashMap, HashSet};

use serde_json::Value;

use crate::refusal::Refusal;
use crate::ruleset::{object, only_fields};
use crate::{MAX_EXCLUSIONS, MAX_ID_BYTES, MAX_NODES, MAX_PROBLEMS};

pub(crate) const SPACES: [&str; 3] = ["path", "ref", "port"];

#[derive(Debug, Clone)]
pub(crate) struct Claim {
    pub reference: String,
}

#[derive(Debug, Clone)]
pub(crate) struct Node {
    pub id: String,
    /// `None` when the unit gave no `claims`.
    pub claims: Option<Vec<Claim>>,
    pub read_only: bool,
    pub depends_on: Vec<String>,
    pub layer: Option<u64>,
}

#[derive(Debug, Clone)]
pub(crate) struct Exclusion {
    pub a: String,
    pub b: String,
    pub shared: Value,
}

#[derive(Debug, Clone)]
pub(crate) struct Problem {
    pub item: String,
    pub entry: Value,
    pub why: Value,
}

pub(crate) struct Facts {
    pub nodes: Vec<Node>,
    /// Node id to input position, built once.
    pub index: HashMap<String, usize>,
    pub cycles: Vec<Value>,
    pub dangling: Vec<Value>,
    pub exclusions: Vec<Exclusion>,
    pub problems: Vec<Problem>,
    pub truncated: Option<Value>,
}

fn list<'a>(
    v: &'a Value,
    field: &str,
    index: Option<usize>,
    code: &'static str,
) -> Result<&'a Vec<Value>, Refusal> {
    v.as_array().ok_or_else(|| Refusal::new(code, field, index))
}

fn string(v: &Value, field: &str, i: usize, code: &'static str) -> Result<String, Refusal> {
    v.as_str()
        .map(str::to_owned)
        .ok_or_else(|| Refusal::new(code, field, Some(i)))
}

fn node(raw: &Value, i: usize) -> Result<Node, Refusal> {
    let m = object(raw, "facts.nodes", Some(i))
        .map_err(|_| Refusal::new("node-malformed", "facts.nodes", Some(i)))?;
    only_fields(
        m,
        &["id", "claims", "readOnly", "dependsOn", "layer"],
        "facts.nodes",
        Some(i),
    )?;
    let id = match m.get("id").and_then(Value::as_str) {
        Some(s) if !s.is_empty() => s.to_owned(),
        _ => return Err(Refusal::new("node-malformed", "facts.nodes.id", Some(i))),
    };
    if id.len() > MAX_ID_BYTES {
        return Err(Refusal::new("id-too-long", "facts.nodes.id", Some(i)));
    }
    let claims = match m.get("claims") {
        None => None,
        Some(c) => {
            let items = list(c, "facts.nodes.claims", Some(i), "claim-malformed")?;
            let mut out = Vec::with_capacity(items.len());
            for raw in items {
                let cm = object(raw, "facts.nodes.claims", Some(i))
                    .map_err(|_| Refusal::new("claim-malformed", "facts.nodes.claims", Some(i)))?;
                only_fields(cm, &["space", "ref"], "facts.nodes.claims", Some(i))?;
                match cm.get("space").and_then(Value::as_str) {
                    Some(s) if SPACES.contains(&s) => {}
                    Some(_) => {
                        return Err(Refusal::new(
                            "claim-space-unknown",
                            "facts.nodes.claims.space",
                            Some(i),
                        ))
                    }
                    None => {
                        return Err(Refusal::new(
                            "claim-malformed",
                            "facts.nodes.claims.space",
                            Some(i),
                        ))
                    }
                }
                let reference = cm.get("ref").and_then(Value::as_str).ok_or_else(|| {
                    Refusal::new("claim-malformed", "facts.nodes.claims.ref", Some(i))
                })?;
                out.push(Claim {
                    reference: reference.to_owned(),
                });
            }
            Some(out)
        }
    };
    let read_only = match m.get("readOnly") {
        None => false,
        Some(v) => v
            .as_bool()
            .ok_or_else(|| Refusal::new("node-malformed", "facts.nodes.readOnly", Some(i)))?,
    };
    let depends_on = match m.get("dependsOn") {
        None => Vec::new(),
        Some(d) => {
            let mut seen = HashSet::new();
            let mut out = Vec::new();
            for x in list(d, "facts.nodes.dependsOn", Some(i), "node-malformed")? {
                let dep = string(x, "facts.nodes.dependsOn", i, "node-malformed")?;
                if seen.insert(dep.clone()) {
                    out.push(dep);
                }
            }
            out
        }
    };
    let layer = match m.get("layer") {
        None => None,
        Some(v) => Some(
            v.as_u64()
                .filter(|l| *l >= 1)
                .ok_or_else(|| Refusal::new("node-malformed", "facts.nodes.layer", Some(i)))?,
        ),
    };
    Ok(Node {
        id,
        claims,
        read_only,
        depends_on,
        layer,
    })
}

fn exclusion(raw: &Value, i: usize) -> Result<Exclusion, Refusal> {
    let m = object(raw, "facts.exclusions", Some(i))?;
    only_fields(m, &["a", "b", "shared"], "facts.exclusions", Some(i))?;
    let end = |k: &str| match m.get(k).and_then(Value::as_str) {
        Some(s) => Ok(s.to_owned()),
        None => Err(Refusal::new(
            "input-not-object",
            format!("facts.exclusions.{k}"),
            Some(i),
        )),
    };
    Ok(Exclusion {
        a: end("a")?,
        b: end("b")?,
        shared: m.get("shared").cloned().unwrap_or(Value::Null),
    })
}

fn problem(raw: &Value, i: usize) -> Result<Problem, Refusal> {
    let m = object(raw, "facts.problems", Some(i))?;
    only_fields(
        m,
        &["item", "code", "entry", "why"],
        "facts.problems",
        Some(i),
    )?;
    if m.get("code").and_then(Value::as_str) != Some("entry-invalid") {
        return Err(Refusal::new(
            "claim-malformed",
            "facts.problems.code",
            Some(i),
        ));
    }
    let item = m
        .get("item")
        .and_then(Value::as_str)
        .ok_or_else(|| Refusal::new("claim-malformed", "facts.problems.item", Some(i)))?
        .to_owned();
    Ok(Problem {
        item,
        entry: m.get("entry").cloned().unwrap_or(Value::Null),
        why: m.get("why").cloned().unwrap_or(Value::Null),
    })
}

impl Facts {
    pub(crate) fn node(&self, id: &str) -> Option<&Node> {
        self.index.get(id).map(|&i| &self.nodes[i])
    }
}

pub(crate) fn parse(facts: &Value) -> Result<Facts, Refusal> {
    let top = object(facts, "facts", None)?;
    only_fields(
        top,
        &["nodes", "graph", "exclusions", "problems", "truncated"],
        "facts",
        None,
    )?;
    let raw_nodes = top
        .get("nodes")
        .map(|v| list(v, "facts.nodes", None, "input-not-object"))
        .transpose()?
        .ok_or_else(|| Refusal::new("input-not-object", "facts.nodes", None))?;
    if raw_nodes.len() > MAX_NODES {
        return Err(Refusal::new(
            "limit-exceeded",
            "facts.nodes",
            Some(MAX_NODES),
        ));
    }
    let optional = |key: &str, limit: usize| -> Result<Vec<Value>, Refusal> {
        match top.get(key) {
            None | Some(Value::Null) => Ok(Vec::new()),
            Some(v) => {
                let items = list(v, &format!("facts.{key}"), None, "input-not-object")?;
                if items.len() > limit {
                    return Err(Refusal::new(
                        "limit-exceeded",
                        format!("facts.{key}"),
                        Some(limit),
                    ));
                }
                Ok(items.clone())
            }
        }
    };
    let raw_exclusions = optional("exclusions", MAX_EXCLUSIONS)?;
    let raw_problems = optional("problems", MAX_PROBLEMS)?;

    let mut nodes = Vec::with_capacity(raw_nodes.len());
    let mut index = HashMap::with_capacity(raw_nodes.len());
    for (i, raw) in raw_nodes.iter().enumerate() {
        let n = node(raw, i)?;
        if index.insert(n.id.clone(), i).is_some() {
            return Err(Refusal::new("duplicate-node-id", "facts.nodes.id", Some(i)));
        }
        nodes.push(n);
    }
    let graph = object(
        top.get("graph")
            .ok_or_else(|| Refusal::new("input-not-object", "facts.graph", None))?,
        "facts.graph",
        None,
    )?;
    let part = |key: &str| -> Result<Vec<Value>, Refusal> {
        match graph.get(key) {
            None => Ok(Vec::new()),
            Some(v) => {
                Ok(list(v, &format!("facts.graph.{key}"), None, "input-not-object")?.clone())
            }
        }
    };
    let truncated = match top.get("truncated") {
        None | Some(Value::Null) => None,
        Some(t) => {
            let m = object(t, "facts.truncated", None)?;
            only_fields(m, &["reason", "limit", "source"], "facts.truncated", None)?;
            Some(t.clone())
        }
    };
    let exclusions: Vec<Exclusion> = raw_exclusions
        .iter()
        .enumerate()
        .map(|(i, r)| exclusion(r, i))
        .collect::<Result<_, _>>()?;
    for (i, e) in exclusions.iter().enumerate() {
        for (end, field) in [(&e.a, "facts.exclusions.a"), (&e.b, "facts.exclusions.b")] {
            if !index.contains_key(end) {
                return Err(Refusal::new("unknown-node-id", field, Some(i)));
            }
        }
    }
    let problems: Vec<Problem> = raw_problems
        .iter()
        .enumerate()
        .map(|(i, r)| problem(r, i))
        .collect::<Result<_, _>>()?;
    for (i, p) in problems.iter().enumerate() {
        if !index.contains_key(&p.item) {
            return Err(Refusal::new(
                "unknown-node-id",
                "facts.problems.item",
                Some(i),
            ));
        }
    }
    Ok(Facts {
        nodes,
        index,
        cycles: part("cycles")?,
        dangling: part("dangling")?,
        exclusions,
        problems,
        truncated,
    })
}
