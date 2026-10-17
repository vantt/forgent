//! Borrowing on Windows. A `LockFileEx` lock belongs to the process that took
//! it, so nothing is handed to the child: it runs inside a named
//! kill-on-close job this process creates, and the lock stays here for the
//! whole call. What a hook may then claim is membership of that job plus a
//! holder in its ancestor chain ([`borrowed_check_job`]).
//!
//! The release rule (`predecessor.v1.json`) ends the job before this returns.
//! A second job owner, the `job-keeper` role of the helper executable, keeps
//! the job name alive and polls it after a holder that died mid-borrow, so
//! the next contender finds a job it can open and judge.

use std::io::{self, Read, Write};
use std::os::windows::process::CommandExt;
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc;
use std::time::{Duration, Instant};

use fgos_process::facts::{self, ProcTuple};
use fgos_process::platform::windows_job::{ancestor_chain, assign_and_resume, create_kill_job, filetime_now, job_name, open_job, own_session};
use fgos_process::{job_view, Domain, DomainState, ProcId, WindowsJob};

use crate::driver;
use crate::port::{borrowed_argv, probe, BorrowError, BorrowOutcome, BorrowSpec, BorrowStdio, BorrowedCheck, Handle, HelperExe, Mode, NotBorrowerReason, Probe, Resource};
use crate::predecessor;

/// The variable that names a borrow job: `<lock name>:<job name>`.
pub const LOCK_JOB_ENV: &str = "FGOS_LOCK_JOB";

const JOB_PREFIX: &str = "fgos-borrow";
/// How long the keeper has to open the job and say so.
const KEEPER_ACK_WAIT: Duration = Duration::from_secs(2);
const CREATE_SUSPENDED: u32 = 0x0000_0004;
const CREATE_NO_WINDOW: u32 = 0x0800_0000;
/// How often the wait for the child looks at a cancel request.
const CANCEL_POLL: Duration = Duration::from_millis(2);
/// How often the job view is re-read while the release rule waits for it.
const EMPTY_POLL: Duration = Duration::from_micros(500);

/// What a caller that does more than wait can do to a running borrow.
pub(crate) struct BorrowControl<'a> {
    /// Set to end the borrow's job at once; the borrow still runs the release
    /// rule and returns.
    pub cancel: Option<&'a AtomicBool>,
    /// Called with the child's Windows pid once it runs inside the job.
    pub on_started: Option<&'a (dyn Fn(u32) + Sync)>,
}

impl BorrowControl<'_> {
    /// Nothing to report and nothing to cancel.
    pub(crate) fn none() -> BorrowControl<'static> {
        BorrowControl { cancel: None, on_started: None }
    }
}

fn setup_error(message: impl Into<String>) -> BorrowError {
    BorrowError::Spawn(io::Error::other(message.into()))
}

/// The job-keeper, started outside the job and not inheriting anything but
/// its own pipes. `Err` when it did not acknowledge within the bound; the
/// keeper is then ended.
fn start_keeper(helper: &HelperExe, job: &str, record: &std::path::Path) -> io::Result<(Child, ChildStdin)> {
    let argv = helper.argv();
    let mut cmd = Command::new(&argv[0]);
    cmd.args(&argv[1..]).arg("job-keeper").arg("--job").arg(job).arg("--record").arg(record);
    cmd.stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::null()).creation_flags(CREATE_NO_WINDOW);
    let mut keeper = cmd.spawn()?;
    let (Some(stdin), Some(mut stdout)) = (keeper.stdin.take(), keeper.stdout.take()) else {
        let _ = keeper.kill();
        let _ = keeper.wait();
        return Err(io::Error::other("job-keeper has no pipes"));
    };
    let (tx, rx) = mpsc::channel();
    std::thread::spawn(move || {
        let mut byte = [0u8; 1];
        let _ = tx.send(stdout.read_exact(&mut byte).is_ok() && byte[0] == b'K');
    });
    if rx.recv_timeout(KEEPER_ACK_WAIT).unwrap_or(false) {
        return Ok((keeper, stdin));
    }
    let _ = keeper.kill();
    let _ = keeper.wait();
    Err(io::Error::other("job-keeper did not acknowledge that it opened the job"))
}

/// The suspended child: std's own quoting and handle rules, `CREATE_SUSPENDED`
/// so it cannot run, or create a process outside the job, before assignment.
fn child_command(handle: &Handle, spec: &BorrowSpec, job: &str, program: &str, args: &[String]) -> io::Result<Command> {
    let mut cmd = Command::new(program);
    cmd.args(args);
    if let Some(cwd) = &spec.cwd {
        cmd.current_dir(cwd);
    }
    if spec.clear_env {
        cmd.env_clear();
    }
    cmd.envs(&spec.env);
    cmd.env(LOCK_JOB_ENV, format!("{}:{job}", handle.name()));
    match &spec.stdio {
        BorrowStdio::Inherit => {}
        BorrowStdio::Null => {
            cmd.stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null());
        }
        BorrowStdio::Files { out, err } => {
            let open = |path: &std::path::Path| std::fs::OpenOptions::new().create(true).append(true).open(path);
            cmd.stdin(Stdio::null()).stdout(open(out)?).stderr(open(err)?);
        }
    }
    cmd.creation_flags(CREATE_SUSPENDED | CREATE_NO_WINDOW);
    Ok(cmd)
}

/// Wait for the child, ending the job when a cancel arrives.
fn wait_child(child: &mut Child, job: &fgos_process::platform::windows_job::Job, control: &BorrowControl<'_>) -> io::Result<std::process::ExitStatus> {
    let Some(cancel) = control.cancel else { return child.wait() };
    let mut cancelled = false;
    loop {
        if let Some(status) = child.try_wait()? {
            return Ok(status);
        }
        if !cancelled && cancel.load(Ordering::SeqCst) {
            cancelled = true;
            let _ = job.terminate();
        }
        std::thread::sleep(CANCEL_POLL);
    }
}

/// Release rule step 0: end the job and wait for the job view to show it
/// empty, at most `kill_wait`. `Ok(members that were still live)`; `Err(pids
/// left)` when the bound passes.
fn empty_the_job(job: &fgos_process::platform::windows_job::Job, name: &str, kill_wait: Duration) -> Result<u32, Vec<u32>> {
    let live = job.active_processes().unwrap_or(0);
    let _ = job.terminate();
    let Some(mut view) = job_view(name) else { return Err(Vec::new()) };
    let deadline = Instant::now() + kill_wait;
    loop {
        if view.is_empty() == DomainState::Empty {
            return Ok(live);
        }
        if Instant::now() >= deadline {
            return Err(view.live_pids());
        }
        std::thread::sleep(EMPTY_POLL);
    }
}

/// Run `spec` with the holder's authority inside a fresh job. See the module
/// note; the steps follow `predecessor.v1.json`.
pub(crate) fn run(handle: &Handle, spec: &BorrowSpec, helper: &HelperExe, control: &BorrowControl<'_>) -> Result<BorrowOutcome, BorrowError> {
    if !driver::current().supported() {
        return Err(BorrowError::Unsupported);
    }
    if handle.mode != Mode::Ex {
        return Err(BorrowError::InvalidSpec("only an exclusive lock can be borrowed".into()));
    }
    let argv = borrowed_argv(&spec.argv);
    let Some((program, args)) = argv.split_first() else {
        return Err(BorrowError::InvalidSpec("argv is empty".into()));
    };
    let name = job_name(JOB_PREFIX, handle.name());
    let session_id = own_session().ok_or_else(|| setup_error("cannot read this process's Windows session"))?;
    let holder = facts::self_identity().ok_or_else(|| setup_error("cannot read this process's identity"))?;
    let record = predecessor::record_path(handle.path());
    let mut domain = WindowsJob { job: name.clone(), session_id, declared_at: filetime_now(), holder, keeper: None };
    // Declared before the job exists: a holder that dies from here on leaves a
    // record the next contender can judge.
    handle.declare_domain(&Domain::WindowsJob(domain.clone())).map_err(BorrowError::Spawn)?;
    let job = match create_kill_job(&name) {
        Ok(job) => job,
        Err(err) => {
            predecessor::remove_record(&record);
            return Err(BorrowError::Spawn(err));
        }
    };
    let (mut keeper, keeper_stdin) = match start_keeper(helper, &name, &record) {
        Ok(started) => started,
        Err(err) => {
            // No member exists and we hold the lock: nothing to leave behind.
            predecessor::remove_record(&record);
            return Err(BorrowError::Spawn(err));
        }
    };
    let keeper_tuple: Option<ProcTuple> = facts::identity_of(ProcId(keeper.id()));
    domain.keeper = keeper_tuple;
    if domain.keeper.is_none() || handle.declare_domain(&Domain::WindowsJob(domain.clone())).is_err() {
        let _ = keeper.kill();
        let _ = keeper.wait();
        predecessor::remove_record(&record);
        return Err(setup_error("cannot record the job-keeper"));
    }
    let finish = |stdin: ChildStdin| {
        let mut stdin = stdin;
        let _ = stdin.write_all(b"finished\n").and_then(|()| stdin.flush());
    };

    let mut child = match child_command(handle, spec, &name, program, args).and_then(|mut cmd| cmd.spawn()) {
        Ok(child) => child,
        Err(err) => {
            let outcome = empty_the_job(&job, &name, Duration::from_millis(handle.kill_wait_ms));
            finish(keeper_stdin);
            if outcome.is_ok() {
                predecessor::remove_record(&record);
            }
            return Err(BorrowError::Spawn(err));
        }
    };
    if let Err(err) = assign_and_resume(&job, &child) {
        let _ = child.wait();
        let outcome = empty_the_job(&job, &name, Duration::from_millis(handle.kill_wait_ms));
        finish(keeper_stdin);
        if outcome.is_ok() {
            predecessor::remove_record(&record);
        }
        return Err(BorrowError::Spawn(err));
    }
    if let Some(started) = control.on_started {
        started(child.id());
    }
    let waited = wait_child(&mut child, &job, control);
    let emptied = empty_the_job(&job, &name, Duration::from_millis(handle.kill_wait_ms));
    finish(keeper_stdin);
    let status = match waited {
        Ok(status) => status,
        Err(err) => return Err(BorrowError::Wait(err)),
    };
    let mut outcome = BorrowOutcome { exit: status.code(), signal: None, leftovers_killed: 0 };
    match emptied {
        Ok(killed) => {
            predecessor::remove_record(&record);
            outcome.leftovers_killed = killed;
            Ok(outcome)
        }
        // The record stays: the domain is not empty, and the next contender
        // must judge it.
        Err(pids) => Err(BorrowError::LeftoverNotKilled { outcome, pids }),
    }
}

/// The borrower test of a process that may be a member of a borrow job (a
/// git hook). All four must hold: (a) `fgos_lock_job` (`<lock name>:<job
/// name>`) names a job; (b) the predecessor record next to `lock_path` names
/// that job and a holder; (c) this process is in the job; (d) the recorded
/// holder (pid and creation time) is one of this process's ancestors, and the
/// lock is held.
pub fn borrowed_check_job(lock_path: &std::path::Path, fgos_lock_job: Option<&str>) -> BorrowedCheck {
    let fail = |reason| BorrowedCheck::NotBorrower(reason);
    let Some((name, job)) = fgos_lock_job.and_then(|value| value.split_once(':')).filter(|(name, job)| !name.is_empty() && !job.is_empty()) else {
        return fail(NotBorrowerReason::JobMissing);
    };
    let record = std::fs::read_to_string(predecessor::record_path(lock_path))
        .ok()
        .and_then(|text| serde_json::from_str::<serde_json::Value>(&text).ok())
        .and_then(|value| predecessor::parse_record(&value));
    let Some(Domain::WindowsJob(domain)) = record else { return fail(NotBorrowerReason::RecordMismatch) };
    if domain.job != job {
        return fail(NotBorrowerReason::RecordMismatch);
    }
    let in_job = open_job(job).ok().and_then(|opened| opened.contains(std::process::id())).unwrap_or(false);
    if !in_job {
        return fail(NotBorrowerReason::NotInJob);
    }
    let holder_start = domain.holder.start_time.parse::<u64>().ok();
    let is_ancestor = ancestor_chain().iter().any(|(pid, created)| *pid == domain.holder.pid.0 && Some(*created) == holder_start);
    if !is_ancestor {
        return fail(NotBorrowerReason::HolderNotAncestor);
    }
    match probe(&Resource::new(name, lock_path)) {
        Ok(Probe::Held) => BorrowedCheck::Borrower,
        _ => fail(NotBorrowerReason::LockNotHeld),
    }
}
