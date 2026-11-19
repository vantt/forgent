//! Build and tear down the private HOME a dispatched worker runs under.
//!
//! WHY A PRIVATE HOME AT ALL. Two problems settle with one mechanism. It closes the default socket under
//! `$HOME` that a worker would otherwise use to reach the operator's own terminal cockpit, and it is the
//! writable private scratch an agent CLI needs before it can start under a read-only mount at all.
//!
//! WHY IT MUST BE PROVISIONED, NOT MERELY EMPTY. An empty HOME is a broken one. Each item below was found by
//! hitting its own failure while running a real agent:
//!
//! 1. `.zshrc`: without it zsh runs its first-run wizard, which eats the first keystroke of the launch command.
//! 2. `.claude/.credentials.json`: provider auth.
//! 3. `.claude.json` onboarding and theme: without it the agent sits in its own onboarding wizard while herdr
//!    reports it idle and ready, and a prompt sent then is swallowed.
//! 4. `.claude.json` workspace trust: without it the folder-trust dialog.
//! 5. `.claude/settings.json` `skipDangerousModePermissionPrompt`: only for the `bypass` posture; the flag
//!    triggers a one-time acceptance screen herdr classifies as `blocked`.
//!
//! WHAT THIS DOES NOT SOLVE. The worker ends up holding a copy of the operator's provider credential, because
//! it has to be reachable for the worker to function at all. HOME isolation cannot fix that; only a
//! credential-holding relay can.

use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::Duration;

use fgos_process::control::{signal_by_identity, Signal};
use fgos_process::facts::{identity_of, scan, Scan, ScanFilter};
use fgos_process::ProcId;
use fgos_run_supervisor::controller::trust_store::{read_trust, trusted_project_entry, Json};

/// Marker file written into every home this module creates. `remove_worker_home` refuses to delete a directory
/// that does not carry it, so a teardown bug can never turn into "recursively delete some path someone passed in".
const MARKER: &str = ".fgos-worker-home";

/// The settings a claude config directory needs so a bypass launch does not stop at its one-time acceptance screen.
pub const BYPASS_ACCEPTANCE_SETTINGS: &str = "skipDangerousModePermissionPrompt";

#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
#[error("{message}")]
pub struct WorkerHomeError {
    pub code: String,
    pub message: String,
}

fn fail(code: &str, message: impl Into<String>) -> WorkerHomeError {
    WorkerHomeError {
        code: code.to_string(),
        message: message.into(),
    }
}

/// The permission posture of a worker, DECLARED by the caller from the executor profile, never inherited from a
/// shell alias: on a developer machine the bypass flag reaches the agent through `~/.zshrc`, which fgOS cannot
/// see and a private HOME silently removes.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum PermissionMode {
    #[default]
    Ask,
    Bypass,
}

impl PermissionMode {
    /// `None` is the default (`ask`); any other spelling than `ask` or `bypass` is refused.
    pub fn parse(text: Option<&str>) -> Result<Self, WorkerHomeError> {
        match text {
            None | Some("ask") => Ok(Self::Ask),
            Some("bypass") => Ok(Self::Bypass),
            Some(other) => Err(fail(
                "invalid-arg",
                format!("createWorkerHome: permissionMode must be \"ask\" or \"bypass\", got \"{other}\"."),
            )),
        }
    }
}

#[derive(Debug, Clone)]
pub struct CreateWorkerHome<'a> {
    pub run_id: &'a str,
    pub source_home: &'a Path,
    pub workspace_path: &'a str,
    pub repo_root: &'a str,
    pub permission_mode: PermissionMode,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WorkerHome {
    pub home_path: PathBuf,
    /// The items written, so a caller can log what a run actually got rather than what it assumed.
    pub provisioned: Vec<String>,
}

fn json_obj(entries: Vec<(&str, Json)>) -> Json {
    Json::Obj(
        entries
            .into_iter()
            .map(|(k, v)| (k.to_string(), v))
            .collect(),
    )
}

fn mkdtemp(base: &Path, prefix: &str) -> std::io::Result<PathBuf> {
    use std::hash::{BuildHasher, Hasher};
    const ALPHABET: &[u8] = b"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for _ in 0..64 {
        let mut hasher = std::collections::hash_map::RandomState::new().build_hasher();
        hasher.write_u32(std::process::id());
        hasher.write_u128(
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map_or(0, |d| d.as_nanos()),
        );
        let mut bits = hasher.finish();
        let suffix: String = (0..6)
            .map(|_| {
                let c = ALPHABET[(bits % ALPHABET.len() as u64) as usize] as char;
                bits /= ALPHABET.len() as u64;
                c
            })
            .collect();
        let path = base.join(format!("{prefix}{suffix}"));
        match fs::create_dir(&path) {
            Ok(()) => {
                #[cfg(unix)]
                fs::set_permissions(&path, std::os::unix::fs::PermissionsExt::from_mode(0o700))?;
                return Ok(path);
            }
            Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => continue,
            Err(e) => return Err(e),
        }
    }
    Err(std::io::Error::new(
        std::io::ErrorKind::AlreadyExists,
        "no free temporary name",
    ))
}

/// Create a provisioned private HOME for one run under `base_dir`.
///
/// Refuses, leaving nothing behind, when the repo root is not already trusted in the source home
/// (`untrusted-root`; the trust reader is the run supervisor's, so "is this root trusted" has one owner) or the
/// source home has no credential to copy (`missing-credential`).
pub fn create_worker_home(
    base_dir: &Path,
    request: &CreateWorkerHome<'_>,
) -> Result<WorkerHome, WorkerHomeError> {
    if request.run_id.is_empty() {
        return Err(fail("invalid-arg", "createWorkerHome: runId is required."));
    }
    if !Path::new(request.workspace_path).is_absolute() {
        return Err(fail(
            "invalid-arg",
            format!(
                "createWorkerHome: workspacePath must be absolute, got \"{}\".",
                request.workspace_path
            ),
        ));
    }

    // The trust check runs BEFORE anything is created, so a refusal leaves no directory behind.
    let source_store = request.source_home.join(".claude.json");
    let trust = read_trust(&source_store, request.repo_root).map_err(|e| {
        fail(
            e.code,
            format!(
                "createWorkerHome: could not read the source trust store: {}",
                e.message
            ),
        )
    })?;
    if trust != Some(true) {
        return Err(fail(
            "untrusted-root",
            format!(
                "createWorkerHome refused: repo root \"{}\" is not trusted in the source home, so a worker home for \"{}\" would be inventing trust rather than deriving it.",
                request.repo_root, request.workspace_path
            ),
        ));
    }
    let credential_source = request
        .source_home
        .join(".claude")
        .join(".credentials.json");
    if !credential_source.exists() {
        return Err(fail(
            "missing-credential",
            format!(
                "createWorkerHome refused: no provider credential at \"{}\". A worker home without auth cannot do any work, and starting one anyway only fails later and less clearly.",
                credential_source.display()
            ),
        ));
    }

    let home = mkdtemp(base_dir, &format!("worker-{}-", request.run_id)).map_err(|e| {
        fail(
            "provision-failed",
            format!(
                "createWorkerHome could not create a home under \"{}\": {e}",
                base_dir.display()
            ),
        )
    })?;
    match provision(&home, request, &credential_source) {
        Ok(provisioned) => Ok(WorkerHome {
            home_path: home,
            provisioned,
        }),
        Err(cause) => {
            // Never leave a half-provisioned home: one missing an item fails in a way that looks like an agent problem.
            let _ = fs::remove_dir_all(&home);
            Err(fail(
                "provision-failed",
                format!(
                    "createWorkerHome could not provision \"{}\": {cause}",
                    home.display()
                ),
            ))
        }
    }
}

fn provision(
    home: &Path,
    request: &CreateWorkerHome<'_>,
    credential_source: &Path,
) -> Result<Vec<String>, std::io::Error> {
    let claude_dir = home.join(".claude");
    let mut provisioned = Vec::new();
    fs::create_dir_all(&claude_dir)?;
    fs::write(home.join(MARKER), format!("{}\n", request.run_id))?;

    fs::write(
        home.join(".zshrc"),
        "# provisioned by fgOS: present so zsh does not run its first-run wizard\n",
    )?;
    provisioned.push(".zshrc".to_string());

    // Copy, never link: a symlink would leave the worker a path back into the operator's home. `create_new`
    // keeps this from ever overwriting.
    let credential = claude_dir.join(".credentials.json");
    let mut target = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&credential)?;
    std::io::copy(&mut fs::File::open(credential_source)?, &mut target)?;
    target.flush()?;
    drop(target);
    #[cfg(unix)]
    fs::set_permissions(
        &credential,
        std::os::unix::fs::PermissionsExt::from_mode(0o600),
    )?;
    provisioned.push(".claude/.credentials.json".to_string());

    // The same shape the trust store's own seeding writes: one definition of what a trusted entry looks like.
    let store = json_obj(vec![
        ("hasCompletedOnboarding", Json::Bool(true)),
        ("theme", Json::Str("dark".into())),
        ("installMethod", Json::Str("native".into())),
        (
            "projects",
            Json::Obj(vec![(
                request.workspace_path.to_string(),
                trusted_project_entry(),
            )]),
        ),
    ]);
    fs::write(home.join(".claude.json"), format!("{}\n", store.pretty()))?;
    provisioned.push(".claude.json (onboarding + workspace trust)".to_string());

    if request.permission_mode == PermissionMode::Bypass {
        let settings = json_obj(vec![(BYPASS_ACCEPTANCE_SETTINGS, Json::Bool(true))]);
        fs::write(
            claude_dir.join("settings.json"),
            format!("{}\n", settings.pretty()),
        )?;
        provisioned.push(".claude/settings.json (bypass acceptance)".to_string());
    }
    Ok(provisioned)
}

/// Stops what still runs from inside a home that is about to be deleted. An agent CLI can start a background
/// server of its own out of the HOME it was given (codex puts a daemon under `<home>/packages/...` and leaves it
/// running when the pane closes): removing the home deletes the files but not the process.
pub trait HomeSweeper {
    /// Stop every process (other than this one and its parent) whose executable or working directory is inside
    /// `dir`; the pids still alive afterwards, or whose identity could not be read.
    fn stop_inside(&self, dir: &Path) -> Vec<u32>;
}

/// The sweep of this machine: the process door's scan where it can scan (Linux; confinement is Linux-only, so the
/// leak it closes is too), signals each process by its recorded identity so a reused pid is never hit, SIGTERM then
/// SIGKILL with a grace window after each.
#[derive(Debug, Clone, Copy)]
pub struct ProcSweeper {
    pub grace: Duration,
}

impl Default for ProcSweeper {
    fn default() -> Self {
        Self {
            grace: Duration::from_secs(2),
        }
    }
}

fn without_deleted_suffix(path: PathBuf) -> PathBuf {
    match path.to_str().and_then(|s| s.strip_suffix(" (deleted)")) {
        Some(clean) => PathBuf::from(clean),
        None => path,
    }
}

/// The processes (other than this one and its parent) whose executable or working directory is inside `dir`, as
/// the process door's scan saw them; the identity is `None` where it could not be read. Nothing where the
/// platform cannot scan.
fn processes_inside(dir: &Path) -> Vec<(u32, Option<fgos_process::facts::ProcTuple>)> {
    let root = fs::canonicalize(dir).unwrap_or_else(|_| dir.to_path_buf());
    let me = std::process::id();
    #[cfg(unix)]
    let parent = Some(std::os::unix::process::parent_id());
    #[cfg(not(unix))]
    let parent: Option<u32> = None;
    let Scan::Views(views) = scan(&ScanFilter::default()) else {
        return Vec::new();
    };
    let inside = |path: &Option<PathBuf>| {
        path.clone()
            .map(without_deleted_suffix)
            .is_some_and(|p| p.starts_with(&root))
    };
    let mut found: Vec<_> = views
        .into_iter()
        .filter(|view| view.pid.0 != me && Some(view.pid.0) != parent)
        .filter(|view| inside(&view.exe) || inside(&view.cwd))
        .map(|view| (view.pid.0, view.tuple))
        .collect();
    found.sort_unstable_by_key(|(pid, _)| *pid);
    found
}

impl ProcSweeper {
    /// The recorded process still runs under its pid: a pid reused since the scan is not it.
    fn still_there(pid: u32, tuple: &fgos_process::facts::ProcTuple) -> bool {
        identity_of(ProcId(pid)).as_ref() == Some(tuple)
    }

    fn signal_and_wait(
        &self,
        pids: &[(u32, fgos_process::facts::ProcTuple)],
        sig: Signal,
    ) -> Vec<u32> {
        for (_, tuple) in pids {
            let _ = signal_by_identity(tuple, sig);
        }
        let deadline = std::time::Instant::now() + self.grace;
        while std::time::Instant::now() < deadline
            && pids
                .iter()
                .any(|(pid, tuple)| Self::still_there(*pid, tuple))
        {
            std::thread::sleep(Duration::from_millis(50));
        }
        pids.iter()
            .filter(|(pid, tuple)| Self::still_there(*pid, tuple))
            .map(|(pid, _)| *pid)
            .collect()
    }
}

impl HomeSweeper for ProcSweeper {
    fn stop_inside(&self, dir: &Path) -> Vec<u32> {
        let mut left = Vec::new();
        let mut known = Vec::new();
        for (pid, tuple) in processes_inside(dir) {
            match tuple {
                Some(tuple) => known.push((pid, tuple)),
                // A process without a readable identity cannot be signalled safely.
                None => left.push(pid),
            }
        }
        if known.is_empty() {
            return left;
        }
        let alive = self.signal_and_wait(&known, Signal::Term);
        let survivors: Vec<_> = known
            .into_iter()
            .filter(|(pid, _)| alive.contains(pid))
            .collect();
        if !survivors.is_empty() {
            left.extend(self.signal_and_wait(&survivors, Signal::Kill));
        }
        left
    }
}

fn marked(home: &Path, verb: &str, effect: &str) -> Result<bool, WorkerHomeError> {
    if home.as_os_str().is_empty() {
        return Err(fail(
            "invalid-arg",
            format!("{verb}: homePath is required."),
        ));
    }
    if !home.exists() {
        return Ok(false);
    }
    if !home.join(MARKER).exists() {
        return Err(fail(
            "not-a-worker-home",
            format!("{verb} refused: \"{}\" carries no {MARKER} marker, so this module did not create it and will not {effect} it.", home.display()),
        ));
    }
    Ok(true)
}

/// Remove a home this module created. Whether there was one.
///
/// Refuses any directory without the marker file. Teardown runs on error paths, where a wrong argument is most
/// likely, and a recursive delete is the one operation that must never act on a path it cannot recognise.
pub fn remove_worker_home(home: &Path, sweeper: &dyn HomeSweeper) -> Result<bool, WorkerHomeError> {
    if !marked(home, "removeWorkerHome", "delete")? {
        return Ok(false);
    }
    // A home is private to one dispatch: whatever still runs from it is a leftover of that dispatch and would
    // outlive the files it runs from.
    let left = sweeper.stop_inside(home);
    if !left.is_empty() {
        let pids = left
            .iter()
            .map(u32::to_string)
            .collect::<Vec<_>>()
            .join(", ");
        return Err(fail(
            "worker-home-in-use",
            format!("removeWorkerHome refused: pid {pids} still runs from \"{}\" after SIGKILL or has no readable identity; stop it, then remove the home.", home.display()),
        ));
    }
    fs::remove_dir_all(home).map_err(|e| {
        fail(
            "provision-failed",
            format!(
                "removeWorkerHome could not remove \"{}\": {e}",
                home.display()
            ),
        )
    })?;
    Ok(true)
}

/// Take the provider credential out of a home that is being kept.
///
/// A failed round keeps its home for the same reason it keeps its pane: the settings and rc are the only record
/// of what the worker was actually given. The credential is not part of that record; it is a plain copy of the
/// operator's own, and one copy per failed round accumulating in a world-listable temp directory is a different
/// thing from "the worker holds a copy while it runs". Same marker check as [`remove_worker_home`].
pub fn redact_worker_home(home: &Path) -> Result<bool, WorkerHomeError> {
    if !marked(home, "redactWorkerHome", "touch")? {
        return Ok(false);
    }
    let credential = home.join(".claude").join(".credentials.json");
    if !credential.exists() {
        return Ok(false);
    }
    fs::remove_file(&credential).map_err(|e| {
        fail(
            "provision-failed",
            format!(
                "redactWorkerHome could not remove \"{}\": {e}",
                credential.display()
            ),
        )
    })?;
    Ok(true)
}
