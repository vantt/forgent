//! Replays the vectors of `packages/execution/contracts/agents.v1.json`, the one owner of what the agent
//! listing answers for a project. A vector describes the files of a project and of the installed package
//! (`install` is null when the project is its own install); this replay plays the host: it sorts them into
//! tiers in lookup order and hands them to `agents::list`.

use fgos_execution::agents::{list, AgentFile, Content, ShippedCore, TierFiles};
use serde_json::{Map, Value};

fn texts(value: Option<&Value>) -> Vec<(String, String)> {
    value
        .and_then(Value::as_object)
        .map(|files| {
            let mut all: Vec<(String, String)> = files
                .iter()
                .map(|(rel, text)| (rel.clone(), text.as_str().expect("file text").to_string()))
                .collect();
            all.sort();
            all
        })
        .unwrap_or_default()
}

/// The `<name>.yaml` files directly in `dir`, and the `.yml` paths beside them.
fn tier_of(
    files: &[(String, String)],
    dir_of: impl Fn(&str) -> bool,
) -> (Vec<AgentFile>, Vec<String>) {
    let mut found = Vec::new();
    let mut ignored = Vec::new();
    for (rel, text) in files.iter().filter(|(rel, _)| dir_of(rel)) {
        let file_name = rel.rsplit('/').next().expect("file name");
        if let Some(name) = file_name.strip_suffix(".yaml") {
            found.push(AgentFile {
                name: name.to_string(),
                rel: rel.clone(),
                content: Content::Bytes(text.clone().into_bytes()),
            });
        } else if file_name.ends_with(".yml") {
            ignored.push(rel.clone());
        }
    }
    (found, ignored)
}

fn in_dir(dir: &'static str) -> impl Fn(&str) -> bool {
    move |rel| {
        rel.strip_prefix(dir)
            .is_some_and(|rest| !rest.contains('/'))
    }
}

fn domain_agents(rel: &str) -> bool {
    let mut parts = rel.split('/');
    matches!(
        (
            parts.next(),
            parts.next(),
            parts.next(),
            parts.next(),
            parts.next()
        ),
        (Some("domains"), Some(_), Some("agents"), Some(_), None)
    )
}

fn replay(vector: &Value) -> Value {
    let project = texts(vector.get("project"));
    let install = vector
        .get("install")
        .filter(|v| !v.is_null())
        .map(|v| texts(Some(v)));
    let install_files = install.as_deref().unwrap_or(&project);
    let project_has_core = project.iter().any(|(rel, _)| in_dir("core/agents/")(rel));

    let (workspace, workspace_ignored) = tier_of(&project, in_dir("fgos/agents/"));
    let (domain, domain_ignored) = tier_of(install_files, domain_agents);
    let core_source = if project_has_core {
        &project
    } else {
        install_files
    };
    let (core, core_ignored) = tier_of(core_source, in_dir("core/agents/"));
    let tiers = [
        TierFiles {
            tier: "workspace".into(),
            label: "fgos/agents".into(),
            files: workspace,
            ignored: workspace_ignored,
        },
        TierFiles {
            tier: "domain".into(),
            label: "domains/*/agents".into(),
            files: domain,
            ignored: domain_ignored,
        },
        TierFiles {
            tier: "core".into(),
            label: "core/agents".into(),
            files: core,
            ignored: core_ignored,
        },
    ];
    let shipped: Option<Vec<ShippedCore>> = (install.is_some() && project_has_core).then(|| {
        let (files, _) = tier_of(install_files, in_dir("core/agents/"));
        files
            .into_iter()
            .map(|f| ShippedCore {
                name: f.name,
                rel: f.rel,
            })
            .collect()
    });
    serde_json::to_value(list(&tiers, shipped.as_deref())).expect("listing as json")
}

#[test]
fn agents_listing_matches_every_vector() {
    let raw = include_str!("../../contracts/agents.v1.json");
    let contract: Value = serde_json::from_str(raw).expect("contract json");
    assert_eq!(contract["version"], "agents.v1");
    let vectors = contract["vectors"].as_array().expect("vectors");
    assert!(!vectors.is_empty());
    let mut names = std::collections::BTreeSet::new();
    for vector in vectors {
        let name = vector["name"].as_str().expect("vector name");
        assert!(names.insert(name), "vector names are unique: {name}");
        let expect: &Map<String, Value> = vector["expect"].as_object().expect("expect is recorded");
        assert_eq!(&replay(vector), &Value::Object(expect.clone()), "{name}");
    }
}
