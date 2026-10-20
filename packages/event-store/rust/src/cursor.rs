//! Canonical coverage cursor and conservative fold decision.
use crate::{
    append::Positions,
    envelope::{line, Envelope},
    errors::{invalid, Error},
    order::stream_key,
};
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Cursor {
    pub streams: BTreeSet<String>,
    pub project_order: bool,
    pub cover: Positions,
    pub certified: BTreeSet<String>,
    /// Exact ref-to-object bindings verified for this retained view.
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub verified_tips: BTreeMap<String, String>,
    pub mirror_tips: BTreeMap<String, String>,
    pub legacy_tips: BTreeMap<String, String>,
    pub legacy_digest: Option<String>,
    pub deferred: BTreeSet<String>,
}
impl Cursor {
    pub fn canonical_bytes(&self) -> Result<Vec<u8>, Error> {
        line(self)
    }
    pub fn parse(bytes: &[u8]) -> Result<Self, Error> {
        let c: Self = serde_json::from_slice(bytes).map_err(|e| invalid(e.to_string()))?;
        if c.canonical_bytes()? != bytes {
            return Err(invalid("noncanonical cursor"));
        }
        if c.cover
            .iter()
            .any(|(key, n)| !crate::envelope::valid_seen_key(key) || *n == 0 || *n >= (1u64 << 53))
            || c.streams
                .iter()
                .any(|s| crate::layout::StreamId::parse(s).is_err())
            || c.certified
                .iter()
                .any(|s| !crate::validation::valid_object_id(s))
            || c.legacy_digest
                .as_ref()
                .is_some_and(|h| !crate::envelope::is_digest(h))
            || c.deferred.iter().any(|s| !crate::envelope::is_digest(s))
            || c.mirror_tips
                .iter()
                .chain(&c.legacy_tips)
                .chain(&c.verified_tips)
                .any(|(name, oid)| {
                    fgos_git::RefName::parse(name).is_err()
                        || !crate::validation::valid_object_id(oid)
                })
        {
            return Err(invalid("invalid cursor coverage, query or identifiers"));
        }
        Ok(c)
    }
}
#[derive(Debug, PartialEq, Eq)]
pub enum Fold {
    Incremental,
    RebuildRequired { first_difference: usize },
}
pub fn fold_answer(
    old: &Cursor,
    new: &Cursor,
    old_order: &[String],
    full_order: &[String],
    delta: &[Envelope],
    own_origin: &str,
) -> Fold {
    let first = old_order
        .iter()
        .zip(full_order)
        .position(|(a, b)| a != b)
        .unwrap_or(old_order.len().min(full_order.len()));
    let legacy_changed =
        old.legacy_tips != new.legacy_tips || old.legacy_digest != new.legacy_digest;
    let first = if legacy_changed { 0 } else { first };
    let released = old.deferred.iter().any(|h| !new.deferred.contains(h));
    if old.streams == new.streams
        && old.project_order == new.project_order
        && old.mirror_tips == new.mirror_tips
        && !legacy_changed
        && !released
        && first == old_order.len()
        && delta.iter().all(|e| {
            e.origin == own_origin
                && e.event_type != "store.promote"
                && old
                    .cover
                    .iter()
                    .all(|(s, n)| *s == stream_key(e) || e.seen.get(s).copied().unwrap_or(0) >= *n)
        })
    {
        Fold::Incremental
    } else {
        Fold::RebuildRequired {
            first_difference: first,
        }
    }
}
