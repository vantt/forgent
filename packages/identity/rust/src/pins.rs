//! Pinned machine keys: the first key seen for a machine id is remembered in
//! user state, like SSH `known_hosts`, and a different key claimed for that
//! machine is refused afterwards. One file per machine under
//! `<state root>/identity/pins/<machine id>`, created once and atomically, so
//! racing first sightings settle by the create and the loser compares.
//! A pin is `seen` until the owner compares fingerprints and confirms it
//! ([`confirm`]); consumers that want no trust-on-first-use require `confirmed`.
//! User level: every project on the machine shares the pins; none is ever
//! written into a repository.

use crate::machine::valid_machine_id;
use crate::refusal::Refusal;
use crate::text::iso_utc_now;
use fgos_holder_lock::{LockScope, ScopeError, Wait};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

/// Still 1: `state` and `confirmedAt` are additive, readers ignore unknown
/// fields, and a file without `state` reads as `seen`.
const VERSION: u32 = 1;
/// Registry name of the lock that serialises [`confirm`] and [`forget`], so a
/// confirm never resurrects a forgotten pin.
const LOCK_NAME: &str = "identity-pins";
const LOCK_WAIT_MS: u64 = 10_000;

/// How far a pinned key is trusted.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PinState {
    /// First sighting; the owner has not compared fingerprints.
    #[default]
    Seen,
    /// The owner compared the fingerprint and confirmed it.
    Confirmed,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Pin {
    pub v: u32,
    pub machine_id: String,
    pub public_key: String,
    pub fingerprint: String,
    pub first_seen: String,
    #[serde(default)]
    pub state: PinState,
    /// Present only when `state` is `confirmed`.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub confirmed_at: Option<String>,
}

impl Pin {
    pub fn new(machine_id: &str, public_key: &str, fingerprint: &str, first_seen: &str) -> Self {
        Self {
            v: VERSION,
            machine_id: machine_id.to_owned(),
            public_key: public_key.to_owned(),
            fingerprint: fingerprint.to_owned(),
            first_seen: first_seen.to_owned(),
            state: PinState::Seen,
            confirmed_at: None,
        }
    }
}

/// What [`record`] found.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Recorded {
    /// The machine was unknown; this key is now its pin.
    Created,
    /// The machine was pinned to this same key (carried, with its state).
    Same(Pin),
    /// The machine is pinned to another key (carried).
    Different(Pin),
}

fn refuse(reason: &'static str, detail: impl Into<String>) -> Refusal {
    Refusal { reason, detail: detail.into(), candidates: Vec::new() }
}

pub fn directory(state_root: &Path) -> PathBuf {
    state_root.join("identity").join("pins")
}

fn read_file(path: &Path) -> Result<Pin, Refusal> {
    let raw = fs::read_to_string(path).map_err(|e| refuse("pins-unreadable", format!("{}: {e}", path.display())))?;
    serde_json::from_str::<Pin>(&raw)
        .ok()
        .filter(|pin| pin.v == VERSION && valid_machine_id(&pin.machine_id))
        .ok_or_else(|| refuse("pins-unreadable", format!("{} is not a pin file", path.display())))
}

/// Pins `pin` unless its machine already has one. A pin file that cannot be
/// read refuses (fail closed): it is never replaced by a new sighting.
pub fn record(state_root: &Path, pin: &Pin) -> Result<Recorded, Refusal> {
    if !valid_machine_id(&pin.machine_id) {
        return Err(refuse("invalid-signature", "machineId is not a machine id"));
    }
    let dir = directory(state_root);
    fs::create_dir_all(&dir).map_err(|e| refuse("pin-write-failed", format!("{}: {e}", dir.display())))?;
    let mut bytes = serde_json::to_vec(pin).expect("Pin always serializes");
    bytes.push(b'\n');
    match fgos_durable_file::install_once_with_mode(&dir, &pin.machine_id, &bytes, 0o600) {
        Ok(fgos_durable_file::Installed::Created) => Ok(Recorded::Created),
        Ok(fgos_durable_file::Installed::AlreadyExists) => {
            let existing = read_file(&dir.join(&pin.machine_id))?;
            Ok(if existing.public_key == pin.public_key { Recorded::Same(existing) } else { Recorded::Different(existing) })
        }
        Err(e) => Err(refuse("pin-write-failed", e.to_string())),
    }
}

/// Every pin, by machine id.
pub fn list(state_root: &Path) -> Result<Vec<Pin>, Refusal> {
    let dir = directory(state_root);
    let entries = match fs::read_dir(&dir) {
        Ok(entries) => entries,
        Err(e) if e.kind() == io::ErrorKind::NotFound => return Ok(Vec::new()),
        Err(e) => return Err(refuse("pins-unreadable", format!("{}: {e}", dir.display()))),
    };
    let mut pins = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|e| refuse("pins-unreadable", e.to_string()))?;
        // Leftover temporary names of an interrupted install are not pins.
        if entry.file_name().to_str().is_some_and(valid_machine_id) {
            pins.push(read_file(&entry.path())?);
        }
    }
    pins.sort_by(|a, b| a.machine_id.cmp(&b.machine_id));
    Ok(pins)
}

/// Removes the pin of `machine_id` after a legitimate re-key; the next valid
/// signature of that machine pins its new key. Returns the pin removed.
pub fn forget(state_root: &Path, machine_id: &str) -> Result<Pin, Refusal> {
    if !valid_machine_id(machine_id) {
        return Err(refuse("invalid-machine-id", format!("{machine_id:?} is not a machine id")));
    }
    let _lock = lock(state_root)?;
    let path = directory(state_root).join(machine_id);
    let pin = read_file(&path).map_err(|e| {
        if path.exists() { e } else { refuse("pin-not-found", format!("machine {machine_id} has no pinned key")) }
    })?;
    fs::remove_file(&path).map_err(|e| refuse("pin-write-failed", format!("{}: {e}", path.display())))?;
    Ok(pin)
}

/// Takes the registered `identity-pins` lock (`<state root>/locks/identity-pins.lock`) through
/// holder-lock; it is released when the scope drops.
fn lock(state_root: &Path) -> Result<LockScope<'static>, Refusal> {
    let failed = |e: ScopeError| refuse("pin-write-failed", format!("cannot take the pins lock: {e}"));
    let mut scope = LockScope::seeded(Vec::new()).map_err(failed)?;
    let params = BTreeMap::from([("lockRoot".to_owned(), state_root.join("locks").to_string_lossy().into_owned())]);
    scope.acquire(LOCK_NAME, &params, Wait::Ms(LOCK_WAIT_MS)).map_err(failed)?;
    Ok(scope)
}

/// Marks the pin of `machine_id` confirmed, after the owner compared
/// `fingerprint` with the one the machine itself reports. Refuses
/// `pin-missing` when the machine has no pin and `fingerprint-mismatch` (naming
/// both) when the pinned key is another one; a pin already confirmed is
/// returned as it is. Runs under the pins lock and reads the pin inside it, so a
/// concurrent [`forget`] either wins (`pin-missing`) or runs after the confirm.
pub fn confirm(state_root: &Path, machine_id: &str, fingerprint: &str) -> Result<Pin, Refusal> {
    if !valid_machine_id(machine_id) {
        return Err(refuse("invalid-machine-id", format!("{machine_id:?} is not a machine id")));
    }
    let _lock = lock(state_root)?;
    let dir = directory(state_root);
    let path = dir.join(machine_id);
    let mut pin = match read_file(&path) {
        Ok(pin) => pin,
        Err(_) if !path.exists() => return Err(refuse("pin-missing", format!("machine {machine_id} has no pinned key to confirm"))),
        Err(e) => return Err(e),
    };
    if pin.fingerprint != fingerprint {
        return Err(refuse(
            "fingerprint-mismatch",
            format!("machine {machine_id} is pinned to {} but {fingerprint} was given; nothing was confirmed", pin.fingerprint),
        ));
    }
    if pin.state == PinState::Confirmed {
        return Ok(pin);
    }
    pin.state = PinState::Confirmed;
    pin.confirmed_at = Some(iso_utc_now());
    let mut bytes = serde_json::to_vec(&pin).expect("Pin always serializes");
    bytes.push(b'\n');
    fgos_durable_file::replace_durably_with_mode(&dir, machine_id, &bytes, 0o600)
        .map_err(|e| refuse("pin-write-failed", e.to_string()))?;
    Ok(pin)
}
