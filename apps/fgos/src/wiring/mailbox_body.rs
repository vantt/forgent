//! Where the body of a version 3 `mailbox.message-sent` lives on the receiving machine: one blob,
//! named by the body's sha256, in the tree of the tip of the sender machine's mail-body ref as this
//! clone mirrors it (`refs/fgos/remotes/<remote>/mail-bodies/<machine>`). The read goes through the
//! Git driver's ref and path reads, the same door the Event Store reads through; the mirror is
//! never part of the Event Store.
//!
//! The mirror is filled by [`fetch`], which the sync child runs after the Event Store sync and
//! before ingest: events first, then bodies, so a header never waits on a body that the same sync
//! could have brought.
use fgos_event_store::locks::{APPEND_WAIT_MS, SEAL_NAME};
use fgos_git::{
    granted_fetch_mappings, publication_fetch_mappings, CommitInput, ExpectedTip, HolderAuthority,
    Identity, Inspect, ObjectType, Oid, PathValue, Publication, PublicationPort, PushOutcome,
    RefName, RefValue, RemoteGrant, RepoHandle, TreeEntry,
};
use fgos_holder_lock::{Acquire, Mode, Resource, Wait, DEFAULT_KILL_WAIT_MS};
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;
use std::path::Path;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use super::event_store_clone::{self, EventStoreClone};
use super::mailbox_remote::{ago, WIRE_MAX_BODY_BYTES};

/// What the mirror holds for one message header.
#[derive(Debug, PartialEq, Eq)]
pub enum Resolved {
    /// The blob is there and its bytes are the body the header signed.
    Body(String),
    /// The ref or the blob is absent: only the header is left.
    Expired,
    /// A blob is there but is not the body the header names.
    Malformed,
}

/// The one writer id of every transfer on this machine's mail-body ref, fetch and push alike. A
/// transfer left half done is recovered only under the writer that began it, so it is named for the
/// ref, never for the operation, and never varies.
pub(crate) const BODY_WRITER: &str = "mailbox-body";

/// Whether this sync brought the mail-body mirrors up to date after its event fetch. A header whose
/// body is absent is expired only after a [`BodyFetch::Fetched`]; otherwise nothing is known about
/// the body and the header is held.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum BodyFetch {
    Fetched,
    /// Why the mirrors were not fetched.
    NotFetched(String),
}

/// Fetches the mail-body mirrors of `remote` into the clone `main` is in. Call it only after the
/// Event Store sync of the same run returned. The transfer runs under the machine's own
/// `event-seal` hold, bound to `refs/fgos/mail-bodies/<this machine>` and [`BODY_WRITER`], the way
/// every outside caller of the publication port borrows the seal.
pub fn fetch(main: &Path, remote: &str) -> BodyFetch {
    match try_fetch(main, remote) {
        Ok(()) => BodyFetch::Fetched,
        Err(why) => BodyFetch::NotFetched(why),
    }
}

fn try_fetch(main: &Path, remote: &str) -> Result<(), String> {
    let clone = open_clone(main)?;
    // The mapping the clone needs is the granted one the Event Store sync does not require; a clone
    // that has not run setup again lacks it, and nothing is fetched without it.
    let mapping = &body_mapping(remote)?;
    let configured = clone
        .driver
        .configured_fetch_refspecs(&clone.repo, remote)
        .map_err(|e| format!("fetch mapping read: {e:?}"))?;
    if !configured
        .iter()
        .any(|fact| fact.value == mapping.as_bytes())
    {
        return Err("the mail-body fetch mapping is not installed; run doctor --fix".into());
    }
    on_body_ref(&clone, remote, None, |port, _| {
        port.fetch_refs(&clone.repo, remote, std::slice::from_ref(mapping))
            .map(|_| ())
            .map_err(|e| format!("body fetch: {e:?}"))
    })
}

/// The one granted fetch mapping the Event Store sync does not require: the mail-body namespace.
fn body_mapping(remote: &str) -> Result<String, String> {
    let required = publication_fetch_mappings(remote).map_err(|e| format!("{e:?}"))?;
    let mut bodies = granted_fetch_mappings(remote).map_err(|e| format!("{e:?}"))?;
    bodies.retain(|mapping| !required.contains(mapping));
    match <[String; 1]>::try_from(bodies) {
        Ok([mapping]) => Ok(mapping),
        Err(_) => Err("no mail-body fetch mapping is granted".into()),
    }
}

fn open_clone(main: &Path) -> Result<EventStoreClone, String> {
    event_store_clone::open(main)
        .map_err(|f| format!("{}: {}", f.reason, f.detail))?
        .ok_or_else(|| "not a repository".to_owned())
}

/// Runs `work` on a publication port bound to this machine's mail-body ref and [`BODY_WRITER`],
/// under the machine's own `event-seal` hold, after recovering a transfer an earlier run left half
/// done. Fetch and push share this one door, so both run under the same authority and writer.
fn on_body_ref<T>(
    clone: &EventStoreClone,
    remote: &str,
    timeout: Option<Duration>,
    work: impl FnOnce(&PublicationPort<'_>, &RefName) -> Result<T, String>,
) -> Result<T, String> {
    if !fgos_identity::machine::valid_machine_id(&clone.machine) {
        return Err("this machine id is not a ref component".into());
    }
    let reference = RefName::parse(&format!("refs/fgos/mail-bodies/{}", clone.machine))
        .map_err(|e| e.to_string())?;
    let pinned_url = fgos_event_store::refspec::pinned_url(&clone.driver, &clone.repo, remote)
        .map_err(|e| e.to_string())?;
    let seal = clone.layout.seal_lock();
    let mut handle = match fgos_holder_lock::acquire(
        &Resource::new(SEAL_NAME, seal.clone()),
        Mode::Ex,
        Wait::Ms(APPEND_WAIT_MS),
        DEFAULT_KILL_WAIT_MS,
    ) {
        Acquire::Acquired(handle) => handle,
        other => return Err(format!("event-seal not taken: {other:?}")),
    };
    let done = (|| {
        let authority = HolderAuthority::new(
            &clone.repo,
            &mut handle,
            &seal,
            reference.clone(),
            BODY_WRITER,
        )
        .map_err(|e| format!("{e:?}"))?;
        let mut port = PublicationPort::new(&clone.driver, authority).with_remote(RemoteGrant {
            name: remote.to_owned(),
            pinned_url,
        });
        if let Some(timeout) = timeout {
            port = port.with_transport_timeout(timeout);
        }
        port.recover_own_transfers(&clone.repo)
            .map_err(|e| format!("body transfer recovery: {e:?}"))?;
        work(&port, &reference)
    })();
    // A release that cannot be proven is reported, never ignored; the work's result stands.
    let released = fgos_holder_lock::release(handle);
    match (done, released) {
        (Err(why), _) => Err(why),
        (Ok(value), fgos_holder_lock::Release::Released { .. }) => Ok(value),
        (Ok(_), stuck) => Err(format!("event-seal release: {stuck:?}")),
    }
}

/// What a body push may take. A send waits on it, so it is bounded well under the publication
/// port's default; an acknowledgement that did not arrive in time refuses the send.
const PUSH_TIMEOUT: Duration = Duration::from_secs(30);

/// Stores `body` as one blob, named by its sha256, in the tree of this machine's mail-body ref and
/// pushes the ref to `remote`; `Ok` only after the remote acknowledged the push. `machine` is the
/// id the event will name as its sender: a receiver looks the blob up under that id, so a store
/// that names its refs otherwise is refused.
///
/// The push builds on what the remote holds: it first fetches the mail-body mirrors, and the new
/// commit's tree is the union of the mirror tip's tree, this clone's own tip's tree (bodies a
/// refused earlier push left only here) and the new blob, with the mirror tip as its parent. The
/// push is leased on that mirror tip, so a remote that moved since the fetch (another clone of the
/// same machine, a rotation) refuses it and nothing the remote holds is replaced. A body already
/// in the tree adds nothing but is pushed again, so a push that failed earlier is made up by the
/// next send of the same text.
pub fn publish(main: &Path, remote: &str, machine: &str, body: &str) -> Result<(), String> {
    let clone = open_clone(main)?;
    if clone.machine != machine {
        return Err(format!(
            "the store names this machine {}, not {machine}",
            clone.machine
        ));
    }
    let mapping = body_mapping(remote)?;
    on_body_ref(&clone, remote, Some(PUSH_TIMEOUT), |port, reference| {
        let repo = &clone.repo;
        let failed = |what: &str, e: &dyn std::fmt::Debug| format!("{what}: {e:?}");
        let base = fetch_base(&clone, port, reference, remote, &mapping)?;
        let mut entries = base.entries;
        let name = sha256_hex(body.as_bytes()).into_bytes();
        if !entries.iter().any(|e| e.name == name) {
            let blob = port
                .write_blob(repo, body.as_bytes())
                .map_err(|e| failed("mail body write", &e))?;
            entries.push(TreeEntry {
                name,
                mode: 0o100644,
                oid: blob,
            });
        }
        let next = if entries.len() > base.mirrored {
            let tree = port
                .write_tree(repo, &entries)
                .map_err(|e| failed("mail body tree write", &e))?;
            let parents = base.mirror.iter().cloned().collect();
            Some(write_root(port, repo, tree, parents)?)
        } else {
            // Everything is on the mirror already: the own ref only has to stand on it.
            base.mirror.clone()
        };
        if let Some(next) = next.filter(|next| base.own.as_ref() != Some(next)) {
            move_ref(port, repo, reference, &base.expected, next)?;
        }
        push_acknowledged(port, repo, remote, reference)
    })
}

/// What a body fetch left to build on: the remote's tip as mirrored, this clone's own tip, and the
/// union of their trees.
struct Base {
    mirror: Option<Oid>,
    own: Option<Oid>,
    /// The own ref's current value, for the compare-and-swap that moves it.
    expected: ExpectedTip,
    /// The blobs of the mirror tip's tree, then those of the own tip's tree that it lacks (bodies a
    /// refused earlier push left only here).
    entries: Vec<TreeEntry>,
    /// How many of `entries` the mirror tip already holds.
    mirrored: usize,
}

/// Fetches the mail-body mirrors, then reads the tips and trees a new commit builds on.
fn fetch_base(
    clone: &EventStoreClone,
    port: &PublicationPort<'_>,
    reference: &RefName,
    remote: &str,
    mapping: &str,
) -> Result<Base, String> {
    let repo = &clone.repo;
    let failed = |what: &str, e: &dyn std::fmt::Debug| format!("{what}: {e:?}");
    port.fetch_refs(repo, remote, &[mapping.to_owned()])
        .map_err(|e| failed("mail body fetch", &e))?;
    let mirror = clone
        .driver
        .resolve_commit_ref(repo, &mirror_ref(remote, &clone.machine))
        .map_err(|e| failed("mail body mirror read", &e))?;
    let (own, expected) = match port
        .read_ref(repo, reference)
        .map_err(|e| failed("mail body ref read", &e))?
    {
        RefValue::Direct(tip) => (Some(tip.clone()), ExpectedTip::Oid(tip)),
        RefValue::Absent => (None, ExpectedTip::Absent),
        RefValue::Symbolic(_) => return Err("the mail-body ref is symbolic".into()),
    };
    let (entries, mirrored) = union_entries(clone, mirror.as_ref(), own.as_ref())?;
    Ok(Base {
        mirror,
        own,
        expected,
        entries,
        mirrored,
    })
}

/// The blobs of the mirror tip's tree followed by those of the own tip's tree the first lacks, and
/// how many the mirror tip holds.
fn union_entries(
    clone: &EventStoreClone,
    mirror: Option<&Oid>,
    own: Option<&Oid>,
) -> Result<(Vec<TreeEntry>, usize), String> {
    let mut entries = match mirror {
        Some(tip) => tree_entries(clone, tip)?,
        None => Vec::new(),
    };
    let mirrored = entries.len();
    if let Some(tip) = own {
        for entry in tree_entries(clone, tip)? {
            if !entries.iter().any(|e| e.name == entry.name) {
                entries.push(entry);
            }
        }
    }
    Ok((entries, mirrored))
}

/// A commit of the mail-body ref over `tree`, dated now, with the identity every body commit carries.
fn write_root(
    port: &PublicationPort<'_>,
    repo: &RepoHandle,
    tree: Oid,
    parents: Vec<Oid>,
) -> Result<Oid, String> {
    let identity = || Identity {
        name: "fgOS Mailbox".into(),
        email: "mailbox@fgos.invalid".into(),
    };
    let date = format!("{} +0000", now_secs());
    port.write_commit(
        repo,
        &CommitInput {
            tree,
            parents,
            author: identity(),
            committer: identity(),
            author_date: date.clone(),
            committer_date: date,
            message: b"mail bodies".to_vec(),
        },
    )
    .map_err(|e| format!("mail body commit: {e:?}"))
}

/// Moves the own mail-body ref from `expected` to `next`.
fn move_ref(
    port: &PublicationPort<'_>,
    repo: &RepoHandle,
    reference: &RefName,
    expected: &ExpectedTip,
    next: Oid,
) -> Result<(), String> {
    let operation = format!("mail-body-{}-{}", std::process::id(), next.as_str());
    port.compare_and_swap(
        repo,
        reference,
        expected,
        &ExpectedTip::Oid(next),
        &operation,
    )
    .map(|_| ())
    .map_err(|e| format!("mail body ref update: {e:?}"))
}

/// Pushes the own mail-body ref; `Ok` only when the remote acknowledged it.
fn push_acknowledged(
    port: &PublicationPort<'_>,
    repo: &RepoHandle,
    remote: &str,
    reference: &RefName,
) -> Result<(), String> {
    let pushed = port
        .push_refs(repo, remote, &[(reference.clone(), reference.clone())])
        .map_err(|e| format!("mail body push: {e:?}"))?;
    match pushed.refs.first() {
        Some((_, PushOutcome::Accepted)) => Ok(()),
        other => Err(format!("mail body push not acknowledged: {other:?}")),
    }
}

fn now_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |d| d.as_secs())
}

/// How long a blob with no message that names it is spared after the newest commit of the ref. A
/// send pushes its body before it appends the event, so a blob may lead its header by a moment; a
/// blob still without one after this long is the leftover of a send that never recorded.
const ORPHAN_GRACE_SECS: u64 = 600;

/// What a rotation did.
#[derive(Debug, PartialEq, Eq)]
pub enum Rotation {
    /// Every body kept is younger than the lifetime: nothing to cut.
    Idle,
    Rotated {
        kept: usize,
        dropped: usize,
    },
}

/// A rotation's new root, built and set as the own ref but not yet pushed.
#[derive(Debug)]
struct Staged {
    kept: usize,
    dropped: usize,
}

/// The age rule of a rotation: `sent` names each body's send time (see
/// `mailbox_remote::body_sent_times`), `lifetime_secs` is how long a body is kept.
pub struct Retention<'a> {
    pub sent: &'a BTreeMap<String, u64>,
    pub now_secs: u64,
    pub lifetime_secs: u64,
}

impl Retention<'_> {
    /// Splits `entries` into those kept and the count dropped. A body is kept while the message that
    /// names it was sent less than the lifetime ago. A body no message names is dropped once
    /// `orphans_expired`, otherwise kept for now.
    fn split(&self, entries: Vec<TreeEntry>, orphans_expired: bool) -> (Vec<TreeEntry>, usize) {
        let total = entries.len();
        let kept: Vec<TreeEntry> = entries
            .into_iter()
            .filter(|e| {
                match std::str::from_utf8(&e.name)
                    .ok()
                    .and_then(|n| self.sent.get(n))
                {
                    Some(sent) => self.now_secs.saturating_sub(*sent) < self.lifetime_secs,
                    None => !orphans_expired,
                }
            })
            .collect();
        let dropped = total - kept.len();
        (kept, dropped)
    }
}

/// The newest commit time among `tips`, in seconds; 0 when there is none.
fn newest_commit_secs(clone: &EventStoreClone, tips: &[Option<&Oid>]) -> Result<u64, String> {
    let mut newest = 0;
    for tip in tips.iter().flatten() {
        let time = clone
            .driver
            .commit_time(&clone.repo, tip)
            .map_err(|e| format!("mail body commit time: {e:?}"))?;
        newest = newest.max(u64::try_from(time).unwrap_or(0));
    }
    Ok(newest)
}

/// What `retention` keeps of the union of `mirror`'s and `own`'s trees.
fn retained(
    clone: &EventStoreClone,
    mirror: Option<&Oid>,
    own: Option<&Oid>,
    retention: &Retention<'_>,
) -> Result<(Vec<TreeEntry>, usize), String> {
    let (entries, _) = union_entries(clone, mirror, own)?;
    let newest = newest_commit_secs(clone, &[mirror, own])?;
    let orphans_expired = retention.now_secs.saturating_sub(newest) >= ORPHAN_GRACE_SECS;
    Ok(retention.split(entries, orphans_expired))
}

/// Resets this machine's mail-body ref on `remote` to a new root commit whose tree holds only the
/// bodies `retention` keeps, when it would drop at least one. Every body in the ref is in its tip's
/// tree (a push only adds), so a body older than the lifetime is cut by the first rotation after it
/// ages; the new root has no parent, so the dropped blobs are no longer reachable from the ref.
///
/// The root is built on what a fresh fetch of the mirrors brought, never on a copy of an earlier
/// look, and pushed under the lease on that mirror tip: a remote that moved since the fetch refuses
/// the push, nothing the remote holds is replaced, and the next sync tries again. The look before
/// the fetch reads the mirrors the sync's own body fetch just filled and takes no lock, so a sync
/// with nothing to cut costs no network call.
pub fn rotate(main: &Path, remote: &str, retention: &Retention<'_>) -> Result<Rotation, String> {
    let clone = open_clone(main)?;
    let mapping = body_mapping(remote)?;
    let resolve = |name: String| {
        clone
            .driver
            .resolve_commit_ref(&clone.repo, &name)
            .map_err(|e| format!("mail body ref read: {e:?}"))
    };
    let mirror = resolve(mirror_ref(remote, &clone.machine))?;
    let own = resolve(format!("refs/fgos/mail-bodies/{}", clone.machine))?;
    if retained(&clone, mirror.as_ref(), own.as_ref(), retention)?.1 == 0 {
        return Ok(Rotation::Idle);
    }
    on_body_ref(
        &clone,
        remote,
        Some(PUSH_TIMEOUT),
        |port, reference| match stage_rotation(
            &clone, port, reference, remote, &mapping, retention,
        )? {
            None => Ok(Rotation::Idle),
            Some(staged) => {
                push_acknowledged(port, &clone.repo, remote, reference)?;
                Ok(Rotation::Rotated {
                    kept: staged.kept,
                    dropped: staged.dropped,
                })
            }
        },
    )
}

/// Fetches the mirrors, builds the new root from what they hold and sets the own ref to it; `None`
/// when the fetched state has nothing to cut.
fn stage_rotation(
    clone: &EventStoreClone,
    port: &PublicationPort<'_>,
    reference: &RefName,
    remote: &str,
    mapping: &str,
    retention: &Retention<'_>,
) -> Result<Option<Staged>, String> {
    let repo = &clone.repo;
    let base = fetch_base(clone, port, reference, remote, mapping)?;
    let (kept, dropped) = retained(clone, base.mirror.as_ref(), base.own.as_ref(), retention)?;
    if dropped == 0 {
        return Ok(None);
    }
    let tree = port
        .write_tree(repo, &kept)
        .map_err(|e| format!("mail body tree write: {e:?}"))?;
    let root = write_root(port, repo, tree, Vec::new())?;
    move_ref(port, repo, reference, &base.expected, root)?;
    Ok(Some(Staged {
        kept: kept.len(),
        dropped,
    }))
}

/// What this machine's own mail-body ref holds, read from the clone without the network.
#[derive(Debug, PartialEq, Eq)]
pub struct Held {
    pub count: usize,
    /// When the oldest body whose message is known was sent, in seconds.
    pub oldest_sent_secs: Option<u64>,
    /// Bodies no message names.
    pub unnamed: usize,
}

impl Held {
    /// The `fgos mailbox status` line for a machine whose `bodyRef` is on: how many bodies its ref
    /// keeps and how old the oldest is, by the send time of the message that names it.
    pub fn text(&self, now_secs: u64, lifetime_secs: u64) -> String {
        let head = "cross-machine: mail bodies are kept in this machine's mail-body ref (mailbox.remote.bodyRef is on)";
        if self.count == 0 {
            return format!("{head}; none kept");
        }
        let oldest = match self.oldest_sent_secs {
            Some(sent) => format!(
                "the oldest was sent {} ago",
                ago(now_secs.saturating_sub(sent))
            ),
            None => "the age of none is known".to_owned(),
        };
        let unnamed = if self.unnamed > 0 && self.oldest_sent_secs.is_some() {
            format!(", {} with no message that names it", self.unnamed)
        } else {
            String::new()
        };
        format!(
            "{head}; {} kept, {oldest}{unnamed}; a body is kept for {}",
            self.count,
            ago(lifetime_secs)
        )
    }
}

/// The bodies on this machine's own mail-body ref, dated by `sent`.
pub fn held(main: &Path, sent: &BTreeMap<String, u64>) -> Result<Held, String> {
    let clone = open_clone(main)?;
    let tip = clone
        .driver
        .resolve_commit_ref(
            &clone.repo,
            &format!("refs/fgos/mail-bodies/{}", clone.machine),
        )
        .map_err(|e| format!("mail body ref read: {e:?}"))?;
    let entries = match &tip {
        Some(tip) => tree_entries(&clone, tip)?,
        None => Vec::new(),
    };
    let times: Vec<u64> = entries
        .iter()
        .filter_map(|e| std::str::from_utf8(&e.name).ok().and_then(|n| sent.get(n)))
        .copied()
        .collect();
    Ok(Held {
        count: entries.len(),
        oldest_sent_secs: times.iter().min().copied(),
        unnamed: entries.len() - times.len(),
    })
}

/// The blobs of the flat tree of the commit `tip`; an entry that is not a blob is refused.
fn tree_entries(clone: &EventStoreClone, tip: &Oid) -> Result<Vec<TreeEntry>, String> {
    let failed = |e: &dyn std::fmt::Debug| format!("mail body tree read: {e:?}");
    let mut entries = Vec::new();
    let mut cursor = None;
    loop {
        let page = clone
            .driver
            .list_tree(&clone.repo, tip, b"", cursor, 10_000)
            .map_err(|e| failed(&e))?;
        for listed in page.entries {
            if listed.kind != ObjectType::Blob || listed.path.contains(&b'/') {
                return Err("the mail-body ref holds an entry that is not a blob".into());
            }
            entries.push(TreeEntry {
                name: listed.path,
                mode: listed.mode,
                oid: listed.oid,
            });
        }
        match page.next_cursor {
            Some(next) if !page.complete => cursor = Some(next),
            _ => return Ok(entries),
        }
    }
}

/// The mirror of `machine`'s mail-body ref in this clone, for fetch remote `remote`.
pub fn mirror_ref(remote: &str, machine: &str) -> String {
    format!("refs/fgos/remotes/{remote}/mail-bodies/{machine}")
}

/// Reads bodies from the mirrors of one clone; opens the clone and resolves each machine's tip once.
pub struct BodyMirror<'a> {
    main: &'a Path,
    remote: &'a str,
    clone: Option<Option<EventStoreClone>>,
    tips: BTreeMap<String, Option<Oid>>,
}

impl<'a> BodyMirror<'a> {
    pub fn new(main: &'a Path, remote: &'a str) -> Self {
        Self {
            main,
            remote,
            clone: None,
            tips: BTreeMap::new(),
        }
    }

    /// The body `hash` names in `machine`'s mirror, checked against `hash` and `bytes`. An `Err`
    /// is a Git read that failed, never a verdict on the message.
    pub fn resolve(&mut self, machine: &str, hash: &str, bytes: u64) -> Result<Resolved, String> {
        if !fgos_identity::machine::valid_machine_id(machine) {
            return Ok(Resolved::Malformed);
        }
        if self.clone.is_none() {
            let opened = event_store_clone::open(self.main)
                .map_err(|f| format!("{}: {}", f.reason, f.detail))?;
            self.clone = Some(opened);
        }
        let clone = self.clone.as_ref().and_then(Option::as_ref);
        let Some(clone) = clone else {
            return Ok(Resolved::Expired);
        };
        if !self.tips.contains_key(machine) {
            let tip = clone
                .driver
                .resolve_commit_ref(&clone.repo, &mirror_ref(self.remote, machine))
                .map_err(|e| format!("mail body mirror of {machine}: {e:?}"))?;
            self.tips.insert(machine.to_owned(), tip);
        }
        let Some(tip) = &self.tips[machine] else {
            return Ok(Resolved::Expired);
        };
        let read = clone
            .driver
            .read_paths_at(
                &clone.repo,
                tip,
                &[hash.as_bytes().to_vec()],
                WIRE_MAX_BODY_BYTES as usize,
            )
            .map_err(|e| format!("mail body read of {machine}: {e:?}"))?
            .pop();
        Ok(match read.map(|r| r.value) {
            Some(PathValue::Blob(blob)) => check(&blob, hash, bytes),
            None | Some(PathValue::Absent) => Resolved::Expired,
            Some(PathValue::NotABlob(_)) => Resolved::Malformed,
            Some(PathValue::Error(e)) if e.cause == "blob-too-large" => Resolved::Malformed,
            Some(PathValue::Error(e)) => {
                return Err(format!("mail body read of {machine}: {}", e.cause))
            }
        })
    }
}

/// The sha256 of `bytes` as 64 lowercase hex digits: a body's `bodyHash` and the name of its blob.
pub fn sha256_hex(bytes: &[u8]) -> String {
    Sha256::digest(bytes)
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect()
}

/// `blob` is the body of a header that signed `hash` and `bytes`: same digest, same length, text.
pub fn check(blob: &[u8], hash: &str, bytes: u64) -> Resolved {
    if sha256_hex(blob) != hash || blob.len() as u64 != bytes {
        return Resolved::Malformed;
    }
    match std::str::from_utf8(blob) {
        Ok(text) => Resolved::Body(text.to_owned()),
        Err(_) => Resolved::Malformed,
    }
}

#[cfg(test)]
mod tests {
    use super::{check, mirror_ref, BodyMirror, Resolved};
    use sha2::{Digest, Sha256};
    use std::path::Path;
    use std::process::Command;

    fn hex(bytes: &[u8]) -> String {
        Sha256::digest(bytes)
            .iter()
            .map(|b| format!("{b:02x}"))
            .collect()
    }

    fn git(dir: &Path, args: &[&str], stdin: Option<&str>) -> String {
        use std::io::Write;
        let mut child = Command::new("git")
            .arg("-C")
            .arg(dir)
            .args(args)
            .env("GIT_AUTHOR_NAME", "t")
            .env("GIT_AUTHOR_EMAIL", "t@t")
            .env("GIT_COMMITTER_NAME", "t")
            .env("GIT_COMMITTER_EMAIL", "t@t")
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .spawn()
            .unwrap();
        child
            .stdin
            .take()
            .unwrap()
            .write_all(stdin.unwrap_or("").as_bytes())
            .unwrap();
        let out = child.wait_with_output().unwrap();
        assert!(out.status.success(), "git {args:?}");
        String::from_utf8(out.stdout).unwrap().trim().to_owned()
    }

    #[test]
    fn a_body_is_taken_only_when_its_digest_length_and_text_match_the_signed_header() {
        let body = "hello";
        let hash = hex(body.as_bytes());
        assert_eq!(
            check(body.as_bytes(), &hash, 5),
            Resolved::Body("hello".into())
        );
        assert_eq!(check(body.as_bytes(), &hash, 4), Resolved::Malformed);
        assert_eq!(check(b"hellO", &hash, 5), Resolved::Malformed);
        let binary = [0xff, 0xfe];
        assert_eq!(check(&binary, &hex(&binary), 2), Resolved::Malformed);
    }

    #[test]
    fn a_body_is_read_from_the_senders_mirror_and_a_missing_ref_or_blob_is_expired() {
        let dir = std::env::temp_dir().join(format!("fgos-body-mirror-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        git(&dir, &["init", "-q"], None);
        let held = "held body";
        let hash = hex(held.as_bytes());
        let blob = git(&dir, &["hash-object", "-w", "--stdin"], Some(held));
        // A tree entry whose name is another body's hash but whose bytes are not that body.
        let wrong_hash = hex(b"another body");
        let wrong = git(&dir, &["hash-object", "-w", "--stdin"], Some("not it"));
        let tree = git(
            &dir,
            &["mktree"],
            Some(&format!(
                "100644 blob {blob}\t{hash}\n100644 blob {wrong}\t{wrong_hash}\n"
            )),
        );
        let commit = git(&dir, &["commit-tree", &tree, "-m", "bodies"], None);
        let machine = "alpha-abcdef";
        git(
            &dir,
            &["update-ref", &mirror_ref("origin", machine), &commit],
            None,
        );

        let mut mirror = BodyMirror::new(&dir, "origin");
        assert_eq!(
            mirror.resolve(machine, &hash, held.len() as u64),
            Ok(Resolved::Body(held.into()))
        );
        assert_eq!(
            mirror.resolve(machine, &wrong_hash, 12),
            Ok(Resolved::Malformed)
        );
        assert_eq!(
            mirror.resolve(machine, &hex(b"gone"), 4),
            Ok(Resolved::Expired),
            "a blob the tip does not hold"
        );
        assert_eq!(
            mirror.resolve("beta-abcdef", &hash, held.len() as u64),
            Ok(Resolved::Expired),
            "a machine whose mirror was never fetched"
        );
        assert_eq!(
            mirror.resolve("../x", &hash, 1),
            Ok(Resolved::Malformed),
            "a machine id that is not a ref component"
        );
        let _ = std::fs::remove_dir_all(&dir);
    }

    /// The rotation's push is leased on the mirror its root was built on: when the remote moved
    /// after that fetch, the push is refused and the remote keeps the tip it has.
    #[test]
    fn a_rotation_built_before_the_remote_moved_is_refused_and_the_remote_keeps_its_tip() {
        use super::super::event_store_clone::EventStoreClone;
        use super::{
            body_mapping, move_ref, push_acknowledged, stage_rotation, write_root, Retention,
        };
        use fgos_event_store::{layout::Layout, registry::Registry};
        use fgos_git::{
            ExpectedTip, GitDriver, HolderAuthority, Publication, PublicationPort, RefName,
            RemoteGrant, ResolveRepo, TreeEntry,
        };
        use fgos_holder_lock::{acquire, Acquire, Mode, Resource, Wait};
        use std::collections::BTreeMap;
        use std::os::unix::fs::PermissionsExt;

        let t = std::env::temp_dir().join(format!("fgos-body-rotate-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&t);
        std::fs::create_dir_all(&t).unwrap();
        std::fs::set_permissions(&t, std::fs::Permissions::from_mode(0o700)).unwrap();
        let (remote, owner, other) = (t.join("remote"), t.join("owner"), t.join("other"));
        for dir in [&remote, &owner, &other] {
            git(&t, &["init", "-q", "--bare", dir.to_str().unwrap()], None);
        }
        git(
            &owner,
            &["remote", "add", "origin", remote.to_str().unwrap()],
            None,
        );
        let driver = GitDriver::new(&t).unwrap();
        let repo = match driver.resolve_repo(&owner, &owner).unwrap() {
            ResolveRepo::Repository(repo) => repo,
            _ => panic!("the owner is a repository"),
        };
        let fence = repo.trusted_main_root().join(".fgos/locks/activation.lock");
        std::fs::create_dir_all(&fence).unwrap();
        std::fs::write(
            fence.join("TOMBSTONE"),
            "{\"at\":\"fixture\",\"v\":1,\"lock\":\"activation\",\"by\":\"fgos git\"}\n",
        )
        .unwrap();
        let clone = EventStoreClone {
            layout: Layout::from_common_dir(Some(repo.common_dir())).unwrap(),
            registry: Registry::shipped().unwrap(),
            machine: "alpha-abcdef".into(),
            driver,
            repo,
        };
        let seal = t.join("seal.lock");
        let mut handle = match acquire(
            &Resource::new("event-seal", &seal),
            Mode::Ex,
            Wait::Ms(5_000),
            2_000,
        ) {
            Acquire::Acquired(handle) => handle,
            other => panic!("{other:?}"),
        };
        let reference = RefName::parse("refs/fgos/mail-bodies/alpha-abcdef").unwrap();
        let authority =
            HolderAuthority::new(&clone.repo, &mut handle, &seal, reference.clone(), "test")
                .unwrap();
        let port = PublicationPort::new(&clone.driver, authority).with_remote(RemoteGrant {
            name: "origin".into(),
            pinned_url: remote.to_str().unwrap().into(),
        });
        let repo = &clone.repo;
        let mapping = body_mapping("origin").unwrap();

        // The remote holds one commit with an old and a young body.
        let (old, young) = (hex(b"old body"), hex(b"young body"));
        let entry = |name: &str, text: &[u8]| TreeEntry {
            name: name.as_bytes().to_vec(),
            mode: 0o100644,
            oid: port.write_blob(repo, text).unwrap(),
        };
        let tree = port
            .write_tree(
                repo,
                &[entry(&old, b"old body"), entry(&young, b"young body")],
            )
            .unwrap();
        let first = write_root(&port, repo, tree, Vec::new()).unwrap();
        move_ref(&port, repo, &reference, &ExpectedTip::Absent, first).unwrap();
        push_acknowledged(&port, repo, "origin", &reference).unwrap();

        let now = super::now_secs();
        let sent = BTreeMap::from([(old, now - 8 * 86_400), (young, now - 86_400)]);
        let retention = Retention {
            sent: &sent,
            now_secs: now,
            lifetime_secs: 7 * 86_400,
        };
        let staged = stage_rotation(&clone, &port, &reference, "origin", &mapping, &retention)
            .unwrap()
            .expect("the old body is due to be cut");
        assert_eq!((staged.kept, staged.dropped), (1, 1));

        // Another writer of the ref moves the remote after the rotation's fetch.
        let moved = git(
            &other,
            &[
                "-c",
                "user.name=Other",
                "-c",
                "user.email=other@example.invalid",
                "commit-tree",
                "-m",
                "moved",
                &git(&other, &["mktree"], None),
            ],
            None,
        );
        git(
            &other,
            &[
                "push",
                "--force",
                remote.to_str().unwrap(),
                &format!("{moved}:refs/fgos/mail-bodies/alpha-abcdef"),
            ],
            None,
        );
        let refused = push_acknowledged(&port, repo, "origin", &reference).unwrap_err();
        assert!(refused.contains("RejectedNonFastForward"), "{refused}");
        assert_eq!(
            git(
                &remote,
                &["rev-parse", "refs/fgos/mail-bodies/alpha-abcdef"],
                None
            ),
            moved
        );
        drop(port);
        let _ = fgos_holder_lock::release(handle);
        let _ = std::fs::remove_dir_all(&t);
    }

    #[test]
    fn a_body_is_kept_while_the_message_naming_it_is_younger_than_the_lifetime_and_a_nameless_one_only_until_the_grace_ends(
    ) {
        use super::Retention;
        use fgos_git::{Oid, TreeEntry};
        use std::collections::BTreeMap;
        let (young, old, nameless) = (hex(b"young"), hex(b"old"), hex(b"nameless"));
        let oid = Oid::parse(&"1".repeat(40), fgos_git::ObjectFormat::Sha1).unwrap();
        let entries = || {
            [&young, &old, &nameless]
                .into_iter()
                .map(|name| TreeEntry {
                    name: name.as_bytes().to_vec(),
                    mode: 0o100644,
                    oid: oid.clone(),
                })
                .collect::<Vec<_>>()
        };
        let sent = BTreeMap::from([(young.clone(), 900), (old.clone(), 100)]);
        let retention = Retention {
            sent: &sent,
            now_secs: 1000,
            lifetime_secs: 500,
        };
        let names = |kept: Vec<TreeEntry>| {
            kept.into_iter()
                .map(|e| String::from_utf8(e.name).unwrap())
                .collect::<Vec<_>>()
        };
        let (kept, dropped) = retention.split(entries(), false);
        assert_eq!(names(kept), [young.clone(), nameless.clone()]);
        assert_eq!(dropped, 1);
        let (kept, dropped) = retention.split(entries(), true);
        assert_eq!(names(kept), [young]);
        assert_eq!(dropped, 2);
    }
}
