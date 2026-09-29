//! CLI handler for `fgos metrics faults` (Lane A - Phase F4).
//!
//! Subcommand: `fgos metrics faults [--class <c>] [--since <iso>] [--until <iso>] [--limit <N>]`

use crate::contract::{ObserveRequest, Window};
use crate::sources::invocation_faults::InvocationFaultsSource;
use crate::ObservationSource;
use serde_json::json;
use std::collections::BTreeMap;

pub fn dispatch_faults(req: &ObserveRequest) -> Result<serde_json::Value, String> {
    let mut fault_class_filter = None;
    let mut since = None;
    let mut until = None;
    let mut limit: Option<usize> = None;

    let mut i = 0;
    while i < req.args.len() {
        let arg = &req.args[i];
        if arg == "--class" {
            if i + 1 >= req.args.len() {
                return Err("missing value for --class".to_string());
            }
            fault_class_filter = Some(req.args[i + 1].clone());
            i += 2;
        } else if arg == "--since" {
            if i + 1 >= req.args.len() {
                return Err("missing value for --since".to_string());
            }
            since = Some(req.args[i + 1].clone());
            i += 2;
        } else if arg == "--until" {
            if i + 1 >= req.args.len() {
                return Err("missing value for --until".to_string());
            }
            until = Some(req.args[i + 1].clone());
            i += 2;
        } else if arg == "--limit" {
            if i + 1 >= req.args.len() {
                return Err("missing value for --limit".to_string());
            }
            let lim_str = &req.args[i + 1];
            let n = lim_str.parse::<usize>().map_err(|_| {
                "faults --limit requires a positive integer value".to_string()
            })?;
            if n == 0 {
                return Err("faults --limit requires a positive integer value".to_string());
            }
            limit = Some(n);
            i += 2;
        } else if arg.starts_with("--dir") {
            // Already handled in host root resolution
            if arg == "--dir" {
                i += 2;
            } else {
                i += 1;
            }
        } else {
            return Err(format!("unexpected argument for metrics faults: {}", arg));
        }
    }

    let src = InvocationFaultsSource::new();
    let window = Window { since, until };
    let obs = src
        .observations(&req.root, &window)
        .map_err(|e| e.to_string())?;

    let mut records = Vec::new();
    let mut by_class: BTreeMap<String, u64> = BTreeMap::new();

    for o in obs {
        let cls = o.attrs.get("faultClass")
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
