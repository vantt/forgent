//! Land transaction. The consumer owns verification and business settlement.
use crate::{
    refs::Authority,
    scoped_commit::{checkout_resources, is_store_path, paths, require_no_native_state},
    wal::{self, Begin, Intent, OperationKind, Outcome, Phase, Tip, Wal},
    *,
};
use fgos_holder_lock::{BorrowedHandle, LockScope, Wait};
use serde::{Deserialize, Serialize};
use std::{collections::BTreeMap, path::PathBuf};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct LandRequest {
    pub source: String,
    /// Omitted target pins the destination under slot 20. Persisted intents always contain an OID.
    #[serde(default)]
    pub target: String,
    pub destination: String,
    pub message: String,
    #[serde(default)]
    pub squash: bool,
    /// Absent means every non-store path; an explicit empty set still includes the commit diff.
    pub footprint: Option<Vec<String>>,
    pub subtree: Option<String>,
    #[serde(default)]
    pub files: Vec<LandFile>,
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct LandFile {
    pub path: String,
    pub bytes: Option<Vec<u8>>,
}
/// Consumer-declared paths are literal, relative and outside `.git`; `kind`
/// names the refusal (`invalid-land-file`, `invalid-sync-file`).
pub(crate) fn validate_declared_files(files: &[LandFile], kind: &str) -> Result<()> {
    for file in files {
        let path = std::path::Path::new(&file.path);
        if path.is_absolute()
            || file.path.is_empty()
            || path
                .components()
                .any(|c| !matches!(c, std::path::Component::Normal(_)))
            || file.path.split('/').any(|s| s == ".git")
        {
            return Err(failure(format!("invalid-{kind}-file")));
        }
    }
    Ok(())
}
/// Write one declared file's literal bytes under `root`, or remove it when it
/// declares an absence. Git never interprets them. Symlink ancestors and
/// targets are refused rather than written through.
pub(crate) fn write_declared_file(root: &std::path::Path, file: &LandFile, kind: &str) -> Result<()> {
    let path = std::path::Path::new(&file.path);
    let full = root.join(path);
    let mut at = root.to_path_buf();
    for part in path.components() {
        at.push(part);
        if std::fs::symlink_metadata(&at).is_ok_and(|m| m.file_type().is_symlink()) {
            return Err(failure(format!("{kind}-file-symlink")));
        }
    }
    if let Some(bytes) = &file.bytes {
        if let Some(p) = full.parent() {
            std::fs::create_dir_all(p).map_err(failure)?;
        }
        std::fs::write(full, bytes).map_err(failure)
    } else {
        match std::fs::remove_file(full) {
            Ok(()) => Ok(()),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
            Err(e) => Err(failure(e)),
        }
    }
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct LandEvidence {
    pub source: String,
    pub target: String,
    pub candidate: String,
    pub tree_digest: String,
    /// Opaque consumer evidence identifier/digest. Git never interprets this as test success.
    pub evidence_digest: String,
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct LandCandidate {
    pub worktree: PathBuf,
    pub source: String,
    pub target: String,
    pub candidate: String,
    pub tree: String,
    pub tree_digest: String,
}
/// Keeping this value alive keeps the target's rank-20 slot, but never 40/50.
/// Dropping it releases only authority; candidate and WAL remain recovery evidence.
pub struct LandSession {
    slot: LockScope<'static>,
    candidate: Option<LandCandidate>,
    receipt: Option<Receipt>,
    request: LandRequest,
    id: String,
}
impl LandSession {
    pub fn candidate(&self) -> Option<&LandCandidate> {
        self.candidate.as_ref()
    }
    pub fn receipt(&self) -> Option<&Receipt> {
        self.receipt.as_ref()
    }
}
fn params(repo: &RepoHandle) -> BTreeMap<String, String> {
    BTreeMap::from([(
        "fgosDir".into(),
        repo.trusted_main_root()
            .join(".fgos")
            .to_string_lossy()
            .into(),
    )])
}
fn slot_key(reference: &str) -> String {
    // Same encodeURIComponent key as the existing repo-locks door.
    reference
        .bytes()
        .map(|b| {
            if b.is_ascii_alphanumeric() || b"-_.!~*'()".contains(&b) {
                (b as char).to_string()
            } else {
                format!("%{b:02X}")
            }
        })
        .collect()
}
fn held<'a>(scope: &'a LockScope<'_>) -> Result<Vec<BorrowedHandle<'a>>> {
    Ok(vec![BorrowedHandle::new(
        scope
            .handle("merge-slot")
            .ok_or_else(|| failure("land-slot-required"))?,
    )
    .map_err(failure)?])
}
impl GitDriver {
    fn land_call(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        args: &[&str],
        input: &[u8],
    ) -> Result<crate::driver::Output> {
        scope.validate().map_err(failure)?;
        let h = scope
            .handle("main-checkout")
            .or_else(|| scope.handle("worktree-admin"))
            .or_else(|| scope.handle("merge-slot"))
            .ok_or_else(|| failure("land-authority-required"))?;
        self.checkout_call_borrowed(repo, h, args, input, false)
    }
    fn land_text(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        args: &[&str],
        input: &[u8],
    ) -> Result<String> {
        let out = self.land_call(repo, scope, args, input)?;
        if !out.success {
            return Err(out.error("land-git-failed"));
        }
        Ok(String::from_utf8(out.stdout)
            .map_err(failure)?
            .trim_end_matches('\n')
            .into())
    }
    fn land_target_checkout(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        destination: &RefName,
    ) -> Result<bool> {
        let mut main = false;
        for (fact, checkout) in self.checkouts(repo)? {
            if crate::refs::branch_in_use(&fact, checkout.as_ref(), destination)? {
                let r = checkout
                    .as_ref()
                    .ok_or_else(|| failure("foreign-target-checkout"))?;
                if r.work_tree.as_deref() != Some(repo.trusted_main_root())
                    || fact.branch.as_ref() != Some(destination)
                {
                    return Err(failure("foreign-target-checkout"));
                }
                main = true;
            }
        }
        if main {
            self.land_native_state(repo, scope)?;
        }
        Ok(main)
    }
    fn land_native_state(&self, repo: &RepoHandle, scope: &LockScope<'_>) -> Result<()> {
        require_no_native_state(repo.git_dir(), &[], |_| failure("foreign-main-checkout-state"))?;
        let out = self.land_text(repo, scope, &["ls-files", "--unmerged", "-z"], &[])?;
        if !out.is_empty() {
            return Err(failure("foreign-main-checkout-state"));
        }
        Ok(())
    }
    fn land_gate(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        req: &LandRequest,
        candidate: &str,
    ) -> Result<(bool, bool)> {
        let out = self.land_call(
            repo,
            scope,
            &[
                "diff",
                "--name-only",
                "--no-renames",
                "--no-relative",
                "-z",
                &req.target,
                candidate,
            ],
            &[],
        )?;
        if !out.success {
            return Err(out.error("land-diff-failed"));
        }
        let own = paths(&out.stdout)?;
        let matcher = fgos_write_scope::canonicalize_all(req.footprint.as_deref().unwrap_or(&[]))
            .map_err(failure)?;
        let mut cursor = None;
        let mut dirty = false;
        loop {
            let page = self.status(repo, Untracked::All, Submodules::Configured, Ignored::Excluded, cursor, 4096)?;
            for entry in page.entries {
                let p = fgos_write_scope::path_text(&entry.path).map_err(failure)?;
                if is_store_path(p) {
                    continue;
                }
                dirty = true;
                if req
                    .subtree
                    .as_ref()
                    .is_some_and(|s| p != s && !p.starts_with(&format!("{s}/")))
                {
                    continue;
                }
                if req.footprint.is_none()
                    || own.iter().any(|s| fgos_write_scope::overlaps(s, p))
                    || fgos_write_scope::matches(p.as_bytes(), &matcher).map_err(failure)?
                {
                    return Err(failure("main-checkout-dirty-mid-merge"));
                }
            }
            if page.complete {
                break;
            }
            cursor = page.next_cursor;
        }
        let mut store_collision = false;
        for p in self.ignored_checkout_collisions(repo, candidate)? {
            let path = fgos_write_scope::path_text(&p).map_err(failure)?;
            if is_store_path(path) {
                store_collision = true;
            } else {
                return Err(failure("main-checkout-dirty-mid-merge"));
            }
        }
        Ok((dirty, store_collision))
    }
    /// `filesystem` is the seam of the WAL and of every Land effect boundary.
    /// `wait_ms` bounds only resource acquisition; candidate construction and
    /// publication are never retried.
    #[allow(clippy::too_many_arguments)]
    pub fn prepare_land<F: wal::FileSystem>(
        &self,
        repo: &RepoHandle,
        held_locks: Vec<BorrowedHandle<'_>>,
        req: &LandRequest,
        writer: &str,
        id: &str,
        filesystem: &F,
        wait_ms: u64,
    ) -> Result<LandSession> {
        require_lock_scope_platform()?;
        let caller = LockScope::seeded(held_locks).map_err(failure)?;
        if caller
            .holding()
            .map_err(failure)?
            .iter()
            .any(|h| h.rank > 20)
        {
            return Err(failure("lock-order-violation"));
        }
        if caller.handle("merge-slot").is_some() {
            return Err(failure("land-slot-already-held"));
        }
        caller.assert_can_acquire("merge-slot").map_err(failure)?;
        if !wal::valid_id(id)
            || writer.is_empty()
            || req.message.is_empty()
            || req.message.contains('\0')
        {
            return Err(failure("invalid-land-request"));
        }
        let destination = RefName::parse(&req.destination).map_err(failure)?;
        if !req.destination.starts_with("refs/heads/")
            || repo.work_tree.as_deref() != Some(repo.trusted_main_root())
        {
            return Err(failure("land-main-handle-required"));
        }
        let source = Oid::parse(&req.source, repo.object_format()).map_err(failure)?;
        if !req.target.is_empty() {
            let target = Oid::parse(&req.target, repo.object_format()).map_err(failure)?;
            if source == target {
                return Err(failure("land-identical-tips"));
            }
        }
        if let Some(p) = &req.subtree {
            crate::fgos_scope_literal(p)?;
        }
        if let Some(p) = &req.footprint {
            fgos_write_scope::canonicalize_all(p).map_err(failure)?;
        }
        validate_declared_files(&req.files, "land")?;
        let slot = LockScope::seeded(vec![]).map_err(failure)?;
        let mut p = params(repo);
        p.insert("ref".into(), slot_key(&req.destination));
        let operation_repo = self.checkout_repository(repo)?;
        let repo = &operation_repo;
        let wal = Wal::open_with(repo, filesystem)?;
        let request_digest = wal::canonical_digest(&(req, writer))?;
        let mut session = LandSession {
            slot,
            candidate: None,
            receipt: None,
            request: req.clone(),
            id: id.into(),
        };
        if let Some(compact) = wal.compacted(id)? {
            if compact.request != request_digest {
                return Err(failure("operation-id-reused"));
            }
            let intent = compact_land_intent(&wal, &compact, repo, writer)?;
            session.receipt = Some(land_outcome_receipt(
                id,
                &intent,
                &compact.outcome()?,
                repo,
            )?);
            session.slot = LockScope::seeded(vec![]).map_err(failure)?;
            replay_land_receipt(session.receipt.as_ref().unwrap())?;
            return Ok(session);
        }
        if wal.known_id(id)? {
            let chain = wal.inspect(id)?;
            let OperationKind::Land(payload) = &chain.intent().kind else {
                return Err(failure("operation-id-reused"));
            };
            if chain.intent().request_digest != request_digest
                || chain.intent().writer_identity != writer
            {
                return Err(failure("operation-id-reused"));
            }
            session.candidate = Some(payload.candidate.clone());
            session.receipt = Some(land_receipt(&chain, repo)?);
            session.slot = LockScope::seeded(vec![]).map_err(failure)?;
            replay_land_receipt(session.receipt.as_ref().unwrap())?;
            return Ok(session);
        }
        session
            .slot
            .acquire("merge-slot", &p, Wait::Ms(wait_ms))
            .map_err(failure)?;
        let observed = crate::refs::direct(self, repo, &destination)?;
        let mut pinned_request = req.clone();
        if pinned_request.target.is_empty() {
            pinned_request.target = match &observed {
                ExpectedTip::Oid(oid) => oid.as_str().into(),
                ExpectedTip::Absent => return Err(failure("land-target-absent")),
            };
        }
        let req = &pinned_request;
        session.request = req.clone();
        let target = Oid::parse(&req.target, repo.object_format()).map_err(failure)?;
        if source == target {
            return Err(failure("land-identical-tips"));
        }
        if observed != ExpectedTip::Oid(target.clone()) {
            return Err(stale("land-target-changed"));
        }
        for oid in [&source, &target] {
            self.land_text(
                repo,
                &session.slot,
                &["cat-file", "-e", &format!("{}^{{commit}}", oid.as_str())],
                &[],
            )?;
        }
        let ancestor = self.land_call(
            repo,
            &session.slot,
            &["merge-base", "--is-ancestor", &req.source, &req.target],
            &[],
        )?;
        if ancestor.success {
            return Err(failure("land-already-merged"));
        }
        if ancestor.code != Some(1) {
            return Err(ancestor.error("land-ancestry-failed"));
        }
        let land_binding =
            wal::canonical_digest(&(wal.repository_identity(), "land", &req.destination))?;
        // The live destination slot proves no previous session can still publish.
        // Close only this authority's pre-attempt chains; candidate evidence remains.
        for prior in wal.active(100_000)? {
            if prior.last().operation_id != id
                && prior.intent().authority_binding == land_binding
                && matches!(&prior.intent().kind, OperationKind::Land(p) if p.request.destination == req.destination)
                && matches!(
                    *prior.last_state(),
                    Phase::Intent(_) | Phase::Prepared | Phase::LandVerified { .. }
                )
            {
                if prior.intent().writer_identity != writer {
                    return Err(recovery("land-abandoned-writer-mismatch"));
                }
                session.slot.validate().map_err(failure)?;
                wal.append(&prior, Phase::Outcome(Outcome::AbandonedBeforeAttempt))?;
            }
        }
        crate::refs::admission_land(
            &wal,
            id,
            std::slice::from_ref(&req.destination),
            &land_binding,
            self,
            repo,
        )?;
        if self.land_target_checkout(repo, &session.slot, &destination)? {
            self.land_gate(repo, &session.slot, req, &req.source)?;
        }
        let parent = repo
            .trusted_main_root()
            .join(".fgos/runtime/git-candidates");
        std::fs::create_dir_all(&parent).map_err(failure)?;
        let candidate_operation = format!(
            "lc-{}",
            wal::canonical_digest(&("land-candidate", id))?
        );
        let worktree = self.create_detached_worktree(
            repo,
            held(&session.slot)?,
            &parent,
            id,
            &target,
            writer,
            &candidate_operation,
        )?;
        let candidate_path = worktree.path.clone();
        (|| {
            let candidate_repo =
                match self.resolve_repo(&worktree.path, repo.trusted_main_root())? {
                    ResolveRepo::Repository(r) => self.checkout_repository(&r)?,
                    _ => return Err(recovery("land-candidate-missing")),
                };
            // Worker allocation deliberately strips .fgos and marks its tracked
            // entries skip-worktree. A Land candidate is an exact commit checkout:
            // materialize those immutable target bytes before merge/verification.
            let state = self.land_call(
                &candidate_repo,
                &session.slot,
                &["ls-files", "-z", "--", ".fgos"],
                &[],
            )?;
            if !state.success {
                return Err(state.error("land-state-paths-unreadable"));
            }
            if !state.stdout.is_empty() {
                self.land_text(
                    &candidate_repo,
                    &session.slot,
                    &["update-index", "--no-skip-worktree", "-z", "--stdin"],
                    &state.stdout,
                )?;
                self.land_text(
                    &candidate_repo,
                    &session.slot,
                    &[
                        "--literal-pathspecs",
                        "restore",
                        "--source",
                        &req.target,
                        "--staged",
                        "--worktree",
                        "--pathspec-from-file=-",
                        "--pathspec-file-nul",
                    ],
                    &state.stdout,
                )?;
            }
            let merged = self.land_call(
                &candidate_repo,
                &session.slot,
                &["merge", "--no-commit", "--no-ff", "--no-edit", &req.source],
                &[],
            );
            self.refresh_checkout_facts(&candidate_repo)?;
            let merged = merged?;
            if !merged.success {
                let has_merge = candidate_repo.git_dir().join("MERGE_HEAD").exists();
                let unresolved = self.land_call(
                    &candidate_repo,
                    &session.slot,
                    &[
                        "diff",
                        "--name-only",
                        "--no-relative",
                        "--diff-filter=U",
                        "-z",
                    ],
                    &[],
                )?;
                // Only exact consumer-declared bytes may resolve a conflicted path.
                // Git does not interpret decision rows, event files or either side.
                let covered = has_merge
                    && unresolved.success
                    && !unresolved.stdout.is_empty()
                    && unresolved
                        .stdout
                        .split(|b| *b == 0)
                        .filter(|p| !p.is_empty())
                        .all(|p| req.files.iter().any(|f| f.path.as_bytes() == p));
                if !covered {
                    if has_merge {
                        self.land_text(&candidate_repo, &session.slot, &["merge", "--abort"], &[])?;
                    }
                    return Err(merged.error("land-conflict-aborted"));
                }
            }
            // Consumer transformations are literal bytes; no business-state interpretation.
            for file in &req.files {
                write_declared_file(&worktree.path, file, "land")?;
                let input = format!("{}\0", file.path);
                self.land_text(
                    &candidate_repo,
                    &session.slot,
                    &[
                        "--literal-pathspecs",
                        "add",
                        "-f",
                        "-A",
                        "--pathspec-from-file=-",
                        "--pathspec-file-nul",
                    ],
                    input.as_bytes(),
                )?;
            }
            let tree = self.land_text(&candidate_repo, &session.slot, &["write-tree"], &[])?;
            let mut args = vec!["commit-tree", &tree, "-p", &req.target];
            if !req.squash {
                args.extend(["-p", &req.source]);
            }
            let candidate = self.land_text(
                &candidate_repo,
                &session.slot,
                &args,
                req.message.as_bytes(),
            )?;
            // Materialize the exact immutable candidate for consumer verification.
            self.land_text(
                &candidate_repo,
                &session.slot,
                &["update-ref", "--no-deref", "HEAD", &candidate, &req.target],
                &[],
            )?;
            if candidate_repo.git_dir().join("MERGE_HEAD").exists() {
                self.land_text(&candidate_repo, &session.slot, &["merge", "--quit"], &[])?;
            }
            let view = LandCandidate {
                worktree: worktree.path,
                source: req.source.clone(),
                target: req.target.clone(),
                candidate,
                tree_digest: wal::canonical_digest(&tree)?,
                tree,
            };
            let mut resources = vec![req.destination.clone()];
            resources.extend(checkout_resources(&candidate_repo)?);
            crate::refs::admission_land(&wal, id, &resources, &land_binding, self, repo)?;
            let kind = OperationKind::Land(Box::new(wal::LandIntent {
                request: req.clone(),
                candidate: view.clone(),
            }));
            let binding =
                wal::canonical_digest(&(wal.repository_identity(), "land", &req.destination))?;
            let intent = Intent::of(
                &wal,
                repo,
                writer,
                (kind, request_digest),
                (resources, binding.clone()),
                (Tip::Oid(req.target.clone()), Tip::Oid(view.candidate.clone())),
            );
            let authority = Authority {
                scope: &session.slot,
                binding,
            };
            let chain = match wal.begin(id, intent, &authority)? {
                Begin::Created(c) => c,
                _ => return Err(recovery("land-recovery-required")),
            };
            filesystem.checkpoint("land-intent").map_err(failure)?;
            let admin = crate::refs::acquire_worktree_admin(repo, held(&session.slot)?)?;
            for (suffix, oid) in [
                ("", &view.candidate),
                ("/source", &req.source),
                ("/target", &req.target),
            ] {
                crate::refs::install_pin(
                    self,
                    repo,
                    admin.handle("worktree-admin").unwrap(),
                    &format!("{id}{suffix}"),
                    &Oid::parse(oid, repo.object_format()).map_err(failure)?,
                )?;
                filesystem
                    .checkpoint(match suffix {
                        "" => "land-pin-candidate",
                        "/source" => "land-pin-source",
                        _ => "land-pin-target",
                    })
                    .map_err(failure)?;
            }
            wal.append(&chain, Phase::Prepared)?;
            drop(admin);
            session.candidate = Some(view);
            Ok(session)
        })()
        .map_err(|mut error: OperationError| {
            let mut diagnostics = format!(
                "Land candidate retained at {} (worktree operation {})\n",
                candidate_path.display(),
                candidate_operation
            )
            .into_bytes();
            diagnostics.extend_from_slice(&error.stderr);
            error.stderr = diagnostics;
            error.stderr.truncate(64 * 1024);
            error
        })
    }
    /// Waits at most `wait_ms` for the main checkout; publication itself is never retried.
    pub fn publish_land<F: wal::FileSystem>(
        &self,
        repo: &RepoHandle,
        session: &mut LandSession,
        evidence: &LandEvidence,
        filesystem: &F,
        wait_ms: u64,
    ) -> Result<Receipt> {
        if let Some(receipt) = &session.receipt {
            replay_land_receipt(receipt)?;
            return Ok(receipt.clone());
        }
        let operation_repo = self.checkout_repository(repo)?;
        let repo = &operation_repo;
        let wal = Wal::open_with(repo, filesystem)?;
        let chain = wal.inspect(&session.id)?;
        if !matches!(chain.last_state(), Phase::Prepared) {
            return Err(recovery("land-recovery-required"));
        }
        let c = session
            .candidate
            .as_ref()
            .ok_or_else(|| failure("land-candidate-required"))?;
        let req = &session.request;
        if evidence.source != c.source
            || evidence.target != c.target
            || evidence.candidate != c.candidate
            || evidence.tree_digest != c.tree_digest
            || evidence.evidence_digest.is_empty()
        {
            return Err(failure("land-verification-mismatch"));
        }
        let mut scope = crate::refs::acquire_worktree_admin(repo, held(&session.slot)?)?;
        scope
            .acquire("main-checkout", &params(repo), Wait::Ms(wait_ms))
            .map_err(failure)?;
        let candidate_repo = match self.resolve_repo(&c.worktree, repo.trusted_main_root())? {
            ResolveRepo::Repository(r) => self.checkout_repository(&r)?,
            _ => return Err(recovery("land-candidate-missing")),
        };
        // Publication commits the frozen candidate, never worktree bytes: untracked
        // verification/setup output cannot enter the tree, tracked or staged change can.
        if self.land_text(&candidate_repo, &scope, &["rev-parse", "HEAD"], &[])? != c.candidate
            || self.land_text(&candidate_repo, &scope, &["write-tree"], &[])? != c.tree
            || !self
                .land_text(
                    &candidate_repo,
                    &scope,
                    &["status", "--porcelain=v1", "-z", "--untracked-files=no"],
                    &[],
                )?
                .is_empty()
        {
            return Err(failure("land-candidate-dirty"));
        }
        for (suffix, oid) in [
            ("", &c.candidate),
            ("/source", &c.source),
            ("/target", &c.target),
        ] {
            let pin = RefName::parse(&format!(
                "refs/fgos/git-operations/{}{suffix}/candidate",
                session.id
            ))
            .map_err(failure)?;
            if crate::refs::direct(self, repo, &pin)?
                != ExpectedTip::Oid(Oid::parse(oid, repo.object_format()).map_err(failure)?)
            {
                return Err(recovery("land-pin-changed"));
            }
        }
        let input = format!("{}\0{}\0{}\0", c.source, c.target, c.candidate);
        let types = self.land_call(
            repo,
            &scope,
            &["cat-file", "--batch-check", "-Z"],
            input.as_bytes(),
        )?;
        let records: Vec<_> = types
            .stdout
            .split(|b| *b == 0)
            .filter(|p| !p.is_empty())
            .collect();
        if !types.success
            || records.len() != 3
            || records
                .iter()
                .zip([&c.source, &c.target, &c.candidate])
                .any(|(record, oid)| !record.starts_with(format!("{oid} commit ").as_bytes()))
        {
            return Err(recovery("land-commit-unavailable"));
        }
        let destination = RefName::parse(&req.destination).map_err(failure)?;
        if crate::refs::direct(self, repo, &destination)?
            != ExpectedTip::Oid(Oid::parse(&req.target, repo.object_format()).map_err(failure)?)
        {
            return Err(stale("land-target-changed"));
        }
        let main = self.land_target_checkout(repo, &scope, &destination)?;
        let (dirty, store_collision) = if main {
            self.land_gate(repo, &scope, req, &c.candidate)?
        } else {
            (false, false)
        };
        // Persist the opaque consumer evidence before the one-shot barrier.
        let chain = wal
            .append(
                &chain,
                Phase::LandVerified {
                    evidence: evidence.clone(),
                    checkout: if main && !store_collision {
                        Some(self.land_checkout_proof(repo, &candidate_repo, &scope, c)?)
                    } else if store_collision {
                        Some(r#"{"storeCollision":true}"#.into())
                    } else {
                        None
                    },
                },
            )?;
        let chain = wal
            .append(
                &chain,
                Phase::TargetAttempt {
                    prior_target_attempt: None,
                    expected: chain.intent().expected.clone(),
                    next: chain.intent().next.clone(),
                },
            )?;
        let before = self.checkouts(repo)?;
        filesystem.checkpoint("land-before-cas").map_err(failure)?;
        let cas = self.land_call(
            repo,
            &scope,
            &durable_args(&[
                "update-ref",
                "--no-deref",
                &req.destination,
                &c.candidate,
                &req.target,
            ]),
            &[],
        )?;
        filesystem.checkpoint("land-after-cas").map_err(failure)?;
        let observed = crate::refs::direct(self, repo, &destination)?;
        let lost = crate::refs::classify_ref_attempt(
            cas,
            &observed,
            &ExpectedTip::Oid(Oid::parse(&c.target, repo.object_format()).map_err(failure)?),
            &ExpectedTip::Oid(Oid::parse(&c.candidate, repo.object_format()).map_err(failure)?),
            &before,
            &self.checkouts(repo)?,
        )?;
        if lost {
            let terminal = wal
                .append(
                    &chain,
                    Phase::Outcome(Outcome::Loss {
                        observed: crate::refs::tip(&observed),
                    }),
                )?;
            let receipt = land_receipt(&terminal, repo)?;
            drop(scope);
            session.receipt = Some(receipt.clone());
            session.slot = LockScope::seeded(vec![]).map_err(failure)?;
            let mut error = stale("land-cas-lost");
            error.operation_id = Some(session.id.clone());
            error.receipt = Some(Box::new(receipt));
            return Err(error);
        }
        crate::refs::sync_refs(repo, &destination)?;
        if observed
            != ExpectedTip::Oid(Oid::parse(&c.candidate, repo.object_format()).map_err(failure)?)
        {
            return Err(recovery("land-ref-drift"));
        }
        let checkout = if main && store_collision {
            "pendingStoreCollision"
        } else if main {
            if self.land_text(repo, &scope, &["symbolic-ref", "-q", "HEAD"], &[])?
                != req.destination
            {
                return Err(recovery("land-main-head-changed"));
            }
            filesystem
                .checkpoint("land-before-read-tree")
                .map_err(failure)?;
            let out = self.land_call(
                repo,
                &scope,
                &["read-tree", "-m", "-u", &c.target, &c.candidate],
                &[],
            )?;
            filesystem
                .checkpoint("land-after-read-tree")
                .map_err(failure)?;
            if !out.success {
                "recoveryRequired"
            } else {
                let index = self.land_text(repo, &scope, &["write-tree"], &[])?;
                let tree = self.land_text(repo, &scope, &["rev-parse", "HEAD^{tree}"], &[])?;
                if tree != c.tree {
                    return Err(recovery("land-main-head-changed"));
                }
                if dirty {
                    "pending"
                } else if index == tree && tree == c.tree {
                    "reconciled"
                } else {
                    "recoveryRequired"
                }
            }
        } else {
            "notApplicable"
        };
        if crate::refs::direct(self, repo, &destination)?
            != ExpectedTip::Oid(Oid::parse(&c.candidate, repo.object_format()).map_err(failure)?)
        {
            return Err(recovery("land-ref-drift"));
        }
        let terminal = wal
            .append(
                &chain,
                Phase::Outcome(Outcome::Land {
                    checkout: checkout.into(),
                    observed_only: false,
                }),
            )?;
        filesystem.checkpoint("land-receipt").map_err(failure)?;
        let receipt = land_receipt(&terminal, repo)?;
        drop(scope);
        session.receipt = Some(receipt.clone());
        session.slot = LockScope::seeded(vec![]).map_err(failure)?;
        Ok(receipt)
    }
}
fn land_receipt(chain: &wal::Chain, repo: &RepoHandle) -> Result<Receipt> {
    land_outcome_receipt(
        &chain.last().operation_id,
        chain.intent(),
        chain
            .outcome()
            .ok_or_else(|| recovery("land-recovery-required"))?,
        repo,
    )
}
fn replay_land_receipt(receipt: &Receipt) -> Result<()> {
    if matches!(
        receipt.local_effect.publication_state,
        PublicationState::Unknown
    ) {
        let mut error = stale("land-cas-lost");
        error.operation_id = Some(receipt.operation_id.clone());
        error.receipt = Some(Box::new(receipt.clone()));
        return Err(error);
    }
    Ok(())
}
fn land_outcome_receipt(
    id: &str,
    intent: &Intent,
    outcome: &Outcome,
    repo: &RepoHandle,
) -> Result<Receipt> {
    if let Outcome::Loss { observed } = outcome {
        return crate::refs::receipt(
            id,
            intent,
            crate::refs::expected(observed, repo)?,
            false,
            Checkout::NotApplicable,
            Remote::NotRequested,
        );
    }
    if matches!(outcome, Outcome::AbandonedBeforeAttempt) {
        let mut receipt = crate::refs::receipt(
            id,
            intent,
            crate::refs::expected(&intent.expected, repo)?,
            false,
            Checkout::NotApplicable,
            Remote::NotRequested,
        )?;
        receipt.local_effect.publication_state = PublicationState::NotPublished;
        return Ok(receipt);
    }
    let Outcome::Land {
        checkout,
        observed_only,
    } = outcome
    else {
        return Err(recovery("land-recovery-required"));
    };
    let checkout = match checkout.as_str() {
        "reconciled" => Checkout::Reconciled,
        "pending" | "pendingStoreCollision" => Checkout::Pending,
        "notApplicable" => Checkout::NotApplicable,
        _ => Checkout::RecoveryRequired,
    };
    crate::refs::receipt(
        id,
        intent,
        crate::refs::expected(&intent.next, repo)?,
        !observed_only,
        checkout,
        Remote::NotRequested,
    )
}

#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct CheckoutProof {
    paths: Vec<Vec<u8>>,
    old: Vec<PathFingerprint>,
    next: Vec<PathFingerprint>,
    old_index_tree: String,
    #[serde(default)]
    next_index_digest: Option<String>,
    #[serde(default)]
    old_index: Option<PathFingerprint>,
    #[serde(default)]
    old_index_digest: Option<String>,
}
fn fingerprints(root: &std::path::Path, paths: &[Vec<u8>]) -> Result<Vec<PathFingerprint>> {
    if paths.len() > 4096 {
        return Err(recovery("land-fingerprint-bound"));
    }
    let mut remaining = 64 * 1024 * 1024;
    paths
        .iter()
        .map(|p| {
            if p.is_empty()
                || p.contains(&0)
                || p.split(|b| *b == b'/')
                    .any(|p| p.is_empty() || p == b"." || p == b".." || p == b".git")
            {
                return Err(recovery("land-fingerprint-path"));
            }
            crate::inspect::fingerprint(root, p, &mut remaining)
        })
        .collect()
}
fn compact_land_intent<F: wal::FileSystem>(
    wal: &Wal<F>,
    c: &wal::CompactReceipt,
    repo: &RepoHandle,
    writer: &str,
) -> Result<Intent> {
    let destination = c
        .reference
        .clone()
        .ok_or_else(|| recovery("land-compact-reference-missing"))?;
    let binding = wal::canonical_digest(&(wal.repository_identity(), "land", &destination))?;
    // The compact binding deliberately retains the destination and writer, not
    // the disposable candidate directory's inode. No effect uses this view.
    let kind = OperationKind::Land(Box::new(wal::LandIntent {
        request: LandRequest {
            source: c.next.clone(),
            target: c.expected.clone(),
            destination: destination.clone(),
            message: String::new(),
            squash: false,
            footprint: None,
            subtree: None,
            files: vec![],
        },
        candidate: LandCandidate {
            worktree: PathBuf::new(),
            source: c.next.clone(),
            target: c.expected.clone(),
            candidate: c.next.clone(),
            tree: String::new(),
            tree_digest: String::new(),
        },
    }));
    let intent = Intent::of(
        wal,
        repo,
        writer,
        (kind, c.request.clone()),
        (vec![destination], binding),
        (Tip::Oid(c.expected.clone()), Tip::Oid(c.next.clone())),
    );
    if !c.matches(&intent)? {
        return Err(failure("land-authority-mismatch"));
    }
    Ok(intent)
}
impl GitDriver {
    fn land_checkout_proof(
        &self,
        repo: &RepoHandle,
        candidate: &RepoHandle,
        scope: &LockScope<'_>,
        c: &LandCandidate,
    ) -> Result<String> {
        let out = self.land_call(
            repo,
            scope,
            &[
                "diff",
                "--name-only",
                "--no-renames",
                "--no-relative",
                "-z",
                &c.target,
                &c.candidate,
            ],
            &[],
        )?;
        if !out.success {
            return Err(out.error("land-fingerprint-diff"));
        }
        let paths: Vec<Vec<u8>> = out
            .stdout
            .split(|b| *b == 0)
            .filter(|p| !p.is_empty())
            .map(|p| p.to_vec())
            .collect();
        let old_index_tree = self.land_text(repo, scope, &["write-tree"], &[])?;
        // Two-tree read-tree retains staged entries outside the changed paths.
        // Capture that expected index explicitly, rather than assuming candidate tree equality.
        let entries = |bytes: &[u8]| -> Result<BTreeMap<Vec<u8>, Vec<u8>>> {
            bytes
                .split(|b| *b == 0)
                .filter(|e| !e.is_empty())
                .map(|entry| {
                    let tab = entry
                        .iter()
                        .position(|b| *b == b'\t')
                        .ok_or_else(|| recovery("land-index-entry-invalid"))?;
                    Ok((entry[tab + 1..].to_vec(), entry.to_vec()))
                })
                .collect()
        };
        let old_entries = self.land_call(repo, scope, &["ls-files", "--stage", "-z"], &[])?;
        if !old_entries.success {
            return Err(old_entries.error("land-index-entries-failed"));
        }
        let candidate_entries = self.land_call(candidate, scope, &["ls-files", "--stage", "-z"], &[])?;
        if !candidate_entries.success {
            return Err(candidate_entries.error("land-index-entries-failed"));
        }
        let mut next_entries = entries(&old_entries.stdout)?;
        next_entries.retain(|path, _| !paths.iter().any(|changed| path == changed));
        for (path, entry) in entries(&candidate_entries.stdout)? {
            if paths.contains(&path) {
                next_entries.insert(path, entry);
            }
        }
        let next_entries: Vec<u8> = next_entries
            .into_values()
            .flat_map(|mut e| {
                e.push(0);
                e
            })
            .collect();
        let proof = CheckoutProof {
            next_index_digest: Some(wal::canonical_digest(&next_entries)?),
            old_index: None,
            old_index_digest: Some(wal::canonical_digest(&old_entries.stdout)?),
            old: fingerprints(repo.trusted_main_root(), &paths)?,
            next: fingerprints(
                candidate
                    .work_tree
                    .as_ref()
                    .ok_or_else(|| recovery("land-candidate-missing"))?,
                &paths,
            )?,
            old_index_tree,
            paths,
        };
        serde_json::to_string(&proof).map_err(failure)
    }
    /// Observe the existing WAL operation under its original resource authority.
    /// No target CAS, merge, candidate reconstruction or reflog adoption occurs.
    pub fn recover_land(
        &self,
        repo: &RepoHandle,
        held_locks: Vec<BorrowedHandle<'_>>,
        writer: &str,
        id: &str,
    ) -> Result<Receipt> {
        require_lock_scope_platform()?;
        let caller = LockScope::seeded(held_locks).map_err(failure)?;
        if caller
            .holding()
            .map_err(failure)?
            .iter()
            .any(|h| h.rank >= 20)
        {
            return Err(failure("lock-order-violation"));
        }
        let operation_repo = self.checkout_repository(repo)?;
        let repo = &operation_repo;
        if repo.work_tree.as_deref() != Some(repo.trusted_main_root()) {
            return Err(failure("land-main-handle-required"));
        }
        let wal = Wal::open(repo)?;
        let compact = wal.compacted(id)?;
        let initial = if compact.is_none() {
            Some(
                wal.inspect(id)
                    .map_err(|e| crate::refs::pending(recovery(e), id))?,
            )
        } else {
            None
        };
        let intent = if let Some(c) = &compact {
            compact_land_intent(&wal, c, repo, writer)?
        } else {
            initial.as_ref().unwrap().intent().clone()
        };
        let OperationKind::Land(payload) = &intent.kind else {
            return Err(failure("not-land-operation"));
        };
        let req = &payload.request;
        let binding = wal::canonical_digest(&(wal.repository_identity(), "land", &req.destination))?;
        let pre_attempt = initial.as_ref().is_some_and(|c| {
            !c.records()
                .iter()
                .any(|r| matches!(r.phase, Phase::TargetAttempt { .. }))
        });
        if (!pre_attempt && intent.writer_identity != writer)
            || intent.authority_binding != binding
            || intent.repo_identity != wal.repository_identity()
        {
            return Err(failure("land-authority-mismatch"));
        }
        let mut slot = LockScope::seeded(vec![]).map_err(failure)?;
        let mut p = params(repo);
        p.insert("ref".into(), slot_key(&req.destination));
        slot.acquire("merge-slot", &p, Wait::Ms(0))
            .map_err(failure)?;
        let mut scope = crate::refs::acquire_worktree_admin(repo, held(&slot)?)?;
        scope
            .acquire("main-checkout", &params(repo), Wait::Ms(5000))
            .map_err(failure)?;
        fgos_holder_lock::validate_quiescent(scope.handle("main-checkout").unwrap())
            .map_err(failure)?;
        // A recovery leaf is last; it never substitutes for slot/admin/main.
        let mut recovery_params = BTreeMap::new();
        recovery_params.insert(
            "runDir".into(),
            repo.common_dir().join("fgos/git").to_string_lossy().into(),
        );
        scope
            .acquire("recovery", &recovery_params, Wait::Ms(0))
            .map_err(failure)?;
        if let Some(c) = compact {
            return land_outcome_receipt(id, &intent, &c.outcome()?, repo);
        }
        let chain = wal
            .inspect(id)
            .map_err(|e| crate::refs::pending(recovery(e), id))?;
        let attempted = chain
            .records()
            .iter()
            .any(|r| matches!(r.phase, Phase::TargetAttempt { .. }));
        if attempted && chain.intent().writer_identity != writer {
            return Err(failure("land-authority-mismatch"));
        }
        if let Some(outcome) = chain.outcome() {
            return land_outcome_receipt(id, chain.intent(), outcome, repo);
        }
        self.land_target_checkout(
            repo,
            &scope,
            &RefName::parse(&req.destination).map_err(failure)?,
        )
        .and_then(|_| self.land_native_state(repo, &scope))
        .map_err(|e| {
            if e.cause == "foreign-main-checkout-state" {
                recovery("land-native-state-preserved: inspect foreign checkout state")
            } else {
                e
            }
        })?;
        if !attempted {
            let terminal = wal
                .append(&chain, Phase::Outcome(Outcome::AbandonedBeforeAttempt))?;
            return land_receipt(&terminal, repo);
        }
        let destination = RefName::parse(&req.destination).map_err(failure)?;
        let observed = crate::refs::direct(self, repo, &destination)?;
        if let (Tip::Oid(next), ExpectedTip::Oid(current)) = (&intent.next, &observed) {
            let next = Oid::parse(next, repo.object_format()).map_err(failure)?;
            if *current != next && self.ancestry(repo, &next, current)? {
                // A later commit proves this unique candidate landed, but says
                // nothing about whether its checkout was reconciled or reverted.
                // Observe only: never repair pins, write the index or read-tree.
                if crate::refs::direct(self, repo, &destination)? != observed {
                    return Err(recovery("land-ref-drift"));
                }
                let terminal = wal
                    .append(
                        &chain,
                        Phase::Outcome(Outcome::Land {
                            checkout: "pending".into(),
                            observed_only: true,
                        }),
                    )?;
                return land_receipt(&terminal, repo);
            }
        }
        if crate::refs::tip(&observed) != intent.next {
            // expected may be an ABA; a third tip belongs to another writer.
            return Err(crate::refs::pending(
                recovery("land-target-effect-unknown"),
                id,
            ));
        }
        if wal.native_lock_present(&intent)? {
            return Err(recovery("land-native-ref-lock-preserved"));
        }
        let c = &payload.candidate;
        for oid in [&c.source, &c.target, &c.candidate] {
            self.land_text(
                repo,
                &scope,
                &["cat-file", "-e", &format!("{oid}^{{commit}}")],
                &[],
            )
            .map_err(|_| recovery("land-commit-unavailable"))?;
        }
        let parents = self.land_text(
            repo,
            &scope,
            &["show", "-s", "--format=%P", &c.candidate],
            &[],
        )?;
        let expected_parents = if req.squash {
            c.target.clone()
        } else {
            format!("{} {}", c.target, c.source)
        };
        if parents != expected_parents
            || self.land_text(
                repo,
                &scope,
                &["rev-parse", &format!("{}^{{tree}}", c.candidate)],
                &[],
            )? != c.tree
        {
            return Err(recovery("land-candidate-contract-changed"));
        }
        // Pin repair is distinct from the target effect, exact-old and bound to
        // a valid prepared chain. Intent alone never authorizes this repair.
        let prepared = chain
            .records()
            .iter()
            .any(|r| matches!(r.phase, Phase::Prepared));
        let pin =
            RefName::parse(&format!("refs/fgos/git-operations/{id}/candidate")).map_err(failure)?;
        match crate::refs::direct(self, repo, &pin)? {
            ExpectedTip::Oid(oid) if oid.as_str() == c.candidate => (),
            ExpectedTip::Oid(oid) if prepared && oid.as_str() == c.target => {
                self.land_text(
                    repo,
                    &scope,
                    &durable_args(&[
                        "update-ref",
                        "--no-deref",
                        pin.as_str(),
                        &c.candidate,
                        &c.target,
                    ]),
                    &[],
                )?;
                crate::refs::sync_refs(repo, &pin)?;
                if crate::refs::direct(self, repo, &pin)?
                    != ExpectedTip::Oid(
                        Oid::parse(&c.candidate, repo.object_format()).map_err(failure)?,
                    )
                {
                    return Err(recovery("land-pin-changed"));
                }
            }
            _ => return Err(recovery("land-pin-changed")),
        }
        for (suffix, oid) in [("source", &c.source), ("target", &c.target)] {
            let pin = RefName::parse(&format!("refs/fgos/git-operations/{id}/{suffix}/candidate"))
                .map_err(failure)?;
            if crate::refs::direct(self, repo, &pin)?
                != ExpectedTip::Oid(Oid::parse(oid, repo.object_format()).map_err(failure)?)
            {
                return Err(recovery("land-pin-changed"));
            }
        }
        let main = self
            .land_target_checkout(repo, &scope, &destination)
            .map_err(|e| {
                if e.cause == "foreign-main-checkout-state" {
                    recovery("land-native-state-preserved: inspect foreign checkout state")
                } else {
                    e
                }
            })?;
        let store_collision = chain.records().iter().any(|r| matches!(&r.phase, Phase::LandVerified { checkout: Some(p), .. } if p == r#"{"storeCollision":true}"#));
        let checkout = if store_collision {
            "pendingStoreCollision"
        } else if !main {
            "notApplicable"
        } else {
            let index = self.land_text(repo, &scope, &["write-tree"], &[])?;
            let proof = chain.records().iter().find_map(|r| match &r.phase {
                Phase::LandVerified { checkout, .. } => checkout.as_ref(),
                _ => None,
            });
            let Some(proof) = proof else {
                return Err(recovery("land-checkout-fingerprints-missing"));
            };
            let proof: CheckoutProof = serde_json::from_str(proof).map_err(failure)?;
            if proof.paths.len() != proof.old.len()
                || proof.paths.len() != proof.next.len()
                || proof.old.iter().chain(&proof.next).any(|p| {
                    matches!(
                        p,
                        PathFingerprint::Type { .. } | PathFingerprint::Unreadable { .. }
                    )
                })
            {
                return Err(recovery("land-checkout-fingerprints-invalid"));
            }
            let actual = fingerprints(repo.trusted_main_root(), &proof.paths)?;
            let next_index_matches = |driver: &GitDriver| -> Result<bool> {
                if let Some(expected) = &proof.next_index_digest {
                    let out =
                        driver.land_call(repo, &scope, &["ls-files", "--stage", "-z"], &[])?;
                    if !out.success {
                        return Err(out.error("land-index-entries-failed"));
                    }
                    Ok(wal::canonical_digest(&out.stdout)? == *expected)
                } else {
                    Ok(driver.land_text(repo, &scope, &["write-tree"], &[])? == c.tree)
                }
            };
            let old_entries = self.land_call(repo, &scope, &["ls-files", "--stage", "-z"], &[])?;
            if !old_entries.success {
                return Err(old_entries.error("land-index-entries-failed"));
            }
            let old_index_matches = proof.old_index_digest.as_ref()
                == Some(&wal::canonical_digest(&old_entries.stdout)?);
            if next_index_matches(self)? && actual == proof.next {
                "reconciled"
            } else if index == proof.old_index_tree && actual == proof.old && old_index_matches {
                // Finish only an exactly captured old checkout. A native lock,
                // mixed files or user edits never reach this command.
                let out = self.land_call(
                    repo,
                    &scope,
                    &["read-tree", "-m", "-u", &c.target, &c.candidate],
                    &[],
                )?;
                if !out.success
                    || !next_index_matches(self)?
                    || fingerprints(repo.trusted_main_root(), &proof.paths)? != proof.next
                {
                    return Err(recovery("land-checkout-recovery-required"));
                }
                "reconciled"
            } else {
                return Err(recovery("land-checkout-recovery-required"));
            }
        };
        if crate::refs::direct(self, repo, &destination)? != observed {
            return Err(recovery("land-ref-drift"));
        }
        crate::refs::sync_refs(repo, &destination)?;
        let checkout = if main && checkout == "reconciled" {
            let mut cursor = None;
            let mut dirty = false;
            loop {
                let page = self.status(repo, Untracked::All, Submodules::Configured, Ignored::Excluded, cursor, 4096)?;
                dirty |= page
                    .entries
                    .iter()
                    .any(|e| e.path != b".fgos" && !e.path.starts_with(b".fgos/"));
                if page.complete {
                    break;
                }
                cursor = page.next_cursor;
            }
            if dirty {
                "pending"
            } else {
                checkout
            }
        } else {
            checkout
        };
        let terminal = wal
            .append(
                &chain,
                Phase::Outcome(Outcome::Land {
                    checkout: checkout.into(),
                    observed_only: true,
                }),
            )?;
        land_receipt(&terminal, repo)
    }
}

impl GitDriver {
    /// Cleanup is part of explicit recovery, after the consumer has durably
    /// settled its unique (repoIdentity, operationId, settlementKind) identity.
    /// The opaque acknowledgement is a consumer assertion, never Git settlement.
    pub fn acknowledge_land<F: wal::FileSystem>(
        &self,
        repo: &RepoHandle,
        writer: &str,
        id: &str,
        acknowledgement: &str,
        filesystem: &F,
    ) -> Result<Vec<String>> {
        if acknowledgement.is_empty() {
            return Err(failure("land-consumer-acknowledgement-required"));
        }
        let operation_repo = self.checkout_repository(repo)?;
        let repo = &operation_repo;
        if repo.work_tree.as_deref() != Some(repo.trusted_main_root()) {
            return Err(failure("land-main-handle-required"));
        }
        let wal = Wal::open_with(repo, filesystem)?;
        if let Some(c) = wal.compacted(id)? {
            let intent = compact_land_intent(&wal, &c, repo, writer)?;
            let mut slot = LockScope::seeded(vec![]).map_err(failure)?;
            let mut p = params(repo);
            p.insert("ref".into(), slot_key(intent.resource_set.first().unwrap()));
            slot.acquire("merge-slot", &p, Wait::Ms(0))
                .map_err(failure)?;
            let scope = crate::refs::acquire_worktree_admin(repo, held(&slot)?)?;
            let authority = Authority {
                scope: &scope,
                binding: intent.authority_binding.clone(),
            };
            return Ok(wal
                .resume_compaction(id, &WalReader { driver: self, repo }, &intent, &authority)
                .err()
                .map(|e| vec![format!("land-compaction-deferred: {e}")])
                .unwrap_or_default());
        }
        let chain = wal.inspect(id)?;
        let OperationKind::Land(payload) = &chain.intent().kind else {
            return Err(failure("not-land-operation"));
        };
        if chain.intent().writer_identity != writer {
            return Err(failure("land-authority-mismatch"));
        }
        let discarded = matches!(
            chain.outcome(),
            Some(Outcome::AbandonedBeforeAttempt | Outcome::Loss { .. })
        );
        match chain.outcome() {
            Some(Outcome::Land { checkout, .. })
                if ["reconciled", "notApplicable"].contains(&checkout.as_str()) => {}
            _ if discarded => (),
            _ => {
                return Ok(vec![
                    "land-cleanup-deferred: checkout reconciliation pending".into(),
                ])
            }
        }
        let mut slot = LockScope::seeded(vec![]).map_err(failure)?;
        let mut p = params(repo);
        p.insert("ref".into(), slot_key(&payload.request.destination));
        slot.acquire("merge-slot", &p, Wait::Ms(0))
            .map_err(failure)?;
        // The removal Intent retains this authorization digest and caller writer
        // even after the Land chain itself has been compacted.
        let proof = WorktreeDelivery {
            expected_tip: Oid::parse(&payload.candidate.candidate, repo.object_format())
                .map_err(failure)?,
            delivered_to: Oid::parse(&payload.candidate.candidate, repo.object_format())
                .map_err(failure)?,
            evidence_digest: wal::canonical_digest(&(
                wal.repository_identity(),
                id,
                "consumer-acknowledged",
                acknowledgement,
                writer,
            ))?,
        };
        let removal_id = format!(
            "lr-{}",
            wal::canonical_digest(&("land-cleanup", id))?
        );
        if let Err(e) = self.remove_land_candidate(
            repo,
            held(&slot)?,
            &payload.candidate.worktree,
            &proof,
            writer,
            &removal_id,
            if discarded { Some(id) } else { None },
        ) {
            return Ok(vec![format!("land-cleanup-deferred: {}", e.cause)]);
        }
        filesystem
            .checkpoint("land-cleanup-candidate")
            .map_err(failure)?;
        let scope = crate::refs::acquire_worktree_admin(repo, held(&slot)?)?;
        let cleanup = || -> Result<()> {
            for (suffix, oid) in [
                ("source", &payload.candidate.source),
                ("target", &payload.candidate.target),
            ] {
                let pin =
                    RefName::parse(&format!("refs/fgos/git-operations/{id}/{suffix}/candidate"))
                        .map_err(failure)?;
                match crate::refs::direct(self, repo, &pin)? {
                    ExpectedTip::Absent => (),
                    ExpectedTip::Oid(actual) if actual.as_str() == oid => {
                        self.land_text(
                            repo,
                            &scope,
                            &durable_args(&[
                                "update-ref",
                                "--no-deref",
                                "-d",
                                pin.as_str(),
                                oid,
                            ]),
                            &[],
                        )?;
                        if crate::refs::direct(self, repo, &pin)? != ExpectedTip::Absent {
                            return Err(recovery("land-pin-release-changed"));
                        }
                    }
                    _ => return Err(recovery("land-pin-release-changed")),
                }
                crate::refs::sync_refs(repo, &pin)?;
                filesystem
                    .checkpoint(if suffix == "source" {
                        "land-cleanup-source-pin"
                    } else {
                        "land-cleanup-target-pin"
                    })
                    .map_err(failure)?;
            }
            let terminal = wal.inspect(id)?;
            crate::refs::release_pin(
                self,
                repo,
                scope.handle("worktree-admin").unwrap(),
                &wal,
                &terminal,
            )?;
            let terminal = wal.inspect(id)?;
            let authority = Authority {
                scope: &scope,
                binding: chain.intent().authority_binding.clone(),
            };
            wal.compact(&terminal, &WalReader { driver: self, repo }, &authority)?;
            Ok(())
        };
        Ok(cleanup()
            .err()
            .map(|e| vec![format!("land-compaction-deferred: {}", e.cause)])
            .unwrap_or_default())
    }
}
