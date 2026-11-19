//! The machine around a unit run: the host side of the ports engine `unit_run`, the assignment runner and the
//! post-receipt steps ask for. Each adapter is the Rust door of the Node function it replaces (named in its doc
//! comment with the Node file and line), composed from the crates and doors that own the fact: the Git door, the
//! config door, the run supervisor's ledgers and adopt door, the accounts module, the seat-binding derivation and
//! the terminal control. Nothing here decides a rule of its own.
//!
//! * [`machine`]: where a run is and what the machine says (Git roots, `.fgos`, herdr, writer, the bundled
//!   catalog, the committed runner config, the attempt sweep).
//! * [`records`]: the unit source and the records of a unit run directory (unit control, the admission ledger, the
//!   adopt probe, the derived unit summary).
//! * [`accounts`]: pinned accounts, account rotation, the lease receipt audit and the bind over the live lease
//!   state.
//! * [`settlement`]: what the post-receipt steps read through the host (the terminal pane, the renewed login's
//!   write-back with the bundled SQLite engine and the accounts module's locks).

// Nothing routes to the host until `fgos run` and the `run-unit` internal op are served from engine `unit_run`;
// until then only the owning tests below call these adapters.
#![cfg_attr(not(test), allow(dead_code))]
// The ports answer with the `run-unit` error document the caller rethrows (engine `unit_run` carries the same allow):
// boxing it would only move the same fields behind a pointer at each call.
#![allow(clippy::result_large_err)]

pub mod accounts;
pub mod machine;
pub mod records;
pub mod settlement;

#[cfg(test)]
mod tests;
