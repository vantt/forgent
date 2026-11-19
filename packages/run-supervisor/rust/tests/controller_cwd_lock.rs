//! The per-directory dispatch lock: one writer per working directory, keyed by directory identity.
//! Vectors recorded from `src/run-supervisor/cwd-lock.mjs`.
#![cfg(unix)]

use fgos_holder_lock::LockScope;
use fgos_run_supervisor::controller::cwd_lock::*;
use serde_json::Value;
use std::path::{Path, PathBuf};

fn vectors() -> Value {
    serde_json::from_str(include_str!("../../contracts/controller/cwd-lock.v1.json")).unwrap()
}

fn scratch(name: &str) -> (PathBuf, PathBuf) {
    let root = std::env::temp_dir().join(format!("fgos-cwdlock-{name}-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&root);
    let cwd = root.join("work");
    std::fs::create_dir_all(&cwd).unwrap();
    (root.canonicalize().unwrap(), cwd)
}

#[test]
fn the_lock_file_name_is_the_directory_identity() {
    let (fgos, cwd) = scratch("path");
    let link = fgos.join("alias");
    std::os::unix::fs::symlink(&cwd, &link).unwrap();
    let path = lock_path(&fgos, &cwd).unwrap();
    assert_eq!(
        lock_path(&fgos, &link).unwrap(),
        path,
        "a symlinked spelling is the same lock"
    );
    let shape = vectors()["lockPathShape"].as_str().unwrap().to_string();
    let relative = path
        .strip_prefix(&fgos)
        .unwrap()
        .to_str()
        .unwrap()
        .to_string();
    let (head, key) = shape.split_once("<cwdDevIno>").unwrap();
    let identity = relative
        .strip_prefix(head)
        .unwrap()
        .strip_suffix(".lock")
        .unwrap();
    assert!(
        identity.split('-').count() == 3
            && identity
                .split('-')
                .all(|p| p.chars().all(|c| c.is_ascii_digit()))
    );
    assert_eq!(key, ".lock");
    let _ = std::fs::remove_dir_all(&fgos);
}

#[test]
fn a_second_dispatch_is_refused_with_the_holder_named_and_released_on_drop() {
    let (fgos, cwd) = scratch("contend");
    let first = acquire_dispatch_cwd_lock(&fgos, &cwd).unwrap();
    let refused = acquire_dispatch_cwd_lock(&fgos, &cwd).unwrap_err();
    assert_eq!(refused.code, "dispatch-in-flight");
    let pid = std::process::id();
    assert_eq!(
        refused.message,
        format!(
            "dispatch for cwd \"{}\" is already in flight (held by process {pid}).",
            cwd.display()
        )
    );
    assert_eq!(refused.detail["holderPid"], pid);
    assert_eq!(
        refused.detail["lockPath"].as_str().unwrap(),
        lock_path(&fgos, &cwd).unwrap().to_str().unwrap()
    );
    let holder = dispatch_cwd_holder(&fgos, &cwd).unwrap();
    assert_eq!(holder.pid, Some(pid));
    drop(first);
    assert!(dispatch_cwd_holder(&fgos, &cwd).is_none());
    drop(acquire_dispatch_cwd_lock(&fgos, &cwd).unwrap());
    let _ = std::fs::remove_dir_all(&fgos);
}

#[test]
fn a_directory_that_does_not_exist_has_no_lock_and_no_holder() {
    let (fgos, _cwd) = scratch("missing");
    let absent = Path::new("/absent/dir");
    let case = &vectors()["missingCwd"];
    let error = acquire_dispatch_cwd_lock(&fgos, absent).unwrap_err();
    assert_eq!(error.code, case["code"].as_str().unwrap());
    assert_eq!(error.message, case["message"].as_str().unwrap());
    assert!(dispatch_cwd_holder(&fgos, absent).is_none());
    let scope = LockScope::seeded(Vec::new()).unwrap();
    assert_eq!(
        admit_successor(&scope, &fgos, absent).unwrap_err().code,
        "worker-spawn-fail"
    );
    let _ = std::fs::remove_dir_all(&fgos);
}

#[test]
fn the_in_flight_refusal_reads_as_the_node_one() {
    for case in vectors()["inFlight"].as_array().unwrap() {
        let pid = case["pid"].as_u64().map(|p| p as u32);
        let error = dispatch_in_flight_error(Path::new("/w/tree"), pid, Path::new("/l/x.lock"));
        assert_eq!(error.code, case["code"].as_str().unwrap());
        assert_eq!(error.message, case["message"].as_str().unwrap());
    }
}

#[test]
fn a_custody_successor_takes_a_free_lease_and_a_held_one_is_in_flight() {
    let (fgos, cwd) = scratch("successor");
    let scope = LockScope::seeded(Vec::new()).unwrap();
    let held = admit_successor(&scope, &fgos, &cwd).unwrap();
    assert_eq!(
        admit_successor(&scope, &fgos, &cwd).unwrap_err().code,
        "dispatch-in-flight"
    );
    assert!(record_custody_handoff(Some(&held)).is_none());
    assert!(record_custody_handoff(None).is_none());
    drop(held);
    let _ = std::fs::remove_dir_all(&fgos);
}
