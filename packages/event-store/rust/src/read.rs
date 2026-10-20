//! Outside-gate read: local files, stable tip observations, Git coverage, order.
pub use crate::order::VerifiedView;
use crate::{
    append::Positions,
    cursor::{fold_answer, Cursor, Fold},
    envelope::{Envelope, Scope},
    errors::{invalid, Error, ErrorCode},
    layout::{Layout, StreamId},
    legacy::{self, LegacyEvent},
    open_read::read_own,
    order::{order, order_retained, stream_key},
    walk::{self, blob, git_error},
};
use fgos_git::{HeadFact, Inspect, ObjectType, Oid, RefPrefix, RefValue, RepoHandle};
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
    pub verified_view: VerifiedView,
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
pub(crate) fn mirror_suffix(rest: &str) -> Result<Option<&str>, Error> {
    let (remote, suffix) = rest
        .split_once('/')
        .ok_or_else(|| invalid("invalid mirror ref"))?;
    if remote.is_empty() {
        return Err(invalid("invalid mirror remote"));
    }
    Ok((suffix == "legacy"
        || ["events/", "branch-events/", "local-events/"]
            .iter()
            .any(|p| suffix.starts_with(p)))
    .then_some(suffix))
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
    let mut tips = Vec::new();
    let mut legacy = BTreeMap::new();
    for e in crate::refs::list(port, repo, &prefixes)? {
        let name = e.name.as_str();
        let (rest, mirror) = if let Some(r) = name.strip_prefix("refs/fgos/remotes/") {
            (
                match mirror_suffix(r)? {
                    Some(suffix) => suffix,
                    None => continue,
                },
                true,
            )
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
    Ok((tips, legacy))
}
fn legacy_files(
    port: &dyn Inspect,
    repo: &RepoHandle,
    oid: &Oid,
    streams: &[StreamId],
) -> Result<Vec<LegacyEvent>, Error> {
    let mut events = Vec::new();
    for entry in crate::legacy_import::all_entries(port, repo, oid)? {
        let file =
            std::str::from_utf8(&entry.path).map_err(|_| invalid("legacy provenance UTF8"))?;
        let work = file == "events.jsonl"
            || file
                .strip_prefix("events/")
                .is_some_and(|p| !p.contains('/') && p.ends_with(".jsonl"));
        let porting = file.starts_with("porting/") && file.ends_with("/events.jsonl");
        if !(work && streams.iter().any(|s| s.as_str() == "project")
            || porting && streams.iter().any(|s| s.as_str() == "project:porting"))
        {
            continue;
        }
        if entry.kind != ObjectType::Blob || entry.mode != 0o100644 {
            return Err(invalid("unsafe legacy event entry"));
        }
        let bytes = blob(port, repo, oid, &entry.path)?
            .ok_or_else(|| invalid("listed legacy path missing"))?;
        let tag = if file == "events.jsonl" {
            ""
        } else if work {
            file.rsplit('/').next().unwrap()
        } else {
            file
        };
        let mut parsed = legacy::parse_file(
            tag,
            std::str::from_utf8(&bytes).map_err(|_| invalid("legacy UTF8"))?,
        )?;
        for event in &mut parsed {
            event.provenance.file = file.into();
        }
        events.extend(parsed);
    }
    Ok(events)
}
fn read_legacy(
    port: &dyn Inspect,
    repo: &RepoHandle,
    refs: &BTreeMap<String, Oid>,
    streams: &[StreamId],
) -> Result<Vec<LegacyEvent>, Error> {
    let authority = crate::fence::authority(port, repo)?;
    let head = port.resolve_head(&authority).map_err(git_error)?;
    let pin = crate::fence::pinned_at_head(port, &authority, &head).map_err(|error| {
        if refs.is_empty() && error.code == ErrorCode::EventStoreIo {
            Error::new(
                ErrorCode::EventStoreRefspecMissing,
                "tracked legacy fence requires fetching legacy ref",
            )
        } else {
            error
        }
    })?;
    if let Some(oid) = pin {
        if refs.is_empty() {
            return Err(Error::new(
                ErrorCode::EventStoreRefspecMissing,
                "tracked legacy fence requires fetching legacy ref",
            ));
        }
        crate::fence::validate_refs(Some(&oid), refs.values())?;
        legacy_files(port, repo, &oid, streams)
    } else {
        if matches!(head, HeadFact::Unborn { .. }) {
            return Ok(Vec::new());
        }
        crate::legacy_import::read_consumer_at(
            port,
            &authority,
            streams,
            &head,
            refs.get("refs/fgos/legacy"),
        )
    }
}
/// Must be called outside state rank 60. Local reads precede ref observations.
pub fn read(
    port: &dyn Inspect,
    repo: &RepoHandle,
    req: ReadRequest<'_>,
) -> Result<ReadResult, Error> {
    read_with_view(port, repo, req, None)
}
/// Reuse only exact envelopes from a previously verified consumer view.
/// Changed input still undergoes ordinary validation; Git facts never reuse.
pub fn read_with_view(
    port: &dyn Inspect,
    repo: &RepoHandle,
    req: ReadRequest<'_>,
    view: Option<&VerifiedView>,
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
    // A certified object is reusable only under the exact namespace binding
    // that was verified with the retained view. Re-observe every ref first;
    // a new name, moved ref, lost view or deferred history runs the verifier.
    let unchanged = |tip: &Tip| {
        have_history
            && certificates.contains(tip.oid.as_str())
            && req.cursor.verified_tips.get(&tip.name).map(String::as_str) == Some(tip.oid.as_str())
    };
    for tip in &tips {
        if unchanged(tip) {
            continue;
        }
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
    let mut bounds = crate::receipt::own_bounds(req.layout, req.origin)?;
    for (key, seq) in own_published.iter().chain(base.iter()) {
        bounds
            .entry(key.clone())
            .and_modify(|n| *n = (*n).max(*seq))
            .or_insert(*seq);
    }
    for tip in tips.iter().filter(|t| t.mirror && !unchanged(t)) {
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
        walk::own_origin_bounded(&mirror.published, req.origin, &bounds)?;
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
    let ordered = order_retained(&union, &Positions::new(), req.project, view)?;
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
    cursor.verified_tips = tips
        .iter()
        .filter(|t| cursor.certified.contains(t.oid.as_str()))
        .map(|t| (t.name.clone(), t.oid.as_str().into()))
        .collect();
    cursor.mirror_tips = tips
        .iter()
        .filter(|t| t.mirror)
        .map(|t| (t.name.clone(), t.oid.as_str().into()))
        .collect();
    cursor.legacy_tips = legacy_refs
        .iter()
        .map(|(n, o)| (n.clone(), o.as_str().into()))
        .collect();
    let raw_legacy = read_legacy(port, repo, &legacy_refs, req.streams)?;
    let (work, porting): (Vec<_>, Vec<_>) = raw_legacy
        .into_iter()
        .partition(|e| !e.provenance.file.starts_with("porting/"));
    let mut legacy = legacy::order(work);
    legacy.extend(porting);
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
        verified_view: VerifiedView {
            events: ordered.events.clone(),
        },
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
    fn mirror_namespace_accepts_only_recognized_suffixes() {
        assert_eq!(
            super::mirror_suffix("origin/events/test-aa").unwrap(),
            Some("events/test-aa")
        );
        assert_eq!(
            super::mirror_suffix("origin/branch-events/test-aa/feature").unwrap(),
            Some("branch-events/test-aa/feature")
        );
        assert_eq!(
            super::mirror_suffix("origin/legacy").unwrap(),
            Some("legacy")
        );
        assert_eq!(super::mirror_suffix("origin/unknown").unwrap(), None);
    }
    #[test]
    fn mirror_namespace_strips_only_the_remote_segment() {
        assert_eq!(
            super::mirror_suffix("origin/legacy/events/m").unwrap(),
            None
        );
        assert_eq!(
            super::mirror_suffix("origin/events/m/events/other").unwrap(),
            Some("events/m/events/other")
        );
        assert_eq!(
            super::mirror_suffix("origin/legacy").unwrap(),
            Some("legacy")
        );
        assert!(super::mirror_suffix("origin").is_err());
        assert!(super::mirror_suffix("/events/m").is_err());
    }
}
