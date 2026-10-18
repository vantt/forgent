//! The orphan branch of the `terminal` gate: the supervisor is gone while the agent runs.
#![cfg(target_os = "linux")]

mod support;

use std::fs;
use std::os::fd::AsRawFd;
use std::thread::sleep;
use std::time::{Duration, Instant};

use fgos_run_supervisor::go_channel::{read_frame, write_frame};
use serde_json::json;
use support::terminal::*;
use support::*;

const LIMIT: Duration = Duration::from_secs(20);

/// A gate with a running `sleep` agent, the lock handed over, and the supervisor's stream.
fn running(name: &str, settle_ms: u64, ceiling_ms: Option<u64>) -> (Attempt, Pane, std::os::unix::net::UnixStream, std::fs::File) {
    let mut options = Options::new("/bin/sh", &["-c", "sleep 120"]);
    options.grace_ms = 2_000;
    if let Some(ms) = ceiling_ms {
        options.ceiling = Some((boot_id(), boottime_ns() + ms * 1_000_000));
    }
    let (attempt, socket) = terminal_attempt(name, &options, settle_ms, false);
    fs::create_dir_all(&attempt.outbox).unwrap();
    let lock = locked_file(&attempt.dir.join("attempt.lock"));
    let listener = listen(&socket);
    let pane = start_in_pane(&attempt, &socket, true, &[]);
    let mut stream = handshake(&listener, &attempt, &[lock.as_raw_fd()]);
    assert_eq!(read_frame(&mut stream).expect("AGENT")["type"], "AGENT");
    (attempt, pane, stream, lock)
}

#[test]
fn eof_before_the_brief_ends_the_domain_at_once() {
    if bwrap_driver("orphan-before-brief").is_none() {
        return;
    }
    let (attempt, mut pane, stream, _lock) = running("orphan-before-brief", 0, None);
    sleep(Duration::from_millis(200));
    assert!(pane.running(), "the agent runs while the supervisor is there");
    drop(stream);
    assert_eq!(pane.wait_exit(LIMIT), 0, "the whole sandbox ended");
    let exit = attempt.gate_exit().unwrap();
    assert_eq!(exit["stoppedBy"], "orphan");
    assert_eq!(exit["cause"], "abandoned-before-brief");
    assert_eq!(exit["signal"], "SIGTERM");
}

#[test]
fn a_result_after_the_brief_ends_the_domain_after_the_settle_wait() {
    if bwrap_driver("orphan-result").is_none() {
        return;
    }
    let settle = Duration::from_millis(800);
    let (attempt, mut pane, mut stream, _lock) = running("orphan-result", settle.as_millis() as u64, None);
    write_frame(&mut stream, &json!({"type": "BRIEF_DELIVERED"})).unwrap();
    drop(stream);
    sleep(Duration::from_millis(500));
    assert!(pane.running(), "no result yet: the gate waits");
    // A file still being written, and a temp name, are not results.
    write_text(&attempt.outbox.join("result-1.json"), "{\"half");
    write_text(&attempt.outbox.join("result-2.json.tmp.1.ab"), "{}");
    sleep(Duration::from_millis(1_500));
    assert!(pane.running(), "an unfinished result does not count");
    write_text(&attempt.outbox.join("result-1.json"), "{\"ok\":true}");
    let seen = Instant::now();
    assert_eq!(pane.wait_exit(LIMIT), 0);
    assert!(seen.elapsed() >= settle - Duration::from_millis(100), "the settle wait was kept: {:?}", seen.elapsed());
    let exit = attempt.gate_exit().unwrap();
    assert_eq!(exit["stoppedBy"], "orphan");
    assert_eq!(exit["cause"], "orphan-result");
}

#[test]
fn a_supervisor_that_stays_does_not_trigger_the_outbox_watch() {
    if bwrap_driver("orphan-supervisor-present").is_none() {
        return;
    }
    let (attempt, mut pane, mut stream, _lock) = running("orphan-supervisor-present", 0, None);
    write_frame(&mut stream, &json!({"type": "BRIEF_DELIVERED"})).unwrap();
    write_text(&attempt.outbox.join("result-1.json"), "{\"ok\":true}");
    sleep(Duration::from_millis(800));
    assert!(pane.running(), "with the supervisor connected the supervisor decides");
    drop(stream);
    assert_eq!(pane.wait_exit(LIMIT), 0);
    assert_eq!(attempt.gate_exit().unwrap()["cause"], "orphan-result");
}

#[test]
fn without_a_result_the_agent_runs_to_the_hard_ceiling() {
    if bwrap_driver("orphan-ceiling").is_none() {
        return;
    }
    let (attempt, mut pane, mut stream, _lock) = running("orphan-ceiling", 0, Some(3_000));
    write_frame(&mut stream, &json!({"type": "BRIEF_DELIVERED"})).unwrap();
    drop(stream);
    sleep(Duration::from_millis(1_000));
    assert!(pane.running(), "no result, no ceiling yet");
    assert_eq!(pane.wait_exit(LIMIT), 0);
    let exit = attempt.gate_exit().unwrap();
    assert_eq!(exit["stoppedBy"], "hard-ceiling");
}
