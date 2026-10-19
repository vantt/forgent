//! Worktree administration. One rank-40 hold spans inspection and mutation.
use crate::{
    driver::Policy,
    refs::{admission, failure, install_pin, pending, recovery, release_pin, Authority},
    wal::{self, Begin, Intent, OperationKind, Outcome, Phase, Tip, Wal},
    *,
};
use fgos_holder_lock::{BorrowedHandle, LockScope, Wait};
use serde::Serialize;
use std::{
    collections::BTreeMap,
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
fn resources(kind: &OperationKind) -> Result<Vec<String>> {
    let mut paths = match kind {
        OperationKind::WorktreeCreate { path, .. } | OperationKind::WorktreeRemove { path, .. } => {
            vec![format!("worktree:{path}")]
        }
        OperationKind::WorktreeMove {
            source,
            destination,
            ..
        } => vec![
            format!("worktree:{source}"),
            format!("worktree:{destination}"),
        ],
        _ => return Err(failure("not-a-worktree-operation")),
    };
    if let OperationKind::WorktreeCreate {
        branch: Some(branch),
        ..
    } = kind
    {
        paths.push(branch.to_string());
    }
    paths.sort();
    paths.dedup();
    Ok(paths)
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
        require_lock_scope_platform()?;
        let mut scope = LockScope::seeded(held).map_err(failure)?;
        scope
            .assert_can_acquire("worktree-admin")
            .map_err(failure)?;
        scope
            .acquire(
                "worktree-admin",
                &BTreeMap::from([(
                    "fgosDir".into(),
                    repo.trusted_main_root()
                        .join(".fgos")
                        .to_string_lossy()
                        .into_owned(),
                )]),
                Wait::Ms(5000),
            )
            .map_err(failure)?;
        Ok(scope)
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
    fn exclude_nested(&self, repo: &RepoHandle, path: &Path) -> Result<()> {
        for row in self.worktree_rows(repo)? {
            let registered = byte_path(&row.path)?;
            let registered = if missing(&registered)? {
                registered
            } else {
                registered.canonicalize().map_err(failure)?
            };
            if path.starts_with(&registered) || registered.starts_with(path) {
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
            return Err(failure("worktree-worker-state-preserved"));
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
            use std::os::unix::fs::MetadataExt;
            let m = fs::metadata(path).map_err(failure)?;
            let lock = repo.trusted_main_root().join(format!(
                ".fgos/locks/dispatch-cwd--{}-{}.lock",
                m.dev(),
                m.ino()
            ));
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
    fn worktree_not_live(&self, path: &Path) -> Result<()> {
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
                    if row.cwd.is_none() && row.unreadable.iter().any(|s| s.starts_with("cwd:")) {
                        use fgos_process::facts::{observe, Observed};
                        if !matches!(observe(row.pid), Observed::Absent | Observed::Zombie) {
                            return Err(recovery("worktree-cwd-unknown"));
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
        let resource_set = resources(&kind)?;
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
        details: Vec<String>,
    ) -> Result<()> {
        let admin_root = repo.common_dir().join("worktrees");
        if !missing(&admin_root)? {
            fgos_durable_file::sync_directory(&admin_root).map_err(failure)?;
        }
        let terminal = wal
            .append(
                chain,
                Phase::Outcome(Outcome::Worktree {
                    completed: true,
                    details,
                }),
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
        self.create_worktree_locked(repo, &scope, input, writer, id, false)
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
        if session_id.is_empty()
            || !session_id
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
        {
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
        if input.session_id.as_ref().is_some_and(|s| {
            s.is_empty()
                || !s
                    .bytes()
                    .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
        }) {
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
        self.exclude_nested(repo, &path)?;
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
            if self
                .worktree_rows(repo)?
                .iter()
                .any(|r| r.branch.as_ref() == Some(branch))
            {
                return Err(failure("branch-in-use"));
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
        let wal = Wal::open(repo).map_err(failure)?;
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
                    // A failed strip is normally dirty. Git's guarded non-force
                    // remove decides whether our own registered effects are safe.
                    let _ = self.worktree_call(
                        repo,
                        scope,
                        &["worktree", "remove", "--", text(&path)?],
                    );
                    return Err(failure(cause));
                }
            }
            let handle = self.worktree_handle(repo, &path)?;
            self.finish_worktree(
                repo,
                scope,
                &wal,
                &attempted,
                vec!["registered-and-stripped".into()],
            )?;
            Ok(handle)
        })();
        result.map_err(|e| pending(e, id))
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
        self.worktree_not_live(&path)?;
        self.worktree_custody(repo, &scope, &path)?;
        self.worktree_clean(repo, &path)?;
        if proof.evidence_digest.len() != 64
            || !proof.evidence_digest.bytes().all(|b| b.is_ascii_hexdigit())
            || proof.expected_tip != handle.tip
            || !self.ancestry(repo, &handle.tip, &proof.delivered_to)?
        {
            return Err(failure("worktree-delivery-unproven"));
        }
        let registration = text(
            handle
                .git_dir
                .file_name()
                .map(Path::new)
                .ok_or_else(|| failure("worktree-registration-missing"))?,
        )?
        .into();
        let wal = Wal::open(repo).map_err(failure)?;
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
        self.worktree_call(repo, &scope, &["worktree", "remove", "--", text(&path)?])
            .map_err(|e| pending(e, id))?;
        if !missing(&path)? || !missing(&handle.git_dir)? {
            return Err(pending(recovery("worktree-remove-incomplete"), id));
        }
        self.finish_worktree(
            repo,
            &scope,
            &wal,
            &attempted,
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
        self.exclude_nested(repo, &destination)?;
        if !missing(&destination)? {
            return Err(failure("worktree-destination-exists"));
        }
        let handle = self.worktree_handle(repo, &source)?;
        self.worktree_not_live(&source)?;
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
        let wal = Wal::open(repo).map_err(failure)?;
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
        .map_err(|e| pending(e, id))?;
        let handle = self
            .worktree_handle(repo, &destination)
            .map_err(|e| pending(e, id))?;
        self.finish_worktree(repo, &scope, &wal, &attempted, vec!["relocated".into()])?;
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
                return Err(recovery("worktree-admin-untrusted"));
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
                Some("locked-registration")
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
        _repo: &RepoHandle,
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
                && ["gitdir", "commondir", "HEAD", "index", "ORIG_HEAD"]
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
        let scope = self.worktree_scope(repo, held)?;
        let wal = Wal::open(repo).map_err(failure)?;
        let chain = wal.inspect(id).map_err(failure)?;
        let kind = &chain.intent().kind;
        resources(kind)?;
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
                self.worktree_call(repo, &scope, &["worktree", "repair", "--", destination])?;
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
                    self.worktree_call(repo, &scope, &["worktree", "unlock", "--", path])?;
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
                    self.prune_owned_registration(
                        repo,
                        &scope,
                        &admin,
                        path,
                        registration_identity,
                    )?;
                }
            }
            _ => unreachable!(),
        }
        self.finish_worktree(
            repo,
            &scope,
            &wal,
            &chain,
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
