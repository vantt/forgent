//! The predecessor-domain rule (`packages/holder-lock/contracts/predecessor.v1.json`).
//!
//! A holder that creates a process domain while it holds a lock records it
//! first in `<lockFile>.predecessor.json`. A holder releases only once its
//! own domain is empty, so a later holder that finds the recorded domain
//! still populated knows the previous holder died abnormally: it ends the
//! domain at once (never waits for it to drain), waits at most the kill
//! wait for it to be gone, and only then proceeds.

use std::ffi::OsString;
use std::io;
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};

use fgos_process::facts::ProcTuple;
use fgos_process::{domain_watch, Domain, DomainState, KillOutcome, ProcId, WatchTrace, WindowsJob};
use serde_json::{json, Value};

/// `<lockFile>.predecessor.json`.
pub fn record_path(lock_path: &Path) -> PathBuf {
    let mut name: OsString = lock_path.file_name().map(OsString::from).unwrap_or_default();
    name.push(".predecessor.json");
    lock_path.with_file_name(name)
}

/// What the next holder may do.
#[derive(Debug, Clone, PartialEq)]
pub enum Admit {
    /// No record, or the recorded domain is empty.
    Proceed,
    /// The domain could not be emptied (or the record cannot be understood);
    /// `domain` is `{domainKind, domainId}` or the raw record.
    NotEmpty {
        /// The record's domain, as the held result names it.
        domain: Value,
    },
}

/// The record's JSON for `domain`.
pub fn domain_json(domain: &Domain) -> Value {
    fn tuple(t: &ProcTuple, with_ns: bool) -> Value {
        let mut v = json!({
            "host": t.host,
            "bootId": t.boot_id,
            "pid": t.pid.0,
            "startTime": t.start_time,
        });
        if with_ns {
            v["pidNs"] = json!(t.pid_ns);
        }
        v
    }
    match domain {
        Domain::LinuxGate(t) => json!({ "domainKind": "linux-gate", "domainId": tuple(t, true) }),
        Domain::WindowsJob(job) => json!({
            "domainKind": "windows-job",
            "domainId": {
                "job": job.job,
                "sessionId": job.session_id.to_string(),
                "declaredAt": job.declared_at.to_string(),
                "holder": windows_tuple(&job.holder),
                "keeper": job.keeper.as_ref().map(windows_tuple),
            },
        }),
        Domain::MacosTree(t) => json!({ "domainKind": "macos-tree", "domainId": tuple(t, false) }),
    }
}

/// `{host, pid, startTime}`: a Windows tuple has no boot id and no namespace.
fn windows_tuple(t: &ProcTuple) -> Value {
    json!({ "host": t.host, "pid": t.pid.0, "startTime": t.start_time })
}

fn tuple_from(id: &Value, with_ns: bool) -> Option<ProcTuple> {
    let pid = id.get("pid")?.as_u64().filter(|p| *p > 0 && *p <= u64::from(u32::MAX))?;
    Some(ProcTuple {
        host: id.get("host")?.as_str()?.to_string(),
        boot_id: id.get("bootId").and_then(Value::as_str).map(str::to_string),
        pid_ns: if with_ns { id.get("pidNs")?.as_str()?.to_string() } else { "none".to_string() },
        pid: ProcId(pid as u32),
        start_time: id.get("startTime")?.as_str()?.to_string(),
    })
}

/// A decimal string as the contract writes `sessionId` and `declaredAt`.
fn decimal<T: std::str::FromStr>(id: &Value, key: &str) -> Option<T> {
    id.get(key)?.as_str()?.parse().ok()
}

fn windows_job_from(id: &Value) -> Option<WindowsJob> {
    let keeper = match id.get("keeper")? {
        Value::Null => None,
        tuple => Some(tuple_from(tuple, false)?),
    };
    Some(WindowsJob {
        job: id.get("job")?.as_str()?.to_string(),
        session_id: decimal(id, "sessionId")?,
        declared_at: decimal(id, "declaredAt")?,
        holder: tuple_from(id.get("holder")?, false)?,
        keeper,
    })
}

/// Parse a record. `None`: unknown version, kind or shape.
pub fn parse_record(record: &Value) -> Option<Domain> {
    if record.get("v")?.as_u64()? != 1 {
        return None;
    }
    let id = record.get("domainId")?;
    match record.get("domainKind")?.as_str()? {
        "linux-gate" => tuple_from(id, true).map(Domain::LinuxGate),
        "windows-job" => windows_job_from(id).map(Domain::WindowsJob),
        "macos-tree" => tuple_from(id, false).map(Domain::MacosTree),
        _ => None,
    }
}

/// Write the record for `domain` at `path`: temp file next to it, then
/// rename over it. Called while the lock is held.
pub fn declare(path: &Path, domain: &Domain) -> io::Result<()> {
    let mut record = domain_json(domain);
    record["v"] = json!(1);
    let nanos = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_nanos()).unwrap_or(0);
    let mut tmp_name: OsString = path.file_name().map(OsString::from).unwrap_or_default();
    tmp_name.push(format!(".tmp-{}-{nanos}", std::process::id()));
    let tmp = path.with_file_name(tmp_name);
    std::fs::write(&tmp, format!("{record}\n"))?;
    std::fs::rename(&tmp, path).inspect_err(|_| {
        let _ = std::fs::remove_file(&tmp);
    })
}

/// Remove the record at `path`. Only ever called by a holder under the lock;
/// a failure leaves the record to be judged again next time, which is safe.
pub(crate) fn remove_record(path: &Path) {
    let _ = std::fs::remove_file(path);
}

/// Run the rule for the record at `path`, after the kernel lock is held.
pub fn admit(path: &Path, kill_wait: Duration) -> Admit {
    admit_with_trace(path, kill_wait).0
}

/// [`admit`], plus what the domain watch saw while it judged (the sources
/// that named each pid, whether the job opened). The same code path as
/// `admit`; the trace is the one the watch already keeps. Used by the
/// predecessor stress test to attribute a violation.
#[doc(hidden)]
pub fn admit_with_trace(path: &Path, kill_wait: Duration) -> (Admit, WatchTrace) {
    let mut trace = WatchTrace::default();
    let answer = admit_traced(path, kill_wait, &mut trace);
    (answer, trace)
}

fn admit_traced(path: &Path, kill_wait: Duration, trace: &mut WatchTrace) -> Admit {
    let text = match std::fs::read_to_string(path) {
        Ok(text) => text,
        Err(err) if err.kind() == io::ErrorKind::NotFound => return Admit::Proceed,
        Err(err) => return Admit::NotEmpty { domain: json!({ "unreadable": err.to_string() }) },
    };
    let raw: Value = match serde_json::from_str(&text) {
        Ok(value) => value,
        Err(_) => return Admit::NotEmpty { domain: json!({ "raw": text }) },
    };
    let Some(domain) = parse_record(&raw) else {
        // An unknown version or kind is never deleted or ignored.
        return Admit::NotEmpty { domain: raw };
    };
    let named = domain_json(&domain);
    // One watch for the whole wait: a Windows watch keeps the handle of every
    // member it has seen.
    let mut watch = domain_watch(&domain);
    let answer = judge(path, &mut watch, named, kill_wait);
    *trace = watch.trace();
    answer
}

fn judge(path: &Path, watch: &mut fgos_process::DomainWatch, named: Value, kill_wait: Duration) -> Admit {
    if watch.is_empty() == DomainState::Empty {
        remove_record(path);
        return Admit::Proceed;
    }
    if watch.kill_all() == KillOutcome::Refused {
        return Admit::NotEmpty { domain: named };
    }
    let deadline = Instant::now() + kill_wait;
    loop {
        if watch.is_empty() == DomainState::Empty {
            remove_record(path);
            return Admit::Proceed;
        }
        if Instant::now() >= deadline {
            return Admit::NotEmpty { domain: named };
        }
        std::thread::sleep(Duration::from_micros(500));
    }
}
