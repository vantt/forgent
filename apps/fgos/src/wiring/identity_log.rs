//! The Event Store behind Identity's shared directory: the adapter of the
//! `EntryLog` port for stream `project:identity` of the clone a verb runs in.
//! The host links the store directly (Identity cannot: the store depends on
//! Identity) and registers the stream through the store's consumer manifest,
//! which the store embeds at build time.

use fgos_event_store::{
    append::{append, AppendRequest, EventInput},
    identity::StoreIdentity,
    legacy_import::write_readiness,
    layout::{Layout, StreamId},
    read::{read, ReadRequest},
    registry::Registry,
    sync::sync_status,
};
use fgos_git::GitDriver;
use fgos_identity::shared::{self, EntryLog, LogDoor, RawEvent};
use fgos_identity::text::{iso_utc, iso_utc_now};
use fgos_identity::Refusal;
use serde_json::Value;
use std::path::{Path, PathBuf};

fn store_fault(reason: &'static str, error: impl std::fmt::Debug) -> Refusal {
    Refusal { reason, detail: format!("{error:?}"), candidates: Vec::new() }
}

#[derive(Debug)]
pub struct StoreLogDoor;

/// One stream of a clone's Event Store, opened for appends and reads.
pub struct StoreLog {
    driver: GitDriver,
    repo: fgos_git::RepoHandle,
    layout: Layout,
    registry: Registry,
    stream: StreamId,
    machine: String,
    writer: String,
    /// Where the log was opened: the project whose `eventStore.remote` the write admission asks about.
    dir: PathBuf,
}

impl LogDoor for StoreLogDoor {
    fn open(&self, dir: &Path, writer: &str) -> Result<Option<Box<dyn EntryLog>>, Refusal> {
        self.open_stream(dir, writer, shared::STREAM)
    }
}

impl StoreLogDoor {
    /// The log of `stream` (a registered stream id) of the clone `dir` is in, written as `writer`:
    /// the same admission, cursor and ordering Identity's directory uses, for another stream.
    pub fn open_stream(&self, dir: &Path, writer: &str, stream: &str) -> Result<Option<Box<dyn EntryLog>>, Refusal> {
        Ok(self.open_store(dir, writer, stream)?.map(|log| Box::new(log) as Box<dyn EntryLog>))
    }

    /// [`StoreLogDoor::open_stream`] as the concrete log, whose whole envelopes a reader that needs
    /// positions (a cursor) and store timestamps can read.
    pub fn open_store(&self, dir: &Path, writer: &str, stream: &str) -> Result<Option<StoreLog>, Refusal> {
        let fault = |e: &dyn std::fmt::Debug| store_fault("event-store-unavailable", e);
        let clone = match super::event_store_clone::open(dir) {
            Ok(Some(clone)) => clone,
            Ok(None) => return Ok(None),
            Err(failure) => return Err(Refusal { reason: failure.reason, detail: failure.detail, candidates: Vec::new() }),
        };
        let stream = StreamId::parse(stream).map_err(|e| fault(&e))?;
        let super::event_store_clone::EventStoreClone { driver, repo, layout, registry, machine } = clone;
        Ok(Some(StoreLog { driver, repo, layout, registry, stream, machine, writer: writer.to_owned(), dir: dir.to_owned() }))
    }
}

impl StoreLog {
    /// Every envelope of this stream the clone holds, in the store's order, and this store's own
    /// origin id (empty while the clone has no store yet).
    pub fn envelopes(&self) -> Result<(Vec<fgos_event_store::envelope::Envelope>, String), Refusal> {
        let (result, origin) = self.read_stream()?;
        let stream = self.stream.as_str();
        Ok((result.sequence.into_iter().filter(|event| event.stream == stream).collect(), origin))
    }

    /// The write admission every writer of the Event Store passes before it appends: a clone whose
    /// pinned legacy ref or fetch mapping is missing is refused.
    fn admit_write(&self) -> Result<(), Refusal> {
        let remote = fgos_config::provider::effective_value(&self.dir, "eventStore.remote")?;
        let remote = match &remote {
            Some(value) => value.as_str().ok_or_else(|| store_fault("event-store-config", "eventStore.remote is not text"))?,
            None => "origin",
        };
        write_readiness(&self.driver, &self.repo, remote).map_err(|e| Refusal {
            reason: "event-store-write-refused",
            detail: e.to_string(),
            candidates: Vec::new(),
        })
    }

    /// The stream as the store orders it, and this store's own origin id: empty while the clone has
    /// no store yet, as the store's own status reads it, so only other machines' entries are read.
    fn read_stream(&self) -> Result<(fgos_event_store::read::ReadResult, String), Refusal> {
        let fault = |e: &dyn std::fmt::Debug| store_fault("event-store-read-failed", e);
        let origin = match std::fs::symlink_metadata(self.layout.store()) {
            Ok(_) => StoreIdentity::open(&self.layout, &self.machine).map_err(|e| fault(&e))?.store_id,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => String::new(),
            Err(e) => return Err(fault(&e)),
        };
        let result = read(
            &self.driver,
            &self.repo,
            ReadRequest {
                machine: &self.machine,
                layout: &self.layout,
                origin: &origin,
                streams: std::slice::from_ref(&self.stream),
                cursor: &Default::default(),
                folded: &[],
                project: true,
            },
        )
        .map_err(|e| fault(&e))?;
        if !result.deferred.is_empty() || !result.missing.is_empty() {
            return Err(store_fault("event-store-incomplete-history", "run `fgos events sync` and retry"));
        }
        Ok((result, origin))
    }
}

impl EntryLog for StoreLog {
    fn append(&self, event_type: &str, payload: Value) -> Result<(), Refusal> {
        self.admit_write()?;
        // The event says it was written after everything this clone has folded (its `seen`),
        // so a later take on this machine orders after the entries it replaces.
        let (read, origin) = self.read_stream()?;
        let mut cursor = read.cursor.cover;
        // The own position is the store's stale check; a concurrent append is not a reason to refuse this one.
        cursor.remove(&format!("{origin}:{}", self.stream.as_str()));
        append(
            &self.layout,
            &self.registry,
            AppendRequest {
                stream: &self.stream,
                events: &[EventInput { event_type: event_type.to_owned(), schema_version: 1, payload, ts: iso_utc_now() }],
                cursor: &cursor,
                writer: &self.writer,
                machine: &self.machine,
                held_ranks: &[],
            },
        )
        .map(|_| ())
        .map_err(|e| store_fault("event-store-append-failed", e))
    }

    fn read(&self) -> Result<(Vec<RawEvent>, Option<String>), Refusal> {
        let (result, _) = self.read_stream()?;
        let events = result
            .sequence
            .into_iter()
            .filter(|event| event.stream == self.stream.as_str())
            .map(|event| RawEvent { event_type: event.event_type, payload: event.payload })
            .collect();
        let fetched_at = sync_status(&self.layout)
            .map_err(|e| store_fault("event-store-read-failed", e))?
            .last_fetch
            .filter(|fetch| fetch.error.is_none())
            .map(|fetch| iso_utc(fetch.time, 0));
        Ok((events, fetched_at))
    }
}
