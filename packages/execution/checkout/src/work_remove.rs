//! Take back one Work checkout, the way the runner and the merge path do: under the checkout's custody lease, with
//! what provisioning placed set aside, and with a forced session HEAD kept as evidence.

use crate::context::Context;
use crate::remove::around_removal;
use crate::{git, Error, Result};
use fgos_git::{IgnoredBytes, Oid, RestoreRequest, WorktreeDelivery};
use serde_json::json;
use sha2::{Digest, Sha256};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone)]
pub struct WorkRemove {
    pub ctx: Context,
    pub path: PathBuf,
    /// The commit or ref the checkout's tip must be contained in; its own tip when `None`.
    pub delivered_to: Option<String>,
    /// A commit the checkout is first reset to; the HEAD it held is pinned as evidence.
    pub retain_to: Option<String>,
}

/// The evidence kept when `retain_to` moved the checkout's HEAD before the removal.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Retained {
    pub retained_ref: String,
    pub snapshot: String,
}

fn is_object_id(value: &str) -> bool {
    matches!(value.len(), 40 | 64)
        && value
            .bytes()
            .all(|b| matches!(b, b'0'..=b'9' | b'a'..=b'f'))
}

/// Remove `path`, never its branch. Every refusal is a `Worktree` error worded `git worktree remove failed for
/// "<path>": <cause>`, with `retainedRef` and `snapshot` when the HEAD was already pinned. A failed prune
/// afterwards is not an error: the removal already happened.
pub fn remove_worktree(request: &WorkRemove) -> Result<Option<Retained>> {
    let operation = git::operation_id("worktree");
    let mut retained: Option<Retained> = None;
    let outcome = remove_under_custody(request, &operation, &mut retained);
    if let Err(error) = outcome {
        let shown = request.path.display().to_string();
        let kept = retained
            .as_ref()
            .map(|r| {
                format!(
                    "; commit preserved at {}; snapshot {}",
                    r.retained_ref, r.snapshot
                )
            })
            .unwrap_or_default();
        let mut wrapped = Error::worktree(format!(
            "git worktree remove failed for \"{shown}\": {}{kept}",
            error.message
        ))
        .detail("worktreePath", shown);
        if let Some(r) = &retained {
            wrapped = wrapped
                .detail("retainedRef", r.retained_ref.clone())
                .detail("snapshot", r.snapshot.clone());
        }
        return Err(wrapped);
    }
    if let Ok(driver) = request.ctx.driver() {
        if let Ok(main) = request.ctx.main(&driver) {
            let _ = driver.prune_worktree(&main, vec![], &operation);
        }
    }
    Ok(retained)
}

fn remove_under_custody(
    request: &WorkRemove,
    operation: &str,
    retained: &mut Option<Retained>,
) -> Result<()> {
    let ctx = &request.ctx;
    let driver = ctx.driver()?;
    let main = ctx.main(&driver)?;
    let target = fgos_git::plain_path(
        &fs::canonicalize(&request.path)
            .map_err(|e| Error::invalid(format!("{}: {e}", request.path.display())))?,
    );
    let checkout = ctx.at(&driver, &target)?;
    let lease = git::custody(&checkout, &target)?;
    let borrowed = || git::borrow(&lease);
    let mut expected_tip = git::resolve_commit(&driver, &checkout, "HEAD")?;
    if let Some(retain_to) = &request.retain_to {
        if expected_tip.as_str() != retain_to {
            let restore = git::operation_id("worktree");
            let saved = driver
                .apply_restore(
                    &checkout,
                    vec![borrowed()?],
                    &RestoreRequest {
                        expected_head: expected_tip.as_str().to_owned(),
                        target: retain_to.clone(),
                        reason: "retain forced session HEAD before cleanup".into(),
                        reapply_local_delta: false,
                        allowed_replacements: Vec::new(),
                        checkout_baseline: None,
                        discard_local_delta: true,
                        require_clean_baseline: true,
                        require_staged_only: false,
                        confirmed_by: None,
                    },
                    &ctx.writer,
                    &restore,
                    &fgos_git::wal::OsFileSystem,
                )
                .map_err(Error::git)?;
            *retained = Some(Retained {
                retained_ref: format!("refs/fgos/git-operations/{restore}/candidate"),
                snapshot: saved.snapshot,
            });
            expected_tip = git::resolve_commit(&driver, &checkout, "HEAD")?;
        }
    }
    let delivered_text = request
        .delivered_to
        .clone()
        .unwrap_or_else(|| expected_tip.as_str().to_owned());
    let delivered = if is_object_id(&delivered_text) {
        Oid::parse(&delivered_text, main.object_format())
            .map_err(|e| Error::invalid(format!("{e:?}")))?
    } else {
        driver
            .resolve_literal_ref(&main, &delivered_text)
            .map_err(Error::git)?
            .map(|(_, oid)| oid)
            .ok_or_else(|| Error::invalid(format!("unknown delivery target {delivered_text}")))?
    };
    let evidence_digest: String = Sha256::digest(
        json!({
            "worktreePath": request.path.display().to_string(),
            "expectedTip": expected_tip.as_str(),
            "deliveredTo": delivered_text,
        })
        .to_string()
        .as_bytes(),
    )
    .iter()
    .map(|b| format!("{b:02x}"))
    .collect();
    around_removal(&driver, &ctx.repo_root, &ctx.state_root, &target, || {
        driver
            .remove_worktree(
                &main,
                vec![borrowed()?],
                &target,
                &WorktreeDelivery {
                    expected_tip: expected_tip.clone(),
                    delivered_to: delivered,
                    evidence_digest,
                },
                &ctx.writer,
                operation,
                IgnoredBytes::Preserve,
            )
            .map(|_| ())
            .map_err(Error::git)
    })
}

/// Reset a dirty checkout to its own HEAD, pinning what it held in a snapshot, so the removal that follows can go.
fn reset_to_head(ctx: &Context, path: &std::path::Path) -> Result<()> {
    let driver = ctx.driver()?;
    let checkout = ctx.at(&driver, path)?;
    let head = git::resolve_commit(&driver, &checkout, "HEAD")?;
    let lease = git::custody(&checkout, path)?;
    driver
        .apply_restore(
            &checkout,
            vec![git::borrow(&lease)?],
            &RestoreRequest {
                expected_head: head.as_str().to_owned(),
                target: head.as_str().to_owned(),
                reason: "worktree resync".into(),
                reapply_local_delta: false,
                allowed_replacements: Vec::new(),
                checkout_baseline: None,
                discard_local_delta: true,
                require_clean_baseline: false,
                require_staged_only: false,
                confirmed_by: None,
            },
            &ctx.writer,
            &git::operation_id("worktree"),
            &fgos_git::wal::OsFileSystem,
        )
        .map_err(Error::git)?;
    Ok(())
}

/// The cleanup half of a dispatch attempt: never fails. A cleanup that cannot finish is reported through `log` as
/// `fgos-runner: worktree cleanup failed for "<path>": <cause>` so it never masks the attempt's own outcome.
pub fn remove_dispatch_worktree(ctx: &Context, path: &std::path::Path, log: &mut dyn FnMut(&str)) {
    let outcome = (|| -> Result<()> {
        let driver = ctx.driver()?;
        let dirty = ctx
            .at(&driver, path)
            .map_or(true, |repo| git::is_checkout_dirty(&driver, &repo));
        if dirty {
            reset_to_head(ctx, path)?;
        }
        remove_worktree(&WorkRemove {
            ctx: ctx.clone(),
            path: path.to_path_buf(),
            delivered_to: None,
            retain_to: None,
        })
        .map(|_| ())
    })();
    if let Err(error) = outcome {
        log(&format!(
            "fgos-runner: worktree cleanup failed for \"{}\": {}",
            path.display(),
            error.message
        ));
    }
}
