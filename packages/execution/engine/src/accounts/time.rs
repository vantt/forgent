//! Epoch milliseconds and the ISO-8601 text the lease state keeps: `Date#toISOString` and `Date.parse` of the
//! UTC forms the state writes, so a record written by either tier reads in the other.

const MS_DAY: i64 = 86_400_000;

fn civil_from_days(days: i64) -> (i64, i64, i64) {
    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z.rem_euclid(146_097);
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let day = doy - (153 * mp + 2) / 5 + 1;
    let month = if mp < 10 { mp + 3 } else { mp - 9 };
    (yoe + era * 400 + i64::from(month <= 2), month, day)
}

fn days_from_civil(year: i64, month: i64, day: i64) -> i64 {
    let y = year - i64::from(month <= 2);
    let era = y.div_euclid(400);
    let yoe = y.rem_euclid(400);
    let doy = (153 * (if month > 2 { month - 3 } else { month + 9 }) + 2) / 5 + day - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    era * 146_097 + doe - 719_468
}

/// `new Date(ms).toISOString()`: `YYYY-MM-DDTHH:MM:SS.mmmZ`.
pub fn iso_from_ms(ms: i64) -> String {
    let days = ms.div_euclid(MS_DAY);
    let rest = ms.rem_euclid(MS_DAY);
    let (year, month, day) = civil_from_days(days);
    format!(
        "{year:04}-{month:02}-{day:02}T{:02}:{:02}:{:02}.{:03}Z",
        rest / 3_600_000,
        rest / 60_000 % 60,
        rest / 1000 % 60,
        rest % 1000
    )
}

/// `Date.parse` of an ISO-8601 date-time with a `Z` or `±hh:mm` zone (a missing zone reads as UTC); `None` where
/// `Date.parse` gives NaN.
pub fn ms_from_iso(text: &str) -> Option<i64> {
    let text = text.trim();
    let (date, time) = text.split_once('T')?;
    let mut parts = date.split('-');
    let (year, month, day) = (
        parts.next()?.parse::<i64>().ok()?,
        parts.next()?.parse::<i64>().ok()?,
        parts.next()?.parse::<i64>().ok()?,
    );
    if parts.next().is_some() || !(1..=12).contains(&month) || !(1..=31).contains(&day) {
        return None;
    }
    let (clock, offset_min) = if let Some(clock) = time.strip_suffix('Z') {
        (clock, 0)
    } else if let Some(at) = time.rfind(['+', '-']).filter(|at| *at > 0) {
        let (sign, zone) = (
            if time.as_bytes()[at] == b'-' { -1 } else { 1 },
            &time[at + 1..],
        );
        let (hours, minutes) = zone.split_once(':')?;
        (
            &time[..at],
            sign * (hours.parse::<i64>().ok()? * 60 + minutes.parse::<i64>().ok()?),
        )
    } else {
        (time, 0)
    };
    let mut fields = clock.split(':');
    let hour = fields.next()?.parse::<i64>().ok()?;
    let minute = fields.next()?.parse::<i64>().ok()?;
    let seconds = fields.next().unwrap_or("0");
    let (whole, fraction) = seconds.split_once('.').unwrap_or((seconds, ""));
    let second = whole.parse::<i64>().ok()?;
    let millis = if fraction.is_empty() {
        0
    } else {
        format!("{:0<3}", &fraction[..fraction.len().min(3)])
            .parse::<i64>()
            .ok()?
    };
    if hour > 24 || minute > 59 || second > 59 {
        return None;
    }
    Some(
        days_from_civil(year, month, day) * MS_DAY
            + ((hour * 60 + minute) * 60 + second) * 1000
            + millis
            - offset_min * 60_000,
    )
}
