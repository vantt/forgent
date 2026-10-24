//! CLI handler for `fgos metrics runs` (Lane A - Phase F7).
//!
//! Subcommand: `fgos metrics runs [--by executor|adapter|role] [--since <iso> [--until <iso>]] [--case <name>] [--dir <root>]`

use crate::case_journal;
use crate::contract::{Observation, ObservationSource, ObserveRequest, Window};
use crate::metrics_cli::parse_flags;
use crate::scorecard::{compute_runs, RUN_RESULT_SOURCE};
use serde_json::Value;

pub fn dispatch_runs(
    req: &ObserveRequest,
    sources: &[Box<dyn ObservationSource>],
) -> Result<Value, String> {
    let flags = parse_flags("runs", &req.args, &["--by", "--since", "--until", "--case"], &[], false)?;
    let by_filter = match flags.value("--by") {
        None => None,
        Some(by @ ("executor" | "adapter" | "role")) => Some(by),
        Some(other) => {
            return Err(format!(
                "invalid --by value \"{other}\". Allowed: executor, adapter, role"
            ))
        }
    };

    // 1. Resolve case window or timeframe window
    let window = if let Some(cn) = flags.value("--case") {
        let cw = case_journal::find(&req.root, cn)
            .ok_or_else(|| format!("case \"{}\" not found", cn))?;
        Window {
            since: Some(cw.since),
            until: cw.until,
        }
    } else {
        Window {
            since: flags.value("--since").map(str::to_owned),
            until: flags.value("--until").map(str::to_owned),
        }
    };

    // 2. Collect observations from the run-result source, the only one the runs section reads
    let mut observations: Vec<Observation> = Vec::new();
    for src in sources.iter().filter(|src| src.source_id() == RUN_RESULT_SOURCE) {
        observations.extend(
            src.observations(&req.root, &window)
                .map_err(|e| format!("source error: {}", e))?,
        );
    }

    // 3. Compute runs section
    let runs_sec = compute_runs(&observations);

    if let Some(by) = by_filter {
        match by {
            "executor" => {
                Ok(serde_json::to_value(&runs_sec.by_executor).map_err(|e| e.to_string())?)
            }
            "adapter" => Ok(serde_json::to_value(&runs_sec.by_adapter).map_err(|e| e.to_string())?),
            "role" => Ok(serde_json::to_value(&runs_sec.by_role).map_err(|e| e.to_string())?),
            _ => unreachable!(),
        }
    } else {
        Ok(serde_json::to_value(&runs_sec).map_err(|e| e.to_string())?)
    }
}
