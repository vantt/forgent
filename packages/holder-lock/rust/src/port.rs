//! The OS-neutral lock port (`packages/holder-lock/contracts/holder-lock.port.v1.json`).
//!
//! Every operation is written once here on top of the per-OS [`LockDriver`];
//! the predecessor-domain rule (`predecessor`) and the release rule of
//! [`run_borrowed`] live in this core, never in a driver.
//!
//! A [`Handle`] owns the open file description that carries the lock.
//! Releasing it closes the description and settles exclusive Linux copies.
//! On POSIX nothing here ever calls
//! `LOCK_UN`: a borrowed copy of the description may share the lock. On
//! Windows no other process can share a lock, so every successful lock is
//! undone explicitly through [`LockDriver::before_close`] (see [`Locked`]).

use std::collections::BTreeMap;
use std::fs::{File, OpenOptions};
use std::io;
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};

use fgos_process::facts::ProcTuple;
#[cfg(unix)]
use fgos_process::FdSlot;
#[cfg(unix)]
use fgos_process::mapped::{spawn_mapped, MappedChild, MappedSpawn, MappedStdio};
use fgos_process::{Domain, WatchTrace};
use serde_json::{json, Value};

use crate::driver::{self, LockDriver, TryLock};
use crate::predecessor::{self, Admit};

/// Default bound on waiting for a killed predecessor domain to be signaled
/// (`lock.predecessorKillWaitMs`).
pub const DEFAULT_KILL_WAIT_MS: u64 = 2000;

/// The descriptor slot a borrowed description is handed to.
pub const BORROW_SLOT: u32 = 3;

/// The variable that names a borrowed description: `<lock name>:<slot>`.
pub const LOCK_FD_ENV: &str = "FGOS_LOCK_FD";

/// Lock mode.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Mode {
    /// Exclusive.
    Ex,
    /// Shared.
    Sh,
}

/// How long `acquire` may wait for a held lock.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Wait {
    /// One attempt.
    Try,
    /// Attempts until this many milliseconds elapsed.
    Ms(u64),
}

/// The executable that plays a helper role (`probe-holder`, `job-keeper`):
/// it runs `internal holder-lock-helper <role> ...` and hands control to
/// [`crate::helper::main`]. Production passes the current executable; tests
/// of a binary crate pass that crate's own binary, because inside a test
/// harness the current executable knows no roles.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HelperExe(pub PathBuf);

impl HelperExe {
    /// This process's own executable.
    pub fn current() -> io::Result<Self> {
        std::env::current_exe().map(HelperExe)
    }

    /// The argv prefix to which a role and its arguments are appended.
    pub fn argv(&self) -> Vec<std::ffi::OsString> {
        vec![self.0.clone().into_os_string(), "internal".into(), "holder-lock-helper".into()]
    }
}

/// A lock resource: its registry name and the absolute path of its lock file.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Resource {
    /// Registry lock name.
    pub name: String,
    /// Lock file path; created on first acquire, never removed while the
    /// resource lives.
    pub path: PathBuf,
}

impl Resource {
    /// A resource named `name` locked through the file at `path`.
    pub fn new(name: impl Into<String>, path: impl Into<PathBuf>) -> Self {
        Resource { name: name.into(), path: path.into() }
    }
}

/// Why a lock is held by someone else.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HeldReason {
    /// The kernel lock is held.
    KernelLockHeld,
    /// The kernel lock was free but the domain the previous holder declared
    /// could not be emptied within the kill wait.
    PredecessorDomainNotEmpty,
}

impl HeldReason {
    /// Contract name.
    pub fn as_str(self) -> &'static str {
        match self {
            HeldReason::KernelLockHeld => "kernel-lock-held",
            HeldReason::PredecessorDomainNotEmpty => "predecessor-domain-not-empty",
        }
    }
}

/// Why the driver cannot lock at all.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum UnavailableReason {
    /// No driver for this platform yet.
    UnsupportedPlatform,
    /// The lock file lives on a filesystem without kernel lock semantics.
    UnsupportedFilesystem,
    /// An I/O error other than "held".
    IoError,
}

impl UnavailableReason {
    /// Contract name.
    pub fn as_str(self) -> &'static str {
        match self {
            UnavailableReason::UnsupportedPlatform => "unsupported-platform",
            UnavailableReason::UnsupportedFilesystem => "unsupported-filesystem",
            UnavailableReason::IoError => "io-error",
        }
    }
}

/// Result of [`acquire`].
#[derive(Debug)]
pub enum Acquire {
    /// The kernel lock is held and the predecessor domain is empty.
    Acquired(Handle),
    /// Someone else holds it. No description is left open.
    Held {
        /// Which of the two conditions failed.
        reason: HeldReason,
        /// The predecessor domain (`{domainKind, domainId}` or the raw record)
        /// for `PredecessorDomainNotEmpty`.
        domain: Option<Value>,
    },
    /// The wait elapsed. No description is left open.
    Timeout {
        /// Milliseconds waited.
        waited_ms: u64,
    },
    /// The driver cannot lock this resource.
    Unavailable {
        /// Named reason.
        reason: UnavailableReason,
        /// Human detail.
        detail: String,
    },
}

/// A held lock. Opaque: callers never see the descriptor.
///
/// ```compile_fail
/// fn description(handle: &fgos_holder_lock::Handle) -> &std::fs::File {
///     handle.file()
/// }
/// ```
#[derive(Debug)]
pub struct Handle {
    file: Option<File>,
    resource: Resource,
    pub(crate) mode: Mode,
    pub(crate) kill_wait_ms: u64,
    /// Lagged per-spawn scan floor and latest successful proof start.
    /// Release alone decides whether any description copy remains.
    #[cfg_attr(not(unix), allow(dead_code))]
    since: std::sync::Mutex<(Option<fgos_process::facts::CreationMark>, Option<fgos_process::facts::CreationMark>)>,
}

impl Drop for Handle {
    fn drop(&mut self) {
        let _ = self.settle_release();
    }
}

impl Handle {
    fn file(&self) -> &File {
        self.file.as_ref().expect("live handle owns its file")
    }

    fn settle_release(&mut self) -> Release {
        let Some(file) = self.file.take() else { return Release::Released { killed: 0 }; };
        #[cfg(target_os = "linux")]
        if self.mode == Mode::Ex {
            return driver::flock::settle_release(file, Duration::from_millis(self.kill_wait_ms));
        }
        driver::current().before_close(&file);
        drop(file);
        Release::Released { killed: 0 }
    }

    /// Registry name of the lock.
    pub fn name(&self) -> &str {
        &self.resource.name
    }

    /// Lock file path.
    pub fn path(&self) -> &Path {
        &self.resource.path
    }

    /// Lagged scan floor for fork-inherited copies; release settles transfers.
    #[cfg_attr(not(unix), allow(dead_code))]
    fn since(&self) -> Option<fgos_process::facts::CreationMark> {
        self.since.lock().ok().and_then(|since| since.0)
    }

    /// Advance the per-spawn floor by one successful proof.
    #[cfg_attr(not(unix), allow(dead_code))]
    fn proven_alone_at(&self, started: Option<fgos_process::facts::CreationMark>) {
        if let Ok(mut since) = self.since.lock() {
            // Keep the previous proof's start: a fork not yet visible during
            // this proof must remain eligible for the next drain.
            if started.is_some_and(|new| since.1.is_none_or(|old| new.at > old.at)) {
                since.0 = since.1;
                since.1 = started;
            }
        }
    }

    /// Record the process domain this holder is about to create, before it
    /// creates it (`<lockFile>.predecessor.json`, temp file then rename). A
    /// later holder that finds this domain not empty ends it first.
    /// Only an exclusive holder may declare one: a second shared holder
    /// would find it populated and kill it.
    pub fn declare_domain(&self, domain: &Domain) -> io::Result<()> {
        if self.mode != Mode::Ex {
            return Err(io::Error::new(io::ErrorKind::InvalidInput, "only an exclusive holder declares a domain"));
        }
        predecessor::declare(&predecessor::record_path(&self.resource.path), domain)
    }
}

/// Lock levels of [`Guarantee`].
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Level {
    /// Enforced by the kernel and measured.
    Kernel,
    /// Kernel semantics expected, not measured yet.
    KernelUnmeasured,
    /// Enforced through a job/helper process plus the predecessor rule.
    JobScoped,
    /// Not provided by this driver.
    Unsupported,
    /// No guarantee (network filesystem).
    None,
}

impl Level {
    /// Contract name.
    pub fn as_str(self) -> &'static str {
        match self {
            Level::Kernel => "kernel",
            Level::KernelUnmeasured => "kernel-unmeasured",
            Level::JobScoped => "job-scoped",
            Level::Unsupported => "unsupported",
            Level::None => "none",
        }
    }
}

/// What the driver guarantees for lock files in one directory.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Guarantee {
    /// Driver name (`flock`, `unsupported`).
    pub driver: &'static str,
    /// Mutual exclusion.
    pub exclusion: Level,
    /// Borrowing through `run_borrowed`.
    pub borrow: Level,
    /// Listing the holders.
    pub holders: Level,
    /// `linux`, `macos`, `windows`, ...
    pub platform: &'static str,
    /// Free-text notes (best-effort containment, the reason for `none`).
    pub notes: Vec<String>,
}

impl Guarantee {
    /// The contract JSON shape.
    pub fn to_json(&self) -> Value {
        json!({
            "driver": self.driver,
            "exclusion": self.exclusion.as_str(),
            "borrow": self.borrow.as_str(),
            "holders": self.holders.as_str(),
            "platform": self.platform,
            "notes": self.notes,
        })
    }

    /// Whether a lock may be taken at all (exclusion is a kernel level).
    pub fn usable(&self) -> bool {
        matches!(self.exclusion, Level::Kernel | Level::KernelUnmeasured | Level::JobScoped)
    }
}

/// Result of [`probe`].
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Probe {
    /// Nobody holds it exclusively.
    Free,
    /// An exclusive holder exists.
    Held,
}

/// Result of [`holders`].
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum HoldersList {
    /// Every process holding a lock on the file, as far as readable.
    List(Vec<ProcTuple>),
    /// The platform cannot list holders.
    Unlistable(String),
}

/// Where a borrowing child's stdio goes.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub enum BorrowStdio {
    /// Inherit the caller's stdio.
    #[default]
    Inherit,
    /// `/dev/null` for all three.
    Null,
    /// stdin from null; stdout and stderr appended to these files (Windows
    /// only: the `lock-hold` helper hands a Node caller the output this way).
    Files {
        /// Receives the child's stdout.
        out: PathBuf,
        /// Receives the child's stderr.
        err: PathBuf,
    },
}

/// The command [`run_borrowed`] runs with the holder's authority.
#[derive(Debug, Clone, Default)]
pub struct BorrowSpec {
    /// Program and arguments.
    pub argv: Vec<String>,
    /// Working directory; `None` keeps the caller's.
    pub cwd: Option<PathBuf>,
    /// Variables set on top of the caller's environment, or, with
    /// `clear_env`, the child's whole environment.
    pub env: BTreeMap<String, String>,
    /// Start the child from an empty environment instead of this process's.
    pub clear_env: bool,
    /// Where the child's stdio goes.
    pub stdio: BorrowStdio,
}

/// Result of [`run_borrowed`].
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BorrowOutcome {
    /// Exit code, when the child exited.
    pub exit: Option<i32>,
    /// Signal number, when a signal ended it.
    pub signal: Option<i32>,
    /// Processes (Linux) or process groups (macOS) still holding the
    /// description after the child exited, ended before returning.
    pub leftovers_killed: u32,
}

/// Explicit I/O and execution bound for [`run_borrowed_io`].
#[derive(Debug, Clone)]
pub struct BorrowIo {
    /// Binary input; EOF follows the last byte.
    pub stdin: Vec<u8>,
    /// Maximum captured stdout bytes.
    pub stdout_limit: usize,
    /// Maximum captured stderr bytes.
    pub stderr_limit: usize,
    /// Absolute execution deadline (cleanup completes before return).
    pub deadline: Instant,
}

/// Completed scoped borrow. No child, pipe or description escapes.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BorrowIoOutcome {
    /// Child status and leftover cleanup.
    pub outcome: BorrowOutcome,
    /// Captured binary stdout.
    pub stdout: Vec<u8>,
    /// Captured binary stderr.
    pub stderr: Vec<u8>,
}

/// Why [`run_borrowed`] failed.
#[derive(Debug)]
pub enum BorrowError {
    /// The acquired description no longer names the current lock resource.
    ResourceReplaced,
    /// Explicit bounded I/O is unavailable on this platform.
    IoUnsupported,
    /// A captured stream exceeded its byte ceiling; cleanup has completed.
    OutputLimit(&'static str),
    /// Execution deadline expired; cleanup has completed.
    Deadline,
    /// Reading or writing explicit I/O failed; cleanup has completed.
    Io(io::Error),
    /// The handle is shared, or the spec has no program.
    InvalidSpec(String),
    /// The child could not be started.
    Spawn(io::Error),
    /// Waiting for the child failed.
    Wait(io::Error),
    /// The platform cannot borrow.
    Unsupported,
    /// A foreign description holder was not killed. The handle stays held;
    /// no successful drain or release is claimed.
    ForeignHolder {
        /// Processes outside the borrowing domain; never signaled.
        pids: Vec<u32>,
    },
    /// Borrowing domain could not be drained.
    LeftoverNotKilled {
        /// What the child itself returned.
        outcome: BorrowOutcome,
        /// Pids that were still there.
        pids: Vec<u32>,
    },
}

impl std::fmt::Display for BorrowError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            BorrowError::ForeignHolder { pids } => write!(f, "lock-description-foreign-holder: {pids:?}"),
            BorrowError::ResourceReplaced => write!(f, "lock-resource-replaced"),
            BorrowError::IoUnsupported => write!(f, "borrow-io-unsupported: explicit I/O requires Unix"),
            BorrowError::OutputLimit(stream) => write!(f, "borrow-output-limit: {stream}"),
            BorrowError::Deadline => write!(f, "borrow-deadline"),
            BorrowError::Io(err) => write!(f, "borrow-io-failed: {err}"),
            BorrowError::InvalidSpec(why) => write!(f, "borrow-spec-invalid: {why}"),
            BorrowError::Spawn(err) => write!(f, "borrow-spawn-failed: {err}"),
            BorrowError::Wait(err) => write!(f, "borrow-wait-failed: {err}"),
            BorrowError::Unsupported => write!(f, "borrow-unsupported: no lock driver on this platform"),
            BorrowError::LeftoverNotKilled { pids, .. } => write!(f, "borrow-leftover-not-killed: {pids:?}"),
        }
    }
}

impl std::error::Error for BorrowError {}

/// Outcome of locking one description, before the predecessor rule.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DescriptionLock {
    /// The description holds the lock.
    Locked,
    /// Someone else holds it (only for [`Wait::Try`]).
    Held,
    /// [`Wait::Ms`] elapsed.
    Timeout {
        /// Milliseconds waited.
        waited_ms: u64,
    },
}

/// A lock this port took on `file` and has not handed on yet. Dropping it
/// calls [`LockDriver::before_close`], so a lock taken for a short check, or
/// abandoned on an early return, never lingers. Explicit unlock is safe on
/// Windows only, where a lock cannot be shared with another process; on
/// POSIX `before_close` does nothing and the close alone releases it. Call
/// [`Locked::keep`] when the lock stays with the file (a held [`Handle`]).
struct Locked<'a> {
    drv: &'a dyn LockDriver,
    file: Option<&'a File>,
}

impl<'a> Locked<'a> {
    fn new(drv: &'a dyn LockDriver, file: &'a File) -> Self {
        Locked { drv, file: Some(file) }
    }

    /// The lock now belongs to whoever owns the file.
    fn keep(mut self) {
        self.file = None;
    }
}

impl Drop for Locked<'_> {
    fn drop(&mut self) {
        if let Some(file) = self.file {
            self.drv.before_close(file);
        }
    }
}

/// Lock the description `file` in `mode`, polling non-blocking attempts for
/// [`Wait::Ms`]. Never blocks in the kernel, so a caller's own deadline is
/// always honored.
pub fn lock_description(file: &File, mode: Mode, wait: Wait) -> io::Result<DescriptionLock> {
    lock_description_with(driver::current(), file, mode, wait)
}

fn lock_description_with(drv: &dyn LockDriver, file: &File, mode: Mode, wait: Wait) -> io::Result<DescriptionLock> {
    let started = Instant::now();
    let deadline = match wait {
        Wait::Try => None,
        Wait::Ms(ms) => Some(started + Duration::from_millis(ms)),
    };
    lock_until(drv, file, mode, started, deadline)
}

/// Poll non-blocking attempts until `deadline` (`None`: one attempt). A
/// timeout is only reported once the deadline has passed; `waited_ms`
/// counts from `started`.
fn lock_until(drv: &dyn LockDriver, file: &File, mode: Mode, started: Instant, deadline: Option<Instant>) -> io::Result<DescriptionLock> {
    let mut pause = Duration::from_millis(1);
    loop {
        if drv.try_lock(file, mode)? == TryLock::Locked {
            return Ok(DescriptionLock::Locked);
        }
        let Some(deadline) = deadline else {
            return Ok(DescriptionLock::Held);
        };
        let now = Instant::now();
        if now >= deadline {
            return Ok(DescriptionLock::Timeout { waited_ms: started.elapsed().as_millis() as u64 });
        }
        std::thread::sleep(pause.min(deadline - now));
        pause = (pause * 2).min(Duration::from_millis(10));
    }
}

fn open_lock_file(path: &Path) -> io::Result<File> {
    // std opens with O_CLOEXEC on every unix; O_RDWR because NFSv4 and BSD
    // refuse an exclusive lock on a read-only descriptor.
    OpenOptions::new().read(true).write(true).create(true).truncate(false).open(path)
}

/// Take `resource` in `mode`. Returns `Acquired` only when the kernel lock is
/// held on a description of the file now at the path AND the domain the
/// previous holder declared is empty (killed at once if it is not, waiting
/// at most `kill_wait_ms` for it to be gone).
pub fn acquire(resource: &Resource, mode: Mode, wait: Wait, kill_wait_ms: u64) -> Acquire {
    acquire_with_trace(resource, mode, wait, kill_wait_ms).0
}

/// [`acquire`], plus what the predecessor rule saw (see
/// [`predecessor::admit_with_trace`]); the same code path, the trace is empty
/// when no record was judged.
#[doc(hidden)]
pub fn acquire_with_trace(resource: &Resource, mode: Mode, wait: Wait, kill_wait_ms: u64) -> (Acquire, WatchTrace) {
    let mut trace = WatchTrace::default();
    let answer = acquire_traced(resource, mode, wait, kill_wait_ms, &mut trace);
    (answer, trace)
}

fn acquire_traced(resource: &Resource, mode: Mode, wait: Wait, kill_wait_ms: u64, trace: &mut WatchTrace) -> Acquire {
    let drv = driver::current();
    if !drv.supported() {
        return Acquire::Unavailable { reason: UnavailableReason::UnsupportedPlatform, detail: drv.unsupported_detail().to_string() };
    }
    let started = Instant::now();
    let deadline = match wait {
        Wait::Try => started,
        Wait::Ms(ms) => started + Duration::from_millis(ms),
    };
    // A lock file replaced under the path between open and lock is retried;
    // a bounded number of times for a single try.
    let mut replaced = 0u32;
    loop {
        // Taken before the open: nothing created earlier can inherit it.
        let opened_after = fgos_process::facts::creation_mark();
        let file = match open_lock_file(&resource.path) {
            Ok(file) => file,
            Err(err) => return Acquire::Unavailable { reason: UnavailableReason::IoError, detail: format!("open {}: {err}", resource.path.display()) },
        };
        match drv.file_guarantee(&file) {
            Ok(g) if !g.usable() => {
                return Acquire::Unavailable { reason: UnavailableReason::UnsupportedFilesystem, detail: g.notes.join("; ") };
            }
            Ok(_) => {}
            Err(err) => return Acquire::Unavailable { reason: UnavailableReason::IoError, detail: format!("statfs {}: {err}", resource.path.display()) },
        }
        let until = match wait {
            Wait::Try => None,
            Wait::Ms(_) => Some(deadline),
        };
        match lock_until(drv, &file, mode, started, until) {
            Ok(DescriptionLock::Locked) => {}
            Ok(DescriptionLock::Held) => return Acquire::Held { reason: HeldReason::KernelLockHeld, domain: None },
            Ok(DescriptionLock::Timeout { .. }) => {
                return Acquire::Timeout { waited_ms: started.elapsed().as_millis() as u64 };
            }
            Err(err) => return Acquire::Unavailable { reason: UnavailableReason::IoError, detail: format!("flock {}: {err}", resource.path.display()) },
        }
        let locked = Locked::new(drv, &file);
        if !drv.same_file(&file, &resource.path) {
            drop(locked);
            drop(file);
            replaced += 1;
            if replaced > 8 || (wait != Wait::Try && Instant::now() >= deadline) {
                return Acquire::Timeout { waited_ms: started.elapsed().as_millis() as u64 };
            }
            continue;
        }
        let (admitted, seen) = predecessor::admit_with_trace(&predecessor::record_path(&resource.path), Duration::from_millis(kill_wait_ms));
        *trace = seen;
        if let Admit::NotEmpty { domain } = admitted {
            drop(locked);
            drop(file);
            return Acquire::Held { reason: HeldReason::PredecessorDomainNotEmpty, domain: Some(domain) };
        }
        locked.keep();
        return Acquire::Acquired(Handle { file: Some(file), resource: resource.clone(), mode, kill_wait_ms, since: std::sync::Mutex::new((opened_after, opened_after)) });
    }
}

/// Validate an acquired opaque exclusive handle without spawning or exposing
/// its description. This is a point-in-time resource check, not a new acquire
/// or a proof of continuous custody across a caller's operations.
pub fn validate(handle: &Handle) -> Result<(), BorrowError> {
    let drv = driver::current();
    if !drv.supported() {
        return Err(BorrowError::Unsupported);
    }
    if handle.mode != Mode::Ex {
        return Err(BorrowError::InvalidSpec("only an exclusive lock can be borrowed".into()));
    }
    if !drv.same_file(handle.file(), &handle.resource.path) {
        return Err(BorrowError::ResourceReplaced);
    }
    #[cfg(unix)]
    {
        let annotation = format!("{}:{BORROW_SLOT}", handle.name());
        if borrowed_check(handle.file(), handle.path(), Some(&annotation), BORROW_SLOT) != BorrowedCheck::Borrower {
            return Err(BorrowError::ResourceReplaced);
        }
    }
    // Windows locks cannot be re-taken on the same handle. Handle is private,
    // acquired only by this port, and close-only, so its exclusive lock lives
    // until Drop; same_file above verifies the current resource identity.
    Ok(())
}

/// Validate exclusive authority and wait for transient fork/exec copies to
/// close. Never spawns or signals. Linux only; an observed foreign holder
/// refuses admission while the caller retains the opaque handle.
pub fn validate_quiescent(handle: &Handle) -> Result<(), BorrowError> {
    validate(handle)?;
    #[cfg(target_os = "linux")]
    {
        let started = fgos_process::facts::creation_mark();
        driver::flock::wait_unborrowed(handle.file(), Duration::from_millis(handle.kill_wait_ms), handle.since())
            .map_err(|left| BorrowError::ForeignHolder { pids: left.pids })?;
        handle.proven_alone_at(started);
        // Resource identity can change while transient holders drain.
        validate(handle)
    }
    #[cfg(not(target_os = "linux"))]
    {
        Err(BorrowError::Unsupported)
    }
}

/// Close a held description and return the same settle outcome used by Drop.
pub fn release(mut handle: Handle) -> Release {
    handle.settle_release()
}

/// Result of closing a handle and settling escaped description holders.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Release {
    /// No copy of the released exclusive description still holds the lock.
    Released {
        /// Escaped holders signalled during release.
        killed: u32,
    },
    /// `lock-release-stuck`: the bounded wait could not prove release.
    Stuck {
        /// Escaped holders signalled during release.
        killed: u32,
        /// Holders still observed; empty when kernel facts were unreadable.
        pids: Vec<u32>,
    },
}

fn is_git(program: &str) -> bool {
    let base = Path::new(program).file_name().and_then(|n| n.to_str()).unwrap_or(program);
    base == "git" || base.eq_ignore_ascii_case("git.exe")
}

/// The argv a borrowing child actually runs: git gets
/// `-c gc.auto=0 -c maintenance.auto=false` right after the program, so no
/// background `gc --auto` inherits the description.
pub fn borrowed_argv(argv: &[String]) -> Vec<String> {
    let mut out = Vec::with_capacity(argv.len() + 4);
    if let Some((program, rest)) = argv.split_first() {
        out.push(program.clone());
        if is_git(program) {
            out.extend(["-c", "gc.auto=0", "-c", "maintenance.auto=false"].map(String::from));
        }
        out.extend(rest.iter().cloned());
    }
    out
}

/// Run one child command with the holder's authority.
///
/// POSIX: the description goes to the child at slot 3 with
/// `FGOS_LOCK_FD=<name>:3`. After the child exits, whatever else still holds
/// the description within its process group or descendants is killed and
/// waited for; foreign holders are waited or refused, up to the handle's kill
/// wait, before this returns. Pre-existing descriptor recipients are settled
/// at Linux release rather than borrow return.
///
/// Windows: the child runs inside a named kill-on-close job this process
/// creates, a second job owner (`helper`, role `job-keeper`) outlives a dead
/// holder, and nothing is handed to the child (`borrow_windows`). `helper` is
/// unused on POSIX.
pub fn run_borrowed(handle: &Handle, spec: &BorrowSpec, helper: &HelperExe) -> Result<BorrowOutcome, BorrowError> {
    validate(handle)?;
    #[cfg(windows)]
    {
        crate::borrow_windows::run(handle, spec, helper, &crate::borrow_windows::BorrowControl::none())
    }
    #[cfg(unix)]
    {
        let _ = helper;
        run_borrowed_posix(handle, spec)
    }
}

#[cfg(unix)]
fn run_borrowed_posix(handle: &Handle, spec: &BorrowSpec) -> Result<BorrowOutcome, BorrowError> {
    let drv = driver::current();
    let mut request = borrowed_request(handle, spec)?;
    drv.prepare_borrow(&mut request);
    let mut child = spawn_mapped(&request, &[(FdSlot(BORROW_SLOT), handle.file())]).map_err(BorrowError::Spawn)?;
    finish_borrowed(handle, &mut child)
}

/// One child-drain rule for both Unix borrow forms. Keep the root unreaped while
/// ending leftovers, so neither its pid nor macOS process group can be reused.
#[cfg(unix)]
fn finish_borrowed(handle: &Handle, child: &mut MappedChild) -> Result<BorrowOutcome, BorrowError> {
    let pid = child.id();
    let waited = wait_exited_unreaped(pid).map_err(BorrowError::Wait);
    let started = fgos_process::facts::creation_mark();
    let since = handle.since();
    let leftovers = driver::current().end_leftovers(handle.file(), pid, Duration::from_millis(handle.kill_wait_ms), since);
    if leftovers.is_ok() {
        handle.proven_alone_at(started);
    }
    let status = child.wait().map_err(BorrowError::Wait)?;
    let (exit, signal) = exit_parts(&status);
    let mut outcome = BorrowOutcome { exit, signal, leftovers_killed: 0 };
    match leftovers {
        Ok(killed) => outcome.leftovers_killed = killed,
        Err(left) => {
            if left.foreign {
                return Err(BorrowError::ForeignHolder { pids: left.pids });
            }
            outcome.leftovers_killed = left.killed;
            return Err(BorrowError::LeftoverNotKilled { outcome, pids: left.pids });
        }
    }
    waited?;
    Ok(outcome)
}

/// The borrowing child's request: the argv `borrowed_argv` shapes, the
/// spec's environment plus the slot annotation, its stdio.
#[cfg(unix)]
fn borrowed_request(handle: &Handle, spec: &BorrowSpec) -> Result<MappedSpawn, BorrowError> {
    validate(handle)?;
    let drv = driver::current();
    if !drv.supported() {
        return Err(BorrowError::Unsupported);
    }
    if handle.mode != Mode::Ex {
        return Err(BorrowError::InvalidSpec("only an exclusive lock can be borrowed".into()));
    }
    let argv = borrowed_argv(&spec.argv);
    if argv.is_empty() {
        return Err(BorrowError::InvalidSpec("argv is empty".into()));
    }
    let mut env: Vec<(std::ffi::OsString, std::ffi::OsString)> = spec.env.iter().map(|(k, v)| (k.into(), v.into())).collect();
    env.push((LOCK_FD_ENV.into(), format!("{}:{BORROW_SLOT}", handle.resource.name).into()));
    let stdio = match &spec.stdio {
        BorrowStdio::Inherit => [MappedStdio::Inherit; 3],
        BorrowStdio::Null => [MappedStdio::Null; 3],
        BorrowStdio::Files { .. } => return Err(BorrowError::InvalidSpec("file stdio is only available on Windows".into())),
    };
    Ok(MappedSpawn {
        argv: argv.into_iter().map(Into::into).collect(),
        env,
        clear_env: spec.clear_env,
        cwd: spec.cwd.clone(),
        process_group: false,
        stdio,
    })
}

/// Synchronous bounded-I/O member of `run_borrowed`, with the same fd mapping,
/// predecessor handling and per-OS leftover domain. Unix only; Windows keeps
/// its existing borrow path and refuses this form before starting a child.
/// The spec's stdio is superseded by explicit input and captured output.
pub fn run_borrowed_io(handle: &Handle, spec: &BorrowSpec, io: &BorrowIo) -> Result<BorrowIoOutcome, BorrowError> {
    validate(handle)?;
    #[cfg(not(unix))]
    {
        let _ = (handle, spec, io);
        Err(BorrowError::IoUnsupported)
    }
    #[cfg(unix)]
    {
        run_borrowed_io_posix(handle, spec, io)
    }
}

#[cfg(unix)]
fn run_borrowed_io_posix(handle: &Handle, spec: &BorrowSpec, io: &BorrowIo) -> Result<BorrowIoOutcome, BorrowError> {
    use std::io::Write;
    let drv = driver::current();
    let mut explicit = spec.clone();
    explicit.stdio = BorrowStdio::Null;
    let mut request = borrowed_request(handle, &explicit)?;
    request.stdio = [MappedStdio::Piped; 3];
    drv.prepare_borrow(&mut request);
    let mut child = spawn_mapped(&request, &[(FdSlot(BORROW_SLOT), handle.file())]).map_err(BorrowError::Spawn)?;
    let pid = child.id();
    let mut input = child.stdin.take();
    let mut stdout = child.stdout.take().expect("piped stdout");
    let mut stderr = child.stderr.take().expect("piped stderr");
    let mut out = Vec::new();
    let mut err = Vec::new();
    // No reader/writer thread can outlive this scope. All three parent pipe
    // ends are nonblocking, so a child that ignores stdin cannot hide a deadline.
    let transfer = (|| -> Result<(), BorrowError> {
        nonblocking(input.as_ref().expect("piped stdin"))?;
        nonblocking(&stdout)?;
        nonblocking(&stderr)?;
        let mut written = 0;
        let (mut out_open, mut err_open) = (true, true);
        // Wake on pipe activity or on the root's exit instead of sleeping in
        // fixed steps; without a process descriptor, wake at least every 1 ms.
        let exit_fd = exit_descriptor(pid);
        loop {
            if Instant::now() >= io.deadline {
                return Err(BorrowError::Deadline);
            }
            if out_open {
                out_open = capture_available(&mut stdout, &mut out, io.stdout_limit, "stdout")?;
            }
            if err_open {
                err_open = capture_available(&mut stderr, &mut err, io.stderr_limit, "stderr")?;
            }
            if written == io.stdin.len() {
                input.take();
            }
            if let Some(pipe) = input.as_mut() {
                match pipe.write(&io.stdin[written..]) {
                    Ok(n) => written += n,
                    Err(e) if e.kind() == std::io::ErrorKind::WouldBlock || e.kind() == std::io::ErrorKind::Interrupted => {}
                    Err(e) if e.kind() == std::io::ErrorKind::BrokenPipe => { input.take(); }
                    Err(e) => return Err(BorrowError::Io(e)),
                }
                if written == io.stdin.len() {
                    input.take();
                }
            }
            if child_exited_unreaped(pid, true).map_err(BorrowError::Wait)? {
                return Ok(());
            }
            use std::os::fd::AsRawFd;
            let mut fds = Vec::with_capacity(4);
            if out_open {
                fds.push(libc::pollfd { fd: stdout.as_raw_fd(), events: libc::POLLIN, revents: 0 });
            }
            if err_open {
                fds.push(libc::pollfd { fd: stderr.as_raw_fd(), events: libc::POLLIN, revents: 0 });
            }
            if let Some(pipe) = input.as_ref() {
                fds.push(libc::pollfd { fd: pipe.as_raw_fd(), events: libc::POLLOUT, revents: 0 });
            }
            if let Some(fd) = exit_fd.as_ref() {
                fds.push(libc::pollfd { fd: fd.as_raw_fd(), events: libc::POLLIN, revents: 0 });
            }
            let left = io.deadline.saturating_duration_since(Instant::now());
            let step = if exit_fd.is_some() { left } else { left.min(Duration::from_millis(1)) };
            let timeout = step.as_millis().clamp(1, i32::MAX as u128) as libc::c_int;
            // SAFETY: poll reads and writes only the pollfd array it is given.
            if unsafe { libc::poll(fds.as_mut_ptr(), fds.len() as libc::nfds_t, timeout) } < 0 {
                let e = io::Error::last_os_error();
                if e.kind() != std::io::ErrorKind::Interrupted {
                    return Err(BorrowError::Io(e));
                }
            }
        }
    })();
    drop(input);
    if transfer.is_err() {
        // The root remains our unreaped child, so its identity cannot be reused.
        let _ = child.kill();
    }
    // Every path after spawn uses the original release rule, including I/O
    // setup/read/write failures. Keep the root unreaped during leftover cleanup.
    let outcome = finish_borrowed(handle, &mut child)?;
    transfer?;
    // Drain bytes already in the pipes after root exit and leftover cleanup.
    while capture_chunk(&mut stdout, &mut out, io.stdout_limit, "stdout")? == Some(true) {}
    while capture_chunk(&mut stderr, &mut err, io.stderr_limit, "stderr")? == Some(true) {}
    Ok(BorrowIoOutcome { outcome, stdout: out, stderr: err })
}

#[cfg(unix)]
fn nonblocking(pipe: &impl std::os::fd::AsRawFd) -> Result<(), BorrowError> {
    let fd = pipe.as_raw_fd();
    // SAFETY: fcntl only inspects/updates flags on a pipe owned by this call.
    let flags = unsafe { libc::fcntl(fd, libc::F_GETFL) };
    if flags < 0 || unsafe { libc::fcntl(fd, libc::F_SETFL, flags | libc::O_NONBLOCK) } < 0 {
        return Err(BorrowError::Io(io::Error::last_os_error()));
    }
    Ok(())
}

/// Read everything the pipe has now. `Ok(false)` once the writer side closed.
#[cfg(unix)]
fn capture_available(pipe: &mut impl std::io::Read, bytes: &mut Vec<u8>, limit: usize, stream: &'static str) -> Result<bool, BorrowError> {
    loop {
        match capture_chunk(pipe, bytes, limit, stream)? {
            Some(true) => {},
            Some(false) => return Ok(false),
            None => return Ok(true),
        }
    }
}

/// A descriptor that becomes readable when child `pid` exits (Linux pidfd).
/// `None` where the kernel has none; callers then poll in short steps.
#[cfg(unix)]
fn exit_descriptor(pid: u32) -> Option<std::os::fd::OwnedFd> {
    #[cfg(target_os = "linux")]
    {
        use std::os::fd::FromRawFd;
        // SAFETY: pidfd_open takes a pid and flags; the result is owned below.
        let fd = unsafe { libc::syscall(libc::SYS_pidfd_open, pid as libc::pid_t, 0 as libc::c_uint) };
        // SAFETY: a non-negative result is a new descriptor owned by nobody else.
        (fd >= 0).then(|| unsafe { std::os::fd::OwnedFd::from_raw_fd(fd as libc::c_int) })
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = pid;
        None
    }
}

#[cfg(unix)]
fn capture_chunk(pipe: &mut impl std::io::Read, bytes: &mut Vec<u8>, limit: usize, stream: &'static str) -> Result<Option<bool>, BorrowError> {
    let mut buf = [0; 8192];
    match pipe.read(&mut buf) {
        Ok(n) => {
            if n > limit.saturating_sub(bytes.len()) {
                return Err(BorrowError::OutputLimit(stream));
            }
            bytes.extend_from_slice(&buf[..n]);
            Ok(Some(n != 0))
        }
        Err(e) if e.kind() == io::ErrorKind::WouldBlock => Ok(None),
        Err(e) if e.kind() == io::ErrorKind::Interrupted => Ok(Some(true)),
        Err(e) => Err(BorrowError::Io(e)),
    }
}

/// Block until `pid` (a child of this process) has exited, without reaping it.
#[cfg(unix)]
fn wait_exited_unreaped(pid: u32) -> io::Result<()> {
    child_exited_unreaped(pid, false).map(|_| ())
}

#[cfg(unix)]
fn child_exited_unreaped(pid: u32, nonblocking: bool) -> io::Result<bool> {
    loop {
        // SAFETY: waitid fills a zeroed siginfo for our child; WNOWAIT keeps
        // the pid reserved through leftover cleanup.
        let mut info: libc::siginfo_t = unsafe { std::mem::zeroed() };
        let flags = libc::WEXITED | libc::WNOWAIT | if nonblocking { libc::WNOHANG } else { 0 };
        if unsafe { libc::waitid(libc::P_PID, pid as libc::id_t, &mut info, flags) } == 0 {
            return Ok(unsafe { info.si_pid() } != 0);
        }
        let err = io::Error::last_os_error();
        if err.raw_os_error() != Some(libc::EINTR) {
            return Err(err);
        }
    }
}

#[cfg(unix)]
fn exit_parts(status: &std::process::ExitStatus) -> (Option<i32>, Option<i32>) {
    use std::os::unix::process::ExitStatusExt;
    (status.code(), status.signal())
}

/// Why a description is not a borrower.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NotBorrowerReason {
    /// `FGOS_LOCK_FD` does not name this slot, or the slot is not open.
    FdMissing,
    /// The slot is another file than the lock file.
    InodeMismatch,
    /// The slot's description does not hold the lock (a sibling that opened
    /// the file itself).
    LockNotHeldByDescription,
    /// The lock file does not exist.
    NotALockFile,
    /// Windows: `FGOS_LOCK_JOB` is absent or malformed.
    JobMissing,
    /// Windows: the predecessor record is absent, unreadable, or names
    /// another job or no holder.
    RecordMismatch,
    /// Windows: this process is not a member of the job.
    NotInJob,
    /// Windows: the recorded holder is not one of this process's ancestors.
    HolderNotAncestor,
    /// Windows: the lock is free.
    LockNotHeld,
}

impl NotBorrowerReason {
    /// Contract name.
    pub fn as_str(self) -> &'static str {
        match self {
            NotBorrowerReason::FdMissing => "fd-missing",
            NotBorrowerReason::InodeMismatch => "inode-mismatch",
            NotBorrowerReason::LockNotHeldByDescription => "lock-not-held-by-description",
            NotBorrowerReason::NotALockFile => "not-a-lock-file",
            NotBorrowerReason::JobMissing => "job-missing",
            NotBorrowerReason::RecordMismatch => "record-mismatch",
            NotBorrowerReason::NotInJob => "not-in-job",
            NotBorrowerReason::HolderNotAncestor => "holder-not-ancestor",
            NotBorrowerReason::LockNotHeld => "lock-not-held",
        }
    }
}

/// Result of [`borrowed_check`].
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BorrowedCheck {
    /// The description at the slot is the holder's borrowed one.
    Borrower,
    /// It is not.
    NotBorrower(NotBorrowerReason),
}

/// The borrower test for a process that may have inherited a borrowed
/// description: all three must hold. `FGOS_LOCK_FD` (`fgos_lock_fd`) names
/// exactly `slot`; the description at the slot (`slot_file`) is the lock
/// file (same dev:ino as `lock_path`); a non-blocking exclusive lock on it
/// succeeds (true for the description that holds the lock, false for a
/// sibling that opened the file itself while the owner holds it).
pub fn borrowed_check(slot_file: &File, lock_path: &Path, fgos_lock_fd: Option<&str>, slot: u32) -> BorrowedCheck {
    let names_slot = fgos_lock_fd
        .and_then(|value| value.rsplit_once(':'))
        .is_some_and(|(name, s)| !name.is_empty() && s.parse::<u32>().ok() == Some(slot));
    if !names_slot {
        return BorrowedCheck::NotBorrower(NotBorrowerReason::FdMissing);
    }
    let meta = match std::fs::metadata(lock_path) {
        Ok(meta) => meta,
        Err(_) => return BorrowedCheck::NotBorrower(NotBorrowerReason::NotALockFile),
    };
    let drv = driver::current();
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        let key = match fgos_process::facts::file_key(slot_file) {
            Ok(key) => key,
            Err(_) => return BorrowedCheck::NotBorrower(NotBorrowerReason::FdMissing),
        };
        if key != (meta.dev(), meta.ino()) {
            return BorrowedCheck::NotBorrower(NotBorrowerReason::InodeMismatch);
        }
    }
    #[cfg(not(unix))]
    {
        let _ = meta;
        if !drv.same_file(slot_file, lock_path) {
            return BorrowedCheck::NotBorrower(NotBorrowerReason::InodeMismatch);
        }
    }
    match drv.try_lock(slot_file, Mode::Ex) {
        Ok(TryLock::Locked) => {
            drop(Locked::new(drv, slot_file));
            BorrowedCheck::Borrower
        }
        Ok(TryLock::WouldBlock) => BorrowedCheck::NotBorrower(NotBorrowerReason::LockNotHeldByDescription),
        Err(_) => BorrowedCheck::NotBorrower(NotBorrowerReason::FdMissing),
    }
}

/// Is `resource` held exclusively? A fresh description tries a non-blocking
/// shared lock and closes at once, so a probe never obstructs a holder or
/// another probe. A lock file that does not exist is free.
pub fn probe(resource: &Resource) -> io::Result<Probe> {
    let drv = driver::current();
    if !drv.supported() {
        return Err(io::Error::new(io::ErrorKind::Unsupported, drv.unsupported_detail()));
    }
    let file = match OpenOptions::new().read(true).write(true).open(&resource.path) {
        Ok(file) => file,
        Err(err) if err.kind() == io::ErrorKind::NotFound => return Ok(Probe::Free),
        Err(err) => return Err(err),
    };
    let answer = match drv.try_lock(&file, Mode::Sh)? {
        TryLock::Locked => {
            drop(Locked::new(drv, &file));
            Probe::Free
        }
        TryLock::WouldBlock => Probe::Held,
    };
    drop(file);
    Ok(answer)
}

/// Who holds a lock on `resource`'s file.
pub fn holders(resource: &Resource) -> io::Result<HoldersList> {
    let file = File::open(&resource.path)?;
    Ok(driver::current().holders(&file))
}

/// What the driver guarantees for lock files in `dir`.
pub fn guarantee(dir: &Path) -> Guarantee {
    driver::current().guarantee(dir)
}

#[cfg(all(test, target_os = "linux"))]
mod proof_tests {
    use super::*;

    #[test]
    fn old_or_unreadable_pid_marks_use_the_start_time_fallback_and_kill_holders() {
        for unreadable in [false, true] {
            let path = std::env::temp_dir().join(format!("fgos-proof-fallback-{}-{unreadable}", std::process::id()));
            let handle = match acquire(&Resource::new("proof", &path), Mode::Ex, Wait::Try, 2000) {
                Acquire::Acquired(h) => h,
                other => panic!("{other:?}"),
            };
            let mut mark = fgos_process::facts::creation_mark().unwrap();
            if unreadable { mark.last_pid = None; } else { mark.at -= Duration::from_secs(60); }
            assert!(fgos_process::facts::created_since(&mark).is_none());
            let request = borrowed_request(&handle, &BorrowSpec { argv: vec!["sh".into(), "-c".into(), "sleep 30 &".into()], ..Default::default() }).unwrap();
            let mut child = spawn_mapped(&request, &[(FdSlot(BORROW_SLOT), handle.file())]).unwrap();
            wait_exited_unreaped(child.id()).unwrap();
            let killed = driver::current().end_leftovers(handle.file(), child.id(), Duration::from_secs(2), Some(mark)).unwrap();
            assert!(killed > 0);
            child.wait().unwrap();
            drop(handle);
            std::fs::remove_file(path).unwrap();
        }
    }

    #[test]
    fn proof_boundary_keeps_processes_created_during_the_previous_proof_eligible() {
        let path = std::env::temp_dir().join(format!("fgos-proof-boundary-{}", std::process::id()));
        let handle = match acquire(&Resource::new("proof", &path), Mode::Ex, Wait::Try, 2000) {
            Acquire::Acquired(h) => h,
            other => panic!("{other:?}"),
        };
        let first = fgos_process::facts::creation_mark().unwrap();
        handle.proven_alone_at(Some(first));
        let mut child = std::process::Command::new("sleep").arg("30").spawn().unwrap();
        let second = fgos_process::facts::creation_mark().unwrap();
        // Model an in-flight fork absent from proof two's table snapshot.
        handle.proven_alone_at(Some(second));
        let floor = handle.since().unwrap();
        assert_eq!(floor.at, first.at);
        if let Some(candidates) = fgos_process::facts::created_since(&floor) {
            assert!(candidates.iter().any(|r| r.pid.0 == child.id()));
        } else {
            assert!(fgos_process::facts::relations().unwrap().iter().any(|r| r.pid.0 == child.id() && r.start_ticks >= floor.ticks));
        }
        // Failed or older concurrent proofs never advance or reverse the floor.
        handle.proven_alone_at(None);
        handle.proven_alone_at(Some(first));
        assert_eq!(handle.since().unwrap().at, first.at);
        child.kill().unwrap();
        child.wait().unwrap();
        drop(handle);
        std::fs::remove_file(path).unwrap();
    }
}
