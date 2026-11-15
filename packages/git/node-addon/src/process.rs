//! Process facts marshaling: the judgement, the identity and the signal rules live in `fgos-process`.
use crate::{check, error};
use fgos_process::control::{self, Signal, SignalOutcome};
use fgos_process::facts::{
    self, Observed, ProcTuple, Record, Scan, ScanFilter, UnreadableCause, Verdict,
};
use fgos_process::ProcId;
use napi::{Error, Result};
use napi_derive::napi;
use serde_json::{json, Value};
use std::sync::OnceLock;

/// The `process-facts-judge` contract version the vectors file declares.
pub fn contract_version() -> Result<Value> {
    let vectors: Value = serde_json::from_str(include_str!(
        "../../../process/contracts/process-facts.judge.v1.json"
    ))
    .map_err(error)?;
    Ok(vectors["contract"]["version"].clone())
}

fn tuple_json(tuple: &ProcTuple) -> Value {
    tuple.to_record().to_json()
}

#[napi(namespace = "process")]
pub fn judge(record: Option<Value>) -> Result<&'static str> {
    check()?;
    // A missing or non-object record proves nothing: unknown, never a throw.
    Ok(
        match facts::judge_here(&Record::from_json(&record.unwrap_or(Value::Null))) {
            Verdict::Alive => "alive",
            Verdict::Dead => "dead",
            Verdict::Unknown => "unknown",
        },
    )
}

#[napi(namespace = "process")]
pub fn observe(pid: Value) -> Result<Value> {
    check()?;
    let Some(pid) = pid.as_u64().filter(|p| *p > 0 && *p <= u64::from(u32::MAX)) else {
        return Ok(json!({"kind": "absent"}));
    };
    let pid = ProcId(pid as u32);
    Ok(match facts::observe(pid) {
        Observed::Absent => json!({"kind": "absent"}),
        Observed::Zombie => json!({"kind": "zombie"}),
        Observed::Unreadable(cause) => json!({"kind": "unreadable", "cause": match cause {
            UnreadableCause::DriverMissing => "driver-missing",
            UnreadableCause::Permission => "permission",
            UnreadableCause::Timeout => "timeout",
        }}),
        Observed::Live { start_time } => {
            let mut live = tuple_json(&ProcTuple {
                host: facts::host(),
                boot_id: facts::boot_id(),
                pid_ns: facts::pid_ns().id,
                pid,
                start_time,
            });
            live["kind"] = "live".into();
            live
        }
    })
}

#[napi(namespace = "process", js_name = "selfRecord")]
pub fn self_record() -> Result<Value> {
    check()?;
    static SELF: OnceLock<Value> = OnceLock::new();
    Ok(SELF
        .get_or_init(|| match facts::self_identity() {
            Some(tuple) => tuple_json(&tuple),
            // The start time could not be read: the record still names who this is, and a judge says unknown.
            None => Record {
                host: Some(facts::host()),
                boot_id: facts::boot_id(),
                pid_ns: Some(facts::pid_ns().id),
                pid: Some(ProcId(std::process::id())),
                ..Record::default()
            }
            .to_json(),
        })
        .clone())
}

#[napi(namespace = "process", js_name = "signalByIdentity")]
pub fn signal_by_identity(record: Option<Value>, signal: String) -> Result<&'static str> {
    check()?;
    let signal = match signal.as_str() {
        "term" => Signal::Term,
        "kill" => Signal::Kill,
        "int" => Signal::Int,
        other => {
            return Err(Error::new(
                napi::Status::InvalidArg,
                format!("process-door-unknown-signal: {other}"),
            ))
        }
    };
    // The driver judges the tuple again under the pidfd, so a reused pid is never signalled.
    Ok(
        match control::signal_record(&Record::from_json(&record.unwrap_or(Value::Null)), signal) {
            SignalOutcome::Sent => "sent",
            SignalOutcome::NotFound => "not-found",
            SignalOutcome::IdentityMismatch => "identity-mismatch",
            SignalOutcome::IdentityUnknown => "identity-unknown",
            SignalOutcome::Denied => "denied",
            SignalOutcome::Unsupported => "unsupported",
            SignalOutcome::Failed(_) => "failed",
        },
    )
}

#[napi(namespace = "process")]
pub fn scan(filter: Value) -> Result<Value> {
    check()?;
    let env_keys = filter
        .get("envKeys")
        .and_then(Value::as_array)
        .map(|keys| {
            keys.iter()
                .filter_map(|k| k.as_str().map(String::from))
                .collect()
        })
        .unwrap_or_default();
    let filter = ScanFilter {
        env_keys,
        include_self: filter
            .get("includeSelf")
            .and_then(Value::as_bool)
            .unwrap_or(false),
    };
    Ok(match facts::scan(&filter) {
        Scan::Unsupported => "unsupported".into(),
        Scan::Views(views) => views
            .iter()
            .map(|v| json!({"pid": v.pid.0, "tuple": v.tuple.as_ref().map(tuple_json), "exe": v.exe, "cwd": v.cwd, "cmdline": v.cmdline, "env": v.env_subset, "unreadable": v.unreadable}))
            .collect::<Vec<_>>()
            .into(),
    })
}

/// This process and its ancestors, nearest first; off Linux the chain is this process alone.
#[napi(namespace = "process", js_name = "selfChain")]
pub fn self_chain() -> Result<Vec<u32>> {
    check()?;
    Ok(control::self_chain())
}
