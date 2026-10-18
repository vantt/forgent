//! Outside-gate read: local files, stable tip observations, Git coverage, order.
use crate::{
    append::Positions,
    cursor::{fold_answer, Cursor, Fold},
    envelope::{Envelope, Scope, Seal},
    errors::{invalid, Error, ErrorCode},
    layout::{Layout, StreamId},
    legacy::{self, LegacyEvent},
    open_read::read_own,
    order::{order, stream_key},
    walk::{self, blob, git_error, header},
};
use fgos_git::{HeadFact, Inspect, ObjectType, Oid, RefPrefix, RefValue, RepoHandle};
use serde::Deserialize;
use std::collections::{BTreeMap, BTreeSet};
#[derive(Debug)]
pub struct ReadResult {
    pub events: Vec<Envelope>,
    pub sequence: Vec<Envelope>,
    pub legacy: Vec<LegacyEvent>,
    pub deferred: Vec<Envelope>,
    pub missing: BTreeSet<(String, u64)>,
    pub concurrent: Vec<(String, String)>,
    pub cursor: Cursor,
    pub fold: Fold,
    pub full_order: Vec<String>,
}
pub struct ReadRequest<'a> {
    pub layout: &'a Layout,
    pub origin: &'a str,
    /// Include all streams the view observes in `seen`; a predecessor outside
    /// this query is unavailable to the view and keeps its dependents deferred.
    pub streams: &'a [StreamId],
    pub cursor: &'a Cursor,
    /// The consumer's verified folded event set. Required to locate a differing
    /// suffix; an empty set with nonempty coverage requests a rebuild from zero.
    pub folded: &'a [Envelope],
    pub project: bool,
}
struct Tip {
    name: String,
    oid: Oid,
    machine: String,
    scope: Scope,
    mirror: bool,
}
fn mirror_suffix(rest: &str) -> Result<&str, Error> {
    ["/events/", "/branch-events/", "/local-events/", "/legacy"]
        .iter()
        .filter_map(|separator| rest.rfind(separator))
        .max()
        .map(|index| &rest[index + 1..])
        .ok_or_else(|| invalid("invalid mirror ref"))
}
fn tips(
    port: &dyn Inspect,
    repo: &RepoHandle,
    streams: &[StreamId],
) -> Result<(Vec<Tip>, BTreeMap<String, Oid>), Error> {
    let prefixes = [
        "refs/fgos/events/",
        "refs/fgos/branch-events/",
        "refs/fgos/local-events/",
        "refs/fgos/remotes/",
        "refs/fgos/legacy",
    ]
    .iter()
    .map(|p| RefPrefix::parse(p).map_err(|e| invalid(e.to_string())))
    .collect::<Result<Vec<_>, _>>()?;
    let mut cursor = None;
    let mut tips = Vec::new();
    let mut legacy = BTreeMap::new();
    loop {
        let page = port
            .list_refs(repo, &prefixes, cursor, 1024)
            .map_err(git_error)?;
        for e in page.entries {
            let name = e.name.as_str();
            let (rest, mirror) = if let Some(r) = name.strip_prefix("refs/fgos/remotes/") {
                (mirror_suffix(r)?, true)
            } else {
                (name.strip_prefix("refs/fgos/").unwrap(), false)
            };
            let relevant = rest == "legacy"
                || ["events/", "branch-events/", "local-events/"]
                    .iter()
                    .any(|p| rest.starts_with(p));
            if !relevant {
                continue;
            }
            let oid = match e.value {
                RefValue::Direct(o) => o,
                _ => {
                    return Err(Error::new(
                        ErrorCode::EventStoreRefTampered,
                        "symbolic event ref",
                    ))
                }
            };
            if rest == "legacy" {
                legacy.insert(name.into(), oid);
                continue;
            }
            let (kind, suffix) = rest.split_once('/').unwrap();
            let machine = suffix.split('/').next().unwrap();
            if !crate::identity::valid_machine_id(machine) {
                return Err(invalid("invalid machine in ref"));
            }
            let scope = match kind {
                "events" => Scope::Project,
                "branch-events" => Scope::Branch,
                "local-events" => Scope::Local,
                _ => unreachable!(),
            };
            if !streams.iter().any(|s| s.scope() == scope) {
                continue;
            }
            tips.push(Tip {
                name: name.into(),
                oid,
                machine: machine.into(),
                scope,
                mirror,
            });
        }
        if page.complete {
            break;
        }
        cursor = Some(
            page.next_cursor
                .ok_or_else(|| invalid("ref continuation missing"))?,
        );
    }
    Ok((tips, legacy))
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct Fence {
    pub(crate) legacy_ref_oid: String,
    pub(crate) seal_digest: String,
    pub(crate) from_commit: String,
}
fn legacy_files(
    port: &dyn Inspect,
    repo: &RepoHandle,
    oid: &Oid,
    streams: &[StreamId],
    at_head: bool,
) -> Result<Vec<LegacyEvent>, Error> {
    let mut cursor = None;
    let mut events = Vec::new();
    let roots: &[&[u8]] = if at_head {
        &[b".fgos/", b"docs/distillery/state/porting/"]
    } else {
        &[b"events", b"porting/"]
    };
    for root in roots {
        loop {
            let page = port
                .list_tree(repo, oid, root, cursor, 1024)
                .map_err(git_error)?;
            let paths: Vec<_> = page
                .entries
                .into_iter()
                .filter(|e| {
                    let work = streams.iter().any(|s| s.as_str() == "project");
                    let porting = streams.iter().any(|s| s.as_str() == "project:porting");
                    let baseline: &[u8] = if at_head {
                        b".fgos/events.jsonl"
                    } else {
                        b"events.jsonl"
                    };
                    let shards: &[u8] = if at_head {
                        b".fgos/events/"
                    } else {
                        b"events/"
                    };
                    let porting_path: &[u8] = if at_head {
                        b"docs/distillery/state/porting/events.jsonl"
                    } else {
                        b"porting/events.jsonl"
                    };
                    e.kind == ObjectType::Blob
                        && (work
                            && (e.path == baseline
                                || e.path
                                    .strip_prefix(shards)
                                    .is_some_and(|p| !p.contains(&b'/') && p.ends_with(b".jsonl")))
                            || porting && e.path == porting_path)
                })
                .map(|e| e.path)
                .collect();
            for path in paths {
                let bytes = blob(port, repo, oid, &path)?
                    .ok_or_else(|| invalid("listed legacy path missing"))?;
                let file = std::str::from_utf8(&path)
                    .map_err(|_| invalid("non-UTF8 legacy provenance"))?;
                let raw =
                    std::str::from_utf8(&bytes).map_err(|_| invalid("non-UTF8 legacy events"))?;
                let tag = if file == "events.jsonl" || file == ".fgos/events.jsonl" {
                    ""
                } else if file.starts_with("events/") || file.starts_with(".fgos/events/") {
                    file.rsplit('/').next().unwrap()
                } else {
                    file
                };
                let mut parsed = legacy::parse_file(tag, raw)?;
                for event in &mut parsed {
                    event.provenance.file = file.into();
                }
                events.extend(parsed);
            }
            if page.complete {
                break;
            }
            cursor = Some(
                page.next_cursor
                    .ok_or_else(|| invalid("tree continuation missing"))?,
            );
        }
        cursor = None;
    }
    Ok(events)
}
fn read_legacy(
    port: &dyn Inspect,
    repo: &RepoHandle,
    refs: &BTreeMap<String, Oid>,
    streams: &[StreamId],
) -> Result<Vec<LegacyEvent>, Error> {
    let head = match port.resolve_head(repo).map_err(git_error)? {
        HeadFact::Attached { commit, .. } | HeadFact::Detached { commit } => commit,
        HeadFact::Unborn { .. } => {
            return if refs.is_empty() {
                Ok(Vec::new())
            } else {
                Err(invalid("legacy refs without tracked fence"))
            }
        }
    };
    let observed = port
        .read_paths_at(repo, &head, &[b".fgos/events".to_vec()], 32 * 1024 * 1024)
        .map_err(git_error)?;
    let fence = match observed
        .into_iter()
        .next()
        .ok_or_else(|| invalid("fence observation missing"))?
        .value
    {
        fgos_git::PathValue::Blob(b) => Some(b),
        fgos_git::PathValue::Absent | fgos_git::PathValue::NotABlob(ObjectType::Tree) => None,
        fgos_git::PathValue::Error(e) => return Err(git_error(e)),
        _ => return Err(invalid("invalid fence type")),
    };
    if let Some(bytes) = fence {
        let fence: Fence = serde_json::from_slice(&bytes).map_err(|e| invalid(e.to_string()))?;
        let oid = Oid::parse(&fence.legacy_ref_oid, repo.object_format())
            .map_err(|e| invalid(e.to_string()))?;
        if refs.is_empty() {
            return Err(Error::new(
                ErrorCode::EventStoreRefspecMissing,
                "tracked legacy fence requires fetching legacy ref",
            ));
        }
        if refs.values().any(|v| *v != oid) {
            return Err(Error::new(
                ErrorCode::EventStoreRefTampered,
                "legacy ref does not match tracked fence",
            ));
        }
        let seal = header(port, repo, &oid)?;
        if seal.digest()? != fence.seal_digest
            || !matches!(&seal,Seal::Legacy {from_commit,..} if *from_commit==fence.from_commit)
        {
            return Err(Error::new(
                ErrorCode::EventStoreRefTampered,
                "legacy seal differs from fence",
            ));
        }
        legacy_files(port, repo, &oid, streams, false)
    } else {
        if !refs.is_empty() {
            return Err(Error::new(
                ErrorCode::EventStoreRefTampered,
                "legacy ref without fence",
            ));
        }
        legacy_files(port, repo, &head, streams, true)
    }
}
/// Must be called outside state rank 60. Local reads precede ref observations.
pub fn read(
    port: &dyn Inspect,
    repo: &RepoHandle,
    req: ReadRequest<'_>,
) -> Result<ReadResult, Error> {
    let mut local = Vec::new();
    for stream in req.streams {
        local.extend(read_own(req.layout, req.origin, stream)?.events);
    }
    let (tips, legacy_refs) = tips(port, repo, req.streams)?;
    for (name, old) in &req.cursor.mirror_tips {
        let tip = tips
            .iter()
            .find(|t| &t.name == name)
            .ok_or_else(|| Error::new(ErrorCode::EventStoreMirrorRewound, "mirror disappeared"))?;
        if !descends(port, repo, &tip.oid, old)? {
            return Err(Error::new(
                ErrorCode::EventStoreMirrorRewound,
                "mirror no longer descends from previous tip",
            ));
        }
    }

    // A replay source is retained by the consumer, not hidden inside the cursor.
    let query: BTreeSet<String> = req.streams.iter().map(|s| s.as_str().into()).collect();
    let have_history = (req.cursor.cover.is_empty() || !req.folded.is_empty())
        && req.cursor.streams == query
        && req.cursor.project_order == req.project;
    let base = if have_history {
        req.cursor.cover.clone()
    } else {
        Positions::new()
    };
    let certificates = if have_history {
        req.cursor.certified.clone()
    } else {
        BTreeSet::new()
    };
    let oids: Vec<_> = tips.iter().map(|t| t.oid.clone()).collect();
    let mut walked = walk::Walked::default();
    let mut own_published = Positions::new();
    for tip in &tips {
        let part = walk::walk_verified(
            port,
            repo,
            &tip.oid,
            &base,
            &certificates,
            &tip.machine,
            tip.scope,
        )?;
        if !tip.mirror {
            for (key, seq) in &part.published {
                own_published
                    .entry(key.clone())
                    .and_modify(|n| *n = (*n).max(*seq))
                    .or_insert(*seq);
            }
        }
        walked.events.extend(part.events);
        walked.visited.extend(part.visited);
    }
    // Mirror ancestry can include the own stream, but cannot invent own events
    // beyond the locally verified durable receipt.
    for tip in tips.iter().filter(|t| t.mirror) {
        let mirror_stops = if req.cursor.mirror_tips.contains_key(&tip.name) {
            certificates.clone()
        } else {
            BTreeSet::new()
        };
        let mirror = walk::walk_verified(
            port,
            repo,
            &tip.oid,
            &base,
            &mirror_stops,
            &tip.machine,
            tip.scope,
        )?;
        for (key, seq) in mirror
            .published
            .iter()
            .filter(|(key, _)| key.starts_with(&format!("{}:", req.origin)))
        {
            let stream = key.strip_prefix(&format!("{}:", req.origin)).unwrap();
            let receipt = crate::append::read_last_seq(
                &req.layout.stream(&StreamId::parse(stream)?).sealed(),
            )?
            .unwrap_or(0);
            if *seq
                > receipt
                    .max(own_published.get(key).copied().unwrap_or(0))
                    .max(base.get(key).copied().unwrap_or(0))
            {
                return Err(Error::new(
                    ErrorCode::EventStoreRefTampered,
                    "mirror claims own origin above receipt",
                ));
            }
        }
    }
    let mut union = req.folded.to_vec();
    union.extend(local);
    union.extend(walked.events.iter().cloned());
    let mut promoted: BTreeMap<String, u64> = BTreeMap::new();
    if req.project {
        for e in &union {
            if req.streams.iter().any(|s| s.as_str() == e.stream) && e.event_type == "store.promote"
            {
                if let (Some(stream), Some(high)) = (
                    e.payload["stream"].as_str(),
                    e.payload["throughSeq"].as_u64(),
                ) {
                    promoted
                        .entry(format!("{}:{stream}", e.origin))
                        .and_modify(|n| *n = (*n).max(high))
                        .or_insert(high);
                }
            }
        }
    }
    union.retain(|e| {
        req.streams.iter().any(|s| s.as_str() == e.stream)
            || promoted
                .get(&stream_key(e))
                .is_some_and(|high| e.seq <= *high)
    });
    walk::check_contiguous(&union, &Positions::new())?;
    let ordered = order(&union, &Positions::new(), req.project)?;
    let mut cursor = Cursor {
        certified: certificates,
        streams: query,
        project_order: req.project,
        ..Cursor::default()
    };
    for e in &ordered.events {
        cursor
            .cover
            .entry(stream_key(e))
            .and_modify(|n| *n = (*n).max(e.seq))
            .or_insert(e.seq);
    }
    cursor.deferred = ordered.deferred.iter().map(|e| e.h.clone()).collect();
    if ordered.deferred.is_empty() {
        cursor.certified.clear();
        cursor
            .certified
            .extend(oids.iter().map(|o| o.as_str().into()));
    }
    cursor.mirror_tips = tips
        .iter()
        .filter(|t| t.mirror)
        .map(|t| (t.name.clone(), t.oid.as_str().into()))
        .collect();
    cursor.legacy_tips = legacy_refs
        .iter()
        .map(|(n, o)| (n.clone(), o.as_str().into()))
        .collect();
    let legacy = legacy::order(read_legacy(port, repo, &legacy_refs, req.streams)?);
    cursor.legacy_digest = if legacy.is_empty() {
        None
    } else {
        Some(crate::envelope::sha256(&crate::envelope::line(
            &legacy.iter().map(LegacyEvent::identity).collect::<Vec<_>>(),
        )?))
    };
    let full_order: Vec<_> = legacy
        .iter()
        .map(LegacyEvent::identity)
        .chain(ordered.events.iter().map(|e| e.h.clone()))
        .collect();
    let old_order: Vec<_> = req.folded.iter().map(|e| e.h.clone()).collect();
    let delta: Vec<_> = ordered
        .events
        .iter()
        .filter(|e| e.seq > req.cursor.cover.get(&stream_key(e)).copied().unwrap_or(0))
        .cloned()
        .collect();
    // Coverage cannot stand in for a lost consumer view. The full sequence was
    // recovered above, but the coverage-relative delta cannot rebuild that view.
    let fold = if have_history {
        fold_answer(
            req.cursor,
            &cursor,
            &old_order,
            &ordered
                .events
                .iter()
                .map(|e| e.h.clone())
                .collect::<Vec<_>>(),
            &delta,
            req.origin,
        )
    } else {
        Fold::RebuildRequired {
            first_difference: 0,
        }
    };
    Ok(ReadResult {
        events: delta,
        sequence: ordered.events,
        legacy,
        deferred: ordered.deferred,
        missing: ordered.missing,
        concurrent: ordered.concurrent,
        cursor,
        fold,
        full_order,
    })
}

/// Pre-gate hook: rebuild the local durable-history receipt from the own ref.
/// Git observation finishes before taking append 70. Receipt publication is
/// monotonic and fsynced; overlapping active records are refused, never dropped.
/// Facades call this before allowing an empty-cache stream to append.
pub fn reconcile_durable_history(
    port: &dyn Inspect,
    repo: &RepoHandle,
    layout: &Layout,
    origin: &str,
    stream: &StreamId,
    own_ref: &fgos_git::RefName,
) -> Result<u64, Error> {
    let prefix = match stream.scope() {
        Scope::Project => "refs/fgos/events/",
        Scope::Branch => "refs/fgos/branch-events/",
        Scope::Local => "refs/fgos/local-events/",
    };
    let machine = own_ref
        .as_str()
        .strip_prefix(prefix)
        .and_then(|s| s.split('/').next())
        .filter(|s| crate::identity::valid_machine_id(s))
        .ok_or_else(|| invalid("own history ref does not match stream scope"))?;
    let page = port
        .list_refs(
            repo,
            &[RefPrefix::parse(own_ref.as_str()).map_err(|e| invalid(e.to_string()))?],
            None,
            1024,
        )
        .map_err(git_error)?;
    let value = page
        .entries
        .into_iter()
        .find(|e| e.name == *own_ref)
        .map(|e| e.value)
        .unwrap_or(RefValue::Absent);
    let tip = match value {
        RefValue::Absent => {
            if crate::append::read_last_seq(&layout.stream(stream).sealed())?.unwrap_or(0) > 0 {
                return Err(Error::new(
                    ErrorCode::EventStoreRefMoved,
                    "published own ref disappeared",
                ));
            }
            return Ok(0);
        }
        RefValue::Direct(oid) => oid,
        RefValue::Symbolic(_) => {
            return Err(Error::new(
                ErrorCode::EventStoreRefTampered,
                "symbolic own ref",
            ))
        }
    };
    let walked = walk::walk_verified(
        port,
        repo,
        &tip,
        &Positions::new(),
        &BTreeSet::new(),
        machine,
        stream.scope(),
    )?;
    walk::check_contiguous(&walked.events, &Positions::new())?;
    let ordered = order(&walked.events, &Positions::new(), false)?;
    let mut recovered = Positions::new();
    for e in &ordered.events {
        recovered
            .entry(stream_key(e))
            .and_modify(|n: &mut u64| *n = (*n).max(e.seq))
            .or_insert(e.seq);
    }
    let certified = if ordered.deferred.is_empty() {
        walked.visited.clone()
    } else {
        BTreeSet::new()
    };
    let own: Vec<_> = walked
        .events
        .iter()
        .filter(|e| e.origin == origin && e.stream == stream.as_str())
        .collect();
    let high = own.iter().map(|e| e.seq).max().unwrap_or(0);
    let fs = crate::fsio::OsFileSystem;
    let _guard = crate::locks::acquire_append(layout, &[], &fs)?;
    let paths = layout.stream(stream);
    let receipt = crate::append::read_last_seq(&paths.sealed())?.unwrap_or(0);
    if receipt > high {
        return Err(Error::new(
            ErrorCode::EventStoreRefMoved,
            "local receipt exceeds own durable history",
        ));
    }
    let local = read_own(layout, origin, stream)?;
    if local.events.iter().filter(|e| e.seq <= high).any(|e| {
        !own.iter()
            .any(|published| published.seq == e.seq && published.h == e.h)
    }) {
        return Err(Error::new(
            ErrorCode::EventStoreSeqRecoveryConflict,
            "local records differ from recovered durable history",
        ));
    }
    if high > receipt {
        std::fs::create_dir_all(&paths.root).map_err(crate::errors::io)?;
        crate::fsio::sync_dir(&layout.root)?;
        // lastSeq is physical publication, deliberately separate from coverage:
        // causal deferral must never permit reuse of a published sequence.
        crate::receipt::Receipt {
            last_seq: high,
            reference: own_ref.as_str().into(),
            commit: tip.as_str().into(),
            cover: recovered,
            certified,
            ..Default::default()
        }
        .write(&paths.root)?;
    }
    crate::fsio::write_hwm(&paths.root, high, &fs)?;
    Ok(high)
}
pub(crate) fn descends(
    port: &dyn Inspect,
    repo: &RepoHandle,
    tip: &Oid,
    old: &str,
) -> Result<bool, Error> {
    let old = Oid::parse(old, repo.object_format()).map_err(|e| invalid(e.to_string()))?;
    if *tip == old {
        return Ok(true);
    }
    let mut cursor = None;
    loop {
        let page = port
            .walk_commits(
                repo,
                std::slice::from_ref(tip),
                std::slice::from_ref(&old),
                cursor,
                fgos_git::WalkBounds {
                    max_commits: 256,
                    max_bytes: 4 * 1024 * 1024,
                },
            )
            .map_err(git_error)?;
        if page
            .commits
            .iter()
            .any(|c| c.oid == old || c.parents.contains(&old))
        {
            return Ok(true);
        }
        if page.complete {
            return Ok(false);
        }
        cursor = Some(
            page.next_cursor
                .ok_or_else(|| invalid("missing ancestry continuation"))?,
        );
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn mirror_namespace_follows_the_complete_remote_name() {
        assert_eq!(
            super::mirror_suffix("a/b/events/test-aa").unwrap(),
            "events/test-aa"
        );
        assert_eq!(
            super::mirror_suffix("a/events/b/branch-events/test-aa/feature").unwrap(),
            "branch-events/test-aa/feature"
        );
        assert_eq!(super::mirror_suffix("a/b/legacy").unwrap(), "legacy");
        assert!(super::mirror_suffix("a/b/unknown").is_err());
    }
}
