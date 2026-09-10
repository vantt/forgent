//! Two-stage authority gate for `fgos-host-runtime`.
//!
//! Kernel §7:
//! 1. Caller admission (before routing): principal, operation, project policy, requested context, host surface.
//! 2. Selected-provider grant (after routing): intersects the admitted action with the operation's capability policy
//!    and the selected provider's requested capabilities.
//!
//! Both gates are deny-by-default and enforce least-privilege only.

use crate::contracts::{
    HostInvocation, OperationCatalog, OperationDescriptor, OperationId, ProviderDescriptor,
};
use std::collections::HashSet;

/// Reason why caller admission was refused before routing.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum AdmissionRefused {
    #[error("caller admission denied: operation '{0}' not found in catalog")]
    OperationNotFound(OperationId),

    #[error(
        "caller admission denied: disallowed host kind '{host_kind}' for operation '{operation}'"
    )]
    DisallowedHostKind {
        operation: OperationId,
        host_kind: String,
    },

    #[error(
        "caller admission denied: policy '{policy}' not satisfied for operation '{operation}'"
    )]
    PolicyNotSatisfied {
        operation: OperationId,
        policy: String,
    },

    #[error("caller admission denied: unauthorized principal '{0}'")]
    UnauthorizedPrincipal(String),

    #[error("caller admission denied: {0}")]
    Denied(String),
}

/// Reason why selected provider grant was refused after routing.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum GrantRefused {
    #[error("selected provider capability denied: provider '{provider_id}' requested unpermitted capability '{capability}'")]
    CapabilityDenied {
        provider_id: String,
        capability: String,
    },

    #[error("selected provider capability denied: {0}")]
    Denied(String),
}

/// Admitted call returned by [`CallerAdmission::admit`] on success.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AdmittedCall {
    pub operation: OperationDescriptor,
    pub host_kind: String,
    pub principal: Option<String>,
    pub admitted_capabilities: HashSet<String>,
}

/// Caller admission gate (stage 2 of pipeline, runs before routing/select).
///
/// Validates caller principal, operation existence in catalog, host kind,
/// and authority policy. Deny by default.
#[derive(Debug, Clone, Default)]
pub struct CallerAdmission {
    allowed_principals: Option<HashSet<String>>,
    allowed_policies: Option<HashSet<String>>,
    admitted_capabilities: Option<HashSet<String>>,
    deny_all: bool,
}

impl CallerAdmission {
    /// Creates a caller admission gate that denies all callers.
    pub fn deny_all() -> Self {
        Self {
            allowed_principals: None,
            allowed_policies: None,
            admitted_capabilities: None,
            deny_all: true,
        }
    }

    /// Creates a caller admission gate configured with explicit allowed policies and capabilities.
    pub fn new(
        allowed_policies: impl IntoIterator<Item = impl Into<String>>,
        admitted_capabilities: impl IntoIterator<Item = impl Into<String>>,
    ) -> Self {
        Self {
            allowed_principals: None,
            allowed_policies: Some(allowed_policies.into_iter().map(Into::into).collect()),
            admitted_capabilities: Some(
                admitted_capabilities.into_iter().map(Into::into).collect(),
            ),
            deny_all: false,
        }
    }

    /// Sets explicit allowed principals.
    pub fn with_allowed_principals(
        mut self,
        principals: impl IntoIterator<Item = impl Into<String>>,
    ) -> Self {
        self.allowed_principals = Some(principals.into_iter().map(Into::into).collect());
        self
    }

    /// Sets explicit allowed policies.
    pub fn with_allowed_policies(
        mut self,
        policies: impl IntoIterator<Item = impl Into<String>>,
    ) -> Self {
        self.allowed_policies = Some(policies.into_iter().map(Into::into).collect());
        self
    }

    /// Sets admitted capabilities available for downstream provider grant.
    pub fn with_admitted_capabilities(
        mut self,
        capabilities: impl IntoIterator<Item = impl Into<String>>,
    ) -> Self {
        self.admitted_capabilities = Some(capabilities.into_iter().map(Into::into).collect());
        self
    }

    /// Evaluates caller admission against the invocation and the operation catalog.
    pub fn admit(
        &self,
        invocation: &HostInvocation,
        operation: &OperationId,
        catalog: OperationCatalog,
    ) -> Result<AdmittedCall, AdmissionRefused> {
        if self.deny_all {
            return Err(AdmissionRefused::Denied(
                "admission explicitly denied by policy".to_string(),
            ));
        }

        // 1. Operation must exist in catalog
        let op_desc = catalog
            .iter()
            .find(|op| &op.operation_id == operation)
            .ok_or_else(|| AdmissionRefused::OperationNotFound(operation.clone()))?;

        // 2. Host kind must be allowed by operation descriptor
        let host_allowed = op_desc
            .allowed_host_kinds
            .iter()
            .any(|&h| h == invocation.host_kind);
        if !host_allowed {
            return Err(AdmissionRefused::DisallowedHostKind {
                operation: operation.clone(),
                host_kind: invocation.host_kind.clone(),
            });
        }

        // 3. Principal check (if configured)
        if let Some(allowed_principals) = &self.allowed_principals {
            let caller_principal = invocation.invocation_id.as_deref().unwrap_or("anonymous");
            if !allowed_principals.contains(caller_principal) {
                return Err(AdmissionRefused::UnauthorizedPrincipal(
                    caller_principal.to_string(),
                ));
            }
        }

        // 4. Policy check (if configured)
        if let Some(allowed_policies) = &self.allowed_policies {
            if !allowed_policies.contains(op_desc.authority_policy_id.as_ref()) {
                return Err(AdmissionRefused::PolicyNotSatisfied {
                    operation: operation.clone(),
                    policy: op_desc.authority_policy_id.to_string(),
                });
            }
        }

        let admitted_caps = self.admitted_capabilities.clone().unwrap_or_default();

        Ok(AdmittedCall {
            operation: op_desc.clone(),
            host_kind: invocation.host_kind.clone(),
            principal: invocation.invocation_id.clone(),
            admitted_capabilities: admitted_caps,
        })
    }
}

/// Provider grant gate (stage 4 of pipeline, runs after routing/select).
///
/// Intersects admitted capabilities with provider requested capabilities.
/// Deny by default: any requested capability not in admitted set causes grant refusal.
#[derive(Debug, Clone, Default)]
pub struct ProviderGrant {
    deny_all: bool,
}

impl ProviderGrant {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn deny_all() -> Self {
        Self { deny_all: true }
    }

    /// Grants capabilities to the selected provider by intersecting its requested capabilities
    /// with the admitted capabilities.
    pub fn grant(
        &self,
        admitted: &AdmittedCall,
        provider: &ProviderDescriptor,
    ) -> Result<Vec<String>, GrantRefused> {
        if self.deny_all {
            return Err(GrantRefused::Denied(
                "provider grant explicitly denied by policy".to_string(),
            ));
        }

        let mut granted = Vec::new();

        // Check each requested capability
        for &cap in provider.capabilities {
            if admitted.admitted_capabilities.contains(cap)
                || admitted.admitted_capabilities.contains("*")
            {
                granted.push(cap.to_string());
            } else {
                return Err(GrantRefused::CapabilityDenied {
                    provider_id: provider.provider_id.to_string(),
                    capability: cap.to_string(),
                });
            }
        }

        Ok(granted)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::catalog::CATALOG;
    use crate::contracts::{ContractRef, ProviderLifecycle};
    use std::borrow::Cow;

    #[test]
    fn admission_refused_for_unknown_operation() {
        let gate = CallerAdmission::default();
        let invocation = HostInvocation::new("cli");
        let op = OperationId::parse("unknown.service.action").unwrap();
        let res = gate.admit(&invocation, &op, CATALOG);
        assert!(matches!(res, Err(AdmissionRefused::OperationNotFound(_))));
    }

    #[test]
    fn admission_refused_for_disallowed_host() {
        let gate = CallerAdmission::default();
        let invocation = HostInvocation::new("disallowed_host_kind");
        let op = OperationId::parse("distribution.build.show").unwrap();
        let res = gate.admit(&invocation, &op, CATALOG);
        assert!(matches!(
            res,
            Err(AdmissionRefused::DisallowedHostKind { .. })
        ));
    }

    #[test]
    fn admission_refused_for_unsatisfied_policy() {
        let gate =
            CallerAdmission::default().with_allowed_policies(vec!["other.policy".to_string()]);
        let invocation = HostInvocation::new("cli");
        let op = OperationId::parse("distribution.build.show").unwrap();
        let res = gate.admit(&invocation, &op, CATALOG);
        assert!(matches!(
            res,
            Err(AdmissionRefused::PolicyNotSatisfied { .. })
        ));
    }

    #[test]
    fn admission_succeeds_for_valid_call() {
        let gate = CallerAdmission::default();
        let invocation = HostInvocation::new("cli");
        let op = OperationId::parse("distribution.build.show").unwrap();
        let res = gate.admit(&invocation, &op, CATALOG);
        assert!(res.is_ok());
        let admitted = res.unwrap();
        assert_eq!(
            admitted.operation.operation_id.as_str(),
            "distribution.build.show"
        );
        assert_eq!(admitted.host_kind, "cli");
    }

    #[test]
    fn grant_succeeds_for_provider_with_no_capabilities() {
        let grant_gate = ProviderGrant::new();
        let admitted = AdmittedCall {
            operation: CATALOG[1].clone(),
            host_kind: "cli".to_string(),
            principal: None,
            admitted_capabilities: HashSet::new(),
        };
        let provider = ProviderDescriptor {
            provider_id: Cow::Borrowed("test.provider"),
            operation_id: OperationId::from_static("test.fixture.echo"),
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
        };

        let granted = grant_gate.grant(&admitted, &provider).unwrap();
        assert!(granted.is_empty());
    }

    #[test]
    fn grant_refused_when_capability_not_admitted() {
        let grant_gate = ProviderGrant::new();
        let admitted = AdmittedCall {
            operation: CATALOG[1].clone(),
            host_kind: "cli".to_string(),
            principal: None,
            admitted_capabilities: HashSet::new(), // no capabilities admitted
        };
        let provider = ProviderDescriptor {
            provider_id: Cow::Borrowed("test.provider"),
            operation_id: OperationId::from_static("test.fixture.echo"),
            component_class: Cow::Borrowed("test"),
            mechanism: Cow::Borrowed("builtin"),
            lifecycle: ProviderLifecycle::Singleton,
            request_contract: ContractRef::from_static("req", "1.0.0"),
            outcome_contract: ContractRef::from_static("out", "1.0.0"),
            allowed_hosts: &["cli"],
            allowed_modes: &["sync"],
            capabilities: &["network.connect"], // requested capability
            replacement: None,
            concurrency: None,
            health: None,
        };

        let res = grant_gate.grant(&admitted, &provider);
        assert!(matches!(res, Err(GrantRefused::CapabilityDenied { .. })));
    }

    #[test]
    fn grant_succeeds_and_intersects_when_capability_is_admitted() {
        let grant_gate = ProviderGrant::new();
        let mut caps = HashSet::new();
        caps.insert("network.connect".to_string());
        caps.insert("filesystem.read".to_string());
        let admitted = AdmittedCall {
            operation: CATALOG[1].clone(),
            host_kind: "cli".to_string(),
            principal: None,
            admitted_capabilities: caps,
        };
        let provider = ProviderDescriptor {
            provider_id: Cow::Borrowed("test.provider"),
            operation_id: OperationId::from_static("test.fixture.echo"),
            component_class: Cow::Borrowed("test"),
            mechanism: Cow::Borrowed("builtin"),
            lifecycle: ProviderLifecycle::Singleton,
            request_contract: ContractRef::from_static("req", "1.0.0"),
            outcome_contract: ContractRef::from_static("out", "1.0.0"),
            allowed_hosts: &["cli"],
            allowed_modes: &["sync"],
            capabilities: &["network.connect"],
            replacement: None,
            concurrency: None,
            health: None,
        };

        let granted = grant_gate.grant(&admitted, &provider).unwrap();
        assert_eq!(granted, vec!["network.connect".to_string()]);
    }
}
