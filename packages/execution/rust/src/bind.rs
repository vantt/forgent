//! The bind: one seat, one answer. It collects what Seat Binding must not read itself (the ask, the launch view, the
//! account view), asks the `fgos-seat-binding` crate, and turns its answer into the binding with the provenance of
//! every part. Every decision (tier, ranking, independence, pins, effort, continuity, the walk) is the crate's; this
//! module never ranks or filters. It is pure: the runner section, the account state and `now` arrive as data and the
//! machine facts through [`Machine`]. The answers are those of `packages/execution/contracts/bind.v1.json`.

use crate::accounts::account_view;
use crate::executor_model::{
    agent_cli_missing_refusal, array_of, executor_family, executors_of, family_of, launch_facts,
    missing_clis, present, str_of, AgentCliMissing, FamilySource, ModelError, Session,
};
use crate::ports::Machine;
use fgos_seat_binding::{BindInput, Tier, PROTOCOL};
use serde::Serialize;
use serde_json::{json, Map, Value};
use sha2::{Digest, Sha256};

/// The version of the binding's shape.
pub const BIND_CONTRACT_VERSION: &str = "v1alpha1";

/// The reasoning efforts an override may name.
const EFFORTS: [&str; 4] = ["low", "medium", "high", "max"];

/// Effective rigor, weakest first.
const RIGORS: [&str; 4] = ["low", "standard", "high", "critical"];

/// The run timeout floor and ceiling, in milliseconds.
const RUN_TIMEOUT_MIN_MS: i64 = 60_000;
const RUN_TIMEOUT_MAX_MS: i64 = 4 * 3_600_000;

static NULL: Value = Value::Null;

/// The facts of the session a bind runs in, besides the machine (herdr presence is the machine's).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct BindSession {
    /// No person answers in this session.
    pub headless: bool,
    /// The session has a native agent (live task access).
    pub has_native_agent: bool,
    /// The caller binds only to learn who, which model and what tier: posture is judged at launch.
    pub posture_at_launch: bool,
}

impl BindSession {
    fn executor_session(self) -> Session {
        Session {
            has_native_agent: self.has_native_agent,
            posture_at_launch: self.posture_at_launch,
        }
    }
}

/// What one seat is bound from.
#[derive(Debug, Clone, Copy)]
pub struct BindRequest<'a> {
    /// The ask of one seat: `unit`, `seat`, `role`, `posture`, `persona`, `lockedPersona`, `workflowTier`,
    /// `raiseAuthorized`, `readOnly`, `independentOf`, `preferIndependentOf`, `overrides`, `blind`.
    pub ask: &'a Value,
    /// The effective runner section.
    pub runner: &'a Value,
    pub session: BindSession,
    /// Where the seat stands after a failure: `tried` (earlier bindings, oldest first), `excludePools`,
    /// `failedAccounts`, `continuity`, `from` (default the last tried), `rotation`, `detail`, `reason`.
    pub walk: &'a Value,
    /// Dispatch's read of the lease state, keyed by the lease document's provider keys; `None` binds from the
    /// config alone (a replay, an explain).
    pub account_state: Option<&'a Value>,
}

/// An account a pin names: `pool/account`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AccountPin {
    pub pool: String,
    pub id: String,
}

// ---- reading the JSON -----------------------------------------------------------------------------------------

/// The truthiness of a JSON value.
fn truthy(value: Option<&Value>) -> bool {
    match value {
        None | Some(Value::Null) | Some(Value::Bool(false)) => false,
        Some(Value::String(text)) => !text.is_empty(),
        Some(Value::Number(n)) => n.as_f64().is_some_and(|n| n != 0.0),
        Some(_) => true,
    }
}

/// A value as a template literal prints it.
fn text_of(value: &Value) -> String {
    match value {
        Value::String(text) => text.clone(),
        other => other.to_string(),
    }
}

fn truthy_text<'a>(value: &'a Value, key: &str) -> Option<&'a str> {
    str_of(value, key).filter(|text| !text.is_empty())
}

// ---- the capability catalog -----------------------------------------------------------------------------------

/// The entries of `runner.capabilities` that apply to a capability, most specific first: its exact key, then its
/// `<prefix>:*` key.
fn capability_entries<'a>(runner: &'a Value, capability: Option<&str>) -> Vec<(String, &'a Value)> {
    let (Some(capability), Some(section)) = (
        capability.filter(|c| !c.is_empty()),
        runner
            .get("capabilities")
            .filter(|s| s.is_object() || s.is_array()),
    ) else {
        return Vec::new();
    };
    let mut keys = vec![capability.to_string()];
    if let Some((prefix, _)) = capability.split_once(':') {
        keys.push(format!("{prefix}:*"));
    }
    keys.into_iter()
        .filter_map(|key| {
            let entry = section.get(&key)?;
            (entry.is_object() || entry.is_array()).then_some((key, entry))
        })
        .collect()
}

/// The rigor a capability declares: its exact entry, else its prefix entry.
fn capability_rigor(
    runner: &Value,
    capability: Option<&str>,
) -> Result<Option<&'static str>, ModelError> {
    let Some(rigor) = capability_entries(runner, capability)
        .into_iter()
        .find_map(|(_, entry)| entry.get("rigor"))
    else {
        return Ok(None);
    };
    rigor_of(rigor).map(Some).ok_or_else(|| {
        ModelError::of_class(
            "RangeError",
            None,
            format!(
                "invalid capability rigor \"{}\" for \"{}\". Valid rigors: [{}]",
                text_of(rigor),
                capability.unwrap_or_default(),
                RIGORS.join(", ")
            ),
        )
    })
}

fn rigor_of(value: &Value) -> Option<&'static str> {
    RIGORS
        .into_iter()
        .find(|rigor| value.as_str() == Some(rigor))
}

/// The effective rigor of a unit: the stronger of its own rigor and its capability's, `None` when neither names one.
pub fn effective_rigor(unit: &Value, runner: &Value) -> Result<Option<&'static str>, ModelError> {
    let own = present(unit, "rigor");
    let declared = capability_rigor(runner, str_of(unit, "capability"))?;
    let own = match own {
        None => None,
        Some(value) => Some(rigor_of(value).ok_or_else(|| {
            ModelError::of_class(
                "RangeError",
                None,
                format!(
                    "invalid rigor \"{}\". Valid rigors: [{}]",
                    text_of(value),
                    RIGORS.join(", ")
                ),
            )
        })?),
    };
    let rank = |rigor: &str| RIGORS.iter().position(|r| *r == rigor);
    Ok(match (own, declared) {
        (None, other) | (other, None) => other,
        (Some(own), Some(declared)) => Some(if rank(declared) > rank(own) {
            declared
        } else {
            own
        }),
    })
}

/// The persona a capability defaults to, with the key that declares it.
fn capability_persona(runner: &Value, capability: Option<&str>) -> Option<(String, String)> {
    capability_entries(runner, capability)
        .into_iter()
        .find_map(|(key, entry)| {
            truthy_text(entry, "persona").map(|persona| (persona.to_string(), key))
        })
}

// ---- the seat config slice ------------------------------------------------------------------------------------

/// The runner config keys seat choice reads besides the taste.
const SEAT_CONFIG_KEYS: [&str; 4] = ["defaults", "maxTier", "tierFallback", "modelPolicies"];

/// `prefer` as the crate reads it: a single executor id is a list of one.
fn prefer_list(prefer: &Value) -> Value {
    match prefer {
        Value::String(_) => json!([prefer]),
        other => other.clone(),
    }
}

fn fields_of(entry: &Value, keys: &[&str]) -> Value {
    let mut out = Map::new();
    for key in keys {
        if let Some(value) = entry.get(*key) {
            out.insert((*key).into(), value.clone());
        }
    }
    if let Some(prefer) = entry.get("prefer") {
        out.insert("prefer".into(), prefer_list(prefer));
    }
    Value::Object(out)
}

fn taste_table(table: Option<&Value>) -> Value {
    Value::Object(
        table
            .and_then(Value::as_object)
            .into_iter()
            .flatten()
            .filter(|(_, scope)| scope.is_object())
            .map(|(name, scope)| (name.clone(), fields_of(scope, &["tier"])))
            .collect(),
    )
}

/// The slice of a runner section seat choice reads: the tier vocabulary, cells and fallback order, and per
/// capability the tier, `maxTier` and `prefer`, with the `roles` and `personas` taste tables.
pub fn seat_config(runner: &Value) -> Value {
    let runner = match runner.get("runner") {
        Some(nested) if truthy(Some(nested)) && runner.get("modelPolicies").is_none() => nested,
        _ => runner,
    };
    let mut config = Map::new();
    for key in SEAT_CONFIG_KEYS {
        if let Some(value) = runner.get(key) {
            config.insert(key.into(), value.clone());
        }
    }
    let capabilities: Map<String, Value> = runner
        .get("capabilities")
        .and_then(Value::as_object)
        .into_iter()
        .flatten()
        .filter(|(_, entry)| entry.is_object())
        .map(|(name, entry)| (name.clone(), fields_of(entry, &["tier", "maxTier"])))
        .collect();
    config.insert("capabilities".into(), Value::Object(capabilities));
    config.insert("roles".into(), taste_table(runner.get("roles")));
    config.insert("personas".into(), taste_table(runner.get("personas")));
    Value::Object(config)
}

/// `sha256:<hex>` of a value's canonical JSON.
fn digest_of(value: &Value) -> String {
    // A value read from JSON has no non-finite number, so canonical JSON always has a form for it.
    let text = fgos_canonical_json::canonical_json(value).unwrap_or_default();
    let hash = Sha256::digest(text.as_bytes());
    let hex: String = hash.iter().map(|byte| format!("{byte:02x}")).collect();
    format!("sha256:{hex}")
}

/// The digest a binding records of the config slice it was bound under; a replay compares it before it rebinds.
pub fn seat_config_digest(runner: &Value) -> String {
    digest_of(&seat_config(runner))
}

// ---- family-keyed sections ------------------------------------------------------------------------------------

fn family_name(spelling: &str) -> String {
    family_of(FamilySource::Spelling(spelling), None)
}

/// A `modelPolicies` (keyed by family) or `tierFallback` (lists of families) section with every family named the
/// way `family_of` names it; `None` when it already is. A cell written under the family's own name wins.
fn family_keyed_section(section: &Map<String, Value>, lists_families: bool) -> Option<Value> {
    let misspelt = |value: &Value| value.as_str().is_some_and(|text| family_name(text) != text);
    if lists_families {
        let names = |families: &Value| -> Vec<Value> {
            match families {
                Value::Array(list) => list.clone(),
                one => vec![one.clone()],
            }
        };
        if !section
            .values()
            .flat_map(names)
            .any(|value| misspelt(&value))
        {
            return None;
        }
        return Some(Value::Object(
            section
                .iter()
                .map(|(tier, families)| {
                    let mut out: Vec<Value> = Vec::new();
                    for value in names(families) {
                        let named = value
                            .as_str()
                            .map_or(value.clone(), |text| json!(family_name(text)));
                        if !out.contains(&named) {
                            out.push(named);
                        }
                    }
                    (tier.clone(), Value::Array(out))
                })
                .collect(),
        ));
    }
    if !section.keys().any(|key| family_name(key) != *key) {
        return None;
    }
    let mut keyed = Map::new();
    for (key, cells) in section {
        let family = family_name(key);
        if *key == family || !keyed.contains_key(&family) {
            keyed.insert(family, cells.clone());
        }
    }
    Some(Value::Object(keyed))
}

/// The runner section with its family-keyed sections keyed by family name, so a cell written under `codex` is
/// found for an executor of family `openai`.
fn family_keyed(runner: &Value) -> Value {
    let mut out = runner.clone();
    for (key, lists) in [("modelPolicies", false), ("tierFallback", true)] {
        if let Some(keyed) = runner
            .get(key)
            .and_then(Value::as_object)
            .and_then(|section| family_keyed_section(section, lists))
        {
            out[key] = keyed;
        }
    }
    out
}

// ---- the ask --------------------------------------------------------------------------------------------------

/// The posture of a producer seat an ask names no posture for.
fn producer_posture() -> Value {
    json!({ "readOnly": false, "writer": true, "forceOutOfProcess": false, "stance": false, "verdict": false })
}

/// The override that applies to this unit, seat and role (a scope-less one applies to every seat of the run).
fn matching_override<'a>(
    ask: &'a Value,
    unit: &Value,
    seat: &str,
    role: &str,
) -> Option<&'a Value> {
    let fits = |want: Option<&Value>, have: Option<&Value>| match want {
        None | Some(Value::Null) => true,
        Some(want) => have == Some(want),
    };
    array_of(ask, "overrides").iter().find(|ov| {
        if !ov.is_object() {
            return false;
        }
        let scope = ov.get("scope");
        if !truthy(scope) {
            return true;
        }
        let scope = scope.unwrap_or(&NULL);
        fits(scope.get("unit"), unit.get("id"))
            && fits(scope.get("seat"), Some(&json!(seat)))
            && fits(scope.get("role"), Some(&json!(role)))
    })
}

/// Where an override came from: its origin when it names one, else just `override`.
fn override_source(over: Option<&Value>) -> String {
    match over.and_then(|over| truthy_text(over, "origin")) {
        Some(origin) => format!("override:{origin}"),
        None => "override".into(),
    }
}

/// The persona that sits a seat and where it came from, and the same chain without an override's persona (the
/// persona the tier is judged against before the selection).
struct PersonaChoice {
    persona: Option<String>,
    source: String,
    selected: Option<String>,
    base: Option<String>,
}

fn resolve_persona(
    ask: &Value,
    unit: &Value,
    over: Option<&Value>,
    capability_persona: Option<(String, String)>,
) -> Result<PersonaChoice, Value> {
    let seat_persona = truthy_text(ask, "persona");
    let locked = truthy_text(ask, "lockedPersona");
    let unit_persona = truthy_text(unit, "persona");
    let over_persona = over.and_then(|over| truthy_text(over, "persona"));
    if let (Some(locked), Some(unit_persona)) = (locked, unit_persona) {
        if unit_persona != locked {
            return Err(
                json!({ "reason": "locked-persona", "detail": format!("Unit persona \"{unit_persona}\" conflicts with locked persona \"{locked}\"") }),
            );
        }
    }
    if let (Some(locked), Some(chosen)) = (locked, over_persona) {
        if chosen != locked {
            return Err(
                json!({ "reason": "locked-persona", "detail": format!("Cannot override locked persona \"{locked}\" with \"{chosen}\"") }),
            );
        }
    }
    let chain = |skip: Option<&str>| -> (Option<String>, String) {
        if let Some(persona) = seat_persona {
            return (Some(persona.into()), "seat".into());
        }
        if let Some(persona) = unit_persona.filter(|persona| Some(*persona) != skip) {
            return (Some(persona.into()), "unit".into());
        }
        if let Some(persona) = locked {
            return (Some(persona.into()), "locked-persona".into());
        }
        if let Some((persona, key)) = &capability_persona {
            return (Some(persona.clone()), format!("capability:{key}"));
        }
        (None, "none".into())
    };
    let (persona, source) = match over_persona {
        Some(chosen) => (Some(chosen.to_string()), override_source(over)),
        None => chain(None),
    };
    Ok(PersonaChoice {
        persona,
        source,
        selected: over_persona.map(str::to_string),
        base: chain(over_persona).0,
    })
}

/// The crate's override from the override that matched: an override with no scope is run-wide.
fn crate_override(over: Option<&Value>) -> Option<Value> {
    let over = over?;
    let mut out = Map::new();
    if let Some(tier) = over.get("tier") {
        out.insert("tier".into(), tier.clone());
    }
    for (from, to) in [("executor", "executor"), ("invocation", "invocation")] {
        if let Some(value) = over.get(from).filter(|value| truthy(Some(value))) {
            out.insert(to.into(), value.clone());
        }
    }
    if let Some(effort) = over.get("reasoningEffort") {
        out.insert("effort".into(), effort.clone());
    }
    if let Some(account) = over.get("account") {
        out.insert("account".into(), json!(text_of(account)));
    }
    if over.get("acceptDependence") == Some(&json!(true)) {
        out.insert("acceptDependence".into(), json!(true));
    }
    if !truthy(over.get("scope")) && truthy(over.get("executor")) {
        out.insert("runWide".into(), json!(true));
    }
    (!out.is_empty()).then_some(Value::Object(out))
}

/// The unit's own `prefer` (`fgos run --provider`) in the shape the crate reads.
fn unit_prefer(prefer: Option<&Value>) -> Value {
    Value::Array(
        prefer
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .map(|entry| match entry {
                Value::String(_) => entry.clone(),
                other => {
                    let mut out = Map::new();
                    out.insert(
                        "executor".into(),
                        other.get("executor").cloned().unwrap_or(Value::Null),
                    );
                    if let Some(invocation) = other.get("invocation").filter(|v| truthy(Some(v))) {
                        out.insert("invocation".into(), invocation.clone());
                    }
                    Value::Object(out)
                }
            })
            .collect(),
    )
}

/// A binding as the crate's walk state names a candidate.
fn identity_of(binding: &Value) -> Value {
    let mut out = Map::new();
    out.insert(
        "executor".into(),
        binding.get("executor").cloned().unwrap_or(Value::Null),
    );
    if let Some(invocation) = binding.get("invocation").filter(|v| truthy(Some(v))) {
        out.insert("invocation".into(), invocation.clone());
    }
    if let Some(pool) = binding.get("pool").filter(|v| truthy(Some(v))) {
        out.insert("pool".into(), pool.clone());
    }
    if let Some(model) = binding
        .get("model")
        .filter(|v| truthy(Some(v)) && v.as_str() != Some("default"))
    {
        out.insert("model".into(), model.clone());
    }
    if let Some(effort) = binding.get("reasoningEffort").filter(|v| truthy(Some(v))) {
        out.insert("effort".into(), effort.clone());
    }
    Value::Object(out)
}

/// What names one candidate of a seat's walk: executor, invocation, pool, model and effort.
pub(crate) fn binding_identity(binding: &Value) -> String {
    ["executor", "invocation", "pool", "model", "reasoningEffort"]
        .iter()
        .map(|key| match binding.get(*key) {
            None | Some(Value::Null) => String::new(),
            Some(value) => text_of(value),
        })
        .collect::<Vec<_>>()
        .join("\u{0}")
}

/// The crate's walk state from the caller's: earlier bindings, pools to avoid, the identity a seat keeps.
fn crate_walk(walk: &Value) -> Value {
    let mut out = json!({
        "tried": array_of(walk, "tried").iter().map(identity_of).collect::<Vec<_>>(),
        "excludePools": array_of(walk, "excludePools"),
        "failedAccounts": array_of(walk, "failedAccounts"),
    });
    if let Some(continuity) = present(walk, "continuity").filter(|c| truthy(Some(c))) {
        out["continuity"] = identity_of(continuity);
    }
    out
}

// ---- one crate call -------------------------------------------------------------------------------------------

/// What one seat's crate call was asked and answered.
pub(crate) struct Step {
    /// The binding, or `{ refused }`.
    pub binding: Value,
    /// The crate's whole answer; `None` when the seat was refused before the crate was asked.
    pub output: Option<Value>,
    /// The launch view the crate ranked from; `None` when the seat was refused before it was built.
    pub launch_view: Option<Value>,
}

fn refused(refusal: Value) -> Step {
    Step {
        binding: json!({ "refused": refusal }),
        output: None,
        launch_view: None,
    }
}

/// The launch view: every executor of the config as the crate reads it.
fn launch_view_of(
    runner: &Value,
    session: BindSession,
    machine: &dyn Machine,
) -> Map<String, Value> {
    launch_facts(runner, &session.executor_session(), machine)
        .into_iter()
        .map(|(id, facts)| (id, json!(facts)))
        .collect()
}

/// One seat bound by one crate call, its walk standing where `walk` says.
pub(crate) fn bind_step(
    request: &BindRequest<'_>,
    machine: &dyn Machine,
    now: u64,
) -> Result<Step, ModelError> {
    let ask = request.ask;
    let unit = ask.get("unit").unwrap_or(&NULL);
    let seat = str_of(ask, "seat").unwrap_or("producer");
    let role = str_of(ask, "role").unwrap_or("producer");
    let producer = producer_posture();
    let seat_posture = ask
        .get("posture")
        .filter(|p| !p.is_null())
        .unwrap_or(&producer);
    let runner = family_keyed(request.runner);
    let executors = executors_of(&runner);
    let writes_empty = array_of(unit, "writes").is_empty();
    let read_only = ask.get("readOnly") == Some(&json!(true))
        || seat_posture.get("readOnly") == Some(&json!(true))
        || writes_empty;
    let posture = if read_only || !truthy(seat_posture.get("writer")) {
        "read-only"
    } else {
        "workspace-write"
    };
    let over = matching_override(ask, unit, seat, role);
    if let Some(tier) = over.and_then(|over| over.get("tier")) {
        if tier.as_str().and_then(Tier::parse).is_none() {
            let names: Vec<&str> = Tier::ALL.iter().map(|tier| tier.name()).collect();
            return Err(ModelError::runner(format!(
                "invalid tier \"{}\". Valid tiers: [{}]",
                text_of(tier),
                names.join(", ")
            )));
        }
    }
    if let Some(effort) = over.and_then(|over| over.get("reasoningEffort")) {
        if !effort.as_str().is_some_and(|e| EFFORTS.contains(&e)) {
            return Ok(refused(json!({
                "reason": "reasoning-effort",
                "detail": format!("invalid reasoningEffort \"{}\". Valid values: [{}]", text_of(effort), EFFORTS.join(", ")),
            })));
        }
    }
    let persona = match resolve_persona(
        ask,
        unit,
        over,
        capability_persona(&runner, str_of(unit, "capability")),
    ) {
        Ok(persona) => persona,
        Err(refusal) => return Ok(refused(refusal)),
    };
    let force_out = truthy(seat_posture.get("forceOutOfProcess"));
    let required_skills = match unit.get("skills") {
        Some(Value::Array(skills)) if !force_out => Value::Array(skills.clone()),
        _ => json!([]),
    };
    let family = |id: &str| executor_family(&runner, id);
    let mut hard: Vec<String> = Vec::new();
    for dep in array_of(ask, "independentOf")
        .iter()
        .filter_map(Value::as_str)
    {
        let named = if executors.is_some_and(|all| truthy(all.get(dep))) {
            family(dep)
        } else {
            dep.to_string()
        };
        if !hard.contains(&named) {
            hard.push(named);
        }
    }
    let mut peers: Vec<Value> = Vec::new();
    for (index, peer) in array_of(ask, "preferIndependentOf").iter().enumerate() {
        let Some(executor) = truthy_text(peer, "executor") else {
            continue;
        };
        let seat_name = match present(peer, "seat") {
            Some(seat) => seat.clone(),
            None => json!(format!("{executor}#{index}")),
        };
        let entry = json!({ "seat": seat_name, "executor": executor, "family": family(executor) });
        match peers
            .iter()
            .position(|known| known["seat"] == entry["seat"])
        {
            Some(at) => peers[at] = entry,
            None => peers.push(entry),
        }
    }
    let rigor = effective_rigor(unit, &runner)?.unwrap_or("standard");
    let mut crate_ask = Map::new();
    if let Some(capability) = unit.get("capability") {
        crate_ask.insert("capability".into(), capability.clone());
    }
    crate_ask.insert("seat".into(), json!(seat));
    crate_ask.insert("role".into(), json!(role));
    if let Some(base) = &persona.base {
        crate_ask.insert("persona".into(), json!(base));
    }
    crate_ask.insert(
        "label".into(),
        unit.get("id").cloned().unwrap_or(Value::Null),
    );
    if let Some(workflow) = ask.get("workflowTier").filter(|w| truthy(Some(w))) {
        crate_ask.insert("workflow".into(), workflow.clone());
    }
    crate_ask.insert(
        "selectors".into(),
        match &persona.selected {
            Some(selected) => json!({ "persona": selected }),
            None => json!({}),
        },
    );
    crate_ask.insert(
        "raiseAuthorized".into(),
        json!(ask.get("raiseAuthorized") == Some(&json!(true))),
    );
    if let Some(over) = crate_override(over) {
        crate_ask.insert("override".into(), over);
    }
    crate_ask.insert(
        "posture".into(),
        json!({
            "readOnly": seat_posture.get("readOnly") == Some(&json!(true)),
            "forceOutOfProcess": seat_posture.get("forceOutOfProcess") == Some(&json!(true)),
            "blind": ask.get("blind") == Some(&json!(true)),
        }),
    );
    crate_ask.insert("effectiveRigor".into(), json!(rigor));
    crate_ask.insert(
        "independence".into(),
        json!({ "hard": hard, "hardCheckers": [], "soft": peers.iter().map(|peer| peer["seat"].clone()).collect::<Vec<_>>() }),
    );
    crate_ask.insert("requiredSkills".into(), required_skills);
    crate_ask.insert("unitPrefer".into(), unit_prefer(unit.get("prefer")));

    let launch_view = launch_view_of(&runner, request.session, machine);
    let accounts = account_view(&runner, &launch_view, request.account_state, now, machine);
    let input = json!({
        "protocol": PROTOCOL,
        "ask": crate_ask,
        "config": seat_config(&runner),
        "configDigest": seat_config_digest(&runner),
        "peers": peers,
        "walk": crate_walk(request.walk),
        "accountView": accounts,
        "accountViewDigest": digest_of(&accounts),
        "launchView": { "executors": launch_view },
        "now": now,
    });
    let input: BindInput = serde_json::from_value(input).map_err(|err| {
        ModelError::of_class(
            "SeatBindingError",
            Some("invalid-request"),
            format!("input does not match the contract: {err}"),
        )
    })?;
    let output = serde_json::to_value(fgos_seat_binding::bind(&input)).unwrap_or(Value::Null);
    let launch_view = json!({ "executors": launch_view });
    let binding = binding_of(
        &output,
        request,
        &launch_view,
        &persona,
        over,
        posture,
        read_only,
        machine,
    );
    Ok(Step {
        binding,
        output: Some(output),
        launch_view: Some(launch_view),
    })
}

// ---- the binding ----------------------------------------------------------------------------------------------

/// The agent CLIs the configured executors run that are not installed here, by bare name, sorted.
fn absent_clis(runner: &Value, session: BindSession, machine: &dyn Machine) -> Vec<String> {
    let mut names: Vec<String> = Vec::new();
    for (id, entry) in executors_of(runner)
        .into_iter()
        .flatten()
        .filter(|(_, entry)| entry.is_object() && str_of(entry, "kind") != Some("tool"))
    {
        for name in missing_clis(runner, id, entry, &session.executor_session(), machine)
            .unwrap_or_default()
        {
            if !names.contains(&name) {
                names.push(name);
            }
        }
    }
    names.sort();
    names
}

/// A refusal in the caller's shape; the headless wording is the session's fact, not the crate's.
fn refusal_of(
    refusal: &Value,
    unit: &Value,
    request: &BindRequest<'_>,
    machine: &dyn Machine,
) -> Value {
    let session = request.session;
    if let Some(missing) =
        agent_cli_missing_refusal(request.runner, &session.executor_session(), machine)
    {
        return json!(missing);
    }
    let reason = refusal.get("reason").cloned().unwrap_or(Value::Null);
    let nothing_configured = reason == json!("no-candidate")
        && refusal
            .get("configured")
            .and_then(Value::as_u64)
            .unwrap_or(0)
            == 0;
    if nothing_configured && session.headless {
        return json!({
            "reason": "headless-no-executor",
            "detail": format!(
                "No candidate executor available in headless session for capability \"{}\"",
                unit.get("capability").map_or("undefined".to_string(), text_of)
            ),
        });
    }
    let mut out = Map::new();
    out.insert("reason".into(), reason.clone());
    out.insert(
        "detail".into(),
        refusal.get("detail").cloned().unwrap_or(Value::Null),
    );
    if reason == json!("cli-missing") {
        out.insert(
            "missingClis".into(),
            json!(absent_clis(request.runner, session, machine)),
        );
    }
    if let Some(config) = refusal.get("config").filter(|c| truthy(Some(c))) {
        out.insert("config".into(), config.clone());
    }
    for key in ["peers", "rendered"] {
        if let Some(list) = refusal
            .get(key)
            .filter(|l| l.as_array().is_some_and(|l| !l.is_empty()))
        {
            out.insert(key.into(), list.clone());
        }
    }
    Value::Object(out)
}

/// How the transport got to the invocation that runs.
fn transport_of(
    cand: &Value,
    entry: &Value,
    launch_facts: &Value,
    herdr_present: bool,
) -> (&'static str, &'static str) {
    let declared = array_of(entry, "invocations");
    let invocation = declared
        .iter()
        .find(|inv| inv.get("id").is_some() && inv.get("id") == cand.get("invocation"));
    let transport = if invocation.and_then(|inv| str_of(inv, "adapter")) == Some("herdr-spawn") {
        "herdr"
    } else {
        "cli"
    };
    if cand.get("pinned") == Some(&json!(true)) {
        let source = match str_of(cand, "source") {
            Some("override") => "override-pinned-invocation",
            Some("unit-prefer") => "unit-prefer-pinned-invocation",
            _ => "prefer-pinned-invocation",
        };
        return (transport, source);
    }
    if transport == "herdr" {
        return (transport, "herdr-invocation-present");
    }
    let herdr = array_of(launch_facts, "invocations").iter().find(|facts| {
        declared.iter().any(|raw| {
            raw.get("id") == facts.get("id") && str_of(raw, "adapter") == Some("herdr-spawn")
        })
    });
    if herdr_present && herdr.is_some_and(|facts| facts.get("carriesPosture") != Some(&json!(true)))
    {
        return (transport, "cli:herdr-invocation-cannot-apply-posture");
    }
    (transport, "default-cli")
}

/// Why a run timeout is not usable (whole milliseconds inside the floor and ceiling), or `None` when it is.
fn run_timeout_problem(value: &Value, label: &str) -> Option<String> {
    const SAFE: i64 = 9_007_199_254_740_991;
    let whole = value.as_i64().filter(|ms| ms.abs() <= SAFE);
    let Some(ms) = whole else {
        return Some(format!(
            "{label} must be a whole number of milliseconds, got: {}",
            match value {
                Value::Number(n) => n.to_string(),
                other => other.to_string(),
            }
        ));
    };
    let format = |ms: i64| {
        if ms % 3_600_000 == 0 {
            format!("{}h", ms / 3_600_000)
        } else {
            format!("{}m", ms / 60_000)
        }
    };
    if ms < RUN_TIMEOUT_MIN_MS {
        return Some(format!(
            "{label} must be at least {}, got {ms}ms",
            format(RUN_TIMEOUT_MIN_MS)
        ));
    }
    if ms > RUN_TIMEOUT_MAX_MS {
        return Some(format!(
            "{label} must be at most {}, got {ms}ms",
            format(RUN_TIMEOUT_MAX_MS)
        ));
    }
    None
}

/// The run timeout an override or the unit asks for, and its source; an unusable one is the refusal's detail.
fn timeout_of(over: Option<&Value>, unit: &Value) -> Result<(Value, String), String> {
    if let Some(ms) = over.and_then(|over| over.get("timeoutMs")) {
        return match run_timeout_problem(ms, "override timeoutMs") {
            Some(problem) => Err(problem),
            None => Ok((ms.clone(), override_source(over))),
        };
    }
    if let Some(ms) = unit.get("timeoutMs") {
        return match run_timeout_problem(ms, "unit.timeoutMs") {
            Some(problem) => Err(problem),
            None => Ok((ms.clone(), "unit".into())),
        };
    }
    Ok((Value::Null, "none".into()))
}

/// What a walk step records about the candidate it left: another entry or family, another account of the same
/// candidate, or the same candidate again after its lease or its brief failed.
fn fallback_from(previous: &Value, binding: &Value, walk: &Value, runner: &Value) -> Value {
    let reason = present(walk, "reason")
        .cloned()
        .unwrap_or(json!("provider-limit"));
    let or_null = |key: &str| present(previous, key).cloned().unwrap_or(Value::Null);
    let mut out = json!({
        "executor": previous.get("executor").cloned().unwrap_or(Value::Null),
        "invocation": or_null("invocation"),
        "transport": or_null("transport"),
        "pool": or_null("pool"),
        "reason": reason,
    });
    if walk.get("rotation") == Some(&json!(true)) {
        out["kind"] = json!("account-rotation");
        if let Some(detail) = walk.get("detail").and_then(Value::as_object) {
            for (key, value) in detail {
                out[key] = value.clone();
            }
        }
        return out;
    }
    if reason == json!("lease-conflict") || reason == json!("brief-not-delivered") {
        out["kind"] = reason;
        return out;
    }
    let family =
        |binding: &Value| executor_family(runner, str_of(binding, "executor").unwrap_or_default());
    out["kind"] = json!("next-candidate");
    out["walk"] = json!(if family(previous) == family(binding) {
        "entry"
    } else {
        "family"
    });
    out
}

#[allow(clippy::too_many_arguments)]
fn binding_of(
    out: &Value,
    request: &BindRequest<'_>,
    launch_view: &Value,
    persona: &PersonaChoice,
    over: Option<&Value>,
    posture: &str,
    read_only: bool,
    machine: &dyn Machine,
) -> Value {
    let ask = request.ask;
    let unit = ask.get("unit").unwrap_or(&NULL);
    let runner = request.runner;
    let refuse =
        |refusal: &Value| json!({ "refused": refusal_of(refusal, unit, request, machine) });
    let policy = &out["policy"];
    let Some(ranked) = present(out, "ranked") else {
        return refuse(&out["refusal"]);
    };
    let Some(cand) = array_of(ranked, "candidates").first() else {
        let fallback = json!({ "reason": "no-candidate", "detail": "no candidate" });
        return refuse(present(out, "refusal").unwrap_or(&fallback));
    };
    let (timeout, timeout_source) = match timeout_of(over, unit) {
        Ok(timeout) => timeout,
        Err(detail) => return json!({ "refused": { "reason": "run-timeout", "detail": detail } }),
    };
    let executor = str_of(cand, "executor").unwrap_or_default();
    let entry = executors_of(runner)
        .and_then(|all| all.get(executor))
        .unwrap_or(&NULL);
    let facts = launch_view["executors"].get(executor).unwrap_or(&NULL);
    let (transport, transport_source) = transport_of(cand, entry, facts, machine.herdr_present());
    let model = present(cand, "model").cloned().unwrap_or(json!("default"));
    let effort = present(cand, "effort").cloned().unwrap_or(Value::Null);
    let pool = present(cand, "pool").filter(|p| truthy(Some(p)));
    let lease_account = present(cand, "account").filter(|a| truthy(Some(a)));

    // An account pin applies only to a seat whose chosen entry is served by its pool.
    let pin = over.and_then(|over| over.get("account"));
    let skipped = array_of(ranked, "skipped");
    let pin_skip = pin.and(
        skipped
            .iter()
            .find(|skip| str_of(skip, "reason") == Some("account-pin-other-pool")),
    );
    let account = match (pin, pin_skip, pool, lease_account) {
        (Some(_), None, Some(pool), Some(id)) => Some(json!({ "pool": pool, "id": id })),
        _ => None,
    };

    let mut tier = json!({ "value": policy["tier"], "source": policy["tierSource"] });
    for key in ["recommendation", "loweredFrom", "maxTier", "raisedBy"] {
        if let Some(value) = policy.get(key).filter(|v| truthy(Some(v))) {
            tier[key] = value.clone();
        }
    }
    let effort_source = match str_of(cand, "effortSource") {
        Some("override") => json!(override_source(over)),
        _ => cand.get("effortSource").cloned().unwrap_or(Value::Null),
    };
    let invocation = present(cand, "invocation").cloned().unwrap_or(Value::Null);
    let mut provenance = json!({
        "executor": { "value": executor, "source": cand["source"] },
        "invocation": {
            "value": invocation,
            "source": if truthy(Some(&invocation)) { cand["source"].clone() } else { json!("none") },
        },
        "transport": { "value": transport, "source": transport_source },
        "tier": tier,
        "model": { "value": model, "source": cand["modelSource"] },
        "persona": { "value": persona.persona, "source": persona.source },
        "reasoningEffort": { "value": effort, "source": effort_source },
        "timeoutMs": { "value": timeout, "source": timeout_source },
        "mechanism": {
            "value": cand["mechanism"],
            "source": if truthy(ask.get("posture").and_then(|p| p.get("forceOutOfProcess"))) { "posture-forced-out-of-process" } else { "decideExecutorDispatchMechanism" },
        },
        "posture": {
            "value": posture,
            "source": if read_only { "read-only-ask-or-writes-empty" } else { "producer-writes-declared" },
        },
    });
    if let Some(pool) = pool {
        provenance["pool"] = json!({ "value": pool, "source": cand["modelSource"] });
    }
    if !skipped.is_empty() {
        provenance["skipped"] = json!(skipped);
    }
    // Degraded independence is recorded, never hidden: which seats this one shares a provider family with.
    if ask.get("preferIndependentOf").is_some_and(Value::is_array) {
        let mut shared: Vec<&Value> = Vec::new();
        for seat in array_of(ranked, "sharedWith") {
            if !shared.contains(&seat) {
                shared.push(seat);
            }
        }
        provenance["familySpread"] = json!({
            "value": { "family": cand["family"], "sharedWith": shared },
            "source": if array_of(ranked, "sharedWith").is_empty() { "prefer-independent-of:distinct-family" } else { "prefer-independent-of:no-eligible-unused-family" },
        });
    }
    if pin.is_some() {
        let mut record = json!({
            "value": account.as_ref().map_or(Value::Null, |a| json!(format!("{}/{}", text_of(&a["pool"]), text_of(&a["id"])))),
            "source": override_source(over),
        });
        if let Some(skip) = pin_skip {
            record["skipped"] = json!({ "reason": skip["reason"], "detail": skip["detail"] });
        }
        provenance["account"] = record;
    }
    if let Some(origin) = over
        .and_then(|over| over.get("origin"))
        .filter(|o| truthy(Some(o)))
    {
        provenance["overridesOrigin"] = json!({ "value": origin, "source": "override" });
    }

    // What was decided from, without the config body and without account facts: what a replay needs to recompute
    // the answer and an audit needs to see what the seat was asked.
    let mut binding_input = out["bindingInput"].clone();
    if let Some(fields) = binding_input.as_object_mut() {
        fields.remove("now");
    }
    let mut binding = json!({
        "contractVersion": BIND_CONTRACT_VERSION,
        "executor": executor,
        "invocation": invocation,
        "transport": transport,
        "family": cand["family"],
        "pool": pool.cloned().unwrap_or(Value::Null),
        "tier": policy["tier"],
        "model": model,
        "persona": persona.persona,
        "reasoningEffort": effort,
        "timeoutMs": timeout,
        "mechanism": cand["mechanism"],
        "posture": posture,
        "provenance": provenance,
        "bindingInput": binding_input,
    });
    // The account the lease takes: named here, taken under the lock, re-ranked (a new bind) when it cannot be.
    if let (Some(_), Some(id)) = (pool, lease_account) {
        binding["leaseAccount"] = id.clone();
    }
    if let Some(account) = account {
        binding["account"] = account;
    }
    let walk = request.walk;
    let from = present(walk, "from").or_else(|| array_of(walk, "tried").last());
    if let Some(from) = from.filter(|from| truthy(Some(from))) {
        binding["provenance"]["fallbackFrom"] = fallback_from(from, &binding, walk, runner);
    }
    binding
}

/// The binding of one seat (one crate call), or `{ refused: { reason, detail, ... } }`. An override naming a tier
/// or a rigor no seat could take is an error, not a refusal.
pub fn bind(
    request: &BindRequest<'_>,
    machine: &dyn Machine,
    now: u64,
) -> Result<Value, ModelError> {
    bind_step(request, machine, now).map(|step| step.binding)
}

// ---- pre-admission ------------------------------------------------------------------------------------------

/// What a run start refuses before any bind: no agent CLI on the machine, or a pinned account quarantined now.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Preflight {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agent_cli_missing: Option<AgentCliMissing>,
    /// Until when (epoch milliseconds, the largest safe integer when only a person clears it) the pinned account
    /// is quarantined; the account view's judgement, so a pin is refused for the reason a ranked one is passed over.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pin_quarantined_until: Option<u64>,
}

/// The pre-admission facts of a run start, answered without a bind.
pub fn preflight(
    runner: &Value,
    session: &BindSession,
    pin: Option<&AccountPin>,
    account_state: Option<&Value>,
    machine: &dyn Machine,
    now: u64,
) -> Preflight {
    let pin_quarantined_until = pin.and_then(|pin| {
        // The pool set the bind ranks from: family spellings are keyed first, as the bind reads the runner.
        let runner = family_keyed(runner);
        let launch_view = launch_view_of(&runner, BindSession::default(), machine);
        let view = account_view(&runner, &launch_view, account_state, now, machine);
        view["pools"]
            .get(&pin.pool)
            .and_then(Value::as_array)?
            .iter()
            .find(|account| account["id"] == json!(pin.id))?
            .get("quarantinedUntil")?
            .as_u64()
    });
    Preflight {
        agent_cli_missing: agent_cli_missing_refusal(runner, &session.executor_session(), machine),
        pin_quarantined_until,
    }
}
