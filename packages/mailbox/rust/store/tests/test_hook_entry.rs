//! The test-only entry `examples/mailbox-test-hook.rs` as a process: one
//! wiring proof per exit path (spec §14 V4 row: exit 0 under malformed
//! stdin, a failed write, a timeout and a panic). The behaviours behind each
//! path are owned by `hook_shell.rs` and `hook_payloads.rs`.
//!
//! The test process is the head: it writes its own Claude Code session file
//! under a temporary `HOME` and starts the entry directly (topology A), or
//! through one shell that does not exec it (topology B, as Claude Code
//! 2.1.308 was measured to run hooks).
#![cfg(unix)]
mod common;

use common::record::{read_state, TempFgos};
use common::{files, fixture, hook_limits};
use fgos_mailbox::hook::Adapter;
use fgos_mailbox_core::{MessageId, MessageState, WriterKey};
use fgos_process::facts::self_identity;
use serde_json::json;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Output, Stdio};
use std::time::{Duration, Instant};

/// The example binary next to this test binary; a plain `cargo test -p
/// fgos-mailbox` builds it.
fn example() -> PathBuf {
    let exe = std::env::current_exe().unwrap();
    let path = exe
        .parent()
        .and_then(Path::parent)
        .unwrap()
        .join("examples/mailbox-test-hook");
    assert!(
        path.is_file(),
        "{} is missing; build it first: `cargo build -p fgos-mailbox --example mailbox-test-hook` (a plain `cargo test -p fgos-mailbox` builds examples)",
        path.display()
    );
    path
}

/// A fresh `.fgos` and a `HOME` whose session file names this process as
/// the head of the recorded payload's session.
struct Setup {
    fgos: TempFgos,
    home: PathBuf,
    writer: WriterKey,
}

impl Setup {
    fn new(tag: &str) -> Self {
        let fgos = TempFgos::new(tag);
        let home = fgos.scratch().join("home");
        let sessions = home.join(".claude/sessions");
        std::fs::create_dir_all(&sessions).unwrap();
        let payload = fixture(Adapter::Claude, files::POST_TOOL_USE);
        let writer = WriterKey::new(payload["session_id"].as_str().unwrap()).unwrap();
        let own = self_identity().unwrap().to_record();
        let pid = std::process::id();
        let session = json!({
            "pid": pid,
            "sessionId": writer.as_str(),
            "procStart": own.start_time.unwrap(),
            "kind": "interactive",
            "entrypoint": "sdk-cli",
            "name": "entry-test-5c",
            "nameSource": "derived"
        });
        std::fs::write(sessions.join(format!("{pid}.json")), session.to_string()).unwrap();
        Self { fgos, home, writer }
    }

    fn log(&self) -> PathBuf {
        self.fgos.scratch().join("hook.log")
    }

    /// The entry's `hook` argv for `topology`.
    fn hook_args(&self, topology: &str, extra: &[&str]) -> Vec<String> {
        let mut args: Vec<String> = [
            "hook",
            "--cli",
            "claude",
            "--event",
            "post-tool-use",
            "--fgos-dir",
        ]
        .iter()
        .map(|s| s.to_string())
        .collect();
        args.push(self.fgos.fgos_dir().display().to_string());
        args.extend(["--project", "forgent", "--topology", topology, "--log"].map(String::from));
        args.push(self.log().display().to_string());
        args.extend(extra.iter().map(|s| s.to_string()));
        args
    }

    /// A command with only the variables the entry reads.
    fn command(&self, program: impl AsRef<std::ffi::OsStr>) -> Command {
        let mut command = Command::new(program);
        command
            .env_clear()
            .env("HOME", &self.home)
            .env("CLAUDE_CODE_SESSION_ID", self.writer.as_str());
        command
    }

    /// Runs the entry directly with `stdin` and `stdout`.
    fn hook(&self, stdin: &[u8], stdout: Stdio, extra: &[&str]) -> Output {
        let mut child = self
            .command(example())
            .args(self.hook_args("direct", extra))
            .stdin(Stdio::piped())
            .stdout(stdout)
            .stderr(Stdio::piped())
            .spawn()
            .unwrap();
        child.stdin.take().unwrap().write_all(stdin).unwrap();
        child.wait_with_output().unwrap()
    }

    fn payload(&self) -> Vec<u8> {
        serde_json::to_vec(&fixture(Adapter::Claude, files::POST_TOOL_USE)).unwrap()
    }

    /// Registers the head with a first call, then sends it one message
    /// through the entry's `send`, from a caller with no session.
    fn pending_message(&self) -> MessageId {
        let first = self.hook(&self.payload(), Stdio::piped(), &[]);
        assert!(first.status.success() && first.stdout.is_empty());
        let state = read_state(&self.fgos.record());
        let name = state
            .binding(&self.writer)
            .unwrap()
            .name
            .as_str()
            .to_string();
        let sent = Command::new(example())
            .env_clear()
            .args(["send", "--fgos-dir"])
            .arg(self.fgos.fgos_dir())
            .args(["--to", &name, "entry test message"])
            .output()
            .unwrap();
        assert!(
            sent.status.success(),
            "{}",
            String::from_utf8_lossy(&sent.stdout)
        );
        let state = read_state(&self.fgos.record());
        let id = state.messages().next().unwrap().id.clone();
        id
    }

    fn state_of(&self, id: &MessageId) -> MessageState {
        read_state(&self.fgos.record())
            .message(id)
            .unwrap()
            .state
            .clone()
    }
}

#[test]
fn the_entry_exits_zero_and_prints_nothing_on_malformed_stdin() {
    let setup = Setup::new("entry-malformed");
    let out = setup.hook(b"{not json", Stdio::piped(), &[]);
    assert!(out.status.success(), "{}", out.status);
    assert!(out.stdout.is_empty() && out.stderr.is_empty());
}

#[test]
fn a_payload_over_the_read_cap_exits_zero_prints_nothing_and_logs_the_skipped_drain() {
    let setup = Setup::new("entry-over-cap");
    let mut stdin = setup.payload();
    stdin.resize(hook_limits().hook.max_read_bytes as usize + 1, b' ');

    let out = setup.hook(&stdin, Stdio::piped(), &[]);

    assert!(out.status.success(), "{}", out.status);
    assert!(out.stdout.is_empty() && out.stderr.is_empty());
    let log = std::fs::read_to_string(setup.log()).unwrap();
    assert!(log.contains("quiet: Some(OverReadCap)"), "{log}");
}

#[test]
fn the_entry_exits_zero_on_a_failed_stdout_write_and_leaves_the_claim_unfinished() {
    let setup = Setup::new("entry-full");
    let id = setup.pending_message();
    let full = std::fs::OpenOptions::new()
        .write(true)
        .open("/dev/full")
        .unwrap();

    let out = setup.hook(&setup.payload(), Stdio::from(full), &[]);

    assert!(out.status.success(), "{}", out.status);
    assert!(matches!(setup.state_of(&id), MessageState::InFlight { .. }));
}

#[test]
fn the_entry_exits_zero_when_stdin_never_closes_and_the_budget_passes() {
    let setup = Setup::new("entry-budget");
    let budget = Duration::from_millis(hook_limits().hook.budget_ms);
    let started = Instant::now();
    let mut child: Child = setup
        .command(example())
        .args(setup.hook_args("direct", &[]))
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();
    // The pipe stays open: the entry's read never ends.
    let _open = child.stdin.take().unwrap();
    let status = loop {
        if let Some(status) = child.try_wait().unwrap() {
            break status;
        }
        assert!(
            started.elapsed() < budget * 2,
            "the entry outlived twice its budget"
        );
        std::thread::sleep(Duration::from_millis(20));
    };
    let elapsed = started.elapsed();

    assert!(status.success(), "{status}");
    assert!(
        elapsed >= budget,
        "exited after {elapsed:?}, before the budget"
    );
    let log = std::fs::read_to_string(setup.log()).unwrap();
    assert!(
        log.contains(" enter cli=claude event=post-tool-use"),
        "{log}"
    );
    assert!(log.contains(" budget-exit"), "{log}");
    assert!(
        !setup.fgos.paths().snapshot().exists(),
        "nothing was claimed or written"
    );
}

#[test]
fn the_entry_exits_zero_and_prints_nothing_after_a_panic_and_leaves_the_claim_unfinished() {
    let setup = Setup::new("entry-panic");
    let id = setup.pending_message();

    let out = setup.hook(
        &setup.payload(),
        Stdio::piped(),
        &["--fault", "panic-in-render"],
    );

    assert!(out.status.success(), "{}", out.status);
    assert!(out.stdout.is_empty() && out.stderr.is_empty());
    assert!(matches!(setup.state_of(&id), MessageState::InFlight { .. }));
}

#[test]
fn the_entry_delivers_through_a_real_process_and_exits_zero() {
    let setup = Setup::new("entry-deliver");
    let id = setup.pending_message();

    let out = setup.hook(&setup.payload(), Stdio::piped(), &[]);

    assert!(out.status.success(), "{}", out.status);
    let reply: serde_json::Value = serde_json::from_slice(&out.stdout).unwrap();
    assert!(reply.is_object());
    assert!(matches!(setup.state_of(&id), MessageState::Offered { .. }));
}

#[test]
fn the_entry_under_one_shell_hop_delivers_and_exits_zero() {
    let setup = Setup::new("entry-hop");
    let id = setup.pending_message();
    let mut child = setup
        .command("/bin/sh")
        // A shell that does not exec its last command, as Claude Code
        // 2.1.308's hook runner was measured.
        .args(["-c", "\"$0\" \"$@\"; :"])
        .arg(example())
        .args(setup.hook_args("one-shell-hop", &[]))
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .unwrap();
    child
        .stdin
        .take()
        .unwrap()
        .write_all(&setup.payload())
        .unwrap();
    let out = child.wait_with_output().unwrap();

    assert!(out.status.success(), "{}", out.status);
    assert!(!out.stdout.is_empty(), "the frame was printed");
    assert!(matches!(setup.state_of(&id), MessageState::Offered { .. }));
}

/// One `hook` argv per kind of usage error, each a change of the valid argv:
/// the flags that do not parse (a repeated flag, a flag with no value), and
/// a missing or unknown value of each flag the entry checks.
#[test]
fn every_kind_of_hook_usage_error_exits_zero_prints_nothing_on_stdout_and_logs_its_cause() {
    let setup = Setup::new("entry-usage");
    let valid = setup.hook_args("direct", &[]);
    let without = |flag: &str| -> Vec<String> {
        let at = valid.iter().position(|a| a == flag).unwrap();
        let mut args = valid.clone();
        args.drain(at..at + 2);
        args
    };
    let with = |flag: &str, value: &str| -> Vec<String> {
        let mut args = valid.clone();
        match args.iter().position(|a| a == flag) {
            Some(at) => args[at + 1] = value.to_string(),
            None => args.extend([flag.to_string(), value.to_string()]),
        }
        args
    };
    let mut repeated = valid.clone();
    repeated.extend(["--cli", "claude"].map(String::from));
    let mut no_value = valid.clone();
    no_value.push("--fault".into());
    // (kind, argv, the cause's words; `true` when it goes to the log, `false`
    // when the flags did not parse and so it goes to stderr)
    let cases: Vec<(&str, Vec<String>, &str, bool)> = vec![
        ("repeated flag", repeated, "--cli given twice", false),
        (
            "flag without a value",
            no_value,
            "--fault needs a value",
            false,
        ),
        ("unknown --cli", with("--cli", "agy"), "--cli must be", true),
        ("missing --cli", without("--cli"), "--cli must be", true),
        (
            "unknown --topology",
            with("--topology", "two-hops"),
            "--topology must be",
            true,
        ),
        (
            "unknown --event",
            with("--event", "pre-tool-use"),
            "--event must be",
            true,
        ),
        (
            "missing --fgos-dir",
            without("--fgos-dir"),
            "--fgos-dir is missing",
            true,
        ),
        (
            "missing --project",
            without("--project"),
            "--project is missing",
            true,
        ),
        (
            "unknown --fault",
            with("--fault", "crash"),
            "--fault must be",
            true,
        ),
    ];
    for (kind, args, cause, logged) in cases {
        let _ = std::fs::remove_file(setup.log());
        let mut child = setup
            .command(example())
            .args(&args)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .unwrap();
        // A usage error exits before it reads stdin, so the pipe may be
        // closed already, as it may be for a CLI.
        let _ = child.stdin.take().unwrap().write_all(&setup.payload());
        let out = child.wait_with_output().unwrap();

        assert!(out.status.success(), "{kind}: {}", out.status);
        assert!(out.stdout.is_empty(), "{kind}: stdout is empty");
        let log = std::fs::read_to_string(setup.log()).unwrap_or_default();
        let stderr = String::from_utf8_lossy(&out.stderr);
        let (told, silent) = if logged {
            (log.as_str(), stderr.as_ref())
        } else {
            (stderr.as_ref(), log.as_str())
        };
        assert!(
            told.contains(&format!("usage-error {cause}")),
            "{kind}: the cause is told: {told:?}"
        );
        assert!(
            !silent.contains("usage-error"),
            "{kind}: told once: {silent:?}"
        );
    }
    assert!(
        !setup.fgos.paths().snapshot().exists(),
        "no usage error opened the record"
    );
}
