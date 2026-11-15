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
//! re-takes it to append the row. `end` and `gc` hold it across their removals, and inside it take the checkout
//! custody lease (one attempt, never waited for) and, in the Git port, the worktree-admin lock (waited for up to
//! five seconds); `list` waits for the lock for less than the Node client's timeout. A registry that is present but
//! not a JSON array fails closed: it is never read as empty and never rewritten.
//!
//! A row is trusted only as far as the registry file is: `end` and `gc` remove a checkout only when its real path
//! lies under the sessions directory (never the directory itself) and it is a worktree of this project's own
//! repository, and `gc` removes nothing Git does not list as a worktree.
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
/// How long `list` waits: less than the five seconds the Node client gives a host call, so a busy end or gc is
/// answered with the named timeout, never with the client's own.
const LIST_LOCK_WAIT_MS: u64 = 3_000;
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
    let parsed = parse_args(&tokens).map_err(|error| validation(error.to_string()))?;
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

    /// The project the caller's directory belongs to: the nearest `.fgos` up from it within its checkout, else, for a
    /// linked worktree that carries no store of its own, the store of its main checkout. Where there is none (no
    /// repository, or a repository nobody initialised) the call is refused and nothing is created: a session never
    /// makes a store where it is run. `--dir` is not read: a session always acts on the caller's own project.
    fn root_of(&self, cwd: &Path) -> Outcome<PathBuf> {
        use fgos_git::invocation_root::{resolve_invocation_root, RootPolicy, RootRequest};
        let asked = resolve_invocation_root(&RootRequest {
            cwd,
            dir: None,
            policy: RootPolicy::CallerTree,
            home: self.home.as_deref(),
        })
        .map_err(|refusal| Fault::session(refusal.message))?;
        if asked.found {
            return Ok(asked.root);
        }
        if let Ok(Some(main)) = fgos_git::main_checkout_root(cwd) {
            if main.join(".fgos").is_dir() {
                return Ok(main);
            }
        }
        Err(Fault::session(format!(
            "not inside an fgOS project: no .fgos directory above {} -- run the command inside a project, or run 'fgctl init' in the project [not-in-project]",
            cwd.display()
        )))
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
        // The session starts on the HEAD of the checkout the caller stands in, as the base release did.
        let head = self.current_head(&driver, cwd)?;
        let cwd_real = realpath_or(cwd);
        let session_id = new_session_id()?;

        {
            let _hold = lock_sessions(&fgos_dir, SESSIONS_LOCK_WAIT_MS)?;
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
        let repo = self.project_repo(&driver, &root)?;
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
            let _ = self.remove_checkout(&driver, &repo, &worktree_path, None);
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
        let _hold = lock_sessions(&fgos_dir, SESSIONS_LOCK_WAIT_MS)?;
        let mut entries = read_registry(&fgos_dir)?;
        entries.push(entry.clone());
        write_registry(&fgos_dir, &entries)?;
        Ok(summary(&entry))
    }

    fn end(&self, cwd: &Path, session_id: &str, force: bool) -> Outcome<Value> {
        let root = self.root_of(cwd)?;
        let fgos_dir = fgos_dir_of(&root);
        let hold = lock_sessions(&fgos_dir, SESSIONS_LOCK_WAIT_MS)?;
        let answer = self.end_locked(&root, &fgos_dir, session_id, force);
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

    fn end_locked(
        &self,
        root: &Path,
        fgos_dir: &Path,
        session_id: &str,
        force: bool,
    ) -> Outcome<Value> {
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
        // The row is only a claim: touch nothing that is not one of this project's own session checkouts.
        let project = self.project_repo(&driver, root)?;
        self.require_session_checkout(&project, &worktree)
            .map_err(|why| Fault::session(format!("session \"{session_id}\": {why}")))?;

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
        let retained = match self.remove_checkout(&driver, &project, &worktree, retain_to) {
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
        let _hold = lock_sessions(&fgos_dir, LIST_LOCK_WAIT_MS)?;
        Ok(Value::Array(read_registry(&fgos_dir)?))
    }

    fn gc(&self, cwd: &Path) -> Outcome<Value> {
        let root = self.root_of(cwd)?;
        let fgos_dir = fgos_dir_of(&root);
        let _hold = lock_sessions(&fgos_dir, SESSIONS_LOCK_WAIT_MS)?;
        let entries = read_registry(&fgos_dir)?;
        let driver = self.driver()?;
        let project = self.project_repo(&driver, &root).map_err(|fault| {
            Fault::session(format!("listing git worktrees failed: {}", fault.message()))
        })?;
        let registered = self.registered_worktrees(&driver, &project)?;
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
            // A directory Git does not list as a worktree, or one that is not this project's own session
            // checkout, is not ours to remove: the row stays and is reported.
            if on_disk
                && (missing_from_git || self.require_session_checkout(&project, &worktree).is_err())
            {
                skipped.push(id);
                kept.push(entry);
                continue;
            }
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
                if self
                    .remove_checkout(&driver, &project, &worktree, None)
                    .is_err()
                {
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

    /// Every path Git registers as a worktree of the repository `repo` belongs to, as real paths.
    fn registered_worktrees(&self, driver: &GitDriver, repo: &RepoHandle) -> Outcome<Vec<PathBuf>> {
        let listing_failed =
            |cause: String| Fault::session(format!("listing git worktrees failed: {cause}"));
        let mut paths = Vec::new();
        let mut cursor = None;
        loop {
            let page = driver
                .list_worktrees(repo, cursor, 4096)
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

    /// The repository of the project at `root`, opened at its trusted main checkout: the one handle every removal
    /// of this project's checkouts is administered through.
    fn project_repo(&self, driver: &GitDriver, root: &Path) -> Outcome<RepoHandle> {
        let not_a_repository =
            || Fault::session(format!("\"{}\" is not a repository", root.display()));
        let at_root = self.open(driver, root)?.ok_or_else(not_a_repository)?;
        let main = at_root.trusted_main_root().to_path_buf();
        self.open(driver, &main)?.ok_or_else(not_a_repository)
    }

    /// Whether `worktree` may be removed as a session checkout of the project `project`: an absolute path whose real
    /// path lies under the real sessions directory (never the directory itself) and that is a worktree of this
    /// project's own repository. The error names why not.
    fn require_session_checkout(
        &self,
        project: &RepoHandle,
        worktree: &Path,
    ) -> Result<(), String> {
        if !worktree.is_absolute() {
            return Err(format!(
                "worktree \"{}\" is not an absolute path",
                worktree.display()
            ));
        }
        let outside = || {
            format!(
                "worktree \"{}\" is not a checkout under \"{}\"; refusing to touch it",
                worktree.display(),
                self.sessions_dir.display()
            )
        };
        let base = std::fs::canonicalize(&self.sessions_dir).map_err(|_| outside())?;
        let real = std::fs::canonicalize(worktree).map_err(|_| outside())?;
        if real == base || !real.starts_with(&base) {
            return Err(outside());
        }
        // The project's own repository must resolve: two unresolvable directories are never "the same one".
        let project_common = std::fs::canonicalize(project.common_dir()).map_err(|error| {
            format!(
                "the project repository \"{}\" cannot be resolved ({error}); refusing to touch \"{}\"",
                project.common_dir().display(),
                worktree.display()
            )
        })?;
        let driver = self.driver().map_err(|fault| fault.message().to_owned())?;
        let belongs = match driver.resolve_repo(&real, &real) {
            Ok(ResolveRepo::Repository(repo)) => std::fs::canonicalize(repo.common_dir())
                .is_ok_and(|common| common == project_common),
            _ => false,
        };
        if belongs {
            Ok(())
        } else {
            Err(format!(
                "worktree \"{}\" belongs to another repository; refusing to touch it",
                worktree.display()
            ))
        }
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
        main_repo: &RepoHandle,
        worktree: &Path,
        retain_to: Option<&str>,
    ) -> Result<Option<Retained>, String> {
        let failed = |cause: String| {
            format!(
                "git worktree remove failed for \"{}\": {cause}",
                worktree.display()
            )
        };
        self.require_session_checkout(main_repo, worktree)
            .map_err(failed)?;
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
        let trusted_main = main_repo.trusted_main_root().to_path_buf();
        let writer = Self::writer(&trusted_main.join(".fgos"));

        let custody = fgos_git::acquire_checkout_custody(&wt_repo, worktree)
            .map_err(|error| failed(error.cause))?;
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
            main_repo,
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
        let _ = driver.prune_worktree(main_repo, vec![], &remove_id);
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
fn lock_sessions(fgos_dir: &Path, wait_ms: u64) -> Outcome<LockScope<'static>> {
    let mut scope = LockScope::seeded(vec![]).map_err(|error| Fault::session(error.to_string()))?;
    let params = BTreeMap::from([(
        "fgosDir".to_owned(),
        fgos_dir.to_string_lossy().into_owned(),
    )]);
    match scope.acquire("sessions", &params, Wait::Ms(wait_ms)) {
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
                "timed out acquiring sessions.lock at \"{}\" after {wait_ms}ms{}",
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

#[cfg(all(test, target_os = "linux"))]
mod tests {
    use super::*;
    use std::collections::BTreeSet;
    use std::process::Command;
    use std::sync::atomic::{AtomicU64, Ordering};
    use std::sync::Mutex;

    static NEXT: AtomicU64 = AtomicU64::new(0);

    /// Records every trigger the module asks of the Event Store lifecycle, and whether the `sessions` lock was
    /// free at that moment.
    #[derive(Default)]
    struct Recorder {
        calls: Mutex<Vec<(Policy, bool)>>,
        sessions_lock: Mutex<Option<PathBuf>>,
    }

    impl Lifecycle for Recorder {
        fn platform_supported(&self) -> bool {
            true
        }
        fn trigger(&self, _root: &Path, policy: Policy) -> Option<String> {
            let free = self
                .sessions_lock
                .lock()
                .unwrap()
                .as_ref()
                .is_none_or(|path| {
                    path.exists()
                        && fgos_holder_lock::probe(&fgos_holder_lock::Resource::new(
                            "sessions",
                            path.clone(),
                        ))
                        .is_ok_and(|probe| probe == fgos_holder_lock::Probe::Free)
                });
            self.calls.lock().unwrap().push((policy, free));
            None
        }
    }

    fn git(path: &Path, args: &[&str]) -> String {
        let out = Command::new("git")
            .arg("-C")
            .arg(path)
            .args(args)
            .output()
            .unwrap();
        assert!(
            out.status.success(),
            "git {args:?}: {}",
            String::from_utf8_lossy(&out.stderr)
        );
        String::from_utf8(out.stdout).unwrap().trim().to_owned()
    }

    struct Fixture {
        root: PathBuf,
        repo: PathBuf,
        sessions: PathBuf,
        state: PathBuf,
        recorder: Recorder,
    }

    impl Fixture {
        fn new() -> Self {
            Self::with(false)
        }

        /// `committed_fgos`: the project's own `.fgos/events.jsonl` is tracked at HEAD, as this repository's is.
        fn with(committed_fgos: bool) -> Self {
            use std::os::unix::fs::PermissionsExt;
            let root = std::env::temp_dir().join(format!(
                "fgos-session-{}-{}",
                std::process::id(),
                NEXT.fetch_add(1, Ordering::Relaxed)
            ));
            std::fs::create_dir(&root).unwrap();
            std::fs::set_permissions(&root, std::fs::Permissions::from_mode(0o700)).unwrap();
            let state = root.join("state");
            std::fs::create_dir(&state).unwrap();
            std::fs::set_permissions(&state, std::fs::Permissions::from_mode(0o700)).unwrap();
            let repo = root.join("repo");
            git(&root, &["init", "-q", "--initial-branch=main", "repo"]);
            git(&repo, &["config", "user.name", "Fixture"]);
            git(&repo, &["config", "user.email", "fixture@example.invalid"]);
            std::fs::write(repo.join("seed.txt"), "seed\n").unwrap();
            if committed_fgos {
                std::fs::create_dir(repo.join(".fgos")).unwrap();
                std::fs::write(repo.join(".fgos/events.jsonl"), "{\"seed\":true}\n").unwrap();
            }
            git(&repo, &["add", "-A"]);
            git(&repo, &["commit", "-qm", "seed"]);
            let fence = repo.join(".fgos/locks/activation.lock");
            std::fs::create_dir_all(&fence).unwrap();
            std::fs::write(
                fence.join("TOMBSTONE"),
                r#"{"lock":"activation","by":"fgos git","at":"fixture"}"#,
            )
            .unwrap();
            let sessions = root.join("worktrees");
            Self {
                root,
                repo,
                sessions,
                state,
                recorder: Recorder::default(),
            }
        }

        fn context(&self) -> Context<'_> {
            Context {
                state_root: self.state.clone(),
                sessions_dir: self.sessions.clone(),
                home: None,
                lifecycle: &self.recorder,
            }
        }

        fn start(&self) -> Outcome<Value> {
            self.start_in(&self.repo)
        }

        fn start_in(&self, cwd: &Path) -> Outcome<Value> {
            self.context().run(&SessionRequest::Start {
                item: None,
                cwd: cwd.to_path_buf(),
            })
        }

        fn end(&self, id: &str, force: bool) -> Outcome<Value> {
            self.context().run(&SessionRequest::End {
                session_id: id.into(),
                force,
                cwd: self.repo.clone(),
            })
        }

        fn list(&self) -> Vec<Value> {
            match self
                .context()
                .run(&SessionRequest::List {
                    cwd: self.repo.clone(),
                })
                .unwrap()
            {
                Value::Array(rows) => rows,
                other => panic!("list answered {other}"),
            }
        }

        fn gc_in(&self, cwd: &Path) -> Value {
            self.context()
                .run(&SessionRequest::Gc {
                    cwd: cwd.to_path_buf(),
                })
                .unwrap()
        }

        fn registry_file(&self) -> PathBuf {
            self.repo.join(".fgos").join(REGISTRY_FILE)
        }

        fn worktree_listing(&self) -> String {
            git(&self.repo, &["worktree", "list", "--porcelain"])
        }

        /// Rewrites the rows `edit` names to record a process that is gone.
        fn mark_dead(&self, ids: &[&str]) {
            let dead = {
                let mut child = Command::new("true").spawn().unwrap();
                let pid = child.id();
                child.wait().unwrap();
                pid
            };
            let rows: Vec<Value> = read_registry(&self.repo.join(".fgos"))
                .unwrap()
                .into_iter()
                .map(|mut row| {
                    if ids.contains(&row["sessionId"].as_str().unwrap()) {
                        row["pid"] = json!(dead);
                        row["record"]["pid"] = json!(dead);
                    }
                    row
                })
                .collect();
            write_registry(&self.repo.join(".fgos"), &rows).unwrap();
        }
    }

    impl Drop for Fixture {
        fn drop(&mut self) {
            // Registered session checkouts first, so no worktree of this fixture outlives it.
            for row in read_registry(&self.repo.join(".fgos")).unwrap_or_default() {
                if let Some(path) = row["worktreePath"].as_str() {
                    let _ = std::fs::remove_dir_all(path);
                }
            }
            let _ = std::fs::remove_dir_all(&self.root);
        }
    }

    fn commit_inside(worktree: &Path) -> String {
        std::fs::write(worktree.join("seed.txt"), "seed\ndiverge\n").unwrap();
        git(worktree, &["add", "seed.txt"]);
        git(worktree, &["commit", "-qm", "commit from inside session"]);
        git(worktree, &["rev-parse", "HEAD"])
    }

    fn id_of(answer: &Value) -> String {
        answer["sessionId"].as_str().unwrap().to_owned()
    }

    fn worktree_of(answer: &Value) -> PathBuf {
        PathBuf::from(answer["worktreePath"].as_str().unwrap())
    }

    fn refusal_text(outcome: Outcome<Value>) -> String {
        match outcome {
            Err(fault) => fault.message().to_owned(),
            Ok(answer) => panic!("expected a refusal, got {answer}"),
        }
    }

    fn parsed(tokens: &[&str]) -> ParsedArgs {
        let tokens: Vec<OsString> = tokens.iter().map(OsString::from).collect();
        parse_args(&tokens).unwrap()
    }

    #[test]
    fn start_makes_exactly_one_detached_worktree_with_no_new_branch() {
        let fixture = Fixture::new();
        let branches = git(&fixture.repo, &["branch", "--list"]);
        let started = fixture.start().unwrap();
        let worktree = worktree_of(&started);
        assert!(worktree.join("seed.txt").exists());
        assert_eq!(git(&fixture.repo, &["branch", "--list"]), branches);
        let symbolic = Command::new("git")
            .arg("-C")
            .arg(&worktree)
            .args(["symbolic-ref", "-q", "HEAD"])
            .status()
            .unwrap();
        assert!(!symbolic.success(), "HEAD is detached");
        let detached = fixture
            .worktree_listing()
            .lines()
            .filter(|line| *line == "detached")
            .count();
        assert_eq!(detached, 1);
        assert_eq!(
            started["startCommit"],
            git(&fixture.repo, &["rev-parse", "HEAD"])
        );
        assert_eq!(started["itemId"], Value::Null);
        assert_eq!(started["pid"], std::process::id());
        let rows = fixture.list();
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0]["sessionId"], started["sessionId"]);
        assert_eq!(rows[0]["record"]["pid"], std::process::id());
    }

    #[test]
    fn a_session_started_from_a_subdirectory_is_registered_in_the_projects_store() {
        let fixture = Fixture::new();
        let below = fixture.repo.join("sub");
        std::fs::create_dir(&below).unwrap();
        let started = fixture.start_in(&below).unwrap();
        assert!(
            !below.join(".fgos").exists(),
            "no store is made below the project"
        );
        let rows = fixture.list();
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0]["sessionId"], started["sessionId"]);
        let listed_below = fixture
            .context()
            .run(&SessionRequest::List { cwd: below })
            .unwrap();
        assert_eq!(listed_below, Value::Array(rows));
    }

    #[test]
    fn start_binds_the_item_it_is_given() {
        let fixture = Fixture::new();
        let started = fixture
            .context()
            .run(&SessionRequest::Start {
                item: Some("tsk-abc".into()),
                cwd: fixture.repo.clone(),
            })
            .unwrap();
        assert_eq!(started["itemId"], "tsk-abc");
        assert_eq!(fixture.list()[0]["itemId"], "tsk-abc");
    }

    #[test]
    fn dot_fgos_in_the_session_worktree_is_a_symlink_to_the_shared_store() {
        let fixture = Fixture::new();
        let started = fixture.start().unwrap();
        let link = worktree_of(&started).join(".fgos");
        assert!(std::fs::symlink_metadata(&link)
            .unwrap()
            .file_type()
            .is_symlink());
        std::fs::write(link.join("probe.txt"), "from-session\n").unwrap();
        assert_eq!(
            std::fs::read_to_string(fixture.repo.join(".fgos/probe.txt")).unwrap(),
            "from-session\n"
        );
        std::fs::write(fixture.repo.join(".fgos/probe2.txt"), "from-main\n").unwrap();
        assert_eq!(
            std::fs::read_to_string(link.join("probe2.txt")).unwrap(),
            "from-main\n"
        );
    }

    #[test]
    fn start_with_dot_fgos_committed_at_head_still_links_the_shared_store() {
        let fixture = Fixture::with(true);
        let started = fixture.start().unwrap();
        let link = worktree_of(&started).join(".fgos");
        assert!(std::fs::symlink_metadata(&link)
            .unwrap()
            .file_type()
            .is_symlink());
        assert_eq!(
            std::fs::canonicalize(&link).unwrap(),
            std::fs::canonicalize(fixture.repo.join(".fgos")).unwrap()
        );
        assert_eq!(
            std::fs::read_to_string(fixture.repo.join(".fgos/events.jsonl")).unwrap(),
            "{\"seed\":true}\n"
        );
    }

    #[test]
    fn start_from_inside_a_session_worktree_or_below_is_refused_and_creates_nothing() {
        let fixture = Fixture::new();
        let outer = fixture.start().unwrap();
        let worktree = std::fs::canonicalize(worktree_of(&outer)).unwrap();
        let below = worktree.join("nested");
        std::fs::create_dir(&below).unwrap();
        for cwd in [&worktree, &below] {
            let text = refusal_text(fixture.start_in(cwd));
            assert!(
                text.contains("cannot start a session from inside an existing session worktree"),
                "{text}"
            );
        }
        assert_eq!(fixture.list().len(), 1, "no nested session was registered");
        assert_eq!(
            fixture.worktree_listing().matches("detached").count(),
            1,
            "no nested worktree was created"
        );
    }

    #[test]
    fn concurrent_starts_never_lose_a_registry_row() {
        let fixture = Fixture::new();
        let recorder = Recorder::default();
        let answers: Vec<Value> = std::thread::scope(|scope| {
            let handles: Vec<_> = (0..5)
                .map(|_| {
                    scope.spawn(|| {
                        Context {
                            state_root: fixture.state.clone(),
                            sessions_dir: fixture.sessions.clone(),
                            home: None,
                            lifecycle: &recorder,
                        }
                        .run(&SessionRequest::Start {
                            item: None,
                            cwd: fixture.repo.clone(),
                        })
                        .unwrap()
                    })
                })
                .collect();
            handles.into_iter().map(|h| h.join().unwrap()).collect()
        });
        let started: BTreeSet<String> = answers.iter().map(id_of).collect();
        let listed: BTreeSet<String> = fixture.list().iter().map(id_of).collect();
        assert_eq!(started.len(), 5);
        assert_eq!(listed, started);
    }

    #[test]
    fn end_seals_once_with_shutdown_only_after_the_sessions_lock_is_released_and_also_on_failure() {
        let fixture = Fixture::new();
        let started = fixture.start().unwrap();
        *fixture.recorder.sessions_lock.lock().unwrap() =
            Some(fixture.repo.join(".fgos/locks/sessions.lock"));
        fixture.end(&id_of(&started), false).unwrap();
        let _ = fixture.end("never-existed", false).unwrap_err();
        let calls = fixture.recorder.calls.lock().unwrap();
        assert_eq!(calls.len(), 2, "one seal per end, failed or not");
        for (policy, lock_was_free) in calls.iter() {
            assert_eq!(
                *policy,
                Policy {
                    shutdown: true,
                    end: false,
                    dispatched: false
                },
                "a shutdown seal only: no publish is asked for"
            );
            assert!(lock_was_free, "the seal runs outside the sessions lock");
        }
    }

    #[test]
    fn end_removes_a_non_diverged_session_and_clears_its_row() {
        for committed_fgos in [false, true] {
            let fixture = Fixture::with(committed_fgos);
            let started = fixture.start().unwrap();
            let worktree = worktree_of(&started);
            let answer = fixture.end(&id_of(&started), false).unwrap();
            assert_eq!(answer["forced"], false);
            assert_eq!(answer["sessionId"], started["sessionId"]);
            assert!(fixture.list().is_empty());
            assert!(!worktree.exists());
            assert!(!fixture.worktree_listing().contains("detached"));
            assert!(fixture.repo.join(".fgos/locks").is_dir());
            if committed_fgos {
                assert_eq!(
                    std::fs::read_to_string(fixture.repo.join(".fgos/events.jsonl")).unwrap(),
                    "{\"seed\":true}\n"
                );
            }
        }
    }

    #[test]
    fn end_refuses_a_diverged_session_naming_the_sha_and_force_keeps_the_commit() {
        let fixture = Fixture::new();
        let started = fixture.start().unwrap();
        let worktree = worktree_of(&started);
        let dangling = commit_inside(&worktree);
        let id = id_of(&started);
        let text = refusal_text(fixture.end(&id, false));
        assert!(
            text.contains(&dangling) && text.contains("diverged"),
            "{text}"
        );
        assert!(worktree.exists(), "nothing was removed");
        assert_eq!(fixture.list().len(), 1, "the registry is unchanged");

        let answer = fixture.end(&id, true).unwrap();
        assert_eq!(answer["forced"], true);
        assert!(!worktree.exists());
        assert!(fixture.list().is_empty());
        let retained = git(
            &fixture.repo,
            &[
                "for-each-ref",
                "--format=%(objectname) %(refname)",
                "refs/fgos/git-operations",
            ],
        );
        assert!(
            retained
                .lines()
                .any(|line| line.starts_with(&dangling) && line.ends_with("/candidate")),
            "the session commit is pinned: {retained}"
        );
    }

    #[test]
    fn end_of_an_unknown_or_already_ended_session_is_a_refusal() {
        let fixture = Fixture::new();
        let text = refusal_text(fixture.end("never-existed", false));
        assert_eq!(text, "unknown or already-ended session \"never-existed\"");
        let id = id_of(&fixture.start().unwrap());
        fixture.end(&id, false).unwrap();
        let again = refusal_text(fixture.end(&id, false));
        assert!(again.contains("unknown or already-ended"));
        assert!(fixture.list().is_empty());
    }

    #[test]
    fn a_refused_removal_keeps_the_store_link_the_checkout_and_the_row() {
        let fixture = Fixture::new();
        let started = fixture.start().unwrap();
        let worktree = worktree_of(&started);
        let tip = commit_inside(&worktree);
        let link = worktree.join(".fgos");
        let target = std::fs::read_link(&link).unwrap();
        std::fs::write(worktree.join("dirty.txt"), "preserve me\n").unwrap();
        let text = refusal_text(fixture.end(&id_of(&started), true));
        assert!(
            text.contains("git worktree remove failed for session"),
            "{text}"
        );
        assert_eq!(
            std::fs::read_to_string(worktree.join("dirty.txt")).unwrap(),
            "preserve me\n"
        );
        assert_eq!(std::fs::read_link(&link).unwrap(), target);
        assert_eq!(fixture.list().len(), 1);
        assert_eq!(git(&worktree, &["rev-parse", "HEAD"]), tip);
    }

    #[test]
    fn list_answers_the_rows_and_is_empty_after_every_end() {
        let fixture = Fixture::new();
        assert!(fixture.list().is_empty());
        let one = id_of(&fixture.start().unwrap());
        let two = id_of(&fixture.start().unwrap());
        let listed: BTreeSet<String> = fixture.list().iter().map(id_of).collect();
        assert_eq!(listed, BTreeSet::from([one.clone(), two.clone()]));
        fixture.end(&one, false).unwrap();
        fixture.end(&two, false).unwrap();
        assert!(fixture.list().is_empty());
    }

    #[test]
    fn a_call_outside_any_project_is_refused_and_creates_nothing() {
        let fixture = Fixture::new();
        let bare = fixture.root.join("bare");
        std::fs::create_dir(&bare).unwrap();
        let requests = [
            SessionRequest::Start {
                item: None,
                cwd: bare.clone(),
            },
            SessionRequest::End {
                session_id: "x".into(),
                force: false,
                cwd: bare.clone(),
            },
            SessionRequest::List { cwd: bare.clone() },
            SessionRequest::Gc { cwd: bare.clone() },
        ];
        for request in requests {
            let text = refusal_text(fixture.context().run(&request));
            assert!(
                text.contains("not inside an fgOS project") && text.contains("[not-in-project]"),
                "{text}"
            );
        }
        assert_eq!(
            std::fs::read_dir(&bare).unwrap().count(),
            0,
            "nothing was created"
        );
        assert!(!fixture.sessions.exists());
    }

    #[test]
    fn a_repository_nobody_initialised_is_refused_and_gets_no_store() {
        let fixture = Fixture::new();
        let plain = fixture.root.join("plain");
        git(
            &fixture.root,
            &["init", "-q", "--initial-branch=main", "plain"],
        );
        git(&plain, &["config", "user.name", "Fixture"]);
        git(&plain, &["config", "user.email", "fixture@example.invalid"]);
        std::fs::write(plain.join("seed.txt"), "seed\n").unwrap();
        git(&plain, &["add", "-A"]);
        git(&plain, &["commit", "-qm", "seed"]);
        let text = refusal_text(fixture.start_in(&plain));
        assert!(text.contains("[not-in-project]"), "{text}");
        assert!(!plain.join(".fgos").exists());
    }

    #[test]
    fn a_linked_worktree_without_a_store_acts_on_its_main_checkouts_store() {
        let fixture = Fixture::new();
        let linked = fixture.root.join("linked");
        git(
            &fixture.repo,
            &[
                "worktree",
                "add",
                "-q",
                "--detach",
                linked.to_str().unwrap(),
                "HEAD",
            ],
        );
        let started = fixture.start_in(&linked).unwrap();
        assert!(
            !linked.join(".fgos").exists(),
            "no store is made in the linked worktree"
        );
        assert_eq!(fixture.list()[0]["sessionId"], started["sessionId"]);
        let from_linked = fixture
            .context()
            .run(&SessionRequest::List {
                cwd: linked.clone(),
            })
            .unwrap();
        assert_eq!(from_linked, Value::Array(fixture.list()));
    }

    /// A registry row that names `worktree` as a session of the fixture's project.
    fn forge_row(fixture: &Fixture, id: &str, worktree: &str, pid: Option<u32>) {
        let mut rows = read_registry(&fixture.repo.join(".fgos")).unwrap();
        let mut row = json!({
            "sessionId": id,
            "worktreePath": worktree,
            "itemId": null,
            "startCommit": git(&fixture.repo, &["rev-parse", "HEAD"]),
            "pid": pid.unwrap_or(std::process::id()),
            "startedAt": "2026-11-15T03:00:00.000Z",
        });
        if let Some(pid) = pid {
            row["record"] = json!({"pid": pid});
        }
        rows.push(row);
        write_registry(&fixture.repo.join(".fgos"), &rows).unwrap();
    }

    fn dead_pid() -> u32 {
        let mut child = Command::new("true").spawn().unwrap();
        let pid = child.id();
        child.wait().unwrap();
        pid
    }

    #[test]
    fn a_row_naming_another_repositorys_worktree_is_refused_and_that_worktree_is_left_alone() {
        let fixture = Fixture::new();
        let other = fixture.root.join("other");
        git(
            &fixture.root,
            &["init", "-q", "--initial-branch=main", "other"],
        );
        git(&other, &["config", "user.name", "Fixture"]);
        git(&other, &["config", "user.email", "fixture@example.invalid"]);
        std::fs::write(other.join("seed.txt"), "seed\n").unwrap();
        git(&other, &["add", "-A"]);
        git(&other, &["commit", "-qm", "seed"]);
        // Inside the sessions directory, so only the repository check can refuse it.
        std::fs::create_dir_all(&fixture.sessions).unwrap();
        let foreign = fixture.sessions.join("foreign");
        git(
            &other,
            &[
                "worktree",
                "add",
                "-q",
                "--detach",
                foreign.to_str().unwrap(),
                "HEAD",
            ],
        );
        forge_row(
            &fixture,
            "ended-by-mistake",
            foreign.to_str().unwrap(),
            None,
        );
        forge_row(
            &fixture,
            "reclaimed-by-mistake",
            foreign.to_str().unwrap(),
            Some(dead_pid()),
        );

        let text = refusal_text(fixture.end("ended-by-mistake", false));
        assert!(text.contains("belongs to another repository"), "{text}");
        let forced = refusal_text(fixture.end("ended-by-mistake", true));
        assert!(forced.contains("belongs to another repository"), "{forced}");
        let answer = fixture.gc_in(&fixture.repo);
        assert_eq!(answer["reclaimed"], json!([]));
        assert_eq!(
            answer["skipped"],
            json!(["ended-by-mistake", "reclaimed-by-mistake"]),
            "a directory Git does not list as a worktree of this project is reported, never removed"
        );
        assert!(
            foreign.join("seed.txt").exists(),
            "the other project's worktree is untouched"
        );
        assert!(git(&other, &["worktree", "list", "--porcelain"]).contains("foreign"));
        assert_eq!(fixture.list().len(), 2, "both rows stay");
    }

    #[test]
    fn a_project_repository_that_cannot_be_resolved_never_claims_a_checkout() {
        let fixture = Fixture::new();
        let worktree = worktree_of(&fixture.start().unwrap());
        let context = fixture.context();
        let driver = context.driver().unwrap();
        let project = context.open(&driver, &fixture.repo).unwrap().unwrap();
        assert!(
            context
                .require_session_checkout(&project, &worktree)
                .is_ok(),
            "a checkout of the project passes while the repository resolves"
        );
        // With the repository gone, neither side resolves: that must not read as "the same repository".
        let hidden = fixture.root.join("hidden-common-dir");
        std::fs::rename(project.common_dir(), &hidden).unwrap();
        let text = context
            .require_session_checkout(&project, &worktree)
            .unwrap_err();
        assert!(text.contains("cannot be resolved"), "{text}");
    }

    #[test]
    fn a_row_naming_a_path_outside_the_sessions_directory_is_refused_and_touches_nothing() {
        let fixture = Fixture::new();
        let outside = fixture.root.join("outside-checkout");
        git(
            &fixture.repo,
            &[
                "worktree",
                "add",
                "-q",
                "--detach",
                outside.to_str().unwrap(),
                "HEAD",
            ],
        );
        std::os::unix::fs::symlink(fixture.repo.join(".fgos"), outside.join(".fgos")).unwrap();
        std::fs::create_dir_all(&fixture.sessions).unwrap();
        forge_row(&fixture, "outside", outside.to_str().unwrap(), None);
        forge_row(
            &fixture,
            "outside-dead",
            outside.to_str().unwrap(),
            Some(dead_pid()),
        );
        forge_row(
            &fixture,
            "the-sessions-dir-itself",
            fixture.sessions.to_str().unwrap(),
            None,
        );
        forge_row(&fixture, "relative", "worktrees/x", None);
        forge_row(&fixture, "empty", "", None);

        for id in ["outside", "the-sessions-dir-itself", "relative", "empty"] {
            for force in [false, true] {
                let text = refusal_text(fixture.end(id, force));
                assert!(
                    text.contains("not a checkout under") || text.contains("not an absolute path"),
                    "{id}: {text}"
                );
            }
        }
        fixture.mark_dead(&["outside-dead"]);
        let answer = fixture.gc_in(&fixture.repo);
        // Only rows that name nothing on disk are dropped (there is nothing to remove for them).
        assert_eq!(answer["reclaimed"], json!(["relative", "empty"]));
        assert!(
            outside.join("seed.txt").exists(),
            "the checkout outside the sessions directory stays"
        );
        assert!(
            std::fs::symlink_metadata(outside.join(".fgos"))
                .unwrap()
                .file_type()
                .is_symlink(),
            "its .fgos link is not unlinked"
        );
        assert!(fixture.sessions.exists());
        assert_eq!(
            fixture.list().len(),
            3,
            "the rows that name a real directory stay"
        );
    }

    #[test]
    fn a_session_started_from_a_linked_worktree_begins_on_that_checkouts_own_head() {
        let fixture = Fixture::new();
        let linked = fixture.root.join("linked");
        git(
            &fixture.repo,
            &[
                "worktree",
                "add",
                "-q",
                "--detach",
                linked.to_str().unwrap(),
                "HEAD",
            ],
        );
        let ahead = commit_inside(&linked);
        assert_ne!(ahead, git(&fixture.repo, &["rev-parse", "HEAD"]));
        let started = fixture.start_in(&linked).unwrap();
        assert_eq!(started["startCommit"], ahead);
        assert_eq!(git(&worktree_of(&started), &["rev-parse", "HEAD"]), ahead);
    }

    #[test]
    fn a_corrupt_registry_fails_every_verb_closed_and_is_never_rewritten() {
        let fixture = Fixture::new();
        for text in ["{bad", "{}"] {
            std::fs::write(fixture.registry_file(), text).unwrap();
            let before = std::fs::read(fixture.registry_file()).unwrap();
            let refusals = [
                refusal_text(fixture.start()),
                refusal_text(fixture.end("x", false)),
                refusal_text(fixture.end("x", true)),
                refusal_text(fixture.context().run(&SessionRequest::List {
                    cwd: fixture.repo.clone(),
                })),
                refusal_text(fixture.context().run(&SessionRequest::Gc {
                    cwd: fixture.repo.clone(),
                })),
            ];
            for refusal in refusals {
                assert!(refusal.contains("is corrupt"), "{refusal}");
            }
            assert_eq!(std::fs::read(fixture.registry_file()).unwrap(), before);
            assert!(
                !fixture.sessions.exists(),
                "no checkout was made over unknown state"
            );
        }
    }

    #[test]
    fn gc_reclaims_a_dead_orphan_keeps_live_and_unprovable_rows_and_spares_a_diverged_one() {
        let fixture = Fixture::new();
        let live = fixture.start().unwrap();
        let orphan = fixture.start().unwrap();
        let diverged = fixture.start().unwrap();
        let dangling = commit_inside(&worktree_of(&diverged));
        let legacy = fixture.start().unwrap();
        fixture.mark_dead(&[&id_of(&orphan), &id_of(&diverged)]);
        // A row written before identities were recorded names a live pid and nothing else: kept.
        let rows: Vec<Value> = read_registry(&fixture.repo.join(".fgos"))
            .unwrap()
            .into_iter()
            .map(|mut row| {
                if row["sessionId"] == legacy["sessionId"] {
                    row.as_object_mut().unwrap().remove("record");
                }
                row
            })
            .collect();
        write_registry(&fixture.repo.join(".fgos"), &rows).unwrap();

        let answer = fixture.gc_in(&fixture.repo);
        assert_eq!(answer["reclaimed"], json!([id_of(&orphan)]));
        assert_eq!(answer["skipped"], json!([id_of(&diverged)]));
        let remaining: BTreeSet<String> = fixture.list().iter().map(id_of).collect();
        assert_eq!(
            remaining,
            BTreeSet::from([id_of(&live), id_of(&diverged), id_of(&legacy)])
        );
        assert!(!worktree_of(&orphan).exists());
        assert!(worktree_of(&diverged).exists());
        assert!(worktree_of(&live).exists());
        assert_eq!(
            git(&worktree_of(&diverged), &["rev-parse", "HEAD"]),
            dangling
        );
    }

    #[test]
    fn gc_spares_a_dead_orphan_with_uncommitted_changes() {
        let fixture = Fixture::new();
        let dirty = fixture.start().unwrap();
        std::fs::write(worktree_of(&dirty).join("wip.txt"), "not committed yet\n").unwrap();
        fixture.mark_dead(&[&id_of(&dirty)]);
        let answer = fixture.gc_in(&fixture.repo);
        assert_eq!(answer["reclaimed"], json!([]));
        assert_eq!(answer["skipped"], json!([id_of(&dirty)]));
        assert!(worktree_of(&dirty).join("wip.txt").exists());
        assert_eq!(fixture.list().len(), 1);
    }

    #[test]
    fn gc_never_reclaims_the_checkout_it_runs_from_even_with_a_dead_pid() {
        let fixture = Fixture::new();
        let own = fixture.start().unwrap();
        let other = fixture.start().unwrap();
        fixture.mark_dead(&[&id_of(&own), &id_of(&other)]);
        let from = std::fs::canonicalize(worktree_of(&own)).unwrap();
        let answer = fixture.gc_in(&from);
        assert_eq!(answer["reclaimed"], json!([id_of(&other)]));
        assert_eq!(
            answer["skipped"],
            json!([]),
            "the caller's own row is kept outright"
        );
        let remaining: Vec<String> = fixture.list().iter().map(id_of).collect();
        assert_eq!(remaining, vec![id_of(&own)]);
        assert!(worktree_of(&own).exists());
        assert!(!worktree_of(&other).exists());
    }

    #[test]
    fn every_registry_row_of_the_identity_contract_reads_and_projects_as_it_declares() {
        let contract: Value = serde_json::from_str(include_str!(
            "../../../../packages/identity/contracts/identity.writer.v1.json"
        ))
        .unwrap();
        let section = &contract["x-sessionRegistry"];
        let summary_fields: Vec<&str> = section["summaryFields"]
            .as_array()
            .unwrap()
            .iter()
            .map(|field| field.as_str().unwrap())
            .collect();
        let dir = std::env::temp_dir().join(format!("fgos-session-rows-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        for row in section["rows"].as_array().unwrap() {
            let name = row["name"].as_str().unwrap();
            let file = dir.join(REGISTRY_FILE);
            let _ = std::fs::remove_file(&file);
            if let Some(text) = row["registry"]["text"].as_str() {
                std::fs::write(&file, text).unwrap();
            }
            match &row["list"] {
                Value::Array(expected) => {
                    let rows = read_registry(&dir).unwrap();
                    assert_eq!(&rows, expected, "row {name:?} list");
                    let summaries: Vec<Value> = rows.iter().map(summary).collect();
                    if let Some(expected) = row.get("summary") {
                        assert_eq!(
                            &Value::Array(summaries.clone()),
                            expected,
                            "row {name:?} summary"
                        );
                    }
                    for summary in &summaries {
                        let keys: Vec<&str> = summary
                            .as_object()
                            .unwrap()
                            .keys()
                            .map(String::as_str)
                            .collect();
                        assert_eq!(keys, summary_fields, "row {name:?} summary fields");
                    }
                    if let Some(text) = row["registry"]["text"]
                        .as_str()
                        .filter(|_| !rows.is_empty())
                    {
                        write_registry(&dir, &rows).unwrap();
                        assert_eq!(
                            std::fs::read_to_string(&file).unwrap(),
                            text,
                            "row {name:?} is written byte for byte as the contract shows it"
                        );
                    }
                }
                refused => {
                    let cause = refused["refused"].as_str().unwrap();
                    let text = read_registry(&dir).unwrap_err().message().to_owned();
                    let expected = match cause {
                        "not-json" => "(not valid JSON)",
                        _ => "(expected a JSON array)",
                    };
                    assert!(text.contains(expected), "row {name:?}: {text}");
                }
            }
        }
        std::fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn a_session_call_reads_its_flags_with_the_shared_parser() {
        let cwd = PathBuf::from("/caller");
        let read = |tokens: &[&str]| project_session_request(&parsed(tokens), cwd.clone());
        assert_eq!(
            read(&["start"]).unwrap(),
            SessionRequest::Start {
                item: None,
                cwd: cwd.clone()
            }
        );
        assert_eq!(
            read(&["start", "--item", "tsk-abc"]).unwrap(),
            SessionRequest::Start {
                item: Some("tsk-abc".into()),
                cwd: cwd.clone()
            }
        );
        let bare_item = "session start --item requires a non-empty id value (omit --item entirely to start a session with no item bound)";
        for tokens in [&["start", "--item"][..], &["start", "--item", ""][..]] {
            assert_eq!(read(tokens).unwrap_err().message, bare_item);
        }
        assert_eq!(
            read(&["end"]).unwrap_err().message,
            "session end requires a session id: fgos session end <session-id> [--force]"
        );
        assert_eq!(
            read(&["end", "abc", "--force"]).unwrap(),
            SessionRequest::End {
                session_id: "abc".into(),
                force: true,
                cwd: cwd.clone()
            }
        );
        assert_eq!(
            read(&["end", "abc"]).unwrap(),
            SessionRequest::End {
                session_id: "abc".into(),
                force: false,
                cwd: cwd.clone()
            }
        );
        // `--force <word>` takes the word as its value, so the id is then missing, as in the Node CLI.
        assert!(read(&["end", "--force", "abc"]).is_err());
        assert_eq!(
            read(&["end", "abc", "--force", ""]).unwrap(),
            SessionRequest::End {
                session_id: "abc".into(),
                force: false,
                cwd: cwd.clone()
            }
        );
        assert_eq!(read(&["list"]).unwrap().operation_id(), LIST_OPERATION_ID);
        assert_eq!(read(&["gc"]).unwrap().operation_id(), GC_OPERATION_ID);
        assert_eq!(read(&["start"]).unwrap().operation_id(), START_OPERATION_ID);
        assert_eq!(
            read(&["end", "x"]).unwrap().operation_id(),
            END_OPERATION_ID
        );
    }

    #[test]
    fn every_session_operation_id_names_a_catalog_entry_and_a_descriptor() {
        for (id, descriptor) in [
            (START_OPERATION_ID, &START_DESCRIPTOR),
            (END_OPERATION_ID, &END_DESCRIPTOR),
            (LIST_OPERATION_ID, &LIST_DESCRIPTOR),
            (GC_OPERATION_ID, &GC_DESCRIPTOR),
        ] {
            assert_eq!(descriptor.operation_id.as_str(), id);
            assert!(fgos_host_runtime::CATALOG
                .iter()
                .any(|entry| entry.operation_id.as_str() == id));
        }
    }
}
