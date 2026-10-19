//! Open descriptors without advisory locks are visible diagnostic users.
#![cfg(target_os = "linux")]
use fgos_process::facts;
use std::fs::{self, OpenOptions};

#[test]
fn file_users_matches_inode_and_reports_identity_without_kernel_lock() {
    let dir = std::env::temp_dir().join(format!("fgos-file-users-{}", std::process::id()));
    fs::create_dir_all(&dir).unwrap();
    let path = dir.join("artifact");
    let file = OpenOptions::new().read(true).write(true).create_new(true).open(&path).unwrap();
    let (dev, ino) = facts::file_key(&file).unwrap();
    let own = facts::self_identity().unwrap();
    let users = facts::file_users(dev, ino).unwrap();
    let user = users.iter().find(|u| u.identity == own).expect("own open descriptor");
    assert!(user.exe.is_some());
    // Renaming a pathname does not change descriptor/inode membership.
    fs::rename(&path, dir.join("retained")).unwrap();
    assert!(facts::file_users(dev, ino).unwrap().iter().any(|u| u.identity == own));
    drop(file);
    assert!(!facts::file_users(dev, ino).unwrap().iter().any(|u| u.identity == own));
    fs::remove_dir_all(dir).unwrap();
}
