//! Operation providers for Observe component: `ObserveMetricsProvider` and `ObserveFrictionProvider`.

use crate::contract::{LegacyFrictionSource, ObserveRequest};
use crate::{friction_cli, metrics_cli};
use std::sync::Arc;
use fgos_host_runtime::{
    ContractRef, EventSink, HostInvocation, InvocationControl, JsonOutcome, OperationId,
    OperationProvider, OperationRequest, ProviderDescriptor, ProviderError, ProviderLifecycle,
    ProviderOutcome,
};
use std::borrow::Cow;
use std::future::Future;
use std::pin::Pin;

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
                .ok_or_else(|| ProviderError::SemanticValidation("input is not ObserveRequest".into()))?;

            let work_src_ref: Option<&dyn crate::WorkObservationSource> =
                self.work_source.as_ref().as_ref().map(|b| b.as_ref());
            let res_json =
                metrics_cli::dispatch(req, &self.sources, work_src_ref, self.coverage_scanner, self.unit_summary_scanner)
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
                .ok_or_else(|| ProviderError::SemanticValidation("input is not ObserveRequest".into()))?;
            let res_json = friction_cli::dispatch(req, &self.legacy_sources)
                .map_err(ProviderError::ProviderFailed)?;
            Ok(ProviderOutcome::completed(
                self.descriptor().outcome_contract.clone(),
                Box::new(JsonOutcome(res_json)),
            ))
        })
    }
}
