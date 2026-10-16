//! Terminal-control: allocate, launch into, read from and release terminal
//! panes by key, behind a driver that declares its capabilities.
//!
//! The upper port (by key) lives in `port`; the allocation record and its
//! markers in `record`; the core rules in `core`; multiplexer drivers in
//! `driver`; pluggable placement in `policy`. Contracts:
//! `packages/terminal-control/contracts/`.

/// The key-addressed upper port and its result types.
pub mod port {}

/// The allocation record, its one-shot markers and the group hint.
pub mod record {}

/// Core rules: grouping, anchoring, closing only what was allocated.
pub mod core {}

/// Multiplexer drivers behind the lower port.
pub mod driver {}

/// Pluggable placement policies over measured geometry.
pub mod policy {}
