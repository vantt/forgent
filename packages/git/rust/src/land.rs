//! Dormant Land transaction. The consumer owns verification and business settlement.
use crate::{
    refs::{failure, recovery, Authority},
    scoped_commit::{checkout_resources, paths},
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
            for name in [
                "MERGE_HEAD",
                "rebase-merge",
                "rebase-apply",
                "CHERRY_PICK_HEAD",
                "REVERT_HEAD",
                "BISECT_START",
                "index.lock",
            ] {
                if repo.git_dir().join(name).try_exists().map_err(failure)? {
                    return Err(failure("foreign-main-checkout-state"));
                }
            }
            let out = self.land_text(repo, scope, &["ls-files", "--unmerged", "-z"], &[])?;
            if !out.is_empty() {
                return Err(failure("foreign-main-checkout-state"));
            }
        }
        Ok(main)
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
            let page = self.status(repo, Untracked::All, cursor, 4096)?;
            for entry in page.entries {
                let p = fgos_write_scope::path_text(&entry.path).map_err(failure)?;
                if p == ".fgos" || p.starts_with(".fgos/") {
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
            if path == ".fgos" || path.starts_with(".fgos/") {
                store_collision = true;
            } else {
                return Err(failure("main-checkout-dirty-mid-merge"));
            }
        }
        Ok((dirty, store_collision))
    }
    pub fn prepare_land(
        &self,
        repo: &RepoHandle,
        held_locks: Vec<BorrowedHandle<'_>>,
        req: &LandRequest,
        writer: &str,
        id: &str,
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
        let target = Oid::parse(&req.target, repo.object_format()).map_err(failure)?;
        if source == target {
            return Err(failure("land-identical-tips"));
        }
        if let Some(p) = &req.subtree {
            crate::fgos_scope_literal(p)?;
        }
        if let Some(p) = &req.footprint {
            fgos_write_scope::canonicalize_all(p).map_err(failure)?;
        }
        let mut slot = LockScope::seeded(vec![]).map_err(failure)?;
        let mut p = params(repo);
        p.insert("ref".into(), slot_key(&req.destination));
        slot.acquire("merge-slot", &p, Wait::Ms(0))
            .map_err(failure)?;
        let operation_repo = self.checkout_repository(repo)?;
        let repo = &operation_repo;
        let wal = Wal::open(repo).map_err(failure)?;
        let mut session = LandSession {
            slot,
            candidate: None,
            receipt: None,
            request: req.clone(),
            id: id.into(),
        };
        if wal.known_id(id).map_err(failure)? {
            let chain = wal.inspect(id).map_err(failure)?;
            let OperationKind::Land(payload) = &chain.intent().kind else {
                return Err(failure("operation-id-reused"));
            };
            if payload.request != *req || chain.intent().writer_identity != writer {
                return Err(failure("operation-id-reused"));
            }
            session.candidate = Some(payload.candidate.clone());
            session.receipt = Some(land_receipt(&chain, repo)?);
            session.slot = LockScope::seeded(vec![]).map_err(failure)?;
            return Ok(session);
        }
        if crate::refs::direct(self, repo, &destination)? != ExpectedTip::Oid(target.clone()) {
            return Err(crate::refs::stale("land-target-changed"));
        }
        for oid in [&source, &target] {
            self.land_text(
                repo,
                &session.slot,
                &["cat-file", "-e", &format!("{}^{{commit}}", oid.as_str())],
                &[],
            )?;
        }
        crate::refs::admission(&wal, id, std::slice::from_ref(&req.destination))?;
        if self.land_target_checkout(repo, &session.slot, &destination)? {
            self.land_gate(repo, &session.slot, req, &req.source)?;
        }
        let parent = repo
            .trusted_main_root()
            .join(".fgos/runtime/git-candidates");
        std::fs::create_dir_all(&parent).map_err(failure)?;
        let candidate_operation = format!(
            "lc-{}",
            wal::canonical_digest(&("land-candidate", id)).map_err(failure)?
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
        let candidate_repo = match self.resolve_repo(&worktree.path, repo.trusted_main_root())? {
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
            if candidate_repo.git_dir().join("MERGE_HEAD").exists() {
                self.land_text(&candidate_repo, &session.slot, &["merge", "--abort"], &[])?;
            }
            return Err(merged.error("land-conflict-aborted"));
        }
        // Consumer transformations are literal bytes; no business-state interpretation.
        for file in &req.files {
            let path = std::path::Path::new(&file.path);
            if path.is_absolute()
                || file.path.is_empty()
                || path
                    .components()
                    .any(|c| !matches!(c, std::path::Component::Normal(_)))
                || file.path.split('/').any(|s| s == ".git")
            {
                return Err(failure("invalid-land-file"));
            }
            let full = worktree.path.join(path);
            // Refuse symlink ancestors/targets rather than writing outside the candidate.
            let mut at = worktree.path.clone();
            for part in path.components() {
                at.push(part);
                if std::fs::symlink_metadata(&at).is_ok_and(|m| m.file_type().is_symlink()) {
                    return Err(failure("land-file-symlink"));
                }
            }
            if let Some(bytes) = &file.bytes {
                if let Some(p) = full.parent() {
                    std::fs::create_dir_all(p).map_err(failure)?;
                }
                std::fs::write(full, bytes).map_err(failure)?;
            } else {
                match std::fs::remove_file(full) {
                    Ok(()) => (),
                    Err(e) if e.kind() == std::io::ErrorKind::NotFound => (),
                    Err(e) => return Err(failure(e)),
                }
            }
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
            tree_digest: wal::canonical_digest(&tree).map_err(failure)?,
            tree,
        };
        let mut resources = vec![req.destination.clone()];
        resources.extend(checkout_resources(&candidate_repo)?);
        crate::refs::admission(&wal, id, &resources)?;
        let kind = OperationKind::Land(Box::new(wal::LandIntent {
            request: req.clone(),
            candidate: view.clone(),
        }));
        let binding = wal::canonical_digest(&(wal.repository_identity(), "land", &req.destination))
            .map_err(failure)?;
        let intent = Intent {
            request_digest: wal::canonical_digest(&(&kind, writer)).map_err(failure)?,
            kind,
            repo_identity: wal.repository_identity().into(),
            resource_set: resources,
            authority_binding: binding.clone(),
            writer_identity: writer.into(),
            object_format: repo.object_format(),
            expected: Tip::Oid(req.target.clone()),
            next: Tip::Oid(view.candidate.clone()),
        };
        let authority = Authority {
            scope: &session.slot,
            binding,
        };
        let chain = match wal.begin(id, intent, &authority).map_err(failure)? {
            Begin::Created(c) => c,
            _ => return Err(recovery("land-recovery-required")),
        };
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
        }
        wal.append(&chain, Phase::Prepared).map_err(failure)?;
        drop(admin);
        session.candidate = Some(view);
        Ok(session)
    }
    pub fn publish_land(
        &self,
        repo: &RepoHandle,
        session: &mut LandSession,
        evidence: &LandEvidence,
    ) -> Result<Receipt> {
        if let Some(receipt) = &session.receipt {
            return Ok(receipt.clone());
        }
        let operation_repo = self.checkout_repository(repo)?;
        let repo = &operation_repo;
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
            .acquire("main-checkout", &params(repo), Wait::Ms(5000))
            .map_err(failure)?;
        let candidate_repo = match self.resolve_repo(&c.worktree, repo.trusted_main_root())? {
            ResolveRepo::Repository(r) => self.checkout_repository(&r)?,
            _ => return Err(recovery("land-candidate-missing")),
        };
        if self.land_text(&candidate_repo, &scope, &["rev-parse", "HEAD"], &[])? != c.candidate
            || self.land_text(&candidate_repo, &scope, &["write-tree"], &[])? != c.tree
            || !self
                .land_text(
                    &candidate_repo,
                    &scope,
                    &["status", "--porcelain=v1", "-z", "--untracked-files=all"],
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
            return Err(crate::refs::stale("land-target-changed"));
        }
        let main = self.land_target_checkout(repo, &scope, &destination)?;
        let (dirty, store_collision) = if main {
            self.land_gate(repo, &scope, req, &c.candidate)?
        } else {
            (false, false)
        };
        let wal = Wal::open(repo).map_err(failure)?;
        let chain = wal.inspect(&session.id).map_err(failure)?;
        if !matches!(chain.last().phase, Phase::Prepared) {
            return Err(recovery("land-recovery-required"));
        }
        // Persist the opaque consumer evidence before the one-shot barrier.
        let chain = wal
            .append(
                &chain,
                Phase::LandVerified {
                    evidence: evidence.clone(),
                },
            )
            .map_err(failure)?;
        let chain = wal
            .append(
                &chain,
                Phase::TargetAttempt {
                    prior_target_attempt: None,
                    expected: chain.intent().expected.clone(),
                    next: chain.intent().next.clone(),
                },
            )
            .map_err(failure)?;
        let cas = self.land_call(
            repo,
            &scope,
            &[
                "-c",
                "core.fsync=all",
                "update-ref",
                "--no-deref",
                &req.destination,
                &c.candidate,
                &req.target,
            ],
            &[],
        )?;
        let observed = crate::refs::direct(self, repo, &destination)?;
        if !cas.success {
            let terminal = wal
                .append(
                    &chain,
                    Phase::Outcome(Outcome::Loss {
                        observed: crate::refs::tip(&observed),
                    }),
                )
                .map_err(failure)?;
            let receipt = land_receipt(&terminal, repo)?;
            drop(scope);
            session.receipt = Some(receipt.clone());
            session.slot = LockScope::seeded(vec![]).map_err(failure)?;
            let mut error = crate::refs::stale("land-cas-lost");
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
            "pending"
        } else if main {
            if self.land_text(repo, &scope, &["symbolic-ref", "-q", "HEAD"], &[])?
                != req.destination
            {
                return Err(recovery("land-main-head-changed"));
            }
            let out = self.land_call(repo, &scope, &["read-tree", "-m", "-u", "HEAD"], &[])?;
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
                }),
            )
            .map_err(failure)?;
        let receipt = land_receipt(&terminal, repo)?;
        drop(scope);
        session.receipt = Some(receipt.clone());
        session.slot = LockScope::seeded(vec![]).map_err(failure)?;
        Ok(receipt)
    }
}
fn land_receipt(chain: &wal::Chain, repo: &RepoHandle) -> Result<Receipt> {
    if let Some(Outcome::Loss { observed }) = chain.outcome() {
        return crate::refs::receipt(
            &chain.last().operation_id,
            chain.intent(),
            crate::refs::expected(observed, repo)?,
            false,
            Checkout::NotApplicable,
            Remote::NotRequested,
        );
    }
    let Some(Outcome::Land { checkout }) = chain.outcome() else {
        return Err(recovery("land-recovery-required"));
    };
    let checkout = match checkout.as_str() {
        "reconciled" => Checkout::Reconciled,
        "pending" => Checkout::Pending,
        "notApplicable" => Checkout::NotApplicable,
        _ => Checkout::RecoveryRequired,
    };
    crate::refs::receipt(
        &chain.last().operation_id,
        chain.intent(),
        crate::refs::expected(&chain.intent().next, repo)?,
        true,
        checkout,
        Remote::NotRequested,
    )
}
