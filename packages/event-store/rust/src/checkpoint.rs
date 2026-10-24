//! A rebuildable cross-process record of the history one complete read folded.
//!
//! The file is a cache, never truth: the store is. It holds the read's cursor
//! and the ordered events that cursor covers, so a later process continues from
//! it and walks only the sealed commits added since. A reader accepts it only
//! after the checks here and in `read`; anything else is ignored and the read
//! walks from zero and writes a fresh one. Writers replace the file atomically,
//! so a concurrent reader sees the old file or the new one, never a mix.
use crate::{
    append::Positions,
    cursor::Cursor,
    envelope::{line, Envelope},
    order::stream_key,
};
use serde::{Deserialize, Serialize};
use std::{
    collections::BTreeSet,
    path::{Path, PathBuf},
};

const VERSION: u8 = 1;
/// A larger file is not read: the history it would hold no longer fits a cache.
const MAX_BYTES: u64 = 256 * 1024 * 1024;

/// Where a read may find and replace its checkpoint.
#[derive(Debug, Clone)]
pub struct Checkpoint {
    pub path: PathBuf,
    /// `false` verifies from zero (a rebuild) and still replaces the file.
    pub reuse: bool,
}

/// What a read did with its checkpoint.
#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct CheckpointReport {
    /// The read continued from the file and walked only what it lacked.
    pub continued: bool,
    /// Why a present file was not used.
    pub ignored: Option<String>,
    pub written: bool,
    /// A cache that cannot be written never fails the read.
    pub write_error: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct File {
    v: u8,
    store_id: String,
    cursor: Cursor,
    events: Vec<Envelope>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct FileRef<'a> {
    v: u8,
    store_id: &'a str,
    cursor: &'a Cursor,
    events: &'a [Envelope],
}

/// History a previous complete read folded, with the cursor that covers it.
pub(crate) struct Retained {
    pub cursor: Cursor,
    pub folded: Vec<Envelope>,
}

/// `Ok(None)` when there is no file; `Err(reason)` when there is one that must
/// not be used. Only facts the file can prove about itself are checked here;
/// its agreement with the refs and the local files is checked by the read.
pub(crate) fn load(
    path: &Path,
    store_id: &str,
    query: &BTreeSet<String>,
    project: bool,
) -> Result<Option<Retained>, String> {
    load_checked(path, store_id, Some((query, project)))
}

/// `load` for a caller that takes whatever query the file answers.
fn load_checked(
    path: &Path,
    store_id: &str,
    expected: Option<(&BTreeSet<String>, bool)>,
) -> Result<Option<Retained>, String> {
    let bytes = match std::fs::metadata(path) {
        Ok(meta) if meta.len() > MAX_BYTES => return Err("checkpoint too large".into()),
        Ok(_) => match std::fs::read(path) {
            Ok(bytes) => bytes,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(None),
            Err(e) => return Err(format!("checkpoint unreadable: {e}")),
        },
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(e) => return Err(format!("checkpoint unreadable: {e}")),
    };
    let file: File = serde_json::from_slice(&bytes).map_err(|e| format!("checkpoint: {e}"))?;
    if file.v != VERSION {
        return Err("checkpoint version differs".into());
    }
    if file.store_id != store_id {
        return Err("checkpoint belongs to another store".into());
    }
    // The cursor passes the same validation as one a consumer hands in.
    let cursor = line(&file.cursor)
        .and_then(|canonical| Cursor::parse(&canonical))
        .map_err(|e| format!("checkpoint cursor: {e}"))?;
    if expected.is_some_and(|(query, project)| cursor.streams != *query || cursor.project_order != project)
    {
        return Err("checkpoint answers another query".into());
    }
    if !cursor.deferred.is_empty() {
        return Err("checkpoint holds a deferred read".into());
    }
    let bound: BTreeSet<&str> = cursor.verified_tips.values().map(String::as_str).collect();
    let certified: BTreeSet<&str> = cursor.certified.iter().map(String::as_str).collect();
    if bound.is_empty() || bound != certified {
        return Err("checkpoint certifies commits no verified ref names".into());
    }
    let mut cover = Positions::new();
    for event in &file.events {
        cover
            .entry(stream_key(event))
            .and_modify(|n| *n = (*n).max(event.seq))
            .or_insert(event.seq);
    }
    if cover != cursor.cover {
        return Err("checkpoint coverage differs from its events".into());
    }
    Ok(Some(Retained {
        cursor,
        folded: file.events,
    }))
}

/// Replace the file with this complete read. The directory is created when absent.
pub(crate) fn store(
    path: &Path,
    store_id: &str,
    cursor: &Cursor,
    events: &[Envelope],
) -> Result<(), String> {
    let dir = path.parent().ok_or("checkpoint path has no directory")?;
    let name = path
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or("checkpoint path has no file name")?;
    std::fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    let bytes = serde_json::to_vec(&FileRef {
        v: VERSION,
        store_id,
        cursor,
        events,
    })
    .map_err(|e| e.to_string())?;
    fgos_durable_file::replace_durably(dir, name, &bytes).map_err(|failure| {
        if let Some(temporary) = &failure.temporary {
            let _ = std::fs::remove_file(temporary);
        }
        failure.to_string()
    })?;
    Ok(())
}

/// Extend the file with commits a seal just published and verified, so the next
/// process continues from them instead of walking them again. Applies only to a
/// valid file whose verified tip of `reference` is `before`; any other file is
/// left for a read to rebuild. `Ok(false)` means the file was not extended.
///
/// The history it writes is exactly what a read of the new tip would fold: the
/// file's events plus the walked ones, ordered by the same rule, with the ref's
/// verified tip moved to `after`. A history that would defer or lack an event
/// is not written.
pub(crate) fn advance(
    path: &Path,
    store_id: &str,
    reference: &str,
    before: &str,
    after: &str,
    published: &[Envelope],
) -> Result<bool, String> {
    let Some(file) = load_checked(path, store_id, None)? else {
        return Ok(false);
    };
    let mut cursor = file.cursor;
    if cursor.verified_tips.get(reference).map(String::as_str) != Some(before) {
        return Ok(false);
    }
    let mut union = file.folded;
    union.extend(published.iter().cloned());
    let ordered = crate::read::fold_history(union, &cursor.streams, cursor.project_order, None)
        .map_err(|e| e.to_string())?;
    if !ordered.deferred.is_empty() || !ordered.missing.is_empty() {
        return Ok(false);
    }
    cursor.cover = Positions::new();
    for e in &ordered.events {
        cursor
            .cover
            .entry(stream_key(e))
            .and_modify(|n| *n = (*n).max(e.seq))
            .or_insert(e.seq);
    }
    cursor
        .verified_tips
        .insert(reference.to_owned(), after.to_owned());
    cursor.certified = cursor.verified_tips.values().cloned().collect();
    store(path, store_id, &cursor, &ordered.events)?;
    Ok(true)
}
