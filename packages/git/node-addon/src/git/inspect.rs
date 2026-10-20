//! Mechanical Node-API marshaling. All reads and validation stay in Rust.
use super::{operation, text};
use crate::{check, error};
use fgos_git::*;
use napi::Result;
use napi_derive::napi;
use serde_json::{json, Value};
use std::path::{Path, PathBuf};

#[napi]
pub struct GitInspect {
    driver: GitDriver,
    path: PathBuf,
    main: PathBuf,
}
#[napi]
impl GitInspect {
    #[napi(constructor)]
    pub fn new(state_root: String, repo_path: String, trusted_main: String) -> Result<Self> {
        check()?;
        Ok(Self {
            driver: GitDriver::new(Path::new(&state_root)).map_err(operation)?,
            path: repo_path.into(),
            main: trusted_main.into(),
        })
    }
    #[napi]
    pub fn call(&self, method: String, args: Value) -> Result<Value> {
        check()?;
        let repo = match self
            .driver
            .resolve_repo(&self.path, &self.main)
            .map_err(operation)?
        {
            ResolveRepo::Repository(r) => r,
            ResolveRepo::NotARepository => return Ok(json!({"notARepository":true})),
        };
        let oid = |key: &str| Oid::parse(text(&args, key)?, repo.object_format()).map_err(error);
        let cursor = || -> Result<Option<InspectCursor>> {
            args.get("cursor")
                .filter(|v| !v.is_null())
                .map(|v| serde_json::from_value(v.clone()).map_err(error))
                .transpose()
        };
        let max = || -> Result<usize> {
            serde_json::from_value(args.get("maxEntries").cloned().unwrap_or(json!(256)))
                .map_err(error)
        };
        let paths = || -> Result<Vec<Vec<u8>>> {
            serde_json::from_value(args.get("paths").cloned().unwrap_or(json!([]))).map_err(error)
        };
        match method.as_str() {
            "compareCommits" => Ok(json!(self
                .driver
                .compare_commits(&repo, &oid("left")?, &oid("right")?)
                .map_err(operation)?)),
            "listBranches" => Ok(json!(self
                .driver
                .list_branches(&repo, text(&args, "prefix")?)
                .map_err(operation)?)),
            "checkoutFacts" => Ok(json!(self
                .driver
                .checkout_facts(&repo, &oid("revision")?)
                .map_err(operation)?)),
            "remoteTracking" => Ok(json!(self
                .driver
                .remote_tracking(
                    &repo,
                    &RefName::parse(text(&args, "branch")?).map_err(error)?,
                    text(&args, "remote")?
                )
                .map_err(operation)?)),
            "resolveRepo" => Ok(
                json!({"commonDir":repo.common_dir(),"gitDir":repo.git_dir(),"worktreeRoot":repo.work_tree(),"trustedMainRoot":repo.trusted_main_root(),"objectFormat":repo.object_format()}),
            ),
            "resolveCommit" => Ok(json!(self.driver.resolve_commit_ref(&repo, text(&args, "name")?).map_err(operation)?)),
            "resolveRef" => {
                let name = RefName::parse(text(&args, "name")?).map_err(error)?;
                Ok(
                    match self.driver.resolve_ref(&repo, &name).map_err(operation)? {
                        RefValue::Absent => json!({"kind":"absent"}),
                        RefValue::Direct(oid) => json!({"kind":"direct","oid":oid}),
                        RefValue::Symbolic(target) => json!({"kind":"symbolic","target":target}),
                    },
                )
            }
            "resolveTrunk" => {
                let explicit = args
                    .get("target")
                    .filter(|v| !v.is_null())
                    .map(|v| {
                        RefName::parse(v.as_str().ok_or_else(|| error("expected target ref"))?)
                            .map_err(error)
                    })
                    .transpose()?;
                Ok(json!(self
                    .driver
                    .resolve_trunk(&repo, explicit.as_ref())
                    .map_err(operation)?))
            }
            "status" => {
                let untracked = match text(&args, "untracked")? {
                    "none" => Untracked::None,
                    "normal" => Untracked::Normal,
                    "all" => Untracked::All,
                    _ => return Err(error("explicit untracked mode required")),
                };
                Ok(json!(self
                    .driver
                    .status(&repo, untracked, cursor()?, max()?)
                    .map_err(operation)?))
            }
            "diff" => Ok(json!(self
                .driver
                .diff(&repo, &oid("before")?, &oid("after")?, cursor()?, max()?)
                .map_err(operation)?)),
            "ancestry" => Ok(
                json!({"answer":if self.driver.ancestry(&repo,&oid("ancestor")?,&oid("descendant")?).map_err(operation)? {"yes"} else {"no"}}),
            ),
            "listWorktrees" => Ok(json!(self
                .driver
                .list_worktrees(&repo, cursor()?, max()?)
                .map_err(operation)?)),
            "compareContent" => Ok(
                json!({"equal":self.driver.compare_content(&repo,&oid("before")?,&oid("after")?).map_err(operation)?}),
            ),
            "readObjects" => {
                let ids: Vec<String> =
                    serde_json::from_value(args["oids"].clone()).map_err(error)?;
                let ids = ids
                    .iter()
                    .map(|s| Oid::parse(s, repo.object_format()).map_err(error))
                    .collect::<Result<Vec<_>>>()?;
                let results = self
                    .driver
                    .read_objects(
                        &repo,
                        &ids,
                        serde_json::from_value(args["maxBytes"].clone()).map_err(error)?,
                    )
                    .map_err(operation)?;
                Ok(json!(results.into_iter().map(|r|match r {ReadObject::Missing=>json!({"kind":"missing"}),ReadObject::Present{kind,bytes}=>json!({"kind":"present","objectType":format!("{kind:?}").to_lowercase(),"bytes":bytes})}).collect::<Vec<_>>()))
            }
            "pathsAtRevision" => {
                let results = self
                    .driver
                    .paths_at_revision(
                        &repo,
                        &oid("revision")?,
                        &paths()?,
                        serde_json::from_value(args["maxBlobBytes"].clone()).map_err(error)?,
                    )
                    .map_err(operation)?;
                Ok(json!(results.into_iter().map(|r|json!({"path":r.path,"value":match r.value {PathValue::Blob(bytes)=>json!({"kind":"present","bytes":bytes}),PathValue::Absent=>json!({"kind":"absent"}),PathValue::NotABlob(kind)=>json!({"kind":"notABlob","objectType":format!("{kind:?}").to_lowercase()}),PathValue::Error(e)=>json!({"kind":"error","cause":e.cause})}})).collect::<Vec<_>>()))
            }
            "snapshotWrites" => Ok(json!(self
                .driver
                .snapshot_writes(
                    &repo,
                    &paths()?,
                    args["maxBytes"].as_f64().filter(|n| n.is_finite() && *n >= 0.0 && n.fract() == 0.0 && *n <= 9_007_199_254_740_991.0)
                        .ok_or_else(|| error("byte budget must be a safe unsigned integer"))? as u64
                )
                .map_err(operation)?)),
            _ => Err(error("unknown-inspect-method")),
        }
    }
}
