//! The transport base replays the vectors recorded from the Node modules it ports
//! (`packages/execution/contracts/transport/`, recorded by `test/golden-recorders/transport.recorder.mjs`), and
//! proves the boot of a worker session against fakes, since it starts and watches real processes.

use std::cell::{Cell, RefCell};
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use fgos_execution_engine::transport::adapters::*;
use fgos_execution_engine::transport::mechanism::*;
use fgos_execution_engine::transport::provider_adapter::*;
use fgos_execution_engine::transport::terminal_slot::*;
use fgos_execution_engine::transport::visibility_session::*;
use fgos_execution_engine::transport::worker_home::*;
use fgos_execution_engine::transport::worker_session::*;
use fgos_execution_engine::transport::worker_session_boot::*;
use serde_json::{json, Map, Value};

fn vectors(name: &str) -> Value {
    let path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../contracts/transport")
        .join(name);
    serde_json::from_str(
        &std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display())),
    )
    .unwrap()
}

fn scratch(tag: &str) -> PathBuf {
    use std::sync::atomic::{AtomicU32, Ordering};
    static N: AtomicU32 = AtomicU32::new(0);
    let dir = std::env::temp_dir().join(format!(
        "fgos-transport-{tag}-{}-{}",
        std::process::id(),
        N.fetch_add(1, Ordering::SeqCst)
    ));
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

fn strs(value: &Value) -> Vec<String> {
    value
        .as_array()
        .map(|all| {
            all.iter()
                .filter_map(|v| v.as_str().map(String::from))
                .collect()
        })
        .unwrap_or_default()
}

fn opt(value: &Value) -> Option<&str> {
    value.as_str()
}

fn error_code(out: &Value) -> Option<&str> {
    out["error"]["code"].as_str()
}

// ---- mechanism -------------------------------------------------------------------------------------------

#[test]
fn mechanism_follows_the_doctrine_over_every_combination_of_its_three_facts() {
    let v = vectors("mechanism.v1.json");
    for case in v["table"].as_array().unwrap() {
        let input = &case["in"];
        let flag = |k: &str| input[k].as_bool().unwrap_or(false);
        let got = decide_dispatch_mechanism(MechanismFacts {
            has_native_mechanism: flag("hasNativeMechanism"),
            has_live_task_access: flag("hasLiveTaskAccess"),
            force_cli_spawn: flag("forceCliSpawn"),
        });
        assert_eq!(got.as_str(), case["out"], "{case}");
    }
}

#[test]
fn executor_mechanism_treats_a_cli_shaped_executor_as_out_of_process_whatever_the_session_declares()
{
    let v = vectors("mechanism.v1.json");
    for case in v["executorCases"].as_array().unwrap() {
        let got = fgos_execution::executor_model::mechanism(
            &v["cfg"],
            opt(&case["executorId"]),
            case["hasLiveTaskAccess"].as_bool().unwrap(),
        );
        assert_eq!(got.as_str(), case["out"], "{case}");
    }
    for case in v["lookups"].as_array().unwrap() {
        let got =
            fgos_execution::executor_model::mechanism(&case["cfg"], opt(&case["executorId"]), true);
        assert_eq!(got.as_str(), case["out"], "{case}");
    }
}

// ---- adapters --------------------------------------------------------------------------------------------

#[test]
fn adapter_registry_names_and_metadata_match_the_recorded_registry() {
    let v = vectors("adapters.v1.json");
    assert_eq!(DEFAULT_ADAPTER, v["defaultAdapter"]);
    assert_eq!(json!(EXECUTOR_ADAPTER_NAMES), v["names"]);
    for (name, meta) in v["registry"].as_object().unwrap() {
        assert_eq!(&adapter_metadata(name).unwrap().to_json(), meta, "{name}");
    }
    for case in v["metadata"].as_array().unwrap() {
        let got = adapter_metadata(case["name"].as_str().unwrap())
            .map_or(Value::Null, AdapterMetadata::to_json);
        assert_eq!(got, case["out"]);
    }
    assert_eq!(MAX_DISPATCH_DEPTH, v["maxDispatchDepth"]);
    assert_eq!(DISPATCH_DEPTH_ENV, v["depthEnv"]);
    assert_eq!(
        (CASE_ID_ENV, CASE_RESERVATION_ENV),
        (
            v["caseEnv"]["id"].as_str().unwrap(),
            v["caseEnv"]["reservation"].as_str().unwrap()
        )
    );
    let pairs: Map<String, Value> = case_context_env("case-1", "res-1")
        .into_iter()
        .map(|(k, v)| (k.to_string(), json!(v)))
        .collect();
    assert_eq!(Value::Object(pairs), v["caseEnv"]["out"]);
}

#[test]
fn dispatch_depth_reads_a_finite_non_negative_number_and_nothing_else() {
    for case in vectors("adapters.v1.json")["depth"].as_array().unwrap() {
        assert_eq!(
            dispatch_depth_of(opt(&case["raw"])),
            case["out"].as_f64().unwrap(),
            "{case}"
        );
    }
}

#[test]
fn executor_env_expands_references_and_drops_what_is_not_text() {
    for case in vectors("adapters.v1.json")["executorEnv"]
        .as_array()
        .unwrap()
    {
        let base = case["base"].as_object().unwrap().clone();
        let lookup = move |name: &str| base.get(name).and_then(Value::as_str).map(String::from);
        assert_eq!(
            Value::Object(resolve_executor_env(&case["raw"], &lookup)),
            case["out"],
            "{case}"
        );
    }
}

#[test]
fn worker_environment_is_the_allowlist_alone_and_pins_the_state_root_when_known() {
    let v = vectors("adapters.v1.json");
    let base: Vec<(String, String)> = v["workerEnvBase"]
        .as_object()
        .unwrap()
        .iter()
        .map(|(k, v)| (k.clone(), v.as_str().unwrap().to_string()))
        .collect();
    let view = || {
        base.iter()
            .map(|(k, v)| (k.as_str(), v.as_str()))
            .collect::<Vec<_>>()
    };
    let unpinned: Map<String, Value> = worker_base_env(view(), None)
        .into_iter()
        .map(|(k, v)| (k, json!(v)))
        .collect();
    assert_eq!(Value::Object(unpinned), v["workerEnvWithoutRoot"]);
    let pinned = worker_base_env(view(), Some("/state"));
    assert_eq!(
        pinned.last(),
        Some(&("FGOS_STATE_ROOT".to_string(), "/state".to_string()))
    );
    assert_eq!(
        pinned.len(),
        v["workerEnvWithoutRoot"].as_object().unwrap().len() + 1
    );
}

// ---- provider adapter ------------------------------------------------------------------------------------

#[test]
fn policy_shaped_flags_are_extracted_in_first_seen_order_and_the_registry_matches() {
    let v = vectors("provider-adapter.v1.json");
    for (family, flags) in v["knownFlags"].as_object().unwrap() {
        assert_eq!(json!(known_policy_shaped_flags(family)), *flags, "{family}");
    }
    for case in v["extract"].as_array().unwrap() {
        assert_eq!(
            json!(extract_policy_shaped_flags(&strs(&case["args"]))),
            case["out"],
            "{case}"
        );
    }
    for case in v["policyFlagsFor"].as_array().unwrap() {
        assert_eq!(
            json!(provider_policy_shaped_flags(opt(&case["family"]), None)),
            case["out"],
            "{case}"
        );
    }
    for case in v["policyFlagsByCommand"].as_array().unwrap() {
        assert_eq!(
            json!(provider_policy_shaped_flags(None, opt(&case["command"]))),
            case["out"],
            "{case}"
        );
    }
}

#[test]
fn a_candidate_provider_is_judged_against_the_deny_list_in_one_vocabulary() {
    let v = vectors("provider-adapter.v1.json");
    for case in v["disallowed"].as_array().unwrap() {
        let deny: Option<Vec<Value>> = case["deny"].as_array().cloned();
        let got = check_provider_disallowed(
            deny.as_deref(),
            opt(&case["candidate"]),
            opt(&case["command"]),
        );
        assert_eq!(got.to_json(), case["out"], "{case}");
        assert_eq!(
            is_provider_disallowed(
                deny.as_deref(),
                opt(&case["candidate"]),
                opt(&case["command"])
            ),
            got.disallowed
        );
    }
    for case in v["normalized"].as_array().unwrap() {
        let got: Vec<String> = normalize_disallowed_providers(case["deny"].as_array().unwrap())
            .into_iter()
            .collect();
        assert_eq!(json!(got), case["out"]);
    }
}

#[test]
fn reasoning_effort_is_rendered_into_the_flag_each_cli_takes() {
    let v = vectors("provider-adapter.v1.json");
    for case in v["effortLevels"].as_array().unwrap() {
        assert_eq!(
            json!(rendered_effort_levels(opt(&case["command"]))),
            case["out"],
            "{case}"
        );
    }
    for case in v["effort"].as_array().unwrap() {
        let got = render_reasoning_effort_args(
            opt(&case["command"]),
            &strs(&case["args"]),
            case["effort"].as_str().unwrap(),
        );
        assert_eq!(
            got.map_or(Value::Null, |r| r.to_json()),
            case["out"],
            "{case}"
        );
    }
}

#[test]
fn launched_model_warnings_name_an_override_an_unpassed_model_and_what_the_cli_itself_says() {
    let v = vectors("provider-adapter.v1.json");
    for case in v["modelChecks"].as_array().unwrap() {
        let got = check_launched_model(
            opt(&case["requested"]),
            opt(&case["launched"]),
            &strs(&case["args"]),
        );
        assert_eq!(got.to_json(), case["out"], "{case}");
    }
    for case in v["modelWarnings"].as_array().unwrap() {
        let check = &case["check"];
        let model = check_launched_model(
            opt(&check["requested"]),
            opt(&check["launched"]),
            &strs(&check["args"]),
        );
        let out = &case["output"];
        let got = collect_model_warnings(
            Some(&model),
            out["stdout"].as_str().unwrap(),
            out["stderr"].as_str().unwrap(),
        );
        assert_eq!(Value::Array(got), case["out"], "{case}");
    }
    assert!(collect_model_warnings(None, "", "").is_empty());
}

// ---- visibility ------------------------------------------------------------------------------------------

fn lay_out(files: &Value) -> PathBuf {
    let dir = scratch("run");
    for (name, body) in files.as_object().unwrap() {
        let file = dir.join(name);
        std::fs::create_dir_all(file.parent().unwrap()).unwrap();
        let text = body.as_str().map_or_else(|| body.to_string(), String::from);
        std::fs::write(file, text).unwrap();
    }
    dir
}

fn relative(dir: &Path, path: &Option<PathBuf>) -> Value {
    path.as_ref().map_or(Value::Null, |p| {
        json!(p.strip_prefix(dir).unwrap().to_string_lossy())
    })
}

fn stamp() -> String {
    "2026-01-01T00:00:00.000Z".to_string()
}

#[test]
fn every_class_of_run_outcome_is_classified_as_the_node_door_classified_it() {
    for case in vectors("visibility.v1.json")["classes"].as_array().unwrap() {
        let dir = lay_out(&case["files"]);
        let liveness = case["liveness"].as_str().unwrap_or("unknown");
        let got = match classify_run_outcome(&dir, liveness) {
            Ok(c) => {
                json!({ "ok": { "outcome": c.outcome.as_str(), "resultPath": relative(&dir, &c.result_path), "changed": c.changed } })
            }
            Err(e) => json!({ "error": { "code": e.code } }),
        };
        let want = &case["out"];
        if want.get("error").is_some() {
            assert_eq!(error_code(&got), error_code(want), "{}", case["name"]);
        } else {
            assert_eq!(&got, want, "{}", case["name"]);
        }
    }
}

#[test]
fn reconcile_writes_the_decision_into_the_run_record_and_stamps_the_visibility_record() {
    for case in vectors("visibility.v1.json")["reconcile"]
        .as_array()
        .unwrap()
    {
        let dir = lay_out(&case["files"]);
        let got = reconcile_run(&dir, case["liveness"].as_str().unwrap(), &stamp).unwrap();
        let want = &case["out"]["ok"];
        assert_eq!(got.outcome.as_str(), want["outcome"], "{}", case["name"]);
        assert_eq!(got.changed, want["changed"].as_bool().unwrap());
        assert_eq!(relative(&dir, &got.result_path), want["resultPath"]);
        let read = |file: &str| -> Value {
            let mut json: Value =
                serde_json::from_str(&std::fs::read_to_string(dir.join(file)).unwrap()).unwrap();
            for key in ["reconciledAt", "lastSeenAt"] {
                json.as_object_mut().unwrap().remove(key);
            }
            json
        };
        assert_eq!(read("run.json"), case["run"], "{}", case["name"]);
        assert_eq!(
            read("visibility.json"),
            case["visibility"],
            "{}",
            case["name"]
        );
    }
}

#[test]
fn a_run_is_marked_settled_once_and_only_with_a_known_status() {
    let v = vectors("visibility.v1.json");
    for case in v["settle"].as_array().unwrap() {
        let dir = lay_out(&json!({ "run.json": { "status": "running" } }));
        let got = mark_run_settled(&dir, case["status"].as_str().unwrap(), &stamp);
        match (&case["out"]["ok"], got) {
            (Value::Bool(want), Ok(changed)) => assert_eq!(changed, *want, "{case}"),
            (_, Err(e)) => assert_eq!(Some(e.code), error_code(&case["out"]), "{case}"),
            (want, got) => panic!("{want} vs {got:?}"),
        }
    }
    let settled = lay_out(&json!({ "run.json": { "status": "settled" } }));
    assert_eq!(
        mark_run_settled(&settled, "settled", &stamp).unwrap(),
        v["settleAgain"].as_bool().unwrap()
    );
    let missing = lay_out(&json!({}));
    assert_eq!(
        mark_run_settled(&missing, "settled", &stamp).unwrap(),
        v["settleMissing"].as_bool().unwrap()
    );
    assert_eq!(json!(VISIBILITY_STATES), v["states"]);
    assert_eq!(json!(RUN_STATUSES), v["runStatuses"]);
}

#[test]
fn visibility_merges_each_patch_into_the_record_and_refuses_an_unknown_state_or_a_corrupt_file() {
    let steps = vectors("visibility.v1.json")["visibility"]["steps"]
        .as_array()
        .unwrap()
        .clone();
    let dir = lay_out(&json!({}));
    assert_eq!(
        write_visibility(&dir, &steps[0]["patch"], &stamp).unwrap(),
        steps[0]["out"]
    );
    assert_eq!(
        write_visibility(&dir, &steps[1]["patch"], &stamp).unwrap(),
        steps[1]["out"]
    );
    let refused = write_visibility(&dir, &steps[2]["patch"], &stamp).unwrap_err();
    assert_eq!(Some(refused.code), error_code(&steps[2]["out"]));
    assert_eq!(mark_detached(&dir, &stamp).unwrap(), steps[3]["out"]);
    std::fs::write(dir.join("visibility.json"), "{bad").unwrap();
    assert_eq!(
        read_visibility(&dir).unwrap_err().code,
        error_code(&steps[4]["out"]).unwrap()
    );
}

#[test]
fn only_a_run_that_says_running_and_whose_attempt_lock_is_free_is_an_orphan() {
    let fgos = scratch("fgos");
    let mk = |rel: &str, status: &str| {
        let dir = fgos.join(rel);
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(
            dir.join("run.json"),
            json!({ "status": status, "runId": rel, "startedAt": "t" }).to_string(),
        )
        .unwrap();
        dir
    };
    mk("assignments/a1/producer/1/runs/01", "running");
    mk("assignments/a1/producer/1/runs/02", "settled");
    mk("assignments/b/runs/01", "running");
    mk("dispatch-runs/w1/20260101", "running");
    let found = find_running_runs(&fgos);
    let ids: Vec<_> = found
        .iter()
        .map(|r| (r.assignment_id.clone(), r.run_id.clone().unwrap()))
        .collect();
    assert_eq!(
        ids,
        vec![
            (
                Some("a1/producer/1".into()),
                "assignments/a1/producer/1/runs/01".to_string()
            ),
            (Some("b".into()), "assignments/b/runs/01".to_string()),
            (None, "dispatch-runs/w1/20260101".to_string()),
        ]
    );
    assert_eq!(
        attempt_lock_state(&fgos.join("assignments/b/runs/01")),
        LockState::Free
    );
}

// ---- terminal slot ---------------------------------------------------------------------------------------

#[test]
fn terminal_slot_names_keys_display_facts_and_refusals_as_recorded() {
    let v = vectors("terminal-slot.v1.json");
    for case in v["herdrBin"].as_array().unwrap() {
        let env = case["env"].as_object().unwrap().clone();
        let lookup = move |name: &str| env.get(name).and_then(Value::as_str).map(String::from);
        assert_eq!(
            resolve_herdr_bin(opt(&case["opt"]), &lookup),
            case["out"].as_str().unwrap(),
            "{case}"
        );
    }
    for case in v["endpointEnv"].as_array().unwrap() {
        assert_eq!(
            Value::Object(herdr_endpoint_env(case["env"].as_object().unwrap())),
            case["out"]
        );
    }
    for case in v["portKey"].as_array().unwrap() {
        let args = case["args"].as_array().unwrap();
        let fallback = args.get(1).and_then(Value::as_str).unwrap_or("run");
        assert_eq!(
            port_key(opt(&args[0]), fallback),
            case["out"].as_str().unwrap(),
            "{case}"
        );
    }
    for case in v["driverCode"].as_array().unwrap() {
        let r = &case["refusal"];
        assert_eq!(
            driver_code_of(opt(&r["reason"]), opt(&r["detail"])).map_or(Value::Null, Value::String),
            case["out"],
            "{case}"
        );
    }
    for case in v["refusal"].as_array().unwrap() {
        let r = &case["refusal"];
        let view = RefusalView {
            result: r["result"].as_str().unwrap(),
            reason: opt(&r["reason"]),
            detail: opt(&r["detail"]),
            capability: opt(&r["capability"]),
        };
        let got = refusal_error(view, case["what"].as_str().unwrap());
        let want = &case["out"];
        assert_eq!(
            (got.code.as_str(), got.message.as_str()),
            (
                want["code"].as_str().unwrap(),
                want["message"].as_str().unwrap()
            ),
            "{case}"
        );
        assert_eq!(
            got.capability.map_or(Value::Null, Value::String),
            want["capability"]
        );
    }
    for case in v["workLabel"].as_array().unwrap() {
        assert_eq!(work_label_of(&case["assignment"]), case["out"], "{case}");
    }
    for case in v["display"].as_array().unwrap() {
        assert_eq!(slot_display(&case["args"]), case["out"], "{case}");
    }
}

// ---- worker session --------------------------------------------------------------------------------------

fn env_of(value: &Value) -> Env {
    value
        .as_object()
        .map(|m| {
            m.iter()
                .map(|(k, v)| (k.clone(), v.as_str().unwrap().to_string()))
                .collect()
        })
        .unwrap_or_default()
}

fn env_json(env: &Env) -> Value {
    json!(env)
}

#[test]
fn a_worker_is_never_addressed_into_the_operators_session_and_its_pane_identity_is_dropped() {
    let v = vectors("worker-session.v1.json");
    for case in v["assert"].as_array().unwrap() {
        let target = case["target"].as_str().unwrap_or("");
        let got = assert_not_operator_session(target, &env_of(&case["env"]));
        let want = if case["out"].get("error").is_some() {
            error_code(&case["out"])
        } else {
            None
        };
        assert_eq!(got.err().map(|e| e.code), want, "{case}");
    }
    for case in v["forSession"].as_array().unwrap() {
        assert_eq!(
            env_json(&env_for_session(
                &env_of(&case["base"]),
                case["name"].as_str().unwrap()
            )),
            case["out"]
        );
    }
    for case in v["isolated"].as_array().unwrap() {
        let got = isolated_session_env(&env_of(&case["caller"]), case["target"].as_str().unwrap());
        match (&case["out"]["ok"], got) {
            (Value::Object(_), Ok(env)) => assert_eq!(env_json(&env), case["out"]["ok"], "{case}"),
            (_, Err(e)) => assert_eq!(Some(e.code), error_code(&case["out"]), "{case}"),
            (want, got) => panic!("{want} vs {got:?}"),
        }
    }
}

// ---- worker home -----------------------------------------------------------------------------------------

fn source_home(trusted: &Value) -> PathBuf {
    let home = scratch("src");
    std::fs::create_dir_all(home.join(".claude")).unwrap();
    std::fs::write(
        home.join(".claude").join(".credentials.json"),
        "{\"token\":\"t\"}",
    )
    .unwrap();
    let projects = if trusted.is_null() {
        json!({})
    } else {
        json!({ "/repo": { "hasTrustDialogAccepted": trusted } })
    };
    std::fs::write(
        home.join(".claude.json"),
        json!({ "projects": projects }).to_string(),
    )
    .unwrap();
    home
}

fn tree(dir: &Path) -> BTreeMap<String, (u32, String)> {
    fn walk(root: &Path, dir: &Path, out: &mut BTreeMap<String, (u32, String)>) {
        for entry in std::fs::read_dir(dir).unwrap().flatten() {
            let path = entry.path();
            if path.is_dir() {
                walk(root, &path, out);
            } else {
                #[cfg(unix)]
                let mode = std::os::unix::fs::MetadataExt::mode(&std::fs::metadata(&path).unwrap())
                    & 0o777;
                #[cfg(not(unix))]
                let mode = 0;
                out.insert(
                    path.strip_prefix(root)
                        .unwrap()
                        .to_string_lossy()
                        .into_owned(),
                    (mode, std::fs::read_to_string(&path).unwrap()),
                );
            }
        }
    }
    let mut out = BTreeMap::new();
    walk(dir, dir, &mut out);
    out
}

#[test]
fn a_worker_home_is_provisioned_with_the_five_items_or_refused_leaving_nothing() {
    let v = vectors("worker-home.v1.json");
    assert_eq!(
        BYPASS_ACCEPTANCE_SETTINGS,
        v["bypassAcceptance"]
            .as_object()
            .unwrap()
            .keys()
            .next()
            .unwrap()
    );
    for case in v["creations"].as_array().unwrap() {
        let base = scratch("base");
        let source = source_home(&case["trusted"]);
        let extra = &case["extra"];
        let run_id = extra["runId"].as_str().unwrap_or("run-1");
        let workspace = extra["workspacePath"].as_str().unwrap_or("/repo/wt");
        let want = &case["out"];
        let got = PermissionMode::parse(opt(&case["permissionMode"])).and_then(|mode| {
            create_worker_home(
                &base,
                &CreateWorkerHome {
                    run_id,
                    source_home: &source,
                    workspace_path: workspace,
                    repo_root: "/repo",
                    permission_mode: mode,
                },
            )
        });
        match (&want["ok"], got) {
            (Value::Object(ok), Ok(home)) => {
                assert_eq!(json!(home.provisioned), ok["provisioned"], "{case}");
                let name = home
                    .home_path
                    .file_name()
                    .unwrap()
                    .to_string_lossy()
                    .into_owned();
                assert!(
                    name.starts_with("worker-run-1-") && name.len() == "worker-run-1-".len() + 6,
                    "{name}"
                );
                let got_tree = tree(&home.home_path);
                let want_tree = ok["tree"].as_object().unwrap();
                assert_eq!(
                    got_tree.keys().collect::<Vec<_>>(),
                    want_tree.keys().collect::<Vec<_>>()
                );
                for (file, entry) in want_tree {
                    assert_eq!(
                        got_tree[file].1,
                        entry["content"].as_str().unwrap(),
                        "{file}"
                    );
                }
                #[cfg(unix)]
                assert_eq!(got_tree[".claude/.credentials.json"].0, 0o600);
            }
            (_, Err(e)) => assert_eq!(Some(e.code.as_str()), error_code(want), "{case}"),
            (want, got) => panic!("{want} vs {got:?}"),
        }
        let leftover = std::fs::read_dir(&base).unwrap().count() as u64;
        assert_eq!(leftover, case["leftover"].as_u64().unwrap(), "{case}");
    }
    let base = scratch("base");
    let source = source_home(&json!(true));
    std::fs::remove_file(source.join(".claude").join(".credentials.json")).unwrap();
    let got = create_worker_home(
        &base,
        &CreateWorkerHome {
            run_id: "r",
            source_home: &source,
            workspace_path: "/repo/wt",
            repo_root: "/repo",
            permission_mode: PermissionMode::Ask,
        },
    );
    assert_eq!(
        Some(got.unwrap_err().code.as_str()),
        error_code(&v["noCredential"]["out"])
    );
    assert_eq!(std::fs::read_dir(&base).unwrap().count(), 0);
}

struct NoProcesses;
impl HomeSweeper for NoProcesses {
    fn stop_inside(&self, _dir: &Path) -> Vec<u32> {
        Vec::new()
    }
}

struct Stuck(u32);
impl HomeSweeper for Stuck {
    fn stop_inside(&self, _dir: &Path) -> Vec<u32> {
        vec![self.0]
    }
}

#[test]
fn only_a_home_this_module_made_is_redacted_or_removed_and_a_live_process_in_it_blocks_removal() {
    let v = vectors("worker-home.v1.json");
    let base = scratch("base");
    let home = create_worker_home(
        &base,
        &CreateWorkerHome {
            run_id: "r",
            source_home: &source_home(&json!(true)),
            workspace_path: "/repo/wt",
            repo_root: "/repo",
            permission_mode: PermissionMode::Bypass,
        },
    )
    .unwrap()
    .home_path;
    let plain = scratch("plain");
    let code = |r: Result<bool, WorkerHomeError>| {
        r.map_or_else(
            |e| json!({ "error": { "name": "WorkerHomeError", "code": e.code } }),
            |b| json!({ "ok": b }),
        )
    };
    let steps = v["teardown"].as_array().unwrap();
    let step = |i: usize| steps[i]["out"].clone();
    assert_eq!(code(redact_worker_home(&plain)), step(0));
    assert_eq!(code(remove_worker_home(&plain, &NoProcesses)), step(1));
    assert!(plain.exists());
    assert_eq!(code(redact_worker_home(&home)), step(2));
    assert!(!home.join(".claude/.credentials.json").exists());
    assert_eq!(code(redact_worker_home(&home)), step(3));
    let blocked = remove_worker_home(&home, &Stuck(4242)).unwrap_err();
    assert_eq!(blocked.code, "worker-home-in-use");
    assert!(blocked.message.contains("4242") && home.exists());
    assert_eq!(
        code(remove_worker_home(&home, &ProcSweeper::default())),
        step(4)
    );
    assert!(!home.exists());
    assert_eq!(code(remove_worker_home(&home, &NoProcesses)), step(5));
    assert_eq!(
        code(remove_worker_home(Path::new(""), &NoProcesses)),
        step(6)
    );
    assert_eq!(code(redact_worker_home(Path::new(""))), step(7));
}

// ---- worker session boot ---------------------------------------------------------------------------------

#[test]
fn the_default_worker_session_is_the_recorded_one() {
    assert_eq!(
        DEFAULT_WORKER_SESSION,
        vectors("worker-session-boot.v1.json")["defaultWorkerSession"]
    );
}

type ProbeFor = Box<dyn Fn(&Env) -> Box<dyn TerminalProbe>>;

struct Terminal {
    answers: Cell<bool>,
    route: Result<Option<String>, String>,
    answer_after_spawn: bool,
    spawned: Rc<Cell<bool>>,
}
use std::rc::Rc;

impl TerminalProbe for Terminal {
    fn capabilities(&self) -> Result<Capabilities, String> {
        let up = self.answers.get() || (self.answer_after_spawn && self.spawned.get());
        self.route.clone().map(|socket_path| Capabilities {
            server_answers: up,
            socket_path,
        })
    }
}

struct Fx {
    socket: RefCell<bool>,
    stamps: RefCell<Vec<String>>,
    connect: Connect,
    locked: bool,
    clock: Cell<u64>,
    spawned: Rc<Cell<bool>>,
    spawn_makes_socket: bool,
    removed: Cell<bool>,
}

impl Fx {
    fn new(socket: bool, connect: Connect) -> Self {
        Fx {
            socket: RefCell::new(socket),
            stamps: RefCell::new(vec!["1:1".into()]),
            connect,
            locked: true,
            clock: Cell::new(0),
            spawned: Rc::new(Cell::new(false)),
            spawn_makes_socket: true,
            removed: Cell::new(false),
        }
    }
}

impl BootEffects for Fx {
    fn socket_exists(&self, _path: &Path) -> bool {
        *self.socket.borrow()
    }
    fn socket_stamp(&self, _path: &Path) -> Result<SocketStamp, String> {
        let mut stamps = self.stamps.borrow_mut();
        let stamp = if stamps.len() > 1 {
            stamps.remove(0)
        } else {
            stamps[0].clone()
        };
        Ok(SocketStamp(stamp))
    }
    fn connect(&self, _path: &Path) -> Connect {
        self.connect.clone()
    }
    fn remove_socket(&self, _path: &Path) {
        *self.socket.borrow_mut() = false;
        self.removed.set(true);
    }
    fn spawn_server(&self, _bin: &str, _session: &str) {
        self.spawned.set(true);
        if self.spawn_makes_socket {
            *self.socket.borrow_mut() = true;
        }
    }
    fn sleep(&self, ms: u64) {
        self.clock.set(self.clock.get() + ms);
    }
    fn now_ms(&self) -> u64 {
        self.clock.get()
    }
    fn with_boot_lock(&self, _session: &str, _wait_ms: u64, boot: &mut dyn FnMut()) -> bool {
        if self.locked {
            boot();
        }
        self.locked
    }
}

fn boot(fx: &Fx, terminal: Terminal) -> Result<WorkerSession, WorkerSessionError> {
    let terminal = Rc::new(terminal);
    let probe: ProbeFor = {
        let terminal = terminal.clone();
        Box::new(move |_| Box::new(Shared(terminal.clone())))
    };
    let mut caller = Env::new();
    caller.insert("HERDR_SESSION".into(), "cockpit".into());
    caller.insert("HERDR_SOCKET_PATH".into(), "/cockpit.sock".into());
    ensure_worker_session(
        DEFAULT_WORKER_SESSION,
        &caller,
        probe.as_ref(),
        fx,
        &BootOptions {
            herdr_bin: "herdr".into(),
            timeout_ms: 1000,
            poll_ms: 100,
        },
    )
}

struct Shared(Rc<Terminal>);
impl TerminalProbe for Shared {
    fn capabilities(&self) -> Result<Capabilities, String> {
        self.0.capabilities()
    }
}

fn terminal(fx: &Fx, answers: bool, answer_after_spawn: bool) -> Terminal {
    Terminal {
        answers: Cell::new(answers),
        route: Ok(Some("/w.sock".into())),
        answer_after_spawn,
        spawned: fx.spawned.clone(),
    }
}

#[test]
fn a_session_without_a_socket_is_started_once_and_its_environment_addresses_it() {
    let fx = Fx::new(false, Connect::Refused);
    let session = boot(&fx, terminal(&fx, false, true)).unwrap();
    assert!(session.started_server && fx.spawned.get());
    assert_eq!(session.socket_path, "/w.sock");
    assert_eq!(
        session.env.get("HERDR_SESSION").map(String::as_str),
        Some("fgos-worker")
    );
    assert!(!session.env.contains_key("HERDR_SOCKET_PATH"));
}

#[test]
fn a_session_whose_server_answers_is_left_alone() {
    let fx = Fx::new(true, Connect::Accepted);
    let session = boot(&fx, terminal(&fx, true, false)).unwrap();
    assert!(!session.started_server && !fx.spawned.get() && !fx.removed.get());
}

#[test]
fn a_socket_the_os_refuses_twice_with_the_same_file_is_removed_and_the_server_started_again() {
    let fx = Fx::new(true, Connect::Refused);
    let session = boot(&fx, terminal(&fx, false, true)).unwrap();
    assert!(fx.removed.get() && fx.spawned.get() && session.started_server);
}

#[test]
fn a_socket_whose_server_state_cannot_be_judged_is_kept_and_nothing_is_started() {
    let accepted = Fx::new(true, Connect::Accepted);
    let err = boot(&accepted, terminal(&accepted, false, false)).unwrap_err();
    assert_eq!(err.code, "worker-session-server-unknown");
    assert!(!accepted.removed.get() && !accepted.spawned.get());

    let replaced = Fx::new(true, Connect::Refused);
    *replaced.stamps.borrow_mut() = vec!["1:1".into(), "2:2".into()];
    let err = boot(&replaced, terminal(&replaced, false, false)).unwrap_err();
    assert!(err.message.contains("changed between two looks"));
    assert!(!replaced.removed.get() && !replaced.spawned.get());

    let other = Fx::new(true, Connect::Other("EACCES".into()));
    assert!(boot(&other, terminal(&other, false, false))
        .unwrap_err()
        .message
        .contains("EACCES"));
}

#[test]
fn a_route_that_names_no_socket_starts_nothing() {
    let fx = Fx::new(false, Connect::Refused);
    let mut t = terminal(&fx, false, false);
    t.route = Err("host binary missing".into());
    let err = boot(&fx, t).unwrap_err();
    assert_eq!(err.code, "worker-session-server-unknown");
    assert!(err.message.contains("host binary missing") && !fx.spawned.get());
}

#[test]
fn a_boot_that_never_comes_up_or_never_answers_times_out_and_a_lock_that_is_not_won_is_refused() {
    let silent = Fx::new(false, Connect::Refused);
    let mut no_socket = Fx {
        spawn_makes_socket: false,
        ..Fx::new(false, Connect::Refused)
    };
    no_socket.spawned = silent.spawned.clone();
    let err = boot(&no_socket, terminal(&no_socket, false, false)).unwrap_err();
    assert!(err.code == "session-unavailable" && err.message.contains("no socket"));

    let mute = Fx::new(false, Connect::Refused);
    let err = boot(&mute, terminal(&mute, false, false)).unwrap_err();
    assert!(err.code == "session-unavailable" && err.message.contains("did not answer"));

    let busy = Fx {
        locked: false,
        ..Fx::new(false, Connect::Refused)
    };
    let err = boot(&busy, terminal(&busy, false, false)).unwrap_err();
    assert!(err.code == "session-unavailable" && !busy.spawned.get());
}

#[test]
fn the_operators_session_is_refused_before_anything_is_asked_or_started() {
    let fx = Fx::new(false, Connect::Refused);
    let t = Rc::new(terminal(&fx, false, false));
    let asked = Rc::new(Cell::new(false));
    let probe: ProbeFor = {
        let (t, asked) = (t.clone(), asked.clone());
        Box::new(move |_| {
            asked.set(true);
            Box::new(Shared(t.clone()))
        })
    };
    let mut caller = Env::new();
    caller.insert("HERDR_SESSION".into(), "mine".into());
    for target in ["default", "mine"] {
        let err = ensure_worker_session(
            target,
            &caller,
            probe.as_ref(),
            &fx,
            &BootOptions::new("herdr"),
        )
        .unwrap_err();
        assert_eq!(err.code, "operator-session");
    }
    assert!(!asked.get() && !fx.spawned.get());
}
