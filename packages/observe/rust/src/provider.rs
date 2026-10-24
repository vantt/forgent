//! Operation providers for Observe component: `ObserveMetricsProvider` and `ObserveFrictionProvider`.

use crate::contract::{LegacyFrictionSource, ObserveRequest};
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
/// itself outside a repository, and a named error when Git cannot answer (an
/// untrusted worktree, an unsupported Git, an unreadable config), never a silent
/// fall back to a different store. Reads keep the requested root: the resolve
/// spawns Git three times (about +20 ms a call, measured), which only a write
/// needs to be sure of its destination.
fn trusted_root(requested: &Path) -> Result<PathBuf, String> {
    match fgos_git::GitDriver::open_at(requested) {
        Ok(Some((_, repo))) => Ok(repo.trusted_main_root().to_path_buf()),
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

pub const OBSERVE_METRICS_DESCRIPTOR: ProviderDescriptor = ProviderDescriptor {
    provider_id: Cow::Borrowed("observe.metrics"),
    operation_id: OperationId::from_static("observe.metrics"),
    component_class: Cow::Borrowed("observe"),
    mechanism: Cow::Borrowed("builtin"),
    lifecycle: ProviderLifecycle::Singleton,
    request_contract: ContractRef::from_static("observe.metrics.request", "1.0.0"),
    outcome_contract: ContractRef::from_static("observe.metrics.outcome", "1.0.0"),
    allowed_hosts: &["cli", "remote"],
    allowed_modes: &["sync"],
    capabilities: &[],
    replacement: None,
    concurrency: None,
    health: None,
};

pub const OBSERVE_FRICTION_DESCRIPTOR: ProviderDescriptor = ProviderDescriptor {
    provider_id: Cow::Borrowed("observe.friction"),
    operation_id: OperationId::from_static("observe.friction"),
    component_class: Cow::Borrowed("observe"),
    mechanism: Cow::Borrowed("builtin"),
    lifecycle: ProviderLifecycle::Singleton,
    request_contract: ContractRef::from_static("observe.friction.request", "1.0.0"),
    outcome_contract: ContractRef::from_static("observe.friction.outcome", "1.0.0"),
    allowed_hosts: &["cli", "remote"],
    allowed_modes: &["sync"],
    capabilities: &[],
    replacement: None,
    concurrency: None,
    health: None,
};

#[derive(Clone)]
pub struct ObserveMetricsProvider {
    descriptor: ProviderDescriptor,
    sources: Arc<Vec<Box<dyn crate::ObservationSource>>>,
    work_source: Arc<Option<Box<dyn crate::WorkObservationSource>>>,
    coverage_scanner: metrics_cli::coverage::CoverageScanner,
    unit_summary_scanner: crate::UnitSummaryScanner,
}

impl ObserveMetricsProvider {
    pub fn with_sources(
        sources: Vec<Box<dyn crate::ObservationSource>>,
        work_source: Option<Box<dyn crate::WorkObservationSource>>,
        coverage_scanner: metrics_cli::coverage::CoverageScanner,
        unit_summary_scanner: crate::UnitSummaryScanner,
    ) -> Self {
        Self {
            descriptor: OBSERVE_METRICS_DESCRIPTOR,
            sources: Arc::new(sources),
            work_source: Arc::new(work_source),
            coverage_scanner,
            unit_summary_scanner,
        }
    }
}

impl OperationProvider for ObserveMetricsProvider {
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
            events.record_event("observe.metrics.invoked");
            let req = request
                .input
                .downcast_ref::<ObserveRequest>()
                .ok_or_else(|| {
                    ProviderError::SemanticValidation("input is not ObserveRequest".into())
                })?;
            let req = rooted(req, metrics_cli::writes(req))?;
            let req: &ObserveRequest = &req;

            let work_src_ref: Option<&dyn crate::WorkObservationSource> =
                self.work_source.as_ref().as_ref().map(|b| b.as_ref());
            let res_json = metrics_cli::dispatch(
                req,
                &self.sources,
                work_src_ref,
                self.coverage_scanner,
                self.unit_summary_scanner,
            )
            .map_err(ProviderError::ProviderFailed)?;
            Ok(ProviderOutcome::completed(
                self.descriptor().outcome_contract.clone(),
                Box::new(JsonOutcome(res_json)),
            ))
        })
    }
}

#[derive(Clone)]
pub struct ObserveFrictionProvider {
    descriptor: ProviderDescriptor,
    legacy_sources: Arc<Vec<Box<dyn LegacyFrictionSource>>>,
}

impl ObserveFrictionProvider {
    pub fn new() -> Self {
        Self {
            descriptor: OBSERVE_FRICTION_DESCRIPTOR,
            legacy_sources: Arc::new(Vec::new()),
        }
    }

    pub fn with_legacy_sources(sources: Vec<Box<dyn LegacyFrictionSource>>) -> Self {
        Self {
            descriptor: OBSERVE_FRICTION_DESCRIPTOR,
            legacy_sources: Arc::new(sources),
        }
    }
}

impl Default for ObserveFrictionProvider {
    fn default() -> Self {
        Self::new()
    }
}

impl OperationProvider for ObserveFrictionProvider {
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
            events.record_event("observe.friction.invoked");
            let req = request
                .input
                .downcast_ref::<ObserveRequest>()
                .ok_or_else(|| {
                    ProviderError::SemanticValidation("input is not ObserveRequest".into())
                })?;
            let req = rooted(req, friction_cli::writes(req))?;
            let req: &ObserveRequest = &req;
            let res_json = friction_cli::dispatch(req, &self.legacy_sources)
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
        for write in [friction("record"), friction("resolve"), friction("migrate"), metrics("snapshot", &[]), metrics("case", &["open"]), metrics("case", &["close"]), metrics("eval", &["record"])] {
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
