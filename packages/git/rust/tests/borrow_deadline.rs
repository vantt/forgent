//! Real Git native-lock cleanup through the generic holder-lock borrow port.
#![cfg(unix)]
use fgos_holder_lock::*;
use std::{
    fs,
    process::Command,
    time::{Duration, Instant},
};

fn git_deadline_removes_index_lock(namespaced: bool) {
    let dir = {
        let path = std::env::temp_dir().join(format!(
            "fgos-git-deadline-{}-{}",
            std::process::id(),
            namespaced
        ));
        fs::create_dir(&path).unwrap();
        path
    };
    let git = |args: &[&str]| {
        let out = Command::new("git")
            .args(args)
            .current_dir(&dir)
            .output()
            .unwrap();
        assert!(
            out.status.success(),
            "{args:?}: {}",
            String::from_utf8_lossy(&out.stderr)
        );
        String::from_utf8(out.stdout).unwrap().trim().to_string()
    };
    git(&["init", "-q"]);
    git(&["config", "user.email", "fixture@example.invalid"]);
    git(&["config", "user.name", "Fixture"]);
    git(&["commit", "--allow-empty", "-qm", "base"]);
    let base = git(&["rev-parse", "HEAD"]);
    fs::write(dir.join(".gitattributes"), b"*.dat filter=slow\n").unwrap();
    fs::write(dir.join("file.dat"), b"incoming\n").unwrap();
    git(&["add", "."]);
    git(&["commit", "-qm", "incoming"]);
    let target = git(&["rev-parse", "HEAD"]);
    git(&["reset", "--hard", &base]);
    // Pause real read-tree while it owns index.lock. TERM reaches the Git
    // handler and its filter together; no synthetic lock or extra Git exec
    // is involved in deadline cleanup.
    git(&[
        "config",
        "filter.slow.smudge",
        if namespaced {
            "cat /proc/1/comm > namespace-init; touch ready; sleep 30; cat"
        } else {
            "touch ready; sleep 30; cat"
        },
    ]);
    let mut argv: Vec<String> = vec![
        "git".into(),
        "read-tree".into(),
        "--reset".into(),
        "-u".into(),
        target,
    ];
    if namespaced {
        let mut prefix: Vec<String> = [
            "bwrap",
            "--unshare-pid",
            "--as-pid-1",
            "--dev-bind",
            "/",
            "/",
            "--proc",
            "/proc",
            "--",
        ]
        .into_iter()
        .map(String::from)
        .collect();
        prefix.extend(argv);
        argv = prefix;
    }
    let spec = BorrowSpec {
        argv,
        cwd: Some(dir.clone()),
        ..Default::default()
    };
    let handle = match acquire(
        &Resource::new("io", dir.join("io.lock")),
        Mode::Ex,
        Wait::Try,
        2000,
    ) {
        Acquire::Acquired(h) => h,
        other => panic!("{other:?}"),
    };
    let io = BorrowIo {
        stdin: vec![],
        stdout_limit: 1024 * 1024,
        stderr_limit: 1024,
        deadline: Instant::now() + Duration::from_secs(10),
    };
    let observer = std::thread::spawn({
        let dir = dir.clone();
        move || {
            let until = Instant::now() + Duration::from_secs(8);
            while !dir.join("ready").exists() {
                assert!(
                    Instant::now() < until,
                    "Git never entered its smudge filter"
                );
                std::thread::sleep(Duration::from_millis(2));
            }
            assert!(
                dir.join(".git/index.lock").exists(),
                "real Git must hold the lock at the deadline boundary"
            );
        }
    });
    let error = run_borrowed_io(&handle, &spec, &io).unwrap_err();
    observer.join().unwrap();
    if namespaced {
        assert_eq!(
            fs::read_to_string(dir.join("namespace-init"))
                .unwrap()
                .trim(),
            "git"
        );
    }
    assert!(
        matches!(
            error,
            BorrowError::Deadline {
                termination: Termination::Terminated
            }
        ),
        "{error}"
    );
    assert!(!dir.join(".git/index.lock").exists());
    assert!(matches!(release(handle), Release::Released { .. }));
    fs::remove_dir_all(dir).unwrap();
}

#[test]
fn real_read_tree_deadline_cleans_its_native_lock() {
    git_deadline_removes_index_lock(false);
}

#[test]
#[cfg(target_os = "linux")]
#[ignore = "needs a bwrap PID namespace; the host gate runs it with --ignored"]
fn real_read_tree_deadline_as_namespace_init_cleans_its_native_lock() {
    let probe = Command::new("bwrap")
        .args([
            "--unshare-pid",
            "--as-pid-1",
            "--dev-bind",
            "/",
            "/",
            "--proc",
            "/proc",
            "--",
            "true",
        ])
        .output();
    assert!(
        probe.as_ref().is_ok_and(|p| p.status.success()),
        "bwrap PID namespace unavailable: {probe:?}"
    );
    git_deadline_removes_index_lock(true);
}
