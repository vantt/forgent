//! The confinement driver: the registry, the attestation store and the bwrap driver, against the vectors recorded
//! from the Node modules they port (`packages/execution/contracts/confinement-driver/`, recorded by
//! `test/golden-recorders/confinement-driver.recorder.mjs`), plus the behaviour the vectors cannot hold: the
//! private home a launch allocates, the login copy through the credentials port, the refusals read off resolved
//! resources, and the smoke test.

use fgos_execution_engine::confinement::driver::attestation::{self, ProbeCache};
#[cfg(unix)]
use fgos_execution_engine::confinement::driver::bwrap::SmokeProbe;
use fgos_execution_engine::confinement::driver::bwrap::{self, BwrapDriver};
use fgos_execution_engine::confinement::driver::registry::{
    self, DriverRegistry, RegistrySnapshot,
};
use fgos_execution_engine::confinement::driver::{
    BackendDriver, Credentials, DriverError, EnvFn, PrivateHomeHost, ResourceResolver,
};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

fn vector(name: &str) -> Value {
    let path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../contracts/confinement-driver")
        .join(name);
    serde_json::from_str(
        &std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display())),
    )
    .unwrap()
}

fn scratch(label: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("fgos-cd-{label}-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

fn env_of(pairs: &[(&str, &str)]) -> EnvFn {
    let map: HashMap<String, String> = pairs
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect();
    Arc::new(move |key| map.get(key).cloned())
}

/// `{ok}` or `{error, code?}`: the shape every vector records an outcome in.
fn outcome<T>(result: Result<T, DriverError>, ok: impl FnOnce(T) -> Value) -> Value {
    match result {
        Ok(value) => json!({ "ok": ok(value) }),
        Err(err) => match err.code {
            Some(code) => json!({ "error": err.message, "code": code }),
            None => json!({ "error": err.message }),
        },
    }
}

fn ok_true<T>(result: Result<T, DriverError>) -> Value {
    outcome(result, |_| json!(true))
}

fn name_of(case: &Value) -> &str {
    case["name"].as_str().unwrap()
}

// ---- ports -----------------------------------------------------------------------------------------------------

struct FixedResolver(Result<Vec<Value>, DriverError>);
impl ResourceResolver for FixedResolver {
    fn resolve(&self, _input: &Value) -> Result<Vec<Value>, DriverError> {
        self.0.clone()
    }
}

/// A resolver that fails the way Node's did in the recorder (it has no config door), so no resource is resolved.
fn empty_resolver() -> Arc<dyn ResourceResolver> {
    Arc::new(FixedResolver(Ok(Vec::new())))
}

#[derive(Default)]
struct RecordingHomes {
    calls: Mutex<Vec<String>>,
    fail_record: bool,
}
impl RecordingHomes {
    fn log(&self, line: String) {
        self.calls.lock().unwrap().push(line);
    }
    fn calls(&self) -> Vec<String> {
        self.calls.lock().unwrap().clone()
    }
}
impl PrivateHomeHost for RecordingHomes {
    fn ensure_private_dir(&self, dir: &Path, root: &Path) -> Result<(), DriverError> {
        std::fs::create_dir_all(dir).unwrap();
        self.log(format!("ensure {} under {}", dir.display(), root.display()));
        Ok(())
    }
    fn write_attempt_marker(&self, dir: &Path, fields: &Value) -> Result<(), DriverError> {
        self.log(format!(
            "attempt-marker {} {}",
            dir.display(),
            fields["attemptId"].as_str().unwrap()
        ));
        Ok(())
    }
    fn write_ownership_marker(
        &self,
        dir: &Path,
        dispatch_id: &str,
        resource: &str,
    ) -> Result<(), DriverError> {
        self.log(format!(
            "ownership-marker {} {dispatch_id} {resource}",
            dir.display()
        ));
        Ok(())
    }
    fn write_attempt_home_record(
        &self,
        home: &Path,
        fields: &Value,
    ) -> Result<PathBuf, DriverError> {
        if self.fail_record {
            return Err(DriverError::new(
                fgos_execution_engine::confinement::driver::ErrorKind::Port,
                "record refused",
            ));
        }
        let file = home.parent().unwrap().join(format!(
            "{}.home-record",
            fields["attemptId"].as_str().unwrap()
        ));
        std::fs::write(&file, fields.to_string()).unwrap();
        self.log(format!("home-record {}", file.display()));
        Ok(file)
    }
    fn cleanup_resource(&self, path: &Path, dispatch_id: &str) -> Result<(), DriverError> {
        let _ = std::fs::remove_dir_all(path);
        self.log(format!("cleanup {} {dispatch_id}", path.display()));
        Ok(())
    }
}

/// Stands for the credentials module until it lands: copies the listed files that exist, and states the life of a login.
#[derive(Default)]
struct FakeCredentials {
    life_problem: Option<String>,
}
impl Credentials for FakeCredentials {
    fn login_life_problem(&self, _source: &Value, _timeout_ms: u64) -> Option<String> {
        self.life_problem.clone()
    }
    fn copy_files(
        &self,
        private_home: &Path,
        source_home: &Path,
        files: &[String],
    ) -> Result<Vec<String>, DriverError> {
        let mut copied = Vec::new();
        for file in files {
            let from = source_home.join(file);
            if from.is_file() {
                let to = private_home.join(file);
                std::fs::create_dir_all(to.parent().unwrap()).unwrap();
                std::fs::copy(&from, &to).unwrap();
                copied.push(file.clone());
            }
        }
        Ok(copied)
    }
    fn write_back_target(&self, capacity: &Value) -> Option<Value> {
        Some(
            json!({ "accountId": capacity["accountId"], "runtimeDir": capacity["credentialWriteBack"]["runtimeDir"] }),
        )
    }
}

fn driver_with(
    resolver: Arc<dyn ResourceResolver>,
    homes: Arc<RecordingHomes>,
    credentials: FakeCredentials,
    env: EnvFn,
) -> BwrapDriver {
    BwrapDriver::new(resolver, homes, Arc::new(credentials), env, 1000)
}

fn vector_driver() -> BwrapDriver {
    driver_with(
        empty_resolver(),
        Arc::new(RecordingHomes::default()),
        FakeCredentials::default(),
        env_of(&[
            ("XDG_RUNTIME_DIR", "/run/user/1000"),
            ("FGOS_CONFINEMENT_ATTESTATION_STORE_PATH", "/srv/state/att"),
        ]),
    )
}

// ---- registry --------------------------------------------------------------------------------------------------

#[test]
fn registry_validates_every_instance_and_document_shape_as_the_node_registry_did() {
    let v = vector("registry.v1.json");
    assert_eq!(
        v["allowedDriverTypes"],
        json!(registry::ALLOWED_DRIVER_TYPES)
    );
    assert_eq!(v["defaultRegistry"], registry::default_machine_registry());
    for case in v["instanceCases"].as_array().unwrap() {
        let got = ok_true(registry::validate_instance_config_shape(
            case["id"].as_str().unwrap(),
            &case["config"],
            "confinement backend",
        ));
        assert_eq!(got, case["out"], "instance case {}", name_of(case));
    }
    for case in v["docCases"].as_array().unwrap() {
        assert_eq!(
            ok_true(registry::validate_registry_shape(&case["doc"], "doc")),
            case["out"],
            "doc case {}",
            name_of(case)
        );
    }
    for case in v["overrideCases"].as_array().unwrap() {
        assert_eq!(
            ok_true(registry::reject_project_backend_override(
                &case["cfg"],
                "project"
            )),
            case["out"],
            "override case {}",
            name_of(case)
        );
    }
}

#[test]
fn a_snapshot_resolves_only_enabled_named_instances() {
    let v = vector("registry.v1.json");
    let snapshot = RegistrySnapshot::new(&v["snapDoc"]).unwrap();
    for case in v["resolves"].as_array().unwrap() {
        let got = snapshot.resolve(&case["id"]).map_or(
            Value::Null,
            |r| json!({ "id": r.id, "type": r.kind, "config": r.config }),
        );
        assert_eq!(got, case["out"], "resolve {}", case["id"]);
    }
    assert!(
        RegistrySnapshot::new(&json!({ "contract": "x" })).is_err(),
        "an invalid registry gives no snapshot"
    );
}

#[test]
fn the_machine_registry_loads_from_disk_and_refuses_what_it_cannot_read() {
    let v = vector("registry.v1.json");
    let dir = scratch("registry-load");
    for case in v["load"].as_array().unwrap() {
        let file = dir.join(format!("{}.json", name_of(case)));
        if let Some(text) = case["text"].as_str() {
            std::fs::write(&file, text).unwrap();
        }
        let got = match registry::load_machine_registry(&file) {
            Ok(doc) => json!({ "ok": doc }),
            Err(err) => {
                let mut message = err.message.replace(dir.to_str().unwrap(), "<dir>");
                if let Some(at) = message.find("is not valid JSON: ") {
                    message.truncate(at + "is not valid JSON: ".len());
                    message.push_str("<parse detail>");
                }
                json!({ "error": message })
            }
        };
        assert_eq!(got, case["out"], "load {}", name_of(case));
    }
}

#[test]
fn bootstrapping_the_registry_adds_the_default_only_where_none_was_declared() {
    let v = vector("registry.v1.json");
    let dir = scratch("registry-ensure");
    for case in v["ensure"].as_array().unwrap() {
        let file = dir.join(format!("ensure-{}.json", name_of(case)));
        if let Some(text) = case["before"].as_str() {
            std::fs::write(&file, text).unwrap();
        }
        let out = registry::ensure_machine_registry_defaults(&file).unwrap();
        let mut message = out.message.replace(file.to_str().unwrap(), "<file>");
        if let Some(at) = message.find("cannot parse machine backend registry at \"<file>\": ") {
            message.truncate(at + "cannot parse machine backend registry at \"<file>\": ".len());
            message.push_str("<parse detail>");
        }
        let got = json!({ "created": out.created, "changed": out.changed, "path": "<file>", "message": message });
        assert_eq!(got, case["out"], "ensure {}", name_of(case));
        let after = std::fs::read_to_string(&file)
            .ok()
            .map_or(Value::Null, Value::String);
        assert_eq!(after, case["after"], "ensure {} file", name_of(case));
    }
}

#[test]
fn the_registry_path_follows_the_override_then_the_global_directory() {
    assert_eq!(registry::registry_path(&|k| (k == registry::REGISTRY_PATH_ENV).then(|| "/x/r.json".into())).unwrap(), PathBuf::from("/x/r.json"));
    assert_eq!(
        registry::registry_path(&|k| (k == "HOME").then(|| "/home/u".into())).unwrap(),
        PathBuf::from("/home/u/.fgos/confinement-backends.json")
    );
    assert!(
        registry::registry_path(&|_| None).is_err(),
        "no home and no override: refuse by name"
    );
}

#[test]
fn drivers_are_found_by_type_and_unknown_types_are_refused_by_name() {
    let v = vector("registry.v1.json");
    let mut drivers = DriverRegistry::new();
    drivers.register(Arc::new(vector_driver())).unwrap();
    for case in v["drivers"].as_array().unwrap() {
        let got = outcome(drivers.get(&case["type"]), |d| json!(d.driver_type()));
        let want = &case["out"];
        // Only the registered type resolves; the others are refused with the same message.
        assert_eq!(got, *want, "driver {}", case["type"]);
    }
}

// ---- attestation -----------------------------------------------------------------------------------------------

#[test]
fn an_attestation_must_carry_its_contract_phase_outcome_and_every_channel() {
    let v = vector("attestation.v1.json");
    for case in v["variants"].as_array().unwrap() {
        let got = outcome(
            attestation::validate_completeness(&case["attestation"]),
            |_| json!(true),
        );
        let want = &case["out"];
        // The Node check returned `true`; the contract here is only that it passes or refuses with the same text.
        assert_eq!(
            got.get("error"),
            want.get("error"),
            "variant {}",
            name_of(case)
        );
        assert_eq!(
            got.get("ok").is_some(),
            want.get("ok").is_some(),
            "variant {}",
            name_of(case)
        );
    }
}

#[test]
fn the_store_may_not_overlap_a_path_the_confined_process_can_write() {
    let v = vector("attestation.v1.json");
    for case in v["isolation"].as_array().unwrap() {
        let resources = case["resources"].as_array().unwrap();
        let got = attestation::verify_store_isolation(case["store"].as_str().unwrap(), resources);
        let want = &case["out"];
        assert_eq!(
            got.as_ref().err().map(|e| e.message.clone()),
            want["error"].as_str().map(str::to_string),
            "isolation {}",
            name_of(case)
        );
    }
}

#[test]
fn the_public_reference_of_a_record_is_a_digest_and_never_the_record() {
    let v = vector("attestation.v1.json");
    for case in v["refs"].as_array().unwrap() {
        let got = outcome(attestation::redacted_reference(&case["attestation"]), |r| r);
        assert_eq!(got, case["out"], "ref {}", name_of(case));
    }
}

#[test]
fn the_store_directory_follows_the_override_the_context_then_the_state_root() {
    let ctx = json!({ "attestationStoreDir": "/srv/ctx/att" });
    assert_eq!(
        attestation::resolve_store_dir(&ctx, &|_| None),
        PathBuf::from("/srv/ctx/att")
    );
    assert_eq!(
        attestation::resolve_store_dir(&ctx, &|k| (k == attestation::STORE_PATH_ENV)
            .then(|| "/srv/env/att".into())),
        PathBuf::from("/srv/env/att")
    );
    assert_eq!(
        attestation::resolve_store_dir(&json!({}), &|k| (k == "FGOS_STATE_HOME")
            .then(|| "/srv/state".into())),
        PathBuf::from("/srv/state/attestations"),
        "the store follows the state-root pin, never a project-local directory"
    );
}

#[test]
fn records_are_saved_outside_grants_loaded_back_and_a_probe_cache_expires() {
    let v = vector("attestation.v1.json");
    let good = v["good"].clone();
    let dir = scratch("attestation-store");
    let ctx = json!({ "attestationStoreDir": dir.to_str().unwrap() });
    let none: &dyn Fn(&str) -> Option<String> = &|_| None;

    let saved = attestation::save_attestation_record(&good, &ctx, none).unwrap();
    assert_eq!(
        saved.path.file_name().unwrap().to_str().unwrap(),
        v["store"]["saved"]["file"]
    );
    assert_eq!(
        attestation::load_attestation_record("d1", "completed", &ctx, none).unwrap(),
        Some(v["store"]["loaded"].clone())
    );
    assert_eq!(
        attestation::load_attestation_record("d1", "failed", &ctx, none).unwrap(),
        None
    );
    let plan = attestation::save_plan_record(&json!({ "dispatchId": "d2", "resources": [{ "resource": "w", "access": "write", "hostTarget": "/srv/work" }] }), &ctx, none).unwrap();
    assert_eq!(
        plan.path.file_name().unwrap().to_str().unwrap(),
        v["store"]["plan"]["file"]
    );
    let overlap = attestation::save_plan_record(&json!({ "dispatchId": "d3", "resources": [{ "resource": "w", "access": "write", "hostTarget": dir.to_str().unwrap() }] }), &ctx, none).unwrap_err();
    let real = std::fs::canonicalize(&dir).unwrap();
    assert_eq!(
        overlap.message.replace(real.to_str().unwrap(), "<dir>"),
        v["store"]["planOverlap"]["error"].as_str().unwrap()
    );
    assert!(
        attestation::save_plan_record(&json!({}), &ctx, none).is_err(),
        "a plan without a dispatch is refused"
    );

    let cache = ProbeCache::new();
    let fp = v["probe"]["fingerprint"].clone();
    let result = json!({ "passed": true, "message": "m", "results": [1] });
    assert_eq!(
        cache.save(&fp, &result, &ctx, 1000, none),
        Some(v["probe"]["saved"].clone())
    );
    assert_eq!(
        cache.save(&fp, &json!({ "passed": false }), &ctx, 1000, none),
        None,
        "a probe that failed is not cached"
    );
    cache.clear();
    assert_eq!(
        cache.load(&fp, &ctx, 500, 1400, none),
        Some(v["probe"]["fresh"].clone()),
        "the store serves a probe after memory is cleared"
    );
    cache.clear();
    assert_eq!(
        cache.load(&fp, &ctx, 500, 1600, none),
        None,
        "a probe older than its ttl is not served"
    );
    let mut names: Vec<String> = std::fs::read_dir(&dir)
        .unwrap()
        .map(|e| e.unwrap().file_name().into_string().unwrap())
        .filter(|n| !n.starts_with("probe-"))
        .collect();
    names.sort();
    assert_eq!(json!(names), v["store"]["files"]);
}

// ---- bwrap -----------------------------------------------------------------------------------------------------

#[test]
fn the_bwrap_config_has_a_closed_schema() {
    let v = vector("bwrap.v1.json");
    assert_eq!(v["driver"]["type"], bwrap::BWRAP_DRIVER_TYPE);
    assert_eq!(v["driver"]["version"], bwrap::BWRAP_DRIVER_VERSION);
    assert_eq!(v["driver"]["confinedMarkerEnv"], bwrap::CONFINED_MARKER_ENV);
    for case in v["configCases"].as_array().unwrap() {
        assert_eq!(
            ok_true(bwrap::validate_bwrap_config(&case["config"], "cfg")),
            case["out"],
            "config {}",
            name_of(case)
        );
    }
}

#[test]
fn assess_refuses_each_control_grant_and_need_it_cannot_enforce_by_name() {
    let v = vector("bwrap.v1.json");
    let driver = vector_driver();
    for case in v["assessCases"].as_array().unwrap() {
        let a = driver
            .assess(
                &case["request"],
                &json!({ "id": "bwrap", "config": { "type": "bwrap" } }),
            )
            .unwrap();
        let got = json!({
            "coverage": a.coverage,
            "readiness": a.readiness,
            "mismatches": a.mismatches.iter().map(|m| json!({ "code": m.code, "detail": m.detail })).collect::<Vec<_>>(),
        });
        assert_eq!(got, case["out"], "assess {}", name_of(case));
    }
}

#[test]
fn prepare_builds_the_argv_from_resolved_resources_only() {
    let v = vector("bwrap.v1.json");
    let driver = vector_driver();
    for case in v["prepareCases"].as_array().unwrap() {
        let backend = if case["backend"].is_null() {
            json!({})
        } else {
            case["backend"].clone()
        };
        let got = outcome(
            driver.prepare(&case["plan"], &case["request"], &backend),
            |p| {
                json!({
                    "invocation": p.invocation,
                    "claims": p.claims,
                    "bwrapPrefix": p.bwrap_prefix,
                    "agentArgv": p.agent_argv,
                    "launchDigest": p.launch_digest,
                    "providerCapacity": p.provider_capacity,
                    "credentialWriteBack": p.credential_write_back,
                })
            },
        );
        assert_eq!(got, case["out"], "prepare {}", name_of(case));
    }
}

#[test]
fn the_launch_digest_names_the_prefix_the_gate_and_the_agent() {
    let v = vector("bwrap.v1.json");
    let d = &v["digest"];
    let prefix: Vec<String> = serde_json::from_value(d["bwrapPrefix"].clone()).unwrap();
    assert_eq!(
        bwrap::launch_digest(&prefix, &d["gateCommand"], &["a".to_string()]),
        d["value"].as_str().unwrap()
    );
    assert_ne!(
        bwrap::launch_digest(&prefix, &d["gateCommand"], &["b".to_string()]),
        d["value"].as_str().unwrap()
    );
}

fn resource(name: &str, host: &str, exec: &str, extra: Value) -> Value {
    let mut base = json!({ "resource": name, "access": "read", "hostTarget": host, "executionTarget": { "path": exec } });
    base.as_object_mut()
        .unwrap()
        .extend(extra.as_object().unwrap().clone());
    base
}

fn policy_request() -> Value {
    json!({
        "dispatchId": "d1",
        "requirement": { "mode": "required", "policyId": "host-write-denied", "policy": {
            "controls": { "hostWrite": "deny", "hostRead": "allow", "networkEgress": "allow", "process": "host", "home": "host", "session": "shared", "workspace": "shared" },
            "grants": [] } },
        "context": { "cwd": "/srv/ws", "repoRoot": "/srv/ws" },
        "invocation": { "command": "echo", "args": [], "env": {} },
        "resourceNeeds": [],
    })
}

fn assess_with(resources: Vec<Value>, request: &Value) -> Vec<(String, String)> {
    let driver = driver_with(
        Arc::new(FixedResolver(Ok(resources))),
        Arc::new(RecordingHomes::default()),
        FakeCredentials::default(),
        env_of(&[("FGOS_CONFINEMENT_ATTESTATION_STORE_PATH", "/srv/state/att")]),
    );
    driver
        .assess(request, &json!({ "config": { "type": "bwrap" } }))
        .unwrap()
        .mismatches
        .into_iter()
        .map(|m| (m.code, m.detail))
        .collect()
}

#[test]
fn a_workspace_inside_a_machine_private_root_is_refused_because_its_own_worker_would_not_see_it() {
    let private = resource(
        "hidden-root",
        "/srv/fgos",
        "/srv/fgos",
        json!({ "machinePrivate": true }),
    );
    let inside = resource("docs", "/srv/fgos/docs", "/docs", json!({}));
    let bound_back = resource(
        "own-assignment",
        "/srv/fgos/assignments/d1",
        "/srv/fgos/assignments/d1",
        json!({}),
    );
    let mut request = policy_request();
    request["context"] = json!({ "cwd": "/srv/fgos/work", "repoRoot": "/srv/ws" });
    let got = assess_with(vec![private.clone(), inside, bound_back.clone()], &request);
    assert_eq!(got.len(), 2, "{got:?}");
    assert!(got
        .iter()
        .all(|(code, _)| code == "machine-private-hides-workspace"));
    assert!(got[0].1.contains("the cwd \"/srv/fgos/work\""), "{got:?}");
    assert!(
        got[1].1.contains("the docs mount \"/srv/fgos/docs\""),
        "{got:?}"
    );
    assert!(
        assess_with(vec![private, bound_back], &policy_request()).is_empty(),
        "a mount bound back after the mask is not refused"
    );
}

#[test]
fn a_confinement_root_inside_a_writable_grant_is_refused() {
    let private = resource(
        "hidden-root",
        "/srv/fgos",
        "/srv/fgos",
        json!({ "machinePrivate": true }),
    );
    let temp = resource(
        "private-home",
        "/srv/w/tmp/home",
        "/home/w",
        json!({ "confinementRoot": true }),
    );
    let writable = resource(
        "workspace",
        "/srv/w",
        "/srv/w",
        json!({ "access": "write" }),
    );
    let got = assess_with(vec![private, temp, writable], &policy_request());
    assert!(
        got.iter().any(
            |(code, detail)| code == "confinement-root-in-writable-grant"
                && detail.contains("inside the writable workspace mount \"/srv/w\"")
        ),
        "{got:?}"
    );
}

#[test]
fn a_blind_request_refuses_a_workspace_or_ref_the_mask_would_hide() {
    let hidden = resource(
        "hidden-root",
        "/srv/fgos/assignments",
        "/srv/fgos/assignments",
        json!({}),
    );
    let own = resource(
        "own-assignment",
        "/srv/fgos/assignments/d1",
        "/srv/fgos/assignments/d1",
        json!({}),
    );
    let mut request = policy_request();
    request["requirement"]["policy"]["controls"]["hostRead"] = json!("blind");
    request["context"] = json!({ "cwd": "/srv/fgos/assignments/x", "repoRoot": "/srv/ws", "contextRefs": [
        "/srv/fgos/assignments/other/brief.md", "/srv/fgos/assignments/d1/brief.md", "https://example.test/a", "ws:thing" ] });
    let got = assess_with(vec![hidden, own], &request);
    let codes: Vec<&str> = got.iter().map(|(c, _)| c.as_str()).collect();
    assert_eq!(
        codes,
        ["blind-hides-workspace", "blind-ref-hidden"],
        "{got:?}"
    );
    assert!(got[1]
        .1
        .contains("\"/srv/fgos/assignments/other/brief.md\""));
}

#[test]
fn an_unresolvable_request_carries_the_resolvers_code_and_an_isolation_overlap_marks_host_write_unsatisfied(
) {
    let coded = DriverError::coded(
        fgos_execution_engine::confinement::driver::ErrorKind::Port,
        "grant-needs-run-dir",
        "run-output needs a runDir",
    );
    let driver = driver_with(
        Arc::new(FixedResolver(Err(coded))),
        Arc::new(RecordingHomes::default()),
        FakeCredentials::default(),
        env_of(&[]),
    );
    let a = driver
        .assess(&policy_request(), &json!({ "config": { "type": "bwrap" } }))
        .unwrap();
    assert!(a
        .mismatches
        .iter()
        .any(|m| m.code == "grant-needs-run-dir" && m.detail == "run-output needs a runDir"));

    let writable = resource(
        "workspace",
        "/srv/state",
        "/srv/state",
        json!({ "access": "write" }),
    );
    let driver = driver_with(
        Arc::new(FixedResolver(Ok(vec![writable.clone()]))),
        Arc::new(RecordingHomes::default()),
        FakeCredentials::default(),
        env_of(&[("FGOS_CONFINEMENT_ATTESTATION_STORE_PATH", "/srv/state/att")]),
    );
    let a = driver
        .assess(&policy_request(), &json!({ "config": { "type": "bwrap" } }))
        .unwrap();
    assert!(a
        .mismatches
        .iter()
        .any(|m| m.code == "confinement-grant-invalid" && m.detail.contains("(fail closed)")));
    assert_eq!(a.coverage["control:hostWrite"], "unsatisfied");
    // And prepare refuses the same plan before it materialises a mount.
    let err = driver
        .prepare(
            &json!({ "coverage": {}, "resources": [writable] }),
            &policy_request(),
            &json!({}),
        )
        .unwrap_err();
    assert!(err.message.contains("(fail closed)"), "{err}");
}

#[test]
fn the_runtime_socket_directory_follows_xdg_runtime_dir_then_the_users_tmp_directory() {
    let with = driver_with(
        empty_resolver(),
        Arc::new(RecordingHomes::default()),
        FakeCredentials::default(),
        env_of(&[("XDG_RUNTIME_DIR", "/run/user/7")]),
    );
    assert_eq!(with.runtime_socket_dir(), "/run/user/7/fgos");
    for env in [env_of(&[]), env_of(&[("XDG_RUNTIME_DIR", "relative/dir")])] {
        let without = driver_with(
            empty_resolver(),
            Arc::new(RecordingHomes::default()),
            FakeCredentials::default(),
            env,
        );
        assert_eq!(without.runtime_socket_dir(), "/tmp/fgos-1000");
    }
}

// ---- private home and login provisioning ------------------------------------------------------------------------

struct Fixture {
    dir: PathBuf,
    login_home: PathBuf,
    home: PathBuf,
}

fn fixture(label: &str) -> Fixture {
    let dir = scratch(label);
    let login_home = dir.join("login");
    std::fs::create_dir_all(login_home.join(".codex")).unwrap();
    std::fs::write(login_home.join(".codex/auth.json"), "{\"token\":\"x\"}").unwrap();
    std::fs::write(login_home.join("other.txt"), "no").unwrap();
    Fixture {
        home: dir.join("tmp/d1/home"),
        dir,
        login_home,
    }
}

fn home_plan(f: &Fixture) -> Value {
    json!({ "coverage": {}, "resources": [resource("private-home", f.home.to_str().unwrap(), "/home/w", json!({
        "access": "read-write", "allocation": "temporary", "tempRoot": f.dir.join("tmp").to_str().unwrap() }))] })
}

fn home_request(f: &Fixture, attempt: bool) -> Value {
    let mut request = json!({
        "dispatchId": "d1",
        "context": { "runDir": f.dir.join("run").to_str().unwrap() },
        "invocation": { "command": "codex", "args": ["go"], "env": { "CODEX_HOME": "/real" },
            "credentialStore": { "use": "codex", "homeEnv": "CODEX_HOME", "files": [".codex/auth.json"] } },
        "providerCapacity": { "accountId": "acct", "credentialWriteBack": { "runtimeDir": "/srv/rt" },
            "credentialSource": { "kind": "home-files", "home": f.login_home.to_str().unwrap(), "files": ["other.txt"] } },
    });
    if attempt {
        request["attemptId"] = json!("a1");
    }
    request
}

fn private_driver(homes: &Arc<RecordingHomes>, credentials: FakeCredentials) -> BwrapDriver {
    driver_with(
        empty_resolver(),
        homes.clone(),
        credentials,
        env_of(&[
            ("FGOS_CONFINEMENT_ATTESTATION_STORE_PATH", "/srv/state/att"),
            ("HOME", "/home/u"),
        ]),
    )
}

#[test]
fn a_temporary_private_home_receives_the_logins_the_store_declares_and_is_removed_by_its_dispatch()
{
    let f = fixture("home");
    let homes = Arc::new(RecordingHomes::default());
    let driver = private_driver(&homes, FakeCredentials::default());
    let prepared = driver
        .prepare(&home_plan(&f), &home_request(&f, false), &json!({}))
        .unwrap();
    assert!(
        f.home.join(".codex/auth.json").is_file(),
        "the store's own file list wins over the account's"
    );
    assert!(
        !f.home.join("other.txt").exists(),
        "nothing outside the list is copied"
    );
    assert_eq!(
        prepared.provider_capacity,
        Some(json!({ "credentialProvisioned": true }))
    );
    assert_eq!(
        prepared.credential_write_back, None,
        "a dispatch outside the assignment door is not written back"
    );
    assert_eq!(
        prepared.invocation["env"]["CODEX_HOME"], "/home/w",
        "the home variable names the private home, not the real store"
    );
    let args: Vec<&str> = prepared.invocation["args"]
        .as_array()
        .unwrap()
        .iter()
        .map(|a| a.as_str().unwrap())
        .collect();
    assert!(args
        .windows(3)
        .any(|w| w == ["--bind", f.home.to_str().unwrap(), "/home/w"]));
    let calls = homes.calls();
    assert!(
        calls[0].starts_with("ensure ")
            && calls[0].ends_with(&format!("under {}", f.dir.join("tmp").display())),
        "{calls:?}"
    );
    assert_eq!(
        calls[1],
        format!("ownership-marker {} d1 private-home", f.home.display())
    );
    bwrap::cleanup_prepared(&prepared, homes.as_ref()).unwrap();
    assert!(
        !f.home.exists(),
        "the settle removes exactly the home the launch allocated"
    );
}

#[test]
fn an_attempt_home_is_marked_for_its_attempt_recorded_beside_it_and_written_back() {
    let f = fixture("attempt");
    let homes = Arc::new(RecordingHomes::default());
    let driver = private_driver(&homes, FakeCredentials::default());
    let prepared = driver
        .prepare(&home_plan(&f), &home_request(&f, true), &json!({}))
        .unwrap();
    assert_eq!(
        prepared.credential_write_back,
        Some(json!({ "accountId": "acct", "runtimeDir": "/srv/rt" }))
    );
    let calls = homes.calls();
    assert_eq!(calls[1], format!("attempt-marker {} a1", f.home.display()));
    assert!(
        calls[2].starts_with("home-record ") && calls[2].ends_with("a1.home-record"),
        "{calls:?}"
    );
}

#[test]
fn a_failed_preparation_removes_the_home_and_the_records_it_made() {
    let f = fixture("rollback");
    let homes = Arc::new(RecordingHomes {
        fail_record: true,
        ..RecordingHomes::default()
    });
    let driver = private_driver(&homes, FakeCredentials::default());
    let err = driver
        .prepare(&home_plan(&f), &home_request(&f, true), &json!({}))
        .unwrap_err();
    assert_eq!(err.message, "record refused");
    assert!(!f.home.exists(), "the allocated home is gone");
    assert!(homes
        .calls()
        .iter()
        .any(|c| c == &format!("cleanup {} d1", f.home.display())));
}

#[test]
fn the_login_copy_refuses_the_launch_instead_of_starting_a_logged_out_worker() {
    let prepare = |label: &str, mutate: &dyn Fn(&mut Value), credentials: FakeCredentials| {
        let f = fixture(label);
        let mut request = home_request(&f, false);
        mutate(&mut request);
        private_driver(&Arc::new(RecordingHomes::default()), credentials)
            .prepare(&home_plan(&f), &request, &json!({}))
            .unwrap_err()
    };
    let err = prepare(
        "empty",
        &|r| r["invocation"]["credentialStore"]["files"] = json!(["missing.json"]),
        FakeCredentials::default(),
    );
    assert_eq!(err.code.as_deref(), Some("credential-provisioning"));
    assert!(err.message.starts_with("credential-store-empty: account \"acct\" has none of [missing.json] of store \"codex\" under "), "{err}");
    let err = prepare(
        "life",
        &|_| {},
        FakeCredentials {
            life_problem: Some("login expires in 10s".into()),
        },
    );
    assert_eq!(err.message, "account \"acct\": login expires in 10s");
    let err = prepare(
        "kind",
        &|r| r["providerCapacity"]["credentialSource"]["kind"] = json!("vault"),
        FakeCredentials::default(),
    );
    assert_eq!(
        err.message,
        "unsupported provider credential source kind \"vault\""
    );
    let err = prepare(
        "files",
        &|r| r["providerCapacity"]["credentialSource"]["files"] = json!([]),
        FakeCredentials::default(),
    );
    assert_eq!(
        err.message,
        "selected home-files credential needs an absolute \"home\" and a non-empty \"files\" list"
    );
    let err = prepare(
        "codex-home",
        &|r| {
            r["providerCapacity"]["credentialSource"] =
                json!({ "kind": "codex-home", "home": "relative" })
        },
        FakeCredentials::default(),
    );
    assert_eq!(
        err.message,
        "selected Codex credential needs an absolute \"home\""
    );
    let err = prepare(
        "per-cli",
        &|r| {
            r["providerCapacity"]["credentialSource"] = Value::Null;
            r["providerCapacity"]["credentialSources"] = json!({ "pi": {} });
            r["providerCapacity"]["credentialCli"] = json!("codex");
        },
        FakeCredentials::default(),
    );
    assert_eq!(
        err.message,
        "account \"acct\" declares no credential source for CLI \"codex\""
    );
}

#[test]
fn a_request_that_declares_no_store_or_no_source_provisions_nothing() {
    let f = fixture("none");
    let homes = Arc::new(RecordingHomes::default());
    let mut request = home_request(&f, false);
    request["invocation"]["credentialStore"] = Value::Null;
    let prepared = private_driver(&homes, FakeCredentials::default())
        .prepare(&home_plan(&f), &request, &json!({}))
        .unwrap();
    assert_eq!(prepared.provider_capacity, None);
    assert!(!f.home.join(".codex").exists());
    let mut request = home_request(&f, false);
    request["providerCapacity"]["credentialSource"] = Value::Null;
    let prepared = private_driver(&homes, FakeCredentials::default())
        .prepare(&home_plan(&f), &request, &json!({}))
        .unwrap();
    assert_eq!(prepared.provider_capacity, None);
}

#[test]
fn a_home_written_with_a_tilde_or_home_variable_expands_to_the_users_home() {
    let f = fixture("tilde");
    let user_home = f.dir.join("userhome");
    std::fs::create_dir_all(user_home.join(".codex")).unwrap();
    std::fs::write(user_home.join(".codex/auth.json"), "{}").unwrap();
    for spelling in ["~", "$HOME", "${HOME}"] {
        let driver = driver_with(
            empty_resolver(),
            Arc::new(RecordingHomes::default()),
            FakeCredentials::default(),
            env_of(&[
                ("HOME", user_home.to_str().unwrap()),
                ("FGOS_CONFINEMENT_ATTESTATION_STORE_PATH", "/srv/state/att"),
            ]),
        );
        let _ = std::fs::remove_dir_all(&f.home);
        let mut request = home_request(&f, false);
        request["providerCapacity"]["credentialSource"]["home"] = json!(spelling);
        let prepared = driver
            .prepare(&home_plan(&f), &request, &json!({}))
            .unwrap();
        assert_eq!(
            prepared.provider_capacity,
            Some(json!({ "credentialProvisioned": true })),
            "{spelling}"
        );
    }
}

// ---- smoke test --------------------------------------------------------------------------------------------------

#[cfg(unix)]
#[test]
fn the_smoke_test_passes_a_binary_that_runs_and_names_one_that_fails_or_is_missing() {
    use std::os::unix::fs::PermissionsExt;
    let dir = scratch("smoke");
    let write = |name: &str, body: &str| {
        let path = dir.join(name);
        std::fs::write(&path, format!("#!/bin/sh\n{body}\n")).unwrap();
        std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o755)).unwrap();
        path
    };
    let args_file = dir.join("args.txt");
    let good = write(
        "good-bwrap",
        &format!("echo \"$@\" > '{}'", args_file.display()),
    );
    let bad = write("bad-bwrap", "exit 3");
    let probe = SmokeProbe::new();
    let passed = probe.check(good.to_str().unwrap(), "");
    assert!(passed.passed, "{passed:?}");
    assert_eq!(
        passed.message,
        format!(
            "{} is available on PATH and smoke test (bwrap --ro-bind / / -- true) passed",
            good.display()
        )
    );
    assert_eq!(
        std::fs::read_to_string(&args_file).unwrap().trim(),
        "--ro-bind / / -- true"
    );
    let failed = probe.check(bad.to_str().unwrap(), "");
    assert!(
        !failed.passed
            && failed.message.starts_with(&format!(
                "{} is unavailable or failed smoke test: ",
                bad.display()
            )),
        "{failed:?}"
    );
    let missing = probe.check("no-such-bwrap-binary", &dir.to_string_lossy());
    assert!(
        !missing.passed
            && missing
                .message
                .contains("is unavailable or failed smoke test"),
        "{missing:?}"
    );
}

#[cfg(unix)]
#[test]
fn the_smoke_result_of_the_default_binary_name_is_kept_for_the_life_of_the_probe() {
    let dir = scratch("smoke-cache");
    let probe = SmokeProbe::new();
    let first = probe.check("bwrap", &dir.to_string_lossy());
    assert!(!first.passed, "no bwrap in an empty PATH directory");
    use std::os::unix::fs::PermissionsExt;
    let path = dir.join("bwrap");
    std::fs::write(&path, "#!/bin/sh\nexit 0\n").unwrap();
    std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o755)).unwrap();
    assert_eq!(
        probe.check("bwrap", &dir.to_string_lossy()),
        first,
        "the first answer for the default name is kept"
    );
    assert!(
        SmokeProbe::new()
            .check("bwrap", &dir.to_string_lossy())
            .passed,
        "a fresh probe asks again"
    );
}

#[test]
fn a_prepared_invocation_keeps_the_requests_keys_in_place_and_overrides_command_args_and_env() {
    // The prepared invocation keeps every key the request's invocation had, in its place, and overrides three.
    let driver = vector_driver();
    let mut request = policy_request();
    request["invocation"] = json!({ "adapter": "a", "command": "agent", "extra": 1, "args": ["x"], "env": { "A": "1" } });
    let prepared = driver
        .prepare(
            &json!({ "coverage": {}, "resources": [] }),
            &request,
            &json!({ "config": { "executable": "/o/bwrap" } }),
        )
        .unwrap();
    let keys: Vec<&str> = prepared
        .invocation
        .as_object()
        .unwrap()
        .keys()
        .map(String::as_str)
        .collect();
    assert_eq!(keys, ["adapter", "command", "extra", "args", "env"]);
    assert_eq!(prepared.invocation["command"], "/o/bwrap");
}
