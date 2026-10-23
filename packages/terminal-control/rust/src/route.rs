//! `fgos internal terminal-control <op> --protocol 1 --json`: one operation of
//! the upper port per process. Contract:
//! `contracts/internal-route.terminal-control.v1.json`.
//!
//! The request arrives as one JSON object on stdin, the answer leaves as one
//! JSON line on stdout. A port result, `unsupported` and `unknown` included,
//! exits 0: the route decides nothing, it only carries the core's answer.

use crate::core::{Core, CoreConfig, Want};
use crate::driver::herdr::{HerdrConfig, HerdrDriver};
use crate::policy::{policy_by_name, Limits, PlacementPolicy, DEFAULT_POLICY, POLICY_NAMES};
use crate::port::*;
use serde::de::DeserializeOwned;
use serde_json::{json, Map, Value};
use std::io::Read;
use std::time::{Duration, Instant};

/// The protocol this route speaks.
pub const PROTOCOL: u64 = 1;

const EXIT_OK: i32 = 0;
const EXIT_USAGE: i32 = 2;
const EXIT_MISMATCH: i32 = 3;
const CODE_BELOW_FLOOR: &str = "terminal-config-below-floor";
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
pub const DEFAULT_LIMITS: Limits = Limits { min_cols: 80, min_rows: 20, max_panes_per_tab: 8 };
/// The smallest pane the five supported agent CLIs were measured to start in.
pub const LIMITS_FLOOR: Limits = Limits { min_cols: 40, min_rows: 8, max_panes_per_tab: 1 };
/// Ready timeout of a round plus 30 s.
pub const DEFAULT_ALLOCATION_GRACE_MS: u64 = 60_000;
pub const DEFAULT_LAUNCH_IDENTIFY_TIMEOUT_MS: u64 = 5_000;
pub const DEFAULT_SHELL_READY_TIMEOUT_MS: u64 = 10_000;

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

/// A config the core will not run with: the route's error code and what to tell the caller.
#[derive(Debug)]
struct ConfigRefusal {
    code: &'static str,
    message: String,
}

impl From<String> for ConfigRefusal {
    fn from(message: String) -> Self {
        ConfigRefusal { code: "usage", message }
    }
}

/// The core's value for every `config` key the envelope accepts.
fn defaults() -> Value {
    json!({
        "minCols": DEFAULT_LIMITS.min_cols,
        "minRows": DEFAULT_LIMITS.min_rows,
        "maxPanesPerTab": DEFAULT_LIMITS.max_panes_per_tab,
        "policy": DEFAULT_POLICY,
        "allocationGraceMs": DEFAULT_ALLOCATION_GRACE_MS,
        "launchIdentifyTimeoutMs": DEFAULT_LAUNCH_IDENTIFY_TIMEOUT_MS,
        "shellReadyTimeoutMs": DEFAULT_SHELL_READY_TIMEOUT_MS,
    })
}

/// The optional `config` object of the stdin envelope: layout limits, the
/// placement policy and the three core timeouts. Absent keys keep the defaults;
/// a limit below the measured floor or an unregistered policy is refused by name.
fn core_config(envelope: &Value) -> Result<(CoreConfig, Box<dyn PlacementPolicy>), ConfigRefusal> {
    let config = envelope.get("config").cloned().unwrap_or_else(|| json!({}));
    let number = |name: &str, default: u64| -> Result<u64, String> {
        match config.get(name) {
            None | Some(Value::Null) => Ok(default),
            Some(v) => v.as_u64().ok_or_else(|| format!("config.{name} needs a non-negative integer, got {v}")),
        }
    };
    let limit = |name: &str, default: u32, floor: u32| -> Result<u32, ConfigRefusal> {
        let n = number(name, default as u64)?;
        let n = u32::try_from(n).ok().filter(|n| *n >= 1).ok_or_else(|| format!("config.{name} needs an integer >= 1, got {n}"))?;
        if n < floor {
            let message = format!("layout.{name}={n} < {floor}, the measured floor: the agent CLIs were not shown to start in a pane that small");
            return Err(ConfigRefusal { code: CODE_BELOW_FLOOR, message });
        }
        Ok(n)
    };
    let limits = Limits {
        min_cols: limit("minCols", DEFAULT_LIMITS.min_cols, LIMITS_FLOOR.min_cols)?,
        min_rows: limit("minRows", DEFAULT_LIMITS.min_rows, LIMITS_FLOOR.min_rows)?,
        max_panes_per_tab: limit("maxPanesPerTab", DEFAULT_LIMITS.max_panes_per_tab, LIMITS_FLOOR.max_panes_per_tab)?,
    };
    let policy_name = match config.get("policy") {
        None | Some(Value::Null) => None,
        Some(v) => Some(v.as_str().ok_or_else(|| "config.policy needs a string".to_string())?),
    };
    let policy = policy_by_name(policy_name).map_err(|e| e.to_string())?;
    let core = CoreConfig {
        state_root: crate::store::default_state_root(),
        limits,
        allocation_grace_ms: number("allocationGraceMs", DEFAULT_ALLOCATION_GRACE_MS)?,
        launch_identify_timeout_ms: number("launchIdentifyTimeoutMs", DEFAULT_LAUNCH_IDENTIFY_TIMEOUT_MS)?,
        shell_ready_timeout_ms: number("shellReadyTimeoutMs", DEFAULT_SHELL_READY_TIMEOUT_MS)?,
    };
    Ok((core, policy))
}

/// The caller's whole budget for this operation rides in `timeoutMs`; herdr commands may use
/// nine tenths of it, so a stuck command is answered `unknown` before the caller gives up.
fn herdr_config(envelope: &Value, started: Instant) -> Result<HerdrConfig, String> {
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
    match envelope.get("timeoutMs") {
        None | Some(Value::Null) => {}
        Some(v) => {
            let ms = v.as_u64().filter(|ms| *ms >= 1).ok_or("timeoutMs needs an integer >= 1")?;
            config.deadline = Some(started + Duration::from_millis(ms - ms / 10));
        }
    }
    // herdr sets `HERDR_SOCKET_PATH` in every pane it creates, so a caller
    // running inside one reaches the same server the CLI would; the caller's own
    // `env` still wins.
    if config.socket_path.is_none() {
        config.socket_path = std::env::var("HERDR_SOCKET_PATH").ok().filter(|p| !p.is_empty());
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
            match core.send(&key, text.as_deref(), keys.as_deref(), submit.unwrap_or(false)) {
                Ok(SendOutcome::Sent) => ok_answer(()),
                Ok(SendOutcome::ForegroundNotAgent { reason }) => ("foreground-not-agent".into(), json!({ "reason": reason })),
                Err(refusal) => refusal_fields(&refusal),
            }
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
            let foreground: Option<bool> = optional(request, "foreground")?;
            let activity: Option<bool> = optional(request, "activity")?;
            let inspection = core.inspect_parts(&key, Want { detail: detail.unwrap_or(false), foreground: foreground.unwrap_or(true), activity: activity.unwrap_or(true) });
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
            let caller_pane: Option<String> = optional(request, "callerPane")?;
            match core.release_as(&key, disposition, until, caller_pane.as_deref()) {
                Ok(ReleaseOutcome::Released { disposition }) => ("released".into(), json!({ "disposition": disposition })),
                Ok(ReleaseOutcome::KeptUnknown { reason }) => ("kept-unknown".into(), json!({ "reason": reason })),
                Err(refusal) => refusal_fields(&refusal),
            }
        }
        "label" => {
            let key: String = field(request, "key")?;
            let display: Display = field(request, "display")?;
            answer(core.label(&key, &display), ok_answer)
        }
        "capabilities" => {
            let report = core.capabilities();
            ("capabilities".into(), json!({
                "driver": report.driver,
                "capabilities": report.capabilities,
                "serverIncarnation": report.server_incarnation,
                "defaults": defaults(),
                "policies": POLICY_NAMES,
            }))
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
    let started = Instant::now();
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
    let (config, policy) = match core_config(&envelope) {
        Ok(c) => c,
        Err(refusal) => return error(refusal.code, &refusal.message, EXIT_USAGE),
    };
    let herdr = match herdr_config(&envelope, started) {
        Ok(c) => c,
        Err(message) => return usage(&message),
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
        assert_eq!(policy.name(), DEFAULT_POLICY);
        let (config, policy) = core_config(&json!({ "config": { "minCols": 40, "policy": "measured-split" } })).unwrap();
        assert_eq!(config.limits.min_cols, 40);
        assert_eq!(policy.name(), "measured-split");
        assert!(core_config(&json!({ "config": { "minRows": 0 } })).is_err());
        assert!(core_config(&json!({ "config": { "policy": "nope" } })).is_err());
    }

    #[test]
    fn an_envelope_below_the_measured_floor_is_refused_by_name() {
        for (config, named) in [
            (json!({ "minCols": 30 }), "layout.minCols=30 < 40"),
            (json!({ "minRows": 7 }), "layout.minRows=7 < 8"),
        ] {
            let Err(refusal) = core_config(&json!({ "config": config })) else { panic!("{named} was accepted") };
            assert_eq!(refusal.code, CODE_BELOW_FLOOR);
            assert!(refusal.message.starts_with(named), "{}", refusal.message);
        }
        assert!(core_config(&json!({ "config": { "minCols": 40, "minRows": 8 } })).is_ok(), "the floor itself is allowed");
    }

    #[test]
    fn the_operation_budget_bounds_every_herdr_command() {
        let started = Instant::now();
        assert!(herdr_config(&json!({ "timeoutMs": 0 }), started).is_err());
        assert!(herdr_config(&json!({}), started).unwrap().deadline.is_none());
        let deadline = herdr_config(&json!({ "timeoutMs": 10_000 }), started).unwrap().deadline.unwrap();
        assert_eq!(deadline.duration_since(started), Duration::from_millis(9_000));
    }
}
