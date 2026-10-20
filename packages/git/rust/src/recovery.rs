//! One recovery dispatch door. Resource authority remains with each owning port.
use crate::{
    refs::failure,
    wal::{self, OperationKind, Wal},
    *,
};
use fgos_holder_lock::{BorrowedHandle, LockScope, Wait};
use serde::Serialize;
use serde_json::{Value, json};
use std::collections::BTreeMap;

/// Acquire only after the interrupted operation's complete resource authority.
pub(crate) fn leaf(scope: &mut LockScope<'_>, repo: &RepoHandle) -> Result<()> {
    scope
        .acquire(
            "recovery",
            &BTreeMap::from([(
                "runDir".into(),
                repo.common_dir()
                    .join("fgos/git")
                    .to_string_lossy()
                    .into_owned(),
            )]),
            Wait::Ms(0),
        )
        .map_err(failure)?;
    Ok(())
}
fn value(v: impl Serialize) -> Result<Value> {
    serde_json::to_value(v).map_err(failure)
}
pub(crate) fn kind(k: &OperationKind) -> &'static str {
    match k {
        OperationKind::RefUpdate { .. } => "RefUpdate",
        OperationKind::RefDelete => "RefDelete",
        OperationKind::Land(_) => "Land",
        OperationKind::ScopedCommit(_) => "ScopedCommit",
        OperationKind::Sync(_) => "Sync",
        OperationKind::WorktreeCreate { .. } => "WorktreeCreate",
        OperationKind::WorktreeMove { .. } => "WorktreeMove",
        OperationKind::WorktreeRemove { .. } => "WorktreeRemove",
        OperationKind::Restore(_) => "Restore",
        OperationKind::ConfigChange(_) => "ConfigChange",
        OperationKind::RemoteFetch { .. } | OperationKind::RemotePush { .. } => "RemoteTransfer",
        OperationKind::PublicationCas => "PublicationCas",
    }
}
impl GitDriver {
    /// An id with no journal, live or compacted, refuses with the exact cause
    /// `git-operation-unknown`: no attempt exists under it, so a caller may
    /// start one. Every other read failure keeps its own cause.
    pub fn inspect_operation(&self, repo: &RepoHandle, id: &str) -> Result<Value> {
        let unknown = |e: &wal::WalError| matches!(e, wal::WalError::Io(io) if io.kind() == std::io::ErrorKind::NotFound);
        let wal = match Wal::open_existing(repo.common_dir(), wal::OsFileSystem) {
            Ok(wal) => wal,
            Err(e) if unknown(&e) => return Err(failure("git-operation-unknown")),
            Err(e) => return Err(failure(e)),
        };
        if let Some(c) = wal.compacted(id).map_err(failure)? {
            let outcome = c.outcome().map_err(failure)?;
            let compact_kind = match &outcome {
                wal::Outcome::Restore { .. } => Some("Restore"),
                wal::Outcome::Land { .. } => Some("Land"),
                wal::Outcome::Transfer { .. } => Some("RemoteTransfer"),
                wal::Outcome::ConfigApproved => Some("ConfigChange"),
                // Generic terminal outcomes do not retain the original kind.
                _ => None,
            };
            return Ok(json!({"repoIdentity":wal.repository_identity(),"operationId":id,"kind":compact_kind,"requestDigest":c.request,
                "terminal":true,"compacted":true,"outcome":outcome}));
        }
        let c = match wal.inspect(id) {
            Ok(c) => c,
            Err(e) if unknown(&e) => return Err(failure("git-operation-unknown")),
            Err(e) => return Err(failure(e)),
        };
        Ok(
            json!({"repoIdentity":wal.repository_identity(),"operationId":id,"kind":kind(&c.intent().kind),"requestDigest":c.intent().request_digest,"intent":c.intent(),"terminal":c.outcome().is_some(),"compacted":false,"outcome":c.outcome(),"phase":c.last_state()}),
        )
    }
    pub fn list_pending(&self, repo: &RepoHandle, bound: usize) -> Result<Value> {
        let wal = Wal::open_existing(repo.common_dir(), wal::OsFileSystem).map_err(failure)?;
        let scan = wal.scan(bound).map_err(failure)?;
        let mut operations = vec![];
        for e in &scan.entries {
            if let Some(error) = &e.error {
                return Err(failure(format!(
                    "git-wal-unreadable: {}: {error}",
                    e.operation_id
                )));
            }
            if !e.terminal {
                operations.push(self.inspect_operation(repo, &e.operation_id)?);
            }
        }
        Ok(json!({"operations":operations,"complete":scan.complete}))
    }
    /// Publication delegates through its caller-held seal; it cannot be inferred
    /// from a supervisor lock. No network request is replayed here.
    pub fn reconcile_operation(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        writer: &str,
        id: &str,
        publication: Option<&PublicationPort<'_>>,
    ) -> Result<Value> {
        let wal = Wal::open_existing(repo.common_dir(), wal::OsFileSystem).map_err(failure)?;
        if let Some(c) = wal.compacted(id).map_err(failure)? {
            return value(c.outcome().map_err(failure)?);
        }
        let c = wal.inspect(id).map_err(failure)?;
        match &c.intent().kind {
            OperationKind::Land(_) => value(self.recover_land(repo, held, writer, id)?),
            OperationKind::ScopedCommit(_) => {
                value(self.recover_scoped_commit(repo, held, writer, id)?)
            }
            OperationKind::Sync(_) => value(self.inspect_sync(repo, held, writer, id)?),
            OperationKind::Restore(_) => value(self.recover_restore(repo, held, writer, id)?),
            OperationKind::WorktreeCreate { .. }
            | OperationKind::WorktreeMove { .. }
            | OperationKind::WorktreeRemove { .. } => {
                self.repair_worktree_registration(repo, held, id)?;
                self.inspect_operation(repo, id)
            }
            OperationKind::ConfigChange(change) => {
                if !held.is_empty() { return Err(failure("config-recovery-caller-loans-refused")); }
                // repo-config is already rank 80 and is the resource authority
                // for both writers and recoverers. Do not acquire a peer leaf.
                match self.recover_config_change(repo, id, change) {
                    Ok(()) => self.inspect_operation(repo, id),
                    Err(e) => Err(e),
                }
            },
            OperationKind::RefUpdate { .. } | OperationKind::RefDelete => {
                value(self.recover_ref_operation(repo, held, writer, id)?)
            }
            OperationKind::RemoteFetch { .. } | OperationKind::RemotePush { .. } => {
                value(self.recover_transfer(repo, held, writer, id)?)
            }
            OperationKind::PublicationCas => value(
                publication
                    .ok_or_else(|| failure("publication-borrow-unavailable"))?
                    .recover(repo, id)?,
            ),
        }
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn unknown_payload_refuses_with_its_name() {
        let error =
            serde_json::from_str::<super::OperationKind>(r#"{"FuturePayload":{}}"#).unwrap_err();
        assert!(error.to_string().contains("FuturePayload"));
    }
}
