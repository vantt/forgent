//! Event Store owns clone identities; the machine id is the Identity component's.
use crate::errors::invalid;
use crate::{
    envelope::{line, valid_timestamp},
    errors::{Error, ErrorCode},
    layout::Layout,
};
use crate::{errors::io, validation::valid_store_id};
use fgos_identity::machine::valid_machine_id;
use serde::{Deserialize, Serialize};
use std::{
    fs::{self, File},
    path::Path,
};
fn moved(detail: impl Into<String>) -> Error {
    Error::new(ErrorCode::EventStoreStoreMoved, detail)
}
/// The machine id Event Store names refs with: the git-config override when
/// set, else the one the Identity component minted under the state root.
pub fn machine_id(config_value: Option<&str>, state_root: &Path) -> Result<String, Error> {
    let value = match config_value {
        Some(value) => value.to_owned(),
        None => fgos_identity::machine::read(state_root).map_err(|e| match e {
            fgos_identity::Error::Io(e) => io(e),
            e => Error::new(ErrorCode::EventStoreMachineId, e.to_string()),
        })?,
    };
    if !valid_machine_id(&value) {
        return Err(Error::new(
            ErrorCode::EventStoreMachineId,
            "invalid machine id; run setup fix",
        ));
    }
    Ok(value)
}
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct StoreIdentity {
    pub v: u32,
    pub store_id: String,
    pub machine_id: String,
    pub created_at: String,
    pub common_dir: String,
    pub common_dir_dev_ino: String,
}
#[cfg(target_os = "linux")]
fn dev_ino(path: &Path) -> Result<String, Error> {
    use std::os::unix::fs::MetadataExt;
    let meta = fs::metadata(path).map_err(io)?;
    Ok(format!("{}:{}", meta.dev(), meta.ino()))
}
#[cfg(not(target_os = "linux"))]
fn dev_ino(_: &Path) -> Result<String, Error> {
    Err(Error::new(
        ErrorCode::EventStoreUnsupportedPlatform,
        "store identity requires a native file identity driver",
    ))
}
pub(crate) fn random_id() -> Result<String, Error> {
    fgos_identity::text::random_hex128().map_err(|e| {
        if e.kind() == std::io::ErrorKind::Unsupported {
            Error::new(ErrorCode::EventStoreUnsupportedPlatform, e.to_string())
        } else {
            io(e)
        }
    })
}
impl StoreIdentity {
    /// Recovery only: caller must hold event-append and exclude live initializers.
    /// Phase 02 calls this before initialization, never concurrently with publication.
    pub fn sweep_temps_under_append_lock(layout: &Layout) -> Result<(), Error> {
        let entries = match fs::read_dir(&layout.root) {
            Ok(entries) => entries,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(()),
            Err(e) => return Err(io(e)),
        };
        let mut removed = false;
        for entry in entries {
            let entry = entry.map_err(io)?;
            let name = entry.file_name();
            if name.to_str().is_some_and(|n| {
                n.strip_prefix(".durable-file-")
                    .and_then(|n| n.strip_suffix(".tmp"))
                    .is_some_and(|n| {
                        n.split_once('-').is_some_and(|(pid, seq)| {
                            !pid.is_empty()
                                && !seq.is_empty()
                                && pid.bytes().all(|b| b.is_ascii_digit())
                                && seq.bytes().all(|b| b.is_ascii_digit())
                        })
                    })
            }) || name
                .to_str()
                .and_then(|n| n.strip_prefix("store."))
                .and_then(|n| n.strip_suffix(".tmp"))
                .is_some_and(valid_store_id)
            {
                fs::remove_file(entry.path()).map_err(io)?;
                removed = true;
            }
        }
        if removed {
            File::open(&layout.root)
                .and_then(|f| f.sync_all())
                .map_err(io)?;
        }
        Ok(())
    }

    pub fn open(layout: &Layout, machine: &str) -> Result<Self, Error> {
        let bytes = fs::read(layout.store()).map_err(io)?;
        let identity: Self = serde_json::from_slice(&bytes).map_err(|e| invalid(e.to_string()))?;
        if identity.v != 1
            || !valid_store_id(&identity.store_id)
            || !valid_timestamp(&identity.created_at)
        {
            return Err(invalid("malformed store identity"));
        }
        if !valid_machine_id(machine) || identity.machine_id != machine {
            return Err(moved(format!(
                "this store belongs to machine {}, not {machine}: fgos.machineId changed after the store was created; restore it, or use a fresh clone for the new id",
                identity.machine_id
            )));
        }
        // A moved clone keeps the inode of its common directory, so the store keeps its id wherever the clone now
        // lives; the recorded path is where it was created. A copy has a new inode and must never reuse the store id.
        if identity.common_dir_dev_ino != dev_ino(&layout.common_dir)? {
            return Err(moved(format!(
                "{} is a copy of the clone that created this store (created at {}), or was moved to another filesystem; it cannot reuse that store id, use a fresh clone",
                layout.common_dir.display(),
                identity.common_dir
            )));
        }
        Ok(identity)
    }
    /// First append only. Caller MUST hold event-append across this call (phase 02).
    /// This function never re-mints an existing or malformed store.json.
    pub fn initialize_under_append_lock(
        layout: &Layout,
        machine: &str,
        created_at: &str,
    ) -> Result<Self, Error> {
        match fs::symlink_metadata(layout.store()) {
            Ok(_) => return Self::open(layout, machine),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => (),
            Err(e) => return Err(io(e)),
        }
        if !valid_machine_id(machine) || !valid_timestamp(created_at) {
            return Err(invalid("invalid machine id or creation timestamp"));
        }
        let identity = Self {
            v: 1,
            store_id: random_id()?,
            machine_id: machine.into(),
            created_at: created_at.into(),
            common_dir: layout
                .common_dir
                .to_str()
                .ok_or_else(|| invalid("common directory must be UTF-8"))?
                .into(),
            common_dir_dev_ino: dev_ino(&layout.common_dir)?,
        };
        fs::create_dir_all(&layout.root).map_err(io)?;
        // Persist newly created directory entries as well as store.json itself.
        for parent in [layout.root.parent().unwrap(), layout.common_dir.as_path()] {
            File::open(parent).and_then(|f| f.sync_all()).map_err(io)?;
        }
        fgos_durable_file::install_once(&layout.root, "store.json", &line(&identity)?)
            .map_err(|e| io(e.source))?;
        Self::open(layout, machine)
    }
}
