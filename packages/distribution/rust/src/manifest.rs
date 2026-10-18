//! Manifest types for fgOS release distributions.
//!
//! Matches `docs/platform/packaging-distribution/contracts/release-manifest.md`
//! and `docs/architect/packaging-distribution/runtime-identity-and-activation.md` §5.
//!
//! # Frozen Schema V1 Invariants
//! - `schemaVersion` is frozen at 1.
//! - `components.legacyNode.root` and `components.legacyNode.entry` are the ONLY
//!   legacy Node locator across the platform (per repo `AGENTS.md` and contract).
//!   The Rust host resolves the legacy Node payload exclusively through these fields;
//!   never PATH, never cwd, never hardcoded outside the release manifest.

use serde::{Deserialize, Serialize};
use std::path::{Component, Path};

/// Current frozen schema version for release manifests.
pub const RELEASE_MANIFEST_SCHEMA_VERSION_V1: u32 = 1;

/// Frozen V1 release manifest representation.
///
/// Serialized with `camelCase` naming matching `contracts/release-manifest.md`.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseManifest {
    pub schema_version: u32,
    pub artifact_digest: String,
    #[serde(default)]
    pub digest_kind: Option<String>,
    #[serde(default)]
    pub release_version: Option<String>,
    #[serde(default)]
    pub source_revision: Option<String>,
    #[serde(default)]
    pub created_at: Option<String>,
    pub target: TargetInfo,
    pub entries: EntriesInfo,
    pub components: ComponentsInfo,
    pub requires: RequiresInfo,
    #[serde(default)]
    pub state_schemas: Option<StateSchemasInfo>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub capabilities: Vec<String>,
    pub files: Vec<ManifestFileEntry>,
}

impl ReleaseManifest {
    /// Validates the locked platform invariant that `components.legacyNode.root`
    /// and `components.legacyNode.entry` exist as confined relative locators.
    pub fn validate_legacy_node_invariant(&self) -> Result<(), &'static str> {
        if self.components.legacy_node.root.trim().is_empty() {
            return Err("components.legacyNode.root must not be empty");
        }
        if self.components.legacy_node.entry.trim().is_empty() {
            return Err("components.legacyNode.entry must not be empty");
        }
        if self.components.legacy_node.digest.trim().is_empty() {
            return Err("components.legacyNode.digest must not be empty");
        }
        validate_relative_component_path(
            "components.legacyNode.root",
            &self.components.legacy_node.root,
        )?;
        validate_relative_component_path(
            "components.legacyNode.entry",
            &self.components.legacy_node.entry,
        )?;
        let root_prefix = format!(
            "{}/",
            self.components.legacy_node.root.trim_end_matches('/')
        );
        if self.components.legacy_node.entry == self.components.legacy_node.root
            || self.components.legacy_node.entry.starts_with(&root_prefix)
        {
            return Err("components.legacyNode.entry must be relative to components.legacyNode.root, not repeat it");
        }
        Ok(())
    }

    /// Additive admission: old releases may omit the addon until Git phase 05 (M10).
    pub fn validate_native_addon_invariant(&self) -> Result<(), &'static str> {
        let Some(addon) = &self.components.native_addon else {
            return Ok(());
        };
        let expected_target = match (self.target.os.as_str(), self.target.arch.as_str()) {
            ("linux", "x64" | "x86_64") => "linux-x64",
            ("windows" | "win32", "x64" | "x86_64") => "win32-x64",
            _ => return Err("nativeAddon release target unsupported"),
        };
        if addon.target != expected_target || addon.napi_version != 8 {
            return Err("nativeAddon target or Node-API mismatch");
        }
        if addon.path.contains('\\')
            || addon.path.contains(':')
            || !addon.path.ends_with(".node")
            || addon
                .path
                .split('/')
                .any(|part| part.is_empty() || part == "." || part == "..")
        {
            return Err("nativeAddon path must be a canonical relative .node path");
        }
        if addon.digest.len() != 64
            || !addon
                .digest
                .bytes()
                .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
        {
            return Err("nativeAddon digest must be lowercase SHA-256 hex");
        }
        let checksums = native_addon_crate_checksums();
        if checksums.len() != 3 || addon.crate_checksums != checksums {
            return Err("nativeAddon crate checksums differ from Cargo.lock");
        }
        if !self.files.iter().any(|file| {
            file.path == addon.path
                && file.kind == "file"
                && file.digest == format!("sha256:{}", addon.digest)
        }) {
            return Err("nativeAddon must have a matching files entry");
        }
        Ok(())
    }

    /// Validates V1 semantics enforced at every trusted manifest read boundary.
    pub fn validate_v1_invariants(&self) -> Result<(), &'static str> {
        if self.schema_version != RELEASE_MANIFEST_SCHEMA_VERSION_V1 {
            return Err("schemaVersion is unsupported; expected 1");
        }
        self.validate_legacy_node_invariant()?;
        self.validate_native_addon_invariant()?;
        if self
            .state_schemas
            .as_ref()
            .map(|schemas| !schemas.migrations.is_empty())
            .unwrap_or(false)
        {
            return Err("stateSchemas.migrations is reserved in V1 and must be empty");
        }
        Ok(())
    }
}

fn validate_relative_component_path(field: &'static str, value: &str) -> Result<(), &'static str> {
    let path = Path::new(value);
    if path.is_absolute() {
        return match field {
            "components.legacyNode.root" => Err("components.legacyNode.root must be relative"),
            _ => Err("components.legacyNode.entry must be relative"),
        };
    }
    if path.components().any(|component| {
        matches!(
            component,
            Component::ParentDir | Component::RootDir | Component::Prefix(_)
        )
    }) {
        return match field {
            "components.legacyNode.root" => {
                Err("components.legacyNode.root must not traverse outside the release")
            }
            _ => Err("components.legacyNode.entry must not traverse outside the legacy root"),
        };
    }
    Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TargetInfo {
    pub os: String,
    pub arch: String,
    #[serde(default)]
    pub libc: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct EntriesInfo {
    pub fgos: String,
    #[serde(default)]
    pub fgos_runner: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ComponentsInfo {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub native_addon: Option<NativeAddonComponent>,
    pub legacy_node: LegacyNodeComponent,
    #[serde(default)]
    pub runner: Option<RunnerComponent>,
    #[serde(default)]
    pub workshop: Option<WorkshopComponent>,
}

/// Legacy Node payload component locator.
///
/// Invariant: `root` and `entry` are the only legacy Node locator in the release tree.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct LegacyNodeComponent {
    pub root: String,
    pub entry: String,
    pub digest: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RunnerComponent {
    pub path: String,
    pub digest: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct WorkshopComponent {
    #[serde(default)]
    pub skills_digest: Option<String>,
    #[serde(default)]
    pub agents_digest: Option<String>,
    #[serde(default)]
    pub prose_digest: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RequiresInfo {
    #[serde(default)]
    pub node: Option<String>,
    #[serde(default)]
    pub git: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct StateSchemasInfo {
    #[serde(default)]
    pub read: Vec<String>,
    #[serde(default)]
    pub write: Vec<String>,
    #[serde(default)]
    pub migrations: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ManifestFileEntry {
    pub path: String,
    pub kind: String,
    pub digest: String,
    pub mode: String,
    pub class: String,
}

#[derive(Debug, thiserror::Error)]
pub enum ManifestReadError {
    #[error("manifest file not found: {0}")]
    NotFound(std::path::PathBuf),
    #[error("io error reading manifest: {0}")]
    Io(#[from] std::io::Error),
    #[error("json deserialization error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("invalid manifest invariant: {0}")]
    InvalidInvariant(&'static str),
}

pub fn parse_manifest_str(json_str: &str) -> Result<ReleaseManifest, serde_json::Error> {
    serde_json::from_str(json_str)
}

pub fn read_manifest_from_path(manifest_path: &Path) -> Result<ReleaseManifest, ManifestReadError> {
    if !manifest_path.exists() {
        return Err(ManifestReadError::NotFound(manifest_path.to_path_buf()));
    }
    let content = std::fs::read_to_string(manifest_path)?;
    let manifest = parse_manifest_str(&content)?;
    manifest
        .validate_v1_invariants()
        .map_err(ManifestReadError::InvalidInvariant)?;
    Ok(manifest)
}

pub fn read_manifest_from_dir(release_dir: &Path) -> Result<ReleaseManifest, ManifestReadError> {
    read_manifest_from_path(&release_dir.join("manifest.json"))
}

/// Node-API 8 combined Git/Event Store payload; digests here are raw lowercase hex.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct NativeAddonComponent {
    pub path: String,
    pub digest: String,
    pub target: String,
    pub napi_version: u32,
    pub crate_checksums: std::collections::BTreeMap<String, String>,
}

/// The locked crates.io inputs of the ABI toolchain, embedded in the verifier.
pub fn native_addon_crate_checksums() -> std::collections::BTreeMap<String, String> {
    include_str!("../../../../Cargo.lock")
        .split("[[package]]")
        .filter_map(|package| {
            let field = |name: &str| {
                package.lines().find_map(|line| {
                    line.strip_prefix(&format!("{name} = \""))
                        .and_then(|value| value.strip_suffix('"'))
                })
            };
            let name = field("name")?;
            if !["napi", "napi-derive", "napi-build"].contains(&name) {
                return None;
            }
            Some((
                format!("{}@{}", name, field("version")?),
                field("checksum")?.to_string(),
            ))
        })
        .collect()
}
