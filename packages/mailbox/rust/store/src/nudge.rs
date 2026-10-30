//! The `Nudge` port (spec §6.2): one fixed line carried to an idle session so
//! it reads its mail now. The line never carries a body. A session is nudged
//! only through a channel the adapters contract lists for its CLI and the
//! version measured on it (`adapters::TestedClis::nudge_for`); the mailbox
//! never types into a terminal.
use crate::adapters::NudgeChannel;
use fgos_mailbox_core::WriterKey;
use fgos_process::facts::{view_of, Record, ScanFilter};
use fgos_process::mapped::{spawn_mapped, MappedLead, MappedSpawn, MappedStdio};
use std::ffi::OsString;
use std::path::PathBuf;
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

/// The host's nudge: Codex through `codex queue`, run without a shell. The
/// program is the one the version gate read (`VersionSources::codex_program`),
/// so the version checked is the binary run.
#[derive(Debug, Clone)]
pub struct SystemNudge {
    pub codex_program: PathBuf,
    /// How long the queue command may run before it is killed.
    pub timeout: Duration,
}

impl Nudge for SystemNudge {
    fn nudge(&self, channel: NudgeChannel, key: &WriterKey, head: &Record) -> Result<(), String> {
        match channel {
            NudgeChannel::CodexQueue => self.codex_queue(key, head),
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
