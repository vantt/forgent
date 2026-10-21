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
        let flag = |key: &str| -> Result<bool> {
            args.get(key)
                .filter(|v| !v.is_null())
                .map(|v| v.as_bool().ok_or_else(|| error(format!("expected {key} boolean"))))
                .transpose()
                .map(|v| v.unwrap_or(false))
        };
        let optional_oid = |key: &str| -> Result<Option<Oid>> {
            args.get(key).filter(|v| !v.is_null()).map(|_| oid(key)).transpose()
        };
        // `before` + `after`: two objects; `before` + `index` or `worktree`:
        // a commit against the checkout; `index` + `worktree`: unstaged.
        let (before, after) = (optional_oid("before")?, optional_oid("after")?);
        let sides = || -> Result<DiffSides<'_>> {
            match (before.as_ref(), after.as_ref(), flag("index")?, flag("worktree")?) {
                (Some(b), Some(a), false, false) => Ok(DiffSides::Objects(b, a)),
                (Some(b), None, true, false) => Ok(DiffSides::IndexAgainst(b)),
                (Some(b), None, false, true) => Ok(DiffSides::WorktreeAgainst(b)),
                (None, None, true, true) => Ok(DiffSides::WorktreeAgainstIndex),
                _ => Err(error("diff sides: before+after, before+index, before+worktree or index+worktree")),
            }
        };
        match method.as_str() {
            "lastPathCommitTime" => {
                let files: Vec<String> = serde_json::from_value(args["files"].clone()).map_err(error)?;
                Ok(json!(self.driver.last_path_commit_time(&repo, &files).map_err(operation)?))
            }
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
            "resolveLiteralRef" => Ok(
                match self
                    .driver
                    .resolve_literal_ref(&repo, text(&args, "name")?)
                    .map_err(operation)?
                {
                    Some((name, oid)) => json!({"kind":"direct","ref":name,"oid":oid}),
                    None => json!({"kind":"absent"}),
                },
            ),
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
                let submodules = match args.get("ignoreSubmodules").filter(|v| !v.is_null()).map(|v| v.as_str()) {
                    None => Submodules::Configured,
                    Some(Some("dirty")) => Submodules::IgnoreDirty,
                    _ => return Err(error("ignoreSubmodules: only \"dirty\"")),
                };
                let ignored = match args.get("ignored").filter(|v| !v.is_null()).map(|v| v.as_bool()) {
                    None | Some(Some(false)) => Ignored::Excluded,
                    Some(Some(true)) => Ignored::Listed,
                    _ => return Err(error("expected ignored boolean")),
                };
                Ok(json!(self
                    .driver
                    .status(&repo, untracked, submodules, ignored, cursor()?, max()?)
                    .map_err(operation)?))
            }
            "diffText" => {
                let bound: usize = serde_json::from_value(args.get("maxBytes").cloned().unwrap_or(json!(50 * 1024 * 1024))).map_err(error)?;
                let files: Vec<String> = serde_json::from_value(args.get("paths").cloned().unwrap_or(json!([]))).map_err(error)?;
                let context: Option<u32> = serde_json::from_value(args.get("context").cloned().unwrap_or(Value::Null)).map_err(error)?;
                let bytes = self.driver.diff_text(&repo, sides()?, &files, context, bound).map_err(operation)?;
                Ok(json!(String::from_utf8_lossy(&bytes)))
            }
            "diff" => {
                let prefix = args.get("prefix").filter(|v| !v.is_null())
                    .map(|v| v.as_str().ok_or_else(|| error("expected prefix string")))
                    .transpose()?;
                let renames = args.get("renames").filter(|v| !v.is_null())
                    .map(|v| v.as_bool().ok_or_else(|| error("expected renames boolean")))
                    .transpose()?
                    .unwrap_or(false);
                Ok(json!(self
                    .driver
                    .diff(&repo, sides()?, &DiffScope { prefix, renames }, cursor()?, max()?)
                    .map_err(operation)?))
            }
            "mergeTree" => Ok(json!(self
                .driver
                .merge_tree(&repo, &oid("target")?, &oid("source")?)
                .map_err(operation)?)),
            "listTree" => {
                // The cursor crossing Node is the last path returned.
                let (revision, prefix) = (oid("revision")?, text(&args, "prefix")?.as_bytes());
                let cursor = args
                    .get("cursor")
                    .filter(|v| !v.is_null())
                    .map(|v| serde_json::from_value::<Vec<u8>>(v.clone()).map_err(error))
                    .transpose()?
                    .map(|after| TreeCursor::resume(&revision, prefix, after));
                let page = self
                    .driver
                    .list_tree(&repo, &revision, prefix, cursor, max()?)
                    .map_err(operation)?;
                Ok(json!({
                    "entries": page.entries.iter().map(|e| json!({"path": e.path, "mode": e.mode, "kind": format!("{:?}", e.kind).to_lowercase(), "oid": e.oid})).collect::<Vec<_>>(),
                    "complete": page.complete,
                    "nextCursor": page.next_cursor.as_ref().map(TreeCursor::after),
                }))
            }
            "attributes" => Ok(json!(self
                .driver
                .attributes(&repo, &oid("revision")?, text(&args, "attribute")?, &paths()?)
                .map_err(operation)?)),
            "commitTime" => Ok(json!(self.driver.commit_time(&repo, &oid("revision")?).map_err(operation)?)),
            "countCommits" => Ok(json!(self
                .driver
                .count_commits(&repo, &oid("include")?, optional_oid("exclude")?.as_ref())
                .map_err(operation)?)),
            "unmatchedCommitCount" => Ok(json!(self
                .driver
                .unmatched_commit_count(&repo, &oid("upstream")?, &oid("head")?)
                .map_err(operation)?)),
            "trackedPaths" => Ok(json!(self.driver.tracked_paths(&repo, cursor()?, max()?).map_err(operation)?)),
            "remoteUrl" => Ok(json!(self.driver.remote_url(&repo, text(&args, "remote")?).map_err(operation)?)),
            "firstAncestryMerge" => Ok(json!(self
                .driver
                .first_ancestry_merge(&repo, &oid("ancestor")?, &oid("descendant")?)
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
