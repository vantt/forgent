//! CLI handler for `fgos metrics snapshot` (Lane A - Phase F7).
//!
//! Subcommand: `fgos metrics snapshot [--dir <root>]`
//!
//! Writes exactly 1 line to `.fgos/observe/snapshots/<writerId>.jsonl` complying with `observe.snapshot.v1`.

use crate::case_journal;
use crate::contract::{ObserveRequest, WorkObservationSource};
use crate::metrics_cli::entropy::calculate_entropy_score_and_parts;
use crate::metrics_cli::parse_flags;
use crate::shard::{self, TornTail};
use crate::store_lock::acquire_store_lock;
use crate::time::now_iso;
use serde_json::json;

pub fn dispatch_snapshot(
    req: &ObserveRequest,
    work_source: &dyn WorkObservationSource,
) -> Result<serde_json::Value, String> {
    parse_flags("snapshot", &req.args, &[], &[], false)?;
    let entropy_calc = calculate_entropy_score_and_parts(&req.root, work_source)?;
    let now = now_iso();

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

    // Two processes sharing a writer id share a shard; the append is one
    // observe-lock critical section so their lines cannot interleave.
    let line = shard::encode_line(&record)?;
    let _lock = acquire_store_lock(&req.root).map_err(|e| e.to_string())?;
    let shard_file = shard::append_lines(&req.root, "snapshots", TornTail::Heal, &[line])
        .map_err(|e| format!("cannot write snapshot: {}", e))?;

    Ok(json!({
        "ok": true,
        "action": "snapshot",
        "record": record,
        "path": shard_file.to_string_lossy(),
    }))
}
