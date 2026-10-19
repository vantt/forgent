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
pub struct GitLand {
    driver: GitDriver,
    repo: RepoHandle,
    writer: String,
    session: Option<LandSession>,
}
#[napi]
impl GitLand {
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
            session: None,
        })
    }
    #[napi]
    pub fn prepare(&mut self, args: Value, loans: Vec<External<Loan>>) -> Result<Value> {
        check()?;
        if self.session.is_some() {
            return Err(error("land-session-already-open"));
        }
        let request: LandRequest = serde_json::from_value(
            args.get("request")
                .cloned()
                .ok_or_else(|| error("missing request"))?,
        )
        .map_err(error)?;
        let session = self
            .driver
            .prepare_land(
                &self.repo,
                consume(loans)?,
                &request,
                &self.writer,
                text(&args, "operationId")?,
            )
            .map_err(operation)?;
        let result = json!({"candidate":session.candidate(),"receipt":session.receipt()});
        self.session = Some(session);
        Ok(result)
    }
    #[napi]
    pub fn publish(&mut self, evidence: Value) -> Result<Value> {
        check()?;
        let evidence: LandEvidence = serde_json::from_value(evidence).map_err(error)?;
        let session = self
            .session
            .as_mut()
            .ok_or_else(|| error("land-session-required"))?;
        Ok(json!(self
            .driver
            .publish_land(&self.repo, session, &evidence)
            .map_err(operation)?))
    }
    #[napi]
    pub fn close(&mut self) -> Result<()> {
        check()?;
        self.session.take();
        Ok(())
    }
}
