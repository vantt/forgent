//! What is recorded before the worker starts: the sha256 of every pinned input, of each file already dirty in the
//! checkout, and the evaluator baseline that ties them to the run.

use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use fgos_git::{GitDriver, InspectCursor, ResolveRepo};
use fgos_run_supervisor::controller::proof::publish_immutable_proof;
use serde_json::{json, Map, Value};
use sha2::{Digest, Sha256};

use crate::contract::effective::compute_sha256_digest;
use crate::transport::visibility_session::iso_now;

const PAGE: usize = 4096;

/// The checkouts a pinned input may live in: the main checkout and every worktree git lists for it.
pub trait CheckoutRoots {
    /// Real paths of the main checkout and of each listed worktree that is not now a symlink; a root that is gone
    /// or cannot be listed holds nothing.
    fn allowed_roots(&self, main_root: &Path) -> Vec<PathBuf>;
}

/// The roots as `fgos-git` lists them.
pub struct GitCheckoutRoots;

impl CheckoutRoots for GitCheckoutRoots {
    fn allowed_roots(&self, main_root: &Path) -> Vec<PathBuf> {
        let mut roots: Vec<PathBuf> = Vec::new();
        let mut add = |path: &Path| {
            if let Ok(real) = fs::canonicalize(path) {
                if !roots.contains(&real) {
                    roots.push(real);
                }
            }
        };
        add(main_root);
        let listed = (|| {
            let driver = GitDriver::new(main_root).ok()?;
            let repo = match driver.resolve_repo(main_root, main_root).ok()? {
                ResolveRepo::Repository(repo) => repo,
                _ => return None,
            };
            let mut out = Vec::new();
            let mut cursor: Option<InspectCursor> = None;
            loop {
                let page = driver.list_worktrees(&repo, cursor, PAGE).ok()?;
                out.extend(page.entries.into_iter().map(|e| e.path));
                match page.next_cursor {
                    Some(next) => cursor = Some(next),
                    None => return Some(out),
                }
            }
        })();
        for raw in listed.unwrap_or_default() {
            let path = PathBuf::from(String::from_utf8_lossy(&raw).into_owned());
            // A listed path that is now a symlink is not that worktree any more.
            match fs::symlink_metadata(&path) {
                Ok(meta) if !meta.file_type().is_symlink() => add(&path),
                _ => {}
            }
        }
        roots
    }
}

fn sha256_hex(bytes: &[u8]) -> String {
    Sha256::digest(bytes)
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect()
}

/// Hash each pinned input before the worker starts. An input is read only when its real path lies inside the main
/// checkout or a worktree git lists for it; anything else (outside, a symlink pointing out, missing) is recorded
/// with `sha256: null` and never read. `rel` is the path inside the root that holds it, so a consumer compares the
/// same file across checkouts.
pub fn digest_pinned_inputs(
    pin_inputs: &[String],
    main_root: &Path,
    roots: &dyn CheckoutRoots,
) -> Vec<Value> {
    if pin_inputs.is_empty() {
        return Vec::new();
    }
    let roots = roots.allowed_roots(main_root);
    pin_inputs
        .iter()
        .map(|given| {
            let Ok(real) = fs::canonicalize(given) else {
                return json!({ "path": given, "sha256": null, "warning": "pin-missing" });
            };
            // The innermost root that holds it: a worktree may sit inside the main checkout.
            let root = roots
                .iter()
                .filter(|root| real.starts_with(root))
                .max_by_key(|root| root.as_os_str().len());
            let Some(root) = root else {
                return json!({ "path": given, "sha256": null, "warning": "pin-outside-allowed-roots" });
            };
            let rel = real
                .strip_prefix(root)
                .map(|r| {
                    r.components()
                        .map(|c| c.as_os_str().to_string_lossy().into_owned())
                        .collect::<Vec<_>>()
                        .join("/")
                })
                .unwrap_or_default();
            let root_text = root.to_string_lossy();
            let base = |warning: Option<&str>, sha: Option<String>| {
                let mut out = Map::new();
                out.insert("path".into(), json!(given));
                out.insert("root".into(), json!(root_text));
                out.insert("rel".into(), json!(rel));
                out.insert("sha256".into(), json!(sha));
                if let Some(warning) = warning {
                    out.insert("warning".into(), json!(warning));
                }
                Value::Object(out)
            };
            match fs::metadata(&real) {
                Ok(meta) if meta.is_file() => match fs::read(&real) {
                    Ok(bytes) => base(None, Some(sha256_hex(&bytes))),
                    Err(_) => base(Some("pin-unreadable"), None),
                },
                Ok(_) => base(Some("pin-not-a-file"), None),
                Err(_) => base(Some("pin-unreadable"), None),
            }
        })
        .collect()
}

/// The existence and sha256 of one file dirty before the launch.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DirtySnapshot {
    pub hash: Option<String>,
    pub exists: bool,
}

/// The existence and sha256 of each file dirty before the launch, so a later change to one is seen. A file that
/// cannot be read leaves no entry.
pub fn snapshot_dirty_before_files(
    dir: &Path,
    dirty_before: &[String],
) -> Vec<(String, DirtySnapshot)> {
    dirty_before
        .iter()
        .filter_map(|rel| {
            let full = dir.join(rel);
            let snapshot = if full.exists() {
                DirtySnapshot {
                    hash: Some(sha256_hex(&fs::read(&full).ok()?)),
                    exists: true,
                }
            } else {
                DirtySnapshot {
                    hash: None,
                    exists: false,
                }
            };
            Some((rel.clone(), snapshot))
        })
        .collect()
}

/// What the evaluator baseline records of the checkout before the launch.
pub struct Baseline<'a> {
    pub run_dir: &'a Path,
    pub run_id: &'a str,
    pub assignment_id: &'a str,
    pub cwd: &'a str,
    pub git_before: Option<&'a str>,
    pub dirty_before: &'a [String],
    pub dirty_before_snapshots: &'a [(String, DirtySnapshot)],
    pub captured_at: Option<&'a str>,
}

/// The evaluator baseline body (dirty files with their hashes, HEAD) before its digest is added.
pub fn evaluator_baseline_body(baseline: &Baseline<'_>) -> Value {
    let mut snapshots = Map::new();
    for (path, snapshot) in baseline.dirty_before_snapshots {
        snapshots.insert(
            path.clone(),
            json!({ "exists": snapshot.exists, "sha256": snapshot.hash }),
        );
    }
    json!({
        "contract": "evaluator-baseline.v1",
        "runId": baseline.run_id,
        "assignmentId": baseline.assignment_id,
        "cwd": baseline.cwd,
        "gitBefore": baseline.git_before,
        "gitBeforeSource": "pre-launch",
        "dirtyBefore": baseline.dirty_before,
        "dirtyBeforeSnapshots": Value::Object(snapshots),
        "capturedAt": baseline.captured_at.map(str::to_string).unwrap_or_else(iso_now),
    })
}

/// Publish the Evaluator Baseline before launch; returns its digest. A baseline already published stands.
pub fn publish_evaluator_baseline(baseline: &Baseline<'_>) -> io::Result<String> {
    let body = evaluator_baseline_body(baseline);
    let digest = compute_sha256_digest(&body);
    let mut record = body;
    record["digest"] = json!(digest);
    publish_immutable_proof(
        &baseline
            .run_dir
            .join("controller")
            .join("evaluator-baseline.json"),
        &record,
    )?;
    Ok(digest)
}
