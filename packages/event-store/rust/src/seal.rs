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
use std::path::Path;
use fgos_git::{
    ExpectedTip, GitDriver, HolderAuthority, Inspect, Oid, Publication, PublicationPort, RefValue,
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
    /// Why the history checkpoint was not extended, when it was asked to be.
    pub checkpoint_error: Option<String>,
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
    seal_checkpointed(driver, repo, req, fs, None)
}
/// `seal_with_fs` that also moves the history checkpoint file to the commits it
/// published, so the next read continues from them. The file is a cache: a
/// failure to extend it is reported in `Sealed::checkpoint_error`, never raised.
pub fn seal_checkpointed(
    driver: &GitDriver,
    repo: &RepoHandle,
    req: SealRequest<'_>,
    fs: &(dyn FileSystem + Sync),
    checkpoint: Option<&Path>,
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
    let result = seal_guarded(driver, repo, &req, &mut guard, fs, checkpoint);
    if let Err(e) = &result {
        if matches!(
            e.code,
            ErrorCode::EventStoreRefMoved | ErrorCode::EventStoreSealMismatch
        ) {
            let root = req.layout.stream(req.stream).root;
            if root.is_dir() {
                let receipt = Receipt::read(&req.layout.stream(req.stream).sealed())?;
                let ranges = segments(&req.layout.stream(req.stream))?
                    .into_iter()
                    .map(|(f, l, _)| (f, l))
                    .collect::<Vec<_>>();
                let reference = own_ref(req.machine, req.stream)?;
                let tip = driver
                    .list_refs(
                        repo,
                        &[fgos_git::RefPrefix::parse(reference.as_str())
                            .map_err(|e| invalid(e.to_string()))?],
                        None,
                        1024,
                    )
                    .map_err(git_error)?;
                let diagnostic = crate::envelope::line(
                    &serde_json::json!({"code":e.code.to_string(),"detail":e.detail,"ref":reference.as_str(),"tip":format!("{tip:?}"),"ranges":ranges,"lastSeq":receipt.last_seq}),
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
    checkpoint: Option<&Path>,
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
    // Reconciliation may rebuild an entirely missing stream directory, not
    // only a receipt inside an existing one. Use the append/rotation layout door.
    crate::append::prepare_stream(req.layout, req.stream, fs)?;
    // Recover lost local hints before rotation can reuse a published sequence.
    if !req.layout.stream(req.stream).sealed().exists() {
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
            // A tip the receipt certified was fully verified by the walk that
            // wrote it, so walking from it again would find nothing.
            let walked = if let Some(tip) = tip
                .as_ref()
                .filter(|t| !prior.certified.contains(t.as_str()))
            {
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
            let known_tip = known_receipt_tip(
                &port,
                repo,
                req.layout,
                &reference,
                tip.as_ref(),
                &identity.store_id,
            )?;
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
                        // event-seal serializes legitimate writers; a different
                        // tip here is outside interference, never a blind retry.
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
            if let (Some(path), Some(before)) = (checkpoint, tip.as_ref()) {
                if *before != current_tip {
                    if let Err(error) = crate::checkpoint::advance(
                        path,
                        &identity.store_id,
                        reference.as_str(),
                        before.as_str(),
                        current_tip.as_str(),
                        &complete.events,
                    ) {
                        result.checkpoint_error = Some(error);
                    }
                }
            }
            std::fs::remove_file(&path).map_err(io)?;
            point(fs, Point::AfterSealDelete)?;
            sync_dir(&paths.closed())?;
            point(fs, Point::AfterSealDeleteDirFsync)?;
            result.segments += 1;
            result.last_seq = last;
        }
    }
    // Internal callers (including promote) must retire recovered diagnostics,
    // including when receipt/deletion recovery already left no closed segment.
    let record = paths.root.join("integrity.json");
    if record.exists() && segments(&paths)?.is_empty() {
        let diagnostic: serde_json::Value =
            serde_json::from_slice(&std::fs::read(&record).map_err(io)?)
                .map_err(|e| invalid(e.to_string()))?;
        let ranges: Vec<(u64, u64)> = serde_json::from_value(
            diagnostic
                .get("ranges")
                .cloned()
                .unwrap_or_else(|| serde_json::json!([])),
        )
        .map_err(|e| invalid(e.to_string()))?;
        let receipt = Receipt::read(&paths.sealed())?;
        if let RefValue::Direct(tip) = port.read_ref(repo, &reference).map_err(git_error)? {
            if known_receipt_tip(
                &port,
                repo,
                req.layout,
                &reference,
                Some(&tip),
                &identity.store_id,
            )? {
                // Never let a certificate hide the corruption that the record
                // described: revalidate from the roots before clearing it.
                let checked = walk::walk_verified(
                    &port,
                    repo,
                    &tip,
                    &Default::default(),
                    &Default::default(),
                    req.machine,
                    req.stream.scope(),
                )?;
                walk::check_contiguous(&checked.events, &Default::default())?;
                let high = checked
                    .published
                    .get(&format!("{}:{}", identity.store_id, req.stream.as_str()))
                    .copied()
                    .unwrap_or(0);
                if receipt.last_seq <= high
                    && ranges.iter().all(|(_, last)| *last <= receipt.last_seq)
                {
                    std::fs::remove_file(record).map_err(io)?;
                    sync_dir(&paths.root)?;
                }
            }
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
    if streams.is_empty() || !layout.root.try_exists().map_err(io)? {
        return Ok(0);
    }
    // Serialize the header read with append recovery/truncation and rotation.
    // Sealing may unlink an already-open closed file; its handle stays valid.
    let _guard = crate::locks::acquire_append(layout, &[], &crate::fsio::OsFileSystem)?;
    let mut age = 0;
    for s in streams {
        let p = layout.stream(s);
        let mut files: Vec<_> = segments(&p)?.into_iter().map(|(_, _, p)| p).collect();
        if p.active().exists() {
            files.push(p.active());
        }
        for p in files {
            // Open once: rename/unlink cannot change this header snapshot. A writer
            // only appends; an incomplete first line is not an observation yet.
            use std::io::BufRead;
            let file = match std::fs::File::open(p) {
                Ok(file) => file,
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => continue,
                Err(e) => return Err(io(e)),
            };
            let mut line = Vec::new();
            std::io::BufReader::new(file)
                .read_until(b'\n', &mut line)
                .map_err(io)?;
            if line.last() == Some(&b'\n') && line.len() > 1 {
                {
                    let e = serde_json::from_slice::<crate::envelope::Envelope>(&line)
                        .map_err(|e| invalid(e.to_string()))?;
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
    let mut results = Vec::new();
    let mut errors = Vec::new();
    for stream in streams {
        match seal(
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
        ) {
            Ok(result) => results.push(result),
            Err(error) => errors.push(error),
        }
    }
    if errors.is_empty() {
        Ok(results)
    } else {
        Err(Error::new(
            errors[0].code,
            errors
                .iter()
                .map(ToString::to_string)
                .collect::<Vec<_>>()
                .join("; "),
        ))
    }
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
pub(crate) fn known_receipt_tip(
    port: &dyn fgos_git::Inspect,
    repo: &RepoHandle,
    layout: &Layout,
    reference: &fgos_git::RefName,
    tip: Option<&Oid>,
    origin: &str,
) -> Result<bool, Error> {
    let Some(tip) = tip else { return Ok(false) };
    let mut known = false;
    let mut stops = Vec::new();
    for stream in layout.streams()? {
        let receipt = Receipt::read(&layout.stream(&stream).sealed())?;
        if receipt.reference == reference.as_str() && !receipt.commit.is_empty() {
            stops.push(
                Oid::parse(&receipt.commit, repo.object_format())
                    .map_err(|e| invalid(e.to_string()))?,
            );
            if receipt.commit == tip.as_str() {
                known = true;
            } else if !crate::read::descends(port, repo, tip, &receipt.commit)? {
                return Err(moved("ref no longer descends from a stream receipt"));
            }
        }
    }
    if known {
        return Ok(true);
    }
    // Only a candidate durably authorized by this store's reconciliation may
    // extend receipts with a merge or a shared-machine fast-forward.
    for oid in crate::receipt::reconciled_tips(layout, reference)? {
        if oid == tip.as_str() {
            return Ok(true);
        }
        stops.push(Oid::parse(&oid, repo.object_format()).map_err(|e| invalid(e.to_string()))?);
    }
    // Authenticate every unreceipted commit against a retained local segment.
    // Origin alone is insufficient evidence: an outside writer could copy it.
    let mut current = tip.clone();
    let mut visited = std::collections::BTreeSet::new();
    loop {
        if stops.contains(&current) {
            return Ok(true);
        }
        if !visited.insert(current.as_str().to_owned()) {
            return Err(invalid("cycle in publication ancestry"));
        }
        let page = port
            .walk_commits(
                repo,
                std::slice::from_ref(&current),
                &[],
                None,
                fgos_git::WalkBounds {
                    max_commits: 1,
                    max_bytes: 4 * 1024 * 1024,
                },
            )
            .map_err(git_error)?;
        let commit = page
            .commits
            .into_iter()
            .find(|c| c.oid == current)
            .ok_or_else(|| invalid("publication commit missing"))?;
        let parent = commit.parents.first().cloned();
        {
            let header = walk::header(port, repo, &commit.oid)?;
            let crate::envelope::Seal::Seal {
                origin: o,
                stream,
                first_seq,
                last_seq,
                ..
            } = header
            else {
                return Ok(false);
            };
            if o != origin {
                return Ok(false);
            }
            let stream = StreamId::parse(&stream)?;
            let segment = segments(&layout.stream(&stream))?
                .into_iter()
                .find(|(f, l, _)| *f == first_seq && *l == last_seq);
            let Some((_, _, path)) = segment else {
                return Ok(false);
            };
            let bytes = std::fs::read(path).map_err(io)?;
            closed(&bytes, origin, &stream, first_seq, last_seq)?;
            if walk::blob(port, repo, &commit.oid, b"events.jsonl")?.as_deref()
                != Some(bytes.as_slice())
            {
                return Ok(false);
            }
        }
        // Only the first-parent publication spine belongs to this ref.
        // Promote parents are independently verified by walk_verified.
        match parent {
            Some(parent) => current = parent,
            None => return Ok(true),
        }
    }
}
