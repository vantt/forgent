//! The Event Store behind Identity's shared directory: the adapter of the
//! `EntryLog` port for stream `project:identity` of the clone a verb runs in.
//! The host links the store directly (Identity cannot: the store depends on
//! Identity), and the type contract is embedded the way the routes descriptor
//! is, so no release layout has to be searched at runtime.

use fgos_event_store::{
    append::{append, AppendRequest, EventInput},
    identity::{machine_id, StoreIdentity},
    legacy_import::write_readiness,
    layout::{Layout, StreamId},
    read::{read, ReadRequest},
    registry::{ConsumerContract, Registry},
    sync::sync_status,
};
use fgos_git::{GitDriver, Inspect, ResolveRepo};
use fgos_identity::shared::{self, EntryLog, LogDoor, RawEvent};
use fgos_identity::text::{iso_utc, iso_utc_now};
use fgos_identity::Refusal;
use serde_json::Value;
use std::path::{Path, PathBuf};

const CONTRACT: &str = include_str!("../../../../packages/identity/contracts/identity-event-streams.v1.json");

fn store_fault(reason: &'static str, error: impl std::fmt::Debug) -> Refusal {
    Refusal { reason, detail: format!("{error:?}"), candidates: Vec::new() }
}

#[derive(Debug)]
pub struct StoreLogDoor;

struct StoreLog {
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
        let fault = |e: &dyn std::fmt::Debug| store_fault("event-store-unavailable", e);
        let (state, _) = fgos_holder_lock::state_root();
        let driver = GitDriver::new(&state).map_err(|e| fault(&e))?;
        let repo = match driver.resolve_repo(dir, dir).map_err(|e| fault(&e))? {
            ResolveRepo::Repository(repo) => repo,
            ResolveRepo::NotARepository => return Ok(None),
        };
        let layout = Layout::from_common_dir(Some(repo.common_dir())).map_err(|e| fault(&e))?;
        // A project whose events were never migrated has nothing to share into. Migration commits the
        // `.fgos/events` fence; the store itself is minted by the first append, so a clone of a migrated
        // project that never appended still publishes, and this first append creates its store.
        let migrated = std::fs::symlink_metadata(repo.trusted_main_root().join(".fgos/events")).is_ok_and(|m| m.is_file());
        if !migrated && std::fs::symlink_metadata(layout.store()).is_err() {
            return Ok(None);
        }
        let configured = driver.machine_id(&repo).map_err(|e| fault(&e))?;
        let configured = configured.as_ref().map(|fact| std::str::from_utf8(&fact.value)).transpose().map_err(|e| fault(&e))?;
        let machine = machine_id(configured, &state).map_err(|e| fault(&e))?;
        let contract: ConsumerContract = serde_json::from_str(CONTRACT).map_err(|e| fault(&e))?;
        let mut registry = Registry::default();
        registry.register(contract).map_err(|e| fault(&e))?;
        let stream = StreamId::parse(shared::STREAM).map_err(|e| fault(&e))?;
        Ok(Some(Box::new(StoreLog { driver, repo, layout, registry, stream, machine, writer: writer.to_owned(), dir: dir.to_owned() })))
    }
}

impl StoreLog {
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
            .filter(|event| event.stream == shared::STREAM)
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
