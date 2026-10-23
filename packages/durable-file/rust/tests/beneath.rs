//! Open-beneath on real directories: every position of a symlink, escape, type and revision.
#![cfg(unix)]
use fgos_durable_file::{
    ensure_dir_beneath, open_beneath, open_beneath_with, BeneathError, BeneathRefusal, Strategy,
};
use sha2::{Digest, Sha256};
use std::fs;
use std::os::unix::fs::{symlink, PermissionsExt};
use std::path::{Path, PathBuf};

fn tree(name: &str) -> PathBuf {
    let root = std::env::temp_dir().join(format!("fgos-beneath-{name}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&root);
    fs::create_dir_all(root.join("root/.fgos/sub")).unwrap();
    fs::create_dir_all(root.join("outside")).unwrap();
    fs::write(root.join("root/.fgos/config.yaml"), b"a: 1\n").unwrap();
    fs::write(root.join("outside/secret.yaml"), b"s: 1\n").unwrap();
    root
}

fn strategies() -> Vec<Strategy> {
    #[allow(unused_mut)]
    let mut all = vec![Strategy::Walk];
    #[cfg(any(target_os = "linux", target_os = "android"))]
    all.push(Strategy::Openat2);
    all
}

#[derive(Debug, PartialEq)]
enum Outcome {
    Missing,
    Opened,
    Refused(BeneathRefusal),
}

fn outcome(strategy: Strategy, root: &Path, relative: &str) -> Outcome {
    match open_beneath_with(strategy, root, Path::new(relative)) {
        Ok(None) => Outcome::Missing,
        Ok(Some(_)) => Outcome::Opened,
        Err(BeneathError::Refused(why)) => Outcome::Refused(why),
        Err(other) => panic!("unexpected io error for {relative}: {other}"),
    }
}

/// Both strategies must give the same answer for every case of the table.
#[test]
fn every_position_of_a_symlink_escape_or_odd_type_is_named_the_same_by_both_strategies() {
    let base = tree("table");
    let root = base.join("root");
    symlink(base.join("outside"), root.join("linked-dir")).unwrap();
    symlink(
        base.join("outside/secret.yaml"),
        root.join(".fgos/link.yaml"),
    )
    .unwrap();
    symlink(base.join("outside"), root.join(".fgos/sub/deep")).unwrap();
    symlink(base.join("outside"), base.join("root-link")).unwrap();
    symlink("config.yaml", root.join(".fgos/same-dir-link.yaml")).unwrap();
    fs::write(root.join("plain-file"), b"x").unwrap();
    let fifo = root.join(".fgos/fifo");
    assert!(std::process::Command::new("mkfifo")
        .arg(&fifo)
        .status()
        .unwrap()
        .success());
    let cases: [(&str, &str, Outcome); 14] = [
        ("root", ".fgos/config.yaml", Outcome::Opened),
        ("root", "./.fgos/config.yaml", Outcome::Opened),
        ("root", ".fgos/missing.yaml", Outcome::Missing),
        ("root", "nodir/config.yaml", Outcome::Missing),
        ("missing-root", ".fgos/config.yaml", Outcome::Missing),
        (
            "root",
            ".fgos/link.yaml",
            Outcome::Refused(BeneathRefusal::Symlink),
        ),
        (
            "root",
            ".fgos/same-dir-link.yaml",
            Outcome::Refused(BeneathRefusal::Symlink),
        ),
        (
            "root",
            "linked-dir/secret.yaml",
            Outcome::Refused(BeneathRefusal::Symlink),
        ),
        (
            "root",
            ".fgos/sub/deep/secret.yaml",
            Outcome::Refused(BeneathRefusal::Symlink),
        ),
        (
            "root-link",
            "secret.yaml",
            Outcome::Refused(BeneathRefusal::Symlink),
        ),
        (
            "root",
            "../outside/secret.yaml",
            Outcome::Refused(BeneathRefusal::Escape),
        ),
        (
            "root",
            "/etc/passwd",
            Outcome::Refused(BeneathRefusal::Escape),
        ),
        (
            "root",
            ".fgos/fifo",
            Outcome::Refused(BeneathRefusal::NotRegular),
        ),
        (
            "root",
            "plain-file/x.yaml",
            Outcome::Refused(BeneathRefusal::NotRegular),
        ),
    ];
    for strategy in strategies() {
        for (root_name, relative, expected) in &cases {
            let got = outcome(strategy, &base.join(root_name), relative);
            assert_eq!(&got, expected, "{strategy:?} {root_name} {relative}");
        }
    }
    // A directory leaf is not a regular file, and `open_beneath` (the public pick) agrees.
    assert!(matches!(
        open_beneath(&root, Path::new(".fgos/sub")),
        Err(BeneathError::Refused(BeneathRefusal::NotRegular))
    ));
}

#[test]
fn read_returns_the_bytes_and_the_sha256_of_exactly_those_bytes() {
    let base = tree("read");
    let opened = open_beneath(&base.join("root"), Path::new(".fgos/config.yaml"))
        .unwrap()
        .unwrap();
    let read = opened.read(1024).unwrap();
    assert_eq!(read.bytes, b"a: 1\n");
    assert_eq!(read.revision, format!("{:x}", Sha256::digest(b"a: 1\n")));
}

#[test]
fn revision_is_of_the_bytes_of_the_opened_descriptor_when_the_path_is_replaced_after_open() {
    let base = tree("replace");
    let root = base.join("root");
    for strategy in strategies() {
        let path = root.join(".fgos/config.yaml");
        fs::write(&path, b"old\n").unwrap();
        let opened = open_beneath_with(strategy, &root, Path::new(".fgos/config.yaml"))
            .unwrap()
            .unwrap();
        fs::write(root.join(".fgos/new"), b"new\n").unwrap();
        fs::rename(root.join(".fgos/new"), &path).unwrap();
        let read = opened.read(1024).unwrap();
        assert_eq!(read.bytes, b"old\n", "{strategy:?}");
        assert_eq!(read.revision, format!("{:x}", Sha256::digest(b"old\n")));
    }
}

#[test]
fn a_file_longer_than_the_bound_is_refused_and_one_at_the_bound_is_read() {
    let base = tree("bound");
    let open = || {
        open_beneath(&base.join("root"), Path::new(".fgos/config.yaml"))
            .unwrap()
            .unwrap()
    };
    assert!(matches!(
        open().read(4),
        Err(BeneathError::Refused(BeneathRefusal::TooLarge))
    ));
    assert_eq!(open().read(5).unwrap().bytes.len(), 5);
}

#[test]
fn mode_and_parent_identity_belong_to_the_opened_file_and_its_directory() {
    let base = tree("meta");
    let root = base.join("root");
    fs::set_permissions(
        root.join(".fgos/config.yaml"),
        fs::Permissions::from_mode(0o640),
    )
    .unwrap();
    let opened = open_beneath(&root, Path::new(".fgos/config.yaml"))
        .unwrap()
        .unwrap();
    assert_eq!(opened.mode().unwrap(), 0o640);
    let dir = ensure_dir_beneath(&root, Path::new(".fgos"), 0o755).unwrap();
    assert_eq!(opened.parent_identity(), dir.identity().unwrap());
}

#[test]
fn ensure_dir_creates_missing_directories_with_the_mode_under_umask_and_keeps_existing_ones() {
    use rustix::fs::Mode;
    let base = tree("ensure");
    let root = base.join("root");
    let mode_of = |p: &Path| fs::metadata(p).unwrap().permissions().mode() & 0o777;
    // One test owns the process umask: the three umask cases run in sequence here.
    for (umask, name) in [(0o022, "a"), (0o077, "b")] {
        let previous = rustix::process::umask(Mode::from_raw_mode(umask));
        let made = ensure_dir_beneath(&root, Path::new(&format!("private-{name}/inner")), 0o700);
        rustix::process::umask(previous);
        made.unwrap();
        assert_eq!(mode_of(&root.join(format!("private-{name}"))), 0o700);
    }
    fs::set_permissions(root.join("private-a"), fs::Permissions::from_mode(0o755)).unwrap();
    ensure_dir_beneath(&root, Path::new("private-a"), 0o700).unwrap();
    assert_eq!(mode_of(&root.join("private-a")), 0o755);
    symlink(base.join("outside"), root.join("evil")).unwrap();
    assert!(matches!(
        ensure_dir_beneath(&root, Path::new("evil/made"), 0o700),
        Err(BeneathError::Refused(BeneathRefusal::Symlink))
    ));
    assert!(!base.join("outside/made").exists());
}
