//! Release tree canonicalization and validation.
//!
//! Enforces rules from `docs/architect/packaging-distribution/runtime-identity-and-activation.md` §5.

use crate::manifest::{ManifestFileEntry, ReleaseManifest};
use std::collections::HashSet;
use unicode_normalization::UnicodeNormalization;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CanonicalFileEntry {
    pub normalized_path: String,
    pub original: ManifestFileEntry,
}

#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum CanonicalError {
    #[error("absolute path refused in release manifest: {0}")]
    AbsolutePath(String),
    #[error("path traversal refused in release manifest: {0}")]
    PathTraversal(String),
    #[error("symlink refused in release manifest: {0}")]
    SymlinkRefused(String),
    #[error("case-insensitive path collision in release manifest: {0}")]
    CaseCollision(String),
}

/// Normalizes a path string to `/`-separated UTF-8 NFC form.
pub fn normalize_release_path(raw_path: &str) -> String {
    let forward = raw_path.replace('\\', "/");
    forward.nfc().collect()
}

/// Validates and canonicalizes the manifest's `files[]` list according to §5 rules.
///
/// Reads ONLY the manifest's own `files[]` list.
/// Returns entries sorted lexicographically by normalized bytes.
pub fn canonicalize_manifest_files(
    manifest: &ReleaseManifest,
) -> Result<Vec<CanonicalFileEntry>, CanonicalError> {
    let mut canonical_entries = Vec::with_capacity(manifest.files.len());
    let mut seen_lower = HashSet::with_capacity(manifest.files.len());

    for entry in &manifest.files {
        let raw_path = &entry.path;

        // 1. Refuse absolute paths (check raw and normalized)
        if raw_path.starts_with('/')
            || raw_path.starts_with('\\')
            || std::path::Path::new(raw_path).is_absolute()
        {
            return Err(CanonicalError::AbsolutePath(raw_path.clone()));
        }

        // 2. Refuse symlinks declared in kind
        if entry.kind.eq_ignore_ascii_case("symlink") {
            return Err(CanonicalError::SymlinkRefused(raw_path.clone()));
        }

        // 3. Normalize to /-separated UTF-8 NFC
        let normalized = normalize_release_path(raw_path);

        if normalized.starts_with('/') {
            return Err(CanonicalError::AbsolutePath(raw_path.clone()));
        }

        // 4. Refuse path traversal outside release root
        if normalized.is_empty() {
            return Err(CanonicalError::PathTraversal(raw_path.clone()));
        }
        for seg in normalized.split('/') {
            if seg == ".." {
                return Err(CanonicalError::PathTraversal(raw_path.clone()));
            }
        }

        // 5. Refuse case-insensitive collisions
        let lower = normalized.to_lowercase();
        if seen_lower.contains(&lower) {
            return Err(CanonicalError::CaseCollision(normalized));
        }
        seen_lower.insert(lower);

        canonical_entries.push(CanonicalFileEntry {
            normalized_path: normalized,
            original: entry.clone(),
        });
    }

    // 6. Sort lexicographically by normalized bytes
    canonical_entries.sort_by(|a, b| {
        a.normalized_path
            .as_bytes()
            .cmp(b.normalized_path.as_bytes())
    });

    Ok(canonical_entries)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn dummy_manifest(files: Vec<ManifestFileEntry>) -> ReleaseManifest {
        ReleaseManifest {
            schema_version: 1,
            artifact_digest: "sha256:dummy".to_string(),
            digest_kind: None,
            release_version: None,
            source_revision: None,
            created_at: None,
            target: crate::manifest::TargetInfo {
                os: "linux".to_string(),
                arch: "x64".to_string(),
                libc: None,
            },
            entries: crate::manifest::EntriesInfo {
                fgos: "bin/fgos".to_string(),
                fgos_runner: None,
            },
            components: crate::manifest::ComponentsInfo {
                legacy_node: crate::manifest::LegacyNodeComponent {
                    root: "libexec".to_string(),
                    entry: "bin/fgos.mjs".to_string(),
                    digest: "sha256:dummy".to_string(),
                },
                runner: None,
                workshop: None,
            },
            requires: crate::manifest::RequiresInfo {
                node: None,
                git: None,
            },
            state_schemas: None,
            files,
        }
    }

    #[test]
    fn test_refuse_absolute_path() {
        let manifest = dummy_manifest(vec![ManifestFileEntry {
            path: "/etc/passwd".to_string(),
            kind: "file".to_string(),
            digest: "sha256:abc".to_string(),
            mode: "644".to_string(),
            class: "immutable-runtime".to_string(),
        }]);
        let err = canonicalize_manifest_files(&manifest).unwrap_err();
        assert!(matches!(err, CanonicalError::AbsolutePath(_)));
    }

    #[test]
    fn test_refuse_path_traversal() {
        let manifest = dummy_manifest(vec![ManifestFileEntry {
            path: "foo/../../bar".to_string(),
            kind: "file".to_string(),
            digest: "sha256:abc".to_string(),
            mode: "644".to_string(),
            class: "immutable-runtime".to_string(),
        }]);
        let err = canonicalize_manifest_files(&manifest).unwrap_err();
        assert!(matches!(err, CanonicalError::PathTraversal(_)));
    }

    #[test]
    fn test_refuse_symlink() {
        let manifest = dummy_manifest(vec![ManifestFileEntry {
            path: "bin/sym".to_string(),
            kind: "symlink".to_string(),
            digest: "sha256:abc".to_string(),
            mode: "755".to_string(),
            class: "immutable-entry".to_string(),
        }]);
        let err = canonicalize_manifest_files(&manifest).unwrap_err();
        assert!(matches!(err, CanonicalError::SymlinkRefused(_)));
    }

    #[test]
    fn test_refuse_case_collision() {
        let manifest = dummy_manifest(vec![
            ManifestFileEntry {
                path: "foo/bar.txt".to_string(),
                kind: "file".to_string(),
                digest: "sha256:abc".to_string(),
                mode: "644".to_string(),
                class: "immutable-runtime".to_string(),
            },
            ManifestFileEntry {
                path: "FOO/BAR.TXT".to_string(),
                kind: "file".to_string(),
                digest: "sha256:def".to_string(),
                mode: "644".to_string(),
                class: "immutable-runtime".to_string(),
            },
        ]);
        let err = canonicalize_manifest_files(&manifest).unwrap_err();
        assert!(matches!(err, CanonicalError::CaseCollision(_)));
    }

    #[test]
    fn test_normalize_and_sort() {
        let manifest = dummy_manifest(vec![
            ManifestFileEntry {
                path: "z/b.txt".to_string(),
                kind: "file".to_string(),
                digest: "sha256:1".to_string(),
                mode: "644".to_string(),
                class: "immutable-runtime".to_string(),
            },
            ManifestFileEntry {
                path: "a\\c.txt".to_string(),
                kind: "file".to_string(),
                digest: "sha256:2".to_string(),
                mode: "644".to_string(),
                class: "immutable-runtime".to_string(),
            },
        ]);
        let res = canonicalize_manifest_files(&manifest).unwrap();
        assert_eq!(res.len(), 2);
        assert_eq!(res[0].normalized_path, "a/c.txt");
        assert_eq!(res[1].normalized_path, "z/b.txt");
    }
}
