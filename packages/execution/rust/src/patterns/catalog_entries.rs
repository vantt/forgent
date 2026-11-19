//! The pattern catalog check: shipped and effective entries merged, every entry and parameter checked against its
//! loop, an override of a shipped entry held to its invariants.

use super::retired_keys::{
    detect_retired_pattern_keys, format_retired_key_sentence, RESERVED_PATTERN_NAMES,
    RETIRED_GATED_NAME,
};
use super::CollaborationError;
use crate::unit::js_trim;
use serde_json::{Map, Value};

/// A seat a pattern declares, as the declared-seat check returns it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DeclaredSeat {
    pub seat: String,
    pub role: String,
}

/// What the loop's parameter table says about one parameter.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParamDef {
    /// The value domain name (`integer`, `boolean`, `seats`, ...).
    pub kind: String,
    /// Whether the parameter may be given as a `key=value` scalar.
    pub scalar: bool,
}

/// A refusal of the declared-seat check: a stable `code`, the offset `at` inside the checked value, the sentence.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SeatError {
    pub code: String,
    pub at: Option<String>,
    pub message: String,
}

/// What the catalog reads from the loop and seat modules.
pub trait LoopTables {
    /// The loop names, in declared order.
    fn loop_names(&self) -> Vec<String>;
    /// The parameter names a loop reads; `None` for an unknown loop.
    fn param_table_keys(&self, loop_name: &str) -> Option<Vec<String>>;
    /// The parameter table of a loop with each parameter's definition; `None` for an unknown loop.
    fn param_defs(&self, loop_name: &str) -> Option<Vec<(String, ParamDef)>>;
    /// The rebuttal setting a debate takes when nothing sets it.
    fn default_rebuttal(&self) -> bool;
    /// The checker seats and the role each takes, in declared order.
    fn checker_seats(&self) -> Vec<(String, String)>;
    /// The declared-seat check of `raw`, labelled `label` in its sentences.
    fn check_declared_seats(
        &self,
        raw: &Value,
        label: &str,
    ) -> Result<Vec<DeclaredSeat>, SeatError>;
}

/// The merged entries and every problem found, in the order found.
#[derive(Debug, Clone, PartialEq)]
pub struct CatalogCheck {
    pub entries: Map<String, Value>,
    pub problems: Vec<CollaborationError>,
}

/// Structural equality of two JSON values: arrays by position, objects by key set.
pub fn deep_equal(a: &Value, b: &Value) -> bool {
    a == b
}

fn is_plain_object(value: &Value) -> bool {
    value.is_object()
}

/// The config layer an origin names; the bundled standard layer reads as shipped.
fn layer_name(origin: &Value) -> Option<String> {
    let layer = origin.get("layer")?.as_str()?;
    Some(if layer == "standard" {
        "shipped".to_string()
    } else {
        layer.to_string()
    })
}

fn layer_priority(layer: &str) -> u8 {
    match layer {
        "project" => 3,
        "global" => 2,
        "shipped" | "standard" => 1,
        _ => 0,
    }
}

fn names_path(origin: &Value, full: &str) -> bool {
    origin
        .get("path")
        .and_then(Value::as_str)
        .is_some_and(|path| {
            path == full
                || path
                    .strip_prefix(full)
                    .is_some_and(|rest| rest.starts_with('.') || rest.starts_with('['))
        })
}

/// The strongest layer (project over global over shipped) an origin names for the pattern, or for the field of it
/// when one does; `None` when no origin names it.
pub(super) fn resolve_layer(
    origins: Option<&Value>,
    name: &str,
    field_path: Option<&str>,
) -> Option<String> {
    let origins = origins?.as_array()?;
    let pick =
        |full: &str| -> Vec<&Value> { origins.iter().filter(|o| names_path(o, full)).collect() };
    let mut candidates = match field_path {
        Some(field) => pick(&format!("runner.patterns.{name}.{field}")),
        None => vec![],
    };
    if candidates.is_empty() {
        candidates = pick(&format!("runner.patterns.{name}"));
    }
    let mut best: Option<String> = None;
    let mut best_priority = 0;
    for origin in candidates {
        let layer = layer_name(origin);
        let priority = layer.as_deref().map_or(0, layer_priority);
        if priority > best_priority {
            best_priority = priority;
            best = layer;
        }
    }
    best
}

fn source_of(origins: Option<&Value>, name: &str, field: &str) -> Option<String> {
    resolve_layer(origins, name, Some(field)).or_else(|| resolve_layer(origins, name, None))
}

fn text_of(value: &Value) -> String {
    match value {
        Value::String(s) => s.clone(),
        other => other.to_string(),
    }
}

fn own<'a>(value: &'a Value, key: &str) -> Option<&'a Value> {
    value.as_object().and_then(|o| o.get(key))
}

fn array_at<'a>(value: &'a Value, path: &[&str]) -> Option<&'a Vec<Value>> {
    let mut current = value;
    for key in path {
        current = own(current, key)?;
    }
    current.as_array()
}

/// Reports one problem: code, sentence, config layer, config path.
struct Flagger<'a> {
    problems: &'a mut Vec<CollaborationError>,
}

impl Flagger<'_> {
    fn flag(&mut self, code: &str, message: String, source: Option<String>, path: String) {
        self.problems.push(CollaborationError::new(
            code,
            Some(&message),
            source.as_deref(),
            Some(&path),
        ));
    }
}

struct Check<'a> {
    tables: &'a dyn LoopTables,
    origins: Option<&'a Value>,
}

impl Check<'_> {
    fn checker_names(&self) -> Vec<String> {
        self.tables
            .checker_seats()
            .into_iter()
            .map(|(name, _)| name)
            .collect()
    }

    fn is_checker(&self, name: &str) -> bool {
        self.tables
            .checker_seats()
            .iter()
            .any(|(seat, _)| seat == name)
    }

    /// The seat and role names a `roleTasks` entry of the pattern may address.
    fn allowed_role_task_targets(&self, loop_name: &str, entry: &Value) -> Vec<String> {
        let defaults = array_at(entry, &["defaults", "seats"])
            .cloned()
            .unwrap_or_default();
        let fixed = array_at(entry, &["invariants", "seats", "fixed"])
            .cloned()
            .unwrap_or_default();
        let mut targets: Vec<String> = Vec::new();
        let add = |targets: &mut Vec<String>, name: String| {
            if !targets.contains(&name) {
                targets.push(name);
            }
        };
        let declared: Vec<&Value> = defaults.iter().chain(fixed.iter()).collect();
        let mut producers: Vec<String> = Vec::new();
        for seat in &declared {
            if let Some(name) = own(seat, "seat")
                .and_then(Value::as_str)
                .filter(|s| !js_trim(s).is_empty())
            {
                add(&mut targets, name.to_string());
                if own(seat, "role").and_then(Value::as_str) == Some("producer") {
                    producers.push(name.to_string());
                }
            }
        }
        match loop_name {
            "reviewed" => {
                add(&mut targets, "producer".into());
                if declared.is_empty() {
                    add(&mut targets, "reviewer".into());
                    let minimum = array_at(entry, &["defaults", "minCheckers"])
                        .cloned()
                        .unwrap_or_default();
                    let at_least = array_at(entry, &["invariants", "minCheckers", "atLeast"])
                        .cloned()
                        .unwrap_or_default();
                    for checker in minimum.iter().chain(at_least.iter()) {
                        if let Some(name) = checker.as_str().filter(|n| self.is_checker(n)) {
                            add(&mut targets, name.to_string());
                        }
                    }
                }
            }
            "panel" => {
                add(&mut targets, "panelist".into());
                add(&mut targets, "synthesizer".into());
            }
            "debate" => {
                for name in [
                    "thesis",
                    "antithesis",
                    "thesis-rebuttal",
                    "antithesis-rebuttal",
                    "judge",
                ] {
                    add(&mut targets, name.into());
                }
                for producer in producers {
                    add(&mut targets, format!("{producer}-rebuttal"));
                }
            }
            _ => {}
        }
        targets
    }

    /// The seat count and role rules of a loop, as the refusal sentence when one is broken.
    fn seat_cardinality(
        &self,
        loop_name: &str,
        declared: &[DeclaredSeat],
        label: &str,
    ) -> Result<(), SeatError> {
        let refuse = |text: String| SeatError {
            code: "seat-multiplicity".to_string(),
            at: None,
            message: format!("{label}: {text}"),
        };
        let count = |role: &str| declared.iter().filter(|d| d.role == role).count();
        let reject_other_roles = |allowed: &dyn Fn(&str) -> bool| -> Result<(), SeatError> {
            match declared.iter().find(|d| !allowed(&d.role)) {
                Some(d) => Err(refuse(format!(
                    "a {loop_name} pattern has no use for a seat with role \"{}\"",
                    d.role
                ))),
                None => Ok(()),
            }
        };
        match loop_name {
            "solo" => {
                if declared.len() != 1 || declared[0].role != "producer" {
                    return Err(refuse(
                        "a solo pattern declares exactly one seat, with role \"producer\"".into(),
                    ));
                }
            }
            "reviewed" => {
                let producers = count("producer");
                if producers != 1 {
                    return Err(refuse(format!(
                        "a reviewed pattern declares exactly one seat with role \"producer\", has {producers}"
                    )));
                }
                let checker_roles: Vec<String> = self
                    .tables
                    .checker_seats()
                    .into_iter()
                    .map(|(_, role)| role)
                    .collect();
                reject_other_roles(&|role| {
                    role == "producer" || checker_roles.iter().any(|r| r == role)
                })?;
            }
            "panel" => {
                let (producers, synthesizers) = (count("producer"), count("synthesizer"));
                if producers < 1 {
                    return Err(refuse(format!(
                        "a panel pattern needs at least one seat with role \"producer\", has {producers}"
                    )));
                }
                if synthesizers != 1 {
                    return Err(refuse(format!(
                        "a panel pattern needs exactly one seat with role \"synthesizer\", has {synthesizers}"
                    )));
                }
                reject_other_roles(&|role| role == "producer" || role == "synthesizer")?;
            }
            "debate" => {
                let (producers, judges) = (count("producer"), count("judge"));
                if producers != 2 {
                    return Err(refuse(format!(
                        "a debate pattern needs exactly 2 seats with role \"producer\", has {producers}"
                    )));
                }
                if judges != 1 {
                    return Err(refuse(format!(
                        "a debate pattern needs exactly one seat with role \"judge\", has {judges}"
                    )));
                }
                reject_other_roles(&|role| role == "producer" || role == "judge")?;
            }
            _ => {}
        }
        Ok(())
    }

    #[allow(clippy::too_many_arguments)]
    fn param_domain(
        &self,
        name: &str,
        loop_name: &str,
        param: &str,
        value: &Value,
        section: &str,
        source: &Option<String>,
        flagger: &mut Flagger,
        entry: &Value,
    ) {
        let at = format!("pattern \"{name}\" {section}.{param}");
        let base_path = if section == "invariants" {
            format!("runner.patterns.{name}.invariants.{param}.fixed")
        } else {
            format!("runner.patterns.{name}.defaults.{param}")
        };
        let src = source.clone();
        match param {
            "maxRounds" => {
                let positive = value.as_f64().is_some_and(|n| n.fract() == 0.0 && n > 0.0);
                if !positive {
                    flagger.flag(
                        "param-invalid",
                        format!("{at} must be a positive integer, got {}", value),
                        src,
                        base_path,
                    );
                }
            }
            "minCheckers" => {
                let Some(list) = value.as_array().filter(|l| !l.is_empty()) else {
                    flagger.flag(
                        "param-invalid",
                        format!("{at} must be a non-empty list of checker seat names"),
                        src,
                        base_path,
                    );
                    return;
                };
                for (i, checker) in list.iter().enumerate() {
                    match checker.as_str() {
                        None => {
                            let shown =
                                if checker.is_object() || checker.is_array() || checker.is_null() {
                                    checker.to_string()
                                } else {
                                    text_of(checker)
                                };
                            flagger.flag(
                                "param-invalid",
                                format!("{at} checker seat name must be a string, got {shown}"),
                                src.clone(),
                                format!("{base_path}[{i}]"),
                            );
                        }
                        Some(seat) if !self.is_checker(seat) => flagger.flag(
                            "param-invalid",
                            format!(
                                "{at} contains unknown checker seat \"{seat}\"; valid: [{}]",
                                self.checker_names().join(", ")
                            ),
                            src.clone(),
                            format!("{base_path}[{i}]"),
                        ),
                        Some(_) => {}
                    }
                }
            }
            "rebuttal" => {
                if !value.is_boolean() {
                    flagger.flag(
                        "param-invalid",
                        format!("{at} must be a boolean, got {value}"),
                        src,
                        base_path,
                    );
                }
            }
            "seats" => {
                let outcome = self
                    .tables
                    .check_declared_seats(value, &at)
                    .and_then(|declared| self.seat_cardinality(loop_name, &declared, &at));
                if let Err(err) = outcome {
                    let code = if [
                        "invalid-seats",
                        "invalid-seat-id",
                        "invalid-seat-role",
                        "invalid-seat-tier",
                    ]
                    .contains(&err.code.as_str())
                    {
                        "param-invalid".to_string()
                    } else {
                        err.code.clone()
                    };
                    let path = match err.at.as_deref().filter(|a| !a.is_empty()) {
                        Some(offset) => format!("{base_path}{offset}"),
                        None => base_path,
                    };
                    flagger.flag(&code, err.message, src, path);
                }
            }
            "roleTasks" => {
                let Some(tasks) = value.as_object() else {
                    flagger.flag(
                        "param-invalid",
                        format!("{at} must be an object mapping seat or kind to text"),
                        src,
                        base_path,
                    );
                    return;
                };
                let allowed = self.allowed_role_task_targets(loop_name, entry);
                for (target, text) in tasks {
                    if !text.is_string() {
                        flagger.flag(
                            "param-invalid",
                            format!("{at}[\"{target}\"] task text must be a string"),
                            src.clone(),
                            format!("{base_path}.{target}"),
                        );
                    }
                    if !allowed.contains(target) {
                        flagger.flag(
                            "param-invalid",
                            format!(
                                "{at} target \"{target}\" does not exist for loop \"{loop_name}\" (valid targets: [{}])",
                                allowed.join(", ")
                            ),
                            src.clone(),
                            format!("{base_path}.{target}"),
                        );
                    }
                }
            }
            _ => {}
        }
    }

    /// Reports retired keys, a reserved seatBinding entry, reserved names, non-object entries, unknown entry keys and
    /// non-object defaults or invariants.
    fn declared_entries(&self, patterns: &Map<String, Value>, flagger: &mut Flagger) {
        let origins = self.origins;
        let findings = detect_retired_pattern_keys(Some(&Value::Object(patterns.clone())));
        let retired: Vec<String> = findings
            .iter()
            .map(|f| f.key.trim_start_matches("runner.patterns.").to_string())
            .collect();
        for finding in &findings {
            let name = finding.key.trim_start_matches("runner.patterns.");
            let name = name.split('.').next().unwrap_or(name);
            flagger.flag(
                "config-key-retired",
                format_retired_key_sentence(
                    Some(&Value::String(finding.key.clone())),
                    Some(&finding.instruction),
                ),
                resolve_layer(origins, name, None),
                finding.key.clone(),
            );
        }
        if let Some(binding) = patterns.get("seatBinding") {
            if binding.is_object()
                && ["loop", "promise", "defaults", "invariants"]
                    .iter()
                    .any(|k| own(binding, k).is_some())
            {
                flagger.flag(
                    "config-error",
                    "runner.patterns.seatBinding uses reserved name \"seatBinding\" as a pattern name".into(),
                    resolve_layer(origins, "seatBinding", None),
                    "runner.patterns.seatBinding".into(),
                );
            }
        }
        for (name, entry) in patterns {
            if name == "seatBinding" {
                continue;
            }
            let at = format!("runner.patterns.{name}");
            if RESERVED_PATTERN_NAMES.contains(&name.as_str()) {
                flagger.flag(
                    "config-error",
                    format!("\"{name}\" is a reserved name and cannot be used as a pattern name"),
                    resolve_layer(origins, name, None),
                    at.clone(),
                );
            }
            let Some(object) = entry.as_object() else {
                flagger.flag(
                    "param-invalid",
                    format!("pattern \"{name}\" must be an object"),
                    resolve_layer(origins, name, None),
                    at,
                );
                continue;
            };
            for key in object.keys() {
                let key_retired = retired.contains(&format!("{name}.{key}"));
                if !key_retired
                    && !["promise", "loop", "defaults", "invariants"].contains(&key.as_str())
                {
                    flagger.flag(
                        "param-unknown",
                        format!("pattern \"{name}\" has unknown key \"{key}\""),
                        source_of(origins, name, key),
                        format!("{at}.{key}"),
                    );
                }
            }
            for section in ["defaults", "invariants"] {
                if let Some(value) = object.get(section) {
                    if !is_plain_object(value) {
                        flagger.flag(
                            "param-invalid",
                            format!("pattern \"{name}\" {section} must be an object"),
                            source_of(origins, name, section),
                            format!("{at}.{section}"),
                        );
                    }
                }
            }
        }
    }

    /// An override of a shipped entry may not change its loop or promise, nor drop or change its invariants.
    fn shipped_override(
        &self,
        name: &str,
        shipped: &Value,
        effective: &Value,
        flagger: &mut Flagger,
    ) {
        let origins = self.origins;
        let at = format!("runner.patterns.{name}");
        let primitive_differs = |a: Option<&Value>, b: Option<&Value>| match (a, b) {
            (Some(x), Some(y)) if !x.is_object() && !x.is_array() => x != y,
            _ => true,
        };
        if own(effective, "loop").is_some()
            && primitive_differs(own(effective, "loop"), own(shipped, "loop"))
        {
            flagger.flag(
                "pattern-invariant-weakened",
                format!(
                    "pattern \"{name}\" cannot change shipped loop \"{}\" to \"{}\"",
                    own(shipped, "loop")
                        .map(text_of)
                        .unwrap_or_else(|| "undefined".into()),
                    own(effective, "loop").map(text_of).unwrap_or_default()
                ),
                source_of(origins, name, "loop"),
                format!("{at}.loop"),
            );
        }
        if own(effective, "promise").is_some()
            && primitive_differs(own(effective, "promise"), own(shipped, "promise"))
        {
            flagger.flag(
                "pattern-invariant-weakened",
                format!("pattern \"{name}\" cannot change shipped promise"),
                source_of(origins, name, "promise"),
                format!("{at}.promise"),
            );
        }
        let Some(shipped_invariants) = own(shipped, "invariants").and_then(Value::as_object) else {
            return;
        };
        let Some(effective_invariants) = own(effective, "invariants").and_then(Value::as_object)
        else {
            return;
        };
        for (param, shipped_inv) in shipped_invariants {
            let src = resolve_layer(origins, name, Some(&format!("invariants.{param}")))
                .or_else(|| source_of(origins, name, "invariants"));
            let keep_at_least = format!("pattern \"{name}\" invariant for \"{param}\" must keep atLeast list from shipped entry");
            let changed_fixed =
                format!("pattern \"{name}\" changed or removed fixed invariant for \"{param}\"");
            let mut weakened = |message: String, path: String| {
                flagger.flag("pattern-invariant-weakened", message, src.clone(), path);
            };
            let shipped_at_least = own(shipped_inv, "atLeast");
            if effective_invariants.is_empty() {
                weakened(
                    if shipped_at_least.is_some() {
                        keep_at_least
                    } else {
                        changed_fixed
                    },
                    format!("{at}.invariants"),
                );
                continue;
            }
            let Some(effective_inv) = effective_invariants.get(param) else {
                continue;
            };
            let truthy_object = effective_inv.is_object() || effective_inv.is_array();
            if let Some(required_list) = shipped_at_least {
                match own(effective_inv, "atLeast")
                    .and_then(Value::as_array)
                    .filter(|_| truthy_object)
                {
                    None => weakened(keep_at_least, format!("{at}.invariants.{param}.atLeast")),
                    Some(present) => {
                        for required in required_list.as_array().into_iter().flatten() {
                            if !present.contains(required) {
                                weakened(
                                    format!(
                                        "pattern \"{name}\" dropped invariant atLeast element \"{}\" for \"{param}\"",
                                        text_of(required)
                                    ),
                                    format!("{at}.invariants.{param}.atLeast"),
                                );
                            }
                        }
                    }
                }
            }
            if let Some(shipped_fixed) = own(shipped_inv, "fixed") {
                let same = truthy_object
                    && own(effective_inv, "fixed").is_some_and(|f| deep_equal(f, shipped_fixed));
                if !same {
                    weakened(changed_fixed, format!("{at}.invariants.{param}.fixed"));
                }
            }
        }
    }

    fn custom_entry(&self, name: &str, merged: &Value, flagger: &mut Flagger) {
        let source = resolve_layer(self.origins, name, None);
        let promise_ok = own(merged, "promise")
            .and_then(Value::as_str)
            .is_some_and(|p| !js_trim(p).is_empty());
        if !promise_ok {
            flagger.flag(
                "param-invalid",
                format!("custom pattern \"{name}\" must declare a non-empty \"promise\""),
                source.clone(),
                format!("runner.patterns.{name}.promise"),
            );
        }
        let names = self.tables.loop_names();
        let loop_ok = own(merged, "loop")
            .and_then(Value::as_str)
            .is_some_and(|l| names.iter().any(|n| n == l));
        if !loop_ok {
            flagger.flag(
                "param-invalid",
                format!(
                    "custom pattern \"{name}\" must declare a valid \"loop\" from [{}], got: {}",
                    names.join(", "),
                    own(merged, "loop").map_or("undefined".to_string(), |l| l.to_string())
                ),
                source,
                format!("runner.patterns.{name}.loop"),
            );
        }
    }

    /// One invariant: exactly one of `atLeast` (minCheckers only) or `fixed` (any parameter but minCheckers).
    #[allow(clippy::too_many_arguments)]
    fn invariant_form(
        &self,
        name: &str,
        loop_name: &str,
        param: &str,
        invariant: &Map<String, Value>,
        source: &Option<String>,
        merged: &Value,
        flagger: &mut Flagger,
    ) {
        let at = format!("runner.patterns.{name}.invariants.{param}");
        let has_at_least = invariant.contains_key("atLeast");
        let has_fixed = invariant.contains_key("fixed");
        if (!has_at_least && !has_fixed) || (has_at_least && has_fixed) || invariant.len() != 1 {
            flagger.flag(
                "param-invalid",
                format!("pattern \"{name}\" invariant for \"{param}\" must declare exactly one form: \"atLeast\" or \"fixed\""),
                source.clone(),
                at,
            );
            return;
        }
        if has_at_least {
            let at_least = &invariant["atLeast"];
            if param != "minCheckers" {
                flagger.flag(
                    "param-invalid",
                    format!("pattern \"{name}\" invariant \"atLeast\" is only valid for list parameters, got \"{param}\""),
                    source.clone(),
                    format!("{at}.atLeast"),
                );
            } else if let Some(list) = at_least.as_array().filter(|l| !l.is_empty()) {
                for (i, checker) in list.iter().enumerate() {
                    match checker.as_str() {
                        None => flagger.flag(
                            "param-invalid",
                            format!("pattern \"{name}\" invariant atLeast for \"{param}\" checker seat name must be a string"),
                            source.clone(),
                            format!("{at}.atLeast[{i}]"),
                        ),
                        Some(seat) if !self.is_checker(seat) => flagger.flag(
                            "param-invalid",
                            format!(
                                "pattern \"{name}\" invariant atLeast \"{seat}\" is not a valid checker seat [{}]",
                                self.checker_names().join(", ")
                            ),
                            source.clone(),
                            format!("{at}.atLeast[{i}]"),
                        ),
                        Some(_) => {}
                    }
                }
            } else {
                flagger.flag(
                    "param-invalid",
                    format!("pattern \"{name}\" invariant atLeast for \"{param}\" must be a non-empty array of checker seats"),
                    source.clone(),
                    format!("{at}.atLeast"),
                );
            }
        }
        if has_fixed {
            if param == "minCheckers" {
                flagger.flag(
                    "param-invalid",
                    format!("pattern \"{name}\" invariant for list parameter \"minCheckers\" must use \"atLeast\", not \"fixed\""),
                    source.clone(),
                    format!("{at}.fixed"),
                );
            } else {
                self.param_domain(
                    name,
                    loop_name,
                    param,
                    &invariant["fixed"],
                    "invariants",
                    source,
                    flagger,
                    merged,
                );
            }
        }
    }

    /// The merged entry's defaults and invariants against its loop's parameter table.
    fn merged_sections(&self, name: &str, merged: &Value, flagger: &mut Flagger) {
        let origins = self.origins;
        let loop_name = own(merged, "loop")
            .and_then(Value::as_str)
            .unwrap_or_default();
        let table = self.tables.param_table_keys(loop_name).unwrap_or_default();
        let at = format!("runner.patterns.{name}");
        for (section, label) in [("defaults", "default"), ("invariants", "invariant")] {
            let Some(value) = own(merged, section) else {
                continue;
            };
            let Some(params) = value.as_object() else {
                flagger.flag(
                    "param-invalid",
                    format!("pattern \"{name}\" {section} must be an object"),
                    source_of(origins, name, section),
                    format!("{at}.{section}"),
                );
                continue;
            };
            for (param, param_value) in params {
                let src = source_of(origins, name, &format!("{section}.{param}"));
                if !table.contains(param) {
                    flagger.flag(
                        "param-unknown",
                        format!("pattern \"{name}\" {label} parameter \"{param}\" is not read by loop \"{loop_name}\""),
                        src,
                        format!("{at}.{section}.{param}"),
                    );
                    continue;
                }
                if section == "defaults" {
                    self.param_domain(
                        name,
                        loop_name,
                        param,
                        param_value,
                        "defaults",
                        &src,
                        flagger,
                        merged,
                    );
                } else if let Some(invariant) = param_value.as_object() {
                    self.invariant_form(name, loop_name, param, invariant, &src, merged, flagger);
                } else {
                    flagger.flag(
                        "param-invalid",
                        format!("pattern \"{name}\" invariant for \"{param}\" must be an object"),
                        src,
                        format!("{at}.invariants.{param}"),
                    );
                }
            }
        }
    }
}

/// The shipped entry overlaid by the effective entry's promise, loop, defaults and invariants.
fn merge_entry(shipped: Option<&Value>, effective: Option<&Value>) -> Value {
    match (shipped, effective) {
        (Some(s), None) => s.clone(),
        (None, Some(e)) => e.clone(),
        (Some(s), Some(e)) => {
            let mut merged = s.clone();
            let Some(target) = merged.as_object_mut() else {
                return merged;
            };
            for key in ["promise", "loop"] {
                if let Some(v) = own(e, key) {
                    target.insert(key.to_string(), v.clone());
                }
            }
            for section in ["defaults", "invariants"] {
                if let Some(overlay) = own(e, section).and_then(Value::as_object) {
                    let mut base = target
                        .get(section)
                        .and_then(Value::as_object)
                        .cloned()
                        .unwrap_or_default();
                    for (k, v) in overlay {
                        base.insert(k.clone(), v.clone());
                    }
                    target.insert(section.to_string(), Value::Object(base));
                }
            }
            merged
        }
        (None, None) => Value::Null,
    }
}

/// Validates the pattern catalog entries and merges them: `shipped` and `effective` are the pattern maps, `origins`
/// the list of `{ path, layer }` the config read recorded. With `throw_on_error` the first problem is the error.
pub fn check_catalog(
    shipped: Option<&Value>,
    effective: Option<&Value>,
    origins: Option<&Value>,
    throw_on_error: bool,
    tables: &dyn LoopTables,
) -> Result<CatalogCheck, CollaborationError> {
    let empty = Map::new();
    let shipped = shipped.and_then(Value::as_object).unwrap_or(&empty);
    let effective = effective.and_then(Value::as_object).unwrap_or(&empty);
    let mut problems: Vec<CollaborationError> = Vec::new();
    let check = Check { tables, origins };
    {
        let mut flagger = Flagger {
            problems: &mut problems,
        };
        check.declared_entries(effective, &mut flagger);
    }

    let mut names: Vec<&String> = shipped.keys().collect();
    for name in effective.keys() {
        if !names.contains(&name) {
            names.push(name);
        }
    }
    names.retain(|n| {
        !RESERVED_PATTERN_NAMES.contains(&n.as_str()) && n.as_str() != RETIRED_GATED_NAME
    });

    let loops = tables.loop_names();
    let mut entries = Map::new();
    for name in names {
        let shipped_entry = shipped.get(name);
        let effective_entry = effective.get(name);
        if let Some(e) = effective_entry {
            if !is_plain_object(e) {
                if let Some(s) = shipped_entry {
                    entries.insert(name.clone(), s.clone());
                }
                continue;
            }
        }
        let merged = merge_entry(shipped_entry, effective_entry);
        let mut flagger = Flagger {
            problems: &mut problems,
        };
        if let (Some(s), Some(e)) = (shipped_entry, effective_entry) {
            check.shipped_override(name, s, e, &mut flagger);
        }
        if shipped_entry.is_none() {
            check.custom_entry(name, &merged, &mut flagger);
        }
        if own(&merged, "loop")
            .and_then(Value::as_str)
            .is_some_and(|l| loops.iter().any(|n| n == l))
        {
            check.merged_sections(name, &merged, &mut flagger);
        }
        entries.insert(name.clone(), merged);
    }

    if throw_on_error {
        if let Some(first) = problems.first() {
            return Err(first.clone());
        }
    }
    Ok(CatalogCheck { entries, problems })
}
