//! Mechanical Worktree port binding. Rust owns every policy and effect.
use super::{
    handover::{consume, Loan},
    operation, text,
};
use crate::{check, error};
use fgos_git::*;
use napi::{bindgen_prelude::External, Result};
use napi_derive::napi;
use serde_json::{json, Value};
use std::path::Path;
#[napi]
pub struct GitWorktree {
    driver: GitDriver,
    repo: RepoHandle,
    writer: String,
}
#[napi]
impl GitWorktree {
    #[napi(constructor)]
    pub fn new(
        state_root: String,
        repo_path: String,
        trusted_main: String,
        writer: String,
    ) -> Result<Self> {
        check()?;
        let driver = GitDriver::new(Path::new(&state_root)).map_err(operation)?;
        let repo = match driver
            .resolve_repo(Path::new(&repo_path), Path::new(&trusted_main))
            .map_err(operation)?
        {
            ResolveRepo::Repository(r) => r,
            _ => return Err(error("not-a-repository")),
        };
        Ok(Self {
            driver,
            repo,
            writer,
        })
    }
    #[napi]
    pub fn call(&self, method: String, args: Value, loans: Vec<External<Loan>>) -> Result<Value> {
        check()?;
        let held = consume(loans)?;
        let oid = |key| Oid::parse(text(&args, key)?, self.repo.object_format()).map_err(error);
        let id = || text(&args, "operationId");
        match method.as_str() {
            "create" | "createDetached" => {
                let base = self
                    .driver
                    .resolve_worktree_base(
                        &self.repo,
                        args.get("base")
                            .map(|v| v.as_str().ok_or_else(|| error("invalid-worktree-base")))
                            .transpose()?,
                    )
                    .map_err(operation)?;
                let branch = args
                    .get("branch")
                    .filter(|v| !v.is_null())
                    .map(|v| {
                        let name = v.as_str().ok_or_else(|| error("invalid branch"))?;
                        RefName::parse(&format!("refs/heads/{name}")).map_err(error)
                    })
                    .transpose()?;
                if method == "createDetached" && branch.is_some() {
                    return Err(error("detached-branch-conflict"));
                }
                if method == "createDetached" && args.get("path").is_none() {
                    return Ok(json!(self
                        .driver
                        .create_detached_worktree(
                            &self.repo,
                            held,
                            Path::new(text(&args, "parent")?),
                            text(&args, "sessionId")?,
                            &base,
                            &self.writer,
                            id()?
                        )
                        .map_err(operation)?));
                }
                let request = WorktreeCreate {
                    path: text(&args, "path")?.into(),
                    branch,
                    base,
                    session_id: None,
                };
                Ok(json!(self
                    .driver
                    .create_worktree(&self.repo, held, &request, &self.writer, id()?)
                    .map_err(operation)?))
            }
            "remove" => {
                let proof = WorktreeDelivery {
                    expected_tip: oid("expectedTip")?,
                    delivered_to: oid("deliveredTo")?,
                    evidence_digest: text(&args, "evidenceDigest")?.into(),
                };
                let ignored = match args.get("discardIgnored") {
                    None | Some(Value::Bool(false)) => IgnoredBytes::Preserve,
                    Some(Value::Bool(true)) => IgnoredBytes::Discard,
                    Some(_) => return Err(error("invalid discardIgnored")),
                };
                let discarded = self
                    .driver
                    .remove_worktree(
                        &self.repo,
                        held,
                        Path::new(text(&args, "path")?),
                        &proof,
                        &self.writer,
                        id()?,
                        ignored,
                    )
                    .map_err(operation)?;
                Ok(json!({"removed":true,"discardedIgnored":discarded}))
            }
            "relocate" => Ok(json!(self
                .driver
                .relocate_worktree(
                    &self.repo,
                    held,
                    Path::new(text(&args, "source")?),
                    Path::new(text(&args, "destination")?),
                    &oid("expectedTip")?,
                    &self.writer,
                    id()?
                )
                .map_err(operation)?)),
            "inspectOrphans" => Ok(json!(self
                .driver
                .inspect_worktree_orphans(&self.repo)
                .map_err(operation)?)),
            "prune" => {
                if let Some(path) = args.get("path") {
                    self.driver
                        .prune_missing_worktree(
                            &self.repo,
                            held,
                            Path::new(
                                path.as_str()
                                    .ok_or_else(|| error("invalid-worktree-path"))?,
                            ),
                            &self.writer,
                            id()?,
                        )
                        .map_err(operation)?;
                } else {
                    self.driver
                        .prune_worktree(&self.repo, held, id()?)
                        .map_err(operation)?;
                }
                Ok(json!({"pruned":true}))
            }
            "repairRegistration" => {
                self.driver
                    .repair_worktree_registration(&self.repo, held, id()?)
                    .map_err(operation)?;
                Ok(json!({"reconciled":true}))
            }
            _ => Err(error("unknown-worktree-method")),
        }
    }
}
