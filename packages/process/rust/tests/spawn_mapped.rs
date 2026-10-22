//! `spawn_mapped` gives a real child exactly its slot and stdio, nothing else
//! that lacks close-on-exec, its own process group when asked, the requested
//! environment and directory, and refuses a program that cannot run.
#![cfg(target_os = "linux")]

use std::fs::{self, File};
use std::io::Read;
use std::os::fd::AsRawFd;
use std::os::unix::fs::MetadataExt;
use std::path::PathBuf;

use fgos_process::mapped::{spawn_mapped, MappedSpawn, MappedStdio};
use fgos_process::FdSlot;

fn temp_dir(tag: &str) -> PathBuf {
    let nanos = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos();
    let dir = std::env::temp_dir().join(format!("fgos-mapped-{tag}-{}-{nanos}", std::process::id()));
    fs::create_dir_all(&dir).expect("temp dir");
    fs::canonicalize(dir).unwrap()
}

fn request(script: &str) -> MappedSpawn {
    MappedSpawn {
        argv: vec!["sh".into(), "-c".into(), script.into()],
        env: vec![("PATH".into(), "/usr/bin:/bin".into()), ("MAPPED_PROBE".into(), "yes".into())],
        clear_env: true,
        cwd: None,
        process_group: false,
        stdio: [MappedStdio::Null, MappedStdio::Piped, MappedStdio::Piped],
    }
}

fn output(mut req: MappedSpawn, map: &[(FdSlot, &File)]) -> (String, i32) {
    req.stdio = [MappedStdio::Null, MappedStdio::Piped, MappedStdio::Null];
    let mut child = spawn_mapped(&req, map).expect("spawn");
    let mut out = String::new();
    child.stdout.take().unwrap().read_to_string(&mut out).unwrap();
    let status = child.wait().unwrap();
    (out, status.code().unwrap_or(-1))
}

#[test]
fn the_slot_holds_the_mapped_file_and_no_other_descriptor_survives() {
    let dir = temp_dir("slot");
    let mapped = File::create(dir.join("mapped")).unwrap();
    let leaky = File::create(dir.join("leaky")).unwrap();
    // SAFETY: clears close-on-exec on a descriptor this test owns.
    assert_eq!(unsafe { libc::fcntl(leaky.as_raw_fd(), libc::F_SETFD, 0) }, 0);
    let (out, code) = output(
        request("stat -L -c %i /proc/self/fd/3; ls /proc/self/fd | sort -n | tr '\\n' ' '"),
        &[(FdSlot(3), &mapped)],
    );
    assert_eq!(code, 0, "{out}");
    let mut lines = out.lines();
    assert_eq!(lines.next().unwrap().trim(), mapped.metadata().unwrap().ino().to_string());
    // 0-2, the slot, and the directory `ls` itself opens: nothing leaked.
    let fds: Vec<u32> = lines.next().unwrap().split_whitespace().map(|n| n.parse().unwrap()).collect();
    assert!(fds.iter().filter(|fd| **fd >= 3).count() <= 2, "{fds:?}");
    assert!(fds.contains(&3));
    // The parent's copy keeps close-on-exec.
    // SAFETY: reads the flags of a descriptor this test owns.
    assert_ne!(unsafe { libc::fcntl(mapped.as_raw_fd(), libc::F_GETFD) } & libc::FD_CLOEXEC, 0);
    fs::remove_dir_all(dir).ok();
}

#[test]
fn environment_directory_and_process_group_follow_the_request() {
    let dir = temp_dir("env");
    let mut req = request("echo \"$MAPPED_PROBE:${HOME:-none}:$(pwd)\"; ps -o pgid= -p $$ | tr -d ' '; echo $$");
    req.cwd = Some(dir.clone());
    req.process_group = true;
    let (out, code) = output(req, &[]);
    assert_eq!(code, 0);
    let lines: Vec<&str> = out.lines().collect();
    assert_eq!(lines[0], format!("yes:none:{}", dir.display()));
    assert_eq!(lines[1], lines[2], "the child leads its own process group");
    fs::remove_dir_all(dir).ok();
}

#[test]
fn stdin_is_delivered_and_exit_codes_are_kept() {
    let mut req = request("read line; echo \"got $line\"; exit 7");
    req.stdio = [MappedStdio::Piped, MappedStdio::Piped, MappedStdio::Null];
    let mut child = spawn_mapped(&req, &[]).unwrap();
    {
        use std::io::Write;
        let mut stdin = child.stdin.take().unwrap();
        stdin.write_all(b"hello\n").unwrap();
    }
    let mut out = String::new();
    child.stdout.take().unwrap().read_to_string(&mut out).unwrap();
    assert_eq!(out, "got hello\n");
    assert_eq!(child.wait().unwrap().code(), Some(7));
    // A second wait returns the reaped status.
    assert_eq!(child.wait().unwrap().code(), Some(7));
}

#[test]
fn a_missing_program_is_an_error_of_the_call() {
    let mut req = request("true");
    req.argv[0] = "/nonexistent/fgos-mapped-program".into();
    assert!(spawn_mapped(&req, &[]).is_err());
    req.argv[0] = "fgos-mapped-program-that-is-nowhere".into();
    assert!(spawn_mapped(&req, &[]).is_err());
    assert!(spawn_mapped(&MappedSpawn { argv: vec![], ..request("true") }, &[]).is_err());
}

#[test]
fn a_slot_below_three_is_refused() {
    let dir = temp_dir("low");
    let file = File::create(dir.join("f")).unwrap();
    assert!(spawn_mapped(&request("true"), &[(FdSlot(2), &file)]).is_err());
    fs::remove_dir_all(dir).ok();
}

#[test]
fn path_lookup_skips_directories_uses_child_cwd_and_runs_scripts_without_shebang() {
    let dir = temp_dir("path");
    fs::create_dir_all(dir.join("first/probe")).unwrap();
    fs::create_dir(dir.join("second")).unwrap();
    let script = dir.join("second/probe");
    // A file this process writes stays open for writing in any child another test thread forks
    // meanwhile, and exec of it then fails with ETXTBSY. `install` writes the executed copy in its
    // own process, so no fork here ever holds it open.
    let staging = dir.join("probe.src");
    fs::write(&staging, "printf 'script:%s' \"$1\"\n").unwrap();
    let installed = std::process::Command::new("install").arg("-m").arg("700").arg(&staging).arg(&script).status().unwrap();
    assert!(installed.success());
    let mut req = request("unused");
    req.argv = vec!["probe".into(), "arg".into()];
    req.cwd = Some(dir.clone());
    req.env = vec![("PATH".into(), "first:second".into())];
    assert_eq!(output(req.clone(), &[]), ("script:arg".into(), 0));
    fs::rename(script, dir.join("probe")).unwrap();
    req.env = vec![("PATH".into(), "".into())];
    assert_eq!(output(req, &[]), ("script:arg".into(), 0));
    fs::remove_dir_all(dir).unwrap();
}
