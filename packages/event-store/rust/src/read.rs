//! Outside-gate read: local files, stable tip observations, Git coverage, order.
pub use crate::order::VerifiedView;
use crate::{
    append::Positions,
    checkpoint::{self, Checkpoint, CheckpointReport, Retained},
    commit_memo::CommitMemo,
    cursor::{fold_answer, Cursor, Fold},
    envelope::{Envelope, Scope},
    errors::{invalid, Error, ErrorCode},
    layout::{Layout, StreamId},
    legacy::{self, LegacyEvent},
    open_read::read_own,
    order::{order, order_retained, stream_key},
    walk::{self, blobs, git_error},
};
use fgos_git::{HeadFact, Inspect, ObjectType, Oid, RefPrefix, RefValue, RepoHandle};
use std::{
    collections::{BTreeMap, BTreeSet},
    sync::{Arc, Mutex},
};
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
    /// What this read did with its checkpoint; default when it had none.
    pub checkpoint: CheckpointReport,
    /// The answer came from the process's `ReadMemo`: every observed input was
    /// the remembered one, so nothing was walked, certified or ordered.
    pub memoized: bool,
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
#[derive(Clone, PartialEq)]
struct Tip {
    name: String,
    oid: Oid,
    machine: String,
    scope: Scope,
    mirror: bool,
}

/// The legacy events one read answers with and the digest that names them.
struct LegacyView {
    events: Vec<LegacyEvent>,
    digest: Option<String>,
}
impl LegacyView {
    /// The same view object (one commit's memoized parse) or the same content.
    fn same_as(self: &Arc<Self>, other: &Arc<Self>) -> bool {
        Arc::ptr_eq(self, other) || (self.digest == other.digest && self.events == other.events)
    }
}

/// What this process's last complete read answered, and the real inputs it
/// answered them from. A repeat read observes every one of those inputs again
/// (own files, every ref tip, the legacy files at HEAD) and returns the same
/// answer only when all of them are exactly what the memo saw and the caller
/// holds exactly the history the memo answered; any difference reads normally.
/// The memo is a per-store value: it is never shared and never outlives its
/// store.
#[derive(Default)]
pub struct ReadMemo {
    last: Mutex<Option<Last>>,
}
struct Last {
    origin: String,
    streams: BTreeSet<String>,
    project: bool,
    tips: Vec<Tip>,
    legacy_refs: BTreeMap<String, Oid>,
    local: Vec<Envelope>,
    legacy: Arc<LegacyView>,
    cursor: Cursor,
    sequence: Vec<Envelope>,
    missing: BTreeSet<(String, u64)>,
    concurrent: Vec<(String, String)>,
    full_order: Vec<String>,
}
impl ReadMemo {
    pub fn new() -> Self {
        Self::default()
    }
    fn lock(&self) -> std::sync::MutexGuard<'_, Option<Last>> {
        self.last
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
    }
    /// The answer for a caller that holds exactly the remembered history while
    /// every observed input is the remembered one; `None` when anything differs.
    fn answer(
        &self,
        req: &ReadRequest<'_>,
        observed: &Observed<'_>,
        legacy: &Arc<LegacyView>,
        legacy_held: Option<&str>,
    ) -> Option<ReadResult> {
        let guard = self.lock();
        let last = guard.as_ref()?;
        if last.origin != req.origin
            || last.project != req.project
            || last.streams
                != req
                    .streams
                    .iter()
                    .map(|s| s.as_str().to_owned())
                    .collect::<BTreeSet<_>>()
            || last.cursor != *req.cursor
            || last.tips != observed.tips
            || last.legacy_refs != *observed.legacy_refs
            || last.local != observed.local
            || !last.legacy.same_as(legacy)
            || last.sequence != req.folded
        {
            return None;
        }
        Some(ReadResult {
            events: Vec::new(),
            sequence: last.sequence.clone(),
            legacy: if legacy_held.is_some() && legacy_held == last.legacy.digest.as_deref() {
                Vec::new()
            } else {
                last.legacy.events.clone()
            },
            deferred: Vec::new(),
            missing: last.missing.clone(),
            concurrent: last.concurrent.clone(),
            cursor: last.cursor.clone(),
            fold: Fold::Incremental,
            full_order: last.full_order.clone(),
            verified_view: VerifiedView {
                events: last.sequence.clone(),
            },
            checkpoint: CheckpointReport::default(),
            memoized: true,
        })
    }
    fn remember(
        &self,
        req: &ReadRequest<'_>,
        observed: &Observed<'_>,
        legacy: &Arc<LegacyView>,
        answer: &ReadResult,
    ) {
        *self.lock() = Some(Last {
            origin: req.origin.into(),
            streams: req.streams.iter().map(|s| s.as_str().to_owned()).collect(),
            project: req.project,
            tips: observed.tips.to_vec(),
            legacy_refs: observed.legacy_refs.clone(),
            local: observed.local.to_vec(),
            legacy: legacy.clone(),
            cursor: answer.cursor.clone(),
            sequence: answer.sequence.clone(),
            missing: answer.missing.clone(),
            concurrent: answer.concurrent.clone(),
            full_order: answer.full_order.clone(),
        });
    }
}
/// A read's use of its process memo.
#[derive(Clone, Copy)]
pub struct Memoized<'a> {
    pub memo: &'a ReadMemo,
    /// Digest of the legacy events the caller already holds from an earlier
    /// answer. A memo answer whose legacy history has this digest leaves
    /// `ReadResult::legacy` empty: the caller keeps its own copy.
    pub legacy_held: Option<&'a str>,
}
/// The inputs of one read that were observed from the real store.
struct Observed<'a> {
    tips: &'a [Tip],
    legacy_refs: &'a BTreeMap<String, Oid>,
    local: &'a [Envelope],
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
/// Event ref tips, the legacy mirrors, and the HEAD the same listing observed (when attached).
type ListedTips = (Vec<Tip>, BTreeMap<String, Oid>, Option<HeadFact>);
/// The listing that reads the event refs also lists `refs/heads/`, so the branch HEAD names, with
/// its own listed value, comes with it (see `refs::list_with_head`).
fn tips(
    port: &dyn Inspect,
    repo: &RepoHandle,
    streams: &[StreamId],
) -> Result<ListedTips, Error> {
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
    let (listed, head) = crate::refs::list_with_head(port, repo, &prefixes)?;
    for e in listed {
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
        if !fgos_identity::machine::valid_machine_id(machine) {
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
    Ok((tips, legacy, head))
}
fn legacy_files(
    port: &dyn Inspect,
    repo: &RepoHandle,
    oid: &Oid,
    streams: &[StreamId],
) -> Result<Vec<LegacyEvent>, Error> {
    let mut selected = Vec::new();
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
        selected.push((entry.path.clone(), work));
    }
    // One Git process reads every legacy file of the commit, however many.
    let paths: Vec<Vec<u8>> = selected.iter().map(|(path, _)| path.clone()).collect();
    let contents = blobs(port, repo, oid, &paths)?;
    let mut events = Vec::new();
    for ((path, work), bytes) in selected.into_iter().zip(contents) {
        let file = std::str::from_utf8(&path).map_err(|_| invalid("legacy provenance UTF8"))?;
        let bytes = bytes.ok_or_else(|| invalid("listed legacy path missing"))?;
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
    authority: &RepoHandle,
    head: &HeadFact,
    refs: &BTreeMap<String, Oid>,
    streams: &[StreamId],
) -> Result<Vec<LegacyEvent>, Error> {
    let pin = crate::fence::pinned_at_head(port, authority, head).map_err(|error| {
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
            authority,
            streams,
            head,
            refs.get("refs/fgos/legacy"),
        )
    }
}
/// The tracked legacy files of one commit never change, so one process parses
/// them, orders them and digests them once per commit, legacy refs and query.
/// HEAD is observed anew on every call: a moved HEAD names another commit.
static LEGACY_VIEWS: CommitMemo<Arc<LegacyView>> = CommitMemo::new();

fn legacy_view(
    port: &dyn Inspect,
    repo: &RepoHandle,
    refs: &BTreeMap<String, Oid>,
    streams: &[StreamId],
    listed_head: Option<HeadFact>,
) -> Result<Arc<LegacyView>, Error> {
    let authority = crate::fence::authority(port, repo)?;
    // The listing observed `repo`'s HEAD; it answers for the authority only when both are one checkout.
    let head = match listed_head {
        Some(head) if authority.git_dir() == repo.git_dir() => head,
        _ => port.resolve_head(&authority).map_err(git_error)?,
    };
    let compute = || {
        let (work, porting): (Vec<_>, Vec<_>) =
            read_legacy(port, repo, &authority, &head, refs, streams)?
                .into_iter()
                .partition(|e| !e.provenance.file.starts_with("porting/"));
        let mut events = legacy::order(work);
        events.extend(porting);
        let digest = if events.is_empty() {
            None
        } else {
            Some(crate::envelope::sha256(&crate::envelope::line(
                &events.iter().map(LegacyEvent::identity).collect::<Vec<_>>(),
            )?))
        };
        Ok(Arc::new(LegacyView { events, digest }))
    };
    match &head {
        HeadFact::Attached { commit, .. } | HeadFact::Detached { commit } => {
            let mut question = Vec::new();
            for (name, oid) in refs {
                question.extend_from_slice(format!("{name}\0{}\0", oid.as_str()).as_bytes());
            }
            for stream in streams {
                question.extend_from_slice(format!("\n{}", stream.as_str()).as_bytes());
            }
            LEGACY_VIEWS.get_or_compute(&authority, commit, &question, compute)
        }
        HeadFact::Unborn { .. } => compute(),
    }
}
/// Must be called outside state rank 60. Local reads precede ref observations.
pub fn read(
    port: &dyn Inspect,
    repo: &RepoHandle,
    req: ReadRequest<'_>,
) -> Result<ReadResult, Error> {
    read_with_view(port, repo, req, None, None)
}
/// Reuse only exact envelopes from a previously verified consumer view.
/// Changed input still undergoes ordinary validation; Git facts never reuse.
pub fn read_with_view(
    port: &dyn Inspect,
    repo: &RepoHandle,
    req: ReadRequest<'_>,
    view: Option<&VerifiedView>,
    memo: Option<Memoized<'_>>,
) -> Result<ReadResult, Error> {
    read_from(port, repo, &req, view, None, memo)
}

/// A read that continues from the checkpoint file when the caller holds no
/// retained history of its own, and replaces the file when the read certified
/// commits it did not. A file that does not match the store is ignored (the
/// report says why) and the read walks from zero, so the answer never depends
/// on the file. `Checkpoint::reuse == false` always walks from zero.
pub fn read_checkpointed(
    port: &dyn Inspect,
    repo: &RepoHandle,
    req: ReadRequest<'_>,
    view: Option<&VerifiedView>,
    checkpoint: &Checkpoint,
    memo: Option<Memoized<'_>>,
) -> Result<ReadResult, Error> {
    let query: BTreeSet<String> = req.streams.iter().map(|s| s.as_str().into()).collect();
    let caller_has_history = holds_history(&req, &query);
    let mut report = CheckpointReport::default();
    let mut retained = None;
    if checkpoint.reuse && !caller_has_history {
        match checkpoint::load(&checkpoint.path, req.origin, &query, req.project) {
            Ok(found) => retained = found,
            Err(reason) => report.ignored = Some(reason),
        }
    }
    let mut result = None;
    if let Some(found) = &retained {
        match read_from(port, repo, &req, view, Some(found), memo) {
            Ok(read) => {
                report.continued = true;
                result = Some(read);
            }
            // Whatever the file got wrong, the store decides: walk from zero.
            Err(error) => report.ignored = Some(error.to_string()),
        }
    }
    let mut result = match result {
        Some(read) => read,
        None => read_from(port, repo, &req, view, None, memo)?,
    };
    // A checkpoint is worth writing when this read certified commits that the
    // history it started from did not; local-only changes are re-read cheaply.
    let started: &BTreeMap<String, String> = match (&retained, report.continued, caller_has_history)
    {
        (Some(found), true, _) => &found.cursor.verified_tips,
        (_, _, true) => &req.cursor.verified_tips,
        _ => &BTreeMap::new(),
    };
    if result.deferred.is_empty()
        && !result.cursor.verified_tips.is_empty()
        && result.cursor.verified_tips != *started
    {
        match checkpoint::store(
            &checkpoint.path,
            req.origin,
            &result.cursor,
            &result.sequence,
        ) {
            Ok(()) => report.written = true,
            Err(error) => report.write_error = Some(error),
        }
    }
    result.checkpoint = report;
    Ok(result)
}

/// The ordered history of everything a read (or a seal extending a checkpoint)
/// holds: events of the query's streams, plus any other stream's events up to
/// what a `store.promote` claims, contiguous and causally ordered.
pub(crate) fn fold_history(
    mut union: Vec<Envelope>,
    query: &BTreeSet<String>,
    project: bool,
    view: Option<&VerifiedView>,
) -> Result<crate::order::Ordered, Error> {
    let mut promoted: BTreeMap<String, u64> = BTreeMap::new();
    if project {
        for e in &union {
            if query.contains(&e.stream) && e.event_type == "store.promote" {
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
        query.contains(&e.stream)
            || promoted
                .get(&stream_key(e))
                .is_some_and(|high| e.seq <= *high)
    });
    walk::check_contiguous(&union, &Positions::new())?;
    order_retained(&union, &Positions::new(), project, view)
}

fn holds_history(req: &ReadRequest<'_>, query: &BTreeSet<String>) -> bool {
    (req.cursor.cover.is_empty() || !req.folded.is_empty())
        && req.cursor.streams == *query
        && req.cursor.project_order == req.project
}

/// What a checkpoint read must still prove against the live store before it
/// may stand in for the history it records.
fn verify_retained(
    retained: &Retained,
    tips: &[Tip],
    local: &[Envelope],
    req: &ReadRequest<'_>,
) -> Result<(), Error> {
    let refused = |detail: &str| Error::new(ErrorCode::EventStoreRefMoved, detail);
    // A ref the checkpoint certified must still exist; a moved one is checked
    // against its walk.
    if retained
        .cursor
        .verified_tips
        .keys()
        .any(|name| !tips.iter().any(|t| &t.name == name))
    {
        return Err(refused("a certified ref no longer exists"));
    }
    // An own event the checkpoint folded is either published (at or below the
    // receipt) or still in the local files; one that is neither was lost.
    let receipts = crate::receipt::own_bounds(req.layout, req.origin)?;
    let local: BTreeSet<(&str, u64, &str)> = local
        .iter()
        .map(|e| (e.stream.as_str(), e.seq, e.h.as_str()))
        .collect();
    for e in retained.folded.iter().filter(|e| e.origin == req.origin) {
        let published = receipts.get(&stream_key(e)).copied().unwrap_or(0);
        if e.seq > published && !local.contains(&(e.stream.as_str(), e.seq, e.h.as_str())) {
            return Err(refused("a folded own event is neither published nor local"));
        }
    }
    Ok(())
}

fn read_from(
    port: &dyn Inspect,
    repo: &RepoHandle,
    req: &ReadRequest<'_>,
    view: Option<&VerifiedView>,
    retained: Option<&Retained>,
    memo: Option<Memoized<'_>>,
) -> Result<ReadResult, Error> {
    let mut local = Vec::new();
    for stream in req.streams {
        local.extend(read_own(req.layout, req.origin, stream)?.events);
    }
    let (tips, legacy_refs, mut listed_head) = tips(port, repo, req.streams)?;
    // A replay source is retained by the consumer, not hidden inside the cursor.
    let query: BTreeSet<String> = req.streams.iter().map(|s| s.as_str().into()).collect();
    let caller_has_history = holds_history(req, &query);
    // A repeat read of a caller that holds the last answer: the inputs were
    // just observed above and the legacy files of the current HEAD are read
    // here; when all of them are the remembered ones nothing else can differ.
    let mut early_legacy = None;
    if let Some(Memoized { memo, legacy_held }) =
        memo.filter(|_| retained.is_none() && caller_has_history)
    {
        let legacy = legacy_view(port, repo, &legacy_refs, req.streams, listed_head.take())?;
        let observed = Observed {
            tips: &tips,
            legacy_refs: &legacy_refs,
            local: &local,
        };
        if let Some(answer) = memo.answer(req, &observed, &legacy, legacy_held) {
            return Ok(answer);
        }
        early_legacy = Some(legacy);
    }
    // The history this read continues from: the checkpoint's when one was
    // loaded (and then checked below), else the caller's own.
    let (retained_cursor, retained_events, have_history) = match retained {
        Some(found) => (&found.cursor, found.folded.as_slice(), true),
        None => (req.cursor, req.folded, caller_has_history),
    };
    if let Some(found) = retained {
        verify_retained(found, &tips, &local, req)?;
    }
    for (name, old) in &retained_cursor.mirror_tips {
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

    let base = if have_history {
        retained_cursor.cover.clone()
    } else {
        Positions::new()
    };
    let certificates = if have_history {
        retained_cursor.certified.clone()
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
            && retained_cursor
                .verified_tips
                .get(&tip.name)
                .map(String::as_str)
                == Some(tip.oid.as_str())
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
        // A checkpoint's certified commit stands in for its whole history only
        // while the ref still descends from it: the walk must have met it.
        if retained.is_some() {
            if let Some(previous) = retained_cursor.verified_tips.get(&tip.name) {
                if !part.stops_reached.contains(previous) {
                    return Err(Error::new(
                        ErrorCode::EventStoreRefMoved,
                        "a ref no longer descends from its certified commit",
                    ));
                }
            }
        }
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
        let mirror_stops = if retained_cursor.mirror_tips.contains_key(&tip.name) {
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
    let mut union = retained_events.to_vec();
    union.extend(local.iter().cloned());
    union.extend(walked.events.iter().cloned());
    let ordered = fold_history(union, &query, req.project, view)?;
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
    let legacy_view = match early_legacy {
        Some(view) => view,
        None => legacy_view(port, repo, &legacy_refs, req.streams, listed_head.take())?,
    };
    cursor.legacy_digest = legacy_view.digest.clone();
    let full_order: Vec<_> = legacy_view
        .events
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
    let fold = if caller_has_history {
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
    let answer = ReadResult {
        events: delta,
        verified_view: VerifiedView {
            events: ordered.events.clone(),
        },
        sequence: ordered.events,
        legacy: legacy_view.events.clone(),
        deferred: ordered.deferred,
        missing: ordered.missing,
        concurrent: ordered.concurrent,
        cursor,
        fold,
        full_order,
        checkpoint: CheckpointReport::default(),
        memoized: false,
    };
    if let Some(Memoized { memo, .. }) = memo.filter(|_| answer.deferred.is_empty()) {
        let observed = Observed {
            tips: &tips,
            legacy_refs: &legacy_refs,
            local: &local,
        };
        memo.remember(req, &observed, &legacy_view, &answer);
    }
    Ok(answer)
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
        .filter(|s| fgos_identity::machine::valid_machine_id(s))
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
