//! The seat bind facade: one seat, one answer. Every decision (tier, ranking, independence, pins, effort,
//! continuity, the walk, the launch and account views, the pre-admission facts) is `fgos-execution`'s, asked in
//! process; this module builds the ask, carries the session and the lease-state overlay the bind must not read
//! itself, and carries the answer back. It never ranks, filters or derives a binding fact.
//!
//! `unit_run` and `assignment_runner` call it. The machine facts arrive as a [`Machine`] and the lease state as an
//! [`AccountStateSource`], so the facade holds no process, file or clock of its own; the instant is passed in.

use fgos_execution::bind::{self, AccountPin, BindRequest, BindSession, Preflight};
use fgos_execution::decide::{BindFailure, BoundSeat, SeatBinder, WorkSeatAsk};
use fgos_execution::executor_model::ModelError;
use fgos_execution::explain::explain_seat as crate_explain_seat;
use fgos_execution::loops::{Command, LoopInput, LoopRun, Step};
use fgos_execution::ports::Machine;
use fgos_execution::seat_resolver::{workflow_tier_of, SeatLedger};
use serde_json::{json, Map, Value};

/// What names one candidate of a seat's walk (executor, invocation, pool, model, effort): the bind's own key.
pub use fgos_execution::bind::binding_identity;
pub use fgos_execution::bind::BIND_CONTRACT_VERSION;

/// A refusal or failure of a facade call, under the class Node callers catch.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BindError {
    /// `RunnerConfigError`, `RangeError`, `TypeError` or `Error`.
    pub name: String,
    pub code: Option<String>,
    pub message: String,
}

impl BindError {
    pub(crate) fn runner_config(message: String, code: Option<String>) -> Self {
        BindError {
            name: "RunnerConfigError".into(),
            code,
            message,
        }
    }

    /// `{ name, code, message }`, as the vectors state a thrown error.
    pub fn to_json(&self) -> Value {
        json!({ "name": self.name, "code": self.code, "message": self.message })
    }
}

impl From<ModelError> for BindError {
    fn from(error: ModelError) -> Self {
        BindError {
            name: error.name.to_string(),
            code: error.code.map(str::to_string),
            message: error.message,
        }
    }
}

impl std::fmt::Display for BindError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.message)
    }
}

impl std::error::Error for BindError {}

/// The lease state of the provider accounts, read where the bind must not read it (outside the state lock).
/// The overlay is keyed by provider, as the account view reads it.
pub trait AccountStateSource {
    fn overlay(&self, now_ms: u64) -> Value;
}

/// What a bind is asked besides the ask: the run's runner section, the session, and the lease state.
pub struct BindContext<'a> {
    pub runner_config: &'a Value,
    pub session: BindSession,
    pub machine: &'a dyn Machine,
    /// `None` binds from the config alone, as replay and explain read it.
    pub accounts: Option<&'a dyn AccountStateSource>,
}

/// Where a seat stands after a failure; the keys `fgos-execution::bind` reads (`tried`, `excludePools`,
/// `failedAccounts`, `continuity`, `from`, `rotation`, `detail`, `reason`).
pub type Walk = Value;

/// What the pattern hands its seat runner: the seat, its unit, and the seats it must or would rather differ from.
pub struct SeatRequest<'a> {
    pub seat: &'a Value,
    pub unit: &'a Value,
    pub independent_of: &'a [String],
    pub prefer_independent_of: &'a [String],
}

/// What the run states beside the seat.
#[derive(Debug, Clone, Default)]
pub struct AskOptions<'a> {
    pub overrides: Vec<Value>,
    pub workflow_id: Option<&'a str>,
    pub raise_authorized: bool,
    pub blind: bool,
}

/// The ask of one seat, built alike by the run and the dry bind. Independence and spread are read from the seat
/// ledger now, so they see exactly the seats bound before this one; independence is symmetric (a seat bound
/// earlier that must differ from this one holds it to that too).
pub fn ask_for(request: &SeatRequest<'_>, ledger: &SeatLedger, options: &AskOptions<'_>) -> Value {
    let seat = request.seat;
    let seat_id = seat.get("seat").and_then(Value::as_str).unwrap_or_default();
    let mut independent = ledger.resolve(request.independent_of);
    independent.extend(ledger.dependent_executors(seat_id));
    let mut ask = Map::new();
    ask.insert("unit".into(), request.unit.clone());
    ask.insert(
        "seat".into(),
        seat.get("seat").cloned().unwrap_or(Value::Null),
    );
    ask.insert(
        "role".into(),
        seat.get("role").cloned().unwrap_or(Value::Null),
    );
    ask.insert(
        "posture".into(),
        seat.get("posture").cloned().unwrap_or(Value::Null),
    );
    if let Some(persona) = seat
        .get("persona")
        .filter(|p| crate::assignment::truthy(Some(p)))
    {
        ask.insert("persona".into(), persona.clone());
    }
    if let Some(tier) = workflow_tier_of(seat, request.unit, options.workflow_id) {
        ask.insert("workflowTier".into(), tier);
    }
    ask.insert("raiseAuthorized".into(), json!(options.raise_authorized));
    ask.insert(
        "readOnly".into(),
        seat.pointer("/posture/readOnly")
            .cloned()
            .unwrap_or(Value::Null),
    );
    ask.insert("independentOf".into(), json!(independent));
    if !request.prefer_independent_of.is_empty() {
        let spread: Vec<Value> = ledger
            .seats(request.prefer_independent_of)
            .into_iter()
            .map(|(seat, executor)| json!({ "seat": seat, "executor": executor }))
            .collect();
        ask.insert("preferIndependentOf".into(), Value::Array(spread));
    }
    ask.insert("overrides".into(), Value::Array(options.overrides.clone()));
    if options.blind {
        ask.insert("blind".into(), json!(true));
    }
    Value::Object(ask)
}

/// The binding with the version of the code that decided it, kept next to what it was decided from.
fn with_host_version(mut binding: Value) -> Value {
    if let Some(input) = binding
        .get_mut("bindingInput")
        .and_then(Value::as_object_mut)
    {
        input.insert("hostVersion".into(), json!(env!("CARGO_PKG_VERSION")));
    }
    binding
}

fn session_of(ctx: &BindContext<'_>) -> BindSession {
    ctx.session
}

fn overlay_of(ctx: &BindContext<'_>, now: u64) -> Option<Value> {
    ctx.accounts.map(|source| source.overlay(now))
}

/// The binding of one seat (one in-process call), or `{ refused: { reason, detail } }`; execution admission
/// belongs to the calling door. `walk` says where the seat stands after a failure; `head_launch` is set by the
/// head start alone.
pub fn bind(
    ask: &Value,
    ctx: &BindContext<'_>,
    walk: &Walk,
    head_launch: bool,
    now: u64,
) -> Result<Value, BindError> {
    Ok(bind_model(ask, ctx, walk, head_launch, now)?)
}

fn bind_model(
    ask: &Value,
    ctx: &BindContext<'_>,
    walk: &Walk,
    head_launch: bool,
    now: u64,
) -> Result<Value, ModelError> {
    let account_state = overlay_of(ctx, now);
    let request = BindRequest {
        ask,
        runner: ctx.runner_config,
        session: session_of(ctx),
        walk,
        account_state: account_state.as_ref(),
    };
    let binding = bind::bind(&request, ctx.machine, now)?;
    let refusal = if head_launch {
        None
    } else {
        bind::bypass_outside_head_refusal(&binding, ctx.runner_config)
    };
    Ok(match refusal {
        Some(refused) => json!({ "refused": refused }),
        None => with_host_version(binding),
    })
}

/// The Work seat through this facade (the bypass fence and the host version included), as the dispatch policy
/// asks it: one headless producer seat, its posture judged at launch, bound from the config alone.
pub struct FacadeBinder<'a> {
    pub machine: &'a dyn Machine,
    /// Epoch milliseconds.
    pub now: u64,
}

impl SeatBinder for FacadeBinder<'_> {
    fn bind_work_seat(&self, runner: &Value, ask: &WorkSeatAsk) -> Result<BoundSeat, BindFailure> {
        let mut unit = ask.unit.clone();
        if let Some(map) = unit.as_object_mut() {
            map.insert("writes".into(), json!([]));
        }
        let request = json!({
            "unit": unit, "seat": "producer", "role": ask.role, "readOnly": ask.read_only,
            "overrides": ask.overrides, "raiseAuthorized": false,
        });
        let ctx = BindContext {
            runner_config: runner,
            session: BindSession {
                headless: true,
                has_native_agent: false,
                posture_at_launch: true,
            },
            machine: self.machine,
            accounts: None,
        };
        let bound =
            bind_model(&request, &ctx, &json!({}), false, self.now).map_err(BindFailure::Failed)?;
        if let Some(refused) = bound.get("refused") {
            let text = |key: &str| {
                refused
                    .get(key)
                    .and_then(Value::as_str)
                    .unwrap_or_default()
                    .to_string()
            };
            let fix = text("fix");
            return Err(BindFailure::Refused {
                code: text("reason"),
                detail: if fix.is_empty() {
                    text("detail")
                } else {
                    format!("{}; {fix}", text("detail"))
                },
            });
        }
        Ok(BoundSeat {
            executor: text_at(&bound, "executor"),
            invocation: bound
                .get("invocation")
                .and_then(Value::as_str)
                .map(str::to_string),
            binding: bound,
        })
    }
}

fn text_at(value: &Value, key: &str) -> String {
    value
        .get(key)
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string()
}

/// The seat a Work operation or a raw dispatch runs: one headless producer seat by the same call a unit run
/// makes, its posture judged at launch (so the ask names no writes); a stated executor, tier or effort is one
/// override, and a refusal is an error, named. `unit` is `{ id, capability, rigor }`.
pub fn bind_work_seat(
    runner_config: &Value,
    unit: &Value,
    role: &str,
    read_only: bool,
    overrides: Vec<Value>,
    machine: &dyn Machine,
    now: u64,
) -> Result<Value, BindError> {
    let ask = WorkSeatAsk {
        unit: unit.clone(),
        role: role.into(),
        read_only,
        overrides,
    };
    match (FacadeBinder { machine, now }).bind_work_seat(runner_config, &ask) {
        Ok(seat) => Ok(seat.binding),
        Err(BindFailure::Refused { code, detail }) => Err(BindError::runner_config(
            format!("{code}: {detail}"),
            Some(code),
        )),
        Err(BindFailure::Failed(error)) => Err(error.into()),
    }
}

/// Why a seat lands where it does, read-only (nothing leased, spawned or written): the binding, the crate's
/// ranked candidates, skip reasons and explanation, the launch view, and the walk a failure would take, one
/// binding per step.
pub fn explain_seat(
    ask: &Value,
    ctx: &BindContext<'_>,
    walk: &Walk,
    now: u64,
) -> Result<Value, BindError> {
    let account_state = overlay_of(ctx, now);
    let request = BindRequest {
        ask,
        runner: ctx.runner_config,
        session: session_of(ctx),
        walk,
        account_state: account_state.as_ref(),
    };
    let explained = crate_explain_seat(&request, ctx.machine, now)?;
    let output = explained.output.as_ref();
    let mut out = Map::new();
    out.insert("binding".into(), with_host_version(explained.binding));
    for key in ["policy", "ranked", "explain"] {
        if let Some(value) = output.and_then(|o| o.get(key)) {
            out.insert(key.into(), value.clone());
        }
    }
    if let Some(view) = explained.launch_view {
        out.insert("launchView".into(), view);
    }
    out.insert(
        "walk".into(),
        Value::Array(explained.walk.into_iter().map(with_host_version).collect()),
    );
    Ok(Value::Object(out))
}

/// What a run start asks before any bind.
pub struct PreflightRequest<'a> {
    pub runner_config: &'a Value,
    pub session: BindSession,
    /// A pinned account `{ pool, id }`.
    pub pin: Option<AccountPin>,
    pub accounts: Option<&'a dyn AccountStateSource>,
}

/// The pre-admission facts of a run start, before any bind: `agentCliMissing` and `pinQuarantinedUntil`. The
/// account state is read through `accounts` only when a pin is named.
pub fn preflight_of(request: &PreflightRequest<'_>, machine: &dyn Machine, now: u64) -> Preflight {
    let account_state = request
        .pin
        .as_ref()
        .and(request.accounts)
        .map(|source| source.overlay(now));
    bind::preflight(
        request.runner_config,
        &request.session,
        request.pin.as_ref(),
        account_state.as_ref(),
        machine,
        now,
    )
}

/// How the dry bind is asked.
#[derive(Debug, Clone, Default)]
pub struct DryBindOptions<'a> {
    /// The session every seat is bound in; `None` is a headless session. A stated session is taken whole, so a
    /// caller that binds for a person states `headless: false`.
    pub session: Option<BindSession>,
    pub overrides: Vec<Value>,
    pub raise_authorized: bool,
    pub workflow_id: Option<&'a str>,
}

/// Binds every seat a unit's pattern would dispatch, in the order the pattern dispatches them, without running
/// any of them: each seat is asked exactly as a real run asks it, and a seat that binds is recorded in the ledger,
/// so independence holds both ways as in the run. `effective` is the unit's resolved collaboration (the
/// `{ loop, params, seats }` the run drives); resolving it is the unit run's door. Nothing is started or written.
///
/// A loop that asks for a deterministic verify is refused (`TypeError`): a dry bind has no verify hook.
pub fn simulate_unit_bindings(
    unit: &Value,
    runner_config: &Value,
    effective: &Value,
    options: &DryBindOptions<'_>,
    machine: &dyn Machine,
    now: u64,
) -> Result<Value, BindError> {
    let mut ledger = SeatLedger::new();
    let mut seats: Vec<Value> = Vec::new();
    let blind = unit.get("blind") == Some(&json!(true));
    let ctx = BindContext {
        runner_config,
        session: options.session.unwrap_or(BindSession {
            headless: true,
            ..BindSession::default()
        }),
        machine,
        accounts: None,
    };
    let ask_options = AskOptions {
        overrides: options.overrides.clone(),
        workflow_id: options.workflow_id,
        raise_authorized: options.raise_authorized,
        blind,
    };
    let invalid = |e: fgos_execution::seat_resolver::SeatResolutionError| BindError {
        name: e.class.into(),
        code: Some(e.code).filter(|code| !code.is_empty()),
        message: e.message,
    };
    let mut run = LoopRun::new(LoopInput::from_effective(
        effective,
        unit.clone(),
        runner_config.clone(),
    ))
    .map_err(invalid)?;
    let mut answers: Option<Vec<Value>> = None;
    loop {
        let commands = match run.step(answers.take()).map_err(invalid)? {
            Step::Done(result) => {
                return Ok(json!({ "outcome": result.outcome, "seats": seats }));
            }
            Step::Dispatch(commands) => commands,
        };
        let mut replies = Vec::new();
        for command in commands {
            let Command::Role(call) = command else {
                return Err(BindError {
                    name: "TypeError".into(),
                    code: None,
                    message: "verify hook is required when verification is configured".into(),
                });
            };
            let independent = string_list(call.independent_of.as_deref());
            let prefer = string_list(call.prefer_independent_of.as_deref());
            let ask = ask_for(
                &SeatRequest {
                    seat: &call.seat,
                    unit: &call.unit,
                    independent_of: &independent,
                    prefer_independent_of: &prefer,
                },
                &ledger,
                &ask_options,
            );
            let bound = bind(&ask, &ctx, &json!({}), false, now)?;
            let seat_id = call
                .seat
                .get("seat")
                .and_then(Value::as_str)
                .unwrap_or_default();
            let role = call.seat.get("role").cloned().unwrap_or(Value::Null);
            if let Some(refused) = bound.get("refused") {
                seats.push(json!({ "seat": seat_id, "role": role, "refused": refused }));
                replies.push(json!({
                    "outcome": "policy-refusal", "seat": seat_id, "role": role, "refused": refused,
                }));
                continue;
            }
            if let Some(executor) = bound.get("executor").and_then(Value::as_str) {
                ledger.note(seat_id, executor);
            }
            ledger.note_dependence(seat_id, &independent);
            seats.push(seat_record(seat_id, &role, &bound));
            replies.push(json!({ "outcome": "pass", "seat": seat_id, "role": role }));
        }
        answers = Some(replies);
    }
}

fn string_list(list: Option<&[String]>) -> Vec<String> {
    list.map(<[String]>::to_vec).unwrap_or_default()
}

/// What a bound seat contributes to the simulation.
fn seat_record(seat: &str, role: &Value, bound: &Value) -> Value {
    let mut record = Map::new();
    record.insert("seat".into(), json!(seat));
    record.insert("role".into(), role.clone());
    for key in ["executor", "invocation", "tier"] {
        record.insert(key.into(), bound.get(key).cloned().unwrap_or(Value::Null));
    }
    let provenance = bound.get("provenance");
    if let Some(lowered) = provenance
        .and_then(|p| p.pointer("/tier/loweredFrom"))
        .filter(|v| !v.is_null())
    {
        record.insert("loweredFrom".into(), lowered.clone());
    }
    if let Some(account) = bound
        .get("account")
        .filter(|a| crate::assignment::truthy(Some(a)))
    {
        record.insert("account".into(), account.clone());
    }
    if let Some(skipped) = provenance
        .and_then(|p| p.pointer("/account/skipped"))
        .filter(|s| crate::assignment::truthy(Some(s)))
    {
        record.insert("accountSkipped".into(), skipped.clone());
    }
    if let Some(shared) = provenance
        .and_then(|p| p.pointer("/familySpread/value/sharedWith"))
        .filter(|s| s.as_array().is_some_and(|l| !l.is_empty()))
    {
        record.insert("sharesFamilyWith".into(), shared.clone());
    }
    Value::Object(record)
}
