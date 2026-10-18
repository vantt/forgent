//! Rotate, verify, publish, durably receipt, then remove. No append lock during Git.
use crate::{
    envelope::sha256,
    errors::{invalid, io, Error, ErrorCode},
    fsio::{point, sync_dir, FileSystem, OsFileSystem, Point},
    identity::StoreIdentity,
    layout::{Layout, StreamId},
    locks::acquire_seal,
    open_read::{closed, segments},
    order::{order, stream_key},
    receipt::Receipt,
    refs::own_ref,
    walk::{self, git_error},
};
use fgos_git::{
    ExpectedTip, GitDriver, HolderAuthority, Oid, Publication, PublicationPort, RefValue,
    RepoHandle,
};
struct PublicationFs<'a>(&'a (dyn FileSystem + Sync));
impl fgos_git::wal::FileSystem for PublicationFs<'_> {
    fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
        match step {
            "mkdir" => self.0.checkpoint(Point::BeforeSealIntent),
            "before-target-cas" => self.0.checkpoint(Point::BeforeSealTargetCas),
            "after-target-cas" => self.0.checkpoint(Point::AfterSealTargetCas),
            _ => Ok(()),
        }
    }
}
pub(crate) fn operation_id() -> Result<String, Error> {
    Ok(format!("es-{}", crate::identity::random_id()?))
}
pub struct SealRequest<'a> {
    pub layout: &'a Layout,
    pub machine: &'a str,
    pub stream: &'a StreamId,
    pub held_ranks: &'a [u32],
    pub hot_lock_depth: u32,
    pub opportunistic: bool,
}
#[derive(Debug, Default)]
pub struct Sealed {
    pub segments: usize,
    pub busy: bool,
    pub last_seq: u64,
}
pub fn seal(driver: &GitDriver, repo: &RepoHandle, req: SealRequest<'_>) -> Result<Sealed, Error> {
    seal_with_fs(driver, repo, req, &OsFileSystem)
}
pub fn seal_with_fs(
    driver: &GitDriver,
    repo: &RepoHandle,
    req: SealRequest<'_>,
    fs: &(dyn FileSystem + Sync),
) -> Result<Sealed, Error> {
    let Some(mut guard) = acquire_seal(
        req.layout,
        req.held_ranks,
        req.hot_lock_depth,
        req.opportunistic,
    )?
    else {
        return Ok(Sealed {
            busy: true,
            ..Default::default()
        });
    };
    let result = seal_guarded(driver, repo, &req, &mut guard, fs);
    if let Err(e) = &result {
        if matches!(
            e.code,
            ErrorCode::EventStoreRefMoved | ErrorCode::EventStoreSealMismatch
        ) {
            let root = req.layout.stream(req.stream).root;
            if root.is_dir() {
                let diagnostic = crate::envelope::line(
                    &serde_json::json!({"code":e.code.to_string(),"detail":e.detail,"ref":own_ref(req.machine,req.stream)?.as_str()}),
                )?;
                fgos_durable_file::replace_durably(&root, "integrity.json", &diagnostic).map_err(
                    |failure| {
                        Error::new(
                            ErrorCode::EventStoreIo,
                            format!("{e}; integrity record: {failure}"),
                        )
                    },
                )?;
            }
        }
    }
    result
}
pub(crate) fn seal_guarded(
    driver: &GitDriver,
    repo: &RepoHandle,
    req: &SealRequest<'_>,
    guard: &mut crate::locks::SealGuard,
    fs: &(dyn FileSystem + Sync),
) -> Result<Sealed, Error> {
    guard.validate(req.layout)?;
    if repo.common_dir() != req.layout.common_dir {
        return Err(invalid("repository/layout mismatch"));
    }
    if !req.layout.store().exists() {
        return Ok(Sealed::default());
    }
    let identity = StoreIdentity::open(req.layout, req.machine)?;
    let reference = own_ref(req.machine, req.stream)?;
    // Recover lost local hints before rotation can reuse a published sequence.
    if !req.layout.stream(req.stream).sealed().exists()
        && segments(&req.layout.stream(req.stream))?.is_empty()
        && !req.layout.stream(req.stream).active().exists()
    {
        let port = PublicationPort::new(
            driver,
            HolderAuthority::new(
                repo,
                &mut guard.handle,
                &req.layout.seal_lock(),
                reference.clone(),
                &identity.store_id,
            )
            .map_err(git_error)?,
        );
        crate::read::reconcile_durable_history(
            &port,
            repo,
            req.layout,
            &identity.store_id,
            req.stream,
            &reference,
        )?;
    }
    crate::rotate::rotate_guarded(req.layout, req.machine, req.stream, guard, fs)?;
    let port = PublicationPort::with_filesystem(
        driver,
        HolderAuthority::new(
            repo,
            &mut guard.handle,
            &req.layout.seal_lock(),
            reference.clone(),
            &identity.store_id,
        )
        .map_err(git_error)?,
        PublicationFs(fs),
    );
    port.recover_publications(repo).map_err(git_error)?;
    let paths = req.layout.stream(req.stream);
    let mut result = Sealed {
        last_seq: Receipt::read(&paths.sealed())?.last_seq,
        ..Default::default()
    };
    for _ in 0..1024 {
        let listed = segments(&paths)?;
        if listed.is_empty() {
            break;
        }
        for (first, last, path) in listed {
            let bytes = std::fs::read(&path).map_err(io)?;
            let framed = closed(&bytes, &identity.store_id, req.stream, first, last)?;
            let prior = Receipt::read(&paths.sealed())?;
            let tip = match port.read_ref(repo, &reference).map_err(git_error)? {
                RefValue::Absent => None,
                RefValue::Direct(o) => Some(o),
                RefValue::Symbolic(_) => return Err(moved("symbolic own ref")),
            };
            if tip.is_none() && !prior.commit.is_empty() {
                return Err(moved("receipted own ref disappeared"));
            }
            let tips: Vec<_> = tip.iter().cloned().collect();
            let walked = if let Some(tip) = &tip {
                let w = walk::walk_verified(
                    &port,
                    repo,
                    tip,
                    &prior.cover,
                    &prior.certified,
                    req.machine,
                    req.stream.scope(),
                )?;
                walk::check_contiguous(&w.events, &prior.cover)?;
                w
            } else {
                walk::Walked::default()
            };
            let known_tip = known_receipt_tip(&port, repo, req.layout, &reference, tip.as_ref())?;
            let key = format!("{}:{}", identity.store_id, req.stream.as_str());
            let high = prior
                .cover
                .get(&key)
                .copied()
                .unwrap_or(0)
                .max(walked.published.get(&key).copied().unwrap_or(0));
            if prior.last_seq > high {
                return Err(Error::new(
                    ErrorCode::EventStoreChainGap,
                    "receipt above walked history",
                ));
            }
            let commit = if last <= high {
                // Recovery must authenticate the actual published bytes, even
                // when cached emitted coverage prunes the normal walk.
                let recovered = find_segment(
                    &port,
                    repo,
                    &tips,
                    &identity.store_id,
                    req.stream,
                    first,
                    last,
                    &bytes,
                )?;
                if !known_tip && tip.as_ref() != Some(&recovered) {
                    return Err(moved("unknown ref tip above recovered segment"));
                }
                recovered
            } else {
                if first != high + 1 {
                    return Err(Error::new(
                        ErrorCode::EventStoreChainGap,
                        "segment does not follow published sequence",
                    ));
                }
                if tip.is_some() && !known_tip {
                    return Err(moved("own ref differs from receipt"));
                }
                let new = crate::publish::objects(
                    &port,
                    repo,
                    req.machine,
                    req.stream,
                    &bytes,
                    &framed.events,
                    tips.clone(),
                )?;
                point(fs, Point::AfterSealObjects)?;
                let expected = tip
                    .clone()
                    .map(ExpectedTip::Oid)
                    .unwrap_or(ExpectedTip::Absent);
                let id = operation_id()?;
                match port.compare_and_swap(
                    repo,
                    &reference,
                    &expected,
                    &ExpectedTip::Oid(new.clone()),
                    &id,
                ) {
                    Ok(_) => {
                        port.release_pin_and_compact(repo, &id).map_err(git_error)?;
                    }
                    Err(e) if e.code == fgos_git::ResultCode::Stale => {
                        port.release_pin_and_compact(repo, &id).map_err(git_error)?;
                        let observed = port.read_ref(repo, &reference).map_err(git_error)?;
                        if let RefValue::Direct(tip) = observed {
                            let retry = walk::walk_verified(
                                &port,
                                repo,
                                &tip,
                                &prior.cover,
                                &prior.certified,
                                req.machine,
                                req.stream.scope(),
                            )?;
                            walk::check_contiguous(&retry.events, &prior.cover)?;
                            if tip != new {
                                return Err(moved("CAS lost to an outside ref move"));
                            }
                        } else {
                            return Err(moved("CAS lost; ref disappeared"));
                        }
                    }
                    Err(e) => return Err(git_error(e)),
                }
                point(fs, Point::AfterSealCas)?;
                new
            };
            let current = port.read_ref(repo, &reference).map_err(git_error)?;
            if !matches!(&current,RefValue::Direct(o) if tips.contains(o) || *o==commit)
                || walk::blob(&port, repo, &commit, b"events.jsonl")?.as_deref()
                    != Some(bytes.as_slice())
            {
                return Err(Error::new(
                    ErrorCode::EventStoreSealMismatch,
                    "ref or published bytes differ",
                ));
            }
            let current_tip = match current {
                RefValue::Direct(o) => o,
                _ => unreachable!(),
            };
            let complete = walk::walk_verified(
                &port,
                repo,
                &current_tip,
                &prior.cover,
                &prior.certified,
                req.machine,
                req.stream.scope(),
            )?;
            walk::check_contiguous(&complete.events, &prior.cover)?;
            let ordered = order(&complete.events, &prior.cover, false)?;
            let mut cover = prior.cover.clone();
            for e in &ordered.events {
                cover.insert(stream_key(e), e.seq);
            }
            let mut certified = prior.certified.clone();
            if ordered.deferred.is_empty() {
                certified = std::collections::BTreeSet::from([current_tip.as_str().into()]);
            }
            Receipt {
                last_seq: last.max(prior.last_seq),
                commit: current_tip.as_str().into(),
                reference: reference.as_str().into(),
                sha256: if last < prior.last_seq {
                    prior.sha256
                } else {
                    sha256(&bytes)
                },
                first_seq: if last < prior.last_seq {
                    prior.first_seq
                } else {
                    first
                },
                cover,
                certified,
            }
            .write_with_fs(&paths.root, fs)?;
            point(fs, Point::AfterSealReceipt)?;
            std::fs::remove_file(&path).map_err(io)?;
            point(fs, Point::AfterSealDelete)?;
            sync_dir(&paths.closed())?;
            point(fs, Point::AfterSealDeleteDirFsync)?;
            result.segments += 1;
            result.last_seq = last;
        }
    }
    Ok(result)
}
fn moved(detail: &str) -> Error {
    Error::new(ErrorCode::EventStoreRefMoved, detail)
}
#[allow(clippy::too_many_arguments)]
fn find_segment(
    port: &dyn Publication,
    repo: &RepoHandle,
    tips: &[Oid],
    origin: &str,
    stream: &StreamId,
    first: u64,
    last: u64,
    bytes: &[u8],
) -> Result<Oid, Error> {
    let mut cursor = None;
    loop {
        let page = port
            .walk_commits(
                repo,
                tips,
                &[],
                cursor,
                fgos_git::WalkBounds {
                    max_commits: 256,
                    max_bytes: 4 * 1024 * 1024,
                },
            )
            .map_err(git_error)?;
        for c in page.commits {
            if matches!(walk::header(port,repo,&c.oid)?,crate::envelope::Seal::Seal {origin:o,stream:s,first_seq:f,last_seq:l,..} if o==origin && s==stream.as_str() && f==first && l==last)
            {
                if walk::blob(port, repo, &c.oid, b"events.jsonl")?.as_deref() != Some(bytes) {
                    return Err(Error::new(
                        ErrorCode::EventStoreSealMismatch,
                        "published segment mismatch",
                    ));
                }
                return Ok(c.oid);
            }
        }
        if page.complete {
            return Err(Error::new(
                ErrorCode::EventStoreSealMismatch,
                "published segment not found",
            ));
        }
        cursor = page.next_cursor;
    }
}
/// Oldest local unsealed file age; no Git or gate work.
pub fn oldest_unsealed_age_sec(layout: &Layout, streams: &[StreamId]) -> Result<u64, Error> {
    let mut age = 0;
    for s in streams {
        let p = layout.stream(s);
        let mut files: Vec<_> = segments(&p)?.into_iter().map(|(_, _, p)| p).collect();
        if p.active().exists() {
            files.push(p.active());
        }
        for p in files {
            let bytes = std::fs::read(p).map_err(io)?;
            if let Some(line) = bytes.split(|b| *b == b'\n').find(|l| !l.is_empty()) {
                if let Ok(e) = serde_json::from_slice::<crate::envelope::Envelope>(line) {
                    let first = crate::publish::timestamp_seconds(&e.ts)?;
                    let now = std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .map_err(|e| invalid(e.to_string()))?
                        .as_secs();
                    age = age.max((now as i64).saturating_sub(first).max(0) as u64);
                }
            }
        }
    }
    Ok(age)
}
pub fn seal_all(
    driver: &GitDriver,
    repo: &RepoHandle,
    layout: &Layout,
    machine: &str,
    streams: &[StreamId],
    held_ranks: &[u32],
    hot_lock_depth: u32,
) -> Result<Vec<Sealed>, Error> {
    crate::locks::validate_seal_context(held_ranks, hot_lock_depth)?;
    streams
        .iter()
        .map(|stream| {
            seal(
                driver,
                repo,
                SealRequest {
                    layout,
                    machine,
                    stream,
                    held_ranks,
                    hot_lock_depth,
                    opportunistic: false,
                },
            )
        })
        .collect()
}
pub fn seal_if_due(
    driver: &GitDriver,
    repo: &RepoHandle,
    req: SealRequest<'_>,
    interval_sec: u64,
) -> Result<Sealed, Error> {
    crate::locks::validate_seal_context(req.held_ranks, req.hot_lock_depth)?;
    if oldest_unsealed_age_sec(req.layout, std::slice::from_ref(req.stream))? < interval_sec {
        return Ok(Sealed::default());
    }
    seal(
        driver,
        repo,
        SealRequest {
            opportunistic: true,
            ..req
        },
    )
}

// Project and project:<consumer> share one own ref. Another stream's durable
// receipt is equally valid evidence of this store's most recent publication.
fn known_receipt_tip(
    port: &dyn fgos_git::Inspect,
    repo: &RepoHandle,
    layout: &Layout,
    reference: &fgos_git::RefName,
    tip: Option<&Oid>,
) -> Result<bool, Error> {
    let Some(tip) = tip else { return Ok(false) };
    let mut known = false;
    for entry in std::fs::read_dir(&layout.root).map_err(io)? {
        let entry = entry.map_err(io)?;
        let name = entry.file_name();
        let Some(name) = name.to_str() else { continue };
        if StreamId::parse(name).is_err() || !entry.file_type().map_err(io)?.is_dir() {
            continue;
        }
        let receipt = Receipt::read(&entry.path().join("sealed.json"))?;
        if receipt.reference == reference.as_str() && !receipt.commit.is_empty() {
            if receipt.commit == tip.as_str() {
                known = true;
            } else if !crate::read::descends(port, repo, tip, &receipt.commit)? {
                return Err(moved("ref no longer descends from a stream receipt"));
            }
        }
    }
    Ok(known)
}
