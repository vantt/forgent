//! A registry lock path is valid and identical whichever spelling the root directory arrives in.
#![cfg(windows)]

mod common;

use fgos_holder_lock::{acquire, lock_path, Acquire, Mode, Resource, Wait};
use std::collections::BTreeMap;

fn params(dir: &str) -> BTreeMap<String, String> {
    BTreeMap::from([("fgosDir".to_owned(), dir.to_owned())])
}

#[test]
fn a_verbatim_and_a_plain_root_fill_the_same_openable_lock_path() {
    let _serial = common::serial();
    let root = common::temp_dir("lock-path-spelling").join(".fgos");
    std::fs::create_dir_all(&root).unwrap();
    let verbatim = std::fs::canonicalize(&root).unwrap();
    let plain = fgos_process::path::plain_path(&verbatim);
    assert!(verbatim.to_string_lossy().starts_with(r"\\?\"));

    let from_verbatim = lock_path("worktree-admin", &params(&verbatim.to_string_lossy())).unwrap();
    let from_plain = lock_path("worktree-admin", &params(&plain.to_string_lossy())).unwrap();
    assert_eq!(from_verbatim, from_plain);
    assert!(!from_verbatim.to_string_lossy().contains('/'));

    std::fs::create_dir_all(from_verbatim.parent().unwrap()).unwrap();
    match acquire(
        &Resource::new("worktree-admin", from_verbatim),
        Mode::Ex,
        Wait::Try,
        2000,
    ) {
        Acquire::Acquired(_) => {}
        other => panic!("{other:?}"),
    }
}
