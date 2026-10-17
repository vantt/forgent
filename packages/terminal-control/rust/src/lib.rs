//! Terminal-control: allocate, launch into, read from and release terminal
//! panes by key, behind a driver that declares its capabilities.
//!
//! The upper port (by key) lives in `port`; the allocation record and its
//! markers in `record`, persisted by `store`; the core rules in `core`;
//! process-root identification in `identity`; multiplexer drivers in
//! `driver`; pluggable placement in `policy`. Contracts:
//! `packages/terminal-control/contracts/`.

pub mod core;
pub mod driver;
pub mod identity;
pub mod policy;
pub mod port;
pub mod record;
pub mod store;
