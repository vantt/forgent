//! The machine's worker lane pool: one held lock `<lockRoot>/lane/<k>.lock` per running top-level worker seat.
//!
//! The supervisor of a top-level worker seat takes a lane before it launches the agent and keeps it until it
//! exits; the kernel frees the lock with the process, so a crashed supervisor frees its lane. A head session
//! and a nested dispatch take none. The pool size comes from the envelope (`lanes.ceiling`), never from
//! config: this crate reads none. See docs/platform/run-supervisor/spec.md section 5.4.

use std::collections::BTreeSet;
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};

use fgos_holder_lock::{
    acquire, holders, probe, Acquire, Handle, HoldersList, Mode, Probe, Resource, Wait,
};
use serde_json::Value;

/// How long a full pool sleeps between two sweeps of its seats.
const RETRY_STEP: Duration = Duration::from_millis(25);

/// The lane settings an envelope carries.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LaneConfig {
    /// Pool size; `None` is unarmed.
    pub ceiling: Option<u64>,
    /// How long a full pool is waited on, in milliseconds.
    pub wait_ms: u64,
}

/// The lane settings of `envelope`, or `None` when it takes no lane: no `lanes` field, or a head session
/// (a session is never a seat of the pool).
pub fn config_of(envelope: &Value) -> Option<LaneConfig> {
    if envelope.get("session").is_some_and(|s| !s.is_null()) {
        return None;
    }
    let lanes = envelope.get("lanes").filter(|l| l.is_object())?;
    Some(LaneConfig {
        ceiling: lanes["ceiling"].as_u64(),
        wait_ms: lanes["waitMs"].as_u64().unwrap_or(0),
    })
}

/// A lane held by this process; dropping it frees the seat. `None` when nothing was taken.
#[derive(Debug)]
pub enum Lane {
    /// No lane: unarmed pool or an attempt that takes none. No file was touched.
    None,
    /// Seat `k` is held.
    Held {
        /// The seat number.
        k: u64,
        /// The lock; closed on drop.
        _handle: Handle,
    },
}

/// Why no lane was taken.
#[derive(Debug, PartialEq, Eq)]
pub enum TakeError {
    /// Every seat of the pool stayed held for the whole wait.
    PoolFull(LanePoolFull),
    /// The lock driver cannot lock at all, or the seat directory cannot be made.
    Unavailable(String),
}

/// Every one of `ceiling` seats is held.
#[derive(Debug, PartialEq, Eq)]
pub struct LanePoolFull {
    /// The pool size.
    pub ceiling: u64,
}

fn lane_dir(lock_root: &Path) -> PathBuf {
    lock_root.join("lane")
}

fn seat(lock_root: &Path, k: u64) -> Resource {
    Resource::new("lane", lane_dir(lock_root).join(format!("{k}.lock")))
}

/// One sweep over seats `0..ceiling`: the first one that locks, `None` when all are held.
fn sweep(lock_root: &Path, ceiling: u64) -> Result<Option<Lane>, TakeError> {
    for k in 0..ceiling {
        match acquire(&seat(lock_root, k), Mode::Ex, Wait::Try, 0) {
            Acquire::Acquired(handle) => return Ok(Some(Lane::Held { k, _handle: handle })),
            Acquire::Held { .. } | Acquire::Timeout { .. } => {}
            Acquire::Unavailable { reason, detail } => {
                return Err(TakeError::Unavailable(format!(
                    "{}: {detail}",
                    reason.as_str()
                )))
            }
        }
    }
    Ok(None)
}

/// Take the first free seat of a pool of `ceiling`, waiting at most `wait_ms` for one to free.
/// `ceiling` `None` is unarmed: `Lane::None`, no file touched.
pub fn take(lock_root: &Path, ceiling: Option<u64>, wait_ms: u64) -> Result<Lane, TakeError> {
    let Some(ceiling) = ceiling else {
        return Ok(Lane::None);
    };
    std::fs::create_dir_all(lane_dir(lock_root))
        .map_err(|why| TakeError::Unavailable(format!("lane directory: {why}")))?;
    let deadline = Instant::now() + Duration::from_millis(wait_ms);
    loop {
        if let Some(lane) = sweep(lock_root, ceiling)? {
            return Ok(lane);
        }
        let now = Instant::now();
        if now >= deadline {
            return Err(TakeError::PoolFull(LanePoolFull { ceiling }));
        }
        std::thread::sleep(RETRY_STEP.min(deadline - now));
    }
}

/// [`take`] for the envelope's own settings.
pub fn take_for(lock_root: &Path, envelope: &Value) -> Result<Lane, TakeError> {
    match config_of(envelope) {
        Some(cfg) => take(lock_root, cfg.ceiling, cfg.wait_ms),
        None => Ok(Lane::None),
    }
}

/// What adopt records when a live worker it re-owns finds the pool full: the worker is already running and is
/// never ended for a lane.
pub const POOL_OVER: &str = "lane-pool-over";

/// The lane an adopter takes for a live worker whose envelope names a pool: one try, so the live count never
/// undercounts. The second value is `Some(POOL_OVER)` when the pool is full.
pub fn adopt(lock_root: &Path, envelope: Option<&Value>) -> (Lane, Option<&'static str>) {
    match envelope.map(|e| take_for_try(lock_root, e)) {
        Some(Err(TakeError::PoolFull(_))) => (Lane::None, Some(POOL_OVER)),
        Some(Ok(lane)) => (lane, None),
        _ => (Lane::None, None),
    }
}

fn take_for_try(lock_root: &Path, envelope: &Value) -> Result<Lane, TakeError> {
    match config_of(envelope) {
        Some(cfg) => take(lock_root, cfg.ceiling, 0),
        None => Ok(Lane::None),
    }
}

/// One seat file of the pool.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Seat {
    /// The seat number.
    pub k: u64,
    /// Whether some process holds it now.
    pub held: bool,
}

/// What the pool looks like right now.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Snapshot {
    /// The pool size asked about.
    pub ceiling: u64,
    /// Held seats, every one counted, including `k >= ceiling` after a lowered ceiling.
    pub live: u64,
    /// Seats of `0..ceiling` that are free.
    pub free: u64,
    /// Every seat file found, by `k`.
    pub seats: Vec<Seat>,
}

fn is_held(resource: &Resource) -> bool {
    match holders(resource) {
        Ok(HoldersList::List(list)) => !list.is_empty(),
        // The platform cannot list holders: a read-only try says the same.
        Ok(HoldersList::Unlistable(_)) | Err(_) => {
            matches!(probe(resource), Ok(Probe::Held))
        }
    }
}

/// Read-only view of the pool: nothing is created or locked for good.
pub fn snapshot(lock_root: &Path, ceiling: u64) -> Snapshot {
    let found: BTreeSet<u64> = std::fs::read_dir(lane_dir(lock_root))
        .into_iter()
        .flatten()
        .flatten()
        .filter_map(|entry| {
            let name = entry.file_name().into_string().ok()?;
            name.strip_suffix(".lock")?.parse().ok()
        })
        .collect();
    let seats: Vec<Seat> = found
        .into_iter()
        .map(|k| Seat {
            k,
            held: is_held(&seat(lock_root, k)),
        })
        .collect();
    let live = seats.iter().filter(|s| s.held).count() as u64;
    let held_inside = seats.iter().filter(|s| s.held && s.k < ceiling).count() as u64;
    Snapshot {
        ceiling,
        live,
        free: ceiling.saturating_sub(held_inside),
        seats,
    }
}
