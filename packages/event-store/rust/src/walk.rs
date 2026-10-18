//! Complete certified-commit walk through Git's typed Publication port.
use crate::{
    append::Positions,
    envelope::{sha256, Envelope, Scope, Seal},
    errors::{invalid, Error, ErrorCode},
    layout::StreamId,
    open_read::decode,
};
use fgos_git::{Oid, PathValue, Publication, RepoHandle, WalkBounds};
use std::collections::{BTreeMap, BTreeSet};
pub(crate) fn git_error(e: fgos_git::OperationError) -> Error {
    Error::new(ErrorCode::EventStoreGap, format!("Git: {}", e.cause))
}
pub fn blob(
    port: &dyn Publication,
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
pub fn header(port: &dyn Publication, repo: &RepoHandle, oid: &Oid) -> Result<Seal, Error> {
    let bytes = blob(port, repo, oid, b"seal.json")?
        .ok_or_else(|| Error::new(ErrorCode::EventStoreGap, "seal.json missing"))?;
    let seal: Seal = serde_json::from_slice(&bytes).map_err(|e| invalid(e.to_string()))?;
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
/// Never mutates supplied coverage/certificates, including on an error after
/// several successful pages. Git owns traversal, stops and object decoding.
pub fn walk(
    port: &dyn Publication,
    repo: &RepoHandle,
    tips: &[Oid],
    cover: &Positions,
    certified: &BTreeSet<String>,
) -> Result<Walked, Error> {
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
        for commit in page.commits {
            if !out.visited.insert(commit.oid.as_str().into()) {
                continue;
            }
            if certified.contains(commit.oid.as_str()) {
                continue;
            }
            match header(port, repo, &commit.oid)? {
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
                    let bytes = blob(port, repo, &commit.oid, b"events.jsonl")?
                        .ok_or_else(|| invalid("seal events missing"))?;
                    if sha256(&bytes) != hash {
                        return Err(Error::new(
                            ErrorCode::EventStoreSealMismatch,
                            "segment digest mismatch",
                        ));
                    }
                    let framed = decode(&bytes, &origin, &StreamId::parse(&stream)?, true)
                        .map_err(|e| Error::new(ErrorCode::EventStoreRefTampered, e.to_string()))?;
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
        }
        if page.complete {
            break;
        }
        cursor = Some(
            page.next_cursor
                .ok_or_else(|| invalid("incomplete walk without continuation"))?,
        );
    }
    check_contiguous(&out.events, cover)?;
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
/// A ref's tip is authenticated against its namespace. Ancestors can belong to
/// other machines/scopes after merge/promote, so they retain their own headers.
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
