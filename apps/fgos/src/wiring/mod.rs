//! Source wiring modules for composition root.

#[cfg(unix)]
pub mod mailbox_config;
#[cfg(unix)]
pub mod mailbox_hook;
#[cfg(not(unix))]
#[path = "mailbox_hook_unsupported.rs"]
pub mod mailbox_hook;
#[cfg(unix)]
pub mod mailbox_identity;
#[cfg(unix)]
pub mod mailbox_remote;
#[cfg(unix)]
pub mod mailbox_root;
pub mod mailbox_surface;
#[cfg(unix)]
pub mod mailbox_sync;
#[cfg(not(unix))]
#[path = "mailbox_sync_unsupported.rs"]
pub mod mailbox_sync;
#[cfg(unix)]
pub mod mailbox_verbs;
#[cfg(not(unix))]
#[path = "mailbox_verbs_unsupported.rs"]
pub mod mailbox_verbs;
pub mod metrics_sources;
pub mod event_store_clone;
pub mod identity_log;
