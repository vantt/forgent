//! The hot mutex record: its paths, its reader and the compare-and-clear that
//! removes it (contract: `packages/holder-lock/contracts/hot-lock.v1.json`).
//!
//! The record is `<fgosDir>/locks/<resource>.hot`. Its writer (taking the
//! mutex by `link()`) stays in the Node state store; this module owns what
//! reads it and what takes it away:
//!
//! * [`read`] answers one of four things about the file. The bytes of the
//!   record are handed back as an opaque `token`, never as text, so a torn
//!   record (not valid UTF-8) still compares equal to itself.
//! * [`reclaim_dead`] and [`clear`] unlink the record only under the kernel
//!   lock `<resource>.reclaim.lock`, and only while the bytes still equal the
//!   token the caller saw. A record that does not parse, or whose holder the
//!   judge cannot prove dead, is never reclaimed.
//!
//! The reclaim lock is taken by its path: the registry scope refuses
//! hot-mutex rows (`scope.rs`), because the hot mutex itself is not a kernel
//! lock.

use crate::{acquire, release, Acquire, Mode, Resource, Wait, DEFAULT_KILL_WAIT_MS};
use fgos_process::facts::{judge_here, Record, Verdict};
use serde_json::Value;
use std::{
    fmt, fs, io,
    path::{Path, PathBuf},
};

/// The hot resources the contract names.
pub const RESOURCES: [&str; 2] = ["state", "porting-events"];
/// How long a cleaner waits for the reclaim lock before it answers busy.
pub const RECLAIM_WAIT_MS: u64 = 1000;

/// The two files of a hot resource.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HotPaths {
    /// `<fgosDir>/locks/<resource>.hot`.
    pub record: PathBuf,
    /// `<fgosDir>/locks/<resource>.reclaim.lock`.
    pub reclaim_lock: PathBuf,
}

/// Why a record operation could not answer.
#[derive(Debug)]
pub enum HotRecordError {
    /// The resource is not one the contract names.
    UnknownResource(String),
    /// Reading or unlinking the record failed for a reason that is not "absent" or "open elsewhere".
    Io(io::Error),
    /// The reclaim lock could not be taken for a reason other than another cleaner holding it.
    LockUnavailable(String),
}

impl fmt::Display for HotRecordError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::UnknownResource(name) => write!(f, "unknown hot resource {name:?}"),
            Self::Io(err) => write!(f, "{err}"),
            Self::LockUnavailable(detail) => write!(f, "reclaim lock unavailable: {detail}"),
        }
    }
}

impl std::error::Error for HotRecordError {}

/// One look at a record file.
#[derive(Debug, Clone, PartialEq)]
pub enum Read {
    /// No record file.
    Missing,
    /// The file is open in another process (a sharing violation, or EPERM/EBUSY
    /// elsewhere), so its content is unknown: it is never reclaimed.
    Retry {
        /// `EPERM` or `EBUSY`, as Node names them.
        code: &'static str,
    },
    /// The file exists but is not a JSON object with a positive integer `pid`
    /// (a torn write, invalid UTF-8 included): it is never reclaimed.
    Unreadable {
        /// The file's bytes.
        token: Vec<u8>,
    },
    /// A record naming a holder.
    Ok {
        /// The parsed JSON object, as the judge reads it.
        record: Value,
        /// The file's bytes.
        token: Vec<u8>,
    },
}

/// What [`reclaim_dead`] did.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Reclaim {
    /// The dead holder's record was unlinked.
    Cleaned,
    /// The record changed, vanished or no longer judges dead: nothing was removed.
    Changed,
    /// Another cleaner holds the reclaim lock.
    Busy,
}

/// The record and reclaim-lock paths of `resource` under `fgos_dir`.
pub fn paths(fgos_dir: &Path, resource: &str) -> Result<HotPaths, HotRecordError> {
    if !RESOURCES.contains(&resource) {
        return Err(HotRecordError::UnknownResource(resource.to_owned()));
    }
    let dir = fgos_dir.join("locks");
    Ok(HotPaths {
        record: dir.join(format!("{resource}.hot")),
        reclaim_lock: dir.join(format!("{resource}.reclaim.lock")),
    })
}

/// The Node error code of an error that means "open in another process".
fn retryable(err: &io::Error) -> Option<&'static str> {
    let code = err.raw_os_error()?;
    #[cfg(unix)]
    {
        match code {
            libc::EPERM => Some("EPERM"),
            libc::EBUSY => Some("EBUSY"),
            _ => None,
        }
    }
    #[cfg(windows)]
    {
        // ERROR_ACCESS_DENIED, ERROR_SHARING_VIOLATION, ERROR_LOCK_VIOLATION.
        match code {
            5 => Some("EPERM"),
            32 | 33 => Some("EBUSY"),
            _ => None,
        }
    }
    #[cfg(not(any(unix, windows)))]
    {
        let _ = code;
        None
    }
}

fn holder_pid_is_valid(record: &Value) -> bool {
    match record.get("pid") {
        Some(Value::Number(n)) => n
            .as_u64()
            .map(|p| p > 0)
            .or_else(|| n.as_f64().map(|f| f.fract() == 0.0 && f > 0.0))
            .unwrap_or(false),
        _ => false,
    }
}

/// Read the record file at `record`.
pub fn read_record(record: &Path) -> Result<Read, HotRecordError> {
    let token = match fs::read(record) {
        Ok(bytes) => bytes,
        Err(err) if err.kind() == io::ErrorKind::NotFound => return Ok(Read::Missing),
        Err(err) => {
            return match retryable(&err) {
                Some(code) => Ok(Read::Retry { code }),
                None => Err(HotRecordError::Io(err)),
            }
        }
    };
    let parsed = std::str::from_utf8(&token)
        .ok()
        .and_then(|text| serde_json::from_str::<Value>(text).ok())
        .filter(|value| value.is_object() && holder_pid_is_valid(value));
    Ok(match parsed {
        Some(record) => Read::Ok { record, token },
        None => Read::Unreadable { token },
    })
}

/// Read the record of `resource` under `fgos_dir`.
pub fn read(fgos_dir: &Path, resource: &str) -> Result<Read, HotRecordError> {
    read_record(&paths(fgos_dir, resource)?.record)
}

/// Unlink `record` only while it still holds exactly `token`. Returns whether
/// it was removed. The caller holds the reclaim lock.
pub fn unlink_if_unchanged(record: &Path, token: &[u8]) -> Result<bool, HotRecordError> {
    match read_record(record)? {
        Read::Ok { token: now, .. } | Read::Unreadable { token: now } if now == token => {}
        _ => return Ok(false),
    }
    match fs::remove_file(record) {
        Ok(()) => Ok(true),
        Err(err) if err.kind() == io::ErrorKind::NotFound || retryable(&err).is_some() => Ok(false),
        Err(err) => Err(HotRecordError::Io(err)),
    }
}

/// Run `body` under the reclaim kernel lock of `resource`; `None` when another cleaner holds it.
fn under_reclaim_lock<T>(
    fgos_dir: &Path,
    resource: &str,
    body: impl FnOnce(&HotPaths) -> Result<T, HotRecordError>,
) -> Result<Option<T>, HotRecordError> {
    let hot = paths(fgos_dir, resource)?;
    let lock = Resource::new(resource, &hot.reclaim_lock);
    match acquire(
        &lock,
        Mode::Ex,
        Wait::Ms(RECLAIM_WAIT_MS),
        DEFAULT_KILL_WAIT_MS,
    ) {
        Acquire::Acquired(handle) => {
            let outcome = body(&hot);
            release(handle);
            outcome.map(Some)
        }
        Acquire::Held { .. } | Acquire::Timeout { .. } => Ok(None),
        Acquire::Unavailable { reason, detail } => Err(HotRecordError::LockUnavailable(format!(
            "{}: {detail}",
            reason.as_str()
        ))),
    }
}

/// Clean the record of a dead holder under the reclaim lock. `token` is the
/// record's bytes as the caller read (and judged dead) them: they must still
/// be there, and the judge must still answer dead.
pub fn reclaim_dead(
    fgos_dir: &Path,
    resource: &str,
    token: &[u8],
) -> Result<Reclaim, HotRecordError> {
    let outcome = under_reclaim_lock(fgos_dir, resource, |hot| {
        let Read::Ok { record, token: now } = read_record(&hot.record)? else {
            return Ok(Reclaim::Changed);
        };
        if now != token || judge_here(&Record::from_json(&record)) != Verdict::Dead {
            return Ok(Reclaim::Changed);
        }
        match fs::remove_file(&hot.record) {
            Ok(()) => Ok(Reclaim::Cleaned),
            Err(err) if err.kind() == io::ErrorKind::NotFound || retryable(&err).is_some() => {
                Ok(Reclaim::Changed)
            }
            Err(err) => Err(HotRecordError::Io(err)),
        }
    })?;
    Ok(outcome.unwrap_or(Reclaim::Busy))
}

/// Remove the record a person has confirmed is dead weight, under the reclaim
/// lock and only while it still holds exactly `token`. Returns whether it was removed.
pub fn clear(fgos_dir: &Path, resource: &str, token: &[u8]) -> Result<bool, HotRecordError> {
    let outcome = under_reclaim_lock(fgos_dir, resource, |hot| {
        unlink_if_unchanged(&hot.record, token)
    })?;
    Ok(outcome.unwrap_or(false))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::Acquire;
    use std::sync::atomic::{AtomicU32, Ordering};

    static NEXT: AtomicU32 = AtomicU32::new(0);

    /// A scratch `.fgos` with its `locks` directory; removed on drop.
    struct Fixture(PathBuf);

    impl Fixture {
        fn new() -> Self {
            let dir = std::env::temp_dir().join(format!(
                "fgos-hot-record-{}-{}",
                std::process::id(),
                NEXT.fetch_add(1, Ordering::Relaxed)
            ));
            fs::create_dir_all(dir.join("locks")).unwrap();
            Fixture(dir)
        }
        fn record(&self) -> PathBuf {
            paths(&self.0, "state").unwrap().record
        }
    }

    impl Drop for Fixture {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    fn vectors() -> Value {
        serde_json::from_str::<Value>(include_str!("../../contracts/hot-lock.v1.json")).unwrap()
            ["vectors"]
            .clone()
    }

    /// The bytes a contract file value names; `None` for no file.
    fn bytes_of(file: &Value) -> Option<Vec<u8>> {
        if file.is_null() {
            return None;
        }
        Some(match file.get("hex").and_then(Value::as_str) {
            Some(hex) => (0..hex.len())
                .step_by(2)
                .map(|i| u8::from_str_radix(&hex[i..i + 2], 16).unwrap())
                .collect(),
            None => file["utf8"].as_str().unwrap().as_bytes().to_vec(),
        })
    }

    fn put(path: &Path, file: &Value) {
        match bytes_of(file) {
            Some(bytes) => fs::write(path, bytes).unwrap(),
            None => drop(fs::remove_file(path)),
        }
    }

    #[test]
    fn every_read_vector_gets_its_outcome_and_unreadable_records_keep_their_bytes() {
        let rows = vectors()["read"].as_array().unwrap().clone();
        assert!(rows.len() >= 10);
        for row in rows {
            let fixture = Fixture::new();
            put(&fixture.record(), &row["file"]);
            let seen = read(&fixture.0, "state").unwrap();
            let name = &row["name"];
            let want = bytes_of(&row["file"]);
            match (row["outcome"].as_str().unwrap(), &seen) {
                ("missing", Read::Missing) => {}
                ("ok", Read::Ok { token, .. }) | ("unreadable", Read::Unreadable { token }) => {
                    assert_eq!(
                        Some(token.clone()),
                        want,
                        "{name}: the token is the file's bytes"
                    );
                }
                (outcome, seen) => panic!("{name}: wanted {outcome}, read {seen:?}"),
            }
        }
    }

    #[test]
    fn every_clear_vector_removes_the_record_only_when_its_bytes_are_the_token() {
        let rows = vectors()["clear"].as_array().unwrap().clone();
        assert!(rows.len() >= 5);
        for row in rows {
            let fixture = Fixture::new();
            put(&fixture.record(), &row["onDisk"]);
            let token = bytes_of(&row["token"]).unwrap();
            let name = &row["name"];
            let cleared = clear(&fixture.0, "state", &token).unwrap();
            assert_eq!(cleared, row["cleared"].as_bool().unwrap(), "{name}");
            let on_disk = fs::read(fixture.record()).ok();
            if cleared {
                assert_eq!(on_disk, None, "{name}: the record is gone");
            } else {
                assert_eq!(
                    on_disk,
                    bytes_of(&row["onDisk"]),
                    "{name}: the record that arrived since stays"
                );
            }
        }
    }

    #[test]
    fn a_resource_the_contract_does_not_name_is_refused_before_any_file_is_touched() {
        let fixture = Fixture::new();
        for result in [
            read(&fixture.0, "events").map(drop),
            clear(&fixture.0, "events", b"x").map(drop),
            reclaim_dead(&fixture.0, "events", b"x").map(drop),
        ] {
            assert!(
                matches!(result, Err(HotRecordError::UnknownResource(name)) if name == "events")
            );
        }
    }

    #[test]
    fn the_paths_are_the_contracts_record_and_reclaim_lock() {
        let hot = paths(Path::new("/p/.fgos"), "porting-events").unwrap();
        assert_eq!(hot.record, Path::new("/p/.fgos/locks/porting-events.hot"));
        assert_eq!(
            hot.reclaim_lock,
            Path::new("/p/.fgos/locks/porting-events.reclaim.lock")
        );
    }

    #[test]
    fn a_clear_waits_for_the_reclaim_lock_and_then_leaves_the_record_alone() {
        let fixture = Fixture::new();
        fs::write(fixture.record(), b"{\"pid\":").unwrap();
        let hot = paths(&fixture.0, "state").unwrap();
        let Acquire::Acquired(held) = acquire(
            &Resource::new("state", &hot.reclaim_lock),
            Mode::Ex,
            Wait::Try,
            DEFAULT_KILL_WAIT_MS,
        ) else {
            panic!("the test could not take the reclaim lock");
        };
        assert!(!clear(&fixture.0, "state", b"{\"pid\":").unwrap());
        assert_eq!(
            reclaim_dead(&fixture.0, "state", b"{\"pid\":").unwrap(),
            Reclaim::Busy
        );
        assert!(fixture.record().exists(), "a busy cleaner removes nothing");
        release(held);
        assert!(clear(&fixture.0, "state", b"{\"pid\":").unwrap());
    }

    /// The tuple of this process as a record, with the boot id replaced so the
    /// judge answers dead (a reboot) for the same pid namespace and host.
    #[cfg(unix)]
    fn dead_record() -> Vec<u8> {
        let me = fgos_process::facts::self_identity().expect("this process has an identity");
        let boot_id = me.boot_id.expect("a unix platform has a boot id");
        assert_ne!(boot_id, "recorded-in-an-earlier-boot");
        serde_json::to_vec(&serde_json::json!({
            "v": 1, "pid": me.pid.0, "startTime": me.start_time,
            "bootId": "recorded-in-an-earlier-boot", "pidNs": me.pid_ns,
        }))
        .unwrap()
    }

    #[cfg(unix)]
    fn live_record() -> Vec<u8> {
        let me = fgos_process::facts::self_identity().expect("this process has an identity");
        serde_json::to_vec(&serde_json::json!({
            "v": 1, "pid": me.pid.0, "startTime": me.start_time,
            "bootId": me.boot_id, "pidNs": me.pid_ns,
        }))
        .unwrap()
    }

    #[cfg(unix)]
    #[test]
    fn a_dead_holders_record_is_reclaimed_once() {
        let fixture = Fixture::new();
        fs::write(fixture.record(), dead_record()).unwrap();
        let Read::Ok { token, .. } = read(&fixture.0, "state").unwrap() else {
            panic!("the dead record parses");
        };
        assert_eq!(
            reclaim_dead(&fixture.0, "state", &token).unwrap(),
            Reclaim::Cleaned
        );
        assert!(!fixture.record().exists());
        assert_eq!(
            reclaim_dead(&fixture.0, "state", &token).unwrap(),
            Reclaim::Changed,
            "an absent record is somebody else's cleanup"
        );
    }

    #[cfg(unix)]
    #[test]
    fn a_record_that_changed_after_it_was_judged_dead_is_never_reclaimed() {
        let fixture = Fixture::new();
        fs::write(fixture.record(), dead_record()).unwrap();
        let Read::Ok { token, .. } = read(&fixture.0, "state").unwrap() else {
            panic!("the dead record parses");
        };
        let live = live_record();
        fs::write(fixture.record(), &live).unwrap();
        assert_eq!(
            reclaim_dead(&fixture.0, "state", &token).unwrap(),
            Reclaim::Changed
        );
        assert_eq!(
            fs::read(fixture.record()).unwrap(),
            live,
            "the live holder keeps its record"
        );
        // Even a caller that passes the live bytes as the token reclaims nothing: the judge says alive.
        assert_eq!(
            reclaim_dead(&fixture.0, "state", &live).unwrap(),
            Reclaim::Changed
        );
        assert!(fixture.record().exists());
    }

    #[test]
    fn an_unreadable_record_is_never_reclaimed_even_with_its_own_bytes() {
        let fixture = Fixture::new();
        let torn = b"{\"v\":1,\"pid\":7,\"writer\":\"\xff\"}".to_vec();
        fs::write(fixture.record(), &torn).unwrap();
        assert_eq!(
            reclaim_dead(&fixture.0, "state", &torn).unwrap(),
            Reclaim::Changed
        );
        assert_eq!(fs::read(fixture.record()).unwrap(), torn);
    }
}
