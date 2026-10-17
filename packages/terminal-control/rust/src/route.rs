//! `fgos internal terminal-control <op> --protocol 1 --json`: one operation of
//! the upper port per process. Contract:
//! `contracts/internal-route.terminal-control.v1.json`.
//!
//! The request arrives as one JSON object on stdin, the answer leaves as one
//! JSON line on stdout. A port result, `unsupported` and `unknown` included,
//! exits 0: the route decides nothing, it only carries the core's answer.

use crate::core::{Core, CoreConfig};
use crate::driver::herdr::{HerdrConfig, HerdrDriver};
use crate::policy::{policy_by_name, Limits};
use crate::port::*;
use serde::de::DeserializeOwned;
use serde_json::{json, Map, Value};
use std::io::Read;

/// The protocol this route speaks.
pub const PROTOCOL: u64 = 1;

const EXIT_OK: i32 = 0;
const EXIT_USAGE: i32 = 2;
const EXIT_MISMATCH: i32 = 3;
const MAX_STDIN: u64 = 1024 * 1024;

pub const OPS: [&str; 10] = [
    "allocate",
    "attach",
    "launch",
    "send",
    "read",
    "inspect",
    "release",
    "label",
    "capabilities",
    "reconcile-scan",
];

/// Layout defaults from the herdr measurements: the size the five supported
/// agent CLIs are designed for, and the panes a 352x69 tab holds at it.
const DEFAULT_LIMITS: Limits = Limits { min_cols: 80, min_rows: 20, max_panes_per_tab: 8 };
/// Ready timeout of a round plus 30 s.
const DEFAULT_ALLOCATION_GRACE_MS: u64 = 60_000;
const DEFAULT_LAUNCH_IDENTIFY_TIMEOUT_MS: u64 = 5_000;

fn line(result: &str, fields: Value) -> String {
    let mut map = Map::new();
    map.insert("v".into(), json!(1));
    map.insert("protocol".into(), json!(PROTOCOL));
    map.insert("result".into(), json!(result));
    if let Value::Object(extra) = fields {
        map.extend(extra);
    }
    Value::Object(map).to_string()
}

/// One line on stdout; a closed pipe is the caller's business, not a panic.
fn emit(text: &str) {
    use std::io::Write;
    let _ = writeln!(std::io::stdout(), "{text}");
}

fn error(code: &str, message: &str, exit: i32) -> i32 {
    eprintln!("fgos internal: {code}: {message}");
    emit(&line("error", json!({ "code": code, "message": message })));
    exit
}

fn usage(message: &str) -> i32 {
    error("usage", message, EXIT_USAGE)
}

fn refusal_fields(refusal: &Refusal) -> (String, Value) {
    match serde_json::to_value(refusal) {
        Ok(Value::Object(mut map)) => {
            let result = map.remove("result").and_then(|v| v.as_str().map(str::to_string)).unwrap_or_else(|| "unknown".into());
            (result, Value::Object(map))
        }
        _ => ("unknown".into(), json!({ "reason": "unserializable refusal" })),
    }
}

/// What one operation answered, as `(result name, fields)`.
type Answer = (String, Value);

fn answer<T>(outcome: Result<T, Refusal>, ok: impl FnOnce(T) -> Answer) -> Answer {
    match outcome {
        Ok(value) => ok(value),
        Err(refusal) => refusal_fields(&refusal),
    }
}

fn slot_answer(allocation: Allocation) -> Answer {
    ("slot".into(), json!({ "slot": allocation.slot, "origin": allocation.origin }))
}

fn ok_answer(_: ()) -> Answer {
    ("ok".into(), json!({}))
}

fn field<T: DeserializeOwned>(request: &Value, name: &str) -> Result<T, String> {
    let value = request.get(name).ok_or_else(|| format!("request.{name} is missing"))?;
    serde_json::from_value(value.clone()).map_err(|e| format!("request.{name}: {e}"))
}

fn optional<T: DeserializeOwned>(request: &Value, name: &str) -> Result<Option<T>, String> {
    match request.get(name) {
        None | Some(Value::Null) => Ok(None),
        Some(value) => serde_json::from_value(value.clone()).map(Some).map_err(|e| format!("request.{name}: {e}")),
    }
}

fn whole<T: DeserializeOwned>(request: &Value) -> Result<T, String> {
    serde_json::from_value(request.clone()).map_err(|e| format!("request: {e}"))
}

/// The optional `config` object of the stdin envelope: layout limits, the
/// placement policy and the two core timeouts. Absent keys keep the defaults.
fn core_config(envelope: &Value) -> Result<(CoreConfig, Option<String>), String> {
    let config = envelope.get("config").cloned().unwrap_or_else(|| json!({}));
    let number = |name: &str, default: u64| -> Result<u64, String> {
        match config.get(name) {
            None | Some(Value::Null) => Ok(default),
            Some(v) => v.as_u64().ok_or_else(|| format!("config.{name} needs a non-negative integer")),
        }
    };
    let limit = |name: &str, default: u32| -> Result<u32, String> {
        let n = number(name, default as u64)?;
        u32::try_from(n).ok().filter(|n| *n >= 1).ok_or_else(|| format!("config.{name} needs an integer >= 1"))
    };
    let limits = Limits {
        min_cols: limit("minCols", DEFAULT_LIMITS.min_cols)?,
        min_rows: limit("minRows", DEFAULT_LIMITS.min_rows)?,
        max_panes_per_tab: limit("maxPanesPerTab", DEFAULT_LIMITS.max_panes_per_tab)?,
    };
    let policy = match config.get("policy") {
        None | Some(Value::Null) => None,
        Some(v) => Some(v.as_str().ok_or("config.policy needs a string")?.to_string()),
    };
    let core = CoreConfig {
        state_root: crate::store::default_state_root(),
        limits,
        allocation_grace_ms: number("allocationGraceMs", DEFAULT_ALLOCATION_GRACE_MS)?,
        launch_identify_timeout_ms: number("launchIdentifyTimeoutMs", DEFAULT_LAUNCH_IDENTIFY_TIMEOUT_MS)?,
    };
    Ok((core, policy))
}

fn herdr_config(envelope: &Value) -> Result<HerdrConfig, String> {
    let mut config = HerdrConfig::new(match envelope.get("herdrBin") {
        None | Some(Value::Null) => String::new(),
        Some(v) => v.as_str().ok_or("herdrBin needs a string")?.to_string(),
    });
    if let Some(env) = envelope.get("env") {
        let map = env.as_object().ok_or("env needs an object of strings")?;
        for (key, value) in map {
            let value = value.as_str().ok_or_else(|| format!("env.{key} needs a string"))?;
            match key.as_str() {
                "HERDR_SESSION" => config.session = Some(value.to_string()),
                "HERDR_SOCKET_PATH" => config.socket_path = Some(value.to_string()),
                _ => {}
            }
            config.env.push((key.clone(), value.to_string()));
        }
    }
    Ok(config)
}

fn dispatch(op: &str, core: &Core, request: &Value) -> Result<Answer, String> {
    Ok(match op {
        "allocate" => answer(core.allocate(&whole::<AllocateRequest>(request)?), slot_answer),
        "attach" => {
            let key: String = field(request, "key")?;
            let pane: String = field(request, "pane")?;
            let group_key: Option<String> = optional(request, "groupKey")?;
            let display: Option<Display> = optional(request, "display")?;
            answer(core.attach(&key, &pane, group_key.as_deref(), display), slot_answer)
        }
        "launch" => {
            let key: String = field(request, "key")?;
            let spec: LaunchSpec = field(request, "launchSpec")?;
            match core.launch(&key, &spec) {
                Ok(LaunchOutcome::Launched(identity)) => ("launched".into(), json!({ "identity": identity })),
                Ok(LaunchOutcome::NotStarted { reason }) => ("not-started".into(), json!({ "reason": reason })),
                Err(refusal) => refusal_fields(&refusal),
            }
        }
        "send" => {
            let key: String = field(request, "key")?;
            let text: Option<String> = optional(request, "text")?;
            let keys: Option<Vec<String>> = optional(request, "keys")?;
            let submit: Option<bool> = optional(request, "submit")?;
            if text.is_some() == keys.is_some() {
                return Err("send takes exactly one of request.text or request.keys".into());
            }
            answer(core.send(&key, text.as_deref(), keys.as_deref(), submit.unwrap_or(false)), ok_answer)
        }
        "read" => {
            let key: String = field(request, "key")?;
            let lines: Option<u32> = optional(request, "lines")?;
            if lines == Some(0) {
                return Err("request.lines needs an integer >= 1".into());
            }
            let source: Option<String> = optional(request, "source")?;
            if let Some(source) = &source {
                if !["visible", "recent", "recent-unwrapped", "detection"].contains(&source.as_str()) {
                    return Err(format!("request.source must be visible, recent, recent-unwrapped or detection, got {source}"));
                }
            }
            answer(core.read(&key, lines, source.as_deref()), |screen| ("screen".into(), json!({ "screen": screen })))
        }
        "inspect" => {
            let key: String = field(request, "key")?;
            let detail: Option<bool> = optional(request, "detail")?;
            let inspection = core.inspect(&key, detail.unwrap_or(false));
            let mut fields = json!({ "pane": inspection.pane });
            if let Some(foreground) = inspection.foreground {
                fields["foreground"] = json!(foreground);
            }
            if let Some(activity) = inspection.activity {
                fields["activity"] = json!(activity);
            }
            ("inspection".into(), fields)
        }
        "release" => {
            let key: String = field(request, "key")?;
            let disposition: Disposition = field(request, "disposition")?;
            let until: Option<u64> = optional(request, "until")?;
            match core.release(&key, disposition, until) {
                Ok(ReleaseOutcome::Released { disposition }) => ("released".into(), json!({ "disposition": disposition })),
                Ok(ReleaseOutcome::KeptUnknown { reason }) => ("kept-unknown".into(), json!({ "reason": reason })),
                Err(refusal) => refusal_fields(&refusal),
            }
        }
        "label" => {
            let key: String = field(request, "key")?;
            let display: Display = field(request, "display")?;
            let report_state: Option<String> = optional(request, "reportState")?;
            answer(core.label(&key, &display, report_state.as_deref()), ok_answer)
        }
        "capabilities" => {
            let report = core.capabilities();
            ("capabilities".into(), json!({ "driver": report.driver, "capabilities": report.capabilities, "serverIncarnation": report.server_incarnation }))
        }
        "reconcile-scan" => {
            let older: u64 = field(request, "olderThanMs")?;
            answer(core.reconcile_scan(older), |findings| ("scan".into(), json!({ "findings": findings })))
        }
        other => return Err(format!("unknown op {other}")),
    })
}

fn read_stdin() -> Result<Value, String> {
    let mut buf = Vec::new();
    std::io::stdin().take(MAX_STDIN + 1).read_to_end(&mut buf).map_err(|e| format!("stdin: {e}"))?;
    if buf.len() as u64 > MAX_STDIN {
        return Err("stdin exceeds 1 MiB".into());
    }
    if buf.iter().all(u8::is_ascii_whitespace) {
        return Ok(json!({}));
    }
    serde_json::from_slice(&buf).map_err(|e| format!("stdin is not JSON: {e}"))
}

/// `fgos internal terminal-control ...`; `args` are the arguments after the
/// route name. Returns the process exit code and prints one JSON line.
pub fn main(args: &[String]) -> i32 {
    let mut protocol: Option<&str> = None;
    let mut json_flag = false;
    let mut op: Option<&str> = None;
    // Reported after the protocol check: a caller of another release learns
    // the version mismatch first.
    let mut stray: Option<String> = None;
    let mut it = args.iter();
    while let Some(arg) = it.next() {
        match arg.as_str() {
            "--protocol" => protocol = it.next().map(String::as_str),
            "--json" => json_flag = true,
            other if other.starts_with("--") => {
                stray.get_or_insert_with(|| format!("unknown argument {other}"));
            }
            other if op.is_none() => op = Some(other),
            other => {
                stray.get_or_insert_with(|| format!("unexpected argument {other}"));
            }
        }
    }
    if protocol != Some("1") {
        let message = format!("this host speaks internal protocol {PROTOCOL}; the call asked for {}", protocol.unwrap_or("none"));
        return error("host-version-mismatch", &message, EXIT_MISMATCH);
    }
    if let Some(message) = stray {
        return usage(&message);
    }
    let Some(op) = op else {
        return usage("fgos internal terminal-control <op> --protocol 1 --json");
    };
    if !json_flag {
        return usage("--json is required");
    }
    if !OPS.contains(&op) {
        return usage(&format!("unknown op {op}; one of {}", OPS.join(", ")));
    }
    let envelope = match read_stdin() {
        Ok(v) => v,
        Err(message) => return usage(&message),
    };
    if envelope.get("v").and_then(Value::as_u64) != Some(1) {
        return usage("stdin.v must be 1");
    }
    match envelope.get("driver").and_then(Value::as_str) {
        None | Some("herdr") => {}
        Some(other) => return usage(&format!("unknown driver {other}")),
    }
    let (config, policy_name) = match core_config(&envelope) {
        Ok(c) => c,
        Err(message) => return usage(&message),
    };
    let herdr = match herdr_config(&envelope) {
        Ok(c) => c,
        Err(message) => return usage(&message),
    };
    let policy = match policy_by_name(policy_name.as_deref()) {
        Ok(p) => p,
        Err(e) => return usage(&e.to_string()),
    };
    let request = envelope.get("request").cloned().unwrap_or_else(|| json!({}));
    let driver = HerdrDriver::new(herdr);
    let core = Core::new(&driver, policy.as_ref(), config);
    match dispatch(op, &core, &request) {
        Ok((result, fields)) => {
            let mut fields = fields;
            // `op` rides next to the result, as the contract's stdout shape says.
            fields["op"] = json!(op);
            emit(&line(&result, fields));
            EXIT_OK
        }
        Err(message) => usage(&message),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn args(list: &[&str]) -> Vec<String> {
        list.iter().map(|s| s.to_string()).collect()
    }

    #[test]
    fn a_protocol_other_than_one_is_a_version_mismatch() {
        assert_eq!(main(&args(&["capabilities", "--json"])), EXIT_MISMATCH);
        assert_eq!(main(&args(&["capabilities", "--protocol", "2", "--json"])), EXIT_MISMATCH);
        assert_eq!(main(&args(&["capabilities", "--protocol=2", "--json"])), EXIT_MISMATCH);
        assert_eq!(main(&args(&["capabilities", "--new-flag", "--protocol", "2", "--json"])), EXIT_MISMATCH);
    }

    #[test]
    fn usage_errors_exit_two() {
        assert_eq!(main(&args(&["--protocol", "1", "--json"])), EXIT_USAGE);
        assert_eq!(main(&args(&["nope", "--protocol", "1", "--json"])), EXIT_USAGE);
        assert_eq!(main(&args(&["capabilities", "--protocol", "1"])), EXIT_USAGE);
        assert_eq!(main(&args(&["capabilities", "extra", "--protocol", "1", "--json"])), EXIT_USAGE);
    }

    #[test]
    fn config_defaults_and_overrides() {
        let (config, policy) = core_config(&json!({})).unwrap();
        assert_eq!((config.limits.min_cols, config.limits.min_rows, config.limits.max_panes_per_tab), (80, 20, 8));
        assert_eq!(config.allocation_grace_ms, 60_000);
        assert!(policy.is_none());
        let (config, policy) = core_config(&json!({ "config": { "minCols": 40, "policy": "measured-split" } })).unwrap();
        assert_eq!(config.limits.min_cols, 40);
        assert_eq!(policy.as_deref(), Some("measured-split"));
        assert!(core_config(&json!({ "config": { "minRows": 0 } })).is_err());
    }
}
