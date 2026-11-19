//! What settlement needs from the machine, behind ports: the checkout it compares before and after a run, and
//! where it records a provider stop. The real adapters sit on the doors that own those facts.

use std::path::{Path, PathBuf};

use fgos_git::{
    DiffScope, DiffSides, GitDriver, Ignored, InspectCursor, RepoHandle, ResolveRepo, Submodules,
    Untracked,
};
use serde_json::Value;

use crate::accounts::{Accounts, FaultRecord, SystemHost};

const PAGE: usize = 4096;

/// The checkout of a run as settlement reads it; every read answers "nothing" instead of failing, the way a
/// settlement must keep going when git cannot be asked.
pub trait SettlementGit {
    /// The commit `HEAD` names in `dir`.
    fn head(&self, dir: &Path) -> Option<String>;
    /// The dirty paths in `dir`, untracked files one by one, `.fgos` left out, a rename as both halves.
    fn status_files(&self, dir: &Path) -> Vec<String>;
    /// The paths that differ between two commits, `.fgos` left out.
    fn committed_diff_files(&self, dir: &Path, before: &str, after: &str) -> Vec<String>;
}

/// Where a provider stop is recorded on the account that ran the attempt.
pub trait ProviderFaultSink {
    /// Record one classified fault; the quarantine it set, or `None` when it set none.
    fn record(&self, fault: &FaultRecordInput<'_>, runtime_dir: Option<&Path>) -> Option<Value>;
}

/// One classified provider fault on an account, as settlement hands it to a [`ProviderFaultSink`].
pub struct FaultRecordInput<'a> {
    pub provider: &'a str,
    pub account_id: &'a str,
    pub fault: &'a Value,
    pub provider_signal: Option<&'a Value>,
    pub run_id: Option<&'a str>,
    pub assignment_id: Option<&'a str>,
}

/// Where a worker's friction is recorded: the friction door.
pub trait FrictionSink {
    fn record(
        &self,
        root: &Path,
        input: fgos_observe::friction::FrictionInput,
    ) -> Result<(), String>;
}

fn is_store_path(path: &str) -> bool {
    path == ".fgos" || path.starts_with(".fgos/")
}

/// The Git door of `fgos-git`, opened on the state root.
pub struct GitDoor {
    driver: GitDriver,
}

impl GitDoor {
    pub fn new(state_root: &Path) -> Result<Self, String> {
        GitDriver::new(state_root)
            .map(|driver| Self { driver })
            .map_err(|e| format!("{:?}", e.cause))
    }

    fn open(&self, dir: &Path) -> Option<RepoHandle> {
        match self.driver.resolve_repo(dir, dir).ok()? {
            ResolveRepo::Repository(repo) => Some(repo),
            _ => None,
        }
    }
}

impl SettlementGit for GitDoor {
    fn head(&self, dir: &Path) -> Option<String> {
        let repo = self.open(dir)?;
        let oid = self.driver.resolve_commit_ref(&repo, "HEAD").ok()??;
        Some(oid.as_str().to_string())
    }

    fn status_files(&self, dir: &Path) -> Vec<String> {
        let Some(repo) = self.open(dir) else {
            return Vec::new();
        };
        let mut out: Vec<String> = Vec::new();
        let mut cursor: Option<InspectCursor> = None;
        loop {
            let Ok(page) = self.driver.status(
                &repo,
                Untracked::All,
                Submodules::IgnoreDirty,
                Ignored::Excluded,
                cursor,
                PAGE,
            ) else {
                return Vec::new();
            };
            for entry in page.entries {
                let path = String::from_utf8_lossy(&entry.path)
                    .trim_end_matches('/')
                    .to_string();
                if !path.is_empty() && !is_store_path(&path) && !out.contains(&path) {
                    out.push(path);
                }
            }
            match page.next_cursor {
                Some(next) => cursor = Some(next),
                None => return out,
            }
        }
    }

    fn committed_diff_files(&self, dir: &Path, before: &str, after: &str) -> Vec<String> {
        let Some(repo) = self.open(dir) else {
            return Vec::new();
        };
        let resolve = |name: &str| self.driver.resolve_commit_ref(&repo, name).ok().flatten();
        let (Some(b), Some(a)) = (resolve(before), resolve(after)) else {
            return Vec::new();
        };
        let mut out = Vec::new();
        let mut cursor: Option<InspectCursor> = None;
        loop {
            let Ok(page) = self.driver.diff(
                &repo,
                DiffSides::Objects(&b, &a),
                &DiffScope::default(),
                cursor,
                PAGE,
            ) else {
                return Vec::new();
            };
            for entry in page.entries {
                let path = String::from_utf8_lossy(&entry.path).into_owned();
                if !is_store_path(&path) {
                    out.push(path);
                }
            }
            match page.next_cursor {
                Some(next) => cursor = Some(next),
                None => return out,
            }
        }
    }
}

/// The accounts of a machine, recording a fault under the provider-state lock in `lock_root`.
pub struct AccountsFaultSink {
    lock_root: PathBuf,
}

impl AccountsFaultSink {
    pub fn new(lock_root: impl Into<PathBuf>) -> Self {
        Self {
            lock_root: lock_root.into(),
        }
    }

    /// The lock root of this machine.
    pub fn machine() -> Self {
        Self::new(fgos_holder_lock::lock_root())
    }
}

impl ProviderFaultSink for AccountsFaultSink {
    fn record(&self, input: &FaultRecordInput<'_>, runtime_dir: Option<&Path>) -> Option<Value> {
        let host = SystemHost::new();
        let accounts = match runtime_dir {
            Some(dir) => Accounts::new(dir, self.lock_root.clone(), &host),
            None => Accounts::from_environment(&host).ok()?,
        };
        accounts
            .record_account_fault(&FaultRecord {
                provider: input.provider,
                account_id: input.account_id,
                fault: input.fault.clone(),
                provider_signal: input.provider_signal.cloned(),
                run_id: input.run_id,
                assignment_id: input.assignment_id,
                source: "run",
            })
            .ok()
            .flatten()
    }
}

/// The friction store of `fgos-observe`.
pub struct ObserveFrictionSink;

impl FrictionSink for ObserveFrictionSink {
    fn record(
        &self,
        root: &Path,
        input: fgos_observe::friction::FrictionInput,
    ) -> Result<(), String> {
        fgos_observe::friction::record(root, input).map(|_| ())
    }
}
