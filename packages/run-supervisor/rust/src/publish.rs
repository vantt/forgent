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
