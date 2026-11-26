//! Composition of the rules in force into one ordered set: kind order, authority, specificity, override, refine, law
//! protection, and the conflict and dependency checks. Composition never picks a winner between rules that disagree:
//! it fails with every conflict it found, and it never reorders to make a relationship fit.
//!
//! Order of the result: kind (laws, boundaries, procedures, preferences, host adapters), then scope breadth, then the
//! unit's specificity, then authority (platform, component, domain), then source path, then id. An explicit
//! relationship (`depends_on`, a refining `refines`) is honoured inside that order; a relationship that would need
//! the reverse order is a conflict.

use std::collections::{BTreeMap, BTreeSet};

use crate::refusal::{Refusal, RefusalCode};
use crate::rule::{Authority, Kind, Lifecycle, Mode, RuleFile};

/// The reasons composition fails.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum ConflictCode {
    DuplicateActiveId,
    IncompatibleBoundaryAuthority,
    IllegalLawOverride,
    IllegalOverride,
    MissingDependency,
    IncompatibleOrdering,
    MutuallyExclusive,
}

impl ConflictCode {
    pub fn as_str(self) -> &'static str {
        match self {
            ConflictCode::DuplicateActiveId => "DUPLICATE_ACTIVE_ID",
            ConflictCode::IncompatibleBoundaryAuthority => "INCOMPATIBLE_BOUNDARY_AUTHORITY",
            ConflictCode::IllegalLawOverride => "ILLEGAL_LAW_OVERRIDE",
            ConflictCode::IllegalOverride => "ILLEGAL_OVERRIDE",
            ConflictCode::MissingDependency => "MISSING_DEPENDENCY",
            ConflictCode::IncompatibleOrdering => "INCOMPATIBLE_ORDERING",
            ConflictCode::MutuallyExclusive => "MUTUALLY_EXCLUSIVE",
        }
    }

    /// The refusal a conflict of this code is raised as at write time.
    fn refusal_code(self) -> RefusalCode {
        match self {
            ConflictCode::DuplicateActiveId => RefusalCode::IdDuplicate,
            ConflictCode::IllegalLawOverride => RefusalCode::LawOverridden,
            ConflictCode::MissingDependency => RefusalCode::DependencyNotInForce,
            ConflictCode::MutuallyExclusive => RefusalCode::ConflictInForce,
            ConflictCode::IncompatibleBoundaryAuthority
            | ConflictCode::IllegalOverride
            | ConflictCode::IncompatibleOrdering => RefusalCode::CompositionInvalid,
        }
    }
}

/// One conflict found by composition.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Conflict {
    pub code: ConflictCode,
    /// The refusal this conflict is raised as.
    pub refusal: RefusalCode,
    /// Rule ids involved, sorted and without repeats.
    pub ids: Vec<String>,
    pub sources: Vec<String>,
    pub message: String,
}

impl Conflict {
    pub fn to_refusal(&self) -> Refusal {
        let mut refusal = Refusal::new(
            self.refusal,
            format!("{}: {}", self.code.as_str(), self.message),
        )
        .with_ids(self.ids.iter().cloned());
        if let [one] = self.sources.as_slice() {
            refusal = refusal.with_source(one.clone());
        }
        refusal
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Operation {
    Append,
    Refine,
    Override,
    Forbid,
}

fn operation_of(u: &RuleFile) -> Operation {
    match u.unit.mode {
        Mode::Append if u.unit.refines.is_empty() => Operation::Append,
        Mode::Append | Mode::Refine => Operation::Refine,
        Mode::Override => Operation::Override,
        Mode::Forbid => Operation::Forbid,
    }
}

fn kind_rank(u: &RuleFile) -> u8 {
    u.unit.kind.rank()
}

fn scope_rank(u: &RuleFile) -> u32 {
    u.unit.scope.default_specificity()
}

type SortKey<'a> = (u8, u32, u32, u8, &'a str, &'a str);

fn sort_key(u: &RuleFile) -> SortKey<'_> {
    (
        kind_rank(u),
        scope_rank(u),
        u.unit.specificity,
        u.authority.rank(),
        u.source.as_str(),
        u.unit.id.as_str(),
    )
}

/// True when `before` may legally precede `after` under kind, then broad-to-narrow scope, then specificity.
fn order_permits(before: &RuleFile, after: &RuleFile) -> bool {
    if kind_rank(before) != kind_rank(after) {
        return kind_rank(before) < kind_rank(after);
    }
    if scope_rank(before) != scope_rank(after) {
        return scope_rank(before) < scope_rank(after);
    }
    before.unit.specificity <= after.unit.specificity
}

/// Two rules co-apply unless some `when:` key both carry has no value in common.
pub fn co_applies(a: &RuleFile, b: &RuleFile) -> bool {
    a.unit.when.iter().all(|(key, values)| {
        b.unit
            .when
            .get(key)
            .is_none_or(|other| values.iter().any(|v| other.contains(v)))
    })
}

struct Composer<'a> {
    registry_ids: BTreeSet<&'a str>,
    conflicts: Vec<Conflict>,
    seen: BTreeSet<String>,
}

impl<'a> Composer<'a> {
    fn conflict(&mut self, code: ConflictCode, involved: &[&RuleFile], message: String) {
        self.conflict_as(code, code.refusal_code(), involved, message);
    }

    fn conflict_as(
        &mut self,
        code: ConflictCode,
        refusal: RefusalCode,
        involved: &[&RuleFile],
        message: String,
    ) {
        let ids: BTreeSet<String> = involved.iter().map(|u| u.unit.id.clone()).collect();
        let sources: BTreeSet<String> = involved.iter().map(|u| u.source.clone()).collect();
        let ids: Vec<String> = ids.into_iter().collect();
        let key = format!("{}|{}|{}", code.as_str(), ids.join(","), message);
        if !self.seen.insert(key) {
            return;
        }
        self.conflicts.push(Conflict {
            code,
            refusal,
            ids,
            sources: sources.into_iter().collect(),
            message,
        });
    }
}

/// Composes the rules in force. `all` is every unit of the corpus (a rule named by a relationship may be absent from
/// the set in force and still exist); `in_force` holds the ids of the rules in force, as pkm answers them.
/// Returns the rules in composition order, or every conflict found.
pub fn compose(
    all: &[RuleFile],
    in_force: &BTreeSet<String>,
) -> Result<Vec<RuleFile>, Vec<Conflict>> {
    let mut c = Composer {
        registry_ids: all.iter().map(|u| u.unit.id.as_str()).collect(),
        conflicts: Vec::new(),
        seen: BTreeSet::new(),
    };

    // 1. The rules in force, each under an authority that may claim its scope.
    let mut cands: Vec<&RuleFile> = Vec::new();
    for u in all.iter().filter(|u| in_force.contains(&u.unit.id)) {
        if !u.authority.may_claim(u.unit.scope) {
            c.conflict(
                ConflictCode::IllegalOverride,
                &[u],
                format!(
                    "\"{}\" authority {} cannot claim scope \"{}\"",
                    u.unit.id,
                    u.authority.describe(),
                    u.unit.scope.as_str()
                ),
            );
            continue;
        }
        cands.push(u);
    }
    cands.sort_by(|a, b| sort_key(a).cmp(&sort_key(b)));
    let n = cands.len();

    // 2. Replacement legality: who may replace whom. A replaced rule stays in force until its valid_to.
    for &x in &cands {
        let (Lifecycle::Replaced, Some(successor)) =
            (x.unit.lifecycle, x.unit.superseded_by.as_deref())
        else {
            continue;
        };
        for y in all
            .iter()
            .filter(|y| y.unit.id == successor && !std::ptr::eq(*y, x))
        {
            if x.unit.kind == Kind::Law {
                if !(y.unit.kind == Kind::Law && y.authority == Authority::Platform) {
                    c.conflict(
                        ConflictCode::IllegalLawOverride,
                        &[y, x],
                        format!(
                            "law \"{}\" may only be replaced by a platform-authority law; \"{}\" is {} under {}",
                            x.unit.id,
                            y.unit.id,
                            y.unit.kind.as_str(),
                            y.authority.describe()
                        ),
                    );
                    continue;
                }
            } else if y.authority != Authority::Platform && y.unit.owner != x.unit.owner {
                c.conflict(
                    ConflictCode::IllegalOverride,
                    &[y, x],
                    format!(
                        "\"{}\" ({}) cannot replace \"{}\" owned by {}",
                        y.unit.id,
                        y.authority.describe(),
                        x.unit.id,
                        x.authority.describe()
                    ),
                );
                continue;
            }
            if y.unit.lifecycle == Lifecycle::Replaced
                && y.unit.superseded_by.as_deref() == Some(&x.unit.id)
            {
                c.conflict(
                    ConflictCode::IncompatibleOrdering,
                    &[y, x],
                    format!("\"{}\" and \"{}\" replace each other", y.unit.id, x.unit.id),
                );
            }
        }
    }

    // 3. Duplicate ids among the rules in force.
    let mut by_id: BTreeMap<&str, Vec<usize>> = BTreeMap::new();
    for (i, u) in cands.iter().enumerate() {
        by_id.entry(u.unit.id.as_str()).or_default().push(i);
    }
    let mut ambiguous: BTreeSet<&str> = BTreeSet::new();
    for (id, list) in &by_id {
        if list.len() > 1 {
            ambiguous.insert(id);
            let involved: Vec<&RuleFile> = list.iter().map(|&i| cands[i]).collect();
            c.conflict(
                ConflictCode::DuplicateActiveId,
                &involved,
                format!("rule id \"{id}\" is in force from {} files", list.len()),
            );
        }
    }
    let mut inactive: BTreeSet<usize> = BTreeSet::new();

    // 4. Override and forbid, narrow first so that a replaced rule's own overrides lapse with it.
    let mut narrow_first: Vec<usize> = (0..n).collect();
    narrow_first.sort_by(|&a, &b| {
        scope_rank(cands[b])
            .cmp(&scope_rank(cands[a]))
            .then(cands[b].unit.specificity.cmp(&cands[a].unit.specificity))
    });
    for i in narrow_first {
        if inactive.contains(&i) {
            continue;
        }
        let u = cands[i];
        let op = operation_of(u);
        if !matches!(op, Operation::Override | Operation::Forbid) {
            continue;
        }
        let verb = if op == Operation::Override {
            "override"
        } else {
            "forbid"
        };
        if u.unit.refines.is_empty() {
            c.conflict(
                ConflictCode::MissingDependency,
                &[u],
                format!(
                    "\"{}\" declares mode \"{verb}\" but names no target in refines",
                    u.unit.id
                ),
            );
            continue;
        }
        for target in &u.unit.refines {
            let Some(ti) = resolve(&by_id, &ambiguous, &inactive, target) else {
                missing(&mut c, &ambiguous, u, &format!("{verb}s"), target);
                continue;
            };
            let t = cands[ti];
            if t.unit.kind == Kind::Law {
                c.conflict(
                    ConflictCode::IllegalLawOverride,
                    &[u, t],
                    format!(
                        "\"{}\" ({}) attempts to {verb} law \"{}\"; laws cannot be overridden by narrower scopes",
                        u.unit.id,
                        u.unit.scope.as_str(),
                        t.unit.id
                    ),
                );
                continue;
            }
            if t.unit.kind == Kind::Boundary {
                c.conflict(
                    ConflictCode::IncompatibleBoundaryAuthority,
                    &[u, t],
                    format!(
                        "\"{}\" attempts to {verb} boundary \"{}\"; boundary authority conflicts fail instead of picking a winner",
                        u.unit.id, t.unit.id
                    ),
                );
                continue;
            }
            if u.unit.kind == Kind::HostAdapter {
                c.conflict(
                    ConflictCode::IllegalOverride,
                    &[u, t],
                    format!(
                        "host adapter \"{}\" cannot {verb} \"{}\"; host adapters cannot change semantic meaning",
                        u.unit.id, t.unit.id
                    ),
                );
                continue;
            }
            if t.unit.kind != Kind::Preference {
                c.conflict(
                    ConflictCode::IllegalOverride,
                    &[u, t],
                    format!(
                        "\"{}\" attempts to {verb} {} \"{}\"; only preferences permit override",
                        u.unit.id,
                        t.unit.kind.as_str(),
                        t.unit.id
                    ),
                );
                continue;
            }
            if scope_rank(u) <= scope_rank(t) {
                c.conflict(
                    ConflictCode::IncompatibleOrdering,
                    &[u, t],
                    format!(
                        "\"{}\" (scope {}) {verb}s \"{}\" (scope {}) at equal or broader scope; no ordered winner without replacement",
                        u.unit.id,
                        u.unit.scope.as_str(),
                        t.unit.id,
                        t.unit.scope.as_str()
                    ),
                );
                continue;
            }
            inactive.insert(ti);
        }
    }

    // 5. Refine, depends_on and conflicts_with against the final active set.
    let mut edges: Vec<BTreeSet<usize>> = vec![BTreeSet::new(); n];
    let mut pairs: BTreeSet<String> = BTreeSet::new();
    for i in (0..n).filter(|i| !inactive.contains(i)) {
        let u = cands[i];
        if operation_of(u) == Operation::Refine {
            for target in &u.unit.refines {
                let Some(ti) = resolve(&by_id, &ambiguous, &inactive, target) else {
                    missing(&mut c, &ambiguous, u, "refines", target);
                    continue;
                };
                let t = cands[ti];
                if t.unit.kind == Kind::Boundary && t.unit.owner != u.unit.owner {
                    c.conflict(
                        ConflictCode::IncompatibleBoundaryAuthority,
                        &[u, t],
                        format!(
                            "\"{}\" ({}) attempts to refine boundary \"{}\" owned by {}",
                            u.unit.id,
                            u.authority.describe(),
                            t.unit.id,
                            t.authority.describe()
                        ),
                    );
                    continue;
                }
                add_edge(&mut c, &mut edges, (ti, t), (i, u), "refines");
            }
        }
        for dep in &u.unit.depends_on {
            let Some(ti) = resolve(&by_id, &ambiguous, &inactive, dep) else {
                missing(&mut c, &ambiguous, u, "depends on", dep);
                continue;
            };
            add_edge(&mut c, &mut edges, (ti, cands[ti]), (i, u), "depends on");
        }
        for other in &u.unit.conflicts_with {
            if !c.registry_ids.contains(other.as_str()) {
                c.conflict(
                    ConflictCode::MissingDependency,
                    &[u],
                    format!("\"{}\" conflicts with unknown rule \"{other}\"", u.unit.id),
                );
                continue;
            }
            let Some(ti) = resolve(&by_id, &ambiguous, &inactive, other) else {
                continue;
            };
            let t = cands[ti];
            if ti == i || !co_applies(u, t) {
                continue;
            }
            let mut pair = [u.unit.id.as_str(), t.unit.id.as_str()];
            pair.sort_unstable();
            if !pairs.insert(pair.join("|")) {
                continue;
            }
            if u.unit.kind == Kind::Boundary && t.unit.kind == Kind::Boundary {
                c.conflict_as(
                    ConflictCode::IncompatibleBoundaryAuthority,
                    RefusalCode::ConflictInForce,
                    &[u, t],
                    format!(
                        "boundaries \"{}\" ({}) and \"{}\" ({}) assign incompatible authority",
                        u.unit.id,
                        u.authority.describe(),
                        t.unit.id,
                        t.authority.describe()
                    ),
                );
            } else {
                c.conflict(
                    ConflictCode::MutuallyExclusive,
                    &[u, t],
                    format!(
                        "\"{}\" and \"{}\" are mutually exclusive and both in force",
                        u.unit.id, t.unit.id
                    ),
                );
            }
        }
    }

    // 6. Order: Kahn's algorithm, smallest base key first. Every edge already points forward in the base order.
    let active: Vec<usize> = (0..n).filter(|i| !inactive.contains(i)).collect();
    let mut indegree = vec![0usize; n];
    for &i in &active {
        for &after in &edges[i] {
            indegree[after] += 1;
        }
    }
    let mut pending = active;
    let mut ordered: Vec<usize> = Vec::new();
    while let Some(pos) = pending.iter().position(|&i| indegree[i] == 0) {
        let i = pending.remove(pos);
        ordered.push(i);
        for &after in &edges[i] {
            indegree[after] -= 1;
        }
    }
    if !pending.is_empty() {
        let involved: Vec<&RuleFile> = pending.iter().map(|&i| cands[i]).collect();
        let mut names: Vec<&str> = involved.iter().map(|u| u.unit.id.as_str()).collect();
        names.sort_unstable();
        c.conflict(
            ConflictCode::IncompatibleOrdering,
            &involved,
            format!("dependency cycle among: {}", names.join(", ")),
        );
    }

    if !c.conflicts.is_empty() {
        let mut conflicts = c.conflicts;
        conflicts.sort_by(|a, b| {
            (a.code.as_str(), &a.ids, &a.message).cmp(&(b.code.as_str(), &b.ids, &b.message))
        });
        return Err(conflicts);
    }
    Ok(ordered.into_iter().map(|i| cands[i].clone()).collect())
}

/// The single rule in force and not retired by an override that `id` names; `None` when absent or ambiguous.
fn resolve(
    by_id: &BTreeMap<&str, Vec<usize>>,
    ambiguous: &BTreeSet<&str>,
    inactive: &BTreeSet<usize>,
    id: &str,
) -> Option<usize> {
    if ambiguous.contains(id) {
        return None;
    }
    match by_id.get(id).map(Vec::as_slice) {
        Some([only]) if !inactive.contains(only) => Some(*only),
        _ => None,
    }
}

fn missing(
    c: &mut Composer<'_>,
    ambiguous: &BTreeSet<&str>,
    u: &RuleFile,
    relation: &str,
    target: &str,
) {
    if !c.registry_ids.contains(target) {
        c.conflict(
            ConflictCode::MissingDependency,
            &[u],
            format!("\"{}\" {relation} unknown rule \"{target}\"", u.unit.id),
        );
    } else if !ambiguous.contains(target) {
        c.conflict(
            ConflictCode::MissingDependency,
            &[u],
            format!(
                "\"{}\" {relation} \"{target}\", which is not in force",
                u.unit.id
            ),
        );
    }
}

fn add_edge(
    c: &mut Composer<'_>,
    edges: &mut [BTreeSet<usize>],
    before: (usize, &RuleFile),
    after: (usize, &RuleFile),
    relation: &str,
) {
    let (bi, b) = before;
    let (ai, a) = after;
    if bi == ai {
        c.conflict(
            ConflictCode::IncompatibleOrdering,
            &[a],
            format!("\"{}\" {relation} itself", a.unit.id),
        );
        return;
    }
    if !order_permits(b, a) {
        c.conflict(
            ConflictCode::IncompatibleOrdering,
            &[b, a],
            format!(
                "\"{}\" ({}, specificity {}) {relation} \"{}\" ({}, specificity {}) but composition order places \"{}\" first",
                a.unit.id,
                a.unit.kind.as_str(),
                a.unit.specificity,
                b.unit.id,
                b.unit.kind.as_str(),
                b.unit.specificity,
                a.unit.id
            ),
        );
        return;
    }
    edges[bi].insert(ai);
}
