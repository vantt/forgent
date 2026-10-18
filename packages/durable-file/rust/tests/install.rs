use fgos_durable_file::{install_once, Installed};
use std::{
    fs,
    path::PathBuf,
    sync::atomic::{AtomicU64, Ordering},
};
static NEXT: AtomicU64 = AtomicU64::new(0);
struct Dir(PathBuf);
impl Dir {
    fn new() -> Self {
        let path = std::env::temp_dir().join(format!(
            "fgos-durable-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir(&path).unwrap();
        Self(path)
    }
}
impl Drop for Dir {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

#[test]
fn installs_complete_bytes_and_preserves_first_record() {
    let dir = Dir::new();
    let bytes = vec![42; 1024 * 1024];
    assert_eq!(
        install_once(&dir.0, "record", &bytes).unwrap(),
        Installed::Created
    );
    assert_eq!(
        install_once(&dir.0, "record", b"replacement").unwrap(),
        Installed::AlreadyExists
    );
    assert_eq!(fs::read(dir.0.join("record")).unwrap(), bytes);
    assert_eq!(fs::read_dir(&dir.0).unwrap().count(), 1);
    assert_eq!(
        install_once(&dir.0, "empty", b"").unwrap(),
        Installed::Created
    );
}
#[test]
fn concurrent_writers_have_exactly_one_winner() {
    let dir = Dir::new();
    let barrier = std::sync::Arc::new(std::sync::Barrier::new(16));
    let workers: Vec<_> = (0..16u8)
        .map(|i| {
            let path = dir.0.clone();
            let barrier = barrier.clone();
            std::thread::spawn(move || {
                barrier.wait();
                (i, install_once(&path, "record", &[i; 8192]).unwrap())
            })
        })
        .collect();
    let winners: Vec<_> = workers
        .into_iter()
        .map(|t| t.join().unwrap())
        .filter(|(_, r)| *r == Installed::Created)
        .collect();
    assert_eq!(winners.len(), 1);
    assert_eq!(
        fs::read(dir.0.join("record")).unwrap(),
        vec![winners[0].0; 8192]
    );
    assert_eq!(fs::read_dir(&dir.0).unwrap().count(), 1);
}
#[test]
fn rejects_non_literal_names_without_writes() {
    let dir = Dir::new();
    for name in ["", ".", "..", "a/b", "a\\b", "/tmp/no", "a\0b"] {
        let error = install_once(&dir.0, name, b"bad").unwrap_err();
        assert_eq!(error.source.kind(), std::io::ErrorKind::InvalidInput);
        assert!(error.installed.is_none());
    }
    assert_eq!(fs::read_dir(&dir.0).unwrap().count(), 0);
}
#[cfg(unix)]
#[test]
fn existing_symlink_is_not_followed() {
    let dir = Dir::new();
    fs::write(dir.0.join("victim"), b"original").unwrap();
    std::os::unix::fs::symlink("victim", dir.0.join("record")).unwrap();
    assert_eq!(
        install_once(&dir.0, "record", b"changed").unwrap(),
        Installed::AlreadyExists
    );
    assert_eq!(fs::read(dir.0.join("victim")).unwrap(), b"original");
    assert!(fs::symlink_metadata(dir.0.join("record"))
        .unwrap()
        .is_symlink());
}
#[test]
fn missing_parent_reports_no_install() {
    let dir = Dir::new();
    let error = install_once(&dir.0.join("missing"), "record", b"bytes").unwrap_err();
    assert!(error.installed.is_none());
    assert!(error.temporary.is_none());
}

/// Real OS-enforced partial write/EFBIG, isolated from the test harness's limits.
#[cfg(unix)]
#[test]
fn file_size_limit_never_installs_truncated_record() {
    const CHILD_DIR: &str = "FGOS_DURABLE_TEST_CHILD_DIR";
    if let Some(path) = std::env::var_os(CHILD_DIR) {
        let path = PathBuf::from(path);
        let error = install_once(&path, "record", &[7; 8192]).unwrap_err();
        assert_eq!(error.source.raw_os_error(), Some(libc::EFBIG));
        assert!(error.installed.is_none());
        assert!(!path.join("record").exists());
        let temporary = error.temporary.unwrap();
        assert_eq!(fs::metadata(temporary).unwrap().len(), 1024);
        return;
    }
    use std::os::unix::process::CommandExt;
    let dir = Dir::new();
    let mut cmd = std::process::Command::new(std::env::current_exe().unwrap());
    cmd.args(["--exact", "file_size_limit_never_installs_truncated_record"])
        .env(CHILD_DIR, &dir.0);
    unsafe {
        cmd.pre_exec(|| {
            libc::signal(libc::SIGXFSZ, libc::SIG_IGN);
            let limit = libc::rlimit {
                rlim_cur: 1024,
                rlim_max: 1024,
            };
            if libc::setrlimit(libc::RLIMIT_FSIZE, &limit) != 0 {
                return Err(std::io::Error::last_os_error());
            }
            Ok(())
        });
    }
    let output = cmd.output().unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    assert!(!dir.0.join("record").exists());
}
