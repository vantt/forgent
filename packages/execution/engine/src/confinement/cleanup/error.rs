//! The one error of the cleanup. Its text is the message the Node module threw, so a caller that matched or printed
//! it keeps working; `code` is the Node `err.code` where one was set (`E2BIG`, `ENOTREGULAR`, `EEXIST`, ...).

#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
#[error("{message}")]
pub struct CleanupError {
    pub code: Option<String>,
    pub message: String,
}

impl CleanupError {
    pub fn new(message: impl Into<String>) -> Self {
        Self {
            code: None,
            message: message.into(),
        }
    }

    pub fn coded(code: &str, message: impl Into<String>) -> Self {
        Self {
            code: Some(code.to_string()),
            message: message.into(),
        }
    }

    /// An OS error as Node reports it: `CODE: description, syscall 'path'`, with the code Node names.
    pub fn io(err: &std::io::Error, syscall: &str, path: &std::path::Path) -> Self {
        let (code, text) = os_code(err);
        Self {
            code: Some(code.to_string()),
            message: format!("{code}: {text}, {syscall} '{}'", path.display()),
        }
    }
}

/// The Node code and libuv description of the OS errors this module meets.
fn os_code(err: &std::io::Error) -> (&'static str, &'static str) {
    use std::io::ErrorKind::*;
    match err.kind() {
        NotFound => ("ENOENT", "no such file or directory"),
        AlreadyExists => ("EEXIST", "file already exists"),
        PermissionDenied => ("EACCES", "permission denied"),
        NotADirectory => ("ENOTDIR", "not a directory"),
        IsADirectory => ("EISDIR", "illegal operation on a directory"),
        DirectoryNotEmpty => ("ENOTEMPTY", "directory not empty"),
        _ => match err.raw_os_error() {
            #[cfg(unix)]
            Some(code) if code == libc::ELOOP => ("ELOOP", "too many symbolic links encountered"),
            _ => ("EIO", "i/o error"),
        },
    }
}

impl From<std::io::Error> for CleanupError {
    fn from(err: std::io::Error) -> Self {
        let (code, text) = os_code(&err);
        Self::coded(code, format!("{code}: {text}"))
    }
}
