//! `adopt --scan`: one process judges many attempt directories, skips the
//! closed ones with a single stat and adopts only what is free and empty.
#![cfg(target_os = "linux")]

mod support;

use std::fs;
use std::time::Instant;

use support::adopt_fixture::{adopt_with, attempt_in, dead_tuple, hold_lock, live_process};

const CLOSED: usize = 2_000;

fn scratch(name: &str) -> std::path::PathBuf {
    let root = std::env::temp_dir().join(format!("fgos-adopt-scan-{name}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&root);
    fs::create_dir_all(&root).unwrap();
    root
}

fn closed_dirs(root: &std::path::Path, count: usize) -> Vec<String> {
    (0..count)
        .map(|i| {
            let dir = root.join(format!("closed-{i:04}"));
            fs::create_dir_all(&dir).unwrap();
            fs::write(dir.join("closed.json"), "{}").unwrap();
            dir.to_string_lossy().into_owned()
        })
        .collect()
}

#[test]
fn adopt_scan_skips_two_thousand_closed_runs_quickly_and_adopts_the_five_that_need_it() {
    let root = scratch("perf");
    let closed = closed_dirs(&root, CLOSED);

    // The skip alone: nothing but closed attempts.
    let started = Instant::now();
    let (code, lines) = adopt_with(&["--scan"], &closed.join("\n"));
    let skip = started.elapsed();
    eprintln!("scan of {CLOSED} closed attempts, process start included: {} ms (goal 50 ms)", skip.as_millis());
    assert_eq!(code, 0);
    assert_eq!(lines.len(), CLOSED);
    assert!(lines.iter().all(|l| l["state"] == "closed"));
    assert!(skip.as_millis() < 500, "skip took {} ms; 50 ms is the goal on a normal machine, 500 ms the hard limit", skip.as_millis());

    // Mixed: five attempts to adopt among the closed ones, answers in input order.
    let needing: Vec<_> = (0..5)
        .map(|i| {
            let a = attempt_in(&root, &format!("open-{i}"), &["settle-attempt"]);
            a.bind(&dead_tuple());
            a.gate_exit("agent");
            a
        })
        .collect();
    let mut order: Vec<String> = closed.clone();
    for (i, a) in needing.iter().enumerate() {
        order.insert(i * 400, a.dir.to_string_lossy().into_owned());
    }
    let (code, lines) = adopt_with(&["--scan"], &order.join("\n"));
    assert_eq!(code, 0);
    let dirs: Vec<&str> = lines.iter().map(|l| l["attemptDir"].as_str().unwrap()).collect();
    assert_eq!(dirs, order.iter().map(String::as_str).collect::<Vec<_>>(), "one line per input line, in order");
    assert_eq!(lines.iter().filter(|l| l["state"] == "adopted").count(), 5);
    assert_eq!(lines.iter().filter(|l| l["state"] == "closed").count(), CLOSED);
    for a in &needing {
        assert_eq!(a.runs_of("settle-attempt"), 1);
        assert_eq!(a.json("receipt.json").unwrap()["outcome"], "exited");
    }
    let _ = fs::remove_dir_all(&root);
}

#[test]
fn adopt_scan_leaves_a_running_attempt_and_a_foreign_run_alone() {
    let root = scratch("mixed");
    let running = attempt_in(&root, "running", &["settle-attempt"]);
    let _lock = hold_lock(&running.dir);
    let legacy = attempt_in(&root, "legacy", &["settle-attempt"]);
    fs::remove_file(legacy.path("attempt.lock")).unwrap();
    let (mut live, tuple) = live_process();
    let busy = attempt_in(&root, "busy-domain", &["settle-attempt"]);
    busy.bind(&tuple);
    let input = [&running.dir, &legacy.dir, &busy.dir].iter().map(|d| d.to_string_lossy().into_owned()).collect::<Vec<_>>().join("\n");

    let (code, lines) = adopt_with(&["--scan"], &input);
    assert_eq!(code, 0);
    let states: Vec<_> = lines.iter().map(|l| (l["state"].as_str().unwrap(), l["reason"].as_str())).collect();
    assert_eq!(states, vec![("running", None), ("legacy-run", None), ("running", Some("domain-not-empty"))]);
    assert_eq!(busy.runs_of("settle-attempt"), 0, "a scan never ends a domain");
    live.kill().unwrap();
    live.wait().unwrap();

    let (code, lines) = adopt_with(&["--scan", "--probe-only"], &format!("{}\n", busy.dir.display()));
    assert_eq!((code, lines[0]["state"].as_str()), (0, Some("needs-adopt")), "the domain is empty now: {lines:?}");
    assert!(!busy.path("receipt.json").exists(), "a probe writes nothing");
    let _ = fs::remove_dir_all(&root);
}
