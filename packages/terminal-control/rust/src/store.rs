//! Allocation store under `<stateRoot>/terminal/<driver>/<incarnationId>/`.
//! Records and markers are published once (temp file, fsync, `link(2)`) and
//! never rewritten.

use crate::port::ServerIncarnation;
use crate::record::{AllocationRecord, MarkerKind};
use serde::{de::DeserializeOwned, Serialize};
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

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

fn publish_once<T: Serialize>(dir: &Path, name: &str, value: &T) -> io::Result<bool> {
    install_result(fgos_durable_file::install_once_with_mode(dir, name, &serde_json::to_vec(value)?, 0o666))
}

/// The file was installed under its final name but the parent directory sync failed, so the
/// install is visible and not proven durable. It travels inside an `io::Error`; the caller
/// downcasts it ([`InstallUnproven::of`]) to name the cause and keep the installed fact.
#[derive(Debug)]
pub struct InstallUnproven {
    pub installed: fgos_durable_file::Installed,
    pub source: io::Error,
}

impl InstallUnproven {
    pub fn of(error: &io::Error) -> Option<&InstallUnproven> {
        error.get_ref().and_then(|inner| inner.downcast_ref::<InstallUnproven>())
    }
}

impl std::fmt::Display for InstallUnproven {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "installed ({:?}) but the parent directory sync failed: {}", self.installed, self.source)
    }
}

impl std::error::Error for InstallUnproven {}

fn install_result(result: Result<fgos_durable_file::Installed, fgos_durable_file::InstallError>) -> io::Result<bool> {
    let installed = match result {
        Ok(installed) => installed,
        Err(error) => match error.installed {
            // Cleanup errors after the name exists do not change what was installed.
            Some(installed) if error.step != "parent-fsync" => {
                if let Some(temp) = error.temporary {
                    let _ = fs::remove_file(temp);
                }
                installed
            }
            Some(installed) => return Err(io::Error::other(InstallUnproven { installed, source: error.source })),
            None => return Err(error.source),
        },
    };
    Ok(installed == fgos_durable_file::Installed::Created)
}

#[cfg(test)]
mod install_mapping_tests {
    use super::*;
    struct FailAt(&'static str);
    impl fgos_durable_file::FileSystem for FailAt {
        fn checkpoint(&self, step: &'static str) -> io::Result<()> {
            if step == self.0 {
                Err(io::Error::other("boundary failure"))
            } else {
                Ok(())
            }
        }
    }
    #[test]
    fn errors_before_install_propagate_and_errors_after_install_keep_the_outcome_unless_the_parent_sync_failed() {
        let dir = std::env::temp_dir().join(format!(
            "fgos-terminal-control-mapping-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::create_dir_all(&dir).unwrap();
        for step in [
            "temp-created",
            "bytes-written",
            "file-fsync",
            "name-installed",
            "temp-removed",
        ] {
            let name = step;
            let result = install_result(fgos_durable_file::install_with(
                &dir,
                name,
                b"original",
                &FailAt(step),
            ));
            if matches!(step, "temp-created" | "bytes-written" | "file-fsync") {
                assert_eq!(result.unwrap_err().kind(), io::ErrorKind::Other);
                assert!(!dir.join(name).exists());
            } else {
                assert!(result.unwrap());
                assert_eq!(std::fs::read(dir.join(name)).unwrap(), b"original");
                assert!(!install_result(fgos_durable_file::install_with(
                    &dir,
                    name,
                    b"changed",
                    &FailAt(step)
                ))
                .unwrap());
            }
        }
        // A marker whose parent directory sync failed is visible but not proven durable: the caller
        // must not be told plain success, and the installed file stays as the evidence.
        let result = install_result(fgos_durable_file::install_with(
            &dir,
            "parent-fsync",
            b"original",
            &FailAt("parent-fsync"),
        ));
        let error = result.expect_err("a marker whose durability is unproven was reported as success");
        let unproven = InstallUnproven::of(&error).expect("the error names the unproven install");
        assert_eq!(unproven.installed, fgos_durable_file::Installed::Created);
        assert_eq!(std::fs::read(dir.join("parent-fsync")).unwrap(), b"original");
        std::fs::remove_dir_all(dir).unwrap();
    }
}
