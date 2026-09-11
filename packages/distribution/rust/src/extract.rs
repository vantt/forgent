//! Archive extraction utilities.

use flate2::read::GzDecoder;
use std::fs::File;
use std::path::{Path, PathBuf};
use tar::{Archive, EntryType};

#[derive(Debug, thiserror::Error)]
pub enum ExtractError {
    #[error("io error during archive extraction: {0}")]
    Io(#[from] std::io::Error),
    #[error("archive format error: {0}")]
    Archive(String),
    #[error("archive entry refused: {0}")]
    EntryRefused(String),
}

/// Rejects any entry whose normalized path is empty, absolute (Unix `/` or a
/// Windows drive-letter prefix), or contains a `..` segment, and any entry
/// that is not a plain file or directory (symlink, hard link, device, fifo,
/// etc.) -- matches the same confinement discipline the release manifest's
/// own `files[]` list is held to. Backslashes are normalized to `/` before
/// this check the same way `canonical::normalize_release_path` normalizes
/// manifest paths: `Path::components()` alone does not split on `\` on a
/// Unix host, so a raw `..\..\outside` or `C:\outside\pwn` entry would
/// otherwise pass through as one opaque, harmless-looking filename.
fn validate_entry(path: &Path, entry_type: EntryType) -> Result<(), ExtractError> {
    let raw = path.to_string_lossy();
    if raw.is_empty() {
        return Err(ExtractError::EntryRefused(
            "empty path in archive entry".to_string(),
        ));
    }
    let normalized = raw.replace('\\', "/");

    let mut chars = normalized.chars();
    if let (Some(letter), Some(':')) = (chars.next(), chars.next()) {
        if letter.is_ascii_alphabetic() {
            return Err(ExtractError::EntryRefused(format!(
                "unsafe path in archive entry: {}",
                path.display()
            )));
        }
    }

    if normalized.starts_with('/') {
        return Err(ExtractError::EntryRefused(format!(
            "unsafe path in archive entry: {}",
            path.display()
        )));
    }

    for seg in normalized.split('/') {
        if seg == ".." {
            return Err(ExtractError::EntryRefused(format!(
                "unsafe path in archive entry: {}",
                path.display()
            )));
        }
    }

    if !(entry_type.is_file() || entry_type.is_dir()) {
        return Err(ExtractError::EntryRefused(format!(
            "disallowed archive entry type {:?} at {}",
            entry_type,
            path.display()
        )));
    }
    Ok(())
}

/// Extracts a `.tar.gz` archive to the target destination directory.
///
/// Validates every entry's path and type BEFORE extracting anything: a
/// gzip/tar stream cannot be rewound, so an archive containing a
/// path-traversing, absolute, or non-regular (symlink/hardlink/device)
/// member is rejected outright in a first read-only pass rather than
/// silently sanitized mid-extraction.
pub fn extract_tar_gz(archive_path: &Path, destination: &Path) -> Result<(), ExtractError> {
    {
        let file = File::open(archive_path)?;
        let decoder = GzDecoder::new(file);
        let mut archive = Archive::new(decoder);
        for entry_result in archive.entries()? {
            let entry = entry_result.map_err(|e| ExtractError::Archive(e.to_string()))?;
            let path = entry
                .path()
                .map_err(|e| ExtractError::Archive(e.to_string()))?
                .into_owned();
            validate_entry(&path, entry.header().entry_type())?;
        }
    }

    let file = File::open(archive_path)?;
    let decoder = GzDecoder::new(file);
    let mut archive = Archive::new(decoder);
    archive.set_preserve_permissions(true);
    archive
        .unpack(destination)
        .map_err(|e| ExtractError::Archive(e.to_string()))?;
    Ok(())
}

/// Resolves the candidate root directory within an extracted directory.
/// If `manifest.json` is at the root of `extracted_dir`, returns `extracted_dir`.
/// If `extracted_dir` has a single subdirectory containing `manifest.json`, returns that subdirectory.
pub fn resolve_extracted_release_root(extracted_dir: &Path) -> PathBuf {
    if extracted_dir.join("manifest.json").exists() {
        return extracted_dir.to_path_buf();
    }
    if let Ok(entries) = std::fs::read_dir(extracted_dir) {
        let subdirs: Vec<PathBuf> = entries
            .filter_map(|e| e.ok())
            .filter(|e| e.path().is_dir())
            .map(|e| e.path())
            .collect();
        if subdirs.len() == 1 && subdirs[0].join("manifest.json").exists() {
            return subdirs[0].clone();
        }
    }
    extracted_dir.to_path_buf()
}

#[cfg(test)]
mod tests {
    use super::*;
    use flate2::write::GzEncoder;
    use flate2::Compression;

    /// Writes `raw_path` directly into a GNU tar header's 100-byte name field,
    /// bypassing `Header::set_path`'s own "must be relative"/no-`..` checks --
    /// a real attacker crafts archive bytes by hand too, not through this
    /// crate's safe writer API, so the fixture must match that threat model.
    fn write_raw_name(header: &mut tar::Header, raw_path: &str) {
        let bytes = header.as_mut_bytes();
        for b in bytes[0..100].iter_mut() {
            *b = 0;
        }
        let path_bytes = raw_path.as_bytes();
        let len = path_bytes.len().min(100);
        bytes[0..len].copy_from_slice(&path_bytes[0..len]);
    }

    fn build_archive_with_extra_entry(extra_path: &str, entry_type: EntryType) -> PathBuf {
        let temp_dir = std::env::temp_dir().join(format!(
            "fgos_test_extract_{}_{}",
            std::process::id(),
            extra_path.replace(['/', '.'], "_")
        ));
        let _ = std::fs::remove_dir_all(&temp_dir);
        std::fs::create_dir_all(&temp_dir).unwrap();
        let archive_path = temp_dir.join("archive.tar.gz");

        let file = File::create(&archive_path).unwrap();
        let encoder = GzEncoder::new(file, Compression::default());
        let mut builder = tar::Builder::new(encoder);

        // A valid, well-formed entry alongside the malicious one.
        let mut header = tar::Header::new_gnu();
        header.set_size(4);
        header.set_mode(0o644);
        header.set_path("manifest.json").unwrap();
        header.set_cksum();
        builder.append(&header, b"{}\n\n" as &[u8]).unwrap();

        let mut extra_header = tar::Header::new_gnu();
        extra_header.set_entry_type(entry_type);
        extra_header.set_mode(0o644);
        write_raw_name(&mut extra_header, extra_path);
        if entry_type.is_symlink() {
            extra_header.set_size(0);
            extra_header.set_link_name("/etc/hostname").unwrap();
            extra_header.set_cksum();
            builder.append(&extra_header, std::io::empty()).unwrap();
        } else {
            extra_header.set_size(4);
            extra_header.set_cksum();
            builder.append(&extra_header, b"evil" as &[u8]).unwrap();
        }

        builder.into_inner().unwrap().finish().unwrap();
        archive_path
    }

    #[test]
    fn test_extract_refuses_path_traversal_entry() {
        let archive_path =
            build_archive_with_extra_entry("../../archive-traversal-sentinel", EntryType::Regular);
        let dest = archive_path.parent().unwrap().join("dest");
        let err = extract_tar_gz(&archive_path, &dest).unwrap_err();
        assert!(matches!(err, ExtractError::EntryRefused(_)));
        assert!(!dest.exists() || std::fs::read_dir(&dest).unwrap().next().is_none());
        let _ = std::fs::remove_dir_all(archive_path.parent().unwrap());
    }

    #[test]
    fn test_extract_refuses_backslash_traversal_entry() {
        let archive_path = build_archive_with_extra_entry("..\\..\\outside", EntryType::Regular);
        let dest = archive_path.parent().unwrap().join("dest");
        let err = extract_tar_gz(&archive_path, &dest).unwrap_err();
        assert!(matches!(err, ExtractError::EntryRefused(_)));
        let _ = std::fs::remove_dir_all(archive_path.parent().unwrap());
    }

    #[test]
    fn test_extract_refuses_windows_drive_letter_entry() {
        let archive_path = build_archive_with_extra_entry("C:\\outside\\pwn", EntryType::Regular);
        let dest = archive_path.parent().unwrap().join("dest");
        let err = extract_tar_gz(&archive_path, &dest).unwrap_err();
        assert!(matches!(err, ExtractError::EntryRefused(_)));
        let _ = std::fs::remove_dir_all(archive_path.parent().unwrap());
    }

    #[test]
    fn test_extract_refuses_absolute_entry() {
        let archive_path = build_archive_with_extra_entry("/etc/passwd", EntryType::Regular);
        let dest = archive_path.parent().unwrap().join("dest");
        let err = extract_tar_gz(&archive_path, &dest).unwrap_err();
        assert!(matches!(err, ExtractError::EntryRefused(_)));
        let _ = std::fs::remove_dir_all(archive_path.parent().unwrap());
    }

    #[test]
    fn test_extract_refuses_symlink_entry() {
        let archive_path = build_archive_with_extra_entry("bin/evil-link", EntryType::Symlink);
        let dest = archive_path.parent().unwrap().join("dest");
        let err = extract_tar_gz(&archive_path, &dest).unwrap_err();
        assert!(matches!(err, ExtractError::EntryRefused(_)));
        let _ = std::fs::remove_dir_all(archive_path.parent().unwrap());
    }

    #[test]
    fn test_validate_entry_accepts_normal_file_and_dir() {
        assert!(validate_entry(Path::new("bin/fgos"), EntryType::Regular).is_ok());
        assert!(validate_entry(Path::new("bin"), EntryType::Directory).is_ok());
    }

    #[test]
    fn test_validate_entry_refuses_hardlink() {
        let err = validate_entry(Path::new("bin/link"), EntryType::Link).unwrap_err();
        assert!(matches!(err, ExtractError::EntryRefused(_)));
    }

    #[test]
    fn test_validate_entry_refuses_backslash_traversal() {
        let err = validate_entry(Path::new("..\\..\\outside"), EntryType::Regular).unwrap_err();
        assert!(matches!(err, ExtractError::EntryRefused(_)));
    }

    #[test]
    fn test_validate_entry_refuses_windows_drive_letter() {
        let err = validate_entry(Path::new("C:\\outside\\pwn"), EntryType::Regular).unwrap_err();
        assert!(matches!(err, ExtractError::EntryRefused(_)));
    }
}
