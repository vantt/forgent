//! CLI handler for `fgos metrics outcomes` (Lane A - Phase F7).
//!
//! Subcommand: `fgos metrics outcomes [<id>] [--dir <root>]`

use crate::contract::{ObserveRequest, WorkObservationSource};
use crate::metrics_cli::parse_flags;
use serde_json::{json, Value};

pub fn dispatch_outcomes(
    req: &ObserveRequest,
    work_source: &dyn WorkObservationSource,
) -> Result<Value, String> {
    let flags = parse_flags("outcomes", &req.args, &[], &[], true)?;
    let report = work_source
        .read_outcomes_report(&req.root, flags.positional())
        .map_err(|e| format!("work source error: {}", e))?;

    Ok(json!({
        "outcomes": report.outcomes,
        "settlement": report.settlement,
        "learning": report.learning,
        "missingOutcomeNag": report.missing_outcome_nag,
    }))
}
