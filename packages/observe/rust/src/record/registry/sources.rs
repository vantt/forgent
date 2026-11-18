//! A record source states the kinds it can return; each must be declared, or its records could never be queried
//! or written back.

use super::merge::Registry;
use crate::contract::RecordSource;

impl Registry {
    /// Every kind a source states is declared. The error names the source and the first undeclared kind.
    pub fn check_source_kinds(&self, source: &dyn RecordSource) -> Result<(), String> {
        match source.kinds().iter().find(|kind| self.kind(kind).is_none()) {
            Some(kind) => Err(format!(
                "record source '{}' states kind '{kind}', which no declaration provides",
                source.source_id()
            )),
            None => Ok(()),
        }
    }
}
