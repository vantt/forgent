//! Process facts: the judge over a recorded process tuple, and the reads it
//! needs (boot id, start time, PID namespace, lock holders, process scan).
//!
//! The judge is a pure function over a [`Record`], an [`Observer`] and a
//! [`ProcTable`]; every driver and every test feeds it the same way, so the
//! vector file `packages/process/contracts/process-facts.judge.v1.json` is
//! the only judgement table there is.

use std::collections::BTreeMap;
use std::fs::File;
use std::io;
use std::path::PathBuf;

use crate::platform::{self, ProcessPlatform};
use crate::ProcId;

/// What the judge says about a recorded process.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Verdict {
    /// The recorded process is the one running under that pid right now.
    Alive,
    /// It is gone: no such pid, a zombie, a reused pid, or a reboot.
    Dead,
    /// Nothing can be proven from here: another host or namespace, a
    /// record without a pid, or a start time that cannot be read.
    Unknown,
}

/// The identity of a live process as this platform observed it. Every field
/// is known; a record read back from disk is a [`Record`] instead.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProcTuple {
    /// The host the process was observed on.
    pub host: String,
    /// Boot id of the kernel the process runs under; `None` on Windows,
    /// which has no boot id (the creation time stands in for it).
    pub boot_id: Option<String>,
    /// PID namespace id (`pid:[<inode>]` on Linux, `none` where there are
    /// no namespaces).
    pub pid_ns: String,
    /// The pid inside that namespace.
    pub pid: ProcId,
    /// Start time as the OS reports it, kept as the exact string the driver
    /// read so two readers compare bytes, never parsed numbers.
    pub start_time: String,
}

impl ProcTuple {
    /// The same identity as a record, for the judge and for writing to disk.
    pub fn to_record(&self) -> Record {
        Record {
            host: Some(self.host.clone()),
            boot_id: self.boot_id.clone(),
            pid_ns: Some(self.pid_ns.clone()),
            pid: Some(self.pid),
            start_time: Some(self.start_time.clone()),
            anchor: None,
        }
    }
}

/// A process identity as recorded on disk. Any field may be missing (an old
/// or corrupt record); the judge answers `Unknown` rather than guessing.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Record {
    /// `host` of the tuple, when the record carries one.
    pub host: Option<String>,
    /// `bootId` of the tuple, when the record carries one.
    pub boot_id: Option<String>,
    /// `pidNs` of the tuple; absent on records written before namespaces
    /// were recorded.
    pub pid_ns: Option<String>,
    /// `pid` of the tuple; absent when missing, null, zero or not a number.
    pub pid: Option<ProcId>,
    /// `startTime` (or the older `processStartTime`) of the tuple.
    pub start_time: Option<String>,
    /// For a process inside another PID namespace: the host tuple of that
    /// namespace's init. When the anchor is dead the whole namespace is.
    pub anchor: Option<Box<Record>>,
}

impl Record {
    /// Read a record from its JSON object, the same way the Node leaf reads
    /// it: `processStartTime` (the field name records carried before the
    /// tuple existed) is read as `startTime`, a numeric start time as its
    /// decimal text; a `pid` that is not a positive integer that fits a pid
    /// reads as absent; a boot id that is empty, or the `unknown-boot` text
    /// a writer puts down when it could not read its own, reads as absent
    /// (it names no boot, so it must never read as a different one).
    pub fn from_json(value: &serde_json::Value) -> Record {
        let text = |key: &str| value.get(key).and_then(|v| v.as_str()).map(String::from);
        let scalar_text = |v: &serde_json::Value| match v {
            serde_json::Value::String(s) => Some(s.clone()),
            serde_json::Value::Number(n) => Some(n.to_string()),
            _ => None,
        };
        let pid = value
            .get("pid")
            .and_then(|v| v.as_u64().or_else(|| v.as_f64().filter(|f| f.fract() == 0.0 && *f >= 0.0).map(|f| f as u64)))
            .filter(|p| *p > 0 && *p <= u64::from(u32::MAX))
            .map(|p| ProcId(p as u32));
        let anchor = value
            .get("anchor")
            .filter(|a| a.is_object())
            .map(|a| Box::new(Record::from_json(a)));
        Record {
            host: text("host"),
            boot_id: text("bootId").filter(|b| !b.is_empty() && b != "unknown-boot"),
            pid_ns: text("pidNs"),
            pid,
            start_time: value.get("startTime").and_then(scalar_text).or_else(|| value.get("processStartTime").and_then(scalar_text)),
            anchor,
        }
    }

    /// The record as a JSON object, with only the fields that are known.
    pub fn to_json(&self) -> serde_json::Value {
        let mut object = serde_json::Map::new();
        if let Some(host) = &self.host {
            object.insert("host".into(), host.as_str().into());
        }
        if let Some(boot_id) = &self.boot_id {
            object.insert("bootId".into(), boot_id.as_str().into());
        }
        if let Some(pid_ns) = &self.pid_ns {
            object.insert("pidNs".into(), pid_ns.as_str().into());
        }
        if let Some(pid) = self.pid {
            object.insert("pid".into(), pid.0.into());
        }
        if let Some(start_time) = &self.start_time {
            object.insert("startTime".into(), start_time.as_str().into());
        }
        if let Some(anchor) = &self.anchor {
            object.insert("anchor".into(), anchor.to_json());
        }
        serde_json::Value::Object(object)
    }
}

/// Who is judging: the facts of the process that runs the judge.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Observer {
    /// The observer's host name.
    pub host: String,
    /// `None` when this platform has no boot id; the boot check is then skipped.
    pub boot_id: Option<String>,
    /// The observer's PID namespace id.
    pub pid_ns: String,
    /// Whether the observer lives in the initial PID namespace. Outside it,
    /// a record without a namespace is never judged (it may belong to a
    /// host process this observer cannot see).
    pub in_init_pid_ns: bool,
}

/// Why a process's start time could not be read.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum UnreadableCause {
    /// The platform has no way to read it (no `/proc`, an unparseable stat line).
    DriverMissing,
    /// The OS refused the read.
    Permission,
    /// The read did not finish in time.
    Timeout,
}

/// One look at a pid in the process table.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Observed {
    /// No such pid.
    Absent,
    /// The pid exists but the process has exited (state `Z` or `X`).
    Zombie,
    /// A running process with the start time the OS reports for it.
    Live { start_time: String },
    /// The pid may exist but its facts cannot be read.
    Unreadable(UnreadableCause),
}

/// A process table the judge can look pids up in. The platform is one; a
/// test's fake table is another.
pub trait ProcTable {
    /// One look at `pid` in this table.
    fn observe(&self, pid: ProcId) -> Observed;
}

/// The current platform seen as a [`ProcTable`].
pub struct PlatformTable<'a>(pub &'a dyn ProcessPlatform);

impl ProcTable for PlatformTable<'_> {
    fn observe(&self, pid: ProcId) -> Observed {
        self.0.observe(pid)
    }
}

/// Judge `record` as `observer`, looking pids up in `procs`.
///
/// Order of the checks (each vector in the contract file pins one row):
/// another host, or another PID namespace, says nothing about this table
/// (a dead anchor is the one exception: the namespace died with it); an
/// observer outside the initial namespace never judges a record without a
/// namespace; a recorded boot id that differs from the running kernel's is
/// a reboot; a record without a pid proves nothing; then the table decides:
/// absent or zombie is dead, a matching start time is alive, a different
/// one is a reused pid, an unreadable one is unknown.
pub fn judge(record: &Record, observer: &Observer, procs: &dyn ProcTable) -> Verdict {
    if let Some(host) = &record.host {
        if host != &observer.host {
            return Verdict::Unknown;
        }
    }
    match &record.pid_ns {
        Some(pid_ns) if pid_ns != &observer.pid_ns => {
            return match &record.anchor {
                Some(anchor) if judge(anchor, observer, procs) == Verdict::Dead => Verdict::Dead,
                _ => Verdict::Unknown,
            };
        }
        None if !observer.in_init_pid_ns => return Verdict::Unknown,
        _ => {}
    }
    if let (Some(recorded), Some(current)) = (&record.boot_id, &observer.boot_id) {
        if recorded != current {
            return Verdict::Dead;
        }
    }
    let Some(pid) = record.pid else {
        return Verdict::Unknown;
    };
    match procs.observe(pid) {
        Observed::Absent | Observed::Zombie => Verdict::Dead,
        Observed::Unreadable(_) => Verdict::Unknown,
        Observed::Live { start_time } => match &record.start_time {
            Some(recorded) if *recorded == start_time => Verdict::Alive,
            Some(_) => Verdict::Dead,
            None => Verdict::Unknown,
        },
    }
}

/// Judge `record` from this process, on this platform.
pub fn judge_here(record: &Record) -> Verdict {
    let platform = platform::current();
    judge(record, &platform.observer(), &PlatformTable(platform))
}

/// Boot id of the running kernel; `None` where the platform has none.
pub fn boot_id() -> Option<String> {
    platform::current().boot_id()
}

/// Start time of `pid` as the OS reports it; `None` when the pid is absent,
/// a zombie, or unreadable. Use [`observe`] to tell those apart.
pub fn start_time(pid: ProcId) -> Option<String> {
    match platform::current().observe(pid) {
        Observed::Live { start_time } => Some(start_time),
        _ => None,
    }
}

/// One look at `pid` on this platform.
pub fn observe(pid: ProcId) -> Observed {
    platform::current().observe(pid)
}

/// The PID namespace this process runs in.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PidNs {
    /// `pid:[<inode>]` on Linux; `none` where the platform has no
    /// namespaces; `unknown` when Linux refused the read.
    pub id: String,
    /// Whether this is the initial namespace. `false` when unknown, so a
    /// sandboxed observer never cleans a host record by accident.
    pub is_initial: bool,
}

/// The PID namespace of this process.
pub fn pid_ns() -> PidNs {
    platform::current().pid_ns()
}

/// The host name as this platform reports it.
pub fn host() -> String {
    platform::current().host()
}

/// The observer facts of this process.
pub fn observer() -> Observer {
    platform::current().observer()
}

/// The full identity of a live `pid` on this host; `None` when it is absent,
/// a zombie or unreadable.
pub fn identity_of(pid: ProcId) -> Option<ProcTuple> {
    platform::current().identity_of(pid)
}

/// The identity of this process.
pub fn self_identity() -> Option<ProcTuple> {
    identity_of(ProcId(std::process::id()))
}

/// `(device, inode)` of an open file: the key a kernel lock is listed under.
pub fn file_key(file: &File) -> io::Result<(u64, u64)> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        let meta = file.metadata()?;
        Ok((meta.dev(), meta.ino()))
    }
    #[cfg(not(unix))]
    {
        let _ = file;
        Err(io::Error::new(io::ErrorKind::Unsupported, "file keys are not readable on this platform"))
    }
}

/// Who holds a kernel lock on the file `(dev, ino)`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Holders {
    /// Every process whose open descriptions carry a lock on the file, as
    /// far as this observer may read: another user's descriptors are not
    /// readable without privilege, so a holder running as another user is
    /// not listed (the kernel still refuses the lock to a contender).
    List(Vec<ProcTuple>),
    /// The platform cannot list lock holders.
    Unlistable,
}

/// The processes holding a kernel lock on the file `(dev, ino)` (Linux:
/// every `lock:` line under `/proc/*/fdinfo/*`).
pub fn lock_holders(dev: u64, ino: u64) -> Holders {
    platform::current().lock_holders(dev, ino)
}

/// What [`scan`] reads for each process.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct ScanFilter {
    /// Environment variables to copy into each view's `env_subset`.
    pub env_keys: Vec<String>,
    /// Whether the scanning process itself is listed.
    pub include_self: bool,
}

/// One process as [`scan`] saw it. A field that could not be read is `None`
/// (or missing from `env_subset`) and named in `unreadable`, never dropped
/// silently.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProcView {
    /// The pid the process was found under.
    pub pid: ProcId,
    /// The process's identity; `None` when its start time could not be read
    /// (another user's process under a restricted `/proc`), in which case
    /// `unreadable` says so. It is still a process, never dropped from the
    /// scan.
    pub tuple: Option<ProcTuple>,
    /// The executable it runs.
    pub exe: Option<PathBuf>,
    /// Its argument vector.
    pub cmdline: Option<Vec<String>>,
    /// Its working directory.
    pub cwd: Option<PathBuf>,
    /// The environment variables [`ScanFilter::env_keys`] asked for, of
    /// those the process has.
    pub env_subset: BTreeMap<String, String>,
    /// `"<field>: <os error>"` for every read that failed.
    pub unreadable: Vec<String>,
}

/// Result of a process scan.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Scan {
    /// One view per process in the table, identified or not; zombies are
    /// left out (nothing runs there).
    Views(Vec<ProcView>),
    /// The platform cannot enumerate processes with these facts.
    Unsupported,
}

/// Every live process on this host with the facts a quiescence check needs.
pub fn scan(filter: &ScanFilter) -> Scan {
    platform::current().scan(filter)
}

/// Parse one `/proc/<pid>/stat` line into `(state, start_time)`. The
/// command name sits in parentheses and may hold spaces, so fields are
/// counted from the last `)`: state is the first field after it, start
/// time the twentieth.
pub fn parse_proc_stat(line: &str) -> Option<(char, String)> {
    let rest = &line[line.rfind(')')? + 1..];
    let fields: Vec<&str> = rest.split_whitespace().collect();
    let state = fields.first()?.chars().next()?;
    let start_time = fields.get(19)?;
    Some((state, (*start_time).to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_state_and_start_time_from_a_stat_line_with_spaces_in_comm() {
        let line = "4242 (weird) name (x)) S 100 4242 77 34816 4242 4194304 0 0 0 0 1 2 0 0 20 0 1 0 987654 1 2 3";
        assert_eq!(parse_proc_stat(line), Some(('S', "987654".to_string())));
    }

    #[test]
    fn rejects_a_truncated_stat_line() {
        assert_eq!(parse_proc_stat("12 (sh) S 1 12"), None);
        assert_eq!(parse_proc_stat("no parenthesis"), None);
    }

    #[test]
    fn record_from_json_applies_the_legacy_field_and_rejects_bad_pids() {
        let legacy = Record::from_json(&serde_json::json!({ "pid": 4242, "processStartTime": "100" }));
        assert_eq!(legacy.pid, Some(ProcId(4242)));
        assert_eq!(legacy.start_time.as_deref(), Some("100"));
        for bad in [serde_json::json!({ "pid": "abc" }), serde_json::json!({ "pid": 0 }), serde_json::json!({ "pid": null }), serde_json::json!({ "pid": 4294967296u64 }), serde_json::json!({ "pid": 1.5 }), serde_json::json!({})] {
            assert_eq!(Record::from_json(&bad).pid, None, "{bad}");
        }
        assert_eq!(Record::from_json(&serde_json::json!({ "pid": 4242.0 })).pid, Some(ProcId(4242)), "an integral float is the integer it prints as");
        assert_eq!(Record::from_json(&serde_json::json!({ "startTime": 100 })).start_time.as_deref(), Some("100"), "a numeric start time compares by its text");
    }

    #[test]
    fn a_boot_id_that_names_no_boot_reads_as_absent() {
        assert_eq!(Record::from_json(&serde_json::json!({ "bootId": "unknown-boot" })).boot_id, None);
        assert_eq!(Record::from_json(&serde_json::json!({ "bootId": "" })).boot_id, None);
        assert_eq!(Record::from_json(&serde_json::json!({ "bootId": "b1" })).boot_id.as_deref(), Some("b1"));
    }

    #[test]
    fn record_json_round_trips() {
        let record = Record {
            host: Some("h1".into()),
            boot_id: Some("b1".into()),
            pid_ns: Some("pid:[1]".into()),
            pid: Some(ProcId(7)),
            start_time: Some("100".into()),
            anchor: Some(Box::new(Record { pid: Some(ProcId(1)), ..Record::default() })),
        };
        assert_eq!(Record::from_json(&record.to_json()), record);
    }
}
