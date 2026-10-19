use fgos_git::*;
use std::{
    fs,
    path::{Path, PathBuf},
    process::Command,
    sync::atomic::{AtomicU64, Ordering},
};
static SERIAL: AtomicU64 = AtomicU64::new(0);
fn git(root: &Path, args: &[&str]) -> String {
    let o = Command::new("git")
        .arg("-C")
        .arg(root)
        .args(args)
        .output()
        .unwrap();
    assert!(
        o.status.success(),
        "{args:?}: {}",
        String::from_utf8_lossy(&o.stderr)
    );
    String::from_utf8(o.stdout).unwrap().trim().into()
}
struct Fixture {
    temp: PathBuf,
    main: PathBuf,
    driver: GitDriver,
    repo: RepoHandle,
    request: LandRequest,
}
impl Fixture {
    fn new() -> Self {
        use std::os::unix::fs::PermissionsExt;
        let temp = std::env::temp_dir().join(format!(
            "fgos-land-{}-{}",
            std::process::id(),
            SERIAL.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir(&temp).unwrap();
        fs::set_permissions(&temp, fs::Permissions::from_mode(0o700)).unwrap();
        let main = temp.join("repo");
        fs::create_dir(&main).unwrap();
        git(&main, &["init", "-q", "--initial-branch=trunk"]);
        git(&main, &["config", "user.name", "Fixture"]);
        git(&main, &["config", "user.email", "fixture@example.invalid"]);
        fs::write(main.join("a"), "base\n").unwrap();
        fs::write(main.join("b"), "base\n").unwrap();
        git(&main, &["add", "."]);
        git(&main, &["commit", "-qm", "base"]);
        let target = git(&main, &["rev-parse", "HEAD"]);
        git(&main, &["checkout", "-qb", "source"]);
        fs::write(main.join("a"), "incoming\n").unwrap();
        git(&main, &["commit", "-qam", "source"]);
        let source = git(&main, &["rev-parse", "HEAD"]);
        git(&main, &["checkout", "-q", "trunk"]);
        let fence = main.join(".fgos/locks/activation.lock");
        fs::create_dir_all(&fence).unwrap();
        fs::write(
            fence.join("TOMBSTONE"),
            r#"{"lock":"activation","by":"fgos git","at":"fixture"}"#,
        )
        .unwrap();
        let driver = GitDriver::new(&temp).unwrap();
        let repo = match driver.resolve_repo(&main, &main).unwrap() {
            ResolveRepo::Repository(r) => r,
            _ => panic!(),
        };
        let request = LandRequest {
            source,
            target,
            destination: "refs/heads/trunk".into(),
            message: "consumer land".into(),
            squash: false,
            footprint: Some(vec![]),
            subtree: None,
            files: vec![],
        };
        Self {
            temp,
            main,
            driver,
            repo,
            request,
        }
    }
}
impl Drop for Fixture {
    fn drop(&mut self) {
        fs::remove_dir_all(&self.temp).unwrap();
    }
}
fn evidence(s: &LandSession) -> LandEvidence {
    let c = s.candidate().unwrap();
    LandEvidence {
        source: c.source.clone(),
        target: c.target.clone(),
        candidate: c.candidate.clone(),
        tree_digest: c.tree_digest.clone(),
        evidence_digest: "consumer-test-run".into(),
    }
}
