//! Run-layout coverage. The composition root injects the run owner's scanner.

use crate::contract::ObserveRequest;
use serde_json::Value;
use std::path::Path;

/// Keep Observe independent of the run-result component and its storage layout.
pub type CoverageScanner = fn(&Path) -> Result<Value, String>;

pub fn dispatch_coverage(req: &ObserveRequest, scanner: CoverageScanner) -> Result<Value, String> {
    let mut i = 0;
    while i < req.args.len() {
        let arg = &req.args[i];
        if arg == "--dir" {
            if i + 1 >= req.args.len() {
                return Err("missing value for --dir".to_string());
            }
            i += 2;
        } else if arg.starts_with("--dir=") {
            i += 1;
        } else {
            return Err(format!("unexpected argument for metrics coverage: {}", arg));
        }
    }
    scanner(&req.root)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

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

    #[test]
    fn coverage_calls_only_the_injected_run_scanner() {
        let sources: Vec<Box<dyn crate::ObservationSource>> = vec![Box::new(ForbiddenSource)];
        crate::metrics_cli::dispatch(&request(&[]), &sources, None, scanner).unwrap();
        assert!(dispatch_coverage(&request(&["--since=2026-10-05"]), scanner).is_err());
        assert!(dispatch_coverage(&request(&["--dir"]), scanner).is_err());
    }
}
