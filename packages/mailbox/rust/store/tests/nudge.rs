//! The Codex nudge against a stand-in `codex` program: the command line the
//! queue gets, the account home read from the head's own process, and the
//! three ways it fails (refused, too slow, head unknown).
use fgos_mailbox::adapters::{NudgeChannel, TestedClis};
use fgos_mailbox::nudge::{Nudge, SystemNudge, NUDGE_LINE};
use fgos_mailbox_core::{Cli, NudgeReport, RemoteWake, WriterKey};
use fgos_process::facts::Record;
use fgos_process::ProcId;
use std::os::unix::fs::PermissionsExt;
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::time::Duration;

fn scratch(tag: &str) -> PathBuf {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let dir = std::env::temp_dir().join(format!("fgos-nudge-{tag}-{}-{nanos}", std::process::id()));
    std::fs::create_dir_all(&dir).expect("scratch directory");
    dir
}

/// A process started while another thread holds a stand-in program open for
/// writing would carry that descriptor into its exec, and the program could
/// not then be run (text file busy): every write of a program and every start
/// of a process takes this lock.
static SPAWN: std::sync::Mutex<()> = std::sync::Mutex::new(());

fn spawn_locked(command: &mut Command) -> Child {
    let _held = SPAWN.lock().unwrap_or_else(|e| e.into_inner());
    command.spawn().expect("process starts")
}

fn program(dir: &std::path::Path, body: &str) -> PathBuf {
    let _held = SPAWN.lock().unwrap_or_else(|e| e.into_inner());
    let path = dir.join("codex");
    std::fs::write(&path, format!("#!/bin/sh\n{body}\n")).expect("stand-in program");
    std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o755)).expect("mode");
    path
}

/// A running process with `CODEX_HOME` set, and a record that names it.
fn head(home: &str) -> (Child, Record) {
    let child = spawn_locked(
        Command::new("sleep")
            .arg("30")
            .env("CODEX_HOME", home)
            .stdout(Stdio::null()),
    );
    let record = Record {
        pid: Some(ProcId(child.id())),
        ..Record::default()
    };
    (child, record)
}

fn nudge(program: PathBuf, timeout_ms: u64) -> SystemNudge {
    SystemNudge {
        codex_program: program,
        timeout: Duration::from_millis(timeout_ms),
        claude_sessions: None,
        max_read_bytes: 65536,
    }
}

fn key() -> WriterKey {
    WriterKey::new("019a-thread").expect("a writer key")
}

#[test]
fn a_codex_head_is_queued_the_fixed_line_through_its_own_account_home() {
    let dir = scratch("sent");
    let out = dir.join("seen");
    let codex = program(
        &dir,
        &format!(
            "printf '%s\\n' \"$@\" > '{0}'; printf '%s' \"$CODEX_HOME\" > '{0}.home'",
            out.display()
        ),
    );
    let (mut child, record) = head("/accounts/one");

    let result = nudge(codex, 5000).nudge(NudgeChannel::CodexQueue, &key(), &record);
    let _ = child.kill();
    let _ = child.wait();

    assert_eq!(result, Ok(()));
    let args = std::fs::read_to_string(&out).expect("the program ran");
    assert_eq!(
        args.lines().collect::<Vec<_>>(),
        ["queue", "--thread", "019a-thread", "--message", NUDGE_LINE]
    );
    assert_eq!(
        std::fs::read_to_string(dir.join("seen.home")).expect("home file"),
        "/accounts/one"
    );
    let _ = std::fs::remove_dir_all(dir);
}

#[test]
fn a_refused_a_too_slow_and_an_unknown_head_are_each_named() {
    let dir = scratch("fail");
    let refusing = program(&dir, "exit 1");
    let (mut child, record) = head("/accounts/one");
    assert_eq!(
        nudge(refusing, 5000).nudge(NudgeChannel::CodexQueue, &key(), &record),
        Err("codex-queue-refused".to_string())
    );

    let slow = dir.join("slow");
    std::fs::create_dir_all(&slow).expect("dir");
    let sleeping = program(&slow, "sleep 20");
    assert_eq!(
        nudge(sleeping, 100).nudge(NudgeChannel::CodexQueue, &key(), &record),
        Err("codex-queue-timed-out".to_string())
    );
    let _ = child.kill();
    let _ = child.wait();

    let unknown = Record::default();
    assert_eq!(
        nudge(dir.join("codex"), 5000).nudge(NudgeChannel::CodexQueue, &key(), &unknown),
        Err("head-process-unknown".to_string())
    );
    let _ = std::fs::remove_dir_all(dir);
}

#[cfg(target_os = "linux")]
#[test]
fn only_codex_and_claude_have_a_nudge_channel_and_only_on_the_versions_they_were_measured_on() {
    let tested = TestedClis::embedded();
    assert_eq!(
        tested.nudge_for("claude", "2.1.309"),
        Some(NudgeChannel::ClaudeSocket)
    );
    assert_eq!(
        tested.nudge_for("claude", "2.1.310"),
        Some(NudgeChannel::ClaudeSocket)
    );
    assert_eq!(tested.nudge_for("claude", "2.1.311"), None);
    assert_eq!(
        tested.nudge_clis(),
        [Cli::new("claude").expect("cli"), Cli::new("codex").expect("cli")].into_iter().collect()
    );
    assert_eq!(
        tested.nudge_for("codex", "0.161.0"),
        Some(NudgeChannel::CodexQueue)
    );
    assert_eq!(
        tested.nudge_for("codex", "0.162.1"),
        Some(NudgeChannel::CodexQueue)
    );
    assert_eq!(
        tested.nudge_for("codex", "0.166.0"),
        Some(NudgeChannel::CodexQueue)
    );
    assert_eq!(tested.nudge_for("codex", "9.9.9"), None);
}

/// Counts what it is asked to send; never sends.
#[derive(Default)]
struct Counting(std::cell::RefCell<Vec<(NudgeChannel, String)>>);

impl Nudge for Counting {
    fn nudge(&self, channel: NudgeChannel, key: &WriterKey, _head: &Record) -> Result<(), String> {
        self.0.borrow_mut().push((channel, key.as_str().to_string()));
        Ok(())
    }
}

fn remote_wake(effective: bool, to_nudge: bool, outstanding: bool) -> RemoteWake {
    RemoteWake {
        effective,
        dropped: None,
        to_key: key(),
        to_cli: Cli::new("codex").expect("cli"),
        to_head: String::new(),
        to_nudge,
        outstanding,
    }
}

#[test]
fn a_wake_taken_from_another_machine_is_nudged_through_the_same_gates_as_a_send_here() {
    let dir = scratch("remote");
    let versions = |program: PathBuf| fgos_mailbox::adapters::version::VersionSources {
        claude_sessions: None,
        codex_program: program,
        max_read_bytes: 65536,
    };
    let tested = versions(program(&dir, "echo 'codex-cli 0.162.1'"));
    let stub = Counting::default();

    // No wake that took effect, or a recipient with no channel: nothing is asked of anyone.
    assert_eq!(fgos_mailbox::verbs::nudge_remote(&remote_wake(false, true, false), &tested, &stub), None);
    assert_eq!(fgos_mailbox::verbs::nudge_remote(&remote_wake(true, false, false), &tested, &stub), None);
    // An earlier wake is still unread: it is not repeated.
    assert_eq!(fgos_mailbox::verbs::nudge_remote(&remote_wake(true, true, true), &tested, &stub), Some(NudgeReport::Pending));
    assert!(stub.0.borrow().is_empty());

    // A version no contract lists, or one that cannot be read, is refused by name.
    let untested = versions(program(&scratch("remote-untested"), "echo 'codex-cli 9.9.9'"));
    assert_eq!(
        fgos_mailbox::verbs::nudge_remote(&remote_wake(true, true, false), &untested, &stub),
        Some(NudgeReport::Refused("version-not-tested".into()))
    );
    let missing = versions(dir.join("no-such-codex"));
    assert_eq!(
        fgos_mailbox::verbs::nudge_remote(&remote_wake(true, true, false), &missing, &stub),
        Some(NudgeReport::Refused("version-unreadable".into()))
    );
    assert!(stub.0.borrow().is_empty());

    // On a tested version the head's channel is asked once, for the head's own key.
    assert_eq!(
        fgos_mailbox::verbs::nudge_remote(&remote_wake(true, true, false), &tested, &stub),
        Some(NudgeReport::Sent)
    );
    assert_eq!(*stub.0.borrow(), vec![(NudgeChannel::CodexQueue, "019a-thread".to_string())]);
}

/// A Claude Code stand-in: a shell holding the given command-line words and a
/// runtime directory, a sessions directory with its session file naming a
/// socket, and a unix listener at that socket.
struct ClaudeHead {
    dir: PathBuf,
    child: Child,
    record: Record,
    listener: std::os::unix::net::UnixListener,
}

fn claude_head(tag: &str, words: &[&str], socket_in_runtime: bool) -> ClaudeHead {
    let dir = scratch(tag);
    let runtime = dir.join("run");
    let socks = runtime.join("cc-socks");
    std::fs::create_dir_all(&socks).expect("runtime dir");
    std::fs::create_dir_all(dir.join("sessions")).expect("sessions dir");
    let socket = if socket_in_runtime { socks.join("a.sock") } else { dir.join("outside.sock") };
    let listener = std::os::unix::net::UnixListener::bind(&socket).expect("socket");
    let child = spawn_locked(
        Command::new("sh")
            .args(["-c", "while :; do sleep 1; done", "claude"])
            .args(words)
            .env("XDG_RUNTIME_DIR", &runtime)
            .stdout(Stdio::null()),
    );
    std::fs::write(
        dir.join("sessions").join(format!("{}.json", child.id())),
        format!(r#"{{"pid":{},"version":"2.1.310","messagingSocketPath":"{}"}}"#, child.id(), socket.display()),
    )
    .expect("session file");
    let record = Record { pid: Some(ProcId(child.id())), ..Record::default() };
    ClaudeHead { dir, child, record, listener }
}

fn claude_nudge(dir: &std::path::Path) -> SystemNudge {
    SystemNudge {
        claude_sessions: Some(dir.join("sessions")),
        ..nudge(dir.join("codex"), 1000)
    }
}

fn line_read(listener: &std::os::unix::net::UnixListener) -> Option<String> {
    use std::io::Read;
    listener.set_nonblocking(true).ok()?;
    let (mut stream, _) = listener.accept().ok()?;
    stream.set_nonblocking(false).ok()?;
    stream.set_read_timeout(Some(Duration::from_secs(2))).ok()?;
    let mut text = String::new();
    stream.read_to_string(&mut text).ok()?;
    Some(text)
}

#[test]
fn a_claude_head_started_with_the_accept_is_written_one_user_line_holding_only_the_fixed_nudge() {
    let mut head = claude_head("sock-sent", &["--settings", r#"{"crossSessionInbound":"accept"}"#], true);
    let result = claude_nudge(&head.dir).nudge(NudgeChannel::ClaudeSocket, &key(), &head.record);
    let seen = line_read(&head.listener);
    let _ = head.child.kill();
    let _ = head.child.wait();

    assert_eq!(result, Ok(()));
    let doc: serde_json::Value = serde_json::from_str(seen.expect("a line arrived").trim()).expect("json");
    assert_eq!(doc, serde_json::json!({"type": "user", "message": {"role": "user", "content": NUDGE_LINE}}));
    let _ = std::fs::remove_dir_all(head.dir);
}

#[test]
fn a_claude_head_is_written_when_the_accept_is_in_its_user_settings_unless_it_reads_no_user_settings() {
    let mut head = claude_head("sock-user", &[], true);
    std::fs::write(head.dir.join("settings.json"), r#"{"crossSessionInbound":"accept"}"#).expect("user settings");
    let nudger = claude_nudge(&head.dir);
    assert_eq!(nudger.nudge(NudgeChannel::ClaudeSocket, &key(), &head.record), Ok(()));
    assert!(line_read(&head.listener).is_some());
    let _ = head.child.kill();
    let _ = head.child.wait();

    let mut project_only = claude_head("sock-project-only", &["--setting-sources", "project"], true);
    std::fs::write(project_only.dir.join("settings.json"), r#"{"crossSessionInbound":"accept"}"#).expect("user settings");
    assert_eq!(
        claude_nudge(&project_only.dir).nudge(NudgeChannel::ClaudeSocket, &key(), &project_only.record),
        Err("no-accept".to_string())
    );
    assert!(line_read(&project_only.listener).is_none());
    let _ = project_only.child.kill();
    let _ = project_only.child.wait();
    let _ = std::fs::remove_dir_all(head.dir);
    let _ = std::fs::remove_dir_all(project_only.dir);
}

#[test]
fn a_claude_head_without_the_accept_gets_no_write_and_a_socket_outside_its_runtime_dir_is_refused() {
    let mut plain = claude_head("sock-plain", &[], true);
    assert_eq!(
        claude_nudge(&plain.dir).nudge(NudgeChannel::ClaudeSocket, &key(), &plain.record),
        Err("no-accept".to_string())
    );
    assert!(line_read(&plain.listener).is_none(), "nothing was written");
    let _ = plain.child.kill();
    let _ = plain.child.wait();

    let mut outside = claude_head("sock-outside", &["--settings", r#"{"crossSessionInbound":"accept"}"#], false);
    assert_eq!(
        claude_nudge(&outside.dir).nudge(NudgeChannel::ClaudeSocket, &key(), &outside.record),
        Err("socket-outside-runtime-dir".to_string())
    );
    assert!(line_read(&outside.listener).is_none());
    let _ = outside.child.kill();
    let _ = outside.child.wait();

    let unknown = Record::default();
    assert_eq!(
        claude_nudge(&plain.dir).nudge(NudgeChannel::ClaudeSocket, &key(), &unknown),
        Err("head-process-unknown".to_string())
    );
    let _ = std::fs::remove_dir_all(plain.dir);
    let _ = std::fs::remove_dir_all(outside.dir);
}
