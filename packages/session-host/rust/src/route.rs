//! `fgos internal session-host <op> --protocol 1 --json`: one operation of the port per process, one
//! JSON request on stdin, one JSON line out. A port answer, a refusal included, exits 0: the route
//! decides nothing, it only carries the host's answer.

use crate::direct::OsDirect;
use crate::host::{SessionHost, DEFAULT_GRACE_MS, DEFAULT_READY_MS};
use crate::types::*;
use fgos_terminal_control::core::{Core, CoreConfig};
use fgos_terminal_control::driver::herdr::{HerdrConfig, HerdrDriver};
use fgos_terminal_control::identity;
use fgos_terminal_control::policy::policy_by_name;
use fgos_terminal_control::route::{
    DEFAULT_ALLOCATION_GRACE_MS, DEFAULT_LAUNCH_IDENTIFY_TIMEOUT_MS, DEFAULT_LIMITS,
    DEFAULT_SHELL_READY_TIMEOUT_MS,
};
use serde::de::DeserializeOwned;
use serde_json::{json, Map, Value};
use std::io::Read;
use std::time::{Duration, Instant};

pub const PROTOCOL: u64 = 1;
pub const OPS: [&str; 4] = ["start", "alive", "front", "retire"];

const EXIT_OK: i32 = 0;
const EXIT_USAGE: i32 = 2;
const EXIT_MISMATCH: i32 = 3;
const MAX_STDIN: u64 = 1024 * 1024;

fn line(result: &str, fields: Value) -> String {
    let mut map = Map::new();
    map.insert("v".into(), json!(1));
    map.insert("protocol".into(), json!(PROTOCOL));
    map.insert("result".into(), json!(result));
    map.extend(object(fields));
    Value::Object(map).to_string()
}

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
    let mut fields = json!({ "code": refusal.code });
    if let Some(detail) = &refusal.detail {
        fields["detail"] = json!(detail);
    }
    let result = match refusal.result {
        RefusalKind::Unsupported => "unsupported",
        RefusalKind::Unknown => "unknown",
    };
    (result.into(), fields)
}

fn whole<T: DeserializeOwned>(request: &Value, name: &str) -> Result<T, String> {
    let value = request
        .get(name)
        .ok_or_else(|| format!("request.{name} is missing"))?;
    serde_json::from_value(value.clone()).map_err(|e| format!("request.{name}: {e}"))
}

fn read_stdin() -> Result<Value, String> {
    let mut buf = Vec::new();
    std::io::stdin()
        .take(MAX_STDIN + 1)
        .read_to_end(&mut buf)
        .map_err(|e| format!("stdin: {e}"))?;
    if buf.len() as u64 > MAX_STDIN {
        return Err("stdin exceeds 1 MiB".into());
    }
    if buf.iter().all(u8::is_ascii_whitespace) {
        return Ok(json!({}));
    }
    serde_json::from_slice(&buf).map_err(|e| format!("stdin is not JSON: {e}"))
}

/// The caller's whole budget for this operation rides in `timeoutMs`; herdr commands may use nine
/// tenths of it, so a stuck command is answered `unknown` before the caller gives up.
fn herdr_config(envelope: &Value, started: Instant) -> Result<HerdrConfig, String> {
    let mut config = HerdrConfig::new(match envelope.get("herdrBin") {
        None | Some(Value::Null) => String::new(),
        Some(v) => v.as_str().ok_or("herdrBin needs a string")?.to_string(),
    });
    if let Some(env) = envelope.get("env") {
        let map = env.as_object().ok_or("env needs an object of strings")?;
        for (key, value) in map {
            let value = value
                .as_str()
                .ok_or_else(|| format!("env.{key} needs a string"))?;
            match key.as_str() {
                "HERDR_SESSION" => config.session = Some(value.to_string()),
                "HERDR_SOCKET_PATH" => config.socket_path = Some(value.to_string()),
                _ => {}
            }
            config.env.push((key.clone(), value.to_string()));
        }
    }
    if let Some(v) = envelope.get("timeoutMs").filter(|v| !v.is_null()) {
        let ms = v
            .as_u64()
            .filter(|ms| *ms >= 1)
            .ok_or("timeoutMs needs an integer >= 1")?;
        config.deadline = Some(started + Duration::from_millis(ms - ms / 10));
    }
    // herdr sets `HERDR_SOCKET_PATH` in every pane it creates; a caller inside one reaches the same
    // server, and a named session is never redirected to the inherited socket of another one.
    if config.socket_path.is_none() && config.session.is_none() {
        config.socket_path = std::env::var("HERDR_SOCKET_PATH")
            .ok()
            .filter(|p| !p.is_empty());
    }
    Ok(config)
}

fn milliseconds(envelope: &Value, name: &str, default: u64) -> Result<u64, String> {
    match envelope.get(name).filter(|v| !v.is_null()) {
        None => Ok(default),
        Some(v) => v
            .as_u64()
            .ok_or_else(|| format!("{name} needs a non-negative integer")),
    }
}

fn run(op: &str, host: &SessionHost, envelope: &Value) -> Result<(String, Value), String> {
    let request = envelope
        .get("request")
        .cloned()
        .unwrap_or_else(|| json!({}));
    Ok(match op {
        "start" => {
            let cli = match envelope.get("cli").filter(|v| !v.is_null()) {
                None => None,
                Some(v) => Some(v.as_str().ok_or("cli needs a string")?.to_string()),
            };
            let start: StartRequest =
                serde_json::from_value(request).map_err(|e| format!("request: {e}"))?;
            match host.start(&start, cli.as_deref()) {
                StartAnswer::Placed(placement) => {
                    ("placed".into(), json!({ "placement": placement }))
                }
                StartAnswer::Refused(refusal) => refusal_fields(&refusal),
            }
        }
        "alive" => {
            let placement: Placement = whole(&request, "placement")?;
            let answer = host.alive(&placement);
            let mut fields = json!({});
            if let Some(detail) = answer.detail {
                fields["detail"] = json!(detail);
            }
            let result = match answer.result {
                Liveness::Live => "live",
                Liveness::Gone => "gone",
                Liveness::Unknown => "unknown",
            };
            (result.into(), fields)
        }
        "front" => {
            let placement: Placement = whole(&request, "placement")?;
            match host.front(&placement) {
                FrontAnswer::Fronted => ("fronted".into(), json!({})),
                FrontAnswer::Refused(refusal) => refusal_fields(&refusal),
            }
        }
        "retire" => {
            let placement: Placement = whole(&request, "placement")?;
            let disposition: Retirement = whole(&request, "disposition")?;
            match host.retire(&placement, disposition) {
                RetireAnswer::Retired => ("retired".into(), json!({})),
                RetireAnswer::Refused(refusal) => refusal_fields(&refusal),
            }
        }
        other => return Err(format!("unknown op {other}")),
    })
}

/// `fgos internal session-host ...`; `args` are the arguments after the route name. Returns the
/// process exit code and prints one JSON line.
pub fn main(args: &[String]) -> i32 {
    let started = Instant::now();
    let mut protocol: Option<&str> = None;
    let mut json_flag = false;
    let mut op: Option<&str> = None;
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
        let message = format!(
            "this host speaks internal protocol {PROTOCOL}; the call asked for {}",
            protocol.unwrap_or("none")
        );
        return error("host-version-mismatch", &message, EXIT_MISMATCH);
    }
    if let Some(message) = stray {
        return usage(&message);
    }
    let Some(op) = op else {
        return usage("fgos internal session-host <op> --protocol 1 --json");
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
    let timing = (|| {
        Ok::<_, String>((
            milliseconds(&envelope, "readyMs", DEFAULT_READY_MS)?,
            milliseconds(&envelope, "graceMs", DEFAULT_GRACE_MS)?,
        ))
    })();
    let (ready_ms, grace_ms) = match timing {
        Ok(t) => t,
        Err(message) => return usage(&message),
    };
    let herdr = match herdr_config(&envelope, started) {
        Ok(c) => c,
        Err(message) => return usage(&message),
    };
    let policy = match policy_by_name(None) {
        Ok(p) => p,
        Err(e) => return usage(&e.to_string()),
    };
    let driver = HerdrDriver::new(herdr);
    // The route is a child of its caller: the OS names the caller, the request never does.
    let core = Core::new(
        &driver,
        policy.as_ref(),
        CoreConfig {
            state_root: fgos_terminal_control::store::default_state_root(),
            limits: DEFAULT_LIMITS,
            allocation_grace_ms: DEFAULT_ALLOCATION_GRACE_MS,
            launch_identify_timeout_ms: DEFAULT_LAUNCH_IDENTIFY_TIMEOUT_MS,
            shell_ready_timeout_ms: DEFAULT_SHELL_READY_TIMEOUT_MS,
        },
    )
    .with_caller(identity::parent_of_this_process());
    let direct = OsDirect::in_state_root();
    let host = SessionHost {
        panes: &core,
        direct: &direct,
        ready_ms,
        grace_ms,
    };
    match run(op, &host, &envelope) {
        Ok((result, mut fields)) => {
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
        assert_eq!(main(&args(&["alive", "--json"])), EXIT_MISMATCH);
        assert_eq!(
            main(&args(&["alive", "--protocol", "2", "--json"])),
            EXIT_MISMATCH
        );
    }

    #[test]
    fn usage_errors_exit_two() {
        assert_eq!(main(&args(&["--protocol", "1", "--json"])), EXIT_USAGE);
        assert_eq!(
            main(&args(&["nope", "--protocol", "1", "--json"])),
            EXIT_USAGE
        );
        assert_eq!(main(&args(&["alive", "--protocol", "1"])), EXIT_USAGE);
    }
}
