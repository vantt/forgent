//! Owning proof of `PathDetectors` (spec section 8): the executor found on the `PATH` the caller
//! passes. Real directories with real files as the `PATH`.
#![cfg(unix)]
mod common;

use std::ffi::OsString;
use std::fs;
use std::os::unix::fs::PermissionsExt;
use std::path::Path;

use fgos_config::detect::{Detectors, PathDetectors};
use fgos_config::machine::context;
use fgos_config::snapshot::{snapshot, SessionClass, SnapshotRequest};
use fgos_yaml_doc::Segment;
use serde_json::{json, Value};

fn key(name: &str) -> Segment {
    Segment::Key(name.into())
}

fn program(dir: &Path, name: &str, mode: u32) {
    fs::create_dir_all(dir).unwrap();
    fs::write(dir.join(name), "#!/bin/sh\n").unwrap();
    fs::set_permissions(dir.join(name), fs::Permissions::from_mode(mode)).unwrap();
}

fn path_of(dirs: &[&Path]) -> Option<OsString> {
    std::env::join_paths(dirs).ok()
}

fn found(path: Option<OsString>) -> Option<Value> {
    let executor = [key("runner"), key("executor")];
    PathDetectors { path }
        .detect(&executor)
        .map(|v| v.to_json())
}

fn claude_template() -> Value {
    json!({"command": "claude", "args": ["-p", "{prompt}", "--model", "{model}", "--permission-mode", "acceptEdits"]})
}

#[test]
fn the_first_candidate_found_decides_and_only_claude_has_a_template() {
    let dir = common::temp("detect", "order");
    let (a, b) = (dir.join("a"), dir.join("b"));
    program(&b, "codex", 0o755);
    assert_eq!(
        found(path_of(&[&a, &b])),
        None,
        "codex alone is found but has no verified argv"
    );
    program(&a, "claude", 0o755);
    assert_eq!(found(path_of(&[&a, &b])), Some(claude_template()));
    // `claude` wins over `codex` wherever each one sits on the PATH.
    assert_eq!(found(path_of(&[&b, &a])), Some(claude_template()));
}

#[test]
fn the_template_is_the_claude_cli_invocation_of_the_runner_standard() {
    let ctx = context(&PathDetectors { path: None }).unwrap();
    let invocation = &ctx.standard.value()["runner"]["executors"]["claude"]["invocations"][0];
    let (command, args) = (&invocation["command"], &invocation["args"]);
    assert_eq!(json!({"command": command, "args": args}), claude_template());
}

#[test]
fn a_file_that_cannot_run_a_relative_entry_and_no_path_find_nothing() {
    let dir = common::temp("detect", "unfit");
    let (plain, real) = (dir.join("plain"), dir.join("real"));
    program(&plain, "claude", 0o644);
    assert_eq!(found(path_of(&[&plain])), None, "no execute bit");
    fs::create_dir_all(plain.join("claude-dir")).unwrap();
    assert_eq!(found(Some("relative/bin".into())), None);
    program(&real, "claude", 0o755);
    let relative = path_of(&[Path::new("real"), &plain]);
    assert_eq!(
        found(relative),
        None,
        "a relative entry depends on the working directory"
    );
    assert_eq!(found(None), None);
    assert_eq!(found(Some(OsString::new())), None);
}

#[test]
fn only_the_default_executor_path_is_ever_detected() {
    let dir = common::temp("detect", "paths");
    program(&dir.join("bin"), "claude", 0o755);
    let detectors = PathDetectors {
        path: path_of(&[&dir.join("bin")]),
    };
    for path in [
        vec![key("runner")],
        vec![key("runner"), key("other")],
        vec![key("gateway"), key("executor")],
    ] {
        assert!(detectors.detect(&path).is_none(), "{path:?}");
    }
}

#[test]
fn a_snapshot_names_the_detected_layer_for_an_executor_no_file_sets() {
    let dir = common::temp("detect", "snapshot");
    program(&dir.join("bin"), "claude", 0o755);
    let detectors = PathDetectors {
        path: path_of(&[&dir.join("bin")]),
    };
    let ctx = context(&detectors).unwrap();
    let project = dir.join("project");
    fs::create_dir_all(&project).unwrap();
    let req = SnapshotRequest {
        trusted_root: project.clone(),
        project_root: project,
        global_dir: dir.join("home/.fgos"),
        class: SessionClass::Unconfined,
    };
    let snap = snapshot(&ctx, &req).unwrap();
    assert_eq!(snap.value["runner"]["executor"], claude_template());
    let origin = snap
        .origins
        .iter()
        .find(|o| o.path == [key("runner"), key("executor"), key("command")]);
    assert_eq!(origin.map(|o| o.provenance.layer), Some("detected"));
}

#[test]
fn the_fingerprint_changes_exactly_when_the_answer_can() {
    let dir = common::temp("detect", "fingerprint");
    let bin = dir.join("bin");
    let print = |path: Option<OsString>| PathDetectors { path }.fingerprint();
    let (empty, same) = (print(path_of(&[&bin])), print(path_of(&[&bin])));
    assert_eq!(empty, same);
    program(&bin, "claude", 0o755);
    assert_ne!(
        print(path_of(&[&bin])),
        empty,
        "the program appearing on the same PATH"
    );
    assert_ne!(
        print(path_of(&[&dir])),
        print(path_of(&[&bin])),
        "another PATH"
    );
}
