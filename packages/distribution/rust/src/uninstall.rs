//! `fgctl uninstall`: takes out of a project what fgOS installed, keeps the person's config and
//! data, and with `--purge` also removes the machine release store.
//!
//! The work is ordered so nothing irreversible runs after a failure: the activated `fgos` first
//! reverses the project wiring (hook entries, generated skills, git hooks; it needs the
//! installation it is about to lose), then `.fgos/installation` goes, then the release store. A
//! step that failed makes every later irreversible step skip.
//!
//! What is removed is decided by what fgOS owns, not by a list built at run time: the project's
//! installation directory is one fixed path under the workspace root, and the store is the three
//! directories the staging code creates (`releases/`, `quarantine/`, `installs/`) under the state
//! root, entry by entry, each entry only when its name has the shape fgOS gave it. The state root
//! also holds identity, locks and machine facts that are not release data, so it is never removed
//! as a whole. A symbolic link is never followed or removed.

use crate::init::format_iso8601_utc;
use crate::shim::tail_shim_path;
use crate::store::{InstallLockGuard, LockError};
use crate::workspace::{resolve_workspace_root, WorkspaceError};
use std::io::{BufRead, IsTerminal, Write};
use std::path::{Component, Path, PathBuf};
use std::process::Command;
use std::time::SystemTime;

#[derive(Debug, thiserror::Error)]
pub enum UninstallError {
    #[error(transparent)]
    Workspace(#[from] WorkspaceError),
    #[error("refusing to purge {path}: {reason}")]
    PurgeRefused { path: PathBuf, reason: String },
    #[error("{0} is a symbolic link: refusing to remove through it")]
    Symlink(PathBuf),
    #[error("cannot reverse the project wiring: {0} is missing or not runnable; run `fgctl repair` first, then `fgctl uninstall`")]
    ShimMissing(PathBuf),
    #[error("{0}")]
    Failed(String),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
}

#[derive(Debug, Clone, Default)]
pub struct UninstallOptions {
    pub yes: bool,
    pub dry_run: bool,
    pub purge: bool,
}

// ---------------------------------------------------------------------------
// The release store: what `--purge` may remove
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum EntryKind {
    Release,
    Quarantine,
    Install,
}

impl EntryKind {
    fn dir(self) -> &'static str {
        match self {
            EntryKind::Release => "releases",
            EntryKind::Quarantine => "quarantine",
            EntryKind::Install => "installs",
        }
    }
}

const STORE_KINDS: [EntryKind; 3] = [
    EntryKind::Release,
    EntryKind::Quarantine,
    EntryKind::Install,
];

#[derive(Debug)]
pub struct StoreScan {
    /// Entries named the way fgOS names them, to remove.
    entries: Vec<(PathBuf, EntryKind)>,
    /// Entries of the three directories that are not fgOS's: left alone.
    foreign: Vec<PathBuf>,
    pub bytes: u64,
}

impl StoreScan {
    pub fn release_count(&self) -> usize {
        self.entries
            .iter()
            .filter(|(_, kind)| *kind == EntryKind::Release)
            .count()
    }
    pub fn foreign(&self) -> &[PathBuf] {
        &self.foreign
    }
}

fn is_digest_name(name: &str) -> bool {
    let hex = name
        .strip_prefix("sha256:")
        .or_else(|| name.strip_prefix("sha256-"));
    hex.is_some_and(|h| h.len() == 64 && h.bytes().all(|b| matches!(b, b'0'..=b'9' | b'a'..=b'f')))
}

fn owns_entry_name(kind: EntryKind, name: &str) -> bool {
    match kind {
        EntryKind::Release => is_digest_name(name),
        EntryKind::Quarantine => name.rsplit_once('-').is_some_and(|(digest, stamp)| {
            is_digest_name(digest) && !stamp.is_empty() && stamp.bytes().all(|b| b.is_ascii_digit())
        }),
        EntryKind::Install => name
            .strip_prefix("act_")
            .and_then(|rest| rest.strip_suffix(".json"))
            .is_some_and(|id| !id.is_empty() && id.bytes().all(|b| b.is_ascii_hexdigit())),
    }
}

/// Refuses a state root no purge may act under: not absolute, a `..` in it, `/`, the home
/// directory, or an ancestor of the home directory or of the project.
pub fn guard_store_root(
    root: &Path,
    home: Option<&Path>,
    workspace_root: &Path,
) -> Result<(), UninstallError> {
    let refuse = |reason: &str| {
        Err(UninstallError::PurgeRefused {
            path: root.to_path_buf(),
            reason: reason.to_string(),
        })
    };
    if !root.is_absolute() {
        return refuse("the state root is not an absolute path");
    }
    if root.components().any(|c| c == Component::ParentDir) {
        return refuse("the state root contains `..`");
    }
    if root.parent().is_none() {
        return refuse("the state root is the filesystem root");
    }
    if home.is_some_and(|h| root == h) {
        return refuse("the state root is your home directory");
    }
    if home.is_some_and(|h| h.starts_with(root)) || workspace_root.starts_with(root) {
        return refuse("the state root contains your home directory or this project");
    }
    Ok(())
}

fn path_size(path: &Path) -> u64 {
    let Ok(meta) = std::fs::symlink_metadata(path) else {
        return 0;
    };
    if meta.is_dir() {
        std::fs::read_dir(path)
            .map(|dir| dir.flatten().map(|e| path_size(&e.path())).sum())
            .unwrap_or(0)
    } else {
        meta.len()
    }
}

/// What the store holds under the three fgOS directories of `store_root`. Reads only.
pub fn scan_store(store_root: &Path) -> Result<StoreScan, UninstallError> {
    let mut scan = StoreScan {
        entries: Vec::new(),
        foreign: Vec::new(),
        bytes: 0,
    };
    for kind in STORE_KINDS {
        let dir = store_root.join(kind.dir());
        let meta = match std::fs::symlink_metadata(&dir) {
            Ok(meta) => meta,
            Err(err) if err.kind() == std::io::ErrorKind::NotFound => continue,
            Err(err) => return Err(err.into()),
        };
        if meta.file_type().is_symlink() {
            return Err(UninstallError::Symlink(dir));
        }
        for entry in std::fs::read_dir(&dir)? {
            let entry = entry?;
            let path = entry.path();
            let file_type = entry.file_type()?;
            let name = entry.file_name().to_string_lossy().into_owned();
            let shaped = owns_entry_name(kind, &name)
                && !file_type.is_symlink()
                && file_type.is_dir() == (kind != EntryKind::Install);
            if shaped {
                scan.bytes += path_size(&path);
                scan.entries.push((path, kind));
            } else {
                scan.foreign.push(path);
            }
        }
    }
    Ok(scan)
}

/// Removes the scanned entries one by one (each must still sit directly under its store directory
/// and still not be a link), then each store directory when nothing foreign keeps it.
pub fn purge_store(store_root: &Path, scan: &StoreScan) -> Result<usize, UninstallError> {
    let mut removed = 0;
    for (path, kind) in &scan.entries {
        let expected_parent = store_root.join(kind.dir());
        if path.parent() != Some(expected_parent.as_path()) {
            return Err(UninstallError::Failed(format!(
                "refusing to remove {}: it is not directly under {}",
                path.display(),
                expected_parent.display()
            )));
        }
        let meta = match std::fs::symlink_metadata(path) {
            Ok(meta) => meta,
            Err(err) if err.kind() == std::io::ErrorKind::NotFound => continue,
            Err(err) => return Err(err.into()),
        };
        if meta.file_type().is_symlink() {
            return Err(UninstallError::Symlink(path.clone()));
        }
        if meta.is_dir() {
            std::fs::remove_dir_all(path)?;
        } else {
            std::fs::remove_file(path)?;
        }
        removed += 1;
    }
    for kind in STORE_KINDS {
        // `remove_dir` refuses a directory that still holds anything.
        let _ = std::fs::remove_dir(store_root.join(kind.dir()));
    }
    Ok(removed)
}

// ---------------------------------------------------------------------------
// The project's installation directory
// ---------------------------------------------------------------------------

fn installation_dir(workspace_root: &Path) -> PathBuf {
    workspace_root.join(".fgos").join("installation")
}

/// The installation directory when the project has one; a link in its place is refused.
/// The project's own `fgos` launcher inside its installation: the one binary the Node half runs.
fn project_shim(workspace_root: &Path) -> PathBuf {
    tail_shim_path(
        &installation_dir(workspace_root).join("bin").join("fgos"),
        cfg!(windows),
    )
}

fn find_installation(workspace_root: &Path) -> Result<Option<PathBuf>, UninstallError> {
    // A link in `.fgos` would carry the removal and the backup out of the project.
    let fgos_dir = workspace_root.join(".fgos");
    match std::fs::symlink_metadata(&fgos_dir) {
        Ok(meta) if meta.file_type().is_symlink() => return Err(UninstallError::Symlink(fgos_dir)),
        Ok(_) => {}
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(err) => return Err(err.into()),
    }
    let dir = installation_dir(workspace_root);
    match std::fs::symlink_metadata(&dir) {
        Ok(meta) if meta.file_type().is_symlink() => Err(UninstallError::Symlink(dir)),
        Ok(meta) if meta.is_dir() => Ok(Some(dir)),
        Ok(_) => Err(UninstallError::Failed(format!(
            "{} is not a directory: refusing to remove it",
            dir.display()
        ))),
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(err) => Err(err.into()),
    }
}

fn timestamp() -> String {
    format_iso8601_utc(SystemTime::now()).replace(['-', ':', '.'], "")
}

/// Copies the activation record and the root record to `.fgos/uninstall-backup-<time>/`, then
/// removes the installation directory: the fixed path under the workspace root, asserted to be
/// inside it, never a link. Returns the backup directory.
fn remove_installation(
    workspace_root: &Path,
    dir: &Path,
) -> Result<Option<PathBuf>, UninstallError> {
    if dir != installation_dir(workspace_root) || !dir.starts_with(workspace_root) {
        return Err(UninstallError::Failed(format!(
            "refusing to remove {}: it is not the project's installation directory",
            dir.display()
        )));
    }
    let target_dir = workspace_root
        .join(".fgos")
        .join(format!("uninstall-backup-{}", timestamp()));
    let mut backup_dir = None;
    for record in ["activation.json", "root.json"] {
        let source = dir.join(record);
        if source.is_file() {
            std::fs::create_dir_all(&target_dir)?;
            std::fs::copy(&source, target_dir.join(record))?;
            backup_dir = Some(target_dir.clone());
        }
    }
    std::fs::remove_dir_all(dir)?;
    Ok(backup_dir)
}

// ---------------------------------------------------------------------------
// The Node half: the activated fgos reverses the project wiring
// ---------------------------------------------------------------------------

#[derive(Debug, Default)]
pub struct NodeReversal {
    pub changes: Vec<String>,
    pub keeps: Vec<String>,
    pub left_to_you: Vec<String>,
    pub backups: Vec<String>,
    pub failed: Vec<String>,
}

fn strings(value: &serde_json::Value, key: &str) -> Vec<String> {
    value[key]
        .as_array()
        .map(|a| {
            a.iter()
                .filter_map(|v| v.as_str().map(str::to_string))
                .collect()
        })
        .unwrap_or_default()
}

fn parse_reversal(stdout: &[u8]) -> Option<NodeReversal> {
    let value: serde_json::Value = serde_json::from_slice(stdout).ok()?;
    let data = value.get("data")?;
    Some(NodeReversal {
        changes: strings(data, "changes"),
        keeps: strings(data, "keeps"),
        left_to_you: strings(data, "leftToYou"),
        backups: data["backups"]
            .as_array()
            .map(|a| {
                a.iter()
                    .map(|b| {
                        format!(
                            "{} -> {}",
                            b["file"].as_str().unwrap_or("?"),
                            b["backup"].as_str().unwrap_or("?")
                        )
                    })
                    .collect()
            })
            .unwrap_or_default(),
        failed: data["failed"]
            .as_array()
            .map(|a| {
                a.iter()
                    .map(|f| {
                        format!(
                            "{}: {}",
                            f["id"].as_str().unwrap_or("?"),
                            f["error"].as_str().unwrap_or("?")
                        )
                    })
                    .collect()
            })
            .unwrap_or_default(),
    })
}

/// Runs `fgos uninstall` of the project's activated release (`--yes` when `apply`). A failed run
/// that still answered with its result returns it, `failed` filled; one that did not answer is an error.
fn run_node_reversal(workspace_root: &Path, apply: bool) -> Result<NodeReversal, UninstallError> {
    let mut command = Command::new(project_shim(workspace_root));
    command.arg("uninstall").current_dir(workspace_root);
    if apply {
        command.arg("--yes");
    }
    // The host's recursion guard would make a shim started from inside a host refuse.
    command.env_remove("FGOS_RUST_HOST_RECURSION_GUARD");
    let output = command.output()?;
    parse_reversal(&output.stdout).ok_or_else(|| {
        UninstallError::Failed(format!(
            "`fgos uninstall` gave no result (exit {}): {}",
            output.status.code().unwrap_or(1),
            String::from_utf8_lossy(&output.stderr).trim()
        ))
    })
}

// ---------------------------------------------------------------------------
// Ordered execution
// ---------------------------------------------------------------------------

pub struct Step<'a> {
    pub name: &'static str,
    pub irreversible: bool,
    pub run: Box<dyn FnOnce() -> Result<String, String> + 'a>,
}

#[derive(Debug, PartialEq, Eq)]
pub enum StepOutcome {
    Done(String),
    Failed(String),
    /// An irreversible step that did not run because an earlier step failed.
    Skipped,
}

/// Runs the steps in order. After one fails, a reversible step still runs; an irreversible one is skipped.
pub fn execute_steps(steps: Vec<Step<'_>>) -> Vec<(&'static str, StepOutcome)> {
    let mut failed = false;
    steps
        .into_iter()
        .map(|step| {
            if failed && step.irreversible {
                return (step.name, StepOutcome::Skipped);
            }
            match (step.run)() {
                Ok(message) => (step.name, StepOutcome::Done(message)),
                Err(message) => {
                    failed = true;
                    (step.name, StepOutcome::Failed(message))
                }
            }
        })
        .collect()
}

// ---------------------------------------------------------------------------
// The verb
// ---------------------------------------------------------------------------

fn home_dir() -> Option<PathBuf> {
    std::env::var_os("HOME")
        .or_else(|| std::env::var_os("USERPROFILE"))
        .filter(|h| !h.is_empty())
        .map(PathBuf::from)
}

fn megabytes(bytes: u64) -> String {
    format!("{:.1} MB", bytes as f64 / 1_048_576.0)
}

/// What stays on the machine because fgOS keeps no ownership mark on it: the fgctl binary and the
/// `fgos` launcher beside it.
fn left_binaries() -> Vec<String> {
    let Ok(exe) = std::env::current_exe() else {
        return Vec::new();
    };
    let mut lines = vec![format!(
        "fgctl: {} (remove it with `rm {}`)",
        exe.display(),
        exe.display()
    )];
    if let Some(dir) = exe.parent() {
        for name in ["fgos", "fgos.cmd"] {
            let launcher = dir.join(name);
            if launcher.is_file() {
                lines.push(format!(
                    "fgos launcher: {} (remove it with `rm {}`)",
                    launcher.display(),
                    launcher.display()
                ));
            }
        }
    }
    lines
}

fn confirmed() -> bool {
    print!("Apply this plan? [y/N] ");
    let _ = std::io::stdout().flush();
    let mut answer = String::new();
    std::io::stdin().lock().read_line(&mut answer).is_ok()
        && matches!(answer.trim(), "y" | "Y" | "yes")
}

fn print_section(title: &str, lines: &[String]) {
    if lines.is_empty() {
        return;
    }
    println!("{title}");
    for line in lines {
        println!("  {line}");
    }
}

/// Prints the plan, and changes the project only with `--yes` (or the person's yes at a terminal).
pub fn run_uninstall(
    cwd: &Path,
    options: &UninstallOptions,
    store_root: &Path,
) -> Result<(), UninstallError> {
    let workspace_root = resolve_workspace_root(cwd)?;
    let installation = find_installation(&workspace_root)?;
    let shim = project_shim(&workspace_root);
    let shim_runnable = installation.is_some() && shim.is_file();

    let reversal = if shim_runnable {
        Some(run_node_reversal(&workspace_root, false)?)
    } else {
        None
    };
    let purge = if options.purge {
        guard_store_root(store_root, home_dir().as_deref(), &workspace_root)?;
        Some(scan_store(store_root)?)
    } else {
        None
    };

    println!("fgctl uninstall: {}", workspace_root.display());
    if let Some(reversal) = &reversal {
        print_section("Will change in the project:", &reversal.changes);
    } else if installation.is_some() {
        println!("Project wiring (hooks, generated skills, git hooks): cannot be read, {} is missing; run `fgctl repair` first", shim.display());
    }
    if let Some(dir) = &installation {
        println!("Will remove: {} (the activation; a copy of its records goes to .fgos/uninstall-backup-<time>/ first)", dir.display());
    } else {
        println!("No activation in this project: nothing to remove under .fgos/installation");
    }
    if let Some(scan) = &purge {
        println!(
            "Will remove (--purge): the release store under {}: {} release(s), {}. Other projects pinned to these releases will need `fgctl init`.",
            store_root.display(),
            scan.release_count(),
            megabytes(scan.bytes)
        );
        for path in scan.foreign() {
            println!("  kept, not a fgOS store entry: {}", path.display());
        }
    }
    if let Some(reversal) = &reversal {
        print_section("Keeps:", &reversal.keeps);
    } else {
        println!("Keeps:\n  .fgos: your fgOS data and config\n  .fgos/distribution.json: the committed release pin");
    }
    let mut left = reversal
        .as_ref()
        .map(|r| r.left_to_you.clone())
        .unwrap_or_default();
    left.extend(left_binaries());
    print_section("Left to you (fgOS does not remove these):", &left);

    let interactive = std::io::stdin().is_terminal() && std::io::stdout().is_terminal();
    let go = !options.dry_run && (options.yes || (interactive && confirmed()));
    if !go {
        println!(
            "Nothing changed.{}",
            if options.dry_run || !interactive {
                " Re-run with --yes to apply this plan."
            } else {
                ""
            }
        );
        return Ok(());
    }
    if installation.is_some() && !shim_runnable {
        return Err(UninstallError::ShimMissing(shim));
    }

    let outcomes = {
        let workspace = &workspace_root;
        let mut steps: Vec<Step<'_>> = Vec::new();
        if shim_runnable {
            steps.push(Step {
                name: "project wiring",
                irreversible: false,
                run: Box::new(move || {
                    let done = run_node_reversal(workspace, true).map_err(|e| e.to_string())?;
                    if !done.failed.is_empty() {
                        return Err(done.failed.join("; "));
                    }
                    if done.backups.is_empty() {
                        Ok("hooks, generated skills and git hooks reversed".to_string())
                    } else {
                        Ok(format!("reversed; backups: {}", done.backups.join(", ")))
                    }
                }),
            });
        }
        // The lock is taken by the step that needs it and held until it ends.
        if let Some(dir) = installation.as_ref() {
            steps.push(Step {
                name: "activation",
                irreversible: true,
                run: Box::new(move || {
                    let _lock = InstallLockGuard::acquire(store_root)
                        .map_err(|e: LockError| e.to_string())?;
                    let backup = remove_installation(workspace, dir).map_err(|e| e.to_string())?;
                    Ok(match backup {
                        Some(b) => format!(
                            "removed {}; records copied to {}",
                            dir.display(),
                            b.display()
                        ),
                        None => format!("removed {}", dir.display()),
                    })
                }),
            });
        }
        if let Some(scan) = purge.as_ref() {
            steps.push(Step {
                name: "release store",
                irreversible: true,
                run: Box::new(move || {
                    let _lock = InstallLockGuard::acquire(store_root)
                        .map_err(|e: LockError| e.to_string())?;
                    let removed = purge_store(store_root, scan).map_err(|e| e.to_string())?;
                    Ok(format!(
                        "removed {removed} store entr(ies) under {}",
                        store_root.display()
                    ))
                }),
            });
        }
        execute_steps(steps)
    };

    let mut failed = false;
    for (name, outcome) in &outcomes {
        match outcome {
            StepOutcome::Done(message) => println!("done: {name}: {message}"),
            StepOutcome::Failed(message) => {
                failed = true;
                eprintln!("failed: {name}: {message}");
            }
            StepOutcome::Skipped => eprintln!(
                "skipped: {name}: an earlier step failed, so this irreversible step did not run"
            ),
        }
    }
    if failed {
        return Err(UninstallError::Failed(
            "uninstall did not finish; nothing irreversible ran after the failure".to_string(),
        ));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::cell::RefCell;

    const HEX: &str = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    fn scratch(name: &str) -> PathBuf {
        let dir =
            std::env::temp_dir().join(format!("fgctl-uninstall-{name}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn purge_guard_refuses_root_home_relative_dotdot_and_ancestors() {
        let home = PathBuf::from("/home/someone");
        let project = PathBuf::from("/home/someone/work/app");
        let refused =
            |root: &str| guard_store_root(Path::new(root), Some(&home), &project).is_err();
        assert!(refused("/"));
        assert!(refused("/home/someone"));
        assert!(refused("/home"), "an ancestor of the home directory");
        assert!(refused("relative/state/fgos"));
        assert!(refused("/home/someone/.local/../../other"));
        assert!(refused("/home/someone/work"), "an ancestor of the project");
        assert!(!refused("/home/someone/.local/state/fgos"));
    }

    #[test]
    fn irreversible_steps_skip_after_a_failure_and_reversible_ones_still_run() {
        let ran = RefCell::new(Vec::new());
        let step = |name: &'static str, irreversible: bool, ok: bool| {
            let ran = &ran;
            Step {
                name,
                irreversible,
                run: Box::new(move || {
                    ran.borrow_mut().push(name);
                    if ok {
                        Ok(String::new())
                    } else {
                        Err("no".to_string())
                    }
                }),
            }
        };
        let outcomes = execute_steps(vec![
            step("wiring", false, false),
            step("report", false, true),
            step("activation", true, true),
            step("store", true, true),
        ]);
        assert_eq!(*ran.borrow(), vec!["wiring", "report"]);
        assert_eq!(outcomes[2].1, StepOutcome::Skipped);
        assert_eq!(outcomes[3].1, StepOutcome::Skipped);
    }

    #[test]
    fn purge_removes_only_store_shaped_entries_and_keeps_the_rest_of_the_state_root() {
        let root = scratch("purge");
        let release = root.join("releases").join(format!("sha256:{HEX}"));
        std::fs::create_dir_all(release.join("bin")).unwrap();
        std::fs::write(release.join("bin").join("fgos"), "x").unwrap();
        std::fs::create_dir_all(root.join("releases").join("notes-of-mine")).unwrap();
        std::fs::create_dir_all(
            root.join("quarantine")
                .join(format!("sha256-{HEX}-1700000000")),
        )
        .unwrap();
        std::fs::create_dir_all(root.join("installs")).unwrap();
        std::fs::write(
            root.join("installs").join("act_000001a144188299.json"),
            "{}",
        )
        .unwrap();
        std::fs::create_dir_all(root.join("identity")).unwrap();
        std::fs::write(root.join("identity").join("session"), "keep").unwrap();
        std::fs::write(root.join("machine-id"), "keep").unwrap();

        let scan = scan_store(&root).unwrap();
        assert_eq!(scan.release_count(), 1);
        assert_eq!(scan.foreign().len(), 1);
        assert_eq!(purge_store(&root, &scan).unwrap(), 3);

        assert!(!release.exists());
        assert!(!root.join("installs").exists() && !root.join("quarantine").exists());
        assert!(
            root.join("releases").join("notes-of-mine").exists(),
            "a foreign entry stays, and so does its directory"
        );
        assert!(root.join("identity").join("session").exists() && root.join("machine-id").exists());
        let _ = std::fs::remove_dir_all(&root);
    }

    #[cfg(unix)]
    #[test]
    fn a_linked_entry_and_a_linked_store_directory_are_never_followed() {
        let root = scratch("links");
        let outside = scratch("links-outside");
        std::fs::write(outside.join("precious"), "keep").unwrap();
        std::fs::create_dir_all(root.join("releases")).unwrap();
        std::os::unix::fs::symlink(
            &outside,
            root.join("releases").join(format!("sha256:{HEX}")),
        )
        .unwrap();
        let scan = scan_store(&root).unwrap();
        assert_eq!(scan.release_count(), 0, "a link is not a store entry");
        assert_eq!(purge_store(&root, &scan).unwrap(), 0);
        assert!(outside.join("precious").exists());

        std::fs::remove_dir_all(root.join("releases")).unwrap();
        std::os::unix::fs::symlink(&outside, root.join("releases")).unwrap();
        assert!(matches!(scan_store(&root), Err(UninstallError::Symlink(_))));
        assert!(outside.join("precious").exists());
        let _ = std::fs::remove_dir_all(&root);
        let _ = std::fs::remove_dir_all(&outside);
    }

    #[test]
    fn entry_names_must_have_the_shape_fgos_gave_them() {
        assert!(owns_entry_name(
            EntryKind::Release,
            &format!("sha256:{HEX}")
        ));
        assert!(owns_entry_name(
            EntryKind::Release,
            &format!("sha256-{HEX}")
        ));
        assert!(!owns_entry_name(EntryKind::Release, "sha256:abc"));
        assert!(!owns_entry_name(
            EntryKind::Release,
            &format!("sha256:{HEX}x")
        ));
        assert!(owns_entry_name(
            EntryKind::Quarantine,
            &format!("sha256-{HEX}-123")
        ));
        assert!(!owns_entry_name(
            EntryKind::Quarantine,
            &format!("sha256-{HEX}")
        ));
        assert!(owns_entry_name(EntryKind::Install, "act_000001a1.json"));
        assert!(!owns_entry_name(EntryKind::Install, "act_.json"));
        assert!(!owns_entry_name(EntryKind::Install, "other.json"));
    }

    #[test]
    fn the_installation_directory_goes_with_a_copy_of_its_records_and_nothing_else_of_fgos_goes() {
        let root = scratch("installation");
        let dir = installation_dir(&root);
        std::fs::create_dir_all(dir.join("bin")).unwrap();
        std::fs::write(dir.join("activation.json"), "{\"a\":1}").unwrap();
        std::fs::write(dir.join("root.json"), "{\"r\":1}").unwrap();
        std::fs::write(dir.join("bin").join("fgos"), "#!/bin/sh").unwrap();
        std::fs::write(root.join(".fgos").join("config.yaml"), "keep").unwrap();
        std::fs::write(root.join(".fgos").join("distribution.json"), "keep").unwrap();

        let found = find_installation(&root)
            .unwrap()
            .expect("installation present");
        let backup = remove_installation(&root, &found)
            .unwrap()
            .expect("records copied");
        assert!(!dir.exists());
        assert_eq!(
            std::fs::read_to_string(backup.join("activation.json")).unwrap(),
            "{\"a\":1}"
        );
        assert!(
            root.join(".fgos").join("config.yaml").exists()
                && root.join(".fgos").join("distribution.json").exists()
        );

        assert!(
            remove_installation(&root, &root.join(".fgos")).is_err(),
            "only the installation directory may be removed"
        );
        let _ = std::fs::remove_dir_all(&root);
    }

    #[cfg(unix)]
    #[test]
    fn a_linked_installation_directory_is_refused() {
        let root = scratch("linked-installation");
        let outside = scratch("linked-installation-outside");
        std::fs::create_dir_all(root.join(".fgos")).unwrap();
        std::os::unix::fs::symlink(&outside, installation_dir(&root)).unwrap();
        assert!(matches!(
            find_installation(&root),
            Err(UninstallError::Symlink(_))
        ));
        assert!(outside.exists());

        // A link in `.fgos` itself would lead the removal and the backup out of the project.
        let linked = scratch("linked-fgos");
        std::fs::create_dir_all(outside.join("installation")).unwrap();
        std::fs::write(outside.join("installation").join("activation.json"), "keep").unwrap();
        std::os::unix::fs::symlink(&outside, linked.join(".fgos")).unwrap();
        assert!(matches!(
            find_installation(&linked),
            Err(UninstallError::Symlink(_))
        ));
        assert!(outside
            .join("installation")
            .join("activation.json")
            .exists());
        let _ = std::fs::remove_dir_all(&linked);
        let _ = std::fs::remove_dir_all(&root);
        let _ = std::fs::remove_dir_all(&outside);
    }
}
