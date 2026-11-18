//! Supervision: the portfolio reader, event queue, watcher, wake door, supervisor verbs, discussion
//! source and landing use case of the project supervisor. Each module is filled by its own phase.
#![forbid(unsafe_code)]

pub mod discussion_source;
pub mod land;
pub mod notify;
pub mod portfolio;
pub mod queue;
pub mod supervisor;
pub mod wake;
pub mod watcher;
