//! Borrow vectors (`packages/holder-lock/contracts/internal-route.lock-borrow-vectors.v1.json`):
//! real git in a throwaway repository tries the known ways a borrowed
//! description leaks to a background process. Each vector takes the lock,
//! runs git through `run_borrowed`, releases, and asserts the lock is free
//! at once. Red means doctor FAIL and activate refuses.
//!
//! On Windows the borrow carries no descriptor, so a free lock proves nothing
//! about leaked processes. Each background command writes its Windows pid; the
//! vector opens its own `SYNCHRONIZE` handle to every such pid and asserts it
//! is signaled once `run_borrowed` returned.

use std::collections::BTreeMap;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::Instant;

use crate::port::{self, Acquire, BorrowSpec, BorrowStdio, BorrowedCheck, HelperExe, Mode, Probe, Resource, Wait};

/// The four vectors, in run order.
pub const VECTORS: [&str; 4] = ["shell-alias-background", "filter-clean-smudge", "hook-background", "gc-auto-loose-objects"];

/// Kill wait used for the leftovers of a vector.
const KILL_WAIT_MS: u64 = 2000;

/// One vector's outcome.
#[derive(Debug, Clone, PartialEq)]
pub struct VectorResult {
    /// Vector name.
    pub name: String,
    /// Green?
    pub pass: bool,
    /// Wall time of the vector.
    pub elapsed_ms: f64,
    /// What happened.
    pub detail: String,
}

/// The whole run.
#[derive(Debug, Clone, PartialEq)]
pub struct Report {
    /// Vector outcomes, in run order.
    pub vectors: Vec<VectorResult>,
    /// The sibling check: a description opened by a process itself is not a borrower.
    pub sibling: (bool, String),
    /// `git --version`.
    pub git_version: String,
    /// Wall time of the run.
    pub elapsed_ms: f64,
    /// The temporary directory, when kept.
    pub kept: Option<PathBuf>,
}

impl Report {
    /// Every vector and the sibling check green.
    pub fn pass(&self) -> bool {
        self.sibling.0 && self.vectors.iter().all(|v| v.pass)
    }
}

/// Why the vectors could not run at all.
#[derive(Debug, Clone, PartialEq)]
pub enum RunError {
    /// No lock driver on this platform, or no git.
    Unavailable(String),
    /// A vector name that does not exist.
    Usage(String),
}

fn ms(since: Instant) -> f64 {
    (since.elapsed().as_secs_f64() * 1000.0 * 100.0).round() / 100.0
}

/// A git command for setup, outside any lock: isolated from the user's and
/// the system's config.
fn git_plain(git: &Path, repo: &Path) -> Command {
    let mut cmd = Command::new(git);
    cmd.arg("-C").arg(repo);
    for (k, v) in git_env() {
        cmd.env(k, v);
    }
    cmd.stdin(Stdio::null());
    cmd
}

/// Environment of every vector git call: no user or system config, fixed identity.
pub fn git_env() -> BTreeMap<String, String> {
    [
        ("GIT_CONFIG_NOSYSTEM", "1"),
        ("GIT_CONFIG_GLOBAL", if cfg!(windows) { "NUL" } else { "/dev/null" }),
        ("GIT_TERMINAL_PROMPT", "0"),
        ("GIT_AUTHOR_NAME", "fgos"),
        ("GIT_AUTHOR_EMAIL", "fgos@localhost"),
        ("GIT_COMMITTER_NAME", "fgos"),
        ("GIT_COMMITTER_EMAIL", "fgos@localhost"),
    ]
    .into_iter()
    .map(|(k, v)| (k.to_string(), v.to_string()))
    .collect()
}

fn run_plain(mut cmd: Command, what: &str) -> Result<String, String> {
    let out = cmd.output().map_err(|e| format!("{what}: {e}"))?;
    if !out.status.success() {
        return Err(format!("{what}: {} {}", out.status, String::from_utf8_lossy(&out.stderr).trim()));
    }
    Ok(String::from_utf8_lossy(&out.stdout).trim().to_string())
}

/// A fresh repository with one commit, made outside any lock.
pub fn init_repo(git: &Path, repo: &Path) -> Result<(), String> {
    fs::create_dir_all(repo).map_err(|e| format!("mkdir {}: {e}", repo.display()))?;
    let mut init = git_plain(git, repo);
    init.args(["init", "-q"]);
    run_plain(init, "git init")?;
    fs::write(repo.join("base.txt"), "base\n").map_err(|e| e.to_string())?;
    let mut add = git_plain(git, repo);
    add.args(["add", "base.txt"]);
    run_plain(add, "git add")?;
    let mut commit = git_plain(git, repo);
    commit.args(["-c", "gc.auto=0", "commit", "-q", "-m", "base"]);
    run_plain(commit, "git commit")?;
    Ok(())
}

fn config(git: &Path, repo: &Path, key: &str, value: &str) -> Result<(), String> {
    let mut cmd = git_plain(git, repo);
    cmd.args(["config", key, value]);
    run_plain(cmd, &format!("git config {key}")).map(|_| ())
}

#[cfg(unix)]
fn write_hook(repo: &Path, name: &str, body: &str) -> Result<(), String> {
    use std::os::unix::fs::PermissionsExt;
    let path = repo.join(".git/hooks").join(name);
    fs::write(&path, body).map_err(|e| e.to_string())?;
    fs::set_permissions(&path, fs::Permissions::from_mode(0o755)).map_err(|e| e.to_string())
}

#[cfg(not(unix))]
fn write_hook(repo: &Path, name: &str, body: &str) -> Result<(), String> {
    fs::write(repo.join(".git/hooks").join(name), body).map_err(|e| e.to_string())
}

/// A background process that keeps every inherited descriptor but not the
/// caller's stdio. On Windows it also appends its own Windows pid to
/// `pidfile` (`/proc/$!/winpid` under Git for Windows' `sh`).
fn background(pidfile: &Path) -> String {
    if cfg!(windows) {
        let pidfile = pidfile.to_string_lossy().replace('\\', "/");
        format!("sleep 30 >/dev/null 2>&1 </dev/null & echo $(cat /proc/$!/winpid) >> '{pidfile}';")
    } else {
        "sleep 30 >/dev/null 2>&1 </dev/null &".to_string()
    }
}

/// Make `gc --auto` eligible under `gc.auto=1`: more than one loose object
/// in `objects/17`, the directory git samples.
pub fn add_loose_objects(git: &Path, repo: &Path) -> Result<usize, String> {
    let blobs = repo.join(".git/fgos-blobs");
    fs::create_dir_all(&blobs).map_err(|e| e.to_string())?;
    let sample = repo.join(".git/objects/17");
    let mut round = 0;
    loop {
        let count = fs::read_dir(&sample).map(|d| d.count()).unwrap_or(0);
        if count >= 2 {
            let _ = fs::remove_dir_all(&blobs);
            return Ok(count);
        }
        if round >= 8 {
            return Err(format!("only {count} loose objects in objects/17 after {round} rounds"));
        }
        let mut paths = String::new();
        for i in 0..1024 {
            let p = blobs.join(format!("{round}-{i}"));
            fs::write(&p, format!("loose {round} {i}\n")).map_err(|e| e.to_string())?;
            paths.push_str(&p.to_string_lossy());
            paths.push('\n');
        }
        let mut cmd = git_plain(git, repo);
        cmd.args(["hash-object", "-w", "--no-filters", "--stdin-paths"]).stdin(Stdio::piped()).stdout(Stdio::null()).stderr(Stdio::piped());
        let mut child = cmd.spawn().map_err(|e| format!("git hash-object: {e}"))?;
        {
            use std::io::Write;
            let mut stdin = child.stdin.take().expect("piped stdin");
            stdin.write_all(paths.as_bytes()).map_err(|e| e.to_string())?;
        }
        let status = child.wait().map_err(|e| e.to_string())?;
        if !status.success() {
            return Err(format!("git hash-object: {status}"));
        }
        round += 1;
    }
}

struct Borrowing<'a> {
    git: &'a Path,
    helper: &'a HelperExe,
    repo: &'a Path,
    resource: Resource,
}

impl Borrowing<'_> {
    /// Take the lock, run each git argv through `run_borrowed`, release,
    /// then probe. Returns (leftovers killed, probe after release, notes).
    fn run(&self, calls: &[Vec<&str>]) -> Result<(u32, Probe, Vec<String>), String> {
        let handle = match port::acquire(&self.resource, Mode::Ex, Wait::Ms(2000), KILL_WAIT_MS) {
            Acquire::Acquired(h) => h,
            other => return Err(format!("owner could not take the vector lock: {other:?}")),
        };
        let mut killed = 0;
        let mut notes = Vec::new();
        for args in calls {
            let mut argv = vec![self.git.to_string_lossy().into_owned(), "-C".into(), self.repo.to_string_lossy().into_owned()];
            argv.extend(args.iter().map(|a| a.to_string()));
            let spec = BorrowSpec { argv, cwd: Some(self.repo.to_path_buf()), env: git_env(), clear_env: false, stdio: BorrowStdio::Null };
            match port::run_borrowed(&handle, &spec, self.helper) {
                Ok(outcome) => {
                    killed += outcome.leftovers_killed;
                    if outcome.exit != Some(0) {
                        notes.push(format!("git {} exited {:?}/{:?}", args.join(" "), outcome.exit, outcome.signal));
                    }
                }
                Err(err) => {
                    port::release(handle);
                    return Err(format!("git {}: {err}", args.join(" ")));
                }
            }
        }
        port::release(handle);
        let probe = port::probe(&self.resource).map_err(|e| format!("probe: {e}"))?;
        Ok((killed, probe, notes))
    }
}

fn vector(name: &str, git: &Path, helper: &HelperExe, dir: &Path) -> VectorResult {
    let started = Instant::now();
    let repo = dir.join(name);
    let resource = Resource::new("borrow-vectors", dir.join(format!("{name}.lock")));
    let pidfile = dir.join(format!("{name}.pids"));
    let bg = background(&pidfile);
    let result = (|| -> Result<(bool, String), String> {
        init_repo(git, &repo)?;
        let borrowing = Borrowing { git, helper, repo: &repo, resource };
        let (killed, probe, notes, expect_no_leftovers) = match name {
            "shell-alias-background" => {
                config(git, &repo, "alias.bgsleep", &format!("!{bg} true"))?;
                let (k, p, n) = borrowing.run(&[vec!["bgsleep"]])?;
                (k, p, n, false)
            }
            "filter-clean-smudge" => {
                config(git, &repo, "filter.bg.clean", &format!("{bg} cat"))?;
                config(git, &repo, "filter.bg.smudge", &format!("{bg} cat"))?;
                fs::write(repo.join(".gitattributes"), "*.flt filter=bg\n").map_err(|e| e.to_string())?;
                fs::write(repo.join("data.flt"), "filtered\n").map_err(|e| e.to_string())?;
                let (k, p, n) = borrowing.run(&[
                    vec!["add", ".gitattributes", "data.flt"],
                    vec!["commit", "-q", "-m", "filtered"],
                    vec!["rm", "-q", "--cached", "data.flt"],
                    vec!["checkout", "-q", "HEAD", "--", "data.flt"],
                ])?;
                (k, p, n, false)
            }
            "hook-background" => {
                let body = format!("#!/bin/sh\n{bg}\nexit 0\n");
                write_hook(&repo, "pre-commit", &body)?;
                write_hook(&repo, "post-commit", &body)?;
                let (k, p, n) = borrowing.run(&[vec!["commit", "-q", "--allow-empty", "-m", "hooked"]])?;
                (k, p, n, false)
            }
            "gc-auto-loose-objects" => {
                config(git, &repo, "gc.auto", "1")?;
                let loose = add_loose_objects(git, &repo)?;
                let (k, p, mut n) = borrowing.run(&[vec!["commit", "-q", "--allow-empty", "-m", "gc-eligible"]])?;
                n.push(format!("{loose} loose objects in objects/17"));
                (k, p, n, true)
            }
            other => return Err(format!("unknown vector {other}")),
        };
        let mut detail = format!("probe after release: {}; leftovers killed: {killed}", if probe == Probe::Free { "free" } else { "held" });
        for note in &notes {
            detail.push_str("; ");
            detail.push_str(note);
        }
        let mut pass = probe == Probe::Free && notes.iter().all(|n| !n.starts_with("git "));
        // Cleanup kills borrowed-group and escaped description holders.
        // A GC that ignored the disabling switches is safe once drained;
        // the post-release probe must still prove the resource is free.
        if cfg!(windows) && !expect_no_leftovers {
            match background_pids_ended(&pidfile) {
                Ok(count) => detail.push_str(&format!("; {count} background process(es) ended")),
                Err(why) => {
                    pass = false;
                    detail.push_str("; ");
                    detail.push_str(&why);
                }
            }
        }
        Ok((pass, detail))
    })();
    let (pass, detail) = result.unwrap_or_else(|err| (false, err));
    VectorResult { name: name.to_string(), pass, elapsed_ms: ms(started), detail }
}

/// Every pid the vector's background command wrote is a process that has
/// ended, judged by this process's own `SYNCHRONIZE` handle (never the
/// driver's empty rule). No pid at all means the command never ran: `sh`
/// could not run it, which is named, because Git for Windows' `sh` must be
/// reachable by git for the vectors to mean anything.
#[cfg(windows)]
fn background_pids_ended(pidfile: &Path) -> Result<usize, String> {
    use windows_sys::Win32::Foundation::{CloseHandle, GetLastError, ERROR_INVALID_PARAMETER, WAIT_OBJECT_0};
    use windows_sys::Win32::Storage::FileSystem::SYNCHRONIZE;
    use windows_sys::Win32::System::Threading::{OpenProcess, WaitForSingleObject};

    let text = fs::read_to_string(pidfile).unwrap_or_default();
    let pids: Vec<u32> = text.lines().filter_map(|l| l.trim().parse().ok()).collect();
    if pids.is_empty() {
        return Err("no background process wrote its pid: `sh` did not run the vector's command (git must find Git for Windows' sh)".to_string());
    }
    for pid in &pids {
        // SAFETY: OpenProcess takes plain values and returns a handle or null.
        let handle = unsafe { OpenProcess(SYNCHRONIZE, 0, *pid) };
        if handle.is_null() {
            // SAFETY: reads the calling thread's last error.
            let err = unsafe { GetLastError() };
            if err == ERROR_INVALID_PARAMETER {
                continue;
            }
            return Err(format!("cannot open background pid {pid} to judge it (Win32 error {err})"));
        }
        // SAFETY: a zero wait polls an open handle, which is closed right after.
        let ended = unsafe { WaitForSingleObject(handle, 0) == WAIT_OBJECT_0 };
        unsafe { CloseHandle(handle) };
        if !ended {
            return Err(format!("background pid {pid} is still running after run_borrowed returned"));
        }
    }
    Ok(pids.len())
}

#[cfg(not(windows))]
fn background_pids_ended(_pidfile: &Path) -> Result<usize, String> {
    Ok(0)
}

/// The sibling check, in this process: while an owner holds the lock, a
/// process outside the borrow that only copied what the borrow tells its
/// child (POSIX: the variable and a description it opened itself; Windows:
/// the job variable, without being in the job) is refused.
fn sibling(dir: &Path) -> (bool, String) {
    let resource = Resource::new("borrow-vectors", dir.join("sibling.lock"));
    let handle = match port::acquire(&resource, Mode::Ex, Wait::Ms(2000), KILL_WAIT_MS) {
        Acquire::Acquired(h) => h,
        other => return (false, format!("owner could not take the sibling lock: {other:?}")),
    };
    let answer = sibling_answer(&handle, &resource);
    port::release(handle);
    match answer {
        Ok(BorrowedCheck::NotBorrower(reason)) => (true, format!("sibling refused ({})", reason.as_str())),
        Ok(BorrowedCheck::Borrower) => (false, "a sibling outside the borrow was accepted as borrower".into()),
        Err(why) => (false, why),
    }
}

#[cfg(unix)]
fn sibling_answer(_handle: &port::Handle, resource: &Resource) -> Result<BorrowedCheck, String> {
    let own = fs::OpenOptions::new().read(true).write(true).open(&resource.path).map_err(|e| format!("sibling open: {e}"))?;
    Ok(port::borrowed_check(&own, &resource.path, Some(&format!("borrow-vectors:{}", port::BORROW_SLOT)), port::BORROW_SLOT))
}

/// A real record and a real job the owner declared, with this process
/// outside it: the check must stop at "not in the job".
#[cfg(windows)]
fn sibling_answer(handle: &port::Handle, resource: &Resource) -> Result<BorrowedCheck, String> {
    use fgos_process::platform::windows_job::{create_kill_job, filetime_now, job_name, own_session};
    use fgos_process::{Domain, WindowsJob};

    let name = job_name("fgos-borrow", "borrow-vectors");
    let holder = fgos_process::facts::self_identity().ok_or("cannot read this process's identity")?;
    let session_id = own_session().ok_or("cannot read this process's session")?;
    let domain = Domain::WindowsJob(WindowsJob { job: name.clone(), session_id, declared_at: filetime_now(), holder, keeper: None });
    handle.declare_domain(&domain).map_err(|e| format!("declare: {e}"))?;
    let job = create_kill_job(&name).map_err(|e| format!("create job: {e}"))?;
    let answer = crate::borrowed_check_job(&resource.path, Some(&format!("borrow-vectors:{name}")));
    drop(job);
    crate::predecessor::remove_record(&crate::predecessor::record_path(&resource.path));
    Ok(answer)
}

fn temp_dir() -> io::Result<PathBuf> {
    let nanos = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_nanos()).unwrap_or(0);
    let dir = std::env::temp_dir().join(format!("fgos-borrow-vectors-{}-{nanos}", std::process::id()));
    fs::create_dir_all(&dir)?;
    Ok(dir)
}

/// Run the named vectors (all four when `only` is empty) with `git`.
pub fn run(git: &Path, helper: &HelperExe, only: &[String], keep_repo: bool) -> Result<Report, RunError> {
    let started = Instant::now();
    for name in only {
        if !VECTORS.contains(&name.as_str()) {
            return Err(RunError::Usage(format!("unknown vector {name}; known: {}", VECTORS.join(", "))));
        }
    }
    if !crate::driver::current().supported() {
        return Err(RunError::Unavailable(crate::driver::current().unsupported_detail().to_string()));
    }
    let mut version = Command::new(git);
    version.arg("--version").stdin(Stdio::null());
    let git_version = run_plain(version, "git --version").map_err(RunError::Unavailable)?;
    let dir = temp_dir().map_err(|e| RunError::Unavailable(format!("temp dir: {e}")))?;
    let vectors = VECTORS
        .iter()
        .filter(|name| only.is_empty() || only.iter().any(|o| o == *name))
        .map(|name| vector(name, git, helper, &dir))
        .collect();
    let sibling = sibling(&dir);
    let kept = if keep_repo {
        Some(dir)
    } else {
        let _ = fs::remove_dir_all(&dir);
        None
    };
    Ok(Report { vectors, sibling, git_version, elapsed_ms: ms(started), kept })
}
