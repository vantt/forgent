//! Worktree administration. One rank-40 hold spans inspection and mutation.
use crate::{
    driver::Policy,
    refs::{admission, failure, install_pin, pending, recovery, release_pin, Authority},
    wal::{self, Begin, Intent, OperationKind, Outcome, Phase, Tip, Wal},
    *,
};
use fgos_holder_lock::{BorrowedHandle, LockScope};
use serde::Serialize;
use std::{
    collections::BTreeSet,
    fs,
    path::{Path, PathBuf},
    time::Duration,
};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorktreeHandle {
    pub path: PathBuf,
    pub git_dir: PathBuf,
    pub branch: Option<String>,
    pub tip: Oid,
    pub creation_identity: String,
}
/// The pid a `git worktree lock` reason names: the number after a `pid`
/// token (`pid 42`, `(pid=42`, `pid:42`). Generic, not tied to any harness.
fn pid_named_by(reason: &str) -> Option<u32> {
    let lower = reason.to_ascii_lowercase();
    let mut from = 0;
    while let Some(at) = lower[from..].find("pid") {
        let rest = lower[from + at + 3..].trim_start_matches([' ', ':', '=']);
        let digits: String = rest.chars().take_while(char::is_ascii_digit).collect();
        if let Ok(pid) = digits.parse() {
            return Some(pid);
        }
        from += at + 3;
    }
    None
}
/// True when the lock reason names a process that was already running when the
/// lock file was written and still is (pid plus start time, never a bare pid:
/// a process started after the lock is a reused pid). Unknown is false, so the
/// registration stays a finding.
#[cfg(target_os = "linux")]
fn lock_names_live_process(lock: &Path) -> bool {
    use fgos_process::facts::{boot_ticks_now, observe, Observed};
    use fgos_process::ProcId;
    let Some(pid) = fs::read_to_string(lock)
        .ok()
        .as_deref()
        .and_then(pid_named_by)
    else {
        return false;
    };
    let Observed::Live { start_time } = observe(ProcId(pid)) else {
        return false;
    };
    let (Ok(started), Some(now_ticks)) = (start_time.parse::<u64>(), boot_ticks_now()) else {
        return false;
    };
    let Some(age) = fs::metadata(lock)
        .and_then(|m| m.modified())
        .ok()
        .and_then(|t| t.elapsed().ok())
    else {
        return false;
    };
    // SAFETY: sysconf only reads a limit.
    let hz = unsafe { libc::sysconf(libc::_SC_CLK_TCK) };
    if hz <= 0 {
        return false;
    }
    let lock_ticks = now_ticks.saturating_sub(age.as_secs() * hz as u64);
    started <= lock_ticks + hz as u64
}
#[cfg(not(target_os = "linux"))]
fn lock_names_live_process(_lock: &Path) -> bool {
    false
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorktreeIssue {
    pub path: PathBuf,
    pub registration: String,
    pub reason: String,
}
#[derive(Debug)]
pub struct WorktreeCreate {
    pub path: PathBuf,
    pub branch: Option<RefName>,
    pub base: Oid,
    pub session_id: Option<String>,
}
#[derive(Debug)]
pub struct WorktreeDelivery {
    pub expected_tip: Oid,
    pub delivered_to: Oid,
    pub evidence_digest: String,
}
fn text(p: &Path) -> Result<&str> {
    p.to_str().ok_or_else(|| failure("worktree-path-not-utf8"))
}
fn missing(p: &Path) -> Result<bool> {
    match fs::symlink_metadata(p) {
        Ok(_) => Ok(false),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(true),
        Err(e) => Err(failure(e)),
    }
}
fn canonical_destination(path: &Path) -> Result<PathBuf> {
    if !path.is_absolute()
        || path.components().any(|c| {
            matches!(
                c,
                std::path::Component::ParentDir | std::path::Component::CurDir
            )
        })
    {
        return Err(failure("worktree-path-must-be-absolute"));
    }
    let parent = path
        .parent()
        .ok_or_else(|| failure("worktree-root-refused"))?
        .canonicalize()
        .map_err(failure)?;
    Ok(parent.join(
        path.file_name()
            .ok_or_else(|| failure("worktree-root-refused"))?,
    ))
}
fn registration(kind: &OperationKind) -> Result<&str> {
    match kind {
        OperationKind::WorktreeCreate { registration, .. }
        | OperationKind::WorktreeMove { registration, .. }
        | OperationKind::WorktreeRemove { registration, .. } => Ok(registration),
        _ => Err(failure("not-a-worktree-operation")),
    }
}
impl GitDriver {
    /// Resolve a literal base once; the mutation binds the resulting commit.
    pub fn resolve_worktree_base(&self, repo: &RepoHandle, base: Option<&str>) -> Result<Oid> {
        let base = match base {
            None | Some("HEAD") => {
                return match self.resolve_head(repo)? {
                    HeadFact::Attached { commit, .. } | HeadFact::Detached { commit } => Ok(commit),
                    _ => Err(failure("worktree-base-unborn")),
                }
            }
            Some(base) => base,
        };
        let oid = if let Ok(oid) = Oid::parse(base, repo.object_format()) {
            oid
        } else {
            let names = if base.starts_with("refs/") {
                vec![base.to_owned()]
            } else {
                vec![
                    format!("refs/heads/{base}"),
                    format!("refs/tags/{base}"),
                    format!("refs/remotes/{base}"),
                ]
            };
            let mut found = None;
            for name in names {
                let name = RefName::parse(&name).map_err(failure)?;
                match self.resolve_ref(repo, &name)? {
                    RefValue::Direct(oid) => {
                        found = Some(oid);
                        break;
                    }
                    RefValue::Absent => (),
                    RefValue::Symbolic(_) => return Err(failure("worktree-base-not-direct")),
                }
            }
            found.ok_or_else(|| failure("worktree-base-not-direct"))?
        };
        let peeled = self.checked(
            repo,
            &[
                "rev-parse",
                "--verify",
                "--end-of-options",
                &format!("{}^{{commit}}", oid.as_str()),
            ],
            Policy::Inspect,
        )?;
        Oid::parse(
            std::str::from_utf8(&peeled)
                .map_err(failure)?
                .trim_end_matches('\n'),
            repo.object_format(),
        )
        .map_err(failure)
    }
    fn worktree_scope<'a>(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'a>>,
    ) -> Result<LockScope<'a>> {
        crate::refs::adopt_worktree_admin(repo, held)
    }
    fn worktree_call(&self, repo: &RepoHandle, scope: &LockScope<'_>, args: &[&str]) -> Result<()> {
        scope.validate().map_err(failure)?;
        self.preflight(repo)?;
        let admin = scope
            .handle("worktree-admin")
            .ok_or_else(|| failure("worktree-admin-required"))?;
        let out = self.invoke(
            Some(repo),
            repo.trusted_main_root(),
            args,
            Policy::Publication,
            Some(admin),
            true,
            1024 * 1024,
            Duration::from_secs(120),
        )?;
        if out.success {
            Ok(())
        } else {
            Err(out.error("worktree-command-failed"))
        }
    }
    fn worktree_rows(&self, repo: &RepoHandle) -> Result<Vec<WorktreeFact>> {
        let mut rows = vec![];
        let mut cursor = None;
        loop {
            let page = self.list_worktrees(repo, cursor, 4096)?;
            rows.extend(page.entries);
            if page.complete {
                return Ok(rows);
            }
            cursor = page.next_cursor;
        }
    }
    fn exclude_nested(&self, repo: &RepoHandle, path: &Path, rows: &[WorktreeFact]) -> Result<()> {
        for row in rows {
            let registered = byte_path(&row.path)?;
            let registered = if missing(&registered)? {
                registered
            } else {
                registered.canonicalize().map_err(failure)?
            };
            if (registered != repo.trusted_main_root() && path.starts_with(&registered))
                || registered.starts_with(path)
                || path.starts_with(repo.common_dir())
            {
                return Err(failure("worktree-nested-path-refused"));
            }
        }
        Ok(())
    }
    fn worktree_handle(&self, repo: &RepoHandle, path: &Path) -> Result<WorktreeHandle> {
        let target = match self.resolve_repo(path, repo.trusted_main_root())? {
            ResolveRepo::Repository(r) => r,
            _ => return Err(recovery("worktree-registration-missing")),
        };
        if target.work_tree.as_deref() != Some(path)
            || target.common_dir() != repo.common_dir()
            || path == repo.trusted_main_root()
        {
            return Err(failure("worktree-identity-refused"));
        }
        let (branch, tip) = match self.resolve_head(&target)? {
            HeadFact::Attached { target, commit } => (Some(target.as_str().into()), commit),
            HeadFact::Detached { commit } => (None, commit),
            _ => return Err(failure("worktree-unborn-refused")),
        };
        #[cfg(unix)]
        let creation_identity = format!(
            "{}@{}",
            admin_identity(path)?,
            admin_identity(target.git_dir())?
        );
        #[cfg(not(unix))]
        let creation_identity = "unavailable-on-this-platform".into();
        Ok(WorktreeHandle {
            creation_identity,
            path: path.into(),
            git_dir: target.git_dir,
            branch,
            tip,
        })
    }
    fn worktree_clean(&self, repo: &RepoHandle, path: &Path) -> Result<()> {
        let target = match self.resolve_repo(path, repo.trusted_main_root())? {
            ResolveRepo::Repository(r) => r,
            _ => return Err(recovery("worktree-registration-missing")),
        };
        if !missing(&path.join(".fgos"))? {
            let tracked = self.checked(
                &target,
                &["ls-files", "-v", "-z", "--", ".fgos"],
                Policy::Inspect,
            )?;
            if tracked.is_empty() {
                return Err(failure("worktree-worker-state-preserved"));
            }
            for entry in tracked.split(|b| *b == 0).filter(|e| !e.is_empty()) {
                if matches!(entry.first(), Some(b'S' | b's'))
                    && !missing(&path.join(byte_path(&entry[2..])?))?
                {
                    return Err(failure("worktree-worker-state-preserved"));
                }
            }
        }
        if !self
            .status(&target, Untracked::All, None, 1)?
            .entries
            .is_empty()
        {
            return Err(failure("worktree-dirty-preserved"));
        }
        if !self
            .checked(
                &target,
                &[
                    "ls-files",
                    "--others",
                    "--directory",
                    "--ignored",
                    "--exclude-standard",
                    "-z",
                ],
                Policy::Inspect,
            )?
            .is_empty()
        {
            return Err(failure("worktree-ignored-bytes-preserved"));
        }
        if !missing(&target.git_dir().join("locked"))? {
            return Err(failure("worktree-user-locked"));
        }
        if !missing(&path.join(".gitmodules"))?
            || self
                .checked(&target, &["ls-files", "--stage"], Policy::Inspect)?
                .split(|b| *b == b'\n')
                .any(|line| line.starts_with(b"160000 "))
        {
            return Err(failure("worktree-submodules-preserved"));
        }
        for name in [
            "MERGE_HEAD",
            "CHERRY_PICK_HEAD",
            "REVERT_HEAD",
            "rebase-merge",
            "rebase-apply",
            "BISECT_START",
            "index.lock",
        ] {
            if !missing(&target.git_dir().join(name))? {
                return Err(recovery("worktree-state-uncertain"));
            }
        }
        Ok(())
    }
    fn worktree_custody(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        path: &Path,
    ) -> Result<()> {
        #[cfg(unix)]
        {
            let lock = crate::refs::custody_lock_path(repo, path)?;
            if let Some(held) = scope.handle("dispatch-cwd") {
                if held.path() == lock {
                    scope.validate().map_err(failure)?;
                    return Ok(());
                }
            }
            if !missing(&lock)? {
                match fgos_holder_lock::probe(&fgos_holder_lock::Resource::new(
                    "dispatch-cwd",
                    lock,
                ))
                .map_err(failure)?
                {
                    fgos_holder_lock::Probe::Free => (),
                    _ => return Err(failure("worktree-custody-held-or-unknown")),
                }
            }
        }
        #[cfg(not(unix))]
        {
            let _ = (repo, scope, path);
            return Err(failure("git-lockscope-unavailable-windows"));
        }
        Ok(())
    }
    fn worktree_not_live(&self, path: &Path, warned: &mut BTreeSet<u32>) -> Result<()> {
        use fgos_process::facts::{scan, Scan, ScanFilter};
        match scan(&ScanFilter {
            include_self: true,
            ..Default::default()
        }) {
            Scan::Views(rows) => {
                for row in rows {
                    if row.cwd.as_ref().is_some_and(|p| p.starts_with(path)) {
                        return Err(failure("worktree-live-cwd-preserved"));
                    }
                    if row.cwd.is_none()
                        && row.unreadable.iter().any(|s| s.starts_with("cwd:"))
                        && cwd_owner_requires_judgment(row.effective_uid, unsafe {
                            libc::geteuid()
                        })
                    {
                        use fgos_process::facts::{observe, Observed};
                        if !matches!(observe(row.pid), Observed::Absent | Observed::Zombie)
                            && warned.insert(row.pid.0)
                        {
                            #[cfg(target_os = "linux")]
                            let comm = std::fs::read_to_string(format!("/proc/{}/comm", row.pid))
                                .unwrap_or_else(|_| "unknown".into());
                            #[cfg(not(target_os = "linux"))]
                            let comm = row
                                .cmdline
                                .as_ref()
                                .and_then(|args| args.first())
                                .cloned()
                                .unwrap_or_else(|| "unknown".into());
                            eprintln!(
                                "warning: worktree-cwd-unreadable pid={} comm={:?}",
                                row.pid,
                                comm.trim()
                            );
                        }
                    }
                }
            }
            Scan::Unsupported => return Err(recovery("worktree-cwd-unknown")),
        }
        Ok(())
    }
    #[allow(clippy::too_many_arguments)]
    fn begin_worktree<F: wal::FileSystem>(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        wal: &Wal<F>,
        kind: OperationKind,
        writer: &str,
        id: &str,
        old: Tip,
        next: Tip,
    ) -> Result<wal::Chain> {
        if writer.is_empty() {
            return Err(failure("writer-required"));
        }
        let mut resource_set = wal::worktree_resources(&kind).map_err(failure)?;
        let existing = match &kind {
            OperationKind::WorktreeRemove { path, .. } => Some(path.as_ref()),
            OperationKind::WorktreeMove { source, .. } => Some(source.as_ref()),
            _ => None,
        };
        #[cfg(unix)]
        if let Some(path) = existing {
            if !missing(Path::new(path))? {
            let custody = crate::refs::custody_lock_path(repo, Path::new(path))?;
            resource_set.push(format!("worktree:{path}:custody:{}", custody.display()));
            resource_set.sort();
            }
        }
        admission(wal, id, &resource_set)?;
        let request_digest =
            wal::canonical_digest(&(&kind, &old, &next, writer)).map_err(failure)?;
        let binding = wal::canonical_digest(&(wal.repository_identity(), "worktree-admin"))
            .map_err(failure)?;
        let intent = Intent {
            kind,
            request_digest,
            repo_identity: wal.repository_identity().into(),
            resource_set,
            authority_binding: binding.clone(),
            writer_identity: writer.into(),
            object_format: repo.object_format(),
            expected: old,
            next,
        };
        let authority = Authority { scope, binding };
        match wal.begin(id, intent, &authority).map_err(failure)? {
            Begin::Created(chain) => {
                let candidate = match chain.intent().candidate() {
                    Tip::Oid(s) => Oid::parse(s, repo.object_format()).map_err(failure)?,
                    _ => return Err(failure("worktree-candidate-missing")),
                };
                install_pin(
                    self,
                    repo,
                    scope.handle("worktree-admin").expect("acquired"),
                    id,
                    &candidate,
                )?;
                wal.append(&chain, Phase::Prepared).map_err(failure)
            }
            _ => Err(recovery("worktree-operation-already-exists")),
        }
    }
    fn finish_worktree<F: wal::FileSystem>(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        wal: &Wal<F>,
        chain: &wal::Chain,
        completed: bool,
        details: Vec<String>,
    ) -> Result<()> {
        let admin_root = repo.common_dir().join("worktrees");
        if !missing(&admin_root)? {
            fgos_durable_file::sync_directory(&admin_root).map_err(failure)?;
        }
        let terminal = wal
            .append(
                chain,
                Phase::Outcome(Outcome::Worktree { completed, details }),
            )
            .map_err(failure)?;
        release_pin(
            self,
            repo,
            scope.handle("worktree-admin").expect("acquired"),
            wal,
            &terminal,
        )
    }
    /// A caller supplies a full immutable base; provisioning happens after return.
    pub fn create_worktree(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        input: &WorktreeCreate,
        writer: &str,
        id: &str,
    ) -> Result<WorktreeHandle> {
        let scope = self.worktree_scope(repo, held)?;
        // Like commit/sync, cache stamp-validated facts only for this operation.
        // Every child still revalidates topology, config stamps and its borrower.
        let current = self.checkout_repository(repo)?;
        self.create_worktree_locked(&current, &scope, input, writer, id, false)
    }
    /// Detached session allocation owns only its mkdtemp directory on failure.
    #[allow(clippy::too_many_arguments)]
    pub fn create_detached_worktree(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        parent: &Path,
        session_id: &str,
        base: &Oid,
        writer: &str,
        id: &str,
    ) -> Result<WorktreeHandle> {
        let scope = self.worktree_scope(repo, held)?;
        let current = self.checkout_repository(repo)?;
        let repo = &current;
        if !wal::valid_id(session_id) {
            return Err(failure("invalid-session-id"));
        }
        let parent = parent.canonicalize().map_err(failure)?;
        #[cfg(unix)]
        {
            use std::os::unix::ffi::OsStrExt;
            let template = parent.join(format!("{session_id}-XXXXXX"));
            let mut bytes = std::ffi::CString::new(template.as_os_str().as_bytes())
                .map_err(failure)?
                .into_bytes_with_nul();
            if unsafe { libc::mkdtemp(bytes.as_mut_ptr().cast()) }.is_null() {
                return Err(failure(std::io::Error::last_os_error()));
            }
            let path = byte_path(&bytes[..bytes.len() - 1])?;
            let input = WorktreeCreate {
                path: path.clone(),
                branch: None,
                base: base.clone(),
                session_id: Some(session_id.into()),
            };
            let result = self.create_worktree_locked(repo, &scope, &input, writer, id, true);
            if result.is_err() {
                // Never recursively remove: after Git registration every byte
                // belongs to a potentially interrupted checkout.
                let admin = repo
                    .common_dir()
                    .join("worktrees")
                    .join(path.file_name().expect("mkdtemp name"));
                if missing(&admin).unwrap_or(false) {
                    let _ = fs::remove_dir(&path);
                }
            }
            result
        }
        #[cfg(not(unix))]
        {
            let _ = (scope, parent, base, writer, id);
            Err(failure("git-lockscope-unavailable-windows"))
        }
    }
    #[allow(clippy::too_many_arguments)]
    fn create_worktree_locked(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        input: &WorktreeCreate,
        writer: &str,
        id: &str,
        owned_empty: bool,
    ) -> Result<WorktreeHandle> {
        if input.session_id.as_ref().is_some_and(|s| !wal::valid_id(s)) {
            return Err(failure("invalid-session-id"));
        }
        let path = canonical_destination(&input.path)?;
        let wal = Wal::open(repo).map_err(failure)?;
        if let Some(chain) = existing(&wal, id)? {
            let matches = match &chain.intent().kind {
                OperationKind::WorktreeCreate {
                    path: recorded,
                    branch,
                    session_id,
                    ..
                } => {
                    recorded.as_ref() == text(&path)?
                        && *branch == input.branch.as_ref().map(|r| r.as_str().into())
                        && session_id.as_deref() == input.session_id.as_deref()
                }
                _ => false,
            };
            if !matches
                || chain.intent().writer_identity != writer
                || chain.intent().next != Tip::Oid(input.base.as_str().into())
            {
                return Err(failure("operation-id-conflict"));
            }
            if matches!(
                chain.outcome(),
                Some(Outcome::Worktree {
                    completed: false,
                    ..
                })
            ) {
                release_pin(
                    self,
                    repo,
                    scope.handle("worktree-admin").expect("acquired"),
                    &wal,
                    &chain,
                )?;
                return Err(failure("worktree-operation-not-completed"));
            }
            if !matches!(
                chain.outcome(),
                Some(Outcome::Worktree {
                    completed: true,
                    ..
                })
            ) {
                return Err(pending(
                    recovery("worktree-operation-recovery-required"),
                    id,
                ));
            }
            release_pin(
                self,
                repo,
                scope.handle("worktree-admin").expect("acquired"),
                &wal,
                &chain,
            )?;
            let handle = self.worktree_handle(repo, &path)?;
            if handle.tip != input.base
                || handle.branch.as_deref() != input.branch.as_ref().map(|b| b.as_str())
            {
                return Err(recovery("worktree-create-identity-changed"));
            }
            return Ok(handle);
        }
        // One admin-held Git inventory supplies nesting and branch-use facts.
        // Git worktree add checks branch occupancy again at the actual effect.
        let rows = self.worktree_rows(repo)?;
        self.exclude_nested(repo, &path, &rows)?;
        if !missing(&path)?
            && !(owned_empty && fs::read_dir(&path).map_err(failure)?.next().is_none())
        {
            return Err(failure("worktree-destination-exists"));
        }
        if self.checked(
            repo,
            &["cat-file", "-t", input.base.as_str()],
            Policy::Inspect,
        )? != b"commit\n"
        {
            return Err(failure("worktree-base-not-commit"));
        }
        if let Some(branch) = &input.branch {
            if !branch.as_str().starts_with("refs/heads/") {
                return Err(failure("worktree-branch-invalid"));
            }
            for fact in &rows {
                if fact.prunable.is_some() || fact.locked.as_deref() == Some(b"initializing") {
                    return Err(failure("worktree-registration-uncertain"));
                }
                // Reuse Git's inventory for HEAD facts, but retain reciprocal
                // topology and rebase/bisect branch reservations on disk.
                let target = if fact.bare { None } else {
                    match self.resolve_topology(&byte_path(&fact.path)?, repo.trusted_main_root())? {
                        ResolveRepo::Repository(target) => Some(target),
                        _ => return Err(failure("worktree-registration-uncertain")),
                    }
                };
                if crate::refs::branch_in_use(fact, target.as_ref(), branch)? {
                    return Err(failure("branch-in-use"));
                }
            }
            match self.resolve_ref(repo, branch)? {
                RefValue::Absent => (),
                RefValue::Direct(oid) if oid == input.base => (),
                _ => return Err(failure("worktree-branch-tip-stale")),
            }
        }
        let name = path
            .file_name()
            .and_then(|n| n.to_str())
            .ok_or_else(|| failure("worktree-path-not-utf8"))?
            .to_owned();
        if !missing(&repo.common_dir().join("worktrees").join(&name))? {
            return Err(recovery("worktree-admin-name-in-use"));
        }
        let kind = OperationKind::WorktreeCreate {
            path: text(&path)?.into(),
            registration: name.into(),
            branch: input.branch.as_ref().map(|r| r.as_str().into()),
            session_id: input.session_id.clone().map(String::into_boxed_str),
        };
        let chain = self.begin_worktree(
            repo,
            scope,
            &wal,
            kind,
            writer,
            id,
            Tip::Absent,
            Tip::Oid(input.base.as_str().into()),
        )?;
        let attempted = wal
            .append(
                &chain,
                Phase::TargetAttempt {
                    prior_target_attempt: None,
                    expected: chain.intent().expected.clone(),
                    next: chain.intent().next.clone(),
                },
            )
            .map_err(failure)?;
        let result = (|| {
            let mut args = vec!["worktree", "add", "--quiet"];
            let branch;
            let mut checkout = input.base.as_str();
            if let Some(reference) = &input.branch {
                branch = reference.as_str().strip_prefix("refs/heads/").unwrap();
                if matches!(self.resolve_ref(repo, reference)?, RefValue::Absent) {
                    args.extend(["-b", branch]);
                } else {
                    checkout = branch;
                }
            } else {
                args.push("--detach");
            }
            args.extend(["--", text(&path)?, checkout]);
            self.worktree_call(repo, scope, &args)?;
            // The worker index records intentionally absent state files. This
            // makes a stripped checkout clean without teaching cleanup to ignore
            // arbitrary dirty paths. A reappearing .fgos is always preserved.
            let worker_repo = match self.resolve_repo(&path, repo.trusted_main_root())? {
                ResolveRepo::Repository(r) => r,
                _ => return Err(recovery("worktree-registration-missing")),
            };
            let state_paths = self.checked(
                &worker_repo,
                &["ls-files", "-z", "--", ".fgos"],
                Policy::Inspect,
            )?;
            let state_paths = state_paths
                .split(|b| *b == 0)
                .filter(|p| !p.is_empty())
                .map(|p| std::str::from_utf8(p).map_err(failure))
                .collect::<Result<Vec<_>>>()?;
            for batch in state_paths.chunks(64) {
                let mut args = vec!["update-index", "--skip-worktree", "--"];
                args.extend(batch.iter().copied());
                self.worktree_call(&worker_repo, scope, &args)?;
            }
            self.strip_worktree_state(repo, scope, &path)?;
            let handle = self.worktree_handle(repo, &path)?;
            self.finish_worktree(
                repo,
                scope,
                &wal,
                &attempted,
                true,
                vec!["registered-and-stripped".into()],
            )?;
            Ok(handle)
        })();
        result.map_err(|e| self.reconcile_worktree_error(repo, scope, id, e))
    }
    fn strip_worktree_state(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        path: &Path,
    ) -> Result<()> {
        // Never follow a worker .fgos symlink into the shared state.
        let worker_state = path.join(".fgos");
        if !missing(&worker_state)? {
            let metadata = fs::symlink_metadata(&worker_state).map_err(failure)?;
            let strip = if metadata.is_dir() && !metadata.file_type().is_symlink() {
                fs::remove_dir_all(&worker_state)
            } else {
                fs::remove_file(&worker_state)
            };
            if let Err(cause) = strip {
                // Only Git may roll back registered effects, without force.
                let _ = self.worktree_call(repo, scope, &["worktree", "remove", "--", text(path)?]);
                return Err(failure(cause));
            }
        }
        Ok(())
    }
    pub fn remove_worktree(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        path: &Path,
        proof: &WorktreeDelivery,
        writer: &str,
        id: &str,
    ) -> Result<()> {
        self.remove_land_candidate(repo, held, path, proof, writer, id, None)
    }
    #[allow(clippy::too_many_arguments)]
    pub(crate) fn remove_land_candidate(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        path: &Path,
        proof: &WorktreeDelivery,
        writer: &str,
        id: &str,
        discarded_land: Option<&str>,
    ) -> Result<()> {
        let scope = self.worktree_scope(repo, held)?;
        let path = canonical_destination(path)?;
        let wal = Wal::open(repo).map_err(failure)?;
        if let Some(chain) = existing(&wal, id)? {
            let matches = match &chain.intent().kind {
                OperationKind::WorktreeRemove {
                    path: recorded,
                    delivery,
                    ..
                } => {
                    recorded.as_ref() == text(&path)?
                        && delivery.delivered_to == proof.delivered_to.as_str()
                        && delivery.evidence_digest == proof.evidence_digest
                }
                _ => false,
            };
            if !matches
                || chain.intent().writer_identity != writer
                || chain.intent().expected != Tip::Oid(proof.expected_tip.as_str().into())
            {
                return Err(failure("operation-id-conflict"));
            }
            if matches!(
                chain.outcome(),
                Some(Outcome::Worktree {
                    completed: false,
                    ..
                })
            ) {
                release_pin(
                    self,
                    repo,
                    scope.handle("worktree-admin").expect("acquired"),
                    &wal,
                    &chain,
                )?;
                return Err(failure("worktree-operation-not-completed"));
            }
            if !matches!(
                chain.outcome(),
                Some(Outcome::Worktree {
                    completed: true,
                    ..
                })
            ) {
                return Err(pending(
                    recovery("worktree-operation-recovery-required"),
                    id,
                ));
            }
            return release_pin(
                self,
                repo,
                scope.handle("worktree-admin").expect("acquired"),
                &wal,
                &chain,
            );
        }
        let path = path.canonicalize().map_err(failure)?;
        if path.parent().is_none() {
            return Err(failure("worktree-root-refused"));
        }
        let handle = self.worktree_handle(repo, &path)?;
        let mut warned = BTreeSet::new();
        self.worktree_not_live(&path, &mut warned)?;
        self.worktree_custody(repo, &scope, &path)?;
        self.worktree_clean(repo, &path)?;
        let discarded = if let Some(land_id) = discarded_land {
            let land = wal.inspect(land_id).map_err(failure)?;
            matches!(&land.intent().kind, OperationKind::Land(p) if p.candidate.worktree == path && p.candidate.candidate == handle.tip.as_str())
                && land.intent().writer_identity == writer
                && matches!(
                    land.outcome(),
                    Some(Outcome::AbandonedBeforeAttempt | Outcome::Loss { .. })
                )
        } else {
            false
        };
        if proof.evidence_digest.len() != 64
            || !proof.evidence_digest.bytes().all(|b| b.is_ascii_hexdigit())
            || proof.expected_tip != handle.tip
            || !self.ancestry(repo, &handle.tip, &proof.delivered_to)?
        {
            return Err(failure("worktree-delivery-unproven"));
        }
        let reachable = self.checked(
            repo,
            &[
                "for-each-ref",
                "--format=%(refname)",
                &format!("--contains={}", proof.delivered_to.as_str()),
            ],
            Policy::Inspect,
        )?;
        if !discarded
            && !reachable
                .split(|b| *b == b'\n')
                .any(|name| name.starts_with(b"refs/") && !name.starts_with(b"refs/fgos/"))
        {
            return Err(failure("worktree-delivery-unreachable"));
        }
        let registration = text(
            handle
                .git_dir
                .file_name()
                .map(Path::new)
                .ok_or_else(|| failure("worktree-registration-missing"))?,
        )?
        .into();
        let chain = self.begin_worktree(
            repo,
            &scope,
            &wal,
            OperationKind::WorktreeRemove {
                path: text(&path)?.into(),
                registration,
                registration_identity: admin_identity(&handle.git_dir)?.into_boxed_str(),
                delivery: Box::new(wal::WorktreeDeliveryBinding {
                    delivered_to: proof.delivered_to.as_str().into(),
                    evidence_digest: proof.evidence_digest.clone(),
                }),
            },
            writer,
            id,
            Tip::Oid(handle.tip.as_str().into()),
            Tip::Absent,
        )?;
        self.worktree_custody(repo, &scope, &path)?;
        self.worktree_not_live(&path, &mut warned)?;
        let attempted = wal
            .append(
                &chain,
                Phase::TargetAttempt {
                    prior_target_attempt: None,
                    expected: chain.intent().expected.clone(),
                    next: Tip::Absent,
                },
            )
            .map_err(failure)?;
        self.worktree_custody(repo, &scope, &path)?;
        self.worktree_not_live(&path, &mut warned)?;
        self.worktree_call(repo, &scope, &["worktree", "remove", "--", text(&path)?])
            .map_err(|e| self.reconcile_worktree_error(repo, &scope, id, e))?;
        if !missing(&path)? || !missing(&handle.git_dir)? {
            return Err(pending(recovery("worktree-remove-incomplete"), id));
        }
        self.finish_worktree(
            repo,
            &scope,
            &wal,
            &attempted,
            true,
            vec![proof.evidence_digest.clone()],
        )?;
        Ok(())
    }
    #[allow(clippy::too_many_arguments)]
    pub fn relocate_worktree(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        source: &Path,
        destination: &Path,
        expected: &Oid,
        writer: &str,
        id: &str,
    ) -> Result<WorktreeHandle> {
        let scope = self.worktree_scope(repo, held)?;
        let source = canonical_destination(source)?;
        let destination = canonical_destination(destination)?;
        let wal = Wal::open(repo).map_err(failure)?;
        if let Some(chain) = existing(&wal, id)? {
            let matches = match &chain.intent().kind {
                OperationKind::WorktreeMove {
                    source: recorded,
                    destination: recorded_destination,
                    ..
                } => {
                    recorded.as_ref() == text(&source)?
                        && recorded_destination.as_ref() == text(&destination)?
                }
                _ => false,
            };
            if !matches
                || chain.intent().writer_identity != writer
                || chain.intent().expected != Tip::Oid(expected.as_str().into())
            {
                return Err(failure("operation-id-conflict"));
            }
            if matches!(
                chain.outcome(),
                Some(Outcome::Worktree {
                    completed: false,
                    ..
                })
            ) {
                release_pin(
                    self,
                    repo,
                    scope.handle("worktree-admin").expect("acquired"),
                    &wal,
                    &chain,
                )?;
                return Err(failure("worktree-operation-not-completed"));
            }
            if !matches!(
                chain.outcome(),
                Some(Outcome::Worktree {
                    completed: true,
                    ..
                })
            ) {
                return Err(pending(
                    recovery("worktree-operation-recovery-required"),
                    id,
                ));
            }
            release_pin(
                self,
                repo,
                scope.handle("worktree-admin").expect("acquired"),
                &wal,
                &chain,
            )?;
            return self.worktree_handle(repo, &destination);
        }
        let source = source.canonicalize().map_err(failure)?;
        self.exclude_nested(repo, &destination, &self.worktree_rows(repo)?)?;
        if !missing(&destination)? {
            return Err(failure("worktree-destination-exists"));
        }
        let handle = self.worktree_handle(repo, &source)?;
        let mut warned = BTreeSet::new();
        self.worktree_not_live(&source, &mut warned)?;
        self.worktree_custody(repo, &scope, &source)?;
        self.worktree_clean(repo, &source)?;
        if &handle.tip != expected {
            return Err(failure("worktree-tip-stale"));
        }
        let registration = handle
            .git_dir
            .file_name()
            .and_then(|s| s.to_str())
            .ok_or_else(|| failure("worktree-registration-missing"))?
            .into();
        let tip = Tip::Oid(expected.as_str().into());
        let chain = self.begin_worktree(
            repo,
            &scope,
            &wal,
            OperationKind::WorktreeMove {
                source: text(&source)?.into(),
                destination: text(&destination)?.into(),
                registration,
                registration_identity: admin_identity(&handle.git_dir)?.into_boxed_str(),
            },
            writer,
            id,
            tip.clone(),
            tip.clone(),
        )?;
        self.worktree_custody(repo, &scope, &source)?;
        self.worktree_not_live(&source, &mut warned)?;
        let attempted = wal
            .append(
                &chain,
                Phase::TargetAttempt {
                    prior_target_attempt: None,
                    expected: tip.clone(),
                    next: tip,
                },
            )
            .map_err(failure)?;
        self.worktree_custody(repo, &scope, &source)?;
        self.worktree_not_live(&source, &mut warned)?;
        self.worktree_call(
            repo,
            &scope,
            &[
                "worktree",
                "move",
                "--",
                text(&source)?,
                text(&destination)?,
            ],
        )
        .map_err(|e| self.reconcile_worktree_error(repo, &scope, id, e))?;
        let handle = self
            .worktree_handle(repo, &destination)
            .map_err(|e| pending(e, id))?;
        self.finish_worktree(
            repo,
            &scope,
            &wal,
            &attempted,
            true,
            vec!["relocated".into()],
        )?;
        Ok(handle)
    }
    /// Includes raw admin directories omitted by worktree list after a partial prune.
    pub fn inspect_worktree_orphans(&self, repo: &RepoHandle) -> Result<Vec<WorktreeIssue>> {
        let mut issues = vec![];
        let directory = repo.common_dir().join("worktrees");
        if missing(&directory)? {
            return Ok(issues);
        }
        #[cfg(unix)]
        admin_identity(&directory)?;
        #[cfg(not(unix))]
        if fs::symlink_metadata(&directory)
            .map_err(failure)?
            .file_type()
            .is_symlink()
        {
            return Err(recovery("worktree-admin-untrusted"));
        }
        for entry in fs::read_dir(&directory).map_err(failure)? {
            let entry = entry.map_err(failure)?;
            let name = entry.file_name().to_string_lossy().into_owned();
            if !entry.file_type().map_err(failure)?.is_dir() {
                issues.push(WorktreeIssue {
                    path: entry.path(),
                    registration: name,
                    reason: "partial-admin-entry".into(),
                });
                continue;
            }
            let admin = entry.path();
            let backlink = fs::read_to_string(admin.join("gitdir"));
            let path = backlink
                .as_ref()
                .ok()
                .map(|s| {
                    PathBuf::from(s.trim_end_matches('\n'))
                        .parent()
                        .unwrap_or(Path::new("/"))
                        .to_owned()
                })
                .unwrap_or_default();
            let reason = if backlink.is_err() {
                Some("partial-admin-entry")
            } else if missing(&path)? {
                Some("missing-worktree-preserved")
            } else if !missing(&admin.join("locked"))? {
                Some(if lock_names_live_process(&admin.join("locked")) {
                    "locked-by-live-process"
                } else {
                    "locked-registration"
                })
            } else {
                match self.worktree_handle(repo, &path) {
                    Err(_) => Some("registration-backlink-mismatch"),
                    Ok(_) => {
                        if self.worktree_clean(repo, &path).is_err() {
                            Some("dirty-or-stale-checkout-preserved")
                        } else {
                            None
                        }
                    }
                }
            };
            if let Some(reason) = reason {
                issues.push(WorktreeIssue {
                    path,
                    registration: name,
                    reason: reason.into(),
                });
            }
        }
        Ok(issues)
    }
    /// Inspect an absent checkout's registration and require a successful owned
    /// create record. Record the exact removal before touching admin evidence.
    pub fn prune_missing_worktree(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        path: &Path,
        writer: &str,
        id: &str,
    ) -> Result<()> {
        let scope = self.worktree_scope(repo, held)?;
        let path = canonical_destination(path)?;
        if !missing(&path)? {
            return Err(failure("worktree-prune-path-present"));
        }
        let wal = Wal::open(repo).map_err(failure)?;
        if existing(&wal, id)?.is_some() {
            return self.repair_worktree_locked(repo, &scope, id);
        }
        let issues = self.inspect_worktree_orphans(repo)?;
        let issue = issues.iter().find(|issue| issue.path == path
            && issue.reason == "missing-worktree-preserved")
            .ok_or_else(|| failure("worktree-prune-registration-unproven"))?;
        let admin = repo.common_dir().join("worktrees").join(&issue.registration);
        let identity = admin_identity(&admin)?;
        if !missing(&admin.join("locked"))? {
            return Err(failure("worktree-user-locked"));
        }
        let common = fs::read_to_string(admin.join("commondir")).map_err(failure)?;
        if admin.join(common.trim_end()).canonicalize().map_err(failure)? != repo.common_dir() {
            return Err(recovery("worktree-admin-backlink-changed"));
        }
        let scan = wal.scan(100_000).map_err(failure)?;
        if !scan.complete || scan.entries.iter().any(|entry| entry.error.is_some()) {
            return Err(recovery("git-wal-unreadable"));
        }
        let mut owned = None;
        for entry in scan.entries {
            let Some(chain) = existing(&wal, &entry.operation_id)? else { continue };
            if matches!(&chain.intent().kind, OperationKind::WorktreeCreate {
                path: created, registration, ..
            } if created.as_ref() == text(&path)? && registration.as_ref() == issue.registration)
                && matches!(chain.outcome(), Some(Outcome::Worktree { completed: true, .. })) {
                owned = Some(entry.operation_id);
                break;
            }
        }
        let owned = owned.ok_or_else(|| failure("worktree-prune-ownership-unproven"))?;
        // Resolve the registered admin HEAD, never a vanished worker gitfile.
        let head = fs::read_to_string(admin.join("HEAD")).map_err(failure)?;
        let tip = if let Some(name) = head.trim_end().strip_prefix("ref: ") {
            match self.resolve_ref(repo, &RefName::parse(name).map_err(failure)?)? {
                RefValue::Direct(tip) => tip,
                _ => return Err(failure("worktree-prune-tip-unproven")),
            }
        } else {
            Oid::parse(head.trim_end(), repo.object_format()).map_err(failure)?
        };
        // A vanished detached checkout can still be the only root of valuable
        // history. Preserve its registration unless a non-operation ref owns it.
        let reachable = self.checked(repo, &["for-each-ref", "--format=%(refname)",
            &format!("--contains={}", tip.as_str())], Policy::Inspect)?;
        if !reachable.split(|b| *b == b'\n')
            .any(|name| name.starts_with(b"refs/") && !name.starts_with(b"refs/fgos/")) {
            return Err(failure("worktree-prune-tip-unreachable: registration preserved"));
        }
        let evidence = wal::canonical_digest(&(owned, text(&path)?, &identity)).map_err(failure)?;
        let chain = self.begin_worktree(repo, &scope, &wal,
            OperationKind::WorktreeRemove {
                path: text(&path)?.into(), registration: issue.registration.clone().into(),
                registration_identity: identity.clone().into(),
                delivery: Box::new(wal::WorktreeDeliveryBinding {
                    delivered_to: tip.as_str().into(), evidence_digest: evidence.clone(),
                }),
            }, writer, id, Tip::Oid(tip.as_str().into()), Tip::Absent)?;
        let attempted = wal.append(&chain, Phase::TargetAttempt {
            prior_target_attempt: None, expected: chain.intent().expected.clone(), next: Tip::Absent,
        }).map_err(failure)?;
        self.prune_owned_registration(&scope, &admin, text(&path)?, &identity)
            .map_err(|error| pending(error, id))?;
        self.finish_worktree(repo, &scope, &wal, &attempted, true,
            vec![format!("missing checkout; owned create evidence: {evidence}")])
    }
    /// Prune is operation-specific; Git's global prune could destroy unrelated evidence.
    pub fn prune_worktree(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        id: &str,
    ) -> Result<()> {
        if held.iter().any(|h| h.as_ref().name() == "dispatch-cwd") {
            return Err(failure("worktree-prune-custody-not-allowed"));
        }
        let wal = Wal::open(repo).map_err(failure)?;
        if !matches!(
            wal.inspect(id).map_err(failure)?.intent().kind,
            OperationKind::WorktreeRemove { .. }
        ) {
            return Err(failure("worktree-prune-remove-evidence-required"));
        }
        self.repair_worktree_registration(repo, held, id)
    }
    fn prune_owned_registration(
        &self,
        scope: &LockScope<'_>,
        admin: &Path,
        removed_path: &str,
        identity: &str,
    ) -> Result<()> {
        if admin_identity(admin)? != identity {
            return Err(recovery("worktree-admin-identity-changed"));
        }
        match fs::read_to_string(admin.join("gitdir")) {
            Ok(backlink) if backlink.trim_end() == format!("{removed_path}/.git") => (),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => (),
            _ => return Err(recovery("worktree-admin-backlink-changed")),
        }
        // Validate the entire remainder before removing a single file. Unknown
        // files, symlinks, subdirectories and native locks are preserved.
        let mut files = vec![];
        let mut directories = vec![];
        for entry in fs::read_dir(admin).map_err(failure)? {
            let entry = entry.map_err(failure)?;
            let name = entry.file_name();
            let kind = entry.file_type().map_err(failure)?;
            if kind.is_file()
                && ["gitdir", "commondir", "HEAD", "index", "ORIG_HEAD", "COMMIT_EDITMSG"]
                    .iter()
                    .any(|s| name == *s)
            {
                files.push(entry.path());
            } else if kind.is_dir() && (name == "logs" || name == "refs") {
                for child in fs::read_dir(entry.path()).map_err(failure)? {
                    let child = child.map_err(failure)?;
                    if name != "logs"
                        || child.file_name() != "HEAD"
                        || !child.file_type().map_err(failure)?.is_file()
                    {
                        return Err(recovery("worktree-admin-residue-uncertain"));
                    }
                    files.push(child.path());
                }
                directories.push(entry.path());
            } else {
                return Err(recovery("worktree-admin-residue-uncertain"));
            }
        }
        scope.validate().map_err(failure)?;
        if admin_identity(admin)? != identity || !missing(Path::new(removed_path))? {
            return Err(recovery("worktree-admin-identity-changed"));
        }
        for file in files {
            fs::remove_file(file).map_err(failure)?;
        }
        for directory in directories {
            fs::remove_dir(directory).map_err(failure)?;
        }
        fs::remove_dir(admin).map_err(failure)?;
        fgos_durable_file::sync_directory(admin.parent().expect("admin parent")).map_err(failure)
    }
    fn reconcile_worktree_error(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        id: &str,
        mut error: OperationError,
    ) -> OperationError {
        if self.repair_worktree_locked(repo, scope, id).is_ok() {
            error.operation_id = Some(id.into());
            error
        } else {
            pending(error, id)
        }
    }
    fn unchanged_registration(
        &self,
        repo: &RepoHandle,
        path: &Path,
        admin: &Path,
        identity: &str,
        chain: &wal::Chain,
    ) -> Result<bool> {
        if missing(path)? || missing(admin)? {
            return Ok(false);
        }
        if admin_identity(admin)? != identity {
            return Err(recovery("worktree-admin-identity-changed"));
        }
        let handle = self.worktree_handle(repo, path)?;
        Ok(handle.git_dir == admin
            && Tip::Oid(handle.tip.as_str().into()) == chain.intent().expected
            && fs::read_to_string(admin.join("gitdir"))
                .map_err(failure)?
                .trim_end()
                == format!("{}/.git", text(path)?))
    }
    /// Reconciliation never repeats a TargetAttempt's move/destroy/create.
    pub fn repair_worktree_registration(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        id: &str,
    ) -> Result<()> {
        if held.iter().any(|h| h.as_ref().name() == "dispatch-cwd") {
            return Err(failure("worktree-repair-custody-not-allowed"));
        }
        let mut scope = self.worktree_scope(repo, held)?;
        crate::recovery::leaf(&mut scope, repo)?;
        self.repair_worktree_locked(repo, &scope, id)
    }
    fn repair_worktree_locked(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        id: &str,
    ) -> Result<()> {
        let wal = Wal::open(repo).map_err(failure)?;
        let chain = wal.inspect(id).map_err(failure)?;
        let kind = &chain.intent().kind;
        wal::worktree_resources(kind).map_err(failure)?;
        if chain.outcome().is_some() {
            return release_pin(
                self,
                repo,
                scope.handle("worktree-admin").expect("acquired"),
                &wal,
                &chain,
            );
        }
        if !chain
            .records()
            .iter()
            .any(|r| matches!(r.phase, Phase::TargetAttempt { .. }))
        {
            let terminal = wal
                .append(&chain, Phase::Outcome(Outcome::AbandonedBeforeAttempt))
                .map_err(failure)?;
            return release_pin(
                self,
                repo,
                scope.handle("worktree-admin").expect("acquired"),
                &wal,
                &terminal,
            );
        }
        let admin = repo
            .common_dir()
            .join("worktrees")
            .join(registration(kind)?);
        // Record-only reconciliation: never repeat a possibly attempted effect.
        let unchanged = match kind {
            OperationKind::WorktreeCreate { path, .. } => {
                missing(&admin)?
                    && (missing(Path::new(&**path))?
                        || (admin_identity(Path::new(&**path)).is_ok()
                            && fs::read_dir(&**path).map_err(failure)?.next().is_none()))
            }
            OperationKind::WorktreeMove {
                source,
                destination,
                registration_identity,
                ..
            } => {
                missing(Path::new(&**destination))?
                    && self.unchanged_registration(
                        repo,
                        Path::new(&**source),
                        &admin,
                        registration_identity,
                        &chain,
                    )?
            }
            OperationKind::WorktreeRemove {
                path,
                registration_identity,
                ..
            } => self.unchanged_registration(
                repo,
                Path::new(&**path),
                &admin,
                registration_identity,
                &chain,
            )?,
            _ => false,
        };
        if unchanged {
            return self.finish_worktree(
                repo,
                scope,
                &wal,
                &chain,
                false,
                vec![format!(
                    "effect-not-observed: {:?}; registration/backlink/path/tip checked",
                    kind
                )],
            );
        }
        match kind {
            OperationKind::WorktreeMove {
                source,
                destination,
                registration_identity,
                ..
            } => {
                if admin_identity(&admin)? != registration_identity.as_ref() {
                    return Err(recovery("worktree-admin-identity-changed"));
                }
                if !missing(Path::new(&**source))? || missing(Path::new(&**destination))? {
                    return Err(recovery("worktree-move-outcome-unknown"));
                }
                // Destination gitfile must already point to this operation's admin.
                let gitfile =
                    fs::read_to_string(Path::new(&**destination).join(".git")).map_err(failure)?;
                if gitfile.trim_end() != format!("gitdir: {}", text(&admin)?) {
                    return Err(recovery("worktree-destination-identity-unknown"));
                }
                self.worktree_call(repo, scope, &["worktree", "repair", "--", destination])?;
                let handle = self.worktree_handle(repo, Path::new(&**destination))?;
                if handle.git_dir != admin
                    || Tip::Oid(handle.tip.as_str().into()) != chain.intent().next
                {
                    return Err(recovery("worktree-move-identity-changed"));
                }
            }
            OperationKind::WorktreeCreate { path, branch, .. } => {
                let handle = self.worktree_handle(repo, Path::new(&**path))?;
                if handle.git_dir != admin
                    || handle.branch.as_deref() != branch.as_deref()
                    || Tip::Oid(handle.tip.as_str().into()) != chain.intent().next
                {
                    return Err(recovery("worktree-create-identity-changed"));
                }
                let lock = admin.join("locked");
                if !missing(&lock)? {
                    if fs::read_to_string(&lock).map_err(failure)?.trim() != "initializing" {
                        return Err(recovery("worktree-lock-not-operation-owned"));
                    }
                    self.worktree_call(repo, scope, &["worktree", "unlock", "--", path])?;
                }
                if !missing(&Path::new(&**path).join(".fgos"))? {
                    return Err(recovery("worktree-create-strip-incomplete"));
                }
                // A killed checkout may be partial. Preserve it for inspection.
                self.worktree_clean(repo, Path::new(&**path))?;
            }
            OperationKind::WorktreeRemove {
                path,
                registration_identity,
                ..
            } => {
                if !missing(Path::new(&**path))? {
                    return Err(recovery("worktree-remove-outcome-unknown"));
                }
                if !missing(&admin)? {
                    self.prune_owned_registration(scope, &admin, path, registration_identity)?;
                }
            }
            _ => unreachable!(),
        }
        self.finish_worktree(
            repo,
            scope,
            &wal,
            &chain,
            true,
            vec!["effect-observed-only".into()],
        )?;
        Ok(())
    }
}
fn byte_path(bytes: &[u8]) -> Result<PathBuf> {
    #[cfg(unix)]
    {
        use std::os::unix::ffi::OsStrExt;
        Ok(Path::new(std::ffi::OsStr::from_bytes(bytes)).into())
    }
    #[cfg(not(unix))]
    {
        Ok(PathBuf::from(std::str::from_utf8(bytes).map_err(failure)?))
    }
}

fn admin_identity(path: &Path) -> Result<String> {
    let m = fs::symlink_metadata(path).map_err(failure)?;
    if !m.is_dir() || m.file_type().is_symlink() {
        return Err(recovery("worktree-admin-untrusted"));
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        if m.uid() != unsafe { libc::geteuid() } {
            return Err(recovery("worktree-admin-owner-unknown"));
        }
        Ok(format!("{}:{}", m.dev(), m.ino()))
    }
    #[cfg(not(unix))]
    {
        Err(failure("git-lockscope-unavailable-windows"))
    }
}

fn existing<F: wal::FileSystem>(wal: &Wal<F>, id: &str) -> Result<Option<wal::Chain>> {
    match wal.inspect(id) {
        Ok(chain) => Ok(Some(chain)),
        Err(wal::WalError::Io(e)) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(recovery(e)),
    }
}

fn cwd_owner_requires_judgment(owner: Option<u32>, current: u32) -> bool {
    owner.is_none_or(|uid| uid == current)
}
#[cfg(test)]
mod review_tests {
    use super::*;
    #[test]
    fn unreadable_foreign_cwd_is_outside_scope_but_unknown_and_own_are_not() {
        assert!(!cwd_owner_requires_judgment(Some(0), 1000));
        assert!(!cwd_owner_requires_judgment(Some(1001), 1000));
        assert!(cwd_owner_requires_judgment(Some(1000), 1000));
        assert!(cwd_owner_requires_judgment(None, 1000));
    }
}

#[cfg(all(test, target_os = "linux"))]
mod strip_tests {
    use super::*;
    use std::{os::unix::fs::PermissionsExt, process::Command};
    #[test]
    fn failed_strip_keeps_original_error_and_nonforce_rollback_preserves_bytes() {
        let root = std::env::temp_dir().join(format!("fgos-strip-review-{}", std::process::id()));
        fs::create_dir(&root).unwrap();
        fs::set_permissions(&root, fs::Permissions::from_mode(0o700)).unwrap();
        let git = |args: &[&str]| {
            let output = Command::new("git")
                .arg("-C")
                .arg(&root)
                .args(args)
                .output()
                .unwrap();
            assert!(
                output.status.success(),
                "{}",
                String::from_utf8_lossy(&output.stderr)
            );
        };
        git(&["init", "-q", "--initial-branch=trunk"]);
        git(&[
            "-c",
            "user.name=Fixture",
            "-c",
            "user.email=fixture@example.invalid",
            "commit",
            "--allow-empty",
            "-qm",
            "fixture",
        ]);
        let worker = root.join("worker");
        git(&["worktree", "add", "--detach", worker.to_str().unwrap()]);
        let state = worker.join(".fgos");
        fs::create_dir(&state).unwrap();
        fs::write(state.join("valuable"), [0, 255, 1]).unwrap();
        fs::set_permissions(&state, fs::Permissions::from_mode(0o500)).unwrap();
        fs::create_dir_all(root.join(".fgos/locks/activation.lock")).unwrap();
        fs::write(
            root.join(".fgos/locks/activation.lock/TOMBSTONE"),
            r#"{"lock":"activation","by":"fixture","at":"fixture"}"#,
        )
        .unwrap();
        let driver = GitDriver::new(&root).unwrap();
        let repo = match driver.resolve_repo(&root, &root).unwrap() {
            ResolveRepo::Repository(r) => r,
            _ => panic!(),
        };
        let scope = driver.worktree_scope(&repo, vec![]).unwrap();
        let error = driver
            .strip_worktree_state(&repo, &scope, &worker)
            .unwrap_err();
        assert!(error.cause.contains("Permission denied"), "{error:?}");
        assert_eq!(fs::read(state.join("valuable")).unwrap(), [0, 255, 1]);
        assert!(root.join(".git/worktrees/worker/gitdir").exists());
        drop(scope);
        fs::set_permissions(&state, fs::Permissions::from_mode(0o700)).unwrap();
        fs::remove_dir_all(root).unwrap();
    }
}
