//! Shared by the golden runners: fixture loading and the inline-YAML conventions of the fixtures.
#![allow(dead_code)]
use std::path::{Path, PathBuf};

use fgos_config::snapshot::{SessionClass, SnapshotRequest};
use serde_json::Value;

pub fn contracts() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../contracts")
}

/// The whole fixture document: its cases and any shared members of its own.
pub fn fixture(file: &str) -> Value {
    let path = contracts().join("fixtures").join(file);
    let text = std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display()));
    serde_json::from_str(&text).unwrap_or_else(|e| panic!("{file}: {e}"))
}

pub fn cases(file: &str) -> Vec<Value> {
    let doc = fixture(file);
    doc["cases"]
        .as_array()
        .unwrap_or_else(|| panic!("{file}: cases"))
        .clone()
}

/// The writer identity of a fixture: a `session` id or a `pid`.
pub fn writer(spec: &Value) -> fgos_identity::WriterIdentity {
    use fgos_identity::{Source, WriterId, WriterIdentity};
    let (id, source) = match (spec["session"].as_str(), spec["pid"].as_u64()) {
        (Some(s), _) => (WriterId::Session(s.to_string()), Source::Env),
        (_, Some(p)) => (WriterId::Pid(p as u32), Source::Pid),
        _ => panic!("writer needs session or pid"),
    };
    WriterIdentity {
        id,
        source,
        env_var: None,
        cli: None,
    }
}

/// A file is an array of lines in the fixtures.
pub fn text(lines: &Value) -> String {
    let lines: Vec<&str> = lines
        .as_array()
        .expect("lines")
        .iter()
        .map(|l| l.as_str().expect("line"))
        .collect();
    lines.join("\n") + "\n"
}

/// `(section, bytes)` of a `{section: lines}` map in the map's order. A schema gets its `$id` line
/// first unless it states one itself.
pub fn files(map: &Value, schema: bool) -> Vec<(String, Vec<u8>)> {
    let Some(map) = map.as_object() else {
        return Vec::new();
    };
    map.iter()
        .map(|(name, lines)| {
            let mut body = text(lines);
            if schema && !body.contains("$id:") {
                body = format!("$id: urn:fgos:config-schema:{name}:v1\n{body}");
            }
            (name.clone(), body.into_bytes())
        })
        .collect()
}

pub fn refs(files: &[(String, Vec<u8>)]) -> Vec<(&str, &[u8])> {
    files
        .iter()
        .map(|(n, b)| (n.as_str(), b.as_slice()))
        .collect()
}

/// A fresh empty directory for one case of a runner.
pub fn temp(prefix: &str, id: &str) -> PathBuf {
    let dir =
        std::env::temp_dir().join(format!("fgos-config-{prefix}-{id}-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&dir);
    dir
}

/// Writes the `files` of a case (path to lines) under `dir` and names its roots: `project/`, `main/`
/// (the trusted root, when a file lies under it) and `home/.fgos/` (global; `private/accounts.yaml`).
pub fn lay_out(dir: &Path, input: &Value) -> SnapshotRequest {
    for (rel, lines) in input["files"].as_object().into_iter().flatten() {
        let path = dir.join(rel);
        std::fs::create_dir_all(path.parent().expect("parent")).expect("create directory");
        std::fs::write(path, text(lines)).expect("write file");
    }
    let project = dir.join("project");
    SnapshotRequest {
        trusted_root: if dir.join("main").exists() {
            dir.join("main")
        } else {
            project.clone()
        },
        project_root: project,
        global_dir: dir.join("home/.fgos"),
        class: if input["class"] == "confined" {
            SessionClass::Confined
        } else {
            SessionClass::Unconfined
        },
    }
}

/// The section schemas and standard layer a fixture states at its top.
pub fn schemas_and_standard(
    fixture: &Value,
) -> (
    fgos_config::schema::Schemas,
    fgos_config::standard::Standard,
) {
    let schema_files = files(&fixture["schemas"], true);
    let schemas = fgos_config::schema::Schemas::parse(&refs(&schema_files)).expect("schemas");
    let standard_files = files(&fixture["standard"], false);
    let standard =
        fgos_config::standard::Standard::parse(&refs(&standard_files), &schemas).expect("standard");
    (schemas, standard)
}

/// The write of a case: its target, the revision it was computed against (`current`, `absent` or
/// `stale`), edits, reason and acknowledgement. Also the file the target is.
#[cfg(unix)]
pub fn write_request(
    dir: &Path,
    input: &Value,
    roots: SnapshotRequest,
) -> (fgos_config::write::WriteRequest, &'static str) {
    use fgos_config::scope::SourceKind;
    use fgos_config::write::{Edit, WriteRequest};
    use sha2::{Digest, Sha256};
    let (target, file) = match input["target"].as_str() {
        Some("global") => (SourceKind::Global, "home/.fgos/config.yaml"),
        Some("accounts") => (SourceKind::Accounts, "home/.fgos/private/accounts.yaml"),
        _ => (SourceKind::Project, "project/.fgos/config.yaml"),
    };
    let expected = match input["expected"].as_str() {
        Some("absent") => None,
        Some("stale") => Some("0".repeat(64)),
        _ => std::fs::read(dir.join(file))
            .ok()
            .map(|bytes| format!("{:x}", Sha256::digest(bytes))),
    };
    let path = |p: &Value| match p.as_str().expect("path") {
        "" => Vec::new(),
        text => fgos_yaml_doc::path::parse_path(text).expect("path text"),
    };
    let edit = |e: &Value| match e.get("unset") {
        Some(p) => Edit::Unset { path: path(p) },
        None => Edit::Set {
            path: path(&e["set"]),
            value: e["value"].clone(),
        },
    };
    let request = WriteRequest {
        roots,
        lock_root: dir.join("locks"),
        target,
        expected,
        edits: input["edits"]
            .as_array()
            .expect("edits")
            .iter()
            .map(edit)
            .collect(),
        reason: input["reason"].as_str().expect("reason").to_string(),
        acknowledge_comment_loss: input["ack"] == true,
        lock_wait_ms: 2000,
    };
    (request, file)
}
