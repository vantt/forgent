//! Metrics observation sources wiring (Lane A).

use fgos_observe::sources::claude_transcripts::ClaudeTranscriptsSource;
use fgos_observe::ObservationSource;
use fgos_work_state::WorkSource;

pub fn build_metrics_sources() -> Vec<Box<dyn ObservationSource>> {
    vec![
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

/// The record sources the host adds to Observe's own: head state and plan history, projected from their owners.
pub fn build_host_record_sources() -> Vec<Box<dyn fgos_observe::RecordSource>> {
    vec![
        Box::new(super::observe_sources::head_state::HeadStateSource::new()),
        Box::new(super::observe_sources::plan_history::PlanHistorySource::new()),
    ]
}
