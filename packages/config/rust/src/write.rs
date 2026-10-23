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

use crate::docs;
use crate::files::{read_beneath, select_source, LoadedFile, Source};
use crate::files::{PRIVATE_DIR_MODE, PRIVATE_FILE_MODE, YAML_NAME};
use crate::grammar::{block_for_changed_key, block_for_new_key, doc_lines, header_lines};
use crate::grammar::{Actor, Reason};
use crate::locks::{scope_params, GLOBAL_CONFIG, PROJECT_CONFIG};
use crate::schema::{json_at, json_put};
use crate::scope::{judge, SourceKind};
use crate::snapshot::{build, read_sources, Context, SessionClass, Snapshot};
use crate::snapshot::{SnapshotError, SnapshotRequest};
use crate::ConfigRefusal;

const REASON_REQUIRED: &str = "config-comment-reason-required";

/// `Docs` rewrites the `@fgos:doc` lines that differ from the render in every key of the file; it
/// writes no value, needs no reason and is never part of another write (`docs-edit-alone`).
pub enum Edit {
    Set { path: Vec<Segment>, value: Value },
    Unset { path: Vec<Segment> },
    Docs,
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

pub(crate) fn conflict(reason: &str) -> SnapshotError {
    let mut refusal = ConfigRefusal::new("config-write-conflict");
    refusal.detail_mut().keyword = Some(reason.to_string());
    refusal.into()
}

pub(crate) fn sha(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}

pub(crate) fn io_error(error: impl ToString) -> SnapshotError {
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
pub(crate) fn dir_identity(
    root: &Path,
    dir: &Path,
    mode: u32,
) -> Result<DirIdentity, SnapshotError> {
    match ensure_dir_beneath(root, dir, mode).and_then(|d| d.identity()) {
        Err(BeneathError::Refused(_)) => Err(ConfigRefusal::new("config-path-symlink").into()),
        Err(BeneathError::Io(error)) => Err(error.into()),
        Ok(identity) => Ok(identity),
    }
}

/// Takes `lock` for the caller's scope; a lock that stays held is a conflict, the loser writes nothing.
pub(crate) fn hold(
    lock: &str,
    fgos_dir: &Path,
    lock_root: &Path,
    wait_ms: u64,
) -> Result<LockScope<'static>, SnapshotError> {
    let mut scope = LockScope::seeded(Vec::new()).map_err(io_error)?;
    match scope.acquire(lock, &scope_params(fgos_dir, lock_root), Wait::Ms(wait_ms)) {
        Ok(_) => Ok(scope),
        Err(ScopeError::Acquire(why))
            if matches!(*why, Acquire::Held { .. } | Acquire::Timeout { .. }) =>
        {
            Err(conflict("lock-held"))
        }
        Err(other) => Err(io_error(other)),
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
    let refreshing = req.edits.iter().any(|edit| matches!(edit, Edit::Docs));
    if refreshing && req.edits.len() > 1 {
        let mut refusal = ConfigRefusal::new("config-key-out-of-scope");
        refusal.detail_mut().keyword = Some("docs-edit-alone".into());
        return Err(refusal.into());
    }
    // A file that is not there has no doc lines to refresh, and refreshing must not create it.
    if refreshing && seen.is_none() {
        return Ok(WriteResult {
            writer_id: writer.id.to_string(),
            new_revision: "absent".into(),
            applied: Vec::new(),
            notices: Vec::new(),
        });
    }
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
            Edit::Docs => {}
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
    let _scope = hold(lock, &fgos_dir, &req.lock_root, req.lock_wait_ms)?;
    observe(Step::LockHeld)?;
    observe(Step::FirstCheck)?;
    let base = current(req, &at, true)?;
    let (bytes, applied, notices) = produce(
        ctx,
        &req.edits,
        req.acknowledge_comment_loss,
        &actor,
        reason.as_ref(),
        base.as_ref(),
        name,
    )?;
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

/// Whether the edits write no value: each sets what the key inherits already on a key the file does
/// not hold, or is the docs refresh. A file that cannot be read here is not redundant; the
/// transaction refuses it after the lock.
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
            Edit::Docs => true,
        })
}

/// The produced bytes: every edit applied to one in-memory document, each key given its comment
/// block. Nothing is written; any error discards the document. The one producer of a file's bytes:
/// the transaction and the migration both call it.
pub(crate) fn produce(
    ctx: &Context,
    edits: &[Edit],
    acknowledge: bool,
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
    let loss = if acknowledge {
        CommentLoss::Acknowledge
    } else {
        CommentLoss::Refuse
    };
    let (mut applied, mut notices) = (Vec::new(), Vec::new());
    let node = |path: &[Segment]| Some(ctx.schemas.resolve(path)?.node.clone());
    for edit in edits {
        let (Edit::Set { path, .. } | Edit::Unset { path }) = edit else {
            for change in docs::plan(ctx, &doc)? {
                applied.push((format_path(&change.finding.path), false));
                doc.set_comment_block(&change.finding.path, &change.block)?;
            }
            continue;
        };
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
    snapshot_with(ctx, &req.roots, role, bytes).map(drop)
}

/// The snapshot with the source of `role` replaced by `bytes` (not yet on disk): the other sources
/// are read as they are.
pub(crate) fn snapshot_with(
    ctx: &Context,
    roots: &SnapshotRequest,
    role: &str,
    bytes: &[u8],
) -> Result<Snapshot, SnapshotError> {
    let mut sources = read_sources(roots)?;
    if let Some(source) = sources.iter_mut().find(|s| s.role == role) {
        let (revision, mode, parent) = (sha(bytes), 0, (0, 0));
        source.file = Some(LoadedFile {
            bytes: bytes.to_vec(),
            revision,
            mode,
            parent,
        });
    }
    build(ctx, roots, &sources)
}

/// `roots` without the project layer, so a source replaced in `snapshot_with` is read over the machine
/// files alone even while both files of a project exist. A linked worktree keeps the main checkout's
/// commands.
pub(crate) fn without_project(roots: &SnapshotRequest) -> SnapshotRequest {
    let absent = roots.project_root.join(".fgos-absent");
    let linked = roots.trusted_root != roots.project_root;
    SnapshotRequest {
        trusted_root: if linked {
            roots.trusted_root.clone()
        } else {
            absent.clone()
        },
        project_root: absent,
        ..roots.clone()
    }
}

/// Rewrite the `@fgos:doc` lines of `req.target` that differ from the render: [`commit_observed`]
/// with the one docs edit. The reason and any edits of the request are not used.
pub fn refresh(
    ctx: &Context,
    mut req: WriteRequest,
    writer: &WriterIdentity,
    observe: impl FnMut(Step) -> io::Result<()>,
) -> Result<WriteResult, SnapshotError> {
    req.edits = vec![Edit::Docs];
    commit_observed(ctx, &req, writer, observe)
}
