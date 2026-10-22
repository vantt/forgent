//! A fake herdr with one real pane (`fixtures/fake-herdr-pane.py`), the terminal-control state a real
//! allocation leaves, and the knobs a test turns while a supervisor runs.
#![allow(dead_code)]

use std::fs;
use std::os::unix::fs::PermissionsExt;
use std::os::unix::net::UnixListener;
use std::path::{Path, PathBuf};
use std::time::Duration;

use fgos_terminal_control::core::{Core, CoreConfig};
use fgos_terminal_control::driver::herdr::{HerdrConfig, HerdrDriver};
use fgos_terminal_control::policy::{policy_by_name, Limits};
use fgos_terminal_control::port::{AllocateRequest, Display};
use serde_json::{json, Value};

pub struct FakeHerdr {
    pub dir: PathBuf,
    /// A directory only this user can use, for the GO socket.
    pub socket_dir: PathBuf,
    pub state_root: PathBuf,
    /// The listening end of the fake server's socket: this process is the server incarnation.
    listener: Option<UnixListener>,
    pub herdr_sock: PathBuf,
}

fn private_dir(path: &Path) {
    let _ = fs::remove_dir_all(path);
    fs::create_dir_all(path).unwrap();
    fs::set_permissions(path, fs::Permissions::from_mode(0o700)).unwrap();
}

impl FakeHerdr {
    pub fn new(name: &str) -> FakeHerdr {
        let base = std::env::temp_dir().join(format!("fgos-fh-{}-{name}", std::process::id()));
        private_dir(&base);
        let dir = base.join("herdr");
        let socket_dir = PathBuf::from(format!("/tmp/fgos-fs-{}-{name}", std::process::id()));
        private_dir(&socket_dir);
        fs::create_dir_all(&dir).unwrap();
        let state_root = base.join("state");
        fs::create_dir_all(&state_root).unwrap();
        let herdr_sock = socket_dir.join("herdr.sock");
        let listener = UnixListener::bind(&herdr_sock).unwrap();
        let fake = FakeHerdr { dir, socket_dir, state_root, listener: Some(listener), herdr_sock };
        fake.set_explain(Verdict::Idle);
        fake
    }

    pub fn bin() -> String {
        format!("{}/tests/fixtures/fake-herdr-pane.py", env!("CARGO_MANIFEST_DIR"))
    }

    /// Where the gate reaches the supervisor.
    pub fn go_socket(&self) -> PathBuf {
        self.socket_dir.join("go.sock")
    }

    /// The environment a supervisor (or adopt) needs to reach this fake.
    pub fn env(&self) -> Vec<(String, String)> {
        let path = std::env::var("PATH").unwrap_or_else(|_| "/usr/local/bin:/usr/bin:/bin".into());
        vec![
            ("FGOS_HERDR_BIN".into(), Self::bin()),
            ("FAKE_HERDR_DIR".into(), self.dir.to_string_lossy().into_owned()),
            ("HERDR_SOCKET_PATH".into(), self.herdr_sock.to_string_lossy().into_owned()),
            ("FGOS_STATE_ROOT".into(), self.state_root.to_string_lossy().into_owned()),
            ("PATH".into(), path),
        ]
    }

    /// The server goes away: nothing listens on its socket any more.
    pub fn stop_server(&mut self) {
        self.listener = None;
        let _ = fs::remove_file(&self.herdr_sock);
    }

    /// A core over this fake, as the controller's own `allocate` goes through.
    pub fn with_core<T>(&self, f: impl FnOnce(&Core) -> T) -> T {
        let mut herdr = HerdrConfig::new(Self::bin());
        herdr.socket_path = Some(self.herdr_sock.to_string_lossy().into_owned());
        herdr.env.push(("FAKE_HERDR_DIR".into(), self.dir.to_string_lossy().into_owned()));
        let driver = HerdrDriver::new(herdr);
        let policy = policy_by_name(None).unwrap();
        let config = CoreConfig { state_root: self.state_root.clone(), limits: Limits { min_cols: 1, min_rows: 1, max_panes_per_tab: 8 }, allocation_grace_ms: 60_000, launch_identify_timeout_ms: 5_000, shell_ready_timeout_ms: 10_000 };
        let core = Core::new(&driver, policy.as_ref(), config);
        f(&core)
    }

    /// The controller's half: a slot for `key` before the supervisor starts.
    pub fn allocate(&self, key: &str) {
        self.with_core(|core| {
            let request = AllocateRequest { key: key.into(), group_key: "g".into(), display: Display { label: key.into(), ..Default::default() }, role_hint: None, cwd: None, env: Default::default() };
            core.allocate(&request).expect("allocate");
        });
    }

    pub fn calls(&self) -> Vec<String> {
        fs::read_to_string(self.dir.join("calls.log")).unwrap_or_default().lines().map(|l| l.trim_end_matches('\t').replace('\t', " ")).collect()
    }

    pub fn calls_starting(&self, prefix: &str) -> Vec<String> {
        self.calls().into_iter().filter(|c| c.starts_with(prefix)).collect()
    }

    pub fn sent(&self) -> Vec<Value> {
        fs::read_to_string(self.dir.join("sent.jsonl")).unwrap_or_default().lines().filter_map(|l| serde_json::from_str(l).ok()).collect()
    }

    pub fn set_explain(&self, verdict: Verdict) {
        let body = match verdict {
            Verdict::Idle => json!({"agent": "claude", "state": "idle", "visible_idle": true, "visible_working": false, "visible_blocker": false,
                "matched_rule": {"id": "live_prompt_box", "priority": 950, "region": "prompt_box_body", "state": "idle"},
                "evaluated_rules": [{"id": "live_prompt_box", "matched": true, "evidence": {"region_preview": ""}}]}),
            Verdict::Working => json!({"agent": "claude", "state": "working", "visible_idle": false, "visible_working": true, "visible_blocker": false}),
            Verdict::Blocked => json!({"agent": "claude", "state": "blocked", "visible_idle": false, "visible_working": false, "visible_blocker": true}),
        };
        fs::write(self.dir.join("explain.json"), body.to_string()).unwrap();
    }

    pub fn set_flag(&self, name: &str, on: bool) {
        let path = self.dir.join(name);
        if on {
            fs::write(path, "").unwrap();
        } else {
            let _ = fs::remove_file(path);
        }
    }

    /// Wait until the pane was typed at `count` times in total (text, keys or prompt).
    pub fn wait_sent(&self, count: usize, limit: Duration) {
        super::supervisor::wait_until(limit, &format!("{count} things typed at the pane"), || self.sent().len() >= count);
    }

    pub fn wait_call(&self, prefix: &str, limit: Duration) {
        super::supervisor::wait_until(limit, &format!("a herdr call starting `{prefix}`"), || !self.calls_starting(prefix).is_empty());
    }
}

pub enum Verdict {
    Idle,
    Working,
    Blocked,
}

impl Drop for FakeHerdr {
    fn drop(&mut self) {
        // Whatever the pane still runs goes with it.
        if let Ok(pid) = fs::read_to_string(self.dir.join("script.pid")) {
            if let Ok(pid) = pid.trim().parse::<i32>() {
                // SAFETY: SIGKILL to the pane's own session leader; a pid that is gone is harmless.
                unsafe { libc::kill(pid, libc::SIGKILL) };
            }
        }
        let _ = fs::remove_dir_all(&self.socket_dir);
    }
}
