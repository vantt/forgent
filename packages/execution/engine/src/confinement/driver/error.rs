//! The one error of the driver. Its text is the message the Node driver threw, so a caller that matched or
//! printed it keeps working; `code` is the Node `err.code` where one was set.

/// Which of the driver's parts refused.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ErrorKind {
    /// The backend registry or one of its instance configs.
    Registry,
    /// The attestation store.
    Attestation,
    /// The bwrap driver.
    Bwrap,
    /// A port reported a failure (resource resolution, private-home records, login copy).
    Port,
}

#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
#[error("{message}")]
pub struct DriverError {
    pub kind: ErrorKind,
    pub code: Option<String>,
    pub message: String,
}

impl DriverError {
    pub fn new(kind: ErrorKind, message: impl Into<String>) -> Self {
        Self {
            kind,
            code: None,
            message: message.into(),
        }
    }

    pub fn coded(kind: ErrorKind, code: &str, message: impl Into<String>) -> Self {
        Self {
            kind,
            code: Some(code.to_string()),
            message: message.into(),
        }
    }
}
