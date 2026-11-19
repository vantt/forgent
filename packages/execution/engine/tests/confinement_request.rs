//! Proof of the confinement request and authority against the vectors the Node originals recorded
//! (`packages/execution/contracts/confinement-request/`, written by
//! `test/golden-recorders/confinement-request.recorder.mjs`).
//!
//! One test per behaviour; each replays every recorded case of that behaviour and reports all that differ at once.
//! Fixtures are built in a fresh temp directory and `$ROOT` in a vector stands for it; the launch cases run under
//! the one fixed root the recorder used, because the worker env (and so its digest) carries the state root.

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

use fgos_execution_engine::confinement::driver::registry::DriverRegistry;
use fgos_execution_engine::confinement::driver::{
    Assessment, BackendDriver, DriverError, Mismatch, Prepared,
};
use fgos_execution_engine::confinement::request::*;
use serde_json::{json, Map, Value};

// ------------------------------------------------------------------ vectors and helpers

fn vectors(name: &str) -> Value {
    let path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../contracts/confinement-request")
        .join(name);
    serde_json::from_str(
        &fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display())),
    )
    .expect("vector file is JSON")
}

fn cases<'a>(file: &'a Value, group: &str) -> &'a Vec<Value> {
    file[group]
        .as_array()
        .unwrap_or_else(|| panic!("vector group {group}"))
}

/// Collects mismatches so one run names every case that differs.
#[derive(Default)]
struct Report(Vec<String>);

impl Report {
    fn expect(&mut self, case: &Value, actual: Value, expected: &Value) {
        if &actual != expected {
            self.0.push(format!(
                "{}\n  expected {expected}\n  actual   {actual}",
                case["name"]
            ));
        }
    }
    fn finish(self, behaviour: &str) {
        assert!(
            self.0.is_empty(),
            "{behaviour}: {} case(s) differ\n{}",
            self.0.len(),
            self.0.join("\n")
        );
    }
}

/// What a recorded run answered, as `{ ok }` or `{ error, code? }`.
fn recorded(case: &Value) -> Value {
    match case.get("error") {
        Some(error) => {
            let mut out = json!({ "error": error });
            if let Some(code) = case.get("code") {
                out["code"] = code.clone();
            }
            out
        }
        None => json!({ "ok": null }),
    }
}

fn answered(result: Result<(), RequestError>) -> Value {
    match result {
        Ok(()) => json!({ "ok": null }),
        Err(err) => {
            let mut out = json!({ "error": err.message });
            if let Some(code) = err.code {
                out["code"] = json!(code);
            }
            out
        }
    }
}

fn scratch(label: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("fgos-cr-{label}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    fs::canonicalize(&dir).unwrap()
}

fn swap_root(value: &Value, from: &str, to: &str) -> Value {
    serde_json::from_str(&value.to_string().replace(from, to)).unwrap()
}

fn write_files(root: &Path, files: &Value) {
    for (rel, content) in files.as_object().into_iter().flatten() {
        let target = root.join(rel);
        fs::create_dir_all(target.parent().unwrap()).unwrap();
        match content {
            Value::String(text) => fs::write(&target, text).unwrap(),
            Value::Null => fs::write(&target, "").unwrap(),
            other => fs::write(&target, other.to_string()).unwrap(),
        }
    }
}

const FIXED_NOW: &str = "2026-01-02T03:04:05.000Z";

// ------------------------------------------------------------------ request shape and construction

#[test]
fn launch_context_shape_is_judged_as_the_original_judged_it() {
    let file = vectors("request.v1.json");
    let mut report = Report::default();
    for case in cases(&file, "assignmentLaunchContext") {
        let actual = answered(validate_assignment_launch_context(&case["context"], None));
        report.expect(case, actual, &recorded(case));
    }
    report.finish("assignment launch context shape");
}

#[test]
fn launch_context_must_agree_with_what_the_run_directory_holds() {
    let file = vectors("request.v1.json");
    let mut report = Report::default();
    for case in cases(&file, "launchContextCrossCheck") {
        let root = scratch("cross");
        write_files(&root, &case["files"]);
        let context = json!({ "runDir": root.to_string_lossy() });
        let actual = answered(validate_assignment_launch_context(
            &case["launchContext"],
            Some(&context),
        ));
        report.expect(case, actual, &recorded(case));
        let _ = fs::remove_dir_all(&root);
    }
    report.finish("launch context cross-check");
}

#[test]
fn request_shape_is_closed_and_policies_are_canonicalised_in_place() {
    let file = vectors("request.v1.json");
    let mut report = Report::default();
    for case in cases(&file, "requestShape") {
        let mut input = case["input"].clone();
        let actual = answered(validate_confinement_request(&mut input));
        report.expect(case, actual, &recorded(case));
        report.expect(
            case,
            json!({ "after": input }),
            &json!({ "after": case["after"] }),
        );
    }
    report.finish("request shape");
}

fn fixed_clock<'a>(now: &'a dyn Fn() -> u64, suffix: &'a dyn Fn() -> String) -> BuildClock<'a> {
    BuildClock {
        now_ms: now,
        random_suffix: suffix,
    }
}

#[test]
fn a_request_is_built_from_the_seams_arguments() {
    let file = vectors("request.v1.json");
    let (now, suffix) = (|| 1_767_323_045_000u64, || "0a0b0c0d".to_string());
    let clock = fixed_clock(&now, &suffix);
    let mut report = Report::default();
    for case in cases(&file, "build") {
        let actual = match build_confinement_request(&case["input"], &clock) {
            Ok(request) => json!({ "ok": request }),
            Err(err) => {
                let mut out = json!({ "error": err.message });
                if let Some(code) = err.code {
                    out["code"] = json!(code);
                }
                out
            }
        };
        let expected = match case.get("error") {
            Some(_) => recorded(case),
            None => json!({ "ok": case["ok"] }),
        };
        report.expect(case, actual, &expected);
    }
    report.finish("request build");
}

#[test]
fn a_request_without_a_dispatch_id_gets_one_of_the_recorded_shape() {
    let file = vectors("request.v1.json");
    assert_eq!(
        file["dispatchIdShape"]["pattern"],
        "^disp_[0-9]+_[0-9a-f]{8}$"
    );
    let (now, suffix) = (|| system_clock_parts().0, || system_clock_parts().1);
    let clock = fixed_clock(&now, &suffix);
    let args = json!({ "capability": "c", "executorId": "e", "context": { "cwd": "/c", "runDir": "/r" }, "requirement": { "mode": "unconfined" } });
    let id = build_confinement_request(&args, &clock).unwrap()["dispatchId"]
        .as_str()
        .unwrap()
        .to_string();
    let rest = id.strip_prefix("disp_").expect("disp_ prefix");
    let (millis, hex) = rest.split_once('_').expect("two parts");
    assert!(
        !millis.is_empty() && millis.bytes().all(|b| b.is_ascii_digit()),
        "{id}"
    );
    assert!(
        hex.len() == 8 && hex.bytes().all(|b| matches!(b, b'0'..=b'9' | b'a'..=b'f')),
        "{id}"
    );
}

// ------------------------------------------------------------------ attestation, delivery, worktree, seat folder

#[test]
fn an_attestation_records_what_the_launch_is_observed_to_enforce() {
    let file = vectors("authority.v1.json");
    let mut report = Report::default();
    for case in cases(&file, "attestation") {
        let input = &case["input"];
        let actual = build_confinement_attestation(
            &input["request"],
            input["phase"].as_str().unwrap(),
            input["outcome"].as_str(),
            input.get("driverClaims").filter(|c| !c.is_null()),
        );
        report.expect(case, json!({ "ok": actual }), &json!({ "ok": case["ok"] }));
    }
    report.finish("attestation");
}

#[test]
fn control_delivery_names_who_delivers_the_controls() {
    let file = vectors("authority.v1.json");
    let mut report = Report::default();
    for case in cases(&file, "controlDelivery") {
        let got = control_delivery_of(&case["request"]);
        let actual = json!({ "backendDelivers": got.backend_delivers, "rootWorkspaceAllowed": got.root_workspace_allowed });
        report.expect(case, actual, &case["ok"]);
    }
    report.finish("control delivery");
}

#[test]
fn an_own_worktree_is_unavailable_only_in_the_repo_root_itself() {
    let file = vectors("authority.v1.json");
    let mut report = Report::default();
    for case in cases(&file, "ownWorktreeUnavailable") {
        let got =
            own_worktree_unavailable(&case["request"], case["hasOwnWorktree"].as_bool().unwrap());
        // A request with no `cwd` made Node throw a type error; here it is refused, and the text is the engine's.
        let actual = match (&got, case.get("error")) {
            (Err(_), Some(_)) => json!({ "refused": true }),
            (Ok(answer), None) => json!({ "ok": answer }),
            (Ok(answer), Some(_)) => json!({ "ok": answer, "expected": "a refusal" }),
            (Err(err), None) => json!({ "error": err.message }),
        };
        let expected = if case.get("error").is_some() {
            json!({ "refused": true })
        } else {
            json!({ "ok": case["ok"] })
        };
        report.expect(case, actual, &expected);
    }
    report.finish("own worktree availability");
}

#[test]
fn the_seats_session_folder_is_the_kept_copy_else_the_private_homes() {
    let file = vectors("authority.v1.json");
    let mut report = Report::default();
    for case in cases(&file, "seatSessionDir") {
        let root = scratch("seat");
        let root_text = root.to_string_lossy().to_string();
        write_files(&root, &swap_root(&case["files"], "$ROOT", &root_text));
        let id = case["launchCommandId"].as_str();
        let actual = seat_session_dir(&root, id).map_or(Value::Null, |p| {
            json!(p.to_string_lossy().replace(&root_text, "$ROOT"))
        });
        report.expect(case, actual, &case["ok"]);
        let _ = fs::remove_dir_all(&root);
    }
    report.finish("seat session folder");
}

// ------------------------------------------------------------------ the launch pipeline

/// The recorded fake driver: its answers are data in the case and what it was asked is kept for comparison.
struct FakeDriver {
    assess: Value,
    prepare: Value,
    calls: Arc<Mutex<Vec<Value>>>,
}

fn mismatches_of(value: &Value) -> Vec<Mismatch> {
    value
        .as_array()
        .into_iter()
        .flatten()
        .map(|m| Mismatch {
            code: m["code"].as_str().unwrap_or_default().to_string(),
            detail: m["detail"].as_str().unwrap_or_default().to_string(),
        })
        .collect()
}

fn map_of(value: &Value) -> Map<String, Value> {
    value.as_object().cloned().unwrap_or_default()
}

impl BackendDriver for FakeDriver {
    fn driver_type(&self) -> &str {
        "container"
    }
    fn version(&self) -> &str {
        "fake-1"
    }
    fn validate_config(&self, _: &Value, _: &str) -> Result<(), DriverError> {
        Ok(())
    }
    fn assess(&self, request: &Value, backend: &Value) -> Result<Assessment, DriverError> {
        self.calls
            .lock()
            .unwrap()
            .push(json!({ "step": "assess", "request": request, "instance": backend }));
        Ok(Assessment {
            coverage: map_of(&self.assess["coverage"]),
            resources: self.assess["resources"]
                .as_array()
                .cloned()
                .unwrap_or_default(),
            readiness: map_of(&self.assess["readiness"]),
            mismatches: mismatches_of(&self.assess["mismatches"]),
        })
    }
    fn prepare(
        &self,
        plan: &Value,
        request: &Value,
        backend: &Value,
    ) -> Result<Prepared, DriverError> {
        self.calls.lock().unwrap().push(
            json!({ "step": "prepare", "plan": plan, "request": request, "instance": backend }),
        );
        Ok(Prepared {
            invocation: self.prepare["invocation"].clone(),
            claims: map_of(&self.prepare["claims"]),
            bwrap_prefix: None,
            agent_argv: None,
            launch_digest: None,
            provider_capacity: None,
            credential_write_back: None,
            allocated_paths: Vec::new(),
            dispatch_id: self.assess_dispatch(plan),
        })
    }
}

impl FakeDriver {
    fn assess_dispatch(&self, plan: &Value) -> String {
        plan["dispatchId"].as_str().unwrap_or_default().to_string()
    }
}

/// The bwrap driver is registered in the engine that runs a launch; its type only has to be known here, so the
/// refusal that lists the known types reads as the original's.
struct KnownBwrapType;
impl BackendDriver for KnownBwrapType {
    fn driver_type(&self) -> &str {
        "bwrap"
    }
    fn version(&self) -> &str {
        "known-type-only"
    }
    fn validate_config(&self, _: &Value, _: &str) -> Result<(), DriverError> {
        Ok(())
    }
    fn assess(&self, _: &Value, _: &Value) -> Result<Assessment, DriverError> {
        panic!("no recorded case assesses on bwrap");
    }
    fn prepare(&self, _: &Value, _: &Value, _: &Value) -> Result<Prepared, DriverError> {
        panic!("no recorded case prepares on bwrap");
    }
}

struct NoProbe;
impl Probes for NoProbe {
    fn verify_bwrap(&self, _: &Value, _: &str, _: &str, _: &Value) -> ProbeVerdict {
        panic!("no recorded case reaches the bwrap probe");
    }
}

fn mode_of(path: &Path) -> String {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        format!(
            "{:o}",
            fs::metadata(path).unwrap().permissions().mode() & 0o777
        )
    }
    #[cfg(not(unix))]
    {
        let _ = path;
        "644".to_string()
    }
}

/// Every regular file under `dir`, relative, with its mode and parsed body, sorted.
fn tree(dir: &Path) -> Vec<Value> {
    fn walk(base: &Path, current: &Path, out: &mut Vec<Value>) {
        let mut names: Vec<_> = fs::read_dir(current)
            .unwrap()
            .map(|e| e.unwrap().path())
            .collect();
        names.sort();
        for full in names {
            if full.is_dir() {
                walk(base, &full, out);
            } else {
                let text = fs::read_to_string(&full).unwrap();
                let body = serde_json::from_str::<Value>(&text).unwrap_or(Value::String(text));
                out.push(json!({
                    "path": full.strip_prefix(base).unwrap().to_string_lossy(),
                    "mode": mode_of(&full),
                    "body": body,
                }));
            }
        }
    }
    let mut out = Vec::new();
    walk(dir, dir, &mut out);
    out
}

/// A clock reading is `<now>` in a vector.
fn scrub_clock(value: &mut Value) {
    match value {
        Value::Array(items) => items.iter_mut().for_each(scrub_clock),
        Value::Object(fields) => {
            for (key, field) in fields.iter_mut() {
                if (key == "publishedAt" || key == "updatedAt") && field.is_string() {
                    *field = json!("<now>");
                } else {
                    scrub_clock(field);
                }
            }
        }
        _ => {}
    }
}

fn scrubbed(value: &Value, root: &str) -> Value {
    let mut out = swap_root(value, root, "$ROOT");
    scrub_clock(&mut out);
    out
}

/// The one root the recorder ran every launch case under.
const PIPELINE_ROOT: &str = "/tmp/fgos-request-vectors-root";

fn run_launch_case(case: &Value) -> Value {
    let root = PathBuf::from(PIPELINE_ROOT);
    let _ = fs::remove_dir_all(&root);
    fs::create_dir_all(root.join("run")).unwrap();
    let root_text = PIPELINE_ROOT.to_string();
    let sub = |value: &Value| swap_root(value, "$ROOT", &root_text);
    write_files(&root, &sub(&case["files"]));
    let registry_path = root.join("registry.json");
    if !case["registry"].is_null() {
        fs::write(&registry_path, sub(&case["registry"]).to_string()).unwrap();
    }
    let process_env = sub(&case["processEnv"]);
    let mut env: Vec<(String, String)> = process_env
        .as_object()
        .unwrap()
        .iter()
        .map(|(k, v)| (k.clone(), v.as_str().unwrap().to_string()))
        .collect();
    let set = |env: &mut Vec<(String, String)>, key: &str, value: String| {
        env.retain(|(k, _)| k != key);
        env.push((key.to_string(), value));
    };
    if !env.iter().any(|(k, _)| k == "FGOS_STATE_ROOT") {
        set(
            &mut env,
            "FGOS_STATE_ROOT",
            root.join("state").to_string_lossy().into_owned(),
        );
    }
    set(
        &mut env,
        "FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH",
        registry_path.to_string_lossy().into_owned(),
    );

    let calls = Arc::new(Mutex::new(Vec::new()));
    let mut drivers = DriverRegistry::new();
    let fake = if case["fake"].is_null() {
        json!({ "assess": { "coverage": {}, "resources": [], "readiness": {}, "mismatches": [] }, "prepare": null })
    } else {
        sub(&case["fake"])
    };
    drivers.register(Arc::new(KnownBwrapType)).unwrap();
    drivers
        .register(Arc::new(FakeDriver {
            assess: fake["assess"].clone(),
            prepare: fake["prepare"].clone(),
            calls: calls.clone(),
        }))
        .unwrap();
    let now = || FIXED_NOW.to_string();
    let discard = |_: &Prepared| {};
    let no_args = |_: &Value, _: &str, _: &str| Vec::<String>::new();
    let roots = vec!["/tmp/fgos-confinement".to_string()];
    let host = LaunchHost {
        env: &env,
        drivers: &drivers,
        probes: &NoProbe,
        credential_scan_roots: &roots,
        now_iso: &now,
        discard_prepared: &discard,
        claude_mcp_approval_args: &no_args,
    };
    let request = sub(&case["request"]);
    let outcome = match prepare_confinement_for_launch(&request, &host) {
        Ok(launch) => json!({ "ok": {
            "attempt": launch.attempt,
            "preparedInvocation": launch.prepared_invocation,
            "preparedInvocationDigest": launch.prepared_invocation_digest,
            "providerCapacity": launch.provider_capacity,
            "finalizationPath": launch.finalization_path.to_string_lossy(),
            "finalizationDescriptor": launch.finalization_descriptor,
            "backendPlan": launch.backend_plan,
        } }),
        Err(err) => {
            let mut out = json!({ "error": err.message });
            if let Some(code) = err.code {
                out["code"] = json!(code);
            }
            if let Some(class) = err.error_class {
                out["errorClass"] = json!(class);
            }
            if let Some(data) = err.data {
                out["data"] = Value::Object(*data);
            }
            out
        }
    };
    let given: Vec<String> = case["files"]
        .as_object()
        .into_iter()
        .flatten()
        .map(|(k, _)| k.clone())
        .collect();
    let written: Vec<Value> = tree(&root)
        .into_iter()
        .filter(|entry| {
            let path = entry["path"].as_str().unwrap();
            !path.starts_with("registry.json") && !given.iter().any(|g| g == path)
        })
        .collect();
    let mut actual = outcome;
    actual["driverCalls"] = Value::Array(calls.lock().unwrap().clone());
    actual["tree"] = Value::Array(written);
    let _ = fs::remove_dir_all(&root);
    scrubbed(&actual, &root_text)
}

#[test]
fn a_launch_is_refused_or_prepared_and_its_records_published_as_the_original_did() {
    let file = vectors("authority.v1.json");
    let mut report = Report::default();
    for case in cases(&file, "launch") {
        let actual = run_launch_case(case);
        let mut expected = json!({
            "driverCalls": case["driverCalls"],
            "tree": case["tree"],
        });
        for key in ["ok", "error", "code", "errorClass", "data"] {
            if let Some(value) = case.get(key) {
                expected[key] = value.clone();
            }
        }
        // `ok` carries only the fields the recorder read off the result; absent ones are `null`.
        report.expect(case, actual, &expected);
    }
    report.finish("launch pipeline");
}
