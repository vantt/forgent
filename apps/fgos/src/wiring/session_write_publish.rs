//! The publisher a head's `session write` goes through: the existing paths land (`fgos_supervision::land`), composed
//! here for the main checkout of the head's project. Nothing in this file commits, fetches or pushes; it only builds
//! the land's ports and reads what the land asks of its caller.
//!
//! - `catch_up` is the land's own first step alone (`fgos_supervision::land::catch_up`): under the target's merge slot
//!   the main checkout is fast-forwarded to the remote tip before anything is written. A branch with commits its
//!   remote lacks (an earlier publish committed but could not push) comes back as `BranchAhead`.
//! - `path_clean` answers whether the path has no uncommitted change in the main checkout (Git's own status read).
//! - `publish` lands the path: only that path is committed with the subject `docs(<role>): write <path>` and the
//!   head's writer key, and the checked-out branch is pushed without force. The gates are the project's `land.gates`
//!   whose `when` matches the path; a land refusal comes back by its own name.
//!
//! The composition root hands it to the supervisor route as a parameter (`fgos_run_supervisor::route::main`).

use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

use fgos_config::detect::PathDetectors;
use fgos_git::{
    GitDriver, HeadFact, Ignored, Inspect, RemoteGrant, RepoHandle, ResolveRepo, Submodules,
    Untracked,
};
use fgos_run_supervisor::route::{CatchUpRefusal, PublishRefusal, WritePublisher};
use fgos_supervision::land::{
    catch_up, land, Gate, LandCommand, LandConfig, LandPorts, Regenerate, ShellRunner,
};
use serde_json::Value;

/// The remote a land publishes to; the same one the sequence counters use.
const REMOTE: &str = "origin";
/// How long the land waits for the target's merge slot and the main checkout.
const WAIT_MS: u64 = 30_000;
/// Status entries per page (the Git door's own bound) and pages read at most: a checkout with more changed paths than
/// this is not a checkout to write into.
const STATUS_PAGE: usize = 4096;
const MAX_STATUS_PAGES: usize = 25;

/// The publisher the composition root hands the supervisor route.
pub fn publisher() -> WritePublisher {
    WritePublisher {
        catch_up: std::sync::Arc::new(catch_up_main),
        path_clean: std::sync::Arc::new(path_clean),
        publish: std::sync::Arc::new(publish),
    }
}

fn refusal(code: &str, detail: impl Into<String>) -> PublishRefusal {
    PublishRefusal {
        code: code.to_owned(),
        detail: detail.into(),
    }
}

struct Checkout {
    driver: GitDriver,
    repo: RepoHandle,
    main: PathBuf,
}

/// The main checkout `root` is, opened. A head works in the main checkout; any other directory has no land to join.
fn open(root: &Path) -> Result<Checkout, PublishRefusal> {
    let main = fgos_git::main_checkout_root(root)
        .map_err(|e| refusal("write-root-unreadable", e.cause))?
        .ok_or_else(|| refusal("write-root-not-a-repository", root.display().to_string()))?;
    let same = std::fs::canonicalize(root).is_ok_and(|real| real == main);
    if !same {
        return Err(refusal(
            "write-root-not-main-checkout",
            format!(
                "{} is not the main checkout {}",
                root.display(),
                main.display()
            ),
        ));
    }
    let (state, _) = fgos_holder_lock::state_root();
    let driver = GitDriver::new(&state).map_err(|e| refusal("write-git-unavailable", e.cause))?;
    let repo = match driver
        .resolve_repo(&main, &main)
        .map_err(|e| refusal("write-git-unavailable", e.cause))?
    {
        ResolveRepo::Repository(repo) => repo,
        ResolveRepo::NotARepository => {
            return Err(refusal(
                "write-root-not-a-repository",
                main.display().to_string(),
            ))
        }
    };
    Ok(Checkout { driver, repo, main })
}

/// Whether `path` has no uncommitted change (tracked, staged, unmerged or untracked) in the main checkout of `root`.
fn path_clean(root: &Path, path: &str) -> Result<bool, PublishRefusal> {
    let checkout = open(root)?;
    let mut cursor = None;
    for _ in 0..MAX_STATUS_PAGES {
        let page = checkout
            .driver
            .status(
                &checkout.repo,
                Untracked::Normal,
                Submodules::IgnoreDirty,
                Ignored::Excluded,
                cursor,
                STATUS_PAGE,
            )
            .map_err(|e| refusal("write-status-unreadable", e.cause))?;
        if page
            .entries
            .iter()
            .any(|entry| entry.path == path.as_bytes())
        {
            return Ok(false);
        }
        if page.complete {
            return Ok(true);
        }
        cursor = page.next_cursor;
    }
    Err(refusal(
        "write-status-unreadable",
        "the checkout has too many changed paths to read",
    ))
}

/// The project's `land.gates` and `land.regenerate` through the config door: project over global over the standard.
fn land_config(main: &Path) -> Result<LandConfig, PublishRefusal> {
    let unreadable = |detail: String| refusal("land-config-unreadable", detail);
    let detectors = PathDetectors {
        path: std::env::var_os("PATH"),
    };
    let ctx =
        fgos_config::machine::context(&detectors).map_err(|e| unreadable(e.code.to_owned()))?;
    let roots = fgos_config::provider::roots(main).map_err(|e| unreadable(e.detail))?;
    let snapshot =
        fgos_config::snapshot::snapshot(&ctx, &roots).map_err(|e| unreadable(format!("{e:?}")))?;
    land_config_of(&snapshot.value).map_err(unreadable)
}

pub fn land_config_of(config: &Value) -> Result<LandConfig, String> {
    let strings = |value: &Value| -> Result<Vec<String>, String> {
        match value {
            Value::Null => Ok(Vec::new()),
            Value::Array(items) => items
                .iter()
                .map(|v| v.as_str().map(str::to_owned))
                .collect::<Option<_>>()
                .ok_or_else(|| "a land path list holds a non-string".to_owned()),
            _ => Err("a land path list is not a list".to_owned()),
        }
    };
    let gates = match &config["land"]["gates"] {
        Value::Null => Vec::new(),
        Value::Array(items) => items
            .iter()
            .map(|gate| {
                Ok(Gate {
                    run: gate["run"]
                        .as_str()
                        .ok_or_else(|| "a land gate has no run command".to_owned())?
                        .to_owned(),
                    when: strings(&gate["when"])?,
                })
            })
            .collect::<Result<_, String>>()?,
        _ => return Err("land.gates is not a list".to_owned()),
    };
    let regenerate = match &config["land"]["regenerate"] {
        Value::Null => None,
        value => Some(Regenerate {
            run: value["run"]
                .as_str()
                .ok_or_else(|| "land.regenerate has no run command".to_owned())?
                .to_owned(),
            files: strings(&value["files"])?,
        }),
    };
    Ok(LandConfig { gates, regenerate })
}

static OPERATIONS: AtomicU64 = AtomicU64::new(0);

/// A fresh operation id on every call: process, clock and a counter, in the characters the Git journal accepts.
fn operation_id() -> String {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |d| d.as_nanos());
    format!(
        "session-write-{}-{nanos}-{}",
        std::process::id(),
        OPERATIONS.fetch_add(1, Ordering::Relaxed)
    )
}

/// The branch the main checkout is on: a paths land commits that branch, so it is the target.
fn checked_out_branch(checkout: &Checkout) -> Result<String, PublishRefusal> {
    match checkout.driver.resolve_head(&checkout.repo) {
        Ok(HeadFact::Attached { target, .. }) => target
            .as_str()
            .strip_prefix("refs/heads/")
            .map(str::to_owned),
        _ => None,
    }
    .ok_or_else(|| {
        refusal(
            "land-target-not-checked-out",
            "the main checkout is not on a branch",
        )
    })
}

fn grant(checkout: &Checkout) -> Result<RemoteGrant, PublishRefusal> {
    Ok(RemoteGrant {
        name: REMOTE.to_owned(),
        pinned_url: Inspect::remote_url(&checkout.driver, &checkout.repo, REMOTE)
            .map_err(|e| refusal("write-remote-unreadable", e.cause))?,
    })
}

/// Fast-forwards the main checkout of `root` to its remote tip as `writer`, under the target's merge slot.
fn catch_up_main(root: &Path, writer: &str) -> Result<(), CatchUpRefusal> {
    let checkout = open(root).map_err(CatchUpRefusal::Refused)?;
    let target = checked_out_branch(&checkout).map_err(CatchUpRefusal::Refused)?;
    let grant = grant(&checkout).map_err(CatchUpRefusal::Refused)?;
    let ports = LandPorts {
        git: &checkout.driver,
        repo: &checkout.repo,
        remote: &grant,
        writer,
        operation_id: &operation_id,
        runner: &ShellRunner,
        wait_ms: WAIT_MS,
    };
    let command = LandCommand {
        target: Some(target),
        ..LandCommand::default()
    };
    catch_up(&command, &ports).map_err(|why| match why.code.as_str() {
        "land-target-ahead" => CatchUpRefusal::BranchAhead(why.detail),
        _ => CatchUpRefusal::Refused(refusal(&why.code, why.detail)),
    })
}

/// Lands `path` from the main checkout of `root` for the head holding `role`, written as `writer`. Returns the commit.
fn publish(root: &Path, path: &str, role: &str, writer: &str) -> Result<String, PublishRefusal> {
    let checkout = open(root)?;
    let config = land_config(&checkout.main)?;
    let grant = grant(&checkout)?;
    let ports = LandPorts {
        git: &checkout.driver,
        repo: &checkout.repo,
        remote: &grant,
        writer,
        operation_id: &operation_id,
        runner: &ShellRunner,
        wait_ms: WAIT_MS,
    };
    let command = LandCommand {
        target: Some(checked_out_branch(&checkout)?),
        paths: Some(vec![path.to_owned()]),
        message: format!("docs({role}): write {path}"),
        ..LandCommand::default()
    };
    land(&command, &config, &ports)
        .map(|landed| landed.main_sha)
        .map_err(|why| refusal(&why.code, why.detail))
}
