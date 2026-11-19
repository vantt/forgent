//! The one read path for records written before seats existed. A record without `seatSchema` keyed everything
//! by a role name that was also the name of the seat's directory; such a record stays readable and is refused
//! on resume. This is the only module that knows the retired names.

use super::capability::own_min_checkers_of;
use super::value::{get, items, nn, str_at, truthy};
use serde_json::{json, Map, Value};

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

fn seat(name: &str, role: &str, fields: &[(&str, bool)]) -> Value {
    json!({ "seat": name, "role": role, "posture": posture(fields) })
}

/// The seat key of a result or history entry: its `seat`, or for a pre-fence one the role name it was keyed by.
pub fn seat_key_of(result: &Value) -> Option<&Value> {
    get(result, "seat").or_else(|| get(result, "role"))
}

fn seat_key_text(result: &Value) -> String {
    match seat_key_of(result) {
        None => "undefined".to_string(),
        Some(Value::String(s)) => s.clone(),
        Some(other) => other.to_string(),
    }
}

/// The provider family of a result whose binding carries no `family`: the one its run policy named, else null.
pub fn legacy_family_of(result: &Value) -> Option<&Value> {
    get(result, "runResult")
        .and_then(|r| get(r, "policy"))
        .and_then(|p| get(p, "providerModel"))
}

/// Whether a result carries a checker's verdict. Pre-fence results say so only through their role name.
pub fn is_verdict_result(result: &Value) -> bool {
    if let Some(p) = get(result, "posture").filter(|p| truthy(p)) {
        return p.get("verdict") == Some(&json!(true));
    }
    let key = seat_key_text(result);
    ["reviewer", "red-team", "checker"]
        .iter()
        .any(|prefix| key.starts_with(prefix))
}

/// Whether a result is the harness's own verify round.
pub fn is_verify_result(result: &Value) -> bool {
    matches!(seat_key_text(result).as_str(), "verify" | "verifier")
}

fn legacy_default_checkers(rigor: &str) -> Option<Vec<&'static str>> {
    match rigor {
        "low" | "standard" => Some(vec!["reviewer"]),
        "high" | "critical" => Some(vec!["reviewer", "red-team"]),
        _ => None,
    }
}

fn legacy_checkers(unit: &Value, cfg: &Value, params: &Value) -> Vec<String> {
    let rigor = nn(unit.get("rigor"))
        .filter(|r| truthy(r))
        .and_then(Value::as_str)
        .unwrap_or("standard");
    let by_rigor = get(cfg, "patterns")
        .and_then(|p| get(p, "reviewed"))
        .and_then(|r| get(r, "checkersByRigor"));
    let mut names: Vec<String> = Vec::new();
    let mut add = |name: String| {
        if !names.contains(&name) {
            names.push(name);
        }
    };
    let base: Vec<String> = match by_rigor {
        Some(table) => match table.get(rigor).filter(|v| truthy(v)) {
            Some(row) => items(Some(row))
                .iter()
                .filter_map(|v| v.as_str().map(str::to_string))
                .collect(),
            None => legacy_default_checkers(rigor)
                .unwrap_or_else(|| vec!["reviewer"])
                .into_iter()
                .map(str::to_string)
                .collect(),
        },
        None => legacy_default_checkers(rigor)
            .unwrap_or_else(|| vec!["reviewer"])
            .into_iter()
            .map(str::to_string)
            .collect(),
    };
    base.into_iter().for_each(&mut add);
    let capability = str_at(unit, "capability");
    for v in items(own_min_checkers_of(cfg, capability)) {
        if let Some(s) = v.as_str() {
            add(s.to_string());
        }
    }
    match nn(params.get("minCheckers")) {
        Some(Value::Array(list)) => list
            .iter()
            .filter_map(|v| v.as_str().map(str::to_string))
            .for_each(&mut add),
        Some(v) if truthy(v) => {
            if let Some(s) = v.as_str() {
                add(s.to_string());
            }
        }
        _ => {}
    }
    if capability.is_some_and(|c| c.starts_with("code:") || c == "code") {
        add("red-team".to_string());
    }
    names
}

/// The presets that carried role names as params before seats; a record that stored one by name must still be
/// read the way it ran.
fn historical_pattern(name: &str) -> Option<(&'static str, Value)> {
    Some(match name {
        "consult" => ("solo", json!({ "role": "advisor" })),
        "research-fan-out" => (
            "panel",
            json!({ "members": 3, "role": "researcher", "synthesizeRole": "synthesizer" }),
        ),
        "research-fan-out-gated" => (
            "panel",
            json!({ "members": 3, "role": "researcher", "synthesizeRole": "synthesizer", "gated": true }),
        ),
        "code-change" => (
            "reviewed",
            json!({ "minCheckers": ["reviewer", "red-team"] }),
        ),
        "rfc" => (
            "reviewed",
            json!({ "maxRounds": 1, "minCheckers": ["reviewer", "red-team"] }),
        ),
        _ => return None,
    })
}

fn merge_objects(base: &Value, over: Option<&Value>) -> Value {
    let mut out = base.as_object().cloned().unwrap_or_default();
    if let Some(Value::Object(o)) = over {
        for (k, v) in o {
            out.insert(k.clone(), v.clone());
        }
    }
    Value::Object(out)
}

fn pattern_name(pattern: &Value) -> Option<String> {
    match pattern {
        Value::String(s) => Some(s.clone()),
        Value::Object(_) => get(pattern, "pattern")
            .or_else(|| get(pattern, "patternName"))
            .and_then(Value::as_str)
            .map(str::to_string),
        _ => None,
    }
}

fn legacy_resolve(pattern: &Value) -> (String, Value) {
    let name = pattern_name(pattern);
    let own_params = pattern.is_object().then(|| pattern.get("params")).flatten();
    if let Some((loop_name, params)) = name.as_deref().and_then(historical_pattern) {
        return (loop_name.to_string(), merge_objects(&params, own_params));
    }
    let name = name
        .filter(|n| !n.is_empty())
        .unwrap_or_else(|| "solo".to_string());
    (name, merge_objects(&json!({}), own_params))
}

fn record_pattern(record: &Value) -> Option<&Value> {
    get(record, "pattern").or_else(|| get(record, "unit").and_then(|u| get(u, "pattern")))
}

fn snapshot_runner(record: &Value) -> Value {
    get(record, "configSnapshot")
        .and_then(|c| get(c, "runner"))
        .cloned()
        .unwrap_or_else(|| json!({}))
}

/// The seats a pre-fence unit record's pattern had, in the order the pattern listed them. Empty when the record
/// never said which pattern ran.
pub fn legacy_seats_of(record: &Value) -> Vec<Value> {
    let Some(pattern) = record_pattern(record) else {
        return Vec::new();
    };
    let (name, params) = legacy_resolve(pattern);
    let cfg = snapshot_runner(record);
    match name.as_str() {
        "solo" => {
            let role = get(&params, "role")
                .filter(|r| truthy(r))
                .and_then(Value::as_str);
            vec![seat(
                role.unwrap_or("producer"),
                "producer",
                &[("writer", true)],
            )]
        }
        "reviewed" => {
            let unit = record.get("unit").cloned().unwrap_or(Value::Null);
            let mut seats = vec![seat("producer", "producer", &[("writer", true)])];
            for checker in legacy_checkers(&unit, &cfg, &params) {
                seats.push(if checker == "tester" {
                    seat(
                        &checker,
                        "reviewer",
                        &[("readOnly", true), ("forceOutOfProcess", true)],
                    )
                } else {
                    let role = if checker == "red-team" {
                        "red-team"
                    } else {
                        "reviewer"
                    };
                    seat(
                        &checker,
                        role,
                        &[
                            ("readOnly", true),
                            ("forceOutOfProcess", true),
                            ("verdict", true),
                        ],
                    )
                });
            }
            seats
        }
        "panel" => {
            let count = get(&params, "members")
                .or_else(|| {
                    get(&cfg, "patterns")
                        .and_then(|p| get(p, "panel"))
                        .and_then(|p| get(p, "members"))
                })
                .and_then(Value::as_u64)
                .unwrap_or(3);
            let role = get(&params, "role").filter(|r| truthy(r));
            let names: Vec<String> = match role {
                Some(Value::Array(list)) => list
                    .iter()
                    .filter_map(|v| v.as_str().map(str::to_string))
                    .collect(),
                other => {
                    let base = other.and_then(Value::as_str).unwrap_or("panelist");
                    (1..=count).map(|i| format!("{base}-{i}")).collect()
                }
            };
            let synth = get(&params, "synthesizeRole")
                .filter(|r| truthy(r))
                .and_then(Value::as_str)
                .unwrap_or("synthesizer");
            let mut seats: Vec<Value> = names
                .iter()
                .map(|n| {
                    seat(
                        n,
                        "producer",
                        &[
                            ("readOnly", true),
                            ("forceOutOfProcess", true),
                            ("stance", true),
                        ],
                    )
                })
                .collect();
            seats.push(seat(synth, "synthesizer", &[("forceOutOfProcess", true)]));
            seats
        }
        "debate" => vec![
            seat(
                "thesis",
                "producer",
                &[("readOnly", true), ("forceOutOfProcess", true)],
            ),
            seat(
                "antithesis",
                "producer",
                &[("readOnly", true), ("forceOutOfProcess", true)],
            ),
            seat(
                "judge",
                "judge",
                &[("readOnly", true), ("forceOutOfProcess", true)],
            ),
        ],
        _ => Vec::new(),
    }
}

/// Whether a unit record is fenced: written by a runner that keys by seat.
pub fn is_seat_record(record: &Value) -> bool {
    record
        .get("seatSchema")
        .and_then(Value::as_f64)
        .is_some_and(|n| n >= 1.0)
}

/// The seats of a record: its own list when fenced, else what its pattern had before the fence.
pub fn seats_of_record(record: &Value) -> Vec<Value> {
    if is_seat_record(record) {
        items(get(record, "seats")).to_vec()
    } else {
        legacy_seats_of(record)
    }
}

const BASE_LOOPS: [&str; 4] = ["solo", "reviewed", "panel", "debate"];

/// The single, pure record-read path for records with no `collaboration`: the stored selector decoded to a
/// catalog name, defaults from the shipped catalog, snapshot `patterns.reviewed` read as `loops.reviewed`
/// tuning. Returns `{ collaboration, effective, runner, recognized, selector }`; a record with a stored
/// `collaboration` returns the first three only.
pub fn collaboration_of_record(record: &Value, shipped: Option<&Value>) -> Value {
    if let Some(collab) = get(record, "collaboration").filter(|c| truthy(c)) {
        return json!({
            "collaboration": collab,
            "effective": collab.get("effective").cloned().unwrap_or(Value::Null),
            "runner": snapshot_runner(record),
        });
    }
    let raw_pattern = record_pattern(record);
    let mut selector_name: Option<String> = None;
    let mut selector_params = json!({});
    match raw_pattern {
        Some(Value::String(s)) => selector_name = Some(s.clone()),
        Some(p @ Value::Object(_)) => {
            selector_name = pattern_name(p);
            selector_params = get(p, "params").cloned().unwrap_or_else(|| json!({}));
        }
        _ => {}
    }
    let catalog_name = match selector_name.as_deref() {
        Some("research-fan-out-gated") => "research-fan-out".to_string(),
        Some(n) => n.to_string(),
        None => "solo".to_string(),
    };
    let shipped_patterns = shipped
        .and_then(|s| get(s, "patterns"))
        .or(shipped)
        .cloned()
        .unwrap_or_else(|| json!({}));
    let hist = historical_pattern(&catalog_name);
    let shipped_entry = get(&shipped_patterns, &catalog_name)
        .cloned()
        .or_else(|| {
            hist.as_ref()
                .map(|(l, d)| json!({ "loop": l, "defaults": d }))
        })
        .unwrap_or_else(|| json!({}));
    let is_base = BASE_LOOPS.contains(&catalog_name.as_str());
    let shipped_loop = get(&shipped_entry, "loop").and_then(Value::as_str);
    let recognized = selector_name.is_some()
        && (hist.is_some() || shipped_loop.is_some_and(|_| true) || is_base);
    let loop_name = shipped_loop.map(str::to_string).unwrap_or_else(|| {
        if is_base {
            catalog_name.clone()
        } else {
            "solo".to_string()
        }
    });
    let pattern_defaults = merge_objects(
        &merge_objects(&json!({}), get(&shipped_entry, "defaults")),
        get(&shipped_entry, "params"),
    );
    let runner = snapshot_runner(record);
    let reviewed_tuning = get(&runner, "patterns")
        .and_then(|p| get(p, "reviewed"))
        .or_else(|| get(&runner, "loops").and_then(|p| get(p, "reviewed")))
        .cloned()
        .unwrap_or_else(|| json!({}));
    let mut effective_params = merge_objects(&pattern_defaults, Some(&selector_params));
    let params_map = effective_params.as_object_mut().expect("object");
    if loop_name == "reviewed" && selector_params.get("maxRounds").is_none() {
        if let Some(max) = reviewed_tuning.get("maxRounds") {
            params_map.insert("maxRounds".into(), max.clone());
        }
    }
    if loop_name == "reviewed" && !params_map.contains_key("maxRounds") {
        if let Some(max) = shipped
            .and_then(|s| get(s, "loops"))
            .and_then(|l| get(l, "reviewed"))
            .and_then(|r| r.get("maxRounds"))
        {
            params_map.insert("maxRounds".into(), max.clone());
        }
    }
    let stored: Vec<Value> = match get(record, "seats") {
        Some(Value::Array(list)) => list.clone(),
        _ => seats_of_record(record),
    };
    if !stored.is_empty() {
        let declared: Vec<Value> = stored
            .iter()
            .map(|s| {
                let mut out = Map::new();
                out.insert("seat".into(), s.get("seat").cloned().unwrap_or(Value::Null));
                for key in ["role", "persona", "tier"] {
                    if let Some(v) = s.get(key).filter(|v| truthy(v)) {
                        out.insert(key.into(), v.clone());
                    }
                }
                Value::Object(out)
            })
            .collect();
        params_map.insert("seats".into(), Value::Array(declared));
    }
    let reviewed_override = get(&runner, "patterns").and_then(|p| get(p, "reviewed"));
    let mut loops_view = get(&runner, "loops")
        .and_then(Value::as_object)
        .cloned()
        .unwrap_or_default();
    if let Some(over) = reviewed_override {
        let base = get(&runner, "loops").and_then(|l| get(l, "reviewed"));
        loops_view.insert(
            "reviewed".into(),
            merge_objects(&merge_objects(&json!({}), base), Some(over)),
        );
    }
    let mut runner_view = runner.as_object().cloned().unwrap_or_default();
    runner_view.insert("loops".into(), Value::Object(loops_view));
    let effective = json!({ "loop": loop_name, "params": effective_params, "seats": stored });
    let collaboration = json!({
        "pattern": { "name": catalog_name, "layer": "shipped" },
        "effective": effective,
    });
    json!({
        "collaboration": collaboration,
        "effective": effective,
        "runner": Value::Object(runner_view),
        "recognized": recognized,
        "selector": selector_name,
    })
}
