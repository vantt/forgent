//! Export uses the verified reader, never a Git driver.
use crate::{
    cursor::Cursor,
    envelope::line,
    errors::{invalid, io, Error},
    layout::{Layout, StreamId},
    read::{self, ReadRequest},
};
use fgos_git::{Inspect, RepoHandle};
use serde_json::{json, Value};
use std::{
    fs::{self},
    path::{Component, Path},
};

pub struct ExportRequest<'a> {
    pub layout: &'a Layout,
    pub origin: &'a str,
    pub machine: &'a str,
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
            machine: req.machine,
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
}
