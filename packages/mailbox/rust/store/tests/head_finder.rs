//! The Claude Code head finder over real processes and real session files.
//! A head is a child the test spawns (or, under one shell hop, the test
//! process itself); every ancestry is read from the operating system.
#![cfg(unix)]
mod common;

use common::ancestry::ancestry_of;
use common::hook_limits;
use common::record::{mkfifo, TempFgos};
use fgos_mailbox::adapters::claude_head::find_head;
use fgos_mailbox::head::{Ancestry, NoHead, Topology};
use fgos_mailbox_core::WriterKey;
use fgos_process::facts::{identity_of, self_identity, Record};
use fgos_process::ProcId;
use serde_json::{json, Value};
use std::path::Path;
use std::process::{Child, Command};
use std::time::{Duration, Instant};

/// Puts a session file (or something in its place) into a directory.
type Plant<'a> = Box<dyn Fn(&Path) + 'a>;

const WRITER: &str = "00000000-0000-4000-8000-000000000001";

/// A spawned process killed when the test ends.
struct Spawned(Child);

impl Drop for Spawned {
    fn drop(&mut self) {
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}

fn spawn(program: &str, args: &[&str]) -> Spawned {
    Spawned(Command::new(program).args(args).spawn().unwrap())
}

fn record_of(pid: u32) -> Record {
    identity_of(ProcId(pid)).unwrap().to_record()
}

fn writer() -> WriterKey {
    WriterKey::new(WRITER).unwrap()
}

/// A session file as Claude Code 2.1.308 writes it, for `pid`.
fn session(pid: u32, start_time: &str) -> Value {
    json!({
        "pid": pid,
        "sessionId": WRITER,
        "procStart": start_time,
        "kind": "interactive",
        "entrypoint": "sdk-cli",
        "name": "forgent-session-3a",
        "nameSource": "derived",
        "version": "2.1.308"
    })
}

fn write(dir: &Path, pid: u32, doc: &Value) {
    std::fs::write(dir.join(format!("{pid}.json")), doc.to_string()).unwrap();
}

/// A head the test spawns, as topology A sees it: the entry's parent.
fn direct_head() -> (Spawned, u32, Ancestry) {
    let child = spawn("sleep", &["30"]);
    let pid = child.0.id();
    let ancestry = Ancestry {
        parent: record_of(pid),
        parent_comm: "sleep".to_string(),
        grandparent: None,
    };
    (child, pid, ancestry)
}

/// The first child of `parent`, waited for.
fn child_of(parent: u32) -> u32 {
    let tree = fgos_identity::os_process_tree();
    let deadline = Instant::now() + Duration::from_secs(5);
    loop {
        for entry in std::fs::read_dir("/proc").unwrap().flatten() {
            let Some(pid) = entry
                .file_name()
                .to_str()
                .and_then(|n| n.parse::<u32>().ok())
            else {
                continue;
            };
            if tree.stat(pid).is_some_and(|s| s.ppid == parent) {
                return pid;
            }
        }
        assert!(Instant::now() < deadline, "no child of {parent} appeared");
        std::thread::sleep(Duration::from_millis(20));
    }
}

fn find(
    dir: &Path,
    ancestry: &Ancestry,
    topology: Topology,
) -> Result<fgos_mailbox::hook::HeadFacts, NoHead> {
    find_head(dir, ancestry, topology, &writer(), &hook_limits().hook)
}

#[test]
fn a_session_file_naming_the_head_and_the_writer_gives_that_process_as_the_head() {
    let dir = TempFgos::new("head-finder");
    let (_child, pid, ancestry) = direct_head();
    let record = record_of(pid);
    write(
        dir.scratch().as_path(),
        pid,
        &session(pid, record.start_time.as_deref().unwrap()),
    );

    let head = find(dir.scratch().as_path(), &ancestry, Topology::Direct).unwrap();

    assert_eq!(head.record, record);
    assert_eq!(head.own_suffix.as_deref(), Some("3a"));
    assert_eq!(head.handle, None);
}

#[test]
fn under_one_shell_hop_the_head_is_the_shells_parent_and_any_other_parent_is_the_wrong_topology() {
    let dir = TempFgos::new("head-finder");
    // A shell that does not exec its last command, as Claude Code's hook
    // runner was measured to start the entry; its parent is this process.
    let shell = spawn("sh", &["-c", "sleep 30; :"]);
    let entry = child_of(shell.0.id());
    let hop = ancestry_of(entry).unwrap();
    let own = self_identity().unwrap().to_record();
    write(
        dir.scratch().as_path(),
        std::process::id(),
        &session(std::process::id(), own.start_time.as_deref().unwrap()),
    );

    let head = find(dir.scratch().as_path(), &hop, Topology::OneShellHop).unwrap();
    assert_eq!(head.record, own);
    assert_eq!(
        find(dir.scratch().as_path(), &hop, Topology::Direct),
        Err(NoHead::WrongTopology),
        "a shell parent is never the head of topology A"
    );

    let (_child, _, direct) = direct_head();
    assert_eq!(
        find(dir.scratch().as_path(), &direct, Topology::OneShellHop),
        Err(NoHead::WrongTopology),
        "a parent that is no shell is never the hop of topology B"
    );
}

#[test]
fn a_session_file_of_another_session_gives_no_head() {
    let dir = TempFgos::new("head-finder");
    let (_child, pid, ancestry) = direct_head();
    let mut doc = session(pid, record_of(pid).start_time.as_deref().unwrap());
    doc["sessionId"] = json!("00000000-0000-4000-8000-000000000002");
    write(dir.scratch().as_path(), pid, &doc);

    assert_eq!(
        find(dir.scratch().as_path(), &ancestry, Topology::Direct),
        Err(NoHead::OtherSession)
    );
}

#[test]
fn a_session_file_whose_pid_is_not_the_head_gives_no_head() {
    let dir = TempFgos::new("head-finder");
    let (_child, pid, ancestry) = direct_head();
    let mut doc = session(pid, record_of(pid).start_time.as_deref().unwrap());
    doc["pid"] = json!(pid + 1);
    write(dir.scratch().as_path(), pid, &doc);

    assert_eq!(
        find(dir.scratch().as_path(), &ancestry, Topology::Direct),
        Err(NoHead::OtherProcess)
    );
}

#[test]
fn a_missing_unreadable_symlinked_fifo_or_oversized_session_file_gives_no_head_and_never_follows_the_link(
) {
    let limit = hook_limits().hook.max_read_bytes;
    let (_child, pid, ancestry) = direct_head();
    let valid = session(pid, record_of(pid).start_time.as_deref().unwrap());
    let file = move |dir: &Path| dir.join(format!("{pid}.json"));
    let cases: Vec<(&str, Plant, NoHead)> = vec![
        ("absent", Box::new(|_| {}), NoHead::NoSessionFile),
        (
            "a directory",
            Box::new(move |d| std::fs::create_dir(file(d)).unwrap()),
            NoHead::Unreadable,
        ),
        (
            "a symlink to a valid file",
            Box::new({
                let valid = valid.clone();
                move |d| {
                    let target = d.join("real.json");
                    std::fs::write(&target, valid.to_string()).unwrap();
                    std::os::unix::fs::symlink(&target, file(d)).unwrap();
                }
            }),
            NoHead::Unreadable,
        ),
        (
            "a FIFO",
            Box::new(move |d| mkfifo(&file(d))),
            NoHead::Unreadable,
        ),
        (
            "one byte over the cap",
            Box::new({
                let valid = valid.clone();
                move |d| {
                    let mut text = valid.to_string();
                    let pad = limit as usize + 1 - text.len();
                    text.push_str(&" ".repeat(pad));
                    std::fs::write(file(d), text).unwrap();
                }
            }),
            NoHead::Unreadable,
        ),
        (
            "invalid JSON",
            Box::new(move |d| std::fs::write(file(d), "{not json").unwrap()),
            NoHead::Unreadable,
        ),
    ];
    for (what, make, expected) in cases {
        let dir = TempFgos::new("head-finder");
        make(dir.scratch().as_path());
        assert_eq!(
            find(dir.scratch().as_path(), &ancestry, Topology::Direct),
            Err(expected),
            "{what}"
        );
    }
}

#[test]
fn a_start_time_the_session_file_disagrees_with_gives_no_head() {
    let dir = TempFgos::new("head-finder");
    let (_child, pid, ancestry) = direct_head();
    let start: u64 = record_of(pid).start_time.unwrap().parse().unwrap();
    write(
        dir.scratch().as_path(),
        pid,
        &session(pid, &(start + 1).to_string()),
    );

    assert_eq!(
        find(dir.scratch().as_path(), &ancestry, Topology::Direct),
        Err(NoHead::StartTimeMismatch)
    );
}

#[test]
fn a_name_that_is_not_derived_gives_no_own_suffix() {
    let dir = TempFgos::new("head-finder");
    let (_child, pid, ancestry) = direct_head();
    let mut doc = session(pid, record_of(pid).start_time.as_deref().unwrap());
    doc["nameSource"] = json!("auto");
    doc["name"] = json!("fix the login bug-4c");
    write(dir.scratch().as_path(), pid, &doc);

    let head = find(dir.scratch().as_path(), &ancestry, Topology::Direct).unwrap();
    assert_eq!(head.own_suffix, None);
}
