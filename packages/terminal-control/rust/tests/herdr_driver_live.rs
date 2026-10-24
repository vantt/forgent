//! Against the real herdr on this machine; run by hand:
//! `cargo test -p fgos-terminal-control --test herdr_driver_live -- --ignored`.
//! Opens one tab of its own, splits it, measures it, and closes every pane it
//! opened (the tab disappears with its last pane).

use fgos_terminal_control::driver::herdr::{HerdrConfig, HerdrDriver};
use fgos_terminal_control::driver::{CloseOutcome, Direction, PaneLiveness, TerminalDriver};

#[test]
#[ignore = "needs a running herdr"]
fn herdr_live() {
    let bin = std::env::var("FGOS_HERDR_BIN").unwrap_or_else(|_| "herdr".into());
    let driver = HerdrDriver::new(HerdrConfig::new(bin));
    let caps = driver.capabilities();
    assert!(caps.contains(&"layout.geometry") && caps.contains(&"server.incarnation"), "{caps:?}");

    let incarnation = driver.server_incarnation().expect("server incarnation");
    let tab = driver.tab_create("tc-live-driver", None, &[]).expect("tab create");
    let second = driver.pane_split(&tab.pane_id, Direction::Right, 0.5, None, &[]).expect("split");
    assert_eq!(second.tab_id, tab.tab_id);

    let geometry = driver.layout_geometry(&second.pane_id).expect("geometry");
    assert_eq!(geometry.tab_id, tab.tab_id);
    assert_eq!(geometry.panes.len(), 2);
    assert!(geometry.panes.iter().all(|p| p.rect.width > 0 && p.rect.height > 0));
    let pty_known = geometry.panes.iter().filter(|p| driver.pane_pty(&p.pane_id).is_some()).count();
    println!("area {:?}, {pty_known} of 2 panes reported a pty size", geometry.area);

    let info = driver.process_info(&second.pane_id).expect("process info");
    assert!(!info.foreground.is_empty());
    assert_eq!(driver.pane_liveness(&second.pane_id).unwrap(), PaneLiveness::Live);

    // Close what this test opened, last pane first.
    for pane in [&second.pane_id, &tab.pane_id] {
        assert_eq!(driver.pane_close(pane, &incarnation).expect("close"), CloseOutcome::Closed);
    }
    assert_eq!(driver.pane_liveness(&second.pane_id).unwrap(), PaneLiveness::Gone);
}
