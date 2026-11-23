//! `fgos authority locate "<sentence>" [--limit N]`, `fgos authority model` and
//! `fgos authority render [--check] [--preview-holder <path>]`: the components, decision kinds, contracts and doors
//! of the component authority model that match a description of the work, the whole loaded model, and the
//! generated ownership views of the platform docs. The model, the ranking and the renderer are
//! `fgos_component_authority`; this module projects the call and loads the model of the project the call is aimed
//! at. `locate` and `model` answer read-only; `render` writes the views unless `--check` asks only for drift.

use crate::routing::Call;
use fgos_component_authority::render::{
    build_holder_view_preview, check_views, write_views, ViewRef,
};
use fgos_component_authority::{locate, Model};
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
pub const AVAILABLE_SUBCOMMANDS: &[&str] = &["locate", "model", "render"];

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
    Locate {
        sentence: String,
        limit: usize,
    },
    Model,
    /// `check` reports drift and writes nothing; `preview_holder` writes only the preview report at that path.
    Render {
        check: bool,
        preview_holder: Option<String>,
    },
}

#[derive(Debug, Clone)]
pub struct AuthorityRequest {
    pub root: PathBuf,
    pub action: Action,
}

/// Projects `fgos authority locate "<sentence>" [--limit N]`, `fgos authority model` and
/// `fgos authority render [--check] [--preview-holder <path>]`.
pub fn project_authority_request(
    args: &[OsString],
    root: Result<PathBuf, String>,
) -> Result<AuthorityRequest, String> {
    let call = Call::new(args);
    let sub = match call.sub_word() {
        Some(sub @ ("locate" | "model" | "render")) => sub,
        Some(other) => return Err(format!("unknown authority subcommand '{other}'")),
        None => return Err("authority requires a subcommand".to_owned()),
    };
    let allowed: &[&str] = match sub {
        "locate" => &["limit"],
        "render" => &["check", "preview-holder"],
        _ => &[],
    };
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
    if sub == "render" {
        if !call.arguments().is_empty() {
            return Err("authority render takes no arguments".to_owned());
        }
        let check = call.switch("check")?;
        let preview_holder = call.value("preview-holder")?;
        if check && preview_holder.is_some() {
            return Err("--check and --preview-holder cannot be combined".to_owned());
        }
        return Ok(AuthorityRequest {
            root: root?,
            action: Action::Render {
                check,
                preview_holder,
            },
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
/// `render`: the views it wrote, or with `--check` the drift it found (a non-empty drift is a failure);
/// with `--preview-holder` the path of the preview report it wrote.
pub fn answer(request: &AuthorityRequest) -> Result<serde_json::Value, String> {
    match &request.action {
        Action::Render {
            check,
            preview_holder,
        } => render(&request.root, *check, preview_holder.as_deref()),
        Action::Model => {
            let model = Model::load(&request.root).map_err(|error| error.to_string())?;
            Ok(json!(model))
        }
        Action::Locate { sentence, limit } => {
            let model = Model::load(&request.root).map_err(|error| error.to_string())?;
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

fn view_refs(views: &[ViewRef]) -> Vec<serde_json::Value> {
    views
        .iter()
        .map(|entry| json!({ "view": entry.view, "file": entry.file }))
        .collect()
}

fn render(
    root: &std::path::Path,
    check: bool,
    preview_holder: Option<&str>,
) -> Result<serde_json::Value, String> {
    if let Some(target) = preview_holder {
        let content = build_holder_view_preview(root).map_err(|error| error.to_string())?;
        let path = root.join(target);
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|error| format!("{}: {error}", parent.display()))?;
        }
        std::fs::write(&path, content).map_err(|error| format!("{}: {error}", path.display()))?;
        return Ok(json!({ "preview": target }));
    }
    if check {
        let drift = check_views(root).map_err(|error| error.to_string())?;
        if drift.is_empty() {
            return Ok(json!({ "drift": [] }));
        }
        let lines: Vec<String> = drift
            .iter()
            .map(|entry| {
                format!(
                    "view \"{}\" in {}: {}",
                    entry.view, entry.file, entry.reason
                )
            })
            .collect();
        return Err(format!(
            "{}\nregenerate with `fgos authority render`.",
            lines.join("\n")
        ));
    }
    let report = write_views(root).map_err(|error| error.to_string())?;
    Ok(json!({
        "written": view_refs(&report.written),
        "skipped": view_refs(&report.skipped),
    }))
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

    #[test]
    fn render_projects_a_write_a_check_and_a_holder_preview() {
        let request = project(&["authority", "render"]).unwrap();
        assert!(matches!(
            request.action,
            Action::Render {
                check: false,
                preview_holder: None
            }
        ));
        let request = project(&["authority", "render", "--check"]).unwrap();
        assert!(matches!(request.action, Action::Render { check: true, .. }));
        let request =
            project(&["authority", "render", "--preview-holder", "out/preview.md"]).unwrap();
        let Action::Render { preview_holder, .. } = request.action else {
            panic!("not a render");
        };
        assert_eq!(preview_holder.as_deref(), Some("out/preview.md"));
    }

    /// A temporary repository holding the real model and every generated view document of this checkout.
    fn seeded_repository(name: &str) -> PathBuf {
        let checkout = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..");
        let root = std::env::temp_dir().join(format!(
            "fgos-wiring-authority-{name}-{}",
            std::process::id()
        ));
        let _ = std::fs::remove_dir_all(&root);
        copy_tree(
            &checkout.join("packages/component-authority/model"),
            &root.join("packages/component-authority/model"),
        );
        for file in [
            "docs/platform/component-boundary.md",
            "docs/platform/README.md",
            "docs/platform/governance.md",
            "docs/platform/system-overview/spec.md",
            "docs/platform/observe/spec.md",
            "docs/platform/workflow/spec.md",
            "docs/platform/architecture-map.md",
        ] {
            let target = root.join(file);
            std::fs::create_dir_all(target.parent().unwrap()).unwrap();
            std::fs::copy(checkout.join(file), target).unwrap();
        }
        root
    }

    fn copy_tree(from: &std::path::Path, to: &std::path::Path) {
        std::fs::create_dir_all(to).unwrap();
        for entry in std::fs::read_dir(from).unwrap() {
            let entry = entry.unwrap();
            let target = to.join(entry.file_name());
            if entry.file_type().unwrap().is_dir() {
                copy_tree(&entry.path(), &target);
            } else {
                std::fs::copy(entry.path(), target).unwrap();
            }
        }
    }

    #[test]
    fn render_check_fails_naming_the_view_whose_generated_block_was_hand_edited() {
        let root = seeded_repository("check-hand-edit");
        let write = project_authority_request(
            &["authority", "render"].map(OsString::from),
            Ok(root.clone()),
        )
        .unwrap();
        answer(&write).expect("the seeded views render from the seeded model");
        let request = project_authority_request(
            &["authority", "render", "--check"].map(OsString::from),
            Ok(root.clone()),
        )
        .unwrap();
        answer(&request).expect("the copied views are in sync with the model");

        let file = root.join("docs/platform/component-boundary.md");
        let start = format!(
            "{}\n",
            fgos_component_authority::render::start_marker("component-boundary")
        );
        let before = std::fs::read_to_string(&file).unwrap();
        let tampered = before.replace(&start, &format!("{start}HAND EDITED\n"));
        assert_ne!(tampered, before);
        std::fs::write(&file, &tampered).unwrap();

        let error = answer(&request).unwrap_err();
        assert!(
            error.contains("view \"component-boundary\" in docs/platform/component-boundary.md"),
            "{error}"
        );
        assert_eq!(std::fs::read_to_string(&file).unwrap(), tampered);
        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn render_refuses_a_bare_preview_flag_a_combination_an_argument_and_an_unknown_option() {
        assert!(project(&["authority", "render", "--preview-holder"]).is_err());
        assert!(project(&["authority", "render", "--check", "--preview-holder", "x"]).is_err());
        assert!(project(&["authority", "render", "extra"]).is_err());
        assert!(project(&["authority", "render", "--bogus"]).is_err());
        assert!(project(&["authority", "locate", "x", "--check"]).is_err());
    }
}
