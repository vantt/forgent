//! The effective dispatch policy of an assignment: the executor and provider it runs on, the tier and the model of
//! that tier's cell, the persona, the visibility, the repeat mode, the constraints and the governance verdict, each
//! with where it came from.
//!
//! Nothing here chooses an executor, a tier or a model. A caller that already bound the seat passes the `binding`:
//! its executor, tier, model and effort are taken as given, each carrying the source Seat Binding recorded for it,
//! never relabelled. Every other caller gets Seat Binding's answer through the bind facade (the same call a unit
//! run makes): a pinned executor, tier or effort is an override it judges, and the model is the one it names. With
//! no runner config and no binding the policy is refused (`runner-config-missing`). Rigor is recorded as the demand
//! it is (checker count, independence) and never moves the tier or the effort.

use fgos_execution::decide::DecideFailure;
use fgos_execution::ports::Machine;
use serde_json::Value;

use crate::assignment::work_item_input::{refuse_work_item_input, WORK_ITEM_INPUT_KEYS};
use crate::planning::bind_facade::{BindError, FacadeBinder};

/// The policy itself is `fgos-execution`'s, the one `decide` reads an assignment's executor from.
pub use fgos_execution::dispatch_policy::launch_pin_of;

/// The effective dispatch policy. `params` is `{ assignment, runnerConfig?, binding?, cliOverride?, options? }`; a
/// seat not bound upstream is bound through the bind facade, as a unit run binds it.
pub fn effective_dispatch_policy(
    params: &Value,
    machine: &dyn Machine,
    now: u64,
) -> Result<Value, BindError> {
    refuse_work_item_input(params, "the dispatch policy", &WORK_ITEM_INPUT_KEYS)
        .map_err(|r| BindError::runner_config(r.message, r.code))?;
    fgos_execution::dispatch_policy::effective_dispatch_policy(
        params,
        &FacadeBinder { machine, now },
    )
    .map_err(|failure| match failure {
        DecideFailure::Refused(error) => error.into(),
        DecideFailure::SeatRefused { code, message }
        | DecideFailure::ConfigDoor { code, message } => {
            BindError::runner_config(message, Some(code))
        }
    })
}
