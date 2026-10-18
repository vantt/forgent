//! One-time publication of an attempt-layout file: write a temp file in the
//! same directory, fsync it, `link(2)` it to its final name. `EEXIST` means
//! another writer already published; the first copy stays.

use std::io;
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
    publication_result(fgos_durable_file::install_once(dir, name, bytes))
}

fn publication_result(result: Result<fgos_durable_file::Installed, fgos_durable_file::InstallError>) -> io::Result<Published> {
    use fgos_durable_file::Installed;
    let installed = match result {
        Ok(installed) => installed,
        Err(error) => {
            // Historically cleanup and directory-sync failures after the link
            // did not turn a completed publication into an error.
            if let Some(temp) = error.temporary {
                let _ = std::fs::remove_file(temp);
            }
            match error.installed {
                Some(installed) => installed,
                None => return Err(error.source),
            }
        }
    };
    Ok(match installed {
        Installed::Created => Published::Created,
        Installed::AlreadyExists => Published::AlreadyPublished,
    })
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

#[cfg(test)]
mod install_mapping_tests {
    use super::*;
    struct FailAt(&'static str);
    impl fgos_durable_file::FileSystem for FailAt {
        fn checkpoint(&self, step: &'static str) -> io::Result<()> {
            if step == self.0 {
                Err(io::Error::other("boundary failure"))
            } else {
                Ok(())
            }
        }
    }
    #[test]
    fn errors_before_install_propagate_and_errors_after_install_keep_the_outcome() {
        let dir = std::env::temp_dir().join(format!(
            "fgos-run-supervisor-mapping-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::create_dir_all(&dir).unwrap();
        for step in [
            "temp-created",
            "bytes-written",
            "file-fsync",
            "name-installed",
            "temp-removed",
            "parent-fsync",
        ] {
            let name = step;
            let result = publication_result(fgos_durable_file::install_with(
                &dir,
                name,
                b"original",
                &FailAt(step),
            ));
            if matches!(step, "temp-created" | "bytes-written" | "file-fsync") {
                assert_eq!(result.unwrap_err().kind(), io::ErrorKind::Other);
                assert!(!dir.join(name).exists());
            } else {
                assert_eq!(result.unwrap(), Published::Created);
                assert_eq!(std::fs::read(dir.join(name)).unwrap(), b"original");
                assert_eq!(
                    publication_result(fgos_durable_file::install_with(
                        &dir,
                        name,
                        b"changed",
                        &FailAt(step)
                    ))
                    .unwrap(),
                    Published::AlreadyPublished
                );
            }
        }
        std::fs::remove_dir_all(dir).unwrap();
    }
}
