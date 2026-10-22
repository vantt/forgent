//! Failures of the machine-id door. Owners map them onto their own codes.

use std::fmt;

#[derive(Debug)]
pub enum Error {
    /// No machine id has been minted under the state root.
    Missing(String),
    /// A value, or the file holding it, does not follow the rule.
    Invalid(String),
    Io(std::io::Error),
    /// A durable write failed; keeps what is known about the effect.
    Install(fgos_durable_file::InstallError),
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Error::Missing(detail) | Error::Invalid(detail) => f.write_str(detail),
            Error::Io(error) => write!(f, "{:?}: {error}", error.kind()),
            Error::Install(error) => error.fmt(f),
        }
    }
}

impl std::error::Error for Error {}

impl From<std::io::Error> for Error {
    fn from(error: std::io::Error) -> Self {
        Error::Io(error)
    }
}
