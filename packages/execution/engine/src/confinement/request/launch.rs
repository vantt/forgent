//! The launch pipeline: the one place that refuses a launch the policy cannot enforce and prepares the sandbox, then
//! publishes the launch records (the prepared invocation and the finalization descriptor) and returns the attempt's
//! command, env and sandbox prefix. The attempt envelope itself is the controller's.
//!
//! What the pipeline reads from the machine is passed in through [`LaunchHost`]: the process environment, the driver
//! registry, the falsification probe, the roots private homes live under, the clock and the claude trust store.

use std::path::{Path, PathBuf};

use serde_json::{json, Map, Value};
use sha2::{Digest, Sha256};

use super::attestation::build_confinement_attestation;
use super::delivery::{effective_backend_of, own_worktree_unavailable};
use super::error::RequestError;
use super::js::{at, coalesce, display, get, truthy};
use super::launch_context::validate_assignment_launch_context;
use super::shape::validate_confinement_request;
use crate::confinement::driver::attestation::{
    assert_store_isolated, save_attestation_record, save_plan_record, verify_store_isolation,
};
use crate::confinement::driver::bwrap::{CONFINED_MARKER_ENV, DEFAULT_SEAT_TIMEOUT_MS};
use crate::confinement::driver::registry::{
    load_machine_registry, registry_path, DriverRegistry, RegistrySnapshot, ResolvedBackend,
};
use crate::confinement::driver::{Assessment, Mismatch, Prepared};
use crate::confinement::policy::{evaluate_bypass_pairing, normalize_legacy_confinement};
use crate::transport::adapters::{
    resolve_executor_env, worker_base_env, DEFAULT_ADAPTER, DISPATCH_DEPTH_ENV,
};
use fgos_canonical_json::canonical_json;
use fgos_durable_file::{install_once_with_mode, replace_durably_with_mode};

/// The file a temporary directory carries to say whose it is. Confinement cleanup owns the name; the pipeline only
/// reads the marker to bind it into the launch records.
pub(crate) const OWNERSHIP_MARKER_FILE: &str = ".fgos-confinement-owner.json";

const EXECUTION_CONTRACT: &str = "confinement-execution.v1";

/// Persisted launch records keep only these standard shell variables of the worker env, never a value that could
/// be a credential; `envDigest`, over the full real env, is the commitment a verifier checks.
const SAFE_ENV_ALLOWLIST: [&str; 12] = [
    "PATH",
    "HOME",
    "LANG",
    "LC_ALL",
    "TERM",
    "SHELL",
    "USER",
    "LOGNAME",
    "PWD",
    "TZ",
    "NODE_ENV",
    DISPATCH_DEPTH_ENV,
];

/// What a falsification probe of a backend answered.
#[derive(Debug, Clone, PartialEq)]
pub struct ProbeVerdict {
    pub passed: bool,
    pub message: String,
    /// What the probe's cache is keyed by; recorded as evidence when the probe fails.
    pub fingerprint: Option<Value>,
    /// Anything else the probe reports (`results`, `cached`, ...); carried into the plan as it came.
    pub detail: Map<String, Value>,
}

impl ProbeVerdict {
    fn to_value(&self) -> Value {
        let mut out = self.detail.clone();
        out.insert("passed".into(), json!(self.passed));
        out.insert("message".into(), json!(self.message));
        if let Some(fingerprint) = &self.fingerprint {
            out.insert("fingerprint".into(), fingerprint.clone());
        }
        Value::Object(out)
    }
}

/// The falsification probe of a bwrap backend: the fingerprint of what it would check, the cached pass or a fresh run.
pub trait Probes: Send + Sync {
    fn verify_bwrap(
        &self,
        request: &Value,
        executable: &str,
        driver_version: &str,
        backend_config: &Value,
    ) -> ProbeVerdict;
}

/// What the pipeline needs from the machine around it.
pub struct LaunchHost<'a> {
    /// The process environment, as a snapshot.
    pub env: &'a [(String, String)],
    pub drivers: &'a DriverRegistry,
    pub probes: &'a dyn Probes,
    /// Every root private homes live under: the registry names them, the driver cannot read it.
    pub credential_scan_roots: &'a [String],
    /// The instant, as an ISO 8601 string.
    pub now_iso: &'a dyn Fn() -> String,
    /// Removes what a preparation allocated when its claims are refused afterwards.
    pub discard_prepared: &'a dyn Fn(&Prepared),
    /// The arguments that approve a project's own MCP servers for this worker: `(trustStore, cwd, repoRoot)`.
    pub claude_mcp_approval_args: &'a dyn Fn(&Value, &str, &str) -> Vec<String>,
}

impl LaunchHost<'_> {
    fn lookup(&self, name: &str) -> Option<String> {
        self.env
            .iter()
            .find(|(key, _)| key == name)
            .map(|(_, value)| value.clone())
    }
}

/// What a prepared launch hands back: the attempt's command, env and sandbox prefix, and the records published.
#[derive(Debug)]
pub struct Launch {
    pub attempt: Value,
    pub prepared_invocation: Value,
    pub prepared_invocation_digest: String,
    pub provider_capacity: Option<Value>,
    pub finalization_path: PathBuf,
    pub finalization_descriptor: Value,
    pub backend_plan: Option<Value>,
    pub prepared: Option<Prepared>,
}

// ---------------------------------------------------------------- helpers

/// `sha256:<hex>` of the canonical JSON of `value` (a string is hashed as it is).
fn digest(value: &Value) -> String {
    let text = match value {
        Value::String(text) => text.clone(),
        other => canonical_json(other).expect("JSON values are finite"),
    };
    digest_text(&text)
}

fn digest_text(text: &str) -> String {
    let hex: String = Sha256::digest(text.as_bytes())
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect();
    format!("sha256:{hex}")
}

fn pretty(record: &Value) -> Vec<u8> {
    let mut text = serde_json::to_string_pretty(record).expect("a JSON value serialises");
    text.push('\n');
    text.into_bytes()
}

fn io_error(what: &str, path: &Path, err: impl std::fmt::Display) -> RequestError {
    RequestError::plain(format!("cannot write {what} \"{}\": {err}", path.display()))
}

/// Writes `record` once: a record already there is the one published, and stays.
fn publish_immutable_proof(path: &Path, record: &Value) -> Result<(), RequestError> {
    let (dir, name) = split(path);
    std::fs::create_dir_all(dir).map_err(|e| io_error("record", dir, e))?;
    install_once_with_mode(dir, name, &pretty(record), 0o644)
        .map(|_| ())
        .map_err(|e| io_error("record", path, e))
}

/// Writes `record` over whatever was there, durably.
fn publish_mutable_projection(path: &Path, record: &Value) -> Result<(), RequestError> {
    let (dir, name) = split(path);
    std::fs::create_dir_all(dir).map_err(|e| io_error("projection", dir, e))?;
    replace_durably_with_mode(dir, name, &pretty(record), 0o644)
        .map(|_| ())
        .map_err(|e| io_error("projection", path, e))
}

fn split(path: &Path) -> (&Path, &str) {
    (
        path.parent().unwrap_or(Path::new(".")),
        path.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or_default(),
    )
}

/// `String(n)` for a JavaScript number.
fn js_number(n: f64) -> String {
    if n.fract() == 0.0 && n.abs() < 1e21 {
        format!("{}", n as i64)
    } else {
        n.to_string()
    }
}

fn text_of<'a>(value: &'a Value, keys: &[&str]) -> Option<&'a str> {
    at(value, keys).and_then(Value::as_str)
}

fn mismatch_value(m: &Mismatch) -> Value {
    if m.code.is_empty() {
        json!({ "detail": m.detail })
    } else {
        json!({ "code": m.code, "detail": m.detail })
    }
}

/// An object of the fields that are present: a field the source lacks is left out, as `JSON.stringify` leaves out
/// `undefined`.
fn defined<'a>(fields: impl IntoIterator<Item = (&'static str, Option<&'a Value>)>) -> Value {
    Value::Object(
        fields
            .into_iter()
            .filter_map(|(key, value)| value.map(|v| (key.to_string(), v.clone())))
            .collect(),
    )
}

fn map_of(value: &Value) -> Map<String, Value> {
    value.as_object().cloned().unwrap_or_default()
}

// ---------------------------------------------------------------- refusals

/// What a refusal adds beyond the attestation it saves.
#[derive(Default)]
struct Refusal {
    backend_plan: Option<Value>,
    mismatch: Option<Value>,
    evidence: Option<Value>,
    /// The error fields between its status and its attestation; by default the dispatch, capability and requirement.
    details: Option<Map<String, Value>>,
}

/// Puts what the backend plan decided into the attestation.
fn apply_backend_plan(attestation: &mut Value, plan: Option<&Value>) {
    let Some(plan) = plan else { return };
    for key in ["coverage", "resources", "readiness", "grants", "backend"] {
        attestation[key] = plan.get(key).cloned().unwrap_or(Value::Null);
    }
    // What a blind dispatch could not read, as resolved for this dispatch.
    let hidden: Vec<Value> = get(plan, "resources")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter(|r| get(r, "resource").and_then(Value::as_str) == Some("hidden-root"))
        .map(|r| get(r, "hostTarget").cloned().unwrap_or(Value::Null))
        .collect();
    if !hidden.is_empty() {
        attestation["hiddenRoots"] = Value::Array(hidden);
    }
    if let Some(extra) = get(plan, "mismatches").and_then(Value::as_array) {
        let existing: Vec<Value> = get(attestation, "mismatches")
            .and_then(Value::as_array)
            .cloned()
            .unwrap_or_default();
        let code_of = |m: &Value| get(m, "code").cloned();
        let known: Vec<Option<Value>> = existing.iter().map(code_of).collect();
        let mut merged = existing;
        merged.extend(
            extra
                .iter()
                .filter(|m| !known.contains(&code_of(m)))
                .cloned(),
        );
        attestation["mismatches"] = Value::Array(merged);
    }
}

fn save_attestation(
    host: &LaunchHost,
    request: &Value,
    attestation: &Value,
) -> Result<(), RequestError> {
    let context = get(request, "context").unwrap_or(&Value::Null);
    save_attestation_record(attestation, context, &|k| host.lookup(k))?;
    Ok(())
}

/// Saves the refused attestation (with the backend plan, a mismatch or a piece of evidence when given) and builds the
/// refusal. A failed save is its own error.
fn refuse_launch(
    host: &LaunchHost,
    request: &Value,
    code: &str,
    message: String,
    refusal: Refusal,
) -> RequestError {
    let mut attestation = build_confinement_attestation(request, "refused", Some("refused"), None);
    apply_backend_plan(&mut attestation, refusal.backend_plan.as_ref());
    if let Some(mismatch) = refusal.mismatch {
        attestation["mismatches"]
            .as_array_mut()
            .expect("mismatches is a list")
            .push(mismatch);
    }
    if let Some(evidence) = refusal.evidence {
        attestation["evidence"]
            .as_array_mut()
            .expect("evidence is a list")
            .push(evidence);
    }
    if let Err(err) = save_attestation(host, request, &attestation) {
        return err;
    }
    let mut data = Map::new();
    data.insert("contract".into(), json!(EXECUTION_CONTRACT));
    data.insert("status".into(), json!("refused"));
    data.extend(refusal.details.unwrap_or_else(|| default_details(request)));
    data.insert("attestation".into(), attestation);
    RequestError::dispatch(code, message, data)
}

fn default_details(request: &Value) -> Map<String, Value> {
    let mut details = Map::new();
    for key in ["dispatchId", "capability", "requirement"] {
        if let Some(value) = get(request, key) {
            details.insert(key.to_string(), value.clone());
        }
    }
    details
}

// ---------------------------------------------------------------- assessment

fn required_coverage_failures(
    policy: Option<&Value>,
    coverage: &Map<String, Value>,
) -> Vec<(String, Value)> {
    let mut failures = Vec::new();
    let status = |key: &str| coverage.get(key).cloned();
    if let Some(controls) = policy
        .and_then(|p| get(p, "controls"))
        .and_then(Value::as_object)
    {
        for control in controls.keys() {
            let key = format!("control:{control}");
            if status(&key).as_ref().and_then(Value::as_str) != Some("satisfied") {
                failures.push((
                    key.clone(),
                    status(&key).unwrap_or_else(|| json!("unknown")),
                ));
            }
        }
    }
    for grant in policy
        .and_then(|p| get(p, "grants"))
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
    {
        // A resource grant is optional by default. In particular, built-in executor-credentials remains honestly
        // unverified when absent, but is deliberately not allowed to make an otherwise verified dispatch refuse.
        if get(grant, "optional") == Some(&Value::Bool(false)) {
            let key = format!("grant:{}", display(get(grant, "resource")));
            if status(&key).as_ref().and_then(Value::as_str) != Some("satisfied") {
                failures.push((
                    key.clone(),
                    status(&key).unwrap_or_else(|| json!("unknown")),
                ));
            }
        }
    }
    failures
}

/// The prepared claims are exactly the assessed plan's coverage: no key missing, none different, none extra.
fn claims_match_coverage(claims: &Map<String, Value>, coverage: &Map<String, Value>) -> bool {
    coverage
        .iter()
        .all(|(key, expected)| claims.get(key) == Some(expected))
        && claims.keys().all(|key| coverage.contains_key(key))
}

fn verify_required_probe(
    host: &LaunchHost,
    request: &Value,
    backend: &ResolvedBackend,
    driver_version: &str,
) -> ProbeVerdict {
    if backend.kind != "bwrap" {
        return ProbeVerdict {
            passed: false,
            message: format!(
                "no falsification probe profile for backend type \"{}\"",
                backend.kind
            ),
            fingerprint: None,
            detail: Map::new(),
        };
    }
    let executable = get(&backend.config, "executable")
        .and_then(Value::as_str)
        .filter(|e| !e.is_empty())
        .unwrap_or("bwrap");
    host.probes
        .verify_bwrap(request, executable, driver_version, &backend.config)
}

/// What the confinement pipeline decided for one launch.
struct Preparation {
    backend: Option<ResolvedBackend>,
    driver_version: Option<String>,
    backend_plan: Option<Value>,
    prepared: Option<Prepared>,
}

fn backend_instance_value(backend: &ResolvedBackend) -> Value {
    json!({ "id": backend.id, "type": backend.kind, "config": backend.config })
}

/// An assessment as the plan records it: coverage, resources, readiness and the mismatches as JSON.
struct Assessed {
    coverage: Map<String, Value>,
    resources: Vec<Value>,
    readiness: Map<String, Value>,
    mismatches: Vec<Value>,
}

fn assessed(a: &Assessment) -> Assessed {
    Assessed {
        coverage: a.coverage.clone(),
        resources: a.resources.clone(),
        readiness: a.readiness.clone(),
        mismatches: a.mismatches.iter().map(mismatch_value).collect(),
    }
}

/// Confinement assessment and preparation: refuses a launch the policy cannot enforce and prepares the sandbox.
fn assess_and_prepare(host: &LaunchHost, request: &Value) -> Result<Preparation, RequestError> {
    let req_mode = text_of(request, &["requirement", "mode"]).unwrap_or_default();
    if req_mode == "preferred" {
        return Err(refuse_launch(
            host,
            request,
            "confinement-mode-unsupported",
            "preferred confinement mode is disabled / unsupported in this phase; refusing dispatch cleanly before spawn.".into(),
            Refusal::default(),
        ));
    }

    // Pre-adapter bypass pairing checks.
    let invocation_confinement =
        at(request, &["invocation", "confinement"]).filter(|c| truthy(Some(c)));
    let legacy = invocation_confinement.and_then(normalize_legacy_confinement);
    let declares = |control: &str, value: &str, flag: &str| {
        legacy
            .as_ref()
            .and_then(|l| at(l, &["controls", control]))
            .and_then(Value::as_str)
            == Some(value)
            || invocation_confinement.is_some_and(|c| truthy(get(c, flag)))
            || invocation_confinement
                .and_then(|c| at(c, &["controls", control]))
                .and_then(Value::as_str)
                == Some(value)
    };
    let has_own_worktree = declares("workspace", "own", "ownWorktree");
    let pairing = evaluate_bypass_pairing(
        text_of(request, &["invocation", "permissionMode"]) == Some("bypass"),
        has_own_worktree,
        declares("home", "private", "privateHome"),
        declares("session", "isolated", "isolatedSession"),
    );
    let work_label = display(coalesce(
        at(request, &["context", "workId"]),
        get(request, "executorId"),
    ));
    let detail = |reason: &str, extra: &[(&str, Option<&Value>)]| {
        let mut data = Map::new();
        data.insert("reason".into(), json!(reason));
        for key in ["dispatchId", "executorId"] {
            if let Some(v) = get(request, key) {
                data.insert(key.to_string(), v.clone());
            }
        }
        for (key, value) in extra {
            if let Some(v) = value {
                data.insert(key.to_string(), (*v).clone());
            }
        }
        data
    };
    if !pairing.satisfied {
        return Err(refuse_launch(
            host,
            request,
            "invalid-config",
            format!(
                "executor for work \"{work_label}\" refused: permissionMode \"bypass\" requires full confinement (missing: {}).",
                pairing.missing.join(", ")
            ),
            Refusal {
                details: Some(detail("bypass-confinement-incomplete", &[("confinement", invocation_confinement)])),
                ..Refusal::default()
            },
        ));
    }
    if own_worktree_unavailable(request, has_own_worktree)? {
        let cwd = at(request, &["context", "cwd"]);
        let resolved = cwd
            .and_then(Value::as_str)
            .map(resolve_path)
            .unwrap_or_default();
        return Err(refuse_launch(
            host,
            request,
            "invalid-config",
            format!(
                "executor for work \"{work_label}\" refused: confinement declares ownWorktree, but this dispatch runs in the repo root itself ({resolved}) rather than a worktree of its own."
            ),
            Refusal {
                details: Some(detail(
                    "own-worktree-unavailable",
                    &[
                        ("cwd", cwd),
                        ("repoRoot", at(request, &["context", "repoRoot"])),
                        ("confinement", invocation_confinement),
                    ],
                )),
                ..Refusal::default()
            },
        ));
    }

    let backend_id = effective_backend_of(request).filter(|b| truthy(Some(b)));
    if req_mode != "unconfined" {
        if let Some(id) = backend_id {
            return prepare_backend(host, request, &id);
        }
    }

    let mut backend_plan = None;
    if truthy(get(request, "assignmentLaunchContext")) {
        // An unconfined assignment launch needs a plan record and a prepared attestation.
        let plan = json!({
            "contract": "confinement-plan.v1",
            "dispatchId": get(request, "dispatchId"),
            "decision": "execute",
            "requested": get(request, "requirement"),
            "coverage": {
                "control:hostWrite": "unverified",
                "control:hostRead": "satisfied",
                "control:networkEgress": "satisfied",
            },
            "resources": [],
            "readiness": {},
            "grants": [],
            "backend": { "id": "none", "type": "none", "version": "none", "configDigest": null },
            "mismatches": [],
        });
        let context = get(request, "context").unwrap_or(&Value::Null);
        save_plan_record(&plan, context, &|k| host.lookup(k))?;
        let mut prepared =
            build_confinement_attestation(request, "prepared", Some("unconfined"), None);
        apply_backend_plan(&mut prepared, Some(&plan));
        save_attestation(host, request, &prepared)?;
        backend_plan = Some(plan);
    }
    Ok(Preparation {
        backend: None,
        driver_version: None,
        backend_plan,
        prepared: None,
    })
}

/// `path.resolve(p)`: absolute and normalised, without touching the file system.
fn resolve_path(p: &str) -> String {
    use std::path::Component;
    let joined = if Path::new(p).is_absolute() {
        PathBuf::from(p)
    } else {
        std::env::current_dir().unwrap_or_default().join(p)
    };
    let mut out = PathBuf::new();
    for part in joined.components() {
        match part {
            Component::ParentDir => {
                out.pop();
            }
            Component::CurDir => {}
            other => out.push(other.as_os_str()),
        }
    }
    out.to_string_lossy().into_owned()
}

/// Resolves the backend, then assesses, probes and prepares the confined launch, refusing at the first step that fails.
fn prepare_backend(
    host: &LaunchHost,
    request: &Value,
    backend_id: &Value,
) -> Result<Preparation, RequestError> {
    let registry_doc = load_machine_registry(&registry_path(&|k| host.lookup(k))?)?;
    let id_text = display(Some(backend_id));
    let raw_instance = backend_id
        .as_str()
        .and_then(|id| at(&registry_doc, &["confinementBackends", id]));
    if raw_instance
        .is_some_and(|raw| truthy(Some(raw)) && get(raw, "enabled") == Some(&Value::Bool(false)))
    {
        return Err(refuse_launch(
            host,
            request,
            "confinement-backend-disabled",
            format!("confinement backend instance \"{id_text}\" is disabled in machine registry."),
            Refusal {
                mismatch: Some(json!({
                    "code": "confinement-backend-missing",
                    "detail": format!("confinement backend \"{id_text}\" is not configured or disabled."),
                })),
                ..Refusal::default()
            },
        ));
    }
    let backend = RegistrySnapshot::new(&registry_doc)?.resolve(backend_id);
    let Some(backend) = backend else {
        return Err(refuse_launch(
            host,
            request,
            "confinement-backend-missing",
            format!("confinement backend instance \"{id_text}\" not found in machine registry."),
            Refusal {
                mismatch: Some(json!({
                    "code": "confinement-backend-missing",
                    "detail": format!("confinement backend \"{id_text}\" could not be resolved from snapshot."),
                })),
                ..Refusal::default()
            },
        ));
    };

    // The driver registry answers with a registered driver or refuses by name.
    let driver = match host.drivers.get(&json!(backend.kind)) {
        Ok(driver) => driver,
        Err(err) => {
            let mut attestation =
                build_confinement_attestation(request, "refused", Some("refused"), None);
            attestation["mismatches"]
                .as_array_mut()
                .expect("mismatches is a list")
                .push(json!({ "code": "confinement-backend-missing", "detail": err.message }));
            // Throws the typed refusal even when saving its attestation fails; the save error is dropped.
            let _ = save_attestation(host, request, &attestation);
            let mut data = Map::new();
            data.insert("contract".into(), json!(EXECUTION_CONTRACT));
            data.insert("status".into(), json!("refused"));
            data.extend(default_details(request));
            data.insert("attestation".into(), attestation);
            return Err(RequestError::dispatch(
                "confinement-backend-missing",
                err.message,
                data,
            ));
        }
    };
    let instance = backend_instance_value(&backend);

    // Every root private homes live under is masked: the registry names them, the driver cannot read it.
    let mut assessed_request = request.clone();
    assessed_request["context"]["confinementRoots"] = json!(host.credential_scan_roots);
    let assessment = driver.assess(&assessed_request, &instance)?;
    let Assessed {
        mut coverage,
        resources,
        readiness,
        mut mismatches,
    } = assessed(&assessment);
    let context = get(request, "context").unwrap_or(&Value::Null);
    let isolation = (|| -> Result<(), crate::confinement::driver::DriverError> {
        assert_store_isolated(context, &resources, &|k| host.lookup(k))?;
        if truthy(get(request, "assignmentLaunchContext")) {
            if let Some(run_dir) =
                text_of(request, &["context", "runDir"]).filter(|d| !d.is_empty())
            {
                for sub in ["protected", "controller"] {
                    verify_store_isolation(
                        &Path::new(run_dir).join(sub).to_string_lossy(),
                        &resources,
                    )?;
                }
            }
        }
        Ok(())
    })();
    if let Err(err) = isolation {
        mismatches.push(json!({ "code": "confinement-grant-invalid", "detail": err.message }));
        coverage.insert("control:hostWrite".into(), json!("unsatisfied"));
    }

    let policy = at(request, &["requirement", "policy"]);
    for (key, found) in required_coverage_failures(policy, &coverage) {
        mismatches.push(json!({
            "code": "confinement-coverage-unverified",
            "detail": format!("{key} has {} coverage; required confinement needs satisfied coverage.", display(Some(&found))),
        }));
    }

    let grants: Vec<Value> = policy
        .and_then(|p| get(p, "grants"))
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|grant| {
            let resource = get(grant, "resource");
            let matched = resources.iter().find(|r| get(r, "resource") == resource);
            let target = matched
                .and_then(|r| at(r, &["executionTarget", "path"]))
                .filter(|p| truthy(Some(p)))
                .or(resource)
                .cloned()
                .unwrap_or(Value::Null);
            json!({ "resource": resource, "access": get(grant, "access"), "resolvedTarget": target })
        })
        .collect();
    let config_text = if truthy(Some(&backend.config)) {
        backend.config.to_string()
    } else {
        "{}".into()
    };
    let mut plan = json!({
        "contract": "confinement-plan.v1",
        "dispatchId": get(request, "dispatchId"),
        "decision": if mismatches.is_empty() { "execute" } else { "refuse" },
        "requested": get(request, "requirement"),
        "coverage": coverage,
        "resources": resources,
        "readiness": readiness,
        "grants": grants,
        "backend": {
            "id": backend.id,
            "type": backend.kind,
            "version": driver.version(),
            "configDigest": digest_text(&config_text).trim_start_matches("sha256:"),
        },
        "mismatches": mismatches,
    });
    save_plan_record(&plan, context, &|k| host.lookup(k))?;

    if !mismatches.is_empty() {
        let code = mismatches
            .first()
            .and_then(|m| get(m, "code"))
            .and_then(Value::as_str)
            .filter(|c| !c.is_empty())
            .unwrap_or("confinement-unsupported")
            .to_string();
        let details = mismatches
            .iter()
            .map(|m| display(get(m, "detail")))
            .collect::<Vec<_>>()
            .join("; ");
        return Err(refuse_launch(
            host,
            request,
            &code,
            format!(
                "required confinement refused for capability \"{}\": {details}",
                display(get(request, "capability"))
            ),
            Refusal {
                backend_plan: Some(plan),
                ..Refusal::default()
            },
        ));
    }

    let probe = verify_required_probe(host, request, &backend, driver.version());
    if !probe.passed {
        let evidence = {
            let mut item = Map::new();
            item.insert("kind".into(), json!("falsification-probe"));
            item.insert("ref".into(), json!(probe.message));
            item.insert("freshness".into(), json!("stale"));
            if let Some(fp) = &probe.fingerprint {
                item.insert("fingerprint".into(), fp.clone());
            }
            Value::Object(item)
        };
        return Err(refuse_launch(
            host,
            request,
            "confinement-probe-failed",
            format!("required confinement refused: {}", probe.message),
            Refusal {
                backend_plan: Some(plan),
                evidence: Some(evidence),
                ..Refusal::default()
            },
        ));
    }
    plan["probe"] = probe.to_value();

    let prepared = driver.prepare(&plan, request, &instance)?;
    let plan_coverage = map_of(&plan["coverage"]);
    if !claims_match_coverage(&prepared.claims, &plan_coverage) {
        (host.discard_prepared)(&prepared);
        return Err(refuse_launch(
            host,
            request,
            "confinement-plan-mismatch",
            format!(
                "prepared confinement claims mismatch the assessed plan coverage for capability \"{}\".",
                display(get(request, "capability"))
            ),
            Refusal {
                backend_plan: Some(plan),
                mismatch: Some(json!({
                    "code": "confinement-plan-mismatch",
                    "detail": "prepared confinement claims mismatch the assessed plan coverage.",
                })),
                ..Refusal::default()
            },
        ));
    }

    let claims = Value::Object(prepared.claims.clone());
    let mut attestation =
        build_confinement_attestation(request, "prepared", Some("unknown"), Some(&claims));
    apply_backend_plan(&mut attestation, Some(&plan));
    save_attestation(host, request, &attestation)?;
    Ok(Preparation {
        backend: Some(backend),
        driver_version: Some(driver.version().to_string()),
        backend_plan: Some(plan),
        prepared: Some(prepared),
    })
}

// ---------------------------------------------------------------- the launch

/// The launch context a supervised attempt needs, checked before anything is prepared: its command id and run directory.
fn require_launch_context(request: &Value) -> Result<(Value, PathBuf, String), RequestError> {
    let invalid = |message: &str| {
        let mut data = Map::new();
        data.insert("contract".into(), json!(EXECUTION_CONTRACT));
        data.insert("status".into(), json!("refused"));
        if let Some(id) = get(request, "dispatchId") {
            data.insert("dispatchId".into(), id.clone());
        }
        RequestError::dispatch("confinement-launch-context-invalid", message, data)
    };
    let Some(launch) = get(request, "assignmentLaunchContext").filter(|l| truthy(Some(l))) else {
        return Err(invalid(
            "prepareConfinementForLaunch requires assignmentLaunchContext.",
        ));
    };
    validate_assignment_launch_context(launch, get(request, "context"))?;
    let Some(run_dir) = text_of(request, &["context", "runDir"]).filter(|d| !d.is_empty()) else {
        return Err(invalid(
            "prepareConfinementForLaunch requires context.runDir.",
        ));
    };
    // Everything published under protected/ is host-private: 0700 at first creation, and the publish helpers' later
    // recursive mkdir never widens it.
    make_private_dir(&Path::new(run_dir).join("protected"));
    let Some(command_id) = at(launch, &["command", "launchCommandId"])
        .filter(|id| truthy(Some(id)))
        .and_then(Value::as_str)
    else {
        return Err(invalid("prepareConfinementForLaunch requires launchCommandId in assignmentLaunchContext.command."));
    };
    // Every launch is an attempt of the run supervisor: the attempt envelope its controller writes is the one launch
    // record, so a request without one is refused before anything is prepared.
    if !matches!(get(request, "attemptId"), Some(Value::String(s)) if !s.is_empty()) {
        let mut data = Map::new();
        data.insert("code".into(), json!("attempt-required"));
        if let Some(id) = at(launch, &["run", "runId"]) {
            data.insert("runId".into(), id.clone());
        }
        data.insert("launchCommandId".into(), json!(command_id));
        return Err(RequestError::dispatch(
            "attempt-required",
            "a launch needs a supervised attempt (the request carries no attemptId)",
            data,
        ));
    }
    Ok((
        launch.clone(),
        PathBuf::from(run_dir),
        command_id.to_string(),
    ))
}

fn make_private_dir(path: &Path) {
    #[cfg(unix)]
    {
        use std::os::unix::fs::DirBuilderExt;
        let _ = std::fs::DirBuilder::new()
            .recursive(true)
            .mode(0o700)
            .create(path);
    }
    #[cfg(not(unix))]
    {
        let _ = std::fs::create_dir_all(path);
    }
}

/// Per planned resource: its binding for the prepared invocation and, for a temporary directory, its finalization
/// entry; both carry the digest of the ownership marker found in it.
fn bind_plan_resources(
    plan: Option<&Value>,
    prepared: Option<&Prepared>,
    session_dir: Option<&Value>,
) -> (Vec<Value>, Vec<Value>) {
    let (mut bindings, mut finalization) = (Vec::new(), Vec::new());
    for res in plan
        .and_then(|p| get(p, "resources"))
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
    {
        let host_target = get(res, "hostTarget").filter(|t| truthy(Some(t)));
        let mut marker_digest = Value::Null;
        if get(res, "allocation").and_then(Value::as_str) == Some("temporary") {
            if let Some(target) = host_target.and_then(Value::as_str) {
                let marker = Path::new(target).join(OWNERSHIP_MARKER_FILE);
                if let Ok(raw) = std::fs::read_to_string(&marker) {
                    marker_digest = match serde_json::from_str::<Value>(&raw) {
                        Ok(parsed) => json!(digest(&parsed)),
                        Err(_) => json!(digest_text(&raw)),
                    };
                }
                let is_home = get(res, "resource").and_then(Value::as_str) == Some("private-home");
                let mut entry = json!({
                    "kind": "temporary-directory",
                    "resourceId": get(res, "resource"),
                    "planEntryDigest": digest(res),
                    "ownershipMarkerDigest": marker_digest,
                    "pathRef": target,
                });
                // Where finalize-home writes a login renewed in the private home back to. Recorded only here, in host
                // state outside every grant: the home and its marker are the agent's to rewrite.
                if let Some(back) = prepared
                    .and_then(|p| p.credential_write_back.as_ref())
                    .filter(|_| is_home)
                {
                    entry["credentialWriteBack"] = back.clone();
                }
                // The folder of the home the CLI writes its session to; finalize-home keeps it before the home goes.
                if let Some(dir) = session_dir.filter(|d| is_home && truthy(Some(d))) {
                    entry["sessionDir"] = dir.clone();
                }
                finalization.push(entry);
            }
        }
        let resource = get(res, "resource");
        let host_target_digest = match host_target {
            Some(t) => digest(t),
            None => digest(resource.unwrap_or(&Value::Null)),
        };
        let execution_target = at(res, &["executionTarget", "path"])
            .filter(|p| truthy(Some(p)))
            .or(resource)
            .cloned()
            .unwrap_or(Value::Null);
        bindings.push(json!({
            "resource": resource,
            "access": get(res, "access"),
            "hostTargetDigest": host_target_digest,
            "executionTarget": execution_target,
            "ownershipMarkerDigest": marker_digest,
        }));
    }
    (bindings, finalization)
}

/// Publishes the prepared invocation once per launch command and returns its digest. The record on disk, and so the
/// digest, carries the redacted env, never the real one. A resume re-enters with a fresh `publishedAt`: it keeps the
/// digest already published, which the attempt envelope and the finalization descriptor were bound to, and never
/// overwrites the record.
fn publish_prepared_invocation(
    path: &Path,
    record: &Value,
    redacted_env: &Map<String, Value>,
) -> Result<String, RequestError> {
    let mut on_disk = record.clone();
    on_disk["workerInvocation"]["env"] = Value::Object(redacted_env.clone());
    let mut fresh = digest(&on_disk);
    on_disk["digest"] = json!(fresh);
    if path.exists() {
        // A corrupt record keeps the fresh digest; its mismatch surfaces where the record is verified.
        if let Some(kept) = std::fs::read_to_string(path)
            .ok()
            .and_then(|raw| serde_json::from_str::<Value>(&raw).ok())
            .and_then(|existing| {
                get(&existing, "digest")
                    .and_then(Value::as_str)
                    .filter(|d| !d.is_empty())
                    .map(String::from)
            })
        {
            fresh = kept;
        }
    } else {
        publish_immutable_proof(path, &on_disk)?;
    }
    Ok(fresh)
}

/// Prepares confinement for the launch of one supervised attempt.
///
/// Persists the prepared attestation, publishes `authority-prepared-invocation.v1` and the
/// `confinement-finalization.v1` descriptor, and returns the attempt's command, env and sandbox prefix; the attempt
/// envelope itself is the controller's.
pub fn prepare_confinement_for_launch(
    request: &Value,
    host: &LaunchHost,
) -> Result<Launch, RequestError> {
    let mut request = request.clone();
    validate_confinement_request(&mut request)?;
    let request = &request;
    let (launch, run_dir, command_id) = require_launch_context(request)?;

    let invocation = get(request, "invocation").unwrap_or(&Value::Null);
    let adapter = get(invocation, "adapter")
        .and_then(Value::as_str)
        .filter(|a| !a.is_empty())
        .unwrap_or(DEFAULT_ADAPTER);
    let prep = assess_and_prepare(host, request)?;
    let (plan, prepared) = (prep.backend_plan.as_ref(), prep.prepared.as_ref());

    // The prepared worker invocation.
    let source = prepared
        .map(|p| &p.invocation)
        .filter(|i| truthy(Some(i)))
        .unwrap_or(invocation);
    // The attempt runs the agent under the gate: the sandbox prefix travels in the envelope and the worker is the
    // agent argv itself, never the sandbox wrapper command line.
    let agent_argv: Vec<Value> = match prepared.and_then(|p| p.agent_argv.as_ref()) {
        Some(argv) => argv.iter().map(|a| json!(a)).collect(),
        None => std::iter::once(get(invocation, "command").cloned().unwrap_or(Value::Null))
            .chain(
                get(invocation, "args")
                    .and_then(Value::as_array)
                    .into_iter()
                    .flatten()
                    .cloned(),
            )
            .collect(),
    };
    let worker_command = agent_argv.first().cloned().unwrap_or(Value::Null);
    let trust = at(source, &["interactiveMode", "trustStore"]);
    // A prepared record that already exists is the invocation this launch was published with: its args do not change
    // with files that can change between attempts (.mcp.json, the trust store).
    let prepared_path = run_dir
        .join("protected")
        .join("prepared-invocation")
        .join(format!("{command_id}.json"));
    let published_args = std::fs::read_to_string(&prepared_path)
        .ok()
        .and_then(|raw| serde_json::from_str::<Value>(&raw).ok())
        .and_then(|existing| {
            at(&existing, &["workerInvocation", "args"])
                .filter(|a| a.is_array())
                .cloned()
        });
    let worker_args: Vec<Value> = match published_args {
        Some(Value::Array(args)) => args,
        _ => {
            let mut args: Vec<Value> = agent_argv.iter().skip(1).cloned().collect();
            // The target project's own MCP servers are approved for this worker only, so the claude dialog that asks
            // a person cannot stop an unattended seat.
            if let Some(trust) =
                trust.filter(|t| get(t, "kind").and_then(Value::as_str) == Some("claude-json"))
            {
                let cwd = text_of(request, &["context", "cwd"]).unwrap_or_default();
                let repo_root = text_of(request, &["context", "repoRoot"]).unwrap_or(cwd);
                args.extend(
                    (host.claude_mcp_approval_args)(trust, cwd, repo_root)
                        .into_iter()
                        .map(Value::String),
                );
            }
            args
        }
    };
    let worker_cwd = get(get(request, "context").unwrap_or(&Value::Null), "cwd")
        .cloned()
        .unwrap_or(Value::Null);
    let depth =
        crate::transport::adapters::dispatch_depth_of(host.lookup(DISPATCH_DEPTH_ENV).as_deref());
    let lookup = |name: &str| host.lookup(name);
    let executor_env = resolve_executor_env(get(source, "env").unwrap_or(&Value::Null), &lookup);
    // The agent runs under the driver's sandbox exactly when the prepared confinement has a prefix: the marker follows
    // that result, never a caller's flag, so every confined agent (worker or head) sees the same fact.
    let confined = prepared.is_some_and(|p| p.bwrap_prefix.is_some());
    let state_root = fgos_holder_lock::state_root::state_root_from(lookup).0;
    let mut worker_env = Map::new();
    for (name, value) in worker_base_env(
        host.env.iter().map(|(k, v)| (k.as_str(), v.as_str())),
        Some(&state_root.to_string_lossy()),
    ) {
        worker_env.insert(name, Value::String(value));
    }
    worker_env.extend(executor_env);
    worker_env.insert(DISPATCH_DEPTH_ENV.into(), json!(js_number(depth + 1.0)));
    if confined {
        worker_env.insert(CONFINED_MARKER_ENV.into(), json!("1"));
    }
    let worker_env_value = Value::Object(worker_env.clone());

    let worker_command_digest = digest(&json!({ "command": worker_command, "args": worker_args }));
    let env_digest = digest(&worker_env_value);
    let plan_digest = digest(plan.unwrap_or(&Value::Null));
    // The real env (with secrets) is never persisted here: the attempt keeps it in the side file its controller
    // writes next to the envelope.
    let redacted_env: Map<String, Value> = SAFE_ENV_ALLOWLIST
        .iter()
        .filter_map(|key| worker_env.get(*key).map(|v| (key.to_string(), v.clone())))
        .collect();
    let (bindings, finalization_resources) = bind_plan_resources(
        plan,
        prepared,
        at(request, &["invocation", "credentialStore", "sessionDir"]),
    );

    let context = get(request, "context").unwrap_or(&Value::Null);
    let policy = at(request, &["requirement", "policy"]).filter(|p| truthy(Some(p)));
    let backend_version = prep
        .driver_version
        .clone()
        .unwrap_or_else(|| "local-bwrap-v1".into());
    let timeout = get(context, "timeoutMs")
        .filter(|t| truthy(Some(t)))
        .cloned()
        .unwrap_or(json!(DEFAULT_SEAT_TIMEOUT_MS));
    let max_buffer = get(context, "maxBuffer")
        .filter(|t| truthy(Some(t)))
        .cloned()
        .unwrap_or(json!(10_485_760));
    let idle = get(context, "idleTimeoutMs")
        .filter(|t| truthy(Some(t)))
        .cloned()
        .unwrap_or(Value::Null);
    let mut record = json!({
        "contract": "authority-prepared-invocation.v1",
        "dispatchId": get(request, "dispatchId"),
        "adapter": adapter,
        "run": defined([
            ("runId", at(&launch, &["run", "runId"])),
            ("assignmentId", at(&launch, &["run", "assignmentId"])),
            ("attempt", at(&launch, &["run", "attempt"])),
            ("launchCommandId", Some(&json!(command_id))),
            ("controlEpoch", at(&launch, &["command", "controlEpoch"])),
            ("controlTokenDigest", at(&launch, &["command", "controlTokenDigest"])),
            ("dispatchPlanDigest", at(&launch, &["run", "dispatchPlanDigest"])),
            ("evaluatorBaselineDigest", at(&launch, &["run", "evaluatorBaselineDigest"])),
        ]),
        "requirement": {
            "mode": at(request, &["requirement", "mode"]),
            "policyId": coalesce(at(request, &["requirement", "policyId"]), None).cloned().unwrap_or(Value::Null),
            "policyDigest": policy.map_or(Value::Null, |p| json!(digest(p))),
        },
        "backend": match &prep.backend {
            Some(b) => json!({
                "id": b.id, "type": b.kind, "version": backend_version,
                "configDigest": digest(&if truthy(Some(&b.config)) { b.config.clone() } else { json!({}) }),
            }),
            None => json!({ "id": "none", "type": "none", "version": "none", "configDigest": null }),
        },
        "workerInvocation": {
            "command": worker_command,
            "args": worker_args,
            "cwd": worker_cwd,
            // The real env stays in memory only; the record on disk carries the redacted env.
            "env": worker_env_value,
            "envDigest": env_digest,
            "workerCommandDigest": worker_command_digest,
            "stdin": "ignore",
            "encoding": "utf8",
            "timeoutMs": timeout,
            "idleTimeoutMs": idle,
            "maxBuffer": max_buffer,
        },
        "resourceBindings": bindings,
        "proof": {
            "confinementPlanDigest": plan_digest,
            "preparedAttestationDigest": plan_digest,
            "probeFingerprintDigest": plan
                .and_then(|p| at(p, &["probe", "fingerprint"]))
                .filter(|f| truthy(Some(f)))
                .map_or(Value::Null, |f| json!(digest(f))),
        },
        "publishedAt": (host.now_iso)(),
    });
    if let Some(capacity) = prepared
        .and_then(|p| p.provider_capacity.as_ref())
        .filter(|c| truthy(Some(c)))
    {
        record["providerCapacity"] = capacity.clone();
    }
    let prepared_digest = publish_prepared_invocation(&prepared_path, &record, &redacted_env)?;
    record["digest"] = json!(prepared_digest);

    let run_id = at(&launch, &["run", "runId"])
        .cloned()
        .unwrap_or(Value::Null);
    let backend_label = match (&prep.backend, &prep.driver_version) {
        (Some(b), version) => json!(version.clone().unwrap_or_else(|| b.kind.clone())),
        _ => json!("none"),
    };
    let preparedplan = json!({
        "planRef": format!("protected/confinement-finalization/{command_id}.json#preparedPlan"),
        "planDigest": plan_digest,
    });
    let dispatch_id = get(request, "dispatchId").cloned().unwrap_or(Value::Null);
    let mut descriptor = json!({
        "contract": "confinement-finalization.v1",
        "runId": run_id,
        "launchCommandId": command_id,
        "backend": backend_label,
        "dispatchId": dispatch_id,
        "resourceOwner": "confinement-authority",
        "preparedPlan": preparedplan,
        "attestationPlanDigest": plan_digest,
        "preparedInvocationDigest": prepared_digest,
        "finalAttestation": { "state": "pending", "resultRef": null, "resultDigest": null },
        "resources": finalization_resources,
        "cleanupState": "pending",
        "cleanupResult": null,
        "retainUntil": "safe-cleanup-proof-or-manual-review",
        "updatedAt": (host.now_iso)(),
    });
    // The digest covers the descriptor's fixed fields, never its mutable cleanup and final-attestation state.
    let fixed: Map<String, Value> = [
        "contract",
        "runId",
        "launchCommandId",
        "backend",
        "dispatchId",
        "resourceOwner",
        "preparedPlan",
        "attestationPlanDigest",
        "preparedInvocationDigest",
        "resources",
        "retainUntil",
    ]
    .iter()
    .map(|k| (k.to_string(), descriptor[*k].clone()))
    .collect();
    descriptor["digest"] = json!(digest(&Value::Object(fixed)));
    let finalization_path = run_dir
        .join("protected")
        .join("confinement-finalization")
        .join(format!("{command_id}.json"));
    publish_mutable_projection(&finalization_path, &descriptor)?;

    let prefix = prepared.and_then(|p| p.bwrap_prefix.as_ref());
    let attempt = json!({
        "command": worker_command,
        "args": record["workerInvocation"]["args"],
        "cwd": worker_cwd,
        "env": Value::Object(redacted_env),
        "secretEnv": worker_env_value,
        "envDigest": env_digest,
        "bwrapPrefix": prefix,
        "bwrapExecutable": prefix.map(|_| {
            prep.backend
                .as_ref()
                .and_then(|b| get(&b.config, "executable"))
                .filter(|e| truthy(Some(e)))
                .cloned()
                .unwrap_or_else(|| json!("/usr/bin/bwrap"))
        }),
        "launchDigest": prepared.and_then(|p| p.launch_digest.clone()),
    });
    Ok(Launch {
        attempt,
        prepared_invocation: record,
        prepared_invocation_digest: prepared_digest,
        provider_capacity: prepared
            .and_then(|p| p.provider_capacity.clone())
            .filter(|c| truthy(Some(c))),
        finalization_path,
        finalization_descriptor: descriptor,
        backend_plan: prep.backend_plan,
        prepared: prep.prepared,
    })
}
