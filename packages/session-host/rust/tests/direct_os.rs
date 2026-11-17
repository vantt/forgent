//! The real process door: a prepared command is started without a screen, judged by identity,
//! asked to leave with SIGTERM, and forgotten.
#![cfg(unix)]

use fgos_session_host::direct::{OsDirect, Screenless};
use fgos_session_host::panes::Panes;
use fgos_session_host::{
    HostKind, Liveness, Placement, RetireAnswer, Retirement, Role, SessionHost, StartRequest,
};

struct NoPanes;
impl Panes for NoPanes {
    fn allocate(
        &self,
        _: &fgos_terminal_control::port::AllocateRequest,
    ) -> Result<fgos_terminal_control::port::Allocation, fgos_terminal_control::port::Refusal> {
        unreachable!()
    }
    fn launch(
        &self,
        _: &str,
        _: &fgos_terminal_control::port::LaunchSpec,
    ) -> Result<fgos_terminal_control::port::LaunchOutcome, fgos_terminal_control::port::Refusal>
    {
        unreachable!()
    }
    fn send(
        &self,
        _: &str,
        _: Option<&str>,
        _: Option<&[String]>,
        _: bool,
    ) -> Result<fgos_terminal_control::port::SendOutcome, fgos_terminal_control::port::Refusal>
    {
        unreachable!()
    }
    fn read(
        &self,
        _: &str,
        _: Option<&str>,
    ) -> Result<String, fgos_terminal_control::port::Refusal> {
        unreachable!()
    }
    fn inspect(
        &self,
        _: &str,
        _: fgos_terminal_control::core::Want,
    ) -> fgos_terminal_control::port::Inspection {
        unreachable!()
    }
    fn focus(&self, _: &str) -> Result<(), fgos_terminal_control::port::Refusal> {
        unreachable!()
    }
    fn release(
        &self,
        _: &str,
        _: fgos_terminal_control::port::Disposition,
    ) -> Result<fgos_terminal_control::port::ReleaseOutcome, fgos_terminal_control::port::Refusal>
    {
        unreachable!()
    }
}

#[test]
fn a_started_process_is_live_then_retired_by_sigterm() {
    let dir = std::env::temp_dir().join(format!("fgos-session-host-direct-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&dir);
    let door = OsDirect::new(&dir);
    let request = StartRequest {
        host: HostKind::Direct,
        key: "w-1".into(),
        group_key: None,
        beside: None,
        cwd: std::env::temp_dir().to_string_lossy().into_owned(),
        env: Default::default(),
        command: "sleep".into(),
        args: vec!["60".into()],
        opening: None,
        display: None,
        role: Role::Worker,
    };
    assert_eq!(
        door.liveness("w-1"),
        Liveness::Gone,
        "a key never started is gone"
    );
    let host = SessionHost {
        panes: &NoPanes,
        direct: &door,
        ready_ms: 1_000,
        grace_ms: 5_000,
    };
    host.start(&request, None);
    assert_eq!(door.liveness("w-1"), Liveness::Live);
    let p = Placement {
        host: HostKind::Direct,
        key: "w-1".into(),
        display: None,
    };
    assert_eq!(host.alive(&p).result, Liveness::Live);
    assert_eq!(host.retire(&p, Retirement::Close), RetireAnswer::Retired);
    assert_eq!(door.liveness("w-1"), Liveness::Gone);
    let _ = std::fs::remove_dir_all(&dir);
}
