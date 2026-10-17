//! Allocation store under `<stateRoot>/terminal/<driver>/<incarnationId>/`.
//! Records and markers are published once (temp file, fsync, `link(2)`);
//! only the group hint is rewritten.

use crate::port::ServerIncarnation;
use crate::record::{AllocationRecord, GroupHint, MarkerKind};
use serde::{de::DeserializeOwned, Serialize};
use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};

static TEMP_COUNTER: AtomicU64 = AtomicU64::new(0);

/// The state root every fgOS component resolves the same way.
pub fn default_state_root() -> PathBuf {
    fgos_holder_lock::state_root().0
}

/// Keys name files, so they follow `terminal-control.port.v1.json`'s pattern
/// and may not end in a marker suffix (that would collide with a marker file).
pub fn valid_key(key: &str) -> bool {
    let bytes = key.as_bytes();
    let first_ok = bytes.first().is_some_and(|b| b.is_ascii_alphanumeric());
    first_ok
        && bytes.len() <= 128
        && bytes.iter().all(|b| b.is_ascii_alphanumeric() || matches!(b, b'.' | b'_' | b'-'))
        && !MarkerKind::ALL.iter().any(|m| key.ends_with(&format!(".{}", m.suffix())))
}

/// The directory of one driver under the state root, holding one directory
/// per server incarnation.
pub fn driver_dir(state_root: &Path, driver: &str) -> PathBuf {
    state_root.join("terminal").join(driver)
}

/// Incarnation directories of `driver` that exist now.
pub fn incarnation_ids(state_root: &Path, driver: &str) -> Vec<String> {
    let Ok(entries) = fs::read_dir(driver_dir(state_root, driver)) else {
        return Vec::new();
    };
    let mut ids: Vec<String> = entries
        .flatten()
        .filter(|e| e.path().is_dir())
        .filter_map(|e| e.file_name().into_string().ok())
        .collect();
    ids.sort();
    ids
}

#[derive(Debug, Clone)]
pub struct Store {
    dir: PathBuf,
}

impl Store {
    /// Open (creating, mode 0700) the store of one server incarnation.
    pub fn open(state_root: &Path, driver: &str, incarnation: &ServerIncarnation) -> io::Result<Store> {
        Store::open_id(state_root, driver, &incarnation.id())
    }

    pub fn open_id(state_root: &Path, driver: &str, incarnation_id: &str) -> io::Result<Store> {
        let dir = driver_dir(state_root, driver).join(incarnation_id);
        create_private_dir(&dir.join("allocations"))?;
        create_private_dir(&dir.join("groups"))?;
        Ok(Store { dir })
    }

    /// Open an existing incarnation directory without creating anything.
    pub fn existing(state_root: &Path, driver: &str, incarnation_id: &str) -> Option<Store> {
        let dir = driver_dir(state_root, driver).join(incarnation_id);
        dir.join("allocations").is_dir().then_some(Store { dir })
    }

    fn allocations(&self) -> PathBuf {
        self.dir.join("allocations")
    }

    /// Publish the record of its key once. `Ok(false)`: it already existed.
    pub fn publish_record(&self, record: &AllocationRecord) -> io::Result<bool> {
        publish_once(&self.allocations(), &format!("{}.json", record.key), record)
    }

    pub fn read_record(&self, key: &str) -> io::Result<Option<AllocationRecord>> {
        read_json(&self.allocations().join(format!("{key}.json")))
    }

    /// Keys with a record, sorted. Marker files are not keys.
    pub fn record_keys(&self) -> io::Result<Vec<String>> {
        let mut keys = Vec::new();
        for entry in fs::read_dir(self.allocations())? {
            let name = entry?.file_name().to_string_lossy().into_owned();
            let Some(stem) = name.strip_suffix(".json") else { continue };
            if name.starts_with('.') || MarkerKind::ALL.iter().any(|m| stem.ends_with(&format!(".{}", m.suffix()))) {
                continue;
            }
            keys.push(stem.to_string());
        }
        keys.sort();
        Ok(keys)
    }

    /// Publish a marker once. `Ok(false)`: that marker already exists.
    pub fn publish_marker<T: Serialize>(&self, key: &str, kind: MarkerKind, marker: &T) -> io::Result<bool> {
        publish_once(&self.allocations(), &format!("{key}.{}.json", kind.suffix()), marker)
    }

    pub fn read_marker<T: DeserializeOwned>(&self, key: &str, kind: MarkerKind) -> io::Result<Option<T>> {
        read_json(&self.allocations().join(format!("{key}.{}.json", kind.suffix())))
    }

    pub fn has_marker(&self, key: &str, kind: MarkerKind) -> bool {
        self.allocations().join(format!("{key}.{}.json", kind.suffix())).exists()
    }

    /// Rewrite the hint of a group (temp file, rename over).
    pub fn write_hint(&self, hint: &GroupHint) -> io::Result<()> {
        let dir = self.dir.join("groups");
        let tmp = temp_file(&dir, &hint.group_key, &serde_json::to_vec(hint)?)?;
        fs::rename(tmp, dir.join(format!("{}.json", hint.group_key)))
    }

    pub fn read_hint(&self, group_key: &str) -> io::Result<Option<GroupHint>> {
        read_json(&self.dir.join("groups").join(format!("{group_key}.json")))
    }
}

fn create_private_dir(dir: &Path) -> io::Result<()> {
    let mut builder = fs::DirBuilder::new();
    builder.recursive(true);
    #[cfg(unix)]
    std::os::unix::fs::DirBuilderExt::mode(&mut builder, 0o700);
    builder.create(dir)
}

fn read_json<T: DeserializeOwned>(path: &Path) -> io::Result<Option<T>> {
    match fs::read(path) {
        Ok(bytes) => serde_json::from_slice(&bytes).map(Some).map_err(io::Error::from),
        Err(e) if e.kind() == io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(e),
    }
}

/// Write `bytes` to a fresh temp file in `dir`, synced, and return its path.
fn temp_file(dir: &Path, stem: &str, bytes: &[u8]) -> io::Result<PathBuf> {
    let n = TEMP_COUNTER.fetch_add(1, Ordering::Relaxed);
    let tmp = dir.join(format!(".{stem}.{}.{n}.tmp", std::process::id()));
    let mut file = fs::OpenOptions::new().write(true).create_new(true).open(&tmp)?;
    file.write_all(bytes)?;
    file.sync_all()?;
    Ok(tmp)
}

fn publish_once<T: Serialize>(dir: &Path, name: &str, value: &T) -> io::Result<bool> {
    let tmp = temp_file(dir, name, &serde_json::to_vec(value)?)?;
    let linked = fs::hard_link(&tmp, dir.join(name));
    let _ = fs::remove_file(&tmp);
    match linked {
        Ok(()) => Ok(true),
        Err(e) if e.kind() == io::ErrorKind::AlreadyExists => Ok(false),
        Err(e) => Err(e),
    }
}
