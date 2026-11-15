//! Open Git incidents of one repository: the model behind `fgos git status|recover`, `fgos init` and the doctor's
//! Git rows. Repository trust, the journal and Recovery policy stay in the driver; this module composes what the
//! driver reports into one answer and one recovery pass, so the host and the Node addon serve the same bytes.
//!
//! Reading changes nothing. Recovery settles an interrupted Land, ScopedCommit or remote transfer through the
//! driver's `reconcile_operation`, under each kind's own locks, and never deletes a worktree, a lock or a ref.
use crate::invocation_root::{read_repo_facts, realpath_or_self, RepoFacts};
use crate::wal::{self, Wal};
use crate::{plain_path, GitDriver, OperationError, RepoHandle, ResolveRepo, WorktreeIssue};
use serde::Serialize;
use serde_json::{json, Value};
use std::path::{Path, PathBuf};

/// How many journal entries one read looks at.
const SCAN_BOUND: usize = 100_000;

/// The kinds of operation `recover` settles; anything else is left to its own door.
const RECOVERABLE_KINDS: [&str; 3] = ["Land", "ScopedCommit", "RemoteTransfer"];

/// Causes that mean a writer other than the caller started the chain.
const AUTHORITY_MISMATCH_CAUSES: [&str; 3] = [
    "land-authority-mismatch",
    "commit-authority-mismatch",
    "remote-authority-mismatch",
];

/// Why a fact could not be read: the driver's structured refusal, or the text of a plain failure.
#[derive(Debug)]
pub enum FactError {
    Operation(OperationError),
    Plain(String),
}

impl FactError {
    /// What a part that could not be read answers in place: the driver's cause, or the plain text.
    pub fn cause(&self) -> &str {
        match self {
            Self::Operation(error) => &error.cause,
            Self::Plain(text) => text,
        }
    }
}

impl From<OperationError> for FactError {
    fn from(error: OperationError) -> Self {
        Self::Operation(error)
    }
}

fn plain(error: impl std::fmt::Display) -> FactError {
    FactError::Plain(error.to_string())
}

/// What the journal of a repository holds. A repository nothing was ever journalled in has no journal to scan.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JournalFacts {
    pub initialized: bool,
    pub complete: bool,
    pub pending_count: usize,
    pub retained_bytes: u64,
    pub retained_chains: usize,
    pub oldest_retained_at_ms: Option<u64>,
    pub ledger_entries: usize,
    pub ledger_capacity_warning: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ledger_bytes: Option<u64>,
    pub oldest_unresolved: Option<OldestUnresolved>,
    pub errors: Vec<String>,
}

/// The oldest operation still unresolved and when it was last written.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OldestUnresolved {
    pub operation_id: String,
    pub unix_millis: String,
}

fn unix_millis(time: std::time::SystemTime) -> u128 {
    time.duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
}

/// The journal facts of `repo`, never initializing a journal and never acquiring a lock.
pub fn journal_facts(repo: &RepoHandle) -> Result<JournalFacts, FactError> {
    match std::fs::symlink_metadata(repo.common_dir().join("fgos/git")) {
        Ok(_) => {}
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            return Ok(JournalFacts {
                initialized: false,
                complete: true,
                pending_count: 0,
                retained_bytes: 0,
                retained_chains: 0,
                oldest_retained_at_ms: None,
                ledger_entries: 0,
                ledger_capacity_warning: false,
                ledger_bytes: None,
                oldest_unresolved: None,
                errors: Vec::new(),
            });
        }
        Err(error) => return Err(plain(error)),
    }
    let journal = Wal::open_existing(repo.common_dir(), wal::OsFileSystem).map_err(plain)?;
    let scan = journal.scan(SCAN_BOUND).map_err(plain)?;
    Ok(JournalFacts {
        initialized: true,
        complete: scan.complete,
        pending_count: scan.unresolved,
        retained_bytes: scan.retained_bytes,
        retained_chains: scan.retained_terminal,
        oldest_retained_at_ms: scan.oldest_retained.map(|time| unix_millis(time) as u64),
        ledger_entries: scan.ledger_entries,
        ledger_capacity_warning: scan.ledger_capacity_warning,
        ledger_bytes: Some(scan.ledger_bytes),
        oldest_unresolved: scan
            .oldest_unresolved
            .map(|(operation_id, time)| OldestUnresolved {
                operation_id,
                unix_millis: unix_millis(time).to_string(),
            }),
        errors: scan
            .entries
            .into_iter()
            .filter_map(|entry| entry.error)
            .collect(),
    })
}

/// The native Git locks a crash left behind: the repository's own lock files, and the `candidate.lock` a crash
/// inside a reachability-pin delete leaves beside an operation's pin. Sorted.
pub fn native_lock_names(repo: &RepoHandle) -> Vec<String> {
    let mut locks = ["config.lock", "packed-refs.lock", "shallow.lock"]
        .iter()
        .filter(|name| std::fs::symlink_metadata(repo.common_dir().join(name)).is_ok())
        .map(|name| (*name).to_owned())
        .collect::<Vec<_>>();
    if std::fs::symlink_metadata(repo.git_dir().join("index.lock")).is_ok() {
        locks.push("index.lock".to_owned());
    }
    let pins = Path::new("refs/fgos/git-operations");
    if let Ok(operations) = std::fs::read_dir(repo.common_dir().join(pins)) {
        for operation in operations.flatten() {
            let lock = pins.join(operation.file_name()).join("candidate.lock");
            if std::fs::symlink_metadata(repo.common_dir().join(&lock)).is_ok() {
                locks.push(lock.to_string_lossy().replace('\\', "/"));
            }
        }
    }
    locks.sort();
    locks
}

/// What the worktree registrations and the worktree operations still open say.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorktreeFacts {
    pub issues: Vec<WorktreeIssue>,
    pub pending_operations: Vec<Value>,
}

/// The worktree findings of `repo`: orphaned administrative directories and unfinished worktree operations.
/// Read-only and independent of worktree recovery, so a custody diagnostic can add a row without touching either.
pub fn worktree_recovery_facts(
    driver: &GitDriver,
    repo: &RepoHandle,
) -> Result<WorktreeFacts, FactError> {
    let issues = driver.inspect_worktree_orphans(repo)?;
    let mut pending_operations = Vec::new();
    match std::fs::symlink_metadata(repo.common_dir().join("fgos/git")) {
        Ok(_) => {
            let journal =
                Wal::open_existing(repo.common_dir(), wal::OsFileSystem).map_err(plain)?;
            for chain in journal.active(SCAN_BOUND).map_err(plain)? {
                if matches!(
                    chain.intent().kind,
                    wal::OperationKind::WorktreeCreate { .. }
                        | wal::OperationKind::WorktreeMove { .. }
                        | wal::OperationKind::WorktreeRemove { .. }
                ) {
                    pending_operations.push(
                        json!({"operationId": chain.last().operation_id, "kind": chain.intent().kind}),
                    );
                }
            }
        }
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
        Err(error) => return Err(plain(error)),
    }
    Ok(WorktreeFacts {
        issues,
        pending_operations,
    })
}

/// One part of a status: what was read, or why it could not be.
#[derive(Debug, Serialize)]
#[serde(untagged)]
pub enum Part<T> {
    Read(T),
    Failed { error: String },
}

impl<T> From<Result<T, FactError>> for Part<T> {
    fn from(result: Result<T, FactError>) -> Self {
        match result {
            Ok(read) => Self::Read(read),
            Err(error) => Self::Failed {
                error: error.cause().to_owned(),
            },
        }
    }
}

/// The repository a status describes.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RepositoryFacts {
    pub not_a_repository: bool,
    pub common_dir: String,
    pub layout: String,
}

/// How long and how much the journal keeps of finished operations.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Retention {
    pub retained_chains: usize,
    pub oldest_retained_at_ms: Option<u64>,
    pub retained_bytes: u64,
    pub ledger_capacity_warning: bool,
}

/// The journal as a status reports it.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JournalSummary {
    pub initialized: bool,
    pub complete: bool,
    pub pending_count: usize,
    pub errors: Vec<String>,
    pub retention: Retention,
}

impl From<JournalFacts> for JournalSummary {
    fn from(journal: JournalFacts) -> Self {
        Self {
            initialized: journal.initialized,
            complete: journal.complete,
            pending_count: journal.pending_count,
            errors: journal.errors,
            retention: Retention {
                retained_chains: journal.retained_chains,
                oldest_retained_at_ms: journal.oldest_retained_at_ms,
                retained_bytes: journal.retained_bytes,
                ledger_capacity_warning: journal.ledger_capacity_warning,
            },
        }
    }
}

/// An operation the journal has not finished.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PendingOperation {
    pub operation_id: Value,
    pub kind: Value,
    pub writer: Value,
}

/// Finished Land operations whose candidate worktree and pins are still held.
#[derive(Debug, Serialize)]
pub struct RetainedLand {
    pub candidates: Value,
    pub complete: Value,
}

/// A repository's open incidents, one part per kind. A part that cannot be read answers `{ error }` in place and
/// hides no other part.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StatusReport {
    pub repository: Part<RepositoryFacts>,
    pub journal: Part<JournalSummary>,
    pub pending_operations: Part<Vec<PendingOperation>>,
    pub retained_land: Part<RetainedLand>,
    pub worktrees: Part<WorktreeFacts>,
    pub native_locks: Part<Vec<String>>,
    pub merge_in_progress: Option<String>,
}

/// The repository of a status that found no repository.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NotARepository {
    pub not_a_repository: bool,
}

/// What `status` answers.
#[derive(Debug, Serialize)]
#[serde(untagged)]
pub enum GitStatus {
    NotARepository { repository: NotARepository },
    Report(Box<StatusReport>),
}

/// The main checkout of the repository `cwd` sits in, or `cwd` itself when it sits in none or Git cannot say.
fn main_checkout_of(cwd: &Path) -> PathBuf {
    match read_repo_facts(cwd) {
        Ok(RepoFacts::Repository {
            trusted_main: Some(main),
            ..
        }) => realpath_or_self(&main),
        _ => cwd.to_path_buf(),
    }
}

/// The driver and repository of `cwd` under `state_root`, or none when `cwd` sits in no repository.
fn open(
    state_root: &Path,
    cwd: &Path,
    main: &Path,
) -> Result<Option<(GitDriver, RepoHandle)>, FactError> {
    let driver = GitDriver::new(state_root)?;
    Ok(match driver.resolve_repo(cwd, main)? {
        ResolveRepo::Repository(repo) => Some((driver, repo)),
        ResolveRepo::NotARepository => None,
    })
}

/// The commit a merge in the checkout stopped at; none when no merge is in progress or it cannot be read.
fn merge_head(driver: &GitDriver, repo: &RepoHandle) -> Option<String> {
    driver
        .resolve_commit_ref(repo, "MERGE_HEAD")
        .ok()
        .flatten()
        .map(|oid| oid.as_str().to_owned())
}

/// The operations the journal has not finished, as the driver lists them. A repository nothing was ever
/// journalled in has no journal to list; any other listing failure is the caller's to see.
fn pending(driver: &GitDriver, repo: &RepoHandle) -> Result<Vec<Value>, FactError> {
    match driver.list_pending(repo, SCAN_BOUND) {
        Ok(listing) => Ok(listing["operations"]
            .as_array()
            .cloned()
            .unwrap_or_default()),
        Err(error) => {
            if journal_facts(repo)?.initialized {
                Err(error.into())
            } else {
                Ok(Vec::new())
            }
        }
    }
}

/// Every open Git incident of the repository `cwd` sits in. Read-only.
pub fn read_git_status(state_root: &Path, cwd: &Path) -> GitStatus {
    let main = main_checkout_of(cwd);
    let unreadable = |error: FactError| {
        let say = || error.cause().to_owned();
        GitStatus::Report(Box::new(StatusReport {
            repository: Part::Failed { error: say() },
            journal: Part::Failed { error: say() },
            pending_operations: Part::Failed { error: say() },
            retained_land: Part::Failed { error: say() },
            worktrees: Part::Failed { error: say() },
            native_locks: Part::Failed { error: say() },
            merge_in_progress: None,
        }))
    };
    let (driver, repo) = match open(state_root, cwd, &main) {
        Ok(Some(opened)) => opened,
        Ok(None) => {
            return GitStatus::NotARepository {
                repository: NotARepository {
                    not_a_repository: true,
                },
            }
        }
        Err(error) => return unreadable(error),
    };
    let journal = match journal_facts(&repo) {
        Ok(journal) => journal,
        Err(error) => return unreadable(error),
    };
    let pending_operations = pending(&driver, &repo).map(|operations| {
        operations
            .iter()
            .map(|operation| PendingOperation {
                operation_id: operation["operationId"].clone(),
                kind: operation["kind"].clone(),
                writer: operation["intent"]["writerIdentity"].clone(),
            })
            .collect()
    });
    let retained_land = driver
        .list_retained_land(&repo, SCAN_BOUND)
        .map(|listing| RetainedLand {
            candidates: listing["candidates"].clone(),
            complete: listing["complete"].clone(),
        })
        .map_err(FactError::from);
    GitStatus::Report(Box::new(StatusReport {
        repository: Part::Read(RepositoryFacts {
            not_a_repository: false,
            common_dir: plain_path(repo.common_dir()).to_string_lossy().into_owned(),
            layout: format!("{:?}", repo.layout()),
        }),
        journal: Part::Read(journal.into()),
        pending_operations: pending_operations.into(),
        retained_land: retained_land.into(),
        worktrees: worktree_recovery_facts(&driver, &repo).into(),
        native_locks: Part::Read(native_lock_names(&repo)),
        merge_in_progress: merge_head(&driver, &repo),
    }))
}

/// An interrupted operation recovery left alone, with why.
#[derive(Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Kept {
    pub operation_id: String,
    pub cause: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub writer: Option<String>,
}

/// What one recovery pass did. `merge_in_progress` and `next` appear only when a merge is pending: the command
/// that ends it is named, never run.
#[derive(Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitRecovered {
    pub recovered: Vec<String>,
    pub kept: Vec<Kept>,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub merge_in_progress: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next: Option<String>,
}

fn kept_text(kept: &Kept) -> String {
    let authority = AUTHORITY_MISMATCH_CAUSES.contains(&kept.cause.as_str());
    let writer = kept.writer.as_deref().unwrap_or("");
    let settled_by = if kept.cause == "remote-authority-mismatch" {
        ", and the next event sync settles it"
    } else {
        ""
    };
    let only = if authority {
        format!("; only its writer {writer} can recover it{settled_by}")
    } else {
        String::new()
    };
    format!("{} ({}{only})", kept.operation_id, kept.cause)
}

/// Recovers every interrupted Land, ScopedCommit and remote transfer of the repository `cwd` sits in, under each
/// kind's own locks. A chain that was attempted is recovered only by the writer that started it, so the caller's
/// writer is asked for the main checkout's `.fgos` directory, once, and only when something is pending. Nothing is
/// merged, re-published or deleted.
pub fn recover_git_operations(
    state_root: &Path,
    cwd: &Path,
    writer_for: &dyn Fn(&Path) -> String,
) -> Result<GitRecovered, FactError> {
    let main = main_checkout_of(cwd);
    let Some((driver, repo)) = open(state_root, cwd, &main)? else {
        return Ok(recovered(Vec::new(), Vec::new(), None));
    };
    let operations: Vec<Value> = pending(&driver, &repo)?
        .into_iter()
        .filter(|operation| {
            operation["kind"]
                .as_str()
                .is_some_and(|kind| RECOVERABLE_KINDS.contains(&kind))
        })
        .collect();
    let mut settled = Vec::new();
    let mut kept = Vec::new();
    if !operations.is_empty() {
        let writer = writer_for(&plain_path(repo.trusted_main_root()).join(".fgos"));
        for operation in &operations {
            let id = operation["operationId"].as_str().unwrap_or_default();
            match driver.reconcile_operation(&repo, Vec::new(), &writer, id, None) {
                Ok(_) => settled.push(id.to_owned()),
                Err(error) => kept.push(Kept {
                    operation_id: id.to_owned(),
                    cause: error.cause,
                    writer: operation["intent"]["writerIdentity"]
                        .as_str()
                        .map(str::to_owned),
                }),
            }
        }
    }
    Ok(recovered(settled, kept, merge_head(&driver, &repo)))
}

fn recovered(settled: Vec<String>, kept: Vec<Kept>, merge: Option<String>) -> GitRecovered {
    let message = if settled.is_empty() && kept.is_empty() {
        "no interrupted Land, ScopedCommit or remote transfer operation".to_owned()
    } else {
        let mut parts = Vec::new();
        if !settled.is_empty() {
            parts.push(format!(
                "recovered interrupted Git operations: {}",
                settled.join(", ")
            ));
        }
        if !kept.is_empty() {
            parts.push(format!(
                "warning: Git operations kept for recovery: {}",
                kept.iter().map(kept_text).collect::<Vec<_>>().join("; ")
            ));
        }
        parts.join("; ")
    };
    GitRecovered {
        recovered: settled,
        kept,
        message,
        next: merge
            .as_ref()
            .map(|sha| format!("fgos main-checkout-reset --sha {sha} --confirm")),
        merge_in_progress: merge,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn kept(id: &str, cause: &str, writer: &str) -> Kept {
        Kept {
            operation_id: id.to_owned(),
            cause: cause.to_owned(),
            writer: Some(writer.to_owned()),
        }
    }

    #[test]
    fn nothing_to_recover_says_so_and_a_merge_names_the_command_that_ends_it() {
        let nothing = recovered(Vec::new(), Vec::new(), None);
        assert_eq!(
            nothing.message,
            "no interrupted Land, ScopedCommit or remote transfer operation"
        );
        assert_eq!((nothing.merge_in_progress, nothing.next), (None, None));
        let merging = recovered(Vec::new(), Vec::new(), Some("abc123".to_owned()));
        assert_eq!(merging.merge_in_progress.as_deref(), Some("abc123"));
        assert_eq!(
            merging.next.as_deref(),
            Some("fgos main-checkout-reset --sha abc123 --confirm")
        );
    }

    #[test]
    fn a_kept_operation_names_its_cause_and_the_writer_only_when_authority_is_the_cause() {
        let message = recovered(
            vec!["done-1".to_owned()],
            vec![
                kept("land-1", "land-authority-mismatch", "w-a"),
                kept("push-1", "remote-authority-mismatch", "w-b"),
                kept("commit-1", "checkout-custody-busy", "w-c"),
            ],
            None,
        )
        .message;
        assert_eq!(
            message,
            "recovered interrupted Git operations: done-1; warning: Git operations kept for recovery: \
             land-1 (land-authority-mismatch; only its writer w-a can recover it); \
             push-1 (remote-authority-mismatch; only its writer w-b can recover it, and the next event sync settles it); \
             commit-1 (checkout-custody-busy)"
        );
    }
}
