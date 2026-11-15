//! `fgos session start|end|list|gc`: the per-session checkouts of a project as native operations
//! (`session.start`, `session.end`, `session.list`, `session.gc`).
//!
//! A session is a detached-HEAD linked worktree on the HEAD the project had when it began, with a `.fgos`
//! symlink back to the one shared store. The registry of live sessions is `<project>/.fgos/sessions.json`, a
//! JSON array of rows (`sessionId`, `worktreePath`, `itemId`, `startCommit`, `pid`, `record`, `startedAt`); the
//! row shape is the `x-sessionRegistry` section of the identity writer contract, which the identity reader
//! (read-only, one field) and the Node readers of `session list` share. The registry is runner state, not a Git
//! fact: this module owns it over the lower doors, the Git Worktree and SafeRestore ports, the holder-lock
//! `sessions` lock and Durable File.
//!
//! Lock discipline. Every registry read-modify-write holds the `sessions` lock (rank 80, a leaf); the lock is
//! never held while the worktree-admin lock is taken, so `start` releases it around the worktree creation and
//! re-takes it to append the row. `end` and `gc` hold it across their removals, as the checkout custody lease and
//! the worktree-admin lock are each taken in a scope of their own, without waiting. A registry that is present but
//! not a JSON array fails closed: it is never read as empty and never rewritten.
//!
//! The nesting refusal of `start` and the self-mount guard of `gc` compare the caller's own directory, never the
//! root the invocation doors resolved. `end` seals the Event Store once, outside the `sessions` lock and also
//! when the end fails, and never starts a publish child.
use crate::invocation_doors::Lifecycle;
use fgos_event_store::lifecycle::Policy;
use fgos_git::{
    wal, GitDriver, IgnoredBytes, Oid, RepoHandle, ResolveRepo, RestoreRequest, WorktreeDelivery,
};
use fgos_holder_lock::{BorrowedHandle, LockScope, Wait};
use fgos_host_runtime::cli_args::{parse_args, FlagScalar, FlagValue, ParsedArgs};
use fgos_host_runtime::{
    CategorisedRefusal, ContractRef, EventSink, HostInvocation, InvocationControl, OperationId,
    OperationProvider, OperationRequest, ProviderDescriptor, ProviderError, ProviderLifecycle,
    ProviderOutcome,
};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::borrow::Cow;
use std::collections::BTreeMap;
use std::ffi::OsString;
use std::future::Future;
use std::path::{Component, Path, PathBuf};
use std::pin::Pin;
use std::sync::Arc;

/// The sub-verbs of `fgos session`.
pub const AVAILABLE_SUBCOMMANDS: &[&str] = &["start", "end", "list", "gc"];

pub const START_OPERATION_ID: &str = "session.start";
pub const END_OPERATION_ID: &str = "session.end";
pub const LIST_OPERATION_ID: &str = "session.list";
pub const GC_OPERATION_ID: &str = "session.gc";

const fn descriptor(
    id: &'static str,
    request: &'static str,
    outcome: &'static str,
) -> ProviderDescriptor {
    ProviderDescriptor {
        provider_id: Cow::Borrowed(id),
        operation_id: OperationId::from_static(id),
        component_class: Cow::Borrowed("session"),
        mechanism: Cow::Borrowed("builtin"),
        lifecycle: ProviderLifecycle::Singleton,
        request_contract: ContractRef::from_static(request, "1.0.0"),
        outcome_contract: ContractRef::from_static(outcome, "1.0.0"),
        allowed_hosts: &["cli"],
        allowed_modes: &["sync"],
        capabilities: &[],
        replacement: None,
        concurrency: None,
        health: None,
    }
}

pub const START_DESCRIPTOR: ProviderDescriptor = descriptor(
    START_OPERATION_ID,
    "session.start.request",
    "session.start.outcome",
);
pub const END_DESCRIPTOR: ProviderDescriptor = descriptor(
    END_OPERATION_ID,
    "session.end.request",
    "session.end.outcome",
);
pub const LIST_DESCRIPTOR: ProviderDescriptor = descriptor(
    LIST_OPERATION_ID,
    "session.list.request",
    "session.list.outcome",
);
pub const GC_DESCRIPTOR: ProviderDescriptor =
    descriptor(GC_OPERATION_ID, "session.gc.request", "session.gc.outcome");

/// The name of the registry file under the project's `.fgos`.
const REGISTRY_FILE: &str = "sessions.json";
/// The directory name under the machine's temporary directory that holds every session checkout.
const SESSIONS_DIR_NAME: &str = "fgos-sessions";
/// How long a registry hold waits for another holder.
const SESSIONS_LOCK_WAIT_MS: u64 = 10_000;
/// How long a worktree creation waits for the worktree-admin lock.
const WORKTREE_ADMIN_WAIT_MS: u64 = 30_000;

/// One `fgos session` call, as the projector read it. `cwd` is the caller's own directory.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SessionRequest {
    Start {
        item: Option<String>,
        cwd: PathBuf,
    },
    End {
        session_id: String,
        force: bool,
        cwd: PathBuf,
    },
    List {
        cwd: PathBuf,
    },
    Gc {
        cwd: PathBuf,
    },
}

impl SessionRequest {
    /// The operation this request runs.
    pub fn operation_id(&self) -> &'static str {
        match self {
            Self::Start { .. } => START_OPERATION_ID,
            Self::End { .. } => END_OPERATION_ID,
            Self::List { .. } => LIST_OPERATION_ID,
            Self::Gc { .. } => GC_OPERATION_ID,
        }
    }
}

fn validation(message: impl Into<String>) -> CategorisedRefusal {
    CategorisedRefusal::new("validation", message)
}

/// `fgos session start [--item <id>]`, `end <session-id> [--force]`, `list`, `gc`, read from the shared
/// parser's output: the sub-command is the first positional and the session id the second. A flag that takes a
/// value but is given none (bare `--item`) is refused with Node's text; `--force` counts when it is present
/// with any value but the empty one, as Node's `Boolean(flags.force)` reads it.
pub fn project_session_request(
    parsed: &ParsedArgs,
    cwd: PathBuf,
) -> Result<SessionRequest, CategorisedRefusal> {
    match parsed.positional.first().map(String::as_str) {
        Some("start") => {
            let item = match parsed.flag("item") {
                None => None,
                Some(FlagValue::One(FlagScalar::Str(id))) if !id.is_empty() => Some(id.clone()),
                Some(_) => {
                    return Err(validation(
                        "session start --item requires a non-empty id value (omit --item entirely to start a session with no item bound)",
                    ))
                }
            };
            Ok(SessionRequest::Start { item, cwd })
        }
        Some("end") => {
            let session_id = parsed
                .positional
                .get(1)
                .filter(|id| !id.is_empty())
                .cloned()
                .ok_or_else(|| {
                    validation(
                        "session end requires a session id: fgos session end <session-id> [--force]",
                    )
                })?;
            let force = match parsed.flag("force") {
                None => false,
                Some(FlagValue::One(FlagScalar::Str(text))) => !text.is_empty(),
                Some(_) => true,
            };
            Ok(SessionRequest::End {
                session_id,
                force,
                cwd,
            })
        }
        Some("list") => Ok(SessionRequest::List { cwd }),
        Some("gc") => Ok(SessionRequest::Gc { cwd }),
        Some(other) => Err(validation(format!(
            "unknown session sub-verb \"{other}\". Usage: fgos session <start|end|list|gc> ..."
        ))),
        None => Err(validation(
            "session requires a sub-verb: fgos session <start|end|list|gc> ...",
        )),
    }
}

/// Reads the call `args` (verb first) and the caller's directory into a request.
pub fn project_session_args(args: &[OsString]) -> Result<SessionRequest, CategorisedRefusal> {
    let tokens: Vec<OsString> = args
        .iter()
        .skip(1)
        .map(|token| OsString::from(token.to_string_lossy().into_owned()))
        .collect();
    let parsed = parse_args(&tokens).unwrap_or_default();
    let cwd = std::env::current_dir()
        .map_err(|error| validation(format!("the current directory cannot be read: {error}")))?;
    project_session_request(&parsed, cwd)
}

/// Why a session operation did not complete: a refusal of the verb (a `SessionError`, exit 4) or a lock held
/// past its wait (exit 7).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Fault {
    Session(String),
    LockHeld(String),
}

impl Fault {
    fn session(message: impl Into<String>) -> Self {
        Self::Session(message.into())
    }

    /// The refusal the host presents: the Node CLI's category and text.
    pub fn into_refusal(self) -> CategorisedRefusal {
        match self {
            Self::Session(message) => CategorisedRefusal::new("validation", message),
            Self::LockHeld(message) => CategorisedRefusal::new("lock-timeout", message),
        }
    }

    pub fn message(&self) -> &str {
        match self {
            Self::Session(message) | Self::LockHeld(message) => message,
        }
    }
}

type Outcome<T> = Result<T, Fault>;

/// What a retained forced end leaves: the ref that keeps the session's own commit and the snapshot beside it.
struct Retained {
    retained_ref: String,
    snapshot: String,
}

/// Everything a session operation reads from outside its request: the machine state root (for the Git driver),
/// the directory session checkouts are made under, the home directory the root door excludes, and the Event
/// Store lifecycle `end` seals through.
pub struct Context<'a> {
    pub state_root: PathBuf,
    pub sessions_dir: PathBuf,
    pub home: Option<PathBuf>,
    pub lifecycle: &'a dyn Lifecycle,
}

impl<'a> Context<'a> {
    /// The context of this process: its state root, `<tmp>/fgos-sessions` and `HOME`.
    pub fn of_process(lifecycle: &'a dyn Lifecycle) -> Self {
        Self {
            state_root: fgos_holder_lock::state_root().0,
            sessions_dir: std::env::temp_dir().join(SESSIONS_DIR_NAME),
            home: fgos_config::machine::home_dir(|key| std::env::var(key).ok()),
            lifecycle,
        }
    }

    /// Runs one request; the answer is the JSON `data` of the envelope.
    pub fn run(&self, request: &SessionRequest) -> Outcome<Value> {
        match request {
            SessionRequest::Start { item, cwd } => self.start(cwd, item.as_deref()),
            SessionRequest::End {
                session_id,
                force,
                cwd,
            } => self.end(cwd, session_id, *force),
            SessionRequest::List { cwd } => self.list(cwd),
            SessionRequest::Gc { cwd } => self.gc(cwd),
        }
    }

    /// The root the caller's directory is a project of: the nearest `.fgos` up from it within its checkout, else
    /// the checkout's top level, else the directory itself. `--dir` is not read: a session always acts on the
    /// caller's own project.
    fn root_of(&self, cwd: &Path) -> Outcome<PathBuf> {
        use fgos_git::invocation_root::{resolve_invocation_root, RootPolicy, RootRequest};
        resolve_invocation_root(&RootRequest {
            cwd,
            dir: None,
            policy: RootPolicy::CallerTree,
            home: self.home.as_deref(),
        })
        .map(|root| root.root)
        .map_err(|refusal| Fault::session(refusal.message))
    }

    fn driver(&self) -> Outcome<GitDriver> {
        GitDriver::new(&self.state_root).map_err(|error| {
            Fault::session(format!("opening the Git driver failed: {}", error.cause))
        })
    }

    /// The repository holding `path`, or `None` outside one.
    fn open(&self, driver: &GitDriver, path: &Path) -> Outcome<Option<RepoHandle>> {
        match driver.resolve_repo(path, path) {
            Ok(ResolveRepo::Repository(repo)) => Ok(Some(repo)),
            Ok(ResolveRepo::NotARepository) => Ok(None),
            Err(error) => Err(Fault::session(error.cause)),
        }
    }

    /// The commit `HEAD` names in the checkout `path` sits in.
    fn current_head(&self, driver: &GitDriver, path: &Path) -> Outcome<Oid> {
        let unreadable = |cause: &str| {
            Fault::session(format!(
                "reading ref HEAD failed in \"{}\": {cause}",
                path.display()
            ))
        };
        let Some(repo) = self
            .open(driver, path)
            .map_err(|f| unreadable(f.message()))?
        else {
            return Err(unreadable("unknown ref HEAD"));
        };
        match driver.resolve_commit_ref(&repo, "HEAD") {
            Ok(Some(oid)) => Ok(oid),
            Ok(None) => Err(unreadable("unknown ref HEAD")),
            Err(error) => Err(unreadable(&error.cause)),
        }
    }

    /// The writer a Git port records for the store at `fgos_dir`: the identity's id as text.
    fn writer(fgos_dir: &Path) -> String {
        fgos_identity::resolve::resolve_current(Some(fgos_dir))
            .id
            .to_string()
    }

    fn start(&self, cwd: &Path, item: Option<&str>) -> Outcome<Value> {
        let root = self.root_of(cwd)?;
        let fgos_dir = fgos_dir_of(&root);
        let driver = self.driver()?;
        let head = self.current_head(&driver, &root)?;
        let cwd_real = realpath_or(cwd);
        let session_id = new_session_id()?;

        {
            let _hold = lock_sessions(&fgos_dir)?;
            for entry in read_registry(&fgos_dir)? {
                let Some(worktree) = entry.get("worktreePath").and_then(Value::as_str) else {
                    continue;
                };
                let worktree_real = realpath_or(Path::new(worktree));
                if cwd_real.starts_with(&worktree_real) {
                    return Err(Fault::session(format!(
                        "cannot start a session from inside an existing session worktree (cwd \"{}\" is within session \"{}\" at \"{}\")",
                        cwd_real.display(),
                        entry.get("sessionId").and_then(Value::as_str).unwrap_or(""),
                        worktree_real.display()
                    )));
                }
            }
        }

        std::fs::create_dir_all(&self.sessions_dir).map_err(|error| {
            Fault::session(format!(
                "creating \"{}\" failed: {error}",
                self.sessions_dir.display()
            ))
        })?;
        let repo = self
            .open(&driver, &root)?
            .ok_or_else(|| Fault::session(format!("\"{}\" is not a repository", root.display())))?;
        let trusted_main = repo.trusted_main_root().to_path_buf();
        let writer = Self::writer(&trusted_main.join(".fgos"));
        let created = {
            let admin = lock_worktree_admin(&trusted_main)?;
            let handle = admin
                .handle("worktree-admin")
                .ok_or_else(|| Fault::session("the worktree-admin hold is missing"))?;
            let borrowed = BorrowedHandle::new(handle).map_err(|error| {
                Fault::session(format!(
                    "borrowing the worktree-admin hold failed: {error:?}"
                ))
            })?;
            driver.create_detached_worktree(
                &repo,
                vec![borrowed],
                &self.sessions_dir,
                &session_id,
                &head,
                &writer,
                &new_session_id()?,
            )
        }
        .map_err(|error| {
            Fault::session(format!(
                "git worktree add --detach failed for session \"{session_id}\": {}",
                error.cause
            ))
        })?;
        let worktree_path = created.path;

        if let Err(error) = symlink_dir(&fgos_dir, &worktree_path.join(".fgos")) {
            // Best-effort rollback of the checkout just made; the refusal below is the one that matters.
            let _ = self.remove_checkout(&driver, &worktree_path, None);
            return Err(Fault::session(format!(
                "symlinking .fgos into session \"{session_id}\" worktree failed: {error}"
            )));
        }

        let entry = json!({
            "sessionId": session_id,
            "worktreePath": worktree_path.to_string_lossy(),
            "itemId": item,
            "startCommit": head.as_str(),
            "pid": std::process::id(),
            "record": self_record(),
            "startedAt": fgos_host_runtime::civil_time::format_system_time_utc(std::time::SystemTime::now()),
        });
        let _hold = lock_sessions(&fgos_dir)?;
        let mut entries = read_registry(&fgos_dir)?;
        entries.push(entry.clone());
        write_registry(&fgos_dir, &entries)?;
        Ok(summary(&entry))
    }

    fn end(&self, cwd: &Path, session_id: &str, force: bool) -> Outcome<Value> {
        let root = self.root_of(cwd)?;
        let fgos_dir = fgos_dir_of(&root);
        let hold = lock_sessions(&fgos_dir)?;
        let answer = self.end_locked(&fgos_dir, session_id, force);
        drop(hold);
        // A clean writer exit seals what the session left open, outside the `sessions` lock and whatever the end
        // did. The one trigger door; `end` stays false, so no publish child starts, and a trigger never fails its
        // caller (the Node session end records nothing of it either).
        if self.lifecycle.platform_supported() {
            let _ = self.lifecycle.trigger(
                &root,
                Policy {
                    shutdown: true,
                    ..Policy::default()
                },
            );
        }
        answer
    }

    fn end_locked(&self, fgos_dir: &Path, session_id: &str, force: bool) -> Outcome<Value> {
        let entries = read_registry(fgos_dir)?;
        let entry = entries
            .iter()
            .find(|row| row.get("sessionId").and_then(Value::as_str) == Some(session_id))
            .cloned()
            .ok_or_else(|| {
                Fault::session(format!("unknown or already-ended session \"{session_id}\""))
            })?;
        let worktree = PathBuf::from(
            entry
                .get("worktreePath")
                .and_then(Value::as_str)
                .unwrap_or(""),
        );
        let start_commit = entry
            .get("startCommit")
            .and_then(Value::as_str)
            .unwrap_or("")
            .to_owned();
        let driver = self.driver()?;

        if !force {
            let head_now = self.current_head(&driver, &worktree).map_err(|fault| {
                Fault::session(format!(
                    "cannot read HEAD of session \"{session_id}\" worktree at \"{}\": {}",
                    worktree.display(),
                    fault.message()
                ))
            })?;
            if head_now.as_str() != start_commit {
                let divergent =
                    self.divergent_commits(&driver, &worktree, &start_commit, &head_now)?;
                return Err(Fault::session(format!(
                    "session \"{session_id}\" worktree at \"{}\" has diverged from its start commit {start_commit} — refusing to remove without force. Dangling commit(s): {}",
                    worktree.display(),
                    divergent.join(", ")
                )));
            }
        }

        let link = unlink_fgos_symlink(&worktree);
        let retain_to = force.then_some(start_commit.as_str());
        let retained = match self.remove_checkout(&driver, &worktree, retain_to) {
            Ok(retained) => retained,
            Err(message) => {
                restore_fgos_symlink(&worktree, link);
                return Err(Fault::session(format!(
                    "git worktree remove failed for session \"{session_id}\": {message}"
                )));
            }
        };
        let remaining: Vec<Value> = entries
            .into_iter()
            .filter(|row| row.get("sessionId").and_then(Value::as_str) != Some(session_id))
            .collect();
        write_registry(fgos_dir, &remaining)?;
        if let Some(retained) = &retained {
            eprintln!(
                "Session commit preserved at {}; snapshot {}",
                retained.retained_ref, retained.snapshot
            );
        }
        let mut answer = summary(&entry);
        answer["forced"] = Value::Bool(force);
        Ok(answer)
    }

    /// The commits `right` has that `left` has not, as Git lists them, read in the checkout `worktree`.
    fn divergent_commits(
        &self,
        driver: &GitDriver,
        worktree: &Path,
        left: &str,
        right: &Oid,
    ) -> Outcome<Vec<String>> {
        let repo = self.open(driver, worktree)?.ok_or_else(|| {
            Fault::session(format!("\"{}\" is not a repository", worktree.display()))
        })?;
        let left = Oid::parse(left, repo.object_format()).map_err(|_| {
            Fault::session(format!(
                "the recorded start commit \"{left}\" is not a commit id"
            ))
        })?;
        let compared = driver
            .compare_commits(&repo, &left, right)
            .map_err(|error| Fault::session(error.cause))?;
        Ok(compared["commits"]
            .as_array()
            .map(|commits| {
                commits
                    .iter()
                    .filter_map(|commit| commit.as_str().map(str::to_owned))
                    .collect()
            })
            .unwrap_or_default())
    }

    fn list(&self, cwd: &Path) -> Outcome<Value> {
        let root = self.root_of(cwd)?;
        let fgos_dir = fgos_dir_of(&root);
        // No store, no session: nothing to lock, and a read never creates one.
        if !fgos_dir.is_dir() {
            return Ok(json!([]));
        }
        let _hold = lock_sessions(&fgos_dir)?;
        Ok(Value::Array(read_registry(&fgos_dir)?))
    }

    fn gc(&self, cwd: &Path) -> Outcome<Value> {
        let root = self.root_of(cwd)?;
        let fgos_dir = fgos_dir_of(&root);
        let _hold = lock_sessions(&fgos_dir)?;
        let entries = read_registry(&fgos_dir)?;
        let driver = self.driver()?;
        let registered = self.registered_worktrees(&driver, &root)?;
        let caller = realpath_or(&std::path::absolute(cwd).unwrap_or_else(|_| cwd.to_path_buf()));
        let (mut reclaimed, mut skipped, mut kept) = (Vec::new(), Vec::new(), Vec::new());

        for entry in entries {
            let id = entry
                .get("sessionId")
                .and_then(Value::as_str)
                .unwrap_or("")
                .to_owned();
            let worktree = PathBuf::from(
                entry
                    .get("worktreePath")
                    .and_then(Value::as_str)
                    .unwrap_or(""),
            );
            let entry_real = realpath_or(&worktree);
            // The caller can never be reclaiming the worktree it runs from: the call proves it is in use, and
            // its own recorded pid (the one-shot `session start`) is dead by design.
            if entry_real == caller {
                kept.push(entry);
                continue;
            }
            let missing_from_git = !registered.contains(&entry_real);
            let pid_dead = recorded_process_is_dead(&entry);
            if !missing_from_git && !pid_dead {
                kept.push(entry); // a live, still-registered session is never touched
                continue;
            }
            let on_disk = worktree.exists();
            if on_disk && !missing_from_git {
                // A diverged orphan keeps its dangling commit; a dirty one keeps its uncommitted work. An
                // unreadable status counts as dirty: never assume clean.
                let head_now = self.current_head(&driver, &worktree).ok();
                let start = entry.get("startCommit").and_then(Value::as_str);
                if head_now
                    .as_ref()
                    .is_some_and(|head| Some(head.as_str()) != start)
                    || self.checkout_is_dirty(&driver, &worktree)
                {
                    skipped.push(id);
                    kept.push(entry);
                    continue;
                }
            }
            if on_disk {
                let link = unlink_fgos_symlink(&worktree);
                if self.remove_checkout(&driver, &worktree, None).is_err() {
                    restore_fgos_symlink(&worktree, link);
                    skipped.push(id);
                    kept.push(entry);
                    continue;
                }
            }
            if !missing_from_git && !on_disk {
                skipped.push(id);
                kept.push(entry);
                continue;
            }
            reclaimed.push(id);
        }

        if !reclaimed.is_empty() {
            write_registry(&fgos_dir, &kept)?;
        }
        Ok(json!({"reclaimed": reclaimed, "skipped": skipped}))
    }

    /// Every path Git registers as a worktree of the repository `root` sits in, as real paths.
    fn registered_worktrees(&self, driver: &GitDriver, root: &Path) -> Outcome<Vec<PathBuf>> {
        let listing_failed =
            |cause: String| Fault::session(format!("listing git worktrees failed: {cause}"));
        let repo = self
            .open(driver, root)
            .map_err(|fault| listing_failed(fault.message().to_owned()))?
            .ok_or_else(|| listing_failed("not a repository".into()))?;
        let mut paths = Vec::new();
        let mut cursor = None;
        loop {
            let page = driver
                .list_worktrees(&repo, cursor, 4096)
                .map_err(|error| listing_failed(error.cause))?;
            for row in &page.entries {
                paths.push(realpath_or(&path_of_bytes(&row.path)));
            }
            match page.next_cursor {
                Some(next) => cursor = Some(next),
                None => break,
            }
        }
        Ok(paths)
    }

    /// Whether the checkout `worktree` holds uncommitted work (`.fgos` aside). Unreadable counts as dirty.
    fn checkout_is_dirty(&self, driver: &GitDriver, worktree: &Path) -> bool {
        let facts = (|| {
            let repo = self.open(driver, worktree).ok()??;
            let head = self.current_head(driver, worktree).ok()?;
            driver.checkout_facts(&repo, &head).ok()
        })();
        match facts {
            Some(facts) => facts["status"]
                .as_array()
                .is_none_or(|status| !status.is_empty()),
            None => true,
        }
    }

    /// Removes the session checkout `worktree` under its custody lease. With `retain_to` and a HEAD that moved
    /// off it, the session's own commit is first pinned by a SafeRestore back to `retain_to`, and the pin is
    /// answered. The error is the text after `git worktree remove failed for "<path>"`.
    fn remove_checkout(
        &self,
        driver: &GitDriver,
        worktree: &Path,
        retain_to: Option<&str>,
    ) -> Result<Option<Retained>, String> {
        let failed = |cause: String| {
            format!(
                "git worktree remove failed for \"{}\": {cause}",
                worktree.display()
            )
        };
        let wt_repo = match driver.resolve_repo(worktree, worktree) {
            Ok(ResolveRepo::Repository(repo)) => repo,
            Ok(ResolveRepo::NotARepository) => {
                return Err(failed(format!(
                    "reading ref HEAD failed in \"{}\": unknown ref HEAD",
                    worktree.display()
                )))
            }
            Err(error) => return Err(failed(error.cause)),
        };
        let trusted_main = wt_repo.trusted_main_root().to_path_buf();
        let main_repo = match driver.resolve_repo(&trusted_main, &trusted_main) {
            Ok(ResolveRepo::Repository(repo)) => repo,
            Ok(ResolveRepo::NotARepository) => return Err(failed("not-a-repository".into())),
            Err(error) => return Err(failed(error.cause)),
        };
        let writer = Self::writer(&trusted_main.join(".fgos"));

        let custody_path =
            fgos_git::custody_lock_path(&wt_repo, worktree).map_err(|e| failed(e.cause))?;
        if let Some(parent) = custody_path.parent() {
            std::fs::create_dir_all(parent).map_err(|error| failed(error.to_string()))?;
        }
        let resource = fgos_holder_lock::Resource::new("dispatch-cwd", custody_path);
        let custody = match fgos_holder_lock::acquire(
            &resource,
            fgos_holder_lock::Mode::Ex,
            Wait::Try,
            fgos_holder_lock::DEFAULT_KILL_WAIT_MS,
        ) {
            fgos_holder_lock::Acquire::Acquired(handle) => handle,
            _ => return Err(failed("worktree custody is held".into())),
        };
        let borrow = || {
            BorrowedHandle::new(&custody)
                .map_err(|error| failed(format!("borrowing the custody lease failed: {error:?}")))
        };

        let mut retained = None;
        let head_of = || -> Result<Oid, String> {
            match driver.resolve_commit_ref(&wt_repo, "HEAD") {
                Ok(Some(oid)) => Ok(oid),
                Ok(None) => Err(failed(format!(
                    "reading ref HEAD failed in \"{}\": unknown ref HEAD",
                    worktree.display()
                ))),
                Err(error) => Err(failed(error.cause)),
            }
        };
        let mut expected_tip = head_of()?;
        if let Some(target) = retain_to.filter(|target| *target != expected_tip.as_str()) {
            let restore_id =
                new_session_id().map_err(|fault| failed(fault.message().to_owned()))?;
            let request = RestoreRequest {
                expected_head: expected_tip.as_str().to_owned(),
                target: target.to_owned(),
                reason: "retain forced session HEAD before cleanup".into(),
                reapply_local_delta: false,
                allowed_replacements: Vec::new(),
                checkout_baseline: None,
                discard_local_delta: true,
                require_clean_baseline: true,
                require_staged_only: false,
                confirmed_by: None,
            };
            let saved = driver
                .apply_restore(
                    &wt_repo,
                    vec![borrow()?],
                    &request,
                    &writer,
                    &restore_id,
                    &wal::OsFileSystem,
                )
                .map_err(|error| failed(error.cause))?;
            retained = Some(Retained {
                retained_ref: format!("refs/fgos/git-operations/{restore_id}/candidate"),
                snapshot: saved.snapshot,
            });
            expected_tip = head_of().map_err(|cause| with_retained(cause, &retained))?;
        }
        let delivered_to = expected_tip.clone();
        let evidence_digest = format!(
            "{:x}",
            Sha256::digest(
                json!({
                    "worktreePath": worktree.to_string_lossy(),
                    "expectedTip": expected_tip.as_str(),
                    "deliveredTo": delivered_to.as_str(),
                })
                .to_string()
                .as_bytes()
            )
        );
        let remove_id = new_session_id().map_err(|fault| failed(fault.message().to_owned()))?;
        let removal = driver.remove_worktree(
            &main_repo,
            vec![borrow().map_err(|cause| with_retained(cause, &retained))?],
            worktree,
            &WorktreeDelivery {
                expected_tip,
                delivered_to,
                evidence_digest,
            },
            &writer,
            &remove_id,
            IgnoredBytes::Preserve,
        );
        drop(custody);
        removal.map_err(|error| with_retained(failed(error.cause), &retained))?;
        // The removal already succeeded; a prune that cannot run leaves a registration Git prunes later.
        let _ = driver.prune_worktree(&main_repo, vec![], &remove_id);
        Ok(retained)
    }
}

/// The error text of a removal that failed after a forced end pinned the session's own commit: the pin is named.
fn with_retained(cause: String, retained: &Option<Retained>) -> String {
    match retained {
        Some(retained) => format!(
            "{cause}; commit preserved at {}; snapshot {}",
            retained.retained_ref, retained.snapshot
        ),
        None => cause,
    }
}

/// The public envelope of a registry row: an explicit projection, never a spread of the row.
fn summary(entry: &Value) -> Value {
    let field = |name: &str| entry.get(name).cloned().unwrap_or(Value::Null);
    json!({
        "sessionId": field("sessionId"),
        "worktreePath": field("worktreePath"),
        "itemId": field("itemId"),
        "startCommit": field("startCommit"),
        "pid": field("pid"),
        "startedAt": field("startedAt"),
    })
}

fn fgos_dir_of(root: &Path) -> PathBuf {
    let dir = root.join(".fgos");
    // Inside a session worktree `.fgos` is a symlink to the shared store: lock and write the store itself.
    std::fs::canonicalize(&dir).unwrap_or(dir)
}

/// A random version 4 UUID in its text form: a session id, and the id of each Git operation.
fn new_session_id() -> Outcome<String> {
    let mut bytes = fgos_identity::text::random_bytes::<16>()
        .map_err(|error| Fault::session(format!("the system random generator failed: {error}")))?;
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    let hex: String = bytes.iter().map(|byte| format!("{byte:02x}")).collect();
    Ok(format!(
        "{}-{}-{}-{}-{}",
        &hex[0..8],
        &hex[8..12],
        &hex[12..16],
        &hex[16..20],
        &hex[20..32]
    ))
}

/// This process as the registry records it: the identity tuple the judge reads back.
fn self_record() -> Value {
    match fgos_process::facts::self_identity() {
        Some(tuple) => tuple.to_record().to_json(),
        // Its start time could not be read: the record still names who this is, and the judge says unknown.
        None => fgos_process::facts::Record {
            host: Some(fgos_process::facts::host()),
            boot_id: fgos_process::facts::boot_id(),
            pid_ns: Some(fgos_process::facts::pid_ns().id),
            pid: Some(fgos_process::ProcId(std::process::id())),
            ..Default::default()
        }
        .to_json(),
    }
}

/// Whether the process a row records is provably gone (alive and unknown are both "held": a record this
/// observer cannot disprove is never reclaimed).
fn recorded_process_is_dead(entry: &Value) -> bool {
    use fgos_process::facts::{judge_here, Record, Verdict};
    let record = match entry.get("record") {
        Some(record) if !record.is_null() => Record::from_json(record),
        _ => Record::from_json(&json!({"pid": entry.get("pid").cloned().unwrap_or(Value::Null)})),
    };
    judge_here(&record) == Verdict::Dead
}

/// A real path where one exists, else the lexically normalised absolute path.
fn realpath_or(path: &Path) -> PathBuf {
    std::fs::canonicalize(path).unwrap_or_else(|_| {
        let absolute = std::path::absolute(path).unwrap_or_else(|_| path.to_path_buf());
        let mut normal = PathBuf::new();
        for component in absolute.components() {
            match component {
                Component::CurDir => {}
                Component::ParentDir => {
                    normal.pop();
                }
                other => normal.push(other.as_os_str()),
            }
        }
        normal
    })
}

#[cfg(unix)]
fn path_of_bytes(bytes: &[u8]) -> PathBuf {
    use std::os::unix::ffi::OsStrExt;
    PathBuf::from(std::ffi::OsStr::from_bytes(bytes))
}

#[cfg(not(unix))]
fn path_of_bytes(bytes: &[u8]) -> PathBuf {
    PathBuf::from(String::from_utf8_lossy(bytes).into_owned())
}

#[cfg(unix)]
fn symlink_dir(target: &Path, link: &Path) -> std::io::Result<()> {
    std::os::unix::fs::symlink(target, link)
}

#[cfg(not(unix))]
fn symlink_dir(target: &Path, link: &Path) -> std::io::Result<()> {
    std::os::windows::fs::symlink_dir(target, link)
}

/// Removes the `.fgos` symlink this module made inside a session checkout (never its target) so Git's plain
/// removal sees only the checkout's own bytes; answers where it pointed.
fn unlink_fgos_symlink(worktree: &Path) -> Option<PathBuf> {
    let link = worktree.join(".fgos");
    let is_link = std::fs::symlink_metadata(&link)
        .map(|meta| meta.file_type().is_symlink())
        .unwrap_or(false);
    if !is_link {
        return None;
    }
    let target = std::fs::read_link(&link).ok()?;
    std::fs::remove_file(&link).ok()?;
    Some(target)
}

/// Puts the symlink back after a refused removal; a failure never masks the refusal.
fn restore_fgos_symlink(worktree: &Path, target: Option<PathBuf>) {
    if let Some(target) = target {
        let _ = symlink_dir(&target, &worktree.join(".fgos"));
    }
}

/// Takes the `sessions` lock, waiting up to its bound. Dropping the answer releases it.
fn lock_sessions(fgos_dir: &Path) -> Outcome<LockScope<'static>> {
    let mut scope = LockScope::seeded(vec![]).map_err(|error| Fault::session(error.to_string()))?;
    let params = BTreeMap::from([(
        "fgosDir".to_owned(),
        fgos_dir.to_string_lossy().into_owned(),
    )]);
    match scope.acquire("sessions", &params, Wait::Ms(SESSIONS_LOCK_WAIT_MS)) {
        Ok(_) => Ok(scope),
        Err(_) => {
            let lock_path = fgos_dir.join("locks").join("sessions.lock");
            let holder = match fgos_holder_lock::holders(&fgos_holder_lock::Resource::new(
                "sessions",
                lock_path.clone(),
            )) {
                Ok(fgos_holder_lock::HoldersList::List(list)) => list.first().map(|h| h.pid.0),
                _ => None,
            };
            Err(Fault::session(format!(
                "timed out acquiring sessions.lock at \"{}\" after {SESSIONS_LOCK_WAIT_MS}ms{}",
                lock_path.display(),
                holder
                    .map(|pid| format!(" (held by pid {pid})"))
                    .unwrap_or_default()
            )))
        }
    }
}

/// Takes the worktree-admin lock of the project at `trusted_main`, waiting up to its bound.
fn lock_worktree_admin(trusted_main: &Path) -> Outcome<LockScope<'static>> {
    let mut scope = LockScope::seeded(vec![]).map_err(|error| Fault::session(error.to_string()))?;
    let fgos_dir = trusted_main.join(".fgos");
    let params = BTreeMap::from([(
        "fgosDir".to_owned(),
        fgos_dir.to_string_lossy().into_owned(),
    )]);
    match scope.acquire("worktree-admin", &params, Wait::Ms(WORKTREE_ADMIN_WAIT_MS)) {
        Ok(_) => Ok(scope),
        Err(error) => Err(Fault::LockHeld(format!(
            "worktree admin is held by another process after waiting {WORKTREE_ADMIN_WAIT_MS} ms ({error})"
        ))),
    }
}

/// Reads the registry: a missing file is an empty registry; a file that is unreadable, not JSON or not an array
/// fails closed, so unknown state is never reinitialised over.
pub fn read_registry(fgos_dir: &Path) -> Outcome<Vec<Value>> {
    let path = fgos_dir.join(REGISTRY_FILE);
    let raw = match std::fs::read(&path) {
        Ok(raw) => raw,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(Vec::new()),
        Err(error) => {
            return Err(Fault::session(format!(
                "reading sessions.json at \"{}\" failed: {error}",
                path.display()
            )))
        }
    };
    let parsed: Value = serde_json::from_slice(&raw).map_err(|error| {
        Fault::session(format!(
            "sessions.json at \"{}\" is corrupt (not valid JSON): {error}",
            path.display()
        ))
    })?;
    match parsed {
        Value::Array(rows) => Ok(rows),
        _ => Err(Fault::session(format!(
            "sessions.json at \"{}\" is corrupt (expected a JSON array)",
            path.display()
        ))),
    }
}

/// Writes the registry atomically, in the shape every reader reads: a two-space JSON array and a newline.
fn write_registry(fgos_dir: &Path, entries: &[Value]) -> Outcome<()> {
    let mut text = serde_json::to_string_pretty(entries)
        .map_err(|error| Fault::session(format!("encoding sessions.json failed: {error}")))?;
    text.push('\n');
    fgos_durable_file::replace_durably_with_mode(fgos_dir, REGISTRY_FILE, text.as_bytes(), 0o666)
        .map(drop)
        .map_err(|error| {
            Fault::session(format!(
                "writing sessions.json at \"{}\" failed: {error}",
                fgos_dir.join(REGISTRY_FILE).display()
            ))
        })
}

/// The provider of the four session operations.
pub struct SessionProvider {
    descriptor: ProviderDescriptor,
    lifecycle: Arc<dyn Lifecycle + Send + Sync>,
}

impl SessionProvider {
    pub fn for_descriptor(
        descriptor: ProviderDescriptor,
        lifecycle: Arc<dyn Lifecycle + Send + Sync>,
    ) -> Self {
        Self {
            descriptor,
            lifecycle,
        }
    }
}

impl OperationProvider for SessionProvider {
    fn descriptor(&self) -> &ProviderDescriptor {
        &self.descriptor
    }

    fn invoke<'a>(
        &'a self,
        _invocation: &'a HostInvocation,
        request: OperationRequest,
        _control: InvocationControl,
        events: &'a dyn EventSink,
    ) -> Pin<Box<dyn Future<Output = Result<ProviderOutcome, ProviderError>> + Send + 'a>> {
        Box::pin(async move {
            events.record_event(&format!("{}.invoked", self.descriptor.operation_id));
            let request = request
                .input
                .downcast_ref::<SessionRequest>()
                .ok_or_else(|| {
                    ProviderError::SemanticValidation("input is not SessionRequest".into())
                })?;
            let context = Context::of_process(self.lifecycle.as_ref());
            let output: Box<dyn std::any::Any + Send> = match context.run(request) {
                Ok(data) => Box::new(data),
                Err(fault) => Box::new(fault.into_refusal()),
            };
            Ok(ProviderOutcome::completed(
                self.descriptor.outcome_contract.clone(),
                output,
            ))
        })
    }
}
