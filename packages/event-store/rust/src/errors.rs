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
/// Builds the io-failure mapper for `.map_err(io("open", path))`: the detail
/// names the failed operation and the path (never file content) so a failure
/// seen only in CI can be traced to its call site.
pub(crate) fn io<'a>(
    operation: &'static str,
    path: &'a std::path::Path,
) -> impl FnOnce(std::io::Error) -> Error + 'a {
    move |error| {
        Error::new(
            ErrorCode::EventStoreIo,
            format!(
                "{:?}: {error} (during {operation} of {})",
                error.kind(),
                path.display()
            ),
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn io_error_names_operation_and_path() {
        let path = std::path::Path::new("/nonexistent-event-store-dir/missing.jsonl");
        let error = std::fs::read(path).map_err(io("read", path)).unwrap_err();
        assert_eq!(error.code, ErrorCode::EventStoreIo);
        assert!(error.detail.starts_with("NotFound: "), "{}", error.detail);
        assert!(error.detail.contains("during read of"), "{}", error.detail);
        assert!(
            error.detail.contains(&path.display().to_string()),
            "{}",
            error.detail
        );
    }
}
