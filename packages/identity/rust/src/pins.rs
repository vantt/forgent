//! Pinned machine keys: the first key seen for a machine id is remembered in
//! user state, like SSH `known_hosts`, and a different key claimed for that
//! machine is refused afterwards. One file per machine under
//! `<state root>/identity/pins/<machine id>`, created once and atomically, so
//! racing first sightings settle by the create and the loser compares.
//! User level: every project on the machine shares the pins; none is ever
//! written into a repository.

use crate::machine::valid_machine_id;
use crate::refusal::Refusal;
use serde::{Deserialize, Serialize};
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

const VERSION: u32 = 1;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Pin {
    pub v: u32,
    pub machine_id: String,
    pub public_key: String,
    pub fingerprint: String,
    pub first_seen: String,
}

impl Pin {
    pub fn new(machine_id: &str, public_key: &str, fingerprint: &str, first_seen: &str) -> Self {
        Self {
            v: VERSION,
            machine_id: machine_id.to_owned(),
            public_key: public_key.to_owned(),
            fingerprint: fingerprint.to_owned(),
            first_seen: first_seen.to_owned(),
        }
    }
}

/// What [`record`] found.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Recorded {
    /// The machine was unknown; this key is now its pin.
    Created,
    /// The machine was pinned to this same key.
    Same,
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
            Ok(if existing.public_key == pin.public_key { Recorded::Same } else { Recorded::Different(existing) })
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
    let path = directory(state_root).join(machine_id);
    let pin = read_file(&path).map_err(|e| {
        if path.exists() { e } else { refuse("pin-not-found", format!("machine {machine_id} has no pinned key")) }
    })?;
    fs::remove_file(&path).map_err(|e| refuse("pin-write-failed", format!("{}: {e}", path.display())))?;
    Ok(pin)
}
