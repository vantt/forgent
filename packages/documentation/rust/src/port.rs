//! The locate port: fgOS's own types for a locate question and its answer, and the two things the use case needs
//! from outside, a locator and a way to start the index worker. Nothing here names pkm.

use std::collections::BTreeMap;
use std::io;

use serde::Serialize;

/// At most this many draft parts in one call.
pub const PARTS_MAX: usize = 8;
/// At most this many candidates per part.
pub const CANDIDATES_MAX: usize = 10;

/// One locate question: draft passages in the corpus language, and the region the writer guesses.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Query {
    pub parts: Vec<String>,
    /// `area` values the writer guesses; empty means no guess.
    pub area: Vec<String>,
    /// `question` values the writer guesses; empty means no guess.
    pub question: Vec<String>,
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

/// The answer for one draft part.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize)]
pub struct Part {
    pub candidates: Vec<Candidate>,
    pub places: Vec<Place>,
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

/// The index worker as a process: is one running for this corpus, and start one.
pub trait WorkerLauncher {
    fn running(&self) -> bool;
    fn start(&self) -> io::Result<()>;
}
