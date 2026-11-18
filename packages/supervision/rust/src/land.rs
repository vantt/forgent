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
    wal, CommitRequest, DiffScope, DiffSides, GitDriver, InspectCursor, LandEvidence,
    LandFile, LandRequest, ObjectType, Oid, OperationError, ReadObject, RefMapping, RefName,
    RefValue, Remote, RemoteGrant, RepoHandle, TrunkFact,
};
use sha2::{Digest, Sha256};
use std::io::Read;
use std::path::Path;
use std::process::{Command, Stdio};

/// Failed fetch/push retries after the first attempt before `land-retries-exhausted`.
const MAX_RETRIES: u32 = 3;
/// Bytes of a failing command's stderr kept in a refusal.
const TAIL_BYTES: usize = 4096;
/// Largest object (commit, tree or declared file) read while preparing a land.
const OBJECT_LIMIT: usize = 32 * 1024 * 1024;

/// One land request. Exactly one of `branch` and `paths` is set.
#[derive(Debug, Clone, Default)]
pub struct LandCommand {
    pub branch: Option<String>,
    pub paths: Option<Vec<String>>,
    /// Test paths given to a gate that uses `{tests}`.
    pub tests: Vec<String>,
    /// The caller's plan footprint; a branch may change only paths it matches.
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
}

fn refuse(code: &str, detail: impl Into<String>) -> LandRefusal {
    LandRefusal {
        code: code.into(),
        detail: detail.into(),
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
    }
}

fn tail(bytes: &[u8]) -> String {
    let start = bytes.len().saturating_sub(TAIL_BYTES);
    String::from_utf8_lossy(&bytes[start..]).trim().to_string()
}

/// What a shell command left behind.
#[derive(Debug, Clone)]
pub struct CommandOutput {
    pub success: bool,
    /// The last bytes of stderr, bounded.
    pub stderr_tail: String,
}

/// The one door for running a gate or regeneration command.
pub trait CommandRunner {
    fn run(&self, cwd: &Path, command: &str) -> std::io::Result<CommandOutput>;
}

/// `sh -c` in `cwd` with the caller's environment; stdout is discarded and stderr keeps a bounded tail.
pub struct ShellRunner;

impl CommandRunner for ShellRunner {
    fn run(&self, cwd: &Path, command: &str) -> std::io::Result<CommandOutput> {
        let mut child = Command::new("sh")
            .arg("-c")
            .arg(command)
            .current_dir(cwd)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::piped())
            .spawn()?;
        let mut kept: Vec<u8> = Vec::new();
        if let Some(mut err) = child.stderr.take() {
            let mut buf = [0u8; 8192];
            loop {
                let n = err.read(&mut buf)?;
                if n == 0 {
                    break;
                }
                kept.extend_from_slice(&buf[..n]);
                if kept.len() > 2 * TAIL_BYTES {
                    kept.drain(..kept.len() - TAIL_BYTES);
                }
            }
        }
        let status = child.wait()?;
        Ok(CommandOutput {
            success: status.success(),
            stderr_tail: tail(&kept),
        })
    }
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

struct Lander<'a> {
    ports: &'a LandPorts<'a>,
    config: &'a LandConfig,
}

fn oid_of(repo: &RepoHandle, text: &str) -> Result<Oid, LandRefusal> {
    Oid::parse(text, repo.object_format()).map_err(|e| refuse("land-request-invalid", e.to_string()))
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
        let TrunkFact::Known(name) = trunk else {
            return Err(refuse("land-target-unknown", "the project trunk is not known; pass a target"));
        };
        let remote_prefix = format!("refs/remotes/{}/", self.ports.remote.name);
        name.as_str()
            .strip_prefix("refs/heads/")
            .or_else(|| name.as_str().strip_prefix(&remote_prefix))
            .map(str::to_string)
            .ok_or_else(|| refuse("land-target-unknown", format!("trunk {} is not a branch", name.as_str())))
    }

    /// Fetch the target and fast-forward local main to the remote tip. Local main never holds an
    /// unpushed commit: a local-only tip is `land-remote-diverged`.
    fn sync_target(&self, branch: &str) -> Result<(), LandRefusal> {
        let p = self.ports;
        let tracking = format!("refs/remotes/{}/{}", p.remote.name, branch);
        let dest = format!("refs/heads/{branch}");
        let mapping = RefMapping {
            source: ref_name(&dest)?,
            destination: ref_name(&tracking)?,
        };
        let receipt = p
            .git
            .fetch_refs(p.repo, vec![], p.remote, &[mapping], p.writer, &self.id())
            .map_err(at("fetch"))?;
        match receipt.remote {
            Remote::Acknowledged => {}
            Remote::Unknown => {
                return Err(refuse("land-remote-outcome-unknown", "the fetch outcome is unknown"))
            }
            _ => {
                return Err(refuse(
                    "land-remote-diverged",
                    format!("the remote refused to move {tracking}"),
                ))
            }
        }
        let remote_tip = self
            .resolve(&tracking)?
            .ok_or_else(|| refuse("land-remote-diverged", format!("{tracking} is absent after fetch")))?;
        let local_tip = self
            .resolve(&dest)?
            .ok_or_else(|| refuse("land-target-unknown", format!("local {dest} is absent")))?;
        if remote_tip == local_tip {
            return Ok(());
        }
        if p.git.ancestry(p.repo, &local_tip, &remote_tip).map_err(from_git)? {
            p.git
                .fast_forward_checked_out(
                    p.repo,
                    vec![],
                    &ref_name(&dest)?,
                    &local_tip,
                    &remote_tip,
                    p.writer,
                    &self.id(),
                )
                .map_err(at("fast-forward main"))?;
            return Ok(());
        }
        Err(refuse(
            "land-remote-diverged",
            format!(
                "local {dest} at {} has commits the remote tip {} lacks",
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
        let bad = |what: &str| refuse("land-object-unreadable", format!("{path} at {commit}: {what}"));
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
                let space = rest.iter().position(|b| *b == b' ').ok_or_else(|| bad("bad tree"))?;
                let nul = rest.iter().position(|b| *b == 0).ok_or_else(|| bad("bad tree"))?;
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
                && p.components().all(|c| matches!(c, std::path::Component::Normal(_)));
            if !plain || !root.join(p).exists() {
                return Err(refuse("land-test-unknown", format!("{t} is not in {}", root.display())));
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
    ) -> Result<(), LandRefusal> {
        let quoted = tests.iter().map(|t| shell_quote(t)).collect::<Vec<_>>().join(" ");
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
            let out = self
                .ports
                .runner
                .run(cwd, &command)
                .map_err(|e| refuse("land-gate-failed", format!("{}: {e}", gate.run)))?;
            gates_run.push(gate.run.clone());
            if !out.success {
                return Err(refuse(
                    "land-gate-failed",
                    format!("{}: {}", gate.run, out.stderr_tail),
                ));
            }
        }
        Ok(())
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
    ) -> Result<fgos_git::LandSession, LandRefusal> {
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
        self.ports
            .git
            .prepare_land(
                self.ports.repo,
                vec![],
                &request,
                self.ports.writer,
                &self.id(),
                &wal::OsFileSystem,
                self.ports.wait_ms,
            )
            .map_err(at("prepare"))
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
        self.sync_target(target_branch)?;
        let source = self
            .resolve(&format!("refs/heads/{}", branch.strip_prefix("refs/heads/").unwrap_or(branch)))?
            .ok_or_else(|| refuse("land-branch-unknown", format!("{branch} is not a local branch")))?;
        let target = self
            .resolve(&dest)?
            .ok_or_else(|| refuse("land-target-unknown", format!("{dest} is absent")))?;
        let regen_files: Vec<String> = self
            .config
            .regenerate
            .as_ref()
            .map(|r| r.files.clone())
            .unwrap_or_default();

        let merged = p.git.merge_tree(p.repo, &target, &source).map_err(from_git)?;
        if let Some(footprint) = &command.footprint {
            let outside: Vec<String> = self
                .changed_paths(&target, &merged.tree)?
                .into_iter()
                .filter(|path| !regen_files.contains(path))
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
        let conflicted: Vec<String> = merged.conflicted_paths.iter().map(|b| lossy(b)).collect();
        let undeclared: Vec<&String> = conflicted.iter().filter(|c| !regen_files.contains(c)).collect();
        if !undeclared.is_empty() {
            return Err(refuse(
                "land-conflict-aborted",
                undeclared.iter().map(|s| s.as_str()).collect::<Vec<_>>().join(", "),
            ));
        }
        let mut files = Vec::new();
        for path in &conflicted {
            files.push(LandFile {
                path: path.clone(),
                bytes: self.blob_at(target.as_str(), path)?,
            });
        }

        let mut session = self.prepare(command, &source, &target, &dest, files)?;
        if session.candidate().is_none() {
            return Err(refuse("land-recovery-required", "no candidate; run `fgos git recover`"));
        }
        if let Some(regen) = &self.config.regenerate {
            let first = self.regenerate(&session, regen)?;
            if let Some(files) = first {
                drop(session);
                session = self.prepare(command, &source, &target, &dest, files)?;
                if self.regenerate(&session, regen)?.is_some() {
                    return Err(refuse(
                        "land-regenerate-failed",
                        "regeneration is not stable: a second run changed the files again",
                    ));
                }
            }
        }
        let candidate = session
            .candidate()
            .ok_or_else(|| refuse("land-recovery-required", "no candidate; run `fgos git recover`"))?
            .clone();
        let candidate_oid = oid_of(p.repo, &candidate.candidate)?;
        let changed = self.changed_paths(&target, &candidate_oid)?;
        self.check_tests(&candidate.worktree, &command.tests)?;
        let mut gates_run = Vec::new();
        self.run_gates(&candidate.worktree, &changed, &command.tests, &mut gates_run)?;

        if !self.push_candidate(&candidate_oid, target_branch)? {
            drop(session);
            return Ok(Attempt::RemoteMoved);
        }
        let digest = Sha256::digest(format!("{}\n{}", candidate.candidate, gates_run.join("\n")));
        let evidence = LandEvidence {
            source: candidate.source.clone(),
            target: candidate.target.clone(),
            candidate: candidate.candidate.clone(),
            tree_digest: candidate.tree_digest.clone(),
            evidence_digest: hex(&digest),
        };
        p.git
            .publish_land(p.repo, &mut session, &evidence, &wal::OsFileSystem, p.wait_ms)
            .map_err(at("publish"))?;
        drop(session);
        let main = self
            .resolve(&dest)?
            .ok_or_else(|| refuse("land-target-unknown", format!("{dest} is absent after publish")))?;
        Ok(Attempt::Landed(LandOutcome {
            main_sha: main.as_str().into(),
            landed_paths: changed,
            retries,
            gates_run,
        }))
    }

    /// Run the regeneration command in the candidate worktree. `Some(files)` when a regenerated file
    /// differs from the candidate's committed bytes; the worktree is restored to the committed bytes.
    fn regenerate(
        &self,
        session: &fgos_git::LandSession,
        regen: &Regenerate,
    ) -> Result<Option<Vec<LandFile>>, LandRefusal> {
        let candidate = session
            .candidate()
            .ok_or_else(|| refuse("land-regenerate-failed", "no candidate worktree"))?;
        let out = self
            .ports
            .runner
            .run(&candidate.worktree, &regen.run)
            .map_err(|e| refuse("land-regenerate-failed", format!("{}: {e}", regen.run)))?;
        if !out.success {
            return Err(refuse(
                "land-regenerate-failed",
                format!("{}: {}", regen.run, out.stderr_tail),
            ));
        }
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

    /// Push the candidate to the remote target branch; `false` when the remote moved. The port
    /// refuses a `refs/fgos/` source, so the candidate rides a short-lived branch.
    fn push_candidate(&self, candidate: &Oid, target_branch: &str) -> Result<bool, LandRefusal> {
        let p = self.ports;
        let temp = ref_name(&format!("refs/heads/fgos-land-{}", self.id()))?;
        p.git
            .ensure_branch(p.repo, vec![], &temp, candidate, p.writer, &self.id())
            .map_err(at("push branch"))?;
        let pushed = p.git.push_refs(
            p.repo,
            vec![],
            p.remote,
            &[RefMapping {
                source: temp.clone(),
                destination: ref_name(&format!("refs/heads/{target_branch}"))?,
            }],
            p.writer,
            &self.id(),
        );
        let _ = p
            .git
            .delete_ref(p.repo, vec![], &temp, candidate, p.writer, &self.id());
        match pushed.map_err(at("push"))?.remote {
            Remote::Acknowledged => Ok(true),
            Remote::Rejected => Ok(false),
            _ => Err(refuse("land-remote-outcome-unknown", "the push outcome is unknown")),
        }
    }

    fn land_paths(&self, command: &LandCommand, paths: &[String]) -> Result<LandOutcome, LandRefusal> {
        let p = self.ports;
        if paths.is_empty() {
            return Err(refuse("land-paths-empty", "no paths named"));
        }
        let target = self.target_branch(command)?;
        let dest = format!("refs/heads/{target}");
        self.sync_target(&target)?;
        self.check_tests(p.repo.trusted_main_root(), &command.tests)?;
        let baseline = p.git.preflight_commit(p.repo, vec![], None).map_err(from_git)?;
        let mut gates_run = Vec::new();
        self.run_gates(p.repo.trusted_main_root(), paths, &command.tests, &mut gates_run)?;
        let result = p
            .git
            .scoped_commit(
                p.repo,
                vec![],
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
            return Err(refuse("land-paths-empty", "the named paths have no changes to land"));
        };
        let mut retries = 0;
        loop {
            if self.push_local(&target)? {
                break;
            }
            // The remote moved after the local commit: fast-forward push only.
            let tracking = format!("refs/remotes/{}/{}", p.remote.name, target);
            self.fetch_tracking(&target)?;
            let remote_tip = self
                .resolve(&tracking)?
                .ok_or_else(|| refuse("land-remote-diverged", format!("{tracking} is absent")))?;
            let local_tip = self
                .resolve(&dest)?
                .ok_or_else(|| refuse("land-target-unknown", format!("{dest} is absent")))?;
            let can_ff = p.git.ancestry(p.repo, &remote_tip, &local_tip).map_err(from_git)?;
            if !can_ff {
                return Err(refuse(
                    "land-remote-diverged",
                    format!("local commit {} is not pushed; the remote moved", commit.as_str()),
                ));
            }
            if retries >= MAX_RETRIES {
                return Err(refuse(
                    "land-remote-diverged",
                    format!("local commit {} is not pushed; the remote kept moving", commit.as_str()),
                ));
            }
            retries += 1;
        }
        Ok(LandOutcome {
            main_sha: commit.as_str().into(),
            landed_paths: result.files,
            retries,
            gates_run,
        })
    }

    fn fetch_tracking(&self, branch: &str) -> Result<(), LandRefusal> {
        let p = self.ports;
        let mapping = RefMapping {
            source: ref_name(&format!("refs/heads/{branch}"))?,
            destination: ref_name(&format!("refs/remotes/{}/{}", p.remote.name, branch))?,
        };
        p.git
            .fetch_refs(p.repo, vec![], p.remote, &[mapping], p.writer, &self.id())
            .map_err(from_git)?;
        Ok(())
    }

    /// Push the local target branch itself; `false` when the remote rejected it as non-fast-forward.
    fn push_local(&self, branch: &str) -> Result<bool, LandRefusal> {
        let p = self.ports;
        let name = ref_name(&format!("refs/heads/{branch}"))?;
        let receipt = p
            .git
            .push_refs(
                p.repo,
                vec![],
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
            _ => Err(refuse("land-remote-outcome-unknown", "the push outcome is unknown")),
        }
    }
}
