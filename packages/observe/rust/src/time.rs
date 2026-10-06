//! Temporal comparison for discussion summaries and their read-side windows.

use crate::contract::Window;

#[derive(Debug, Clone, Copy, Default)]
pub struct ParsedWindow {
    since: Option<i64>,
    until: Option<i64>,
}

impl ParsedWindow {
    pub fn parse(window: &Window) -> Result<Self, String> {
        let bound = |value: &Option<String>, name: &str| -> Result<Option<i64>, String> {
            value.as_ref().map(|value| {
                let parsed = if value.len() == 10 { midnight_millis(value) } else { parse_timestamp_millis(value) };
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

fn number(value: &str) -> Option<i64> {
    (!value.is_empty() && value.bytes().all(|byte| byte.is_ascii_digit()))
        .then(|| value.parse().ok()).flatten()
}

// RFC3339 calendar conversion uses the civil-date algorithm already used by
// scorecard; milliseconds and offsets preserve temporal window boundaries.
fn midnight_millis(date: &str) -> Option<i64> {
    let bytes = date.as_bytes();
    if bytes.len() != 10 || bytes[4] != b'-' || bytes[7] != b'-' { return None; }
    let year = number(date.get(0..4)?)?;
    let month = number(date.get(5..7)?)?;
    let day = number(date.get(8..10)?)?;
    let leap = year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
    let month_days = [31, if leap { 29 } else { 28 }, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if !(1..=12).contains(&month) || !(1..=month_days[(month - 1) as usize]).contains(&day) { return None; }
    let y = year - i64::from(month <= 2);
    let m = if month <= 2 { month + 9 } else { month - 3 };
    let era = y.div_euclid(400);
    let yoe = y - era * 400;
    let doy = (153 * m + 2) / 5 + day - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    Some((era * 146097 + doe - 719468) * 86400 * 1000)
}

pub fn parse_timestamp_millis(timestamp: &str) -> Option<i64> {
    let bytes = timestamp.as_bytes();
    if bytes.len() < 20 || !matches!(bytes[10], b'T' | b't') || bytes[13] != b':' || bytes[16] != b':' { return None; }
    let midnight = midnight_millis(timestamp.get(..10)?)?;
    let hour = number(timestamp.get(11..13)?)?;
    let minute = number(timestamp.get(14..16)?)?;
    let second = number(timestamp.get(17..19)?)?;
    if hour > 23 || minute > 59 || second > 59 { return None; }
    let mut position = 19;
    let mut fraction = 0;
    if bytes.get(position) == Some(&b'.') {
        position += 1;
        let start = position;
        while bytes.get(position).is_some_and(u8::is_ascii_digit) {
            if position - start < 3 {
                fraction += (bytes[position] - b'0') as i64 * [100, 10, 1][position - start];
            }
            position += 1;
        }
        if start == position { return None; }
    }
    let offset = match bytes.get(position)? {
        b'Z' | b'z' if position + 1 == bytes.len() => 0,
        sign @ (b'+' | b'-') if position + 6 == bytes.len() && bytes[position + 3] == b':' => {
            let hours = number(timestamp.get(position + 1..position + 3)?)?;
            let minutes = number(timestamp.get(position + 4..position + 6)?)?;
            if hours > 23 || minutes > 59 { return None; }
            (hours * 3600 + minutes * 60) * if *sign == b'+' { 1 } else { -1 }
        }
        _ => return None,
    };
    Some(midnight + (hour * 3600 + minute * 60 + second - offset) * 1000 + fraction)
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
