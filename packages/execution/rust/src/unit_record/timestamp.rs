//! The timestamps unit records carry, read as epoch milliseconds. Records store ISO 8601 text
//! (`YYYY-MM-DDTHH:MM:SS[.fff](Z|±HH:MM)`, or a bare date); a value in any other spelling is not a timestamp
//! here, so a summary treats it as absent rather than guessing.

fn digits(text: &str, len: usize) -> Option<i64> {
    (text.len() == len && text.bytes().all(|b| b.is_ascii_digit()))
        .then(|| text.parse().ok())
        .flatten()
}

fn days_from_civil(year: i64, month: i64, day: i64) -> i64 {
    let y = if month <= 2 { year - 1 } else { year };
    let era = y.div_euclid(400);
    let yoe = y - era * 400;
    let doy = (153 * (month + if month > 2 { -3 } else { 9 }) + 2) / 5 + day - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    era * 146_097 + doe - 719_468
}

/// Epoch milliseconds of an ISO 8601 timestamp, or `None` when the text is not one. The spellings are the ones
/// the JavaScript runtime that wrote the records accepts: a `T`, `t` or space between date and time, `Z` or `z`,
/// an offset as `+HH:MM` or `+HHMM`, any number of fraction digits, a day up to 31 whatever the month (a day past
/// the month's end rolls into the next), and the hour 24 only as exactly midnight.
pub fn parse_timestamp_ms(text: &str) -> Option<i64> {
    let (date, time) = match text.find(['T', 't', ' ']) {
        Some(at) => (&text[..at], Some(&text[at + 1..])),
        None => (text, None),
    };
    let mut parts = date.split('-');
    let year = digits(parts.next()?, 4)?;
    let month = digits(parts.next()?, 2)?;
    let day = digits(parts.next()?, 2)?;
    if parts.next().is_some() || !(1..=12).contains(&month) || !(1..=31).contains(&day) {
        return None;
    }
    let mut millis = days_from_civil(year, month, day) * 86_400_000;
    let Some(time) = time else {
        return Some(millis);
    };
    let (clock, offset_minutes) = if let Some(clock) = time.strip_suffix(['Z', 'z']) {
        (clock, 0)
    } else {
        let at = time.rfind(['+', '-'])?;
        let (clock, zone) = time.split_at(at);
        let sign = if zone.starts_with('-') { -1 } else { 1 };
        let zone = &zone[1..];
        let (h, m) = match zone.split_once(':') {
            Some((h, m)) => (digits(h, 2)?, digits(m, 2)?),
            None => (digits(zone.get(..2)?, 2)?, digits(zone.get(2..)?, 2)?),
        };
        if h > 23 || m > 59 {
            return None;
        }
        (clock, sign * (h * 60 + m))
    };
    let mut fields = clock.split(':');
    let hour = digits(fields.next()?, 2)?;
    let minute = digits(fields.next()?, 2)?;
    let seconds = fields.next().unwrap_or("00");
    if fields.next().is_some() || hour > 24 || minute > 59 {
        return None;
    }
    let (sec, frac) = match seconds.split_once('.') {
        Some((s, f)) if !f.is_empty() && f.bytes().all(|b| b.is_ascii_digit()) => {
            (digits(s, 2)?, f)
        }
        Some(_) => return None,
        None => (digits(seconds, 2)?, ""),
    };
    if sec > 59 {
        return None;
    }
    let ms = format!("{frac:0<3}")[..3].parse::<i64>().ok()?;
    if hour == 24 && (minute != 0 || sec != 0 || ms != 0) {
        return None;
    }
    millis += ((hour * 60 + minute) * 60 + sec) * 1000 + ms - offset_minutes * 60_000;
    Some(millis)
}
