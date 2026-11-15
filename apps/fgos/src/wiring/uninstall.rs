//! `fgos uninstall`: the project half of `fgctl uninstall`. It takes out of one project what fgOS wrote (the hook
//! entries and extensions in the agent configs, the generated skill directories, the git hooks path fgOS
//! wired, the project's managed timers) and keeps everything that is the person's. Without `--yes`, or with
//! `--dry-run`, it describes and changes nothing; one plan is built and then applied, so the plan a person
//! reads is the plan that runs.
//!
//! The pieces are the packaging layer's: the hook table (`agent_hooks`), the skill stamp reader
//! (`skill_stamp`), managed timers (`timer`), shell-rc detection (`rc_lines`), RepositoryConfig's ownership
//! proof for the hooks path (`fgos-git`) and Durable File for backups. Every file a run rewrites or deletes is
//! first copied to `<file>.pre-uninstall-<time>`; a failed backup runs nothing. Removal of a skill directory is
//! file by file under a root asserted inside the project, never through a link. Rc lines are only named.
//!
//! `fgctl uninstall` reads the answer's `changes`, `keeps`, `leftToYou`, `backups[{file, backup}]` and
//! `failed[{id, error}]`; the verb exits 1 when `failed` is not empty.

use crate::routing::Call;
use fgos_distribution::agent_config::{
    CLAUDE_PLUGIN_MARKETPLACE_NAME, CLAUDE_PLUGIN_REF, WIRE_AGENTS_COMMAND,
};
use fgos_distribution::agent_hooks::{uninstall_agent_hooks, UninstallResult, UninstallState};
use fgos_distribution::rc_lines::{checkout_integration_script, rc_files_sourcing};
use fgos_distribution::skill_stamp::{
    first_symlink_under, generated_skill_dirs, owned_skill_names, Foreign,
};
use fgos_distribution::timer::{remove_managed_timer, Schedule, TimerEnv};
use fgos_git::{GitDriver, Inspect, PathValue, ResolveRepo, Untracked};
use fgos_host_runtime::cli_args::{FlagScalar, FlagValue};
use fgos_host_runtime::{
    ContractRef, EventSink, HostInvocation, InvocationControl, OperationId, OperationProvider,
    OperationRequest, ProviderDescriptor, ProviderError, ProviderLifecycle, ProviderOutcome,
    VerbAnswer,
};
use serde_json::{json, Value};
use std::borrow::Cow;
use std::collections::{BTreeSet, HashMap, HashSet};
use std::ffi::OsString;
use std::future::Future;
use std::path::{Path, PathBuf};
use std::pin::Pin;

pub const OPERATION_ID: &str = "uninstall.run";

pub const DESCRIPTOR: ProviderDescriptor = ProviderDescriptor {
    provider_id: Cow::Borrowed(OPERATION_ID),
    operation_id: OperationId::from_static(OPERATION_ID),
    component_class: Cow::Borrowed("packaging"),
    mechanism: Cow::Borrowed("builtin"),
    lifecycle: ProviderLifecycle::Singleton,
    request_contract: ContractRef::from_static("uninstall.run.request", "1.0.0"),
    outcome_contract: ContractRef::from_static("uninstall.run.outcome", "1.0.0"),
    allowed_hosts: &["cli"],
    allowed_modes: &["sync"],
    capabilities: &[],
    replacement: None,
    concurrency: None,
    health: None,
};

/// What the project keeps, by path, for the plan to print.
const KEPT_PATHS: [(&str, &str); 2] = [
    (
        ".fgos",
        "your fgOS data and config (config.yaml, work, logs and the rest of .fgos)",
    ),
    (
        ".fgos/distribution.json",
        "the committed release pin, so `fgctl init` can bring fgOS back",
    ),
];

const SOURCE_CHECKOUT_SKIPPED: &str =
    "this project is the fgOS source checkout: its skill surfaces are its own render output";

/// The largest file the tracked-path read looks at; the read only needs to know whether the path exists.
const MAX_BLOB_BYTES: usize = 32 * 1024 * 1024;

/// One `fgos uninstall` call: the project the root door resolved and whether to apply the plan.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UninstallRequest {
    pub root: PathBuf,
    pub apply: bool,
}

/// Only a bare `--yes` applies, and a bare `--dry-run` cancels it, as the Node CLI read them (`--yes x` is a
/// value, not consent).
fn bare(flag: Option<&FlagValue>) -> bool {
    matches!(flag, Some(FlagValue::One(FlagScalar::Bool)))
}

/// Reads a call of `uninstall` (`args[0]` is the verb) through the shared parser.
pub fn project_uninstall_request(
    args: &[OsString],
    root: Result<PathBuf, String>,
) -> Result<UninstallRequest, String> {
    let call = Call::new(args);
    let flags = call.flags();
    Ok(UninstallRequest {
        root: root?,
        apply: bare(flags.flag("yes")) && !bare(flags.flag("dry-run")),
    })
}

/// What a reversal needs from the machine, named so a test can state each part.
pub struct Machine<'a> {
    /// The legacy payload root of the running release, or why it could not be found.
    pub payload: Result<&'a Path, String>,
    pub home: Option<&'a Path>,
    /// Node's platform name for the shell profiles (`win32` or anything else).
    pub platform: &'a str,
    /// The fgOS state root Git's driver works in.
    pub git_state_root: &'a Path,
    /// The scheduler front ends; `None` when no home directory is known.
    pub timers: Option<&'a TimerEnv<'a>>,
    /// The time part of a backup's name: the ISO instant without `-`, `:` and `.`.
    pub stamp: &'a str,
}

/// The data of the answer and the lines a run writes to stderr.
#[derive(Debug, Clone, PartialEq)]
pub struct Reversal {
    pub data: Value,
    pub notes: Vec<String>,
}

impl Reversal {
    /// A step that failed makes the whole verb exit 1, so `fgctl` leaves its own irreversible removal undone.
    pub fn exit(&self) -> i32 {
        i32::from(
            self.data["failed"]
                .as_array()
                .is_some_and(|failed| !failed.is_empty()),
        )
    }
}

fn failed_step(id: &str, error: impl std::fmt::Display) -> Value {
    json!({ "id": id, "error": error.to_string() })
}

fn path_text(path: &Path) -> String {
    path.to_string_lossy().into_owned()
}

fn inside(root: &Path, target: &Path) -> Result<(), String> {
    match target.strip_prefix(root) {
        Ok(rest) if !rest.as_os_str().is_empty() => Ok(()),
        _ => Err(format!(
            "refusing to remove {}: it is not inside {}",
            target.display(),
            root.display()
        )),
    }
}

// ---------------------------------------------------------------------------------------------------------
// Backups
// ---------------------------------------------------------------------------------------------------------

/// Copies each file beside itself as `<file>.pre-uninstall-<stamp>`, never over an existing name.
fn back_up(files: &[&Path], stamp: &str) -> Result<Vec<Value>, String> {
    let mut backups = Vec::new();
    for file in files {
        let name = file
            .file_name()
            .map(|n| n.to_string_lossy().into_owned())
            .ok_or_else(|| format!("{} has no file name", file.display()))?;
        let dir = file.parent().unwrap_or(Path::new("."));
        let backup = format!("{name}.pre-uninstall-{stamp}");
        let bytes = std::fs::read(file).map_err(|e| format!("{}: {e}", file.display()))?;
        let mode = file_mode(file);
        match fgos_durable_file::install_once_with_mode(dir, &backup, &bytes, mode) {
            Ok(fgos_durable_file::Installed::Created) => {}
            Ok(fgos_durable_file::Installed::AlreadyExists) => {
                return Err(format!("{} already exists", dir.join(&backup).display()))
            }
            Err(e) => return Err(format!("{}: {e}", dir.join(&backup).display())),
        }
        backups.push(json!({ "file": path_text(file), "backup": path_text(&dir.join(&backup)) }));
    }
    Ok(backups)
}

#[cfg(unix)]
fn file_mode(file: &Path) -> u32 {
    use std::os::unix::fs::PermissionsExt;
    std::fs::metadata(file).map_or(0o644, |m| m.permissions().mode() & 0o777)
}

#[cfg(not(unix))]
fn file_mode(_: &Path) -> u32 {
    0o644
}

// ---------------------------------------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------------------------------------

/// JavaScript's `String.prototype.trim` set: white space and line terminators, with the byte-order mark.
fn js_trim(text: &str) -> &str {
    text.trim_matches(|c: char| (c.is_whitespace() && c != '\u{85}') || c == '\u{feff}')
}

/// The text between the fences of a leading `---` block, or `None` when there is no closed block.
fn frontmatter_source(text: &str) -> Option<&str> {
    let content = text
        .strip_prefix("---\r\n")
        .or_else(|| text.strip_prefix("---\n"))?;
    (0..content.len())
        .filter(|at| content.is_char_boundary(*at))
        .find_map(|at| {
            let rest = &content[at..];
            let rest = rest
                .strip_prefix("\r\n")
                .or_else(|| rest.strip_prefix('\n'))?;
            let rest = rest.strip_prefix("---")?;
            (rest.starts_with("\r\n") || rest.starts_with('\n')).then(|| &content[..at])
        })
}

fn lookup<'a>(map: &'a fgos_yaml_doc::Value, key: &str) -> Option<&'a fgos_yaml_doc::Value> {
    match map {
        fgos_yaml_doc::Value::Map(entries) => {
            entries.iter().find(|(k, _)| k == key).map(|(_, v)| v)
        }
        _ => None,
    }
}

/// A skill file's declared version as dotted numbers, or `None` when it declares none the rule can read. A
/// version that is not a quoted dotted string, or a block the YAML door refuses, is ignored with a note.
fn skill_version(content: &str, file: &Path, notes: &mut Vec<String>) -> Option<Vec<f64>> {
    let source = frontmatter_source(content)?;
    let document = match fgos_yaml_doc::parse(
        source.as_bytes(),
        fgos_yaml_doc::Profile::Tool,
        &file.to_string_lossy(),
    ) {
        Ok(document) => document,
        Err(refusal) => {
            let at = match (refusal.line, refusal.column) {
                (Some(line), Some(column)) => format!(" (line {line}, column {column})"),
                _ => String::new(),
            };
            notes.push(format!(
                "{}: {}{at}; its version is ignored\n",
                file.display(),
                refusal.rule
            ));
            return None;
        }
    };
    let meta = document.value();
    match meta {
        fgos_yaml_doc::Value::Null => return None,
        fgos_yaml_doc::Value::Map(_) => {}
        _ => {
            notes.push(format!(
                "{}: frontmatter-not-a-mapping (line 2, column 1); its version is ignored\n",
                file.display()
            ));
            return None;
        }
    }
    let nested = lookup(meta, "metadata")
        .and_then(|metadata| lookup(metadata, "version"))
        .filter(|version| !matches!(version, fgos_yaml_doc::Value::Null));
    let version = nested.or_else(|| lookup(meta, "version"))?;
    let text = match version {
        fgos_yaml_doc::Value::Str(text) => js_trim(text),
        _ => "",
    };
    let dotted = !text.is_empty()
        && text
            .split('.')
            .all(|part| !part.is_empty() && part.bytes().all(|b| b.is_ascii_digit()));
    if !matches!(version, fgos_yaml_doc::Value::Str(_)) || !dotted {
        notes.push(format!(
            "{}: version is not a quoted dotted number, so it is ignored; quote it (\"1.10\")\n",
            file.display()
        ));
        return None;
    }
    Some(
        text.split('.')
            .map(|part| part.parse::<f64>().unwrap_or(f64::INFINITY))
            .collect(),
    )
}

fn is_newer(candidate: Option<&[f64]>, baseline: Option<&[f64]>) -> bool {
    let (Some(candidate), Some(baseline)) = (candidate, baseline) else {
        return false;
    };
    for at in 0..candidate.len().max(baseline.len()) {
        let diff =
            candidate.get(at).copied().unwrap_or(0.0) - baseline.get(at).copied().unwrap_or(0.0);
        if diff != 0.0 {
            return diff > 0.0;
        }
    }
    false
}

fn read_file(file: &Path) -> Option<Vec<u8>> {
    std::fs::read(file).ok()
}

/// Which files of a project's own skill folders a removal must leave: a tracked file with uncommitted changes
/// (its content would be lost) and every file of a skill whose `SKILL.md` declares a newer version than the
/// release's copy. Outside a repository, or when Git refuses, only the version rule applies.
struct SkillGuard<'a> {
    project: &'a Path,
    git_state_root: &'a Path,
    dirty: Option<HashSet<PathBuf>>,
    notes: Vec<String>,
}

impl<'a> SkillGuard<'a> {
    fn new(project: &'a Path, git_state_root: &'a Path) -> Self {
        Self {
            project,
            git_state_root,
            dirty: None,
            notes: Vec::new(),
        }
    }

    /// The tracked paths with changes since HEAD, absolute under the work tree; empty on any Git refusal.
    fn dirty_paths(&mut self) -> &HashSet<PathBuf> {
        let (project, state_root) = (self.project, self.git_state_root);
        self.dirty.get_or_insert_with(|| {
            let read = || -> Option<HashSet<PathBuf>> {
                let driver = GitDriver::new_if_root_exists(state_root).ok()??;
                let ResolveRepo::Repository(repo) = driver.resolve_repo(project, project).ok()?
                else {
                    return None;
                };
                let work_tree = repo.work_tree()?.to_path_buf();
                let mut paths = HashSet::new();
                let mut cursor = None;
                loop {
                    let page = driver
                        .status(
                            &repo,
                            Untracked::None,
                            Default::default(),
                            Default::default(),
                            cursor,
                            4096,
                        )
                        .ok()?;
                    for entry in &page.entries {
                        paths.insert(work_tree.join(&*String::from_utf8_lossy(&entry.path)));
                    }
                    cursor = page.next_cursor;
                    if cursor.is_none() {
                        return Some(paths);
                    }
                }
            };
            read().unwrap_or_default()
        })
    }

    /// Whether the removal must leave `target`: `versions` remembers each skill's answer, decided on its
    /// first file before any of its files goes.
    fn keep(
        &mut self,
        source_root: &Path,
        target_root: &Path,
        target: &Path,
        versions: &mut HashMap<String, bool>,
    ) -> bool {
        if read_file(target).is_none_or(|current| current.is_empty()) {
            return false;
        }
        let name = target
            .strip_prefix(target_root)
            .ok()
            .and_then(|rest| rest.components().next())
            .map(|c| c.as_os_str().to_string_lossy().into_owned())
            .unwrap_or_default();
        let ahead = *versions.entry(name.clone()).or_insert_with(|| {
            let target_md = target_root.join(&name).join("SKILL.md");
            let source_md = source_root.join(&name).join("SKILL.md");
            match (read_file(&target_md), read_file(&source_md)) {
                (Some(target_text), Some(source_text)) => {
                    let candidate = skill_version(
                        &String::from_utf8_lossy(&target_text),
                        &target_md,
                        &mut self.notes,
                    );
                    let baseline = skill_version(
                        &String::from_utf8_lossy(&source_text),
                        &source_md,
                        &mut self.notes,
                    );
                    is_newer(candidate.as_deref(), baseline.as_deref())
                }
                _ => false,
            }
        });
        if ahead {
            return true;
        }
        let real = std::fs::canonicalize(target).unwrap_or_else(|_| target.to_path_buf());
        self.dirty_paths().contains(&real)
    }
}

struct Skills {
    removed: Vec<PathBuf>,
    kept: Vec<(PathBuf, &'static str)>,
    foreign: Vec<Foreign>,
    skipped: Option<&'static str>,
}

const KEPT_BY_YOU: &str = "you changed it (uncommitted edit, or a newer version than the release)";

/// The files of one generated directory, one by one: a link or a file the guard names stays and is listed in
/// `kept`; the directory goes only when nothing stayed. Nothing is touched unless `apply`.
fn remove_generated_dir(
    root: &Path,
    dir: &Path,
    guard: &mut SkillGuard,
    source_root: &Path,
    apply: bool,
    kept: &mut Vec<(PathBuf, &'static str)>,
) -> Result<bool, String> {
    inside(root, dir)?;
    let before = kept.len();
    let mut versions = HashMap::new();
    fn walk(
        root: &Path,
        current: &Path,
        guard: &mut SkillGuard,
        source_root: &Path,
        versions: &mut HashMap<String, bool>,
        apply: bool,
        kept: &mut Vec<(PathBuf, &'static str)>,
    ) -> Result<(), String> {
        let io = |e: std::io::Error| format!("{}: {e}", current.display());
        let mut entries = std::fs::read_dir(current)
            .map_err(io)?
            .collect::<Result<Vec<_>, _>>()
            .map_err(io)?;
        entries.sort_by_key(|entry| entry.file_name());
        for entry in entries {
            let file = entry.path();
            inside(root, &file)?;
            let kind = entry.file_type().map_err(io)?;
            if kind.is_symlink() {
                kept.push((file, "a symbolic link"));
            } else if kind.is_dir() {
                walk(root, &file, guard, source_root, versions, apply, kept)?;
            } else if guard.keep(source_root, root, &file, versions) {
                kept.push((file, KEPT_BY_YOU));
            } else if apply {
                std::fs::remove_file(&file).map_err(|e| format!("{}: {e}", file.display()))?;
            }
        }
        if apply && std::fs::read_dir(current).map_err(io)?.next().is_none() {
            std::fs::remove_dir(current).map_err(io)?;
        }
        Ok(())
    }
    walk(root, dir, guard, source_root, &mut versions, apply, kept)?;
    Ok(kept.len() == before)
}

fn plan_skills(
    project: &Path,
    payload: &Path,
    git_state_root: &Path,
    apply: bool,
    notes: &mut Vec<String>,
) -> Result<Skills, String> {
    let real =
        |path: &Path| std::fs::canonicalize(path).map_err(|e| format!("{}: {e}", path.display()));
    if real(payload)? == real(project)? {
        return Ok(Skills {
            removed: Vec::new(),
            kept: Vec::new(),
            foreign: Vec::new(),
            skipped: Some(SOURCE_CHECKOUT_SKIPPED),
        });
    }
    let owned: BTreeSet<String> = owned_skill_names(payload).map_err(|e| e.to_string())?;
    let generated = generated_skill_dirs(project, &owned).map_err(|e| e.to_string())?;
    let mut guard = SkillGuard::new(project, git_state_root);
    let source_root = payload.join(".agents").join("skills");
    let mut removed = Vec::new();
    let mut kept = Vec::new();
    let outcome = (|| {
        for dir in &generated.ours {
            let skills_root = dir.parent().unwrap_or(project);
            if remove_generated_dir(skills_root, dir, &mut guard, &source_root, apply, &mut kept)? {
                removed.push(dir.clone());
            }
        }
        if apply {
            // An emptied root goes only when no component of its path is a link: removing a directory
            // would follow a parent link.
            for rel in [[".claude", "skills"], [".agents", "skills"]] {
                let root = rel
                    .iter()
                    .fold(project.to_path_buf(), |p, part| p.join(part));
                let empty = root.exists()
                    && first_symlink_under(project, &rel).is_none()
                    && std::fs::read_dir(&root)
                        .map_err(|e| format!("{}: {e}", root.display()))?
                        .next()
                        .is_none();
                if empty {
                    std::fs::remove_dir(&root).map_err(|e| format!("{}: {e}", root.display()))?;
                }
            }
        }
        Ok::<(), String>(())
    })();
    notes.append(&mut guard.notes);
    outcome?;
    Ok(Skills {
        removed,
        kept,
        foreign: generated.foreign,
        skipped: None,
    })
}

/// One line per skills root: the count, and the names when there are few.
fn skills_removal_lines(dirs: &[PathBuf], rel: &dyn Fn(&Path) -> String) -> Vec<String> {
    let mut roots: Vec<(PathBuf, Vec<String>)> = Vec::new();
    for dir in dirs {
        let root = dir.parent().unwrap_or(dir).to_path_buf();
        let name = dir
            .file_name()
            .map(|n| n.to_string_lossy().into_owned())
            .unwrap_or_default();
        match roots.iter_mut().find(|(r, _)| *r == root) {
            Some((_, names)) => names.push(name),
            None => roots.push((root, vec![name])),
        }
    }
    roots
        .into_iter()
        .map(|(root, names)| {
            let count = names.len();
            let plural = if count == 1 { "y" } else { "ies" };
            let listed = if count <= 3 {
                format!(" ({})", names.join(", "))
            } else {
                String::new()
            };
            format!(
                "{}: remove {count} generated skill director{plural}{listed}",
                rel(&root)
            )
        })
        .collect()
}

// ---------------------------------------------------------------------------------------------------------
// The git hooks path
// ---------------------------------------------------------------------------------------------------------

struct HooksOutcome {
    unwired: bool,
    skipped_existing: Option<String>,
}

fn git_error(error: fgos_git::OperationError) -> String {
    error.cause
}

/// Plan mode: whether the hooks path is wired to the project's own `.githooks`. Any refusal, a missing
/// repository or a state root that is gone reads as unwired, and nothing is created for the answer.
fn hooks_wired(project: &Path, git_state_root: &Path) -> bool {
    let read = || -> Option<bool> {
        let driver = GitDriver::new_if_root_exists(git_state_root).ok()??;
        let ResolveRepo::Repository(repo) = driver.resolve_repo(project, project).ok()? else {
            return None;
        };
        let owned = repo.trusted_main_root().join(".githooks");
        Some(driver.inspect_hooks(&repo, &owned).ok()?.wired)
    };
    read().unwrap_or(false)
}

/// Apply mode: the hooks path leaves only with RepositoryConfig's durable ownership proof; then the pre-commit
/// hook fgOS left (when the project does not track it) and the emptied `.githooks` go.
fn unwire_git_hooks(project: &Path, git_state_root: &Path) -> Result<HooksOutcome, String> {
    let nothing = HooksOutcome {
        unwired: false,
        skipped_existing: None,
    };
    if !project.join(".git").exists() {
        return Ok(nothing);
    }
    let driver = GitDriver::new(git_state_root).map_err(git_error)?;
    let ResolveRepo::Repository(repo) = driver.resolve_repo(project, project).map_err(git_error)?
    else {
        return Ok(nothing);
    };
    let owned = repo.trusted_main_root().join(".githooks");
    let before = driver.inspect_hooks(&repo, &owned).map_err(git_error)?;
    if before.configured_path.is_none() {
        return Ok(nothing);
    }
    let operation = format!(
        "uninstall-{}",
        fgos_identity::text::random_hex128().map_err(|e| e.to_string())?
    );
    let after = driver
        .remove_owned_hooks_config(&repo, &owned, &operation)
        .map_err(git_error)?;
    if after.configured_path.is_some() {
        return Ok(HooksOutcome {
            unwired: false,
            skipped_existing: after.configured_path,
        });
    }
    let pre_commit = owned.join("pre-commit");
    let tracked = match driver
        .resolve_commit_ref(&repo, "HEAD")
        .map_err(git_error)?
    {
        Some(head) => {
            let reads = driver
                .read_paths_at(
                    &repo,
                    &head,
                    &[b".githooks/pre-commit".to_vec()],
                    MAX_BLOB_BYTES,
                )
                .map_err(git_error)?;
            reads
                .first()
                .is_none_or(|read| !matches!(read.value, PathValue::Absent))
        }
        None => false,
    };
    if !tracked && pre_commit.exists() {
        std::fs::remove_file(&pre_commit).map_err(|e| format!("{}: {e}", pre_commit.display()))?;
    }
    let emptied = owned.exists()
        && std::fs::read_dir(&owned)
            .map_err(|e| format!("{}: {e}", owned.display()))?
            .next()
            .is_none();
    if emptied {
        std::fs::remove_dir(&owned).map_err(|e| format!("{}: {e}", owned.display()))?;
    }
    Ok(HooksOutcome {
        unwired: true,
        skipped_existing: None,
    })
}

// ---------------------------------------------------------------------------------------------------------
// The reversal
// ---------------------------------------------------------------------------------------------------------

/// What `fgos wire-agents` may have written to the person's own agent config. It keeps no record of it (only
/// `<file>.pre-wire-agents-<time>` copies beside each file it changed), so uninstall never touches it and names
/// how to undo it.
fn global_wiring_note() -> String {
    format!(
        "global agent config changed by `{WIRE_AGENTS_COMMAND}`, if you ran it: left alone, fgOS keeps no record to undo it from. To undo it: claude plugin uninstall {CLAUDE_PLUGIN_REF}; claude plugin marketplace remove {CLAUDE_PLUGIN_MARKETPLACE_NAME}; restore any <file>.pre-wire-agents-<time> backup beside your agent config by hand"
    )
}

/// Describes (`apply: false`) or does (`apply: true`) the project half of an uninstall. A failure of one step is
/// listed in `failed` and never stops the others, except a failed backup, which runs nothing.
pub fn uninstall_project(root: &Path, apply: bool, machine: &Machine) -> Reversal {
    let mut failed: Vec<Value> = Vec::new();
    let mut notes = Vec::new();

    let described: Vec<UninstallResult> = match uninstall_agent_hooks(root, false) {
        Ok(described) => described,
        Err(error) => {
            failed.push(failed_step("agent-hooks", error));
            Vec::new()
        }
    };
    let hook_changes: Vec<&UninstallResult> = described
        .iter()
        .filter(|r| r.state == UninstallState::Changed)
        .collect();
    let hooks_json = serde_json::to_value(&described).expect("hook results are plain data");
    let mut backups: Vec<Value> = Vec::new();
    if apply {
        // A step whose backup fails runs nothing and leaves the file as it is.
        let files: Vec<&Path> = hook_changes.iter().map(|r| r.file.as_path()).collect();
        match back_up(&files, machine.stamp) {
            Ok(made) => backups = made,
            Err(error) => {
                failed.push(failed_step(
                    "backup",
                    format!("backup failed, nothing changed: {error}"),
                ));
                return Reversal {
                    data: json!({
                        "applied": true,
                        "hooks": hooks_json,
                        "skills": null,
                        "backups": [],
                        "failed": failed,
                        "changes": [],
                        "keeps": [],
                        "leftToYou": [],
                    }),
                    notes,
                };
            }
        }
        if let Err(error) = uninstall_agent_hooks(root, true) {
            failed.push(failed_step("agent-hooks", error));
        }
    }

    let skills = match &machine.payload {
        Ok(payload) => {
            match plan_skills(root, payload, machine.git_state_root, apply, &mut notes) {
                Ok(skills) => skills,
                Err(error) => {
                    failed.push(failed_step("skills", error));
                    no_skills()
                }
            }
        }
        Err(error) => {
            failed.push(failed_step("payload", error));
            no_skills()
        }
    };

    let git_hooks = if apply {
        unwire_git_hooks(root, machine.git_state_root).unwrap_or_else(|error| {
            failed.push(failed_step("git-hooks", error));
            HooksOutcome {
                unwired: false,
                skipped_existing: None,
            }
        })
    } else {
        HooksOutcome {
            unwired: hooks_wired(root, machine.git_state_root),
            skipped_existing: None,
        }
    };

    let mut timer_messages = Vec::new();
    if apply {
        for schedule in Schedule::ALL {
            match machine.timers {
                Some(env) => {
                    let fix = remove_managed_timer(schedule, root, env);
                    if fix.fixed {
                        timer_messages.push(fix.message);
                    }
                }
                None => failed.push(failed_step(
                    &format!("{}-timer", schedule.name()),
                    "no home directory is known",
                )),
            }
        }
    }

    let script = machine
        .payload
        .as_ref()
        .ok()
        .and_then(|payload| checkout_integration_script(payload));
    let rc_lines: Vec<(PathBuf, String)> = match (&script, machine.home) {
        (Some(script), Some(home)) => match rc_files_sourcing(home, machine.platform, script) {
            Ok(files) => files
                .into_iter()
                .map(|file| (file, format!("source \"{}\"", script.display())))
                .collect(),
            Err(error) => {
                failed.push(failed_step("shell-rc", error));
                Vec::new()
            }
        },
        _ => Vec::new(),
    };

    let rel = |file: &Path| {
        file.strip_prefix(root)
            .ok()
            .filter(|rest| !rest.as_os_str().is_empty())
            .map_or_else(|| path_text(file), path_text)
    };
    let mut changes: Vec<String> = Vec::new();
    for result in &hook_changes {
        for name in &result.removed {
            changes.push(format!("{}: remove the fgOS hook {name}", result.label));
        }
    }
    changes.extend(skills_removal_lines(&skills.removed, &rel));
    if git_hooks.unwired {
        changes.push(
            "git: unset core.hooksPath (fgOS wired it) and remove the empty .githooks it left"
                .to_owned(),
        );
    }
    changes.extend(timer_messages);

    let mut keeps: Vec<String> = KEPT_PATHS
        .iter()
        .map(|(file, why)| format!("{file}: {why}"))
        .collect();
    keeps.extend(described.iter().flat_map(|r| r.kept.iter().cloned()));
    keeps.extend(
        skills
            .kept
            .iter()
            .map(|(path, why)| format!("{}: kept, {why}", rel(path))),
    );
    keeps.extend(skills.foreign.iter().map(|f| {
        format!(
            "{}: kept, not generated by fgOS ({}); remove it by hand if it is not yours",
            rel(&f.dir),
            f.why
        )
    }));
    if let Some(why) = skills.skipped {
        keeps.push(format!("skills: {why}"));
    }
    if let Some(existing) = &git_hooks.skipped_existing {
        keeps.push(format!(
            "git: core.hooksPath {existing} is yours (fgOS did not set it): kept"
        ));
    }

    let mut left_to_you: Vec<String> = rc_lines
        .iter()
        .map(|(rc, line)| {
            format!(
                "{}: remove the line {line} by hand (fgOS never edits a shell profile)",
                rc.display()
            )
        })
        .collect();
    left_to_you.push(global_wiring_note());

    let rc_json: Vec<Value> = rc_lines
        .iter()
        .map(|(rc, line)| json!({ "rcFile": path_text(rc), "sourceLine": line }))
        .collect();
    let removal = if rc_lines.is_empty() {
        Value::Null
    } else {
        json!("fgOS never edits your shell profile \u{2014} remove the line(s) above by hand.")
    };
    let data = json!({
        "applied": apply,
        "hooks": hooks_json,
        "skills": {
            "removed": skills.removed.iter().map(|p| path_text(p)).collect::<Vec<_>>(),
            "kept": skills.kept.iter().map(|(p, why)| json!({ "path": path_text(p), "why": why })).collect::<Vec<_>>(),
            "foreign": skills.foreign.iter().map(|f| json!({ "dir": path_text(&f.dir), "why": f.why })).collect::<Vec<_>>(),
            "skipped": skills.skipped,
        },
        "changes": changes,
        "keeps": keeps,
        "leftToYou": left_to_you,
        "backups": backups,
        "failed": failed,
        "hooksUnwired": git_hooks.unwired,
        "hooksSkippedExisting": git_hooks.skipped_existing,
        "shellRcSourceLinesFound": rc_json,
        "shellRcRemovalInstructions": removal,
    });
    Reversal { data, notes }
}

fn no_skills() -> Skills {
    Skills {
        removed: Vec::new(),
        kept: Vec::new(),
        foreign: Vec::new(),
        skipped: None,
    }
}

// ---------------------------------------------------------------------------------------------------------
// The provider
// ---------------------------------------------------------------------------------------------------------

/// The reversal against this machine: the running release's payload, the process environment and clock.
fn run(request: &UninstallRequest) -> Reversal {
    let payload = crate::legacy_exec::resolve_payload().map(|payload| payload.root);
    let home = fgos_config::machine::home_dir(|key| std::env::var(key).ok());
    let (state_root, _) = fgos_holder_lock::state_root::state_root();
    let timers = TimerEnv::system();
    let stamp: String =
        fgos_host_runtime::civil_time::format_system_time_utc(std::time::SystemTime::now())
            .chars()
            .filter(|c| !matches!(c, '-' | ':' | '.'))
            .collect();
    uninstall_project(
        &request.root,
        request.apply,
        &Machine {
            payload: payload.as_deref().map_err(Clone::clone),
            home: home.as_deref(),
            platform: if cfg!(windows) { "win32" } else { "linux" },
            git_state_root: &state_root,
            timers: timers.as_ref(),
            stamp: &stamp,
        },
    )
}

/// The provider of `uninstall.run`.
pub struct UninstallProvider {
    descriptor: ProviderDescriptor,
}

impl UninstallProvider {
    pub fn new() -> Self {
        Self {
            descriptor: DESCRIPTOR,
        }
    }
}

impl Default for UninstallProvider {
    fn default() -> Self {
        Self::new()
    }
}

impl OperationProvider for UninstallProvider {
    fn descriptor(&self) -> &ProviderDescriptor {
        &self.descriptor
    }

    fn invoke<'a>(
        &'a self,
        _invocation: &'a HostInvocation,
        request: OperationRequest,
        _control: InvocationControl,
        events: &'a dyn EventSink,
    ) -> Pin<Box<dyn Future<Output = Result<ProviderOutcome, ProviderError>> + Send + 'a>> {
        Box::pin(async move {
            events.record_event(&format!("{OPERATION_ID}.invoked"));
            let request = request
                .input
                .downcast_ref::<UninstallRequest>()
                .ok_or_else(|| {
                    ProviderError::SemanticValidation("input is not UninstallRequest".into())
                })?
                .clone();
            // The reversal reads and removes files and runs Git and the scheduler: never on the async worker.
            let reversal = tokio::task::spawn_blocking(move || run(&request))
                .await
                .map_err(|error| ProviderError::ProviderFailed(error.to_string()))?;
            for note in &reversal.notes {
                eprint!("{note}");
            }
            Ok(ProviderOutcome::completed(
                DESCRIPTOR.outcome_contract.clone(),
                Box::new(VerbAnswer {
                    exit: reversal.exit(),
                    text: None,
                    data: reversal.data,
                }),
            ))
        })
    }
}
