//! `fgos internal context-engine <op> --protocol 1`: the rule units of a project, checked and compiled by
//! `fgos-agent-context-engine`, one operation per process.
//!
//! The request is the first line of stdin, one JSON object `{ root, asOf? }`: the project root, and the day the
//! rules in force are judged at (`YYYY-MM-DD`, today in UTC when absent). The answer is one framed line on stdout,
//! behind [`PREFIX`]: `{ v, protocol, op, result }`, or `{ v, protocol, op, error: { code, message } }` for a
//! failure of the machinery.
//!
//! Ops:
//!
//! * `check`: reads the three rule roots, indexes them in pkm and checks them. Result `{ ok, refusals, rules }`;
//!   exit 1 when `ok` is false.
//! * `compile`: `check`, and when it is clean, writes the compiled set to `.fgos/instructions/effective/rules.json`.
//!   Result `{ ok, refusals, rules, digest?, path? }`; exit 1, and nothing written, when `ok` is false.
//!
//! The pkm index at `.fgos/runtime/context-engine/rules.db` is a view of the unit files and is rebuilt when stale.

mod owners;
mod values;

use std::ffi::OsString;
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};

use fgos_agent_context_engine::refusal::Refusal;
use fgos_agent_context_engine::store::{check_repository, compile_repository, StorePaths};
use fgos_host_runtime::cli_args::{parse_args, FlagScalar, FlagValue};
use serde_json::{json, Value};

use owners::ModelOwners;
use values::LiveValues;

use super::unit_run_host::machine::fgos_dir;

/// The protocol this route speaks.
pub const PROTOCOL: u64 = 1;
/// The prefix of the answer line; any other stdout line is stray output.
pub const PREFIX: &str = "\u{1e}FGOS-CONTEXT-ENGINE ";
pub const EXIT_REFUSED: i32 = 1;
pub const EXIT_USAGE: i32 = 2;
pub const EXIT_VERSION_MISMATCH: i32 = 3;
/// The request on stdin is not valid JSON or does not match the contract.
pub const EXIT_INVALID_REQUEST: i32 = 65;
/// The machinery failed: the model, the config, the index or the output could not be read or written.
pub const EXIT_FAILED: i32 = 70;

/// The operations this route serves.
pub const OPS: [&str; 2] = ["compile", "check"];

const PROFILE: &str = "packages/agent-context-engine/pkm/profile.yaml";
const COMPILED: &str = "instructions/effective";
const COMPILED_FILE: &str = "rules.json";
const INDEX: &str = "runtime/context-engine/rules.db";

/// Run the route with the args after `context-engine`; returns the exit code.
pub fn main(args: &[String]) -> i32 {
    let (code, line) = run(args, Box::new(BufReader::new(std::io::stdin())));
    let mut out = std::io::stdout().lock();
    let _ = out.write_all(frame(&line).as_bytes());
    let _ = out.flush();
    code
}

/// The framed answer line.
pub fn frame(line: &Value) -> String {
    format!("{PREFIX}{line}\n")
}

/// The route without a process around it. Returns the exit code and the answer line, which the caller frames.
pub fn run(args: &[String], mut input: Box<dyn BufRead>) -> (i32, Value) {
    let parsed = match parse_args(&args.iter().map(OsString::from).collect::<Vec<_>>()) {
        Ok(parsed) => parsed,
        Err(err) => return error("", "usage", &err.to_string(), EXIT_USAGE),
    };
    let op = parsed.positional.first().map(String::as_str).unwrap_or("");
    if let Some(extra) = parsed.positional.get(1) {
        return error(
            op,
            "usage",
            &format!("unknown argument {extra}"),
            EXIT_USAGE,
        );
    }
    if let Some((name, _)) = parsed.flags.iter().find(|(name, _)| name != "protocol") {
        return error(
            op,
            "usage",
            &format!("unknown argument --{name}"),
            EXIT_USAGE,
        );
    }
    let protocol = match parsed.flag("protocol") {
        None => None,
        Some(FlagValue::One(FlagScalar::Str(value))) => Some(value.as_str()),
        Some(_) => return error(op, "usage", "--protocol needs a value", EXIT_USAGE),
    };
    if protocol != Some(PROTOCOL.to_string().as_str()) {
        return error(
            op,
            "host-version-mismatch",
            &format!("needs --protocol {PROTOCOL}"),
            EXIT_VERSION_MISMATCH,
        );
    }
    if !OPS.contains(&op) {
        return error(
            op,
            "usage",
            &format!("unknown op \"{op}\"; one of {}", OPS.join(", ")),
            EXIT_USAGE,
        );
    }
    let mut first = String::new();
    // A missing or unreadable stdin is an empty request, refused below.
    let _ = input.read_line(&mut first);
    let request: Value = match serde_json::from_str(first.trim()) {
        Ok(Value::Object(map)) => Value::Object(map),
        Ok(_) => return invalid(op, "the request is not a JSON object"),
        Err(err) => return invalid(op, &format!("the request is not JSON: {err}")),
    };
    let (root, as_of) = match read_request(&request) {
        Ok(read) => read,
        Err(message) => return invalid(op, &message),
    };
    match judge(op == "compile", &root, &as_of) {
        Ok(result) => {
            let ok = result["ok"] == json!(true);
            (
                if ok { 0 } else { EXIT_REFUSED },
                answer(op, json!({ "result": result })),
            )
        }
        Err(message) => error(op, "failed", &message, EXIT_FAILED),
    }
}

fn answer(op: &str, body: Value) -> Value {
    let mut line = json!({ "v": PROTOCOL, "protocol": PROTOCOL, "op": op });
    if let (Some(line), Value::Object(body)) = (line.as_object_mut(), body) {
        line.extend(body);
    }
    line
}

fn error(op: &str, code: &str, message: &str, exit: i32) -> (i32, Value) {
    (
        exit,
        answer(op, json!({ "error": { "code": code, "message": message } })),
    )
}

fn invalid(op: &str, message: &str) -> (i32, Value) {
    error(op, "invalid-request", message, EXIT_INVALID_REQUEST)
}

fn read_request(request: &Value) -> Result<(PathBuf, String), String> {
    let root = request
        .get("root")
        .and_then(Value::as_str)
        .filter(|root| !root.is_empty())
        .ok_or("root must be a non-empty string")?;
    let as_of = match request.get("asOf") {
        None | Some(Value::Null) => today(),
        Some(Value::String(day)) if fgos_agent_context_engine::rule::is_date(day) => day.clone(),
        Some(_) => return Err("asOf must be a date, YYYY-MM-DD".to_string()),
    };
    Ok((PathBuf::from(root), as_of))
}

/// Today's date in UTC, `YYYY-MM-DD`.
fn today() -> String {
    let seconds = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|elapsed| elapsed.as_secs())
        .unwrap_or(0);
    civil_day(i64::try_from(seconds / 86_400).unwrap_or(0))
}

/// The proleptic Gregorian date of a day count since 1970-01-01.
fn civil_day(days: i64) -> String {
    let shifted = days + 719_468;
    let era = shifted.div_euclid(146_097);
    let of_era = shifted.rem_euclid(146_097);
    let year_of_era = (of_era - of_era / 1_460 + of_era / 36_524 - of_era / 146_096) / 365;
    let day_of_year = of_era - (365 * year_of_era + year_of_era / 4 - year_of_era / 100);
    let month_index = (5 * day_of_year + 2) / 153;
    let day = day_of_year - (153 * month_index + 2) / 5 + 1;
    let month = if month_index < 10 {
        month_index + 3
    } else {
        month_index - 9
    };
    let year = year_of_era + era * 400 + i64::from(month <= 2);
    format!("{year:04}-{month:02}-{day:02}")
}

fn refusal_json(refusal: &Refusal) -> Value {
    json!({
        "code": refusal.code.as_str(),
        "category": refusal.code.category().as_str(),
        "phase": refusal.code.phase().as_str(),
        "ids": refusal.ids,
        "source": refusal.source,
        "message": refusal.message,
    })
}

/// The pack file of the rule type: the project's own when it carries one, the active release's payload otherwise.
fn profile_of(root: &Path) -> Result<PathBuf, String> {
    let own = root.join(PROFILE);
    if own.is_file() {
        return Ok(own);
    }
    let payload = crate::active_payload_root().map_err(|cause| {
        format!(
            "the project has no {PROFILE} and the active release's payload cannot be resolved: {cause}"
        )
    })?;
    let shipped = payload.join(PROFILE);
    if shipped.is_file() {
        Ok(shipped)
    } else {
        Err(format!(
            "neither the project nor the active release carries {PROFILE}"
        ))
    }
}

/// Checks the project's rule units and, when `write` is set and the check is clean, writes the compiled set.
fn judge(write: bool, root: &Path, as_of: &str) -> Result<Value, String> {
    let root = std::fs::canonicalize(root).map_err(|error| {
        format!(
            "{}: the project root cannot be read: {error}",
            root.display()
        )
    })?;
    let owners = ModelOwners::read(&root)?;
    let live = LiveValues::read(&root)?;
    let fgos = fgos_dir(&root);
    let index = fgos.join(INDEX);
    if let Some(dir) = index.parent() {
        std::fs::create_dir_all(dir)
            .map_err(|error| format!("{}: cannot be created: {error}", dir.display()))?;
    }
    let paths = StorePaths {
        repo_root: root.clone(),
        graph_db: index,
        profile: profile_of(&root)?,
    };
    if !write {
        return Ok(match check_repository(&paths, as_of, &owners, &live) {
            Ok((corpus, _, refusals)) => report(&refusals, corpus.len(), None),
            Err(refusals) => report(&refusals, 0, None),
        });
    }
    match compile_repository(&paths, as_of, &owners, &live) {
        Err(refusals) => Ok(report(&refusals, 0, None)),
        Ok(set) => {
            let dir = fgos.join(COMPILED);
            std::fs::create_dir_all(&dir)
                .map_err(|error| format!("{}: cannot be created: {error}", dir.display()))?;
            fgos_durable_file::replace_durably_with_mode(
                &dir,
                COMPILED_FILE,
                &set.to_bytes(),
                0o644,
            )
            .map_err(|error| format!("{}: cannot be written: {error}", dir.display()))?;
            Ok(report(
                &[],
                set.rules.len(),
                Some((&set.digest, &dir.join(COMPILED_FILE))),
            ))
        }
    }
}

fn report(refusals: &[Refusal], rules: usize, written: Option<(&str, &Path)>) -> Value {
    let mut result = json!({
        "ok": refusals.is_empty(),
        "refusals": refusals.iter().map(refusal_json).collect::<Vec<_>>(),
        "rules": rules,
    });
    if let Some((digest, path)) = written {
        result["digest"] = json!(digest);
        result["path"] = json!(path.to_string_lossy());
    }
    result
}

#[cfg(test)]
mod tests {
    use super::civil_day;

    #[test]
    fn a_day_count_becomes_its_calendar_date() {
        assert_eq!(civil_day(0), "1970-01-01");
        assert_eq!(civil_day(11_016), "2000-02-29");
        assert_eq!(civil_day(20_418), "2025-11-26");
    }
}
