//! `fgos internal start-context compose --protocol 1 [--root <dir>]`: the start text of an agent, composed by
//! `fgos-agent-start-context` (docs/platform/agent-start-context/spec.md).
//!
//! The request is stdin, one JSON `StartRequest` (`packages/agent-start-context/contracts/start-request.v1.json`).
//! The project root is `--root`, else the current directory. The answer is one framed line on stdout, behind
//! [`PREFIX`]: `{ v, protocol, op, result }` with a `StartContext`, `{ v, protocol, op, refusal: { code, message,
//! missing } }` for a named refusal (exit 1), or `{ v, protocol, op, error: { code, message } }` for a failure of the
//! machinery.
//!
//! The adapters: the rule set is the project's `.fgos/instructions/effective/rules.json`, read through the agent
//! context engine's reader; the fact registry is the engine's when-keys with the host's live values (the same
//! `LiveValues` the engine's door uses); each call writes one `fgos.start.context` record through Observe's record
//! door. No contributor is registered yet and no delivery has a budget yet.

use std::collections::BTreeMap;
use std::ffi::OsString;
use std::io::{Read, Write};
use std::path::PathBuf;

use fgos_agent_start_context::{
    compose, AceFacts, AceRules, PersonaLookup, Personas, Ports, RecordSink, Refusal, StartContext,
    StartRecord, StartRequest,
};
use fgos_host_runtime::cli_args::{parse_args, FlagScalar, FlagValue};
use fgos_observe::record::store::{new_record_id, RecordDoor};
use fgos_observe::record::types::{AttrValue, Basis, Origin, Record, SubjectRef, RECORD_VERSION};
use serde_json::{json, Value};

use super::context_engine::values::LiveValues;
use super::unit_run_host::machine::fgos_dir;

pub const PROTOCOL: u64 = 1;
/// The prefix of the answer line; any other stdout line is stray output.
pub const PREFIX: &str = "\u{1e}FGOS-START-CONTEXT ";
pub const EXIT_REFUSED: i32 = 1;
pub const EXIT_USAGE: i32 = 2;
pub const EXIT_VERSION_MISMATCH: i32 = 3;
pub const EXIT_INVALID_REQUEST: i32 = 65;
pub const EXIT_FAILED: i32 = 70;

const RECORD_KIND: &str = "fgos.start.context";
const RULES: &str = "instructions/effective/rules.json";

pub fn main(args: &[String]) -> i32 {
    let mut input = String::new();
    let (code, line) = match std::io::stdin().read_to_string(&mut input) {
        Ok(_) => run(args, &input),
        Err(e) => error(
            "compose",
            "invalid-request",
            &format!("stdin cannot be read: {e}"),
            EXIT_INVALID_REQUEST,
        ),
    };
    let mut out = std::io::stdout().lock();
    let _ = out.write_all(format!("{PREFIX}{line}\n").as_bytes());
    let _ = out.flush();
    code
}

fn error(op: &str, code: &str, message: &str, exit: i32) -> (i32, Value) {
    (
        exit,
        json!({ "v": 1, "protocol": PROTOCOL, "op": op, "error": { "code": code, "message": message } }),
    )
}

fn refused(refusal: &Refusal) -> (i32, Value) {
    (
        EXIT_REFUSED,
        json!({ "v": 1, "protocol": PROTOCOL, "op": "compose", "refusal": {
            "code": refusal.code.as_str(), "message": refusal.message, "missing": refusal.missing } }),
    )
}

/// The route without a process around it: the exit code and the answer line, which the caller frames.
pub fn run(args: &[String], input: &str) -> (i32, Value) {
    let parsed = match parse_args(&args.iter().map(OsString::from).collect::<Vec<_>>()) {
        Ok(parsed) => parsed,
        Err(err) => return error("", "usage", &err.to_string(), EXIT_USAGE),
    };
    let op = parsed.positional.first().map(String::as_str).unwrap_or("");
    if op != "compose" || parsed.positional.len() > 1 {
        return error(op, "usage", "the one op is compose", EXIT_USAGE);
    }
    if let Some((name, _)) = parsed
        .flags
        .iter()
        .find(|(name, _)| name != "protocol" && name != "root")
    {
        return error(
            op,
            "usage",
            &format!("unknown argument --{name}"),
            EXIT_USAGE,
        );
    }
    match parsed.flag("protocol") {
        Some(FlagValue::One(FlagScalar::Str(v))) if v == &PROTOCOL.to_string() => {}
        _ => {
            return error(
                op,
                "protocol-mismatch",
                &format!("this route speaks --protocol {PROTOCOL}"),
                EXIT_VERSION_MISMATCH,
            )
        }
    }
    let root = match parsed.flag("root") {
        None => std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")),
        Some(FlagValue::One(FlagScalar::Str(dir))) => PathBuf::from(dir),
        Some(_) => return error(op, "usage", "--root needs a directory", EXIT_USAGE),
    };
    let request_json: Value = match serde_json::from_str(input.trim()) {
        Ok(value) => value,
        Err(e) => {
            return error(
                op,
                "invalid-request",
                &format!("the request is not JSON: {e}"),
                EXIT_INVALID_REQUEST,
            )
        }
    };
    let request = match StartRequest::from_json(&request_json) {
        Ok(request) => request,
        Err(refusal) => return refused(&refusal),
    };
    let bytes = std::fs::read(fgos_dir(&root).join(RULES)).unwrap_or_default();
    let rules = match AceRules::read(&bytes) {
        Ok(rules) => rules,
        Err(refusal) => return refused(&refusal),
    };
    let live = match LiveValues::read(&root) {
        Ok(live) => live,
        Err(e) => return error(op, "live-values-unreadable", &e, EXIT_FAILED),
    };
    let facts = AceFacts::new(&live);
    let sink = ObserveSink {
        root: root.clone(),
        start: request.start_kind().map(|k| k.as_str()).unwrap_or(""),
    };
    let install = crate::active_payload_root().unwrap_or_else(|_| root.clone());
    let personas = HostPersonas {
        project: root.clone(),
        install,
    };
    let ports = Ports {
        rules: &rules,
        facts: &facts,
        record: &sink,
        personas: Some(&personas),
        contributors: Vec::new(),
        budget_bytes: None,
    };
    match compose(&request, &ports) {
        Ok(context) => (
            0,
            json!({ "v": 1, "protocol": PROTOCOL, "op": "compose", "result": context_json(&context) }),
        ),
        Err(refusal) => refused(&refusal),
    }
}

/// The answer in the shape of start-context.v1.json.
fn context_json(context: &StartContext) -> Value {
    json!({
        "blocks": context.blocks.iter().map(|b| json!({ "id": b.id, "source": b.source, "text": b.text, "bytes": b.bytes })).collect::<Vec<_>>(),
        "matched": context.matched,
        "ruleSetDigest": context.rule_set_digest,
        "record": context.record,
        "dropped": context.dropped.iter().map(|d| json!({ "id": d.id, "reason": d.reason.as_str() })).collect::<Vec<_>>(),
    })
}

/// Writes the per-start record through Observe's record door. A lost record never changes the answer.
struct ObserveSink {
    root: PathBuf,
    start: &'static str,
}

impl RecordSink for ObserveSink {
    fn append(&self, record: &StartRecord) -> String {
        let id = new_record_id();
        let mut attrs = BTreeMap::new();
        let mut put = |key: &str, value: String| {
            attrs.insert(format!("fgos.start.context.{key}"), AttrValue::Str(value));
        };
        put("delivery", record.delivery.clone());
        if !self.start.is_empty() {
            put("start", self.start.to_owned());
        }
        put(
            "facts",
            serde_json::to_string(&record.facts).unwrap_or_default(),
        );
        put("ruleset", record.rule_set_digest.clone());
        put("matched", record.matched.join(","));
        put(
            "blocks",
            record
                .blocks
                .iter()
                .map(|(id, bytes)| format!("{id}={bytes}"))
                .collect::<Vec<_>>()
                .join(","),
        );
        put(
            "dropped",
            record
                .dropped
                .iter()
                .map(|d| format!("{}={}", d.id, d.reason.as_str()))
                .collect::<Vec<_>>()
                .join(","),
        );
        let total: usize = record.blocks.iter().map(|(_, bytes)| bytes).sum();
        let measures = [
            ("fgos.start.context.bytes", total as u64),
            ("fgos.start.context.block_count", record.blocks.len() as u64),
            (
                "fgos.start.context.dropped_count",
                record.dropped.len() as u64,
            ),
        ];
        let observed = Record {
            v: RECORD_VERSION,
            id: id.clone(),
            kind: RECORD_KIND.to_owned(),
            ts: fgos_observe::time::now_iso(),
            end_ts: None,
            subject: SubjectRef {
                kind: "session".to_owned(),
                id: fgos_identity::resolve::resolve_current().id.to_string(),
            },
            refs: Vec::new(),
            attrs,
            measures: measures
                .into_iter()
                .map(|(k, v)| (k.to_owned(), v.into()))
                .collect(),
            basis: Basis::Observed,
            origin: Origin {
                source: "agent-start-context".to_owned(),
                component: Some("host".to_owned()),
                host: Some(fgos_process::facts::host()),
                ..Origin::default()
            },
            redaction: None,
            detail: None,
        };
        let _ = RecordDoor::new(
            self.root.clone(),
            super::observe_declarations::embedded_declarations(),
            None,
        )
        .write(observed);
        id
    }
}

/// The persona definitions of the project and the payload, through the host's one lookup.
struct HostPersonas {
    project: PathBuf,
    install: PathBuf,
}

impl Personas for HostPersonas {
    fn lookup(&self, persona: &str) -> PersonaLookup {
        super::unit_run_host::persona::persona_lookup(persona, None, &self.project, &self.install)
    }
}
