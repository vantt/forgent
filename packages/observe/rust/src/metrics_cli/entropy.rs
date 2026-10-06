//! CLI handler for `fgos metrics entropy` (Lane A - Phase F7).
//!
//! Subcommand: `fgos metrics entropy [--dir <root>]`
//!
//! Computes entropy score, explainable parts, and delta compared to the most recent snapshot in
//! `.fgos/observe/snapshots/*.jsonl`.

use crate::contract::{ObserveRequest, WorkObservationSource};
use crate::shard;
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

pub fn read_last_snapshot(root: &Path) -> Option<Value> {
    let records = shard::read_all_json(root, "snapshots").ok()?;
    records.into_iter().rev().next()
}

pub fn dispatch_entropy(
    req: &ObserveRequest,
    work_source: Option<&dyn WorkObservationSource>,
) -> Result<Value, String> {
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
            return Err(format!("unexpected argument for metrics entropy: {}", arg));
        }
    }

    let ws = work_source.ok_or_else(|| "work source not available for metrics entropy".to_string())?;
    let calc = calculate_entropy_score_and_parts(&req.root, ws)?;
    let last_snap = read_last_snapshot(&req.root);

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
