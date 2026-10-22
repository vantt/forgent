//! The project id: one random id per repository, minted once by an explicit
//! command and committed as the tracked file `.fgos/project.json`, so every
//! clone on every machine reads the same id.
//!
//! Nothing mints it implicitly. Three machines each holding a clone would
//! otherwise mint three ids before the first push. The read goes through the
//! trusted main checkout, so a linked worktree (which has no `.fgos/`) answers
//! with the main checkout's file.

use crate::errors::Error;
use crate::provider::Refusal;
use crate::text::{iso_utc_now, random_hex128, slug};
use fgos_git::{GitDriver, OperationError, PathValue, RefValue, RepoHandle, TrunkFact};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

/// The tracked file, relative to the main checkout root.
pub const FILE: &str = ".fgos/project.json";
const DIR: &str = ".fgos";
const NAME: &str = "project.json";
const FORMAT_VERSION: u32 = 1;
/// Longest project handle, in characters.
pub const MAX_HANDLE_LENGTH: usize = 40;
/// A tracked file this large is not ours; the remote check reads at most this much of it.
const MAX_FILE_BYTES: usize = 64 * 1024;

/// What `.fgos/project.json` holds.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub v: u32,
    pub project_id: String,
    pub handle: String,
    pub created_at: String,
}

/// 32 lowercase hex characters. The one check of this rule.
pub fn valid_project_id(value: &str) -> bool {
    value.len() == 32 && value.bytes().all(|c| matches!(c, b'0'..=b'9' | b'a'..=b'f'))
}

/// The handle rule is the Convention `project-handle` kind.
pub fn handle_problem(handle: &str) -> Option<&'static str> {
    fgos_convention::rules::packaged_rules()
        .identifier("project-handle")
        .expect("the Convention contract carries the project-handle kind")
        .check(handle)
        .err()
}

/// The handle a name seeds at mint time: its slug, with a `p-` prefix when it
/// starts with a digit, cut to [`MAX_HANDLE_LENGTH`]. `None` when nothing is left.
pub fn handle_from_name(name: &str) -> Option<String> {
    let body = slug(name);
    if body.is_empty() {
        return None;
    }
    let mut handle = if body.starts_with(|c: char| c.is_ascii_digit()) {
        format!("p-{body}")
    } else {
        body
    };
    handle.truncate(MAX_HANDLE_LENGTH);
    handle.truncate(handle.trim_end_matches('-').len());
    Some(handle)
}

fn parse(raw: &str) -> Result<Project, Error> {
    let project: Project = serde_json::from_str(raw)
        .map_err(|e| Error::Invalid(format!("{FILE} is not a project file: {e}")))?;
    if project.v != FORMAT_VERSION {
        return Err(Error::Invalid(format!("{FILE} has format version {}, expected {FORMAT_VERSION}", project.v)));
    }
    if !valid_project_id(&project.project_id) {
        return Err(Error::Invalid(format!("{FILE} holds an invalid project id")));
    }
    if let Some(code) = handle_problem(&project.handle) {
        return Err(Error::Invalid(format!("{FILE} holds an invalid handle ({code})")));
    }
    Ok(project)
}

/// The project file of the main checkout at `root`.
pub fn read(root: &Path) -> Result<Project, Error> {
    let raw = fs::read_to_string(root.join(FILE)).map_err(|e| {
        if e.kind() == std::io::ErrorKind::NotFound {
            Error::Missing(format!("{FILE} is not there"))
        } else {
            Error::Io(e)
        }
    })?;
    parse(&raw)
}

/// Writes a fresh project file. `replace` false never overwrites: an existing
/// file (even an unreadable one) answers `Ok(None)`. `handle` must follow the
/// Convention rule.
pub fn mint(root: &Path, handle: &str, replace: bool) -> Result<Option<Project>, Error> {
    if let Some(code) = handle_problem(handle) {
        return Err(Error::Invalid(format!("handle {handle:?} is not a project handle ({code})")));
    }
    let project = Project {
        v: FORMAT_VERSION,
        project_id: random_hex128()?,
        handle: handle.to_owned(),
        created_at: iso_utc_now(),
    };
    let mut bytes = serde_json::to_vec(&project).expect("Project always serializes");
    bytes.push(b'\n');
    let dir = root.join(DIR);
    fs::create_dir_all(&dir)?;
    if replace {
        fgos_durable_file::replace_durably_with_mode(&dir, NAME, &bytes, 0o644).map(|_| ())
    } else {
        match fgos_durable_file::install_once_with_mode(&dir, NAME, &bytes, 0o644) {
            Ok(fgos_durable_file::Installed::Created) => Ok(()),
            Ok(fgos_durable_file::Installed::AlreadyExists) => return Ok(None),
            Err(e) => Err(e),
        }
    }
    .map_err(Error::Install)?;
    Ok(Some(project))
}

/// Whether the remote's default branch, as last fetched, tracks the file.
/// A repository with no remote default branch answers `false`.
pub fn remote_tracks(driver: &GitDriver, repo: &RepoHandle) -> Result<bool, OperationError> {
    let TrunkFact::Known(trunk) = driver.resolve_trunk(repo, None)? else {
        return Ok(false);
    };
    if !trunk.as_str().starts_with("refs/remotes/") {
        return Ok(false);
    }
    let RefValue::Direct(commit) = driver.resolve_ref(repo, &trunk)? else {
        return Ok(false);
    };
    let reads = driver.paths_at_revision(repo, &commit, &[FILE.as_bytes().to_vec()], MAX_FILE_BYTES)?;
    Ok(reads
        .into_iter()
        .any(|read| matches!(read.value, PathValue::Blob(_) | PathValue::NotABlob(_))))
}

/// The trusted main checkout root of `repo`, and whether `repo` is a linked
/// worktree of it (or has no work tree at all).
fn main_root(repo: &RepoHandle) -> Result<(PathBuf, bool), Refusal> {
    let canonical = |path: &Path| {
        fs::canonicalize(path).map_err(|e| Refusal {
            reason: "project-root-unreadable",
            detail: format!("{}: {e}", path.display()),
        })
    };
    let root = canonical(repo.trusted_main_root())?;
    let linked = match repo.work_tree() {
        Some(tree) => canonical(tree)? != root,
        None => true,
    };
    Ok((root, linked))
}

fn open(driver_dir: &Path, dir: &Path) -> Result<(GitDriver, RepoHandle), Refusal> {
    let git = |e: OperationError| Refusal {
        reason: "git-read-failed",
        detail: e.cause,
    };
    let driver = GitDriver::new(driver_dir).map_err(git)?;
    match driver.resolve_repo(dir, dir).map_err(git)? {
        fgos_git::ResolveRepo::Repository(repo) => Ok((driver, repo)),
        fgos_git::ResolveRepo::NotARepository => Err(Refusal {
            reason: "not-a-repository",
            detail: format!("{} is not inside a git repository", dir.display()),
        }),
    }
}

/// A project as `identity project` prints it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectInfo {
    pub id: String,
    pub handle: String,
    pub created_at: String,
}

impl From<Project> for ProjectInfo {
    fn from(project: Project) -> Self {
        Self {
            id: project.project_id,
            handle: project.handle,
            created_at: project.created_at,
        }
    }
}

/// `identity project --init|--new`: the project minted, and what to run next.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct ProjectMinted {
    #[serde(flatten)]
    pub project: ProjectInfo,
    pub file: &'static str,
    pub commit: String,
}

/// `identity project` read from `dir`: the main checkout's file, also from a
/// linked worktree. `driver_dir` is the fgOS state root the Git driver uses.
pub fn project_info(driver_dir: &Path, dir: &Path) -> Result<ProjectInfo, Refusal> {
    let (_, repo) = open(driver_dir, dir)?;
    let (root, _) = main_root(&repo)?;
    read(&root).map(ProjectInfo::from).map_err(|e| match e {
        Error::Missing(_) => Refusal {
            reason: "project-id-missing",
            detail: "no project id yet; run `fgos identity project --init` once on one machine, commit, and pull elsewhere".into(),
        },
        e => Refusal {
            reason: "project-id-unreadable",
            detail: e.to_string(),
        },
    })
}

/// `identity project --init [--handle h]`, or `--new` (`fork`) which also
/// replaces an existing id and ignores what the remote tracks.
pub fn project_init(
    driver_dir: &Path,
    dir: &Path,
    handle: Option<&str>,
    fork: bool,
) -> Result<ProjectMinted, Refusal> {
    let (driver, repo) = open(driver_dir, dir)?;
    let (root, linked) = main_root(&repo)?;
    if linked {
        return Err(Refusal {
            reason: "linked-worktree",
            detail: format!("the project id is minted on the main checkout ({}), never in a linked worktree", root.display()),
        });
    }
    if !fork {
        match read(&root) {
            Err(Error::Missing(_)) => {}
            _ => {
                return Err(Refusal {
                    reason: "project-id-exists",
                    detail: format!("{FILE} already exists; `--new` replaces it on purpose (a fork split)"),
                })
            }
        }
        let tracked = remote_tracks(&driver, &repo).map_err(|e| Refusal {
            reason: "git-read-failed",
            detail: e.cause,
        })?;
        if tracked {
            return Err(Refusal {
                reason: "project-id-on-remote",
                detail: format!("the remote default branch already tracks {FILE}; pull it instead of minting a second id"),
            });
        }
    }
    let handle = match handle {
        Some(handle) => handle.to_owned(),
        None => root
            .file_name()
            .and_then(|name| handle_from_name(&name.to_string_lossy()))
            .ok_or_else(|| Refusal {
                reason: "invalid-handle",
                detail: "the folder name gives no handle; pass `--handle <name>`".into(),
            })?,
    };
    if let Some(code) = handle_problem(&handle) {
        return Err(Refusal {
            reason: "invalid-handle",
            detail: format!("handle {handle:?} is not a project handle ({code})"),
        });
    }
    let minted = mint(&root, &handle, fork).map_err(|e| Refusal {
        reason: "project-write-failed",
        detail: e.to_string(),
    })?;
    let project = minted.ok_or_else(|| Refusal {
        reason: "project-id-exists",
        detail: format!("{FILE} appeared while minting; read it with `fgos identity project`"),
    })?;
    Ok(ProjectMinted {
        project: project.into(),
        file: FILE,
        commit: format!("git add {FILE} && git commit -m 'chore: add the project id' -- {FILE}"),
    })
}
