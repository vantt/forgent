//! Two-process semantics probe: on the filesystem of one lock directory, a
//! lock held by another process is seen as held, and it is gone the moment
//! that process dies. `fgctl` runs it before it publishes an activation and
//! `fgos doctor` runs it for `lock-kernel-semantics`; the guarantee a driver
//! claims for a mount is only trusted once this probe agrees on that mount.

use std::fs;
use std::path::Path;
use std::time::{Duration, Instant};

use crate::driver;
use crate::port::{self, HelperExe, Probe, Resource};

/// How long the probe waits for a dead holder's lock to be seen as free.
/// The kernel drops it when the holder exits; the wait only covers a fork on
/// another thread of the caller that copied the description before its exec.
const FREE_WAIT: Duration = Duration::from_millis(500);

/// A probe file this old belongs to a probe whose process died before it
/// could remove it (its holder child sleeps 60 s at most).
const STALE_PROBE: Duration = Duration::from_secs(120);

/// How long the probe waits for the holder process to report that it holds
/// the lock (Windows: the helper role of `helper`).
#[cfg(windows)]
const READY_WAIT: Duration = Duration::from_secs(2);

/// Run the probe in `dir` (created when missing). `Ok` carries the wall time
/// in ms; `Err` says which half failed. `helper` is the executable that
/// plays the holder role where the holder must be a process that took the
/// lock itself (Windows); POSIX hands a locked description to `sleep`.
pub fn two_process_probe(dir: &Path, helper: &HelperExe) -> Result<f64, String> {
    let started = Instant::now();
    let drv = driver::current();
    if !drv.supported() {
        return Err(drv.unsupported_detail().to_string());
    }
    fs::create_dir_all(dir).map_err(|e| format!("create {}: {e}", dir.display()))?;
    sweep_stale_probes(dir);
    let path = dir.join(format!(".semantics-probe-{}.lock", std::process::id()));
    let result = probe_at(&path, helper);
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

#[cfg(unix)]
fn probe_at(path: &Path, _helper: &HelperExe) -> Result<(), String> {
    use std::fs::OpenOptions;
    use std::process::{Command, Stdio};

    use fgos_process::FdSlot;

    use crate::driver::TryLock;
    use crate::port::Mode;

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
    finish(&resource, while_alive)
}

/// Windows: a lock belongs to the process that took it and cannot be handed
/// on, so the holder is a helper process that locks the file itself, reports
/// `R`, and holds until it is killed.
#[cfg(windows)]
fn probe_at(path: &Path, helper: &HelperExe) -> Result<(), String> {
    use std::io::Read;
    use std::process::{Command, Stdio};

    let resource = Resource::new("semantics-probe", path);
    let mut argv = helper.argv().into_iter();
    let program = argv.next().expect("helper argv starts with the executable");
    let mut child = Command::new(program)
        .args(argv)
        .args(["probe-holder", "--path"])
        .arg(path)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| format!("holder helper {} could not be started: {e}", helper.0.display()))?;
    let mut stdout = child.stdout.take().expect("piped stdout");
    let (tx, rx) = std::sync::mpsc::channel();
    std::thread::spawn(move || {
        let mut byte = [0u8; 1];
        let _ = tx.send(stdout.read(&mut byte).map(|n| (n, byte[0])));
    });
    let ready = rx.recv_timeout(READY_WAIT);
    let while_alive = match ready {
        Ok(Ok((1, b'R'))) => port::probe(&resource),
        other => {
            let _ = child.kill();
            let _ = child.wait();
            return Err(format!("the holder helper did not report that it holds the lock within {} ms: {other:?}", READY_WAIT.as_millis()));
        }
    };
    let _ = child.kill();
    let _ = child.wait();
    finish(&resource, while_alive)
}

/// Judge the two halves: the holder was seen as holding while alive, and the
/// lock is free within [`FREE_WAIT`] of its death.
fn finish(resource: &Resource, while_alive: std::io::Result<Probe>) -> Result<(), String> {
    match while_alive {
        Ok(Probe::Held) => {}
        Ok(Probe::Free) => return Err("a lock held by a live child was seen as free".to_string()),
        Err(e) => return Err(format!("probe while the child holds the lock: {e}")),
    }
    let deadline = Instant::now() + FREE_WAIT;
    loop {
        match port::probe(resource) {
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
            two_process_probe(&dir.join("locks"), &HelperExe::current().unwrap()).expect("probe passes on a local tmp mount");
        assert!(elapsed < 1000.0, "probe took {elapsed} ms");
        assert_eq!(
            fs::read_dir(dir.join("locks")).unwrap().count(),
            0,
            "the probe file is removed"
        );
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn a_probe_file_another_process_holds_is_refused() {
        let dir = std::env::temp_dir().join(format!("fgos-semantics-held-test-{}", std::process::id()));
        fs::create_dir_all(&dir).unwrap();
        let held = fs::OpenOptions::new().read(true).write(true).create(true).truncate(false).open(dir.join(format!(".semantics-probe-{}.lock", std::process::id()))).unwrap();
        assert_eq!(driver::current().try_lock(&held, crate::port::Mode::Ex).unwrap(), driver::TryLock::Locked);
        let refused = two_process_probe(&dir, &HelperExe::current().unwrap()).unwrap_err();
        assert!(refused.contains("already locked"), "{refused}");
        drop(held);
        let _ = fs::remove_dir_all(&dir);
    }
}
