//! Read-only observations. No recovery, receipt writes or configuration writes; age reads hold the append lock.
use crate::{
    errors::{io, Error},
    layout::{Layout, StreamId},
    walk::git_error,
};
use fgos_git::{GitDriver, Inspect, RefPrefix, RefValue, RepoHandle};
use serde_json::{json, Value};
use std::{collections::BTreeSet, fs};

pub fn streams(layout: &Layout) -> Result<Vec<StreamId>, Error> {
    let entries = match fs::read_dir(&layout.root) {
        Ok(e) => e,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(vec![]),
        Err(e) => return Err(io(e)),
    };
    let mut streams = Vec::new();
    for entry in entries {
        let entry = entry.map_err(io)?;
        if entry.file_type().map_err(io)?.is_dir() {
            if let Some(name) = entry.file_name().to_str() {
                if let Ok(s) = StreamId::parse(name) {
                    streams.push(s);
                }
            }
        }
    }
    streams.sort_by(|a, b| a.as_str().cmp(b.as_str()));
    Ok(streams)
}
pub fn facts(
    driver: &GitDriver,
    repo: &RepoHandle,
    state_root: &std::path::Path,
    remote: &str,
) -> Result<Value, Error> {
    let layout = Layout::from_common_dir(Some(repo.common_dir()))?;
    let floor = driver.git_floor_verdict().map_err(git_error)?;
    let fetch = driver
        .configured_fetch_refspecs(repo, remote)
        .map_err(git_error)?;
    let push = driver.push_refspecs(repo, remote).map_err(git_error)?;
    let url = driver.remote_url(repo, remote);
    let provenance = driver
        .fetch_mapping_provenance(repo, remote)
        .map_err(git_error)?;
    let configured = driver.machine_id(repo).map_err(git_error)?;
    let configured = configured
        .as_ref()
        .map(|f| std::str::from_utf8(&f.value))
        .transpose()
        .map_err(|e| crate::errors::invalid(e.to_string()))?;
    let machine = crate::identity::machine_id(configured, state_root);
    let guarantee = fgos_holder_lock::guarantee(&layout.common_dir);
    let urls = match url {
        Ok(url) => json!({"configured":true,"url":url}),
        Err(e)
            if e.stderr
                .windows(b"No such remote".len())
                .any(|s| s == b"No such remote") =>
        {
            json!({"configured":false,"url":null})
        }
        Err(e) => return Err(git_error(e)),
    };
    Ok(
        json!({"commonDir":repo.common_dir(),"trustedMain":repo.trusted_main_root(),"openRoot":layout.root,"floor":{"supported":floor.supported,"version":floor.version,"minimum":floor.minimum,"probes":floor.probes.iter().map(|p|json!({"passed":p.passed,"name":p.name,"evidence":p.evidence})).collect::<Vec<_>>()},"remote":remote,"remoteFact":urls,"fetchRefspecs":fetch.iter().map(|f| String::from_utf8_lossy(&f.value)).collect::<Vec<_>>(),"pushRefspecs":push.iter().map(|f| String::from_utf8_lossy(&f.value)).collect::<Vec<_>>(),"expectedFetchRefspecs":crate::refspec::mappings(remote)?,"provenance":provenance.map(|p|json!({"url":p.remote_url,"refspecs":p.refspecs})),"machineId":machine.as_ref().ok(),"machineError":machine.err().map(|e|e.to_string()),"guarantee":guarantee.to_json()}),
    )
}
/// Trigger observations from local open files and sync receipts only.
/// Never inspects refs, worktrees or legacy history; this is not integrity status.
pub fn maintenance(layout: &Layout) -> Result<Value, Error> {
    let mut rows = Vec::new();
    for stream in streams(layout)? {
        let age = crate::seal::oldest_unsealed_age_sec(layout, std::slice::from_ref(&stream))?;
        rows.push(json!({"stream":stream.as_str(),"oldestUnsealedAgeSec":age}));
    }
    let sync = crate::sync::sync_status(layout)?;
    // Any sync that ran, whether it reached the push or failed before it (an
    // offline fetch), is the attempt of its interval.
    let last_attempt = (sync.time > 0).then(|| json!({"time":sync.time,"remote":sync.remote}));
    Ok(json!({"streams":rows,"lastPush":sync.last_push,"lastAttempt":last_attempt}))
}
pub fn status(
    driver: &GitDriver,
    repo: &RepoHandle,
    layout: &Layout,
    machine: &str,
    remote: &str,
) -> Result<Value, Error> {
    let identity = match fs::symlink_metadata(layout.store()) {
        Ok(_) => Some(crate::identity::StoreIdentity::open(layout, machine)?),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => None,
        Err(e) => return Err(io(e)),
    };
    let origin = identity.as_ref().map(|i| i.store_id.as_str()).unwrap_or("");
    let mut streams = streams(layout)?;
    let refs = crate::refs::list(
        driver,
        repo,
        &[RefPrefix::parse("refs/fgos/").map_err(|e| crate::errors::invalid(e.to_string()))?],
    )?;
    // Project refs may carry streams absent from this clone's open root. Walk them
    // to discover those names; verification is repeated by the reader below.
    for entry in &refs {
        let name = entry.name.as_str();
        let suffix = if let Some(rest) = name.strip_prefix("refs/fgos/remotes/") {
            crate::read::mirror_suffix(rest)?
        } else {
            name.strip_prefix("refs/fgos/")
        };
        if let Some(machine) = suffix.and_then(|s| s.strip_prefix("events/")) {
            if let RefValue::Direct(oid) = &entry.value {
                let walked = crate::walk::walk_verified(
                    driver,
                    repo,
                    oid,
                    &Default::default(),
                    &Default::default(),
                    machine,
                    crate::envelope::Scope::Project,
                )?;
                for event in walked.events {
                    let s = StreamId::parse(&event.stream)?;
                    if !streams.contains(&s) {
                        streams.push(s);
                    }
                }
            }
        }
    }
    if !streams.iter().any(|s| s.as_str() == "project") {
        streams.push(StreamId::parse("project")?);
    }
    if !streams.iter().any(|s| s.as_str() == "project:porting") {
        streams.push(StreamId::parse("project:porting")?);
    }
    let mut rows = Vec::new();
    let mut integrity_errors = Vec::new();
    for stream in &streams {
        let local = crate::open_read::read_own(layout, origin, stream)?;
        let age = crate::seal::oldest_unsealed_age_sec(layout, std::slice::from_ref(stream))?;
        let paths = layout.stream(stream);
        if let Some(bytes) = crate::open_read::read_optional(&paths.root.join("integrity.json"))? {
            let record: Value = serde_json::from_slice(&bytes)
                .map_err(|e| crate::errors::invalid(e.to_string()))?;
            integrity_errors.push(json!({"stream":stream.as_str(),"record":record}));
        }

        let closed = match fs::read_dir(paths.closed()) {
            Ok(e) => e.collect::<Result<Vec<_>, _>>().map_err(io)?.len(),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => 0,
            Err(e) => return Err(io(e)),
        };
        rows.push(json!({"stream":stream.as_str(),"unsealedCount":local.events.len(),"oldestUnsealedAgeSec":age,"closedSegmentsPending":closed,"lastReceipt":crate::receipt::Receipt::read(&paths.sealed())?}));
    }
    let read = crate::read::read(
        driver,
        repo,
        crate::read::ReadRequest {
            layout,
            origin,
            streams: &streams,
            cursor: &Default::default(),
            folded: &[],
            project: true,
        },
    )?;
    let mut branches = BTreeSet::new();
    if !matches!(
        driver.resolve_head(repo).map_err(git_error)?,
        fgos_git::HeadFact::Unborn { .. }
    ) {
        let mut cursor = None;
        loop {
            let page = driver
                .list_worktrees(repo, cursor, 256)
                .map_err(git_error)?;
            for w in page.entries {
                if std::path::Path::new(&String::from_utf8_lossy(&w.path).to_string()).exists() {
                    if let Some(branch) = w.branch {
                        if let Ok(key) = crate::layout::branch_key(
                            branch.as_str().trim_start_matches("refs/heads/"),
                        ) {
                            branches.insert(format!("branch:{key}"));
                        }
                    }
                }
            }
            if page.complete {
                break;
            }
            cursor = page.next_cursor;
        }
    }
    let mut branch_streams: BTreeSet<String> = streams
        .iter()
        .filter(|s| s.as_str().starts_with("branch:"))
        .map(|s| s.as_str().into())
        .collect();
    for r in &refs {
        if let Some(s) = r
            .name
            .as_str()
            .strip_prefix(&format!("refs/fgos/branch-events/{machine}/"))
        {
            branch_streams.insert(format!("branch:{s}"));
        }
    }
    let orphan: Vec<_> = branch_streams.difference(&branches).cloned().collect();
    let mut tips = serde_json::Map::new();
    for r in refs {
        if let RefValue::Direct(oid) = r.value {
            tips.insert(r.name.as_str().into(), json!(oid.as_str()));
        }
    }
    let own = tips.get(&format!("refs/fgos/events/{machine}"));
    let mirror = tips.get(&format!("refs/fgos/remotes/{remote}/events/{machine}"));
    let ahead_behind = ahead_behind(
        driver,
        repo,
        own.and_then(Value::as_str),
        mirror.and_then(Value::as_str),
    )?;
    let sync = crate::sync::sync_status(layout)?;
    let shared = if let Some(tip) = mirror.and_then(Value::as_str) {
        let tip = fgos_git::Oid::parse(tip, repo.object_format())
            .map_err(|e| crate::errors::invalid(e.to_string()))?;
        crate::walk::walk_verified(
            driver,
            repo,
            &tip,
            &Default::default(),
            &Default::default(),
            machine,
            crate::envelope::Scope::Project,
        )?
        .events
        .iter()
        .any(|e| e.origin != origin)
    } else {
        false
    };
    let missing: Vec<_> = read
        .missing
        .iter()
        .map(|(key, seq)| {
            let (origin, stream) = key.split_once(':').unwrap_or((key, ""));
            json!({"origin":origin,"stream":stream,"seq":seq})
        })
        .collect();
    Ok(
        json!({"v":1,"storeId":identity.map(|i|i.store_id),"machineId":machine,"refs":tips,"streams":rows,"lastFetch":sync.last_fetch,"lastPush":sync.last_push,"sync":sync,"aheadBehind":ahead_behind,"orphanBranches":orphan,"integrityErrors":integrity_errors,"deferred":read.deferred,"missing":missing,"machineRefShared":shared,"guarantee":fgos_holder_lock::guarantee(&layout.common_dir).to_json()}),
    )
}

// Inspect's stop list includes the stop commits and prunes only their parents;
// it is not rev-list's ancestry exclusion. Share two exact reachability walks
// across both counts rather than miscounting divergent histories.
fn ahead_behind(
    driver: &GitDriver,
    repo: &RepoHandle,
    own: Option<&str>,
    mirror: Option<&str>,
) -> Result<Value, Error> {
    if own == mirror {
        return Ok(json!({"ahead":0,"behind":0}));
    }
    let reachable = |tip: Option<&str>| -> Result<BTreeSet<String>, Error> {
        let Some(tip) = tip else {
            return Ok(BTreeSet::new());
        };
        let tips = [fgos_git::Oid::parse(tip, repo.object_format())
            .map_err(|e| crate::errors::invalid(e.to_string()))?];
        let mut commits = BTreeSet::new();
        let mut cursor = None;
        loop {
            let page = driver
                .walk_commits(
                    repo,
                    &tips,
                    &[],
                    cursor,
                    fgos_git::WalkBounds {
                        max_commits: 256,
                        max_bytes: 4 * 1024 * 1024,
                    },
                )
                .map_err(git_error)?;
            commits.extend(page.commits.into_iter().map(|c| c.oid.as_str().to_owned()));
            if page.complete {
                return Ok(commits);
            }
            cursor = Some(
                page.next_cursor
                    .ok_or_else(|| crate::errors::invalid("ancestry continuation missing"))?,
            );
        }
    };
    let own = reachable(own)?;
    let mirror = reachable(mirror)?;
    Ok(json!({"ahead":own.difference(&mirror).count(),"behind":mirror.difference(&own).count()}))
}
