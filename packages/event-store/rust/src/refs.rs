//! Literal own-ref naming shared by seal, promote and synchronization.
use crate::{
    envelope::Scope,
    errors::{invalid, Error},
    identity::valid_machine_id,
    layout::StreamId,
};
use fgos_git::RefName;
pub fn own_ref(machine: &str, stream: &StreamId) -> Result<RefName, Error> {
    if !valid_machine_id(machine) {
        return Err(invalid("invalid ref machine"));
    }
    let name = match stream.scope() {
        Scope::Project => format!("refs/fgos/events/{machine}"),
        Scope::Local => format!("refs/fgos/local-events/{machine}"),
        Scope::Branch => format!(
            "refs/fgos/branch-events/{machine}/{}",
            stream.as_str().strip_prefix("branch:").unwrap()
        ),
    };
    RefName::parse(&name).map_err(|e| invalid(e.to_string()))
}

pub(crate) fn mirror_event(remote: &str, machine: &str) -> String {
    format!("refs/fgos/remotes/{remote}/events/{machine}")
}
/// Exhaust pagination in one place; an incomplete page is never clearance.
pub(crate) fn list(
    port: &dyn fgos_git::Inspect,
    repo: &fgos_git::RepoHandle,
    prefixes: &[fgos_git::RefPrefix],
) -> Result<Vec<fgos_git::RefEntry>, Error> {
    let mut cursor = None;
    let mut entries = Vec::new();
    loop {
        let page = port
            .list_refs(repo, prefixes, cursor, 256)
            .map_err(crate::walk::git_error)?;
        entries.extend(page.entries);
        if page.complete {
            return Ok(entries);
        }
        cursor = Some(
            page.next_cursor
                .ok_or_else(|| invalid("missing ref continuation"))?,
        );
    }
}
