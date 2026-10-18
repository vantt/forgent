//! macOS driver: `sysctl` for the boot session, `proc_pidinfo` for the
//! process table, `kill` after an identity check. Lock holders cannot be
//! listed and processes cannot be scanned with these facts.

use std::fs::File;
use std::io;
use std::process::{Child, Command};

use super::{as_pid_t, unix_hostname, ProcessPlatform};
use crate::control::{self, Signal, SignalOutcome};
use crate::facts::{Holders, Observed, PidNs, ProcTuple, Scan, ScanFilter, UnreadableCause};
use crate::{FdSlot, ProcId};

/// `pbi_status` of a process that has exited but is not yet reaped.
const SZOMB: u32 = 5;

/// The macOS driver: facts from `sysctl` and `proc_pidinfo`, signals through
/// `kill` after an identity check.
pub struct Macos;

impl ProcessPlatform for Macos {
    fn host(&self) -> String {
        unix_hostname()
    }

    fn boot_id(&self) -> Option<String> {
        let name = b"kern.bootsessionuuid\0";
        let mut buf = [0u8; 64];
        let mut len = buf.len();
        // SAFETY: sysctlbyname writes at most `len` bytes into `buf` and updates `len`.
        let rc = unsafe {
            libc::sysctlbyname(name.as_ptr() as *const libc::c_char, buf.as_mut_ptr() as *mut libc::c_void, &mut len, std::ptr::null_mut(), 0)
        };
        if rc != 0 {
            return None;
        }
        let end = buf[..len].iter().position(|b| *b == 0).unwrap_or(len);
        let id = String::from_utf8_lossy(&buf[..end]).trim().to_string();
        (!id.is_empty()).then_some(id)
    }

    fn pid_ns(&self) -> PidNs {
        PidNs { id: "none".to_string(), is_initial: true }
    }

    fn observe(&self, pid: ProcId) -> Observed {
        let info = match bsd_info(pid) {
            Ok(info) => info,
            Err(observed) => return observed,
        };
        if info.pbi_status == SZOMB {
            return Observed::Zombie;
        }
        Observed::Live { start_time: format!("{}.{:06}", info.pbi_start_tvsec, info.pbi_start_tvusec) }
    }

    fn lock_holders(&self, _dev: u64, _ino: u64) -> Holders {
        Holders::Unlistable
    }

    fn scan(&self, _filter: &ScanFilter) -> Scan {
        Scan::Unsupported
    }

    fn spawn_with_fds(&self, cmd: Command, fd_map: &[(FdSlot, &File)]) -> io::Result<Child> {
        control::unix_spawn_with_fds(cmd, fd_map)
    }

    fn signal_by_identity(&self, tuple: &ProcTuple, sig: Signal) -> SignalOutcome {
        control::unix_signal_after_check(self, tuple, sig)
    }
}

/// Read start time even for an unreaped child; ordinary observations still
/// classify zombies as dead.
pub(crate) fn child_identity(pid: ProcId) -> Option<ProcTuple> {
    let info = bsd_info(pid).ok()?;
    Some(ProcTuple {
        host: Macos.host(), boot_id: Macos.boot_id(), pid_ns: Macos.pid_ns().id,
        pid, start_time: format!("{}.{:06}", info.pbi_start_tvsec, info.pbi_start_tvusec),
    })
}

fn bsd_info(pid: ProcId) -> Result<libc::proc_bsdinfo, Observed> {
    let raw = as_pid_t(pid).ok_or(Observed::Absent)?;
    // SAFETY: plain data, filled within its allocated size by proc_pidinfo.
    let mut info: libc::proc_bsdinfo = unsafe { std::mem::zeroed() };
    let size = std::mem::size_of::<libc::proc_bsdinfo>() as libc::c_int;
    let got = unsafe {
        libc::proc_pidinfo(raw, libc::PROC_PIDTBSDINFO, 0, &mut info as *mut _ as *mut libc::c_void, size)
    };
    if got != size {
        return Err(match io::Error::last_os_error().raw_os_error() {
            Some(libc::ESRCH) => Observed::Absent,
            Some(libc::EPERM) => Observed::Unreadable(UnreadableCause::Permission),
            _ => Observed::Unreadable(UnreadableCause::DriverMissing),
        });
    }
    Ok(info)
}
