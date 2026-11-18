//! The Session Host's owning proofs, over a fake Terminal Control core and a fake process door.

use fgos_session_host::*;
use fgos_terminal_control::core::Want;
use fgos_terminal_control::port::{
    AllocateRequest, Allocation, Disposition, Inspection, LaunchOutcome, LaunchSpec, Origin,
    PaneState, ProcessIdentity, Refusal as PaneRefusal, ReleaseOutcome, SendOutcome, Slot,
};
use std::cell::RefCell;
use std::collections::BTreeSet;

#[derive(Default)]
struct PaneLog {
    live: BTreeSet<String>,
    allocated: Vec<AllocateRequest>,
    launched: Vec<(String, LaunchSpec)>,
    released: Vec<(String, Disposition)>,
    focused: Vec<String>,
}

#[derive(Default)]
struct FakePanes(RefCell<PaneLog>);

impl Panes for FakePanes {
    fn allocate(&self, request: &AllocateRequest) -> Result<Allocation, PaneRefusal> {
        let mut log = self.0.borrow_mut();
        // Like the core: asking again for a live key returns its slot and allocates nothing.
        if !log.live.insert(request.key.clone()) {
            return Ok(Allocation {
                slot: Slot {
                    tab_id: "t1".into(),
                    pane_id: "p1".into(),
                },
                origin: Origin::Allocated,
            });
        }
        log.allocated.push(request.clone());
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
        _text: Option<&str>,
        _keys: Option<&[String]>,
        _submit: bool,
    ) -> Result<SendOutcome, PaneRefusal> {
        Ok(SendOutcome::Sent)
    }

    fn read(&self, _key: &str, _source: Option<&str>) -> Result<String, PaneRefusal> {
        Ok(String::new())
    }

    fn inspect(&self, key: &str, _want: Want) -> Inspection {
        let pane = if self.0.borrow().live.contains(key) {
            PaneState::Live
        } else {
            PaneState::Gone
        };
        Inspection {
            pane,
            foreground: None,
            activity: None,
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

fn host(panes: &FakePanes) -> SessionHost<'_> {
    SessionHost { panes }
}

fn placement(kind: HostKind, key: &str) -> Placement {
    Placement {
        host: kind,
        key: key.into(),
        display: None,
    }
}

#[test]
fn an_open_beside_a_placement_allocates_in_that_placements_group() {
    let panes = FakePanes::default();
    panes.0.borrow_mut().live.insert("first".into());
    let mut r = open_request("second");
    r.beside = Some("first".into());
    assert!(matches!(host(&panes).open(&r), OpenAnswer::Opened { .. }));
    assert_eq!(panes.0.borrow().allocated[0].group_key, "run-1");

    // beside a placement that is not there, or without the group it belongs to, is refused before a pane opens.
    let refused = |answer: OpenAnswer| match answer {
        OpenAnswer::Refused(r) => r.code,
        other => panic!("expected a refusal, got {other:?}"),
    };
    let mut missing = r.clone();
    missing.key = "third".into();
    missing.beside = Some("nowhere".into());
    assert_eq!(
        refused(host(&panes).open(&missing)),
        RefusalCode::PlacementUnknown
    );
    let mut ungrouped = r.clone();
    ungrouped.key = "fourth".into();
    ungrouped.group_key = None;
    assert_eq!(
        refused(host(&panes).open(&ungrouped)),
        RefusalCode::PlacementUnknown
    );
    assert_eq!(panes.0.borrow().allocated.len(), 1);
}

#[test]
fn alive_front_and_retire_answer_for_a_terminal_placement() {
    let panes = FakePanes::default();
    let h = host(&panes);
    let p = placement(HostKind::Terminal, "att-1");
    assert_eq!(h.alive(&p).result, Liveness::Gone);
    h.open(&open_request("att-1"));
    assert_eq!(h.alive(&p).result, Liveness::Live);
    assert_eq!(h.front(&p), FrontAnswer::Fronted);
    assert_eq!(panes.0.borrow().focused, vec!["att-1".to_string()]);
    assert_eq!(h.retire(&p, Retirement::Retain), RetireAnswer::Retired);
    assert_eq!(panes.0.borrow().released[0].1, Disposition::Retain);
    assert_eq!(h.alive(&p).result, Liveness::Gone);
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
    let panes = FakePanes::default();
    let h = host(&panes);
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
    // A second open of the key answers the live placement with the slot it already holds, and allocates
    // nothing more.
    match h.open(&open_request("att-1")) {
        OpenAnswer::Opened {
            slot: Some(slot), ..
        } => assert_eq!(slot.pane_id, "p1"),
        other => panic!("expected the live slot, got {other:?}"),
    }
    assert_eq!(panes.0.borrow().allocated.len(), 1);
}

#[test]
fn open_and_launch_refuse_a_bad_key() {
    let panes = FakePanes::default();
    let h = host(&panes);
    match h.open(&open_request("bad key")) {
        OpenAnswer::Refused(r) => assert_eq!(r.code, RefusalCode::PlacementUnknown),
        other => panic!("expected a refusal, got {other:?}"),
    }
    let spec = LaunchSpec {
        command: "x".into(),
        args: vec![],
        cwd: "/work".into(),
        env: Default::default(),
        expect: None,
    };
    assert!(matches!(
        h.launch(&placement(HostKind::Terminal, "bad key"), &spec),
        LaunchAnswer::Refused(_)
    ));
    assert!(panes.0.borrow().allocated.is_empty() && panes.0.borrow().launched.is_empty());
}
