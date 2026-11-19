//! The one lookup of an agent definition (persona) by name across its layers, and the pin a unit run keeps of it
//! so every attempt and resume renders the same definition. Ported from `resolveAgentDefinition` and `pinPersona`
//! (`src/runner/agent-definitions.mjs:253,337`). The shape check is `fgos-execution`'s, the one `fgos agents list`
//! judges every file by; the agent-file name rule is Convention's.
//!
//! Lookup order: the workspace `fgos/agents`, the workflow's own folder (`agent.<name>.yaml`), the workflow's
//! owning domain under the running payload, then `core/agents` (the project's own when it carries that folder, the
//! payload's otherwise). The first layer that holds the name wins; an unknown name names every directory searched.

use std::path::{Path, PathBuf};

use fgos_execution_engine::unit_run::run_unit_contract::RunUnitError;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};

/// `AGENT_FILE_MAX_BYTES`: a definition is a short persona sketch; the cap bounds what a pin adds to a record.
const AGENT_FILE_MAX_BYTES: u64 = 16 * 1024;

/// `AGENT_NAME_PATTERN`: `^[a-z][a-z0-9-]{0,63}$`.
fn valid_name(name: &str) -> bool {
    let mut chars = name.chars();
    chars.next().is_some_and(|c| c.is_ascii_lowercase())
        && name.len() <= 64
        && chars.all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
}

/// One layer a lookup reads.
struct Layer {
    layer: &'static str,
    label: String,
    dir: PathBuf,
    rel_dir: String,
    file_name: String,
}

/// `lookupTiers` (`src/runner/agent-definitions.mjs:211`): the layers one lookup reads, in order, for the workflow
/// it is made for (`{ workflowDir, owningDomain }`, the run's `personaScope`).
fn layers(name: &str, project: &Path, install: &Path, workflow: Option<&Value>) -> Vec<Layer> {
    let plain = format!("{name}.yaml");
    let mut out = vec![Layer {
        layer: "workspace",
        label: "fgos/agents".into(),
        dir: project.join("fgos").join("agents"),
        rel_dir: "fgos/agents".into(),
        file_name: plain.clone(),
    }];
    let text = |key: &str| {
        workflow
            .and_then(|w| w.get(key))
            .and_then(Value::as_str)
            .filter(|s| !s.is_empty())
    };
    if let Some(dir) = text("workflowDir") {
        let dir = PathBuf::from(dir);
        let rel_dir = [project, install]
            .iter()
            .find_map(|root| dir.strip_prefix(root).ok())
            .map(|rel| rel.to_string_lossy().replace('\\', "/"))
            .unwrap_or_else(|| dir.to_string_lossy().into_owned());
        let rule = fgos_convention::rules::packaged_rules().definition_file("agent-file");
        let file_name = rule.map_or_else(
            || format!("agent.{name}.yaml"),
            |r| format!("{}{name}{}", r.prefix, r.suffix),
        );
        out.push(Layer {
            layer: "workflow",
            label: "the workflow folder".into(),
            dir,
            rel_dir,
            file_name,
        });
    }
    if let Some(domain) = text("owningDomain") {
        let dir = install.join("domains").join(domain);
        if std::fs::symlink_metadata(&dir).is_ok_and(|m| m.is_dir()) {
            out.push(Layer {
                layer: "domain",
                label: format!("domains/{domain}/agents"),
                dir: dir.join("agents"),
                rel_dir: format!("domains/{domain}/agents"),
                file_name: plain.clone(),
            });
        }
    }
    let core_root = if project.join("core").join("agents").exists() {
        project
    } else {
        install
    };
    out.push(Layer {
        layer: "core",
        label: "core/agents".into(),
        dir: core_root.join("core").join("agents"),
        rel_dir: "core/agents".into(),
        file_name: plain,
    });
    out
}

/// What a lookup answers: the definition found, or that no layer defines the name.
pub enum Lookup {
    Found(Value),
    NotFound(String),
}

/// `resolveAgentDefinition(name, { projectRoot, installRoot, workflow })`: `{ name, tier, source, identity, text,
/// digest }` of the first layer that holds the name, a definition that is too large or of the wrong shape refused
/// by name.
pub fn resolve_agent_definition(
    name: &str,
    project: &Path,
    install: &Path,
    workflow: Option<&Value>,
) -> Result<Lookup, RunUnitError> {
    if !valid_name(name) {
        return Err(RunUnitError::config(
            format!(
                "persona name {} must match /^[a-z][a-z0-9-]{{0,63}}$/ (lowercase letters, digits and \"-\")",
                json!(name)
            ),
            None,
            None,
        ));
    }
    let layers = layers(name, project, install, workflow);
    for layer in &layers {
        let file = layer.dir.join(&layer.file_name);
        let Ok(meta) = std::fs::metadata(&file) else {
            continue;
        };
        if !meta.is_file() {
            continue;
        }
        let rel = format!("{}/{}", layer.rel_dir, layer.file_name);
        if meta.len() > AGENT_FILE_MAX_BYTES {
            return Err(RunUnitError::config(
                format!("persona \"{name}\" ({rel}) is larger than {AGENT_FILE_MAX_BYTES} bytes"),
                None,
                None,
            ));
        }
        let bytes = std::fs::read(&file).map_err(|e| {
            RunUnitError::other("error", format!("persona \"{name}\" ({rel}): {e}"))
        })?;
        let read = fgos_execution::agents::read_definition(&bytes, &rel);
        if let Some(problem) = fgos_execution::agents::shape_problem(name, &read) {
            return Err(RunUnitError::config(
                format!("persona \"{name}\" ({rel}) {problem}"),
                None,
                None,
            ));
        }
        let text = String::from_utf8_lossy(&bytes).into_owned();
        let digest: String = Sha256::digest(text.as_bytes())
            .iter()
            .map(|b| format!("{b:02x}"))
            .collect();
        return Ok(Lookup::Found(json!({
            "name": name,
            "tier": layer.layer,
            "source": rel,
            "identity": format!("{}:{}/{name}", layer.layer, layer.rel_dir),
            "text": text,
            "digest": digest,
        })));
    }
    let searched: Vec<String> = layers
        .iter()
        .map(|l| format!("{} ({})", l.label, l.dir.display()))
        .collect();
    let hint = layers
        .iter()
        .find(|l| l.dir.join(format!("{name}.yml")).exists())
        .map(|l| {
            format!(
                "; {}/{name}.yml exists but only .yaml files are read",
                l.rel_dir
            )
        })
        .unwrap_or_default();
    Ok(Lookup::NotFound(format!(
        "persona \"{name}\" not found; searched {}{hint}",
        searched.join("; ")
    )))
}

/// `unitPersonaPin` over `pinPersona` (`src/runner/execution/unit-run-start.mjs:44`): `{ name, digest, text,
/// identity }` of the unit's persona; `None` for a name no layer defines (it renders by name).
pub fn persona_pin(
    persona: &str,
    main_root: &Path,
    install_root: &Path,
    scope: Option<&Value>,
) -> Result<Option<Value>, RunUnitError> {
    Ok(
        match resolve_agent_definition(persona, main_root, install_root, scope)? {
            Lookup::Found(found) => Some(json!({
                "name": persona,
                "digest": found["digest"],
                "text": found["text"],
                "identity": found["identity"],
            })),
            Lookup::NotFound(_) => None,
        },
    )
}

/// Whether `name` resolves to an agent definition for a run with no workflow (`fgos run --persona`); the refusal
/// sentence when it does not (`AgentNotFoundError`'s, or the definition's own problem).
pub fn check_agent_definition(name: &str, project: &Path, install: &Path) -> Result<(), String> {
    match resolve_agent_definition(name, project, install, None) {
        Ok(Lookup::Found(_)) => Ok(()),
        Ok(Lookup::NotFound(why)) => Err(why),
        Err(error) => Err(error.message),
    }
}
