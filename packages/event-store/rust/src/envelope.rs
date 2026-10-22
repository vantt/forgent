//! Canonical protocol records. Hashes include the single framing newline.
use crate::{
    errors::Error,
    validation::{lowercase_hex, valid_object_id, valid_store_id},
};
use fgos_canonical_json::canonical_line;
use fgos_identity::machine::valid_machine_id;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;

// Protocol counters must survive JCS binary64 encoding without identity collisions.
const MAX_SAFE_COUNTER: u64 = (1u64 << 53) - 1;
fn positive_counter(n: u64) -> bool {
    n > 0 && n <= MAX_SAFE_COUNTER
}

use crate::errors::invalid;
pub fn sha256(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}
pub fn line<T: Serialize>(record: &T) -> Result<Vec<u8>, Error> {
    let value = serde_json::to_value(record).map_err(|e| invalid(e.to_string()))?;
    canonical_line(&value).map_err(|e| invalid(e.to_string()))
}
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Scope {
    Project,
    Branch,
    Local,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Envelope {
    pub v: u8,
    #[serde(rename = "type")]
    pub event_type: String,
    pub scope: Scope,
    pub origin: String,
    pub stream: String,
    pub seq: u64,
    pub seen: BTreeMap<String, u64>,
    pub ts: String,
    pub src: String,
    pub schema_version: u64,
    pub payload: Value,
    pub h: String,
}
impl Envelope {
    pub fn compute_hash(&self) -> Result<String, Error> {
        let mut value = serde_json::to_value(self).map_err(|e| invalid(e.to_string()))?;
        value.as_object_mut().unwrap().remove("h");
        Ok(sha256(
            &canonical_line(&value).map_err(|e| invalid(e.to_string()))?,
        ))
    }
    pub fn validate(&self) -> Result<(), Error> {
        if self.v != 4
            || !positive_counter(self.seq)
            || !positive_counter(self.schema_version)
            || self.event_type.is_empty()
            || self.src.is_empty()
            || !valid_store_id(&self.origin)
        {
            return Err(invalid("invalid v4 envelope fields"));
        }
        if !valid_timestamp(&self.ts) {
            return Err(invalid("timestamp must be YYYY-MM-DDTHH:MM:SS.sssZ"));
        }
        let stream_matches = scope_matches(self.scope, &self.stream);
        if !stream_matches
            || self
                .seen
                .contains_key(&format!("{}:{}", self.origin, self.stream))
        {
            return Err(invalid("scope/stream mismatch or own stream in seen"));
        }
        if self
            .seen
            .iter()
            .any(|(k, v)| !valid_seen_key(k) || !positive_counter(*v))
        {
            return Err(invalid("invalid seen entry"));
        }
        if !is_digest(&self.h) || self.h != self.compute_hash()? {
            return Err(invalid("event hash mismatch"));
        }
        Ok(())
    }
    pub fn canonical_line(&self) -> Result<Vec<u8>, Error> {
        self.validate()?;
        line(self)
    }
    /// Accepts only the stored canonical form, including exactly one final LF.
    pub fn parse(raw: &[u8]) -> Result<Self, Error> {
        let event: Self = serde_json::from_slice(raw).map_err(|e| invalid(e.to_string()))?;
        if raw != event.canonical_line()? {
            return Err(invalid(
                "expected canonical event bytes including exactly one trailing newline",
            ));
        }
        Ok(event)
    }
}
fn scope_matches(scope: Scope, stream: &str) -> bool {
    crate::layout::StreamId::parse(stream).is_ok_and(|id| id.scope() == scope)
}
pub(crate) fn valid_seen_key(key: &str) -> bool {
    key.split_once(':').is_some_and(|(origin, stream)| {
        valid_store_id(origin) && crate::layout::StreamId::parse(stream).is_ok()
    })
}
pub fn is_digest(s: &str) -> bool {
    lowercase_hex(s, 64)
}
pub fn valid_timestamp(s: &str) -> bool {
    let b = s.as_bytes();
    if b.len() != 24
        || [
            (4, b'-'),
            (7, b'-'),
            (10, b'T'),
            (13, b':'),
            (16, b':'),
            (19, b'.'),
            (23, b'Z'),
        ]
        .iter()
        .any(|(i, c)| b[*i] != *c)
    {
        return false;
    }
    if b.iter()
        .enumerate()
        .any(|(i, c)| ![4, 7, 10, 13, 16, 19, 23].contains(&i) && !c.is_ascii_digit())
    {
        return false;
    }
    let n = |a: usize, z: usize| s[a..z].parse::<u32>().unwrap();
    let (y, m, d) = (n(0, 4), n(5, 7), n(8, 10));
    let leap = y % 4 == 0 && (y % 100 != 0 || y % 400 == 0);
    let days = match m {
        2 => {
            if leap {
                29
            } else {
                28
            }
        }
        4 | 6 | 9 | 11 => 30,
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        _ => return false,
    };
    d >= 1 && d <= days && n(11, 13) < 24 && n(14, 16) < 60 && n(17, 19) < 60
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BatchCommit {
    pub v: u8,
    pub kind: String,
    pub origin: String,
    pub stream: String,
    pub first_seq: u64,
    pub last_seq: u64,
    pub count: u64,
    pub sha256: String,
}
impl BatchCommit {
    pub fn validate(&self) -> Result<(), Error> {
        if self.v != 4
            || self.kind != "batch-commit"
            || !valid_store_id(&self.origin)
            || crate::layout::StreamId::parse(&self.stream).is_err()
            || !positive_counter(self.first_seq)
            || !positive_counter(self.last_seq)
            || self.last_seq < self.first_seq
            || self.count != self.last_seq - self.first_seq + 1
            || !is_digest(&self.sha256)
        {
            return Err(invalid("invalid batch commit marker"));
        }
        Ok(())
    }
    pub fn canonical_line(&self) -> Result<Vec<u8>, Error> {
        self.validate()?;
        line(self)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "kind", rename_all = "lowercase", deny_unknown_fields)]
pub enum Seal {
    #[serde(rename_all = "camelCase")]
    Seal {
        v: u8,
        machine_id: String,
        origin: String,
        stream: String,
        scope: Scope,
        first_seq: u64,
        last_seq: u64,
        count: u64,
        sha256: String,
    },
    #[serde(rename_all = "camelCase")]
    Merge {
        v: u8,
        machine_id: String,
        parents: [String; 2],
    },
    #[serde(rename_all = "camelCase")]
    Legacy {
        from_commit: String,
        tree_of_fgos_events: String,
    },
}
impl Seal {
    pub fn validate(&self) -> Result<(), Error> {
        match self {
            Self::Seal {
                v,
                machine_id,
                origin,
                stream,
                scope,
                first_seq,
                last_seq,
                count,
                sha256,
            } => {
                let marker = BatchCommit {
                    v: 4,
                    kind: "batch-commit".into(),
                    origin: origin.clone(),
                    stream: stream.clone(),
                    first_seq: *first_seq,
                    last_seq: *last_seq,
                    count: *count,
                    sha256: sha256.clone(),
                };
                marker.validate()?;
                if *v != 1 || !valid_machine_id(machine_id) || !scope_matches(*scope, stream) {
                    return Err(invalid("invalid seal header"));
                }
            }
            Self::Merge {
                v,
                machine_id,
                parents,
            } => {
                if *v != 1
                    || !valid_machine_id(machine_id)
                    || parents.iter().any(|p| !valid_object_id(p))
                    || parents[0] == parents[1]
                {
                    return Err(invalid("invalid merge header"));
                }
            }
            Self::Legacy {
                from_commit,
                tree_of_fgos_events,
            } => {
                if !valid_object_id(from_commit) || !valid_object_id(tree_of_fgos_events) {
                    return Err(invalid("invalid legacy header"));
                }
            }
        }
        Ok(())
    }
    pub fn canonical_line(&self) -> Result<Vec<u8>, Error> {
        self.validate()?;
        line(self)
    }
    pub fn digest(&self) -> Result<String, Error> {
        Ok(sha256(&self.canonical_line()?))
    }
}
