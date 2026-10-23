//! Record test support: a temporary `.fgos` directory per test, the core
//! calls the record tests share, and the runner for child processes. Every
//! mailbox path comes from `Paths`; this file names none of them.
use fgos_mailbox::record::{Paths, Record, Reported, Wait};
use fgos_mailbox_core::{
    Cli, IdSource, Limits, MailboxState, RegisterRequest, Registered, SendRequest, Timestamp,
    WriterKey,
};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, ExitStatus, Stdio};
use std::time::{Duration, Instant};

/// A temporary directory holding the `.fgos` directory the store is given
/// and a scratch directory beside it, outside the record. Removed on drop.
///
/// One at a time per test binary: a fork (a child process of another test)
/// copies every description open in the process until the child execs, so
/// a hold running beside it would find its own lock still held.
pub struct TempFgos {
    root: PathBuf,
    _one_at_a_time: std::sync::MutexGuard<'static, ()>,
}

impl TempFgos {
    pub fn new(tag: &str) -> Self {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let root =
            std::env::temp_dir().join(format!("fgos-mailbox-{tag}-{}-{nanos}", std::process::id()));
        static ONE_AT_A_TIME: std::sync::Mutex<()> = std::sync::Mutex::new(());
        let guard = ONE_AT_A_TIME
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        let fgos = Self {
            root,
            _one_at_a_time: guard,
        };
        std::fs::create_dir_all(fgos.fgos_dir()).unwrap();
        std::fs::create_dir_all(fgos.scratch()).unwrap();
        fgos
    }

    /// The directory the store receives as its `.fgos` directory.
    pub fn fgos_dir(&self) -> PathBuf {
        self.root.join("fgos")
    }

    /// A directory outside the record, for ready files, plants and outputs.
    pub fn scratch(&self) -> PathBuf {
        self.root.join("scratch")
    }

    pub fn paths(&self) -> Paths {
        Paths::new(self.fgos_dir())
    }

    pub fn record(&self) -> Record {
        Record::open(self.fgos_dir()).unwrap()
    }
}

impl Drop for TempFgos {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.root);
    }
}

/// The installed state, read through a hold that changes nothing.
pub fn read_state(record: &Record) -> MailboxState {
    record
        .hold(Wait::Try, T0, &super::limits(), |state, _| {
            Reported::unchanged(state.clone())
        })
        .unwrap()
        .value
        .value
}

/// A fixed starting time; tests move forward from it.
pub const T0: Timestamp = Timestamp::from_millis(1_800_000_000_000);

pub fn key(text: &str) -> WriterKey {
    WriterKey::new(text).unwrap()
}

/// Registers a new head under `key` with a head text no other test head
/// shares.
pub fn register(
    state: &mut MailboxState,
    writer: &str,
    now: Timestamp,
    limits: &Limits,
    ids: &mut dyn IdSource,
) -> Registered {
    let req = RegisterRequest {
        key: key(writer),
        cli: Cli::new("claude").unwrap(),
        project: "forgent".to_string(),
        own_suffix: None,
        head: format!("head-of-{writer}"),
        handle: None,
    };
    state.register(req, None, now, limits, ids).unwrap()
}

/// A send request from `from` to the typed name `to`.
pub fn send_req<'a>(from: &str, to: &str, body: &'a str) -> SendRequest<'a> {
    SendRequest {
        from: key(from),
        to: fgos_mailbox_core::Recipient::Name(to.to_string()),
        body,
        wake: false,
        reply_to: None,
        dead_keys: Default::default(),
        stop_drains: fgos_mailbox::adapters::TestedClis::embedded().stop_drains(),
    }
}

/// The short name a registration gave.
pub fn name_of(registered: &Registered) -> String {
    match registered {
        Registered::Created { name, .. }
        | Registered::Refreshed { name, .. }
        | Registered::Replaced { name, .. } => name.as_str().to_string(),
    }
}

/// Runs `f` on a thread and fails, instead of hanging, when it has not
/// returned within `limit`.
pub fn within<T: Send + 'static>(limit: Duration, f: impl FnOnce() -> T + Send + 'static) -> T {
    let (tx, rx) = std::sync::mpsc::channel();
    std::thread::spawn(move || {
        let _ = tx.send(f());
    });
    rx.recv_timeout(limit)
        .unwrap_or_else(|_| panic!("did not return within {limit:?}"))
}

/// Creates a FIFO at `path`, without a child process.
pub fn mkfifo(path: &Path) {
    use std::os::unix::ffi::OsStrExt;
    let c_path = std::ffi::CString::new(path.as_os_str().as_bytes()).unwrap();
    // SAFETY: a NUL-terminated path that outlives the call.
    let made = unsafe { libc::mkfifo(c_path.as_ptr(), 0o600) };
    assert_eq!(made, 0, "mkfifo {}", path.display());
}

/// Installs `contents` at `path` by rename, so a reader never sees a part.
pub fn publish(path: &Path, contents: &str) {
    let tmp = path.with_extension("part");
    std::fs::write(&tmp, contents).unwrap();
    std::fs::rename(&tmp, path).unwrap();
}

// Child processes: the test binary re-executed on its own `child_entry`
// test, with a role and its inputs in the environment. Only the test files
// read these variables; the library never does.
pub const ROLE: &str = "MAILBOX_RECORD_TEST_ROLE";
pub const FGOS_DIR: &str = "MAILBOX_RECORD_TEST_FGOS";
pub const SCRATCH: &str = "MAILBOX_RECORD_TEST_SCRATCH";
pub const ARG: &str = "MAILBOX_RECORD_TEST_ARG";

/// The role of this process, when it was started as a child.
pub fn role() -> Option<String> {
    std::env::var(ROLE).ok()
}

/// The `.fgos` directory a child was given.
pub fn child_fgos_dir() -> PathBuf {
    PathBuf::from(std::env::var(FGOS_DIR).unwrap())
}

/// The scratch directory a child was given.
pub fn child_scratch() -> PathBuf {
    PathBuf::from(std::env::var(SCRATCH).unwrap())
}

/// The child's one free argument.
pub fn child_arg() -> String {
    std::env::var(ARG).unwrap_or_default()
}

/// Starts this test binary as a child running `role`. Its stdin is a pipe
/// the parent keeps: a child blocked on [`child_await_byte`] goes on only
/// when the parent calls [`release`].
pub fn spawn(role: &str, fgos: &TempFgos, arg: &str) -> Child {
    Command::new(std::env::current_exe().unwrap())
        .args([
            "--exact",
            "child_entry",
            "--nocapture",
            "--test-threads",
            "1",
        ])
        .env(ROLE, role)
        .env(FGOS_DIR, fgos.fgos_dir())
        .env(SCRATCH, fgos.scratch())
        .env(ARG, arg)
        .stdin(Stdio::piped())
        .stdout(Stdio::null())
        .stderr(Stdio::inherit())
        .spawn()
        .unwrap()
}

const DEADLINE: Duration = Duration::from_secs(30);

/// Waits until `path` exists; fails when the child exits first or the
/// deadline passes.
pub fn wait_for(child: &mut Child, path: &Path) {
    let deadline = Instant::now() + DEADLINE;
    while !path.exists() {
        if let Some(status) = child.try_wait().unwrap() {
            panic!("child exited before {}: {status}", path.display());
        }
        assert!(Instant::now() < deadline, "never saw {}", path.display());
        std::thread::sleep(Duration::from_millis(2));
    }
}

/// Waits for the child to exit within the deadline.
pub fn wait_exit(child: &mut Child) -> ExitStatus {
    let deadline = Instant::now() + DEADLINE;
    loop {
        if let Some(status) = child.try_wait().unwrap() {
            return status;
        }
        if Instant::now() >= deadline {
            let _ = child.kill();
            panic!("child did not exit within {DEADLINE:?}");
        }
        std::thread::sleep(Duration::from_millis(2));
    }
}

/// Lets a child blocked on [`child_await_byte`] go on.
pub fn release(child: &mut Child) {
    use std::io::Write;
    child.stdin.as_mut().unwrap().write_all(b"g").unwrap();
}

/// In a child: blocks until the parent calls [`release`].
pub fn child_await_byte() {
    use std::io::Read;
    let mut byte = [0u8; 1];
    std::io::stdin().read_exact(&mut byte).unwrap();
}

/// In a child: waits until `path` exists (a start barrier the parent
/// installs), within the deadline.
pub fn child_await_file(path: &Path) {
    let deadline = Instant::now() + DEADLINE;
    while !path.exists() {
        assert!(Instant::now() < deadline, "never saw {}", path.display());
        std::thread::sleep(Duration::from_millis(1));
    }
}

/// Parks the calling thread until the process is killed.
pub fn park_forever() -> ! {
    loop {
        std::thread::park();
    }
}

/// The process record of a real process that has exited: started, read,
/// killed and reaped. Never a fabricated pid.
pub fn dead_head_record() -> fgos_process::facts::Record {
    let mut child = Command::new("sleep")
        .arg("600")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .spawn()
        .unwrap();
    let record = fgos_process::facts::identity_of(fgos_process::ProcId(child.id()))
        .unwrap()
        .to_record();
    child.kill().unwrap();
    child.wait().unwrap();
    record
}

/// This process's own record, a live head.
pub fn own_head_record() -> fgos_process::facts::Record {
    fgos_process::facts::self_identity().unwrap().to_record()
}

/// A registration of `writer` whose head is `head`.
pub fn register_request(writer: &str, head: &fgos_process::facts::Record) -> RegisterRequest {
    RegisterRequest {
        key: key(writer),
        cli: Cli::new("claude").unwrap(),
        project: "forgent".to_string(),
        own_suffix: None,
        head: fgos_mailbox::head::head_text(head),
        handle: None,
    }
}
