//! `fgos lock-status`: the lock report of `fgos_holder_lock::status` as a native operation
//! (`holder-lock.status`). The report itself belongs to the lock crate; this module carries the call to it: which
//! project's `.fgos` the caller means (the caller-tree root rule of the Git door, a missing project included, as
//! the Node CLI answered), the machine lock root, the run directories only the host's layer knows
//! (`run_dirs`), and the clock.
use super::run_dirs;
use crate::routing::Call;
use fgos_git::invocation_root::{resolve_invocation_root, RootPolicy, RootRequest};
use fgos_holder_lock::status::{collect, StatusRequest};
use fgos_host_runtime::{
    CategorisedRefusal, ContractRef, EventSink, HostInvocation, InvocationControl, JsonOutcome,
    OperationId, OperationProvider, OperationRequest, ProviderDescriptor, ProviderError,
    ProviderLifecycle, ProviderOutcome,
};
use std::borrow::Cow;
use std::ffi::OsString;
use std::future::Future;
use std::path::PathBuf;
use std::pin::Pin;
use std::time::{SystemTime, UNIX_EPOCH};

pub const OPERATION_ID: &str = "holder-lock.status";

pub const DESCRIPTOR: ProviderDescriptor = ProviderDescriptor {
    provider_id: Cow::Borrowed(OPERATION_ID),
    operation_id: OperationId::from_static(OPERATION_ID),
    component_class: Cow::Borrowed("holder-lock"),
    mechanism: Cow::Borrowed("builtin"),
    lifecycle: ProviderLifecycle::Singleton,
    request_contract: ContractRef::from_static("holder-lock.status.request", "1.0.0"),
    outcome_contract: ContractRef::from_static("holder-lock.status.outcome", "1.0.0"),
    allowed_hosts: &["cli"],
    allowed_modes: &["sync"],
    capabilities: &[],
    replacement: None,
    concurrency: None,
    health: None,
};

/// One `fgos lock-status` invocation, as the projector read it: where it ran and the project `--dir` names.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LockStatusRequest {
    pub cwd: PathBuf,
    pub dir: Option<String>,
    pub home: Option<PathBuf>,
}

/// Reads a call of `lock-status` (`args[0]` is the verb) through the shared parser. The verb takes no flag of its
/// own and ignores any positional.
pub fn project_lock_status_request(args: &[OsString]) -> LockStatusRequest {
    let call = Call::new(args);
    LockStatusRequest {
        cwd: std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")),
        dir: call.named_dir(),
        home: fgos_config::machine::home_dir(|key| std::env::var(key).ok()),
    }
}

/// The report, or the caller's refusal when the Git door refuses the checkout.
fn answer(
    request: &LockStatusRequest,
) -> Result<Result<serde_json::Value, CategorisedRefusal>, ProviderError> {
    let root = match resolve_invocation_root(&RootRequest {
        cwd: &request.cwd,
        dir: request.dir.as_deref(),
        policy: RootPolicy::CallerTree,
        home: request.home.as_deref(),
    }) {
        Ok(root) => root,
        Err(refusal) => {
            return Ok(Err(CategorisedRefusal::new("validation", refusal.message)));
        }
    };
    let run_instances = run_dirs::run_instances(&root.fgos_dir);
    let lock_root = fgos_holder_lock::lock_root();
    let now_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |since| since.as_millis() as i64);
    collect(&StatusRequest {
        fgos_dir: &root.fgos_dir,
        lock_root: &lock_root,
        run_instances: &run_instances,
        now_ms,
    })
    .map(Ok)
    .map_err(|error| ProviderError::ProviderFailed(error.to_string()))
}

/// The provider of `holder-lock.status`.
pub struct LockStatusProvider {
    descriptor: ProviderDescriptor,
}

impl LockStatusProvider {
    pub fn new() -> Self {
        Self {
            descriptor: DESCRIPTOR,
        }
    }
}

impl Default for LockStatusProvider {
    fn default() -> Self {
        Self::new()
    }
}

impl OperationProvider for LockStatusProvider {
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
            let request = request
                .input
                .downcast_ref::<LockStatusRequest>()
                .ok_or_else(|| {
                    ProviderError::SemanticValidation("input is not LockStatusRequest".into())
                })?;
            let contract = DESCRIPTOR.outcome_contract.clone();
            Ok(match answer(request)? {
                Ok(report) => ProviderOutcome::completed(contract, Box::new(JsonOutcome(report))),
                Err(refusal) => ProviderOutcome::completed(contract, Box::new(refusal)),
            })
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn os(args: &[&str]) -> Vec<OsString> {
        args.iter().map(OsString::from).collect()
    }

    #[test]
    fn a_call_names_the_project_dir_flag_names_and_ignores_positionals() {
        let plain = project_lock_status_request(&os(&["lock-status", "--json", "extra"]));
        assert_eq!(plain.dir, None);
        let named = project_lock_status_request(&os(&["lock-status", "--dir", "/work/repo"]));
        assert_eq!(named.dir.as_deref(), Some("/work/repo"));
    }

    #[test]
    fn a_checkout_the_git_door_refuses_is_the_callers_usage_error_with_no_report() {
        let dir =
            std::env::temp_dir().join(format!("fgos-lock-status-door-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join(".git"), "not a gitdir pointer\n").unwrap();
        let outcome = answer(&LockStatusRequest {
            cwd: dir.clone(),
            dir: None,
            home: None,
        });
        std::fs::remove_dir_all(&dir).unwrap();
        match outcome {
            Ok(Err(refusal)) => assert_eq!(refusal.category, "validation"),
            _ => panic!("expected a refusal"),
        }
    }
}
