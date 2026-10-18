//! Agent fixture for the gate tests that must run on every OS: a plain
//! executable (no shell, no Node) whose mode is its first argument.
//!
//! - `say <marker>`: write a line to stdout and stderr, write the marker, exit 0;
//! - `sleep <marker>`: write the marker, then wait for ever;
//! - `stubborn <marker>`: as `sleep`, with termination requests ignored;
//! - `tree <marker> <pidfile>`: start a child, record its pid, then wait for ever;
//! - `orphan <marker> <pidfile>`: start a child, record its pid, exit at once;
//! - `orphan-setsid <marker> <pidfile>` (Unix): as `orphan`, the child in a session of its own;
//! - `child`: wait for ever;
//! - `work <ms> <marker> <donefile>`: write the marker, print a line every 100 ms for `ms`, write the done file, exit 0;
//! - `scan-lock <lockfile> <out>`: write `found` to `out` when this process holds an open handle on `lockfile`, else `none`;
//!
//! Modes that play a post-receipt step (the step runner starts this binary):
//! - `step-write <file> <text>`: append a line to `file`;
//! - `step-exit <code>`: exit with `code`;
//! - `step-sleep <pidfile>`: write the own pid, then wait for ever;
//! - `step-env <file>`: write the names of the environment variables, one per line, sorted.

use std::process::{Command, Stdio};
use std::time::Duration;

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let arg = |i: usize| args.get(i).cloned().unwrap_or_default();
    match arg(0).as_str() {
        "say" => {
            println!("agent says hello");
            eprintln!("agent says hello on stderr");
            mark(&arg(1));
        }
        "sleep" => {
            mark(&arg(1));
            forever();
        }
        "stubborn" => {
            ignore_termination();
            mark(&arg(1));
            forever();
        }
        "tree" => {
            let child = start_child(false);
            std::fs::write(arg(2), child.to_string()).expect("pidfile");
            mark(&arg(1));
            forever();
        }
        "orphan" | "orphan-setsid" => {
            let child = start_child(arg(0) == "orphan-setsid");
            std::fs::write(arg(2), child.to_string()).expect("pidfile");
            mark(&arg(1));
        }
        "child" => forever(),
        "work" => {
            let ms: u64 = arg(1).parse().expect("milliseconds");
            mark(&arg(2));
            let start = std::time::Instant::now();
            while start.elapsed() < Duration::from_millis(ms) {
                println!("tick");
                std::thread::sleep(Duration::from_millis(100));
            }
            std::fs::write(arg(3), "done").expect("done file");
        }
        "scan-lock" => {
            let found = holds_handle_on(&arg(1));
            std::fs::write(arg(2), if found { "found" } else { "none" }).expect("scan result");
        }
        "step-write" => {
            use std::io::Write;
            let mut file = std::fs::OpenOptions::new().create(true).append(true).open(arg(1)).expect("step file");
            writeln!(file, "{}", arg(2)).expect("step line");
        }
        "step-exit" => std::process::exit(arg(1).parse().expect("exit code")),
        "step-sleep" => {
            std::fs::write(arg(1), std::process::id().to_string()).expect("pidfile");
            forever();
        }
        "step-env" => {
            let mut names: Vec<String> = std::env::vars().map(|(k, _)| k.to_uppercase()).collect();
            names.sort();
            std::fs::write(arg(1), names.join("\n")).expect("env file");
        }
        other => {
            eprintln!("gate_agent: unknown mode {other:?}");
            std::process::exit(2);
        }
    }
}

fn mark(path: &str) {
    if !path.is_empty() {
        std::fs::write(path, "running").expect("marker");
    }
}

fn forever() -> ! {
    loop {
        std::thread::sleep(Duration::from_secs(1));
    }
}

fn start_child(new_session: bool) -> u32 {
    let mut cmd = Command::new(std::env::current_exe().expect("current_exe"));
    cmd.arg("child").stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null());
    #[cfg(unix)]
    if new_session {
        use std::os::unix::process::CommandExt;
        // SAFETY: setsid is async-signal-safe.
        unsafe {
            cmd.pre_exec(|| {
                if libc::setsid() < 0 {
                    return Err(std::io::Error::last_os_error());
                }
                Ok(())
            });
        }
    }
    #[cfg(not(unix))]
    let _ = new_session;
    cmd.spawn().expect("child").id()
}

#[cfg(unix)]
fn ignore_termination() {
    // SAFETY: SIG_IGN installs no handler code.
    unsafe {
        libc::signal(libc::SIGTERM, libc::SIG_IGN);
        libc::signal(libc::SIGINT, libc::SIG_IGN);
    }
}

#[cfg(windows)]
fn ignore_termination() {
    unsafe extern "system" fn handled(_event: u32) -> i32 {
        1
    }
    // SAFETY: registers a routine that reports every console event as handled.
    unsafe { windows_sys::Win32::System::Console::SetConsoleCtrlHandler(Some(handled), 1) };
}

/// Whether any descriptor (Unix) or handle (Windows) of this process names the file at `path`.
#[cfg(unix)]
fn holds_handle_on(path: &str) -> bool {
    use std::os::unix::fs::MetadataExt;
    let meta = std::fs::metadata(path).expect("lock file");
    (3..1024).any(|fd| {
        // SAFETY: fstat over a descriptor number; a closed one only fails.
        let mut st: libc::stat = unsafe { std::mem::zeroed() };
        unsafe { libc::fstat(fd, &mut st) == 0 && st.st_ino as u64 == meta.ino() && st.st_dev as u64 == meta.dev() }
    })
}

#[cfg(windows)]
fn holds_handle_on(path: &str) -> bool {
    use std::os::windows::io::AsRawHandle;
    use windows_sys::Win32::Storage::FileSystem::{GetFileInformationByHandle, BY_HANDLE_FILE_INFORMATION};

    fn identity(handle: windows_sys::Win32::Foundation::HANDLE) -> Option<(u32, u32, u32)> {
        let mut info: BY_HANDLE_FILE_INFORMATION = unsafe { std::mem::zeroed() };
        // SAFETY: one valid out-pointer; an invalid handle value only fails.
        (unsafe { GetFileInformationByHandle(handle, &mut info) } != 0).then_some((info.dwVolumeSerialNumber, info.nFileIndexHigh, info.nFileIndexLow))
    }
    let wanted = {
        let file = std::fs::File::open(path).expect("lock file");
        identity(file.as_raw_handle() as _).expect("lock file identity")
    };
    (1..4096u32).any(|n| identity((n * 4) as usize as _) == Some(wanted))
}
