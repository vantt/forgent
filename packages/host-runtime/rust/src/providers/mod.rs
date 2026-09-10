//! Providers module for `fgos-host-runtime`.
//!
//! Kernel §6: In-process and external operation providers.

pub mod builtin;

pub use builtin::{EchoAction, EchoProvider, ECHO_PROVIDER_DESCRIPTOR};
