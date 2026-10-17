//! Route `fgos internal adopt` and `lock-scan`: one door for resume, recover, scan and home cleanup.

use crate::route::{refuse, report, ArgsError, EXIT_INTERNAL};

/// The route is registered with the host; the recovery matrix is not built yet.
pub fn run(args: &[String]) -> i32 {
    if !args.windows(2).any(|pair| pair[0] == "--protocol" && pair[1] == "1") {
        return refuse("adopt", ArgsError::VersionMismatch);
    }
    report("adopt", "internal", "adopt is not available in this build");
    EXIT_INTERNAL
}
