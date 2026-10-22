//! The two operating-system calls the record needs that the standard
//! library does not offer. Nothing else in the crate uses `unsafe`.
#![allow(unsafe_code)]

/// The effective user id of this process.
pub(crate) fn current_uid() -> u32 {
    // SAFETY: geteuid takes no arguments, cannot fail and touches no memory.
    unsafe { libc::geteuid() }
}
