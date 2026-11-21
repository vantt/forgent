//! `DispatchError` and `RunSupervisorError` of the Node controller: a coded refusal with a message and
//! free-form detail (`src/run-supervisor/dispatch-error.mjs`, `client.mjs`). A failure of the holder-lock driver on
//! the way (`HolderLockError` in Node, `src/holder-lock/protocol.mjs`) rides the same type, marked as such, so a
//! caller tells a refusal of the controller from a lock that could not be taken at all.

use serde_json::{Map, Value};
use std::fmt;

/// A refusal of the controller: `code` doubles as the error class (`dispatch-in-flight`, `worker-spawn-fail`, ...).
#[derive(Debug, Clone, PartialEq)]
pub struct DispatchError {
    pub code: String,
    pub message: String,
    pub detail: Map<String, Value>,
    /// The holder-lock driver failed (`lock-driver-unavailable`, `lock-order-violation` and the other codes of the
    /// holder-lock facade): not a refusal of the controller, and the CLI exits with `precondition` for it.
    pub holder_lock: bool,
}

impl DispatchError {
    pub fn new(code: &str, message: impl Into<String>) -> Self {
        Self {
            code: code.to_string(),
            message: message.into(),
            detail: Map::new(),
            holder_lock: false,
        }
    }

    /// A failure of the holder-lock driver under its own code, worded as Node's `HolderLockError`.
    pub fn holder_lock(code: &str, message: impl std::fmt::Display) -> Self {
        Self {
            holder_lock: true,
            ..Self::new(code, format!("holder-lock ({code}): {message}"))
        }
    }

    pub fn with(mut self, key: &str, value: Value) -> Self {
        self.detail.insert(key.to_string(), value);
        self
    }
}

impl fmt::Display for DispatchError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for DispatchError {}
