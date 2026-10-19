//! The Unix supervisor declares the producer domain on the inherited cwd
//! lease, while the controller retains its own copy through handoff.
#![cfg(unix)]
mod portable;

use std::fs;
use std::time::Duration;
use fgos_holder_lock::{probe, Probe, Resource};
use portable::supervisor::{arg_path, Opts, Run};
use portable::wait_for;

#[test]
fn the_domain_is_recorded_before_the_agent_runs_and_the_controller_keeps_custody() {
    let name = "unix-custody-record";
    let mut opts = Opts::agent(&["work", "100", &arg_path(name, "agent.up"), &arg_path(name, "agent.done")]);
    opts.mutating = true;
    let mut run = Run::new(name, &opts);
    let controller = run.retain_lease();
    let mut supervisor = run.start();
    wait_for(&run.path("agent.up"), Duration::from_secs(30));
    let attempt = run.json("attempt.lock.predecessor.json").expect("attempt domain");
    let lease = run.json("cwd.lease.predecessor.json").expect("cwd domain declared before GO");
    assert_eq!(attempt, lease);
    assert_eq!(lease["domainKind"], portable::driver_name());
    assert!(supervisor.wait().unwrap().success(), "{}", run.log());
    let resource = Resource::new("dispatch-cwd", &run.lease_path);
    assert_eq!(probe(&resource).unwrap(), Probe::Held, "the controller excludes successors after the receipt");
    fgos_holder_lock::predecessor::clear(&fgos_holder_lock::predecessor::record_path(&run.lease_path), Duration::from_secs(2)).unwrap();
    drop(controller);
    assert_eq!(probe(&resource).unwrap(), Probe::Free);
    assert!(!run.path("cwd.lease.predecessor.json").exists());
    fs::remove_dir_all(run.dir).unwrap();
}

#[test]
#[cfg(target_os = "linux")]
fn successful_linux_pgroup_supervisor_drains_setsid_escapee_before_live_controller_handoff() {
    let name = "best-effort-handoff";
    let mut opts = Opts::agent(&["orphan-setsid", &arg_path(name, "agent.up"), &arg_path(name, "escape.pid")]);
    opts.mutating = true;
    let mut run = Run::new(name, &opts);
    let controller = run.retain_lease();
    let mut supervisor = run.start();
    wait_for(&run.path("escape.pid"), Duration::from_secs(30));
    let pid: i32 = fs::read_to_string(run.path("escape.pid")).unwrap().parse().unwrap();
    struct Escape(i32);
    impl Drop for Escape {
        fn drop(&mut self) {
            // SAFETY: the fixture created this escapee and owns its lifetime.
            unsafe { libc::kill(self.0, libc::SIGKILL); }
        }
    }
    let _escape = Escape(pid);
    assert!(supervisor.wait().unwrap().success(), "{}", run.log());
    let receipt = run.json("receipt.json").unwrap();
    assert_eq!(receipt["gateExit"]["exitCode"], 0, "successful producer: {receipt}");
    assert_eq!(run.json("cwd.lease.predecessor.json").unwrap()["domainKind"], "linux-pgroup");
    // SAFETY: signal 0 only checks the real fixture escapee's liveness.
    assert_eq!(unsafe { libc::kill(pid, 0) }, -1, "gate subreaper drained the setsid escapee");
    fgos_holder_lock::predecessor::clear(&fgos_holder_lock::predecessor::record_path(&run.lease_path), Duration::from_secs(2)).unwrap();
    assert!(!run.path("cwd.lease.predecessor.json").exists());
    // The live controller retained custody throughout the successful run.
    assert_eq!(unsafe { libc::kill(pid, 0) }, -1, "gate subreaper drained the setsid escapee");
    drop(controller);
    fs::remove_dir_all(run.dir).unwrap();
}

#[test]
fn mismatched_cwd_lease_path_never_gets_a_domain_record_or_starts_a_producer() {
    let name = "wrong-cwd-lease-path";
    let mut opts = Opts::agent(&["work", "10", &arg_path(name, "agent.up"), &arg_path(name, "agent.done")]);
    opts.mutating = true;
    let mut run = Run::new(name, &opts);
    let wrong = run.path("wrong.lease");
    fs::write(&wrong, "").unwrap();
    let mut envelope = run.json("envelope.json").unwrap();
    envelope["cwdLeaseFile"] = serde_json::json!(wrong);
    envelope["digest"] = serde_json::json!(fgos_run_supervisor::envelope::digest(&envelope).unwrap());
    fs::write(&run.envelope, serde_json::to_vec(&envelope).unwrap()).unwrap();
    let mut supervisor = run.start();
    assert!(!supervisor.wait().unwrap().success());
    assert!(!run.path("agent.up").exists());
    assert!(!run.path("wrong.lease.predecessor.json").exists());
    fs::remove_dir_all(run.dir).unwrap();
}
