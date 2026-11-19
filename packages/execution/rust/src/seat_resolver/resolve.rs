use super::capability::{capability_of, min_checkers_of, rigor_rank};
use super::value::{get, items, js_json, nn, str_at, truthy};
use super::SeatResolutionError;
use serde_json::{json, Map, Value};

pub const SEAT_ROLES: [&str; 5] = ["producer", "synthesizer", "reviewer", "red-team", "judge"];
pub const LOOP_NAMES: [&str; 4] = ["solo", "reviewed", "panel", "debate"];
/// The pseudo-seats the runner itself writes results for; never declared, never bound.
pub const VERIFY_SEAT: &str = "verify";
pub const SYNC_SEAT: &str = "sync";
pub const RESERVED_SEAT_IDS: [&str; 2] = ["verify", "verifier"];
const DECLARED_KEYS: [&str; 4] = ["seat", "role", "persona", "tier"];

/// The checker seats a reviewed unit can name, with the role each takes and whether its result is a verdict.
/// `tester` is a reviewer-role seat for taste lookup only, and backs no verdict.
pub const CHECKER_SEATS: [(&str, &str, bool); 3] = [
    ("reviewer", "reviewer", true),
    ("red-team", "red-team", true),
    ("tester", "reviewer", false),
];

fn checker(name: &str) -> Option<(&'static str, bool)> {
    CHECKER_SEATS
        .iter()
        .find(|(n, _, _)| *n == name)
        .map(|(_, role, verdict)| (*role, *verdict))
}

fn posture(overrides: &[(&str, bool)]) -> Value {
    let mut map = Map::new();
    for key in [
        "readOnly",
        "writer",
        "forceOutOfProcess",
        "stance",
        "verdict",
    ] {
        map.insert(key.to_string(), json!(false));
    }
    for (key, on) in overrides {
        map.insert((*key).to_string(), json!(on));
    }
    Value::Object(map)
}

fn no_writes(unit: &Value) -> bool {
    items(get(unit, "writes")).is_empty()
}

// ---- rigor and checker composition ------------------------------------------------------------------

/// The rigor a unit runs at, `fallback` when neither the unit nor its capability names one. The rigor itself is
/// the bind's answer ([`crate::bind::effective_rigor`]), the one derivation of effective rigor in the crate.
pub fn unit_rigor(
    unit: &Value,
    runner_config: &Value,
    fallback: Option<&str>,
) -> Result<Option<String>, SeatResolutionError> {
    let rigor =
        crate::bind::effective_rigor(unit, runner_config).map_err(|error| SeatResolutionError {
            class: error.name,
            ..SeatResolutionError::range(error.message)
        })?;
    Ok(rigor.or(fallback).map(str::to_string))
}

/// One checker of a reviewed unit's plan with the provenance strings that put it there.
#[derive(Debug, Clone, PartialEq)]
pub struct CheckerPlanEntry {
    pub seat: String,
    pub contributions: Vec<String>,
}

/// Where a checker plan reads its inputs from (the `options` of the Node function).
#[derive(Debug, Default, Clone)]
pub struct PlanOptions<'a> {
    pub requested: Option<&'a Value>,
    pub floors: Option<&'a Value>,
    pub slot: Option<&'a str>,
    pub shipped_checkers_by_rigor: Option<&'a Value>,
}

fn row_of<'a>(table: Option<&'a Value>, name: &str) -> Option<&'a Value> {
    nn(table.and_then(Value::as_object).and_then(|t| t.get(name)))
}

/// The checker plan of a reviewed unit: rigor row, capability `minCheckers`, floors, then requested ones.
pub fn checker_plan_of(
    unit: &Value,
    runner_config: &Value,
    options: &PlanOptions,
) -> Result<Vec<CheckerPlanEntry>, SeatResolutionError> {
    let mut plan: Vec<CheckerPlanEntry> = Vec::new();
    let mut add = |seat: &str, contribution: Option<String>| {
        let at = match plan.iter().position(|p| p.seat == seat) {
            Some(i) => i,
            None => {
                plan.push(CheckerPlanEntry {
                    seat: seat.to_string(),
                    contributions: Vec::new(),
                });
                plan.len() - 1
            }
        };
        if let Some(c) = contribution {
            if !plan[at].contributions.contains(&c) {
                plan[at].contributions.push(c);
            }
        }
    };

    // 1. The rigor row of checkersByRigor, configured then shipped; a rigor below standard with no row of its own
    // falls back to the standard row of the same tables.
    let rigor = unit_rigor(unit, runner_config, Some("standard"))?.unwrap_or_default();
    let configured = get(runner_config, "loops")
        .and_then(|l| get(l, "reviewed"))
        .and_then(|r| get(r, "checkersByRigor"))
        .or_else(|| {
            get(runner_config, "runner")
                .and_then(|r| get(r, "loops"))
                .and_then(|l| get(l, "reviewed"))
                .and_then(|r| get(r, "checkersByRigor"))
        });
    let shipped = options.shipped_checkers_by_rigor;
    let fallback_standard =
        rigor_rank(&rigor).is_some_and(|r| r < rigor_rank("standard").unwrap_or(2));
    let from_rigor = row_of(configured, &rigor)
        .or_else(|| row_of(shipped, &rigor))
        .or_else(|| {
            fallback_standard
                .then(|| row_of(configured, "standard").or_else(|| row_of(shipped, "standard")))
                .flatten()
        })
        .filter(|row| truthy(row));
    let Some(from_rigor) = from_rigor else {
        return Err(SeatResolutionError::new(
            format!(
                "missing checkersByRigor for rigor \"{rigor}\" (neither runnerConfig nor shippedCheckersByRigor defines it{})",
                if fallback_standard { " or a standard row" } else { "" }
            ),
            "configuration-error",
        ));
    };
    for seat in items(Some(from_rigor)) {
        if let Some(seat) = seat.as_str() {
            add(seat, Some(format!("rigor:{rigor}")));
        }
    }

    // 2. The capability's minCheckers (exact key, then `<prefix>:*`; the first defined wins, [] clears the
    // default), else the shipped default.
    let capability = capability_of(unit);
    let min_list = |min: &Value| -> Vec<String> {
        match min {
            Value::Array(list) => list
                .iter()
                .filter_map(|v| v.as_str().map(str::to_string))
                .collect(),
            other if truthy(other) => other.as_str().map(str::to_string).into_iter().collect(),
            _ => Vec::new(),
        }
    };
    if let Some((key, min)) = min_checkers_of(runner_config, capability) {
        for seat in min_list(min) {
            add(&seat, Some(format!("capability:{key}")));
        }
    } else if capability.is_some_and(|c| c == "code" || c.starts_with("code:")) {
        // The shipped default: `code` and `code:*` carry a red-team checker.
        add("red-team", Some("code:default-red-team".to_string()));
    }

    // 3. Floors: { minCheckers: [{ name, source }] }
    if let Some(floors) = options.floors.and_then(|f| nn(f.get("minCheckers"))) {
        let list: Vec<&Value> = match floors {
            Value::Array(l) => l.iter().collect(),
            other => vec![other],
        };
        for item in list {
            let seat = match item {
                Value::String(s) => s.clone(),
                _ => get(item, "name")
                    .filter(|v| truthy(v))
                    .or_else(|| get(item, "seat"))
                    .and_then(Value::as_str)
                    .unwrap_or_default()
                    .to_string(),
            };
            let source = str_at(item, "source")
                .filter(|s| !s.is_empty())
                .unwrap_or("pattern-invariant");
            let contribution = if source.starts_with("pattern-invariant:") {
                source.to_string()
            } else {
                format!("pattern-invariant:{source}")
            };
            add(&seat, Some(contribution));
        }
    }

    // 4. Requested / params
    let slot_contribution = |slot: Option<&str>| match slot {
        None | Some("") | Some("request") => "request".to_string(),
        Some(s) if s.starts_with("param:") => s.to_string(),
        Some(s) => format!("param:{s}"),
    };
    if let Some(req) = options.requested.filter(|r| truthy(r)) {
        let list: Vec<&Value> = match req {
            Value::Array(l) => l.iter().collect(),
            other => vec![other],
        };
        for item in list {
            match item {
                Value::String(s) => add(s, Some(slot_contribution(options.slot))),
                Value::Object(_) => {
                    let seat = get(item, "name")
                        .filter(|v| truthy(v))
                        .or_else(|| get(item, "seat"))
                        .and_then(Value::as_str)
                        .unwrap_or_default();
                    let own_slot = str_at(item, "slot")
                        .filter(|s| !s.is_empty())
                        .or(options.slot);
                    let source = str_at(item, "source")
                        .filter(|s| !s.is_empty())
                        .map(str::to_string)
                        .unwrap_or_else(|| slot_contribution(own_slot));
                    add(seat, Some(source));
                }
                _ => {}
            }
        }
    }

    // 5. Validation
    for entry in &plan {
        if checker(&entry.seat).is_none() {
            return Err(SeatResolutionError::new(
                format!(
                    "\"{}\" is not a checker seat; valid: [{}]",
                    entry.seat,
                    CHECKER_SEATS
                        .iter()
                        .map(|(n, _, _)| *n)
                        .collect::<Vec<_>>()
                        .join(", ")
                ),
                "param-invalid",
            ));
        }
    }
    Ok(plan)
}

/// At high or critical effective rigor every seat of the unit runs on its own provider family; at standard or
/// low only checkers differ from the producer.
pub fn requires_distinct_families(
    unit: &Value,
    runner_config: &Value,
) -> Result<bool, SeatResolutionError> {
    let rigor = unit_rigor(unit, runner_config, Some("standard"))?;
    Ok(matches!(rigor.as_deref(), Some("high" | "critical")))
}

// ---- declared seats ---------------------------------------------------------------------------------

fn fail(displayed: String, at: String, detail: String, code: &str) -> SeatResolutionError {
    let mut error = SeatResolutionError::new(format!("{displayed} {detail}"), code);
    error.at = Some(at);
    error.detail = Some(detail);
    error
}

/// Validate declared seats `[{ seat, role, persona?, tier? }]` and return them as plain entries in the declared
/// order. Ids follow Convention's seat id rule and are unique; roles come from [`SEAT_ROLES`]. A caller that
/// owns the tier ladder passes it as `tiers` to have each seat's `tier` checked against it.
pub fn check_declared_seats(
    raw: &Value,
    label: &str,
    tiers: Option<&[String]>,
) -> Result<Vec<Value>, SeatResolutionError> {
    let list = match raw {
        Value::Array(list) if !list.is_empty() => list,
        _ => {
            return Err(fail(
                label.to_string(),
                String::new(),
                "must be a non-empty array of { seat, role }".into(),
                "invalid-seats",
            ))
        }
    };
    let rule = fgos_convention::packaged_rules().identifier("seat-id");
    let mut seen: Vec<&str> = Vec::new();
    let mut out = Vec::new();
    for (index, entry) in list.iter().enumerate() {
        let at = format!("{label}[{index}]");
        let Some(map) = entry.as_object() else {
            return Err(fail(
                at,
                format!("[{index}]"),
                "must be an object { seat, role, persona?, tier? }".into(),
                "invalid-seats",
            ));
        };
        for key in map.keys() {
            if !DECLARED_KEYS.contains(&key.as_str()) {
                return Err(fail(
                    at,
                    format!("[{index}].{key}"),
                    format!("has unknown key \"{key}\"; a seat declares only seat, role, persona and tier"),
                    "invalid-seats",
                ));
            }
        }
        let seat_value = entry.get("seat");
        let seat_id = seat_value.and_then(Value::as_str);
        if let Some(id) = seat_id.filter(|id| RESERVED_SEAT_IDS.contains(id)) {
            return Err(fail(
                format!("{at}.seat"),
                format!("[{index}].seat"),
                format!(
                    "\"{id}\" is a reserved seat id; reserved: [{}]",
                    RESERVED_SEAT_IDS.join(", ")
                ),
                "param-invalid",
            ));
        }
        let problem = match (seat_id, rule) {
            (Some(id), Some(rule)) => rule.check(id).err(),
            _ => Some("invalid-identifier"),
        };
        if let Some(problem) = problem {
            let (reserved, max) =
                rule.map_or((Vec::new(), 40), |r| (r.reserved.clone(), r.max_length));
            let detail = if problem == "reserved-identifier" {
                format!(
                    "\"{}\" is reserved ({})",
                    seat_id.unwrap_or_default(),
                    reserved.join(", ")
                )
            } else {
                format!(
                    "{} must be 1-{max} characters: a lowercase letter, then lowercase letters, digits or \"-\"",
                    js_json(seat_value)
                )
            };
            return Err(fail(
                format!("{at}.seat"),
                format!("[{index}].seat"),
                detail,
                "invalid-seat-id",
            ));
        }
        let seat_id = seat_id.unwrap_or_default();
        if seen.contains(&seat_id) {
            return Err(fail(
                format!("{at}.seat"),
                format!("[{index}].seat"),
                format!("\"{seat_id}\" is declared twice in this unit"),
                "duplicate-seat",
            ));
        }
        seen.push(seat_id);
        let role = entry.get("role");
        let Some(role_name) = role
            .and_then(Value::as_str)
            .filter(|r| SEAT_ROLES.contains(r))
        else {
            return Err(fail(
                format!("{at}.role"),
                format!("[{index}].role"),
                format!(
                    "must be one of [{}], got {}",
                    SEAT_ROLES.join(", "),
                    js_json(role)
                ),
                "invalid-seat-role",
            ));
        };
        let persona = entry.get("persona");
        let persona_text = persona
            .and_then(Value::as_str)
            .map(str::trim)
            .filter(|p| !p.is_empty());
        if persona.is_some() && persona_text.is_none() {
            return Err(fail(
                format!("{at}.persona"),
                format!("[{index}].persona"),
                "must be a non-empty string".into(),
                "invalid-seats",
            ));
        }
        let tier = entry.get("tier");
        if let (Some(tier), Some(tiers)) = (tier, tiers) {
            if !tier.as_str().is_some_and(|t| tiers.iter().any(|x| x == t)) {
                return Err(fail(
                    format!("{at}.tier"),
                    format!("[{index}].tier"),
                    format!(
                        "must be one of [{}], got {}",
                        tiers.join(", "),
                        js_json(Some(tier))
                    ),
                    "invalid-seat-tier",
                ));
            }
        }
        let mut seat = Map::new();
        seat.insert("seat".into(), json!(seat_id));
        seat.insert("role".into(), json!(role_name));
        if let Some(p) = persona_text {
            seat.insert("persona".into(), json!(p));
        }
        if let Some(t) = tier.filter(|t| truthy(t)) {
            seat.insert("tier".into(), t.clone());
        }
        out.push(Value::Object(seat));
    }
    Ok(out)
}

/// What the pattern params declare: seats already carrying a posture stand as they are.
enum Declared {
    Resolved(Vec<Value>),
    Checked(Vec<Value>),
}

fn declared_seats_of(params: &Value) -> Result<Option<Declared>, SeatResolutionError> {
    let Some(raw) = params.get("seats") else {
        return Ok(None);
    };
    if let Value::Array(list) = raw {
        if !list.is_empty()
            && list
                .iter()
                .all(|d| d.is_object() && get(d, "posture").is_some_and(truthy))
        {
            return Ok(Some(Declared::Resolved(list.clone())));
        }
    }
    Ok(Some(Declared::Checked(check_declared_seats(
        raw,
        "params.seats",
        None,
    )?)))
}

fn with_declared(declared: &Value, base: Value) -> Value {
    let mut map = base.as_object().cloned().unwrap_or_default();
    for key in ["persona", "tier"] {
        if let Some(v) = declared.get(key).filter(|v| truthy(v)) {
            map.insert(key.into(), v.clone());
        }
    }
    Value::Object(map)
}

fn seat_of(declared: &Value, posture: Value) -> Value {
    with_declared(
        declared,
        json!({ "seat": declared["seat"], "role": declared["role"], "posture": posture }),
    )
}

#[derive(Clone, Copy)]
enum Count {
    Exactly(usize),
    AtLeastOne,
}

fn require_roles(
    loop_name: &str,
    declared: &[Value],
    expected: &[(&str, Count)],
) -> Result<(), SeatResolutionError> {
    let count = |role: &str| {
        declared
            .iter()
            .filter(|d| str_at(d, "role") == Some(role))
            .count()
    };
    for (role, n) in expected {
        let have = count(role);
        let ok = match n {
            Count::AtLeastOne => have >= 1,
            Count::Exactly(n) => have == *n,
        };
        if !ok {
            let wanted = match n {
                Count::AtLeastOne => "at least one".to_string(),
                Count::Exactly(n) => n.to_string(),
            };
            return Err(SeatResolutionError::new(
                format!(
                    "a {loop_name} unit needs {wanted} seat(s) with role \"{role}\", has {have}"
                ),
                "seat-multiplicity",
            ));
        }
    }
    for d in declared {
        let role = str_at(d, "role").unwrap_or_default();
        if !expected.iter().any(|(r, _)| *r == role) {
            return Err(SeatResolutionError::new(
                format!("a {loop_name} unit has no use for a seat with role \"{role}\""),
                "seat-multiplicity",
            ));
        }
    }
    Ok(())
}

// ---- the resolver -----------------------------------------------------------------------------------

/// What `resolveSeats` reads. `loop_name` wins over `pattern` (a name or `{ pattern, params }`).
#[derive(Debug, Default, Clone)]
pub struct ResolveOptions {
    pub loop_name: Option<String>,
    pub pattern: Option<Value>,
    pub params: Option<Value>,
    pub floors: Option<Value>,
    pub unit: Value,
    pub runner_config: Value,
    pub shipped_checkers_by_rigor: Option<Value>,
    pub slot: Option<String>,
}

impl ResolveOptions {
    fn loop_of(&self) -> String {
        self.loop_name
            .clone()
            .or_else(|| match &self.pattern {
                Some(Value::String(s)) => Some(s.clone()),
                Some(p) => str_at(p, "pattern").map(str::to_string),
                None => None,
            })
            .unwrap_or_else(|| "solo".to_string())
    }

    fn raw_params(&self) -> Option<Value> {
        self.params.clone().or_else(|| {
            self.pattern
                .as_ref()
                .filter(|p| p.is_object())
                .and_then(|p| p.get("params"))
                .cloned()
        })
    }
}

/// The ordered seats a unit's pattern fills: solo, one `producer` (or its one declared seat); reviewed,
/// `producer` then one seat per checker (declared checker roles must match the required checkers exactly);
/// panel, the declared producers as members and one synthesizer; debate, two producer sides then one judge.
pub fn resolve_seats(options: &ResolveOptions) -> Result<Vec<Value>, SeatResolutionError> {
    let mut loop_name = options.loop_of();
    let mut params_in = options.raw_params();
    if loop_name == "research-fan-out" {
        loop_name = "panel".to_string();
        params_in = params_in.or_else(|| {
            Some(json!({ "seats": [
                { "seat": "member-1", "role": "producer" },
                { "seat": "member-2", "role": "producer" },
                { "seat": "member-3", "role": "producer" },
                { "seat": "synthesizer", "role": "synthesizer" },
            ]}))
        });
    }
    let mut params = match params_in {
        Some(Value::Object(map)) => Value::Object(map),
        _ => json!({}),
    };
    let unit = &options.unit;
    if params.get("seats").is_none() {
        if let Some(seats) = unit.get("seats") {
            params["seats"] = seats.clone();
        }
    }
    let declared = match declared_seats_of(&params)? {
        Some(Declared::Resolved(seats)) => return Ok(seats),
        Some(Declared::Checked(seats)) => Some(seats),
        None => None,
    };
    let read_only = no_writes(unit);
    match loop_name.as_str() {
        "solo" => {
            if let Some(declared) = declared {
                if declared.len() != 1 || str_at(&declared[0], "role") != Some("producer") {
                    return Err(SeatResolutionError::new(
                        "a solo unit declares exactly one seat, with role \"producer\"",
                        "seat-multiplicity",
                    ));
                }
                return Ok(vec![seat_of(
                    &declared[0],
                    posture(&[("readOnly", read_only), ("writer", true)]),
                )]);
            }
            Ok(vec![json!({ "seat": "producer", "role": "producer",
                "posture": posture(&[("readOnly", read_only), ("writer", true)]) })])
        }
        "reviewed" => resolve_reviewed(options, &params, declared, read_only),
        "panel" => {
            let declared = declared.ok_or_else(|| {
                SeatResolutionError::new(
                    "a panel unit must declare its seats: producers as members and one synthesizer",
                    "seats-required",
                )
            })?;
            require_roles(
                "panel",
                &declared,
                &[
                    ("producer", Count::AtLeastOne),
                    ("synthesizer", Count::Exactly(1)),
                ],
            )?;
            let by_role = |role: &str| {
                declared
                    .iter()
                    .filter(move |d| str_at(d, "role") == Some(role))
                    .cloned()
                    .collect::<Vec<_>>()
            };
            let mut seats: Vec<Value> = by_role("producer")
                .iter()
                .map(|d| {
                    seat_of(
                        d,
                        posture(&[
                            ("readOnly", true),
                            ("forceOutOfProcess", true),
                            ("stance", true),
                        ]),
                    )
                })
                .collect();
            seats.extend(by_role("synthesizer").iter().map(|d| {
                seat_of(
                    d,
                    posture(&[("readOnly", read_only), ("forceOutOfProcess", true)]),
                )
            }));
            Ok(seats)
        }
        "debate" => {
            let declared = declared.ok_or_else(|| {
                SeatResolutionError::new(
                    "a debate unit must declare its seats: two producer sides and one judge",
                    "seats-required",
                )
            })?;
            require_roles(
                "debate",
                &declared,
                &[
                    ("producer", Count::Exactly(2)),
                    ("judge", Count::Exactly(1)),
                ],
            )?;
            let seat = |d: &Value| {
                seat_of(
                    d,
                    posture(&[("readOnly", true), ("forceOutOfProcess", true)]),
                )
            };
            let mut seats: Vec<Value> = declared
                .iter()
                .filter(|d| str_at(d, "role") == Some("producer"))
                .map(seat)
                .collect();
            seats.extend(
                declared
                    .iter()
                    .filter(|d| str_at(d, "role") == Some("judge"))
                    .map(seat),
            );
            Ok(seats)
        }
        other => Err(SeatResolutionError::new(
            format!("Unknown collaboration pattern: \"{other}\""),
            "unknown-pattern",
        )),
    }
}

fn resolve_reviewed(
    options: &ResolveOptions,
    params: &Value,
    declared: Option<Vec<Value>>,
    read_only: bool,
) -> Result<Vec<Value>, SeatResolutionError> {
    let plan = checker_plan_of(
        &options.unit,
        &options.runner_config,
        &PlanOptions {
            requested: params.get("minCheckers"),
            floors: options.floors.as_ref(),
            slot: options.slot.as_deref(),
            shipped_checkers_by_rigor: options.shipped_checkers_by_rigor.as_ref(),
        },
    )?;
    let required: Vec<&str> = plan.iter().map(|p| p.seat.as_str()).collect();
    let checker_posture = |name: &str| {
        posture(&[
            ("readOnly", true),
            ("forceOutOfProcess", true),
            ("verdict", checker(name).is_some_and(|(_, v)| v)),
        ])
    };
    let producer_posture = posture(&[("readOnly", read_only), ("writer", true)]);
    let role_of = |name: &str| checker(name).map_or("reviewer", |(role, _)| role);
    let Some(declared) = declared else {
        let mut seats =
            vec![json!({ "seat": "producer", "role": "producer", "posture": producer_posture })];
        seats.extend(required.iter().map(
            |name| json!({ "seat": name, "role": role_of(name), "posture": checker_posture(name) }),
        ));
        return Ok(seats);
    };
    // Declared seats name the producer and one seat per checker the unit needs; the roles must match what
    // checkersByRigor[effective rigor] plus minCheckers require, no role missing and none extra.
    let producers = declared
        .iter()
        .filter(|d| str_at(d, "role") == Some("producer"))
        .count();
    if producers != 1 {
        return Err(SeatResolutionError::new(
            format!(
                "a reviewed unit declares exactly one seat with role \"producer\", has {producers}"
            ),
            "seat-multiplicity",
        ));
    }
    let wanted: Vec<&str> = required.iter().map(|n| role_of(n)).collect();
    let mut unassigned: Vec<&CheckerPlanEntry> = plan.iter().collect();
    let mut extra: Vec<String> = Vec::new();
    for d in declared
        .iter()
        .filter(|d| str_at(d, "role") != Some("producer"))
    {
        let role = str_at(d, "role").unwrap_or_default();
        match unassigned.iter().position(|p| role_of(&p.seat) == role) {
            Some(at) => {
                unassigned.remove(at);
            }
            None => extra.push(role.to_string()),
        }
    }
    if !unassigned.is_empty() || !extra.is_empty() {
        let missing: Vec<&str> = unassigned.iter().map(|p| role_of(&p.seat)).collect();
        let invariant = unassigned
            .iter()
            .flat_map(|p| p.contributions.iter())
            .find(|c| c.starts_with("pattern-invariant:"));
        if let Some(invariant) = invariant {
            return Err(SeatResolutionError::new(
                format!(
                    "declared seats weaken pattern invariant {invariant}: missing required checker role(s) [{}]",
                    missing.join(", ")
                ),
                "pattern-invariant-weakened",
            ));
        }
        return Err(SeatResolutionError::new(
            format!(
                "a reviewed unit's checker seats must be exactly [{}] (checkersByRigor for its effective rigor plus minCheckers){}{}",
                wanted.join(", "),
                if missing.is_empty() { String::new() } else { format!("; missing [{}]", missing.join(", ")) },
                if extra.is_empty() { String::new() } else { format!("; extra [{}]", extra.join(", ")) },
            ),
            "seat-multiplicity",
        ));
    }
    // Each declared checker seat takes the first still-unassigned required checker of its role, which fixes its
    // posture (`tester` is a reviewer-role seat whose result is not a verdict).
    let mut names: Vec<&str> = required.clone();
    Ok(declared
        .iter()
        .map(|d| {
            if str_at(d, "role") == Some("producer") {
                return seat_of(d, producer_posture.clone());
            }
            let role = str_at(d, "role").unwrap_or_default();
            let at = names.iter().position(|n| role_of(n) == role).unwrap_or(0);
            let name = names.remove(at);
            seat_of(d, checker_posture(name))
        })
        .collect())
}

/// Seat launches a unit plans before any fallback: seats per round times the rounds the pattern may run.
/// `None` for a pattern this core does not know.
pub fn seat_launches_of(options: &ResolveOptions) -> Result<Option<u64>, SeatResolutionError> {
    let loop_name = options.loop_of();
    if !LOOP_NAMES.contains(&loop_name.as_str()) {
        return Ok(None);
    }
    let params = options.raw_params();
    let seats = resolve_seats(options)?;
    Ok(Some(match loop_name.as_str() {
        "reviewed" => {
            let rounds = params
                .as_ref()
                .and_then(|p| get(p, "maxRounds"))
                .and_then(Value::as_u64)
                .unwrap_or(2);
            seats.len() as u64 * rounds
        }
        "debate" => {
            let rebuttal_off =
                params.as_ref().and_then(|p| p.get("rebuttal")) == Some(&json!(false));
            2 * if rebuttal_off { 1 } else { 2 } + 1
        }
        _ => seats.len() as u64,
    }))
}

/// The semantic kind a summary reports for a seat; only `panelist` votes.
pub fn seat_kind(seat: &Value) -> &'static str {
    let stance = seat
        .get("posture")
        .and_then(|p| p.get("stance"))
        .is_some_and(truthy);
    if stance {
        return "panelist";
    }
    match str_at(seat, "role") {
        Some("synthesizer") => "synthesizer",
        Some("judge") => "judge",
        Some("producer") => "producer",
        _ => "checker",
    }
}

/// A persisted seat of a unit record, by id; `None` when the record lists none.
pub fn seat_of_record<'a>(unit_record: &'a Value, seat_id: &str) -> Option<&'a Value> {
    items(unit_record.get("seats"))
        .iter()
        .find(|s| str_at(s, "seat") == Some(seat_id))
}

/// The tier a workflow recommends on a seat, with where it was declared: the seat's own tier
/// (`workflow:[<id>/]<unit>/<seat>`), else its unit's; `None` for none.
pub fn workflow_tier_of(seat: &Value, unit: &Value, workflow_id: Option<&str>) -> Option<Value> {
    let unit_id = get(unit, "id").and_then(Value::as_str).unwrap_or("unit");
    let prefix = workflow_id
        .filter(|w| !w.is_empty())
        .map(|w| format!("{w}/"))
        .unwrap_or_default();
    let unit_path = format!("workflow:{prefix}{unit_id}");
    if let Some(tier) = get(seat, "tier").filter(|t| truthy(t)) {
        return Some(
            json!({ "tier": tier, "source": format!("{unit_path}/{}", str_at(seat, "seat").unwrap_or_default()) }),
        );
    }
    get(unit, "tier")
        .filter(|t| truthy(t))
        .map(|tier| json!({ "tier": tier, "source": unit_path }))
}

/// The seat part of a bind ask for a seat recorded in `unit_record` (id, role, posture, persona, recommended
/// tier), so a replay asks what the run asked; a seat the record does not list is the unit's producer seat.
pub fn bind_seat_of(unit_record: &Value, seat_id: &str) -> Value {
    let seat = seat_of_record(unit_record, seat_id);
    let unit = unit_record.get("unit").unwrap_or(&Value::Null);
    let workflow_id = str_at(unit_record, "workflowId");
    let tier = match seat {
        Some(s) => workflow_tier_of(s, unit, workflow_id),
        None => workflow_tier_of(&json!({ "seat": seat_id }), unit, workflow_id),
    };
    let mut out = Map::new();
    match seat {
        None => {
            out.insert("seat".into(), json!(seat_id));
            out.insert("role".into(), json!("producer"));
            out.insert("posture".into(), posture(&[("writer", true)]));
        }
        Some(s) => {
            out.insert("seat".into(), s.get("seat").cloned().unwrap_or(Value::Null));
            out.insert("role".into(), s.get("role").cloned().unwrap_or(Value::Null));
            out.insert(
                "posture".into(),
                s.get("posture").cloned().unwrap_or(Value::Null),
            );
            if let Some(p) = get(s, "persona").filter(|p| truthy(p)) {
                out.insert("persona".into(), p.clone());
            }
        }
    }
    if let Some(t) = tier {
        out.insert("workflowTier".into(), t);
    }
    Value::Object(out)
}

/// A seat's `tier` is a recommendation only a registered workflow may make: a unit file or stdin carrying one
/// is refused.
pub fn assert_no_seat_tier(raw_seats: &Value, source: &str) -> Result<(), SeatResolutionError> {
    let carries = items(Some(raw_seats))
        .iter()
        .any(|e| e.is_object() && e.get("tier").is_some());
    if carries {
        return Err(SeatResolutionError::new(
            format!("{source} cannot carry seats[].tier: a seat's tier is a recommendation only a registered workflow definition may make"),
            "seat-tier-not-allowed",
        ));
    }
    Ok(())
}

/// A unit's `tier` is a recommendation only a registered workflow may make.
pub fn assert_no_unit_tier(raw_unit: &Value, source: &str) -> Result<(), SeatResolutionError> {
    if raw_unit.is_object() && raw_unit.get("tier").is_some() {
        return Err(SeatResolutionError::new(
            format!("{source} cannot carry tier: a unit's tier is a recommendation only a registered workflow definition may make"),
            "unit-tier-not-allowed",
        ));
    }
    Ok(())
}
