//! codex: the stderr tail `tokens used` then a number. Anchored to the last two non-empty lines so a tool output
//! that contains the phrase cannot match.
use super::Usage;

pub(super) fn parse(stderr: &str) -> Option<Usage> {
    let lines: Vec<&str> = stderr
        .lines()
        .map(str::trim)
        .filter(|l| !l.is_empty())
        .collect();
    let [.., label, count] = lines.as_slice() else {
        return None;
    };
    if !label.eq_ignore_ascii_case("tokens used")
        || count.is_empty()
        || !count.chars().all(|c| c.is_ascii_digit() || c == ',')
    {
        return None;
    }
    let total = count.replace(',', "").parse::<u64>().ok()?;
    let usage = Usage {
        total_tokens: Some(total),
        source: "codex-cli".to_string(),
        ..Usage::default()
    };
    Some(usage.found())
}
