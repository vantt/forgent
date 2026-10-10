//! Temporal comparison for discussion summaries and their read-side windows.

use crate::contract::Window;
use fgos_host_runtime::civil_time::{parse_date_midnight_millis, parse_rfc3339_millis};

#[derive(Debug, Clone, Copy, Default)]
pub struct ParsedWindow {
    since: Option<i64>,
    until: Option<i64>,
}

impl ParsedWindow {
    pub fn parse(window: &Window) -> Result<Self, String> {
        let bound = |value: &Option<String>, name: &str| -> Result<Option<i64>, String> {
            value.as_ref().map(|value| {
                let parsed = if value.len() == 10 { parse_date_midnight_millis(value) } else { parse_timestamp_millis(value) };
                parsed.ok_or_else(|| format!("invalid {name} timestamp: {value}; expected YYYY-MM-DD or RFC3339"))
            }).transpose()
        };
        let parsed = Self { since: bound(&window.since, "--since")?, until: bound(&window.until, "--until")? };
        if matches!((parsed.since, parsed.until), (Some(since), Some(until)) if since > until) {
            return Err("--since must not be after --until".to_owned());
        }
        Ok(parsed)
    }

    pub fn contains(&self, timestamp_millis: i64) -> bool {
        self.since.is_none_or(|since| timestamp_millis >= since)
            && self.until.is_none_or(|until| timestamp_millis <= until)
    }
}


pub fn parse_timestamp_millis(timestamp: &str) -> Option<i64> {
    parse_rfc3339_millis(timestamp)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn windows_are_temporal_inclusive_and_date_bounds_are_utc_midnight() {
        let instant = parse_timestamp_millis("2026-10-05T00:00:00.250Z").unwrap();
        assert_eq!(parse_timestamp_millis("2026-10-05T02:00:00.250+02:00"), Some(instant));
        assert_eq!(parse_timestamp_millis("2026-10-04T19:00:00.250-05:00"), Some(instant));
        let exact = ParsedWindow::parse(&Window {
            since: Some("2026-10-05T02:00:00.250+02:00".into()), until: Some("2026-10-04T19:00:00.250-05:00".into()),
        }).unwrap();
        assert!(exact.contains(instant));
        assert!(!exact.contains(instant - 1));
        assert!(!exact.contains(instant + 1));
        let date = ParsedWindow::parse(&Window { since: Some("2026-10-05".into()), until: Some("2026-10-05".into()) }).unwrap();
        assert!(date.contains(instant - 250));
        assert!(!date.contains(instant));
    }

    #[test]
    fn invalid_and_reversed_bounds_name_the_offending_flag() {
        for (since, until, expected) in [
            (Some("2026-02-30"), None, "invalid --since"),
            (None, Some("yesterday"), "invalid --until"),
            (Some("2026-10-05T00:00:00+25:00"), None, "invalid --since"),
            (Some("2026-10-05T00:00:00Z"), Some("2026-10-05T01:00:00+02:00"), "--since must not be after --until"),
        ] {
            let window = Window { since: since.map(str::to_owned), until: until.map(str::to_owned) };
            assert!(ParsedWindow::parse(&window).unwrap_err().contains(expected));
        }
    }
}
