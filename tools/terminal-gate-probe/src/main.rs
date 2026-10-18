//! Probe for the terminal-mode gate measurements. Linux only; not production code.
//!
//! Subcommands (all log to the file named by their first argument):
//!   gate <log> <variant>      pid 1 role: spawn a reader in its own group, hand it the tty
//!   reader <log>              append every stdin line to <log>
//!   scm-server <sock> <lock>  supervisor role: pass a flock'd fd to the first client
//!   scm-client <sock> <log>   gate role: receive the fd, report peer credentials
//!   watch <dir> <log> <secs>  log every name/inode/size change under <dir> (poll, 0.5 ms)
use std::ffi::CString;
use std::fs::{File, OpenOptions};
use std::io::{BufRead, Write};
use std::os::unix::io::{AsRawFd, FromRawFd, RawFd};
use std::os::unix::net::{UnixListener, UnixStream};
use std::os::unix::process::CommandExt;
use std::process::Command;
use std::time::{Duration, Instant};

fn log(path: &str, msg: &str) {
    if let Ok(mut f) = OpenOptions::new().create(true).append(true).open(path) {
        let _ = writeln!(f, "{msg}");
    }
}

fn tty_report(who: &str) -> String {
    unsafe {
        let name = libc::ttyname(0);
        let name = if name.is_null() {
            "none".to_string()
        } else {
            std::ffi::CStr::from_ptr(name).to_string_lossy().into_owned()
        };
        format!(
            "{who}: pid={} ppid={} pgid={} sid={} tty0={} tcgetpgrp(0)={}",
            libc::getpid(),
            libc::getppid(),
            libc::getpgrp(),
            libc::getsid(0),
            name,
            libc::tcgetpgrp(0)
        )
    }
}

fn gate(log_path: &str, variant: &str) {
    log(log_path, &tty_report("gate-start"));
    if variant == "setsid-ctty" {
        // Make a session of our own, then try to claim the pane tty as its controlling tty.
        let sid = unsafe { libc::setsid() };
        log(log_path, &format!("setsid -> {sid} err={}", std::io::Error::last_os_error()));
        let r = unsafe { libc::ioctl(0, libc::TIOCSCTTY, 0) };
        log(log_path, &format!("TIOCSCTTY(0) -> {r} err={}", std::io::Error::last_os_error()));
        let tty = CString::new("/dev/tty").unwrap();
        let fd = unsafe { libc::open(tty.as_ptr(), libc::O_RDWR) };
        log(log_path, &format!("open(/dev/tty) -> {fd} err={}", std::io::Error::last_os_error()));
    }
    let exe = std::env::current_exe().unwrap();
    let mut cmd = Command::new(exe);
    cmd.arg("reader").arg(log_path);
    unsafe {
        cmd.pre_exec(|| {
            if libc::setpgid(0, 0) != 0 {
                return Err(std::io::Error::last_os_error());
            }
            Ok(())
        });
    }
    let mut child = cmd.spawn().expect("spawn reader");
    let pgid = child.id() as i32;
    unsafe {
        libc::signal(libc::SIGTTOU, libc::SIG_IGN);
        let r = libc::tcsetpgrp(0, pgid);
        log(
            log_path,
            &format!("tcsetpgrp(0,{pgid}) -> {r} err={}", std::io::Error::last_os_error()),
        );
    }
    log(log_path, &tty_report("gate-after"));
    let _ = child.wait();
    log(log_path, "gate: reader exited");
}

fn reader(log_path: &str) {
    log(log_path, &tty_report("reader-start"));
    let stdin = std::io::stdin();
    for line in stdin.lock().lines() {
        match line {
            Ok(l) => log(log_path, &format!("reader-got: {l}")),
            Err(e) => {
                log(log_path, &format!("reader-err: {e}"));
                break;
            }
        }
    }
}

fn send_fd(sock: &UnixStream, fd: RawFd) -> std::io::Result<()> {
    unsafe {
        let mut byte = 0u8;
        let mut iov = libc::iovec { iov_base: &mut byte as *mut u8 as *mut _, iov_len: 1 };
        let space = libc::CMSG_SPACE(4) as usize;
        let mut buf = vec![0u8; space];
        let mut msg: libc::msghdr = std::mem::zeroed();
        msg.msg_iov = &mut iov;
        msg.msg_iovlen = 1;
        msg.msg_control = buf.as_mut_ptr() as *mut _;
        msg.msg_controllen = space as _;
        let c = libc::CMSG_FIRSTHDR(&msg);
        (*c).cmsg_level = libc::SOL_SOCKET;
        (*c).cmsg_type = libc::SCM_RIGHTS;
        (*c).cmsg_len = libc::CMSG_LEN(4) as _;
        *(libc::CMSG_DATA(c) as *mut RawFd) = fd;
        if libc::sendmsg(sock.as_raw_fd(), &msg, 0) < 0 {
            return Err(std::io::Error::last_os_error());
        }
    }
    Ok(())
}

fn recv_fd(sock: &UnixStream) -> std::io::Result<RawFd> {
    unsafe {
        let mut byte = 0u8;
        let mut iov = libc::iovec { iov_base: &mut byte as *mut u8 as *mut _, iov_len: 1 };
        let space = libc::CMSG_SPACE(4) as usize;
        let mut buf = vec![0u8; space];
        let mut msg: libc::msghdr = std::mem::zeroed();
        msg.msg_iov = &mut iov;
        msg.msg_iovlen = 1;
        msg.msg_control = buf.as_mut_ptr() as *mut _;
        msg.msg_controllen = space as _;
        if libc::recvmsg(sock.as_raw_fd(), &mut msg, libc::MSG_CMSG_CLOEXEC) < 0 {
            return Err(std::io::Error::last_os_error());
        }
        let c = libc::CMSG_FIRSTHDR(&msg);
        if c.is_null() || (*c).cmsg_type != libc::SCM_RIGHTS {
            return Err(std::io::Error::new(std::io::ErrorKind::Other, "no SCM_RIGHTS"));
        }
        Ok(*(libc::CMSG_DATA(c) as *const RawFd))
    }
}

fn peercred(sock: &UnixStream) -> String {
    unsafe {
        let mut cred: libc::ucred = std::mem::zeroed();
        let mut len = std::mem::size_of::<libc::ucred>() as libc::socklen_t;
        let r = libc::getsockopt(
            sock.as_raw_fd(),
            libc::SOL_SOCKET,
            libc::SO_PEERCRED,
            &mut cred as *mut _ as *mut _,
            &mut len,
        );
        format!(
            "getsockopt={r} pid={} uid={} gid={} (own uid={})",
            cred.pid,
            cred.uid,
            cred.gid,
            libc::getuid()
        )
    }
}

fn scm_server(sock_path: &str, lock_path: &str) {
    let _ = std::fs::remove_file(sock_path);
    let listener = UnixListener::bind(sock_path).expect("bind");
    let lock = File::create(lock_path).expect("lock file");
    let r = unsafe { libc::flock(lock.as_raw_fd(), libc::LOCK_EX | libc::LOCK_NB) };
    println!("server pid={} flock={r}", std::process::id());
    let (stream, _) = listener.accept().expect("accept");
    println!("server sees client: {}", peercred(&stream));
    send_fd(&stream, lock.as_raw_fd()).expect("send_fd");
    // Only the passed duplicate keeps the lock alive from here on.
    drop(lock);
    println!("server sent fd; sleeping (kill me with -9)");
    std::thread::sleep(Duration::from_secs(3600));
}

fn scm_client(sock_path: &str, log_path: &str) {
    let stream = UnixStream::connect(sock_path).expect("connect");
    log(log_path, &format!("client peer as seen in sandbox: {}", peercred(&stream)));
    let fd = recv_fd(&stream).expect("recv_fd");
    let flags = unsafe { libc::fcntl(fd, libc::F_GETFD) };
    log(log_path, &format!("received fd={fd} cloexec={}", flags & libc::FD_CLOEXEC != 0));
    log(log_path, "client holding fd");
    let start = Instant::now();
    while start.elapsed() < Duration::from_secs(60) {
        std::thread::sleep(Duration::from_millis(200));
        if std::path::Path::new(&format!("{log_path}.stop")).exists() {
            break;
        }
    }
    drop(unsafe { File::from_raw_fd(fd) });
    log(log_path, "client exiting");
}

/// Polls the directory every 0.5 ms and logs each change of (name, inode, size). inotify is not
/// usable here: the machine-wide watch limit is exhausted, so a poll is the only way to see the
/// order of create / write / rename without root.
fn watch(dir: &str, log_path: &str, secs: u64) {
    use std::collections::BTreeMap;
    use std::os::unix::fs::MetadataExt;
    let start = Instant::now();
    log(log_path, &format!("polling {dir}"));
    let mut seen: BTreeMap<String, (u64, u64)> = BTreeMap::new();
    while start.elapsed() < Duration::from_secs(secs) {
        let mut now: BTreeMap<String, (u64, u64)> = BTreeMap::new();
        if let Ok(rd) = std::fs::read_dir(dir) {
            for e in rd.flatten() {
                if let Ok(m) = e.metadata() {
                    now.insert(e.file_name().to_string_lossy().into_owned(), (m.ino(), m.len()));
                }
            }
        }
        let t = start.elapsed().as_micros();
        for (name, v) in &now {
            if seen.get(name) != Some(v) {
                log(log_path, &format!("{t:>9}us {name} ino={} size={}", v.0, v.1));
            }
        }
        for name in seen.keys() {
            if !now.contains_key(name) {
                log(log_path, &format!("{t:>9}us {name} GONE"));
            }
        }
        seen = now;
        std::thread::sleep(Duration::from_micros(500));
    }
}

fn main() {
    let a: Vec<String> = std::env::args().collect();
    match a.get(1).map(String::as_str) {
        Some("gate") => gate(&a[2], &a[3]),
        Some("reader") => reader(&a[2]),
        Some("scm-server") => scm_server(&a[2], &a[3]),
        Some("scm-client") => scm_client(&a[2], &a[3]),
        Some("watch") => watch(&a[2], &a[3], a[4].parse().unwrap_or(60)),
        _ => eprintln!("usage: gate|reader|scm-server|scm-client"),
    }
}
