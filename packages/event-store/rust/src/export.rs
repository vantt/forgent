//! Export uses the verified reader and the frozen legacy order, never a Git driver.
use crate::{
    cursor::Cursor,
    envelope::{line, Envelope},
    errors::{invalid, io, Error},
    layout::{Layout, StreamId},
    legacy::{self, LegacyEvent},
    read::{self, ReadRequest},
    walk::{blob, git_error},
};
use fgos_git::{Inspect, ObjectType, RepoHandle};
use serde_json::{json, Value};
use std::{
    collections::BTreeMap,
    fs::{self},
    path::{Component, Path},
};

pub struct ExportRequest<'a> {
    pub layout: &'a Layout,
    pub origin: &'a str,
    pub streams: &'a [StreamId],
    pub since: &'a Cursor,
    pub out: &'a Path,
}
/// Never overwrite an existing destination, including a dangling symlink.
fn destination(out: &Path) -> Result<(), Error> {
    if !out.is_absolute()
        || out
            .components()
            .any(|c| matches!(c, Component::ParentDir | Component::CurDir))
    {
        return Err(invalid(
            "absolute export destination without dot components required",
        ));
    }
    let mut parent = out.parent();
    while let Some(p) = parent {
        let m = fs::symlink_metadata(p).map_err(io)?;
        if !m.is_dir() || m.file_type().is_symlink() {
            return Err(invalid("export parent must be a real directory"));
        }
        parent = p.parent();
    }
    #[cfg(unix)]
    let builder = {
        use std::os::unix::fs::DirBuilderExt;
        let mut builder = fs::DirBuilder::new();
        builder.mode(0o700);
        builder
    };
    #[cfg(not(unix))]
    let builder = fs::DirBuilder::new();
    builder.create(out).map_err(io)?;
    Ok(())
}
fn write(out: &Path, name: &str, bytes: &[u8]) -> Result<(), Error> {
    let mut parent = out.to_path_buf();
    let parts: Vec<_> = name.split('/').collect();
    if parts
        .iter()
        .any(|p| p.is_empty() || *p == "." || *p == ".." || p.contains('\\'))
    {
        return Err(invalid("unsafe export path"));
    }
    for part in &parts[..parts.len() - 1] {
        parent.push(part);
        match fs::create_dir(&parent) {
            Ok(()) => (),
            Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => {
                if !fs::symlink_metadata(&parent).map_err(io)?.is_dir() {
                    return Err(invalid("export path is not a directory"));
                }
            }
            Err(e) => return Err(io(e)),
        }
    }
    if fgos_durable_file::install_once_with_mode(&parent, parts.last().unwrap(), bytes, 0o600)
        .map_err(Error::from_install_error)?
        != fgos_durable_file::Installed::Created
    {
        return Err(invalid("export file already exists"));
    }
    Ok(())
}
fn query(
    port: &dyn Inspect,
    repo: &RepoHandle,
    req: &ExportRequest<'_>,
) -> Result<read::ReadResult, Error> {
    read::read(
        port,
        repo,
        ReadRequest {
            layout: req.layout,
            origin: req.origin,
            streams: req.streams,
            cursor: &Cursor::default(),
            folded: &[],
            project: true,
        },
    )
}
pub fn export_jsonl(
    port: &dyn Inspect,
    repo: &RepoHandle,
    req: ExportRequest<'_>,
) -> Result<Value, Error> {
    let got = query(port, repo, &req)?;
    let mut bytes = Vec::new();
    if req.since.legacy_digest != got.cursor.legacy_digest {
        for e in &got.legacy {
            bytes.extend_from_slice(e.raw.as_bytes());
            bytes.push(b'\n');
        }
    }
    for e in &got.sequence {
        if e.seq
            > req
                .since
                .cover
                .get(&crate::order::stream_key(e))
                .copied()
                .unwrap_or(0)
        {
            bytes.extend(line(e)?);
        }
    }
    destination(req.out)?;
    write(req.out, "events.jsonl", &bytes)?;
    Ok(json!({"out":req.out,"cursor":got.cursor,"deferred":got.deferred,"missing":got.missing}))
}
pub(crate) fn allowed(path: &str) -> bool {
    let p: Vec<_> = path.split('/').collect();
    let safe = |s: &str| {
        let stem = s.split('.').next().unwrap_or("").to_ascii_uppercase();
        let device = matches!(stem.as_str(), "CON" | "PRN" | "AUX" | "NUL")
            || stem
                .strip_prefix("COM")
                .or_else(|| stem.strip_prefix("LPT"))
                .is_some_and(|n| n.len() == 1 && "123456789".contains(n));
        !s.is_empty()
            && s != "."
            && s != ".."
            && !device
            && !s.ends_with(['.', ' '])
            && !s
                .chars()
                .any(|c| c.is_control() || "\\:<>\"|?*".contains(c))
    };
    p.iter().all(|s| safe(s))
        && (path == "events.jsonl"
            || path == "seal.json"
            || (p.len() == 2 && p[0] == "events" && p[1].strip_suffix(".jsonl").is_some_and(safe))
            || (p.len() >= 2 && p[0] == "porting" && p.last() == Some(&"events.jsonl")))
}
fn legacy_value(e: &Envelope) -> Value {
    // Dropping v4 h is essential: the old reader verifies its own 16-hex hash rule.
    json!({"seq":e.seq,"ts":e.ts,"type":e.event_type,"payload":e.payload,"v":3,"src":e.src,"eventStoreId":format!("{}:{}:{}",e.origin,e.stream,e.seq)})
}
/// Return both orders to the consumer adapter, which alone owns its reducers.
/// Legacy files are authenticated at the tracked D18 pin and preserved byte for byte.
pub fn export_legacy_layout(
    port: &dyn Inspect,
    repo: &RepoHandle,
    req: ExportRequest<'_>,
) -> Result<Value, Error> {
    if req
        .streams
        .iter()
        .any(|s| s.scope() != crate::envelope::Scope::Project)
    {
        return Err(invalid("legacy-layout accepts only project streams"));
    }
    let got = query(port, repo, &req)?;
    if crate::fence::pinned_legacy(port, repo)?.is_none() && !got.legacy.is_empty() {
        return Err(invalid("legacy-layout requires the tracked legacy pin"));
    }
    let mut files = BTreeMap::<String, Vec<u8>>::new();
    if let Some(pin) = crate::fence::pinned_legacy(port, repo)? {
        let mut cursor = None;
        loop {
            let page = port
                .list_tree(repo, &pin, b"", cursor, 100_000)
                .map_err(git_error)?;
            for entry in page.entries {
                let path = std::str::from_utf8(&entry.path)
                    .map_err(|_| invalid("non-UTF8 export path"))?;
                if entry.kind == ObjectType::Tree
                    && entry.mode == 0o040000
                    && (path == "events"
                        || path == "porting"
                        || allowed(&format!("{path}/events.jsonl")))
                {
                    continue;
                }
                if !allowed(path) || entry.mode != 0o100644 || entry.kind != ObjectType::Blob {
                    return Err(invalid("unsafe legacy tree entry"));
                }
                let bytes = blob(port, repo, &pin, &entry.path)?
                    .ok_or_else(|| invalid("legacy blob missing"))?;
                files.insert(path.into(), bytes);
            }
            if page.complete {
                break;
            }
            cursor = Some(
                page.next_cursor
                    .ok_or_else(|| invalid("tree continuation missing"))?,
            );
        }
    }
    let historical_porting: Vec<_> = files
        .keys()
        .filter(|p| p.starts_with("porting/") && p.ends_with("/events.jsonl"))
        .cloned()
        .collect();
    if historical_porting.len() > 1 {
        return Err(invalid(
            "multiple historical porting logs; rollback requires owner decision",
        ));
    }
    let porting_target = historical_porting
        .first()
        .map(String::as_str)
        .unwrap_or("porting/events.jsonl");
    let mut streams = BTreeMap::<String, Vec<u8>>::new();
    for e in &got.sequence {
        if e.seq
            <= req
                .since
                .cover
                .get(&crate::order::stream_key(e))
                .copied()
                .unwrap_or(0)
        {
            continue;
        }
        if !matches!(e.stream.as_str(), "project" | "project:porting") {
            return Err(invalid("unsupported legacy project stream"));
        }
        let name = if e.stream == "project:porting" {
            porting_target
        } else {
            "events/v4-project.jsonl"
        };
        streams
            .entry(name.into())
            .or_default()
            .extend(line(&legacy_value(e))?);
    }
    for (name, bytes) in streams {
        if name.starts_with("porting/") {
            let historical = files.entry(name).or_default();
            if !historical.is_empty() && !historical.ends_with(b"\n") {
                historical.push(b'\n');
            }
            historical.extend(bytes);
        } else if files.insert(name, bytes).is_some() {
            return Err(invalid("v4 export name collides with legacy file"));
        }
    }
    let mut ordered: Vec<LegacyEvent> = Vec::new();
    for (name, bytes) in &files {
        if name == "events.jsonl" || name.starts_with("events/") {
            ordered.extend(legacy::parse_file(
                if name == "events.jsonl" {
                    ""
                } else {
                    name.rsplit('/').next().unwrap()
                },
                std::str::from_utf8(bytes).map_err(|_| invalid("legacy UTF8"))?,
            )?);
        }
    }
    destination(req.out)?;
    for (name, bytes) in &files {
        write(req.out, name, bytes)?;
    }
    let modern: Vec<Value> = got
        .legacy
        .iter()
        .filter(|e| e.provenance.file == "events.jsonl" || e.provenance.file.starts_with("events/"))
        .map(|e| e.event.clone())
        .chain(
            got.sequence
                .iter()
                .filter(|e| e.stream == "project")
                .map(legacy_value),
        )
        .collect();
    let modern_porting: Vec<Value> = got
        .legacy
        .iter()
        .filter(|e| e.provenance.file.starts_with("porting/"))
        .map(|e| e.event.clone())
        .chain(
            got.sequence
                .iter()
                .filter(|e| e.stream == "project:porting")
                .map(legacy_value),
        )
        .collect();
    Ok(
        json!({"v4PortingOrder":modern_porting,"out":req.out,"files":files.keys().collect::<Vec<_>>(),"legacyOrder":legacy::order(ordered).into_iter().map(|e| e.event).collect::<Vec<_>>(),"v4Order":modern,"deferred":got.deferred,"missing":got.missing}),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn export_paths_are_portable_to_windows() {
        for p in [
            "porting/CON/events.jsonl",
            "porting/a:b/events.jsonl",
            "porting/Lpt1.txt/events.jsonl",
            "porting/trailing./events.jsonl",
            "events/NUL.jsonl",
        ] {
            assert!(!allowed(p), "{p}");
        }
        assert!(allowed(
            "porting/docs/distillery/state/porting/events.jsonl"
        ));
    }
    #[test]
    fn converted_origins_keep_distinct_legacy_identities() {
        let event: Envelope = serde_json::from_value(json!({
            "v":4,"type":"work.add","scope":"project","origin":"first",
            "stream":"project","seq":1,"seen":{},"ts":"2026-10-19T00:00:00.000Z",
            "src":"fixture","schemaVersion":1,"payload":{"id":"one"},"h":"unused"
        }))
        .unwrap();
        let mut other = event.clone();
        other.origin = "second".into();
        let mut bytes = line(&legacy_value(&event)).unwrap();
        bytes.extend(line(&legacy_value(&other)).unwrap());
        let parsed =
            legacy::parse_file("v4-project.jsonl", std::str::from_utf8(&bytes).unwrap()).unwrap();
        assert_eq!(legacy::order(parsed).len(), 2);
        assert!(legacy_value(&event).get("h").is_none());
    }
}
