//! Consumer-owned type contracts. No consumer code is imported here.
use crate::{
    envelope::Scope,
    errors::{Error, ErrorCode},
};
use serde::{Deserialize, Serialize};
use std::{collections::BTreeMap, fs, path::Path};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Registration {
    #[serde(rename = "type")]
    pub event_type: String,
    pub domain: String,
    pub schema_version: u64,
    pub scope: Scope,
    pub seal_on_write: bool,
}
#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ConsumerContract {
    pub v: u32,
    pub types: Vec<Registration>,
}
#[derive(Debug, Clone)]
pub struct Registry {
    types: BTreeMap<String, Registration>,
}
fn invalid(detail: impl Into<String>) -> Error {
    Error::new(ErrorCode::EventStoreIntegrity, detail)
}
impl Default for Registry {
    fn default() -> Self {
        let promote = Registration {
            event_type: "store.promote".into(),
            domain: "store".into(),
            schema_version: 1,
            scope: Scope::Project,
            seal_on_write: true,
        };
        Self {
            types: BTreeMap::from([(promote.event_type.clone(), promote)]),
        }
    }
}
impl Registry {
    /// Load transactionally: a bad file never leaves a partial registration set.
    pub fn load_files(&mut self, paths: &[impl AsRef<Path>]) -> Result<(), Error> {
        let mut next = self.clone();
        for path in paths {
            let bytes = fs::read(path).map_err(|e| invalid(e.to_string()))?;
            let contract: ConsumerContract =
                serde_json::from_slice(&bytes).map_err(|e| invalid(e.to_string()))?;
            next.register(contract)?;
        }
        *self = next;
        Ok(())
    }
    pub fn register(&mut self, contract: ConsumerContract) -> Result<(), Error> {
        if contract.v != 1 {
            return Err(invalid("unsupported registry version"));
        }
        let mut next = self.types.clone();
        for item in contract.types {
            if item.domain.is_empty()
                || !item
                    .domain
                    .bytes()
                    .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == b'-')
                || item.schema_version == 0
                || item.schema_version > 9_007_199_254_740_991
            {
                return Err(invalid("invalid domain or schemaVersion"));
            }
            let prefix = format!("{}.", item.domain);
            if item.event_type != "decision"
                && (!item.event_type.starts_with(&prefix)
                    || item.event_type.len() == prefix.len()
                    || !item.event_type.bytes().all(|c| {
                        c.is_ascii_lowercase() || c.is_ascii_digit() || b".-_".contains(&c)
                    }))
            {
                return Err(invalid("type must belong to its domain"));
            }
            if (item.event_type.starts_with("work.") || item.event_type == "decision")
                && item.scope != Scope::Project
            {
                return Err(invalid("shared truth requires project scope"));
            }
            if next.contains_key(&item.event_type) {
                return Err(invalid(
                    "type already registered; scope and ownership are immutable",
                ));
            }
            next.insert(item.event_type.clone(), item);
        }
        self.types = next;
        Ok(())
    }
    pub fn get(&self, event_type: &str) -> Result<&Registration, Error> {
        self.types
            .get(event_type)
            .ok_or_else(|| Error::new(ErrorCode::EventStoreUnregisteredType, event_type))
    }
    /// Validate the envelope metadata before append. Payload references remain the consumer's contract.
    pub fn validate(
        &self,
        event_type: &str,
        scope: Scope,
        schema_version: u64,
    ) -> Result<&Registration, Error> {
        let entry = self.get(event_type)?;
        if entry.scope != scope || entry.schema_version != schema_version {
            return Err(invalid("scope or schemaVersion differs from registration"));
        }
        Ok(entry)
    }
}
