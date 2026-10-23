//! Wiring of Durable File's open-beneath into the config failure ids, on real directories. The
//! owning proofs of the no-follow open itself are in fgos-durable-file's tests.
#![cfg(unix)]
use fgos_config::files::{check_mode, read_beneath, FileError, ModeFinding, PRIVATE_FILE_MODE};
use std::fs;
use std::os::unix::fs::{symlink, PermissionsExt};
use std::path::{Path, PathBuf};

fn tree(name: &str) -> PathBuf {
    let base =
        std::env::temp_dir().join(format!("fgos-config-files-{name}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&base);
    fs::create_dir_all(base.join("root/.fgos")).unwrap();
    fs::create_dir_all(base.join("outside")).unwrap();
    fs::write(base.join("root/.fgos/config.yaml"), b"a: 1\n").unwrap();
    fs::write(base.join("outside/config.yaml"), b"s: 1\n").unwrap();
    base
}

fn code(result: Result<impl std::fmt::Debug, FileError>) -> String {
    match result {
        Err(FileError::Refused(refusal)) => refusal.to_string(),
        other => panic!("expected a refusal, got {other:?}"),
    }
}

#[test]
fn a_regular_file_is_read_with_the_revision_of_its_bytes_and_a_missing_one_is_not_an_error() {
    let base = tree("read");
    let root = base.join("root");
    let loaded = read_beneath(&root, Path::new(".fgos/config.yaml"), 64)
        .unwrap()
        .unwrap();
    assert_eq!(loaded.bytes, b"a: 1\n");
    assert_eq!(loaded.revision.len(), 64);
    assert!(read_beneath(&root, Path::new(".fgos/other.yaml"), 64)
        .unwrap()
        .is_none());
    assert!(read_beneath(&root, Path::new("nodir/config.yaml"), 64)
        .unwrap()
        .is_none());
}

#[test]
fn a_symlinked_file_directory_or_root_and_a_path_leaving_the_root_are_config_path_symlink() {
    let base = tree("symlink");
    let root = base.join("root");
    symlink(
        base.join("outside/config.yaml"),
        root.join(".fgos/link.yaml"),
    )
    .unwrap();
    symlink(base.join("outside"), root.join("linked")).unwrap();
    symlink(base.join("root"), base.join("root-link")).unwrap();
    for (root, relative) in [
        (&root, ".fgos/link.yaml"),
        (&root, "linked/config.yaml"),
        (&base.join("root-link"), ".fgos/config.yaml"),
        (&root, "../outside/config.yaml"),
    ] {
        let text = code(read_beneath(root, Path::new(relative), 64));
        assert!(
            text.starts_with("config-path-symlink file="),
            "{relative}: {text}"
        );
    }
}

#[test]
fn a_file_over_the_bound_is_refused_before_any_parse_without_echoing_content() {
    let base = tree("bound");
    let text = code(read_beneath(
        &base.join("root"),
        Path::new(".fgos/config.yaml"),
        4,
    ));
    assert!(
        text.starts_with("config-parse file=.fgos/config.yaml"),
        "{text}"
    );
    assert!(
        text.contains("input-too-large") && !text.contains("a: 1"),
        "{text}"
    );
}

#[test]
fn a_loose_mode_is_a_finding_not_a_refusal_and_the_expected_mode_has_none() {
    let base = tree("mode");
    let root = base.join("root");
    fs::set_permissions(
        root.join(".fgos/config.yaml"),
        fs::Permissions::from_mode(0o644),
    )
    .unwrap();
    let loaded = read_beneath(&root, Path::new(".fgos/config.yaml"), 64)
        .unwrap()
        .unwrap();
    assert_eq!(
        check_mode(".fgos/config.yaml", loaded.mode, PRIVATE_FILE_MODE),
        Some(ModeFinding {
            file: ".fgos/config.yaml".into(),
            expected: 0o600,
            actual: 0o644
        })
    );
    assert_eq!(check_mode("x", 0o600, PRIVATE_FILE_MODE), None);
}
