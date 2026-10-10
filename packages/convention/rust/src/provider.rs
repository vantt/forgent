use crate::operations::{
    check_all, check_paths, classify, convention_name, convention_path, ConventionError, NameInput,
};
use fgos_host_runtime::{
    ContractRef, EventSink, HostInvocation, InvocationControl, JsonOutcome, OperationId,
    OperationProvider, OperationRequest, ProviderDescriptor, ProviderError, ProviderLifecycle,
    ProviderOutcome,
};
use serde::{Deserialize, Serialize};
use std::borrow::Cow;
use std::future::Future;
use std::path::PathBuf;
use std::pin::Pin;
use std::time::{SystemTime, UNIX_EPOCH};

pub const CONVENTION_DESCRIPTOR: ProviderDescriptor = ProviderDescriptor {
    provider_id: Cow::Borrowed("convention.query"),
    operation_id: OperationId::from_static("convention.query"),
    component_class: Cow::Borrowed("convention"),
    mechanism: Cow::Borrowed("builtin"),
    lifecycle: ProviderLifecycle::Singleton,
    request_contract: ContractRef::from_static("convention.query.request", "1.0.0"),
    outcome_contract: ContractRef::from_static("convention.query.outcome", "1.0.0"),
    allowed_hosts: &["cli", "remote"],
    allowed_modes: &["sync"],
    capabilities: &[],
    replacement: None,
    concurrency: None,
    health: None,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ConventionOperation {
    Name,
    Path,
    Check,
    Classify,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConventionRequest {
    pub operation: ConventionOperation,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub kind: Option<String>,
    #[serde(rename = "type", skip_serializing_if = "Option::is_none")]
    pub artifact_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub slug: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub plan: Option<String>,
    #[serde(default)]
    pub paths: Vec<String>,
    #[serde(default)]
    pub all: bool,
    #[serde(default, rename = "dir")]
    pub root: PathBuf,
}

#[derive(Debug, Clone)]
pub struct ConventionProvider {
    descriptor: ProviderDescriptor,
}

impl ConventionProvider {
    pub fn new() -> Self {
        Self {
            descriptor: CONVENTION_DESCRIPTOR,
        }
    }
}

impl Default for ConventionProvider {
    fn default() -> Self {
        Self::new()
    }
}

impl OperationProvider for ConventionProvider {
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
            events.record_event("convention.query.invoked");
            let request = request
                .input
                .downcast_ref::<ConventionRequest>()
                .ok_or_else(|| {
                    ProviderError::SemanticValidation("input is not ConventionRequest".into())
                })?;
            let value = dispatch(request)
                .map_err(|error| ProviderError::SemanticValidation(error.to_string()))?;
            Ok(ProviderOutcome::completed(
                self.descriptor().outcome_contract.clone(),
                Box::new(JsonOutcome(value)),
            ))
        })
    }
}

pub fn dispatch(request: &ConventionRequest) -> Result<serde_json::Value, ConventionError> {
    match request.operation {
        ConventionOperation::Name | ConventionOperation::Path => {
            let now_millis = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as i64;
            let input = NameInput {
                kind: request
                    .kind
                    .as_deref()
                    .ok_or_else(|| ConventionError::InvalidKind(String::new()))?,
                artifact_type: request.artifact_type.as_deref(),
                slug: request
                    .slug
                    .as_deref()
                    .ok_or(ConventionError::InvalidSlug)?,
                at: request.at.as_deref(),
                now_millis,
                local_offset_seconds: local_offset_seconds(),
            };
            if matches!(request.operation, ConventionOperation::Name) {
                serde_json::to_value(convention_name(&input)?)
            } else {
                serde_json::to_value(convention_path(&input, request.plan.as_deref())?)
            }
            .map_err(|error| ConventionError::Io(error.to_string()))
        }
        ConventionOperation::Check => {
            let outcome = if request.all {
                check_all(&request.root)?
            } else {
                check_paths(&request.paths)?
            };
            serde_json::to_value(outcome).map_err(|error| ConventionError::Io(error.to_string()))
        }
        ConventionOperation::Classify => {
            let path = request.paths.first().ok_or(ConventionError::UnknownKind)?;
            serde_json::to_value(classify(path)?)
                .map_err(|error| ConventionError::Io(error.to_string()))
        }
    }
}

#[cfg(unix)]
fn local_offset_seconds() -> i32 {
    let mut raw_time: libc::time_t = 0;
    let mut local = std::mem::MaybeUninit::<libc::tm>::uninit();
    // SAFETY: `time` writes to a valid `time_t`, and `localtime_r` writes to a
    // valid caller-owned `tm`; both pointers remain alive for the calls.
    unsafe {
        if libc::time(&mut raw_time) == -1
            || libc::localtime_r(&raw_time, local.as_mut_ptr()).is_null()
        {
            return 0;
        }
        local.assume_init().tm_gmtoff.try_into().unwrap_or(0)
    }
}

#[cfg(not(unix))]
fn local_offset_seconds() -> i32 {
    0
}
