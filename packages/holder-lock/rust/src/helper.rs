//! Helper roles: small processes the port starts by re-executing a binary as
//! `<exe> internal holder-lock-helper <role> ...` ([`crate::HelperExe`]).
//! `fgos` and `fgctl` both route that selector here, so a gate that must not
//! run anything from a candidate release re-executes itself.
//!
//! Internal: no CLI promise, the argv may change with the crate.

use std::ffi::OsString;
use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use std::time::Duration;

use crate::driver::{self, TryLock};
use crate::port::Mode;

/// Exit code of an unknown role or malformed arguments.
pub const EXIT_USAGE: i32 = 64;

/// The longest a `probe-holder` outlives a probe that died before killing it.
const PROBE_HOLDER_LIFETIME: Duration = Duration::from_secs(60);

/// Run the role named by `args[0]` with the rest of `args`; returns the
/// process exit code.
pub fn main(args: &[OsString]) -> i32 {
    match args.first().and_then(|role| role.to_str()) {
        Some("probe-holder") => probe_holder(&args[1..]),
        _ => {
            eprintln!("fgos internal holder-lock-helper: unknown role");
            EXIT_USAGE
        }
    }
}

/// `probe-holder --path P`: take the exclusive lock on `P` in this process,
/// write `R` to stdout, and hold until killed (or the lifetime bound).
fn probe_holder(args: &[OsString]) -> i32 {
    let Some(path) = path_arg(args) else {
        eprintln!("probe-holder: usage: probe-holder --path <file>");
        return EXIT_USAGE;
    };
    let file = match OpenOptions::new().read(true).write(true).create(true).truncate(false).open(&path) {
        Ok(file) => file,
        Err(err) => {
            eprintln!("probe-holder: open {}: {err}", path.display());
            return 1;
        }
    };
    match driver::current().try_lock(&file, Mode::Ex) {
        Ok(TryLock::Locked) => {}
        Ok(TryLock::WouldBlock) => {
            eprintln!("probe-holder: {} is already locked", path.display());
            return 1;
        }
        Err(err) => {
            eprintln!("probe-holder: lock {}: {err}", path.display());
            return 1;
        }
    }
    let mut stdout = std::io::stdout();
    if stdout.write_all(b"R\n").and_then(|()| stdout.flush()).is_err() {
        return 1;
    }
    std::thread::sleep(PROBE_HOLDER_LIFETIME);
    // The lock is released by the process ending, never by an unlock here.
    drop(file);
    0
}

fn path_arg(args: &[OsString]) -> Option<PathBuf> {
    match args {
        [flag, path] if flag == "--path" => Some(PathBuf::from(path)),
        _ => None,
    }
}
