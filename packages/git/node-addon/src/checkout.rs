//! The `checkout` namespace: the Node door to the `fgos-checkout` crate. Every entry takes one request object and
//! answers one JSON value. A refusal is a `napi::Error` whose message is the JSON of the crate's error (`kind`,
//! `message`, `worktreePath`, `command`, `details`), which the Node wrappers map to their own error classes. What a
//! checkout lifecycle step does lives in the crate; this file marshals.
use crate::check;
use fgos_checkout::{
    create_claim_worktree, create_dispatch_worktree, create_verify_checkout, create_worktree,
    list_leftovers, provision_dependencies, reclaim_orphaned_checkout, remove_dispatch_worktree,
    remove_worktree, run_setup_commands, Context, Error as CheckoutError, ErrorKind, Refresh,
    WorkCreate, WorkCreated, WorkRemove,
};
use napi::{Error, Result};
use napi_derive::napi;
use serde::Deserialize;
use serde_json::{json, Map, Value};
use std::path::PathBuf;

/// The repository an entry acts on, as Node resolved it.
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Ctx {
    repo_root: PathBuf,
    state_root: PathBuf,
    writer: String,
}

impl From<Ctx> for Context {
    fn from(c: Ctx) -> Context {
        Context {
            repo_root: c.repo_root,
            state_root: c.state_root,
            writer: c.writer,
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct CreateRequest {
    ctx: Ctx,
    id: String,
    worktree_dir: Option<PathBuf>,
    base_ref: Option<String>,
    start_sha: Option<String>,
    wait_ms: Option<u64>,
}

impl From<CreateRequest> for WorkCreate {
    fn from(r: CreateRequest) -> WorkCreate {
        WorkCreate {
            ctx: r.ctx.into(),
            id: r.id,
            worktree_dir: r.worktree_dir,
            base_ref: r.base_ref,
            start_sha: r.start_sha,
            wait_ms: r.wait_ms,
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct VerifyRequest {
    ctx: Ctx,
    commit: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct RemoveRequest {
    ctx: Ctx,
    path: PathBuf,
    delivered_to: Option<String>,
    retain_to: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct PathRequest {
    ctx: Ctx,
    path: PathBuf,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct LeftoversRequest {
    ctx: Ctx,
    base: Option<String>,
    #[serde(default)]
    include_tip: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct ReclaimRequest {
    ctx: Ctx,
    branch: String,
    caller_cwd: PathBuf,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct DependenciesRequest {
    worktree: PathBuf,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct SetupRequest {
    worktree: PathBuf,
    repo_root: PathBuf,
}

fn kind_name(kind: ErrorKind) -> &'static str {
    match kind {
        ErrorKind::Invalid => "invalid",
        ErrorKind::Git => "git",
        ErrorKind::LockHeld => "lock-held",
        ErrorKind::Provision => "provision",
        ErrorKind::Io => "io",
        ErrorKind::Worktree => "worktree",
    }
}

/// The crate's refusal as the addon's error: the message is its JSON.
fn refusal(e: CheckoutError) -> Error {
    Error::from_reason(
        json!({
            "kind": kind_name(e.kind),
            "message": e.message,
            "worktreePath": e.worktree_path.map(|p| p.display().to_string()),
            "command": e.command,
            "details": e.details,
        })
        .to_string(),
    )
}

/// A request that does not match the entry's contract.
fn bad_request(e: serde_json::Error) -> Error {
    Error::from_reason(
        json!({"kind": "invalid", "message": format!("checkout request invalid: {e}"), "details": {}})
            .to_string(),
    )
}

fn parse<T: for<'de> Deserialize<'de>>(request: Value) -> Result<T> {
    check()?;
    serde_json::from_value(request).map_err(bad_request)
}

/// A crate panic must reach Node as a thrown error, never as an abort of the process.
fn guarded(job: impl FnOnce() -> Result<Value>) -> Result<Value> {
    std::panic::catch_unwind(std::panic::AssertUnwindSafe(job)).unwrap_or_else(|_| {
        Err(Error::from_reason(
            json!({"kind": "panic", "message": "checkout-worker-failed", "details": {}})
                .to_string(),
        ))
    })
}

fn shown(path: &std::path::Path) -> String {
    path.display().to_string()
}

fn refresh_json(r: Refresh) -> Value {
    let mut out = Map::new();
    out.insert("target".into(), json!(r.target));
    out.insert("ahead".into(), json!(r.ahead));
    out.insert("behind".into(), json!(r.behind));
    out.insert("refreshed".into(), json!(r.refreshed));
    for (key, value) in [
        ("reason", r.reason.map(str::to_owned)),
        ("from", r.from),
        ("to", r.to),
        ("detail", r.detail),
    ] {
        if let Some(value) = value {
            out.insert(key.into(), json!(value));
        }
    }
    Value::Object(out)
}

fn created_json(c: WorkCreated) -> Value {
    let mut out = json!({"path": shown(&c.path), "branch": c.branch, "reused": c.reused});
    if let Some(refresh) = c.refresh {
        out["refresh"] = refresh_json(refresh);
    }
    out
}

#[napi(namespace = "checkout", js_name = "createWorktree")]
pub fn create_worktree_entry(request: Value) -> Result<Value> {
    guarded(|| {
        let request: CreateRequest = parse(request)?;
        create_worktree(&request.into())
            .map(created_json)
            .map_err(refusal)
    })
}

#[napi(namespace = "checkout", js_name = "createDispatchWorktree")]
pub fn create_dispatch_worktree_entry(request: Value) -> Result<Value> {
    guarded(|| {
        let request: CreateRequest = parse(request)?;
        create_dispatch_worktree(&request.into())
            .map(created_json)
            .map_err(refusal)
    })
}

#[napi(namespace = "checkout", js_name = "createClaimWorktree")]
pub fn create_claim_worktree_entry(request: Value) -> Result<Value> {
    guarded(|| {
        let request: CreateRequest = parse(request)?;
        create_claim_worktree(&request.into())
            .map(created_json)
            .map_err(refusal)
    })
}

#[napi(namespace = "checkout", js_name = "createVerifyCheckout")]
pub fn create_verify_checkout_entry(request: Value) -> Result<Value> {
    guarded(|| {
        let request: VerifyRequest = parse(request)?;
        create_verify_checkout(&request.ctx.into(), &request.commit)
            .map(|path| json!(shown(&path)))
            .map_err(refusal)
    })
}

#[napi(namespace = "checkout", js_name = "removeWorktree")]
pub fn remove_worktree_entry(request: Value) -> Result<Value> {
    guarded(|| {
        let request: RemoveRequest = parse(request)?;
        remove_worktree(&WorkRemove {
            ctx: request.ctx.into(),
            path: request.path,
            delivered_to: request.delivered_to,
            retain_to: request.retain_to,
        })
        .map(|retained| match retained {
            Some(r) => json!({"retainedRef": r.retained_ref, "snapshot": r.snapshot}),
            None => Value::Null,
        })
        .map_err(refusal)
    })
}

/// Never refuses: the cleanup failures come back as the log lines the caller prints.
#[napi(namespace = "checkout", js_name = "removeDispatchWorktree")]
pub fn remove_dispatch_worktree_entry(request: Value) -> Result<Value> {
    guarded(|| {
        let request: PathRequest = parse(request)?;
        let mut lines: Vec<String> = Vec::new();
        remove_dispatch_worktree(&request.ctx.into(), &request.path, &mut |line| {
            lines.push(line.to_owned())
        });
        Ok(json!(lines))
    })
}

#[napi(namespace = "checkout", js_name = "listLeftovers")]
pub fn list_leftovers_entry(request: Value) -> Result<Value> {
    guarded(|| {
        let request: LeftoversRequest = parse(request)?;
        list_leftovers(
            &request.ctx.into(),
            request.base.as_deref(),
            request.include_tip,
        )
        .map(|rows| {
            Value::Array(
                rows.into_iter()
                    .map(|row| {
                        let mut out = json!({"branch": row.branch, "aheadCount": row.ahead_count});
                        if let Some(tip) = row.tip {
                            out["tip"] = json!(tip);
                        }
                        out
                    })
                    .collect(),
            )
        })
        .map_err(refusal)
    })
}

#[napi(namespace = "checkout", js_name = "reclaimOrphanedCheckout")]
pub fn reclaim_orphaned_checkout_entry(request: Value) -> Result<Value> {
    guarded(|| {
        let request: ReclaimRequest = parse(request)?;
        reclaim_orphaned_checkout(&request.ctx.into(), &request.branch, &request.caller_cwd)
            .map(|r| json!({"reclaimed": r.reclaimed, "path": r.path.map(|p| shown(&p))}))
            .map_err(refusal)
    })
}

#[napi(namespace = "checkout", js_name = "provisionDependencies")]
pub fn provision_dependencies_entry(request: Value) -> Result<Value> {
    guarded(|| {
        let request: DependenciesRequest = parse(request)?;
        provision_dependencies(&request.worktree)
            .map(|installed| json!(installed))
            .map_err(refusal)
    })
}

#[napi(namespace = "checkout", js_name = "runSetupCommands")]
pub fn run_setup_commands_entry(request: Value) -> Result<Value> {
    guarded(|| {
        let request: SetupRequest = parse(request)?;
        run_setup_commands(&request.worktree, &request.repo_root)
            .map(|()| Value::Null)
            .map_err(refusal)
    })
}

/// The version of this entry set; `versions().checkout` reports it.
pub const CONTRACT_VERSION: u32 = 1;
