//! Whether permission mode "bypass" is paired with full confinement, and who delivers the controls it declares.
//!
//! Two doors reach a live dispatch: the authority's assessment and the herdr round's own confinement. A "bypass"
//! mode with an incomplete pairing must refuse the same way at both, so this is the one place both call.

use serde_json::Value;

use super::js::{str_field, truthy};

/// The answer of the pairing check: satisfied, or what is missing (in a fixed order).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BypassPairing {
    pub satisfied: bool,
    pub missing: Vec<String>,
}

pub fn evaluate_bypass_pairing(
    is_bypass: bool,
    has_own_worktree: bool,
    has_private_home: bool,
    has_isolated_session: bool,
) -> BypassPairing {
    if !is_bypass {
        return BypassPairing {
            satisfied: true,
            missing: Vec::new(),
        };
    }
    let mut missing = Vec::new();
    if !has_private_home {
        missing.push("home: private (privateHome)".to_string());
    }
    if !has_isolated_session {
        missing.push("session: isolated (isolatedSession)".to_string());
    }
    if !has_own_worktree {
        missing.push("workspace: own (ownWorktree)".to_string());
    }
    BypassPairing {
        satisfied: missing.is_empty(),
        missing,
    }
}

/// Who delivers the controls a bypass invocation declares. Under a required backend the backend delivers the private
/// home and the session, so the host-side measures that deliver them without one are not taken. A head session also
/// lives in the main checkout, which is allowed only while the policy denies host writes: the grant narrows what it
/// may write, so the declared own workspace is met by that policy rather than by a worktree.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ControlDelivery {
    pub backend_delivers: bool,
    pub root_workspace_allowed: bool,
}

/// `requirement` is the confinement requirement of the request (`{ mode, policy }`), `has_backend` whether a
/// backend instance was named.
pub fn control_delivery(
    launch_kind: Option<&str>,
    requirement: Option<&Value>,
    has_backend: bool,
) -> ControlDelivery {
    let required = requirement.and_then(|r| str_field(r, "mode")) == Some("required");
    let backend_delivers = required && has_backend;
    let host_write_denied = requirement
        .and_then(|r| r.get("policy"))
        .and_then(|p| p.get("controls"))
        .and_then(|c| c.get("hostWrite"))
        .is_some_and(|v| v.as_str() == Some("deny") && truthy(Some(v)));
    ControlDelivery {
        backend_delivers,
        root_workspace_allowed: backend_delivers
            && launch_kind == Some("session")
            && host_write_denied,
    }
}
