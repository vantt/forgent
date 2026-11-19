//! Resolving the collaboration of one unit run: which pattern, which loop, which parameters (and where each came
//! from), which seats, how many launches at most, and the pin a run records of all that.
//!
//! The parameter layers, strongest first: the request, the caller's pattern object, the unit's declared seats, the
//! activity's baseline, the unit's own, the pattern default, the loop config, the built-in default. The seat modules
//! decide seats, launch bounds and the checker plan; they come through [`Seating`].

use super::catalog_entries::{
    check_catalog, deep_equal, resolve_layer, LoopTables, ParamDef, SeatError,
};
use super::CollaborationError;
use crate::unit::js_trim;
use serde_json::{json, Map, Value};

/// A refusal of the resolution: the catalog's own, or the seat modules'.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CollaborationFailure {
    Collaboration(CollaborationError),
    Seat(SeatError),
}

impl From<CollaborationError> for CollaborationFailure {
    fn from(err: CollaborationError) -> Self {
        CollaborationFailure::Collaboration(err)
    }
}

impl From<SeatError> for CollaborationFailure {
    fn from(err: SeatError) -> Self {
        CollaborationFailure::Seat(err)
    }
}

impl std::fmt::Display for CollaborationFailure {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CollaborationFailure::Collaboration(e) => e.fmt(f),
            CollaborationFailure::Seat(e) => f.write_str(&e.message),
        }
    }
}

impl std::error::Error for CollaborationFailure {}

type Failure = CollaborationFailure;

/// What the seat modules decide for a resolved pattern. `input` is `{ loop, params, floors?, unit, runnerConfig,
/// slot?, shippedCheckersByRigor? }`; a field that is unset is left out.
pub trait Seating {
    /// The ordered seats the unit's pattern fills.
    fn resolve_seats(&self, input: &Value) -> Result<Vec<Value>, SeatError>;
    /// The most seat launches the pattern may plan; `None` for a pattern the core does not know.
    fn seat_launches(&self, input: &Value) -> Result<Option<Value>, SeatError>;
    /// The checker plan of a reviewed unit: `{ seat, contributions }` per checker.
    fn checker_plan(
        &self,
        unit: &Value,
        runner_config: &Value,
        options: &Value,
    ) -> Result<Vec<Value>, SeatError>;
}

/// What a resolution reads. Every field is the JSON the caller holds; absent means the caller passed none.
#[derive(Debug, Clone, Default)]
pub struct ResolveOptions<'a> {
    pub unit: Option<&'a Value>,
    pub selectors: Option<&'a Value>,
    pub request: Option<&'a Value>,
    pub in_case: bool,
    pub reason: Option<&'a str>,
    pub runner_config: Option<&'a Value>,
    pub shipped: Option<&'a Value>,
    pub origins: Option<&'a Value>,
}

/// The resolved collaboration.
#[derive(Debug, Clone, PartialEq)]
#[non_exhaustive]
pub struct Collaboration {
    pub loop_name: String,
    pub params: Map<String, Value>,
    pub seats: Vec<Value>,
    pub role_tasks: Value,
    pub launch_bound: Option<Value>,
    pub entry: Value,
    pub pin: Value,
}

impl Collaboration {
    pub fn to_json(&self) -> Value {
        json!({
            "loop": self.loop_name,
            "params": self.params,
            "seats": self.seats,
            "roleTasks": self.role_tasks,
            "launchBound": self.launch_bound,
            "entry": self.entry,
            "pin": self.pin,
        })
    }
}

fn invalid(message: impl AsRef<str>) -> Failure {
    CollaborationError::new("param-invalid", Some(message.as_ref()), None, None).into()
}

fn refuse(code: &str, message: impl AsRef<str>) -> Failure {
    CollaborationError::new(code, Some(message.as_ref()), None, None).into()
}

fn own<'a>(value: &'a Value, key: &str) -> Option<&'a Value> {
    value.as_object().and_then(|o| o.get(key))
}

/// The property of an object that is neither absent nor null (`a?.b ?? c`).
fn prop<'a>(value: Option<&'a Value>, key: &str) -> Option<&'a Value> {
    value.and_then(|v| own(v, key)).filter(|v| !v.is_null())
}

fn non_empty_string(value: Option<&Value>) -> Option<&str> {
    value.and_then(Value::as_str).filter(|s| !s.is_empty())
}

fn text_of(value: &Value) -> String {
    match value {
        Value::String(s) => s.clone(),
        other => other.to_string(),
    }
}

fn is_whole(value: &Value) -> Option<f64> {
    value.as_f64().filter(|n| n.fract() == 0.0)
}

/// `requirePlainObject`: absent is fine, anything else must be an object.
fn require_plain_object(value: Option<&Value>, message: &str) -> Result<(), Failure> {
    match value {
        Some(v) if !v.is_object() => Err(invalid(message)),
        _ => Ok(()),
    }
}

/// The seats and role tasks a unit or activity declares beside its params object.
fn loose_parts_of(carrier: &Value) -> Map<String, Value> {
    ["seats", "roleTasks"]
        .into_iter()
        .filter_map(|key| own(carrier, key).map(|v| (key.to_string(), v.clone())))
        .collect()
}

struct Resolver<'a> {
    tables: &'a dyn LoopTables,
}

impl Resolver<'_> {
    fn is_checker(&self, name: &str) -> bool {
        self.tables
            .checker_seats()
            .iter()
            .any(|(seat, _)| seat == name)
    }

    fn table(&self, loop_name: &str) -> Option<Vec<(String, ParamDef)>> {
        self.tables.param_defs(loop_name)
    }

    fn domain_value(&self, key: &str, value: &Value, carrier: &str) -> Result<(), Failure> {
        let shown = value.to_string();
        match key {
            "maxRounds" => {
                if !is_whole(value).is_some_and(|n| n >= 1.0) {
                    return Err(invalid(format!(
                        "parameter \"maxRounds\" on {carrier} must be an integer >= 1, got {shown}"
                    )));
                }
            }
            "minCheckers" => {
                let ok = value.as_array().is_some_and(|l| {
                    l.iter()
                        .all(|s| s.as_str().is_some_and(|n| self.is_checker(n)))
                });
                if !ok {
                    return Err(invalid(format!(
                        "parameter \"minCheckers\" on {carrier} must be a list of CHECKER_SEATS names, got {shown}"
                    )));
                }
            }
            "rebuttal" => {
                if !value.is_boolean() {
                    return Err(invalid(format!(
                        "parameter \"rebuttal\" on {carrier} must be a boolean, got {shown}"
                    )));
                }
            }
            "seats" => {
                self.tables
                    .check_declared_seats(value, &format!("{carrier}.seats"))?;
            }
            "roleTasks" => {
                let ok = value
                    .as_object()
                    .is_some_and(|o| o.values().all(Value::is_string));
                if !ok {
                    return Err(invalid(format!(
                        "parameter \"roleTasks\" on {carrier} must be a map of string values"
                    )));
                }
            }
            _ => {}
        }
        Ok(())
    }

    /// Checks each declared key against the loop's parameter table and its value domain.
    fn carrier_params(
        &self,
        params: &Map<String, Value>,
        table: &Option<Vec<(String, ParamDef)>>,
        loop_name: &str,
        carrier: &str,
    ) -> Result<(), Failure> {
        for (key, value) in params {
            if !table
                .as_ref()
                .is_some_and(|t| t.iter().any(|(k, _)| k == key))
            {
                return Err(refuse(
                    "param-unknown",
                    format!("unknown parameter \"{key}\" in {carrier} for loop \"{loop_name}\""),
                ));
            }
            self.domain_value(key, value, carrier)?;
        }
        Ok(())
    }

    fn parse_scalar(&self, key: &str, raw: &Value, def: &ParamDef) -> Result<Value, Failure> {
        match def.kind.as_str() {
            "integer" => {
                if let Value::Bool(b) = raw {
                    return Err(invalid(format!("invalid integer scalar \"{b}\" for parameter \"{key}\"")));
                }
                if raw.is_number() {
                    return match is_whole(raw).filter(|n| *n >= 1.0) {
                        Some(_) => Ok(raw.clone()),
                        None => Err(invalid(format!("parameter \"{key}\" must be an integer >= 1, got {raw}"))),
                    };
                }
                let text = text_of(raw);
                let digits = text.strip_prefix('-').unwrap_or(&text);
                if digits.is_empty() || !digits.chars().all(|c| c.is_ascii_digit()) {
                    return Err(invalid(format!("invalid integer scalar \"{text}\" for parameter \"{key}\"")));
                }
                let number: f64 = text.parse().unwrap_or(f64::NAN);
                if !number.is_finite() {
                    return Err(invalid(format!("invalid integer scalar \"{text}\" for parameter \"{key}\"")));
                }
                if number < 1.0 {
                    return Err(invalid(format!("parameter \"{key}\" must be an integer >= 1, got {}", number)));
                }
                Ok(json!(text.parse::<u64>().map_or_else(|_| json!(number), |n| json!(n))))
            }
            "boolean" => match raw {
                Value::Bool(_) => Ok(raw.clone()),
                Value::String(s) if s == "true" || s == "false" => Ok(json!(s == "true")),
                other => Err(invalid(format!(
                    "invalid boolean scalar \"{}\" for parameter \"{key}\"; must be \"true\" or \"false\"",
                    text_of(other)
                ))),
            },
            _ => {
                if raw.is_boolean() {
                    return Err(invalid(format!("parameter \"{key}\" expects a string literal, got boolean")));
                }
                Ok(json!(text_of(raw)))
            }
        }
    }

    /// The accepted scalar spellings (`key=value` strings, pairs, key/value objects, a map) as `(key, value)` pairs.
    fn scalar_pairs(&self, scalars: &Value) -> Result<Vec<(Value, Option<Value>)>, Failure> {
        let Some(items) = scalars.as_array() else {
            return Ok(scalars
                .as_object()
                .map(|o| o.iter().map(|(k, v)| (json!(k), Some(v.clone()))).collect())
                .unwrap_or_default());
        };
        let mut pairs = Vec::new();
        for item in items {
            match item {
                Value::String(text) => {
                    let Some((key, value)) = text.split_once('=') else {
                        return Err(invalid(format!(
                            "scalar parameter \"{text}\" missing \"=\" delimiter"
                        )));
                    };
                    pairs.push((json!(key), Some(json!(value))));
                }
                Value::Array(entry) => {
                    if entry.is_empty() || entry.len() > 2 {
                        return Err(invalid("scalar array entry must be [key, value]"));
                    }
                    pairs.push((entry[0].clone(), entry.get(1).cloned()));
                }
                Value::Object(entry) => {
                    if let Some(key) = entry.get("key") {
                        pairs.push((key.clone(), entry.get("value").cloned()));
                    } else {
                        if entry.is_empty() {
                            return Err(invalid("scalar object entry cannot be empty"));
                        }
                        pairs.extend(entry.iter().map(|(k, v)| (json!(k), Some(v.clone()))));
                    }
                }
                _ => return Err(invalid("scalar item must be a string or object")),
            }
        }
        Ok(pairs)
    }

    fn request_scalars(
        &self,
        request: Option<&Value>,
        table: &[(String, ParamDef)],
        loop_name: &str,
    ) -> Result<Map<String, Value>, Failure> {
        let mut parsed = Map::new();
        let Some(scalars) = request.and_then(|r| own(r, "scalars")) else {
            return Ok(parsed);
        };
        if !(scalars.is_object() || scalars.is_array()) {
            return Err(invalid("request scalars must be an array or object"));
        }
        for (key, raw) in self.scalar_pairs(scalars)? {
            let Some(key) = key.as_str().filter(|k| !k.is_empty()) else {
                return Err(invalid("scalar parameter key must be a non-empty string"));
            };
            if parsed.contains_key(key) {
                return Err(refuse(
                    "param-request-conflict",
                    format!("scalar parameter \"{key}\" was specified more than once"),
                ));
            }
            if request
                .and_then(|r| own(r, "params"))
                .and_then(Value::as_object)
                .is_some_and(|p| p.contains_key(key))
            {
                return Err(refuse(
                    "param-request-conflict",
                    format!("parameter \"{key}\" was specified in both params and scalars"),
                ));
            }
            let Some((_, def)) = table.iter().find(|(k, _)| k == key) else {
                return Err(refuse(
                    "param-unknown",
                    format!("unknown parameter \"{key}\" for loop \"{loop_name}\""),
                ));
            };
            if !def.scalar {
                return Err(invalid(format!(
                    "parameter \"{key}\" is not a scalar parameter"
                )));
            }
            let raw = match raw {
                None | Some(Value::Null) => {
                    return Err(invalid(format!(
                        "scalar parameter \"{key}\" requires a non-empty value"
                    )))
                }
                Some(Value::String(s)) if s.is_empty() => {
                    return Err(invalid(format!(
                        "scalar parameter \"{key}\" requires a non-empty value"
                    )))
                }
                Some(v) => v,
            };
            if raw.is_object() || raw.is_array() {
                return Err(invalid(format!(
                    "scalar parameter \"{key}\" value must be a scalar, got {}",
                    if raw.is_array() { "array" } else { "object" }
                )));
            }
            let value = self.parse_scalar(key, &raw, def)?;
            parsed.insert(key.to_string(), value);
        }
        Ok(parsed)
    }

    /// Validates the request and returns its params with scalars folded in.
    fn normalize_request(
        &self,
        request: Option<&Value>,
        table: &[(String, ParamDef)],
        loop_name: &str,
    ) -> Result<Map<String, Value>, Failure> {
        if let Some(r) = request.filter(|r| !r.is_null()) {
            if !r.is_object() {
                return Err(invalid("request must be an object"));
            }
        }
        let scalars = self.request_scalars(request, table, loop_name)?;
        let mut normalized = Map::new();
        if let Some(params) = request.and_then(|r| own(r, "params")) {
            let Some(params) = params.as_object() else {
                return Err(invalid("request params must be an object"));
            };
            for (key, value) in params {
                if key == "roleTasks" {
                    return Err(refuse(
                        "param-not-requestable",
                        "roleTasks cannot be requested",
                    ));
                }
                if !table.iter().any(|(k, _)| k == key) {
                    return Err(refuse(
                        "param-unknown",
                        format!("unknown parameter \"{key}\" for loop \"{loop_name}\""),
                    ));
                }
                self.domain_value(key, value, "request")?;
                normalized.insert(key.clone(), value.clone());
            }
        }
        normalized.extend(scalars);
        Ok(normalized)
    }

    /// Validates the activity unit's params against its own loop and returns them with its loose seats and role tasks.
    fn activity_declared(
        &self,
        activity: Option<&Value>,
        entries: &Map<String, Value>,
    ) -> Result<Map<String, Value>, Failure> {
        let mut declared = Map::new();
        let Some(activity) = activity.filter(|a| a.is_object()) else {
            return Ok(declared);
        };
        require_plain_object(
            own(activity, "params"),
            "activity unit params must be an object",
        )?;
        if let Some(params) = own(activity, "params").and_then(Value::as_object) {
            declared.extend(params.clone());
        }
        for (key, value) in loose_parts_of(activity) {
            declared.entry(key).or_insert(value);
        }
        let loop_name = match non_empty_string(own(activity, "pattern")) {
            Some(pattern) => entry_named(entries, pattern, "activity pattern")?
                .get("loop")
                .map(text_of)
                .unwrap_or_default(),
            None => "solo".to_string(),
        };
        self.carrier_params(
            &declared,
            &self.table(&loop_name),
            &loop_name,
            "activity unit",
        )?;
        Ok(declared)
    }
}

fn entry_named<'a>(
    entries: &'a Map<String, Value>,
    name: &str,
    label: &str,
) -> Result<&'a Value, Failure> {
    entries.get(name).ok_or_else(|| {
        refuse(
            "unknown-pattern",
            format!("{label} \"{name}\" is not in the catalog"),
        )
    })
}

struct Baseline {
    source: &'static str,
    selector: Value,
}

struct Selection {
    baseline: Baseline,
    name: String,
    is_swap: bool,
    activity_pattern: Option<String>,
}

/// Picks the baseline and the explicit selection from the caller, unit and activity selectors.
fn select_pattern(
    unit: &Value,
    selectors: Option<&Value>,
    in_case: bool,
) -> Result<Selection, Failure> {
    let caller_object = prop(selectors, "callerObject");
    let caller_object_pattern = non_empty_string(caller_object)
        .or_else(|| non_empty_string(caller_object.and_then(|c| own(c, "pattern"))));
    let unit_pattern_value = own(unit, "pattern");
    let unit_pattern = non_empty_string(unit_pattern_value)
        .or_else(|| non_empty_string(unit_pattern_value.and_then(|p| own(p, "pattern"))));
    let caller_string = non_empty_string(prop(selectors, "callerString"));
    let activity_unit = prop(selectors, "activityUnit");
    let activity_pattern = non_empty_string(activity_unit.and_then(|a| own(a, "pattern")));

    let mut explicit: Vec<(String, &'static str, Value)> = Vec::new();
    if let Some(name) = caller_object_pattern {
        explicit.push((
            name.to_string(),
            "caller-object",
            caller_object.cloned().unwrap_or(Value::Null),
        ));
    }
    if let Some(name) = unit_pattern {
        explicit.push((
            name.to_string(),
            "unit",
            unit_pattern_value
                .filter(|p| !p.is_null())
                .cloned()
                .unwrap_or_else(|| json!(name)),
        ));
    }
    if let Some(name) = caller_string {
        explicit.push((name.to_string(), "caller-string", json!(name)));
    }
    for other in explicit.iter().skip(1) {
        if other.0 != explicit[0].0 {
            return Err(refuse(
                "selector-conflict",
                format!(
                    "conflicting explicit selectors: \"{}\" ({}) vs \"{}\" ({})",
                    explicit[0].0, explicit[0].1, other.0, other.1
                ),
            ));
        }
    }
    let activity_baseline = activity_pattern.map(|name| Baseline {
        source: "activity",
        selector: activity_unit
            .and_then(|a| prop(Some(a), "pattern"))
            .or(activity_unit)
            .cloned()
            .unwrap_or_else(|| json!(name)),
    });
    let is_swap =
        in_case && activity_pattern.is_some_and(|a| explicit.first().is_some_and(|e| e.0 != a));
    let selected = match (explicit.first(), activity_pattern) {
        (Some(first), _) => first.0.clone(),
        (None, Some(a)) if in_case => a.to_string(),
        _ => "solo".to_string(),
    };
    let baseline = if is_swap {
        activity_baseline
    } else if let Some((_, source, selector)) = explicit.first() {
        Some(Baseline {
            source,
            selector: selector.clone(),
        })
    } else if in_case && activity_baseline.is_some() {
        activity_baseline
    } else {
        Some(Baseline {
            source: "solo",
            selector: json!("solo"),
        })
    };
    Ok(Selection {
        baseline: baseline.unwrap_or(Baseline {
            source: "solo",
            selector: json!("solo"),
        }),
        name: selected,
        is_swap,
        activity_pattern: activity_pattern.map(str::to_string),
    })
}

/// The slot that won each loop parameter, from the request down to built-in defaults.
#[allow(clippy::too_many_arguments)]
fn layer_params(
    table: &[(String, ParamDef)],
    loop_name: &str,
    entry: &Value,
    loop_config: &Value,
    request_params: &Map<String, Value>,
    selectors: Option<&Value>,
    unit_declared: &Map<String, Value>,
    activity_declared: &Map<String, Value>,
    activity_baseline: bool,
    default_rebuttal: bool,
) -> (Map<String, Value>, Map<String, Value>) {
    let mut effective = Map::new();
    let mut provenance = Map::new();
    let callee = prop(prop(selectors, "callerObject"), "params").and_then(Value::as_object);
    let defaults = own(entry, "defaults").and_then(Value::as_object);
    let config = loop_config.as_object();
    for (param, _) in table {
        let mut take = |value: Value, slot: &str| {
            effective.insert(param.clone(), value);
            provenance.insert(param.clone(), json!(slot));
        };
        if let Some(v) = request_params.get(param) {
            take(v.clone(), "request");
        } else if let Some(v) = callee.and_then(|c| c.get(param)) {
            take(v.clone(), "selector");
        } else if param == "seats" && unit_declared.contains_key("seats") {
            take(unit_declared["seats"].clone(), "unit");
        } else if let Some(v) = activity_declared.get(param).filter(|_| activity_baseline) {
            take(v.clone(), "activity");
        } else if let Some(v) = unit_declared.get(param) {
            take(v.clone(), "unit");
        } else if let Some(v) = defaults.and_then(|d| d.get(param)) {
            take(v.clone(), "pattern-default");
        } else if let Some(v) = config.and_then(|c| c.get(param)) {
            take(v.clone(), "config");
        } else if loop_name == "debate" && param == "rebuttal" {
            take(json!(default_rebuttal), "builtin");
        }
    }
    (effective, provenance)
}

/// Pins every fixed invariant; a violation refuses only when the clashing value came from a slot in `weakening_slots`
/// (any slot when `None`).
fn apply_fixed_invariants(
    invariants: Option<&Value>,
    effective: &mut Map<String, Value>,
    provenance: &mut Map<String, Value>,
    label: &str,
    weakening_slots: Option<&[&str]>,
) -> Result<(), Failure> {
    for (param, invariant) in invariants.and_then(Value::as_object).into_iter().flatten() {
        let Some(fixed) = own(invariant, "fixed") else {
            continue;
        };
        if let Some(current) = effective.get(param) {
            let slot = provenance
                .get(param)
                .and_then(Value::as_str)
                .unwrap_or_default();
            if !deep_equal(current, fixed)
                && weakening_slots.is_none_or(|slots| slots.contains(&slot))
            {
                return Err(refuse(
                    "pattern-invariant-weakened",
                    format!("parameter \"{param}\" violates fixed invariant on {label}"),
                ));
            }
        }
        effective.insert(param.clone(), fixed.clone());
        provenance.insert(param.clone(), json!("pattern-invariant"));
    }
    Ok(())
}

fn check_requested_bounds(
    bounds: Option<&Value>,
    effective: &Map<String, Value>,
    provenance: &Map<String, Value>,
) -> Result<(), Failure> {
    for (param, bound) in bounds.and_then(Value::as_object).into_iter().flatten() {
        let Some(value) = effective.get(param).and_then(Value::as_f64) else {
            continue;
        };
        if provenance.get(param).and_then(Value::as_str) != Some("request") || !bound.is_object() {
            continue;
        }
        let shown = effective[param].to_string();
        if let Some(min) = own(bound, "min").and_then(Value::as_f64) {
            if value < min {
                return Err(refuse(
                    "param-out-of-bounds",
                    format!(
                        "requested \"{param}\" ({shown}) is below loop bound min ({})",
                        own(bound, "min").map(text_of).unwrap_or_default()
                    ),
                ));
            }
        }
        if let Some(max) = own(bound, "max").and_then(Value::as_f64) {
            if value > max {
                return Err(refuse(
                    "param-out-of-bounds",
                    format!(
                        "requested \"{param}\" ({shown}) is above loop bound max ({})",
                        own(bound, "max").map(text_of).unwrap_or_default()
                    ),
                ));
            }
        }
    }
    Ok(())
}

/// Where each checker seat of a reviewed plan came from: the pattern invariant, else the capability, else the default
/// red-team, else the rigor, else its last contribution.
fn checkers_provenance(plan: &[Value]) -> Map<String, Value> {
    let mut provenance = Map::new();
    for seat_plan in plan {
        let contributions: Vec<&str> = own(seat_plan, "contributions")
            .and_then(Value::as_array)
            .map(|l| l.iter().filter_map(Value::as_str).collect())
            .unwrap_or_default();
        let found = contributions
            .iter()
            .find(|c| c.starts_with("pattern-invariant:"))
            .or_else(|| contributions.iter().find(|c| c.starts_with("capability:")))
            .or_else(|| {
                contributions
                    .iter()
                    .find(|c| **c == "code:default-red-team")
            })
            .or_else(|| contributions.iter().find(|c| c.starts_with("rigor:")))
            .or_else(|| contributions.last())
            .copied()
            .unwrap_or("request");
        if let Some(seat) = own(seat_plan, "seat").and_then(Value::as_str) {
            provenance.insert(seat.to_string(), json!(found));
        }
    }
    provenance
}

fn has_reason(reason: Option<&str>) -> bool {
    reason.is_some_and(|r| !js_trim(r).is_empty())
}

/// Resolves collaboration parameters, seats, launch bounds and the pin for a unit run.
pub fn resolve_collaboration(
    options: &ResolveOptions,
    tables: &dyn LoopTables,
    seating: &dyn Seating,
) -> Result<Collaboration, Failure> {
    let empty = json!({});
    let unit = options.unit.unwrap_or(&empty);
    let selectors = options.selectors;
    let runner_config = options.runner_config.unwrap_or(&empty);
    let shipped = options.shipped;
    let resolver = Resolver { tables };

    // A runner config without a patterns section declares no patterns of its own; it must never be read as the map itself.
    let effective_patterns = prop(Some(runner_config), "runner")
        .and_then(|r| prop(Some(r), "patterns"))
        .or_else(|| prop(Some(runner_config), "patterns"))
        .cloned()
        .unwrap_or_else(|| json!({}));
    let shipped_patterns = shipped.and_then(|s| own(s, "patterns"));
    let catalog = check_catalog(
        shipped_patterns,
        Some(&effective_patterns),
        options.origins,
        true,
        tables,
    )?;
    let entries = catalog.entries;

    require_plain_object(own(unit, "params"), "unit params must be an object")?;
    let unit_pattern_object = own(unit, "pattern").filter(|p| p.is_object());
    require_plain_object(
        unit_pattern_object.and_then(|p| own(p, "params")),
        "unit pattern params must be an object",
    )?;
    let mut unit_declared = Map::new();
    if let Some(params) = unit_pattern_object
        .and_then(|p| own(p, "params"))
        .and_then(Value::as_object)
    {
        unit_declared.extend(params.clone());
    }
    if unit.is_object() {
        unit_declared.extend(loose_parts_of(unit));
    }
    if let Some(params) = own(unit, "params").and_then(Value::as_object) {
        unit_declared.extend(params.clone());
    }

    let selection = select_pattern(unit, selectors, options.in_case)?;
    let entry = entry_named(&entries, &selection.name, "pattern")?.clone();
    let loop_name = own(&entry, "loop").map(text_of).unwrap_or_default();
    let table = resolver.table(&loop_name).ok_or_else(|| {
        refuse(
            "unknown-pattern",
            format!(
                "loop \"{loop_name}\" for pattern \"{}\" is not supported",
                selection.name
            ),
        )
    })?;

    let mut activity_entry: Option<Value> = None;
    if selection.is_swap {
        let activity_pattern = selection.activity_pattern.as_deref().unwrap_or_default();
        let found = entry_named(&entries, activity_pattern, "activity pattern")?.clone();
        for param in own(&found, "invariants")
            .and_then(Value::as_object)
            .into_iter()
            .flat_map(|o| o.keys())
        {
            if !table.iter().any(|(k, _)| k == param) {
                return Err(refuse(
                    "pattern-invariant-weakened",
                    format!("loop \"{loop_name}\" does not read invariant parameter \"{param}\" of activity pattern \"{activity_pattern}\""),
                ));
            }
        }
        activity_entry = Some(found);
    }

    let request_params = resolver.normalize_request(options.request, &table, &loop_name)?;
    let has_request_params = !request_params.is_empty();
    if options.in_case && has_request_params && !has_reason(options.reason) {
        return Err(refuse(
            "request-reason-required",
            "a request in a case requires a reason",
        ));
    }

    let caller_object = prop(selectors, "callerObject").filter(|c| c.is_object());
    let caller_params = caller_object.and_then(|c| own(c, "params"));
    require_plain_object(caller_params, "caller object params must be an object")?;
    let some_table = Some(table.clone());
    let as_map = |value: Option<&Value>| {
        value
            .and_then(Value::as_object)
            .cloned()
            .unwrap_or_default()
    };
    resolver.carrier_params(
        &as_map(caller_params),
        &some_table,
        &loop_name,
        "caller object",
    )?;
    resolver.carrier_params(
        &as_map(unit_pattern_object.and_then(|p| own(p, "params"))),
        &some_table,
        &loop_name,
        "unit pattern",
    )?;
    resolver.carrier_params(
        &as_map(own(unit, "params")),
        &some_table,
        &loop_name,
        "unit",
    )?;
    resolver.carrier_params(
        &if unit.is_object() {
            loose_parts_of(unit)
        } else {
            Map::new()
        },
        &some_table,
        &loop_name,
        "unit",
    )?;
    let activity_declared =
        resolver.activity_declared(prop(selectors, "activityUnit"), &entries)?;

    let loop_config = prop(Some(runner_config), "loops")
        .and_then(|l| prop(Some(l), &loop_name))
        .or_else(|| {
            prop(Some(runner_config), "runner")
                .and_then(|r| prop(Some(r), "loops"))
                .and_then(|l| prop(Some(l), &loop_name))
        })
        .cloned()
        .unwrap_or_else(|| json!({}));
    let (mut effective_params, mut provenance_params) = layer_params(
        &table,
        &loop_name,
        &entry,
        &loop_config,
        &request_params,
        selectors,
        &unit_declared,
        &activity_declared,
        selection.baseline.source == "activity" && !selection.is_swap,
        tables.default_rebuttal(),
    );

    let mut floor_checkers: Vec<(String, String)> = Vec::new();
    let mut add_floors = |entry: &Value, name: &str| {
        let at_least = own(entry, "invariants")
            .and_then(|i| own(i, "minCheckers"))
            .and_then(|m| own(m, "atLeast"))
            .and_then(Value::as_array);
        for checker in at_least.into_iter().flatten() {
            floor_checkers.push((text_of(checker), format!("pattern-invariant:{name}")));
        }
    };
    add_floors(&entry, &selection.name);
    if let Some(found) = &activity_entry {
        add_floors(
            found,
            selection.activity_pattern.as_deref().unwrap_or_default(),
        );
    }
    if !floor_checkers.is_empty() && table.iter().any(|(k, _)| k == "minCheckers") {
        let mut list: Vec<Value> = effective_params
            .get("minCheckers")
            .and_then(Value::as_array)
            .cloned()
            .unwrap_or_default();
        for (name, _) in &floor_checkers {
            if !list.iter().any(|v| v.as_str() == Some(name)) {
                list.push(json!(name));
            }
        }
        effective_params.insert("minCheckers".into(), Value::Array(list));
        provenance_params
            .entry("minCheckers")
            .or_insert_with(|| json!("pattern-invariant"));
    }

    apply_fixed_invariants(
        own(&entry, "invariants"),
        &mut effective_params,
        &mut provenance_params,
        &format!("pattern \"{}\"", selection.name),
        Some(&["request", "selector", "unit", "activity"]),
    )?;
    if let Some(found) = &activity_entry {
        apply_fixed_invariants(
            own(found, "invariants"),
            &mut effective_params,
            &mut provenance_params,
            &format!(
                "activity pattern \"{}\"",
                selection.activity_pattern.as_deref().unwrap_or_default()
            ),
            None,
        )?;
    }
    check_requested_bounds(
        own(&loop_config, "bounds"),
        &effective_params,
        &provenance_params,
    )?;

    let floors = (!floor_checkers.is_empty()).then(|| {
        json!({ "minCheckers": floor_checkers.iter().map(|(name, source)| json!({ "name": name, "source": source })).collect::<Vec<_>>() })
    });
    let shipped_by_rigor = shipped
        .and_then(|s| own(s, "loops"))
        .and_then(|l| own(l, "reviewed"))
        .and_then(|r| own(r, "checkersByRigor"))
        .cloned();
    let slot = provenance_params.get("minCheckers").cloned();
    let mut seat_input = Map::new();
    seat_input.insert("loop".into(), json!(loop_name));
    seat_input.insert("params".into(), Value::Object(effective_params.clone()));
    if let Some(floors) = &floors {
        seat_input.insert("floors".into(), floors.clone());
    }
    seat_input.insert("unit".into(), unit.clone());
    seat_input.insert("runnerConfig".into(), runner_config.clone());
    if let Some(slot) = &slot {
        seat_input.insert("slot".into(), slot.clone());
    }
    if let Some(by_rigor) = &shipped_by_rigor {
        seat_input.insert("shippedCheckersByRigor".into(), by_rigor.clone());
    }
    let seat_input = Value::Object(seat_input);
    let seats = seating.resolve_seats(&seat_input)?;
    let launch_bound = seating.seat_launches(&seat_input)?;

    let postures: Map<String, Value> = seats
        .iter()
        .filter_map(|s| {
            let seat = own(s, "seat")
                .and_then(Value::as_str)
                .filter(|n| !n.is_empty())?;
            let posture = own(s, "posture").filter(|p| !p.is_null())?;
            Some((seat.to_string(), posture.clone()))
        })
        .collect();
    let checkers = if loop_name == "reviewed" {
        let mut plan_options = Map::new();
        if let Some(requested) = effective_params.get("minCheckers") {
            plan_options.insert("requested".into(), requested.clone());
        }
        if let Some(floors) = &floors {
            plan_options.insert("floors".into(), floors.clone());
        }
        if let Some(slot) = &slot {
            plan_options.insert("slot".into(), slot.clone());
        }
        if let Some(by_rigor) = &shipped_by_rigor {
            plan_options.insert("shippedCheckersByRigor".into(), by_rigor.clone());
        }
        let plan = seating.checker_plan(unit, runner_config, &Value::Object(plan_options))?;
        checkers_provenance(&plan)
    } else {
        Map::new()
    };

    let mut layer_name = options
        .origins
        .and_then(|_| resolve_layer(options.origins, &selection.name, None));
    if layer_name.is_none() {
        let shipped_entry = shipped_patterns.and_then(|p| own(p, &selection.name));
        layer_name = Some(
            if shipped_entry.is_some_and(|s| deep_equal(&entry, s)) {
                "shipped"
            } else {
                "project"
            }
            .to_string(),
        );
    }
    let role_tasks = effective_params
        .get("roleTasks")
        .cloned()
        .or_else(|| {
            own(&entry, "defaults")
                .and_then(|d| own(d, "roleTasks"))
                .cloned()
        })
        .unwrap_or_else(|| json!({}));
    let has_request = selection.is_swap || has_request_params;
    let pin = json!({
        "requested": if has_request {
            json!({
                "pattern": if selection.is_swap { json!(selection.name) } else { Value::Null },
                "params": request_params,
                "reason": options.reason.filter(|r| !r.is_empty()).map(|r| js_trim(r).to_string()),
            })
        } else { Value::Null },
        "baseline": { "source": selection.baseline.source, "selector": selection.baseline.selector },
        "pattern": { "name": selection.name, "layer": layer_name },
        "effective": {
            "loop": loop_name,
            "params": effective_params,
            "seats": seats,
            "postures": postures,
            "roleTasks": role_tasks,
            "launchBound": launch_bound,
        },
        "provenance": { "params": provenance_params, "checkers": checkers },
    });

    Ok(Collaboration {
        loop_name,
        params: effective_params,
        seats,
        role_tasks,
        launch_bound,
        entry,
        pin,
    })
}
