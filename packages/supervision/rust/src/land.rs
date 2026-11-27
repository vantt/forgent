//! The landing use case behind `fgos land`: fetch, prepare a Land candidate under the target's
//! merge slot, gate, push the candidate, then publish (fast-forward local main).
//!
//! All Git goes through the `fgos-git` ports. This module merges, takes its gates and regeneration
//! from values its caller reads from project config, checks a branch against the caller's plan
//! footprint, and never invents a lock, a writer identity or an operation id.
//!
//! Trust boundary: gates and regeneration run through `sh -c` in the candidate worktree (or, for a
//! `paths` land, the main checkout), unconfined, as the owner, on branch code. Review is the
//! control: a lead lands only a phase its reviewer passed, and the commands come from the trusted
//! main checkout's config. Confined gates are not built here.
use fgos_git::{
    wal, CommitRequest, DiffScope, DiffSides, GitDriver, HeadFact, Ignored, Inspect, InspectCursor,
    LandCandidate, LandEvidence, LandFile, LandRequest, ObjectType, Oid, OperationError,
    ReadObject, RefMapping, RefName, RefValue, Remote, RemoteGrant, RepoHandle, ResolveRepo,
    ResultCode, Submodules, TrunkFact, TrunkSource, Untracked,
};
use fgos_holder_lock::BorrowedHandle;
use sha2::{Digest, Sha256};
use std::cell::Cell;
use std::collections::BTreeSet;
use std::fs::{File, OpenOptions};
use std::io::{Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

/// Failed fetch/push retries after the first attempt before `land-retries-exhausted`.
const MAX_RETRIES: u32 = 3;
/// The Cargo target every land command builds into, under the main checkout: it outlives each candidate.
pub const LAND_CARGO_TARGET: &str = ".fgos/runtime/land/cargo-target";
/// Bytes of a failing command's output kept in a refusal.
const TAIL_BYTES: usize = 4096;
/// Lines of a failing command's output that name a failure, kept in a refusal.
const FAILURE_LINES: usize = 25;
/// Longest kept line, and the most of a log's end scanned for failure lines.
const LINE_BYTES: usize = 300;
const SCAN_BYTES: u64 = 4 * 1024 * 1024;
/// The most of a failed command's output a log keeps (its end).
const LOG_BYTES: u64 = 8 * 1024 * 1024;
/// Largest object (commit, tree or declared file) read while preparing a land.
const OBJECT_LIMIT: usize = 32 * 1024 * 1024;

/// One land request. Exactly one of `branch` and `paths` is set.
#[derive(Debug, Clone, Default)]
pub struct LandCommand {
    pub branch: Option<String>,
    pub paths: Option<Vec<String>>,
    /// Test paths given to a gate that uses `{tests}`.
    ///
    /// Gates also support the `{plans}` placeholder, rendered as `--plan '<dir>'` pairs for
    /// qualifying plan directories (a directory under `plans/` containing a `plan.md` with a changed
    /// path under it, excluding `plans/backlog`, `plans/discussions`, `plans/reports` and
    /// `plans/handoffs`). A gate whose run text contains `{plans}` is skipped when the qualifying
    /// plan-dir set is empty.
    pub tests: Vec<String>,
    /// The caller's plan footprint, given for a lead. A branch may change only paths it matches; a paths
    /// land may not change the `footprint` of any `plan.md` it commits (`footprint-change-refused`).
    pub footprint: Option<Vec<String>>,
    /// Target branch name; absent resolves the project trunk.
    pub target: Option<String>,
    pub message: String,
    pub squash: bool,
}

#[derive(Debug, Clone)]
pub struct Gate {
    /// Command line to run. Supports `{tests}` and `{plans}` (`--plan '<dir>'` pairs, gate skipped
    /// when empty).
    pub run: String,
    /// Path globs; empty means the gate always runs.
    pub when: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct Regenerate {
    pub run: String,
    pub files: Vec<String>,
    /// Path globs; empty means the regeneration always runs.
    pub when: Vec<String>,
}

#[derive(Debug, Clone, Default)]
pub struct LandConfig {
    pub gates: Vec<Gate>,
    pub regenerate: Option<Regenerate>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct KeptWorktree {
    pub path: String,
    pub code: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LandOutcome {
    pub main_sha: String,
    pub landed_paths: Vec<String>,
    pub retries: u32,
    pub gates_run: Vec<String>,
    pub worktrees_removed: Vec<String>,
    pub worktrees_kept: Vec<KeptWorktree>,
    pub worktree_list_error: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
#[error("{code}: {detail}")]
pub struct LandRefusal {
    pub code: String,
    pub detail: String,
    /// The full output of the gate or regeneration that failed, when one ran.
    pub gate_log: Option<PathBuf>,
    /// Trouble releasing the door's own scratch after this refusal. Secondary: `code` and `detail`
    /// always name the primary refusal.
    pub cleanup_note: Option<String>,
    /// Git's own Busy class: the refusal came from a held lock or a live writer's pending operation, and the same
    /// request may succeed later.
    pub retryable: bool,
}

impl LandRefusal {
    /// The primary detail first, then the cleanup note when one exists.
    pub fn detail_with_note(&self) -> String {
        match &self.cleanup_note {
            Some(note) => format!("{}\ncleanup note: {note}", self.detail),
            None => self.detail.clone(),
        }
    }
}

fn refuse(code: &str, detail: impl Into<String>) -> LandRefusal {
    LandRefusal {
        code: code.into(),
        detail: detail.into(),
        gate_log: None,
        cleanup_note: None,
        retryable: false,
    }
}

/// A Git refusal passes through with its own code; the diagnostic and bounded stderr go to the detail.
fn at(step: &'static str) -> impl Fn(OperationError) -> LandRefusal {
    move |e| {
        let mut r = from_git(e);
        r.detail = format!("{step}: {}", r.detail);
        r
    }
}

fn from_git(e: OperationError) -> LandRefusal {
    let mut detail = e.cause.clone();
    if let Some(serde_json::Value::Object(map)) = e.detail.as_deref() {
        if let Some(d) = map.get("diagnostic").and_then(|d| d.as_str()) {
            detail = format!("{detail}: {d}");
        }
    }
    if !e.stderr.is_empty() {
        detail = format!("{detail}: {}", tail(&e.stderr));
    }
    if e.cause == "land-recovery-required" || e.cause == "land-abandoned-writer-mismatch" {
        detail = format!("{detail}; run `fgos git recover`");
    }
    LandRefusal {
        code: e.cause,
        detail,
        gate_log: None,
        cleanup_note: None,
        retryable: e.retryable,
    }
}

fn tail(bytes: &[u8]) -> String {
    let start = bytes.len().saturating_sub(TAIL_BYTES);
    String::from_utf8_lossy(&bytes[start..]).trim().to_string()
}

/// The one door for running a gate or regeneration command. Stdout and stderr both go to `output`;
/// `true` when the command succeeded.
pub trait CommandRunner {
    fn run(&self, cwd: &Path, command: &str, output: &File) -> std::io::Result<bool>;
}

/// `sh -c` in `cwd` with the caller's environment.
pub struct ShellRunner;

impl CommandRunner for ShellRunner {
    fn run(&self, cwd: &Path, command: &str, output: &File) -> std::io::Result<bool> {
        let status = Command::new("sh")
            .arg("-c")
            .arg(command)
            .current_dir(cwd)
            .stdin(Stdio::null())
            .stdout(Stdio::from(output.try_clone()?))
            .stderr(Stdio::from(output.try_clone()?))
            .status()?;
        Ok(status.success())
    }
}

/// Cut a log that outgrew `LOG_BYTES` down to its last `LOG_BYTES`.
fn keep_log_end(path: &Path) -> std::io::Result<()> {
    let len = std::fs::metadata(path)?.len();
    if len <= LOG_BYTES {
        return Ok(());
    }
    let mut file = File::open(path)?;
    file.seek(SeekFrom::Start(len - LOG_BYTES))?;
    let mut kept = Vec::with_capacity(LOG_BYTES as usize);
    file.read_to_end(&mut kept)?;
    let trimmed = path.with_extension("log.trim");
    std::fs::write(&trimmed, kept)?;
    std::fs::rename(&trimmed, path)
}

fn is_failure_line(line: &str) -> bool {
    let t = line.trim_start();
    t.starts_with('\u{2716}')
        || t.starts_with("not ok")
        || t.starts_with("\u{2139} fail")
        || t.starts_with("failures:")
        || t.starts_with("error[")
        || t.starts_with("error:")
        || (t.starts_with("test ") && t.ends_with("FAILED"))
        || t.contains("panicked at")
}

/// What to show of a failed command's log: the lines that name failures (the last
/// `FAILURE_LINES`), else the last `TAIL_BYTES`.
fn failure_digest(log: &Path) -> String {
    let read = || -> std::io::Result<Vec<u8>> {
        let mut file = File::open(log)?;
        let len = file.metadata()?.len();
        file.seek(SeekFrom::Start(len.saturating_sub(SCAN_BYTES)))?;
        let mut bytes = Vec::new();
        file.read_to_end(&mut bytes)?;
        Ok(bytes)
    };
    let Ok(bytes) = read() else {
        return String::new();
    };
    let text = String::from_utf8_lossy(&bytes);
    let mut hits: Vec<String> = text
        .lines()
        .filter(|l| is_failure_line(l))
        .map(|l| l.trim().chars().take(LINE_BYTES).collect())
        .collect();
    if hits.is_empty() {
        return tail(&bytes);
    }
    hits.drain(..hits.len().saturating_sub(FAILURE_LINES));
    hits.join("\n")
}

/// Everything the use case calls out to, supplied by the composition root.
pub struct LandPorts<'a> {
    pub git: &'a GitDriver,
    /// The main checkout handle.
    pub repo: &'a RepoHandle,
    pub remote: &'a RemoteGrant,
    /// Writer identity, resolved by the caller.
    pub writer: &'a str,
    /// A fresh operation id on every call.
    pub operation_id: &'a dyn Fn() -> String,
    pub runner: &'a dyn CommandRunner,
    /// Where a gate's full output is kept, one `<operation id>.log` per failed operation.
    pub log_dir: &'a Path,
    /// Bound on waiting for the merge slot and the main checkout.
    pub wait_ms: u64,
    /// With the port, a paths land that commits a plan turning `done` also marks the backlog items the
    /// plan cites as done and regenerates the index, in the same commit. Without it the land never
    /// touches an item.
    pub backlog_index: Option<BacklogPort<'a>>,
    /// With the port, after a successful branch land, the land door removes the worktree that has the
    /// landed branch checked out through this function, passing the worktree path and the landed target ref.
    pub worktree_removal: Option<&'a WorktreeRemovalFn<'a>>,
}

/// What the composition root supplies to remove a worktree whose branch just landed.
/// Passed the worktree path and the landed target ref (e.g. `refs/heads/main`).
/// Returns `Ok(())` if removed, or `Err(code)` with the refusal code if kept.
pub type WorktreeRemovalFn<'a> = dyn Fn(&Path, &str) -> Result<(), String> + 'a;

/// What a plan `source` entry is, as the one owner of backlog id shapes classifies it.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BacklogRef {
    /// A freshly minted id (`p-<10 base32>`).
    Minted,
    /// A pre-minting id shape that rows still carry; it names an item file when one exists.
    Legacy,
    /// Starts like a backlog id (`p-`) but is neither minted nor legacy.
    Invalid,
    /// Not a backlog reference (a discussion path or any other source).
    NotBacklog,
}

/// What the composition root supplies to a land that closes cited backlog items: the id classifier and the
/// index generator, both owned by the portfolio code so the door copies neither.
/// Regenerates the backlog index text for a checkout from the concrete paths a land commits.
pub type BacklogIndexFn<'a> = dyn Fn(&Path, &[String]) -> Result<String, String> + 'a;

#[derive(Clone, Copy)]
pub struct BacklogPort<'a> {
    /// Classifies one plan `source` entry.
    pub classify: &'a dyn Fn(&str) -> BacklogRef,
    /// Regenerates the backlog index text for a checkout, given the concrete repo-relative paths the land
    /// is about to commit. The door writes the returned text to `plans/backlog.md`.
    pub index: &'a BacklogIndexFn<'a>,
}

/// Where backlog items and their generated index live (the convention rules' `backlog-item` and
/// `backlog-index` kinds).
const BACKLOG_ROOT: &str = "plans/backlog";
const BACKLOG_INDEX: &str = "plans/backlog.md";

pub fn land(
    command: &LandCommand,
    config: &LandConfig,
    ports: &LandPorts<'_>,
) -> Result<LandOutcome, LandRefusal> {
    if config.gates.is_empty() {
        return Err(refuse(
            "land-gate-missing",
            "land.gates is empty; configure at least one gate",
        ));
    }
    let regen_files = if let Some(regen) = &config.regenerate {
        fgos_write_scope::canonicalize_all(&regen.files)
            .map_err(|e| refuse("land-regenerate-failed", e.to_string()))?
    } else {
        Vec::new()
    };
    match (&command.branch, &command.paths) {
        (Some(branch), None) => Lander {
            ports,
            config,
            regen_files,
        }
        .land_branch(command, branch),
        (None, Some(paths)) => Lander {
            ports,
            config,
            regen_files,
        }
        .land_paths(command, paths),
        _ => Err(refuse(
            "land-request-invalid",
            "give exactly one of a branch or a set of paths",
        )),
    }
}

/// Remove any worktree that had the landed branch checked out, or record why it was kept.
/// A failure to list worktrees records `worktree_list_error` in `outcome`, never failing the land.
pub fn clean_landed_worktree(
    ports: &LandPorts<'_>,
    branch: &str,
    target_branch: &str,
    outcome: &mut LandOutcome,
) {
    let Some(remove) = ports.worktree_removal else {
        return;
    };
    let full_branch_ref = format!(
        "refs/heads/{}",
        branch.strip_prefix("refs/heads/").unwrap_or(branch)
    );
    let target_ref = format!(
        "refs/heads/{}",
        target_branch
            .strip_prefix("refs/heads/")
            .unwrap_or(target_branch)
    );
    let mut worktrees = Vec::new();
    let mut cursor = None;
    loop {
        match ports.git.list_worktrees(ports.repo, cursor, 4096) {
            Ok(page) => {
                worktrees.extend(page.entries);
                if page.complete {
                    break;
                }
                cursor = page.next_cursor;
            }
            Err(err) => {
                outcome.worktree_list_error = Some(err.cause);
                break;
            }
        }
    }
    for wt in worktrees {
        if wt.branch.as_ref().map(|b| b.as_str()) == Some(full_branch_ref.as_str()) {
            let wt_path_str = lossy(&wt.path);
            let wt_path = Path::new(&wt_path_str);
            match remove(wt_path, &target_ref) {
                Ok(()) => {
                    outcome.worktrees_removed.push(wt_path_str);
                }
                Err(code) => {
                    outcome.worktrees_kept.push(KeptWorktree {
                        path: wt_path_str,
                        code,
                    });
                }
            }
        }
    }
}

/// The first step of a paths land on its own: under the target's merge slot, fetch the target and
/// fast-forward the main checkout (on `command.target`, or the trunk) to the remote tip. Nothing is
/// committed or pushed. A local branch with commits the remote lacks is `land-target-ahead`; every
/// other refusal is the paths land's own.
pub fn catch_up(command: &LandCommand, ports: &LandPorts<'_>) -> Result<(), LandRefusal> {
    let config = LandConfig::default();
    let lander = Lander {
        ports,
        config: &config,
        regen_files: Vec::new(),
    };
    let target = lander.checked_out_target(command)?;
    let slot = ports
        .git
        .acquire_merge_slot(
            ports.repo,
            &ref_name(&format!("refs/heads/{target}"))?,
            ports.wait_ms,
        )
        .map_err(at("merge slot"))?;
    let held = || slot.lend().map_err(from_git);
    lander.sync_target(&target, &held)
}

/// Whether `line` is a frontmatter fence (`---`, trailing whitespace or CR allowed).
fn is_fence(line: &str) -> bool {
    line.trim_end() == "---"
}

/// The top-level entries of the frontmatter block of the markdown file `file` with these bytes.
fn frontmatter_entries(
    file: &str,
    bytes: &[u8],
) -> Result<Vec<(String, fgos_yaml_doc::Value)>, String> {
    let text = std::str::from_utf8(bytes).map_err(|e| e.to_string())?;
    let text = text.strip_prefix('\u{FEFF}').unwrap_or(text);
    let mut lines = text.lines();
    if !lines.next().is_some_and(is_fence) {
        return Err("no frontmatter block".into());
    }
    let mut front = Vec::new();
    let mut closed = false;
    for line in lines {
        if is_fence(line) {
            closed = true;
            break;
        }
        front.push(line);
    }
    if !closed {
        return Err("the frontmatter block is not closed".into());
    }
    let doc = fgos_yaml_doc::parse(
        front.join("\n").as_bytes(),
        fgos_yaml_doc::Profile::Tool,
        file,
    )
    .map_err(|e| format!("{e:?}"))?;
    let fgos_yaml_doc::Value::Map(entries) = doc.value() else {
        return Err("the frontmatter is not a mapping".into());
    };
    Ok(entries.clone())
}

/// A frontmatter list of strings; an absent or null key is empty.
fn string_list(
    entries: &[(String, fgos_yaml_doc::Value)],
    key: &str,
) -> Result<Vec<String>, String> {
    match entries.iter().find(|(k, _)| k == key).map(|(_, v)| v) {
        Some(fgos_yaml_doc::Value::Seq(items)) => items
            .iter()
            .map(|v| match v {
                fgos_yaml_doc::Value::Str(s) => Ok(s.clone()),
                _ => Err(format!("{key} holds an entry that is not a string")),
            })
            .collect(),
        None | Some(fgos_yaml_doc::Value::Null) => Ok(Vec::new()),
        Some(_) => Err(format!("{key} is not a list")),
    }
}

/// The frontmatter `status` of a markdown file; `None` when it has none or cannot be read.
fn status_in(file: &str, bytes: &[u8]) -> Option<String> {
    string_key_in(file, bytes, "status")
}

/// The string value of the top-level frontmatter `key` of `file` with these bytes.
fn string_key_in(file: &str, bytes: &[u8], key: &str) -> Option<String> {
    let entries = frontmatter_entries(file, bytes).ok()?;
    match entries.into_iter().find(|(k, _)| k == key)?.1 {
        fgos_yaml_doc::Value::Str(s) => Some(s),
        _ => None,
    }
}

/// The sorted `footprint` in the frontmatter of the plan file `file` with these bytes; an absent file has none.
/// Only the frontmatter list is read: the rest of the plan contract is not this check's business.
fn footprint_in(file: &str, bytes: &Option<Vec<u8>>) -> Result<Vec<String>, String> {
    let Some(bytes) = bytes else {
        return Ok(Vec::new());
    };
    let mut footprint = string_list(&frontmatter_entries(file, bytes)?, "footprint")?;
    footprint.sort();
    Ok(footprint)
}

/// `bytes` with the frontmatter `status` line set to `done` and every other byte untouched; `None`
/// when the frontmatter has no top-level `status` line to rewrite.
fn with_status_done(bytes: &[u8]) -> Option<Vec<u8>> {
    let text = std::str::from_utf8(bytes).ok()?;
    let mut out = String::with_capacity(text.len());
    let (mut in_front, mut seen_open, mut done) = (false, false, false);
    for line in text.split_inclusive('\n') {
        let body = line.trim_end_matches(['\n', '\r']);
        if !seen_open {
            seen_open = true;
            in_front = is_fence(body.trim_start_matches('\u{FEFF}'));
        } else if in_front && is_fence(body) {
            in_front = false;
        } else if in_front && !done && body.starts_with("status:") {
            out.push_str("status: done");
            out.push_str(&line[body.len()..]);
            done = true;
            continue;
        }
        out.push_str(line);
    }
    done.then(|| out.into_bytes())
}

struct Lander<'a> {
    ports: &'a LandPorts<'a>,
    config: &'a LandConfig,
    regen_files: Vec<String>,
}

fn oid_of(repo: &RepoHandle, text: &str) -> Result<Oid, LandRefusal> {
    Oid::parse(text, repo.object_format())
        .map_err(|e| refuse("land-request-invalid", e.to_string()))
}

fn ref_name(text: &str) -> Result<RefName, LandRefusal> {
    RefName::parse(text).map_err(|e| refuse("land-request-invalid", format!("{text}: {e}")))
}

fn shell_quote(text: &str) -> String {
    format!("'{}'", text.replace('\'', "'\\''"))
}

fn plan_dir_of(path: &str) -> Option<String> {
    let p = Path::new(path);
    let mut normals = p.components().filter_map(|c| match c {
        std::path::Component::Normal(s) => s.to_str(),
        _ => None,
    });
    if normals.next()? != "plans" {
        return None;
    }
    let name = normals.next()?;
    const EXCLUDED: &[&str] = &["backlog", "discussions", "reports", "handoffs"];
    if EXCLUDED.contains(&name) || name.is_empty() {
        return None;
    }
    Some(format!("plans/{name}"))
}

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

fn lossy(path: &[u8]) -> String {
    String::from_utf8_lossy(path).into_owned()
}

type Held<'h> = Result<Vec<BorrowedHandle<'h>>, LandRefusal>;

/// Files the land door writes into the main checkout itself, each remembered with the bytes it held so a
/// refused or unpublished land leaves the checkout as it found it.
struct DoorWrites<'r> {
    root: &'r Path,
    /// Repo-relative path and its bytes before the first write (`None`: the file did not exist).
    before: Vec<(String, Option<Vec<u8>>)>,
}

impl<'r> DoorWrites<'r> {
    fn new(root: &'r Path) -> Self {
        Self {
            root,
            before: Vec::new(),
        }
    }

    fn put(&mut self, path: &str, bytes: &[u8]) -> Result<(), String> {
        let full = self.root.join(path);
        let was = match std::fs::read(&full) {
            Ok(old) => Some(old),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => None,
            Err(e) => return Err(format!("{path}: {e}")),
        };
        if was.as_deref() == Some(bytes) {
            return Ok(());
        }
        std::fs::write(&full, bytes).map_err(|e| format!("{path}: {e}"))?;
        self.before.push((path.to_owned(), was));
        Ok(())
    }

    /// Put every written file back; the bytes are the door's own. A file that could not be put back is
    /// named in the returned note.
    fn restore(&mut self) -> Option<String> {
        let mut failed = Vec::new();
        for (path, was) in self.before.drain(..).rev() {
            let full = self.root.join(&path);
            let done = match was {
                Some(bytes) => std::fs::write(&full, bytes),
                None => std::fs::remove_file(&full),
            };
            if let Err(e) = done {
                failed.push(format!("{path}: {e}"));
            }
        }
        (!failed.is_empty())
            .then(|| format!("restoring the door's files failed: {}", failed.join("; ")))
    }

    /// `restore`, with its trouble attached to `refusal`.
    fn restore_into(&mut self, mut refusal: LandRefusal) -> LandRefusal {
        if let Some(note) = self.restore() {
            refusal.cleanup_note = Some(match refusal.cleanup_note.take() {
                Some(old) => format!("{old}; {note}"),
                None => note,
            });
        }
        refusal
    }
}

enum Attempt {
    Landed(LandOutcome),
    /// The remote moved first. `Some` when this attempt had already passed its gates: the next attempt may reuse
    /// them if the trunk moves only outside every gate and the regeneration.
    RemoteMoved(Option<Gated>),
}

/// The gates one attempt passed, and the trunk it passed them on.
struct Gated {
    target: Oid,
    gates_run: Vec<String>,
}

impl Lander<'_> {
    fn id(&self) -> String {
        (self.ports.operation_id)()
    }

    fn resolve(&self, name: &str) -> Result<Option<Oid>, LandRefusal> {
        match self
            .ports
            .git
            .resolve_ref(self.ports.repo, &ref_name(name)?)
            .map_err(from_git)?
        {
            RefValue::Direct(oid) => Ok(Some(oid)),
            _ => Ok(None),
        }
    }

    /// The local branch name to land into.
    fn target_branch(&self, command: &LandCommand) -> Result<String, LandRefusal> {
        if let Some(name) = &command.target {
            return Ok(name.strip_prefix("refs/heads/").unwrap_or(name).to_string());
        }
        let trunk = self
            .ports
            .git
            .resolve_trunk(self.ports.repo, None)
            .map_err(from_git)?;
        // The main checkout's attached branch can be a side branch: landing into it is the hazard
        // an unknown trunk guards against, so only an explicit or remote-default trunk counts.
        let name = match trunk {
            TrunkFact::Known { trunk, source } if source != TrunkSource::AttachedHead => trunk,
            _ => {
                return Err(refuse(
                    "land-target-unknown",
                    "the project trunk is not known (no remote HEAD); pass a target, or record the remote's default branch once with `git remote set-head origin -a`",
                ))
            }
        };
        let remote_prefix = format!("refs/remotes/{}/", self.ports.remote.name);
        name.as_str()
            .strip_prefix("refs/heads/")
            .or_else(|| name.as_str().strip_prefix(&remote_prefix))
            .map(str::to_string)
            .ok_or_else(|| {
                refuse(
                    "land-target-unknown",
                    format!("trunk {} is not a branch", name.as_str()),
                )
            })
    }

    /// Fetch the target and fast-forward local main to the remote tip. Local main never holds an
    /// unpushed commit: a local tip with commits the remote lacks is `land-target-ahead`. `held`
    /// lends a lock the caller already holds (a paths land's merge slot) to every Git door called here.
    fn sync_target<'h>(
        &self,
        branch: &str,
        held: &dyn Fn() -> Held<'h>,
    ) -> Result<(), LandRefusal> {
        let p = self.ports;
        let tracking = format!("refs/remotes/{}/{}", p.remote.name, branch);
        let dest = format!("refs/heads/{branch}");
        let mapping = RefMapping {
            source: ref_name(&dest)?,
            destination: ref_name(&tracking)?,
        };
        let mut pushed_orphan = false;
        loop {
            let receipt = p
                .git
                .fetch_refs(
                    p.repo,
                    held()?,
                    p.remote,
                    std::slice::from_ref(&mapping),
                    p.writer,
                    &self.id(),
                )
                .map_err(at("fetch"))?;
            match receipt.remote {
                Remote::Acknowledged => {}
                Remote::Unknown => {
                    return Err(refuse(
                        "land-remote-outcome-unknown",
                        "the fetch outcome is unknown",
                    ))
                }
                _ => {
                    return Err(refuse(
                        "land-remote-diverged",
                        format!("the remote refused to move {tracking}"),
                    ))
                }
            }
            let remote_tip = self.resolve(&tracking)?.ok_or_else(|| {
                refuse(
                    "land-remote-diverged",
                    format!("{tracking} is absent after fetch"),
                )
            })?;
            let local_tip = self
                .resolve(&dest)?
                .ok_or_else(|| refuse("land-target-unknown", format!("local {dest} is absent")))?;
            if remote_tip == local_tip {
                return Ok(());
            }
            if p.git
                .ancestry(p.repo, &local_tip, &remote_tip)
                .map_err(from_git)?
            {
                p.git
                    .catch_up_main_checkout(
                        p.repo,
                        held()?,
                        &ref_name(&dest)?,
                        &local_tip,
                        &ref_name(&tracking)?,
                        p.writer,
                        &self.id(),
                        &wal::OsFileSystem,
                    )
                    .map_err(at("fast-forward main"))?;
                return Ok(());
            }
            if p.git
                .ancestry(p.repo, &remote_tip, &local_tip)
                .map_err(from_git)?
            {
                if !pushed_orphan {
                    let ahead = p
                        .git
                        .commits_between(p.repo, &remote_tip, &local_tip)
                        .map_err(from_git)?;
                    let ours = p
                        .git
                        .main_checkout_scoped_commits(p.repo, &ahead)
                        .map_err(from_git)?;
                    let foreign: Vec<&Oid> = ahead.iter().filter(|c| !ours.contains(c)).collect();
                    let holds_slot = held()
                        .map(|h| {
                            h.iter()
                                .any(|handle| handle.as_ref().name() == "merge-slot")
                        })
                        .unwrap_or(false);
                    if foreign.is_empty() && holds_slot {
                        if !self.push_local(branch, held()?)? {
                            return Err(refuse(
                                "land-remote-diverged",
                                format!("the remote refused to move {tracking}"),
                            ));
                        }
                        pushed_orphan = true;
                        continue;
                    }
                    let unpushed: Vec<&str> = if !foreign.is_empty() {
                        foreign.iter().map(|c| c.as_str()).collect()
                    } else {
                        ahead.iter().map(|c| c.as_str()).collect()
                    };
                    return Err(refuse(
                        "land-target-ahead",
                        format!(
                            "local {dest} at {} has commits the remote tip {} lacks ({}); push or reset them first",
                            local_tip.as_str(),
                            remote_tip.as_str(),
                            unpushed.join(", ")
                        ),
                    ));
                }
            }
            return Err(refuse(
                "land-target-ahead",
                format!(
                    "local {dest} at {} has commits the remote tip {} lacks; push or reset them first",
                    local_tip.as_str(),
                    remote_tip.as_str()
                ),
            ));
        }
    }

    fn changed_paths(&self, before: &Oid, after: &Oid) -> Result<Vec<String>, LandRefusal> {
        let p = self.ports;
        let mut paths = Vec::new();
        let mut cursor: Option<InspectCursor> = None;
        loop {
            let page = p
                .git
                .diff(
                    p.repo,
                    DiffSides::Objects(before, after),
                    &DiffScope::default(),
                    cursor,
                    4096,
                )
                .map_err(from_git)?;
            paths.extend(page.entries.iter().map(|e| lossy(&e.path)));
            if page.complete {
                return Ok(paths);
            }
            cursor = page.next_cursor;
        }
    }

    fn object(&self, id: &Oid) -> Result<Option<(ObjectType, Vec<u8>)>, LandRefusal> {
        let mut read = self
            .ports
            .git
            .read_objects(self.ports.repo, std::slice::from_ref(id), OBJECT_LIMIT)
            .map_err(from_git)?;
        Ok(match read.pop() {
            Some(ReadObject::Present { kind, bytes }) => Some((kind, bytes)),
            _ => None,
        })
    }

    /// The bytes of `path` in `commit`, or `None` when the commit has no such file.
    fn blob_at(&self, commit: &str, path: &str) -> Result<Option<Vec<u8>>, LandRefusal> {
        let repo = self.ports.repo;
        let hash_len = match repo.object_format() {
            fgos_git::ObjectFormat::Sha1 => 20,
            fgos_git::ObjectFormat::Sha256 => 32,
        };
        let bad = |what: &str| {
            refuse(
                "land-object-unreadable",
                format!("{path} at {commit}: {what}"),
            )
        };
        let Some((_, commit_bytes)) = self.object(&oid_of(repo, commit)?)? else {
            return Err(bad("commit missing"));
        };
        let tree_hex = commit_bytes
            .split(|b| *b == b'\n')
            .next()
            .and_then(|l| l.strip_prefix(b"tree "))
            .and_then(|h| std::str::from_utf8(h).ok())
            .ok_or_else(|| bad("commit has no tree"))?
            .to_string();
        let mut current = oid_of(repo, &tree_hex)?;
        let parts: Vec<&str> = path.split('/').collect();
        for (i, part) in parts.iter().enumerate() {
            let Some((_, tree)) = self.object(&current)? else {
                return Ok(None);
            };
            let mut rest = tree.as_slice();
            let mut found: Option<(Vec<u8>, Oid)> = None;
            while !rest.is_empty() {
                let space = rest
                    .iter()
                    .position(|b| *b == b' ')
                    .ok_or_else(|| bad("bad tree"))?;
                let nul = rest
                    .iter()
                    .position(|b| *b == 0)
                    .ok_or_else(|| bad("bad tree"))?;
                if nul < space || rest.len() < nul + 1 + hash_len {
                    return Err(bad("bad tree"));
                }
                let name = &rest[space + 1..nul];
                let id = hex(&rest[nul + 1..nul + 1 + hash_len]);
                if name == part.as_bytes() {
                    found = Some((rest[..space].to_vec(), oid_of(repo, &id)?));
                    break;
                }
                rest = &rest[nul + 1 + hash_len..];
            }
            let Some((mode, id)) = found else {
                return Ok(None);
            };
            if i + 1 == parts.len() {
                if mode == b"40000" {
                    return Ok(None);
                }
                return Ok(self.object(&id)?.map(|(_, bytes)| bytes));
            }
            current = id;
        }
        Ok(None)
    }

    /// The check of a lead's paths land runs on the committed tree: for every `plans/<name>/plan.md` among the
    /// commit's changed paths (added, modified or deleted; a glob in `--paths` is already expanded there) it
    /// compares the `footprint` in the commit with the one at the trunk tip the commit was made on. A deletion,
    /// a difference or a read failure refuses; the caller pushes nothing.
    fn require_footprint_unchanged(&self, tip: &Oid, commit: &Oid) -> Result<(), LandRefusal> {
        let is_plan = |path: &str| {
            let mut parts = path.split('/');
            matches!(
                (parts.next(), parts.next(), parts.next(), parts.next()),
                (Some("plans"), Some(name), Some("plan.md"), None) if !name.is_empty()
            )
        };
        let refused = |why: String| refuse("footprint-change-refused", why);
        for file in self
            .changed_paths(tip, commit)?
            .into_iter()
            .filter(|path| is_plan(path))
        {
            let read = |id: &Oid| {
                self.blob_at(id.as_str(), &file)
                    .map_err(|e| refused(format!("{file} cannot be read: {}", e.detail)))
            };
            let (trunk, committed) = (read(tip)?, read(commit)?);
            if trunk == committed {
                continue;
            }
            if committed.is_none() {
                return Err(refused(format!(
                    "{file} is deleted, dropping its footprint"
                )));
            }
            let after = footprint_in(&file, &committed).map_err(|why| {
                refused(format!(
                    "{file}: the committed footprint cannot be read: {why}"
                ))
            })?;
            match footprint_in(&file, &trunk) {
                Ok(before) if before == after => {}
                _ => {
                    return Err(refused(format!(
                        "{file} changes the footprint of its own plan"
                    )))
                }
            }
        }
        Ok(())
    }

    fn matches_any(&self, path: &str, globs: &[String]) -> Result<bool, LandRefusal> {
        let scope = fgos_write_scope::canonicalize_all(globs)
            .map_err(|e| refuse("land-request-invalid", e.to_string()))?;
        fgos_write_scope::matches(path.as_bytes(), &scope)
            .map_err(|e| refuse("land-request-invalid", e.to_string()))
    }

    fn check_tests(&self, root: &Path, tests: &[String]) -> Result<(), LandRefusal> {
        for t in tests {
            let p = Path::new(t);
            let plain = !p.is_absolute()
                && p.components()
                    .all(|c| matches!(c, std::path::Component::Normal(_)));
            if !plain || !root.join(p).exists() {
                return Err(refuse(
                    "land-test-unknown",
                    format!("{t} is not in {}", root.display()),
                ));
            }
        }
        Ok(())
    }

    /// Whether `when` is empty (always) or matches at least one of `changed`.
    fn any_matches(&self, changed: &[String], when: &[String]) -> Result<bool, LandRefusal> {
        if when.is_empty() {
            return Ok(true);
        }
        for path in changed {
            if self.matches_any(path, when)? {
                return Ok(true);
            }
        }
        Ok(false)
    }

    /// Run the gates whose `when` matches a changed path, in order, stopping at the first failure.
    fn run_gates(
        &self,
        cwd: &Path,
        changed: &[String],
        tests: &[String],
        gates_run: &mut Vec<String>,
        id: &str,
    ) -> Result<(), LandRefusal> {
        let quoted = tests
            .iter()
            .map(|t| shell_quote(t))
            .collect::<Vec<_>>()
            .join(" ");
        let mut plan_dirs = BTreeSet::new();
        for path in changed {
            if let Some(plan_dir) = plan_dir_of(path) {
                if cwd.join(&plan_dir).join("plan.md").is_file() {
                    plan_dirs.insert(plan_dir);
                }
            }
        }
        let quoted_plans = plan_dirs
            .iter()
            .map(|d| format!("--plan {}", shell_quote(d)))
            .collect::<Vec<_>>()
            .join(" ");
        for gate in &self.config.gates {
            if !self.any_matches(changed, &gate.when)? {
                continue;
            }
            if gate.run.contains("{plans}") && plan_dirs.is_empty() {
                continue;
            }
            let command = gate
                .run
                .replace("{tests}", &quoted)
                .replace("{plans}", &quoted_plans);
            self.run_logged(cwd, &command, &gate.run, id, "land-gate-failed")?;
            gates_run.push(gate.run.clone());
        }
        Ok(())
    }

    fn log_path(&self, id: &str, suffix: &str) -> PathBuf {
        self.ports.log_dir.join(format!("{id}.log{suffix}"))
    }

    /// Run one command with its full output in a log. A failure seals the log under `<id>.log`, and the refusal names it with the lines that show what failed.
    fn run_logged(
        &self,
        cwd: &Path,
        command: &str,
        shown: &str,
        id: &str,
        code: &str,
    ) -> Result<(), LandRefusal> {
        let partial = self.log_path(id, ".partial");
        let open = || -> std::io::Result<File> {
            std::fs::create_dir_all(self.ports.log_dir)?;
            let mut file = OpenOptions::new()
                .create(true)
                .write(true)
                .truncate(true)
                .open(&partial)?;
            writeln!(file, "$ {command}")?;
            Ok(file)
        };
        let file = open().map_err(|e| refuse(code, format!("{shown}: output log: {e}")))?;
        // Every land builds against one Cargo target that outlives its candidate checkout, so the crates it
        // already built are not built again; a caller that names its own target keeps it.
        let shared = self.ports.repo.trusted_main_root().join(LAND_CARGO_TARGET);
        let run = format!(
            "[ -n \"$CARGO_TARGET_DIR\" ] || export CARGO_TARGET_DIR={}; {command}",
            shell_quote(&shared.to_string_lossy())
        );
        let ok = self
            .ports
            .runner
            .run(cwd, &run, &file)
            .map_err(|e| refuse(code, format!("{shown}: {e}")))?;
        if ok {
            // A command that passed leaves no log; only the failing one is kept.
            let _ = std::fs::remove_file(&partial);
            return Ok(());
        }
        let _ = keep_log_end(&partial);
        let sealed = self.log_path(id, "");
        let (digest, gate_log) = match std::fs::rename(&partial, &sealed) {
            Ok(()) => (failure_digest(&sealed), Some(sealed)),
            Err(_) => (failure_digest(&partial), Some(partial)),
        };
        let mut refusal = refuse(code, format!("{shown}: {digest}"));
        if let Some(path) = &gate_log {
            refusal.detail = format!("{}\nfull output: {}", refusal.detail, path.display());
        }
        refusal.gate_log = gate_log;
        Err(refusal)
    }

    fn land_branch(&self, command: &LandCommand, branch: &str) -> Result<LandOutcome, LandRefusal> {
        let target = self.target_branch(command)?;
        let mut retries = 0;
        let mut gated: Option<Gated> = None;
        loop {
            match self.branch_attempt(command, branch, &target, retries, gated.as_ref())? {
                Attempt::Landed(mut outcome) => {
                    self.clean_landed_worktree(branch, &target, &mut outcome);
                    return Ok(outcome);
                }
                Attempt::RemoteMoved(_) if retries >= MAX_RETRIES => {
                    return Err(refuse(
                        "land-retries-exhausted",
                        format!("the remote moved on every one of {} attempts", retries + 1),
                    ))
                }
                Attempt::RemoteMoved(passed) => {
                    retries += 1;
                    // An attempt that lost the race before its gates keeps what an earlier one passed.
                    if passed.is_some() {
                        gated = passed;
                    }
                }
            }
        }
    }

    fn clean_landed_worktree(&self, branch: &str, target_branch: &str, outcome: &mut LandOutcome) {
        clean_landed_worktree(self.ports, branch, target_branch, outcome);
    }

    fn prepare(
        &self,
        command: &LandCommand,
        source: &Oid,
        target: &Oid,
        dest: &str,
        files: Vec<LandFile>,
    ) -> Result<(fgos_git::LandSession, String), LandRefusal> {
        let id = self.id();
        let request = LandRequest {
            source: source.as_str().into(),
            target: target.as_str().into(),
            destination: dest.into(),
            message: command.message.clone(),
            squash: command.squash,
            footprint: command.footprint.clone(),
            subtree: None,
            files,
        };
        let session = self
            .ports
            .git
            .prepare_land(
                self.ports.repo,
                vec![],
                &request,
                self.ports.writer,
                &id,
                &wal::OsFileSystem,
                self.ports.wait_ms,
            )
            .map_err(at("prepare"))?;
        Ok((session, id))
    }

    /// Release the candidate worktree of a land that published. The land is delivered whatever this
    /// returns: a cleanup that is deferred (a lock held, a checkout still reconciling) stays for
    /// `fgos git recover`, which frees finished chains, so it never fails the land.
    fn release_delivered(&self, session: fgos_git::LandSession, id: &str) {
        drop(session);
        let _ = self.ports.git.acknowledge_land(
            self.ports.repo,
            self.ports.writer,
            id,
            "supervision-land-delivered",
            &wal::OsFileSystem,
        );
    }

    /// Drop a session that published nothing, settle its chain and release its candidate worktree
    /// and pins, so an abandoned attempt leaves no pending operation and keeps no target ref busy.
    fn abandon(&self, session: fgos_git::LandSession, id: &str) -> Result<(), LandRefusal> {
        drop(session);
        let (git, repo, writer) = (self.ports.git, self.ports.repo, self.ports.writer);
        git.recover_land(repo, vec![], writer, id)
            .map_err(at("settle abandoned attempt"))?;
        let deferred = git
            .acknowledge_land(
                repo,
                writer,
                id,
                "supervision-land-abandoned",
                &wal::OsFileSystem,
            )
            .map_err(at("release abandoned attempt"))?;
        if deferred.is_empty() {
            Ok(())
        } else {
            Err(refuse(
                "land-recovery-required",
                format!(
                    "abandoned attempt {id} kept its candidate: {}; run `fgos git recover`",
                    deferred.join("; ")
                ),
            ))
        }
    }

    fn branch_attempt(
        &self,
        command: &LandCommand,
        branch: &str,
        target_branch: &str,
        retries: u32,
        gated: Option<&Gated>,
    ) -> Result<Attempt, LandRefusal> {
        let p = self.ports;
        let dest = format!("refs/heads/{target_branch}");
        self.sync_target(target_branch, &|| Ok(vec![]))?;
        let source = self
            .resolve(&format!(
                "refs/heads/{}",
                branch.strip_prefix("refs/heads/").unwrap_or(branch)
            ))?
            .ok_or_else(|| {
                refuse(
                    "land-branch-unknown",
                    format!("{branch} is not a local branch"),
                )
            })?;
        let target = self
            .resolve(&dest)?
            .ok_or_else(|| refuse("land-target-unknown", format!("{dest} is absent")))?;
        // The footprint judges what the branch itself carries (merge base to source). A regenerated
        // file is exempt only through the regeneration this land performs, never as a branch edit.
        if let Some(footprint) = &command.footprint {
            let base = self.merge_base(&target, &source)?;
            let outside: Vec<String> = self
                .changed_paths(&base, &source)?
                .into_iter()
                .map(|path| self.matches_any(&path, footprint).map(|ok| (ok, path)))
                .collect::<Result<Vec<_>, _>>()?
                .into_iter()
                .filter(|(ok, _)| !ok)
                .map(|(_, path)| path)
                .collect();
            if !outside.is_empty() {
                return Err(refuse("land-outside-footprint", outside.join(", ")));
            }
        }
        let merged = p
            .git
            .merge_tree(p.repo, &target, &source)
            .map_err(from_git)?;
        let conflicted: Vec<String> = merged.conflicted_paths.iter().map(|b| lossy(b)).collect();
        let mut undeclared = Vec::new();
        for c in &conflicted {
            let matched = fgos_write_scope::matches(c.as_bytes(), &self.regen_files)
                .map_err(|e| refuse("land-regenerate-failed", e.to_string()))?;
            if !matched {
                undeclared.push(c.as_str());
            }
        }
        if !undeclared.is_empty() {
            return Err(refuse("land-conflict-aborted", undeclared.join(", ")));
        }
        let mut files = Vec::new();
        for path in &conflicted {
            files.push(LandFile {
                path: path.clone(),
                bytes: self.blob_at(target.as_str(), path)?,
            });
        }

        let prepared = match self.prepare(command, &source, &target, &dest, files) {
            Ok(prepared) => prepared,
            // Another land took the slot first and moved the target: start over from a fresh fetch.
            Err(refusal) if refusal.code == "land-target-changed" => {
                return Ok(Attempt::RemoteMoved(None))
            }
            Err(refusal) => return Err(refusal),
        };
        let mut live = Some(prepared);
        let attempt = self.drive(
            command,
            (&source, &target, &dest, target_branch),
            &mut live,
            retries,
            gated,
        );
        if let Some((session, id)) = live.take() {
            // Nothing may stay pending after a refusal or a lost race: the door settles its own
            // operation. A crash never reaches here, and `fgos git recover` owns that case.
            if let Err(e) = self.abandon(session, &id) {
                return match attempt {
                    Err(mut refusal) => {
                        refusal.cleanup_note = Some(format!("settling it failed: {}", e.detail));
                        Err(refusal)
                    }
                    Ok(_) => Err(e),
                };
            }
        }
        attempt
    }

    /// Leave the session unsettled: the remote or main may already have moved, so only
    /// `fgos git recover` may decide what happened.
    fn unsettled(
        &self,
        live: &mut Option<(fgos_git::LandSession, String)>,
        mut refusal: LandRefusal,
    ) -> LandRefusal {
        live.take();
        // After a push or publish was tried the answer is recovery, never busy: a retry would only
        // meet the pending operation again.
        refusal.retryable = false;
        if !refusal.detail.contains("fgos git recover") {
            refusal.detail = format!(
                "{}; the push or publish may have happened: run `fgos git recover`",
                refusal.detail
            );
        }
        refusal
    }

    /// Everything after prepare: regenerate, gate, push, publish. `live` holds the session until
    /// it publishes; whatever is still in it when this returns is settled by the caller.
    fn drive(
        &self,
        command: &LandCommand,
        (source, target, dest, target_branch): (&Oid, &Oid, &str, &str),
        live: &mut Option<(fgos_git::LandSession, String)>,
        retries: u32,
        gated: Option<&Gated>,
    ) -> Result<Attempt, LandRefusal> {
        let p = self.ports;
        let no_candidate = || {
            refuse(
                "land-recovery-required",
                "no candidate; run `fgos git recover`",
            )
        };
        let reused = self.reusable(gated, target)?;
        let regenerates = match &self.config.regenerate {
            _ if reused.is_some() => false,
            Some(regen) if !regen.when.is_empty() => {
                let (session, _) = live.as_ref().ok_or_else(no_candidate)?;
                let candidate = session.candidate().ok_or_else(no_candidate)?;
                let oid = oid_of(p.repo, &candidate.candidate)?;
                let changed = self.changed_paths(target, &oid)?;
                self.any_matches(&changed, &regen.when)?
            }
            _ => true,
        };
        if let (Some(regen), true) = (&self.config.regenerate, regenerates) {
            let (session, id) = live.as_ref().ok_or_else(no_candidate)?;
            if session.candidate().is_none() {
                return Err(no_candidate());
            }
            let first = self.regenerate(session, regen, id)?;
            if let Some(files) = first {
                let (session, id) = live.take().ok_or_else(no_candidate)?;
                self.abandon(session, &id)?;
                *live = Some(self.prepare(command, source, target, dest, files)?);
                let (session, id) = live.as_ref().ok_or_else(no_candidate)?;
                if self.regenerate(session, regen, id)?.is_some() {
                    return Err(refuse(
                        "land-regenerate-failed",
                        "regeneration is not stable: a second run changed the files again",
                    ));
                }
            }
        }
        let (session, session_id) = live.as_ref().ok_or_else(no_candidate)?;
        let candidate = session.candidate().ok_or_else(no_candidate)?.clone();
        let candidate_oid = oid_of(p.repo, &candidate.candidate)?;
        let changed = self.changed_paths(target, &candidate_oid)?;
        self.check_tests(&candidate.worktree, &command.tests)?;
        let gates_run = match reused {
            Some(passed) => passed,
            None => {
                let mut gates_run = Vec::new();
                self.run_gates(
                    &candidate.worktree,
                    &changed,
                    &command.tests,
                    &mut gates_run,
                    session_id,
                )?;
                gates_run
            }
        };
        // A gate that changed tracked or staged candidate bytes means the gated tree is not the
        // candidate: refuse before anything reaches the remote.
        self.require_clean_candidate(&candidate)?;

        // Once the push was attempted, only a clean rejection proves nothing was published; any
        // other outcome leaves the session unsettled for `fgos git recover`.
        match self.push_candidate(session, target_branch) {
            Ok(true) => {}
            Ok(false) => {
                return Ok(Attempt::RemoteMoved(Some(Gated {
                    target: target.clone(),
                    gates_run,
                })))
            }
            Err(refusal) => return Err(self.unsettled(live, refusal)),
        }
        let digest = Sha256::digest(format!("{}\n{}", candidate.candidate, gates_run.join("\n")));
        let evidence = LandEvidence {
            source: candidate.source.clone(),
            target: candidate.target.clone(),
            candidate: candidate.candidate.clone(),
            tree_digest: candidate.tree_digest.clone(),
            evidence_digest: hex(&digest),
        };
        let (session, _) = live.as_mut().ok_or_else(no_candidate)?;
        let published =
            p.git
                .publish_land(p.repo, session, &evidence, &wal::OsFileSystem, p.wait_ms);
        if let Err(e) = published {
            return Err(self.unsettled(live, at("publish")(e)));
        }
        if let Some((session, id)) = live.take() {
            self.release_delivered(session, &id);
        }
        let main = self.resolve(dest)?.ok_or_else(|| {
            refuse(
                "land-target-unknown",
                format!("{dest} is absent after publish"),
            )
        })?;
        Ok(Attempt::Landed(LandOutcome {
            main_sha: main.as_str().into(),
            landed_paths: changed,
            retries,
            gates_run,
            worktrees_removed: Vec::new(),
            worktrees_kept: Vec::new(),
            worktree_list_error: None,
        }))
    }

    /// The gates an earlier attempt passed, when this attempt may land on them: the trunk moved since only by paths
    /// that no gate's `when` and no regeneration's `when` names. A gate with no `when` names every path, so any move
    /// runs the gates again, as does a move of a path a gate or the regeneration names.
    fn reusable(
        &self,
        gated: Option<&Gated>,
        target: &Oid,
    ) -> Result<Option<Vec<String>>, LandRefusal> {
        let Some(gated) = gated else { return Ok(None) };
        let moved = self.changed_paths(&gated.target, target)?;
        if let Some(regen) = &self.config.regenerate {
            if self.any_matches(&moved, &regen.when)? {
                return Ok(None);
            }
            // A regenerated file the trunk moved is one only the regeneration may settle.
            for path in &moved {
                let regenerated = fgos_write_scope::matches(path.as_bytes(), &self.regen_files)
                    .map_err(|e| refuse("land-regenerate-failed", e.to_string()))?;
                if regenerated {
                    return Ok(None);
                }
            }
        }
        for gate in &self.config.gates {
            if self.any_matches(&moved, &gate.when)? {
                return Ok(None);
            }
        }
        Ok(Some(gated.gates_run.clone()))
    }

    fn merge_base(&self, target: &Oid, source: &Oid) -> Result<Oid, LandRefusal> {
        let facts = self
            .ports
            .git
            .compare_commits(self.ports.repo, target, source)
            .map_err(from_git)?;
        let base = facts
            .get("mergeBase")
            .and_then(|b| b.as_str())
            .ok_or_else(|| {
                refuse(
                    "land-branch-unknown",
                    "the branch shares no history with the target",
                )
            })?;
        oid_of(self.ports.repo, base)
    }

    /// The candidate checkout still holds exactly the candidate commit, with no tracked or staged
    /// change: the same rule publication applies, read before the push.
    fn require_clean_candidate(&self, candidate: &LandCandidate) -> Result<(), LandRefusal> {
        let p = self.ports;
        let dirty = |what: String| refuse("land-candidate-dirty", what);
        let repo = match p
            .git
            .resolve_repo(&candidate.worktree, p.repo.trusted_main_root())
            .map_err(from_git)?
        {
            ResolveRepo::Repository(repo) => repo,
            ResolveRepo::NotARepository => {
                return Err(dirty(format!(
                    "{} is no longer a checkout",
                    candidate.worktree.display()
                )))
            }
        };
        match p.git.resolve_head(&repo).map_err(from_git)? {
            HeadFact::Attached { commit, .. } | HeadFact::Detached { commit }
                if commit.as_str() == candidate.candidate => {}
            other => {
                return Err(dirty(format!(
                    "a gate moved the candidate checkout's HEAD: {other:?}"
                )))
            }
        }
        let status = p
            .git
            .status(
                &repo,
                Untracked::None,
                Submodules::Configured,
                Ignored::Excluded,
                None,
                64,
            )
            .map_err(from_git)?;
        if !status.entries.is_empty() {
            return Err(dirty(format!(
                "a gate changed tracked candidate files: {}",
                status
                    .entries
                    .iter()
                    .map(|e| lossy(&e.path))
                    .collect::<Vec<_>>()
                    .join(", ")
            )));
        }
        Ok(())
    }

    /// Run the regeneration command in the candidate worktree. `Some(files)` when a regenerated file
    /// differs from the candidate's committed bytes; the worktree is restored to the committed bytes.
    fn regenerate(
        &self,
        session: &fgos_git::LandSession,
        regen: &Regenerate,
        id: &str,
    ) -> Result<Option<Vec<LandFile>>, LandRefusal> {
        let candidate = session
            .candidate()
            .ok_or_else(|| refuse("land-regenerate-failed", "no candidate worktree"))?;
        self.run_logged(
            &candidate.worktree,
            &regen.run,
            &regen.run,
            id,
            "land-regenerate-failed",
        )?;
        let mut regenerated = Vec::new();
        let mut differs = false;

        let has_globs = regen.files.iter().any(|f| f.contains('*'));
        if !has_globs {
            for file in &regen.files {
                Self::refuse_symlinked_components(&candidate.worktree, file, false)?;
                let full = candidate.worktree.join(file);
                let meta = match std::fs::symlink_metadata(&full) {
                    Ok(m) => Some(m),
                    Err(e) if e.kind() == std::io::ErrorKind::NotFound => None,
                    Err(e) => return Err(refuse("land-regenerate-failed", format!("{file}: {e}"))),
                };
                if let Some(m) = &meta {
                    if m.file_type().is_symlink() {
                        return Err(refuse(
                            "land-regenerate-failed",
                            format!("{file}: symlinks cannot be regenerated"),
                        ));
                    }
                }
                let now = match meta {
                    Some(_) => match std::fs::read(&full) {
                        Ok(bytes) => Some(bytes),
                        Err(e) => {
                            return Err(refuse("land-regenerate-failed", format!("{file}: {e}")))
                        }
                    },
                    None => None,
                };
                let committed = self.blob_at(&candidate.candidate, file)?;
                if now != committed {
                    differs = true;
                    // Leave the candidate as committed so a later publish sees a clean tree.
                    let restored = match &committed {
                        Some(bytes) => {
                            if let Some(parent) = full.parent() {
                                let _ = std::fs::create_dir_all(parent);
                            }
                            std::fs::write(&full, bytes)
                        }
                        None => std::fs::remove_file(&full).or_else(|e| {
                            if e.kind() == std::io::ErrorKind::NotFound {
                                Ok(())
                            } else {
                                Err(e)
                            }
                        }),
                    };
                    restored
                        .map_err(|e| refuse("land-regenerate-failed", format!("{file}: {e}")))?;
                }
                regenerated.push(LandFile {
                    path: file.clone(),
                    bytes: now,
                });
            }
            return Ok(differs.then_some(regenerated));
        }

        let mut files_to_compare = BTreeSet::new();
        for file in &regen.files {
            if !file.contains('*') {
                files_to_compare.insert(file.clone());
            }
        }
        self.candidate_tracked_paths_matching(
            &candidate.candidate,
            &self.regen_files,
            &mut files_to_compare,
        )?;
        let prefixes = Self::literal_dir_prefixes(&self.regen_files);
        for prefix in &prefixes {
            let start = if prefix.is_empty() {
                candidate.worktree.clone()
            } else {
                Self::refuse_symlinked_components(&candidate.worktree, prefix, true)?;
                candidate.worktree.join(prefix)
            };
            Self::walk_worktree_matching(
                &candidate.worktree,
                &start,
                &self.regen_files,
                &mut files_to_compare,
            )?;
        }

        for file in files_to_compare {
            Self::refuse_symlinked_components(&candidate.worktree, &file, false)?;
            let full = candidate.worktree.join(&file);
            let meta = match std::fs::symlink_metadata(&full) {
                Ok(m) => Some(m),
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => None,
                Err(e) => return Err(refuse("land-regenerate-failed", format!("{file}: {e}"))),
            };
            if let Some(m) = &meta {
                if m.file_type().is_symlink() {
                    return Err(refuse(
                        "land-regenerate-failed",
                        format!("{file}: symlinks cannot be regenerated"),
                    ));
                }
            }
            if meta.as_ref().is_some_and(|m| m.is_dir()) {
                // A literal directory entry: its files are compared through the walks.
                continue;
            }
            let now = match meta {
                Some(_) => match std::fs::read(&full) {
                    Ok(bytes) => Some(bytes),
                    Err(e) => return Err(refuse("land-regenerate-failed", format!("{file}: {e}"))),
                },
                None => None,
            };
            let committed = self.blob_at(&candidate.candidate, &file)?;
            if now != committed {
                differs = true;
                // Leave the candidate as committed so a later publish sees a clean tree.
                let restored = match &committed {
                    Some(bytes) => {
                        if let Some(parent) = full.parent() {
                            let _ = std::fs::create_dir_all(parent);
                        }
                        std::fs::write(&full, bytes)
                    }
                    None => std::fs::remove_file(&full).or_else(|e| {
                        if e.kind() == std::io::ErrorKind::NotFound {
                            Ok(())
                        } else {
                            Err(e)
                        }
                    }),
                };
                restored.map_err(|e| refuse("land-regenerate-failed", format!("{file}: {e}")))?;
            }
            regenerated.push(LandFile {
                path: file,
                bytes: now,
            });
        }
        Ok(differs.then_some(regenerated))
    }

    fn candidate_tracked_paths_matching(
        &self,
        candidate_commit: &str,
        scope: &[String],
        out: &mut BTreeSet<String>,
    ) -> Result<(), LandRefusal> {
        let repo = self.ports.repo;
        let bad = |what: &str| {
            refuse(
                "land-object-unreadable",
                format!("{candidate_commit}: {what}"),
            )
        };
        let Some((_, commit_bytes)) = self.object(&oid_of(repo, candidate_commit)?)? else {
            return Err(bad("commit missing"));
        };
        let tree_hex = commit_bytes
            .split(|b| *b == b'\n')
            .next()
            .and_then(|l| l.strip_prefix(b"tree "))
            .and_then(|h| std::str::from_utf8(h).ok())
            .ok_or_else(|| bad("commit has no tree"))?
            .to_string();
        let hash_len = match repo.object_format() {
            fgos_git::ObjectFormat::Sha1 => 20,
            fgos_git::ObjectFormat::Sha256 => 32,
        };
        let root_oid = oid_of(repo, &tree_hex)?;
        self.walk_tree_matching(&root_oid, b"", hash_len, scope, out)
    }

    fn walk_tree_matching(
        &self,
        tree_oid: &Oid,
        prefix: &[u8],
        hash_len: usize,
        scope: &[String],
        out: &mut BTreeSet<String>,
    ) -> Result<(), LandRefusal> {
        let bad = |what: &str| refuse("land-object-unreadable", what);
        let Some((_, tree)) = self.object(tree_oid)? else {
            return Err(bad("tree missing"));
        };
        let mut rest = tree.as_slice();
        while !rest.is_empty() {
            let space = rest
                .iter()
                .position(|b| *b == b' ')
                .ok_or_else(|| bad("bad tree"))?;
            let nul = rest
                .iter()
                .position(|b| *b == 0)
                .ok_or_else(|| bad("bad tree"))?;
            if nul < space || rest.len() < nul + 1 + hash_len {
                return Err(bad("bad tree"));
            }
            let mode = &rest[..space];
            let name_bytes = &rest[space + 1..nul];
            let id = hex(&rest[nul + 1..nul + 1 + hash_len]);
            rest = &rest[nul + 1 + hash_len..];

            let mut full_path_bytes = Vec::with_capacity(prefix.len() + 1 + name_bytes.len());
            if !prefix.is_empty() {
                full_path_bytes.extend_from_slice(prefix);
                full_path_bytes.push(b'/');
            }
            full_path_bytes.extend_from_slice(name_bytes);

            if mode == b"40000" {
                if let Ok(dir_str) = std::str::from_utf8(&full_path_bytes) {
                    if Self::can_dir_intersect(dir_str, scope) {
                        let sub_oid = oid_of(self.ports.repo, &id)?;
                        self.walk_tree_matching(&sub_oid, &full_path_bytes, hash_len, scope, out)?;
                    }
                }
            } else {
                let Ok(full_path_str) = std::str::from_utf8(&full_path_bytes) else {
                    continue;
                };
                let matched = fgos_write_scope::matches(full_path_str.as_bytes(), scope)
                    .map_err(|e| refuse("land-regenerate-failed", e.to_string()))?;
                if matched {
                    if mode == b"120000" {
                        return Err(refuse(
                            "land-regenerate-failed",
                            format!("{full_path_str}: symlinks cannot be regenerated"),
                        ));
                    }
                    out.insert(full_path_str.to_string());
                }
            }
        }
        Ok(())
    }

    fn literal_dir_prefixes(scope: &[String]) -> BTreeSet<String> {
        let mut prefixes = BTreeSet::new();
        for pattern in scope {
            if !pattern.contains('*') {
                // A literal entry also matches everything beneath it, so it is its own walk origin.
                prefixes.insert(pattern.trim_matches('/').to_string());
                continue;
            }
            let mut parts = Vec::new();
            for part in pattern.split('/') {
                if part.contains('*') {
                    break;
                }
                parts.push(part);
            }
            let prefix = parts.join("/");
            prefixes.insert(prefix);
        }
        if prefixes.is_empty() || prefixes.contains("") {
            let mut root = BTreeSet::new();
            root.insert(String::new());
            return root;
        }
        let list: Vec<String> = prefixes.into_iter().collect();
        let mut pruned = BTreeSet::new();
        for p in &list {
            let has_ancestor = list.iter().any(|other| {
                other != p && (other.is_empty() || p.starts_with(&format!("{other}/")))
            });
            if !has_ancestor {
                pruned.insert(p.clone());
            }
        }
        pruned
    }

    /// Refuse when a component of `rel` under `root` is a symlink: reads and restores would follow it.
    /// The final component is checked only when `include_last` (a walk origin); a compared file's
    /// own symlink state is handled by its caller.
    fn refuse_symlinked_components(
        root: &Path,
        rel: &str,
        include_last: bool,
    ) -> Result<(), LandRefusal> {
        let parts: Vec<&str> = rel.split('/').filter(|s| !s.is_empty()).collect();
        let upto = if include_last {
            parts.len()
        } else {
            parts.len().saturating_sub(1)
        };
        let mut cur = root.to_path_buf();
        for (i, part) in parts.iter().take(upto).enumerate() {
            cur.push(part);
            match std::fs::symlink_metadata(&cur) {
                Ok(m) if m.file_type().is_symlink() => {
                    return Err(refuse(
                        "land-regenerate-failed",
                        format!("{}: symlinks cannot be regenerated", parts[..=i].join("/")),
                    ))
                }
                Ok(_) => {}
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(()),
                Err(e) => {
                    return Err(refuse(
                        "land-regenerate-failed",
                        format!("{}: {e}", parts[..=i].join("/")),
                    ))
                }
            }
        }
        Ok(())
    }

    fn segment_matches(pat: &str, val: &str) -> bool {
        let (p, v) = (pat.as_bytes(), val.as_bytes());
        let (mut i, mut j, mut star, mut retry) = (0, 0, None, 0);
        while j < v.len() {
            if i < p.len() && p[i] == b'*' {
                star = Some(i);
                i += 1;
                retry = j;
            } else if i < p.len() && p[i] == v[j] {
                i += 1;
                j += 1;
            } else if let Some(s) = star {
                retry += 1;
                j = retry;
                i = s + 1;
            } else {
                return false;
            }
        }
        while i < p.len() && p[i] == b'*' {
            i += 1;
        }
        i == p.len()
    }

    fn can_dir_intersect(rel_dir: &str, scope: &[String]) -> bool {
        let dir_parts: Vec<&str> = rel_dir.split('/').filter(|s| !s.is_empty()).collect();
        if dir_parts.is_empty() {
            return true;
        }
        for pattern in scope {
            let pat_parts: Vec<&str> = pattern.split('/').filter(|s| !s.is_empty()).collect();
            if !pattern.contains('*') {
                // A literal entry matches its whole subtree: intersect when either is a prefix.
                let shared = dir_parts.len().min(pat_parts.len());
                if dir_parts[..shared] == pat_parts[..shared] {
                    return true;
                }
                continue;
            }
            let mut matches = true;
            for (i, dir_part) in dir_parts.iter().enumerate() {
                if i >= pat_parts.len() {
                    matches = false;
                    break;
                }
                if pat_parts[i] == "**" {
                    return true;
                }
                if !Self::segment_matches(pat_parts[i], dir_part) {
                    matches = false;
                    break;
                }
            }
            if matches {
                return true;
            }
        }
        false
    }

    fn walk_worktree_matching(
        root: &Path,
        current: &Path,
        scope: &[String],
        out: &mut BTreeSet<String>,
    ) -> Result<(), LandRefusal> {
        let meta = match std::fs::symlink_metadata(current) {
            Ok(m) => m,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(()),
            Err(e) => {
                return Err(refuse(
                    "land-regenerate-failed",
                    format!("{}: {e}", current.display()),
                ))
            }
        };
        if meta.file_type().is_symlink() {
            if let Ok(rel) = current.strip_prefix(root) {
                let rel_str = rel
                    .components()
                    .map(|c| c.as_os_str().to_str())
                    .collect::<Option<Vec<_>>>()
                    .map(|parts| parts.join("/"));
                if let Some(rel_str) = rel_str {
                    let matched = fgos_write_scope::matches(rel_str.as_bytes(), scope)
                        .map_err(|e| refuse("land-regenerate-failed", e.to_string()))?;
                    if matched {
                        return Err(refuse(
                            "land-regenerate-failed",
                            format!("{rel_str}: symlinks cannot be regenerated"),
                        ));
                    }
                }
            }
            return Ok(());
        }
        if !meta.is_dir() {
            return Ok(());
        }

        let entries = match std::fs::read_dir(current) {
            Ok(entries) => entries,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(()),
            Err(e) => {
                return Err(refuse(
                    "land-regenerate-failed",
                    format!("{}: {e}", current.display()),
                ))
            }
        };
        for entry in entries {
            let entry = entry.map_err(|e| {
                refuse(
                    "land-regenerate-failed",
                    format!("{}: {e}", current.display()),
                )
            })?;
            let name = entry.file_name();
            if name == ".git" {
                continue;
            }
            let path = entry.path();
            let file_type = entry.file_type().map_err(|e| {
                refuse("land-regenerate-failed", format!("{}: {e}", path.display()))
            })?;
            let Ok(rel) = path.strip_prefix(root) else {
                continue;
            };
            let rel_str = rel
                .components()
                .map(|c| c.as_os_str().to_str())
                .collect::<Option<Vec<_>>>()
                .map(|parts| parts.join("/"));
            let Some(rel_str) = rel_str else {
                continue;
            };

            if file_type.is_dir() {
                if Self::can_dir_intersect(&rel_str, scope) {
                    Self::walk_worktree_matching(root, &path, scope, out)?;
                }
            } else if file_type.is_symlink() {
                let matched = fgos_write_scope::matches(rel_str.as_bytes(), scope)
                    .map_err(|e| refuse("land-regenerate-failed", e.to_string()))?;
                if matched {
                    return Err(refuse(
                        "land-regenerate-failed",
                        format!("{rel_str}: symlinks cannot be regenerated"),
                    ));
                }
            } else if file_type.is_file() {
                let matched = fgos_write_scope::matches(rel_str.as_bytes(), scope)
                    .map_err(|e| refuse("land-regenerate-failed", e.to_string()))?;
                if matched {
                    out.insert(rel_str);
                }
            }
        }
        Ok(())
    }

    /// Push the session's candidate to the remote target branch from inside the live session;
    /// `false` when the remote moved.
    fn push_candidate(
        &self,
        session: &fgos_git::LandSession,
        target_branch: &str,
    ) -> Result<bool, LandRefusal> {
        let p = self.ports;
        let receipt = p
            .git
            .push_land_candidate(
                p.repo,
                session,
                p.remote,
                &ref_name(&format!("refs/heads/{target_branch}"))?,
                p.writer,
                &wal::OsFileSystem,
            )
            .map_err(at("push"))?;
        match receipt.remote {
            Remote::Acknowledged => Ok(true),
            Remote::Rejected => Ok(false),
            _ => Err(refuse(
                "land-remote-outcome-unknown",
                "the push outcome is unknown",
            )),
        }
    }

    fn land_paths(
        &self,
        command: &LandCommand,
        paths: &[String],
    ) -> Result<LandOutcome, LandRefusal> {
        let p = self.ports;
        if paths.is_empty() {
            return Err(refuse("land-paths-empty", "no paths named"));
        }
        let target = self.checked_out_target(command)?;
        let dest = format!("refs/heads/{target}");
        // The target's merge slot, the one a branch Land holds, serialises this land with every
        // Land of the same target from the sync through the push.
        let slot = p
            .git
            .acquire_merge_slot(p.repo, &ref_name(&dest)?, p.wait_ms)
            .map_err(at("merge slot"))?;
        let mut retries = 0;
        loop {
            let held = || slot.lend().map_err(from_git);
            match self.paths_attempt(command, paths, (&target, &dest), &held, retries)? {
                Some(outcome) => return Ok(outcome),
                None if retries >= MAX_RETRIES => {
                    return Err(refuse(
                        "land-retries-exhausted",
                        format!(
                            "the remote moved on every one of {} attempts; local {target} is unchanged \
                             and the named paths hold their bytes again",
                            retries + 1
                        ),
                    ))
                }
                None => retries += 1,
            }
        }
    }

    /// One try of a paths land. `None`: the remote moved after the commit, the commit was undone and
    /// the caller starts over from a fresh sync. Whenever this returns without a landed commit, local
    /// target is where it was and the named paths hold the bytes they held on entry.
    fn paths_attempt<'h>(
        &self,
        command: &LandCommand,
        paths: &[String],
        (target, dest): (&str, &str),
        held: &dyn Fn() -> Held<'h>,
        retries: u32,
    ) -> Result<Option<LandOutcome>, LandRefusal> {
        let p = self.ports;
        self.sync_target(target, held)?;
        self.check_tests(p.repo.trusted_main_root(), &command.tests)?;
        let tip = self
            .resolve(dest)?
            .ok_or_else(|| refuse("land-target-unknown", format!("{dest} is absent")))?;
        // The backlog items a plan turning done closes are written by the door, in this commit. They are
        // not the caller's paths, so the footprint check (plan files only) never sees them.
        let committed = if self.may_close_items(paths)? {
            self.concrete_paths(paths, held)?
        } else {
            Vec::new()
        };
        let mut door = DoorWrites::new(p.repo.trusted_main_root());
        let extra = match self.close_cited_items(paths, &committed, &tip, &mut door) {
            Ok(extra) => extra,
            Err(refusal) => return Err(door.restore_into(refusal)),
        };
        let mut writes = paths.to_vec();
        writes.extend(extra.into_iter().filter(|d| !paths.contains(d)));
        let kept = Cell::new(false);
        let attempt = self.paths_commit(
            command,
            (paths, &writes),
            target,
            held,
            retries,
            (&tip, &kept),
        );
        // The door's bytes stay while a local commit that holds them stays: putting the tree back then
        // would leave HEAD saying done and the files saying open.
        match attempt {
            Ok(Some(outcome)) => Ok(Some(outcome)),
            _ if kept.get() => attempt,
            Err(refusal) => Err(door.restore_into(refusal)),
            Ok(None) => match door.restore() {
                None => Ok(None),
                Some(note) => Err(refuse("land-backlog-restore-failed", note)),
            },
        }
    }

    /// Whether this land can close backlog items: a backlog port is wired and the caller's scope can
    /// reach a plan file.
    fn may_close_items(&self, paths: &[String]) -> Result<bool, LandRefusal> {
        if self.ports.backlog_index.is_none() {
            return Ok(false);
        }
        let scope = fgos_write_scope::canonicalize_all(paths)
            .map_err(|e| refuse("land-request-invalid", e.to_string()))?;
        fgos_write_scope::scopes_overlap(&scope, &["plans/*/plan.md".to_owned()])
            .map_err(|e| refuse("land-request-invalid", e.to_string()))
    }

    /// The concrete files the caller's `paths` commit: every changed file in the checkout one of them
    /// matches, plus each path that names a file outright. Globs are expanded here so the index
    /// generator sees files, never patterns.
    fn concrete_paths<'h>(
        &self,
        paths: &[String],
        held: &dyn Fn() -> Held<'h>,
    ) -> Result<Vec<String>, LandRefusal> {
        let p = self.ports;
        let baseline = p
            .git
            .preflight_commit(p.repo, held()?, None)
            .map_err(from_git)?;
        let mut files: Vec<String> = paths
            .iter()
            .filter(|path| !path.contains(['*', '?', '[', '{']))
            .cloned()
            .collect();
        for (changed, _) in &baseline.dirty {
            if !files.contains(changed) && self.matches_any(changed, paths)? {
                files.push(changed.clone());
            }
        }
        Ok(files)
    }

    /// For every plan the land commits whose frontmatter `status` turns `done` (it was not done at the
    /// target tip): set each cited backlog item that is not done to done and regenerate the index,
    /// through `door`; the index is regenerated whenever such a plan cites an item, since it shows the
    /// plan's status. An item the door adds itself is read at the tip, never from the working tree, so
    /// its own uncommitted edits cannot ride into the commit and a repeat after a crash writes the same
    /// bytes; an item inside the caller's own `paths` is the caller's bytes, set to done.
    /// `committed` is the concrete file list of the caller's paths.
    /// Returns the paths the door put in place or found already in place: the commit's extra writes.
    /// The caller restores `door` on a refusal.
    fn close_cited_items(
        &self,
        paths: &[String],
        committed: &[String],
        tip: &Oid,
        door: &mut DoorWrites,
    ) -> Result<Vec<String>, LandRefusal> {
        let Some(port) = self.ports.backlog_index else {
            return Ok(Vec::new());
        };
        let root = self.ports.repo.trusted_main_root();
        let backlog = root.join(BACKLOG_ROOT);
        if !backlog.is_dir() {
            return Ok(Vec::new());
        }
        let scope = fgos_write_scope::canonicalize_all(paths)
            .map_err(|e| refuse("land-request-invalid", e.to_string()))?;
        let plan_files = ["plans/*/plan.md".to_owned()];
        if !fgos_write_scope::scopes_overlap(&scope, &plan_files)
            .map_err(|e| refuse("land-request-invalid", e.to_string()))?
        {
            return Ok(Vec::new());
        }
        let mut ids = Vec::new();
        let unreadable = |e: std::io::Error| refuse("land-plan-unreadable", e.to_string());
        for entry in std::fs::read_dir(root.join("plans")).map_err(unreadable)? {
            let entry = entry.map_err(unreadable)?;
            let file = format!("plans/{}/plan.md", entry.file_name().to_string_lossy());
            if !entry.path().join("plan.md").is_file()
                || !fgos_write_scope::matches(file.as_bytes(), &scope)
                    .map_err(|e| refuse("land-request-invalid", e.to_string()))?
            {
                continue;
            }
            let bytes = std::fs::read(root.join(&file))
                .map_err(|e| refuse("land-plan-unreadable", format!("{file}: {e}")))?;
            if status_in(&file, &bytes).as_deref() != Some("done") {
                continue;
            }
            if self
                .blob_at(tip.as_str(), &file)?
                .is_some_and(|before| status_in(&file, &before).as_deref() == Some("done"))
            {
                continue;
            }
            let entries = frontmatter_entries(&file, &bytes)
                .and_then(|e| string_list(&e, "source"))
                .map_err(|why| refuse("land-plan-source-invalid", format!("{file}: {why}")))?;
            // A `p-` entry that is neither minted nor a legacy shape is a typo, not a source to skip.
            // Entries that are not backlog references (discussion paths, other ids) stay as they are.
            for entry in entries {
                match (port.classify)(&entry) {
                    BacklogRef::Invalid => {
                        return Err(refuse(
                            "land-plan-source-invalid",
                            format!("{file}: source '{entry}' is not a backlog id"),
                        ))
                    }
                    BacklogRef::Minted => ids.push((entry, true)),
                    BacklogRef::Legacy => ids.push((entry, false)),
                    BacklogRef::NotBacklog => {}
                }
            }
        }
        ids.sort();
        ids.dedup();
        let mut closed = Vec::new();
        let mut cited = false;
        for (id, minted) in &ids {
            let prefix = format!("{id}-");
            let mut found: Vec<String> = std::fs::read_dir(&backlog)
                .map_err(|e| refuse("land-backlog-item-unreadable", e.to_string()))?
                .filter_map(|e| e.ok())
                .map(|e| e.file_name().to_string_lossy().into_owned())
                .filter(|n| n.starts_with(&prefix) && n.ends_with(".md"))
                // A legacy id with dashes also prefixes longer ids' files: the frontmatter id decides.
                .filter(|n| {
                    let item = format!("{BACKLOG_ROOT}/{n}");
                    std::fs::read(root.join(&item))
                        .ok()
                        .and_then(|b| string_key_in(&item, &b, "id"))
                        .as_deref()
                        == Some(id.as_str())
                })
                .collect();
            found.sort();
            let name = match found.as_slice() {
                [one] => one.clone(),
                // A legacy id may name no item file at all: it is then not an item the door closes.
                [] if !minted => continue,
                [] => {
                    return Err(refuse(
                        "land-backlog-item-missing",
                        format!("the plan cites {id} but {BACKLOG_ROOT}/{id}-*.md does not exist"),
                    ))
                }
                _ => {
                    return Err(refuse(
                        "land-backlog-item-ambiguous",
                        format!("{BACKLOG_ROOT}/{id}-*.md matches {} files", found.len()),
                    ))
                }
            };
            cited = true;
            let item = format!("{BACKLOG_ROOT}/{name}");
            let invalid = |why: &str| refuse("land-backlog-item-invalid", format!("{item}: {why}"));
            let working = std::fs::read(root.join(&item))
                .map_err(|e| refuse("land-backlog-item-unreadable", format!("{item}: {e}")))?;
            let in_scope = fgos_write_scope::matches(item.as_bytes(), &scope)
                .map_err(|e| refuse("land-request-invalid", e.to_string()))?;
            let base = if in_scope {
                // The caller named this item: its bytes are the caller's, set to done.
                working.clone()
            } else {
                match self.blob_at(tip.as_str(), &item)? {
                    Some(at_tip) => at_tip,
                    None => {
                        return Err(refuse(
                            "land-backlog-item-missing",
                            format!("the plan cites {id} but {item} is not at the target tip"),
                        ))
                    }
                }
            };
            frontmatter_entries(&item, &base).map_err(|why| invalid(&why))?;
            let status = status_in(&item, &base).ok_or_else(|| invalid("no string status"))?;
            // Done stays done; a dropped item was closed on purpose and is not flipped.
            if status == "done" || status == "dropped" {
                continue;
            }
            let desired = with_status_done(&base).ok_or_else(|| invalid("no status line"))?;
            // The tip bytes (the normal case) or the desired bytes (a repeat after a crash) are the
            // door's to replace; anything else is someone's uncommitted edit.
            if !in_scope && working != base && working != desired {
                return Err(refuse(
                    "land-backlog-item-dirty",
                    format!("{item} has uncommitted edits; commit or revert them, then land again"),
                ));
            }
            closed.push((item, desired));
        }
        // The index shows each citing plan's status, so a plan turning done that cites an item changes
        // it even when no item does.
        if !cited {
            return Ok(Vec::new());
        }
        let mut writes = Vec::with_capacity(closed.len() + 1);
        for (item, bytes) in closed {
            door.put(&item, &bytes)
                .map_err(|e| refuse("land-backlog-item-unwritable", e))?;
            writes.push(item);
        }
        let committing: Vec<String> = committed
            .iter()
            .chain(writes.iter().filter(|w| !committed.contains(w)))
            .cloned()
            .collect();
        let regenerated = (port.index)(root, &committing)
            .map_err(|why| refuse("land-backlog-index-failed", why))?;
        door.put(BACKLOG_INDEX, regenerated.as_bytes())
            .map_err(|e| refuse("land-backlog-index-failed", e))?;
        writes.push(BACKLOG_INDEX.to_owned());
        Ok(writes)
    }

    /// The commit, gates and push of a paths land. `writes` is what is committed: the caller's `paths`
    /// plus whatever the door wrote itself. `kept` says whether a local commit of `writes` exists when
    /// this returns without a landed outcome: true once the commit is made, false again once it is undone.
    fn paths_commit<'h>(
        &self,
        command: &LandCommand,
        (_paths, writes): (&[String], &[String]),
        target: &str,
        held: &dyn Fn() -> Held<'h>,
        retries: u32,
        (tip, kept): (&Oid, &Cell<bool>),
    ) -> Result<Option<LandOutcome>, LandRefusal> {
        let p = self.ports;
        let mut baseline = p
            .git
            .preflight_commit(p.repo, held()?, None)
            .map_err(from_git)?;
        // The named paths are already modified: they are what this land commits, not pre-existing dirt.
        let mut others = Vec::new();
        for entry in std::mem::take(&mut baseline.dirty) {
            if !self.matches_any(&entry.0, writes)? {
                others.push(entry);
            }
        }
        baseline.dirty = others;
        let mut gates_run = Vec::new();
        self.run_gates(
            p.repo.trusted_main_root(),
            writes,
            &command.tests,
            &mut gates_run,
            &self.id(),
        )?;
        let result = p
            .git
            .scoped_commit(
                p.repo,
                held()?,
                &baseline,
                &CommitRequest {
                    writes: writes.to_vec(),
                    message: command.message.clone(),
                },
                p.writer,
                &self.id(),
                &wal::OsFileSystem,
            )
            .map_err(from_git)?;
        let Some(commit) = result.oid else {
            return Err(refuse(
                "land-paths-empty",
                "the named paths have no changes to land",
            ));
        };
        kept.set(true);
        let unpublished = |refusal: LandRefusal| -> LandRefusal {
            match self.undo_commit(target, &commit, tip, held) {
                Ok(()) => {
                    kept.set(false);
                    refusal
                }
                Err(e) => LandRefusal {
                    detail: format!(
                        "{}; undoing local commit {} failed: {}",
                        refusal.detail,
                        commit.as_str(),
                        e.detail
                    ),
                    ..refusal
                },
            }
        };
        // A hook changed the commit's tree, files or parents: it is not what was gated; push nothing.
        if result.status != ResultCode::Committed {
            return Err(unpublished(refuse(
                "land-commit-contract-violation",
                format!(
                    "local commit {} ended {:?}, not a clean commit of the named paths; nothing pushed, \
                     the commit was undone",
                    commit.as_str(),
                    result.status
                ),
            )));
        }
        if command.footprint.is_some() {
            if let Err(refusal) = self.require_footprint_unchanged(tip, &commit) {
                return Err(unpublished(refuse(
                    &refusal.code,
                    format!(
                        "{}; local commit {} was not pushed and was undone",
                        refusal.detail,
                        commit.as_str(),
                    ),
                )));
            }
        }
        // With the slot held no Land of this machine can move the remote; a rejection is another
        // machine or an outside push. Nothing was published, so the commit is undone and the caller
        // retries from a fresh sync.
        // A push that failed without an answer may have reached the remote: that commit stays, named,
        // for the next land's sync to find on origin or for a person.
        // A push the door refused before sending anything left the remote untouched: undo it too.
        let pushed = match self.push_local_door(target, held()?) {
            Ok(pushed) => pushed,
            Err((code, refusal)) if code != ResultCode::RemoteOutcomeUnknown => {
                return Err(unpublished(refusal));
            }
            Err((_, refusal)) => return Err(refusal),
        };
        if !pushed {
            let refusal = refuse(
                "land-paths-push-rejected",
                format!(
                    "local commit {} was not pushed: the remote {target} moved",
                    commit.as_str()
                ),
            );
            return match self.undo_commit(target, &commit, tip, held) {
                Ok(()) => {
                    kept.set(false);
                    Ok(None)
                }
                Err(e) => Err(LandRefusal {
                    detail: format!("{}; undoing it failed: {}", refusal.detail, e.detail),
                    ..refusal
                }),
            };
        }
        Ok(Some(LandOutcome {
            main_sha: commit.as_str().into(),
            landed_paths: result.files,
            retries,
            gates_run,
            worktrees_removed: Vec::new(),
            worktrees_kept: Vec::new(),
            worktree_list_error: None,
        }))
    }

    /// Undo this land's own unpublished commit through the Git door: the branch and index return
    /// to `tip` and every worktree byte stays, so the checkout is as it was before the land.
    fn undo_commit<'h>(
        &self,
        branch: &str,
        commit: &Oid,
        tip: &Oid,
        held: &dyn Fn() -> Held<'h>,
    ) -> Result<(), LandRefusal> {
        let p = self.ports;
        let branch = ref_name(&format!("refs/heads/{branch}"))?;
        p.git
            .undo_unpublished_commit(p.repo, held()?, &branch, commit, tip)
            .map_err(at("undo local commit"))
    }

    /// The target of a paths land: the branch the main checkout has checked out, since that is the
    /// branch it commits.
    fn checked_out_target(&self, command: &LandCommand) -> Result<String, LandRefusal> {
        let p = self.ports;
        let target = self.target_branch(command)?;
        let dest = format!("refs/heads/{target}");
        match p.git.resolve_head(p.repo).map_err(from_git)? {
            HeadFact::Attached { target: head, .. } if head.as_str() == dest => Ok(target),
            other => Err(refuse(
                "land-target-not-checked-out",
                format!("the main checkout is on {other:?}, not {dest}"),
            )),
        }
    }

    /// Push the local target branch itself; `false` when the remote rejected it as non-fast-forward.
    fn push_local(&self, branch: &str, held: Vec<BorrowedHandle<'_>>) -> Result<bool, LandRefusal> {
        self.push_local_door(branch, held)
            .map_err(|(_, refusal)| refusal)
    }

    /// `push_local`, with the Git door's code kept on a refusal so a caller can tell a push refused
    /// before anything was sent from one whose outcome is unknown.
    fn push_local_door(
        &self,
        branch: &str,
        held: Vec<BorrowedHandle<'_>>,
    ) -> Result<bool, (ResultCode, LandRefusal)> {
        let p = self.ports;
        let name = ref_name(&format!("refs/heads/{branch}"))
            .map_err(|r| (ResultCode::RemoteOutcomeUnknown, r))?;
        let receipt = p
            .git
            .push_refs(
                p.repo,
                held,
                p.remote,
                &[RefMapping {
                    source: name.clone(),
                    destination: name,
                }],
                p.writer,
                &self.id(),
            )
            .map_err(|e| (e.code, from_git(e)))?;
        match receipt.remote {
            Remote::Acknowledged => Ok(true),
            Remote::Rejected => Ok(false),
            _ => Err((
                ResultCode::RemoteOutcomeUnknown,
                refuse(
                    "land-remote-outcome-unknown",
                    "the push outcome is unknown",
                ),
            )),
        }
    }
}
