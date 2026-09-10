//! Operation Provider Router for `fgos-host-runtime`.
//!
//! Kernel §6: Pure selection function.
//! No I/O, no runtime background task engine, no panic on invalid input.
//!
//! The Router reads the `RegistrySnapshot`, matches operation, invocation mode,
//! host kind, and exact contract versions. It performs exact binding only —
//! no priority, no registration order, no last-writer-wins.
//!
//! **Deliberately not checked here: `RegistrySnapshot.catalog` membership,
//! or `OperationDescriptor.allowed_host_kinds`.** The canonical Router
//! signature (`host-invocation-provider-routing.md` §6) is "matches
//! operation/mode/host/compatible contract versions" against the PROVIDER
//! table only; this phase's own R4 (`SelectionInput`'s field list) and R6
//! (the seven named test cases) never mention catalog membership either.
//! Catalog-authored constraints belong to a different, not-yet-built stage
//! (most likely Phase 06's admission gate, which reads `OperationDescriptor`
//! to decide whether a caller may even reach `select` at all) — adding a
//! second, independent enforcement point here would risk the two drifting
//! out of sync rather than adding real safety.

use crate::contracts::{OperationId, ProviderDescriptor, RegistrySnapshot};

/// Extensible router policy placeholder for R1.
///
/// In R1, this is an empty placeholder struct, extensible in later phases,
/// and never referenced by selection logic yet.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct RouterPolicy;

/// Normalized input parameters required for provider selection.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SelectionInput<'a> {
    pub operation: OperationId,
    pub request_contract_version: &'a str,
    pub outcome_contract_version: &'a str,
    pub host_kind: &'a str,
    pub invocation_mode: &'a str,
    pub policy: RouterPolicy,
}

/// Refusal reason when provider selection cannot be satisfied.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum SelectionRefused {
    #[error("no provider binding found for operation '{operation}'")]
    MissingBinding { operation: OperationId },
    #[error("ambiguous provider binding for operation '{operation}': found {candidate_count} candidates")]
    AmbiguousBinding {
        operation: OperationId,
        candidate_count: usize,
    },
    #[error("incompatible contract version for operation '{operation}': requested ({requested_request_version}, {requested_outcome_version}), provider supports ({provider_request_version}, {provider_outcome_version})")]
    IncompatibleContract {
        operation: OperationId,
        requested_request_version: String,
        provider_request_version: String,
        requested_outcome_version: String,
        provider_outcome_version: String,
    },
    #[error("disallowed host kind '{requested_host}' for operation '{operation}'")]
    DisallowedHostKind {
        operation: OperationId,
        requested_host: String,
        allowed_hosts: Vec<String>,
    },
    #[error("wrong invocation mode '{requested_mode}' for operation '{operation}'")]
    WrongInvocationMode {
        operation: OperationId,
        requested_mode: String,
        allowed_modes: Vec<String>,
    },
}

/// Pure, synchronous provider selection function.
///
/// Given a [`SelectionInput`] and an immutable [`RegistrySnapshot`], selects
/// exactly one matching [`ProviderDescriptor`] or returns a [`SelectionRefused`].
///
/// Fails closed on missing bindings, ambiguous duplicate bindings, incompatible
/// contract versions, disallowed host kinds, and unsupported invocation modes.
pub fn select<'a>(
    input: SelectionInput<'_>,
    snapshot: &'a RegistrySnapshot,
) -> Result<&'a ProviderDescriptor, SelectionRefused> {
    let mut matching = Vec::new();
    for provider in snapshot.providers {
        if provider.operation_id == input.operation {
            matching.push(provider);
        }
    }

    if matching.is_empty() {
        return Err(SelectionRefused::MissingBinding {
            operation: input.operation,
        });
    }

    // Exact binding: if more than one provider matches, fail closed on ambiguous binding.
    if matching.len() > 1 {
        return Err(SelectionRefused::AmbiguousBinding {
            operation: input.operation,
            candidate_count: matching.len(),
        });
    }

    let provider = matching[0];

    // Check request contract version and outcome contract version (exact pair matching).
    if provider.request_contract.version != input.request_contract_version
        || provider.outcome_contract.version != input.outcome_contract_version
    {
        return Err(SelectionRefused::IncompatibleContract {
            operation: input.operation,
            requested_request_version: input.request_contract_version.to_string(),
            provider_request_version: provider.request_contract.version.to_string(),
            requested_outcome_version: input.outcome_contract_version.to_string(),
            provider_outcome_version: provider.outcome_contract.version.to_string(),
        });
    }

    // Check allowed host kind.
    let host_allowed = provider.allowed_hosts.contains(&input.host_kind);
    if !host_allowed {
        return Err(SelectionRefused::DisallowedHostKind {
            operation: input.operation,
            requested_host: input.host_kind.to_string(),
            allowed_hosts: provider
                .allowed_hosts
                .iter()
                .map(|&s| s.to_string())
                .collect(),
        });
    }

    // Check allowed invocation mode.
    let mode_allowed = provider.allowed_modes.contains(&input.invocation_mode);
    if !mode_allowed {
        return Err(SelectionRefused::WrongInvocationMode {
            operation: input.operation,
            requested_mode: input.invocation_mode.to_string(),
            allowed_modes: provider
                .allowed_modes
                .iter()
                .map(|&s| s.to_string())
                .collect(),
        });
    }

    Ok(provider)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::catalog::CATALOG;
    use crate::contracts::{ContractRef, ProviderLifecycle};
    use crate::registry::build_snapshot;
    use std::borrow::Cow;

    mod missing_binding {
        use super::*;

        #[test]
        fn missing_binding() {
            let snapshot = &crate::registry::SNAPSHOT_FOR_TESTS;
            let input = SelectionInput {
                operation: OperationId::parse("nonexistent.service.action").expect("valid id"),
                request_contract_version: "1.0.0",
                outcome_contract_version: "1.0.0",
                host_kind: "cli",
                invocation_mode: "sync",
                policy: RouterPolicy,
            };
            let result = select(input, snapshot);
            assert!(matches!(
                result,
                Err(SelectionRefused::MissingBinding { .. })
            ));
        }
    }

    mod duplicate_binding {
        use super::*;

        #[test]
        #[should_panic(expected = "duplicate binding")]
        fn duplicate_binding() {
            static DUPS: &[ProviderDescriptor] = &[
                ProviderDescriptor {
                    provider_id: Cow::Borrowed("dup1"),
                    operation_id: OperationId::from_static("test.fixture.echo"),
                    component_class: Cow::Borrowed("test"),
                    mechanism: Cow::Borrowed("builtin"),
                    lifecycle: ProviderLifecycle::Singleton,
                    request_contract: ContractRef::from_static(
                        "test.fixture.echo.request",
                        "1.0.0",
                    ),
                    outcome_contract: ContractRef::from_static(
                        "test.fixture.echo.outcome",
                        "1.0.0",
                    ),
                    allowed_hosts: &["cli"],
                    allowed_modes: &["sync"],
                    capabilities: &[],
                    replacement: None,
                    concurrency: None,
                    health: None,
                },
                ProviderDescriptor {
                    provider_id: Cow::Borrowed("dup2"),
                    operation_id: OperationId::from_static("test.fixture.echo"),
                    component_class: Cow::Borrowed("test"),
                    mechanism: Cow::Borrowed("builtin"),
                    lifecycle: ProviderLifecycle::Singleton,
                    request_contract: ContractRef::from_static(
                        "test.fixture.echo.request",
                        "1.0.0",
                    ),
                    outcome_contract: ContractRef::from_static(
                        "test.fixture.echo.outcome",
                        "1.0.0",
                    ),
                    allowed_hosts: &["cli"],
                    allowed_modes: &["sync"],
                    capabilities: &[],
                    replacement: None,
                    concurrency: None,
                    health: None,
                },
            ];
            let _ = build_snapshot(CATALOG, DUPS, "test-dup");
        }
    }

    mod ambiguous_binding {
        use super::*;

        /// `duplicate_binding` proves `build_snapshot` fails closed at linking
        /// time. This test proves the OTHER half of R4's non-panic contract:
        /// `select` itself, given a snapshot that already carries two
        /// providers bound to the same operation (constructed directly via
        /// struct literal, bypassing `build_snapshot`'s own linking check --
        /// the same pattern `shuffle_order_stability` uses below), returns
        /// `Err(SelectionRefused::AmbiguousBinding)` rather than panicking or
        /// picking one arbitrarily.
        static AMBIGUOUS: &[ProviderDescriptor] = &[
            ProviderDescriptor {
                provider_id: Cow::Borrowed("amb1"),
                operation_id: OperationId::from_static("test.fixture.echo"),
                component_class: Cow::Borrowed("test"),
                mechanism: Cow::Borrowed("builtin"),
                lifecycle: ProviderLifecycle::Singleton,
                request_contract: ContractRef::from_static("test.fixture.echo.request", "1.0.0"),
                outcome_contract: ContractRef::from_static("test.fixture.echo.outcome", "1.0.0"),
                allowed_hosts: &["cli"],
                allowed_modes: &["sync"],
                capabilities: &[],
                replacement: None,
                concurrency: None,
                health: None,
            },
            ProviderDescriptor {
                provider_id: Cow::Borrowed("amb2"),
                operation_id: OperationId::from_static("test.fixture.echo"),
                component_class: Cow::Borrowed("test"),
                mechanism: Cow::Borrowed("builtin"),
                lifecycle: ProviderLifecycle::Singleton,
                request_contract: ContractRef::from_static("test.fixture.echo.request", "1.0.0"),
                outcome_contract: ContractRef::from_static("test.fixture.echo.outcome", "1.0.0"),
                allowed_hosts: &["cli"],
                allowed_modes: &["sync"],
                capabilities: &[],
                replacement: None,
                concurrency: None,
                health: None,
            },
        ];

        #[test]
        fn ambiguous_binding() {
            let snapshot = RegistrySnapshot {
                catalog: CATALOG,
                providers: AMBIGUOUS,
                fingerprint: "ambiguous-test",
            };
            let input = SelectionInput {
                operation: OperationId::parse("test.fixture.echo").expect("valid id"),
                request_contract_version: "1.0.0",
                outcome_contract_version: "1.0.0",
                host_kind: "cli",
                invocation_mode: "sync",
                policy: RouterPolicy,
            };
            let result = select(input, &snapshot);
            assert!(matches!(
                result,
                Err(SelectionRefused::AmbiguousBinding {
                    candidate_count: 2,
                    ..
                })
            ));
        }
    }

    mod incompatible_contract {
        use super::*;

        #[test]
        fn incompatible_contract() {
            let snapshot = &crate::registry::SNAPSHOT_FOR_TESTS;
            // Requested request contract version 2.0.0 (provider supports 1.0.0)
            let input = SelectionInput {
                operation: OperationId::parse("test.fixture.echo").expect("valid id"),
                request_contract_version: "2.0.0",
                outcome_contract_version: "1.0.0",
                host_kind: "cli",
                invocation_mode: "sync",
                policy: RouterPolicy,
            };
            let result = select(input, snapshot);
            assert!(matches!(
                result,
                Err(SelectionRefused::IncompatibleContract { .. })
            ));

            let input2 = SelectionInput {
                operation: OperationId::parse("test.fixture.echo").expect("valid id"),
                request_contract_version: "1.0.0",
                outcome_contract_version: "2.0.0",
                host_kind: "cli",
                invocation_mode: "sync",
                policy: RouterPolicy,
            };
            let result2 = select(input2, snapshot);
            assert!(matches!(
                result2,
                Err(SelectionRefused::IncompatibleContract { .. })
            ));
        }
    }

    mod disallowed_host {
        use super::*;

        #[test]
        fn disallowed_host() {
            let snapshot = &crate::registry::SNAPSHOT_FOR_TESTS;
            let input = SelectionInput {
                operation: OperationId::parse("test.fixture.echo").expect("valid id"),
                request_contract_version: "1.0.0",
                outcome_contract_version: "1.0.0",
                host_kind: "disallowed-host-kind",
                invocation_mode: "sync",
                policy: RouterPolicy,
            };
            let result = select(input, snapshot);
            assert!(matches!(
                result,
                Err(SelectionRefused::DisallowedHostKind { .. })
            ));
        }
    }

    mod wrong_mode {
        use super::*;

        #[test]
        fn wrong_mode() {
            let snapshot = &crate::registry::SNAPSHOT_FOR_TESTS;
            let input = SelectionInput {
                operation: OperationId::parse("test.fixture.echo").expect("valid id"),
                request_contract_version: "1.0.0",
                outcome_contract_version: "1.0.0",
                host_kind: "cli",
                invocation_mode: "wrong-invocation-mode",
                policy: RouterPolicy,
            };
            let result = select(input, snapshot);
            assert!(matches!(
                result,
                Err(SelectionRefused::WrongInvocationMode { .. })
            ));
        }
    }

    mod exact_version_pair_selection {
        use super::*;

        #[test]
        fn exact_version_pair_selection() {
            let snapshot = &crate::registry::SNAPSHOT_FOR_TESTS;
            let input = SelectionInput {
                operation: OperationId::parse("test.fixture.echo").expect("valid id"),
                request_contract_version: "1.0.0",
                outcome_contract_version: "1.0.0",
                host_kind: "cli",
                invocation_mode: "sync",
                policy: RouterPolicy,
            };
            let result = select(input, snapshot);
            assert!(result.is_ok());
            let selected = result.unwrap();
            assert_eq!(selected.provider_id, "test.fixture.echo.builtin");
            assert_eq!(selected.request_contract.version, "1.0.0");
            assert_eq!(selected.outcome_contract.version, "1.0.0");
        }
    }

    mod shuffle_order_stability {
        use super::*;

        static ORDER_A: &[ProviderDescriptor] = &[
            ProviderDescriptor {
                provider_id: Cow::Borrowed("p0"),
                operation_id: OperationId::from_static("test.op.zero"),
                component_class: Cow::Borrowed("test"),
                mechanism: Cow::Borrowed("builtin"),
                lifecycle: ProviderLifecycle::Singleton,
                request_contract: ContractRef::from_static("req", "1.0.0"),
                outcome_contract: ContractRef::from_static("out", "1.0.0"),
                allowed_hosts: &["cli"],
                allowed_modes: &["sync"],
                capabilities: &[],
                replacement: None,
                concurrency: None,
                health: None,
            },
            ProviderDescriptor {
                provider_id: Cow::Borrowed("p1"),
                operation_id: OperationId::from_static("test.op.one"),
                component_class: Cow::Borrowed("test"),
                mechanism: Cow::Borrowed("builtin"),
                lifecycle: ProviderLifecycle::Singleton,
                request_contract: ContractRef::from_static("req", "1.0.0"),
                outcome_contract: ContractRef::from_static("out", "1.0.0"),
                allowed_hosts: &["cli"],
                allowed_modes: &["sync"],
                capabilities: &[],
                replacement: None,
                concurrency: None,
                health: None,
            },
            ProviderDescriptor {
                provider_id: Cow::Borrowed("p2"),
                operation_id: OperationId::from_static("test.op.two"),
                component_class: Cow::Borrowed("test"),
                mechanism: Cow::Borrowed("builtin"),
                lifecycle: ProviderLifecycle::Singleton,
                request_contract: ContractRef::from_static("req", "1.0.0"),
                outcome_contract: ContractRef::from_static("out", "1.0.0"),
                allowed_hosts: &["cli"],
                allowed_modes: &["sync"],
                capabilities: &[],
                replacement: None,
                concurrency: None,
                health: None,
            },
        ];

        static ORDER_B: &[ProviderDescriptor] = &[
            ProviderDescriptor {
                provider_id: Cow::Borrowed("p2"),
                operation_id: OperationId::from_static("test.op.two"),
                component_class: Cow::Borrowed("test"),
                mechanism: Cow::Borrowed("builtin"),
                lifecycle: ProviderLifecycle::Singleton,
                request_contract: ContractRef::from_static("req", "1.0.0"),
                outcome_contract: ContractRef::from_static("out", "1.0.0"),
                allowed_hosts: &["cli"],
                allowed_modes: &["sync"],
                capabilities: &[],
                replacement: None,
                concurrency: None,
                health: None,
            },
            ProviderDescriptor {
                provider_id: Cow::Borrowed("p0"),
                operation_id: OperationId::from_static("test.op.zero"),
                component_class: Cow::Borrowed("test"),
                mechanism: Cow::Borrowed("builtin"),
                lifecycle: ProviderLifecycle::Singleton,
                request_contract: ContractRef::from_static("req", "1.0.0"),
                outcome_contract: ContractRef::from_static("out", "1.0.0"),
                allowed_hosts: &["cli"],
                allowed_modes: &["sync"],
                capabilities: &[],
                replacement: None,
                concurrency: None,
                health: None,
            },
            ProviderDescriptor {
                provider_id: Cow::Borrowed("p1"),
                operation_id: OperationId::from_static("test.op.one"),
                component_class: Cow::Borrowed("test"),
                mechanism: Cow::Borrowed("builtin"),
                lifecycle: ProviderLifecycle::Singleton,
                request_contract: ContractRef::from_static("req", "1.0.0"),
                outcome_contract: ContractRef::from_static("out", "1.0.0"),
                allowed_hosts: &["cli"],
                allowed_modes: &["sync"],
                capabilities: &[],
                replacement: None,
                concurrency: None,
                health: None,
            },
        ];

        #[test]
        fn shuffle_order_stability() {
            let snap_a = RegistrySnapshot {
                catalog: CATALOG,
                providers: ORDER_A,
                fingerprint: "order-a",
            };
            let snap_b = RegistrySnapshot {
                catalog: CATALOG,
                providers: ORDER_B,
                fingerprint: "order-b",
            };

            for op_name in ["test.op.zero", "test.op.one", "test.op.two"] {
                let input_a = SelectionInput {
                    operation: OperationId::parse(op_name).unwrap(),
                    request_contract_version: "1.0.0",
                    outcome_contract_version: "1.0.0",
                    host_kind: "cli",
                    invocation_mode: "sync",
                    policy: RouterPolicy,
                };
                let input_b = SelectionInput {
                    operation: OperationId::parse(op_name).unwrap(),
                    request_contract_version: "1.0.0",
                    outcome_contract_version: "1.0.0",
                    host_kind: "cli",
                    invocation_mode: "sync",
                    policy: RouterPolicy,
                };

                let res_a = select(input_a, &snap_a).expect("select on snap_a");
                let res_b = select(input_b, &snap_b).expect("select on snap_b");
                assert_eq!(res_a.provider_id, res_b.provider_id);
            }
        }
    }
}
