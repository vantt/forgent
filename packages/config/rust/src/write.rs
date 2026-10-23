//! The one-file write transaction (spec section 6), the one thing every write door calls: lock the
//! scope, compare the revision, edit through YAML Document with the comment contract, validate the
//! effective value, compare again, replace durably. A refusal leaves the file byte-identical.
use std::io;
use std::path::{Path, PathBuf};

use fgos_durable_file::{ensure_dir_beneath, install_once_with_mode, replace_durably_with_mode};
use fgos_durable_file::{BeneathError, DirIdentity, Installed};
use fgos_holder_lock::{Acquire, LockScope, ScopeError, Wait};
use fgos_identity::WriterIdentity;
use fgos_yaml_doc::path::format_path;
use fgos_yaml_doc::{parse, CommentLoss, Profile, Segment, Value as Doc};
use serde_json::Value;
use sha2::{Digest, Sha256};

use crate::files::{read_beneath, select_source, LoadedFile, Source};
use crate::files::{PRIVATE_DIR_MODE, PRIVATE_FILE_MODE, YAML_NAME};
use crate::grammar::{block_for_changed_key, block_for_new_key, doc_lines, header_lines};
use crate::grammar::{Actor, Reason};
use crate::locks::{scope_params, GLOBAL_CONFIG, PROJECT_CONFIG};
use crate::schema::{json_at, json_put};
use crate::scope::{judge, SourceKind};
use crate::snapshot::{build, read_sources, Context, SessionClass, SnapshotError, SnapshotRequest};
use crate::ConfigRefusal;

const REASON_REQUIRED: &str = "config-comment-reason-required";

pub enum Edit {
    Set { path: Vec<Segment>, value: Value },
    Unset { path: Vec<Segment> },
}

pub struct WriteRequest {
    /// The roots and the writer's session class (`Confined` is refused).
    pub roots: SnapshotRequest,
    /// The machine lock root of the registry; the crate reads no environment.
    pub lock_root: PathBuf,
    pub target: SourceKind,
    /// Revision of the file the edits were computed against; `None`: the file must not exist.
    pub expected: Option<String>,
    pub edits: Vec<Edit>,
    pub reason: String,
    pub acknowledge_comment_loss: bool,
    pub lock_wait_ms: u64,
}

/// What `commit_observed` reports before each stage; an error from the observer aborts.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Step {
    LockHeld,
    FirstCheck,
    Edited,
    Validated,
    SecondCheck,
    Replaced,
}

#[derive(Debug)]
pub struct WriteResult {
    /// The real writer id; the `[actor]` in the file is a copy that may read `unknown`.
    pub writer_id: String,
    pub new_revision: String,
    /// `(path, unset)` per edit written.
    pub applied: Vec<(String, bool)>,
    /// `(id, path)`: `redundant-noop` for a value equal to the standard on a key the file lacks.
    pub notices: Vec<(&'static str, String)>,
}

fn conflict(reason: &str) -> SnapshotError {
    let mut refusal = ConfigRefusal::new("config-write-conflict");
    refusal.detail_mut().keyword = Some(reason.to_string());
    refusal.into()
}

fn sha(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}

fn io_error(error: impl ToString) -> SnapshotError {
    io::Error::other(error.to_string()).into()
}

/// Where the target lives: the root it is opened beneath, its directory and its file name.
fn place(req: &WriteRequest) -> Result<(PathBuf, PathBuf, &'static str), SnapshotError> {
    let global = &req.roots.global_dir;
    let (Some(parent), Some(dir)) = (global.parent(), global.file_name()) else {
        return Err(ConfigRefusal::new("config-path-symlink").into());
    };
    Ok(match req.target {
        SourceKind::Project => (req.roots.project_root.clone(), ".fgos".into(), YAML_NAME),
        SourceKind::Global => (parent.into(), dir.into(), YAML_NAME),
        SourceKind::Accounts => (
            parent.into(),
            Path::new(dir).join("private"),
            "accounts.yaml",
        ),
    })
}

/// The file now, from one open descriptor, compared with the revision the edits were made against.
fn current(
    req: &WriteRequest,
    (root, dir, name): &(PathBuf, PathBuf, &str),
    compare: bool,
) -> Result<Option<LoadedFile>, SnapshotError> {
    let max = Profile::StrictConfig.limits().input_bytes;
    let file = match req.target {
        SourceKind::Accounts => read_beneath(root, &dir.join(name), max)?,
        _ => match select_source(root, dir, max)? {
            Source::Absent => None,
            Source::Yaml(file) => Some(file),
            Source::LegacyJson(_) => {
                return Err(ConfigRefusal::new("config-format-legacy-json").into())
            }
        },
    };
    match compare && file.as_ref().map(|f| &f.revision) != req.expected.as_ref() {
        true => Err(conflict("revision-changed")),
        false => Ok(file),
    }
}

/// The directory of the target (created when missing, never through a symlink) and who it is now.
fn dir_identity(root: &Path, dir: &Path, mode: u32) -> Result<DirIdentity, SnapshotError> {
    match ensure_dir_beneath(root, dir, mode).and_then(|d| d.identity()) {
        Err(BeneathError::Refused(_)) => Err(ConfigRefusal::new("config-path-symlink").into()),
        Err(BeneathError::Io(error)) => Err(error.into()),
        Ok(identity) => Ok(identity),
    }
}

pub fn commit(
    ctx: &Context,
    req: &WriteRequest,
    writer: &WriterIdentity,
) -> Result<WriteResult, SnapshotError> {
    commit_observed(ctx, req, writer, |_| Ok(()))
}

/// [`commit`] telling `observe` before each stage (the one seam; the way `replace_durably_observed` does).
pub fn commit_observed(
    ctx: &Context,
    req: &WriteRequest,
    writer: &WriterIdentity,
    mut observe: impl FnMut(Step) -> io::Result<()>,
) -> Result<WriteResult, SnapshotError> {
    // Everything that can be refused without a lock, in the order of the spec.
    if req.roots.class == SessionClass::Confined {
        return Err(ConfigRefusal::new("config-write-confined").into());
    }
    let actor = Actor::from_writer(writer);
    let at = place(req)?;
    let seen = current(req, &at, false)?;
    // A write that changes nothing needs no reason: every edit sets what the key inherits already.
    let reason = match all_redundant(ctx, req, seen.as_ref(), at.2) {
        true => Reason::parse(&req.reason).ok(),
        false => Some(Reason::parse(&req.reason)?),
    };
    let mut proposed = Value::Null;
    for edit in &req.edits {
        match edit {
            Edit::Set { path, value } if !path.is_empty() => {
                json_put(&mut proposed, path, Some(value.clone()))
            }
            Edit::Unset { path } if !path.is_empty() => {}
            // The document itself is no key.
            _ => return Err(ConfigRefusal::new("config-key-out-of-scope").into()),
        }
    }
    match judge(ctx.schemas, req.target, &proposed, None) {
        refused if !refused.is_empty() => return Err(SnapshotError::Refused(refused)),
        _ => {}
    }
    let (root, dir, name) = &at;
    let project = req.target == SourceKind::Project;
    let mode = if project { 0o755 } else { PRIVATE_DIR_MODE };
    let held = dir_identity(root, dir, mode)?;
    let (lock, fgos_dir) = if project {
        (PROJECT_CONFIG, root.join(dir))
    } else {
        (GLOBAL_CONFIG, PathBuf::new())
    };
    let mut scope = LockScope::seeded(Vec::new()).map_err(io_error)?;
    match scope.acquire(
        lock,
        &scope_params(&fgos_dir, &req.lock_root),
        Wait::Ms(req.lock_wait_ms),
    ) {
        Ok(_) => {}
        Err(ScopeError::Acquire(why))
            if matches!(*why, Acquire::Held { .. } | Acquire::Timeout { .. }) =>
        {
            return Err(conflict("lock-held"))
        }
        Err(other) => return Err(io_error(other)),
    }
    observe(Step::LockHeld)?;
    observe(Step::FirstCheck)?;
    let base = current(req, &at, true)?;
    let (bytes, applied, notices) = edit(ctx, req, &actor, reason.as_ref(), base.as_ref(), name)?;
    observe(Step::Edited)?;
    let mut result = WriteResult {
        writer_id: writer.id.to_string(),
        new_revision: sha(&bytes),
        applied,
        notices,
    };
    if result.applied.is_empty() {
        result.new_revision = base.map_or("absent".into(), |file| file.revision);
        return Ok(result);
    }
    validate(ctx, req, &bytes)?;
    observe(Step::Validated)?;
    observe(Step::SecondCheck)?;
    let now = current(req, &at, true)?;
    if ensure_dir_beneath(root, dir, mode)
        .and_then(|d| d.identity())
        .ok()
        != Some(held)
    {
        return Err(conflict("directory-changed"));
    }
    let dir = root.join(dir);
    let done = match &now {
        Some(file) => replace_durably_with_mode(&dir, name, &bytes, file.mode),
        None => install_once_with_mode(
            &dir,
            name,
            &bytes,
            if project { 0o644 } else { PRIVATE_FILE_MODE },
        ),
    };
    // A racing creation makes the no-overwrite install report that the name exists.
    if done.map_err(io_error)? == Installed::AlreadyExists {
        return Err(conflict("revision-changed"));
    }
    let _ = observe(Step::Replaced);
    Ok(result)
}

type Edited = (Vec<u8>, Vec<(String, bool)>, Vec<(&'static str, String)>);

/// Whether every edit sets a value equal to the standard on a key the file does not hold. A file
/// that cannot be read here is not redundant; the transaction refuses it after the lock.
fn all_redundant(ctx: &Context, req: &WriteRequest, base: Option<&LoadedFile>, name: &str) -> bool {
    let held = match base {
        None => Ok(Value::Null),
        Some(file) => parse(&file.bytes, Profile::StrictConfig, name).and_then(|doc| doc.to_json()),
    };
    let Ok(held) = held else { return false };
    !req.edits.is_empty()
        && req.edits.iter().all(|edit| match edit {
            Edit::Set { path, value } => {
                ctx.standard.value_at(path) == Some(value) && json_at(&held, path).is_none()
            }
            Edit::Unset { .. } => false,
        })
}

/// The produced bytes: every edit applied to one in-memory document, each key given its comment
/// block. Nothing is written; any error discards the document.
fn edit(
    ctx: &Context,
    req: &WriteRequest,
    actor: &Actor,
    reason: Option<&Reason>,
    base: Option<&LoadedFile>,
    name: &str,
) -> Result<Edited, SnapshotError> {
    let header = header_lines(1)
        .iter()
        .map(|l| format!("# {l}\n"))
        .collect::<String>()
        + "\n";
    let mut doc = parse(
        base.map_or(header.as_bytes(), |f| &f.bytes),
        Profile::StrictConfig,
        name,
    )?;
    let loss = if req.acknowledge_comment_loss {
        CommentLoss::Acknowledge
    } else {
        CommentLoss::Refuse
    };
    let (mut applied, mut notices) = (Vec::new(), Vec::new());
    let node = |path: &[Segment]| Some(ctx.schemas.resolve(path)?.node.clone());
    for edit in &req.edits {
        let (Edit::Set { path, .. } | Edit::Unset { path }) = edit;
        let before = doc.to_json()?;
        let held = json_at(&before, path).is_some();
        // A value equal to the standard is no value: a no-op on a missing key, an unset on a present one.
        let value = match edit {
            Edit::Set { value, .. } if ctx.standard.value_at(path) != Some(value) => Some(value),
            Edit::Set { .. } if !held => {
                notices.push(("redundant-noop", format_path(path)));
                continue;
            }
            _ => None,
        };
        let reason = reason.ok_or_else(|| ConfigRefusal::new(REASON_REQUIRED))?;
        applied.push((format_path(path), value.is_none()));
        let Some(value) = value else {
            doc.remove(path, loss)?;
            continue;
        };
        doc.set(path, Doc::from_json(value), loss)?;
        let lines = match held {
            true => block_for_changed_key(&doc.comments_at(path)?, actor, reason),
            false => block_for_new_key(
                &node(path).unwrap_or_default(),
                ctx.standard.value_at(path),
                actor,
                reason,
            ),
        };
        doc.set_comment_block(path, &lines)?;
        for n in (1..path.len()).filter(|n| json_at(&before, &path[..*n]).is_none()) {
            let lines = node(&path[..n])
                .map(|node| doc_lines(&node, ctx.standard.value_at(&path[..n])))
                .unwrap_or_default();
            if !lines.is_empty() {
                doc.set_comment_block(&path[..n], &lines)?;
            }
        }
    }
    Ok((doc.to_bytes(), applied, notices))
}

/// The effective value the produced file would give, against scope, placement and the schemas.
fn validate(ctx: &Context, req: &WriteRequest, bytes: &[u8]) -> Result<(), SnapshotError> {
    let role = ["project", "global", "accounts"][req.target as usize];
    let mut sources = read_sources(&req.roots)?;
    if let Some(source) = sources.iter_mut().find(|s| s.role == role) {
        let (revision, mode, parent) = (sha(bytes), 0, (0, 0));
        source.file = Some(LoadedFile {
            bytes: bytes.to_vec(),
            revision,
            mode,
            parent,
        });
    }
    build(ctx, &req.roots, &sources).map(drop)
}
