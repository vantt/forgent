//! `fgos worktree create|remove` and `fgos resync-worktree`: the one door that makes, removes and repairs a linked
//! checkout, as native operations (`worktree.create`, `worktree.remove`, `worktree.resync`). The engine is
//! `fgos-checkout`; this module only carries the call to it: which main checkout the caller means, where the state
//! root is, which writer the Git port records, and how a refusal of the engine reaches the caller's exit status.
//!
//! The argv shapes are the ones the Node verb read with the same shared parser: `create` and `remove` take exactly
//! one path, a flag that takes a value and is given none is a validation refusal, and a flag written before the
//! path (`remove --discard-ignored ../w`) takes the path as its value, which leaves no path to remove.
use crate::routing::Call;
use crate::wiring::dispatch_decide::resolve_path;
use fgos_checkout::{
    CreateRequest, Error, ErrorKind, Provision, RemoveRequest, ResyncRequest, Resynced,
};
use fgos_git::invocation_root::{resolve_invocation_root, RootPolicy, RootRequest};
use fgos_host_runtime::cli_args::{FlagScalar, FlagValue};
use fgos_host_runtime::{
    CategorisedRefusal, ContractRef, EventSink, HostInvocation, InvocationControl, OperationId,
    OperationProvider, OperationRequest, ProviderDescriptor, ProviderError, ProviderLifecycle,
    ProviderOutcome,
};
use serde_json::{json, Value};
use std::borrow::Cow;
use std::ffi::OsString;
use std::future::Future;
use std::path::{Path, PathBuf};
use std::pin::Pin;

pub const CREATE_OPERATION_ID: &str = "worktree.create";
pub const REMOVE_OPERATION_ID: &str = "worktree.remove";
pub const RESYNC_OPERATION_ID: &str = "worktree.resync";

/// The sub-commands `fgos worktree` serves.
pub const AVAILABLE_SUBCOMMANDS: &[&str] = &["create", "remove"];

const fn descriptor(
    operation: &'static str,
    request: &'static str,
    outcome: &'static str,
) -> ProviderDescriptor {
    ProviderDescriptor {
        provider_id: Cow::Borrowed(operation),
        operation_id: OperationId::from_static(operation),
        component_class: Cow::Borrowed("worktree"),
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

pub const CREATE_DESCRIPTOR: ProviderDescriptor = descriptor(
    CREATE_OPERATION_ID,
    "worktree.create.request",
    "worktree.create.outcome",
);
pub const REMOVE_DESCRIPTOR: ProviderDescriptor = descriptor(
    REMOVE_OPERATION_ID,
    "worktree.remove.request",
    "worktree.remove.outcome",
);
pub const RESYNC_DESCRIPTOR: ProviderDescriptor = descriptor(
    RESYNC_OPERATION_ID,
    "worktree.resync.request",
    "worktree.resync.outcome",
);

/// One call of `fgos worktree` or `fgos resync-worktree`, as the projector read it. `cwd` is the caller's own
/// directory.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WorktreeRequest {
    Create {
        cwd: PathBuf,
        path: String,
        branch: Option<String>,
        base: Option<String>,
        bare: bool,
    },
    Remove {
        cwd: PathBuf,
        path: String,
        delivered_to: String,
        discard_ignored: bool,
    },
    Resync {
        cwd: PathBuf,
        dir: Option<String>,
        path: Option<String>,
        branch: Option<String>,
    },
}

impl WorktreeRequest {
    /// The operation this request runs.
    pub fn operation_id(&self) -> &'static str {
        match self {
            Self::Create { .. } => CREATE_OPERATION_ID,
            Self::Remove { .. } => REMOVE_OPERATION_ID,
            Self::Resync { .. } => RESYNC_OPERATION_ID,
        }
    }
}

fn validation(message: impl Into<String>) -> CategorisedRefusal {
    CategorisedRefusal::new("validation", message)
}

/// A flag that is optional when absent but must carry a non-empty value when written.
fn named_value(
    call: &Call,
    name: &str,
    message: &str,
) -> Result<Option<String>, CategorisedRefusal> {
    match call.parsed().flag(name) {
        None => Ok(None),
        Some(FlagValue::One(FlagScalar::Str(text))) if !text.is_empty() => Ok(Some(text.clone())),
        Some(_) => Err(validation(message)),
    }
}

/// How the Node CLI read a boolean flag: written with any value but the empty one.
fn truthy(call: &Call, name: &str) -> bool {
    match call.parsed().flag(name) {
        None => false,
        Some(FlagValue::One(FlagScalar::Str(text))) => !text.is_empty(),
        Some(_) => true,
    }
}

/// Reads a call of `worktree` or `resync-worktree` (`args[0]` is the verb) with the shared parser. The sub-command
/// and the flags were checked before this runs.
pub fn project_worktree_request(args: &[OsString]) -> Result<WorktreeRequest, CategorisedRefusal> {
    let call = Call::new(args);
    let cwd = std::env::current_dir()
        .map_err(|error| validation(format!("the current directory cannot be read: {error}")))?;
    let positional = &call.parsed().positional;
    if args.first().is_some_and(|verb| verb == "resync-worktree") {
        let path = call.value("path").map_err(CategorisedRefusal::unexpected)?;
        // The Node verb read an empty `--branch=` as absent and fell back to the default branch.
        let branch = match call.parsed().flag("branch") {
            Some(FlagValue::One(FlagScalar::Str(text))) if text.is_empty() => None,
            _ => named_value(&call, "branch", "resync-worktree --branch requires a name")?,
        };
        return Ok(WorktreeRequest::Resync {
            cwd,
            dir: call.named_dir(),
            path,
            branch,
        });
    }
    match positional.first().map(String::as_str) {
        Some("create") => {
            if positional.len() != 2 {
                return Err(validation(
                    "usage: fgos worktree create <path> [--branch <name> | --detach] [--base <ref>] [--bare] [--json]",
                ));
            }
            let branch = named_value(&call, "branch", "worktree create --branch requires a name")?;
            let base = named_value(&call, "base", "worktree create --base requires a ref")?;
            if branch.is_some() && truthy(&call, "detach") {
                return Err(CategorisedRefusal::unexpected(
                    "worktree create: --branch and --detach are mutually exclusive",
                ));
            }
            Ok(WorktreeRequest::Create {
                cwd,
                path: positional[1].clone(),
                branch,
                base,
                bare: truthy(&call, "bare"),
            })
        }
        Some("remove") => {
            if positional.len() != 2 {
                return Err(validation(
                    "usage: fgos worktree remove <path> --delivered-to <ref> [--discard-ignored] [--json]",
                ));
            }
            let delivered_to = named_value(
                &call,
                "delivered-to",
                "worktree remove requires --delivered-to <ref>",
            )?
            .ok_or_else(|| validation("worktree remove requires --delivered-to <ref>"))?;
            let discard_ignored = match call.parsed().flag("discard-ignored") {
                None => false,
                Some(FlagValue::One(FlagScalar::Bool)) => true,
                Some(_) => {
                    return Err(CategorisedRefusal::unexpected(
                        "worktree remove --discard-ignored takes no value",
                    ))
                }
            };
            Ok(WorktreeRequest::Remove {
                cwd,
                path: positional[1].clone(),
                delivered_to,
                discard_ignored,
            })
        }
        Some(other) => Err(validation(format!("unknown worktree sub-verb: {other}"))),
        None => Err(validation(
            "worktree requires a sub-verb: create <path> | remove <path> --delivered-to <ref> [--discard-ignored]",
        )),
    }
}

/// The main checkout of the repository `cwd` sits in (`cwd` itself outside a repository), with the identity its
/// Git port writes as and the machine state root.
struct Context {
    repo_root: PathBuf,
    state_root: PathBuf,
    writer: String,
}

impl Context {
    fn of(cwd: &Path, dir: Option<&str>) -> Result<Self, CategorisedRefusal> {
        let home = fgos_config::machine::home_dir(|key| std::env::var(key).ok());
        let root = resolve_invocation_root(&RootRequest {
            cwd,
            dir,
            policy: RootPolicy::MainCheckout,
            home: home.as_deref(),
        })
        .map_err(|refusal| validation(refusal.message))?
        .root;
        let writer = fgos_identity::resolve::resolve_current(Some(&root.join(".fgos")))
            .id
            .to_string();
        Ok(Self {
            repo_root: root,
            state_root: fgos_holder_lock::state_root().0,
            writer,
        })
    }
}

/// The refusal a caller sees for a failed checkout operation: a hold that stayed with another process is the
/// `lock-timeout` category, every other failure the one no category names.
fn refusal_of(error: Error) -> CategorisedRefusal {
    match error.kind {
        ErrorKind::LockHeld => CategorisedRefusal::new("lock-timeout", error.message),
        _ => CategorisedRefusal::unexpected(error.message),
    }
}

fn resynced_json(done: Resynced) -> Value {
    match done.reason {
        Some(reason) => json!({"resynced": done.resynced, "reason": reason}),
        None => json!({
            "resynced": done.resynced,
            "from": done.from,
            "to": done.to,
            "reapplied": done.reapplied,
        }),
    }
}

/// Runs one request; the answer is the JSON `data` of the envelope.
pub fn run(request: &WorktreeRequest) -> Result<Value, CategorisedRefusal> {
    match request {
        WorktreeRequest::Create {
            cwd,
            path,
            branch,
            base,
            bare,
        } => {
            let context = Context::of(cwd, None)?;
            let created = fgos_checkout::create(&CreateRequest {
                cwd: cwd.clone(),
                repo_root: context.repo_root,
                state_root: context.state_root,
                writer: context.writer,
                path: resolve_path(path, cwd),
                branch: branch.clone(),
                base: base.clone(),
                provision: if *bare {
                    Provision::None
                } else {
                    Provision::Full
                },
                disposable: false,
            })
            .map_err(refusal_of)?;
            serde_json::to_value(&created.handle)
                .map_err(|error| CategorisedRefusal::unexpected(error.to_string()))
        }
        WorktreeRequest::Remove {
            cwd,
            path,
            delivered_to,
            discard_ignored,
        } => {
            let context = Context::of(cwd, None)?;
            let removed = fgos_checkout::remove(&RemoveRequest {
                cwd: cwd.clone(),
                repo_root: context.repo_root,
                state_root: context.state_root,
                writer: context.writer,
                path: PathBuf::from(path),
                delivered_to: delivered_to.clone(),
                discard_ignored: *discard_ignored,
            })
            .map_err(refusal_of)?;
            Ok(json!({
                "removed": true,
                "path": removed.path,
                "expectedTip": removed.expected_tip,
                "deliveredTo": removed.delivered_to,
                "deliveredToRef": removed.delivered_to_ref,
                "evidenceDigest": removed.evidence_digest,
                "discardedIgnored": {"files": removed.discarded_files, "bytes": removed.discarded_bytes},
            }))
        }
        WorktreeRequest::Resync {
            cwd,
            dir,
            path,
            branch,
        } => {
            let worktree = path
                .as_deref()
                .map_or_else(|| cwd.clone(), |path| resolve_path(path, cwd));
            let context = Context::of(&worktree, dir.as_deref())?;
            fgos_checkout::resync(&ResyncRequest {
                repo_root: context.repo_root,
                state_root: context.state_root,
                writer: context.writer,
                worktree,
                branch: branch.clone(),
            })
            .map(resynced_json)
            .map_err(refusal_of)
        }
    }
}

/// The provider of the three worktree operations.
pub struct WorktreeProvider {
    descriptor: ProviderDescriptor,
}

impl WorktreeProvider {
    pub fn for_descriptor(descriptor: ProviderDescriptor) -> Self {
        Self { descriptor }
    }
}

impl OperationProvider for WorktreeProvider {
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
                .downcast_ref::<WorktreeRequest>()
                .ok_or_else(|| {
                    ProviderError::SemanticValidation("input is not WorktreeRequest".into())
                })?;
            let output: Box<dyn std::any::Any + Send> = match run(request) {
                Ok(data) => Box::new(data),
                Err(refusal) => Box::new(refusal),
            };
            Ok(ProviderOutcome::completed(
                self.descriptor.outcome_contract.clone(),
                output,
            ))
        })
    }
}
