//! Complete certified-commit walk through Git's typed Inspect port.
use crate::{
    append::Positions,
    envelope::{sha256, Envelope, Scope, Seal},
    errors::{invalid, Error, ErrorCode},
    layout::StreamId,
    open_read::decode,
};
use fgos_git::{Inspect, Oid, PathValue, RepoHandle, WalkBounds};
use std::collections::{BTreeMap, BTreeSet};
pub(crate) fn git_error(e: fgos_git::OperationError) -> Error {
    let mut detail = format!("Git: {}", e.cause);
    if let Some(code) = e.exit_code {
        detail.push_str(&format!(" (exit {code})"));
    }
    if let Some(signal) = e.signal {
        detail.push_str(&format!(" (signal {signal})"));
    }
    let stderr = String::from_utf8_lossy(&e.stderr);
    if !stderr.trim().is_empty() {
        detail.push_str(&format!(": {}", stderr.trim()));
    }
    Error::new(ErrorCode::EventStoreIo, detail)
}
pub fn blob(
    port: &dyn Inspect,
    repo: &RepoHandle,
    oid: &Oid,
    path: &[u8],
) -> Result<Option<Vec<u8>>, Error> {
    let mut values = port
        .read_paths_at(repo, oid, &[path.to_vec()], 32 * 1024 * 1024)
        .map_err(git_error)?;
    match values
        .pop()
        .ok_or_else(|| invalid("missing path observation"))?
        .value
    {
        PathValue::Blob(b) => Ok(Some(b)),
        PathValue::Absent => Ok(None),
        PathValue::Error(e) => Err(git_error(e)),
        PathValue::NotABlob(_) => Err(invalid("expected blob")),
    }
}
pub fn header(port: &dyn Inspect, repo: &RepoHandle, oid: &Oid) -> Result<Seal, Error> {
    let bytes = blob(port, repo, oid, b"seal.json")?
        .ok_or_else(|| Error::new(ErrorCode::EventStoreGap, "seal.json missing"))?;
    parse_header(&bytes)
}
fn parse_header(bytes: &[u8]) -> Result<Seal, Error> {
    let seal: Seal = serde_json::from_slice(bytes).map_err(|e| invalid(e.to_string()))?;
    if seal.canonical_line()? != bytes {
        return Err(invalid("noncanonical seal"));
    }
    Ok(seal)
}
#[derive(Debug, Default)]
pub struct Walked {
    pub events: Vec<Envelope>,
    pub published: Positions,
    pub visited: BTreeSet<String>,
}
/// Commits whose blobs one `read_paths_at_many` call returns.
const READ_GROUP: usize = 64;
/// Never mutates supplied coverage/certificates, including on an error after
/// several successful pages. Git owns traversal, stops and object decoding.
pub fn walk(
    port: &dyn Inspect,
    repo: &RepoHandle,
    tips: &[Oid],
    cover: &Positions,
    certified: &BTreeSet<String>,
) -> Result<Walked, Error> {
    walk_inner(port, repo, tips, cover, certified, None)
}
pub fn walk_verified(
    port: &dyn Inspect,
    repo: &RepoHandle,
    tip: &Oid,
    cover: &Positions,
    certified: &BTreeSet<String>,
    machine: &str,
    scope: Scope,
) -> Result<Walked, Error> {
    walk_inner(
        port,
        repo,
        std::slice::from_ref(tip),
        cover,
        certified,
        Some((machine, scope)),
    )
}
fn walk_inner(
    port: &dyn Inspect,
    repo: &RepoHandle,
    tips: &[Oid],
    cover: &Positions,
    certified: &BTreeSet<String>,
    identity: Option<(&str, Scope)>,
) -> Result<Walked, Error> {
    let mut scopes: BTreeMap<String, Scope> = tips
        .iter()
        .map(|o| {
            (
                o.as_str().into(),
                identity.map(|i| i.1).unwrap_or(Scope::Project),
            )
        })
        .collect();
    let mut machines: BTreeMap<String, Option<String>> = tips
        .iter()
        .map(|tip| (tip.as_str().into(), identity.map(|i| i.0.to_owned())))
        .collect();
    let stops = certified
        .iter()
        .map(|s| Oid::parse(s, repo.object_format()).map_err(|e| invalid(e.to_string())))
        .collect::<Result<Vec<_>, _>>()?;
    let mut cursor = None;
    let mut out = Walked::default();
    loop {
        let page = port
            .walk_commits(
                repo,
                tips,
                &stops,
                cursor,
                WalkBounds {
                    max_commits: 256,
                    max_bytes: 4 * 1024 * 1024,
                },
            )
            .map_err(git_error)?;
        let mut pending = Vec::new();
        for commit in page.commits {
            if !out.visited.insert(commit.oid.as_str().into()) {
                continue;
            }
            if certified.contains(commit.oid.as_str()) && identity.is_none() {
                continue;
            }
            let paths = if certified.contains(commit.oid.as_str()) {
                vec![b"seal.json".to_vec()]
            } else {
                vec![b"seal.json".to_vec(), b"events.jsonl".to_vec()]
            };
            pending.push((commit, paths));
        }
        // One object-database process per group, not per commit; the group
        // bound keeps the segments held in memory at once small.
        while !pending.is_empty() {
            let group: Vec<_> = pending.drain(..pending.len().min(READ_GROUP)).collect();
            let reads: Vec<_> = group
                .iter()
                .map(|(commit, paths)| (commit.oid.clone(), paths.clone()))
                .collect();
            let answers = port
                .read_paths_at_many(repo, &reads, 32 * 1024 * 1024)
                .map_err(git_error)?;
            if answers.len() != group.len() {
                return Err(invalid("path observations do not match the commits read"));
            }
            for ((commit, _), answer) in group.into_iter().zip(answers) {
                let mut observed = answer.into_iter();
                let seal = match observed.next().map(|p| p.value) {
                    Some(PathValue::Blob(bytes)) => parse_header(&bytes)?,
                    Some(PathValue::Error(e)) => return Err(git_error(e)),
                    _ => return Err(Error::new(ErrorCode::EventStoreGap, "seal.json missing")),
                };
                let scope = scopes
                    .get(commit.oid.as_str())
                    .copied()
                    .unwrap_or(Scope::Project);
                let actual_machine = match &seal {
                    Seal::Seal { machine_id, .. } | Seal::Merge { machine_id, .. } => {
                        Some(machine_id.clone())
                    }
                    Seal::Legacy { .. } => None,
                };
                if identity.is_some() {
                    let expected_machine = machines
                        .get(commit.oid.as_str())
                        .and_then(|m| m.as_deref())
                        .or(actual_machine.as_deref())
                        .ok_or_else(|| invalid("legacy in event ancestry"))?;
                    verify_tip(&seal, expected_machine, scope)?;
                }
                if identity.is_some() {
                    machines.insert(commit.oid.as_str().into(), actual_machine.clone());
                }
                let merge_commit = matches!(&seal, Seal::Merge { .. });
                if certified.contains(commit.oid.as_str()) {
                    continue;
                }
                let mut promoted_parent = None;
                match seal {
                    Seal::Seal {
                        origin,
                        stream,
                        scope,
                        first_seq,
                        last_seq,
                        count,
                        sha256: hash,
                        ..
                    } => {
                        out.published
                            .entry(format!("{origin}:{stream}"))
                            .and_modify(|n| *n = (*n).max(last_seq))
                            .or_insert(last_seq);
                        let bytes = match observed.next().map(|p| p.value) {
                            Some(PathValue::Blob(bytes)) => bytes,
                            Some(PathValue::Error(e)) => return Err(git_error(e)),
                            _ => return Err(invalid("seal events missing")),
                        };
                        if sha256(&bytes) != hash {
                            return Err(Error::new(
                                ErrorCode::EventStoreSealMismatch,
                                "segment digest mismatch",
                            ));
                        }
                        let framed = decode(&bytes, &origin, &StreamId::parse(&stream)?, true)
                            .map_err(|e| {
                                Error::new(ErrorCode::EventStoreRefTampered, e.to_string())
                            })?;
                        if framed.events.first().map(|e| e.seq) != Some(first_seq)
                            || framed.events.last().map(|e| e.seq) != Some(last_seq)
                            || framed.events.len() as u64 != count
                            || framed.events.iter().any(|e| e.scope != scope)
                        {
                            return Err(Error::new(
                                ErrorCode::EventStoreRefTampered,
                                "seal/event identity, scope or range mismatch",
                            ));
                        }
                        if let Some((index, parent)) = commit.parents.iter().enumerate().next_back()
                        {
                            if framed.events.iter().any(|e| {
                                e.event_type == "store.promote"
                                    && e.payload["tip"].as_str() == Some(parent.as_str())
                            }) {
                                promoted_parent = Some(index);
                            }
                        }
                        if identity.is_some()
                            && ((commit.parents.len() > 1 && promoted_parent.is_none())
                                || (promoted_parent.is_some()
                                    && (scope != Scope::Project || commit.parents.len() > 2))
                                || (framed
                                    .events
                                    .iter()
                                    .any(|e| e.event_type == "store.promote")
                                    && promoted_parent.is_none()))
                        {
                            return Err(Error::new(
                                ErrorCode::EventStoreRefTampered,
                                "invalid promote ancestry",
                            ));
                        }
                        let high = cover
                            .get(&format!("{origin}:{stream}"))
                            .copied()
                            .unwrap_or(0);
                        out.events
                            .extend(framed.events.into_iter().filter(|e| e.seq > high));
                    }
                    Seal::Merge { parents, .. } => {
                        if commit
                            .parents
                            .iter()
                            .map(|p| p.as_str())
                            .collect::<Vec<_>>()
                            != parents.iter().map(String::as_str).collect::<Vec<_>>()
                        {
                            return Err(invalid("merge parent mismatch"));
                        }
                    }
                    Seal::Legacy { .. } => return Err(invalid("legacy ref passed to event walk")),
                }
                for (index, parent) in commit.parents.iter().enumerate() {
                    // The mirror side of a merge is another machine's ref. Its
                    // header establishes that chain's machine; first-parent and
                    // promote ancestry retain their actual source machine.
                    let expected_machine = if merge_commit && index == 1 {
                        None
                    } else {
                        actual_machine.clone()
                    };
                    match machines.entry(parent.as_str().into()) {
                        std::collections::btree_map::Entry::Vacant(e) => {
                            e.insert(expected_machine);
                        }
                        std::collections::btree_map::Entry::Occupied(mut e) => {
                            if identity.is_some()
                                && e.get().is_some()
                                && expected_machine.is_some()
                                && e.get() != &expected_machine
                            {
                                return Err(Error::new(
                                    ErrorCode::EventStoreRefTampered,
                                    "ancestor reached through incompatible machine identities",
                                ));
                            }
                            if e.get().is_none() {
                                e.insert(expected_machine);
                            }
                        }
                    }
                    let expected = if promoted_parent == Some(index) {
                        Scope::Branch
                    } else {
                        scope
                    };
                    if scopes
                        .insert(parent.as_str().into(), expected)
                        .is_some_and(|old| old != expected)
                        && identity.is_some()
                    {
                        return Err(Error::new(
                            ErrorCode::EventStoreRefTampered,
                            "ancestor reached through incompatible scopes",
                        ));
                    }
                }
            }
        }
        if page.complete {
            break;
        }
        cursor = Some(
            page.next_cursor
                .ok_or_else(|| invalid("incomplete walk without continuation"))?,
        );
    }
    if identity.is_none() {
        check_contiguous(&out.events, cover)?;
    }
    Ok(out)
}
pub fn check_contiguous(events: &[Envelope], base: &Positions) -> Result<(), Error> {
    let mut streams: BTreeMap<String, BTreeMap<u64, String>> = BTreeMap::new();
    for e in events {
        let s = streams.entry(crate::order::stream_key(e)).or_default();
        if s.insert(e.seq, e.h.clone()).is_some_and(|h| h != e.h) {
            return Err(Error::new(
                ErrorCode::EventStoreSeqConflict,
                "conflicting stream position",
            ));
        }
    }
    for (s, positions) in streams {
        let mut high = base.get(&s).copied().unwrap_or(0);
        for seq in positions
            .keys()
            .copied()
            .filter(|n| *n > high)
            .collect::<Vec<_>>()
        {
            if high.checked_add(1) != Some(seq) {
                return Err(Error::new(
                    ErrorCode::EventStoreGap,
                    format!("hole in {s} after {high}"),
                ));
            }
            high = seq;
        }
    }
    Ok(())
}
/// Authenticate each commit against its ref and promote-parent traversal context.
pub fn verify_tip(seal: &Seal, machine: &str, scope: Scope) -> Result<(), Error> {
    let valid = match seal {
        Seal::Seal {
            machine_id,
            scope: s,
            ..
        } => machine_id == machine && *s == scope,
        Seal::Merge { machine_id, .. } => machine_id == machine && scope == Scope::Project,
        Seal::Legacy { .. } => false,
    };
    if valid {
        Ok(())
    } else {
        Err(Error::new(
            ErrorCode::EventStoreRefTampered,
            "tip machine/scope differs from ref",
        ))
    }
}

/// D17: mirrors cannot publish this clone's unreceipted origin.
pub fn own_origin_bounded(
    published: &Positions,
    origin: &str,
    bounds: &Positions,
) -> Result<(), Error> {
    let prefix = format!("{origin}:");
    if published
        .iter()
        .any(|(key, seq)| key.starts_with(&prefix) && *seq > bounds.get(key).copied().unwrap_or(0))
    {
        return Err(Error::new(
            ErrorCode::EventStoreRefTampered,
            "mirror claims own origin above receipt",
        ));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::git_error;
    use fgos_git::{OperationError, ResultCode};

    #[test]
    fn a_failed_git_command_keeps_its_exit_status_and_stderr_in_the_store_error() {
        let error = git_error(OperationError {
            code: ResultCode::Refused,
            cause: "path-read-failed".into(),
            retryable: false,
            operation_id: None,
            receipt: None,
            exit_code: Some(128),
            signal: None,
            stderr: b"fatal: unable to read object\n".to_vec(),
            detail: None,
        });
        assert_eq!(
            error.detail,
            "Git: path-read-failed (exit 128): fatal: unable to read object"
        );
    }
}
