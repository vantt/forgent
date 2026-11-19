//! Assignment runner: turns one Assignment into one supervised attempt: legality and replay gate, immutable
//! input, admission, account lease, prompt, confinement request, envelope, handover and settle.
//!
//! One door per decision. The pieces another crate owns are called, never copied: the executor model and the
//! seat config digest are `fgos-execution`'s; the run control ledger, the attempt locks, the intent, the envelope
//! and its lane transport are `fgos-run-supervisor`'s controller; admission is [`crate::planning::admission`];
//! the lease and the login stores are [`crate::accounts`]; the settled result and the settlement are
//! [`crate::run_result`] and [`crate::settlement`]; the pane a terminal attempt runs in is
//! [`crate::transport_round`]; a durable write is `fgos-durable-file`'s; the checkout facts are `fgos-git`'s
//! (through [`crate::settlement::SettlementGit`]); the clock is `fgos_host_runtime::civil_time`.
//!
//! This module adds only what has no other owner:
//!
//! - [`legality`]: whether an assignment may run at all, and the replay of the binding a mutating unit-run
//!   assignment carries.
//! - [`inputs`]: the digests recorded before a launch (pinned inputs, files dirty before, the evaluator baseline).
//! - [`terminal_args`]: the argv an interactive agent starts with in a pane.
//! - [`lease`]: the provider account an attempt takes.
//! - [`attempt`]: what one attempt owns until the handover, and giving it back.
//! - [`outcome`]: what a resumed run already has.
//!
//! - [`seat`]: the seat of one attempt (command, confinement request, pane, envelope and its side file).
//! - [`launch`]: the handover to the supervisor and the wait for the settled answer.
//! - [`execute`]: the loop itself, over the machine behind [`execute::ExecutePorts`] (the decision door's plan, the
//!   config of a project, the prompt, the accounts, the pane, git), which the host wires.
//!
//! The attempt locks and Windows. Where `flock` holds (unix) the attempt lock and, for an attempt that writes, the
//! cwd lease are lent to the supervisor as descriptors 3 and 4 (`Handle::lend`); the controller keeps both handles
//! (the attempt copy until the binding, the cwd lease until the attempt is closed) and closing a lent handle never
//! waits on the child. A lock does not pass to a child with its handle on Windows: the controller releases its
//! attempt copy right after the spawn and the supervisor takes the attempt lock itself, as Node does; a mutating
//! attempt is refused there by name (`windows-cwd-lease-holder-missing`), since the Rust controller has no cwd
//! lease holder endpoint to name to the supervisor, and stays on the Node launch route. Nothing here writes a
//! script and then executes it; a caller that does, in a host with other threads, opens it close-on-exec and closes
//! it before the exec (the tests take one lock around such a pair).
//!
//! Golden vectors: `packages/execution/contracts/assignment-runner/`, replayed by `tests/assignment_runner.rs`.

pub mod attempt;
pub mod execute;
pub mod inputs;
pub mod launch;
pub mod lease;
pub mod legality;
pub mod outcome;
pub mod seat;
pub mod terminal_args;

use serde_json::{json, Map, Value};

/// Node's `RunnerConfigError`: a refusal with its message and, when a caller branches on it, a stable `code`, the
/// `phase` it happened in and the facts that name the cause.
#[derive(Debug, Clone, PartialEq)]
pub struct RunnerConfigError {
    pub message: String,
    pub code: Option<String>,
    pub phase: Option<String>,
    pub facts: Box<Map<String, Value>>,
}

impl RunnerConfigError {
    pub fn new(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            code: None,
            phase: None,
            facts: Box::default(),
        }
    }

    pub fn coded(message: impl Into<String>, code: &str) -> Self {
        Self {
            code: Some(code.to_string()),
            ..Self::new(message)
        }
    }

    pub fn post_admission(message: impl Into<String>, code: &str) -> Self {
        Self {
            phase: Some("post-admission".into()),
            ..Self::coded(message, code)
        }
    }

    pub fn with(mut self, key: &str, value: Value) -> Self {
        self.facts.insert(key.to_string(), value);
        self
    }

    /// `{ name, code, phase, message, ...facts }`, as the vectors state a thrown refusal.
    pub fn to_json(&self) -> Value {
        let mut out = Map::new();
        out.insert("name".into(), json!("RunnerConfigError"));
        out.insert("code".into(), json!(self.code));
        out.insert("phase".into(), json!(self.phase));
        out.insert("message".into(), json!(self.message));
        for (key, value) in self.facts.iter() {
            out.insert(key.clone(), value.clone());
        }
        Value::Object(out)
    }
}

impl std::fmt::Display for RunnerConfigError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.message)
    }
}

impl std::error::Error for RunnerConfigError {}
