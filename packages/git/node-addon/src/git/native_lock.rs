//! Native repair accepts opaque checkout loans, never caller-asserted ownership.
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
pub struct GitNativeLockRepair {
    driver: GitDriver,
    repo: RepoHandle,
}
#[napi]
impl GitNativeLockRepair {
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
    pub fn repair_native_index_lock(
        &self,
        args: Value,
        loans: Vec<External<Loan>>,
    ) -> Result<Value> {
        check()?;
        Ok(json!(self
            .driver
            .repair_native_index_lock(&self.repo, consume(loans)?, text(&args, "operationId")?)
            .map_err(operation)?))
    }
}
