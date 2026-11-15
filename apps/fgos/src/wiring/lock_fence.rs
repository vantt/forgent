//! `fgos lock fence <name> [--param k=v]... [--yes] [--attest-stopped]`: stop the process that holds a registry
//! lock (`holder-lock.fence`), thin wiring over `fgos_holder_lock::fence`.
//!
//! Nothing is signalled unless `--yes` is given: without it the verb lists the holders on stderr and refuses
//! with the `precondition` category, on a terminal too, so a person reruns the call with `--yes`. A refusal of
//! the fence is the verb's own answer, printed `fgos: lock fence: holder-lock (<code>): <message>`.

use crate::cli_projector::ProjectError;
use fgos_holder_lock::fence::{self, FenceError, FenceRequest};
use fgos_host_runtime::cli_args::{parse_args, FlagScalar, FlagValue, ParsedArgs};
use fgos_host_runtime::{
    CategorisedRefusal, ContractRef, EventSink, HostInvocation, InvocationControl, OperationId,
    OperationProvider, OperationRequest, ProviderDescriptor, ProviderError, ProviderLifecycle,
    ProviderOutcome,
};
use std::borrow::Cow;
use std::ffi::OsString;
use std::future::Future;
use std::path::PathBuf;
use std::pin::Pin;

/// The sub-verbs of `fgos lock`.
pub const AVAILABLE_SUBCOMMANDS: &[&str] = &["fence"];

pub const OPERATION_ID: &str = "holder-lock.fence";

pub const DESCRIPTOR: ProviderDescriptor = ProviderDescriptor {
    provider_id: Cow::Borrowed(OPERATION_ID),
    operation_id: OperationId::from_static(OPERATION_ID),
    component_class: Cow::Borrowed("holder-lock"),
    mechanism: Cow::Borrowed("builtin"),
    lifecycle: ProviderLifecycle::Singleton,
    request_contract: ContractRef::from_static("holder-lock.fence.request", "1.0.0"),
    outcome_contract: ContractRef::from_static("holder-lock.fence.outcome", "1.0.0"),
    allowed_hosts: &["cli"],
    allowed_modes: &["sync"],
    capabilities: &[],
    replacement: None,
    concurrency: None,
    health: None,
};

/// One `fence` call as the shared parser read it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FenceCall {
    pub name: String,
    /// Every `--param` use, as given.
    pub params: Vec<String>,
    pub confirmed: bool,
    pub attest_stopped: bool,
    pub fgos_dir: PathBuf,
}

/// What a flag value says when a flag is tested for presence: bare is yes, a value is yes unless it is empty.
fn truthy(value: Option<&FlagValue>) -> bool {
    match value {
        None => false,
        Some(FlagValue::One(FlagScalar::Bool)) | Some(FlagValue::Many(_)) => true,
        Some(FlagValue::One(FlagScalar::Str(text))) => !text.is_empty(),
    }
}

fn param_texts(parsed: &ParsedArgs) -> Vec<String> {
    let scalar = |scalar: &FlagScalar| match scalar {
        FlagScalar::Bool => "true".to_owned(),
        FlagScalar::Str(text) => text.clone(),
    };
    match parsed.flag("param") {
        None => Vec::new(),
        Some(FlagValue::One(one)) => vec![scalar(one)],
        Some(FlagValue::Many(all)) => all.iter().map(scalar).collect(),
    }
}

/// `args[0]` is the verb, `args[1]` the sub-command `fence`; `root` is the project the doors resolved.
pub fn project_fence_request(
    args: &[OsString],
    root: Result<PathBuf, String>,
) -> Result<FenceCall, ProjectError> {
    let parsed = parse_args(args.get(1..).unwrap_or_default()).map_err(|err| {
        ProjectError::Refused(CategorisedRefusal::new("validation", err.to_string()))
    })?;
    let Some(name) = parsed.positional.get(1) else {
        return Err(ProjectError::Refused(CategorisedRefusal::new(
            "validation",
            "lock fence requires a lock name: fgos lock fence <name> (names: fgos lock-status)",
        )));
    };
    Ok(FenceCall {
        name: name.clone(),
        params: param_texts(&parsed),
        confirmed: truthy(parsed.flag("yes")),
        attest_stopped: truthy(parsed.flag("attest-stopped")),
        fgos_dir: root.map_err(ProjectError::Failed)?.join(".fgos"),
    })
}

/// A fence's refusal as the verb prints it (the host adds the first `fgos: `): the holders it would not signal,
/// when it found any, then the named refusal.
fn refusal_text(err: &FenceError) -> String {
    match err {
        FenceError::Named {
            listing: Some(listing),
            ..
        } => format!("{listing}fgos: lock fence: {err}"),
        _ => format!("lock fence: {err}"),
    }
}

fn run(call: &FenceCall) -> Result<serde_json::Value, FenceError> {
    let params = fence::parse_params(&call.params)?;
    fence::fence(&FenceRequest {
        name: call.name.clone(),
        fgos_dir: call.fgos_dir.clone(),
        params,
        confirmed: call.confirmed,
        attest_stopped: call.attest_stopped,
    })
    .map(|result| result.to_json())
}

pub struct LockFenceProvider {
    descriptor: ProviderDescriptor,
}

impl LockFenceProvider {
    pub fn new() -> Self {
        Self {
            descriptor: DESCRIPTOR,
        }
    }
}

impl Default for LockFenceProvider {
    fn default() -> Self {
        Self::new()
    }
}

impl OperationProvider for LockFenceProvider {
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
            events.record_event(&format!("{OPERATION_ID}.invoked"));
            let call = request.input.downcast_ref::<FenceCall>().ok_or_else(|| {
                ProviderError::SemanticValidation("input is not FenceCall".into())
            })?;
            let output: Box<dyn std::any::Any + Send> = match run(call) {
                Ok(data) => Box::new(data),
                Err(err @ FenceError::Named { .. }) => {
                    Box::new(CategorisedRefusal::new("precondition", refusal_text(&err)))
                }
                Err(FenceError::Failed(message)) => {
                    return Err(ProviderError::ProviderFailed(message))
                }
            };
            Ok(ProviderOutcome::completed(
                self.descriptor.outcome_contract.clone(),
                output,
            ))
        })
    }
}
