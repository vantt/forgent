//! One append lock, local recovery, one event+marker write and durable ack.
use crate::{
    envelope::{line, sha256, valid_timestamp, BatchCommit, Envelope},
    errors::{invalid, io, Error, ErrorCode},
    fsio::{point, sync_dir, write_hwm, FileSystem, OsFileSystem, Point},
    identity::{valid_machine_id, StoreIdentity},
    layout::{Layout, StreamId, StreamLayout},
    locks::{acquire_append, AppendGuard},
    open_read::{closed, decode, read_optional, segments},
    registry::Registry,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{
    collections::BTreeMap,
    fs::{self, OpenOptions},
    io::ErrorKind,
    path::Path,
};

#[derive(Debug, Clone)]
pub struct EventInput {
    pub event_type: String,
    pub schema_version: u64,
    pub payload: Value,
    pub ts: String,
}
/// Positions folded by the caller, keyed as <origin>:<stream>. Own position
/// supplies stale-cursor checking and is omitted from every event's `seen`.
pub type Positions = BTreeMap<String, u64>;
pub struct AppendRequest<'a> {
    pub stream: &'a StreamId,
    pub events: &'a [EventInput],
    pub cursor: &'a Positions,
    pub writer: &'a str,
    pub machine: &'a str,
    pub held_ranks: &'a [u32],
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Ack {
    pub origin: String,
    pub stream: String,
    pub first_seq: u64,
    pub last_seq: u64,
    pub h: Vec<String>,
}
#[derive(Debug)]
pub struct AppendResult {
    pub ack: Ack,
    pub events: Vec<Envelope>,
    pub guarantee: fgos_holder_lock::Guarantee,
}
fn conflict(detail: impl Into<String>) -> Error {
    Error::new(ErrorCode::EventStoreSeqRecoveryConflict, detail)
}
pub(crate) fn read_last_seq(path: &Path) -> Result<Option<u64>, Error> {
    let Some(bytes) = read_optional(path)? else {
        return Ok(None);
    };
    let value: Value = serde_json::from_slice(&bytes).map_err(|e| conflict(e.to_string()))?;
    let seq = value
        .get("lastSeq")
        .and_then(Value::as_u64)
        .filter(|s| *s < (1u64 << 53))
        .ok_or_else(|| conflict("invalid lastSeq"))?;
    Ok(Some(seq))
}
/// The private guard parameter prevents recovery from being called unlocked.
pub(crate) fn recover(
    paths: &StreamLayout,
    origin: &str,
    stream: &StreamId,
    _guard: &AppendGuard,
    fs: &dyn FileSystem,
) -> Result<crate::open_read::Framed, Error> {
    let bytes = read_optional(&paths.active())?.unwrap_or_default();
    let active = decode(&bytes, origin, stream, false)?;
    if active.committed_len != bytes.len() {
        let file = OpenOptions::new()
            .write(true)
            .open(paths.active())
            .map_err(io)?;
        file.set_len(active.committed_len as u64).map_err(io)?;
        point(fs, Point::AfterTruncate)?;
        file.sync_all().map_err(io)?;
        point(fs, Point::AfterTruncateFsync)?;
    }
    let receipt = read_last_seq(&paths.sealed())?.unwrap_or(0);
    let mut high = receipt;
    for (first, last, path) in segments(paths)? {
        let bytes = std::fs::read(path).map_err(io)?;
        closed(&bytes, origin, stream, first, last)?;
        if last <= receipt {
            continue;
        }
        if high.checked_add(1) != Some(first) {
            return Err(conflict("closed segment gap or overlap above receipt"));
        }
        high = last;
    }
    if let Some(first) = active.events.first() {
        if high.checked_add(1) != Some(first.seq) {
            return Err(conflict("active gap or overlap above receipt"));
        }
        high = active.events.last().unwrap().seq;
    }
    let hint = read_last_seq(&paths.hwm())?;
    if hint.is_some_and(|s| s > high) {
        return Err(conflict("hwm exceeds every durable event location"));
    }
    if hint.is_none_or(|s| s < high) {
        write_hwm(&paths.root, high, fs)?;
    }
    Ok(active)
}
/// Persist stream directory entries before ever acknowledging a file below them.
pub(crate) fn prepare_stream(layout: &Layout, stream: &StreamId) -> Result<StreamLayout, Error> {
    let paths = layout.stream(stream);
    fs::create_dir_all(paths.closed()).map_err(io)?;
    sync_dir(&paths.closed())?;
    sync_dir(&paths.root)?;
    sync_dir(&layout.root)?;
    Ok(paths)
}
pub fn append(
    layout: &Layout,
    registry: &Registry,
    request: AppendRequest<'_>,
) -> Result<AppendResult, Error> {
    append_with_fs(layout, registry, request, &OsFileSystem)
}
pub fn append_with_fs(
    layout: &Layout,
    registry: &Registry,
    request: AppendRequest<'_>,
    fs: &dyn FileSystem,
) -> Result<AppendResult, Error> {
    // Resolve writer/machine outside the gate in the adapter. This boundary
    // validates the supplied identities and all payloads before taking a lock.
    if request.events.is_empty() || request.writer.is_empty() || !valid_machine_id(request.machine)
    {
        return Err(invalid("nonempty batch, writer and valid machine required"));
    }
    for input in request.events {
        registry.validate(
            &input.event_type,
            request.stream.scope(),
            input.schema_version,
        )?;
        if !valid_timestamp(&input.ts) {
            return Err(invalid("invalid timestamp"));
        }
        line(&input.payload)?;
    }
    for (key, seq) in request.cursor {
        // Validate cursor keys and safe counters using the envelope authority.
        if !crate::envelope::valid_seen_key(key) || *seq > (1u64 << 53) - 1 {
            return Err(invalid("invalid cursor position"));
        }
    }
    let guard = acquire_append(layout, request.held_ranks, fs)?;
    StoreIdentity::sweep_temps_under_append_lock(layout)?;
    let identity = StoreIdentity::initialize_under_append_lock(
        layout,
        request.machine,
        &request.events[0].ts,
    )?;
    let paths = prepare_stream(layout, request.stream)?;
    recover(&paths, &identity.store_id, request.stream, &guard, fs)?;
    // Recovery has reconciled and durably rewritten the hint, under this lock.
    let high = read_last_seq(&paths.hwm())?.unwrap_or(0);
    let own_key = format!("{}:{}", identity.store_id, request.stream.as_str());
    if request.cursor.get(&own_key).is_some_and(|seq| *seq != high) {
        return Err(Error::new(
            ErrorCode::StaleCursor,
            "own-stream position changed",
        ));
    }
    let last = high
        .checked_add(request.events.len() as u64)
        .filter(|s| *s < (1u64 << 53))
        .ok_or_else(|| conflict("sequence exhausted"))?;
    let mut seen = request.cursor.clone();
    seen.remove(&own_key);
    seen.retain(|_, seq| *seq != 0);
    let mut bytes = Vec::new();
    let mut events = Vec::new();
    for (index, input) in request.events.iter().enumerate() {
        let mut event = Envelope {
            v: 4,
            event_type: input.event_type.clone(),
            scope: request.stream.scope(),
            origin: identity.store_id.clone(),
            stream: request.stream.as_str().into(),
            seq: high + 1 + index as u64,
            seen: seen.clone(),
            ts: input.ts.clone(),
            src: request.writer.into(),
            schema_version: input.schema_version,
            payload: input.payload.clone(),
            h: String::new(),
        };
        event.h = event.compute_hash()?;
        bytes.extend(event.canonical_line()?);
        events.push(event);
    }
    let marker = BatchCommit {
        v: 4,
        kind: "batch-commit".into(),
        origin: identity.store_id.clone(),
        stream: request.stream.as_str().into(),
        first_seq: high + 1,
        last_seq: last,
        count: events.len() as u64,
        sha256: sha256(&bytes),
    };
    bytes.extend(marker.canonical_line()?);
    let (mut file, created) = match OpenOptions::new()
        .append(true)
        .create_new(true)
        .open(paths.active())
    {
        Ok(file) => (file, true),
        Err(e) if e.kind() == ErrorKind::AlreadyExists => (
            OpenOptions::new()
                .append(true)
                .open(paths.active())
                .map_err(io)?,
            false,
        ),
        Err(e) => return Err(io(e)),
    };
    point(fs, Point::BeforeAppendWrite)?;
    let written = fs.write_batch(&mut file, &bytes).map_err(io)?;
    point(fs, Point::AfterAppendWrite)?;
    if written != bytes.len() {
        return Err(io(std::io::Error::new(
            ErrorKind::WriteZero,
            "short batch write; no ack",
        )));
    }
    file.sync_all().map_err(io)?;
    point(fs, Point::AfterAppendFsync)?;
    if created {
        sync_dir(&paths.root)?;
    }
    point(fs, Point::AfterAppendDirFsync)?;
    drop(file);
    let result = AppendResult {
        ack: Ack {
            origin: identity.store_id,
            stream: request.stream.as_str().into(),
            first_seq: high + 1,
            last_seq: last,
            h: events.iter().map(|e| e.h.clone()).collect(),
        },
        events,
        guarantee: guard.guarantee.clone(),
    };
    drop(guard);
    Ok(result)
}
