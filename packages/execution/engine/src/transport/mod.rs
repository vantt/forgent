//! Transport base: adapters, provider adapters, visibility and terminal slots, worker sessions and homes, mechanism.
//!
//! The lower half of the dispatch transport. The round that composes these (`transport_round`) imports them and
//! adds nothing here. Executor facts (`family_of`, `lookup_executor`) come from `fgos-execution`; the trust of a
//! source home comes from the run supervisor's trust store; the lock that serialises a session boot comes from
//! `fgos-holder-lock`. What reaches the machine (a socket, a spawned server, a process sweep) sits behind a small
//! trait so each rule is proven without a herdr install.

pub mod adapters;
pub mod mechanism;
pub mod provider_adapter;
pub mod terminal_slot;
pub mod visibility_session;
pub mod worker_home;
pub mod worker_session;
pub mod worker_session_boot;

/// `JSON.stringify(value, null, 2)` followed by a newline: how every projection file of this module is written.
pub(crate) fn pretty_line(value: &serde_json::Value) -> String {
    let mut text = serde_json::to_string_pretty(value).unwrap_or_default();
    text.push('\n');
    text
}
