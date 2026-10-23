//! The answer of every door that can say no with a reason a caller can act on.

/// The answer is a refusal, not a result: the CLI prints `detail` and exits
/// with [`Refusal::EXIT`].
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Refusal {
    pub reason: &'static str,
    pub detail: String,
    /// The names the caller may have meant (`not-found`) or the sessions the
    /// name matches (`ambiguous`); empty for every other refusal.
    pub candidates: Vec<String>,
}

impl Refusal {
    pub const EXIT: i32 = 65;
}
