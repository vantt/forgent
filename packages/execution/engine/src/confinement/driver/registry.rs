//! The machine backend registry: the schema `confinement-backend-registry.v1`, its validation, the immutable
//! snapshot a dispatch resolves instances from, the bootstrap of a missing default, and the table of drivers by
//! type. A project config can never define or override a backend (trust boundary: the machine registry is the
//! only place deployment config lives).

use super::contract::BackendDriver;
use super::{DriverError, ErrorKind};
use crate::confinement::driver::js;
use fgos_durable_file::replace_durably;
use serde_json::{json, Map, Value};
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;

pub const REGISTRY_CONTRACT: &str = "confinement-backend-registry.v1";
pub const ALLOWED_DRIVER_TYPES: [&str; 3] = ["bwrap", "container", "remote"];
pub const REGISTRY_PATH_ENV: &str = "FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH";
const REGISTRY_FILE: &str = "confinement-backends.json";

fn refuse(message: impl Into<String>) -> DriverError {
    DriverError::new(ErrorKind::Registry, message)
}

/// The drivers by type. An unregistered type is refused by name, never best-effort.
#[derive(Default)]
pub struct DriverRegistry {
    drivers: BTreeMap<String, Arc<dyn BackendDriver>>,
}

impl DriverRegistry {
    pub fn new() -> Self {
        Self::default()
    }

    /// Registers `driver` under its own type, which must be one of [`ALLOWED_DRIVER_TYPES`].
    pub fn register(&mut self, driver: Arc<dyn BackendDriver>) -> Result<(), DriverError> {
        if !ALLOWED_DRIVER_TYPES.contains(&driver.driver_type()) {
            return Err(refuse(format!(
                "cannot register driver for disallowed type \"{}\". Allowed types: {}.",
                driver.driver_type(),
                ALLOWED_DRIVER_TYPES.join(", ")
            )));
        }
        self.drivers
            .insert(driver.driver_type().to_string(), driver);
        Ok(())
    }

    pub fn get(&self, kind: &Value) -> Result<Arc<dyn BackendDriver>, DriverError> {
        kind.as_str()
            .filter(|name| ALLOWED_DRIVER_TYPES.contains(name))
            .and_then(|name| self.drivers.get(name))
            .cloned()
            .ok_or_else(|| {
                refuse(format!(
                    "unknown confinement backend driver type \"{}\" (confinement-backend-unknown). Known types: {}.",
                    js::display(Some(kind)),
                    self.drivers.keys().cloned().collect::<Vec<_>>().join(", ")
                ))
            })
    }
}

/// The default machine registry: one enabled bwrap instance.
pub fn default_machine_registry() -> Value {
    json!({
        "contract": REGISTRY_CONTRACT,
        "confinementBackends": { "bwrap": { "type": "bwrap", "enabled": true, "executable": "/usr/bin/bwrap" } }
    })
}

fn allowed_keys_check(
    config: &Map<String, Value>,
    allowed: &[&str],
    label: &str,
    id: &str,
    kind: &str,
) -> Result<(), DriverError> {
    for key in config.keys() {
        if !allowed.contains(&key.as_str()) {
            return Err(refuse(format!(
                "runner config ({label}.{id}) contains unknown key \"{key}\" for type \"{kind}\". Allowed keys: {}.",
                allowed.join(", ")
            )));
        }
    }
    Ok(())
}

/// A string that is present, so it must be non-blank.
fn non_blank_when_present(
    config: &Map<String, Value>,
    key: &str,
    label: &str,
    id: &str,
) -> Result<(), DriverError> {
    match config.get(key) {
        None => Ok(()),
        Some(Value::String(s)) if !s.trim().is_empty() => Ok(()),
        Some(_) => Err(refuse(format!(
            "runner config ({label}.{id}) \"{key}\" must be a non-empty string when present."
        ))),
    }
}

fn non_blank_required(
    config: &Map<String, Value>,
    key: &str,
    label: &str,
    id: &str,
) -> Result<(), DriverError> {
    match config.get(key) {
        Some(Value::String(s)) if !s.trim().is_empty() => Ok(()),
        _ => Err(refuse(format!(
            "runner config ({label}.{id}) \"{key}\" must be a non-empty string."
        ))),
    }
}

/// Validates one backend instance config by its type's closed schema.
pub fn validate_instance_config_shape(
    id: &str,
    config: &Value,
    label: &str,
) -> Result<(), DriverError> {
    let Some(map) = config.as_object() else {
        return Err(refuse(format!(
            "runner config ({label}.{id}) must be an object."
        )));
    };
    let kind = map
        .get("type")
        .and_then(Value::as_str)
        .filter(|kind| ALLOWED_DRIVER_TYPES.contains(kind))
        .ok_or_else(|| {
            refuse(format!(
                "runner config ({label}.{id}) \"type\" must be one of {}, got: {}.",
                ALLOWED_DRIVER_TYPES.join("/"),
                js::json(map.get("type"))
            ))
        })?;
    if map
        .get("enabled")
        .is_some_and(|enabled| !enabled.is_boolean())
    {
        return Err(refuse(format!(
            "runner config ({label}.{id}) \"enabled\" must be a boolean when present."
        )));
    }
    match kind {
        "bwrap" => {
            allowed_keys_check(
                map,
                &[
                    "type",
                    "enabled",
                    "executable",
                    "tempRoot",
                    "privateHomeRoot",
                ],
                label,
                id,
                kind,
            )?;
            for key in ["executable", "tempRoot", "privateHomeRoot"] {
                non_blank_when_present(map, key, label, id)?;
            }
        }
        "container" => {
            allowed_keys_check(
                map,
                &["type", "enabled", "runtime", "image", "pullPolicy"],
                label,
                id,
                kind,
            )?;
            if !matches!(
                map.get("runtime").and_then(Value::as_str),
                Some("docker" | "podman")
            ) {
                return Err(refuse(format!(
                    "runner config ({label}.{id}) \"runtime\" must be \"docker\" or \"podman\", got: {}.",
                    js::json(map.get("runtime"))
                )));
            }
            non_blank_required(map, "image", label, id)?;
            if let Some(pull) = map.get("pullPolicy") {
                if !matches!(pull.as_str(), Some("never" | "if-missing" | "always")) {
                    return Err(refuse(format!(
                        "runner config ({label}.{id}) \"pullPolicy\" must be one of never/if-missing/always, got: {}.",
                        pull
                    )));
                }
            }
        }
        _ => {
            allowed_keys_check(
                map,
                &["type", "enabled", "endpoint", "credentialRef"],
                label,
                id,
                kind,
            )?;
            non_blank_required(map, "endpoint", label, id)?;
            non_blank_required(map, "credentialRef", label, id)?;
        }
    }
    Ok(())
}

/// Validates a whole registry document.
pub fn validate_registry_shape(doc: &Value, label: &str) -> Result<(), DriverError> {
    let Some(map) = doc.as_object() else {
        return Err(refuse(format!(
            "runner config ({label}) must be an object."
        )));
    };
    if let Some(key) = map
        .keys()
        .find(|key| !["contract", "confinementBackends"].contains(&key.as_str()))
    {
        return Err(refuse(format!(
            "runner config ({label}) contains unknown key \"{key}\". Allowed keys: contract, confinementBackends."
        )));
    }
    if map.get("contract").and_then(Value::as_str) != Some(REGISTRY_CONTRACT) {
        return Err(refuse(format!(
            "runner config ({label}) \"contract\" must be \"{REGISTRY_CONTRACT}\", got: {}.",
            js::json(map.get("contract"))
        )));
    }
    let Some(backends) = map.get("confinementBackends").and_then(Value::as_object) else {
        return Err(refuse(format!(
            "runner config ({label}) \"confinementBackends\" must be an object mapping instanceId to backend config."
        )));
    };
    for (id, config) in backends {
        if id.trim().is_empty() {
            return Err(refuse(format!(
                "runner config ({label}) backend instance key must be a non-empty string."
            )));
        }
        validate_instance_config_shape(id, config, &format!("{label}.confinementBackends"))?;
    }
    Ok(())
}

/// Refuses a project config that defines or overrides the machine's backend instances.
pub fn reject_project_backend_override(project: &Value, label: &str) -> Result<(), DriverError> {
    if js::at(project, &["confinementBackends"]).is_some()
        || js::at(project, &["runner", "confinementBackends"]).is_some()
    {
        return Err(refuse(format!(
            "runner config ({label}) cannot define or override \"confinementBackends\" — machine backend instance deployment config is managed at the machine level (confinement-backend-registry-forbidden)."
        )));
    }
    Ok(())
}

/// Where the machine registry lives: the override variable, else `<global fgOS dir>/confinement-backends.json`.
pub fn registry_path(env: &dyn Fn(&str) -> Option<String>) -> Result<PathBuf, DriverError> {
    if let Some(path) = env(REGISTRY_PATH_ENV).filter(|path| !path.is_empty()) {
        return Ok(PathBuf::from(path));
    }
    fgos_config::machine::global_dir(env)
        .map(|dir| dir.join(REGISTRY_FILE))
        .ok_or_else(|| refuse(fgos_config::machine::home_unset_message()))
}

/// Reads and validates the machine registry; a missing file is the empty registry.
pub fn load_machine_registry(path: &Path) -> Result<Value, DriverError> {
    if !path.exists() {
        return Ok(json!({ "contract": REGISTRY_CONTRACT, "confinementBackends": {} }));
    }
    let raw = std::fs::read_to_string(path).map_err(|err| {
        refuse(format!(
            "cannot read machine backend registry at \"{}\": {err}",
            path.display()
        ))
    })?;
    let parsed: Value = serde_json::from_str(&raw).map_err(|err| {
        refuse(format!(
            "machine backend registry at \"{}\" is not valid JSON: {err}",
            path.display()
        ))
    })?;
    validate_registry_shape(&parsed, &path.to_string_lossy())?;
    Ok(parsed)
}

/// One enabled instance a dispatch resolved.
#[derive(Debug, Clone, PartialEq)]
pub struct ResolvedBackend {
    pub id: String,
    pub kind: String,
    pub config: Value,
}

/// An immutable copy of a validated registry, taken once per dispatch.
#[derive(Debug, Clone, PartialEq)]
pub struct RegistrySnapshot {
    doc: Value,
}

impl RegistrySnapshot {
    pub fn new(doc: &Value) -> Result<Self, DriverError> {
        validate_registry_shape(doc, "machine confinement backend registry")?;
        Ok(Self { doc: doc.clone() })
    }

    pub fn doc(&self) -> &Value {
        &self.doc
    }

    /// The enabled instance named `id`; `None` for a blank, unknown or disabled one.
    pub fn resolve(&self, id: &Value) -> Option<ResolvedBackend> {
        let id = id.as_str().filter(|id| !id.trim().is_empty())?;
        let config = js::at(&self.doc, &["confinementBackends", id])?;
        if config.get("enabled") == Some(&Value::Bool(false)) {
            return None;
        }
        Some(ResolvedBackend {
            id: id.to_string(),
            kind: js::str_at(config, &["type"])?.to_string(),
            config: config.clone(),
        })
    }
}

/// What bootstrapping the registry did.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Bootstrap {
    pub created: bool,
    pub changed: bool,
    pub path: PathBuf,
    pub message: String,
}

fn pretty(value: &Value) -> Vec<u8> {
    let mut text = serde_json::to_string_pretty(value).expect("a JSON value serialises");
    text.push('\n');
    text.into_bytes()
}

fn write_registry(path: &Path, value: &Value) -> std::io::Result<()> {
    let dir = path
        .parent()
        .filter(|dir| !dir.as_os_str().is_empty())
        .unwrap_or(Path::new("."));
    std::fs::create_dir_all(dir)?;
    let name = path
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| std::io::Error::other("registry path has no file name"))?;
    replace_durably(dir, name, &pretty(value))
        .map(|_| ())
        .map_err(|err| std::io::Error::other(err.to_string()))
}

/// Adds the default bwrap instance to a registry that declares none, without overwriting a custom one.
pub fn ensure_machine_registry_defaults(path: &Path) -> Result<Bootstrap, DriverError> {
    let skipped = |message: String| Bootstrap {
        created: false,
        changed: false,
        path: path.to_path_buf(),
        message,
    };
    let io = |err: std::io::Error| {
        refuse(format!(
            "cannot write machine backend registry at \"{}\": {err}",
            path.display()
        ))
    };
    if !path.exists() {
        let default = default_machine_registry();
        validate_registry_shape(&default, &path.to_string_lossy())?;
        write_registry(path, &default).map_err(io)?;
        return Ok(Bootstrap {
            created: true,
            changed: true,
            path: path.to_path_buf(),
            message: format!(
                "bootstrapped machine backend registry at {} with default bwrap instance",
                path.display()
            ),
        });
    }
    let existing: Value = match std::fs::read_to_string(path)
        .map_err(|err| err.to_string())
        .and_then(|raw| serde_json::from_str(&raw).map_err(|err| err.to_string()))
    {
        Ok(value) => value,
        Err(err) => {
            return Ok(skipped(format!(
                "skipped -- cannot parse machine backend registry at \"{}\": {err}",
                path.display()
            )))
        }
    };
    let existing_backends = existing
        .get("confinementBackends")
        .and_then(Value::as_object)
        .cloned()
        .unwrap_or_default();
    let mut merged = existing_backends.clone();
    let mut changed = false;
    // An operator who declared only custom instances gets no default bwrap injected.
    if existing_backends.is_empty() {
        if let Some(defaults) = default_machine_registry()["confinementBackends"].as_object() {
            for (key, config) in defaults {
                if !merged.contains_key(key) {
                    merged.insert(key.clone(), config.clone());
                    changed = true;
                }
            }
        }
    }
    if existing.get("contract").and_then(Value::as_str) != Some(REGISTRY_CONTRACT)
        || existing.as_object().is_some_and(|map| {
            map.keys()
                .any(|key| !["contract", "confinementBackends"].contains(&key.as_str()))
        })
    {
        changed = true;
    }
    let updated =
        json!({ "contract": REGISTRY_CONTRACT, "confinementBackends": Value::Object(merged) });
    if let Err(err) = validate_registry_shape(&updated, &path.to_string_lossy()) {
        return Ok(skipped(format!(
            "skipped -- cannot repair machine backend registry at \"{}\": {}",
            path.display(),
            err.message
        )));
    }
    if changed {
        write_registry(path, &updated).map_err(io)?;
        return Ok(Bootstrap {
            created: false,
            changed: true,
            path: path.to_path_buf(),
            message: format!(
                "added missing default backend instances to {}",
                path.display()
            ),
        });
    }
    Ok(skipped(format!(
        "machine backend registry at {} is already up to date",
        path.display()
    )))
}
