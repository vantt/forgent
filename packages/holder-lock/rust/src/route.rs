//! `fgos internal <route>`: the host routes Node calls for what it cannot do
//! itself (flock, the state root, the process scan, the borrow vectors).
//! Contracts: `packages/holder-lock/contracts/internal-route.*.v1.json`.
//!
//! The host dispatches here before anything else in `main`, so no child
//! process of the host can inherit an fd 3 handed to a route; the first
//! thing [`main`] does is set close-on-exec on that slot.

use std::ffi::OsString;
#[cfg(not(windows))]
use std::fs::File;
use std::path::{Path, PathBuf};

use serde_json::{json, Map, Value};

use crate::borrow_vectors::{self, RunError};
use crate::driver;
#[cfg(not(windows))]
use crate::port::{NotBorrowerReason, BORROW_SLOT, LOCK_FD_ENV};
use crate::port::{BorrowedCheck, Mode, Wait, DEFAULT_KILL_WAIT_MS};

mod hold;

/// The protocol the lock routes speak (`lock-fd`, `lock-hold`,
/// `lock-borrow-vectors`). Protocol 1 was the first
/// release; a payload that still sends it is refused, and every answer
/// carries 2, so an older facade fails closed on either side.
pub const PROTOCOL: u64 = 2;

/// The protocol of `quiesce-scan`, a read-only scan its callers (the cutover
/// fence, `fgctl` activation) pin on their own. It does not move with the
/// lock-route protocol.
pub const SCAN_PROTOCOL: u64 = 1;

/// The protocol a route answers to and accepts.
fn protocol_of(route: &str) -> u64 {
    if route == "quiesce-scan" { SCAN_PROTOCOL } else { PROTOCOL }
}

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

fn line(protocol: u64, result: Option<&str>, fields: Value) -> String {
    let mut map = Map::new();
    map.insert("v".into(), json!(protocol));
    map.insert("protocol".into(), json!(protocol));
    if let Some(result) = result {
        map.insert("result".into(), json!(result));
    }
    if let Value::Object(extra) = fields {
        map.extend(extra);
    }
    Value::Object(map).to_string()
}

fn emit_as(protocol: u64, result: Option<&str>, fields: Value, code: i32) -> i32 {
    println!("{}", line(protocol, result, fields));
    code
}

fn emit(result: Option<&str>, fields: Value, code: i32) -> i32 {
    emit_as(PROTOCOL, result, fields, code)
}

fn error_as(protocol: u64, code: &str, message: &str, exit: i32) -> i32 {
    eprintln!("fgos internal: {code}: {message}");
    emit_as(protocol, Some("error"), json!({ "code": code, "message": message }), exit)
}

#[cfg(not(windows))]
fn error(code: &str, message: &str, exit: i32) -> i32 {
    error_as(PROTOCOL, code, message, exit)
}

fn usage_as(protocol: u64, message: &str) -> i32 {
    error_as(protocol, "usage", message, EXIT_USAGE)
}

fn usage(message: &str) -> i32 {
    usage_as(PROTOCOL, message)
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
        return usage("fgos internal <lock-fd|lock-hold|quiesce-scan|lock-borrow-vectors> --protocol 2 ...");
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
    let spoken = protocol_of(route);
    if protocol != Some(spoken.to_string().as_str()) {
        let message = format!("this host speaks internal protocol {spoken} on {route}; the call asked for {}", protocol.unwrap_or("none"));
        return error_as(spoken, "host-version-mismatch", &message, EXIT_MISMATCH);
    }
    match route.as_str() {
        "lock-fd" => lock_fd(&others),
        "lock-hold" => lock_hold(&others),
        "quiesce-scan" => quiesce_scan(&others),
        "lock-borrow-vectors" => lock_borrow_vectors(&others),
        other => usage(&format!("unknown internal route {other}")),
    }
}

#[cfg(not(windows))]
fn take_slot3() -> std::io::Result<File> {
    fgos_process::control::take_inherited(fgos_process::FdSlot(BORROW_SLOT))
}

/// `lock-fd`: the two modes that keep a process boundary, because their caller
/// is a process the door cannot reach (the git hook, run from a checkout).
/// `--borrowed-check <path>` is the borrower test of a process that may have
/// inherited a borrowed description; `--shared-try` is one non-blocking shared
/// lock attempt on the description at fd 3, so it never waits and never
/// obstructs a holder. Every other lock operation runs in the caller's process
/// through the addon's `holderLock`.
fn lock_fd(args: &[String]) -> i32 {
    let flags = match Flags::parse(args, &["--borrowed-check"], &["--shared-try"]) {
        Ok(flags) => flags,
        Err(message) => return usage(&message),
    };
    if flags.items.len() != 1 {
        return usage("exactly one of --borrowed-check <path>, --shared-try");
    }
    let drv = driver::current();
    if !drv.supported() {
        return emit(Some("unavailable"), json!({ "reason": "unsupported-platform", "detail": drv.unsupported_detail() }), EXIT_UNAVAILABLE);
    }
    if flags.has("--shared-try") {
        return shared_try();
    }
    let lock_path = match flags.one("--borrowed-check") {
        Ok(Some(path)) => PathBuf::from(path),
        _ => return usage("--borrowed-check needs a path"),
    };
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
        crate::port::borrowed_check(&file, &lock_path, env.as_deref(), BORROW_SLOT)
    };
    match answer {
        BorrowedCheck::Borrower => emit(Some("borrower"), json!({}), EXIT_OK),
        BorrowedCheck::NotBorrower(reason) => emit(Some("not-borrower"), json!({ "reason": reason.as_str() }), EXIT_NEGATIVE),
    }
}

#[cfg(windows)]
fn shared_try() -> i32 {
    emit(Some("unavailable"), json!({ "reason": "unsupported-platform", "detail": "--shared-try hands a descriptor to the route; Windows probes through the door" }), EXIT_UNAVAILABLE)
}

#[cfg(not(windows))]
fn shared_try() -> i32 {
    let file = match take_slot3() {
        Ok(file) => file,
        Err(err) => return error("io", &format!("fd 3 is not an open lock file: {err}"), EXIT_INTERNAL),
    };
    match driver::current().file_guarantee(&file) {
        Ok(g) if !g.usable() => return emit(Some("unavailable"), json!({ "reason": "unsupported-filesystem", "detail": g.notes.join("; ") }), EXIT_UNAVAILABLE),
        Ok(_) => {}
        Err(err) => return emit(Some("unavailable"), json!({ "reason": "io-error", "detail": format!("fstatfs fd 3: {err}") }), EXIT_UNAVAILABLE),
    }
    match crate::port::lock_description(&file, Mode::Sh, Wait::Try) {
        Ok(crate::port::DescriptionLock::Locked) => emit(Some("free"), json!({}), EXIT_OK),
        Ok(_) => emit(Some("held"), json!({ "reason": "kernel-lock-held" }), EXIT_NEGATIVE),
        Err(err) => error("io", &format!("flock fd 3: {err}"), EXIT_INTERNAL),
    }
}

/// `lock-hold --path <lockFile> --mode ex|sh --work <dir> (--try | --wait-ms N)
/// [--kill-wait-ms K]`: the Windows helper that holds one lock for Node.
fn lock_hold(args: &[String]) -> i32 {
    let flags = match Flags::parse(args, &["--path", "--mode", "--work", "--wait-ms", "--kill-wait-ms", "--predecessor-kinds"], &["--try"]) {
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
        let predecessor_kinds = flags.one("--predecessor-kinds")?.map(|s| s.split(',').map(str::to_string).collect()).unwrap_or_default();
        Ok(hold::HoldArgs { predecessor_kinds, path: PathBuf::from(path), mode, wait, kill_wait_ms, work: PathBuf::from(work) })
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
    let flags = match Flags::parse(args, &["--root", "--dir", "--exclude-pid"], &["--workspace-only"]) {
        Ok(flags) => flags,
        Err(message) => return usage_as(SCAN_PROTOCOL, &message),
    };
    let roots: Vec<PathBuf> = flags.values("--root").into_iter().map(PathBuf::from).collect();
    if roots.is_empty() {
        return usage_as(SCAN_PROTOCOL, "quiesce-scan needs at least one --root <path>");
    }
    // Linked worktrees come from the caller's Git listing; holder-lock never runs Git.
    let dirs: Vec<PathBuf> = flags.values("--dir").into_iter().map(PathBuf::from).collect();
    if !dirs.is_empty() && roots.len() != 1 {
        return usage_as(SCAN_PROTOCOL, "quiesce-scan --dir belongs to exactly one --root");
    }
    let mut exclude = Vec::new();
    for raw in flags.values("--exclude-pid") {
        match raw.parse::<u32>() {
            Ok(pid) => exclude.push(pid),
            Err(_) => return usage_as(SCAN_PROTOCOL, &format!("--exclude-pid needs a pid, got {raw}")),
        }
    }
    quiesce::scan(&roots, &dirs, &exclude, flags.has("--workspace-only"))
}

mod quiesce {
    use super::*;

    fn emit(result: Option<&str>, fields: Value, code: i32) -> i32 {
        emit_as(SCAN_PROTOCOL, result, fields, code)
    }
    use fgos_process::facts::{scan as scan_processes, Scan, ScanFilter};

    /// A workspace root and the linked worktrees its caller listed.
    fn workspace_dirs(root: &Path, linked: &[PathBuf]) -> Vec<PathBuf> {
        let mut dirs = vec![root.canonicalize().unwrap_or_else(|_| root.to_path_buf())];
        for p in linked {
            let p = p.canonicalize().unwrap_or_else(|_| p.clone());
            if !dirs.contains(&p) {
                dirs.push(p);
            }
        }
        dirs
    }

    /// A typed execution root (`--dir`, `--worktree`, `--cwd`, `-C`) that
    /// resolves inside the workspace. Only these typed values count; any other
    /// argument, a prompt or a path, is text. Relative values resolve at cwd.
    fn workspace_argument(argv: &[String], cwd: Option<&Path>, dirs: &[PathBuf]) -> bool {
        argv.iter().enumerate().any(|(i, arg)| {
            let value = if let Some((key, value)) = arg.split_once('=') {
                matches!(key, "--dir" | "--worktree" | "--cwd").then_some(value)
            } else if i > 0
                && matches!(
                    argv[i - 1].as_str(),
                    "--dir" | "--worktree" | "--cwd" | "-C"
                )
            {
                Some(arg.as_str())
            } else {
                None
            };
            value.is_some_and(|value| {
                let p = Path::new(value);
                let resolved = if p.is_absolute() {
                    Some(p.to_path_buf())
                } else {
                    cwd.map(|cwd| cwd.join(p))
                };
                resolved
                    .map(|p| p.canonicalize().unwrap_or(p))
                    .is_some_and(|p| dirs.iter().any(|d| p.starts_with(d)))
            })
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
        crate::origin::is_script_runtime(base) || crate::origin::FGOS_BINARIES.contains(&base)
    }

    /// How a process belongs to one workspace, if it does: its cwd is inside
    /// the workspace (`cwd`), or a typed execution root in its argv resolves
    /// inside it (`cmdline`). Both count in workspace-only mode (the caller
    /// filters what the process is); otherwise only for a process whose argv
    /// could be fgOS, so an idle shell, an agent session or `git -C` is not a
    /// writer. A process whose argv cannot be read still counts. Argument
    /// text alone never counts.
    fn workspace_hit(cmdline: Option<&[String]>, cwd: Option<&Path>, dirs: &[PathBuf], workspace_only: bool) -> Option<&'static str> {
        if !workspace_only && !could_be_fgos(cmdline) {
            return None;
        }
        if cwd.is_some_and(|cwd| dirs.iter().any(|d| cwd.starts_with(d))) {
            Some("cwd")
        } else if workspace_argument(cmdline.unwrap_or_default(), cwd, dirs) {
            Some("cmdline")
        } else {
            None
        }
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

    pub(super) fn scan(roots: &[PathBuf], linked: &[PathBuf], exclude: &[u32], workspace_only: bool) -> i32 {
        if !cfg!(target_os = "linux") {
            return emit(Some("unavailable"), json!({ "processes": [], "unreadable": 0, "detail": "process scan is only implemented on Linux; a person confirms no fgOS process is left" }), EXIT_UNAVAILABLE);
        }
        // Inside a PID namespace (a sandbox) every process outside it is
        // invisible: a scan from there could only ever look clean.
        if !fgos_process::facts::pid_ns().is_initial {
            return emit(Some("unavailable"), json!({ "processes": [], "unreadable": 0, "detail": "the scan runs inside a PID namespace that hides the host's processes; run it from the host" }), EXIT_UNAVAILABLE);
        }
        let per_root: Vec<(PathBuf, Vec<PathBuf>)> = roots.iter().map(|r| (r.clone(), workspace_dirs(r, linked))).collect();
        let filter = ScanFilter { env_keys: Vec::new(), include_self: false };
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
            // A process belongs to the workspace whose directory it works in
            // or is directed into; a process of another workspace is not ours.
            let hit = per_root.iter().find_map(|(root, dirs)| {
                workspace_hit(view.cmdline.as_deref(), view.cwd.as_deref(), dirs, workspace_only).map(|matched| (matched, root.as_path()))
            });
            match hit {
                Some((matched, root)) => {
                    if workspace_only && view.cmdline.is_none() {
                        unreadable += 1;
                    }
                    processes.push(json!({
                        "pid": view.pid.0,
                        "startTime": view.tuple.as_ref().map(|t| t.start_time.clone()),
                        "cwd": view.cwd.as_ref().map(|c| c.to_string_lossy().into_owned()),
                        "cmdline": argv.join(" "),
                        "argv": argv,
                        "matched": matched,
                        "root": root.to_string_lossy(),
                    }));
                }
                None if !workspace_only && !view.unreadable.is_empty() && same_user(view.pid.0) && could_be_fgos(view.cmdline.as_deref()) => unreadable += 1,
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
        #[cfg(unix)]
        use super::{workspace_argument, workspace_dirs, workspace_hit};
        #[cfg(unix)]
        use std::path::{Path, PathBuf};

        fn argv(parts: &[&str]) -> Vec<String> {
            parts.iter().map(|p| p.to_string()).collect()
        }

        #[cfg(unix)]
        #[test]
        fn workspace_membership_uses_execution_roots_not_payload_names() {
            let dirs = vec![PathBuf::from("/workspace")];
            assert!(!workspace_argument(
                &argv(&["/workspace/bin/fgos", "run", "--dir", "/other"]),
                Some(Path::new("/other")),
                &dirs
            ));
            for args in [
                argv(&["fgos", "--dir=/workspace/child"]),
                argv(&["fgos", "--worktree", "/workspace/child"]),
                argv(&["fgos", "--cwd", "child"]),
                argv(&["git", "-C", "/workspace"]),
            ] {
                assert!(workspace_argument(
                    &args,
                    Some(Path::new("/workspace")),
                    &dirs
                ));
            }
            assert!(!workspace_argument(
                &argv(&["fgos", "--dir", "/workspace-other"]),
                None,
                &dirs
            ));
        }

        #[cfg(unix)]
        #[test]
        fn workspace_dirs_are_the_root_and_the_listed_worktrees_only() {
            let base = std::env::temp_dir().join(format!("fgos-quiesce-dirs-{}", std::process::id()));
            let (root, linked) = (base.join("root"), base.join("linked"));
            std::fs::create_dir_all(&root).unwrap();
            std::fs::create_dir_all(&linked).unwrap();
            let canonical = |p: &Path| p.canonicalize().unwrap();
            assert_eq!(workspace_dirs(&root, &[]), vec![canonical(&root)], "nothing is listed for the caller");
            assert_eq!(
                workspace_dirs(&root, &[linked.clone(), root.clone(), base.join("gone")]),
                vec![canonical(&root), canonical(&linked), base.join("gone")],
                "duplicates collapse and a vanished directory is kept as given"
            );
            std::fs::remove_dir_all(&base).unwrap();
        }

        #[cfg(unix)]
        #[test]
        fn a_cwd_in_the_workspace_counts_only_for_a_process_that_could_be_fgos() {
            let dirs = vec![PathBuf::from("/workspace")];
            let cwd = Some(Path::new("/workspace/sub"));
            let hit = |parts: &[&str], only: bool| workspace_hit(Some(&argv(parts)), cwd, &dirs, only);
            assert_eq!(hit(&["/usr/bin/zsh"], false), None, "an idle shell is not a writer");
            assert_eq!(hit(&["claude"], false), None, "an agent session is not a writer");
            assert_eq!(hit(&["node", "bin/fgos.mjs", "run"], false), Some("cwd"));
            assert_eq!(hit(&["fgos", "run", "x"], false), Some("cwd"));
            assert_eq!(hit(&["/usr/bin/zsh"], true), Some("cwd"), "workspace-only leaves the filtering to the caller");
            assert_eq!(workspace_hit(None, cwd, &dirs, false), Some("cwd"), "an unreadable argv still counts");
            assert_eq!(workspace_hit(Some(&argv(&["/usr/bin/zsh"])), Some(Path::new("/elsewhere")), &dirs, false), None);
            let elsewhere = Some(Path::new("/elsewhere"));
            assert_eq!(workspace_hit(Some(&argv(&["fgos", "run", "do /workspace/x", "/workspace/y"])), elsewhere, &dirs, false), None, "a prompt or positional path is text, not a root");
            assert_eq!(workspace_hit(Some(&argv(&["fgos", "run", "--worktree", "/workspace/y"])), elsewhere, &dirs, false), Some("cmdline"), "a typed root counts");
            assert_eq!(workspace_hit(Some(&argv(&["git", "-C", "/workspace"])), elsewhere, &dirs, false), None, "git is not fgOS outside workspace-only mode");
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
