//! Shared by the runners that lay machine files out on a real disk and hold a real lock from a
//! child process: `machine_files.rs` and `relocate.rs` include this file by path.
#![allow(dead_code)]
use std::fs;
use std::os::unix::fs::{symlink, PermissionsExt};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::time::{Duration, Instant};

use fgos_config::snapshot::{SnapshotError, SnapshotRequest};
use fgos_holder_lock::{acquire, Acquire, Mode, Resource, Wait};
use serde_json::Value;

const ROLE: &str = "MACHINE_TEST_LOCK";
const READY: &str = "MACHINE_TEST_READY";

/// The body of the child test `child_entry`: take the `global-config` lock named by the
/// environment, say so, keep it until killed. Does nothing without the environment.
pub fn child_body() {
    let Ok(path) = std::env::var(ROLE) else {
        return;
    };
    let resource = Resource::new("global-config", PathBuf::from(path));
    let Acquire::Acquired(held) = acquire(&resource, Mode::Ex, Wait::Ms(20_000), 2000) else {
        panic!("child could not take the lock");
    };
    fs::write(std::env::var(READY).unwrap(), "held").unwrap();
    let _keep = held;
    loop {
        std::thread::sleep(Duration::from_secs(3600));
    }
}

/// A child killed and reaped when dropped.
pub struct Holder(Child);
impl Drop for Holder {
    fn drop(&mut self) {
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}

/// Starts a child of this test binary that holds `global-config` under `dir/locks`.
pub fn hold(dir: &Path) -> Holder {
    let (ready, lock) = (dir.join("ready"), dir.join("locks/global-config.lock"));
    fs::create_dir_all(lock.parent().unwrap()).unwrap();
    let args = [
        "--exact",
        "child_entry",
        "--nocapture",
        "--test-threads",
        "1",
    ];
    let child = Command::new(std::env::current_exe().unwrap())
        .args(args)
        .env(ROLE, &lock)
        .env(READY, &ready)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .spawn()
        .unwrap();
    let holder = Holder(child);
    let deadline = Instant::now() + Duration::from_secs(30);
    while !ready.exists() {
        assert!(Instant::now() < deadline, "the holder never took the lock");
        std::thread::sleep(Duration::from_millis(5));
    }
    holder
}

pub fn octal(text: &str) -> u32 {
    u32::from_str_radix(text, 8).unwrap()
}

pub fn mode_of(path: &Path) -> String {
    format!(
        "{:o}",
        fs::metadata(path).unwrap().permissions().mode() & 0o777
    )
}

/// Lays a case out: `files` (lines), then `raw` (exact bytes; `@PAD@` is `pad` letters), `dirs`,
/// `links` (path to the relative target it links to) and `modes` (path to octal).
pub fn lay(dir: &Path, input: &Value) -> SnapshotRequest {
    let req = super::common::lay_out(dir, input);
    fs::create_dir_all(dir.join("home")).unwrap();
    fs::create_dir_all(dir.join("project")).unwrap();
    let pad = "a".repeat(input["pad"].as_u64().unwrap_or(0) as usize);
    for (rel, text) in input["raw"].as_object().into_iter().flatten() {
        let path = dir.join(rel);
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(path, text.as_str().unwrap().replace("@PAD@", &pad)).unwrap();
    }
    for rel in input["dirs"].as_array().into_iter().flatten() {
        fs::create_dir_all(dir.join(rel.as_str().unwrap())).unwrap();
    }
    for (rel, target) in input["links"].as_object().into_iter().flatten() {
        let path = dir.join(rel);
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        symlink(dir.join(target.as_str().unwrap()), path).unwrap();
    }
    for (rel, mode) in input["modes"].as_object().into_iter().flatten() {
        let perms = fs::Permissions::from_mode(octal(mode.as_str().unwrap()));
        fs::set_permissions(dir.join(rel), perms).unwrap();
    }
    req
}

/// What a person could read of a refusal: its text and both debug forms.
pub fn shown(error: &SnapshotError) -> String {
    match error {
        SnapshotError::Refused(all) => all.iter().map(|r| format!("{r} {r:?} {r:#?}")).collect(),
        SnapshotError::Io(error) => format!("{error} {error:?}"),
    }
}

/// A refusal is the one `want` names (`code`, and `path`, `file`, `reason` when it gives them) and
/// shows no sentinel; without a `code` in `want` the result must be a success.
pub fn check_refusal(id: &str, sentinels: &Value, want: &Value, got: Result<(), SnapshotError>) {
    let Err(error) = got else {
        assert!(want["code"].is_null(), "{id}: expected a refusal");
        return;
    };
    let text = shown(&error);
    for sentinel in sentinels.as_array().into_iter().flatten() {
        let sentinel = sentinel.as_str().unwrap();
        assert!(!text.contains(sentinel), "{id}: a value leaked: {text}");
    }
    let SnapshotError::Refused(all) = &error else {
        panic!("{id}: {error:?}");
    };
    let detail = all[0].detail.clone().unwrap_or_default();
    assert_eq!(Some(all[0].code), want["code"].as_str(), "{id}: {text}");
    for (key, have) in [
        ("path", all[0].path.clone()),
        ("file", all[0].file.clone()),
        ("reason", detail.keyword.clone()),
    ] {
        if let Some(want) = want[key].as_str() {
            assert_eq!(have.as_deref(), Some(want), "{id}: {text}");
        }
    }
}
