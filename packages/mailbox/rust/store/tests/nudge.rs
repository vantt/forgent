//! The Codex nudge against a stand-in `codex` program: the command line the
//! queue gets, the account home read from the head's own process, and the
//! three ways it fails (refused, too slow, head unknown).
use fgos_mailbox::adapters::{NudgeChannel, TestedClis};
use fgos_mailbox::nudge::{Nudge, SystemNudge, NUDGE_LINE};
use fgos_mailbox_core::{Cli, WriterKey};
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

fn program(dir: &std::path::Path, body: &str) -> PathBuf {
    let path = dir.join("codex");
    std::fs::write(&path, format!("#!/bin/sh\n{body}\n")).expect("stand-in program");
    std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o755)).expect("mode");
    path
}

/// A running process with `CODEX_HOME` set, and a record that names it.
fn head(home: &str) -> (Child, Record) {
    let child = Command::new("sleep")
        .arg("30")
        .env("CODEX_HOME", home)
        .stdout(Stdio::null())
        .spawn()
        .expect("sleep starts");
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
fn only_codex_has_a_nudge_channel_and_only_on_the_versions_it_was_measured_on() {
    let tested = TestedClis::embedded();
    assert_eq!(
        tested.nudge_clis(),
        [Cli::new("codex").expect("cli")].into_iter().collect()
    );
    assert_eq!(
        tested.nudge_for("codex", "0.161.0"),
        Some(NudgeChannel::CodexQueue)
    );
    assert_eq!(tested.nudge_for("codex", "9.9.9"), None);
    assert_eq!(tested.nudge_for("claude", "2.1.309"), None);
}
