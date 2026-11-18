//! Instants, relative windows and buckets. Everything is UTC milliseconds; the clock is always passed in.

use super::error::{invalid, QueryError};
use super::model::Bucket;
use fgos_host_runtime::civil_time::{
    format_unix_millis_rfc3339, parse_date_midnight_millis, parse_rfc3339_millis,
};

const DAY_MS: i64 = 86_400_000;

/// An absolute RFC 3339 stamp, a `YYYY-MM-DD` date (UTC midnight), or a relative `-30m` (`s`, `m`, `h`, `d`, `w`).
pub(super) fn parse_instant(value: &str, now: i64) -> Result<i64, QueryError> {
    if let Some(rest) = value.strip_prefix('-') {
        let back = duration_millis(rest, value)?;
        return now
            .checked_sub(back)
            .ok_or_else(|| invalid("time", value, "reaches before the earliest instant"));
    }
    parse_absolute(value)
}

/// An absolute RFC 3339 stamp or a `YYYY-MM-DD` date, the only forms a record may carry.
pub(super) fn parse_absolute(value: &str) -> Result<i64, QueryError> {
    let parsed = if value.len() == 10 {
        parse_date_midnight_millis(value)
    } else {
        parse_rfc3339_millis(value)
    };
    parsed.ok_or_else(|| {
        invalid(
            "time",
            value,
            "expected RFC 3339 or YYYY-MM-DD, or a relative -30m where a window allows it",
        )
    })
}

/// A span such as `90s`, `30m`, `2h`, `1d`, `1w`, in milliseconds. The amount is unsigned digits.
pub(super) fn parse_duration_millis(value: &str) -> Result<i64, QueryError> {
    duration_millis(value, value)
}

fn duration_millis(text: &str, whole: &str) -> Result<i64, QueryError> {
    let bad_form = || {
        invalid(
            "duration",
            whole,
            "expected unsigned digits and a unit s, m, h, d or w",
        )
    };
    let (split, _) = text.char_indices().last().ok_or_else(bad_form)?;
    let (digits, unit) = text.split_at(split);
    if digits.is_empty() || !digits.bytes().all(|b| b.is_ascii_digit()) {
        return Err(bad_form());
    }
    let factor: i64 = match unit {
        "s" => 1,
        "m" => 60,
        "h" => 3600,
        "d" => 86_400,
        "w" => 604_800,
        _ => return Err(invalid("duration", whole, "unit must be s, m, h, d or w")),
    };
    let too_large = || invalid("duration", whole, "too large");
    digits
        .parse::<i64>()
        .map_err(|_| too_large())?
        .checked_mul(factor)
        .and_then(|secs| secs.checked_mul(1000))
        .ok_or_else(too_large)
}

/// The start of the bucket holding `millis`. Weeks start on Monday 00:00 UTC.
pub fn bucket_start(millis: i64, bucket: Bucket) -> i64 {
    match bucket {
        Bucket::Hour => millis.div_euclid(3_600_000) * 3_600_000,
        Bucket::Day => millis.div_euclid(DAY_MS) * DAY_MS,
        Bucket::Week => {
            let day = millis.div_euclid(DAY_MS);
            (day - (day + 3).rem_euclid(7)) * DAY_MS
        }
    }
}

pub(super) fn format_instant(millis: i64) -> String {
    format_unix_millis_rfc3339(millis, 0).unwrap_or_else(|| millis.to_string())
}
