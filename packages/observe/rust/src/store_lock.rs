//! Shared store lock for `.fgos/observe/.lock`.

use serde::{Deserialize, Serialize};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant, SystemTime};

pub const LOCK_TTL_SECS: u64 = 30;
pub const ACQUIRE_TIMEOUT: Duration = Duration::from_secs(5);
pub const POLL_INTERVAL: Duration = Duration::from_millis(50);

#[derive(Debug, thiserror::Error)]
pub enum ObserveLockError {
    #[error("observe-lock-timeout: timed out after 5s acquiring lock at {0}")]
    Timeout(PathBuf),
    #[error("io error acquiring lock at {path}: {source}")]
    Io {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },
    #[error("json error in store lock: {0}")]
    Json(#[from] serde_json::Error),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LockContent {
    pub pid: u32,
    #[serde(rename = "startTime")]
    pub start_time: Option<String>,
    pub ts: String,
}

pub struct StoreLockGuard {
    lock_path: PathBuf,
    active: bool,
}

impl StoreLockGuard {
    pub fn release(mut self) {
        if self.active {
            let _ = fs::remove_file(&self.lock_path);
            self.active = false;
        }
    }
}

impl Drop for StoreLockGuard {
    fn drop(&mut self) {
        if self.active {
            let _ = fs::remove_file(&self.lock_path);
            self.active = false;
        }
    }
}

pub fn format_iso_now() -> String {
    if let Ok(fixed) = std::env::var("FGOS_NOW") {
        let trimmed = fixed.trim();
        if !trimmed.is_empty() {
            return trimmed.to_string();
        }
    }
    fgos_host_runtime::civil_time::format_system_time_utc(SystemTime::now())
}

pub fn get_process_start_time(pid: u32) -> Option<String> {
    #[cfg(target_os = "linux")]
    {
        let stat_path = format!("/proc/{}/stat", pid);
        let stat = fs::read_to_string(stat_path).ok()?;
        let last_paren = stat.rfind(')')?;
        let rest = &stat[last_paren + 2..];
        let fields: Vec<&str> = rest.split_whitespace().collect();
        if fields.len() >= 20 {
            Some(fields[19].to_string())
        } else {
            None
        }
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = pid;
        None
    }
}

#[cfg(unix)]
extern "C" {
    fn kill(pid: i32, sig: i32) -> i32;
}

pub fn is_process_dead(pid: u32, expected_start_time: Option<&str>) -> bool {
    #[cfg(unix)]
    {
        let res = unsafe { kill(pid as i32, 0) };
        if res != 0 {
            let err = std::io::Error::last_os_error();
            if err.raw_os_error() == Some(3) {
                // ESRCH: No such process
                return true;
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        let proc_path = format!("/proc/{}", pid);
        if !Path::new(&proc_path).exists() {
            return true;
        }
        if let Some(expected) = expected_start_time {
            if let Some(current) = get_process_start_time(pid) {
                if current != expected {
                    return true; // Process ID was recycled
                }
            } else {
                return true;
            }
        }
    }

    false
}

pub fn is_lock_expired(lock_path: &Path) -> bool {
    if let Ok(meta) = fs::metadata(lock_path) {
        if let Ok(mtime) = meta.modified() {
            if let Ok(elapsed) = SystemTime::now().duration_since(mtime) {
                return elapsed >= Duration::from_secs(LOCK_TTL_SECS);
            }
        }
    }
    false
}

/// Acquires the exclusive store lock at `<root>/.fgos/observe/.lock`.
pub fn acquire_store_lock(root: &Path) -> Result<StoreLockGuard, ObserveLockError> {
    let lock_dir = root.join(".fgos").join("observe");
    fs::create_dir_all(&lock_dir).map_err(|e| ObserveLockError::Io {
        path: lock_dir.clone(),
        source: e,
    })?;
    let lock_path = lock_dir.join(".lock");

    let start = Instant::now();
    loop {
        match OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&lock_path)
        {
            Ok(mut file) => {
                let pid = std::process::id();
                let start_time = get_process_start_time(pid);
                let ts = format_iso_now();
                let content = LockContent { pid, start_time, ts };
                let json = serde_json::to_string(&content)?;
                file.write_all(json.as_bytes())
                    .map_err(|e| ObserveLockError::Io {
                        path: lock_path.clone(),
                        source: e,
                    })?;
                file.sync_all().map_err(|e| ObserveLockError::Io {
                    path: lock_path.clone(),
                    source: e,
                })?;
                return Ok(StoreLockGuard {
                    lock_path,
                    active: true,
                });
            }
            Err(err) if err.kind() == std::io::ErrorKind::AlreadyExists => {
                if let Ok(raw) = fs::read_to_string(&lock_path) {
                    if let Ok(content) = serde_json::from_str::<LockContent>(&raw) {
                        let dead = is_process_dead(content.pid, content.start_time.as_deref());
                        let expired = is_lock_expired(&lock_path);
                        if dead || expired {
                            let _ = fs::remove_file(&lock_path);
                            continue;
                        }
                    } else {
                        // Corrupt lock file: clear if expired
                        if is_lock_expired(&lock_path) {
                            let _ = fs::remove_file(&lock_path);
                            continue;
                        }
                    }
                }
                if start.elapsed() >= ACQUIRE_TIMEOUT {
                    return Err(ObserveLockError::Timeout(lock_path));
                }
                std::thread::sleep(POLL_INTERVAL);
            }
            Err(err) => {
                return Err(ObserveLockError::Io {
                    path: lock_path,
                    source: err,
                });
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_acquire_and_release_lock() {
        let tmp = std::env::temp_dir().join(format!("fgos-test-lock-{}", std::process::id()));
        let _ = fs::remove_dir_all(&tmp);
        fs::create_dir_all(&tmp).unwrap();

        let guard = acquire_store_lock(&tmp).expect("acquire lock");
        let lock_file = tmp.join(".fgos").join("observe").join(".lock");
        assert!(lock_file.exists());

        // Read content
        let raw = fs::read_to_string(&lock_file).unwrap();
        let content: LockContent = serde_json::from_str(&raw).unwrap();
        assert_eq!(content.pid, std::process::id());

        // Releasing removes lock
        guard.release();
        assert!(!lock_file.exists());
        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn test_reclaim_lock_after_dead_holder() {
        let tmp = std::env::temp_dir().join(format!("fgos-test-lock-dead-{}", std::process::id()));
        let _ = fs::remove_dir_all(&tmp);
        fs::create_dir_all(&tmp).unwrap();

        // Spawn a process that gets killed
        let mut child = std::process::Command::new("sleep")
            .arg("10")
            .spawn()
            .expect("spawn sleep");
        let dead_pid = child.id();
        let start_time = get_process_start_time(dead_pid);

        // Kill with SIGKILL
        let _ = child.kill();
        let _ = child.wait();

        // Write a lock file as if acquired by this now-dead process
        let lock_dir = tmp.join(".fgos").join("observe");
        fs::create_dir_all(&lock_dir).unwrap();
        let lock_file = lock_dir.join(".lock");
        let content = LockContent {
            pid: dead_pid,
            start_time,
            ts: format_iso_now(),
        };
        fs::write(&lock_file, serde_json::to_string(&content).unwrap()).unwrap();

        // acquire_store_lock should detect dead holder and reclaim immediately!
        let guard = acquire_store_lock(&tmp).expect("should reclaim lock from dead holder");
        guard.release();

        let _ = fs::remove_dir_all(&tmp);
    }
}
