//! The run control ledger: per-Run control epoch and token fencing over an append-only directory of
//! immutable, monotonically numbered generation records plus token-specific release markers, each published
//! by a fsynced temp file followed by an exclusive link (`fgos-durable-file`). Nothing here unlinks or
//! overwrites a published record, so a delayed straggler can only publish a NEW, higher-numbered generation.
//!
//! Reclaim rule: a live PID stays HELD however stale its heartbeat looks. `ttl_ms` only gates whether a
//! contender probes liveness at all; the reclaim decision is dead-process proof (`fgos_process::facts`).
//!
//! Builds with the `lease` feature alone (what the addon reads): no terminal-control, no session-host.

use fgos_durable_file::{install_once_with_mode, Installed};
use fgos_process::facts::{judge_here, Record, Verdict};
use serde_json::{json, Map, Value};
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

/// One published generation: its epoch (from the file name) and its record.
#[derive(Debug, Clone, PartialEq)]
pub struct Generation {
    pub epoch: u64,
    pub record: Value,
}

/// The two directories of a Run's control ledger.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ControlDirs {
    pub generations_dir: PathBuf,
    pub releases_dir: PathBuf,
}

/// What a contender asked for under [`acquire_run_control`].
#[derive(Debug, Clone, Default)]
pub struct AcquireOptions {
    /// `{id, pid, ...}` of the caller (see [`build_run_control_holder`]).
    pub holder: Value,
    pub purpose: Option<String>,
    /// Fences a caller that read a stale epoch: refuses `Stale` when the current epoch differs (`None` there reads as no generation).
    pub expected_control_epoch: Option<Option<u64>>,
    pub ttl_ms: Option<u64>,
    /// Milliseconds since the Unix epoch; the clock when `None`.
    pub now: Option<u64>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum AcquireOutcome {
    Acquired {
        control_epoch: u64,
        control_token: String,
    },
    Held {
        control_epoch: u64,
        holder: Value,
    },
    Stale {
        control_epoch: Option<u64>,
    },
    Settled {
        control_epoch: u64,
    },
}

/// `{held: false}` / `{held: true, controlEpoch, holder}` of [`inspect_run_control`].
#[derive(Debug, Clone, PartialEq)]
pub struct RunControlState {
    pub held: bool,
    pub settled: bool,
    pub control_epoch: Option<u64>,
    pub holder: Option<Value>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum SettleOutcome {
    Settled { control_epoch: u64 },
    Superseded { control_epoch: Option<u64> },
    AlreadySettled { control_epoch: u64 },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ReleaseOutcome {
    Released,
    AlreadyReleased,
    UnknownGeneration,
    TokenMismatch,
}

impl ReleaseOutcome {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Released => "released",
            Self::AlreadyReleased => "already-released",
            Self::UnknownGeneration => "unknown-generation",
            Self::TokenMismatch => "token-mismatch",
        }
    }
}

/// What `decide` answers to [`publish_next_generation`].
pub enum Decision<T> {
    /// Publish nothing; `T` goes back verbatim.
    Stop(T),
    /// Publish this record as the next generation.
    Record(Value),
}

pub enum Published<T> {
    NotPublished(T),
    Published { epoch: u64, record: Value },
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn io_other(message: String) -> io::Error {
    io::Error::other(message)
}

/// `{id, ...selfRecord, processStartTime: startTime}` for the current process: the cross-checkable identity every
/// `acquire_run_control` caller records (`id` alone let a reused PID pass for the same holder).
pub fn build_run_control_holder(id: &str) -> Value {
    let mut object = Map::new();
    object.insert("id".into(), id.into());
    if let Some(tuple) = fgos_process::facts::self_identity() {
        if let Value::Object(fields) = tuple.to_record().to_json() {
            for (key, value) in fields {
                object.insert(key, value);
            }
        }
        object.insert("processStartTime".into(), tuple.start_time.as_str().into());
    }
    Value::Object(object)
}

/// Best-effort fsync of an already-written file.
pub fn fsync_file_best_effort(path: &Path) {
    if let Ok(file) = fs::OpenOptions::new().read(true).write(true).open(path) {
        let _ = file.sync_all();
    }
}

/// Best-effort fsync of a directory; publication already happened by the link itself.
pub fn fsync_dir_best_effort(dir: &Path) {
    let _ = fgos_durable_file::sync_directory(dir);
}

fn generation_file_name(epoch: u64) -> String {
    format!("{epoch:010}.json")
}

fn epoch_of_name(name: &str) -> Option<u64> {
    let digits = name.strip_suffix(".json")?;
    (digits.len() == 10 && digits.bytes().all(|b| b.is_ascii_digit()))
        .then(|| digits.parse().ok())
        .flatten()
}

fn parse_json_file(path: &Path) -> io::Result<Option<Value>> {
    let raw = match fs::read_to_string(path) {
        Ok(raw) => raw,
        Err(err) if err.kind() == io::ErrorKind::NotFound => return Ok(None),
        Err(err) => return Err(err),
    };
    // A record this primitive published is complete (fsynced temp + atomic link); anything unparseable was
    // written by something else and reads as absent, never authoritative.
    Ok(serde_json::from_str(&raw).ok())
}

/// Every published generation in `dir`, ascending by epoch; a missing directory is an empty ledger.
pub fn list_generations(dir: &Path) -> io::Result<Vec<Generation>> {
    let names = match fs::read_dir(dir) {
        Ok(entries) => entries,
        Err(err) if err.kind() == io::ErrorKind::NotFound => return Ok(Vec::new()),
        Err(err) => return Err(err),
    };
    let mut records = Vec::new();
    for entry in names {
        let entry = entry?;
        let name = entry.file_name();
        let Some(epoch) = name.to_str().and_then(epoch_of_name) else {
            continue;
        };
        if let Some(record) = parse_json_file(&dir.join(&name))? {
            records.push(Generation { epoch, record });
        }
    }
    records.sort_by_key(|g| g.epoch);
    Ok(records)
}

/// The highest-epoch generation, from a fresh directory read (a rebuildable projection is never authority).
pub fn current_generation(dir: &Path) -> io::Result<Option<Generation>> {
    Ok(list_generations(dir)?.pop())
}

/// Publish the next generation. `decide(current, next_epoch)` runs fresh on every attempt, including after a
/// lost race, so a loser either recognises the winner's record as its own outcome or contends for the next epoch.
pub fn publish_next_generation<T>(
    dir: &Path,
    mut decide: impl FnMut(Option<&Generation>, u64) -> Decision<T>,
) -> io::Result<Published<T>> {
    fs::create_dir_all(dir)?;
    loop {
        let generations = list_generations(dir)?;
        let current = generations.last();
        let next_epoch = current.map_or(0, |g| g.epoch) + 1;
        let record = match decide(current, next_epoch) {
            Decision::Stop(rest) => return Ok(Published::NotPublished(rest)),
            Decision::Record(record) => record,
        };
        let name = generation_file_name(next_epoch);
        let bytes = serde_json::to_vec(&record).map_err(|e| io_other(e.to_string()))?;
        match install_once_with_mode(dir, &name, &bytes, 0o644) {
            Ok(Installed::Created) => {
                return Ok(Published::Published {
                    epoch: next_epoch,
                    record,
                })
            }
            Ok(Installed::AlreadyExists) => {
                // A name that exists is taken. A contender's record is linked whole, so the reread lists it;
                // one the ledger cannot read would be met again at this same epoch for ever.
                let path = dir.join(&name);
                if !path.exists() || parse_json_file(&path)?.is_some() {
                    continue;
                }
                return Err(io_other(format!(
                    "generation-unreadable: generation record {} exists but cannot be read",
                    path.display()
                )));
            }
            Err(err) => return Err(err.source),
        }
    }
}

/// Publish `record` at `marker_path` at most once; a second publish for the same path is a no-op, never an overwrite.
pub fn publish_marker_once(marker_path: &Path, record: &Value) -> io::Result<bool> {
    let dir = marker_path
        .parent()
        .ok_or_else(|| io_other("marker path has no parent".into()))?;
    fs::create_dir_all(dir)?;
    let name = marker_path
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| io_other("marker path has no name".into()))?;
    let bytes = serde_json::to_vec(record).map_err(|e| io_other(e.to_string()))?;
    match install_once_with_mode(dir, name, &bytes, 0o644) {
        Ok(Installed::Created) => Ok(true),
        Ok(Installed::AlreadyExists) => Ok(false),
        Err(err) => Err(err.source),
    }
}

/// Read a marker. A marker is evidence of a clean release, never death proof; an absent one proves nothing.
pub fn read_marker(marker_path: &Path) -> io::Result<Option<Value>> {
    parse_json_file(marker_path)
}

pub fn control_dirs(run_dir: &Path) -> ControlDirs {
    let base = run_dir.join("control");
    ControlDirs {
        generations_dir: base.join("generations"),
        releases_dir: base.join("releases"),
    }
}

fn release_marker_path(releases_dir: &Path, epoch: u64) -> PathBuf {
    releases_dir.join(format!("{}.release", generation_file_name(epoch)))
}

fn is_dead(holder: &Value) -> bool {
    judge_here(&Record::from_json(holder)) == Verdict::Dead
}

fn random_token() -> String {
    use std::collections::hash_map::RandomState;
    use std::hash::{BuildHasher, Hasher};
    let mut bytes = [0u8; 16];
    #[cfg(unix)]
    {
        use std::io::Read;
        if let Ok(mut file) = fs::File::open("/dev/urandom") {
            let _ = file.read_exact(&mut bytes);
        }
    }
    if bytes.iter().all(|b| *b == 0) {
        for chunk in bytes.chunks_mut(8) {
            let mut hasher = RandomState::new().build_hasher();
            hasher.write_u128(now_ms() as u128);
            chunk.copy_from_slice(&hasher.finish().to_le_bytes()[..chunk.len()]);
        }
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    let hex: String = bytes.iter().map(|b| format!("{b:02x}")).collect();
    format!(
        "{}-{}-{}-{}-{}",
        &hex[0..8],
        &hex[8..12],
        &hex[12..16],
        &hex[16..20],
        &hex[20..32]
    )
}

/// Acquire per-Run control: a monotonic `controlEpoch` plus a unique `controlToken` fencing successive controller
/// acquisitions of the same Run. Synchronous and fs-only.
pub fn acquire_run_control(run_dir: &Path, options: &AcquireOptions) -> io::Result<AcquireOutcome> {
    let dirs = control_dirs(run_dir);
    let now = options.now.unwrap_or_else(now_ms);
    let mut failure: Option<io::Error> = None;
    let result = publish_next_generation(&dirs.generations_dir, |current, _next| {
        if let Some(expected) = options.expected_control_epoch {
            let current_epoch = current.map(|g| g.epoch);
            if current_epoch != expected {
                return Decision::Stop(AcquireOutcome::Stale {
                    control_epoch: current_epoch,
                });
            }
        }
        if let Some(current) = current {
            if current.record.get("purpose").and_then(Value::as_str) == Some("settled") {
                return Decision::Stop(AcquireOutcome::Settled {
                    control_epoch: current.epoch,
                });
            }
            let released =
                match read_marker(&release_marker_path(&dirs.releases_dir, current.epoch)) {
                    Ok(marker) => marker.is_some(),
                    Err(err) => {
                        failure = Some(err);
                        false
                    }
                };
            if !released {
                let acquired_at = current.record.get("acquiredAt").and_then(Value::as_i64);
                let heartbeat_fresh = match (options.ttl_ms, acquired_at) {
                    (Some(ttl), Some(at)) => now as i64 - at <= ttl as i64,
                    _ => false,
                };
                let holder = current.record.get("holder").cloned().unwrap_or(Value::Null);
                if heartbeat_fresh {
                    return Decision::Stop(AcquireOutcome::Held {
                        control_epoch: current.epoch,
                        holder,
                    });
                }
                // Heartbeat expired (or no ttl: always attempt): only proven-dead identity authorizes reclaim.
                if !is_dead(&holder) {
                    return Decision::Stop(AcquireOutcome::Held {
                        control_epoch: current.epoch,
                        holder,
                    });
                }
            }
        }
        Decision::Record(json!({
            "controlToken": random_token(),
            "holder": options.holder,
            "purpose": options.purpose,
            "acquiredAt": now,
        }))
    })?;
    if let Some(err) = failure {
        return Err(err);
    }
    Ok(match result {
        Published::NotPublished(outcome) => outcome,
        Published::Published { epoch, record } => AcquireOutcome::Acquired {
            control_epoch: epoch,
            control_token: record["controlToken"]
                .as_str()
                .unwrap_or_default()
                .to_string(),
        },
    })
}

/// Read-only: is the Run's current control generation still effectively held? Same released-marker then
/// dead-holder logic as the reclaim decision, never a write. Liveness that cannot be disproven reads as held.
pub fn inspect_run_control(run_dir: &Path) -> io::Result<RunControlState> {
    let dirs = control_dirs(run_dir);
    let not_held = |settled: bool, epoch: Option<u64>| RunControlState {
        held: false,
        settled,
        control_epoch: epoch,
        holder: None,
    };
    let Some(current) = current_generation(&dirs.generations_dir)? else {
        return Ok(not_held(false, None));
    };
    if current.record.get("purpose").and_then(Value::as_str) == Some("settled") {
        return Ok(not_held(true, Some(current.epoch)));
    }
    if read_marker(&release_marker_path(&dirs.releases_dir, current.epoch))?.is_some() {
        return Ok(not_held(false, Some(current.epoch)));
    }
    let holder = current.record.get("holder").cloned().unwrap_or(Value::Null);
    if is_dead(&holder) {
        return Ok(not_held(false, Some(current.epoch)));
    }
    Ok(RunControlState {
        held: true,
        settled: false,
        control_epoch: Some(current.epoch),
        holder: Some(holder),
    })
}

/// Commit authoritative settlement under the control ledger: a CAS that publishes the next generation with
/// `purpose: "settled"` only while `{control_epoch, control_token}` is still current.
pub fn settle_run_control(
    run_dir: &Path,
    control_epoch: u64,
    control_token: &str,
    now: Option<u64>,
) -> io::Result<SettleOutcome> {
    let dirs = control_dirs(run_dir);
    let now = now.unwrap_or_else(now_ms);
    let result = publish_next_generation(&dirs.generations_dir, |current, _next| {
        let matches = current.is_some_and(|g| {
            g.epoch == control_epoch
                && g.record.get("controlToken").and_then(Value::as_str) == Some(control_token)
        });
        let Some(current) = current.filter(|_| matches) else {
            return Decision::Stop(SettleOutcome::Superseded {
                control_epoch: current.map(|g| g.epoch),
            });
        };
        if current.record.get("purpose").and_then(Value::as_str) == Some("settled") {
            return Decision::Stop(SettleOutcome::AlreadySettled {
                control_epoch: current.epoch,
            });
        }
        Decision::Record(json!({
            "controlToken": control_token,
            "purpose": "settled",
            "settledEpoch": control_epoch,
            "acquiredAt": now,
        }))
    })?;
    Ok(match result {
        Published::NotPublished(outcome) => outcome,
        Published::Published { epoch, .. } => SettleOutcome::Settled {
            control_epoch: epoch,
        },
    })
}

/// Release a held control token. Idempotent; a caller that no longer names the generation it thinks it holds gets a
/// status, never an error, so a cleanup path is never blocked by its own staleness.
pub fn release_run_control(
    run_dir: &Path,
    control_epoch: u64,
    control_token: &str,
    now: Option<u64>,
) -> io::Result<ReleaseOutcome> {
    let dirs = control_dirs(run_dir);
    let Some(record) = parse_json_file(
        &dirs
            .generations_dir
            .join(generation_file_name(control_epoch)),
    )?
    else {
        return Ok(ReleaseOutcome::UnknownGeneration);
    };
    if record.get("controlToken").and_then(Value::as_str) != Some(control_token) {
        return Ok(ReleaseOutcome::TokenMismatch);
    }
    let published = publish_marker_once(
        &release_marker_path(&dirs.releases_dir, control_epoch),
        &json!({"controlEpoch": control_epoch, "controlToken": control_token, "releasedAt": now.unwrap_or_else(now_ms)}),
    )?;
    Ok(if published {
        ReleaseOutcome::Released
    } else {
        ReleaseOutcome::AlreadyReleased
    })
}

/// Whether `{control_epoch, control_token}` is still the Run's current control generation right now.
pub fn is_run_control_current(
    run_dir: &Path,
    control_epoch: u64,
    control_token: &str,
) -> io::Result<bool> {
    let dirs = control_dirs(run_dir);
    Ok(current_generation(&dirs.generations_dir)?.is_some_and(|g| {
        g.epoch == control_epoch
            && g.record.get("controlToken").and_then(Value::as_str) == Some(control_token)
    }))
}
