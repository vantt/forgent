//! The Windows half of the supervisor.
//!
//! A `LockFileEx` lock belongs to the process and handle that took it and is
//! never inherited, so the supervisor takes the attempt lock (and the cwd
//! lease) itself, after it read the envelope. The GO channel is a named pipe
//! the supervisor listens on before the gate starts; the gate is told the
//! attempt's job by name and stops by polling `stop-requested.json`, so there
//! is no signal to send. The supervisor is the keeper of the job: it holds the
//! handle `create` returned and is never a member.

use std::collections::BTreeMap;
use std::fs::{File, OpenOptions};
use std::io::{self, Read, Write};
use std::os::windows::io::AsRawHandle;
use std::path::{Path, PathBuf};
use std::process::Child;
use std::sync::mpsc;
use std::time::{Duration, Instant};

use fgos_holder_lock::{acquire, Acquire, Handle, Mode, Resource, Wait, DEFAULT_KILL_WAIT_MS};
use fgos_process::containment::{select, ContainmentDomain, ContainmentDriver, SelectEnv, SpawnSpec, StartMode, WindowsJobDriver};
use fgos_process::{facts, Domain};
use serde_json::Value;
use windows_sys::Win32::System::Pipes::PeekNamedPipe;

use super::{Refusal, HELLO_LIMIT};
use crate::go_pipe::{self, PipeServer};
use crate::route::{EXIT_ENVELOPE_INVALID, EXIT_INTERNAL};

/// How long the supervisor waits for a lock a controller is still releasing.
const LOCK_WAIT_MS: u64 = 10_000;

/// The lock handles this supervisor owns.
pub(super) struct Locks {
    attempt: Option<Handle>,
    cwd_lease: Option<Handle>,
}

impl Locks {
    /// Nothing is inherited on Windows: the locks are taken once the envelope names them.
    pub(super) fn early() -> Result<Locks, Refusal> {
        Ok(Locks { attempt: None, cwd_lease: None })
    }

    pub(super) fn complete(&mut self, envelope: &Value, run_dir: &Path) -> Result<(), Refusal> {
        self.attempt = Some(take("attempt", &run_dir.join("attempt.lock"))?);
        if envelope["mutation"] == "mutating" {
            let Some(lease) = envelope["cwdLeaseFile"].as_str() else {
                return Err(Refusal { exit: EXIT_ENVELOPE_INVALID, code: "envelope-invalid", why: "a mutating attempt needs cwdLeaseFile on Windows".into() });
            };
            self.cwd_lease = Some(take("dispatch-cwd", Path::new(lease))?);
        }
        Ok(())
    }

    pub(super) fn release_cwd(&mut self) {
        drop(self.cwd_lease.take());
    }
}

fn take(name: &str, path: &Path) -> Result<Handle, Refusal> {
    match acquire(&Resource::new(name, path), Mode::Ex, Wait::Ms(LOCK_WAIT_MS), DEFAULT_KILL_WAIT_MS) {
        Acquire::Acquired(handle) => Ok(handle),
        Acquire::Held { reason, .. } => Err(Refusal { exit: EXIT_INTERNAL, code: "lock-held", why: format!("{name}: {}", reason.as_str()) }),
        Acquire::Timeout { waited_ms } => Err(Refusal { exit: EXIT_INTERNAL, code: "lock-held", why: format!("{name}: still held after {waited_ms} ms") }),
        Acquire::Unavailable { reason, detail } => Err(Refusal { exit: EXIT_INTERNAL, code: "lock-unavailable", why: format!("{name}: {}: {detail}", reason.as_str()) }),
    }
}

/// The supervisor's end of the GO pipe: listening before the gate starts.
pub(super) struct GoLink {
    server: Option<PipeServer>,
    path: String,
    job_name: String,
}

impl GoLink {
    pub(super) fn new(domain: &ContainmentDomain) -> Result<GoLink, String> {
        let job_name = WindowsJobDriver::job_name(domain).ok_or("the domain has no job")?.to_string();
        // The job's own name carries the unguessable token; the pipe reuses it.
        let suffix = job_name.rsplit('\\').next().unwrap_or(&job_name);
        let path = format!(r"\\.\pipe\fgos-go-{suffix}");
        let server = go_pipe::listen(&path).map_err(|e| format!("GO pipe {path}: {e}"))?;
        Ok(GoLink { server: Some(server), path, job_name })
    }

    /// Wait for the gate to connect: bounded, and a gate that left first ends the wait.
    pub(super) fn open(mut self, gate: &mut Child, since: Instant) -> Option<Go> {
        let server = self.server.take()?;
        let (tx, rx) = mpsc::channel();
        // A gate that never connects leaves this thread blocked; the supervisor exits soon after.
        std::thread::spawn(move || {
            let _ = tx.send(server.accept());
        });
        loop {
            match rx.recv_timeout(Duration::from_millis(50)) {
                Ok(Ok(file)) => return Some(Go(file)),
                Ok(Err(_)) | Err(mpsc::RecvTimeoutError::Disconnected) => return None,
                Err(mpsc::RecvTimeoutError::Timeout) => {
                    if gate.try_wait().ok().flatten().is_some() || since.elapsed() > HELLO_LIMIT {
                        return None;
                    }
                }
            }
        }
    }
}

/// The GO channel.
pub(super) struct Go(File);

impl Go {
    /// Whether a read would not block: bytes are waiting, or the gate closed its end.
    pub(super) fn readable(&self, timeout: Duration) -> bool {
        let start = Instant::now();
        loop {
            let mut available = 0u32;
            // SAFETY: a peek into the pipe handle this value owns; only the available-byte count is asked for.
            let ok = unsafe { PeekNamedPipe(self.0.as_raw_handle() as _, std::ptr::null_mut(), 0, std::ptr::null_mut(), &mut available, std::ptr::null_mut()) };
            // A broken pipe fails the peek: the read that follows reports it.
            if ok == 0 || available > 0 {
                return true;
            }
            if start.elapsed() >= timeout {
                return false;
            }
            std::thread::sleep(Duration::from_millis(5));
        }
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
    OpenOptions::new().write(true).create(true).truncate(true).open(path)
}

pub(super) fn driver_for(preferred: &str, bwrap: Option<PathBuf>) -> Result<Box<dyn ContainmentDriver>, String> {
    let driver = select(&SelectEnv { bwrap }).map_err(|e| e.to_string())?;
    if driver.name() != preferred {
        return Err(format!("the envelope asks for {preferred} but this machine gives {}", driver.name()));
    }
    Ok(driver)
}

pub(super) fn gate_spec(envelope: &Value, run_dir: &Path, _locks: &Locks, link: &mut GoLink, _domain: &ContainmentDomain) -> Result<SpawnSpec, String> {
    let host_bin = envelope["hostBin"].as_str().ok_or("hostBin missing")?;
    let argv = vec![
        host_bin.to_string(),
        "internal".into(),
        "gate".into(),
        "--protocol".into(),
        "1".into(),
        "--envelope".into(),
        run_dir.join("envelope.json").to_string_lossy().into_owned(),
        "--go-socket".into(),
        link.path.clone(),
        "--job-name".into(),
        link.job_name.clone(),
    ];
    // The gate needs no environment of its own; the agent's comes from the envelope.
    let env: BTreeMap<String, String> = ["SystemRoot"].iter().filter_map(|k| std::env::var(k).ok().map(|v| (k.to_string(), v))).collect();
    let log = || OpenOptions::new().create(true).append(true).open(run_dir.join("supervisor.log")).map_err(|e| format!("supervisor.log: {e}"));
    Ok(SpawnSpec { argv, bwrap_prefix: None, fd_map: vec![], env, cwd: envelope["cwd"].as_str().ok_or("cwd missing")?.into(), stdin: None, stdout: Some(log()?), stderr: Some(log()?), mode: StartMode::Direct })
}

/// The supervisor is the keeper of the job: it holds the handle `create` made and is never a member.
pub(super) fn record_to_declare(domain: &Domain) -> Domain {
    match domain {
        Domain::WindowsJob(job) => Domain::WindowsJob(fgos_process::WindowsJob { keeper: facts::self_identity(), ..job.clone() }),
        other => other.clone(),
    }
}

/// Windows has no signal to send: the gate polls `stop-requested.json`.
pub(super) fn nudge_gate(_gate: &facts::ProcTuple) {}

