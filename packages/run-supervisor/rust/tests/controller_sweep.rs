//! The controller's sweep: which attempt directories are open, that adopt judges them in process, and that
//! nothing a sweep does throws.

use fgos_run_supervisor::controller::adopt_scan::{adopt_scan, list_open_attempt_dirs};
use fgos_run_supervisor::controller::sweep::sweep_attempts;
use serde_json::Value;
use std::path::PathBuf;

fn scratch(name: &str) -> PathBuf {
    let dir =
        std::env::temp_dir().join(format!("rs-controller-sweep-{name}-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

fn tree(dir: &std::path::Path) {
    for (rel, closed) in [
        ("a/producer/1/runs/02", false),
        ("a/producer/1/runs/01", false),
        ("a/producer/1/runs/00", true),
        ("b/runs/01", false),
        ("c/nothing", false),
    ] {
        std::fs::create_dir_all(dir.join(rel)).unwrap();
        if closed {
            std::fs::write(dir.join(rel).join("closed.json"), "{}").unwrap();
        }
    }
    std::fs::write(dir.join("b/runs/file.txt"), "x").unwrap();
}

#[test]
fn open_attempt_dirs_match_the_recorded_listing() {
    let v: Value = serde_json::from_slice(
        &std::fs::read(
            PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../contracts/controller/sweep.v1.json"),
        )
        .unwrap(),
    )
    .unwrap();
    let dir = scratch("list");
    tree(&dir);
    let got: Vec<String> = list_open_attempt_dirs(&dir)
        .iter()
        .map(|p| {
            p.strip_prefix(&dir)
                .unwrap()
                .to_string_lossy()
                .replace('\\', "/")
        })
        .collect();
    let want: Vec<String> = v["open"]
        .as_array()
        .unwrap()
        .iter()
        .map(|s| s.as_str().unwrap().into())
        .collect();
    assert_eq!(got, want);
    let _ = std::fs::remove_dir_all(dir);
}

#[test]
fn adopt_scan_judges_each_open_dir_in_process_and_a_dir_without_lock_is_a_legacy_run() {
    let dir = scratch("scan");
    tree(&dir);
    let verdicts = adopt_scan(&dir, true, None);
    assert_eq!(verdicts.len(), 3);
    assert!(verdicts.iter().all(|(_, v)| v.state == "legacy-run"));
    assert!(adopt_scan(&dir.join("missing"), true, None).is_empty());
    let _ = std::fs::remove_dir_all(dir);
}

#[test]
fn sweep_never_throws_and_always_cleans_sockets() {
    let dir = scratch("sweep");
    tree(&dir);
    let mut cleaned = 0;
    let swept = sweep_attempts(Some(&dir), true, None, || cleaned += 1);
    assert_eq!(swept.adopt.as_ref().unwrap().len(), 3);
    assert!(swept.adopt_error.is_none());
    assert_eq!(cleaned, 1);
    let swept = sweep_attempts(None, true, None, || panic!("socket cleanup failed"));
    assert!(swept.adopt.is_none() && swept.adopt_error.is_none());
    let _ = std::fs::remove_dir_all(dir);
}
