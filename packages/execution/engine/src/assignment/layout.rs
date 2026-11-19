//! Read-only assignment layout. The walk stops at `runs`: worker-owned descendants are not repositories.

use std::fs;
use std::io::ErrorKind;
use std::path::{Component, Path, PathBuf};

use serde_json::Value;

pub const ASSIGNMENT_LAYOUT_MAX_DEPTH: usize = 16;

/// Entries of a directory in byte order of their UTF-8 names (the order the Unix Rust walk uses); an unreadable
/// directory has none.
fn entries(dir: &Path) -> Vec<fs::DirEntry> {
    let Ok(read) = fs::read_dir(dir) else {
        return Vec::new();
    };
    let mut keyed: Vec<(Vec<u8>, fs::DirEntry)> = read
        .filter_map(Result::ok)
        .map(|entry| {
            (
                entry.file_name().to_string_lossy().as_bytes().to_vec(),
                entry,
            )
        })
        .collect();
    keyed.sort_by(|a, b| a.0.cmp(&b.0));
    keyed.into_iter().map(|(_, entry)| entry).collect()
}

fn regular_file(file: &Path) -> bool {
    fs::symlink_metadata(file).is_ok_and(|meta| meta.is_file())
}

fn read_json(file: &Path) -> Option<Value> {
    if !regular_file(file) {
        return None;
    }
    serde_json::from_str(&fs::read_to_string(file).ok()?).ok()
}

/// `path.resolve`: absolute, with `.` and `..` folded away lexically.
fn resolve(path: &Path) -> PathBuf {
    let absolute = if path.is_absolute() {
        path.to_path_buf()
    } else {
        std::env::current_dir().unwrap_or_default().join(path)
    };
    let mut out = PathBuf::new();
    for component in absolute.components() {
        match component {
            Component::ParentDir => {
                out.pop();
            }
            Component::CurDir => {}
            other => out.push(other.as_os_str()),
        }
    }
    out
}

/// Resolve the existing ancestor as well as the missing suffix. A missing claim file must not make a symlinked
/// assignment ancestor pass a spelling-only guard.
fn real_path(file: &Path) -> Option<PathBuf> {
    let mut cursor = resolve(file);
    let mut suffix: Vec<std::ffi::OsString> = Vec::new();
    loop {
        match fs::canonicalize(&cursor) {
            Ok(real) => {
                let mut joined = real;
                for part in suffix.iter().rev() {
                    joined.push(part);
                }
                return Some(joined);
            }
            Err(err) if err.kind() == ErrorKind::NotFound => {
                if fs::symlink_metadata(&cursor).is_ok_and(|meta| meta.file_type().is_symlink()) {
                    return None;
                }
                let parent = cursor.parent()?.to_path_buf();
                suffix.push(cursor.file_name()?.to_os_string());
                cursor = parent;
            }
            Err(_) => return None,
        }
    }
}

/// Whether `candidate` lies inside `parent` once both are resolved through their real ancestors.
pub fn is_within_dir(parent: &Path, candidate: &Path) -> bool {
    match (real_path(parent), real_path(candidate)) {
        (Some(parent), Some(candidate)) => candidate.starts_with(&parent),
        _ => false,
    }
}

/// Guard a caller-supplied nested id before joining any read or mutation path.
pub fn assignment_dir(fgos_dir: &Path, assignment_id: &str) -> Option<PathBuf> {
    if assignment_id.is_empty()
        || assignment_id.starts_with('/')
        || Path::new(assignment_id).is_absolute()
    {
        return None;
    }
    if assignment_id
        .split('/')
        .any(|part| part.is_empty() || part == "." || part == "..")
    {
        return None;
    }
    let base = resolve(&fgos_dir.join("assignments"));
    let dir = resolve(&base.join(assignment_id));
    is_within_dir(&base, &dir).then_some(dir)
}

/// One attempt directory the walk found.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RunDirEntry {
    pub assignment_id: String,
    pub attempt: String,
    pub run_dir: PathBuf,
    pub has_assignment_json: bool,
}

/// What the walk found: the attempt directories, how many candidates a barrier (a symlink, the depth limit)
/// skipped (in first-seen order of the reason) and how many run directories it saw.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct AssignmentLayout {
    pub runs: Vec<RunDirEntry>,
    pub skipped: Vec<(&'static str, u64)>,
    pub run_dirs_seen: u64,
}

impl AssignmentLayout {
    fn barrier(&mut self, reason: &'static str) {
        self.run_dirs_seen += 1;
        match self.skipped.iter_mut().find(|(name, _)| *name == reason) {
            Some((_, count)) => *count += 1,
            None => self.skipped.push((reason, 1)),
        }
    }

    fn walk(&mut self, base: &Path, dir: &Path, depth: usize) {
        for entry in entries(dir) {
            let child = dir.join(entry.file_name());
            let Ok(kind) = entry.file_type() else {
                continue;
            };
            if kind.is_symlink() {
                self.barrier("symlink");
                continue;
            }
            if !kind.is_dir() {
                continue;
            }
            if entry.file_name() == "runs" {
                let assignment_id = dir
                    .strip_prefix(base)
                    .map(|rel| {
                        rel.components()
                            .map(|c| c.as_os_str().to_string_lossy().into_owned())
                            .collect::<Vec<_>>()
                            .join("/")
                    })
                    .unwrap_or_default();
                let has_assignment_json = regular_file(&dir.join("assignment.json"));
                for attempt in entries(&child) {
                    let Ok(kind) = attempt.file_type() else {
                        continue;
                    };
                    if kind.is_symlink() {
                        self.barrier("symlink");
                        continue;
                    }
                    if !kind.is_dir() {
                        continue;
                    }
                    self.run_dirs_seen += 1;
                    self.runs.push(RunDirEntry {
                        assignment_id: assignment_id.clone(),
                        attempt: attempt.file_name().to_string_lossy().into_owned(),
                        run_dir: child.join(attempt.file_name()),
                        has_assignment_json,
                    });
                }
            } else if depth >= ASSIGNMENT_LAYOUT_MAX_DEPTH {
                self.barrier("depth");
            } else {
                self.walk(base, &child, depth + 1);
            }
        }
    }
}

/// Directory-only accounting shared by the lister and the doctor coverage check. A barrier counts one skipped
/// candidate; its hidden descendants are never read. Assignment metadata and run or result validity are
/// deliberately not admission rules.
pub fn scan_assignment_layout(fgos_dir: &Path) -> AssignmentLayout {
    let base = resolve(&fgos_dir.join("assignments"));
    let mut layout = AssignmentLayout::default();
    if let Ok(meta) = fs::symlink_metadata(&base) {
        if meta.file_type().is_symlink() {
            layout.barrier("symlink");
        } else if meta.is_dir() {
            layout.walk(&base, &base, 0);
        }
    }
    layout
}

pub fn list_assignment_runs(fgos_dir: &Path) -> Vec<RunDirEntry> {
    scan_assignment_layout(fgos_dir).runs
}

/// Two attempt directories claim one run id.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RunLookupError {
    pub run_id: String,
    pub locations: Vec<PathBuf>,
}

impl RunLookupError {
    pub const CODE: &'static str = "run-ambiguous";
}

impl std::fmt::Display for RunLookupError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let places: Vec<String> = self
            .locations
            .iter()
            .map(|p| p.display().to_string())
            .collect();
        write!(
            f,
            "run \"{}\" has multiple materializations: {}",
            self.run_id,
            places.join(", ")
        )
    }
}

impl std::error::Error for RunLookupError {}

/// Ids are fields, never paths. Prefer run metadata, including unsettled runs.
pub fn find_run_dir(fgos_dir: &Path, run_id: &str) -> Result<Option<PathBuf>, RunLookupError> {
    if run_id.is_empty() {
        return Ok(None);
    }
    let id_of = |doc: &Option<Value>| {
        doc.as_ref()
            .and_then(|v| v.get("runId"))
            .filter(|v| !v.is_null())
            .cloned()
    };
    let wanted = Value::String(run_id.to_string());
    let mut locations: Vec<PathBuf> = Vec::new();
    for entry in list_assignment_runs(fgos_dir) {
        let run = id_of(&read_json(&entry.run_dir.join("run.json")));
        let hit = match &run {
            Some(id) => *id == wanted,
            None => id_of(&read_json(&entry.run_dir.join("result.json"))).as_ref() == Some(&wanted),
        };
        if hit {
            locations.push(entry.run_dir);
        }
    }
    if locations.len() > 1 {
        return Err(RunLookupError {
            run_id: run_id.to_string(),
            locations,
        });
    }
    Ok(locations.into_iter().next())
}

/// The skipped counts as the vectors state them: an object in first-seen order.
pub fn skipped_json(layout: &AssignmentLayout) -> Value {
    let mut map = serde_json::Map::new();
    for (reason, count) in &layout.skipped {
        map.insert((*reason).to_string(), Value::from(*count));
    }
    Value::Object(map)
}
