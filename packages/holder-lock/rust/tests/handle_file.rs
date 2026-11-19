//! An exclusive lock lent to a child: the child holds a copy of the description, the parent's handle keeps excluding
//! every other holder until it is dropped, and that drop only closes the parent's copy, never waiting on the child
//! or ending it. The lock lasts as long as the last copy.
#![cfg(unix)]
mod common;

use common::*;
use fgos_holder_lock::*;
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

fn lent_to_sleeper(res: &Resource) -> (Handle, Guard) {
    let Acquire::Acquired(handle) = acquire(res, Mode::Ex, Wait::Try, DEFAULT_KILL_WAIT_MS) else {
        panic!("lock not acquired")
    };
    let started = Instant::now();
    let copy = handle.lend().expect("an exclusive handle lends its lock");
    assert!(
        started.elapsed() < Duration::from_millis(50),
        "the lend took {:?}",
        started.elapsed()
    );
    // The child holds the description as its stdin; `Stdio::from` moves the lent copy into the spawn.
    let child = Guard(
        Command::new("sleep")
            .arg("30")
            .stdin(Stdio::from(copy))
            .spawn()
            .expect("child"),
    );
    (handle, child)
}

#[test]
fn a_lent_lock_outlives_the_parents_handle_whose_drop_neither_waits_nor_kills() {
    let _serial = serial();
    let dir = temp_dir("lend");
    let res = resource(&dir, "lend");
    let (handle, mut child) = lent_to_sleeper(&res);
    assert_eq!(
        probe(&res).unwrap(),
        Probe::Held,
        "both copies hold the lock"
    );

    let dropping = Instant::now();
    assert_eq!(release(handle), Release::Released { killed: 0 });
    assert!(
        dropping.elapsed() < Duration::from_millis(DEFAULT_KILL_WAIT_MS / 4),
        "the parent's release waited on the child: {:?}",
        dropping.elapsed()
    );
    assert!(
        child.0.try_wait().unwrap().is_none(),
        "the parent's release ended the child"
    );
    assert_eq!(
        probe(&res).unwrap(),
        Probe::Held,
        "the child's copy still holds the lock"
    );

    kill_and_reap(&mut child);
    assert_eq!(
        probe(&res).unwrap(),
        Probe::Free,
        "the lock ends with the last copy"
    );
}

#[test]
fn a_lent_lock_stays_held_by_the_parent_after_the_child_ended() {
    let _serial = serial();
    let dir = temp_dir("lend-parent");
    let res = resource(&dir, "lend-parent");
    let (handle, mut child) = lent_to_sleeper(&res);
    kill_and_reap(&mut child);
    assert_eq!(
        probe(&res).unwrap(),
        Probe::Held,
        "the parent's handle still holds the lock"
    );
    drop(handle);
    assert_eq!(
        probe(&res).unwrap(),
        Probe::Free,
        "the lock ends with the last copy"
    );
}

#[test]
fn a_shared_handle_is_not_lent() {
    let _serial = serial();
    let dir = temp_dir("lend-shared");
    let res = resource(&dir, "shared");
    let Acquire::Acquired(handle) = acquire(&res, Mode::Sh, Wait::Try, DEFAULT_KILL_WAIT_MS) else {
        panic!("lock not acquired")
    };
    let refused = handle.lend().expect_err("a shared handle is not lent");
    assert_eq!(refused.kind(), std::io::ErrorKind::InvalidInput);
    assert!(
        matches!(
            acquire(&res, Mode::Ex, Wait::Try, DEFAULT_KILL_WAIT_MS),
            Acquire::Held { .. }
        ),
        "the refused shared handle stays held"
    );
    drop(handle);
}

#[test]
fn a_lent_lock_is_never_borrowed_since_a_borrow_drain_would_end_the_child() {
    let _serial = serial();
    let dir = temp_dir("lend-borrow");
    let res = resource(&dir, "lend-borrow");
    let (handle, mut child) = lent_to_sleeper(&res);
    assert!(
        matches!(validate(&handle), Err(BorrowError::InvalidSpec(_))),
        "a lent handle is refused as a borrow source"
    );
    drop(handle);
    kill_and_reap(&mut child);
}
