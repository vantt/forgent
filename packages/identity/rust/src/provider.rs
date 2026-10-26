//! Native host provider for `fgos identity`: three operations behind one
//! verb. Bare `identity` answers the writer (`identity.writer`, read-only,
//! the hook path); `identity machine|session|project|resolve|list` read
//! (`identity.read`); `identity machine --alias`, `identity project
//! --init|--new`, `identity session --register|--drop-role`, `identity list --prune` and
//! `identity pins --forget <machine-id>`, `identity pins --confirm <machine-id> --fingerprint <fp>` and `identity mint <kind>` write (`identity.write`).

use crate::current::{current_session, machine_info, os_pid_facts, session_info, set_alias};
pub use crate::current::{MachineInfo, SessionInfo};
use crate::directory;
use crate::mint;
use crate::proc_tree::os_process_tree;
use crate::pins;
use crate::project;
pub use crate::refusal::Refusal;
use crate::resolve::{resolve, WriterIdentity};
use crate::session::PidFacts;
use crate::shared::{self, LogDoor, SharedView};
use crate::signing;
use fgos_process::facts::judge_here;
use fgos_host_runtime::{
    ContractRef, EventSink, HostInvocation, InvocationControl, JsonOutcome, OperationId,
    OperationProvider, OperationRequest, ProviderDescriptor, ProviderError, ProviderLifecycle,
    ProviderOutcome,
};
use std::borrow::Cow;
use std::future::Future;
use std::path::{Path, PathBuf};
use std::pin::Pin;
use std::sync::Arc;

pub const IDENTITY_OPERATION_ID: &str = "identity.writer";
pub const IDENTITY_READ_OPERATION_ID: &str = "identity.read";
pub const IDENTITY_WRITE_OPERATION_ID: &str = "identity.write";

/// Subcommands after `identity`; bare `identity` is `writer`.
pub const AVAILABLE_SUBCOMMANDS: &[&str] = &["writer", "machine", "session", "project", "resolve", "list", "mint", "pins"];

pub const IDENTITY_DESCRIPTOR: ProviderDescriptor = ProviderDescriptor {
    provider_id: Cow::Borrowed("identity.writer"),
    operation_id: OperationId::from_static("identity.writer"),
    component_class: Cow::Borrowed("identity"),
    mechanism: Cow::Borrowed("builtin"),
    lifecycle: ProviderLifecycle::Singleton,
    request_contract: ContractRef::from_static("identity.writer.request", "1.0.0"),
    outcome_contract: ContractRef::from_static("identity.writer.outcome", "1.1.0"),
    allowed_hosts: &["cli"],
    allowed_modes: &["sync"],
    capabilities: &[],
    replacement: None,
    concurrency: None,
    health: None,
};

pub const IDENTITY_READ_DESCRIPTOR: ProviderDescriptor = ProviderDescriptor {
    provider_id: Cow::Borrowed("identity.read"),
    operation_id: OperationId::from_static("identity.read"),
    component_class: Cow::Borrowed("identity"),
    mechanism: Cow::Borrowed("builtin"),
    lifecycle: ProviderLifecycle::Singleton,
    request_contract: ContractRef::from_static("identity.read.request", "1.0.0"),
    outcome_contract: ContractRef::from_static("identity.read.outcome", "1.0.0"),
    allowed_hosts: &["cli"],
    allowed_modes: &["sync"],
    capabilities: &[],
    replacement: None,
    concurrency: None,
    health: None,
};

pub const IDENTITY_WRITE_DESCRIPTOR: ProviderDescriptor = ProviderDescriptor {
    provider_id: Cow::Borrowed("identity.write"),
    operation_id: OperationId::from_static("identity.write"),
    component_class: Cow::Borrowed("identity"),
    mechanism: Cow::Borrowed("builtin"),
    lifecycle: ProviderLifecycle::Singleton,
    request_contract: ContractRef::from_static("identity.write.request", "1.0.0"),
    outcome_contract: ContractRef::from_static("identity.write.outcome", "1.0.0"),
    allowed_hosts: &["cli"],
    allowed_modes: &["sync"],
    capabilities: &[],
    replacement: None,
    concurrency: None,
    health: None,
};

/// What the caller asked `fgos identity` for.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub enum Verb {
    /// Bare: who is the writer, as `{id, source}`.
    #[default]
    Writer,
    /// `machine [--alias <name>]`.
    Machine { alias: Option<String> },
    /// `session [--register [--role lead:<LANE> [--take]] | --drop-role lead:<LANE>]`: this session's
    /// full id and handle, and its entry in the local directory.
    Session(SessionAction),
    /// `resolve <handle|lead:<LANE>|full id>`: the one live session it names.
    Resolve { query: String },
    /// `list [--project] [--prune] [--machine <handle|id>]`: the sessions the machine knows.
    List { project: bool, prune: bool, machine: Option<String> },
    /// `project [--init|--new] [--handle <h>]`.
    Project(ProjectAction),
    /// `mint <kind> [--release <number>]`: a new id, or a sequence number given back.
    Mint { kind: String, release: Option<u64> },
    /// `pins [--forget <machine-id> | --confirm <machine-id> --fingerprint <fp>]`.
    Pins(PinsAction),
}

/// What `identity pins` does.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub enum PinsAction {
    /// List the pinned machine keys.
    #[default]
    List,
    /// `--forget`: remove one pin after a legitimate re-key.
    Forget { machine_id: String },
    /// `--confirm --fingerprint`: the owner compared the fingerprint; mark the pin confirmed.
    Confirm { machine_id: String, fingerprint: String },
}

/// What `identity session` does.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub enum SessionAction {
    /// Print this session's id and handle; writes nothing.
    #[default]
    Read,
    /// `--register`, or `--role`, which implies it: put this session in the
    /// local directory. `take` moves a role from its live holder.
    Register { role: Option<String>, take: bool },
    /// `--drop-role lead:<LANE>`: remove that role from this session only.
    DropRole { role: String },
}

/// What `identity project` does.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub enum ProjectAction {
    /// Read the project id of this repository.
    #[default]
    Read,
    /// `--init`: mint it once; refused when it exists or the remote has one.
    Init { handle: Option<String> },
    /// `--new`: mint it again on purpose (a fork split).
    New { handle: Option<String> },
}

/// `pid`: the process asking. When absent, the process that started this
/// one (unix) or this process itself (elsewhere). `fgos_dir`: whose
/// registry may confirm an env id; absent skips that confirmation.
#[derive(Debug, Clone, Default)]
pub struct IdentityRequest {
    pub pid: Option<u32>,
    pub fgos_dir: Option<PathBuf>,
    pub verb: Verb,
}

impl IdentityRequest {
    /// The operation (and so the authority policy) this request runs under.
    pub fn operation_id(&self) -> &'static str {
        match &self.verb {
            Verb::Writer => IDENTITY_OPERATION_ID,
            Verb::Machine { alias: None }
            | Verb::Session(SessionAction::Read)
            | Verb::Project(ProjectAction::Read)
            | Verb::Resolve { .. }
            | Verb::Pins(PinsAction::List)
            | Verb::List { prune: false, .. } => IDENTITY_READ_OPERATION_ID,
            Verb::Machine { alias: Some(_) }
            | Verb::Session(SessionAction::Register { .. } | SessionAction::DropRole { .. })
            | Verb::Project(_)
            | Verb::List { prune: true, .. }
            | Verb::Pins(PinsAction::Forget { .. } | PinsAction::Confirm { .. })
            | Verb::Mint { .. } => IDENTITY_WRITE_OPERATION_ID,
        }
    }
}

fn default_caller_pid() -> u32 {
    #[cfg(unix)]
    {
        // SAFETY: getppid has no preconditions.
        unsafe { libc::getppid() as u32 }
    }
    #[cfg(not(unix))]
    {
        std::process::id()
    }
}

fn caller_pid(request: &IdentityRequest) -> u32 {
    request.pid.unwrap_or_else(default_caller_pid)
}

/// Resolves for the request against the real env and OS process tree.
fn resolve_identity(request: &IdentityRequest) -> WriterIdentity {
    let tree = os_process_tree();
    resolve(
        &|key| std::env::var(key).ok(),
        tree.as_ref(),
        caller_pid(request),
        request.fgos_dir.as_deref(),
    )
}

fn state_root() -> PathBuf {
    fgos_holder_lock::state_root::state_root().0
}

#[derive(Debug, Clone)]
pub struct IdentityProvider {
    descriptor: ProviderDescriptor,
    /// The door to the clone's shared log; without it the directory stays local.
    log_door: Option<Arc<dyn LogDoor>>,
}

impl IdentityProvider {
    /// The provider of the bare writer operation.
    pub fn new() -> Self {
        Self::for_descriptor(IDENTITY_DESCRIPTOR)
    }

    /// The provider of one of this component's three descriptors.
    pub fn for_descriptor(descriptor: ProviderDescriptor) -> Self {
        Self { descriptor, log_door: None }
    }

    /// The same provider publishing to and reading from the shared directory through `door`.
    pub fn with_log_door(mut self, door: Arc<dyn LogDoor>) -> Self {
        self.log_door = Some(door);
        self
    }
}

impl Default for IdentityProvider {
    fn default() -> Self {
        Self::new()
    }
}

/// Bare `identity`: `{id, source}` plus this machine and session. Never
/// fails and never writes: a missing machine id (or a caller that cannot be
/// told from any other) shows as `null`.
pub fn writer_answer(
    identity: &WriterIdentity,
    state_root: &Path,
    facts: &dyn Fn(u32) -> Option<PidFacts>,
) -> serde_json::Value {
    let machine = machine_info(state_root).ok();
    let session = machine
        .as_ref()
        .and_then(|machine| session_info(identity, machine, facts));
    let mut value = serde_json::to_value(identity).expect("WriterIdentity always serializes");
    let object = value.as_object_mut().expect("WriterIdentity is an object");
    object.insert(
        "machine".into(),
        machine.map_or(serde_json::Value::Null, |m| {
            serde_json::json!({ "id": m.id, "handle": m.handle })
        }),
    );
    object.insert(
        "session".into(),
        serde_json::to_value(session).expect("SessionInfo always serializes"),
    );
    value
}

/// `identity mint <kind>`: a random id needs nothing but the kernel; a
/// sequence number is claimed (or, with `release`, given back) on the
/// repository containing the working directory.
fn mint_answer(state_root: &Path, kind: &str, release: Option<u64>) -> Result<serde_json::Value, Refusal> {
    let parsed = mint::Kind::parse(kind).ok_or_else(|| Refusal {
        candidates: Vec::new(),
        reason: "unknown-kind",
        detail: format!("unknown id kind {kind:?}. Available: {}", mint::KIND_NAMES.join(", ")),
    })?;
    match (parsed, release) {
        (mint::Kind::Random(random), None) => {
            let id = mint::random(random).map_err(|e| Refusal {
                candidates: Vec::new(),
                reason: "random-unavailable",
                detail: e.to_string(),
            })?;
            Ok(serde_json::json!({ "kind": kind, "id": id }))
        }
        (mint::Kind::Random(_), Some(_)) => Err(Refusal {
            candidates: Vec::new(),
            reason: "not-a-sequence",
            detail: format!("{kind} ids are random; only a sequence kind has a number to give back"),
        }),
        (mint::Kind::Sequence(sequence), release) => {
            let dir = std::env::current_dir().map_err(|e| Refusal {
                candidates: Vec::new(),
                reason: "no-working-directory",
                detail: e.to_string(),
            })?;
            match release {
                None => {
                    let claim = mint::claim_sequence(state_root, &dir, sequence)?;
                    Ok(serde_json::json!({ "kind": kind, "id": claim.id, "number": claim.number }))
                }
                Some(number) => {
                    let released = mint::release_sequence(state_root, &dir, sequence, number)?;
                    Ok(serde_json::json!({ "kind": kind, "number": number, "released": released }))
                }
            }
        }
    }
}

fn working_directory() -> Result<PathBuf, Refusal> {
    std::env::current_dir().map_err(|e| Refusal {
        candidates: Vec::new(),
        reason: "no-working-directory",
        detail: e.to_string(),
    })
}

/// Publishes what a write changed in the shared directory of the clone the
/// verb runs in. The local write already happened and is this machine's
/// truth, so a fault here is one stderr line, never a failed verb. A clone
/// without a project id or a migrated Event Store publishes nothing.
fn publish(request: &IdentityRequest, door: Option<&dyn LogDoor>, root: &Path, own: Option<&directory::Listed>) {
    let Some(door) = door else { return };
    let attempt = || -> Result<(), Refusal> {
        let cwd = working_directory()?;
        let Ok((_, main_root)) = project::project_at(root, &cwd) else { return Ok(()) };
        if own.is_some_and(|listed| listed.project_id.is_none()) {
            return Ok(());
        }
        let Some(log) = door.open(&cwd, &resolve_identity(request).id.to_string())? else {
            return Ok(());
        };
        let machine = machine_info(root)?;
        let live = directory::list(root, None, false, &judge_here, None)?.sessions;
        if shared::publish_changes(root, log.as_ref(), &machine, own, &live)? > 0 {
            refresh(root, &main_root, log.as_ref())?;
        }
        Ok(())
    };
    if let Err(refusal) = attempt() {
        eprintln!("identity-publish-failed: {}: {}", refusal.reason, refusal.detail);
    }
}

/// Reads the clone's log, folds it with what the cache already verified, and
/// keeps the result in the cache. The unfiltered view: other projects' entries
/// stay in the cache for the doctor to name.
fn refresh(root: &Path, main_root: &Path, log: &dyn shared::EntryLog) -> Result<SharedView, Refusal> {
    let (events, fetched_at) = log.read()?;
    let path = shared::cache_path(main_root);
    let view = shared::fold(root, &events, fetched_at, shared::read_cache(&path).as_ref());
    if let Err(refusal) = shared::write_cache(&path, &view.cache()) {
        eprintln!("identity-cache-failed: {}: {}", refusal.reason, refusal.detail);
    }
    Ok(view)
}

/// The other machines' sessions of the clone's project, folded from its log;
/// `None` when there is nothing to ask (no door, no project id, no migrated
/// store) or the log cannot be read (one stderr line says why).
fn remote_view(request: &IdentityRequest, door: Option<&dyn LogDoor>, root: &Path) -> Option<SharedView> {
    let door = door?;
    let attempt = || -> Result<Option<SharedView>, Refusal> {
        let cwd = working_directory()?;
        let Ok((project, main_root)) = project::project_at(root, &cwd) else { return Ok(None) };
        let Some(log) = door.open(&cwd, &resolve_identity(request).id.to_string())? else {
            return Ok(None);
        };
        let mut view = refresh(root, &main_root, log.as_ref())?;
        view.retain_project(&project.id);
        Ok(Some(view))
    };
    attempt().unwrap_or_else(|refusal| {
        eprintln!("identity-shared-unavailable: {}: {}", refusal.reason, refusal.detail);
        None
    })
}

fn answer(request: &IdentityRequest, door: Option<&dyn LogDoor>) -> Result<serde_json::Value, Refusal> {
    let root = state_root();
    match &request.verb {
        Verb::Writer => Ok(writer_answer(
            &resolve_identity(request),
            &root,
            &os_pid_facts,
        )),
        Verb::Machine { alias } => {
            let info = match alias {
                Some(alias) => set_alias(&root, alias)?,
                None => machine_info(&root)?,
            };
            // The key fingerprint is read-only context; a key that cannot be read shows as null
            // and the `identity-machine-key` and `identity-ssh-keygen` doctor rows say why.
            let key_fingerprint = signing::key_fingerprint(&root).ok().flatten();
            let mut value = serde_json::to_value(info).expect("MachineInfo always serializes");
            value
                .as_object_mut()
                .expect("MachineInfo is an object")
                .insert("keyFingerprint".into(), serde_json::json!(key_fingerprint));
            Ok(value)
        }
        Verb::Pins(PinsAction::List) => Ok(serde_json::json!({ "pins": pins::list(&root)? })),
        Verb::Pins(PinsAction::Forget { machine_id }) => {
            Ok(serde_json::json!({ "forgotten": pins::forget(&root, machine_id)? }))
        }
        Verb::Pins(PinsAction::Confirm { machine_id, fingerprint }) => {
            Ok(serde_json::json!({ "confirmed": pins::confirm(&root, machine_id, fingerprint)? }))
        }
        Verb::Project(action) => {
            let dir = std::env::current_dir().map_err(|e| Refusal {
                candidates: Vec::new(),
                reason: "no-working-directory",
                detail: e.to_string(),
            })?;
            let value = match action {
                ProjectAction::Read => serde_json::to_value(project::project_info(&root, &dir)?),
                ProjectAction::Init { handle } => {
                    serde_json::to_value(project::project_init(&root, &dir, handle.as_deref(), false)?)
                }
                ProjectAction::New { handle } => {
                    serde_json::to_value(project::project_init(&root, &dir, handle.as_deref(), true)?)
                }
            };
            Ok(value.expect("project answers always serialize"))
        }
        Verb::Mint { kind, release } => mint_answer(&root, kind, *release),
        Verb::Session(action) => match action {
            SessionAction::Read => {
                let current = current_session(&root, caller_pid(request), request.fgos_dir.as_deref())?;
                Ok(serde_json::to_value(current.info).expect("SessionInfo always serializes"))
            }
            SessionAction::DropRole { role } => {
                let listed =
                    directory::drop_current_role(&root, caller_pid(request), request.fgos_dir.as_deref(), role)?;
                publish(request, door, &root, Some(&listed));
                Ok(serde_json::to_value(listed).expect("Listed always serializes"))
            }
            SessionAction::Register { role, take } => {
                let cwd = std::env::current_dir().ok();
                let listed = directory::register_current(
                    &root,
                    caller_pid(request),
                    request.fgos_dir.as_deref(),
                    cwd.as_deref(),
                    &role.iter().cloned().collect::<Vec<_>>(),
                    *take,
                )?;
                publish(request, door, &root, Some(&listed));
                Ok(serde_json::to_value(listed).expect("Listed always serializes"))
            }
        },
        Verb::Resolve { query } => {
            let listed = match directory::resolve(&root, query, &judge_here, None) {
                // Local first: other machines are asked only when this one has no answer.
                Err(missing) if missing.reason == "not-found" => match remote_view(request, door, &root) {
                    Some(view) => directory::resolve(&root, query, &judge_here, Some(&view))?,
                    None => return Err(missing),
                },
                other => other?,
            };
            Ok(serde_json::to_value(listed).expect("Listed always serializes"))
        }
        Verb::List { project, prune, machine } => {
            let project_id = if *project {
                let dir = std::env::current_dir().map_err(|e| Refusal {
                    candidates: Vec::new(),
                    reason: "no-working-directory",
                    detail: e.to_string(),
                })?;
                Some(project::project_info(&root, &dir)?.id)
            } else {
                None
            };
            let view = remote_view(request, door, &root);
            let sessions = directory::list(&root, project_id.as_deref(), *prune, &judge_here, view.as_ref())?;
            if *prune {
                publish(request, door, &root, None);
            }
            let mut sessions = sessions;
            if let Some(wanted) = machine {
                let own = machine_info(&root)?;
                sessions.sessions.retain(|session| match &session.remote {
                    Some(remote) => remote.machine.id == *wanted || remote.machine.handle == *wanted,
                    None => own.id == *wanted || own.handle == *wanted,
                });
            }
            Ok(serde_json::to_value(sessions).expect("Sessions always serializes"))
        }
    }
}

impl OperationProvider for IdentityProvider {
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
                .downcast_ref::<IdentityRequest>()
                .ok_or_else(|| {
                    ProviderError::SemanticValidation("input is not IdentityRequest".into())
                })?;
            let output: Box<dyn std::any::Any + Send> = match answer(request, self.log_door.as_deref()) {
                Ok(value) => Box::new(JsonOutcome(value)),
                Err(refusal) => Box::new(refusal),
            };
            Ok(ProviderOutcome::completed(
                self.descriptor().outcome_contract.clone(),
                output,
            ))
        })
    }
}
