//! A Ctrl-Break on a Windows console cancels a controller's attempts as SIGINT does on Unix: the cancel request of
//! every delivered attempt is published and the controller leaves with 130. The controller is a child of this test
//! binary in a process group of its own, so the event the test sends reaches it alone.
#![cfg(windows)]

use std::os::windows::process::CommandExt;
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};

use fgos_run_supervisor::controller::cancel::{
    enable_cancel_on_signal, install_cancel_on_signal, register,
};
use serde_json::Value;
use windows_sys::Win32::System::Console::{GenerateConsoleCtrlEvent, CTRL_BREAK_EVENT};

const CHILD: &str = "FGOS_CTRL_BREAK_TEST_RUN_DIR";
const CREATE_NEW_PROCESS_GROUP: u32 = 0x0000_0200;

fn scratch() -> PathBuf {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let dir = std::env::temp_dir().join(format!("fgos-ctrl-break-{}-{nanos}", std::process::id()));
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

/// The controller: one delivered attempt, the cancel handlers installed, then it waits to be cancelled.
fn controller(run_dir: &Path) {
    enable_cancel_on_signal();
    let _handlers = install_cancel_on_signal(200);
    register(run_dir);
    std::fs::write(run_dir.join("controller-ready"), "").unwrap();
    std::thread::sleep(Duration::from_secs(60));
    panic!("no cancel arrived");
}

#[test]
fn a_ctrl_break_cancels_the_delivered_attempts_and_exits_130() {
    if let Some(run_dir) = std::env::var_os(CHILD) {
        return controller(Path::new(&run_dir));
    }
    let run_dir = scratch();
    std::fs::write(
        run_dir.join("envelope.json"),
        r#"{"attemptId":"att-ctrl-break","unitRunId":"unit-ctrl-break"}"#,
    )
    .unwrap();
    let mut child = std::process::Command::new(std::env::current_exe().unwrap())
        .args([
            "--exact",
            "a_ctrl_break_cancels_the_delivered_attempts_and_exits_130",
            "--nocapture",
            "--test-threads",
            "1",
        ])
        .env(CHILD, &run_dir)
        .creation_flags(CREATE_NEW_PROCESS_GROUP)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .unwrap();
    let started = Instant::now();
    while !run_dir.join("controller-ready").exists() {
        assert!(
            started.elapsed() < Duration::from_secs(30),
            "the controller never got ready"
        );
        if let Some(status) = child.try_wait().unwrap() {
            panic!("the controller left before it got ready: {status}");
        }
        std::thread::sleep(Duration::from_millis(10));
    }
    // SAFETY: an event to the process group the child leads.
    let sent = unsafe { GenerateConsoleCtrlEvent(CTRL_BREAK_EVENT, child.id()) };
    assert_ne!(
        sent,
        0,
        "GenerateConsoleCtrlEvent failed: {}",
        std::io::Error::last_os_error()
    );
    let out = child.wait_with_output().unwrap();
    let stderr = String::from_utf8_lossy(&out.stderr);
    assert_eq!(
        out.status.code(),
        Some(130),
        "{}\n{stderr}",
        String::from_utf8_lossy(&out.stdout)
    );
    let request: Value = serde_json::from_slice(
        &std::fs::read(run_dir.join("cancel-requested.json")).expect("the cancel request"),
    )
    .unwrap();
    assert_eq!(request["attemptId"], "att-ctrl-break");
    assert_eq!(request["by"], "signal:SIGINT");
    assert!(
        stderr.contains("fgos run --resume unit-ctrl-break"),
        "{stderr}"
    );
    let _ = std::fs::remove_dir_all(&run_dir);
}
