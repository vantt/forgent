//! The private homes of attempts still running on one login store, served to credential renewal
//! ([`crate::credentials::LiveSeatHomes`]) from the host record beside each home and the finalization descriptor it
//! names, never from anything inside a home. Twin of `listLiveSeatHomes` in `cleanup.mjs`.

use super::orphans::{default_temp_roots, recorded_write_back, subdirs};
use super::record::read_attempt_home_record;
use fgos_process::facts::{judge_here, Record, Verdict};
use serde_json::Value;
use std::fs;
use std::path::{Path, PathBuf};

// The fields that name one login store in a write-back target (`credential_write_back_target`).
const STORE_FIELDS: [&str; 7] = [
    "provider",
    "accountId",
    "kind",
    "home",
    "layout",
    "runtimeDir",
    "store",
];

/// The seat homes under `temp_roots` (the confinement temp root of this machine by default).
pub struct AttemptHomeRecords {
    pub temp_roots: Vec<PathBuf>,
}

impl Default for AttemptHomeRecords {
    fn default() -> Self {
        Self {
            temp_roots: default_temp_roots(),
        }
    }
}

// Whether the attempt that owns `run_dir` still runs: its supervisor, as its binding records it, is not proven dead
// by the process door. An attempt with no binding yet has no owner to judge and does not count.
fn attempt_supervisor_live(run_dir: &Path) -> bool {
    let Some(supervisor) = fs::read_to_string(run_dir.join("supervisor-binding.json"))
        .ok()
        .and_then(|text| serde_json::from_str::<Value>(&text).ok())
        .and_then(|binding| binding.get("supervisor").cloned())
    else {
        return false;
    };
    if supervisor
        .get("pid")
        .and_then(Value::as_u64)
        .is_none_or(|pid| pid == 0)
    {
        return false;
    }
    judge_here(&Record::from_json(&supervisor)) != Verdict::Dead
}

impl crate::credentials::LiveSeatHomes for AttemptHomeRecords {
    fn homes(&self, target: &Value) -> Vec<PathBuf> {
        let mut found = Vec::new();
        for root in &self.temp_roots {
            for dispatch_dir in subdirs(root) {
                for home in subdirs(&dispatch_dir) {
                    let Some(record) = read_attempt_home_record(&home, None, None) else {
                        continue;
                    };
                    let Some(Some(write_back)) = recorded_write_back(&record) else {
                        continue;
                    };
                    let same_store = STORE_FIELDS.iter().all(|field| {
                        write_back.get(*field).filter(|v| !v.is_null())
                            == target.get(*field).filter(|v| !v.is_null())
                    });
                    let run_dir = record.get("runDir").and_then(Value::as_str).unwrap_or("");
                    if same_store && attempt_supervisor_live(Path::new(run_dir)) {
                        found.push(home);
                    }
                }
            }
        }
        found
    }
}
