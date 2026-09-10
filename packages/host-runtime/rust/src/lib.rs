//! `fgos-host-runtime` crate.
//!
//! Kernel types, pure router, authority gate, and invocation pipeline.

pub mod authority_gate;
pub mod catalog;
pub mod contracts;
pub mod invocation_service;
pub mod operation_provider_router;
pub mod providers;
pub mod registry;

pub use authority_gate::{AdmissionRefused, CallerAdmission, GrantRefused, ProviderGrant};
pub use catalog::CATALOG;
pub use contracts::*;
pub use invocation_service::{
    EventSink, InMemoryEventSink, InvocationControl, InvocationLifecycleRecord, InvocationService,
    InvocationTerminalState, NoopEventSink, OperationProvider,
};
pub use operation_provider_router::{select, RouterPolicy, SelectionInput, SelectionRefused};
pub use providers::builtin::{EchoAction, EchoProvider, ECHO_PROVIDER_DESCRIPTOR};
pub use registry::build_snapshot;
