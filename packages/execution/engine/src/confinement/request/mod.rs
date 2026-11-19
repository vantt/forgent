//! Confinement request and authority: the closed shape of a `confinement-request.v1`, its construction at the
//! dispatch seam, the launch context it carries, the attestation observed from it, and the pipeline that refuses a
//! launch the policy cannot enforce or prepares the sandbox and publishes the launch records.
//!
//! Requests are JSON values here, as they are at the other boundaries of the dispatch seam, judged as Node judged
//! them. What other modules own is reached through them: policy shapes and legacy flags (`confinement::policy`),
//! the driver, registry and attestation store (`confinement::driver`), the executor model, runner check and
//! canonical JSON. Twin of `src/runner/dispatch/confinement/{request,authority}.mjs`; the golden vectors under
//! `packages/execution/contracts/confinement-request/` hold both to the same answers.

mod attestation;
mod build;
mod delivery;
mod error;
mod js;
mod launch;
mod launch_context;
mod seat_dir;
mod shape;

pub use attestation::build_confinement_attestation;
pub use build::{build_confinement_request, system_clock_parts, BuildClock};
pub use delivery::{control_delivery_of, effective_backend_of, own_worktree_unavailable};
pub use error::RequestError;
pub use launch::{prepare_confinement_for_launch, Launch, LaunchHost, ProbeVerdict, Probes};
pub use launch_context::{
    cross_check_assignment_launch_context, validate_assignment_launch_context,
};
pub use seat_dir::seat_session_dir;
pub use shape::validate_confinement_request;

/// The request a worker is confined under. Fields land with the module that owns the request authority.
#[derive(Debug, Clone, Default)]
#[non_exhaustive]
pub struct ConfinementRequest {}
