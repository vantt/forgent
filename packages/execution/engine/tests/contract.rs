//! The execution contract module replays the vectors the Node modules recorded
//! (`test/golden-recorders/execution-contract.recorder.mjs`): operation prompt templates (discovery over the three
//! tiers, rendering, resolution against a pinned snapshot), the inline contract validator and its stamp, and the
//! effective execution contract (build, validate, summary, digests, stripping secrets, read back).
//!
//! Every path a vector holds under its scratch root is written `$TMP`; a replay puts its own root there. Every
//! written value is compared with its key order, which is what the previous Node release reads back.
#![cfg(unix)]

use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

use fgos_execution_engine::assignment::builder::ContractPort;
use fgos_execution_engine::contract::effective::{
    assert_no_secrets, build_effective_execution_contract, canonical_json_text,
    compute_sha256_digest, read_effective_execution_contract, render_effective_contract_summary,
    strip_secrets, validate_effective_execution_contract, EFFECTIVE_EXECUTION_CONTRACT_FILE,
    EFFECTIVE_EXECUTION_CONTRACT_ID, EFFECTIVE_EXECUTION_CONTRACT_VERSION,
};
use fgos_execution_engine::contract::templates::{
    discover_operation_prompt_templates, discover_project_prompt_templates,
    load_operation_prompt_template, render_operation_prompt_template,
    resolve_and_render_operation_prompt, validate_operation_prompt_template, ResolveOptions, Roots,
    TemplateError, BOUNDED_TEMPLATE_VARIABLES, CORE_PROMPT_TEMPLATES_DIR,
};
use fgos_execution_engine::contract::validate::{
    carries_protocol_operation_stamp, extract_protocol_operation_stamp, is_writer_id,
    model_policy_tiers, normalize_saved_policy_tier, resolve_mutating_cwd_posture,
    validate_execution_contract, CheckoutFacts, ExecutionContract, CONTRACT_POLICY_VERSION,
    MAX_WRITER_ID_LENGTH, POLICY_PATCH_FIELDS, PROTOCOL_OPERATION_STAMP_PREFIX, REPEAT_MODE_VALUES,
};
use serde_json::{json, Value};

fn vector(name: &str) -> Value {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../contracts/execution-contract")
        .join(name);
    let text = fs::read_to_string(&path).unwrap_or_else(|e| panic!("{name}: {e}"));
    serde_json::from_str(&text).unwrap_or_else(|e| panic!("{name}: {e}"))
}

fn same_bytes(label: &str, got: &Value, want: &Value) {
    assert_eq!(
        serde_json::to_string(got).unwrap(),
        serde_json::to_string(want).unwrap(),
        "{label}"
    );
}

fn list<'a>(v: &'a Value, key: &str) -> &'a Vec<Value> {
    v[key]
        .as_array()
        .unwrap_or_else(|| panic!("{key} is not a list"))
}

/// A vector value with every `$TMP` (in keys and in text) replaced by this replay's root.
fn expand(value: &Value, root: &str) -> Value {
    match value {
        Value::String(text) => Value::String(text.replace("$TMP", root)),
        Value::Array(items) => Value::Array(items.iter().map(|i| expand(i, root)).collect()),
        Value::Object(map) => Value::Object(
            map.iter()
                .map(|(k, v)| (k.replace("$TMP", root), expand(v, root)))
                .collect(),
        ),
        other => other.clone(),
    }
}

/// A scratch directory under the system temp dir (its real path), removed on drop.
struct Scratch(PathBuf);

impl Scratch {
    fn new(tag: &str) -> Scratch {
        let dir = std::env::temp_dir().join(format!("fgos-contract-{tag}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        Scratch(fs::canonicalize(&dir).unwrap())
    }
    fn root(&self) -> String {
        self.0.to_string_lossy().into_owned()
    }
}

impl Drop for Scratch {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

/// What a vector's `{ ok } | { error }` says a call gave: the error as Node's thrown object shows it.
fn error_json(name: &str, code: Option<&str>, message: &str, details: Option<&Value>) -> Value {
    let mut error = json!({ "name": name, "code": code, "message": message });
    if let Some(details) = details {
        error["details"] = details.clone();
    }
    json!({ "error": error })
}

fn template_result<T>(got: Result<T, TemplateError>, ok: impl Fn(T) -> Value) -> Value {
    match got {
        Ok(value) => json!({ "ok": ok(value) }),
        Err(e) => error_json(
            "TemplateResolutionError",
            Some(e.code),
            &e.message,
            Some(&e.details),
        ),
    }
}

fn refusal_result(got: Result<Value, fgos_execution_engine::assignment::Refusal>) -> Value {
    match got {
        Ok(value) => json!({ "ok": value }),
        Err(r) => error_json("RunnerConfigError", r.code.as_deref(), &r.message, None),
    }
}

// ---- templates on disk -----------------------------------------------------------------------------------------

fn materialise(scratch: &Scratch, name: &str, files: &Value, links: &Value) -> Roots {
    let base = scratch.0.join(name);
    fs::create_dir_all(&base).unwrap();
    for (rel, content) in files.as_object().unwrap() {
        let file = base.join(rel);
        fs::create_dir_all(file.parent().unwrap()).unwrap();
        fs::write(&file, content.as_str().unwrap()).unwrap();
    }
    for (rel, target) in links.as_object().into_iter().flatten() {
        let file = base.join(rel);
        fs::create_dir_all(file.parent().unwrap()).unwrap();
        std::os::unix::fs::symlink(base.join(target.as_str().unwrap()), &file).unwrap();
    }
    Roots {
        cwd: base.join("project"),
        package_root: base.join("pkg"),
    }
}

fn entries_json(entries: Vec<fgos_execution_engine::contract::templates::TemplateEntry>) -> Value {
    Value::Array(entries.iter().map(|e| e.to_json()).collect())
}

#[test]
fn the_template_constants_are_the_ones_node_ships() {
    let v = vector("templates.json");
    let strings = |key: &str| -> Vec<String> {
        list(&v, key)
            .iter()
            .map(|s| s.as_str().unwrap().to_string())
            .collect()
    };
    assert_eq!(strings("coreDir"), CORE_PROMPT_TEMPLATES_DIR);
    assert_eq!(strings("boundedVariables"), BOUNDED_TEMPLATE_VARIABLES);
}

#[test]
fn template_discovery_and_lookup_answer_as_node_did_over_every_tier_and_refusal() {
    let v = vector("templates.json");
    let scratch = Scratch::new("templates");
    let root = scratch.root();
    for scenario in list(&v, "scenarios") {
        let name = scenario["name"].as_str().unwrap();
        let roots = materialise(&scratch, name, &scenario["files"], &scenario["symlinks"]);
        for case in list(scenario, "calls") {
            let call = &case["call"];
            let label = format!("{name} {call}");
            let got = match call["fn"].as_str().unwrap() {
                "discoverProject" => {
                    template_result(discover_project_prompt_templates(&roots), entries_json)
                }
                "discoverAll" => {
                    template_result(discover_operation_prompt_templates(&roots), entries_json)
                }
                "load" => template_result(
                    load_operation_prompt_template(
                        call["id"].as_str().unwrap(),
                        call["domain"].as_str(),
                        &roots,
                    ),
                    |e| e.to_json(),
                ),
                other => panic!("{label}: unknown call {other}"),
            };
            same_bytes(&label, &got, &expand(&case["result"], &root));
        }
    }
}

#[test]
fn a_template_names_only_bounded_variables_and_renders_with_them_as_node_did() {
    let v = vector("render.json");
    for case in list(&v, "validate") {
        let raw = case.get("content").or_else(|| case.get("raw")).unwrap();
        let id = case["templateId"].as_str().unwrap_or("");
        let got = template_result(validate_operation_prompt_template(raw, id), |names| {
            json!(names)
        });
        same_bytes(&format!("validate {case}"), &got, &case["result"]);
    }
    for case in list(&v, "render") {
        let got = template_result(
            render_operation_prompt_template(&case["content"], &case["variables"]),
            |body| json!(body),
        );
        same_bytes(&format!("render {}", case["name"]), &got, &case["result"]);
    }
}

#[test]
fn an_assignment_resolves_its_template_from_disk_or_from_a_pinned_snapshot_as_node_did() {
    let v = vector("render.json");
    let resolve = &v["resolve"];
    let scratch = Scratch::new("resolve");
    let root = scratch.root();
    let roots = materialise(
        &scratch,
        resolve["scenario"].as_str().unwrap(),
        &resolve["files"],
        &json!({}),
    );
    for case in list(resolve, "cases") {
        let options = &case["options"];
        let pinned = options
            .get("templateProvenance")
            .or_else(|| options.get("pinnedTemplate"))
            .cloned();
        let options = ResolveOptions {
            roots: roots.clone(),
            domain: options["domain"].as_str().map(str::to_string),
            variables: options.get("variables").cloned(),
            assignment: options.get("assignment").cloned(),
            pinned_template: pinned,
        };
        let got = template_result(
            resolve_and_render_operation_prompt(&case["input"], &options),
            |value| value,
        );
        same_bytes(
            &format!("resolve {}", case["name"]),
            &got,
            &expand(&case["result"], &root),
        );
    }
}

// ---- the inline contract ---------------------------------------------------------------------------------------

#[test]
fn the_contract_constants_are_the_ones_node_exports() {
    let c = vector("contract.json")["constants"].clone();
    let strings = |key: &str| -> Vec<String> {
        c[key]
            .as_array()
            .unwrap()
            .iter()
            .map(|s| s.as_str().unwrap().to_string())
            .collect()
    };
    assert_eq!(strings("repeatModeValues"), REPEAT_MODE_VALUES);
    assert_eq!(strings("policyPatchFields"), POLICY_PATCH_FIELDS);
    assert_eq!(strings("modelPolicyTiers"), model_policy_tiers());
    assert_eq!(c["policyVersion"], CONTRACT_POLICY_VERSION);
    assert_eq!(c["stampPrefix"], PROTOCOL_OPERATION_STAMP_PREFIX);
    assert_eq!(c["maxWriterIdLength"], MAX_WRITER_ID_LENGTH);
    assert_eq!(c["writerIdRe"], "^[A-Za-z0-9._-]+$");
    assert!(is_writer_id("a.b_c-1") && !is_writer_id("") && !is_writer_id("a b"));
    // The saved-policy tier field the validator accepts is one of the policy patch fields.
    assert!(POLICY_PATCH_FIELDS.contains(&"tier"));
}

#[test]
fn an_inline_contract_is_validated_field_by_field_as_node_did() {
    let v = vector("contract.json");
    same_bytes(
        "no arguments",
        &refusal_result(
            validate_execution_contract(&Value::Null, &Value::Null).map(|()| Value::Null),
        ),
        &v["noArguments"],
    );
    for case in list(&v, "validate") {
        let got = refusal_result(
            validate_execution_contract(&case["contract"], &case["caller"]).map(|()| Value::Null),
        );
        same_bytes(&format!("validate {}", case["name"]), &got, &case["result"]);
    }
}

#[test]
fn the_retired_saved_policy_tier_is_normalised_at_the_load_boundary_as_node_did() {
    let v = vector("contract.json");
    for case in list(&v, "normalizeSavedPolicyTier") {
        let got = refusal_result(normalize_saved_policy_tier(
            &case["policy"],
            case["allowAdditionalFields"].as_bool().unwrap(),
        ));
        same_bytes(
            &format!("normalize {}", case["policy"]),
            &got,
            &case["result"],
        );
    }
}

#[test]
fn the_protocol_operation_stamp_is_found_and_parsed_as_node_did() {
    let v = vector("contract.json");
    for case in list(&v, "stamps") {
        let constraints = match &case["constraints"] {
            Value::Object(o) if o.contains_key("absent") => None,
            other => Some(other),
        };
        assert_eq!(
            carries_protocol_operation_stamp(constraints),
            case["carries"].as_bool().unwrap(),
            "carries {}",
            case["constraints"]
        );
        let extracted = extract_protocol_operation_stamp(constraints)
            .map_or(Value::Null, |stamp| stamp.to_json());
        same_bytes(
            &format!("extract {}", case["constraints"]),
            &extracted,
            &case["extracted"],
        );
    }
}

#[test]
fn the_validator_serves_the_assignment_builder_through_its_port() {
    let port = ExecutionContract;
    let stamped = json!({ "constraints": ["x", "protocol-operation:flow@1#op"] });
    assert!(port.carries_protocol_stamp(&stamped));
    assert!(!port.carries_protocol_stamp(&json!({ "constraints": ["x"] })));
    assert!(!port.carries_protocol_stamp(&json!({})));
    let refused = port.validate(&json!({}), &json!({})).unwrap_err();
    assert_eq!(
        refused.message,
        "execution-contract: contract.objective must be a non-empty string"
    );
}

// ---- the effective contract ------------------------------------------------------------------------------------

/// Checkout facts as the recorder read them from the real repositories it built.
struct Recorded(HashMap<String, Value>);

impl Recorded {
    fn new(facts: &Value, root: &str) -> Recorded {
        Recorded(
            expand(facts, root)
                .as_object()
                .unwrap()
                .iter()
                .map(|(k, v)| (k.clone(), v.clone()))
                .collect(),
        )
    }
    fn of(&self, cwd: &str) -> &Value {
        self.0
            .get(cwd)
            .unwrap_or_else(|| panic!("no recorded checkout facts for {cwd}"))
    }
}

impl CheckoutFacts for Recorded {
    fn main_checkout_root(&self, cwd: &str) -> Option<String> {
        self.of(cwd)["mainCheckoutRoot"]
            .as_str()
            .map(str::to_string)
    }
    fn repo_root(&self, cwd: &str) -> Result<String, String> {
        let repo = &self.of(cwd)["repoRoot"];
        match repo.get("ok") {
            Some(root) => Ok(root.as_str().unwrap().to_string()),
            None => Err(repo["error"].as_str().unwrap().to_string()),
        }
    }
}

const ROOT: &str = "/fgos-contract-vectors";

#[test]
fn the_effective_contract_constants_are_the_ones_node_exports() {
    let c = vector("effective.json")["constants"].clone();
    assert_eq!(c["contract"]["id"], EFFECTIVE_EXECUTION_CONTRACT_ID);
    assert_eq!(
        c["contract"]["version"],
        EFFECTIVE_EXECUTION_CONTRACT_VERSION
    );
    assert_eq!(c["file"], EFFECTIVE_EXECUTION_CONTRACT_FILE);
    assert_eq!(
        c["defaultSeatTimeoutMs"],
        fgos_execution_engine::confinement::policy::DEFAULT_SEAT_TIMEOUT_MS
    );
}

#[test]
fn a_mutating_cwd_is_judged_a_linked_worktree_the_main_checkout_or_neither_as_node_did() {
    let v = vector("effective.json");
    let facts = Recorded::new(&v["facts"], ROOT);
    for case in list(&v, "posture") {
        let want = expand(&case["result"], ROOT);
        let cwd = case["cwd"].as_str().unwrap().replace("$TMP", ROOT);
        let got = resolve_mutating_cwd_posture(&facts, &cwd).to_json();
        same_bytes(&format!("posture {}", case["label"]), &got, &want);
    }
}

#[test]
fn the_effective_contract_is_built_from_its_parts_as_node_did() {
    let v = vector("effective.json");
    let facts = Recorded::new(&v["facts"], ROOT);
    for case in list(&v, "build") {
        let params = expand(&case["params"], ROOT);
        let got = refusal_result(build_effective_execution_contract(
            &params,
            &facts,
            Path::new("/"),
        ));
        same_bytes(
            &format!("build {}", case["name"]),
            &got,
            &expand(&case["result"], ROOT),
        );
    }
}

#[test]
fn an_effective_contract_is_validated_field_by_field_as_node_did() {
    let v = vector("effective.json");
    for case in list(&v, "validate") {
        let value = expand(&case["value"], ROOT);
        let got =
            refusal_result(validate_effective_execution_contract(&value).map(|()| Value::Null));
        same_bytes(&format!("validate {}", case["name"]), &got, &case["result"]);
    }
}

#[test]
fn the_summary_a_worker_reads_matches_node_for_every_built_contract() {
    let v = vector("effective.json");
    for case in list(&v, "summaries") {
        let got = render_effective_contract_summary(&expand(&case["contract"], ROOT));
        assert_eq!(
            Value::String(got),
            expand(&case["summary"], ROOT),
            "summary {}",
            case["name"]
        );
    }
}

#[test]
fn the_digests_cover_canonical_json_and_secrets_are_stripped_as_node_did() {
    let v = vector("effective.json");
    for case in list(&v, "digests") {
        let value = &case["value"];
        if !case["asText"].as_bool().unwrap_or(false) {
            assert_eq!(
                Value::String(canonical_json_text(value)),
                case["canonical"],
                "canonical {value}"
            );
        }
        assert_eq!(
            Value::String(compute_sha256_digest(value)),
            case["digest"],
            "digest {value}"
        );
    }
    for case in list(&v, "strip") {
        let value = &case["value"];
        same_bytes(
            &format!("strip {value}"),
            &strip_secrets(value),
            &case["stripped"],
        );
        let got = refusal_result(assert_no_secrets(value, "").map(|()| Value::Null));
        same_bytes(&format!("assert {value}"), &got, &case["assert"]);
    }
}

#[test]
fn a_contract_file_is_read_back_and_validated_as_node_did() {
    let v = vector("effective.json");
    let scratch = Scratch::new("read");
    let root = scratch.root();
    for case in list(&v, "read") {
        let dir = PathBuf::from(case["dir"].as_str().unwrap().replace("$TMP", &root));
        fs::create_dir_all(&dir).unwrap();
        let file = dir.join(EFFECTIVE_EXECUTION_CONTRACT_FILE);
        match (case.get("file"), case.get("raw")) {
            (Some(contract), _) => fs::write(
                &file,
                serde_json::to_string(&expand(contract, &root)).unwrap(),
            ),
            (None, Some(raw)) => fs::write(&file, raw.as_str().unwrap()),
            (None, None) => Ok(()),
        }
        .unwrap();
        let got = read_effective_execution_contract(&dir);
        match case.get("messagePrefix") {
            Some(prefix) => {
                let refusal = got.unwrap_err();
                assert!(
                    refusal
                        .message
                        .starts_with(&prefix.as_str().unwrap().replace("$TMP", &root)),
                    "{}: {}",
                    case["name"],
                    refusal.message
                );
            }
            None => same_bytes(
                &format!("read {}", case["name"]),
                &refusal_result(got),
                &expand(&case["result"], &root),
            ),
        }
    }
}
