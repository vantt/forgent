//! CLI handler for `fgos metrics outcomes` (Lane A - Phase F7).
//!
//! Subcommand: `fgos metrics outcomes [<id>] [--dir <root>]`

use crate::contract::{ObserveRequest, WorkObservationSource};
use serde_json::{json, Value};

pub fn dispatch_outcomes(
    req: &ObserveRequest,
    work_source: Option<&dyn WorkObservationSource>,
) -> Result<Value, String> {
    let mut id: Option<String> = None;

    let mut i = 0;
    while i < req.args.len() {
        let arg = &req.args[i];
        if arg == "--dir" || arg.starts_with("--dir=") {
            if arg == "--dir" {
                i += 2;
            } else {
                i += 1;
            }
        } else if arg.starts_with("--") {
            return Err(format!("unexpected option for metrics outcomes: {}", arg));
        } else if id.is_none() {
            id = Some(arg.clone());
            i += 1;
        } else {
            return Err(format!("unexpected positional argument for metrics outcomes: {}", arg));
        }
    }

    let ws = work_source.ok_or_else(|| "work source not available for metrics outcomes".to_string())?;
    let report = ws
        .read_outcomes_report(&req.root, id.as_deref())
        .map_err(|e| format!("work source error: {}", e))?;

    Ok(json!({
        "outcomes": report.outcomes,
        "settlement": report.settlement,
        "learning": report.learning,
        "missingOutcomeNag": report.missing_outcome_nag,
    }))
}
