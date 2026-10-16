//! Containment port: an OS-neutral process domain per attempt that can be
//! proven empty. Contract: `packages/process/contracts/containment.port.v1.json`.
//! L0: knows nothing about attempts beyond the id that names a domain.

#[cfg(target_os = "linux")]
mod linux;
#[cfg(target_os = "macos")]
mod macos;
#[cfg(windows)]
mod windows;

/// Operations every containment driver provides.
pub trait Containment {}
