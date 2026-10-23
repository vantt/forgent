//! Exact, custody-backed commit transaction. Hooks run once, via Git.
use crate::{
    driver::Output,
    refs::Authority,
    wal::{self, Begin, Intent, OperationKind, Outcome, Phase, Tip, Wal},
    *,
};
use fgos_holder_lock::{BorrowedHandle, Handle, LockScope, Wait};
use serde::{Deserialize, Serialize};
use std::{
    collections::{BTreeMap, BTreeSet},
    fs,
    path::Path,
};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CutoverGrant {
    pub exact_paths: Vec<String>,
    pub legacy_ref_oid: String,
    pub seal_digest: String,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CommitRequest {
    pub writes: Vec<String>,
    pub message: String,
    pub cutover_grant: Option<CutoverGrant>,
}
/// Observation-only view of a request persisted in the WAL. Requests written
/// by earlier releases may carry fields that new requests refuse (the retired
/// `legacyEvents` declaration); recovery needs only the message, so it reads
/// that and ignores the rest instead of failing to reconcile a retained attempt.
#[derive(Deserialize)]
struct StoredCommitRequest {
    message: String,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CheckpointRequest {
    pub files: Vec<String>,
    pub message: String,
}
/// Capture before producer launch. Keep this value for commit-only retry.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CommitBaseline {
    pub head: String,
    pub reference: String,
    pub worktree: String,
    pub authority: String,
    pub dirty: Vec<(String, String)>,
}
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommitResult {
    pub warnings: Vec<String>,
    pub status: ResultCode,
    pub oid: Option<Oid>,
    pub files: Vec<String>,
    pub operation_id: String,
    pub pre_existing_in_scope: Vec<String>,
}
pub(crate) fn paths(bytes: &[u8]) -> Result<Vec<String>> {
    bytes
        .split(|b| *b == 0)
        .filter(|p| !p.is_empty())
        .map(|p| {
            fgos_write_scope::path_text(p)
                .map(str::to_owned)
                .map_err(failure)
        })
        .collect()
}
/// Splits `show --raw -t -r -z --format=%H%x00%T%x00%P%x00`: three NUL-ended
/// header fields, the format's own terminator, then (only when the commit
/// changed anything) Git's single newline separator and the raw diff records.
/// Any other shape is refused rather than guessed.
fn split_observation(bytes: &[u8]) -> Result<(String, String, String, &[u8])> {
    let invalid = || recovery("commit-header-invalid");
    let mut rest = bytes;
    let mut header = Vec::with_capacity(3);
    for _ in 0..3 {
        let end = rest.iter().position(|b| *b == 0).ok_or_else(invalid)?;
        header.push(std::str::from_utf8(&rest[..end]).map_err(|_| invalid())?.to_owned());
        rest = &rest[end + 1..];
    }
    let rest = rest.strip_prefix(&[0]).ok_or_else(invalid)?;
    let rest = match rest.strip_prefix(b"\n") {
        Some(records) => records,
        None if rest.is_empty() => rest,
        None => return Err(invalid()),
    };
    let [observed, tree, parents]: [String; 3] = header.try_into().map_err(|_| invalid())?;
    Ok((observed, tree, parents, rest))
}
/// One record of `--raw -t -r -z --no-abbrev --no-renames`: a changed file or
/// tree with its mode and object on the new side.
#[derive(Debug, PartialEq, Eq)]
struct RawEntry {
    old_mode: u32,
    new_mode: u32,
    new_oid: String,
    path: String,
}
const TREE_MODE: u32 = 0o040000;
const GITLINK_MODE: u32 = 0o160000;
impl RawEntry {
    /// A path that is (or was) not a directory: what `--name-only` lists.
    fn is_file(&self) -> bool {
        [self.old_mode, self.new_mode].iter().any(|m| *m != 0 && *m != TREE_MODE)
    }
    /// The object this record created in this repository: a blob or a tree,
    /// never a deletion or a gitlink's commit in another repository.
    fn new_object(&self) -> Option<&str> {
        (self.new_mode != 0 && self.new_mode != GITLINK_MODE).then_some(self.new_oid.as_str())
    }
}
fn raw_entries(bytes: &[u8]) -> Result<Vec<RawEntry>> {
    let invalid = || recovery("commit-header-invalid");
    let mut rest = bytes;
    let mut entries = Vec::new();
    while !rest.is_empty() {
        let mut field = || -> Result<&[u8]> {
            let end = rest.iter().position(|b| *b == 0).ok_or_else(invalid)?;
            let (head, tail) = (&rest[..end], &rest[end + 1..]);
            rest = tail;
            Ok(head)
        };
        let meta = std::str::from_utf8(field()?).map_err(|_| invalid())?.strip_prefix(':').ok_or_else(invalid)?.to_owned();
        let path = fgos_write_scope::path_text(field()?).map(str::to_owned).map_err(failure)?;
        let [old_mode, new_mode, _old_oid, new_oid, status]: [&str; 5] =
            meta.split(' ').collect::<Vec<_>>().try_into().map_err(|_| invalid())?;
        if status.len() != 1 || new_oid.is_empty() || !new_oid.bytes().all(|b| b.is_ascii_hexdigit()) {
            return Err(invalid());
        }
        let mode = |m: &str| u32::from_str_radix(m, 8).map_err(|_| invalid());
        entries.push(RawEntry { old_mode: mode(old_mode)?, new_mode: mode(new_mode)?, new_oid: new_oid.to_owned(), path });
    }
    Ok(entries)
}
/// Makes the commit's new loose objects and its ref's directory chain durable
/// in one concurrent batch; packed objects need nothing. Called before the
/// receipt is installed, so a receipt never names an object whose file or
/// directory entry a power cut can still lose.
fn sync_commit_effects(
    repo: &RepoHandle,
    reference: &RefName,
    created: &[Oid],
    filesystem: &dyn wal::FileSystem,
) -> Result<()> {
    std::thread::scope(|scope| {
        let objects = scope.spawn(|| crate::objects::sync_loose_objects(repo.common_dir(), created, true));
        let refs = crate::refs::sync_refs(repo, reference);
        let objects = objects
            .join()
            .unwrap_or_else(|_| Err(std::io::Error::other("object sync panicked")));
        refs?;
        objects.map_err(failure)
    })?;
    for _ in created {
        filesystem.checkpoint("object-durable").map_err(failure)?;
    }
    Ok(())
}
/// Makes the staged blobs and trees durable (file, fan-out, `objects/` in one
/// concurrent batch) before `git commit` can move the branch to name them.
fn sync_staged_objects(repo: &RepoHandle, staged: &[Oid], filesystem: &dyn wal::FileSystem) -> Result<()> {
    crate::objects::sync_loose_objects(repo.common_dir(), staged, true).map_err(failure)?;
    for _ in staged {
        filesystem.checkpoint("staged-object-durable").map_err(failure)?;
    }
    Ok(())
}
/// A Git walk over an unacknowledged tip failed: the tip names an object the
/// repository cannot read. The branch is never reset and the chain stays open
/// as evidence; recovery is the owner's.
fn unreadable_objects(mut error: OperationError) -> OperationError {
    if error.cause == "checkout-command-failed" {
        error.code = ResultCode::RecoveryRequired;
        error.cause = "commit-objects-unreadable".into();
    }
    error
}
/// The blobs and trees a staged change makes the commit name, root tree included.
fn staged_object_ids(repo: &RepoHandle, tree: &str, staged: &[RawEntry]) -> Result<Vec<Oid>> {
    object_ids(
        repo,
        std::iter::once(tree.to_owned())
            .chain(staged.iter().filter_map(RawEntry::new_object).map(str::to_owned)),
    )
}
const MAX_HEAL_ROUNDS: usize = 8;
/// Every object id Git printed in `text`, whatever its sentence.
fn oids_in(repo: &RepoHandle, text: &[u8]) -> Vec<Oid> {
    let ids: BTreeSet<&[u8]> = text
        .split(|b| !b.is_ascii_hexdigit())
        .filter(|t| t.len() == 40 || t.len() == 64)
        .collect();
    ids.into_iter()
        .filter_map(|t| std::str::from_utf8(t).ok())
        .filter_map(|t| Oid::parse(&t.to_ascii_lowercase(), repo.object_format()).ok())
        .collect()
}
fn object_ids(repo: &RepoHandle, oids: impl IntoIterator<Item = String>) -> Result<Vec<Oid>> {
    oids.into_iter()
        .collect::<BTreeSet<_>>()
        .into_iter()
        .map(|oid| Oid::parse(&oid, repo.object_format()).map_err(failure))
        .collect()
}
pub(crate) fn root(repo: &RepoHandle) -> Result<&Path> {
    repo.work_tree
        .as_deref()
        .ok_or_else(|| failure("checkout-required"))
}
pub(crate) fn scope<'a>(repo: &RepoHandle, held: Vec<BorrowedHandle<'a>>) -> Result<LockScope<'a>> {
    require_lock_scope_platform()?;
    let mut scope = LockScope::seeded(held).map_err(failure)?;
    if scope
        .holding()
        .map_err(failure)?
        .iter()
        .any(|h| h.rank >= 55)
    {
        return Err(failure("lock-order-violation"));
    }
    if root(repo)? == repo.trusted_main_root() {
        if scope.handle("dispatch-cwd").is_some() {
            return Err(failure("git-dual-borrow-unavailable"));
        }
        if let Some(h) = scope.handle("main-checkout") {
            if h.path()
                != repo
                    .trusted_main_root()
                    .join(".fgos/locks/main-checkout.lock")
            {
                return Err(failure("main-checkout-authority-mismatch"));
            }
        } else {
            scope
                .acquire(
                    "main-checkout",
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
        }
    } else {
        let lease = scope
            .handle("dispatch-cwd")
            .ok_or_else(|| failure("checkout-custody-required"))?;
        #[cfg(unix)]
        if lease.path() != crate::refs::custody_lock_path(repo, root(repo)?)? {
            return Err(failure("checkout-custody-stale"));
        }
    }
    Ok(scope)
}
pub(crate) fn handle<'a>(scope: &'a LockScope<'_>, repo: &RepoHandle) -> Result<&'a Handle> {
    scope.validate().map_err(failure)?;
    scope
        .handle(if root(repo)? == repo.trusted_main_root() {
            "main-checkout"
        } else {
            "dispatch-cwd"
        })
        .ok_or_else(|| failure("checkout-authority-required"))
}
pub(crate) fn binding(handle: &Handle) -> Result<String> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        let m = fs::metadata(handle.path()).map_err(failure)?;
        Ok(format!("{}:{}", m.dev(), m.ino()))
    }
    #[cfg(not(unix))]
    {
        let _ = handle;
        Err(failure("git-lockscope-unavailable-windows"))
    }
}
/// New chains bind the directory identity used by custody; legacy chains keep
/// their path-only resource and are accepted only under their original lease.
pub(crate) fn checkout_resources(repo: &RepoHandle) -> Result<Vec<String>> {
    #[cfg(unix)]
    let custody = crate::refs::custody_lock_path(repo, root(repo)?)?;
    #[cfg(not(unix))]
    let custody = std::path::PathBuf::new();
    Ok(vec![format!(
        "worktree:{}:custody:{}",
        root(repo)?.display(),
        custody.display()
    )])
}
pub(crate) fn compact_matches(
    compact: &wal::CompactReceipt,
    intent: &Intent,
    repo: &RepoHandle,
) -> Result<bool> {
    if compact.matches(intent)? {
        return Ok(true);
    }
    let mut legacy = intent.clone();
    legacy.resource_set = vec![legacy_resource(repo)?];
    compact.matches(&legacy).map_err(failure)
}
/// A path of the fgOS store, which no checkout commit or resolver grant carries.
pub(crate) fn is_store_path(path: &str) -> bool {
    path == ".fgos" || path.starts_with(".fgos/")
}
/// The resource chains named before custody bound the directory identity.
fn legacy_resource(repo: &RepoHandle) -> Result<String> {
    Ok(format!("worktree:{}", root(repo)?.display()))
}
/// Whether a chain was taken for this checkout, under its custody resource or
/// the older plain-worktree one.
fn in_checkout(intent: &Intent, repo: &RepoHandle) -> Result<bool> {
    Ok(intent.resource_set == checkout_resources(repo)? || intent.resource_set == [legacy_resource(repo)?])
}
/// The one authority question every checkout port asks of a chain it did not
/// just begin: it answers to this checkout and this custody and, where the
/// caller knows them, to this worktree path and writer. Each port names its
/// own refusal.
pub(crate) fn authority_gate(
    repo: &RepoHandle,
    scope: &LockScope<'_>,
    intent: &Intent,
    (worktree, writer): (Option<&str>, Option<&str>),
    cause: &'static str,
) -> Result<()> {
    let here = root(repo)?.to_string_lossy();
    if !in_checkout(intent, repo)?
        || worktree.is_some_and(|w| w != here)
        || writer.is_some_and(|w| w != intent.writer_identity)
        || intent.authority_binding != binding(handle(scope, repo)?)?
    {
        return Err(failure(cause));
    }
    Ok(())
}
/// Git's own markers of an operation left half done, in probe order.
const NATIVE_STATE: [&str; 9] = [
    "index.lock",
    "HEAD.lock",
    "MERGE_HEAD",
    "CHERRY_PICK_HEAD",
    "REVERT_HEAD",
    "rebase-merge",
    "rebase-apply",
    "sequencer",
    "BISECT_START",
];
fn present(git_dir: &Path, name: &str) -> Result<bool> {
    match fs::symlink_metadata(git_dir.join(name)) {
        Ok(_) => Ok(true),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(false),
        Err(e) => Err(failure(e)),
    }
}
/// The first native-state marker present, skipping `tolerated` names.
pub(crate) fn native_state_probe(git_dir: &Path, tolerated: &[&str]) -> Result<Option<&'static str>> {
    for name in NATIVE_STATE {
        if !tolerated.contains(&name) && present(git_dir, name)? {
            return Ok(Some(name));
        }
    }
    Ok(None)
}
/// An `index.lock` no known process owns is inspected, never judged here.
pub(crate) fn require_no_index_lock(git_dir: &Path) -> Result<()> {
    if present(git_dir, "index.lock")? {
        return Err(recovery(crate::native_lock::UNOWNED_INDEX_LOCK));
    }
    Ok(())
}
/// Refuses on any native-state marker: an unowned `index.lock` as recovery,
/// any other as the port's own `otherwise`.
pub(crate) fn require_no_native_state(
    git_dir: &Path,
    tolerated: &[&str],
    otherwise: impl FnOnce(&str) -> OperationError,
) -> Result<()> {
    match native_state_probe(git_dir, tolerated)? {
        None => Ok(()),
        Some("index.lock") => Err(recovery(crate::native_lock::UNOWNED_INDEX_LOCK)),
        Some(name) => Err(otherwise(name)),
    }
}
/// What a terminal rejection answers: an unknown effect needs recovery, any
/// other cause is a plain refusal.
fn rejected(cause: &str) -> OperationError {
    if cause.ends_with("effect-unknown") {
        recovery(cause)
    } else {
        failure(cause)
    }
}
impl CommitResult {
    pub(crate) fn committed(
        repo: &RepoHandle,
        observed: &str,
        files: Vec<String>,
        contract_violation: bool,
        (id, pre_existing_in_scope): (&str, Vec<String>),
    ) -> Result<Self> {
        Ok(Self {
            warnings: vec![],
            status: if contract_violation {
                ResultCode::CommittedButContractViolation
            } else {
                ResultCode::Committed
            },
            oid: Some(Oid::parse(observed, repo.object_format()).map_err(failure)?),
            files,
            operation_id: id.into(),
            pre_existing_in_scope,
        })
    }
    pub(crate) fn unchanged(id: &str, pre_existing_in_scope: Vec<String>) -> Self {
        Self {
            warnings: vec![],
            status: ResultCode::Unchanged,
            oid: None,
            files: vec![],
            operation_id: id.into(),
            pre_existing_in_scope,
        }
    }
}
impl GitDriver {
    /// Admission uses Publication's terminal ledger and never scans compacted
    /// history. Interrupted pre-attempt work has no ref effect to replay.
    pub(crate) fn admit_checkout(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        wal: &Wal,
        id: &str,
    ) -> Result<Vec<String>> {
        let mut warnings = vec![];
        let resources = checkout_resources(repo)?;
        let legacy = legacy_resource(repo)?;
        let current_binding = binding(handle(scope, repo)?)?;
        for mut chain in wal.retained(100_000)? {
            let worktree = match &chain.intent().kind {
                OperationKind::ScopedCommit(p) => &p.worktree,
                OperationKind::Sync(p) => &p.worktree,
                _ => continue,
            };
            if worktree != &root(repo)?.to_string_lossy() {
                continue;
            }
            let foreign = if chain.intent().resource_set == vec![legacy.clone()] {
                chain.intent().authority_binding != current_binding
            } else {
                chain.intent().resource_set != resources
            };
            if foreign {
                // Current custody proves that this directory is a different
                // checkout. Close only its old WAL, never touch its index or
                // replay an effect. Existing terminal causes stay unchanged.
                if chain.outcome().is_none() {
                    chain = wal
                        .append(
                            &chain,
                            Phase::Outcome(Outcome::CommitRejected {
                                cause: if matches!(
                                    *chain.last_state(),
                                    Phase::Intent(_) | Phase::Prepared
                                ) {
                                    "foreign-checkout-abandoned"
                                } else {
                                    "foreign-checkout-effect-unknown"
                                }
                                .into(),
                            }),
                        )?;
                }
                if let Err(error) = (|| -> Result<()> {
                    if matches!(chain.intent().kind, OperationKind::Sync(_)) {
                        crate::refs::release_pin(self, repo, handle(scope, repo)?, wal, &chain)?;
                        chain = wal.inspect(&chain.last().operation_id)?;
                    }
                    wal.compact(
                        &chain,
                        &WalReader { driver: self, repo },
                        &Authority {
                            scope,
                            binding: chain.intent().authority_binding.clone(),
                        },
                    )?;
                    Ok(())
                })() {
                    warnings.push(format!("checkout-compaction-deferred: {error:?}"));
                }
                continue;
            }
            if chain.last().operation_id == id {
                continue;
            }
            wal::PublicationAuthority::validate_publication_borrow(
                &Authority {
                    scope,
                    binding: binding(handle(scope, repo)?)?,
                },
                chain.intent(),
            )?;
            if chain.outcome().is_none()
                && matches!(chain.last_state(), Phase::Intent(_) | Phase::Prepared)
            {
                fgos_holder_lock::validate_quiescent(handle(scope, repo)?).map_err(failure)?;
                if let OperationKind::ScopedCommit(payload) = &chain.intent().kind {
                    let baseline: CommitBaseline =
                        serde_json::from_str(&payload.baseline).map_err(failure)?;
                    if self.checkout_text(repo, scope, &["rev-parse", "HEAD"])? == baseline.head
                        && self.staged(repo, scope)? == payload.paths
                    {
                        self.stage_paths(repo, scope, &["reset", "-q", "HEAD"], &payload.paths)?;
                    }
                }
                chain = wal
                    .append(&chain, Phase::Outcome(Outcome::AbandonedBeforeAttempt))?;
            }
            if chain.outcome().is_some() {
                self.compact_checkout(repo, scope, wal, &chain)?;
            } else {
                return Err(recovery("resource-recovery-required"));
            }
        }
        crate::refs::admission(wal, id, &resources)?;
        Ok(warnings)
    }
    pub(crate) fn compact_checkout(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        wal: &Wal,
        chain: &wal::Chain,
    ) -> Result<()> {
        if chain.outcome().is_none() {
            return Ok(());
        }
        let mut terminal = wal.inspect(&chain.last().operation_id)?;
        wal::PublicationAuthority::validate_publication_borrow(
            &Authority {
                scope,
                binding: binding(handle(scope, repo)?)?,
            },
            terminal.intent(),
        )?;
        if matches!(chain.intent().kind, OperationKind::Sync(_)) {
            // A rejected commit still owns the merge until abort.
            if self.merge_head(repo, scope)?.is_some() {
                return Err(recovery("sync-rejected-merge-recovery-required"));
            }
            crate::refs::release_pin(self, repo, handle(scope, repo)?, wal, &terminal)?;
            terminal = wal.inspect(&chain.last().operation_id)?;
        }
        let authority = Authority {
            scope,
            binding: binding(handle(scope, repo)?)?,
        };
        wal.compact(&terminal, &WalReader { driver: self, repo }, &authority)?;
        Ok(())
    }
    pub(crate) fn compact_checkout_warning(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        wal: &Wal,
        chain: &wal::Chain,
    ) -> Vec<String> {
        self.compact_checkout(repo, scope, wal, chain)
            .err()
            .map(|e| vec![format!("checkout-compaction-deferred: {e:?}")])
            .unwrap_or_default()
    }
    /// Observe immutable commits at HEAD and in the branch reflog. Never issue
    /// another commit, and never infer rejection from HEAD equality (ABA).
    pub(crate) fn observe_checkout_commit(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        wal: &Wal,
        chain: &wal::Chain,
    ) -> Result<Option<(String, bool)>> {
        let (reference, parents, tree, message) = match &chain.intent().kind {
            OperationKind::ScopedCommit(payload) => {
                let baseline: CommitBaseline =
                    serde_json::from_str(&payload.baseline).map_err(failure)?;
                let request: StoredCommitRequest =
                    serde_json::from_str(&payload.request).map_err(failure)?;
                (
                    baseline.reference,
                    vec![baseline.head],
                    payload.tree.clone(),
                    request.message,
                )
            }
            OperationKind::Sync(payload) => {
                let Phase::SyncCommitAttempt { tree } = chain.last_state() else {
                    return Err(recovery("sync-state-recovery-required"));
                };
                (
                    payload
                        .reference
                        .clone()
                        .ok_or_else(|| recovery("sync-reference-unrecorded"))?,
                    vec![payload.head.clone(), payload.target.clone()],
                    tree.clone(),
                    payload.message.clone(),
                )
            }
            _ => return Err(failure("not-checkout-commit-operation")),
        };
        let now = self.checkout_text(repo, scope, &["rev-parse", "HEAD"])?;
        // Admission forbids a later checkout chain while an attempt is open.
        // Cross-check retained peers as well, without trusting record age or
        // directory timestamps. A peer at this baseline makes message-only
        // attribution ambiguous; a strictly older baseline does not.
        let mut newest = true;
        for peer in wal.retained(100_000)? {
            let worktree = match &peer.intent().kind {
                OperationKind::ScopedCommit(p) => &p.worktree,
                OperationKind::Sync(p) => &p.worktree,
                _ => continue,
            };
            if peer.last().operation_id == chain.last().operation_id
                || worktree != &root(repo)?.to_string_lossy()
            {
                continue;
            }
            if peer.intent().authority_binding != chain.intent().authority_binding
                || !in_checkout(peer.intent(), repo)?
            {
                continue;
            }
            let Tip::Oid(prior) = &peer.intent().expected else {
                newest = false;
                break;
            };
            if *prior == parents[0]
                || !self.ancestry(
                    repo,
                    &Oid::parse(prior, repo.object_format()).map_err(failure)?,
                    &Oid::parse(&parents[0], repo.object_format()).map_err(failure)?,
                )?
            {
                newest = false;
                break;
            }
        }
        if self.checkout_text(repo, scope, &["symbolic-ref", "-q", "HEAD"])? != reference {
            return Err(recovery("checkout-reference-changed"));
        }
        // One bounded walk returns immutable headers and full verbatim messages.
        // Reflog-only evidence is never proof of an effect on the current ref.
        let raw = self.checkout_bytes(
            repo,
            scope,
            &[
                "log",
                "-g",
                "-n",
                "1024",
                "--format=%H%x00%P%x00%T%x00%B%x00",
                &reference,
            ],
        ).map_err(unreadable_objects)?;
        let mut candidates = Vec::new();
        let fields: Vec<_> = raw.split(|b| *b == 0).collect();
        let mut seen = BTreeSet::new();
        let mut passed_tip = false;
        for row in fields.as_chunks::<4>().0 {
            let oid = std::str::from_utf8(row[0])
                .map_err(failure)?
                .trim_start_matches('\n')
                .to_owned();
            if oid == parents[0] {
                if passed_tip {
                    break;
                }
                continue;
            }
            passed_tip = true;
            if !seen.insert(oid.clone()) {
                continue;
            }
            let actual_parents: Vec<_> = std::str::from_utf8(row[1])
                .map_err(failure)?
                .split_whitespace()
                .map(str::to_owned)
                .collect();
            if actual_parents == parents {
                candidates.push((
                    oid,
                    std::str::from_utf8(row[2]).map_err(failure)?.to_owned(),
                    row[3].to_vec(),
                ));
            }
        }
        let expected_message = if message.ends_with('\n') {
            message
        } else {
            format!("{message}\n")
        };
        // Exhaust exact tree evidence before trying the weaker message proof.
        for exact in [true, false] {
            for (oid, actual_tree, actual_message) in &candidates {
                if if exact {
                    actual_tree == &tree
                } else {
                    newest && actual_message == expected_message.as_bytes()
                } {
                    if !self.ancestry(
                        repo,
                        &Oid::parse(oid, repo.object_format()).map_err(failure)?,
                        &Oid::parse(&now, repo.object_format()).map_err(failure)?,
                    )? {
                        return Err(recovery(format!(
                            "commit-effect-unknown: reflog-only-candidate:{oid}"
                        )));
                    }
                    return Ok(Some((oid.clone(), actual_tree != &tree)));
                }
            }
        }
        Ok(None)
    }
    /// Explicit observe-only recovery. Custody excludes a live cooperative
    /// performer; native index residue or ambiguous HEAD preserves the attempt.
    pub fn recover_scoped_commit(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        writer: &str,
        id: &str,
        filesystem: &dyn wal::FileSystem,
    ) -> Result<Outcome> {
        let operation_repo = self.checkout_repository(repo)?;
        let repo = &operation_repo;
        let mut scope = scope(repo, held)?;
        let wal = Wal::open(repo)?;
        crate::recovery::leaf(&mut scope, repo)?;
        if let Some(compact) = wal.compacted(id)? {
            let intent = Intent::of(
                &wal,
                repo,
                writer,
                (
                    OperationKind::ScopedCommit(Box::new(wal::ScopedCommitIntent {
                        worktree: root(repo)?.to_string_lossy().into(),
                        baseline: String::new(),
                        request: String::new(),
                        paths: vec![],
                        tree: compact.expected.clone(),
                        cutover_grant: None,
                    })),
                    compact.request.clone(),
                ),
                (checkout_resources(repo)?, binding(handle(&scope, repo)?)?),
                (Tip::Oid(compact.expected.clone()), Tip::Oid(compact.next.clone())),
            );
            if !compact_matches(&compact, &intent, repo)? {
                return Err(failure("commit-authority-mismatch"));
            }
            return compact.outcome().map_err(failure);
        }
        if !wal.known_id(id)? { return Err(failure("unknown-scoped-commit-operation")); }
        let chain = wal.inspect(id)?;
        let OperationKind::ScopedCommit(payload) = &chain.intent().kind else {
            return Err(failure("not-scoped-commit-operation"));
        };
        authority_gate(
            repo,
            &scope,
            chain.intent(),
            (Some(&payload.worktree), Some(writer)),
            "commit-authority-mismatch",
        )?;
        if let Some(outcome) = chain.outcome() {
            return Ok(outcome.clone());
        }
        fgos_holder_lock::validate_quiescent(handle(&scope, repo)?).map_err(failure)?;
        let outcome = if matches!(chain.last_state(), Phase::Intent(_) | Phase::Prepared) {
            let baseline: CommitBaseline =
                serde_json::from_str(&payload.baseline).map_err(failure)?;
            if self.checkout_text(repo, &scope, &["rev-parse", "HEAD"])? == baseline.head
                && self.staged(repo, &scope)? == payload.paths
            {
                self.stage_paths(repo, &scope, &["reset", "-q", "HEAD"], &payload.paths)?;
            }
            Outcome::AbandonedBeforeAttempt
        } else {
            require_no_index_lock(&repo.git_dir)?;
            let baseline: CommitBaseline =
                serde_json::from_str(&payload.baseline).map_err(failure)?;
            if let Some((observed, tree_changed)) =
                self.observe_checkout_commit(repo, &scope, &wal, &chain)?
            {
                let files = self
                    .changed_paths(repo, &scope, &baseline.head, &observed)
                    .map_err(unreadable_objects)?;
                let created = object_ids(
                    repo,
                    String::from_utf8(self.checkout_bytes(
                        repo,
                        &scope,
                        &["rev-list", "--objects", "--end-of-options", &observed, &format!("^{}", baseline.head)],
                    ).map_err(unreadable_objects)?)
                    .map_err(failure)?
                    .lines()
                    .filter_map(|line| line.split(' ').next())
                    .map(str::to_owned)
                    .collect::<Vec<_>>(),
                )?;
                sync_commit_effects(
                    repo,
                    &RefName::parse(&baseline.reference).map_err(failure)?,
                    &created,
                    filesystem,
                )?;
                Outcome::Commit {
                    observed,
                    contract_violation: tree_changed || files != payload.paths,
                }
            } else if self.checkout_text(repo, &scope, &["rev-parse", "HEAD"])? == baseline.head {
                self.stage_paths(repo, &scope, &["reset", "-q", "HEAD"], &payload.paths)?;
                Outcome::CommitRejected {
                    cause: "commit-effect-unknown".into(),
                }
            } else {
                return Err(recovery("commit-effect-unknown"));
            }
        };
        let terminal = wal
            .append(&chain, Phase::Outcome(outcome.clone()))?;
        let _ = self.compact_checkout_warning(repo, &scope, &wal, &terminal);
        Ok(outcome)
    }
    pub(crate) fn checkout_call(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        args: &[&str],
        input: &[u8],
        hooks: bool,
    ) -> Result<Output> {
        let h = handle(scope, repo)?;
        #[cfg(unix)]
        if h.name() == "dispatch-cwd"
            && h.path() != crate::refs::custody_lock_path(repo, root(repo)?)?
        {
            return Err(failure("checkout-custody-stale"));
        }
        self.checkout_call_borrowed(repo, h, args, input, hooks)
    }
    pub(crate) fn checkout_bytes(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        args: &[&str],
    ) -> Result<Vec<u8>> {
        let out = self.checkout_call(repo, scope, args, &[], false)?;
        if out.success {
            Ok(out.stdout)
        } else {
            Err(out.error("checkout-command-failed"))
        }
    }
    pub(crate) fn checkout_text(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        args: &[&str],
    ) -> Result<String> {
        let bytes = self.checkout_bytes(repo, scope, args)?;
        Ok(std::str::from_utf8(&bytes)
            .map_err(failure)?
            .trim_end_matches('\n')
            .into())
    }
    pub(crate) fn stage_paths(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        verb: &[&str],
        selected: &[String],
    ) -> Result<()> {
        if selected.is_empty() {
            return Ok(());
        }
        let input: Vec<u8> = selected
            .iter()
            .flat_map(|p| p.as_bytes().iter().copied().chain([0]))
            .collect();
        let mut args = vec!["--literal-pathspecs"];
        args.extend_from_slice(verb);
        args.extend(["--pathspec-from-file=-", "--pathspec-file-nul"]);
        let out = self.checkout_call(repo, scope, &args, &input, false)?;
        if out.success {
            Ok(())
        } else {
            Err(out.error("literal-path-staging-failed"))
        }
    }
    /// Stages the selection until the objects the commit will name are all
    /// readable. `core.fsync=loose-object` makes Git fsync each loose file
    /// before it links the name, so a cut leaves a temp file, never an empty
    /// object. An object an earlier cut left empty keeps its name, though, and
    /// Git, finding the name taken, never rewrites it: remove it and stage
    /// again so Git writes it from the worktree, or refuse, never name it.
    fn stage_healed(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        head: &str,
        selected: &[String],
    ) -> Result<(String, Vec<RawEntry>)> {
        // Each round removes at least one corrupt file; a tree chain is shallow.
        for _ in 0..MAX_HEAL_ROUNDS {
            let corrupt = match self.stage_selected(repo, scope, head, selected) {
                Ok((tree, staged)) => {
                    let ids = staged_object_ids(repo, &tree, &staged)?;
                    let corrupt = crate::objects::corrupt_loose_objects(repo.common_dir(), &ids)
                        .map_err(failure)?;
                    if corrupt.is_empty() {
                        return Ok((tree, staged));
                    }
                    corrupt
                }
                // Listing a corrupt tree fails inside Git, which names the object.
                Err(error) if error.cause == "checkout-command-failed" => {
                    let named = oids_in(repo, &error.stderr);
                    let corrupt = crate::objects::corrupt_loose_objects(repo.common_dir(), &named)
                        .map_err(failure)?;
                    if corrupt.is_empty() {
                        return Err(error);
                    }
                    corrupt
                }
                Err(error) => return Err(error),
            };
            self.heal_corrupt_objects(repo, scope, selected, &corrupt)?;
        }
        Err(failure("object-file-corrupt"))
    }
    /// Stages the selected paths, writes the index tree and lists the staged
    /// change against `head`: the tree and every blob and tree the commit will
    /// name, after checking the staged files are exactly the selection.
    fn stage_selected(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        head: &str,
        selected: &[String],
    ) -> Result<(String, Vec<RawEntry>)> {
        self.stage_paths(
            repo,
            scope,
            &["-c", "core.fsync=loose-object", "add", "-A"],
            selected,
        )?;
        let tree = self.checkout_text(
            repo,
            scope,
            &["-c", "core.fsync=loose-object", "write-tree"],
        )?;
        let staged = raw_entries(&self.checkout_bytes(
            repo,
            scope,
            &["diff-tree", "--raw", "-t", "-r", "--no-abbrev", "--no-renames", "-z", head, &tree],
        )?)?;
        if staged.iter().filter(|e| e.is_file()).map(|e| &e.path).ne(selected.iter()) {
            return Err(failure("staged-set-mismatch"));
        }
        Ok((tree, staged))
    }
    /// Removes the corrupt loose files and drops the selected paths from the
    /// index (which also drops the cached trees above them), so the next
    /// staging pass hashes the worktree again and Git writes the objects it
    /// would otherwise skip. Which path a corrupt tree belongs to is unknown
    /// while Git cannot read it, hence every selected path.
    fn heal_corrupt_objects(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        selected: &[String],
        corrupt: &[Oid],
    ) -> Result<()> {
        for oid in corrupt {
            let hex = oid.as_str();
            let file = repo.common_dir().join("objects").join(&hex[..2]).join(&hex[2..]);
            fs::remove_file(&file).map_err(|_| failure("object-file-corrupt"))?;
        }
        // A path the worktree no longer has is already a deletion in the index.
        let checkout = root(repo)?;
        let present: Vec<u8> = selected
            .iter()
            .filter(|p| fs::symlink_metadata(checkout.join(p)).is_ok())
            .flat_map(|p| p.as_bytes().iter().copied().chain([0]))
            .collect();
        if present.is_empty() {
            return Ok(());
        }
        let out = self.checkout_call(
            repo,
            scope,
            &["update-index", "--force-remove", "-z", "--stdin"],
            &present,
            false,
        )?;
        if out.success {
            Ok(())
        } else {
            Err(out.error("literal-path-staging-failed"))
        }
    }
    /// The files Git lists between two commits.
    pub(crate) fn changed_paths(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        from: &str,
        to: &str,
    ) -> Result<Vec<String>> {
        paths(&self.checkout_bytes(
            repo,
            scope,
            &["diff", "--name-only", "--no-renames", "-z", from, to],
        )?)
    }
    /// `ls-files -v` split into the skip-worktree paths and the other tracked ones.
    pub(crate) fn tracked_inventory(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
    ) -> Result<(BTreeSet<String>, BTreeSet<String>)> {
        let (mut skipped, mut tracked) = (BTreeSet::new(), BTreeSet::new());
        for entry in paths(&self.checkout_bytes(repo, scope, &["ls-files", "-v", "-z"])?)? {
            let set = if entry.starts_with("S ") || entry.starts_with("s ") {
                &mut skipped
            } else {
                &mut tracked
            };
            set.insert(entry[2..].to_owned());
        }
        Ok((skipped, tracked))
    }
    /// `git commit` with the message on stdin; the operation id rides in config,
    /// where the hook reads it.
    pub(crate) fn commit_message(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        id: &str,
        message: &str,
    ) -> Result<Output> {
        let context = format!("fgos.operationId={id}");
        self.checkout_call(
            repo,
            scope,
            &durable_args(&["-c", &context, "commit", "-q", "--cleanup=verbatim", "-F", "-"]),
            message.as_bytes(),
            true,
        )
    }
    pub(crate) fn staged(&self, repo: &RepoHandle, scope: &LockScope<'_>) -> Result<Vec<String>> {
        paths(&self.checkout_bytes(
            repo,
            scope,
            &[
                "diff",
                "--cached",
                "--name-only",
                "--no-renames",
                "--no-relative",
                "-z",
            ],
        )?)
    }
    pub(crate) fn merge_head(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
    ) -> Result<Option<String>> {
        let out = self.checkout_call(
            repo,
            scope,
            &["rev-parse", "-q", "--verify", "MERGE_HEAD"],
            &[],
            false,
        )?;
        if out.success {
            Ok(Some(
                std::str::from_utf8(&out.stdout)
                    .map_err(failure)?
                    .trim_end_matches('\n')
                    .into(),
            ))
        } else if out.code == Some(1) {
            Ok(None)
        } else {
            Err(out.error("merge-head-unreadable"))
        }
    }
    pub(crate) fn dirty_paths(&self, repo: &RepoHandle, scope: &LockScope<'_>) -> Result<Vec<String>> {
        let mut result = paths(&self.checkout_bytes(
            repo,
            scope,
            &[
                "diff",
                "--name-only",
                "--no-renames",
                "--no-relative",
                "--ignore-submodules=dirty",
                "-z",
            ],
        )?)?;
        result.extend(paths(&self.checkout_bytes(
            repo,
            scope,
            &["ls-files", "--others", "--exclude-standard", "-z"],
        )?)?);
        // Git reports an untracked embedded repository with a trailing slash;
        // its index entry is the directory's literal name (a gitlink).
        for p in &mut result { if p.ends_with('/') { p.pop(); } }
        result.sort();
        result.dedup();
        Ok(result)
    }
    pub fn checkout_state(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
    ) -> Result<serde_json::Value> {
        let operation_repo = self.checkout_repository(repo)?;
        let repo = &operation_repo;
        let scope = scope(repo, held)?;
        Ok(
            serde_json::json!({"head": self.checkout_text(repo, &scope, &["rev-parse", "HEAD"])?,
            "mergeHead": self.merge_head(repo, &scope)?, "unmerged": self.unmerged(repo, &scope)?, "staged": self.staged(repo, &scope)?,
            "changed": self.dirty_paths(repo, &scope)?}),
        )
    }
    pub fn preflight_commit(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        sync: Option<(&str, &str)>,
    ) -> Result<CommitBaseline> {
        let operation_repo = self.checkout_repository(repo)?;
        let repo = &operation_repo;
        let scope = scope(repo, held)?;
        let mut own = BTreeSet::new();
        if let Some((writer, id)) = sync {
            let wal = Wal::open_existing(repo.common_dir(), wal::OsFileSystem)?;
            let state = self.continue_sync_scoped(repo, &scope, &wal, writer, id, false)?;
            if state.state == "in-progress" || state.state == "rejected-open" {
                own.extend(state.resolver_grant);
                let chain = wal.inspect(id)?;
                for record in chain.records() {
                    if let Phase::SyncState { staged, .. } = &record.phase {
                        own.extend(staged.iter().cloned());
                    }
                }
            }
        }
        if self.merge_head(repo, &scope)?.is_some() && own.is_empty() {
            return Err(failure("foreign-merge-head"));
        }
        if self.staged(repo, &scope)?.iter().any(|p| !own.contains(p)) {
            return Err(failure("foreign-staged-index"));
        }
        let head = self.checkout_text(repo, &scope, &["rev-parse", "HEAD"])?;
        let reference = self.checkout_text(repo, &scope, &["symbolic-ref", "-q", "HEAD"])?;
        let dirty = self
            .dirty_paths(repo, &scope)?
            .into_iter()
            .filter(|p| !own.contains(p))
            .map(|p| Ok((p.clone(), content_digest(root(repo)?, &p)?)))
            .collect::<Result<_>>()?;
        Ok(CommitBaseline {
            head,
            reference,
            worktree: root(repo)?.to_string_lossy().into_owned(),
            authority: binding(handle(&scope, repo)?)?,
            dirty,
        })
    }
    /// `object-durable` is reached through `filesystem` once for each new
    /// object, before the receipt is installed.
    #[allow(clippy::too_many_arguments)]
    pub fn scoped_commit(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        baseline: &CommitBaseline,
        request: &CommitRequest,
        writer: &str,
        id: &str,
        filesystem: &dyn wal::FileSystem,
    ) -> Result<CommitResult> {
        let operation_repo = self.checkout_repository(repo)?;
        let repo = &operation_repo;
        let scope = scope(repo, held)?;
        self.commit_scoped(repo, &scope, baseline, request, writer, id, filesystem)
    }
    #[allow(clippy::too_many_arguments)]
    fn commit_scoped(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        baseline: &CommitBaseline,
        request: &CommitRequest,
        writer: &str,
        id: &str,
        filesystem: &dyn wal::FileSystem,
    ) -> Result<CommitResult> {
        if request.message.is_empty()
            || request.message.contains('\0')
            || request.message.len() > 1024 * 1024
        {
            return Err(failure("invalid-commit-message"));
        }
        let writes = fgos_write_scope::canonicalize_all(&request.writes).map_err(failure)?;
        if baseline.worktree != root(repo)?.to_string_lossy()
            || baseline.authority != binding(handle(scope, repo)?)?
        {
            return Err(failure("checkout-custody-stale"));
        }
        let pre_existing = baseline
            .dirty
            .iter()
            .filter_map(
                |(p, digest)| match fgos_write_scope::matches(p.as_bytes(), &writes) {
                    Ok(true) => match content_digest(root(repo).ok()?, p) {
                        Ok(now) if &now != digest => Some(Ok(p.clone())),
                        Ok(_) => None,
                        Err(e) => Some(Err(e)),
                    },
                    Ok(false) => None,
                    Err(e) => Some(Err(failure(e))),
                },
            )
            .collect::<Result<Vec<_>>>()?;
        let wal = Wal::open(repo)?;
        if let Some(compact) = wal.compacted(id)? {
            let mut intent = Intent::of(
                &wal,
                repo,
                writer,
                (
                    OperationKind::ScopedCommit(Box::new(wal::ScopedCommitIntent {
                        worktree: baseline.worktree.clone(),
                        baseline: String::new(),
                        request: String::new(),
                        paths: vec![],
                        tree: baseline.head.clone(),
                        cutover_grant: None,
                    })),
                    wal::canonical_digest(&(baseline, request, writer))?,
                ),
                (checkout_resources(repo)?, binding(handle(scope, repo)?)?),
                (Tip::Oid(baseline.head.clone()), Tip::Oid(baseline.head.clone())),
            );
            let ordinary = compact_matches(&compact, &intent, repo)?;
            intent.request_digest =
                wal::canonical_digest(&(baseline, request, writer, "no-op"))?;
            let noop = compact_matches(&compact, &intent, repo)?;
            if !ordinary && !noop {
                return Err(failure("operation-id-reused"));
            }
            return match compact.outcome()? {
                Outcome::Commit {
                    observed,
                    contract_violation,
                } => CommitResult::committed(
                    repo,
                    &observed,
                    self.changed_paths(repo, scope, &baseline.head, &observed)?,
                    contract_violation,
                    (id, pre_existing),
                ),
                Outcome::AbandonedBeforeAttempt if noop => {
                    Ok(CommitResult::unchanged(id, pre_existing))
                }
                Outcome::CommitRejected { cause } => Err(rejected(&cause)),
                _ => Err(failure("commit-rejected")),
            };
        }
        if wal.known_id(id)? {
            let old = wal.inspect(id)?;
            authority_gate(repo, scope, old.intent(), (None, None), "commit-authority-mismatch")?;
            let OperationKind::ScopedCommit(payload) = &old.intent().kind else {
                return Err(failure("operation-id-reused"));
            };
            if payload.baseline != serde_json::to_string(baseline).map_err(failure)?
                || payload.request != serde_json::to_string(request).map_err(failure)?
                || old.intent().writer_identity != writer
            {
                return Err(failure("operation-id-reused"));
            }
            // A ref-moving attempt is never issued twice, even after ABA.
            return match old.outcome() {
                Some(Outcome::AbandonedBeforeAttempt) if payload.paths.is_empty() => {
                    Ok(CommitResult::unchanged(id, pre_existing))
                }
                Some(Outcome::Commit {
                    observed,
                    contract_violation,
                }) => CommitResult::committed(
                    repo,
                    observed,
                    self.changed_paths(repo, scope, &baseline.head, observed)?,
                    *contract_violation,
                    (id, pre_existing),
                ),
                Some(Outcome::CommitRejected { cause }) => Err(rejected(cause)),
                Some(Outcome::AbandonedBeforeAttempt) => Err(failure("operation-id-reused")),
                _ => Err(recovery("commit-attempt-recovery-required")),
            };
        }
        let admission_warnings = self.admit_checkout(repo, scope, &wal, id)?;
        if self.merge_head(repo, scope)?.is_some() {
            return Err(failure("foreign-merge-head"));
        }
        if !self.staged(repo, scope)?.is_empty() {
            return Err(failure("foreign-staged-index"));
        }
        if self.checkout_text(repo, scope, &["rev-parse", "HEAD"])? != baseline.head
            || self.checkout_text(repo, scope, &["symbolic-ref", "-q", "HEAD"])?
                != baseline.reference
        {
            return Err(failure("source-baseline-stale"));
        }
        let excluded: BTreeSet<_> = baseline.dirty.iter().map(|(p, _)| p).collect();
        let mut selected = vec![];
        let dirty_paths = self.dirty_paths(repo, scope)?;
        for path in dirty_paths.iter().cloned() {
            if !is_store_path(&path)
                && !excluded.contains(&path)
                && fgos_write_scope::matches(path.as_bytes(), &writes).map_err(failure)?
            {
                selected.push(path);
            }
        }
        if let Some(grant) = &request.cutover_grant {
            if root(repo)? != repo.trusted_main_root() {
                return Err(failure("cutover-main-required"));
            }
            self.validate_cutover_seal(repo, scope, grant)?;
            for path in &grant.exact_paths {
                if !path.starts_with(".fgos/")
                    || fgos_write_scope::canonicalize(path).map_err(failure)? != *path
                    || path.contains('*')
                    || fs::symlink_metadata(root(repo)?.join(path)).is_ok()
                {
                    return Err(failure("cutover-exact-deletions-required"));
                }
                selected.push(path.clone());
            }
            // The fence marks every cutover, including a baseline-only repository
            // that never had an event directory to delete.
            if fs::symlink_metadata(root(repo)?.join(".fgos/events"))
                .is_ok_and(|m| m.is_file() && !m.file_type().is_symlink())
            {
                let fence = ".fgos/events".to_string();
                let tracked = paths(&self.checkout_bytes(repo, scope, &["ls-files", "-z"])?)?;
                if !tracked.contains(&fence) || dirty_paths.contains(&fence) {
                    selected.push(fence);
                }
            }
        }
        selected.sort();
        selected.dedup();
        for path in &selected {
            crate::literal_repo_path(path)?;
        }
        if selected.is_empty() {
            let kind = OperationKind::ScopedCommit(Box::new(wal::ScopedCommitIntent {
                worktree: baseline.worktree.clone(),
                baseline: serde_json::to_string(baseline).map_err(failure)?,
                request: serde_json::to_string(request).map_err(failure)?,
                paths: vec![],
                tree: self.checkout_text(repo, scope, &["rev-parse", "HEAD^{tree}"])?,
                cutover_grant: None,
            }));
            let resources = checkout_resources(repo)?;
            crate::refs::admission(&wal, id, &resources)?;
            let binding = binding(handle(scope, repo)?)?;
            let intent = Intent::of(
                &wal,
                repo,
                writer,
                (kind, wal::canonical_digest(&(baseline, request, writer, "no-op"))?),
                (resources, binding.clone()),
                (Tip::Oid(baseline.head.clone()), Tip::Oid(baseline.head.clone())),
            );
            let authority = Authority { scope, binding };
            let chain = match wal.begin(id, intent, &authority)? {
                Begin::Created(c) => c,
                _ => return Err(recovery("commit-attempt-recovery-required")),
            };
            wal.append(&chain, Phase::Outcome(Outcome::AbandonedBeforeAttempt))?;
            let terminal = wal.inspect(id)?;
            let mut warnings = admission_warnings;
            warnings.extend(self.compact_checkout_warning(repo, scope, &wal, &terminal));
            return Ok(CommitResult {
                warnings,
                ..CommitResult::unchanged(id, pre_existing)
            });
        }
        // Snapshot producer bytes before staging. Clean tracked paths retain
        // only a HEAD marker; dirty, ignored and absent paths retain their state.
        let checkout = root(repo)?;
        let dirty: BTreeSet<_> = dirty_paths.into_iter().collect();
        let (skipped, tracked) = self.tracked_inventory(repo, scope)?;
        let mut saved_paths = BTreeSet::new();
        for p in dirty
            .iter()
            .cloned()
            .chain(tracked.iter().cloned())
            .chain(paths(&self.checkout_bytes(
                repo,
                scope,
                &[
                    "ls-files",
                    "--others",
                    "--ignored",
                    "--exclude-standard",
                    "-z",
                ],
            )?)?)
        {
            if fgos_write_scope::matches(p.as_bytes(), &writes).map_err(failure)? {
                saved_paths.insert(p);
            }
        }
        saved_paths.extend(selected.iter().cloned());
        saved_paths.extend(
            writes
                .iter()
                .filter(|p| !p.contains('*') && !checkout.join(p).is_dir())
                .cloned(),
        );
        // A gitlink owns the index entry, never the nested repository's bytes.
        // Git add/reset do not mutate its checkout; rollback must not remove it.
        let gitlinks: BTreeSet<_> = saved_paths.iter().filter(|p| checkout.join(p).is_dir() && checkout.join(p).join(".git").exists()).cloned().collect();
        let snapshot = saved_paths
            .into_iter()
            .filter(|p| !skipped.contains(p) && !gitlinks.contains(p))
            .map(|p| {
                let saved = if tracked.contains(&p) && !dirty.contains(&p) {
                    let metadata = fs::symlink_metadata(root(repo)?.join(&p)).map_err(failure)?;
                    SavedPath::Head(metadata.is_file().then(|| metadata.permissions()))
                } else {
                    SavedPath::capture(&root(repo)?.join(&p))?
                };
                Ok((p, saved))
            })
            .collect::<Result<BTreeMap<_, _>>>()?;
        let mut recorded_terminal = None;
        let mut prepared = (|| {
            let (tree, staged) = self.stage_healed(repo, scope, &baseline.head, &selected)?;
            // The fsync above covers what Git wrote now. An object that already
            // existed (freshened, not rewritten) and the directory entries are
            // made durable here, before `git commit` can move the branch to name
            // them, so a branch tip never names an object a power cut can lose.
            let staged_objects = staged_object_ids(repo, &tree, &staged)?;
            sync_staged_objects(repo, &staged_objects, filesystem)?;
            let kind = OperationKind::ScopedCommit(Box::new(wal::ScopedCommitIntent {
                worktree: baseline.worktree.clone(),
                baseline: serde_json::to_string(baseline).map_err(failure)?,
                request: serde_json::to_string(request).map_err(failure)?,
                paths: selected.clone(),
                tree: tree.clone(),
                cutover_grant: request.cutover_grant.clone(),
            }));
            let resources = checkout_resources(repo)?;
            crate::refs::admission(&wal, id, &resources)?;
            let authority_binding = binding(handle(scope, repo)?)?;
            let intent = Intent::of(
                &wal,
                repo,
                writer,
                (kind, wal::canonical_digest(&(baseline, request, writer))?),
                (resources, authority_binding.clone()),
                (Tip::Oid(baseline.head.clone()), Tip::Oid(baseline.head.clone())),
            );
            let authority = Authority {
                scope,
                binding: authority_binding,
            };
            let chain = match wal.begin(id, intent, &authority)? {
                Begin::Created(c) => c,
                _ => return Err(recovery("commit-attempt-recovery-required")),
            };
            let chain = wal.append(&chain, Phase::Prepared)?;
            if self.checkout_text(repo, scope, &["rev-parse", "HEAD"])? != baseline.head
                || self.checkout_text(repo, scope, &["write-tree"])? != tree
            {
                wal.append(&chain, Phase::Outcome(Outcome::AbandonedBeforeAttempt))?;
                return Err(recovery("commit-prepared-state-changed"));
            }
            let attempted = wal
                .append(
                    &chain,
                    Phase::TargetAttempt {
                        prior_target_attempt: None,
                        expected: chain.intent().expected.clone(),
                        next: chain.intent().next.clone(),
                    },
                )?;
            let out = self.commit_message(repo, scope, id, &request.message)?;
            // One immutable observation binds oid, tree, parents and the committed
            // paths together: the paths are the commit's own change against its
            // parent, which is the baseline whenever the parent check below holds.
            let observation = self.checkout_bytes(
                repo,
                scope,
                &[
                    "show",
                    "--raw",
                    "-t",
                    "-r",
                    "--no-abbrev",
                    "--no-renames",
                    "--no-relative",
                    "-z",
                    "--format=%H%x00%T%x00%P%x00",
                    "HEAD",
                ],
            )?;
            let (observed, actual_tree, parents, shown) = split_observation(&observation)?;
            if observed == baseline.head {
                // Keep the attempt durable. Retrying uses a new id after a fresh preflight.
                if !out.success {
                    let error = self.checkout_commit_failure(repo, scope, out)?;
                    wal.append(
                        &attempted,
                        Phase::Outcome(Outcome::CommitRejected { cause: error.cause.clone() }),
                    )?;
                    return Err(error);
                }
                return Err(recovery("commit-effect-unknown"));
            }
            let entries = if parents.split_whitespace().collect::<Vec<_>>()
                == vec![baseline.head.as_str()]
            {
                raw_entries(shown)?
            } else {
                raw_entries(&self.checkout_bytes(
                    repo,
                    scope,
                    &[
                        "diff",
                        "--raw",
                        "-t",
                        "-r",
                        "--no-abbrev",
                        "--no-renames",
                        "-z",
                        &baseline.head,
                        &observed,
                    ],
                )?)?
            };
            let actual: Vec<String> = entries.iter().filter(|e| e.is_file()).map(|e| e.path.clone()).collect();
            let violation = !out.success
                || actual_tree != tree
                || actual != selected
                || parents.split_whitespace().collect::<Vec<_>>()
                    != vec![baseline.head.as_str()];
            let receipt = CommitResult::committed(
                repo,
                &observed,
                actual,
                violation,
                (id, pre_existing.clone()),
            )?;
            // The commit's new loose objects and the ref's directories are made
            // durable while the receipt's own bytes are synced, and the receipt's
            // name is installed only after all finished: the receipt never exists
            // before the commit's objects and ref are durable.
            let reference = RefName::parse(&baseline.reference).map_err(failure)?;
            let created = object_ids(
                repo,
                [observed.clone(), actual_tree.clone()]
                    .into_iter()
                    .chain(entries.iter().filter_map(RawEntry::new_object).map(str::to_owned)),
            )?;
            let ref_durable = || {
                sync_commit_effects(repo, &reference, &created, filesystem)
                    .map_err(|e| std::io::Error::other(e.cause))
            };
            recorded_terminal = Some(
                wal.append_ordered(
                    &attempted,
                    Phase::Outcome(Outcome::Commit {
                        observed,
                        contract_violation: violation,
                    }),
                    Some(&ref_durable),
                    &mut || Ok(()),
                )?,
            );
            Ok(receipt)
        })();
        if let (Ok(receipt), Some(terminal)) = (&mut prepared, recorded_terminal) {
            receipt.warnings = admission_warnings;
            receipt
                .warnings
                .extend(self.compact_checkout_warning(repo, scope, &wal, &terminal));
            return prepared;
        }
        if prepared.is_err()
            && self
                .checkout_text(repo, scope, &["rev-parse", "HEAD"])
                .is_ok_and(|h| h == baseline.head)
        {
            self.checkout_bytes(repo, scope, &["reset", "-q", "HEAD"])
                .map_err(|_| recovery("commit-unstage-recovery-required"))?;
            // A hook may create another declared file that was absent from the
            // pre-commit inventory. Restore absence as well as content/mode.
            let mut restore = snapshot;
            for p in
                self.dirty_paths(repo, scope)?
                    .into_iter()
                    .chain(paths(&self.checkout_bytes(
                        repo,
                        scope,
                        &[
                            "ls-files",
                            "--others",
                            "--ignored",
                            "--exclude-standard",
                            "-z",
                        ],
                    )?)?)
            {
                let p = p.strip_suffix('/').unwrap_or(&p).to_owned();
                if !gitlinks.contains(&p) && fgos_write_scope::matches(p.as_bytes(), &writes).map_err(failure)? {
                    restore.entry(p).or_insert(SavedPath::Absent);
                }
            }
            // Attempt every restoration, even if one clean path cannot be
            // restored. Keep producer bytes on all independent paths.
            let mut failed = false;
            for (p, saved) in &restore {
                let path = root(repo)?.join(p);
                if let SavedPath::Head(mode) = saved {
                    if self
                        .stage_paths(
                            repo,
                            scope,
                            &["restore", "--source=HEAD", "--worktree"],
                            std::slice::from_ref(p),
                        )
                        .is_err()
                    {
                        failed = true;
                    }
                    if let Some(mode) = mode {
                        if fs::symlink_metadata(&path)
                            .is_ok_and(|m| m.is_file() && !m.file_type().is_symlink())
                        {
                            failed |= fs::set_permissions(&path, mode.clone()).is_err();
                        } else {
                            failed = true;
                        }
                    }
                } else {
                    failed |= saved.restore(&path).is_err();
                }
            }
            if failed {
                prepared = Err(recovery("commit-worktree-restore-required"));
            }
        }
        if prepared.is_err() && wal.known_id(id)? {
            let chain = wal.inspect(id)?;
            if matches!(chain.last_state(), Phase::Intent(_) | Phase::Prepared) {
                wal.append(&chain, Phase::Outcome(Outcome::AbandonedBeforeAttempt))?;
            }
        }
        if wal.known_id(id)? {
            let terminal = wal.inspect(id)?;
            if terminal.outcome().is_some() {
                let warnings = self.compact_checkout_warning(repo, scope, &wal, &terminal);
                if let Ok(receipt) = &mut prepared {
                    receipt.warnings.extend(warnings);
                }
            }
        }
        prepared
    }
    fn validate_cutover_seal(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        grant: &CutoverGrant,
    ) -> Result<()> {
        let current =
            self.checkout_text(repo, scope, &["rev-parse", "--verify", "refs/fgos/legacy"])?;
        if current != grant.legacy_ref_oid {
            return Err(failure("cutover-legacy-ref-mismatch"));
        }
        let bytes = self.checkout_bytes(
            repo,
            scope,
            &["show", &format!("{}:seal.json", grant.legacy_ref_oid)],
        )?;
        use sha2::{Digest, Sha256};
        if format!("{:x}", Sha256::digest(bytes)) != grant.seal_digest {
            return Err(failure("cutover-seal-digest-mismatch"));
        }
        Ok(())
    }
    /// Main-only tracked checkpoint of non-`.fgos` files.
    pub fn checkpoint_tracked_files(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        request: CheckpointRequest,
        writer: &str,
        id: &str,
    ) -> Result<CommitResult> {
        let CheckpointRequest {files, message} = request;
        if root(repo)? != repo.trusted_main_root()
            || files.iter().any(|p| is_store_path(p))
        {
            return Err(failure("checkpoint-non-event-main-required"));
        }
        let operation_repo = self.checkout_repository(repo)?;
        let repo = &operation_repo;
        let scope = scope(repo, held)?;
        let tracked = paths(&self.checkout_bytes(repo, &scope, &["ls-files", "-z"])?)?;
        if files
            .iter()
            .any(|p| p.contains('*') || !tracked.contains(p))
        {
            return Err(failure("checkpoint-tracked-literals-required"));
        }
        if !self.staged(repo, &scope)?.is_empty() || self.merge_head(repo, &scope)?.is_some() {
            return Err(failure("checkpoint-foreign-state"));
        }
        let baseline = CommitBaseline {
            head: self.checkout_text(repo, &scope, &["rev-parse", "HEAD"])?,
            reference: self.checkout_text(repo, &scope, &["symbolic-ref", "-q", "HEAD"])?,
            worktree: root(repo)?.to_string_lossy().into_owned(),
            authority: binding(handle(&scope, repo)?)?,
            dirty: vec![],
        };
        self.commit_scoped(
            repo,
            &scope,
            &baseline,
            &CommitRequest {
                writes: files,
                message,
                cutover_grant: None,
            },
            writer,
            id,
            &wal::OsFileSystem,
        )
    }
}
fn content_digest(root: &Path, path: &str) -> Result<String> {
    use sha2::{Digest, Sha256};
    match fs::symlink_metadata(root.join(path)) {
        Ok(m) if m.file_type().is_symlink() => Ok(format!(
            "symlink:{:?}",
            fs::read_link(root.join(path)).map_err(failure)?
        )),
        Ok(m) if m.is_file() => Ok(format!(
            "file:{:?}:{:x}",
            m.permissions(),
            Sha256::digest(fs::read(root.join(path)).map_err(failure)?)
        )),
        Ok(_) => Ok("non-regular".into()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok("absent".into()),
        Err(e) => Err(failure(e)),
    }
}

// Transaction-local snapshot: uncertain/crashed attempts retain their WAL and
// refuse replay; any inline failure with unchanged HEAD restores producer bytes.
#[derive(Serialize, Deserialize)]
pub(crate) enum SavedPath {
    #[serde(skip)]
    Head(Option<fs::Permissions>),
    Absent,
    File(Vec<u8>, #[serde(with = "saved_permissions")] fs::Permissions),
    Link(std::path::PathBuf),
}
impl SavedPath {
    pub(crate) fn capture(path: &Path) -> Result<Self> {
        Self::capture_bounded(path, u64::MAX - 1)
    }
    pub(crate) fn capture_bounded(path: &Path, limit: u64) -> Result<Self> {
        use std::io::Read;
        match fs::symlink_metadata(path) {
            Ok(m) if m.file_type().is_symlink() => {
                Ok(Self::Link(fs::read_link(path).map_err(failure)?))
            }
            Ok(m) if m.is_file() => {
                let mut options = fs::OpenOptions::new();
                options.read(true);
                #[cfg(unix)]
                {
                    use std::os::unix::fs::OpenOptionsExt;
                    options.custom_flags(libc::O_NOFOLLOW | libc::O_NONBLOCK);
                }
                let file = options.open(path).map_err(failure)?;
                let actual = file.metadata().map_err(failure)?;
                if !actual.is_file() || actual.len() > limit {
                    return Err(failure("snapshot-file-capacity-or-type"));
                }
                let mut bytes = Vec::new();
                file.take(limit.saturating_add(1))
                    .read_to_end(&mut bytes)
                    .map_err(failure)?;
                if bytes.len() as u64 > limit {
                    return Err(failure("snapshot-file-capacity"));
                }
                Ok(Self::File(bytes, actual.permissions()))
            }
            Ok(_) => Err(failure("commit-snapshot-non-file")),
            Err(e)
                if matches!(
                    e.kind(),
                    std::io::ErrorKind::NotFound | std::io::ErrorKind::NotADirectory
                ) =>
            {
                Ok(Self::Absent)
            }
            Err(e) => Err(failure(e)),
        }
    }
    pub(crate) fn restore(&self, path: &Path) -> std::io::Result<()> {
        // Do not follow a hook-created parent symlink outside the checkout.
        for parent in path.ancestors().skip(1) {
            if fs::symlink_metadata(parent).is_ok_and(|m| m.file_type().is_symlink()) {
                return Err(std::io::Error::other("snapshot parent became a symlink"));
            }
        }
        match fs::remove_file(path) {
            Ok(()) => (),
            Err(e)
                if matches!(
                    e.kind(),
                    std::io::ErrorKind::NotFound | std::io::ErrorKind::NotADirectory
                ) => {}
            // This path was absent or a file/link in the snapshot, so a
            // directory here was introduced by the hook, never producer data.
            Err(_) if fs::symlink_metadata(path).is_ok_and(|m| m.is_dir()) => {
                fs::remove_dir_all(path)?;
            }
            Err(e) => return Err(e),
        }
        match self {
            Self::Head(_) => unreachable!("clean tracked paths restore through Git"),
            Self::Absent => Ok(()),
            Self::File(bytes, mode) => {
                if let Some(parent) = path.parent() {
                    fs::create_dir_all(parent)?;
                }
                fs::write(path, bytes)?;
                fs::set_permissions(path, mode.clone())
            }
            Self::Link(target) => {
                if let Some(parent) = path.parent() {
                    fs::create_dir_all(parent)?;
                }
                #[cfg(unix)]
                {
                    std::os::unix::fs::symlink(target, path)
                }
                #[cfg(not(unix))]
                {
                    let _ = target;
                    Err(std::io::Error::other("snapshot symlink unsupported"))
                }
            }
        }
    }
}

mod saved_permissions {
    use super::*;
    pub fn serialize<S: serde::Serializer>(
        p: &fs::Permissions,
        s: S,
    ) -> std::result::Result<S::Ok, S::Error> {
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            p.mode().serialize(s)
        }
        #[cfg(not(unix))]
        {
            p.readonly().serialize(s)
        }
    }
    pub fn deserialize<'de, D: serde::Deserializer<'de>>(
        d: D,
    ) -> std::result::Result<fs::Permissions, D::Error> {
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            Ok(fs::Permissions::from_mode(u32::deserialize(d)?))
        }
        #[cfg(not(unix))]
        {
            let _ = d;
            Err(serde::de::Error::custom("snapshot-platform-unsupported"))
        }
    }
}

#[cfg(test)]
mod observation_tests {
    use super::{raw_entries, split_observation, RawEntry};
    const HEAD: &str = "aaaa\0bbbb\0cccc\0";
    const ZERO: &str = "0000000000000000000000000000000000000000";
    const BLOB: &str = "1111111111111111111111111111111111111111";
    const TREE: &str = "2222222222222222222222222222222222222222";
    fn record(old: &str, new: &str, oid: &str, status: &str, path: &str) -> String {
        format!(":{old} {new} {ZERO} {oid} {status}\0{path}\0")
    }
    #[test]
    fn observation_splits_header_from_the_raw_records() {
        let bytes = format!("{HEAD}\0\n{}", record("000000", "100644", BLOB, "A", "x"));
        let (oid, tree, parents, rest) = split_observation(bytes.as_bytes()).unwrap();
        assert_eq!((oid.as_str(), tree.as_str(), parents.as_str()), ("aaaa", "bbbb", "cccc"));
        assert_eq!(rest, record("000000", "100644", BLOB, "A", "x").as_bytes());
    }
    #[test]
    fn observation_of_a_commit_without_changes_has_no_records() {
        let bytes = format!("{HEAD}\0");
        assert!(split_observation(bytes.as_bytes()).unwrap().3.is_empty());
    }
    #[test]
    fn observation_in_any_other_shape_is_refused() {
        for bad in [
            "".to_owned(),
            "aaaa\0bbbb\0".to_owned(),
            HEAD.to_owned(),
            format!("{HEAD}\0x\0"),
            format!("{HEAD}extra"),
        ] {
            assert!(split_observation(bad.as_bytes()).is_err(), "{bad:?}");
        }
    }
    #[test]
    fn raw_records_separate_changed_files_from_trees_and_name_new_objects() {
        let bytes = [
            record("040000", "040000", TREE, "M", "d"),
            record("000000", "100644", BLOB, "A", "d/\nnl"),
            record("100644", "000000", ZERO, "D", "gone"),
            record("160000", "160000", BLOB, "M", "sub"),
        ]
        .concat();
        let entries = raw_entries(bytes.as_bytes()).unwrap();
        let files: Vec<_> = entries.iter().filter(|e| e.is_file()).map(|e| e.path.as_str()).collect();
        assert_eq!(files, ["d/\nnl", "gone", "sub"]);
        let created: Vec<_> = entries.iter().filter_map(RawEntry::new_object).collect();
        assert_eq!(created, [TREE, BLOB]);
    }
    #[test]
    fn a_path_replaced_by_a_directory_is_one_deleted_file() {
        let bytes = [
            record("100644", "000000", ZERO, "D", "p"),
            record("000000", "040000", TREE, "A", "p"),
            record("000000", "100644", BLOB, "A", "p/f"),
        ]
        .concat();
        let entries = raw_entries(bytes.as_bytes()).unwrap();
        let files: Vec<_> = entries.iter().filter(|e| e.is_file()).map(|e| e.path.as_str()).collect();
        assert_eq!(files, ["p", "p/f"]);
    }
    #[test]
    fn raw_records_in_any_other_shape_are_refused() {
        for bad in [
            "x\0p\0".to_owned(),
            format!(":100644 100644 {ZERO} {BLOB}\0p\0"),
            format!(":zz 100644 {ZERO} {BLOB} M\0p\0"),
            format!(":100644 100644 {ZERO} nothex M\0p\0"),
            format!(":100644 100644 {ZERO} {BLOB} M\0"),
            format!(":100644 100644 {ZERO} {BLOB} MM\0p\0"),
        ] {
            assert!(raw_entries(bad.as_bytes()).is_err(), "{bad:?}");
        }
    }
}

#[cfg(test)]
mod native_state_tests {
    use super::{native_state_probe, NATIVE_STATE};
    use std::fs;
    #[test]
    fn one_list_of_git_markers_serves_land_restore_and_worktree_removal() {
        assert_eq!(
            NATIVE_STATE,
            [
                "index.lock",
                "HEAD.lock",
                "MERGE_HEAD",
                "CHERRY_PICK_HEAD",
                "REVERT_HEAD",
                "rebase-merge",
                "rebase-apply",
                "sequencer",
                "BISECT_START",
            ]
        );
        let dir = std::env::temp_dir().join(format!("fgos-native-state-{}", std::process::id()));
        fs::create_dir_all(&dir).unwrap();
        assert_eq!(native_state_probe(&dir, &[]).unwrap(), None);
        for name in NATIVE_STATE {
            fs::write(dir.join(name), "").unwrap();
            assert_eq!(native_state_probe(&dir, &[]).unwrap(), Some(name));
            assert_eq!(native_state_probe(&dir, &[name]).unwrap(), None);
            fs::remove_file(dir.join(name)).unwrap();
        }
        fs::remove_dir(&dir).unwrap();
    }
}
