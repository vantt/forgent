mod common;
use common::FAKE;
use fgos_secrets::{CheckFailure, FileSource, Lookup, SecretSource};
use std::fs;
use std::os::unix::fs::{symlink, MetadataExt, PermissionsExt};
use std::path::{Path, PathBuf};

struct Dir(PathBuf);
impl Dir {
    fn new(tag: &str) -> Self {
        let p = std::env::temp_dir().join(format!("fgos-secrets-{tag}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&p);
        fs::create_dir_all(&p).unwrap();
        Dir(p)
    }
}
impl Drop for Dir {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

fn write(path: &Path, mode: u32) {
    fs::write(
        path,
        format!("# comment\nexport OTHER=x\nAPI_KEY={FAKE}\nQUOTED=\"two words\"\n"),
    )
    .unwrap();
    fs::set_permissions(path, fs::Permissions::from_mode(mode)).unwrap();
}

#[test]
fn reads_a_0600_file_owned_by_the_user() {
    let dir = Dir::new("ok");
    let path = dir.0.join("secrets.env");
    write(&path, 0o600);
    let src = FileSource::new(&path);
    assert!(src.check().is_ok());
    assert!(src.has("API_KEY"));
    assert!(!src.has("NOPE"));
    assert!(matches!(src.get("NOPE"), Lookup::Absent));
    match src.get("API_KEY") {
        Lookup::Found(v) => assert_eq!(v.expose(), FAKE),
        other => panic!("{other:?}"),
    }
    match src.get("QUOTED") {
        Lookup::Found(v) => assert_eq!(v.expose(), "two words"),
        other => panic!("{other:?}"),
    }
    assert!(src.describe().contains("secrets.env"));
}

#[test]
fn wider_mode_fails_check_and_is_not_read() {
    for mode in [0o640, 0o604, 0o644, 0o660, 0o666] {
        let dir = Dir::new("mode");
        let path = dir.0.join("secrets.env");
        write(&path, mode);
        let src = FileSource::new(&path);
        assert!(
            matches!(src.check(), Err(CheckFailure::ModeTooWide { .. })),
            "{mode:o}"
        );
        assert!(
            matches!(src.get("API_KEY"), Lookup::Unavailable),
            "{mode:o}"
        );
        assert!(!src.has("API_KEY"));
    }
}

#[test]
fn wrong_owner_fails_check_and_is_not_read() {
    let dir = Dir::new("owner");
    let path = dir.0.join("secrets.env");
    write(&path, 0o600);
    let actual = fs::metadata(&path).unwrap().uid();
    let src = FileSource::with_owner(&path, actual + 1);
    assert!(matches!(src.check(), Err(CheckFailure::WrongOwner { .. })));
    assert!(matches!(src.get("API_KEY"), Lookup::Unavailable));
}

#[test]
fn symlink_fails_check_and_is_not_read() {
    let dir = Dir::new("link");
    let real = dir.0.join("real.env");
    write(&real, 0o600);
    let link = dir.0.join("link.env");
    symlink(&real, &link).unwrap();
    let src = FileSource::new(&link);
    assert!(matches!(src.check(), Err(CheckFailure::Symlink(_))));
    assert!(matches!(src.get("API_KEY"), Lookup::Unavailable));
}

#[test]
fn missing_file_and_directory_are_not_read() {
    let dir = Dir::new("missing");
    let src = FileSource::new(dir.0.join("absent.env"));
    assert!(matches!(src.check(), Err(CheckFailure::Missing(_))));
    assert!(matches!(src.get("API_KEY"), Lookup::Unavailable));
    let src = FileSource::new(&dir.0);
    assert!(matches!(src.check(), Err(CheckFailure::NotRegularFile(_))));
}

#[test]
fn file_is_never_rewritten() {
    let dir = Dir::new("ro");
    let path = dir.0.join("secrets.env");
    write(&path, 0o600);
    let before = (
        fs::read(&path).unwrap(),
        fs::metadata(&path).unwrap().modified().unwrap(),
    );
    let src = FileSource::new(&path);
    let _ = (
        src.check(),
        src.get("API_KEY"),
        src.has("API_KEY"),
        src.describe(),
    );
    let after = (
        fs::read(&path).unwrap(),
        fs::metadata(&path).unwrap().modified().unwrap(),
    );
    assert_eq!(before, after);
}

#[test]
fn no_output_path_carries_value_length_or_prefix() {
    let dir = Dir::new("leak");
    let path = dir.0.join("secrets.env");
    write(&path, 0o644);
    let src = FileSource::new(&path);
    let failure = src.check().unwrap_err().to_string();
    let described = src.describe();
    let debug = format!("{src:?} {:?}", src.get("API_KEY"));
    for text in [failure, described, debug] {
        assert!(!text.contains(FAKE) && !text.contains("fake"), "{text}");
    }
    // With the file fixed, the value is still absent from describe and Debug.
    fs::set_permissions(&path, fs::Permissions::from_mode(0o600)).unwrap();
    let debug = format!("{:?} {}", src.get("API_KEY"), src.describe());
    assert!(!debug.contains(FAKE) && !debug.contains("fake"), "{debug}");
}
