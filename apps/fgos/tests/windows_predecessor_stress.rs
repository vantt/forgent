//! The acceptance gate of the Windows predecessor rule: a contender must never
//! be admitted while a process of a dead holder's borrow is still running.
//!
//! It drives the shipped path. The holder is `fgos internal lock-hold` with a
//! `borrow` request for `git commit`; its pre-commit hook blocks on a named
//! event and reports its own and its ancestors' Windows pids; the keeper is
//! the real `job-keeper` role; the contender is an in-process `acquire`
//! through the crate's own predecessor rule. The moment `acquire` returns, the
//! test judges every pid that was ever in the borrow with its own
//! `SYNCHRONIZE` handle. Every test is `#[ignore]`: run it on purpose,
//!
//! ```text
//! cargo test --release -p fgos --test windows_predecessor_stress -- --ignored --test-threads=1
//! ```
//!
//! `HL_STRESS_REPEATS` (default 500) sets the repeats per scenario and
//! `HL_STRESS_OUT` names the JSON report. `FGOS_STRESS_FGOS_BIN` names the
//! `fgos.exe` to use as the holder when the baked-in build path is not there
//! (an exe copied to another machine). All three are read by this file only.
#![cfg(windows)]

mod windows_support;

use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};

use fgos_holder_lock::borrow_vectors::{git_env, init_repo};
use fgos_holder_lock::predecessor::record_path;
use fgos_holder_lock::{acquire_with_trace, release, Acquire, Mode, Resource, Wait};
use serde_json::{json, Value};
use windows_sys::Win32::Foundation::{CloseHandle, HANDLE};
use windows_sys::Win32::System::Threading::{CreateEventW, OpenEventW, OpenProcess, SetEvent, TerminateProcess, WaitForSingleObject, PROCESS_TERMINATE};
use windows_support::{children_of, ended, sh_path, temp_dir, wait_for_json, Hold};

const KILL_WAIT_MS: u64 = 2000;
const WARMUP_REPEATS: usize = 20;
/// The longest a hook waits for its event before giving up on its own.
const HOOK_WAIT_MS: u32 = 120_000;
/// `SYNCHRONIZE`, the access a hook needs to wait on the event.
const EVENT_SYNCHRONIZE: u32 = 0x0010_0000;

fn repeats() -> usize {
    std::env::var("HL_STRESS_REPEATS").ok().and_then(|v| v.parse().ok()).unwrap_or(500)
}

fn wide(text: &str) -> Vec<u16> {
    text.encode_utf16().chain(std::iter::once(0)).collect()
}

/// The holder executable: the build's own `fgos`, or the override.
fn holder_exe() -> PathBuf {
    std::env::var_os("FGOS_STRESS_FGOS_BIN").map(PathBuf::from).unwrap_or_else(windows_support::fgos)
}

/// The role a hook runs: report the pid chain, then wait for the event.
/// Without the environment it is not a hook and does nothing.
#[test]
#[ignore]
fn hook_wait_role() {
    let (Ok(event), Ok(report)) = (std::env::var("HL_STRESS_EVENT"), std::env::var("HL_STRESS_REPORT")) else { return };
    let chain: Vec<u32> = fgos_process::platform::windows_job::ancestor_chain().into_iter().map(|(pid, _)| pid).collect();
    let body = json!({ "hook": std::process::id(), "chain": chain }).to_string();
    let tmp = format!("{report}.tmp");
    fs::write(&tmp, body).unwrap();
    fs::rename(&tmp, &report).unwrap();
    // SAFETY: opening the named event this run created, then waiting on it.
    unsafe {
        let handle = OpenEventW(EVENT_SYNCHRONIZE, 0, wide(&event).as_ptr());
        if !handle.is_null() {
            WaitForSingleObject(handle, HOOK_WAIT_MS);
            CloseHandle(handle);
        }
    }
}

/// A named manual-reset event, signaled on drop so no hook outlives a repeat.
struct Event {
    handle: HANDLE,
    name: String,
}

impl Event {
    fn create(name: String) -> Event {
        // SAFETY: a manual-reset, initially unsignaled event with a name.
        let handle = unsafe { CreateEventW(std::ptr::null(), 1, 0, wide(&name).as_ptr()) };
        assert!(!handle.is_null(), "CreateEventW failed");
        Event { handle, name }
    }
}

impl Drop for Event {
    fn drop(&mut self) {
        // SAFETY: the handle this struct created.
        unsafe {
            SetEvent(self.handle);
            CloseHandle(self.handle);
        }
    }
}

fn terminate(pid: u32) {
    // SAFETY: opening a process for termination and ending it.
    unsafe {
        let handle = OpenProcess(PROCESS_TERMINATE, 0, pid);
        if !handle.is_null() {
            TerminateProcess(handle, 1);
            CloseHandle(handle);
        }
    }
}

struct Rig {
    dir: PathBuf,
    repo: PathBuf,
    resource: Resource,
}

/// What one repeat saw.
struct Repeat {
    wait_ms: f64,
    job_opened: bool,
    named_by_one_source_only: bool,
    violations: Vec<Value>,
}

#[derive(Clone, Copy, PartialEq)]
enum Scenario {
    HolderOnly,
    AllOwnersDead,
    DyingJobOpen(Duration),
}

impl Rig {
    fn new(tag: &str) -> Rig {
        let dir = temp_dir(tag);
        let repo = dir.join("repo");
        init_repo(Path::new("git"), &repo).unwrap();
        let exe = std::env::current_exe().unwrap();
        let hook = format!("#!/bin/sh\n'{}' --exact hook_wait_role --ignored --nocapture >/dev/null 2>&1\nexit 0\n", sh_path(&exe));
        fs::write(repo.join(".git/hooks/pre-commit"), hook).unwrap();
        Rig { resource: Resource::new("stress", dir.join("stress.lock")), dir, repo }
    }

    fn one(&self, round: usize, scenario: Scenario) -> Repeat {
        let event = Event::create(format!("Local\\fgos-stress-{}-{round}", std::process::id()));
        let report = self.dir.join(format!("hook-{round}.json"));
        let _ = fs::remove_file(&report);
        let work = self.dir.join(format!("work-{round}"));
        let holder_exe = holder_exe();
        let mut hold = Hold::start_with(&holder_exe, &self.resource.path, &work, KILL_WAIT_MS).expect("the holder acquires");
        let mut env: BTreeMap<String, String> = std::env::vars().collect();
        env.extend(git_env());
        env.insert("HL_STRESS_EVENT".into(), event.name.clone());
        env.insert("HL_STRESS_REPORT".into(), report.to_string_lossy().into_owned());
        let repo = self.repo.to_string_lossy().into_owned();
        hold.request(json!({
            "op": "borrow",
            "argv": ["git", "-C", repo, "commit", "-q", "--allow-empty", "-m", "stress"],
            "cwd": repo,
            "env": env,
            "stdin": "null",
        }));
        let hook = wait_for_json(&report, "the hook's report");
        let holder_pid = hold.child.id();
        let mut members: Vec<u32> = vec![hook["hook"].as_u64().unwrap() as u32];
        members.extend(hook["chain"].as_array().unwrap().iter().filter_map(Value::as_u64).map(|p| p as u32).take_while(|p| *p != holder_pid));
        let keepers = children_of(holder_pid, "fgos.exe");

        hold.kill();
        let resource = self.resource.clone();
        let judged = members.clone();
        let contender = std::thread::spawn(move || {
            let started = Instant::now();
            let (answer, trace) = acquire_with_trace(&resource, Mode::Ex, Wait::Ms(30_000), KILL_WAIT_MS);
            let waited = started.elapsed();
            let Acquire::Acquired(handle) = answer else { let why = format!("the contender was not admitted: {answer:?}; job opened: {}; named (pid, listed, scanned, tree): {:?}; hook pids: {:?}", trace.job_opened, trace.named, judged);
            return (waited, trace, Err(why)) };
            // As soon as acquire returns: every pid that was in the borrow.
            let still_running: Vec<u32> = judged.iter().copied().filter(|pid| ended(*pid) != Some(true)).collect();
            release(handle);
            (waited, trace, Ok(still_running))
        });
        match scenario {
            Scenario::HolderOnly => {}
            Scenario::AllOwnersDead => keepers.iter().for_each(|pid| terminate(*pid)),
            Scenario::DyingJobOpen(delay) => {
                std::thread::sleep(delay);
                keepers.iter().for_each(|pid| terminate(*pid));
            }
        }
        let (waited, trace, outcome) = contender.join().unwrap();
        drop(event);
        let still_running = match outcome {
            Ok(pids) => pids,
            Err(why) => panic!("round {round}: {why}"),
        };
        let sources = |pid: u32| -> Vec<&'static str> {
            let Some((_, list, scan, tree)) = trace.named.iter().find(|(p, ..)| *p == pid) else { return Vec::new() };
            [(*list, "job-list"), (*scan, "in-job-scan"), (*tree, "tree")].into_iter().filter(|(on, _)| *on).map(|(_, name)| name).collect()
        };
        let named_by_one_source_only = members.iter().any(|pid| sources(*pid).len() == 1);
        let violations = still_running.iter().map(|pid| json!({ "round": round, "pid": pid, "namedBy": sources(*pid) })).collect();
        let _ = fs::remove_file(record_path(&self.resource.path));
        Repeat { wait_ms: waited.as_secs_f64() * 1000.0, job_opened: trace.job_opened, named_by_one_source_only, violations }
    }
}

fn percentile(sorted: &[f64], p: f64) -> f64 {
    if sorted.is_empty() {
        return 0.0;
    }
    sorted[(((p / 100.0) * sorted.len() as f64).ceil() as usize).clamp(1, sorted.len()) - 1]
}

/// A cheap xorshift: the delay only has to vary, not be unpredictable.
struct Jitter(u64);

impl Jitter {
    fn next(&mut self) -> u64 {
        self.0 ^= self.0 << 13;
        self.0 ^= self.0 >> 7;
        self.0 ^= self.0 << 17;
        self.0
    }
}

/// Merge one scenario's numbers into the JSON report.
fn report(name: &str, entry: Value) {
    let Some(out) = std::env::var_os("HL_STRESS_OUT").map(PathBuf::from) else {
        println!("{name}: {entry}");
        return;
    };
    let mut all: Value = fs::read_to_string(&out).ok().and_then(|text| serde_json::from_str(&text).ok()).unwrap_or_else(|| json!({ "scenarios": {} }));
    all["scenarios"][name] = entry;
    all["windows"] = json!(std::env::var("OS").unwrap_or_default());
    fs::write(&out, serde_json::to_string_pretty(&all).unwrap()).unwrap();
}

fn run(name: &str, make: impl Fn(&Rig, &mut Jitter, f64) -> Scenario) {
    let rig = Rig::new(name);
    let total = repeats();
    // The wait of a contender that finds a dead holder and a live job: the
    // keeper kill of `dying-job-open` is drawn from twice its median.
    let mut warm: Vec<f64> = (0..WARMUP_REPEATS).map(|i| rig.one(1_000_000 + i, Scenario::HolderOnly).wait_ms).collect();
    warm.sort_by(f64::total_cmp);
    let p50 = percentile(&warm, 50.0);
    let mut jitter = Jitter(0x9E37_79B9_7F4A_7C15 ^ std::process::id() as u64);
    let mut waits = Vec::with_capacity(total);
    let (mut job_opened, mut one_source, mut violations) = (0usize, 0usize, Vec::new());
    for round in 0..total {
        let scenario = make(&rig, &mut jitter, p50);
        let seen = rig.one(round, scenario);
        waits.push(seen.wait_ms);
        job_opened += usize::from(seen.job_opened);
        one_source += usize::from(seen.named_by_one_source_only);
        violations.extend(seen.violations);
    }
    waits.sort_by(f64::total_cmp);
    let entry = json!({
        "repeats": total,
        "violations": violations.len(),
        "jobOpened": job_opened,
        "extraWaitMs": { "p50": percentile(&waits, 50.0), "p95": percentile(&waits, 95.0), "max": waits.last().copied().unwrap_or(0.0) },
        "warmupP50Ms": p50,
        "namedByOneSourceOnly": one_source,
        "violationDetails": violations,
    });
    report(name, entry);
    if name == "dying-job-open" {
        assert!(job_opened * 2 >= total, "{name}: the job was opened in only {job_opened} of {total} repeats, so the scenario did not exercise the job source");
    }
    assert!(violations.is_empty(), "{name}: {} violation(s): {violations:?}", violations.len());
    let _ = fs::remove_dir_all(&rig.dir);
}

#[test]
#[ignore]
fn borrow_hook_predecessor_check() {
    run("borrow-hook-predecessor-check", |_, _, _| Scenario::HolderOnly);
}

#[test]
#[ignore]
fn all_owners_dead() {
    run("all-owners-dead", |_, _, _| Scenario::AllOwnersDead);
}

#[test]
#[ignore]
fn dying_job_open() {
    run("dying-job-open", |_, jitter, p50| {
        let bound = (2.0 * p50 * 1000.0) as u64;
        Scenario::DyingJobOpen(Duration::from_micros(jitter.next() % (bound + 1)))
    });
}
