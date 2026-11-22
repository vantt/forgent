//! Replacing a file through a held directory descriptor: a swapped directory is never followed, the mode is the
//! caller's exactly whatever the umask, and a failed replace leaves no temporary. Its own test binary, because one
//! test here sets the process umask.
#![cfg(unix)]
use fgos_durable_file::{open_dir_beneath, BeneathError, BeneathRefusal, Dir};
use std::ffi::OsStr;
use std::fs;
use std::os::unix::fs::{symlink, MetadataExt, PermissionsExt};
use std::path::{Path, PathBuf};

fn base(name: &str) -> PathBuf {
    let base = std::env::temp_dir().join(format!("fgos-dir-replace-{name}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&base);
    fs::create_dir_all(base.join("root/plans")).unwrap();
    fs::create_dir_all(base.join("outside")).unwrap();
    fs::write(base.join("root/plans/backlog.md"), "old\n").unwrap();
    fs::write(base.join("outside/backlog.md"), "outside\n").unwrap();
    base
}

fn names(dir: &Path) -> Vec<String> {
    let mut names: Vec<String> = fs::read_dir(dir)
        .unwrap()
        .map(|e| e.unwrap().file_name().to_string_lossy().into_owned())
        .collect();
    names.sort();
    names
}

#[test]
fn a_replace_lands_in_the_held_directory_even_after_its_path_was_swapped_for_a_symlink() {
    let base = base("swap");
    let root = base.join("root");
    let dir = open_dir_beneath(&root, Path::new("plans"))
        .unwrap()
        .unwrap();
    // A concurrent host process moves the directory away and puts a symlink in its place.
    fs::rename(root.join("plans"), root.join("plans.moved")).unwrap();
    symlink(base.join("outside"), root.join("plans")).unwrap();
    dir.replace(OsStr::new("backlog.md"), b"new\n", 0o644)
        .unwrap();
    assert_eq!(
        fs::read_to_string(base.join("outside/backlog.md")).unwrap(),
        "outside\n"
    );
    assert_eq!(
        fs::read_to_string(root.join("plans.moved/backlog.md")).unwrap(),
        "new\n"
    );
    assert_eq!(
        names(&root.join("plans.moved")),
        ["backlog.md"],
        "no temporary left"
    );
    assert_eq!(names(&base.join("outside")), ["backlog.md"]);
    let _ = fs::remove_dir_all(&base);
}

#[test]
fn a_replace_gives_the_file_exactly_its_mode_under_a_strict_umask_and_renames_a_new_inode_over_it()
{
    use rustix::fs::Mode;
    let base = base("mode");
    let plans = base.join("root/plans");
    let before = fs::metadata(plans.join("backlog.md")).unwrap().ino();
    let dir = Dir::open(&plans).unwrap().unwrap();
    let previous = rustix::process::umask(Mode::from_raw_mode(0o077));
    let replaced = dir.replace(OsStr::new("backlog.md"), b"new\n", 0o644);
    rustix::process::umask(previous);
    replaced.unwrap();
    let after = fs::metadata(plans.join("backlog.md")).unwrap();
    assert_eq!(after.permissions().mode() & 0o777, 0o644);
    assert_ne!(after.ino(), before);
    assert_eq!(
        dir.file_mode(OsStr::new("backlog.md")).unwrap(),
        Some(0o644)
    );
    let _ = fs::remove_dir_all(&base);
}

#[test]
fn file_mode_and_replace_refuse_a_symlink_a_directory_and_anything_but_one_plain_name() {
    let base = base("refuse");
    let plans = base.join("root/plans");
    symlink("backlog.md", plans.join("link.md")).unwrap();
    fs::create_dir(plans.join("sub")).unwrap();
    let dir = Dir::open(&plans).unwrap().unwrap();
    let refusal = |name: &str| match dir.file_mode(OsStr::new(name)) {
        Err(BeneathError::Refused(why)) => Some(why),
        _ => None,
    };
    assert_eq!(refusal("link.md"), Some(BeneathRefusal::Symlink));
    assert_eq!(refusal("sub"), Some(BeneathRefusal::NotRegular));
    for bad in ["", ".", "..", "sub/x", "x/"] {
        assert_eq!(refusal(bad), Some(BeneathRefusal::Escape), "{bad:?}");
        assert_eq!(
            dir.replace(OsStr::new(bad), b"x", 0o644).unwrap_err().step,
            "name-check"
        );
    }
    assert_eq!(dir.file_mode(OsStr::new("missing.md")).unwrap(), None);
    // A rename over a directory fails; the temporary is removed.
    assert_eq!(
        dir.replace(OsStr::new("sub"), b"x", 0o644)
            .unwrap_err()
            .step,
        "name-installed"
    );
    assert_eq!(names(&plans), ["backlog.md", "link.md", "sub"]);
    assert!(
        Dir::open(&plans.join("link.md")).is_err(),
        "a symlink is never opened as a directory"
    );
    let _ = fs::remove_dir_all(&base);
}
