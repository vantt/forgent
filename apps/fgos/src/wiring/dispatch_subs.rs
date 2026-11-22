//! The `fgos dispatch` sub-commands beside `decide` and `explain`: the Run reads (`show-run`, `watch`), the runtime
//! inspection (`inspect`), the guard repair and provider-capacity door (`reconcile`), the standalone recovery door
//! (`recover`) and the two diagnostics (`probe-account`, `probe-session`), as native operations. Every judgement is
//! the engine's (the run-result reader, the visibility session, the inspection, the attention view, the recovery
//! and reconciliation planners, the provider-capacity state, the account and session probes) or the run
//! supervisor's (the adopt door); this module reads the call, gathers what the judgement reads off the disk, and
//! shapes the answer the Node CLI gave, field for field.

mod inspect;
mod observe;
mod probes;
mod reconcile;
mod recover;
#[cfg(test)]
mod tests;

use crate::routing::Call;
use fgos_host_runtime::cli_args::{FlagScalar, FlagValue};
use fgos_host_runtime::{
    CategorisedRefusal, ContractRef, EventSink, HostInvocation, InvocationControl, JsonOutcome,
    OperationId, OperationProvider, OperationRequest, ProviderDescriptor, ProviderError,
    ProviderLifecycle, ProviderOutcome, VerbAnswer,
};
use serde_json::Value;
use std::borrow::Cow;
use std::ffi::OsString;
use std::future::Future;
use std::path::{Path, PathBuf};
use std::pin::Pin;

pub const SHOW_RUN_OPERATION_ID: &str = "dispatch.run.show";
pub const WATCH_OPERATION_ID: &str = "dispatch.run.watch";
pub const RECOVER_OPERATION_ID: &str = "dispatch.run.recover";
pub const INSPECT_OPERATION_ID: &str = "dispatch.runtime.inspect";
pub const RECONCILE_OPERATION_ID: &str = "dispatch.runtime.reconcile";
pub const PROBE_ACCOUNT_OPERATION_ID: &str = "dispatch.probe.account";
pub const PROBE_SESSION_OPERATION_ID: &str = "dispatch.probe.session";

/// Every sub-command of `fgos dispatch` the host serves (`decide` and `explain` are `wiring::dispatch_decide`'s).
pub const AVAILABLE_SUBCOMMANDS: &[&str] = &[
    "decide",
    "explain",
    "show-run",
    "inspect",
    "watch",
    "recover",
    "reconcile",
    "probe-account",
    "probe-session",
];

const fn descriptor(
    operation: &'static str,
    request: &'static str,
    outcome: &'static str,
) -> ProviderDescriptor {
    ProviderDescriptor {
        provider_id: Cow::Borrowed(operation),
        operation_id: OperationId::from_static(operation),
        component_class: Cow::Borrowed("execution"),
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

pub const SHOW_RUN_DESCRIPTOR: ProviderDescriptor = descriptor(
    SHOW_RUN_OPERATION_ID,
    "dispatch.run.show.request",
    "dispatch.run.show.outcome",
);
pub const WATCH_DESCRIPTOR: ProviderDescriptor = descriptor(
    WATCH_OPERATION_ID,
    "dispatch.run.watch.request",
    "dispatch.run.watch.outcome",
);
pub const RECOVER_DESCRIPTOR: ProviderDescriptor = descriptor(
    RECOVER_OPERATION_ID,
    "dispatch.run.recover.request",
    "dispatch.run.recover.outcome",
);
pub const INSPECT_DESCRIPTOR: ProviderDescriptor = descriptor(
    INSPECT_OPERATION_ID,
    "dispatch.runtime.inspect.request",
    "dispatch.runtime.inspect.outcome",
);
pub const RECONCILE_DESCRIPTOR: ProviderDescriptor = descriptor(
    RECONCILE_OPERATION_ID,
    "dispatch.runtime.reconcile.request",
    "dispatch.runtime.reconcile.outcome",
);
pub const PROBE_ACCOUNT_DESCRIPTOR: ProviderDescriptor = descriptor(
    PROBE_ACCOUNT_OPERATION_ID,
    "dispatch.probe.account.request",
    "dispatch.probe.account.outcome",
);
pub const PROBE_SESSION_DESCRIPTOR: ProviderDescriptor = descriptor(
    PROBE_SESSION_OPERATION_ID,
    "dispatch.probe.session.request",
    "dispatch.probe.session.outcome",
);

/// Every descriptor this module serves.
pub const DESCRIPTORS: [ProviderDescriptor; 7] = [
    SHOW_RUN_DESCRIPTOR,
    WATCH_DESCRIPTOR,
    RECOVER_DESCRIPTOR,
    INSPECT_DESCRIPTOR,
    RECONCILE_DESCRIPTOR,
    PROBE_ACCOUNT_DESCRIPTOR,
    PROBE_SESSION_DESCRIPTOR,
];

/// The operation a `dispatch <sub>` call of this module runs, or `None` for a sub-command it does not serve.
pub fn operation_of_sub(sub: &str) -> Option<&'static str> {
    Some(match sub {
        "show-run" => SHOW_RUN_OPERATION_ID,
        "watch" => WATCH_OPERATION_ID,
        "recover" => RECOVER_OPERATION_ID,
        "inspect" => INSPECT_OPERATION_ID,
        "reconcile" => RECONCILE_OPERATION_ID,
        "probe-account" => PROBE_ACCOUNT_OPERATION_ID,
        "probe-session" => PROBE_SESSION_OPERATION_ID,
        _ => return None,
    })
}

// ---- the request --------------------------------------------------------------------------------------------

/// One `fgos dispatch <sub>` call of this module, as the projector read it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SubRequest {
    /// The arguments after the binary name (`args[0]` is the verb).
    pub args: Vec<OsString>,
    /// The directory the process runs in.
    pub process_cwd: PathBuf,
    /// The project root the call acts on: the root `--dir` resolved to, else the process's own directory (the
    /// Node CLI's `path.dirname(fgosDir)` with `--dir`, `process.cwd()` without).
    pub root: PathBuf,
    /// Whether the call asked for `--json` (the text form of `inspect --attention` depends on it).
    pub json: bool,
}

/// Reads a call of `dispatch <sub>`. `project` is the root the invocation doors resolved, used only when the call
/// names `--dir`.
pub fn project_sub_request(
    args: &[OsString],
    project: Result<PathBuf, String>,
) -> Result<SubRequest, CategorisedRefusal> {
    let call = Call::new(args);
    let process_cwd = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let root = match call.named_dir() {
        Some(_) => project.map_err(|message| CategorisedRefusal::new("validation", message))?,
        None => process_cwd.clone(),
    };
    Ok(SubRequest {
        args: args.to_vec(),
        process_cwd,
        root,
        json: call.flags().flag("json").is_some(),
    })
}

/// The flags of one call, read as the Node CLI reads them.
pub(crate) struct Flags {
    call: Call,
}

impl Flags {
    pub(crate) fn of(args: &[OsString]) -> Self {
        Flags {
            call: Call::new(args),
        }
    }

    /// A flag that carries text (its last use); a bare use says nothing.
    pub(crate) fn text(&self, name: &str) -> Option<String> {
        match self.call.flags().flag(name) {
            Some(FlagValue::One(FlagScalar::Str(text))) => Some(text.clone()),
            Some(FlagValue::Many(values)) => values.iter().rev().find_map(|value| match value {
                FlagScalar::Str(text) => Some(text.clone()),
                FlagScalar::Bool => None,
            }),
            _ => None,
        }
    }

    /// A boolean flag: given at all, with no value (`flags.x === true`).
    pub(crate) fn switch(&self, name: &str) -> bool {
        matches!(
            self.call.flags().flag(name),
            Some(FlagValue::One(FlagScalar::Bool))
        )
    }

    /// Whether the flag was given in any form.
    pub(crate) fn given(&self, name: &str) -> bool {
        self.call.flags().flag(name).is_some()
    }

    /// The positionals after the verb (`[0]` is the sub-command).
    pub(crate) fn positional(&self, index: usize) -> Option<&str> {
        self.call.parsed().positional.get(index).map(String::as_str)
    }
}

// ---- the answer ---------------------------------------------------------------------------------------------

/// What one call answers: the data of the envelope (with the exit status and, for a text form, the text), or the
/// refusal the caller prints.
pub(crate) enum Answer {
    Json(Value),
    Verb(VerbAnswer),
}

pub(crate) type Answered = Result<Answer, CategorisedRefusal>;

pub(crate) fn validation(message: impl Into<String>) -> CategorisedRefusal {
    CategorisedRefusal::new("validation", message)
}

/// The Node CLI's `requireField`: a value that is missing or empty refuses with `message`.
pub(crate) fn require(value: Option<String>, message: &str) -> Result<String, CategorisedRefusal> {
    value
        .filter(|value| !value.is_empty())
        .ok_or_else(|| validation(message))
}

/// The project's `.fgos` directory under `root` (`fgosDirFromRoot`).
pub(crate) fn fgos_dir(root: &Path) -> PathBuf {
    root.join(".fgos")
}

/// The run id a run-scoped sub-command names: its positional, else `--run-id`, else `--run`.
pub(crate) fn run_id_of(flags: &Flags, sub: &str) -> Result<String, CategorisedRefusal> {
    require(
        flags
            .positional(1)
            .map(str::to_owned)
            .or_else(|| flags.text("run-id"))
            .or_else(|| flags.text("run")),
        &format!("dispatch {sub} requires a runId: fgos dispatch {sub} <runId>"),
    )
}

fn answer(request: &SubRequest) -> Answered {
    let flags = Flags::of(&request.args);
    match flags.positional(0).unwrap_or_default() {
        "show-run" => observe::show_run(request, &flags),
        "watch" => observe::watch(request, &flags),
        "recover" => recover::recover(request, &flags),
        "inspect" => inspect::inspect(request, &flags),
        "reconcile" => reconcile::reconcile(request, &flags),
        "probe-account" => probes::probe_account(request, &flags),
        "probe-session" => probes::probe_session(request, &flags),
        other => Err(validation(format!(
            "dispatch: unknown sub-verb \"{other}\""
        ))),
    }
}

/// The provider of every sub-command of this module.
pub struct DispatchSubProvider {
    descriptor: ProviderDescriptor,
}

impl DispatchSubProvider {
    pub fn for_descriptor(descriptor: ProviderDescriptor) -> Self {
        Self { descriptor }
    }
}

impl OperationProvider for DispatchSubProvider {
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
            let request = request.input.downcast_ref::<SubRequest>().ok_or_else(|| {
                ProviderError::SemanticValidation("input is not SubRequest".into())
            })?;
            let contract = self.descriptor.outcome_contract.clone();
            Ok(match answer(request) {
                Ok(Answer::Json(value)) => {
                    ProviderOutcome::completed(contract, Box::new(JsonOutcome(value)))
                }
                Ok(Answer::Verb(verb)) => ProviderOutcome::completed(contract, Box::new(verb)),
                Err(refusal) => ProviderOutcome::completed(contract, Box::new(refusal)),
            })
        })
    }
}
