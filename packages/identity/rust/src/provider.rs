//! Native host provider for `fgos identity`: three operations behind one
//! verb. Bare `identity` answers the writer (`identity.writer`, read-only,
//! the hook path); `identity machine|session` read (`identity.read`);
//! `identity machine --alias` writes (`identity.write`).

use crate::errors::Error;
use crate::machine;
use crate::proc_tree::os_process_tree;
use crate::resolve::{resolve, WriterIdentity};
use crate::session::{self, PidFacts};
use fgos_host_runtime::{
    ContractRef, EventSink, HostInvocation, InvocationControl, JsonOutcome, OperationId,
    OperationProvider, OperationRequest, ProviderDescriptor, ProviderError, ProviderLifecycle,
    ProviderOutcome,
};
use serde::Serialize;
use std::borrow::Cow;
use std::future::Future;
use std::path::{Path, PathBuf};
use std::pin::Pin;

pub const IDENTITY_OPERATION_ID: &str = "identity.writer";
pub const IDENTITY_READ_OPERATION_ID: &str = "identity.read";
pub const IDENTITY_WRITE_OPERATION_ID: &str = "identity.write";

/// Subcommands after `identity`; bare `identity` is `writer`.
pub const AVAILABLE_SUBCOMMANDS: &[&str] = &["writer", "machine", "session"];

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
    /// `session`: this session's full id and handle.
    Session,
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
            Verb::Machine { alias: None } | Verb::Session => IDENTITY_READ_OPERATION_ID,
            Verb::Machine { alias: Some(_) } => IDENTITY_WRITE_OPERATION_ID,
        }
    }
}

/// The answer is a refusal, not a result: the CLI prints `detail` and exits
/// with [`Refusal::EXIT`].
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Refusal {
    pub reason: &'static str,
    pub detail: String,
}

impl Refusal {
    pub const EXIT: i32 = 65;
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

/// Resolves for the request against the real env and OS process tree.
fn resolve_identity(request: &IdentityRequest) -> WriterIdentity {
    let tree = os_process_tree();
    resolve(
        &|key| std::env::var(key).ok(),
        tree.as_ref(),
        request.pid.unwrap_or_else(default_caller_pid),
        request.fgos_dir.as_deref(),
    )
}

/// This machine as `identity machine` prints it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct MachineInfo {
    pub id: String,
    pub handle: String,
    pub alias: Option<String>,
}

/// The alias only counts when it follows the Convention `machine-handle` rule;
/// a hand-edited alias that does not is ignored and the derived handle shows.
fn checked_alias(state_root: &Path) -> Option<String> {
    let alias = machine::read_alias(state_root).ok().flatten()?;
    alias_problem(&alias).is_none().then_some(alias)
}

fn alias_problem(alias: &str) -> Option<&'static str> {
    let rule = fgos_convention::rules::packaged_rules().identifier("machine-handle");
    rule.expect("the Convention contract carries the machine-handle kind")
        .check(alias)
        .err()
}

pub fn machine_info(state_root: &Path) -> Result<MachineInfo, Refusal> {
    let id = machine::read(state_root).map_err(|e| match e {
        Error::Missing(_) => Refusal {
            reason: "machine-id-missing",
            detail: "no machine id yet; run `fgos doctor --fix` to mint it".into(),
        },
        e => Refusal {
            reason: "machine-id-unreadable",
            detail: e.to_string(),
        },
    })?;
    let alias = checked_alias(state_root);
    Ok(MachineInfo {
        handle: machine::handle(&id, alias.as_deref()),
        id,
        alias,
    })
}

/// `identity machine --alias <name>`: the alias changes the handle only.
pub fn set_alias(state_root: &Path, alias: &str) -> Result<MachineInfo, Refusal> {
    if let Some(code) = alias_problem(alias) {
        return Err(Refusal {
            reason: "invalid-alias",
            detail: format!("alias {alias:?} is not a machine handle ({code})"),
        });
    }
    let info = machine_info(state_root)?;
    machine::write_alias(state_root, alias).map_err(|e| Refusal {
        reason: "alias-write-failed",
        detail: e.to_string(),
    })?;
    Ok(MachineInfo {
        handle: alias.to_owned(),
        alias: Some(alias.to_owned()),
        ..info
    })
}

/// A session as `identity session` prints it, and as bare `identity` embeds it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct SessionInfo {
    pub id: String,
    pub handle: String,
}

fn os_pid_facts(pid: u32) -> Option<PidFacts> {
    let tuple = fgos_process::facts::identity_of(fgos_process::ProcId(pid))?;
    Some(PidFacts {
        boot_id: tuple.boot_id,
        start_time: tuple.start_time,
    })
}

/// The session of a resolved writer on this machine; `None` when the caller
/// cannot be told from any other.
pub fn session_info(
    identity: &WriterIdentity,
    machine: &MachineInfo,
    facts: &dyn Fn(u32) -> Option<PidFacts>,
) -> Option<SessionInfo> {
    let local = session::local(identity, facts)?;
    Some(SessionInfo {
        id: session::full_id(&machine.id, &local),
        handle: session::handle(&local, &machine.handle),
    })
}

fn state_root() -> PathBuf {
    fgos_holder_lock::state_root::state_root().0
}

#[derive(Debug, Clone)]
pub struct IdentityProvider {
    descriptor: ProviderDescriptor,
}

impl IdentityProvider {
    /// The provider of the bare writer operation.
    pub fn new() -> Self {
        Self::for_descriptor(IDENTITY_DESCRIPTOR)
    }

    /// The provider of one of this component's three descriptors.
    pub fn for_descriptor(descriptor: ProviderDescriptor) -> Self {
        Self { descriptor }
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

fn answer(request: &IdentityRequest) -> Result<serde_json::Value, Refusal> {
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
            Ok(serde_json::to_value(info).expect("MachineInfo always serializes"))
        }
        Verb::Session => {
            let machine = machine_info(&root)?;
            let identity = resolve_identity(request);
            let session = session_info(&identity, &machine, &os_pid_facts).ok_or_else(|| Refusal {
                reason: "unresolved",
                detail: "this session cannot be told from any other: no session id in the environment and no process holding a terminal".into(),
            })?;
            Ok(serde_json::to_value(session).expect("SessionInfo always serializes"))
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
            let output: Box<dyn std::any::Any + Send> = match answer(request) {
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
