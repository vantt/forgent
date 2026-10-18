//! The step runner on its own: ordering, receipts, retry, timeout, and the
//! rule that a step never receives a lock description.
#![cfg(unix)]

mod support;

use std::fs;
#[cfg(target_os = "linux")]
use std::os::fd::AsRawFd;
use std::path::Path;
use std::time::{Duration, Instant};

use fgos_run_supervisor::steps::{run_steps, StepsOutcome};
use serde_json::{json, Value};
use support::supervisor::shell_step;

fn attempt(name: &str, steps: Vec<Value>) -> (std::path::PathBuf, Value) {
    let dir = std::env::temp_dir().join(format!("fgos-steps-{name}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    (dir, json!({"attemptId": format!("att-{name}"), "steps": steps}))
}

fn has_receipt(dir: &Path, id: &str) -> bool {
    dir.join("steps").join(format!("{id}.json")).exists()
}

fn alive(pid: u32) -> bool {
    fs::read_to_string(format!("/proc/{pid}/stat")).ok().and_then(|s| s.rfind(')').and_then(|i| s[i + 1..].trim_start().chars().next())).is_some_and(|c| c != 'Z' && c != 'X')
}

#[test]
fn steps_run_in_order_and_a_step_with_a_receipt_is_skipped() {
    let (dir, mut envelope) = attempt("order", Vec::new());
    envelope["steps"] = json!([
        shell_step(&dir, "settle-attempt", &format!("echo settle >> {0}/order", dir.display()), 10_000),
        shell_step(&dir, "finalize-home", &format!("echo finalize >> {0}/order", dir.display()), 10_000),
        shell_step(&dir, "release-slot", &format!("echo release >> {0}/order", dir.display()), 10_000),
    ]);
    fs::create_dir_all(dir.join("steps")).unwrap();
    fs::write(dir.join("steps/finalize-home.json"), "{}").unwrap();
    let outcome = run_steps(&envelope, &dir);
    assert_eq!(outcome, StepsOutcome::Done(vec!["settle-attempt".into(), "finalize-home".into(), "release-slot".into()]));
    assert_eq!(fs::read_to_string(dir.join("order")).unwrap(), "settle\nrelease\n", "the step with a receipt did not run again");
    let receipt: Value = serde_json::from_str(&fs::read_to_string(dir.join("steps/settle-attempt.json")).unwrap()).unwrap();
    assert_eq!(receipt["attemptId"], "att-order");
    assert_eq!(receipt["status"], "done");
}

#[test]
fn a_step_answering_75_leaves_no_receipt_and_stops_the_chain() {
    let (dir, mut envelope) = attempt("retry", Vec::new());
    envelope["steps"] = json!([
        shell_step(&dir, "settle-attempt", "echo '{\"result\":\"retry\",\"reason\":\"credential-home-kept\"}'; exit 75", 10_000),
        shell_step(&dir, "finalize-home", &format!("touch {}/second-ran", dir.display()), 10_000),
    ]);
    let outcome = run_steps(&envelope, &dir);
    assert_eq!(outcome, StepsOutcome::Retry { step_id: "settle-attempt".into(), reason: "credential-home-kept".into() });
    assert!(!has_receipt(&dir, "settle-attempt"));
    assert!(!dir.join("second-ran").exists(), "the chain stopped");
}

#[test]
fn a_failing_step_stops_the_chain_without_a_receipt() {
    let (dir, mut envelope) = attempt("fail", Vec::new());
    envelope["steps"] = json!([shell_step(&dir, "settle-attempt", "exit 3", 10_000), shell_step(&dir, "finalize-home", "true", 10_000)]);
    let outcome = run_steps(&envelope, &dir);
    assert_eq!(outcome.pending(), Some("settle-attempt"));
    assert!(matches!(outcome, StepsOutcome::Failed { .. }));
    assert!(!has_receipt(&dir, "settle-attempt") && !has_receipt(&dir, "finalize-home"));
}

#[test]
fn a_step_past_its_timeout_is_killed_with_its_descendants_and_leaves_no_receipt() {
    let (dir, mut envelope) = attempt("hang", Vec::new());
    envelope["steps"] = json!([shell_step(&dir, "settle-attempt", &format!("echo $$ > {0}/step.pid; sleep 60 & echo $! > {0}/child.pid; wait", dir.display()), 600)]);
    let started = Instant::now();
    let outcome = run_steps(&envelope, &dir);
    assert!(started.elapsed() < Duration::from_secs(20));
    assert!(matches!(outcome, StepsOutcome::Failed { ref reason, .. } if reason.contains("stepTimeoutMs")), "{outcome:?}");
    assert!(!has_receipt(&dir, "settle-attempt"));
    // SIGKILL reaches the whole group before run_steps returns; the kernel
    // finishes tearing a process down a moment later, so wait for that, bounded.
    for name in ["step.pid", "child.pid"] {
        let pid: u32 = fs::read_to_string(dir.join(name)).unwrap().trim().parse().unwrap();
        let deadline = Instant::now() + Duration::from_secs(5);
        while alive(pid) && Instant::now() < deadline {
            std::thread::sleep(Duration::from_millis(10));
        }
        assert!(!alive(pid), "{name} must be dead");
    }
}

// Lists /proc/<pid>/fd, which only Linux has.
#[cfg(target_os = "linux")]
#[test]
fn a_step_holds_no_lock_description() {
    let (dir, mut envelope) = attempt("fds", Vec::new());
    // A lock file open without close-on-exec in the runner: only the empty
    // descriptor map keeps it out of the step.
    let lock_path = dir.join("attempt.lock");
    let lock = fs::File::create(&lock_path).unwrap();
    // SAFETY: fcntl on a descriptor this test owns.
    unsafe {
        let flags = libc::fcntl(lock.as_raw_fd(), libc::F_GETFD);
        libc::fcntl(lock.as_raw_fd(), libc::F_SETFD, flags & !libc::FD_CLOEXEC);
    }
    envelope["steps"] = json!([shell_step(&dir, "settle-attempt", &format!("ls -l /proc/$$/fd > {}/fds.txt", dir.display()), 10_000)]);
    assert!(matches!(run_steps(&envelope, &dir), StepsOutcome::Done(_)));
    let listing = fs::read_to_string(dir.join("fds.txt")).unwrap();
    assert!(!listing.contains("attempt.lock"), "the step inherited the lock: {listing}");
    assert!(!listing.lines().skip(1).any(|l| l.contains("-> /") && !l.contains("/dev/null") && !l.contains("pipe:") && !l.contains("supervisor.log") && !l.contains("fds.txt")), "unexpected descriptor: {listing}");
}
