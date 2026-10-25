//! Mirror configuration is owned and journaled by Git, never by the store.
use crate::{
    errors::{Error, ErrorCode},
    walk::git_error,
};
use fgos_git::{Inspect, RepoHandle};
pub fn mappings(remote: &str) -> Result<Vec<String>, Error> {
    fgos_git::publication_fetch_mappings(remote).map_err(git_error)
}
pub fn pinned_url(git: &dyn Inspect, repo: &RepoHandle, remote: &str) -> Result<String, Error> {
    let wanted = mappings(remote)?;
    let actual = git
        .configured_fetch_refspecs(repo, remote)
        .map_err(git_error)?;
    let provenance = git
        .fetch_mapping_provenance(repo, remote)
        .map_err(git_error)?;
    let provenance = provenance
        .filter(|p| wanted.iter().all(|r| p.refspecs.contains(r)))
        .ok_or_else(|| {
            Error::new(
                ErrorCode::EventStoreRefspecMissing,
                "run setup to install mirror fetch mappings",
            )
        })?;
    if wanted
        .iter()
        .any(|r| !actual.iter().any(|v| v.value == r.as_bytes()))
    {
        return Err(Error::new(
            ErrorCode::EventStoreRefspecMissing,
            "mirror fetch mapping missing",
        ));
    }
    if git.remote_url(repo, remote).map_err(git_error)? != provenance.remote_url {
        return Err(Error::new(
            ErrorCode::EventStoreRemoteChanged,
            "remote URL changed; rerun setup",
        ));
    }
    Ok(provenance.remote_url)
}
