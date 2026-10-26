//! HEAD-only inventory and legacy publication. Git owns objects, refs and WAL.
use crate::{
    commit_memo::CommitMemo,
    envelope::Seal,
    errors::{invalid, Error, ErrorCode},
    layout::{Layout, StreamId},
    legacy::{self, LegacyEvent},
    walk::{blobs, git_error},
};
use fgos_git::*;
use serde::Serialize;
use std::collections::{BTreeMap, BTreeSet};
use std::result::Result;

#[derive(Debug, Clone, Serialize)]
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
    inventory_roots(port, repo, &[b""])
}
/// The existing pre-migration consumer roots; broad porting discovery belongs
/// to migrate/doctor, never the routine admission/read path.
fn consumer_inventory(
    port: &dyn Inspect,
    repo: &RepoHandle,
    head: &HeadFact,
    legacy_refs: &[RefEntry],
) -> Result<Inventory, Error> {
    let from_commit = committed_head(head)?;
    let hint = legacy_refs.iter().find_map(|r| {
        if r.name.as_str() == "refs/fgos/legacy" {
            if let RefValue::Direct(oid) = &r.value {
                return Some(oid);
            }
        }
        None
    });
    consumer_inventory_at(port, repo, from_commit, hint)
}
fn consumer_inventory_at(
    port: &dyn Inspect,
    repo: &RepoHandle,
    from_commit: &Oid,
    hint: Option<&Oid>,
) -> Result<Inventory, Error> {
    let mut roots = vec![
        b".fgos/".to_vec(),
        b"docs/distillery/state/porting/".to_vec(),
        b"porting/".to_vec(),
    ];
    // An import is a discovery hint only; all event bytes come from this HEAD.
    if let Some(oid) = hint {
        if matches!(
            crate::walk::header(port, repo, oid),
            Ok(Seal::Legacy { .. })
        ) {
            if let Ok(entries) = all_entries(port, repo, oid) {
                for e in entries {
                    if let Ok(path) = std::str::from_utf8(&e.path) {
                        if let Some(original) =
                            path.strip_prefix("porting/").filter(|p| porting_path(p))
                        {
                            if let Some((dir, _)) = original.rsplit_once('/') {
                                roots.push(format!("{dir}/").into_bytes());
                            }
                        }
                    }
                }
            }
        }
    }
    roots.sort();
    roots.dedup();
    inventory_roots_at(
        port,
        repo,
        from_commit,
        &roots.iter().map(Vec::as_slice).collect::<Vec<_>>(),
    )
}
fn inventory_roots(
    port: &dyn Inspect,
    repo: &RepoHandle,
    roots: &[&[u8]],
) -> Result<Inventory, Error> {
    let head = port.resolve_head(repo).map_err(git_error)?;
    inventory_roots_at(port, repo, committed_head(&head)?, roots)
}
fn committed_head(head: &HeadFact) -> Result<&Oid, Error> {
    match head {
        HeadFact::Attached { commit, .. } | HeadFact::Detached { commit } => Ok(commit),
        HeadFact::Unborn { .. } => Err(invalid("migration requires a committed HEAD")),
    }
}
/// The tracked legacy files of one commit never change, so every read and
/// admission of a process shares one inventory per commit and root set.
static INVENTORIES: CommitMemo<Inventory> = CommitMemo::new();

fn inventory_roots_at(
    port: &dyn Inspect,
    repo: &RepoHandle,
    from_commit: &Oid,
    roots: &[&[u8]],
) -> Result<Inventory, Error> {
    let question = roots.join(&0u8);
    INVENTORIES.get_or_compute(repo, from_commit, &question, || {
        read_inventory_roots_at(port, repo, from_commit, roots)
    })
}
/// The directory roots the commit does not track, answered by one Git read of
/// all of them: listing a missing directory costs several Git processes to
/// learn it is empty. Anything but a plain "absent" answer (a present path, an
/// error of any kind) leaves the root to the listing, which owns the answer.
fn absent_roots<'a>(
    port: &dyn Inspect,
    repo: &RepoHandle,
    from_commit: &Oid,
    roots: &[&'a [u8]],
) -> BTreeSet<&'a [u8]> {
    let probed: Vec<(&[u8], Vec<u8>)> = roots
        .iter()
        .filter_map(|root| Some((*root, root.strip_suffix(b"/")?.to_vec())))
        .filter(|(_, path)| !path.is_empty())
        .collect();
    if probed.is_empty() {
        return BTreeSet::new();
    }
    let paths: Vec<_> = probed.iter().map(|(_, path)| path.clone()).collect();
    let Ok(reads) = port.read_paths_at(repo, from_commit, &paths, 1) else {
        return BTreeSet::new();
    };
    probed
        .iter()
        .zip(reads)
        .filter(|(_, read)| matches!(read.value, PathValue::Absent))
        .map(|((root, _), _)| *root)
        .collect()
}
fn read_inventory_roots_at(
    port: &dyn Inspect,
    repo: &RepoHandle,
    from_commit: &Oid,
    roots: &[&[u8]],
) -> Result<Inventory, Error> {
    let mut entries = Vec::new();
    let absent = absent_roots(port, repo, from_commit, roots);
    for root in roots.iter().filter(|root| !absent.contains(*root)) {
        let mut cursor = None;
        loop {
            let page = port
                .list_tree(repo, from_commit, root, cursor, 100_000)
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
    let mut migrated = false;
    let mut wanted = Vec::new();
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
        wanted.push(entry.path);
    }
    // One Git process reads every legacy file of the commit, however many.
    let mut files = BTreeMap::new();
    for (path, bytes) in wanted.iter().zip(blobs(port, repo, from_commit, &wanted)?) {
        files.insert(
            std::str::from_utf8(path)
                .map_err(|_| invalid("non-UTF8 tracked path"))?
                .to_owned(),
            bytes.ok_or_else(|| invalid("legacy file disappeared"))?,
        );
    }
    Ok(Inventory {
        from_commit: from_commit.clone(),
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
pub(crate) fn read_consumer_at(
    port: &dyn Inspect,
    repo: &RepoHandle,
    streams: &[StreamId],
    head: &HeadFact,
    hint: Option<&Oid>,
) -> Result<Vec<LegacyEvent>, Error> {
    let mut result = events(
        &consumer_inventory_at(port, repo, committed_head(head)?, hint)?,
        streams,
    )?;
    for e in &mut result {
        if !e.provenance.file.starts_with("porting/") {
            e.provenance.file = format!(".fgos/{}", e.provenance.file);
        }
    }
    Ok(result)
}

fn tree(
    files: &BTreeMap<String, Vec<u8>>,
    blob: &impl Fn(&[u8]) -> Result<Oid, Error>,
    build: &impl Fn(&[TreeEntry]) -> Result<Oid, Error>,
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
                oid: blob(bytes)?,
            });
        }
    }
    for (name, children) in dirs {
        entries.push(TreeEntry {
            name: name.into_bytes(),
            mode: 0o040000,
            oid: tree(&children, blob, build)?,
        });
    }
    build(&entries)
}
fn import_files(inv: &Inventory) -> BTreeMap<String, Vec<u8>> {
    inv.files
        .iter()
        .filter_map(|(path, bytes)| {
            if work_path(path) {
                Some((path.strip_prefix(".fgos/").unwrap().into(), bytes.clone()))
            } else if porting_path(path) {
                Some((format!("porting/{path}"), bytes.clone()))
            } else {
                None
            }
        })
        .collect()
}
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
/// Compute migration identities without installing Git objects or changing refs.
pub fn import_identity(
    driver: &GitDriver,
    repo: &RepoHandle,
    inv: &Inventory,
) -> Result<(Oid, Oid), Error> {
    let hash_tree = |files: &BTreeMap<String, Vec<u8>>| {
        tree(
            files,
            &|bytes| {
                driver
                    .hash_object(repo, ObjectType::Blob, bytes)
                    .map_err(git_error)
            },
            &|entries| hashed_tree(driver, repo, entries),
        )
    };
    let mut files = import_files(inv);
    let data_tree = hash_tree(&files)?;
    files.insert(
        "seal.json".into(),
        Seal::Legacy {
            from_commit: inv.from_commit.as_str().into(),
            tree_of_fgos_events: data_tree.as_str().into(),
        }
        .canonical_line()?,
    );
    let root = hash_tree(&files)?;
    let input =
        crate::publish::event_commit_input(root, vec![], 0, b"fgos-events legacy import".to_vec());
    let mut bytes = format!(
        "tree {}\nauthor {} <{}> {}\ncommitter {} <{}> {}\n\n",
        input.tree.as_str(),
        input.author.name,
        input.author.email,
        input.author_date,
        input.committer.name,
        input.committer.email,
        input.committer_date
    )
    .into_bytes();
    bytes.extend_from_slice(&input.message);
    let commit = driver
        .hash_object(repo, ObjectType::Commit, &bytes)
        .map_err(git_error)?;
    Ok((data_tree, commit))
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
pub fn legacy_mirrors(port: &dyn Inspect, repo: &RepoHandle) -> Result<Vec<RefEntry>, Error> {
    Ok(crate::refs::list(
        port,
        repo,
        &[RefPrefix::parse("refs/fgos/remotes/").map_err(|e| invalid(e.to_string()))?],
    )?
    .into_iter()
    .filter(|r| {
        r.name
            .as_str()
            .strip_prefix("refs/fgos/remotes/")
            .is_some_and(|s| crate::read::mirror_suffix(s).ok().flatten() == Some("legacy"))
    })
    .collect())
}

/// Check all mirror observations before any local ref mutation. A matching
/// local/mirror pair is a published import, even if HEAD's fence was reverted.
fn validate_legacy_refs(
    port: &dyn Inspect,
    repo: &RepoHandle,
    computed: &Oid,
    observed: &RefValue,
) -> Result<(), Error> {
    for r in legacy_mirrors(port, repo)? {
        if !matches!(&r.value, RefValue::Direct(value) if value == computed) || observed == &r.value
        {
            return Err(Error::new(ErrorCode::EventStoreLegacyMismatch,
                "published legacy refs disagree with HEAD import or local import is published; pull the fenced main; if main has no fence because cutover was reverted after the ref was pushed, the remote legacy ref needs an owner decision"));
        }
    }
    Ok(())
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
    let mut files = import_files(&inv);
    if files.keys().any(|p| !crate::export::allowed(p)) {
        return Err(invalid("unsafe legacy import path"));
    }
    let data_tree = tree(
        &files,
        &|bytes| port.write_blob(repo, bytes).map_err(git_error),
        &|entries| port.write_tree(repo, entries).map_err(git_error),
    )?;
    let seal = Seal::Legacy {
        from_commit: inv.from_commit.as_str().into(),
        tree_of_fgos_events: data_tree.as_str().into(),
    };
    files.insert("seal.json".into(), seal.canonical_line()?);
    let tree = tree(
        &files,
        &|bytes| port.write_blob(repo, bytes).map_err(git_error),
        &|entries| port.write_tree(repo, entries).map_err(git_error),
    )?;
    let oid = crate::publish::event_commit(
        &port,
        repo,
        tree,
        vec![],
        0,
        b"fgos-events legacy import".to_vec(),
    )?;
    let reference = RefName::parse("refs/fgos/legacy").map_err(|e| invalid(e.to_string()))?;
    // Recovery itself can settle ref writes: reject published conflicts before
    // entering it, then authenticate its final observations before our CAS.
    let before_recovery = port.read_ref(repo, &reference).map_err(git_error)?;
    validate_legacy_refs(driver, repo, &oid, &before_recovery)?;
    port.recover_publications(repo).map_err(git_error)?;
    let observed = port.read_ref(repo, &reference).map_err(git_error)?;
    validate_legacy_refs(driver, repo, &oid, &observed)?;
    let operation_id = cutover_operation_id(repo, inv.from_commit.as_str())?;
    match observed {
        observed @ (RefValue::Absent | RefValue::Direct(_))
            if observed != RefValue::Direct(oid.clone()) =>
        {
            let operation_id = crate::seal::operation_id()?;
            port.compare_and_swap(
                repo,
                &reference,
                &match observed {
                    RefValue::Direct(old) => ExpectedTip::Oid(old),
                    _ => ExpectedTip::Absent,
                },
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
    // Authenticate the published bytes and every local/mirror observation.
    verify_legacy_tree(driver, repo, &oid)?;
    let refs = crate::refs::list(
        driver,
        repo,
        &[RefPrefix::parse("refs/fgos/").map_err(|e| invalid(e.to_string()))?],
    )?;
    for r in refs.iter().filter(|r| {
        r.name.as_str() == "refs/fgos/legacy"
            || r.name
                .as_str()
                .strip_prefix("refs/fgos/remotes/")
                .is_some_and(|s| crate::read::mirror_suffix(s).ok().flatten() == Some("legacy"))
    }) {
        if !matches!(&r.value, RefValue::Direct(value) if value == &oid) {
            return Err(Error::new(
                ErrorCode::EventStoreLegacyMismatch,
                "published legacy refs disagree with HEAD import",
            ));
        }
    }
    Ok(
        serde_json::json!({"legacyRefOid":oid.as_str(),"sealDigest":seal.digest()?,"fromCommit":inv.from_commit.as_str(),"operationId":operation_id}),
    )
}
/// Refuses dirty or untracked migration inputs and a fence the checkout's
/// ignore rules would keep out of the cutover commit. Returns the untracked
/// legacy files that are empty: they hold no history, so they count as absent.
pub fn ensure_clean(driver: &GitDriver, repo: &RepoHandle, inv: &Inventory) -> Result<Vec<String>, Error> {
    if !driver
        .ignored_paths(repo, &[b".fgos/events".to_vec()])
        .map_err(git_error)?
        .is_empty()
    {
        return Err(Error::new(
            ErrorCode::EventStoreMigrationFenceIgnored,
            "the ignore rules exclude .fgos/events, so the cutover commit cannot track the fence; re-include it (for example `!/.fgos/events` in .gitignore) and migrate again",
        ));
    }
    let mut empty = vec![];
    let mut cursor = None;
    loop {
        let page = driver
            .status(
                repo,
                Untracked::All,
                Submodules::Configured,
                Ignored::Excluded,
                cursor,
                4096,
            )
            .map_err(git_error)?;
        for e in page.entries {
            let p = std::str::from_utf8(&e.path).map_err(|_| invalid("status path UTF8"))?;
            if e.untracked
                && retired_path(p)
                && std::fs::symlink_metadata(repo.trusted_main_root().join(p))
                    .is_ok_and(|m| m.is_file() && m.len() == 0)
            {
                empty.push(p.to_owned());
                continue;
            }
            if retired_path(p)
                || inv.files.contains_key(p)
                || p == ".fgos/events"
                || p.starts_with(".fgos/events/")
            {
                return Err(invalid(format!("dirty or untracked migration path: {p}")));
            }
        }
        if page.complete {
            return Ok(empty);
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
    // One listing answers the whole admission: the legacy refs and, for an attached HEAD within the
    // listing, HEAD itself; otherwise HEAD is observed separately.
    let prefix = |p| RefPrefix::parse(p).map_err(|e| invalid(e.to_string()));
    let prefixes = [prefix("refs/fgos/legacy")?, prefix("refs/fgos/remotes/")?];
    let (listed, listed_head) = crate::refs::list_with_head(driver, repo, &prefixes)?;
    let head = match listed_head {
        Some(head) => head,
        None => driver.resolve_head(repo).map_err(git_error)?,
    };
    if matches!(head, HeadFact::Unborn { .. }) {
        return Ok(());
    }
    let inv = consumer_inventory(driver, repo, &head, &listed)?;
    if !inv.migrated {
        if inv.files.keys().any(|p| retired_path(p)) {
            return Err(Error::new(
                ErrorCode::EventStoreMigrationRequired,
                "run fgos events migrate in the main checkout with writers stopped",
            ));
        }
        return Ok(());
    }
    let pin = crate::fence::pinned_at_head(driver, repo, &head)
        .map_err(|e| {
            Error::new(
                ErrorCode::EventStoreRefspecMissing,
                format!("fetch the pinned legacy ref: {e}"),
            )
        })?
        .ok_or_else(|| invalid("fence missing"))?;
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

/// Read-only dormant doctor body. Registry activation belongs to phase 09.
pub fn legacy_layout(driver: &GitDriver, repo: &RepoHandle) -> Result<serde_json::Value, Error> {
    let authority = crate::fence::authority(driver, repo)?;
    let repo = &authority;
    if matches!(
        driver.resolve_head(repo).map_err(git_error)?,
        HeadFact::Unborn { .. }
    ) {
        return Ok(serde_json::json!({"passed":true,"problems":[],"warning":null}));
    }
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
                && l.split_whitespace().next().is_some_and(event_attribute)
                && l.split_whitespace().any(|s| s == "merge=union")
        })
    }) {
        problems.push("events merge=union attribute".into());
    }
    if !inv.migrated {
        return Ok(
            serde_json::json!({"passed":true,"problems":[],"warning": if problems.is_empty() { None } else { Some("event-store-migration-required: run fgos events migrate in the main checkout with writers stopped") }}),
        );
    }
    match crate::fence::pinned_legacy(driver, repo) {
        Ok(Some(pin)) => {
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
        Ok(None) => problems.push("tracked legacy fence missing".into()),
        Err(e) => problems.push(format!("legacy ref missing or differs from fence: {e}")),
    }
    Ok(serde_json::json!({"passed":problems.is_empty(),"problems":problems}))
}

/// Patterns historically owned by the event log merge rule.
pub fn event_attribute(pattern: &str) -> bool {
    matches!(
        pattern.trim_start_matches('/'),
        ".fgos/events.jsonl" | ".fgos/events*.jsonl" | ".fgos/events/*.jsonl" | ".fgos/events/**"
    )
}

/// Inspect retained receipts before selecting a new cutover attempt. Uncertain
/// attempts keep their id so ScopedCommit's recovery refusal remains binding.
fn cutover_operation_id(repo: &RepoHandle, head: &str) -> Result<String, Error> {
    let prefix = format!("event-store-cutover-{}", &head[..32]);
    if !repo.common_dir().join("fgos/git").exists() {
        return Ok(format!("{prefix}-1"));
    }
    let wal = fgos_git::wal::Wal::open_existing(repo.common_dir(), fgos_git::wal::OsFileSystem)
        .map_err(|e| invalid(e.to_string()))?;
    for attempt in 1..=100_000 {
        let id = format!("{prefix}-{attempt}");
        let outcome =
            if let Some(receipt) = wal.compacted(&id).map_err(|e| invalid(e.to_string()))? {
                Some(receipt.outcome().map_err(|e| invalid(e.to_string()))?)
            } else if !wal.known_id(&id).map_err(|e| invalid(e.to_string()))? {
                // Free, or a directory that never received record zero: a crash or
                // refusal between mkdir and the intent left nothing to recover, and
                // ScopedCommit reuses such a directory on its next begin.
                return Ok(id);
            } else {
                wal.inspect(&id)
                    .map_err(|e| invalid(e.to_string()))?
                    .outcome()
                    .cloned()
            };
        // Only a settled no-effect attempt frees its id. An open chain, a commit
        // (even one whose HEAD was later reset by hand) and an effect-unknown
        // rejection keep the id, so Git's recovery refusal stays binding.
        match outcome {
            Some(fgos_git::wal::Outcome::AbandonedBeforeAttempt) => {}
            Some(fgos_git::wal::Outcome::CommitRejected { cause })
                if !cause.ends_with("effect-unknown") => {}
            _ => return Ok(id),
        }
    }
    Err(invalid("cutover attempt history exceeds inspection bound"))
}

#[cfg(test)]
mod tests {
    #[test]
    fn event_attributes_do_not_match_unrelated_union_rules() {
        assert!(super::event_attribute("/.fgos/events/*.jsonl"));
        assert!(!super::event_attribute("other-events/*.jsonl"));
        assert!(!super::event_attribute("docs/events.jsonl"));
    }
}
