//! CLI handler for `fgos metrics runs` (Lane A - Phase F7).
//!
//! Subcommand: `fgos metrics runs [--by executor|adapter|role] [--since <iso> [--until <iso>]] [--case <name>] [--dir <root>]`

use crate::case_journal;
use crate::contract::{Observation, ObservationSource, ObserveRequest, Window};
use crate::scorecard::compute_runs;
use serde_json::Value;

pub fn dispatch_runs(
    req: &ObserveRequest,
    sources: &[Box<dyn ObservationSource>],
) -> Result<Value, String> {
    let mut by_filter: Option<String> = None;
    let mut since = None;
    let mut until = None;
    let mut case_name = None;

    let mut i = 0;
    while i < req.args.len() {
        let arg = &req.args[i];
        if arg == "--by" {
            if i + 1 >= req.args.len() {
                return Err("missing value for --by".to_string());
            }
            let val = &req.args[i + 1];
            if val != "executor" && val != "adapter" && val != "role" {
                return Err(format!("invalid --by value \"{}\". Allowed: executor, adapter, role", val));
            }
            by_filter = Some(val.clone());
            i += 2;
        } else if let Some(val) = arg.strip_prefix("--by=") {
            if val != "executor" && val != "adapter" && val != "role" {
                return Err(format!("invalid --by value \"{}\". Allowed: executor, adapter, role", val));
            }
            by_filter = Some(val.to_string());
            i += 1;
        } else if arg == "--since" {
            if i + 1 >= req.args.len() {
                return Err("missing value for --since".to_string());
            }
            since = Some(req.args[i + 1].clone());
            i += 2;
        } else if let Some(val) = arg.strip_prefix("--since=") {
            since = Some(val.to_string());
            i += 1;
        } else if arg == "--until" {
            if i + 1 >= req.args.len() {
                return Err("missing value for --until".to_string());
            }
            until = Some(req.args[i + 1].clone());
            i += 2;
        } else if let Some(val) = arg.strip_prefix("--until=") {
            until = Some(val.to_string());
            i += 1;
        } else if arg == "--case" {
            if i + 1 >= req.args.len() {
                return Err("missing value for --case".to_string());
            }
            case_name = Some(req.args[i + 1].clone());
            i += 2;
        } else if let Some(val) = arg.strip_prefix("--case=") {
            case_name = Some(val.to_string());
            i += 1;
        } else if arg == "--dir" || arg.starts_with("--dir=") {
            if arg == "--dir" {
                i += 2;
            } else {
                i += 1;
            }
        } else {
            return Err(format!("unexpected argument for metrics runs: {}", arg));
        }
    }

    // 1. Resolve case window or timeframe window
    let window = if let Some(cn) = case_name {
        let cw = case_journal::find(&req.root, &cn)
            .ok_or_else(|| format!("case \"{}\" not found", cn))?;
        Window {
            since: Some(cw.since),
            until: cw.until,
        }
    } else {
        Window { since, until }
    };

    // 2. Collect observations from sources
    let mut observations: Vec<Observation> = Vec::new();
    for src in sources {
        match src.observations(&req.root, &window) {
            Ok(obs) => observations.extend(obs),
            Err(e) => return Err(format!("source error: {}", e)),
        }
    }

    // 3. Compute runs section
    let runs_sec = compute_runs(&observations);

    if let Some(by) = by_filter {
        match by.as_str() {
            "executor" => Ok(serde_json::to_value(&runs_sec.by_executor).map_err(|e| e.to_string())?),
            "adapter" => Ok(serde_json::to_value(&runs_sec.by_adapter).map_err(|e| e.to_string())?),
            "role" => Ok(serde_json::to_value(&runs_sec.by_role).map_err(|e| e.to_string())?),
            _ => unreachable!(),
        }
    } else {
        Ok(serde_json::to_value(&runs_sec).map_err(|e| e.to_string())?)
    }
}
