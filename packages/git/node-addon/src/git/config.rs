//! Dormant RepositoryConfig transport. Policy and effects live in Rust.
use super::{operation, text};
use crate::{check, error};
use fgos_git::*;
use napi::Result;
use napi_derive::napi;
use serde_json::{json, Value};
use std::path::Path;
#[napi]
pub struct GitRepositoryConfig {
    driver: GitDriver,
    repo: RepoHandle,
}
#[napi]
impl GitRepositoryConfig {
    #[napi(constructor)]
    pub fn new(state_root: String, repo_path: String, trusted_main: String) -> Result<Self> {
        check()?;
        let driver = GitDriver::new(Path::new(&state_root)).map_err(operation)?;
        let repo = match driver
            .resolve_repo(Path::new(&repo_path), Path::new(&trusted_main))
            .map_err(operation)?
        {
            ResolveRepo::Repository(repo) => repo,
            _ => return Err(error("not-a-repository")),
        };
        Ok(Self { driver, repo })
    }
    #[napi]
    pub fn call(&self, method: String, args: Value) -> Result<Value> {
        check()?;
        if method == "recover" {
            return Ok(json!(self
                .driver
                .recover_hooks_config(&self.repo, text(&args, "operationId")?)
                .map_err(operation)?));
        }
        let path = Path::new(text(&args, "ownedPath")?);
        match method.as_str() {
            "inspectHooks" => Ok(json!(self
                .driver
                .inspect_hooks(&self.repo, path)
                .map_err(operation)?)),
            "ensureHooks" => Ok(json!(self
                .driver
                .ensure_hooks(&self.repo, path, text(&args, "operationId")?)
                .map_err(operation)?)),
            "removeOwnedHooksConfig" => Ok(json!(self
                .driver
                .remove_owned_hooks_config(&self.repo, path, text(&args, "operationId")?)
                .map_err(operation)?)),
            _ => Err(error("unknown Git RepositoryConfig method")),
        }
    }
}
