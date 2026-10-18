//! A mapped descriptor reaches exactly the child it was mapped into, and no
//! descriptor leaks past a spawn with an empty map. Checked by reading
//! `/proc/<pid>/fd` of a real child and a real grandchild.
#![cfg(target_os = "linux")]

use std::fs::{self, File};
use std::os::fd::AsRawFd;
use std::os::unix::fs::MetadataExt;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::time::{Duration, Instant};

use fgos_process::control::{self, spawn_with_fds};
use fgos_process::FdSlot;

const ROLE: &str = "FGOS_PROCESS_TEST_ROLE";
const OUT_FILE: &str = "FGOS_PROCESS_TEST_OUT_FILE";

/// Re-executed by the parent with `ROLE=fd-receiver`: take the inherited
/// slot 3 (which sets close-on-exec on it), start a grandchild with a plain
/// `Command`, publish the grandchild's pid, then sleep until killed.
#[test]
fn child_entry() {
    if std::env::var(ROLE).as_deref() != Ok("fd-receiver") {
        return;
    }
    let received = control::take_inherited(FdSlot(3)).expect("slot 3 was mapped");
    let mut grandchild = Command::new("sleep")
        .arg("300")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .spawn()
        .expect("spawn grandchild");
    let out = std::env::var(OUT_FILE).expect("out file path");
    fs::write(format!("{out}.tmp"), grandchild.id().to_string()).unwrap();
    fs::rename(format!("{out}.tmp"), &out).unwrap();
    std::thread::spawn(move || grandchild.wait().expect("reap grandchild"));
    let _keep_open = received;
    loop {
        std::thread::sleep(Duration::from_secs(3600));
    }
}

fn temp_dir(tag: &str) -> PathBuf {
    let nanos = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos();
    let dir = std::env::temp_dir().join(format!("fgos-process-{tag}-{}-{nanos}", std::process::id()));
    fs::create_dir_all(&dir).expect("temp dir");
    dir
}

fn wait_for(path: &Path, child: &mut Child) -> String {
    let deadline = Instant::now() + Duration::from_secs(20);
    while !path.exists() {
        if let Some(status) = child.try_wait().expect("try_wait") {
            panic!("child exited before it was ready: {status}");
        }
        assert!(Instant::now() < deadline, "child never became ready");
        std::thread::sleep(Duration::from_millis(20));
    }
    fs::read_to_string(path).unwrap()
}

/// Inodes of every descriptor `/proc/<pid>/fd` lists.
fn open_inodes(pid: u32) -> Vec<(String, u64)> {
    fs::read_dir(format!("/proc/{pid}/fd"))
        .expect("read fd dir")
        .filter_map(|e| e.ok())
        .filter_map(|e| fs::metadata(e.path()).ok().map(|m| (e.file_name().to_string_lossy().into_owned(), m.ino())))
        .collect()
}

fn self_exec() -> Command {
    let mut cmd = Command::new(std::env::current_exe().expect("test binary"));
    cmd.args(["--exact", "child_entry", "--nocapture", "--test-threads=1"]).stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::inherit());
    cmd
}

fn kill(pid: u32) {
    // SAFETY: SIGKILL to a process this test started.
    unsafe {
        libc::kill(pid as libc::pid_t, libc::SIGKILL);
    }
}

#[test]
fn a_mapped_file_reaches_the_child_at_its_slot_and_never_the_grandchild() {
    let dir = temp_dir("fds");
    let path = dir.join("lock");
    let file = File::create(&path).expect("create");
    let ino = file.metadata().unwrap().ino();
    let out = dir.join("grandchild-pid");

    let mut cmd = self_exec();
    cmd.env(ROLE, "fd-receiver").env(OUT_FILE, &out);
    let mut child = spawn_with_fds(cmd, &[(FdSlot(3), &file)]).expect("spawn with slot 3");
    let grandchild: u32 = wait_for(&out, &mut child).trim().parse().expect("grandchild pid");

    let child_fds = open_inodes(child.id());
    assert!(child_fds.iter().any(|(fd, i)| fd == "3" && *i == ino), "the child has the file at slot 3: {child_fds:?}");
    let grandchild_fds = open_inodes(grandchild);
    assert!(!grandchild_fds.iter().any(|(_, i)| *i == ino), "the grandchild must not see the file: {grandchild_fds:?}");

    kill(grandchild);
    child.kill().ok();
    child.wait().ok();
    fs::remove_dir_all(&dir).ok();
}

#[test]
fn an_empty_map_closes_an_inherited_descriptor_that_lacks_close_on_exec() {
    let dir = temp_dir("fds-nomap");
    let path = dir.join("leaky");
    let file = File::create(&path).expect("create");
    let ino = file.metadata().unwrap().ino();
    // Clear close-on-exec: this is the descriptor shape `Command` alone would
    // hand to every child.
    // SAFETY: fcntl on a descriptor this process owns.
    assert_eq!(unsafe { libc::fcntl(file.as_raw_fd(), libc::F_SETFD, 0) }, 0);

    let mut cmd = Command::new("sleep");
    cmd.arg("300").stdin(Stdio::null()).stdout(Stdio::null());
    let mut child = spawn_with_fds(cmd, &[]).expect("spawn with empty map");
    std::thread::sleep(Duration::from_millis(50));
    let child_fds = open_inodes(child.id());
    assert!(!child_fds.iter().any(|(_, i)| *i == ino), "a descriptor outside the map never reaches the child: {child_fds:?}");
    assert!(child_fds.iter().all(|(fd, _)| fd.parse::<u32>().is_ok_and(|n| n < 3)), "only stdio is open in the child: {child_fds:?}");

    child.kill().ok();
    child.wait().ok();
    fs::remove_dir_all(&dir).ok();
}

#[test]
fn a_program_that_cannot_be_executed_is_an_error_not_a_dead_child() {
    // `Command` reports an exec failure through a close-on-exec pipe of its
    // own; closing it along with the leaked descriptors would turn this
    // into a child that aborted after the fork, with a success from spawn.
    let dir = temp_dir("fds-noexec");
    let file = File::create(dir.join("lock")).expect("create");
    let mut cmd = Command::new(dir.join("no-such-program"));
    cmd.stdin(Stdio::null()).stdout(Stdio::null());
    let err = spawn_with_fds(cmd, &[(FdSlot(3), &file)]).expect_err("a missing program is a spawn error");
    assert_eq!(err.kind(), std::io::ErrorKind::NotFound, "{err}");
    let mut cmd = Command::new(dir.join("no-such-program"));
    cmd.stdin(Stdio::null()).stdout(Stdio::null());
    let err = spawn_with_fds(cmd, &[]).expect_err("a missing program is a spawn error with an empty map too");
    assert_eq!(err.kind(), std::io::ErrorKind::NotFound, "{err}");
    fs::remove_dir_all(&dir).ok();
}

#[test]
fn a_slot_below_three_or_a_duplicate_slot_is_refused() {
    let file = File::open("/proc/self/stat").unwrap();
    let mut cmd = Command::new("sleep");
    cmd.arg("1");
    let err = spawn_with_fds(cmd, &[(FdSlot(2), &file)]).expect_err("slot 2 is stdio");
    assert_eq!(err.kind(), std::io::ErrorKind::InvalidInput);
    let mut cmd = Command::new("sleep");
    cmd.arg("1");
    let err = spawn_with_fds(cmd, &[(FdSlot(4), &file), (FdSlot(4), &file)]).expect_err("slot 4 twice");
    assert_eq!(err.kind(), std::io::ErrorKind::InvalidInput);
}

#[test]
fn a_file_can_be_mapped_to_two_slots_and_sources_are_never_clobbered() {
    // The source descriptor number is itself a slot of the map: the dup2
    // order must not overwrite it before it is copied.
    let dir = temp_dir("fds-two");
    let a = File::create(dir.join("a")).unwrap();
    let b = File::create(dir.join("b")).unwrap();
    let (ino_a, ino_b) = (a.metadata().unwrap().ino(), b.metadata().unwrap().ino());
    let (slot_a, slot_b) = (FdSlot(b.as_raw_fd() as u32), FdSlot(a.as_raw_fd() as u32));
    assert!(slot_a.0 >= 3 && slot_b.0 >= 3 && slot_a != slot_b);

    let mut cmd = Command::new("sleep");
    cmd.arg("300").stdin(Stdio::null()).stdout(Stdio::null());
    let mut child = spawn_with_fds(cmd, &[(slot_a, &a), (slot_b, &b)]).expect("spawn");
    std::thread::sleep(Duration::from_millis(50));
    let fds = open_inodes(child.id());
    assert!(fds.contains(&(slot_a.0.to_string(), ino_a)), "a at its slot: {fds:?}");
    assert!(fds.contains(&(slot_b.0.to_string(), ino_b)), "b at its slot: {fds:?}");
    child.kill().ok();
    child.wait().ok();
    fs::remove_dir_all(&dir).ok();
}
