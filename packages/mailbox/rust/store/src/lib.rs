//! Mailbox: the parts of the agent mailbox that touch a CLI or the host
//! around the pure core `fgos-mailbox-core` (docs/platform/agent-mailbox/spec.md
//! §4.1): the hook kind and its per-CLI adapters (§6.1), and later the
//! record adapter, the ports wiring and the verbs.
//!
//! Stdout is the hook's frame channel and only the shell writes to it, so
//! nothing in this crate prints.
#![forbid(unsafe_code)]
#![deny(clippy::print_stdout, clippy::print_stderr)]

pub mod hook;
