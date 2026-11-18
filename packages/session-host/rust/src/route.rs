//! `fgos internal session-host <op> --protocol 1 --json`: one operation of the port per process, one
//! JSON request on stdin, one JSON line out. A port answer, a refusal included, exits 0: the route
//! decides nothing, it only carries the host's answer. `last-message` is the rotation executor's reader of a head's
//! transcript (`rotation::last_message`): it needs no terminal, so it is answered before the driver is built.

use crate::host::SessionHost;
use crate::types::*;
use fgos_terminal_control::port::LaunchSpec;
use fgos_terminal_control::route::{
    emit, error, line, read_stdin, usage, CoreParts, EXIT_MISMATCH, EXIT_OK, EXIT_USAGE,
};
use serde::de::DeserializeOwned;
use serde_json::{json, Value};
use std::time::Instant;

pub const PROTOCOL: u64 = 1;
pub const OPS: [&str; 5] = ["open", "launch", "alive", "front", "retire"];
/// The ops answered from files alone (contract: `packages/session-host/contracts/rotation-files.v1.json`).
pub const FILE_OPS: [&str; 1] = ["last-message"];

/// `last-message`: `request.projectsDir`, the head's session folder, to `found` (`transcript`, `message` or null,
/// `turnEnded`) or `not-found` (`detail`).
fn last_message(envelope: &Value) -> Result<(String, Value), String> {
    let dir = envelope
        .pointer("/request/projectsDir")
        .and_then(Value::as_str)
        .filter(|d| !d.is_empty())
        .ok_or("request.projectsDir must be a non-empty string")?;
    Ok(
        match crate::rotation::last_message::last_message(std::path::Path::new(dir)) {
            Ok(found) => (
                "found".into(),
                json!({ "transcript": found.transcript.display().to_string(), "message": found.text, "turnEnded": found.turn_ended }),
            ),
            Err(e) => ("not-found".into(), json!({ "detail": e.to_string() })),
        },
    )
}

fn refusal_fields(refusal: &Refusal) -> (String, Value) {
    let mut fields = json!({ "code": refusal.code });
    if let Some(detail) = &refusal.detail {
        fields["detail"] = json!(detail);
    }
    if let Some(capability) = &refusal.capability {
        fields["capability"] = json!(capability);
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

fn run(op: &str, host: &SessionHost, envelope: &Value) -> Result<(String, Value), String> {
    let request = envelope
        .get("request")
        .cloned()
        .unwrap_or_else(|| json!({}));
    Ok(match op {
        "open" => {
            let open: OpenRequest =
                serde_json::from_value(request).map_err(|e| format!("request: {e}"))?;
            match host.open(&open) {
                OpenAnswer::Opened { placement, slot } => {
                    let mut fields = json!({ "placement": placement });
                    if let Some(slot) = slot {
                        fields["slot"] = json!(slot);
                    }
                    ("placed".into(), fields)
                }
                OpenAnswer::Refused(refusal) => refusal_fields(&refusal),
            }
        }
        "launch" => {
            let placement: Placement = whole(&request, "placement")?;
            let spec: LaunchSpec = whole(&request, "spec")?;
            match host.launch(&placement, &spec) {
                LaunchAnswer::Launched(identity) => {
                    ("launched".into(), json!({ "identity": identity }))
                }
                LaunchAnswer::NotStarted { reason } => {
                    ("not-started".into(), json!({ "reason": reason }))
                }
                LaunchAnswer::Refused(refusal) => refusal_fields(&refusal),
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
    if !OPS.contains(&op) && !FILE_OPS.contains(&op) {
        return usage(&format!(
            "unknown op {op}; one of {}, {}",
            OPS.join(", "),
            FILE_OPS.join(", ")
        ));
    }
    let envelope = match read_stdin() {
        Ok(v) => v,
        Err(message) => return usage(&message),
    };
    if envelope.get("v").and_then(Value::as_u64) != Some(1) {
        return usage("stdin.v must be 1");
    }
    if FILE_OPS.contains(&op) {
        return match last_message(&envelope) {
            Ok((result, mut fields)) => {
                fields["op"] = json!(op);
                emit(&line(&result, fields));
                EXIT_OK
            }
            Err(message) => usage(&message),
        };
    }
    match envelope.get("driver").and_then(Value::as_str) {
        None | Some("herdr") => {}
        Some(other) => return usage(&format!("unknown driver {other}")),
    }
    let parts = match CoreParts::from_envelope(&envelope, started) {
        Ok(p) => p,
        Err(refusal) => return error(refusal.code, &refusal.message, EXIT_USAGE),
    };
    let core = parts.core();
    let host = SessionHost { panes: &core };
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

    #[test]
    fn last_message_answers_from_the_session_folder_and_names_a_missing_one() {
        let dir = std::env::temp_dir().join(format!("sh-route-last-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        let slug = dir.join("-p");
        std::fs::create_dir_all(&slug).unwrap();
        std::fs::write(
            slug.join("e6540401-251d-4181-8930-661e69a42e3b.jsonl"),
            "{\"type\":\"assistant\",\"message\":{\"id\":\"m\",\"stop_reason\":\"end_turn\",\"content\":[{\"type\":\"text\",\"text\":\"bye\"}]}}\n",
        )
        .unwrap();
        let (result, fields) =
            last_message(&json!({ "request": { "projectsDir": dir.display().to_string() } }))
                .unwrap();
        assert_eq!(
            (result.as_str(), &fields["message"], &fields["turnEnded"]),
            ("found", &json!("bye"), &json!(true))
        );
        let (result, fields) = last_message(
            &json!({ "request": { "projectsDir": dir.join("gone").display().to_string() } }),
        )
        .unwrap();
        assert_eq!(result, "not-found");
        assert!(fields["detail"].as_str().unwrap().contains("gone"));
        assert!(last_message(&json!({ "request": {} })).is_err());
    }
}
