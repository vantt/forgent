//! `fgos metrics record --json <file|->`: the CLI over the record write door.
//!
//! The input is one record object or an array of them, read from the file, or from stdin when the file is `-` or
//! absent. A record may leave out `v` (2), `ts` (now), `basis` (`reported`) and `origin` (this verb); everything
//! else is the v2 envelope. Input that is not a record at all is a usage error and nothing is written. Once a
//! record reaches the door the door's rule holds: it never fails the caller. Each outcome is reported, a refused or
//! dropped record is counted in the writer's health, and the verb still succeeds.

use super::{environment, parse_flags};
use crate::contract::ObserveRequest;
use crate::record::store::{RecordDoor, WriteOutcome};
use crate::record::types::{Record, RECORD_VERSION};
use crate::time::now_iso;
use serde_json::{json, Map, Value};
use std::io::Read;

/// Input larger than this is refused before it is parsed.
const MAX_INPUT_BYTES: u64 = 4 * 1024 * 1024;

fn read_input(req: &ObserveRequest, path: Option<&str>) -> Result<Vec<u8>, String> {
    match path {
        Some(path) if path != "-" => {
            let file = std::fs::File::open(path)
                .map_err(|e| format!("metrics record: cannot read {path}: {e}"))?;
            let mut bytes = Vec::new();
            file.take(MAX_INPUT_BYTES + 1)
                .read_to_end(&mut bytes)
                .map_err(|e| format!("metrics record: cannot read {path}: {e}"))?;
            Ok(bytes)
        }
        _ => req.stdin.clone().ok_or_else(|| {
            "metrics record: no record: pass --json <file> or pipe it on stdin".to_owned()
        }),
    }
}

/// Fills what a caller may leave out, then reads the envelope.
fn to_record(index: usize, value: Value) -> Result<Record, String> {
    let Value::Object(mut object) = value else {
        return Err(format!(
            "metrics record: record {index} is not a JSON object"
        ));
    };
    object.entry("v").or_insert_with(|| json!(RECORD_VERSION));
    object.entry("id").or_insert_with(|| json!(""));
    object.entry("ts").or_insert_with(|| json!(now_iso()));
    object.entry("basis").or_insert_with(|| json!("reported"));
    object.entry("origin").or_insert_with(|| {
        Value::Object(Map::from_iter([(
            "source".to_owned(),
            json!("fgos metrics record"),
        )]))
    });
    serde_json::from_value(Value::Object(object))
        .map_err(|e| format!("metrics record: record {index}: {e}"))
}

fn outcome_json(id: &str, outcome: &WriteOutcome) -> Value {
    let (name, message) = match outcome {
        WriteOutcome::Written => ("written", None),
        WriteOutcome::Duplicate => ("duplicate", None),
        WriteOutcome::Rejected(m) => ("rejected", Some(m)),
        WriteOutcome::Failed(m) => ("failed", Some(m)),
    };
    let mut entry = json!({ "id": id, "outcome": name });
    if let Some(message) = message {
        entry["message"] = json!(message);
    }
    entry
}

pub fn dispatch_record(req: &ObserveRequest) -> Result<Value, String> {
    let flags = parse_flags("record", &req.args, &[], &[], true)?;
    let bytes = read_input(req, flags.positional())?;
    if bytes.len() as u64 > MAX_INPUT_BYTES {
        return Err(format!(
            "metrics record: input is larger than {MAX_INPUT_BYTES} bytes"
        ));
    }
    let parsed: Value = serde_json::from_slice(&bytes)
        .map_err(|e| format!("metrics record: input is not JSON: {e}"))?;
    let items = match parsed {
        Value::Array(items) => items,
        single => vec![single],
    };
    if items.is_empty() {
        return Err("metrics record: the input holds no record".to_owned());
    }
    let records = items
        .into_iter()
        .enumerate()
        .map(|(i, v)| to_record(i, v))
        .collect::<Result<Vec<_>, _>>()?;

    let env = environment();
    let door = RecordDoor::new(
        req.root.clone(),
        env.embedded_declarations(),
        env.payload_root(),
    );
    let mut counts = [0usize; 4];
    let mut outcomes = Vec::new();
    for record in records {
        let outcome = door.write(record.clone());
        counts[match outcome {
            WriteOutcome::Written => 0,
            WriteOutcome::Duplicate => 1,
            WriteOutcome::Rejected(_) => 2,
            WriteOutcome::Failed(_) => 3,
        }] += 1;
        outcomes.push(outcome_json(&record.id, &outcome));
    }
    Ok(json!({
        "ok": true,
        "written": counts[0],
        "duplicate": counts[1],
        "rejected": counts[2],
        "failed": counts[3],
        "outcomes": outcomes,
    }))
}
