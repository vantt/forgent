//! The owning proofs of the host adapters: each against a real temp repository, a temp `.fgos` or a copy of the
//! Node-era record corpus, never a mock of the door it calls.

use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};

use serde_json::{json, Value};

use super::{accounts, machine, records, settlement};
use fgos_execution_engine::steps::{AttemptHomeFinalizer, HomeState, PaneScreen};

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
        records::admission_generations(&unit.join("producer/1/admission/generations"));
    assert_eq!(generations.len(), 1);
    let attempt = records::current_attempt(&scratch.0, &format!("{id}/producer/1")).unwrap();
    assert_eq!(attempt.dir, unit.join("producer/1/runs/01"));
    assert_eq!(attempt.run_id, generations[0]["runId"].as_str().unwrap());
    assert!(records::current_attempt(&scratch.0, &format!("{id}/producer/2")).is_none());
    assert!(records::admission_generations(&scratch.0.join("none")).is_empty());

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
