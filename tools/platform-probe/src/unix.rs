//! Unix (macOS + Linux control) tests and helper roles.

use crate::util::*;
use serde_json::json;
use std::collections::{BTreeMap, BTreeSet};
use std::fs::OpenOptions;
use std::os::unix::io::AsRawFd;
use std::os::unix::process::CommandExt;
use std::path::Path;
use std::process::Command;
use std::time::{Duration, Instant};

// ---------- primitives ----------

pub fn kill_pid(pid: u32) {
    unsafe {
        libc::kill(pid as i32, libc::SIGKILL);
    }
}

pub fn pid_alive(pid: u32) -> bool {
    unsafe {
        if libc::kill(pid as i32, 0) != 0 {
            return std::io::Error::last_os_error().raw_os_error() == Some(libc::EPERM);
        }
    }
    // A zombie still answers kill(0); treat it as dead (Linux exposes the state).
    if let Ok(s) = std::fs::read_to_string(format!("/proc/{pid}/stat")) {
        if let Some(i) = s.rfind(')') {
            let st = s[i + 1..].trim_start().chars().next();
            return !matches!(st, Some('Z') | Some('X'));
        }
    }
    true
}

pub fn watchdog() {
    // Helper roles never outlive a crashed probe by more than 3 minutes. No thread: roles fork.
    unsafe {
        libc::alarm(180);
    }
}

pub fn make_executable(p: &Path) {
    use std::os::unix::fs::PermissionsExt;
    let _ = std::fs::set_permissions(p, std::fs::Permissions::from_mode(0o755));
}

fn open_lock_file(path: &Path) -> std::io::Result<std::fs::File> {
    OpenOptions::new().read(true).write(true).create(true).truncate(false).open(path)
}

/// True when the exclusive lock was free (it is released again immediately).
pub fn lock_free(path: &Path) -> bool {
    match open_lock_file(path) {
        Ok(f) => unsafe { libc::flock(f.as_raw_fd(), libc::LOCK_EX | libc::LOCK_NB) == 0 },
        Err(_) => false,
    }
}

fn clear_cloexec(fd: i32) {
    unsafe {
        libc::fcntl(fd, libc::F_SETFD, 0);
    }
}

fn run_text(prog: &str, args: &[&str]) -> Option<String> {
    let mut c = Command::new(prog);
    c.args(args);
    run_capture(c, secs(10)).map(|(_, s)| s.trim().to_string())
}

pub fn os_version() -> String {
    if cfg!(target_os = "macos") {
        let v = run_text("sw_vers", &["-productVersion"]).unwrap_or_default();
        format!("macOS {v} / {}", run_text("uname", &["-srm"]).unwrap_or_default())
    } else {
        run_text("uname", &["-srv"]).unwrap_or_default()
    }
}

pub fn fs_type(p: &Path) -> String {
    #[cfg(target_os = "macos")]
    unsafe {
        let c = std::ffi::CString::new(p.to_string_lossy().as_bytes()).unwrap();
        let mut st: libc::statfs = std::mem::zeroed();
        if libc::statfs(c.as_ptr(), &mut st) == 0 {
            let name = std::ffi::CStr::from_ptr(st.f_fstypename.as_ptr());
            return name.to_string_lossy().into_owned();
        }
        "unknown".into()
    }
    #[cfg(not(target_os = "macos"))]
    {
        run_text("stat", &["-f", "-c", "%T", &p.to_string_lossy()]).unwrap_or_else(|| "unknown".into())
    }
}

// ---------- roles ----------

pub fn role(name: &str, a: &[String]) -> bool {
    match name {
        // holder <lockfile> <ready>: lock, then live until killed.
        "holder" => {
            let f = open_lock_file(Path::new(&a[0])).expect("open lock file");
            if unsafe { libc::flock(f.as_raw_fd(), libc::LOCK_EX) } != 0 {
                std::process::exit(3);
            }
            write_atomic(Path::new(&a[1]), &std::process::id().to_string());
            loop {
                std::thread::sleep(Duration::from_secs(3600));
            }
        }
        // inherit-holder <lockfile> <ready> <childpidfile>: lock, hand the fd to a child, live.
        "inherit-holder" => {
            let f = open_lock_file(Path::new(&a[0])).expect("open lock file");
            if unsafe { libc::flock(f.as_raw_fd(), libc::LOCK_EX) } != 0 {
                std::process::exit(3);
            }
            clear_cloexec(f.as_raw_fd());
            let mut c = Command::new(std::env::current_exe().unwrap());
            c.args(["--role", "sleeper", &a[2]]);
            c.stdin(std::process::Stdio::null()).stdout(std::process::Stdio::null()).stderr(std::process::Stdio::null());
            let child = c.spawn().expect("spawn child");
            wait_until(secs(10), || Path::new(&a[2]).exists());
            write_atomic(Path::new(&a[1]), &format!("{} {}", std::process::id(), child.id()));
            loop {
                std::thread::sleep(Duration::from_secs(3600));
            }
        }
        // scm-holder <lockfile> <ready> <sockfd>: lock, send the fd over a socket, live.
        "scm-holder" => {
            let f = open_lock_file(Path::new(&a[0])).expect("open lock file");
            if unsafe { libc::flock(f.as_raw_fd(), libc::LOCK_EX) } != 0 {
                std::process::exit(3);
            }
            let sock: i32 = a[2].parse().expect("sockfd");
            if let Err(e) = unsafe { send_fd(sock, f.as_raw_fd()) } {
                eprintln!("send_fd: {e}");
                std::process::exit(4);
            }
            write_atomic(Path::new(&a[1]), &std::process::id().to_string());
            loop {
                std::thread::sleep(Duration::from_secs(3600));
            }
        }
        // escaper <dir>: one child that stays in the group, one that setsid + double-forks away.
        "escaper" => {
            let dir = &a[0];
            let mut c = Command::new(std::env::current_exe().unwrap());
            c.args(["--role", "sleeper", &format!("{dir}/esc-normal.pid")]);
            c.stdin(std::process::Stdio::null()).stdout(std::process::Stdio::null()).stderr(std::process::Stdio::null());
            let _normal = c.spawn().expect("spawn normal child");
            unsafe {
                let p1 = libc::fork();
                if p1 == 0 {
                    libc::setsid();
                    let p2 = libc::fork();
                    if p2 == 0 {
                        write_atomic(Path::new(&format!("{dir}/esc-escaped.pid")), &std::process::id().to_string());
                        loop {
                            libc::sleep(3600);
                        }
                    }
                    libc::_exit(0);
                }
                let mut st = 0;
                libc::waitpid(p1, &mut st, 0);
            }
            write_atomic(Path::new(&format!("{dir}/escaper.ready")), &std::process::id().to_string());
            loop {
                std::thread::sleep(Duration::from_secs(3600));
            }
        }
        // githolder <lockfile> <ready> <repo> <block|noblock>
        "githolder" => {
            let f = open_lock_file(Path::new(&a[0])).expect("open lock file");
            if unsafe { libc::flock(f.as_raw_fd(), libc::LOCK_EX) } != 0 {
                std::process::exit(3);
            }
            clear_cloexec(f.as_raw_fd());
            let mut c = Command::new("git");
            c.args(["-C", &a[2], "-c", "gc.auto=1", "commit", "--allow-empty", "-q", "-m", "probe"]);
            c.stdin(std::process::Stdio::null()).stdout(std::process::Stdio::null()).stderr(std::process::Stdio::null());
            let mut child = c.spawn().expect("spawn git");
            write_atomic(Path::new(&a[1]), &format!("{} {} fd-inherited", std::process::id(), child.id()));
            if a[3] == "noblock" {
                let _ = child.wait();
                let dir = Path::new(&a[0]).parent().unwrap().to_path_buf();
                write_atomic(&dir.join("git.done"), "1");
            }
            loop {
                std::thread::sleep(Duration::from_secs(3600));
            }
        }
        _ => false,
    }
}

unsafe fn send_fd(sock: i32, fd: i32) -> std::io::Result<()> {
    let mut data = [b'x'];
    let mut iov = libc::iovec { iov_base: data.as_mut_ptr() as *mut _, iov_len: 1 };
    let space = libc::CMSG_SPACE(4) as usize;
    let mut cbuf = vec![0u64; space / 8 + 1];
    let mut msg: libc::msghdr = std::mem::zeroed();
    msg.msg_iov = &mut iov;
    msg.msg_iovlen = 1;
    msg.msg_control = cbuf.as_mut_ptr() as *mut _;
    msg.msg_controllen = space as _;
    let c = libc::CMSG_FIRSTHDR(&msg);
    (*c).cmsg_level = libc::SOL_SOCKET;
    (*c).cmsg_type = libc::SCM_RIGHTS;
    (*c).cmsg_len = libc::CMSG_LEN(4) as _;
    std::ptr::copy_nonoverlapping(&fd as *const i32 as *const u8, libc::CMSG_DATA(c), 4);
    if libc::sendmsg(sock, &msg, 0) < 0 {
        return Err(std::io::Error::last_os_error());
    }
    Ok(())
}

unsafe fn recv_fd(sock: i32) -> std::io::Result<i32> {
    let mut data = [0u8; 1];
    let mut iov = libc::iovec { iov_base: data.as_mut_ptr() as *mut _, iov_len: 1 };
    let space = libc::CMSG_SPACE(4) as usize;
    let mut cbuf = vec![0u64; space / 8 + 1];
    let mut msg: libc::msghdr = std::mem::zeroed();
    msg.msg_iov = &mut iov;
    msg.msg_iovlen = 1;
    msg.msg_control = cbuf.as_mut_ptr() as *mut _;
    msg.msg_controllen = space as _;
    if libc::recvmsg(sock, &mut msg, 0) < 0 {
        return Err(std::io::Error::last_os_error());
    }
    let c = libc::CMSG_FIRSTHDR(&msg);
    if c.is_null() || (*c).cmsg_type != libc::SCM_RIGHTS {
        return Err(std::io::Error::other("no SCM_RIGHTS control message"));
    }
    let mut fd = -1i32;
    std::ptr::copy_nonoverlapping(libc::CMSG_DATA(c), &mut fd as *mut i32 as *mut u8, 4);
    Ok(fd)
}

// ---------- tests ----------

pub fn tests() -> Vec<Def> {
    vec![
        Def {
            name: "flock-released-on-sigkill",
            expect: "flock held by the holder is visible to others, and is released by the kernel when the holder is SIGKILLed",
            timeout_s: 60,
            f: flock_sigkill,
        },
        Def {
            name: "flock-fd-inherited-keeps-lock",
            expect: "a child that inherited the fd keeps the lock after the parent is SIGKILLed (open-file-description semantics); released only when the child dies",
            timeout_s: 60,
            f: flock_inherited,
        },
        Def {
            name: "flock-fd-passed-by-scm-rights",
            expect: "the fd received over a socket keeps the lock after the sender is SIGKILLed; released when the receiver closes it",
            timeout_s: 60,
            f: flock_scm_rights,
        },
        Def {
            name: "process-group-kill",
            expect: "killpg kills every process of a group, including grandchildren",
            timeout_s: 60,
            f: pgroup_kill,
        },
        Def {
            name: "setsid-double-fork-escaper",
            expect: "macOS: the escaper SURVIVES the group kill and is reparented to launchd (confirms best-effort level); linux control: same without a PID namespace",
            timeout_s: 60,
            f: escaper,
        },
        Def {
            name: "tree-scan-and-kill-all",
            expect: "a descendant scan finds every process of a 40-process tree and a stop-rescan-kill pass ends them all; timings are the cost of pgroup-tree kill_all",
            timeout_s: 90,
            f: tree_scan,
        },
    ]
}

fn flock_sigkill(ctx: &Ctx) -> TestResult {
    let lock = ctx.s("lock");
    let mut h = spawn(&mut ctx.role("holder", &[&lock, &ctx.s("ready")]))?;
    if wait_until(secs(10), || ctx.p("ready").exists()).is_none() {
        return Err("holder never took the lock".into());
    }
    let held = !lock_free(&ctx.p("lock"));
    let t = Instant::now();
    h.kill().map_err(|e| e.to_string())?;
    let _ = h.wait();
    let rel = wait_until(secs(5), || lock_free(&ctx.p("lock")));
    let data = json!({"heldWhileHolderAlive": held, "releaseMsAfterSigkill": rel.map(ms), "killMs": ms(t.elapsed())});
    if held && rel.is_some() {
        pass("lock visible while held, released on SIGKILL", data)
    } else {
        fail("lock not held while alive, or not released after SIGKILL", data)
    }
}

fn flock_inherited(ctx: &Ctx) -> TestResult {
    let lock = ctx.s("lock");
    let mut h = spawn(&mut ctx.role("inherit-holder", &[&lock, &ctx.s("ready"), &ctx.s("child.pid")]))?;
    if wait_until(secs(10), || ctx.p("ready").exists()).is_none() {
        return Err("holder never became ready".into());
    }
    let child = read_pid(&ctx.p("child.pid")).ok_or("no child pid")?;
    let held = !lock_free(&ctx.p("lock"));
    h.kill().map_err(|e| e.to_string())?;
    let _ = h.wait();
    std::thread::sleep(Duration::from_millis(500));
    let held_after_parent = !lock_free(&ctx.p("lock"));
    let t = Instant::now();
    kill_pid(child);
    let rel = wait_until(secs(5), || lock_free(&ctx.p("lock")));
    let data = json!({"heldBeforeKill": held, "heldAfterParentSigkill": held_after_parent, "releaseMsAfterChildKilled": rel.map(|_| ms(t.elapsed()))});
    if held && held_after_parent && rel.is_some() {
        pass("inherited fd keeps the lock after parent death", data)
    } else {
        fail("inherited-fd semantics differ from the open-file-description model", data)
    }
}

fn flock_scm_rights(ctx: &Ctx) -> TestResult {
    let mut fds = [0i32; 2];
    if unsafe { libc::socketpair(libc::AF_UNIX, libc::SOCK_STREAM, 0, fds.as_mut_ptr()) } != 0 {
        return Err(format!("socketpair: {}", std::io::Error::last_os_error()));
    }
    unsafe {
        libc::fcntl(fds[0], libc::F_SETFD, libc::FD_CLOEXEC);
        let tv = libc::timeval { tv_sec: 10, tv_usec: 0 };
        libc::setsockopt(fds[0], libc::SOL_SOCKET, libc::SO_RCVTIMEO, &tv as *const _ as *const _, std::mem::size_of::<libc::timeval>() as _);
    }
    clear_cloexec(fds[1]);
    let lock = ctx.s("lock");
    let mut h = spawn(&mut ctx.role("scm-holder", &[&lock, &ctx.s("ready"), &fds[1].to_string()]))?;
    unsafe {
        libc::close(fds[1]);
    }
    if wait_until(secs(10), || ctx.p("ready").exists()).is_none() {
        return Err("holder never sent the fd".into());
    }
    let received = unsafe { recv_fd(fds[0]) }.map_err(|e| format!("recv_fd: {e}"))?;
    let held = !lock_free(&ctx.p("lock"));
    h.kill().map_err(|e| e.to_string())?;
    let _ = h.wait();
    std::thread::sleep(Duration::from_millis(300));
    let held_after_sender = !lock_free(&ctx.p("lock"));
    unsafe {
        libc::close(received);
        libc::close(fds[0]);
    }
    let rel = wait_until(secs(5), || lock_free(&ctx.p("lock")));
    let data = json!({"heldBeforeKill": held, "heldAfterSenderSigkill": held_after_sender, "releasedAfterReceiverClosed": rel.is_some()});
    if held && held_after_sender && rel.is_some() {
        pass("SCM_RIGHTS-passed fd keeps the lock", data)
    } else {
        fail("SCM_RIGHTS fd did not behave as one open-file description", data)
    }
}

fn pgroup_kill(ctx: &Ctx) -> TestResult {
    let mut c = ctx.role("fanout", &[&ctx.dir.to_string_lossy(), "2", "2"]);
    c.process_group(0);
    let mut root = spawn(&mut c)?;
    let expected = 7; // 1 + 2 + 4
    if wait_until(secs(15), || pid_files(&ctx.dir, "fan-").len() >= expected).is_none() {
        return Err("process tree did not come up".into());
    }
    let pids = pid_files(&ctx.dir, "fan-");
    let t = Instant::now();
    unsafe {
        libc::killpg(root.id() as i32, libc::SIGKILL);
    }
    let _ = root.wait();
    let dead = wait_until(secs(5), || pids.iter().all(|p| !pid_alive(*p)));
    let data = json!({"processes": pids.len(), "allDeadMs": dead.map(|_| ms(t.elapsed()))});
    if dead.is_some() && pids.len() == expected {
        pass("killpg ended the whole group", data)
    } else {
        fail("some processes survived killpg or the tree was incomplete", data)
    }
}

fn escaper(ctx: &Ctx) -> TestResult {
    let mut c = ctx.role("escaper", &[&ctx.dir.to_string_lossy()]);
    c.process_group(0);
    let mut leader = spawn(&mut c)?;
    let ok = wait_until(secs(15), || {
        ctx.p("escaper.ready").exists() && ctx.p("esc-normal.pid").exists() && ctx.p("esc-escaped.pid").exists()
    });
    if ok.is_none() {
        return Err("escaper tree did not come up".into());
    }
    let normal = read_pid(&ctx.p("esc-normal.pid")).unwrap();
    let escaped = read_pid(&ctx.p("esc-escaped.pid")).unwrap();
    let leader_pid = leader.id() as i32;
    let (pgid_escaped, sid_escaped, sid_leader) = unsafe { (libc::getpgid(escaped as i32), libc::getsid(escaped as i32), libc::getsid(leader_pid)) };
    let ppid = run_text("ps", &["-o", "ppid=", "-p", &escaped.to_string()]).unwrap_or_default();
    let parent_name = run_text("ps", &["-o", "comm=", "-p", ppid.trim()]).unwrap_or_default();
    unsafe {
        libc::killpg(leader_pid, libc::SIGKILL);
    }
    let _ = leader.wait();
    let normal_dead = wait_until(secs(5), || !pid_alive(normal)).is_some();
    std::thread::sleep(Duration::from_millis(500));
    let survived = pid_alive(escaped);
    let data = json!({
        "escapedPid": escaped,
        "escapedPgidDiffersFromGroup": pgid_escaped != leader_pid,
        "escapedSessionDiffers": sid_escaped != sid_leader,
        "escapedParentAfterReparent": ppid.trim(),
        "escapedParentName": parent_name,
        "groupMemberKilled": normal_dead,
        "escaperSurvivedGroupKill": survived,
    });
    if !normal_dead {
        return fail("the ordinary group member survived killpg", data);
    }
    pass(
        if survived { "escaper survived the group kill (pgroup kill is best-effort)" } else { "escaper did NOT survive the group kill" },
        data,
    )
}

fn ps_children() -> BTreeMap<u32, Vec<u32>> {
    let mut m: BTreeMap<u32, Vec<u32>> = BTreeMap::new();
    if let Some(out) = run_text("ps", &["-axo", "pid=,ppid="]) {
        for l in out.lines() {
            let mut it = l.split_whitespace().filter_map(|x| x.parse::<u32>().ok());
            if let (Some(p), Some(pp)) = (it.next(), it.next()) {
                m.entry(pp).or_default().push(p);
            }
        }
    }
    m
}

#[cfg(target_os = "macos")]
extern "C" {
    fn proc_listchildpids(ppid: libc::c_int, buffer: *mut libc::c_void, buffersize: libc::c_int) -> libc::c_int;
}

/// Direct children by the platform's native interface: libproc on macOS, /proc on Linux.
fn native_children(pid: u32, proc_map: &mut Option<BTreeMap<u32, Vec<u32>>>) -> Vec<u32> {
    #[cfg(target_os = "macos")]
    {
        let _ = proc_map;
        let mut buf = vec![0i32; 4096];
        unsafe {
            proc_listchildpids(pid as i32, buf.as_mut_ptr() as *mut _, (buf.len() * 4) as i32);
        }
        // The return value is a count on some releases and bytes on others; count real pids instead.
        buf.into_iter().filter(|p| *p > 0).map(|p| p as u32).collect()
    }
    #[cfg(not(target_os = "macos"))]
    {
        if proc_map.is_none() {
            let mut m: BTreeMap<u32, Vec<u32>> = BTreeMap::new();
            if let Ok(rd) = std::fs::read_dir("/proc") {
                for e in rd.flatten() {
                    if let Ok(p) = e.file_name().to_string_lossy().parse::<u32>() {
                        if let Ok(s) = std::fs::read_to_string(format!("/proc/{p}/stat")) {
                            if let Some(i) = s.rfind(')') {
                                if let Some(pp) = s[i + 1..].split_whitespace().nth(1).and_then(|x| x.parse::<u32>().ok()) {
                                    m.entry(pp).or_default().push(p);
                                }
                            }
                        }
                    }
                }
            }
            *proc_map = Some(m);
        }
        proc_map.as_ref().and_then(|m| m.get(&pid)).cloned().unwrap_or_default()
    }
}

fn descendants_native(root: u32) -> BTreeSet<u32> {
    let mut cache = None;
    let mut seen = BTreeSet::new();
    let mut q = vec![root];
    while let Some(p) = q.pop() {
        for c in native_children(p, &mut cache) {
            if seen.insert(c) {
                q.push(c);
            }
        }
    }
    seen
}

fn descendants_ps(root: u32) -> BTreeSet<u32> {
    let m = ps_children();
    let mut seen = BTreeSet::new();
    let mut q = vec![root];
    while let Some(p) = q.pop() {
        for c in m.get(&p).into_iter().flatten() {
            if seen.insert(*c) {
                q.push(*c);
            }
        }
    }
    seen
}

fn tree_scan(ctx: &Ctx) -> TestResult {
    let mut root = spawn(&mut ctx.role("fanout", &[&ctx.dir.to_string_lossy(), "3", "3"]))?;
    let expected_desc = 39usize; // 3 + 9 + 27
    if wait_until(secs(30), || pid_files(&ctx.dir, "fan-").len() > expected_desc).is_none() {
        return Err(format!("only {} of {} processes came up", pid_files(&ctx.dir, "fan-").len(), expected_desc + 1));
    }
    let rid = root.id();
    let t = Instant::now();
    let native = descendants_native(rid);
    let native_ms = ms(t.elapsed());
    let t = Instant::now();
    let via_ps = descendants_ps(rid);
    let ps_ms = ms(t.elapsed());

    // kill_all: SIGSTOP everything found, rescan until nothing new appears, then SIGKILL.
    let t = Instant::now();
    let mut stopped: BTreeSet<u32> = BTreeSet::new();
    stopped.insert(rid);
    let mut rounds = 0;
    unsafe {
        libc::kill(rid as i32, libc::SIGSTOP);
    }
    loop {
        rounds += 1;
        let found = descendants_native(rid);
        let fresh: Vec<u32> = found.iter().copied().filter(|p| !stopped.contains(p)).collect();
        if fresh.is_empty() || rounds > 10 {
            break;
        }
        for p in fresh {
            unsafe {
                libc::kill(p as i32, libc::SIGSTOP);
            }
            stopped.insert(p);
        }
    }
    for p in &stopped {
        unsafe {
            libc::kill(*p as i32, libc::SIGKILL);
        }
    }
    let _ = root.wait();
    let all: Vec<u32> = pid_files(&ctx.dir, "fan-");
    let dead = wait_until(secs(10), || all.iter().all(|p| !pid_alive(*p)));
    let kill_ms = ms(t.elapsed());
    let data = json!({
        "processesStarted": all.len(),
        "descendantsFoundNative": native.len(),
        "descendantsFoundPs": via_ps.len(),
        "nativeMethod": if cfg!(target_os = "macos") { "proc_listchildpids" } else { "/proc scan" },
        "psMethodNote": "ps -axo uses sysctl KERN_PROC on macOS",
        "nativeScanMs": native_ms,
        "psScanMs": ps_ms,
        "stopRescanRounds": rounds,
        "killAllMsToAllDead": dead.map(|_| kill_ms),
    });
    if native.len() == expected_desc && via_ps.len() == expected_desc && dead.is_some() {
        pass("scan found the full tree and kill_all ended it", data)
    } else {
        fail("scan missed descendants or some process survived kill_all", data)
    }
}
