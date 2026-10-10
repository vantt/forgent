//! CLI handler for `fgos metrics snapshot` (Lane A - Phase F7).
//!
//! Subcommand: `fgos metrics snapshot [--dir <root>]`
//!
//! Writes exactly 1 line to `.fgos/observe/snapshots/<writerId>.jsonl` complying with `observe.snapshot.v1`.

use crate::case_journal;
use crate::contract::{ObserveRequest, WorkObservationSource};
use crate::metrics_cli::entropy::calculate_entropy_score_and_parts;
use crate::shard;
use fgos_host_runtime::civil_time::format_system_time_utc;
use serde_json::json;
use std::fs::OpenOptions;
use std::io::Write;

pub fn dispatch_snapshot(
    req: &ObserveRequest,
    work_source: Option<&dyn WorkObservationSource>,
) -> Result<serde_json::Value, String> {
    let mut i = 0;
    while i < req.args.len() {
        let arg = &req.args[i];
        if arg == "--dir" {
            i += 2;
            continue;
        } else if arg.starts_with("--dir=") {
            i += 1;
            continue;
        } else {
            return Err(format!("unexpected argument for metrics snapshot: {}", arg));
        }
    }

    let ws = work_source.ok_or_else(|| "work source not available for metrics snapshot".to_string())?;
    let entropy_calc = calculate_entropy_score_and_parts(&req.root, ws)?;
    let now = chrono_now_iso();

    // Check currently open case if any
    let active_case = case_journal::list_cases(&req.root, true)
        .ok()
        .and_then(|cases| cases.into_iter().next())
        .map(|c| c.name);

    let mut components = serde_json::Map::new();
    for part in &entropy_calc.parts {
        components.insert(part.label.clone(), json!(part.points));
    }

    let mut record = serde_json::Map::new();
    record.insert("v".to_string(), json!(1));
    record.insert("type".to_string(), json!("snapshot"));
    record.insert("ts".to_string(), json!(now));
    if let Some(c) = active_case {
        record.insert("case".to_string(), json!(c));
    }
    record.insert(
        "entropy".to_string(),
        json!({
            "score": entropy_calc.score,
            "components": components,
        }),
    );

    let shard_file = shard::shard_path(&req.root, "snapshots").map_err(|e| e.to_string())?;
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&shard_file)
        .map_err(|e| format!("cannot open snapshot shard: {}", e))?;

    let line = serde_json::to_string(&record).map_err(|e| e.to_string())?;
    writeln!(file, "{}", line).map_err(|e| format!("cannot write snapshot: {}", e))?;
    file.sync_all().map_err(|e| format!("cannot sync snapshot: {}", e))?;

    Ok(json!({
        "ok": true,
        "action": "snapshot",
        "record": record,
        "path": shard_file.to_string_lossy(),
    }))
}

fn chrono_now_iso() -> String {
    format_system_time_utc(std::time::SystemTime::now())
}
