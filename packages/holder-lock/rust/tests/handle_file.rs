//! A held lock's file can be duplicated for a handover, and the duplicate is the lock file itself.
#![cfg(unix)]
mod common;

use common::*;
use fgos_holder_lock::*;
use std::os::unix::fs::MetadataExt;

#[test]
fn a_held_handle_hands_out_a_duplicate_of_its_lock_file() {
    let _serial = serial();
    let dir = temp_dir("handle-file");
    let res = resource(&dir, "handover");
    let Acquire::Acquired(handle) = acquire(&res, Mode::Ex, Wait::Try, 2000) else {
        panic!("lock not acquired")
    };
    let copy = handle.try_clone_file().expect("duplicate");
    let on_disk = std::fs::metadata(handle.path()).expect("lock file");
    let copied = copy.metadata().expect("duplicate metadata");
    assert_eq!((copied.dev(), copied.ino()), (on_disk.dev(), on_disk.ino()));
    drop(copy);
    assert!(matches!(release(handle), Release::Released { .. }));
}
