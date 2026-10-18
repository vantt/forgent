//! Codes generated from the versioned result-code registry at build time.
include!(concat!(env!("OUT_DIR"), "/result_codes.rs"));

#[derive(Debug, thiserror::Error)]
#[error("{code}: {detail}")]
pub struct Error {
    pub code: ErrorCode,
    pub detail: String,
    /// A post-install failure must not be mistaken for a no-effect write.
    pub durable_install: Option<fgos_durable_file::Installed>,
    pub retained_temporary: Option<std::path::PathBuf>,
}
impl Error {
    pub(crate) fn from_install_error(error: fgos_durable_file::InstallError) -> Self {
        Self {
            code: ErrorCode::EventStoreIo,
            detail: error.to_string(),
            durable_install: error.installed,
            retained_temporary: error.temporary,
        }
    }
    pub fn new(code: ErrorCode, detail: impl Into<String>) -> Self {
        Self {
            code,
            detail: detail.into(),
            durable_install: None,
            retained_temporary: None,
        }
    }
}

pub(crate) fn invalid(detail: impl Into<String>) -> Error {
    Error::new(ErrorCode::EventStoreIntegrity, detail)
}
pub(crate) fn io(error: std::io::Error) -> Error {
    Error::new(
        ErrorCode::EventStoreIo,
        format!("{:?}: {error}", error.kind()),
    )
}
