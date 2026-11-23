//! `fgos authority locate "<sentence>" [--limit N]`: the components, decision kinds, contracts and doors of the
//! component authority model that match a description of the work. The model and the ranking are
//! `fgos_component_authority`; this module projects the call, loads the model of the project the call is aimed at
//! and answers read-only.

use crate::routing::Call;
use fgos_component_authority::{locate, Model, ModelError};
use fgos_host_runtime::{
    ContractRef, EventSink, HostInvocation, InvocationControl, JsonOutcome, OperationId,
    OperationProvider, OperationRequest, ProviderDescriptor, ProviderError, ProviderLifecycle,
    ProviderOutcome,
};
use serde_json::json;
use std::borrow::Cow;
use std::ffi::OsString;
use std::future::Future;
use std::path::PathBuf;
use std::pin::Pin;

pub const OPERATION_ID: &str = "authority.locate";

/// The sub-commands `fgos authority` serves.
pub const AVAILABLE_SUBCOMMANDS: &[&str] = &["locate"];

/// How many matches an answer carries when `--limit` is not given.
const DEFAULT_LIMIT: usize = 10;

pub const DESCRIPTOR: ProviderDescriptor = ProviderDescriptor {
    provider_id: Cow::Borrowed(OPERATION_ID),
    operation_id: OperationId::from_static(OPERATION_ID),
    component_class: Cow::Borrowed("component-authority"),
    mechanism: Cow::Borrowed("builtin"),
    lifecycle: ProviderLifecycle::Singleton,
    request_contract: ContractRef::from_static("authority.locate.request", "1.0.0"),
    outcome_contract: ContractRef::from_static("authority.locate.outcome", "1.0.0"),
    allowed_hosts: &["cli"],
    allowed_modes: &["sync"],
    capabilities: &[],
    replacement: None,
    concurrency: None,
    health: None,
};

#[derive(Debug, Clone)]
pub struct LocateRequest {
    pub root: PathBuf,
    pub sentence: String,
    pub limit: usize,
}

/// Projects `fgos authority locate "<sentence>" [--limit N]`.
pub fn project_authority_request(
    args: &[OsString],
    root: Result<PathBuf, String>,
) -> Result<LocateRequest, String> {
    let call = Call::new(args);
    match call.sub_word() {
        Some("locate") => {}
        Some(other) => return Err(format!("unknown authority subcommand '{other}'")),
        None => return Err("authority requires a subcommand".to_owned()),
    }
    if let Some(flag) = call.flag_outside(&["limit"]) {
        return Err(format!("unknown authority option '--{flag}'"));
    }
    let limit = match call.value("limit")? {
        None => DEFAULT_LIMIT,
        Some(text) => text
            .parse::<usize>()
            .ok()
            .filter(|limit| *limit > 0)
            .ok_or_else(|| format!("--limit takes a positive whole number, got '{text}'"))?,
    };
    let words = call.arguments();
    if words.is_empty() {
        return Err("authority locate requires a sentence".to_owned());
    }
    Ok(LocateRequest {
        root: root?,
        sentence: words.join(" "),
        limit,
    })
}

/// The answer for one request: the sentence, how many rows matched, and the best `limit` of them.
pub fn answer(request: &LocateRequest) -> Result<serde_json::Value, ModelError> {
    let model = Model::load(&request.root)?;
    let found = locate(&model, &request.sentence);
    let total = found.len();
    let matches: Vec<_> = found.into_iter().take(request.limit).collect();
    Ok(json!({
        "sentence": request.sentence,
        "total": total,
        "matches": matches,
    }))
}

#[derive(Debug, Clone, Default)]
pub struct AuthorityProvider;

impl AuthorityProvider {
    pub fn new() -> Self {
        Self
    }
}

impl OperationProvider for AuthorityProvider {
    fn descriptor(&self) -> &ProviderDescriptor {
        &DESCRIPTOR
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
                .downcast_ref::<LocateRequest>()
                .ok_or_else(|| {
                    ProviderError::SemanticValidation("input is not LocateRequest".into())
                })?
                .clone();
            let value = tokio::task::spawn_blocking(move || answer(&request))
                .await
                .map_err(|error| ProviderError::ProviderFailed(error.to_string()))?
                .map_err(|error| ProviderError::ProviderFailed(error.to_string()))?;
            Ok(ProviderOutcome::completed(
                DESCRIPTOR.outcome_contract.clone(),
                Box::new(JsonOutcome(value)),
            ))
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn project(words: &[&str]) -> Result<LocateRequest, String> {
        let args: Vec<OsString> = words.iter().map(OsString::from).collect();
        project_authority_request(&args, Ok(PathBuf::from("/x")))
    }

    #[test]
    fn locate_projects_the_sentence_and_a_default_limit() {
        let request = project(&["authority", "locate", "atomic file write"]).unwrap();
        assert_eq!(request.sentence, "atomic file write");
        assert_eq!(request.limit, DEFAULT_LIMIT);
    }

    #[test]
    fn locate_takes_a_limit_and_refuses_a_bad_one() {
        let request = project(&["authority", "locate", "x", "--limit", "3"]).unwrap();
        assert_eq!(request.limit, 3);
        assert!(project(&["authority", "locate", "x", "--limit", "0"]).is_err());
        assert!(project(&["authority", "locate", "x", "--limit", "many"]).is_err());
    }

    #[test]
    fn locate_refuses_a_missing_sentence_an_unknown_subcommand_and_an_unknown_option() {
        assert!(project(&["authority", "locate"]).is_err());
        assert!(project(&["authority", "declare", "x"]).is_err());
        assert!(project(&["authority"]).is_err());
        assert!(project(&["authority", "locate", "x", "--bogus"]).is_err());
    }
}
