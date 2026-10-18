//! Codes generated from the versioned result-code registry at build time.
include!(concat!(env!("OUT_DIR"), "/result_codes.rs"));

#[derive(Debug, thiserror::Error)]
#[error("{code}: {detail}")]
pub struct Error {
    pub code: ErrorCode,
    pub detail: String,
}
impl Error {
    pub fn new(code: ErrorCode, detail: impl Into<String>) -> Self {
        Self {
            code,
            detail: detail.into(),
        }
    }
}
