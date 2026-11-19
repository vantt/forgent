//! The runtime socket directory: where it resolves, what `ensure` refuses, and which sockets are orphans.
//! Golden vectors recorded from `src/run-supervisor/runtime-dir.mjs`.
#![cfg(unix)]

use fgos_run_supervisor::controller::runtime_dir::*;
use serde_json::Value;
use std::collections::BTreeMap;
use std::os::unix::fs::PermissionsExt;
use std::os::unix::net::UnixListener;
use std::path::PathBuf;

fn vectors() -> Value {
    serde_json::from_str(include_str!(
        "../../contracts/controller/runtime-dir.v1.json"
    ))
    .unwrap()
}

fn env_of(value: &Value) -> BTreeMap<String, String> {
    value
        .as_object()
        .unwrap()
        .iter()
        .map(|(k, v)| (k.clone(), v.as_str().unwrap().to_string()))
        .collect()
}

fn scratch(name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("fgos-rtd-{name}-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

#[test]
fn runtime_dir_resolves_as_the_node_module_does() {
    for case in vectors()["resolve"].as_array().unwrap() {
        let env = env_of(&case["env"]);
        let dir = resolve_runtime_socket_dir(
            &|k| env.get(k).cloned(),
            case["uid"].as_u64().unwrap() as u32,
        );
        assert_eq!(dir.to_str().unwrap(), case["dir"].as_str().unwrap());
    }
}

#[test]
fn runtime_dir_too_long_for_a_socket_name_is_refused_with_the_node_code_and_message() {
    let case = &vectors()["ensureTooLong"];
    let env = env_of(&case["env"]);
    let error = ensure_runtime_socket_dir(
        &|k| env.get(k).cloned(),
        case["uid"].as_u64().unwrap() as u32,
    )
    .unwrap_err();
    assert_eq!(error.code, case["code"].as_str().unwrap());
    assert_eq!(error.message, case["message"].as_str().unwrap());
}

#[test]
fn runtime_dir_is_created_private_and_a_loose_mode_is_refused() {
    let root = scratch("ensure");
    let env: BTreeMap<String, String> =
        [("XDG_RUNTIME_DIR".to_string(), root.display().to_string())].into();
    let lookup = |k: &str| env.get(k).cloned();
    let uid = current_uid();
    let dir = ensure_runtime_socket_dir(&lookup, uid).unwrap();
    assert_eq!(dir, root.join("fgos"));
    assert_eq!(
        std::fs::metadata(&dir).unwrap().permissions().mode() & 0o777,
        0o700
    );
    assert_eq!(ensure_runtime_socket_dir(&lookup, uid).unwrap(), dir);
    std::fs::set_permissions(&dir, std::fs::Permissions::from_mode(0o755)).unwrap();
    assert_eq!(
        ensure_runtime_socket_dir(&lookup, uid).unwrap_err().code,
        "runtime-dir-permissions"
    );
    assert_eq!(
        ensure_runtime_socket_dir(&lookup, uid + 1)
            .unwrap_err()
            .code,
        "runtime-dir-wrong-owner"
    );
    std::fs::remove_dir(&dir).unwrap();
    std::fs::write(&dir, b"").unwrap();
    assert_eq!(
        ensure_runtime_socket_dir(&lookup, uid).unwrap_err().code,
        "runtime-dir-not-directory"
    );
    let _ = std::fs::remove_dir_all(&root);
}

#[test]
fn only_attempt_sockets_no_process_holds_are_removed() {
    let root = scratch("orphans");
    let env: BTreeMap<String, String> =
        [("XDG_RUNTIME_DIR".to_string(), root.display().to_string())].into();
    let lookup = |k: &str| env.get(k).cloned();
    let uid = current_uid();
    let dir = ensure_runtime_socket_dir(&lookup, uid).unwrap();
    let live_path = dir.join("00000000000000aa.sock");
    let live = UnixListener::bind(&live_path).unwrap();
    let dead_path = dir.join("00000000000000bb.sock");
    drop(UnixListener::bind(&dead_path).unwrap());
    let not_a_socket = dir.join("00000000000000cc.sock");
    std::fs::write(&not_a_socket, b"x").unwrap();
    let other_name = dir.join("notes.sock");
    drop(UnixListener::bind(&other_name).unwrap());
    let removed = remove_orphan_attempt_sockets(&lookup, Some(uid), None);
    assert_eq!(removed, vec![dead_path.clone()]);
    assert!(
        live_path.exists() && not_a_socket.exists() && other_name.exists() && !dead_path.exists()
    );
    // No kernel table: nothing can be judged, nothing is removed.
    assert!(
        remove_orphan_attempt_sockets(&lookup, Some(uid), Some(&root.join("no-such-table")))
            .is_empty()
    );
    assert!(remove_orphan_attempt_sockets(&lookup, None, None).is_empty());
    drop(live);
    let _ = std::fs::remove_dir_all(&root);
}
