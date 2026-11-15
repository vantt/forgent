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
use fgos_distribution::uninstall::broad_root;
use fgos_git::{GitDriver, Inspect, PathValue, ResolveRepo, Untracked};
use fgos_host_runtime::cli_args::{FlagScalar, FlagValue};
use fgos_host_runtime::{
    CategorisedRefusal, ContractRef, EventSink, HostInvocation, InvocationControl, OperationId,
    OperationProvider, OperationRequest, ProviderDescriptor, ProviderError, ProviderLifecycle,
    ProviderOutcome, VerbAnswer,
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

/// A project root no reversal may act on: the filesystem root, the person's home directory, or a directory that
/// contains it. Refused as a missing precondition before anything is read or removed.
fn refuse_broad_root(root: &Path, home: Option<&Path>) -> Result<(), CategorisedRefusal> {
    match broad_root(root, home) {
        Some(what) => Err(CategorisedRefusal::new(
            "precondition",
            format!(
                "refusing to uninstall from {}: it is {what}; run uninstall inside a project",
                root.display()
            ),
        )),
        None => Ok(()),
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
    /// The link the hooks directory is reached through: nothing inside it was touched.
    left_link: Option<PathBuf>,
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
        left_link: None,
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
            left_link: None,
        });
    }
    // The configuration is already unset. A hooks directory reached through a link is somewhere else's: nothing
    // inside it is removed.
    if let Some(link) = first_symlink_under(project, &[".githooks"]) {
        return Ok(HooksOutcome {
            unwired: true,
            skipped_existing: None,
            left_link: Some(link),
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
        left_link: None,
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
                left_link: None,
            }
        })
    } else {
        HooksOutcome {
            unwired: hooks_wired(root, machine.git_state_root),
            skipped_existing: None,
            left_link: None,
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
    if let Some(link) = &git_hooks.left_link {
        keeps.push(format!(
            "git: .githooks is reached through a symbolic link ({}): left as it is",
            link.display()
        ));
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

/// Where the running release's legacy payload root is found; the composition root hands it in, so this module
/// never reaches for the legacy lane itself.
pub type PayloadRoot = fn() -> Result<PathBuf, String>;

/// The reversal against this machine: the running release's payload, the process environment and clock.
fn run(
    request: &UninstallRequest,
    payload_root: PayloadRoot,
) -> Result<Reversal, CategorisedRefusal> {
    let payload = payload_root();
    let home = fgos_config::machine::home_dir(|key| std::env::var(key).ok());
    refuse_broad_root(&request.root, home.as_deref())?;
    let (state_root, _) = fgos_holder_lock::state_root::state_root();
    let timers = TimerEnv::system();
    let stamp: String =
        fgos_host_runtime::civil_time::format_system_time_utc(std::time::SystemTime::now())
            .chars()
            .filter(|c| !matches!(c, '-' | ':' | '.'))
            .collect();
    Ok(uninstall_project(
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
    ))
}

/// The provider of `uninstall.run`.
pub struct UninstallProvider {
    descriptor: ProviderDescriptor,
    payload_root: PayloadRoot,
}

impl UninstallProvider {
    pub fn new(payload_root: PayloadRoot) -> Self {
        Self {
            descriptor: DESCRIPTOR,
            payload_root,
        }
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
            let payload_root = self.payload_root;
            let served = tokio::task::spawn_blocking(move || run(&request, payload_root))
                .await
                .map_err(|error| ProviderError::ProviderFailed(error.to_string()))?;
            let reversal = match served {
                Ok(reversal) => reversal,
                Err(refusal) => {
                    return Ok(ProviderOutcome::completed(
                        DESCRIPTOR.outcome_contract.clone(),
                        Box::new(refusal),
                    ))
                }
            };
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

#[cfg(test)]
mod tests {
    use super::*;
    use fgos_distribution::agent_hooks::install_all;
    use fgos_distribution::timer::{unit_stem, Host};
    use std::collections::BTreeMap;
    use std::process::Command;

    const WRAPPER_STAMP: &str = "This is a generated thin wrapper (tsk-1qi) -- do not edit directly, edit the source instead.";
    const GIT_DIR: &str = ".git";

    /// A world of its own: a project directory (a repository only where a test makes it one), a HOME, a payload that owns the skill
    /// `distill` (version 0.1) and a state root for Git's driver that does not exist unless a test makes it.
    struct World {
        base: PathBuf,
        project: PathBuf,
        home: PathBuf,
        payload: PathBuf,
        state: PathBuf,
    }

    impl World {
        fn new(label: &str) -> World {
            static COUNTER: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);
            let n = COUNTER.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
            let base = std::fs::canonicalize(std::env::temp_dir())
                .unwrap()
                .join(format!("fgos-uninstall-{}-{n}-{label}", std::process::id()));
            let _ = std::fs::remove_dir_all(&base);
            let world = World {
                project: base.join("project"),
                home: base.join("home"),
                payload: base.join("payload"),
                state: base.join("state"),
                base,
            };
            for dir in [&world.project, &world.home] {
                std::fs::create_dir_all(dir).unwrap();
            }
            world.put(
                &world.payload.join("core/skills/distill/SKILL.md"),
                "---\nname: distill\n---\nbody\n",
            );
            world.put(
                &world.payload.join(".agents/skills/distill/SKILL.md"),
                "---\nname: distill\nmetadata:\n  version: \"0.1\"\n---\nbody\n",
            );
            world
        }

        fn put(&self, file: &Path, text: &str) {
            std::fs::create_dir_all(file.parent().unwrap()).unwrap();
            std::fs::write(file, text).unwrap();
        }

        fn in_project(&self, rel: &str, text: &str) {
            self.put(&self.project.join(rel), text);
        }

        fn hooks(&self) {
            let home = self.home.to_string_lossy().into_owned();
            install_all(&self.project, &move |key| {
                (key == "HOME").then(|| home.clone())
            })
            .unwrap();
        }

        fn stamped_skill(&self, name: &str, frontmatter_extra: &str, body: &str) {
            self.in_project(
                &format!(".claude/skills/{name}/SKILL.md"),
                &format!("---\nname: {name}\n{frontmatter_extra}---\n{WRAPPER_STAMP}\n{body}"),
            );
        }

        /// Every file under the project and HOME as text, the Git internals left out.
        fn tree(&self) -> BTreeMap<String, String> {
            let mut out = BTreeMap::new();
            let mut stack = vec![self.project.clone(), self.home.clone()];
            while let Some(dir) = stack.pop() {
                for entry in std::fs::read_dir(&dir).unwrap() {
                    let path = entry.unwrap().path();
                    if path.ends_with(GIT_DIR) {
                        continue;
                    }
                    let rel = path
                        .strip_prefix(&self.base)
                        .unwrap()
                        .to_string_lossy()
                        .into_owned();
                    let kind = std::fs::symlink_metadata(&path).unwrap().file_type();
                    if kind.is_dir() {
                        out.insert(format!("{rel}/"), String::new());
                        stack.push(path);
                    } else if kind.is_symlink() {
                        out.insert(rel, "<link>".into());
                    } else {
                        out.insert(
                            rel,
                            String::from_utf8_lossy(&std::fs::read(&path).unwrap()).into_owned(),
                        );
                    }
                }
            }
            out
        }

        fn machine<'a>(&'a self, timers: Option<&'a TimerEnv<'a>>) -> Machine<'a> {
            Machine {
                payload: Ok(&self.payload),
                home: Some(&self.home),
                platform: "linux",
                git_state_root: &self.state,
                timers,
                stamp: "20261115T000000000Z",
            }
        }

        /// One run against this world with timers that touch only the world's own HOME.
        fn run(&self, apply: bool) -> Reversal {
            let run = |_: &str, _: &[String]| -> Result<(), String> { Ok(()) };
            let config = |_: &Path| Ok(None);
            let host_bin = |_: &Path| None;
            let env = TimerEnv {
                host: Host {
                    platform: "linux".into(),
                    home: self.home.clone(),
                    uid: 0,
                    xdg_config_home: None,
                },
                config: &config,
                host_bin: &host_bin,
                run: &run,
            };
            uninstall_project(&self.project, apply, &self.machine(Some(&env)))
        }
    }

    impl Drop for World {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.base);
        }
    }

    fn strings(value: &Value) -> Vec<String> {
        value
            .as_array()
            .unwrap()
            .iter()
            .map(|v| v.as_str().unwrap().to_owned())
            .collect()
    }

    fn git(dir: &Path, args: &[&str]) -> String {
        let out = Command::new("git")
            .arg("-C")
            .arg(dir)
            .args(args)
            .output()
            .unwrap();
        assert!(
            out.status.success(),
            "git {args:?}: {}",
            String::from_utf8_lossy(&out.stderr)
        );
        String::from_utf8_lossy(&out.stdout).trim().to_owned()
    }

    /// A real repository at the world's project with one commit, and an owner-only state root for Git's driver.
    #[cfg(unix)]
    fn real_repository(world: &World) {
        git(&world.project, &["init", "-q", "-b", "main"]);
        git(&world.project, &["config", "user.email", "t@example.com"]);
        git(&world.project, &["config", "user.name", "T"]);
        git(&world.project, &["config", "commit.gpgsign", "false"]);
        // The activation fence production's activation leaves behind: Git's mutations refuse without it.
        git(
            &world.project,
            &["config", "fgos.machineId", "uninstall-fixture"],
        );
        {
            use std::os::unix::fs::DirBuilderExt;
            std::fs::DirBuilder::new()
                .recursive(true)
                .mode(0o700)
                .create(world.project.join(GIT_DIR).join("fgos/events/locks"))
                .unwrap();
        }
        world.in_project(
            ".fgos/locks/activation.lock/TOMBSTONE",
            "{\"lock\":\"activation\",\"by\":\"fgos git\",\"at\":\"fixture\"}",
        );
        world.in_project("seed.txt", "seed\n");
        git(&world.project, &["add", "seed.txt"]);
        git(&world.project, &["commit", "-qm", "seed"]);
        std::fs::create_dir_all(&world.state).unwrap();
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(&world.state, std::fs::Permissions::from_mode(0o700)).unwrap();
    }

    // ----- the call -----

    fn os(args: &[&str]) -> Vec<OsString> {
        args.iter().map(OsString::from).collect()
    }

    #[test]
    fn only_a_bare_yes_applies_and_a_bare_dry_run_cancels_it() {
        let root = || Ok(PathBuf::from("/p"));
        let apply = |args: &[&str]| project_uninstall_request(&os(args), root()).unwrap().apply;
        assert!(!apply(&["uninstall"]));
        assert!(apply(&["uninstall", "--yes"]));
        assert!(!apply(&["uninstall", "--yes", "--dry-run"]));
        assert!(
            !apply(&["uninstall", "--yes", "now"]),
            "a value is not consent"
        );
        assert!(
            apply(&["uninstall", "--yes", "--dry-run", "now"]),
            "a dry-run with a value is not bare"
        );
        assert_eq!(
            project_uninstall_request(&os(&["uninstall"]), Err("no project".into())),
            Err("no project".into())
        );
    }

    // ----- the plan and the apply -----

    #[test]
    fn a_plan_lists_changes_and_keeps_and_changes_nothing() {
        let world = World::new("plan");
        world.hooks();
        world.stamped_skill("distill", "", "x\n");
        let before = world.tree();
        let reversal = world.run(false);
        assert_eq!(world.tree(), before);
        let data = &reversal.data;
        assert_eq!(data["applied"], false);
        assert_eq!(reversal.exit(), 0);
        let changes = strings(&data["changes"]);
        assert!(
            changes.iter().any(|c| c.contains("remove the fgOS hook")),
            "{changes:?}"
        );
        assert!(
            changes
                .iter()
                .any(|c| c
                    .starts_with(".claude/skills: remove 1 generated skill directory (distill)")),
            "{changes:?}"
        );
        let keeps = strings(&data["keeps"]);
        assert!(keeps[0].starts_with(".fgos: your fgOS data"));
        assert!(keeps[1].starts_with(".fgos/distribution.json: the committed release pin"));
        assert_eq!(data["backups"], serde_json::json!([]));
        assert_eq!(data["hooksUnwired"], false);
    }

    #[test]
    fn an_apply_removes_every_fgos_hook_and_generated_skill_and_keeps_what_is_the_persons() {
        let world = World::new("apply");
        world.hooks();
        world.stamped_skill("distill", "", "x\n");
        world.in_project(
            ".claude/skills/mine/SKILL.md",
            "---\nname: mine\n---\nmine\n",
        );
        world.in_project(
            ".claude/skills/fgos-clarifying/SKILL.md",
            "---\nname: fgos-clarifying\n---\nan owned name without the mark\n",
        );
        world.put(
            &world.payload.join("core/skills/fgos-clarifying/SKILL.md"),
            "---\nname: fgos-clarifying\n---\n",
        );
        world.in_project(".fgos/notes.txt", "keep: me\n");
        let reversal = world.run(true);
        let data = &reversal.data;
        assert_eq!(data["failed"], serde_json::json!([]), "{data}");
        assert!(!world.project.join(".claude/skills/distill").exists());
        assert!(
            world.project.join(".claude/skills/mine/SKILL.md").exists(),
            "not an fgOS name"
        );
        assert!(
            world
                .project
                .join(".claude/skills/fgos-clarifying/SKILL.md")
                .exists(),
            "no mark"
        );
        assert_eq!(
            std::fs::read_to_string(world.project.join(".fgos/notes.txt")).unwrap(),
            "keep: me\n"
        );
        let keeps = strings(&data["keeps"]);
        assert!(
            keeps.iter().any(|k| k.contains(
                ".claude/skills/fgos-clarifying: kept, not generated by fgOS (it carries no fgOS generated marker)"
            )),
            "{keeps:?}"
        );
        // The omp extension is gone and only its backup is left beside it.
        let left: Vec<String> = std::fs::read_dir(world.project.join(".omp/extensions"))
            .unwrap()
            .map(|e| {
                e.unwrap()
                    .file_name()
                    .to_string_lossy()
                    .replace("20261115T000000000Z", "<time>")
            })
            .collect();
        assert_eq!(left, vec!["fgos-hooks.ts.pre-uninstall-<time>".to_owned()]);
    }

    #[test]
    fn every_file_a_run_rewrites_or_deletes_is_copied_beside_itself_first() {
        let world = World::new("backup");
        world.hooks();
        let originals: Vec<(PathBuf, Vec<u8>)> = [
            ".claude/settings.json",
            ".codex/hooks.json",
            ".omp/extensions/fgos-hooks.ts",
        ]
        .iter()
        .map(|rel| {
            (
                world.project.join(rel),
                std::fs::read(world.project.join(rel)).unwrap(),
            )
        })
        .collect();
        let data = world.run(true).data;
        let backups = data["backups"].as_array().unwrap();
        assert!(backups.len() >= originals.len());
        for (file, bytes) in &originals {
            let backup = backups
                .iter()
                .find(|b| b["file"] == file.to_string_lossy().as_ref())
                .unwrap_or_else(|| panic!("no backup of {}", file.display()));
            let copy = PathBuf::from(backup["backup"].as_str().unwrap());
            assert_eq!(
                copy.file_name().unwrap().to_string_lossy(),
                format!(
                    "{}.pre-uninstall-20261115T000000000Z",
                    file.file_name().unwrap().to_string_lossy()
                )
            );
            assert_eq!(&std::fs::read(copy).unwrap(), bytes);
        }
    }

    #[test]
    fn a_failed_backup_runs_nothing_and_the_answer_has_the_short_shape() {
        let world = World::new("nobackup");
        world.hooks();
        let file = world.project.join(".claude/settings.json");
        let taken = PathBuf::from(format!(
            "{}.pre-uninstall-20261115T000000000Z",
            file.display()
        ));
        std::fs::write(&taken, "an earlier backup").unwrap();
        let before = world.tree();
        let reversal = world.run(true);
        assert_eq!(world.tree(), before, "nothing changed");
        assert_eq!(reversal.exit(), 1);
        let data = &reversal.data;
        assert_eq!(data["applied"], true);
        assert!(data["skills"].is_null());
        for empty in ["backups", "changes", "keeps", "leftToYou"] {
            assert_eq!(data[empty], serde_json::json!([]), "{empty}");
        }
        assert!(
            data.get("hooksUnwired").is_none(),
            "the short answer stops before the later steps"
        );
        let failed = &data["failed"][0];
        assert_eq!(failed["id"], "backup");
        assert!(
            failed["error"]
                .as_str()
                .unwrap()
                .starts_with("backup failed, nothing changed: "),
            "{failed}"
        );
    }

    #[test]
    fn a_hook_of_the_persons_that_only_mentions_the_shim_stays_and_is_named() {
        let world = World::new("mention");
        world.hooks();
        let file = world.project.join(".claude/settings.json");
        let mut settings: Value = serde_json::from_slice(&std::fs::read(&file).unwrap()).unwrap();
        settings["hooks"]["PostToolUse"] = serde_json::json!([{
            "matcher": "*",
            "hooks": [{ "type": "command", "command": "sh .fgos/installation/bin/fgos hook custom-thing" }]
        }]);
        std::fs::write(&file, serde_json::to_vec_pretty(&settings).unwrap()).unwrap();
        let data = world.run(true).data;
        let keeps = strings(&data["keeps"]);
        assert!(
            keeps.iter().any(|k| k.contains(
                "a hook of yours names the fgOS shim and stays: sh .fgos/installation/bin/fgos hook custom-thing"
            )),
            "{keeps:?}"
        );
        let left = std::fs::read_to_string(&file).unwrap();
        assert!(
            left.contains("custom-thing") && !left.contains("dispatch-decide"),
            "{left}"
        );
    }

    #[cfg(unix)]
    #[test]
    fn links_are_refused_never_followed_and_a_root_behind_a_link_stays() {
        let world = World::new("links");
        let outside = world.base.join("outside");
        world.put(&outside.join("hooks/settings.json"), "{}\n");
        world.put(
            &outside.join("skills/distill/SKILL.md"),
            &format!("---\nname: distill\n---\n{WRAPPER_STAMP}\n"),
        );
        // A linked agent directory and a linked skills root.
        std::os::unix::fs::symlink(outside.join("hooks"), world.project.join(".claude")).unwrap();
        std::fs::create_dir_all(world.project.join(".agents")).unwrap();
        std::os::unix::fs::symlink(outside.join("skills"), world.project.join(".agents/skills"))
            .unwrap();
        let outside_before: BTreeMap<_, _> = [
            outside.join("hooks/settings.json"),
            outside.join("skills/distill/SKILL.md"),
        ]
        .into_iter()
        .map(|f| (f.clone(), std::fs::read(f).unwrap()))
        .collect();
        let data = world.run(true).data;
        for (file, bytes) in outside_before {
            assert_eq!(
                std::fs::read(&file).unwrap(),
                bytes,
                "{} is outside the project",
                file.display()
            );
        }
        assert!(
            world.project.join(".agents/skills").exists(),
            "the link stays"
        );
        let keeps = strings(&data["keeps"]);
        assert!(
            keeps.iter().any(|k| k.contains(
                ".agents/skills: kept, not generated by fgOS (a symbolic link: left as it is)"
            )),
            "{keeps:?}"
        );
        assert_eq!(data["failed"], serde_json::json!([]), "{data}");

        // A link inside a generated directory stays and keeps the directory.
        let world = World::new("inner-link");
        world.stamped_skill("distill", "", "x\n");
        std::os::unix::fs::symlink(
            "/etc/hostname",
            world.project.join(".claude/skills/distill/link.md"),
        )
        .unwrap();
        let data = world.run(true).data;
        assert!(world
            .project
            .join(".claude/skills/distill/link.md")
            .is_symlink());
        assert!(
            !world
                .project
                .join(".claude/skills/distill/SKILL.md")
                .exists(),
            "the file beside the link goes"
        );
        assert_eq!(data["skills"]["removed"], serde_json::json!([]));
        assert_eq!(data["skills"]["kept"][0]["why"], "a symbolic link");
    }

    #[test]
    fn an_emptied_skills_root_is_removed_and_the_source_checkout_keeps_its_surfaces() {
        let world = World::new("emptied");
        world.stamped_skill("distill", "", "x\n");
        world.run(true);
        assert!(
            !world.project.join(".claude/skills").exists(),
            "an emptied skills root goes"
        );
        assert!(world.project.join(".claude").exists());

        let world = World::new("source");
        world.stamped_skill("distill", "", "x\n");
        let machine = Machine {
            payload: Ok(&world.project),
            ..world.machine(None)
        };
        let reversal = uninstall_project(&world.project, false, &machine);
        assert_eq!(reversal.data["skills"]["skipped"], SOURCE_CHECKOUT_SKIPPED);
        assert!(strings(&reversal.data["keeps"])
            .iter()
            .any(|k| k == &format!("skills: {SOURCE_CHECKOUT_SKIPPED}")));
        assert!(world.project.join(".claude/skills/distill").exists());
    }

    #[test]
    fn a_payload_that_cannot_be_found_fails_the_skills_step_and_nothing_else() {
        let world = World::new("nopayload");
        world.hooks();
        let machine = Machine {
            payload: Err("no release".into()),
            ..world.machine(None)
        };
        let data = uninstall_project(&world.project, false, &machine).data;
        assert_eq!(
            data["failed"],
            serde_json::json!([{ "id": "payload", "error": "no release" }])
        );
        assert!(strings(&data["changes"])
            .iter()
            .any(|c| c.contains("remove the fgOS hook")));
    }

    /// The script a rc line names for a payload in a checkout: the payload's own file when its repository has none.
    fn integration_script_for(world: &World) -> PathBuf {
        // The payload must sit in a repository for an rc line to be looked for at all.
        let repository = world.base.join(GIT_DIR);
        std::fs::create_dir_all(repository.join("objects")).unwrap();
        std::fs::create_dir_all(repository.join("refs")).unwrap();
        std::fs::write(repository.join("HEAD"), "ref: refs/heads/main\n").unwrap();
        let script = world
            .payload
            .join("scripts")
            .join("fgos-shell-integration.sh");
        world.put(&script, "# integration\n");
        script
    }

    #[test]
    fn a_shell_profile_is_only_named_and_global_agent_wiring_is_left_with_how_to_undo_it() {
        let world = World::new("rc");
        let script = integration_script_for(&world);
        let rc = world.home.join(".bashrc");
        let content = format!("# mine\nsource \"{}\"\n", script.display());
        std::fs::write(&rc, &content).unwrap();
        let data = world.run(true).data;
        assert_eq!(
            std::fs::read_to_string(&rc).unwrap(),
            content,
            "never edited"
        );
        assert_eq!(
            data["shellRcSourceLinesFound"][0]["rcFile"],
            rc.to_string_lossy().as_ref()
        );
        assert!(data["shellRcRemovalInstructions"]
            .as_str()
            .unwrap()
            .contains("remove the line(s) above by hand"));
        let left = strings(&data["leftToYou"]);
        assert!(left[0].contains("remove the line source") && left[0].contains("by hand"));
        assert!(left
            .last()
            .unwrap()
            .contains("claude plugin uninstall fgOS@fgos-plugins"));
        // Without such a line the keys are empty, not absent.
        std::fs::write(&rc, "# nothing\n").unwrap();
        let data = world.run(false).data;
        assert_eq!(data["shellRcSourceLinesFound"], serde_json::json!([]));
        assert!(data["shellRcRemovalInstructions"].is_null());
    }

    #[test]
    fn a_root_that_is_the_filesystem_root_home_or_a_directory_holding_home_is_refused_before_anything_runs(
    ) {
        let world = World::new("broad");
        let outer = world.base.join("outer");
        let inner_home = outer.join("people/me");
        std::fs::create_dir_all(inner_home.join("work/project")).unwrap();
        let root = Path::new(std::path::MAIN_SEPARATOR_STR);
        for (label, project, home) in [
            ("filesystem root", root, Some(inner_home.as_path())),
            ("home", inner_home.as_path(), Some(inner_home.as_path())),
            (
                "ancestor of home",
                outer.as_path(),
                Some(inner_home.as_path()),
            ),
        ] {
            let refusal = refuse_broad_root(project, home).unwrap_err();
            assert_eq!(refusal.category, "precondition", "{label}");
            assert_eq!(refusal.exit_code(), 2, "{label}");
        }
        let under_home = inner_home.join("work/project");
        assert!(refuse_broad_root(&under_home, Some(&inner_home)).is_ok());
        assert!(refuse_broad_root(&under_home, None).is_ok());
    }

    #[test]
    fn a_timer_fgos_wrote_is_removed_by_its_marker_and_a_missing_home_is_a_failed_step() {
        let world = World::new("timer");
        let dir = world.home.join(".config/systemd/user");
        let stem = unit_stem(&world.project, Schedule::MailboxSync);
        for ext in ["service", "timer"] {
            world.put(
                &dir.join(format!("{stem}.{ext}")),
                &format!("# {}\n[Unit]\n", Schedule::MailboxSync.marker()),
            );
        }
        world.put(&dir.join("other.timer"), "# mine\n");
        let data = world.run(true).data;
        assert!(
            !dir.join(format!("{stem}.timer")).exists()
                && !dir.join(format!("{stem}.service")).exists()
        );
        assert!(dir.join("other.timer").exists());
        assert!(
            strings(&data["changes"])
                .iter()
                .any(|c| c.starts_with("removed systemd timer fgos-mailbox-sync-")),
            "{data}"
        );

        let world = World::new("nohome");
        let data = uninstall_project(&world.project, true, &world.machine(None)).data;
        let ids: Vec<String> = data["failed"]
            .as_array()
            .unwrap()
            .iter()
            .map(|f| f["id"].as_str().unwrap().to_owned())
            .collect();
        assert_eq!(ids, vec!["mailbox-sync-timer", "account-probe-timer"]);
    }

    // ----- the version rule and the Git rule of the skill guard -----

    #[test]
    fn a_skill_whose_version_is_newer_than_the_releases_is_kept_and_an_unreadable_version_is_named()
    {
        let world = World::new("version");
        world.stamped_skill("distill", "metadata:\n  version: \"0.10\"\n", "newer\n");
        let data = world.run(true).data;
        assert!(world
            .project
            .join(".claude/skills/distill/SKILL.md")
            .exists());
        assert_eq!(data["skills"]["removed"], serde_json::json!([]));
        assert_eq!(data["skills"]["kept"][0]["why"], KEPT_BY_YOU);

        let world = World::new("version-equal");
        world.stamped_skill("distill", "metadata:\n  version: \"0.1\"\n", "same\n");
        world.run(true);
        assert!(
            !world.project.join(".claude/skills/distill").exists(),
            "the same version is the release's own"
        );

        let world = World::new("version-unquoted");
        world.stamped_skill("distill", "metadata:\n  version: 9.9\n", "x\n");
        let reversal = world.run(true);
        assert!(
            !world.project.join(".claude/skills/distill").exists(),
            "an unreadable version counts as none"
        );
        assert_eq!(reversal.notes.len(), 1);
        assert!(
            reversal.notes[0].ends_with(
                "version is not a quoted dotted number, so it is ignored; quote it (\"1.10\")\n"
            ),
            "{:?}",
            reversal.notes
        );
    }

    #[test]
    fn versions_compare_as_dotted_numbers_and_a_frontmatter_block_is_cut_as_the_render_cuts_it() {
        let mut notes = Vec::new();
        let v = |text: &str, notes: &mut Vec<String>| skill_version(text, Path::new("f.md"), notes);
        let newer = |a: &str, b: &str| {
            let mut notes = Vec::new();
            is_newer(v(a, &mut notes).as_deref(), v(b, &mut notes).as_deref())
        };
        let doc = |version: &str| {
            format!("---\nname: x\nmetadata:\n  version: \"{version}\"\n---\nbody\n")
        };
        assert!(newer(&doc("1.10"), &doc("1.9")));
        assert!(!newer(&doc("1.9"), &doc("1.10")));
        assert!(!newer(&doc("1.0"), &doc("1")), "missing parts are zero");
        assert!(!newer(&doc("2"), "no frontmatter"));
        assert_eq!(
            v("---\nversion: \"3.1\"\n---\n", &mut notes),
            Some(vec![3.0, 1.0]),
            "a top-level version counts when metadata has none"
        );
        assert_eq!(
            v(
                "---\r\nmetadata:\r\n  version: \"2\"\r\n---\r\nx",
                &mut notes
            ),
            Some(vec![2.0]),
            "CRLF fences"
        );
        assert_eq!(
            v("---\nname: x\n", &mut notes),
            None,
            "an unclosed block is no block"
        );
        assert_eq!(v("---\n---\nbody\n", &mut notes), None);
        assert!(notes.is_empty());
        assert_eq!(v("---\n- a\n- b\n---\n", &mut notes), None);
        assert!(
            notes[0]
                .contains("frontmatter-not-a-mapping (line 2, column 1); its version is ignored"),
            "{notes:?}"
        );
        notes.clear();
        assert_eq!(v("---\nname: [unclosed\n---\n", &mut notes), None);
        assert!(
            notes[0].starts_with("f.md: ") && notes[0].ends_with("; its version is ignored\n"),
            "{notes:?}"
        );
        assert_eq!(frontmatter_source("---\na: 1\n---\nrest"), Some("a: 1"));
        assert_eq!(frontmatter_source("a: 1\n---\n"), None);
    }

    #[cfg(unix)]
    #[test]
    fn a_tracked_skill_file_with_uncommitted_edits_is_kept_and_a_clean_one_goes() {
        let world = World::new("dirty");
        real_repository(&world);
        world.stamped_skill("distill", "", "x\n");
        world.in_project(".claude/skills/distill/references/a.md", "ref\n");
        git(&world.project, &["add", "-f", ".claude"]);
        git(&world.project, &["commit", "-qm", "skills"]);
        std::fs::write(
            world.project.join(".claude/skills/distill/references/a.md"),
            "ref\nedited\n",
        )
        .unwrap();
        world.in_project(".claude/skills/distill/untracked.md", "not tracked\n");
        let data = world.run(true).data;
        assert_eq!(data["failed"], serde_json::json!([]), "{data}");
        let kept: Vec<&str> = data["skills"]["kept"]
            .as_array()
            .unwrap()
            .iter()
            .map(|k| k["path"].as_str().unwrap())
            .collect();
        assert_eq!(
            kept,
            vec![world
                .project
                .join(".claude/skills/distill/references/a.md")
                .to_str()
                .unwrap()]
        );
        assert!(world
            .project
            .join(".claude/skills/distill/references/a.md")
            .exists());
        assert!(
            !world
                .project
                .join(".claude/skills/distill/SKILL.md")
                .exists(),
            "a clean tracked file goes"
        );
        assert!(
            !world
                .project
                .join(".claude/skills/distill/untracked.md")
                .exists(),
            "an untracked file is not a tracked edit"
        );
    }

    // ----- the git hooks path -----

    /// Wires the hooks path the way an install does: through RepositoryConfig, which keeps the ownership proof.
    #[cfg(unix)]
    fn wire_hooks(world: &World) {
        let driver = GitDriver::new(&world.state).unwrap();
        let ResolveRepo::Repository(repo) =
            driver.resolve_repo(&world.project, &world.project).unwrap()
        else {
            panic!("not a repository");
        };
        let report = driver
            .ensure_hooks(&repo, &world.project.join(".githooks"), "fixture-wire")
            .unwrap();
        assert_eq!(report.status, "owned");
    }

    #[cfg(unix)]
    #[test]
    fn a_hooks_path_fgos_wired_is_unset_and_its_untracked_hook_and_empty_directory_go() {
        let world = World::new("unwire");
        real_repository(&world);
        world.in_project(".githooks/pre-commit", "#!/bin/sh\nexit 0\n");
        wire_hooks(&world);
        assert!(
            hooks_wired(&world.project, &world.state),
            "the plan says it would unwire"
        );
        let plan = world.run(false).data;
        assert_eq!(plan["hooksUnwired"], true);
        assert!(
            world.project.join(".githooks").exists(),
            "a plan changes nothing"
        );
        let data = world.run(true).data;
        assert_eq!(data["hooksUnwired"], true);
        assert_eq!(data["hooksSkippedExisting"], Value::Null);
        assert!(strings(&data["changes"])
            .iter()
            .any(|c| c.starts_with("git: unset core.hooksPath (fgOS wired it)")));
        assert!(Command::new("git")
            .arg("-C")
            .arg(&world.project)
            .args(["config", "--get", "core.hooksPath"])
            .output()
            .unwrap()
            .stdout
            .is_empty());
        assert!(!world.project.join(".githooks").exists());
    }

    #[cfg(unix)]
    #[test]
    fn a_hooks_directory_reached_through_a_link_loses_its_setting_but_nothing_inside_it() {
        let world = World::new("linked-hooks");
        real_repository(&world);
        let elsewhere = world.base.join("elsewhere");
        world.put(&elsewhere.join("pre-commit"), "#!/bin/sh\nexit 0\n");
        std::os::unix::fs::symlink(&elsewhere, world.project.join(".githooks")).unwrap();
        wire_hooks(&world);
        let data = world.run(true).data;
        assert_eq!(data["failed"], serde_json::json!([]), "{data}");
        assert_eq!(data["hooksUnwired"], true, "the setting is ours and goes");
        assert_eq!(
            std::fs::read_to_string(elsewhere.join("pre-commit")).unwrap(),
            "#!/bin/sh\nexit 0\n",
            "the link's other end is not ours"
        );
        assert!(world.project.join(".githooks").is_symlink());
        assert!(strings(&data["keeps"])
            .iter()
            .any(|k| k.starts_with("git: .githooks is reached through a symbolic link (")));
    }

    #[cfg(unix)]
    #[test]
    fn a_tracked_pre_commit_survives_the_unwiring_byte_for_byte() {
        let world = World::new("tracked-hook");
        real_repository(&world);
        world.in_project(".githooks/pre-commit", "#!/bin/sh\nexit 0\n");
        git(&world.project, &["add", ".githooks/pre-commit"]);
        git(&world.project, &["commit", "-qm", "hook"]);
        wire_hooks(&world);
        let outcome = unwire_git_hooks(&world.project, &world.state).unwrap();
        assert!(outcome.unwired && outcome.skipped_existing.is_none());
        assert_eq!(
            std::fs::read_to_string(world.project.join(".githooks/pre-commit")).unwrap(),
            "#!/bin/sh\nexit 0\n"
        );
        assert_eq!(
            git(
                &world.project,
                &["status", "--porcelain", "--", ".githooks"]
            ),
            ""
        );
    }

    #[cfg(unix)]
    #[test]
    fn a_hooks_path_the_person_set_is_left_alone_and_named_and_an_unset_one_is_a_no_op() {
        let world = World::new("user-hooks");
        real_repository(&world);
        assert!(
            !unwire_git_hooks(&world.project, &world.state)
                .unwrap()
                .unwired,
            "never set"
        );
        world.in_project(".husky/x", "x\n");
        git(&world.project, &["config", "core.hooksPath", ".husky"]);
        let outcome = unwire_git_hooks(&world.project, &world.state).unwrap();
        assert!(!outcome.unwired);
        assert_eq!(outcome.skipped_existing.as_deref(), Some(".husky"));
        assert_eq!(
            git(&world.project, &["config", "--get", "core.hooksPath"]),
            ".husky"
        );

        // A relative setting of the owned directory without fgOS's ownership record is the person's too.
        let world = World::new("relative-hooks");
        real_repository(&world);
        world.in_project(".githooks/pre-commit", "#!/bin/sh\nexit 0\n");
        git(&world.project, &["config", "core.hooksPath", ".githooks"]);
        let outcome = unwire_git_hooks(&world.project, &world.state).unwrap();
        assert_eq!(
            (outcome.unwired, outcome.skipped_existing.as_deref()),
            (false, Some(".githooks"))
        );
        assert!(world.project.join(".githooks/pre-commit").exists());
        let data = world.run(true).data;
        assert!(strings(&data["keeps"])
            .iter()
            .any(|k| k == "git: core.hooksPath .githooks is yours (fgOS did not set it): kept"));
    }

    #[cfg(unix)]
    #[test]
    fn a_plan_never_creates_a_state_root_that_is_gone() {
        let world = World::new("no-state");
        assert!(!world.state.exists());
        assert!(!hooks_wired(&world.project, &world.state));
        world.run(false);
        assert!(
            !world.state.exists(),
            "a read does not create the driver's directories"
        );
    }

    #[test]
    fn a_project_without_a_repository_unwires_nothing_and_asks_no_driver() {
        let world = World::new("no-git");
        let outcome = unwire_git_hooks(&world.project, &world.state).unwrap();
        assert!(!outcome.unwired && outcome.skipped_existing.is_none());
        assert!(!world.state.exists());
    }
}
