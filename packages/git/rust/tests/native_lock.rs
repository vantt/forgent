#![cfg(unix)]
include!("support/land.rs");
use fgos_git::wal::{FileSystem, Outcome, Wal};
use std::io;
use std::process::Stdio;

struct StopAtIntent;
impl FileSystem for StopAtIntent {
    fn checkpoint(&self, step: &'static str) -> io::Result<()> {
        if step == "record-install" {
            return Err(io::Error::other("lost coordinator"));
        }
        Ok(())
    }
}
fn pending(f: &Fixture) {
    let req = RestoreRequest {
        expected_head: f.request.target.clone(),
        target: f.request.source.clone(),
        reason: "repair test".into(),
        reapply_local_delta: false,
        allowed_replacements: vec![],
    };
    f.driver
        .apply_restore_with_filesystem(
            &f.repo,
            vec![],
            &req,
            "fixture",
            "interrupted",
            &StopAtIntent,
        )
        .unwrap_err();
    assert!(Wal::open(&f.repo)
        .unwrap()
        .inspect("interrupted")
        .unwrap()
        .outcome()
        .is_none());
    let _ = evidence as fn(&LandSession) -> LandEvidence;
}
fn owned(f: &Fixture) -> (std::process::Child, fs::File) {
    let path = f.main.join(".git/index.lock");
    let mut file = fs::OpenOptions::new()
        .read(true)
        .write(true)
        .create_new(true)
        .open(&path)
        .unwrap();
    use io::Write;
    file.write_all(b"retained native lock bytes\0\xff").unwrap();
    file.sync_all().unwrap();
    // The operation creates the artifact exclusively and passes the exact fd to its child.
    let child = Command::new("sleep")
        .arg("60")
        .stdout(Stdio::from(file.try_clone().unwrap()))
        .spawn()
        .unwrap();
    let identity = fgos_process::facts::identity_of(fgos_process::ProcId(child.id())).unwrap();
    f.driver
        .record_owned_index_lock(&f.repo, vec![], "interrupted", &identity, &file)
        .unwrap();
    (child, file)
}
#[test]
fn live_child_preserved_then_dead_exact_artifact_quarantined_and_recovery_proceeds() {
    let f = Fixture::new();
    pending(&f);
    let (mut child, _fd) = owned(&f);
    let report = f
        .driver
        .repair_native_index_lock(&f.repo, vec![], "interrupted")
        .unwrap();
    assert_eq!(report.status, "ownerLiveOrUnknown");
    assert!(f
        .driver
        .recover_restore(&f.repo, vec![], "fixture", "interrupted")
        .unwrap_err()
        .cause
        .contains("repairNativeIndexLock"));
    child.kill().unwrap();
    child.wait().unwrap();
    let report = f
        .driver
        .repair_native_index_lock(&f.repo, vec![], "interrupted")
        .unwrap();
    assert_eq!(report.status, "quarantined");
    assert_eq!(
        fs::read(report.quarantine_path.unwrap()).unwrap(),
        b"retained native lock bytes\0\xff"
    );
    assert_eq!(
        f.driver
            .recover_restore(&f.repo, vec![], "fixture", "interrupted")
            .unwrap()
            .outcome,
        Outcome::AbandonedBeforeAttempt
    );
    assert_eq!(
        f.driver
            .repair_native_index_lock(&f.repo, vec![], "interrupted")
            .unwrap()
            .status,
        "absent"
    );
}
#[test]
fn unknown_external_lock_has_inspection_report_and_is_never_moved() {
    let f = Fixture::new();
    pending(&f);
    let path = f.main.join(".git/index.lock");
    fs::write(&path, b"external").unwrap();
    let report = f
        .driver
        .repair_native_index_lock(&f.repo, vec![], "interrupted")
        .unwrap();
    assert_eq!(report.status, "inspectedRepairRequired");
    assert!(report.inspection.contains("unknown external"));
    assert_eq!(fs::read(path).unwrap(), b"external");
    assert!(f
        .driver
        .recover_restore(&f.repo, vec![], "fixture", "interrupted")
        .is_err());
}
struct Swap(PathBuf);
impl FileSystem for Swap {
    fn checkpoint(&self, step: &'static str) -> io::Result<()> {
        if step == "native-lock-before-move" {
            fs::rename(&self.0, self.0.with_extension("original"))?;
            fs::write(&self.0, b"substituted inode")?;
        }
        Ok(())
    }
}
#[test]
fn immediate_inode_swap_refuses_and_preserves_both_files() {
    let f = Fixture::new();
    pending(&f);
    let (mut child, _fd) = owned(&f);
    child.kill().unwrap();
    child.wait().unwrap();
    let path = f.main.join(".git/index.lock");
    let report = f
        .driver
        .repair_native_index_lock_with_filesystem(
            &f.repo,
            vec![],
            "interrupted",
            &Swap(path.clone()),
        )
        .unwrap();
    assert_eq!(report.status, "inspectedRepairRequired");
    assert!(report.inspection.contains("immediately before move"));
    assert_eq!(fs::read(&path).unwrap(), b"substituted inode");
    assert_eq!(
        fs::read(path.with_extension("original")).unwrap(),
        b"retained native lock bytes\0\xff"
    );
}
#[test]
fn changed_contents_on_same_inode_are_preserved() {
    let f = Fixture::new();
    pending(&f);
    let (mut child, _fd) = owned(&f);
    child.kill().unwrap();
    child.wait().unwrap();
    let path = f.main.join(".git/index.lock");
    fs::write(&path, b"different state").unwrap();
    assert_eq!(
        f.driver
            .repair_native_index_lock(&f.repo, vec![], "interrupted")
            .unwrap()
            .status,
        "inspectedRepairRequired"
    );
    assert_eq!(fs::read(path).unwrap(), b"different state");
}

struct InterruptBeforeMove;
impl FileSystem for InterruptBeforeMove {
    fn checkpoint(&self, step: &'static str) -> io::Result<()> {
        if step == "native-lock-before-move" {
            return Err(io::Error::other("lost repairer"));
        }
        Ok(())
    }
}
#[test]
fn repair_retries_after_destination_reservation_without_overwriting_evidence() {
    let f = Fixture::new();
    pending(&f);
    let (mut child, _fd) = owned(&f);
    child.kill().unwrap();
    child.wait().unwrap();
    assert!(f
        .driver
        .repair_native_index_lock_with_filesystem(
            &f.repo,
            vec![],
            "interrupted",
            &InterruptBeforeMove
        )
        .is_err());
    let report = f
        .driver
        .repair_native_index_lock(&f.repo, vec![], "interrupted")
        .unwrap();
    assert_eq!(report.status, "quarantined");
    assert_eq!(
        fs::read(report.quarantine_path.unwrap()).unwrap(),
        b"retained native lock bytes\0\xff"
    );
}

struct OccupyQuarantine(PathBuf);
impl FileSystem for OccupyQuarantine {
    fn checkpoint(&self, step: &'static str) -> io::Result<()> {
        if step == "native-lock-before-move" {
            let destination = fs::read_dir(&self.0)?.next().unwrap()?.path();
            fs::write(
                destination.join("index.lock"),
                b"foreign quarantine evidence",
            )?;
        }
        Ok(())
    }
}
#[test]
fn a_concurrent_quarantine_destination_is_preserved_without_moving_the_source() {
    let f = Fixture::new();
    pending(&f);
    let (mut child, _fd) = owned(&f);
    child.kill().unwrap();
    child.wait().unwrap();
    let directory = f.main.join(".git/fgos/git/native-lock-quarantine");
    let err = f
        .driver
        .repair_native_index_lock_with_filesystem(
            &f.repo,
            vec![],
            "interrupted",
            &OccupyQuarantine(directory.clone()),
        )
        .unwrap_err();
    assert!(err.cause.contains("destination-preserved"));
    assert_eq!(
        fs::read(f.main.join(".git/index.lock")).unwrap(),
        b"retained native lock bytes\0\xff"
    );
    let destination = fs::read_dir(directory)
        .unwrap()
        .next()
        .unwrap()
        .unwrap()
        .path();
    assert_eq!(
        fs::read(destination.join("index.lock")).unwrap(),
        b"foreign quarantine evidence"
    );
}
