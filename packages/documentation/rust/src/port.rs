//! The locate port: fgOS's own types for a locate question and its answer, and the two things the use case needs
//! from outside, a locator and a way to start the index worker. Nothing here names pkm.

use std::collections::BTreeMap;
use std::io;

use serde::Serialize;

/// At most this many draft parts in one call.
pub const PARTS_MAX: usize = 8;
/// At most this many candidates per part.
pub const CANDIDATES_MAX: usize = 10;
/// At most this many terms are scanned per part; the rest are counted in `Part::dropped_terms`.
pub const TERMS_MAX: usize = 16;
/// At most this many sections are listed per term; `Mention::total` still counts them all.
pub const MENTION_SECTIONS_MAX: usize = 20;
/// A backticked span shorter than this is not a term.
pub const TERM_MIN_CHARS: usize = 3;

/// One locate question: draft passages in the corpus language, and the region the writer guesses.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Query {
    pub parts: Vec<String>,
    /// `area` values the writer guesses; empty means no guess.
    pub area: Vec<String>,
    /// `question` values the writer guesses; empty means no guess.
    pub question: Vec<String>,
    /// Literal strings the writer wants found wherever the corpus mentions them, besides the backticked spans of
    /// each part.
    pub exact: Vec<String>,
}

/// How far the search index is. Only `Ready` answers in full; every other state answers `partial`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum IndexKind {
    /// No text index yet: the worker is reading the corpus for the first time.
    Starting,
    /// Text answers; meaning vectors are still being computed.
    Indexing,
    /// No usable embedding model: text answers only.
    ModelMissing,
    /// Cannot run and will not heal by itself.
    Broken,
    Ready,
}

/// The index state with the sentence that tells a person what to do about it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct IndexState {
    pub kind: IndexKind,
    pub action: String,
}

/// One document that may already hold the draft.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Candidate {
    pub rank: usize,
    /// Repository-relative path (`docs/...`).
    pub path: String,
    pub title: String,
    /// Heading path of the best section, outermost first; empty when the document has no headings.
    pub section: Vec<String>,
    pub excerpt: Option<String>,
    /// Axis values of the document (`area`, `question`); an axis with no value is absent.
    pub axes: BTreeMap<String, String>,
    /// The document lies outside the region the writer guessed. A document with no value on a guessed axis is not
    /// outside.
    pub outside_region: bool,
}

/// Where new content would go: how many candidates carry one axis value, and that value's home folder.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Place {
    pub axis: String,
    pub value: String,
    pub home: Option<String>,
    pub candidates: usize,
}

/// One section of a document that holds a term.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MentionAt {
    /// Repository-relative path (`docs/...`).
    pub path: String,
    /// Heading path of the section, outermost first; empty before the first heading.
    pub section: Vec<String>,
    /// 1-based line of the first occurrence in the section.
    pub line: usize,
    /// The document is not among the part's candidates: the search did not return what the scan found.
    pub missed_by_search: bool,
}

/// Where the corpus holds one literal term.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Mention {
    pub term: String,
    /// Sections holding the term, listed or not.
    pub total: usize,
    /// `sections` holds fewer than `total`.
    pub truncated: bool,
    pub sections: Vec<MentionAt>,
}

/// The answer for one draft part.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Part {
    pub candidates: Vec<Candidate>,
    pub places: Vec<Place>,
    /// Every term of the part with the sections that hold it, found by reading the corpus files themselves.
    pub mentions: Vec<Mention>,
    /// Terms found beyond `TERMS_MAX` and not scanned.
    #[serde(skip_serializing_if = "is_zero")]
    pub dropped_terms: usize,
}

fn is_zero(n: &usize) -> bool {
    *n == 0
}

/// Parts that share a home: a hint to write them together or apart. Part numbers start at 1.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Group {
    pub parts: Vec<usize>,
    pub home: Option<String>,
}

/// A locate answer. `partial` is true whenever the index is not ready; then `parts` may be empty.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Answer {
    pub partial: bool,
    pub state: IndexKind,
    /// What to do about a state that is not ready.
    pub action: Option<String>,
    pub parts: Vec<Part>,
    /// Present only for a call with more than one part.
    pub group: Option<Vec<Group>>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LocateError {
    /// The question itself is wrong (no parts, too many, an unknown axis value).
    Invalid(String),
    /// The locator failed.
    Failed(String),
}

impl std::fmt::Display for LocateError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LocateError::Invalid(m) | LocateError::Failed(m) => f.write_str(m),
        }
    }
}

impl std::error::Error for LocateError {}

/// Answers a locate question over the corpus index.
pub trait Locator {
    fn locate(&self, query: &Query) -> Result<Answer, LocateError>;
    fn state(&self) -> IndexState;
}

impl<T: Locator + ?Sized> Locator for &T {
    fn locate(&self, query: &Query) -> Result<Answer, LocateError> {
        (**self).locate(query)
    }
    fn state(&self) -> IndexState {
        (**self).state()
    }
}

/// Finds where the corpus holds literal terms, independent of any index.
pub trait MentionScanner {
    /// One `Mention` per term, in the order given; `missed_by_search` is left false for the caller to set.
    fn scan(&self, terms: &[String]) -> Result<Vec<Mention>, LocateError>;
}

/// The index worker as a process: is one running for this corpus, and start one.
pub trait WorkerLauncher {
    fn running(&self) -> bool;
    fn start(&self) -> io::Result<()>;
}
