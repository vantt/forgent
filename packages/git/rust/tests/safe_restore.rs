#![cfg(unix)]
// Keep the existing real-repository fixture and its platform-safe driver setup.
include!("support/land.rs");
use fgos_git::wal::{FileSystem, Outcome, Wal};
use std::os::unix::fs::PermissionsExt;
use std::sync::Mutex;
fn request(f: &Fixture, reapply: bool) -> RestoreRequest {
    RestoreRequest {
        expected_head: f.request.target.clone(),
        target: f.request.source.clone(),
        reason: "carry producer work to descendant".into(),
        reapply_local_delta: reapply,
        allowed_replacements: vec![],
    }
}
fn dirty(f: &Fixture) {
    fs::write(f.main.join("b"), b"stage\0binary\xff\n").unwrap();
    git(&f.main, &["add", "b"]);
    fs::write(f.main.join("b"), b"working\0binary\xfe\n").unwrap();
    fs::set_permissions(f.main.join("b"), fs::Permissions::from_mode(0o751)).unwrap();
    fs::write(f.main.join("untracked"), b"untracked\0\xff").unwrap();
    std::os::unix::fs::symlink("b", f.main.join("link")).unwrap();
}
#[test]
fn preview_is_read_only_and_apply_preserves_staged_unstaged_binary_links_and_modes() {
    let f = Fixture::new();
    dirty(&f);
    fs::set_permissions(f.main.join("a"), fs::Permissions::from_mode(0o640)).unwrap();
    let r = request(&f, true);
    let status = git(&f.main, &["status", "--porcelain"]);
    let index = fs::read(f.main.join(".git/index")).unwrap();
    let preview = f.driver.preview_restore(&f.repo, vec![], &r).unwrap();
    assert_eq!(preview.head, r.expected_head);
    let _ = evidence as fn(&LandSession) -> LandEvidence;
    assert_eq!(fs::read(f.main.join(".git/index")).unwrap(), index);
    assert_eq!(git(&f.main, &["status", "--porcelain"]), status);
    assert!(!f.main.join(".git/fgos/git/operations").exists());
    let out = f
        .driver
        .apply_restore(&f.repo, vec![], &r, "fixture", "restore-one")
        .unwrap();
    assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), r.target);
    assert_eq!(fs::read(f.main.join("a")).unwrap(), b"incoming\n");
    assert_eq!(
        fs::metadata(f.main.join("a")).unwrap().permissions().mode() & 0o777,
        0o640
    );
    assert_eq!(
        fs::read(f.main.join("b")).unwrap(),
        b"working\0binary\xfe\n"
    );
    assert_eq!(
        fs::read(f.main.join("untracked")).unwrap(),
        b"untracked\0\xff"
    );
    assert_eq!(fs::read_link(f.main.join("link")).unwrap(), Path::new("b"));
    assert_eq!(
        fs::metadata(f.main.join("b")).unwrap().permissions().mode() & 0o777,
        0o751
    );
    let saved: serde_json::Value = serde_json::from_slice(
        &fs::read(
            f.main
                .join(".git/fgos/git/restore-snapshots")
                .join(&out.snapshot),
        )
        .unwrap(),
    )
    .unwrap();
    assert_eq!(
        saved["paths"]["b"]["File"][0],
        serde_json::json!(b"working\0binary\xfe\n".to_vec())
    );
    let staged = std::process::Command::new("git")
        .arg("-C")
        .arg(&f.main)
        .args(["show", ":b"])
        .output()
        .unwrap();
    assert_eq!(staged.stdout, b"stage\0binary\xff\n");
    assert_eq!(
        f.driver
            .apply_restore(&f.repo, vec![], &r, "fixture", "restore-one")
            .unwrap()
            .snapshot,
        out.snapshot
    );
    assert_eq!(
        f.driver
            .recover_restore(&f.repo, vec![], "fixture", "restore-one")
            .unwrap()
            .outcome,
        out.outcome
    );
}
struct CrashBarrier {
    at: usize,
    seen: Mutex<usize>,
}
impl FileSystem for CrashBarrier {
    fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
        use std::io::Write;
        let mut seen = self.seen.lock().unwrap();
        *seen += 1;
        println!("BOUNDARY {} {step}", *seen);
        std::io::stdout().flush().unwrap();
        if *seen == self.at {
            unsafe {
                libc::kill(libc::getpid(), libc::SIGKILL);
            }
        }
        Ok(())
    }
}
#[test]
#[ignore = "child process for the real SIGKILL matrix"]
fn restore_crash_child() {
    use std::io::{Read, Write};
    let mut input = String::new();
    std::io::stdin().read_to_string(&mut input).unwrap();
    let at = input.trim().parse().unwrap();
    let f = Fixture::new();
    dirty(&f);
    println!(
        "FIXTURE {}",
        serde_json::json!({"temp":f.temp,"request":f.request})
    );
    std::io::stdout().flush().unwrap();
    f.driver
        .apply_restore_with_filesystem(
            &f.repo,
            vec![],
            &request(&f, true),
            "fixture",
            "crash",
            &CrashBarrier {
                at,
                seen: Mutex::new(0),
            },
        )
        .unwrap();
    // The parent owns cleanup, including after this successful tracing pass.
    std::mem::forget(f);
}
fn run_child(at: usize) -> (Fixture, Vec<String>, std::process::ExitStatus) {
    use std::{io::Write, process::Stdio};
    let mut child = Command::new(std::env::current_exe().unwrap())
        .args(["--exact", "restore_crash_child", "--ignored", "--nocapture"])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();
    writeln!(child.stdin.take().unwrap(), "{at}").unwrap();
    let output = child.wait_with_output().unwrap();
    let stdout = String::from_utf8(output.stdout).unwrap();
    let value: serde_json::Value = serde_json::from_str(
        stdout
            .lines()
            .find_map(|s| s.strip_prefix("FIXTURE "))
            .unwrap_or_else(|| {
                panic!(
                    "child failed: {stdout} {}",
                    String::from_utf8_lossy(&output.stderr)
                )
            }),
    )
    .unwrap();
    let temp = PathBuf::from(value["temp"].as_str().unwrap());
    let main = temp.join("repo");
    let driver = GitDriver::new(&temp).unwrap();
    let repo = match driver.resolve_repo(&main, &main).unwrap() {
        ResolveRepo::Repository(r) => r,
        _ => panic!(),
    };
    let request = serde_json::from_value(value["request"].clone()).unwrap();
    let boundaries = stdout
        .lines()
        .filter(|s| s.starts_with("BOUNDARY "))
        .map(str::to_owned)
        .collect();
    (
        Fixture {
            temp,
            main,
            driver,
            repo,
            request,
        },
        boundaries,
        output.status,
    )
}
#[test]
fn every_durable_snapshot_wal_and_effect_boundary_preserves_bytes_and_allows_fresh_restore() {
    let (f, steps, status) = run_child(usize::MAX);
    assert!(status.success());
    drop(f);
    assert!(
        steps.iter().any(|s| s.ends_with("restore-before-reset"))
            && steps
                .iter()
                .any(|s| s.ends_with("restore-after-worktree-delta"))
    );
    for (n, step) in steps.iter().enumerate() {
        use std::os::unix::process::ExitStatusExt;
        let (f, reached, status) = run_child(n + 1);
        assert_eq!(
            status.signal(),
            Some(libc::SIGKILL),
            "{n}: {step}: {reached:?}"
        );
        let original = b"working\0binary\xfe\n".to_vec();
        let wal = Wal::open(&f.repo).unwrap();
        if wal.inspect("crash").is_ok() {
            let out = f
                .driver
                .recover_restore(&f.repo, vec![], "fixture", "crash")
                .unwrap();
            let saved: serde_json::Value = serde_json::from_slice(
                &fs::read(
                    f.main
                        .join(".git/fgos/git/restore-snapshots")
                        .join(&out.snapshot),
                )
                .unwrap(),
            )
            .unwrap();
            assert_eq!(
                saved["paths"]["b"]["File"][0],
                serde_json::json!(original),
                "{n}: {step}"
            );
        } else {
            assert_eq!(fs::read(f.main.join("b")).unwrap(), original, "{n}: {step}");
        }
        let fresh = RestoreRequest {
            expected_head: git(&f.main, &["rev-parse", "HEAD"]),
            reapply_local_delta: false,
            ..request(&f, false)
        };
        f.driver
            .apply_restore(&f.repo, vec![], &fresh, "fixture", "fresh")
            .unwrap_or_else(|e| panic!("{n}: {step}: {e:?}"));
    }
    println!("SIGKILL boundaries verified: {}", steps.len());
}
#[test]
fn refuses_bad_target_ancestry_head_native_state_and_conflicting_reapply_retains_snapshot() {
    let f = Fixture::new();
    let mut r = request(&f, false);
    r.expected_head = r.target.clone();
    assert!(f
        .driver
        .preview_restore(&f.repo, vec![], &r)
        .unwrap_err()
        .cause
        .contains("head-mismatch"));
    r = request(&f, false);
    r.target = git(&f.main, &["rev-parse", "HEAD:a"]);
    assert!(f
        .driver
        .preview_restore(&f.repo, vec![], &r)
        .unwrap_err()
        .cause
        .contains("not-commit"));
    fs::write(f.main.join(".git/index.lock"), "foreign").unwrap();
    assert!(f
        .driver
        .preview_restore(&f.repo, vec![], &request(&f, false))
        .unwrap_err()
        .cause
        .contains("native-index-lock-unowned"));
    assert_eq!(
        fs::read(f.main.join(".git/index.lock")).unwrap(),
        b"foreign"
    );
    fs::remove_file(f.main.join(".git/index.lock")).unwrap();
    fs::write(f.main.join("a"), "conflicting producer\n").unwrap();
    assert!(f
        .driver
        .apply_restore(&f.repo, vec![], &request(&f, true), "fixture", "conflict")
        .unwrap_err()
        .cause
        .contains("reapply-required"));
    assert_eq!(
        fs::read(f.main.join("a")).unwrap(),
        b"conflicting producer\n"
    );
    assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), f.request.target);
}

#[test]
fn interrupted_restore_preserves_native_residue_user_edits_and_corrupt_evidence() {
    let (f, steps, _) = run_child(usize::MAX);
    let stop = steps
        .iter()
        .position(|s| s.ends_with("restore-before-reset"))
        .unwrap()
        + 1;
    drop(f);
    let (f, _, _) = run_child(stop);
    fs::write(f.main.join(".git/index.lock"), b"unknown native bytes").unwrap();
    assert!(f
        .driver
        .recover_restore(&f.repo, vec![], "fixture", "crash")
        .unwrap_err()
        .cause
        .contains("native-index-lock-unowned"));
    assert_eq!(
        fs::read(f.main.join(".git/index.lock")).unwrap(),
        b"unknown native bytes"
    );
    fs::remove_file(f.main.join(".git/index.lock")).unwrap();
    fs::write(f.main.join("b"), b"later user edits").unwrap();
    let out = f
        .driver
        .recover_restore(&f.repo, vec![], "fixture", "crash")
        .unwrap();
    assert_eq!(
        out.outcome,
        Outcome::Restore {
            state: "recoveryRequired".into()
        }
    );
    assert_eq!(fs::read(f.main.join("b")).unwrap(), b"later user edits");
    let path = f
        .main
        .join(".git/fgos/git/restore-snapshots")
        .join(out.snapshot);
    fs::write(&path, b"{}").unwrap();
    let closed = f
        .driver
        .recover_restore(&f.repo, vec![], "fixture", "crash")
        .unwrap();
    assert!(closed.warnings[0].contains("snapshot digest mismatch"));
    assert_eq!(fs::read(&path).unwrap(), b"{}");
    let fresh = RestoreRequest {
        expected_head: git(&f.main, &["rev-parse", "HEAD"]),
        ..request(&f, false)
    };
    assert_eq!(fs::read(f.main.join("b")).unwrap(), b"later user edits");
    f.driver
        .apply_restore(&f.repo, vec![], &fresh, "fixture", "fresh-corrupt")
        .unwrap();
}

#[test]
fn ancestor_and_directory_collisions_require_exact_permission_and_retain_bytes() {
    for ignored in [false, true] {
        for reapply in [false, true] {
            let mut f = Fixture::new();
            git(&f.main, &["checkout", "-q", "source"]);
            fs::create_dir(f.main.join("cfg")).unwrap();
            fs::write(f.main.join("cfg/x"), b"incoming").unwrap();
            fs::write(f.main.join("leaf"), b"incoming leaf").unwrap();
            git(&f.main, &["add", "cfg/x", "leaf"]);
            git(&f.main, &["commit", "-qm", "incoming paths"]);
            f.request.source = git(&f.main, &["rev-parse", "HEAD"]);
            git(&f.main, &["checkout", "-q", "trunk"]);
            if ignored {
                fs::write(f.main.join(".git/info/exclude"), b"cfg\nleaf/\n").unwrap();
            }
            fs::write(f.main.join("cfg"), b"ancestor bytes").unwrap();
            fs::create_dir(f.main.join("leaf")).unwrap();
            fs::write(f.main.join("leaf/local"), b"descendant bytes").unwrap();
            let mut r = request(&f, reapply);
            assert!(f
                .driver
                .apply_restore(&f.repo, vec![], &r, "fixture", "denied")
                .unwrap_err()
                .cause
                .contains("untracked-target-collision"));
            assert_eq!(fs::read(f.main.join("cfg")).unwrap(), b"ancestor bytes");
            r.allowed_replacements = vec!["cfg".into(), "leaf/local".into()];
            let result = f
                .driver
                .apply_restore(&f.repo, vec![], &r, "fixture", "allowed")
                .unwrap();
            assert_eq!(fs::read(f.main.join("cfg/x")).unwrap(), b"incoming");
            assert_eq!(fs::read(f.main.join("leaf")).unwrap(), b"incoming leaf");
            let listing = f
                .driver
                .list_restore_snapshot(&f.repo, vec![], "fixture", "allowed")
                .unwrap();
            assert!(listing.contains(&"cfg".into()) && listing.contains(&"leaf/local".into()));
            let output = f.temp.join("extract");
            fs::create_dir(&output).unwrap();
            f.driver
                .extract_restore_path(&f.repo, vec![], "fixture", "allowed", "cfg", &output)
                .unwrap();
            assert_eq!(fs::read(output.join("cfg")).unwrap(), b"ancestor bytes");
            assert!(f
                .driver
                .extract_restore_path(&f.repo, vec![], "fixture", "allowed", "cfg", &output)
                .is_err());
            f.driver
                .acknowledge_restore(&f.repo, vec![], "fixture", "allowed")
                .unwrap();
            assert!(Wal::open(&f.repo)
                .unwrap()
                .compacted("allowed")
                .unwrap()
                .is_some());
            assert_eq!(f.driver.inspect_operation(&f.repo, "allowed").unwrap()["kind"], "Restore");
            assert!(!f
                .main
                .join(".git/fgos/git/restore-snapshots")
                .join(result.snapshot)
                .exists());
        }
    }
}
#[test]
fn clean_large_tracked_bytes_do_not_use_snapshot_capacity() {
    let mut f = Fixture::new();
    fs::write(f.main.join("large"), vec![42; 33 * 1024 * 1024]).unwrap();
    git(&f.main, &["add", "large"]);
    git(&f.main, &["commit", "-qm", "large clean base"]);
    f.request.target = git(&f.main, &["rev-parse", "HEAD"]);
    fs::write(f.main.join("a"), b"incoming large repo\n").unwrap();
    git(&f.main, &["commit", "-qam", "incoming"]);
    f.request.source = git(&f.main, &["rev-parse", "HEAD"]);
    git(&f.main, &["reset", "--hard", &f.request.target]);
    let out = f
        .driver
        .apply_restore(&f.repo, vec![], &request(&f, false), "fixture", "large")
        .unwrap();
    assert!(f
        .driver
        .list_restore_snapshot(&f.repo, vec![], "fixture", "large")
        .unwrap()
        .iter()
        .all(|p| p != "large"));
    assert!(
        fs::metadata(
            f.main
                .join(".git/fgos/git/restore-snapshots")
                .join(out.snapshot)
        )
        .unwrap()
        .len()
            < 100_000
    );
}
#[test]
fn incoming_executable_mode_and_local_content_survive_and_local_mode_conflict_refuses() {
    for conflict in [false, true] {
        let mut f = Fixture::new();
        git(&f.main, &["checkout", "-q", "source"]);
        fs::set_permissions(f.main.join("b"), fs::Permissions::from_mode(0o755)).unwrap();
        git(&f.main, &["commit", "-qam", "incoming mode"]);
        f.request.source = git(&f.main, &["rev-parse", "HEAD"]);
        git(&f.main, &["checkout", "-q", "trunk"]);
        fs::write(f.main.join("b"), b"local content\n").unwrap();
        fs::set_permissions(
            f.main.join("b"),
            fs::Permissions::from_mode(if conflict { 0o751 } else { 0o640 }),
        )
        .unwrap();
        let out = f
            .driver
            .apply_restore(&f.repo, vec![], &request(&f, true), "fixture", "mode");
        if conflict {
            assert!(out.unwrap_err().cause.contains("local-mode-conflict"));
        } else {
            out.unwrap();
            assert_eq!(fs::read(f.main.join("b")).unwrap(), b"local content\n");
            assert_eq!(
                fs::metadata(f.main.join("b")).unwrap().permissions().mode() & 0o777,
                0o751
            );
        }
    }
}
#[test]
fn intent_to_add_survives_reapply() {
    let f = Fixture::new();
    fs::write(f.main.join("new"), b"intent bytes\n").unwrap();
    git(&f.main, &["add", "-N", "new"]);
    f.driver
        .apply_restore(&f.repo, vec![], &request(&f, true), "fixture", "ita")
        .unwrap();
    assert_eq!(git(&f.main, &["diff", "--cached", "--name-only"]), "");
    assert_eq!(git(&f.main, &["diff", "--name-only"]), "new");
    assert_eq!(fs::read(f.main.join("new")).unwrap(), b"intent bytes\n");
}

#[test]
fn overlapping_offset_hunks_refuse_before_effect() {
    let mut f = Fixture::new();
    fs::write(f.main.join("b"), "1\n2\n3\n4\n5\n6\n7\n8\n9\n").unwrap();
    git(&f.main, &["commit", "-qam", "base lines"]);
    f.request.target = git(&f.main, &["rev-parse", "HEAD"]);
    fs::write(f.main.join("b"), "prefix\n1\n2\n3\n4\n5\n6\n7\n8\n9\n").unwrap();
    git(&f.main, &["commit", "-qam", "incoming shifted lines"]);
    f.request.source = git(&f.main, &["rev-parse", "HEAD"]);
    git(&f.main, &["reset", "--hard", &f.request.target]);
    let local = b"1\n2\n3\n4\n5\n6\n7\n8\nlocal\n";
    fs::write(f.main.join("b"), local).unwrap();
    assert!(f
        .driver
        .apply_restore(&f.repo, vec![], &request(&f, true), "fixture", "offset")
        .unwrap_err()
        .cause
        .contains("overlapping-content"));
    assert_eq!(fs::read(f.main.join("b")).unwrap(), local);
    assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), f.request.target);
}
struct PostCheckFailure {
    root: PathBuf,
}
impl FileSystem for PostCheckFailure {
    fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
        if step == "restore-after-modes" {
            fs::write(
                self.root.join("later-large-local"),
                vec![42; 33 * 1024 * 1024],
            )?;
        }
        Ok(())
    }
}
#[test]
fn completed_restore_reports_post_check_failure_as_warning() {
    let f = Fixture::new();
    let out = f
        .driver
        .apply_restore_with_filesystem(
            &f.repo,
            vec![],
            &request(&f, false),
            "fixture",
            "post-check",
            &PostCheckFailure {
                root: f.main.clone(),
            },
        )
        .unwrap();
    assert_eq!(
        out.outcome,
        Outcome::Restore {
            state: "restored".into()
        }
    );
    assert!(out.warnings[0].contains("restore-post-check-failed"));
    assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), f.request.source);
    assert_eq!(fs::read(f.main.join("a")).unwrap(), b"incoming\n");
    assert_eq!(
        f.driver
            .recover_restore(&f.repo, vec![], "fixture", "post-check")
            .unwrap()
            .outcome,
        out.outcome
    );
}
#[test]
fn missing_or_corrupt_active_snapshot_closes_with_evidence_and_allows_fresh_operation() {
    let (f, steps, _) = run_child(usize::MAX);
    let stop = steps
        .iter()
        .position(|s| s.ends_with("restore-before-reset"))
        .unwrap()
        + 1;
    drop(f);
    for missing in [false, true] {
        let (f, _, _) = run_child(stop);
        let wal = Wal::open(&f.repo).unwrap();
        let chain = wal.inspect("crash").unwrap();
        let fgos_git::wal::OperationKind::Restore(p) = &chain.intent().kind else {
            panic!()
        };
        let path = f
            .main
            .join(".git/fgos/git/restore-snapshots")
            .join(&p.snapshot);
        if missing {
            fs::remove_file(&path).unwrap();
        } else {
            fs::write(&path, b"damaged evidence").unwrap();
        }
        let out = f
            .driver
            .recover_restore(&f.repo, vec![], "fixture", "crash")
            .unwrap();
        assert!(out.warnings[0].contains("restore-snapshot-unreadable"));
        assert!(out.warnings[0].contains("closed-with-evidence-retained"));
        if !missing {
            assert_eq!(fs::read(path).unwrap(), b"damaged evidence");
        }
        let fresh = RestoreRequest {
            expected_head: git(&f.main, &["rev-parse", "HEAD"]),
            ..request(&f, false)
        };
        f.driver
            .apply_restore(&f.repo, vec![], &fresh, "fixture", "fresh-after-damage")
            .unwrap();
    }
}

#[test]
fn retention_ages_only_valid_unreferenced_snapshots_and_known_temps() {
    use std::time::{Duration, SystemTime};
    let f = Fixture::new();
    let out = f
        .driver
        .apply_restore(&f.repo, vec![], &request(&f, false), "fixture", "retained")
        .unwrap();
    let directory = f.main.join(".git/fgos/git/restore-snapshots");
    let mut value: serde_json::Value =
        serde_json::from_slice(&fs::read(directory.join(&out.snapshot)).unwrap()).unwrap();
    value["operationId"] = "orphan".into();
    let orphan = fgos_git::wal::canonical_digest(&value).unwrap();
    fs::write(directory.join(&orphan), serde_json::to_vec(&value).unwrap()).unwrap();
    value["operationId"] = "young".into();
    let young = fgos_git::wal::canonical_digest(&value).unwrap();
    fs::write(directory.join(&young), serde_json::to_vec(&value).unwrap()).unwrap();
    for name in [&orphan, &young] {
        fs::set_permissions(directory.join(name), fs::Permissions::from_mode(0o600)).unwrap();
    }
    let corrupt = "f".repeat(64);
    fs::write(directory.join(&corrupt), b"damaged evidence").unwrap();
    fs::write(directory.join("unknown"), b"unknown evidence").unwrap();
    let temporary = ".durable-file-12345-99.tmp";
    fs::write(directory.join(temporary), b"interrupted snapshot").unwrap();
    let old = SystemTime::now() - Duration::from_secs(8 * 24 * 60 * 60);
    for name in [&orphan, &out.snapshot, &corrupt, "unknown", temporary] {
        fs::File::open(directory.join(name))
            .unwrap()
            .set_times(fs::FileTimes::new().set_modified(old))
            .unwrap();
    }
    let fresh = RestoreRequest {
        expected_head: f.request.source.clone(),
        ..request(&f, false)
    };
    f.driver
        .apply_restore(&f.repo, vec![], &fresh, "fixture", "prune")
        .unwrap();
    assert!(!directory.join(orphan).exists());
    assert!(!directory.join(temporary).exists());
    for name in [&out.snapshot, &corrupt, &young, "unknown"] {
        assert!(directory.join(name).exists(), "{name}");
    }
}
struct AckInterruption;
impl FileSystem for AckInterruption {
    fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
        if step == "restore-snapshot-released" {
            return Err(std::io::Error::other("interrupted acknowledged cleanup"));
        }
        Ok(())
    }
}
#[test]
fn acknowledged_cleanup_can_resume_after_snapshot_release_failure() {
    let f = Fixture::new();
    dirty(&f);
    f.driver
        .apply_restore(&f.repo, vec![], &request(&f, true), "fixture", "ack-retry")
        .unwrap();
    assert!(f
        .driver
        .acknowledge_restore_with_filesystem(
            &f.repo,
            vec![],
            "fixture",
            "ack-retry",
            &AckInterruption
        )
        .unwrap_err()
        .cause
        .contains("interrupted acknowledged cleanup"));
    let wal = Wal::open(&f.repo).unwrap();
    assert!(matches!(
        wal.inspect("ack-retry").unwrap().last().phase,
        fgos_git::wal::Phase::RestoreAcknowledged
    ));
    f.driver
        .acknowledge_restore(&f.repo, vec![], "fixture", "ack-retry")
        .unwrap();
    assert!(wal.compacted("ack-retry").unwrap().is_some());
}

struct CompactionInterruption;
impl FileSystem for CompactionInterruption {
    fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
        if step == "remove-record" {
            return Err(std::io::Error::other("interrupted restore compaction"));
        }
        Ok(())
    }
}
#[test]
fn acknowledged_compaction_suffix_does_not_block_fresh_checkout_work() {
    let f = Fixture::new();
    let out = f
        .driver
        .apply_restore(
            &f.repo,
            vec![],
            &request(&f, false),
            "fixture",
            "compact-interrupt",
        )
        .unwrap();
    assert!(f
        .driver
        .acknowledge_restore_with_filesystem(
            &f.repo,
            vec![],
            "fixture",
            "compact-interrupt",
            &CompactionInterruption
        )
        .unwrap_err()
        .cause
        .contains("interrupted restore compaction"));
    let scan = Wal::open(&f.repo).unwrap().scan(100).unwrap();
    assert!(scan.complete && scan.entries.iter().all(|e| e.error.is_none()));
    assert!(!f
        .main
        .join(".git/fgos/git/restore-snapshots")
        .join(out.snapshot)
        .exists());
    let fresh = RestoreRequest {
        expected_head: f.request.source.clone(),
        ..request(&f, false)
    };
    f.driver
        .apply_restore(&f.repo, vec![], &fresh, "fixture", "after-ack-interrupt")
        .unwrap();
}

#[test]
fn extraction_refuses_sibling_worktree_and_state_root() {
    let f = Fixture::new();
    dirty(&f);
    f.driver.apply_restore(&f.repo, vec![], &request(&f, true), "fixture", "extract-roots").unwrap();
    let sibling = f.temp.join("sibling");
    git(&f.main, &["worktree", "add", "--detach", sibling.to_str().unwrap()]);
    for destination in [&sibling, &f.temp.join("state")] {
        let err = f.driver.extract_restore_path(&f.repo, vec![], "fixture", "extract-roots", "b", destination).unwrap_err();
        assert!(err.cause.contains("outside-repository"), "{}", err.cause);
        assert!(!destination.join("b").exists() || destination == &sibling);
    }
    // A missing registered directory does not block an unrelated destination.
    fs::remove_dir_all(&sibling).unwrap();
    let destination = f.temp.join("safe-extraction");
    fs::create_dir(&destination).unwrap();
    f.driver.extract_restore_path(&f.repo, vec![], "fixture", "extract-roots", "b", &destination).unwrap();
    assert_eq!(fs::read(destination.join("b")).unwrap(), b"working\0binary\xfe\n");
    // Recreating the registered path must not make it an extraction target.
    fs::create_dir(&sibling).unwrap();
    assert!(f.driver.extract_restore_path(&f.repo, vec![], "fixture", "extract-roots", "b", &sibling)
        .unwrap_err().cause.contains("outside-repository"));
    assert!(!sibling.join("b").exists());
}
#[test]
fn case_only_target_rename_preserves_index_identity() {
    let f = Fixture::new();
    fs::write(f.main.join("Readme"), "tracked").unwrap();
    git(&f.main, &["add", "Readme"]); git(&f.main, &["commit", "-qm", "name"]);
    let expected = git(&f.main, &["rev-parse", "HEAD"]);
    git(&f.main, &["mv", "Readme", "README"]); git(&f.main, &["commit", "-qm", "rename"]);
    let target = git(&f.main, &["rev-parse", "HEAD"]);
    git(&f.main, &["reset", "--hard", &expected]);
    let r = RestoreRequest { expected_head: expected, target, reason: "case rename".into(), reapply_local_delta: false, allowed_replacements: vec![] };
    f.driver.apply_restore(&f.repo, vec![], &r, "fixture", "case-rename").unwrap();
    assert_eq!(fs::read(f.main.join("README")).unwrap(), b"tracked");
}

#[test]
fn case_sensitive_untracked_hardlink_is_not_an_index_alias() {
    let f = Fixture::new();
    fs::write(f.main.join("Readme"), "tracked").unwrap();
    git(&f.main, &["add", "Readme"]); git(&f.main, &["commit", "-qm", "name"]);
    let expected = git(&f.main, &["rev-parse", "HEAD"]);
    git(&f.main, &["mv", "Readme", "README"]); git(&f.main, &["commit", "-qm", "rename"]);
    let target = git(&f.main, &["rev-parse", "HEAD"]);
    git(&f.main, &["reset", "--hard", &expected]);
    // This assertion applies only where the two spellings are distinct names.
    if !f.main.join("README").exists() {
        fs::hard_link(f.main.join("Readme"), f.main.join("README")).unwrap();
        let r = RestoreRequest { expected_head: expected, target, reason: "hardlink collision".into(), reapply_local_delta: false, allowed_replacements: vec![] };
        let error = f.driver.preview_restore(&f.repo,vec![],&r).unwrap_err();
        assert!(error.cause.contains("untracked-target-collision"));
    }
}
