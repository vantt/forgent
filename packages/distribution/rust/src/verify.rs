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
    #[error(
        "manifest components.legacyNode.digest mismatch: declared {declared}, actual {actual}"
    )]
    LegacyNodeDigestMismatch {
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

/// Recomputes artifactDigest from a manifest.json file path by parsing as JSON,
/// removing artifactDigest, and running pure Rust SHA-256 over its canonical JSON representation.
pub fn recompute_artifact_digest(manifest_path: &Path) -> Result<String, VerificationError> {
    let raw = std::fs::read_to_string(manifest_path)?;
    let mut val: serde_json::Value = serde_json::from_str(&raw)?;

    let declared = val
        .get("artifactDigest")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    if let Some(map) = val.as_object_mut() {
        map.remove("artifactDigest");
    } else {
        return Err(VerificationError::InvalidManifestStructure);
    }

    let canonical = to_canonical_json(&val);
    let mut hasher = Sha256::new();
    hasher.update(canonical.as_bytes());
    let recomputed = format!("sha256:{:x}", hasher.finalize());

    if let Some(dec) = declared {
        if dec != recomputed {
            return Err(VerificationError::ManifestDigestMismatch {
                declared: dec,
                recomputed,
            });
        }
    }

    Ok(recomputed)
}

/// Per-file verifier re-hashing each `files[]` entry's bytes at its declared path
/// under the release root and comparing to its declared `digest`.
///
/// Refuses any symlink path component along the declared path (including in-root
/// directory symlinks), preserves canonical manifest path policy, and enforces
/// release-root containment.
/// Returns typed errors distinguishing a specific file's digest mismatch and a missing file.
pub fn verify_release_files(
    release_root: &Path,
    manifest: &ReleaseManifest,
) -> Result<(), VerificationError> {
    let canonical_entries = canonicalize_manifest_files(manifest)?;

    let release_root_canonical = if release_root.exists() {
        Some(release_root.canonicalize()?)
    } else {
        None
    };

    for canonical in &canonical_entries {
        let entry = &canonical.original;
        let mut current = release_root.to_path_buf();

        for seg in canonical.normalized_path.split('/') {
            if seg.is_empty() || seg == "." || seg == ".." {
                continue;
            }
            current.push(seg);
            let meta = match std::fs::symlink_metadata(&current) {
                Ok(m) => m,
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
                    return Err(VerificationError::MissingFile {
                        path: entry.path.clone(),
                    });
                }
                Err(e) => return Err(VerificationError::Io(e)),
            };
            if meta.file_type().is_symlink() {
                return Err(VerificationError::SymlinkRefused {
                    path: entry.path.clone(),
                });
            }
        }

        if let Some(ref real_root) = release_root_canonical {
            let real_path = current.canonicalize()?;
            if !real_path.starts_with(real_root) {
                return Err(VerificationError::Canonical(CanonicalError::PathTraversal(
                    entry.path.clone(),
                )));
            }
        }

        let bytes = std::fs::read(&current)?;
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

/// Verifies the legacy node component locator and payload file:
/// 1. Enforces that `components.legacyNode.root` and `entry` are valid relative locators.
/// 2. Rejects any symlink path component in `root` or `entry` (including unlisted payload symlinks).
/// 3. Confirms containment under `release_root`.
/// 4. Verifies the payload file exists and its SHA-256 digest matches `components.legacyNode.digest`.
pub fn verify_legacy_node(
    release_root: &Path,
    manifest: &ReleaseManifest,
) -> Result<std::path::PathBuf, VerificationError> {
    manifest.validate_legacy_node_invariant().map_err(|err| {
        VerificationError::Canonical(CanonicalError::MalformedSegment(err.to_string()))
    })?;

    let root = &manifest.components.legacy_node.root;
    let entry = &manifest.components.legacy_node.entry;
    let declared_digest = &manifest.components.legacy_node.digest;

    if root.starts_with('/')
        || entry.starts_with('/')
        || Path::new(root).is_absolute()
        || Path::new(entry).is_absolute()
    {
        return Err(VerificationError::Canonical(CanonicalError::AbsolutePath(
            format!("{}/{}", root, entry),
        )));
    }

    let joined_rel = Path::new(root).join(entry);
    let rel_str = joined_rel.to_string_lossy().replace('\\', "/");

    let mut current = release_root.to_path_buf();
    for seg in rel_str.split('/') {
        if seg.is_empty() || seg == "." {
            continue;
        }
        if seg == ".." {
            return Err(VerificationError::Canonical(CanonicalError::PathTraversal(
                rel_str.clone(),
            )));
        }
        current.push(seg);
        let meta = match std::fs::symlink_metadata(&current) {
            Ok(m) => m,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
                return Err(VerificationError::MissingFile {
                    path: rel_str.clone(),
                });
            }
            Err(e) => return Err(VerificationError::Io(e)),
        };
        if meta.file_type().is_symlink() {
            return Err(VerificationError::SymlinkRefused {
                path: rel_str.clone(),
            });
        }
    }

    let release_root_canonical = if release_root.exists() {
        Some(release_root.canonicalize()?)
    } else {
        None
    };

    let real_path = current.canonicalize()?;
    if let Some(ref real_root) = release_root_canonical {
        if !real_path.starts_with(real_root) {
            return Err(VerificationError::Canonical(CanonicalError::PathTraversal(
                rel_str.clone(),
            )));
        }
    }

    let bytes = std::fs::read(&real_path)?;
    let mut hasher = Sha256::new();
    hasher.update(&bytes);
    let actual = format!("sha256:{:x}", hasher.finalize());

    if actual != *declared_digest {
        return Err(VerificationError::LegacyNodeDigestMismatch {
            path: rel_str,
            declared: declared_digest.clone(),
            actual,
        });
    }

    Ok(real_path)
}

/// Verifies a release tree end-to-end:
/// 1. Recomputes and validates manifest artifactDigest.
/// 2. Validates release tree canonicalization (§5 rules).
/// 3. Re-hashes every declared file against declared digest.
/// 4. Validates legacy node payload file digest and rejects symlinks.
pub fn verify_release_tree(release_root: &Path) -> Result<String, VerificationError> {
    let manifest_path = release_root.join("manifest.json");
    let digest = recompute_artifact_digest(&manifest_path)?;
    let manifest = read_manifest_from_path(&manifest_path).map_err(|e| match e {
        crate::manifest::ManifestReadError::NotFound(_) => VerificationError::MissingFile {
            path: "manifest.json".to_string(),
        },
        crate::manifest::ManifestReadError::Io(io_err) => VerificationError::Io(io_err),
        crate::manifest::ManifestReadError::Json(json_err) => VerificationError::Json(json_err),
        crate::manifest::ManifestReadError::InvalidInvariant(_) => {
            VerificationError::InvalidManifestStructure
        }
    })?;

    canonicalize_manifest_files(&manifest)?;
    verify_release_files(release_root, &manifest)?;
    verify_legacy_node(release_root, &manifest)?;

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

    #[test]
    fn test_verify_release_files_rejects_forbidden_paths_and_symlinks() {
        let temp_dir =
            std::env::temp_dir().join(format!("fgos_test_verify_paths_{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&temp_dir);
        std::fs::create_dir_all(temp_dir.join("bin")).unwrap();

        let file_path = temp_dir.join("bin/fgos");
        std::fs::write(&file_path, b"hello binary").unwrap();

        let mut hasher = Sha256::new();
        hasher.update(b"hello binary");
        let valid_digest = format!("sha256:{:x}", hasher.finalize());

        let base_manifest = ReleaseManifest {
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

        // 1. Rejects absolute path
        let mut abs_manifest = base_manifest.clone();
        abs_manifest.files[0].path = "/etc/passwd".to_string();
        let err = verify_release_files(&temp_dir, &abs_manifest).unwrap_err();
        assert!(matches!(
            err,
            VerificationError::Canonical(CanonicalError::AbsolutePath(_))
        ));

        // 2. Rejects parent traversal
        let mut trav_manifest = base_manifest.clone();
        trav_manifest.files[0].path = "../outside.txt".to_string();
        let err = verify_release_files(&temp_dir, &trav_manifest).unwrap_err();
        assert!(matches!(
            err,
            VerificationError::Canonical(CanonicalError::PathTraversal(_))
        ));

        // 3. Rejects dot segment
        let mut dot_manifest = base_manifest.clone();
        dot_manifest.files[0].path = "./bin/fgos".to_string();
        let err = verify_release_files(&temp_dir, &dot_manifest).unwrap_err();
        assert!(matches!(
            err,
            VerificationError::Canonical(CanonicalError::MalformedSegment(_))
        ));

        // 4. Rejects empty segment
        let mut empty_seg_manifest = base_manifest.clone();
        empty_seg_manifest.files[0].path = "bin//fgos".to_string();
        let err = verify_release_files(&temp_dir, &empty_seg_manifest).unwrap_err();
        assert!(matches!(
            err,
            VerificationError::Canonical(CanonicalError::MalformedSegment(_))
        ));

        // 5. Rejects symlink kind declaration
        let mut sym_kind_manifest = base_manifest.clone();
        sym_kind_manifest.files[0].kind = "symlink".to_string();
        let err = verify_release_files(&temp_dir, &sym_kind_manifest).unwrap_err();
        assert!(matches!(
            err,
            VerificationError::Canonical(CanonicalError::SymlinkRefused(_))
        ));

        // 6. Rejects on-disk symlink file
        #[cfg(unix)]
        {
            let symlink_path = temp_dir.join("bin/sym_fgos");
            std::os::unix::fs::symlink(&file_path, &symlink_path).unwrap();
            let mut disk_sym_manifest = base_manifest.clone();
            disk_sym_manifest.files[0].path = "bin/sym_fgos".to_string();
            let err = verify_release_files(&temp_dir, &disk_sym_manifest).unwrap_err();
            assert!(matches!(err, VerificationError::SymlinkRefused { .. }));
        }

        // 7. Rejects path resolving outside release root via directory symlink
        #[cfg(unix)]
        {
            let outside_dir =
                std::env::temp_dir().join(format!("fgos_test_outside_dir_{}", std::process::id()));
            let _ = std::fs::remove_dir_all(&outside_dir);
            std::fs::create_dir_all(&outside_dir).unwrap();
            let outside_target_file = outside_dir.join("file.txt");
            std::fs::write(&outside_target_file, b"outside").unwrap();
            let outside_link = temp_dir.join("outside_link");
            std::os::unix::fs::symlink(&outside_dir, &outside_link).unwrap();

            let mut out_hasher = Sha256::new();
            out_hasher.update(b"outside");
            let outside_digest = format!("sha256:{:x}", out_hasher.finalize());

            let mut outside_manifest = base_manifest.clone();
            outside_manifest.files[0].path = "outside_link/file.txt".to_string();
            outside_manifest.files[0].digest = outside_digest;

            let err = verify_release_files(&temp_dir, &outside_manifest).unwrap_err();
            assert!(matches!(err, VerificationError::SymlinkRefused { .. }));

            let _ = std::fs::remove_dir_all(&outside_dir);
        }

        // 8. Rejects path resolving via in-root directory symlink (e.g. link/fgos where link -> bin)
        #[cfg(unix)]
        {
            let in_root_link = temp_dir.join("link");
            std::os::unix::fs::symlink(temp_dir.join("bin"), &in_root_link).unwrap();

            let mut in_root_manifest = base_manifest.clone();
            in_root_manifest.files[0].path = "link/fgos".to_string();

            let err = verify_release_files(&temp_dir, &in_root_manifest).unwrap_err();
            assert!(matches!(err, VerificationError::SymlinkRefused { .. }));
        }

        let _ = std::fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_verify_legacy_node_success_and_failures() {
        let temp_dir =
            std::env::temp_dir().join(format!("fgos_test_verify_legacy_{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&temp_dir);
        std::fs::create_dir_all(temp_dir.join("libexec/legacy-node/bin")).unwrap();

        let payload_file = temp_dir.join("libexec/legacy-node/bin/fgos.mjs");
        std::fs::write(&payload_file, b"console.log('hello');").unwrap();

        let mut hasher = Sha256::new();
        hasher.update(b"console.log('hello');");
        let valid_digest = format!("sha256:{:x}", hasher.finalize());

        let base_manifest = ReleaseManifest {
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
                    root: "libexec/legacy-node".to_string(),
                    entry: "bin/fgos.mjs".to_string(),
                    digest: valid_digest.clone(),
                },
                runner: None,
                workshop: None,
            },
            requires: RequiresInfo {
                node: None,
                git: None,
            },
            state_schemas: None,
            files: vec![],
        };

        // 1. Success case
        let res = verify_legacy_node(&temp_dir, &base_manifest);
        assert!(res.is_ok());

        // 2. Digest mismatch case
        let mut mismatch_manifest = base_manifest.clone();
        mismatch_manifest.components.legacy_node.digest =
            "sha256:0000000000000000000000000000000000000000000000000000000000000000".to_string();
        let err = verify_legacy_node(&temp_dir, &mismatch_manifest).unwrap_err();
        assert!(matches!(
            err,
            VerificationError::LegacyNodeDigestMismatch { .. }
        ));

        // 3. Missing payload file
        let mut missing_manifest = base_manifest.clone();
        missing_manifest.components.legacy_node.entry = "bin/missing.mjs".to_string();
        let err = verify_legacy_node(&temp_dir, &missing_manifest).unwrap_err();
        assert!(matches!(err, VerificationError::MissingFile { .. }));

        // 4. Unlisted payload file symlink
        #[cfg(unix)]
        {
            let sym_entry = temp_dir.join("libexec/legacy-node/bin/sym_entry.mjs");
            std::os::unix::fs::symlink(&payload_file, &sym_entry).unwrap();

            let mut sym_manifest = base_manifest.clone();
            sym_manifest.components.legacy_node.entry = "bin/sym_entry.mjs".to_string();
            let err = verify_legacy_node(&temp_dir, &sym_manifest).unwrap_err();
            assert!(matches!(err, VerificationError::SymlinkRefused { .. }));
        }

        // 5. In-root directory symlink in payload path
        #[cfg(unix)]
        {
            let sym_dir = temp_dir.join("sym_libexec");
            std::os::unix::fs::symlink(temp_dir.join("libexec"), &sym_dir).unwrap();

            let mut sym_dir_manifest = base_manifest.clone();
            sym_dir_manifest.components.legacy_node.root = "sym_libexec/legacy-node".to_string();
            let err = verify_legacy_node(&temp_dir, &sym_dir_manifest).unwrap_err();
            assert!(matches!(err, VerificationError::SymlinkRefused { .. }));
        }

        let _ = std::fs::remove_dir_all(&temp_dir);
    }
}
