#![allow(dead_code)]
use fgos_checkout::{CreateRequest, Provision};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Mutex, MutexGuard, Once};

static NEXT: AtomicU64 = AtomicU64::new(0);
static HOME: Once = Once::new();
/// Every fixture holds this for its whole life: the process environment is changed once below, and no test thread
/// reads it while another is running.
static SERIAL: Mutex<()> = Mutex::new(());

pub fn git(path: &Path, args: &[&str]) -> String {
    let out = Command::new("git")
        .arg("-C")
        .arg(path)
        .args(args)
        .output()
        .unwrap();
    assert!(
        out.status.success(),
        "{args:?}: {}",
        String::from_utf8_lossy(&out.stderr)
    );
    String::from_utf8(out.stdout).unwrap().trim().into()
}

/// A real repository (`trunk`, one commit), a state root, and a home for the config reader.
pub struct Fixture {
    pub root: PathBuf,
    pub repo: PathBuf,
    pub state: PathBuf,
    _serial: MutexGuard<'static, ()>,
    home: PathBuf,
}

impl Fixture {
    pub fn new() -> Self {
        let serial = SERIAL.lock().unwrap_or_else(|e| e.into_inner());
        let root = std::env::temp_dir().join(format!(
            "fgos-checkout-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir(&root).unwrap();
        let root = fs::canonicalize(&root).unwrap();
        let home = std::env::temp_dir().join(format!("fgos-checkout-home-{}", std::process::id()));
        fs::create_dir_all(&home).unwrap();
        HOME.call_once(|| {
            std::env::set_var("HOME", &home);
            // A local file dependency installs without the network.
            std::env::set_var("npm_config_offline", "true");
            std::env::set_var("npm_config_audit", "false");
            std::env::set_var("npm_config_fund", "false");
        });
        let repo = root.join("repo");
        git(&root, &["init", "-q", "--initial-branch=trunk", "repo"]);
        git(&repo, &["config", "user.name", "Fixture"]);
        git(&repo, &["config", "user.email", "fixture@example.invalid"]);
        fs::write(repo.join(".gitignore"), ".fgos/\n.omp/\n").unwrap();
        fs::write(repo.join("README"), "one\n").unwrap();
        git(&repo, &["add", "."]);
        git(&repo, &["commit", "-qm", "fixture"]);
        // The activation fence the Git driver requires before any mutation.
        fs::create_dir_all(repo.join(".fgos/locks/activation.lock")).unwrap();
        fs::write(
            repo.join(".fgos/locks/activation.lock/TOMBSTONE"),
            r#"{"lock":"activation","by":"fgos git","at":"fixture"}"#,
        )
        .unwrap();
        Self {
            state: root.join("state"),
            root,
            repo,
            _serial: serial,
            home,
        }
    }

    pub fn setup_commands(&self, commands: &[&str]) {
        let lines: String = commands
            .iter()
            .map(|c| format!("    - {}\n", serde_json::to_string(c).unwrap()))
            .collect();
        fs::create_dir_all(self.repo.join(".fgos")).unwrap();
        fs::write(
            self.repo.join(".fgos/config.yaml"),
            format!("worktreeSetup:\n  commands:\n{lines}"),
        )
        .unwrap();
    }

    pub fn request(&self, name: &str, provision: Provision) -> CreateRequest {
        CreateRequest {
            cwd: self.repo.clone(),
            repo_root: self.repo.clone(),
            state_root: self.state.clone(),
            writer: "fixture".into(),
            path: self.root.join(name),
            branch: None,
            base: None,
            provision,
            disposable: false,
        }
    }

    pub fn remove_request(
        &self,
        path: &Path,
        discard_ignored: bool,
    ) -> fgos_checkout::RemoveRequest {
        fgos_checkout::RemoveRequest {
            cwd: self.repo.clone(),
            repo_root: self.repo.clone(),
            state_root: self.state.clone(),
            writer: "fixture".into(),
            path: path.into(),
            delivered_to: "trunk".into(),
            discard_ignored,
        }
    }

    pub fn registered(&self, path: &Path) -> bool {
        let want = path.to_string_lossy().into_owned();
        git(&self.repo, &["worktree", "list", "--porcelain"])
            .lines()
            .any(|l| l == format!("worktree {want}"))
    }
}

impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.root);
        let _ = fs::remove_dir_all(&self.home);
    }
}
