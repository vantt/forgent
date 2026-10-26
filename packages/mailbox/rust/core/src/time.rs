//! Time as a plain value. The core never reads a clock: every operation
//! takes `now` from its caller (spec §4 rule 3).
use serde::{Deserialize, Serialize};

/// Milliseconds since the Unix epoch, supplied by the caller. The default
/// is the epoch itself, the time of a state no operation has touched.
#[derive(
    Debug, Clone, Copy, Default, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize,
)]
#[serde(transparent)]
pub struct Timestamp(u64);

const MILLIS_PER_SEC: u64 = 1000;

impl Timestamp {
    pub const fn from_millis(millis: u64) -> Self {
        Self(millis)
    }

    pub const fn as_millis(self) -> u64 {
        self.0
    }

    /// This time plus `secs` seconds, saturating at the end of time.
    pub const fn plus_secs(self, secs: u64) -> Self {
        Self(self.0.saturating_add(secs.saturating_mul(MILLIS_PER_SEC)))
    }

    /// Whether more than `secs` seconds have passed from `since` to `self`.
    pub const fn is_past(self, since: Timestamp, secs: u64) -> bool {
        self.0 > since.plus_secs(secs).0
    }
}
