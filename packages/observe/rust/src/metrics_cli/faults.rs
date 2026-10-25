//! CLI handler for `fgos metrics faults` (Lane A - Phase F4).
//!
//! Subcommand: `fgos metrics faults [--class <c>] [--since <iso>] [--until <iso>] [--limit <N>]`

use crate::contract::{ObserveRequest, Window};
use crate::metrics_cli::parse_flags;
use crate::sources::invocation_faults::InvocationFaultsSource;
use crate::ObservationSource;
use serde_json::json;
use std::collections::BTreeMap;

pub fn dispatch_faults(req: &ObserveRequest) -> Result<serde_json::Value, String> {
    let flags = parse_flags("faults", &req.args, &["--class", "--since", "--until", "--limit"], &[], false)?;
    let fault_class_filter = flags.value("--class").map(str::to_owned);
    let limit = match flags.number::<usize>("--limit") {
        Ok(Some(0)) | Err(_) => return Err("faults --limit requires a positive integer value".to_string()),
        Ok(limit) => limit,
    };

    let src = InvocationFaultsSource::new();
    let window = Window {
        since: flags.value("--since").map(str::to_owned),
        until: flags.value("--until").map(str::to_owned),
    };
    let obs = src
        .observations(&req.root, &window)
        .map_err(|e| e.to_string())?;

    let mut records = Vec::new();
    let mut by_class: BTreeMap<String, u64> = BTreeMap::new();

    for o in obs {
        let cls = o
            .attrs
            .get("faultClass")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown")
            .to_string();

        if let Some(target_cls) = &fault_class_filter {
            if &cls != target_cls {
                continue;
            }
        }

        *by_class.entry(cls).or_insert(0) += 1;
        records.push(serde_json::Value::Object(o.attrs));
    }

    let total = records.len();
    let displayed_records = if let Some(n) = limit {
        if records.len() > n {
            records.split_off(records.len() - n)
        } else {
            records
        }
    } else {
        records
    };

    Ok(json!({
        "ok": true,
        "count": total,
        "byClass": by_class,
        "records": displayed_records
    }))
}
