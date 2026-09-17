//! Remote host invocation projector, presenter, and service assembly for `herdr-fgos`.
//!
//! Implements R3-P1 (Remote Projector And Presenter) from
//! `docs/platform/host-invocation-routing/r3-remote-peer-rollout-plan.md` §5.
//! Projects incoming remote host requests into kernel `HostInvocation` and
//! `OperationRequest`, executes them through `InvocationService`, and presents
//! the typed outcome as gateway API JSON without CLI shelling or `fgos.v1` parsing.

use std::sync::Arc;

use fgos_distribution::{
    BuildShowOutcome, BuildShowProvider, BuildShowRequest, DISTRIBUTION_BUILD_SHOW_DESCRIPTOR,
};
use fgos_host_runtime::{
    build_snapshot, ContractRef, HostInvocation, InvocationService, OperationId, OperationRequest,
    ProviderDescriptor, ProviderError, ProviderOutcome, CATALOG,
};
use serde_json::Value;

use crate::gateway::{ErrorCategory, GatewayError};

/// Composition providers registered in the remote invocation snapshot.
///
/// Restricted to `distribution.build.show` per R3-P1 scope.
pub static COMPOSITION_PROVIDERS: &[ProviderDescriptor] = &[DISTRIBUTION_BUILD_SHOW_DESCRIPTOR];

/// Builds an `Arc<InvocationService>` with `BuildShowProvider` registered.
///
/// Mirrors `apps/fgos/src/main.rs`'s composition root construction:
/// `build_snapshot(CATALOG, COMPOSITION_PROVIDERS, "fgos-composition-root-v1")` ->
/// `InvocationService::new(snapshot)` ->
/// `service.register_provider(Arc::new(BuildShowProvider::new()))`.
pub fn build_invocation_service() -> Arc<InvocationService> {
    let snapshot = build_snapshot(CATALOG, COMPOSITION_PROVIDERS, "fgos-composition-root-v1");
    let service = InvocationService::new(snapshot);
    service.register_provider(Arc::new(BuildShowProvider::new()));
    Arc::new(service)
}

/// Alias for [`build_invocation_service`].
pub fn create_invocation_service() -> Arc<InvocationService> {
    build_invocation_service()
}

/// Projects a remote host invocation into a `(HostInvocation, OperationRequest)` pair.
///
/// Mirrors `apps/fgos/src/cli_projector.rs`'s `project_cli_invocation()` but for host
/// kind `"remote"` (`HostInvocation::new("remote")`) and with `BuildShowRequest { include_runtime: true }`
/// fixed per the R3-P0 freeze contract.
///
/// Only operation `"distribution.build.show"` is supported in this module.
pub fn project_remote_invocation(
    operation_id_str: &str,
) -> Result<(HostInvocation, OperationRequest), GatewayError> {
    let operation = OperationId::parse(operation_id_str).map_err(|e| {
        GatewayError::validation(format!(
            "invalid operation id '{}': {}",
            operation_id_str, e
        ))
    })?;

    let (contract, input): (ContractRef, Box<dyn std::any::Any + Send>) = match operation.as_str()
    {
        "distribution.build.show" => (
            ContractRef::from_static("distribution.build.show.request", "1.0.0"),
            Box::new(BuildShowRequest {
                include_runtime: true,
            }),
        ),
        other => {
            return Err(GatewayError::validation(format!(
                "remote projector has no request mapping for '{}'",
                other
            )));
        }
    };

    let invocation = HostInvocation::new("remote");
    let request = OperationRequest::new(operation, contract, input);
    Ok((invocation, request))
}

/// Helper to project `"distribution.build.show"` unconditionally.
pub fn project_remote_build_show_invocation() -> (HostInvocation, OperationRequest) {
    project_remote_invocation("distribution.build.show")
        .expect("static distribution.build.show projection must succeed")
}

/// Maps a kernel [`ProviderError`] into this gateway's existing [`GatewayError`].
///
/// Mirrors `apps/fgos/src/cli_presenter.rs`'s `present_error()` pattern for variant
/// classification and message formulation:
/// - `NoBinding`, `CallerAdmissionDenied`, `SelectedProviderCapabilityDenied`,
///   `IncompatibleContract`, `Precondition` map to [`ErrorCategory::Precondition`].
/// - `AmbiguousBinding`, `Conflict` map to [`ErrorCategory::Conflict`].
/// - `SemanticValidation`, `NotFound` map to [`ErrorCategory::Validation`].
/// - Other variants map to [`ErrorCategory::Unexpected`].
pub fn present_remote_error(err: &ProviderError) -> GatewayError {
    match err {
        ProviderError::NoBinding(refuse) => GatewayError {
            category: ErrorCategory::Precondition,
            message: format!("selection refused (no binding): {refuse}"),
            exit_code: Some(2),
        },
        ProviderError::CallerAdmissionDenied(refuse) => GatewayError {
            category: ErrorCategory::Precondition,
            message: format!("admission refused: {refuse}"),
            exit_code: Some(2),
        },
        ProviderError::SelectedProviderCapabilityDenied(refuse) => GatewayError {
            category: ErrorCategory::Precondition,
            message: format!("grant refused: {refuse}"),
            exit_code: Some(2),
        },
        ProviderError::AmbiguousBinding(refuse) => GatewayError {
            category: ErrorCategory::Conflict,
            message: format!("selection refused (ambiguous binding): {refuse}"),
            exit_code: Some(3),
        },
        ProviderError::IncompatibleContract(msg) => GatewayError {
            category: ErrorCategory::Precondition,
            message: format!("incompatible contract: {msg}"),
            exit_code: Some(2),
        },
        ProviderError::SemanticValidation(msg) => GatewayError {
            category: ErrorCategory::Validation,
            message: format!("semantic validation error: {msg}"),
            exit_code: Some(4),
        },
        ProviderError::Precondition(msg) => GatewayError {
            category: ErrorCategory::Precondition,
            message: format!("precondition error: {msg}"),
            exit_code: Some(2),
        },
        ProviderError::Conflict(msg) => GatewayError {
            category: ErrorCategory::Conflict,
            message: format!("conflict error: {msg}"),
            exit_code: Some(3),
        },
        ProviderError::NotFound(msg) => GatewayError {
            category: ErrorCategory::Validation,
            message: format!("not found: {msg}"),
            exit_code: Some(4),
        },
        other => GatewayError::unexpected(format!("invocation failed: {other}")),
    }
}

/// Trait abstracting inputs that can be inspected as `Result<&ProviderOutcome, &ProviderError>`.
pub trait AsInvocationResult {
    fn as_result(&self) -> Result<&ProviderOutcome, &ProviderError>;
}

impl AsInvocationResult for Result<ProviderOutcome, ProviderError> {
    fn as_result(&self) -> Result<&ProviderOutcome, &ProviderError> {
        match self {
            Ok(ref o) => Ok(o),
            Err(ref e) => Err(e),
        }
    }
}

impl AsInvocationResult for &Result<ProviderOutcome, ProviderError> {
    fn as_result(&self) -> Result<&ProviderOutcome, &ProviderError> {
        match self {
            Ok(ref o) => Ok(o),
            Err(ref e) => Err(e),
        }
    }
}

impl AsInvocationResult for ProviderOutcome {
    fn as_result(&self) -> Result<&ProviderOutcome, &ProviderError> {
        Ok(self)
    }
}

impl AsInvocationResult for &ProviderOutcome {
    fn as_result(&self) -> Result<&ProviderOutcome, &ProviderError> {
        Ok(self)
    }
}

impl AsInvocationResult for ProviderError {
    fn as_result(&self) -> Result<&ProviderOutcome, &ProviderError> {
        Err(self)
    }
}

impl AsInvocationResult for &ProviderError {
    fn as_result(&self) -> Result<&ProviderOutcome, &ProviderError> {
        Err(self)
    }
}

/// Maps a successful outcome downcast to [`BuildShowOutcome`] to a JSON response value,
/// or maps a provider error or unexpected outcome to [`GatewayError`].
///
/// If `result` represents `ProviderOutcome::Completed`:
///   Downcasts `output` to `BuildShowOutcome` and serializes it to `serde_json::Value`.
/// If `result` represents `ProviderOutcome::Parked`:
///   Defensively maps to `GatewayError::unexpected(...)` (Parked is unreachable for
///   `distribution.build.show`, but handled safely without panic).
/// If `result` represents `ProviderError`:
///   Maps to `GatewayError` via [`present_remote_error`].
pub fn present_remote_outcome<T: AsInvocationResult>(result: T) -> Result<Value, GatewayError> {
    match result.as_result() {
        Ok(ProviderOutcome::Completed { output, .. }) => {
            let show = output
                .downcast_ref::<BuildShowOutcome>()
                .ok_or_else(|| GatewayError::unexpected("unsupported outcome payload type"))?;
            serde_json::to_value(show)
                .map_err(|e| GatewayError::unexpected(format!("failed to serialize outcome: {e}")))
        }
        Ok(ProviderOutcome::Parked { reason, .. }) => {
            Err(GatewayError::unexpected(format!(
                "unexpected parked outcome: {reason}"
            )))
        }
        Err(err) => Err(present_remote_error(err)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use fgos_distribution::RuntimeIdentityInfo;

    #[test]
    fn test_project_remote_invocation_success() {
        let (invocation, request) =
            project_remote_invocation("distribution.build.show").expect("projection must succeed");

        assert_eq!(invocation.host_kind, "remote");
        assert_eq!(request.operation.as_str(), "distribution.build.show");
        assert_eq!(request.contract.id(), "distribution.build.show.request");
        assert_eq!(request.contract.version(), "1.0.0");

        let req = request
            .input
            .downcast_ref::<BuildShowRequest>()
            .expect("input must downcast to BuildShowRequest");
        assert!(
            req.include_runtime,
            "include_runtime must be fixed to true per frozen contract"
        );
    }

    #[test]
    fn test_project_remote_invocation_unsupported_operation() {
        let err = project_remote_invocation("work.gate-bypass.show")
            .expect_err("unsupported operation must fail");
        assert_eq!(err.category, ErrorCategory::Validation);
        assert!(err.message.contains("has no request mapping"));

        let err = project_remote_invocation("invalid..op")
            .expect_err("invalid operation id must fail");
        assert_eq!(err.category, ErrorCategory::Validation);
    }

    #[test]
    fn test_project_remote_build_show_invocation_helper() {
        let (invocation, request) = project_remote_build_show_invocation();
        assert_eq!(invocation.host_kind, "remote");
        assert_eq!(request.operation.as_str(), "distribution.build.show");
    }

    #[test]
    fn test_present_remote_outcome_completed() {
        let mut runtime = RuntimeIdentityInfo::dev_source();
        runtime.release_version = Some("1.2.3".to_string());
        runtime.host = "rust".to_string();

        let outcome = BuildShowOutcome {
            package_version: "1.0.0".to_string(),
            git_commit: Some("abc1234".to_string()),
            verbs: vec!["version".to_string(), "status".to_string()],
            runtime: Some(runtime),
        };

        let provider_outcome = ProviderOutcome::completed(
            ContractRef::from_static("distribution.build.show.outcome", "1.0.0"),
            Box::new(outcome),
        );

        // Test with Result<ProviderOutcome, ProviderError>
        let json_val = present_remote_outcome(Ok(provider_outcome))
            .expect("presentation of completed outcome must succeed");

        assert_eq!(json_val["packageVersion"], "1.0.0");
        assert_eq!(json_val["gitCommit"], "abc1234");
        assert_eq!(json_val["verbs"][0], "version");
        assert_eq!(json_val["verbs"][1], "status");
        assert_eq!(json_val["runtime"]["host"], "rust");
        assert_eq!(json_val["runtime"]["releaseVersion"], "1.2.3");

        // Verify no CLI fgos.v1 envelope wrapper exists in the remote presentation
        assert!(json_val.get("contract").is_none());
        assert!(json_val.get("data").is_none());
        assert!(json_val.get("data_hash").is_none());
    }

    #[test]
    fn test_present_remote_outcome_parked_fallback() {
        let parked_outcome = ProviderOutcome::parked(
            ContractRef::from_static("distribution.build.show.outcome", "1.0.0"),
            "waiting on input",
        );

        let err = present_remote_outcome(parked_outcome)
            .expect_err("parked outcome must return unexpected GatewayError");
        assert_eq!(err.category, ErrorCategory::Unexpected);
        assert!(err.message.contains("unexpected parked outcome"));
    }

    #[test]
    fn test_present_remote_outcome_error_mappings() {
        // NoBinding -> Precondition
        let err = ProviderError::NoBinding("no provider bound".to_string());
        let gw_err = present_remote_error(&err);
        assert_eq!(gw_err.category, ErrorCategory::Precondition);
        assert_eq!(gw_err.exit_code, Some(2));
        assert!(gw_err.message.contains("selection refused (no binding)"));

        // CallerAdmissionDenied -> Precondition
        let err = ProviderError::CallerAdmissionDenied("host 'test' not allowed".to_string());
        let gw_err = present_remote_error(&err);
        assert_eq!(gw_err.category, ErrorCategory::Precondition);
        assert_eq!(gw_err.exit_code, Some(2));
        assert!(gw_err.message.contains("admission refused"));

        // SelectedProviderCapabilityDenied -> Precondition
        let err = ProviderError::SelectedProviderCapabilityDenied("missing cap".to_string());
        let gw_err = present_remote_error(&err);
        assert_eq!(gw_err.category, ErrorCategory::Precondition);
        assert_eq!(gw_err.exit_code, Some(2));
        assert!(gw_err.message.contains("grant refused"));

        // AmbiguousBinding -> Conflict
        let err = ProviderError::AmbiguousBinding("multiple providers".to_string());
        let gw_err = present_remote_error(&err);
        assert_eq!(gw_err.category, ErrorCategory::Conflict);
        assert_eq!(gw_err.exit_code, Some(3));
        assert!(gw_err.message.contains("selection refused (ambiguous binding)"));

        // IncompatibleContract -> Precondition
        let err = ProviderError::IncompatibleContract("mismatched version".to_string());
        let gw_err = present_remote_error(&err);
        assert_eq!(gw_err.category, ErrorCategory::Precondition);
        assert_eq!(gw_err.exit_code, Some(2));
        assert!(gw_err.message.contains("incompatible contract"));

        // SemanticValidation -> Validation
        let err = ProviderError::SemanticValidation("invalid field".to_string());
        let gw_err = present_remote_error(&err);
        assert_eq!(gw_err.category, ErrorCategory::Validation);
        assert_eq!(gw_err.exit_code, Some(4));
        assert!(gw_err.message.contains("semantic validation error"));

        // Precondition -> Precondition
        let err = ProviderError::Precondition("state dirty".to_string());
        let gw_err = present_remote_error(&err);
        assert_eq!(gw_err.category, ErrorCategory::Precondition);
        assert_eq!(gw_err.exit_code, Some(2));

        // Conflict -> Conflict
        let err = ProviderError::Conflict("state conflict".to_string());
        let gw_err = present_remote_error(&err);
        assert_eq!(gw_err.category, ErrorCategory::Conflict);
        assert_eq!(gw_err.exit_code, Some(3));

        // Fallback / ProviderCrash -> Unexpected
        let err = ProviderError::ProviderCrash("panic occurred".to_string());
        let gw_err = present_remote_error(&err);
        assert_eq!(gw_err.category, ErrorCategory::Unexpected);
        assert_eq!(gw_err.exit_code, None);
        assert!(gw_err.message.contains("invocation failed"));

        // Also test passing Err through present_remote_outcome directly
        let res: Result<ProviderOutcome, ProviderError> = Err(ProviderError::NoBinding("err".into()));
        let gw_err2 = present_remote_outcome(res).expect_err("must produce GatewayError");
        assert_eq!(gw_err2.category, ErrorCategory::Precondition);
    }

    #[tokio::test]
    async fn test_invocation_service_end_to_end() {
        let service = build_invocation_service();
        let (invocation, request) = project_remote_invocation("distribution.build.show")
            .expect("projecting build show must succeed");

        let outcome = service.invoke(invocation, request).await;
        let json_val = present_remote_outcome(outcome)
            .expect("invoking and presenting outcome must succeed");

        assert!(json_val.get("packageVersion").is_some());
        assert!(json_val.get("verbs").is_some());
        assert!(
            json_val.get("runtime").is_some(),
            "runtime identity info must be present when include_runtime is true"
        );
        let runtime = &json_val["runtime"];
        assert_eq!(runtime["host"], "rust");
    }
}
