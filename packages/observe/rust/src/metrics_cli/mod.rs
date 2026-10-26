//! CLI dispatch for `fgos metrics <sub>` (Lane A).

pub mod case;
pub mod coverage;
pub mod discussions;
pub mod entropy;
pub mod eval;
pub mod faults;
pub mod harness;
pub mod outcomes;
pub mod runs;
pub mod snapshot;

use crate::contract::{
    ObservationSource, ObserveRequest, UnitSummaryScanner, WorkObservationSource,
};
use crate::flags::Flags;
use serde_json::json;

pub const AVAILABLE_SUBCOMMANDS: &[&str] = &[
    "ping",
    "case",
    "harness",
    "faults",
    "runs",
    "coverage",
    "discussions",
    "eval",
    "outcomes",
    "entropy",
    "snapshot",
];

/// Parses a verb's arguments with the one Observe grammar; the verb passes its
/// own `"--flag"` literals and names itself in the error.
pub(crate) fn parse_flags(
    verb: &str,
    args: &[String],
    value_flags: &[&str],
    switch_flags: &[&str],
    takes_positional: bool,
) -> Result<Flags, String> {
    Flags::parse(args, value_flags, switch_flags, takes_positional)
        .map_err(|error| format!("metrics {verb}: {error}"))
}

/// Whether the verb appends to an Observe store (case open/close, eval record, snapshot).
pub fn writes(req: &ObserveRequest) -> bool {
    let action = req.args.first().map(String::as_str);
    match req.sub.as_str() {
        "snapshot" => true,
        "case" => matches!(action, Some("open" | "close")),
        "eval" => action == Some("record"),
        _ => false,
    }
}

pub fn dispatch(
    req: &ObserveRequest,
    sources: &[Box<dyn ObservationSource>],
    work_source: &dyn WorkObservationSource,
    coverage_scanner: coverage::CoverageScanner,
    unit_summary_scanner: UnitSummaryScanner,
) -> Result<serde_json::Value, String> {
    match req.sub.as_str() {
        "ping" => {
            let stdin_bytes = req.stdin.as_ref().map(|b| b.len());
            let stdin_text = req
                .stdin
                .as_ref()
                .and_then(|b| String::from_utf8(b.clone()).ok());
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn request(sub: &str, args: &[&str]) -> ObserveRequest {
        ObserveRequest {
            operation: "observe.metrics".to_string(),
            sub: sub.to_string(),
            args: args.iter().map(|a| a.to_string()).collect(),
            root: PathBuf::from("/no-such-observe-root"),
            stdin: None,
        }
    }

    fn run(sub: &str, args: &[&str]) -> Result<serde_json::Value, String> {
        struct Unused;
        impl WorkObservationSource for Unused {
            fn read_outcomes_report(
                &self,
                _: &std::path::Path,
                _: Option<&str>,
            ) -> Result<crate::WorkOutcomesRecord, crate::SourceError> {
                unreachable!("the verbs under test never read the work store")
            }
            fn read_entropy_signals(
                &self,
                _: &std::path::Path,
            ) -> Result<crate::WorkEntropySignalsRecord, crate::SourceError> {
                unreachable!("the verbs under test never read the work store")
            }
        }
        fn no_coverage(_: &std::path::Path) -> Result<serde_json::Value, String> {
            unreachable!()
        }
        fn no_summaries(
            _: &std::path::Path,
            _: &crate::Window,
        ) -> Result<crate::UnitSummaryScan, crate::SourceError> {
            unreachable!()
        }
        dispatch(&request(sub, args), &[], &Unused, no_coverage, no_summaries)
    }

    #[test]
    fn every_verb_reads_flags_one_way_json_is_a_no_op_and_bad_input_is_named() {
        assert!(run("runs", &["--json", "--by=role"]).is_ok());
        assert!(run("case", &["list", "--json", "--open"]).is_ok());
        assert!(run("eval", &["list", "--harness=plain", "--json"]).is_ok());
        assert_eq!(run("runs", &["--by", "nobody"]).unwrap_err(), "invalid --by value \"nobody\". Allowed: executor, adapter, role");
        assert_eq!(run("runs", &["--nope"]).unwrap_err(), "metrics runs: unknown option --nope");
        assert_eq!(run("faults", &["--limit", "abc"]).unwrap_err(), "faults --limit requires a positive integer value");
        assert_eq!(run("case", &["list", "--bogus"]).unwrap_err(), "metrics case: unknown option --bogus");
        assert_eq!(run("case", &["close", "x", "--interventions", "abc", "--verdict", "usable"]).unwrap_err(), "invalid value for --interventions: abc");
        assert_eq!(run("eval", &["list", "--question", " "]).unwrap_err(), "metrics eval: missing value for --question");
    }
}
