//! Borrowing on Windows with real git, real jobs and the real `fgos` binary as
//! the helper executable. A borrowed child runs inside a named kill-on-close
//! job, a second job owner (the `job-keeper` role) outlives a dead holder, and
//! every process the borrow ever held is checked with this test's own
//! `SYNCHRONIZE` handles, never with the driver's own empty rule.
#![cfg(windows)]

mod windows_support;

use std::fs;
use std::path::Path;
use std::process::{Command, Stdio};
use std::time::Duration;

use fgos_holder_lock::borrow_vectors::{self, git_env, init_repo};
use fgos_holder_lock::predecessor::record_path;
use fgos_holder_lock::{acquire, probe, release, run_borrowed, Acquire, BorrowError, BorrowSpec, BorrowStdio, HelperExe, Mode, Probe, Resource, Wait};
use serde_json::Value;
use windows_support::*;
use windows_sys::Win32::Foundation::{SetHandleInformation, HANDLE, HANDLE_FLAG_INHERIT};
use windows_sys::Win32::Storage::FileSystem::{GetFileInformationByHandle, BY_HANDLE_FILE_INFORMATION};
use std::os::windows::io::AsRawHandle;

const KILL_WAIT_MS: u64 = 2000;

fn git() -> &'static Path {
    Path::new("git")
}

fn take(resource: &Resource) -> fgos_holder_lock::Handle {
    match acquire(resource, Mode::Ex, Wait::Ms(5000), KILL_WAIT_MS) {
        Acquire::Acquired(handle) => handle,
        other => panic!("could not take {}: {other:?}", resource.path.display()),
    }
}

fn commit_spec(repo: &Path) -> BorrowSpec {
    let argv = ["git", "-C", &repo.to_string_lossy(), "commit", "-q", "--allow-empty", "-m", "borrowed"].map(String::from).to_vec();
    BorrowSpec { argv, cwd: Some(repo.to_path_buf()), env: git_env(), clear_env: false, stdio: BorrowStdio::Null }
}

fn write_hook(repo: &Path, name: &str, body: &str) {
    fs::write(repo.join(".git/hooks").join(name), body).unwrap();
}

fn assert_keeper_gone() {
    wait_until(Duration::from_secs(3), "the job-keeper to exit", || children_named("fgos.exe").is_empty());
}

#[test]
fn a_borrowed_commit_ends_what_its_hook_left_behind_and_leaves_nothing() {
    let _serial = serial();
    let dir = temp_dir("commit");
    let repo = dir.join("repo");
    init_repo(git(), &repo).unwrap();
    let pidfile = dir.join("sleep.pid");
    write_hook(&repo, "pre-commit", &format!("#!/bin/sh\nsleep 30 >/dev/null 2>&1 </dev/null &\necho $(cat /proc/$!/winpid) > '{}'\nexit 0\n", sh_path(&pidfile)));
    let resource = Resource::new("wb-commit", dir.join("commit.lock"));
    let handle = take(&resource);

    let outcome = run_borrowed(&handle, &commit_spec(&repo), &helper()).expect("run_borrowed");

    assert_eq!(outcome.exit, Some(0));
    assert!(outcome.leftovers_killed >= 1, "{outcome:?}");
    let sleeper = pids_in(&pidfile);
    assert_eq!(sleeper.len(), 1, "the hook wrote one pid");
    assert_eq!(ended(sleeper[0]), Some(true), "the hook's background process is signaled when run_borrowed returns");
    assert!(!record_path(&resource.path).exists(), "the predecessor record is removed");
    assert_keeper_gone();
    release(handle);
    assert_eq!(probe(&resource).unwrap(), Probe::Free);
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn a_hook_inside_the_job_is_a_borrower_and_a_sibling_outside_it_is_not() {
    let _serial = serial();
    let dir = temp_dir("check");
    let repo = dir.join("repo");
    init_repo(git(), &repo).unwrap();
    let resource = Resource::new("wb-check", dir.join("check.lock"));
    let jobfile = dir.join("job.txt");
    let marker = dir.join("hook.json");
    let go = dir.join("go");
    write_hook(
        &repo,
        "pre-commit",
        &format!(
            "#!/bin/sh\necho \"$FGOS_LOCK_JOB\" > '{job}'\n'{fgos}' internal lock-fd --protocol 1 --borrowed-check '{lock}' > '{marker}'\nwhile [ ! -f '{go}' ]; do sleep 0.05; done\nexit 0\n",
            job = sh_path(&jobfile),
            fgos = sh_path(&fgos()),
            lock = sh_path(&resource.path),
            marker = sh_path(&marker),
            go = sh_path(&go),
        ),
    );
    let handle = take(&resource);
    std::thread::scope(|scope| {
        let borrow = scope.spawn(|| run_borrowed(&handle, &commit_spec(&repo), &helper()));
        let job_env = wait_for_file(&jobfile, "the hook to write its FGOS_LOCK_JOB").trim().to_string();
        let hook_says: Value = serde_json::from_str(wait_for_file(&marker, "the hook's borrowed-check answer").trim()).unwrap();
        assert_eq!(hook_says["result"], "borrower", "{hook_says}");

        let sibling = Command::new(fgos())
            .args(["internal", "lock-fd", "--protocol", "1", "--borrowed-check"])
            .arg(&resource.path)
            .env("FGOS_LOCK_JOB", &job_env)
            .stdin(Stdio::null())
            .output()
            .unwrap();
        let sibling_says: Value = serde_json::from_slice(&sibling.stdout).unwrap();
        assert_eq!((sibling_says["result"].as_str(), sibling_says["reason"].as_str()), (Some("not-borrower"), Some("not-in-job")), "{sibling_says}");
        assert_eq!(sibling.status.code(), Some(10));

        fs::write(&go, "go").unwrap();
        assert_eq!(borrow.join().unwrap().expect("run_borrowed").exit, Some(0));
    });
    release(handle);
    let _ = fs::remove_dir_all(&dir);
}

/// The commands a holder that dies mid-borrow leaves running.
fn blocking_script(pidfile: &Path) -> String {
    format!("sleep 60 & echo $(cat /proc/$!/winpid) >> '{}'; sleep 60", sh_path(pidfile))
}

#[test]
fn a_holder_that_dies_mid_borrow_leaves_a_job_the_next_acquire_empties_before_admitting() {
    let _serial = serial();
    let dir = temp_dir("dead-holder");
    let resource = Resource::new("wb-dead", dir.join("dead.lock"));
    let mut violations = Vec::new();
    for round in 0..50 {
        let pidfile = dir.join(format!("pids-{round}"));
        let mut hold = Hold::start(&resource.path, &dir.join(format!("work-{round}")), KILL_WAIT_MS).expect("helper acquires");
        let n = hold.borrow(&["sh", "-c", &blocking_script(&pidfile)]);
        let shell = hold.started_pid(n);
        wait_for_file(&pidfile, "the borrowed script to start its background process");
        hold.kill();

        let mut members = pids_in(&pidfile);
        members.push(shell);
        let Acquire::Acquired(handle) = acquire(&resource, Mode::Ex, Wait::Ms(10_000), KILL_WAIT_MS) else { panic!("round {round}: the next acquire did not admit") };
        for pid in &members {
            if ended(*pid) != Some(true) {
                violations.push((round, *pid));
            }
        }
        release(handle);
    }
    assert!(violations.is_empty(), "members still running when acquire returned: {violations:?}");
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn a_keeper_that_cannot_open_its_job_does_not_acknowledge_and_leaves_nothing() {
    let _serial = serial();
    let dir = temp_dir("keeper");
    // The role on its own: a record naming a job that does not exist.
    let resource = Resource::new("wb-keeper", dir.join("keeper.lock"));
    let handle = take(&resource);
    let identity = fgos_process::facts::self_identity().unwrap();
    let domain = fgos_process::Domain::WindowsJob(fgos_process::WindowsJob {
        job: "Local\\fgos-borrow-no-such-job".to_string(),
        session_id: fgos_process::platform::windows_job::own_session().unwrap(),
        declared_at: fgos_process::platform::windows_job::filetime_now(),
        holder: identity,
        keeper: None,
    });
    handle.declare_domain(&domain).unwrap();
    let out = Command::new(fgos())
        .args(["internal", "holder-lock-helper", "job-keeper", "--job", "Local\\fgos-borrow-no-such-job", "--record"])
        .arg(record_path(&resource.path))
        .stdin(Stdio::null())
        .output()
        .unwrap();
    assert_eq!(out.status.code(), Some(1));
    assert!(out.stdout.is_empty(), "no acknowledgement without the job");
    fs::remove_file(record_path(&resource.path)).unwrap();

    // The port: a helper executable that never acknowledges.
    let comspec = std::env::var("COMSPEC").unwrap_or_else(|_| "cmd.exe".to_string());
    let repo = dir.join("repo");
    init_repo(git(), &repo).unwrap();
    let outcome = run_borrowed(&handle, &commit_spec(&repo), &HelperExe(comspec.into()));
    assert!(matches!(outcome, Err(BorrowError::Spawn(_))), "{outcome:?}");
    assert!(!record_path(&resource.path).exists(), "no record is left");
    assert!(children_named("fgos.exe").is_empty() && children_named("cmd.exe").is_empty(), "no process is left");
    release(handle);
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn a_holder_that_outlives_its_lock_is_not_killed_by_a_record_written_back() {
    let _serial = serial();
    let dir = temp_dir("outlives");
    let resource = Resource::new("wb-outlives", dir.join("outlives.lock"));
    // A child this process started before the borrow.
    let mut bystander = Command::new("ping").args(["-n", "120", "127.0.0.1"]).stdin(Stdio::null()).stdout(Stdio::null()).spawn().unwrap();
    let saved = dir.join("record.saved");
    let handle = take(&resource);
    let copy = BorrowSpec {
        argv: ["sh", "-c", &format!("cp '{}' '{}'", sh_path(&record_path(&resource.path)), sh_path(&saved))].map(String::from).to_vec(),
        cwd: None,
        env: Default::default(),
        clear_env: false,
        stdio: BorrowStdio::Null,
    };
    assert_eq!(run_borrowed(&handle, &copy, &helper()).expect("run_borrowed").exit, Some(0));
    release(handle);
    // What a failed removal would have left behind.
    fs::write(record_path(&resource.path), fs::read_to_string(&saved).unwrap()).unwrap();

    let hold = Hold::start(&resource.path, &dir.join("work"), KILL_WAIT_MS);
    let acquired = hold.is_ok();
    drop(hold);
    assert!(acquired, "another process acquires despite the stale record");
    assert_eq!(ended(std::process::id()), Some(false), "the first holder is alive");
    assert_eq!(ended(bystander.id()), Some(false), "its child is alive");
    let _ = bystander.kill();
    let _ = bystander.wait();
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn the_borrow_vectors_and_the_sibling_check_are_green_on_windows() {
    let _serial = serial();
    let report = borrow_vectors::run(git(), &helper(), &[], false).expect("vectors run");
    for v in &report.vectors {
        println!("vector {}: {} in {} ms ({})", v.name, if v.pass { "pass" } else { "FAIL" }, v.elapsed_ms, v.detail);
    }
    println!("sibling: {:?}; total {} ms; {}", report.sibling, report.elapsed_ms, report.git_version);
    assert_eq!(report.vectors.len(), 4);
    assert!(report.pass(), "{report:#?}");
}

const PROBE_ROLE: &str = "WB_PROBE_RESULT";
const PROBE_HANDLE: &str = "WB_PROBE_HANDLE";
const PROBE_IDENTITY: &str = "WB_PROBE_IDENTITY";

/// Who a handle value names: the volume and file index of the file behind it,
/// or `None` when the value is not a file handle of this process. A bare
/// "is this value open" test would be wrong: handle values are per process,
/// and the child's own handles can carry the same number.
fn file_identity(handle: HANDLE) -> Option<String> {
    // SAFETY: a zeroed out-structure for a handle value; a value that is not a file fails.
    unsafe {
        let mut info: BY_HANDLE_FILE_INFORMATION = std::mem::zeroed();
        (GetFileInformationByHandle(handle, &mut info) != 0).then(|| format!("{}:{}:{}", info.dwVolumeSerialNumber, info.nFileIndexHigh, info.nFileIndexLow))
    }
}


/// The borrowed child's side of the handle test: reports whether the handle
/// value it was given is open in this process. Does nothing unless a borrow
/// started it.
#[test]
fn borrowed_child_handle_probe() {
    let Ok(result) = std::env::var(PROBE_ROLE) else { return };
    let value: usize = std::env::var(PROBE_HANDLE).unwrap().parse().unwrap();
    let open = file_identity(value as HANDLE).is_some_and(|id| id == std::env::var(PROBE_IDENTITY).unwrap());
    fs::write(result, if open { "open" } else { "closed" }).unwrap();
}

#[test]
fn a_handle_the_holder_owns_is_not_open_in_the_borrowed_child() {
    let _serial = serial();
    let dir = temp_dir("handles");
    let resource = Resource::new("wb-handles", dir.join("handles.lock"));
    let handle = take(&resource);
    // Inheritable, as a handle opened by any other library in the holder may be.
    let owned = fs::File::create(dir.join("owned.txt")).unwrap();
    let raw = owned.as_raw_handle() as HANDLE;
    // SAFETY: setting the inherit flag on a handle this test owns.
    assert_ne!(unsafe { SetHandleInformation(raw, HANDLE_FLAG_INHERIT, HANDLE_FLAG_INHERIT) }, 0);
    let result = dir.join("probe.txt");
    let exe = std::env::current_exe().unwrap();
    let spec = BorrowSpec {
        argv: vec![exe.to_string_lossy().into_owned(), "--exact".into(), "borrowed_child_handle_probe".into(), "--nocapture".into()],
        cwd: None,
        env: [(PROBE_ROLE.to_string(), result.to_string_lossy().into_owned()), (PROBE_HANDLE.to_string(), (raw as usize).to_string()), (PROBE_IDENTITY.to_string(), file_identity(raw).expect("the holder's file has an identity"))].into_iter().collect(),
        clear_env: false,
        stdio: BorrowStdio::Null,
    };

    let outcome = run_borrowed(&handle, &spec, &helper()).expect("run_borrowed");

    assert_eq!(outcome.exit, Some(0));
    assert_eq!(fs::read_to_string(&result).unwrap(), "closed", "the holder's inheritable handle must not reach the borrowed child");
    assert_keeper_gone();
    release(handle);
    let _ = fs::remove_dir_all(&dir);
}
