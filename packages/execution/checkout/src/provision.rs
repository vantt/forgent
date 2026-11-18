//! Provisioning: dependency install, the project's setup commands, the main checkout's ignored skill directories,
//! and the record of what they placed.

use crate::record::{self, Placed, Record};
use crate::{git, Error, ErrorKind, Result};
use fgos_git::GitDriver;
use fgos_process::spawn::{resolve_program, run_bounded_command, Outcome};
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::collections::BTreeSet;
use std::fs;
use std::path::Path;
use std::process::Command;
use std::time::Duration;

/// Generous ceiling for one install or setup command (a cold compile can take minutes on a loaded machine); it
/// only keeps a hung command from wedging a claim forever.
const COMMAND_TIMEOUT: Duration = Duration::from_secs(30 * 60);

/// The skill root of each agent CLI, the list `src/util/agent-skill-dirs.mjs` keeps.
const SKILL_ROOTS: [&str; 5] = [
    ".claude/skills",
    ".agents/skills",
    ".omp/skills",
    ".pi/skills",
    ".grok/skills",
];

fn output_text(stdout: &[u8], stderr: &[u8]) -> String {
    format!(
        "{}{}",
        String::from_utf8_lossy(stdout),
        String::from_utf8_lossy(stderr)
    )
    .trim()
    .to_owned()
}

/// Run `command` to completion in `cwd`; `Err` carries the failure text (exit status or timeout, then output).
fn run(command: Command, label: &str) -> std::result::Result<(), String> {
    match run_bounded_command(command, None, COMMAND_TIMEOUT, |_| ()) {
        Ok(Outcome::Exited(out)) if out.status.success() => Ok(()),
        Ok(Outcome::Exited(out)) => Err(format!(
            "{label} failed ({}){}",
            out.status,
            tail(&output_text(&out.stdout, &out.stderr))
        )),
        Ok(Outcome::TimedOut { stdout, stderr }) => Err(format!(
            "{label} timed out{}",
            tail(&output_text(&stdout, &stderr))
        )),
        Err(error) => Err(format!("{label} could not start: {error}")),
    }
}

fn tail(output: &str) -> String {
    if output.is_empty() {
        String::new()
    } else {
        format!("\n{output}")
    }
}

/// Install the checkout's own `node_modules`: `npm ci` when `package-lock.json` exists, else `npm install`, only
/// when `package.json` declares dependencies or devDependencies. Returns whether it installed.
pub fn provision_dependencies(worktree: &Path) -> Result<bool> {
    let manifest = worktree.join("package.json");
    let Ok(text) = fs::read_to_string(&manifest) else {
        return Ok(false);
    };
    let package: Value = serde_json::from_str(&text).map_err(|e| {
        Error::new(
            ErrorKind::Provision,
            format!("{} is not valid JSON: {e}", manifest.display()),
        )
        .at(worktree)
    })?;
    let declared = |key: &str| {
        package
            .get(key)
            .and_then(Value::as_object)
            .is_some_and(|o| !o.is_empty())
    };
    if !declared("dependencies") && !declared("devDependencies") {
        return Ok(false);
    }
    let subcommand = if worktree.join("package-lock.json").exists() {
        "ci"
    } else {
        "install"
    };
    // npm as the caller's environment finds it: PATH, and on Windows PATHEXT for its `npm.cmd` shim.
    let Some(npm) = resolve_program(
        "npm",
        &std::env::var("PATH").unwrap_or_default(),
        &std::env::var("PATHEXT").unwrap_or_default(),
        cfg!(windows),
    ) else {
        return Err(Error::new(
            ErrorKind::Provision,
            format!(
                "npm {subcommand} failed in \"{}\": npm is not on PATH",
                worktree.display()
            ),
        )
        .at(worktree));
    };
    let mut command = Command::new(npm);
    command.arg(subcommand).current_dir(worktree);
    run(command, &format!("npm {subcommand}")).map_err(|m| {
        Error::new(
            ErrorKind::Provision,
            format!("{m} in \"{}\"", worktree.display()),
        )
        .at(worktree)
    })?;
    Ok(true)
}

/// The configured `worktreeSetup.commands`, read from the main checkout's project config whatever root is passed:
/// a worker's edit to its own checkout's config never changes what runs.
fn setup_commands(repo_root: &Path) -> Result<Vec<String>> {
    let snapshot = fgos_config::machine::project_snapshot(repo_root, |key| std::env::var(key).ok())
        .map_err(|e| {
            Error::new(
                ErrorKind::Provision,
                format!("reading worktreeSetup.commands failed: {e:?}"),
            )
        })?;
    Ok(snapshot
        .value
        .get("worktreeSetup")
        .and_then(|s| s.get("commands"))
        .and_then(Value::as_array)
        .map(|rows| {
            rows.iter()
                .filter_map(|v| v.as_str().map(str::to_owned))
                .collect()
        })
        .unwrap_or_default())
}

/// Run each configured setup command through the shell in `worktree`, in order, with `FGOS_REPO_ROOT` set to the
/// main checkout. The first failure stops the run and names the command with its output.
pub fn run_setup_commands(worktree: &Path, repo_root: &Path) -> Result<()> {
    for line in setup_commands(repo_root)? {
        #[cfg(windows)]
        let mut command = {
            let mut c = Command::new("cmd");
            c.args(["/d", "/s", "/c", &line]);
            c
        };
        #[cfg(not(windows))]
        let mut command = {
            let mut c = Command::new("sh");
            c.args(["-c", &line]);
            c
        };
        command
            .current_dir(worktree)
            .env("FGOS_REPO_ROOT", repo_root);
        run(command, "command").map_err(|detail| {
            let output = detail
                .split_once('\n')
                .map(|(_, o)| format!("\n{o}"))
                .unwrap_or_default();
            let mut error = Error::new(
                ErrorKind::Provision,
                format!(
                    "worktree setup command failed in \"{}\": {line}{output}",
                    worktree.display()
                ),
            )
            .at(worktree);
            error.command = Some(line.clone());
            error
        })?;
    }
    Ok(())
}

fn copy_tree(source: &Path, target: &Path) -> std::io::Result<()> {
    let meta = fs::symlink_metadata(source)?;
    if meta.file_type().is_symlink() {
        let link = fs::read_link(source)?;
        #[cfg(unix)]
        return std::os::unix::fs::symlink(link, target);
        #[cfg(windows)]
        return if fs::metadata(source).is_ok_and(|m| m.is_dir()) {
            std::os::windows::fs::symlink_dir(link, target)
        } else {
            std::os::windows::fs::symlink_file(link, target)
        };
    }
    if meta.is_dir() {
        fs::create_dir(target)?;
        for entry in fs::read_dir(source)? {
            let entry = entry?;
            copy_tree(&entry.path(), &target.join(entry.file_name()))?;
        }
        Ok(())
    } else {
        fs::copy(source, target).map(drop)
    }
}

/// Give the checkout the skill directories the main checkout holds that Git does not: under each agent CLI's skill
/// root, every directory the main checkout ignores and the checkout lacks. Copied for real, never hardlinked; a
/// link is never followed; an existing target is left alone, so a rerun copies nothing.
pub fn provision_skill_roots(driver: &GitDriver, worktree: &Path, repo_root: &Path) -> Result<()> {
    let repo = git::open(driver, repo_root, repo_root)?;
    let ignored_dirs: Vec<String> = git::status_entries(driver, &repo)?
        .into_iter()
        .filter(|e| e.ignored)
        .map(|e| String::from_utf8_lossy(&e.path).into_owned())
        .filter(|rel| rel.ends_with('/'))
        .collect();
    for root in SKILL_ROOTS {
        let source = repo_root.join(root);
        match fs::symlink_metadata(&source) {
            Ok(meta) if meta.is_dir() => {}
            _ => continue,
        }
        let Ok(entries) = fs::read_dir(&source) else {
            continue;
        };
        let mut names: Vec<_> = entries.filter_map(std::result::Result::ok).collect();
        names.sort_by_key(fs::DirEntry::file_name);
        for entry in names {
            if !entry.file_type().is_ok_and(|t| t.is_dir()) {
                continue;
            }
            let rel = format!("{root}/{}", entry.file_name().to_string_lossy());
            let target = worktree.join(&rel);
            let covered = ignored_dirs
                .iter()
                .any(|dir| format!("{rel}/").starts_with(dir.as_str()));
            if !covered || target.exists() {
                continue;
            }
            if let Some(parent) = target.parent() {
                fs::create_dir_all(parent)
                    .map_err(|e| Error::io(format!("creating {}", parent.display()), &e))?;
            }
            copy_tree(&entry.path(), &target).map_err(|e| {
                Error::new(
                    ErrorKind::Provision,
                    format!(
                        "could not copy skill directory \"{rel}\" into \"{}\": {e}",
                        worktree.display()
                    ),
                )
                .at(worktree)
            })?;
        }
    }
    Ok(())
}

/// Untracked and ignored paths of the checkout, a wholly untracked or ignored directory collapsed to `dir/`. Git
/// also names an ignored path inside a collapsed untracked directory; the directory already covers it.
pub(crate) fn untracked_entries(
    driver: &GitDriver,
    worktree: &Path,
    repo_root: &Path,
) -> Result<Vec<String>> {
    let repo = git::open(driver, worktree, repo_root)?;
    let listed: Vec<String> = git::status_entries(driver, &repo)?
        .into_iter()
        .filter(|e| e.untracked || e.ignored)
        .map(|e| String::from_utf8_lossy(&e.path).into_owned())
        .collect();
    let dirs: Vec<&String> = listed.iter().filter(|rel| rel.ends_with('/')).collect();
    Ok(listed
        .iter()
        .filter(|rel| {
            !dirs
                .iter()
                .any(|dir| *rel != *dir && rel.starts_with(dir.as_str()))
        })
        .cloned()
        .collect())
}

pub(crate) fn file_digest(file: &Path) -> std::io::Result<String> {
    Ok(Sha256::digest(fs::read(file)?)
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect())
}

/// Record `rel` and everything under it: a file by its digest, a symlink by its target. Any other kind is left
/// unrecorded, so remove leaves it in place.
fn record_placed(worktree: &Path, rel: &str, placed: &mut Vec<Placed>) -> std::io::Result<()> {
    let abs = worktree.join(rel);
    let meta = fs::symlink_metadata(&abs)?;
    if meta.file_type().is_symlink() {
        placed.push(Placed::Symlink {
            path: rel.to_owned(),
            target: fs::read_link(&abs)?.to_string_lossy().into_owned(),
        });
    } else if meta.is_file() {
        placed.push(Placed::File {
            path: rel.to_owned(),
            sha256: file_digest(&abs)?,
        });
    } else if meta.is_dir() {
        placed.push(Placed::Dir {
            path: rel.to_owned(),
        });
        let mut names: Vec<String> = fs::read_dir(&abs)?
            .filter_map(|e| e.ok().map(|e| e.file_name().to_string_lossy().into_owned()))
            .collect();
        names.sort();
        for name in names {
            record_placed(worktree, &format!("{rel}/{name}"), placed)?;
        }
    }
    Ok(())
}

/// Provision a checkout the Git port has just created (dependency install, the main checkout's ignored skill
/// directories, then the project's setup commands) and record what that placed: every new untracked or ignored
/// path, a file with its content digest, and the dependency directory declared as regenerable. The record is
/// written even when a step fails, so a half provisioned checkout can still be removed. `disposable` marks a
/// checkout made only to run a check in: removal then takes back every untracked or ignored byte there.
pub fn provision(
    worktree: &Path,
    repo_root: &Path,
    state_root: &Path,
    disposable: bool,
) -> Result<()> {
    let driver = git::driver(state_root)?;
    let before: BTreeSet<String> = untracked_entries(&driver, worktree, repo_root)?
        .into_iter()
        .collect();
    let mut regenerable = Vec::new();
    let steps = (|| -> Result<()> {
        if provision_dependencies(worktree)? {
            regenerable.push("node_modules".to_owned());
        }
        provision_skill_roots(&driver, worktree, repo_root)?;
        run_setup_commands(worktree, repo_root)
    })();
    let mut placed = Vec::new();
    for entry in untracked_entries(&driver, worktree, repo_root)? {
        let rel = entry.trim_end_matches('/');
        if !before.contains(&entry) && !regenerable.iter().any(|r| r == rel) {
            record_placed(worktree, rel, &mut placed)
                .map_err(|e| Error::io(format!("recording {rel}"), &e))?;
        }
    }
    let (dev, ino) = record::stat_identity(worktree)
        .map_err(|e| Error::io(format!("reading {}", worktree.display()), &e))?;
    record::write(
        state_root,
        worktree,
        &Record {
            worktree: record::realpath_or_self(worktree),
            dev,
            ino,
            regenerable,
            placed,
            disposable,
        },
    )?;
    steps
}
