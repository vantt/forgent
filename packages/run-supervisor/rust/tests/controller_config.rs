//! `dispatch.gateKillGraceMs` and `dispatch.cancelWaitMs` through the config door, with the layer that set
//! each. Vectors: `contracts/controller/config.v1.json` (standard values from `core/config-standard/dispatch.yaml`).

use fgos_run_supervisor::controller::config::*;
use serde_json::Value;
use std::path::PathBuf;

fn scratch(name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("fgos-ctlcfg-{name}-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

fn yaml(section: &Value) -> String {
    let mut text = String::from("# @fgos:v1\ndispatch:\n");
    for (key, value) in section.as_object().unwrap() {
        text.push_str(&format!("  {key}: {value}\n"));
    }
    text
}

#[test]
fn dispatch_settings_resolve_project_over_global_over_standard() {
    let vectors: Value =
        serde_json::from_str(include_str!("../../contracts/controller/config.v1.json")).unwrap();
    for (n, case) in vectors["cases"].as_array().unwrap().iter().enumerate() {
        let dir = scratch(&format!("case{n}"));
        let global = dir.join("home/.fgos");
        let project = dir.join("project");
        std::fs::create_dir_all(&global).unwrap();
        std::fs::create_dir_all(project.join(".fgos")).unwrap();
        if !case["global"].is_null() {
            std::fs::write(global.join("config.yaml"), yaml(&case["global"])).unwrap();
        }
        if !case["project"].is_null() {
            std::fs::write(project.join(".fgos/config.yaml"), yaml(&case["project"])).unwrap();
        }
        let snapshot =
            read_dispatch_config(Some(&project), Some(&global.join("config.yaml"))).unwrap();
        let grace = resolve_gate_kill_grace(&snapshot).unwrap();
        let wait = resolve_cancel_wait(&snapshot).unwrap();
        let name = case["name"].as_str().unwrap();
        assert_eq!(
            (grace.value, grace.source.as_str()),
            (
                case["gateKillGrace"]["value"].as_u64().unwrap(),
                case["gateKillGrace"]["source"].as_str().unwrap()
            ),
            "{name}"
        );
        assert_eq!(
            (wait.value, wait.source.as_str()),
            (
                case["cancelWait"]["value"].as_u64().unwrap(),
                case["cancelWait"]["source"].as_str().unwrap()
            ),
            "{name}"
        );
        let _ = std::fs::remove_dir_all(&dir);
    }
}

#[test]
fn a_config_file_the_door_refuses_is_an_error_not_a_default() {
    let dir = scratch("refused");
    let project = dir.join("project");
    std::fs::create_dir_all(project.join(".fgos")).unwrap();
    std::fs::write(
        project.join(".fgos/config.yaml"),
        "# @fgos:v1\ndispatch:\n  gateKillGraceMs: 5\n",
    )
    .unwrap();
    let global = dir.join("home/.fgos");
    std::fs::create_dir_all(&global).unwrap();
    assert!(read_dispatch_config(Some(&project), Some(&global.join("config.yaml"))).is_err());
    let _ = std::fs::remove_dir_all(&dir);
}
