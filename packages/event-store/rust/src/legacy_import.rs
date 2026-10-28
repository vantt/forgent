//! The tracked legacy fence: admission of writes against it and authentication
//! of the sealed legacy tree it pins. Git owns objects, refs and the WAL.
use crate::{
    envelope::Seal,
    errors::{invalid, Error, ErrorCode},
    walk::git_error,
};
use fgos_git::*;
use std::collections::BTreeMap;
use std::result::Result;

/// The id Git gives a tree of these entries, computed without writing the object.
fn hashed_tree(driver: &GitDriver, repo: &RepoHandle, entries: &[TreeEntry]) -> Result<Oid, Error> {
    let mut entries: Vec<_> = entries.iter().collect();
    entries.sort_by_key(|e| {
        let mut key = e.name.clone();
        if e.mode == 0o040000 {
            key.push(b'/');
        }
        key
    });
    let mut bytes = Vec::new();
    for e in entries {
        bytes.extend_from_slice(format!("{:o} ", e.mode).as_bytes());
        bytes.extend_from_slice(&e.name);
        bytes.push(0);
        for pair in e.oid.as_str().as_bytes().as_chunks::<2>().0 {
            bytes.push(u8::from_str_radix(std::str::from_utf8(pair).unwrap(), 16).unwrap());
        }
    }
    driver
        .hash_object(repo, ObjectType::Tree, &bytes)
        .map_err(git_error)
}
/// The id of the tree these full-path blobs form, nested by directory, without writing objects.
fn nested_tree(
    driver: &GitDriver,
    repo: &RepoHandle,
    blobs: &BTreeMap<Vec<u8>, Oid>,
) -> Result<Oid, Error> {
    let mut dirs = BTreeMap::<Vec<u8>, BTreeMap<Vec<u8>, Oid>>::new();
    let mut entries = Vec::new();
    for (path, oid) in blobs {
        match path.iter().position(|b| *b == b'/') {
            Some(i) => {
                dirs.entry(path[..i].to_vec())
                    .or_default()
                    .insert(path[i + 1..].to_vec(), oid.clone());
            }
            None => entries.push(TreeEntry {
                name: path.clone(),
                mode: 0o100644,
                oid: oid.clone(),
            }),
        }
    }
    for (name, children) in dirs {
        entries.push(TreeEntry {
            name,
            mode: 0o040000,
            oid: nested_tree(driver, repo, &children)?,
        });
    }
    hashed_tree(driver, repo, &entries)
}
/// Authenticate the complete data tree (the legacy commit tree sans seal.json).
pub fn verify_legacy_tree(driver: &GitDriver, repo: &RepoHandle, oid: &Oid) -> Result<(), Error> {
    let expected = match crate::walk::header(driver, repo, oid)? {
        Seal::Legacy {
            tree_of_fgos_events,
            ..
        } => Oid::parse(&tree_of_fgos_events, repo.object_format())
            .map_err(|e| invalid(e.to_string()))?,
        _ => return Err(invalid("expected legacy seal")),
    };
    // The listing is recursive: blobs carry full paths, directories appear as their own rows.
    let mut blobs = BTreeMap::new();
    for e in all_entries(driver, repo, oid)? {
        let p = std::str::from_utf8(&e.path).map_err(|_| invalid("legacy path UTF8"))?;
        if p == "seal.json" {
            continue;
        }
        let directory = e.mode == 0o040000
            && e.kind == ObjectType::Tree
            && (p == "events"
                || p == "porting"
                || crate::export::allowed(&format!("{p}/events.jsonl")));
        if directory {
            continue;
        }
        if e.mode != 0o100644 || e.kind != ObjectType::Blob || !crate::export::allowed(p) {
            return Err(invalid("unsafe legacy tree entry"));
        }
        blobs.insert(e.path, e.oid);
    }
    // The seal names the data tree by id only: that tree object exists only in the clone that ran
    // the import, so every other clone recomputes the id from the published commit's own entries.
    // Top directory ids also change if they contain an unrelated extra blob.
    if nested_tree(driver, repo, &blobs)? != expected {
        return Err(invalid("legacy tree differs from seal.treeOfFgosEvents"));
    }
    Ok(())
}
pub(crate) fn all_entries(
    port: &dyn Inspect,
    repo: &RepoHandle,
    oid: &Oid,
) -> Result<Vec<ListedTreeEntry>, Error> {
    let mut out = Vec::new();
    let mut cursor = None;
    loop {
        let p = port
            .list_tree(repo, oid, b"", cursor, 100_000)
            .map_err(git_error)?;
        out.extend(p.entries);
        if p.complete {
            return Ok(out);
        }
        cursor = Some(
            p.next_cursor
                .ok_or_else(|| invalid("tree continuation missing"))?,
        );
    }
}

/// Pre-gate admission, memoized by the facade's prepared store. Never called
/// from append's hot section. A store whose HEAD carries no fence has no
/// legacy history to pin and is admitted.
pub fn write_readiness(driver: &GitDriver, repo: &RepoHandle, remote: &str) -> Result<(), Error> {
    let authority = crate::fence::authority(driver, repo)?;
    let repo = &authority;
    // One listing answers the whole admission: the legacy refs and, for an attached HEAD within the
    // listing, HEAD itself; otherwise HEAD is observed separately.
    let prefix = |p| RefPrefix::parse(p).map_err(|e| invalid(e.to_string()));
    let prefixes = [prefix("refs/fgos/legacy")?, prefix("refs/fgos/remotes/")?];
    let (listed, listed_head) = crate::refs::list_with_head(driver, repo, &prefixes)?;
    let head = match listed_head {
        Some(head) => head,
        None => driver.resolve_head(repo).map_err(git_error)?,
    };
    let Some(pin) = crate::fence::pinned_at_head(driver, repo, &head).map_err(|e| {
        Error::new(
            ErrorCode::EventStoreRefspecMissing,
            format!("fetch the pinned legacy ref: {e}"),
        )
    })?
    else {
        return Ok(());
    };
    let refs: Vec<_> = listed
        .iter()
        .filter(|e| {
            e.name.as_str() == "refs/fgos/legacy"
                || e.name
                    .as_str()
                    .strip_prefix("refs/fgos/remotes/")
                    .is_some_and(|s| crate::read::mirror_suffix(s).ok().flatten() == Some("legacy"))
        })
        .collect();
    if refs.is_empty()
        || refs
            .iter()
            .any(|r| !matches!(&r.value,RefValue::Direct(o) if *o==pin))
    {
        return Err(Error::new(
            ErrorCode::EventStoreRefspecMissing,
            "run setup and fetch the pinned legacy ref",
        ));
    }
    // A local-only repository has no mapping to install. Configured publication
    // remotes must have Git's fetch mapping provenance before any writes.
    match driver.remote_url(repo, remote) {
        Ok(_) => {
            crate::refspec::pinned_url(driver, repo, remote)?;
        }
        Err(e)
            if e.stderr
                .windows(b"No such remote".len())
                .any(|s| s == b"No such remote") => {}
        Err(e) => return Err(git_error(e)),
    }
    Ok(())
}


/// Read-only doctor body: the tracked fence, the legacy refs and the sealed tree they name must agree.
pub fn legacy_layout(driver: &GitDriver, repo: &RepoHandle) -> Result<serde_json::Value, Error> {
    let authority = crate::fence::authority(driver, repo)?;
    let repo = &authority;
    let head = driver.resolve_head(repo).map_err(git_error)?;
    let pin = match crate::fence::pinned_at_head(driver, repo, &head) {
        Ok(Some(pin)) => pin,
        Ok(None) => return Ok(serde_json::json!({"passed":true,"problems":[]})),
        Err(e) => {
            return Ok(serde_json::json!({"passed":false,"problems":[format!("legacy ref missing or differs from fence: {e}")]}))
        }
    };
    let mut problems: Vec<String> = Vec::new();
    if verify_legacy_tree(driver, repo, &pin).is_err() {
        problems.push("legacy ref missing or differs from fence".into());
    }
    let refs = crate::refs::list(
        driver,
        repo,
        &[RefPrefix::parse("refs/fgos/").map_err(|e| invalid(e.to_string()))?],
    )?;
    let refs: Vec<_> = refs
        .iter()
        .filter(|e| {
            e.name.as_str() == "refs/fgos/legacy"
                || e.name
                    .as_str()
                    .strip_prefix("refs/fgos/remotes/")
                    .is_some_and(|s| crate::read::mirror_suffix(s).ok().flatten() == Some("legacy"))
        })
        .collect();
    if refs.is_empty()
        || refs
            .iter()
            .any(|r| !matches!(&r.value,RefValue::Direct(o) if *o==pin))
    {
        problems.push("legacy ref missing or differs from fence".into());
    }
    Ok(serde_json::json!({"passed":problems.is_empty(),"problems":problems}))
}
