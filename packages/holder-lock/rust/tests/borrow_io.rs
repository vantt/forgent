//! Real-process acceptance of the synchronous bounded-I/O borrow family.
#![cfg(unix)]
mod common;

use common::*;
use fgos_holder_lock::*;
use std::fs;
use std::process::Command;
use std::time::{Duration, Instant};

fn held(res: &Resource) -> Handle {
    match acquire(res, Mode::Ex, Wait::Try, 2000) {
        Acquire::Acquired(h) => h,
        other => panic!("{other:?}"),
    }
}
fn bounds(input: Vec<u8>) -> BorrowIo {
    BorrowIo {
        stdin: input,
        stdout_limit: 1024 * 1024,
        stderr_limit: 1024,
        deadline: Instant::now() + Duration::from_secs(10),
    }
}
fn shell(script: &str, dir: &std::path::Path) -> BorrowSpec {
    BorrowSpec {
        argv: vec!["sh".into(), "-c".into(), script.into()],
        cwd: Some(dir.into()),
        ..Default::default()
    }
}
fn gone(pid: u32) {
    use fgos_process::facts::{observe, Observed};
    assert!(
        matches!(
            observe(fgos_process::ProcId(pid)),
            Observed::Absent | Observed::Zombie
        ),
        "pid {pid} remains live"
    );
}
fn pids_gone(dir: &std::path::Path) {
    for pid in fs::read_to_string(dir.join("pids"))
        .unwrap()
        .split_whitespace()
    {
        gone(pid.parse().unwrap());
    }
}

#[test]
fn child_entry() {
    common::child_entry()
}

#[test]
fn contender_blocks_during_borrow_and_acquires_after_return_and_release() {
    let _serial = serial();
    let dir = temp_dir("io-exclusion");
    let res = resource(&dir, "io");
    let handle = held(&res);
    let ready = dir.join("contender-ready");
    let mut contender = spawn_role("holder", &res.path, &ready, "");
    let start = dir.join("started");
    std::thread::scope(|scope| {
        let worker = scope.spawn(|| {
            run_borrowed_io(
                &handle,
                &shell(
                    "echo started > started; while [ ! -f finish ]; do sleep 0.01; done",
                    &dir,
                ),
                &bounds(vec![]),
            )
        });
        let deadline = Instant::now() + Duration::from_secs(5);
        while !start.exists() {
            assert!(Instant::now() < deadline);
            std::thread::sleep(Duration::from_millis(2));
        }
        assert!(!ready.exists());
        assert!(matches!(
            acquire(&res, Mode::Ex, Wait::Try, 2000),
            Acquire::Held { .. }
        ));
        fs::write(dir.join("finish"), b"").unwrap();
        assert_eq!(worker.join().unwrap().unwrap().outcome.exit, Some(0));
    });
    // The synchronous call lends the handle; ownership stays with the caller.
    assert!(!ready.exists());
    release(handle);
    assert_eq!(wait_ready(&ready, &mut contender), "held");
    kill_and_reap(&mut contender);
    fs::remove_dir_all(dir).unwrap();
}

#[test]
fn binary_git_hash_object_round_trip_with_hooks_off() {
    let _serial = serial();
    let dir = temp_dir("io-git");
    assert!(Command::new("git")
        .args(["init", "-q"])
        .current_dir(&dir)
        .status()
        .unwrap()
        .success());
    let hooks = dir.join("empty-hooks");
    fs::create_dir(&hooks).unwrap();
    let handle = held(&resource(&dir, "io"));
    let input: Vec<u8> = (0..=255).cycle().take(256 * 2048).collect();
    let spec = BorrowSpec {
        argv: vec![
            "git".into(),
            "-c".into(),
            format!("core.hooksPath={}", hooks.display()),
            "hash-object".into(),
            "--stdin".into(),
            "-w".into(),
        ],
        cwd: Some(dir.clone()),
        ..Default::default()
    };
    let out = run_borrowed_io(&handle, &spec, &bounds(input.clone())).unwrap();
    assert_eq!(out.outcome.exit, Some(0));
    assert!(out.stderr.is_empty());
    let oid = std::str::from_utf8(&out.stdout).unwrap().trim();
    let read = Command::new("git")
        .args(["cat-file", "blob", oid])
        .current_dir(&dir)
        .output()
        .unwrap();
    assert!(read.status.success());
    assert_eq!(read.stdout, input);
    release(handle);
    fs::remove_dir_all(dir).unwrap();
}

#[test]
fn full_duplex_binary_capture_does_not_deadlock() {
    let _serial = serial();
    let dir = temp_dir("io-duplex");
    let handle = held(&resource(&dir, "io"));
    let input: Vec<u8> = (0..=255).cycle().take(512 * 1024).collect();
    let out = run_borrowed_io(
        &handle,
        &shell("cat; printf diagnostic >&2", &dir),
        &bounds(input.clone()),
    )
    .unwrap();
    assert_eq!(out.stdout, input);
    assert_eq!(out.stderr, b"diagnostic");
    release(handle);
    fs::remove_dir_all(dir).unwrap();
}

#[test]
fn overflow_kills_root_and_borrowing_leftovers_before_refusal() {
    let _serial = serial();
    for stream in ["stdout", "stderr"] {
        let dir = temp_dir("io-overflow");
        let handle = held(&resource(&dir, "io"));
        let redirect = if stream == "stderr" { " >&2" } else { "" };
        let script =
            format!("sleep 30 & echo $$ $! > pids; while :; do printf 0123456789{redirect}; done");
        let mut io = bounds(vec![]);
        io.stdout_limit = 32;
        io.stderr_limit = 32;
        let error = run_borrowed_io(&handle, &shell(&script, &dir), &io).unwrap_err();
        assert!(
            matches!(error, BorrowError::OutputLimit(s) if s == stream),
            "{error}"
        );
        assert_eq!(error.to_string(), format!("borrow-output-limit: {stream}"));
        pids_gone(&dir);
        release(handle);
        release(held(&resource(&dir, "io")));
        fs::remove_dir_all(dir).unwrap();
    }
}

#[test]
fn deadline_kills_and_drains_even_when_child_never_reads_stdin() {
    let _serial = serial();
    let dir = temp_dir("io-deadline");
    let res = resource(&dir, "io");
    let handle = held(&res);
    let mut io = bounds(vec![42; 1024 * 1024]);
    io.deadline = Instant::now() + Duration::from_millis(200);
    let error = run_borrowed_io(
        &handle,
        &shell("sleep 30 & echo $$ $! > pids; wait", &dir),
        &io,
    )
    .unwrap_err();
    assert!(matches!(error, BorrowError::Deadline), "{error}");
    assert_eq!(error.to_string(), "borrow-deadline");
    pids_gone(&dir);
    release(handle);
    release(held(&res));
    fs::remove_dir_all(dir).unwrap();
}

#[test]
fn successful_root_exit_drains_leftovers_and_captures_tail() {
    let _serial = serial();
    let dir = temp_dir("io-tail");
    let handle = held(&resource(&dir, "io"));
    let out = run_borrowed_io(
        &handle,
        &shell(
            "sleep 30 & echo $$ $! > pids; printf tail; printf error >&2",
            &dir,
        ),
        &bounds(vec![]),
    )
    .unwrap();
    assert_eq!(out.outcome.exit, Some(0));
    assert!(out.outcome.leftovers_killed > 0);
    assert_eq!(out.stdout, b"tail");
    assert_eq!(out.stderr, b"error");
    pids_gone(&dir);
    release(handle);
    fs::remove_dir_all(dir).unwrap();
}
