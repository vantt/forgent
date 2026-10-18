//! Real-process acceptance of the synchronous bounded-I/O borrow family.
#![cfg(unix)]
mod common;

use common::*;
use fgos_holder_lock::*;
use std::fs;
use std::process::Command;
use std::time::{Duration, Instant};

fn held(res: &Resource) -> Handle {
    match acquire(res, Mode::Ex, Wait::Try, 2000) {
        Acquire::Acquired(h) => h,
        other => panic!("{other:?}"),
    }
}
fn bounds(input: Vec<u8>) -> BorrowIo {
    BorrowIo {
        stdin: input,
        stdout_limit: 1024 * 1024,
        stderr_limit: 1024,
        deadline: Instant::now() + Duration::from_secs(10),
    }
}
fn shell(script: &str, dir: &std::path::Path) -> BorrowSpec {
    BorrowSpec {
        argv: vec!["sh".into(), "-c".into(), script.into()],
        cwd: Some(dir.into()),
        ..Default::default()
    }
}
fn gone(pid: u32) {
    use fgos_process::facts::{observe, Observed};
    assert!(
        matches!(
            observe(fgos_process::ProcId(pid)),
            Observed::Absent | Observed::Zombie
        ),
        "pid {pid} remains live"
    );
}
fn pids_gone(dir: &std::path::Path) {
    for pid in fs::read_to_string(dir.join("pids"))
        .unwrap()
        .split_whitespace()
    {
        gone(pid.parse().unwrap());
    }
}

#[test]
fn child_entry() {
    #[cfg(target_os = "linux")]
    if scm_role() { return; }
    common::child_entry()
}

#[test]
fn contender_blocks_during_borrow_and_acquires_after_return_and_release() {
    let _serial = serial();
    let dir = temp_dir("io-exclusion");
    let res = resource(&dir, "io");
    let handle = held(&res);
    let ready = dir.join("contender-ready");
    let mut contender = spawn_role("holder", &res.path, &ready, "");
    let start = dir.join("started");
    std::thread::scope(|scope| {
        let worker = scope.spawn(|| {
            run_borrowed_io(
                &handle,
                &shell(
                    "echo started > started; while [ ! -f finish ]; do sleep 0.01; done",
                    &dir,
                ),
                &bounds(vec![]),
            )
        });
        let deadline = Instant::now() + Duration::from_secs(5);
        while !start.exists() {
            assert!(Instant::now() < deadline);
            std::thread::sleep(Duration::from_millis(2));
        }
        assert!(!ready.exists());
        assert!(matches!(
            acquire(&res, Mode::Ex, Wait::Try, 2000),
            Acquire::Held { .. }
        ));
        fs::write(dir.join("finish"), b"").unwrap();
        assert_eq!(worker.join().unwrap().unwrap().outcome.exit, Some(0));
    });
    // The synchronous call lends the handle; ownership stays with the caller.
    assert!(!ready.exists());
    release(handle);
    assert_eq!(wait_ready(&ready, &mut contender), "held");
    kill_and_reap(&mut contender);
    fs::remove_dir_all(dir).unwrap();
}

#[test]
fn binary_git_hash_object_round_trip_with_hooks_off() {
    let _serial = serial();
    let dir = temp_dir("io-git");
    assert!(Command::new("git")
        .args(["init", "-q"])
        .current_dir(&dir)
        .status()
        .unwrap()
        .success());
    let hooks = dir.join("empty-hooks");
    fs::create_dir(&hooks).unwrap();
    let handle = held(&resource(&dir, "io"));
    let input: Vec<u8> = (0..=255).cycle().take(256 * 2048).collect();
    let spec = BorrowSpec {
        argv: vec![
            "git".into(),
            "-c".into(),
            format!("core.hooksPath={}", hooks.display()),
            "hash-object".into(),
            "--stdin".into(),
            "-w".into(),
        ],
        cwd: Some(dir.clone()),
        ..Default::default()
    };
    let out = run_borrowed_io(&handle, &spec, &bounds(input.clone())).unwrap();
    assert_eq!(out.outcome.exit, Some(0));
    assert!(out.stderr.is_empty());
    let oid = std::str::from_utf8(&out.stdout).unwrap().trim();
    let read = Command::new("git")
        .args(["cat-file", "blob", oid])
        .current_dir(&dir)
        .output()
        .unwrap();
    assert!(read.status.success());
    assert_eq!(read.stdout, input);
    release(handle);
    fs::remove_dir_all(dir).unwrap();
}

#[test]
fn full_duplex_binary_capture_does_not_deadlock() {
    let _serial = serial();
    let dir = temp_dir("io-duplex");
    let handle = held(&resource(&dir, "io"));
    let input: Vec<u8> = (0..=255).cycle().take(512 * 1024).collect();
    let out = run_borrowed_io(
        &handle,
        &shell("cat; printf diagnostic >&2", &dir),
        &bounds(input.clone()),
    )
    .unwrap();
    assert_eq!(out.stdout, input);
    assert_eq!(out.stderr, b"diagnostic");
    release(handle);
    fs::remove_dir_all(dir).unwrap();
}

#[test]
fn overflow_kills_root_and_borrowing_leftovers_before_refusal() {
    let _serial = serial();
    for stream in ["stdout", "stderr"] {
        let dir = temp_dir("io-overflow");
        let handle = held(&resource(&dir, "io"));
        let redirect = if stream == "stderr" { " >&2" } else { "" };
        let script =
            format!("sleep 30 & echo $$ $! > pids; while :; do printf 0123456789{redirect}; done");
        let mut io = bounds(vec![]);
        io.stdout_limit = 32;
        io.stderr_limit = 32;
        let error = run_borrowed_io(&handle, &shell(&script, &dir), &io).unwrap_err();
        assert!(
            matches!(error, BorrowError::OutputLimit(s) if s == stream),
            "{error}"
        );
        assert_eq!(error.to_string(), format!("borrow-output-limit: {stream}"));
        pids_gone(&dir);
        release(handle);
        release(held(&resource(&dir, "io")));
        fs::remove_dir_all(dir).unwrap();
    }
}

#[test]
fn deadline_kills_and_drains_even_when_child_never_reads_stdin() {
    let _serial = serial();
    let dir = temp_dir("io-deadline");
    let res = resource(&dir, "io");
    let handle = held(&res);
    let mut io = bounds(vec![42; 1024 * 1024]);
    io.deadline = Instant::now() + Duration::from_millis(200);
    let error = run_borrowed_io(
        &handle,
        &shell("sleep 30 & echo $$ $! > pids; wait", &dir),
        &io,
    )
    .unwrap_err();
    assert!(matches!(error, BorrowError::Deadline), "{error}");
    assert_eq!(error.to_string(), "borrow-deadline");
    pids_gone(&dir);
    release(handle);
    release(held(&res));
    fs::remove_dir_all(dir).unwrap();
}

#[test]
fn successful_root_exit_drains_leftovers_and_captures_tail() {
    let _serial = serial();
    let dir = temp_dir("io-tail");
    let handle = held(&resource(&dir, "io"));
    let out = run_borrowed_io(
        &handle,
        &shell(
            "sleep 30 & echo $$ $! > pids; printf tail; printf error >&2",
            &dir,
        ),
        &bounds(vec![]),
    )
    .unwrap();
    assert_eq!(out.outcome.exit, Some(0));
    assert!(out.outcome.leftovers_killed > 0);
    assert_eq!(out.stdout, b"tail");
    assert_eq!(out.stderr, b"error");
    pids_gone(&dir);
    release(handle);
    fs::remove_dir_all(dir).unwrap();
}

#[test]
fn replaced_lock_inode_refuses_old_handle_before_any_child() {
    let _serial = serial();
    let dir = temp_dir("io-replaced");
    let res = resource(&dir, "event-seal");
    let old = held(&res);
    validate(&old).unwrap();
    fs::rename(&res.path, dir.join("original.lock")).unwrap();
    let successor = held(&res);
    validate(&successor).unwrap();
    assert_eq!(validate(&old).unwrap_err().to_string(), "lock-resource-replaced");
    let spec = shell("touch spawned", &dir);
    assert_eq!(run_borrowed_io(&old, &spec, &bounds(vec![])).unwrap_err().to_string(), "lock-resource-replaced");
    let helper = HelperExe::current().unwrap();
    assert_eq!(run_borrowed(&old, &spec, &helper).unwrap_err().to_string(), "lock-resource-replaced");
    assert!(!dir.join("spawned").exists());
    assert!(matches!(acquire(&res, Mode::Ex, Wait::Try, 2000), Acquire::Held { .. }));
    release(old);
    validate(&successor).unwrap();
    release(successor);
    fs::remove_dir_all(dir).unwrap();
}

/// Deterministically exposes the real fork-to-exec inheritance window.
#[cfg(target_os = "linux")]
#[test]
fn unrelated_pre_exec_child_survives_borrowed_git() {
    use std::os::unix::process::CommandExt;
    let _serial = serial();
    let dir = temp_dir("pre-exec");
    let handle = held(&resource(&dir, "io"));
    let marker = std::ffi::CString::new(dir.join("ready").to_str().unwrap()).unwrap();
    std::thread::scope(|scope| {
        let unrelated = scope.spawn(|| {
            let mut cmd = Command::new("/bin/true");
            // SAFETY: only async-signal-safe syscalls between fork and exec.
            unsafe {
                cmd.pre_exec(move || {
                    let fd = libc::open(marker.as_ptr(), libc::O_WRONLY | libc::O_CREAT, 0o600);
                    if fd < 0 { return Err(std::io::Error::last_os_error()); }
                    libc::close(fd);
                    libc::usleep(500_000);
                    Ok(())
                });
            }
            cmd.status().unwrap()
        });
        let deadline = Instant::now() + Duration::from_secs(5);
        while !dir.join("ready").exists() {
            assert!(Instant::now() < deadline);
            std::thread::sleep(Duration::from_millis(1));
        }
        let spec = BorrowSpec { argv: vec!["git".into(), "--version".into()], ..Default::default() };
        let out = run_borrowed_io(&handle, &spec, &bounds(vec![])).unwrap();
        assert_eq!(out.outcome.exit, Some(0));
        assert_eq!(out.outcome.leftovers_killed, 0);
        assert!(unrelated.join().unwrap().success());
    });
    release(handle);
    fs::remove_dir_all(dir).unwrap();
}

#[cfg(target_os = "linux")]
#[test]
fn admission_refuses_escapee_and_borrow_cleanup_kills_it() {
    use std::os::unix::process::CommandExt;
    let _serial = serial();
    let dir = temp_dir("foreign");
    let res = resource(&dir, "io");
    let handle = held(&res);
    let marker = std::ffi::CString::new(dir.join("foreign").to_str().unwrap()).unwrap();
    let lock_fd: i32 = fs::read_dir("/proc/self/fd").unwrap().flatten().find_map(|entry| {
        (fs::read_link(entry.path()).ok()? == res.path).then(|| entry.file_name().to_str().unwrap().parse().unwrap())
    }).unwrap();
    let mut cmd = Command::new("/bin/true");
    // Fork an unrelated grandchild before exec, keeping its inherited copy.
    // SAFETY: the child uses only async-signal-safe syscalls, never Rust locks.
    unsafe {
        cmd.pre_exec(move || {
            let pid = libc::fork();
            if pid < 0 { return Err(std::io::Error::last_os_error()); }
            if pid == 0 {
                libc::setsid();
                // Close Command's exec-error pipe too; retain only the lock
                // copy so the parent's spawn can finish independently.
                for fd in 3..65536 {
                    if fd != lock_fd { libc::close(fd); }
                }
                loop { libc::pause(); }
            }
            let fd = libc::open(marker.as_ptr(), libc::O_WRONLY | libc::O_CREAT, 0o600);
            if fd < 0 { libc::kill(pid, libc::SIGKILL); return Err(std::io::Error::last_os_error()); }
            libc::write(fd, (&pid as *const libc::pid_t).cast(), std::mem::size_of_val(&pid));
            libc::close(fd);
            Ok(())
        });
    }
    assert!(cmd.status().unwrap().success());
    let bytes = fs::read(dir.join("foreign")).unwrap();
    let pid = i32::from_ne_bytes(bytes.try_into().unwrap()) as u32;
    struct ForeignGuard(u32);
    impl Drop for ForeignGuard {
        fn drop(&mut self) {
            // SAFETY: test owns this deliberately created process.
            unsafe { libc::kill(self.0 as i32, libc::SIGKILL); }
        }
    }
    let foreign = ForeignGuard(pid);
    assert!(matches!(validate_quiescent(&handle), Err(BorrowError::ForeignHolder { pids }) if pids.contains(&pid)));
    let outcome = run_borrowed_io(&handle, &shell("true", &dir), &bounds(vec![])).unwrap();
    assert!(outcome.outcome.leftovers_killed > 0);
    assert!(matches!(acquire(&res, Mode::Ex, Wait::Try, 2000), Acquire::Held { .. }));
    release(handle);
    drop(foreign);
    let deadline = Instant::now() + Duration::from_secs(5);
    while !matches!(fgos_process::facts::observe(fgos_process::ProcId(pid)), fgos_process::facts::Observed::Absent | fgos_process::facts::Observed::Zombie) {
        assert!(Instant::now() < deadline);
        std::thread::sleep(Duration::from_millis(1));
    }
    release(held(&res));
    fs::remove_dir_all(dir).unwrap();
}

#[cfg(target_os = "linux")]
#[test]
fn borrowed_grandchild_keeps_fd_and_is_drained() {
    let _serial = serial();
    let dir = temp_dir("grandchild");
    let handle = held(&resource(&dir, "io"));
    let out = run_borrowed_io(&handle, &shell("sh -c 'sleep 30 & echo $! > grandchild'", &dir), &bounds(vec![])).unwrap();
    assert_eq!(out.outcome.exit, Some(0));
    assert!(out.outcome.leftovers_killed > 0);
    gone(fs::read_to_string(dir.join("grandchild")).unwrap().trim().parse().unwrap());
    release(handle);
    fs::remove_dir_all(dir).unwrap();
}

/// Drains read only processes started since the last proven drain. An
/// escapee of a later borrow (new session and group, reparented away from
/// the borrowed child, still holding the description) starts after that
/// point, so it is still found and killed.
#[cfg(target_os = "linux")]
#[test]
fn setsid_escapee_after_an_earlier_proven_drain_is_still_killed() {
    let _serial = serial();
    let dir = temp_dir("escapee-after-drain");
    let res = resource(&dir, "io");
    let handle = held(&res);
    // A proven drain moves the read floor forward.
    assert_eq!(run_borrowed_io(&handle, &shell("true", &dir), &bounds(vec![])).unwrap().outcome.exit, Some(0));
    std::thread::sleep(Duration::from_millis(30));
    let out = run_borrowed_io(
        &handle,
        &shell("setsid sh -c 'echo $$ > escapee; exec sleep 30' & while [ ! -s escapee ]; do sleep 0.01; done", &dir),
        &bounds(vec![]),
    )
    .unwrap();
    assert_eq!(out.outcome.exit, Some(0));
    assert!(out.outcome.leftovers_killed > 0);
    gone(fs::read_to_string(dir.join("escapee")).unwrap().trim().parse().unwrap());
    release(handle);
    assert!(matches!(acquire(&res, Mode::Ex, Wait::Try, 2000), Acquire::Acquired(_)));
    fs::remove_dir_all(dir).unwrap();
}

/// A check that could not prove the description held by this process alone
/// leaves the read floor where it was: the same leaked holder is found again
/// by a later check, however much later it runs.
#[cfg(target_os = "linux")]
#[test]
fn refused_admission_keeps_finding_the_same_leaked_holder() {
    use std::os::unix::process::CommandExt;
    let _serial = serial();
    let dir = temp_dir("leak-floor");
    let res = resource(&dir, "io");
    let handle = held(&res);
    // Prove the description alone once, so the floor is past acquire.
    validate_quiescent(&handle).unwrap();
    std::thread::sleep(Duration::from_millis(30));
    let marker = std::ffi::CString::new(dir.join("leaked").to_str().unwrap()).unwrap();
    let lock_fd: i32 = fs::read_dir("/proc/self/fd").unwrap().flatten().find_map(|entry| {
        (fs::read_link(entry.path()).ok()? == res.path).then(|| entry.file_name().to_str().unwrap().parse().unwrap())
    }).unwrap();
    let mut cmd = Command::new("/bin/true");
    // SAFETY: the child uses only async-signal-safe syscalls, never Rust locks.
    unsafe {
        cmd.pre_exec(move || {
            let pid = libc::fork();
            if pid < 0 { return Err(std::io::Error::last_os_error()); }
            if pid == 0 {
                libc::setsid();
                for fd in 3..65536 {
                    if fd != lock_fd { libc::close(fd); }
                }
                loop { libc::pause(); }
            }
            let fd = libc::open(marker.as_ptr(), libc::O_WRONLY | libc::O_CREAT, 0o600);
            if fd < 0 { libc::kill(pid, libc::SIGKILL); return Err(std::io::Error::last_os_error()); }
            libc::write(fd, (&pid as *const libc::pid_t).cast(), std::mem::size_of_val(&pid));
            libc::close(fd);
            Ok(())
        });
    }
    assert!(cmd.status().unwrap().success());
    let pid = i32::from_ne_bytes(fs::read(dir.join("leaked")).unwrap().try_into().unwrap()) as u32;
    struct Leaked(u32);
    impl Drop for Leaked {
        fn drop(&mut self) {
            // SAFETY: the test owns this deliberately created process.
            unsafe { libc::kill(self.0 as i32, libc::SIGKILL); }
        }
    }
    let leaked = Leaked(pid);
    for _ in 0..2 {
        assert!(matches!(validate_quiescent(&handle), Err(BorrowError::ForeignHolder { pids }) if pids.contains(&pid)));
        std::thread::sleep(Duration::from_millis(30));
    }
    drop(leaked);
    let deadline = Instant::now() + Duration::from_secs(5);
    while !matches!(fgos_process::facts::observe(fgos_process::ProcId(pid)), fgos_process::facts::Observed::Absent | fgos_process::facts::Observed::Zombie) {
        assert!(Instant::now() < deadline);
        std::thread::sleep(Duration::from_millis(1));
    }
    release(handle);
    fs::remove_dir_all(dir).unwrap();
}

/// The receiver exists before acquire, so neither PID order nor start time
/// can find it. Only the final full descriptor scan can prove release safe.
#[cfg(target_os = "linux")]
#[test]
fn descriptor_sent_to_a_preexisting_process_is_killed_before_release() {
    let _serial = serial();
    let dir = temp_dir("scm-rights");
    let mut process = Command::new(std::env::current_exe().unwrap())
        .args(["--exact", "child_entry", "--nocapture"]).env("SCM_ROLE", "parent").current_dir(&dir)
        .stdin(std::process::Stdio::null()).stdout(std::process::Stdio::null()).stderr(std::process::Stdio::inherit()).spawn().unwrap();
    let deadline = Instant::now() + Duration::from_secs(5);
    while !dir.join("ready").exists() {
        assert!(Instant::now() < deadline);
        std::thread::sleep(Duration::from_millis(2));
    }
    let pid: u32 = fs::read_to_string(dir.join("ready")).unwrap().parse().unwrap();
    let res = resource(&dir, "io");
    let handle = held(&res);
    let out = run_borrowed_io(&handle, &BorrowSpec {
        argv: vec![std::env::current_exe().unwrap().to_str().unwrap().into(), "--exact".into(), "child_entry".into(), "--nocapture".into()],
        env: [("SCM_ROLE".into(), "sender".into())].into(),
        cwd: Some(dir.clone()),
        ..Default::default()
    }, &bounds(vec![])).unwrap();
    assert_eq!(out.outcome.exit, Some(0));
    assert!(out.outcome.leftovers_killed >= 1);
    gone(pid);
    assert!(process.wait().unwrap().success());
    release(handle);
    assert!(matches!(acquire(&res, Mode::Ex, Wait::Try, 2000), Acquire::Acquired(_)));
    fs::remove_dir_all(dir).unwrap();
}

#[cfg(target_os = "linux")]
fn scm_role() -> bool {
    use std::io::{Read, Write};
    use std::os::fd::{AsRawFd, FromRawFd};
    use std::os::unix::net::{UnixListener, UnixStream};
    let Ok(role) = std::env::var("SCM_ROLE") else { return false; };
    if role == "parent" {
        let mut child = Command::new(std::env::current_exe().unwrap())
            .args(["--exact", "child_entry", "--nocapture"]).env("SCM_ROLE", "receiver").spawn().unwrap();
        let status = child.wait().unwrap();
        use std::os::unix::process::ExitStatusExt;
        assert_eq!(status.signal(), Some(libc::SIGKILL));
        return true;
    }
    let mut stream = if role == "receiver" {
        let listener = UnixListener::bind("socket").unwrap();
        fs::write("ready", std::process::id().to_string()).unwrap();
        listener.accept().unwrap().0
    } else { UnixStream::connect("socket").unwrap() };
    let mut data = *b"x";
    let mut control = [0usize; 8];
    let mut iov = libc::iovec { iov_base: data.as_mut_ptr().cast(), iov_len: 1 };
    // SAFETY: zeroed msghdr, aligned ancillary buffer, live stream and payload.
    unsafe {
        let mut msg: libc::msghdr = std::mem::zeroed();
        msg.msg_iov = &mut iov;
        msg.msg_iovlen = 1;
        msg.msg_control = control.as_mut_ptr().cast();
        msg.msg_controllen = libc::CMSG_SPACE(std::mem::size_of::<i32>() as u32) as usize;
        if role == "sender" {
            let cmsg = libc::CMSG_FIRSTHDR(&msg);
            (*cmsg).cmsg_level = libc::SOL_SOCKET;
            (*cmsg).cmsg_type = libc::SCM_RIGHTS;
            (*cmsg).cmsg_len = libc::CMSG_LEN(std::mem::size_of::<i32>() as u32) as usize;
            std::ptr::write_unaligned(libc::CMSG_DATA(cmsg).cast::<i32>(), 3);
            assert_eq!(libc::sendmsg(stream.as_raw_fd(), &msg, 0), 1);
            let mut ack = [0];
            stream.read_exact(&mut ack).unwrap();
        } else {
            assert_eq!(libc::recvmsg(stream.as_raw_fd(), &mut msg, libc::MSG_CMSG_CLOEXEC), 1);
            let cmsg = libc::CMSG_FIRSTHDR(&msg);
            assert!(!cmsg.is_null());
            assert_eq!((*cmsg).cmsg_type, libc::SCM_RIGHTS);
            let fd = std::ptr::read_unaligned(libc::CMSG_DATA(cmsg).cast::<i32>());
            let _description = std::fs::File::from_raw_fd(fd);
            stream.write_all(b"a").unwrap();
            std::thread::sleep(Duration::from_secs(30));
        }
    }
    true
}
