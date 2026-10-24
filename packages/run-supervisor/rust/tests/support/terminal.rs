//! The supervisor's side of a `terminal` attempt and a pane for the gate to run in: a real pty whose
//! slave is the controlling terminal of the session that starts the sandbox, as a herdr pane is.
#![allow(dead_code)]

use std::fs::{self, File, OpenOptions};
use std::io::Write;
use std::os::fd::{FromRawFd, OwnedFd, RawFd};
use std::os::unix::fs::PermissionsExt;
use std::os::unix::net::{UnixListener, UnixStream};
use std::os::unix::process::CommandExt;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::thread::sleep;
use std::time::{Duration, Instant};

use serde_json::{json, Value};

use super::{harness, Attempt, Options};

/// A short directory for the GO socket (`sun_path` holds about 107 bytes), mode 0700.
pub fn socket_dir(name: &str) -> PathBuf {
    let dir = PathBuf::from(format!("/tmp/fgos-gt-{}-{name}", std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    fs::set_permissions(&dir, fs::Permissions::from_mode(0o700)).unwrap();
    dir
}

/// A terminal-mode envelope: the direct one with the terminal-only fields added.
pub fn terminal_attempt(name: &str, options: &Options, settle_ms: u64, mutating: bool) -> (Attempt, PathBuf) {
    let sock = socket_dir(name).join("go.sock");
    let socket_path = sock.to_string_lossy().into_owned();
    let attempt_id = format!("att-{name}");
    let attempt = Attempt::new_with(name, options, |envelope| {
        envelope["mode"] = json!("terminal");
        envelope["mutation"] = json!(if mutating { "mutating" } else { "read-only" });
        envelope["agentProtocol"]["mode"] = json!("terminal");
        envelope["slot"] = json!({"key": attempt_id, "groupKey": "g"});
        envelope["terminal"] = json!({"socketPath": socket_path, "exitCommand": null, "orphanSettleMs": settle_ms});
        envelope["identity"] = json!({"writerId": format!("att-w-{name}"), "parentWriterId": "parent-writer"});
    });
    (attempt, sock)
}

/// A pty and the sandbox start in it.
pub struct Pane {
    /// Everything the sandbox wrote to the pty, read by a thread so the pty never fills up.
    pub screen: std::sync::Arc<std::sync::Mutex<Vec<u8>>>,
    master: File,
    /// The bwrap monitor: the process a pane shell would be waiting on.
    pub child: Child,
}

fn open_pty() -> (File, File) {
    let (mut master, mut slave): (RawFd, RawFd) = (-1, -1);
    // SAFETY: openpty fills the two descriptors; the null pointers ask for default settings.
    let rc = unsafe { libc::openpty(&mut master, &mut slave, std::ptr::null_mut(), std::ptr::null_mut(), std::ptr::null_mut()) };
    assert_eq!(rc, 0, "openpty");
    // SAFETY: both descriptors are fresh and owned here.
    unsafe { (File::from(OwnedFd::from_raw_fd(master)), File::from(OwnedFd::from_raw_fd(slave))) }
}

/// Start the gate the way the pane launcher does: `bwrap --unshare-pid --as-pid-1 --die-with-parent`,
/// stdio on the pty. With `controlling` the sandbox starts as session leader of that tty; without, the
/// gate has no controlling terminal at all.
pub fn start_in_pane(attempt: &Attempt, socket: &Path, controlling: bool, extra_env: &[(&str, &str)]) -> Pane {
    let (master, slave) = open_pty();
    let mut cmd = Command::new("/usr/bin/bwrap");
    cmd.args(["--unshare-pid", "--as-pid-1", "--dev-bind", "/", "/", "--proc", "/proc", "--die-with-parent", "--"])
        .arg(harness())
        .args(["--protocol", "1", "--envelope"])
        .arg(&attempt.envelope)
        .arg("--go-socket")
        .arg(socket)
        .env_clear()
        .env("PATH", "/usr/bin:/bin");
    for (key, value) in extra_env {
        cmd.env(key, value);
    }
    cmd.stdin(Stdio::from(slave.try_clone().unwrap())).stdout(Stdio::from(slave.try_clone().unwrap())).stderr(Stdio::from(slave));
    if controlling {
        // SAFETY: setsid and ioctl are async-signal-safe; fd 0 is the slave by now.
        unsafe {
            cmd.pre_exec(|| {
                if libc::setsid() < 0 {
                    return Err(std::io::Error::last_os_error());
                }
                if libc::ioctl(0, libc::TIOCSCTTY as _, 0) < 0 {
                    return Err(std::io::Error::last_os_error());
                }
                Ok(())
            });
        }
    }
    let child = cmd.spawn().expect("start the gate in a pane");
    let screen = std::sync::Arc::new(std::sync::Mutex::new(Vec::new()));
    let (sink, mut reader) = (screen.clone(), master.try_clone().unwrap());
    std::thread::spawn(move || {
        use std::io::Read;
        let mut chunk = [0u8; 4096];
        while let Ok(n) = reader.read(&mut chunk) {
            if n == 0 {
                break;
            }
            sink.lock().unwrap().extend_from_slice(&chunk[..n]);
        }
    });
    Pane { screen, master, child }
}

impl Pane {
    /// The monitor's exit code once it ends, within `limit`.
    pub fn wait_exit(&mut self, limit: Duration) -> i32 {
        let start = Instant::now();
        loop {
            if let Some(status) = self.child.try_wait().unwrap() {
                use std::os::unix::process::ExitStatusExt;
                return status.code().unwrap_or_else(|| 128 + status.signal().unwrap_or(0));
            }
            assert!(start.elapsed() < limit, "the sandbox did not end in {limit:?}");
            sleep(Duration::from_millis(10));
        }
    }

    pub fn running(&mut self) -> bool {
        self.child.try_wait().unwrap().is_none()
    }

    /// Type at the pane, as the multiplexer does with keys a person or a supervisor sends.
    pub fn type_text(&self, text: &str) {
        (&self.master).write_all(text.as_bytes()).unwrap();
    }

    /// Another descriptor of the pane's tty, as the pane's shell keeps one while the sandbox runs.
    pub fn open_tty(&self) -> File {
        use std::os::fd::AsRawFd;
        use std::os::unix::fs::OpenOptionsExt;
        // SAFETY: ptsname returns a pointer to a NUL-terminated name owned by libc (or null on
        // failure); it is copied immediately, and only this thread asks for a pane name at a time.
        // ptsname is used rather than ptsname_r because macOS does not provide the latter.
        let path = unsafe {
            let name = libc::ptsname(self.master.as_raw_fd());
            assert!(!name.is_null(), "ptsname");
            std::ffi::CStr::from_ptr(name).to_string_lossy().into_owned()
        };
        OpenOptions::new().read(true).write(true).custom_flags(libc::O_NOCTTY).open(path).unwrap()
    }
}

impl Drop for Pane {
    fn drop(&mut self) {
        if std::thread::panicking() {
            eprintln!("pane output: {}", String::from_utf8_lossy(&self.screen.lock().unwrap()));
        }
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}

/// Listen where the gate will connect.
pub fn listen(socket: &Path) -> UnixListener {
    let listener = UnixListener::bind(socket).expect("bind the GO socket");
    fs::set_permissions(socket, fs::Permissions::from_mode(0o600)).unwrap();
    listener
}

/// Accept the gate's connection, bounded in time.
pub fn accept(listener: &UnixListener, limit: Duration) -> UnixStream {
    listener.set_nonblocking(true).unwrap();
    let start = Instant::now();
    loop {
        match listener.accept() {
            Ok((stream, _)) => {
                stream.set_nonblocking(false).unwrap();
                return stream;
            }
            Err(err) if err.kind() == std::io::ErrorKind::WouldBlock && start.elapsed() < limit => sleep(Duration::from_millis(10)),
            Err(err) => panic!("the gate never connected: {err}"),
        }
    }
}

/// Send one frame with descriptors riding on it (`SCM_RIGHTS`).
pub fn send_with_fds(stream: &UnixStream, frame: &Value, fds: &[RawFd]) {
    use std::os::fd::AsRawFd;
    let body = serde_json::to_vec(frame).unwrap();
    let mut wire = (body.len() as u32).to_be_bytes().to_vec();
    wire.extend_from_slice(&body);
    let mut iov = libc::iovec { iov_base: wire.as_mut_ptr().cast(), iov_len: wire.len() };
    let mut control = [0u64; 8];
    // SAFETY: an all-zero msghdr is valid; the fields used are set below.
    let mut msg: libc::msghdr = unsafe { std::mem::zeroed() };
    msg.msg_iov = &mut iov;
    msg.msg_iovlen = 1;
    if !fds.is_empty() {
        let payload = std::mem::size_of_val(fds);
        msg.msg_control = control.as_mut_ptr().cast();
        // SAFETY: CMSG_SPACE is a pure size computation.
        msg.msg_controllen = unsafe { libc::CMSG_SPACE(payload as u32) } as _;
        // SAFETY: the control buffer is large enough for one header and `fds`.
        unsafe {
            let cmsg = libc::CMSG_FIRSTHDR(&msg);
            (*cmsg).cmsg_level = libc::SOL_SOCKET;
            (*cmsg).cmsg_type = libc::SCM_RIGHTS;
            (*cmsg).cmsg_len = libc::CMSG_LEN(payload as u32) as _;
            std::ptr::copy_nonoverlapping(fds.as_ptr(), libc::CMSG_DATA(cmsg).cast(), fds.len());
        }
    }
    // SAFETY: sendmsg over the prepared message.
    let sent = unsafe { libc::sendmsg(stream.as_raw_fd(), &msg, 0) };
    assert_eq!(sent as usize, wire.len(), "sendmsg: {}", std::io::Error::last_os_error());
}

/// A lock file with an exclusive `flock` on its open description, as the attempt lock is.
pub fn locked_file(path: &Path) -> File {
    use std::os::fd::AsRawFd;
    let file = OpenOptions::new().create(true).truncate(true).write(true).open(path).unwrap();
    // SAFETY: flock on an open descriptor.
    assert_eq!(unsafe { libc::flock(file.as_raw_fd(), libc::LOCK_EX | libc::LOCK_NB) }, 0);
    file
}

/// Can a stranger take a shared lock on `path` right now?
pub fn stranger_can_lock(path: &Path) -> bool {
    use std::os::fd::AsRawFd;
    let file = File::open(path).unwrap();
    // SAFETY: flock on an open descriptor.
    unsafe { libc::flock(file.as_raw_fd(), libc::LOCK_SH | libc::LOCK_NB) == 0 }
}

/// Accept the gate, read HELLO and send GO with `fds`; the attempt's own digest unless `digest` says otherwise.
pub fn handshake(listener: &UnixListener, attempt: &Attempt, fds: &[RawFd]) -> UnixStream {
    use fgos_run_supervisor::go_channel::read_frame;
    let mut stream = accept(listener, Duration::from_secs(10));
    let hello = read_frame(&mut stream).expect("HELLO");
    assert_eq!(hello["type"], "HELLO");
    assert_eq!(hello["attemptId"], attempt.attempt_id.as_str());
    let anchor = json!({"pid": 1, "startTime": "x", "pidNs": "pid:[1]"});
    send_with_fds(&stream, &json!({"type": "GO", "attemptId": attempt.attempt_id, "envelopeDigest": attempt.digest, "gateHostTuple": anchor}), fds);
    stream
}

pub fn write_text(path: &Path, text: &str) {
    let mut file = File::create(path).unwrap();
    file.write_all(text.as_bytes()).unwrap();
}
