#![cfg(unix)]
include!("support/land.rs");
use fgos_git::wal::{FileSystem, Outcome, Wal};
use std::io::{Read, Write};
use std::process::Stdio;

#[test]
fn hooks_fill_empty_preserve_custom_diagnose_and_remove_only_owned() {
    let f = Fixture::new();
    assert!(!f.request.target.is_empty());
    let path = f.main.join(".githooks");
    let report = f.driver.ensure_hooks(&f.repo, &path, "hooks").unwrap();
    assert_eq!(report.status, "owned");
    assert!(report.enforcement_missing);
    assert_eq!(report.provenance.as_deref(), Some("hooks"));
    assert_eq!(
        git(&f.main, &["config", "core.hooksPath"]),
        path.to_str().unwrap()
    );
    let again = f.driver.ensure_hooks(&f.repo, &path, "hooks").unwrap();
    assert_eq!(again.provenance, report.provenance);
    assert_eq!(
        f.driver
            .remove_owned_hooks_config(&f.repo, &path, "remove")
            .unwrap()
            .status,
        "empty"
    );
    // Reinstall the exact same text externally: a removed ownership record does not authorize it.
    git(
        &f.main,
        &["config", "core.hooksPath", path.to_str().unwrap()],
    );
    assert_eq!(
        f.driver
            .remove_owned_hooks_config(&f.repo, &path, "not-owned")
            .unwrap()
            .status,
        "skippedExisting"
    );
    git(&f.main, &["config", "core.hooksPath", "/custom/hooks"]);
    assert_eq!(
        f.driver
            .ensure_hooks(&f.repo, &path, "custom")
            .unwrap()
            .status,
        "skippedExisting"
    );
    assert_eq!(
        f.driver
            .remove_owned_hooks_config(&f.repo, &path, "custom-remove")
            .unwrap()
            .status,
        "skippedExisting"
    );
    assert_eq!(git(&f.main, &["config", "core.hooksPath"]), "/custom/hooks");
    assert!(Wal::open(&f.repo).unwrap().inspect("custom").is_err());
    let _ = evidence as fn(&LandSession) -> LandEvidence;
}
struct EditConfig(PathBuf);
impl FileSystem for EditConfig {
    fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
        if step == "config-staged" {
            let mut file = fs::OpenOptions::new().append(true).open(&self.0)?;
            file.write_all(b"\n[core]\n\thooksPath = /concurrent/hooks\n")?;
        }
        Ok(())
    }
}
#[test]
fn exact_old_guard_preserves_concurrent_edit_and_abandons_pre_attempt() {
    let f = Fixture::new();
    let err = f
        .driver
        .ensure_hooks_with_filesystem(
            &f.repo,
            &f.main.join(".githooks"),
            "race",
            &EditConfig(f.main.join(".git/config")),
        )
        .unwrap_err();
    assert_eq!(err.cause, "config-change-stale");
    assert_eq!(
        git(&f.main, &["config", "core.hooksPath"]),
        "/concurrent/hooks"
    );
    assert!(matches!(
        Wal::open(&f.repo)
            .unwrap()
            .inspect("race")
            .unwrap()
            .outcome(),
        Some(Outcome::AbandonedBeforeAttempt)
    ));
    assert!(!f.main.join(".git/config.lock").exists());
}
struct KillAt {
    name: String,
    record: usize,
    seen: std::sync::atomic::AtomicUsize,
}
impl FileSystem for KillAt {
    fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
        let at_record = step == "record-install"
            && self.seen.fetch_add(1, Ordering::Relaxed) + 1 == self.record;
        if step == self.name || at_record {
            unsafe {
                libc::kill(libc::getpid(), libc::SIGKILL);
            }
        }
        Ok(())
    }
}
#[test]
#[ignore = "real SIGKILL child invoked by config crash test"]
fn config_crash_child() {
    let mut input = String::new();
    std::io::stdin().read_to_string(&mut input).unwrap();
    let args: serde_json::Value = serde_json::from_str(&input).unwrap();
    let main = Path::new(args["main"].as_str().unwrap());
    let driver = GitDriver::new(Path::new(args["temp"].as_str().unwrap())).unwrap();
    let repo = match driver.resolve_repo(main, main).unwrap() {
        ResolveRepo::Repository(r) => r,
        _ => panic!(),
    };
    driver
        .ensure_hooks_with_filesystem(
            &repo,
            &main.join(".githooks"),
            "crash",
            &KillAt {
                name: args["at"].as_str().unwrap().into(),
                record: args["record"].as_u64().unwrap() as usize,
                seen: std::sync::atomic::AtomicUsize::new(0),
            },
        )
        .unwrap();
}
#[test]
fn dead_config_writer_recovers_wal_before_and_after_effect_without_replay() {
    for (at, record, installed) in [
        ("never", 1, false),
        ("config-staged", 0, false),
        ("never", 4, false),
        ("config-replaced", 0, true),
    ] {
        let f = Fixture::new();
        let mut child = Command::new(std::env::current_exe().unwrap())
            .args(["--exact", "config_crash_child", "--ignored", "--nocapture"])
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .unwrap();
        child
            .stdin
            .take()
            .unwrap()
            .write_all(
                serde_json::to_string(
                    &serde_json::json!({"main":f.main,"temp":f.temp,"at":at,"record":record}),
                )
                .unwrap()
                .as_bytes(),
            )
            .unwrap();
        let out = child.wait_with_output().unwrap();
        assert!(
            !out.status.success(),
            "child did not crash: {}",
            String::from_utf8_lossy(&out.stderr)
        );
        let report = f.driver.recover_hooks_config(&f.repo, "crash").unwrap();
        assert_eq!(report.status == "owned", installed, "{at}/{record}");
        assert!(!f.main.join(".git/config.lock").exists());
        assert!(Wal::open(&f.repo)
            .unwrap()
            .inspect("crash")
            .unwrap()
            .outcome()
            .is_some());
        // Recovery is idempotent, and a fresh operation is possible after abandonment.
        f.driver.recover_hooks_config(&f.repo, "crash").unwrap();
        if !installed {
            assert_eq!(
                f.driver
                    .ensure_hooks(&f.repo, &f.main.join(".githooks"), "after-crash")
                    .unwrap()
                    .status,
                "owned"
            );
        }
    }
}

struct EditAtAttempt {
    config: PathBuf,
    records: std::sync::atomic::AtomicUsize,
}
impl FileSystem for EditAtAttempt {
    fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
        if step == "record-install" && self.records.fetch_add(1, Ordering::Relaxed) == 3 {
            let mut file = fs::OpenOptions::new().append(true).open(&self.config)?;
            file.write_all(b"\n[core]\n\thooksPath = /changed-after-wal\n")?;
        }
        Ok(())
    }
}
#[test]
fn exact_old_guard_rechecks_after_target_attempt_before_the_effect() {
    let f = Fixture::new();
    let err = f
        .driver
        .ensure_hooks_with_filesystem(
            &f.repo,
            &f.main.join(".githooks"),
            "late-edit",
            &EditAtAttempt {
                config: f.main.join(".git/config"),
                records: std::sync::atomic::AtomicUsize::new(0),
            },
        )
        .unwrap_err();
    assert_eq!(err.cause, "config-change-stale");
    assert_eq!(
        git(&f.main, &["config", "core.hooksPath"]),
        "/changed-after-wal"
    );
    assert!(!f.main.join(".git/config.lock").exists());
}

#[test]
fn unified_recovery_refuses_conflicting_rank_eighty_contract_without_dropping_authority() {
    let f = Fixture::new();
    let path = f.main.join(".githooks");
    f.driver.ensure_hooks(&f.repo, &path, "config-ranks").unwrap();
    assert_eq!(f.driver.inspect_operation(&f.repo,"config-ranks").unwrap()["kind"], "ConfigChange");
    let before = fs::read(f.main.join(".git/config")).unwrap();
    let error = f.driver.reconcile_operation(&f.repo,vec![],"fixture","config-ranks",None).unwrap_err();
    assert!(error.cause.contains("recovery-config-lock-order-unavailable"));
    assert_eq!(fs::read(f.main.join(".git/config")).unwrap(),before);
    assert_eq!(f.driver.recover_hooks_config(&f.repo,"config-ranks").unwrap().status,"owned");
}
