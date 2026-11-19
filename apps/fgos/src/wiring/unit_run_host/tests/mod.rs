//! The owning proofs of the host adapters: each against a real temp repository, a temp `.fgos` or a copy of the
//! Node-era record corpus, never a mock of the door it calls.

use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};

use serde_json::{json, Value};

use super::{accounts, checks, execution, handoff, machine, persona, records, settlement, verify};
use fgos_execution_engine::steps::{AttemptHomeFinalizer, HomeState, PaneScreen};

mod run_unit;
mod terminal;

static SERIAL: AtomicU64 = AtomicU64::new(0);

const CORPUS: &str = concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../packages/execution/contracts/corpus"
);

/// A fresh directory under the system temp dir, removed when dropped.
struct Scratch(PathBuf);

impl Scratch {
    fn new(tag: &str) -> Self {
        let dir = std::env::temp_dir().join(format!(
            "fgos-unit-run-host-{tag}-{}-{}",
            std::process::id(),
            SERIAL.fetch_add(1, Ordering::Relaxed)
        ));
        std::fs::create_dir_all(&dir).unwrap();
        Scratch(std::fs::canonicalize(&dir).unwrap())
    }
}

impl Drop for Scratch {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.0);
    }
}

fn git(dir: &Path, args: &[&str]) {
    let out = Command::new("git")
        .current_dir(dir)
        .args([
            "-c",
            "user.name=t",
            "-c",
            "user.email=t@t",
            "-c",
            "commit.gpgsign=false",
        ])
        .args(args)
        .env("GIT_CONFIG_GLOBAL", "/dev/null")
        .env("GIT_CONFIG_SYSTEM", "/dev/null")
        .output()
        .unwrap();
    assert!(
        out.status.success(),
        "git {args:?}: {}",
        String::from_utf8_lossy(&out.stderr)
    );
}

/// A main checkout with one commit and a linked worktree `tree` beside it.
fn repo(scratch: &Scratch) -> (PathBuf, PathBuf) {
    let main = scratch.0.join("repo");
    std::fs::create_dir_all(&main).unwrap();
    git(&main, &["init", "-q", "--initial-branch=trunk"]);
    std::fs::write(main.join("a"), "base\n").unwrap();
    git(&main, &["add", "."]);
    git(&main, &["commit", "-qm", "base"]);
    let tree = scratch.0.join("tree");
    git(
        &main,
        &["worktree", "add", "-qb", "work", tree.to_str().unwrap()],
    );
    (main, tree)
}

fn copy_tree(from: &Path, to: &Path) {
    std::fs::create_dir_all(to).unwrap();
    for entry in std::fs::read_dir(from).unwrap() {
        let entry = entry.unwrap();
        let target = to.join(entry.file_name());
        if entry.file_type().unwrap().is_dir() {
            copy_tree(&entry.path(), &target);
        } else {
            std::fs::copy(entry.path(), &target).unwrap();
        }
    }
}

fn read_json(file: &Path) -> Value {
    serde_json::from_slice(&std::fs::read(file).unwrap()).unwrap()
}

// ---- machine ----------------------------------------------------------------------------------------------

#[test]
fn git_roots_name_the_worktree_and_its_main_checkout_and_refuse_outside_a_repository() {
    let scratch = Scratch::new("roots");
    let (main, tree) = repo(&scratch);
    let roots = machine::git_roots(&tree, false).unwrap();
    assert_eq!(roots.worktree_root, tree);
    assert_eq!(roots.main_checkout_root, main);
    assert!(roots.is_linked_worktree && !roots.not_a_repository);
    let roots = machine::git_roots(&main, false).unwrap();
    assert!(!roots.is_linked_worktree);

    let outside = scratch.0.join("plain");
    std::fs::create_dir_all(&outside).unwrap();
    let roots = machine::git_roots(&outside, true).unwrap();
    assert!(roots.not_a_repository && !roots.is_linked_worktree);
    assert_eq!(roots.worktree_root, outside);
    assert_eq!(roots.main_checkout_root, outside);
    let refused = machine::git_roots(&outside, false).unwrap_err();
    assert!(
        refused.starts_with("fgos run must run inside a git repository (cwd: ")
            && refused.ends_with("): not a working repository"),
        "{refused}"
    );
}

#[test]
fn a_mutating_run_in_the_main_checkout_is_seen_and_a_linked_worktree_is_not() {
    let scratch = Scratch::new("main-checkout");
    let (main, tree) = repo(&scratch);
    assert!(machine::is_main_checkout(&main));
    assert!(!machine::is_main_checkout(&tree));
    assert!(!machine::is_main_checkout(&scratch.0));
}

#[test]
fn the_git_door_opens_a_worktree_under_its_main_checkout() {
    let scratch = Scratch::new("git");
    let (main, tree) = repo(&scratch);
    let (_driver, handle) = machine::git(&tree, &main).unwrap();
    assert_eq!(handle.work_tree(), Some(tree.as_path()));
    assert_eq!(handle.trusted_main_root(), main.as_path());
    assert!(machine::git(&scratch.0, &scratch.0).is_err());
}

#[test]
fn the_process_facts_are_the_environments_and_the_identitys() {
    let user = std::env::var("USER").ok().filter(|u| !u.is_empty());
    assert_eq!(
        machine::created_by(),
        user.unwrap_or_else(|| "system".into())
    );
    assert!(!machine::git_writer().is_empty());
    let herdr = std::env::var("HERDR_ENV").is_ok_and(|v| v == "1")
        && std::env::var_os("HERDR_SOCKET_PATH")
            .is_some_and(|s| !s.is_empty() && Path::new(&s).exists());
    assert_eq!(machine::herdr_present(), herdr);
}

#[test]
fn the_project_fgos_dir_sits_under_the_main_checkout() {
    assert_eq!(
        machine::fgos_dir(Path::new("/srv/repo")),
        PathBuf::from("/srv/repo/.fgos")
    );
}

#[test]
fn the_shipped_catalog_is_the_bundled_standards_patterns_and_loops() {
    let catalog = machine::shipped_catalog();
    assert!(catalog["patterns"]["solo"].is_object(), "{catalog}");
    assert!(catalog["patterns"]["reviewed"].is_object(), "{catalog}");
    assert!(
        catalog["loops"]["reviewed"]["maxRounds"].is_u64(),
        "{catalog}"
    );
}

#[test]
fn the_committed_runner_config_loads_checked_and_a_project_value_the_door_refuses_keeps_its_code() {
    let scratch = Scratch::new("config");
    let (main, _) = repo(&scratch);
    let loaded = machine::load_runner_config(&main).unwrap();
    assert!(loaded.is_object(), "{loaded}");

    std::fs::create_dir_all(main.join(".fgos")).unwrap();
    std::fs::write(
        main.join(".fgos/config.yaml"),
        "runner:\n  timeoutMs: soon\n",
    )
    .unwrap();
    let refused = machine::load_runner_config(&main).unwrap_err();
    assert_eq!(refused.tag.as_str(), "RunnerConfigError", "{refused:?}");
    assert!(
        refused
            .code
            .as_deref()
            .is_some_and(|c| c.starts_with("config-")),
        "{refused:?}"
    );
    assert!(refused.message.contains("config.yaml"), "{refused:?}");
}

#[test]
fn the_attempt_sweep_closes_nothing_it_cannot_judge_and_never_fails() {
    let scratch = Scratch::new("sweep");
    let attempt = scratch.0.join("assignments/a1/runs/01");
    std::fs::create_dir_all(&attempt).unwrap();
    std::fs::write(attempt.join("closed.json"), "{}").unwrap();
    machine::sweep_attempts(&scratch.0.join("assignments"));
    machine::sweep_attempts(&scratch.0.join("missing"));
    assert!(attempt.join("closed.json").exists());
}

// ---- records ----------------------------------------------------------------------------------------------

#[test]
fn a_unit_source_is_data_as_given_or_a_file_read_as_json_then_yaml() {
    let scratch = Scratch::new("source");
    let given = json!({ "id": "u", "objective": "o" });
    assert_eq!(
        records::read_unit_source(&json!({ "unitData": given })).unwrap(),
        given
    );
    let json_file = scratch.0.join("unit.json");
    std::fs::write(&json_file, r#"{"id":"j","writes":[]}"#).unwrap();
    assert_eq!(
        records::read_unit_source(&json!({ "unitPath": json_file })).unwrap(),
        json!({ "id": "j", "writes": [] })
    );
    let yaml_file = scratch.0.join("unit.yaml");
    std::fs::write(&yaml_file, "id: y\nwrites:\n  - src/\n").unwrap();
    assert_eq!(
        records::read_unit_source(&json!({ "unitPath": yaml_file })).unwrap(),
        json!({ "id": "y", "writes": ["src/"] })
    );

    let none = records::read_unit_source(&json!({})).unwrap_err();
    assert_eq!(none.tag.as_str(), "RunnerConfigError");
    assert_eq!(none.message, "runUnit requires --unit <file|-> or unitData");
    let missing = records::read_unit_source(&json!({ "unitPath": scratch.0.join("absent.yaml") }))
        .unwrap_err();
    assert_eq!(missing.code.as_deref(), Some("ENOENT"));
    assert_eq!(
        missing.message,
        format!(
            "ENOENT: no such file or directory, open '{}'",
            scratch.0.join("absent.yaml").display()
        )
    );
    let broken = scratch.0.join("broken.yaml");
    std::fs::write(&broken, "a: 1\na: 2\n").unwrap();
    let refused = records::read_unit_source(&json!({ "unitPath": broken })).unwrap_err();
    assert_eq!(refused.fields["name"], "YamlParseError");
    assert!(refused.code.is_some(), "{refused:?}");
}

#[test]
fn a_unit_file_carrying_a_seat_or_unit_tier_is_refused_by_name() {
    assert!(
        records::check_unit_file(&json!({ "id": "u", "seats": [{ "seat": "producer" }] })).is_ok()
    );
    let seat = records::check_unit_file(&json!({ "seats": [{ "seat": "p", "tier": "deep" }] }))
        .unwrap_err();
    assert_eq!(seat.code.as_deref(), Some("seat-tier-not-allowed"));
    assert_eq!(seat.fields["name"], "SeatResolutionError");
    let unit = records::check_unit_file(&json!({ "tier": "deep" })).unwrap_err();
    assert_eq!(unit.code.as_deref(), Some("unit-tier-not-allowed"));
    assert!(
        unit.message.starts_with("a unit file cannot carry tier"),
        "{}",
        unit.message
    );
}

#[test]
fn a_write_scope_gains_the_render_targets_of_the_generated_sources_it_touches() {
    let generated = json!([{ "from": "core/skills/", "also": [".agents/skills/"] }]);
    let widened = records::expand_generated(&json!(["core/skills/a/"]), &generated);
    let widened: Vec<&str> = widened
        .as_array()
        .unwrap()
        .iter()
        .filter_map(Value::as_str)
        .collect();
    assert!(
        widened.iter().any(|w| w.starts_with(".agents/skills")),
        "{widened:?}"
    );
    let untouched = records::expand_generated(&json!(["src/"]), &generated);
    assert!(!untouched.to_string().contains(".agents"), "{untouched}");
}

#[test]
fn one_controller_holds_a_unit_run_until_it_releases_it() {
    let scratch = Scratch::new("control");
    let unit = scratch.0.join("unit-run-1");
    let mut first = records::acquire_unit_control(&unit, "unit-run-1").unwrap();
    let Err(held) = records::acquire_unit_control(&unit, "unit-run-1") else {
        panic!("a live controller keeps the unit")
    };
    assert_eq!(held.holder_pid, Some(std::process::id()));
    first.release().unwrap();
    let mut second = records::acquire_unit_control(&unit, "unit-run-1").unwrap();
    second.release().unwrap();
}

#[test]
fn the_current_attempt_and_the_summary_of_a_node_settled_unit_run_read_back_byte_for_byte() {
    let scratch = Scratch::new("corpus");
    let id = "unit-run-1795056603528-44eb3ca1";
    let unit = scratch.0.join(id);
    copy_tree(&Path::new(CORPUS).join("v3-solo-settled"), &unit);
    let node_summary = std::fs::read(unit.join("unit-summary.json")).unwrap();

    let generations =
        records::admission_generations(&unit.join("producer/1/admission/generations")).unwrap();
    assert_eq!(generations.len(), 1);
    let attempt = records::current_attempt(&scratch.0, &format!("{id}/producer/1"))
        .unwrap()
        .unwrap();
    assert_eq!(attempt.dir, unit.join("producer/1/runs/01"));
    assert_eq!(attempt.run_id, generations[0]["runId"].as_str().unwrap());
    assert!(
        records::current_attempt(&scratch.0, &format!("{id}/producer/2"))
            .unwrap()
            .is_none()
    );
    assert!(records::admission_generations(&scratch.0.join("none"))
        .unwrap()
        .is_empty());
    // Anything but a missing ledger is the run's error, as Node's fs raises it.
    let not_a_dir = scratch.0.join("plain-file");
    std::fs::write(&not_a_dir, "").unwrap();
    let error = records::admission_generations(&not_a_dir).unwrap_err();
    assert_eq!(error.code.as_deref(), Some("ENOTDIR"));
    assert_eq!(
        error.message,
        format!(
            "ENOTDIR: not a directory, scandir '{}'",
            not_a_dir.display()
        )
    );
    // The current attempt reads the same ledger and fails with it, as `currentAttemptOf` throws.
    let blocked = scratch.0.join("blocked");
    std::fs::create_dir_all(blocked.join("admission")).unwrap();
    std::fs::write(blocked.join("admission/generations"), "").unwrap();
    let error = records::current_attempt(&scratch.0, "blocked").unwrap_err();
    assert_eq!(error.code.as_deref(), Some("ENOTDIR"));

    let record = read_json(&unit.join("unit.json"));
    assert!(records::is_seat_record(&record));
    std::fs::remove_file(unit.join("unit-summary.json")).unwrap();
    records::publish_unit_summary(&unit, &machine::shipped_catalog()).unwrap();
    assert_eq!(
        String::from_utf8(std::fs::read(unit.join("unit-summary.json")).unwrap()).unwrap(),
        String::from_utf8(node_summary).unwrap()
    );
}

#[test]
fn a_unit_run_with_an_attempt_still_open_publishes_no_summary() {
    let scratch = Scratch::new("open");
    let unit = scratch.0.join("unit-run-1794987012087-5f3337a8");
    copy_tree(&Path::new(CORPUS).join("v3-open-attempt"), &unit);
    let _ = std::fs::remove_file(unit.join("unit-summary.json"));
    let mut record = read_json(&unit.join("unit.json"));
    record["execution"] = json!({ "status": "running" });
    std::fs::write(unit.join("unit.json"), serde_json::to_vec(&record).unwrap()).unwrap();
    records::publish_unit_summary(&unit, &machine::shipped_catalog()).unwrap();
    assert!(!unit.join("unit-summary.json").exists());
}

#[test]
fn the_adopt_door_judges_a_closed_attempt_and_a_pre_supervisor_one() {
    let scratch = Scratch::new("adopt");
    copy_tree(
        &Path::new(CORPUS).join("adopt-v3-envelope-attempt"),
        &scratch.0.join("a"),
    );
    copy_tree(
        &Path::new(CORPUS).join("pre-v3-layout-assignment"),
        &scratch.0.join("b"),
    );
    assert_eq!(records::adopt_state(&scratch.0.join("a/runs/01")), "closed");
    assert_eq!(
        records::adopt_state(&scratch.0.join("b/runs/01")),
        "legacy-run"
    );
}

#[test]
fn a_record_from_before_the_seat_fence_decodes_to_its_pattern_and_runner_view() {
    let legacy = json!({ "pattern": "reviewed", "unit": { "id": "u" }, "configSnapshot": { "runner": { "patterns": { "reviewed": { "maxRounds": 3 } } } } });
    assert!(!records::is_seat_record(&legacy));
    let (collaboration, runner) =
        records::collaboration_of_record(&legacy, &machine::shipped_catalog());
    assert_eq!(collaboration["pattern"]["name"], "reviewed");
    assert_eq!(collaboration["effective"]["loop"], "reviewed");
    assert_eq!(collaboration["effective"]["params"]["maxRounds"], 3);
    assert_eq!(runner["loops"]["reviewed"]["maxRounds"], 3);
}

// ---- accounts ---------------------------------------------------------------------------------------------

/// A runner with one agent executor whose command is a stub on the PATH the session names.
fn stub_runner(bin: &Path) -> Value {
    let stub = bin.join("stub-agent");
    std::fs::write(&stub, "#!/bin/sh\nexit 0\n").unwrap();
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(&stub, std::fs::Permissions::from_mode(0o755)).unwrap();
    }
    json!({ "executors": { "stub": { "kind": "agent", "providerModel": "stub", "invocations": [
        { "id": "stub-cli", "via": "cli", "adapter": "cli-spawn", "command": "stub-agent" }
    ] } },
    "modelPolicies": { "stub": { "standard": "stub-model" } },
    "tierFallback": { "standard": ["stub"] },
    "defaults": { "tier": "standard" } })
}

#[test]
fn a_seat_binds_to_the_executor_the_machine_can_start() {
    let scratch = Scratch::new("bind");
    let runner = stub_runner(&scratch.0);
    let ask = json!({ "unit": { "id": "u1", "capability": "execute", "writes": [] }, "seat": "producer", "role": "producer",
        "posture": { "readOnly": true, "writer": false, "forceOutOfProcess": false, "stance": false, "verdict": false },
        "raiseAuthorized": false, "readOnly": true, "independentOf": [], "overrides": [] });
    let session = json!({ "pathEnv": scratch.0, "herdrPresent": false, "postureAtLaunch": true });
    let accounts =
        json!({ "runtimeDir": scratch.0.join("runtime"), "assignmentId": "u1/producer/1" });
    let bound = accounts::bind(&ask, &runner, &session, &accounts, &json!({})).unwrap();
    assert_eq!(bound["executor"], "stub", "{bound}");
    assert!(bound["bindingInput"]["hostVersion"].is_string(), "{bound}");
    let unbound = accounts::bind(&ask, &runner, &json!({ "pathEnv": scratch.0.join("empty"), "herdrPresent": false, "postureAtLaunch": true }), &Value::Null, &json!({}))
        .unwrap();
    assert!(
        unbound.get("refused").is_some() || unbound["executor"] != "stub",
        "{unbound}"
    );
}

#[test]
fn account_reads_over_an_empty_store_find_nothing_to_rotate_or_audit() {
    let scratch = Scratch::new("accounts");
    let runtime = scratch.0.join("runtime");
    let runner = stub_runner(&scratch.0);
    assert!(accounts::pinned_accounts_usable(
        &[json!({ "seat": "producer" })],
        &runner,
        "cannot start",
        Some(&runtime)
    )
    .is_ok());
    assert!(accounts::account_rotation(&runner, "stub", Some(&runtime)).is_none());
    assert!(accounts::audit_lease_receipt(None, "u1/producer/1", Some(&runtime)).is_none());
    let receipt =
        json!({ "provider": "stub", "accountId": "a", "acquiredAt": "2026-11-19T00:00:00.000Z" });
    let differs =
        accounts::audit_lease_receipt(Some(&receipt), "u1/producer/1", Some(&runtime)).unwrap();
    assert!(
        differs.contains("no lease for this assignment"),
        "{differs}"
    );
    accounts::drop_assignment_record("u1/producer/1", Some(&runtime));
    assert_eq!(
        accounts::runner_config_for_binding(&runner, &json!({ "executor": "stub" })),
        runner
    );
}

#[test]
fn door_choices_refuse_what_the_calling_door_has_no_authority_for_before_a_run_exists() {
    let scratch = Scratch::new("doors");
    let runner = stub_runner(&scratch.0);
    let unit = json!({ "id": "u1", "capability": "execute", "writes": [] });
    let collaboration = json!({ "pin": { "effective": { "loop": "solo", "params": {} } } });
    let session = json!({ "pathEnv": scratch.0, "herdrPresent": false, "postureAtLaunch": true });
    let ask = |extra: Value| {
        let mut options = json!({ "session": session });
        options
            .as_object_mut()
            .unwrap()
            .extend(extra.as_object().unwrap().clone());
        accounts::door_choices(&unit, &runner, &options, &collaboration)
    };
    assert!(ask(json!({})).is_ok());

    let missing = accounts::door_choices(
        &unit,
        &runner,
        &json!({ "session": { "pathEnv": scratch.0.join("empty") } }),
        &collaboration,
    )
    .unwrap_err();
    assert_eq!(missing.phase.as_deref(), Some("pre-admission"));
    let code = missing.code.clone().unwrap();
    assert!(
        missing.message.starts_with(&format!("{code}: ")),
        "{missing:?}"
    );

    let mode = ask(json!({ "accountPin": "always" })).unwrap_err();
    assert_eq!(
        mode.message,
        "accountPin must be one of strict, where-served, got \"always\""
    );
    let dependence = ask(json!({ "overrides": [{ "acceptDependence": true }] })).unwrap_err();
    assert_eq!(
        dependence.code.as_deref(),
        Some("dependence-acceptance-unauthorized")
    );
    assert!(
        ask(json!({ "overrides": [{ "acceptDependence": true }], "raiseAuthorized": true }))
            .is_ok()
    );

    let pinned = ask(json!({ "overrides": [{ "account": "stub/nobody" }] })).unwrap_err();
    assert!(
        pinned
            .message
            .starts_with("the pinned account applies to no seat of this unit")
            || pinned
                .message
                .starts_with("cannot pin the account for seat"),
        "{pinned:?}"
    );
}

// ---- checks -----------------------------------------------------------------------------------------------

fn plain_unit() -> Value {
    json!({ "id": "u1", "objective": "look", "capability": "execute" })
}

#[test]
fn a_unit_is_validated_and_a_unit_missing_its_capability_is_refused_by_name() {
    let unit = checks::validate_unit(&plain_unit()).unwrap();
    assert_eq!(unit["id"], "u1");
    assert_eq!(unit["writes"], json!([]));
    let refused = checks::validate_unit(&json!({ "id": "u1", "objective": "look" })).unwrap_err();
    assert_eq!(refused.tag.as_str(), "RunnerConfigError");
    assert!(
        refused
            .message
            .starts_with("unit.capability must be a non-empty string"),
        "{}",
        refused.message
    );
    let timeout = checks::validate_unit(
        &json!({ "id": "u1", "objective": "o", "capability": "c", "timeoutMs": 5 }),
    )
    .unwrap_err();
    assert!(
        timeout.message.contains("unit.timeoutMs must be at least"),
        "{}",
        timeout.message
    );
}

#[test]
fn an_override_run_timeout_is_held_to_the_floor_and_ceiling() {
    assert!(checks::assert_run_timeout(&json!(600_000)).is_ok());
    let low = checks::assert_run_timeout(&json!(5)).unwrap_err();
    assert!(
        low.message
            .starts_with("override timeoutMs must be at least"),
        "{}",
        low.message
    );
    let float = checks::assert_run_timeout(&json!(1.5)).unwrap_err();
    assert!(
        float
            .message
            .contains("must be a whole number of milliseconds"),
        "{}",
        float.message
    );
}

#[test]
fn a_unit_files_plan_names_a_plan_directory_that_exists() {
    let scratch = Scratch::new("plan");
    std::fs::create_dir_all(scratch.0.join("plans/261119-0000-demo")).unwrap();
    assert!(checks::existing_plan_ref(None, &scratch.0).is_ok());
    assert!(checks::existing_plan_ref(
        Some(&json!({ "dir": "plans/261119-0000-demo" })),
        &scratch.0
    )
    .is_ok());
    let name =
        checks::existing_plan_ref(Some(&json!({ "dir": "plans/demo" })), &scratch.0).unwrap_err();
    assert!(
        name.message
            .starts_with("plan \"plans/demo\" is not a plan directory name: invalid-plan-dir"),
        "{}",
        name.message
    );
    let missing = checks::existing_plan_ref(
        Some(&json!({ "dir": "plans/261119-0001-gone" })),
        &scratch.0,
    )
    .unwrap_err();
    assert!(
        missing
            .message
            .contains("is not an existing plan directory"),
        "{}",
        missing.message
    );
}

#[test]
fn the_collaboration_of_a_plain_unit_is_one_solo_producer_and_an_unknown_pattern_is_refused() {
    let scratch = Scratch::new("collab");
    let runner = stub_runner(&scratch.0);
    let shipped = machine::shipped_catalog();
    let ask = |selectors: Value| json!({ "unit": validate(&plain_unit()), "selectors": selectors, "inCase": false, "runnerConfig": runner, "origins": false });
    let solo = checks::resolve_collaboration(&ask(json!({})), &shipped, None).unwrap();
    assert_eq!(solo["pin"]["effective"]["loop"], "solo", "{solo}");
    assert_eq!(solo["seats"][0]["seat"], "producer", "{solo}");
    assert_eq!(solo["pin"]["pattern"]["layer"], "shipped", "{solo}");
    let refused = checks::resolve_collaboration(
        &ask(json!({ "callerString": "no-such-pattern" })),
        &shipped,
        None,
    )
    .unwrap_err();
    assert_eq!(refused.phase.as_deref(), Some("pre-admission"));
    assert!(refused.code.is_some(), "{refused:?}");
}

fn validate(raw: &Value) -> Value {
    checks::validate_unit(raw).unwrap()
}

#[test]
fn a_declared_operation_stamps_its_fields_and_an_undeclared_one_is_refused() {
    let declared = json!({ "domain": "coding", "stage": "build", "operation": "op",
        "operations": [{ "id": "op", "taskSpec": "build.md", "mutation": "read-only" }] });
    let fields = checks::declared_operation_fields(&declared, None).unwrap();
    assert_eq!(fields["operation"], "op");
    assert_eq!(fields["dispatch"], "assignment");
    assert!(fields["mutation"].is_string(), "{fields}");
    let mut other = declared.clone();
    other["operation"] = json!("missing");
    let refused = checks::declared_operation_fields(&other, None).unwrap_err();
    assert!(
        refused.message.starts_with("unknown operation \"missing\""),
        "{}",
        refused.message
    );
    let scratch = Scratch::new("taskspec");
    let absent = checks::declared_operation_fields(&declared, Some(&scratch.0)).unwrap_err();
    assert!(
        absent.message.contains("taskSpec file does not exist"),
        "{}",
        absent.message
    );
}

// ---- persona ----------------------------------------------------------------------------------------------

#[test]
fn a_persona_is_pinned_from_the_first_layer_that_defines_it() {
    let scratch = Scratch::new("persona");
    let (project, install) = (scratch.0.join("project"), scratch.0.join("install"));
    std::fs::create_dir_all(project.join("fgos/agents")).unwrap();
    std::fs::create_dir_all(install.join("core/agents")).unwrap();
    let text = "name: helper\ndescription: helps\n";
    std::fs::write(project.join("fgos/agents/helper.yaml"), text).unwrap();
    std::fs::write(
        install.join("core/agents/helper.yaml"),
        "name: helper\ndescription: core\n",
    )
    .unwrap();
    std::fs::write(
        install.join("core/agents/shipped.yaml"),
        "name: shipped\ndescription: s\n",
    )
    .unwrap();
    let pin = persona::persona_pin("helper", &project, &install, None)
        .unwrap()
        .unwrap();
    assert_eq!(pin["identity"], "workspace:fgos/agents/helper");
    assert_eq!(pin["text"], text);
    assert_eq!(
        pin["digest"],
        fgos_execution::handoff::sha256_hex(text.as_bytes())
    );
    let core = persona::persona_pin("shipped", &project, &install, None)
        .unwrap()
        .unwrap();
    assert_eq!(core["identity"], "core:core/agents/shipped");
    assert!(persona::persona_pin("nobody", &project, &install, None)
        .unwrap()
        .is_none());
    std::fs::write(project.join("fgos/agents/vague.yaml"), "name: vague\n").unwrap();
    let vague = persona::persona_pin("vague", &project, &install, None).unwrap_err();
    assert!(
        vague
            .message
            .ends_with("must declare a non-empty description"),
        "{}",
        vague.message
    );
    let unknown = persona::check_agent_definition("nobody", &project, &install).unwrap_err();
    assert!(
        unknown.starts_with("persona \"nobody\" not found; searched fgos/agents ("),
        "{unknown}"
    );
    assert!(persona::check_agent_definition("helper", &project, &install).is_ok());
    let bad = persona::persona_pin("Bad Name", &project, &install, None).unwrap_err();
    assert!(
        bad.message
            .starts_with("persona name \"Bad Name\" must match"),
        "{}",
        bad.message
    );
}

// ---- hand-offs ----------------------------------------------------------------------------------------------

/// A main checkout whose unit run `unit-run-1` settled one producer round that left `notes/report.md`.
fn settled_run(scratch: &Scratch) -> PathBuf {
    let main = scratch.0.join("main");
    let run = main.join(".fgos/assignments/unit-run-1/producer/1/runs/01");
    std::fs::create_dir_all(&run).unwrap();
    std::fs::create_dir_all(main.join("notes")).unwrap();
    std::fs::write(main.join("notes/report.md"), "found it\n").unwrap();
    std::fs::write(
        run.join("result.json"),
        r#"{"runResult":true,"evidence":{"artifacts":["notes/report.md"]}}"#,
    )
    .unwrap();
    main
}

#[test]
fn inputs_resolve_to_the_report_a_seat_left_and_a_blind_unit_gets_digested_copies() {
    let scratch = Scratch::new("inputs");
    let main = settled_run(&scratch);
    let report = main.join("notes/report.md");
    let inputs = json!([
        "unit-run:unit-run-1/producer",
        "docs/a.md",
        "unit-run:unit-run-1/{seat}"
    ]);
    let plain = handoff::resolve_inputs(&inputs, &main, &json!({ "accept": [] })).unwrap();
    assert_eq!(
        plain["refs"],
        json!([report.to_string_lossy(), "docs/a.md"])
    );
    assert_eq!(plain["inputMap"], json!([]));

    let blind = handoff::resolve_inputs(
        &inputs,
        &main,
        &json!({ "accept": [], "blind": true, "anonymize": true }),
    )
    .unwrap();
    assert_eq!(blind["refs"], json!(["docs/a.md"]));
    assert_eq!(blind["inputMap"][0]["name"], "seat-A.md");
    assert_eq!(
        blind["inputMap"][0]["sha256"],
        fgos_execution::handoff::sha256_hex(b"found it\n")
    );

    let own = handoff::resolve_inputs(&inputs, &main, &json!({ "seat": "producer" })).unwrap();
    assert_eq!(own["inputMap"][0]["name"], "own-previous.md");

    let missing =
        handoff::resolve_inputs(&json!(["unit-run:unit-run-9/producer"]), &main, &json!({}))
            .unwrap_err();
    assert_eq!(missing.fields["reason"], "no-such-run");
    assert!(
        missing
            .message
            .starts_with("handoff-ref-unresolved: unit-run:unit-run-9/producer"),
        "{}",
        missing.message
    );
}

#[test]
fn the_report_digest_of_an_attempt_names_its_bytes_or_is_null() {
    let scratch = Scratch::new("digest");
    let main = settled_run(&scratch);
    let record = json!({ "seat": "producer", "round": 1, "runResult": { "evidence": { "artifacts": ["notes/report.md"] } } });
    let digest = handoff::report_digest(&record, &main);
    assert_eq!(digest["bytes"], 9);
    assert_eq!(
        digest["sha256"],
        fgos_execution::handoff::sha256_hex(b"found it\n")
    );
    assert_eq!(
        handoff::report_digest(&json!({ "seat": "producer", "round": 1 }), &main),
        Value::Null
    );
}

// ---- verify -------------------------------------------------------------------------------------------------

#[test]
fn a_verify_command_passes_or_finds_and_runs_under_the_custody_it_is_given() {
    use fgos_execution_engine::unit_run::verify::Verdict;
    let scratch = Scratch::new("verify");
    assert_eq!(
        verify::verify("exit 0", &scratch.0, Some(10_000), None).verdict,
        Verdict::Pass
    );
    let found = verify::verify("echo nope; exit 3", &scratch.0, Some(10_000), None);
    assert_eq!(found.verdict, Verdict::Findings);
    assert!(found.tail.contains("nope"));
    #[cfg(unix)]
    {
        use fgos_holder_lock::{acquire, Acquire, Mode, Resource, Wait, DEFAULT_KILL_WAIT_MS};
        let resource = Resource::new("attempt", scratch.0.join("attempt.lock"));
        let Acquire::Acquired(custody) =
            acquire(&resource, Mode::Ex, Wait::Try, DEFAULT_KILL_WAIT_MS)
        else {
            panic!("a fresh lock is free")
        };
        let held = verify::verify(
            "echo held; exit 0",
            &scratch.0,
            Some(10_000),
            Some(&custody),
        );
        assert_eq!(held.verdict, Verdict::Pass, "{held:?}");
        let failed = verify::verify("exit 4", &scratch.0, Some(10_000), Some(&custody));
        assert_eq!(failed.verdict, Verdict::Findings, "{failed:?}");
        // A verify the deadline ends keeps what it wrote before, as Node's `runCommand` does.
        let slow = verify::verify(
            "echo partial; sleep 30",
            &scratch.0,
            Some(300),
            Some(&custody),
        );
        assert!(slow.tail.contains("partial"), "{slow:?}");
    }
}

// ---- settlement -------------------------------------------------------------------------------------------

#[test]
fn a_direct_attempt_shows_no_pane_screen() {
    let scratch = Scratch::new("pane");
    let screen = settlement::HostPaneScreen;
    assert_eq!(
        screen.visible_screen(&scratch.0, &json!({ "host": "direct" })),
        ""
    );
    assert_eq!(
        screen.visible_screen(&scratch.0, &json!({ "mode": "terminal" })),
        ""
    );
}

#[test]
fn an_attempt_without_private_homes_finalizes_clean() {
    let scratch = Scratch::new("homes");
    let done = settlement::HostHomes
        .finalize(&scratch.0, "attempt-1")
        .unwrap();
    assert_eq!(done.state, HomeState::Cleaned);
    assert_eq!(done.homes, 0);
}

// ---- credential renewal -----------------------------------------------------------------------------------

#[test]
fn a_leased_login_far_from_expiry_is_left_fresh_by_the_hosts_renewal_and_the_lease_carries_the_write_back(
) {
    use fgos_execution_engine::assignment_runner::lease::renew_leased_login;
    let scratch = Scratch::new("renew");
    let (home, runtime) = (scratch.0.join("login"), scratch.0.join("runtime"));
    std::fs::create_dir_all(&home).unwrap();
    std::fs::create_dir_all(&runtime).unwrap();
    let month_ahead = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64
        + 30 * 24 * 3_600_000;
    std::fs::write(
        home.join("auth.json"),
        json!({ "openai-codex": { "type": "oauth", "access": "a", "refresh": "r", "expires": month_ahead } })
            .to_string(),
    )
    .unwrap();
    let selection = json!({
        "status": "selected", "provider": "openai-codex", "accountId": "acct",
        "credentialSource": { "kind": "home-files", "home": home, "files": ["auth.json"] },
    });
    let cfg = json!({ "executors": { "pi": { "kind": "agent", "confinement": { "backend": "bwrap" } } } });
    let leased = renew_leased_login(
        &selection,
        Some(&execution::HostRenewal),
        &cfg,
        "pi",
        None,
        Some("required"),
        Some(&runtime),
        Some(60_000),
    );
    assert_eq!(
        leased["refreshAhead"],
        json!([{ "cli": null, "status": "fresh", "reason": "outside-window" }])
    );
    assert_eq!(
        leased["credentialWriteBack"]["runtimeDir"],
        json!(runtime.to_string_lossy())
    );
}
