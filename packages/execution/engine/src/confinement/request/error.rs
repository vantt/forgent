//! The one error of the request module. Its text is the message the Node original threw; `code` is the Node
//! `err.code` where one was set, `error_class` and `data` are the fields of a `DispatchError`.

use serde_json::{Map, Value};

use crate::confinement::driver::DriverError;
use crate::confinement::policy::ConfinementPolicyError;

#[derive(Debug, Clone, PartialEq, thiserror::Error)]
#[error("{message}")]
pub struct RequestError {
    pub message: String,
    pub code: Option<String>,
    /// Set for a refusal that carries a class (`confinement-mode-unsupported`, `attempt-required`, ...).
    pub error_class: Option<String>,
    /// The detail of a refusal: what a caller reads beside the message.
    pub data: Option<Box<Map<String, Value>>>,
}

impl RequestError {
    pub(crate) fn plain(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            code: None,
            error_class: None,
            data: None,
        }
    }

    pub(crate) fn coded(code: &str, message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            code: Some(code.to_string()),
            error_class: None,
            data: None,
        }
    }

    /// A `DispatchError`: `code` is the class unless the detail names one of its own.
    pub(crate) fn dispatch(
        class: &str,
        message: impl Into<String>,
        data: Map<String, Value>,
    ) -> Self {
        let code = data
            .get("code")
            .and_then(Value::as_str)
            .unwrap_or(class)
            .to_string();
        Self {
            message: message.into(),
            code: Some(code),
            error_class: Some(class.to_string()),
            data: Some(Box::new(data)),
        }
    }
}

impl From<ConfinementPolicyError> for RequestError {
    fn from(err: ConfinementPolicyError) -> Self {
        Self::plain(err.0)
    }
}

impl From<DriverError> for RequestError {
    fn from(err: DriverError) -> Self {
        Self {
            message: err.message,
            code: err.code,
            error_class: None,
            data: None,
        }
    }
}
