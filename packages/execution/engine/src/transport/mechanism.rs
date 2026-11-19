//! In-process / out-of-process dispatch mechanism (Native-First Dispatch Doctrine rules 1, 2 and 4).
//!
//! `decide_dispatch_mechanism` is pure over three caller-supplied booleans; `decide_executor_dispatch_mechanism`
//! derives them from an `executors.<id>` entry. A cli-spawn-shaped executor (its own `command` or `adapter`, or a
//! `via: "cli"` invocation) is out-of-process whatever `has_live_task_access` says: it names a real, configured,
//! out-of-process target. `has_live_task_access` is never derived here; the caller declares it.

use fgos_execution::executor_model::lookup_executor;
use serde_json::Value;

/// How a dispatch runs. `unavailable` is not decided here: it is the answer when nothing serves a name.
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

/// The three facts the doctrine decides over.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct MechanismFacts {
    /// The target has a real native-dispatch mechanism at all.
    pub has_native_mechanism: bool,
    /// The calling session has live Agent/Task tool access right now, as it declares.
    pub has_live_task_access: bool,
    /// Config forces cli/spawn for isolation, which wins over native.
    pub force_cli_spawn: bool,
}

pub fn decide_dispatch_mechanism(facts: MechanismFacts) -> Mechanism {
    if !facts.has_native_mechanism || facts.force_cli_spawn {
        return Mechanism::OutOfProcess;
    }
    if facts.has_live_task_access {
        Mechanism::InProcess
    } else {
        Mechanism::OutOfProcess
    }
}

fn truthy(value: Option<&Value>) -> bool {
    match value {
        None | Some(Value::Null) | Some(Value::Bool(false)) => false,
        Some(Value::String(text)) => !text.is_empty(),
        Some(Value::Number(n)) => n.as_f64().is_some_and(|f| f != 0.0),
        Some(_) => true,
    }
}

/// `runner` is the runner config (`{executors, executor}`); `executor_id` the executor asked about.
pub fn decide_executor_dispatch_mechanism(
    runner: &Value,
    executor_id: Option<&str>,
    has_live_task_access: bool,
) -> Mechanism {
    let executor = executor_id
        .filter(|id| !id.is_empty())
        .and_then(|id| lookup_executor(runner, Some(id)).executor);
    let cli_shaped = executor.is_some_and(|entry| {
        truthy(entry.get("command"))
            || truthy(entry.get("adapter"))
            || entry
                .get("invocations")
                .and_then(Value::as_array)
                .is_some_and(|all| {
                    all.iter()
                        .any(|inv| inv.get("via").and_then(Value::as_str) == Some("cli"))
                })
    });
    if cli_shaped {
        return Mechanism::OutOfProcess;
    }
    decide_dispatch_mechanism(MechanismFacts {
        has_native_mechanism: executor
            .is_some_and(|e| e.get("kind").and_then(Value::as_str) == Some("agent")),
        has_live_task_access,
        force_cli_spawn: executor
            .is_some_and(|e| e.get("forceCliSpawn") == Some(&Value::Bool(true))),
    })
}
