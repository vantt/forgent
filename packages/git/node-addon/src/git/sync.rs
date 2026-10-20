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
pub struct GitSync {
    driver: GitDriver,
    repo: RepoHandle,
    writer: String,
}
#[napi]
impl GitSync {
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
        let id = text(&args, "operationId")?;
        Ok(json!(match method.as_str() {
            "start" => self.driver.start_sync(
                &self.repo,
                held,
                &Oid::parse(text(&args, "target")?, self.repo.object_format()).map_err(error)?,
                text(&args, "message")?,
                &self.writer,
                id
            ),
            "inspect" => self.driver.inspect_sync(&self.repo, held, &self.writer, id),
            "continue" => self
                .driver
                .continue_sync(&self.repo, held, &self.writer, id),
            "abort" => self.driver.abort_sync(&self.repo, held, &self.writer, id),
            _ => return Err(error("unknown-sync-method")),
        }
        .map_err(operation)?))
    }
}
