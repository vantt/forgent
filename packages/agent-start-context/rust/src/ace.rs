//! Adapters of two ports onto the agent context engine: the compiled rule set read and verified by its reader, and
//! its when-keys registry with the live values of a `ValueSource`. Both are pure: the host passes the bytes and the
//! value source.

use crate::ports::{FactRegistry, Rule, RuleSet, ValueType};
use crate::request::{Refusal, RefusalCode};
use fgos_agent_context_engine::set::EffectiveSet;
use fgos_agent_context_engine::when_keys::{registry, KeySource, ValueSource};

/// The effective rule set, verified by the agent context engine's reader (versions, shape, digest).
pub struct AceRules {
    digest: String,
    rules: Vec<Rule>,
}

impl AceRules {
    /// Reads `.fgos/instructions/effective/rules.json` bytes; a set the reader refuses is `start-rule-set-invalid`.
    pub fn read(bytes: &[u8]) -> Result<AceRules, Refusal> {
        let set = EffectiveSet::read(bytes).map_err(|refusal| {
            Refusal::new(
                RefusalCode::StartRuleSetInvalid,
                &format!("{}: {}", refusal.code.as_str(), refusal.message),
            )
        })?;
        let rules = set
            .rules
            .into_iter()
            .map(|r| Rule {
                id: r.id,
                owner: r.owner,
                kind: r.kind,
                body: r.body,
                when: r.when,
            })
            .collect();
        Ok(AceRules {
            digest: set.digest,
            rules,
        })
    }
}

impl RuleSet for AceRules {
    fn digest(&self) -> &str {
        &self.digest
    }
    fn rules(&self) -> &[Rule] {
        &self.rules
    }
}

/// The when-keys registry: a key's value type and static values from the registry, its live values from `live`.
pub struct AceFacts<'a> {
    live: &'a dyn ValueSource,
}

impl<'a> AceFacts<'a> {
    pub fn new(live: &'a dyn ValueSource) -> AceFacts<'a> {
        AceFacts { live }
    }
}

impl FactRegistry for AceFacts<'_> {
    fn value_type(&self, key: &str) -> Option<ValueType> {
        registry().get(key).map(|k| {
            if k.value_type == "enum" {
                ValueType::Enum
            } else {
                ValueType::String
            }
        })
    }
    fn allowed(&self, key: &str) -> Option<Vec<String>> {
        match &registry().get(key)?.source {
            KeySource::Static(values) => Some(values.clone()),
            KeySource::Live(_) => self.live.values(key),
        }
    }
}
