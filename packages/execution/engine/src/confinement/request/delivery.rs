//! Who delivers a request's controls and whether its declared own worktree can be honoured.

use std::path::{Component, Path, PathBuf};

use serde_json::Value;

use super::error::RequestError;
use super::js::{at, coalesce, get, truthy};
use crate::confinement::policy::{control_delivery, ControlDelivery};

/// The backend a request runs under: the one it names, else the required mode's default (`bwrap`).
pub fn effective_backend_of(request: &Value) -> Option<Value> {
    let required =
        at(request, &["requirement", "mode"]).and_then(Value::as_str) == Some("required");
    coalesce(get(request, "backendId"), None)
        .cloned()
        .or_else(|| required.then(|| Value::String("bwrap".into())))
}

/// Who delivers the controls of `request` (`control_delivery`), judged on the request itself. The seat checks after
/// the authority take this same answer: the prepared-invocation record keeps only the requirement's digest.
pub fn control_delivery_of(request: &Value) -> ControlDelivery {
    let kind = at(request, &["assignmentLaunchContext", "kind"]).and_then(Value::as_str);
    let backend = effective_backend_of(request);
    control_delivery(kind, get(request, "requirement"), truthy(backend.as_ref()))
}

/// `path.resolve(p)`: absolute and normalised, without touching the file system.
fn resolved(p: &str) -> PathBuf {
    let base = if Path::new(p).is_absolute() {
        PathBuf::new()
    } else {
        std::env::current_dir().unwrap_or_default()
    };
    let mut out = PathBuf::new();
    for part in base.join(p).components() {
        match part {
            Component::ParentDir => {
                out.pop();
            }
            Component::CurDir => {}
            other => out.push(other.as_os_str()),
        }
    }
    out
}

/// Whether a declared ownWorktree cannot be honoured: the dispatch runs in the repo root itself. A head session
/// under a required backend that denies host writes is the exception (`control_delivery`).
///
/// A request whose `context.cwd` is not a string cannot be compared and is refused (a validated request always
/// has one).
pub fn own_worktree_unavailable(
    request: &Value,
    has_own_worktree: bool,
) -> Result<bool, RequestError> {
    let repo_root = at(request, &["context", "repoRoot"]).filter(|r| truthy(Some(r)));
    let (true, Some(repo_root)) = (has_own_worktree, repo_root) else {
        return Ok(false);
    };
    if control_delivery_of(request).root_workspace_allowed {
        return Ok(false);
    }
    let Some(cwd) = at(request, &["context", "cwd"]).and_then(Value::as_str) else {
        return Err(RequestError::plain(
            "context.cwd must be a string to compare it with the repo root.",
        ));
    };
    Ok(repo_root
        .as_str()
        .is_some_and(|root| resolved(cwd) == resolved(root)))
}
