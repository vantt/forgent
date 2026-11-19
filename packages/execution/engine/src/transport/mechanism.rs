//! In-process / out-of-process dispatch mechanism (Native-First Dispatch Doctrine rules 1, 2 and 4).
//!
//! `decide_dispatch_mechanism` is pure over three caller-supplied booleans. The answer for an `executors.<id>`
//! entry is the executor model's (`fgos_execution::executor_model::mechanism`), never a second derivation here;
//! `has_live_task_access` is never derived; the caller declares it.

pub use fgos_execution::executor_model::Mechanism;

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
