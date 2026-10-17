//! The OS-neutral lock port (`packages/holder-lock/contracts/holder-lock.port.v1.json`).
//!
//! Every operation is written once here on top of the per-OS [`LockDriver`];
//! the predecessor-domain rule (`predecessor`) and the release rule of
//! [`run_borrowed`] live in this core, never in a driver.
//!
//! A [`Handle`] owns the open file description that carries the lock.
//! Releasing it closes the description. On POSIX nothing here ever calls
//! `LOCK_UN`: a borrowed copy of the description may share the lock. On
//! Windows no other process can share a lock, so every successful lock is
//! undone explicitly through [`LockDriver::before_close`] (see [`Locked`]).

use std::collections::BTreeMap;
use std::fs::{File, OpenOptions};
use std::io;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

use fgos_process::facts::ProcTuple;
use fgos_process::{Domain, FdSlot};
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
#[derive(Debug)]
pub struct Handle {
    file: File,
    resource: Resource,
    mode: Mode,
    kill_wait_ms: u64,
}

impl Drop for Handle {
    fn drop(&mut self) {
        driver::current().before_close(&self.file);
    }
}

impl Handle {
    /// Registry name of the lock.
    pub fn name(&self) -> &str {
        &self.resource.name
    }

    /// Lock file path.
    pub fn path(&self) -> &Path {
        &self.resource.path
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
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum BorrowStdio {
    /// Inherit the caller's stdio.
    #[default]
    Inherit,
    /// `/dev/null` for all three.
    Null,
}

/// The command [`run_borrowed`] runs with the holder's authority.
#[derive(Debug, Clone, Default)]
pub struct BorrowSpec {
    /// Program and arguments.
    pub argv: Vec<String>,
    /// Working directory; `None` keeps the caller's.
    pub cwd: Option<PathBuf>,
    /// Variables set on top of the caller's environment.
    pub env: BTreeMap<String, String>,
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

/// Why [`run_borrowed`] failed.
#[derive(Debug)]
pub enum BorrowError {
    /// The handle is shared, or the spec has no program.
    InvalidSpec(String),
    /// The child could not be started.
    Spawn(io::Error),
    /// Waiting for the child failed.
    Wait(io::Error),
    /// The platform cannot borrow.
    Unsupported,
    /// Processes still held the description after the kill wait
    /// (`borrow-leftover-not-killed`). The caller still releases its handle.
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

/// Apply the predecessor-domain rule to a description that just took the
/// kernel lock on the file at `lock_path`. `Ok(None)`: proceed. `Ok(Some)`:
/// the domain could not be emptied; the caller must close the description.
pub fn admit_after_lock(lock_path: &Path, kill_wait_ms: u64) -> Option<Value> {
    match predecessor::admit(&predecessor::record_path(lock_path), Duration::from_millis(kill_wait_ms)) {
        Admit::Proceed => None,
        Admit::NotEmpty { domain } => Some(domain),
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
        if let Some(domain) = admit_after_lock(&resource.path, kill_wait_ms) {
            drop(locked);
            drop(file);
            return Acquire::Held { reason: HeldReason::PredecessorDomainNotEmpty, domain: Some(domain) };
        }
        locked.keep();
        return Acquire::Acquired(Handle { file, resource: resource.clone(), mode, kill_wait_ms });
    }
}

/// Release a held lock: close the description (see the module note on
/// unlock).
pub fn release(handle: Handle) {
    drop(handle);
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

/// Run one child command with the holder's authority: the description goes
/// to the child at slot 3 with `FGOS_LOCK_FD=<name>:3`. After the child
/// exits, whatever else still holds the description (Linux: every other
/// process listed as a holder; macOS: the child's process group) is killed
/// and waited for, up to the handle's kill wait, before this returns.
pub fn run_borrowed(handle: &Handle, spec: &BorrowSpec) -> Result<BorrowOutcome, BorrowError> {
    let drv = driver::current();
    if !drv.supported() {
        return Err(BorrowError::Unsupported);
    }
    if handle.mode != Mode::Ex {
        return Err(BorrowError::InvalidSpec("only an exclusive lock can be borrowed".into()));
    }
    let argv = borrowed_argv(&spec.argv);
    let Some((program, args)) = argv.split_first() else {
        return Err(BorrowError::InvalidSpec("argv is empty".into()));
    };
    let mut cmd = Command::new(program);
    cmd.args(args);
    if let Some(cwd) = &spec.cwd {
        cmd.current_dir(cwd);
    }
    cmd.envs(&spec.env);
    cmd.env(LOCK_FD_ENV, format!("{}:{BORROW_SLOT}", handle.resource.name));
    if spec.stdio == BorrowStdio::Null {
        cmd.stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null());
    }
    drv.prepare_borrow(&mut cmd);
    let mut child = fgos_process::control::spawn_with_fds(cmd, &[(FdSlot(BORROW_SLOT), &handle.file)]).map_err(BorrowError::Spawn)?;
    let child_pid = child.id();
    // The child stays unreaped (a zombie) while its leftovers are ended, so
    // its pid, and on macOS its process group id, cannot be reused by an
    // unrelated process in the meantime.
    wait_exited_unreaped(child_pid).map_err(BorrowError::Wait)?;
    let leftovers = drv.end_leftovers(&handle.file, child_pid, Duration::from_millis(handle.kill_wait_ms));
    let status = child.wait().map_err(BorrowError::Wait)?;
    let (exit, signal) = exit_parts(&status);
    let mut outcome = BorrowOutcome { exit, signal, leftovers_killed: 0 };
    match leftovers {
        Ok(killed) => {
            outcome.leftovers_killed = killed;
            Ok(outcome)
        }
        Err(left) => {
            outcome.leftovers_killed = left.killed;
            Err(BorrowError::LeftoverNotKilled { outcome, pids: left.pids })
        }
    }
}

/// Block until `pid` (a child of this process) has exited, without reaping it.
fn wait_exited_unreaped(pid: u32) -> io::Result<()> {
    #[cfg(unix)]
    loop {
        // SAFETY: waitid fills a zeroed siginfo for our own child; WNOWAIT
        // leaves it waitable for the reap that follows.
        let mut info: libc::siginfo_t = unsafe { std::mem::zeroed() };
        if unsafe { libc::waitid(libc::P_PID, pid as libc::id_t, &mut info, libc::WEXITED | libc::WNOWAIT) } == 0 {
            return Ok(());
        }
        let err = io::Error::last_os_error();
        if err.raw_os_error() != Some(libc::EINTR) {
            return Err(err);
        }
    }
    #[cfg(not(unix))]
    {
        let _ = pid;
        Ok(())
    }
}

fn exit_parts(status: &std::process::ExitStatus) -> (Option<i32>, Option<i32>) {
    #[cfg(unix)]
    {
        use std::os::unix::process::ExitStatusExt;
        (status.code(), status.signal())
    }
    #[cfg(not(unix))]
    {
        (status.code(), None)
    }
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
}

impl NotBorrowerReason {
    /// Contract name.
    pub fn as_str(self) -> &'static str {
        match self {
            NotBorrowerReason::FdMissing => "fd-missing",
            NotBorrowerReason::InodeMismatch => "inode-mismatch",
            NotBorrowerReason::LockNotHeldByDescription => "lock-not-held-by-description",
            NotBorrowerReason::NotALockFile => "not-a-lock-file",
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
