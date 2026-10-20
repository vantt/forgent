//! Marker-closed local batches, read in the direction active -> closed.
use crate::{
    envelope::{sha256, BatchCommit, Envelope},
    errors::{invalid, io, Error, ErrorCode},
    fsio::{point, FileSystem, OsFileSystem, Point},
    layout::{Layout, StreamId, StreamLayout},
};
use std::{
    collections::{BTreeMap, BTreeSet},
    fs::{self, File},
    io::Read,
    path::{Path, PathBuf},
};

#[derive(Debug, Default, Clone)]
pub struct Framed {
    pub events: Vec<Envelope>,
    pub committed_len: usize,
}
// One verified frame per thread, keyed by exact bytes and decoding authority.
// Every read still reads the file. Neither metadata nor a hash establishes
// integrity; a changed byte (including a torn suffix) runs the verifier again.
struct VerifiedFrame {
    bytes: Vec<u8>,
    origin: String,
    stream: String,
    strict: bool,
    frame: Framed,
}
thread_local! {
    static VERIFIED: std::cell::RefCell<Option<VerifiedFrame>> = const { std::cell::RefCell::new(None) };
}
/// An active suffix is speculative, including complete event lines and
/// an incomplete line. A complete marker after a failure proves corruption.
/// Immutable segments instead require complete, valid framing through EOF.
pub fn decode(
    bytes: &[u8],
    origin: &str,
    stream: &StreamId,
    strict: bool,
) -> Result<Framed, Error> {
    let prefix = VERIFIED.with(|slot| {
        slot.borrow()
            .as_ref()
            .filter(|cached| {
                cached.origin == origin
                    && cached.stream == stream.as_str()
                    && cached.strict == strict
                    && bytes.starts_with(&cached.bytes[..cached.frame.committed_len])
            })
            .map(|cached| cached.frame.clone())
    });
    // Only marker-closed bytes are reusable. Compare the actual prefix on every
    // read; a rewritten prefix falls back to full verification. Speculative
    // suffixes are always decoded again, including a newly completed marker.
    let frame = if let Some(mut prefix) = prefix {
        let suffix = decode_verified(&bytes[prefix.committed_len..], origin, stream, strict)?;
        if prefix
            .events
            .last()
            .zip(suffix.events.first())
            .is_some_and(|(a, b)| a.seq.checked_add(1) != Some(b.seq))
        {
            return Err(Error::new(
                ErrorCode::EventStoreSeqRecoveryConflict,
                "committed active batches have gap or overlap",
            ));
        }
        prefix.committed_len += suffix.committed_len;
        prefix.events.extend(suffix.events);
        prefix
    } else {
        decode_verified(bytes, origin, stream, strict)?
    };
    // Bound retained memory; large immutable histories are never retained.
    VERIFIED.with(|slot| {
        *slot.borrow_mut() = (bytes.len() <= 4 * 1024 * 1024).then(|| VerifiedFrame {
            bytes: bytes.to_vec(),
            origin: origin.into(),
            stream: stream.as_str().into(),
            strict,
            frame: frame.clone(),
        })
    });
    Ok(frame)
}
fn decode_verified(
    bytes: &[u8],
    origin: &str,
    stream: &StreamId,
    strict: bool,
) -> Result<Framed, Error> {
    let mut out = Framed::default();
    let mut pending: Vec<Envelope> = Vec::new();
    let mut batch_start = 0;
    let mut offset = 0;
    for raw in bytes.split_inclusive(|b| *b == b'\n') {
        offset += raw.len();
        if !raw.ends_with(b"\n") {
            break;
        }
        let parsed = (|| -> Result<bool, Error> {
            // Only the marker has kind. Event payload fields stay opaque.
            let value: serde_json::Value =
                serde_json::from_slice(raw).map_err(|e| invalid(e.to_string()))?;
            if value.get("kind").is_some() {
                let marker: BatchCommit =
                    serde_json::from_slice(raw).map_err(|e| invalid(e.to_string()))?;
                if marker.canonical_line()? != raw
                    || marker.origin != origin
                    || marker.stream != stream.as_str()
                    || pending.is_empty()
                    || marker.count != pending.len() as u64
                    || marker.first_seq != pending[0].seq
                    || marker.last_seq != pending.last().unwrap().seq
                    || marker.sha256 != sha256(&bytes[batch_start..offset - raw.len()])
                {
                    return Err(invalid("batch marker mismatch"));
                }
                if pending
                    .windows(2)
                    .any(|pair| pair[0].seq.checked_add(1) != Some(pair[1].seq))
                {
                    return Err(Error::new(
                        ErrorCode::EventStoreSeqRecoveryConflict,
                        "committed batch has a gap or overlap",
                    ));
                }
                if out
                    .events
                    .last()
                    .is_some_and(|e| e.seq.checked_add(1) != Some(pending[0].seq))
                {
                    return Err(Error::new(
                        ErrorCode::EventStoreSeqRecoveryConflict,
                        "committed active batches have gap or overlap",
                    ));
                }
                out.events.append(&mut pending);
                out.committed_len = offset;
                batch_start = offset;
                Ok(true)
            } else {
                let event = Envelope::parse(raw)?;
                if event.origin != origin || event.stream != stream.as_str() {
                    return Err(invalid("open-log event identity mismatch"));
                }
                pending.push(event);
                Ok(false)
            }
        })();
        if let Err(e) = parsed {
            if e.code == ErrorCode::EventStoreSeqRecoveryConflict {
                return Err(e);
            }
            if bytes[batch_start..]
                .split_inclusive(|b| *b == b'\n')
                .any(|line| {
                    line.ends_with(b"\n")
                        && serde_json::from_slice::<BatchCommit>(line)
                            .is_ok_and(|marker| marker.kind == "batch-commit")
                })
            {
                return Err(Error::new(
                    ErrorCode::EventStoreIntegrity,
                    "damaged batch before a complete commit marker",
                ));
            }
            if strict {
                return Err(e);
            }
            break;
        }
    }
    if strict && out.committed_len != bytes.len() {
        return Err(invalid("uncommitted immutable segment suffix"));
    }
    Ok(out)
}

pub(crate) fn read_optional(path: &Path) -> Result<Option<Vec<u8>>, Error> {
    // One opened descriptor remains valid across a rotation rename.
    let mut file = match File::open(path) {
        Ok(f) => f,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(e) => return Err(io(e)),
    };
    let mut bytes = Vec::new();
    file.read_to_end(&mut bytes).map_err(io)?;
    Ok(Some(bytes))
}
pub(crate) fn segments(layout: &StreamLayout) -> Result<Vec<(u64, u64, PathBuf)>, Error> {
    let entries = match fs::read_dir(layout.closed()) {
        Ok(e) => e,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(Vec::new()),
        Err(e) => return Err(io(e)),
    };
    let mut out = Vec::new();
    for entry in entries {
        let entry = entry.map_err(io)?;
        let name = entry.file_name();
        let name = name
            .to_str()
            .ok_or_else(|| invalid(format!("non-UTF8 segment: {}", entry.path().display())))?;
        let (first, last) = name
            .strip_suffix(".jsonl")
            .and_then(|n| n.split_once('-'))
            .ok_or_else(|| {
                invalid(format!(
                    "invalid closed segment name: {}",
                    entry.path().display()
                ))
            })?;
        let first: u64 = first
            .parse()
            .map_err(|_| invalid(format!("invalid segment first: {}", entry.path().display())))?;
        let last: u64 = last
            .parse()
            .map_err(|_| invalid(format!("invalid segment last: {}", entry.path().display())))?;
        if first == 0 || last < first || name != format!("{first}-{last}.jsonl") {
            return Err(invalid(format!(
                "invalid closed segment range: {}",
                entry.path().display()
            )));
        }
        out.push((first, last, entry.path()));
    }
    out.sort_by_key(|(first, last, _)| (*first, *last));
    Ok(out)
}
pub(crate) fn closed(
    bytes: &[u8],
    origin: &str,
    stream: &StreamId,
    first: u64,
    last: u64,
) -> Result<Framed, Error> {
    let framed = decode(bytes, origin, stream, true)?;
    if framed.events.first().map(|e| e.seq) != Some(first)
        || framed.events.last().map(|e| e.seq) != Some(last)
    {
        return Err(invalid("closed filename differs from contents"));
    }
    Ok(framed)
}
#[derive(Debug, Default)]
pub struct OpenRead {
    pub events: Vec<Envelope>,
    pub vanished: Vec<(u64, u64, PathBuf)>,
}
/// Steps 1-2 only; phase 03 fills gaps through the publication reader. A vanished
/// segment is evidence for that reader, never permission to skip a sequence.
pub fn read_own(layout: &Layout, origin: &str, stream: &StreamId) -> Result<OpenRead, Error> {
    read_own_with_fs(layout, origin, stream, &OsFileSystem)
}
/// The same real-file reader with protocol-boundary injection for race proofs.
pub fn read_own_with_fs(
    layout: &Layout,
    origin: &str,
    stream: &StreamId,
    fs: &dyn FileSystem,
) -> Result<OpenRead, Error> {
    let paths = layout.stream(stream);
    let mut active = Vec::new();
    match File::open(paths.active()) {
        Ok(mut file) => {
            point(fs, Point::AfterActiveOpen)?;
            file.read_to_end(&mut active).map_err(io)?;
        }
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => (),
        Err(e) => return Err(io(e)),
    }
    point(fs, Point::AfterActiveRead)?;
    let mut events = decode(&active, origin, stream, false)?.events;
    let mut vanished = Vec::new();
    let listed = segments(&paths)?;
    point(fs, Point::AfterClosedList)?;
    for (first, last, path) in listed {
        match read_optional(&path)? {
            Some(bytes) => events.extend(closed(&bytes, origin, stream, first, last)?.events),
            None => vanished.push((first, last, path)),
        }
    }
    let mut hashes = BTreeSet::new();
    let mut by_seq: BTreeMap<u64, Envelope> = BTreeMap::new();
    for event in events {
        if !hashes.insert(event.h.clone()) {
            continue;
        }
        if by_seq.contains_key(&event.seq) {
            return Err(Error::new(
                ErrorCode::EventStoreSeqConflict,
                "different hashes at one own-stream sequence",
            ));
        }
        by_seq.insert(event.seq, event);
    }
    Ok(OpenRead {
        events: by_seq.into_values().collect(),
        vanished,
    })
}
/// Pure local bounded read; the on-disk receipt detects deleted tails.
pub fn read_in_gate(
    layout: &Layout,
    origin: &str,
    stream: &StreamId,
    cursor_seq: u64,
) -> Result<OpenRead, Error> {
    read_in_gate_with_fs(layout, origin, stream, cursor_seq, &OsFileSystem)
}
/// Bounded reader with the same real-file boundary observer as the own reader.
pub fn read_in_gate_with_fs(
    layout: &Layout,
    origin: &str,
    stream: &StreamId,
    cursor_seq: u64,
    fs: &dyn FileSystem,
) -> Result<OpenRead, Error> {
    let mut result = read_own_with_fs(layout, origin, stream, fs)?;
    let receipt = crate::append::read_last_seq(&layout.stream(stream).sealed())?.unwrap_or(0);
    result.events.retain(|e| e.seq > cursor_seq);
    let mut expected = cursor_seq;
    for event in &result.events {
        if expected.checked_add(1) != Some(event.seq) {
            return Err(Error::new(
                ErrorCode::CatchUpRequired,
                "own-stream cursor precedes local coverage",
            ));
        }
        expected = event.seq;
    }
    if expected < receipt
        || result
            .vanished
            .iter()
            .any(|(_, last, _)| *last > cursor_seq)
    {
        return Err(Error::new(
            ErrorCode::CatchUpRequired,
            "own-stream segments moved to ref; catch up outside gate",
        ));
    }
    Ok(result)
}
