//! Two-process semantics probe: on the filesystem of one lock directory, a
//! lock held by another process is seen as held, and it is gone the moment
//! that process dies. `fgctl` runs it before it publishes an activation and
//! `fgos doctor` runs it for `lock-kernel-semantics`; the guarantee a driver
//! claims for a mount is only trusted once this probe agrees on that mount.

use std::fs::{self, OpenOptions};
use std::path::Path;
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

use fgos_process::FdSlot;

use crate::driver::{self, TryLock};
use crate::port::{self, Mode, Probe, Resource};

/// How long the probe waits for a dead holder's lock to be seen as free.
/// The kernel drops it when the holder exits; the wait only covers a fork on
/// another thread of the caller that copied the description before its exec.
const FREE_WAIT: Duration = Duration::from_millis(500);

/// A probe file this old belongs to a probe whose process died before it
/// could remove it (its holder child sleeps 60 s at most).
const STALE_PROBE: Duration = Duration::from_secs(120);

/// Run the probe in `dir` (created when missing). `Ok` carries the wall time
/// in ms; `Err` says which half failed.
pub fn two_process_probe(dir: &Path) -> Result<f64, String> {
    let started = Instant::now();
    let drv = driver::current();
    if !drv.supported() {
        return Err(drv.unsupported_detail().to_string());
    }
    fs::create_dir_all(dir).map_err(|e| format!("create {}: {e}", dir.display()))?;
    sweep_stale_probes(dir);
    let path = dir.join(format!(".semantics-probe-{}.lock", std::process::id()));
    let result = probe_at(&path);
    let _ = fs::remove_file(&path);
    result.map(|()| (started.elapsed().as_secs_f64() * 1000.0 * 100.0).round() / 100.0)
}

fn sweep_stale_probes(dir: &Path) {
    let Ok(entries) = fs::read_dir(dir) else { return };
    for entry in entries.flatten() {
        let name = entry.file_name();
        let name = name.to_string_lossy();
        if !(name.starts_with(".semantics-probe-") && name.ends_with(".lock")) {
            continue;
        }
        let age = entry.metadata().and_then(|m| m.modified()).ok().and_then(|t| t.elapsed().ok());
        if age.is_some_and(|age| age > STALE_PROBE) {
            let _ = fs::remove_file(entry.path());
        }
    }
}

fn probe_at(path: &Path) -> Result<(), String> {
    let resource = Resource::new("semantics-probe", path);
    let file = OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .truncate(false)
        .open(path)
        .map_err(|e| format!("open {}: {e}", path.display()))?;
    match driver::current()
        .try_lock(&file, Mode::Ex)
        .map_err(|e| format!("lock {}: {e}", path.display()))?
    {
        TryLock::Locked => {}
        TryLock::WouldBlock => {
            return Err(format!(
                "a fresh probe file {} was already locked",
                path.display()
            ))
        }
    }
    // The child gets the locked description and the parent closes its own
    // copy, so from here the child is the only holder.
    let mut cmd = Command::new("sleep");
    cmd.arg("60")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());
    let mut child = fgos_process::control::spawn_with_fds(cmd, &[(FdSlot(3), &file)])
        .map_err(|e| format!("holder child program `sleep` could not be started: {e}"))?;
    drop(file);
    let while_alive = port::probe(&resource);
    let _ = child.kill();
    let _ = child.wait();
    match while_alive {
        Ok(Probe::Held) => {}
        Ok(Probe::Free) => return Err("a lock held by a live child was seen as free".to_string()),
        Err(e) => return Err(format!("probe while the child holds the lock: {e}")),
    }
    let deadline = Instant::now() + FREE_WAIT;
    loop {
        match port::probe(&resource) {
            Ok(Probe::Free) => return Ok(()),
            Ok(Probe::Held) if Instant::now() < deadline => {
                std::thread::sleep(Duration::from_millis(5))
            }
            Ok(Probe::Held) => {
                return Err(format!(
                    "the lock was still held {} ms after its holder child died",
                    FREE_WAIT.as_millis()
                ))
            }
            Err(e) => return Err(format!("probe after the child died: {e}")),
        }
    }
}

#[cfg(all(test, unix))]
mod tests {
    use super::*;

    #[test]
    fn a_live_child_holds_the_lock_and_its_death_frees_it() {
        let dir =
            std::env::temp_dir().join(format!("fgos-semantics-probe-test-{}", std::process::id()));
        let elapsed =
            two_process_probe(&dir.join("locks")).expect("probe passes on a local tmp mount");
        assert!(elapsed < 1000.0, "probe took {elapsed} ms");
        assert_eq!(
            fs::read_dir(dir.join("locks")).unwrap().count(),
            0,
            "the probe file is removed"
        );
        let _ = fs::remove_dir_all(&dir);
    }
}
