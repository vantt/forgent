//! Read-only Dispatch runtime inspection: what the run records on disk say about one run, one assignment or one
//! workspace, with how complete the evidence is. It sits below recovery, adapters, process control and Git
//! mutation: it reads files and the attempt lock, and writes nothing.
//!
//! Run results are read through the run-result reader and the assignment layout through its owner; the
//! admission ledger is read here directly because importing the writer would pull its process control in.

use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

use serde_json::{json, Map, Value};

use crate::assignment::layout::{assignment_dir, list_assignment_runs};
use crate::run_result::reader::interpret_run_result;
use crate::transport::visibility_session::{attempt_lock_state, LockState};

pub const INSPECTION_STATUSES: [&str; 5] = [
    "resolved",
    "partial",
    "ambiguous",
    "conflicting",
    "not-found",
];
pub const VALID_PHASES: [&str; 6] = [
    "admitted",
    "launched",
    "bound",
    "delivered",
    "settled",
    "unknown",
];
pub const VALID_RESOURCE_STATES: [&str; 6] = [
    "live-proven",
    "dead-proven",
    "absent-proven",
    "ambiguous",
    "unobserved",
    "unsupported",
];
pub const VALID_DELIVERIES: [&str; 6] = [
    "not-started",
    "running",
    "delivered",
    "unknown",
    "replayed",
    "recovered",
];
pub const VALID_COMPLETENESS: [&str; 6] = [
    "complete",
    "missing",
    "stale",
    "corrupt",
    "conflicting",
    "unsupported",
];
pub const ATTENTION_KINDS: [&str; 7] = [
    "failed",
    "blocked",
    "refused",
    "needs-human",
    "past-deadline",
    "controller-dead",
    "idle",
];

pub(crate) fn json_file(file: &Path) -> Option<Value> {
    serde_json::from_str(&fs::read_to_string(file).ok()?).ok()
}

fn json_evidence(file: &Path, fallback: Value) -> (bool, Value) {
    if !file.exists() {
        return (false, fallback);
    }
    match json_file(file) {
        Some(value) => (true, value),
        None => (false, fallback),
    }
}

fn dirs(dir: &Path) -> Vec<String> {
    let mut names: Vec<String> = fs::read_dir(dir)
        .map(|entries| {
            entries
                .flatten()
                .filter(|e| e.file_type().is_ok_and(|t| t.is_dir()))
                .map(|e| e.file_name().to_string_lossy().into_owned())
                .collect()
        })
        .unwrap_or_default();
    names.sort();
    names
}

fn uniq(values: impl IntoIterator<Item = Option<String>>) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    for value in values.into_iter().flatten() {
        if !out.contains(&value) {
            out.push(value);
        }
    }
    out
}

fn str_of<'a>(value: &'a Value, key: &str) -> Option<&'a str> {
    value.get(key).and_then(Value::as_str)
}

fn truthy(value: Option<&Value>) -> bool {
    match value {
        None | Some(Value::Null) | Some(Value::Bool(false)) => false,
        Some(Value::String(s)) => !s.is_empty(),
        Some(Value::Number(n)) => n.as_f64() != Some(0.0),
        Some(_) => true,
    }
}

/// One attempt directory and its run record.
#[derive(Debug, Clone, PartialEq)]
pub struct RunLocation {
    pub kind: &'static str,
    pub assignment_id: Option<String>,
    pub attempt: String,
    pub run_dir: PathBuf,
    pub run: Option<Value>,
    pub malformed: bool,
}

impl RunLocation {
    fn run_id(&self) -> Option<&str> {
        self.run.as_ref().and_then(|r| str_of(r, "runId"))
    }

    fn run_field(&self, key: &str) -> Option<&Value> {
        self.run.as_ref().and_then(|r| r.get(key))
    }

    fn project(&self) -> Value {
        json!({ "kind": self.kind, "assignmentId": self.assignment_id, "attempt": self.attempt, "path": self.run_dir.to_string_lossy() })
    }
}

/// The runs of a project read once per call site that holds one: an explicit cache, keyed by root, instead of an
/// ambient one.
#[derive(Debug, Default)]
pub struct RunsCache(HashMap<PathBuf, Vec<RunLocation>>);

impl RunsCache {
    pub fn clear(&mut self, root: Option<&Path>) {
        match root {
            Some(root) => {
                self.0.remove(&absolute(root));
            }
            None => self.0.clear(),
        }
    }
}

fn absolute(path: &Path) -> PathBuf {
    if path.is_absolute() {
        path.to_path_buf()
    } else {
        std::env::current_dir().unwrap_or_default().join(path)
    }
}

fn fgos_dir(root: &Path) -> PathBuf {
    PathBuf::from(fgos_execution::runner_config::fgos_dir_from_root(
        &root.to_string_lossy(),
    ))
}

/// Every attempt directory of the project with its run record; a record that is missing or not an object is
/// `malformed`.
pub fn all_runs(
    root: &Path,
    bypass_cache: bool,
    cache: Option<&mut RunsCache>,
) -> Vec<RunLocation> {
    let norm = absolute(root);
    if let (false, Some(cache)) = (bypass_cache, cache.as_deref()) {
        if let Some(hit) = cache.0.get(&norm) {
            return hit.clone();
        }
    }
    let out: Vec<RunLocation> = list_assignment_runs(&fgos_dir(root))
        .into_iter()
        .map(|entry| {
            let run = json_file(&entry.run_dir.join("run.json"));
            let malformed = !matches!(run, Some(Value::Object(_)));
            RunLocation {
                kind: "assignment-run",
                assignment_id: Some(entry.assignment_id),
                attempt: entry.attempt,
                run_dir: entry.run_dir,
                run,
                malformed,
            }
        })
        .collect();
    if let Some(cache) = cache {
        cache.0.insert(norm, out.clone());
    }
    out
}

/// The settled result of an attempt: whether a `result.json` exists, its interpreted record, and whether it is
/// corrupt.
#[derive(Debug, Clone, PartialEq)]
pub struct Terminal {
    pub present: bool,
    pub value: Option<Value>,
    pub corrupt: bool,
}

fn corrupt_value() -> Value {
    interpret_run_result(&Value::Null, None).record
}

pub fn result_of(l: &RunLocation) -> Terminal {
    let file = l.run_dir.join("result.json");
    if !file.exists() {
        return Terminal {
            present: false,
            value: None,
            corrupt: false,
        };
    }
    let is_file = fs::symlink_metadata(&file).is_ok_and(|m| m.is_file());
    if !is_file {
        return Terminal {
            present: true,
            value: Some(corrupt_value()),
            corrupt: true,
        };
    }
    let Ok(text) = fs::read_to_string(&file) else {
        return Terminal {
            present: true,
            value: Some(corrupt_value()),
            corrupt: true,
        };
    };
    let Ok(parsed) = serde_json::from_str::<Value>(&text) else {
        return Terminal {
            present: true,
            value: Some(corrupt_value()),
            corrupt: true,
        };
    };
    let read = interpret_run_result(&parsed, l.run_id());
    let flagged = |name: &str| truthy(read.record.get(name));
    let corrupt = read.corrupt
        || flagged("corrupt")
        || flagged("contractCorrupt")
        || flagged("resultCorrupt")
        || read
            .record
            .pointer("/classification/provenance")
            .and_then(Value::as_str)
            == Some("contract-corrupt");
    Terminal {
        present: true,
        value: Some(read.record),
        corrupt,
    }
}

/// The admission ledger of an assignment: its generation records in epoch order, minus those a later retry
/// aborted; `corrupt` when a record is unreadable.
struct Admissions {
    records: Vec<Value>,
    corrupt: bool,
}

fn admissions(dir: &Path) -> Admissions {
    let gen_dir = dir.join("admission").join("generations");
    let Ok(read) = fs::read_dir(&gen_dir) else {
        return Admissions {
            records: Vec::new(),
            corrupt: false,
        };
    };
    let mut names: Vec<String> = read
        .flatten()
        .map(|e| e.file_name().to_string_lossy().into_owned())
        .filter(|n| {
            n.len() == 15 && n.ends_with(".json") && n[..10].bytes().all(|b| b.is_ascii_digit())
        })
        .collect();
    names.sort();
    let (mut corrupt, mut records) = (false, Vec::new());
    for name in names {
        let record = json_file(&gen_dir.join(&name));
        let Some(mut record) = record.filter(|r| truthy(r.get("runId"))) else {
            corrupt = true;
            continue;
        };
        let aborted = str_of(&record, "retryId")
            .filter(|id| !id.is_empty())
            .and_then(|id| {
                json_file(
                    &dir.join("admission")
                        .join("markers")
                        .join(format!("{id}.aborted.json")),
                )
            })
            .is_some_and(|marker| truthy(Some(&marker)));
        if !aborted {
            record["epoch"] = json!(name[..10].parse::<u64>().unwrap_or(0));
            records.push(record);
        }
    }
    Admissions { records, corrupt }
}

struct AssignmentEvidence {
    facts: Admissions,
    /// Indices into the run list.
    records: Vec<usize>,
    malformed: Vec<usize>,
    unadmitted: Vec<usize>,
    current_ids: Vec<String>,
    current: Vec<usize>,
    absent: Vec<String>,
    duplicate_current: Vec<String>,
    incomplete: bool,
}

fn assignment_evidence(
    root: &Path,
    assignment_id: &str,
    all: &[RunLocation],
) -> AssignmentEvidence {
    let dir = fgos_dir(root).join("assignments").join(assignment_id);
    let facts = admissions(&dir);
    let records: Vec<usize> = (0..all.len())
        .filter(|i| all[*i].assignment_id.as_deref() == Some(assignment_id))
        .collect();
    let malformed: Vec<usize> = records
        .iter()
        .copied()
        .filter(|i| all[*i].malformed)
        .collect();
    let runs: Vec<usize> = records
        .iter()
        .copied()
        .filter(|i| !all[*i].malformed)
        .collect();
    let mut by_id: HashMap<String, Vec<usize>> = HashMap::new();
    for i in &runs {
        by_id
            .entry(all[*i].run_id().unwrap_or_default().to_string())
            .or_default()
            .push(*i);
    }
    let admitted: Vec<&str> = facts
        .records
        .iter()
        .filter_map(|r| str_of(r, "runId"))
        .collect();
    let unadmitted: Vec<usize> = runs
        .iter()
        .copied()
        .filter(|i| !admitted.contains(&all[*i].run_id().unwrap_or_default()))
        .collect();
    let latest = facts.records.last();
    let current_ids: Vec<String> = match latest {
        None => Vec::new(),
        Some(latest) => facts
            .records
            .iter()
            .enumerate()
            .filter(|(index, r)| {
                let is_latest = *index == facts.records.len() - 1;
                (r.get("attempt") == latest.get("attempt") && r.get("runId") != latest.get("runId"))
                    || is_latest
            })
            .filter_map(|(_, r)| str_of(r, "runId").map(String::from))
            .collect(),
    };
    let current: Vec<usize> = current_ids
        .iter()
        .flat_map(|id| by_id.get(id).cloned().unwrap_or_default())
        .collect();
    let absent: Vec<String> = current_ids
        .iter()
        .filter(|id| !by_id.contains_key(*id))
        .cloned()
        .collect();
    let duplicate_current: Vec<String> = current_ids
        .iter()
        .filter(|id| by_id.get(*id).is_some_and(|v| v.len() > 1))
        .cloned()
        .collect();
    let incomplete =
        facts.corrupt || !malformed.is_empty() || !unadmitted.is_empty() || !absent.is_empty();
    AssignmentEvidence {
        facts,
        records,
        malformed,
        unadmitted,
        current_ids,
        current,
        absent,
        duplicate_current,
        incomplete,
    }
}

/// Which coordination session (if any) lists `assignment_id` in its `assignmentRefs`, read straight off
/// `session.json`; it only names the owner.
pub fn find_coordination_session_owning_assignment(
    root: &Path,
    assignment_id: &str,
) -> Option<Value> {
    let base = fgos_dir(root).join("coordination").join("sessions");
    dirs(&base).into_iter().find_map(|id| {
        let session = json_file(&base.join(&id).join("session.json"))?;
        let owns = session
            .get("assignmentRefs")
            .and_then(Value::as_array)?
            .iter()
            .any(|v| v.as_str() == Some(assignment_id));
        owns.then(
            || json!({ "id": id, "observeCommand": format!("fgos coordination recover {id}") }),
        )
    })
}

struct Owner {
    complete: bool,
    kind: Option<&'static str>,
    id: Option<String>,
    reason: Option<&'static str>,
}

fn incomplete_owner(reason: &'static str) -> Owner {
    Owner {
        complete: false,
        kind: None,
        id: None,
        reason: Some(reason),
    }
}

fn owner(l: &RunLocation, root: &Path, all: &[RunLocation]) -> Owner {
    let Some(run_id) = l.run_id().filter(|_| !l.malformed) else {
        return incomplete_owner("corrupt");
    };
    let standalone = || Owner {
        complete: true,
        kind: Some("standalone-run"),
        id: Some(run_id.to_string()),
        reason: None,
    };
    if l.kind != "assignment-run" {
        return standalone();
    }
    let assignment_id = l.assignment_id.as_deref().unwrap_or_default();
    let dir = fgos_dir(root).join("assignments").join(assignment_id);
    let assignment = json_file(&dir.join("assignment.json"));
    let evidence = assignment_evidence(root, assignment_id, all);
    let admitted = evidence
        .facts
        .records
        .iter()
        .any(|r| str_of(r, "runId") == Some(run_id));
    let Some(assignment) = assignment.filter(|_| admitted) else {
        return incomplete_owner("missing");
    };
    if str_of(&assignment, "assignmentId") != Some(assignment_id)
        || l.run_field("assignmentId").and_then(Value::as_str) != Some(assignment_id)
    {
        return incomplete_owner("conflicting");
    }
    if evidence.incomplete {
        let reason = if evidence.facts.corrupt || !evidence.malformed.is_empty() {
            "corrupt"
        } else if !evidence.duplicate_current.is_empty() {
            "conflicting"
        } else {
            "missing"
        };
        return incomplete_owner(reason);
    }
    let coordination = ["coordinationId", "coordinationSessionId"]
        .iter()
        .find_map(|k| {
            l.run_field(k)
                .filter(|v| truthy(Some(v)))
                .and_then(Value::as_str)
        })
        .map(String::from);
    let Some(id) = coordination else {
        return standalone();
    };
    let session = json_file(
        &fgos_dir(root)
            .join("coordination")
            .join("sessions")
            .join(&id)
            .join("session.json"),
    );
    let Some(session) = session else {
        return incomplete_owner("missing");
    };
    let lists = session
        .get("assignmentRefs")
        .and_then(Value::as_array)
        .is_some_and(|a| a.iter().any(|v| v.as_str() == Some(assignment_id)));
    if lists {
        Owner {
            complete: true,
            kind: Some("coordination-session"),
            id: Some(id),
            reason: None,
        }
    } else {
        incomplete_owner("conflicting")
    }
}

fn authority(l: &RunLocation, root: &Path, all: &[RunLocation]) -> Option<Value> {
    let o = owner(l, root, all);
    if !o.complete {
        return None;
    }
    let (kind, id) = (o.kind?, o.id?);
    let verb = if kind == "coordination-session" {
        "coordination"
    } else {
        "dispatch"
    };
    Some(json!({ "kind": kind, "id": id, "observeCommand": format!("fgos {verb} recover {id}") }))
}

fn derive_phase(l: &RunLocation, terminal: &Terminal) -> String {
    if terminal.present && !terminal.corrupt {
        return "settled".into();
    }
    let commands = l.run_dir.join("controller").join("commands");
    let has_commands = fs::read_dir(&commands).is_ok_and(|mut d| d.next().is_some());
    let supervised = l.run_dir.join("supervisor-binding.json").exists();
    let status = l.run_field("status").and_then(Value::as_str);
    if has_commands
        || supervised
        || status == Some("bound")
        || truthy(l.run_field("controller"))
        || truthy(l.run_field("bound"))
    {
        return "bound".into();
    }
    let recorded_phase = l
        .run_field("phase")
        .and_then(Value::as_str)
        .filter(|p| VALID_PHASES.contains(p));
    let launched = truthy(l.run_field("launchedAt"));
    if status == Some("running") {
        if launched || l.run_field("delivery").and_then(Value::as_str) == Some("running") {
            return "launched".into();
        }
        return recorded_phase.unwrap_or("admitted").into();
    }
    match status {
        Some("launched") => return "launched".into(),
        _ if launched => return "launched".into(),
        Some("admitted") => return "admitted".into(),
        Some("delivered") => return "delivered".into(),
        _ => {}
    }
    recorded_phase.unwrap_or("unknown").into()
}

fn derive_delivery(l: &RunLocation) -> &'static str {
    let delivery = l.run_field("delivery").and_then(Value::as_str);
    if delivery == Some("not-sent") {
        return "not-started";
    }
    if let Some(d) = delivery {
        if let Some(known) = VALID_DELIVERIES.iter().find(|v| **v == d) {
            return known;
        }
    }
    match l.run_field("status").and_then(Value::as_str) {
        Some("not-started") | Some("todo") => "not-started",
        Some("running") | Some("doing") => "running",
        _ => "unknown",
    }
}

fn derive_resource_state(l: &RunLocation) -> String {
    let Some(vis) = json_file(&l.run_dir.join("visibility.json")) else {
        return "unobserved".into();
    };
    let status = vis.get("status").and_then(Value::as_str).unwrap_or("");
    if VALID_RESOURCE_STATES.contains(&status) {
        return status.into();
    }
    if status == "died" {
        return "dead-proven".into();
    }
    // The driver is alive exactly while the supervisor holds the attempt lock.
    if ["working", "briefed", "agent-ready"].contains(&status)
        && attempt_lock_state(&l.run_dir) == LockState::Held
    {
        return "live-proven".into();
    }
    "ambiguous".into()
}

fn one(l: &RunLocation, root: &Path, now: &dyn Fn() -> String, all: &[RunLocation]) -> Value {
    let terminal = result_of(l);
    let o = owner(l, root, all);
    let phase = derive_phase(l, &terminal);
    let resource_state = derive_resource_state(l);
    let delivery = derive_delivery(l);
    let workspace_completeness = if l.run_dir.join("workspace-evidence.json").exists() {
        "complete"
    } else {
        "unsupported"
    };
    let settled = terminal.present && !terminal.corrupt;
    let resource = match resource_state.as_str() {
        "unsupported" => "unsupported",
        "unobserved" => "missing",
        "ambiguous" => "stale",
        _ => "complete",
    };
    let result = if !terminal.present {
        "missing"
    } else if terminal.corrupt {
        "corrupt"
    } else {
        "complete"
    };
    let ownership = if o.complete {
        "complete"
    } else {
        o.reason.unwrap_or("missing")
    };
    let observations = json!([{
        "kind": "run-record", "source": "run-repository", "level": "correlated",
        "value": { "status": l.run_field("status").cloned().unwrap_or(Value::Null), "phase": phase },
    }]);
    let observation = json!({
        "contract": { "id": "run-observation", "version": 1 },
        "observedAt": now(),
        "subject": { "kind": "run", "runId": l.run_id() },
        "phase": phase, "resourceState": resource_state, "delivery": delivery,
        "inspectionStatus": if settled { "resolved" } else { "partial" },
        "evidenceCompleteness": {
            "identity": "complete", "lifecycle": "complete", "resource": resource, "result": result,
            "ownership": ownership, "workspace": workspace_completeness,
        },
        "recoveryAuthority": null,
        "observations": observations,
    });
    let run_id = l.run_id().unwrap_or_default();
    let coordination = l
        .run_field("coordinationId")
        .filter(|v| truthy(Some(v)))
        .cloned();
    let mut out = Map::new();
    out.insert(
        "inspectionStatus".into(),
        json!(if o.complete && settled {
            "resolved"
        } else {
            "partial"
        }),
    );
    out.insert(
        "subject".into(),
        json!({ "kind": "run", "id": run_id, "locations": [l.project()] }),
    );
    out.insert("observations".into(), observations);
    out.insert("runObservation".into(), observation);
    out.insert(
        "runResult".into(),
        terminal.value.clone().unwrap_or(Value::Null),
    );
    if let Some(hint) = authority(l, root, all) {
        out.insert("recoveryAuthority".into(), hint);
    }
    out.insert("reconciliation".into(), json!({
        "state": if o.complete { "not-needed" } else { "manual-required" },
        "reason": if o.complete { "No stale local guard was observed." } else { "Run ownership is incomplete or disagrees with repository admission facts." },
    }));
    out.insert(
        "links".into(),
        json!({
            "assignmentIds": l.assignment_id.iter().collect::<Vec<_>>(),
            "coordinationIds": coordination.into_iter().collect::<Vec<_>>(),
            "runIds": [run_id],
        }),
    );
    Value::Object(out)
}

/// The grouping key of a workspace (checkout root plus common git dir), read from the Git port's disk-only
/// topology: no process is started. A path outside any repository is its own key.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WorkspaceIdentity {
    pub path: PathBuf,
    pub root: PathBuf,
    pub common_dir: Option<PathBuf>,
    pub key: String,
}

pub fn workspace(input: &Path) -> WorkspaceIdentity {
    let path = absolute(input);
    let own = |path: PathBuf| WorkspaceIdentity {
        key: path.to_string_lossy().into_owned(),
        root: path.clone(),
        common_dir: None,
        path,
    };
    let start = if path.is_dir() {
        path.clone()
    } else {
        path.parent()
            .map(Path::to_path_buf)
            .unwrap_or_else(|| path.clone())
    };
    if !start.exists() {
        return own(path);
    }
    let Ok(Some(repo)) = fgos_git::GitDriver::topology_at(&start) else {
        return own(path);
    };
    let Some(top) = repo.work_tree() else {
        return own(path);
    };
    let real = |p: &Path| fs::canonicalize(p).unwrap_or_else(|_| absolute(p));
    let (root, common) = (real(top), real(repo.common_dir()));
    WorkspaceIdentity {
        key: format!("{}::{}", root.display(), common.display()),
        root,
        common_dir: Some(common),
        path,
    }
}

fn missing(kind: &str, id: &str, reason: &str) -> Value {
    json!({
        "inspectionStatus": "not-found",
        "subject": { "kind": kind, "id": id, "locations": [] },
        "observations": [], "runObservation": null, "runResult": null,
        "reconciliation": { "state": "not-needed", "reason": reason },
        "links": { "assignmentIds": [], "coordinationIds": [], "runIds": [] },
    })
}

/// The one selector an inspection names.
#[derive(Debug, Clone, Default)]
pub struct InspectionOptions {
    pub run: Option<String>,
    pub assignment: Option<String>,
    pub cwd: Option<String>,
    pub attention: bool,
    pub since: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Selector {
    pub kind: &'static str,
    pub id: Option<String>,
}

fn present(value: &Option<String>) -> Option<&str> {
    value.as_deref().filter(|v| !v.trim().is_empty())
}

pub fn validate_inspection_selector(options: &InspectionOptions) -> Result<Selector, String> {
    let mut supplied: Vec<(&'static str, Option<String>)> = [
        ("run", &options.run),
        ("assignment", &options.assignment),
        ("cwd", &options.cwd),
    ]
    .into_iter()
    .filter_map(|(kind, value)| present(value).map(|v| (kind, Some(v.to_string()))))
    .collect();
    if options.attention {
        supplied.push(("attention", options.since.clone()));
    }
    if supplied.len() != 1 {
        return Err("dispatch inspect requires exactly one selector: --run, --assignment, --cwd, or --attention --since <time>".into());
    }
    let (kind, id) = supplied.remove(0);
    if kind == "attention" {
        parse_attention_since(options.since.as_deref().unwrap_or_default())?;
    } else if options.since.is_some() {
        return Err("dispatch inspect --since belongs to --attention".into());
    }
    Ok(Selector { kind, id })
}

/// The instant (UTC ms) an `--attention --since` bound names: a bare `YYYY-MM-DD` (midnight UTC), or a full
/// date-time with `Z` or `±hh:mm`. Every field must survive a round trip through the calendar, so `2026-02-30` is
/// refused, not rolled over into March, and a time with no offset is refused rather than read in the local zone.
pub fn parse_attention_since(since: &str) -> Result<i64, String> {
    let refusal = || {
        "dispatch inspect --attention requires --since <YYYY-MM-DD, or a date-time with Z or ±hh:mm>".to_string()
    };
    let b = since.as_bytes();
    let digits = |from: usize, len: usize| -> Option<u32> {
        let part = since.get(from..from + len)?;
        part.bytes()
            .all(|c| c.is_ascii_digit())
            .then(|| part.parse().ok())
            .flatten()
    };
    let (year, month, day) = (
        digits(0, 4).ok_or_else(refusal)?,
        digits(5, 2).ok_or_else(refusal)?,
        digits(8, 2).ok_or_else(refusal)?,
    );
    if b.get(4) != Some(&b'-') || b.get(7) != Some(&b'-') || year < 1000 {
        return Err(refusal());
    }
    let days = fgos_host_runtime::civil_time::days_from_civil(year as i64, month, day)
        .ok_or_else(refusal)?;
    if since.len() == 10 {
        return Ok(days * 86_400_000);
    }
    // A full date-time: `T`, hh:mm:ss, optional fraction, then `Z` or `±hh:mm`.
    let (hour, minute, second) = (
        digits(11, 2).ok_or_else(refusal)?,
        digits(14, 2).ok_or_else(refusal)?,
        digits(17, 2).ok_or_else(refusal)?,
    );
    if b.get(10) != Some(&b'T')
        || b.get(13) != Some(&b':')
        || b.get(16) != Some(&b':')
        || hour > 23
        || minute > 59
        || second > 59
    {
        return Err(refusal());
    }
    let mut rest = &since[19..];
    let mut fraction_ms = 0i64;
    if let Some(after) = rest.strip_prefix('.') {
        let n = after.bytes().take_while(u8::is_ascii_digit).count();
        if n == 0 {
            return Err(refusal());
        }
        let frac = &after[..n];
        fraction_ms = format!("{:0<3}", &frac[..frac.len().min(3)])
            .parse()
            .map_err(|_| refusal())?;
        rest = &after[n..];
    }
    let offset_ms = match rest {
        "Z" => 0,
        zone if zone.len() == 6
            && (zone.starts_with('+') || zone.starts_with('-'))
            && zone.as_bytes()[3] == b':' =>
        {
            let hh: i64 = zone[1..3].parse().map_err(|_| refusal())?;
            let mm: i64 = zone[4..6].parse().map_err(|_| refusal())?;
            if hh > 23 || mm > 59 {
                return Err(refusal());
            }
            let sign = if zone.starts_with('-') { -1 } else { 1 };
            sign * (hh * 60 + mm) * 60_000
        }
        _ => return Err(refusal()),
    };
    Ok(days * 86_400_000
        + (hour as i64 * 3600 + minute as i64 * 60 + second as i64) * 1000
        + fraction_ms
        - offset_ms)
}

/// Inspect the runtime of `root` by one selector. `now` stamps the observation.
pub fn inspect_dispatch_runtime(
    root: &Path,
    options: &InspectionOptions,
    now: &dyn Fn() -> String,
    bypass_runs_cache: bool,
    runs_cache: Option<&mut RunsCache>,
) -> Result<Value, String> {
    let selector = validate_inspection_selector(options)?;
    let all = all_runs(root, bypass_runs_cache, runs_cache);
    let base = fgos_dir(root);
    let id = selector.id.clone().unwrap_or_default();
    match selector.kind {
        "run" => {
            let found: Vec<&RunLocation> = all
                .iter()
                .filter(|l| !l.malformed && l.run_id() == Some(id.as_str()))
                .collect();
            Ok(match found.len() {
                0 => missing("run", &id, "No matching Run was found in registered Assignment or ad-hoc Run repositories."),
                1 => one(found[0], root, now, &all),
                _ => {
                    let mut out = missing("run", &id, "More than one Run repository owns this run id.");
                    out["inspectionStatus"] = json!("ambiguous");
                    out["subject"] = json!({ "kind": "run", "id": id, "locations": found.iter().map(|l| l.project()).collect::<Vec<_>>() });
                    out["reconciliation"] = json!({ "state": "manual-required", "reason": "More than one Run repository owns this run id." });
                    out["links"] = json!({ "assignmentIds": uniq(found.iter().map(|l| l.assignment_id.clone())), "coordinationIds": [], "runIds": [id] });
                    out
                }
            })
        }
        "assignment" => Ok(inspect_assignment(root, &base, &id, now, &all)),
        _ => Ok(inspect_cwd(root, &base, &id, now, &all)),
    }
}

fn inspect_assignment(
    root: &Path,
    base: &Path,
    id: &str,
    now: &dyn Fn() -> String,
    all: &[RunLocation],
) -> Value {
    let Some(dir) = assignment_dir(base, id) else {
        return missing(
            "assignment",
            id,
            "assignmentId must not escape the assignments directory.",
        );
    };
    if json_file(&dir.join("assignment.json")).is_none() {
        return missing("assignment", id, "No matching Assignment was found.");
    }
    let ev = assignment_evidence(root, id, all);
    let ambiguous = ev.current.len() > 1 || !ev.duplicate_current.is_empty();
    let inspected =
        (!ambiguous && ev.current.len() == 1).then(|| one(&all[ev.current[0]], root, now, all));
    let status = if ev.incomplete {
        "partial".to_string()
    } else if ambiguous {
        "conflicting".to_string()
    } else {
        inspected
            .as_ref()
            .and_then(|i| str_of(i, "inspectionStatus"))
            .unwrap_or("resolved")
            .to_string()
    };
    let project = |indices: &[usize]| {
        indices
            .iter()
            .map(|i| all[*i].project())
            .collect::<Vec<_>>()
    };
    let run_ids: Vec<&str> = ev
        .facts
        .records
        .iter()
        .filter_map(|r| str_of(r, "runId"))
        .collect();
    let mut out = Map::new();
    out.insert("inspectionStatus".into(), json!(status));
    out.insert(
        "subject".into(),
        json!({ "kind": "assignment", "id": id, "locations": project(&ev.records) }),
    );
    out.insert(
        "observations".into(),
        json!([{
            "kind": "assignment-history", "source": "admission-generation-ledger",
            "level": if ev.incomplete { "partial" } else { "correlated" },
            "value": {
                "delivery": if ev.facts.records.is_empty() { "not-started" } else { "started" },
                "currentRunIds": ev.current_ids, "runIds": run_ids,
                "missingMaterializations": ev.absent,
                "malformedMaterializations": project(&ev.malformed),
                "unadmittedMaterializations": project(&ev.unadmitted),
                "duplicateCurrentMaterializations": ev.duplicate_current,
            },
        }]),
    );
    out.insert(
        "runObservation".into(),
        inspected
            .as_ref()
            .and_then(|i| i.get("runObservation"))
            .cloned()
            .unwrap_or(Value::Null),
    );
    out.insert(
        "runResult".into(),
        inspected
            .as_ref()
            .and_then(|i| i.get("runResult"))
            .cloned()
            .unwrap_or(Value::Null),
    );
    if !ev.incomplete && !ambiguous {
        if let Some(hint) = inspected.as_ref().and_then(|i| i.get("recoveryAuthority")) {
            out.insert("recoveryAuthority".into(), hint.clone());
        }
    }
    let reason = if ev.incomplete {
        "Admission ledger and Run materialization are incomplete or corrupt."
    } else if ambiguous {
        "Multiple current Run materializations were derived from admission facts."
    } else {
        "No stale local guard was observed."
    };
    out.insert("reconciliation".into(), json!({ "state": if ev.incomplete || ambiguous { "manual-required" } else { "not-needed" }, "reason": reason }));
    out.insert(
        "links".into(),
        json!({ "assignmentIds": [id], "coordinationIds": [], "runIds": run_ids }),
    );
    Value::Object(out)
}

fn inspect_cwd(
    root: &Path,
    base: &Path,
    id: &str,
    now: &dyn Fn() -> String,
    all: &[RunLocation],
) -> Value {
    let _ = now;
    let identity = workspace(Path::new(id));
    let valid: Vec<&RunLocation> = all.iter().filter(|l| !l.malformed).collect();
    let found: Vec<&RunLocation> = valid
        .iter()
        .copied()
        .filter(|l| {
            l.run_field("cwd")
                .and_then(Value::as_str)
                .is_some_and(|c| !c.is_empty() && workspace(Path::new(c)).key == identity.key)
        })
        .collect();
    let terminals: Vec<Terminal> = found.iter().map(|l| result_of(l)).collect();
    let active: Vec<&RunLocation> = found
        .iter()
        .zip(&terminals)
        .filter(|(_, t)| !t.present)
        .map(|(l, _)| *l)
        .collect();
    let historical: Vec<(&RunLocation, &Terminal)> = found
        .iter()
        .copied()
        .zip(&terminals)
        .filter(|(_, t)| t.present)
        .collect();
    let (lock_ok, lock) = json_evidence(&base.join("dispatch.lock"), Value::Null);
    let (workspace_ok, workspace_value) = json_evidence(
        &base.join("workspace-evidence.json"),
        json!({ "dirt": "unknown" }),
    );
    let (projection_ok, projection) = json_evidence(
        &base.join("dispatch").join("projection-conflicts.json"),
        json!([]),
    );
    let evidence_complete = lock_ok && workspace_ok && projection_ok && projection.is_array();
    let malformed = all
        .iter()
        .any(|l| l.malformed && l.kind == "assignment-run");
    let conflicts = projection.as_array().cloned().unwrap_or_default();
    let conflict = (active.len() > 1
        && active
            .iter()
            .any(|l| l.run_field("concurrency").and_then(Value::as_str) == Some("forbidden")))
        || !conflicts.is_empty();
    let aggregate = json!({
        "git": { "path": identity.path.to_string_lossy(), "root": identity.root.to_string_lossy(), "commonDir": identity.common_dir.as_ref().map(|c| c.to_string_lossy().into_owned()), "key": identity.key },
        "lock": lock,
        "activeRunIds": active.iter().filter_map(|l| l.run_id()).collect::<Vec<_>>(),
        "historicalRunIds": historical.iter().filter_map(|(l, _)| l.run_id()).collect::<Vec<_>>(),
        "historicalRunResults": historical.iter().map(|(l, t)| json!({ "runId": l.run_id(), "result": t.value })).collect::<Vec<_>>(),
        "workspace": workspace_value,
        "guardConflicts": conflicts,
    });
    let subject_id = identity.path.to_string_lossy().into_owned();
    if found.is_empty() {
        let mut out = missing(
            "cwd",
            &subject_id,
            "No Runs are bound to this canonical workspace identity.",
        );
        out["observations"] = json!([{ "kind": "cwd-aggregate", "source": "workspace-evidence", "level": "partial", "value": aggregate }]);
        return out;
    }
    let ownership_complete = found.iter().all(|l| owner(l, root, all).complete);
    let complete = evidence_complete && !malformed && ownership_complete;
    let hint = (complete && active.len() == 1 && !conflict)
        .then(|| authority(active[0], root, all))
        .flatten();
    let status = if conflict {
        "conflicting"
    } else if complete {
        "resolved"
    } else {
        "partial"
    };
    let reason = if conflict {
        "Workspace guard/projection or concurrency facts conflict."
    } else if !complete {
        "Workspace guard/projection evidence or Run materialization is incomplete or corrupt."
    } else {
        "Inspection is read-only and does not repair guards."
    };
    let mut out = Map::new();
    out.insert("inspectionStatus".into(), json!(status));
    out.insert("subject".into(), json!({ "kind": "cwd", "id": subject_id, "locations": found.iter().map(|l| l.project()).collect::<Vec<_>>() }));
    out.insert("observations".into(), json!([{ "kind": "cwd-aggregate", "source": "workspace-evidence", "level": if complete && !conflict { "correlated" } else { "partial" }, "value": aggregate }]));
    out.insert("runObservation".into(), Value::Null);
    out.insert("runResult".into(), Value::Null);
    if let Some(hint) = hint {
        out.insert("recoveryAuthority".into(), hint);
    }
    out.insert("reconciliation".into(), json!({ "state": if conflict || !complete { "manual-required" } else { "not-needed" }, "reason": reason }));
    out.insert(
        "links".into(),
        json!({
            "assignmentIds": uniq(found.iter().map(|l| l.assignment_id.clone())),
            "coordinationIds": [],
            "runIds": found.iter().filter_map(|l| l.run_id()).collect::<Vec<_>>(),
        }),
    );
    Value::Object(out)
}
