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
use std::fs::{File, OpenOptions};
use std::io::{Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

/// Failed fetch/push retries after the first attempt before `land-retries-exhausted`.
const MAX_RETRIES: u32 = 3;
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
    pub run: String,
    /// Path globs; empty means the gate always runs.
    pub when: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct Regenerate {
    pub run: String,
    pub files: Vec<String>,
}

#[derive(Debug, Clone, Default)]
pub struct LandConfig {
    pub gates: Vec<Gate>,
    pub regenerate: Option<Regenerate>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LandOutcome {
    pub main_sha: String,
    pub landed_paths: Vec<String>,
    pub retries: u32,
    pub gates_run: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
#[error("{code}: {detail}")]
pub struct LandRefusal {
    pub code: String,
    pub detail: String,
    /// The full output of the gate or regeneration that failed, when one ran.
    pub gate_log: Option<PathBuf>,
}

fn refuse(code: &str, detail: impl Into<String>) -> LandRefusal {
    LandRefusal {
        code: code.into(),
        detail: detail.into(),
        gate_log: None,
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
    if e.cause == "land-recovery-required" {
        detail = format!("{detail}; run `fgos git recover`");
    }
    LandRefusal {
        code: e.cause,
        detail,
        gate_log: None,
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
}

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
    match (&command.branch, &command.paths) {
        (Some(branch), None) => Lander { ports, config }.land_branch(command, branch),
        (None, Some(paths)) => Lander { ports, config }.land_paths(command, paths),
        _ => Err(refuse(
            "land-request-invalid",
            "give exactly one of a branch or a set of paths",
        )),
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

/// The sorted `footprint` in the frontmatter of the plan file `file` with these bytes; an absent file has none.
/// Only the frontmatter list is read: the rest of the plan contract is not this check's business.
fn footprint_in(file: &str, bytes: &Option<Vec<u8>>) -> Result<Vec<String>, String> {
    let Some(bytes) = bytes else {
        return Ok(Vec::new());
    };
    let text = std::str::from_utf8(bytes).map_err(|e| e.to_string())?;
    let text = text.strip_prefix('\u{FEFF}').unwrap_or(text);
    let mut lines = text.lines();
    if lines.next().map(str::trim_end) != Some("---") {
        return Err("no frontmatter block".into());
    }
    let mut front = Vec::new();
    let mut closed = false;
    for line in lines {
        if line.trim_end() == "---" {
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
    let mut footprint = match entries
        .iter()
        .find(|(k, _)| k == "footprint")
        .map(|(_, v)| v)
    {
        Some(fgos_yaml_doc::Value::Seq(items)) => items
            .iter()
            .map(|v| match v {
                fgos_yaml_doc::Value::Str(s) => Ok(s.clone()),
                _ => Err("footprint holds an entry that is not a string".to_owned()),
            })
            .collect::<Result<Vec<_>, _>>()?,
        None | Some(fgos_yaml_doc::Value::Null) => Vec::new(),
        Some(_) => return Err("footprint is not a list".into()),
    };
    footprint.sort();
    Ok(footprint)
}

struct Lander<'a> {
    ports: &'a LandPorts<'a>,
    config: &'a LandConfig,
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

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

fn lossy(path: &[u8]) -> String {
    String::from_utf8_lossy(path).into_owned()
}

type Held<'h> = Result<Vec<BorrowedHandle<'h>>, LandRefusal>;

enum Attempt {
    Landed(LandOutcome),
    RemoteMoved,
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
        let receipt = p
            .git
            .fetch_refs(p.repo, held()?, p.remote, &[mapping], p.writer, &self.id())
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
        Err(refuse(
            "land-target-ahead",
            format!(
                "local {dest} at {} has commits the remote tip {} lacks; push or reset them first",
                local_tip.as_str(),
                remote_tip.as_str()
            ),
        ))
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
        for gate in &self.config.gates {
            let applies = if gate.when.is_empty() {
                true
            } else {
                let mut hit = false;
                for path in changed {
                    if self.matches_any(path, &gate.when)? {
                        hit = true;
                        break;
                    }
                }
                hit
            };
            if !applies {
                continue;
            }
            let command = gate.run.replace("{tests}", &quoted);
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
        let ok = self
            .ports
            .runner
            .run(cwd, command, &file)
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
        loop {
            match self.branch_attempt(command, branch, &target, retries)? {
                Attempt::Landed(outcome) => return Ok(outcome),
                Attempt::RemoteMoved if retries >= MAX_RETRIES => {
                    return Err(refuse(
                        "land-retries-exhausted",
                        format!("the remote moved on every one of {} attempts", retries + 1),
                    ))
                }
                Attempt::RemoteMoved => retries += 1,
            }
        }
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
        let regen_files: Vec<String> = self
            .config
            .regenerate
            .as_ref()
            .map(|r| r.files.clone())
            .unwrap_or_default();

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
        let undeclared: Vec<&String> = conflicted
            .iter()
            .filter(|c| !regen_files.contains(c))
            .collect();
        if !undeclared.is_empty() {
            return Err(refuse(
                "land-conflict-aborted",
                undeclared
                    .iter()
                    .map(|s| s.as_str())
                    .collect::<Vec<_>>()
                    .join(", "),
            ));
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
                return Ok(Attempt::RemoteMoved)
            }
            Err(refusal) => return Err(refusal),
        };
        let mut live = Some(prepared);
        let attempt = self.drive(
            command,
            (&source, &target, &dest, target_branch),
            &mut live,
            retries,
        );
        if let Some((session, id)) = live.take() {
            // Nothing may stay pending after a refusal or a lost race: the door settles its own
            // operation. A crash never reaches here, and `fgos git recover` owns that case.
            if let Err(e) = self.abandon(session, &id) {
                return match attempt {
                    Err(mut refusal) => {
                        refusal.detail =
                            format!("{}; settling it failed: {}", refusal.detail, e.detail);
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
    ) -> Result<Attempt, LandRefusal> {
        let p = self.ports;
        let no_candidate = || {
            refuse(
                "land-recovery-required",
                "no candidate; run `fgos git recover`",
            )
        };
        if let Some(regen) = &self.config.regenerate {
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
        let mut gates_run = Vec::new();
        self.run_gates(
            &candidate.worktree,
            &changed,
            &command.tests,
            &mut gates_run,
            session_id,
        )?;
        // A gate that changed tracked or staged candidate bytes means the gated tree is not the
        // candidate: refuse before anything reaches the remote.
        self.require_clean_candidate(&candidate)?;

        // Once the push was attempted, only a clean rejection proves nothing was published; any
        // other outcome leaves the session unsettled for `fgos git recover`.
        match self.push_candidate(session, target_branch) {
            Ok(true) => {}
            Ok(false) => return Ok(Attempt::RemoteMoved),
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
        live.take();
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
        }))
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
        for file in &regen.files {
            let now = match std::fs::read(candidate.worktree.join(file)) {
                Ok(bytes) => Some(bytes),
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => None,
                Err(e) => return Err(refuse("land-regenerate-failed", format!("{file}: {e}"))),
            };
            let committed = self.blob_at(&candidate.candidate, file)?;
            if now != committed {
                differs = true;
                // Leave the candidate as committed so a later publish sees a clean tree.
                let full = candidate.worktree.join(file);
                let restored = match &committed {
                    Some(bytes) => std::fs::write(&full, bytes),
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
                path: file.clone(),
                bytes: now,
            });
        }
        Ok(differs.then_some(regenerated))
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
        let held = || slot.lend().map_err(from_git);
        self.sync_target(&target, &held)?;
        self.check_tests(p.repo.trusted_main_root(), &command.tests)?;
        let tip = self
            .resolve(&dest)?
            .ok_or_else(|| refuse("land-target-unknown", format!("{dest} is absent")))?;
        let mut baseline = p
            .git
            .preflight_commit(p.repo, held()?, None)
            .map_err(from_git)?;
        // The named paths are already modified: they are what this land commits, not pre-existing dirt.
        let mut others = Vec::new();
        for entry in std::mem::take(&mut baseline.dirty) {
            if !self.matches_any(&entry.0, paths)? {
                others.push(entry);
            }
        }
        baseline.dirty = others;
        let mut gates_run = Vec::new();
        self.run_gates(
            p.repo.trusted_main_root(),
            paths,
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
                    writes: paths.to_vec(),
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
        // A hook changed the commit's tree, files or parents: it is not what was gated; push nothing.
        if result.status != ResultCode::Committed {
            return Err(refuse(
                "land-commit-contract-violation",
                format!(
                    "local commit {} ended {:?}, not a clean commit of the named paths; nothing pushed",
                    commit.as_str(),
                    result.status
                ),
            ));
        }
        if command.footprint.is_some() {
            if let Err(refusal) = self.require_footprint_unchanged(&tip, &commit) {
                return Err(refuse(
                    &refusal.code,
                    format!(
                        "{}; local commit {} on {dest} was not pushed: inspect it, then reset local {target} to the \
                         remote tip (`git reset --keep {remote}/{target}`) and land again",
                        refusal.detail,
                        commit.as_str(),
                        remote = p.remote.name,
                    ),
                ));
            }
        }
        // With the slot held no Land of this target can move the remote; a rejection is an
        // outside push, and the local commit stays for a human to inspect.
        if !self.push_local(&target, held()?)? {
            return Err(refuse(
                "land-paths-push-rejected",
                format!(
                    "local commit {} on {dest} was not pushed: the remote {target} moved outside fgos. \
                     Inspect the commit, then reset local {target} to the remote tip \
                     (`git fetch {remote} {target}` and `git reset --keep {remote}/{target}`) and land again",
                    commit.as_str(),
                    remote = p.remote.name,
                ),
            ));
        }
        Ok(LandOutcome {
            main_sha: commit.as_str().into(),
            landed_paths: result.files,
            retries: 0,
            gates_run,
        })
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
        let p = self.ports;
        let name = ref_name(&format!("refs/heads/{branch}"))?;
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
            .map_err(from_git)?;
        match receipt.remote {
            Remote::Acknowledged => Ok(true),
            Remote::Rejected => Ok(false),
            _ => Err(refuse(
                "land-remote-outcome-unknown",
                "the push outcome is unknown",
            )),
        }
    }
}
