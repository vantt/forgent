//! HEAD-only inventory and legacy publication. Git owns objects, refs and WAL.
use crate::{
    envelope::Seal,
    errors::{invalid, Error, ErrorCode},
    layout::{Layout, StreamId},
    legacy::{self, LegacyEvent},
    walk::{blob, git_error},
};
use fgos_git::*;
use serde::Serialize;
use std::collections::{BTreeMap, BTreeSet};
use std::result::Result;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Inventory {
    pub from_commit: Oid,
    /// Original tracked paths, including stale views/backups and attributes.
    pub files: BTreeMap<String, Vec<u8>>,
    pub porting_log: Option<String>,
    pub migrated: bool,
}
pub fn work_path(path: &str) -> bool {
    path == ".fgos/events.jsonl"
        || path
            .strip_prefix(".fgos/events/")
            .is_some_and(|p| !p.contains('/') && p.ends_with(".jsonl"))
}
pub fn porting_path(path: &str) -> bool {
    path == "porting/events.jsonl" || path.ends_with("/porting/events.jsonl")
}
pub fn retired_path(path: &str) -> bool {
    work_path(path)
        || path == ".fgos/state.json"
        || path.starts_with(".fgos/events.jsonl.backup-")
        || porting_path(path)
}
pub fn inventory(port: &dyn Inspect, repo: &RepoHandle) -> Result<Inventory, Error> {
    let from_commit = match port.resolve_head(repo).map_err(git_error)? {
        HeadFact::Attached { commit, .. } | HeadFact::Detached { commit } => commit,
        HeadFact::Unborn { .. } => return Err(invalid("migration requires a committed HEAD")),
    };
    let mut cursor = None;
    let mut entries = Vec::new();
    loop {
        let page = port
            .list_tree(repo, &from_commit, b"", cursor, 1024)
            .map_err(git_error)?;
        entries.extend(page.entries);
        if page.complete {
            break;
        }
        cursor = Some(
            page.next_cursor
                .ok_or_else(|| invalid("tree continuation missing"))?,
        );
    }
    let logs: BTreeSet<_> = entries
        .iter()
        .filter_map(|e| std::str::from_utf8(&e.path).ok())
        .filter(|p| porting_path(p))
        .map(str::to_owned)
        .collect();
    if logs.len() > 1 {
        return Err(invalid(
            "multiple porting directories; owner decision required",
        ));
    }
    let porting_log = logs.into_iter().next();
    let sibling = porting_log
        .as_ref()
        .map(|p| format!("{}state.json", p.strip_suffix("events.jsonl").unwrap()));
    let mut files = BTreeMap::new();
    let mut migrated = false;
    for entry in entries {
        let path =
            std::str::from_utf8(&entry.path).map_err(|_| invalid("non-UTF8 tracked path"))?;
        if path == ".fgos/events" && entry.kind == ObjectType::Blob {
            migrated = true;
        }
        if !(retired_path(path) || sibling.as_deref() == Some(path) || path == ".gitattributes") {
            continue;
        }
        if entry.kind != ObjectType::Blob || entry.mode != 0o100644 {
            return Err(invalid("legacy paths must be regular files"));
        }
        files.insert(
            path.into(),
            blob(port, repo, &from_commit, &entry.path)?
                .ok_or_else(|| invalid("legacy file disappeared"))?,
        );
    }
    Ok(Inventory {
        from_commit,
        files,
        porting_log,
        migrated,
    })
}
/// A dry run never writes objects. This same parser serves the imported reader.
pub fn events(inventory: &Inventory, streams: &[StreamId]) -> Result<Vec<LegacyEvent>, Error> {
    let mut work = Vec::new();
    let mut porting = Vec::new();
    for (path, bytes) in &inventory.files {
        let is_work = work_path(path);
        if !((is_work && streams.iter().any(|s| s.as_str() == "project"))
            || (porting_path(path) && streams.iter().any(|s| s.as_str() == "project:porting")))
        {
            continue;
        }
        let tag = if path == ".fgos/events.jsonl" {
            ""
        } else if is_work {
            path.rsplit('/').next().unwrap()
        } else {
            path
        };
        let mut parsed = legacy::parse_file(
            tag,
            std::str::from_utf8(bytes).map_err(|_| invalid("legacy UTF8"))?,
        )?;
        for e in &mut parsed {
            e.provenance.file = if is_work {
                path.strip_prefix(".fgos/").unwrap().into()
            } else {
                format!("porting/{path}")
            };
        }
        if is_work {
            work.extend(parsed);
        } else {
            porting.extend(parsed);
        }
    }
    // Porting's old reader folds physical log order, independently of Work.
    let mut result = legacy::order(work);
    result.extend(porting);
    Ok(result)
}
pub fn read_legacy_from_head(
    port: &dyn Inspect,
    repo: &RepoHandle,
    streams: &[StreamId],
) -> Result<Vec<LegacyEvent>, Error> {
    let authority = crate::fence::authority(port, repo)?;
    let mut result = events(&inventory(port, &authority)?, streams)?;
    for e in &mut result {
        if !e.provenance.file.starts_with("porting/") {
            e.provenance.file = format!(".fgos/{}", e.provenance.file);
        }
    }
    Ok(result)
}
fn tree(
    port: &dyn Publication,
    repo: &RepoHandle,
    files: &BTreeMap<String, Vec<u8>>,
) -> Result<Oid, Error> {
    fn level(
        port: &dyn Publication,
        repo: &RepoHandle,
        files: &BTreeMap<String, Vec<u8>>,
    ) -> Result<Oid, Error> {
        let mut dirs = BTreeMap::<String, BTreeMap<String, Vec<u8>>>::new();
        let mut entries = Vec::new();
        for (path, bytes) in files {
            if let Some((dir, rest)) = path.split_once('/') {
                dirs.entry(dir.into())
                    .or_default()
                    .insert(rest.into(), bytes.clone());
            } else {
                entries.push(TreeEntry {
                    name: path.as_bytes().to_vec(),
                    mode: 0o100644,
                    oid: port.write_blob(repo, bytes).map_err(git_error)?,
                });
            }
        }
        for (name, children) in dirs {
            entries.push(TreeEntry {
                name: name.into_bytes(),
                mode: 0o040000,
                oid: level(port, repo, &children)?,
            });
        }
        port.write_tree(repo, &entries).map_err(git_error)
    }
    level(port, repo, files)
}
/// Authenticate the complete data tree (the legacy commit tree sans seal.json).
pub fn verify_legacy_tree(port: &dyn Inspect, repo: &RepoHandle, oid: &Oid) -> Result<(), Error> {
    let expected = match crate::walk::header(port, repo, oid)? {
        Seal::Legacy {
            tree_of_fgos_events,
            ..
        } => Oid::parse(&tree_of_fgos_events, repo.object_format())
            .map_err(|e| invalid(e.to_string()))?,
        _ => return Err(invalid("expected legacy seal")),
    };
    let entries =
        |oid: &Oid, strip_seal: bool| -> Result<BTreeMap<Vec<u8>, (u32, String)>, Error> {
            let mut out = BTreeMap::new();
            for e in all_entries(port, repo, oid)? {
                let p = std::str::from_utf8(&e.path).map_err(|_| invalid("legacy path UTF8"))?;
                if strip_seal && p == "seal.json" {
                    continue;
                }
                let directory = e.mode == 0o040000
                    && e.kind == ObjectType::Tree
                    && (p == "events"
                        || p == "porting"
                        || crate::export::allowed(&format!("{p}/events.jsonl")));
                if !directory
                    && (e.mode != 0o100644
                        || e.kind != ObjectType::Blob
                        || p == "seal.json"
                        || !crate::export::allowed(p))
                {
                    return Err(invalid("unsafe legacy tree entry"));
                }
                out.insert(e.path, (e.mode, e.oid.as_str().into()));
            }
            Ok(out)
        };
    // Top directory OIDs also change if they contain an unrelated extra blob.
    if entries(oid, true)? != entries(&expected, false)? {
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
            .list_tree(repo, oid, b"", cursor, 1024)
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
/// Publication runs under event-seal and drops that description before returning.
pub fn import_legacy(
    driver: &GitDriver,
    repo: &RepoHandle,
    layout: &Layout,
    expected_head: &str,
    held_ranks: &[u32],
    depth: u32,
) -> Result<serde_json::Value, Error> {
    if repo.git_dir() != repo.common_dir() || repo.common_dir() != layout.common_dir {
        return Err(invalid(
            "migration requires matching main checkout and layout",
        ));
    }
    let mut guard = crate::locks::acquire_seal(layout, held_ranks, depth, false)?
        .ok_or_else(|| invalid("seal lock unavailable"))?;
    let inv = inventory(driver, repo)?;
    if inv.from_commit.as_str() != expected_head || inv.migrated {
        return Err(invalid("migration HEAD changed"));
    }
    ensure_clean(driver, repo, &inv)?;
    events(
        &inv,
        &[
            StreamId::parse("project")?,
            StreamId::parse("project:porting")?,
        ],
    )?;
    let authority = HolderAuthority::legacy_import(
        repo,
        &mut guard.handle,
        &layout.seal_lock(),
        "event-store-migrate",
    )
    .map_err(git_error)?;
    let port = PublicationPort::new(driver, authority);
    let mut files = BTreeMap::new();
    for (path, bytes) in &inv.files {
        if work_path(path) {
            files.insert(path.strip_prefix(".fgos/").unwrap().into(), bytes.clone());
        } else if porting_path(path) {
            files.insert(format!("porting/{path}"), bytes.clone());
        }
    }
    if files.keys().any(|p| !crate::export::allowed(p)) {
        return Err(invalid("unsafe legacy import path"));
    }
    let data_tree = tree(&port, repo, &files)?;
    let seal = Seal::Legacy {
        from_commit: inv.from_commit.as_str().into(),
        tree_of_fgos_events: data_tree.as_str().into(),
    };
    files.insert("seal.json".into(), seal.canonical_line()?);
    let tree = tree(&port, repo, &files)?;
    let oid = crate::publish::event_commit(
        &port,
        repo,
        tree,
        vec![],
        0,
        b"fgos-events legacy import".to_vec(),
    )?;
    let reference = RefName::parse("refs/fgos/legacy").map_err(|e| invalid(e.to_string()))?;
    match port.read_ref(repo, &reference).map_err(git_error)? {
        RefValue::Absent => {
            let operation_id = crate::seal::operation_id()?;
            port.compare_and_swap(
                repo,
                &reference,
                &ExpectedTip::Absent,
                &ExpectedTip::Oid(oid.clone()),
                &operation_id,
            )
            .map_err(git_error)?;
            port.release_pin_and_compact(repo, &operation_id)
                .map_err(git_error)?;
        }
        RefValue::Direct(old) if old == oid => {}
        _ => {
            return Err(Error::new(
                ErrorCode::EventStoreLegacyMismatch,
                "existing legacy ref differs from computed import",
            ))
        }
    }
    Ok(
        serde_json::json!({"legacyRefOid":oid.as_str(),"sealDigest":seal.digest()?,"fromCommit":inv.from_commit.as_str()}),
    )
}
pub fn ensure_clean(driver: &GitDriver, repo: &RepoHandle, inv: &Inventory) -> Result<(), Error> {
    let mut cursor = None;
    loop {
        let page = driver
            .status(repo, Untracked::All, cursor, 1024)
            .map_err(git_error)?;
        for e in page.entries {
            let p = std::str::from_utf8(&e.path).map_err(|_| invalid("status path UTF8"))?;
            if retired_path(p)
                || inv.files.contains_key(p)
                || p == ".fgos/events"
                || p.starts_with(".fgos/events/")
            {
                return Err(invalid(format!("dirty or untracked migration path: {p}")));
            }
        }
        if page.complete {
            return Ok(());
        }
        cursor = Some(
            page.next_cursor
                .ok_or_else(|| invalid("status continuation missing"))?,
        );
    }
}

/// Pre-gate admission, memoized by the facade's prepared store. Never called
/// from append's hot section. Stop-everything migration ends old processes.
pub fn write_readiness(driver: &GitDriver, repo: &RepoHandle, remote: &str) -> Result<(), Error> {
    let authority = crate::fence::authority(driver, repo)?;
    let repo = &authority;
    if matches!(
        driver.resolve_head(repo).map_err(git_error)?,
        HeadFact::Unborn { .. }
    ) {
        return Ok(());
    }
    let inv = inventory(driver, repo)?;
    if !inv.migrated {
        if inv.files.keys().any(|p| retired_path(p)) {
            return Err(Error::new(
                ErrorCode::EventStoreMigrationRequired,
                "run fgos events migrate in the main checkout with writers stopped",
            ));
        }
        return Ok(());
    }
    let pin = crate::fence::pinned_legacy(driver, repo)
        .map_err(|e| {
            Error::new(
                ErrorCode::EventStoreRefspecMissing,
                format!("fetch the pinned legacy ref: {e}"),
            )
        })?
        .ok_or_else(|| invalid("fence missing"))?;
    let prefixes = [RefPrefix::parse("refs/fgos/").map_err(|e| invalid(e.to_string()))?];
    let refs = crate::refs::list(driver, repo, &prefixes)?;
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

/// Read-only dormant doctor body. Registry activation belongs to phase 09.
pub fn legacy_layout(driver: &GitDriver, repo: &RepoHandle) -> Result<serde_json::Value, Error> {
    let authority = crate::fence::authority(driver, repo)?;
    let repo = &authority;
    let inv = inventory(driver, repo)?;
    let mut problems: Vec<String> = inv
        .files
        .keys()
        .filter(|p| p.as_str() != ".gitattributes")
        .cloned()
        .collect();
    if std::fs::symlink_metadata(repo.trusted_main_root().join(".fgos/events"))
        .is_ok_and(|m| m.is_dir())
    {
        problems.push(".fgos/events is a directory".into());
    }
    if inv.files.get(".gitattributes").is_some_and(|b| {
        String::from_utf8_lossy(b).lines().any(|l| {
            !l.trim_start().starts_with('#')
                && l.contains("events")
                && l.split_whitespace().any(|s| s == "merge=union")
        })
    }) {
        problems.push("events merge=union attribute".into());
    }
    match crate::fence::pinned_legacy(driver, repo)? {
        Some(pin) => {
            verify_legacy_tree(driver, repo, &pin)?;
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
                            .is_some_and(|s| {
                                crate::read::mirror_suffix(s).ok().flatten() == Some("legacy")
                            })
                })
                .collect();
            if refs.is_empty()
                || refs
                    .iter()
                    .any(|r| !matches!(&r.value,RefValue::Direct(o) if *o==pin))
            {
                problems.push("legacy ref missing or differs from fence".into());
            }
        }
        None => problems.push("tracked legacy fence missing".into()),
    }
    Ok(serde_json::json!({"passed":problems.is_empty(),"problems":problems}))
}
