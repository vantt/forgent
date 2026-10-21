//! The `terminal` GO channel, through a real gate in a real bwrap namespace started in a pty the way a
//! pane starts it: connect refusal, EOF before GO, lock descriptions over `SCM_RIGHTS`, the agent's
//! environment and the tty foreground. The test plays the supervisor.
#![cfg(target_os = "linux")]

mod support;

use std::fs;
use std::os::fd::AsRawFd;
use std::path::PathBuf;
use std::time::Duration;

use fgos_run_supervisor::gate::{EXIT_ENVELOPE_INVALID, EXIT_NO_GO};
use fgos_run_supervisor::go_channel::read_frame;
use support::terminal::*;
use support::*;

const LIMIT: Duration = Duration::from_secs(15);

fn marker(name: &str) -> PathBuf {
    let path = std::env::temp_dir().join(format!("fgos-gate-terminal-marker-{name}-{}", std::process::id()));
    let _ = fs::remove_file(&path);
    path
}

fn run_marker(name: &str) -> (Options, PathBuf) {
    let path = marker(name);
    (Options::new("/bin/sh", &["-c", &format!("echo ran > {}", path.display())]), path)
}

#[test]
fn a_socket_that_does_not_exist_ends_the_gate_without_the_agent() {
    if bwrap_driver("no-socket").is_none() {
        return;
    }
    let (options, ran) = run_marker("no-socket");
    let (attempt, socket) = terminal_attempt("no-socket", &options, 0, false);
    let mut pane = start_in_pane(&attempt, &socket, true, &[]);
    assert_eq!(pane.wait_exit(LIMIT), EXIT_NO_GO);
    assert!(!ran.exists());
    assert!(attempt.gate_exit().is_none());
}

#[test]
fn a_supervisor_that_is_already_dead_refuses_the_connection() {
    if bwrap_driver("dead-supervisor").is_none() {
        return;
    }
    let (options, ran) = run_marker("dead-supervisor");
    let (attempt, socket) = terminal_attempt("dead-supervisor", &options, 0, false);
    // The path is still there but nobody listens: ECONNREFUSED.
    drop(listen(&socket));
    let mut pane = start_in_pane(&attempt, &socket, true, &[]);
    assert_eq!(pane.wait_exit(LIMIT), EXIT_NO_GO);
    assert!(!ran.exists());
    assert!(attempt.gate_exit().is_none());
}

#[test]
fn a_supervisor_that_dies_while_the_gate_waits_for_go_ends_it_without_the_agent() {
    if bwrap_driver("eof-before-go").is_none() {
        return;
    }
    let (options, ran) = run_marker("eof-before-go");
    let (attempt, socket) = terminal_attempt("eof-before-go", &options, 0, false);
    let listener = listen(&socket);
    let mut pane = start_in_pane(&attempt, &socket, true, &[]);
    let mut stream = accept(&listener, LIMIT);
    assert_eq!(read_frame(&mut stream).expect("HELLO")["type"], "HELLO");
    drop(stream);
    assert_eq!(pane.wait_exit(LIMIT), EXIT_NO_GO);
    assert!(!ran.exists());
    assert!(attempt.gate_exit().is_none());
}

#[test]
fn the_lock_rides_on_go_and_outlives_the_supervisor_until_the_gate_exits() {
    if bwrap_driver("lock-over-go").is_none() {
        return;
    }
    let mut options = Options::new("/bin/sh", &["-c", "sleep 1"]);
    options.grace_ms = 2_000;
    let (attempt, socket) = terminal_attempt("lock-over-go", &options, 0, false);
    let lock_path = attempt.dir.join("attempt.lock");
    let lock = locked_file(&lock_path);
    assert!(!stranger_can_lock(&lock_path), "held by the supervisor");
    let listener = listen(&socket);
    let mut pane = start_in_pane(&attempt, &socket, true, &[]);
    let mut stream = handshake(&listener, &attempt, &[lock.as_raw_fd()]);
    assert_eq!(read_frame(&mut stream).expect("AGENT")["type"], "AGENT");
    // The supervisor has briefed the agent and goes away for good: its description closes and the connection drops.
    fgos_run_supervisor::go_channel::write_frame(&mut stream, &serde_json::json!({"type": "BRIEF_DELIVERED"})).unwrap();
    drop(lock);
    drop(stream);
    assert!(!stranger_can_lock(&lock_path), "the gate still holds the description while the agent runs");
    assert_eq!(pane.wait_exit(LIMIT), 0);
    assert_eq!(attempt.gate_exit().unwrap()["stoppedBy"], "agent");
    assert!(stranger_can_lock(&lock_path), "free once the gate is gone");
}

#[test]
fn a_go_with_the_wrong_number_of_descriptions_is_refused() {
    if bwrap_driver("wrong-fd-count").is_none() {
        return;
    }
    let (options, ran) = run_marker("wrong-fd-count");
    // Mutating: the envelope expects the attempt lock and the cwd lease; GO carries one.
    let (attempt, socket) = terminal_attempt("wrong-fd-count", &options, 0, true);
    let lock = locked_file(&attempt.dir.join("attempt.lock"));
    let listener = listen(&socket);
    let mut pane = start_in_pane(&attempt, &socket, true, &[]);
    let _stream = handshake(&listener, &attempt, &[lock.as_raw_fd()]);
    assert_eq!(pane.wait_exit(LIMIT), EXIT_ENVELOPE_INVALID);
    assert!(!ran.exists());
}

#[test]
fn a_direct_envelope_on_a_socket_channel_is_refused() {
    if bwrap_driver("mode-mismatch").is_none() {
        return;
    }
    let (options, ran) = run_marker("mode-mismatch");
    let attempt = Attempt::new("mode-mismatch", &options);
    let socket = socket_dir("mode-mismatch").join("go.sock");
    let listener = listen(&socket);
    let mut pane = start_in_pane(&attempt, &socket, true, &[]);
    assert_eq!(pane.wait_exit(LIMIT), EXIT_ENVELOPE_INVALID);
    assert!(!ran.exists());
    drop(listener);
}

#[test]
fn the_agent_sees_the_attempt_identity_and_nothing_of_the_parent_session() {
    if bwrap_driver("env").is_none() {
        return;
    }
    let out = marker("env-out");
    let options = Options::new("/bin/sh", &["-c", &format!("env > {}", out.display())]);
    let (attempt, socket) = terminal_attempt("env", &options, 0, false);
    let lock = locked_file(&attempt.dir.join("attempt.lock"));
    let listener = listen(&socket);
    let mut pane = start_in_pane(&attempt, &socket, true, &[("CLAUDE_CODE_SESSION_ID", "parent-session"), ("FGOS_SESSION_ID", "stale-writer")]);
    let mut stream = handshake(&listener, &attempt, &[lock.as_raw_fd()]);
    assert_eq!(read_frame(&mut stream).expect("AGENT")["type"], "AGENT");
    assert_eq!(pane.wait_exit(LIMIT), 0);
    let env = fs::read_to_string(&out).unwrap();
    assert!(env.lines().any(|l| l == "FGOS_SESSION_ID=att-w-env"), "{env}");
    assert!(env.lines().any(|l| l == "FGOS_PARENT_WRITER_ID=parent-writer"), "{env}");
    assert!(env.lines().any(|l| l.starts_with("FGOS_PIDNS_ANCHOR={")), "{env}");
    assert!(!env.contains("CLAUDE_CODE_SESSION_ID"), "{env}");
    assert!(!env.contains("stale-writer"), "{env}");
}

#[test]
fn the_agent_keeps_the_terminal_and_pane_variables_of_its_own_pane() {
    if bwrap_driver("pane-env").is_none() {
        return;
    }
    let out = marker("pane-env-out");
    let options = Options::new("/bin/sh", &["-c", &format!("env > {}", out.display())]);
    let (attempt, socket) = terminal_attempt("pane-env", &options, 0, false);
    let lock = locked_file(&attempt.dir.join("attempt.lock"));
    let listener = listen(&socket);
    let mut pane = start_in_pane(&attempt, &socket, true, &[("TERM", "xterm-256color"), ("HERDR_PANE_ID", "w1:p9"), ("HERDR_SOCKET_PATH", "/pane/herdr.sock"), ("HOME", "/pane-home")]);
    let mut stream = handshake(&listener, &attempt, &[lock.as_raw_fd()]);
    assert_eq!(read_frame(&mut stream).expect("AGENT")["type"], "AGENT");
    assert_eq!(pane.wait_exit(LIMIT), 0);
    let env = fs::read_to_string(&out).unwrap();
    assert!(env.lines().any(|l| l == "TERM=xterm-256color"), "{env}");
    assert!(env.lines().any(|l| l == "HERDR_PANE_ID=w1:p9"), "{env}");
    assert!(env.lines().any(|l| l == "HERDR_SOCKET_PATH=/pane/herdr.sock"), "{env}");
    assert!(!env.lines().any(|l| l == "HOME=/pane-home"), "only the pane's own variables survive the clear: {env}");
}

#[test]
fn neither_the_agent_nor_its_child_holds_a_lock_description() {
    if bwrap_driver("no-fd-leak").is_none() {
        return;
    }
    let (out_agent, out_child) = (marker("leak-agent"), marker("leak-child"));
    let script = format!("ls -l /proc/self/fd > {}; sh -c 'ls -l /proc/self/fd > {}'", out_agent.display(), out_child.display());
    let options = Options::new("/bin/sh", &["-c", &script]);
    let (attempt, socket) = terminal_attempt("no-fd-leak", &options, 0, true);
    let (lock_path, lease_path) = (attempt.dir.join("attempt.lock"), attempt.dir.join("cwd.lease"));
    let (lock, lease) = (locked_file(&lock_path), locked_file(&lease_path));
    let listener = listen(&socket);
    let mut pane = start_in_pane(&attempt, &socket, true, &[]);
    let mut stream = handshake(&listener, &attempt, &[lock.as_raw_fd(), lease.as_raw_fd()]);
    assert_eq!(read_frame(&mut stream).expect("AGENT")["type"], "AGENT");
    assert_eq!(pane.wait_exit(LIMIT), 0);
    for out in [&out_agent, &out_child] {
        let listing = fs::read_to_string(out).unwrap();
        assert!(!listing.contains("attempt.lock") && !listing.contains("cwd.lease"), "{listing}");
    }
}

#[test]
fn the_agent_group_is_the_foreground_group_of_the_pane_tty() {
    if bwrap_driver("foreground").is_none() {
        return;
    }
    // Fields 5 and 8 of /proc/self/stat: process group and foreground group of the controlling tty.
    let out = marker("foreground-out");
    let options = Options::new("/bin/sh", &["-c", &format!("cut -d' ' -f5,8 /proc/self/stat > {}", out.display())]);
    let (attempt, socket) = terminal_attempt("foreground", &options, 0, false);
    let lock = locked_file(&attempt.dir.join("attempt.lock"));
    let listener = listen(&socket);
    let mut pane = start_in_pane(&attempt, &socket, true, &[]);
    let mut stream = handshake(&listener, &attempt, &[lock.as_raw_fd()]);
    assert_eq!(read_frame(&mut stream).expect("AGENT")["type"], "AGENT");
    assert_eq!(pane.wait_exit(LIMIT), 0);
    let text = fs::read_to_string(&out).unwrap();
    let fields: Vec<&str> = text.split_whitespace().collect();
    assert_eq!(fields.len(), 2, "{text}");
    assert_eq!(fields[0], fields[1], "pgrp {} must be the tty's foreground group {}", fields[0], fields[1]);
    assert_ne!(fields[1], "0");
}

#[test]
fn input_the_agent_never_read_is_dropped_before_the_pane_shell_reads_the_tty_again() {
    if bwrap_driver("unread-input").is_none() {
        return;
    }
    let ran = marker("unread-input");
    // An agent that never reads its tty, as a CLI stuck before its input loop.
    let options = Options::new("/bin/sh", &["-c", "sleep 1"]);
    let (attempt, socket) = terminal_attempt("unread-input", &options, 0, false);
    let lock = locked_file(&attempt.dir.join("attempt.lock"));
    let listener = listen(&socket);
    let mut pane = start_in_pane(&attempt, &socket, true, &[]);
    // The pane's shell keeps the tty open while the sandbox runs, so what is queued on it outlives the sandbox.
    let tty = pane.open_tty();
    let mut stream = handshake(&listener, &attempt, &[lock.as_raw_fd()]);
    assert_eq!(read_frame(&mut stream).expect("AGENT")["type"], "AGENT");
    pane.type_text(&format!("echo `touch {}`\n", ran.display()));
    assert_eq!(pane.wait_exit(LIMIT), 0);

    // The pane's shell takes the tty back and reads whatever is still queued on it.
    let mut shell = std::process::Command::new("/bin/sh").stdin(tty).stdout(std::process::Stdio::null()).stderr(std::process::Stdio::null()).spawn().unwrap();
    std::thread::sleep(Duration::from_millis(800));
    let _ = shell.kill();
    let _ = shell.wait();
    assert!(!ran.exists(), "text typed for the agent ran in the pane's shell");
}

#[test]
fn a_pane_without_a_controlling_tty_does_not_start_the_agent() {
    if bwrap_driver("no-tty").is_none() {
        return;
    }
    let (options, ran) = run_marker("no-tty");
    let (attempt, socket) = terminal_attempt("no-tty", &options, 0, false);
    let lock = locked_file(&attempt.dir.join("attempt.lock"));
    let listener = listen(&socket);
    let mut pane = start_in_pane(&attempt, &socket, false, &[]);
    let mut stream = handshake(&listener, &attempt, &[lock.as_raw_fd()]);
    assert_eq!(pane.wait_exit(LIMIT), 0);
    assert!(!ran.exists(), "no foreground, no agent");
    assert!(read_frame(&mut stream).is_err(), "no AGENT frame");
    assert_eq!(attempt.gate_exit().unwrap()["exitCode"], 126);
}

/// Exercise the production gate, not just the containment fixture: with
/// --as-pid-1 the gate owns its parent-death signal after bwrap's exec.
#[test]
fn killing_the_terminal_monitor_ends_the_gate_and_its_agent() {
    if bwrap_driver("monitor-death").is_none() { return; }
    let beat = marker("monitor-death");
    let script = format!("trap '' HUP; while :; do echo beat >> {}; sleep 0.02; done", beat.display());
    let options = Options::new("/bin/sh", &["-c", &script]);
    let (attempt, socket) = terminal_attempt("monitor-death", &options, 60_000, false);
    let lock = locked_file(&attempt.dir.join("attempt.lock"));
    let listener = listen(&socket);
    let mut pane = start_in_pane(&attempt, &socket, true, &[]);
    let mut stream = handshake(&listener, &attempt, &[lock.as_raw_fd()]);
    struct Cleanup(fgos_process::facts::ProcTuple);
    impl Drop for Cleanup {
        fn drop(&mut self) {
            let _ = fgos_process::control::signal_by_identity(&self.0, fgos_process::control::Signal::Kill);
        }
    }
    // The accepted socket's peer is the gate, expressed in our PID namespace.
    let mut cred: libc::ucred = unsafe { std::mem::zeroed() };
    let mut len = std::mem::size_of_val(&cred) as libc::socklen_t;
    // SAFETY: getsockopt writes a ucred into the correctly sized live buffer.
    assert_eq!(unsafe { libc::getsockopt(stream.as_raw_fd(), libc::SOL_SOCKET,
        libc::SO_PEERCRED, (&mut cred as *mut libc::ucred).cast(), &mut len) }, 0);
    let _cleanup = Cleanup(fgos_process::facts::identity_of(fgos_process::ProcId(cred.pid as u32)).unwrap());
    assert_eq!(read_frame(&mut stream).expect("AGENT")["type"], "AGENT");
    support::supervisor::wait_until(LIMIT, "heartbeat", || fs::read(&beat).is_ok_and(|b| !b.is_empty()));
    pane.child.kill().unwrap();
    pane.child.wait().unwrap();
    std::thread::sleep(Duration::from_millis(300));
    assert_eq!(fgos_process::facts::judge_here(&_cleanup.0.to_record()),
        fgos_process::facts::Verdict::Dead, "the namespace init must be dead");
    let settled = fs::read(&beat).unwrap();
    std::thread::sleep(Duration::from_millis(300));
    assert_eq!(fs::read(&beat).unwrap(), settled, "namespace survived its monitor");
}
