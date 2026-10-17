//! Agent fixture for the gate tests that must run on every OS: a plain
//! executable (no shell, no Node) whose mode is its first argument.
//!
//! - `say <marker>`: write a line to stdout and stderr, write the marker, exit 0;
//! - `sleep <marker>`: write the marker, then wait for ever;
//! - `stubborn <marker>`: as `sleep`, with termination requests ignored;
//! - `tree <marker> <pidfile>`: start a child, record its pid, then wait for ever;
//! - `orphan <marker> <pidfile>`: start a child, record its pid, exit at once;
//! - `orphan-setsid <marker> <pidfile>` (Unix): as `orphan`, the child in a session of its own;
//! - `child`: wait for ever.

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
