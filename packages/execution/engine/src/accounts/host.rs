//! What the lease needs from the machine, behind one port: the clock, this process's identity, whether another
//! recorded process is alive, whether this session is confined, and the host's UTC offset. The state logic never
//! reads the OS itself, so a test drives it with a fixed clock.

use std::path::PathBuf;

use serde_json::{json, Value};

/// Whether a recorded process is still the one that wrote the record.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Liveness {
    Alive,
    Dead,
    Unknown,
}

pub trait Host {
    fn now_ms(&self) -> i64;
    /// The identity tuple of this process as a lease records it: `{host, bootId, pidNs, pid, startTime}`.
    fn self_record(&self) -> Value;
    fn liveness_of(&self, record: &Value) -> Liveness;
    /// Whether this session is a confined worker, which has no accounts layer and may not lease.
    fn confined(&self) -> bool;
    /// Minutes the local clock runs ahead of UTC at `at_ms`; reads a clock-time reset hint such as "6:02 PM".
    fn utc_offset_min(&self, at_ms: i64) -> i64;
    /// The `USER` a manual clear is attributed to.
    fn user(&self) -> Option<String>;
    fn pid(&self) -> u32 {
        std::process::id()
    }
}

/// The real machine.
#[derive(Debug, Clone)]
pub struct SystemHost {
    offset_min: i64,
}

impl SystemHost {
    /// Reads the host's UTC offset once, here, so no later call (some run under the state lock) starts a program.
    pub fn new() -> Self {
        Self {
            offset_min: local_offset_min(),
        }
    }
}

impl Default for SystemHost {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(unix)]
fn local_offset_min() -> i64 {
    // The program sees only the variables that decide its search and its zone.
    let env: Vec<(String, String)> = ["PATH", "TZ"]
        .iter()
        .filter_map(|name| std::env::var(name).ok().map(|v| (name.to_string(), v)))
        .collect();
    let Ok(fgos_process::spawn::Outcome::Exited(output)) = fgos_process::spawn::run_bounded(
        "date",
        ["+%z"],
        &env,
        None,
        None,
        std::time::Duration::from_secs(5),
    ) else {
        return 0;
    };
    let text = String::from_utf8_lossy(&output.stdout);
    let text = text.trim();
    if text.len() != 5 {
        return 0;
    }
    let sign = if text.starts_with('-') { -1 } else { 1 };
    let (hours, minutes) = (
        text[1..3].parse::<i64>().unwrap_or(0),
        text[3..5].parse::<i64>().unwrap_or(0),
    );
    sign * (hours * 60 + minutes)
}

#[cfg(not(unix))]
fn local_offset_min() -> i64 {
    0
}

impl Host for SystemHost {
    fn now_ms(&self) -> i64 {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_or(0, |d| d.as_millis() as i64)
    }

    fn self_record(&self) -> Value {
        match fgos_process::facts::self_identity() {
            Some(t) => json!({
                "host": t.host,
                "bootId": t.boot_id,
                "pidNs": t.pid_ns,
                "pid": t.pid.0,
                "startTime": t.start_time,
            }),
            None => json!({ "pid": std::process::id() }),
        }
    }

    fn liveness_of(&self, record: &Value) -> Liveness {
        match fgos_process::facts::judge_here(&fgos_process::facts::Record::from_json(record)) {
            fgos_process::facts::Verdict::Alive => Liveness::Alive,
            fgos_process::facts::Verdict::Dead => Liveness::Dead,
            _ => Liveness::Unknown,
        }
    }

    fn confined(&self) -> bool {
        fgos_config::session::session_class(|key| std::env::var(key).ok())
            == fgos_config::snapshot::SessionClass::Confined
    }

    fn utc_offset_min(&self, _at_ms: i64) -> i64 {
        self.offset_min
    }

    fn user(&self) -> Option<String> {
        std::env::var("USER").ok().filter(|u| !u.is_empty())
    }
}

/// `<global fgOS directory>/runtime/provider-capacity`, the global directory resolved through the F0 door.
pub fn default_runtime_dir() -> Option<PathBuf> {
    fgos_config::machine::global_dir(|key| std::env::var(key).ok())
        .map(|dir| dir.join("runtime").join("provider-capacity"))
}
