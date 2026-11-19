//! Confinement policy: the vocabulary of what a confined worker may do, the shape rules that keep a policy honest,
//! the legacy flags it replaces, and the resolver that turns a policy's grants into the host paths a driver binds
//! or masks.
//!
//! Pure parts take their facts as inputs (a policy is a JSON document judged as it arrives, the machine's home,
//! environment, uid and login stores are passed in); the resolver reads the real file system and nothing else.
//! Paths are `/`-separated strings, as Node's `path` module treats them on the Linux hosts that apply a sandbox.
//!
//! Twin of `src/runner/dispatch/confinement/{policies,resources,workspace-paths,bypass-pairing}.mjs`; the golden
//! vectors under `packages/execution/contracts/confinement-policy/` hold both to the same answers.

mod bypass;
mod error;
mod js;
mod legacy;
mod paths;
mod posture;
mod resolver;
mod roots;
mod shape;
mod workspace_paths;

pub use bypass::{control_delivery, evaluate_bypass_pairing, BypassPairing, ControlDelivery};
pub use error::{ConfinementPolicyError, ConfinementResourceError};
pub use legacy::{normalize_legacy_confinement, resolve_confinement_policy};
pub use paths::is_inside_root;
pub use posture::{
    can_apply_posture, resolve_posture, resolve_posture_invocation, Candidate, PostureContext,
    PostureInvocation, ResolvedPosture,
};
pub use resolver::{
    resolve_confinement_resources, resolve_workspace_git_metadata, Grant, ResolveContext,
    ResolveInput, ResolvedResource,
};
pub use roots::{
    canonicalize_and_verify_subpath, create_blind_roots_when_missing, ensure_session_socket_dir,
    resolve_blind_hidden_roots, resolve_claude_socket_base, resolve_machine_private_roots,
    runtime_dir_for_mask, Canonical, MachineRootsInput, BLIND_HIDDEN_ROOTS, MACHINE_PRIVATE_ROOTS,
    SESSION_SOCKET_DIR,
};
pub use shape::{
    builtin_policy, request_is_blind, validate_capability_confinement_shape,
    validate_confinement_policy_shape, validate_network_filter_shape,
    validate_override_confinement_shape, BUILTIN_POLICY_IDS, CONFINEMENT_MODES, CONTROL_AXES,
    GRANT_ACCESS_LEVELS,
};
pub use workspace_paths::{
    validate_workspace_paths, MAILBOX_RECORD_RESOURCE, PEER_SESSIONS_RESOURCE,
    WORKSPACE_PATHS_RESOURCE,
};

/// How long a seat may run when its request names no timeout.
pub const DEFAULT_SEAT_TIMEOUT_MS: u64 = 900_000;
