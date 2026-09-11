//! Manifest digest recomputation and per-file verification.
//!
//! Matches `docs/architect/packaging-distribution/runtime-identity-and-activation.md` §5.

use crate::canonical::{canonicalize_manifest_files, CanonicalError};
use crate::manifest::{read_manifest_from_path, ReleaseManifest};
use sha2::{Digest, Sha256};
use std::path::Path;

#[derive(Debug, thiserror::Error)]
pub enum VerificationError {
    #[error("manifest digest mismatch: declared {declared}, recomputed {recomputed}")]
    ManifestDigestMismatch {
        declared: String,
        recomputed: String,
    },
    #[error("missing file: {path}")]
    MissingFile { path: String },
    #[error("file digest mismatch for {path}: declared {declared}, actual {actual}")]
    FileDigestMismatch {
        path: String,
        declared: String,
        actual: String,
    },
    #[error("symlink refused in release files on disk: {path}")]
    SymlinkRefused { path: String },
    #[error("manifest is not a JSON object")]
    InvalidManifestStructure,
    #[error("canonicalization error: {0}")]
    Canonical(#[from] CanonicalError),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("json error: {0}")]
    Json(#[from] serde_json::Error),
}

/// Deterministic, key-sorted canonical JSON serializer matching RFC 8785 / JCS.
pub fn to_canonical_json(value: &serde_json::Value) -> String {
    match value {
        serde_json::Value::Null => "null".to_string(),
        serde_json::Value::Bool(b) => {
            if *b {
                "true".to_string()
            } else {
                "false".to_string()
            }
        }
        serde_json::Value::Number(n) => n.to_string(),
        serde_json::Value::String(s) => serde_json::to_string(s).unwrap(),
        serde_json::Value::Array(arr) => {
            let elems: Vec<String> = arr.iter().map(to_canonical_json).collect();
            format!("[{}]", elems.join(","))
        }
        serde_json::Value::Object(map) => {
            let mut keys: Vec<&String> = map.keys().collect();
            keys.sort();
            let pairs: Vec<String> = keys
                .into_iter()
                .map(|k| {
                    format!(
                        "{}:{}",
                        serde_json::to_string(k).unwrap(),
                        to_canonical_json(&map[k])
                    )
                })
                .collect();
            format!("{{{}}}", pairs.join(","))
        }
    }
}

/// Recomputes `sha256(canonical-json(manifest without artifactDigest))` from the manifest on disk.
///
/// If `artifactDigest` is present in the manifest, asserts that it matches the recomputed value.
/// Returns typed error `VerificationError::ManifestDigestMismatch` on mismatch.
pub fn recompute_artifact_digest(manifest_path: &Path) -> Result<String, VerificationError> {
    let raw = std::fs::read_to_string(manifest_path)?;
    let mut val: serde_json::Value = serde_json::from_str(&raw)?;

    let map = val
        .as_object_mut()
        .ok_or(VerificationError::InvalidManifestStructure)?;

    let declared_digest = map
        .remove("artifactDigest")
        .and_then(|d| d.as_str().map(|s| s.to_string()));

    let canonical = to_canonical_json(&val);

    let mut hasher = Sha256::new();
    hasher.update(canonical.as_bytes());
    let recomputed = format!("sha256:{:x}", hasher.finalize());

    if let Some(declared) = declared_digest {
        if declared != recomputed {
            return Err(VerificationError::ManifestDigestMismatch {
                declared,
                recomputed,
            });
        }
    }

    Ok(recomputed)
}

/// Per-file verifier re-hashing each `files[]` entry's bytes at its declared path
/// under the release root and comparing to its declared `digest`.
///
/// Returns typed errors distinguishing a specific file's digest mismatch and a missing file.
pub fn verify_release_files(
    release_root: &Path,
    manifest: &ReleaseManifest,
) -> Result<(), VerificationError> {
    for entry in &manifest.files {
        let file_path = release_root.join(&entry.path);

        if !file_path.exists() {
            return Err(VerificationError::MissingFile {
                path: entry.path.clone(),
            });
        }

        let is_symlink = std::fs::symlink_metadata(&file_path)
            .map(|m| m.file_type().is_symlink())
            .unwrap_or(false);

        if is_symlink {
            return Err(VerificationError::SymlinkRefused {
                path: entry.path.clone(),
            });
        }

        let bytes = std::fs::read(&file_path)?;
        let mut hasher = Sha256::new();
        hasher.update(&bytes);
        let actual = format!("sha256:{:x}", hasher.finalize());

        if actual != entry.digest {
            return Err(VerificationError::FileDigestMismatch {
                path: entry.path.clone(),
                declared: entry.digest.clone(),
                actual,
            });
        }
    }

    Ok(())
}

/// Verifies a release tree end-to-end:
/// 1. Recomputes and validates manifest artifactDigest.
/// 2. Validates release tree canonicalization (§5 rules).
/// 3. Re-hashes every declared file against declared digest.
pub fn verify_release_tree(release_root: &Path) -> Result<String, VerificationError> {
    let manifest_path = release_root.join("manifest.json");
    let digest = recompute_artifact_digest(&manifest_path)?;
    let manifest = read_manifest_from_path(&manifest_path).map_err(|e| match e {
        crate::manifest::ManifestReadError::NotFound(_) => VerificationError::MissingFile {
            path: "manifest.json".to_string(),
        },
        crate::manifest::ManifestReadError::Io(io_err) => VerificationError::Io(io_err),
        crate::manifest::ManifestReadError::Json(json_err) => VerificationError::Json(json_err),
    })?;

    canonicalize_manifest_files(&manifest)?;
    verify_release_files(release_root, &manifest)?;

    Ok(digest)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::manifest::*;

    #[test]
    fn test_to_canonical_json_sorting() {
        let val: serde_json::Value = serde_json::json!({
            "z": 1,
            "a": 2,
            "m": {
                "b": 3,
                "a": 4
            }
        });
        let s = to_canonical_json(&val);
        assert_eq!(s, r#"{"a":2,"m":{"a":4,"b":3},"z":1}"#);
    }

    #[test]
    fn test_verify_release_files_success_and_mismatch() {
        let temp_dir =
            std::env::temp_dir().join(format!("fgos_test_verify_{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&temp_dir);
        std::fs::create_dir_all(temp_dir.join("bin")).unwrap();

        let file_path = temp_dir.join("bin/fgos");
        std::fs::write(&file_path, b"hello binary").unwrap();

        let mut hasher = Sha256::new();
        hasher.update(b"hello binary");
        let valid_digest = format!("sha256:{:x}", hasher.finalize());

        let manifest = ReleaseManifest {
            schema_version: 1,
            artifact_digest: "sha256:dummy".to_string(),
            digest_kind: None,
            release_version: None,
            source_revision: None,
            created_at: None,
            target: TargetInfo {
                os: "linux".to_string(),
                arch: "x64".to_string(),
                libc: None,
            },
            entries: EntriesInfo {
                fgos: "bin/fgos".to_string(),
                fgos_runner: None,
            },
            components: ComponentsInfo {
                legacy_node: LegacyNodeComponent {
                    root: "libexec".to_string(),
                    entry: "bin/fgos.mjs".to_string(),
                    digest: "sha256:dummy".to_string(),
                },
                runner: None,
                workshop: None,
            },
            requires: RequiresInfo {
                node: None,
                git: None,
            },
            state_schemas: None,
            files: vec![ManifestFileEntry {
                path: "bin/fgos".to_string(),
                kind: "file".to_string(),
                digest: valid_digest.clone(),
                mode: "755".to_string(),
                class: "immutable-entry".to_string(),
            }],
        };

        // 1. Success case
        assert!(verify_release_files(&temp_dir, &manifest).is_ok());

        // 2. File digest mismatch case
        let mut corrupted_manifest = manifest.clone();
        corrupted_manifest.files[0].digest =
            "sha256:0000000000000000000000000000000000000000000000000000000000000000".to_string();
        let err = verify_release_files(&temp_dir, &corrupted_manifest).unwrap_err();
        assert!(matches!(err, VerificationError::FileDigestMismatch { .. }));

        // 3. Missing file case
        let mut missing_manifest = manifest.clone();
        missing_manifest.files[0].path = "bin/missing".to_string();
        let err = verify_release_files(&temp_dir, &missing_manifest).unwrap_err();
        assert!(matches!(err, VerificationError::MissingFile { .. }));

        let _ = std::fs::remove_dir_all(&temp_dir);
    }
}
