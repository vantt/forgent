//! Whether an assignment may run at all.
//!
//! Two gates, both fail closed. The legality gate: a declared assignment's operation must be one its step declared,
//! a human-only operation never runs here, and a caller that requires read-only execution refuses a mutating one.
//! The mutating gate, for an inline or unit-run assignment whatever the caller says: the caller asserts
//! `isReadOnlyMode: false` explicitly, a unit-run assignment runs in its unit's linked worktree (never the main
//! checkout), carries the binding `bind()` produced, and that binding is replayed from the committed config and
//! must match.
//!
//! Trust boundary (`docs/platform/runner/contracts/routing-handoff.md`): a caller able to write under `.fgos/` is in
//! the same trust class as the user who invoked it, so this is mistake-proofing, not authentication.

use std::fs;
use std::path::{Path, PathBuf};

use fgos_execution::bind::{seat_config_digest, BindSession};
use fgos_execution::decide::CheckoutFacts;
use fgos_execution::ports::Machine;
use fgos_execution::seat_resolver::bind_seat_of;
use serde_json::{json, Value};

use super::RunnerConfigError;
use crate::accounts::rotation::walk_state_of;
use crate::assignment::builder::is_read_only_assignment;
use crate::assignment::normalizer::stamp_declared_assignment;
use crate::contract::validate::{
    extract_protocol_operation_stamp, resolve_mutating_cwd_posture, MutatingCwdPosture,
};
use crate::planning::bind_facade::{bind, AccountStateSource, BindContext};

/// The lease state a bind read, kept on its attempt and handed back to the recheck's bind unchanged.
struct RecordedOverlay {
    overlay: Value,
}

impl AccountStateSource for RecordedOverlay {
    fn overlay(&self, _now_ms: u64) -> Value {
        self.overlay.clone()
    }
}

/// The bind the recheck recomputes for a seat: the ask the unit record states, the committed config, and the
/// account state the original bind read (when it recorded one) replayed at the time it read it; a record without
/// one binds from the config alone, as a bind that read no account state did. The one place that builds this ask.
#[allow(clippy::too_many_arguments)]
pub fn replay_bind(
    unit_record: &Value,
    seat: &str,
    round: &str,
    assignment_id: &str,
    committed: &Value,
    account_state: Option<&Value>,
    session: BindSession,
    machine: &dyn Machine,
) -> Result<Value, crate::planning::bind_facade::BindError> {
    let mut ask = bind_seat_of(unit_record, seat);
    if let Some(map) = ask.as_object_mut() {
        map.insert(
            "unit".into(),
            unit_record.get("unit").cloned().unwrap_or(Value::Null),
        );
        map.insert("readOnly".into(), json!(false));
        map.insert(
            "overrides".into(),
            unit_record
                .get("overrides")
                .filter(|o| o.is_array())
                .cloned()
                .unwrap_or_else(|| json!([])),
        );
    }
    let walk = walk_state_of(unit_record, seat, round, assignment_id);
    let replayed = account_state.map(|state| RecordedOverlay {
        overlay: state.get("overlay").cloned().unwrap_or_else(|| json!({})),
    });
    let at = account_state
        .and_then(|state| state.get("at"))
        .and_then(Value::as_u64)
        .unwrap_or(0);
    let context = BindContext {
        runner_config: committed,
        session,
        machine,
        accounts: replayed.as_ref().map(|o| o as &dyn AccountStateSource),
    };
    bind(&ask, &context, &walk, false, at)
}

/// What the caller states beside the assignment.
#[derive(Default)]
pub struct LegalityOptions<'a> {
    /// The legal operations of the step, handed in now (stricter than the list the assignment recorded).
    pub operations: Option<&'a [Value]>,
    /// `Some(false)` is the explicit assertion a mutating inline or unit-run assignment needs; `Some(true)` also
    /// requires the assignment to be read-only; `None` (omitted) reads as read-only.
    pub is_read_only_mode: Option<bool>,
    pub cwd: Option<&'a str>,
    pub repo_root: Option<&'a Path>,
    /// The caller's live runner config; else the project's on disk.
    pub committed_runner_config: Option<&'a Value>,
    pub session: BindSession,
    /// The executor the launch pins (`launchPinOf(opts).executor`).
    pub pinned_executor: Option<&'a str>,
}

/// What the gate reads of the machine.
pub struct LegalityFacts<'a> {
    pub checkout: &'a dyn CheckoutFacts,
    pub machine: &'a dyn Machine,
    /// The runner config committed under a project root.
    pub load_runner_config: &'a dyn Fn(&Path) -> Result<Value, String>,
    /// The main checkout's `.fgos` directory of a root.
    pub fgos_dir_of_root: &'a dyn Fn(&Path) -> PathBuf,
}

fn text<'a>(value: &'a Value, key: &str) -> &'a str {
    value.get(key).and_then(Value::as_str).unwrap_or_default()
}

fn quoted(value: Option<&Value>) -> String {
    match value {
        None | Some(Value::Null) => String::new(),
        Some(Value::String(s)) => s.clone(),
        Some(other) => other.to_string(),
    }
}

/// The mutation the normalizer would stamp for this role/operation pair, for an assignment.json written without
/// one: derived from the normalizer itself, never a second hand-kept table.
pub fn fallback_mutation_for_assignment(assignment: &Value) -> Option<String> {
    let operation = assignment
        .get("operation")
        .and_then(Value::as_str)
        .filter(|o| !o.is_empty())?;
    Some(
        stamp_declared_assignment(assignment.get("role").and_then(Value::as_str), operation)
            .mutation
            .to_string(),
    )
}

/// The unit run an assignment belongs to: its declared id, else the prefix of its assignment id.
pub fn unit_run_id_of(assignment: &Value) -> Option<String> {
    let declared = |v: Option<&Value>| {
        v.and_then(Value::as_str)
            .filter(|s| !s.is_empty())
            .map(str::to_string)
    };
    declared(assignment.get("unitRunId"))
        .or_else(|| declared(assignment.pointer("/provenance/unitRunId")))
        .or_else(|| {
            assignment
                .get("assignmentId")
                .and_then(Value::as_str)
                .and_then(|id| id.split('/').next())
                .filter(|s| !s.is_empty())
                .map(str::to_string)
        })
}

/// The seat a unit-run assignment fills: a unit running a Work step operation stamps the operation's role on the
/// assignment and keeps the seat's own id in provenance.
pub fn seat_id_of(assignment: &Value) -> String {
    if assignment
        .pointer("/provenance/kind")
        .and_then(Value::as_str)
        == Some("unit-run")
    {
        if let Some(seat) = assignment
            .pointer("/provenance/seat")
            .and_then(Value::as_str)
            .filter(|s| !s.is_empty())
        {
            return seat.to_string();
        }
    }
    text(assignment, "role").to_string()
}

fn refuse(message: String) -> RunnerConfigError {
    RunnerConfigError::new(message)
}

/// The binding gate of a mutating inline or unit-run assignment.
pub fn assert_inline_mutating_assignment_authorized(
    assignment: &Value,
    options: &LegalityOptions<'_>,
    facts: &LegalityFacts<'_>,
) -> Result<(), RunnerConfigError> {
    if text(assignment, "mutation") != "mutating" {
        return Ok(());
    }
    let kind = assignment
        .pointer("/provenance/kind")
        .and_then(Value::as_str);
    if kind != Some("inline") && kind != Some("unit-run") {
        return Ok(());
    }
    let id = text(assignment, "assignmentId");
    if options.is_read_only_mode != Some(false) {
        return Err(refuse(format!(
            "executeAssignment: inline mutating assignment \"{id}\" refused -- mutation requires the caller to assert isReadOnlyMode: false explicitly (an omitted flag is read-only)"
        )));
    }
    let cwd = options
        .cwd
        .map(str::to_string)
        .or_else(|| {
            std::env::current_dir()
                .ok()
                .map(|p| p.to_string_lossy().into_owned())
        })
        .unwrap_or_default();

    // The protocol-operation stamp path is retired: a claim of it is refused.
    if let Some(stamp) = extract_protocol_operation_stamp(
        assignment.pointer("/provenance/inline/contract/constraints"),
    ) {
        return Err(refuse(format!(
            "executeAssignment: mutating inline assignment \"{id}\" claims protocol-operation stamp for definition \"{}\", but CoordinationProtocol engine has been retired",
            stamp.definition_id
        )));
    }

    let is_unit_run = kind == Some("unit-run")
        || assignment
            .get("unitRunId")
            .is_some_and(|v| !v.is_null() && v != &json!(""));
    if !is_unit_run {
        return Err(refuse(format!(
            "executeAssignment: mutating inline assignment \"{id}\" carries no single, well-formed engine-reserved protocol-operation stamp and no verified unit-run gate -- refused"
        )));
    }

    let Some(unit_run_id) = unit_run_id_of(assignment) else {
        return Err(refuse(format!(
            "executeAssignment: mutating unit-run assignment \"{id}\" has unresolvable unitRunId -- refused"
        )));
    };
    let root = match options.repo_root {
        Some(root) => root.to_path_buf(),
        None => PathBuf::from(
            facts
                .checkout
                .repo_root(&cwd)
                .unwrap_or_else(|_| cwd.clone()),
        ),
    };
    let unit_json_path = (facts.fgos_dir_of_root)(&root)
        .join("assignments")
        .join(&unit_run_id)
        .join("unit.json");
    if !unit_json_path.exists() {
        return Err(refuse(format!(
            "executeAssignment: mutating unit-run assignment \"{id}\" refers to missing unit.json at \"{}\" -- refused",
            unit_json_path.display()
        )));
    }
    let unit_record: Value = fs::read_to_string(&unit_json_path)
        .map_err(|e| e.to_string())
        .and_then(|raw| serde_json::from_str(&raw).map_err(|e| e.to_string()))
        .map_err(|e| {
            refuse(format!(
                "executeAssignment: mutating unit-run assignment \"{id}\" has corrupt unit.json at \"{}\" -- refused ({e})",
                unit_json_path.display()
            ))
        })?;

    match resolve_mutating_cwd_posture(facts.checkout, &cwd) {
        MutatingCwdPosture::Ok { .. } => {}
        posture => {
            let reason = match &posture {
                MutatingCwdPosture::MainCheckout { repo_root } => format!(
                    "resolves to the main checkout (\"{repo_root}\"); a mutating dispatch must run in a linked git worktree, never the main checkout"
                ),
                MutatingCwdPosture::OutsideGit => "does not resolve inside any git checkout (fail closed on an unresolvable root, never fail open)".to_string(),
                _ => "toplevel could not be resolved; fail closed, never fail open".to_string(),
            };
            return Err(refuse(format!(
                "executeAssignment: mutating unit-run assignment \"{id}\" refused -- cwd \"{cwd}\" {reason}"
            )));
        }
    }

    let expected_worktree = unit_record
        .get("worktree")
        .and_then(Value::as_str)
        .unwrap_or_default();
    let (real_cwd, real_expected) = match (fs::canonicalize(&cwd), fs::canonicalize(expected_worktree)) {
        (Ok(a), Ok(b)) => (a, b),
        (Err(e), _) | (_, Err(e)) => {
            return Err(refuse(format!(
                "executeAssignment: mutating unit-run assignment \"{id}\" could not resolve realpath for worktree -- refused ({e})"
            )))
        }
    };
    if real_cwd != real_expected {
        return Err(refuse(format!(
            "executeAssignment: mutating unit-run assignment \"{id}\" worktree mismatch: cwd \"{}\" does not match unit.json worktree \"{}\" -- refused",
            real_cwd.display(),
            real_expected.display()
        )));
    }

    // Fail closed: a mutating unit-run assignment must carry the binding that bind() produced for it. Without one
    // there is nothing to compare, and an assignment could pin any executor through `policy.preferExecutor`.
    let carried = |key: &str| {
        assignment
            .get(key)
            .filter(|v| crate::planning::truthy(Some(v)))
    };
    let Some(carried_binding) = carried("binding").or_else(|| {
        assignment
            .pointer("/provenance/binding")
            .filter(|v| crate::planning::truthy(Some(v)))
    }) else {
        return Err(refuse(format!(
            "executeAssignment: mutating unit-run assignment \"{id}\" carries no binding -- refused"
        )));
    };

    // Replay: what the seat was bound from is read back from the record, and stage 1 is recomputed from the
    // committed config (the caller's live one, else the project's on disk) -- never from a copy kept in unit.json,
    // which a worker can write. A config that changed since the bind refuses the write.
    let seat = seat_id_of(assignment);
    let round = quoted(assignment.get("round"));
    let recorded = unit_record
        .pointer(&format!(
            "/bindings/{}",
            json_pointer_key(&format!("{seat}/{round}"))
        ))
        .and_then(Value::as_array)
        .and_then(|attempts| {
            attempts
                .iter()
                .find(|attempt| attempt.get("assignmentId").and_then(Value::as_str) == Some(id))
        });
    let Some(bound_digest) = recorded
        .and_then(|r| r.pointer("/binding/bindingInput/configDigest"))
        .and_then(Value::as_str)
        .filter(|d| !d.is_empty())
    else {
        return Err(RunnerConfigError::coded(
            format!("executeAssignment: mutating unit-run assignment \"{id}\" has no recorded binding input to replay -- refused"),
            "binding-replay-snapshot-missing",
        ));
    };
    let committed = match options.committed_runner_config {
        Some(config) => config.clone(),
        None => (facts.load_runner_config)(&root).map_err(RunnerConfigError::new)?,
    };
    if seat_config_digest(&committed) != bound_digest {
        return Err(RunnerConfigError::coded(
            format!("executeAssignment: mutating unit-run assignment \"{id}\" was bound under a different seat config than the committed one -- refused"),
            "binding-replay-config-mismatch",
        ));
    }

    let account_state = recorded.and_then(|r| r.get("accountState")).filter(|s| s.is_object());
    let recomputed = replay_bind(
        &unit_record,
        &seat,
        &round,
        id,
        &committed,
        account_state,
        options.session,
        facts.machine,
    )
    .map_err(|e| refuse(format!("executeAssignment: mutating unit-run assignment \"{id}\" recomputed binding failed: {e}")))?;
    let digest_of = |binding: &Value| {
        binding
            .pointer("/bindingInput/accountViewDigest")
            .and_then(Value::as_str)
            .map(str::to_string)
    };
    let recorded_view = recorded.and_then(|r| r.get("binding")).and_then(digest_of);
    if let Some(recorded_view) = recorded_view {
        if digest_of(&recomputed).as_deref() != Some(recorded_view.as_str()) {
            let (what, code) = if account_state.is_some() {
                (
                    "was bound from an account view its recorded account state no longer reproduces",
                    "binding-replay-account-view-mismatch",
                )
            } else {
                (
                    "was bound from account state that was not recorded",
                    "binding-replay-account-view-missing",
                )
            };
            return Err(RunnerConfigError::coded(
                format!("executeAssignment: mutating unit-run assignment \"{id}\" {what} -- refused"),
                code,
            ));
        }
    }
    if let Some(refused) = recomputed.get("refused").filter(|r| !r.is_null()) {
        return Err(refuse(format!(
            "executeAssignment: mutating unit-run assignment \"{id}\" recomputed binding refused: {} ({})",
            quoted(refused.get("reason")),
            quoted(refused.get("detail"))
        )));
    }

    let field = |value: &Value, key: &str| -> Value {
        value
            .get(key)
            .filter(|v| !v.is_null())
            .cloned()
            .unwrap_or(Value::Null)
    };
    let same = recomputed.get("executor") == carried_binding.get("executor")
        && field(&recomputed, "pool") == field(carried_binding, "pool")
        && recomputed.get("tier") == carried_binding.get("tier")
        && field(&recomputed, "reasoningEffort") == field(carried_binding, "reasoningEffort")
        && recomputed.get("posture") == carried_binding.get("posture");
    if !same {
        let shape = |v: &Value| {
            format!(
                "{{ executor: \"{}\", pool: \"{}\", tier: \"{}\", effort: \"{}\", posture: \"{}\" }}",
                quoted(v.get("executor")),
                quoted(v.get("pool")),
                quoted(v.get("tier")),
                quoted(v.get("reasoningEffort")),
                quoted(v.get("posture"))
            )
        };
        return Err(refuse(format!(
            "executeAssignment: mutating unit-run assignment \"{id}\" binding mismatch: recomputed {} does not match assignment {} -- refused",
            shape(&recomputed),
            shape(carried_binding)
        )));
    }
    let pinned = assignment
        .pointer("/policy/preferExecutor")
        .and_then(Value::as_str)
        .or(options.pinned_executor);
    if let Some(pinned) = pinned {
        if recomputed.get("executor").and_then(Value::as_str) != Some(pinned) {
            return Err(refuse(format!(
                "executeAssignment: mutating unit-run assignment \"{id}\" pins executor \"{pinned}\" but the verified binding is \"{}\" -- refused",
                quoted(recomputed.get("executor"))
            )));
        }
    }
    Ok(())
}

/// A key as one JSON pointer segment.
fn json_pointer_key(key: &str) -> String {
    key.replace('~', "~0").replace('/', "~1")
}

/// Whether `assignment` may run under `options`: the declared-operation check, human-only, strict read-only and
/// the mutating gate.
pub fn validate_assignment_legality(
    assignment: &Value,
    options: &LegalityOptions<'_>,
    facts: &LegalityFacts<'_>,
) -> Result<(), RunnerConfigError> {
    if !assignment.is_object() {
        return Err(refuse(
            "executeAssignment requires an assignment object".into(),
        ));
    }
    let id = text(assignment, "assignmentId");
    let operation = text(assignment, "operation");
    // An inline Assignment carries no domain, stage or operation, so the declared-operation check is skipped for it.
    let inline = assignment
        .pointer("/provenance/kind")
        .and_then(Value::as_str)
        == Some("inline");
    if !inline && !text(assignment, "stage").is_empty() && !operation.is_empty() {
        // The legal operations of the step come from the Workflow the Work layer built this Assignment from: either
        // handed in now (stricter) or the list the builder validated against and recorded. Dispatch never resolves a
        // step's operations itself, so an Assignment that carries neither is refused rather than trusted.
        let legal = options.operations.map(<[Value]>::to_vec).or_else(|| {
            assignment
                .pointer("/provenance/declared/legalOperations")
                .and_then(Value::as_array)
                .cloned()
        });
        let Some(legal) = legal else {
            return Err(refuse(format!(
                "declared assignment \"{id}\" carries no legal-operation list for stage \"{}\" -- refused",
                text(assignment, "stage")
            )));
        };
        let ids: Vec<String> = legal
            .iter()
            .map(|o| {
                o.as_str()
                    .map(str::to_string)
                    .unwrap_or_else(|| quoted(o.get("id")))
            })
            .collect();
        if !ids.iter().any(|i| i == operation) {
            return Err(refuse(format!(
                "unknown operation \"{operation}\" for stage \"{}\" in domain \"{}\" (declared operations: [{}])",
                text(assignment, "stage"),
                text(assignment, "domain"),
                ids.join(", ")
            )));
        }
        let matched = options.operations.and_then(|ops| {
            ops.iter()
                .find(|o| o.get("id").and_then(Value::as_str) == Some(operation))
        });
        if matched
            .and_then(|m| m.get("dispatch"))
            .and_then(Value::as_str)
            == Some("human-only")
        {
            return Err(refuse(format!(
                "cannot execute human-only operation \"{operation}\" via cli-spawn"
            )));
        }
    }
    if text(assignment, "dispatch") == "human-only" {
        return Err(refuse(format!(
            "cannot execute human-only operation \"{operation}\" via cli-spawn"
        )));
    }
    // A caller that requires strictly read-only execution refuses a mutating Assignment; read-only status comes
    // solely from the stamped `mutation`. Runs for declared and inline Assignments alike.
    if options.is_read_only_mode == Some(true) && !is_read_only_assignment(assignment) {
        return Err(refuse(format!(
            "cannot execute mutating operation \"{operation}\" (role: \"{}\") in mission-lite mode — mission-lite is strictly read-only",
            text(assignment, "role")
        )));
    }
    // Checked where mutation is honored, whatever `isReadOnlyMode` says (a direct caller controls the options).
    assert_inline_mutating_assignment_authorized(assignment, options, facts)
}
