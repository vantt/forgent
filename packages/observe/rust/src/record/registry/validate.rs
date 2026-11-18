//! Checking one record against the registry. A violation is a refusal the write door counts as `rejected`.

use super::merge::Registry;
use crate::record::types::{AttrValue, Record, SubjectRef, DETAIL_MAX_BYTES, RECORD_VERSION};
use fgos_host_runtime::civil_time::parse_rfc3339_millis;

#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum RecordError {
    #[error("unsupported record version {0}")]
    UnsupportedVersion(u32),
    #[error("record id is empty")]
    EmptyId,
    #[error("unknown kind '{0}'")]
    UnknownKind(String),
    #[error("unknown subject kind '{0}'")]
    UnknownSubjectKind(String),
    #[error("kind '{kind}' does not allow subject kind '{subject}'")]
    SubjectNotAllowed { kind: String, subject: String },
    #[error("subject or ref '{0}' has an empty id")]
    EmptySubjectId(String),
    #[error("kind '{kind}' does not declare attr '{name}'")]
    UnknownAttr { kind: String, name: String },
    #[error("kind '{kind}' does not declare measure '{name}'")]
    UnknownMeasure { kind: String, name: String },
    #[error("'{name}' is an alias; write the canonical name '{canonical}'")]
    AliasUsed { name: String, canonical: String },
    #[error("attr '{name}' is {expected}, got {got}")]
    WrongType {
        name: String,
        expected: &'static str,
        got: &'static str,
    },
    #[error("attr '{name}' value '{value}' is outside its closed set")]
    ValueNotAllowed { name: String, value: String },
    #[error("invalid {field} timestamp '{value}'")]
    BadTimestamp { field: &'static str, value: String },
    #[error("endTs is before ts")]
    SpanEndsBeforeStart,
    #[error("detail is {0} bytes; the cap is {DETAIL_MAX_BYTES}")]
    DetailTooLong(usize),
}

impl Registry {
    pub fn validate(&self, record: &Record) -> Result<(), RecordError> {
        if record.v != RECORD_VERSION {
            return Err(RecordError::UnsupportedVersion(record.v));
        }
        if record.id.is_empty() {
            return Err(RecordError::EmptyId);
        }
        let kind = self
            .kind(&record.kind)
            .ok_or_else(|| RecordError::UnknownKind(record.kind.clone()))?;

        self.check_subject(&record.subject)?;
        if !kind.subjects.contains(&record.subject.kind) {
            return Err(RecordError::SubjectNotAllowed {
                kind: record.kind.clone(),
                subject: record.subject.kind.clone(),
            });
        }
        for reference in &record.refs {
            self.check_subject(reference)?;
        }

        for (name, value) in &record.attrs {
            self.check_not_alias(name)?;
            if !kind.attrs.contains(name) {
                return Err(RecordError::UnknownAttr {
                    kind: record.kind.clone(),
                    name: name.clone(),
                });
            }
            let def = self
                .attr(name)
                .expect("kind references are checked at merge");
            if value.value_type() != def.value_type {
                return Err(RecordError::WrongType {
                    name: name.clone(),
                    expected: def.value_type.as_str(),
                    got: value.value_type().as_str(),
                });
            }
            if let (AttrValue::Str(s), true) = (value, !def.values.is_empty()) {
                if !def.values.contains(s) {
                    return Err(RecordError::ValueNotAllowed {
                        name: name.clone(),
                        value: s.clone(),
                    });
                }
            }
        }
        for name in record.measures.keys() {
            self.check_not_alias(name)?;
            if !kind.measures.contains(name) {
                return Err(RecordError::UnknownMeasure {
                    kind: record.kind.clone(),
                    name: name.clone(),
                });
            }
        }

        let ts = parse_ts("ts", &record.ts)?;
        if let Some(end) = &record.end_ts {
            if parse_ts("endTs", end)? < ts {
                return Err(RecordError::SpanEndsBeforeStart);
            }
        }
        if let Some(detail) = &record.detail {
            if detail.len() > DETAIL_MAX_BYTES {
                return Err(RecordError::DetailTooLong(detail.len()));
            }
        }
        Ok(())
    }

    fn check_subject(&self, subject: &SubjectRef) -> Result<(), RecordError> {
        if !self.has_subject_kind(&subject.kind) {
            return Err(RecordError::UnknownSubjectKind(subject.kind.clone()));
        }
        if subject.id.is_empty() {
            return Err(RecordError::EmptySubjectId(subject.kind.clone()));
        }
        Ok(())
    }

    fn check_not_alias(&self, name: &str) -> Result<(), RecordError> {
        let canonical = self.canonical_name(name);
        if canonical != name {
            return Err(RecordError::AliasUsed {
                name: name.to_owned(),
                canonical: canonical.to_owned(),
            });
        }
        Ok(())
    }
}

fn parse_ts(field: &'static str, value: &str) -> Result<i64, RecordError> {
    parse_rfc3339_millis(value).ok_or_else(|| RecordError::BadTimestamp {
        field,
        value: value.to_owned(),
    })
}
