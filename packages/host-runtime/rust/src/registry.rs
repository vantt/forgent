//! Registry snapshot constructor and test snapshot for `fgos-host-runtime`.
//!
//! Kernel §5 / §6: `RegistrySnapshot` is an immutable linked provider registry
//! for an invocation.
//!
//! In R1, the production snapshot is assembled once at the `apps/fgos` composition
//! root (Phase 08) by calling [`build_snapshot`] with the real provider list —
//! `fgos-host-runtime` never depends downward on a provider crate.

use crate::catalog::CATALOG;
use crate::contracts::{
    ContractRef, OperationCatalog, OperationId, ProviderDescriptor, ProviderLifecycle,
    RegistrySnapshot,
};
use std::borrow::Cow;

/// Builds an immutable [`RegistrySnapshot`].
///
/// Linking performs exact binding validation: duplicate provider bindings for the same
/// operation (without an explicit replacement) fail linking immediately.
///
/// Note: The production snapshot is assembled once at the `apps/fgos` composition root
/// (Phase 08) by calling this same constructor with the real provider list —
/// `fgos-host-runtime` never depends downward on a provider crate.
pub fn build_snapshot(
    catalog: OperationCatalog,
    providers: &'static [ProviderDescriptor],
    fingerprint: &'static str,
) -> RegistrySnapshot {
    // Exact binding validation: fail linking if duplicate bindings exist for any operation.
    for (i, p1) in providers.iter().enumerate() {
        for p2 in providers.iter().skip(i + 1) {
            if p1.operation_id == p2.operation_id {
                let p1_replaces_p2 = p1.replacement == Some(p2.provider_id.as_ref());
                let p2_replaces_p1 = p2.replacement == Some(p1.provider_id.as_ref());
                if !p1_replaces_p2 && !p2_replaces_p1 {
                    panic!(
                        "duplicate binding fails linking: operation '{}' has duplicate bindings ('{}' and '{}')",
                        p1.operation_id.as_str(),
                        p1.provider_id,
                        p2.provider_id
                    );
                }
            }
        }
    }

    RegistrySnapshot {
        catalog,
        providers,
        fingerprint,
    }
}

/// Fixture provider descriptor for `test.fixture.echo`.
#[allow(dead_code)]
pub(crate) const FIXTURE_ECHO_PROVIDER: ProviderDescriptor = ProviderDescriptor {
    provider_id: Cow::Borrowed("test.fixture.echo.builtin"),
    operation_id: OperationId::from_static("test.fixture.echo"),
    component_class: Cow::Borrowed("test"),
    mechanism: Cow::Borrowed("builtin"),
    lifecycle: ProviderLifecycle::Singleton,
    request_contract: ContractRef::from_static("test.fixture.echo.request", "1.0.0"),
    outcome_contract: ContractRef::from_static("test.fixture.echo.outcome", "1.0.0"),
    allowed_hosts: &["cli", "remote", "test"],
    allowed_modes: &["sync", "test"],
    capabilities: &[],
    replacement: None,
    concurrency: None,
    health: None,
};

/// Test providers table containing only in-crate fixture providers.
#[allow(dead_code)]
pub(crate) const TEST_PROVIDERS: &[ProviderDescriptor] = &[FIXTURE_ECHO_PROVIDER];

/// Crate-private snapshot built only from in-crate fixture providers, for this
/// phase's own tests. It never references `fgos-distribution`.
#[allow(dead_code)]
pub(crate) const SNAPSHOT_FOR_TESTS: RegistrySnapshot = RegistrySnapshot {
    catalog: CATALOG,
    providers: TEST_PROVIDERS,
    fingerprint: "snapshot-for-tests-v1",
};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn snapshot_for_tests_contains_only_fixtures() {
        assert_eq!(SNAPSHOT_FOR_TESTS.providers.len(), 1);
        assert_eq!(
            SNAPSHOT_FOR_TESTS.providers[0].operation_id.as_str(),
            "test.fixture.echo"
        );
        assert_eq!(SNAPSHOT_FOR_TESTS.fingerprint, "snapshot-for-tests-v1");
    }
}
