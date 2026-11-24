//! `fgos authority locate "<sentence>" [--limit N]`, `fgos authority model`,
//! `fgos authority declare --kind <kind> --row <json|file> [--approved-by <q-id>] [--plan <dir>] [--move]` and
//! `fgos authority render [--check] [--preview-holder <path>]`: the components, decision kinds, contracts and doors
//! of the component authority model that match a description of the work, the whole loaded model, a new or moved
//! row written into it, and the generated ownership views of the platform docs. The model, the ranking, the
//! write path and the renderer are `fgos_component_authority`; this module projects the call, picks the model
//! directory of the project the call is aimed at (one rule, `model_dir`) and wires the owner question store.
//! `locate` and `model` answer read-only, and answer `authority: "inactive"` where the project has no model;
//! `declare` writes the model's YAML; `render` writes the views unless `--check` asks only for drift.

use crate::routing::Call;
use fgos_component_authority::render::{
    build_holder_view_preview, check_views, write_views, ViewRef,
};
use fgos_component_authority::{
    declare, locate, Approvals, DeclareRequest, Kind, Model, QuestionState, MODEL_DIR,
};
use fgos_git::invocation_root::{
    read_repo_facts, resolve_invocation_root, RepoFacts, RootPolicy, RootRequest,
};
use fgos_host_runtime::{
    ContractRef, EventSink, HostInvocation, InvocationControl, JsonOutcome, OperationId,
    OperationProvider, OperationRequest, ProviderDescriptor, ProviderError, ProviderLifecycle,
    ProviderOutcome,
};
use fgos_questions::store::LogOpener;
use serde_json::json;
use std::borrow::Cow;
use std::ffi::OsString;
use std::future::Future;
use std::path::{Path, PathBuf};
use std::pin::Pin;

pub const OPERATION_ID: &str = "authority.locate";

/// The sub-commands `fgos authority` serves.
pub const AVAILABLE_SUBCOMMANDS: &[&str] = &["locate", "model", "declare", "render"];

/// The component's own contract: a root that carries it is the fgOS repository, which keeps its model in the tree.
const OWN_CONTRACT: &str = "packages/component-authority/contracts/model.v1.json";

/// Where a project other than the fgOS repository keeps its model, below its `.fgos` directory.
const PROJECT_MODEL: &str = "authority/model";

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
    /// Adds a row (or, with `move_owner`, moves a decision kind's owner).
    Declare {
        kind: Kind,
        row: serde_json::Value,
        approved_by: Option<String>,
        plan: Option<PathBuf>,
        move_owner: bool,
    },
    /// `check` reports drift and writes nothing; `preview_holder` writes only the preview report at that path.
    Render {
        check: bool,
        preview_holder: Option<String>,
    },
}

#[derive(Debug, Clone)]
pub struct AuthorityRequest {
    pub root: PathBuf,
    pub tree: PathBuf,
    pub action: Action,
}

/// A path as the caller sees it once links are resolved, without Windows' verbatim prefix.
fn real(path: &Path) -> PathBuf {
    let resolved = std::fs::canonicalize(path).unwrap_or_else(|_| path.to_path_buf());
    fgos_process::path::plain_path(&resolved)
}

/// The worktree root and the trusted main checkout of `cwd`, read through the Git door; `None` outside a repository.
fn checkout_roots(cwd: &Path) -> Option<(PathBuf, PathBuf)> {
    match read_repo_facts(cwd).ok()? {
        RepoFacts::Repository {
            work_tree: Some(work_tree),
            trusted_main: Some(trusted_main),
        } => Some((real(&work_tree), real(&trusted_main))),
        _ => None,
    }
}

/// The work tree `cwd` stands in when `cwd` is inside a linked worktree whose trusted main root equals `root`
/// (comparing real paths). Otherwise `root` itself.
pub fn source_tree(root: &Path, cwd: &Path) -> PathBuf {
    let real_root = real(root);
    if let Some((worktree, trusted_main)) = checkout_roots(cwd) {
        if worktree != trusted_main && trusted_main == real_root {
            return worktree;
        }
    }
    root.to_path_buf()
}

/// Projects `fgos authority locate "<sentence>" [--limit N]`, `fgos authority model`,
/// `fgos authority declare --kind <kind> --row <json|file> [--approved-by <q-id>] [--plan <dir>] [--move]` and
/// `fgos authority render [--check] [--preview-holder <path>]`.
pub fn project_authority_request(
    args: &[OsString],
    root: Result<PathBuf, String>,
) -> Result<AuthorityRequest, String> {
    let call = Call::new(args);
    let sub = match call.sub_word() {
        Some(sub @ ("locate" | "model" | "declare" | "render")) => sub,
        Some(other) => return Err(format!("unknown authority subcommand '{other}'")),
        None => return Err("authority requires a subcommand".to_owned()),
    };
    let allowed: &[&str] = match sub {
        "locate" => &["limit"],
        "render" => &["check", "preview-holder"],
        "declare" => &["kind", "row", "approved-by", "plan", "move"],
        _ => &[],
    };
    if let Some(flag) = call.flag_outside(allowed) {
        return Err(format!("unknown authority option '--{flag}'"));
    }
    let root = root?;
    let cwd = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let tree = source_tree(&root, &cwd);
    if sub == "model" {
        if !call.arguments().is_empty() {
            return Err("authority model takes no arguments".to_owned());
        }
        return Ok(AuthorityRequest {
            root,
            tree,
            action: Action::Model,
        });
    }
    if sub == "declare" {
        return project_declare(&call, root, tree);
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
            root,
            tree,
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
        root,
        tree,
        action: Action::Locate {
            sentence: words.join(" "),
            limit,
        },
    })
}

/// `declare`: the kind, the row (inline JSON, or the path of a file holding it), the approving question and,
/// for a move, the plan.
fn project_declare(call: &Call, root: PathBuf, tree: PathBuf) -> Result<AuthorityRequest, String> {
    if !call.arguments().is_empty() {
        return Err("authority declare takes no arguments".to_owned());
    }
    let kind_word = call
        .value("kind")?
        .ok_or("authority declare requires --kind component|decision-kind|door|contract")?;
    let kind = Kind::parse(&kind_word).ok_or_else(|| {
        format!("--kind takes component, decision-kind, door or contract, got '{kind_word}'")
    })?;
    let row_text = call
        .value("row")?
        .ok_or("authority declare requires --row <json|file>")?;
    let row_text = if row_text.trim_start().starts_with('{') {
        row_text
    } else {
        std::fs::read_to_string(&row_text).map_err(|error| format!("--row {row_text}: {error}"))?
    };
    let row =
        serde_json::from_str(&row_text).map_err(|error| format!("--row is not JSON: {error}"))?;
    Ok(AuthorityRequest {
        root,
        tree,
        action: Action::Declare {
            kind,
            row,
            approved_by: call.value("approved-by")?,
            plan: call.value("plan")?.map(PathBuf::from),
            move_owner: call.switch("move")?,
        },
    })
}

/// The directory of the model of the project at `root`, by one rule: the fgOS repository (its root carries the
/// component's own contract) keeps `packages/component-authority/model/`; every other project keeps
/// `.fgos/authority/model/`, joined through the invocation-root door's `.fgos` directory.
pub fn model_dir(root: &Path) -> Result<PathBuf, String> {
    if root.join(OWN_CONTRACT).is_file() {
        return Ok(root.join(MODEL_DIR));
    }
    let dir = root
        .to_str()
        .ok_or_else(|| format!("{}: the project path is not UTF-8", root.display()))?;
    let found = resolve_invocation_root(&RootRequest {
        cwd: root,
        dir: Some(dir),
        policy: RootPolicy::CallerTree,
        home: None,
    })
    .map_err(|refusal| refusal.message)?;
    Ok(found.fgos_dir.join(PROJECT_MODEL))
}

/// The question store, read as `declare`'s owner-answer check.
struct StoreApprovals<'a> {
    root: &'a Path,
}

impl Approvals for StoreApprovals<'_> {
    fn state(&self, question: &str) -> Result<QuestionState, String> {
        use fgos_questions::store::State;
        let log = super::questions::HostLogOpener::reader()
            .open(self.root)
            .map_err(|refusal| refusal.to_string())?
            .ok_or("there is no repository to hold the question store")?;
        let events = log.read().map_err(|refusal| refusal.to_string())?;
        Ok(match fgos_questions::store::fold(&events).get(question) {
            None => QuestionState::Unknown,
            Some(found) => match found.state {
                State::Open => QuestionState::Open,
                State::Answered | State::Acked => QuestionState::Answered,
                State::Cancelled => QuestionState::Cancelled,
            },
        })
    }
}

/// The answer where the project has no model: nothing to ask, nothing wrong.
fn inactive(mut data: serde_json::Value) -> serde_json::Value {
    data["authority"] = json!("inactive");
    data
}

/// The answer for one request. `locate`: the sentence, how many rows matched, and the best `limit` of them.
/// `model`: the loaded, validated model itself (layers, components, decision kinds, doors, contracts).
/// `locate` and `model` answer `{"authority": "inactive"}` (plus an empty match list) where the project has no
/// model. `declare`: the row it wrote, the files it wrote it to, and the `root` it wrote into. `render`: the
/// `root` it wrote into and the views it wrote, or with `--check` the drift it found (a non-empty drift is a
/// failure); with `--preview-holder` the `root` and the path of the preview report it wrote.
pub fn answer(request: &AuthorityRequest) -> Result<serde_json::Value, String> {
    match &request.action {
        Action::Render {
            check,
            preview_holder,
        } => render(&request.tree, *check, preview_holder.as_deref()),
        Action::Declare {
            kind,
            row,
            approved_by,
            plan,
            move_owner,
        } => {
            let dir = model_dir(&request.tree)?;
            let declared = declare(
                &dir,
                &request.tree,
                &DeclareRequest {
                    kind: *kind,
                    row,
                    approved_by: approved_by.as_deref(),
                    plan: plan.as_deref(),
                    move_owner: *move_owner,
                    update: false,
                },
                &StoreApprovals {
                    root: &request.root,
                },
            )
            .map_err(|refusal| refusal.to_string())?;
            let files: Vec<String> = declared
                .files
                .iter()
                .map(|file| file.to_string_lossy().into_owned())
                .collect();
            Ok(json!({
                "root": request.tree,
                "declared": {
                    "kind": declared.kind.word(),
                    "id": declared.id,
                    "row": declared.row,
                    "files": files,
                    "createdModel": declared.created_model,
                },
            }))
        }
        Action::Model => {
            let dir = model_dir(&request.tree)?;
            match Model::load_dir_if_present(&dir).map_err(|error| error.to_string())? {
                Some(model) => Ok(json!(model)),
                None => Ok(inactive(json!({}))),
            }
        }
        Action::Locate { sentence, limit } => {
            let dir = model_dir(&request.tree)?;
            let Some(model) =
                Model::load_dir_if_present(&dir).map_err(|error| error.to_string())?
            else {
                return Ok(inactive(json!({
                    "sentence": sentence,
                    "total": 0,
                    "matches": [],
                })));
            };
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
        return Ok(json!({ "root": root, "preview": target }));
    }
    if check {
        let drift = check_views(root).map_err(|error| error.to_string())?;
        if drift.is_empty() {
            return Ok(json!({ "root": root, "drift": [] }));
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
        "root": root,
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
    fn declare_projects_the_kind_the_row_the_approval_and_a_move() {
        let request = project(&[
            "authority",
            "declare",
            "--kind",
            "decision-kind",
            "--row",
            r#"{"id":"d","owner":"o"}"#,
            "--approved-by",
            "q-1",
            "--plan",
            "plans/p",
            "--move",
        ])
        .unwrap();
        let Action::Declare {
            kind,
            row,
            approved_by,
            plan,
            move_owner,
        } = request.action
        else {
            panic!("not a declare");
        };
        assert_eq!(kind, Kind::DecisionKind);
        assert_eq!(row["owner"], "o");
        assert_eq!(approved_by.as_deref(), Some("q-1"));
        assert_eq!(plan, Some(PathBuf::from("plans/p")));
        assert!(move_owner);
    }

    #[test]
    fn declare_refuses_a_missing_or_unknown_kind_a_missing_or_bad_row_and_an_argument() {
        let row = r#"{"id":"d"}"#;
        assert!(project(&["authority", "declare", "--row", row]).is_err());
        assert!(project(&["authority", "declare", "--kind", "thing", "--row", row]).is_err());
        assert!(project(&["authority", "declare", "--kind", "door"]).is_err());
        assert!(project(&["authority", "declare", "--kind", "door", "--row", "{nope"]).is_err());
        assert!(project(&[
            "authority",
            "declare",
            "--kind",
            "door",
            "--row",
            row,
            "extra"
        ])
        .is_err());
        assert!(project(&[
            "authority",
            "declare",
            "--kind",
            "door",
            "--row",
            row,
            "--bogus"
        ])
        .is_err());
    }

    #[test]
    fn the_fgos_repository_keeps_its_model_in_the_tree_and_every_other_project_under_dot_fgos() {
        let own = std::env::temp_dir().join(format!("fgos-model-dir-own-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&own);
        let contract = own.join(OWN_CONTRACT);
        std::fs::create_dir_all(contract.parent().unwrap()).unwrap();
        std::fs::write(&contract, "{}").unwrap();
        assert_eq!(model_dir(&own).unwrap(), own.join(MODEL_DIR));
        let _ = std::fs::remove_dir_all(&own);

        let other =
            std::env::temp_dir().join(format!("fgos-model-dir-other-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&other);
        std::fs::create_dir_all(other.join(".fgos")).unwrap();
        let dir = model_dir(&other).unwrap();
        assert!(dir.ends_with(".fgos/authority/model"), "{}", dir.display());
        assert!(!dir.starts_with(other.join(MODEL_DIR)));
        let _ = std::fs::remove_dir_all(&other);
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
            OWN_CONTRACT,
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

    #[test]
    fn source_tree_returns_the_worktree_when_root_is_main_and_returns_root_otherwise() {
        let dir = std::env::temp_dir().join(format!(
            "fgos-authority-source-tree-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let _ = std::fs::remove_dir_all(&dir);
        let main = dir.join("main");
        let wt = dir.join("wt");
        let unrelated = dir.join("unrelated");
        std::fs::create_dir_all(&main).unwrap();
        std::fs::create_dir_all(&unrelated).unwrap();

        let git = |args: &[&str], cwd: &Path| {
            let out = std::process::Command::new("git")
                .args(args)
                .current_dir(cwd)
                .env("GIT_CONFIG_GLOBAL", "/dev/null")
                .env("GIT_CONFIG_NOSYSTEM", "1")
                .output()
                .unwrap();
            assert!(out.status.success(), "git {args:?}: {out:?}");
        };

        git(&["init", "-q", "-b", "main"], &main);
        git(
            &[
                "-c",
                "user.name=t",
                "-c",
                "user.email=t@example.invalid",
                "commit",
                "--allow-empty",
                "-m",
                "init",
            ],
            &main,
        );
        git(
            &[
                "worktree",
                "add",
                "-q",
                "-b",
                "wt-branch",
                wt.to_str().unwrap(),
            ],
            &main,
        );

        // When cwd is inside a linked worktree of main, return the worktree.
        assert_eq!(source_tree(&main, &wt), real(&wt));
        let sub = wt.join("subdir");
        std::fs::create_dir_all(&sub).unwrap();
        assert_eq!(source_tree(&main, &sub), real(&wt));

        // When cwd is the main checkout itself, return root.
        assert_eq!(source_tree(&main, &main), main);

        // When cwd is an unrelated directory, return root.
        assert_eq!(source_tree(&main, &unrelated), main);

        let _ = std::fs::remove_dir_all(&dir);
    }
}
