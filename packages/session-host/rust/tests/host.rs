//! The Session Host's owning proofs, over a fake Terminal Control core and a fake process door.

use fgos_session_host::direct::Screenless;
use fgos_session_host::*;
use fgos_terminal_control::core::Want;
use fgos_terminal_control::driver::{Activity, ActivityDetail};
use fgos_terminal_control::port::{
    AllocateRequest, Allocation, Disposition, Inspection, LaunchOutcome, LaunchSpec, Origin,
    PaneState, ProcessIdentity, Refusal as PaneRefusal, ReleaseOutcome, SendOutcome, Slot,
};
use std::cell::RefCell;
use std::collections::BTreeSet;
use std::path::PathBuf;

#[derive(Default)]
struct PaneLog {
    live: BTreeSet<String>,
    allocated: Vec<AllocateRequest>,
    launched: Vec<(String, LaunchSpec)>,
    typed: Vec<String>,
    keys: Vec<Vec<String>>,
    released: Vec<(String, Disposition)>,
    focused: Vec<String>,
    working: bool,
    never_ready: bool,
    screen: String,
}

#[derive(Default)]
struct FakePanes(RefCell<PaneLog>);

impl Panes for FakePanes {
    fn allocate(&self, request: &AllocateRequest) -> Result<Allocation, PaneRefusal> {
        let mut log = self.0.borrow_mut();
        log.allocated.push(request.clone());
        log.live.insert(request.key.clone());
        Ok(Allocation {
            slot: Slot {
                tab_id: "t1".into(),
                pane_id: "p1".into(),
            },
            origin: Origin::Allocated,
        })
    }

    fn launch(&self, key: &str, spec: &LaunchSpec) -> Result<LaunchOutcome, PaneRefusal> {
        self.0
            .borrow_mut()
            .launched
            .push((key.into(), spec.clone()));
        Ok(LaunchOutcome::Launched(ProcessIdentity {
            pid: 1,
            start_time: "1".into(),
            boot_id: "b".into(),
            pgid: 1,
        }))
    }

    fn send(
        &self,
        _key: &str,
        text: Option<&str>,
        keys: Option<&[String]>,
        _submit: bool,
    ) -> Result<SendOutcome, PaneRefusal> {
        let mut log = self.0.borrow_mut();
        if let Some(text) = text {
            log.typed.push(text.to_string());
            log.screen = format!("working\n{text}");
        }
        if let Some(keys) = keys {
            log.keys.push(keys.to_vec());
        }
        log.working = true;
        Ok(SendOutcome::Sent)
    }

    fn read(&self, _key: &str, _source: Option<&str>) -> Result<String, PaneRefusal> {
        Ok(self.0.borrow().screen.clone())
    }

    fn inspect(&self, key: &str, _want: Want) -> Inspection {
        let log = self.0.borrow();
        if !log.live.contains(key) {
            return Inspection {
                pane: PaneState::Gone,
                foreground: None,
                activity: None,
            };
        }
        let (state, idle) = if log.working || log.never_ready {
            ("working", false)
        } else {
            ("idle", true)
        };
        Inspection {
            pane: PaneState::Live,
            foreground: None,
            activity: Some(Activity {
                state: state.into(),
                agent: None,
                session: None,
                detail: Some(ActivityDetail {
                    state: Some(state.into()),
                    visible_blocker: false,
                    visible_idle: idle,
                    visible_working: !idle,
                    matched_rule: Some("rule".into()),
                    prompt_text: String::new(),
                }),
            }),
        }
    }

    fn focus(&self, key: &str) -> Result<(), PaneRefusal> {
        self.0.borrow_mut().focused.push(key.into());
        Ok(())
    }

    fn release(&self, key: &str, disposition: Disposition) -> Result<ReleaseOutcome, PaneRefusal> {
        let mut log = self.0.borrow_mut();
        log.released.push((key.into(), disposition));
        log.live.remove(key);
        Ok(ReleaseOutcome::Released { disposition })
    }
}

#[derive(Default)]
struct DirectLog {
    spawned: Vec<StartRequest>,
    live: bool,
    ignores_term: bool,
    calls: Vec<&'static str>,
}

#[derive(Default)]
struct FakeDirect(RefCell<DirectLog>);

impl Screenless for FakeDirect {
    fn spawn(&self, request: &StartRequest) -> Result<(), String> {
        let mut log = self.0.borrow_mut();
        log.spawned.push(request.clone());
        log.live = true;
        Ok(())
    }

    fn liveness(&self, _key: &str) -> Liveness {
        if self.0.borrow().live {
            Liveness::Live
        } else {
            Liveness::Gone
        }
    }

    fn end(&self, _key: &str, _grace_ms: u64) -> Result<Liveness, String> {
        let mut log = self.0.borrow_mut();
        log.calls.push("term");
        if log.ignores_term {
            log.calls.push("kill");
        }
        log.live = false;
        Ok(Liveness::Gone)
    }

    fn forget(&self, _key: &str) {
        self.0.borrow_mut().calls.push("forget");
    }

    fn opening_file(&self, key: &str, _text: &str) -> Result<PathBuf, String> {
        Ok(PathBuf::from(format!("/tmp/{key}.opening.txt")))
    }
}

fn request(host: HostKind, key: &str, command: &str) -> StartRequest {
    StartRequest {
        host,
        key: key.into(),
        group_key: None,
        beside: None,
        cwd: "/work".into(),
        env: Default::default(),
        command: command.into(),
        args: vec!["--flag".into()],
        opening: None,
        display: None,
        role: Role::Worker,
    }
}

fn host<'a>(panes: &'a FakePanes, direct: &'a FakeDirect) -> SessionHost<'a> {
    SessionHost {
        panes,
        direct,
        ready_ms: 2_000,
        grace_ms: 150,
    }
}

fn placement(kind: HostKind, key: &str) -> Placement {
    Placement {
        host: kind,
        key: key.into(),
        display: None,
    }
}

fn refusal_of(answer: StartAnswer) -> Refusal {
    match answer {
        StartAnswer::Refused(r) => r,
        other => panic!("expected a refusal, got {other:?}"),
    }
}

#[test]
fn a_worker_start_allocates_and_launches_and_types_nothing() {
    let (panes, direct) = (FakePanes::default(), FakeDirect::default());
    let mut r = request(HostKind::Terminal, "att-1", "fgos-gate");
    r.group_key = Some("run-1".into());
    let answer = host(&panes, &direct).start(&r, None);
    assert_eq!(
        answer,
        StartAnswer::Placed(placement(HostKind::Terminal, "att-1"))
    );
    let log = panes.0.borrow();
    assert_eq!(log.allocated[0].group_key, "run-1");
    assert_eq!(log.launched[0].1.command, "fgos-gate");
    assert_eq!(log.launched[0].1.args, vec!["--flag".to_string()]);
    assert!(
        log.typed.is_empty() && log.keys.is_empty(),
        "a worker's brief is the supervisor's"
    );
}

#[test]
fn a_start_beside_a_placement_opens_in_that_placements_group() {
    let (panes, direct) = (FakePanes::default(), FakeDirect::default());
    panes.0.borrow_mut().live.insert("first".into());
    let mut r = request(HostKind::Terminal, "second", "fgos-gate");
    r.group_key = Some("run-1".into());
    r.beside = Some("first".into());
    assert!(matches!(
        host(&panes, &direct).start(&r, None),
        StartAnswer::Placed(_)
    ));
    assert_eq!(panes.0.borrow().allocated[0].group_key, "run-1");

    // beside a placement that is not there, or without the group it belongs to, is refused before a pane opens.
    let mut missing = r.clone();
    missing.key = "third".into();
    missing.beside = Some("nowhere".into());
    assert_eq!(
        refusal_of(host(&panes, &direct).start(&missing, None)).code,
        RefusalCode::PlacementUnknown
    );
    let mut ungrouped = r.clone();
    ungrouped.key = "fourth".into();
    ungrouped.group_key = None;
    assert_eq!(
        refusal_of(host(&panes, &direct).start(&ungrouped, None)).code,
        RefusalCode::PlacementUnknown
    );
    assert_eq!(panes.0.borrow().allocated.len(), 1);
}

#[test]
fn a_key_with_a_live_placement_answers_it_and_starts_nothing_more() {
    let (panes, direct) = (FakePanes::default(), FakeDirect::default());
    let r = request(HostKind::Terminal, "att-1", "fgos-gate");
    let h = host(&panes, &direct);
    h.start(&r, None);
    assert_eq!(
        h.start(&r, None),
        StartAnswer::Placed(placement(HostKind::Terminal, "att-1"))
    );
    assert_eq!(panes.0.borrow().allocated.len(), 1);
    assert_eq!(panes.0.borrow().launched.len(), 1);

    let d = request(HostKind::Direct, "att-2", "gate");
    h.start(&d, None);
    h.start(&d, None);
    assert_eq!(direct.0.borrow().spawned.len(), 1);
}

#[test]
fn a_head_opening_is_typed_as_the_full_text_through_the_agent_protocol() {
    let (panes, direct) = (FakePanes::default(), FakeDirect::default());
    let mut r = request(HostKind::Terminal, "secretary-miu", "claude");
    r.role = Role::Head;
    let text = "You are Miu.\nRead the handoff at /tmp/h.md, then wait.";
    r.opening = Some(Opening {
        text: text.into(),
        delivery: Delivery::Typed,
    });
    let answer = host(&panes, &direct).start(&r, None);
    assert_eq!(
        answer,
        StartAnswer::Placed(placement(HostKind::Terminal, "secretary-miu"))
    );
    let log = panes.0.borrow();
    assert!(
        log.typed
            .iter()
            .any(|t| t.contains("You are Miu.") && t.contains("then wait.")),
        "the whole text is typed, not a pointer: {:?}",
        log.typed
    );
}

#[test]
fn an_opening_for_a_cli_with_no_terminal_adapter_is_refused_before_a_pane_opens() {
    let (panes, direct) = (FakePanes::default(), FakeDirect::default());
    let mut r = request(HostKind::Terminal, "head-1", "unknown-cli");
    r.opening = Some(Opening {
        text: "hi".into(),
        delivery: Delivery::Typed,
    });
    let refusal = refusal_of(host(&panes, &direct).start(&r, None));
    assert_eq!(refusal.code, RefusalCode::OpeningDeliveryUnsupported);
    assert!(panes.0.borrow().allocated.is_empty());
    // The caller's CLI id selects the adapter when the command's own name does not.
    assert!(matches!(
        host(&panes, &direct).start(&r, Some("claude")),
        StartAnswer::Placed(_)
    ));
}

#[test]
fn an_agent_that_never_takes_input_is_refused_and_its_pane_closed() {
    let (panes, direct) = (FakePanes::default(), FakeDirect::default());
    panes.0.borrow_mut().never_ready = true;
    let mut r = request(HostKind::Terminal, "head-1", "claude");
    r.opening = Some(Opening {
        text: "hi".into(),
        delivery: Delivery::Typed,
    });
    let mut h = host(&panes, &direct);
    h.ready_ms = 300;
    let refusal = refusal_of(h.start(&r, None));
    assert_eq!(refusal.code, RefusalCode::PaneNotReady);
    let log = panes.0.borrow();
    assert!(log.typed.is_empty());
    assert_eq!(
        log.released,
        vec![("head-1".to_string(), Disposition::Close)]
    );
}

#[test]
fn a_head_session_on_the_direct_host_is_refused_and_nothing_starts() {
    let (panes, direct) = (FakePanes::default(), FakeDirect::default());
    let mut r = request(HostKind::Direct, "head-1", "claude");
    r.role = Role::Head;
    let refusal = refusal_of(host(&panes, &direct).start(&r, None));
    assert_eq!(
        (refusal.result, refusal.code),
        (
            RefusalKind::Unsupported,
            RefusalCode::HeadNeedsInteractiveHost
        )
    );
    assert!(direct.0.borrow().spawned.is_empty());
}

#[test]
fn the_direct_host_takes_an_opening_by_argument_or_file_and_refuses_typing() {
    let (panes, direct) = (FakePanes::default(), FakeDirect::default());
    let h = host(&panes, &direct);
    let mut r = request(HostKind::Direct, "w-1", "gate");
    r.opening = Some(Opening {
        text: "do the thing".into(),
        delivery: Delivery::Typed,
    });
    assert_eq!(
        refusal_of(h.start(&r, None)).code,
        RefusalCode::OpeningDeliveryUnsupported
    );
    assert!(direct.0.borrow().spawned.is_empty());

    r.opening = Some(Opening {
        text: "do the thing".into(),
        delivery: Delivery::Argument,
    });
    h.start(&r, None);
    assert_eq!(
        direct.0.borrow().spawned[0].args.last().unwrap(),
        "do the thing"
    );

    let by_file = FakeDirect::default();
    let mut f = request(HostKind::Direct, "w-2", "gate");
    f.opening = Some(Opening {
        text: "do the thing".into(),
        delivery: Delivery::File,
    });
    host(&panes, &by_file).start(&f, None);
    assert_eq!(
        by_file.0.borrow().spawned[0].args.last().unwrap(),
        "/tmp/w-2.opening.txt"
    );
}

#[test]
fn alive_front_and_retire_answer_for_a_terminal_placement() {
    let (panes, direct) = (FakePanes::default(), FakeDirect::default());
    let h = host(&panes, &direct);
    let p = placement(HostKind::Terminal, "att-1");
    assert_eq!(h.alive(&p).result, Liveness::Gone);
    h.start(&request(HostKind::Terminal, "att-1", "fgos-gate"), None);
    assert_eq!(h.alive(&p).result, Liveness::Live);
    assert_eq!(h.front(&p), FrontAnswer::Fronted);
    assert_eq!(panes.0.borrow().focused, vec!["att-1".to_string()]);
    assert_eq!(h.retire(&p, Retirement::Retain), RetireAnswer::Retired);
    assert_eq!(panes.0.borrow().released[0].1, Disposition::Retain);
    assert_eq!(h.alive(&p).result, Liveness::Gone);
}

#[test]
fn a_screenless_placement_cannot_be_fronted() {
    let (panes, direct) = (FakePanes::default(), FakeDirect::default());
    let refused = host(&panes, &direct).front(&placement(HostKind::Direct, "w-1"));
    match refused {
        FrontAnswer::Refused(r) => assert_eq!(r.result, RefusalKind::Unsupported),
        other => panic!("{other:?}"),
    }
}

#[test]
fn retiring_a_direct_session_asks_first_and_kills_only_after_the_grace() {
    let (panes, direct) = (FakePanes::default(), FakeDirect::default());
    let h = host(&panes, &direct);
    let p = placement(HostKind::Direct, "w-1");
    h.start(&request(HostKind::Direct, "w-1", "gate"), None);
    assert_eq!(h.retire(&p, Retirement::Close), RetireAnswer::Retired);
    assert_eq!(direct.0.borrow().calls, vec!["term", "forget"]);

    let stubborn = FakeDirect::default();
    let h = host(&panes, &stubborn);
    h.start(&request(HostKind::Direct, "w-2", "gate"), None);
    stubborn.0.borrow_mut().ignores_term = true;
    assert_eq!(
        h.retire(&placement(HostKind::Direct, "w-2"), Retirement::Close),
        RetireAnswer::Retired
    );
    assert_eq!(stubborn.0.borrow().calls, vec!["term", "kill", "forget"]);
}

#[test]
fn retiring_a_direct_session_that_is_already_gone_answers_retired() {
    let (panes, direct) = (FakePanes::default(), FakeDirect::default());
    let h = host(&panes, &direct);
    assert_eq!(
        h.retire(&placement(HostKind::Direct, "w-9"), Retirement::Close),
        RetireAnswer::Retired
    );
    assert!(!direct.0.borrow().calls.contains(&"term"));
}

#[test]
fn a_key_that_is_not_a_contract_key_is_refused() {
    let (panes, direct) = (FakePanes::default(), FakeDirect::default());
    let r = request(HostKind::Terminal, "../escape", "gate");
    assert_eq!(
        refusal_of(host(&panes, &direct).start(&r, None)).code,
        RefusalCode::PlacementUnknown
    );
    assert!(panes.0.borrow().allocated.is_empty());
}

fn open_request(key: &str) -> OpenRequest {
    OpenRequest {
        host: HostKind::Terminal,
        key: key.into(),
        group_key: Some("run-1".into()),
        beside: None,
        group_size: Some(3),
        cwd: "/work".into(),
        env: Default::default(),
        display: None,
    }
}

#[test]
fn open_allocates_a_slot_and_launch_starts_the_command_in_it_returning_the_identity() {
    let (panes, direct) = (FakePanes::default(), FakeDirect::default());
    let h = host(&panes, &direct);
    match h.open(&open_request("att-1")) {
        OpenAnswer::Opened { placement: p, slot } => {
            assert_eq!(p, placement(HostKind::Terminal, "att-1"));
            assert_eq!(slot.map(|s| s.pane_id), Some("p1".to_string()));
        }
        other => panic!("expected a slot, got {other:?}"),
    }
    {
        let log = panes.0.borrow();
        assert_eq!(log.allocated[0].group_key, "run-1");
        assert_eq!(log.allocated[0].group_size, Some(3));
        assert!(log.launched.is_empty(), "open starts nothing");
    }
    let spec = LaunchSpec {
        command: "launcher.sh".into(),
        args: vec![],
        cwd: "/work".into(),
        env: Default::default(),
        expect: None,
    };
    match h.launch(&placement(HostKind::Terminal, "att-1"), &spec) {
        LaunchAnswer::Launched(identity) => assert_eq!(identity.pid, 1),
        other => panic!("expected a launch, got {other:?}"),
    }
    assert_eq!(panes.0.borrow().launched[0].1.command, "launcher.sh");
    // A second open of the key answers the live placement, with no new slot, and allocates nothing more.
    assert!(matches!(
        h.open(&open_request("att-1")),
        OpenAnswer::Opened { slot: None, .. }
    ));
    assert_eq!(panes.0.borrow().allocated.len(), 1);
}

#[test]
fn open_and_launch_refuse_a_screenless_placement_and_a_bad_key() {
    let (panes, direct) = (FakePanes::default(), FakeDirect::default());
    let h = host(&panes, &direct);
    let mut direct_open = open_request("att-1");
    direct_open.host = HostKind::Direct;
    let refused = |answer: OpenAnswer| match answer {
        OpenAnswer::Refused(r) => r.code,
        other => panic!("expected a refusal, got {other:?}"),
    };
    assert_eq!(
        refused(h.open(&direct_open)),
        RefusalCode::HostUnsupportedHere
    );
    assert_eq!(
        refused(h.open(&open_request("bad key"))),
        RefusalCode::PlacementUnknown
    );
    let spec = LaunchSpec {
        command: "x".into(),
        args: vec![],
        cwd: "/work".into(),
        env: Default::default(),
        expect: None,
    };
    for placed in [
        placement(HostKind::Direct, "att-1"),
        placement(HostKind::Terminal, "bad key"),
    ] {
        assert!(matches!(h.launch(&placed, &spec), LaunchAnswer::Refused(_)));
    }
    assert!(panes.0.borrow().allocated.is_empty() && panes.0.borrow().launched.is_empty());
}
