use serde::Serialize;
use serde_json::Value;

use crate::facts::Facts;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Class {
    Blocking,
    Advisory,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Finding {
    pub code: &'static str,
    pub class: Class,
    pub check: &'static str,
    pub nodes: Vec<String>,
    pub evidence: Value,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum VerdictKind {
    Accept,
    AcceptWithAdvice,
    Reject,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Counts {
    pub nodes: usize,
    pub read_only_nodes: usize,
    pub declared_layers: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
pub struct Caveat {
    pub id: &'static str,
    pub text: &'static str,
}

/// The caveats that always travel with a verdict.
pub const CAVEATS: [Caveat; 2] = [
    Caveat {
        id: "lexical",
        text: "Path collisions are lexical: case folding, Unicode normalisation and symlinks are outside the rule. 'Disjoint' means disjoint as spelled.",
    },
    Caveat {
        id: "read-only-asserted",
        text: "readOnly is asserted by the caller and is not verified; a read-only unit is not checked for collisions.",
    },
];

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Verdict {
    pub verdict: VerdictKind,
    pub findings: Vec<Finding>,
    pub policy: Option<Value>,
    pub counts: Counts,
    pub read_only_nodes: Vec<String>,
    pub caveats: Vec<Caveat>,
}

/// The verdict derives from finding classes only.
fn derive(findings: &[Finding]) -> VerdictKind {
    if findings.iter().any(|f| f.class == Class::Blocking) {
        VerdictKind::Reject
    } else if findings.is_empty() {
        VerdictKind::Accept
    } else {
        VerdictKind::AcceptWithAdvice
    }
}

pub(crate) fn build(facts: &Facts, findings: Vec<Finding>, policy: Option<Value>) -> Verdict {
    let read_only_nodes: Vec<String> = facts
        .nodes
        .iter()
        .filter(|n| n.read_only)
        .map(|n| n.id.clone())
        .collect();
    Verdict {
        verdict: derive(&findings),
        counts: Counts {
            nodes: facts.nodes.len(),
            read_only_nodes: read_only_nodes.len(),
            declared_layers: facts.nodes.iter().filter(|n| n.layer.is_some()).count(),
        },
        findings,
        policy,
        read_only_nodes,
        caveats: CAVEATS.to_vec(),
    }
}
