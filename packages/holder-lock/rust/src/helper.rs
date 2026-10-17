//! Helper roles: small processes the port starts by re-executing a binary as
//! `<exe> internal holder-lock-helper <role> ...` ([`crate::HelperExe`]).
//! `fgos` and `fgctl` both route that selector here, so a gate that must not
//! run anything from a candidate release re-executes itself.
//!
//! Internal: no CLI promise, the argv may change with the crate.

use std::ffi::OsString;
use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use std::time::Duration;

use crate::driver::{self, TryLock};
use crate::port::Mode;

/// Exit code of an unknown role or malformed arguments.
pub const EXIT_USAGE: i32 = 64;

/// The longest a `probe-holder` outlives a probe that died before killing it.
const PROBE_HOLDER_LIFETIME: Duration = Duration::from_secs(60);

/// Run the role named by `args[0]` with the rest of `args`; returns the
/// process exit code.
pub fn main(args: &[OsString]) -> i32 {
    match args.first().and_then(|role| role.to_str()) {
        Some("probe-holder") => probe_holder(&args[1..]),
        #[cfg(windows)]
        Some("job-keeper") => keeper::job_keeper(&args[1..]),
        _ => {
            eprintln!("fgos internal holder-lock-helper: unknown role");
            EXIT_USAGE
        }
    }
}

/// `probe-holder --path P`: take the exclusive lock on `P` in this process,
/// write `R` to stdout, and hold until killed (or the lifetime bound).
fn probe_holder(args: &[OsString]) -> i32 {
    let Some(path) = path_arg(args) else {
        eprintln!("probe-holder: usage: probe-holder --path <file>");
        return EXIT_USAGE;
    };
    let file = match OpenOptions::new().read(true).write(true).create(true).truncate(false).open(&path) {
        Ok(file) => file,
        Err(err) => {
            eprintln!("probe-holder: open {}: {err}", path.display());
            return 1;
        }
    };
    match driver::current().try_lock(&file, Mode::Ex) {
        Ok(TryLock::Locked) => {}
        Ok(TryLock::WouldBlock) => {
            eprintln!("probe-holder: {} is already locked", path.display());
            return 1;
        }
        Err(err) => {
            eprintln!("probe-holder: lock {}: {err}", path.display());
            return 1;
        }
    }
    let mut stdout = std::io::stdout();
    if stdout.write_all(b"R\n").and_then(|()| stdout.flush()).is_err() {
        return 1;
    }
    std::thread::sleep(PROBE_HOLDER_LIFETIME);
    // The lock is released by the process ending, never by an unlock here.
    drop(file);
    0
}

#[cfg(windows)]
mod keeper {
    //! `job-keeper --job NAME --record <file>`: the second owner of a borrow
    //! job. The locking process starts it before the job has a member and
    //! keeps it outside the job. It exits only when the holder is done (it
    //! wrote `finished` on stdin, or its process ended) and the job view is
    //! empty; a closed stdin alone never ends it, so a holder that dies
    //! leaves the job name alive for the next contender.

    use std::ffi::OsString;
    use std::io::{BufRead, Write};
    use std::sync::atomic::{AtomicBool, Ordering};
    use std::sync::Arc;
    use std::time::Duration;

    use fgos_process::{job_view, Domain, DomainState};
    use windows_sys::Win32::Foundation::{CloseHandle, FILETIME, HANDLE, WAIT_OBJECT_0};
    use windows_sys::Win32::Storage::FileSystem::SYNCHRONIZE;
    use windows_sys::Win32::System::Threading::{GetProcessTimes, OpenProcess, WaitForSingleObject, PROCESS_QUERY_LIMITED_INFORMATION};

    use super::EXIT_USAGE;
    use crate::predecessor;

    const POLL: Duration = Duration::from_millis(50);

    struct Owned(HANDLE);

    impl Drop for Owned {
        fn drop(&mut self) {
            // SAFETY: a handle this struct opened and owns.
            unsafe { CloseHandle(self.0) };
        }
    }

    impl Owned {
        fn ended(&self) -> bool {
            // SAFETY: a zero wait polls an open handle.
            unsafe { WaitForSingleObject(self.0, 0) == WAIT_OBJECT_0 }
        }
    }

    fn args_of(args: &[OsString]) -> Option<(String, std::path::PathBuf)> {
        match args {
            [job_flag, job, record_flag, record] if job_flag == "--job" && record_flag == "--record" => Some((job.to_str()?.to_string(), record.into())),
            _ => None,
        }
    }

    /// The recorded holder, opened for waiting; `None` when it is gone or is
    /// not the process the record names.
    fn open_holder(pid: u32, start_time: &str) -> Option<Owned> {
        // SAFETY: OpenProcess takes plain values and returns a handle or null.
        let raw = unsafe { OpenProcess(SYNCHRONIZE | PROCESS_QUERY_LIMITED_INFORMATION, 0, pid) };
        if raw.is_null() {
            return None;
        }
        let holder = Owned(raw);
        // SAFETY: four valid out-pointers for a handle with query access.
        let created = unsafe {
            let (mut c, mut e, mut k, mut u): (FILETIME, FILETIME, FILETIME, FILETIME) = std::mem::zeroed();
            (GetProcessTimes(holder.0, &mut c, &mut e, &mut k, &mut u) != 0).then(|| (u64::from(c.dwHighDateTime) << 32) | u64::from(c.dwLowDateTime))
        };
        (created.map(|c| c.to_string()).as_deref() == Some(start_time)).then_some(holder)
    }

    pub(super) fn job_keeper(args: &[OsString]) -> i32 {
        let Some((job, record)) = args_of(args) else {
            eprintln!("job-keeper: usage: job-keeper --job <name> --record <file>");
            return EXIT_USAGE;
        };
        let domain = std::fs::read_to_string(&record).ok().and_then(|text| serde_json::from_str(&text).ok()).and_then(|value| predecessor::parse_record(&value));
        let Some(Domain::WindowsJob(domain)) = domain else {
            eprintln!("job-keeper: {} holds no windows-job record", record.display());
            return 1;
        };
        if domain.job != job {
            eprintln!("job-keeper: the record names another job");
            return 1;
        }
        let Some(holder) = open_holder(domain.holder.pid.0, &domain.holder.start_time) else {
            eprintln!("job-keeper: the recorded holder is not running");
            return 1;
        };
        let Some(mut view) = job_view(&job) else {
            eprintln!("job-keeper: cannot open job {job}");
            return 1;
        };
        let finished = Arc::new(AtomicBool::new(false));
        let flag = finished.clone();
        std::thread::spawn(move || {
            for line in std::io::stdin().lock().lines() {
                match line {
                    Ok(line) if line.trim() == "finished" => {
                        flag.store(true, Ordering::SeqCst);
                        return;
                    }
                    Ok(_) => {}
                    Err(_) => return,
                }
            }
            // stdin closed without `finished`: not a reason to exit.
        });
        let mut stdout = std::io::stdout();
        if stdout.write_all(b"K").and_then(|()| stdout.flush()).is_err() {
            return 1;
        }
        loop {
            std::thread::sleep(POLL);
            if (finished.load(Ordering::SeqCst) || holder.ended()) && view.is_empty() == DomainState::Empty {
                return 0;
            }
        }
    }
}

fn path_arg(args: &[OsString]) -> Option<PathBuf> {
    match args {
        [flag, path] if flag == "--path" => Some(PathBuf::from(path)),
        _ => None,
    }
}
