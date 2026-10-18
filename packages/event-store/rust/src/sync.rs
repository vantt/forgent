//! Cross-machine sharing. One event-seal scope covers sealing and transport.
use crate::{
    envelope::{line, Scope},
    errors::{invalid, io, Error, ErrorCode},
    identity::StoreIdentity,
    layout::{Layout, StreamId},
    locks::acquire_seal,
    read::descends,
    receipt::Receipt,
    reconcile::reconcile,
    refs::own_ref,
    refspec,
    seal::{seal_guarded, SealRequest},
    walk::{self, git_error},
};
use fgos_git::*;
use serde::{Deserialize, Serialize};
use std::result::Result;
use std::{
    collections::BTreeMap,
    fs,
    time::{SystemTime, UNIX_EPOCH},
};

pub struct SyncRequest<'a> {
    pub layout: &'a Layout,
    pub machine: &'a str,
    pub remote: &'a str,
    pub no_push: bool,
    pub held_ranks: &'a [u32],
    pub hot_lock_depth: u32,
}
#[derive(Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncRecord {
    pub time: u64,
    pub remote: String,
    /// Last authenticated mirror tips; failures retain this baseline.
    pub tips: BTreeMap<String, String>,
    pub error: Option<String>,
    pub warnings: Vec<String>,
    pub unpublished_since: Option<u64>,
}
#[derive(Debug)]
pub struct Synced {
    pub mirrors_changed: bool,
    pub warnings: Vec<String>,
}
fn now() -> Result<u64, Error> {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .map_err(|e| invalid(e.to_string()))
}
pub fn sync_status(layout: &Layout) -> Result<SyncRecord, Error> {
    match fs::read(layout.root.join("sync.json")) {
        Ok(b) => serde_json::from_slice(&b).map_err(|e| invalid(e.to_string())),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(SyncRecord::default()),
        Err(e) => Err(io(e)),
    }
}
fn streams(layout: &Layout) -> Result<Vec<StreamId>, Error> {
    let mut out = Vec::new();
    for entry in fs::read_dir(&layout.root).map_err(io)? {
        let entry = entry.map_err(io)?;
        if entry.file_type().map_err(io)?.is_dir() {
            if let Some(name) = entry.file_name().to_str() {
                if let Ok(stream) = StreamId::parse(name) {
                    out.push(stream);
                }
            }
        }
    }
    out.sort_by(|a, b| a.as_str().cmp(b.as_str()));
    Ok(out)
}
fn tip(port: &dyn Publication, repo: &RepoHandle, reference: &str) -> Result<Option<Oid>, Error> {
    match port
        .read_ref(
            repo,
            &RefName::parse(reference).map_err(|e| invalid(e.to_string()))?,
        )
        .map_err(git_error)?
    {
        RefValue::Direct(o) => Ok(Some(o)),
        RefValue::Absent => Ok(None),
        _ => Err(invalid("symbolic event ref")),
    }
}
fn mirrors(
    git: &dyn Inspect,
    repo: &RepoHandle,
    remote: &str,
) -> Result<BTreeMap<String, String>, Error> {
    let prefix = RefPrefix::parse(&format!("refs/fgos/remotes/{remote}/"))
        .map_err(|e| invalid(e.to_string()))?;
    let mut cursor = None;
    let mut out = BTreeMap::new();
    loop {
        let page = git
            .list_refs(repo, std::slice::from_ref(&prefix), cursor, 256)
            .map_err(git_error)?;
        for r in page.entries {
            let RefValue::Direct(oid) = r.value else {
                return Err(invalid("symbolic mirror"));
            };
            out.insert(r.name.as_str().into(), oid.as_str().into());
        }
        if page.complete {
            return Ok(out);
        }
        cursor = Some(
            page.next_cursor
                .ok_or_else(|| invalid("missing ref continuation"))?,
        );
    }
}
fn verify_mirrors(
    port: &dyn Publication,
    repo: &RepoHandle,
    req: &SyncRequest<'_>,
    identity: Option<&StoreIdentity>,
    before: &BTreeMap<String, String>,
    after: &BTreeMap<String, String>,
) -> Result<Vec<String>, Error> {
    let mut warnings = Vec::new();
    let prefix = format!("refs/fgos/remotes/{}/events/", req.remote);
    for (name, value) in after {
        if let Some(machine) = name.strip_prefix(&prefix) {
            let oid =
                Oid::parse(value, repo.object_format()).map_err(|e| invalid(e.to_string()))?;
            if let Some(old) = before.get(name) {
                let old =
                    Oid::parse(old, repo.object_format()).map_err(|e| invalid(e.to_string()))?;
                if !descends(port, repo, &oid, old.as_str())? {
                    return Err(Error::new(
                        ErrorCode::EventStoreMirrorRewound,
                        format!("{name}: cache retained"),
                    ));
                }
            }
            let walked = walk::walk_verified(
                port,
                repo,
                &oid,
                &Default::default(),
                &Default::default(),
                machine,
                Scope::Project,
            )?;
            for e in &walked.events {
                if let Some(identity) = identity {
                    if e.origin == identity.store_id
                        && e.seq
                            > Receipt::read(
                                &req.layout.stream(&StreamId::parse(&e.stream)?).sealed(),
                            )?
                            .last_seq
                    {
                        return Err(Error::new(
                            ErrorCode::EventStoreRefTampered,
                            "mirror claims unpublished own origin",
                        ));
                    }
                    if machine == req.machine && e.origin != identity.store_id {
                        let warning = format!("event-store-machine-ref-shared: git config fgos.machineId <other-id> ({name})");
                        if !warnings.contains(&warning) {
                            warnings.push(warning)
                        }
                    }
                }
            }
            walk::check_contiguous(&walked.events, &Default::default())?;
        }
    }
    Ok(warnings)
}
/// Fence is read from HEAD through Git, never from mutable working-tree bytes.
fn legacy_pin(port: &dyn Inspect, repo: &RepoHandle) -> Result<Option<Oid>, Error> {
    let head = match port.resolve_head(repo).map_err(git_error)? {
        HeadFact::Attached { commit, .. } | HeadFact::Detached { commit } => commit,
        HeadFact::Unborn { .. } => return Ok(None),
    };
    let values = port
        .read_paths_at(repo, &head, &[b".fgos/events".to_vec()], 32 * 1024 * 1024)
        .map_err(git_error)?;
    let bytes = match values.into_iter().next().map(|p| p.value) {
        Some(PathValue::Blob(b)) => b,
        Some(PathValue::Absent | PathValue::NotABlob(ObjectType::Tree)) => return Ok(None),
        Some(PathValue::Error(e)) => return Err(git_error(e)),
        _ => return Err(invalid("invalid fence observation")),
    };
    let fence: crate::read::Fence =
        serde_json::from_slice(&bytes).map_err(|e| invalid(e.to_string()))?;
    let oid = Oid::parse(&fence.legacy_ref_oid, repo.object_format())
        .map_err(|e| invalid(e.to_string()))?;
    let seal = walk::header(port, repo, &oid)?;
    if fence.seal_digest != seal.digest()?
        || !matches!(seal,crate::envelope::Seal::Legacy{ref from_commit,..} if fence.from_commit == *from_commit)
    {
        return Err(Error::new(
            ErrorCode::EventStoreLegacyMismatch,
            "legacy seal differs from tracked fence",
        ));
    }
    Ok(Some(oid))
}
fn push(
    port: &dyn Publication,
    repo: &RepoHandle,
    remote: &str,
    reference: RefName,
) -> Result<(), Error> {
    let result = port
        .push_refs(repo, remote, &[(reference.clone(), reference)])
        .map_err(git_error)?;
    match result.refs.first().map(|r| &r.1) {
        Some(PushOutcome::Accepted) => Ok(()),
        Some(PushOutcome::RejectedNonFastForward { .. }) => Err(Error::new(
            ErrorCode::EventStorePushRejectedNonFastForward,
            "retry sync to fetch and merge; never force",
        )),
        other => Err(Error::new(
            ErrorCode::EventStoreIo,
            format!("push not acknowledged: {other:?}"),
        )),
    }
}
pub fn sync(driver: &GitDriver, repo: &RepoHandle, req: SyncRequest<'_>) -> Result<Synced, Error> {
    let mut guard = acquire_seal(req.layout, req.held_ranks, req.hot_lock_depth, false)?.unwrap();
    if repo.common_dir() != req.layout.common_dir {
        return Err(invalid("repository/layout mismatch"));
    }
    let mut state = sync_status(req.layout)?;
    let original = state.tips.clone();
    if !state.remote.is_empty() && state.remote != req.remote {
        state.tips.clear();
    }
    let mut unpublished = false;
    let result = (|| {
        let mut seal_errors = Vec::new();
        for stream in streams(req.layout)? {
            if let Err(error) = seal_guarded(
                driver,
                repo,
                &SealRequest {
                    layout: req.layout,
                    machine: req.machine,
                    stream: &stream,
                    held_ranks: req.held_ranks,
                    hot_lock_depth: req.hot_lock_depth,
                    opportunistic: false,
                },
                &mut guard,
                &crate::fsio::OsFileSystem,
            ) {
                seal_errors.push(error);
            }
        }
        if let Some(first) = seal_errors.first() {
            return Err(Error::new(
                first.code,
                seal_errors
                    .iter()
                    .map(ToString::to_string)
                    .collect::<Vec<_>>()
                    .join("; "),
            ));
        }
        let identity = if req.layout.store().exists() {
            Some(StoreIdentity::open(req.layout, req.machine)?)
        } else {
            None
        };
        let writer = identity
            .as_ref()
            .map(|i| i.store_id.as_str())
            .unwrap_or("sync");
        let reference = own_ref(req.machine, &StreamId::parse("project")?)?;
        let url = refspec::pinned_url(driver, repo, req.remote)?;
        let grant = RemoteGrant {
            name: req.remote.into(),
            pinned_url: url,
        };
        let fetched;
        {
            // Fetch/legacy authority is stable even before this clone's first
            // append mints its store id. A failed fetch cannot block local seals.
            let port = PublicationPort::new(
                driver,
                HolderAuthority::legacy_import(
                    repo,
                    &mut guard.handle,
                    &req.layout.seal_lock(),
                    "event-store-sync",
                )
                .map_err(git_error)?,
            )
            .with_remote(grant.clone());
            port.recover_publications(repo).map_err(git_error)?;
            let observed = mirrors(&port, repo, req.remote)?;
            port.fetch_refs(repo, req.remote, &refspec::mappings(req.remote)?)
                .map_err(git_error)?;
            fetched = mirrors(&port, repo, req.remote)?;
            let mut baseline = observed;
            baseline.extend(state.tips.clone());
            state.warnings =
                verify_mirrors(&port, repo, &req, identity.as_ref(), &baseline, &fetched)?;
        }
        {
            let port = PublicationPort::new(
                driver,
                HolderAuthority::new(
                    repo,
                    &mut guard.handle,
                    &req.layout.seal_lock(),
                    reference.clone(),
                    writer,
                )
                .map_err(git_error)?,
            )
            .with_remote(grant.clone());
            port.recover_publications(repo).map_err(git_error)?;
            let pin = legacy_pin(&port, repo)?;
            let remote_legacy = tip(
                &port,
                repo,
                &format!("refs/fgos/remotes/{}/legacy", req.remote),
            )?;
            let local_legacy = tip(&port, repo, "refs/fgos/legacy")?;
            if remote_legacy
                .as_ref()
                .is_some_and(|o| Some(o) != pin.as_ref())
                || local_legacy
                    .as_ref()
                    .is_some_and(|o| Some(o) != pin.as_ref())
            {
                return Err(Error::new(
                    ErrorCode::EventStoreLegacyMismatch,
                    "legacy ref does not match tracked fence",
                ));
            }
            state.tips = fetched;
            let own = tip(&port, repo, reference.as_str())?;
            if let Some(own) = &own {
                let checked = walk::walk_verified(
                    &port,
                    repo,
                    own,
                    &Default::default(),
                    &Default::default(),
                    req.machine,
                    Scope::Project,
                )?;
                walk::check_contiguous(&checked.events, &Default::default())?;
                if let Some(identity) = &identity {
                    if !crate::seal::known_receipt_tip(
                        &port,
                        repo,
                        req.layout,
                        &reference,
                        Some(own),
                        &identity.store_id,
                    )? {
                        return Err(Error::new(
                            ErrorCode::EventStoreRefMoved,
                            "own ref lacks authenticated publication evidence",
                        ));
                    }
                }
            }
            if let Some(mirror) = tip(
                &port,
                repo,
                &format!("refs/fgos/remotes/{}/events/{}", req.remote, req.machine),
            )? {
                reconcile(
                    &port,
                    repo,
                    &reference,
                    tip(&port, repo, reference.as_str())?,
                    &mirror,
                    req.machine,
                )?;
            }
            if !req.no_push && identity.is_some() && tip(&port, repo, reference.as_str())?.is_some()
            {
                push(&port, repo, req.remote, reference.clone())?;
            }
            if req.no_push {
                if let Some(own) = tip(&port, repo, reference.as_str())? {
                    unpublished = match tip(
                        &port,
                        repo,
                        &format!("refs/fgos/remotes/{}/events/{}", req.remote, req.machine),
                    )? {
                        Some(mirror) => !descends(&port, repo, &mirror, own.as_str())?,
                        None => true,
                    };
                }
            }
        }
        if !req.no_push {
            let authority = HolderAuthority::legacy_import(
                repo,
                &mut guard.handle,
                &req.layout.seal_lock(),
                "event-store-sync",
            )
            .map_err(git_error)?;
            let port = PublicationPort::new(driver, authority).with_remote(grant);
            let local = tip(&port, repo, "refs/fgos/legacy")?;
            let mirror = tip(
                &port,
                repo,
                &format!("refs/fgos/remotes/{}/legacy", req.remote),
            )?;
            if local.is_some() && mirror.is_none() {
                push(
                    &port,
                    repo,
                    req.remote,
                    RefName::parse("refs/fgos/legacy").unwrap(),
                )?;
            }
            // Confirm publication in mirrors for retirement/status and consumer notification.
            port.fetch_refs(repo, req.remote, &refspec::mappings(req.remote)?)
                .map_err(git_error)?;
            let fetched = mirrors(&port, repo, req.remote)?;
            state.warnings =
                verify_mirrors(&port, repo, &req, identity.as_ref(), &state.tips, &fetched)?;
            if let Some(remote_legacy) = tip(
                &port,
                repo,
                &format!("refs/fgos/remotes/{}/legacy", req.remote),
            )? {
                if Some(remote_legacy) != legacy_pin(&port, repo)? {
                    return Err(Error::new(
                        ErrorCode::EventStoreLegacyMismatch,
                        "legacy ref changed during sync",
                    ));
                }
            }
            state.tips = fetched;
        }
        Ok(Synced {
            mirrors_changed: original != state.tips,
            warnings: state.warnings.clone(),
        })
    })();
    state.time = now()?;
    state.remote = req.remote.into();
    state.error = result.as_ref().err().map(ToString::to_string);
    if state.error.is_some() || unpublished {
        state.unpublished_since.get_or_insert(state.time);
    } else {
        state.unpublished_since = None;
    }
    fgos_durable_file::replace_durably(&req.layout.root, "sync.json", &line(&state)?)
        .map_err(Error::from_install_error)?;
    result
}
#[derive(Debug)]
pub struct Unpublished {
    pub stream: StreamId,
    pub sealed_pushed: bool,
    pub oldest_unsealed_age_sec: u64,
}
pub fn unpublished_summary(
    port: &dyn Publication,
    repo: &RepoHandle,
    layout: &Layout,
    machine: &str,
    remote: &str,
) -> Result<Vec<Unpublished>, Error> {
    let mirror = tip(
        port,
        repo,
        &format!("refs/fgos/remotes/{remote}/events/{machine}"),
    )?;
    let mut out = Vec::new();
    for stream in streams(layout)? {
        let own = tip(port, repo, own_ref(machine, &stream)?.as_str())?;
        let sealed_pushed = if stream.scope() != Scope::Project {
            true
        } else {
            match (&own, &mirror) {
                (None, _) => true,
                (Some(a), Some(b)) => descends(port, repo, b, a.as_str())?,
                _ => false,
            }
        };
        let age = crate::seal::oldest_unsealed_age_sec(layout, std::slice::from_ref(&stream))?;
        out.push(Unpublished {
            stream,
            sealed_pushed,
            oldest_unsealed_age_sec: age,
        });
    }
    Ok(out)
}
