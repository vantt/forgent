//! The live values of the `when:` keys, read once from the project: the one `ValueSource` of the host. A key the
//! registry gives a live source and this reader has no list for answers `None`, and its values go unchecked.
//!
//! * `agentCli`: the agent CLI ids that have an agent-protocol adapter.
//! * `persona`: the personas of the three agent-definition tiers (`fgos agents list`).
//! * `domain`: the directories of `domains/`.
//! * `workType`, `role`: the `classification.kind` and `roleGraph.roles` values of every
//!   `domains/<d>/registry.yaml`; a domain without a registry contributes nothing.
//! * `workflow`, `stage`: the `id` and the step ids of the files in `domains/*/workflows/`.

use std::collections::BTreeSet;
use std::path::Path;

use fgos_agent_context_engine::when_keys::ValueSource;
use fgos_agent_protocol::direct::CLIS;
use fgos_yaml_doc::Profile;

use crate::wiring::agents::tiers_of;

pub struct LiveValues {
    agent_cli: Vec<String>,
    work_type: Vec<String>,
    role: Vec<String>,
    persona: Vec<String>,
    domain: Vec<String>,
    workflow: Vec<String>,
    stage: Vec<String>,
}

fn names_in(dir: &Path, want_dirs: bool) -> Vec<String> {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return Vec::new();
    };
    let mut names: Vec<String> = entries
        .filter_map(Result::ok)
        .filter(|entry| {
            entry.metadata().is_ok_and(|meta| {
                if want_dirs {
                    meta.is_dir()
                } else {
                    meta.is_file()
                }
            })
        })
        .filter_map(|entry| entry.file_name().into_string().ok())
        .filter(|name| !name.starts_with('.'))
        .collect();
    names.sort();
    names
}

/// The workflow ids and the step ids of every workflow file under the domains.
fn workflows_of(root: &Path, domains: &[String]) -> Result<(Vec<String>, Vec<String>), String> {
    let mut workflows = BTreeSet::new();
    let mut stages = BTreeSet::new();
    for domain in domains {
        let dir = root.join("domains").join(domain).join("workflows");
        for name in names_in(&dir, false) {
            if !name.ends_with(".yaml") {
                continue;
            }
            let path = dir.join(&name);
            let bytes = std::fs::read(&path)
                .map_err(|error| format!("{}: cannot be read: {error}", path.display()))?;
            let document = fgos_yaml_doc::parse(&bytes, Profile::Tool, &path.to_string_lossy())
                .map_err(|refusal| format!("{}: {}", path.display(), refusal.rule))?;
            let json = document
                .to_json()
                .map_err(|refusal| format!("{}: {}", path.display(), refusal.rule))?;
            if let Some(id) = json.get("id").and_then(|id| id.as_str()) {
                workflows.insert(id.to_string());
            }
            for step in json
                .get("steps")
                .and_then(|steps| steps.as_array())
                .into_iter()
                .flatten()
            {
                if let Some(id) = step.get("id").and_then(|id| id.as_str()) {
                    stages.insert(id.to_string());
                }
            }
        }
    }
    Ok((
        workflows.into_iter().collect(),
        stages.into_iter().collect(),
    ))
}

/// The `classification.kind` and `roleGraph.roles` values of every domain registry that exists.
fn registries_of(root: &Path, domains: &[String]) -> Result<(Vec<String>, Vec<String>), String> {
    let mut work_types = BTreeSet::new();
    let mut roles = BTreeSet::new();
    for domain in domains {
        let path = root.join("domains").join(domain).join("registry.yaml");
        if !path.is_file() {
            continue;
        }
        let bytes = std::fs::read(&path)
            .map_err(|error| format!("{}: cannot be read: {error}", path.display()))?;
        let document = fgos_yaml_doc::parse(&bytes, Profile::Tool, &path.to_string_lossy())
            .map_err(|refusal| format!("{}: {}", path.display(), refusal.rule))?;
        let json = document
            .to_json()
            .map_err(|refusal| format!("{}: {}", path.display(), refusal.rule))?;
        let listed = |value: Option<&serde_json::Value>| -> Vec<String> {
            value
                .and_then(|list| list.as_array())
                .into_iter()
                .flatten()
                .filter_map(|item| item.as_str().map(str::to_string))
                .collect()
        };
        work_types.extend(listed(json.pointer("/classification/kind")));
        roles.extend(listed(json.pointer("/roleGraph/roles")));
    }
    Ok((
        work_types.into_iter().collect(),
        roles.into_iter().collect(),
    ))
}

impl LiveValues {
    /// Reads the values of the project at `root`. Personas and domains are the project's own tree, the tree the
    /// rule units are read from.
    pub fn read(root: &Path) -> Result<LiveValues, String> {
        let agent_cli: Vec<String> = CLIS.iter().map(|cli| cli.to_string()).collect();
        let (tiers, _) = tiers_of(root, root);
        let mut persona: Vec<String> = fgos_execution::agents::list(&tiers, None)
            .agents
            .into_iter()
            .map(|agent| agent.name)
            .collect();
        persona.sort();
        let domain = names_in(&root.join("domains"), true);
        let (workflow, stage) = workflows_of(root, &domain)?;
        let (work_type, role) = registries_of(root, &domain)?;
        Ok(LiveValues {
            agent_cli,
            work_type,
            role,
            persona,
            domain,
            workflow,
            stage,
        })
    }
}

impl ValueSource for LiveValues {
    fn values(&self, key: &str) -> Option<Vec<String>> {
        match key {
            "agentCli" => Some(self.agent_cli.clone()),
            "workType" => Some(self.work_type.clone()),
            "role" => Some(self.role.clone()),
            "persona" => Some(self.persona.clone()),
            "domain" => Some(self.domain.clone()),
            "workflow" => Some(self.workflow.clone()),
            "stage" => Some(self.stage.clone()),
            _ => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const PERSONA: &str =
        "name: scribe\nversion: 0.1.0\ndescription: A fixture persona.\nrole: Writer\n";
    const REGISTRY: &str = "roleGraph:\n  roles:\n    - producer\n    - reviewer\nclassification:\n  kind:\n    - bug\n    - docs\n";
    const WORKFLOW: &str =
        "id: alpha/flow\ntitle: Flow\nsteps:\n  - id: draft\n    title: Draft\n  - id: polish\n    title: Polish\n";

    fn project(name: &str) -> std::path::PathBuf {
        let root =
            std::env::temp_dir().join(format!("fgos-live-values-{}-{name}", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(root.join("domains/alpha/workflows")).unwrap();
        std::fs::create_dir_all(root.join("domains/alpha/agents")).unwrap();
        std::fs::write(root.join("domains/alpha/workflows/flow.yaml"), WORKFLOW).unwrap();
        std::fs::write(root.join("domains/alpha/agents/scribe.yaml"), PERSONA).unwrap();
        std::fs::write(root.join("domains/alpha/registry.yaml"), REGISTRY).unwrap();
        std::fs::create_dir_all(root.join("domains/beta")).unwrap();
        root
    }

    /// Each `when:` key with a live source answers the values of the project tree. The crate owns matching and
    /// refusing a value against a list; only here do the lists come from directories, the domain
    /// registries, the agent-protocol adapters, the persona tiers and workflow files.
    #[test]
    fn every_live_key_answers_the_values_of_the_project_and_a_key_without_a_list_answers_none() {
        let root = project("live");
        let values = LiveValues::read(&root).expect("the fixture project reads");

        assert_eq!(
            values.values("domain"),
            Some(vec!["alpha".to_string(), "beta".to_string()])
        );
        assert_eq!(
            values.values("workflow"),
            Some(vec!["alpha/flow".to_string()])
        );
        assert_eq!(
            values.values("stage"),
            Some(vec!["draft".to_string(), "polish".to_string()])
        );
        assert_eq!(values.values("persona"), Some(vec!["scribe".to_string()]));
        assert_eq!(
            values.values("workType"),
            Some(vec!["bug".to_string(), "docs".to_string()])
        );
        assert_eq!(
            values.values("role"),
            Some(vec!["producer".to_string(), "reviewer".to_string()])
        );
        let cli = values.values("agentCli").expect("agentCli has a list");
        assert!(cli.contains(&"claude".to_string()), "{cli:?}");
        for key in ["project", "cli", "kind", "nonsense"] {
            assert_eq!(values.values(key), None, "{key}");
        }
        let _ = std::fs::remove_dir_all(&root);
    }

    /// A registry that is not YAML is refused with its path, not skipped, so a typo cannot silently shrink the
    /// `workType` and `role` lists.
    #[test]
    fn an_unparseable_domain_registry_is_refused_with_its_path() {
        let root = project("badregistry");
        std::fs::write(
            root.join("domains/alpha/registry.yaml"),
            "roleGraph: [unclosed\n",
        )
        .unwrap();

        let error = LiveValues::read(&root).err().expect("refused");

        assert!(error.contains("registry.yaml"), "{error}");
        let _ = std::fs::remove_dir_all(&root);
    }

    /// A workflow file that is not YAML is refused with its path, not skipped, so a typo cannot silently shrink
    /// the `workflow` list.
    #[test]
    fn an_unparseable_workflow_file_is_refused_with_its_path() {
        let root = project("bad");
        std::fs::write(
            root.join("domains/alpha/workflows/broken.yaml"),
            "id: [unclosed\n",
        )
        .unwrap();

        let error = LiveValues::read(&root).err().expect("refused");

        assert!(error.contains("broken.yaml"), "{error}");
        let _ = std::fs::remove_dir_all(&root);
    }
}
