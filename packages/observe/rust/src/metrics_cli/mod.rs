//! CLI dispatch for `fgos metrics <sub>` (Lane A).

pub mod case;
pub mod coverage;
pub mod discussions;
pub mod eval;
pub mod entropy;
pub mod faults;
pub mod harness;
pub mod outcomes;
pub mod runs;
pub mod snapshot;

use crate::contract::{ObservationSource, ObserveRequest, UnitSummaryScanner, WorkObservationSource};
use serde_json::json;

pub const AVAILABLE_SUBCOMMANDS: &[&str] = &[
    "ping", "case", "harness", "faults", "runs", "coverage", "discussions", "eval",
    "outcomes", "entropy", "snapshot",
];

pub fn dispatch(
    req: &ObserveRequest,
    sources: &[Box<dyn ObservationSource>],
    work_source: Option<&dyn WorkObservationSource>,
    coverage_scanner: coverage::CoverageScanner,
    unit_summary_scanner: UnitSummaryScanner,
) -> Result<serde_json::Value, String> {
    match req.sub.as_str() {
        "ping" => {
            let stdin_bytes = req.stdin.as_ref().map(|b| b.len());
            let stdin_text = req.stdin.as_ref().and_then(|b| String::from_utf8(b.clone()).ok());
            Ok(json!({
                "ok": true,
                "root": req.root.to_string_lossy(),
                "stdin_len": stdin_bytes,
                "stdin_text": stdin_text
            }))
        }
        "case" => case::dispatch_case(req),
        "harness" => harness::dispatch_harness(req, sources),
        "faults" => faults::dispatch_faults(req),
        "runs" => runs::dispatch_runs(req, sources),
        "coverage" => coverage::dispatch_coverage(req, coverage_scanner),
        "discussions" => discussions::dispatch_discussions(req, unit_summary_scanner),
        "eval" => eval::dispatch_eval(req),
        "outcomes" => outcomes::dispatch_outcomes(req, work_source),
        "entropy" => entropy::dispatch_entropy(req, work_source),
        "snapshot" => snapshot::dispatch_snapshot(req, work_source),
        "--help" | "-h" | "help" => Ok(json!({
            "ok": true,
            "command": "metrics",
            "available_subcommands": AVAILABLE_SUBCOMMANDS,
        })),
        other => Err(format!(
            "unknown metrics subcommand \"{}\". Available: {}",
            other,
            AVAILABLE_SUBCOMMANDS.join(", ")
        )),
    }
}
