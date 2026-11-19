//! Bring a worker's own herdr session up.
//!
//! `HERDR_SOCKET_PATH` is injected by herdr into every pane it creates and cannot be cleared or redirected
//! through `--env`, so a worker cannot be denied a cockpit socket; it can only be given a different one, by
//! living in a different session. A private HOME still closes the second route (the default socket under
//! `$HOME`); neither measure closes the hole alone, which is why the config door refuses `bypass` unless both
//! are declared.
//!
//! Bringing a session up is the one herdr thing this module still does itself: starting a server process is not
//! a terminal operation. Everything that talks to a running server goes through terminal-control, behind
//! [`TerminalProbe`]; everything else that touches the machine (the boot lock, a socket, a spawned server, the
//! clock) is behind [`BootEffects`], so the whole lifecycle is proven without a herdr install.

use std::path::{Path, PathBuf};
use std::time::Duration;

use super::worker_session::{
    assert_not_operator_session, isolated_session_env, Env, WorkerSessionError,
};

/// The session every confined worker shares unless an executor names another.
pub const DEFAULT_WORKER_SESSION: &str = "fgos-worker";

/// What a session's terminal-control route says about its server.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct Capabilities {
    /// A server answered and named its incarnation: the only proof a server is up.
    pub server_answers: bool,
    /// The socket file the route names for the session.
    pub socket_path: Option<String>,
}

/// The cheapest question terminal-control answers. A failure of the route is `Err`: it proves nothing about
/// the server (a missing host binary, a timeout, a version mismatch).
pub trait TerminalProbe {
    fn capabilities(&self) -> Result<Capabilities, String>;
}

/// What a socket file looks like, to tell a replaced file from the same one.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SocketStamp(pub String);

/// How one connect to the socket ended.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Connect {
    /// A server accepted.
    Accepted,
    /// Nothing listens (`ECONNREFUSED`).
    Refused,
    /// Anything else, named.
    Other(String),
}

/// Everything the boot touches outside the terminal route.
pub trait BootEffects {
    fn socket_exists(&self, path: &Path) -> bool;
    fn socket_stamp(&self, path: &Path) -> Result<SocketStamp, String>;
    fn connect(&self, path: &Path) -> Connect;
    fn remove_socket(&self, path: &Path);
    /// Start `<bin> --session <name> server` detached: the session has to outlive this dispatch.
    fn spawn_server(&self, herdr_bin: &str, session: &str);
    fn sleep(&self, ms: u64);
    fn now_ms(&self) -> u64;
    /// Run `boot` holding the machine-wide `worker-session` lock of `session`, waiting up to `wait_ms` for it.
    /// `None` when the lock was not obtained in time.
    fn with_boot_lock(&self, session: &str, wait_ms: u64, boot: &mut dyn FnMut()) -> bool;
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BootOptions {
    pub herdr_bin: String,
    pub timeout_ms: u64,
    pub poll_ms: u64,
}

impl BootOptions {
    pub fn new(herdr_bin: impl Into<String>) -> Self {
        Self {
            herdr_bin: herdr_bin.into(),
            timeout_ms: 30_000,
            poll_ms: 500,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WorkerSession {
    pub session_name: String,
    pub socket_path: String,
    pub env: Env,
    pub started_server: bool,
}

fn server_answers(terminal: &dyn TerminalProbe) -> bool {
    terminal
        .capabilities()
        .is_ok_and(|answer| answer.server_answers)
}

/// The socket file of the session `terminal` addresses, as the terminal-control route names it. A route that
/// does not answer proves nothing about the server, so nothing is started on its word.
fn session_socket(
    terminal: &dyn TerminalProbe,
    session: &str,
) -> Result<String, WorkerSessionError> {
    let cause = match terminal.capabilities() {
        Ok(Capabilities {
            socket_path: Some(path),
            ..
        }) if !path.is_empty() => return Ok(path),
        Ok(_) => "it named no socket".to_string(),
        Err(error) => error,
    };
    Err(WorkerSessionError::new(
        "worker-session-server-unknown",
        format!("worker-session-server-unknown: worker session \"{session}\": the terminal-control route did not name its socket ({cause}); nothing was started."),
    ))
}

enum Judged {
    Alive,
    Dead,
    Unknown(String),
}

/// Judge the server behind an existing socket file. Only the OS can say dead: the socket refuses a connect on
/// two looks, a poll apart, with the same file (inode and mtime) both times. A socket file exists between
/// `bind()` and `listen()`, so one refusal can be a server still starting.
fn judge_server(
    terminal: &dyn TerminalProbe,
    socket: &Path,
    fx: &dyn BootEffects,
    poll_ms: u64,
) -> Judged {
    let mut before: Option<SocketStamp> = None;
    for look in 0..2 {
        if server_answers(terminal) {
            return Judged::Alive;
        }
        let stamp = match fx.socket_stamp(socket) {
            Ok(stamp) => stamp,
            Err(cause) => return Judged::Unknown(cause),
        };
        match fx.connect(socket) {
            Connect::Accepted => {
                return Judged::Unknown("a connect succeeded but the server did not answer".into())
            }
            Connect::Other(cause) => return Judged::Unknown(cause),
            Connect::Refused => {}
        }
        if look == 0 {
            before = Some(stamp);
            fx.sleep(poll_ms);
        } else if before.as_ref() != Some(&stamp) {
            return Judged::Unknown("the socket file changed between two looks".into());
        }
    }
    Judged::Dead
}

/// Ensure `session_name` is running, and return the environment that addresses it.
///
/// Refuses outright to touch the operator's own session: that assertion runs before anything is started, so a
/// mistake in configuration cannot reach the point of spawning a server against the cockpit. Boots of one
/// session in this or another process serialise on the session's lock, and the socket is looked at again once
/// the lock is held, so a second caller finds the first one's server and starts nothing.
pub fn ensure_worker_session(
    session_name: &str,
    caller_env: &Env,
    terminal_for: &dyn Fn(&Env) -> Box<dyn TerminalProbe>,
    fx: &dyn BootEffects,
    options: &BootOptions,
) -> Result<WorkerSession, WorkerSessionError> {
    assert_not_operator_session(session_name, caller_env)?;
    let env = isolated_session_env(caller_env, session_name)?;
    let terminal = terminal_for(&env);
    let socket_path = session_socket(terminal.as_ref(), session_name)?;
    let wait_ms = 2 * options.timeout_ms;

    let mut outcome: Option<Result<bool, WorkerSessionError>> = None;
    let locked = fx.with_boot_lock(session_name, wait_ms, &mut || {
        outcome = Some(start_session_server(
            session_name,
            Path::new(&socket_path),
            terminal.as_ref(),
            fx,
            options,
        ));
    });
    if !locked {
        return Err(WorkerSessionError::new(
            "session-unavailable",
            format!("worker session \"{session_name}\" is being started by another process that did not finish within {wait_ms}ms."),
        ));
    }
    let started_server = outcome.unwrap_or(Ok(false))?;
    Ok(WorkerSession {
        session_name: session_name.to_string(),
        socket_path,
        env,
        started_server,
    })
}

/// Look at the session's socket under its lock and start the server when none answers; true when one was
/// started.
///
/// A server that died without unlinking leaves its socket file behind. Read as "already up", that file wedges
/// every confined dispatch from then on: nothing listens, the first pane call fails, and each round refuses
/// with `confinement-unavailable` until a person deletes the file by hand. The file is evidence a server once
/// ran, never that one is running, so a socket the OS refuses twice is removed and started again. A server
/// whose state is unknown (the route failed, or a connect worked) keeps its socket.
fn start_session_server(
    session: &str,
    socket: &Path,
    terminal: &dyn TerminalProbe,
    fx: &dyn BootEffects,
    options: &BootOptions,
) -> Result<bool, WorkerSessionError> {
    let mut present = fx.socket_exists(socket);
    if present {
        match judge_server(terminal, socket, fx, options.poll_ms) {
            Judged::Unknown(cause) => {
                return Err(WorkerSessionError::new(
                    "worker-session-server-unknown",
                    format!("worker-session-server-unknown: worker session \"{session}\" has a socket at {} but its server's state could not be judged ({cause}); the socket was kept.", socket.display()),
                ));
            }
            Judged::Dead => {
                fx.remove_socket(socket);
                present = fx.socket_exists(socket);
            }
            Judged::Alive => {}
        }
    }
    if present {
        return Ok(false);
    }
    fx.spawn_server(&options.herdr_bin, session);
    let deadline = fx.now_ms().saturating_add(options.timeout_ms);
    let unavailable = |what: &str| {
        WorkerSessionError::new(
            "session-unavailable",
            format!(
                "worker session \"{session}\" {what} within {}ms ({}).",
                options.timeout_ms,
                socket.display()
            ),
        )
    };
    while !fx.socket_exists(socket) {
        if fx.now_ms() >= deadline {
            return Err(WorkerSessionError::new(
                "session-unavailable",
                format!(
                    "worker session \"{session}\" did not come up within {}ms (no socket at {}).",
                    options.timeout_ms,
                    socket.display()
                ),
            ));
        }
        fx.sleep(options.poll_ms);
    }
    // The socket file appears before the server answers on it.
    while !server_answers(terminal) {
        if fx.now_ms() >= deadline {
            return Err(unavailable("wrote its socket but did not answer"));
        }
        fx.sleep(options.poll_ms);
    }
    Ok(true)
}

/// The effects of this machine: the holder-lock `worker-session` mutex, a Unix socket, a detached child.
#[derive(Debug, Default, Clone, Copy)]
pub struct SystemEffects;

impl SystemEffects {
    fn lock_path(session: &str) -> PathBuf {
        fgos_holder_lock::state_root::lock_root()
            .join("worker-session")
            .join(format!("{session}.lock"))
    }
}

impl BootEffects for SystemEffects {
    fn socket_exists(&self, path: &Path) -> bool {
        path.exists()
    }

    fn socket_stamp(&self, path: &Path) -> Result<SocketStamp, String> {
        let meta = std::fs::metadata(path).map_err(|e| {
            e.raw_os_error()
                .map_or(e.to_string(), |c| format!("os error {c}"))
        })?;
        let modified = meta
            .modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .unwrap_or_default();
        #[cfg(unix)]
        let inode = std::os::unix::fs::MetadataExt::ino(&meta);
        #[cfg(not(unix))]
        let inode = 0u64;
        Ok(SocketStamp(format!("{inode}:{}", modified.as_nanos())))
    }

    #[cfg(unix)]
    fn connect(&self, path: &Path) -> Connect {
        match std::os::unix::net::UnixStream::connect(path) {
            Ok(_) => Connect::Accepted,
            Err(e) if e.kind() == std::io::ErrorKind::ConnectionRefused => Connect::Refused,
            Err(e) => Connect::Other(e.to_string()),
        }
    }

    #[cfg(not(unix))]
    fn connect(&self, _path: &Path) -> Connect {
        Connect::Other("terminal-mode-unsupported".into())
    }

    fn remove_socket(&self, path: &Path) {
        // A socket we cannot remove is reported by the wait that follows.
        let _ = std::fs::remove_file(path);
    }

    fn spawn_server(&self, herdr_bin: &str, session: &str) {
        let mut command = std::process::Command::new(herdr_bin);
        command
            .args(["--session", session, "server"])
            .stdin(std::process::Stdio::null())
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null());
        #[cfg(unix)]
        std::os::unix::process::CommandExt::process_group(&mut command, 0);
        // Detached on purpose: dropping the child neither waits for it nor kills it.
        let _ = command.spawn();
    }

    fn sleep(&self, ms: u64) {
        std::thread::sleep(Duration::from_millis(ms));
    }

    fn now_ms(&self) -> u64 {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_or(0, |d| d.as_millis() as u64)
    }

    fn with_boot_lock(&self, session: &str, wait_ms: u64, boot: &mut dyn FnMut()) -> bool {
        use fgos_holder_lock::port::{acquire, release, Acquire, Mode, Wait};
        let path = Self::lock_path(session);
        if let Some(dir) = path.parent() {
            let _ = std::fs::create_dir_all(dir);
        }
        match acquire(
            &fgos_holder_lock::port::Resource::new("worker-session", path),
            Mode::Ex,
            Wait::Ms(wait_ms),
            2_000,
        ) {
            Acquire::Acquired(handle) => {
                boot();
                let _ = release(handle);
                true
            }
            _ => false,
        }
    }
}
