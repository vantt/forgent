//! Agent Start Context: the one composer of the text every fgOS-started agent receives
//! (docs/platform/agent-start-context/spec.md).
//!
//! `compose(request, ports)` validates the start request, selects the rules whose `when:` matches the facts, places the
//! payloads unchanged, adds the contributors' blocks, applies the delivery's byte budget and hands one record to the
//! record sink. The crate does no I/O: rules, fact values, records and live context come through the four ports, which
//! the host wires.

mod ace;
mod agent_file;
mod compose;
mod head;
mod persona;
mod ports;
mod request;

pub use ace::{AceFacts, AceRules};
pub use agent_file::agent_file;
pub use compose::{compose, Block, DropReason, Dropped, StartContext, StartRecord};
pub use persona::{persona_section, PersonaFields, PersonaLookup};
pub use ports::{
    Contributor, ContributorError, ContributorRow, FactRegistry, Personas, Ports, RecordSink, Rule,
    RuleSet, ValueType,
};
pub use request::{Delivery, ItemKind, Payload, Refusal, RefusalCode, StartKind, StartRequest};

/// The Observe kind of the per-start record (`fgos.start.context`), embedded so an installed host can declare it.
pub const OBSERVE_KINDS: &str = include_str!("../observe-kinds.json");
