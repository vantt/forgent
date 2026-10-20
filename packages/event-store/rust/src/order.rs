//! Placement, causal closure and deterministic Kahn ordering. No I/O.
use crate::{
    append::Positions,
    envelope::{Envelope, Scope},
    errors::{invalid, Error, ErrorCode},
};
use std::collections::{BTreeMap, BTreeSet, VecDeque};
pub fn stream_key(e: &Envelope) -> String {
    format!("{}:{}", e.origin, e.stream)
}
type Position = (String, u64);
type Key = (String, String, String, u64);
fn key(e: &Envelope) -> Key {
    (e.ts.clone(), e.origin.clone(), e.stream.clone(), e.seq)
}
/// Opaque proof of envelope validation, owned by a consumer's retained view.
/// Contains no Git observations; every read still observes refs and HEAD anew.
#[derive(Debug)]
pub struct VerifiedView {
    pub(crate) events: Vec<Envelope>,
}
#[derive(Debug, Default)]
pub struct Ordered {
    pub events: Vec<Envelope>,
    pub deferred: Vec<Envelope>,
    pub missing: BTreeSet<Position>,
    pub concurrent: Vec<(String, String)>,
}
fn dependencies(e: &Envelope) -> Vec<Position> {
    let mut out: Vec<_> = e.seen.iter().map(|(s, n)| (s.clone(), *n)).collect();
    if e.seq > 1 {
        out.push((stream_key(e), e.seq - 1));
    }
    out
}
/// `base` is trusted previously emitted coverage. Project placement contracts
/// promoted events into their promote node; other branch events stay hidden.
pub fn order(input: &[Envelope], base: &Positions, project: bool) -> Result<Ordered, Error> {
    order_retained(input, base, project, None)
}
pub(crate) fn order_retained(
    input: &[Envelope],
    base: &Positions,
    project: bool,
    view: Option<&VerifiedView>,
) -> Result<Ordered, Error> {
    let verified: BTreeMap<_, _> = view
        .into_iter()
        .flat_map(|v| &v.events)
        .map(|e| (e.h.as_str(), e))
        .collect();
    let mut unique = BTreeMap::new();
    for e in input {
        if verified.get(e.h.as_str()).copied() != Some(e) {
            e.validate()?;
        }
        let pos = (stream_key(e), e.seq);
        if let Some(old) = unique.insert(pos, e.clone()) {
            if old.h != e.h {
                return Err(Error::new(
                    ErrorCode::EventStoreSeqConflict,
                    "two hashes at one stream position",
                ));
            }
        }
    }
    let events: Vec<_> = unique
        .into_values()
        .filter(|e| e.seq > *base.get(&stream_key(e)).unwrap_or(&0))
        .collect();
    let mut claims: BTreeMap<(String, String), u64> = BTreeMap::new();
    if project {
        for e in &events {
            if e.event_type == "store.promote" {
                if let (Some(s), Some(n)) = (
                    e.payload["stream"].as_str(),
                    e.payload["throughSeq"].as_u64(),
                ) {
                    claims
                        .entry((e.origin.clone(), s.into()))
                        .and_modify(|high| *high = (*high).max(n))
                        .or_insert(n);
                }
            }
        }
    }
    let events: Vec<_> = events
        .into_iter()
        .filter(|e| {
            !project
                || e.scope == Scope::Project
                || claims
                    .get(&(e.origin.clone(), e.stream.clone()))
                    .is_some_and(|n| e.seq <= *n)
        })
        .collect();
    let positions: BTreeMap<_, _> = events
        .iter()
        .enumerate()
        .map(|(i, e)| ((stream_key(e), e.seq), i))
        .collect();
    // First obtain a causal ordering of promote claims, independent of input
    // enumeration, before assigning each branch position to its first claim.
    let singles: Vec<Vec<usize>> = (0..events.len()).map(|i| vec![i]).collect();
    let preliminary = sort_nodes(&events, &positions, &singles, base)?;
    let mut blocks = Vec::new();
    let mut assigned = BTreeSet::new();
    if project {
        for &i in preliminary.0.iter().chain(&preliminary.1) {
            let e = &events[i];
            if e.event_type != "store.promote" {
                continue;
            }
            if e.scope != Scope::Project {
                return Err(invalid("promote must be project scoped"));
            }
            let stream = e.payload["stream"]
                .as_str()
                .ok_or_else(|| invalid("promote stream missing"))?;
            if !stream.starts_with("branch:") || crate::layout::StreamId::parse(stream).is_err() {
                return Err(invalid("promote requires branch stream"));
            }
            let through = e.payload["throughSeq"]
                .as_u64()
                .filter(|n| *n > 0)
                .ok_or_else(|| invalid("invalid promote sequence"))?;
            if !e.payload["tip"]
                .as_str()
                .is_some_and(crate::validation::valid_object_id)
            {
                return Err(invalid("invalid promote tip"));
            }
            let mut members: Vec<_> = events
                .iter()
                .enumerate()
                .filter(|(j, b)| {
                    b.origin == e.origin
                        && b.stream == stream
                        && b.seq <= through
                        && !assigned.contains(j)
                })
                .map(|(j, _)| j)
                .collect();
            members.sort_by_key(|j| events[*j].seq);
            let mut block = vec![i];
            block.extend(members);
            assigned.extend(block.iter().copied());
            blocks.push(block);
        }
        for (i, e) in events.iter().enumerate() {
            if e.scope == Scope::Project && !assigned.contains(&i) {
                blocks.push(vec![i]);
            }
        }
    } else {
        blocks = singles;
    }
    let (indices, held, missing) = sort_nodes(&events, &positions, &blocks, base)?;
    let mut result = Ordered {
        events: indices.iter().map(|i| events[*i].clone()).collect(),
        deferred: held.iter().map(|i| events[*i].clone()).collect(),
        missing,
        concurrent: Vec::new(),
    };
    let mut prior: BTreeMap<String, BTreeMap<u64, &Envelope>> = BTreeMap::new();
    for b in &result.events {
        let own = stream_key(b);
        for (stream, events) in prior.iter().filter(|(s, _)| **s != own) {
            let through = b.seen.get(stream).copied().unwrap_or(0);
            for a in events
                .range((
                    std::ops::Bound::Excluded(through),
                    std::ops::Bound::Unbounded,
                ))
                .map(|(_, e)| e)
            {
                if a.seen.get(&own).copied().unwrap_or(0) < b.seq {
                    result.concurrent.push((a.h.clone(), b.h.clone()));
                }
            }
        }
        prior.entry(own).or_default().insert(b.seq, b);
    }
    Ok(result)
}
type SortResult = (Vec<usize>, Vec<usize>, BTreeSet<Position>);
fn sort_nodes(
    events: &[Envelope],
    positions: &BTreeMap<Position, usize>,
    blocks: &[Vec<usize>],
    base: &Positions,
) -> Result<SortResult, Error> {
    let owners: BTreeMap<_, _> = blocks
        .iter()
        .enumerate()
        .flat_map(|(n, b)| b.iter().map(move |i| (*i, n)))
        .collect();
    let mut deps = vec![BTreeSet::new(); blocks.len()];
    let mut next = vec![BTreeSet::new(); blocks.len()];
    let mut missing = BTreeSet::new();
    let mut deferred = BTreeSet::new();
    for (n, block) in blocks.iter().enumerate() {
        for i in block {
            for p in dependencies(&events[*i]) {
                if p.1 <= base.get(&p.0).copied().unwrap_or(0) {
                    continue;
                }
                match positions.get(&p).and_then(|i| owners.get(i)) {
                    Some(&other) if other != n => {
                        deps[n].insert(other);
                        next[other].insert(n);
                    }
                    Some(_) => (),
                    None => {
                        missing.insert(p);
                        deferred.insert(n);
                    }
                }
            }
            // A promote must wait for all named branch positions, even if the
            // missing tail has no event from which to infer a predecessor.
            if events[*i].event_type == "store.promote" {
                let e = &events[*i];
                if let (Some(s), Some(seq)) = (
                    e.payload["stream"].as_str(),
                    e.payload["throughSeq"].as_u64(),
                ) {
                    let p = (format!("{}:{s}", e.origin), seq);
                    if seq > base.get(&p.0).copied().unwrap_or(0) && !positions.contains_key(&p) {
                        missing.insert(p);
                        deferred.insert(n);
                    }
                }
            }
        }
    }
    let mut queue: VecDeque<_> = deferred.iter().copied().collect();
    while let Some(n) = queue.pop_front() {
        for &child in &next[n] {
            if deferred.insert(child) {
                queue.push_back(child);
            }
        }
    }
    let mut degree: Vec<_> = deps.iter().map(BTreeSet::len).collect();
    let mut ready = BTreeSet::new();
    for (n, b) in blocks.iter().enumerate() {
        if degree[n] == 0 {
            ready.insert((key(&events[b[0]]), n));
        }
    }
    let mut result = Vec::new();
    let mut held = Vec::new();
    let mut visited = 0;
    while let Some((_, n)) = ready.pop_first() {
        visited += 1;
        if deferred.contains(&n) {
            held.extend(&blocks[n]);
        } else {
            result.extend(&blocks[n]);
        }
        for &child in &next[n] {
            degree[child] -= 1;
            if degree[child] == 0 {
                ready.insert((key(&events[blocks[child][0]]), child));
            }
        }
    }
    if visited != blocks.len() {
        return Err(Error::new(
            ErrorCode::EventStoreOrderCycle,
            "causal graph contains a cycle",
        ));
    }
    Ok((result, held, missing))
}
