//! Moving the account pools and the gateway token out of the global JSON (spec section 13) in two
//! stages, destination first. `copy` writes and verifies the destination and keeps the source, so
//! it is safe while an older release still reads the old keys; `finish` removes the source keys
//! after the machine check, from a backup, in one durable replace. A crash between the stages
//! leaves a key in both files, and the destination wins (the snapshot reports a notice).
//! No error or report carries a value.
#![cfg(unix)]
use std::io;
use std::path::{Path, PathBuf};

use fgos_canonical_json::canonical_json;
use fgos_durable_file::{ensure_dir_beneath, install_once_with_mode, open_dir_beneath};
use fgos_durable_file::{replace_durably_with_mode, DirIdentity};
use fgos_identity::WriterIdentity;
use fgos_yaml_doc::path::format_path;
use fgos_yaml_doc::{Profile, Segment};
use serde_json::Value;

use crate::files::{read_beneath, LoadedFile, JSON_NAME, PRIVATE_DIR_MODE, PRIVATE_FILE_MODE};
use crate::locks::{hold, GLOBAL_CONFIG};
use crate::machine::{beneath, refused, token};
use crate::schema::{descend, json_at, load};
use crate::scope::SourceKind;
use crate::snapshot::{accounts_source, carries, split_global, Context, SnapshotError};
use crate::snapshot::{SessionClass, SnapshotRequest};
use crate::write::{commit_observed, Edit, WriteRequest};
use crate::ConfigRefusal;

const REASON: &str = "[migrate] carried over from ~/.fgos/config.json, reason never recorded";

pub struct MoveRequest {
    /// The roots and the writer's session class (`Confined` is refused).
    pub roots: SnapshotRequest,
    pub lock_root: PathBuf,
    pub lock_wait_ms: u64,
}

/// What `copy` and `finish` report before each stage; an error from the observer aborts.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Step {
    DestinationWritten,
    DestinationVerified,
    SourceBackedUp,
    SourceRewritten,
}

/// What the destination holds at a moved key's path.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Held {
    Missing,
    Equal,
    Differs,
}

/// A key `plan` found in the global file: its path, how many entries it holds, its destination.
pub struct Pending {
    pub path: String,
    pub entries: usize,
    pub destination: Held,
}

/// The paths found (carried by `copy`, removed by `finish`) and whether the rewrite changed the
/// file's formatting beyond the removal.
#[derive(Debug, Default)]
pub struct Moved {
    pub paths: Vec<String>,
    pub reformatted: bool,
}

struct Key {
    path: Vec<Segment>,
    token: bool,
    value: Value,
}

struct Dest {
    token: Option<String>,
    accounts: Value,
    revision: Option<String>,
}

fn open_source(global_dir: &Path) -> Result<Option<(LoadedFile, Value)>, SnapshotError> {
    let (parent, dir) = split_global(global_dir)?;
    let max = Profile::StrictConfig.limits().input_bytes;
    let Some(file) = read_beneath(parent, &dir.join(JSON_NAME), max)? else {
        return Ok(None);
    };
    let json = serde_json::from_slice(&file.bytes).map_err(|e| {
        let mut refusal = ConfigRefusal::new("config-parse").in_file(JSON_NAME);
        (refusal.line, refusal.column) = (Some(e.line() as u32), Some(e.column() as u32));
        SnapshotError::from(refusal)
    })?;
    Ok(Some((file, json)))
}

/// The topmost keys of the source whose schema node lives in the accounts or the token file.
fn keys(ctx: &Context, json: &Value) -> Result<Vec<Key>, SnapshotError> {
    let mut out = Vec::new();
    descend(json, &mut Vec::new(), &mut |path, value| {
        let file = ctx.schemas.resolve(path).map(|r| r.file);
        let moved = matches!(file, Some("accounts" | "token"));
        if moved {
            let (path, value) = (path.to_vec(), value.clone());
            out.push(Key {
                path,
                token: file == Some("token"),
                value,
            });
        }
        !moved
    });
    let line = |key: &Key| key.value.as_str().map(|t| format!("{t}\n"));
    for key in out.iter().filter(|k| k.token && carries(&k.value)) {
        if line(key).is_none_or(|l| token::line(l.as_bytes()).is_none()) {
            return Err(refused("config-token-invalid", JSON_NAME, Some("shape")));
        }
    }
    Ok(out)
}

fn destination(global_dir: &Path) -> Result<Dest, SnapshotError> {
    let token = token::read(global_dir)?.map(|secret| secret.expose().to_string());
    let file = accounts_source(global_dir, Profile::StrictConfig.limits().input_bytes)?.file;
    let accounts = match &file {
        Some(file) => load("private/accounts.yaml", &file.bytes)?.1,
        None => Value::Null,
    };
    Ok(Dest {
        token,
        accounts,
        revision: file.map(|f| f.revision),
    })
}

fn canon(value: &Value) -> Result<String, SnapshotError> {
    canonical_json(value).map_err(|e| io::Error::other(e.to_string()).into())
}

fn held(key: &Key, dest: &Dest) -> Result<Held, SnapshotError> {
    let have = match key.token {
        true => dest.token.clone().map(Value::String),
        false => json_at(&dest.accounts, &key.path).cloned(),
    };
    Ok(match have {
        _ if !carries(&key.value) => Held::Equal,
        None => Held::Missing,
        Some(have) if canon(&have)? == canon(&key.value)? => Held::Equal,
        Some(_) => Held::Differs,
    })
}

/// Every key's state; a key whose destination differs (or, when `missing_ok` is false, is
/// missing) is `config-move-destination-differs` naming the destination file and the key's path.
fn states(keys: &[Key], dest: &Dest, missing_ok: bool) -> Result<Vec<Held>, SnapshotError> {
    let all = keys
        .iter()
        .map(|key| held(key, dest))
        .collect::<Result<Vec<_>, _>>()?;
    let bad = |h: &Held| *h == Held::Differs || (!missing_ok && *h == Held::Missing);
    match keys.iter().zip(&all).find(|(_, h)| bad(h)) {
        None => Ok(all),
        Some((key, _)) => {
            let file = if key.token {
                "private/gateway-token"
            } else {
                "private/accounts.yaml"
            };
            Err(ConfigRefusal::new("config-move-destination-differs")
                .in_file(file)
                .at_path(&key.path)
                .into())
        }
    }
}

/// What would be moved from the global JSON and what the destination holds already; names,
/// counts and states only.
pub fn plan(ctx: &Context, global_dir: &Path) -> Result<Vec<Pending>, SnapshotError> {
    match open_source(global_dir)? {
        Some((_, json)) => classify(ctx, global_dir, &json),
        None => Ok(Vec::new()),
    }
}

/// The moved keys of any config file's `json` and what the destination holds for each.
pub fn classify(
    ctx: &Context,
    global_dir: &Path,
    json: &Value,
) -> Result<Vec<Pending>, SnapshotError> {
    let dest = destination(global_dir)?;
    let entries = |value: &Value| match value {
        Value::Null => 0,
        Value::Object(map) => map.len(),
        Value::Array(items) => items.len(),
        _ => 1,
    };
    keys(ctx, json)?
        .iter()
        .map(|key| {
            let path = format_path(&key.path);
            Ok(Pending {
                path,
                entries: entries(&key.value),
                destination: held(key, &dest)?,
            })
        })
        .collect()
}

/// The values below `path` as one `Set` each: a non-empty mapping descends, anything else is a leaf.
fn leaves(path: &[Segment], value: &Value, out: &mut Vec<Edit>) {
    match value.as_object().filter(|map| !map.is_empty()) {
        Some(map) => map.iter().for_each(|(name, kid)| {
            leaves(&[path, &[Segment::Key(name.clone())]].concat(), kid, out)
        }),
        None => out.push(Edit::Set {
            path: path.to_vec(),
            value: value.clone(),
        }),
    }
}

fn paths(keys: &[Key]) -> Vec<String> {
    keys.iter().map(|key| format_path(&key.path)).collect()
}

fn confined(req: &MoveRequest) -> Result<(), SnapshotError> {
    match req.roots.class {
        SessionClass::Confined => Err(ConfigRefusal::new("config-write-confined").into()),
        SessionClass::Unconfined => Ok(()),
    }
}

/// Stage 1: write the account pools through the write transaction and the token through the
/// create-only install, then verify both by reading them back. The source is not touched. A
/// destination that holds different data for a key is refused before anything is written.
pub fn copy(
    ctx: &Context,
    req: &MoveRequest,
    writer: &WriterIdentity,
    mut observe: impl FnMut(Step) -> io::Result<()>,
) -> Result<Moved, SnapshotError> {
    confined(req)?;
    let global = &req.roots.global_dir;
    let Some((_, json)) = open_source(global)? else {
        return Ok(Moved::default());
    };
    let (keys, dest) = (keys(ctx, &json)?, destination(global)?);
    let (mut edits, wait) = (Vec::new(), req.lock_wait_ms);
    let missing = states(&keys, &dest, true)?;
    for (key, _) in keys
        .iter()
        .zip(&missing)
        .filter(|(_, h)| **h == Held::Missing)
    {
        match key.token {
            true => {
                let text = key.value.as_str().unwrap_or_default().to_string();
                token::ensure(global, &req.lock_root, wait, || Ok(text))?;
            }
            false => leaves(&key.path, &key.value, &mut edits),
        }
    }
    if !edits.is_empty() {
        let write = WriteRequest {
            roots: req.roots.clone(),
            lock_root: req.lock_root.clone(),
            target: SourceKind::Accounts,
            expected: dest.revision,
            edits,
            reason: REASON.into(),
            acknowledge_comment_loss: false,
            lock_wait_ms: wait,
        };
        commit_observed(ctx, &write, writer, |_| Ok(()))?;
    }
    observe(Step::DestinationWritten)?;
    states(&keys, &destination(global)?, false)?;
    observe(Step::DestinationVerified)?;
    Ok(Moved {
        paths: paths(&keys),
        reformatted: false,
    })
}

/// Removes the key at `path`, leaving every other key where it was (an emptied object stays).
fn remove_at(value: &mut Value, path: &[Segment]) {
    match path {
        [Segment::Key(name)] => {
            value.as_object_mut().and_then(|map| map.shift_remove(name));
        }
        [Segment::Key(name), rest @ ..] => {
            if let Some(kid) = value.get_mut(name.as_str()) {
                remove_at(kid, rest);
            }
        }
        _ => {}
    }
}

fn global_identity(global_dir: &Path) -> Result<DirIdentity, SnapshotError> {
    let (parent, dir) = split_global(global_dir)?;
    let found = open_dir_beneath(parent, dir).map_err(beneath)?;
    let found = found
        .map(|dir| dir.identity())
        .transpose()
        .map_err(beneath)?;
    found.ok_or_else(|| io::Error::from(io::ErrorKind::NotFound).into())
}

fn conflict(why: &str) -> SnapshotError {
    refused("config-write-conflict", "", Some(why))
}

/// Stage 2: remove the moved keys from the global JSON. Refused unless `machine_checked` (no
/// release on this machine reads them from there). Every key must be held by its destination
/// first; the file is backed up (create-only, 0600, in `private/config-migrate`), then replaced
/// once, durably, with the other bytes and the key order kept, only if it did not change since it
/// was read. An object left empty by the removal stays.
pub fn finish(
    ctx: &Context,
    req: &MoveRequest,
    machine_checked: bool,
    mut observe: impl FnMut(Step) -> io::Result<()>,
) -> Result<Moved, SnapshotError> {
    if !machine_checked {
        return Err(ConfigRefusal::new("config-machine-check-required").into());
    }
    confined(req)?;
    let (global, (parent, dir)) = (&req.roots.global_dir, split_global(&req.roots.global_dir)?);
    let _lock = hold(
        GLOBAL_CONFIG,
        Path::new(""),
        &req.lock_root,
        req.lock_wait_ms,
    )?;
    let Some((file, json)) = open_source(global)? else {
        return Ok(Moved::default());
    };
    let keys = keys(ctx, &json)?;
    if keys.is_empty() {
        return Ok(Moved::default());
    }
    states(&keys, &destination(global)?, false)?;
    observe(Step::DestinationVerified)?;
    let identity = global_identity(global)?;
    ensure_dir_beneath(
        parent,
        &dir.join("private/config-migrate"),
        PRIVATE_DIR_MODE,
    )
    .map_err(beneath)?;
    let name = format!("{}-{JSON_NAME}", &file.revision[..16]);
    let backup = global.join("private/config-migrate");
    install_once_with_mode(&backup, &name, &file.bytes, PRIVATE_FILE_MODE)
        .map_err(|e| io::Error::other(e.to_string()))?;
    observe(Step::SourceBackedUp)?;
    let render = |value: &Value| {
        serde_json::to_string_pretty(value)
            .map(|text| text + "\n")
            .map_err(io::Error::other)
    };
    let mut rest = json.clone();
    keys.iter().for_each(|key| remove_at(&mut rest, &key.path));
    let reformatted = render(&json)?.as_bytes() != file.bytes;
    let max = Profile::StrictConfig.limits().input_bytes;
    let now = read_beneath(parent, &dir.join(JSON_NAME), max)?;
    if now.map(|f| f.revision) != Some(file.revision.clone())
        || global_identity(global)? != identity
    {
        return Err(conflict("revision-changed"));
    }
    replace_durably_with_mode(global, JSON_NAME, render(&rest)?.as_bytes(), file.mode)
        .map_err(|e| io::Error::other(e.to_string()))?;
    let _ = observe(Step::SourceRewritten);
    Ok(Moved {
        paths: paths(&keys),
        reformatted,
    })
}
