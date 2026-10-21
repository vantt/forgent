//! Mechanical dormant recovery transport; dispatch and authority live in Rust.
use super::{
    handover::{Loan, consume},
    operation, text,
};
use crate::{check, error};
use fgos_git::*;
use napi::{Result, bindgen_prelude::External};
use napi_derive::napi;
use serde_json::Value;
use std::path::Path;
#[napi]
pub struct GitRecovery {
    driver: GitDriver,
    repo: RepoHandle,
    writer: String,
    driver_state: String,
    repo_path: String,
    trusted_main: String,
}
#[napi]
impl GitRecovery {
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
            driver_state: state_root,
            repo_path,
            trusted_main,
        })
    }
    #[napi]
    pub fn call(&self, method: String, args: Value, loans: Vec<External<Loan>>) -> Result<Value> {
        check()?;
        let held = consume(loans)?;
        match method.as_str() {
            "inspectOperation" => self
                .driver
                .inspect_operation(&self.repo, text(&args, "operationId")?)
                .map_err(operation),
            "listPending" => self
                .driver
                .list_pending(
                    &self.repo,
                    args.get("bound")
                        .and_then(Value::as_u64)
                        .unwrap_or(100_000)
                        .try_into()
                        .map_err(error)?,
                )
                .map_err(operation),
            "listRetainedLand" => self
                .driver
                .list_retained_land(
                    &self.repo,
                    args.get("bound")
                        .and_then(Value::as_u64)
                        .unwrap_or(100_000)
                        .try_into()
                        .map_err(error)?,
                )
                .map_err(operation),
            "reconcile" => {
                let id = text(&args, "operationId")?;
                let inspected = self
                    .driver
                    .inspect_operation(&self.repo, id)
                    .map_err(operation)?;
                if inspected["kind"] == "PublicationCas" {
                    if !held.is_empty() {
                        return Err(error("publication-recovery-unexpected-loans"));
                    }
                    let reference = inspected["intent"]["resourceSet"][0]
                        .as_str()
                        .ok_or_else(|| error("publication-reference-missing"))?;
                    let mut publication = super::GitPublication::new(
                        self.driver_state.clone(),
                        self.repo_path.clone(),
                        self.trusted_main.clone(),
                        reference.into(),
                        self.writer.clone(),
                        None,
                    )?;
                    let result = publication.call("reconcile".into(), args);
                    let closed = publication.close();
                    match result {
                        Ok(value) => {
                            closed?;
                            Ok(value)
                        }
                        Err(e) => Err(e),
                    }
                } else {
                    self.driver
                        .reconcile_operation(&self.repo, held, &self.writer, id, None)
                        .map_err(operation)
                }
            }
            _ => Err(error(format!("unknown-recovery-method: {method}"))),
        }
    }
}
