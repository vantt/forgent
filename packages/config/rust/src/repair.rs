//! The repairs the findings of `doctor` offer, one function per fix id. Each calls the module that
//! owns the work (the write transaction, the machine files, the relocation); none has a second
//! implementation of it. A repair with nothing left to do changes nothing, so a second run applies
//! nothing. A report names fix id and path, never a value. A confined session is refused.
use std::collections::BTreeSet;
use std::fs;
use std::path::Path;

use fgos_durable_file::{install_once_with_mode, Installed};
use fgos_identity::WriterIdentity;
use fgos_yaml_doc::path::format_path;
use fgos_yaml_doc::{parse, Profile, Segment};
use serde_json::Value;

use crate::doctor::{empty_provider_accounts, strays, taste_plan};
use crate::files::{read_beneath, select_source, LoadedFile, Source};
use crate::files::{PRIVATE_FILE_MODE, YAML_NAME};
use crate::grammar::parse_block;
use crate::locks::{hold, GLOBAL_CONFIG};
use crate::machine::{ensure_private_dir, fix_modes, refused, token, TOKEN_FILE};
use crate::relocate::{copy, plan, Held, MoveRequest};
use crate::scope::SourceKind;
use crate::snapshot::{split_global, Context, SessionClass, SnapshotError, SnapshotRequest};
use crate::write::{
    commit, io_error, refresh, target_revision, without_project, Edit, WriteRequest,
};
use crate::ConfigRefusal;

/// The fix ids this module applies; `contracts/doctor-rows.v1.json` lists the same.
const FIXES: [&str; 8] = [
    "refresh-docs",
    "remove-redundant",
    "chmod",
    "move-under-private",
    "copy-to-destination",
    "create-machine-files",
    "move-capability-taste",
    "remove-empty-provider-accounts",
];

/// What `fix` did, by fix id and path; never a value.
#[derive(Debug, Default, PartialEq, Eq)]
pub struct FixReport {
    pub applied: Vec<(&'static str, String)>,
    /// Ids that name no repair this build knows.
    pub skipped: Vec<String>,
}

/// The paths holding only values equal to the standard: each is the highest key that can go whole.
fn redundant_roots(
    ctx: &Context,
    value: &Value,
    path: &mut Vec<Segment>,
    out: &mut Vec<Vec<Segment>>,
) {
    let Some(map) = value.as_object().filter(|m| !m.is_empty()) else {
        if ctx.standard.value_at(path) == Some(value) {
            out.push(path.clone());
        }
        return;
    };
    let before = out.len();
    for (key, child) in map {
        path.push(Segment::Key(key.clone()));
        redundant_roots(ctx, child, path, out);
        path.pop();
    }
    // Every child went whole: nothing else is left in this mapping, so it goes whole too.
    let whole =
        out.len() - before == map.len() && out[before..].iter().all(|p| p.len() == path.len() + 1);
    if whole && !path.is_empty() {
        out.truncate(before);
        out.push(path.clone());
    }
}

/// The YAML file a request targets; none when it is absent or still legacy JSON.
fn yaml_file(req: &WriteRequest) -> Result<Option<LoadedFile>, SnapshotError> {
    let global = &req.roots.global_dir;
    let (root, dir) = match req.target {
        SourceKind::Project => (req.roots.project_root.as_path(), Path::new(".fgos")),
        _ => (
            global.parent().unwrap_or(Path::new("")),
            global.file_name().map_or(Path::new(".fgos"), Path::new),
        ),
    };
    match select_source(root, dir, Profile::StrictConfig.limits().input_bytes)? {
        Source::Yaml(file) => Ok(Some(file)),
        _ => Ok(None),
    }
}

/// `refresh-docs` or `remove-redundant` on the project and global YAML files, each one write
/// transaction; a file with nothing to repair is left untouched. Removing a value that carries a
/// note needs `acknowledge`.
fn edit_files(
    ctx: &Context,
    req: &impl Fn(SourceKind) -> WriteRequest,
    writer: &WriterIdentity,
    id: &str,
    acknowledge: bool,
) -> Result<Vec<String>, SnapshotError> {
    let mut paths = Vec::new();
    for kind in [SourceKind::Project, SourceKind::Global] {
        let mut request = req(kind);
        let Some(file) = yaml_file(&request)? else {
            continue;
        };
        let done = if id == "refresh-docs" {
            refresh(ctx, request, writer, |_| Ok(()))?
        } else {
            let json = parse(&file.bytes, Profile::StrictConfig, YAML_NAME)?.to_json()?;
            let mut roots = Vec::new();
            redundant_roots(ctx, &json, &mut Vec::new(), &mut roots);
            request.edits = roots.into_iter().map(|path| Edit::Unset { path }).collect();
            request.acknowledge_comment_loss = acknowledge;
            request.reason = "[doctor:fix] equal to the standard".into();
            if request.edits.is_empty() {
                continue;
            }
            commit(ctx, &request, writer)?
        };
        paths.extend(done.applied.into_iter().map(|(path, _)| path));
    }
    Ok(paths)
}

/// The reason a value moved without one of its own is written with, and the one for a removal.
const MOVED_REASON: &str = "[doctor:fix] moved out of the capability row";
const REMOVED_REASON: &str = "[doctor:fix] retired capability taste removed";

/// `move-capability-taste` on the project and global YAML files. In the project file the roles and
/// personas a capability row holds go to `runner.roles` and `runner.personas` (so a value written for one
/// capability now applies to every capability) with the reason text each carried, and the seats go away.
/// The global file cannot hold the new tables, so its retired keys are only removed. One write
/// transaction takes the new values and removes the old keys together, so the file is sound under a
/// schema that no longer allows the old keys. The write door takes one reason per transaction, so a
/// value whose reason differs from that transaction's is written again under its own in a following
/// transaction chained on the revision the first one made. A file where two places give one target
/// different values is left as it is (the row names both paths).
fn move_taste(
    ctx: &Context,
    req: &impl Fn(SourceKind) -> WriteRequest,
    writer: &WriterIdentity,
) -> Result<Vec<String>, SnapshotError> {
    let mut paths = Vec::new();
    for kind in [SourceKind::Project, SourceKind::Global] {
        // One request per file: its revision is the one the read and the write both stand on.
        let mut base = req(kind);
        let Some(file) = yaml_file(&base)? else {
            continue;
        };
        let doc = parse(&file.bytes, Profile::StrictConfig, YAML_NAME)?;
        let plan = taste_plan(&doc.to_json()?, kind == SourceKind::Project);
        if plan.keys.is_empty() || plan.blocked() {
            continue;
        }
        let reasons: Vec<String> = plan
            .sets
            .iter()
            .map(|set| {
                let block = parse_block(&doc.comments_at(&set.from).unwrap_or_default());
                block
                    .why
                    .map_or_else(|| MOVED_REASON.to_string(), |(_, why)| why)
            })
            .collect();
        let first = reasons
            .first()
            .cloned()
            .unwrap_or_else(|| REMOVED_REASON.into());
        let sets = plan.sets.iter().map(|set| Edit::Set {
            path: set.to.clone(),
            value: set.value.clone(),
        });
        let unsets = plan
            .keys
            .iter()
            .map(|path| Edit::Unset { path: path.clone() });
        base.edits = sets.chain(unsets).collect();
        base.reason = first.clone();
        base.acknowledge_comment_loss = true;
        let mut revision = commit(ctx, &base, writer)?.new_revision;
        let others: BTreeSet<&String> = reasons.iter().filter(|r| **r != first).collect();
        for reason in others {
            let mut request = req(kind);
            request.expected = Some(revision);
            request.edits = plan
                .sets
                .iter()
                .zip(&reasons)
                .filter(|(_, own)| *own == reason)
                .map(|(set, _)| Edit::Set {
                    path: set.to.clone(),
                    value: set.value.clone(),
                })
                .collect();
            request.reason = reason.clone();
            revision = commit(ctx, &request, writer)?.new_revision;
        }
        paths.extend(plan.names.iter().map(|name| format_path(&name.path)));
    }
    Ok(paths)
}

const EMPTY_ACCOUNTS_REASON: &str = "[doctor:fix] empty retired provider accounts removed";

/// `remove-empty-provider-accounts` on the accounts file: each `runner.providers.<provider>.accounts` that holds
/// an empty mapping goes, and with it the provider entry when that was all it held, `runner.providers` when
/// no provider is left, and `runner` when that was all it held. A provider that lists accounts is left as it is (the runner config door refuses it by
/// name); nothing else of the file is touched.
fn remove_empty_provider_accounts(
    ctx: &Context,
    req: &impl Fn(SourceKind) -> WriteRequest,
    writer: &WriterIdentity,
) -> Result<Vec<String>, SnapshotError> {
    let mut request = req(SourceKind::Accounts);
    request.roots = without_project(&request.roots);
    let (parent, dir) = split_global(&request.roots.global_dir)?;
    let name = dir.join("private").join("accounts.yaml");
    let max = Profile::StrictConfig.limits().input_bytes;
    let Some(file) = read_beneath(parent, &name, max)? else {
        return Ok(Vec::new());
    };
    let json = parse(&file.bytes, Profile::StrictConfig, YAML_NAME)?.to_json()?;
    let shells = empty_provider_accounts(&json);
    if shells.is_empty() {
        return Ok(Vec::new());
    }
    let providers = json["runner"]["providers"].as_object();
    let held = |provider: &str| providers.and_then(|all| all.get(provider)?.as_object());
    let mut edits = Vec::new();
    let mut whole = 0;
    for shell in &shells {
        let Segment::Key(provider) = &shell[2] else {
            continue;
        };
        if held(provider).is_some_and(|entry| entry.len() == 1) {
            whole += 1;
            edits.push(Edit::Unset {
                path: shell[..3].to_vec(),
            });
        } else {
            edits.push(Edit::Unset {
                path: shell.clone(),
            });
        }
    }
    if providers.is_some_and(|all| all.len() == whole) {
        // The key that held nothing else goes whole: an emptied `runner` in the accounts file would be a key in the
        // wrong file.
        let alone = json["runner"]
            .as_object()
            .is_some_and(|runner| runner.len() == 1);
        edits = vec![Edit::Unset {
            path: shells[0][..if alone { 1 } else { 2 }].to_vec(),
        }];
    }
    request.expected = Some(file.revision);
    request.edits = edits;
    request.reason = EMPTY_ACCOUNTS_REASON.into();
    request.acknowledge_comment_loss = true;
    commit(ctx, &request, writer)?;
    Ok(shells.iter().map(|path| format_path(path)).collect())
}

/// Copies the account pool and token keys the global JSON holds and the destination lacks.
fn copy_missing(
    ctx: &Context,
    req: &MoveRequest,
    writer: &WriterIdentity,
) -> Result<Vec<String>, SnapshotError> {
    let pending = plan(ctx, &req.roots.global_dir)?;
    let missing = pending
        .into_iter()
        .filter(|p| p.destination == Held::Missing);
    let missing: Vec<String> = missing.map(|p| p.path).collect();
    if !missing.is_empty() {
        copy(ctx, req, writer, |_| Ok(()))?;
    }
    Ok(missing)
}

/// Installs the loose file `name` into `private/` create-only (an equal copy already there is
/// fine, a different one refuses), then removes the source if it still is the bytes that were
/// installed. The destination is complete before the source goes; the lock is held throughout.
fn move_under_private(req: &MoveRequest, name: &str) -> Result<bool, SnapshotError> {
    let global = &req.roots.global_dir;
    let (parent, dir) = split_global(global)?;
    let max = Profile::StrictConfig.limits().input_bytes;
    let _lock = hold(
        GLOBAL_CONFIG,
        Path::new(""),
        &req.lock_root,
        req.lock_wait_ms,
    )?;
    let Some(source) = read_beneath(parent, &dir.join(name), max)? else {
        return Ok(false);
    };
    ensure_private_dir(global)?;
    let private = global.join("private");
    install_once_with_mode(&private, name, &source.bytes, PRIVATE_FILE_MODE).map_err(io_error)?;
    let there = read_beneath(parent, &dir.join("private").join(name), max)?;
    if there.map(|f| f.bytes) != Some(source.bytes) {
        return Err(refused(
            "config-move-destination-differs",
            &format!("private/{name}"),
            None,
        ));
    }
    let now = read_beneath(parent, &dir.join(name), max)?;
    if now.map(|f| f.revision) != Some(source.revision) {
        return Err(refused(
            "config-write-conflict",
            name,
            Some("revision-changed"),
        ));
    }
    fs::remove_file(global.join(name)).map_err(io_error)?;
    Ok(true)
}

/// How long a repair waits for the lock of the file it edits.
const LOCK_WAIT_MS: u64 = 5_000;

/// [`fix`] for a caller that holds the roots of a project and nothing else: each target's request is built
/// from `roots` (the revision the file has now, the machine lock root, no edits of its own), which is what
/// `fgos doctor --fix` applies.
pub fn fix_with_roots(
    ctx: &Context,
    roots: &SnapshotRequest,
    writer: &WriterIdentity,
    ids: &[&str],
    acknowledge: bool,
) -> Result<FixReport, SnapshotError> {
    let lock_root = fgos_holder_lock::state_root::lock_root();
    let request = |target: SourceKind| WriteRequest {
        roots: roots.clone(),
        lock_root: lock_root.clone(),
        target,
        expected: target_revision(roots, target).ok().flatten(),
        edits: Vec::new(),
        reason: String::new(),
        acknowledge_comment_loss: acknowledge,
        lock_wait_ms: LOCK_WAIT_MS,
    };
    fix(ctx, request, writer, ids, acknowledge)
}

/// Applies the named repairs a check offered. The write request builder `req` gives each target's
/// request (its roots, lock root and wait are the repairs' own).
pub fn fix(
    ctx: &Context,
    req: impl Fn(SourceKind) -> WriteRequest,
    writer: &WriterIdentity,
    ids: &[&str],
    acknowledge: bool,
) -> Result<FixReport, SnapshotError> {
    let base = req(SourceKind::Global);
    if base.roots.class == SessionClass::Confined {
        return Err(ConfigRefusal::new("config-write-confined").into());
    }
    let moving = MoveRequest {
        roots: base.roots,
        lock_root: base.lock_root,
        lock_wait_ms: base.lock_wait_ms,
    };
    let global = &moving.roots.global_dir;
    let mut report = FixReport::default();
    for id in ids {
        let Some(id) = FIXES.into_iter().find(|known| known == id) else {
            report.skipped.push(id.to_string());
            continue;
        };
        let paths = match id {
            "refresh-docs" | "remove-redundant" => edit_files(ctx, &req, writer, id, acknowledge)?,
            "chmod" => fix_modes(global)?.into_iter().map(|m| m.file).collect(),
            "create-machine-files" => {
                let made = token::ensure(
                    global,
                    &moving.lock_root,
                    moving.lock_wait_ms,
                    token::generate,
                )?;
                vec![TOKEN_FILE.to_string()]
                    .into_iter()
                    .filter(|_| made == Installed::Created)
                    .collect()
            }
            "move-capability-taste" => move_taste(ctx, &req, writer)?,
            "remove-empty-provider-accounts" => remove_empty_provider_accounts(ctx, &req, writer)?,
            "copy-to-destination" => copy_missing(ctx, &moving, writer)?,
            _ => {
                let mut moved = Vec::new();
                for name in strays(ctx, global) {
                    if move_under_private(&moving, &name)? {
                        moved.push(name);
                    }
                }
                moved
            }
        };
        report
            .applied
            .extend(paths.into_iter().map(|path| (id, path)));
    }
    Ok(report)
}
