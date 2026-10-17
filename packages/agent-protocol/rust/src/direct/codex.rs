use super::DirectAdapter;
use crate::outcome::StdinPolicy;

pub struct Codex;

impl DirectAdapter for Codex {
    fn cli(&self) -> &'static str {
        "codex"
    }

    /// codex probes piped stdin ("Reading additional input from stdin...") and
    /// blocks forever on an open pipe nothing writes to.
    fn stdin_policy(&self) -> StdinPolicy {
        StdinPolicy::NullDevice
    }
}
