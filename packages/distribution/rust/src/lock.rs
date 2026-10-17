//! Read-only inspection of the main checkout lock.
//!
//! The kernel lock `<workspace>/.fgos/locks/main-checkout.lock` is probed (shared, never held):
//! a live holder means held, anything else means free. The kernel releases a lock when its holder
//! dies, so there is no record to read, no ttl and no stale or ambiguous state. The old
//! `.fgos/main-checkout.lock` file is never read; a release from before the kernel lock meets the
//! tombstone fence there instead.

use std::path::Path;

#[derive(Debug, thiserror::Error)]
pub enum MainCheckoutLockError {
    #[error("lock-held: main checkout is held (kernel lock)")]
    Held,
    #[error("lock-driver-unavailable: main-checkout: {0}")]
    DriverUnavailable(String),
    #[error("io error probing main checkout lock: {0}")]
    Io(#[from] std::io::Error),
}

/// Probes the main checkout kernel lock under `workspace_root`.
/// Never creates, refreshes, or clears the lock.
pub fn check_main_checkout_lock(workspace_root: &Path) -> Result<(), MainCheckoutLockError> {
    let resource = fgos_holder_lock::Resource::new(
        "main-checkout",
        workspace_root.join(".fgos").join("locks").join("main-checkout.lock"),
    );
    let probed = fgos_holder_lock::probe(&resource).map_err(|e| match e.kind() {
        std::io::ErrorKind::Unsupported => MainCheckoutLockError::DriverUnavailable(e.to_string()),
        _ => MainCheckoutLockError::Io(e),
    })?;
    match probed {
        fgos_holder_lock::Probe::Held => Err(MainCheckoutLockError::Held),
        _ => Ok(()),
    }
}
