//! The hook entry's ancestry, read through process facts (spec §6.1): the
//! parent's record, place in the tree, executable, invoked path and command
//! name, and the
//! grandparent's record. The one place the store reads the process table
//! for the caller check and the head finders.
use crate::head::Ancestry;
use fgos_process::facts::{command_name_of, identity_of, relation_of, view_of, ScanFilter};
use fgos_process::ProcId;

/// The ancestry of `pid`, read now; `None` when its parent's record or
/// place cannot be read.
pub fn ancestry_of(pid: u32) -> Option<Ancestry> {
    let parent = relation_of(ProcId(pid))?.parent;
    let parent_record = identity_of(ProcId(parent))?.to_record();
    let parent_relation = relation_of(ProcId(parent))?;
    let view = view_of(
        ProcId(parent),
        &ScanFilter {
            env_keys: Vec::new(),
            include_self: true,
        },
    );
    let (parent_exe, parent_argv0) = view
        .map(|v| (v.exe, v.cmdline.and_then(|argv| argv.into_iter().next())))
        .unwrap_or((None, None));
    let grandparent = identity_of(ProcId(parent_relation.parent)).map(|t| t.to_record());
    Some(Ancestry {
        parent: parent_record,
        parent_relation,
        parent_exe,
        parent_argv0,
        parent_comm: command_name_of(ProcId(parent)),
        grandparent,
    })
}
