use std::process::Command;

#[test]
fn test_observe_dependency_boundary() {
    let output = Command::new("cargo")
        .args(["metadata", "--format-version", "1"])
        .output()
        .expect("failed to run cargo metadata");
    assert!(output.status.success());

    let json: serde_json::Value =
        serde_json::from_slice(&output.stdout).expect("failed to parse cargo metadata output");

    let packages = json["packages"]
        .as_array()
        .expect("expected packages array");
    let observe_pkg = packages
        .iter()
        .find(|p| p["name"] == "fgos-observe")
        .expect("fgos-observe package not found");

    let deps = observe_pkg["dependencies"]
        .as_array()
        .expect("expected dependencies array");
    let internal_fgos_deps: Vec<&str> = deps
        .iter()
        .filter_map(|d| d["name"].as_str())
        .filter(|name| name.starts_with("fgos-"))
        .collect();

    // Observe should ONLY depend on fgos-host-runtime internally
    assert_eq!(
        internal_fgos_deps,
        vec!["fgos-host-runtime"],
        "fgos-observe must not depend on domain/substrate crates directly"
    );
}
