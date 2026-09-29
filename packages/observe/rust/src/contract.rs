//! Observation contracts and types.

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SubjectKind {
    Run,
    Session,
    Executor,
    Case,
    Work,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Subject {
    pub kind: SubjectKind,
    pub id: String,
}

impl Subject {
    pub fn parse(s: &str) -> Option<Self> {
        let (kind_str, id) = s.split_once(':')?;
        let kind = match kind_str {
            "run" => SubjectKind::Run,
            "session" => SubjectKind::Session,
            "executor" => SubjectKind::Executor,
            "case" => SubjectKind::Case,
            "work" => SubjectKind::Work,
            _ => return None,
        };
        Some(Self {
            kind,
            id: id.to_string(),
        })
    }

    pub fn to_string_repr(&self) -> String {
        let k = match self.kind {
            SubjectKind::Run => "run",
            SubjectKind::Session => "session",
            SubjectKind::Executor => "executor",
            SubjectKind::Case => "case",
            SubjectKind::Work => "work",
        };
        format!("{}:{}", k, self.id)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Observation {
    pub ts: String,
    pub subject: Subject,
    pub kind: String, // e.g. "run.settled"
    pub attrs: serde_json::Map<String, serde_json::Value>,
    pub source: &'static str,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Window {
    pub since: Option<String>,
    pub until: Option<String>,
}

#[derive(Debug, thiserror::Error)]
pub enum SourceError {
    #[error("failed to read observation source '{source_id}': {message}")]
    ReadFailed {
        source_id: &'static str,
        message: String,
    },
    #[error("io error for observation source '{0}': {1}")]
    Io(&'static str, #[source] std::io::Error),
    #[error("parse error for observation source '{source_id}': {message}")]
    ParseFailed {
        source_id: &'static str,
        message: String,
    },
}
pub trait ObservationSource: Send + Sync {
    fn source_id(&self) -> &'static str;
    fn observations(&self, root: &Path, w: &Window) -> Result<Vec<Observation>, SourceError>;
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LegacyFrictionRecord {
    pub src: String,
    pub seq: u64,
    pub ts: String,
    pub subject_id: String,
    pub layer: String,
    pub error_class: String,
    pub disposition: String,
    pub detail: String,
    pub attempts: Option<u32>,
    pub doc_type: Option<String>,
    pub producer: Option<String>,
    pub resolved: bool,
    pub resolve_reason: Option<String>,
}

pub trait LegacyFrictionSource: Send + Sync {
    fn source_id(&self) -> &'static str;
    fn read_legacy_frictions(
        &self,
        root: &Path,
        since_cursor: Option<(&str, u64)>,
    ) -> Result<Vec<LegacyFrictionRecord>, SourceError>;
}

#[derive(Debug, Clone)]
pub struct ObserveRequest {
    pub operation: String,
    pub sub: String,
    pub args: Vec<String>,
    pub root: PathBuf,
    pub stdin: Option<Vec<u8>>,
}
