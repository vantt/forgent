//! Metrics observation sources wiring (Lane A).

use fgos_observe::record::types::Record;
use fgos_observe::sources::claude_transcripts::ClaudeTranscriptsSource;
use fgos_observe::{ObservationSource, RecordSource, SourceError, Window};
use fgos_supervision::discussion_source::{
    DiscussionHistory, DiscussionSource, GitDiscussionHistory, HistoryCommit,
    DISCUSSION_STATUS_KIND,
};
use fgos_work_state::WorkSource;
use std::path::Path;

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

/// The history of a source that has not opened a repository yet: it only tells the source's identity.
struct NoHistory;

impl DiscussionHistory for NoHistory {
    fn commits(&self, _prefixes: &[&str]) -> Result<Vec<HistoryCommit>, String> {
        Err("no repository is open".to_owned())
    }

    fn blob(&self, _commit: &str, _path: &str) -> Result<Option<String>, String> {
        Err("no repository is open".to_owned())
    }
}

/// The discussion status source, bound to the project root each query names: the history it walks is the
/// repository of that root, so the source opens it per call and holds none.
struct HostDiscussionSource;

impl RecordSource for HostDiscussionSource {
    fn source_id(&self) -> &'static str {
        DiscussionSource::new(NoHistory).source_id()
    }

    fn kinds(&self) -> &[&str] {
        &[DISCUSSION_STATUS_KIND]
    }

    fn records(&self, root: &Path, w: &Window) -> Result<Vec<Record>, SourceError> {
        let source_id = self.source_id();
        let failed = |message: String| SourceError::ReadFailed { source_id, message };
        // Outside a repository there is no trunk and no discussion.
        let Some(history) = GitDiscussionHistory::open(root, None).map_err(failed)? else {
            return Ok(Vec::new());
        };
        DiscussionSource::new(history).records(w).map_err(failed)
    }
}

/// The record sources the host adds to Observe's own: head state, plan history, owner questions and discussion status, projected from their owners.
pub fn build_host_record_sources() -> Vec<Box<dyn fgos_observe::RecordSource>> {
    vec![
        Box::new(super::observe_sources::head_state::HeadStateSource::new()),
        Box::new(super::observe_sources::plan_history::PlanHistorySource::new()),
        Box::new(fgos_questions::source::QuestionSource::new(Box::new(
            super::questions::HostLogOpener::reader(),
        ))),
        Box::new(HostDiscussionSource),
    ]
}
