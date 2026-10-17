//! One-time publication of an attempt-layout file: write a temp file in the
//! same directory, fsync it, `link(2)` it to its final name. `EEXIST` means
//! another writer already published; the first copy stays.

use std::fs::{self, File, OpenOptions};
use std::io::{self, Write};
#[cfg(unix)]
use std::os::unix::fs::OpenOptionsExt;
use std::path::Path;

/// Who won the link.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Published {
    /// This call created `name`.
    Created,
    /// `name` already existed; its content is untouched.
    AlreadyPublished,
}

/// Publish `bytes` as `<dir>/<name>` exactly once.
pub fn publish_once(dir: &Path, name: &str, bytes: &[u8]) -> io::Result<Published> {
    // The pid alone repeats (a gate is always pid 1 in its namespace), so the
    // name carries the clock too; the file is created exclusively below.
    let nanos = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_nanos();
    let temp = dir.join(format!(".{name}.tmp.{}.{nanos}", std::process::id()));
    let result = write_and_link(dir, name, &temp, bytes);
    let _ = fs::remove_file(&temp);
    result
}

fn write_and_link(dir: &Path, name: &str, temp: &Path, bytes: &[u8]) -> io::Result<Published> {
    // Exclusive and never through a symlink: a pre-planted path must fail, not be written.
    let mut options = OpenOptions::new();
    options.write(true).create_new(true);
    #[cfg(unix)]
    options.custom_flags(libc::O_NOFOLLOW).mode(0o600);
    let mut file = options.open(temp)?;
    file.write_all(bytes)?;
    file.sync_all()?;
    drop(file);
    let outcome = match fs::hard_link(temp, dir.join(name)) {
        Ok(()) => Published::Created,
        Err(err) if err.kind() == io::ErrorKind::AlreadyExists => Published::AlreadyPublished,
        Err(err) => return Err(err),
    };
    // Make the new directory entry durable; the link already happened, so a
    // failure here must not report the publish as failed.
    if let Ok(handle) = File::open(dir) {
        let _ = handle.sync_all();
    }
    Ok(outcome)
}

/// `YYYY-MM-DDTHH:MM:SS.mmmZ` for the current wall clock.
pub fn iso_utc_now() -> String {
    let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default();
    iso_utc(now.as_secs(), now.subsec_millis())
}

/// Civil date from days since 1970-01-01 (Howard Hinnant's algorithm).
fn iso_utc(secs: u64, millis: u32) -> String {
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
    format!("{year:04}-{month:02}-{day:02}T{:02}:{:02}:{:02}.{millis:03}Z", rem / 3_600, rem % 3_600 / 60, rem % 60)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn civil_date_matches_known_instants() {
        assert_eq!(iso_utc(0, 0), "1970-01-01T00:00:00.000Z");
        assert_eq!(iso_utc(1_791_940_354, 7), "2026-10-14T01:12:34.007Z");
        assert_eq!(iso_utc(951_782_400, 0), "2000-02-29T00:00:00.000Z");
    }
}
