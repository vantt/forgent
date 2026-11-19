//! File, JSON, token and clock primitives of credential renewal. Nothing here returns or prints a token
//! value; failures are fixed codes, and a parser's own message (which quotes its input) is never passed on.

use std::fs;
use std::io::{self, Read};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};

use serde_json::{Map, Value};
use sha2::{Digest, Sha256};

/// A fixed failure code (`missing-file`, `unreadable-json`, ...).
pub type Code = &'static str;

/// The most bytes of a login file an agent's private home may hand back.
pub const MAX_COPY_FILE_BYTES: u64 = 64 * 1024 * 1024;

pub const MINUTE_MS: f64 = 60_000.0;

pub fn now_ms() -> f64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0.0, |d| d.as_millis() as f64)
}

pub fn is_object(value: &Value) -> bool {
    value.is_object()
}

/// The code of a failed read: only a file that is not there is proven empty; a copy that is not a plain,
/// bounded file is unsafe; any other read error may pass.
pub fn read_fail_code(err: &io::Error) -> Code {
    match err.kind() {
        io::ErrorKind::NotFound => "missing-file",
        io::ErrorKind::InvalidInput | io::ErrorKind::InvalidData => "unsafe-file",
        _ => "unreadable-file",
    }
}

fn unsafe_file() -> io::Error {
    io::Error::new(io::ErrorKind::InvalidData, "not a plain bounded file")
}

/// All bytes of a file the agent may have written: never through a link, regular files only, at most
/// `max` bytes. Anything else is `InvalidData` (an unsafe file); absence is `NotFound`.
pub fn read_agent_file(path: &Path, max: u64) -> io::Result<Vec<u8>> {
    let before = fs::symlink_metadata(path)?;
    if before.file_type().is_symlink() || !before.is_file() {
        return Err(unsafe_file());
    }
    let mut file = fs::File::open(path)?;
    let meta = file.metadata()?;
    if !meta.is_file() || meta.len() > max {
        return Err(unsafe_file());
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        // The name must still be the file that was looked at: a link swapped in between is no login.
        if before.dev() != meta.dev() || before.ino() != meta.ino() {
            return Err(unsafe_file());
        }
    }
    let mut bytes = Vec::with_capacity(meta.len() as usize);
    file.by_ref().take(max).read_to_end(&mut bytes)?;
    Ok(bytes)
}

/// A parsed JSON file with its text kept for compare-before-write.
pub struct JsonFile {
    pub raw: String,
    pub doc: Value,
}

pub fn read_json_file(path: &Path, agent: bool) -> Result<JsonFile, Code> {
    let bytes = if agent {
        read_agent_file(path, MAX_COPY_FILE_BYTES)
    } else {
        fs::read(path)
    }
    .map_err(|e| read_fail_code(&e))?;
    let raw = String::from_utf8_lossy(&bytes).into_owned();
    match serde_json::from_str::<Value>(&raw) {
        Ok(doc) => Ok(JsonFile { raw, doc }),
        Err(_) => Err("unreadable-json"),
    }
}

/// Two-space indent when the text was written indented (an object that opens a line break and a member),
/// compact otherwise; a trailing newline is kept as it was.
pub fn indent_of(raw: &str) -> bool {
    let bytes = raw.as_bytes();
    let mut at = 0;
    while let Some(open) = raw[at..].find("{\n") {
        let mut next = at + open + 2;
        let ws_start = next;
        while next < bytes.len() && (bytes[next] as char).is_ascii_whitespace() {
            next += 1;
        }
        if next > ws_start && bytes.get(next) == Some(&b'"') {
            return true;
        }
        at += open + 1;
    }
    false
}

pub fn serialize_json(doc: &Value, raw: &str) -> String {
    let text = if indent_of(raw) {
        serde_json::to_string_pretty(doc)
    } else {
        serde_json::to_string(doc)
    }
    .unwrap_or_default();
    if raw.ends_with('\n') {
        format!("{text}\n")
    } else {
        text
    }
}

/// Replace `file` durably, owner-only.
pub fn write_file_atomic(file: &Path, content: &str) -> io::Result<()> {
    let dir = file.parent().ok_or_else(unsafe_file)?;
    let name = file
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(unsafe_file)?;
    fgos_durable_file::replace_durably_with_mode(dir, name, content.as_bytes(), 0o600)
        .map(|_| ())
        .map_err(|e| io::Error::other(e.to_string()))
}

/// Write a scratch file in place, owner-only (the file keeps its own mode when it exists).
pub fn write_plain(file: &Path, bytes: &[u8]) -> io::Result<()> {
    use std::io::Write;
    let mut options = fs::OpenOptions::new();
    options.write(true).create(true).truncate(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    options.open(file)?.write_all(bytes)
}

/// A new file that must not exist yet, owner-only.
pub fn create_new(file: &Path, bytes: &[u8]) -> io::Result<()> {
    use std::io::Write;
    let mut options = fs::OpenOptions::new();
    options.write(true).create_new(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    options.open(file)?.write_all(bytes)
}

pub fn make_dir(dir: &Path, recursive: bool) -> io::Result<()> {
    let mut builder = fs::DirBuilder::new();
    builder.recursive(recursive);
    #[cfg(unix)]
    {
        use std::os::unix::fs::DirBuilderExt;
        builder.mode(0o700);
    }
    builder.create(dir)
}

pub fn set_mode(file: &Path, mode: u32) -> io::Result<()> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(file, fs::Permissions::from_mode(mode))
    }
    #[cfg(not(unix))]
    {
        let _ = (file, mode);
        Ok(())
    }
}

/// Make a path durable: a file's bytes, or a directory's entries.
pub fn sync_path(path: &Path) -> io::Result<()> {
    if fs::metadata(path)?.is_dir() {
        fgos_durable_file::sync_directory(path)
    } else {
        fs::File::open(path)?.sync_all()
    }
}

pub fn sync_tree(dir: &Path) -> io::Result<()> {
    for entry in fs::read_dir(dir)? {
        sync_path(&entry?.path())?;
    }
    sync_path(dir)
}

pub fn remove_all(path: &Path) {
    let _ = fs::remove_dir_all(path).or_else(|_| fs::remove_file(path));
}

/// Names in a directory, sorted; empty when it cannot be read.
pub fn sorted_names(dir: &Path) -> Vec<String> {
    let mut names: Vec<String> = fs::read_dir(dir)
        .map(|it| {
            it.filter_map(|e| e.ok())
                .map(|e| e.file_name().to_string_lossy().into_owned())
                .collect()
        })
        .unwrap_or_default();
    names.sort();
    names
}

/// Names of the sub-directories of a directory, sorted.
pub fn sub_dirs(dir: &Path) -> Vec<String> {
    let mut names: Vec<String> = fs::read_dir(dir)
        .map(|it| {
            it.filter_map(|e| e.ok())
                .filter(|e| e.file_type().is_ok_and(|t| t.is_dir()))
                .map(|e| e.file_name().to_string_lossy().into_owned())
                .collect()
        })
        .unwrap_or_default();
    names.sort();
    names
}

// ----------------------------------------------------------------------------------------------- random

/// `bytes` random bytes as lowercase hex, from the clock, the process, a counter and the address space.
pub fn random_hex(bytes: usize) -> String {
    static COUNTER: AtomicU64 = AtomicU64::new(0);
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |d| d.as_nanos());
    let marker = 0u8;
    let mut hasher = Sha256::new();
    hasher.update(nanos.to_le_bytes());
    hasher.update(std::process::id().to_le_bytes());
    hasher.update(COUNTER.fetch_add(1, Ordering::SeqCst).to_le_bytes());
    hasher.update((&marker as *const u8 as usize).to_le_bytes());
    hasher.update(format!("{:?}", std::thread::current().id()));
    hex(&hasher.finalize()[..bytes])
}

pub fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

// ----------------------------------------------------------------------------------------------- base64url

const B64: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

pub fn b64url_encode(data: &[u8]) -> String {
    let mut out = String::new();
    for chunk in data.chunks(3) {
        let n = (u32::from(chunk[0]) << 16)
            | (u32::from(*chunk.get(1).unwrap_or(&0)) << 8)
            | u32::from(*chunk.get(2).unwrap_or(&0));
        for i in 0..=chunk.len() {
            out.push(B64[((n >> (18 - 6 * i)) & 63) as usize] as char);
        }
    }
    out
}

/// Lenient, like Node's `base64url`: characters outside the alphabet (and padding) are skipped.
pub fn b64url_decode(text: &str) -> Vec<u8> {
    let mut out = Vec::new();
    let (mut acc, mut bits) = (0u32, 0u32);
    for c in text.bytes() {
        let value = match c {
            b'A'..=b'Z' => c - b'A',
            b'a'..=b'z' => c - b'a' + 26,
            b'0'..=b'9' => c - b'0' + 52,
            b'-' | b'+' => 62,
            b'_' | b'/' => 63,
            _ => continue,
        };
        acc = (acc << 6) | u32::from(value);
        bits += 6;
        if bits >= 8 {
            bits -= 8;
            out.push((acc >> bits) as u8);
            acc &= (1 << bits) - 1;
        }
    }
    out
}

/// A token split into its dot-separated parts with its payload object decoded; `None` for anything else.
pub struct Jwt {
    pub parts: Vec<String>,
    pub payload: Map<String, Value>,
}

pub fn jwt_payload(token: &Value) -> Option<Jwt> {
    let parts: Vec<String> = token.as_str()?.split('.').map(str::to_owned).collect();
    if parts.len() < 2 {
        return None;
    }
    match serde_json::from_slice::<Value>(&b64url_decode(&parts[1])).ok()? {
        Value::Object(payload) => Some(Jwt { parts, payload }),
        _ => None,
    }
}

/// The `exp` claim of a token as milliseconds, when it is a finite number.
pub fn jwt_expiry_ms(token: &Value) -> Option<f64> {
    jwt_payload(token)?
        .payload
        .get("exp")?
        .as_f64()
        .map(|s| s * 1000.0)
}

// ----------------------------------------------------------------------------------------------- dates

/// `Date.parse` of the ISO forms a login file carries (`YYYY-MM-DD`, or a date and time with an optional
/// fraction and a `Z` or `±HH:MM` offset; no offset means UTC); milliseconds, or `None`.
pub fn parse_date_ms(text: &str) -> Option<f64> {
    let (date, time) = match text.split_once(['T', ' ']) {
        Some((d, t)) => (d, Some(t)),
        None => (text, None),
    };
    let mut d = date.splitn(3, '-');
    let (year, month, day): (i64, i64, i64) = (
        d.next()?.parse().ok()?,
        d.next().map_or(Some(1), |m| m.parse().ok())?,
        d.next().map_or(Some(1), |m| m.parse().ok())?,
    );
    if !(1..=12).contains(&month) || !(1..=31).contains(&day) {
        return None;
    }
    let (mut seconds, mut offset_min) = (0f64, 0i64);
    if let Some(t) = time {
        let (clock, off) = match t.find(['Z', 'z', '+', '-']) {
            Some(i) if t[i..].eq_ignore_ascii_case("z") => (&t[..i], 0),
            Some(i) => {
                let sign = if t.as_bytes()[i] == b'-' { -1 } else { 1 };
                let (hh, mm) = t[i + 1..].split_once(':').unwrap_or((&t[i + 1..], "0"));
                (
                    &t[..i],
                    sign * (hh.parse::<i64>().ok()? * 60 + mm.parse::<i64>().ok()?),
                )
            }
            None => (t, 0),
        };
        offset_min = off;
        let mut c = clock.splitn(3, ':');
        let h: f64 = c.next()?.parse().ok()?;
        let m: f64 = c.next().map_or(Some(0.0), |m| m.parse().ok())?;
        let s: f64 = c.next().map_or(Some(0.0), |s| s.parse().ok())?;
        seconds = h * 3600.0 + m * 60.0 + s;
    }
    // Days from civil (proleptic Gregorian).
    let y = if month <= 2 { year - 1 } else { year };
    let era = y.div_euclid(400);
    let yoe = y - era * 400;
    let doy = (153 * (month + if month > 2 { -3 } else { 9 }) + 2) / 5 + day - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    let days = era * 146_097 + doe - 719_468;
    Some(days as f64 * 86_400_000.0 + seconds * 1000.0 - offset_min as f64 * 60_000.0)
}

pub fn path_str(path: &Path) -> String {
    path.to_string_lossy().into_owned()
}

pub fn join(parts: &[&Path]) -> PathBuf {
    parts.iter().collect()
}

/// `new Date(ms).toISOString()`.
pub fn iso_from_ms(ms: f64) -> String {
    let total = ms.floor() as i64;
    let (days, rem) = (total.div_euclid(86_400_000), total.rem_euclid(86_400_000));
    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z.rem_euclid(146_097);
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let day = doy - (153 * mp + 2) / 5 + 1;
    let month = if mp < 10 { mp + 3 } else { mp - 9 };
    let year = yoe + era * 400 + i64::from(month <= 2);
    format!(
        "{year:04}-{month:02}-{day:02}T{:02}:{:02}:{:02}.{:03}Z",
        rem / 3_600_000,
        rem / 60_000 % 60,
        rem / 1000 % 60,
        rem % 1000
    )
}
