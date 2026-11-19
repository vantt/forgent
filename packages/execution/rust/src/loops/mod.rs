//! Loop rules over rounds of a Unit, as pure state machines. A loop is a transition function: the state and the
//! answers to the last commands give the next commands (or the end). The engine runs the commands (binds and
//! launches the seats, runs the verify round) and hands the answers back; nothing here binds, launches, waits
//! or touches a file, a clock or a process.
//!
//! Calling convention: `LoopRun::new(input)` then `step(None)`; each `Step::Dispatch(commands)` is answered by
//! one value per command, in command order, through the next `step(Some(answers))`, until `Step::Done`. A role
//! answer is the seat result; a verify answer is the hook's `{ pass | findings | infrastructure, error }`.
//! Commands of one batch run together; the engine drains all of them before it answers (and reports a throw of
//! one as the run's throw, once every seat has settled).

mod debate;
mod history_outcome;
mod panel;
mod reviewed;
mod role_tasks;
mod role_tasks_data;
mod solo;
mod verify;

pub use history_outcome::pattern_history_outcome;
pub use reviewed::{extract_findings, reviewed_history_outcome};
pub use role_tasks::{role_unit, RoleAsk};
pub use verify::{has_verify_command, verify_command_of, verify_seat_result};

use crate::seat_resolver::value::{get, items, nn, str_at, truthy};
use crate::seat_resolver::SeatResolutionError;
use serde_json::{json, Map, Value};

/// The default of `params.rebuttal` for a debate.
pub const DEFAULT_REBUTTAL: bool = true;

/// Which loops run the verify round.
pub fn loop_runs_verify(loop_name: &str) -> bool {
    matches!(loop_name, "solo" | "reviewed")
}

/// How a loop param is given: its type, whether it is a single value, and whether a caller may request it.
#[derive(Debug, Clone, PartialEq)]
pub struct ParamSpec {
    pub name: &'static str,
    pub kind: &'static str,
    pub domain: Option<&'static str>,
    pub scalar: bool,
    pub requestable: bool,
}

const fn spec(
    name: &'static str,
    kind: &'static str,
    domain: Option<&'static str>,
    scalar: bool,
    requestable: bool,
) -> ParamSpec {
    ParamSpec {
        name,
        kind,
        domain,
        scalar,
        requestable,
    }
}

const SEATS: ParamSpec = spec("seats", "seats", None, false, true);
const ROLE_TASKS: ParamSpec = spec(
    "roleTasks",
    "role-tasks",
    Some("map seat-or-kind to text"),
    false,
    false,
);

/// The param table of a loop, or `None` for an unknown loop.
pub fn param_table_of(loop_name: &str) -> Option<Vec<ParamSpec>> {
    Some(match loop_name {
        "solo" => vec![SEATS],
        "reviewed" => vec![
            spec("maxRounds", "integer", Some("integer >= 1"), true, true),
            spec(
                "minCheckers",
                "checker-list",
                Some("list of CHECKER_SEATS names"),
                false,
                true,
            ),
            SEATS,
            ROLE_TASKS,
        ],
        "panel" => vec![SEATS, ROLE_TASKS],
        "debate" => vec![
            SEATS,
            ROLE_TASKS,
            spec("rebuttal", "boolean", None, true, true),
        ],
        _ => return None,
    })
}

/// What a loop is asked to run.
#[derive(Debug, Clone, Default)]
pub struct LoopInput {
    pub loop_name: String,
    pub params: Value,
    pub unit: Value,
    /// The runner configuration snapshot.
    pub cfg: Value,
    /// Prior settled attempts of the run (seat results), for a resume.
    pub history: Vec<Value>,
    pub shipped_checkers_by_rigor: Option<Value>,
    /// How many more seat launches the Unit's ceiling allows; `None` means no ceiling is held.
    pub launch_room: Option<u64>,
}

impl LoopInput {
    /// The input of an effective loop (`{ loop|pattern, params, seats }`) or a bare loop name.
    pub fn from_effective(effective: &Value, unit: Value, cfg: Value) -> Self {
        let (name, mut params) = match effective {
            Value::String(name) => (name.clone(), json!({})),
            other => (
                str_at(other, "loop")
                    .or_else(|| str_at(other, "pattern"))
                    .unwrap_or_default()
                    .to_string(),
                get(other, "params").cloned().unwrap_or_else(|| json!({})),
            ),
        };
        if let Some(seats) = nn(effective.get("seats")).filter(|s| truthy(s)) {
            if let Some(map) = params.as_object_mut() {
                map.insert("seats".into(), seats.clone());
            }
        }
        LoopInput {
            loop_name: name,
            params,
            unit,
            cfg,
            ..Default::default()
        }
    }
}

/// One seat the engine must bind and launch. Optional fields are present only when the loop sets them.
#[derive(Debug, Clone, PartialEq)]
pub struct RoleCall {
    pub seat: Value,
    pub unit: Value,
    pub round: Option<u64>,
    /// A soft preference: seats whose provider family this one would rather differ from.
    pub prefer_independent_of: Option<Vec<String>>,
    /// A hard rule: seats whose provider family this one must differ from.
    pub independent_of: Option<Vec<String>>,
    /// Earlier seat results handed to this role as context.
    pub inputs: Option<Vec<Value>>,
    /// Size of the group of seats launched together; every seat of it is bound before any launches.
    pub batch: Option<usize>,
}

impl RoleCall {
    pub(crate) fn new(seat: &Value, unit: Value) -> Self {
        RoleCall {
            seat: seat.clone(),
            unit,
            round: None,
            prefer_independent_of: None,
            independent_of: None,
            inputs: None,
            batch: None,
        }
    }

    /// The call as data: the seat id, the objective the role is told, and the optional fields.
    pub fn to_value(&self) -> Value {
        let mut map = Map::new();
        map.insert(
            "seat".into(),
            self.seat.get("seat").cloned().unwrap_or(Value::Null),
        );
        map.insert(
            "objective".into(),
            self.unit.get("objective").cloned().unwrap_or(Value::Null),
        );
        if let Some(round) = self.round {
            map.insert("round".into(), json!(round));
        }
        if let Some(list) = &self.prefer_independent_of {
            map.insert("preferIndependentOf".into(), json!(list));
        }
        if let Some(list) = &self.independent_of {
            map.insert("independentOf".into(), json!(list));
        }
        if let Some(inputs) = &self.inputs {
            let refs: Vec<Value> = inputs
                .iter()
                .map(|r| {
                    let mut entry = Map::new();
                    for key in ["seat", "round", "outcome"] {
                        if let Some(v) = r.get(key) {
                            entry.insert(key.into(), v.clone());
                        }
                    }
                    Value::Object(entry)
                })
                .collect();
            map.insert("inputs".into(), Value::Array(refs));
        }
        if let Some(batch) = self.batch {
            map.insert("batch".into(), json!(batch));
        }
        Value::Object(map)
    }
}

/// One thing the engine does for a loop.
#[derive(Debug, Clone, PartialEq)]
pub enum Command {
    /// Bind and dispatch one seat; the answer is its seat result.
    Role(Box<RoleCall>),
    /// Run the deterministic verify of a round; the answer is the hook's reply.
    Verify { round: u64 },
}

impl Command {
    pub fn to_value(&self) -> Value {
        match self {
            Command::Role(call) => call.to_value(),
            Command::Verify { round } => json!({ "verify": true, "round": round }),
        }
    }
}

/// How a loop ended: the outcome, the rounds it ran (absent for a panel), every seat result in order, and the
/// findings it carries (reviewed, or a verified solo that found something).
#[derive(Debug, Clone, PartialEq)]
pub struct LoopResult {
    pub outcome: String,
    pub rounds: Option<u64>,
    pub results: Vec<Value>,
    pub findings: Option<Vec<Value>>,
}

impl LoopResult {
    pub fn to_value(&self) -> Value {
        let mut map = Map::new();
        map.insert("outcome".into(), json!(self.outcome));
        if let Some(rounds) = self.rounds {
            map.insert("rounds".into(), json!(rounds));
        }
        map.insert("results".into(), Value::Array(self.results.clone()));
        if let Some(findings) = &self.findings {
            map.insert("findings".into(), Value::Array(findings.clone()));
        }
        Value::Object(map)
    }
}

/// What a step gives the engine.
#[derive(Debug, Clone, PartialEq)]
pub enum Step {
    Dispatch(Vec<Command>),
    Done(LoopResult),
}

/// The one loop being run.
pub enum LoopRun {
    Solo(solo::Solo),
    Reviewed(Box<reviewed::Reviewed>),
    Panel(panel::Panel),
    Debate(debate::Debate),
}

impl LoopRun {
    /// Starts the loop; an unknown loop name, a bad seat declaration or a missing `maxRounds` is refused by name.
    pub fn new(input: LoopInput) -> Result<LoopRun, SeatResolutionError> {
        Ok(match input.loop_name.as_str() {
            "solo" => LoopRun::Solo(solo::Solo::new(input)?),
            "reviewed" => LoopRun::Reviewed(Box::new(reviewed::Reviewed::new(input)?)),
            "panel" => LoopRun::Panel(panel::Panel::new(input)?),
            "debate" => LoopRun::Debate(debate::Debate::new(input)?),
            other => {
                return Err(SeatResolutionError::plain(
                    format!("Unknown collaboration loop: \"{other}\""),
                    "",
                ))
            }
        })
    }

    /// The next step: `None` answers for the first call, then one answer per command of the last dispatch.
    pub fn step(&mut self, answers: Option<Vec<Value>>) -> Result<Step, SeatResolutionError> {
        match self {
            LoopRun::Solo(l) => l.step(answers),
            LoopRun::Reviewed(l) => l.step(answers),
            LoopRun::Panel(l) => l.step(answers),
            LoopRun::Debate(l) => l.step(answers),
        }
    }
}

// ---- shared reading of a seat result ---------------------------------------------------------------

pub(crate) fn outcome_of(result: &Value) -> &str {
    result.get("outcome").and_then(Value::as_str).unwrap_or("")
}

pub(crate) fn round_is(result: &Value, round: u64) -> bool {
    result
        .get("round")
        .filter(|r| !r.is_null())
        .and_then(Value::as_f64)
        .unwrap_or(1.0)
        == round as f64
}

pub(crate) fn seat_is(result: &Value, seat: &str) -> bool {
    str_at(result, "seat") == Some(seat)
}

/// The history entry a seat recorded in `round`.
pub(crate) fn round_entry<'a>(history: &'a [Value], seat: &str, round: u64) -> Option<&'a Value> {
    history
        .iter()
        .find(|h| seat_is(h, seat) && round_is(h, round))
}

/// A round value as it forms a key (`1` for `1`, as JavaScript writes it into a template).
pub fn round_text(round: &Value) -> String {
    round
        .as_str()
        .map_or_else(|| round.to_string(), str::to_string)
}

pub(crate) fn seat_id(seat: &Value) -> String {
    str_at(seat, "seat").unwrap_or_default().to_string()
}

pub(crate) fn ids_without(ids: &[String], own: &str) -> Vec<String> {
    ids.iter()
        .filter(|id| id.as_str() != own)
        .cloned()
        .collect()
}

pub(crate) fn list_of(value: Option<&Value>) -> Vec<Value> {
    items(value).to_vec()
}

pub(crate) fn stepped(
    answers: Option<Vec<Value>>,
    expected: usize,
) -> Result<Vec<Value>, SeatResolutionError> {
    match answers {
        Some(a) if a.len() == expected => Ok(a),
        _ => Err(SeatResolutionError::new(
            format!("the loop expected {expected} answer(s) for its last dispatch"),
            "loop-answers-mismatch",
        )),
    }
}
