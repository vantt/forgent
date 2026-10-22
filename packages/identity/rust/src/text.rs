//! Text primitives every id minted here shares: random bytes and slugs.

use std::io;

/// 128 random bits as 32 lowercase hex characters, from the kernel.
#[cfg(target_os = "linux")]
pub fn random_hex128() -> io::Result<String> {
    use std::io::Read;
    let mut bytes = [0u8; 16];
    std::fs::File::open("/dev/urandom")?.read_exact(&mut bytes)?;
    Ok(bytes.iter().map(|b| format!("{b:02x}")).collect())
}

#[cfg(not(target_os = "linux"))]
pub fn random_hex128() -> io::Result<String> {
    Err(io::Error::new(
        io::ErrorKind::Unsupported,
        "native random identity driver unavailable",
    ))
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
