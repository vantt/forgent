//! One repository-wide tracked fence authority, shared by read and sync.
use crate::{
    commit_memo::CommitMemo,
    errors::{invalid, Error, ErrorCode},
    walk::{self, git_error},
};
use fgos_git::*;
use serde::Deserialize;
use std::result::Result;
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Fence {
    legacy_ref_oid: String,
    seal_digest: String,
    from_commit: String,
}

pub(crate) fn authority(port: &dyn Inspect, repo: &RepoHandle) -> Result<RepoHandle, Error> {
    match port
        .resolve_repo(repo.trusted_main_root())
        .map_err(git_error)?
    {
        ResolveRepo::Repository(main) if main.common_dir() == repo.common_dir() => Ok(main),
        _ => Err(invalid("fence authority repository mismatch")),
    }
}
pub(crate) fn pinned_legacy(port: &dyn Inspect, repo: &RepoHandle) -> Result<Option<Oid>, Error> {
    let authority = authority(port, repo)?;
    let head = port.resolve_head(&authority).map_err(git_error)?;
    pinned_at_head(port, &authority, &head)
}
/// The fence a commit carries never changes: see `commit_memo`.
static FENCE: CommitMemo<Option<Oid>> = CommitMemo::new();

/// Reuse a command's already observed authority and HEAD.
pub(crate) fn pinned_at_head(
    port: &dyn Inspect,
    repo: &RepoHandle,
    head: &HeadFact,
) -> Result<Option<Oid>, Error> {
    let head = match head {
        HeadFact::Attached { commit, .. } | HeadFact::Detached { commit } => commit,
        HeadFact::Unborn { .. } => return Ok(None),
    };
    FENCE.get_or_compute(repo, head, b"", || read_pin(port, repo, head))
}
fn read_pin(port: &dyn Inspect, repo: &RepoHandle, head: &Oid) -> Result<Option<Oid>, Error> {
    let values = port
        .read_paths_at_many(
            repo,
            &[(head.clone(), vec![b".fgos/events".to_vec()])],
            32 * 1024 * 1024,
        )
        .map_err(git_error)?
        .pop()
        .unwrap_or_default();
    let bytes = match values.into_iter().next().map(|p| p.value) {
        Some(PathValue::Blob(b)) => b,
        Some(PathValue::Absent | PathValue::NotABlob(ObjectType::Tree)) => return Ok(None),
        Some(PathValue::Error(e)) => return Err(git_error(e)),
        _ => return Err(invalid("invalid fence observation")),
    };
    let fence: Fence = serde_json::from_slice(&bytes).map_err(|e| invalid(e.to_string()))?;
    let oid = Oid::parse(&fence.legacy_ref_oid, repo.object_format())
        .map_err(|e| invalid(e.to_string()))?;
    let seal = walk::header(port, repo, &oid)?;
    if fence.seal_digest != seal.digest()?
        || !matches!(seal, crate::envelope::Seal::Legacy {ref from_commit,..} if fence.from_commit == *from_commit)
    {
        return Err(Error::new(
            ErrorCode::EventStoreLegacyMismatch,
            "legacy seal differs from tracked fence",
        ));
    }
    Ok(Some(oid))
}
pub(crate) fn validate_refs<'a>(
    pin: Option<&Oid>,
    refs: impl Iterator<Item = &'a Oid>,
) -> Result<(), Error> {
    if refs.into_iter().any(|oid| Some(oid) != pin) {
        return Err(Error::new(
            ErrorCode::EventStoreLegacyMismatch,
            "legacy ref does not match tracked fence",
        ));
    }
    Ok(())
}
