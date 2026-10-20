//! Shared pieces of the Windows borrowing tests: the real `fgos` binary as the
//! helper executable, a `lock-hold` helper driven through its work directory,
//! and process judgments made with this test's own handles.
#![cfg(windows)]
#![allow(dead_code)]

use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::time::{Duration, Instant};

use fgos_holder_lock::HelperExe;
use serde_json::{json, Value};
use windows_sys::Win32::Foundation::{CloseHandle, GetLastError, ERROR_INVALID_PARAMETER, INVALID_HANDLE_VALUE, WAIT_OBJECT_0};
use windows_sys::Win32::Storage::FileSystem::SYNCHRONIZE;
use windows_sys::Win32::System::Diagnostics::ToolHelp::{CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W, TH32CS_SNAPPROCESS};
use windows_sys::Win32::System::Threading::{OpenProcess, WaitForSingleObject};

pub fn fgos() -> PathBuf {
    PathBuf::from(env!("CARGO_BIN_EXE_fgos"))
}

pub fn helper() -> HelperExe {
    HelperExe(fgos())
}

/// Tests of one binary run on parallel threads, and several of them count the
/// processes this test process started: they run one at a time.
pub fn serial() -> std::sync::MutexGuard<'static, ()> {
    static SERIAL: std::sync::Mutex<()> = std::sync::Mutex::new(());
    SERIAL.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
}

pub fn temp_dir(tag: &str) -> PathBuf {
    let nanos = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos();
    let dir = std::env::temp_dir().join(format!("fgos-win-borrow-{tag}-{}-{nanos}", std::process::id()));
    fs::create_dir_all(&dir).unwrap();
    dir
}

/// A path as `sh` reads it inside a script: forward slashes.
pub fn sh_path(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}

pub fn wait_until(bound: Duration, what: &str, mut done: impl FnMut() -> bool) {
    let started = Instant::now();
    while !done() {
        assert!(started.elapsed() < bound, "{what} did not happen within {bound:?}");
        std::thread::sleep(Duration::from_millis(5));
    }
}

pub fn wait_for_json(path: &Path, what: &str) -> Value {
    let mut found = None;
    wait_until(Duration::from_secs(20), what, || match fs::read_to_string(path) {
        Ok(text) => {
            found = serde_json::from_str(&text).ok();
            found.is_some()
        }
        Err(_) => false,
    });
    found.unwrap()
}

pub fn wait_for_file(path: &Path, what: &str) -> String {
    let mut text = String::new();
    wait_until(Duration::from_secs(20), what, || match fs::read_to_string(path) {
        Ok(t) if !t.trim().is_empty() => {
            text = t;
            true
        }
        _ => false,
    });
    text
}

/// What this process's own `SYNCHRONIZE` handle says about `pid`: `Some(true)`
/// ended (or gone and reaped), `Some(false)` running, `None` live but not
/// openable.
pub fn ended(pid: u32) -> Option<bool> {
    // SAFETY: OpenProcess takes plain values and returns a handle or null.
    let handle = unsafe { OpenProcess(SYNCHRONIZE, 0, pid) };
    if handle.is_null() {
        // SAFETY: reads the calling thread's last error.
        return (unsafe { GetLastError() } == ERROR_INVALID_PARAMETER).then_some(true);
    }
    // SAFETY: a zero wait polls an open handle, which is closed right after.
    let ended = unsafe { WaitForSingleObject(handle, 0) == WAIT_OBJECT_0 };
    unsafe { CloseHandle(handle) };
    Some(ended)
}

/// The pids of this process's children named `exe` (case-insensitive).
pub fn children_named(exe: &str) -> Vec<u32> {
    children_of(std::process::id(), exe)
}

/// The pids of the processes named `exe` (case-insensitive) whose recorded
/// parent is `parent`; a parent that already ended is still named by its
/// children.
pub fn children_of(parent: u32, exe: &str) -> Vec<u32> {
    let me = parent;
    let mut found = Vec::new();
    // SAFETY: a process snapshot and a sized entry.
    unsafe {
        let snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
        if snap == INVALID_HANDLE_VALUE {
            return found;
        }
        let mut entry: PROCESSENTRY32W = std::mem::zeroed();
        entry.dwSize = std::mem::size_of::<PROCESSENTRY32W>() as u32;
        let mut more = Process32FirstW(snap, &mut entry) != 0;
        while more {
            let len = entry.szExeFile.iter().position(|c| *c == 0).unwrap_or(entry.szExeFile.len());
            if entry.th32ParentProcessID == me && String::from_utf16_lossy(&entry.szExeFile[..len]).eq_ignore_ascii_case(exe) {
                found.push(entry.th32ProcessID);
            }
            more = Process32NextW(snap, &mut entry) != 0;
        }
        CloseHandle(snap);
    }
    found
}

/// A `fgos internal lock-hold` helper this test started; ended on drop.
pub struct Hold {
    pub child: Child,
    pub work: PathBuf,
    next: u64,
}

impl Hold {
    /// Start a helper that takes `lock` exclusively; `Err` is its answer when
    /// it did not acquire.
    pub fn start(lock: &Path, work: &Path, kill_wait_ms: u64) -> Result<Hold, Value> {
        Hold::start_with(&fgos(), lock, work, kill_wait_ms)
    }

    /// [`Hold::start`] with a chosen `fgos` executable.
    pub fn start_with(exe: &Path, lock: &Path, work: &Path, kill_wait_ms: u64) -> Result<Hold, Value> {
        fs::create_dir_all(work).unwrap();
        let child = Command::new(exe)
            .args(["internal", "lock-hold", "--protocol", "2", "--path"])
            .arg(lock)
            .args(["--mode", "ex", "--try", "--kill-wait-ms", &kill_wait_ms.to_string(), "--work"])
            .arg(work)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .unwrap();
        let mut hold = Hold { child, work: work.to_path_buf(), next: 0 };
        let ready = wait_for_json(&work.join("ready.json"), "ready.json");
        if ready["result"] == "acquired" {
            Ok(hold)
        } else {
            let _ = hold.child.wait();
            Err(ready)
        }
    }

    /// Send a `borrow` request; the request number.
    pub fn borrow(&mut self, argv: &[&str]) -> u64 {
        self.request(json!({ "op": "borrow", "argv": argv, "stdin": "null" }))
    }

    pub fn request(&mut self, body: Value) -> u64 {
        self.next += 1;
        let n = self.next;
        let tmp = self.work.join(format!("req-{n}.json.tmp"));
        fs::write(&tmp, body.to_string()).unwrap();
        fs::rename(&tmp, self.work.join(format!("req-{n}.json"))).unwrap();
        n
    }

    pub fn started_pid(&self, n: u64) -> u32 {
        wait_for_json(&self.work.join(format!("started-{n}.json")), "started file")["pid"].as_u64().unwrap() as u32
    }

    pub fn result(&self, n: u64) -> Value {
        wait_for_json(&self.work.join(format!("result-{n}.json")), "result file")
    }

    /// TerminateProcess on the helper: the lock is free right after.
    pub fn kill(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}

impl Drop for Hold {
    fn drop(&mut self) {
        self.kill();
    }
}

/// The pids a pid file lists, one per line.
pub fn pids_in(path: &Path) -> Vec<u32> {
    fs::read_to_string(path).unwrap_or_default().lines().filter_map(|l| l.trim().parse().ok()).collect()
}
