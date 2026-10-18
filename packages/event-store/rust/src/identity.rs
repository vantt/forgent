//! Event Store owns machine and clone identities; setup owns machine-id minting.
use crate::{
    envelope::{line, valid_timestamp},
    errors::{Error, ErrorCode},
    layout::Layout,
};
use serde::{Deserialize, Serialize};
use std::{
    fs::{self, File, OpenOptions},
    io::{Read, Write},
    path::Path,
};
fn invalid(detail: impl Into<String>) -> Error {
    Error::new(ErrorCode::EventStoreIntegrity, detail)
}
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
            .map_err(|e| invalid(format!("machine id missing: {e}")))?
            .trim_end_matches(['\r', '\n'])
            .to_owned(),
    };
    if !valid_machine_id(&value) {
        return Err(invalid("invalid machine id; run setup fix"));
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
#[cfg(unix)]
fn dev_ino(path: &Path) -> Result<String, Error> {
    use std::os::unix::fs::MetadataExt;
    let meta = fs::metadata(path).map_err(|e| invalid(e.to_string()))?;
    Ok(format!("{}:{}", meta.dev(), meta.ino()))
}
#[cfg(not(unix))]
fn dev_ino(_: &Path) -> Result<String, Error> {
    Err(Error::new(
        ErrorCode::EventStoreUnsupportedPlatform,
        "store identity requires a native file identity driver",
    ))
}
#[cfg(unix)]
fn random_id() -> Result<String, Error> {
    let mut bytes = [0u8; 16];
    File::open("/dev/urandom")
        .and_then(|mut f| f.read_exact(&mut bytes))
        .map_err(|e| invalid(e.to_string()))?;
    Ok(bytes.iter().map(|b| format!("{b:02x}")).collect())
}
#[cfg(not(unix))]
fn random_id() -> Result<String, Error> {
    Err(Error::new(
        ErrorCode::EventStoreUnsupportedPlatform,
        "native random identity driver unavailable",
    ))
}
impl StoreIdentity {
    pub fn open(layout: &Layout, machine: &str) -> Result<Self, Error> {
        let bytes = fs::read(layout.store()).map_err(|e| invalid(e.to_string()))?;
        let identity: Self = serde_json::from_slice(&bytes).map_err(|e| invalid(e.to_string()))?;
        if identity.v != 1
            || identity.store_id.len() != 32
            || !identity
                .store_id
                .bytes()
                .all(|c| c.is_ascii_digit() || (b'a'..=b'f').contains(&c))
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
            Err(e) => return Err(invalid(e.to_string())),
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
        fs::create_dir_all(&layout.root).map_err(|e| invalid(e.to_string()))?;
        // Persist newly created directory entries as well as store.json itself.
        for parent in [layout.root.parent().unwrap(), layout.common_dir.as_path()] {
            File::open(parent)
                .and_then(|f| f.sync_all())
                .map_err(|e| invalid(e.to_string()))?;
        }
        let tmp = layout.root.join(format!("store.{}.tmp", identity.store_id));
        let write = || -> Result<(), Error> {
            let mut file = OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(&tmp)
                .map_err(|e| invalid(e.to_string()))?;
            file.write_all(&line(&identity)?)
                .and_then(|_| file.sync_all())
                .map_err(|e| invalid(e.to_string()))?;
            fs::rename(&tmp, layout.store()).map_err(|e| invalid(e.to_string()))?;
            File::open(&layout.root)
                .and_then(|f| f.sync_all())
                .map_err(|e| invalid(e.to_string()))?;
            Ok(())
        };
        let result = write();
        if result.is_err() {
            let _ = fs::remove_file(tmp);
        }
        result?;
        Ok(identity)
    }
}
