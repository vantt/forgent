//! Archive extraction utilities.

use flate2::read::GzDecoder;
use std::fs::File;
use std::path::{Path, PathBuf};
use tar::Archive;

#[derive(Debug, thiserror::Error)]
pub enum ExtractError {
    #[error("io error during archive extraction: {0}")]
    Io(#[from] std::io::Error),
    #[error("archive format error: {0}")]
    Archive(String),
}

/// Extracts a `.tar.gz` archive to the target destination directory.
pub fn extract_tar_gz(archive_path: &Path, destination: &Path) -> Result<(), ExtractError> {
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
