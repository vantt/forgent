//! Pure Gregorian civil-date conversion and RFC3339 helpers shared by native components.

use std::time::{SystemTime, UNIX_EPOCH};

const DAYS_PER_ERA: i64 = 146_097;
const EPOCH_ADJUSTMENT_DAYS: i64 = 719_468;

/// Converts days since the Unix epoch to a proleptic-Gregorian `(year, month, day)`.
pub fn civil_from_days(days_since_epoch: i64) -> (i64, u32, u32) {
    let z = days_since_epoch + EPOCH_ADJUSTMENT_DAYS;
    let era = if z >= 0 { z } else { z - (DAYS_PER_ERA - 1) } / DAYS_PER_ERA;
    let day_of_era = z - era * DAYS_PER_ERA;
    let year_of_era =
        (day_of_era - day_of_era / 1_460 + day_of_era / 36_524 - day_of_era / 146_096) / 365;
    let mut year = year_of_era + era * 400;
    let day_of_year = day_of_era - (365 * year_of_era + year_of_era / 4 - year_of_era / 100);
    let month_prime = (5 * day_of_year + 2) / 153;
    let day = day_of_year - (153 * month_prime + 2) / 5 + 1;
    let month = if month_prime < 10 {
        month_prime + 3
    } else {
        month_prime - 9
    };
    year += i64::from(month <= 2);
    (year, month as u32, day as u32)
}

/// Converts a valid proleptic-Gregorian civil date to days since the Unix epoch.
pub fn days_from_civil(year: i64, month: u32, day: u32) -> Option<i64> {
    let month_days = [
        31,
        if is_leap_year(year) { 29 } else { 28 },
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31,
    ];
    if !(1..=12).contains(&month) || !(1..=month_days[(month - 1) as usize]).contains(&day) {
        return None;
    }
    Some(days_from_civil_unchecked(
        year,
        i64::from(month),
        i64::from(day),
    ))
}

fn is_leap_year(year: i64) -> bool {
    year % 4 == 0 && (year % 100 != 0 || year % 400 == 0)
}

fn days_from_civil_unchecked(year: i64, month: i64, day: i64) -> i64 {
    let adjusted_year = year - i64::from(month <= 2);
    let adjusted_month = if month <= 2 { month + 9 } else { month - 3 };
    let era = if adjusted_year >= 0 {
        adjusted_year
    } else {
        adjusted_year - 399
    } / 400;
    let year_of_era = adjusted_year - era * 400;
    let day_of_year = (153 * adjusted_month + 2) / 5 + day - 1;
    let day_of_era = year_of_era * 365 + year_of_era / 4 - year_of_era / 100 + day_of_year;
    era * DAYS_PER_ERA + day_of_era - EPOCH_ADJUSTMENT_DAYS
}

/// Formats a `SystemTime` exactly as the native components historically did.
/// Times before the Unix epoch fall back to the epoch.
pub fn format_system_time_utc(time: SystemTime) -> String {
    let duration = time.duration_since(UNIX_EPOCH).unwrap_or_default();
    let total_seconds = duration.as_secs();
    let seconds_of_day = total_seconds % 86_400;
    let (year, month, day) = civil_from_days((total_seconds / 86_400) as i64);
    let hour = seconds_of_day / 3_600;
    let minute = seconds_of_day % 3_600 / 60;
    let second = seconds_of_day % 60;
    let millis = duration.subsec_millis();
    format!("{year:04}-{month:02}-{day:02}T{hour:02}:{minute:02}:{second:02}.{millis:03}Z")
}

/// Formats Unix milliseconds in the supplied numeric UTC offset.
pub fn format_unix_millis_rfc3339(unix_millis: i64, offset_seconds: i32) -> Option<String> {
    if offset_seconds % 60 != 0 || offset_seconds.unsigned_abs() > 23 * 3_600 + 59 * 60 {
        return None;
    }
    let local_millis = unix_millis.checked_add(i64::from(offset_seconds) * 1_000)?;
    let total_seconds = local_millis.div_euclid(1_000);
    let millis = local_millis.rem_euclid(1_000);
    let days = total_seconds.div_euclid(86_400);
    let seconds_of_day = total_seconds.rem_euclid(86_400);
    let (year, month, day) = civil_from_days(days);
    let hour = seconds_of_day / 3_600;
    let minute = seconds_of_day % 3_600 / 60;
    let second = seconds_of_day % 60;
    let offset = if offset_seconds == 0 {
        "Z".to_owned()
    } else {
        let sign = if offset_seconds < 0 { '-' } else { '+' };
        let absolute = offset_seconds.unsigned_abs();
        format!("{sign}{:02}:{:02}", absolute / 3_600, absolute % 3_600 / 60)
    };
    Some(format!(
        "{year:04}-{month:02}-{day:02}T{hour:02}:{minute:02}:{second:02}.{millis:03}{offset}"
    ))
}

/// Preserves the legacy Observe scorecard/transcript parser semantics: only the
/// first 19 bytes are parsed and suffix offsets are intentionally ignored.
pub fn parse_iso_prefix_secs(value: &str) -> Option<i64> {
    if value.len() < 19 {
        return None;
    }
    let year = value.get(0..4)?.parse().ok()?;
    let month = value.get(5..7)?.parse().ok()?;
    let day = value.get(8..10)?.parse().ok()?;
    let hour: i64 = value.get(11..13)?.parse().ok()?;
    let minute: i64 = value.get(14..16)?.parse().ok()?;
    let second: i64 = value.get(17..19)?.parse().ok()?;
    let days = days_from_civil_unchecked(year, month, day);
    Some(days * 86_400 + hour * 3_600 + minute * 60 + second)
}

/// Parses a calendar date as UTC midnight in Unix milliseconds.
pub fn parse_date_midnight_millis(date: &str) -> Option<i64> {
    let bytes = date.as_bytes();
    if bytes.len() != 10 || bytes[4] != b'-' || bytes[7] != b'-' {
        return None;
    }
    let year = number(date.get(0..4)?)?;
    let month = u32::try_from(number(date.get(5..7)?)?).ok()?;
    let day = u32::try_from(number(date.get(8..10)?)?).ok()?;
    days_from_civil(year, month, day)?.checked_mul(86_400_000)
}

/// Parses an RFC3339 instant with a `Z` or numeric offset into Unix milliseconds.
pub fn parse_rfc3339_millis(timestamp: &str) -> Option<i64> {
    let bytes = timestamp.as_bytes();
    if bytes.len() < 20
        || !matches!(bytes[10], b'T' | b't')
        || bytes[13] != b':'
        || bytes[16] != b':'
    {
        return None;
    }
    let midnight = parse_date_midnight_millis(timestamp.get(..10)?)?;
    let hour = number(timestamp.get(11..13)?)?;
    let minute = number(timestamp.get(14..16)?)?;
    let second = number(timestamp.get(17..19)?)?;
    if hour > 23 || minute > 59 || second > 59 {
        return None;
    }
    let mut position = 19;
    let mut fraction = 0;
    if bytes.get(position) == Some(&b'.') {
        position += 1;
        let start = position;
        while bytes.get(position).is_some_and(u8::is_ascii_digit) {
            if position - start < 3 {
                fraction += i64::from(bytes[position] - b'0') * [100, 10, 1][position - start];
            }
            position += 1;
        }
        if start == position {
            return None;
        }
    }
    let offset = match bytes.get(position)? {
        b'Z' | b'z' if position + 1 == bytes.len() => 0,
        sign @ (b'+' | b'-') if position + 6 == bytes.len() && bytes[position + 3] == b':' => {
            let hours = number(timestamp.get(position + 1..position + 3)?)?;
            let minutes = number(timestamp.get(position + 4..position + 6)?)?;
            if hours > 23 || minutes > 59 {
                return None;
            }
            (hours * 3_600 + minutes * 60) * if *sign == b'+' { 1 } else { -1 }
        }
        _ => return None,
    };
    Some(midnight + (hour * 3_600 + minute * 60 + second - offset) * 1_000 + fraction)
}

fn number(value: &str) -> Option<i64> {
    (!value.is_empty() && value.bytes().all(|byte| byte.is_ascii_digit()))
        .then(|| value.parse().ok())
        .flatten()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[test]
    fn civil_date_table_preserves_native_timestamp_bytes() {
        let cases: &[(u64, &str)] = &[
            (0, "1970-01-01T00:00:00.000Z"),
            (1_772_236_800, "2026-02-28T00:00:00.000Z"),
            (1_835_395_200, "2028-02-29T00:00:00.000Z"),
            (4_107_542_400, "2100-03-01T00:00:00.000Z"),
            (951_782_400, "2000-02-29T00:00:00.000Z"),
            (1_709_210_096, "2024-02-29T12:34:56.000Z"),
        ];
        for (epoch_seconds, expected) in cases {
            assert_eq!(
                format_system_time_utc(UNIX_EPOCH + Duration::from_secs(*epoch_seconds)),
                *expected
            );
        }
    }

    #[test]
    fn system_time_formatter_preserves_milliseconds() {
        assert_eq!(
            format_system_time_utc(UNIX_EPOCH + Duration::from_millis(1_234)),
            "1970-01-01T00:00:01.234Z"
        );
    }

    #[test]
    fn civil_conversion_round_trips_before_and_after_epoch() {
        for (year, month, day) in [(1969, 12, 31), (1970, 1, 1), (2000, 2, 29), (2100, 3, 1)] {
            let days = days_from_civil(year, month, day).unwrap();
            assert_eq!(civil_from_days(days), (year, month, day));
        }
        assert_eq!(days_from_civil(2026, 2, 30), None);
    }

    #[test]
    fn rfc3339_offsets_identify_the_same_instant() {
        let instant = parse_rfc3339_millis("2026-10-05T00:00:00.250Z").unwrap();
        assert_eq!(
            parse_rfc3339_millis("2026-10-05T02:00:00.250+02:00"),
            Some(instant)
        );
        assert_eq!(
            parse_rfc3339_millis("2026-10-04T19:00:00.250-05:00"),
            Some(instant)
        );
        assert_eq!(
            format_unix_millis_rfc3339(instant, 2 * 3_600).as_deref(),
            Some("2026-10-05T02:00:00.250+02:00")
        );
    }

    #[test]
    fn formatter_rejects_second_precision_offsets() {
        assert_eq!(format_unix_millis_rfc3339(0, 1), None);
    }

    #[test]
    fn prefix_parser_keeps_legacy_offset_ignoring_behavior() {
        assert_eq!(
            parse_iso_prefix_secs("2026-10-05T02:00:00+02:00"),
            parse_iso_prefix_secs("2026-10-05T02:00:00Z")
        );
    }
}
