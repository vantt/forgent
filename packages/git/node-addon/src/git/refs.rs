//! Mechanical Refs binding; held authority is one-shot, never numeric.
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
pub struct GitRefs {
    driver: GitDriver,
    repo: RepoHandle,
    writer: String,
}
#[napi]
impl GitRefs {
    #[napi(constructor)]
    pub fn new(
        state_root: String,
        repo_path: String,
        trusted_main: String,
        writer: String,
    ) -> Result<Self> {
        check()?;
        if cfg!(windows) {
            return Err(error("git-lock-handover-unsupported"));
        }
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
        let name = RefName::parse(text(&args, "name")?).map_err(error)?;
        let id = text(&args, "operationId")?;
        let oid = |key| Oid::parse(text(&args, key)?, self.repo.object_format()).map_err(error);
        let result = match method.as_str() {
            "ensureBranch" => {
                self.driver
                    .ensure_branch(&self.repo, held, &name, &oid("next")?, &self.writer, id)
            }
            "advanceRef" => self.driver.advance_ref(
                &self.repo,
                held,
                &name,
                &oid("expected")?,
                &oid("next")?,
                &self.writer,
                id,
            ),
            "deleteRef" => {
                self.driver
                    .delete_ref(&self.repo, held, &name, &oid("expected")?, &self.writer, id)
            }
            "fastForwardCheckedOut" => self.driver.fast_forward_checked_out(
                &self.repo,
                held,
                &name,
                &oid("expected")?,
                &oid("next")?,
                &self.writer,
                id,
            ),
            _ => return Err(error("unknown-refs-method")),
        }
        .map_err(operation)?;
        Ok(json!(result))
    }
}
