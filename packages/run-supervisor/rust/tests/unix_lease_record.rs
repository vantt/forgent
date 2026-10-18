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
