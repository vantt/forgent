//! `windows_spawn::spawn` against real processes: the child inherits the
//! handles of its three streams and no other handle of the parent, standard
//! streams reach files and pipes, and the working directory and environment
//! are the ones asked for. The test binary re-executes itself (the test named
//! `child_entry`, selected by `WS_ROLE`) and plays the child.
#![cfg(windows)]

use std::ffi::OsString;
use std::fs;
use std::io::{Read, Write};
use std::os::windows::io::AsRawHandle;
use std::path::PathBuf;

use fgos_process::platform::windows_spawn::{spawn, ChildStdio, SpawnSpec};
use windows_sys::Win32::Foundation::{GetHandleInformation, SetHandleInformation, HANDLE, HANDLE_FLAG_INHERIT};

const ROLE: &str = "WS_ROLE";
const PROBE_HANDLE: &str = "WS_PROBE_HANDLE";
const RESULT: &str = "WS_RESULT";

/// The child's side: reports on a handle value, or echoes stdin, or prints
/// its working directory and one variable.
#[test]
fn child_entry() {
    let Ok(role) = std::env::var(ROLE) else { return };
    match role.as_str() {
        "probe" => {
            let value: usize = std::env::var(PROBE_HANDLE).unwrap().parse().unwrap();
            let mut flags = 0u32;
            // SAFETY: asking the kernel about a handle value; an invalid one fails.
            let open = unsafe { GetHandleInformation(value as HANDLE, &mut flags) } != 0;
            fs::write(std::env::var(RESULT).unwrap(), if open { "open" } else { "closed" }).unwrap();
        }
        "echo" => {
            let mut text = String::new();
            std::io::stdin().read_to_string(&mut text).unwrap();
            print!("echo:{text}");
        }
        "where" => {
            let cwd = std::env::current_dir().unwrap();
            fs::write(std::env::var(RESULT).unwrap(), format!("{}|{}", cwd.display(), std::env::var("WS_MARK").unwrap_or_default())).unwrap();
        }
        other => panic!("unknown role {other}"),
    }
}

fn temp_dir(tag: &str) -> PathBuf {
    let nanos = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos();
    let dir = std::env::temp_dir().join(format!("fgos-windows-spawn-{tag}-{}-{nanos}", std::process::id()));
    fs::create_dir_all(&dir).unwrap();
    dir
}

fn child_spec(extra: &[(&str, String)]) -> SpawnSpec {
    let mut env: Vec<(OsString, OsString)> = std::env::vars_os().collect();
    env.retain(|(name, _)| name != ROLE);
    for (name, value) in extra {
        env.retain(|(existing, _)| existing != name);
        env.push((OsString::from(*name), OsString::from(value)));
    }
    SpawnSpec {
        program: std::env::current_exe().unwrap().into_os_string(),
        args: vec!["--exact".into(), "child_entry".into(), "--nocapture".into(), "--test-threads=1".into()],
        cwd: None,
        env: Some(env),
        creation_flags: 0,
        stdin: ChildStdio::Null,
        stdout: ChildStdio::Null,
        stderr: ChildStdio::Null,
    }
}

/// A handle of this process that `CreateProcess` with `bInheritHandles` would
/// hand to any child: opened inheritable, as another library in the holder may.
fn inheritable_handle_of_the_holder(dir: &std::path::Path) -> (fs::File, HANDLE) {
    let file = fs::File::create(dir.join("holder-owned.txt")).unwrap();
    let raw = file.as_raw_handle() as HANDLE;
    // SAFETY: setting the inherit flag on a handle this test owns.
    assert_ne!(unsafe { SetHandleInformation(raw, HANDLE_FLAG_INHERIT, HANDLE_FLAG_INHERIT) }, 0);
    (file, raw)
}

#[test]
fn a_handle_the_parent_owns_is_not_open_in_the_child() {
    let dir = temp_dir("probe");
    let (_held, raw) = inheritable_handle_of_the_holder(&dir);
    let result = dir.join("result.txt");
    let spec = child_spec(&[(ROLE, "probe".into()), (PROBE_HANDLE, (raw as usize).to_string()), (RESULT, result.to_string_lossy().into_owned())]);
    let child = spawn(spec).expect("spawn");
    assert_eq!(child.wait().unwrap(), 0);
    assert_eq!(fs::read_to_string(&result).unwrap(), "closed", "the inheritable handle the parent owns must not reach the child");
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn a_file_given_as_a_standard_stream_receives_the_childs_output() {
    let dir = temp_dir("stream");
    let out_path = dir.join("stdout.txt");
    let mut spec = child_spec(&[(ROLE, "echo".into())]);
    spec.stdin = ChildStdio::Piped;
    spec.stdout = ChildStdio::File(fs::File::create(&out_path).unwrap());
    let mut child = spawn(spec).expect("spawn");
    child.stdin.take().unwrap().write_all(b"hello").unwrap();
    assert_eq!(child.wait().unwrap(), 0);
    assert!(fs::read_to_string(&out_path).unwrap().contains("echo:hello"));
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn piped_streams_reach_the_parent() {
    let mut spec = child_spec(&[(ROLE, "echo".into())]);
    spec.stdin = ChildStdio::Piped;
    spec.stdout = ChildStdio::Piped;
    let mut child = spawn(spec).expect("spawn");
    child.stdin.take().unwrap().write_all(b"through a pipe").unwrap();
    let mut text = String::new();
    child.stdout.take().unwrap().read_to_string(&mut text).unwrap();
    assert!(text.contains("echo:through a pipe"), "{text}");
    assert_eq!(child.wait().unwrap(), 0);
}

#[test]
fn the_working_directory_and_environment_are_the_ones_asked_for() {
    let dir = temp_dir("where");
    let result = dir.join("result.txt");
    let mut spec = child_spec(&[(ROLE, "where".into()), (RESULT, result.to_string_lossy().into_owned()), ("WS_MARK", "marked".into())]);
    spec.cwd = Some(dir.clone());
    let child = spawn(spec).expect("spawn");
    assert_eq!(child.wait().unwrap(), 0);
    let text = fs::read_to_string(&result).unwrap();
    let (cwd, mark) = text.split_once('|').unwrap();
    assert_eq!(fs::canonicalize(cwd).unwrap(), fs::canonicalize(&dir).unwrap());
    assert_eq!(mark, "marked");
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn a_program_that_does_not_exist_is_an_error_not_a_panic() {
    let mut spec = child_spec(&[]);
    spec.program = "fgos-no-such-program-anywhere".into();
    assert_eq!(spawn(spec).err().map(|e| e.kind()), Some(std::io::ErrorKind::NotFound));
}
