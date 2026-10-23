//! An in-memory multiplexer for core tests: tabs, panes with rects, a call
//! log, and knobs to kill panes, restart the server and set foregrounds.
#![allow(dead_code)]

use fgos_terminal_control::core::{Core, CoreConfig};
use fgos_terminal_control::driver::*;
use fgos_terminal_control::policy::{measured_split::MeasuredSplit, Limits};
use fgos_terminal_control::port::*;
use std::cell::{Cell, RefCell};
use std::collections::BTreeMap;
use std::path::PathBuf;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ShellScript {
    Ready,
    PromptReadsFirstKey,
    LineModeRead,
    EchoOnly,
}

pub struct MemPane {
    pub tab: String,
    pub rect: Rect,
    pub info: ProcessInfo,
    pub script: ShellScript,
    pub screen: String,
    pub probe_count: usize,
    pub screen_reads: usize,
    pub last_nonce: String,
    pub on_launch_foreground: Option<ProcessInfo>,
    pub env: Vec<(String, String)>,
}

impl MemPane {
    pub fn new(pane_id: &str, tab: String, rect: Rect, info: ProcessInfo, env: Vec<(String, String)>) -> Self {
        MemPane {
            tab,
            rect,
            info,
            script: ShellScript::Ready,
            screen: format!("screen of {pane_id}"),
            probe_count: 0,
            screen_reads: 0,
            last_nonce: String::new(),
            on_launch_foreground: None,
            env,
        }
    }

    pub fn handle_pane_run(&mut self, command_line: &str) {
        if let Some(rest) = command_line.strip_prefix("printf '%s%s\\n' fgos-ok- ") {
            let nonce = rest.trim();
            self.probe_count += 1;
            self.last_nonce = nonce.to_string();
            match self.script {
                ShellScript::Ready => {
                    self.screen.push_str(&format!("\nfgos-ok-{nonce}\n"));
                }
                ShellScript::PromptReadsFirstKey => {
                    // The start prompt takes the first typed line; the later ones reach the shell.
                    if self.probe_count > 1 {
                        self.screen.push_str(&format!("\nfgos-ok-{nonce}\n"));
                    }
                }
                ShellScript::LineModeRead => {
                    self.screen.push_str(&format!("\nread: consumed line (nonce {nonce})\n"));
                }
                ShellScript::EchoOnly => {
                    self.screen.push_str(&format!("\nprintf '%s%s\\n' fgos-ok- {nonce}\n"));
                }
            }
        } else {
            if let Some(on_launch) = &self.on_launch_foreground {
                self.info = on_launch.clone();
            }
        }
    }
}

pub struct MemDriver {
    caps: Vec<&'static str>,
    pub area: Rect,
    pub panes: RefCell<BTreeMap<String, MemPane>>,
    pub tabs: RefCell<Vec<(String, String)>>,
    pub log: RefCell<Vec<String>>,
    pub incarnation_pid: Cell<u32>,
    /// A pane that vanishes at the moment something first asks for its geometry (another process closed it).
    pub vanish_on_layout: RefCell<Option<String>>,
    pub vanish_on_process_info: RefCell<Option<String>>,
    next: Cell<u32>,
}

pub fn all_caps() -> Vec<&'static str> {
    CAPABILITIES.to_vec()
}

impl MemDriver {
    pub fn new(cols: u32, rows: u32) -> Self {
        Self::with_caps(cols, rows, all_caps())
    }

    pub fn with_caps(cols: u32, rows: u32, caps: Vec<&'static str>) -> Self {
        MemDriver {
            caps,
            area: Rect { x: 0, y: 0, width: cols, height: rows },
            panes: RefCell::new(BTreeMap::new()),
            tabs: RefCell::new(Vec::new()),
            log: RefCell::new(Vec::new()),
            incarnation_pid: Cell::new(4242),
            vanish_on_layout: RefCell::new(None),
            vanish_on_process_info: RefCell::new(None),
            next: Cell::new(1),
        }
    }

    fn id(&self, prefix: &str) -> String {
        let n = self.next.get();
        self.next.set(n + 1);
        format!("{prefix}{n}")
    }

    pub fn calls(&self, prefix: &str) -> Vec<String> {
        self.log.borrow().iter().filter(|l| l.starts_with(prefix)).cloned().collect()
    }

    /// The pane vanishes (the user closed it).
    pub fn kill_pane(&self, pane: &str) {
        self.panes.borrow_mut().remove(pane);
    }

    pub fn pane_count(&self) -> usize {
        self.panes.borrow().len()
    }

    pub fn tab_count(&self) -> usize {
        self.tabs.borrow().len()
    }

    pub fn restart_server(&self) {
        self.incarnation_pid.set(self.incarnation_pid.get() + 1);
    }

    pub fn set_foreground(&self, pane: &str, shell_pid: u32, foreground: Vec<ForegroundProcess>, pgid: u32) {
        self.panes.borrow_mut().get_mut(pane).unwrap().info =
            ProcessInfo { shell_pid, foreground_pgid: pgid, foreground };
    }
    pub fn set_script(&self, pane: &str, script: ShellScript) {
        let mut panes = self.panes.borrow_mut();
        if let Some(p) = panes.get_mut(pane) {
            p.script = script;
        }
    }

    pub fn set_screen(&self, pane: &str, screen: impl Into<String>) {
        let mut panes = self.panes.borrow_mut();
        if let Some(p) = panes.get_mut(pane) {
            p.screen = screen.into();
        }
    }

    pub fn set_launch_foreground(&self, pane: &str, shell_pid: u32, foreground: Vec<ForegroundProcess>, pgid: u32) {
        let mut panes = self.panes.borrow_mut();
        if let Some(p) = panes.get_mut(pane) {
            p.on_launch_foreground = Some(ProcessInfo {
                shell_pid,
                foreground_pgid: pgid,
                foreground,
            });
        }
    }

    pub fn tab_of(&self, pane: &str) -> String {
        self.panes.borrow()[pane].tab.clone()
    }
    pub fn env_of(&self, pane: &str) -> Option<Vec<(String, String)>> {
        self.panes.borrow().get(pane).map(|p| p.env.clone())
    }

    fn current(&self) -> ServerIncarnation {
        ServerIncarnation {
            host: "test-host".into(),
            boot_id: "boot-1".into(),
            pid_ns: "pid:[1]".into(),
            pid: self.incarnation_pid.get(),
            start_time: "100".into(),
            endpoint: "/tmp/mem.sock".into(),
        }
    }
}

pub fn bare(shell: u32) -> ProcessInfo {
    ProcessInfo {
        shell_pid: shell,
        foreground_pgid: shell,
        foreground: vec![ForegroundProcess { pid: shell, argv: vec!["bash".into()] }],
    }
}

fn unknown(reason: &str) -> Refusal {
    Refusal::Unknown { reason: reason.into() }
}

impl TerminalDriver for MemDriver {
    fn name(&self) -> &'static str {
        "mem"
    }
    fn capabilities(&self) -> Vec<&'static str> {
        self.caps.clone()
    }
    fn server_incarnation(&self) -> DriverResult<ServerIncarnation> {
        Ok(self.current())
    }
    fn tab_create(&self, label: &str, cwd: Option<&str>, env: &[(String, String)]) -> DriverResult<CreatedPane> {
        let tab = self.id("t");
        let pane = self.id("p");
        self.log.borrow_mut().push(format!("tab.create {label} cwd={} env={} -> {tab}/{pane}", cwd.unwrap_or("-"), env.len()));
        self.tabs.borrow_mut().push((tab.clone(), label.to_string()));
        self.panes.borrow_mut().insert(pane.clone(), MemPane::new(&pane, tab.clone(), self.area, bare(900), env.to_vec()));
        Ok(CreatedPane { tab_id: tab, pane_id: pane })
    }
    fn pane_split(&self, anchor: &str, direction: Direction, ratio: f64, cwd: Option<&str>, env: &[(String, String)]) -> DriverResult<CreatedPane> {
        let mut panes = self.panes.borrow_mut();
        let Some(a) = panes.get_mut(anchor) else { return Err(unknown("pane_not_found")) };
        let (kept, new_rect) = match direction {
            Direction::Right => {
                let kept = (f64::from(a.rect.width) * ratio).round() as u32;
                (Rect { width: kept, ..a.rect }, Rect { x: a.rect.x + kept, width: a.rect.width - kept, ..a.rect })
            }
            Direction::Down => {
                let kept = (f64::from(a.rect.height) * ratio).round() as u32;
                (Rect { height: kept, ..a.rect }, Rect { y: a.rect.y + kept, height: a.rect.height - kept, ..a.rect })
            }
        };
        a.rect = kept;
        let tab = a.tab.clone();
        drop(panes);
        let pane = self.id("p");
        self.log.borrow_mut().push(format!(
            "pane.split {anchor} {direction:?} {ratio} cwd={} env={} -> {pane}",
            cwd.unwrap_or("-"),
            env.len()
        ));
        self.panes.borrow_mut().insert(pane.clone(), MemPane::new(&pane, tab.clone(), new_rect, bare(901), env.to_vec()));
        Ok(CreatedPane { tab_id: tab, pane_id: pane })
    }
    fn pane_close(&self, pane: &str, expected: &ServerIncarnation) -> DriverResult<CloseOutcome> {
        if *expected != self.current() {
            self.log.borrow_mut().push(format!("pane.close-refused {pane}"));
            return Err(unknown("server incarnation changed"));
        }
        self.log.borrow_mut().push(format!("pane.close {pane}"));
        let removed = self.panes.borrow_mut().remove(pane);
        let Some(removed) = removed else { return Ok(CloseOutcome::AlreadyGone) };
        // A lone remaining pane takes the whole tab back, as a multiplexer does.
        let mut panes = self.panes.borrow_mut();
        let rest: Vec<String> = panes.iter().filter(|(_, p)| p.tab == removed.tab).map(|(id, _)| id.clone()).collect();
        if let [only] = rest.as_slice() {
            panes.get_mut(only).unwrap().rect = self.area;
        }
        Ok(CloseOutcome::Closed)
    }
    fn pane_liveness(&self, pane: &str) -> DriverResult<PaneLiveness> {
        Ok(if self.panes.borrow().contains_key(pane) { PaneLiveness::Live } else { PaneLiveness::Gone })
    }
    fn pane_run(&self, pane: &str, command_line: &str) -> DriverResult<()> {
        self.log.borrow_mut().push(format!("pane.run {pane} {command_line}"));
        let mut panes = self.panes.borrow_mut();
        if let Some(p) = panes.get_mut(pane) {
            p.handle_pane_run(command_line);
        }
        Ok(())
    }
    fn send_text(&self, pane: &str, text: &str, submit: bool) -> DriverResult<()> {
        self.log.borrow_mut().push(format!("send.text {pane} {text} {submit}"));
        Ok(())
    }
    fn send_keys(&self, pane: &str, keys: &[String]) -> DriverResult<()> {
        self.log.borrow_mut().push(format!("send.keys {pane} {}", keys.join(",")));
        Ok(())
    }
    fn read_screen(&self, pane: &str, _lines: Option<u32>, _source: Option<&str>) -> DriverResult<String> {
        let mut panes = self.panes.borrow_mut();
        if let Some(p) = panes.get_mut(pane) {
            Ok(p.screen.clone())
        } else {
            Err(unknown("pane_not_found"))
        }
    }
    fn process_info(&self, pane: &str) -> DriverResult<ProcessInfo> {
        if self.vanish_on_process_info.borrow().as_deref() == Some(pane) {
            self.vanish_on_process_info.borrow_mut().take();
            self.kill_pane(pane);
        }
        self.panes.borrow().get(pane).map(|p| p.info.clone()).ok_or_else(|| unknown("pane_not_found"))
    }
    fn activity(&self, _pane: &str) -> DriverResult<Activity> {
        Ok(Activity { state: "idle".into(), ..Default::default() })
    }
    fn activity_start(&self, pane: &str, name: &str, kind: &str, _args: &[String], _timeout_ms: u64) -> DriverResult<()> {
        self.log.borrow_mut().push(format!("activity.start {pane} {name} {kind}"));
        Ok(())
    }
    fn label_tab(&self, tab: &str, label: &str) -> DriverResult<()> {
        self.log.borrow_mut().push(format!("label.tab {tab} {label}"));
        Ok(())
    }
    fn label_pane(&self, pane: &str, label: &str) -> DriverResult<()> {
        self.log.borrow_mut().push(format!("label.pane {pane} {label}"));
        Ok(())
    }
    fn layout_geometry(&self, pane: &str) -> DriverResult<TabGeometry> {
        if self.vanish_on_layout.borrow().as_deref() == Some(pane) {
            self.vanish_on_layout.borrow_mut().take();
            self.kill_pane(pane);
        }
        let panes = self.panes.borrow();
        let tab = panes.get(pane).ok_or_else(|| unknown("pane_not_found"))?.tab.clone();
        let members = panes
            .iter()
            .filter(|(_, p)| p.tab == tab)
            .map(|(id, p)| PaneGeometry { pane_id: id.clone(), rect: p.rect, pty: None })
            .collect();
        Ok(TabGeometry { tab_id: tab, area: self.area, panes: members })
    }
}

pub fn state_dir(name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("fgos-tc-{name}-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

pub fn config(state_root: PathBuf) -> CoreConfig {
    CoreConfig {
        state_root,
        limits: Limits { min_cols: 60, min_rows: 15, max_panes_per_tab: 4 },
        allocation_grace_ms: 60_000,
        launch_identify_timeout_ms: 500,
        shell_ready_timeout_ms: 500,
    }
}

pub fn core<'a>(driver: &'a MemDriver, policy: &'a MeasuredSplit, root: PathBuf) -> Core<'a> {
    Core::new(driver, policy, config(root))
}

pub fn request(key: &str, group: &str) -> AllocateRequest {
    AllocateRequest {
        key: key.into(),
        group_key: group.into(),
        display: Display { label: format!("label-{group}"), ..Display::default() },
        role_hint: None,
        cwd: None,
        env: Default::default(),
    }
}
