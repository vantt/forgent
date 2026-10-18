//! Branch lifecycle policy composed from append, seal and Publication CAS.
use crate::{
    append::{append, Ack, AppendRequest, EventInput, Positions},
    envelope::Scope,
    errors::{invalid, io, Error, ErrorCode},
    fsio::{sync_dir, OsFileSystem},
    identity::StoreIdentity,
    layout::{Layout, StreamId},
    locks::{acquire_append, acquire_seal},
    receipt::Receipt,
    refs::own_ref,
    registry::Registry,
    seal::{operation_id, SealRequest},
    walk::git_error,
};
use fgos_git::{
    ExpectedTip, GitDriver, HolderAuthority, Publication, PublicationPort, RefValue, RepoHandle,
};
pub struct PromoteRequest<'a> {
    pub layout: &'a Layout,
    pub machine: &'a str,
    pub branch: &'a StreamId,
    pub through_seq: u64,
    pub writer: &'a str,
    pub ts: &'a str,
    pub cursor: &'a Positions,
    pub held_ranks: &'a [u32],
    pub hot_lock_depth: u32,
}
pub fn promote(
    driver: &GitDriver,
    repo: &RepoHandle,
    registry: &Registry,
    req: PromoteRequest<'_>,
) -> Result<Ack, Error> {
    if req.branch.scope() != Scope::Branch || req.through_seq == 0 {
        return Err(invalid("promote requires a branch and positive sequence"));
    }
    let mut guard =
        acquire_seal(req.layout, req.held_ranks, req.hot_lock_depth, false)?.expect("waited seal");
    crate::seal::seal_guarded(
        driver,
        repo,
        &SealRequest {
            layout: req.layout,
            machine: req.machine,
            stream: req.branch,
            held_ranks: req.held_ranks,
            hot_lock_depth: req.hot_lock_depth,
            opportunistic: false,
        },
        &mut guard,
        &OsFileSystem,
    )?;
    let branch = Receipt::read(&req.layout.stream(req.branch).sealed())?;
    if branch.last_seq < req.through_seq {
        return Err(invalid("promote exceeds sealed branch"));
    }
    let project = StreamId::parse("project")?;
    // Close the preceding segment so each promote has one branch parent.
    crate::seal::seal_guarded(
        driver,
        repo,
        &SealRequest {
            layout: req.layout,
            machine: req.machine,
            stream: &project,
            held_ranks: req.held_ranks,
            hot_lock_depth: req.hot_lock_depth,
            opportunistic: false,
        },
        &mut guard,
        &OsFileSystem,
    )?;
    let a = append(
        req.layout,
        registry,
        AppendRequest {
            stream: &project,
            events: &[EventInput {
                event_type: "store.promote".into(),
                schema_version: 1,
                payload: serde_json::json!({"stream":req.branch.as_str(),"throughSeq":req.through_seq,"tip":branch.commit}),
                ts: req.ts.into(),
            }],
            cursor: req.cursor,
            writer: req.writer,
            machine: req.machine,
            held_ranks: &[58],
        },
    )?;
    crate::seal::seal_guarded(
        driver,
        repo,
        &SealRequest {
            layout: req.layout,
            machine: req.machine,
            stream: &project,
            held_ranks: req.held_ranks,
            hot_lock_depth: req.hot_lock_depth,
            opportunistic: false,
        },
        &mut guard,
        &OsFileSystem,
    )?;
    Ok(a.ack)
}
pub fn abandon(
    driver: &GitDriver,
    repo: &RepoHandle,
    layout: &Layout,
    machine: &str,
    stream: &StreamId,
    held_ranks: &[u32],
    hot_lock_depth: u32,
) -> Result<(), Error> {
    if stream.scope() != Scope::Branch {
        return Err(invalid("only a branch can be abandoned"));
    }
    let mut guard = acquire_seal(layout, held_ranks, hot_lock_depth, false)?.expect("waited seal");
    let identity = StoreIdentity::open(layout, machine)?;
    let reference = own_ref(machine, stream)?;
    let port = PublicationPort::new(
        driver,
        HolderAuthority::new(
            repo,
            &mut guard.handle,
            &layout.seal_lock(),
            reference.clone(),
            &identity.store_id,
        )
        .map_err(git_error)?,
    );
    port.recover_publications(repo).map_err(git_error)?;
    match port.read_ref(repo, &reference).map_err(git_error)? {
        RefValue::Direct(oid) => {
            let id = operation_id()?;
            port.compare_and_swap(
                repo,
                &reference,
                &ExpectedTip::Oid(oid),
                &ExpectedTip::Absent,
                &id,
            )
            .map_err(git_error)?;
            port.release_pin_and_compact(repo, &id).map_err(git_error)?;
        }
        RefValue::Absent => (),
        RefValue::Symbolic(_) => {
            return Err(Error::new(
                ErrorCode::EventStoreRefMoved,
                "symbolic branch ref",
            ))
        }
    }
    // Appenders cannot race the local deletion after the ref's durable CAS.
    let _append = acquire_append(layout, &[58], &OsFileSystem)?;
    match std::fs::remove_dir_all(layout.stream(stream).root) {
        Ok(()) => (),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => (),
        Err(e) => return Err(io(e)),
    }
    sync_dir(&layout.root)
}
