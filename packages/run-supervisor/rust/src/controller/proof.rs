//! The two ways the controller publishes a JSON file (`publishImmutableProof`, `publishMutableProjection` of
//! `src/native/proof-helpers.mjs`): once by exclusive link, or replaced atomically; both pretty-printed with a
//! trailing newline, mode 0644.

use fgos_durable_file::{install_once_with_mode, replace_durably_with_mode, Installed};
use serde_json::Value;
use std::fs;
use std::io;
use std::path::Path;

fn content_of(record: &Value) -> io::Result<Vec<u8>> {
    let mut text = serde_json::to_string_pretty(record).map_err(io::Error::other)?;
    text.push('\n');
    Ok(text.into_bytes())
}

fn split(target: &Path) -> io::Result<(&Path, &str)> {
    let dir = target
        .parent()
        .ok_or_else(|| io::Error::other("target has no parent"))?;
    let name = target
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| io::Error::other("target has no name"))?;
    Ok((dir, name))
}

/// Publish `record` at `target` once; `false` when a file is already there (it stands, never overwritten).
pub fn publish_immutable_proof(target: &Path, record: &Value) -> io::Result<bool> {
    let (dir, name) = split(target)?;
    fs::create_dir_all(dir)?;
    match install_once_with_mode(dir, name, &content_of(record)?, 0o644) {
        Ok(installed) => Ok(installed == Installed::Created),
        Err(err) => Err(err.source),
    }
}

/// Replace `target` atomically with `record`.
pub fn publish_mutable_projection(target: &Path, record: &Value) -> io::Result<()> {
    let (dir, name) = split(target)?;
    fs::create_dir_all(dir)?;
    replace_durably_with_mode(dir, name, &content_of(record)?, 0o644)
        .map(|_| ())
        .map_err(|e| e.source)
}
