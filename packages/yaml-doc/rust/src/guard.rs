//! Panic guard for every public entry point. A panic inside the parser or this crate becomes a
//! named refusal (`yaml-internal-error`) instead of unwinding into the caller: in a synchronous
//! N-API call a panic aborts the Node process (spec section 10). A stack overflow cannot be caught,
//! which is why the pre-scan bounds depth before the parser runs.

//!
//! A caught panic prints nothing from inside a guarded call. The default panic hook writes the
//! panic message to stderr, and the message of a failed string slice or `expect` can quote the
//! input text; a config value or a comment must never reach a log through a crash message. The
//! first guard installs one process-wide hook that stays silent while the panicking thread is
//! inside a guard and hands every other panic to the hook that was there before, so a panic of the
//! host program elsewhere is reported as before. The hook is installed once and never replaced.
//! A panic that is caught still becomes a refusal with fixed text, which is all the caller sees.

use std::cell::Cell;
use std::panic::{catch_unwind, set_hook, take_hook, AssertUnwindSafe};
use std::sync::Once;

use crate::model::{rule, Refusal};

thread_local! {
    /// Guards the current thread is inside (nested guards count).
    static DEPTH: Cell<u32> = const { Cell::new(0) };
}

static HOOK: Once = Once::new();

fn silence_inside_guards() {
    HOOK.call_once(|| {
        let previous = take_hook();
        set_hook(Box::new(move |info| {
            if DEPTH.with(Cell::get) == 0 {
                previous(info);
            }
        }));
    });
}

/// Restores the depth when the guarded closure ends, by return or by unwinding.
struct Entered;

impl Entered {
    fn new() -> Entered {
        DEPTH.with(|depth| depth.set(depth.get() + 1));
        Entered
    }
}

impl Drop for Entered {
    fn drop(&mut self) {
        DEPTH.with(|depth| depth.set(depth.get().saturating_sub(1)));
    }
}

/// Runs `f`; a panic inside it comes back as `yaml-internal-error`, silently.
pub fn guard<T>(f: impl FnOnce() -> Result<T, Refusal>) -> Result<T, Refusal> {
    silence_inside_guards();
    let _entered = Entered::new();
    catch_unwind(AssertUnwindSafe(f)).unwrap_or_else(|_| {
        Err(Refusal::new(rule::YAML_INTERNAL_ERROR)
            .with_detail("a panic was caught at the public boundary"))
    })
}
