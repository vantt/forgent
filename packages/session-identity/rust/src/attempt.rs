//! The writer id of one attempt: a pure function of the attempt id, so a
//! resume or a second reader derives the same id. Contract and shared
//! vectors: `contracts/attempt-writer-id.v1.json` and
//! `contracts/vectors/attempt-writer-id.v1.json`.

use crate::resolve::MAX_ID_LENGTH;

/// Prefix every minted attempt writer id carries.
pub const ATTEMPT_PREFIX: &str = "att-";
/// Longest attempt id that still yields a usable (<= [`MAX_ID_LENGTH`]) writer id.
pub const MAX_ATTEMPT_ID_LENGTH: usize = MAX_ID_LENGTH - ATTEMPT_PREFIX.len();

/// The attempt id is empty, too long, or has a character outside
/// `[A-Za-z0-9._-]`. Never repaired: no trim, case change or truncation.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InvalidAttemptId;

impl InvalidAttemptId {
    /// The error name the contract and the route use.
    pub const NAME: &'static str = "invalid-attempt-id";
}

impl std::fmt::Display for InvalidAttemptId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(Self::NAME)
    }
}

impl std::error::Error for InvalidAttemptId {}

/// `"att-" + attempt_id`, or [`InvalidAttemptId`].
pub fn mint_attempt_writer_id(attempt_id: &str) -> Result<String, InvalidAttemptId> {
    let usable = !attempt_id.is_empty()
        && attempt_id.chars().count() <= MAX_ATTEMPT_ID_LENGTH
        && attempt_id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '-'));
    if usable {
        Ok(format!("{ATTEMPT_PREFIX}{attempt_id}"))
    } else {
        Err(InvalidAttemptId)
    }
}
