use fgos_observe::contract::ObserveRequest;
use fgos_observe::metrics_cli::harness::{
    count_protocols_defined, count_protocols_used, dispatch_harness,
};
use std::fs;
use std::path::{PathBuf};

struct TempDirGuard(PathBuf);
impl Drop for TempDirGuard {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

fn create_temp_fixture(name: &str) -> (PathBuf, TempDirGuard) {
    let dir = std::env::temp_dir().join(format!(
        "fgos_test_harness_proto_{}_{}_{}",
        name,
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    let guard = TempDirGuard(dir.clone());
    (dir, guard)
}

#[test]
fn test_harness_protocols_defined_and_used() {
    let (root, _guard) = create_temp_fixture("full_coverage");

    // Tier 1: Project (.fgos/coordination-protocols)
    let project_dir = root.join(".fgos").join("coordination-protocols");
    fs::create_dir_all(&project_dir).unwrap();
    fs::write(
        project_dir.join("proto1.yaml"),
        "apiVersion: fgos.dev/v1alpha1\nkind: FlowDefinition\nmetadata:\n  id: proto-shared-1\nspec:\n  profile:\n    kind: CoordinationProtocol\n",
    ).unwrap();
    fs::write(
        project_dir.join("proto2.yml"),
        "apiVersion: fgos.dev/v1alpha1\nkind: FlowDefinition\nmetadata:\n  id: proto-project-only\nspec:\n  profile:\n    kind: CoordinationProtocol\n",
    ).unwrap();

    // Tier 2: Domain (domains/<domain>/coordination-protocols)
    let domain_coding = root.join("domains").join("coding").join("coordination-protocols");
    fs::create_dir_all(&domain_coding).unwrap();
    fs::write(
        domain_coding.join("proto_d1.yaml"),
        "apiVersion: fgos.dev/v1alpha1\nkind: FlowDefinition\nmetadata:\n  id: proto-shared-1\nspec:\n  profile:\n    kind: CoordinationProtocol\n",
    ).unwrap();
    fs::write(
        domain_coding.join("proto_d2.yaml"),
        "apiVersion: fgos.dev/v1alpha1\nkind: FlowDefinition\nmetadata:\n  id: proto-shared-core\nspec:\n  profile:\n    kind: CoordinationProtocol\n",
    ).unwrap();
    fs::write(
        domain_coding.join("proto_d3.yaml"),
        "apiVersion: fgos.dev/v1alpha1\nkind: FlowDefinition\nmetadata:\n  id: proto-domain-only\nspec:\n  profile:\n    kind: CoordinationProtocol\n",
    ).unwrap();

    let domain_review = root.join("domains").join("review").join("coordination-protocols");
    fs::create_dir_all(&domain_review).unwrap();
    fs::write(
        domain_review.join("proto_r1.json"),
        r#"{"apiVersion":"fgos.dev/v1alpha1","kind":"FlowDefinition","metadata":{"id":"proto-domain-json"},"spec":{"profile":{"kind":"CoordinationProtocol"}}}"#,
    ).unwrap();

    // Tier 3: Core (core/coordination-protocols)
    let core_dir = root.join("core").join("coordination-protocols");
    fs::create_dir_all(&core_dir).unwrap();
    fs::write(
        core_dir.join("proto_c1.yaml"),
        "apiVersion: fgos.dev/v1alpha1\nkind: FlowDefinition\nmetadata:\n  id: proto-shared-1\nspec:\n  profile:\n    kind: CoordinationProtocol\n",
    ).unwrap();
    fs::write(
        core_dir.join("proto_c2.yaml"),
        "apiVersion: fgos.dev/v1alpha1\nkind: FlowDefinition\nmetadata:\n  id: proto-shared-core\nspec:\n  profile:\n    kind: CoordinationProtocol\n",
    ).unwrap();
    fs::write(
        core_dir.join("proto_c3.yaml"),
        "apiVersion: fgos.dev/v1alpha1\nkind: FlowDefinition\nmetadata:\n  id: proto-core-only\nspec:\n  profile:\n    kind: CoordinationProtocol\n",
    ).unwrap();
    // Corrupted file in core
    fs::write(core_dir.join("corrupted.yaml"), "::: broken yaml :::\n").unwrap();
    // Non-protocol file
    fs::write(core_dir.join("readme.txt"), "some random text\n").unwrap();

    // Sessions in .fgos/coordination/sessions/*/session.json
    let sessions_dir = root.join(".fgos").join("coordination").join("sessions");
    fs::create_dir_all(&sessions_dir).unwrap();

    // Session 1: valid definitionRef
    let s1_dir = sessions_dir.join("sess-1");
    fs::create_dir_all(&s1_dir).unwrap();
    fs::write(
        s1_dir.join("session.json"),
        r#"{"id":"sess-1","definitionRef":{"id":"proto-shared-1","version":"1.0.0"}}"#,
    ).unwrap();

    // Session 2: duplicate definitionRef id
    let s2_dir = sessions_dir.join("sess-2");
    fs::create_dir_all(&s2_dir).unwrap();
    fs::write(
        s2_dir.join("session.json"),
        r#"{"id":"sess-2","definitionRef":{"id":"proto-shared-1","version":"2.0.0"}}"#,
    ).unwrap();

    // Session 3: another distinct definitionRef id
    let s3_dir = sessions_dir.join("sess-3");
    fs::create_dir_all(&s3_dir).unwrap();
    fs::write(
        s3_dir.join("session.json"),
        r#"{"id":"sess-3","definitionRef":{"id":"proto-used-2","version":"1.0.0"}}"#,
    ).unwrap();

    // Session 4: definitionRef is null (agent-led)
    let s4_dir = sessions_dir.join("sess-4");
    fs::create_dir_all(&s4_dir).unwrap();
    fs::write(
        s4_dir.join("session.json"),
        r#"{"id":"sess-4","definitionRef":null}"#,
    ).unwrap();

    // Session 5: no definitionRef field
    let s5_dir = sessions_dir.join("sess-5");
    fs::create_dir_all(&s5_dir).unwrap();
    fs::write(
        s5_dir.join("session.json"),
        r#"{"id":"sess-5","status":"active"}"#,
    ).unwrap();

    // Session 6: corrupted session.json
    let s6_dir = sessions_dir.join("sess-6");
    fs::create_dir_all(&s6_dir).unwrap();
    fs::write(
        s6_dir.join("session.json"),
        r#"{"id":"sess-6", broken json here"#,
    ).unwrap();

    // Session 7: session dir without session.json
    let s7_dir = sessions_dir.join("sess-7");
    fs::create_dir_all(&s7_dir).unwrap();

    // Assert counts via helper functions
    let defined = count_protocols_defined(&root);
    assert_eq!(defined, 6, "expected 6 unique protocols defined across 3 tiers");

    let used = count_protocols_used(&root);
    assert_eq!(used, 2, "expected 2 unique protocols used (excluding null, missing, corrupt)");

    // Assert counts via dispatch_harness end-to-end
    let req = ObserveRequest {
        operation: "metrics".to_string(),
        sub: "harness".to_string(),
        args: vec!["--dir".to_string(), root.to_string_lossy().to_string()],
        root: root.clone(),
        stdin: None,
    };
    let output = dispatch_harness(&req, &[]).expect("dispatch_harness should succeed");
    assert_eq!(output["complexity"]["protocols_defined"], 6);
    assert_eq!(output["complexity"]["protocols_used"], 2);
}
