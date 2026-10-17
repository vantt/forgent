//! The `windows-job` domain: a named kill-on-close Job Object that a lock
//! holder creates while it holds the lock, judged by two views.
//!
//! * The **job view** (release rule, keeper) asks only the job: accounting is
//!   zero and every member ever named by the job's id list or the in-job scan
//!   is signaled.
//! * The **contender view** (`admit`, after the kernel lock is held) also
//!   walks the recorded holder's process tree when the holder is dead, fails
//!   closed on a process it cannot open, and falls back to the tree alone when
//!   the job cannot be opened.
//!
//! The decisions ([`decide`], [`tree_from`], [`read_id_list`], the job-name
//! format) are pure and compile everywhere so one test set drives them on
//! every platform; everything that touches the OS is Windows only.

use std::collections::{BTreeMap, BTreeSet};

use crate::DomainState;

/// Quiet polls in a row the tree-only fallback needs before it says empty, so
/// a process spawned in the last instant before a snapshot is seen.
pub const FALLBACK_QUIET_ROUNDS: u32 = 2;

/// Slots of a `usize` buffer taken by the header of a job process-id list
/// (`NumberOfAssignedProcesses` and `NumberOfProcessIdsInList`, two `u32`).
pub const LIST_HEADER_SLOTS: usize = 8 / std::mem::size_of::<usize>();

/// One process the domain has named, and whether its process object is signaled.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct MemberState {
    /// The process id.
    pub pid: u32,
    /// The process object is signaled: the process has exited.
    pub signaled: bool,
}

/// The empty rule. `acct` is the job's `ActiveProcesses` (`None`: it could not
/// be read), `members` is every process ever named, `unopenable` is every
/// named pid that is present but cannot be opened, `quiet_rounds` is the
/// count of consecutive quiet polls, `job_open` says whether the job handle
/// is held.
///
/// Empty needs every member signaled and nothing unopenable. With the job it
/// also needs accounting at zero; without it (tree fallback) it needs
/// [`FALLBACK_QUIET_ROUNDS`] quiet polls in a row.
pub fn decide(acct: Option<u32>, members: &[MemberState], unopenable: &[u32], quiet_rounds: u32, job_open: bool) -> DomainState {
    if !unopenable.is_empty() || members.iter().any(|m| !m.signaled) {
        return DomainState::NotEmpty;
    }
    let settled = if job_open { acct == Some(0) } else { quiet_rounds >= FALLBACK_QUIET_ROUNDS };
    if settled {
        DomainState::Empty
    } else {
        DomainState::NotEmpty
    }
}

/// One row of a process snapshot.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ProcEntry {
    /// The process id.
    pub pid: u32,
    /// Its parent's pid as the snapshot reports it.
    pub ppid: u32,
    /// Creation FILETIME; `None` when it could not be read.
    pub created: Option<u64>,
}

/// The processes of the recorded holder's tree.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct Tree {
    /// `(pid, creation FILETIME)` of every tree process: reached by the parent
    /// chain from the holder, created at or after `declared_at`, never the
    /// holder or the keeper.
    pub members: Vec<(u32, u64)>,
    /// Processes whose parent is a tree node but whose creation time cannot
    /// be read: they might be members, so they count as present.
    pub unopenable: Vec<u32>,
}

/// The tree of `holder` (`pid`, creation time) in `procs`.
///
/// A process is a child of a tree node only if it was created no earlier than
/// that node. If the holder's pid now belongs to a newer process, children
/// created after that process started are its children, not the holder's. A
/// process created before `declared_at` is not part of the domain, and a
/// domain member's whole parent chain was created after the declare, so its
/// subtree is skipped too. The keeper is never a member and never walked.
pub fn tree_from(procs: &[ProcEntry], holder: (u32, u64), keeper: Option<(u32, u64)>, declared_at: u64) -> Tree {
    let reused_since = procs.iter().find(|p| p.pid == holder.0 && p.created.is_some_and(|c| c != holder.1)).and_then(|p| p.created);
    let mut known: BTreeMap<u32, u64> = BTreeMap::new();
    known.insert(holder.0, holder.1);
    let mut settled: BTreeSet<u32> = BTreeSet::new();
    let mut tree = Tree::default();
    loop {
        let mut grew = false;
        for p in procs {
            if p.pid == 0 || known.contains_key(&p.pid) || settled.contains(&p.pid) {
                continue;
            }
            let Some(parent_created) = known.get(&p.ppid).copied() else { continue };
            let Some(created) = p.created else {
                tree.unopenable.push(p.pid);
                settled.insert(p.pid);
                continue;
            };
            let holder_pid_reused = p.ppid == holder.0 && reused_since.is_some_and(|r| created >= r);
            if created < parent_created || holder_pid_reused {
                continue;
            }
            settled.insert(p.pid);
            if keeper == Some((p.pid, created)) || created < declared_at {
                continue;
            }
            known.insert(p.pid, created);
            tree.members.push((p.pid, created));
            grew = true;
        }
        if !grew {
            return tree;
        }
    }
}

/// What one query of a job's process-id list answered.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ListRead {
    /// The buffer held the whole list: `in_list` ids follow the header.
    Filled {
        /// Number of ids the buffer carries.
        in_list: usize,
    },
    /// The buffer was too small: `assigned` processes are in the job.
    MoreData {
        /// Number of processes the job holds right now.
        assigned: usize,
    },
    /// The query failed.
    Failed,
}

/// Read a job's process-id list, starting with a buffer of `initial_slots`
/// `usize` slots and growing it while the answer is "more data". `query`
/// fills the buffer it is given (header first, ids from [`LIST_HEADER_SLOTS`]).
pub fn read_id_list(initial_slots: usize, mut query: impl FnMut(&mut [usize]) -> ListRead) -> Option<Vec<u32>> {
    let mut slots = initial_slots.max(LIST_HEADER_SLOTS + 1);
    for _ in 0..16 {
        let mut buf = vec![0usize; slots];
        match query(&mut buf) {
            ListRead::Filled { in_list } => {
                let end = (LIST_HEADER_SLOTS + in_list).min(buf.len());
                return Some(buf[LIST_HEADER_SLOTS..end].iter().map(|id| *id as u32).collect());
            }
            ListRead::MoreData { assigned } => slots = (LIST_HEADER_SLOTS + assigned).max(slots * 2),
            ListRead::Failed => return None,
        }
    }
    None
}

/// The lock name with everything outside `[A-Za-z0-9._-]` mapped to `_`.
pub fn sanitize_lock_name(lock_name: &str) -> String {
    lock_name.chars().map(|c| if c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '-') { c } else { '_' }).collect()
}

/// `Local\<prefix>-<sanitized lock name>-<pid>-<creation>-<counter>`.
pub fn format_job_name(prefix: &str, lock_name: &str, pid: u32, creation: u64, counter: u32) -> String {
    format!("Local\\{prefix}-{}-{pid}-{creation}-{counter}", sanitize_lock_name(lock_name))
}

#[cfg(windows)]
pub use os::*;

#[cfg(windows)]
mod os {
    use std::collections::BTreeMap;
    use std::ffi::c_void;
    use std::io;
    use std::os::windows::io::AsRawHandle;
    use std::process::Child;
    use std::sync::atomic::{AtomicU32, Ordering};

    use windows_sys::Win32::Foundation::{CloseHandle, GetLastError, ERROR_INVALID_PARAMETER, ERROR_MORE_DATA, FILETIME, HANDLE, INVALID_HANDLE_VALUE, WAIT_OBJECT_0};
    use windows_sys::Win32::Storage::FileSystem::SYNCHRONIZE;
    use windows_sys::Win32::System::Diagnostics::ToolHelp::{
        CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, Thread32First, Thread32Next, PROCESSENTRY32W, TH32CS_SNAPPROCESS, TH32CS_SNAPTHREAD, THREADENTRY32,
    };
    use windows_sys::Win32::System::JobObjects::{
        AssignProcessToJobObject, CreateJobObjectW, IsProcessInJob, JobObjectBasicAccountingInformation, JobObjectBasicProcessIdList, JobObjectExtendedLimitInformation,
        OpenJobObjectW, QueryInformationJobObject, SetInformationJobObject, TerminateJobObject, JOBOBJECT_BASIC_ACCOUNTING_INFORMATION, JOBOBJECT_EXTENDED_LIMIT_INFORMATION,
        JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
    };
    use windows_sys::Win32::System::RemoteDesktop::ProcessIdToSessionId;
    use windows_sys::Win32::System::Threading::{GetCurrentProcess, GetCurrentProcessId, GetProcessTimes, OpenProcess, OpenThread, ResumeThread, TerminateProcess, WaitForSingleObject, PROCESS_QUERY_LIMITED_INFORMATION, THREAD_SUSPEND_RESUME};

    use super::{decide, format_job_name, read_id_list, tree_from, ListRead, MemberState, ProcEntry};
    use crate::control::{signal_by_identity, Signal};
    use crate::facts::{Observed, ProcTuple};
    use crate::platform;
    use crate::{signal_settled, DomainState, KillOutcome, ProcId, WindowsJob};

    const JOB_OBJECT_ASSIGN_PROCESS_RIGHT: u32 = 0x0001;
    const JOB_OBJECT_QUERY_RIGHT: u32 = 0x0004;
    const JOB_OBJECT_TERMINATE_RIGHT: u32 = 0x0008;
    /// Slots of the id-list buffer a poll starts with; it grows on demand.
    const LIST_SLOTS: usize = 256;
    /// Why a record from another Windows session is never judged empty.
    pub const OTHER_SESSION_REASON: &str = "predecessor-other-session";

    #[link(name = "kernel32")]
    extern "system" {
        fn GetSystemTimeAsFileTime(out: *mut FILETIME);
    }

    /// An owned kernel handle, closed on drop.
    struct Owned(HANDLE);

    // SAFETY: a kernel handle names an object, not thread-local state.
    unsafe impl Send for Owned {}

    impl Drop for Owned {
        fn drop(&mut self) {
            // SAFETY: closing the handle this struct owns.
            unsafe {
                CloseHandle(self.0);
            }
        }
    }

    fn filetime_u64(ft: &FILETIME) -> u64 {
        (u64::from(ft.dwHighDateTime) << 32) | u64::from(ft.dwLowDateTime)
    }

    /// The current time as a FILETIME, from the same coarse clock the kernel
    /// stamps process creation with, so a process created after this call has a
    /// creation time that is not smaller. Use it for a record's `declaredAt`.
    pub fn filetime_now() -> u64 {
        // SAFETY: one valid out-pointer.
        unsafe {
            let mut ft: FILETIME = std::mem::zeroed();
            GetSystemTimeAsFileTime(&mut ft);
            filetime_u64(&ft)
        }
    }

    fn creation_time(handle: HANDLE) -> Option<u64> {
        // SAFETY: four valid out-pointers for a handle opened with query access.
        unsafe {
            let (mut c, mut e, mut k, mut u): (FILETIME, FILETIME, FILETIME, FILETIME) = std::mem::zeroed();
            (GetProcessTimes(handle, &mut c, &mut e, &mut k, &mut u) != 0).then(|| filetime_u64(&c))
        }
    }

    fn signaled(handle: HANDLE) -> bool {
        // SAFETY: a zero wait only polls the state of an open handle.
        unsafe { WaitForSingleObject(handle, 0) == WAIT_OBJECT_0 }
    }

    /// Open `pid` for waiting; the creation time rides along when it is readable.
    /// `Err` carries the Win32 error: `ERROR_INVALID_PARAMETER` means gone.
    fn open_for_wait(pid: u32) -> Result<(Owned, Option<u64>), i32> {
        for access in [SYNCHRONIZE | PROCESS_QUERY_LIMITED_INFORMATION, SYNCHRONIZE] {
            // SAFETY: OpenProcess takes plain values and returns a handle or null.
            let handle = unsafe { OpenProcess(access, 0, pid) };
            if !handle.is_null() {
                let handle = Owned(handle);
                let created = (access != SYNCHRONIZE).then(|| creation_time(handle.0)).flatten();
                return Ok((handle, created));
            }
            // SAFETY: reads the calling thread's last error.
            let err = unsafe { GetLastError() } as i32;
            if err == ERROR_INVALID_PARAMETER as i32 {
                return Err(err);
            }
            if access == SYNCHRONIZE {
                return Err(err);
            }
        }
        unreachable!("the loop returns on its last access")
    }

    fn wide(name: &str) -> Vec<u16> {
        name.encode_utf16().chain(std::iter::once(0)).collect()
    }

    // ---------- job helpers ----------

    /// A Job Object handle.
    pub struct Job(Owned);

    impl Job {
        /// End every process in the job.
        pub fn terminate(&self) -> io::Result<()> {
            // SAFETY: terminating the job this handle names.
            if unsafe { TerminateJobObject(self.0 .0, 1) } == 0 {
                return Err(io::Error::last_os_error());
            }
            Ok(())
        }

        /// Whether `pid` is a member now (`None`: the process cannot be opened).
        pub fn contains(&self, pid: u32) -> Option<bool> {
            in_job(self.0 .0, pid)
        }

        /// The job's `ActiveProcesses` (`None`: unreadable).
        pub fn active_processes(&self) -> Option<u32> {
            job_active(self.0 .0)
        }
    }

    /// A named job that ends its members when its last handle closes. No
    /// breakaway flag is set, so a member cannot leave the job.
    pub fn create_kill_job(name: &str) -> io::Result<Job> {
        let wide = wide(name);
        // SAFETY: a NUL-terminated name and no security attributes.
        let handle = unsafe { CreateJobObjectW(std::ptr::null(), wide.as_ptr()) };
        if handle.is_null() {
            return Err(io::Error::last_os_error());
        }
        let job = Job(Owned(handle));
        // SAFETY: a zeroed limit block of the size the class expects.
        let rc = unsafe {
            let mut info: JOBOBJECT_EXTENDED_LIMIT_INFORMATION = std::mem::zeroed();
            info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
            SetInformationJobObject(handle, JobObjectExtendedLimitInformation, &info as *const _ as *const c_void, std::mem::size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as u32)
        };
        if rc == 0 {
            return Err(io::Error::last_os_error());
        }
        Ok(job)
    }

    /// Open an existing job by name, to query it and to end it.
    pub fn open_job(name: &str) -> io::Result<Job> {
        let wide = wide(name);
        // SAFETY: a NUL-terminated name.
        let handle = unsafe { OpenJobObjectW(JOB_OBJECT_QUERY_RIGHT | JOB_OBJECT_TERMINATE_RIGHT | JOB_OBJECT_ASSIGN_PROCESS_RIGHT | SYNCHRONIZE, 0, wide.as_ptr()) };
        if handle.is_null() {
            return Err(io::Error::last_os_error());
        }
        Ok(Job(Owned(handle)))
    }

    /// A job name no other call in this process or any other repeats:
    /// `Local\<prefix>-<sanitized lock name>-<pid>-<creation>-<counter>`.
    pub fn job_name(prefix: &str, lock_name: &str) -> String {
        static COUNTER: AtomicU32 = AtomicU32::new(0);
        let creation = {
            // SAFETY: the pseudo handle of this process is always valid.
            creation_time(unsafe { GetCurrentProcess() }).unwrap_or(0)
        };
        format_job_name(prefix, lock_name, std::process::id(), creation, COUNTER.fetch_add(1, Ordering::Relaxed))
    }

    /// The thread id of the only thread of `pid`, a process created suspended.
    fn only_thread_of(pid: u32) -> io::Result<u32> {
        // SAFETY: a thread snapshot and a sized entry.
        unsafe {
            let snap = CreateToolhelp32Snapshot(TH32CS_SNAPTHREAD, 0);
            if snap == INVALID_HANDLE_VALUE {
                return Err(io::Error::last_os_error());
            }
            let snap = Owned(snap);
            let mut entry: THREADENTRY32 = std::mem::zeroed();
            entry.dwSize = std::mem::size_of::<THREADENTRY32>() as u32;
            let mut more = Thread32First(snap.0, &mut entry) != 0;
            while more {
                if entry.th32OwnerProcessID == pid {
                    return Ok(entry.th32ThreadID);
                }
                more = Thread32Next(snap.0, &mut entry) != 0;
            }
        }
        Err(io::Error::new(io::ErrorKind::NotFound, format!("no thread of pid {pid} in the snapshot")))
    }

    /// Put a child created with `CREATE_SUSPENDED` into `job`, then resume its
    /// main thread, so it runs its first instruction inside the job. On any
    /// failure the suspended child is terminated and the error returned.
    pub fn assign_and_resume(job: &Job, child: &Child) -> io::Result<()> {
        let process = child.as_raw_handle() as HANDLE;
        let thread = match only_thread_of(child.id()) {
            Ok(thread_id) => {
                // SAFETY: opening a thread for suspend/resume rights, then using the handle it returns.
                let thread = unsafe { OpenThread(THREAD_SUSPEND_RESUME, 0, thread_id) };
                if thread.is_null() {
                    Err(io::Error::last_os_error())
                } else {
                    Ok(Owned(thread))
                }
            }
            Err(err) => Err(err),
        };
        match thread {
            Ok(thread) => assign_and_resume_handles(job, process, thread.0),
            Err(err) => {
                // SAFETY: terminating the child this handle names.
                unsafe {
                    TerminateProcess(process, 1);
                }
                Err(err)
            }
        }
    }

    /// [`assign_and_resume`] for a process whose process and main-thread
    /// handles the caller already holds (the thread needs suspend/resume rights,
    /// as the handle `CreateProcessW` returns has).
    pub fn assign_and_resume_handles(job: &Job, process: HANDLE, thread: HANDLE) -> io::Result<()> {
        let result = (|| {
            // SAFETY: both handles are open.
            if unsafe { AssignProcessToJobObject(job.0 .0, process) } == 0 {
                return Err(io::Error::last_os_error());
            }
            // SAFETY: the thread handle is open; u32::MAX is the failure value.
            if unsafe { ResumeThread(thread) } == u32::MAX {
                return Err(io::Error::last_os_error());
            }
            Ok(())
        })();
        if result.is_err() {
            // SAFETY: terminating the process this handle names.
            unsafe {
                TerminateProcess(process, 1);
            }
        }
        result
    }

    // ---------- reads ----------

    fn job_active(job: HANDLE) -> Option<u32> {
        // SAFETY: a zeroed accounting block of the size the class expects.
        unsafe {
            let mut info: JOBOBJECT_BASIC_ACCOUNTING_INFORMATION = std::mem::zeroed();
            let ok = QueryInformationJobObject(job, JobObjectBasicAccountingInformation, &mut info as *mut _ as *mut c_void, std::mem::size_of::<JOBOBJECT_BASIC_ACCOUNTING_INFORMATION>() as u32, std::ptr::null_mut());
            (ok != 0).then_some(info.ActiveProcesses)
        }
    }

    fn job_ids(job: HANDLE, slots: usize) -> Option<Vec<u32>> {
        read_id_list(slots, |buf| {
            // SAFETY: the buffer is `buf.len()` usize slots, header first.
            let ok = unsafe { QueryInformationJobObject(job, JobObjectBasicProcessIdList, buf.as_mut_ptr() as *mut c_void, std::mem::size_of_val(buf) as u32, std::ptr::null_mut()) };
            if ok != 0 {
                return ListRead::Filled { in_list: header_in_list(buf) };
            }
            // SAFETY: reads the calling thread's last error.
            if unsafe { GetLastError() } == ERROR_MORE_DATA {
                return ListRead::MoreData { assigned: header_assigned(buf) };
            }
            ListRead::Failed
        })
    }

    /// `NumberOfProcessIdsInList`, the second `u32` of the header.
    fn header_in_list(buf: &[usize]) -> usize {
        // SAFETY: the buffer is at least one header long and aligned for `u32`.
        unsafe { *(buf.as_ptr() as *const u32).add(1) as usize }
    }

    /// `NumberOfAssignedProcesses`, the first `u32` of the header.
    fn header_assigned(buf: &[usize]) -> usize {
        // SAFETY: the buffer is at least one header long and aligned for `u32`.
        unsafe { *(buf.as_ptr() as *const u32) as usize }
    }

    fn in_job(job: HANDLE, pid: u32) -> Option<bool> {
        // SAFETY: a short-lived query handle; IsProcessInJob writes one BOOL.
        unsafe {
            let process = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
            if process.is_null() {
                return None;
            }
            let process = Owned(process);
            let mut result = 0;
            (IsProcessInJob(process.0, job, &mut result) != 0).then_some(result != 0)
        }
    }

    /// One Toolhelp process with the handle that read it.
    struct Snap {
        entry: ProcEntry,
        handle: Option<Owned>,
        in_job: bool,
    }

    fn snapshot(job: Option<HANDLE>) -> Vec<Snap> {
        let mut rows = vec![];
        // SAFETY: a process snapshot and a sized entry.
        unsafe {
            let snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
            if snap == INVALID_HANDLE_VALUE {
                return rows;
            }
            let snap = Owned(snap);
            let mut entry: PROCESSENTRY32W = std::mem::zeroed();
            entry.dwSize = std::mem::size_of::<PROCESSENTRY32W>() as u32;
            let mut more = Process32FirstW(snap.0, &mut entry) != 0;
            while more {
                rows.push(read_row(entry.th32ProcessID, entry.th32ParentProcessID, job));
                more = Process32NextW(snap.0, &mut entry) != 0;
            }
        }
        rows
    }

    fn read_row(pid: u32, ppid: u32, job: Option<HANDLE>) -> Snap {
        // SAFETY: OpenProcess takes plain values and returns a handle or null.
        let raw = unsafe { OpenProcess(SYNCHRONIZE | PROCESS_QUERY_LIMITED_INFORMATION, 0, pid) };
        if raw.is_null() {
            return Snap { entry: ProcEntry { pid, ppid, created: None }, handle: None, in_job: false };
        }
        let handle = Owned(raw);
        let in_job = job.is_some_and(|job| {
            let mut result = 0;
            // SAFETY: both handles are open; one BOOL out.
            unsafe { IsProcessInJob(handle.0, job, &mut result) != 0 && result != 0 }
        });
        Snap { entry: ProcEntry { pid, ppid, created: creation_time(handle.0) }, handle: Some(handle), in_job }
    }

    // ---------- the shared poller ----------

    /// A process seen as a domain member, held by a `SYNCHRONIZE` handle so its
    /// pid cannot be reused while the view lives.
    struct Tracked {
        handle: Owned,
        created: Option<u64>,
    }

    #[derive(Default, Clone, Copy)]
    struct Named {
        in_list: bool,
        in_scan: bool,
        in_tree: bool,
    }

    struct Poll {
        acct: Option<u32>,
        members: Vec<MemberState>,
        unopenable: Vec<u32>,
        /// Live tree members that are not in the job, with their creation time.
        outside_job: Vec<(u32, u64)>,
    }

    #[derive(Default)]
    struct Core {
        job: Option<Owned>,
        /// Why the last open of the job failed. Only "no such job" means the
        /// job is gone; any other failure leaves it unjudged.
        open_error: Option<i32>,
        tracked: BTreeMap<u32, Tracked>,
        /// Every pid any poll named, with the sources that named it, kept for
        /// the whole life of the view.
        seen: BTreeMap<u32, Named>,
    }

    impl Core {
        fn try_open(&mut self, name: &str) {
            if self.job.is_none() {
                match open_job(name) {
                    Ok(job) => {
                        self.job = Some(Job::into_owned(job));
                        self.open_error = None;
                    }
                    Err(err) => self.open_error = err.raw_os_error(),
                }
            }
        }

        /// The job does not exist any more (as opposed to existing but not
        /// openable, which must not read as empty).
        fn job_gone(&self) -> bool {
            const ERROR_FILE_NOT_FOUND: i32 = 2;
            self.job.is_none() && self.open_error == Some(ERROR_FILE_NOT_FOUND)
        }

        /// One re-read of the whole union. `scan` adds every in-job process of a
        /// snapshot; `tree` adds the recorded holder's tree.
        fn poll(&mut self, scan: bool, tree: Option<&WindowsJob>) -> Poll {
            let job = self.job.as_ref().map(|j| j.0);
            let mut acct = job.and_then(job_active);
            let mut named: BTreeMap<u32, Named> = BTreeMap::new();
            if let Some(job) = job {
                match job_ids(job, LIST_SLOTS) {
                    Some(ids) => ids.into_iter().for_each(|pid| named.entry(pid).or_default().in_list = true),
                    // A list that cannot be read cannot prove the job empty.
                    None => acct = None,
                }
            }
            let mut snap = if (scan && job.is_some()) || tree.is_some() { snapshot(job.filter(|_| scan)) } else { vec![] };
            if scan {
                snap.iter().filter(|s| s.in_job).for_each(|s| named.entry(s.entry.pid).or_default().in_scan = true);
            }
            let mut unopenable: Vec<u32> = vec![];
            if let Some(record) = tree {
                let procs: Vec<ProcEntry> = snap.iter().map(|s| s.entry).collect();
                let holder = record.holder.start_time.parse::<u64>().map(|created| (record.holder.pid.0, created));
                let keeper = record.keeper.as_ref().and_then(|k| k.start_time.parse::<u64>().ok().map(|created| (k.pid.0, created)));
                match holder {
                    Ok(holder) => {
                        let found = tree_from(&procs, holder, keeper, record.declared_at);
                        found.members.iter().for_each(|(pid, _)| named.entry(*pid).or_default().in_tree = true);
                        unopenable.extend(found.unopenable);
                    }
                    // A holder tuple that cannot be read gives no tree to judge by.
                    Err(_) => unopenable.push(record.holder.pid.0),
                }
            }
            for (pid, by) in &named {
                let seen = self.seen.entry(*pid).or_default();
                seen.in_list |= by.in_list;
                seen.in_scan |= by.in_scan;
                seen.in_tree |= by.in_tree;
            }
            for pid in named.keys().copied().collect::<Vec<_>>() {
                if self.tracked.contains_key(&pid) {
                    continue;
                }
                let snapped = snap.iter_mut().find(|s| s.entry.pid == pid);
                let in_snapshot = snapped.is_some();
                let opened = match snapped.and_then(|s| s.handle.take().map(|h| (h, s.entry.created))) {
                    Some(pair) => Ok(pair),
                    None => open_for_wait(pid),
                };
                match opened {
                    Ok((handle, created)) => {
                        self.tracked.insert(pid, Tracked { handle, created });
                    }
                    Err(code) if code == ERROR_INVALID_PARAMETER as i32 => {}
                    Err(_) if in_snapshot || named[&pid].in_list => unopenable.push(pid),
                    Err(_) => {}
                }
            }
            let members: Vec<MemberState> = self.tracked.iter().map(|(pid, t)| MemberState { pid: *pid, signaled: signaled(t.handle.0) }).collect();
            let outside_job = named
                .iter()
                .filter(|(_, n)| n.in_tree && !n.in_list && !n.in_scan)
                .filter_map(|(pid, _)| self.tracked.get(pid).filter(|t| !signaled(t.handle.0)).and_then(|t| t.created.map(|c| (*pid, c))))
                .collect();
            Poll { acct, members, unopenable, outside_job }
        }
    }

    impl Job {
        fn into_owned(self) -> Owned {
            self.0
        }
    }

    // ---------- the two views ----------

    /// The job view: the release rule and the keeper judge by it. It reads the
    /// job only; the holder and the keeper are not in the job, so they are
    /// never members, and it kills only through the job.
    pub struct JobView {
        core: Core,
        with_scan: bool,
    }

    impl JobView {
        /// Open the job `name`; `None` when it cannot be opened. `with_scan`
        /// adds the in-job Toolhelp scan to the id list (contenders only; the
        /// keeper polls the list and the count alone).
        pub fn open(name: &str, with_scan: bool) -> Option<JobView> {
            let mut core = Core::default();
            core.try_open(name);
            core.job.is_some().then_some(JobView { core, with_scan })
        }

        /// Is the job empty right now. Re-reads every source on each call.
        pub fn is_empty(&mut self) -> DomainState {
            let poll = self.core.poll(self.with_scan, None);
            decide(poll.acct, &poll.members, &poll.unopenable, 0, true)
        }

        /// The members that are still live, as the id list and the member
        /// handles show them now (for naming what a bounded wait left behind).
        pub fn live_pids(&mut self) -> Vec<u32> {
            let poll = self.core.poll(self.with_scan, None);
            poll.members.iter().filter(|m| !m.signaled).map(|m| m.pid).collect()
        }

        /// End every process in the job.
        pub fn kill_all(&mut self) -> KillOutcome {
            match self.core.job.as_ref() {
                // SAFETY: terminating the job this handle names.
                Some(job) if unsafe { TerminateJobObject(job.0, 1) } != 0 => KillOutcome::Ok,
                _ => KillOutcome::Refused,
            }
        }
    }

    /// The calling process's ancestors, nearest first, as `(pid, creation
    /// FILETIME)`. A parent created after its child is a reused pid and ends
    /// the chain.
    pub fn ancestor_chain() -> Vec<(u32, u64)> {
        let rows = snapshot(None);
        let find = |pid: u32| rows.iter().find(|r| r.entry.pid == pid).map(|r| r.entry);
        let mut chain = Vec::new();
        let mut child = find(std::process::id());
        while let Some(me) = child {
            let Some(parent) = find(me.ppid) else { break };
            let (Some(parent_created), Some(child_created)) = (parent.created, me.created) else { break };
            if parent_created > child_created || chain.len() >= 64 {
                break;
            }
            chain.push((parent.pid, parent_created));
            child = Some(parent);
        }
        chain
    }

    /// Open a job by name for the release rule and the keeper (no scan).
    pub fn job_view(name: &str) -> Option<JobView> {
        JobView::open(name, false)
    }

    /// Which sources named a domain member (the job's id list, the in-job
    /// process scan, the holder's process tree).
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub struct NamedBy {
        /// The job's `JobObjectBasicProcessIdList`.
        pub list: bool,
        /// A Toolhelp scan for processes `IsProcessInJob` says are members.
        pub scan: bool,
        /// A descendant of the recorded holder created at or after `declaredAt`.
        pub tree: bool,
    }

    /// The contender view of a recorded `windows-job` domain, used by `admit`.
    /// One value serves a whole wait, so member handles live across polls.
    pub struct ContenderView {
        record: WindowsJob,
        core: Core,
        other_session: bool,
        quiet_rounds: u32,
        job_opened: bool,
    }

    /// The Windows session of this process.
    pub fn own_session() -> Option<u32> {
        let mut session = 0;
        // SAFETY: one out-pointer for this process's id.
        (unsafe { ProcessIdToSessionId(GetCurrentProcessId(), &mut session) } != 0).then_some(session)
    }

    impl ContenderView {
        /// A view of `record`; the job is opened here and again on a poll while
        /// it has not opened yet.
        pub fn new(record: &WindowsJob) -> ContenderView {
            let mut view = ContenderView { record: record.clone(), core: Core::default(), other_session: own_session() != Some(record.session_id), quiet_rounds: 0, job_opened: false };
            if !view.other_session {
                view.core.try_open(&record.job);
                view.job_opened = view.core.job.is_some();
            }
            view
        }

        /// Whether the job could be opened (by this or an earlier poll).
        pub fn job_opened(&self) -> bool {
            self.job_opened
        }

        /// Every pid the polls so far named, with the sources that named it.
        pub fn trace(&self) -> Vec<(u32, NamedBy)> {
            self.core.seen.iter().map(|(pid, n)| (*pid, NamedBy { list: n.in_list, scan: n.in_scan, tree: n.in_tree })).collect()
        }

        /// Set once a poll answered "not empty" because the record is from
        /// another Windows session.
        pub fn reason(&self) -> Option<&'static str> {
            self.other_session.then_some(OTHER_SESSION_REASON)
        }

        fn holder_alive(&self) -> bool {
            let holder = &self.record.holder;
            matches!(platform::current().observe(holder.pid), Observed::Live { start_time } if start_time == holder.start_time)
        }

        /// One poll. Re-reads every source; never trusts an earlier answer.
        pub fn is_empty(&mut self) -> DomainState {
            if self.other_session {
                return DomainState::NotEmpty;
            }
            self.core.try_open(&self.record.job);
            self.job_opened |= self.core.job.is_some();
            let job_open = self.core.job.is_some();
            if self.holder_alive() {
                // The holder released through the normal rule, so its job is the
                // whole domain; with no job there is nothing left to see.
                if !job_open {
                    return if self.core.job_gone() { DomainState::Empty } else { DomainState::NotEmpty };
                }
                let poll = self.core.poll(true, None);
                return decide(poll.acct, &poll.members, &poll.unopenable, 0, true);
            }
            let poll = self.core.poll(job_open, Some(&self.record));
            let quiet = poll.unopenable.is_empty() && poll.members.iter().all(|m| m.signaled);
            self.quiet_rounds = if quiet { self.quiet_rounds + 1 } else { 0 };
            decide(poll.acct, &poll.members, &poll.unopenable, self.quiet_rounds, job_open)
        }

        /// End the domain at once. A live holder is never touched and neither is
        /// the keeper: only the job is terminated, plus, for a dead holder, the
        /// tree members that are not in the job (by identity).
        pub fn kill_all(&mut self) -> KillOutcome {
            if self.other_session {
                return KillOutcome::Refused;
            }
            let holder_alive = self.holder_alive();
            let job_open = self.core.job.is_some();
            let tree = (!holder_alive).then_some(&self.record);
            let poll = self.core.poll(job_open, tree);
            if let Some(job) = self.core.job.as_ref() {
                // SAFETY: terminating the job this handle names.
                unsafe {
                    TerminateJobObject(job.0, 1);
                }
            }
            let platform = platform::current();
            let mut outcome = KillOutcome::Ok;
            for (pid, created) in poll.outside_job {
                let tuple = ProcTuple { host: platform.host(), boot_id: platform.boot_id(), pid_ns: platform.pid_ns().id, pid: ProcId(pid), start_time: created.to_string() };
                if !signal_settled(&signal_by_identity(&tuple, Signal::Kill)) {
                    outcome = KillOutcome::Refused;
                }
            }
            outcome
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn live(pid: u32) -> MemberState {
        MemberState { pid, signaled: false }
    }

    fn dead(pid: u32) -> MemberState {
        MemberState { pid, signaled: true }
    }

    #[test]
    fn a_live_member_the_list_omits_keeps_the_domain_not_empty() {
        // Accounting says zero and the list is empty, yet the scan or the tree
        // named a process whose object is still unsignaled.
        assert_eq!(decide(Some(0), &[dead(10), live(11)], &[], 0, true), DomainState::NotEmpty);
    }

    #[test]
    fn zero_accounting_with_an_unsignaled_member_is_not_empty() {
        assert_eq!(decide(Some(0), &[live(7)], &[], 0, true), DomainState::NotEmpty);
        assert_eq!(decide(Some(0), &[dead(7)], &[], 0, true), DomainState::Empty);
        assert_eq!(decide(Some(1), &[dead(7)], &[], 0, true), DomainState::NotEmpty);
        assert_eq!(decide(None, &[], &[], 0, true), DomainState::NotEmpty);
    }

    #[test]
    fn an_unopenable_pid_keeps_the_domain_not_empty() {
        assert_eq!(decide(Some(0), &[dead(7)], &[99], 0, true), DomainState::NotEmpty);
        assert_eq!(decide(None, &[], &[99], 9, false), DomainState::NotEmpty);
    }

    #[test]
    fn the_fallback_needs_two_quiet_rounds() {
        assert_eq!(decide(None, &[dead(7)], &[], 0, false), DomainState::NotEmpty);
        assert_eq!(decide(None, &[dead(7)], &[], 1, false), DomainState::NotEmpty);
        assert_eq!(decide(None, &[dead(7)], &[], 2, false), DomainState::Empty);
        assert_eq!(decide(None, &[live(7)], &[], 2, false), DomainState::NotEmpty);
    }

    #[test]
    fn the_id_list_buffer_grows_until_every_member_fits() {
        let members = [101usize, 102, 103, 104, 105];
        let mut sizes = vec![];
        let ids = read_id_list(2, |buf| {
            sizes.push(buf.len());
            let room = buf.len() - LIST_HEADER_SLOTS;
            if room < members.len() {
                return ListRead::MoreData { assigned: members.len() };
            }
            buf[LIST_HEADER_SLOTS..LIST_HEADER_SLOTS + members.len()].copy_from_slice(&members);
            ListRead::Filled { in_list: members.len() }
        });
        assert_eq!(ids, Some(vec![101, 102, 103, 104, 105]));
        assert!(sizes.len() >= 2 && sizes[0] < sizes[1], "retried with a bigger buffer: {sizes:?}");
        assert_eq!(read_id_list(2, |_| ListRead::Failed), None);
    }

    fn p(pid: u32, ppid: u32, created: Option<u64>) -> ProcEntry {
        ProcEntry { pid, ppid, created }
    }

    #[test]
    fn the_tree_keeps_descendants_created_at_or_after_the_declare() {
        let procs = [p(10, 1, Some(100)), p(11, 10, Some(150)), p(12, 11, Some(160)), p(13, 10, Some(90)), p(14, 13, Some(170)), p(20, 1, Some(155))];
        let tree = tree_from(&procs, (10, 100), None, 140);
        let mut pids: Vec<u32> = tree.members.iter().map(|m| m.0).collect();
        pids.sort_unstable();
        // 13 predates the declare, so 14 (its child) is not the borrow's either.
        assert_eq!(pids, vec![11, 12]);
        assert!(tree.unopenable.is_empty());
    }

    #[test]
    fn the_tree_never_names_the_holder_or_the_keeper() {
        let procs = [p(10, 1, Some(100)), p(11, 10, Some(150)), p(12, 10, Some(151)), p(13, 12, Some(160))];
        let tree = tree_from(&procs, (10, 100), Some((12, 151)), 140);
        let pids: Vec<u32> = tree.members.iter().map(|m| m.0).collect();
        assert_eq!(pids, vec![11]);
    }

    #[test]
    fn a_reused_holder_pid_does_not_claim_the_new_owners_children() {
        // Pid 10 now belongs to a process created at 500; its child 30 is its
        // own, while 11 was created (at 150) under the old holder.
        let procs = [p(10, 1, Some(500)), p(11, 10, Some(150)), p(30, 10, Some(510))];
        let tree = tree_from(&procs, (10, 100), None, 140);
        let pids: Vec<u32> = tree.members.iter().map(|m| m.0).collect();
        assert_eq!(pids, vec![11]);
    }

    #[test]
    fn a_child_whose_creation_time_is_unreadable_is_unopenable() {
        let procs = [p(10, 1, Some(100)), p(11, 10, None), p(12, 11, Some(160)), p(40, 99, None)];
        let tree = tree_from(&procs, (10, 100), None, 140);
        assert_eq!(tree.unopenable, vec![11]);
        assert!(tree.members.is_empty(), "the unreadable node is not walked: {tree:?}");
    }

    #[test]
    fn job_names_follow_the_documented_shape() {
        assert_eq!(sanitize_lock_name("main checkout/x y"), "main_checkout_x_y");
        assert_eq!(format_job_name("fgos-borrow", "a:b", 7, 99, 3), "Local\\fgos-borrow-a_b-7-99-3");
    }
}
