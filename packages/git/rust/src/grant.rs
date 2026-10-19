//! Read-only host check for the cutover guard. A selector conveys no authority.
use crate::{
    refs::failure,
    wal::{self, OperationKind, Phase},
    *,
};
use std::{fs, path::Path};
impl GitDriver {
    pub fn check_cutover_grant(
        &self,
        repo: &RepoHandle,
        operation_id: &str,
        index: &Path,
    ) -> Result<()> {
        #[cfg(unix)]
        {
            use std::os::{
                fd::{AsFd, BorrowedFd},
                unix::fs::MetadataExt,
            };
            // Duplicate, then seal the inherited description before any subprocess.
            let inherited = unsafe { BorrowedFd::borrow_raw(3) };
            let owned = inherited.try_clone_to_owned().map_err(failure)?;
            let file = fs::File::from(owned);
            let annotation = std::env::var("FGOS_LOCK_FD").ok();
            let lock_path = repo
                .trusted_main_root()
                .join(".fgos/locks/main-checkout.lock");
            if fgos_holder_lock::borrowed_check(&file, &lock_path, annotation.as_deref(), 3)
                != fgos_holder_lock::BorrowedCheck::Borrower
            {
                return Err(failure("cutover-main-borrow-required"));
            }
            // The original slot is not owned here and must remain available to the hook.
            let _ = file.as_fd();
            if repo.work_tree.as_deref() != Some(repo.trusted_main_root()) {
                return Err(failure("cutover-main-required"));
            }
            let chain = wal::Wal::open_existing(repo.common_dir(), wal::OsFileSystem)
                .map_err(failure)?
                .inspect(operation_id)
                .map_err(failure)?;
            let OperationKind::ScopedCommit(payload) = &chain.intent().kind else {
                return Err(failure("cutover-grant-missing"));
            };
            let grant = payload
                .cutover_grant
                .as_ref()
                .ok_or_else(|| failure("cutover-grant-missing"))?;
            let worktree = &payload.worktree;
            let m = file.metadata().map_err(failure)?;
            if chain.intent().authority_binding != format!("{}:{}", m.dev(), m.ino())
                || worktree != &repo.trusted_main_root().to_string_lossy()
            {
                return Err(failure("cutover-description-mismatch"));
            }
            if chain.outcome().is_some()
                || !matches!(chain.last().phase, Phase::TargetAttempt { .. })
            {
                return Err(failure("cutover-grant-spent-or-unprepared"));
            }
            let metadata = fs::symlink_metadata(index).map_err(failure)?;
            if !metadata.is_file()
                || metadata.file_type().is_symlink()
                || fs::canonicalize(
                    index
                        .parent()
                        .ok_or_else(|| failure("hook-index-untrusted"))?,
                )
                .map_err(failure)?
                    != repo.git_dir
            {
                return Err(failure("hook-index-untrusted"));
            }
            let mut staged = self.hook_deletions(repo, index)?;
            staged.sort();
            let mut exact = grant.exact_paths.clone();
            exact.sort();
            if staged.is_empty() || staged != exact {
                return Err(failure("cutover-exact-paths-mismatch"));
            }
            // Read-only calls scrub hook GIT_*; only the index query keeps validated authority.
            let reference = self.checked(
                repo,
                &["rev-parse", "--verify", "refs/fgos/legacy"],
                crate::driver::Policy::Inspect,
            )?;
            if reference.strip_suffix(b"\n").unwrap_or(&reference)
                != grant.legacy_ref_oid.as_bytes()
            {
                return Err(failure("cutover-legacy-ref-mismatch"));
            }
            let bytes = self.checked(
                repo,
                &["show", &format!("{}:seal.json", grant.legacy_ref_oid)],
                crate::driver::Policy::Inspect,
            )?;
            use sha2::{Digest, Sha256};
            if format!("{:x}", Sha256::digest(bytes)) != grant.seal_digest {
                return Err(failure("cutover-seal-digest-mismatch"));
            }
            Ok(())
        }
        #[cfg(not(unix))]
        {
            let _ = (repo, operation_id, index);
            Err(failure("git-lockscope-unavailable-windows"))
        }
    }
}
