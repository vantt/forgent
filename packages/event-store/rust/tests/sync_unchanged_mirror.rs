#![cfg(target_os = "linux")]
//! Own binary: the Git driver resolves its `git` once per process, so the counting
//! wrapper must be on PATH before the first driver exists and no sibling test may race it.
mod sync_support;
use fgos_event_store::sync::sync_status;
use std::{fs, os::unix::fs::PermissionsExt, path::Path};
use sync_support::*;

/// Puts a `git` that records every invocation ahead of the real one and returns the log path.
fn install_recording_git(dir: &Path) -> std::path::PathBuf {
    let real = String::from_utf8(
        std::process::Command::new("sh")
            .args(["-c", "command -v git"])
            .output()
            .unwrap()
            .stdout,
    )
    .unwrap();
    let log = dir.join("git-calls.log");
    let bin = dir.join("bin");
    fs::create_dir(&bin).unwrap();
    let script = bin.join("git");
    fs::write(
        &script,
        format!(
            "#!/bin/sh\necho \"$PWD $GIT_DIR $*\" >> '{}'\nexec '{}' \"$@\"\n",
            log.display(),
            real.trim()
        ),
    )
    .unwrap();
    fs::set_permissions(&script, fs::Permissions::from_mode(0o755)).unwrap();
    let path = std::env::var_os("PATH").unwrap_or_default();
    let mut dirs = vec![bin];
    dirs.extend(std::env::split_paths(&path));
    std::env::set_var("PATH", std::env::join_paths(dirs).unwrap());
    log
}

/// One history walk page is one `rev-list --stdin` run inside the clone.
fn history_walks(log: &Path, clone: &Path) -> usize {
    let clone = clone.to_string_lossy().into_owned();
    fs::read_to_string(log)
        .unwrap_or_default()
        .lines()
        .filter(|l| l.contains("rev-list") && l.contains("--stdin") && l.contains(&clone))
        .count()
}

#[test]
fn a_sync_whose_mirror_tips_did_not_move_does_not_walk_them_again() {
    let w = World::new();
    let log = install_recording_git(&w.root);
    let a = w.clone("a", "machine-aa");
    let b = w.clone("b", "machine-bb");
    a.setup();
    b.setup();
    a.append(2);
    a.sync(false).unwrap();
    b.append(1);
    let before = history_walks(&log, &b.root);
    b.sync(false).unwrap();
    let first = history_walks(&log, &b.root);
    assert!(first > before, "the first sync walks the new mirror");
    b.sync(false).unwrap();
    let steady = history_walks(&log, &b.root);
    b.sync(false).unwrap();
    assert_eq!(
        history_walks(&log, &b.root),
        steady,
        "mirror tips with recorded positions that did not move are not walked"
    );
    // A tip that moved is still walked and verified in full.
    a.append(1);
    a.sync(false).unwrap();
    b.sync(false).unwrap();
    assert!(history_walks(&log, &b.root) > steady);
    let name = "refs/fgos/remotes/origin/events/machine-aa";
    assert_eq!(
        sync_status(&b.layout).unwrap().positions[name]
            .values()
            .copied()
            .max(),
        Some(3)
    );
}
