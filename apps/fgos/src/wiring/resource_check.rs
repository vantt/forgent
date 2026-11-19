//! `fgos resource-check`: the planner door. It builds claims and edges from a plan's phase table (`--plan <dir>`)
//! or a units file (`--units <file.json>`), asks `fgos-write-scope` which claims collide, `fgos-graph` for the
//! layers, cycles and groups, and `fgos-resource-referee` for the verdict under a policy, and prints the answer.
//! It owns no overlap rule, no table reader and no file reader of its own: the phase table is read by
//! `fgos_supervision::portfolio::read_plan`, every file by `fgos_durable_file::open_beneath` with a byte cap.
//! Every value taken from an input file is printed through [`escape_text`], so a hostile file cannot reach a
//! terminal raw, and an error never quotes file content.
use crate::routing::Call;
use fgos_durable_file::{open_beneath, BeneathError, BeneathRefusal};
use fgos_host_runtime::{
    CategorisedRefusal, ContractRef, EventSink, HostInvocation, InvocationControl, OperationId,
    OperationProvider, OperationRequest, ProviderDescriptor, ProviderError, ProviderLifecycle,
    ProviderOutcome, VerbAnswer,
};
use serde_json::{json, Map, Value};
use sha2::{Digest, Sha256};
use std::borrow::Cow;
use std::collections::HashMap;
use std::ffi::OsString;
use std::future::Future;
use std::path::{Path, PathBuf};
use std::pin::Pin;

pub const OPERATION_ID: &str = "resource-check.run";

pub const DESCRIPTOR: ProviderDescriptor = ProviderDescriptor {
    provider_id: Cow::Borrowed(OPERATION_ID),
    operation_id: OperationId::from_static(OPERATION_ID),
    component_class: Cow::Borrowed("resource-check"),
    mechanism: Cow::Borrowed("builtin"),
    lifecycle: ProviderLifecycle::Singleton,
    request_contract: ContractRef::from_static("resource-check.run.request", "1.0.0"),
    outcome_contract: ContractRef::from_static("resource-check.run.outcome", "1.0.0"),
    allowed_hosts: &["cli"],
    allowed_modes: &["sync"],
    capabilities: &[],
    replacement: None,
    concurrency: None,
    health: None,
};

/// The policy the door applies when `--policy` is not given: the floor (which the referee always runs) plus the
/// declared layers valid. Data, not code; this repository ships no policy file.
const DEFAULT_POLICY: &str = r#"{"rules":[{"check":"declared-layers-valid"}]}"#;
const DEFAULT_POLICY_SOURCE: &str = "shipped-default";

/// Longest value printed from an input file, in bytes: the entry limit of the contract.
const MAX_PRINTED_BYTES: usize = fgos_resource_referee::MAX_ENTRY_BYTES;
/// Byte cap of one input document (the contract's `maxInputBytes`).
const MAX_INPUT_BYTES: usize = fgos_graph::MAX_INPUT_BYTES;

/// The claim spaces of the referee contract; any other space is refused by name.
const SPACES: [&str; 3] = ["path", "ref", "port"];

/// Exit status of a `reject` verdict: a conflict between units, distinct from an input refusal (validation).
fn reject_exit() -> i32 {
    fgos_host_runtime::exit_codes::code_of("conflict")
}

/// One `fgos resource-check` invocation, as the projector read it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ResourceCheckRequest {
    pub cwd: PathBuf,
    pub plan: Option<String>,
    pub units: Option<String>,
    pub policy: Option<String>,
    pub json: bool,
    /// A usage error found while reading the flags (a flag that needs a value, used bare).
    pub usage: Option<String>,
}

/// Reads a call of `resource-check` (`args[0]` is the verb) through the shared parser.
pub fn project_resource_check_request(args: &[OsString]) -> ResourceCheckRequest {
    let call = Call::new(args);
    let mut usage = None;
    let mut take = |name: &str| match call.value(name) {
        Ok(value) => value,
        Err(why) => {
            usage.get_or_insert(why);
            None
        }
    };
    let plan = take("plan");
    let units = take("units");
    let policy = take("policy");
    ResourceCheckRequest {
        cwd: std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")),
        plan,
        units,
        policy,
        json: call.parsed().flag("json").is_some(),
        usage,
    }
}

// ---------------------------------------------------------------------------------------------------------------
// Escaping: the one function every value from an input file goes through.
// ---------------------------------------------------------------------------------------------------------------

/// `text` with every control character written as `\u{XXXX}` and the length cut at the printing limit.
pub(crate) fn escape_text(text: &str) -> String {
    let mut out = String::with_capacity(text.len().min(MAX_PRINTED_BYTES) + 4);
    for c in text.chars() {
        let piece_len = if c.is_control() { 8 } else { c.len_utf8() };
        if out.len() + piece_len > MAX_PRINTED_BYTES {
            out.push('…');
            return out;
        }
        if c.is_control() {
            out.push_str(&format!("\\u{{{:04x}}}", c as u32));
        } else {
            out.push(c);
        }
    }
    out
}

/// Every string of `value` escaped (object keys are the door's own field names and stay as they are).
fn escape_value(value: Value) -> Value {
    match value {
        Value::String(s) => Value::String(escape_text(&s)),
        Value::Array(items) => Value::Array(items.into_iter().map(escape_value).collect()),
        Value::Object(map) => Value::Object(
            map.into_iter()
                .map(|(key, item)| (key, escape_value(item)))
                .collect(),
        ),
        other => other,
    }
}

// ---------------------------------------------------------------------------------------------------------------
// Reading inputs
// ---------------------------------------------------------------------------------------------------------------

/// A refusal of the call: always the caller's usage error, never a quote of file content.
struct Refused(String);

fn refuse(code: &str, detail: impl AsRef<str>) -> Refused {
    Refused(format!("resource-check: {code}: {}", detail.as_ref()))
}

/// One capped read of `name` beneath `root`: the bytes and their revision.
fn read_beneath(root: &Path, name: &Path, label: &str) -> Result<(Vec<u8>, String), Refused> {
    let shown = escape_text(&name.to_string_lossy());
    let opened = match open_beneath(root, name) {
        Ok(Some(file)) => file,
        Ok(None) => return Err(refuse("input-missing", format!("{label}: {shown}"))),
        Err(error) => return Err(beneath_refusal(&error, label, &shown)),
    };
    match opened.read(MAX_INPUT_BYTES) {
        Ok(read) => Ok((read.bytes, read.revision)),
        Err(error) => Err(beneath_refusal(&error, label, &shown)),
    }
}

fn beneath_refusal(error: &BeneathError, label: &str, shown: &str) -> Refused {
    let (code, why) = match error {
        BeneathError::Refused(BeneathRefusal::Symlink) => {
            ("input-symlink", "a symlink is never followed")
        }
        BeneathError::Refused(BeneathRefusal::NotRegular) => {
            ("input-not-regular", "not a regular file")
        }
        BeneathError::Refused(BeneathRefusal::TooLarge) => {
            ("input-too-large", "larger than the 4 MiB input limit")
        }
        BeneathError::Refused(BeneathRefusal::Escape) => {
            ("input-path-invalid", "not a plain downward path")
        }
        BeneathError::Io(_) => ("input-unreadable", "the file could not be read"),
    };
    refuse(code, format!("{label}: {shown}: {why}"))
}

/// The root and the leaf of a file the caller named: its parent directory (an empty parent of a bare file name is
/// the current directory) and its name.
fn split_file(path: &str, label: &str) -> Result<(PathBuf, PathBuf), Refused> {
    let path = Path::new(path);
    let Some(leaf) = path.file_name() else {
        return Err(refuse(
            "input-path-invalid",
            format!(
                "{label} {} names no file",
                escape_text(&path.to_string_lossy())
            ),
        ));
    };
    let parent = match path.parent() {
        Some(parent) if !parent.as_os_str().is_empty() => parent.to_path_buf(),
        _ => PathBuf::from("."),
    };
    Ok((parent, PathBuf::from(leaf)))
}

fn parse_json(bytes: &[u8], label: &str) -> Result<Value, Refused> {
    serde_json::from_slice(bytes).map_err(|error| {
        refuse(
            "input-not-json",
            format!(
                "{label} is not valid JSON (line {}, column {})",
                error.line(),
                error.column()
            ),
        )
    })
}

// ---------------------------------------------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------------------------------------------

#[derive(Debug, Clone)]
struct Claim {
    space: String,
    reference: String,
}

#[derive(Debug, Clone)]
struct Unit {
    id: String,
    claims: Option<Vec<Claim>>,
    read_only: bool,
    depends_on: Vec<String>,
    layer: Option<u64>,
}

impl Unit {
    /// The node of the referee's facts.
    fn node(&self) -> Value {
        let mut node = Map::new();
        node.insert("id".into(), json!(self.id));
        if let Some(claims) = &self.claims {
            node.insert(
                "claims".into(),
                Value::Array(
                    claims
                        .iter()
                        .map(|c| json!({"space": c.space, "ref": c.reference}))
                        .collect(),
                ),
            );
        }
        if self.read_only {
            node.insert("readOnly".into(), json!(true));
        }
        if !self.depends_on.is_empty() {
            node.insert("dependsOn".into(), json!(self.depends_on));
        }
        if let Some(layer) = self.layer {
            node.insert("layer".into(), json!(layer));
        }
        Value::Object(node)
    }

    fn refs_in(&self, space: &str) -> Vec<String> {
        self.claims
            .iter()
            .flatten()
            .filter(|c| c.space == space)
            .map(|c| c.reference.clone())
            .collect()
    }
}

fn check_id(id: &str, index: usize, what: &str) -> Result<(), Refused> {
    if id.chars().any(char::is_control) {
        return Err(refuse(
            "id-control-character",
            format!("{what} {index} has a control character in its id"),
        ));
    }
    Ok(())
}

fn only_keys(map: &Map<String, Value>, allowed: &[&str], at: &str) -> Result<(), Refused> {
    match map.keys().find(|key| !allowed.contains(&key.as_str())) {
        Some(key) => Err(refuse(
            "unknown-field",
            format!("{at} has the field {}", escape_text(key)),
        )),
        None => Ok(()),
    }
}

/// The units of a `--units` file (`{ "v": 1, "units": [...] }`, the shape of `resource-referee.v1.json`).
fn units_of_file(doc: &Value) -> Result<Vec<Unit>, Refused> {
    let Some(top) = doc.as_object() else {
        return Err(refuse(
            "input-not-object",
            "the units file is not a JSON object",
        ));
    };
    only_keys(top, &["v", "units"], "the units file")?;
    if top.get("v") != Some(&json!(1)) {
        return Err(refuse("units-version", "the units file needs \"v\": 1"));
    }
    let Some(list) = top.get("units").and_then(Value::as_array) else {
        return Err(refuse(
            "node-malformed",
            "\"units\" is missing or not a list",
        ));
    };
    let mut units = Vec::with_capacity(list.len());
    for (i, raw) in list.iter().enumerate() {
        let at = format!("units[{i}]");
        let Some(m) = raw.as_object() else {
            return Err(refuse("node-malformed", format!("{at} is not an object")));
        };
        only_keys(m, &["id", "claims", "readOnly", "dependsOn", "layer"], &at)?;
        let id = match m.get("id").and_then(Value::as_str) {
            Some(id) if !id.is_empty() => id.to_owned(),
            _ => {
                return Err(refuse(
                    "node-malformed",
                    format!("{at} needs a non-empty string id"),
                ))
            }
        };
        check_id(&id, i, "unit")?;
        let claims = match m.get("claims") {
            None => None,
            Some(Value::Array(items)) => {
                let mut claims = Vec::with_capacity(items.len());
                for item in items {
                    let Some(c) = item.as_object() else {
                        return Err(refuse(
                            "claim-malformed",
                            format!("{at} has a claim that is not an object"),
                        ));
                    };
                    only_keys(c, &["space", "ref"], &format!("a claim of {at}"))?;
                    let (Some(space), Some(reference)) = (
                        c.get("space").and_then(Value::as_str),
                        c.get("ref").and_then(Value::as_str),
                    ) else {
                        return Err(refuse(
                            "claim-malformed",
                            format!("{at} has a claim without a string space and ref"),
                        ));
                    };
                    if !SPACES.contains(&space) {
                        return Err(refuse(
                            "claim-space-unknown",
                            format!(
                                "unit {} claims {} in the unknown space {}",
                                escape_text(&id),
                                escape_text(reference),
                                escape_text(space)
                            ),
                        ));
                    }
                    claims.push(Claim {
                        space: space.to_owned(),
                        reference: reference.to_owned(),
                    });
                }
                Some(claims)
            }
            Some(_) => {
                return Err(refuse(
                    "claim-malformed",
                    format!("{at}: claims is not a list"),
                ))
            }
        };
        let read_only = match m.get("readOnly") {
            None => false,
            Some(Value::Bool(b)) => *b,
            Some(_) => {
                return Err(refuse(
                    "node-malformed",
                    format!("{at}: readOnly is not a boolean"),
                ))
            }
        };
        let depends_on = match m.get("dependsOn") {
            None => Vec::new(),
            Some(Value::Array(items)) => items
                .iter()
                .map(|x| x.as_str().map(str::to_owned))
                .collect::<Option<Vec<_>>>()
                .ok_or_else(|| {
                    refuse(
                        "node-malformed",
                        format!("{at}: dependsOn holds a non-string"),
                    )
                })?,
            Some(_) => {
                return Err(refuse(
                    "node-malformed",
                    format!("{at}: dependsOn is not a list"),
                ))
            }
        };
        let layer = match m.get("layer") {
            None => None,
            Some(v) => Some(v.as_u64().filter(|l| *l >= 1).ok_or_else(|| {
                refuse(
                    "node-malformed",
                    format!("{at}: layer is not an integer from 1"),
                )
            })?),
        };
        units.push(Unit {
            id,
            claims,
            read_only,
            depends_on,
            layer,
        });
    }
    Ok(units)
}

/// The units of a plan: one per phase, its footprint entries as `path` claims, its wave as the declared layer.
fn units_of_plan(plan: &fgos_supervision::portfolio::Plan) -> Result<Vec<Unit>, Refused> {
    plan.phases
        .iter()
        .enumerate()
        .map(|(i, phase)| {
            check_id(&phase.id, i, "phase")?;
            Ok(Unit {
                id: phase.id.clone(),
                claims: Some(
                    phase
                        .footprint
                        .iter()
                        .map(|entry| Claim {
                            space: "path".into(),
                            reference: entry.clone(),
                        })
                        .collect(),
                ),
                read_only: false,
                depends_on: phase.depends_on.clone(),
                layer: Some(u64::from(phase.wave)),
            })
        })
        .collect()
}

// ---------------------------------------------------------------------------------------------------------------
// Facts
// ---------------------------------------------------------------------------------------------------------------

struct Collision {
    a: usize,
    b: usize,
    shared: Vec<String>,
}

struct Collisions {
    pairs: Vec<Collision>,
    problems: Vec<Value>,
    truncated: Option<Value>,
}

/// Which units collide: `path` claims by the write-scope rule, every other space by exact equality. Read-only
/// units take no part. The answer is cut, and says so, at the pair cap.
fn collide(units: &[Unit]) -> Collisions {
    let mut out = Collisions {
        pairs: Vec::new(),
        problems: Vec::new(),
        truncated: None,
    };
    let index: HashMap<&str, usize> = units
        .iter()
        .enumerate()
        .map(|(i, u)| (u.id.as_str(), i))
        .collect();
    let mut slot: HashMap<(usize, usize), usize> = HashMap::new();
    let mut add = |out: &mut Collisions, a: usize, b: usize, shared: Vec<String>| {
        let key = (a.min(b), a.max(b));
        match slot.get(&key) {
            Some(&at) => {
                for entry in shared {
                    if !out.pairs[at].shared.contains(&entry) {
                        out.pairs[at].shared.push(entry);
                    }
                }
            }
            None => {
                slot.insert(key, out.pairs.len());
                out.pairs.push(Collision {
                    a: key.0,
                    b: key.1,
                    shared,
                });
            }
        }
    };

    let items: Vec<fgos_write_scope::Item> = units
        .iter()
        .filter(|u| !u.read_only)
        .map(|u| fgos_write_scope::Item {
            id: u.id.clone(),
            scopes: u.refs_in("path"),
        })
        .collect();
    let found = fgos_write_scope::colliding_pairs(&items);
    for pair in &found.pairs {
        if let (Some(&a), Some(&b)) = (index.get(pair.a.as_str()), index.get(pair.b.as_str())) {
            add(&mut out, a, b, pair.shared.clone());
        }
    }
    for problem in &found.problems {
        // The referee derives the empty and over-limit findings from the nodes; only an entry that does not
        // canonicalize is passed on, so each fact has one source.
        if problem.code == "entry-invalid" {
            out.problems.push(json!({
                "item": problem.item,
                "code": "entry-invalid",
                "entry": problem.entry,
                "why": problem.why,
            }));
        }
    }
    if let Some(cut) = &found.truncated {
        out.truncated = Some(json!({
            "reason": cut.reason,
            "limit": cut.limit,
            "source": "write-scope",
        }));
    }

    for space in SPACES.iter().filter(|s| **s != "path") {
        let mut holders: Vec<(String, Vec<usize>)> = Vec::new();
        let mut at: HashMap<String, usize> = HashMap::new();
        for (i, unit) in units.iter().enumerate().filter(|(_, u)| !u.read_only) {
            for reference in unit.refs_in(space) {
                let slot = *at.entry(reference.clone()).or_insert_with(|| {
                    holders.push((reference.clone(), Vec::new()));
                    holders.len() - 1
                });
                if !holders[slot].1.contains(&i) {
                    holders[slot].1.push(i);
                }
            }
        }
        for (reference, who) in holders {
            for (n, &a) in who.iter().enumerate() {
                for &b in &who[n + 1..] {
                    if out.pairs.len() >= fgos_write_scope::MAX_PAIRS {
                        out.truncated.get_or_insert(json!({
                            "reason": "pairs-cap",
                            "limit": fgos_write_scope::MAX_PAIRS,
                            "source": "resource-check",
                        }));
                        return out;
                    }
                    add(&mut out, a, b, vec![format!("{space}:{reference}")]);
                }
            }
        }
    }
    out
}

/// The graph document of the units: depends-on edges, and the collisions as exclusion pairs.
fn graph_input(units: &[Unit], collisions: &Collisions) -> Value {
    let edges: Vec<Value> = units
        .iter()
        .flat_map(|u| {
            u.depends_on
                .iter()
                .map(move |dep| json!({"from": u.id, "to": dep, "kind": "depends-on"}))
        })
        .collect();
    let exclusions: Vec<Value> = collisions
        .pairs
        .iter()
        .map(|p| json!({"a": units[p.a].id, "b": units[p.b].id}))
        .collect();
    json!({
        "nodes": units.iter().map(|u| json!({"id": u.id})).collect::<Vec<_>>(),
        "edges": edges,
        "exclusions": exclusions,
    })
}

// ---------------------------------------------------------------------------------------------------------------
// The check
// ---------------------------------------------------------------------------------------------------------------

/// Where the units came from, echoed in the answer.
enum Source {
    Plan(String),
    Units(String),
}

struct Loaded {
    source: Source,
    units: Vec<Unit>,
}

fn load(request: &ResourceCheckRequest) -> Result<Loaded, Refused> {
    match (&request.plan, &request.units) {
        (Some(_), Some(_)) => Err(refuse("usage", "give --plan or --units, not both")),
        (None, None) => Err(refuse("usage", "give --plan <dir> or --units <file.json>")),
        (Some(dir), None) => {
            let trimmed = dir.trim_end_matches('/');
            if trimmed.is_empty() {
                return Err(refuse("input-path-invalid", "--plan names no directory"));
            }
            let root = request.cwd.join(trimmed);
            let name = match Path::new(trimmed).file_name() {
                Some(name) => name.to_string_lossy().into_owned(),
                None => request
                    .cwd
                    .file_name()
                    .map(|n| n.to_string_lossy().into_owned())
                    .unwrap_or_else(|| "plan".to_owned()),
            };
            let label = format!("plan directory {}", escape_text(trimmed));
            let (bytes, _) = read_beneath(&root, Path::new("plan.md"), &label)?;
            let text = String::from_utf8(bytes)
                .map_err(|_| refuse("input-not-utf8", "plan.md is not UTF-8 text"))?;
            let plan = fgos_supervision::portfolio::read_plan(&name, &text).map_err(|why| {
                refuse(
                    "phase-table",
                    format!("{} in plan {}", why.code(), escape_text(&name)),
                )
            })?;
            let units = units_of_plan(&plan)?;
            Ok(Loaded {
                source: Source::Plan(name),
                units,
            })
        }
        (None, Some(file)) => {
            let (parent, leaf) = split_file(file, "--units")?;
            let (bytes, _) = read_beneath(&request.cwd.join(parent), &leaf, "units file")?;
            let doc = parse_json(&bytes, "the units file")?;
            Ok(Loaded {
                source: Source::Units(file.clone()),
                units: units_of_file(&doc)?,
            })
        }
    }
}

/// The ruleset and the identity the verdict echoes: the policy file when given, else the shipped default.
fn load_policy(request: &ResourceCheckRequest) -> Result<(Value, Value), Refused> {
    match &request.policy {
        None => Ok((
            serde_json::from_str(DEFAULT_POLICY).expect("the shipped policy is valid JSON"),
            json!({"source": DEFAULT_POLICY_SOURCE, "sha256": format!("{:x}", Sha256::digest(DEFAULT_POLICY.as_bytes()))}),
        )),
        Some(file) => {
            let (parent, leaf) = split_file(file, "--policy")?;
            let (bytes, revision) = read_beneath(&request.cwd.join(parent), &leaf, "policy file")?;
            let ruleset = parse_json(&bytes, "the policy file")?;
            Ok((ruleset, json!({"source": file, "sha256": revision})))
        }
    }
}

fn check(request: &ResourceCheckRequest) -> Result<(Value, i32), Refused> {
    if let Some(why) = &request.usage {
        return Err(refuse("usage", why));
    }
    // The policy is read first: a missing policy file is a refusal whatever the plan holds, never a fall back.
    let (ruleset, policy) = load_policy(request)?;
    let loaded = load(request)?;
    let units = &loaded.units;
    let mut seen = HashMap::new();
    for (i, unit) in units.iter().enumerate() {
        if seen.insert(unit.id.as_str(), i).is_some() {
            return Err(refuse(
                "duplicate-node-id",
                format!("unit {i} repeats an earlier id"),
            ));
        }
    }

    let collisions = collide(units);
    let analysis = fgos_graph::analyze_value(&graph_input(units, &collisions))
        .map_err(|why| refuse("graph-refused", escape_text(&why.to_string())))?;
    let graph = serde_json::to_value(&analysis).expect("an analysis is plain data");

    let exclusions: Vec<Value> = collisions
        .pairs
        .iter()
        .map(|p| json!({"a": units[p.a].id, "b": units[p.b].id, "shared": p.shared}))
        .collect();
    let facts = json!({
        "nodes": units.iter().map(Unit::node).collect::<Vec<_>>(),
        "graph": graph,
        "exclusions": exclusions,
        "problems": collisions.problems,
        "truncated": collisions.truncated,
    });
    let verdict = fgos_resource_referee::evaluate(&facts, &ruleset, Some(&policy))
        .map_err(|why| refuse("referee-refused", escape_text(&why.to_string())))?;
    let mut answer = serde_json::to_value(&verdict).expect("a verdict is plain data");

    let object = answer.as_object_mut().expect("a verdict is an object");
    if units.is_empty() {
        let code = match loaded.source {
            Source::Plan(_) => "no-phases",
            Source::Units(_) => "no-units",
        };
        let finding = json!({
            "code": code,
            "class": "blocking",
            "check": "door",
            "nodes": [],
            "evidence": "the input has no unit to place; an empty set is never accepted",
        });
        if let Some(Value::Array(findings)) = object.get_mut("findings") {
            findings.insert(0, finding);
        }
        object.insert("verdict".into(), json!("reject"));
    }
    object.insert(
        "source".into(),
        match &loaded.source {
            Source::Plan(name) => json!({"kind": "plan", "name": name}),
            Source::Units(file) => json!({"kind": "units", "file": file}),
        },
    );
    object.insert("collisions".into(), Value::Array(exclusions));
    object.insert("graph".into(), graph);

    let rejected = object.get("verdict") == Some(&json!("reject"));
    Ok((
        escape_value(answer),
        if rejected { reject_exit() } else { 0 },
    ))
}

// ---------------------------------------------------------------------------------------------------------------
// Human output, rendered from the already escaped data
// ---------------------------------------------------------------------------------------------------------------

fn names(value: &Value) -> String {
    value
        .as_array()
        .map(|items| {
            items
                .iter()
                .filter_map(Value::as_str)
                .collect::<Vec<_>>()
                .join(", ")
        })
        .unwrap_or_default()
}

fn render(data: &Value) -> String {
    let text = |v: &Value| v.as_str().unwrap_or("").to_owned();
    let mut out = String::new();
    let findings = data["findings"].as_array().cloned().unwrap_or_default();
    out.push_str(&format!(
        "resource-check: {} ({} units, {} findings)\n",
        text(&data["verdict"]),
        data["counts"]["nodes"],
        findings.len()
    ));
    let source = &data["source"];
    out.push_str(&match text(&source["kind"]).as_str() {
        "plan" => format!("source: plan {}\n", text(&source["name"])),
        _ => format!("source: units file {}\n", text(&source["file"])),
    });
    out.push_str(&format!(
        "policy: {} sha256 {}\n",
        text(&data["policy"]["source"]),
        text(&data["policy"]["sha256"])
    ));
    for finding in &findings {
        out.push_str(&format!(
            "  [{}] {} ({}) nodes: {} evidence: {}\n",
            text(&finding["class"]),
            text(&finding["code"]),
            text(&finding["check"]),
            names(&finding["nodes"]),
            escape_text(&finding["evidence"].to_string())
        ));
    }
    for pair in data["collisions"].as_array().into_iter().flatten() {
        out.push_str(&format!(
            "collision: {} x {} share {}\n",
            text(&pair["a"]),
            text(&pair["b"]),
            names(&pair["shared"])
        ));
    }
    // The graph counts layers from 0; a planner's waves and declared layers count from 1.
    let unit_word = if text(&source["kind"]) == "plan" {
        "wave"
    } else {
        "layer"
    };
    for layer in data["graph"]["layers"].as_array().into_iter().flatten() {
        out.push_str(&format!(
            "{unit_word} {}: {}\n",
            layer["index"].as_u64().map_or(0, |index| index + 1),
            names(&layer["nodes"])
        ));
    }
    if let Some(path) = data["graph"]["criticalPath"].as_object() {
        out.push_str(&format!(
            "critical path ({}): {}\n",
            path["depth"],
            names(&path["path"]).replace(", ", " -> ")
        ));
    }
    out.push_str(&format!(
        "independent groups: {}\n",
        data["graph"]["groups"]["groupCount"]
    ));
    for cycle in data["graph"]["cycles"].as_array().into_iter().flatten() {
        out.push_str(&format!(
            "cycle: {}\n",
            names(&cycle["cycle"]).replace(", ", " -> ")
        ));
    }
    let read_only = names(&data["readOnlyNodes"]);
    if !read_only.is_empty() {
        out.push_str(&format!(
            "read-only (asserted, not verified): {read_only}\n"
        ));
    }
    for caveat in data["caveats"].as_array().into_iter().flatten() {
        out.push_str(&format!(
            "caveat {}: {}\n",
            text(&caveat["id"]),
            text(&caveat["text"])
        ));
    }
    out
}

/// What a request answers: the envelope data and exit status (with the human text unless `--json`), or the
/// caller's refusal.
fn answer(request: &ResourceCheckRequest) -> Result<VerbAnswer, CategorisedRefusal> {
    match check(request) {
        Ok((data, exit)) => Ok(VerbAnswer {
            text: (!request.json).then(|| render(&data)),
            data,
            exit,
        }),
        Err(Refused(message)) => Err(CategorisedRefusal::new("validation", message)),
    }
}

/// The provider of `resource-check.run`.
pub struct ResourceCheckProvider {
    descriptor: ProviderDescriptor,
}

impl ResourceCheckProvider {
    pub fn new() -> Self {
        Self {
            descriptor: DESCRIPTOR,
        }
    }
}

impl Default for ResourceCheckProvider {
    fn default() -> Self {
        Self::new()
    }
}

impl OperationProvider for ResourceCheckProvider {
    fn descriptor(&self) -> &ProviderDescriptor {
        &self.descriptor
    }

    fn invoke<'a>(
        &'a self,
        _invocation: &'a HostInvocation,
        request: OperationRequest,
        _control: InvocationControl,
        events: &'a dyn EventSink,
    ) -> Pin<Box<dyn Future<Output = Result<ProviderOutcome, ProviderError>> + Send + 'a>> {
        Box::pin(async move {
            events.record_event(&format!("{OPERATION_ID}.invoked"));
            let request = request
                .input
                .downcast_ref::<ResourceCheckRequest>()
                .ok_or_else(|| {
                    ProviderError::SemanticValidation("input is not ResourceCheckRequest".into())
                })?;
            let contract = self.descriptor.outcome_contract.clone();
            Ok(match answer(request) {
                Ok(verb) => ProviderOutcome::completed(contract, Box::new(verb)),
                Err(refusal) => ProviderOutcome::completed(contract, Box::new(refusal)),
            })
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::os::unix::fs::symlink;

    /// A scratch directory of its own per test; removed when the test ends.
    struct Scratch(PathBuf);
    impl Scratch {
        fn new(tag: &str) -> Self {
            let dir = std::env::temp_dir()
                .join(format!("fgos-resource-check-{tag}-{}", std::process::id()));
            let _ = std::fs::remove_dir_all(&dir);
            std::fs::create_dir_all(&dir).unwrap();
            Scratch(dir)
        }
        fn put(&self, relative: &str, text: &str) -> PathBuf {
            let path = self.0.join(relative);
            std::fs::create_dir_all(path.parent().unwrap()).unwrap();
            std::fs::write(&path, text).unwrap();
            path
        }
        fn request(&self) -> ResourceCheckRequest {
            ResourceCheckRequest {
                cwd: self.0.clone(),
                plan: None,
                units: None,
                policy: None,
                json: true,
                usage: None,
            }
        }
    }
    impl Drop for Scratch {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.0);
        }
    }

    fn plan_text(status: &str, rows: &[&str]) -> String {
        let table = if rows.is_empty() {
            String::new()
        } else {
            format!(
                "| id | title | depends-on | footprint | wave | status |\n|---|---|---|---|---|---|\n{}\n",
                rows.join("\n")
            )
        };
        format!(
            "---\ncontract: plan-v1\ntitle: t\nstatus: {status}\npriority: P2\ncreated: 2026-11-19\n---\n\n# t\n\n{table}"
        )
    }

    fn run(request: &ResourceCheckRequest) -> Result<(Value, i32), String> {
        check(request).map_err(|Refused(message)| message)
    }

    fn codes(data: &Value) -> Vec<String> {
        data["findings"]
            .as_array()
            .unwrap()
            .iter()
            .map(|f| f["code"].as_str().unwrap().to_owned())
            .collect()
    }

    #[test]
    fn a_control_character_is_written_out_and_a_long_value_is_cut() {
        assert_eq!(escape_text("a\u{1b}[31mb\nc"), "a\\u{001b}[31mb\\u{000a}c");
        let long = "x".repeat(5000);
        let shown = escape_text(&long);
        assert!(shown.len() <= MAX_PRINTED_BYTES + '…'.len_utf8());
        assert!(shown.ends_with('…'));
    }

    #[test]
    fn the_shipped_policy_is_the_floor_plus_declared_layers_valid() {
        let policy: Value = serde_json::from_str(DEFAULT_POLICY).unwrap();
        assert_eq!(
            policy,
            json!({"rules": [{"check": "declared-layers-valid"}]})
        );
    }

    #[test]
    fn a_bad_plan_is_rejected_naming_the_pairs_the_shared_paths_and_the_finding_codes() {
        let s = Scratch::new("bad");
        s.put(
            "bad/plan.md",
            &plan_text(
                "ready",
                &[
                    "| a | one | - | `apps/fgos/tests/questions_*.rs` | 1 | draft |",
                    "| b | two | - | apps/fgos/tests/questions_a.rs | 1 | draft |",
                    "| c | three | - | | 1 | draft |",
                    "| d | four | - | .. | 2 | draft |",
                ],
            ),
        );
        let mut request = s.request();
        request.plan = Some("bad/".into());
        let (data, exit) = run(&request).unwrap();
        assert_eq!(exit, reject_exit());
        assert_eq!(data["verdict"], "reject");
        assert_eq!(
            data["collisions"],
            json!([{"a": "a", "b": "b", "shared": ["apps/fgos/tests/questions_*.rs"]}])
        );
        let found = codes(&data);
        for code in [
            "exclusion-in-one-layer",
            "footprint-empty",
            "footprint-entry-invalid",
        ] {
            assert!(
                found.iter().any(|c| c == code),
                "{code} missing from {found:?}"
            );
        }
        assert_eq!(data["policy"]["source"], DEFAULT_POLICY_SOURCE);
        assert!(data["caveats"].as_array().unwrap().len() == 2);
    }

    #[test]
    fn a_good_plan_is_accepted_with_its_layers_and_critical_path() {
        let s = Scratch::new("good");
        s.put(
            "good/plan.md",
            &plan_text(
                "ready",
                &[
                    "| a | one | - | src/a | 1 | draft |",
                    "| b | two | - | src/b | 1 | draft |",
                    "| c | three | a, b | src/c | 2 | draft |",
                ],
            ),
        );
        let mut request = s.request();
        request.plan = Some("good".into());
        let (data, exit) = run(&request).unwrap();
        assert_eq!((exit, data["verdict"].as_str()), (0, Some("accept")));
        assert_eq!(data["graph"]["layers"][1]["nodes"], json!(["c"]));
        assert!(render(&data).contains("wave 2: c"));
        assert_eq!(data["graph"]["criticalPath"]["depth"], 2);
        assert_eq!(data["graph"]["groups"]["groupCount"], 1);
        assert!(render(&data).contains("resource-check: accept (3 units, 0 findings)"));
    }

    #[test]
    fn a_plan_with_no_phases_is_a_blocking_finding_never_accept() {
        let s = Scratch::new("empty");
        s.put("p/plan.md", &plan_text("draft", &[]));
        let mut request = s.request();
        request.plan = Some("p".into());
        let (data, exit) = run(&request).unwrap();
        assert_eq!(
            (exit, data["verdict"].as_str()),
            (reject_exit(), Some("reject"))
        );
        assert_eq!(codes(&data), ["no-phases"]);
    }

    #[test]
    fn a_ready_plan_without_a_phase_table_is_refused_by_the_reader_code() {
        let s = Scratch::new("notable");
        s.put("p/plan.md", &plan_text("ready", &[]));
        let mut request = s.request();
        request.plan = Some("p".into());
        let why = run(&request).unwrap_err();
        assert!(why.contains("phase-table-missing"), "{why}");
    }

    #[test]
    fn a_missing_file_is_refused_by_name_and_so_is_a_missing_plan() {
        let s = Scratch::new("missing");
        let mut request = s.request();
        request.units = Some("nope.json".into());
        assert!(run(&request).unwrap_err().contains("input-missing"));
        request.units = None;
        request.plan = Some("no-such-dir".into());
        assert!(run(&request).unwrap_err().contains("input-missing"));
    }

    #[test]
    fn a_symlinked_plan_root_is_refused_with_and_without_a_trailing_slash() {
        let s = Scratch::new("rootlink");
        s.put(
            "real/plan.md",
            &plan_text("ready", &["| a | one | - | src/a | 1 | draft |"]),
        );
        symlink(s.0.join("real"), s.0.join("link")).unwrap();
        for given in ["link", "link/"] {
            let mut request = s.request();
            request.plan = Some(given.into());
            assert!(
                run(&request).unwrap_err().contains("input-symlink"),
                "{given}"
            );
        }
    }

    #[test]
    fn a_symlinked_leaf_a_fifo_and_an_oversize_file_are_refused_by_name() {
        let s = Scratch::new("leaf");
        let real = s.put("real.json", r#"{"v":1,"units":[]}"#);
        symlink(&real, s.0.join("link.json")).unwrap();
        let fifo = s.0.join("fifo.json");
        assert!(std::process::Command::new("mkfifo")
            .arg(&fifo)
            .status()
            .unwrap()
            .success());
        s.put("big.json", &" ".repeat(MAX_INPUT_BYTES + 1));
        for (file, code) in [
            ("link.json", "input-symlink"),
            ("fifo.json", "input-not-regular"),
            ("big.json", "input-too-large"),
        ] {
            let mut request = s.request();
            request.units = Some(file.into());
            assert!(run(&request).unwrap_err().contains(code), "{file}");
        }
    }

    #[test]
    fn a_bare_file_name_in_the_current_directory_works() {
        let s = Scratch::new("bare");
        s.put(
            "units.json",
            r#"{"v":1,"units":[{"id":"a","claims":[{"space":"path","ref":"src/a"}]},{"id":"b","readOnly":true}]}"#,
        );
        let mut request = s.request();
        request.units = Some("units.json".into());
        let (data, exit) = run(&request).unwrap();
        assert_eq!((exit, data["verdict"].as_str()), (0, Some("accept")));
        assert_eq!(data["readOnlyNodes"], json!(["b"]));
    }

    #[test]
    fn a_missing_policy_file_is_a_refusal_and_never_falls_back_to_the_default() {
        let s = Scratch::new("policy");
        s.put(
            "units.json",
            r#"{"v":1,"units":[{"id":"a","claims":[{"space":"path","ref":"src/a"}]}]}"#,
        );
        let mut request = s.request();
        request.units = Some("units.json".into());
        request.policy = Some("absent-policy.json".into());
        assert!(run(&request).unwrap_err().contains("input-missing"));
        s.put("policy.json", r#"{"rules":[]}"#);
        request.policy = Some("policy.json".into());
        let (data, _) = run(&request).unwrap();
        assert_eq!(data["policy"]["source"], "policy.json");
        assert_eq!(data["policy"]["sha256"].as_str().unwrap().len(), 64);
    }

    #[test]
    fn a_policy_cannot_remove_the_floor() {
        let s = Scratch::new("floor");
        s.put(
            "units.json",
            r#"{"v":1,"units":[{"id":"a","claims":[{"space":"path","ref":"src"}],"layer":1},{"id":"b","claims":[{"space":"path","ref":"src/x"}],"layer":1}]}"#,
        );
        s.put("policy.json", r#"{"rules":[]}"#);
        let mut request = s.request();
        request.units = Some("units.json".into());
        request.policy = Some("policy.json".into());
        let (data, exit) = run(&request).unwrap();
        assert_eq!(exit, reject_exit());
        assert!(codes(&data).contains(&"exclusion-in-one-layer".to_owned()));
    }

    #[test]
    fn a_control_character_in_an_id_is_refused_without_quoting_it() {
        let s = Scratch::new("ctl");
        s.put(
            "units.json",
            "{\"v\":1,\"units\":[{\"id\":\"a\\u001b[2J\",\"readOnly\":true}]}",
        );
        let mut request = s.request();
        request.units = Some("units.json".into());
        let why = run(&request).unwrap_err();
        assert!(why.contains("id-control-character"), "{why}");
        assert!(!why.chars().any(char::is_control), "{why:?}");
    }

    #[test]
    fn an_unknown_claim_space_is_refused_naming_the_unit_and_the_entry() {
        let s = Scratch::new("space");
        s.put(
            "units.json",
            r#"{"v":1,"units":[{"id":"a","claims":[{"space":"pth","ref":"src/a"}]}]}"#,
        );
        let mut request = s.request();
        request.units = Some("units.json".into());
        let why = run(&request).unwrap_err();
        assert!(
            why.contains("claim-space-unknown")
                && why.contains("unit a")
                && why.contains("src/a")
                && why.contains("pth"),
            "{why}"
        );
    }

    #[test]
    fn a_hostile_entry_in_the_output_is_escaped_in_json_and_in_human_text() {
        let s = Scratch::new("hostile");
        s.put(
            "units.json",
            "{\"v\":1,\"units\":[{\"id\":\"a\",\"claims\":[{\"space\":\"path\",\"ref\":\"../\\u001b[2J\"}]}]}",
        );
        let mut request = s.request();
        request.units = Some("units.json".into());
        let (data, _) = run(&request).unwrap();
        assert!(codes(&data).contains(&"footprint-entry-invalid".to_owned()));
        for text in [data.to_string(), render(&data)] {
            assert!(
                !text.chars().any(|c| c.is_control() && c != '\n'),
                "{text:?}"
            );
            assert!(text.contains("\\u{001b}"));
        }
    }

    #[test]
    fn units_and_plan_together_or_neither_are_a_usage_error() {
        let s = Scratch::new("usage");
        let mut request = s.request();
        assert!(run(&request).unwrap_err().contains("usage"));
        request.plan = Some("a".into());
        request.units = Some("b".into());
        assert!(run(&request).unwrap_err().contains("usage"));
    }
}
