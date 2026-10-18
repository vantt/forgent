//! `fgos internal lock-hold`: the Windows cold-path helper for Node, which
//! cannot call `LockFileEx`. One helper per held lock. It takes the lock in
//! its own process, tells Node through `ready.json` in a private work
//! directory, and keeps the lock until its parent is gone or Node terminates
//! it. Node and the helper talk through files only (contract
//! `internal-route.lock-hold.v1.json`), never through stdin, so synchronous
//! Node code can wait without a turning event loop.
//!
//! `borrow` and `cancel` requests run a borrowed child inside a job (`crate::borrow_windows`).
//!
//! The loop is written over a "parent gone" wait, so the platform part is
//! only how that wait is implemented (a `SYNCHRONIZE` handle on Windows).

#![cfg_attr(not(windows), allow(dead_code))]

use std::collections::BTreeSet;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::time::Duration;

use serde_json::{json, Value};

use super::{line, EXIT_INTERNAL, EXIT_NEGATIVE, EXIT_OK, EXIT_TIMEOUT, EXIT_UNAVAILABLE};
use crate::port::{self, Acquire, Mode, Resource, Wait};

/// How often the helper looks for requests and for its parent's death.
const TICK: Duration = Duration::from_millis(5);

/// The arguments of one `lock-hold` call, already validated.
pub(super) struct HoldArgs {
    pub path: PathBuf,
    pub predecessor_kinds: Vec<String>,
    pub mode: Mode,
    pub wait: Wait,
    pub kill_wait_ms: u64,
    pub work: PathBuf,
}

/// Write `name` in `dir` as a temp file, then rename it into place, so a
/// reader never sees a partial file.
fn write_atomic(dir: &Path, name: &str, text: &str) -> io::Result<()> {
    let tmp = dir.join(format!("{name}.tmp"));
    fs::write(&tmp, text)?;
    fs::rename(&tmp, dir.join(name))
}

fn write_ready(work: &Path, result: &str, fields: Value) -> io::Result<()> {
    let mut fields = fields;
    fields["helperPid"] = json!(std::process::id());
    write_atomic(work, "ready.json", &line(Some(result), fields))
}

/// The helper could not open its parent: answer `unavailable` and hold
/// nothing, because without the parent handle nothing would ever free the lock.
pub(super) fn parent_unopenable(args: &HoldArgs, detail: &str) -> i32 {
    answer_unavailable(&args.work, "parent-unopenable", detail)
}

fn answer_unavailable(work: &Path, reason: &str, detail: &str) -> i32 {
    match write_ready(work, "unavailable", json!({ "reason": reason, "detail": detail })) {
        Ok(()) => EXIT_UNAVAILABLE,
        Err(err) => ready_failed(&err),
    }
}

fn ready_failed(err: &io::Error) -> i32 {
    eprintln!("fgos internal lock-hold: cannot write ready.json: {err}");
    EXIT_INTERNAL
}

/// `req-<n>.json` -> `n`. Temp files and anything else do not match.
fn request_number(name: &str) -> Option<u64> {
    let digits = name.strip_prefix("req-")?.strip_suffix(".json")?;
    if digits.is_empty() || !digits.bytes().all(|b| b.is_ascii_digit()) {
        return None;
    }
    digits.parse().ok()
}

/// The numbers of the requests not seen before, in order.
fn new_requests(work: &Path, seen: &mut BTreeSet<u64>) -> Vec<u64> {
    let Ok(entries) = fs::read_dir(work) else { return Vec::new() };
    let mut pending: Vec<u64> = entries
        .filter_map(|entry| request_number(&entry.ok()?.file_name().to_string_lossy()))
        .filter(|n| !seen.contains(n))
        .collect();
    pending.sort_unstable();
    seen.extend(pending.iter().copied());
    pending
}

fn answer(work: &Path, n: u64, body: Value) {
    let _ = write_atomic(work, &format!("result-{n}.json"), &body.to_string());
}

/// The one borrow in flight, if any.
#[cfg(not(windows))]
struct Flight;

#[cfg(not(windows))]
impl Flight {
    fn none() -> Self {
        Flight
    }

    fn cancel(&self) {}
}

/// Borrowing is Windows-only: elsewhere every request is refused by name.
#[cfg(not(windows))]
fn serve<'scope, 'env>(work: &'env Path, seen: &mut BTreeSet<u64>, _handle: &'env port::Handle, _flight: &mut Flight, _scope: &'scope std::thread::Scope<'scope, 'env>) {
    for n in new_requests(work, seen) {
        answer(work, n, json!({ "error": "borrow-unsupported" }));
    }
}

#[cfg(windows)]
use borrow::{serve, Flight};

#[cfg(windows)]
mod borrow {
    //! Requests that run a borrowed child (`borrow`) or end it (`cancel`).
    //! One borrow runs at a time, on its own thread, so the helper keeps
    //! watching its parent and its request directory while the child runs.

    use std::collections::{BTreeMap, BTreeSet};
    use std::fs;
    use std::path::{Path, PathBuf};
    use std::sync::atomic::{AtomicBool, Ordering};
    use std::sync::Arc;

    use serde_json::{json, Value};

    use super::{answer, new_requests, write_atomic};
    use crate::borrow_windows::{self, BorrowControl};
    use crate::port::{self, BorrowError, BorrowSpec, BorrowStdio, HelperExe};

    /// The borrow running now: its request number, a cancel flag, and a flag
    /// its thread sets when it has written its result.
    pub(in crate::route) struct Flight {
        running: Option<(u64, Arc<AtomicBool>, Arc<AtomicBool>)>,
        /// A borrow ended with processes it could not end: its record still
        /// names them, so no new borrow may overwrite that record.
        unemptied: Arc<AtomicBool>,
    }

    impl Flight {
        pub(in crate::route) fn none() -> Self {
            Flight { running: None, unemptied: Arc::new(AtomicBool::new(false)) }
        }

        /// End the running borrow's job at once (parent death, `cancel`).
        pub(in crate::route) fn cancel(&self) {
            if let Some((_, cancel, _)) = &self.running {
                cancel.store(true, Ordering::SeqCst);
            }
        }

        fn busy(&mut self) -> bool {
            if self.running.as_ref().is_some_and(|(_, _, done)| done.load(Ordering::SeqCst)) {
                self.running = None;
            }
            self.running.is_some()
        }
    }

    /// The borrow a `borrow` request describes.
    fn parse_borrow(request: &Value, work: &Path, n: u64) -> Result<BorrowSpec, String> {
        let argv: Vec<String> = request
            .get("argv")
            .and_then(Value::as_array)
            .ok_or("argv must be an array of strings")?
            .iter()
            .map(|a| a.as_str().map(str::to_string).ok_or("argv must be an array of strings"))
            .collect::<Result<_, _>>()?;
        if argv.first().is_none_or(|program| program.is_empty()) {
            return Err("argv needs a program".into());
        }
        let cwd = match request.get("cwd") {
            None | Some(Value::Null) => None,
            Some(Value::String(cwd)) => Some(PathBuf::from(cwd)),
            Some(_) => return Err("cwd must be a string".into()),
        };
        let env: BTreeMap<String, String> = match request.get("env") {
            None | Some(Value::Null) => BTreeMap::new(),
            Some(Value::Object(map)) => map.iter().map(|(k, v)| v.as_str().map(|v| (k.clone(), v.to_string())).ok_or("env values must be strings")).collect::<Result<_, _>>()?,
            Some(_) => return Err("env must be a string map".into()),
        };
        if request.get("stdin").is_some_and(|s| s != "null") {
            return Err("stdin must be \"null\"".into());
        }
        Ok(BorrowSpec {
            argv,
            cwd,
            clear_env: request.get("env").is_some_and(|e| !e.is_null()),
            env,
            stdio: BorrowStdio::Files { out: work.join(format!("out-{n}.log")), err: work.join(format!("err-{n}.log")) },
        })
    }

    fn result_of(outcome: Result<port::BorrowOutcome, BorrowError>) -> Value {
        match outcome {
            Ok(o) => json!({ "exit": o.exit, "leftoversKilled": o.leftovers_killed }),
            Err(BorrowError::LeftoverNotKilled { outcome, pids }) => json!({ "error": "borrow-leftover-not-killed", "pids": pids, "exit": outcome.exit, "leftoversKilled": outcome.leftovers_killed }),
            Err(err @ BorrowError::Spawn(_)) => json!({ "error": "borrow-spawn-failed", "message": err.to_string() }),
            Err(err @ BorrowError::InvalidSpec(_)) => json!({ "error": "borrow-spec-invalid", "message": err.to_string() }),
            Err(err) => json!({ "error": "borrow-failed", "message": err.to_string() }),
        }
    }

    pub(in crate::route) fn serve<'scope, 'env>(work: &'env Path, seen: &mut BTreeSet<u64>, handle: &'env port::Handle, flight: &mut Flight, scope: &'scope std::thread::Scope<'scope, 'env>) {
        for n in new_requests(work, seen) {
            let request: Value = match fs::read_to_string(work.join(format!("req-{n}.json"))).ok().and_then(|text| serde_json::from_str(&text).ok()) {
                Some(request) => request,
                None => {
                    answer(work, n, json!({ "error": "request-unreadable" }));
                    continue;
                }
            };
            match request.get("op").and_then(Value::as_str) {
                Some("declare-domain") => {
                    // The supervisor cannot inherit LockFileEx. Its declaration
                    // must be acknowledged by this still-holding helper before
                    // GO; a dead helper therefore cannot authorize a late start.
                    let result = if flight.busy() {
                        json!({ "error": "borrow-busy" })
                    } else if let Some(domain) = crate::predecessor::parse_record(&request["domain"]) {
                        match port::validate(handle).map_err(std::io::Error::other).and_then(|()| handle.declare_domain(&domain)) {
                            Ok(()) => json!({ "result": "declared" }),
                            Err(err) => json!({ "error": "lock-domain-declaration-failed", "message": err.to_string() }),
                        }
                    } else { json!({ "error": "domain-invalid" }) };
                    answer(work, n, result);
                }
                Some("clear-domain") => {
                    let result = if flight.busy() {
                        json!({ "error": "borrow-busy" })
                    } else {
                        match handle.clear_domain() {
                            Ok(()) => json!({ "result": "cleared" }),
                            Err(err) => json!({ "error": "lock-domain-not-empty", "message": err.to_string() }),
                        }
                    };
                    answer(work, n, result);
                }
                Some("borrow") => {
                    if flight.busy() {
                        answer(work, n, json!({ "error": "borrow-busy" }));
                        continue;
                    }
                    if flight.unemptied.load(Ordering::SeqCst) {
                        answer(work, n, json!({ "error": "borrow-leftover-pending", "message": "an earlier borrow left processes the helper could not end" }));
                        continue;
                    }
                    let spec = match parse_borrow(&request, work, n) {
                        Ok(spec) => spec,
                        Err(message) => {
                            answer(work, n, json!({ "error": "borrow-spec-invalid", "message": message }));
                            continue;
                        }
                    };
                    let helper = match HelperExe::current() {
                        Ok(helper) => helper,
                        Err(err) => {
                            answer(work, n, json!({ "error": "borrow-spawn-failed", "message": err.to_string() }));
                            continue;
                        }
                    };
                    let cancel = Arc::new(AtomicBool::new(false));
                    let done = Arc::new(AtomicBool::new(false));
                    flight.running = Some((n, cancel.clone(), done.clone()));
                    let unemptied = flight.unemptied.clone();
                    scope.spawn(move || {
                        let started = |pid: u32| {
                            let _ = write_atomic(work, &format!("started-{n}.json"), &json!({ "pid": pid }).to_string());
                        };
                        let control = BorrowControl { cancel: Some(&cancel), on_started: Some(&started) };
                        let outcome = borrow_windows::run(handle, &spec, &helper, &control);
                        if matches!(outcome, Err(BorrowError::LeftoverNotKilled { .. })) {
                            unemptied.store(true, Ordering::SeqCst);
                        }
                        answer(work, n, result_of(outcome));
                        done.store(true, Ordering::SeqCst);
                    });
                }
                Some("cancel") => {
                    // `n` names the borrow to end; a cancel for one that is not
                    // running is stale and ignored.
                    if let (Some(target), Some((running, _, _))) = (request.get("n").and_then(Value::as_u64), &flight.running) {
                        if target == *running {
                            flight.cancel();
                        }
                    }
                }
                _ => answer(work, n, json!({ "error": "request-unknown" })),
            }
        }
    }
}

/// Take the lock, answer through `ready.json`, and hold it until
/// `parent_gone(tick)` reports the parent gone (it waits up to `tick` for
/// that). Returns the process exit code.
pub(super) fn run(args: &HoldArgs, mut parent_gone: impl FnMut(Duration) -> bool) -> i32 {
    let name = args.path.file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_default();
    let mut resource = Resource::new(name, &args.path);
    resource.predecessor_kinds = args.predecessor_kinds.clone();
    let handle = match port::acquire(&resource, args.mode, args.wait, args.kill_wait_ms) {
        Acquire::Acquired(handle) => handle,
        Acquire::Held { reason, domain } => {
            let fields = json!({ "reason": reason.as_str(), "domain": domain });
            return match write_ready(&args.work, "held", fields) {
                Ok(()) => EXIT_NEGATIVE,
                Err(err) => ready_failed(&err),
            };
        }
        Acquire::Timeout { waited_ms } => {
            return match write_ready(&args.work, "timeout", json!({ "waitedMs": waited_ms })) {
                Ok(()) => EXIT_TIMEOUT,
                Err(err) => ready_failed(&err),
            };
        }
        Acquire::Unavailable { reason, detail } => return answer_unavailable(&args.work, reason.as_str(), &detail),
    };
    if let Err(err) = write_ready(&args.work, "acquired", json!({})) {
        // `handle` drops here: nothing is held when this exits.
        return ready_failed(&err);
    }
    let mut seen = BTreeSet::new();
    // The scope joins a running borrow before the lock is released: on parent
    // death its job is ended at once and emptied (bounded by the kill wait).
    std::thread::scope(|scope| {
        let mut flight = Flight::none();
        loop {
            if parent_gone(TICK) {
                flight.cancel();
                break;
            }
            serve(&args.work, &mut seen, &handle, &mut flight, scope);
        }
    });
    // Unlock explicitly, then close: every borrow's domain is empty by now.
    port::release(handle);
    EXIT_OK
}

#[cfg(windows)]
pub(super) use win::watch_parent;

#[cfg(windows)]
mod win {
    use std::os::windows::io::AsRawHandle;
    use std::time::Duration;

    use windows_sys::Win32::Foundation::{CloseHandle, SetHandleInformation, FILETIME, HANDLE, HANDLE_FLAG_INHERIT, INVALID_HANDLE_VALUE, WAIT_OBJECT_0};
    use windows_sys::Win32::System::Diagnostics::ToolHelp::{CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W, TH32CS_SNAPPROCESS};
    use windows_sys::Win32::System::Threading::{GetCurrentProcess, GetCurrentProcessId, GetProcessTimes, OpenProcess, WaitForSingleObject, PROCESS_QUERY_LIMITED_INFORMATION};
    use windows_sys::Win32::Storage::FileSystem::SYNCHRONIZE;

    struct Owned(HANDLE);

    impl Drop for Owned {
        fn drop(&mut self) {
            // SAFETY: a handle this struct opened and owns.
            unsafe { CloseHandle(self.0) };
        }
    }

    impl Owned {
        /// Whether the process behind this handle has ended, waiting up to
        /// `tick` for that. A method, so a closure that calls it captures the
        /// whole owner (and its `Drop`), never just the raw handle inside.
        fn ended_within(&self, tick: Duration) -> bool {
            // SAFETY: waiting on an open handle with a bounded timeout.
            unsafe { WaitForSingleObject(self.0, tick.as_millis() as u32) == WAIT_OBJECT_0 }
        }
    }

    fn creation_time(process: HANDLE) -> Option<u64> {
        // SAFETY: four valid out-pointers for a handle with query access.
        unsafe {
            let (mut created, mut exited, mut kernel, mut user): (FILETIME, FILETIME, FILETIME, FILETIME) = std::mem::zeroed();
            (GetProcessTimes(process, &mut created, &mut exited, &mut kernel, &mut user) != 0).then(|| (u64::from(created.dwHighDateTime) << 32) | u64::from(created.dwLowDateTime))
        }
    }

    /// The parent's pid, from a Toolhelp snapshot.
    fn parent_pid() -> Option<u32> {
        // SAFETY: a process snapshot and a sized entry.
        unsafe {
            let snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
            if snap == INVALID_HANDLE_VALUE {
                return None;
            }
            let snap = Owned(snap);
            let me = GetCurrentProcessId();
            let mut entry: PROCESSENTRY32W = std::mem::zeroed();
            entry.dwSize = std::mem::size_of::<PROCESSENTRY32W>() as u32;
            let mut more = Process32FirstW(snap.0, &mut entry) != 0;
            while more {
                if entry.th32ProcessID == me {
                    return Some(entry.th32ParentProcessID);
                }
                more = Process32NextW(snap.0, &mut entry) != 0;
            }
            None
        }
    }

    /// Mark this process's own standard handles non-inheritable, so nothing
    /// reaches a later child (a git process) through them.
    fn seal_std_handles() {
        let handles = [std::io::stdin().as_raw_handle(), std::io::stdout().as_raw_handle(), std::io::stderr().as_raw_handle()];
        for handle in handles {
            if !handle.is_null() {
                // SAFETY: clearing one flag on a handle this process owns; a
                // handle that refuses is left as it is.
                unsafe { SetHandleInformation(handle as HANDLE, HANDLE_FLAG_INHERIT, 0) };
            }
        }
    }

    /// Open the parent for waiting. The parent is blocked waiting for this
    /// helper's `ready.json`, so its pid is not reused before the handle is
    /// open; a parent created after this process says the pid was recycled.
    /// The returned wait reports whether the parent is gone, waiting up to
    /// the given time for that.
    pub(in crate::route) fn watch_parent() -> Result<impl FnMut(Duration) -> bool, String> {
        seal_std_handles();
        let ppid = parent_pid().ok_or_else(|| "cannot read this process's parent from the process snapshot".to_string())?;
        // SAFETY: OpenProcess takes plain values and returns a handle or null.
        let raw = unsafe { OpenProcess(SYNCHRONIZE | PROCESS_QUERY_LIMITED_INFORMATION, 0, ppid) };
        if raw.is_null() {
            return Err(format!("OpenProcess on parent pid {ppid} failed: {}", std::io::Error::last_os_error()));
        }
        let parent = Owned(raw);
        // SAFETY: the pseudo handle of this process is always valid.
        let own = creation_time(unsafe { GetCurrentProcess() });
        if let (Some(parent_created), Some(own_created)) = (creation_time(parent.0), own) {
            if parent_created > own_created {
                return Err(format!("parent pid {ppid} was created after this process: the pid was reused"));
            }
        }
        Ok(move |tick: Duration| parent.ended_within(tick))
    }
}

#[cfg(all(test, unix))]
mod tests {
    use std::sync::atomic::{AtomicBool, Ordering};
    use std::sync::Arc;

    use super::*;
    use crate::port::{acquire, probe, Probe};

    fn temp(tag: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("fgos-hold-unit-{tag}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn args(dir: &Path, wait: Wait) -> HoldArgs {
        let work = dir.join("work");
        fs::create_dir_all(&work).unwrap();
        HoldArgs { predecessor_kinds: Vec::new(), path: dir.join("hold.lock"), mode: Mode::Ex, wait, kill_wait_ms: 100, work }
    }

    fn ready(work: &Path) -> Value {
        serde_json::from_str(&fs::read_to_string(work.join("ready.json")).expect("ready.json written")).unwrap()
    }

    #[test]
    fn it_holds_until_the_parent_is_gone_and_refuses_requests_by_name() {
        let dir = temp("hold");
        let args = args(&dir, Wait::Try);
        let gone = Arc::new(AtomicBool::new(false));
        let flag = gone.clone();
        let work = args.work.clone();
        let path = args.path.clone();
        let helper = std::thread::spawn(move || {
            run(&args, |tick| {
                std::thread::sleep(tick);
                flag.load(Ordering::SeqCst)
            })
        });
        let started = std::time::Instant::now();
        while !work.join("ready.json").exists() {
            assert!(started.elapsed() < Duration::from_secs(5), "ready.json never appeared");
            std::thread::sleep(Duration::from_millis(2));
        }
        let answer = ready(&work);
        assert_eq!(answer["result"], "acquired");
        assert_eq!(answer["protocol"], 1);
        assert_eq!(answer["helperPid"], std::process::id());
        assert_eq!(probe(&Resource::new("hold", &path)).unwrap(), Probe::Held);

        fs::write(work.join("req-2.json.tmp"), "{}").unwrap();
        fs::write(work.join("req-1.json"), "{}").unwrap();
        let started = std::time::Instant::now();
        while !work.join("result-1.json").exists() {
            assert!(started.elapsed() < Duration::from_secs(5), "request never answered");
            std::thread::sleep(Duration::from_millis(2));
        }
        let result: Value = serde_json::from_str(&fs::read_to_string(work.join("result-1.json")).unwrap()).unwrap();
        assert_eq!(result, json!({ "error": "borrow-unsupported" }));
        assert!(!work.join("result-2.json").exists(), "a temp file is not a request");

        gone.store(true, Ordering::SeqCst);
        assert_eq!(helper.join().unwrap(), EXIT_OK);
        assert_eq!(probe(&Resource::new("hold", &path)).unwrap(), Probe::Free);
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn a_held_lock_is_answered_held_and_the_helper_exits() {
        let dir = temp("held");
        let args = args(&dir, Wait::Try);
        let Acquire::Acquired(holder) = acquire(&Resource::new("hold", &args.path), Mode::Ex, Wait::Try, 100) else { panic!("holder") };
        let code = run(&args, |_| panic!("a helper that did not acquire never waits on its parent"));
        assert_eq!(code, EXIT_NEGATIVE);
        let answer = ready(&args.work);
        assert_eq!(answer["result"], "held");
        assert_eq!(answer["reason"], "kernel-lock-held");
        port::release(holder);
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn a_wait_that_runs_out_is_answered_timeout() {
        let dir = temp("timeout");
        let args = args(&dir, Wait::Ms(30));
        let Acquire::Acquired(holder) = acquire(&Resource::new("hold", &args.path), Mode::Ex, Wait::Try, 100) else { panic!("holder") };
        assert_eq!(run(&args, |_| panic!("no parent wait")), EXIT_TIMEOUT);
        let answer = ready(&args.work);
        assert_eq!(answer["result"], "timeout");
        assert!(answer["waitedMs"].as_u64().unwrap() >= 30);
        port::release(holder);
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn only_req_n_json_is_a_request() {
        assert_eq!(request_number("req-1.json"), Some(1));
        assert_eq!(request_number("req-12.json"), Some(12));
        assert_eq!(request_number("req-1.json.tmp"), None);
        assert_eq!(request_number("req-.json"), None);
        assert_eq!(request_number("req-+1.json"), None);
        assert_eq!(request_number("ready.json"), None);
    }
}
