#![allow(clippy::zombie_processes)] // helper roles intentionally orphan their children
//! fgos-platform-probe: measures, on a real machine, the OS mechanisms the
//! lock / run-supervisor design relies on, and writes probe-report-<os>.json.
//!
//! Usage: fgos-platform-probe [--out DIR] [--only name1,name2] [--list]
//! Internal: fgos-platform-probe --role <name> <args...> (helper processes the probe re-invokes itself as).

mod git;
mod util;
#[cfg(unix)]
#[path = "unix.rs"]
mod plat;
#[cfg(windows)]
#[path = "windows.rs"]
mod plat;

use serde_json::{json, Value};
use std::path::PathBuf;
use std::sync::mpsc;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use util::*;

fn sleep_forever() -> ! {
    loop {
        std::thread::sleep(Duration::from_secs(3600));
    }
}

/// Helper roles shared by every OS. Never returns for known roles.
fn run_role(args: &[String]) -> ! {
    plat::watchdog();
    let role = args.first().map(String::as_str).unwrap_or("");
    let rest = &args[1.min(args.len())..];
    match role {
        "sleeper" => {
            if let Some(f) = rest.first() {
                write_atomic(std::path::Path::new(f), &std::process::id().to_string());
            }
            sleep_forever()
        }
        "fanout" => {
            // fanout <dir> <depth> <breadth>: builds a process tree, each node records its pid.
            let dir = PathBuf::from(&rest[0]);
            let depth: u32 = rest[1].parse().unwrap_or(0);
            let breadth: u32 = rest[2].parse().unwrap_or(0);
            let pid = std::process::id();
            write_atomic(&dir.join(format!("fan-{pid}.pid")), &pid.to_string());
            let mut kids = vec![];
            if depth > 0 {
                for _ in 0..breadth {
                    let mut c = std::process::Command::new(std::env::current_exe().unwrap());
                    c.args(["--role", "fanout", &rest[0], &(depth - 1).to_string(), &rest[2]])
                        .stdin(std::process::Stdio::null())
                        .stdout(std::process::Stdio::null())
                        .stderr(std::process::Stdio::null());
                    if let Ok(k) = c.spawn() {
                        kids.push(k);
                    }
                }
            }
            sleep_forever()
        }
        _ => {
            if !plat::role(role, rest) {
                eprintln!("unknown role: {role}");
                std::process::exit(2);
            }
            sleep_forever()
        }
    }
}

fn herdr_test(_ctx: &Ctx) -> TestResult {
    if !which("herdr") {
        return skip("herdr is not on PATH");
    }
    let mut c = std::process::Command::new("herdr");
    c.arg("--version");
    match run_capture(c, secs(10)) {
        Some((ok, out)) => {
            let data = json!({"onPath": true, "versionOutput": out.trim(), "exitOk": ok});
            if ok { pass("herdr --version works (report only)", data) } else { fail("herdr --version exited non-zero", data) }
        }
        None => fail("herdr --version timed out or failed to start", json!({"onPath": true})),
    }
}

fn all_tests() -> Vec<Def> {
    let mut v = plat::tests();
    v.extend(git::tests());
    v.push(Def {
        name: "herdr-on-path",
        expect: "informational: whether the terminal-pane transport can exist on this OS",
        timeout_s: 20,
        f: herdr_test,
    });
    v
}

fn run_one(def: &Def, root: &std::path::Path, exe: &std::path::Path) -> Value {
    let dir = root.join(def.name);
    let _ = std::fs::create_dir_all(&dir);
    let ctx = Ctx { dir: dir.clone(), exe: exe.to_path_buf() };
    let f = def.f;
    let (tx, rx) = mpsc::channel();
    let t0 = Instant::now();
    std::thread::spawn(move || {
        let r = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| f(&ctx)));
        let _ = tx.send(r);
    });
    let r = match rx.recv_timeout(Duration::from_secs(def.timeout_s)) {
        Ok(Ok(Ok(r))) => r,
        Ok(Ok(Err(m))) => R { status: Status::Fail, note: m, data: Value::Null },
        Ok(Err(_)) => R { status: Status::Fail, note: "test panicked".into(), data: Value::Null },
        Err(_) => R {
            status: Status::Fail,
            note: format!("hard timeout after {}s", def.timeout_s),
            data: Value::Null,
        },
    };
    let elapsed = t0.elapsed();
    cleanup_processes(&dir);
    json!({
        "name": def.name,
        "status": r.status.as_str(),
        "durationMs": ms(elapsed),
        "expect": def.expect,
        "note": r.note,
        "data": r.data,
    })
}

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    if args.first().map(String::as_str) == Some("--role") {
        run_role(&args[1..]);
    }
    let mut out = PathBuf::from(".");
    let mut only: Option<Vec<String>> = None;
    let mut list = false;
    let mut i = 0;
    while i < args.len() {
        match args[i].as_str() {
            "--out" => {
                i += 1;
                out = PathBuf::from(args.get(i).cloned().unwrap_or_default());
            }
            "--only" => {
                i += 1;
                only = args.get(i).map(|s| s.split(',').map(|x| x.to_string()).collect());
            }
            "--list" => list = true,
            "-h" | "--help" => {
                println!("fgos-platform-probe [--out DIR] [--only a,b] [--list]");
                return;
            }
            other => {
                eprintln!("unknown argument: {other}");
                std::process::exit(2);
            }
        }
        i += 1;
    }
    let tests = all_tests();
    if list {
        for t in &tests {
            println!("{}", t.name);
        }
        return;
    }
    let exe = std::env::current_exe().expect("current_exe");
    let root = std::env::temp_dir().join(format!("fgos-probe-{}", std::process::id()));
    let _ = std::fs::create_dir_all(&root);
    let started = Instant::now();
    let started_unix = SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0);

    let os = std::env::consts::OS;
    println!("fgos-platform-probe {} on {} {}", env!("CARGO_PKG_VERSION"), os, std::env::consts::ARCH);
    let mut results = vec![];
    for t in tests.iter().filter(|t| only.as_ref().is_none_or(|o| o.iter().any(|n| n == t.name))) {
        let r = run_one(t, &root, &exe);
        println!(
            "[{:<4}] {:<42} {:>9} ms  {}",
            r["status"].as_str().unwrap_or("?").to_uppercase(),
            t.name,
            r["durationMs"],
            r["note"].as_str().unwrap_or("")
        );
        results.push(r);
    }
    let count = |s: &str| results.iter().filter(|r| r["status"] == s).count();
    let git_version = {
        let mut c = std::process::Command::new("git");
        c.arg("--version");
        run_capture(c, secs(10)).map(|(_, s)| s.trim().to_string())
    };
    let report = json!({
        "probe": "fgos-platform-probe",
        "version": env!("CARGO_PKG_VERSION"),
        "os": os,
        "arch": std::env::consts::ARCH,
        "osVersion": plat::os_version(),
        "tempDirFilesystem": plat::fs_type(&root),
        "git": git_version,
        "startedUnix": started_unix,
        "durationMs": ms(started.elapsed()),
        "summary": {"pass": count("pass"), "fail": count("fail"), "skip": count("skip")},
        "tests": results,
    });
    for attempt in 0..5 {
        if std::fs::remove_dir_all(&root).is_ok() {
            break;
        }
        std::thread::sleep(Duration::from_millis(200 * (attempt + 1)));
    }
    std::fs::create_dir_all(&out).ok();
    let path = out.join(format!("probe-report-{os}.json"));
    match std::fs::write(&path, serde_json::to_string_pretty(&report).unwrap_or_default()) {
        Ok(()) => println!(
            "\npass={} fail={} skip={}  report: {}",
            count("pass"),
            count("fail"),
            count("skip"),
            path.display()
        ),
        Err(e) => {
            eprintln!("cannot write report {}: {e}\n{}", path.display(), report);
            std::process::exit(1);
        }
    }
    // Leaked test threads (hard timeouts) must not keep the process alive.
    std::process::exit(0);
}
