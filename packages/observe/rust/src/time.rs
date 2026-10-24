//! Temporal comparison for discussion summaries and their read-side windows.

use crate::contract::Window;
use fgos_host_runtime::civil_time::{
    format_unix_millis_rfc3339, parse_date_midnight_millis, parse_rfc3339_millis,
};
use std::sync::atomic::{AtomicI64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Copy, Default)]
pub struct ParsedWindow {
    since: Option<i64>,
    until: Option<i64>,
}

impl ParsedWindow {
    pub fn parse(window: &Window) -> Result<Self, String> {
        let bound = |value: &Option<String>, name: &str| -> Result<Option<i64>, String> {
            value
                .as_ref()
                .map(|value| {
                    let parsed = if value.len() == 10 {
                        parse_date_midnight_millis(value)
                    } else {
                        parse_rfc3339_millis(value)
                    };
                    parsed.ok_or_else(|| {
                        format!("invalid {name} timestamp: {value}; expected YYYY-MM-DD or RFC3339")
                    })
                })
                .transpose()
        };
        let parsed = Self {
            since: bound(&window.since, "--since")?,
            until: bound(&window.until, "--until")?,
        };
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

/// The current time as an RFC 3339 UTC stamp with milliseconds. Within one
/// process every call is later than the one before, so a record and the resolve
/// that follows it never share an instant even in the same millisecond.
pub fn now_iso() -> String {
    static LAST_MILLIS: AtomicI64 = AtomicI64::new(0);
    let wall = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |elapsed| i64::try_from(elapsed.as_millis()).unwrap_or(i64::MAX));
    let millis = loop {
        let last = LAST_MILLIS.load(Ordering::SeqCst);
        let next = wall.max(last.saturating_add(1));
        if LAST_MILLIS
            .compare_exchange(last, next, Ordering::SeqCst, Ordering::SeqCst)
            .is_ok()
        {
            break next;
        }
    };
    format_unix_millis_rfc3339(millis, 0).expect("a zero offset is always formattable")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn now_is_strictly_increasing_within_a_process_and_parses() {
        let stamps: Vec<String> = (0..50).map(|_| now_iso()).collect();
        let instants: Vec<i64> = stamps.iter().map(|s| parse_rfc3339_millis(s).expect(s)).collect();
        assert!(instants.windows(2).all(|pair| pair[0] < pair[1]), "{stamps:?}");
        assert!(stamps.iter().all(|s| s.ends_with('Z')));
    }

    #[test]
    fn windows_are_temporal_inclusive_and_date_bounds_are_utc_midnight() {
        let instant = parse_rfc3339_millis("2026-10-05T00:00:00.250Z").unwrap();
        assert_eq!(
            parse_rfc3339_millis("2026-10-05T02:00:00.250+02:00"),
            Some(instant)
        );
        assert_eq!(
            parse_rfc3339_millis("2026-10-04T19:00:00.250-05:00"),
            Some(instant)
        );
        let exact = ParsedWindow::parse(&Window {
            since: Some("2026-10-05T02:00:00.250+02:00".into()),
            until: Some("2026-10-04T19:00:00.250-05:00".into()),
        })
        .unwrap();
        assert!(exact.contains(instant));
        assert!(!exact.contains(instant - 1));
        assert!(!exact.contains(instant + 1));
        let date = ParsedWindow::parse(&Window {
            since: Some("2026-10-05".into()),
            until: Some("2026-10-05".into()),
        })
        .unwrap();
        assert!(date.contains(instant - 250));
        assert!(!date.contains(instant));
    }

    #[test]
    fn invalid_and_reversed_bounds_name_the_offending_flag() {
        for (since, until, expected) in [
            (Some("2026-02-30"), None, "invalid --since"),
            (None, Some("yesterday"), "invalid --until"),
            (Some("2026-10-05T00:00:00+25:00"), None, "invalid --since"),
            (
                Some("2026-10-05T00:00:00Z"),
                Some("2026-10-05T01:00:00+02:00"),
                "--since must not be after --until",
            ),
        ] {
            let window = Window {
                since: since.map(str::to_owned),
                until: until.map(str::to_owned),
            };
            assert!(ParsedWindow::parse(&window).unwrap_err().contains(expected));
        }
    }
}
