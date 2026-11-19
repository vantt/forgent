//! The attestation store: the host's record of what a confinement enforced, kept outside every path a confined
//! process can write, so a dispatched agent cannot tamper with its own security record. Also the redacted public
//! reference of a record and the cache of a passed falsification probe.

use super::{js, DriverError, ErrorKind};
use fgos_durable_file::replace_durably_with_mode;
use serde_json::{json, Map, Value};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

pub const ATTESTATION_CONTRACT: &str = "confinement-attestation.v1";
pub const ATTESTATION_REF_CONTRACT: &str = "confinement-attestation-ref.v1";
pub const REQUIRED_CHANNELS: [&str; 5] =
    ["filesystem", "inherited-fd", "stdio", "host-ipc", "network"];
pub const VALID_PHASES: [&str; 4] = ["prepared", "completed", "failed", "refused"];
pub const ATTESTATION_OUTCOMES: [&str; 5] =
    ["enforced", "unconfined", "degraded", "refused", "unknown"];
pub const DEFAULT_PROBE_CACHE_TTL_MS: i64 = 60 * 60 * 1000;
pub const STORE_PATH_ENV: &str = "FGOS_CONFINEMENT_ATTESTATION_STORE_PATH";
const PROBE_CACHE_CONTRACT: &str = "confinement-probe-cache.v1";

fn refuse(message: impl Into<String>) -> DriverError {
    DriverError::new(ErrorKind::Attestation, message)
}

/// Checks a record has the contract, a dispatch, a known phase and outcome, and all five channels.
pub fn validate_completeness(attestation: &Value) -> Result<(), DriverError> {
    let Some(map) = attestation.as_object() else {
        return Err(refuse("attestation must be an object."));
    };
    if map.get("contract").and_then(Value::as_str) != Some(ATTESTATION_CONTRACT) {
        return Err(refuse(format!(
            "attestation contract must be \"{ATTESTATION_CONTRACT}\", got \"{}\".",
            js::display(map.get("contract"))
        )));
    }
    if !map
        .get("dispatchId")
        .and_then(Value::as_str)
        .is_some_and(|id| !id.is_empty())
    {
        return Err(refuse("attestation dispatchId must be a non-empty string."));
    }
    if !map
        .get("phase")
        .and_then(Value::as_str)
        .is_some_and(|p| VALID_PHASES.contains(&p))
    {
        return Err(refuse(format!(
            "attestation phase must be one of {}, got \"{}\".",
            VALID_PHASES.join("/"),
            js::display(map.get("phase"))
        )));
    }
    if !map
        .get("outcome")
        .and_then(Value::as_str)
        .is_some_and(|o| ATTESTATION_OUTCOMES.contains(&o))
    {
        return Err(refuse(format!(
            "attestation outcome must be one of {}, got \"{}\".",
            ATTESTATION_OUTCOMES.join("/"),
            js::display(map.get("outcome"))
        )));
    }
    let Some(channels) = map.get("channels").and_then(Value::as_array) else {
        return Err(refuse("attestation channels must be an array."));
    };
    for required in REQUIRED_CHANNELS {
        if !channels
            .iter()
            .any(|c| js::str_at(c, &["name"]) == Some(required))
        {
            return Err(refuse(format!(
                "attestation channels is missing required channel \"{required}\"."
            )));
        }
    }
    Ok(())
}

/// The real path of `abs`, or of its nearest existing ancestor with the missing tail put back.
fn real_with_ancestor(abs: &str) -> String {
    let path = Path::new(abs);
    if let Ok(real) = std::fs::canonicalize(path) {
        return real.to_string_lossy().into_owned();
    }
    let mut ancestor = path.parent();
    let mut tail = PathBuf::from(path.file_name().unwrap_or_default());
    while let Some(dir) = ancestor {
        if dir.exists() {
            return std::fs::canonicalize(dir)
                .map(|real| real.join(&tail).to_string_lossy().into_owned())
                .unwrap_or_else(|_| abs.to_string());
        }
        tail = PathBuf::from(dir.file_name().unwrap_or_default()).join(&tail);
        ancestor = dir.parent();
    }
    abs.to_string()
}

fn within(inner: &str, outer: &str) -> bool {
    let prefix = if outer.ends_with('/') {
        outer.to_string()
    } else {
        format!("{outer}/")
    };
    inner.starts_with(&prefix)
}

/// Fails closed when the store directory equals, contains or lies inside any resource granted write access.
pub fn verify_store_isolation(store_dir: &str, resources: &[Value]) -> Result<(), DriverError> {
    if store_dir.is_empty() {
        return Err(refuse("attestation storeDir must be a non-empty string."));
    }
    let real_store = real_with_ancestor(&js::resolve_cwd(store_dir));
    for res in resources {
        if !matches!(js::str_at(res, &["access"]), Some("write" | "read-write")) {
            continue;
        }
        let target = js::str_at(res, &["hostTarget"])
            .filter(|t| !t.is_empty())
            .or_else(|| js::str_at(res, &["executionTarget", "path"]).filter(|t| !t.is_empty()));
        let Some(target) = target else { continue };
        let real_target = real_with_ancestor(&js::resolve_cwd(target));
        if real_store == real_target
            || within(&real_store, &real_target)
            || within(&real_target, &real_store)
        {
            return Err(refuse(format!(
                "attestation store directory \"{real_store}\" overlaps with writable resource \"{}\" at \"{real_target}\" (fail closed).",
                js::display(res.get("resource"))
            )));
        }
    }
    Ok(())
}

/// The host directory records live in, outside agent write grants: the override variable, else the request
/// context's `attestationStoreDir`, else `<state root>/attestations`.
pub fn resolve_store_dir(context: &Value, env: &dyn Fn(&str) -> Option<String>) -> PathBuf {
    if let Some(path) = env(STORE_PATH_ENV).filter(|p| !p.is_empty()) {
        return PathBuf::from(js::resolve_cwd(&path));
    }
    if let Some(dir) = js::str_at(context, &["attestationStoreDir"]).filter(|d| !d.is_empty()) {
        return PathBuf::from(js::resolve_cwd(dir));
    }
    fgos_holder_lock::state_root::state_root_from(env)
        .0
        .join("attestations")
}

/// Refuses to persist anywhere a confined process can write; returns the store directory.
pub fn assert_store_isolated(
    context: &Value,
    resources: &[Value],
    env: &dyn Fn(&str) -> Option<String>,
) -> Result<PathBuf, DriverError> {
    let dir = resolve_store_dir(context, env);
    verify_store_isolation(&dir.to_string_lossy(), resources)?;
    Ok(dir)
}

fn pretty(value: &Value) -> Vec<u8> {
    let mut text = serde_json::to_string_pretty(value).expect("a JSON value serialises");
    text.push('\n');
    text.into_bytes()
}

fn publish(dir: &Path, name: &str, record: &Value) -> Result<PathBuf, DriverError> {
    std::fs::create_dir_all(dir).map_err(|err| {
        refuse(format!(
            "cannot create attestation store \"{}\": {err}",
            dir.display()
        ))
    })?;
    replace_durably_with_mode(dir, name, &pretty(record), 0o644)
        .map_err(|err| refuse(format!("cannot write attestation record \"{name}\": {err}")))?;
    Ok(dir.join(name))
}

/// Where a record was written.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Saved {
    pub path: PathBuf,
    pub dispatch_id: String,
    pub phase: Option<String>,
}

/// Persists an attestation record outside agent write grants.
pub fn save_attestation_record(
    attestation: &Value,
    context: &Value,
    env: &dyn Fn(&str) -> Option<String>,
) -> Result<Saved, DriverError> {
    validate_completeness(attestation)?;
    let dir = resolve_store_dir(context, env);
    if let Some(resources) = attestation
        .get("resources")
        .and_then(Value::as_array)
        .filter(|r| !r.is_empty())
    {
        verify_store_isolation(&dir.to_string_lossy(), resources)?;
    }
    let dispatch_id = js::display(attestation.get("dispatchId"));
    let phase = js::display(attestation.get("phase"));
    let path = publish(&dir, &format!("{dispatch_id}.{phase}.json"), attestation)?;
    Ok(Saved {
        path,
        dispatch_id,
        phase: Some(phase),
    })
}

/// Persists the plan record beside the attestations.
pub fn save_plan_record(
    plan: &Value,
    context: &Value,
    env: &dyn Fn(&str) -> Option<String>,
) -> Result<Saved, DriverError> {
    let Some(dispatch_id) = js::str_at(plan, &["dispatchId"]).filter(|id| !id.is_empty()) else {
        return Err(refuse("plan must have dispatchId."));
    };
    let dir = resolve_store_dir(context, env);
    if let Some(resources) = plan
        .get("resources")
        .and_then(Value::as_array)
        .filter(|r| !r.is_empty())
    {
        verify_store_isolation(&dir.to_string_lossy(), resources)?;
    }
    let path = publish(&dir, &format!("{dispatch_id}.plan.json"), plan)?;
    Ok(Saved {
        path,
        dispatch_id: dispatch_id.to_string(),
        phase: None,
    })
}

/// Loads a record by dispatch and phase; `None` when absent, an error when present but incomplete.
pub fn load_attestation_record(
    dispatch_id: &str,
    phase: &str,
    context: &Value,
    env: &dyn Fn(&str) -> Option<String>,
) -> Result<Option<Value>, DriverError> {
    let path = resolve_store_dir(context, env).join(format!("{dispatch_id}.{phase}.json"));
    if !path.exists() {
        return Ok(None);
    }
    let raw = std::fs::read_to_string(&path).map_err(|err| {
        refuse(format!(
            "cannot read attestation record \"{}\": {err}",
            path.display()
        ))
    })?;
    let parsed: Value = serde_json::from_str(&raw).map_err(|err| {
        refuse(format!(
            "attestation record \"{}\" is not valid JSON: {err}",
            path.display()
        ))
    })?;
    validate_completeness(&parsed)?;
    Ok(Some(parsed))
}

/// The redacted public reference of a record: digest and reference only, no env, credential or path.
pub fn redacted_reference(attestation: &Value) -> Result<Value, DriverError> {
    validate_completeness(attestation)?;
    let mut digested = Map::new();
    for key in [
        "contract",
        "dispatchId",
        "phase",
        "outcome",
        "coverage",
        "effectiveControls",
        "mismatches",
    ] {
        if let Some(value) = attestation.get(key) {
            digested.insert(key.to_string(), value.clone());
        }
    }
    let digest = hex(&Sha256::digest(
        Value::Object(digested).to_string().as_bytes(),
    ));
    let dispatch_id = js::display(attestation.get("dispatchId"));
    let phase = js::display(attestation.get("phase"));
    let mismatches: Vec<Value> = attestation
        .get("mismatches")
        .and_then(Value::as_array)
        .map(|list| {
            list.iter()
                .map(|m| {
                    if m.is_object() || m.is_null() {
                        m.get("code").cloned().unwrap_or(Value::Null)
                    } else {
                        m.clone()
                    }
                })
                .collect()
        })
        .unwrap_or_default();
    Ok(json!({
        "contract": ATTESTATION_REF_CONTRACT,
        "dispatchId": dispatch_id,
        "phase": phase,
        "outcome": attestation["outcome"],
        "digest": format!("sha256:{digest}"),
        "ref": format!("attestation:{dispatch_id}:{phase}"),
        "mismatches": mismatches,
    }))
}

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

/// `new Date(ms).toISOString()`.
fn iso(ms: i64) -> String {
    let (days, rem) = (ms.div_euclid(86_400_000), ms.rem_euclid(86_400_000));
    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z.rem_euclid(146_097);
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let day = doy - (153 * mp + 2) / 5 + 1;
    let month = if mp < 10 { mp + 3 } else { mp - 9 };
    let year = yoe + era * 400 + i64::from(month <= 2);
    format!(
        "{year:04}-{month:02}-{day:02}T{:02}:{:02}:{:02}.{:03}Z",
        rem / 3_600_000,
        rem / 60_000 % 60,
        rem / 1000 % 60,
        rem % 1000
    )
}

/// The cache of passed falsification probes, in memory and in the store, keyed by the probe's fingerprint.
#[derive(Default)]
pub struct ProbeCache {
    memory: Mutex<HashMap<String, Value>>,
}

impl ProbeCache {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn clear(&self) {
        self.memory.lock().expect("probe cache lock").clear();
    }

    fn digest(fingerprint: &Value) -> String {
        hex(&Sha256::digest(fingerprint.to_string().as_bytes()))
    }

    /// Records a passed probe; a probe that did not pass is not cached (`None`). Persisting to the store is best-effort.
    pub fn save(
        &self,
        fingerprint: &Value,
        result: &Value,
        context: &Value,
        now_ms: i64,
        env: &dyn Fn(&str) -> Option<String>,
    ) -> Option<Value> {
        if !js::truthy(result.get("passed")) {
            return None;
        }
        let fp_digest = Self::digest(fingerprint);
        let record = json!({
            "contract": PROBE_CACHE_CONTRACT,
            "fingerprint": fingerprint,
            "fpDigest": fp_digest,
            "passed": true,
            "passedAt": iso(now_ms),
            "passedAtMs": now_ms,
            "message": result.get("message").cloned().unwrap_or(Value::Null),
            "results": result.get("results").cloned().unwrap_or(Value::Null),
        });
        self.memory
            .lock()
            .expect("probe cache lock")
            .insert(fp_digest.clone(), record.clone());
        let _ = publish(
            &resolve_store_dir(context, env),
            &format!("probe-{fp_digest}.json"),
            &record,
        );
        Some(record)
    }

    /// A passed probe still within `ttl_ms` of `now_ms`, from memory or the store.
    pub fn load(
        &self,
        fingerprint: &Value,
        context: &Value,
        ttl_ms: i64,
        now_ms: i64,
        env: &dyn Fn(&str) -> Option<String>,
    ) -> Option<Value> {
        let fp_digest = Self::digest(fingerprint);
        let hit = |record: &Value| {
            json!({
                "passed": true,
                "message": record.get("message").cloned().unwrap_or(Value::Null),
                "results": record.get("results").cloned().unwrap_or(Value::Null),
                "passedAt": record.get("passedAt").cloned().unwrap_or(Value::Null),
                "cached": true,
            })
        };
        let fresh = |record: &Value| {
            record["passedAtMs"]
                .as_i64()
                .is_some_and(|at| now_ms - at <= ttl_ms)
        };
        if let Some(mem) = self
            .memory
            .lock()
            .expect("probe cache lock")
            .get(&fp_digest)
        {
            if js::truthy(mem.get("passed")) && fresh(mem) {
                return Some(hit(mem));
            }
        }
        let path = resolve_store_dir(context, env).join(format!("probe-{fp_digest}.json"));
        let record: Value = serde_json::from_str(&std::fs::read_to_string(path).ok()?).ok()?;
        if !js::truthy(record.get("passed")) || !fresh(&record) {
            return None;
        }
        self.memory
            .lock()
            .expect("probe cache lock")
            .insert(fp_digest, record.clone());
        Some(hit(&record))
    }
}
