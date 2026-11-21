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

use std::ffi::OsString;
use std::fs::File;
use std::io::{self, Read, Write};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{mpsc, Arc};
use std::time::{Duration, Instant};

use fgos_process::facts::{self, ProcTuple};
use fgos_process::platform::windows_job::{
    ancestor_chain, create_kill_job, filetime_now, job_name, open_job, own_session, JobView,
};
use fgos_process::platform::windows_spawn::{spawn, ChildStdio, SpawnSpec, Spawned};
use fgos_process::{Domain, DomainState, ProcId, WindowsJob};

use crate::driver;
use crate::port::{
    borrowed_argv, capture_chunk, probe, BorrowError, BorrowIo, BorrowIoOutcome, BorrowOutcome,
    BorrowSpec, BorrowStdio, BorrowedCheck, Handle, HelperExe, Mode, NotBorrowerReason, Probe,
    Resource, Termination,
};
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
const EMPTY_POLL: Duration = Duration::from_millis(1);

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
        BorrowControl {
            cancel: None,
            on_started: None,
        }
    }
}

fn setup_error(message: impl Into<String>) -> BorrowError {
    BorrowError::Spawn(io::Error::other(message.into()))
}

/// The job-keeper, started outside the job and inheriting nothing but its own
/// pipes. `Err` when it did not acknowledge within the bound; the keeper is
/// then ended.
fn start_keeper(
    helper: &HelperExe,
    job: &str,
    record: &std::path::Path,
) -> io::Result<(Spawned, File)> {
    let argv = helper.argv();
    let mut args: Vec<OsString> = argv[1..].iter().map(OsString::from).collect();
    args.extend([
        "job-keeper".into(),
        "--job".into(),
        job.into(),
        "--record".into(),
        record.as_os_str().to_os_string(),
    ]);
    let mut keeper = spawn(SpawnSpec {
        program: OsString::from(&argv[0]),
        args,
        cwd: None,
        env: None,
        creation_flags: CREATE_NO_WINDOW,
        stdin: ChildStdio::Piped,
        stdout: ChildStdio::Piped,
        stderr: ChildStdio::Null,
    })?;
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
    Err(io::Error::other(
        "job-keeper did not acknowledge that it opened the job",
    ))
}

/// The suspended child: `CREATE_SUSPENDED` so it cannot run, or create a
/// process outside the job, before assignment. It inherits the handles of its
/// three streams and nothing else the holder owns.
fn start_child(
    handle: &Handle,
    spec: &BorrowSpec,
    job: &str,
    program: &str,
    args: &[String],
    piped: bool,
) -> io::Result<Spawned> {
    // Names compare without case, as Windows reads them: a caller's `PATH` replaces the parent's `Path`.
    let mut env: std::collections::BTreeMap<String, (OsString, OsString)> =
        std::collections::BTreeMap::new();
    let mut set = |name: OsString, value: OsString| {
        env.insert(name.to_string_lossy().to_uppercase(), (name, value));
    };
    if !spec.clear_env {
        for (name, value) in std::env::vars_os() {
            set(name, value);
        }
    }
    for (name, value) in &spec.env {
        set(OsString::from(name), OsString::from(value));
    }
    set(
        OsString::from(LOCK_JOB_ENV),
        OsString::from(format!("{}:{job}", handle.name())),
    );
    let open = |path: &std::path::Path| {
        std::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(path)
    };
    let (stdin, stdout, stderr) = match &spec.stdio {
        // Explicit I/O supersedes the spec's stdio, as on Unix.
        _ if piped => (ChildStdio::Piped, ChildStdio::Piped, ChildStdio::Piped),
        BorrowStdio::Inherit => (
            ChildStdio::Inherit,
            ChildStdio::Inherit,
            ChildStdio::Inherit,
        ),
        BorrowStdio::Null => (ChildStdio::Null, ChildStdio::Null, ChildStdio::Null),
        BorrowStdio::Files { out, err } => (
            ChildStdio::Null,
            ChildStdio::File(open(out)?),
            ChildStdio::File(open(err)?),
        ),
    };
    spawn(SpawnSpec {
        program: OsString::from(program),
        args: args.iter().map(OsString::from).collect(),
        cwd: spec.cwd.clone(),
        env: Some(env.into_values().collect()),
        creation_flags: CREATE_SUSPENDED | CREATE_NO_WINDOW,
        stdin,
        stdout,
        stderr,
    })
}

/// What ends a borrow's explicit I/O early: the absolute deadline, or a
/// stream reader or the stdin writer that failed (a byte ceiling, an I/O error).
struct Limits<'a> {
    deadline: Instant,
    fault: &'a AtomicBool,
}

struct Waited {
    code: io::Result<u32>,
    /// The deadline, not the child, ended the wait.
    deadline_hit: bool,
}

/// Wait for the child, ending the job when a cancel arrives, the deadline
/// passes or an I/O fault is raised. Ending the job is the only termination
/// Windows has: there is no signal to give the child a grace first.
fn wait_child(
    child: &Spawned,
    job: &fgos_process::platform::windows_job::Job,
    control: &BorrowControl<'_>,
    limits: Option<&Limits<'_>>,
) -> Waited {
    if control.cancel.is_none() && limits.is_none() {
        return Waited {
            code: child.wait(),
            deadline_hit: false,
        };
    }
    let mut ended = false;
    let mut deadline_hit = false;
    loop {
        if !ended {
            let stop = if limits.is_some_and(|l| Instant::now() >= l.deadline) {
                deadline_hit = true;
                true
            } else {
                limits.is_some_and(|l| l.fault.load(Ordering::SeqCst))
                    || control.cancel.is_some_and(|c| c.load(Ordering::SeqCst))
            };
            if stop {
                ended = true;
                let _ = job.terminate();
            }
        }
        match child.try_wait() {
            Ok(None) => {}
            code => {
                return Waited {
                    code: code.map(|code| code.unwrap_or_default()),
                    deadline_hit,
                }
            }
        }
        std::thread::sleep(CANCEL_POLL);
    }
}

type Streamed = (Vec<u8>, Option<BorrowError>);

/// Read `pipe` to its end or `limit`, off this thread so a child that
/// ignores a stream cannot hide the deadline.
fn read_stream(
    mut pipe: File,
    limit: usize,
    stream: &'static str,
    fault: Arc<AtomicBool>,
) -> mpsc::Receiver<Streamed> {
    let (tx, rx) = mpsc::channel();
    std::thread::spawn(move || {
        let mut bytes = Vec::new();
        let failure = loop {
            match capture_chunk(&mut pipe, &mut bytes, limit, stream) {
                Ok(Some(true)) => {}
                Ok(Some(false)) => break None,
                Ok(None) => std::thread::sleep(EMPTY_POLL),
                Err(err) => {
                    fault.store(true, Ordering::SeqCst);
                    break Some(err);
                }
            }
        };
        let _ = tx.send((bytes, failure));
    });
    rx
}

/// Write `bytes` to the child, then close the pipe so EOF follows the last
/// byte. A child that closed its stdin early is not a fault.
fn write_stdin(
    mut pipe: File,
    bytes: Vec<u8>,
    fault: Arc<AtomicBool>,
) -> mpsc::Receiver<Option<BorrowError>> {
    let (tx, rx) = mpsc::channel();
    std::thread::spawn(move || {
        let failure = match pipe.write_all(&bytes).and_then(|()| pipe.flush()) {
            Err(err) if err.kind() != io::ErrorKind::BrokenPipe => {
                fault.store(true, Ordering::SeqCst);
                Some(BorrowError::Io(err))
            }
            _ => None,
        };
        drop(pipe);
        let _ = tx.send(failure);
    });
    rx
}

/// The piped streams of one explicit-I/O borrow.
struct Capture {
    stdin: mpsc::Receiver<Option<BorrowError>>,
    stdout: mpsc::Receiver<Streamed>,
    stderr: mpsc::Receiver<Streamed>,
}

#[derive(Default)]
struct Captured {
    stdout: Vec<u8>,
    stderr: Vec<u8>,
    fault: Option<BorrowError>,
}

impl Capture {
    fn start(child: &mut Spawned, io: &BorrowIo, fault: &Arc<AtomicBool>) -> io::Result<Self> {
        let (Some(stdin), Some(stdout), Some(stderr)) =
            (child.stdin.take(), child.stdout.take(), child.stderr.take())
        else {
            return Err(io::Error::other("the borrowed child has no pipes"));
        };
        Ok(Capture {
            stdin: write_stdin(stdin, io.stdin.clone(), fault.clone()),
            stdout: read_stream(stdout, io.stdout_limit, "stdout", fault.clone()),
            stderr: read_stream(stderr, io.stderr_limit, "stderr", fault.clone()),
        })
    }

    /// Collect what the threads read. The job is empty by now, so every
    /// pipe end its members held is closed; `wait` bounds a pipe something
    /// outside the job still holds open.
    fn finish(self, wait: Duration) -> Captured {
        let mut captured = Captured::default();
        let mut fault = |failure: Option<BorrowError>| {
            if captured.fault.is_none() {
                captured.fault = failure;
            }
        };
        let mut streams = Vec::new();
        for rx in [&self.stdout, &self.stderr] {
            match rx.recv_timeout(wait) {
                Ok((bytes, failure)) => {
                    streams.push(bytes);
                    fault(failure);
                }
                Err(_) => {
                    streams.push(Vec::new());
                    fault(Some(BorrowError::Io(io::Error::other(
                        "a borrowed stream stayed open after the job ended",
                    ))));
                }
            }
        }
        if let Ok(failure) = self.stdin.recv_timeout(wait) {
            fault(failure);
        }
        captured.stderr = streams.pop().unwrap_or_default();
        captured.stdout = streams.pop().unwrap_or_default();
        captured
    }
}

/// Release rule step 0: end the job and wait for the job view to show it
/// empty, at most `kill_wait`. The view adds the in-job process scan to the id
/// list, because the list alone can omit a member that is still running and
/// the job's count can drop before the process object is signaled. `Ok(members
/// that were still running)`; `Err(pids left)` when the bound passes.
fn empty_the_job(
    job: &fgos_process::platform::windows_job::Job,
    name: &str,
    kill_wait: Duration,
) -> Result<u32, Vec<u32>> {
    let Some(mut view) = JobView::open(name, true) else {
        let _ = job.terminate();
        return Err(Vec::new());
    };
    let live = view.live_pids().len() as u32;
    let _ = job.terminate();
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
pub(crate) fn run(
    handle: &Handle,
    spec: &BorrowSpec,
    helper: &HelperExe,
    control: &BorrowControl<'_>,
) -> Result<BorrowOutcome, BorrowError> {
    run_core(handle, spec, helper, control, None).map(|(outcome, _)| outcome)
}

/// [`run`] with the child's stdin, stdout and stderr piped: `io.stdin` in,
/// bounded capture out, `io.deadline` absolute. The same release rule ends
/// the job before this returns, whatever ended the call.
pub(crate) fn run_io(
    handle: &Handle,
    spec: &BorrowSpec,
    helper: &HelperExe,
    io: &BorrowIo,
) -> Result<BorrowIoOutcome, BorrowError> {
    let (outcome, captured) = run_core(handle, spec, helper, &BorrowControl::none(), Some(io))?;
    Ok(BorrowIoOutcome {
        outcome,
        stdout: captured.stdout,
        stderr: captured.stderr,
        escaped: Vec::new(),
    })
}

fn run_core(
    handle: &Handle,
    spec: &BorrowSpec,
    helper: &HelperExe,
    control: &BorrowControl<'_>,
    io: Option<&BorrowIo>,
) -> Result<(BorrowOutcome, Captured), BorrowError> {
    crate::port::validate(handle)?;
    if !driver::current().supported() {
        return Err(BorrowError::Unsupported);
    }
    if handle.mode != Mode::Ex {
        return Err(BorrowError::InvalidSpec(
            "only an exclusive lock can be borrowed".into(),
        ));
    }
    let argv = borrowed_argv(&spec.argv);
    let Some((program, args)) = argv.split_first() else {
        return Err(BorrowError::InvalidSpec("argv is empty".into()));
    };
    let name = job_name(JOB_PREFIX, handle.name());
    let session_id =
        own_session().ok_or_else(|| setup_error("cannot read this process's Windows session"))?;
    let holder =
        facts::self_identity().ok_or_else(|| setup_error("cannot read this process's identity"))?;
    let record = predecessor::record_path(handle.path());
    let mut domain = WindowsJob {
        job: name.clone(),
        session_id,
        declared_at: filetime_now(),
        holder,
        keeper: None,
    };
    // Declared before the job exists: a holder that dies from here on leaves a
    // record the next contender can judge.
    handle
        .declare_domain(&Domain::WindowsJob(domain.clone()))
        .map_err(BorrowError::Spawn)?;
    let job = match create_kill_job(&name) {
        Ok(job) => job,
        Err(err) => {
            predecessor::remove_record(&record);
            return Err(BorrowError::Spawn(err));
        }
    };
    let (keeper, keeper_stdin) = match start_keeper(helper, &name, &record) {
        Ok(started) => started,
        Err(err) => {
            // No member exists and we hold the lock: nothing to leave behind.
            predecessor::remove_record(&record);
            return Err(BorrowError::Spawn(err));
        }
    };
    let keeper_tuple: Option<ProcTuple> = facts::identity_of(ProcId(keeper.id()));
    domain.keeper = keeper_tuple;
    if domain.keeper.is_none()
        || handle
            .declare_domain(&Domain::WindowsJob(domain.clone()))
            .is_err()
    {
        let _ = keeper.kill();
        let _ = keeper.wait();
        predecessor::remove_record(&record);
        return Err(setup_error("cannot record the job-keeper"));
    }
    let finish = |stdin: File| {
        let mut stdin = stdin;
        let _ = stdin.write_all(b"finished\n").and_then(|()| stdin.flush());
    };

    let mut child = match start_child(handle, spec, &name, program, args, io.is_some()) {
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
    let fault = Arc::new(AtomicBool::new(false));
    let capture = match io
        .map(|io| Capture::start(&mut child, io, &fault))
        .transpose()
    {
        Ok(capture) => capture,
        Err(err) => {
            let _ = child.kill();
            let _ = child.wait();
            let outcome = empty_the_job(&job, &name, Duration::from_millis(handle.kill_wait_ms));
            finish(keeper_stdin);
            if outcome.is_ok() {
                predecessor::remove_record(&record);
            }
            return Err(BorrowError::Spawn(err));
        }
    };
    if let Err(err) = child.assign_and_resume(&job) {
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
    let limits = io.map(|io| Limits {
        deadline: io.deadline,
        fault: &fault,
    });
    let waited = wait_child(&child, &job, control, limits.as_ref());
    let kill_wait = Duration::from_millis(handle.kill_wait_ms);
    let emptied = empty_the_job(&job, &name, kill_wait);
    finish(keeper_stdin);
    let captured = capture.map(|c| c.finish(kill_wait)).unwrap_or_default();
    // A leftover that could not be killed or a failed wait outranks what the
    // I/O did, as on Unix.
    let outcome = settle(waited.code, emptied, || predecessor::remove_record(&record))?;
    if waited.deadline_hit {
        return Err(BorrowError::Deadline {
            termination: Termination::KilledAfterGrace,
            stdout: captured.stdout,
            stderr: captured.stderr,
        });
    }
    if let Some(failure) = captured.fault {
        return Err(failure);
    }
    Ok((outcome, captured))
}

/// A leftover that could not be killed outranks a failed wait (the port's
/// error precedence); the record is removed only once the domain is empty.
fn settle(
    waited: io::Result<u32>,
    emptied: Result<u32, Vec<u32>>,
    remove_record: impl FnOnce(),
) -> Result<BorrowOutcome, BorrowError> {
    let killed = match emptied {
        // The record stays: the domain is not empty, and the next contender
        // must judge it.
        Err(pids) => {
            let exit = waited.as_ref().ok().map(|code| *code as i32);
            return Err(BorrowError::LeftoverNotKilled {
                outcome: BorrowOutcome {
                    exit,
                    signal: None,
                    leftovers_killed: 0,
                },
                pids,
            });
        }
        Ok(killed) => killed,
    };
    remove_record();
    let exit_code = waited.map_err(BorrowError::Wait)?;
    Ok(BorrowOutcome {
        exit: Some(exit_code as i32),
        signal: None,
        leftovers_killed: killed,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_leftover_that_cannot_be_killed_outranks_a_failed_wait_and_keeps_the_record() {
        let mut removed = false;
        let failed_wait = Err(io::Error::other("wait failed"));
        let error = settle(failed_wait, Err(vec![4242]), || removed = true).unwrap_err();
        assert!(
            matches!(error, BorrowError::LeftoverNotKilled { ref pids, .. } if pids == &[4242])
        );
        assert!(error.to_string().starts_with("borrow-leftover-not-killed"));
        assert!(!removed);
        let mut removed = false;
        let error = settle(Err(io::Error::other("wait failed")), Ok(1), || {
            removed = true
        })
        .unwrap_err();
        assert!(matches!(error, BorrowError::Wait(_)));
        assert!(removed);
    }

    fn echoing(text: &str) -> (std::process::Child, File) {
        use std::os::windows::io::OwnedHandle;
        let mut child = std::process::Command::new("cmd.exe")
            .args(["/C", &format!("echo {text}")])
            .stdout(std::process::Stdio::piped())
            .spawn()
            .expect("cmd.exe");
        let pipe = File::from(OwnedHandle::from(child.stdout.take().expect("piped")));
        (child, pipe)
    }

    #[test]
    fn a_stream_within_its_ceiling_is_captured_whole_and_raises_no_fault() {
        let (mut child, pipe) = echoing("abc");
        let fault = Arc::new(AtomicBool::new(false));
        let (bytes, failure) = read_stream(pipe, 1024, "stdout", fault.clone())
            .recv_timeout(Duration::from_secs(10))
            .expect("the reader ends at end of stream");
        child.wait().unwrap();
        assert_eq!(bytes, b"abc\r\n");
        assert!(failure.is_none());
        assert!(!fault.load(Ordering::SeqCst));
    }

    #[test]
    fn a_stream_over_its_ceiling_stops_the_reader_and_raises_the_fault() {
        let (mut child, pipe) = echoing("abcdefghij");
        let fault = Arc::new(AtomicBool::new(false));
        let (bytes, failure) = read_stream(pipe, 4, "stdout", fault.clone())
            .recv_timeout(Duration::from_secs(10))
            .expect("the reader ends at the ceiling");
        child.wait().unwrap();
        assert!(bytes.len() <= 4);
        assert!(matches!(failure, Some(BorrowError::OutputLimit("stdout"))));
        assert!(fault.load(Ordering::SeqCst));
    }
}

/// The borrower test of a process that may be a member of a borrow job (a
/// git hook). All four must hold: (a) `fgos_lock_job` (`<lock name>:<job
/// name>`) names a job; (b) the predecessor record next to `lock_path` names
/// that job and a holder; (c) this process is in the job; (d) the recorded
/// holder (pid and creation time) is one of this process's ancestors, and the
/// lock is held.
pub fn borrowed_check_job(
    lock_path: &std::path::Path,
    fgos_lock_job: Option<&str>,
) -> BorrowedCheck {
    let fail = |reason| BorrowedCheck::NotBorrower(reason);
    let Some((name, job)) = fgos_lock_job
        .and_then(|value| value.split_once(':'))
        .filter(|(name, job)| !name.is_empty() && !job.is_empty())
    else {
        return fail(NotBorrowerReason::JobMissing);
    };
    let record = std::fs::read_to_string(predecessor::record_path(lock_path))
        .ok()
        .and_then(|text| serde_json::from_str::<serde_json::Value>(&text).ok())
        .and_then(|value| predecessor::parse_record(&value));
    let Some(Domain::WindowsJob(domain)) = record else {
        return fail(NotBorrowerReason::RecordMismatch);
    };
    if domain.job != job {
        return fail(NotBorrowerReason::RecordMismatch);
    }
    let in_job = open_job(job)
        .ok()
        .and_then(|opened| opened.contains(std::process::id()))
        .unwrap_or(false);
    if !in_job {
        return fail(NotBorrowerReason::NotInJob);
    }
    let holder_start = domain.holder.start_time.parse::<u64>().ok();
    let is_ancestor = ancestor_chain()
        .iter()
        .any(|(pid, created)| *pid == domain.holder.pid.0 && Some(*created) == holder_start);
    if !is_ancestor {
        return fail(NotBorrowerReason::HolderNotAncestor);
    }
    match probe(&Resource::new(name, lock_path)) {
        Ok(Probe::Held) => BorrowedCheck::Borrower,
        _ => fail(NotBorrowerReason::LockNotHeld),
    }
}
