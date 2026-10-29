//! Text primitives every id minted here shares: random bytes and slugs.

use std::io;

/// `N` random bytes from the kernel.
#[cfg(target_os = "linux")]
pub fn random_bytes<const N: usize>() -> io::Result<[u8; N]> {
    use std::io::Read;
    let mut bytes = [0u8; N];
    std::fs::File::open("/dev/urandom")?.read_exact(&mut bytes)?;
    Ok(bytes)
}

#[cfg(not(target_os = "linux"))]
pub fn random_bytes<const N: usize>() -> io::Result<[u8; N]> {
    Err(io::Error::new(
        io::ErrorKind::Unsupported,
        "native random identity driver unavailable",
    ))
}

/// 128 random bits as 32 lowercase hex characters, from the kernel.
pub fn random_hex128() -> io::Result<String> {
    Ok(random_bytes::<16>()?.iter().map(|b| format!("{b:02x}")).collect())
}

/// Lowercase ASCII letters and digits of `input`, every other run of
/// characters collapsed to one hyphen, no leading or trailing hyphen. May be
/// empty; the caller decides what an empty slug means.
pub fn slug(input: &str) -> String {
    let mut slug = String::new();
    for c in input.chars() {
        if c.is_ascii_alphanumeric() {
            slug.push(c.to_ascii_lowercase());
        } else if !slug.is_empty() && !slug.ends_with('-') {
            slug.push('-');
        }
    }
    slug.truncate(slug.trim_end_matches('-').len());
    slug
}

/// Lowercase RFC 4648 base32 (no padding) of the first `chars` characters
/// worth of `bytes`; `chars` must not exceed `bytes.len() * 8 / 5`.
pub fn base32_prefix(bytes: &[u8], chars: usize) -> String {
    const ALPHABET: &[u8; 32] = b"abcdefghijklmnopqrstuvwxyz234567";
    assert!(chars <= bytes.len() * 8 / 5, "not enough bytes for {chars} characters");
    (0..chars)
        .map(|index| {
            let bit = index * 5;
            let (byte, shift) = (bit / 8, bit % 8);
            let window = (u16::from(bytes[byte]) << 8)
                | bytes.get(byte + 1).copied().map_or(0, u16::from);
            ALPHABET[((window >> (11 - shift)) & 31) as usize] as char
        })
        .collect()
}

/// `YYYY-MM-DDTHH:MM:SS.mmmZ` for the current wall clock.
pub fn iso_utc_now() -> String {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();
    iso_utc(now.as_secs(), now.subsec_millis())
}

/// Civil date from days since 1970-01-01 (Howard Hinnant's algorithm).
pub fn iso_utc(secs: u64, millis: u32) -> String {
    let days = (secs / 86_400) as i64;
    let rem = secs % 86_400;
    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z.rem_euclid(146_097);
    let yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let day = doy - (153 * mp + 2) / 5 + 1;
    let month = if mp < 10 { mp + 3 } else { mp - 9 };
    let year = yoe + era * 400 + i64::from(month <= 2);
    format!(
        "{year:04}-{month:02}-{day:02}T{:02}:{:02}:{:02}.{millis:03}Z",
        rem / 3_600,
        rem % 3_600 / 60,
        rem % 60
    )
}

/// Seconds since the epoch of an `iso_utc`-shaped timestamp
/// (`YYYY-MM-DDTHH:MM:SS[.fff]Z`); `None` for any other text.
pub fn iso_utc_secs(text: &str) -> Option<u64> {
    let (date, time) = text.strip_suffix('Z')?.split_once('T')?;
    let mut date = date.split('-');
    let (year, month, day): (i64, i64, i64) =
        (date.next()?.parse().ok()?, date.next()?.parse().ok()?, date.next()?.parse().ok()?);
    if date.next().is_some() || !(1..=12).contains(&month) || !(1..=31).contains(&day) {
        return None;
    }
    let time = time.split('.').next()?;
    let mut time = time.split(':');
    let (hour, minute, second): (u64, u64, u64) =
        (time.next()?.parse().ok()?, time.next()?.parse().ok()?, time.next()?.parse().ok()?);
    if time.next().is_some() || hour > 23 || minute > 59 || second > 60 {
        return None;
    }
    // Days since 1970-01-01 from a civil date (Howard Hinnant's algorithm).
    let y = year - i64::from(month <= 2);
    let era = y.div_euclid(400);
    let yoe = y.rem_euclid(400);
    let doy = (153 * (if month > 2 { month - 3 } else { month + 9 }) + 2) / 5 + day - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    let days = u64::try_from(era * 146_097 + doe - 719_468).ok()?;
    Some(days * 86_400 + hour * 3_600 + minute * 60 + second)
}

#[cfg(test)]
mod iso_tests {
    use super::{iso_utc, iso_utc_secs};

    #[test]
    fn a_timestamp_the_formatter_wrote_parses_back_and_other_text_does_not() {
        for secs in [0, 86_399, 951_782_400, 1_788_000_123, 4_102_444_800] {
            assert_eq!(iso_utc_secs(&iso_utc(secs, 456)), Some(secs));
        }
        for bad in ["", "2026-10-29", "2026-13-01T00:00:00Z", "2026-10-29T25:00:00Z", "2026-10-29T00:00:00", "x"] {
            assert_eq!(iso_utc_secs(bad), None, "{bad}");
        }
    }
}
