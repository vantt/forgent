//! The two waits every supervisor and gate test uses, shared by `support` and `portable`.

use std::fs;
use std::path::Path;
use std::thread::sleep;
use std::time::{Duration, Instant};

/// The text of `path` once it holds something, polled every 10 ms; panics after `limit`.
pub fn wait_for(path: &Path, limit: Duration) -> String {
    let start = Instant::now();
    loop {
        if let Ok(text) = fs::read_to_string(path) {
            if !text.trim().is_empty() {
                return text;
            }
        }
        assert!(start.elapsed() < limit, "{} never written", path.display());
        sleep(Duration::from_millis(10));
    }
}

/// Polls `cond` every 10 ms until it holds; panics naming `what` after `limit`.
pub fn wait_until(limit: Duration, what: &str, mut cond: impl FnMut() -> bool) {
    let start = Instant::now();
    while !cond() {
        assert!(start.elapsed() < limit, "timed out waiting for {what}");
        sleep(Duration::from_millis(10));
    }
}
