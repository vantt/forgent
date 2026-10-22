//! `fgos internal supervise` in `terminal` mode against a fake herdr that keeps one real pane: the
//! supervisor listens, launches the gate into the pane through terminal-control, hands over the locks,
//! types the brief through the agent protocol, watches, and releases the slot through the
//! `release-slot` step. The gate is the real one, running under a pty as in a pane.
#![cfg(target_os = "linux")]

mod support;

use std::fs;
use std::process::{Command, Stdio};
use std::time::Duration;

use serde_json::{json, Value};
use support::herdr::{FakeHerdr, Verdict};
use support::supervisor::*;
use support::*;

const LIMIT: Duration = Duration::from_secs(90);
const STEP: Duration = Duration::from_secs(40);

fn release_slot_item() -> Value {
    json!({"stepId": "release-slot", "builtin": true, "disposition": {"onSuccess": "close", "onFailure": "retain"}})
}

/// A terminal attempt over `herdr`: the slot already allocated, the brief on disk, an agent that waits.
fn terminal_run(name: &str, herdr: &FakeHerdr, agent_script: &str, grace_ms: u64) -> SupRun {
    terminal_run_with(name, herdr, agent_script, grace_ms, |_| {})
}

/// `terminal_run` with the deadlines (or anything else of the options) a test sets.
fn terminal_run_with(name: &str, herdr: &FakeHerdr, agent_script: &str, grace_ms: u64, tune: impl FnOnce(&mut RunOpts)) -> SupRun {
    let dir = std::env::temp_dir().join(format!("fgos-sup-{name}-{}", std::process::id()));
    let mut opts = RunOpts::agent(0);
    opts.preferred = "linux-pgroup".into();
    opts.grace_ms = grace_ms;
    tune(&mut opts);
    opts.steps = vec![shell_step(&dir, "settle-attempt", &format!("echo settle >> {}/order", dir.display()), 10_000), release_slot_item()];
    let socket = herdr.go_socket().to_string_lossy().into_owned();
    let script = agent_script.replace("{dir}", &dir.to_string_lossy());
    let run = SupRun::new_with(name, &opts, |e| {
        let attempt_id = e["attemptId"].as_str().unwrap().to_string();
        e["mode"] = json!("terminal");
        e["agentProtocol"]["mode"] = json!("terminal");
        e["slot"] = json!({"key": attempt_id, "groupKey": "g"});
        e["terminal"] = json!({"socketPath": socket, "exitCommand": null, "orphanSettleMs": 300});
        e["identity"] = json!({"writerId": format!("att-{attempt_id}"), "parentWriterId": null});
        e["launch"]["command"] = json!("/bin/sh");
        e["launch"]["args"] = json!(["-c", script]);
        e["launch"]["briefPath"] = json!(dir.join("brief.md"));
    });
    // The controller prepares both capture files before handing a terminal attempt over.
    let envelope = run.json("envelope.json").unwrap();
    for stream in ["stdout", "stderr"] {
        fs::write(envelope["launch"]["capture"][stream].as_str().unwrap(), "").unwrap();
    }
    fs::write(run.path("brief.md"), "Do the thing and write result-1.json.\n").unwrap();
    herdr.allocate(&run.attempt_id);
    run
}

fn agent_pid(run: &SupRun) -> i32 {
    run.json("agent-binding.json").and_then(|a| a["agent"]["pid"].as_i64()).expect("agent pid") as i32
}

fn kill_agent(run: &SupRun) {
    // SAFETY: SIGTERM to the agent the gate reported; a pid that is gone is harmless.
    unsafe { libc::kill(agent_pid(run), libc::SIGTERM) };
}

fn write_result(run: &SupRun) {
    fs::create_dir_all(&run.outbox).unwrap();
    fs::write(run.outbox.join("result-1.json"), json!({"status": "ok"}).to_string()).unwrap();
}

/// Past the prompt: the brief typed, the agent shown working.
fn brief_taken(herdr: &FakeHerdr, run: &SupRun) {
    wait_until(STEP, "the gate to report the agent", || run.json("agent-binding.json").is_some());
    herdr.wait_sent(2, STEP);
    herdr.set_explain(Verdict::Working);
}

fn pane_closes(herdr: &FakeHerdr) -> Vec<String> {
    herdr.calls_starting("pane close")
}

#[test]
fn a_full_lifecycle_launches_briefs_waits_for_the_result_and_closes_the_pane_once() {
    let herdr = FakeHerdr::new("life");
    let mut run = terminal_run("tlife", &herdr, "sleep 600", 3_000);
    let supervisor = run.start_with_env(&herdr.env());

    brief_taken(&herdr, &run);
    let sent = herdr.sent();
    assert_eq!(sent[0]["kind"], "text");
    assert_eq!(sent[0]["text"], "Do the thing and write result-1.json.");
    assert_eq!(sent[1], json!({"kind": "keys", "keys": ["Enter"]}));

    write_result(&run);
    herdr.wait_sent(3, STEP);
    assert_eq!(herdr.sent()[2], json!({"kind": "prompt", "text": "/exit"}), "the adapter's exit command follows the result");
    kill_agent(&run);

    let (code, line) = finish(supervisor, LIMIT);
    assert_eq!(code, 0, "{}", run.log());
    assert_eq!(line["result"], "closed");
    assert_eq!(line["outcome"], "exited");

    let binding = run.json("supervisor-binding.json").expect("binding");
    assert_eq!(binding["attemptId"], run.attempt_id.as_str());
    assert!(run.json("attempt.lock.predecessor.json").is_some(), "the domain was declared on the lock");
    let receipt = run.json("receipt.json").expect("receipt");
    assert_eq!(receipt["outcome"], "exited");
    assert_eq!(receipt["outboxPresent"], true);
    assert_eq!(receipt["gateExit"]["stoppedBy"], "agent");
    assert!(receipt.get("reason").is_none());

    assert_eq!(fs::read_to_string(run.path("order")).unwrap(), "settle\n");
    let release = run.json("steps/release-slot.json").expect("release-slot receipt");
    assert_eq!(release["detail"]["disposition"], "close");
    assert_eq!(pane_closes(&herdr), vec!["pane close fk:p1".to_string()], "exactly one pane close, for this key's pane");
    assert!(herdr.calls_starting("tab close").is_empty(), "no tab is ever closed");
    assert!(!herdr.go_socket().exists(), "the attempt socket is gone with the supervisor");
    assert!(lock_is_free(&run.path("attempt.lock")));
}

#[test]
fn a_pane_whose_shell_never_becomes_ready_ends_as_not_started_and_the_steps_still_run() {
    let herdr = FakeHerdr::new("stuck");
    herdr.set_flag("shell-stuck", true);
    let mut run = terminal_run("tstuck", &herdr, "sleep 600", 3_000);
    let supervisor = run.start_with_env(&herdr.env());

    let (code, line) = finish(supervisor, LIMIT);
    assert_eq!(code, 0, "{}", run.log());
    assert_eq!(line["outcome"], "abandoned-not-started");
    assert_eq!(run.json("start-refused.json").expect("start-refused")["code"], "terminal-launch-not-started");
    let receipt = run.json("receipt.json").expect("receipt");
    assert_eq!(receipt["outcome"], "abandoned-not-started");
    assert_eq!(receipt["reason"], "start-refused:terminal-launch-not-started");
    assert!(run.json("agent-binding.json").is_none() && run.json("supervisor-binding.json").is_none(), "no gate was bound");
    assert!(run.json("steps/release-slot.json").is_some(), "the steps still run");
    assert!(herdr.sent().is_empty(), "nothing but probes reached the pane: {:?}", herdr.sent());
    assert!(!herdr.dir.join("script.pid").exists(), "the launcher was never typed: only probes ran");
}

#[test]
fn an_attempt_that_cannot_go_on_closes_the_captured_pane_and_names_why() {
    let herdr = FakeHerdr::new("blocked");
    herdr.set_explain(Verdict::Blocked);
    let mut run = terminal_run("tblocked", &herdr, "sleep 600", 3_000);
    let supervisor = run.start_with_env(&herdr.env());

    let (code, line) = finish(supervisor, LIMIT);
    assert_eq!(code, 0, "{}", run.log());
    assert_eq!(line["result"], "closed");
    assert!(herdr.sent().is_empty(), "nothing is typed at a pane that waits for a person");

    let receipt = run.json("receipt.json").expect("receipt");
    assert_eq!(receipt["outcome"], "cancelled");
    assert_eq!(receipt["reason"], "terminal:needs-human");
    assert_eq!(run.json("stop-requested.json").unwrap()["cause"], "cancel");
    let release = run.json("steps/release-slot.json").expect("release-slot receipt");
    assert_eq!(release["detail"]["disposition"], "close");
    assert_eq!(pane_closes(&herdr), vec!["pane close fk:p1".to_string()]);
    assert!(run.json("agent-binding.json").is_some(), "the gate did start the agent before the supervisor judged the screen");
}

#[test]
fn a_brief_the_pane_refuses_because_its_shell_holds_the_foreground_ends_the_attempt_with_that_reason() {
    let herdr = FakeHerdr::new("shellfg");
    // Not at the prompt yet: the supervisor waits while the test takes the agent out of the foreground.
    herdr.set_explain(Verdict::Working);
    let mut run = terminal_run("tshellfg", &herdr, "sleep 600", 3_000);
    let supervisor = run.start_with_env(&herdr.env());

    wait_until(STEP, "the gate to report the agent", || run.json("agent-binding.json").is_some());
    herdr.set_flag("no-process", true);
    herdr.set_explain(Verdict::Idle);

    let (code, line) = finish(supervisor, LIMIT);
    assert_eq!(code, 0, "{}", run.log());
    assert!(herdr.sent().is_empty(), "nothing is typed at a pane whose shell holds the foreground: {:?}", herdr.sent());
    assert_eq!(line["outcome"], "cancelled");
    let receipt = run.json("receipt.json").expect("receipt");
    assert_eq!(receipt["outcome"], "cancelled");
    assert_eq!(receipt["reason"], "terminal:foreground-not-agent");
    assert_eq!(run.json("stop-requested.json").unwrap()["cause"], "cancel");
}

#[test]
fn a_pane_that_disappears_is_a_lost_carrier_and_nothing_is_closed() {
    let herdr = FakeHerdr::new("gone");
    let mut run = terminal_run("tgone", &herdr, "sleep 600", 500);
    let supervisor = run.start_with_env(&herdr.env());

    brief_taken(&herdr, &run);
    let agent = agent_pid(&run);
    herdr.set_flag("gone", true);

    let (code, line) = finish(supervisor, LIMIT);
    // The gate's own group is ended by the supervisor; the agent sits in a group of its own.
    // SAFETY: SIGKILL to the agent the gate reported.
    unsafe { libc::kill(agent, libc::SIGKILL) };
    assert_eq!(code, 0, "{}", run.log());
    assert_eq!(line["outcome"], "carrier-lost");
    let receipt = run.json("receipt.json").expect("receipt");
    assert_eq!(receipt["outcome"], "carrier-lost");
    assert!(receipt.get("gateExit").is_none(), "the gate published nothing");
    assert!(pane_closes(&herdr).is_empty(), "a lost carrier closes nothing");
    assert_eq!(run.json("steps/release-slot.json").unwrap()["detail"]["disposition"], "retain");
}

#[test]
fn an_agent_reported_working_is_alive_without_asking_the_pane_for_its_processes() {
    let herdr = FakeHerdr::new("alive");
    let mut run = terminal_run_with("talive", &herdr, "sleep 600", 500, |opts| opts.idle_ms = Some(6_000));
    let supervisor = run.start_with_env(&herdr.env());

    brief_taken(&herdr, &run);
    fs::write(herdr.dir.join("agent-status"), "working").unwrap();
    // More than two idle periods in which nothing is drawn: the working verdict is the liveness proof.
    std::thread::sleep(Duration::from_secs(14));
    assert!(run.json("stop-requested.json").is_none(), "a working agent is not idle: {}", run.log());
    let calls = herdr.calls();
    let typed = calls.iter().position(|c| c.starts_with("pane send-keys")).expect("the brief was submitted");
    assert!(calls[typed..].iter().all(|c| !c.starts_with("pane process-info")), "the watch never reads the pane's processes: {calls:?}");

    kill_agent(&run);
    let (code, line) = finish(supervisor, LIMIT);
    assert_eq!(code, 0, "{}", run.log());
    assert_eq!(line["outcome"], "exited");
}

#[test]
fn a_pane_that_cannot_be_read_is_blind_time_that_runs_to_the_deadline_never_idle() {
    let herdr = FakeHerdr::new("blind");
    let mut run = terminal_run_with("tblind", &herdr, "sleep 600", 500, |opts| {
        opts.idle_ms = Some(6_000);
        opts.soft_ms = Some(16_000);
    });
    let supervisor = run.start_with_env(&herdr.env());

    brief_taken(&herdr, &run);
    // Let the adapter confirm the delivery first, with the agent working; only then does the pane stop answering.
    fs::write(herdr.dir.join("agent-status"), "working").unwrap();
    std::thread::sleep(Duration::from_secs(4));
    herdr.set_flag("unreadable", true);

    let (code, line) = finish(supervisor, LIMIT);
    let agent = agent_pid(&run);
    // SAFETY: SIGKILL to the agent the gate reported; a pid that is gone is harmless.
    unsafe { libc::kill(agent, libc::SIGKILL) };
    assert_eq!(code, 0, "{}", run.log());
    assert_eq!(line["outcome"], "timeout");
    let stop = run.json("stop-requested.json").expect("stop request");
    assert_eq!(stop["cause"], "soft-deadline", "idle time must not accrue while nothing can be read: {stop}");
}

#[test]
fn a_launch_that_proves_nothing_sends_no_go_and_the_gate_finds_the_socket_closed() {
    let herdr = FakeHerdr::new("unknown");
    herdr.set_flag("no-process", true);
    let mut run = terminal_run("tunknown", &herdr, "echo ran > {dir}/agent.ran; sleep 600", 3_000);
    let supervisor = run.start_with_env(&herdr.env());

    let (code, line) = finish(supervisor, LIMIT);
    assert_eq!(code, 0, "{}", run.log());
    assert_eq!(line["outcome"], "abandoned-not-started");
    let receipt = run.json("receipt.json").expect("receipt");
    assert_eq!(receipt["reason"], "start-refused:terminal-launch-not-started");
    assert!(run.json("supervisor-binding.json").is_none(), "no GO was ever prepared");
    assert!(!herdr.go_socket().exists(), "the listening socket is gone");

    // The gate was started in the pane anyway and meets a socket that no longer answers.
    let script: i32 = fs::read_to_string(herdr.dir.join("script.pid")).unwrap().trim().parse().unwrap();
    wait_until(STEP, "the pane's gate to leave", || !alive(script as u32));
    assert!(!run.path("agent.ran").exists(), "no agent ran");
    assert!(run.json("gate-exit.json").is_none());
    assert_eq!(run.json("steps/release-slot.json").unwrap()["detail"]["disposition"], "retain");
    assert!(pane_closes(&herdr).is_empty());
}

#[test]
fn a_supervisor_killed_after_the_brief_leaves_the_gate_running_and_adopt_releases_the_slot() {
    let herdr = FakeHerdr::new("kill");
    let mut run = terminal_run("tkill", &herdr, "sleep 600", 3_000);
    let mut supervisor = run.start_with_env(&herdr.env());

    brief_taken(&herdr, &run);
    // The confirm loop looks once per poll; after this the brief is confirmed and BRIEF_DELIVERED is out.
    std::thread::sleep(Duration::from_millis(3_500));
    supervisor.kill().unwrap();
    let _ = supervisor.wait();
    let agent = agent_pid(&run);
    assert!(alive(agent as u32), "the agent outlives its supervisor");
    assert!(!lock_is_free(&run.path("attempt.lock")), "the gate holds the lock the supervisor handed over");

    write_result(&run);
    wait_until(STEP, "the orphaned gate to end the domain", || run.json("gate-exit.json").is_some());
    let exit = run.json("gate-exit.json").unwrap();
    assert_eq!(exit["stoppedBy"], "orphan");
    assert_eq!(exit["cause"], "orphan-result");
    wait_until(STEP, "the lock to be free", || lock_is_free(&run.path("attempt.lock")));
    assert!(pane_closes(&herdr).is_empty(), "nobody has released the slot yet");

    let out = Command::new(internal_harness())
        .args(["internal", "adopt", "--protocol", "1", "--run-dir"])
        .arg(&run.dir)
        .env_clear()
        .envs(herdr.env())
        .stdin(Stdio::null())
        .output()
        .unwrap();
    assert!(out.status.success(), "{} {}", String::from_utf8_lossy(&out.stdout), String::from_utf8_lossy(&out.stderr));
    let receipt = run.json("receipt.json").expect("receipt");
    assert_eq!(receipt["synthesizedBy"], "adopt");
    assert_eq!(receipt["outcome"], "exited");
    assert_eq!(run.json("steps/release-slot.json").unwrap()["detail"]["disposition"], "close");
    assert_eq!(pane_closes(&herdr), vec!["pane close fk:p1".to_string()]);
    assert!(run.json("closed.json").is_some());
}

#[test]
fn an_idle_agent_with_unchanged_invalid_result_stops_and_releases_custody() {
    let herdr = FakeHerdr::new("invalid-result");
    let mut run = terminal_run("tinvalid-result", &herdr, "sleep 600", 300);
    let supervisor = run.start_with_env(&herdr.env());
    brief_taken(&herdr, &run);
    wait_until(STEP, "brief delivery", || herdr.sent().len() >= 2);
    // Let the supervisor observe working before returning to the idle prompt.
    std::thread::sleep(Duration::from_secs(2));
    fs::create_dir_all(&run.outbox).unwrap();
    fs::write(run.outbox.join("result-1.json"), "{\"summary\":\"raw\nnewline\"}").unwrap();
    herdr.set_explain(Verdict::Idle);
    let (code, _) = finish(supervisor, LIMIT);
    assert_eq!(code, 0, "{}", run.log());
    let receipt = run.json("receipt.json").unwrap();
    assert_eq!(receipt["reason"], "terminal:result-unreadable");
    assert!(run.json("steps/release-slot.json").is_some());
    assert!(lock_is_free(&run.path("attempt.lock")));
}
