//! The Unix half of the supervisor: the attempt lock (and the cwd lease) arrive
//! as inherited descriptions at slots 3 and 4, the GO channel is a socketpair
//! whose far end the gate gets at slot 5, and the gate is nudged with SIGTERM.

use std::collections::BTreeMap;
use std::fs::{File, OpenOptions};
use std::io::{self, Read, Write};
use std::os::fd::{AsRawFd, OwnedFd};
use std::os::unix::fs::OpenOptionsExt;
use std::os::unix::net::UnixStream;
use std::path::{Path, PathBuf};
use std::process::Child;
use std::time::{Duration, Instant};

use fgos_process::containment::{select, ContainmentDomain, ContainmentDriver, SelectEnv, SpawnSpec, StartMode};
#[cfg(target_os = "linux")]
use fgos_process::containment::{BwrapPidns, LinuxPgroup};
use fgos_process::control::{signal_by_identity, take_inherited, Signal};
use fgos_process::{facts, Domain, FdSlot};
use serde_json::Value;

use super::Refusal;
use crate::route::EXIT_INTERNAL;

const ATTEMPT_LOCK_SLOT: u32 = 3;
const CWD_LEASE_SLOT: u32 = 4;
const GO_SLOT: u32 = 5;

/// The lock descriptions this supervisor carries.
pub(super) struct Locks {
    attempt: Option<File>,
    cwd_lease: Option<File>,
}

impl Locks {
    /// The attempt lock, close-on-exec first: nothing this process spawns may inherit it.
    pub(super) fn early() -> Result<Locks, Refusal> {
        let attempt = take_inherited(FdSlot(ATTEMPT_LOCK_SLOT)).map_err(|_| Refusal { exit: EXIT_INTERNAL, code: "fd-invalid", why: "descriptor 3 (the attempt lock) was not handed over".into() })?;
        Ok(Locks { attempt: Some(attempt), cwd_lease: None })
    }

    /// Slot 4 is a lease only for a mutating attempt; anything else there is not ours.
    pub(super) fn complete(&mut self, envelope: &Value, _run_dir: &Path) -> Result<(), Refusal> {
        if envelope["mutation"] == "mutating" {
            self.cwd_lease = take_inherited(FdSlot(CWD_LEASE_SLOT)).ok();
            if self.cwd_lease.is_none() {
                return Err(Refusal { exit: EXIT_INTERNAL, code: "fd-invalid", why: "a mutating attempt needs descriptor 4 (the cwd lease)".into() });
            }
        }
        Ok(())
    }

    /// The gate carries the lease description, so a dead supervisor leaves the lease held until the gate is gone.
    pub(super) fn declare_on_lease(&self, _record: &Domain) -> io::Result<()> {
        Ok(())
    }

    pub(super) fn release_cwd(&mut self) {
        drop(self.cwd_lease.take());
    }
}

impl Drop for Locks {
    fn drop(&mut self) {
        drop(self.attempt.take());
    }
}

/// The supervisor's end of the GO socketpair, and the gate's end until it is spawned.
pub(super) struct GoLink {
    mine: Option<UnixStream>,
    theirs: Option<UnixStream>,
}

impl GoLink {
    pub(super) fn new(_domain: &ContainmentDomain) -> Result<GoLink, String> {
        let (mine, theirs) = UnixStream::pair().map_err(|e| format!("socketpair: {e}"))?;
        Ok(GoLink { mine: Some(mine), theirs: Some(theirs) })
    }

    /// The channel, once the gate is running. A socketpair is connected from the start.
    pub(super) fn open(mut self, _gate: &mut Child, _since: Instant) -> Option<Go> {
        self.mine.take().map(Go)
    }
}

/// The GO channel.
pub(super) struct Go(UnixStream);

impl Go {
    pub(super) fn readable(&self, timeout: Duration) -> bool {
        let mut p = [libc::pollfd { fd: self.0.as_raw_fd(), events: libc::POLLIN, revents: 0 }];
        // SAFETY: poll over one valid pollfd.
        unsafe { libc::poll(p.as_mut_ptr(), 1, timeout.as_millis().min(i32::MAX as u128) as libc::c_int) > 0 }
    }
}

impl Read for Go {
    fn read(&mut self, buf: &mut [u8]) -> io::Result<usize> {
        self.0.read(buf)
    }
}

impl Write for Go {
    fn write(&mut self, buf: &[u8]) -> io::Result<usize> {
        self.0.write(buf)
    }
    fn flush(&mut self) -> io::Result<()> {
        self.0.flush()
    }
}

pub(super) fn create_private(path: &Path) -> io::Result<File> {
    OpenOptions::new().write(true).create(true).truncate(true).mode(0o600).open(path)
}

pub(super) fn driver_for(preferred: &str, bwrap: Option<PathBuf>) -> Result<Box<dyn ContainmentDriver>, String> {
    // The envelope names the driver; Linux builds it directly so a machine
    // with bwrap can still run a `linux-pgroup` envelope.
    #[cfg(target_os = "linux")]
    let driver: Box<dyn ContainmentDriver> = match preferred {
        "linux-pgroup" => Box::new(LinuxPgroup),
        "linux-gate" if bwrap.is_some() => Box::new(BwrapPidns::new(bwrap.clone().unwrap())),
        _ => select(&SelectEnv { bwrap }).map_err(|e| e.to_string())?,
    };
    #[cfg(not(target_os = "linux"))]
    let driver: Box<dyn ContainmentDriver> = select(&SelectEnv { bwrap }).map_err(|e| e.to_string())?;
    let name = match driver.name() {
        "bwrap-pidns" => "linux-gate",
        other => other,
    };
    if name != preferred {
        return Err(format!("the envelope asks for {preferred} but this machine gives {name}"));
    }
    Ok(driver)
}

pub(super) fn gate_spec(envelope: &Value, run_dir: &Path, locks: &Locks, link: &mut GoLink, _domain: &ContainmentDomain) -> Result<SpawnSpec, String> {
    let host_bin = envelope["hostBin"].as_str().ok_or("hostBin missing")?;
    let go_end = link.theirs.take().ok_or("the GO channel was already handed over")?;
    let mut argv = vec![host_bin.to_string(), "internal".into(), "gate".into(), "--protocol".into(), "1".into(), "--envelope".into(), run_dir.join("envelope.json").to_string_lossy().into_owned(), "--go-fd".into(), GO_SLOT.to_string()];
    let lock = locks.attempt.as_ref().ok_or("the attempt lock is gone")?;
    let mut fd_map = vec![(FdSlot(ATTEMPT_LOCK_SLOT), lock.try_clone().map_err(|e| e.to_string())?)];
    let mut lock_fds = ATTEMPT_LOCK_SLOT.to_string();
    if let Some(lease) = &locks.cwd_lease {
        fd_map.push((FdSlot(CWD_LEASE_SLOT), lease.try_clone().map_err(|e| e.to_string())?));
        lock_fds.push_str(&format!(",{CWD_LEASE_SLOT}"));
    }
    fd_map.push((FdSlot(GO_SLOT), File::from(OwnedFd::from(go_end))));
    argv.extend(["--lock-fds".to_string(), lock_fds]);

    // The envelope's prefix ends with the `--` that separates bwrap's own
    // options from its command; the driver appends `--info-fd N --` itself.
    let bwrap_prefix = envelope["containment"]["bwrapPrefix"].as_array().map(|items| {
        let mut prefix: Vec<String> = items.iter().filter_map(Value::as_str).map(String::from).collect();
        if prefix.last().is_some_and(|last| last == "--") {
            prefix.pop();
        }
        prefix
    });
    let log = || OpenOptions::new().create(true).append(true).mode(0o600).custom_flags(libc::O_CLOEXEC).open(run_dir.join("supervisor.log")).map_err(|e| format!("supervisor.log: {e}"));
    Ok(SpawnSpec {
        argv,
        bwrap_prefix,
        fd_map,
        env: BTreeMap::new(),
        cwd: envelope["cwd"].as_str().ok_or("cwd missing")?.into(),
        stdin: None,
        stdout: Some(log()?),
        stderr: Some(log()?),
        mode: StartMode::Direct,
    })
}

/// The record the driver made is the record declared on the lock.
pub(super) fn record_to_declare(domain: &Domain) -> Domain {
    domain.clone()
}

/// SIGTERM to the gate, by identity.
pub(super) fn nudge_gate(gate: &facts::ProcTuple) {
    let _ = signal_by_identity(gate, Signal::Term);
}

