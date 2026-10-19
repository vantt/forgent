//! Mechanical Remote binding. Grants, exact mappings and WAL stay in Rust.
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
pub struct GitRemote {
    driver: GitDriver,
    repo: RepoHandle,
    writer: String,
}
#[napi]
impl GitRemote {
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
        let grant = RemoteGrant {
            name: text(&args["remoteGrant"], "name")?.into(),
            pinned_url: text(&args["remoteGrant"], "pinnedUrl")?.into(),
        };
        if method == "inspectRemote" {
            let names: Vec<String> = serde_json::from_value(args["refs"].clone()).map_err(error)?;
            let names = names
                .iter()
                .map(|n| RefName::parse(n).map_err(error))
                .collect::<Result<Vec<_>>>()?;
            return Ok(json!(self
                .driver
                .inspect_remote(&self.repo, held, &grant, &names)
                .map_err(operation)?));
        }
        let pairs: Vec<(String, String)> =
            serde_json::from_value(args["mappings"].clone()).map_err(error)?;
        let mappings = pairs
            .iter()
            .map(|(s, d)| {
                Ok(RefMapping {
                    source: RefName::parse(s).map_err(error)?,
                    destination: RefName::parse(d).map_err(error)?,
                })
            })
            .collect::<Result<Vec<_>>>()?;
        let id = text(&args, "operationId")?;
        Ok(json!(match method.as_str() {
            "fetchRefs" =>
                self.driver
                    .fetch_refs(&self.repo, held, &grant, &mappings, &self.writer, id),
            "pushRefs" =>
                self.driver
                    .push_refs(&self.repo, held, &grant, &mappings, &self.writer, id),
            _ => return Err(error("unknown-remote-method")),
        }
        .map_err(operation)?))
    }
}
