//! Source wiring modules for composition root.

pub mod doctor;
pub mod event_store_clone;
pub mod events;
pub mod gateway_control;
pub mod git_incidents;
pub mod identity_log;
pub mod init;
pub mod lock_fence;
pub mod lock_status;
#[cfg(unix)]
pub mod mailbox_body;
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
pub mod mailbox_ingest;
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
pub mod run_dirs;
pub mod seat_binding;
pub mod session;
pub mod uninstall;
pub mod wire_agents;

/// The process environment as the list the packaging readers take. A variable whose name or value is not UTF-8 is
/// left out.
pub(crate) fn process_env() -> Vec<(String, String)> {
    std::env::vars_os()
        .filter_map(|(key, value)| Some((key.into_string().ok()?, value.into_string().ok()?)))
        .collect()
}
