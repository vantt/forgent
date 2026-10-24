//! CLI handler for `fgos metrics entropy` (Lane A - Phase F7).
//!
//! Subcommand: `fgos metrics entropy [--dir <root>]`
//!
//! Computes entropy score, explainable parts, and delta compared to the most recent snapshot in
//! `.fgos/observe/snapshots/*.jsonl`.

use crate::contract::{ObserveRequest, WorkObservationSource};
use crate::metrics_cli::parse_flags;
use crate::shard;
use fgos_host_runtime::civil_time::parse_rfc3339_millis;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::path::Path;

pub const WEIGHT_MISSING_ACTUAL: u64 = 5;
pub const WEIGHT_STALE_DOING: u64 = 5;
pub const WEIGHT_STAGE_ENTRY: u64 = 3;
pub const WEIGHT_AWAITING_HUMAN: u64 = 2;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntropyPart {
    pub label: String,
    pub count: u64,
    pub weight: u64,
    pub points: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntropyCalculation {
    pub score: u64,
    pub parts: Vec<EntropyPart>,
    pub counts: EntropyCounts,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntropyCounts {
    pub outcomes: u64,
    pub frictions: u64,
    pub settlements: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntropyTrend {
    pub baseline: bool,
    pub delta: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntropyCompounded {
    pub outcomes: i64,
    pub frictions: i64,
    pub settlements: i64,
}

pub fn calculate_entropy_score_and_parts(
    root: &Path,
    work_source: &dyn WorkObservationSource,
) -> Result<EntropyCalculation, String> {
    let signals = work_source
        .read_entropy_signals(root)
        .map_err(|e| format!("work source error: {}", e))?;

    let parts = vec![
        EntropyPart {
            label: "missing-actual".to_string(),
            count: signals.missing_actual,
            weight: WEIGHT_MISSING_ACTUAL,
            points: signals.missing_actual * WEIGHT_MISSING_ACTUAL,
        },
        EntropyPart {
            label: "stale-doing".to_string(),
            count: signals.stale_doing,
            weight: WEIGHT_STALE_DOING,
            points: signals.stale_doing * WEIGHT_STALE_DOING,
        },
        EntropyPart {
            label: "stage-entry".to_string(),
            count: signals.stage_entry,
            weight: WEIGHT_STAGE_ENTRY,
            points: signals.stage_entry * WEIGHT_STAGE_ENTRY,
        },
        EntropyPart {
            label: "awaiting-human".to_string(),
            count: signals.awaiting_human,
            weight: WEIGHT_AWAITING_HUMAN,
            points: signals.awaiting_human * WEIGHT_AWAITING_HUMAN,
        },
    ];

    let score = parts.iter().map(|p| p.points).sum();

    Ok(EntropyCalculation {
        score,
        parts,
        counts: EntropyCounts {
            outcomes: signals.total_outcomes_with_actual,
            frictions: 0,
            settlements: signals.total_settlements,
        },
    })
}

/// The most recent snapshot by instant; an unreadable store is an error, a bad
/// line is named and skipped.
pub fn read_last_snapshot(root: &Path) -> Result<Option<Value>, String> {
    let store = shard::read_store(root, "snapshots", shard::UnsafeShard::Fail).map_err(|e| e.to_string())?;
    shard::warn_skipped("snapshots", &store.invalid);
    Ok(store
        .records
        .into_iter()
        .filter_map(|record| {
            let millis = record.value.get("ts").and_then(Value::as_str).and_then(parse_rfc3339_millis)?;
            Some((millis, record.value))
        })
        .max_by_key(|(millis, _)| *millis)
        .map(|(_, value)| value))
}

pub fn dispatch_entropy(
    req: &ObserveRequest,
    work_source: &dyn WorkObservationSource,
) -> Result<Value, String> {
    parse_flags("entropy", &req.args, &[], &[], false)?;
    let calc = calculate_entropy_score_and_parts(&req.root, work_source)?;
    let last_snap = read_last_snapshot(&req.root)?;

    let trend = if let Some(snap) = &last_snap {
        let prev_score = snap
            .get("entropy")
            .and_then(|e| e.get("score"))
            .and_then(|s| s.as_i64())
            .unwrap_or(0);
        EntropyTrend {
            baseline: false,
            delta: Some(calc.score as i64 - prev_score),
        }
    } else {
        EntropyTrend {
            baseline: true,
            delta: None,
        }
    };

    let non_zero_parts: Vec<&EntropyPart> = calc.parts.iter().filter(|p| p.count > 0).collect();

    Ok(json!({
        "score": calc.score,
        "trend": trend,
        "parts": non_zero_parts,
        "counts": calc.counts,
    }))
}
