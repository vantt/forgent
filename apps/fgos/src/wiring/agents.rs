//! `fgos agents list`: every persona a seat can name, and what is wrong with or hidden about each, as a native
//! operation. The judgement is `fgos_execution::agents::list`; this module reads the tier folders and hands the
//! files over. Three tiers, in lookup order: the project's own `fgos/agents`, the shipped domains' `domains/*/agents`,
//! and `core/agents`, which is the project's own when the project carries that folder and the shipped one otherwise.
//! The shipped tiers are the active release's payload (`components.legacyNode.root`), never found through PATH or the
//! working directory.
//!
//! Directory entries are listed in bytewise order of their names, the same on every machine and every locale (the
//! Node listing sorted with the locale's collation, which differs between machines for names that carry
//! punctuation or capitals; `agents.v1.json` has a vector for the order). A definition is read beneath its tier
//! folder with no link followed and under a byte cap; a file that cannot be read is listed as such, never dropped.

use super::dispatch_decide::resolve_path;
use super::seat_binding::read_beneath;
use fgos_execution::agents::{list, AgentFile, Content, ShippedCore, TierFiles};
use fgos_git::invocation_root::{read_repo_facts, RepoFacts};
use fgos_host_runtime::{
    CategorisedRefusal, ContractRef, EventSink, HostInvocation, InvocationControl, JsonOutcome,
    OperationId, OperationProvider, OperationRequest, ProviderDescriptor, ProviderError,
    ProviderLifecycle, ProviderOutcome,
};
use serde_json::{json, Value};
use std::borrow::Cow;
use std::ffi::OsString;
use std::future::Future;
use std::path::{Path, PathBuf};
use std::pin::Pin;

use crate::routing::Call;

pub const OPERATION_ID: &str = "agents.list";

/// The sub-commands `fgos agents` serves.
pub const AVAILABLE_SUBCOMMANDS: &[&str] = &["list"];

pub const DESCRIPTOR: ProviderDescriptor = ProviderDescriptor {
    provider_id: Cow::Borrowed(OPERATION_ID),
    operation_id: OperationId::from_static(OPERATION_ID),
    component_class: Cow::Borrowed("execution"),
    mechanism: Cow::Borrowed("builtin"),
    lifecycle: ProviderLifecycle::Singleton,
    request_contract: ContractRef::from_static("agents.list.request", "1.0.0"),
    outcome_contract: ContractRef::from_static("agents.list.outcome", "1.0.0"),
    allowed_hosts: &["cli"],
    allowed_modes: &["sync"],
    capabilities: &[],
    replacement: None,
    concurrency: None,
    health: None,
};

/// One `fgos agents list` invocation, as the projector read it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AgentsRequest {
    pub process_cwd: PathBuf,
    /// `--worktree`: the project root to read from; the Git worktree of the working directory when absent.
    pub worktree: Option<String>,
}

/// Reads a call of `agents` (`args[0]` is the verb) through the shared parser.
pub fn project_agents_request(args: &[OsString]) -> AgentsRequest {
    use fgos_host_runtime::cli_args::{FlagScalar, FlagValue};
    let call = Call::new(args);
    AgentsRequest {
        process_cwd: std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")),
        worktree: match call.parsed().flag("worktree") {
            Some(FlagValue::One(FlagScalar::Str(path))) => Some(path.clone()),
            _ => None,
        },
    }
}

/// The names in `dir` in bytewise order, or none when it is not a readable directory.
fn names_in(dir: &Path) -> Vec<String> {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return Vec::new();
    };
    let mut names: Vec<String> = entries
        .filter_map(|entry| entry.ok()?.file_name().into_string().ok())
        .collect();
    names.sort_unstable();
    names
}

/// The `<name>.yaml` files of `dir` (shown as `rel_dir/<file>`), and the `.yml` paths beside them. A directory
/// entry that is not a file is no definition; a missing directory holds none.
fn read_tier_dir(dir: &Path, rel_dir: &str, files: &mut Vec<AgentFile>, ignored: &mut Vec<String>) {
    for file_name in names_in(dir) {
        if !std::fs::metadata(dir.join(&file_name)).is_ok_and(|meta| meta.is_file()) {
            continue;
        }
        let rel = format!("{rel_dir}/{file_name}");
        if let Some(name) = file_name.strip_suffix(".yaml") {
            let content = match read_beneath(dir, Path::new(&file_name)) {
                Some(bytes) => Content::Bytes(bytes),
                _ => Content::Unreadable,
            };
            files.push(AgentFile {
                name: name.to_owned(),
                rel,
                content,
            });
        } else if file_name.ends_with(".yml") {
            ignored.push(rel);
        }
    }
}

/// The domain folders of the payload, in bytewise order of their names; a file or a link is no domain.
fn domain_names(payload: &Path) -> Vec<String> {
    let domains = payload.join("domains");
    names_in(&domains)
        .into_iter()
        .filter(|name| {
            std::fs::symlink_metadata(domains.join(name)).is_ok_and(|meta| meta.is_dir())
        })
        .collect()
}

/// The three tiers of a project, in lookup order, and the shipped core personas the project's own `core/agents`
/// hides (`None` when it hides nothing: the project has no core folder of its own, or is the install itself).
fn tiers_of(project: &Path, payload: &Path) -> (Vec<TierFiles>, Option<Vec<ShippedCore>>) {
    let mut workspace = TierFiles {
        tier: "workspace".into(),
        label: "fgos/agents".into(),
        files: Vec::new(),
        ignored: Vec::new(),
    };
    read_tier_dir(
        &project.join("fgos").join("agents"),
        "fgos/agents",
        &mut workspace.files,
        &mut workspace.ignored,
    );
    let mut domain = TierFiles {
        tier: "domain".into(),
        label: "domains/*/agents".into(),
        files: Vec::new(),
        ignored: Vec::new(),
    };
    for name in domain_names(payload) {
        read_tier_dir(
            &payload.join("domains").join(&name).join("agents"),
            &format!("domains/{name}/agents"),
            &mut domain.files,
            &mut domain.ignored,
        );
    }
    let own_core = project.join("core").join("agents");
    let project_has_core = own_core.exists();
    let mut core = TierFiles {
        tier: "core".into(),
        label: "core/agents".into(),
        files: Vec::new(),
        ignored: Vec::new(),
    };
    let core_dir = if project_has_core {
        own_core
    } else {
        payload.join("core").join("agents")
    };
    read_tier_dir(&core_dir, "core/agents", &mut core.files, &mut core.ignored);
    let hides = project_has_core
        && resolve_path(&project.to_string_lossy(), Path::new("/"))
            != resolve_path(&payload.to_string_lossy(), Path::new("/"));
    let shipped = hides.then(|| {
        let (mut files, mut ignored) = (Vec::new(), Vec::new());
        read_tier_dir(
            &payload.join("core").join("agents"),
            "core/agents",
            &mut files,
            &mut ignored,
        );
        files
            .into_iter()
            .map(|file| ShippedCore {
                name: file.name,
                rel: file.rel,
            })
            .collect()
    });
    (vec![workspace, domain, core], shipped)
}

/// The project root a listing reads from: `--worktree`, or the Git worktree of the working directory.
fn project_root(request: &AgentsRequest) -> Result<PathBuf, CategorisedRefusal> {
    if let Some(worktree) = &request.worktree {
        return Ok(resolve_path(worktree, &request.process_cwd));
    }
    let cwd = request.process_cwd.display();
    match read_repo_facts(&request.process_cwd) {
        Ok(RepoFacts::Repository {
            work_tree: Some(root),
            ..
        }) => Ok(root),
        Ok(_) => Err(CategorisedRefusal::new(
            "validation",
            format!(
                "fgos run must run inside a git repository (cwd: {cwd}): not a working repository"
            ),
        )),
        Err(fault) => Err(CategorisedRefusal::new(
            "validation",
            format!(
                "fgos run must run inside a git repository (cwd: {cwd}): {}",
                fault.cause
            ),
        )),
    }
}

/// What a request answers: `{ projectRoot, agents, masked, duplicates, ignored }`.
fn answer(request: &AgentsRequest, payload_root: PayloadRoot) -> Result<Value, CategorisedRefusal> {
    let project = project_root(request)?;
    let payload = payload_root().map_err(|cause| {
        CategorisedRefusal::new(
            "precondition",
            format!("the legacy payload cannot be resolved: {cause}"),
        )
    })?;
    let (tiers, shipped) = tiers_of(&project, &payload);
    let listing = serde_json::to_value(list(&tiers, shipped.as_deref()))
        .map_err(|error| CategorisedRefusal::unexpected(error.to_string()))?;
    let mut out = json!({ "projectRoot": project.to_string_lossy() });
    if let (Some(out), Value::Object(listing)) = (out.as_object_mut(), listing) {
        out.extend(listing);
    }
    Ok(out)
}

/// Where the shipped tiers are read from: the root of the active release's payload, which the composition root
/// resolves (the verb never finds a payload through PATH or the working directory itself).
pub type PayloadRoot = fn() -> Result<PathBuf, String>;

/// The provider of `agents list`.
pub struct AgentsProvider {
    descriptor: ProviderDescriptor,
    payload_root: PayloadRoot,
}

impl AgentsProvider {
    pub fn new(payload_root: PayloadRoot) -> Self {
        Self {
            descriptor: DESCRIPTOR,
            payload_root,
        }
    }
}

impl OperationProvider for AgentsProvider {
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
                .downcast_ref::<AgentsRequest>()
                .ok_or_else(|| {
                    ProviderError::SemanticValidation("input is not AgentsRequest".into())
                })?;
            let contract = DESCRIPTOR.outcome_contract.clone();
            Ok(match answer(request, self.payload_root) {
                Ok(value) => ProviderOutcome::completed(contract, Box::new(JsonOutcome(value))),
                Err(refusal) => ProviderOutcome::completed(contract, Box::new(refusal)),
            })
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn world(name: &str) -> PathBuf {
        let root = std::env::temp_dir().join(format!("fgos-agents-{name}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(&root).unwrap();
        root
    }

    fn write(path: PathBuf, text: &str) {
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        std::fs::write(path, text).unwrap();
    }

    #[test]
    fn a_tier_folder_lists_its_definitions_in_bytewise_order_and_names_the_yml_it_ignores() {
        let root = world("order");
        let dir = root.join("fgos/agents");
        for name in ["b-two", "a_one", "a.dot", "a-dash", "Capital", "a1"] {
            write(
                dir.join(format!("{name}.yaml")),
                "name: x\ndescription: d\n",
            );
        }
        write(dir.join("typo.yml"), "x");
        std::fs::create_dir_all(dir.join("folder.yaml")).unwrap();
        let (mut files, mut ignored) = (Vec::new(), Vec::new());
        read_tier_dir(&dir, "fgos/agents", &mut files, &mut ignored);
        let names: Vec<&str> = files.iter().map(|file| file.name.as_str()).collect();
        assert_eq!(
            names,
            ["Capital", "a-dash", "a.dot", "a1", "a_one", "b-two"]
        );
        assert_eq!(ignored, ["fgos/agents/typo.yml"]);
        std::fs::remove_dir_all(&root).unwrap();
    }

    #[test]
    fn a_definition_that_cannot_be_read_beneath_its_folder_is_listed_unreadable() {
        let root = world("unreadable");
        let dir = root.join("fgos/agents");
        write(dir.join("real.yaml"), "name: real\ndescription: d\n");
        #[cfg(unix)]
        std::os::unix::fs::symlink(dir.join("real.yaml"), dir.join("linked.yaml")).unwrap();
        let (mut files, mut ignored) = (Vec::new(), Vec::new());
        read_tier_dir(&dir, "fgos/agents", &mut files, &mut ignored);
        let by_name = |name: &str| files.iter().find(|file| file.name == name).unwrap();
        assert!(matches!(by_name("real").content, Content::Bytes(_)));
        #[cfg(unix)]
        assert!(matches!(by_name("linked").content, Content::Unreadable));
        std::fs::remove_dir_all(&root).unwrap();
    }

    #[test]
    fn a_project_core_folder_hides_the_shipped_personas_it_lacks_and_a_domains_folder_hides_nothing(
    ) {
        let root = world("masked");
        let (project, payload) = (root.join("project"), root.join("payload"));
        write(
            payload.join("core/agents/planner.yaml"),
            "name: planner\ndescription: p\n",
        );
        write(
            payload.join("core/agents/judge.yaml"),
            "name: judge\ndescription: j\n",
        );
        write(
            payload.join("domains/finance/agents/auditor.yaml"),
            "name: auditor\ndescription: a\n",
        );
        write(
            project.join("domains/own/agents/mine.yaml"),
            "name: mine\ndescription: m\n",
        );
        write(
            project.join("core/agents/planner.yaml"),
            "name: planner\ndescription: own\n",
        );
        let (tiers, shipped) = tiers_of(&project, &payload);
        let listing = list(&tiers, shipped.as_deref());
        let agents: Vec<&str> = listing.agents.iter().map(|a| a.name.as_str()).collect();
        assert_eq!(agents, ["auditor", "planner"]);
        let masked: Vec<&str> = listing.masked.iter().map(|m| m.name.as_str()).collect();
        assert_eq!(masked, ["judge"]);
        let (bare_tiers, bare_shipped) = tiers_of(&root.join("none"), &payload);
        assert!(bare_shipped.is_none());
        let bare = list(&bare_tiers, bare_shipped.as_deref());
        assert!(bare.masked.is_empty());
        std::fs::remove_dir_all(&root).unwrap();
    }

    #[test]
    fn a_worktree_flag_names_the_project_root_as_node_resolves_a_path() {
        let request = AgentsRequest {
            process_cwd: PathBuf::from("/a/b"),
            worktree: Some("../c".into()),
        };
        assert_eq!(project_root(&request).unwrap(), PathBuf::from("/a/c"));
    }
}
