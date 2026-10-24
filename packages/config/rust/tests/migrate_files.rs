//! Owning proof of the migration's file behaviour in a real directory: the backup (private, create
//! only), the tombstone and the YAML file's modes, a symlinked `.fgos`, a crash after each stage
//! and the run that finishes it, a changed JSON file, and two writers. The decisions that shape
//! the YAML are owned by `golden_migrate.rs`.
#![cfg(unix)]
mod common;

use std::fs;
use std::io;
use std::os::unix::fs::{symlink, PermissionsExt};
use std::path::Path;

use fgos_config::detect::NoDetectors;
use fgos_config::files::TOMBSTONE;
use fgos_config::migrate::{project, MigrateStep, MigrationReport};
use fgos_config::snapshot::{Context, SnapshotError, SnapshotRequest};
use serde_json::json;

const JSON: &str = r#"{"gateBypass": {"level": "light"}}"#;

fn mode(path: &Path) -> u32 {
    fs::metadata(path).unwrap().permissions().mode() & 0o777
}

struct Fixture {
    dir: std::path::PathBuf,
    roots: SnapshotRequest,
    schemas: fgos_config::schema::Schemas,
    standard: fgos_config::standard::Standard,
}

impl Fixture {
    fn new(id: &str) -> Fixture {
        let fixture = common::fixture("migrate.v1.json");
        let (schemas, standard) = common::schemas_and_standard(&fixture);
        let dir = common::temp("migrate-files", id);
        fs::create_dir_all(dir.join("project/.fgos")).unwrap();
        fs::create_dir_all(dir.join("home/.fgos")).unwrap();
        fs::write(dir.join("project/.fgos/config.json"), JSON).unwrap();
        let roots = common::lay_out(&dir, &json!({}));
        Fixture {
            dir,
            roots,
            schemas,
            standard,
        }
    }

    fn run(
        &self,
        wait_ms: u64,
        observe: impl FnMut(MigrateStep) -> io::Result<()>,
    ) -> Result<MigrationReport, SnapshotError> {
        let ctx = Context {
            schemas: &self.schemas,
            standard: &self.standard,
            digest: "d",
            detectors: &NoDetectors,
        };
        let mut opts = common::migrate_options(&self.dir, false, false);
        opts.lock_wait_ms = wait_ms;
        project(
            &ctx,
            &self.roots,
            &common::writer(&json!({"session": "vantt"})),
            &opts,
            observe,
        )
    }

    fn file(&self, rel: &str) -> String {
        fs::read_to_string(self.dir.join("project/.fgos").join(rel)).unwrap_or_default()
    }
}

fn code(result: Result<MigrationReport, SnapshotError>) -> (&'static str, Option<String>) {
    match result {
        Err(SnapshotError::Refused(found)) => {
            let keyword = found[0].detail.as_ref().and_then(|d| d.keyword.clone());
            (found[0].code, keyword)
        }
        other => panic!("expected a refusal, got {other:?}"),
    }
}

#[test]
fn a_run_leaves_a_private_backup_a_tombstone_and_a_readable_yaml_file() {
    let f = Fixture::new("modes");
    fs::set_permissions(
        f.dir.join("project/.fgos/config.json"),
        fs::Permissions::from_mode(0o640),
    )
    .unwrap();
    let report = f.run(0, |_| Ok(())).unwrap();
    let backup = f.dir.join("project").join(report.backup.unwrap());
    assert_eq!(fs::read_to_string(&backup).unwrap(), JSON);
    assert_eq!(
        (mode(&backup), mode(backup.parent().unwrap())),
        (0o600, 0o700)
    );
    assert_eq!(f.file("config.json"), format!("{TOMBSTONE}\n"));
    assert_eq!(
        mode(&f.dir.join("project/.fgos/config.json")),
        0o640,
        "the tombstone keeps the mode"
    );
    assert_eq!(mode(&f.dir.join("project/.fgos/config.yaml")), 0o644);
    let again = f.run(0, |_| Ok(())).unwrap();
    assert!(
        again.already_migrated && again.backup.is_none(),
        "a second run does nothing"
    );
}

#[test]
fn a_symlinked_fgos_directory_is_refused_and_nothing_is_written() {
    let f = Fixture::new("symlink");
    let elsewhere = f.dir.join("elsewhere");
    fs::rename(f.dir.join("project/.fgos"), &elsewhere).unwrap();
    symlink(&elsewhere, f.dir.join("project/.fgos")).unwrap();
    assert_eq!(code(f.run(0, |_| Ok(()))).0, "config-path-symlink");
    assert!(!elsewhere.join("config.yaml").exists() && !elsewhere.join("runtime").exists());
}

#[test]
fn a_crash_after_the_backup_leaves_the_json_file_and_the_next_run_completes() {
    let f = Fixture::new("crash-backup");
    let crash = f.run(0, |step| match step {
        MigrateStep::BackupWritten => Err(io::Error::other("crash")),
        _ => Ok(()),
    });
    assert!(matches!(crash, Err(SnapshotError::Io(_))));
    assert_eq!(f.file("config.json"), JSON);
    assert!(!f.dir.join("project/.fgos/config.yaml").exists());
    let report = f.run(0, |_| Ok(())).unwrap();
    assert!(!report.resumed, "nothing but the backup existed");
    assert_eq!(f.file("config.json"), format!("{TOMBSTONE}\n"));
}

#[test]
fn a_crash_between_the_yaml_file_and_the_tombstone_is_finished_by_the_next_run() {
    let f = Fixture::new("crash-yaml");
    let crash = f.run(0, |step| match step {
        MigrateStep::SecondCheck => Err(io::Error::other("crash")),
        _ => Ok(()),
    });
    assert!(matches!(crash, Err(SnapshotError::Io(_))));
    let yaml = f.file("config.yaml");
    assert!(
        yaml.contains("level: light") && f.file("config.json") == JSON,
        "both files, as D11 says"
    );
    let report = f.run(0, |_| Ok(())).unwrap();
    assert!(report.resumed);
    assert_eq!(
        (f.file("config.json"), f.file("config.yaml")),
        (format!("{TOMBSTONE}\n"), yaml)
    );
}

#[test]
fn a_json_file_edited_after_it_was_read_is_a_conflict_and_the_tombstone_is_not_written() {
    let f = Fixture::new("edited");
    let json_path = f.dir.join("project/.fgos/config.json");
    let got = f.run(0, |step| {
        if step == MigrateStep::YamlCreated {
            fs::write(&json_path, r#"{"gateBypass": {"level": "heavy"}}"#)?;
        }
        Ok(())
    });
    assert_eq!(
        code(got),
        ("config-write-conflict", Some("revision-changed".into()))
    );
    assert!(
        f.file("config.json").contains("heavy"),
        "the person's edit is untouched"
    );
}

#[test]
fn a_second_writer_gets_a_conflict_while_the_first_holds_the_lock() {
    let f = Fixture::new("two-writers");
    let report = f
        .run(0, |step| {
            if step == MigrateStep::BackupWritten {
                let other = f.run(0, |_| Ok(()));
                assert_eq!(
                    code(other),
                    ("config-write-conflict", Some("lock-held".into()))
                );
            }
            Ok(())
        })
        .unwrap();
    assert!(report.backup.is_some());
    assert_eq!(f.file("config.json"), format!("{TOMBSTONE}\n"));
}

#[test]
fn a_backup_name_already_holding_other_bytes_is_not_trusted() {
    let f = Fixture::new("backup-differs");
    let first = f.run(0, |_| Ok(())).unwrap();
    let backup = f.dir.join("project").join(first.backup.unwrap());
    // Put the JSON file back (as if restored) and corrupt its backup: the same name now holds other bytes.
    fs::remove_file(f.dir.join("project/.fgos/config.yaml")).unwrap();
    fs::write(f.dir.join("project/.fgos/config.json"), JSON).unwrap();
    fs::set_permissions(&backup, fs::Permissions::from_mode(0o600)).unwrap();
    fs::write(&backup, "other").unwrap();
    assert_eq!(
        code(f.run(0, |_| Ok(()))),
        ("config-write-conflict", Some("backup-differs".into()))
    );
    assert_eq!(f.file("config.json"), JSON);
    fs::write(&backup, JSON).unwrap();
    assert!(
        f.run(0, |_| Ok(())).is_ok(),
        "an identical backup under the name is fine"
    );
}
