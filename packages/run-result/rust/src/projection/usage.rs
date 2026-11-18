//! The run-result `usage` object onto the OpenTelemetry-named measures. The object keeps camelCase keys; the
//! records carry the registry names. A count the run never reported stays absent.

use fgos_observe::record::types::AttrValue;
use serde_json::{Number, Value};
use std::collections::BTreeMap;

const COUNTS: &[(&str, &str)] = &[
    ("inputTokens", "gen_ai.usage.input_tokens"),
    ("outputTokens", "gen_ai.usage.output_tokens"),
    ("cacheReadTokens", "gen_ai.usage.cache_read.input_tokens"),
    (
        "cacheCreationTokens",
        "gen_ai.usage.cache_creation.input_tokens",
    ),
    ("totalTokens", "fgos.usage.total_tokens"),
    ("reasoningTokens", "fgos.usage.reasoning_tokens"),
];

pub(super) fn project(
    usage: &Value,
    attrs: &mut BTreeMap<String, AttrValue>,
    measures: &mut BTreeMap<String, Number>,
) {
    if !usage.is_object() {
        return;
    }
    for (key, name) in COUNTS {
        if let Some(n) = usage[*key].as_u64() {
            measures.insert((*name).to_owned(), Number::from(n));
        }
    }
    for (key, name) in [
        ("source", "fgos.usage.source"),
        ("reason", "fgos.usage.reason"),
    ] {
        if let Some(s) = super::text(&usage[key]) {
            attrs.insert(name.to_owned(), AttrValue::Str(s.to_owned()));
        }
    }
}
