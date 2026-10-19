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
        .contains("native-state"));
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
    let out = f
        .driver
        .recover_restore(&f.repo, vec![], "fixture", "conflict")
        .unwrap();
    assert_eq!(
        out.outcome,
        Outcome::Restore {
            state: "recoveryRequired".into()
        }
    );
    assert!(f
        .main
        .join(".git/fgos/git/restore-snapshots")
        .join(out.snapshot)
        .exists());
    r = request(&f, false);
    r.expected_head = r.target.clone();
    f.driver
        .apply_restore(&f.repo, vec![], &r, "fixture", "after-conflict")
        .unwrap();
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
        .contains("native-state"));
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
    assert!(f
        .driver
        .recover_restore(&f.repo, vec![], "fixture", "crash")
        .unwrap_err()
        .cause
        .contains("snapshot digest mismatch"));
    assert_eq!(fs::read(f.main.join("b")).unwrap(), b"later user edits");
}
