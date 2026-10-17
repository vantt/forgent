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
use fgos_process::{domain_is_empty, domain_kill_all, Domain, DomainState, KillOutcome, ProcId};
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
        Domain::WindowsJob(name) => json!({ "domainKind": "windows-job", "domainId": name }),
        Domain::MacosTree(t) => json!({ "domainKind": "macos-tree", "domainId": tuple(t, false) }),
    }
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

/// Parse a record. `None`: unknown version, kind or shape.
pub fn parse_record(record: &Value) -> Option<Domain> {
    if record.get("v")?.as_u64()? != 1 {
        return None;
    }
    let id = record.get("domainId")?;
    match record.get("domainKind")?.as_str()? {
        "linux-gate" => tuple_from(id, true).map(Domain::LinuxGate),
        "windows-job" => id.as_str().map(|name| Domain::WindowsJob(name.to_string())),
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

fn remove_record(path: &Path) {
    // The record is only ever removed by a holder (under the lock); a
    // failure leaves it to be judged again next time, which is safe.
    let _ = std::fs::remove_file(path);
}

/// Run the rule for the record at `path`, after the kernel lock is held.
pub fn admit(path: &Path, kill_wait: Duration) -> Admit {
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
    if domain_is_empty(&domain) == DomainState::Empty {
        remove_record(path);
        return Admit::Proceed;
    }
    if domain_kill_all(&domain) == KillOutcome::Refused {
        return Admit::NotEmpty { domain: named };
    }
    let deadline = Instant::now() + kill_wait;
    loop {
        if domain_is_empty(&domain) == DomainState::Empty {
            remove_record(path);
            return Admit::Proceed;
        }
        if Instant::now() >= deadline {
            return Admit::NotEmpty { domain: named };
        }
        std::thread::sleep(Duration::from_micros(500));
    }
}
