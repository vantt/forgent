//! Borrowing with real git: the four vectors and the sibling check are
//! green; a control without the gc switch shows the vector catches a real
//! leak; the release rule refuses an unprovable setsid escaper before
//! `run_borrowed` returns.
#![cfg(target_os = "linux")]

mod common;

use std::fs;
use std::path::Path;
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

use common::*;
use fgos_holder_lock::borrow_vectors::{self, add_loose_objects, git_env, init_repo};
use fgos_holder_lock::port::borrowed_argv;
use fgos_holder_lock::{acquire, probe, release, run_borrowed, Acquire, BorrowSpec, BorrowStdio, Mode, Probe, Wait};
use fgos_process::facts::{lock_holders, observe, Holders, Observed};
use fgos_process::{FdSlot, ProcId};

#[test]
fn child_entry() {
    common::child_entry()
}

fn git() -> &'static Path {
    Path::new("git")
}

#[test]
fn borrowing_git_disables_automatic_gc_and_maintenance() {
    let _serial = serial();
    let argv: Vec<String> = ["git", "commit", "-m", "x"].map(String::from).to_vec();
    assert_eq!(borrowed_argv(&argv), ["git", "-c", "gc.auto=0", "-c", "maintenance.auto=false", "commit", "-m", "x"]);
    let other: Vec<String> = ["sh", "-c", "true"].map(String::from).to_vec();
    assert_eq!(borrowed_argv(&other), other);
}

/// POSIX borrowing never starts a helper; the path only fills the parameter.
fn helper() -> fgos_holder_lock::HelperExe {
    fgos_holder_lock::HelperExe::current().expect("current exe")
}

#[test]
fn the_four_borrow_vectors_and_the_sibling_check_are_green() {
    let _serial = serial();
    let report = borrow_vectors::run(git(), &helper(), &[], false).expect("vectors run");
    for v in &report.vectors {
        println!("vector {}: {} in {} ms ({})", v.name, if v.pass { "pass" } else { "FAIL" }, v.elapsed_ms, v.detail);
    }
    println!("sibling: {:?}; total {} ms; {}", report.sibling, report.elapsed_ms, report.git_version);
    assert_eq!(report.vectors.len(), 4);
    assert!(report.pass(), "{report:#?}");
}

#[test]
fn an_unknown_vector_name_is_a_usage_error() {
    let _serial = serial();
    assert!(matches!(borrow_vectors::run(git(), &helper(), &["nope".to_string()], false), Err(borrow_vectors::RunError::Usage(_))));
}

fn others_holding(lock: &Path) -> Vec<u32> {
    use std::os::unix::fs::MetadataExt;
    let meta = fs::metadata(lock).unwrap();
    match lock_holders(meta.dev(), meta.ino()) {
        Holders::List(list) => list.into_iter().map(|t| t.pid.0).filter(|p| *p != std::process::id()).collect(),
        Holders::Unlistable => Vec::new(),
    }
}

fn kill_pids(pids: &[u32]) {
    for pid in pids {
        unsafe {
            libc::kill(*pid as libc::pid_t, libc::SIGKILL);
        }
    }
}

/// Control: the same gc-eligible repository, git run with the description
/// but WITHOUT the gc switch and without the release rule. A daemonized
/// `gc --auto` keeps the lock after git returned, which is what the vector
/// exists to catch.
#[test]
fn control_without_the_gc_switch_leaks_the_lock_to_background_gc() {
    let _serial = serial();
    let dir = temp_dir("gc-control");
    let repo = dir.join("repo");
    init_repo(git(), &repo).unwrap();
    let st = Command::new("git").arg("-C").arg(&repo).args(["config", "gc.auto", "1"]).envs(git_env()).status().unwrap();
    assert!(st.success());
    add_loose_objects(git(), &repo).unwrap();
    let res = resource(&dir, "control");
    // This is intentionally below Handle: its Drop and release now settle
    // daemonized copies too. Use the existing raw-description lock door to
    // retain the negative control's absence of the release rule.
    let shared = fs::OpenOptions::new().read(true).write(true).create(true).truncate(false).open(&res.path).unwrap();
    assert!(matches!(fgos_holder_lock::port::lock_description(&shared, Mode::Ex, Wait::Try).unwrap(),
        fgos_holder_lock::port::DescriptionLock::Locked));
    let mut cmd = Command::new("git");
    cmd.arg("-C").arg(&repo).args(["commit", "-q", "--allow-empty", "-m", "control"]).envs(git_env());
    cmd.stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null());
    let mut child = fgos_process::control::spawn_with_fds(cmd, &[(FdSlot(3), &shared)]).unwrap();
    child.wait().unwrap();
    drop(shared);
    let leaked = probe(&res).unwrap();
    let holders = others_holding(&res.path);
    println!("control: probe after git and owner closed = {leaked:?}, background holders {holders:?}");
    kill_pids(&holders);
    assert_eq!(leaked, Probe::Held, "git did not leave a background gc holding the description");
    let _ = fs::remove_dir_all(&dir);
}

/// The fd number this process holds `path` open under (the handle's).
#[test]
fn run_borrowed_kills_reparented_setsid_description_holder() {
    let _serial = serial();
    let dir = temp_dir("escaper");
    let repo = dir.join("repo");
    init_repo(git(), &repo).unwrap();
    let pidfile = dir.join("escaper.pid");
    let hook = repo.join(".git/hooks/post-commit");
    fs::write(&hook, format!("#!/bin/sh\nsetsid sleep 30 >/dev/null 2>&1 </dev/null &\necho $! > '{}'\nexit 0\n", pidfile.display())).unwrap();
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&hook, fs::Permissions::from_mode(0o755)).unwrap();
    }
    let res = resource(&dir, "escaper");
    let handle = match acquire(&res, Mode::Ex, Wait::Try, 2000) {
        Acquire::Acquired(h) => h,
        other => panic!("{other:?}"),
    };
    let spec = BorrowSpec {
        argv: vec!["git".into(), "-C".into(), repo.to_string_lossy().into_owned(), "commit".into(), "-q".into(), "--allow-empty".into(), "-m".into(), "hooked".into()],
        cwd: None,
        env: git_env(),
        clear_env: false,
        stdio: BorrowStdio::Null,
    };
    let result = run_borrowed(&handle, &spec, &helper());
    let escaper: u32 = fs::read_to_string(&pidfile).unwrap().trim().parse().unwrap();
    // Always end the test-created process, including on an assertion failure.
    struct Cleanup(u32);
    impl Drop for Cleanup {
        fn drop(&mut self) { kill_pids(&[self.0]); }
    }
    let cleanup = Cleanup(escaper);
    let outcome = result.expect("escaped borrowed descendants must drain");
    assert!(outcome.leftovers_killed > 0);
    assert_eq!(probe(&res).unwrap(), Probe::Held);
    assert!(matches!(release(handle), fgos_holder_lock::Release::Released { .. }));
    drop(cleanup);
    let deadline = Instant::now() + Duration::from_secs(5);
    while !matches!(observe(ProcId(escaper)), Observed::Absent | Observed::Zombie) {
        assert!(Instant::now() < deadline);
        std::thread::sleep(Duration::from_millis(1));
    }
    assert_eq!(probe(&res).unwrap(), Probe::Free);
    let _ = fs::remove_dir_all(&dir);
}
