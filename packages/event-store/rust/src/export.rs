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
    let mut builder = fs::DirBuilder::new();
    #[cfg(unix)]
    {
        use std::os::unix::fs::DirBuilderExt;
        builder.mode(0o700);
    }
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
fn allowed(path: &str) -> bool {
    let p: Vec<_> = path.split('/').collect();
    let safe = |s: &str| {
        !s.is_empty()
            && s != "."
            && s != ".."
            && s.bytes()
                .all(|b| b.is_ascii_alphanumeric() || b"._-".contains(&b))
    };
    p.iter().all(|s| safe(s))
        && (path == "events.jsonl"
            || path == "seal.json"
            || (p.len() == 2 && p[0] == "events" && p[1].strip_suffix(".jsonl").is_some_and(safe))
            || (p.len() >= 2 && p[0] == "porting" && p.last() == Some(&"events.jsonl")))
}
fn legacy_value(e: &Envelope) -> Value {
    // Dropping v4 h is essential: the old reader verifies its own 16-hex hash rule.
    json!({"seq":e.seq,"ts":e.ts,"type":e.event_type,"payload":e.payload,"v":3,"src":e.src})
}
/// Return both orders to the consumer adapter, which alone owns its reducers.
/// Legacy files are authenticated at the tracked D18 pin and preserved byte for byte.
pub fn export_legacy_layout(
    port: &dyn Inspect,
    repo: &RepoHandle,
    req: ExportRequest<'_>,
) -> Result<Value, Error> {
    let got = query(port, repo, &req)?;
    if crate::fence::pinned_legacy(port, repo)?.is_none() && !got.legacy.is_empty() {
        return Err(invalid("legacy-layout requires the tracked legacy pin"));
    }
    let mut files = BTreeMap::<String, Vec<u8>>::new();
    if let Some(pin) = crate::fence::pinned_legacy(port, repo)? {
        let mut cursor = None;
        loop {
            let page = port
                .list_tree(repo, &pin, b"", cursor, 1024)
                .map_err(git_error)?;
            for entry in page.entries {
                let path = std::str::from_utf8(&entry.path)
                    .map_err(|_| invalid("non-UTF8 export path"))?;
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
    let mut ordered: Vec<LegacyEvent> = Vec::new();
    for (name, bytes) in &files {
        if name != "seal.json" {
            ordered.extend(legacy::parse_file(
                if name == "events.jsonl" { "" } else { name },
                std::str::from_utf8(bytes).map_err(|_| invalid("legacy UTF8"))?,
            )?);
        }
    }
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
        let key = e.stream.replace(':', "-");
        streams
            .entry(key)
            .or_default()
            .extend(line(&legacy_value(e))?);
    }
    for (stream, bytes) in streams {
        let name = format!("events/v4-{stream}.jsonl");
        if files.contains_key(&name) {
            return Err(invalid("v4 export name collides with legacy file"));
        }
        ordered.extend(legacy::parse_file(
            &name,
            std::str::from_utf8(&bytes).map_err(|_| invalid("export UTF8"))?,
        )?);
        files.insert(name, bytes);
    }
    destination(req.out)?;
    for (name, bytes) in &files {
        write(req.out, name, bytes)?;
    }
    let modern: Vec<Value> = got
        .legacy
        .iter()
        .map(|e| e.event.clone())
        .chain(got.sequence.iter().map(legacy_value))
        .collect();
    Ok(
        json!({"out":req.out,"files":files.keys().collect::<Vec<_>>(),"legacyOrder":legacy::order(ordered).into_iter().map(|e| e.event).collect::<Vec<_>>(),"v4Order":modern,"deferred":got.deferred,"missing":got.missing}),
    )
}
