//! The two errors of this module: a policy that is not well formed, and a resource that cannot be resolved.

/// A policy, grant or override that breaks a shape rule; the message names the config path and the rule.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
#[error("{0}")]
pub struct ConfinementPolicyError(pub String);

/// A grant that cannot be resolved to a host path; `code` is the stable name callers match on
/// (`confinement-grant-invalid`, `workspace-path-missing`, `mailbox-record-unavailable`, ...).
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
#[error("{message}")]
pub struct ConfinementResourceError {
    pub code: &'static str,
    pub message: String,
}

impl ConfinementResourceError {
    pub(crate) fn new(code: &'static str, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
        }
    }

    /// The common refusal: a grant that names something it must not.
    pub(crate) fn invalid(message: impl Into<String>) -> Self {
        Self::new("confinement-grant-invalid", message)
    }
}

pub(crate) fn refuse<T>(message: String) -> Result<T, ConfinementPolicyError> {
    Err(ConfinementPolicyError(message))
}
