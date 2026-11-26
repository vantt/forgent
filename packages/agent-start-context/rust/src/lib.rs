//! Agent Start Context: the one composer of the text every fgOS-started agent receives
//! (docs/platform/agent-start-context/spec.md).
//!
//! `compose(request, ports)` validates the start request, selects the rules whose `when:` matches the facts, places the
//! payloads unchanged, adds the contributors' blocks, applies the delivery's byte budget and hands one record to the
//! record sink. The crate does no I/O: rules, fact values, records and live context come through the four ports, which
//! the host wires.

mod compose;
mod ports;
mod request;

pub use compose::{compose, Block, DropReason, Dropped, StartContext, StartRecord};
pub use ports::{
    Contributor, ContributorError, ContributorRow, FactRegistry, Ports, RecordSink, Rule, RuleSet,
    ValueType,
};
pub use request::{Delivery, ItemKind, Payload, Refusal, RefusalCode, StartKind, StartRequest};
