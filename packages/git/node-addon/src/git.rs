//! Opaque repository and seal authority stay in Rust for their entire lifetime.
mod config;
mod recovery;
mod scoped_commit;
mod sync;
mod land;
mod restore;
mod write_scope;
#[allow(unused_imports)] // N-API registration is used by Node, not Rust unit tests.
pub use write_scope::write_scope;
mod handover;
mod inspect;
pub use handover::{close_git_loan, mint_git_loan, take_git_handover};
mod refs;
mod worktree;
pub use worktree::inspect_git_worktree_recovery;
mod remote;
use crate::{check, error};
use fgos_git::{HolderAuthority, *};
use fgos_holder_lock::{Acquire, Handle, Mode, Resource, Wait, DEFAULT_KILL_WAIT_MS};
use napi::{Error, Result};
use napi_derive::napi;
use serde_json::{json, Value};
use std::path::Path;

fn operation(e: OperationError) -> Error {
    Error::from_reason(json!({"code": e.code, "cause": e.cause, "retryable": e.retryable, "operationId": e.operation_id, "receipt": e.receipt, "exitCode": e.exit_code, "signal": e.signal, "stderr": e.stderr, "detail": e.detail}).to_string())
}
fn text<'a>(v: &'a Value, key: &str) -> Result<&'a str> {
    v.get(key)
        .and_then(Value::as_str)
        .ok_or_else(|| error(format!("missing string: {key}")))
}
fn strings(v: &Value, key: &str) -> Result<Vec<String>> {
    serde_json::from_value(v.get(key).cloned().unwrap_or(json!([]))).map_err(error)
}
#[napi]
pub struct GitPublication {
    driver: GitDriver,
    repo: RepoHandle,
    handle: Option<Handle>,
    reference: RefName,
    writer: String,
    _helper: Option<fgos_holder_lock::HelperExe>,
}
#[napi]
impl GitPublication {
    #[napi(constructor)]
    pub fn new(
        state_root: String,
        repo_path: String,
        trusted_main: String,
        reference: String,
        writer: String,
        helper_exe: Option<String>,
    ) -> Result<Self> {
        check()?;
        require_lock_scope_platform().map_err(operation)?;
        let driver = GitDriver::new(Path::new(&state_root)).map_err(operation)?;
        let repo = match driver
            .resolve_repo(Path::new(&repo_path), Path::new(&trusted_main))
            .map_err(operation)?
        {
            ResolveRepo::Repository(repo) => repo,
            ResolveRepo::NotARepository => return Err(error("not-a-repository")),
        };
        let layout = fgos_event_store::layout::Layout::from_common_dir(Some(repo.common_dir()))
            .map_err(error)?;
        let resource = Resource::new("event-seal", layout.seal_lock());
        let mut handle = match fgos_holder_lock::acquire(
            &resource,
            Mode::Ex,
            Wait::Ms(5000),
            DEFAULT_KILL_WAIT_MS,
        ) {
            Acquire::Acquired(handle) => handle,
            other => return Err(error(format!("publication-borrow-unavailable: {other:?}"))),
        };
        let reference = RefName::parse(&reference).map_err(error)?;
        HolderAuthority::new(
            &repo,
            &mut handle,
            &resource.path,
            reference.clone(),
            &writer,
        )
        .map_err(operation)?;
        Ok(Self {
            driver,
            repo,
            handle: Some(handle),
            reference,
            writer,
            _helper: helper_exe.map(|p| fgos_holder_lock::HelperExe(p.into())),
        })
    }
    #[napi]
    pub fn close(&mut self) -> Result<Value> {
        check()?;
        match self.handle.take().map(fgos_holder_lock::release) {
            Some(fgos_holder_lock::Release::Stuck { killed, pids }) => Err(error(
                json!({"cause":"lock-release-stuck", "leftoversKilled":killed, "pids":pids}),
            )),
            Some(fgos_holder_lock::Release::Released { killed }) => {
                Ok(json!({"released":true, "leftoversKilled":killed}))
            }
            None => Ok(json!({"released":true, "leftoversKilled":0})),
        }
    }
    /// One mechanical dispatcher; typed validation and all policy remain in the port.
    #[napi]
    pub fn call(&mut self, method: String, args: Value) -> Result<Value> {
        check()?;
        let handle = self
            .handle
            .as_mut()
            .ok_or_else(|| error("publication-closed"))?;
        let path = handle.path().to_owned();
        let authority = HolderAuthority::new(
            &self.repo,
            handle,
            &path,
            self.reference.clone(),
            &self.writer,
        )
        .map_err(operation)?;
        let mut port = PublicationPort::new(&self.driver, authority);
        if let Some(remote) = args.get("remoteGrant") {
            port = port.with_remote(RemoteGrant {
                name: text(remote, "name")?.into(),
                pinned_url: text(remote, "pinnedUrl")?.into(),
            });
        }
        let repo = &self.repo;
        let oid = |s: &str| Oid::parse(s, repo.object_format()).map_err(error);
        let tip = |v: &Value| -> Result<ExpectedTip> {
            if v.is_null() {
                Ok(ExpectedTip::Absent)
            } else {
                Ok(ExpectedTip::Oid(oid(v
                    .as_str()
                    .ok_or_else(|| error("expected OID or null"))?)?))
            }
        };
        match method.as_str() {
            "resolveRepo" => Ok(json!({"commonDir": repo.common_dir(), "trustedMainRoot": repo.trusted_main_root(), "objectFormat": repo.object_format()})),
            "writeBlob" => Ok(json!(port.write_blob(repo, &serde_json::from_value::<Vec<u8>>(args["bytes"].clone()).map_err(error)?).map_err(operation)?)),
            "writeTree" => {
                let entries = args["entries"].as_array().ok_or_else(|| error("expected entries"))?.iter().map(|e| Ok(TreeEntry { name: text(e,"name")?.as_bytes().to_vec(), mode: e["mode"].as_u64().and_then(|n| u32::try_from(n).ok()).ok_or_else(|| error("expected mode"))?, oid: oid(text(e,"oid")?)? })).collect::<Result<Vec<_>>>()?;
                Ok(json!(port.write_tree(repo, &entries).map_err(operation)?))
            }
            "writeCommit" => {
                let identity = |v: &Value| -> Result<Identity> { Ok(Identity { name: text(v,"name")?.into(), email: text(v,"email")?.into() }) };
                let input = CommitInput { tree: oid(text(&args,"tree")?)?, parents: strings(&args,"parents")?.iter().map(|s| oid(s)).collect::<Result<_>>()?, author: identity(&args["author"])?, committer: identity(&args["committer"])?, author_date: text(&args,"authorDate")?.into(), committer_date: text(&args,"committerDate")?.into(), message: text(&args,"message")?.as_bytes().to_vec() };
                Ok(json!(port.write_commit(repo, &input).map_err(operation)?))
            }
            "readRef" => Ok(match port.read_ref(repo, &RefName::parse(text(&args,"name")?).map_err(error)?).map_err(operation)? { RefValue::Absent => json!({"kind":"absent"}), RefValue::Direct(oid) => json!({"kind":"direct","oid":oid}), RefValue::Symbolic(target) => json!({"kind":"symbolic","target":target}) }),
            "readObject" => {
                let kind = match text(&args,"expectedType")? { "blob" => ObjectType::Blob, "tree" => ObjectType::Tree, "commit" => ObjectType::Commit, "tag" => ObjectType::Tag, _ => return Err(error("invalid object type")) };
                Ok(match port.read_object(repo, &oid(text(&args,"oid")?)?, kind).map_err(operation)? { ReadObject::Missing => json!({"kind":"missing"}), ReadObject::Present { bytes, .. } => json!({"kind":"present","bytes":bytes}) })
            }
            "walkCommits" => {
                let page = port.walk_commits(repo, &strings(&args,"tips")?.iter().map(|s| oid(s)).collect::<Result<Vec<_>>>()?, &strings(&args,"stop")?.iter().map(|s| oid(s)).collect::<Result<Vec<_>>>()?, args.get("cursor").filter(|v| !v.is_null()).map(|v| serde_json::from_value(v.clone()).map(WalkCursor).map_err(error)).transpose()?, WalkBounds { max_commits: serde_json::from_value(args["maxCommits"].clone()).map_err(error)?, max_bytes: serde_json::from_value(args["maxBytes"].clone()).map_err(error)? }).map_err(operation)?;
                Ok(json!({"commits":page.commits.into_iter().map(|c| json!({"oid":c.oid,"parents":c.parents,"tree":c.tree})).collect::<Vec<_>>(),"nextCursor":page.next_cursor.map(|c| c.0),"complete":page.complete}))
            }
            "compareAndSwap" => Ok(json!(port.compare_and_swap(repo, &self.reference, &tip(&args["expected"])?, &tip(&args["next"])?, text(&args,"operationId")?).map_err(operation)?)),
            "pushRefs" => {
                let pairs: Vec<(String,String)> = serde_json::from_value(args["refs"].clone()).map_err(error)?;
                let refs = pairs.iter().map(|(a,b)| Ok((RefName::parse(a).map_err(error)?, RefName::parse(b).map_err(error)?))).collect::<Result<Vec<_>>>()?;
                let result = port.push_refs(repo, text(&args,"remote")?, &refs).map_err(operation)?;
                Ok(json!({"receipt":result.receipt,"refs":result.refs.into_iter().map(|(name,outcome)| { let value = match outcome { PushOutcome::Accepted => json!({"kind":"accepted"}), PushOutcome::RejectedNonFastForward { advertised_tip } => json!({"kind":"rejected-non-fast-forward","advertisedTip":advertised_tip}), PushOutcome::RejectedOther { reason } => json!({"kind":"rejected-other","reason":reason}), PushOutcome::RemoteOutcomeUnknown => json!({"kind":"remote-outcome-unknown"}) }; json!({"name":name,"outcome":value}) }).collect::<Vec<_>>()}))
            }
            "ensureFetchMapping" => Ok(json!(self.driver.ensure_fetch_mapping(repo, text(&args,"remote")?, &strings(&args,"refspecs")?, text(&args,"operationId")?).map_err(operation)?)),
            "recover" => Ok(json!(port.recover(repo,text(&args,"operationId")?).map_err(operation)?)),
            "reconcile" => self.driver.reconcile_operation(repo, vec![], &self.writer, text(&args,"operationId")?, Some(&port)).map_err(operation),
            "supersede" => Ok(json!(port.supersede(repo,text(&args,"oldId")?,text(&args,"laterId")?).map_err(operation)?)),
            "configuredFetchRefspecs" | "pushRefspecs" => {
                let remote = text(&args,"remote")?;
                let facts = if method == "configuredFetchRefspecs" { self.driver.configured_fetch_refspecs(repo,remote) } else { self.driver.push_refspecs(repo,remote) }.map_err(operation)?;
                Ok(json!(facts.into_iter().map(|f| json!({"value":f.value,"origin":f.origin})).collect::<Vec<_>>()))
            }
            "remoteUrl" => Ok(json!(self.driver.remote_url(repo,text(&args,"remote")?).map_err(operation)?)),
            "machineId" => Ok(json!(self.driver.machine_id(repo).map_err(operation)?.map(|f| json!({"value":f.value,"origin":f.origin})))),
            "fetchMappingProvenance" => Ok(json!(self.driver.fetch_mapping_provenance(repo,text(&args,"remote")?).map_err(operation)?.map(|f| json!({"operationId":f.operation_id,"remoteUrl":f.remote_url,"refspecs":f.refspecs})))),
            "gitFloorVerdict" => { let f = self.driver.git_floor_verdict().map_err(operation)?; Ok(json!({"version":f.version,"minimum":f.minimum,"supported":f.supported,"probes":f.probes.iter().map(|p| json!({"name":p.name,"passed":p.passed,"evidence":p.evidence})).collect::<Vec<_>>()})) },
            _ => Err(error("unknown-publication-method")),
        }
    }
}

/// Inspection never acquires event-seal or initializes a repository WAL.
#[napi]
pub fn inspect_git(
    state_root: String,
    repo_path: String,
    trusted_main: String,
    remote: Option<String>,
) -> Result<Value> {
    check()?;
    let driver = GitDriver::new(Path::new(&state_root)).map_err(operation)?;
    let floor = driver.git_floor_verdict().map_err(operation)?;
    let floor = json!({"version":floor.version,"minimum":floor.minimum,"supported":floor.supported,"probes":floor.probes.iter().map(|p| json!({"name":p.name,"passed":p.passed,"evidence":p.evidence})).collect::<Vec<_>>()});
    let repo = match driver
        .resolve_repo(Path::new(&repo_path), Path::new(&trusted_main))
        .map_err(operation)?
    {
        ResolveRepo::Repository(repo) => repo,
        ResolveRepo::NotARepository => return Ok(json!({"notARepository":true,"floor":floor})),
    };
    let wal_present = match std::fs::symlink_metadata(repo.common_dir().join("fgos/git")) {
        Ok(_) => true,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => false,
        Err(e) => return Err(error(e)),
    };
    // The reader below skips the fence on purpose (it never writes); the
    // fact is reported through the same check every WAL-writing door runs.
    let activation_fence = wal::require_activation_fence(&repo).is_ok();
    let journal = if wal_present {
        let wal = wal::Wal::open_existing(repo.common_dir(), wal::OsFileSystem).map_err(error)?;
        let scan = wal.scan(100_000).map_err(error)?;
        json!({"initialized":true,"complete":scan.complete,"pendingCount":scan.unresolved,"retainedBytes":scan.retained_bytes,"ledgerBytes":scan.ledger_bytes,"oldestUnresolved":scan.oldest_unresolved.map(|(id,time)| json!({"operationId":id,"unixMillis":time.duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_millis().to_string()})),"errors":scan.entries.iter().filter_map(|e| e.error.as_ref()).collect::<Vec<_>>()})
    } else {
        json!({"initialized":false,"complete":true,"pendingCount":0,"retainedBytes":0,"oldestUnresolved":null,"errors":[]})
    };
    let remote = remote.as_deref().unwrap_or("origin");
    let obsolete = obsolete_legacy_fetch_mapping(remote).map_err(operation)?;
    let mappings = driver
        .configured_fetch_refspecs(&repo, remote)
        .map_err(operation)?;
    let mut reserved_legacy_refs = Vec::new();
    let mut cursor = None;
    loop {
        let page = driver
            .list_refs(
                &repo,
                &[RefPrefix::parse("refs/fgos/remotes/").map_err(error)?],
                cursor,
                1000,
            )
            .map_err(operation)?;
        for entry in page.entries {
            let name = entry.name.as_str();
            if let Some((_, suffix)) = name
                .strip_prefix("refs/fgos/remotes/")
                .and_then(|r| r.split_once('/'))
            {
                if suffix.starts_with("legacy") && suffix != "legacy" {
                    reserved_legacy_refs.push(name.to_owned());
                }
            }
        }
        if page.complete {
            break;
        }
        cursor = page.next_cursor;
    }
    let mut native_locks = ["config.lock", "packed-refs.lock", "shallow.lock"]
        .iter()
        .filter(|name| std::fs::symlink_metadata(repo.common_dir().join(name)).is_ok())
        .map(|name| (*name).to_owned())
        .collect::<Vec<_>>();
    if std::fs::symlink_metadata(repo.git_dir().join("index.lock")).is_ok() {
        native_locks.push("index.lock".to_owned());
    }
    // A crash inside a pin delete leaves Git's own `<pin>.lock` beside the
    // operation's reachability pin; report it like the other native locks.
    let pins = std::path::Path::new("refs/fgos/git-operations");
    if let Ok(operations) = std::fs::read_dir(repo.common_dir().join(pins)) {
        for operation in operations.flatten() {
            let lock = pins.join(operation.file_name()).join("candidate.lock");
            if std::fs::symlink_metadata(repo.common_dir().join(&lock)).is_ok() {
                native_locks.push(lock.to_string_lossy().replace('\\', "/"));
            }
        }
    }
    native_locks.sort();
    Ok(
        json!({"floor":floor,"commonDir":repo.common_dir(),"layout":format!("{:?}",repo.layout()),"journal":journal,"activationFence":activation_fence,"nativeLocks":native_locks,"untrustedTransportConfig":driver.untrusted_transport_config(&repo).map_err(operation)?,"reservedLegacyRefs":reserved_legacy_refs,"obsoleteFetchMapping":mappings.iter().any(|f| f.value == obsolete.as_bytes()),"fetchRefspecs":mappings.into_iter().map(|f| String::from_utf8_lossy(&f.value).into_owned()).collect::<Vec<_>>(),"durability":"process-crash; file and parent sync; stable media not certified"}),
    )
}
#[napi]
pub fn initialize_git_wal(
    state_root: String,
    repo_path: String,
    trusted_main: String,
) -> Result<()> {
    check()?;
    let driver = GitDriver::new(Path::new(&state_root)).map_err(operation)?;
    match driver
        .resolve_repo(Path::new(&repo_path), Path::new(&trusted_main))
        .map_err(operation)?
    {
        ResolveRepo::Repository(repo) => {
            wal::Wal::open(&repo).map_err(error)?;
            Ok(())
        }
        ResolveRepo::NotARepository => Err(error("not-a-repository")),
    }
}

/// Repository configuration has its own rank-80 authority, independent of a seal.
#[napi]
pub fn ensure_git_fetch_mapping(
    state_root: String,
    repo_path: String,
    trusted_main: String,
    remote: String,
    refspecs: Vec<String>,
    operation_id: String,
) -> Result<Value> {
    check()?;
    require_lock_scope_platform().map_err(operation)?;
    let driver = GitDriver::new(Path::new(&state_root)).map_err(operation)?;
    match driver
        .resolve_repo(Path::new(&repo_path), Path::new(&trusted_main))
        .map_err(operation)?
    {
        ResolveRepo::Repository(repo) => Ok(json!(driver
            .ensure_fetch_mapping(&repo, &remote, &refspecs, &operation_id)
            .map_err(operation)?)),
        ResolveRepo::NotARepository => Err(error("not-a-repository")),
    }
}

/// Read the RepositoryConfig policy without creating a driver or changing config.
#[napi]
pub fn git_fetch_mappings(remote: String) -> Result<Vec<String>> {
    check()?;
    publication_fetch_mappings(&remote).map_err(operation)
}

#[napi]
pub fn prepare_git_driver_directories(state_root: String) -> Result<bool> {
    check()?;
    GitDriver::prepare_directories(Path::new(&state_root)).map_err(operation)
}
