//! `fgos internal context-engine <op> --protocol 1` as a process over a temporary project: `compile` writes the
//! compiled set and `check` refuses a bad fixture with a non-zero exit. The rules of the check and the shape of the
//! set are owned by the crate (`packages/agent-context-engine/rust/`); the units here are its contract vectors, and
//! this file proves the wiring of the binary over them.

use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicUsize, Ordering};

use fgos_agent_context_engine::set::EffectiveSet;
use serde_json::{json, Value};

const PREFIX: &str = "\u{1e}FGOS-CONTEXT-ENGINE ";

static PROJECTS: AtomicUsize = AtomicUsize::new(0);

fn repo_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../..")
        .canonicalize()
        .unwrap()
}

fn vector(relative: &str) -> Value {
    let path = repo_root()
        .join("packages/agent-context-engine/contracts/vectors")
        .join(relative);
    serde_json::from_str(&fs::read_to_string(path).unwrap()).unwrap()
}

/// Writes a vector's unit as a unit file: its frontmatter, then its body.
fn write_unit(project: &Path, entry: &Value, default_source: &str) {
    let source = entry
        .get("source")
        .and_then(Value::as_str)
        .unwrap_or(default_source);
    let path = project.join(source);
    fs::create_dir_all(path.parent().unwrap()).unwrap();
    let text = format!(
        "---\n{}\n---\n\n{}\n",
        serde_json::to_string_pretty(&entry["unit"]).unwrap(),
        entry["body"].as_str().unwrap()
    );
    fs::write(path, text).unwrap();
}

/// A project with the rule type's pack file and no rule yet.
fn temp_project() -> PathBuf {
    let project = std::env::temp_dir().join(format!(
        "fgos-context-engine-{}-{}",
        std::process::id(),
        PROJECTS.fetch_add(1, Ordering::SeqCst)
    ));
    let _ = fs::remove_dir_all(&project);
    fs::create_dir_all(project.join(".fgos")).unwrap();
    let pack = Path::new("packages/agent-context-engine/pkm");
    fs::create_dir_all(project.join(pack)).unwrap();
    for file in ["profile.yaml", "ace.yaml"] {
        fs::copy(
            repo_root().join(pack).join(file),
            project.join(pack).join(file),
        )
        .unwrap();
    }
    project
}

/// One door call: the exit code and the answer line behind the prefix.
fn door(op: &str, request: &Value) -> (i32, Value) {
    door_with(op, &[], &[], request)
}

/// A door call with more arguments and environment variables.
fn door_with(op: &str, extra: &[&str], env: &[(&str, &Path)], request: &Value) -> (i32, Value) {
    let mut child = Command::new(env!("CARGO_BIN_EXE_fgos"))
        .args(["internal", "context-engine", op, "--protocol", "1"])
        .args(extra)
        .envs(env.iter().copied())
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();
    writeln!(child.stdin.take().unwrap(), "{request}").unwrap();
    let out = child.wait_with_output().unwrap();
    let stdout = String::from_utf8(out.stdout).unwrap();
    let line = stdout
        .lines()
        .find_map(|line| line.strip_prefix(PREFIX))
        .unwrap_or_else(|| panic!("no answer line in {stdout:?}"));
    (
        out.status.code().unwrap(),
        serde_json::from_str(line).unwrap(),
    )
}

fn request(project: &Path) -> Value {
    json!({ "root": project, "asOf": "2026-11-26" })
}

#[test]
fn compile_writes_the_verified_set_and_the_index_view_for_a_clean_project() {
    let project = temp_project();
    write_unit(
        &project,
        &vector("valid-unit.json"),
        "core/instructions/example-rule.md",
    );

    let (code, answer) = door("compile", &request(&project));

    assert_eq!(code, 0, "{answer}");
    assert_eq!(answer["result"]["ok"], json!(true));
    let bytes = fs::read(project.join(".fgos/instructions/effective/rules.json")).unwrap();
    let set = EffectiveSet::read(&bytes).expect("the written set verifies its digest");
    assert_eq!(set.rules.len(), 1);
    assert_eq!(answer["result"]["digest"], json!(set.digest));
    assert!(project
        .join(".fgos/runtime/context-engine/rules.db")
        .is_file());
}

#[test]
fn a_refused_fixture_fails_check_with_its_code_and_compile_writes_nothing() {
    let project = temp_project();
    write_unit(
        &project,
        &vector("refusals/rule-owner-unknown.json"),
        "core/instructions/example-rule.md",
    );

    let (code, answer) = door("check", &request(&project));

    assert_ne!(code, 0, "{answer}");
    assert_eq!(answer["result"]["ok"], json!(false));
    let codes: Vec<&str> = answer["result"]["refusals"]
        .as_array()
        .unwrap()
        .iter()
        .filter_map(|r| r["code"].as_str())
        .collect();
    assert!(codes.contains(&"rule-owner-unknown"), "{answer}");

    let (code, _) = door("compile", &request(&project));
    assert_ne!(code, 0);
    assert!(!project
        .join(".fgos/instructions/effective/rules.json")
        .exists());
}

#[test]
fn a_protocol_other_than_one_and_an_unknown_op_are_refused_by_name() {
    let project = temp_project();
    let out = Command::new(env!("CARGO_BIN_EXE_fgos"))
        .args(["internal", "context-engine", "check", "--protocol", "2"])
        .stdin(Stdio::null())
        .output()
        .unwrap();
    assert_eq!(out.status.code(), Some(3));
    let (code, answer) = door("nonsense", &request(&project));
    assert_eq!(code, 2);
    assert_eq!(answer["error"]["code"], json!("usage"));
}

#[test]
fn check_with_paths_searches_those_units_and_is_refused_by_name_without_the_embedding_model() {
    let project = temp_project();
    let mut vector = vector("valid-unit.json");
    write_unit(&project, &vector, "core/instructions/example-rule.md");
    vector["unit"]["id"] = json!("example-rule-copy");
    write_unit(&project, &vector, "core/instructions/example-rule-copy.md");
    // A machine state folder with no model in it, so the answer does not depend on the machine running the test.
    let state = project.join("machine-state");
    fs::create_dir_all(&state).unwrap();
    let env = [("FGOS_STATE_HOME", state.as_path())];

    let (code, answer) = door_with(
        "check",
        &["--paths", "core/instructions/example-rule-copy.md"],
        &env,
        &request(&project),
    );

    assert_eq!(code, 1, "{answer}");
    let refusals = answer["result"]["refusals"].as_array().unwrap();
    assert_eq!(refusals.len(), 1, "{answer}");
    assert_eq!(refusals[0]["code"], json!("rule-search-unavailable"));
    assert!(
        refusals[0]["message"]
            .as_str()
            .unwrap()
            .contains("doc-locate-model-fetch"),
        "{answer}"
    );

    // An empty list names no unit: only the structural check runs, and it needs no model.
    let (code, answer) = door_with("check", &["--paths", ""], &env, &request(&project));
    assert_eq!(code, 0, "{answer}");
    assert_eq!(answer["result"]["advisories"], json!([]));

    // compile never searches.
    let (code, answer) = door_with("compile", &[], &env, &request(&project));
    assert_eq!(code, 0, "{answer}");
}

#[test]
fn paths_belongs_to_check_only() {
    let project = temp_project();
    let (code, answer) = door_with("compile", &["--paths", "x"], &[], &request(&project));
    assert_eq!(code, 2, "{answer}");
    assert_eq!(answer["error"]["code"], json!("usage"));
}
