//! The `Nudge` port (spec §6.2): one fixed line carried to an idle session so
//! it reads its mail now. The line never carries a body. A session is nudged
//! only through a channel the adapters contract lists for its CLI and the
//! version measured on it (`adapters::TestedClis::nudge_for`); the mailbox
//! never types into a terminal.
use crate::adapters::NudgeChannel;
use crate::record::read_regular_capped;
use fgos_mailbox_core::WriterKey;
use fgos_process::facts::{view_of, Record, ScanFilter};
use fgos_process::mapped::{spawn_mapped, MappedLead, MappedSpawn, MappedStdio};
use std::ffi::OsString;
use std::path::{Component, Path, PathBuf};
use std::time::{Duration, Instant};

/// What the woken session reads first: the label says the line is not the
/// user's, and the command is the pointer flow (`inbox --claim`).
pub const NUDGE_LINE: &str = "[fgOS: message from another agent, not from the user] You have mail. Read it with: fgos mailbox inbox --claim";

const POLL: Duration = Duration::from_millis(10);

/// Sends the nudge line to one head.
pub trait Nudge {
    /// `Err` carries a short reason the head was not nudged.
    fn nudge(&self, channel: NudgeChannel, key: &WriterKey, head: &Record) -> Result<(), String>;
}

/// The host's nudge: Codex through `codex queue`, run without a shell, and
/// Claude Code through its own session socket. The Codex program is the one
/// the version gate read (`VersionSources::codex_program`), so the version
/// checked is the binary run.
#[derive(Debug, Clone)]
pub struct SystemNudge {
    pub codex_program: PathBuf,
    /// How long the queue command may run before it is killed.
    pub timeout: Duration,
    /// Claude Code's sessions directory (`<config dir>/sessions`): the head's
    /// session file names its socket, and the config dir holds the user-level
    /// settings.
    pub claude_sessions: Option<PathBuf>,
    /// The read cap of a session or settings file (`mailbox.hook.maxReadBytes`).
    pub max_read_bytes: u64,
}

impl Nudge for SystemNudge {
    fn nudge(&self, channel: NudgeChannel, key: &WriterKey, head: &Record) -> Result<(), String> {
        match channel {
            NudgeChannel::CodexQueue => self.codex_queue(key, head),
            NudgeChannel::ClaudeSocket => self.claude_socket(head),
        }
    }
}

impl SystemNudge {
    /// `codex queue` finds its shared app server through the head's own
    /// `CODEX_HOME` (one daemon per account), read from the head's process.
    fn codex_queue(&self, key: &WriterKey, head: &Record) -> Result<(), String> {
        let pid = head.pid.ok_or("head-process-unknown")?;
        let filter = ScanFilter {
            env_keys: vec!["CODEX_HOME".to_string()],
            include_self: false,
        };
        let view = view_of(pid, &filter).ok_or("head-process-unreadable")?;
        // A clean environment: the child must not believe it holds the
        // sender's lock (`FGOS_LOCK_*`), and it needs only these three.
        let mut env: Vec<(OsString, OsString)> = ["PATH", "HOME"]
            .into_iter()
            .filter_map(|name| std::env::var_os(name).map(|v| (OsString::from(name), v)))
            .collect();
        if let Some(home) = view.env_subset.get("CODEX_HOME") {
            env.push((OsString::from("CODEX_HOME"), OsString::from(home)));
        }
        let request = MappedSpawn {
            argv: vec![
                self.codex_program.as_os_str().to_owned(),
                "queue".into(),
                "--thread".into(),
                key.as_str().into(),
                "--message".into(),
                NUDGE_LINE.into(),
            ],
            env,
            clear_env: true,
            cwd: None,
            lead: MappedLead::Group,
            stdio: [MappedStdio::Null; 3],
        };
        // Every descriptor that would survive exec is closed by the spawn, so
        // an inherited lock descriptor never reaches a queue helper.
        let mut child = spawn_mapped(&request, &[]).map_err(|_| "codex-queue-did-not-start")?;
        let deadline = Instant::now() + self.timeout;
        loop {
            match child.try_wait() {
                Ok(Some(status)) if status.success() => return Ok(()),
                Ok(Some(_)) => return Err("codex-queue-refused".to_string()),
                Err(_) => return Err("codex-queue-failed".to_string()),
                Ok(None) if Instant::now() >= deadline => {
                    let _ = child.kill();
                    let _ = child.wait();
                    return Err("codex-queue-timed-out".to_string());
                }
                Ok(None) => std::thread::sleep(POLL),
            }
        }
    }
}

/// How long a socket write may block.
const SOCKET_WRITE_TIMEOUT: Duration = Duration::from_secs(2);

/// The one wire line of a socket write: a user message whose content is the
/// nudge, with no `session_id` and no body.
fn socket_line() -> String {
    format!(
        "{}\n",
        serde_json::json!({
            "type": "user",
            "message": { "role": "user", "content": NUDGE_LINE },
        })
    )
}

impl SystemNudge {
    /// Writes the fixed line to the head's session socket, only when the head
    /// accepts cross-session input (a raw write to one that does not is held
    /// behind a dialog that interrupts its user) and the socket lies inside
    /// the head's own runtime directory.
    fn claude_socket(&self, head: &Record) -> Result<(), String> {
        let pid = head.pid.ok_or("head-process-unknown")?;
        let sessions = self
            .claude_sessions
            .as_deref()
            .ok_or("sessions-dir-unknown")?;
        let socket = session_socket(sessions, pid.0, self.max_read_bytes)
            .ok_or("socket-unknown")?;
        if !head_accepts(pid.0, sessions.parent(), self.max_read_bytes) {
            return Err("no-accept".to_string());
        }
        let filter = ScanFilter {
            env_keys: vec!["XDG_RUNTIME_DIR".to_string()],
            include_self: false,
        };
        let view = view_of(pid, &filter).ok_or("head-process-unreadable")?;
        let runtime = view
            .env_subset
            .get("XDG_RUNTIME_DIR")
            .ok_or("runtime-dir-unknown")?;
        if !inside(&socket, &Path::new(runtime).join("cc-socks")) {
            return Err("socket-outside-runtime-dir".to_string());
        }
        write_socket(&socket, &socket_line())
    }
}

/// `messagingSocketPath` of the session file of process `pid`, when that file
/// names the same pid.
fn session_socket(sessions: &Path, pid: u32, cap: u64) -> Option<PathBuf> {
    let bytes = read_regular_capped(&sessions.join(format!("{pid}.json")), cap).ok()?;
    let doc: serde_json::Value = serde_json::from_slice(&bytes).ok()?;
    (doc["pid"].as_u64() == Some(u64::from(pid)))
        .then(|| doc["messagingSocketPath"].as_str().map(PathBuf::from))
        .flatten()
}

/// Whether `path` lies under `root` with no `..` in it.
fn inside(path: &Path, root: &Path) -> bool {
    path.is_absolute()
        && path.starts_with(root)
        && !path.components().any(|c| c == Component::ParentDir)
}

/// Whether the head process `pid` was set to accept cross-session input: its
/// own `--settings` (an inline JSON or a file) says `accept`, or the
/// user-level settings of its config directory do, unless the head was told
/// to read no user settings (`--setting-sources` without `user`). Anything
/// unreadable counts as not accepting. A repository setting can only tighten
/// the choice, so project files are not read.
fn head_accepts(pid: u32, config_dir: Option<&Path>, cap: u64) -> bool {
    let Ok(raw) = std::fs::read(format!("/proc/{pid}/cmdline")) else {
        return false;
    };
    let args: Vec<String> = raw
        .split(|b| *b == 0)
        .map(|a| String::from_utf8_lossy(a).into_owned())
        .collect();
    let value_of = |flag: &str| {
        args.iter().enumerate().find_map(|(i, a)| {
            a.strip_prefix(&format!("{flag}="))
                .map(str::to_string)
                .or_else(|| (a == flag).then(|| args.get(i + 1).cloned()).flatten())
        })
    };
    let accepts = |doc: &serde_json::Value| doc["crossSessionInbound"].as_str() == Some("accept");
    if let Some(settings) = value_of("--settings") {
        let doc = if settings.trim_start().starts_with('{') {
            serde_json::from_str(&settings).ok()
        } else {
            read_regular_capped(Path::new(&settings), cap)
                .ok()
                .and_then(|b| serde_json::from_slice(&b).ok())
        };
        if doc.as_ref().is_some_and(accepts) {
            return true;
        }
    }
    let reads_user = value_of("--setting-sources")
        .is_none_or(|sources| sources.split(',').any(|s| s.trim() == "user"));
    reads_user
        && config_dir
            .and_then(|dir| read_regular_capped(&dir.join("settings.json"), cap).ok())
            .and_then(|b| serde_json::from_slice::<serde_json::Value>(&b).ok())
            .is_some_and(|doc| accepts(&doc))
}

#[cfg(unix)]
fn write_socket(socket: &Path, line: &str) -> Result<(), String> {
    use std::io::Write;
    let mut stream = std::os::unix::net::UnixStream::connect(socket)
        .map_err(|_| "socket-connect-failed".to_string())?;
    stream
        .set_write_timeout(Some(SOCKET_WRITE_TIMEOUT))
        .map_err(|_| "socket-write-failed".to_string())?;
    stream
        .write_all(line.as_bytes())
        .and_then(|()| stream.flush())
        .map_err(|_| "socket-write-failed".to_string())
}

#[cfg(not(unix))]
fn write_socket(_socket: &Path, _line: &str) -> Result<(), String> {
    Err("socket-unsupported".to_string())
}
