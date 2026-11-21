//! Windows driver: the process creation time stands in for a boot id (it
//! never repeats for a reused pid), `TerminateProcess` is the one signal.
//! Lock holders cannot be listed and descriptor slots are not a Windows
//! notion; processes are scanned from a Toolhelp snapshot, each read through
//! its own handle (command line, working directory, user).

use std::ffi::c_void;
use std::fs::File;
use std::io;
use std::path::PathBuf;
use std::process::{Child, Command};
use std::time::Duration;

use super::ProcessPlatform;
use crate::control::{self, Signal, SignalOutcome};
use crate::facts::{
    split_command_line, Holders, Observed, PidNs, ProcTuple, ProcView, Scan, ScanFilter, StartTime,
    UnreadableCause,
};
use crate::{FdSlot, ProcId};

type Handle = *mut c_void;
type Bool = i32;
type Dword = u32;

#[repr(C)]
#[derive(Default, Clone, Copy)]
struct FileTime {
    low: u32,
    high: u32,
}

impl FileTime {
    fn as_u64(self) -> u64 {
        (u64::from(self.high) << 32) | u64::from(self.low)
    }
}

const PROCESS_TERMINATE: Dword = 0x0001;
const PROCESS_QUERY_LIMITED_INFORMATION: Dword = 0x1000;
const PROCESS_VM_READ: Dword = 0x0010;
const TOKEN_QUERY: Dword = 0x0008;
const SYNCHRONIZE: Dword = 0x0010_0000;
const WAIT_OBJECT_0: Dword = 0;
const WAIT_TIMEOUT: Dword = 258;
const ERROR_ACCESS_DENIED: i32 = 5;
const ERROR_INVALID_PARAMETER: i32 = 87;

#[link(name = "kernel32")]
extern "system" {
    fn OpenProcess(desired_access: Dword, inherit_handle: Bool, process_id: Dword) -> Handle;
    fn CloseHandle(handle: Handle) -> Bool;
    fn WaitForSingleObject(handle: Handle, milliseconds: Dword) -> Dword;
    fn GetProcessTimes(
        handle: Handle,
        creation: *mut FileTime,
        exit: *mut FileTime,
        kernel: *mut FileTime,
        user: *mut FileTime,
    ) -> Bool;
    fn TerminateProcess(handle: Handle, exit_code: u32) -> Bool;
    fn ReadProcessMemory(
        handle: Handle,
        base: *const c_void,
        buffer: *mut c_void,
        size: usize,
        read: *mut usize,
    ) -> Bool;
    fn QueryFullProcessImageNameW(
        handle: Handle,
        flags: Dword,
        name: *mut u16,
        size: *mut Dword,
    ) -> Bool;
}

#[link(name = "ntdll")]
extern "system" {
    fn NtQueryInformationProcess(
        handle: Handle,
        class: u32,
        info: *mut c_void,
        length: u32,
        returned: *mut u32,
    ) -> i32;
}

#[link(name = "advapi32")]
extern "system" {
    fn OpenProcessToken(process: Handle, access: Dword, token: *mut Handle) -> Bool;
    fn GetTokenInformation(
        token: Handle,
        class: u32,
        info: *mut c_void,
        length: Dword,
        returned: *mut Dword,
    ) -> Bool;
    fn GetLengthSid(sid: *const c_void) -> Dword;
}

/// An open process handle, closed on drop. While it is open the pid cannot
/// be reused, which is what makes the creation-time check sound.
struct ProcessHandle(Handle);

impl ProcessHandle {
    fn open(pid: ProcId, access: Dword) -> Result<ProcessHandle, io::Error> {
        // SAFETY: OpenProcess takes plain values and returns a handle or null.
        let handle = unsafe { OpenProcess(access | SYNCHRONIZE, 0, pid.0) };
        if handle.is_null() {
            Err(io::Error::last_os_error())
        } else {
            Ok(ProcessHandle(handle))
        }
    }

    /// Wait up to `millis` for the process object to be signalled: `true` when the process has ended.
    fn wait(&self, millis: Dword) -> io::Result<bool> {
        // SAFETY: waiting on an open handle this struct owns.
        match unsafe { WaitForSingleObject(self.0, millis) } {
            WAIT_TIMEOUT => Ok(false),
            WAIT_OBJECT_0 => Ok(true),
            _ => Err(io::Error::last_os_error()),
        }
    }

    /// `Ok(None)` when the process has exited; the creation time otherwise.
    /// Exit is read from the process object being signalled, never from its
    /// exit code (a process may exit with the code that means "still
    /// active").
    fn creation_time(&self) -> io::Result<Option<u64>> {
        if self.wait(0)? {
            return Ok(None);
        }
        let mut creation = FileTime::default();
        let mut exit = FileTime::default();
        let mut kernel = FileTime::default();
        let mut user = FileTime::default();
        // SAFETY: four valid out-pointers for an open handle.
        if unsafe { GetProcessTimes(self.0, &mut creation, &mut exit, &mut kernel, &mut user) } == 0
        {
            return Err(io::Error::last_os_error());
        }
        Ok(Some(creation.as_u64()))
    }
}

impl Drop for ProcessHandle {
    fn drop(&mut self) {
        // SAFETY: closing the handle this struct owns.
        unsafe {
            CloseHandle(self.0);
        }
    }
}

/// A process opened for waiting. While it is open the pid cannot be reused, so a start time read
/// from it and a wait on it always concern the same process.
pub struct WaitHandle(ProcessHandle);

// SAFETY: a process handle is a kernel object reference that any thread may poll, wait on or close.
unsafe impl Send for WaitHandle {}

impl WaitHandle {
    /// Open `pid` for waiting, with query access when the OS grants it so [`WaitHandle::start_time`]
    /// can read; a process that refuses it is opened for waiting alone. `Err` carries the OS error:
    /// `ERROR_INVALID_PARAMETER` (87) means no such process.
    pub fn open(pid: ProcId) -> io::Result<WaitHandle> {
        match ProcessHandle::open(pid, PROCESS_QUERY_LIMITED_INFORMATION) {
            Err(err) if err.raw_os_error() == Some(ERROR_ACCESS_DENIED) => {
                ProcessHandle::open(pid, 0).map(WaitHandle)
            }
            other => other.map(WaitHandle),
        }
    }

    /// The creation time of the process; `Ok(None)` when it has ended. `Err` when the handle was
    /// opened for waiting alone.
    pub fn start_time(&self) -> io::Result<Option<StartTime>> {
        Ok(self.0.creation_time()?.map(StartTime::FileTime))
    }

    /// Whether the process has ended.
    pub fn ended(&self) -> io::Result<bool> {
        self.0.wait(0)
    }

    /// Wait up to `timeout` for the process to end; `true` when it has.
    pub fn wait(&self, timeout: Duration) -> io::Result<bool> {
        self.0
            .wait(Dword::try_from(timeout.as_millis()).unwrap_or(Dword::MAX - 1))
    }
}

/// Open the process `tuple` names for waiting: one handle opened, its creation time checked
/// against `tuple.start_time` on that handle, and returned. `None` when the process is gone,
/// unreadable, or is not the one the tuple names (a reused pid).
pub fn open_verified(tuple: &ProcTuple) -> Option<WaitHandle> {
    let handle = WaitHandle::open(tuple.pid).ok()?;
    match handle.start_time() {
        Ok(Some(start)) if start.to_string() == tuple.start_time => Some(handle),
        _ => None,
    }
}

fn unreadable(err: &io::Error) -> Observed {
    match err.raw_os_error() {
        Some(ERROR_INVALID_PARAMETER) => Observed::Absent,
        Some(ERROR_ACCESS_DENIED) => Observed::Unreadable(UnreadableCause::Permission),
        _ => Observed::Unreadable(UnreadableCause::DriverMissing),
    }
}

const PROCESS_BASIC_INFORMATION: u32 = 0;
const PROCESS_WOW64_INFORMATION: u32 = 26;
const PROCESS_COMMAND_LINE_INFORMATION: u32 = 60;
const TOKEN_USER: u32 = 1;
/// `STATUS_INFO_LENGTH_MISMATCH`, `STATUS_BUFFER_OVERFLOW` and
/// `STATUS_BUFFER_TOO_SMALL`: the buffer was too small, `returned` says by how much.
const STATUS_TOO_SMALL: [i32; 3] = [
    0xC000_0004_u32 as i32,
    0x8000_0005_u32 as i32,
    0xC000_0023_u32 as i32,
];
/// x64 layout: `PEB.ProcessParameters` and
/// `RTL_USER_PROCESS_PARAMETERS.CurrentDirectory.DosPath`.
const PEB_PROCESS_PARAMETERS: usize = 0x20;
const PARAMETERS_CURRENT_DIRECTORY: usize = 0x38;
/// The longest path a `UNICODE_STRING` here can describe, in bytes.
const MAX_PATH_BYTES: usize = 32_768 * 2;

/// Every pid in a Toolhelp process snapshot, the Idle process left out.
/// `None` when the snapshot cannot be taken.
pub fn process_ids() -> Option<Vec<ProcId>> {
    use windows_sys::Win32::Foundation::INVALID_HANDLE_VALUE;
    use windows_sys::Win32::System::Diagnostics::ToolHelp::{
        CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W,
        TH32CS_SNAPPROCESS,
    };
    // SAFETY: a process snapshot, a sized entry, and the snapshot handle closed once.
    unsafe {
        let snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
        if snapshot == INVALID_HANDLE_VALUE {
            return None;
        }
        let mut ids = Vec::new();
        let mut entry: PROCESSENTRY32W = std::mem::zeroed();
        entry.dwSize = std::mem::size_of::<PROCESSENTRY32W>() as u32;
        let mut more = Process32FirstW(snapshot, &mut entry) != 0;
        while more {
            if entry.th32ProcessID != 0 {
                ids.push(ProcId(entry.th32ProcessID));
            }
            more = Process32NextW(snapshot, &mut entry) != 0;
        }
        CloseHandle(snapshot);
        Some(ids)
    }
}

/// A 32-bit FNV-1a digest of the user SID in the process token: the value
/// `ProcView::effective_uid` carries on Windows.
pub fn user_digest_of(pid: ProcId) -> Option<u32> {
    let handle = ProcessHandle::open(pid, PROCESS_QUERY_LIMITED_INFORMATION).ok()?;
    handle.user_digest().ok()
}

impl ProcessHandle {
    fn user_digest(&self) -> io::Result<u32> {
        let mut token: Handle = std::ptr::null_mut();
        // SAFETY: an open process handle and one out-pointer.
        if unsafe { OpenProcessToken(self.0, TOKEN_QUERY, &mut token) } == 0 {
            return Err(io::Error::last_os_error());
        }
        let token = ProcessHandle(token);
        let mut needed: Dword = 0;
        // SAFETY: a size query with no buffer.
        unsafe {
            GetTokenInformation(token.0, TOKEN_USER, std::ptr::null_mut(), 0, &mut needed);
        }
        if needed == 0 {
            return Err(io::Error::last_os_error());
        }
        let mut buffer = vec![0u64; (needed as usize).div_ceil(8)];
        // SAFETY: the buffer holds `needed` bytes and is 8-byte aligned.
        if unsafe {
            GetTokenInformation(
                token.0,
                TOKEN_USER,
                buffer.as_mut_ptr().cast(),
                needed,
                &mut needed,
            )
        } == 0
        {
            return Err(io::Error::last_os_error());
        }
        // TOKEN_USER starts with the SID pointer, which points into this buffer.
        let sid = buffer[0] as usize as *const u8;
        // SAFETY: a valid SID the kernel just wrote into the buffer.
        let length = unsafe { GetLengthSid(sid.cast()) } as usize;
        // SAFETY: `length` bytes of that SID.
        let bytes = unsafe { std::slice::from_raw_parts(sid, length) };
        Ok(bytes.iter().fold(0x811c_9dc5_u32, |hash, byte| {
            (hash ^ u32::from(*byte)).wrapping_mul(0x0100_0193)
        }))
    }

    /// The full command line, as wide characters.
    fn command_line(&self) -> io::Result<Vec<u16>> {
        let mut size = 1024u32;
        for _ in 0..4 {
            let mut buffer = vec![0u64; (size as usize).div_ceil(8)];
            let mut returned = 0u32;
            // SAFETY: the buffer holds `size` bytes and is 8-byte aligned.
            let status = unsafe {
                NtQueryInformationProcess(
                    self.0,
                    PROCESS_COMMAND_LINE_INFORMATION,
                    buffer.as_mut_ptr().cast(),
                    size,
                    &mut returned,
                )
            };
            if STATUS_TOO_SMALL.contains(&status) {
                size = returned.max(size.saturating_mul(2));
                continue;
            }
            if status < 0 {
                return Err(io::Error::other(format!("NTSTATUS {status:#010x}")));
            }
            // A UNICODE_STRING (length u16, capacity u16, buffer pointer at +8)
            // whose buffer lies inside this same allocation.
            let base = buffer.as_ptr() as usize;
            let length = usize::from(buffer[0] as u16);
            let pointer = buffer[1] as usize;
            let capacity = buffer.len() * 8;
            if !length.is_multiple_of(2)
                || pointer < base
                || pointer - base + length > capacity
                || !(pointer - base).is_multiple_of(2)
            {
                return Err(io::Error::other("malformed command line string"));
            }
            // SAFETY: the range was checked to lie inside the buffer.
            let wide = unsafe { std::slice::from_raw_parts(pointer as *const u16, length / 2) };
            return Ok(wide.to_vec());
        }
        Err(io::Error::other("command line kept growing"))
    }

    fn read_memory(&self, address: usize, out: &mut [u8]) -> io::Result<()> {
        let mut read = 0usize;
        // SAFETY: an open handle with PROCESS_VM_READ and a writable buffer of `out.len()` bytes.
        let done = unsafe {
            ReadProcessMemory(
                self.0,
                address as *const c_void,
                out.as_mut_ptr().cast(),
                out.len(),
                &mut read,
            )
        };
        if done == 0 {
            return Err(io::Error::last_os_error());
        }
        if read != out.len() {
            return Err(io::Error::other("short read of process memory"));
        }
        Ok(())
    }

    fn read_word(&self, address: usize) -> io::Result<usize> {
        let mut bytes = [0u8; std::mem::size_of::<usize>()];
        self.read_memory(address, &mut bytes)?;
        Ok(usize::from_le_bytes(bytes))
    }

    /// The working directory from the process parameters in its PEB (x64
    /// layout). A 32-bit process on a 64-bit host keeps its parameters in a
    /// second layout and is reported unreadable rather than guessed at.
    fn current_directory(&self) -> io::Result<PathBuf> {
        use std::os::windows::ffi::OsStringExt;
        if cfg!(not(target_pointer_width = "64")) {
            return Err(io::Error::other(
                "working directory read needs the x64 layout",
            ));
        }
        let mut wow64 = 0usize;
        let mut returned = 0u32;
        // SAFETY: one pointer-sized out value.
        let status = unsafe {
            NtQueryInformationProcess(
                self.0,
                PROCESS_WOW64_INFORMATION,
                std::ptr::addr_of_mut!(wow64).cast(),
                std::mem::size_of::<usize>() as u32,
                &mut returned,
            )
        };
        if status < 0 {
            return Err(io::Error::other(format!("NTSTATUS {status:#010x}")));
        }
        if wow64 != 0 {
            return Err(io::Error::other("32-bit process on a 64-bit host"));
        }
        let mut basic = [0usize; 6];
        // SAFETY: PROCESS_BASIC_INFORMATION is six pointer-sized fields.
        let status = unsafe {
            NtQueryInformationProcess(
                self.0,
                PROCESS_BASIC_INFORMATION,
                basic.as_mut_ptr().cast(),
                std::mem::size_of_val(&basic) as u32,
                &mut returned,
            )
        };
        if status < 0 || basic[1] == 0 {
            return Err(io::Error::other(format!("NTSTATUS {status:#010x}")));
        }
        let parameters = self.read_word(basic[1] + PEB_PROCESS_PARAMETERS)?;
        let mut head = [0u8; 16];
        self.read_memory(parameters + PARAMETERS_CURRENT_DIRECTORY, &mut head)?;
        let length = usize::from(u16::from_le_bytes([head[0], head[1]]));
        let buffer = usize::from_le_bytes(head[8..16].try_into().expect("eight bytes"));
        if length == 0 || !length.is_multiple_of(2) || length > MAX_PATH_BYTES || buffer == 0 {
            return Err(io::Error::other("no working directory recorded"));
        }
        let mut bytes = vec![0u8; length];
        self.read_memory(buffer, &mut bytes)?;
        let wide: Vec<u16> = (0..bytes.len() / 2)
            .map(|i| u16::from_le_bytes([bytes[2 * i], bytes[2 * i + 1]]))
            .collect();
        let mut path = PathBuf::from(std::ffi::OsString::from_wide(&wide));
        // The parameters keep a trailing separator ("C:\\work\\"); only a root keeps it.
        let text = path.to_string_lossy().into_owned();
        if text.len() > 3 && text.ends_with('\\') {
            path = PathBuf::from(text.trim_end_matches('\\'));
        }
        Ok(path)
    }

    fn image_path(&self) -> io::Result<PathBuf> {
        use std::os::windows::ffi::OsStringExt;
        let mut buffer = vec![0u16; 32_768];
        let mut size = buffer.len() as Dword;
        // SAFETY: a writable buffer of `size` wide characters.
        if unsafe { QueryFullProcessImageNameW(self.0, 0, buffer.as_mut_ptr(), &mut size) } == 0 {
            return Err(io::Error::last_os_error());
        }
        Ok(PathBuf::from(std::ffi::OsString::from_wide(
            &buffer[..size as usize],
        )))
    }
}

impl Windows {
    /// The scan view of one process, or `None` when nothing runs there. A
    /// read that fails leaves its field `None` and is named in `unreadable`.
    fn view_with(&self, pid: ProcId, filter: &ScanFilter, host: &str) -> Option<ProcView> {
        let mut unreadable = Vec::new();
        let mut view = ProcView {
            effective_uid: None,
            pid,
            tuple: None,
            exe: None,
            cmdline: None,
            cwd: None,
            env_subset: std::collections::BTreeMap::new(),
            unreadable: Vec::new(),
        };
        let memory = ProcessHandle::open(pid, PROCESS_QUERY_LIMITED_INFORMATION | PROCESS_VM_READ);
        let (handle, can_read_memory) = match memory {
            Ok(handle) => (handle, true),
            Err(err) if err.raw_os_error() == Some(ERROR_ACCESS_DENIED) => {
                match ProcessHandle::open(pid, PROCESS_QUERY_LIMITED_INFORMATION) {
                    Ok(handle) => (handle, false),
                    Err(err) => return Self::unopened(view, &err),
                }
            }
            Err(err) => return Self::unopened(view, &err),
        };
        match handle.creation_time() {
            Ok(Some(creation)) => {
                view.tuple = Some(ProcTuple {
                    host: host.to_string(),
                    boot_id: None,
                    pid_ns: "none".to_string(),
                    pid,
                    start_time: StartTime::FileTime(creation).to_string(),
                });
            }
            // Exited while the scan ran: nothing is running there.
            Ok(None) => return None,
            Err(err) => unreadable.push(format!("stat: {err}")),
        }
        match handle.user_digest() {
            Ok(digest) => view.effective_uid = Some(digest),
            Err(err) => unreadable.push(format!("uid: {err}")),
        }
        match handle.image_path() {
            Ok(path) => view.exe = Some(path),
            Err(err) => unreadable.push(format!("exe: {err}")),
        }
        match handle.command_line() {
            Ok(wide) => view.cmdline = Some(split_command_line(&wide)),
            Err(err) => unreadable.push(format!("cmdline: {err}")),
        }
        if can_read_memory {
            match handle.current_directory() {
                Ok(path) => view.cwd = Some(path),
                Err(err) => unreadable.push(format!("cwd: {err}")),
            }
        } else {
            unreadable.push("cwd: access denied".to_string());
        }
        if !filter.env_keys.is_empty() {
            unreadable.push("environ: not read on Windows".to_string());
        }
        view.unreadable = unreadable;
        Some(view)
    }

    /// A process that could not be opened: gone when no such pid, otherwise
    /// still a process, named by what could not be read.
    fn unopened(mut view: ProcView, err: &io::Error) -> Option<ProcView> {
        if err.raw_os_error() == Some(ERROR_INVALID_PARAMETER) {
            return None;
        }
        view.unreadable.push(format!("stat: {err}"));
        Some(view)
    }
}

/// The Windows driver: facts from the process object (its creation time),
/// `TerminateProcess` as the one signal.
pub struct Windows;

impl ProcessPlatform for Windows {
    fn host(&self) -> String {
        std::env::var("COMPUTERNAME").unwrap_or_else(|_| "unknown-host".to_string())
    }

    fn boot_id(&self) -> Option<String> {
        None
    }

    fn pid_ns(&self) -> PidNs {
        PidNs {
            id: "none".to_string(),
            is_initial: true,
        }
    }

    fn observe(&self, pid: ProcId) -> Observed {
        let handle = match ProcessHandle::open(pid, PROCESS_QUERY_LIMITED_INFORMATION) {
            Ok(handle) => handle,
            Err(err) => return unreadable(&err),
        };
        match handle.creation_time() {
            Ok(Some(creation)) => Observed::Live {
                start_time: StartTime::FileTime(creation).to_string(),
            },
            Ok(None) => Observed::Zombie,
            Err(err) => unreadable(&err),
        }
    }

    fn start_time_of(&self, pid: ProcId) -> Option<StartTime> {
        let handle = ProcessHandle::open(pid, PROCESS_QUERY_LIMITED_INFORMATION).ok()?;
        handle.creation_time().ok()?.map(StartTime::FileTime)
    }

    fn lock_holders(&self, _dev: u64, _ino: u64) -> Holders {
        Holders::Unlistable
    }

    fn scan(&self, filter: &ScanFilter) -> Scan {
        let Some(ids) = process_ids() else {
            return Scan::Unsupported;
        };
        let own = ProcId(std::process::id());
        let host = self.host();
        Scan::Views(
            ids.into_iter()
                .filter(|pid| *pid != own || filter.include_self)
                .filter_map(|pid| self.view_with(pid, filter, &host))
                .collect(),
        )
    }

    fn view_of(&self, pid: ProcId, filter: &ScanFilter) -> Option<ProcView> {
        self.view_with(pid, filter, &self.host())
    }

    fn spawn_with_fds(&self, _cmd: Command, _fd_map: &[(FdSlot, &File)]) -> io::Result<Child> {
        Err(io::Error::new(io::ErrorKind::Unsupported, "descriptor slots are not a Windows notion; the holder-lock driver for Windows hands handles over itself"))
    }

    fn signal_by_identity(&self, tuple: &ProcTuple, sig: Signal) -> SignalOutcome {
        if sig != Signal::Kill {
            return SignalOutcome::Unsupported;
        }
        if let Some(outcome) = control::out_of_scope(tuple, &self.observer()) {
            return outcome;
        }
        let handle = match ProcessHandle::open(
            tuple.pid,
            PROCESS_TERMINATE | PROCESS_QUERY_LIMITED_INFORMATION,
        ) {
            Ok(handle) => handle,
            Err(err) => {
                return match err.raw_os_error() {
                    Some(ERROR_INVALID_PARAMETER) => SignalOutcome::NotFound,
                    Some(ERROR_ACCESS_DENIED) => SignalOutcome::Denied,
                    Some(code) => SignalOutcome::Failed(code),
                    None => SignalOutcome::Failed(0),
                }
            }
        };
        // The handle keeps the pid from being reused between this check and the kill.
        match handle.creation_time() {
            Ok(Some(creation)) if creation.to_string() == tuple.start_time => {}
            Ok(_) => return SignalOutcome::IdentityMismatch,
            Err(_) => return SignalOutcome::IdentityUnknown,
        }
        // SAFETY: terminating the process this open handle names.
        if unsafe { TerminateProcess(handle.0, 1) } == 0 {
            let err = io::Error::last_os_error();
            return match err.raw_os_error() {
                Some(ERROR_ACCESS_DENIED) => SignalOutcome::Denied,
                Some(code) => SignalOutcome::Failed(code),
                None => SignalOutcome::Failed(0),
            };
        }
        SignalOutcome::Sent
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn me() -> ProcTuple {
        crate::facts::self_identity().expect("this process is readable")
    }

    #[test]
    fn open_verified_refuses_a_wrong_start_time_and_waits_on_a_matching_one() {
        let mut wrong = me();
        wrong.start_time = "1".to_string();
        assert!(open_verified(&wrong).is_none());
        let handle = open_verified(&me()).expect("this process matches its own tuple");
        assert!(!handle.ended().unwrap());
        assert!(!handle.wait(Duration::from_millis(10)).unwrap());
    }

    #[test]
    fn a_verified_handle_sees_its_child_end() {
        let mut child = Command::new("cmd")
            .args(["/C", "ping -n 30 127.0.0.1 >NUL"])
            .spawn()
            .unwrap();
        let tuple = Windows
            .child_identity(ProcId(child.id()))
            .expect("the child is live");
        let handle = open_verified(&tuple).expect("the tuple names the child");
        child.kill().unwrap();
        assert!(handle.wait(Duration::from_secs(5)).unwrap());
        assert_eq!(handle.start_time().unwrap(), None);
        let _ = child.wait();
    }

    #[test]
    fn a_pid_that_names_nothing_is_not_opened() {
        let err = WaitHandle::open(ProcId(u32::MAX - 3))
            .err()
            .expect("no such process");
        assert_eq!(err.raw_os_error(), Some(ERROR_INVALID_PARAMETER));
    }

    #[test]
    fn typed_start_time_of_this_process_equals_its_string_form() {
        let tuple = me();
        let parts = Windows.start_time_of(tuple.pid).expect("readable");
        assert!(matches!(parts, StartTime::FileTime(_)));
        assert_eq!(parts.to_string(), tuple.start_time);
    }
}
