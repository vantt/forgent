use crate::fgos::{AfterDeliverRow, DoingRow, FgosError, MergeListSummary, NeedAnswerRow, TriageRow};

/// (a) fgOS data source seam (tsk-3t9 D1) — the domain asks for rows
/// through this trait instead of importing `crate::fgos` directly.
pub trait WorkItemSource {
    fn fetch_triage(&self) -> Result<Vec<TriageRow>, FgosError>;
    fn fetch_doing(&self) -> Result<Vec<DoingRow>, FgosError>;
    /// tsk-417 D3: NEED ANSWER box source.
    fn fetch_need_answer(&self) -> Result<Vec<NeedAnswerRow>, FgosError>;
    /// tsk-417 D3: AFTER DELIVER box source.
    fn fetch_after_deliver(&self) -> Result<Vec<AfterDeliverRow>, FgosError>;
    /// tsk-417 D3: MERGE LIST box source.
    fn fetch_merge_list(&self) -> Result<MergeListSummary, FgosError>;
}
