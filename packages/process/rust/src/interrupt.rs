//! The interrupt door: a person's request that a process stop, caught and kept for one reader to take instead of
//! ending the process. On Unix it is SIGINT or SIGTERM; on Windows a Ctrl-C or Ctrl-Break reaches a console process
//! as a console control event, not a signal, and both read as an interrupt here.

use std::sync::atomic::{AtomicU8, Ordering};

/// What a person asked for.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Interrupt {
    /// SIGINT; a Ctrl-C or Ctrl-Break console event on Windows.
    Interrupt,
    /// SIGTERM.
    Terminate,
}

const NONE: u8 = 0;
const INTERRUPT: u8 = 1;
const TERMINATE: u8 = 2;

/// The interrupt caught and not taken yet.
static PENDING: AtomicU8 = AtomicU8::new(NONE);

/// Interrupts are caught while this is held; dropping it gives them their default action back.
#[derive(Debug)]
pub struct Caught(());

impl Drop for Caught {
    fn drop(&mut self) {
        platform::restore();
    }
}

/// Catch interrupts from now on: each one is kept for [`take`] and the process goes on.
pub fn catch() -> Caught {
    PENDING.store(NONE, Ordering::SeqCst);
    platform::install();
    Caught(())
}

/// The interrupt caught since the last call, if any.
pub fn take() -> Option<Interrupt> {
    match PENDING.swap(NONE, Ordering::SeqCst) {
        INTERRUPT => Some(Interrupt::Interrupt),
        TERMINATE => Some(Interrupt::Terminate),
        _ => None,
    }
}

#[cfg(unix)]
mod platform {
    use super::{Ordering, INTERRUPT, PENDING, TERMINATE};

    extern "C" fn on_signal(signal: libc::c_int) {
        let kind = if signal == libc::SIGINT {
            INTERRUPT
        } else {
            TERMINATE
        };
        PENDING.store(kind, Ordering::SeqCst);
    }

    pub(super) fn install() {
        for signal in [libc::SIGINT, libc::SIGTERM] {
            // SAFETY: the handler only stores into an atomic, which is async-signal-safe.
            unsafe {
                libc::signal(
                    signal,
                    on_signal as extern "C" fn(libc::c_int) as libc::sighandler_t,
                )
            };
        }
    }

    pub(super) fn restore() {
        for signal in [libc::SIGINT, libc::SIGTERM] {
            // SAFETY: putting back the default action.
            unsafe { libc::signal(signal, libc::SIG_DFL) };
        }
    }
}

#[cfg(windows)]
mod platform {
    use super::{Ordering, INTERRUPT, PENDING};
    use windows_sys::core::BOOL;
    use windows_sys::Win32::System::Console::{
        SetConsoleCtrlHandler, CTRL_BREAK_EVENT, CTRL_C_EVENT,
    };

    /// Runs on a thread the system starts for the event. Ctrl-C and Ctrl-Break are kept and handled; any other
    /// event (the console closing, logoff, shutdown) goes on to the default handler.
    unsafe extern "system" fn on_ctrl(kind: u32) -> BOOL {
        if kind == CTRL_C_EVENT || kind == CTRL_BREAK_EVENT {
            PENDING.store(INTERRUPT, Ordering::SeqCst);
            1
        } else {
            0
        }
    }

    pub(super) fn install() {
        // SAFETY: registers a handler that only stores into an atomic.
        unsafe { SetConsoleCtrlHandler(Some(on_ctrl), 1) };
    }

    pub(super) fn restore() {
        // SAFETY: removes the handler `install` added.
        unsafe { SetConsoleCtrlHandler(Some(on_ctrl), 0) };
    }
}
