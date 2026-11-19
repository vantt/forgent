//! A Unit: the one piece of work a run executes, and the rules that turn raw input into one.
//!
//! [`validate_unit`] is the Unit contract (the vectors of `packages/execution/contracts/core-unit/unit.v1.json`
//! are its proof): it reads raw JSON, refuses what the contract refuses with the sentence Node uses, and returns
//! the normalized Unit. The normalizers it shares with other doors ([`normalize_plan_ref`],
//! [`normalize_workflow_link`], [`normalize_stance_options`]) are public for the same reason.
//!
//! Two answers a Unit needs belong to sibling modules and come through [`UnitHost`]: the tier ladder with the
//! declared-seat check (Seat Resolver) and the run-timeout bounds (runner config). The module is pure: no file,
//! clock, environment or process.

use serde_json::{json, Map, Value};

/// A refusal of the request or Unit contract: what `RunnerConfigError` and `RunRequestError` carry in Node.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Refusal {
    /// The error class Node raises: `RunnerConfigError`, `RunRequestError`, or `Error` for a host failure.
    pub name: &'static str,
    pub message: String,
    pub code: Option<String>,
    pub phase: Option<String>,
}

impl Refusal {
    /// A `RunnerConfigError` with no code.
    pub fn config(message: impl Into<String>) -> Self {
        Refusal {
            name: "RunnerConfigError",
            message: message.into(),
            code: None,
            phase: None,
        }
    }

    /// A `RunnerConfigError` carrying a stable `code` and the `phase` it was raised in.
    pub fn coded(message: impl Into<String>, code: &str, phase: &str) -> Self {
        Refusal {
            code: Some(code.to_string()),
            phase: Some(phase.to_string()),
            ..Refusal::config(message)
        }
    }

    /// A `RunRequestError`: a request parameter flag the shell must not pass on.
    pub fn request(code: &str, message: impl Into<String>) -> Self {
        Refusal {
            name: "RunRequestError",
            message: message.into(),
            code: Some(code.to_string()),
            phase: None,
        }
    }

    /// A failure of the machine the shell stands on (git could not answer), not a refusal of the input.
    pub fn host(message: impl Into<String>) -> Self {
        Refusal {
            name: "Error",
            message: message.into(),
            code: None,
            phase: None,
        }
    }
}

impl std::fmt::Display for Refusal {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.message)
    }
}

impl std::error::Error for Refusal {}

/// What a Unit needs from its siblings.
pub trait UnitHost {
    /// The model policy tier names, in ladder order.
    fn tiers(&self) -> Vec<String>;
    /// The declared-seat check: the normalized seats, or the sentence that refuses them.
    fn check_declared_seats(
        &self,
        raw: &Value,
        label: &str,
        tiers: &[String],
    ) -> Result<Value, String>;
    /// Why `value` is not a usable run timeout (whole milliseconds between the floor and the ceiling), if it is not.
    fn run_timeout_problem(&self, value: &Value, label: &str) -> Option<String>;
}

/// The rigor scale, weakest first.
pub const RIGOR_VALUES: [&str; 4] = ["low", "standard", "high", "critical"];

const DISALLOWED_UNIT_FIELDS: [&str; 6] = [
    "executor",
    "provider",
    "model",
    "invocation",
    "actors",
    "overrides",
];

/// ECMAScript `trim`: the whitespace and line terminators JavaScript strips, which Rust's `trim` does not match.
pub(crate) fn is_js_space(c: char) -> bool {
    matches!(c, '\u{0009}'..='\u{000d}' | '\u{0020}' | '\u{00a0}' | '\u{1680}' | '\u{2000}'..='\u{200a}' | '\u{2028}' | '\u{2029}' | '\u{202f}' | '\u{205f}' | '\u{3000}' | '\u{feff}')
}

/// `text.trim()` as JavaScript reads it.
pub(crate) fn js_trim(text: &str) -> &str {
    text.trim_matches(is_js_space)
}

/// `JSON.stringify(value)` for the values a flag or a Unit field holds. Node parses every number into one IEEE-754
/// double and writes it back as ECMAScript does (`3.0` as `3`, `-0` as `0`, `1e21` as `1e+21`), and writes the
/// array-index keys of an object first, in ascending order, before the other keys in insertion order.
pub(crate) fn js_json(value: &Value) -> String {
    match value {
        // The canonical-JSON door writes a number the ECMAScript way.
        Value::Number(n) => {
            fgos_canonical_json::canonical_json(value).unwrap_or_else(|_| n.to_string())
        }
        Value::Array(items) => format!(
            "[{}]",
            items.iter().map(js_json).collect::<Vec<_>>().join(",")
        ),
        Value::Object(map) => {
            let index = |key: &str| -> Option<u32> {
                let n: u32 = key.parse().ok()?;
                (n != u32::MAX && n.to_string() == key).then_some(n)
            };
            let mut keys: Vec<&String> = map.keys().collect();
            // A stable sort keeps the other keys in insertion order behind the indices.
            keys.sort_by_key(|key| index(key).map_or((1, 0), |n| (0, n)));
            let fields: Vec<String> = keys
                .into_iter()
                .map(|key| format!("{}:{}", Value::String(key.clone()), js_json(&map[key])))
                .collect();
            format!("{{{}}}", fields.join(","))
        }
        other => other.to_string(),
    }
}

fn text_of(value: &Value) -> Option<&str> {
    value.as_str()
}

/// A non-empty string once trimmed, trimmed.
fn nonblank(value: Option<&Value>) -> Option<String> {
    value
        .and_then(text_of)
        .map(js_trim)
        .filter(|s| !s.is_empty())
        .map(str::to_string)
}

/// The plan a Unit run belongs to: the `plans/<name>` directory and the phase inside it, if any.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PlanRef {
    pub dir: String,
    pub phase: Option<String>,
}

impl PlanRef {
    pub fn to_json(&self) -> Value {
        json!({ "dir": self.dir, "phase": self.phase })
    }
}

fn is_whole_number(value: &Value) -> Option<f64> {
    let n = value.as_f64()?;
    (n.fract() == 0.0 && n.is_finite()).then_some(n)
}

/// The plan a Unit run belongs to: `{ dir, phase }`. A bare `<name>` or a trailing slash reads as the same directory
/// and a whole phase number reads as its digits. Absent input reads as no plan; only the shape is checked here.
pub fn normalize_plan_ref(value: Option<&Value>) -> Result<Option<PlanRef>, Refusal> {
    let value = match value {
        None | Some(Value::Null) => return Ok(None),
        Some(v) => v,
    };
    let dir_text = match value
        .as_object()
        .and_then(|o| o.get("dir"))
        .and_then(Value::as_str)
    {
        Some(d) => d,
        None => {
            return Err(Refusal::config(
                "unit.plan must be { dir, phase? } with dir a plans/<name> directory.",
            ))
        }
    };
    let trimmed = js_trim(dir_text);
    let trimmed = trimmed.strip_prefix("./").unwrap_or(trimmed);
    let trimmed = trimmed.trim_end_matches('/');
    let dir = if trimmed.starts_with("plans/") {
        trimmed.to_string()
    } else {
        format!("plans/{trimmed}")
    };
    let name = &dir["plans/".len()..];
    if name.is_empty() || name.contains('/') || name.contains('\\') || name == "." || name == ".." {
        return Err(Refusal::config(format!(
            "unit.plan.dir must be one plans/<name> directory, got: {}.",
            js_json(&Value::String(dir_text.to_string()))
        )));
    }
    let raw_phase = value.get("phase");
    let raw_phase = match raw_phase {
        None | Some(Value::Null) => return Ok(Some(PlanRef { dir, phase: None })),
        Some(p) => p,
    };
    // A YAML or JSON file writes `phase: 3` as a number; it names the same phase as "3".
    let phase: Option<String> = match raw_phase {
        Value::String(s) => Some(js_trim(s).to_string()),
        other => is_whole_number(other)
            .filter(|n| *n >= 0.0)
            .map(|n| format!("{}", n as u64)),
    };
    match phase {
        Some(p) if is_plan_phase(&p) => Ok(Some(PlanRef {
            dir,
            phase: Some(p),
        })),
        _ => Err(Refusal::config(format!(
            "unit.plan.phase must be a phase id (letters, digits, \".\", \"_\", \"-\"), got: {}.",
            js_json(raw_phase)
        ))),
    }
}

/// `^[A-Za-z0-9][A-Za-z0-9._-]*$`
fn is_plan_phase(text: &str) -> bool {
    let mut chars = text.chars();
    matches!(chars.next(), Some(c) if c.is_ascii_alphanumeric())
        && chars.all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '-'))
}

/// The link from a Unit run to the case that admitted it. The shape recorded before cases existed,
/// `{ runId, stepId, unitId }`, reads as the same link without a reservation.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WorkflowLink {
    pub case_id: String,
    pub activity: String,
    pub reservation_id: Option<String>,
}

impl WorkflowLink {
    pub fn to_json(&self) -> Value {
        json!({ "caseId": self.case_id, "activity": self.activity, "reservationId": self.reservation_id })
    }
}

pub fn normalize_workflow_link(value: Option<&Value>) -> Result<Option<WorkflowLink>, Refusal> {
    let value = match value {
        None | Some(Value::Null) => return Ok(None),
        Some(v) => v,
    };
    let refuse = || Refusal::config("workflow link requires non-empty caseId and activity.");
    let Some(object) = value.as_object() else {
        return Err(refuse());
    };
    let text = |key: &str| nonblank(object.get(key));
    let case_id = text("caseId").or_else(|| text("runId"));
    let activity = text("activity").or_else(|| text("stepId"));
    match (case_id, activity) {
        (Some(case_id), Some(activity)) => Ok(Some(WorkflowLink {
            case_id,
            activity,
            reservation_id: text("reservationId"),
        })),
        _ => Err(refuse()),
    }
}

/// Question-local labels; never inferred from free text or a model's response. Absent input is no labels.
pub fn normalize_stance_options(value: Option<&Value>) -> Result<Vec<String>, Refusal> {
    let empty = Value::Array(vec![]);
    let value = value.unwrap_or(&empty);
    let list = value.as_array().filter(|list| {
        list.iter()
            .all(|o| o.as_str().is_some_and(|s| !js_trim(s).is_empty()))
    });
    let Some(list) = list else {
        return Err(Refusal::config(
            "stanceOptions must be an array of non-empty strings.",
        ));
    };
    let options: Vec<String> = list
        .iter()
        .filter_map(Value::as_str)
        .map(|s| js_trim(s).to_string())
        .collect();
    let unique = options
        .iter()
        .enumerate()
        .all(|(i, o)| !options[..i].contains(o));
    if !unique || options.iter().any(|o| o == "other") {
        return Err(Refusal::config(
            "stanceOptions must be unique; \"other\" is reserved.",
        ));
    }
    Ok(options)
}

/// A unit's soft executor preference, in the shape a capability's prefer pool reads: `"<executorId>"` or
/// `{executor, invocation?}`. Shape only; ids are not looked up here.
fn normalize_prefer(value: &Value) -> Result<Vec<Value>, Refusal> {
    let Some(list) = value.as_array() else {
        return Err(Refusal::config(
            "unit.prefer must be an array of executor ids or {executor, invocation?} entries.",
        ));
    };
    list.iter()
        .enumerate()
        .map(|(i, entry)| {
            if let Some(text) = nonblank(Some(entry)) {
                return Ok(Value::String(text));
            }
            let wrong = || {
                Refusal::config(format!(
                    "unit.prefer[{i}] must be a non-empty executor id or {{executor, invocation?}} with non-empty strings, got: {}.",
                    js_json(entry)
                ))
            };
            let object = entry.as_object().ok_or_else(wrong)?;
            let executor = nonblank(object.get("executor")).ok_or_else(wrong)?;
            if object.keys().any(|k| k != "executor" && k != "invocation") {
                return Err(wrong());
            }
            let invocation = match object.get("invocation") {
                None => None,
                Some(v) => Some(nonblank(Some(v)).ok_or_else(wrong)?),
            };
            let mut out = Map::new();
            out.insert("executor".into(), Value::String(executor));
            if let Some(invocation) = invocation {
                out.insert("invocation".into(), Value::String(invocation));
            }
            Ok(Value::Object(out))
        })
        .collect()
}

/// A safe repo-relative path: a non-empty string, not absolute, no `..` segment, backslash or null byte.
fn is_valid_repo_relative_path(p: &str) -> bool {
    !js_trim(p).is_empty()
        && !p.starts_with('/')
        && !p.contains(['\\', '\0'])
        && !p.split('/').any(|segment| segment == "..")
}

/// `<prefix><a>/<b>` with `a` and `b` non-empty and free of `/` and whitespace.
fn is_pair_ref(rest: &str) -> bool {
    let mut parts = rest.split('/');
    let (Some(a), Some(b), None) = (parts.next(), parts.next(), parts.next()) else {
        return false;
    };
    let clean = |s: &str| !s.is_empty() && !s.chars().any(is_js_space);
    clean(a) && clean(b)
}

/// A safe repo-relative path, a `unit-run:<id>/<role>` or a `gate-answer:<workflowRunId>/<stepId>` reference.
fn is_valid_input(input: &Value) -> bool {
    let Some(text) = input.as_str().filter(|s| !js_trim(s).is_empty()) else {
        return false;
    };
    if let Some(rest) = text.strip_prefix("unit-run:") {
        return is_pair_ref(rest);
    }
    if let Some(rest) = text.strip_prefix("gate-answer:") {
        return is_pair_ref(rest);
    }
    is_valid_repo_relative_path(text)
}

/// A ref name `git merge` may take as the sync base, read as a name and never as an option, a range or a
/// revision expression: letters, digits, `.`, `_`, `/`, `-`, not starting with `-` or `/`, and no `..`.
fn is_sync_ref(value: &Value) -> bool {
    let Some(text) = value.as_str() else {
        return false;
    };
    let mut chars = text.chars();
    matches!(chars.next(), Some(c) if c.is_ascii_alphanumeric() || c == '.' || c == '_')
        && chars.all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '/' | '-'))
        && !text.contains("..")
        && !text.ends_with('/')
        && !text.ends_with(".lock")
}

/// A validated, normalized Unit.
#[derive(Debug, Clone, Default, PartialEq)]
#[non_exhaustive]
pub struct Unit {
    pub id: String,
    pub objective: String,
    pub capability: String,
    pub rigor: Option<String>,
    pub writes: Vec<String>,
    pub depends_on: Vec<String>,
    pub pattern: Option<String>,
    pub prefer: Option<Vec<Value>>,
    pub seats: Option<Value>,
    pub tier: Option<String>,
    pub persona: Option<String>,
    pub timeout_ms: Option<Value>,
    pub verify: Option<String>,
    pub skills: Option<Vec<String>>,
    pub plan: Option<PlanRef>,
    pub sync_base: Option<String>,
    pub sync_only: bool,
    pub inputs: Vec<String>,
    pub anonymize_inputs: bool,
    pub blind: bool,
    pub stance_options: Option<Vec<String>>,
    pub expected_outputs: Vec<String>,
}

impl Unit {
    /// The Unit as the JSON a unit record and a run keep: the keys Node writes, in its order, absent when unset.
    pub fn to_json(&self) -> Value {
        let mut out = Map::new();
        let strings =
            |list: &[String]| Value::Array(list.iter().cloned().map(Value::String).collect());
        out.insert("id".into(), json!(self.id));
        out.insert("objective".into(), json!(self.objective));
        out.insert("capability".into(), json!(self.capability));
        if let Some(rigor) = &self.rigor {
            out.insert("rigor".into(), json!(rigor));
        }
        out.insert("writes".into(), strings(&self.writes));
        out.insert("dependsOn".into(), strings(&self.depends_on));
        if let Some(pattern) = &self.pattern {
            out.insert("pattern".into(), json!(pattern));
        }
        if let Some(prefer) = &self.prefer {
            out.insert("prefer".into(), Value::Array(prefer.clone()));
        }
        if let Some(seats) = &self.seats {
            out.insert("seats".into(), seats.clone());
        }
        if let Some(tier) = &self.tier {
            out.insert("tier".into(), json!(tier));
        }
        if let Some(persona) = &self.persona {
            out.insert("persona".into(), json!(persona));
        }
        if let Some(timeout) = &self.timeout_ms {
            out.insert("timeoutMs".into(), timeout.clone());
        }
        if let Some(verify) = &self.verify {
            out.insert("verify".into(), json!(verify));
        }
        if let Some(skills) = &self.skills {
            out.insert("skills".into(), strings(skills));
        }
        if let Some(plan) = &self.plan {
            out.insert("plan".into(), plan.to_json());
        }
        if let Some(sync_base) = &self.sync_base {
            out.insert("syncBase".into(), json!(sync_base));
        }
        if self.sync_only {
            out.insert("syncOnly".into(), json!(true));
        }
        out.insert("inputs".into(), strings(&self.inputs));
        if self.anonymize_inputs {
            out.insert("anonymizeInputs".into(), json!(true));
        }
        if self.blind {
            out.insert("blind".into(), json!(true));
        }
        if let Some(stance) = &self.stance_options {
            out.insert("stanceOptions".into(), strings(stance));
        }
        out.insert("expectedOutputs".into(), strings(&self.expected_outputs));
        Value::Object(out)
    }
}

/// The trimmed strings of an array field, each refused with the sentence `refuse(index, entry)` builds.
fn trimmed_list(
    raw: &Map<String, Value>,
    key: &str,
    not_array: &str,
    refuse: impl Fn(usize, &Value) -> String,
) -> Result<Vec<String>, Refusal> {
    match raw.get(key) {
        None => Ok(vec![]),
        Some(Value::Array(list)) => list
            .iter()
            .enumerate()
            .map(|(i, entry)| {
                nonblank(Some(entry)).ok_or_else(|| Refusal::config(refuse(i, entry)))
            })
            .collect(),
        Some(_) => Err(Refusal::config(not_array)),
    }
}

fn boolean_field(raw: &Map<String, Value>, key: &str) -> Result<bool, Refusal> {
    match raw.get(key) {
        None => Ok(false),
        Some(Value::Bool(b)) => Ok(*b),
        Some(_) => Err(Refusal::config(format!(
            "unit.{key} must be a boolean when present."
        ))),
    }
}

/// Validates raw input against the Unit contract and returns the normalized Unit.
///
/// A unit never names execution mechanics (`executor`, `provider`, `model`, `invocation`, `actors`, `overrides`), has
/// a non-empty `id`, `objective` (left out only by a sync-only unit) and `capability`, and carries write paths that
/// read one way (the one write-scope door canonicalises them). Every refusal says which field and why.
pub fn validate_unit(raw: &Value, host: &dyn UnitHost) -> Result<Unit, Refusal> {
    let Some(raw) = raw.as_object() else {
        return Err(Refusal::config("unit must be a non-null plain object."));
    };
    for field in DISALLOWED_UNIT_FIELDS {
        if raw.contains_key(field) {
            return Err(Refusal::config(format!(
                "unit violates G2 constraint: contains disallowed field \"{field}\". Unit contract must not specify execution mechanics ({}).",
                DISALLOWED_UNIT_FIELDS.join(", ")
            )));
        }
    }

    let id = nonblank(raw.get("id"))
        .ok_or_else(|| Refusal::config("unit.id must be a non-empty string."))?;

    // syncBase: a ref the runner merges into the unit's branch before any worker runs. A unit with a syncBase and no
    // objective is sync-only: no worker unless the merge stops on conflicts.
    let mut sync_base = None;
    if let Some(value) = raw.get("syncBase") {
        if !is_sync_ref(value) {
            return Err(Refusal::config(format!(
                "unit.syncBase must be a branch, tag or commit name (letters, digits, \".\", \"_\", \"/\", \"-\"; not starting with \"-\" or \"/\", no \"..\"), got: {}.",
                js_json(value)
            )));
        }
        sync_base = value.as_str().map(str::to_string);
    }
    if let Some(flag) = raw.get("syncOnly") {
        if flag != &Value::Bool(true) || sync_base.is_none() {
            return Err(Refusal::config(
                "unit.syncOnly needs syncBase; it is set by leaving out the objective of a unit with a syncBase.",
            ));
        }
    }
    let sync_only = sync_base.is_some()
        && (raw.get("syncOnly") == Some(&Value::Bool(true)) || !raw.contains_key("objective"));

    let objective = if sync_only && !raw.contains_key("objective") {
        format!(
            "Merge {} into this branch.",
            sync_base.as_deref().unwrap_or_default()
        )
    } else {
        nonblank(raw.get("objective"))
            .ok_or_else(|| Refusal::config("unit.objective must be a non-empty string."))?
    };
    let capability = nonblank(raw.get("capability")).ok_or_else(|| {
        Refusal::config("unit.capability must be a non-empty string (\"domain:verb\" or \"verb\").")
    })?;
    let rigor = match raw.get("rigor") {
        None | Some(Value::Null) => None,
        Some(Value::String(r)) if RIGOR_VALUES.contains(&r.as_str()) => Some(r.clone()),
        Some(other) => {
            return Err(Refusal::config(format!(
                "unit.rigor must be one of {}, got: {}.",
                RIGOR_VALUES.join("/"),
                js_json(other)
            )))
        }
    };

    // writes: canonical spelling, so every consumer reads one entry one way
    let mut writes: Vec<String> = Vec::new();
    match raw.get("writes") {
        None => {}
        Some(Value::Array(list)) => {
            for (i, entry) in list.iter().enumerate() {
                let canonical = match entry {
                    Value::String(text) => {
                        fgos_write_scope::canonicalize(text).map_err(|e| e.to_string())
                    }
                    other => Err(format!(
                        "write entry must be a string, got: {}.",
                        js_json(other)
                    )),
                };
                let canonical = canonical.map_err(|why| {
                    Refusal::config(format!(
                        "unit.writes[{i}] must be a non-empty repo-relative path: {why}"
                    ))
                })?;
                if !writes.contains(&canonical) {
                    writes.push(canonical);
                }
            }
        }
        Some(_) => {
            return Err(Refusal::config(
                "unit.writes must be an array of repo-relative paths.",
            ))
        }
    }
    if sync_base.is_some() && writes.is_empty() {
        return Err(Refusal::config(
            "unit.syncBase needs writes: merging a ref changes the branch, so the unit must be a writing unit in a linked worktree.",
        ));
    }

    let depends_on = trimmed_list(
        raw,
        "dependsOn",
        "unit.dependsOn must be an array of unit ids.",
        |i, entry| {
            format!(
                "unit.dependsOn[{i}] must be a non-empty string unit id, got: {}.",
                js_json(entry)
            )
        },
    )?;
    let pattern = match raw.get("pattern") {
        None | Some(Value::Null) => None,
        Some(v) => Some(nonblank(Some(v)).ok_or_else(|| {
            Refusal::config("unit.pattern must be a non-empty string when present.")
        })?),
    };
    let inputs = match raw.get("inputs") {
        None => vec![],
        Some(Value::Array(list)) => list
            .iter()
            .enumerate()
            .map(|(i, input)| {
                if is_valid_input(input) {
                    Ok(input.as_str().unwrap_or_default().to_string())
                } else {
                    Err(Refusal::config(format!(
                        "unit.inputs[{i}] must be a repo-relative path or \"unit-run:<id>/<role>\" ref (or \"gate-answer:<workflowRunId>/<stepId>\"), got: {}.",
                        js_json(input)
                    )))
                }
            })
            .collect::<Result<Vec<_>, _>>()?,
        Some(_) => {
            return Err(Refusal::config(
                "unit.inputs must be an array of repo-relative paths or unit-run references.",
            ))
        }
    };
    let anonymize_inputs = boolean_field(raw, "anonymizeInputs")?;
    let blind = boolean_field(raw, "blind")?;

    let prefer = raw.get("prefer").map(normalize_prefer).transpose()?;

    // seats: the seats a panel or debate unit fills, `[{ seat, role, persona?, tier? }]`
    let tiers = host.tiers();
    let seats = match raw.get("seats") {
        None => None,
        Some(value) => Some(
            host.check_declared_seats(value, "unit.seats", &tiers)
                .map_err(Refusal::config)?,
        ),
    };

    let tier = match raw.get("tier") {
        None => None,
        Some(Value::String(t)) if tiers.contains(t) => Some(t.clone()),
        Some(other) => {
            return Err(Refusal::config(format!(
                "unit.tier must be one of [{}], got: {}.",
                tiers.join(", "),
                js_json(other)
            )))
        }
    };

    let persona = match raw.get("persona") {
        None => None,
        Some(v) => Some(nonblank(Some(v)).ok_or_else(|| {
            Refusal::config("unit.persona must be a non-empty string when present.")
        })?),
    };

    let timeout_ms = match raw.get("timeoutMs") {
        None => None,
        Some(value) => {
            if let Some(problem) = host.run_timeout_problem(value, "unit.timeoutMs") {
                return Err(Refusal::config(problem));
            }
            Some(value.clone())
        }
    };

    let verify = match raw.get("verify") {
        None => None,
        Some(v) => Some(nonblank(Some(v)).ok_or_else(|| {
            Refusal::config("unit.verify must be a non-empty shell command string when present.")
        })?),
    };

    let plan = normalize_plan_ref(raw.get("plan"))?;

    let skills = match raw.get("skills") {
        None => None,
        Some(value) => {
            let names: Option<Vec<String>> = value
                .as_array()
                .filter(|list| !list.is_empty())
                .and_then(|list| list.iter().map(|s| nonblank(Some(s))).collect());
            let Some(names) = names else {
                return Err(Refusal::config(
                    "unit.skills must be a non-empty array of non-empty skill names when present.",
                ));
            };
            let mut unique: Vec<String> = Vec::new();
            for name in names {
                if !unique.contains(&name) {
                    unique.push(name);
                }
            }
            Some(unique)
        }
    };

    let expected_outputs = trimmed_list(
        raw,
        "expectedOutputs",
        "unit.expectedOutputs must be an array of strings.",
        |i, entry| {
            format!(
                "unit.expectedOutputs[{i}] must be a non-empty string, got: {}.",
                js_json(entry)
            )
        },
    )?;

    let stance_options = raw
        .get("stanceOptions")
        .map(|v| normalize_stance_options(Some(v)))
        .transpose()?;

    Ok(Unit {
        id,
        objective,
        capability,
        rigor,
        writes,
        depends_on,
        pattern,
        prefer,
        seats,
        tier,
        persona,
        timeout_ms,
        verify,
        skills,
        plan,
        sync_base,
        sync_only,
        inputs,
        anonymize_inputs,
        blind,
        stance_options,
        expected_outputs,
    })
}

#[cfg(test)]
mod tests {
    use super::js_json;

    /// A refusal quotes the value it refuses as Node's `JSON.stringify` writes it; serde_json keeps a float's
    /// fraction, prints `-0` and never uses an exponent, so the vectors (written by `JSON.stringify`) cannot show it.
    #[test]
    fn js_json_writes_numbers_and_key_order_as_json_stringify_does() {
        let raw = r#"[3.0, -0, 1e21, 1.5e-7, 123456789012345680000, 0.000001, 9007199254740993, -2.50, {"b":1,"2":2,"1":3,"01":4,"4294967295":5}]"#;
        let value: serde_json::Value = serde_json::from_str(raw).unwrap();
        assert_eq!(
            js_json(&value),
            r#"[3,0,1e+21,1.5e-7,123456789012345680000,0.000001,9007199254740992,-2.5,{"1":3,"2":2,"b":1,"01":4,"4294967295":5}]"#
        );
    }
}
