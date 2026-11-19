//! An exclusive lock moves to a child with its descriptor: the parent's handle settles at once, and the lock lasts
//! exactly as long as the child's copy.
#![cfg(unix)]
mod common;

use common::*;
use fgos_holder_lock::*;
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

#[test]
fn a_handed_over_lock_settles_at_once_and_lasts_as_long_as_the_child_holding_it() {
    let _serial = serial();
    let dir = temp_dir("hand-over");
    let res = resource(&dir, "handover");
    let Acquire::Acquired(handle) = acquire(&res, Mode::Ex, Wait::Try, DEFAULT_KILL_WAIT_MS) else {
        panic!("lock not acquired")
    };
    let started = Instant::now();
    let file = handle.hand_over().expect("exclusive handle hands over");
    // The child holds the description as its stdin; `Stdio::from` moves the parent's copy into the spawn.
    let mut child = Guard(
        Command::new("sleep")
            .arg("30")
            .stdin(Stdio::from(file))
            .spawn()
            .expect("child"),
    );
    assert!(
        started.elapsed() < Duration::from_millis(DEFAULT_KILL_WAIT_MS / 4),
        "the hand-over waited on the child: {:?}",
        started.elapsed()
    );
    assert_eq!(
        probe(&res).unwrap(),
        Probe::Held,
        "the child holds the lock"
    );
    kill_and_reap(&mut child);
    assert_eq!(
        probe(&res).unwrap(),
        Probe::Free,
        "the lock ends with the child"
    );
}

#[test]
fn a_shared_handle_is_not_handed_over() {
    let _serial = serial();
    let dir = temp_dir("hand-over-shared");
    let res = resource(&dir, "shared");
    let Acquire::Acquired(handle) = acquire(&res, Mode::Sh, Wait::Try, DEFAULT_KILL_WAIT_MS) else {
        panic!("lock not acquired")
    };
    let refused = handle.hand_over().expect_err("a shared handle stays");
    assert_eq!(refused.kind(), std::io::ErrorKind::InvalidInput);
    assert_eq!(
        probe(&res).unwrap(),
        Probe::Free,
        "the refused handle was released"
    );
}
