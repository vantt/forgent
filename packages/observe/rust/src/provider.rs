//! The operation provider of the Observe component: one provider type for `observe.metrics` and `observe.friction`.

use crate::contract::ObserveRequest;
use crate::{friction_cli, metrics_cli};
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

/// The root a writing Observe verb works on, resolved once per invocation before
/// the store lock: the Git component's trusted main root of the requested root
/// (so a linked worktree writes its main checkout's stores), the requested root
/// itself outside a repository, and a named error when the topology cannot be
/// trusted (an untrusted worktree), never a silent fall back to a different store. Reads keep the requested root: only a write
/// needs to be sure of its destination.
fn trusted_root(requested: &Path) -> Result<PathBuf, String> {
    match fgos_git::GitDriver::trusted_root_at(requested) {
        Ok(Some(root)) => Ok(root),
        Ok(None) => Ok(requested.to_path_buf()),
        Err(e) => Err(format!("observe-root-unresolved: {}", e.cause)),
    }
}

fn rooted(req: &ObserveRequest, writes: bool) -> Result<Cow<'_, ObserveRequest>, ProviderError> {
    if !writes {
        return Ok(Cow::Borrowed(req));
    }
    let root = trusted_root(&req.root).map_err(ProviderError::ProviderFailed)?;
    Ok(Cow::Owned(ObserveRequest { root, ..req.clone() }))
}

const fn observe_descriptor(
    operation: &'static str,
    request_contract: &'static str,
    outcome_contract: &'static str,
) -> ProviderDescriptor {
    ProviderDescriptor {
        provider_id: Cow::Borrowed(operation),
        operation_id: OperationId::from_static(operation),
        component_class: Cow::Borrowed("observe"),
        mechanism: Cow::Borrowed("builtin"),
        lifecycle: ProviderLifecycle::Singleton,
        request_contract: ContractRef::from_static(request_contract, "1.0.0"),
        outcome_contract: ContractRef::from_static(outcome_contract, "1.0.0"),
        allowed_hosts: &["cli", "remote"],
        allowed_modes: &["sync"],
        capabilities: &[],
        replacement: None,
        concurrency: None,
        health: None,
    }
}

pub const OBSERVE_METRICS_DESCRIPTOR: ProviderDescriptor =
    observe_descriptor("observe.metrics", "observe.metrics.request", "observe.metrics.outcome");

pub const OBSERVE_FRICTION_DESCRIPTOR: ProviderDescriptor =
    observe_descriptor("observe.friction", "observe.friction.request", "observe.friction.outcome");

/// What the composition root gives Observe: the observation sources and
/// scanners the metrics verbs read and the work store they need.
pub struct ObserveWiring {
    pub sources: Vec<Box<dyn crate::ObservationSource>>,
    pub work_source: Box<dyn crate::WorkObservationSource>,
    pub coverage_scanner: metrics_cli::coverage::CoverageScanner,
    pub unit_summary_scanner: crate::UnitSummaryScanner,
}

/// The provider of one of Observe's two operations; the request's operation id
/// picks the verb family.
#[derive(Clone)]
pub struct ObserveProvider {
    descriptor: ProviderDescriptor,
    wiring: Arc<ObserveWiring>,
}

impl ObserveProvider {
    pub fn for_descriptor(descriptor: ProviderDescriptor, wiring: Arc<ObserveWiring>) -> Self {
        Self { descriptor, wiring }
    }
}

impl OperationProvider for ObserveProvider {
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
            let operation = request.operation.as_str();
            events.record_event(&format!("{operation}.invoked"));
            let req = request
                .input
                .downcast_ref::<ObserveRequest>()
                .ok_or_else(|| {
                    ProviderError::SemanticValidation("input is not ObserveRequest".into())
                })?;
            let wiring = &*self.wiring;
            let res_json = match operation {
                "observe.metrics" => {
                    let req = rooted(req, metrics_cli::writes(req))?;
                    metrics_cli::dispatch(
                        &req,
                        &wiring.sources,
                        wiring.work_source.as_ref(),
                        wiring.coverage_scanner,
                        wiring.unit_summary_scanner,
                    )
                }
                "observe.friction" => {
                    let req = rooted(req, friction_cli::writes(req))?;
                    friction_cli::dispatch(&req)
                }
                other => {
                    return Err(ProviderError::SemanticValidation(format!(
                        "observe does not serve operation {other}"
                    )))
                }
            }
            .map_err(ProviderError::ProviderFailed)?;
            Ok(ProviderOutcome::completed(
                self.descriptor().outcome_contract.clone(),
                Box::new(JsonOutcome(res_json)),
            ))
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::process::Command;

    fn temp_dir(tag: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("fgos-observe-root-{tag}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::canonicalize(dir).unwrap()
    }

    #[test]
    fn a_directory_inside_a_repository_resolves_to_the_main_root() {
        let main = temp_dir("repository");
        assert!(Command::new("git").arg("init").arg("-q").arg(&main).status().unwrap().success());
        let nested = main.join("a/b");
        std::fs::create_dir_all(&nested).unwrap();
        assert_eq!(trusted_root(&nested).unwrap(), main);
        let _ = std::fs::remove_dir_all(&main);
    }

    #[test]
    fn a_directory_outside_any_repository_keeps_the_requested_root() {
        let plain = temp_dir("plain");
        assert_eq!(trusted_root(&plain).unwrap(), plain);
        let _ = std::fs::remove_dir_all(&plain);
    }

    #[test]
    fn a_repository_git_cannot_trust_is_a_named_error_not_a_different_root() {
        let broken = temp_dir("untrusted");
        std::fs::write(broken.join(".git"), "not a gitdir pointer\n").unwrap();
        let error = trusted_root(&broken).unwrap_err();
        assert!(error.starts_with("observe-root-unresolved: "), "{error}");
        let _ = std::fs::remove_dir_all(&broken);
    }

    #[test]
    fn only_a_writing_verb_pays_for_the_root_resolve() {
        let broken = temp_dir("writes-only");
        std::fs::write(broken.join(".git"), "not a gitdir pointer\n").unwrap();
        let request = |operation: &str, sub: &str, args: &[&str]| ObserveRequest {
            operation: operation.to_string(),
            sub: sub.to_string(),
            args: args.iter().map(|a| a.to_string()).collect(),
            root: broken.clone(),
            stdin: None,
        };
        let friction = |sub| request("observe.friction", sub, &[]);
        let metrics = |sub, args| request("observe.metrics", sub, args);
        for write in [friction("record"), friction("resolve"), metrics("snapshot", &[]), metrics("case", &["open"]), metrics("case", &["close"]), metrics("eval", &["record"])] {
            let writes = if write.operation == "observe.friction" { friction_cli::writes(&write) } else { metrics_cli::writes(&write) };
            assert!(writes && rooted(&write, writes).is_err(), "{} {:?} must resolve the root", write.sub, write.args);
        }
        for read in [friction("rank"), friction("list"), friction("show"), metrics("case", &["list"]), metrics("eval", &["list"]), metrics("runs", &[]), metrics("entropy", &[])] {
            let writes = if read.operation == "observe.friction" { friction_cli::writes(&read) } else { metrics_cli::writes(&read) };
            assert!(!writes && rooted(&read, writes).unwrap().root == broken, "{} {:?} must keep the requested root", read.sub, read.args);
        }
        let _ = std::fs::remove_dir_all(&broken);
    }
}
