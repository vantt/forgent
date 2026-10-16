//! Shared helpers: test context, polling, pid files, process tracking, result types.

use serde_json::Value;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::{Duration, Instant};

pub struct Ctx {
    pub dir: PathBuf,
    pub exe: PathBuf,
}

impl Ctx {
    /// A command that re-invokes this binary in a helper role, with null stdio.
    pub fn role(&self, role: &str, args: &[&str]) -> Command {
        let mut c = Command::new(&self.exe);
        c.arg("--role").arg(role).args(args);
        c.stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null());
        c
    }
    pub fn p(&self, name: &str) -> PathBuf {
        self.dir.join(name)
    }
    pub fn s(&self, name: &str) -> String {
        self.dir.join(name).to_string_lossy().into_owned()
    }
}

#[derive(Clone, Copy, PartialEq, Debug)]
pub enum Status {
    Pass,
    Fail,
    Skip,
}

impl Status {
    pub fn as_str(self) -> &'static str {
        match self {
            Status::Pass => "pass",
            Status::Fail => "fail",
            Status::Skip => "skip",
        }
    }
}

pub struct R {
    pub status: Status,
    pub note: String,
    pub data: Value,
}

pub type TestResult = Result<R, String>;
pub type TestFn = fn(&Ctx) -> TestResult;

pub struct Def {
    pub name: &'static str,
    /// What result would confirm the design; anything else refutes it.
    pub expect: &'static str,
    pub timeout_s: u64,
    pub f: TestFn,
}

pub fn pass(note: &str, data: Value) -> TestResult {
    Ok(R { status: Status::Pass, note: note.into(), data })
}
pub fn fail(note: &str, data: Value) -> TestResult {
    Ok(R { status: Status::Fail, note: note.into(), data })
}
pub fn skip(note: &str) -> TestResult {
    Ok(R { status: Status::Skip, note: note.into(), data: Value::Null })
}

pub fn ms(d: Duration) -> f64 {
    (d.as_secs_f64() * 10000.0).round() / 10.0
}

/// Polls `f` every 2 ms; returns elapsed time when it became true, None on timeout.
pub fn wait_until(timeout: Duration, mut f: impl FnMut() -> bool) -> Option<Duration> {
    let t0 = Instant::now();
    loop {
        if f() {
            return Some(t0.elapsed());
        }
        if t0.elapsed() >= timeout {
            return None;
        }
        std::thread::sleep(Duration::from_millis(2));
    }
}

pub fn secs(n: u64) -> Duration {
    Duration::from_secs(n)
}

pub fn read_pid(p: &Path) -> Option<u32> {
    std::fs::read_to_string(p).ok()?.split_whitespace().next()?.parse().ok()
}

/// Writes via a temp name then rename so readers never see a partial file.
pub fn write_atomic(p: &Path, content: &str) {
    let tmp = PathBuf::from(format!("{}.part", p.display()));
    if std::fs::write(&tmp, content).is_ok() {
        let _ = std::fs::rename(&tmp, p);
    }
}

pub fn pid_files(dir: &Path, prefix: &str) -> Vec<u32> {
    let mut out = vec![];
    if let Ok(rd) = std::fs::read_dir(dir) {
        for e in rd.flatten() {
            let n = e.file_name().to_string_lossy().into_owned();
            if n.starts_with(prefix) && n.ends_with(".pid") {
                if let Some(p) = read_pid(&e.path()) {
                    out.push(p);
                }
            }
        }
    }
    out.sort();
    out
}

static TRACKED: Mutex<Vec<u32>> = Mutex::new(Vec::new());

/// Spawns and remembers the pid so cleanup can kill leftovers.
pub fn spawn(cmd: &mut Command) -> Result<Child, String> {
    let c = cmd.spawn().map_err(|e| format!("spawn failed: {e}"))?;
    if let Ok(mut t) = TRACKED.lock() {
        t.push(c.id());
    }
    Ok(c)
}

/// Kills everything left behind: tracked children and every pid recorded in *.pid files.
pub fn cleanup_processes(dir: &Path) {
    let mut pids: Vec<u32> = vec![];
    if let Ok(mut t) = TRACKED.lock() {
        pids.append(&mut t);
    }
    if let Ok(rd) = std::fs::read_dir(dir) {
        for e in rd.flatten() {
            if e.file_name().to_string_lossy().ends_with(".pid") {
                if let Some(p) = read_pid(&e.path()) {
                    pids.push(p);
                }
            }
        }
    }
    pids.sort();
    pids.dedup();
    for p in pids {
        if p != std::process::id() {
            crate::plat::kill_pid(p);
        }
    }
}

/// Runs a command to completion with a hard timeout; returns (success, stdout) or None on timeout/spawn error.
pub fn run_capture(mut cmd: Command, timeout: Duration) -> Option<(bool, String)> {
    cmd.stdin(Stdio::null()).stdout(Stdio::piped()).stderr(Stdio::null());
    let mut child = cmd.spawn().ok()?;
    let mut out = child.stdout.take()?;
    let reader = std::thread::spawn(move || {
        let mut s = String::new();
        let _ = out.read_to_string(&mut s);
        s
    });
    let t0 = Instant::now();
    let status = loop {
        match child.try_wait() {
            Ok(Some(s)) => break Some(s),
            Ok(None) if t0.elapsed() < timeout => std::thread::sleep(Duration::from_millis(5)),
            _ => {
                let _ = child.kill();
                let _ = child.wait();
                break None;
            }
        }
    };
    let status = status?;
    let s = reader.join().ok()?;
    Some((status.success(), s))
}

pub fn which(name: &str) -> bool {
    let exts: Vec<String> = if cfg!(windows) {
        std::env::var("PATHEXT")
            .unwrap_or_else(|_| ".EXE;.CMD;.BAT".into())
            .split(';')
            .map(|s| s.to_string())
            .collect()
    } else {
        vec![String::new()]
    };
    let path = std::env::var_os("PATH").unwrap_or_default();
    std::env::split_paths(&path).any(|d| exts.iter().any(|e| d.join(format!("{name}{e}")).is_file()))
}
