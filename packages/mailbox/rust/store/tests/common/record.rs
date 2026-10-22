//! Record test support: a temporary `.fgos` directory per test, the core
//! calls the record tests share, and the runner for child processes. Every
//! mailbox path comes from `Paths`; this file names none of them.
use fgos_mailbox::record::{Paths, Record, Wait};
use fgos_mailbox_core::{
    Cli, IdSource, Limits, MailboxState, RegisterRequest, Registered, SendRequest, Timestamp,
    WriterKey,
};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, ExitStatus, Stdio};
use std::time::{Duration, Instant};

/// A temporary directory holding the `.fgos` directory the store is given
/// and a scratch directory beside it, outside the record. Removed on drop.
pub struct TempFgos {
    root: PathBuf,
}

impl TempFgos {
    pub fn new(tag: &str) -> Self {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let root =
            std::env::temp_dir().join(format!("fgos-mailbox-{tag}-{}-{nanos}", std::process::id()));
        let fgos = Self { root };
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
        .hold(Wait::Try, |state, _| state.clone())
        .unwrap()
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
        to: to.to_string(),
        body,
        wake: false,
        reply_to: None,
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

/// Creates a FIFO at `path`.
pub fn mkfifo(path: &Path) {
    let status = Command::new("mkfifo").arg(path).status().unwrap();
    assert!(status.success(), "mkfifo {}", path.display());
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

/// Starts this test binary as a child running `role`.
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
        .stdin(Stdio::null())
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

/// One spawning test at a time per binary: a fork copies every open
/// description of the process until the child execs, which would keep
/// another test's mailbox lock alive in the child.
pub fn serial() -> std::sync::MutexGuard<'static, ()> {
    static SERIAL: std::sync::Mutex<()> = std::sync::Mutex::new(());
    SERIAL
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
}
