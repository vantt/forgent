//! The closed catalog: one function per check, run in catalog order.

use serde_json::{json, Value};

use crate::facts::Facts;
use crate::ruleset::Rule;
use crate::verdict::{Class, Finding};
use crate::{MAX_CLAIMS_PER_NODE, MAX_ENTRY_BYTES};

fn finding(
    code: &'static str,
    class: Class,
    check: &'static str,
    nodes: Vec<String>,
    evidence: Value,
) -> Finding {
    Finding {
        code,
        class,
        check,
        nodes,
        evidence,
    }
}

fn blocking(
    code: &'static str,
    check: &'static str,
    nodes: Vec<String>,
    evidence: Value,
) -> Finding {
    finding(code, Class::Blocking, check, nodes, evidence)
}

fn strings(v: Option<&Value>) -> Vec<String> {
    v.and_then(Value::as_array)
        .map(|a| {
            a.iter()
                .filter_map(|x| x.as_str().map(str::to_owned))
                .collect()
        })
        .unwrap_or_default()
}

fn no_cycles(f: &Facts) -> Vec<Finding> {
    f.cycles
        .iter()
        .map(|c| {
            blocking(
                "cycle",
                "no-cycles",
                strings(c.get("members")),
                json!({ "cycle": c.get("cycle"), "cycleKinds": c.get("cycleKinds") }),
            )
        })
        .collect()
}

fn no_dangling_edges(f: &Facts) -> Vec<Finding> {
    f.dangling
        .iter()
        .map(|d| {
            let missing = strings(d.get("missing"));
            let nodes = ["from", "a", "b"]
                .iter()
                .filter_map(|k| d.get(*k).and_then(Value::as_str))
                .filter(|id| !missing.iter().any(|m| m == id))
                .map(str::to_owned)
                .collect();
            blocking(
                "dangling-edge",
                "no-dangling-edges",
                nodes,
                json!({ "missing": missing, "source": d.get("source"), "index": d.get("index") }),
            )
        })
        .collect()
}

fn claims_declared(f: &Facts) -> Vec<Finding> {
    const CHECK: &str = "claims-declared";
    let mut out = Vec::new();
    for n in &f.nodes {
        let id = || vec![n.id.clone()];
        match (&n.claims, n.read_only) {
            (Some(c), true) if !c.is_empty() => {
                let refs: Vec<&str> = c.iter().map(|x| x.reference.as_str()).collect();
                out.push(blocking(
                    "read-only-with-claims",
                    CHECK,
                    id(),
                    json!({ "claims": refs }),
                ));
            }
            (None, false) => out.push(blocking(
                "claims-missing",
                CHECK,
                id(),
                json!("neither `claims` nor `readOnly: true` is given"),
            )),
            (Some(c), false) if c.is_empty() => out.push(blocking(
                "footprint-empty",
                CHECK,
                id(),
                json!("`claims` is an empty list and the node is not read-only"),
            )),
            _ => {}
        }
        if let Some(c) = &n.claims {
            if c.len() > MAX_CLAIMS_PER_NODE {
                out.push(blocking("claims-over-limit", CHECK, id(), json!({ "limit": "claims-per-node", "max": MAX_CLAIMS_PER_NODE, "value": c.len() })));
            }
            if let Some(long) = c.iter().find(|x| x.reference.len() > MAX_ENTRY_BYTES) {
                out.push(blocking("claims-over-limit", CHECK, id(), json!({ "limit": "entry-bytes", "max": MAX_ENTRY_BYTES, "value": long.reference.len() })));
            }
        }
    }
    for p in &f.problems {
        out.push(blocking(
            "footprint-entry-invalid",
            CHECK,
            vec![p.item.clone()],
            json!({ "entry": p.entry, "why": p.why }),
        ));
    }
    out
}

fn facts_not_truncated(f: &Facts) -> Vec<Finding> {
    f.truncated
        .iter()
        .map(|t| {
            blocking(
                "facts-truncated",
                "facts-not-truncated",
                Vec::new(),
                t.clone(),
            )
        })
        .collect()
}

fn no_exclusion_in_one_layer(f: &Facts) -> Vec<Finding> {
    const CHECK: &str = "no-exclusion-in-one-layer";
    // With no declared layer the check has nothing to judge; once any unit declares one, a pair
    // with an undeclared end cannot be shown to sit in different layers.
    if f.nodes.iter().all(|n| n.layer.is_none()) {
        return Vec::new();
    }
    f.exclusions
        .iter()
        .filter_map(|e| {
            let pair = vec![e.a.clone(), e.b.clone()];
            let (Some(la), Some(lb)) = (f.node(&e.a)?.layer, f.node(&e.b)?.layer) else {
                return Some(blocking(
                    "exclusion-layer-undeclared",
                    CHECK,
                    pair,
                    json!({ "shared": e.shared }),
                ));
            };
            (la == lb).then(|| {
                blocking(
                    "exclusion-in-one-layer",
                    CHECK,
                    pair,
                    json!({ "shared": e.shared, "layer": la }),
                )
            })
        })
        .collect()
}

fn declared_layers_valid(f: &Facts, class: Class) -> Vec<Finding> {
    const CHECK: &str = "declared-layers-valid";
    if f.nodes.iter().all(|n| n.layer.is_none()) {
        return Vec::new();
    }
    let mut out = Vec::new();
    for n in &f.nodes {
        let Some(layer) = n.layer else {
            out.push(finding(
                "layer-missing",
                class,
                CHECK,
                vec![n.id.clone()],
                json!("other units declare layers; this one does not"),
            ));
            continue;
        };
        for dep in n.depends_on.iter().filter_map(|d| f.node(d)) {
            if dep.layer.is_some_and(|dl| layer <= dl) {
                out.push(finding(
                    "layer-order-violation",
                    class,
                    CHECK,
                    vec![n.id.clone(), dep.id.clone()],
                    json!({ "layer": layer, "dependencyLayer": dep.layer }),
                ));
            }
        }
    }
    out
}

fn max_layer_width(f: &Facts, class: Class, max: usize) -> Vec<Finding> {
    let mut layers: Vec<u64> = f.nodes.iter().filter_map(|n| n.layer).collect();
    layers.sort_unstable();
    layers.dedup();
    layers
        .into_iter()
        .filter_map(|l| {
            let members: Vec<String> = f
                .nodes
                .iter()
                .filter(|n| n.layer == Some(l) && !n.read_only)
                .map(|n| n.id.clone())
                .collect();
            (members.len() > max).then(|| {
                finding(
                    "layer-width-exceeded",
                    class,
                    "max-layer-width",
                    members.clone(),
                    json!({ "layer": l, "width": members.len(), "max": max }),
                )
            })
        })
        .collect()
}

/// Findings of one check ordered by the input position of their first node; a finding with no node goes last.
fn by_node_position(f: &Facts, mut findings: Vec<Finding>) -> Vec<Finding> {
    findings.sort_by_key(|x| {
        x.nodes
            .first()
            .and_then(|id| f.index.get(id))
            .copied()
            .unwrap_or(usize::MAX)
    });
    findings
}

/// Floor first in catalog order, then the chosen non-floor rules in catalog order; within a check, by node input position.
pub(crate) fn run(f: &Facts, rules: &[Rule]) -> Vec<Finding> {
    let mut out = Vec::new();
    let mut add = |findings: Vec<Finding>| out.extend(by_node_position(f, findings));
    add(no_cycles(f));
    add(no_dangling_edges(f));
    add(claims_declared(f));
    add(facts_not_truncated(f));
    add(no_exclusion_in_one_layer(f));
    for r in rules.iter().filter(|r| r.check == "declared-layers-valid") {
        add(declared_layers_valid(f, r.class));
    }
    for r in rules.iter().filter(|r| r.check == "max-layer-width") {
        add(max_layer_width(f, r.class, r.max.unwrap_or(usize::MAX)));
    }
    out
}
