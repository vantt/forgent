//! Branch lifecycle policy composed from append, seal and Publication CAS.
use crate::{
    append::{append, Ack, AppendRequest, EventInput, Positions},
    envelope::Scope,
    errors::{invalid, Error},
    fsio::OsFileSystem,
    layout::{Layout, StreamId},
    locks::acquire_seal,
    receipt::Receipt,
    registry::Registry,
    seal::SealRequest,
};
use fgos_git::{GitDriver, RepoHandle};
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
        None,
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
        None,
    )?;
    if Receipt::read(&req.layout.stream(&project).sealed())?
        .commit
        .is_empty()
    {
        return Err(invalid("promote requires an existing project publication"));
    }
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
        None,
    )?;
    Ok(a.ack)
}
