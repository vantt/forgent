//! Literal own-ref naming shared by seal, promote and synchronization.
use crate::{
    envelope::Scope,
    errors::{invalid, Error},
    layout::StreamId,
};
use fgos_git::RefName;
use fgos_identity::machine::valid_machine_id;
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
    Ok(list_with_head(port, repo, prefixes, 256)?.0)
}
/// `list` that also reports the HEAD the listing itself observed: the branch HEAD names with that
/// branch's listed value, when `refs/heads/` is among the prefixes. Each page's child reads HEAD once,
/// so a page's pair is one observation; HEAD marked on two pages differently (it moved between
/// pages) is ambiguous and reported as no observation, never as either.
pub(crate) fn list_with_head(
    port: &dyn fgos_git::Inspect,
    repo: &fgos_git::RepoHandle,
    prefixes: &[fgos_git::RefPrefix],
    page_size: usize,
) -> Result<(Vec<fgos_git::RefEntry>, Option<fgos_git::HeadFact>), Error> {
    let mut cursor = None;
    let mut entries = Vec::new();
    let mut seen: Vec<(fgos_git::RefName, fgos_git::Oid)> = Vec::new();
    loop {
        let page = port
            .list_refs(repo, prefixes, cursor, page_size)
            .map_err(crate::walk::git_error)?;
        if let Some(name) = page.head {
            if let Some(fgos_git::RefValue::Direct(commit)) = page
                .entries
                .iter()
                .find(|e| e.name == name)
                .map(|e| e.value.clone())
            {
                if !seen.contains(&(name.clone(), commit.clone())) {
                    seen.push((name, commit));
                }
            }
        }
        entries.extend(page.entries);
        if page.complete {
            let head = match seen.pop() {
                Some((target, commit)) if seen.is_empty() => {
                    Some(fgos_git::HeadFact::Attached { target, commit })
                }
                _ => None,
            };
            return Ok((entries, head));
        }
        cursor = Some(
            page.next_cursor
                .ok_or_else(|| invalid("missing ref continuation"))?,
        );
    }
}
