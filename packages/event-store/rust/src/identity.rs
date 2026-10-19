//! Event Store owns machine and clone identities; setup owns machine-id minting.
use crate::errors::invalid;
use crate::{
    envelope::{line, valid_timestamp},
    errors::{Error, ErrorCode},
    layout::Layout,
};
use crate::{errors::io, validation::valid_store_id};
use serde::{Deserialize, Serialize};
use std::{
    fs::{self, File},
    io::Read,
    path::Path,
};
fn moved(detail: impl Into<String>) -> Error {
    Error::new(ErrorCode::EventStoreStoreMoved, detail)
}
pub fn valid_machine_id(value: &str) -> bool {
    (2..=63).contains(&value.len())
        && value.as_bytes()[0].is_ascii_alphanumeric()
        && value
            .bytes()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == b'-')
}
pub fn machine_id(config_value: Option<&str>, state_root: &Path) -> Result<String, Error> {
    let value = match config_value {
        Some(value) => value.to_owned(),
        None => fs::read_to_string(state_root.join("machine-id"))
            .map_err(|e| {
                if e.kind() == std::io::ErrorKind::NotFound {
                    Error::new(
                        ErrorCode::EventStoreMachineId,
                        format!("machine id missing: {e}"),
                    )
                } else {
                    io(e)
                }
            })?
            .trim_end_matches(['\r', '\n'])
            .to_owned(),
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
#[cfg(target_os = "linux")]
pub(crate) fn random_id() -> Result<String, Error> {
    let mut bytes = [0u8; 16];
    File::open("/dev/urandom")
        .and_then(|mut f| f.read_exact(&mut bytes))
        .map_err(io)?;
    Ok(bytes.iter().map(|b| format!("{b:02x}")).collect())
}
#[cfg(not(target_os = "linux"))]
pub(crate) fn random_id() -> Result<String, Error> {
    Err(Error::new(
        ErrorCode::EventStoreUnsupportedPlatform,
        "native random identity driver unavailable",
    ))
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
            }
        }
        File::open(&layout.root)
            .and_then(|f| f.sync_all())
            .map_err(io)
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
        if !valid_machine_id(machine)
            || identity.machine_id != machine
            || Path::new(&identity.common_dir) != layout.common_dir
            || identity.common_dir_dev_ino != dev_ino(&layout.common_dir)?
        {
            return Err(moved("machine or Git common-directory identity changed; explicit move confirmation required"));
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

/// Setup-only atomic mint. Readers can never observe a partially written id.
pub fn mint_machine_id(state_root: &Path, hostname: &str) -> Result<(bool, String), Error> {
    let mut slug = crate::layout::branch_key(hostname)?;
    slug.truncate(56);
    let slug = slug.trim_end_matches('-');
    let random = random_id()?;
    let mut suffix = String::new();
    for offset in (0..12).step_by(2) {
        let byte = u8::from_str_radix(&random[offset..offset + 2], 16)
            .map_err(|e| invalid(e.to_string()))?;
        suffix.push(b"abcdefghijklmnopqrstuvwxyz234567"[(byte & 31) as usize] as char);
    }
    let value = format!("{slug}-{suffix}\n");
    let result = fgos_durable_file::install_once_with_mode(
        state_root,
        "machine-id",
        value.as_bytes(),
        0o600,
    )
    .map_err(Error::from_install_error)?;
    let meta = fs::symlink_metadata(state_root.join("machine-id")).map_err(io)?;
    if !meta.is_file() || meta.file_type().is_symlink() {
        return Err(invalid("existing identity is invalid"));
    }
    let id = machine_id(None, state_root)
        .map_err(|e| invalid(format!("existing identity is invalid: {e}")))?;
    Ok((result == fgos_durable_file::Installed::Created, id))
}
