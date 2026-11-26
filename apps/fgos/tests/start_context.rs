//! `fgos internal start-context compose --protocol 1` as a process over a temporary project: the wiring of the
//! binary (the compiled rule set, the host's live values, Observe's record door). What compose selects and refuses is
//! owned by the crate's vector tests (`packages/agent-start-context/rust/tests/`).

use std::fs;
use std::io::Write;
use std::path::PathBuf;
use std::process::{Command, Stdio};

use serde_json::{json, Value};

const PREFIX: &str = "\u{1e}FGOS-START-CONTEXT ";

fn repo_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../..")
        .canonicalize()
        .unwrap()
}

/// A project with the agent context engine's vector rule set compiled in place and one domain whose registry
/// declares the role `producer`.
fn project(name: &str) -> PathBuf {
    let root =
        std::env::temp_dir().join(format!("fgos-start-context-{name}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&root);
    fs::create_dir_all(root.join(".fgos/instructions/effective")).unwrap();
    fs::copy(
        repo_root().join("packages/agent-context-engine/contracts/vectors/effective-set.json"),
        root.join(".fgos/instructions/effective/rules.json"),
    )
    .unwrap();
    fs::create_dir_all(root.join("domains/alpha")).unwrap();
    fs::write(
        root.join("domains/alpha/registry.yaml"),
        "roleGraph:\n  roles:\n    - producer\n",
    )
    .unwrap();
    root
}

fn compose(root: &PathBuf, request: &Value) -> (i32, Value) {
    let mut child = Command::new(env!("CARGO_BIN_EXE_fgos"))
        .args([
            "internal",
            "start-context",
            "compose",
            "--protocol",
            "1",
            "--root",
        ])
        .arg(root)
        .env("FGOS_SESSION_ID", "start-context-test")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();
    child
        .stdin
        .take()
        .unwrap()
        .write_all(request.to_string().as_bytes())
        .unwrap();
    let out = child.wait_with_output().unwrap();
    let stdout = String::from_utf8(out.stdout).unwrap();
    let line = stdout
        .lines()
        .find_map(|l| l.strip_prefix(PREFIX))
        .unwrap_or_else(|| panic!("no answer: {stdout}"));
    (
        out.status.code().unwrap(),
        serde_json::from_str(line).unwrap(),
    )
}

fn records(root: &PathBuf) -> Vec<Value> {
    let dir = root.join(".fgos/observe/records");
    let Ok(entries) = fs::read_dir(&dir) else {
        return Vec::new();
    };
    entries
        .flat_map(|e| {
            let text = fs::read_to_string(e.unwrap().path()).unwrap_or_default();
            text.lines()
                .filter_map(|l| serde_json::from_str::<Value>(l).ok())
                .collect::<Vec<Value>>()
        })
        .filter(|r: &Value| r["kind"] == "fgos.start.context")
        .collect()
}

#[test]
fn the_door_composes_a_worker_start_from_the_compiled_set_and_writes_one_start_context_record() {
    let root = project("worker");
    let (code, answer) = compose(
        &root,
        &json!({
            "facts": {"sessionType": "worker", "role": "producer", "project": "demo", "agentCli": "claude"},
            "payloads": [{"kind": "assignment", "text": "Objective: fix the parser."}],
            "delivery": "prompt-arg"
        }),
    );
    assert_eq!(code, 0, "{answer}");
    let result = &answer["result"];
    assert_eq!(result["matched"], json!(["example-rule"]));
    let sources: Vec<&str> = result["blocks"]
        .as_array()
        .unwrap()
        .iter()
        .map(|b| b["source"].as_str().unwrap())
        .collect();
    assert_eq!(sources, ["rule:example-rule", "payload:assignment"]);
    let written = records(&root);
    assert_eq!(written.len(), 1, "one record per start");
    assert_eq!(written[0]["id"], result["record"]);
    assert_eq!(
        written[0]["attrs"]["fgos.start.context.matched"],
        "example-rule"
    );
    let _ = fs::remove_dir_all(&root);
}

#[test]
fn the_door_refuses_a_value_the_live_source_does_not_allow_and_writes_no_record() {
    let root = project("refused");
    let (code, answer) = compose(
        &root,
        &json!({
            "facts": {"sessionType": "worker", "role": "tester", "project": "demo", "agentCli": "claude"},
            "payloads": [],
            "delivery": "prompt-arg"
        }),
    );
    assert_eq!(code, 1);
    assert_eq!(
        answer["refusal"]["code"], "start-fact-value-invalid",
        "{answer}"
    );
    assert!(records(&root).is_empty());
    let _ = fs::remove_dir_all(&root);
}

#[test]
fn the_door_gives_a_rotation_successor_its_lineage_handoff_through_the_registered_contributor() {
    let root = project("handoff");
    fs::create_dir_all(root.join("core/agents")).unwrap();
    fs::copy(
        repo_root().join("core/agents/lead.yaml"),
        root.join("core/agents/lead.yaml"),
    )
    .unwrap();
    let lineage = root.join(".fgos/runtime/session-rotation/lead-alpha");
    fs::create_dir_all(&lineage).unwrap();
    fs::write(lineage.join("261127-0500-abcd1234.md"), "# Handoff\nwhere it stood\n").unwrap();
    fs::write(
        lineage.join("latest.json"),
        "{\"file\":\"261127-0500-abcd1234.md\",\"session\":\"s\",\"rotate\":\"soft\",\"writtenAt\":\"2026-11-27T00:00:00.000Z\"}\n",
    )
    .unwrap();
    let (code, answer) = compose(
        &root,
        &json!({
            "facts": {"sessionType": "head", "persona": "lead", "project": "demo", "agentCli": "claude", "agentLifecycle": "rotate"},
            "payloads": [{"kind": "session", "name": "alpha"}],
            "delivery": "opening"
        }),
    );
    assert_eq!(code, 0, "{answer}");
    let handoff: Vec<&Value> = answer["result"]["blocks"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|b| b["source"] == "contributor:rotation-handoff")
        .collect();
    assert_eq!(handoff.len(), 1, "{answer}");
    assert_eq!(handoff[0]["text"], "# Handoff\nwhere it stood\n");
    let _ = fs::remove_dir_all(&root);
}
