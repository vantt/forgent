//! The real process door: a process whose handle is on disk is judged by identity, asked to leave with SIGTERM, and
//! forgotten. The test writes the handle itself: nothing starts a screenless process through the port any more.
#![cfg(unix)]

use fgos_session_host::direct::{OsDirect, Screenless};
use fgos_session_host::panes::Panes;
use fgos_session_host::{HostKind, Liveness, Placement, RetireAnswer, Retirement, SessionHost};

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
fn a_process_with_a_handle_is_live_then_retired_by_sigterm() {
    let dir = std::env::temp_dir().join(format!("fgos-session-host-direct-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).unwrap();
    let door = OsDirect::new(&dir);
    assert_eq!(
        door.liveness("w-1"),
        Liveness::Gone,
        "a key with no handle is gone"
    );
    let mut child = std::process::Command::new("sleep")
        .arg("60")
        .spawn()
        .unwrap();
    let tuple = fgos_process::facts::identity_of_child(fgos_process::ProcId(child.id())).unwrap();
    let handle = serde_json::json!({ "key": "w-1", "process": tuple.to_record().to_json() });
    std::fs::write(dir.join("w-1.json"), handle.to_string()).unwrap();
    let host = SessionHost {
        panes: &NoPanes,
        direct: &door,
        grace_ms: 5_000,
    };
    let p = Placement {
        host: HostKind::Direct,
        key: "w-1".into(),
        display: None,
    };
    assert_eq!(host.alive(&p).result, Liveness::Live);
    assert_eq!(host.retire(&p, Retirement::Close), RetireAnswer::Retired);
    assert_eq!(door.liveness("w-1"), Liveness::Gone);
    let _ = child.wait();
    let _ = std::fs::remove_dir_all(&dir);
}
