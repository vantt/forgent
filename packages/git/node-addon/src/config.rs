//! `config` namespace: the Node door to the `fgos-config` crate. Every entry takes one request object and
//! returns one JSON text, which the Node facade turns into prototype-free objects (a key of a user file, such
//! as `__proto__`, is data and must never reach a prototype); what a value means lives in the crate.
//!
//! A refusal is the JSON message of the error (`marshal::Failure`): the first failure id and every refusal
//! with its file, position, path and keyword, never a value. This door adds three ids of its own:
//! `config-request-invalid` (the request breaks the entry's contract; the keyword names the field),
//! `config-trusted-root-unresolved` (the main checkout could not be established; the keyword is the cause)
//! and `config-internal-error` (a panic, caught at the boundary, nothing printed).
use std::path::{Component, Path, PathBuf};
use std::sync::{Mutex, PoisonError};

use fgos_config::detect::{Detectors, NoDetectors, PathDetectors};
use fgos_config::machine::{self, accounts};
use fgos_config::snapshot::{AccountsState, Context, SessionClass};
use fgos_config::snapshot::{SnapshotError, SnapshotRequest};
use fgos_config::ConfigRefusal;
use fgos_git::{GitDriver, ResolveRepo};
use napi::Result;
use napi_derive::napi;
use serde::Deserialize;
use serde_json::{json, Value};

use crate::check;
use crate::marshal::{guarded_as, Failure, More};

type Res<T> = std::result::Result<T, Failure>;

/// Main checkouts the door remembers, one per project root.
const MEMO_SLOTS: usize = 16;

/// Every field an entry may take; an entry reads what it needs and an unknown field is refused.
#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase", deny_unknown_fields)]
struct Request {
    global_dir: String,
    class: String,
    project_root: Option<String>,
    rows: Vec<String>,
    ids: Vec<String>,
    acknowledge: bool,
}

fn detailed(id: &str, more: More) -> Failure {
    Failure {
        id: id.into(),
        more: Some(Box::new(more)),
        ..Failure::default()
    }
}

fn failure(id: &str, keyword: impl Into<String>) -> Failure {
    let keyword = Some(keyword.into());
    detailed(
        id,
        More {
            keyword,
            ..More::default()
        },
    )
}

fn invalid(field: &str) -> Failure {
    failure("config-request-invalid", field)
}

fn refusal(r: &ConfigRefusal) -> Failure {
    let keyword = r.detail.as_ref().and_then(|d| d.keyword.clone());
    let keyword = keyword.or_else(|| r.yaml.as_ref().map(|y| y.rule.to_string()));
    let mut out = detailed(
        r.code,
        More {
            path: r.path.clone(),
            keyword,
            ..More::default()
        },
    );
    (out.file, out.line, out.column) = (r.file.clone().unwrap_or_default(), r.line, r.column);
    out
}

impl From<SnapshotError> for Failure {
    fn from(error: SnapshotError) -> Failure {
        match error {
            SnapshotError::Refused(all) => {
                let refusals = all.iter().map(refusal).collect();
                detailed(
                    all.first().map_or("config-refused", |r| r.code),
                    More {
                        refusals,
                        ..More::default()
                    },
                )
            }
            SnapshotError::Io(e) => failure("config-io", format!("{:?}", e.kind())),
        }
    }
}

fn absolute(text: &str, field: &str) -> Res<PathBuf> {
    let path = Path::new(text);
    let plain = !path.components().any(|c| c == Component::ParentDir);
    (path.is_absolute() && plain)
        .then(|| path.into())
        .ok_or_else(|| invalid(field))
}

impl Request {
    /// The roots of a call. `trusted` resolves the main checkout, where a linked worktree's `command` values
    /// come from; a request with no project root names the global directory for both.
    fn roots(&self, trusted: bool) -> Res<SnapshotRequest> {
        let class = match self.class.as_str() {
            "confined" => SessionClass::Confined,
            "unconfined" => SessionClass::Unconfined,
            _ => return Err(invalid("class")),
        };
        let global_dir = absolute(&self.global_dir, "globalDir")?;
        let project_root = match &self.project_root {
            Some(root) => std::fs::canonicalize(absolute(root, "projectRoot")?)
                .map_err(|_| invalid("projectRoot"))?,
            None => global_dir.clone(),
        };
        let resolve = trusted && self.project_root.is_some();
        let trusted_root = if resolve {
            trusted_root(&project_root)?
        } else {
            project_root.clone()
        };
        Ok(SnapshotRequest {
            project_root,
            trusted_root,
            global_dir,
            class,
        })
    }

    fn project(&self) -> Res<()> {
        self.project_root
            .as_ref()
            .map(drop)
            .ok_or_else(|| invalid("projectRoot"))
    }
}

/// Identity of the repository entry of a project root: what a resolved main checkout was derived from (a
/// linked worktree's pointer file with its size and mtime, or the main checkout's directory).
fn stamp_of(project: &Path) -> Option<[i64; 4]> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        let meta = std::fs::symlink_metadata(project.join(".git")).ok()?;
        let file = meta.is_file();
        let mtime = if file {
            meta.mtime() * 1_000_000_000 + meta.mtime_nsec()
        } else {
            0
        };
        (file || meta.is_dir()).then_some([
            meta.dev() as i64,
            meta.ino() as i64,
            if file { meta.size() as i64 } else { -1 },
            mtime,
        ])
    }
    #[cfg(not(unix))]
    None
}

/// The main checkout of `project` (the project itself outside a repository), memoised per project root while
/// its repository entry is unchanged: establishing it reads the repository, which a read must not pay every time.
fn trusted_root(project: &Path) -> Res<PathBuf> {
    static MEMO: Mutex<Vec<(PathBuf, [i64; 4], PathBuf)>> = Mutex::new(Vec::new());
    let stamp = stamp_of(project);
    let mut memo = MEMO.lock().unwrap_or_else(PoisonError::into_inner);
    if let Some((.., main)) = memo
        .iter()
        .find(|(root, at, _)| root == project && Some(*at) == stamp)
    {
        return Ok(main.clone());
    }
    let unresolved = |cause: String| failure("config-trusted-root-unresolved", cause);
    let driver = GitDriver::new(&fgos_holder_lock::state_root::state_root().0)
        .map_err(|e| unresolved(e.cause))?;
    let main = match driver
        .resolve_repo(project, project)
        .map_err(|e| unresolved(e.cause))?
    {
        ResolveRepo::Repository(repo) => std::fs::canonicalize(repo.trusted_main_root())
            .map_err(|e| unresolved(format!("{:?}", e.kind())))?,
        ResolveRepo::NotARepository => project.to_path_buf(),
    };
    if let Some(stamp) = stamp {
        memo.retain(|(root, ..)| root != project);
        memo.truncate(MEMO_SLOTS - 1);
        memo.push((project.to_path_buf(), stamp, main.clone()));
    }
    Ok(main)
}

fn accounts_name(state: AccountsState) -> &'static str {
    if state == AccountsState::Present {
        "present"
    } else {
        "unavailable-confined"
    }
}

fn on_path() -> PathDetectors {
    PathDetectors {
        path: std::env::var_os("PATH"),
    }
}

fn context(detectors: &dyn Detectors) -> Res<Context<'_>> {
    machine::context(detectors).map_err(|r| SnapshotError::from(r).into())
}

/// Runs an entry: parses the request, catches a panic (nothing is printed), answers JSON text.
fn entry(args: Value, run: impl FnOnce(Request) -> Res<Value>) -> Result<String> {
    check()?;
    let request = serde_json::from_value(args).map_err(|_| invalid("request"));
    Ok(guarded_as("config-internal-error", || {
        run(request?).map(|v| v.to_string())
    })?)
}

/// The account pools alone, readable with no valid project or global file: `{ present, state, revision,
/// runner }`. `{ globalDir, class }`.
#[napi(namespace = "config", js_name = "accounts")]
pub fn accounts_entry(args: Value) -> Result<String> {
    entry(args, |a| {
        let view = accounts::read(&context(&NoDetectors)?, &a.roots(false)?)?;
        Ok(
            json!({ "present": view.present, "state": accounts_name(view.state), "revision": view.revision, "runner": view.value.get("runner") }),
        )
    })
}

#[cfg(unix)]
mod unix {
    use super::*;
    use fgos_config::doctor::{check, Consumer, Severity};
    use fgos_config::repair::fix;
    use fgos_config::scope::SourceKind;
    use fgos_config::write::{target_revision, WriteRequest};

    const LOCK_WAIT_MS: u64 = 5_000;

    pub fn check_entry(a: Request) -> Res<Value> {
        a.project()?;
        let detectors = on_path();
        let found = check(
            &context(&detectors)?,
            &a.roots(true)?,
            std::time::SystemTime::now(),
        );
        let rows = found.iter().filter(|f| a.rows.is_empty() || a.rows.iter().any(|r| r == f.row)).map(|f| {
            let severity = if f.severity(Consumer::Doctor) == Severity::Fail { "fail" } else { "warn" };
            json!({ "row": f.row, "severity": severity, "file": f.file, "line": f.line, "column": f.column, "path": f.path, "fix": f.fix, "detail": f.detail })
        });
        Ok(json!({ "findings": rows.collect::<Vec<_>>() }))
    }

    pub fn fix_entry(a: Request) -> Res<Value> {
        a.project()?;
        let (roots, detectors) = (a.roots(true)?, on_path());
        let lock_root = fgos_holder_lock::state_root::lock_root();
        // Each repair asks for the request of the file it edits; the transaction reads that file again.
        let request = |target: SourceKind| WriteRequest {
            roots: roots.clone(),
            lock_root: lock_root.clone(),
            target,
            expected: target_revision(&roots, target).ok().flatten(),
            edits: Vec::new(),
            reason: String::new(),
            acknowledge_comment_loss: a.acknowledge,
            lock_wait_ms: LOCK_WAIT_MS,
        };
        let ids: Vec<&str> = a.ids.iter().map(String::as_str).collect();
        let writer = fgos_identity::resolve_current(None);
        let done = fix(&context(&detectors)?, request, &writer, &ids, a.acknowledge)?;
        let changed = done
            .applied
            .iter()
            .map(|(fix, path)| json!({ "fix": fix, "path": path }));
        Ok(json!({ "changed": changed.collect::<Vec<_>>(), "skipped": done.skipped }))
    }
}

/// Writes and the findings engine need the no-follow primitives of Durable File, which are Unix only.
#[cfg(not(unix))]
mod unix {
    use super::*;

    pub fn check_entry(_: Request) -> Res<Value> {
        Err(failure("config-platform-unsupported", "write"))
    }
    pub use check_entry as fix_entry;
}

/// The findings of the config files of a project and the machine, each source judged on its own, with the
/// doctor severities: `{ findings: [{ row, severity, file, line, column, path, fix, detail }] }`.
/// `{ projectRoot, globalDir, class, rows? }`; `rows` keeps only the named rows.
#[napi(namespace = "config", js_name = "check")]
pub fn check_config(args: Value) -> Result<String> {
    entry(args, unix::check_entry)
}

/// Applies the named repairs a check offered, as the writer this process resolves to: `{ changed: [{ fix,
/// path }], skipped }`. A confined class is `config-write-confined`. `{ projectRoot, globalDir, class, ids,
/// acknowledge? }`.
#[napi(namespace = "config", js_name = "fix")]
pub fn fix_config(args: Value) -> Result<String> {
    entry(args, unix::fix_entry)
}
