//! pi and omp: JSON lines on stdout; each assistant `message_end` carries that turn's usage (not cumulative).
use super::{add, sum_present, Usage};
use serde_json::Value;
use std::collections::HashSet;

fn num(v: &Value, key: &str) -> Option<u64> {
    v.get(key).and_then(Value::as_u64)
}

fn events(stdout: &str) -> impl Iterator<Item = Value> + '_ {
    stdout
        .lines()
        .map(str::trim)
        .filter(|l| l.starts_with('{'))
        .filter_map(|l| serde_json::from_str::<Value>(l).ok())
}

/// The summed usage of the stream's assistant turns, `None` when it has none. `source` names the CLI.
pub(super) fn parse(stdout: &str, source: &str) -> Option<Usage> {
    let mut seen = HashSet::new();
    let mut sum = Usage {
        source: source.to_string(),
        ..Usage::default()
    };
    let mut turns = 0;
    for event in events(stdout) {
        let message = &event["message"];
        if event["type"] != "message_end" || message["role"] != "assistant" {
            continue;
        }
        if let Some(id) = message["responseId"].as_str().or(message["id"].as_str()) {
            if !seen.insert(id.to_string()) {
                continue;
            }
        }
        let usage = &message["usage"];
        if !usage.is_object() {
            continue;
        }
        turns += 1;
        let (input, output) = (num(usage, "input"), num(usage, "output"));
        let (read, write) = (num(usage, "cacheRead"), num(usage, "cacheWrite"));
        add(&mut sum.input_tokens, input);
        add(&mut sum.output_tokens, output);
        add(&mut sum.cache_read_tokens, read);
        add(&mut sum.cache_creation_tokens, write);
        add(
            &mut sum.reasoning_tokens,
            num(usage, "reasoning").or(num(usage, "reasoningTokens")),
        );
        add(
            &mut sum.total_tokens,
            num(usage, "totalTokens").or_else(|| sum_present(&[input, output, read, write])),
        );
    }
    (turns > 0).then(|| sum.found())
}

pub(super) fn absent_reason(stdout: &str) -> &'static str {
    if events(stdout).next().is_some() {
        "no-assistant-turns"
    } else {
        "no-structured-output"
    }
}
