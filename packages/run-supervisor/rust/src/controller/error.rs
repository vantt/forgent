//! `DispatchError` and `RunSupervisorError` of the Node controller: a coded refusal with a message and
//! free-form detail (`src/run-supervisor/dispatch-error.mjs`, `client.mjs`).

use serde_json::{Map, Value};
use std::fmt;

/// A refusal of the controller: `code` doubles as the error class (`dispatch-in-flight`, `worker-spawn-fail`, ...).
#[derive(Debug, Clone, PartialEq)]
pub struct DispatchError {
    pub code: String,
    pub message: String,
    pub detail: Map<String, Value>,
}

impl DispatchError {
    pub fn new(code: &str, message: impl Into<String>) -> Self {
        Self {
            code: code.to_string(),
            message: message.into(),
            detail: Map::new(),
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
