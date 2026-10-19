//! Marshaling only: the Event Store owns validation, locking and persistence.
use crate::{check, error};
use fgos_event_store::{
    append,
    identity::StoreIdentity,
    layout::{Layout, StreamId},
    open_read,
    registry::{ConsumerContract, Registry},
};
use fgos_git::{GitDriver, Inspect, RepoHandle, ResolveRepo};
use napi::{Error, Result};
use napi_derive::napi;
use serde::Deserialize;
use serde_json::{json, Value};
use std::{path::Path, sync::Arc};

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

#[napi]
pub struct EventStore {
    layout: Layout,
    registry: Registry,
    machine: Option<String>,
    resolved: Option<(Arc<GitDriver>, Arc<RepoHandle>)>,
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
    #[napi(constructor)]
    pub fn new(common_dir: String, contracts: Value) -> Result<Self> {
        available()?;
        let mut registry = Registry::default();
        for contract in serde_json::from_value::<Vec<ConsumerContract>>(contracts).map_err(error)? {
            registry.register(contract).map_err(error)?;
        }
        Ok(Self {
            layout: Layout::from_common_dir(Some(Path::new(&common_dir))).map_err(error)?,
            registry,
            machine: None,
            resolved: None,
        })
    }
    #[napi]
    pub fn append(
        &self,
        stream: String,
        events: Value,
        cursor: Value,
        writer: String,
        machine: String,
        held_ranks: Vec<u32>,
    ) -> Result<Value> {
        available()?;
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
                machine: &machine,
                held_ranks: &held_ranks,
            },
        )
        .map_err(error)?;
        Ok(
            json!({"ack": result.ack, "events": result.events, "guarantee": guarantee(&result.guarantee)}),
        )
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
) -> Result<EventStore> {
    available()?;
    if machine_id != resolved_root.machine {
        return Err(error("event-store-machine-id"));
    }
    let mut registry = Registry::default();
    registry.load_files(&registry_files).map_err(error)?;
    Ok(EventStore {
        layout: Layout::from_common_dir(Some(resolved_root.repo.common_dir())).map_err(error)?,
        registry,
        machine: Some(machine_id),
        resolved: Some((
            Arc::clone(&resolved_root.driver),
            Arc::clone(&resolved_root.repo),
        )),
    })
}
fn sealed(result: fgos_event_store::seal::Sealed) -> Value {
    json!({"segments":result.segments,"busy":result.busy,"lastSeq":result.last_seq})
}
fn stream_ids(streams: &[String]) -> Result<Vec<StreamId>> {
    streams
        .iter()
        .map(|s| StreamId::parse(s).map_err(error))
        .collect()
}
impl EventStore {
    fn context(&self, ranks: &[u32], depth: u32) -> Result<(&GitDriver, &RepoHandle, &str)> {
        available()?;
        fgos_event_store::locks::validate_seal_context(ranks, depth).map_err(error)?;
        let (driver, repo) = self
            .resolved
            .as_ref()
            .ok_or_else(|| error("event-store-not-prepared"))?;
        Ok((
            driver,
            repo,
            self.machine
                .as_deref()
                .ok_or_else(|| error("event-store-not-prepared"))?,
        ))
    }
}
#[napi]
impl EventStore {
    #[napi]
    pub fn seal(&self, stream: String, held_ranks: Vec<u32>, hot_lock_depth: u32) -> Result<Value> {
        let (driver, repo, machine) = self.context(&held_ranks, hot_lock_depth)?;
        let stream = StreamId::parse(&stream).map_err(error)?;
        Ok(sealed(
            fgos_event_store::seal::seal(
                driver,
                repo,
                fgos_event_store::seal::SealRequest {
                    layout: &self.layout,
                    machine,
                    stream: &stream,
                    held_ranks: &held_ranks,
                    hot_lock_depth,
                    opportunistic: false,
                },
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
    pub fn sync(
        &self,
        remote: String,
        no_push: bool,
        held_ranks: Vec<u32>,
        hot_lock_depth: u32,
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
                held_ranks: &held_ranks,
                hot_lock_depth,
            },
        )
        .map_err(error)?;
        Ok(json!({"mirrorsChanged":result.mirrors_changed,"warnings":result.warnings}))
    }
    #[napi]
    pub fn status(&self, held_ranks: Vec<u32>, hot_lock_depth: u32) -> Result<Value> {
        self.context(&held_ranks, hot_lock_depth)?;
        serde_json::to_value(fgos_event_store::sync::sync_status(&self.layout).map_err(error)?)
            .map_err(error)
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
        streams: Vec<String>,
        cursor: Value,
        folded: Value,
        project: bool,
        held_ranks: Vec<u32>,
        hot_lock_depth: u32,
    ) -> Result<Value> {
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
        let folded = serde_json::from_value::<Vec<fgos_event_store::envelope::Envelope>>(folded)
            .map_err(error)?;
        let result = fgos_event_store::read::read(
            driver,
            repo,
            fgos_event_store::read::ReadRequest {
                layout: &self.layout,
                origin: &origin,
                streams: &stream_ids(&streams)?,
                cursor: &cursor,
                folded: &folded,
                project,
            },
        )
        .map_err(error)?;
        let fold = match result.fold {
            fgos_event_store::cursor::Fold::Incremental => json!({"kind":"incremental"}),
            fgos_event_store::cursor::Fold::RebuildRequired { first_difference } => {
                json!({"kind":"rebuild-required","firstDifference":first_difference})
            }
        };
        Ok(
            json!({"events":result.events,"sequence":result.sequence,"legacy":result.legacy.into_iter().map(|e| json!({"event":e.event,"raw":e.raw,"provenance":e.provenance})).collect::<Vec<_>>(),"deferred":result.deferred,"missing":result.missing,"concurrent":result.concurrent,"cursor":result.cursor,"fold":fold,"fullOrder":result.full_order}),
        )
    }
}

fn operation(e: fgos_git::OperationError) -> Error {
    error(json!({"code": e.code, "cause":e.cause}))
}
