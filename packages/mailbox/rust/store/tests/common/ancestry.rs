//! Reads a process's ancestry from the operating system for the head
//! finder: its parent's process-facts record and command name, and its
//! grandparent's record. Shared by the tests and the test-only entry
//! `examples/mailbox-test-hook.rs`, which includes this file by path, so
//! the reader exists once; the store itself reads no process table.
#![allow(dead_code)]
use fgos_mailbox::head::Ancestry;
use fgos_process::facts::identity_of;
use fgos_process::ProcId;

/// The ancestry of `pid`, read now; `None` when its parent cannot be read.
pub fn ancestry_of(pid: u32) -> Option<Ancestry> {
    let tree = fgos_identity::os_process_tree();
    let parent = tree.stat(pid)?.ppid;
    let parent_record = identity_of(ProcId(parent))?.to_record();
    let parent_comm = std::fs::read_to_string(format!("/proc/{parent}/comm"))
        .ok()?
        .trim()
        .to_string();
    let grandparent = tree
        .stat(parent)
        .and_then(|stat| identity_of(ProcId(stat.ppid)))
        .map(|tuple| tuple.to_record());
    Some(Ancestry {
        parent: parent_record,
        parent_comm,
        grandparent,
    })
}
