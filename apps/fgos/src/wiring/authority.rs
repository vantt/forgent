//! `fgos authority locate "<sentence>" [--limit N]` and `fgos authority model`: the components, decision kinds,
//! contracts and doors of the component authority model that match a description of the work, and the whole loaded
//! model. The model and the ranking are `fgos_component_authority`; this module projects the call, loads the model
//! of the project the call is aimed at and answers read-only.

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
pub const AVAILABLE_SUBCOMMANDS: &[&str] = &["locate", "model"];

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

/// What an `authority` call asks of the model.
#[derive(Debug, Clone)]
pub enum Action {
    Locate { sentence: String, limit: usize },
    Model,
}

#[derive(Debug, Clone)]
pub struct AuthorityRequest {
    pub root: PathBuf,
    pub action: Action,
}

/// Projects `fgos authority locate "<sentence>" [--limit N]` and `fgos authority model`.
pub fn project_authority_request(
    args: &[OsString],
    root: Result<PathBuf, String>,
) -> Result<AuthorityRequest, String> {
    let call = Call::new(args);
    let sub = match call.sub_word() {
        Some(sub @ ("locate" | "model")) => sub,
        Some(other) => return Err(format!("unknown authority subcommand '{other}'")),
        None => return Err("authority requires a subcommand".to_owned()),
    };
    let allowed: &[&str] = if sub == "locate" { &["limit"] } else { &[] };
    if let Some(flag) = call.flag_outside(allowed) {
        return Err(format!("unknown authority option '--{flag}'"));
    }
    if sub == "model" {
        if !call.arguments().is_empty() {
            return Err("authority model takes no arguments".to_owned());
        }
        return Ok(AuthorityRequest {
            root: root?,
            action: Action::Model,
        });
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
    Ok(AuthorityRequest {
        root: root?,
        action: Action::Locate {
            sentence: words.join(" "),
            limit,
        },
    })
}

/// The answer for one request. `locate`: the sentence, how many rows matched, and the best `limit` of them.
/// `model`: the loaded, validated model itself (layers, components, decision kinds, doors, contracts).
pub fn answer(request: &AuthorityRequest) -> Result<serde_json::Value, ModelError> {
    let model = Model::load(&request.root)?;
    match &request.action {
        Action::Model => Ok(json!(model)),
        Action::Locate { sentence, limit } => {
            let found = locate(&model, sentence);
            let total = found.len();
            let matches: Vec<_> = found.into_iter().take(*limit).collect();
            Ok(json!({
                "sentence": sentence,
                "total": total,
                "matches": matches,
            }))
        }
    }
}

#[derive(Debug, Clone)]
pub struct AuthorityProvider {
    descriptor: ProviderDescriptor,
}

impl AuthorityProvider {
    pub fn new() -> Self {
        Self {
            descriptor: DESCRIPTOR,
        }
    }
}

impl Default for AuthorityProvider {
    fn default() -> Self {
        Self::new()
    }
}

impl OperationProvider for AuthorityProvider {
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
                .downcast_ref::<AuthorityRequest>()
                .ok_or_else(|| {
                    ProviderError::SemanticValidation("input is not AuthorityRequest".into())
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

    fn project(words: &[&str]) -> Result<AuthorityRequest, String> {
        let args: Vec<OsString> = words.iter().map(OsString::from).collect();
        project_authority_request(&args, Ok(PathBuf::from("/x")))
    }

    #[test]
    fn locate_projects_the_sentence_and_a_default_limit() {
        let request = project(&["authority", "locate", "atomic file write"]).unwrap();
        let Action::Locate { sentence, limit } = request.action else {
            panic!("not a locate");
        };
        assert_eq!(sentence, "atomic file write");
        assert_eq!(limit, DEFAULT_LIMIT);
    }

    #[test]
    fn locate_takes_a_limit_and_refuses_a_bad_one() {
        let request = project(&["authority", "locate", "x", "--limit", "3"]).unwrap();
        assert!(matches!(request.action, Action::Locate { limit: 3, .. }));
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

    #[test]
    fn model_projects_with_no_arguments_and_refuses_any_option() {
        let request = project(&["authority", "model"]).unwrap();
        assert!(matches!(request.action, Action::Model));
        assert!(project(&["authority", "model", "extra"]).is_err());
        assert!(project(&["authority", "model", "--limit", "3"]).is_err());
    }
}
