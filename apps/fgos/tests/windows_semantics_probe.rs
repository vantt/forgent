//! The two-process semantics probe on Windows, with the helper role played by
//! this crate's own `fgos` binary (inside a test harness the current
//! executable knows no roles).
#![cfg(windows)]

use std::path::PathBuf;
use std::process::Command;

use fgos_holder_lock::semantics::two_process_probe;
use fgos_holder_lock::HelperExe;

fn fgos() -> PathBuf {
    PathBuf::from(env!("CARGO_BIN_EXE_fgos"))
}

#[test]
fn the_probe_passes_with_the_fgos_binary_as_helper() {
    let dir = std::env::temp_dir().join(format!("fgos-semantics-probe-{}", std::process::id()));
    let elapsed = two_process_probe(&dir.join("locks"), &HelperExe(fgos())).expect("probe passes on a local tmp mount");
    assert!(elapsed < 1000.0, "probe took {elapsed} ms");
    assert_eq!(std::fs::read_dir(dir.join("locks")).unwrap().count(), 0, "the probe file is removed");
    let _ = std::fs::remove_dir_all(&dir);
}

#[test]
fn an_unknown_helper_role_exits_64() {
    let status = Command::new(fgos()).args(["internal", "holder-lock-helper", "nope"]).status().unwrap();
    assert_eq!(status.code(), Some(64));
}
