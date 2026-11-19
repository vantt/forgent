//! Proof of the confinement policy module against the vectors the Node originals recorded
//! (`packages/execution/contracts/confinement-policy/`, written by `test/golden-recorders/confinement-policy.recorder.mjs`).
//!
//! One test per behaviour; each replays every recorded case of that behaviour and reports all that differ at once.
//! Fixtures are built in a fresh temp directory and `$ROOT` in a vector stands for it.

use std::fs;
use std::path::{Path, PathBuf};

use fgos_execution_engine::confinement::policy::*;
use serde_json::{json, Value};

// ------------------------------------------------------------------ vectors and helpers

fn vectors(name: &str) -> Value {
    let path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../contracts/confinement-policy")
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
fn answer(case: &Value) -> Value {
    match case.get("error") {
        Some(error) => json!({ "error": error }),
        None => json!({ "ok": case.get("ok").cloned().unwrap_or(Value::Null) }),
    }
}

fn policy_error(result: Result<(), ConfinementPolicyError>) -> Value {
    match result {
        Ok(()) => json!({ "ok": null }),
        Err(err) => json!({ "error": err.0 }),
    }
}

/// Runs a policy validator on a case input and compares both its answer and the document it leaves behind.
/// `returns_input`: the Node validator hands the checked document back as its answer.
fn check_mutating(
    report: &mut Report,
    case: &Value,
    input: &str,
    returns_input: bool,
    run: impl FnOnce(&mut Value) -> Result<(), ConfinementPolicyError>,
) {
    let mut value = case[input].clone();
    let got = policy_error(run(&mut value));
    let shown = if returns_input && got.get("error").is_none() {
        json!({ "ok": value.clone() })
    } else {
        got.clone()
    };
    report.expect(case, shown, &answer(case));
    if got.get("error").is_none() {
        report.expect(case, value, &case["after"]);
    }
}

// ------------------------------------------------------------------ policy: vocabulary and shape

#[test]
fn vocabulary_names_match_what_the_node_originals_export() {
    let file = vectors("policy.v1.json");
    let c = &file["constants"];
    let strings = |v: &Value| {
        v.as_array()
            .unwrap()
            .iter()
            .map(|s| s.as_str().unwrap().to_string())
            .collect::<Vec<_>>()
    };
    assert_eq!(strings(&c["builtinPolicyIds"]), BUILTIN_POLICY_IDS);
    for id in BUILTIN_POLICY_IDS {
        assert_eq!(
            builtin_policy(id).as_ref(),
            Some(&c["builtinPolicies"][id]),
            "built-in policy {id}"
        );
    }
    assert_eq!(builtin_policy("nope"), None);
    assert_eq!(strings(&c["confinementModes"]), CONFINEMENT_MODES);
    let axes: Value = CONTROL_AXES
        .iter()
        .map(|(name, values)| (name.to_string(), json!(values)))
        .collect();
    assert_eq!(axes, c["controlAxes"]);
    assert_eq!(
        strings(
            &c["controlAxes"]
                .as_object()
                .unwrap()
                .keys()
                .map(|k| json!(k))
                .collect()
        ),
        CONTROL_AXES.map(|(n, _)| n)
    );
    let levels: Value = GRANT_ACCESS_LEVELS
        .iter()
        .map(|(name, level)| (name.to_string(), json!(level)))
        .collect();
    assert_eq!(levels, c["grantAccessLevels"]);
    assert_eq!(c["workspacePathsResource"], WORKSPACE_PATHS_RESOURCE);
    assert_eq!(c["mailboxRecordResource"], MAILBOX_RECORD_RESOURCE);
    assert_eq!(c["peerSessionsResource"], PEER_SESSIONS_RESOURCE);
    assert_eq!(strings(&c["blindHiddenRoots"]), BLIND_HIDDEN_ROOTS);
    assert_eq!(strings(&c["machinePrivateRoots"]), MACHINE_PRIVATE_ROOTS);
    assert_eq!(c["defaultSeatTimeoutMs"], DEFAULT_SEAT_TIMEOUT_MS);
    assert_eq!(c["sessionSocketDir"], SESSION_SOCKET_DIR);
}

#[test]
fn network_filter_rules_refuse_what_node_refused_and_canonicalise_cidrs_the_same_way() {
    let file = vectors("policy.v1.json");
    let mut report = Report::default();
    for case in cases(&file, "networkFilter") {
        let frozen = case["frozen"].as_bool().unwrap();
        check_mutating(&mut report, case, "input", false, |v| {
            validate_network_filter_shape(v, "networkFilter", frozen)
        });
    }
    report.finish("network filter shape");
}

#[test]
fn policy_document_shape_is_closed_and_judged_like_node_judged_it() {
    let file = vectors("policy.v1.json");
    let mut report = Report::default();
    for case in cases(&file, "policyShape") {
        let frozen = case["frozen"].as_bool().unwrap();
        check_mutating(&mut report, case, "input", true, |v| {
            validate_confinement_policy_shape(v, "policy", frozen)
        });
    }
    report.finish("policy shape");
}

#[test]
fn workspace_paths_grant_refuses_absolute_climbing_fgos_and_glob_entries_by_name() {
    let file = vectors("policy.v1.json");
    let mut report = Report::default();
    for case in cases(&file, "workspacePaths") {
        let got = policy_error(validate_workspace_paths(Some(&case["input"]), "grant"));
        report.expect(case, got, &answer(case));
    }
    report.finish("workspace paths");
}

#[test]
fn capability_confinement_shape_accepts_only_the_declared_modes_and_keys() {
    let file = vectors("policy.v1.json");
    let mut report = Report::default();
    for case in cases(&file, "capabilityShape") {
        let got = match validate_capability_confinement_shape(&case["input"], "cap") {
            Ok(()) => json!({ "ok": case["input"] }),
            Err(err) => json!({ "error": err.0 }),
        };
        report.expect(case, got, &answer(case));
    }
    report.finish("capability confinement shape");
}

#[test]
fn invocation_override_may_only_harden_controls_narrow_grants_and_shrink_the_filter() {
    let file = vectors("policy.v1.json");
    let mut report = Report::default();
    for case in cases(&file, "overrideShape") {
        let base = case["base"]
            .as_str()
            .map(|name| file["overrideBases"][name].clone());
        let mode = case["baseMode"].as_str().unwrap().to_string();
        check_mutating(&mut report, case, "override", true, |v| {
            validate_override_confinement_shape(v, base.as_ref(), "override", &mode)
        });
    }
    report.finish("override shape");
}

#[test]
fn legacy_flags_and_loose_controls_normalise_into_one_policy_document() {
    let file = vectors("policy.v1.json");
    let mut report = Report::default();
    for case in cases(&file, "legacyNormalization") {
        let got = json!({ "ok": normalize_legacy_confinement(&case["input"]) });
        report.expect(case, got, &answer(case));
    }
    report.finish("legacy normalization");
}

#[test]
fn policy_lookup_prefers_built_ins_and_ignores_blank_or_unknown_ids() {
    let file = vectors("policy.v1.json");
    let mut report = Report::default();
    for case in cases(&file, "resolvePolicy") {
        let found = case["id"].as_str().and_then(|id| {
            resolve_confinement_policy(id, case.get("custom").filter(|c| !c.is_null()))
        });
        report.expect(case, json!({ "ok": found }), &answer(case));
    }
    report.finish("policy lookup");
}

#[test]
fn posture_maps_to_one_policy_and_anything_but_workspace_write_is_read_only() {
    let file = vectors("policy.v1.json");
    let mut report = Report::default();
    for case in cases(&file, "posture") {
        let custom = case["ctx"]
            .get("runnerConfig")
            .and_then(|r| r.get("confinementPolicies"));
        let posture = resolve_posture(
            case["binding"].get("posture").and_then(Value::as_str),
            custom,
        );
        let got = json!({ "ok": {
            "posture": posture.posture, "policyId": posture.policy_id, "policy": posture.policy, "requirement": posture.requirement(),
        } });
        report.expect(case, got, &answer(case));
    }
    report.finish("posture");
}

#[test]
fn posture_invocation_is_decided_from_the_declared_backend_the_registry_and_the_program() {
    let file = vectors("policy.v1.json");
    let mut report = Report::default();
    for case in cases(&file, "postureInvocation") {
        let ctx = &case["ctx"];
        let empty = json!({});
        let executors = [
            ctx.get("executors"),
            ctx["runnerConfig"].get("executors"),
            ctx["runnerConfig"]["runner"].get("executors"),
        ]
        .into_iter()
        .flatten()
        .next()
        .unwrap_or(&empty);
        let registry = ctx
            .get("registry")
            .filter(|r| r.as_str() != Some("unreadable"))
            .cloned()
            .unwrap_or_else(|| json!({}));
        let backends = (ctx["registry"].as_str() != Some("unreadable")).then_some(&registry);
        let available: Vec<String> = ctx
            .get("available")
            .and_then(Value::as_array)
            .map(|a| a.iter().map(|s| s.as_str().unwrap().to_string()).collect())
            .unwrap_or_default();
        let probe = |command: &str| available.iter().any(|a| a == command);
        let context = PostureContext {
            executors: Some(executors),
            herdr_present: ctx["herdrPresent"].as_bool() == Some(true),
            backends,
            command_available: &probe,
        };
        let candidate = case["candidate"].as_object().map(|c| Candidate {
            executor: c
                .get("executor")
                .and_then(Value::as_str)
                .map(str::to_string),
            invocation: c
                .get("invocation")
                .and_then(Value::as_str)
                .map(str::to_string),
        });
        let got = resolve_posture_invocation(candidate.as_ref(), &context);
        report.expect(
            case,
            json!({ "ok": { "ok": got.ok, "invocation": got.invocation } }),
            &answer(case),
        );
        report.expect(
            case,
            json!(can_apply_posture(candidate.as_ref(), &context)),
            &case["canApply"],
        );
    }
    report.finish("posture invocation");
}

#[test]
fn bypass_mode_names_every_missing_confinement_control_in_a_fixed_order() {
    let file = vectors("policy.v1.json");
    let mut report = Report::default();
    for case in cases(&file, "bypassPairing") {
        let flag = |name: &str| case["input"][name].as_bool().unwrap();
        let got = evaluate_bypass_pairing(
            flag("isBypass"),
            flag("hasOwnWorktree"),
            flag("hasPrivateHome"),
            flag("hasIsolatedSession"),
        );
        report.expect(
            case,
            json!({ "ok": { "satisfied": got.satisfied, "missing": got.missing } }),
            &answer(case),
        );
    }
    report.finish("bypass pairing");
}

#[test]
fn control_delivery_lets_a_head_stay_in_the_main_checkout_only_under_a_required_backend_that_denies_host_writes(
) {
    let file = vectors("policy.v1.json");
    let mut report = Report::default();
    for case in cases(&file, "controlDelivery") {
        let input = &case["input"];
        let backend = match input.get("backend") {
            None | Some(Value::Null) => false,
            Some(Value::String(s)) => !s.is_empty(),
            Some(_) => true,
        };
        let got = control_delivery(
            input["launchKind"].as_str(),
            input.get("requirement"),
            backend,
        );
        report.expect(
            case,
            json!({ "ok": { "backendDelivers": got.backend_delivers, "rootWorkspaceAllowed": got.root_workspace_allowed } }),
            &answer(case),
        );
    }
    report.finish("control delivery");
}

// ------------------------------------------------------------------ resources: fixtures

struct Fixture {
    root: String,
}

impl Fixture {
    fn new(spec: &Value) -> Self {
        static NEXT: std::sync::atomic::AtomicU32 = std::sync::atomic::AtomicU32::new(0);
        let unique = NEXT.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
        let dir = std::env::temp_dir().join(format!("cp-vec-{}-{unique}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let root = fs::canonicalize(&dir)
            .unwrap()
            .to_string_lossy()
            .into_owned();
        let fixture = Fixture { root };
        fixture.build(spec);
        fixture
    }

    fn at(&self, rel: &str) -> PathBuf {
        PathBuf::from(format!(
            "{}/{}",
            self.root,
            rel.replace("$UID", &self.uid_text())
        ))
    }

    fn uid_text(&self) -> String {
        owner_of(Path::new(&self.root))
            .map(|u| u.to_string())
            .unwrap_or_default()
    }

    fn build(&self, spec: &Value) {
        for dir in spec["dirs"].as_array().into_iter().flatten() {
            make_dirs(&self.at(dir.as_str().unwrap()), 0o755);
        }
        for (file, content) in spec["files"].as_object().into_iter().flatten() {
            let path = self.at(file);
            make_dirs(path.parent().unwrap(), 0o755);
            fs::write(&path, content.as_str().unwrap()).unwrap();
        }
        for (link, target) in spec["symlinks"].as_object().into_iter().flatten() {
            let path = self.at(link);
            make_dirs(path.parent().unwrap(), 0o755);
            symlink(
                &target.as_str().unwrap().replace("$ROOT", &self.root),
                &path,
            );
        }
        for (entry, mode) in spec["modes"].as_object().into_iter().flatten() {
            set_mode(&self.at(entry), mode.as_u64().unwrap() as u32);
        }
    }

    /// `$ROOT` in a vector value becomes this fixture's root.
    fn subst(&self, value: &Value) -> Value {
        let uid = self.uid_text();
        let next = uid
            .parse::<u64>()
            .map(|u| (u + 1).to_string())
            .unwrap_or_default();
        let text = value
            .to_string()
            .replace("$ROOT", &self.root)
            .replace("\"$UID+1\"", &next)
            .replace("\"$UID\"", &uid)
            .replace("$UID", &uid);
        serde_json::from_str(&text).unwrap()
    }

    fn uid(&self) -> Option<u32> {
        owner_of(&self.at("."))
    }

    /// Everything under the root (relative path, kind, and the mode of a directory), sorted.
    fn tree(&self) -> Value {
        let mut out = Vec::new();
        self.walk(Path::new(&self.root), &mut out);
        Value::Array(out)
    }

    fn walk(&self, dir: &Path, out: &mut Vec<Value>) {
        let mut names: Vec<_> = fs::read_dir(dir)
            .unwrap()
            .map(|e| e.unwrap().file_name().to_string_lossy().into_owned())
            .collect();
        names.sort();
        for name in names {
            let full = dir.join(&name);
            let meta = fs::symlink_metadata(&full).unwrap();
            let rel = full
                .strip_prefix(&self.root)
                .unwrap()
                .to_string_lossy()
                .into_owned();
            if meta.file_type().is_symlink() {
                out.push(json!({ "path": rel, "kind": "link" }));
            } else if meta.is_dir() {
                out.push(json!({ "path": rel, "kind": "dir", "mode": mode_of(&meta) & 0o777 }));
                self.walk(&full, out);
            } else {
                out.push(json!({ "path": rel, "kind": "file" }));
            }
        }
    }
}

impl Drop for Fixture {
    fn drop(&mut self) {
        // Directories a case made unreadable on purpose are opened up first so the removal cannot fail.
        let _ = fs::remove_dir_all(&self.root);
    }
}

fn make_dirs(path: &Path, mode: u32) {
    let mut builder = fs::DirBuilder::new();
    builder.recursive(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::DirBuilderExt;
        builder.mode(mode);
    }
    #[cfg(not(unix))]
    let _ = mode;
    builder.create(path).unwrap();
}

#[cfg(unix)]
fn symlink(target: &str, link: &Path) {
    std::os::unix::fs::symlink(target, link).unwrap();
}
#[cfg(not(unix))]
fn symlink(_target: &str, _link: &Path) {
    panic!("the vectors build symbolic links; they run on unix hosts");
}
#[cfg(unix)]
fn set_mode(path: &Path, mode: u32) {
    use std::os::unix::fs::PermissionsExt;
    fs::set_permissions(path, fs::Permissions::from_mode(mode)).unwrap();
}
#[cfg(not(unix))]
fn set_mode(_path: &Path, _mode: u32) {}
#[cfg(unix)]
fn mode_of(meta: &fs::Metadata) -> u32 {
    use std::os::unix::fs::PermissionsExt;
    meta.permissions().mode()
}
#[cfg(not(unix))]
fn mode_of(_meta: &fs::Metadata) -> u32 {
    0
}
#[cfg(unix)]
fn owner_of(path: &Path) -> Option<u32> {
    use std::os::unix::fs::MetadataExt;
    fs::metadata(path).ok().map(|m| m.uid())
}
#[cfg(not(unix))]
fn owner_of(_path: &Path) -> Option<u32> {
    None
}

fn opt(value: &Value, key: &str) -> Option<String> {
    value.get(key).and_then(Value::as_str).map(str::to_string)
}

fn list(value: &Value, key: &str) -> Vec<String> {
    value
        .get(key)
        .and_then(Value::as_array)
        .map(|a| {
            a.iter()
                .map(|s| {
                    s.as_str()
                        .map(str::to_string)
                        .unwrap_or_else(|| s.to_string())
                })
                .collect()
        })
        .unwrap_or_default()
}

/// A recorded resource run's answer: `{ ok }`, or `{ error, code }` where the message holds no operating-system text.
fn resource_answer(
    result: Result<Value, ConfinementResourceError>,
    expected: &Value,
) -> (Value, Value) {
    match result {
        Ok(ok) => (json!({ "ok": ok }), answer(expected)),
        Err(err) => {
            let system_text = err.code == "mailbox-record-unavailable";
            let got = if system_text {
                json!({ "code": err.code })
            } else {
                json!({ "error": err.message, "code": err.code })
            };
            let want = match expected.get("error") {
                Some(_) if system_text => json!({ "code": expected["code"] }),
                Some(error) => json!({ "error": error, "code": expected["code"] }),
                None => answer(expected),
            };
            (got, want)
        }
    }
}

fn machine_input(fixture: &Fixture, input: &Value) -> MachineRootsInput {
    MachineRootsInput {
        home_dir: opt(input, "homeDir").unwrap(),
        claude_socket_base: opt(input, "claudeSocketBase").unwrap(),
        xdg_runtime_dir: opt(input, "xdgRuntimeDir"),
        xdg_config_home: opt(input, "xdgConfigHome"),
        herdr_socket_path: opt(input, "herdrSocketPath"),
        login_stores: list(input, "loginStores"),
        confinement_roots: list(input, "confinementRoots"),
        uid: fixture.uid(),
    }
}

// ------------------------------------------------------------------ resources: machine roots and helpers

#[test]
fn machine_private_roots_hide_every_listed_root_that_exists_and_refuse_the_unsafe_ones_by_name() {
    let file = vectors("resources.v1.json");
    let mut report = Report::default();
    for case in cases(&file, "machinePrivateRoots") {
        let fixture = Fixture::new(&case["fixture"]);
        let input = fixture.subst(&case["input"]);
        let result = resolve_machine_private_roots(&machine_input(&fixture, &input))
            .map(|roots| json!(roots));
        let expected = fixture.subst(case);
        let (got, want) = resource_answer(result, &expected);
        report.expect(&expected, got, &want);
        if case.get("tree").is_some() {
            report.expect(&expected, fixture.tree(), &expected["tree"]);
        }
    }
    report.finish("machine private roots");
}

#[test]
fn runtime_directory_to_mask_is_xdg_else_the_users_own_0700_systemd_directory() {
    let file = vectors("resources.v1.json");
    let mut report = Report::default();
    for case in cases(&file, "runtimeDirForMask") {
        let fixture = Fixture::new(&case["fixture"]);
        let input = fixture.subst(&case["input"]);
        let xdg = input["env"]["XDG_RUNTIME_DIR"].as_str().map(str::to_string);
        let uid = input["uid"].as_u64().map(|u| u as u32);
        let got = runtime_dir_for_mask(xdg.as_deref(), uid, input["runUserBase"].as_str().unwrap());
        let expected = fixture.subst(case);
        report.expect(&expected, json!(got), &expected["ok"]);
    }
    report.finish("runtime directory to mask");
}

#[test]
fn claude_socket_base_follows_claude_codes_own_order_and_skips_relative_values() {
    let file = vectors("resources.v1.json");
    let mut report = Report::default();
    for case in cases(&file, "claudeSocketBase") {
        let env = &case["env"];
        let got = resolve_claude_socket_base(&|name| {
            env.get(name).and_then(Value::as_str).map(str::to_string)
        });
        report.expect(case, json!(got), &case["ok"]);
    }
    report.finish("claude socket base");
}

#[test]
fn blind_hidden_roots_list_only_the_roots_that_exist_and_need_a_state_directory() {
    let file = vectors("resources.v1.json");
    let mut report = Report::default();
    for case in cases(&file, "blindHiddenRoots") {
        let fixture = Fixture::new(&case["fixture"]);
        let input = fixture.subst(&case["input"]);
        let config = &input["backendConfig"];
        let temp = opt(config, "privateHomeRoot")
            .or_else(|| opt(config, "tempRoot"))
            .unwrap_or_else(|| "/nonexistent-default".into());
        let result = resolve_blind_hidden_roots(input["fgosDir"].as_str().unwrap(), &temp)
            .map(|roots| json!(roots));
        let expected = fixture.subst(case);
        let (got, want) = resource_answer(result, &expected);
        report.expect(&expected, got, &want);
    }
    report.finish("blind hidden roots");
}

#[test]
fn blind_launch_creates_the_mailbox_directory_owner_only_and_leaves_what_it_cannot_create() {
    let file = vectors("resources.v1.json");
    let mut report = Report::default();
    for case in cases(&file, "createBlindRoots") {
        let fixture = Fixture::new(&case["fixture"]);
        let input = fixture.subst(&case["input"]);
        let outcome = create_blind_roots_when_missing(input["fgosDir"].as_str().unwrap());
        let expected = fixture.subst(case);
        report.expect(&expected, json!(outcome.is_ok()), &json!(true));
        report.expect(&expected, fixture.tree(), &expected["tree"]);
    }
    report.finish("blind roots creation");
}

#[test]
fn a_grant_target_must_stay_inside_its_declared_root_through_links_and_dot_dot() {
    let file = vectors("resources.v1.json");
    let mut report = Report::default();
    for case in cases(&file, "canonicalizeSubpath") {
        let fixture = Fixture::new(&case["fixture"]);
        let args = fixture.subst(&case["input"]["args"]);
        let target = args[0].as_str().unwrap_or("");
        let root = args[1].as_str().unwrap_or("");
        let result = canonicalize_and_verify_subpath(target, root, args[2].as_str().unwrap())
            .map(|c| json!({ "hostTarget": c.host_target, "declaredRoot": c.declared_root }));
        let expected = fixture.subst(case);
        let (got, want) = resource_answer(result, &expected);
        report.expect(&expected, got, &want);
    }
    report.finish("canonical subpath");
}

#[test]
fn containment_treats_a_root_and_its_children_as_inside_and_a_name_prefix_as_outside() {
    let file = vectors("resources.v1.json");
    let mut report = Report::default();
    for case in cases(&file, "isInsideRoot") {
        report.expect(
            case,
            json!(is_inside_root(
                case["target"].as_str().unwrap(),
                case["root"].as_str().unwrap()
            )),
            &case["ok"],
        );
    }
    report.finish("containment");
}

#[test]
fn workspace_git_metadata_is_the_checkouts_own_git_directory_or_nothing() {
    let file = vectors("resources.v1.json");
    for case in cases(&file, "gitMetadata") {
        let fixture = Fixture::new(&json!({ "dirs": ["repo"] }));
        match case["layout"].as_str().unwrap() {
            "checkout" => make_dirs(&fixture.at("repo/.git"), 0o755),
            "linked-worktree" => {
                make_dirs(&fixture.at("main/.git/worktrees/repo"), 0o755);
                fs::write(
                    fixture.at("repo/.git"),
                    format!("gitdir: {}/main/.git/worktrees/repo\n", fixture.root),
                )
                .unwrap();
            }
            _ => {}
        }
        let got = resolve_workspace_git_metadata(&format!("{}/repo", fixture.root)).unwrap();
        let want = fixture.subst(&case["ok"]);
        assert_eq!(
            got.map(Value::from).unwrap_or(Value::Null),
            want,
            "{}",
            case["name"]
        );
    }
}

// ------------------------------------------------------------------ resources: the resolver

fn resolve_input(fixture: &Fixture, input: &Value, lock_template: &str) -> ResolveInput {
    let context = &input["context"];
    let fgos_dir = opt(context, "fgosDir");
    ResolveInput {
        dispatch_id: opt(input, "dispatchId").unwrap_or_default(),
        context: ResolveContext {
            run_dir: opt(context, "runDir"),
            fgos_dir: fgos_dir.clone(),
            repo_root: opt(context, "repoRoot"),
            cwd: opt(context, "cwd"),
            adapter: opt(context, "adapter"),
            assignment_launch_context: context["assignmentLaunchContext"].as_bool() == Some(true),
            launch_command: opt(context, "launchCommand"),
            launch_path: opt(context, "launchPath"),
        },
        grants: input["grants"]
            .as_array()
            .unwrap()
            .iter()
            .map(|g| Grant {
                resource: opt(g, "resource").unwrap(),
                access: opt(g, "access").unwrap(),
                subpath: opt(g, "subpath"),
                paths: g.get("paths").cloned(),
            })
            .collect(),
        private_home_root: opt(&input["backendConfig"], "privateHomeRoot"),
        temp_root: opt(&input["backendConfig"], "tempRoot"),
        default_temp_root: "/nonexistent-default-temp-root".to_string(),
        credentials_path: opt(&input["providerSources"], "credentialsPath"),
        credentials_dir: opt(&input["providerSources"], "credentialsDir"),
        default_credentials_dir: "/nonexistent-default-credentials".to_string(),
        blind: input["blind"].as_bool() == Some(true),
        home_dir: opt(input, "homeDir").unwrap(),
        claude_socket_base: opt(input, "claudeSocketBase").unwrap(),
        xdg_runtime_dir: opt(input, "xdgRuntimeDir"),
        xdg_config_home: opt(input, "xdgConfigHome"),
        herdr_socket_path: opt(input, "herdrSocketPath"),
        login_stores: list(input, "loginStores"),
        confinement_roots: list(input, "confinementRoots"),
        // The lock path comes from the holder-lock registry's own row, never a path of this module's.
        mailbox_lock_path: fgos_dir
            .map(|dir| lock_template.replace("<fgosDir>", dir.trim_end_matches('/')))
            .unwrap_or_default(),
        uid: fixture.uid(),
    }
}

fn mailbox_lock_template() -> String {
    let path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../holder-lock/contracts/lock-registry.v1.json");
    let registry: Value = serde_json::from_str(&fs::read_to_string(path).unwrap()).unwrap();
    registry["locks"]
        .as_array()
        .unwrap()
        .iter()
        .find(|l| l["name"] == "mailbox")
        .and_then(|l| l["v3Path"].as_str())
        .expect("the lock registry has a mailbox row")
        .to_string()
}

#[test]
fn resolver_turns_each_grant_into_the_resources_node_resolved_and_refuses_the_same_grants() {
    let file = vectors("resources.v1.json");
    let template = mailbox_lock_template();
    let mut report = Report::default();
    for case in cases(&file, "resolveResources") {
        let fixture = Fixture::new(&case["fixture"]);
        let input = fixture.subst(&case["input"]);
        let result = resolve_confinement_resources(&resolve_input(&fixture, &input, &template))
            .map(|r| serde_json::to_value(r).unwrap());
        let expected = fixture.subst(case);
        let (got, want) = resource_answer(result, &expected);
        report.expect(&expected, got, &want);
        if case.get("tree").is_some() {
            report.expect(&expected, fixture.tree(), &expected["tree"]);
        }
    }
    report.finish("resource resolver");
}
