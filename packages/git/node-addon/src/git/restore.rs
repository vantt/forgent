//! Mechanical transaction transport; custody is an opaque native loan.
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
pub struct GitSafeRestore {
    driver: GitDriver,
    repo: RepoHandle,
    writer: String,
}
#[napi]
impl GitSafeRestore {
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
        match method.as_str() {
            "preview" | "apply" => {
                let request: RestoreRequest =
                    serde_json::from_value(args["request"].clone()).map_err(error)?;
                if method == "preview" {
                    Ok(json!(self
                        .driver
                        .preview_restore(&self.repo, held, &request)
                        .map_err(operation)?))
                } else {
                    Ok(json!(self
                        .driver
                        .apply_restore(
                            &self.repo,
                            held,
                            &request,
                            &self.writer,
                            text(&args, "operationId")?,
                            &wal::OsFileSystem
                        )
                        .map_err(operation)?))
                }
            }
            "recover" => Ok(json!(self
                .driver
                .recover_restore(&self.repo, held, &self.writer, text(&args, "operationId")?)
                .map_err(operation)?)),
            "listSnapshot" => Ok(json!(self
                .driver
                .list_restore_snapshot(&self.repo, held, &self.writer, text(&args, "operationId")?)
                .map_err(operation)?)),
            "extractPath" => {
                self.driver
                    .extract_restore_path(
                        &self.repo,
                        held,
                        &self.writer,
                        text(&args, "operationId")?,
                        text(&args, "path")?,
                        Path::new(text(&args, "destination")?),
                    )
                    .map_err(operation)?;
                Ok(json!({"extracted": true}))
            }
            "acknowledge" => {
                self.driver
                    .acknowledge_restore(
                        &self.repo,
                        held,
                        &self.writer,
                        text(&args, "operationId")?,
                        &wal::OsFileSystem,
                    )
                    .map_err(operation)?;
                Ok(json!({"acknowledged": true}))
            }
            _ => Err(error("unknown-safe-restore-method")),
        }
    }
}
