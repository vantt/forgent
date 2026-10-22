//! The product ancestry reader over real processes: what the caller check
//! and the head finders judge.
#![cfg(unix)]

use fgos_mailbox::ancestry::ancestry_of;
use fgos_process::facts::{identity_of, self_identity};
use fgos_process::ProcId;
use std::process::{Child, Command};
use std::time::{Duration, Instant};

struct Spawned(Child);

impl Drop for Spawned {
    fn drop(&mut self) {
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}

/// The first child of `parent`, waited for.
fn child_of(parent: u32) -> u32 {
    let deadline = Instant::now() + Duration::from_secs(5);
    loop {
        for entry in std::fs::read_dir("/proc").unwrap().flatten() {
            let Some(pid) = entry.file_name().to_str().and_then(|n| n.parse::<u32>().ok()) else {
                continue;
            };
            if fgos_process::facts::relation_of(ProcId(pid)).is_some_and(|r| r.parent == parent) {
                return pid;
            }
        }
        assert!(Instant::now() < deadline, "no child of {parent} appeared");
        std::thread::sleep(Duration::from_millis(20));
    }
}

#[test]
fn the_ancestry_of_a_child_names_its_real_parent_and_grandparent_with_their_executables() {
    let shell = Spawned(Command::new("/bin/sh").args(["-c", "sleep 30; :"]).spawn().unwrap());
    let shell_pid = shell.0.id();
    let child = child_of(shell_pid);

    let ancestry = ancestry_of(child).expect("a live child's ancestry");

    assert_eq!(ancestry.parent, identity_of(ProcId(shell_pid)).unwrap().to_record());
    assert_eq!(ancestry.parent_relation.pid, ProcId(shell_pid));
    assert_eq!(ancestry.parent_relation.parent, std::process::id());
    assert_eq!(ancestry.parent_exe, Some(std::fs::canonicalize("/bin/sh").unwrap()));
    assert_eq!(ancestry.parent_argv0.as_deref(), Some("/bin/sh"));
    assert_eq!(ancestry.grandparent, Some(self_identity().unwrap().to_record()));
}

#[test]
fn an_unreadable_parent_gives_no_ancestry() {
    let mut gone = Command::new("true").spawn().unwrap();
    let pid = gone.id();
    gone.wait().unwrap();
    assert_eq!(ancestry_of(pid), None, "a reaped process has no parent to read");
}
