//! The unit-run record (`<fgos dir>/assignments/<unitRunId>/unit.json`): written whole through the durable-file door
//! as `JSON.stringify(record, null, 2)` plus a newline (Node's `publishMutableProjection`), so the bytes are the ones
//! the Node release wrote and reads back after a rollback, and `run_facts` judges them unchanged.

use std::path::Path;

use serde_json::Value;

use super::run_unit_contract::RunUnitError;

/// The bytes of a record as Node writes them.
pub fn record_bytes(record: &Value) -> Vec<u8> {
    let mut text = serde_json::to_string_pretty(record).unwrap_or_default();
    text.push('\n');
    text.into_bytes()
}

/// Write `unit.json` under `unit_dir` (created when missing), replacing the old one atomically and durably.
pub fn publish_unit_record(unit_dir: &Path, record: &Value) -> Result<(), String> {
    std::fs::create_dir_all(unit_dir)
        .map_err(|e| format!("cannot create {}: {e}", unit_dir.display()))?;
    fgos_durable_file::replace_durably_with_mode(
        unit_dir,
        "unit.json",
        &record_bytes(record),
        0o644,
    )
    .map(|_| ())
    .map_err(|e| format!("cannot write {}: {e}", unit_dir.join("unit.json").display()))
}

/// `unit.json` read back for a resume; a file that does not parse is refused by name.
pub fn read_unit_record(unit_run_id: &str, unit_json: &Path) -> Result<Value, RunUnitError> {
    let read = std::fs::read(unit_json)
        .map_err(|e| e.to_string())
        .and_then(|bytes| serde_json::from_slice::<Value>(&bytes).map_err(|e| e.to_string()));
    read.map_err(|why| {
        RunUnitError::config(
            format!(
                "cannot resume unit run \"{unit_run_id}\": unit-record-unreadable: {} ({why})",
                unit_json.display()
            ),
            Some("unit-record-unreadable"),
            None,
        )
        .with("path", serde_json::json!(unit_json.display().to_string()))
    })
}
