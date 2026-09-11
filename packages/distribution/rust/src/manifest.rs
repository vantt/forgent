//! Manifest types for fgOS release distributions.
//!
//! Matches `docs/architect/packaging-distribution/runtime-identity-and-activation.md` §5.

use serde::{Deserialize, Serialize};
use std::path::Path;

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
    pub files: Vec<ManifestFileEntry>,
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
    pub legacy_node: LegacyNodeComponent,
    #[serde(default)]
    pub runner: Option<RunnerComponent>,
    #[serde(default)]
    pub workshop: Option<WorkshopComponent>,
}

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
    Ok(manifest)
}

pub fn read_manifest_from_dir(release_dir: &Path) -> Result<ReleaseManifest, ManifestReadError> {
    read_manifest_from_path(&release_dir.join("manifest.json"))
}
