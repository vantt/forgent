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
    Ok(pages(port, repo, prefixes, 256, false)?.0)
}
const HEADS: &str = "refs/heads/";
/// Rows of one `for-each-ref` child for `list_with_head`. A repository with thousands of branches
/// pays for every row, so the listing is bounded and a HEAD past the bound is simply not observed.
const HEAD_LISTING_ROWS: usize = 1024;
/// `list` that also reports the HEAD the listing itself observed: the branch HEAD names, with that
/// branch's own listed value (HEAD is read once by the child; the row is read during iteration, so
/// the pair is coherent with the freshness of `resolve_head`). The branches are listed after the
/// `prefixes` (which all sort before `refs/heads/`): once a page reaches them the `prefixes` are
/// complete, so paging stops there and a HEAD branch beyond the page is `None`, the caller's cue to
/// use `resolve_head`.
pub(crate) fn list_with_head(
    port: &dyn fgos_git::Inspect,
    repo: &fgos_git::RepoHandle,
    prefixes: &[fgos_git::RefPrefix],
) -> Result<(Vec<fgos_git::RefEntry>, Option<fgos_git::HeadFact>), Error> {
    list_with_head_paged(port, repo, prefixes, HEAD_LISTING_ROWS)
}
fn list_with_head_paged(
    port: &dyn fgos_git::Inspect,
    repo: &fgos_git::RepoHandle,
    prefixes: &[fgos_git::RefPrefix],
    page_size: usize,
) -> Result<(Vec<fgos_git::RefEntry>, Option<fgos_git::HeadFact>), Error> {
    let mut all = prefixes.to_vec();
    all.push(fgos_git::RefPrefix::parse(HEADS).map_err(|e| invalid(e.to_string()))?);
    let (entries, head) = pages(port, repo, &all, page_size, prefixes.iter().all(|p| p.as_str() < HEADS))?;
    Ok((entries.into_iter().filter(|e| !e.name.as_str().starts_with(HEADS)).collect(), head))
}
fn pages(
    port: &dyn fgos_git::Inspect,
    repo: &fgos_git::RepoHandle,
    prefixes: &[fgos_git::RefPrefix],
    page_size: usize,
    stop_at_heads: bool,
) -> Result<(Vec<fgos_git::RefEntry>, Option<fgos_git::HeadFact>), Error> {
    let mut cursor = None;
    let mut entries = Vec::new();
    // Each page's child reads HEAD once; HEAD marked differently on two pages moved between them
    // and is no observation.
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
        let reached_heads = stop_at_heads
            && page
                .entries
                .last()
                .is_some_and(|e| e.name.as_str().starts_with(HEADS));
        entries.extend(page.entries);
        if page.complete || reached_heads {
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

#[cfg(test)]
mod tests {
    use fgos_git::{GitDriver, HeadFact, RefPrefix, RepoHandle, ResolveRepo};
    use std::{fs, os::unix::fs::PermissionsExt, path::Path, process::Command};

    fn git(p: &Path, args: &[&str]) {
        let ok = Command::new("git").arg("-C").arg(p).args(args).status().unwrap().success();
        assert!(ok, "{args:?}");
    }
    /// Branches `a`..`e` and one event ref; HEAD attached to `head`.
    fn repo(name: &str, head: &str) -> (std::path::PathBuf, GitDriver, RepoHandle) {
        let root = std::env::temp_dir().join(format!("es-refs-{name}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&root);
        fs::create_dir(&root).unwrap();
        fs::set_permissions(&root, fs::Permissions::from_mode(0o700)).unwrap();
        git(&root, &["init", "-q", "--initial-branch=a", "repo"]);
        let repo = root.join("repo");
        git(&repo, &["-c", "user.name=T", "-c", "user.email=t@example.invalid", "commit", "-q", "--allow-empty", "-m", "one"]);
        for b in ["b", "c", "d", "e"] {
            git(&repo, &["branch", b]);
        }
        git(&repo, &["update-ref", "refs/fgos/events/m1", "HEAD"]);
        git(&repo, &["symbolic-ref", "HEAD", &format!("refs/heads/{head}")]);
        let driver = GitDriver::new(&root).unwrap();
        let handle = match driver.resolve_repo(&repo, &repo).unwrap() {
            ResolveRepo::Repository(r) => r,
            _ => panic!(),
        };
        (root, driver, handle)
    }
    fn prefixes() -> Vec<RefPrefix> {
        vec![RefPrefix::parse("refs/fgos/events/").unwrap()]
    }

    #[test]
    fn a_branch_heavy_repository_stops_at_the_first_page_and_a_head_beyond_it_is_unobserved() {
        // A page of three rows holds the event ref and branches `a`, `b`; `c`..`e` do not fit.
        let (root, driver, handle) = repo("limit", "e");
        let (entries, head) = super::list_with_head_paged(&driver, &handle, &prefixes(), 3).unwrap();
        assert_eq!(entries.len(), 1, "the event refs are complete and branches are not tips");
        assert!(head.is_none(), "HEAD names a branch past the page: the caller must use resolve_head");
        git(&root.join("repo"), &["symbolic-ref", "HEAD", "refs/heads/b"]);
        let (_, head) = super::list_with_head_paged(&driver, &handle, &prefixes(), 3).unwrap();
        assert!(matches!(head, Some(HeadFact::Attached { target, .. }) if target.as_str() == "refs/heads/b"));
        let (_, head) = super::list_with_head(&driver, &handle, &prefixes()).unwrap();
        assert!(matches!(head, Some(HeadFact::Attached { target, .. }) if target.as_str() == "refs/heads/b"));
        let _ = fs::remove_dir_all(root);
    }
}
