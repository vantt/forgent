//! The compiled effective rule set (`contracts/effective-rules.v1.json`): the rules in force in composition order,
//! the version of the `when:` registry they were checked against, and a digest. A reader opens one JSON file, needs
//! no pkm and no embedding model, recomputes the digest and refuses on a mismatch or an unsupported version.
//! The digest is the sha256 hex of the canonical JSON (RFC 8785: sorted keys, no whitespace, UTF-8) of `rules`.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};

use crate::refusal::{Refusal, RefusalCode};
use crate::rule::{Kind, RuleFile, Scope};
use crate::when_keys;

/// The only set schema version this build writes and reads.
pub const SCHEMA_VERSION: u32 = 1;

/// One rule of the set.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EffectiveRule {
    pub id: String,
    pub owner: String,
    pub kind: String,
    pub scope: String,
    pub specificity: u32,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    pub body: String,
    /// Repository paths of the unit files.
    pub sources: Vec<String>,
    pub when: BTreeMap<String, Vec<String>>,
}

impl EffectiveRule {
    pub fn from_file(file: &RuleFile) -> EffectiveRule {
        EffectiveRule {
            id: file.unit.id.clone(),
            owner: file.unit.owner.clone(),
            kind: file.unit.kind.as_str().to_string(),
            scope: file.unit.scope.as_str().to_string(),
            specificity: file.unit.specificity,
            title: Some(file.unit.title.clone()),
            body: file.body.clone(),
            sources: vec![file.source.clone()],
            when: file.unit.when.clone(),
        }
    }
}

/// The compiled set.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct EffectiveSet {
    pub schema_version: u32,
    pub when_keys_version: u32,
    pub digest: String,
    pub rules: Vec<EffectiveRule>,
}

/// The digest of a `rules` array, as JSON.
pub fn digest_of(rules: &Value) -> String {
    let canonical = fgos_canonical_json::canonical_json(rules)
        .expect("a value parsed from JSON has no non-finite number");
    let mut hasher = Sha256::new();
    hasher.update(canonical.as_bytes());
    hasher
        .finalize()
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect()
}

fn malformed(message: impl Into<String>) -> Refusal {
    Refusal::new(RefusalCode::SetMalformed, message)
}

impl EffectiveSet {
    /// A set of `rules` (already in composition order), with the digest computed.
    pub fn new(rules: Vec<EffectiveRule>) -> EffectiveSet {
        let value = serde_json::to_value(&rules).expect("rules serialize");
        EffectiveSet {
            schema_version: SCHEMA_VERSION,
            when_keys_version: when_keys::registry().version,
            digest: digest_of(&value),
            rules,
        }
    }

    /// The set of rules composed in order.
    pub fn from_composed(ordered: &[RuleFile]) -> EffectiveSet {
        EffectiveSet::new(ordered.iter().map(EffectiveRule::from_file).collect())
    }

    /// The file bytes: canonical JSON and one newline, so the same set is always the same bytes.
    pub fn to_bytes(&self) -> Vec<u8> {
        let value = serde_json::to_value(self).expect("a set serializes");
        let mut text =
            fgos_canonical_json::canonical_json(&value).expect("a set has no non-finite number");
        text.push('\n');
        text.into_bytes()
    }

    /// Reads a compiled set and verifies it: the versions first, then the shape, then the digest.
    pub fn read(bytes: &[u8]) -> Result<EffectiveSet, Refusal> {
        let doc: Value = serde_json::from_slice(bytes)
            .map_err(|e| malformed(format!("the file is not valid JSON: {e}")))?;
        let Some(map) = doc.as_object() else {
            return Err(malformed("the file is not a JSON object"));
        };
        match map.get("schemaVersion").and_then(Value::as_u64) {
            Some(v) if v == u64::from(SCHEMA_VERSION) => {}
            Some(v) => {
                return Err(Refusal::new(
                    RefusalCode::SetVersionUnsupported,
                    format!(
                        "schemaVersion {v} is not supported; this reader supports {SCHEMA_VERSION}"
                    ),
                ))
            }
            None => return Err(malformed("schemaVersion is missing or not an integer")),
        }
        let supported = when_keys::registry().version;
        match map.get("whenKeysVersion").and_then(Value::as_u64) {
            Some(v) if v == u64::from(supported) => {}
            Some(v) => {
                return Err(Refusal::new(
                    RefusalCode::SetVersionUnsupported,
                    format!(
                        "whenKeysVersion {v} is not supported; this reader supports {supported}"
                    ),
                ))
            }
            None => return Err(malformed("whenKeysVersion is missing or not an integer")),
        }
        let set: EffectiveSet = serde_json::from_value(doc.clone()).map_err(|e| {
            malformed(format!(
                "the file does not match the effective-rules schema: {e}"
            ))
        })?;
        if !is_digest(&set.digest) {
            return Err(malformed("digest is not 64 lower-case hex characters"));
        }
        for rule in &set.rules {
            if Kind::parse(&rule.kind).is_none() {
                return Err(malformed(format!(
                    "rule \"{}\" has an unknown kind",
                    rule.id
                )));
            }
            if Scope::parse(&rule.scope).is_none() {
                return Err(malformed(format!(
                    "rule \"{}\" has an unknown scope",
                    rule.id
                )));
            }
            if rule.sources.is_empty() {
                return Err(malformed(format!("rule \"{}\" names no source", rule.id)));
            }
        }
        let rules = map.get("rules").expect("shape check found the rules");
        let actual = digest_of(rules);
        if actual != set.digest {
            return Err(Refusal::new(
                RefusalCode::SetDigestMismatch,
                format!(
                    "the digest of the rules is {actual}, the file says {}",
                    set.digest
                ),
            ));
        }
        Ok(set)
    }
}

fn is_digest(text: &str) -> bool {
    text.len() == 64
        && text
            .bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}
