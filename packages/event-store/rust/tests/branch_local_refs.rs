mod common;
use common::Repo;
use fgos_event_store::{
    append::{append, AppendRequest, EventInput, Positions},
    envelope::Scope,
    layout::StreamId,
    promote::{abandon, promote, PromoteRequest},
    receipt::Receipt,
    refs::own_ref,
    registry::{ConsumerContract, Registration, Registry},
    seal::{seal, SealRequest},
    walk,
};
use fgos_git::{GitDriver, Inspect, ResolveRepo};
fn registry() -> Registry {
    let mut r = common::registry();
    r.register(ConsumerContract {
        v: 1,
        types: vec![
            Registration {
                event_type: "branch.note".into(),
                domain: "branch".into(),
                schema_version: 1,
                scope: Scope::Branch,
                seal_on_write: false,
            },
            Registration {
                event_type: "local.note".into(),
                domain: "local".into(),
                schema_version: 1,
                scope: Scope::Local,
                seal_on_write: false,
            },
        ],
    })
    .unwrap();
    r
}
#[test]
fn branch_and_local_refs_promote_two_parents_and_abandon_exact_old() {
    let r = Repo::new();
    r.append(1);
    let reg = registry();
    let branch = StreamId::parse("branch:feature").unwrap();
    let local = StreamId::parse("local").unwrap();
    let d = GitDriver::new(&r.root).unwrap();
    let repo = match d.resolve_repo(&r.root, &r.root).unwrap() {
        ResolveRepo::Repository(r) => r,
        _ => panic!(),
    };
    for (s, t) in [(&branch, "branch.note"), (&local, "local.note")] {
        append(
            &r.layout,
            &reg,
            AppendRequest {
                stream: s,
                events: &[EventInput {
                    event_type: t.into(),
                    schema_version: 1,
                    payload: serde_json::json!({}),
                    ts: "2026-10-18T05:00:00.000Z".into(),
                }],
                cursor: &Positions::new(),
                writer: "writer",
                machine: "test-aa2345",
                held_ranks: &[],
            },
        )
        .unwrap();
        seal(
            &d,
            &repo,
            SealRequest {
                layout: &r.layout,
                machine: "test-aa2345",
                stream: s,
                held_ranks: &[],
                hot_lock_depth: 0,
                opportunistic: false,
            },
        )
        .unwrap();
    }
    let branch_tip = Receipt::read(&r.layout.stream(&branch).sealed())
        .unwrap()
        .commit;
    let local_tip = Receipt::read(&r.layout.stream(&local).sealed())
        .unwrap()
        .commit;
    assert_eq!(
        own_ref("test-aa2345", &branch).unwrap().as_str(),
        "refs/fgos/branch-events/test-aa2345/feature"
    );
    assert_eq!(
        own_ref("test-aa2345", &local).unwrap().as_str(),
        "refs/fgos/local-events/test-aa2345"
    );
    let a = promote(
        &d,
        &repo,
        &reg,
        PromoteRequest {
            layout: &r.layout,
            machine: "test-aa2345",
            branch: &branch,
            through_seq: 1,
            writer: "writer",
            ts: "2026-10-18T05:00:01.000Z",
            cursor: &Positions::new(),
            held_ranks: &[],
            hot_lock_depth: 0,
        },
    )
    .unwrap();
    assert_eq!(a.last_seq, 2);
    let project = Receipt::read(&r.layout.stream(&r.stream).sealed()).unwrap();
    let oid = fgos_git::Oid::parse(&project.commit, repo.object_format()).unwrap();
    let page = d
        .walk_commits(
            &repo,
            std::slice::from_ref(&oid),
            &[],
            None,
            fgos_git::WalkBounds {
                max_commits: 100,
                max_bytes: 1_000_000,
            },
        )
        .unwrap();
    let commit = page.commits.iter().find(|c| c.oid == oid).unwrap();
    assert_eq!(commit.parents.len(), 2);
    assert_eq!(commit.parents[1].as_str(), branch_tip);
    let walked = walk::walk_verified(
        &d,
        &repo,
        &oid,
        &Positions::new(),
        &Default::default(),
        "test-aa2345",
        Scope::Project,
    )
    .unwrap();
    let ordered = fgos_event_store::order::order(&walked.events, &Positions::new(), true).unwrap();
    assert!(ordered.deferred.is_empty());
    assert_eq!(
        ordered
            .events
            .iter()
            .map(|e| e.event_type.as_str())
            .collect::<Vec<_>>(),
        vec!["work.add", "store.promote", "branch.note"]
    );
    abandon(&d, &repo, &r.layout, "test-aa2345", &branch, &[], 0).unwrap();
    assert!(!r.layout.stream(&branch).root.exists());
    let refs = d
        .list_refs(
            &repo,
            &[fgos_git::RefPrefix::parse("refs/fgos/").unwrap()],
            None,
            100,
        )
        .unwrap();
    assert!(!refs
        .entries
        .iter()
        .any(|e| e.name == own_ref("test-aa2345", &branch).unwrap()));
    assert!(refs
        .entries
        .iter()
        .any(|e| e.name == own_ref("test-aa2345", &local).unwrap()));
    assert_eq!(
        Receipt::read(&r.layout.stream(&local).sealed())
            .unwrap()
            .commit,
        local_tip
    );
    assert_eq!(
        walk::walk(&d, &repo, &[oid], &Positions::new(), &Default::default())
            .unwrap()
            .events
            .len(),
        3
    );
}

#[test]
fn abandon_preserves_branch_until_pending_promote_is_sealed() {
    let r = Repo::new();
    let reg = registry();
    let branch = StreamId::parse("branch:pending").unwrap();
    let d = GitDriver::new(&r.root).unwrap();
    let repo = match d.resolve_repo(&r.root, &r.root).unwrap() {
        ResolveRepo::Repository(r) => r,
        _ => panic!(),
    };
    append(
        &r.layout,
        &reg,
        AppendRequest {
            stream: &branch,
            events: &[EventInput {
                event_type: "branch.note".into(),
                schema_version: 1,
                payload: serde_json::json!({}),
                ts: "2026-10-18T05:00:00.000Z".into(),
            }],
            cursor: &Positions::new(),
            writer: "test",
            machine: "test-aa2345",
            held_ranks: &[],
        },
    )
    .unwrap();
    // An empty project cannot provide parent zero for a promote.
    assert!(promote(
        &d,
        &repo,
        &reg,
        PromoteRequest {
            layout: &r.layout,
            machine: "test-aa2345",
            branch: &branch,
            through_seq: 1,
            writer: "test",
            ts: "2026-10-18T05:00:01.000Z",
            cursor: &Positions::new(),
            held_ranks: &[],
            hot_lock_depth: 0
        }
    )
    .is_err());
    r.append(1);
    let branch_tip = Receipt::read(&r.layout.stream(&branch).sealed())
        .unwrap()
        .commit;
    append(&r.layout, &reg, AppendRequest { stream: &r.stream, events: &[EventInput { event_type: "store.promote".into(), schema_version: 1, payload: serde_json::json!({"stream":branch.as_str(),"throughSeq":1,"tip":branch_tip}), ts: "2026-10-18T05:00:01.000Z".into() }], cursor: &Positions::new(), writer: "test", machine: "test-aa2345", held_ranks: &[] }).unwrap();
    for closed in [false, true] {
        if closed {
            fgos_event_store::rotate::rotate(&r.layout, "test-aa2345", &r.stream, &[]).unwrap();
        }
        assert!(abandon(&d, &repo, &r.layout, "test-aa2345", &branch, &[], 0).is_err());
        assert!(r.layout.stream(&branch).root.exists());
    }
    seal(
        &d,
        &repo,
        SealRequest {
            layout: &r.layout,
            machine: "test-aa2345",
            stream: &r.stream,
            held_ranks: &[],
            hot_lock_depth: 0,
            opportunistic: false,
        },
    )
    .unwrap();
    abandon(&d, &repo, &r.layout, "test-aa2345", &branch, &[], 0).unwrap();
}
