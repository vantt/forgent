//! The screenless adapter's process door: start a prepared, already-contained command without a
//! screen, judge it by the OS process facts, stop it. Containment is never built here.

use crate::types::{Liveness, StartRequest};
use fgos_process::control::{signal_record_group, terminate_with_grace};
use fgos_process::facts::{identity_of_child, judge_here, Record, Verdict};
use fgos_process::spawn::resolve_program;
use fgos_process::ProcId;
use serde_json::{json, Value};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::Duration;

/// What the direct adapter needs from the OS, by key.
pub trait Screenless {
    /// Start the prepared command and remember which process it is.
    fn spawn(&self, request: &StartRequest) -> Result<(), String>;
    fn liveness(&self, key: &str) -> Liveness;
    /// Ask the process group to end, wait up to `grace_ms`, kill what is left (at once where it cannot be asked,
    /// as on Windows). The answer is what the key's process is judged to be afterwards; `Err` when no signal
    /// could be sent.
    fn end(&self, key: &str, grace_ms: u64) -> Result<Liveness, String>;
    /// Drop what was remembered for the key.
    fn forget(&self, key: &str);
    /// Where the opening text of a `file` delivery is written; the caller passes the path as an argument.
    fn opening_file(&self, key: &str, text: &str) -> Result<PathBuf, String>;
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

/// Replace `name` in `dir` durably, owner-readable only.
fn write_private(dir: &Path, name: &str, bytes: &[u8]) -> Result<(), String> {
    fgos_durable_file::replace_durably_with_mode(dir, name, bytes, 0o600)
        .map(|_| ())
        .map_err(|e| e.to_string())
}

impl Screenless for OsDirect {
    fn spawn(&self, request: &StartRequest) -> Result<(), String> {
        std::fs::create_dir_all(&self.dir).map_err(|e| format!("{}: {e}", self.dir.display()))?;
        let program = resolve_program(
            &request.command,
            &std::env::var("PATH").unwrap_or_default(),
            &std::env::var("PATHEXT").unwrap_or_default(),
            cfg!(windows),
        )
        .ok_or_else(|| {
            format!(
                "cannot start {}: no such program on the path",
                request.command
            )
        })?;
        let mut command = Command::new(program);
        command
            .args(&request.args)
            .envs(&request.env)
            .current_dir(&request.cwd)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null());
        #[cfg(unix)]
        {
            use std::os::unix::process::CommandExt;
            command.process_group(0);
        }
        let child = command
            .spawn()
            .map_err(|e| format!("cannot start {}: {e}", request.command))?;
        let tuple = identity_of_child(ProcId(child.id()))
            .ok_or_else(|| format!("the identity of pid {} could not be read", child.id()))?;
        let body = json!({ "key": request.key, "process": tuple.to_record().to_json() });
        write_private(
            &self.dir,
            &format!("{}.json", request.key),
            body.to_string().as_bytes(),
        )
        .map_err(|e| format!("cannot record the handle of `{}`: {e}", request.key))?;
        // The child is not waited for: it outlives this call and is judged by identity afterwards.
        drop(child);
        Ok(())
    }

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
        let _ = std::fs::remove_file(self.dir.join(format!("{key}.opening.txt")));
    }

    fn opening_file(&self, key: &str, text: &str) -> Result<PathBuf, String> {
        std::fs::create_dir_all(&self.dir).map_err(|e| format!("{}: {e}", self.dir.display()))?;
        let name = format!("{key}.opening.txt");
        write_private(&self.dir, &name, text.as_bytes())
            .map_err(|e| format!("{}: {e}", self.dir.join(&name).display()))?;
        Ok(self.dir.join(name))
    }
}
