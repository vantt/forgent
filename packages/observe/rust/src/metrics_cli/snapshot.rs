//! CLI handler for `fgos metrics snapshot` (Lane A - Phase F7).
//!
//! Subcommand: `fgos metrics snapshot [--dir <root>]`
//!
//! Writes exactly 1 line to `.fgos/observe/snapshots/<writerId>.jsonl` complying with `observe.snapshot.v1`.

use crate::case_journal;
use crate::contract::{ObserveRequest, WorkObservationSource};
use crate::metrics_cli::entropy::calculate_entropy_score_and_parts;
use crate::shard;
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
    let now = std::time::SystemTime::now();
    let duration = now
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();
    let secs = duration.as_secs();
    let millis = duration.subsec_millis();

    let mut days = secs / 86400;
    let rem_secs = secs % 86400;
    let hours = rem_secs / 3600;
    let mins = (rem_secs % 3600) / 60;
    let s = rem_secs % 60;

    days += 719468;
    let era = days / 146097;
    let doe = days - era * 146097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let mp_u32 = mp as u32;
    let m = if mp_u32 < 10 { mp_u32 + 3 } else { mp_u32 - 9 };
    let y = if m <= 2 { y + 1 } else { y };

    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}.{:03}Z",
        y, m, d, hours, mins, s, millis
    )
}
