//! Metrics observation sources wiring (Lane A).

use fgos_observe::sources::claude_transcripts::ClaudeTranscriptsSource;
use fgos_observe::ObservationSource;
use fgos_run_result::RunResultSource;
use fgos_work_state::WorkSource;

pub fn build_metrics_sources() -> Vec<Box<dyn ObservationSource>> {
    vec![
        Box::new(RunResultSource::new()),
        Box::new(ClaudeTranscriptsSource::new()),
        Box::new(WorkSource::new()),
    ]
}

pub fn build_work_observation_source() -> Box<dyn fgos_observe::contract::WorkObservationSource> {
    Box::new(WorkSource::new())
}

pub fn build_unit_summary_scanner() -> fgos_observe::UnitSummaryScanner {
    fgos_run_result::scan_unit_summaries
}
