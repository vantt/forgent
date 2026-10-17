//! The activation gate on Windows, with the helper role played by this
//! crate's own `fgctl` binary (inside a test harness the current executable
//! knows no roles).
#![cfg(windows)]

use std::path::{Path, PathBuf};

use fgos_distribution::{holder_lock_gate, HolderLockGate};
use fgos_holder_lock::HelperExe;

#[test]
fn the_gate_passes_with_the_fgctl_binary_as_helper() {
    let root: PathBuf = std::env::temp_dir().join(format!("fgctl-gate-{}", std::process::id()));
    let outcome = holder_lock_gate(&root.join("ws"), &root.join("locks"), Path::new("git"), &HelperExe(PathBuf::from(env!("CARGO_BIN_EXE_fgctl"))));
    let _ = std::fs::remove_dir_all(&root);
    assert!(matches!(outcome, Ok(HolderLockGate::Passed { .. })), "{outcome:?}");
}
