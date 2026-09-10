//! Module graph assertions for `fgos-host-runtime`.
//!
//! Kernel §9 / Phase 06 R8:
//! Proves no host-runtime module imports another host-adapter-shaped module inappropriately.
//! Asserts by scanning `use` lines that `contracts.rs`, `catalog.rs`, `registry.rs`,
//! and `operation_provider_router.rs` never `use` anything from `invocation_service.rs`,
//! `authority_gate.rs`, or `providers::*`.
//! Also asserts that the two test-only projector shims in `two_projectors.rs` never `use` each other.

const CONTRACTS_SRC: &str = include_str!("../src/contracts.rs");
const CATALOG_SRC: &str = include_str!("../src/catalog.rs");
const REGISTRY_SRC: &str = include_str!("../src/registry.rs");
const ROUTER_SRC: &str = include_str!("../src/operation_provider_router.rs");
const TWO_PROJECTORS_SRC: &str = include_str!("two_projectors.rs");

fn check_no_forbidden_uses(file_name: &str, content: &str, forbidden: &[&str]) {
    for (line_no, line) in content.lines().enumerate() {
        let trimmed = line.trim();
        if trimmed.starts_with("use ") {
            for &term in forbidden {
                assert!(
                    !trimmed.contains(term),
                    "{}:{} forbidden import found: '{}' contains '{}'",
                    file_name,
                    line_no + 1,
                    trimmed,
                    term
                );
            }
        }
    }
}

#[test]
fn contracts_never_uses_upper_layers() {
    check_no_forbidden_uses(
        "contracts.rs",
        CONTRACTS_SRC,
        &["invocation_service", "authority_gate", "providers"],
    );
}

#[test]
fn catalog_never_uses_upper_layers() {
    check_no_forbidden_uses(
        "catalog.rs",
        CATALOG_SRC,
        &["invocation_service", "authority_gate", "providers"],
    );
}

#[test]
fn registry_never_uses_upper_layers() {
    check_no_forbidden_uses(
        "registry.rs",
        REGISTRY_SRC,
        &["invocation_service", "authority_gate", "providers"],
    );
}

#[test]
fn router_never_uses_upper_layers() {
    check_no_forbidden_uses(
        "operation_provider_router.rs",
        ROUTER_SRC,
        &["invocation_service", "authority_gate", "providers"],
    );
}

#[test]
fn projector_shims_never_use_each_other() {
    // Extract cli_projector and remote_projector module blocks
    let cli_start = TWO_PROJECTORS_SRC
        .find("pub mod cli_projector {")
        .expect("cli_projector mod not found");
    let remote_start = TWO_PROJECTORS_SRC
        .find("pub mod remote_projector {")
        .expect("remote_projector mod not found");

    assert!(cli_start < remote_start);

    let cli_section = &TWO_PROJECTORS_SRC[cli_start..remote_start];
    let remote_section = &TWO_PROJECTORS_SRC[remote_start..];

    // Check cli_projector does not use remote_projector or RemoteProjectorShim
    for (line_no, line) in cli_section.lines().enumerate() {
        let trimmed = line.trim();
        if trimmed.starts_with("use ") {
            assert!(
                !trimmed.contains("remote_projector") && !trimmed.contains("RemoteProjector"),
                "cli_projector:{} inappropriately uses remote_projector: '{}'",
                line_no + 1,
                trimmed
            );
        }
    }

    // Check remote_projector does not use cli_projector or CliProjectorShim
    for (line_no, line) in remote_section.lines().enumerate() {
        let trimmed = line.trim();
        if trimmed.starts_with("use ") {
            assert!(
                !trimmed.contains("cli_projector") && !trimmed.contains("CliProjector"),
                "remote_projector:{} inappropriately uses cli_projector: '{}'",
                line_no + 1,
                trimmed
            );
        }
    }
}
