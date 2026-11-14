//! macOS driver: `sysctl` for the boot session, `proc_pidinfo` for the
//! process table, `kill` after an identity check. Lock holders cannot be
//! listed and processes cannot be scanned with these facts.

use std::fs::File;
use std::io;
use std::process::{Child, Command};

use super::{as_pid_t, unix_hostname, ProcessPlatform};
use crate::control::{self, Signal, SignalOutcome};
use crate::facts::{
    Holders, Observed, PidNs, ProcTuple, Relation, Scan, ScanFilter, StartTime, UnreadableCause,
};
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
            libc::sysctlbyname(
                name.as_ptr() as *const libc::c_char,
                buf.as_mut_ptr() as *mut libc::c_void,
                &mut len,
                std::ptr::null_mut(),
                0,
            )
        };
        if rc != 0 {
            return None;
        }
        let end = buf[..len].iter().position(|b| *b == 0).unwrap_or(len);
        let id = String::from_utf8_lossy(&buf[..end]).trim().to_string();
        (!id.is_empty()).then_some(id)
    }

    fn pid_ns(&self) -> PidNs {
        PidNs {
            id: "none".to_string(),
            is_initial: true,
        }
    }

    fn child_identity(&self, pid: ProcId) -> Option<ProcTuple> {
        let info = bsd_info(pid).ok()?;
        Some(ProcTuple {
            host: self.host(),
            boot_id: self.boot_id(),
            pid_ns: self.pid_ns().id,
            pid,
            start_time: start_time_of_info(&info).to_string(),
        })
    }

    fn observe(&self, pid: ProcId) -> Observed {
        let info = match bsd_info(pid) {
            Ok(info) => info,
            Err(observed) => return observed,
        };
        if info.pbi_status == SZOMB {
            return Observed::Zombie;
        }
        Observed::Live {
            start_time: start_time_of_info(&info).to_string(),
        }
    }

    fn start_time_of(&self, pid: ProcId) -> Option<StartTime> {
        bsd_info(pid).ok().map(|info| start_time_of_info(&info))
    }

    fn relation_of(&self, pid: ProcId) -> Option<Relation> {
        let info = bsd_info(pid).ok().filter(|info| info.pbi_status != SZOMB)?;
        let raw = as_pid_t(pid)?;
        // SAFETY: getsid only reads the kernel's process table.
        let session = unsafe { libc::getsid(raw) };
        Some(Relation {
            pid,
            parent: info.pbi_ppid,
            group: info.pbi_pgid,
            session: u32::try_from(session).ok()?,
            tty_nr: i64::from(info.e_tdev),
            tty_foreground_group: i64::from(info.e_tpgid),
            // Wall-clock microseconds of the start: ordered like the Linux ticks, on another clock.
            start_ticks: u64::from(info.pbi_start_tvsec) * 1_000_000
                + u64::from(info.pbi_start_tvusec),
            // Zombies are filtered out above; a live process's kernel state is not read.
            state: '?',
        })
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

fn start_time_of_info(info: &libc::proc_bsdinfo) -> StartTime {
    StartTime::Timeval {
        sec: info.pbi_start_tvsec,
        usec: info.pbi_start_tvusec,
    }
}

fn bsd_info(pid: ProcId) -> Result<libc::proc_bsdinfo, Observed> {
    let raw = as_pid_t(pid).ok_or(Observed::Absent)?;
    // SAFETY: plain data, filled within its allocated size by proc_pidinfo.
    let mut info: libc::proc_bsdinfo = unsafe { std::mem::zeroed() };
    let size = std::mem::size_of::<libc::proc_bsdinfo>() as libc::c_int;
    let got = unsafe {
        libc::proc_pidinfo(
            raw,
            libc::PROC_PIDTBSDINFO,
            0,
            &mut info as *mut _ as *mut libc::c_void,
            size,
        )
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn relation_of_this_process_names_its_parent() {
        let me = ProcId(std::process::id());
        let relation = Macos.relation_of(me).expect("this process is readable");
        assert_eq!(relation.parent, std::os::unix::process::parent_id());
        assert_eq!(relation.pid, me);
    }

    #[test]
    fn typed_start_time_of_this_process_equals_its_string_form() {
        let me = ProcId(std::process::id());
        let parts = Macos.start_time_of(me).expect("readable");
        assert!(matches!(parts, StartTime::Timeval { .. }));
        assert_eq!(parts.to_string(), Macos.identity_of(me).unwrap().start_time);
    }
}
