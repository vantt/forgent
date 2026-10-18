use super::DirectAdapter;

/// A CLI without its own adapter: exit and outbox only, no output patterns.
pub struct Generic;

impl DirectAdapter for Generic {
    fn cli(&self) -> &'static str {
        "generic"
    }

    fn names_blocks(&self) -> bool {
        false
    }
}
