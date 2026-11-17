//! What an executor entry of `runner.executors` means and the facts derived from it. Semantics are those of
//! `docs/platform/runner/contracts/executor-model.md`, which records today's behaviour; the vectors of
//! `packages/execution/contracts/executor-model.v1.json` prove them. The runner section is read as the JSON the
//! config door hands over, so a field means what the schema says it means and nothing is guessed.

use crate::ports::Machine;
use serde::Serialize;
use serde_json::{json, Map, Value};
use std::fmt;

// ---- reading the JSON ----------------------------------------------------------------------------------

/// A JSON null to borrow where a reading finds nothing.
pub(crate) static NULL: Value = Value::Null;

/// A key that is present and not null (the reading of `??`).
pub(crate) fn present<'a>(value: &'a Value, key: &str) -> Option<&'a Value> {
    value.get(key).filter(|found| !found.is_null())
}

/// A string-valued key.
pub(crate) fn str_of<'a>(value: &'a Value, key: &str) -> Option<&'a str> {
    value.get(key).and_then(Value::as_str)
}

/// A string-valued key that is not empty (the reading of `||` and a truthiness test).
pub(crate) fn truthy_str<'a>(value: &'a Value, key: &str) -> Option<&'a str> {
    str_of(value, key).filter(|text| !text.is_empty())
}

/// An array-valued key; empty when the key is absent or holds anything else.
pub(crate) fn array_of<'a>(value: &'a Value, key: &str) -> &'a [Value] {
    value
        .get(key)
        .and_then(Value::as_array)
        .map_or(&[], Vec::as_slice)
}

/// The executors of a runner section (the caller unwraps a config that nests it as `runner`).
pub(crate) fn executors_of(runner: &Value) -> Option<&Map<String, Value>> {
    present(runner, "executors").and_then(Value::as_object)
}

/// The command of the legacy default executor.
fn default_command_of(runner: &Value) -> Option<&str> {
    runner
        .get("executor")
        .and_then(|default| str_of(default, "command"))
}

/// A path separator: `/`, and `\` too on Windows (Node's `path.basename` follows the platform).
fn is_separator(c: char) -> bool {
    c == '/' || (cfg!(windows) && c == '\\')
}

/// The program name of a command, as Node's `path.basename`.
pub(crate) fn basename(command: &str) -> &str {
    command
        .trim_end_matches(is_separator)
        .rsplit(is_separator)
        .next()
        .unwrap_or_default()
}

/// The command an invocation runs: its own, else the executor's, else the runner's default executor.
pub(crate) fn command_of<'a>(
    runner: &'a Value,
    entry: &'a Value,
    invocation: &'a Value,
) -> Option<&'a str> {
    present(invocation, "command")
        .or_else(|| present(entry, "command"))
        .and_then(Value::as_str)
        .or_else(|| default_command_of(runner))
}

fn first_cli_invocation(entry: &Value) -> Option<&Value> {
    array_of(entry, "invocations")
        .iter()
        .find(|inv| str_of(inv, "via") == Some("cli"))
}

// ---- the refusal -----------------------------------------------------------------------------------------

/// A refusal a derivation gives: the error class it carries today, an optional stable code, and its text.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ModelError {
    pub name: &'static str,
    pub code: Option<&'static str>,
    pub message: String,
}

impl ModelError {
    pub(crate) fn runner(message: String) -> Self {
        ModelError {
            name: "RunnerConfigError",
            code: None,
            message,
        }
    }

    pub(crate) fn coded(code: &'static str, message: String) -> Self {
        ModelError {
            name: "RunnerConfigError",
            code: Some(code),
            message,
        }
    }

    /// An error of another class than the runner config's (the class Node throws it under).
    pub(crate) fn of_class(
        name: &'static str,
        code: Option<&'static str>,
        message: String,
    ) -> Self {
        ModelError {
            name,
            code,
            message,
        }
    }

    pub(crate) fn provider_capacity(message: String) -> Self {
        ModelError {
            name: "ProviderCapacityConfigError",
            code: None,
            message,
        }
    }

    pub(crate) fn confinement_policy(message: String) -> Self {
        ModelError {
            name: "ConfinementPolicyError",
            code: None,
            message,
        }
    }

    pub(crate) fn confinement_backend_registry(message: String) -> Self {
        ModelError {
            name: "ConfinementBackendRegistryError",
            code: None,
            message,
        }
    }

    /// The refusal as the vectors state it: `{ name, code?, message }`.
    pub fn to_json(&self) -> Value {
        let mut out = Map::new();
        out.insert("name".into(), json!(self.name));
        if let Some(code) = self.code {
            out.insert("code".into(), json!(code));
        }
        out.insert("message".into(), json!(self.message));
        Value::Object(out)
    }
}

impl fmt::Display for ModelError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.message)
    }
}

impl std::error::Error for ModelError {}

// ---- the default executor --------------------------------------------------------------------------------

/// Layers the legacy default `runner.executor` (`{ command, args }`) onto the executor registry. The default
/// fills `claude` and the entry named by its command. When it runs the same program as an entry (its command's
/// basename equals the executor id) that entry keeps its invocations, supports and the rest, and only the
/// default's keys replace its own; for another program the default replaces the entry. `decide` applies this to
/// the config it reads; `explain` does not.
pub fn with_default_executor(runner: &Value) -> Value {
    let mut config = runner.clone();
    let (Some(default), Some(section)) = (
        present(runner, "executor").filter(|d| d.is_object()),
        config.as_object_mut(),
    ) else {
        return config;
    };
    let mut executors = runner
        .get("executors")
        .and_then(Value::as_object)
        .cloned()
        .unwrap_or_default();
    let command = truthy_str(default, "command");
    let program = command.map(basename);
    let mut ids = vec!["claude"];
    if let Some(command) = command.filter(|command| *command != "claude") {
        ids.push(command);
    }
    for id in ids {
        let mut entry = Map::new();
        if program == Some(id) {
            entry = executors
                .get(id)
                .and_then(Value::as_object)
                .cloned()
                .unwrap_or_default();
        }
        entry.extend(
            default
                .as_object()
                .into_iter()
                .flatten()
                .map(|(key, value)| (key.clone(), value.clone())),
        );
        executors.insert(id.to_string(), Value::Object(entry));
    }
    section.insert("executor".into(), default.clone());
    section.insert("executors".into(), Value::Object(executors));
    config
}

// ---- the family ------------------------------------------------------------------------------------------

/// What names a family: an executor entry (its `providerModel`, else `provider`), or a spelling.
#[derive(Debug, Clone, Copy)]
pub enum FamilySource<'a> {
    None,
    Spelling(&'a str),
    Entry(&'a Value),
}

impl<'a> FamilySource<'a> {
    /// The source a JSON value is: an object is an entry, a string a spelling, null nothing; any other value is a
    /// spelling that names no family.
    pub fn from_json(value: Option<&'a Value>) -> Self {
        match value {
            None | Some(Value::Null) => FamilySource::None,
            Some(Value::String(text)) => FamilySource::Spelling(text),
            Some(entry @ (Value::Object(_) | Value::Array(_))) => FamilySource::Entry(entry),
            Some(_) => FamilySource::Spelling(""),
        }
    }
}

/// The provider family: the key of `modelPolicies`, `tierFallback`, pools and the deny list. A declared vendor
/// wins over the CLI harness that runs it; with no source the family is inferred from `command`, and an entry
/// that names nothing is `claude`. `openai-codex` and `codex` are `openai`, `glm` is `z-ai`, `agy` is `gemini`;
/// any other value is itself, trimmed and lower-cased. A command given as a path is not reduced to its program
/// (a kept difference, see the contract's section 11).
pub fn family_of(source: FamilySource<'_>, command: Option<&str>) -> String {
    let normalize = |text: Option<&str>| text.map(|t| t.trim().to_lowercase()).unwrap_or_default();
    let (declared, is_entry) = match source {
        FamilySource::None => (String::new(), false),
        FamilySource::Spelling(text) => (normalize(Some(text)), false),
        FamilySource::Entry(entry) => {
            let named = [str_of(entry, "providerModel"), str_of(entry, "provider")]
                .into_iter()
                .flatten()
                .find(|t| !t.is_empty());
            (normalize(named), true)
        }
    };
    let key = [declared, normalize(command)]
        .into_iter()
        .find(|text| !text.is_empty())
        .unwrap_or_else(|| {
            if is_entry {
                "claude".to_string()
            } else {
                String::new()
            }
        });
    match key.as_str() {
        "openai-codex" | "codex" => "openai".to_string(),
        "glm" => "z-ai".to_string(),
        "agy" => "gemini".to_string(),
        _ => key,
    }
}

/// The family of an executor id as the bind reads it: the entry's own, else inferred from the command of its
/// first `cli` invocation, else its own command, else the default executor's (an entry whose only program name
/// is an `adapter` takes `claude`).
pub(crate) fn executor_family(runner: &Value, id: &str) -> String {
    let entry = executors_of(runner).and_then(|executors| executors.get(id));
    let Some(entry) = entry else {
        return family_of(FamilySource::None, default_command_of(runner));
    };
    let cli = first_cli_invocation(entry);
    let own_command = cli
        .and_then(|inv| truthy_str(inv, "command").or_else(|| truthy_str(inv, "adapter")))
        .or_else(|| truthy_str(entry, "command"))
        .or_else(|| truthy_str(entry, "adapter"));
    let command = cli
        .and_then(|inv| str_of(inv, "command"))
        .or_else(|| str_of(entry, "command"))
        .or_else(|| {
            if own_command.is_some() {
                None
            } else {
                default_command_of(runner)
            }
        });
    family_of(FamilySource::Entry(entry), command)
}

/// Whether the legacy default executor answers to `id`: by its own command, or by the command or id of its
/// first invocation.
fn names_default_executor(default: &Value, id: &str) -> bool {
    let first = array_of(default, "invocations").first();
    str_of(default, "command") == Some(id)
        || first
            .is_some_and(|inv| str_of(inv, "command") == Some(id) || str_of(inv, "id") == Some(id))
}

// ---- lookup ----------------------------------------------------------------------------------------------

/// The answer of [`lookup_executor`]: a state, never an error.
#[derive(Debug, Clone)]
pub struct Lookup<'a> {
    pub executor_id: Option<String>,
    pub executor: Option<&'a Value>,
    pub configured: bool,
    pub binding_source: Option<&'static str>,
}

/// A literal registry key is that entry; otherwise the default executor answers to no id, to `executor`, to its
/// own command and to its first invocation's command or id; anything else is not configured. It looks a name up
/// and chooses nothing.
pub fn lookup_executor<'a>(runner: &'a Value, executor_id: Option<&str>) -> Lookup<'a> {
    let registered = executor_id
        .and_then(|id| runner.get("executors")?.as_object()?.get(id))
        .filter(|entry| !entry.is_null());
    if let Some(entry) = registered {
        return Lookup {
            executor_id: executor_id.map(str::to_string),
            executor: Some(entry),
            configured: true,
            binding_source: Some("executor-id"),
        };
    }
    let default = present(runner, "executor");
    if let Some(default) = default {
        if executor_id.is_none_or(str::is_empty) {
            let command = str_of(default, "command").unwrap_or("executor");
            return Lookup {
                executor_id: Some(command.to_string()),
                executor: Some(default),
                configured: true,
                binding_source: Some("default"),
            };
        }
        let id = executor_id.unwrap_or_default();
        if id == "executor" || names_default_executor(default, id) {
            return Lookup {
                executor_id: Some(id.to_string()),
                executor: Some(default),
                configured: true,
                binding_source: Some("default"),
            };
        }
    }
    Lookup {
        executor_id: None,
        executor: None,
        configured: false,
        binding_source: None,
    }
}

// ---- governance ------------------------------------------------------------------------------------------

/// `governance.disallowedProviders` and `governance.disallowedExecutors`.
#[derive(Debug, Clone, Default)]
pub struct Governance {
    pub disallowed_providers: Vec<String>,
    pub disallowed_executors: Vec<String>,
}

impl Governance {
    /// The deny lists a runner section declares (none when it declares none).
    pub fn of(runner: &Value) -> Self {
        let list = |key: &str| -> Vec<String> {
            runner
                .get("governance")
                .map(|governance| array_of(governance, key))
                .unwrap_or_default()
                .iter()
                .filter_map(|entry| entry.as_str().map(str::to_string))
                .collect()
        };
        Governance {
            disallowed_providers: list("disallowedProviders"),
            disallowed_executors: list("disallowedExecutors"),
        }
    }
}

/// Whether a provider is on the deny list, both compared in the one family vocabulary, and the family the
/// candidate canonically is. Empty and blank deny entries are skipped.
pub fn check_provider_disallowed(
    disallowed: &[String],
    candidate: &str,
    command: Option<&str>,
) -> (bool, String) {
    let canonical = family_of(FamilySource::Spelling(candidate), command);
    if canonical.is_empty() {
        return (false, canonical);
    }
    let denied = disallowed
        .iter()
        .filter(|entry| !entry.trim().is_empty())
        .any(|entry| family_of(FamilySource::Spelling(entry), None) == canonical);
    (denied, canonical)
}

/// The registered entry an executor id names and its family.
#[derive(Debug, Clone)]
pub struct ResolvedProvider {
    pub family: String,
    pub registered: bool,
}

/// The registered entry of `primary` and its family. An unregistered id that is not the implicit default
/// executor is refused; a deny list with no registry cannot be verified and is refused.
pub fn resolve_executor_provider(
    runner: &Value,
    primary: &str,
    governance: &Governance,
) -> Result<ResolvedProvider, ModelError> {
    let registry = runner.get("executors").and_then(Value::as_object);
    if (!governance.disallowed_providers.is_empty() || !governance.disallowed_executors.is_empty())
        && registry.is_none()
    {
        return Err(ModelError::runner(format!(
            "governance requires \"disallowedProviders\"/\"disallowedExecutors\" but runnerConfig.executors is absent -- provider family cannot be verified for executor \"{primary}\""
        )));
    }
    let entry = registry
        .and_then(|executors| executors.get(primary))
        .filter(|entry| !entry.is_null());
    let implicit_default = primary == "claude"
        || runner
            .get("executor")
            .is_some_and(|default| names_default_executor(default, primary));
    if registry.is_some() && entry.is_none() && !implicit_default {
        return Err(ModelError::runner(format!(
            "preferExecutor \"{primary}\" is not a registered executor (runnerConfig.executors has no such entry)."
        )));
    }
    let family = match entry {
        Some(entry) => family_of(
            FamilySource::Entry(entry),
            first_cli_invocation(entry).and_then(|inv| str_of(inv, "command")),
        ),
        None if implicit_default => family_of(FamilySource::Entry(&NULL), Some(primary)),
        None => primary.to_string(),
    };
    Ok(ResolvedProvider {
        family,
        registered: entry.is_some(),
    })
}

/// Rejects a resolved provider family and executor id against the deny lists, returning the canonical family.
pub fn resolve_executor_governance(
    primary: &str,
    provider_model: &str,
    governance: &Governance,
) -> Result<String, ModelError> {
    let (denied, canonical) =
        check_provider_disallowed(&governance.disallowed_providers, provider_model, None);
    if denied {
        return Err(ModelError::coded(
            "governance.disallowed-provider",
            format!("governance gate rejected provider \"{canonical}\": disallowed egress"),
        ));
    }
    if governance
        .disallowed_executors
        .iter()
        .any(|id| id == primary)
    {
        return Err(ModelError::coded(
            "governance.disallowed-executor",
            format!("governance gate rejected executor \"{primary}\": disallowed"),
        ));
    }
    Ok(canonical)
}

/// Why governance rules an executor out as a launch fact, or `None` when it does not.
fn disallowed_reason(
    governance: &Governance,
    id: &str,
    entry: &Value,
    family: &str,
) -> Option<String> {
    let (denied, canonical) = check_provider_disallowed(
        &governance.disallowed_providers,
        family,
        str_of(entry, "command").or(Some(id)),
    );
    if denied {
        let named = if canonical.is_empty() {
            family
        } else {
            canonical.as_str()
        };
        return Some(format!("provider \"{named}\" is disallowed"));
    }
    governance
        .disallowed_executors
        .iter()
        .any(|denied_id| denied_id == id)
        .then(|| format!("executor \"{id}\" is disallowed"))
}

// ---- capability confinement, login store, efforts --------------------------------------------------------

/// The `confinement` of the capability's exact entry; never its `<prefix>:*` entry.
pub fn capability_confinement<'a>(runner: &'a Value, capability: &str) -> Option<&'a Value> {
    let entry = runner.get("capabilities")?.as_object()?.get(capability)?;
    if entry.is_object() || entry.is_array() {
        entry.get("confinement")
    } else {
        None
    }
}

/// The registered name a capability goes by: its own key (holding an entry: an object or an array), else the first
/// key whose entry lists it in `aliases`; `None` when the catalog registers nothing by that name. The one reader of
/// what the catalog registers: the config check, the purpose door and the run door hint all ask here.
pub fn registered_capability_of<'a>(runner: &'a Value, name: &Value) -> Option<&'a str> {
    let section = runner.get("capabilities")?.as_object()?;
    let is_entry = |value: &Value| value.is_object() || value.is_array();
    if let Some((key, _)) = name
        .as_str()
        .and_then(|key| section.get_key_value(key))
        .filter(|(_, entry)| is_entry(entry))
    {
        return Some(key.as_str());
    }
    section
        .iter()
        .filter(|(_, entry)| is_entry(entry))
        .find(|(_, entry)| {
            entry
                .get("aliases")
                .and_then(Value::as_array)
                .is_some_and(|aliases| aliases.contains(name))
        })
        .map(|(key, _)| key.as_str())
}

/// Whether the exact entry of `name` names at least one executor in `prefer` (a non-blank id, or a non-empty list):
/// only such a purpose is bound by Seat Binding when `decide` is asked for it.
pub fn has_own_prefer_pool(runner: &Value, name: &str) -> bool {
    let entry = runner
        .get("capabilities")
        .and_then(Value::as_object)
        .and_then(|section| section.get(name))
        .filter(|entry| entry.is_object() || entry.is_array());
    match entry.and_then(|entry| entry.get("prefer")) {
        Some(Value::String(id)) => !id.trim().is_empty(),
        Some(Value::Array(list)) => !list.is_empty(),
        _ => false,
    }
}

/// The login store an invocation reads: the `credentialStore` it declares, else none. Nothing is inferred from
/// the command or its environment.
pub fn credential_store_of(invocation: &Value) -> Option<&Value> {
    present(invocation, "credentialStore")
}

/// The canonical effort levels, in the order the schema lists them.
const EFFORT_LEVELS: [&str; 4] = ["low", "medium", "high", "max"];

/// The CLIs fgOS knows how to set an effort on.
const EFFORT_CONTROLLED: [&str; 5] = ["claude", "agy", "pi", "omp", "codex"];

/// The canonical effort levels a command's CLI can be told to run at (read by the command's program name): all
/// of them when fgOS knows the CLI's effort control, none otherwise.
pub fn rendered_effort_levels(command: Option<&str>) -> Vec<&'static str> {
    if EFFORT_CONTROLLED.contains(&basename(command.unwrap_or_default())) {
        EFFORT_LEVELS.to_vec()
    } else {
        Vec::new()
    }
}

// ---- mechanism -------------------------------------------------------------------------------------------

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Mechanism {
    InProcess,
    OutOfProcess,
}

impl Mechanism {
    pub fn as_str(self) -> &'static str {
        match self {
            Mechanism::InProcess => "in-process",
            Mechanism::OutOfProcess => "out-of-process",
        }
    }
}

/// `out-of-process` when the entry is cli-spawn-shaped (it declares `command`, `adapter`, or an invocation with
/// `via: cli`), whatever the session has; otherwise `in-process` only when the entry is an `agent`, does not set
/// `forceCliSpawn`, and the caller declared live task access (never probed). Everything else, an unregistered id
/// and a tool included, is `out-of-process`.
pub fn mechanism(
    runner: &Value,
    executor_id: Option<&str>,
    has_live_task_access: bool,
) -> Mechanism {
    let entry = executor_id
        .filter(|id| !id.is_empty())
        .and_then(|id| lookup_executor(runner, Some(id)).executor);
    let Some(entry) = entry else {
        return Mechanism::OutOfProcess;
    };
    let cli_spawn_shaped = truthy_str(entry, "command").is_some()
        || truthy_str(entry, "adapter").is_some()
        || array_of(entry, "invocations")
            .iter()
            .any(|inv| str_of(inv, "via") == Some("cli"));
    let native = str_of(entry, "kind") == Some("agent");
    let forced = entry.get("forceCliSpawn") == Some(&Value::Bool(true));
    if cli_spawn_shaped || !native || forced || !has_live_task_access {
        Mechanism::OutOfProcess
    } else {
        Mechanism::InProcess
    }
}

// ---- posture ---------------------------------------------------------------------------------------------

/// The executor, and the invocation if one is named, a posture is asked of.
#[derive(Debug, Clone, Copy, Default)]
pub struct Candidate<'a> {
    pub executor: Option<&'a str>,
    pub invocation: Option<&'a str>,
}

/// Whether the candidate can apply a posture on this machine and which invocation carries it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Posture {
    pub ok: bool,
    pub invocation: Option<String>,
}

const NO_POSTURE: Posture = Posture {
    ok: false,
    invocation: None,
};

/// The confinement an invocation runs under: its own, else the executor's.
pub(crate) fn confinement_of<'a>(invocation: &'a Value, entry: &'a Value) -> Option<&'a Value> {
    present(invocation, "confinement").or_else(|| present(entry, "confinement"))
}

/// The invocation that carries a posture and the confinement it runs under; the invocation is `None` when the
/// executor's own confinement carries it with no invocation to name.
fn pick_confined_invocation<'a>(
    entry: &'a Value,
    named: Option<&str>,
    herdr: bool,
) -> Option<(Option<&'a Value>, &'a Value)> {
    let invocations = array_of(entry, "invocations");
    if let Some(id) = named.filter(|id| !id.is_empty()) {
        let found = invocations
            .iter()
            .find(|inv| str_of(inv, "id") == Some(id))?;
        return Some((Some(found), confinement_of(found, entry).unwrap_or(&NULL)));
    }
    // The first plain cli invocation that declares a backend (a herdr-spawn one only on the herdr transport).
    // An invocation without an id cannot be pinned, so it counts only when it is also the one a run takes by
    // default, the first cli invocation.
    let cli: Vec<&Value> = invocations
        .iter()
        .filter(|inv| str_of(inv, "via") == Some("cli"))
        .collect();
    let with_backend = cli.iter().enumerate().find(|(index, inv)| {
        (herdr || str_of(inv, "adapter") != Some("herdr-spawn"))
            && confinement_of(inv, entry)
                .and_then(|c| c.get("backend"))
                .is_some_and(|backend| !backend.is_null() && backend != &json!(""))
            && (truthy_str(inv, "id").is_some() || *index == 0)
    });
    if let Some((_, inv)) = with_backend {
        return confinement_of(inv, entry).map(|confinement| (Some(*inv), confinement));
    }
    present(entry, "confinement").map(|confinement| (None, confinement))
}

/// Decides whether a candidate can really apply a read-only posture on this machine and which invocation carries
/// it: the invocation approved here is the one that runs. A pure native agent carries it in the lead session.
/// Otherwise the invocation must resolve to a confinement backend that the machine registry lists, enabled, of
/// type `bwrap`, whose executable is on PATH. A named invocation is kept as named or refused.
pub fn resolve_posture_invocation(
    runner: &Value,
    candidate: &Candidate<'_>,
    machine: &dyn Machine,
) -> Posture {
    let Some(entry) = candidate
        .executor
        .and_then(|id| executors_of(runner)?.get(id))
        .filter(|entry| !entry.is_null())
    else {
        return NO_POSTURE;
    };
    let named = candidate.invocation.map(str::to_string);
    if truthy_str(entry, "agentType").is_some()
        && truthy_str(entry, "command").is_none()
        && truthy_str(entry, "adapter").is_none()
        && present(entry, "invocations").is_none()
    {
        return Posture {
            ok: true,
            invocation: named,
        };
    }
    let Some((picked, confinement)) =
        pick_confined_invocation(entry, candidate.invocation, machine.herdr_present())
    else {
        return NO_POSTURE;
    };
    let Some(backend_id) = truthy_str(confinement, "backend") else {
        return NO_POSTURE;
    };
    let Some(backend) = machine.posture_backend(backend_id) else {
        return NO_POSTURE;
    };
    if !backend.enabled
        || backend.kind != "bwrap"
        || !machine.on_path(backend.executable.as_deref().unwrap_or("bwrap"))
    {
        return NO_POSTURE;
    }
    let invocation = named.or_else(|| {
        picked
            .and_then(|inv| truthy_str(inv, "id"))
            .map(str::to_string)
    });
    Posture {
        ok: true,
        invocation,
    }
}

// ---- missing programs ------------------------------------------------------------------------------------

/// The facts of the session a derivation reads besides the machine.
#[derive(Debug, Clone, Copy, Default)]
pub struct Session {
    /// The session has a native agent (live task access).
    pub has_native_agent: bool,
    /// The caller binds only to learn who and which model: posture is judged when the assignment launches.
    pub posture_at_launch: bool,
}

/// The programs an executor starts, as bare names, when none of them is installed here; `None` when one is, when
/// the executor starts no program of its own (a native agent, a tool), or when it is in-process.
pub(crate) fn missing_clis(
    runner: &Value,
    id: &str,
    entry: &Value,
    session: &Session,
    machine: &dyn Machine,
) -> Option<Vec<String>> {
    if str_of(entry, "kind") == Some("tool")
        || mechanism(runner, Some(id), session.has_native_agent) != Mechanism::OutOfProcess
    {
        return None;
    }
    let none = [Value::Object(Map::new())];
    let declared = array_of(entry, "invocations");
    let invocations = if declared.is_empty() {
        &none[..]
    } else {
        declared
    };
    let mut commands: Vec<&str> = Vec::new();
    for command in invocations
        .iter()
        .filter_map(|inv| command_of(runner, entry, inv))
        .filter(|command| !command.is_empty())
    {
        if !commands.contains(&command) {
            commands.push(command);
        }
    }
    if commands.is_empty() || commands.iter().any(|command| machine.on_path(command)) {
        return None;
    }
    let mut names: Vec<String> = Vec::new();
    for command in commands {
        let name = basename(command).to_string();
        if !names.contains(&name) {
            names.push(name);
        }
    }
    Some(names)
}

/// The refusal for a machine on which no agent executor can start.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct AgentCliMissing {
    pub reason: &'static str,
    pub detail: String,
    pub fix: String,
}

/// The refusal when every agent executor of the config runs programs and none of them is installed, naming the
/// programs looked for and what to do; `None` when one can start.
pub fn agent_cli_missing_refusal(
    runner: &Value,
    session: &Session,
    machine: &dyn Machine,
) -> Option<AgentCliMissing> {
    let mut clis: Vec<String> = Vec::new();
    let mut any = false;
    for (id, entry) in executors_of(runner)
        .into_iter()
        .flatten()
        .filter(|(_, e)| e.is_object() && str_of(e, "kind") != Some("tool"))
    {
        any = true;
        for name in missing_clis(runner, id, entry, session, machine)? {
            if !clis.contains(&name) {
                clis.push(name);
            }
        }
    }
    if !any {
        return None;
    }
    clis.sort();
    let list = clis.join(", ");
    Some(AgentCliMissing {
        reason: "agent-cli-missing",
        detail: format!("no agent CLI is installed on this machine (looked for {list} on PATH)"),
        fix: format!("install one of {list}, then run \"fgos doctor\" to check it"),
    })
}

// ---- launch facts ----------------------------------------------------------------------------------------

/// What the bind may know of one invocation.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InvocationFacts {
    pub id: String,
    /// The CLI of the invocation's login store.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cli: Option<String>,
    /// The effort levels the invocation can render, narrowed by the executor's `supports.reasoningEffort`.
    pub efforts: Vec<String>,
    pub carries_posture: bool,
}

fn is_false(flag: &bool) -> bool {
    !*flag
}

/// What the bind may know of one executor.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LaunchFacts {
    pub kind: &'static str,
    pub family: String,
    pub mechanism: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub disallowed: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub missing_cli: Option<String>,
    pub skills: Vec<Value>,
    pub invocations: Vec<InvocationFacts>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_invocation: Option<String>,
    /// The posture is carried with no invocation to name.
    #[serde(skip_serializing_if = "is_false")]
    pub unnamed_carries: bool,
}

/// Whether an invocation is a generic form: its id is `<cli>-<cli|herdr>[-bwrap]`, where `<cli>` is the program it
/// runs, the transport is `herdr` for a herdr-spawn invocation, and `-bwrap` is there exactly when bwrap confines it.
/// Any other id is a named form, there for a pin.
fn is_generic_form(runner: &Value, entry: &Value, invocation: &Value) -> bool {
    let (Some(id), Some(command)) = (
        truthy_str(invocation, "id"),
        command_of(runner, entry, invocation),
    ) else {
        return false;
    };
    let transport = if str_of(invocation, "adapter") == Some("herdr-spawn") {
        "herdr"
    } else {
        "cli"
    };
    let bwrap =
        confinement_of(invocation, entry).and_then(|c| str_of(c, "backend")) == Some("bwrap");
    id == format!(
        "{}-{transport}{}",
        basename(command),
        if bwrap { "-bwrap" } else { "" }
    )
}

/// The invocation an unpinned seat runs, by one explicit rule over the cli invocations that can carry the posture
/// here (a herdr-spawn one only inside herdr): a generic form before a named one, then the session's transport
/// (herdr inside herdr), then the declared order. A pin never comes here: a pinned invocation is kept or refused.
fn chosen_invocation(
    runner: &Value,
    entry: &Value,
    facts: &[InvocationFacts],
    herdr: bool,
) -> Option<String> {
    array_of(entry, "invocations")
        .iter()
        .enumerate()
        .filter(|(_, inv)| str_of(inv, "via") == Some("cli"))
        .filter_map(|(order, inv)| {
            let id = truthy_str(inv, "id")?;
            let on_herdr = str_of(inv, "adapter") == Some("herdr-spawn");
            if on_herdr && !herdr {
                return None;
            }
            facts
                .iter()
                .any(|fact| fact.id == id && fact.carries_posture)
                .then_some((
                    (
                        !is_generic_form(runner, entry, inv),
                        herdr && !on_herdr,
                        order,
                    ),
                    id,
                ))
        })
        .min_by_key(|(rank, _)| *rank)
        .map(|(_, id)| id.to_string())
}

fn executor_facts(
    runner: &Value,
    governance: &Governance,
    id: &str,
    entry: &Value,
    session: &Session,
    machine: &dyn Machine,
) -> LaunchFacts {
    let family = executor_family(runner, id);
    let mechanism = mechanism(runner, Some(id), session.has_native_agent);
    let supported: Option<Vec<&str>> = entry
        .get("supports")
        .and_then(|supports| supports.get("reasoningEffort"))
        .and_then(Value::as_array)
        .map(|levels| levels.iter().filter_map(Value::as_str).collect());
    let herdr = machine.herdr_present();
    let render = |command: Option<&str>| -> Vec<String> {
        rendered_effort_levels(command)
            .into_iter()
            .filter(|level| supported.as_ref().is_none_or(|list| list.contains(level)))
            .map(str::to_string)
            .collect()
    };
    let at_launch = session.posture_at_launch;
    let mut invocations: Vec<InvocationFacts> = array_of(entry, "invocations")
        .iter()
        .filter_map(|inv| {
            let named = truthy_str(inv, "id")?;
            Some(InvocationFacts {
                id: named.to_string(),
                cli: credential_store_of(inv)
                    .and_then(|store| truthy_str(store, "use"))
                    .map(str::to_string),
                efforts: render(command_of(runner, entry, inv)),
                carries_posture: at_launch
                    || resolve_posture_invocation(
                        runner,
                        &Candidate {
                            executor: Some(id),
                            invocation: Some(named),
                        },
                        machine,
                    )
                    .ok,
            })
        })
        .collect();
    let mut approved = resolve_posture_invocation(
        runner,
        &Candidate {
            executor: Some(id),
            invocation: None,
        },
        machine,
    );
    if !approved.ok && at_launch {
        approved = Posture {
            ok: true,
            invocation: invocations.first().map(|inv| inv.id.clone()),
        };
    }
    let mut default_invocation =
        approved
            .invocation
            .as_ref()
            .filter(|_| approved.ok)
            .map(|approved_id| {
                chosen_invocation(runner, entry, &invocations, herdr)
                    .unwrap_or_else(|| approved_id.clone())
            });
    // An executor that declares no invocation runs its own command: for a caller that does not launch this
    // binding, that command is the one invocation whose effort levels are judged.
    if at_launch && invocations.is_empty() {
        invocations.push(InvocationFacts {
            id: "command".into(),
            cli: None,
            efforts: render(command_of(runner, entry, &NULL)),
            carries_posture: true,
        });
        default_invocation = Some("command".into());
    }
    LaunchFacts {
        kind: if str_of(entry, "kind") == Some("tool") {
            "tool"
        } else {
            "agent"
        },
        family: family.clone(),
        mechanism: mechanism.as_str(),
        disallowed: disallowed_reason(governance, id, entry, &family),
        missing_cli: missing_clis(runner, id, entry, session, machine)
            .map(|names| names.join(" or "))
            .filter(|text| !text.is_empty()),
        skills: entry
            .get("supports")
            .map(|supports| array_of(supports, "skills").to_vec())
            .unwrap_or_default(),
        invocations,
        default_invocation,
        unnamed_carries: approved.ok && approved.invocation.is_none(),
    }
}

/// The launch facts of every executor of the config, in the registry's order: its family, mechanism and skills,
/// the invocations with the CLI each reads a login from and the effort levels it renders, which of them can
/// carry the posture here, and the invocation the transport takes when nothing pins one (the herdr-spawn one
/// when the session runs inside herdr and it can carry the posture, else the first plain one that can).
pub fn launch_facts(
    runner: &Value,
    session: &Session,
    machine: &dyn Machine,
) -> Vec<(String, LaunchFacts)> {
    let governance = Governance::of(runner);
    executors_of(runner)
        .into_iter()
        .flatten()
        .filter(|(_, entry)| entry.is_object())
        .map(|(id, entry)| {
            (
                id.clone(),
                executor_facts(runner, &governance, id, entry, session, machine),
            )
        })
        .collect()
}

// ---- tools ----------------------------------------------------------------------------------------------

/// A tool executor that serves a capability, with what its entry says of how to reach it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ToolEntry {
    pub executor_id: String,
    pub capability: String,
    /// The tool an `mcp` invocation names for the capability.
    pub mcp_tool: Option<String>,
    /// The command of the entry's first `cli` invocation.
    pub command: Option<String>,
}

/// A capability label folded to kebab-case: `Impact Analysis`, `impact_analysis` and `impact-analysis` are one name.
fn normalize_capability(raw: &str) -> String {
    let mut out = String::new();
    let mut gap = false;
    for ch in raw.trim().to_lowercase().chars() {
        if ch.is_ascii_lowercase() || ch.is_ascii_digit() {
            if gap && !out.is_empty() {
                out.push('-');
            }
            gap = false;
            out.push(ch);
        } else {
            gap = true;
        }
    }
    out
}

/// Every tool executor that serves `capability` (every `for` entry counts, compared folded), in the registry's
/// order, once per capability it serves. Without a capability, every tool once per capability it serves. An
/// agent executor serves nothing whatever its `for` says. Whether each tool is present now is a probe, not an
/// entry fact, and is read elsewhere.
pub fn tool_for_entries(runner: &Value, capability: Option<&str>) -> Vec<ToolEntry> {
    let wanted = capability.map(normalize_capability);
    if wanted.as_deref() == Some("") {
        return Vec::new();
    }
    let mut out = Vec::new();
    for (executor_id, executor) in runner
        .get("executors")
        .and_then(Value::as_object)
        .into_iter()
        .flatten()
    {
        if str_of(executor, "kind") != Some("tool") {
            continue;
        }
        let mut served: Vec<String> = Vec::new();
        for name in array_of(executor, "for")
            .iter()
            .filter_map(Value::as_str)
            .map(normalize_capability)
            .filter(|name| !name.is_empty())
        {
            if !served.contains(&name) {
                served.push(name);
            }
        }
        let command = first_cli_invocation(executor)
            .and_then(|inv| truthy_str(inv, "command"))
            .map(str::to_string);
        let mcp_tools = array_of(executor, "invocations")
            .iter()
            .find(|inv| str_of(inv, "via") == Some("mcp"))
            .and_then(|inv| inv.get("tools"))
            .and_then(Value::as_object);
        for name in served
            .into_iter()
            .filter(|name| wanted.as_ref().is_none_or(|wanted| wanted == name))
        {
            let mcp_tool = mcp_tools
                .and_then(|tools| {
                    tools
                        .iter()
                        .find(|(key, _)| normalize_capability(key) == name)
                })
                .and_then(|(_, tool)| tool.as_str())
                .filter(|tool| !tool.is_empty())
                .map(str::to_string);
            out.push(ToolEntry {
                executor_id: executor_id.clone(),
                capability: name,
                mcp_tool,
                command: command.clone(),
            });
        }
    }
    out
}
