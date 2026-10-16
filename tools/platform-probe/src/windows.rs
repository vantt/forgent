//! Windows tests and helper roles: LockFileEx, Job Objects, Toolhelp.

use crate::util::*;
use serde_json::json;
use std::collections::BTreeMap;
use std::os::windows::ffi::OsStrExt;
use std::os::windows::io::AsRawHandle;
use std::os::windows::process::CommandExt;
use std::path::Path;
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};
use windows_sys::Win32::Foundation::*;
use windows_sys::Win32::Security::SECURITY_ATTRIBUTES;
use windows_sys::Win32::Storage::FileSystem::*;
use windows_sys::Win32::System::Diagnostics::ToolHelp::*;
use windows_sys::Win32::System::JobObjects::*;
use windows_sys::Win32::System::Threading::*;
use windows_sys::Win32::System::IO::OVERLAPPED;

const JOB_OBJECT_TERMINATE: u32 = 0x0008;
const JOB_OBJECT_QUERY: u32 = 0x0004;
const JOB_OBJECT_ASSIGN_PROCESS: u32 = 0x0001;
const DETACHED_PROCESS: u32 = 0x0000_0008;
const CREATE_BREAKAWAY_FROM_JOB: u32 = 0x0100_0000;

// ---------- primitives ----------

fn wide(p: &Path) -> Vec<u16> {
    p.as_os_str().encode_wide().chain(std::iter::once(0)).collect()
}

pub fn kill_pid(pid: u32) {
    unsafe {
        let h = OpenProcess(PROCESS_TERMINATE, 0, pid);
        if !h.is_null() {
            TerminateProcess(h, 1);
            CloseHandle(h);
        }
    }
}

pub fn pid_alive(pid: u32) -> bool {
    unsafe {
        let h = OpenProcess(SYNCHRONIZE, 0, pid);
        if h.is_null() {
            return false;
        }
        let r = WaitForSingleObject(h, 0);
        CloseHandle(h);
        r == WAIT_TIMEOUT
    }
}

pub fn watchdog() {
    // Helper roles never outlive a crashed probe by more than 3 minutes.
    std::thread::spawn(|| {
        std::thread::sleep(Duration::from_secs(180));
        std::process::exit(3);
    });
}

pub fn make_executable(_p: &Path) {}

unsafe fn open_lock(path: &Path, inheritable: bool) -> HANDLE {
    let w = wide(path);
    let sa = SECURITY_ATTRIBUTES {
        nLength: std::mem::size_of::<SECURITY_ATTRIBUTES>() as u32,
        lpSecurityDescriptor: std::ptr::null_mut(),
        bInheritHandle: inheritable as i32,
    };
    CreateFileW(
        w.as_ptr(),
        GENERIC_READ | GENERIC_WRITE,
        FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
        &sa,
        OPEN_ALWAYS,
        FILE_ATTRIBUTE_NORMAL,
        std::ptr::null_mut(),
    )
}

unsafe fn try_lock(h: HANDLE) -> bool {
    let mut ov: OVERLAPPED = std::mem::zeroed();
    LockFileEx(h, LOCKFILE_EXCLUSIVE_LOCK | LOCKFILE_FAIL_IMMEDIATELY, 0, 1, 0, &mut ov) != 0
}

/// True when the exclusive lock was free (released again immediately).
pub fn lock_free(path: &Path) -> bool {
    unsafe {
        let h = open_lock(path, false);
        if h == INVALID_HANDLE_VALUE {
            return false;
        }
        let ok = try_lock(h);
        if ok {
            let mut ov: OVERLAPPED = std::mem::zeroed();
            UnlockFileEx(h, 0, 1, 0, &mut ov);
        }
        CloseHandle(h);
        ok
    }
}

unsafe fn make_kill_job(name: Option<&str>) -> Result<HANDLE, String> {
    let w: Option<Vec<u16>> = name.map(|n| n.encode_utf16().chain(std::iter::once(0)).collect());
    let job = CreateJobObjectW(std::ptr::null(), w.as_ref().map_or(std::ptr::null(), |v| v.as_ptr()));
    if job.is_null() {
        return Err(format!("CreateJobObjectW failed: {}", GetLastError()));
    }
    let mut info: JOBOBJECT_EXTENDED_LIMIT_INFORMATION = std::mem::zeroed();
    // No BREAKAWAY_OK / SILENT_BREAKAWAY_OK: children cannot leave the job.
    info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
    let ok = SetInformationJobObject(
        job,
        JobObjectExtendedLimitInformation,
        &info as *const _ as *const std::ffi::c_void,
        std::mem::size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as u32,
    );
    if ok == 0 {
        return Err(format!("SetInformationJobObject failed: {}", GetLastError()));
    }
    Ok(job)
}

unsafe fn job_active(job: HANDLE) -> Option<u32> {
    let mut info: JOBOBJECT_BASIC_ACCOUNTING_INFORMATION = std::mem::zeroed();
    let ok = QueryInformationJobObject(
        job,
        JobObjectBasicAccountingInformation,
        &mut info as *mut _ as *mut std::ffi::c_void,
        std::mem::size_of::<JOBOBJECT_BASIC_ACCOUNTING_INFORMATION>() as u32,
        std::ptr::null_mut(),
    );
    if ok == 0 { None } else { Some(info.ActiveProcesses) }
}

unsafe fn parent_map() -> BTreeMap<u32, u32> {
    let mut m = BTreeMap::new();
    let snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if snap == INVALID_HANDLE_VALUE {
        return m;
    }
    let mut e: PROCESSENTRY32W = std::mem::zeroed();
    e.dwSize = std::mem::size_of::<PROCESSENTRY32W>() as u32;
    if Process32FirstW(snap, &mut e) != 0 {
        loop {
            m.insert(e.th32ProcessID, e.th32ParentProcessID);
            if Process32NextW(snap, &mut e) == 0 {
                break;
            }
        }
    }
    CloseHandle(snap);
    m
}

pub fn os_version() -> String {
    let mut c = Command::new("cmd");
    c.args(["/c", "ver"]);
    run_capture(c, secs(10)).map(|(_, s)| s.trim().to_string()).unwrap_or_default()
}

pub fn fs_type(p: &Path) -> String {
    let s = p.to_string_lossy();
    let root: String = s.chars().take(3).collect();
    let w = wide(Path::new(&root));
    let mut name = [0u16; 64];
    let ok = unsafe {
        GetVolumeInformationW(
            w.as_ptr(),
            std::ptr::null_mut(),
            0,
            std::ptr::null_mut(),
            std::ptr::null_mut(),
            std::ptr::null_mut(),
            name.as_mut_ptr(),
            name.len() as u32,
        )
    };
    if ok == 0 {
        return "unknown".into();
    }
    let n = name.iter().position(|c| *c == 0).unwrap_or(name.len());
    String::from_utf16_lossy(&name[..n])
}

// ---------- predecessor-domain primitives (used by predecessor.rs) ----------

/// A held kernel lock; released on drop.
pub struct Guard(HANDLE);
impl Drop for Guard {
    fn drop(&mut self) {
        unsafe {
            let mut ov: OVERLAPPED = std::mem::zeroed();
            UnlockFileEx(self.0, 0, 1, 0, &mut ov);
            CloseHandle(self.0);
        }
    }
}

pub fn try_acquire(path: &Path) -> Option<Guard> {
    unsafe {
        let h = open_lock(path, false);
        if h == INVALID_HANDLE_VALUE {
            return None;
        }
        if try_lock(h) {
            Some(Guard(h))
        } else {
            CloseHandle(h);
            None
        }
    }
}

/// An opened handle to the previous holder's process domain (a named job), plus
/// SYNCHRONIZE handles to every member seen so far. A member that has been
/// terminated can still be running its last instructions after the job already
/// reports it gone, so "empty" means: job accounting says 0 AND every member
/// process object is signaled.
pub struct Dom {
    job: HANDLE,
    members: Vec<(u32, HANDLE)>,
}
impl Drop for Dom {
    fn drop(&mut self) {
        unsafe {
            for (_, h) in &self.members {
                CloseHandle(*h);
            }
            CloseHandle(self.job);
        }
    }
}

unsafe fn job_pids(job: HANDLE) -> Vec<u32> {
    let mut buf = vec![0usize; 1024];
    let ok = QueryInformationJobObject(
        job,
        JobObjectBasicProcessIdList,
        buf.as_mut_ptr() as *mut std::ffi::c_void,
        (buf.len() * std::mem::size_of::<usize>()) as u32,
        std::ptr::null_mut(),
    );
    if ok == 0 {
        return vec![];
    }
    let p = buf.as_ptr() as *const JOBOBJECT_BASIC_PROCESS_ID_LIST;
    let n = ((*p).NumberOfProcessIdsInList as usize).min(buf.len() - 1);
    let ids = std::ptr::addr_of!((*p).ProcessIdList) as *const usize;
    (0..n).map(|i| *ids.add(i) as u32).collect()
}

impl Dom {
    /// Opens a SYNCHRONIZE handle to every member not yet tracked.
    fn refresh(&mut self) {
        unsafe {
            for pid in job_pids(self.job) {
                if !self.members.iter().any(|m| m.0 == pid) {
                    let h = OpenProcess(SYNCHRONIZE, 0, pid);
                    if !h.is_null() {
                        self.members.push((pid, h));
                    }
                }
            }
        }
    }
}

/// None when the job no longer exists by name. NOTE: that does not prove its former
/// members are dead: kill-on-close terminates them asynchronously after the name is gone.
pub fn domain_open(id: &str) -> Option<Dom> {
    let w: Vec<u16> = id.encode_utf16().chain(std::iter::once(0)).collect();
    let h = unsafe { OpenJobObjectW(JOB_OBJECT_QUERY | JOB_OBJECT_TERMINATE | SYNCHRONIZE, 0, w.as_ptr()) };
    if h.is_null() {
        return None;
    }
    let mut d = Dom { job: h, members: vec![] };
    d.refresh();
    Some(d)
}

/// Number of members still alive: job accounting or any tracked member process not yet signaled.
pub fn domain_active(d: &mut Dom) -> Option<u32> {
    d.refresh();
    let acct = unsafe { job_active(d.job) }?;
    let pending = d.members.iter().filter(|(_, h)| unsafe { WaitForSingleObject(*h, 0) } == WAIT_TIMEOUT).count() as u32;
    Some(acct.max(pending))
}

pub fn domain_kill(d: &mut Dom) {
    d.refresh();
    unsafe {
        TerminateJobObject(d.job, 1);
    }
}

/// Supervisor-owned job: this process holds the handle, so the job survives the holder's death.
pub struct Sup {
    h: HANDLE,
    name: String,
}
impl Sup {
    pub fn new() -> Result<Sup, String> {
        let name = unique_job_name();
        let h = unsafe { make_kill_job(Some(&name))? };
        Ok(Sup { h, name })
    }
    pub fn name(&self) -> &str {
        &self.name
    }
    /// Whether the pid is currently a member of this job (None: cannot be determined).
    pub fn contains(&self, pid: u32) -> Option<bool> {
        unsafe {
            let hp = OpenProcess(0x1000 /* PROCESS_QUERY_LIMITED_INFORMATION */, 0, pid);
            if hp.is_null() {
                return None;
            }
            let mut r = 0;
            let ok = IsProcessInJob(hp, self.h, &mut r);
            CloseHandle(hp);
            if ok == 0 { None } else { Some(r != 0) }
        }
    }
}
impl Drop for Sup {
    fn drop(&mut self) {
        unsafe {
            CloseHandle(self.h);
        }
    }
}

pub fn fresh_domain_name() -> String {
    unique_job_name()
}

fn filetime(ft: &FILETIME) -> u64 {
    (u64::from(ft.dwHighDateTime) << 32) | u64::from(ft.dwLowDateTime)
}

fn self_creation_time() -> u64 {
    unsafe {
        let mut c: FILETIME = std::mem::zeroed();
        let mut e: FILETIME = std::mem::zeroed();
        let mut k: FILETIME = std::mem::zeroed();
        let mut u: FILETIME = std::mem::zeroed();
        GetProcessTimes(GetCurrentProcess(), &mut c, &mut e, &mut k, &mut u);
        filetime(&c)
    }
}

struct ProcInfo {
    pid: u32,
    ppid: u32,
    created: Option<u64>,
}

unsafe fn snapshot_procs() -> Vec<ProcInfo> {
    let mut v = vec![];
    for (pid, ppid) in parent_map() {
        let h = OpenProcess(0x1000, 0, pid);
        let mut created = None;
        if !h.is_null() {
            let mut c: FILETIME = std::mem::zeroed();
            let mut e: FILETIME = std::mem::zeroed();
            let mut k: FILETIME = std::mem::zeroed();
            let mut u: FILETIME = std::mem::zeroed();
            if GetProcessTimes(h, &mut c, &mut e, &mut k, &mut u) != 0 {
                created = Some(filetime(&c));
            }
            CloseHandle(h);
        }
        v.push(ProcInfo { pid, ppid, created });
    }
    v
}

/// Processes whose parent chain (pid + creation time, so reused pids do not match) reaches the recorded holder.
fn chain_from(procs: &[ProcInfo], holder_pid: u32, holder_created: u64) -> Vec<u32> {
    let mut known: BTreeMap<u32, u64> = BTreeMap::new();
    known.insert(holder_pid, holder_created);
    // If the holder's pid now belongs to a different (newer) process, children created after that
    // process started are its children, not the holder's.
    let reused_since = procs.iter().find(|p| p.pid == holder_pid && p.created.is_some_and(|c| c != holder_created)).and_then(|p| p.created);
    let mut out = vec![];
    loop {
        let mut grew = false;
        for p in procs {
            let Some(created) = p.created else { continue };
            if known.contains_key(&p.pid) {
                continue;
            }
            if let Some(parent_created) = known.get(&p.ppid) {
                let reuse_ok = p.ppid != holder_pid || reused_since.is_none_or(|r| created < r);
                if created >= *parent_created && reuse_ok {
                    known.insert(p.pid, created);
                    out.push(p.pid);
                    grew = true;
                }
            }
        }
        if !grew {
            break;
        }
    }
    if procs.iter().any(|p| p.pid == holder_pid && p.created == Some(holder_created)) {
        out.push(holder_pid);
    }
    out
}

pub struct Fallback {
    pub empty: bool,
    pub chain_at_first_snapshot: Vec<u32>,
}

/// Fallback when the job cannot be opened (every handle owner is gone): wait until no process whose
/// parent chain reaches the recorded holder is still running, bounded by `kill_wait`.
pub fn fallback_wait(holder_pid: u32, holder_created: u64, kill_wait: Duration) -> Option<Fallback> {
    let t0 = Instant::now();
    let mut first: Option<Vec<u32>> = None;
    let mut quiet_rounds = 0;
    loop {
        let procs = unsafe { snapshot_procs() };
        let chain = chain_from(&procs, holder_pid, holder_created);
        if first.is_none() {
            first = Some(chain.clone());
        }
        if chain.iter().any(|p| pid_alive(*p)) {
            quiet_rounds = 0;
        } else {
            quiet_rounds += 1; // two clean snapshots in a row so a last-moment spawn is seen
        }
        if quiet_rounds >= 2 {
            return Some(Fallback { empty: true, chain_at_first_snapshot: first.unwrap_or_default() });
        }
        if t0.elapsed() >= kill_wait {
            return Some(Fallback { empty: false, chain_at_first_snapshot: first.unwrap_or_default() });
        }
        std::thread::sleep(Duration::from_millis(1));
    }
}

/// Human-readable process state for evidence: running, or exited with a code, or unopenable.
pub fn pid_state(pid: u32) -> String {
    unsafe {
        let h = OpenProcess(SYNCHRONIZE | 0x1000, 0, pid);
        if h.is_null() {
            return "unopenable (gone or reused)".into();
        }
        let signaled = WaitForSingleObject(h, 0) != WAIT_TIMEOUT;
        let mut code = 0u32;
        GetExitCodeProcess(h, &mut code);
        CloseHandle(h);
        if signaled { format!("exited code={code}") } else { format!("running (signaled=false, exitcode={code})") }
    }
}

pub fn domain_kind() -> &'static str {
    "job"
}

fn unique_job_name() -> String {
    let nanos = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_nanos()).unwrap_or(0);
    format!("Local\\fgos-probe-{}-{}", std::process::id(), nanos)
}

/// A domain id whose job was already destroyed (the only handle was closed with no members).
pub fn make_stale_domain(_ctx: &Ctx) -> Result<String, String> {
    unsafe {
        let name = unique_job_name();
        let job = make_kill_job(Some(&name))?;
        CloseHandle(job);
        Ok(name)
    }
}

/// Keeps a handle open so the job (and kill-on-close) outlives the test's contender.
pub struct Keep(HANDLE);
impl Drop for Keep {
    fn drop(&mut self) {
        unsafe {
            CloseHandle(self.0);
        }
    }
}

/// A job with a live member whose handle stays open: its process does not die by itself.
pub fn make_stubborn_domain(ctx: &Ctx) -> Result<(String, Vec<u32>, Keep), String> {
    let child = spawn(&mut ctx.role("sleeper", &[&ctx.s("stub.pid")]))?;
    unsafe {
        let name = unique_job_name();
        let job = make_kill_job(Some(&name))?;
        if AssignProcessToJobObject(job, child.as_raw_handle() as HANDLE) == 0 {
            let e = GetLastError();
            CloseHandle(job);
            return Err(format!("AssignProcessToJobObject failed: {e}"));
        }
        Ok((name, vec![child.id()], Keep(job)))
    }
}

fn park() -> ! {
    loop {
        std::thread::sleep(Duration::from_secs(3600));
    }
}

fn self_cmd(role: &str, args: &[&str]) -> Command {
    let mut c = Command::new(std::env::current_exe().unwrap());
    c.arg("--role").arg(role).args(args);
    c.stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null());
    c
}

// ---------- roles ----------

pub fn role(name: &str, a: &[String]) -> bool {
    match name {
        // holder <lockfile> <ready> [parentpid]: lock, then live until killed or the parent dies.
        "holder" => {
            unsafe {
                let h = open_lock(Path::new(&a[0]), false);
                if h == INVALID_HANDLE_VALUE || !try_lock(h) {
                    std::process::exit(3);
                }
            }
            if let Some(pp) = a.get(2).and_then(|s| s.parse::<u32>().ok()) {
                unsafe {
                    let ph = OpenProcess(SYNCHRONIZE, 0, pp);
                    if ph.is_null() {
                        std::process::exit(5); // parent already gone
                    }
                    let ph = ph as usize;
                    std::thread::spawn(move || {
                        WaitForSingleObject(ph as HANDLE, INFINITE);
                        std::process::exit(0);
                    });
                }
            }
            write_atomic(Path::new(&a[1]), &std::process::id().to_string());
            park()
        }
        // mid <lockfile> <ready>: parent that starts a holder watching it.
        "mid" => {
            let me = std::process::id().to_string();
            let _holder = self_cmd("holder", &[&a[0], &a[1], &me]).spawn().expect("spawn holder");
            park()
        }
        // inherit-holder <lockfile> <ready> <childpidfile>: lock via an inheritable handle, start a child, live.
        "inherit-holder" => {
            unsafe {
                let h = open_lock(Path::new(&a[0]), true);
                if h == INVALID_HANDLE_VALUE || !try_lock(h) {
                    std::process::exit(3);
                }
            }
            let child = self_cmd("sleeper", &[&a[2]]).spawn().expect("spawn child");
            wait_until(secs(10), || Path::new(&a[2]).exists());
            write_atomic(Path::new(&a[1]), &format!("{} {}", std::process::id(), child.id()));
            park()
        }
        // jobowner <dir>: owns a KILL_ON_JOB_CLOSE job with a process tree inside; its death closes the job.
        "jobowner" => {
            let dir = &a[0];
            let status;
            unsafe {
                let job = match make_kill_job(None) {
                    Ok(j) => j,
                    Err(e) => {
                        write_atomic(&Path::new(dir).join("owner.ready"), &format!("error {e}"));
                        park()
                    }
                };
                let tree = self_cmd("tree", &[dir]).spawn().expect("spawn tree");
                status = if AssignProcessToJobObject(job, tree.as_raw_handle() as HANDLE) != 0 {
                    "ok".to_string()
                } else {
                    format!("assign-error {}", GetLastError())
                };
                write_atomic(&Path::new(dir).join("go"), "1");
                wait_until(secs(30), || Path::new(dir).join("tree.ready").exists());
                // the raw handle is never closed: it stays open for the owner's lifetime
            }
            write_atomic(&Path::new(dir).join("owner.ready"), &status);
            park()
        }
        // tree <dir>: waits for `go`, then spawns the kinds of children the job must contain.
        "tree" => {
            let dir = Path::new(&a[0]).to_path_buf();
            write_atomic(&dir.join("tree.pid"), &std::process::id().to_string());
            wait_until(secs(30), || dir.join("go").exists());
            let d = a[0].as_str();
            let mut kids = vec![];
            kids.push(self_cmd("sleeper", &[&dir.join("job-a.pid").to_string_lossy()]).spawn());
            kids.push(self_cmd("fanout", &[d, "1", "1"]).spawn());
            let mut det = self_cmd("sleeper", &[&dir.join("job-detached.pid").to_string_lossy()]);
            det.creation_flags(DETACHED_PROCESS);
            kids.push(det.spawn());
            let mut brk = self_cmd("sleeper", &[&dir.join("job-breakaway.pid").to_string_lossy()]);
            brk.creation_flags(CREATE_BREAKAWAY_FROM_JOB);
            let outcome = match brk.spawn() {
                Ok(c) => {
                    kids.push(Ok(c));
                    "allowed".to_string()
                }
                Err(e) => format!("denied os_error={:?}", e.raw_os_error()),
            };
            write_atomic(&dir.join("breakaway.txt"), &outcome);
            write_atomic(&dir.join("tree.ready"), "1");
            park()
        }
        // jobkeeper <jobname> <ready>: second owner of the job, outside the job; keeps the other handle open.
        "jobkeeper" => {
            let job = unsafe { make_kill_job(Some(&a[0])) };
            match job {
                Ok(_) => write_atomic(Path::new(&a[1]), &std::process::id().to_string()),
                Err(e) => write_atomic(Path::new(&a[1]), &format!("error {e}")),
            }
            park()
        }
        // githolder <lockfile> <ready> <repo> <block|noblock>: job + lock, then git inside the job.
        "githolder" => {
            let mut note = "job-ok".to_string();
            unsafe {
                let h = open_lock(Path::new(&a[0]), false);
                if h == INVALID_HANDLE_VALUE || !try_lock(h) {
                    std::process::exit(3);
                }
                // The record is written while the lock is held, before the domain is created.
                // With a 5th argument the supervisor owns the job (opened by name); otherwise the holder owns it.
                let name = a.get(4).cloned().unwrap_or_else(unique_job_name);
                write_predecessor_record(Path::new(&a[0]), "job", &name, Some((std::process::id(), self_creation_time())));
                let job = if a.get(4).is_some() {
                    let w: Vec<u16> = name.encode_utf16().chain(std::iter::once(0)).collect();
                    let j = OpenJobObjectW(JOB_OBJECT_ASSIGN_PROCESS | JOB_OBJECT_QUERY, 0, w.as_ptr());
                    if j.is_null() { Err(format!("OpenJobObjectW failed: {}", GetLastError())) } else { Ok(j) }
                } else {
                    make_kill_job(Some(&name))
                };
                match job {
                    Ok(job) => {
                        if AssignProcessToJobObject(job, GetCurrentProcess()) == 0 {
                            note = format!("job-assign-error-{}", GetLastError());
                        }
                        // the raw handle is never closed: the job lives as long as this process
                    }
                    Err(e) => note = format!("job-error-{}", e.replace(' ', "_")),
                }
            }
            let mut c = Command::new("git");
            c.args(["-C", &a[2], "-c", "gc.auto=1", "commit", "--allow-empty", "-q", "-m", "probe"]);
            c.stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null());
            let mut child = c.spawn().expect("spawn git");
            write_atomic(Path::new(&a[1]), &format!("{} {} {}", std::process::id(), child.id(), note));
            if a[3] == "noblock" {
                let _ = child.wait();
                let dir = Path::new(&a[0]).parent().unwrap().to_path_buf();
                write_atomic(&dir.join("git.done"), "1");
            }
            park()
        }
        _ => false,
    }
}

// ---------- tests ----------

pub fn tests() -> Vec<Def> {
    vec![
        Def {
            name: "lockfileex-released-on-terminate",
            expect: "LockFileEx lock is visible while held and is released when the holder is hard-terminated (TerminateProcess)",
            timeout_s: 60,
            f: lock_terminate,
        },
        Def {
            name: "holder-exits-when-parent-dies",
            expect: "a holder that waits on its parent's handle exits when the parent is terminated, and its lock is then free",
            timeout_s: 60,
            f: holder_parent_death,
        },
        Def {
            name: "lockfileex-inherited-handle-after-parent-death",
            expect: "documents borrow semantics: design assumes a handle inherited by a child does NOT keep the lock after the locking process dies (so a job-scoped holder process is needed)",
            timeout_s: 60,
            f: inherited_handle,
        },
        Def {
            name: "job-kill-on-close-whole-tree",
            expect: "closing the job (owner dies) kills child, grandchild and a DETACHED_PROCESS child; CREATE_BREAKAWAY_FROM_JOB is denied",
            timeout_s: 90,
            f: job_kill_on_close,
        },
        Def {
            name: "job-active-process-count",
            expect: "QueryInformationJobObject ActiveProcesses equals the tree size and reaches 0 after the job is terminated",
            timeout_s: 90,
            f: job_active_count,
        },
        Def {
            name: "toolhelp-ancestry",
            expect: "a Toolhelp snapshot yields the parent chain from a grandchild up to the probe, fast enough for a per-call ancestry check",
            timeout_s: 60,
            f: toolhelp_ancestry,
        },
    ]
}

fn lock_terminate(ctx: &Ctx) -> TestResult {
    let lock = ctx.s("lock");
    let mut h = spawn(&mut ctx.role("holder", &[&lock, &ctx.s("ready")]))?;
    if wait_until(secs(10), || ctx.p("ready").exists()).is_none() {
        return Err("holder never took the lock".into());
    }
    let held = !lock_free(&ctx.p("lock"));
    h.kill().map_err(|e| e.to_string())?;
    let _ = h.wait();
    let t = Instant::now();
    let rel = wait_until(secs(5), || lock_free(&ctx.p("lock")));
    let data = json!({"heldWhileHolderAlive": held, "releaseMsAfterTerminate": rel.map(|_| ms(t.elapsed()))});
    if held && rel.is_some() {
        pass("lock visible while held, released on TerminateProcess", data)
    } else {
        fail("lock not held while alive, or not released after TerminateProcess", data)
    }
}

fn holder_parent_death(ctx: &Ctx) -> TestResult {
    let lock = ctx.s("lock");
    let mut mid = spawn(&mut ctx.role("mid", &[&lock, &ctx.s("ready")]))?;
    if wait_until(secs(10), || ctx.p("ready").exists()).is_none() {
        return Err("holder never took the lock".into());
    }
    let holder = read_pid(&ctx.p("ready")).ok_or("no holder pid")?;
    let held = !lock_free(&ctx.p("lock"));
    let t = Instant::now();
    mid.kill().map_err(|e| e.to_string())?;
    let _ = mid.wait();
    let dead = wait_until(secs(10), || !pid_alive(holder)).map(|_| ms(t.elapsed()));
    let rel = wait_until(secs(10), || lock_free(&ctx.p("lock"))).map(|_| ms(t.elapsed()));
    let data = json!({"heldWhileAlive": held, "holderExitMsAfterParentTerminated": dead, "lockFreeMsAfterParentTerminated": rel});
    if held && dead.is_some() && rel.is_some() {
        pass("holder exited with its parent and released the lock", data)
    } else {
        fail("holder did not exit when its parent died", data)
    }
}

fn inherited_handle(ctx: &Ctx) -> TestResult {
    let lock = ctx.s("lock");
    let mut h = spawn(&mut ctx.role("inherit-holder", &[&lock, &ctx.s("ready"), &ctx.s("child.pid")]))?;
    if wait_until(secs(10), || ctx.p("ready").exists()).is_none() {
        return Err("holder never became ready".into());
    }
    let child = read_pid(&ctx.p("child.pid")).ok_or("no child pid")?;
    let held = !lock_free(&ctx.p("lock"));
    h.kill().map_err(|e| e.to_string())?;
    let _ = h.wait();
    let t = Instant::now();
    let rel_after_parent = wait_until(secs(3), || lock_free(&ctx.p("lock"))).map(|_| ms(t.elapsed()));
    let held_after_parent = rel_after_parent.is_none();
    let child_alive = pid_alive(child);
    kill_pid(child);
    let rel_after_child = wait_until(secs(5), || lock_free(&ctx.p("lock"))).is_some();
    let data = json!({
        "heldBeforeKill": held,
        "childAliveAfterParentTerminated": child_alive,
        "lockStillHeldAfterParentDied": held_after_parent,
        "lockFreeMsAfterParentDied": rel_after_parent,
        "lockFreeAfterChildKilled": rel_after_child,
        "semantics": if held_after_parent { "inherited handle keeps the lock (shares the lock like a POSIX description)" } else { "lock is owned by the locking process; an inherited handle does not keep it" },
    });
    if !held || !child_alive || !rel_after_child {
        return fail("precondition failed (lock not held, child dead early, or lock never freed)", data);
    }
    if held_after_parent {
        fail("REFUTES the design assumption: inherited handle keeps the lock after the parent died", data)
    } else {
        pass("confirms: lock dies with the locking process even if a child holds an inherited handle", data)
    }
}

fn job_kill_on_close(ctx: &Ctx) -> TestResult {
    let dir = ctx.dir.to_string_lossy().into_owned();
    let mut owner = spawn(&mut ctx.role("jobowner", &[&dir]))?;
    if wait_until(secs(30), || ctx.p("owner.ready").exists()).is_none() {
        return Err("job owner never became ready".into());
    }
    let owner_status = std::fs::read_to_string(ctx.p("owner.ready")).unwrap_or_default();
    if owner_status != "ok" {
        return Err(format!("job owner: {owner_status}"));
    }
    let need = |n: &str| ctx.p(n).exists();
    if wait_until(secs(20), || need("tree.pid") && need("job-a.pid") && need("job-detached.pid") && pid_files(&ctx.dir, "fan-").len() >= 2)
        .is_none()
    {
        return Err("process tree did not come up".into());
    }
    let mut pids: Vec<u32> = ["tree.pid", "job-a.pid", "job-detached.pid"].iter().filter_map(|n| read_pid(&ctx.p(n))).collect();
    pids.extend(pid_files(&ctx.dir, "fan-"));
    let all_alive_before = pids.iter().all(|p| pid_alive(*p));
    let breakaway = std::fs::read_to_string(ctx.p("breakaway.txt")).unwrap_or_default();
    let t = Instant::now();
    owner.kill().map_err(|e| e.to_string())?;
    let _ = owner.wait();
    let dead = wait_until(secs(10), || pids.iter().all(|p| !pid_alive(*p)));
    let survivors: Vec<u32> = pids.iter().copied().filter(|p| pid_alive(*p)).collect();
    let data = json!({
        "processesInJob": pids.len(),
        "allAliveBeforeOwnerDeath": all_alive_before,
        "allDeadMsAfterOwnerDeath": dead.map(|_| ms(t.elapsed())),
        "survivors": survivors,
        "breakawayAttempt": breakaway,
    });
    if !all_alive_before {
        return fail("tree members were not all alive before the owner died", data);
    }
    if dead.is_none() {
        return fail("processes survived the job owner's death", data);
    }
    if breakaway.starts_with("allowed") {
        return fail("REFUTES the design: CREATE_BREAKAWAY_FROM_JOB was allowed", data);
    }
    pass("job close killed child, grandchild and the detached child; breakaway denied", data)
}

fn job_active_count(ctx: &Ctx) -> TestResult {
    let dir = ctx.dir.to_string_lossy().into_owned();
    unsafe {
        let job = make_kill_job(None)?;
        let mut tree = spawn(&mut ctx.role("tree", &[&dir]))?;
        if AssignProcessToJobObject(job, tree.as_raw_handle() as HANDLE) == 0 {
            let e = GetLastError();
            CloseHandle(job);
            return Err(format!("AssignProcessToJobObject failed: {e}"));
        }
        write_atomic(&ctx.p("go"), "1");
        if wait_until(secs(20), || ctx.p("tree.ready").exists() && pid_files(&ctx.dir, "fan-").len() >= 2).is_none() {
            CloseHandle(job);
            return Err("process tree did not come up".into());
        }
        std::thread::sleep(Duration::from_millis(300));
        let expected = 5; // tree + sleeper + fanout root + fanout child + detached
        let active_before = job_active(job);
        let t = Instant::now();
        TerminateJobObject(job, 1);
        let zero = wait_until(secs(10), || job_active(job) == Some(0));
        let _ = tree.wait();
        let data = json!({
            "expectedActive": expected,
            "activeProcessesBefore": active_before,
            "activeZeroMsAfterTerminateJob": zero.map(|_| ms(t.elapsed())),
            "breakawayAttempt": std::fs::read_to_string(ctx.p("breakaway.txt")).unwrap_or_default(),
        });
        CloseHandle(job);
        if active_before != Some(expected) {
            return fail("ActiveProcesses did not match the tree size", data);
        }
        if zero.is_none() {
            return fail("ActiveProcesses never reached 0 after TerminateJobObject", data);
        }
        pass("ActiveProcesses matched the tree and reached 0", data)
    }
}

fn toolhelp_ancestry(ctx: &Ctx) -> TestResult {
    let mut root = spawn(&mut ctx.role("fanout", &[&ctx.dir.to_string_lossy(), "2", "1"]))?;
    if wait_until(secs(15), || pid_files(&ctx.dir, "fan-").len() >= 3).is_none() {
        return Err("chain did not come up".into());
    }
    let pids = pid_files(&ctx.dir, "fan-");
    let t = Instant::now();
    let map = unsafe { parent_map() };
    let snap_ms = ms(t.elapsed());
    let deepest = pids
        .iter()
        .copied()
        .find(|p| !pids.iter().any(|q| map.get(q) == Some(p)))
        .ok_or("no leaf found")?;
    let mut chain = vec![];
    let mut cur = deepest;
    for _ in 0..16 {
        match map.get(&cur) {
            Some(pp) if *pp != 0 => {
                chain.push(*pp);
                cur = *pp;
            }
            _ => break,
        }
    }
    let _ = root.kill();
    let _ = root.wait();
    let data = json!({"snapshotMs": snap_ms, "processesInSnapshot": map.len(), "leafPid": deepest, "ancestorChain": chain, "probePid": std::process::id()});
    if chain.contains(&root.id()) && chain.contains(&std::process::id()) {
        pass("ancestry chain from grandchild reaches the probe", data)
    } else {
        fail("ancestry chain incomplete", data)
    }
}
