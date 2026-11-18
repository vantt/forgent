//! The screenless adapter's process door: judge a process by the OS process facts, stop it. Nothing starts a
//! screenless process through the port any more, so its handle files are only read here.

use crate::types::Liveness;
use fgos_process::control::{signal_record_group, terminate_with_grace};
use fgos_process::facts::{judge_here, Record, Verdict};
use serde_json::Value;
use std::path::PathBuf;
use std::time::Duration;

/// What the direct adapter needs from the OS, by key.
pub trait Screenless {
    fn liveness(&self, key: &str) -> Liveness;
    /// Ask the process group to end, wait up to `grace_ms`, kill what is left (at once where it cannot be asked,
    /// as on Windows). The answer is what the key's process is judged to be afterwards; `Err` when no signal
    /// could be sent.
    fn end(&self, key: &str, grace_ms: u64) -> Result<Liveness, String>;
    /// Drop what was remembered for the key.
    fn forget(&self, key: &str);
}

/// The real door: the identity of each started process is a JSON file under `dir`, one per key.
pub struct OsDirect {
    dir: PathBuf,
}

enum Handle {
    Missing,
    Unreadable,
    Process(Record),
}

impl OsDirect {
    pub fn new(dir: impl Into<PathBuf>) -> Self {
        OsDirect { dir: dir.into() }
    }

    /// `<state root>/session-host/direct`.
    pub fn in_state_root() -> Self {
        OsDirect::new(
            fgos_holder_lock::state_root()
                .0
                .join("session-host")
                .join("direct"),
        )
    }

    fn handle_path(&self, key: &str) -> PathBuf {
        self.dir.join(format!("{key}.json"))
    }

    fn handle(&self, key: &str) -> Handle {
        let text = match std::fs::read_to_string(self.handle_path(key)) {
            Ok(text) => text,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Handle::Missing,
            Err(_) => return Handle::Unreadable,
        };
        match serde_json::from_str::<Value>(&text) {
            Ok(value) => Handle::Process(Record::from_json(
                value.get("process").unwrap_or(&Value::Null),
            )),
            Err(_) => Handle::Unreadable,
        }
    }
}

impl Screenless for OsDirect {
    fn liveness(&self, key: &str) -> Liveness {
        match self.handle(key) {
            Handle::Missing => Liveness::Gone,
            Handle::Unreadable => Liveness::Unknown,
            Handle::Process(record) => match judge_here(&record) {
                Verdict::Alive => Liveness::Live,
                Verdict::Dead => Liveness::Gone,
                Verdict::Unknown => Liveness::Unknown,
            },
        }
    }

    fn end(&self, key: &str, grace_ms: u64) -> Result<Liveness, String> {
        let record = match self.handle(key) {
            Handle::Missing => return Ok(Liveness::Gone),
            Handle::Unreadable => return Err(format!("the handle of `{key}` is unreadable")),
            Handle::Process(record) => record,
        };
        let grace = Duration::from_millis(grace_ms);
        terminate_with_grace(
            &[record],
            &|record, sig| signal_record_group(record, sig),
            &|list| {
                list.into_iter()
                    .filter(|record| judge_here(record) != Verdict::Dead)
                    .collect()
            },
            grace,
            grace.max(Duration::from_secs(1)),
            Duration::from_millis(50),
        )
        .map_err(|refused| format!("no signal reached `{key}`: {:?}", refused.outcome))?;
        Ok(self.liveness(key))
    }

    fn forget(&self, key: &str) {
        let _ = std::fs::remove_file(self.handle_path(key));
    }
}
