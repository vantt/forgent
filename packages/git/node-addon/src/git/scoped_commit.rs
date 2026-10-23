//! Mechanical transaction transport; custody is an opaque native loan.
use super::{
    handover::{consume, Loan},
    operation, strings, text,
};
use crate::{check, error};
use fgos_git::*;
use napi::{bindgen_prelude::External, Result};
use napi_derive::napi;
use serde_json::{json, Value};
use std::path::Path;
#[napi]
pub struct GitScopedCommit {
    driver: GitDriver,
    repo: RepoHandle,
    writer: String,
}
#[napi]
impl GitScopedCommit {
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
        if std::fs::canonicalize(&trusted_main).map_err(error)? != repo.trusted_main_root() {
            return Err(error("untrusted-worktree: explicit main checkout required"));
        }
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
        match method.as_str() {
            "worktreeState" => Ok(json!(self.driver.checkout_state(&self.repo, held).map_err(operation)?)),
            "preflight" => Ok(json!(self
                .driver
                .preflight_commit(&self.repo, held, args.get("syncOperationId").and_then(Value::as_str).map(|id| (self.writer.as_str(), id)))
                .map_err(operation)?)),
            "recover" => Ok(json!(self
                .driver
                .recover_scoped_commit(&self.repo, held, &self.writer, text(&args, "operationId")?, &wal::OsFileSystem)
                .map_err(operation)?)),
            "commit" => {
                let baseline: CommitBaseline =
                    serde_json::from_value(args["baseline"].clone()).map_err(error)?;
                let request: CommitRequest =
                    serde_json::from_value(args["request"].clone()).map_err(error)?;
                Ok(json!(self
                    .driver
                    .scoped_commit(
                        &self.repo,
                        held,
                        &baseline,
                        &request,
                        &self.writer,
                        text(&args, "operationId")?,
                        &wal::OsFileSystem
                    )
                    .map_err(operation)?))
            }
            "checkpointTrackedFiles" => Ok(json!(self
                .driver
                .checkpoint_tracked_files(
                    &self.repo,
                    held,
                    CheckpointRequest {
                        files: strings(&args, "files")?,
                        message: text(&args, "message")?.into(),
                        legacy_events: args.get("legacyEvents").filter(|v| !v.is_null()).map(|v| serde_json::from_value(v.clone()).map_err(error)).transpose()?,
                    },
                    &self.writer,
                    text(&args, "operationId")?
                )
                .map_err(operation)?)),
            _ => Err(error("unknown-scoped-commit-method")),
        }
    }
}
