//! Mailbox: the parts of the agent mailbox that touch a CLI or the host
//! around the pure core `fgos-mailbox-core` (docs/platform/agent-mailbox/spec.md
//! §4.1): the hook kind and its per-CLI adapters (§6.1), the record
//! adapter (§6.4, module `record`), the hook shell (`hook::shell`), the
//! ancestry reader, head finders and caller check (`ancestry`, `head`,
//! `adapters::{claude_head, codex_head}`, `hook::resolve`), the limits
//! loader (`limits`), and the verbs (`verbs`). The store reads the process
//! table only through process facts: its own ancestry, and the liveness of
//! a stored head.
//! Only `record::sys` may use `unsafe`, for the system calls the standard
//! library lacks.
//!
//! Stdout is the hook's frame channel and only the shell writes to it, so
//! nothing in this crate prints.
#![deny(unsafe_code)]
#![deny(clippy::print_stdout, clippy::print_stderr)]

pub mod adapters;
#[cfg(unix)]
pub mod ancestry;
pub mod head;
pub mod hook;
#[cfg(unix)]
pub mod limits;
#[cfg(unix)]
pub mod record;
#[cfg(unix)]
pub mod verbs;
