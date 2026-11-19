//! What the unit run asks of Git, and nothing else: a commit of a unit's declared `writes`, the sync merge of its
//! base, and the worktree facts both read. Every call goes through the `fgos-git` port (`GitDriver`) under the
//! custody the caller holds; this module never starts a git process and never names a git file. It translates
//! the port's answers into the record shapes Node's `commit-unit-work.mjs` wrote, so `unit.json`, the run ledger
//! and the result a caller reads stay byte-compatible.

use fgos_git::{wal, CommitBaseline, CommitRequest, GitDriver, Oid, OperationError, RepoHandle, ResultCode, SyncResult};
use fgos_holder_lock::{BorrowedHandle, Handle};
use serde_json::{json, Map, Value};

use super::commit_subject::{subject_from, sync_subject};

fn outside_store(path: &str) -> bool {
    path != ".fgos" && !path.starts_with(".fgos/")
}

/// The causes a native commit refuses for good: the commit operation is settled, not retried.
const COMMIT_REFUSED_FOR_GOOD: [&str; 2] = ["commit-rejected", "hook-refused"];

/// The worktree facts a unit run decides from.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct WorktreeState {
    pub head: String,
    pub merge_head: Option<String>,
    pub unmerged: Vec<String>,
    pub staged: Vec<String>,
    pub changed: Vec<String>,
}

fn strings(value: &Value, key: &str) -> Vec<String> {
    value
        .get(key)
        .and_then(Value::as_array)
        .map(|a| a.iter().filter_map(|v| v.as_str().map(str::to_owned)).collect())
        .unwrap_or_default()
}

/// Which of `paths` the write `scope` covers and which it does not, each in order.
pub fn partition_paths(paths: &[String], scope: &[String]) -> (Vec<String>, Vec<String>) {
    let mut inside = Vec::new();
    let mut outside = Vec::new();
    for path in paths {
        // A path the scope cannot judge is out of scope: nothing writes outside what was declared.
        if fgos_write_scope::matches(path.as_bytes(), scope).unwrap_or(false) {
            inside.push(path.clone());
        } else {
            outside.push(path.clone());
        }
    }
    (inside, outside)
}

/// What a port refusal becomes: the record fields Node's `refusal` gave, with the git cause kept as `nativeCause`.
pub fn refusal(error: &OperationError) -> Map<String, Value> {
    let cause = if error.cause.is_empty() { "git-error" } else { error.cause.as_str() };
    let reason = if cause == "foreign-merge-head" {
        "merge-in-progress"
    } else if ["untrusted-worktree", "trusted-main-gitfile", "not-a-repository"].iter().any(|c| cause.contains(c)) {
        "untrusted-worktree"
    } else if cause == "unscopable-conflict-path" {
        cause
    } else if cause == "sync-index-changed" {
        "staged-set-mismatch"
    } else if ["foreign-staged-index", "staged-set-mismatch", "merge-refused", "hook-refused"].contains(&cause) {
        cause
    } else if cause.starts_with("conflict-markers") {
        "conflict-markers"
    } else {
        "git-error"
    };
    let mut out = Map::new();
    if let Some(Value::Object(detail)) = error.detail.as_deref() {
        out.extend(detail.clone());
    }
    let stderr = String::from_utf8_lossy(&error.stderr).into_owned();
    out.insert("status".into(), json!("failed"));
    out.insert("reason".into(), json!(reason));
    out.insert("error".into(), json!(if stderr.is_empty() { cause } else { stderr.as_str() }));
    if !stderr.is_empty() {
        out.insert("stderr".into(), json!(stderr));
        out.insert("stderrBytes".into(), json!(error.stderr));
    }
    out.insert("nativeCause".into(), json!(cause));
    out
}

/// A native commit operation the run prepared before it ran, so a dead controller's resume can finish it.
#[derive(Debug, Clone)]
pub struct PreparedCommit {
    pub operation_id: String,
    pub request: CommitRequest,
    pub expected_paths: Vec<String>,
    pub base: Value,
}

/// A native commit operation a dead controller left pending.
#[derive(Debug, Clone)]
pub struct ResumeCommit {
    pub operation_id: String,
    pub request: CommitRequest,
    pub expected_paths: Vec<String>,
    pub base: Value,
}

/// What `commit_unit_work` is asked for one round.
pub struct CommitArgs<'a> {
    pub unit_id: &'a str,
    pub summary: Option<&'a str>,
    pub objective: Option<&'a str>,
    pub scope: &'a [String],
    pub baseline: Option<&'a CommitBaseline>,
    /// The files the seat's run result says it changed; only these appear as `outOfScope`.
    pub changed_files: Option<&'a [String]>,
    pub exclude_paths: &'a [String],
    pub needs_writes: Option<&'a Value>,
    /// A fresh id for this operation (`fgos_identity::uuid_v4`); ignored when `resume` is set.
    pub operation_id: &'a str,
    pub resume: Option<&'a ResumeCommit>,
}

/// The outcome of the unit worktree's preflight.
pub enum Preflight {
    Clear { baseline: CommitBaseline, pre_existing_in_scope: Vec<String> },
    /// The index or a merge is not this run's: the caller refuses the run by name.
    Foreign { staged: Vec<String>, merge_head: Option<String> },
}

/// The unit run's door to Git over one worktree, under the custody the caller holds.
pub struct UnitGit<'a> {
    pub driver: &'a GitDriver,
    pub repo: &'a RepoHandle,
    pub custody: Option<&'a Handle>,
    pub writer: &'a str,
}

impl<'a> UnitGit<'a> {
    fn held(&self) -> Result<Vec<BorrowedHandle<'a>>, OperationError> {
        match self.custody {
            None => Ok(Vec::new()),
            Some(handle) => BorrowedHandle::new(handle)
                .map(|b| vec![b])
                .map_err(|e| OperationError {
                    code: ResultCode::Refused,
                    cause: format!("custody-unavailable: {e}"),
                    retryable: false,
                    operation_id: None,
                    receipt: None,
                    exit_code: None,
                    signal: None,
                    stderr: vec![],
                    detail: None,
                }),
        }
    }

    /// The worktree's head, merge head, unmerged, staged and changed paths.
    pub fn state(&self) -> Result<WorktreeState, OperationError> {
        let value = self.driver.checkout_state(self.repo, self.held()?)?;
        Ok(WorktreeState {
            head: value.get("head").and_then(Value::as_str).unwrap_or_default().to_owned(),
            merge_head: value.get("mergeHead").and_then(Value::as_str).map(str::to_owned),
            unmerged: strings(&value, "unmerged"),
            staged: strings(&value, "staged"),
            changed: strings(&value, "changed"),
        })
    }

    /// The staged paths and the paths changed or staged, each once.
    pub fn changed_paths(&self) -> Result<Vec<String>, OperationError> {
        let state = self.state()?;
        let mut all = state.changed;
        for path in state.staged {
            if !all.contains(&path) {
                all.push(path);
            }
        }
        Ok(all)
    }

    /// Capture the native baseline before a producer launches. `sync_operation` is the open merge of this run
    /// (its conflicted paths and staged paths are its own, not foreign).
    pub fn preflight(&self, scope: &[String], sync_operation: Option<&str>) -> Result<Preflight, OperationError> {
        let sync = sync_operation.map(|id| (self.writer, id));
        match self.driver.preflight_commit(self.repo, self.held()?, sync) {
            Ok(baseline) => {
                let dirty: Vec<String> = baseline.dirty.iter().map(|(p, _)| p.clone()).filter(|p| outside_store(p)).collect();
                let (pre_existing_in_scope, _) = partition_paths(&dirty, scope);
                Ok(Preflight::Clear { baseline, pre_existing_in_scope })
            }
            Err(e) if e.cause == "foreign-staged-index" || e.cause == "foreign-merge-head" => {
                let state = self.state()?;
                Ok(Preflight::Foreign { staged: state.staged, merge_head: state.merge_head })
            }
            Err(e) => Err(e),
        }
    }

    fn failed(base: &Value, reason: &str, error: String) -> Value {
        let mut out = base.as_object().cloned().unwrap_or_default();
        out.insert("status".into(), json!("failed"));
        out.insert("reason".into(), json!(reason));
        out.insert("error".into(), json!(error));
        Value::Object(out)
    }

    /// Commit the round's in-scope files through the Git scoped commit. Returns the record Node wrote: a
    /// `committed`, `no-changes` or `failed` commit with the `outOfScope` and `preExistingInScope` lists.
    pub fn commit_unit_work(
        &self,
        args: &CommitArgs<'_>,
        on_prepared: &mut dyn FnMut(&PreparedCommit),
    ) -> Value {
        let mut base = json!({ "outOfScope": [], "preExistingInScope": args.exclude_paths });
        if let (Some(needs), Some(object)) = (args.needs_writes.filter(|v| v.is_array()), base.as_object_mut()) {
            object.insert("needsWrites".into(), needs.clone());
        }
        match self.commit_inner(args, &mut base, on_prepared) {
            Ok(value) => value,
            Err(error) => {
                let mut out = base.as_object().cloned().unwrap_or_default();
                out.extend(refusal(&error));
                Value::Object(out)
            }
        }
    }

    fn commit_inner(
        &self,
        args: &CommitArgs<'_>,
        base: &mut Value,
        on_prepared: &mut dyn FnMut(&PreparedCommit),
    ) -> Result<Value, OperationError> {
        let fs = wal::OsFileSystem;
        let mut recovered: Option<fgos_git::CommitResult> = None;
        if let Some(resume) = args.resume {
            let outcome = self.driver.recover_scoped_commit(self.repo, self.held()?, self.writer, &resume.operation_id, &fs)?;
            match outcome {
                wal::Outcome::Commit { .. } => {
                    let baseline = args.baseline.ok_or_else(missing_baseline)?;
                    recovered = Some(self.driver.scoped_commit(
                        self.repo, self.held()?, baseline, &resume.request, self.writer, &resume.operation_id, &fs,
                    )?);
                }
                wal::Outcome::AbandonedBeforeAttempt => {}
                wal::Outcome::CommitRejected { ref cause } if COMMIT_REFUSED_FOR_GOOD.contains(&cause.as_str()) => {}
                other => {
                    let what = match &other {
                        wal::Outcome::CommitRejected { cause } => cause.clone(),
                        _ => "unresolved".to_owned(),
                    };
                    return Ok(Self::failed(base, "git-error", format!("native commit recovery: {what}")));
                }
            }
        }
        let current = if recovered.is_some() { WorktreeState::default() } else { self.state()? };
        if let Some(merge_head) = &current.merge_head {
            return Ok(Self::failed(base, "merge-in-progress", format!("the worktree has a merge in progress (MERGE_HEAD {merge_head})")));
        }
        if !current.staged.is_empty() {
            let mut out = Self::failed(base, "foreign-staged-index", foreign_index_detail(&current.staged));
            out["stagedPaths"] = json!(current.staged);
            return Ok(out);
        }
        let Some(baseline) = args.baseline else {
            return Ok(Self::failed(
                base,
                "baseline-required",
                "the native baseline captured before producer launch is required; start a new run".into(),
            ));
        };
        let (in_scope, out_of_scope) = match (recovered.is_some(), args.resume) {
            (true, Some(resume)) => (resume.expected_paths.clone(), Vec::new()),
            _ => {
                let candidates: Vec<String> = current
                    .changed
                    .iter()
                    .filter(|p| outside_store(p) && !args.exclude_paths.contains(p))
                    .cloned()
                    .collect();
                partition_paths(&candidates, args.scope)
            }
        };
        let reported = args.changed_files.unwrap_or(&[]);
        base["outOfScope"] = json!(out_of_scope.iter().filter(|p| reported.contains(p)).collect::<Vec<_>>());
        let (subject, request, operation_id) = match (&recovered, args.resume) {
            (Some(_), Some(resume)) => (resume.request.message.clone(), resume.request.clone(), resume.operation_id.clone()),
            _ => {
                let subject = subject_from(args.summary, args.unit_id, args.objective);
                let request = CommitRequest { writes: args.scope.to_vec(), message: subject.clone() };
                (subject, request, args.operation_id.to_owned())
            }
        };
        if recovered.is_none() {
            on_prepared(&PreparedCommit {
                operation_id: operation_id.clone(),
                request: request.clone(),
                expected_paths: in_scope.clone(),
                base: base.clone(),
            });
        } else if let Some(resume) = args.resume {
            if let (Some(into), Some(from)) = (base.as_object_mut(), resume.base.as_object()) {
                into.extend(from.clone());
            }
        }
        let result = match recovered {
            Some(r) => r,
            None => self.driver.scoped_commit(self.repo, self.held()?, baseline, &request, self.writer, &operation_id, &fs)?,
        };
        let mut extra = Map::new();
        if !result.warnings.is_empty() {
            extra.insert("warnings".into(), json!(result.warnings));
        }
        extra.insert("operationId".into(), json!(result.operation_id));
        let mut out = Map::new();
        match result.status {
            ResultCode::Unchanged => {
                out.insert("status".into(), json!("no-changes"));
                out.extend(base.as_object().cloned().unwrap_or_default());
                out.extend(extra);
                return Ok(Value::Object(out));
            }
            ResultCode::Committed | ResultCode::CommittedButContractViolation => {}
            // Any other answer is not a commit this run may count: it fails closed.
            other => {
                return Ok(Self::failed(base, "git-error", format!("scoped commit answered {other:?}")));
            }
        }
        let sha = result.oid.as_ref().map(|o| o.as_str().to_owned());
        out.insert("sha".into(), json!(sha));
        out.insert("subject".into(), json!(subject));
        out.insert("files".into(), json!(result.files));
        out.extend(base.as_object().cloned().unwrap_or_default());
        out.extend(extra);
        if result.status == ResultCode::CommittedButContractViolation {
            let mut failed = Map::new();
            failed.insert("status".into(), json!("failed"));
            failed.extend(out);
            failed.insert("reason".into(), json!("committed-set-mismatch"));
            failed.insert(
                "error".into(),
                json!(format!("commit {} is on the branch but violates the scoped commit contract", sha.unwrap_or_default())),
            );
            failed.insert("unexpected".into(), json!(result.files.iter().filter(|p| !in_scope.contains(p)).collect::<Vec<_>>()));
            failed.insert("missing".into(), json!(in_scope.iter().filter(|p| !result.files.contains(p)).collect::<Vec<_>>()));
            return Ok(Value::Object(failed));
        }
        let mut committed = Map::new();
        committed.insert("status".into(), json!("committed"));
        committed.extend(out);
        Ok(Value::Object(committed))
    }

    /// Whether `sha` is an ancestor of the worktree's head.
    pub fn commit_on_branch(&self, sha: &str) -> Result<bool, OperationError> {
        let Some(head) = self.driver.resolve_commit_ref(self.repo, "HEAD")? else { return Ok(false) };
        let ancestor = parse_oid(sha, self.repo)?;
        self.driver.ancestry(self.repo, &ancestor, &head)
    }

    /// The commit a ref names, or `None`.
    pub fn resolve_sync_base(&self, name: &str) -> Result<Option<String>, OperationError> {
        Ok(self.driver.resolve_commit_ref(self.repo, name)?.map(|o| o.as_str().to_owned()))
    }

    /// Start the merge of `sha` (named `name`) into the worktree's branch. Returns the sync record: `merged`,
    /// `up-to-date`, `conflicted` (the merge is left open for the worker) or `failed`.
    pub fn start_sync_merge(&self, name: &str, sha: &str, operation_id: &str) -> Value {
        let attempt = (|| {
            let target = parse_oid(sha, self.repo)?;
            self.driver.start_sync(self.repo, self.held()?, &target, &sync_subject(name), self.writer, operation_id)
        })();
        match attempt {
            Ok(result) => translate_sync(&result, name),
            Err(error) => {
                let mut out = Map::new();
                out.insert("ref".into(), json!(name));
                out.insert("sha".into(), json!(sha));
                out.insert("operationId".into(), json!(operation_id));
                out.extend(refusal(&error));
                // The native operation owns and aborts its own merge; never clean someone else's state or a
                // landed contract violation.
                if COMMIT_REFUSED_FOR_GOOD.contains(&error.cause.as_str()) {
                    if let Err(cleanup) = self.abort_own_rejected_merge(operation_id) {
                        out.insert("cleanupError".into(), json!(cleanup.cause));
                    }
                }
                Value::Object(out)
            }
        }
    }

    fn abort_own_rejected_merge(&self, operation_id: &str) -> Result<(), OperationError> {
        let own = self.driver.inspect_sync(self.repo, self.held()?, self.writer, operation_id)?;
        if own.state == "rejected-open" && own.resolver_grant.is_empty() {
            self.driver.abort_sync(self.repo, self.held()?, self.writer, operation_id)?;
        }
        Ok(())
    }

    /// Where the merge this run started stands now.
    pub fn sync_merge_state(&self, operation_id: &str) -> Result<Value, OperationError> {
        let r = self.driver.inspect_sync(self.repo, self.held()?, self.writer, operation_id)?;
        let current = self.state()?;
        let state = match r.state.as_str() {
            "rejected-open" => "in-progress",
            "conflict-aborted" => "not-started",
            other => other,
        };
        Ok(json!({
            "state": state,
            "unmerged": current.unmerged,
            "rejected": r.state == "rejected-open",
            "staged": current.staged,
            "mergeHead": current.merge_head,
            "head": current.head,
        }))
    }

    /// Conclude the merge the worker finished: the merge commit, or a refusal by name.
    pub fn finish_sync_merge(&self, sync: &Value) -> Value {
        let name = sync.get("ref").and_then(Value::as_str).unwrap_or_default();
        let id = sync.get("operationId").and_then(Value::as_str).unwrap_or_default();
        let next = sync.get("nextOperationId").and_then(Value::as_str);
        let attempt = (|| {
            let held = self.held()?;
            match next {
                Some(next_id) => self.driver.retry_sync_commit(self.repo, held, self.writer, id, next_id),
                None => self.driver.continue_sync(self.repo, held, self.writer, id),
            }
        })();
        match attempt {
            Ok(r) => {
                let result = translate_sync(&r, name);
                if result["status"] == "failed" {
                    let mut out = result.as_object().cloned().unwrap_or_default();
                    if let Some(commit) = result.get("commit") {
                        out.insert("sha".into(), commit["sha"].clone());
                        out.insert("subject".into(), commit["subject"].clone());
                    }
                    return Value::Object(out);
                }
                match &r.commit {
                    Some(commit) => json!({
                        "operationId": r.operation_id,
                        "status": "committed",
                        "sha": commit.oid.as_ref().map(|o| o.as_str()),
                        "subject": sync_subject(name),
                        "files": commit.files,
                        "warnings": r.warnings,
                    }),
                    None => json!({
                        "status": "merged-outside",
                        "sha": self.state().map(|s| s.head).unwrap_or_default(),
                    }),
                }
            }
            Err(error) => {
                let mut result = refusal(&error);
                if result.get("reason") == Some(&json!("merge-in-progress")) {
                    result.insert("reason".into(), json!("sync-merge-lost"));
                    result.insert(
                        "error".into(),
                        json!(format!("the merge of {name} this run started is no longer in progress; start a new run")),
                    );
                }
                if result.get("reason") == Some(&json!("conflict-markers")) {
                    let paths: Vec<String> = result.get("paths").and_then(Value::as_array).map(|a| a.iter().filter_map(|v| v.as_str().map(str::to_owned)).collect()).unwrap_or_default();
                    result.insert(
                        "error".into(),
                        json!(format!(
                            "conflict markers are still in {}; remove them, then resume the run to commit the merge of {name}",
                            paths.join(", ")
                        )),
                    );
                }
                if let Some(id) = &error.operation_id {
                    result.insert("operationId".into(), json!(id));
                }
                Value::Object(result)
            }
        }
    }
}

fn missing_baseline() -> OperationError {
    OperationError {
        code: ResultCode::Refused,
        cause: "baseline-required".into(),
        retryable: false,
        operation_id: None,
        receipt: None,
        exit_code: None,
        signal: None,
        stderr: vec![],
        detail: None,
    }
}

fn parse_oid(text: &str, repo: &RepoHandle) -> Result<Oid, OperationError> {
    Oid::parse(text, repo.object_format()).map_err(|e| OperationError {
        code: ResultCode::Refused,
        cause: format!("invalid-oid: {}", e.0),
        retryable: false,
        operation_id: None,
        receipt: None,
        exit_code: None,
        signal: None,
        stderr: vec![],
        detail: None,
    })
}

/// What the run tells the owner when the index holds staged changes it did not make.
pub fn foreign_index_detail(paths: &[String]) -> String {
    format!(
        "the index has staged changes this run did not make: {}; unstage or commit them, then run again",
        paths.join(", ")
    )
}

/// The sync record of one merge answer.
pub fn translate_sync(result: &SyncResult, name: &str) -> Value {
    let mut base = Map::new();
    base.insert("ref".into(), json!(name));
    base.insert("sha".into(), json!(result.target));
    base.insert("head".into(), json!(result.head));
    base.insert("operationId".into(), json!(result.operation_id));
    if !result.warnings.is_empty() {
        base.insert("warnings".into(), json!(result.warnings));
    }
    let with = |extra: Value| {
        let mut out = base.clone();
        if let Value::Object(more) = extra {
            out.extend(more);
        }
        Value::Object(out)
    };
    match result.state.as_str() {
        "in-progress" | "conflicted-open" => with(json!({
            "status": "conflicted",
            "conflicts": result.resolver_grant,
            "mergeStaged": result.staged.iter().filter(|p| !result.resolver_grant.contains(p)).collect::<Vec<_>>(),
        })),
        "up-to-date" => with(json!({ "status": "up-to-date" })),
        "done" => {
            let commit = match &result.commit {
                Some(c) => json!({ "sha": c.oid.as_ref().map(|o| o.as_str()), "subject": sync_subject(name), "files": c.files }),
                None => json!({ "by": "outside" }),
            };
            if result.commit.as_ref().is_some_and(|c| c.status == ResultCode::CommittedButContractViolation) {
                let sha = commit["sha"].as_str().unwrap_or_default().to_owned();
                return with(json!({
                    "status": "failed",
                    "reason": "committed-set-mismatch",
                    "error": format!("merge commit {sha} is on the branch but violates the merge contract"),
                    "commit": commit,
                    "files": result.commit.as_ref().map(|c| c.files.clone()).unwrap_or_default(),
                    "unexpected": result.unexpected,
                    "missing": result.missing,
                }));
            }
            with(json!({ "status": "merged", "commit": commit }))
        }
        other => with(json!({
            "status": "failed",
            "reason": "sync-merge-lost",
            "error": format!("sync operation {}: {other}", result.operation_id),
        })),
    }
}
