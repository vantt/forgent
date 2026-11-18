//! The write door. It never returns an error that could change the caller's outcome and never waits longer than
//! its lock bound: every failure is counted in the writer's health and reported as a [`WriteOutcome`].

use super::health::{bump, Delta};
use super::source::RECORDS_STORE;
use crate::record::registry::{load_registry, EmbeddedDeclaration, Registry};
use crate::record::types::Record;
use crate::shard::{append_lines, encode_line, open_regular, shard_path, TornTail};
use crate::store_lock::{acquire_store_lock_within, StoreLockGuard};
use serde::Deserialize;
use std::collections::hash_map::RandomState;
use std::collections::HashSet;
use std::fs::{self, OpenOptions};
use std::hash::{BuildHasher, Hasher};
use std::io::{self, Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Mutex, OnceLock, PoisonError};
use std::time::Duration;

/// How long a write waits for the observe lock before it is dropped and counted.
pub const DEFAULT_LOCK_WAIT: Duration = Duration::from_millis(500);

/// What became of one record. The caller may log it; nothing here is an error to propagate.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WriteOutcome {
    Written,
    /// A record with this id was already stored in this writer's shard; the replay was ignored.
    Duplicate,
    /// The registry or the redaction rule refused it; counted as `rejected`.
    Rejected(String),
    /// Dropped on a failure (registry load, lock, I/O); counted as `errors`.
    Failed(String),
}

impl WriteOutcome {
    fn delta(&self) -> Delta {
        let mut delta = Delta {
            accepted: 1,
            ..Delta::default()
        };
        match self {
            Self::Written => delta.written = 1,
            Self::Duplicate => delta.duplicates = 1,
            Self::Rejected(message) => {
                delta.rejected = 1;
                delta.last_error = Some(message.clone());
            }
            Self::Failed(message) => {
                delta.errors = 1;
                delta.last_error = Some(message.clone());
            }
        }
        delta
    }
}

/// Where and how records are written: the project root, the declaration sources the registry is merged from, and
/// the lock bound.
pub struct RecordDoor {
    root: PathBuf,
    embedded: Vec<EmbeddedDeclaration>,
    payload_root: Option<PathBuf>,
    lock_wait: Duration,
    /// Loaded on the first write that needs it; a failed load is retried on the next write.
    registry: OnceLock<Registry>,
    state: Mutex<DoorState>,
}

#[derive(Default)]
struct DoorState {
    seen: SeenIds,
    /// Counts not yet stored because the observe lock was not held or the health write failed. They are added to
    /// the next write that holds the lock; a process that exits first loses them.
    pending: Delta,
}

/// The ids in this writer's shard and how far into it they were read. Every writer appends only to its own shard,
/// so only the bytes appended since `offset` (by this door or another one on the same shard) are read again.
#[derive(Default)]
struct SeenIds {
    shard: Option<PathBuf>,
    ids: HashSet<String>,
    offset: u64,
}

#[derive(Deserialize)]
struct IdOnly {
    id: String,
}

impl SeenIds {
    /// Reads the complete lines appended to `shard` since the last read. The caller holds the observe lock.
    fn catch_up(&mut self, shard: &Path) -> io::Result<()> {
        if self.shard.as_deref() != Some(shard) {
            *self = Self {
                shard: Some(shard.to_path_buf()),
                ..Self::default()
            };
        }
        let mut file = match open_regular(shard, OpenOptions::new().read(true)) {
            Ok(file) => file,
            Err(e) if e.kind() == io::ErrorKind::NotFound => {
                self.ids.clear();
                self.offset = 0;
                return Ok(());
            }
            Err(e) => return Err(e),
        };
        let len = file.metadata()?.len();
        if len < self.offset {
            // The shard was cut or replaced; what was read no longer describes it.
            self.ids.clear();
            self.offset = 0;
        }
        file.seek(SeekFrom::Start(self.offset))?;
        let mut bytes = Vec::new();
        file.take(len - self.offset).read_to_end(&mut bytes)?;
        // A torn last line stays unread; the next append ends it and it is skipped as not a record.
        let Some(end) = bytes.iter().rposition(|b| *b == b'\n') else {
            return Ok(());
        };
        for line in bytes[..end].split(|b| *b == b'\n') {
            if let Ok(record) = serde_json::from_slice::<IdOnly>(line) {
                self.ids.insert(record.id);
            }
        }
        self.offset += end as u64 + 1;
        Ok(())
    }
}

impl RecordDoor {
    pub fn new(
        root: PathBuf,
        embedded: Vec<EmbeddedDeclaration>,
        payload_root: Option<PathBuf>,
    ) -> Self {
        Self {
            root,
            embedded,
            payload_root,
            lock_wait: DEFAULT_LOCK_WAIT,
            registry: OnceLock::new(),
            state: Mutex::new(DoorState::default()),
        }
    }

    pub fn with_lock_wait(mut self, wait: Duration) -> Self {
        self.lock_wait = wait;
        self
    }

    /// Validates `record` against the merged registry and appends it to this writer's shard. An empty `id` gets a
    /// random one; a given `id` makes the write idempotent within this writer's shard. A `detail` without a
    /// redaction stamp is refused. The counters are stored under the same observe lock as the record.
    pub fn write(&self, record: Record) -> WriteOutcome {
        let checked = self.checked(record);
        let mut state = self.state.lock().unwrap_or_else(PoisonError::into_inner);
        let lock = acquire_store_lock_within(&self.root, self.lock_wait);
        let outcomes = match &lock {
            Ok(_) => self.store(&mut state.seen, vec![checked]),
            Err(e) => vec![match checked {
                Checked::Refused(refused) => refused,
                Checked::Line { .. } => WriteOutcome::Failed(e.to_string()),
            }],
        };
        self.count(&mut state, &outcomes, lock.is_ok());
        drop(lock);
        outcomes.into_iter().next().unwrap_or_else(|| {
            WriteOutcome::Failed("the door stored no outcome for the record".to_owned())
        })
    }

    /// Writes `records` in one append under the observe lock the caller already holds, for a caller that reads and
    /// decides under that same lock (taking it again would wait on itself). Each record gets the same checks and
    /// outcome as [`Self::write`], in order; the counters of the whole batch are stored once.
    pub fn write_all_held(
        &self,
        _held: &StoreLockGuard,
        records: Vec<Record>,
    ) -> Vec<WriteOutcome> {
        let checked = records.into_iter().map(|r| self.checked(r)).collect();
        let mut state = self.state.lock().unwrap_or_else(PoisonError::into_inner);
        let outcomes = self.store(&mut state.seen, checked);
        self.count(&mut state, &outcomes, true);
        outcomes
    }

    /// Whether the door would accept `record`: the registry and the redaction rule, with no write and no count.
    pub fn admits(&self, record: &Record) -> Result<(), String> {
        match self.check(record) {
            Ok(_) => Ok(()),
            Err(WriteOutcome::Rejected(e) | WriteOutcome::Failed(e)) => Err(e),
            Err(other) => Err(format!("{other:?}")),
        }
    }

    fn checked(&self, mut record: Record) -> Checked {
        let deterministic = !record.id.is_empty();
        if !deterministic {
            record.id = new_record_id();
        }
        match self.check(&record) {
            Ok(line) => Checked::Line {
                id: record.id,
                deterministic,
                line,
            },
            Err(refused) => Checked::Refused(refused),
        }
    }

    /// Adds the outcomes to the pending counters and, under the lock, stores them. A counter that cannot be written
    /// must not change the outcome it describes; it stays pending.
    fn count(&self, state: &mut DoorState, outcomes: &[WriteOutcome], locked: bool) {
        for outcome in outcomes {
            state.pending.add(outcome.delta());
        }
        if locked && bump(&self.root, &state.pending).is_ok() {
            state.pending = Delta::default();
        }
    }

    /// Everything decided without the lock: the registry, the redaction rule and the line encoding.
    fn check(&self, record: &Record) -> Result<Vec<u8>, WriteOutcome> {
        let registry = self.registry()?;
        if let Err(e) = registry.validate(record) {
            return Err(WriteOutcome::Rejected(e.to_string()));
        }
        if record.detail.is_some() && record.redaction.is_none() {
            return Err(WriteOutcome::Rejected(
                "detail carries no redaction stamp".to_owned(),
            ));
        }
        encode_line(record).map_err(WriteOutcome::Rejected)
    }

    fn registry(&self) -> Result<&Registry, WriteOutcome> {
        if let Some(registry) = self.registry.get() {
            return Ok(registry);
        }
        let loaded = load_registry(
            &self.embedded,
            self.payload_root.as_deref(),
            Some(&self.root),
        )
        .map_err(|e| WriteOutcome::Failed(format!("registry load failed: {e}")))?;
        Ok(self.registry.get_or_init(|| loaded))
    }

    /// The locked part: the duplicate check against this writer's shard (and the batch itself), then one append.
    fn store(&self, seen: &mut SeenIds, batch: Vec<Checked>) -> Vec<WriteOutcome> {
        let shard = match shard_path(&self.root, RECORDS_STORE) {
            Ok(shard) => shard,
            Err(e) => {
                return batch
                    .into_iter()
                    .map(|c| match c {
                        Checked::Refused(refused) => refused,
                        Checked::Line { .. } => WriteOutcome::Failed(format!("append failed: {e}")),
                    })
                    .collect()
            }
        };
        let caught_up = seen.catch_up(&shard);
        let mut outcomes = Vec::with_capacity(batch.len());
        let mut lines = Vec::new();
        let mut ids = HashSet::new();
        for checked in batch {
            let (id, deterministic, line) = match checked {
                Checked::Refused(refused) => {
                    outcomes.push(refused);
                    continue;
                }
                Checked::Line {
                    id,
                    deterministic,
                    line,
                } => (id, deterministic, line),
            };
            if deterministic {
                match &caught_up {
                    Err(e) => {
                        outcomes.push(WriteOutcome::Failed(format!("duplicate scan failed: {e}")));
                        continue;
                    }
                    Ok(()) if seen.ids.contains(&id) || ids.contains(&id) => {
                        outcomes.push(WriteOutcome::Duplicate);
                        continue;
                    }
                    Ok(()) => {}
                }
            }
            outcomes.push(WriteOutcome::Written);
            lines.push(line);
            ids.insert(id);
        }
        if lines.is_empty() {
            return outcomes;
        }
        if let Err(e) = append_lines(&self.root, RECORDS_STORE, TornTail::Heal, &lines) {
            for outcome in &mut outcomes {
                if *outcome == WriteOutcome::Written {
                    *outcome = WriteOutcome::Failed(format!("append failed: {e}"));
                }
            }
            return outcomes;
        }
        seen.ids.extend(ids);
        // Under the lock nothing else appended, so the shard now ends at this door's own lines.
        if caught_up.is_ok() {
            if let Ok(metadata) = fs::symlink_metadata(&shard) {
                seen.offset = metadata.len();
            }
        }
        outcomes
    }
}

/// A record after the unlocked checks: its line to append, or the refusal.
enum Checked {
    Line {
        id: String,
        deterministic: bool,
        line: Vec<u8>,
    },
    Refused(WriteOutcome),
}

/// A unique id for a record written without one: process-random state, the clock, the pid and a counter. A caller
/// that must name the id it wrote assigns it before the write.
pub fn new_record_id() -> String {
    static COUNTER: AtomicU64 = AtomicU64::new(0);
    let mut hasher = RandomState::new().build_hasher();
    hasher.write_u64(COUNTER.fetch_add(1, Ordering::Relaxed));
    hasher.write_u32(std::process::id());
    hasher.write_u128(
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_or(0, |d| d.as_nanos()),
    );
    let high = hasher.finish();
    hasher.write_u64(high);
    format!("rnd:{high:016x}{:016x}", hasher.finish())
}
