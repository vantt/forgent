//! Secrets core: which secret exists, where its value comes from, who may
//! resolve it, and one loud-failing expansion of `${NAME}` references.
//!
//! The core does no I/O. It takes the process environment as a map and reads
//! files only through the [`SecretSource`] port. No output path of this crate
//! (error text, `describe`, `Debug`) carries a value, a length or a prefix.
mod declaration;
mod expand;
#[cfg(unix)]
mod file_source;
mod redaction;
mod resolver;
mod source;

pub use declaration::{Declaration, Registry, RegistryError};
pub use expand::{ExpandError, Expansion};
#[cfg(unix)]
pub use file_source::FileSource;
pub use redaction::RedactionSet;
pub use resolver::{Origin, ResolveError, Resolved, Resolver, Searched};
pub use source::{CheckFailure, Lookup, SecretSource, SecretValue};
