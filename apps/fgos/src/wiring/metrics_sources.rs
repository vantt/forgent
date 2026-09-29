//! Metrics observation sources wiring (Lane A).

use fgos_coordination_state::CoordinationSource;
use fgos_observe::sources::claude_transcripts::ClaudeTranscriptsSource;
use fgos_observe::ObservationSource;
use fgos_run_result::RunResultSource;
use fgos_work_state::WorkSource;

#[allow(dead_code)]
pub fn build_metrics_sources() -> Vec<Box<dyn ObservationSource>> {
    vec![
        Box::new(RunResultSource::new()),
        Box::new(CoordinationSource::new()),
        Box::new(ClaudeTranscriptsSource::new()),
        Box::new(WorkSource::new()),
    ]
}
