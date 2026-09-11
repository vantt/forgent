//! Read-only inspection of `.fgos/main-checkout.lock`.
//!
//! Reuses the liveness rules from `src/runner/main-checkout-lock.mjs` per R5:
//! - Missing lock file: free.
//! - Unparseable or invalid record: ambiguous (lock-ambiguous).
//! - Numeric pid: alive via OS process-existence probe (kill 0, EPERM = alive).
//! - String identity: judged by ts freshness against DEFAULT_TTL_MS.
//!
//! Cites:
//! - DEFAULT_TTL_MS confirmed = 3 * 60 * 1000 ms at `src/runner/main-checkout-lock.mjs:110`.
//! - `isPidAlive` signal-0 probe at `src/runner/main-checkout-lock.mjs:157-164`.

use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

/// DEFAULT_TTL_MS confirmed = 3 * 60 * 1000 ms at `src/runner/main-checkout-lock.mjs:110`.
///
/// If `src/runner/main-checkout-lock.mjs` ever drifts from 180_000 ms, this constant
/// must be updated to match.
pub const DEFAULT_TTL_MS: u64 = 3 * 60 * 1000;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LockHolderIdentity {
    Numeric(i64),
    String(String),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LockRecord {
    pub identity: LockHolderIdentity,
    pub ts: u64,
}

#[derive(Debug, thiserror::Error)]
pub enum MainCheckoutLockError {
    #[error("lock-ambiguous: .fgos/main-checkout.lock has unparseable or ambiguous record")]
    Ambiguous,
    #[error("lock-held: .fgos/main-checkout.lock is held by process {0}")]
    HeldNumeric(i64),
    #[error("lock-held: .fgos/main-checkout.lock is held by session \"{0}\"")]
    HeldString(String),
    #[error("io error reading lock file: {0}")]
    Io(#[from] std::io::Error),
}

/// Signal-0 process-existence probe mirroring `isPidAlive` at `src/runner/main-checkout-lock.mjs:157`.
/// EPERM (errno 1) means the process exists under another user -- still alive.
#[cfg(unix)]
pub fn is_pid_alive(pid: i32) -> bool {
    extern "C" {
        fn kill(pid: i32, sig: i32) -> i32;
    }
    unsafe {
        if kill(pid, 0) == 0 {
            true
        } else {
            let err = std::io::Error::last_os_error();
            err.raw_os_error() == Some(1) || err.kind() == std::io::ErrorKind::PermissionDenied
        }
    }
}

#[cfg(not(unix))]
pub fn is_pid_alive(_pid: i32) -> bool {
    true
}

/// Parses lock file content written by `src/runner/main-checkout-lock.mjs`:
/// `{"pid": <identity>, "ts": <int>}`.
/// Returns None when content is not a well-formed record.
pub fn parse_lock_content(raw: &str) -> Option<LockRecord> {
    let parsed: serde_json::Value = serde_json::from_str(raw).ok()?;
    let obj = parsed.as_object()?;
    let pid_val = obj.get("pid")?;
    let ts_val = obj.get("ts")?;

    let identity = if let Some(n) = pid_val.as_i64() {
        if n > 0 {
            LockHolderIdentity::Numeric(n)
        } else {
            return None;
        }
    } else if let Some(s) = pid_val.as_str() {
        if !s.is_empty() {
            LockHolderIdentity::String(s.to_string())
        } else {
            return None;
        }
    } else {
        return None;
    };

    let ts = match ts_val.as_u64() {
        Some(t) if t > 0 => t,
        _ => return None,
    };

    Some(LockRecord { identity, ts })
}

/// Performs a read-only liveness check on `.fgos/main-checkout.lock` under `workspace_root`.
/// Never creates, refreshes, or clears the lock.
pub fn check_main_checkout_lock(workspace_root: &Path) -> Result<(), MainCheckoutLockError> {
    let lock_path = workspace_root.join(".fgos").join("main-checkout.lock");
    if !lock_path.exists() {
        return Ok(()); // free
    }

    let raw = std::fs::read_to_string(&lock_path)?;
    let record = match parse_lock_content(&raw) {
        Some(r) => r,
        None => return Err(MainCheckoutLockError::Ambiguous),
    };

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64;

    match record.identity {
        LockHolderIdentity::Numeric(pid) => {
            let lock_age = now.saturating_sub(record.ts);
            let within_ttl = lock_age <= DEFAULT_TTL_MS;
            let pid_i32 = i32::try_from(pid).ok();
            let pid_live = pid_i32.map(is_pid_alive).unwrap_or(false);
            if pid_live && within_ttl {
                Err(MainCheckoutLockError::HeldNumeric(pid))
            } else {
                // dead pid or ttl-expired is stale -> free
                Ok(())
            }
        }
        LockHolderIdentity::String(session_id) => {
            let lock_age = now.saturating_sub(record.ts);
            if lock_age <= DEFAULT_TTL_MS {
                Err(MainCheckoutLockError::HeldString(session_id))
            } else {
                // ttl expired is stale -> free
                Ok(())
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_ttl_matches_mjs_constant() {
        assert_eq!(DEFAULT_TTL_MS, 180_000);
    }

    #[test]
    fn test_parse_numeric_lock() {
        let raw = r#"{"pid": 12345, "ts": 1700000000000}"#;
        let record = parse_lock_content(raw).expect("must parse");
        assert_eq!(record.identity, LockHolderIdentity::Numeric(12345));
        assert_eq!(record.ts, 1700000000000);
    }

    #[test]
    fn test_parse_string_lock() {
        let raw = r#"{"pid": "session-xyz", "ts": 1700000000000}"#;
        let record = parse_lock_content(raw).expect("must parse");
        assert_eq!(
            record.identity,
            LockHolderIdentity::String("session-xyz".to_string())
        );
        assert_eq!(record.ts, 1700000000000);
    }

    #[test]
    fn test_parse_invalid_lock() {
        assert!(parse_lock_content("not json").is_none());
        assert!(parse_lock_content(r#"{"pid": -5, "ts": 100}"#).is_none());
        assert!(parse_lock_content(r#"{"pid": "", "ts": 100}"#).is_none());
        assert!(parse_lock_content(r#"{"pid": 123, "ts": 0}"#).is_none());
        assert!(parse_lock_content(r#"{"pid": 123}"#).is_none());
    }

    #[test]
    fn test_check_missing_lock_is_free() {
        let temp = std::env::temp_dir().join(format!("test_lock_missing_{}", std::process::id()));
        let _ = std::fs::create_dir_all(&temp);
        assert!(check_main_checkout_lock(&temp).is_ok());
        let _ = std::fs::remove_dir_all(&temp);
    }

    #[test]
    fn test_check_live_pid_expired_ttl_is_free() {
        let temp =
            std::env::temp_dir().join(format!("test_lock_live_expired_{}", std::process::id()));
        let fgos_dir = temp.join(".fgos");
        let _ = std::fs::create_dir_all(&fgos_dir);
        let lock_path = fgos_dir.join("main-checkout.lock");

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64;
        let expired_ts = now.saturating_sub(DEFAULT_TTL_MS + 5_000);

        let raw = format!(r#"{{"pid": {}, "ts": {}}}"#, std::process::id(), expired_ts);
        std::fs::write(&lock_path, raw).unwrap();

        assert!(check_main_checkout_lock(&temp).is_ok());
        let _ = std::fs::remove_dir_all(&temp);
    }
}
