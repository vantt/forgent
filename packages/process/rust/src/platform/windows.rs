//! Windows driver: the process creation time stands in for a boot id (it
//! never repeats for a reused pid), `TerminateProcess` is the one signal.
//! Lock holders cannot be listed, processes cannot be scanned, and
//! descriptor slots are not a Windows notion.

use std::ffi::c_void;
use std::fs::File;
use std::io;
use std::process::{Child, Command};

use super::ProcessPlatform;
use crate::control::{self, Signal, SignalOutcome};
use crate::facts::{Holders, Observed, PidNs, ProcTuple, Scan, ScanFilter, UnreadableCause};
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
    fn GetProcessTimes(handle: Handle, creation: *mut FileTime, exit: *mut FileTime, kernel: *mut FileTime, user: *mut FileTime) -> Bool;
    fn TerminateProcess(handle: Handle, exit_code: u32) -> Bool;
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

    /// `Ok(None)` when the process has exited; the creation time otherwise.
    /// Exit is read from the process object being signalled, never from its
    /// exit code (a process may exit with the code that means "still
    /// active").
    fn creation_time(&self) -> io::Result<Option<u64>> {
        // SAFETY: the handle is open; a zero wait only polls its state.
        match unsafe { WaitForSingleObject(self.0, 0) } {
            WAIT_TIMEOUT => {}
            WAIT_OBJECT_0 => return Ok(None),
            _ => return Err(io::Error::last_os_error()),
        }
        let mut creation = FileTime::default();
        let mut exit = FileTime::default();
        let mut kernel = FileTime::default();
        let mut user = FileTime::default();
        // SAFETY: four valid out-pointers for an open handle.
        if unsafe { GetProcessTimes(self.0, &mut creation, &mut exit, &mut kernel, &mut user) } == 0 {
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

fn unreadable(err: &io::Error) -> Observed {
    match err.raw_os_error() {
        Some(ERROR_INVALID_PARAMETER) => Observed::Absent,
        Some(ERROR_ACCESS_DENIED) => Observed::Unreadable(UnreadableCause::Permission),
        _ => Observed::Unreadable(UnreadableCause::DriverMissing),
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
        PidNs { id: "none".to_string(), is_initial: true }
    }

    fn observe(&self, pid: ProcId) -> Observed {
        let handle = match ProcessHandle::open(pid, PROCESS_QUERY_LIMITED_INFORMATION) {
            Ok(handle) => handle,
            Err(err) => return unreadable(&err),
        };
        match handle.creation_time() {
            Ok(Some(creation)) => Observed::Live { start_time: creation.to_string() },
            Ok(None) => Observed::Zombie,
            Err(err) => unreadable(&err),
        }
    }

    fn lock_holders(&self, _dev: u64, _ino: u64) -> Holders {
        Holders::Unlistable
    }

    fn scan(&self, _filter: &ScanFilter) -> Scan {
        Scan::Unsupported
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
        let handle = match ProcessHandle::open(tuple.pid, PROCESS_TERMINATE | PROCESS_QUERY_LIMITED_INFORMATION) {
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
