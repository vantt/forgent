//! Marshaling only: the Event Store owns validation, locking and persistence.
use crate::{check, error};
use fgos_event_store::{
    append,
    identity::StoreIdentity,
    layout::{Layout, StreamId},
    open_read,
    registry::Registry,
};
use fgos_git::{GitDriver, Inspect, RepoHandle, ResolveRepo};
use napi::{bindgen_prelude::External, Error, Result};
use napi_derive::napi;
use serde::Deserialize;
use serde_json::{json, Value};
use std::{
    path::Path,
    sync::{Arc, OnceLock},
};

fn available() -> Result<()> {
    check()?;
    if !cfg!(target_os = "linux") {
        return Err(error("event-store-unsupported-platform"));
    }
    Ok(())
}
fn guarantee(g: &fgos_holder_lock::Guarantee) -> Value {
    json!({"driver":g.driver,"exclusion":g.exclusion.as_str(),"borrow":g.borrow.as_str(),"holders":g.holders.as_str(),"platform":g.platform,"notes":g.notes})
}

#[napi(object)]
pub struct EventStoreCheckpoint {
    pub path: String,
    pub reuse: bool,
}

#[napi(object)]
pub struct EventStoreReadRequest {
    pub streams: Vec<String>,
    pub cursor: Value,
    pub folded: String,
    pub project: bool,
    pub view: Option<External<fgos_event_store::read::VerifiedView>>,
    pub checkpoint: Option<EventStoreCheckpoint>,
    /// Digest of the legacy events the caller already holds from an earlier
    /// read; the same legacy history is then not sent again.
    pub legacy_held: Option<String>,
}

#[napi(object)]
pub struct EventStoreRead {
    pub result: Value,
    pub view: External<fgos_event_store::read::VerifiedView>,
}

#[napi]
pub struct EventStore {
    layout: Layout,
    registry: Registry,
    machine: String,
    resolved: (Arc<GitDriver>, Arc<RepoHandle>),
    /// Legacy-migration admission: asked by the first write or the pre-gate
    /// `admit_writes`, never by a read, and kept once the answer is settled.
    write_refusal: OnceLock<Option<String>>,
    publication_remote: String,
    /// What this store's last complete read answered; see `ReadMemo`.
    read_memo: fgos_event_store::read::ReadMemo,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Input {
    event_type: String,
    schema_version: u64,
    payload: Value,
    ts: String,
}
#[napi]
impl EventStore {
    /// Settle write admission outside the Work gate. A refusal is raised by
    /// the write that needs it; only a failure that may clear is raised here.
    #[napi]
    pub fn admit_writes(&self, held_ranks: Vec<u32>, hot_lock_depth: u32) -> Result<()> {
        self.context(&held_ranks, hot_lock_depth)?;
        self.write_admission(&held_ranks).map(|_| ())
    }
    #[napi]
    pub fn append(
        &self,
        stream: String,
        events: Value,
        cursor: Value,
        writer: String,
        held_ranks: Vec<u32>,
    ) -> Result<Value> {
        available()?;
        if let Some(reason) = self.write_admission(&held_ranks)? {
            return Err(error(reason));
        }
        let stream = StreamId::parse(&stream).map_err(error)?;
        let events: Vec<Input> = serde_json::from_value(events).map_err(error)?;
        let events: Vec<_> = events
            .into_iter()
            .map(|i| append::EventInput {
                event_type: i.event_type,
                schema_version: i.schema_version,
                payload: i.payload,
                ts: i.ts,
            })
            .collect();
        let cursor = serde_json::from_value(cursor).map_err(error)?;
        let result = append::append(
            &self.layout,
            &self.registry,
            append::AppendRequest {
                stream: &stream,
                events: &events,
                cursor: &cursor,
                writer: &writer,
                machine: &self.machine,
                held_ranks: &held_ranks,
            },
        )
        .map_err(error)?;
        Ok(
            json!({"ack": result.ack, "events": result.events, "guarantee": guarantee(&result.guarantee)}),
        )
    }
    #[napi(getter)]
    pub fn own_origin(&self) -> Result<Option<String>> {
        available()?;
        match std::fs::symlink_metadata(self.layout.store()) {
            Ok(_) => Ok(Some(
                StoreIdentity::open(&self.layout, &self.machine)
                    .map_err(error)?
                    .store_id,
            )),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
            Err(e) => Err(error(e)),
        }
    }

    #[napi]
    pub fn read_in_gate(&self, origin: String, stream: String, cursor_seq: f64) -> Result<Value> {
        available()?;
        if !cursor_seq.is_finite()
            || cursor_seq < 0.0
            || cursor_seq.fract() != 0.0
            || cursor_seq > 9007199254740991.0
        {
            return Err(Error::from_reason("invalid cursor sequence"));
        }
        let result = open_read::read_in_gate(
            &self.layout,
            &origin,
            &StreamId::parse(&stream).map_err(error)?,
            cursor_seq as u64,
        )
        .map_err(error)?;
        Ok(json!({"events": result.events, "vanished": result.vanished}))
    }
}

/// Opaque, pre-resolved repository authority. Never constructed inside a gate.
#[napi]
pub struct EventStoreRoot {
    driver: Arc<GitDriver>,
    repo: Arc<RepoHandle>,
    machine: String,
}
#[napi]
impl EventStoreRoot {
    #[napi(getter)]
    pub fn common_dir(&self) -> Result<String> {
        available()?;
        Ok(self.repo.common_dir().to_string_lossy().into_owned())
    }
    #[napi(getter)]
    pub fn machine_id(&self) -> Result<String> {
        available()?;
        Ok(self.machine.clone())
    }
}
#[napi]
pub fn resolve_event_store(
    cwd: String,
    state_root: String,
    trusted_main: String,
) -> Result<EventStoreRoot> {
    available()?;
    let driver = GitDriver::new(Path::new(&state_root)).map_err(operation)?;
    let repo = match driver
        .resolve_repo(Path::new(&cwd), Path::new(&trusted_main))
        .map_err(operation)?
    {
        ResolveRepo::Repository(repo) => repo,
        ResolveRepo::NotARepository => return Err(error("event-store-no-repository")),
    };
    let config = driver.machine_id(&repo).map_err(operation)?;
    let config = config
        .as_ref()
        .map(|f| std::str::from_utf8(&f.value).map_err(error))
        .transpose()?;
    let machine =
        fgos_event_store::identity::machine_id(config, Path::new(&state_root)).map_err(error)?;
    Ok(EventStoreRoot {
        driver: Arc::new(driver),
        repo: Arc::new(repo),
        machine,
    })
}
#[napi]
pub fn open_store(
    resolved_root: &EventStoreRoot,
    machine_id: String,
    registry_files: Vec<String>,
    publication_remote: Option<String>,
) -> Result<EventStore> {
    available()?;
    if machine_id != resolved_root.machine {
        return Err(error("event-store-machine-id"));
    }
    let mut registry = Registry::default();
    registry.load_files(&registry_files).map_err(error)?;
    Ok(EventStore {
        write_refusal: OnceLock::new(),
        read_memo: fgos_event_store::read::ReadMemo::new(),
        publication_remote: publication_remote.unwrap_or_else(|| "origin".into()),
        layout: Layout::from_common_dir(Some(resolved_root.repo.common_dir())).map_err(error)?,
        registry,
        machine: machine_id,
        resolved: (
            Arc::clone(&resolved_root.driver),
            Arc::clone(&resolved_root.repo),
        ),
    })
}
fn sealed(result: fgos_event_store::seal::Sealed) -> Value {
    json!({"segments":result.segments,"busy":result.busy,"lastSeq":result.last_seq,"checkpointError":result.checkpoint_error})
}
fn stream_ids(streams: &[String]) -> Result<Vec<StreamId>> {
    streams
        .iter()
        .map(|s| StreamId::parse(s).map_err(error))
        .collect()
}
/// A missing pinned legacy ref is not settled: `fgos events sync` fetches it
/// while a long-lived process keeps running. A required migration is, because
/// it runs with every writer stopped.
fn is_settled_refusal(code: fgos_event_store::errors::ErrorCode) -> bool {
    matches!(code, fgos_event_store::errors::ErrorCode::EventStoreMigrationRequired)
}
impl EventStore {
    /// The reason writes are refused, or `None`. A settled answer is kept per
    /// store; a failure that may clear is asked again by the next write. Git is
    /// never asked inside the Work gate (rank 60):
    /// a write that arrives there before `admit_writes` ran is refused, not
    /// answered with a process spawn.
    fn write_admission(&self, held_ranks: &[u32]) -> Result<Option<&str>> {
        if let Some(known) = self.write_refusal.get() {
            return Ok(known.as_deref());
        }
        if held_ranks.contains(&60) {
            return Err(error("event-store-admission-required"));
        }
        let (driver, repo) = &self.resolved;
        match fgos_event_store::legacy_import::write_readiness(
            driver,
            repo,
            &self.publication_remote,
        ) {
            Ok(()) => Ok(self.write_refusal.get_or_init(|| None).as_deref()),
            Err(e) if is_settled_refusal(e.code) => {
                let asked = Some(e.to_string());
                Ok(self.write_refusal.get_or_init(|| asked).as_deref())
            }
            // Any other failure may clear (a fetch, a Git or I/O error), so it is
            // returned to this write and the next write asks again.
            Err(e) => Err(error(e)),
        }
    }
    fn context(&self, ranks: &[u32], depth: u32) -> Result<(&GitDriver, &RepoHandle, &str)> {
        available()?;
        fgos_event_store::locks::validate_seal_context(ranks, depth).map_err(error)?;
        let (driver, repo) = &self.resolved;
        Ok((driver, repo, &self.machine))
    }
}
#[napi]
impl EventStore {
    #[napi]
    pub fn seal(
        &self,
        stream: String,
        held_ranks: Vec<u32>,
        hot_lock_depth: u32,
        opportunistic: Option<bool>,
        checkpoint_path: Option<String>,
    ) -> Result<Value> {
        let (driver, repo, machine) = self.context(&held_ranks, hot_lock_depth)?;
        let stream = StreamId::parse(&stream).map_err(error)?;
        Ok(sealed(
            fgos_event_store::seal::seal_checkpointed(
                driver,
                repo,
                fgos_event_store::seal::SealRequest {
                    layout: &self.layout,
                    machine,
                    stream: &stream,
                    held_ranks: &held_ranks,
                    hot_lock_depth,
                    opportunistic: opportunistic.unwrap_or(false),
                },
                &fgos_event_store::fsio::OsFileSystem,
                checkpoint_path.as_deref().map(std::path::Path::new),
            )
            .map_err(error)?,
        ))
    }
    #[napi]
    pub fn seal_if_due(
        &self,
        stream: String,
        interval_sec: u32,
        held_ranks: Vec<u32>,
        hot_lock_depth: u32,
    ) -> Result<Value> {
        let (driver, repo, machine) = self.context(&held_ranks, hot_lock_depth)?;
        let stream = StreamId::parse(&stream).map_err(error)?;
        Ok(sealed(
            fgos_event_store::seal::seal_if_due(
                driver,
                repo,
                fgos_event_store::seal::SealRequest {
                    layout: &self.layout,
                    machine,
                    stream: &stream,
                    held_ranks: &held_ranks,
                    hot_lock_depth,
                    opportunistic: true,
                },
                interval_sec.into(),
            )
            .map_err(error)?,
        ))
    }
    #[napi]
    pub fn seal_all(
        &self,
        streams: Vec<String>,
        held_ranks: Vec<u32>,
        hot_lock_depth: u32,
    ) -> Result<Value> {
        let (driver, repo, machine) = self.context(&held_ranks, hot_lock_depth)?;
        let results = fgos_event_store::seal::seal_all(
            driver,
            repo,
            &self.layout,
            machine,
            &stream_ids(&streams)?,
            &held_ranks,
            hot_lock_depth,
        )
        .map_err(error)?;
        Ok(Value::Array(results.into_iter().map(sealed).collect()))
    }
    #[napi]
    pub fn promote(
        &self,
        request: Value,
        held_ranks: Vec<u32>,
        hot_lock_depth: u32,
    ) -> Result<Value> {
        let (driver, repo, machine) = self.context(&held_ranks, hot_lock_depth)?;
        if let Some(reason) = self.write_admission(&held_ranks)? {
            return Err(error(reason));
        }
        #[derive(Deserialize)]
        #[serde(rename_all = "camelCase", deny_unknown_fields)]
        struct Request {
            branch: String,
            through_seq: u64,
            cursor: append::Positions,
            writer: String,
            ts: String,
        }
        let Request {
            branch,
            through_seq,
            cursor,
            writer,
            ts,
        } = serde_json::from_value(request).map_err(error)?;
        if !(1..=9_007_199_254_740_991).contains(&through_seq) {
            return Err(error("invalid promote sequence"));
        }
        let branch = StreamId::parse(&branch).map_err(error)?;
        serde_json::to_value(
            fgos_event_store::promote::promote(
                driver,
                repo,
                &self.registry,
                fgos_event_store::promote::PromoteRequest {
                    layout: &self.layout,
                    machine,
                    branch: &branch,
                    through_seq,
                    writer: &writer,
                    ts: &ts,
                    cursor: &cursor,
                    held_ranks: &held_ranks,
                    hot_lock_depth,
                },
            )
            .map_err(error)?,
        )
        .map_err(error)
    }
    #[napi]
    pub fn sync(
        &self,
        remote: String,
        no_push: bool,
        held_ranks: Vec<u32>,
        hot_lock_depth: u32,
        opportunistic: Option<bool>,
    ) -> Result<Value> {
        let (driver, repo, machine) = self.context(&held_ranks, hot_lock_depth)?;
        let result = fgos_event_store::sync::sync(
            driver,
            repo,
            fgos_event_store::sync::SyncRequest {
                layout: &self.layout,
                machine,
                remote: &remote,
                no_push,
                opportunistic: opportunistic.unwrap_or(false),
                held_ranks: &held_ranks,
                hot_lock_depth,
            },
        )
        .map_err(error)?;
        Ok(
            json!({"mirrorsChanged":result.mirrors_changed,"warnings":result.warnings,"busy":result.busy}),
        )
    }
    #[napi]
    pub fn maintenance(&self, held_ranks: Vec<u32>, hot_lock_depth: u32) -> Result<Value> {
        self.context(&held_ranks, hot_lock_depth)?;
        fgos_event_store::diagnostics::maintenance(&self.layout).map_err(error)
    }
    #[napi]
    pub fn unpublished_summary(
        &self,
        remote: String,
        held_ranks: Vec<u32>,
        hot_lock_depth: u32,
    ) -> Result<Value> {
        let (driver, repo, machine) = self.context(&held_ranks, hot_lock_depth)?;
        let result = fgos_event_store::sync::guarded_unpublished_summary(
            driver,
            repo,
            fgos_event_store::sync::SyncRequest {
                layout: &self.layout,
                machine,
                remote: &remote,
                no_push: true,
                opportunistic: false,
                held_ranks: &held_ranks,
                hot_lock_depth,
            },
        )
        .map_err(error)?;
        Ok(Value::Array(result.into_iter().map(|v| json!({"stream":v.stream.as_str(),"sealedPushed":v.sealed_pushed,"oldestUnsealedAgeSec":v.oldest_unsealed_age_sec})).collect()))
    }
    #[napi]
    pub fn read(
        &self,
        request: EventStoreReadRequest,
        held_ranks: Vec<u32>,
        hot_lock_depth: u32,
    ) -> Result<EventStoreRead> {
        let EventStoreReadRequest {
            streams,
            cursor,
            folded,
            project,
            view,
            checkpoint,
            legacy_held,
        } = request;
        let (driver, repo, machine) = self.context(&held_ranks, hot_lock_depth)?;
        let origin = match std::fs::symlink_metadata(self.layout.store()) {
            Ok(_) => {
                StoreIdentity::open(&self.layout, machine)
                    .map_err(error)?
                    .store_id
            }
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => String::new(),
            Err(e) => return Err(error(e)),
        };
        let cursor = if cursor.is_null() {
            Default::default()
        } else {
            serde_json::from_value(cursor).map_err(error)?
        };
        let folded = serde_json::from_str::<Vec<fgos_event_store::envelope::Envelope>>(&folded)
            .map_err(error)?;
        let request = fgos_event_store::read::ReadRequest {
            layout: &self.layout,
            origin: &origin,
            machine,
            streams: &stream_ids(&streams)?,
            cursor: &cursor,
            folded: &folded,
            project,
        };
        let memoized = Some(fgos_event_store::read::Memoized {
            memo: &self.read_memo,
            legacy_held: legacy_held.as_deref(),
        });
        let result = match checkpoint {
            Some(checkpoint) => fgos_event_store::read::read_checkpointed(
                driver,
                repo,
                request,
                view.as_deref(),
                &fgos_event_store::checkpoint::Checkpoint {
                    path: checkpoint.path.into(),
                    reuse: checkpoint.reuse,
                },
                memoized,
            ),
            None => fgos_event_store::read::read_with_view(
                driver,
                repo,
                request,
                view.as_deref(),
                memoized,
            ),
        }
        .map_err(error)?;
        // The facade already owns the supplied prefix. Return only changed
        // envelopes across N-API; compare complete envelopes, not just hashes.
        let sequence_prefix = result
            .sequence
            .iter()
            .zip(&folded)
            .take_while(|(a, b)| a == b)
            .count();
        let fold = match result.fold {
            fgos_event_store::cursor::Fold::Incremental => json!({"kind":"incremental"}),
            fgos_event_store::cursor::Fold::RebuildRequired { first_difference } => {
                json!({"kind":"rebuild-required","firstDifference":first_difference})
            }
        };
        let view = External::new(result.verified_view);
        // The caller holds exactly this legacy history: it is the same bytes
        // (the digest names every event), so none of it crosses again.
        let legacy_unchanged = legacy_held.is_some() && legacy_held == result.cursor.legacy_digest;
        let legacy: Vec<Value> = if legacy_unchanged {
            Vec::new()
        } else {
            result
                .legacy
                .iter()
                .map(|e| json!({"raw":e.raw,"provenance":e.provenance}))
                .collect()
        };
        Ok(EventStoreRead {
            view,
            result: json!({"events":result.events,"sequence":&result.sequence[sequence_prefix..],"sequencePrefix":sequence_prefix,"legacy":legacy,"legacyUnchanged":legacy_unchanged,"deferred":result.deferred,"missing":result.missing,"concurrent":result.concurrent,"cursor":result.cursor,"fold":fold,"checkpoint":{"continued":result.checkpoint.continued,"ignored":result.checkpoint.ignored,"written":result.checkpoint.written,"writeError":result.checkpoint.write_error},"skippedMirrors":result.skipped_mirrors}),
        })
    }
}

fn operation(e: fgos_git::OperationError) -> Error {
    error(json!({"code": e.code, "cause":e.cause}))
}

#[napi]
pub fn event_store_facts(
    cwd: String,
    state_root: String,
    trusted_main: String,
    remote: String,
) -> Result<Value> {
    available()?;
    let driver = GitDriver::new(Path::new(&state_root)).map_err(operation)?;
    let repo = match driver
        .resolve_repo(Path::new(&cwd), Path::new(&trusted_main))
        .map_err(operation)?
    {
        ResolveRepo::Repository(repo) => repo,
        ResolveRepo::NotARepository => return Err(error("event-store-no-repository")),
    };
    fgos_event_store::diagnostics::facts(&driver, &repo, Path::new(&state_root), &remote)
        .map_err(error)
}
#[napi]
pub fn ensure_event_store_refspecs(
    cwd: String,
    state_root: String,
    trusted_main: String,
    remote: String,
) -> Result<()> {
    available()?;
    let driver = GitDriver::new(Path::new(&state_root)).map_err(operation)?;
    let repo = match driver
        .resolve_repo(Path::new(&cwd), Path::new(&trusted_main))
        .map_err(operation)?
    {
        ResolveRepo::Repository(repo) => repo,
        ResolveRepo::NotARepository => return Err(error("event-store-no-repository")),
    };
    fgos_event_store::refspec::ensure_refspecs(&driver, &repo, &remote).map_err(error)
}
#[napi]
impl EventStore {
    #[napi]
    pub fn status(
        &self,
        remote: String,
        held_ranks: Vec<u32>,
        hot_lock_depth: u32,
    ) -> Result<Value> {
        let (driver, repo, machine) = self.context(&held_ranks, hot_lock_depth)?;
        fgos_event_store::diagnostics::status(driver, repo, &self.layout, machine, &remote)
            .map_err(error)
    }
    #[napi]
    pub fn export_jsonl(
        &self,
        streams: Vec<String>,
        since: Value,
        out: String,
        held_ranks: Vec<u32>,
        hot_lock_depth: u32,
    ) -> Result<Value> {
        self.export(streams, since, out, held_ranks, hot_lock_depth, false)
    }
    #[napi]
    pub fn export_legacy_layout(
        &self,
        streams: Vec<String>,
        since: Value,
        out: String,
        held_ranks: Vec<u32>,
        hot_lock_depth: u32,
    ) -> Result<Value> {
        self.export(streams, since, out, held_ranks, hot_lock_depth, true)
    }
}
impl EventStore {
    fn export(
        &self,
        streams: Vec<String>,
        since: Value,
        out: String,
        ranks: Vec<u32>,
        depth: u32,
        legacy: bool,
    ) -> Result<Value> {
        let (driver, repo, machine) = self.context(&ranks, depth)?;
        let origin = if self.layout.store().exists() {
            StoreIdentity::open(&self.layout, machine)
                .map_err(error)?
                .store_id
        } else {
            String::new()
        };
        let streams = stream_ids(&streams)?;
        let since = if since.is_null() {
            Default::default()
        } else {
            fgos_event_store::cursor::Cursor::parse(
                &fgos_event_store::envelope::line(&since).map_err(error)?,
            )
            .map_err(error)?
        };
        let request = fgos_event_store::export::ExportRequest {
            layout: &self.layout,
            origin: &origin,
            machine,
            streams: &streams,
            since: &since,
            out: Path::new(&out),
        };
        if legacy {
            fgos_event_store::export::export_legacy_layout(driver, repo, request)
        } else {
            fgos_event_store::export::export_jsonl(driver, repo, request)
        }
        .map_err(error)
    }
}

#[napi]
impl EventStore {
    /// Pure HEAD reads; `check` also refuses dirty/untracked migration inputs.
    #[napi]
    pub fn read_legacy_from_head(
        &self,
        check: bool,
        held_ranks: Vec<u32>,
        hot_lock_depth: u32,
    ) -> Result<Value> {
        let (driver, repo, _) = self.context(&held_ranks, hot_lock_depth)?;
        if check && repo.git_dir() != repo.common_dir() {
            return Err(error("event-store-migration-main-required"));
        }
        let main = match driver
            .resolve_repo(repo.trusted_main_root(), repo.trusted_main_root())
            .map_err(operation)?
        {
            ResolveRepo::Repository(main) => main,
            _ => return Err(error("event-store-no-repository")),
        };
        let repo = &main;
        let inv = fgos_event_store::legacy_import::inventory(driver, repo).map_err(error)?;
        let empty_legacy = if check {
            fgos_event_store::legacy_import::ensure_clean(driver, repo, &inv).map_err(error)?
        } else {
            vec![]
        };
        let (data_tree, legacy_oid) =
            fgos_event_store::legacy_import::import_identity(driver, repo, &inv).map_err(error)?;
        let existing_legacy = match driver
            .resolve_ref(
                repo,
                &fgos_git::RefName::parse("refs/fgos/legacy").map_err(error)?,
            )
            .map_err(operation)?
        {
            fgos_git::RefValue::Absent => None,
            fgos_git::RefValue::Direct(oid) => Some(oid.as_str().to_owned()),
            _ => return Err(error("event-store-legacy-mismatch: symbolic legacy ref")),
        };
        let events = fgos_event_store::legacy_import::events(
            &inv,
            &stream_ids(&["project".into(), "project:porting".into()])?,
        )
        .map_err(error)?;
        Ok(
            json!({"dataTree":data_tree.as_str(),"legacyRefOid":legacy_oid.as_str(),"existingLegacyOid":existing_legacy,"legacyMirrors":fgos_event_store::legacy_import::legacy_mirrors(driver, repo).map_err(error)?.into_iter().map(|r| json!({"name":r.name,"oid": match r.value { fgos_git::RefValue::Direct(oid) => Some(oid.as_str().to_owned()), _ => None }})).collect::<Vec<_>>(),"inventory":inv,"emptyLegacy":empty_legacy,"events":events.into_iter().map(|e|json!({"event":e.event,"raw":e.raw,"provenance":e.provenance})).collect::<Vec<_>>()}),
        )
    }
    #[napi]
    pub fn import_legacy(
        &self,
        expected_head: String,
        held_ranks: Vec<u32>,
        hot_lock_depth: u32,
    ) -> Result<Value> {
        let (driver, repo, _) = self.context(&held_ranks, hot_lock_depth)?;
        if repo.git_dir() != repo.common_dir() {
            return Err(error("event-store-migration-main-required"));
        }
        fgos_event_store::legacy_import::import_legacy(
            driver,
            repo,
            &self.layout,
            &expected_head,
            &held_ranks,
            hot_lock_depth,
        )
        .map_err(error)
    }
    #[napi]
    pub fn legacy_layout(&self, held_ranks: Vec<u32>, hot_lock_depth: u32) -> Result<Value> {
        let (driver, repo, _) = self.context(&held_ranks, hot_lock_depth)?;
        fgos_event_store::legacy_import::legacy_layout(driver, repo).map_err(error)
    }
}

/// Frozen legacy decoding for migration/export proofs; no filesystem discovery.
#[napi]
pub fn decode_legacy_files(files: std::collections::BTreeMap<String, String>) -> Result<Value> {
    available()?;
    let mut events = Vec::new();
    for (file, raw) in files {
        events.extend(fgos_event_store::legacy::parse_file(&file, &raw).map_err(error)?);
    }
    Ok(Value::Array(
        fgos_event_store::legacy::order(events)
            .into_iter()
            .map(|e| json!({"raw": e.raw, "provenance": e.provenance}))
            .collect(),
    ))
}

/// The crate owns branch stream naming; adapters must not reimplement it.
#[napi]
pub fn event_store_branch_key(branch: String) -> Result<String> {
    available()?;
    fgos_event_store::layout::branch_key(&branch).map_err(error)
}
