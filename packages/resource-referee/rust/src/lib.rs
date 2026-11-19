//! Applies a ruleset given as data to graph facts and node claims and returns findings plus a verdict; see docs/platform/resource-referee/spec.md.
//!
//! The crate reads no file, computes no hash and holds no default ruleset. A caller builds the facts (units,
//! the graph package's output, colliding pairs, write-scope problems, an optional truncation marker) and a
//! ruleset as JSON values, and reads a [`Verdict`] back. It never acts on the verdict.

mod catalog;
mod facts;
mod refusal;
mod ruleset;
mod verdict;

pub use refusal::Refusal;
pub use verdict::{Caveat, Class, Counts, Finding, Verdict, VerdictKind, CAVEATS};

/// Limits of `packages/resource-referee/contracts/resource-referee.v1.json`.
pub const MAX_NODES: usize = 20_000;
pub const MAX_CLAIMS_PER_NODE: usize = 512;
pub const MAX_ENTRY_BYTES: usize = 1024;
pub const MAX_ID_BYTES: usize = 256;
pub const MAX_RULES: usize = 200;
pub const MAX_EXCLUSIONS: usize = 100_000;
pub const MAX_PROBLEMS: usize = 100_000;

/// Judge `facts` under `ruleset`. `policy` is the opaque `{ source, sha256 }` identity the caller passes for
/// the echo. Any malformed input or set-level limit breach is a [`Refusal`] and no finding is produced.
pub fn evaluate(
    facts: &serde_json::Value,
    ruleset: &serde_json::Value,
    policy: Option<&serde_json::Value>,
) -> Result<Verdict, Refusal> {
    let rules = ruleset::parse(ruleset)?;
    let policy = ruleset::parse_policy(policy)?;
    let facts = facts::parse(facts)?;
    let findings = catalog::run(&facts, &rules);
    Ok(verdict::build(&facts, findings, policy))
}
