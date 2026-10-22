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
    // Restoring/touching an older operation directory cannot revive ownership.
    fs::File::open(f.main.join(".git/fgos/git/operations/hooks")).unwrap()
        .set_times(fs::FileTimes::new().set_modified(
            std::time::SystemTime::now() + std::time::Duration::from_secs(3600),
        )).unwrap();
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
        let pending = f.driver.list_pending(&f.repo, 100).unwrap();
        assert!(pending["operations"].as_array().unwrap().iter()
            .any(|op| op["operationId"] == "crash"));
        let inspected = f.driver.inspect_operation(&f.repo, "crash").unwrap();
        assert_eq!(inspected["kind"], "ConfigChange");
        assert_eq!(inspected["terminal"], false);
        let result = f.driver.reconcile_operation(&f.repo, vec![], "fixture", "crash", None).unwrap();
        assert_eq!(result["terminal"], true);
        assert_eq!(result["requestDigest"], inspected["requestDigest"]);
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

struct FailAt(&'static str);
impl FileSystem for FailAt {
    fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
        if step == self.0 {
            Err(std::io::Error::other("fault between rename and parent sync"))
        } else {
            Ok(())
        }
    }
}

#[test]
fn a_config_edit_that_failed_between_rename_and_parent_sync_is_not_acknowledged_on_observation_alone() {
    // The dead-writer case above proves the edit is never replayed. It does not look at what the
    // recovered outcome claims: a value that is merely visible after the rename says nothing about
    // the parent directory, so an acknowledgement resting on that observation alone is a durability
    // claim nobody checked.
    let f = Fixture::new();
    let path = f.main.join(".githooks");
    f.driver
        .ensure_hooks_with_filesystem(&f.repo, &path, "fault", &FailAt("config-replaced"))
        .unwrap_err();
    let wal = Wal::open(&f.repo).unwrap();
    let chain = wal.inspect("fault").unwrap();
    match chain.outcome() {
        Some(Outcome::Transfer {
            acknowledged,
            details,
            ..
        }) => assert!(
            !(*acknowledged && details.iter().any(|d| d == "effectObservedOnly")),
            "acknowledged on observation alone: {details:?}"
        ),
        other => panic!("unexpected outcome {other:?}"),
    }
    // The edit is in the file exactly once, and the fault left no native lock behind.
    assert_eq!(
        git(&f.main, &["config", "--get-all", "core.hooksPath"]),
        path.to_str().unwrap()
    );
    assert!(!f.main.join(".git/config.lock").exists());
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
fn unified_recovery_uses_config_authority_without_peer_rank_eighty_leaf() {
    let f = Fixture::new();
    let path = f.main.join(".githooks");
    f.driver.ensure_hooks(&f.repo, &path, "config-ranks").unwrap();
    assert_eq!(f.driver.inspect_operation(&f.repo,"config-ranks").unwrap()["kind"], "ConfigChange");
    let before = fs::read(f.main.join(".git/config")).unwrap();
    let result = f.driver.reconcile_operation(&f.repo,vec![],"fixture","config-ranks",None).unwrap();
    assert_eq!(result["terminal"], true);
    assert_eq!(fs::read(f.main.join(".git/config")).unwrap(),before);
    assert_eq!(f.driver.recover_hooks_config(&f.repo,"config-ranks").unwrap().status,"owned");
}

#[test]
#[ignore = "isolated HOME child invoked by global hooks test"]
fn global_hooks_child() {
    let f = Fixture::new();
    let global = PathBuf::from(std::env::var_os("HOME").unwrap()).join(".gitconfig");
    let path = f.main.join(".githooks");
    fs::write(&global, "[core]\n hooksPath = /global/hooks\n").unwrap();
    let report = f.driver.ensure_hooks(&f.repo, &path, "global-preserved").unwrap();
    assert_eq!(report.status, "skippedExisting");
    assert_eq!(report.configured_path.as_deref(), Some("/global/hooks"));
    assert!(report.enforcement_missing);
    assert!(!fs::read_to_string(f.main.join(".git/config")).unwrap().contains("hooksPath"));
    fs::remove_file(&global).unwrap();
    f.driver.ensure_hooks(&f.repo, &path, "local-owned").unwrap();
    fs::write(&global, "[core]\n hooksPath = /global/hooks\n").unwrap();
    assert_eq!(f.driver.inspect_hooks(&f.repo, &path).unwrap().status, "owned");
    let report = f.driver.remove_owned_hooks_config(&f.repo, &path, "local-remove").unwrap();
    assert_eq!(report.status, "skippedExisting");
    assert_eq!(report.configured_path.as_deref(), Some("/global/hooks"));
    assert_eq!(fs::read_to_string(&global).unwrap(), "[core]\n hooksPath = /global/hooks\n");
    let _ = evidence as fn(&LandSession) -> LandEvidence;
}
#[test]
fn inherited_global_hooks_preserved_and_owned_local_removal_reveals_global() {
    let f = Fixture::new();
    let home = f.temp.join("isolated-home");
    fs::create_dir(&home).unwrap();
    let out = Command::new(std::env::current_exe().unwrap())
        .args(["--exact", "global_hooks_child", "--ignored", "--nocapture"])
        .env("HOME", &home).env("XDG_CONFIG_HOME", home.join("xdg"))
        .output().unwrap();
    assert!(out.status.success(), "{}\n{}", String::from_utf8_lossy(&out.stdout), String::from_utf8_lossy(&out.stderr));
}

#[test]
fn included_hooks_remain_user_owned_even_with_matching_wal_provenance() {
    let f = Fixture::new();
    let path = f.main.join(".githooks");
    f.driver.ensure_hooks(&f.repo, &path, "local-original").unwrap();
    let included = f.temp.join("included-config");
    let contents = format!("[core]\n hooksPath = {}\n", path.display());
    fs::write(&included, &contents).unwrap();
    git(&f.main, &["config", "include.path", included.to_str().unwrap()]);
    // Same value in both files is not an ambiguous owned-local setting.
    assert_eq!(f.driver.inspect_hooks(&f.repo, &path).unwrap().status, "owned");
    // The existing mutation admission still refuses included repository config.
    // It must not misdiagnose the two origins as ambiguous or remove user bytes.
    let error = f.driver.remove_owned_hooks_config(&f.repo, &path, "local-remove-include").unwrap_err();
    assert!(error.cause.contains("repository-config-untrusted: include.path"));
    assert_eq!(fs::read_to_string(&included).unwrap(), contents);
    git(&f.main, &["config", "--unset", "core.hooksPath"]);
    // Historical provenance for the same bytes cannot confer ownership on an include.
    assert_eq!(f.driver.ensure_hooks(&f.repo, &path, "include-preserved").unwrap().status, "skippedExisting");
    assert_eq!(f.driver.remove_owned_hooks_config(&f.repo, &path, "include-remove").unwrap().status, "skippedExisting");
    assert_eq!(fs::read_to_string(&included).unwrap(), contents);
    assert!(!fs::read_to_string(f.main.join(".git/config")).unwrap().contains("hooksPath"));
}

#[test]
fn included_value_cannot_reuse_an_owned_local_wal_record() {
    let f = Fixture::new();
    let path = f.main.join(".githooks");
    f.driver.ensure_hooks(&f.repo, &path, "previous-local").unwrap();
    git(&f.main, &["config", "--unset", "core.hooksPath"]);
    let included = f.temp.join("included-config");
    let contents = format!("[core]\n hooksPath = {}\n", path.display());
    fs::write(&included, &contents).unwrap();
    git(&f.main, &["config", "include.path", included.to_str().unwrap()]);
    let report = f.driver.ensure_hooks(&f.repo, &path, "preserve-included").unwrap();
    assert_eq!(report.status, "skippedExisting");
    assert!(report.provenance.is_none());
    assert_eq!(f.driver.remove_owned_hooks_config(&f.repo, &path, "preserve-included-remove").unwrap().status, "skippedExisting");
    assert_eq!(fs::read_to_string(included).unwrap(), contents);
}
