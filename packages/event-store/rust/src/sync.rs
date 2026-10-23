//! Cross-machine sharing. One event-seal scope covers sealing and transport.
use crate::{
    envelope::{line, Scope},
    errors::{invalid, io, Error, ErrorCode},
    identity::StoreIdentity,
    layout::{Layout, StreamId},
    locks::acquire_seal,
    read::descends,
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
    /// Try the seal lock and skip, rather than wait, when another process holds
    /// it: the start- and end-of-command trigger never queues behind a seal.
    pub opportunistic: bool,
    pub held_ranks: &'a [u32],
    pub hot_lock_depth: u32,
}
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SyncRecord {
    #[serde(default)]
    pub last_fetch: Option<TransferRecord>,
    #[serde(default)]
    pub last_push: Option<TransferRecord>,
    #[serde(default = "record_version")]
    pub v: u8,
    pub time: u64,
    pub remote: String,
    /// Last authenticated mirror tips; failures retain this baseline.
    pub tips: BTreeMap<String, String>,
    #[serde(default)]
    pub positions: BTreeMap<String, crate::append::Positions>,
    pub error: Option<String>,
    pub warnings: Vec<String>,
    pub unpublished_since: Option<u64>,
}
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct TransferRecord {
    pub time: u64,
    pub remote: String,
    pub error: Option<String>,
}
fn transfer<T>(
    record: &mut Option<TransferRecord>,
    remote: &str,
    run: impl FnOnce() -> Result<T, Error>,
) -> Result<T, Error> {
    let time = now()?;
    let result = run();
    *record = Some(TransferRecord {
        time,
        remote: remote.into(),
        error: result.as_ref().err().map(ToString::to_string),
    });
    result
}
fn record_version() -> u8 {
    1
}
impl Default for SyncRecord {
    fn default() -> Self {
        Self {
            last_fetch: None,
            last_push: None,
            v: 1,
            time: 0,
            remote: String::new(),
            tips: Default::default(),
            positions: Default::default(),
            error: None,
            warnings: Vec::new(),
            unpublished_since: None,
        }
    }
}
#[derive(Debug)]
pub struct Synced {
    pub mirrors_changed: bool,
    pub warnings: Vec<String>,
    /// An opportunistic sync found the seal lock held and did nothing.
    pub busy: bool,
}
fn now() -> Result<u64, Error> {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .map_err(|e| invalid(e.to_string()))
}
pub fn sync_status(layout: &Layout) -> Result<SyncRecord, Error> {
    match fs::read(layout.root.join("sync.json")) {
        Ok(b) => {
            let record: SyncRecord =
                serde_json::from_slice(&b).map_err(|e| invalid(e.to_string()))?;
            if record.v != 1 {
                return Err(invalid("unsupported sync record version"));
            }
            Ok(record)
        }
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
    let mut out = BTreeMap::new();
    for r in crate::refs::list(git, repo, &[prefix])? {
        let RefValue::Direct(oid) = r.value else {
            return Err(invalid("symbolic mirror"));
        };
        out.insert(r.name.as_str().into(), oid.as_str().into());
    }
    Ok(out)
}

fn verify_mirrors(
    port: &dyn Publication,
    repo: &RepoHandle,
    req: &SyncRequest<'_>,
    identity: Option<&StoreIdentity>,
    state: &mut SyncRecord,
    after: &BTreeMap<String, String>,
    bounds: &crate::append::Positions,
) -> Result<(), Error> {
    let prefix = format!("refs/fgos/remotes/{}/events/", req.remote);
    for (name, value) in after {
        let Some(machine) = name.strip_prefix(&prefix) else {
            continue;
        };
        let result = (|| {
            let oid =
                Oid::parse(value, repo.object_format()).map_err(|e| invalid(e.to_string()))?;
            let mut certified = std::collections::BTreeSet::new();
            let mut cover = crate::append::Positions::new();
            if let Some(old) = state.tips.get(name) {
                if !descends(port, repo, &oid, old)? {
                    return Err(Error::new(
                        ErrorCode::EventStoreMirrorRewound,
                        format!("{name}: cache retained"),
                    ));
                }
                // Older status files have no positions; verify them in full once.
                if let Some(positions) = state.positions.get(name) {
                    certified.insert(old.clone());
                    cover = positions.clone();
                }
            }
            let walked = walk::walk_verified(
                port,
                repo,
                &oid,
                &cover,
                &certified,
                machine,
                Scope::Project,
            )?;
            if let Some(identity) = identity {
                walk::own_origin_bounded(&walked.published, &identity.store_id, bounds)?;
                if machine == req.machine
                    && walked.events.iter().any(|e| e.origin != identity.store_id)
                {
                    let warning = format!("event-store-machine-ref-shared: git config fgos.machineId <other-id> ({name})");
                    if !state.warnings.contains(&warning) {
                        state.warnings.push(warning);
                    }
                }
            }
            walk::check_contiguous(&walked.events, &cover)?;
            for (key, seq) in walked.published {
                cover
                    .entry(key)
                    .and_modify(|n| *n = (*n).max(seq))
                    .or_insert(seq);
            }
            state.positions.insert(name.clone(), cover);
            state.tips.insert(name.clone(), value.clone());
            Ok(())
        })();
        if let Err(error) = result {
            if machine == req.machine {
                return Err(error);
            }
            let warning = error.to_string();
            if !state.warnings.contains(&warning) {
                state.warnings.push(warning);
            }
        }
    }
    Ok(())
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
    sync_with_fs(driver, repo, req, &crate::fsio::OsFileSystem)
}
/// Uses the same filesystem boundary port as seal and append.
pub fn sync_with_fs(
    driver: &GitDriver,
    repo: &RepoHandle,
    req: SyncRequest<'_>,
    filesystem: &dyn crate::fsio::FileSystem,
) -> Result<Synced, Error> {
    let Some(mut guard) = acquire_seal(
        req.layout,
        req.held_ranks,
        req.hot_lock_depth,
        req.opportunistic,
    )?
    else {
        return Ok(Synced {
            mirrors_changed: false,
            warnings: Vec::new(),
            busy: true,
        });
    };
    if repo.common_dir() != req.layout.common_dir {
        return Err(invalid("repository/layout mismatch"));
    }
    let mut state = sync_status(req.layout)?;
    let original = state.tips.clone();
    if !state.remote.is_empty() && state.remote != req.remote {
        state.tips.clear();
        state.positions.clear();
    }
    state
        .warnings
        .retain(|w| w.starts_with("event-store-machine-ref-shared:"));
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
                None,
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
        let bounds = identity
            .as_ref()
            .map(|i| crate::receipt::own_bounds(req.layout, &i.store_id))
            .transpose()?
            .unwrap_or_default();
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
            transfer(&mut state.last_fetch, req.remote, || {
                port.fetch_refs(repo, req.remote, &refspec::mappings(req.remote)?)
                    .map_err(git_error)
            })?;
            fetched = mirrors(&port, repo, req.remote)?;
            verify_mirrors(
                &port,
                repo,
                &req,
                identity.as_ref(),
                &mut state,
                &fetched,
                &bounds,
            )?;
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
            let pin = crate::fence::pinned_legacy(&port, repo)?;
            let remote_legacy = tip(
                &port,
                repo,
                &format!("refs/fgos/remotes/{}/legacy", req.remote),
            )?;
            let local_legacy = tip(&port, repo, "refs/fgos/legacy")?;
            crate::fence::validate_refs(pin.as_ref(), local_legacy.iter())?;
            if let Err(error) = crate::fence::validate_refs(pin.as_ref(), remote_legacy.iter()) {
                state.warnings.push(error.to_string());
            } else if let Some(legacy) = remote_legacy {
                state.tips.insert(
                    format!("refs/fgos/remotes/{}/legacy", req.remote),
                    legacy.as_str().into(),
                );
            }
            let own = tip(&port, repo, reference.as_str())?;
            if let Some(own) = &own {
                if !crate::seal::known_receipt_tip(
                    &port,
                    repo,
                    req.layout,
                    &reference,
                    Some(own),
                    identity.as_ref().map(|i| i.store_id.as_str()).unwrap_or(""),
                )? {
                    return Err(Error::new(
                        ErrorCode::EventStoreRefMoved,
                        "own ref lacks authenticated publication evidence",
                    ));
                }
            }
            if let Some(mirror) = tip(
                &port,
                repo,
                &crate::refs::mirror_event(req.remote, req.machine),
            )? {
                reconcile(
                    &port,
                    repo,
                    &reference,
                    tip(&port, repo, reference.as_str())?,
                    &mirror,
                    req.machine,
                    req.layout,
                )?;
                crate::fsio::point(filesystem, crate::fsio::Point::AfterSyncReconcile)?;
            }
            if !req.no_push && identity.is_some() && tip(&port, repo, reference.as_str())?.is_some()
            {
                transfer(&mut state.last_push, req.remote, || {
                    push(&port, repo, req.remote, reference.clone())
                })?;
            }
            if req.no_push {
                if let Some(own) = tip(&port, repo, reference.as_str())? {
                    unpublished = match tip(
                        &port,
                        repo,
                        &crate::refs::mirror_event(req.remote, req.machine),
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
                transfer(&mut state.last_push, req.remote, || {
                    push(
                        &port,
                        repo,
                        req.remote,
                        RefName::parse("refs/fgos/legacy").unwrap(),
                    )
                })?;
            }
            // Confirm publication in mirrors for retirement/status and consumer notification.
            transfer(&mut state.last_fetch, req.remote, || {
                port.fetch_refs(repo, req.remote, &refspec::mappings(req.remote)?)
                    .map_err(git_error)
            })?;
            let fetched = mirrors(&port, repo, req.remote)?;
            verify_mirrors(
                &port,
                repo,
                &req,
                identity.as_ref(),
                &mut state,
                &fetched,
                &bounds,
            )?;
            if let Some(remote_legacy) = tip(
                &port,
                repo,
                &format!("refs/fgos/remotes/{}/legacy", req.remote),
            )? {
                if let Err(error) = crate::fence::validate_refs(
                    crate::fence::pinned_legacy(&port, repo)?.as_ref(),
                    std::iter::once(&remote_legacy),
                ) {
                    let warning = error.to_string();
                    if !state.warnings.contains(&warning) {
                        state.warnings.push(warning);
                    }
                } else {
                    state.tips.insert(
                        format!("refs/fgos/remotes/{}/legacy", req.remote),
                        remote_legacy.as_str().into(),
                    );
                }
            }
        }
        Ok(Synced {
            mirrors_changed: original != state.tips,
            warnings: state.warnings.clone(),
            busy: false,
        })
    })();
    state.time = match now() {
        Ok(time) => time,
        Err(error) => {
            state.warnings.push(error.to_string());
            state.time
        }
    };
    state.remote = req.remote.into();
    state.error = result.as_ref().err().map(ToString::to_string);
    if state.error.is_some() || unpublished {
        state.unpublished_since.get_or_insert(state.time);
    } else {
        state.unpublished_since = None;
    }
    if let Err(error) =
        fgos_durable_file::replace_durably(&req.layout.root, "sync.json", &line(&state)?)
    {
        let error = Error::from_install_error(error);
        return Err(match result {
            Err(original) => Error::new(
                original.code,
                format!("{original}; status write failed: {error}"),
            ),
            Ok(_) => error,
        });
    }
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
    let mirror = tip(port, repo, &crate::refs::mirror_event(remote, machine))?;
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

/// Outside-gate facade entry. Publication authority stays inside the crate.
pub fn guarded_unpublished_summary(
    driver: &GitDriver,
    repo: &RepoHandle,
    req: SyncRequest<'_>,
) -> Result<Vec<Unpublished>, Error> {
    if repo.common_dir() != req.layout.common_dir {
        return Err(invalid("repository/layout mismatch"));
    }
    let mut guard = acquire_seal(req.layout, req.held_ranks, req.hot_lock_depth, false)?
        .ok_or_else(|| invalid("explicit seal acquisition returned busy"))?;
    let reference = own_ref(req.machine, &StreamId::parse("project")?)?;
    let identity = match fs::symlink_metadata(req.layout.store()) {
        Ok(_) => Some(StoreIdentity::open(req.layout, req.machine)?),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => None,
        Err(error) => return Err(io(error)),
    };
    let writer = identity
        .as_ref()
        .map(|i| i.store_id.as_str())
        .unwrap_or("unpublished-summary");
    let path = req.layout.seal_lock();
    let authority = HolderAuthority::new(repo, &mut guard.handle, &path, reference, writer)
        .map_err(git_error)?;
    let port = PublicationPort::new(driver, authority);
    unpublished_summary(&port, repo, req.layout, req.machine, req.remote)
}
