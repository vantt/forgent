//! The live values of the `when:` keys, read once from the project: the one `ValueSource` of the host. A key the
//! registry gives a live source and this reader has no list for answers `None`, and its values go unchecked.
//!
//! * `cli`: the executor ids of the runner config.
//! * `persona`: the personas of the three agent-definition tiers (`fgos agents list`).
//! * `domain`: the directories of `domains/`.
//! * `workflow`, `stage`: the `id` and the step ids of the files in `domains/*/workflows/`.

use std::collections::BTreeSet;
use std::path::Path;

use fgos_agent_context_engine::when_keys::ValueSource;
use fgos_yaml_doc::Profile;

use crate::wiring::agents::tiers_of;
use crate::wiring::unit_run_host::machine::load_runner_config;

pub struct LiveValues {
    cli: Vec<String>,
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

impl LiveValues {
    /// Reads the values of the project at `root`. Personas and domains are the project's own tree, the tree the
    /// rule units are read from.
    pub fn read(root: &Path) -> Result<LiveValues, String> {
        let runner = load_runner_config(root).map_err(|error| error.to_string())?;
        let mut cli: Vec<String> = runner
            .get("executors")
            .and_then(|executors| executors.as_object())
            .map(|executors| executors.keys().cloned().collect())
            .unwrap_or_default();
        cli.sort();
        let (tiers, _) = tiers_of(root, root);
        let mut persona: Vec<String> = fgos_execution::agents::list(&tiers, None)
            .agents
            .into_iter()
            .map(|agent| agent.name)
            .collect();
        persona.sort();
        let domain = names_in(&root.join("domains"), true);
        let (workflow, stage) = workflows_of(root, &domain)?;
        Ok(LiveValues {
            cli,
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
            "cli" => Some(self.cli.clone()),
            "persona" => Some(self.persona.clone()),
            "domain" => Some(self.domain.clone()),
            "workflow" => Some(self.workflow.clone()),
            "stage" => Some(self.stage.clone()),
            _ => None,
        }
    }
}
