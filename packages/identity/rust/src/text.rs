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
