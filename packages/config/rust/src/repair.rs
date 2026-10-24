//! The repairs the findings of `doctor` offer, one function per fix id. Each calls the module that
//! owns the work (the write transaction, the machine files, the relocation); none has a second
//! implementation of it. A repair with nothing left to do changes nothing, so a second run applies
//! nothing. A report names fix id and path, never a value. A confined session is refused.
use std::fs;
use std::path::Path;

use fgos_durable_file::{install_once_with_mode, Installed};
use fgos_identity::WriterIdentity;
use fgos_yaml_doc::{parse, Profile, Segment};
use serde_json::Value;

use crate::doctor::strays;
use crate::files::{read_beneath, select_source, LoadedFile, Source};
use crate::files::{PRIVATE_FILE_MODE, YAML_NAME};
use crate::locks::{hold, GLOBAL_CONFIG};
use crate::machine::{ensure_private_dir, fix_modes, refused, token, TOKEN_FILE};
use crate::relocate::{copy, plan, Held, MoveRequest};
use crate::scope::SourceKind;
use crate::snapshot::{split_global, Context, SessionClass, SnapshotError};
use crate::write::{commit, io_error, refresh, Edit, WriteRequest};
use crate::ConfigRefusal;

/// The fix ids this module applies; `contracts/doctor-rows.v1.json` lists the same.
const FIXES: [&str; 6] = [
    "refresh-docs",
    "remove-redundant",
    "chmod",
    "create-machine-files",
    "copy-to-destination",
    "move-under-private",
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
