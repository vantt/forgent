//! `fgos internal seat-binding <bind|ladder> --protocol 1`: the Node payload's
//! door to the seat binding decision it must not copy.
//!
//! The request is one JSON document on stdin, the answer one JSON line on
//! stdout: `{v, protocol, hostVersion, op, result: "ok"|"refused"|"error", ...}`.
//! `bind` answers `ok` or `refused` with the whole [`crate::BindOutput`] under
//! `output` (a refusal is a decision, not a fault); `ladder` answers `ok` with
//! the tier ladder under `ladder`. Anything that is not a decision is `error`
//! with a `code` and a `message`. No state is read or written.

use std::io::Read;

use serde_json::{json, Value};

use crate::{bind, ladder, BindInput, PROTOCOL};

pub const EXIT_USAGE: i32 = 2;
pub const EXIT_VERSION_MISMATCH: i32 = 3;
/// The request on stdin is not valid JSON or does not match the contract.
pub const EXIT_INVALID_REQUEST: i32 = 65;

/// Version of the host component that answers; recorded by callers next to
/// the decision it produced.
pub const HOST_VERSION: &str = env!("CARGO_PKG_VERSION");

/// Run the route with the args after `seat-binding`, reading the request from
/// stdin; returns the exit code.
pub fn main(args: &[String]) -> i32 {
    let mut stdin = String::new();
    // A missing or unreadable stdin is an empty request, refused below.
    let _ = std::io::stdin().read_to_string(&mut stdin);
    let (code, line) = run(args, &stdin);
    println!("{line}");
    code
}

/// The route without I/O: the exit code and the one answer line.
pub fn run(args: &[String], stdin: &str) -> (i32, Value) {
    let Some(op) = args.first().map(String::as_str) else {
        return error("", "usage", "needs an operation: bind or ladder", EXIT_USAGE);
    };
    if op != "bind" && op != "ladder" {
        return error(op, "usage", &format!("unknown operation {op}; expected bind or ladder"), EXIT_USAGE);
    }
    let mut protocol: Option<&str> = None;
    let mut iter = args[1..].iter();
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--protocol" => match iter.next() {
                Some(value) => protocol = Some(value),
                None => return error(op, "usage", "--protocol needs a value", EXIT_USAGE),
            },
            other => return error(op, "usage", &format!("unknown argument {other}"), EXIT_USAGE),
        }
    }
    if protocol != Some("1") {
        return error(op, "host-version-mismatch", "needs --protocol 1", EXIT_VERSION_MISMATCH);
    }
    let request: Value = match serde_json::from_str(stdin) {
        Ok(value) => value,
        Err(err) => return error(op, "invalid-request", &format!("stdin is not JSON: {err}"), EXIT_INVALID_REQUEST),
    };
    if request.get("v").and_then(Value::as_u64) != Some(1) {
        return error(op, "host-version-mismatch", "the request must carry v: 1", EXIT_VERSION_MISMATCH);
    }
    match op {
        "ladder" => (0, answer(op, "ok", json!({ "ladder": ladder() }))),
        _ => {
            let Some(input) = request.get("input") else {
                return error(op, "invalid-request", "bind needs an input", EXIT_INVALID_REQUEST);
            };
            let input: BindInput = match serde_json::from_value(input.clone()) {
                Ok(input) => input,
                Err(err) => return error(op, "invalid-request", &format!("input does not match the contract: {err}"), EXIT_INVALID_REQUEST),
            };
            let output = bind(&input);
            let result = if output.ok { "ok" } else { "refused" };
            match serde_json::to_value(&output) {
                Ok(output) => (0, answer(op, result, json!({ "output": output }))),
                Err(err) => error(op, "invalid-request", &format!("the answer cannot be encoded: {err}"), EXIT_INVALID_REQUEST),
            }
        }
    }
}

fn answer(op: &str, result: &str, body: Value) -> Value {
    let mut line = json!({
        "v": 1,
        "protocol": PROTOCOL,
        "hostVersion": HOST_VERSION,
        "op": op,
        "result": result,
    });
    if let (Some(line), Value::Object(body)) = (line.as_object_mut(), body) {
        line.extend(body);
    }
    line
}

fn error(op: &str, code: &str, message: &str, exit: i32) -> (i32, Value) {
    (exit, answer(op, "error", json!({ "code": code, "message": message })))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn args(list: &[&str]) -> Vec<String> {
        list.iter().map(|a| a.to_string()).collect()
    }

    #[test]
    fn ladder_answers_with_the_tier_vocabulary_and_the_host_version() {
        let (code, line) = run(&args(&["ladder", "--protocol", "1"]), r#"{"v":1}"#);
        assert_eq!(code, 0);
        assert_eq!(line["result"], "ok");
        assert_eq!(line["hostVersion"], HOST_VERSION);
        assert_eq!(line["ladder"]["vocabulary"].as_array().unwrap().len(), 6);
    }

    #[test]
    fn a_missing_or_wrong_protocol_is_a_version_mismatch() {
        for list in [&["ladder"][..], &["ladder", "--protocol", "2"][..]] {
            let (code, line) = run(&args(list), r#"{"v":1}"#);
            assert_eq!(code, EXIT_VERSION_MISMATCH);
            assert_eq!(line["result"], "error");
            assert_eq!(line["code"], "host-version-mismatch");
        }
        let (code, line) = run(&args(&["ladder", "--protocol", "1"]), r#"{"v":2}"#);
        assert_eq!((code, line["code"].as_str()), (EXIT_VERSION_MISMATCH, Some("host-version-mismatch")));
    }

    #[test]
    fn usage_faults_exit_two() {
        for list in [&[][..], &["nope", "--protocol", "1"][..], &["bind", "--protocol"][..], &["bind", "--x", "1"][..]] {
            let (code, line) = run(&args(list), "{}");
            assert_eq!(code, EXIT_USAGE, "{list:?}");
            assert_eq!(line["result"], "error");
        }
    }

    #[test]
    fn a_request_that_is_not_the_contract_is_invalid_not_a_decision() {
        for stdin in ["", "not json", r#"{"v":1}"#, r#"{"v":1,"input":{"protocol":1}}"#] {
            let (code, line) = run(&args(&["bind", "--protocol", "1"]), stdin);
            assert_eq!(code, EXIT_INVALID_REQUEST, "{stdin}");
            assert_eq!(line["code"], "invalid-request");
        }
    }
}
