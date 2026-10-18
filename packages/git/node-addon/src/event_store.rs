//! Marshaling only: the Event Store owns validation, locking and persistence.
use crate::{check, error};
use fgos_event_store::{
    append,
    identity::StoreIdentity,
    layout::{Layout, StreamId},
    open_read,
    registry::{ConsumerContract, Registry},
    rotate,
};
use napi::{Error, Result};
use napi_derive::napi;
use serde::Deserialize;
use serde_json::{json, Value};
use std::path::Path;

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
        })
    }
    #[napi]
    pub fn identity(&self, machine: String) -> Result<Value> {
        available()?;
        serde_json::to_value(StoreIdentity::open(&self.layout, &machine).map_err(error)?)
            .map_err(error)
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
    #[napi]
    pub fn rotate(&self, machine: String, stream: String, held_ranks: Vec<u32>) -> Result<Value> {
        available()?;
        let result = rotate::rotate(
            &self.layout,
            &machine,
            &StreamId::parse(&stream).map_err(error)?,
            &held_ranks,
        )
        .map_err(error)?;
        Ok(
            json!({"segment": result.segment, "lastSeq": result.last_seq, "guarantee": guarantee(&result.guarantee)}),
        )
    }
}
