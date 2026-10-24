//! Owning proof of `init` (spec section 6, first row): the file it creates holds the header and nothing
//! else, it never overwrites or shadows, and it takes the scope's lock. Real files in temp directories.
#![cfg(unix)]
mod common;

use std::fs;
use std::os::unix::fs::{symlink, PermissionsExt};
use std::path::Path;

use fgos_config::files::TOMBSTONE;
use fgos_config::scope::SourceKind;
use fgos_config::snapshot::{SessionClass, SnapshotRequest};
use fgos_config::write::init;
use fgos_yaml_doc::{parse, Profile};

const WAIT_MS: u64 = 2000;

fn roots(dir: &Path, class: SessionClass) -> SnapshotRequest {
    let project = dir.join("project");
    fs::create_dir_all(&project).unwrap();
    fs::create_dir_all(dir.join("home")).unwrap();
    SnapshotRequest {
        trusted_root: project.clone(),
        project_root: project,
        global_dir: dir.join("home/.fgos"),
        class,
    }
}

fn mode(path: &Path) -> u32 {
    fs::metadata(path).unwrap().permissions().mode() & 0o777
}

fn code(error: fgos_config::snapshot::SnapshotError) -> &'static str {
    match error {
        fgos_config::snapshot::SnapshotError::Refused(all) => all[0].code,
        other => panic!("not a refusal: {other:?}"),
    }
}

#[test]
fn a_new_file_holds_the_header_and_no_key() {
    let dir = common::temp("init", "header");
    let r = roots(&dir, SessionClass::Unconfined);
    let locks = dir.join("locks");
    for (target, file, file_mode) in [
        (SourceKind::Project, "project/.fgos/config.yaml", 0o644),
        (SourceKind::Global, "home/.fgos/config.yaml", 0o600),
    ] {
        let done = init(&r, target, &locks, WAIT_MS).unwrap();
        let bytes = fs::read(dir.join(file)).unwrap();
        assert!(done.created, "{file}");
        assert_eq!(done.revision.len(), 64, "{file}");
        assert_eq!(mode(&dir.join(file)), file_mode, "{file}");
        let text = String::from_utf8(bytes.clone()).unwrap();
        assert!(text.starts_with("# @fgos:v1\n"), "{file}: {text}");
        assert!(
            text.contains("fgos config standard") && text.ends_with("\n\n"),
            "{file}"
        );
        assert!(
            text.lines().all(|l| l.is_empty() || l.starts_with('#')),
            "{file}"
        );
        let doc = parse(&bytes, Profile::StrictConfig, file).unwrap();
        assert_eq!(doc.to_json().unwrap(), serde_json::Value::Null, "{file}");
    }
    assert_eq!(mode(&dir.join("home/.fgos")), 0o700);
}

#[test]
fn an_existing_file_is_kept_whether_yaml_or_legacy_json() {
    let dir = common::temp("init", "existing");
    let r = roots(&dir, SessionClass::Unconfined);
    let locks = dir.join("locks");
    let first = init(&r, SourceKind::Project, &locks, WAIT_MS).unwrap();
    let again = init(&r, SourceKind::Project, &locks, WAIT_MS).unwrap();
    assert!(first.created && !again.created);
    assert_eq!((first.file, again.file), ("config.yaml", "config.yaml"));
    assert_eq!(again.revision, first.revision);

    let fgos = r.project_root.join(".fgos");
    fs::remove_file(fgos.join("config.yaml")).unwrap();
    fs::write(fgos.join("config.json"), "{\"runner\":{}}").unwrap();
    let legacy = init(&r, SourceKind::Project, &locks, WAIT_MS).unwrap();
    assert!(!legacy.created);
    assert_eq!(legacy.file, "config.json", "the scope still holds its legacy file");
    assert!(
        !fgos.join("config.yaml").exists(),
        "a yaml file beside legacy json would shadow it"
    );

    // A tombstone is no source, so the scope has no file and init creates one.
    fs::write(fgos.join("config.json"), TOMBSTONE).unwrap();
    assert!(
        init(&r, SourceKind::Project, &locks, WAIT_MS)
            .unwrap()
            .created
    );
}

#[test]
fn racing_creators_make_exactly_one_file() {
    let dir = common::temp("init", "race");
    let r = roots(&dir, SessionClass::Unconfined);
    let locks = dir.join("locks");
    let made: Vec<bool> = std::thread::scope(|s| {
        let threads: Vec<_> = (0..6)
            .map(|_| {
                s.spawn(|| {
                    init(&r, SourceKind::Global, &locks, 10_000)
                        .unwrap()
                        .created
                })
            })
            .collect();
        threads.into_iter().map(|t| t.join().unwrap()).collect()
    });
    assert_eq!(
        made.iter().filter(|created| **created).count(),
        1,
        "{made:?}"
    );
}

#[test]
fn a_confined_session_an_accounts_target_and_a_symlinked_directory_are_refused() {
    let dir = common::temp("init", "refused");
    let locks = dir.join("locks");
    let confined = roots(&dir, SessionClass::Confined);
    let refused = init(&confined, SourceKind::Project, &locks, WAIT_MS).unwrap_err();
    assert_eq!(code(refused), "config-write-confined");
    assert!(!confined.project_root.join(".fgos").exists());

    let r = roots(&dir, SessionClass::Unconfined);
    let refused = init(&r, SourceKind::Accounts, &locks, WAIT_MS).unwrap_err();
    assert_eq!(code(refused), "config-key-out-of-scope");

    let elsewhere = dir.join("elsewhere");
    fs::create_dir_all(&elsewhere).unwrap();
    symlink(&elsewhere, r.project_root.join(".fgos")).unwrap();
    let refused = init(&r, SourceKind::Project, &locks, WAIT_MS).unwrap_err();
    assert_eq!(code(refused), "config-path-symlink");
    assert!(fs::read_dir(&elsewhere).unwrap().next().is_none());
}
