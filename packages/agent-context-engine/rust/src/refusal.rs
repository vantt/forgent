//! The refusals of `contracts/refusals.v1.json`: one code per way a rule or a compiled set is turned away. A refusal
//! carries the code, the rule ids it concerns, the file when there is one, and a sentence for a person.

use std::fmt;

/// Every code a refusal can carry. The strings are those of `refusals.v1.json`; a test holds both lists equal.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum RefusalCode {
    WhenKeyUnknown,
    WhenValueInvalid,
    OwnerUnknown,
    IdDuplicate,
    ReplacementIncomplete,
    DependencyNotInForce,
    ConflictInForce,
    LawOverridden,
    NearDuplicate,
    SearchUnavailable,
    SetDigestMismatch,
    SetVersionUnsupported,
    SetMalformed,
    UnitInvalid,
    CompositionInvalid,
}

/// The exit categories of `packages/host-runtime/contracts/exit-codes.v1.json` the refusals use.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Category {
    Validation,
    Conflict,
    Precondition,
    Corrupt,
}

impl Category {
    pub fn as_str(self) -> &'static str {
        match self {
            Category::Validation => "validation",
            Category::Conflict => "conflict",
            Category::Precondition => "precondition",
            Category::Corrupt => "corrupt",
        }
    }
}

/// When a refusal is raised: at write time (the check) or at read time (a reader of the compiled set).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Phase {
    Write,
    Read,
}

impl Phase {
    pub fn as_str(self) -> &'static str {
        match self {
            Phase::Write => "write",
            Phase::Read => "read",
        }
    }
}

impl RefusalCode {
    pub const ALL: [RefusalCode; 15] = [
        RefusalCode::WhenKeyUnknown,
        RefusalCode::WhenValueInvalid,
        RefusalCode::OwnerUnknown,
        RefusalCode::IdDuplicate,
        RefusalCode::ReplacementIncomplete,
        RefusalCode::DependencyNotInForce,
        RefusalCode::ConflictInForce,
        RefusalCode::LawOverridden,
        RefusalCode::NearDuplicate,
        RefusalCode::SearchUnavailable,
        RefusalCode::SetDigestMismatch,
        RefusalCode::SetVersionUnsupported,
        RefusalCode::SetMalformed,
        RefusalCode::UnitInvalid,
        RefusalCode::CompositionInvalid,
    ];

    pub fn as_str(self) -> &'static str {
        match self {
            RefusalCode::WhenKeyUnknown => "rule-when-key-unknown",
            RefusalCode::WhenValueInvalid => "rule-when-value-invalid",
            RefusalCode::OwnerUnknown => "rule-owner-unknown",
            RefusalCode::IdDuplicate => "rule-id-duplicate",
            RefusalCode::ReplacementIncomplete => "rule-replacement-incomplete",
            RefusalCode::DependencyNotInForce => "rule-dependency-not-in-force",
            RefusalCode::ConflictInForce => "rule-conflict-in-force",
            RefusalCode::LawOverridden => "rule-law-overridden",
            RefusalCode::NearDuplicate => "rule-near-duplicate",
            RefusalCode::SearchUnavailable => "rule-search-unavailable",
            RefusalCode::SetDigestMismatch => "rule-set-digest-mismatch",
            RefusalCode::SetVersionUnsupported => "rule-set-version-unsupported",
            RefusalCode::SetMalformed => "rule-set-malformed",
            RefusalCode::UnitInvalid => "rule-unit-invalid",
            RefusalCode::CompositionInvalid => "rule-composition-invalid",
        }
    }

    pub fn parse(code: &str) -> Option<RefusalCode> {
        RefusalCode::ALL.into_iter().find(|c| c.as_str() == code)
    }

    pub fn category(self) -> Category {
        match self {
            RefusalCode::WhenKeyUnknown
            | RefusalCode::WhenValueInvalid
            | RefusalCode::OwnerUnknown
            | RefusalCode::ReplacementIncomplete
            | RefusalCode::UnitInvalid => Category::Validation,
            RefusalCode::IdDuplicate
            | RefusalCode::ConflictInForce
            | RefusalCode::LawOverridden
            | RefusalCode::NearDuplicate
            | RefusalCode::CompositionInvalid => Category::Conflict,
            RefusalCode::DependencyNotInForce
            | RefusalCode::SearchUnavailable
            | RefusalCode::SetVersionUnsupported => Category::Precondition,
            RefusalCode::SetDigestMismatch | RefusalCode::SetMalformed => Category::Corrupt,
        }
    }

    pub fn phase(self) -> Phase {
        match self {
            RefusalCode::SetDigestMismatch
            | RefusalCode::SetVersionUnsupported
            | RefusalCode::SetMalformed => Phase::Read,
            _ => Phase::Write,
        }
    }
}

impl fmt::Display for RefusalCode {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}

/// One refusal: what was refused, which rules it concerns, in which file, and why.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct Refusal {
    pub code: RefusalCode,
    /// Rule ids the refusal concerns, sorted and without repeats.
    pub ids: Vec<String>,
    /// Repository path of the unit file, when one file is to blame.
    pub source: Option<String>,
    pub message: String,
}

impl Refusal {
    pub fn new(code: RefusalCode, message: impl Into<String>) -> Refusal {
        Refusal {
            code,
            ids: Vec::new(),
            source: None,
            message: message.into(),
        }
    }

    pub fn with_ids<I, S>(mut self, ids: I) -> Refusal
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        let mut ids: Vec<String> = ids.into_iter().map(Into::into).collect();
        ids.sort();
        ids.dedup();
        self.ids = ids;
        self
    }

    pub fn with_source(mut self, source: impl Into<String>) -> Refusal {
        self.source = Some(source.into());
        self
    }
}

impl fmt::Display for Refusal {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[{}] {}", self.code, self.message)?;
        if let Some(source) = &self.source {
            write!(f, " (in {source})")?;
        }
        Ok(())
    }
}

impl std::error::Error for Refusal {}
