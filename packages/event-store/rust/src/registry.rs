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
use crate::errors::invalid;
include!(concat!(env!("OUT_DIR"), "/consumer_contracts.rs"));
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
    /// Reconcile durable event metadata on open (reader integration in phase 03).
    /// Call for every historical type before accepting appends with this registry.
    pub fn validate_historical_scope(&self, event_type: &str, scope: Scope) -> Result<(), Error> {
        if self.get(event_type)?.scope != scope {
            return Err(invalid("historical type scope changed"));
        }
        Ok(())
    }

    /// Every consumer `contracts/consumers.v1.json` lists, embedded at build time, so a native
    /// caller registers the same streams as the payload without searching a release layout.
    pub fn shipped() -> Result<Self, Error> {
        let mut registry = Self::default();
        for text in CONSUMER_CONTRACTS {
            let contract: ConsumerContract =
                serde_json::from_str(text).map_err(|e| invalid(e.to_string()))?;
            registry.register(contract)?;
        }
        Ok(registry)
    }

    /// Load transactionally: a bad file never leaves a partial registration set.
    pub fn load_files(&mut self, paths: &[impl AsRef<Path>]) -> Result<(), Error> {
        let mut next = self.clone();
        for path in paths {
            let bytes = fs::read(path).map_err(crate::errors::io)?;
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
            if item.domain == "store"
                || (item.event_type == "decision" && item.domain != "decisions")
            {
                return Err(invalid("reserved namespace or legacy type owner"));
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
