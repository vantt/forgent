//! Every adapter operation finishes while stdin is an open pipe nobody writes
//! to: an adapter that read stdin (a prompt) would hang past the time limit.
#![cfg(unix)]
use fgos_secrets::{FileSource, SecretSource};
use std::fs;
use std::os::unix::fs::PermissionsExt;
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

const PROBE_ENV: &str = "FGOS_SECRETS_STDIN_PROBE";

#[test]
fn probe_child() {
    let Ok(path) = std::env::var(PROBE_ENV) else {
        return;
    };
    let src = FileSource::new(&path);
    let _ = (
        src.check(),
        src.get("API_KEY"),
        src.has("API_KEY"),
        src.describe(),
    );
}

#[test]
fn file_adapter_never_reads_stdin() {
    let dir = std::env::temp_dir().join(format!("fgos-secrets-stdin-{}", std::process::id()));
    fs::create_dir_all(&dir).unwrap();
    let path = dir.join("secrets.env");
    for (mode, tag) in [(0o600, "healthy"), (0o644, "unhealthy")] {
        fs::write(&path, "API_KEY=fake-value-for-test\n").unwrap();
        fs::set_permissions(&path, fs::Permissions::from_mode(mode)).unwrap();
        let mut child = Command::new(std::env::current_exe().unwrap())
            .args(["--exact", "probe_child", "--test-threads=1"])
            .env(PROBE_ENV, &path)
            .stdin(Stdio::piped())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .unwrap();
        let start = Instant::now();
        let status = loop {
            if let Some(s) = child.try_wait().unwrap() {
                break s;
            }
            if start.elapsed() > Duration::from_secs(10) {
                let _ = child.kill();
                panic!("{tag} adapter did not finish with stdin held open");
            }
            std::thread::sleep(Duration::from_millis(20));
        };
        assert!(status.success(), "{tag}");
    }
    let _ = fs::remove_dir_all(&dir);
}
