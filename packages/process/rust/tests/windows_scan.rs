//! The Windows process scan, against real child processes: each is found by
//! the working directory it was started in and by the typed `--dir` it was
//! given, and one started elsewhere is not placed in either directory.
#![cfg(windows)]

use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};

use fgos_process::facts::{scan, self_effective_uid, ProcView, Scan, ScanFilter};

struct Scratch(PathBuf);

impl Scratch {
    fn new(tag: &str) -> Scratch {
        let dir = std::env::temp_dir().join(format!("fgos-winscan-{tag}-{}", std::process::id()));
        fs::create_dir_all(&dir).unwrap();
        Scratch(dir)
    }
}

impl Drop for Scratch {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

/// A child that sits for half a minute; `tail` is appended to its argv after a `rem`.
fn idle_child(cwd: &Path, tail: &[&str]) -> Child {
    let mut command = Command::new("cmd");
    command
        .args([
            "/D",
            "/C",
            "ping",
            "-n",
            "30",
            "127.0.0.1",
            ">NUL",
            "&",
            "rem",
        ])
        .args(tail)
        .current_dir(cwd)
        .stdin(Stdio::null());
    command.spawn().unwrap()
}

fn view_of(child: &Child) -> ProcView {
    let filter = ScanFilter::default();
    let Scan::Views(views) = scan(&filter) else {
        panic!("the Windows scan is supported");
    };
    views
        .into_iter()
        .find(|view| view.pid.0 == child.id())
        .expect("the child is in the scan")
}

fn plain(path: &Path) -> String {
    fgos_process::path::plain_path(&path.canonicalize().unwrap())
        .to_string_lossy()
        .to_lowercase()
}

fn stop(mut child: Child) {
    let _ = child.kill();
    let _ = child.wait();
}

#[test]
fn a_child_started_in_a_directory_is_found_by_its_working_directory_and_user() {
    let (here, elsewhere) = (Scratch::new("here"), Scratch::new("elsewhere"));
    let (inside, outside) = (idle_child(&here.0, &[]), idle_child(&elsewhere.0, &[]));
    let (found, other) = (view_of(&inside), view_of(&outside));
    let cwd = |view: &ProcView| plain(view.cwd.as_ref().expect("working directory read"));
    assert_eq!(cwd(&found), plain(&here.0));
    assert_eq!(cwd(&other), plain(&elsewhere.0));
    assert_ne!(cwd(&other), plain(&here.0));
    assert!(found.tuple.is_some(), "a live child has an identity");
    assert!(found.unreadable.is_empty(), "{:?}", found.unreadable);
    assert!(self_effective_uid().is_some());
    assert_eq!(
        found.effective_uid,
        self_effective_uid(),
        "a child runs as this user"
    );
    stop(inside);
    stop(outside);
}

#[test]
fn a_child_given_a_typed_directory_carries_it_in_its_argument_vector() {
    let (workspace, elsewhere) = (Scratch::new("workspace"), Scratch::new("cwd-elsewhere"));
    let dir = workspace.0.to_string_lossy().into_owned();
    let child = idle_child(&elsewhere.0, &["--dir", &dir]);
    let view = view_of(&child);
    let argv = view.cmdline.expect("argument vector read");
    let at = argv.iter().position(|arg| arg == "--dir").expect("--dir");
    assert_eq!(argv[at + 1], dir);
    assert_eq!(argv[0].to_lowercase(), "cmd");
    assert_ne!(
        plain(view.cwd.as_ref().expect("working directory read")),
        plain(&workspace.0),
        "found by the typed root, not by where it runs"
    );
    stop(child);
}
