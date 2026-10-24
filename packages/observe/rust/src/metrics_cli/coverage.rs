//! Run-layout coverage. The composition root injects the run owner's scanner.

use crate::contract::ObserveRequest;
use crate::metrics_cli::parse_flags;
use serde_json::Value;
use std::path::Path;

/// Keep Observe independent of the run-result component and its storage layout.
pub type CoverageScanner = fn(&Path) -> Result<Value, String>;

pub fn dispatch_coverage(req: &ObserveRequest, scanner: CoverageScanner) -> Result<Value, String> {
    parse_flags("coverage", &req.args, &[], &[], false)?;
    scanner(&req.root)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    struct ForbiddenWork;

    impl crate::WorkObservationSource for ForbiddenWork {
        fn read_outcomes_report(
            &self,
            _: &Path,
            _: Option<&str>,
        ) -> Result<crate::WorkOutcomesRecord, crate::SourceError> {
            panic!("coverage must not read the work store")
        }

        fn read_entropy_signals(&self, _: &Path) -> Result<crate::WorkEntropySignalsRecord, crate::SourceError> {
            panic!("coverage must not read the work store")
        }
    }

    struct ForbiddenSource;

    impl crate::ObservationSource for ForbiddenSource {
        fn source_id(&self) -> &'static str {
            "must-not-scan"
        }

        fn observations(
            &self,
            _: &Path,
            _: &crate::Window,
        ) -> Result<Vec<crate::Observation>, crate::SourceError> {
            panic!("coverage must not collect observation sources or transcripts")
        }
    }

    fn request(args: &[&str]) -> ObserveRequest {
        ObserveRequest {
            operation: "observe.metrics".to_string(),
            sub: "coverage".to_string(),
            args: args.iter().map(|s| s.to_string()).collect(),
            root: Path::new("/coverage-fixture").to_path_buf(),
            stdin: None,
        }
    }

    fn scanner(_root: &Path) -> Result<Value, String> {
        Ok(
            json!({"layoutRule": "v2", "runDirsSeen": 0, "observed": 0, "skipped": {}, "recentRuns": 0}),
        )
    }

    fn forbidden_summary_scanner(
        _: &Path,
        _: &crate::Window,
    ) -> Result<crate::UnitSummaryScan, crate::SourceError> {
        panic!("coverage must not scan discussion summaries")
    }

    #[test]
    fn coverage_calls_only_the_injected_run_scanner() {
        let sources: Vec<Box<dyn crate::ObservationSource>> = vec![Box::new(ForbiddenSource)];
        crate::metrics_cli::dispatch(
            &request(&[]),
            &sources,
            &ForbiddenWork,
            scanner,
            forbidden_summary_scanner,
        )
        .unwrap();
        assert!(dispatch_coverage(&request(&["--since=2026-10-05"]), scanner).is_err());
        assert!(dispatch_coverage(&request(&["--dir"]), scanner).is_err());
    }
}
