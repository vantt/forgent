//! Confinement driver: the backend registry, the bwrap driver that turns resolved resources into a sandbox
//! invocation, and the attestation store that keeps the host's record of a confinement outside every grant.
//!
//! Requests, plans and resolved resources are JSON values here, as they are at the other module boundaries of
//! the dispatch seam: the request type that owns their shape lands with the request authority, and this module
//! reads only the fields it names. What lives in other modules is reached through the ports in [`ports`]: the
//! resource resolver (confinement policy), the private-home records (confinement cleanup) and the login-file
//! copy (credentials). Process containment stays in `fgos-process`; this module builds the bwrap argv and, for
//! the smoke test, runs it through the process door.

pub mod attestation;
pub mod bwrap;
pub mod contract;
mod error;
mod js;
pub mod ports;
pub mod registry;

pub use contract::{Assessment, BackendDriver, Mismatch, Prepared};
pub use error::{DriverError, ErrorKind};
pub use ports::{Credentials, EnvFn, PrivateHomeHost, ResourceResolver};
