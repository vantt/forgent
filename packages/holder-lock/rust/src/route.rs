//! `fgos internal <route>`: the host routes Node calls for what it cannot do
//! itself (flock, the state root, the process scan, the borrow vectors).
//! Contracts: `packages/holder-lock/contracts/internal-route.*.v1.json`.
//!
//! The host dispatches here before anything else in `main`, so no child
//! process of the host can inherit an fd 3 handed to a route; the first
//! thing [`main`] does is set close-on-exec on that slot.

use std::ffi::OsString;
use std::fs::File;
use std::path::{Path, PathBuf};

use serde_json::{json, Map, Value};

use crate::borrow_vectors::{self, RunError};
use crate::driver;
#[cfg(not(windows))]
use crate::port::{NotBorrowerReason, LOCK_FD_ENV};
use crate::port::{self, BorrowedCheck, DescriptionLock, Mode, Wait, BORROW_SLOT, DEFAULT_KILL_WAIT_MS};
use crate::state_root;

mod hold;

/// The protocol these routes speak.
pub const PROTOCOL: u64 = 1;

const EXIT_OK: i32 = 0;
const EXIT_USAGE: i32 = 2;
const EXIT_MISMATCH: i32 = 3;
const EXIT_NEGATIVE: i32 = 10;
const EXIT_TIMEOUT: i32 = 11;
const EXIT_UNAVAILABLE: i32 = 12;
const EXIT_INTERNAL: i32 = 70;

/// Set close-on-exec on slot 3 if it is open: a descriptor handed to a
/// route never reaches anything the route spawns.
fn seal_slot3() {
    #[cfg(unix)]
    {
        // SAFETY: fcntl only reads and sets descriptor flags; a closed slot
        // fails with EBADF and is left alone.
        unsafe {
            let flags = libc::fcntl(BORROW_SLOT as libc::c_int, libc::F_GETFD);
            if flags >= 0 {
                libc::fcntl(BORROW_SLOT as libc::c_int, libc::F_SETFD, flags | libc::FD_CLOEXEC);
            }
        }
    }
}

fn line(result: Option<&str>, fields: Value) -> String {
    let mut map = Map::new();
    map.insert("v".into(), json!(1));
    map.insert("protocol".into(), json!(PROTOCOL));
    if let Some(result) = result {
        map.insert("result".into(), json!(result));
    }
    if let Value::Object(extra) = fields {
        map.extend(extra);
    }
    Value::Object(map).to_string()
}

fn emit(result: Option<&str>, fields: Value, code: i32) -> i32 {
    println!("{}", line(result, fields));
    code
}

fn error(code: &str, message: &str, exit: i32) -> i32 {
    eprintln!("fgos internal: {code}: {message}");
    emit(Some("error"), json!({ "code": code, "message": message }), exit)
}

fn usage(message: &str) -> i32 {
    error("usage", message, EXIT_USAGE)
}

/// Flags of one route call: `--name value` pairs and bare switches, in order.
struct Flags {
    items: Vec<(String, Option<String>)>,
}

impl Flags {
    fn parse(args: &[String], takes_value: &[&str], switches: &[&str]) -> Result<Flags, String> {
        let mut items = Vec::new();
        let mut it = args.iter();
        while let Some(arg) = it.next() {
            if takes_value.contains(&arg.as_str()) {
                let value = it.next().ok_or_else(|| format!("{arg} needs a value"))?;
                items.push((arg.clone(), Some(value.clone())));
            } else if switches.contains(&arg.as_str()) {
                items.push((arg.clone(), None));
            } else {
                return Err(format!("unknown argument {arg}"));
            }
        }
        Ok(Flags { items })
    }

    fn values(&self, name: &str) -> Vec<&str> {
        self.items.iter().filter(|(n, _)| n == name).filter_map(|(_, v)| v.as_deref()).collect()
    }

    fn one(&self, name: &str) -> Result<Option<&str>, String> {
        let values = self.values(name);
        match values.len() {
            0 => Ok(None),
            1 => Ok(Some(values[0])),
            _ => Err(format!("{name} given more than once")),
        }
    }

    fn has(&self, name: &str) -> bool {
        self.items.iter().any(|(n, _)| n == name)
    }
}

fn positive_ms(raw: &str, flag: &str, min: u64) -> Result<u64, String> {
    raw.parse::<u64>().ok().filter(|n| *n >= min).ok_or_else(|| format!("{flag} needs an integer >= {min}, got {raw}"))
}

/// `fgos internal <route> ...`. `args` are the arguments after `internal`.
/// Returns the process exit code; prints exactly one JSON line on stdout.
pub fn main(args: &[OsString]) -> i32 {
    seal_slot3();
    let mut strings = Vec::with_capacity(args.len());
    for arg in args {
        match arg.to_str() {
            Some(s) => strings.push(s.to_string()),
            None => return usage("arguments must be UTF-8"),
        }
    }
    let Some((route, rest)) = strings.split_first() else {
        return usage("fgos internal <lock-fd|lock-hold|state-root|process-observe|quiesce-scan|lock-borrow-vectors> --protocol 1 ...");
    };
    // The protocol is checked before anything else about the call, so a
    // payload of another release always learns that first.
    let mut protocol: Option<&str> = None;
    let mut others = Vec::with_capacity(rest.len());
    let mut it = rest.iter();
    while let Some(arg) = it.next() {
        if arg == "--protocol" {
            protocol = it.next().map(String::as_str);
        } else {
            others.push(arg.clone());
        }
    }
    if protocol != Some("1") {
        let message = format!("this host speaks internal protocol {PROTOCOL}; the call asked for {}", protocol.unwrap_or("none"));
        return error("host-version-mismatch", &message, EXIT_MISMATCH);
    }
    match route.as_str() {
        "lock-fd" => lock_fd(&others),
        "lock-hold" => lock_hold(&others),
        "state-root" => state_root_route(&others),
        "process-observe" => process_observe(&others),
        "quiesce-scan" => quiesce_scan(&others),
        "lock-borrow-vectors" => lock_borrow_vectors(&others),
        other => usage(&format!("unknown internal route {other}")),
    }
}

fn take_slot3() -> std::io::Result<File> {
    fgos_process::control::take_inherited(fgos_process::FdSlot(BORROW_SLOT))
}

fn lock_fd(args: &[String]) -> i32 {
    let flags = match Flags::parse(args, &["--wait-ms", "--borrowed-check", "--guarantee", "--probe", "--predecessor-state", "--kill-wait-ms", "--predecessor"], &["--try", "--shared-try"]) {
        Ok(flags) => flags,
        Err(message) => return usage(&message),
    };
    let modes: Vec<&str> = ["--try", "--wait-ms", "--shared-try", "--borrowed-check", "--guarantee", "--probe", "--predecessor-state"].into_iter().filter(|m| flags.has(m)).collect();
    if modes.len() != 1 || flags.items.iter().filter(|(n, _)| modes.contains(&n.as_str())).count() != 1 {
        return usage("exactly one of --try, --wait-ms N, --shared-try, --borrowed-check <path>, --guarantee <path>, --probe <path>, --predecessor-state <lockFile>");
    }
    let mode = modes[0];
    if mode != "--try" && mode != "--wait-ms" && (flags.has("--kill-wait-ms") || flags.has("--predecessor")) {
        return usage("--kill-wait-ms and --predecessor apply only to --try and --wait-ms");
    }
    let parsed = (|| -> Result<(Option<u64>, u64, Option<PathBuf>), String> {
        let wait = flags.one("--wait-ms")?.map(|raw| positive_ms(raw, "--wait-ms", 1)).transpose()?;
        let kill_wait = flags.one("--kill-wait-ms")?.map(|raw| positive_ms(raw, "--kill-wait-ms", 0)).transpose()?.unwrap_or(DEFAULT_KILL_WAIT_MS);
        let predecessor = flags.one("--predecessor")?.map(PathBuf::from);
        Ok((wait, kill_wait, predecessor))
    })();
    let (wait_ms, kill_wait_ms, predecessor) = match parsed {
        Ok(p) => p,
        Err(message) => return usage(&message),
    };
    if mode == "--guarantee" {
        let target = PathBuf::from(flags.values("--guarantee")[0]);
        let dir = if target.is_dir() { target } else { target.parent().map(Path::to_path_buf).unwrap_or(target) };
        return emit(Some("guarantee"), json!({ "guarantee": port::guarantee(&dir).to_json() }), EXIT_OK);
    }
    if mode == "--predecessor-state" {
        return predecessor_state(Path::new(flags.values("--predecessor-state")[0]));
    }
    let drv = driver::current();
    if mode == "--probe" {
        // A fresh open and a non-blocking shared try, closed at once: it
        // never obstructs a holder and needs no descriptor from the caller.
        if !drv.supported() {
            return emit(Some("unavailable"), json!({ "reason": "unsupported-platform", "detail": drv.unsupported_detail() }), EXIT_UNAVAILABLE);
        }
        let path = PathBuf::from(flags.values("--probe")[0]);
        return match port::probe(&port::Resource::new(path.file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_default(), &path)) {
            Ok(port::Probe::Free) => emit(Some("free"), json!({}), EXIT_OK),
            Ok(port::Probe::Held) => emit(Some("held"), json!({ "reason": "kernel-lock-held" }), EXIT_NEGATIVE),
            Err(err) => error("io", &format!("probe {}: {err}", path.display()), EXIT_INTERNAL),
        };
    }
    if mode == "--borrowed-check" {
        let lock_path = PathBuf::from(flags.values("--borrowed-check")[0]);
        if !drv.supported() {
            return emit(Some("unavailable"), json!({ "reason": "unsupported-platform", "detail": drv.unsupported_detail() }), EXIT_UNAVAILABLE);
        }
        #[cfg(windows)]
        let answer = {
            let env = std::env::var(crate::LOCK_JOB_ENV).ok();
            crate::borrowed_check_job(&lock_path, env.as_deref())
        };
        #[cfg(not(windows))]
        let answer = {
            let file = match take_slot3() {
                Ok(file) => file,
                Err(_) => return emit(Some("not-borrower"), json!({ "reason": NotBorrowerReason::FdMissing.as_str() }), EXIT_NEGATIVE),
            };
            let env = std::env::var(LOCK_FD_ENV).ok();
            port::borrowed_check(&file, &lock_path, env.as_deref(), BORROW_SLOT)
        };
        return match answer {
            BorrowedCheck::Borrower => emit(Some("borrower"), json!({}), EXIT_OK),
            BorrowedCheck::NotBorrower(reason) => emit(Some("not-borrower"), json!({ "reason": reason.as_str() }), EXIT_NEGATIVE),
        };
    }
    if !drv.supported() {
        return emit(Some("unavailable"), json!({ "reason": "unsupported-platform", "detail": drv.unsupported_detail() }), EXIT_UNAVAILABLE);
    }
    let file = match take_slot3() {
        Ok(file) => file,
        Err(err) => return error("io", &format!("fd 3 is not an open lock file: {err}"), EXIT_INTERNAL),
    };
    match drv.file_guarantee(&file) {
        Ok(g) if !g.usable() => return emit(Some("unavailable"), json!({ "reason": "unsupported-filesystem", "detail": g.notes.join("; ") }), EXIT_UNAVAILABLE),
        Ok(_) => {}
        Err(err) => return emit(Some("unavailable"), json!({ "reason": "io-error", "detail": format!("fstatfs fd 3: {err}") }), EXIT_UNAVAILABLE),
    }
    if mode == "--shared-try" {
        return match port::lock_description(&file, Mode::Sh, Wait::Try) {
            Ok(DescriptionLock::Locked) => emit(Some("free"), json!({}), EXIT_OK),
            Ok(_) => emit(Some("held"), json!({ "reason": "kernel-lock-held" }), EXIT_NEGATIVE),
            Err(err) => error("io", &format!("flock fd 3: {err}"), EXIT_INTERNAL),
        };
    }
    let wait = wait_ms.map(Wait::Ms).unwrap_or(Wait::Try);
    match port::lock_description(&file, Mode::Ex, wait) {
        Ok(DescriptionLock::Locked) => {}
        Ok(DescriptionLock::Held) => return emit(Some("held"), json!({ "reason": "kernel-lock-held" }), EXIT_NEGATIVE),
        Ok(DescriptionLock::Timeout { waited_ms }) => return emit(Some("timeout"), json!({ "waitedMs": waited_ms }), EXIT_TIMEOUT),
        Err(err) => return error("io", &format!("flock fd 3: {err}"), EXIT_INTERNAL),
    }
    // The kernel lock now lives on the caller's description. Any answer
    // other than `acquired` tells the caller to close it, which releases it;
    // this helper never calls LOCK_UN.
    let lock_path = match predecessor {
        Some(record) => record,
        None => match drv.description_path(&file) {
            Ok(path) => crate::predecessor::record_path(&path),
            Err(err) => return error("io", &format!("cannot name the lock file behind fd 3: {err}"), EXIT_INTERNAL),
        },
    };
    match crate::predecessor::admit(&lock_path, std::time::Duration::from_millis(kill_wait_ms)) {
        crate::predecessor::Admit::Proceed => emit(Some("acquired"), json!({}), EXIT_OK),
        crate::predecessor::Admit::NotEmpty { domain } => {
            emit(Some("held"), json!({ "reason": "predecessor-domain-not-empty", "domain": domain }), EXIT_NEGATIVE)
        }
    }
}

/// `lock-fd --predecessor-state <lockFile>`: one reading of the contender view
/// on the record next to `lock_file`. Never kills, never edits the record.
fn predecessor_state(lock_file: &Path) -> i32 {
    use fgos_process::{domain_watch, DomainState};
    let record_path = crate::predecessor::record_path(lock_file);
    let text = match std::fs::read_to_string(&record_path) {
        Ok(text) => text,
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => return emit(Some("predecessor"), json!({ "state": "absent" }), EXIT_OK),
        Err(err) => return emit(Some("predecessor"), json!({ "state": "unknown", "reason": "record-unreadable", "detail": err.to_string() }), EXIT_OK),
    };
    let Ok(raw) = serde_json::from_str::<serde_json::Value>(&text) else {
        return emit(Some("predecessor"), json!({ "state": "unknown", "reason": "record-not-json", "domain": { "raw": text.chars().take(120).collect::<String>() } }), EXIT_OK);
    };
    let Some(domain) = crate::predecessor::parse_record(&raw) else {
        return emit(Some("predecessor"), json!({ "state": "unknown", "reason": "record-unknown-shape", "domain": raw }), EXIT_OK);
    };
    let named = crate::predecessor::domain_json(&domain);
    let mut watch = domain_watch(&domain);
    // A dead holder whose job is gone is judged by the process tree alone, and
    // that fallback needs two quiet polls in a row; a live member stays
    // "not empty" through every poll.
    let mut verdict = watch.is_empty();
    for _ in 0..2 {
        if verdict != DomainState::NotEmpty || watch.reason().is_some() {
            break;
        }
        std::thread::sleep(std::time::Duration::from_millis(50));
        verdict = watch.is_empty();
    }
    let state = match verdict {
        DomainState::Empty => "empty",
        DomainState::NotEmpty => "not-empty",
        DomainState::Unknown => "unknown",
    };
    let mut fields = json!({ "state": state, "domain": named });
    if state != "empty" {
        fields["reason"] = json!(watch.reason().unwrap_or(if state == "unknown" { "no-judge-on-this-platform" } else { "domain-has-live-members" }));
    }
    emit(Some("predecessor"), fields, EXIT_OK)
}

/// `lock-hold --path <lockFile> --mode ex|sh --work <dir> (--try | --wait-ms N)
/// [--kill-wait-ms K]`: the Windows helper that holds one lock for Node.
fn lock_hold(args: &[String]) -> i32 {
    let flags = match Flags::parse(args, &["--path", "--mode", "--work", "--wait-ms", "--kill-wait-ms"], &["--try"]) {
        Ok(flags) => flags,
        Err(message) => return usage(&message),
    };
    let parsed = (|| -> Result<hold::HoldArgs, String> {
        let path = flags.one("--path")?.ok_or("--path <lockFile> is required")?;
        let work = flags.one("--work")?.ok_or("--work <dir> is required")?;
        let mode = match flags.one("--mode")?.ok_or("--mode ex|sh is required")? {
            "ex" => Mode::Ex,
            "sh" => Mode::Sh,
            other => return Err(format!("--mode needs ex or sh, got {other}")),
        };
        let wait = match (flags.has("--try"), flags.one("--wait-ms")?) {
            (true, None) => Wait::Try,
            (false, Some(raw)) => Wait::Ms(positive_ms(raw, "--wait-ms", 1)?),
            _ => return Err("exactly one of --try, --wait-ms N is required".to_string()),
        };
        if flags.values("--try").len() > 1 {
            return Err("--try given more than once".to_string());
        }
        let kill_wait_ms = flags.one("--kill-wait-ms")?.map(|raw| positive_ms(raw, "--kill-wait-ms", 0)).transpose()?.unwrap_or(DEFAULT_KILL_WAIT_MS);
        Ok(hold::HoldArgs { path: PathBuf::from(path), mode, wait, kill_wait_ms, work: PathBuf::from(work) })
    })();
    #[cfg_attr(not(windows), allow(unused_variables))]
    let parsed = match parsed {
        Ok(parsed) => parsed,
        Err(message) => return usage(&message),
    };
    #[cfg(windows)]
    {
        match hold::watch_parent() {
            Ok(parent_gone) => hold::run(&parsed, parent_gone),
            Err(detail) => hold::parent_unopenable(&parsed, &detail),
        }
    }
    #[cfg(not(windows))]
    {
        emit(Some("unavailable"), json!({ "reason": "unsupported-platform", "detail": "lock-hold is the Windows helper; other platforms hand a descriptor to lock-fd" }), EXIT_UNAVAILABLE)
    }
}

fn state_root_route(args: &[String]) -> i32 {
    if let Some(extra) = args.first() {
        return usage(&format!("unknown argument {extra}"));
    }
    let (root, source) = state_root::state_root();
    let fields = json!({
        "stateRoot": root.to_string_lossy(),
        "lockRoot": root.join("locks").to_string_lossy(),
        "source": source.as_str(),
    });
    emit(None, fields, EXIT_OK)
}

/// `process-observe --pid N`: one look at `pid` by the process facts crate,
/// the same reading the Rust judge decides from. Node asks it where it has no
/// process table of its own to read (Windows creation time).
fn process_observe(args: &[String]) -> i32 {
    use fgos_process::facts::{observe, Observed, UnreadableCause};
    let flags = match Flags::parse(args, &["--pid"], &[]) {
        Ok(flags) => flags,
        Err(message) => return usage(&message),
    };
    let pid = match flags.one("--pid") {
        Ok(Some(raw)) => match raw.parse::<u32>() {
            Ok(pid) if pid > 0 => pid,
            _ => return usage(&format!("--pid needs a positive integer, got {raw}")),
        },
        Ok(None) => return usage("--pid N is required"),
        Err(message) => return usage(&message),
    };
    let fields = match observe(fgos_process::ProcId(pid)) {
        Observed::Absent => json!({ "state": "absent" }),
        Observed::Zombie => json!({ "state": "zombie" }),
        Observed::Live { start_time } => json!({ "state": "live", "startTime": start_time }),
        Observed::Unreadable(cause) => {
            let cause = match cause {
                UnreadableCause::DriverMissing => "driver-missing",
                UnreadableCause::Permission => "permission",
                UnreadableCause::Timeout => "timeout",
            };
            json!({ "state": "unreadable", "cause": cause })
        }
    };
    emit(None, fields, EXIT_OK)
}

fn lock_borrow_vectors(args: &[String]) -> i32 {
    let flags = match Flags::parse(args, &["--vector"], &["--keep-repo"]) {
        Ok(flags) => flags,
        Err(message) => return usage(&message),
    };
    let only: Vec<String> = flags.values("--vector").into_iter().map(str::to_string).collect();
    let ran = match crate::port::HelperExe::current() {
        Ok(helper) => borrow_vectors::run(Path::new("git"), &helper, &only, flags.has("--keep-repo")),
        Err(err) => Err(RunError::Unavailable(format!("the running executable is unknown: {err}"))),
    };
    let report = match ran {
        Ok(report) => report,
        Err(RunError::Usage(message)) => return usage(&message),
        Err(RunError::Unavailable(detail)) => return emit(Some("unavailable"), json!({ "detail": detail }), EXIT_UNAVAILABLE),
    };
    let pass = report.pass();
    let verdict = |ok: bool| if ok { "pass" } else { "fail" };
    let vectors: Vec<Value> = report
        .vectors
        .iter()
        .map(|v| json!({ "name": v.name, "result": verdict(v.pass), "elapsedMs": v.elapsed_ms, "detail": v.detail }))
        .collect();
    let mut fields = json!({
        "vectors": vectors,
        "sibling": { "result": verdict(report.sibling.0), "detail": report.sibling.1 },
        "gitVersion": report.git_version,
        "elapsedMs": report.elapsed_ms,
    });
    if report.elapsed_ms > 1000.0 {
        fields["detail"] = json!(format!("run took {} ms, over the 1000 ms budget", report.elapsed_ms));
    }
    if let Some(kept) = &report.kept {
        fields["keptRepo"] = json!(kept.to_string_lossy());
    }
    emit(Some(verdict(pass)), fields, if pass { EXIT_OK } else { EXIT_NEGATIVE })
}

fn quiesce_scan(args: &[String]) -> i32 {
    let flags = match Flags::parse(args, &["--root", "--exclude-pid"], &[]) {
        Ok(flags) => flags,
        Err(message) => return usage(&message),
    };
    let roots: Vec<PathBuf> = flags.values("--root").into_iter().map(PathBuf::from).collect();
    if roots.is_empty() {
        return usage("quiesce-scan needs at least one --root <path>");
    }
    let mut exclude = Vec::new();
    for raw in flags.values("--exclude-pid") {
        match raw.parse::<u32>() {
            Ok(pid) => exclude.push(pid),
            Err(_) => return usage(&format!("--exclude-pid needs a pid, got {raw}")),
        }
    }
    quiesce::scan(&roots, &exclude)
}

mod quiesce {
    use super::*;
    use fgos_process::facts::{scan as scan_processes, Scan, ScanFilter};

    /// A workspace root and every linked worktree of it.
    fn workspace_dirs(root: &Path) -> Vec<PathBuf> {
        let mut dirs = vec![root.canonicalize().unwrap_or_else(|_| root.to_path_buf())];
        let listing = std::process::Command::new("git")
            .arg("-C")
            .arg(root)
            .args(["worktree", "list", "--porcelain"])
            .stdin(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .output();
        if let Ok(out) = listing {
            for line in String::from_utf8_lossy(&out.stdout).lines() {
                if let Some(path) = line.strip_prefix("worktree ") {
                    let p = PathBuf::from(path);
                    let p = p.canonicalize().unwrap_or(p);
                    if !dirs.contains(&p) {
                        dirs.push(p);
                    }
                }
            }
        }
        dirs
    }

    /// The argv names a fgOS payload, or runs something inside the workspace
    /// (any argument that is a path under the root or one of its worktrees,
    /// including `--cwd <path>`).
    fn names_payload(argv: &[String], dirs: &[PathBuf], state_root: &Path) -> bool {
        let under = |arg: &str| {
            let p = Path::new(arg.split_once('=').map_or(arg, |(_, v)| v));
            p.is_absolute() && dirs.iter().any(|d| p.starts_with(d))
        };
        argv.iter().any(|arg| {
            let base = Path::new(arg).file_name().and_then(|n| n.to_str()).unwrap_or("");
            arg.ends_with("bin/fgos.mjs")
                || matches!(base, "fgos" | "fgos-runner" | "fgos-gateway")
                || Path::new(arg).starts_with(state_root.join("releases"))
                || under(arg)
        })
    }

    /// Whether a process whose cwd or environ could not be read may still be
    /// a fgOS process. Its argv stays readable without ptrace access: a
    /// session helper the user's own service manager runs without ptrace
    /// access (systemd's `(sd-pam)`) names neither node nor a fgOS binary and
    /// is not counted, or no systemd machine could ever scan clean. An
    /// unreadable argv says nothing, so it still counts.
    fn could_be_fgos(argv: Option<&[String]>) -> bool {
        let Some(argv) = argv else { return true };
        let Some(first) = argv.first() else { return false };
        let base = Path::new(first).file_name().and_then(|n| n.to_str()).unwrap_or("");
        let versioned_node = base.strip_prefix("node").is_some_and(|rest| rest.is_empty() || rest.starts_with(|c: char| c.is_ascii_digit() || c == '.' || c == '-' || c == 'j'));
        versioned_node || matches!(base, "bun" | "deno" | "fgos" | "fgos-runner" | "fgos-gateway")
    }

    /// Owner uid of `/proc/<pid>`: a process that made itself non-dumpable
    /// (ssh-agent, gpg-agent) shows as root and is another user's process
    /// for this scan.
    #[cfg(target_os = "linux")]
    fn same_user(pid: u32) -> bool {
        use std::os::unix::fs::MetadataExt;
        // SAFETY: geteuid has no preconditions.
        let me = unsafe { libc::geteuid() };
        std::fs::metadata(format!("/proc/{pid}")).map(|m| m.uid() == me).unwrap_or(false)
    }

    #[cfg(not(target_os = "linux"))]
    fn same_user(_pid: u32) -> bool {
        false
    }

    pub(super) fn scan(roots: &[PathBuf], exclude: &[u32]) -> i32 {
        if !cfg!(target_os = "linux") {
            return emit(Some("unavailable"), json!({ "processes": [], "unreadable": 0, "detail": "process scan is only implemented on Linux; a person confirms no fgOS process is left" }), EXIT_UNAVAILABLE);
        }
        // Inside a PID namespace (a sandbox) every process outside it is
        // invisible: a scan from there could only ever look clean.
        if !fgos_process::facts::pid_ns().is_initial {
            return emit(Some("unavailable"), json!({ "processes": [], "unreadable": 0, "detail": "the scan runs inside a PID namespace that hides the host's processes; run it from the host" }), EXIT_UNAVAILABLE);
        }
        let state_root = state_root::state_root().0;
        let per_root: Vec<(PathBuf, Vec<PathBuf>)> = roots.iter().map(|r| (r.clone(), workspace_dirs(r))).collect();
        let filter = ScanFilter { env_keys: vec![state_root::PINNED_ROOT_ENV.to_string()], include_self: false };
        let views = match scan_processes(&filter) {
            Scan::Views(views) => views,
            Scan::Unsupported => {
                return emit(Some("unavailable"), json!({ "processes": [], "unreadable": 0, "detail": "process scan unsupported here" }), EXIT_UNAVAILABLE)
            }
        };
        let mut processes = Vec::new();
        let mut unreadable = 0u32;
        for view in views {
            if exclude.contains(&view.pid.0) {
                continue;
            }
            let argv = view.cmdline.clone().unwrap_or_default();
            // A process working in a given workspace is attributed to it; one
            // that only carries the machine-wide pinned state root is a fgOS
            // process of some workspace and blocks a stop-everything cutover
            // all the same, without a root.
            let mut hit: Option<(&str, Option<&Path>)> = None;
            for (root, dirs) in &per_root {
                if view.cwd.as_deref().is_some_and(|cwd| dirs.iter().any(|d| cwd.starts_with(d))) {
                    hit = Some(("cwd", Some(root.as_path())));
                } else if names_payload(&argv, dirs, &state_root) {
                    hit = Some(("cmdline", Some(root.as_path())));
                }
                if hit.is_some() {
                    break;
                }
            }
            if hit.is_none() && view.env_subset.contains_key(state_root::PINNED_ROOT_ENV) {
                hit = Some(("environ", None));
            }
            match hit {
                Some((matched, root)) => processes.push(json!({
                    "pid": view.pid.0,
                    "startTime": view.tuple.as_ref().map(|t| t.start_time.clone()),
                    "cwd": view.cwd.as_ref().map(|c| c.to_string_lossy().into_owned()),
                    "cmdline": argv.join(" "),
                    "matched": matched,
                    "root": root.map(|r| r.to_string_lossy().into_owned()),
                })),
                None if !view.unreadable.is_empty() && same_user(view.pid.0) && could_be_fgos(view.cmdline.as_deref()) => unreadable += 1,
                None => {}
            }
        }
        let clean = processes.is_empty() && unreadable == 0;
        emit(
            Some(if clean { "clean" } else { "processes" }),
            json!({ "processes": processes, "unreadable": unreadable }),
            if clean { EXIT_OK } else { EXIT_NEGATIVE },
        )
    }

    #[cfg(test)]
    mod tests {
        use super::could_be_fgos;

        fn argv(parts: &[&str]) -> Vec<String> {
            parts.iter().map(|p| p.to_string()).collect()
        }

        #[test]
        fn an_unreadable_process_counts_only_when_its_argv_could_be_fgos() {
            assert!(could_be_fgos(None), "no argv at all says nothing");
            assert!(could_be_fgos(Some(&argv(&["node", "bin/fgos.mjs"]))));
            assert!(could_be_fgos(Some(&argv(&["/usr/bin/node", "--test", "x.mjs"]))));
            assert!(could_be_fgos(Some(&argv(&["/opt/fgos/bin/fgos", "run"]))));
            assert!(could_be_fgos(Some(&argv(&["fgos-gateway"]))));
            assert!(could_be_fgos(Some(&argv(&["nodejs"]))));
            assert!(could_be_fgos(Some(&argv(&["/usr/bin/node20", "x.mjs"]))));
            assert!(could_be_fgos(Some(&argv(&["node-22"]))));
            assert!(could_be_fgos(Some(&argv(&["bun", "run"]))));
            assert!(could_be_fgos(Some(&argv(&["deno", "run"]))));
            assert!(!could_be_fgos(Some(&argv(&["nodemon"]))), "a name that only starts with node is something else");
            assert!(!could_be_fgos(Some(&argv(&["(sd-pam)"]))), "systemd's session helper");
            assert!(!could_be_fgos(Some(&argv(&[]))), "a zombie or kernel thread has an empty argv");
        }
    }
}
