//! The shared directory: the sessions of other machines, carried by the Event
//! Store as signed events and folded into a view this machine can resolve
//! against. This is the pure part: the payloads, their signature, the fold and
//! the answers. Reading and appending events is the [`EntryLog`] port, which
//! the host implements over the store (the store depends on this crate, so
//! this crate never imports it).
//!
//! An event is trusted only through its signature: `sig` signs the canonical
//! JSON of the payload without `sig`, under a domain text of its own, and must
//! come from the machine the payload names. A remote entry never claims the
//! session is alive; it is as fresh as the last fetch.

use crate::current::MachineInfo;
use crate::directory::{is_role_alias, Listed};
use crate::machine;
use crate::pins::{self, PinState};
use crate::refusal::{Candidate, Liveness, Refusal, Remote};
use crate::signing::{self, Signature, Verified};
use crate::text::iso_utc_now;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::{BTreeMap, BTreeSet};
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};

/// The Event Store stream the shared directory lives in.
pub const STREAM: &str = "project:identity";
pub const SESSION_PUBLISHED: &str = "identity.session-published";
pub const SESSION_ENDED: &str = "identity.session-ended";
const PAYLOAD_VERSION: u64 = 1;
/// Prefix of the signed bytes, so a directory signature is never valid for another purpose.
const DOMAIN: &str = "fgos-identity-directory/1\n";

/// The machine an event names as its publisher.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct MachineRef {
    pub id: String,
    pub handle: String,
}

impl From<&MachineInfo> for MachineRef {
    fn from(machine: &MachineInfo) -> Self {
        Self { id: machine.id.clone(), handle: machine.handle.clone() }
    }
}

/// One event as the store hands it back: its type and payload, in the store's
/// deterministic order (never by timestamp).
#[derive(Debug, Clone, PartialEq)]
pub struct RawEvent {
    pub event_type: String,
    pub payload: Value,
}

/// The port to the log the events travel in: append one event of the stream,
/// read the whole stream in the store's order with the time of the clone's
/// last fetch (`None` when it never fetched).
pub trait EntryLog {
    fn append(&self, event_type: &str, payload: Value) -> Result<(), Refusal>;
    fn read(&self) -> Result<(Vec<RawEvent>, Option<String>), Refusal>;
}

/// Opens the log of the clone a verb runs in. The host implements it over the
/// Event Store; a provider built without one has no shared directory.
pub trait LogDoor: Send + Sync + std::fmt::Debug {
    /// `Ok(None)` when `dir` has no log to use: not in a repository. `writer` is the id recorded as the
    /// author of the events appended through the log.
    fn open(&self, dir: &Path, writer: &str) -> Result<Option<Box<dyn EntryLog>>, Refusal>;
}

fn refuse(reason: &'static str, detail: impl Into<String>) -> Refusal {
    Refusal { reason, detail: detail.into(), candidates: Vec::new() }
}

/// The entry fields that travel; the clone path and the liveness stay local.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SharedEntry {
    id: String,
    handle: String,
    cli: String,
    project_id: Option<String>,
    roles: Vec<String>,
    registered_at: String,
}

#[derive(Deserialize)]
struct Published {
    entry: SharedEntry,
    machine: MachineRef,
}

#[derive(Deserialize)]
struct Ended {
    id: String,
    machine: MachineRef,
}

/// What an event says about one session id, once parsed.
enum Claim {
    Published(Published),
    Ended(Ended),
}

impl Claim {
    /// A payload is a published entry when it carries one, else an end.
    fn of_payload(payload: &Value) -> Option<Self> {
        let published = payload.get("entry").is_some();
        let kind = if published { SESSION_PUBLISHED } else { SESSION_ENDED };
        Self::parse(kind, payload)
    }

    fn parse(event_type: &str, payload: &Value) -> Option<Self> {
        match event_type {
            SESSION_PUBLISHED => serde_json::from_value(payload.clone()).ok().map(Self::Published),
            SESSION_ENDED => serde_json::from_value(payload.clone()).ok().map(Self::Ended),
            _ => None,
        }
    }

    fn id(&self) -> &str {
        match self {
            Self::Published(p) => &p.entry.id,
            Self::Ended(e) => &e.id,
        }
    }

    fn machine(&self) -> &MachineRef {
        match self {
            Self::Published(p) => &p.machine,
            Self::Ended(e) => &e.machine,
        }
    }
}

/// The payload of `identity.session-published` for `entry`, signed by this machine.
pub fn published_payload(state_root: &Path, entry: &Listed, machine: &MachineRef) -> Result<Value, Refusal> {
    sign_payload(
        state_root,
        json!({
            "v": PAYLOAD_VERSION,
            "entry": {
                "id": entry.id,
                "handle": entry.handle,
                "cli": entry.cli,
                "projectId": entry.project_id,
                "roles": entry.roles,
                "registeredAt": entry.registered_at,
            },
            "machine": machine,
            "publishedAt": iso_utc_now(),
        }),
    )
}

/// The payload of `identity.session-ended` for the session `id`, signed by this machine.
pub fn ended_payload(state_root: &Path, id: &str, machine: &MachineRef) -> Result<Value, Refusal> {
    sign_payload(
        state_root,
        json!({ "v": PAYLOAD_VERSION, "id": id, "machine": machine, "endedAt": iso_utc_now() }),
    )
}

fn signed_bytes(payload: &Value) -> Result<Vec<u8>, Refusal> {
    let canonical = fgos_canonical_json::canonical_json(payload)
        .map_err(|e| refuse("invalid-payload", e.to_string()))?;
    Ok(format!("{DOMAIN}{canonical}").into_bytes())
}

/// `payload` (an object without `sig`) with this machine's signature added.
pub fn sign_payload(state_root: &Path, mut payload: Value) -> Result<Value, Refusal> {
    let signature = signing::sign(state_root, &signed_bytes(&payload)?)?;
    payload
        .as_object_mut()
        .ok_or_else(|| refuse("invalid-payload", "payload is not an object"))?
        .insert("sig".into(), serde_json::to_value(signature).expect("Signature always serializes"));
    Ok(payload)
}

/// Checks the signature of an event payload and that it speaks for its own
/// machine: the signer is the machine the payload names, and the session id
/// belongs to that machine. Pins the machine's first key (see [`signing::verify`]).
pub fn verify_payload(state_root: &Path, payload: &Value) -> Result<Verified, Refusal> {
    let mut unsigned = payload.clone();
    let sig = unsigned
        .as_object_mut()
        .and_then(|object| object.remove("sig"))
        .ok_or_else(|| refuse("invalid-signature", "the payload carries no sig"))?;
    let signature: Signature = serde_json::from_value(sig).map_err(|e| refuse("invalid-signature", e.to_string()))?;
    let claim = Claim::of_payload(&unsigned)
        .ok_or_else(|| refuse("invalid-payload", "the payload is not a directory event"))?;
    let machine_id = &claim.machine().id;
    let owns_id = claim.id().split_once('/').is_some_and(|(owner, _)| owner == machine_id);
    if signature.machine_id != *machine_id || !owns_id {
        return Err(refuse(
            "machine-mismatch",
            format!("the event names machine {machine_id}, signed by {}, for session {}", signature.machine_id, claim.id()),
        ));
    }
    signing::verify(state_root, &signed_bytes(&unsigned)?, &signature)
}

/// An event dropped from the view, and whose machine it named.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Dropped {
    /// `bad-signature`, `machine-mismatch`, `key-changed`, or the refusal code of any other failure.
    pub reason: String,
    pub machine_id: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
struct RemoteEntry {
    #[serde(flatten)]
    entry: SharedEntry,
    machine: MachineRef,
    pin: PinState,
}

const CACHE_VERSION: u32 = 1;
const CACHE_FILE: &str = "identity-directory.json";

/// The verified view as it is kept beside the clone (`.fgos/cache/identity-directory.json`
/// of the main checkout): what a read can show without the store, and the
/// payloads whose signature already held, so the next fold skips their
/// `ssh-keygen`. Untracked and rebuildable: a missing or unreadable file is
/// folded again from the store, the only truth.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Cache {
    v: u32,
    pub fetched_at: Option<String>,
    entries: Vec<RemoteEntry>,
    pub dropped: Vec<Dropped>,
    /// SHA-256 (hex) of each payload and signature that verified.
    verified: BTreeSet<String>,
}

/// Where the cache of the main checkout at `main_root` lives.
pub fn cache_path(main_root: &Path) -> PathBuf {
    main_root.join(".fgos").join("cache").join(CACHE_FILE)
}

/// The cache at `path`, or `None` when it is missing, unreadable or of another version.
pub fn read_cache(path: &Path) -> Option<Cache> {
    let cache: Cache = serde_json::from_slice(&std::fs::read(path).ok()?).ok()?;
    (cache.v == CACHE_VERSION).then_some(cache)
}

/// Writes `cache` durably and atomically; a file that already says the same is left alone.
pub fn write_cache(path: &Path, cache: &Cache) -> Result<(), Refusal> {
    let mut bytes = serde_json::to_vec(cache).expect("Cache always serializes");
    bytes.push(b'\n');
    if std::fs::read(path).is_ok_and(|held| held == bytes) {
        return Ok(());
    }
    let (dir, name) = (path.parent().unwrap_or(Path::new(".")), CACHE_FILE);
    std::fs::create_dir_all(dir).map_err(|e| refuse("cache-write-failed", format!("{}: {e}", dir.display())))?;
    fgos_durable_file::replace_durably_with_mode(dir, name, &bytes, 0o600)
        .map(|_| ())
        .map_err(|e| refuse("cache-write-failed", format!("{}: {e}", path.display())))
}

/// What a signature check covers: the signed bytes and the signature itself.
fn verified_key(payload: &Value) -> Option<String> {
    let mut unsigned = payload.clone();
    let sig = unsigned.as_object_mut()?.remove("sig")?;
    let signature: Signature = serde_json::from_value(sig).ok()?;
    let mut hash = Sha256::new();
    hash.update(signed_bytes(&unsigned).ok()?);
    hash.update(signature.public_key.as_bytes());
    hash.update(signature.sig.as_bytes());
    Some(hash.finalize().iter().map(|byte| format!("{byte:02x}")).collect())
}

/// [`verify_payload`], unless `known` already holds this payload verified and
/// the machine is still pinned to the key that signed it (a re-keyed machine
/// is checked again).
fn verify_known(state_root: &Path, payload: &Value, known: Option<&Cache>, pinned: &BTreeMap<String, pins::Pin>) -> (Result<Verified, Refusal>, Option<String>) {
    let key = verified_key(payload);
    if let (Some(cache), Some(key)) = (known, &key) {
        let signer = payload.pointer("/sig/machineId").and_then(Value::as_str).unwrap_or_default();
        let signing_key = payload.pointer("/sig/publicKey").and_then(Value::as_str).unwrap_or_default();
        if let Some(pin) = pinned.get(signer).filter(|pin| pin.public_key == signing_key) {
            if cache.verified.contains(key) {
                let verified = Verified { machine_id: signer.to_owned(), fingerprint: pin.fingerprint.clone(), first_seen: false, state: pin.state };
                return (Ok(verified), Some(key.clone()));
            }
        }
    }
    let result = verify_payload(state_root, payload);
    let key = if result.is_ok() { key } else { None };
    (result, key)
}

/// The entries other machines published, as the fold of the log leaves them.
pub struct SharedView {
    /// Oldest event first; roles already moved to the later claimant.
    entries: Vec<RemoteEntry>,
    fetched_at: Option<String>,
    pub dropped: Vec<Dropped>,
    verified: BTreeSet<String>,
}

/// Folds the events of `project:identity`, in the store's order: the last
/// event of an id that verifies decides it (an `identity.session-ended` removes
/// it), events that do not verify are dropped and counted, and events of this
/// machine are skipped (its own directory is the local one). A role held by
/// entries of two machines goes to the later event. Only the newest event per
/// id is verified unless it is dropped, plus the first event of each machine,
/// which is verified first so the key a machine is pinned to is the one it
/// published first, not the one of its newest event.
pub fn fold(state_root: &Path, events: &[RawEvent], fetched_at: Option<String>, known: Option<&Cache>) -> SharedView {
    let own = machine::read(state_root).ok();
    let pinned: BTreeMap<String, pins::Pin> =
        pins::list(state_root).unwrap_or_default().into_iter().map(|pin| (pin.machine_id.clone(), pin)).collect();
    let mut verified = BTreeSet::new();
    let mut check = |payload: &Value| {
        let (result, key) = verify_known(state_root, payload, known, &pinned);
        verified.extend(key);
        result
    };
    let mut decided: BTreeMap<String, Option<(usize, RemoteEntry)>> = BTreeMap::new();
    let mut dropped = Vec::new();
    let mut checked: BTreeMap<usize, Result<Verified, Refusal>> = BTreeMap::new();
    let mut pinned_first = BTreeSet::new();
    for (position, event) in events.iter().enumerate() {
        let Some(claim) = Claim::parse(&event.event_type, &event.payload) else { continue };
        let machine_id = &claim.machine().id;
        if own.as_deref() != Some(machine_id.as_str()) && pinned_first.insert(machine_id.clone()) {
            checked.insert(position, check(&event.payload));
        }
    }
    for (position, event) in events.iter().enumerate().rev() {
        let Some(claim) = Claim::parse(&event.event_type, &event.payload) else { continue };
        let id = claim.id().to_owned();
        if decided.contains_key(&id) || own.as_deref() == Some(claim.machine().id.as_str()) {
            continue;
        }
        let result = checked.remove(&position).unwrap_or_else(|| check(&event.payload));
        match result {
            Ok(verified) => {
                let outcome = match claim {
                    Claim::Published(p) => Some((position, RemoteEntry { entry: p.entry, machine: p.machine, pin: verified.state })),
                    Claim::Ended(_) => None,
                };
                decided.insert(id, outcome);
            }
            Err(refusal) => dropped.push(Dropped {
                reason: if refusal.reason == "machine-key-changed" { "key-changed" } else { refusal.reason }.to_owned(),
                machine_id: claim.machine().id.clone(),
            }),
        }
    }
    let mut live: Vec<(usize, RemoteEntry)> = decided.into_values().flatten().collect();
    live.sort_by_key(|(position, _)| *position);
    let mut entries: Vec<RemoteEntry> = live.into_iter().map(|(_, remote)| remote).collect();
    // The later event keeps a role; a machine handle another machine already
    // uses shows as the machine id instead.
    let mut claimed = BTreeSet::new();
    for remote in entries.iter_mut().rev() {
        remote.entry.roles.retain(|role| claimed.insert(role.clone()));
    }
    let mut handles: BTreeMap<String, String> = BTreeMap::new();
    for remote in &mut entries {
        let first = handles.entry(remote.machine.handle.clone()).or_insert_with(|| remote.machine.id.clone());
        if *first != remote.machine.id {
            remote.machine.handle = remote.machine.id.clone();
        }
    }
    SharedView { entries, fetched_at, dropped, verified }
}

impl SharedView {
    /// What to keep beside the clone: this view and the payloads it verified.
    pub fn cache(&self) -> Cache {
        Cache {
            v: CACHE_VERSION,
            fetched_at: self.fetched_at.clone(),
            entries: self.entries.clone(),
            dropped: self.dropped.clone(),
            verified: self.verified.clone(),
        }
    }

    pub fn len(&self) -> usize {
        self.entries.len()
    }

    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }

    /// Keeps only the entries of `project_id`; two projects on one remote never mix.
    pub fn retain_project(&mut self, project_id: &str) {
        self.entries.retain(|remote| remote.entry.project_id.as_deref() == Some(project_id));
    }

    fn remote(&self, remote: &RemoteEntry) -> Remote {
        Remote { machine: remote.machine.clone(), fetched_at: self.fetched_at.clone(), pin: remote.pin }
    }

    fn listed(&self, remote: &RemoteEntry) -> Listed {
        let entry = &remote.entry;
        Listed {
            id: entry.id.clone(),
            handle: entry.handle.clone(),
            cli: entry.cli.clone(),
            project_id: entry.project_id.clone(),
            clone: None,
            registered_at: entry.registered_at.clone(),
            roles: entry.roles.clone(),
            liveness: Liveness::Remote,
            remote: Some(self.remote(remote)),
        }
    }

    fn candidate(&self, remote: &RemoteEntry) -> Candidate {
        Candidate {
            id: remote.entry.id.clone(),
            handle: remote.entry.handle.clone(),
            liveness: Liveness::Remote,
            remote: Some(self.remote(remote)),
        }
    }

    /// The one remote entry `query` names: a handle, a role alias or a full
    /// id. Refused `not-found` or `ambiguous` like the local directory.
    pub fn resolve(&self, query: &str) -> Result<Listed, Refusal> {
        let query = query.trim();
        let is_role = is_role_alias(query);
        let by_id = query.contains('/');
        let names = |remote: &RemoteEntry| -> Vec<String> {
            if by_id {
                vec![remote.entry.id.clone()]
            } else if is_role {
                remote.entry.roles.clone()
            } else {
                vec![remote.entry.handle.clone()]
            }
        };
        let hits: Vec<&RemoteEntry> = self.entries.iter().filter(|r| names(r).iter().any(|n| n == query)).collect();
        match hits.as_slice() {
            [one] => Ok(self.listed(one)),
            [] => {
                let near: Vec<&RemoteEntry> =
                    self.entries.iter().filter(|r| !query.is_empty() && names(r).iter().any(|n| n.contains(query))).collect();
                Err(Refusal {
                    reason: "not-found",
                    detail: format!("no remote session is named {query:?}; candidates: {}", join(near.iter().flat_map(|r| names(r)))),
                    candidates: near.iter().map(|r| self.candidate(r)).collect(),
                })
            }
            many => Err(Refusal {
                reason: "ambiguous",
                detail: format!(
                    "{query:?} names {} remote sessions: {}",
                    many.len(),
                    join(many.iter().map(|r| format!("{} ({})", r.entry.handle, r.entry.id)))
                ),
                candidates: many.iter().map(|r| self.candidate(r)).collect(),
            }),
        }
    }

    /// The remote entries, oldest registration first; only those of
    /// `project_id` when given. A role that `taken` (held by a live local
    /// session) names is not shown on a remote entry: the proven holder wins.
    pub fn list(&self, project_id: Option<&str>, taken: &[String]) -> Vec<Listed> {
        let mut listed: Vec<Listed> = self
            .entries
            .iter()
            .filter(|r| project_id.is_none_or(|id| r.entry.project_id.as_deref() == Some(id)))
            .map(|r| {
                let mut one = self.listed(r);
                one.roles.retain(|role| !taken.contains(role));
                one
            })
            .collect();
        listed.sort_by(|a, b| (&a.registered_at, &a.handle).cmp(&(&b.registered_at, &b.handle)));
        listed
    }
}

fn join(names: impl IntoIterator<Item = String>) -> String {
    let names: Vec<String> = names.into_iter().collect();
    if names.is_empty() {
        "none".into()
    } else {
        names.join(", ")
    }
}


/// Publishes what changed since this machine's last events in `log`: `own`
/// (the entry just written locally) when it is new or its handle, project or
/// roles differ from what was published, and an `identity.session-ended` for
/// every session this machine published that is neither `own` nor in `live`
/// any more. Returns how many events it appended; publishing on change only
/// keeps the chain from growing with every registration.
pub fn publish_changes(
    state_root: &Path,
    log: &dyn EntryLog,
    machine: &MachineInfo,
    own: Option<&Listed>,
    live: &[Listed],
) -> Result<usize, Refusal> {
    let me = MachineRef::from(machine);
    let (events, _) = log.read()?;
    let mut last: BTreeMap<String, Option<SharedEntry>> = BTreeMap::new();
    for event in &events {
        match Claim::parse(&event.event_type, &event.payload) {
            Some(Claim::Published(p)) if p.machine.id == me.id => {
                last.insert(p.entry.id.clone(), Some(p.entry));
            }
            Some(Claim::Ended(e)) if e.machine.id == me.id => {
                last.insert(e.id, None);
            }
            _ => {}
        }
    }
    let mut appended = 0;
    if let Some(own) = own.filter(|own| own.project_id.is_some()) {
        let published = last.get(&own.id).and_then(Option::as_ref);
        let unchanged = published.is_some_and(|p| {
            p.handle == own.handle && p.project_id == own.project_id && p.roles == own.roles
        });
        if !unchanged {
            log.append(SESSION_PUBLISHED, published_payload(state_root, own, &me)?)?;
            appended += 1;
        }
    }
    let kept: BTreeSet<&str> = live.iter().chain(own).map(|listed| listed.id.as_str()).collect();
    for (id, state) in &last {
        if state.is_some() && !kept.contains(id.as_str()) {
            log.append(SESSION_ENDED, ended_payload(state_root, id, &me)?)?;
            appended += 1;
        }
    }
    Ok(appended)
}
