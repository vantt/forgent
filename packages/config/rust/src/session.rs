//! The session class: whether the caller runs inside a confined dispatch.
//!
//! The confined launch driver sets [`CONFINED_MARKER`] to `1` in every confined worker; this
//! function reads it through a caller-supplied lookup (the crate reads no environment).
//!
//! The marker is information for the session, not a security boundary. A confined worker can unset
//! it, and then only the doors' politeness refusal and the `accounts: unavailable-confined` message
//! are lost. Nothing that protects data depends on it: the sandbox is the boundary (Confinement
//! Authority section 9.3 hides the machine-private directory from every confined worker).

use crate::snapshot::SessionClass;

/// The environment variable a confined launch sets; the launch driver's one `--setenv` names the
/// same string (a Node test pins both).
pub const CONFINED_MARKER: &str = "FGOS_CONFINED";

/// `Confined` when the marker is present and equals `1`; anything else is `Unconfined`.
pub fn session_class(lookup: impl Fn(&str) -> Option<String>) -> SessionClass {
    match lookup(CONFINED_MARKER).as_deref() {
        Some("1") => SessionClass::Confined,
        _ => SessionClass::Unconfined,
    }
}
