//! Core rules: grouping, anchoring, closing only what was allocated.
//!
//! Rules (design 7.4): panes of one group share a tab; a group's first pane is
//! the pane a new tab opens with (no empty root pane); the core closes only a
//! pane it allocated, by key, and never a tab; a driver failure is `Unknown`,
//! never gone or closed; labels are written, never read back to decide.

use crate::driver::{
    CloseOutcome, CreatedPane, Direction, PaneLiveness, TabGeometry, TerminalDriver,
};
use crate::identity;
use crate::policy::{GroupPane, Limits, PlaceInput, PlaceRequest, Placement, PlacementPolicy};
use crate::port::*;
use crate::record::*;
use crate::store::{self, Store};
use std::path::PathBuf;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

/// Split share kept by the anchor when the driver cannot measure geometry.
const FALLBACK_SPLIT_RATIO: f64 = 0.3;
const IDENTIFY_POLL: Duration = Duration::from_millis(50);

/// Which parts of an inspection the caller wants (the pane state is always given).
#[derive(Debug, Clone, Copy)]
pub struct Want {
    pub foreground: bool,
    pub activity: bool,
    /// The driver's detector verdict inside `activity`.
    pub detail: bool,
}

impl Default for Want {
    fn default() -> Self {
        Want { foreground: true, activity: true, detail: false }
    }
}

#[derive(Debug, Clone)]
pub struct CoreConfig {
    pub state_root: PathBuf,
    pub limits: Limits,
    /// A slot that was never launched into and holds a bare shell this long
    /// after allocation is reported by the reconcile scan.
    pub allocation_grace_ms: u64,
    /// How long `launch` waits to see the launched root process.
    pub launch_identify_timeout_ms: u64,
    /// How long `launch` waits for the pane's shell to prove it executes commands.
    pub shell_ready_timeout_ms: u64,
}

pub struct Core<'a> {
    driver: &'a dyn TerminalDriver,
    policy: &'a dyn PlacementPolicy,
    config: CoreConfig,
    now_ms: Box<dyn Fn() -> u64 + 'a>,
}

fn wall_clock_ms() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_millis() as u64).unwrap_or(0)
}

fn unknown(reason: impl Into<String>) -> Refusal {
    Refusal::Unknown { reason: reason.into() }
}

fn store_err(e: std::io::Error) -> Refusal {
    unknown(format!("allocation store: {e}"))
}

fn shell_quote(s: &str) -> String {
    format!("'{}'", s.replace('\'', "'\\''"))
}
/// Reads a 128-bit hex nonce from /dev/urandom, failing closed if unavailable.
/// Kept local to avoid a dependency on event-store (where identity::random_id is crate-private).
/// Never uses a time-derived nonce so old tokens in scrollback cannot satisfy the handshake.
fn random_nonce() -> Result<String, LaunchOutcome> {
    use std::fs::File;
    use std::io::Read;
    let mut bytes = [0u8; 16];
    let mut file = File::open("/dev/urandom").map_err(|e| LaunchOutcome::NotStarted {
        reason: format!("cannot read /dev/urandom for probe nonce: {e}"),
    })?;
    file.read_exact(&mut bytes).map_err(|e| LaunchOutcome::NotStarted {
        reason: format!("cannot read /dev/urandom for probe nonce: {e}"),
    })?;
    let mut s = String::with_capacity(32);
    for b in bytes {
        use std::fmt::Write;
        let _ = write!(s, "{b:02x}");
    }
    Ok(s)
}

fn is_error_style_line(line: &str) -> bool {
    let lower = line.to_ascii_lowercase();
    lower.contains("not found")
        || lower.contains("not-found")
        || lower.contains("error")
        || lower.contains("no such file")
        || lower.contains("cannot execute")
}

fn has_consumed_error_evidence(screen: &str, prev_nonce: &str) -> bool {
    let echo_cmd = format!("fgos-ok- {prev_nonce}");
    screen.lines().any(|line| {
        line.contains(prev_nonce) && !line.contains(&echo_cmd) && is_error_style_line(line)
    })
}

fn sleep_poll(step: Duration, deadline: Instant) {
    let now = Instant::now();
    if now < deadline {
        let rem = deadline - now;
        std::thread::sleep(step.min(rem));
    }
}


/// A group pane that is alive right now, with its record.
struct LivePane {
    record: AllocationRecord,
}

impl<'a> Core<'a> {
    pub fn new(driver: &'a dyn TerminalDriver, policy: &'a dyn PlacementPolicy, config: CoreConfig) -> Self {
        Core { driver, policy, config, now_ms: Box::new(wall_clock_ms) }
    }

    /// Use another clock (epoch ms) for record times and expiry decisions.
    pub fn with_clock(mut self, now_ms: impl Fn() -> u64 + 'a) -> Self {
        self.now_ms = Box::new(now_ms);
        self
    }

    fn now(&self) -> u64 {
        (self.now_ms)()
    }

    fn need(&self, capability: &str) -> Result<(), Refusal> {
        if self.driver.capabilities().contains(&capability) {
            Ok(())
        } else {
            Err(Refusal::Unsupported {
                capability: capability.to_string(),
                detail: format!("driver {} does not declare {capability}", self.driver.name()),
            })
        }
    }

    fn has(&self, capability: &str) -> bool {
        self.driver.capabilities().contains(&capability)
    }

    /// The store of the live server incarnation, and that incarnation.
    fn open(&self) -> Result<(Store, ServerIncarnation), Refusal> {
        self.need("server.incarnation")?;
        let incarnation = self.driver.server_incarnation()?;
        let store = Store::open(&self.config.state_root, self.driver.name(), &incarnation).map_err(store_err)?;
        Ok((store, incarnation))
    }

    fn check_key(key: &str) -> Result<(), Refusal> {
        if store::valid_key(key) {
            Ok(())
        } else {
            Err(unknown(format!("invalid key `{key}`")))
        }
    }

    fn record_of(&self, store: &Store, key: &str) -> Result<AllocationRecord, Refusal> {
        Self::check_key(key)?;
        match store.read_record(key).map_err(store_err)? {
            Some(record) => Ok(record),
            None => Err(unknown(self.missing_record_reason(key))),
        }
    }

    /// A record only a previous server incarnation holds is invalid for every
    /// operation; say so instead of calling it missing.
    fn missing_record_reason(&self, key: &str) -> String {
        let root = &self.config.state_root;
        let stale = store::incarnation_ids(root, self.driver.name()).into_iter().any(|id| {
            Store::existing(root, self.driver.name(), &id).is_some_and(|s| s.read_record(key).ok().flatten().is_some())
        });
        if stale {
            format!("record for `{key}` belongs to a previous server incarnation")
        } else {
            format!("no allocation record for `{key}`")
        }
    }

    fn live_record(&self, store: &Store, key: &str) -> Result<AllocationRecord, Refusal> {
        let record = self.record_of(store, key)?;
        if store.has_marker(key, MarkerKind::Released) {
            return Err(unknown(format!("slot `{key}` was released")));
        }
        match self.driver.pane_liveness(&record.pane_id)? {
            PaneLiveness::Live => Ok(record),
            PaneLiveness::Gone => Err(unknown(format!("pane {} of `{key}` is gone", record.pane_id))),
        }
    }

    // ---- allocate / attach -------------------------------------------------

    pub fn allocate(&self, request: &AllocateRequest) -> Result<Allocation, Refusal> {
        Self::check_key(&request.key)?;
        Self::check_key(&request.group_key)?;
        let (store, incarnation) = self.open()?;

        if let Some(record) = store.read_record(&request.key).map_err(store_err)? {
            return match self.driver.pane_liveness(&record.pane_id)? {
                PaneLiveness::Live => Ok(Allocation {
                    slot: Slot { tab_id: record.tab_id, pane_id: record.pane_id },
                    origin: record.origin,
                }),
                PaneLiveness::Gone => Err(unknown(format!("pane of `{}` is gone", request.key))),
            };
        }

        let created = self.place(&store, &incarnation, request)?;
        let record = AllocationRecord {
            v: VERSION,
            key: request.key.clone(),
            group_key: request.group_key.clone(),
            driver: self.driver.name().to_string(),
            server_incarnation: incarnation.clone(),
            tab_id: created.tab_id.clone(),
            pane_id: created.pane_id.clone(),
            allocated_at: self.now(),
            display: request.display.clone(),
            origin: Origin::Allocated,
        };
        if !store.publish_record(&record).map_err(store_err)? {
            // A concurrent allocate of the same key published first; the pane
            // just created has no record and nothing launched in it.
            let _ = self.close_unrecorded(&created.pane_id, &incarnation);
            return self.allocate(request);
        }
        let hint = GroupHint {
            v: VERSION,
            group_key: request.group_key.clone(),
            tab_id: created.tab_id.clone(),
            updated_at: self.now(),
        };
        store.write_hint(&hint).map_err(store_err)?;
        Ok(Allocation {
            slot: Slot { tab_id: created.tab_id, pane_id: created.pane_id },
            origin: Origin::Allocated,
        })
    }

    /// Take a pane the caller already has. `group_key` lets it join a group so
    /// the group's next pane opens beside it; it defaults to the key itself.
    pub fn attach(&self, key: &str, pane: &str, group_key: Option<&str>, display: Option<Display>) -> Result<Allocation, Refusal> {
        Self::check_key(key)?;
        if let Some(group) = group_key {
            Self::check_key(group)?;
        }
        let (store, incarnation) = self.open()?;
        if let Some(record) = store.read_record(key).map_err(store_err)? {
            if record.pane_id == pane {
                return Ok(Allocation { slot: Slot { tab_id: record.tab_id, pane_id: record.pane_id }, origin: record.origin });
            }
            return Err(unknown(format!("`{key}` already names pane {}", record.pane_id)));
        }
        self.need("layout.geometry")?;
        if self.driver.pane_liveness(pane)? != PaneLiveness::Live {
            return Err(unknown(format!("pane {pane} is not live")));
        }
        let tab_id = self.driver.layout_geometry(pane)?.tab_id;
        let record = AllocationRecord {
            v: VERSION,
            key: key.to_string(),
            group_key: group_key.unwrap_or(key).to_string(),
            driver: self.driver.name().to_string(),
            server_incarnation: incarnation,
            tab_id: tab_id.clone(),
            pane_id: pane.to_string(),
            allocated_at: self.now(),
            display: display.unwrap_or_default(),
            origin: Origin::Attached,
        };
        if !store.publish_record(&record).map_err(store_err)? {
            return self.attach(key, pane, group_key, None);
        }
        Ok(Allocation { slot: Slot { tab_id, pane_id: pane.to_string() }, origin: Origin::Attached })
    }

    /// Live panes of a group, oldest first: records of the group that were not
    /// released and whose pane the driver reports live.
    fn live_group(&self, store: &Store, group_key: &str) -> Result<Vec<LivePane>, Refusal> {
        let mut records = Vec::new();
        for key in store.record_keys().map_err(store_err)? {
            let Some(record) = store.read_record(&key).map_err(store_err)? else { continue };
            if record.group_key != group_key || store.has_marker(&key, MarkerKind::Released) {
                continue;
            }
            records.push(record);
        }
        records.sort_by(|a, b| (a.allocated_at, &a.key).cmp(&(b.allocated_at, &b.key)));
        let mut live = Vec::new();
        for record in records {
            if self.driver.pane_liveness(&record.pane_id)? == PaneLiveness::Live {
                live.push(LivePane { record });
            }
        }
        Ok(live)
    }

    fn place(&self, store: &Store, incarnation: &ServerIncarnation, request: &AllocateRequest) -> Result<CreatedPane, Refusal> {
        let group = self.live_group(store, &request.group_key)?;
        if group.is_empty() {
            return self.new_tab(request);
        }
        if self.has("layout.geometry") {
            self.place_measured(incarnation, request, &group)
        } else {
            self.place_by_count(request, &group)
        }
    }

    /// First pane of a group's tab: the slot is the tab's own first pane.
    fn new_tab(&self, request: &AllocateRequest) -> Result<CreatedPane, Refusal> {
        self.need("tab.create")?;
        self.driver.tab_create(&request.display.label, request.cwd.as_deref(), &env_pairs(request))
    }

    fn split(&self, anchor: &str, direction: Direction, ratio: f64, request: &AllocateRequest) -> Result<CreatedPane, Refusal> {
        self.need("pane.split")?;
        match self.driver.pane_split(anchor, direction, ratio, request.cwd.as_deref(), &env_pairs(request)) {
            Ok(pane) => Ok(pane),
            // An anchor that died between the liveness check and the split:
            // the group continues in a new tab with the same label.
            Err(refusal) => match self.driver.pane_liveness(anchor) {
                Ok(PaneLiveness::Gone) => self.new_tab(request),
                _ => Err(refusal),
            },
        }
    }

    fn place_measured(&self, incarnation: &ServerIncarnation, request: &AllocateRequest, group: &[LivePane]) -> Result<CreatedPane, Refusal> {
        let mut tabs: Vec<TabGeometry> = Vec::new();
        let mut group_panes = Vec::new();
        for live in group {
            let geometry = match self.driver.layout_geometry(&live.record.pane_id) {
                Ok(geometry) => geometry,
                // A pane another process released between the liveness check and this look is no longer
                // part of the group; anything else that stops the look is the caller's to hear.
                Err(refusal) => match self.driver.pane_liveness(&live.record.pane_id) {
                    Ok(PaneLiveness::Gone) => continue,
                    _ => return Err(refusal),
                },
            };
            if !tabs.iter().any(|t| t.tab_id == geometry.tab_id) {
                tabs.push(geometry.clone());
            }
            if let Some(p) = geometry.panes.iter().find(|p| p.pane_id == live.record.pane_id) {
                group_panes.push(GroupPane {
                    key: live.record.key.clone(),
                    tab_id: geometry.tab_id.clone(),
                    pane_id: p.pane_id.clone(),
                    rect: p.rect,
                    role_hint: None,
                });
            }
        }
        // Every pane of the group went away while it was being measured: it continues in a new tab.
        if group_panes.is_empty() {
            return self.new_tab(request);
        }
        let input = PlaceInput {
            group_key: request.group_key.clone(),
            tabs,
            group_panes,
            request: PlaceRequest { label: request.display.label.clone(), role_hint: request.role_hint.clone() },
            limits: self.config.limits,
        };
        match self.policy.place(&input) {
            Placement::NewTab {} => self.new_tab(request),
            Placement::Unsupported { reason } => Err(Refusal::Unsupported {
                capability: format!("placement.{}", self.policy.name()),
                detail: reason,
            }),
            Placement::Split { anchor_key, direction, ratio } => {
                let anchor = group
                    .iter()
                    .find(|l| l.record.key == anchor_key)
                    .ok_or_else(|| unknown(format!("policy chose unknown anchor `{anchor_key}`")))?;
                let created = self.split(&anchor.record.pane_id, direction, ratio, request)?;
                self.keep_if_roomy(created, incarnation, request)
            }
        }
    }

    /// Measure the pane a split just made; below the minimum, close that
    /// empty pane (nothing launched in it) and open a new tab instead.
    fn keep_if_roomy(&self, created: CreatedPane, incarnation: &ServerIncarnation, request: &AllocateRequest) -> Result<CreatedPane, Refusal> {
        let Ok(geometry) = self.driver.layout_geometry(&created.pane_id) else {
            return Ok(created);
        };
        let Some(pane) = geometry.panes.iter().find(|p| p.pane_id == created.pane_id) else {
            return Ok(created);
        };
        let (cols, rows) = pane.pty.map(|s| (s.cols, s.rows)).unwrap_or((pane.rect.width, pane.rect.height));
        let limits = &self.config.limits;
        if cols >= limits.min_cols && rows >= limits.min_rows {
            return Ok(created);
        }
        // If the empty pane cannot be closed, keep it as the slot: a recorded
        // pane below the minimum is better than an orphan nobody tracks.
        if self.close_unrecorded(&created.pane_id, incarnation).is_err() {
            return Ok(created);
        }
        self.new_tab(request)
    }

    /// Without geometry: split the newest live group pane down at 0.3, and
    /// open a new tab once its tab holds `maxPanesPerTab` panes.
    fn place_by_count(&self, request: &AllocateRequest, group: &[LivePane]) -> Result<CreatedPane, Refusal> {
        let newest = group.last().expect("group is not empty");
        let in_tab = group.iter().filter(|l| l.record.tab_id == newest.record.tab_id).count();
        if in_tab >= self.config.limits.max_panes_per_tab as usize {
            return self.new_tab(request);
        }
        self.split(&newest.record.pane_id, Direction::Down, FALLBACK_SPLIT_RATIO, request)
    }

    /// Close a pane the core itself just created and never recorded.
    fn close_unrecorded(&self, pane: &str, incarnation: &ServerIncarnation) -> Result<(), Refusal> {
        self.need("pane.close")?;
        self.driver.pane_close(pane, incarnation).map(|_| ())
    }

    // ---- launch ------------------------------------------------------------

    pub fn launch(&self, key: &str, spec: &LaunchSpec) -> Result<LaunchOutcome, Refusal> {
        let (store, _) = self.open()?;
        let record = self.live_record(&store, key)?;
        if record.origin == Origin::Attached {
            return Err(unknown(format!("`{key}` is an attached pane; the core never launches into it")));
        }
        match &spec.activity {
            Some(_) => self.need("activity.state")?,
            None => {
                self.need("pane.run")?;
                self.need("read.screen")?;
            }
        }
        self.need("process.info")?;
        let line = launch_line(spec)?;

        if store.has_marker(key, MarkerKind::LaunchRequested) {
            return Ok(LaunchOutcome::NotStarted { reason: "launch was already requested for this slot".into() });
        }

        if spec.activity.is_none() {
            if let Some(not_started) = self.wait_for_shell(&record.pane_id)? {
                return Ok(not_started);
            }
            let info = self.driver.process_info(&record.pane_id)?;
            if !identity::is_bare_shell(&info) {
                return Ok(LaunchOutcome::NotStarted { reason: "pane foreground is not the shell".into() });
            }
        }

        let requested = LaunchRequestedMarker { v: VERSION, key: key.to_string(), at: self.now() };
        if !store.publish_marker(key, MarkerKind::LaunchRequested, &requested).map_err(store_err)? {
            return Ok(LaunchOutcome::NotStarted { reason: "launch was already requested for this slot".into() });
        }
        // The marker is on disk: from here on the slot is kept, whatever happens.
        match &spec.activity {
            Some(activity) => self.driver.activity_start(
                &record.pane_id,
                key,
                &activity.kind,
                &activity.args,
                activity.timeout_ms.unwrap_or(self.config.launch_identify_timeout_ms),
            )?,
            None => self.driver.pane_run(&record.pane_id, &line)?,
        }

        let Some(identity) = self.identify_root(&record.pane_id, spec) else {
            return Ok(LaunchOutcome::NotStarted { reason: "launched root process was not identified in time".into() });
        };
        let launched = LaunchedMarker { v: VERSION, key: key.to_string(), at: self.now(), identity: identity.clone() };
        store.publish_marker(key, MarkerKind::Launched, &launched).map_err(store_err)?;
        Ok(LaunchOutcome::Launched(identity))
    }

    fn wait_for_shell(&self, pane: &str) -> Result<Option<LaunchOutcome>, Refusal> {
        let deadline = Instant::now() + Duration::from_millis(self.config.shell_ready_timeout_ms);
        let backoff = Duration::from_millis(self.config.shell_ready_timeout_ms / 3);
        let poll_step = Duration::from_millis(100).min(backoff).max(Duration::from_millis(1));
        let mut nonces: Vec<String> = Vec::new();
        let mut last_probe_at: Option<Instant> = None;
        let mut screen = String::new();

        loop {
            let info = match self.driver.process_info(pane) {
                Ok(info) => info,
                Err(_) => {
                    if let Ok(PaneLiveness::Gone) = self.driver.pane_liveness(pane) {
                        return Err(unknown("pane is gone"));
                    }
                    if Instant::now() >= deadline {
                        break;
                    }
                    sleep_poll(poll_step, deadline);
                    continue;
                }
            };

            if !identity::is_bare_shell(&info) {
                if Instant::now() >= deadline {
                    break;
                }
                sleep_poll(poll_step, deadline);
                continue;
            }

            let should_probe = if nonces.is_empty() {
                true
            } else if nonces.len() < 3 {
                let prev_nonce = nonces.last().unwrap();
                let consumed = has_consumed_error_evidence(&screen, prev_nonce);
                let backoff_elapsed = last_probe_at.map(|t| t.elapsed() >= backoff).unwrap_or(false);
                consumed || backoff_elapsed
            } else {
                false
            };

            if should_probe {
                let nonce = match random_nonce() {
                    Ok(n) => n,
                    Err(not_started) => return Ok(Some(not_started)),
                };
                let probe_cmd = format!("printf '%s%s\\n' fgos-ok- {nonce}");
                self.driver.pane_run(pane, &probe_cmd)?;
                nonces.push(nonce);
                last_probe_at = Some(Instant::now());
            }

            screen = match self.driver.read_screen(pane, Some(40), Some("recent-unwrapped")) {
                Ok(s) => s,
                Err(_) => {
                    if let Ok(PaneLiveness::Gone) = self.driver.pane_liveness(pane) {
                        return Err(unknown("pane is gone"));
                    }
                    String::new()
                }
            };

            if nonces.iter().any(|n| screen.contains(&format!("fgos-ok-{n}"))) {
                return Ok(None);
            }

            if nonces.len() < 3 && has_consumed_error_evidence(&screen, nonces.last().unwrap()) {
                continue;
            }

            if Instant::now() >= deadline {
                break;
            }
            sleep_poll(poll_step, deadline);
        }

        if nonces.is_empty() {
            Ok(Some(LaunchOutcome::NotStarted {
                reason: "pane foreground is not the shell".into(),
            }))
        } else {
            Ok(Some(LaunchOutcome::NotStarted {
                reason: "pane shell did not become ready in time".into(),
            }))
        }
    }

    fn identify_root(&self, pane: &str, spec: &LaunchSpec) -> Option<ProcessIdentity> {
        let deadline = Instant::now() + Duration::from_millis(self.config.launch_identify_timeout_ms);
        loop {
            if let Ok(info) = self.driver.process_info(pane) {
                let root = if spec.activity.is_some() {
                    identity::first_non_shell(&info)
                } else if let Some(expect) = &spec.expect {
                    identity::match_expected(&info, expect)
                } else {
                    identity::match_launched(&info, &spec.command, &spec.args)
                };
                if let Some(identity) = root.and_then(|p| identity::identity_of(p.pid, info.foreground_pgid)) {
                    return Some(identity);
                }
            }
            if Instant::now() >= deadline {
                return None;
            }
            std::thread::sleep(IDENTIFY_POLL);
        }
    }

    // ---- send / read / inspect / label -------------------------------------

    /// Type into the pane of `key`, through the prompt door when `submit`. Only
    /// while a program other than the pane's shell holds the foreground: text
    /// typed at a shell runs as commands, backtick spans included.
    pub fn send(&self, key: &str, text: Option<&str>, keys: Option<&[String]>, submit: bool) -> Result<SendOutcome, Refusal> {
        let (store, _) = self.open()?;
        let capability = match (text, keys) {
            (Some(_), None) => "send.text",
            (None, Some(_)) => "send.keys",
            _ => return Err(unknown("send takes exactly one of text or keys")),
        };
        self.need(capability)?;
        self.need("process.info")?;
        let record = self.live_record(&store, key)?;
        let info = match self.driver.process_info(&record.pane_id) {
            Ok(info) => info,
            Err(refusal) => return Ok(SendOutcome::ForegroundNotAgent { reason: format!("the pane's foreground could not be read: {refusal:?}") }),
        };
        if self.foreground_of(&store, key, &info).is_none() {
            let reason = if identity::is_bare_shell(&info) {
                format!("the pane's shell (pid {}) is in the foreground", info.shell_pid)
            } else {
                "no live process in the pane's foreground could be identified".to_string()
            };
            return Ok(SendOutcome::ForegroundNotAgent { reason });
        }
        match text {
            Some(text) => self.driver.send_text(&record.pane_id, text, submit),
            None => self.driver.send_keys(&record.pane_id, keys.unwrap_or_default()),
        }
        .map(|()| SendOutcome::Sent)
    }

    pub fn read(&self, key: &str, lines: Option<u32>, source: Option<&str>) -> Result<String, Refusal> {
        self.need("read.screen")?;
        let (store, _) = self.open()?;
        let record = self.live_record(&store, key)?;
        self.driver.read_screen(&record.pane_id, lines, source)
    }

    pub fn inspect(&self, key: &str, detail: bool) -> Inspection {
        self.inspect_parts(key, Want { detail, ..Want::default() })
    }

    /// `inspect` for a caller that needs only some of the answer: each part
    /// left out saves a driver call per poll.
    pub fn inspect_parts(&self, key: &str, want: Want) -> Inspection {
        let unknown_pane = || Inspection { pane: PaneState::Unknown, foreground: None, activity: None };
        let Ok((store, _)) = self.open() else { return unknown_pane() };
        let Ok(record) = self.record_of(&store, key) else { return unknown_pane() };
        let pane = match self.driver.pane_liveness(&record.pane_id) {
            Ok(PaneLiveness::Live) => PaneState::Live,
            Ok(PaneLiveness::Gone) => PaneState::Gone,
            Err(_) => PaneState::Unknown,
        };
        if pane != PaneState::Live {
            return Inspection { pane, foreground: None, activity: None };
        }
        let foreground = if want.foreground && self.has("process.info") { self.foreground_identity(&store, key, &record.pane_id) } else { None };
        let mut activity = if want.activity && self.has("activity.state") { self.driver.activity(&record.pane_id).ok() } else { None };
        if want.detail && want.activity && self.has("activity.state") {
            // The detector may know a state the pane's own report does not.
            if let Ok(seen) = self.driver.activity_detail(&record.pane_id) {
                let base = activity.get_or_insert_with(Default::default);
                if base.state.is_empty() {
                    base.state = seen.state.clone().unwrap_or_default();
                }
                base.detail = Some(seen);
            }
        }
        Inspection { pane, foreground, activity }
    }

    fn foreground_identity(&self, store: &Store, key: &str, pane: &str) -> Option<ProcessIdentity> {
        let info = self.driver.process_info(pane).ok()?;
        self.foreground_of(store, key, &info)
    }

    /// The process in the foreground that is not the pane's shell: a foreground process other than the
    /// shell, or the launched command that `exec`-replaced it. `None` for a bare shell or a process gone.
    fn foreground_of(&self, store: &Store, key: &str, info: &crate::driver::ProcessInfo) -> Option<ProcessIdentity> {
        if let Some(root) = identity::first_non_shell(info) {
            return identity::identity_of(root.pid, info.foreground_pgid);
        }
        // A command launched with `exec` replaced the pane's shell, so the root
        // process carries the shell's own pid. It is the launched process when the
        // launched marker names that pid and the start time still matches.
        let launched = store.read_marker::<LaunchedMarker>(key, MarkerKind::Launched).ok().flatten()?;
        info.foreground.iter().any(|p| p.pid == launched.identity.pid).then_some(())?;
        identity::identity_of(launched.identity.pid, info.foreground_pgid).filter(|id| id.start_time == launched.identity.start_time)
    }

    /// Write display data to the terminal. The record is never edited.
    pub fn label(&self, key: &str, display: &Display, report_state: Option<&str>) -> Result<(), Refusal> {
        self.need("label")?;
        let (store, _) = self.open()?;
        let record = self.live_record(&store, key)?;
        self.driver.label_pane(&record.pane_id, &display.label)?;
        if let Some(state) = report_state {
            // Only for an agent the driver does not recognise on its own: a
            // reported state becomes the pane's status authority.
            self.need("activity.state")?;
            let agent = display.agent.as_deref().ok_or_else(|| unknown("report needs display.agent"))?;
            self.driver.report_agent(&record.pane_id, agent, state)?;
        }
        Ok(())
    }

    pub fn capabilities(&self) -> CapabilitiesReport {
        CapabilitiesReport {
            driver: self.driver.name().to_string(),
            capabilities: self.driver.capabilities().into_iter().map(String::from).collect(),
            server_incarnation: self.driver.server_incarnation().ok(),
        }
    }

    // ---- release -----------------------------------------------------------

    pub fn release(&self, key: &str, disposition: Disposition, until: Option<u64>) -> Result<ReleaseOutcome, Refusal> {
        self.release_as(key, disposition, until, None)
    }

    /// `release` with the pane the caller itself runs in. The one exception to
    /// "the core never closes an attached pane": a `close` of an attached slot
    /// whose pane is the caller's own pane, because a person asked to close
    /// their own pane. Any other caller, or none, only unlinks.
    pub fn release_as(&self, key: &str, disposition: Disposition, until: Option<u64>, caller_pane: Option<&str>) -> Result<ReleaseOutcome, Refusal> {
        let (store, incarnation) = self.open()?;
        let record = match self.record_of(&store, key) {
            Ok(record) => record,
            Err(Refusal::Unknown { reason }) => return Ok(ReleaseOutcome::KeptUnknown { reason }),
            Err(other) => return Err(other),
        };
        if let Some(done) = store.read_marker::<ReleasedMarker>(key, MarkerKind::Released).map_err(store_err)? {
            if done.disposition == Disposition::Retain && disposition == Disposition::Close && record.origin == Origin::Allocated {
                return Ok(ReleaseOutcome::KeptUnknown {
                    reason: "already retained; the pane closes when its retain expires".into(),
                });
            }
            return Ok(ReleaseOutcome::Released { disposition: done.disposition });
        }
        let marker = |outcome, until| ReleasedMarker {
            v: VERSION,
            key: key.to_string(),
            at: self.now(),
            disposition,
            until,
            outcome,
        };
        let outcome = match (record.origin, disposition) {
            (Origin::Attached, Disposition::Close) if caller_pane == Some(record.pane_id.as_str()) => {
                self.need("pane.close")?;
                match self.driver.pane_close(&record.pane_id, &incarnation) {
                    Ok(CloseOutcome::Closed | CloseOutcome::AlreadyGone) => ReleaseMarkerOutcome::Closed,
                    Err(Refusal::Unknown { reason }) => return Ok(ReleaseOutcome::KeptUnknown { reason }),
                    Err(other) => return Err(other),
                }
            }
            // Any other attached release only drops the label and the link.
            (Origin::Attached, _) => ReleaseMarkerOutcome::Unlinked,
            (Origin::Allocated, Disposition::Retain) => ReleaseMarkerOutcome::Retained,
            (Origin::Allocated, Disposition::Close) => {
                if !self.foreground_is_owned(&store, &record) {
                    return Ok(ReleaseOutcome::KeptUnknown { reason: "foreground is not provably the launched process or shell; kept".into() });
                }
                self.need("pane.close")?;
                match self.driver.pane_close(&record.pane_id, &incarnation) {
                    Ok(CloseOutcome::Closed | CloseOutcome::AlreadyGone) => ReleaseMarkerOutcome::Closed,
                    Err(Refusal::Unknown { reason }) => return Ok(ReleaseOutcome::KeptUnknown { reason }),
                    Err(other) => return Err(other),
                }
            }
        };
        let until = if disposition == Disposition::Retain { until } else { None };
        store.publish_marker(key, MarkerKind::Released, &marker(outcome, until)).map_err(store_err)?;
        Ok(ReleaseOutcome::Released { disposition })
    }

    // ---- reconcile scan ----------------------------------------------------

    /// Report what needs attention. Closes nothing because time passed, except
    /// a retained pane past its `until` on the same incarnation with no foreign
    /// foreground process.
    pub fn reconcile_scan(&self, older_than_ms: u64) -> Result<Vec<Finding>, Refusal> {
        let (store, incarnation) = self.open()?;
        let mut findings = Vec::new();
        let current = incarnation.id();
        for id in store::incarnation_ids(&self.config.state_root, self.driver.name()) {
            if id != current {
                self.scan_stale(&id, &mut findings);
            }
        }
        for key in store.record_keys().map_err(store_err)? {
            let Ok(Some(record)) = store.read_record(&key) else {
                findings.push(Finding { key, kind: FindingKind::Unknown, detail: "record unreadable; kept".into() });
                continue;
            };
            self.scan_record(&store, &incarnation, &record, older_than_ms, &mut findings);
        }
        Ok(findings)
    }

    /// The same foreground guard applies to immediate and expired-retention closes.
    fn foreground_is_owned(&self, store: &Store, record: &AllocationRecord) -> bool {
        if !self.has("process.info") { return false; }
        let Ok(info) = self.driver.process_info(&record.pane_id) else { return false };
        let Ok(launched) = store.read_marker::<LaunchedMarker>(&record.key, MarkerKind::Launched) else { return false };
        info.foreground.iter().all(|p| p.pid == info.shell_pid || launched.as_ref().is_some_and(|l| l.identity.pid == p.pid))
    }

    fn scan_stale(&self, id: &str, findings: &mut Vec<Finding>) {
        let Some(old) = Store::existing(&self.config.state_root, self.driver.name(), id) else { return };
        for key in old.record_keys().unwrap_or_default() {
            if !old.has_marker(&key, MarkerKind::Released) {
                findings.push(Finding {
                    key,
                    kind: FindingKind::StaleIncarnation,
                    detail: format!("record of server incarnation {id}; invalid for every operation"),
                });
            }
        }
    }

    fn scan_record(&self, store: &Store, incarnation: &ServerIncarnation, record: &AllocationRecord, older_than_ms: u64, findings: &mut Vec<Finding>) {
        let key = &record.key;
        let note = |kind, detail: &str| Finding { key: key.clone(), kind, detail: detail.to_string() };
        let released = store.read_marker::<ReleasedMarker>(key, MarkerKind::Released).ok().flatten();
        if released.as_ref().is_some_and(|m| m.disposition == Disposition::Close || m.outcome == ReleaseMarkerOutcome::Unlinked) {
            return;
        }
        let liveness = self.driver.pane_liveness(&record.pane_id);
        match liveness {
            Ok(PaneLiveness::Gone) => return,
            Err(_) => return findings.push(note(FindingKind::Unknown, "pane liveness unreadable; kept")),
            Ok(PaneLiveness::Live) => {}
        }
        if let Some(marker) = released {
            // Retained: closable only past `until`, same incarnation (store is
            // this incarnation's), and no foreign foreground process.
            let Some(until) = marker.until else { return };
            if self.now() <= until {
                return;
            }
            if !self.foreground_is_owned(store, record) {
                return findings.push(note(FindingKind::Unknown, "retain expired but the foreground is not provably the launched process; kept"));
            }
            let detail = match self.close_unrecorded(&record.pane_id, incarnation) {
                Ok(()) => "retain expired; pane closed",
                Err(_) => "retain expired; close not proven, kept",
            };
            return findings.push(note(FindingKind::RetainExpired, detail));
        }

        if store.has_marker(key, MarkerKind::LaunchRequested) {
            if !store.has_marker(key, MarkerKind::Launched) {
                findings.push(note(FindingKind::Unknown, "launch-requested without launched; kept"));
            }
            return;
        }
        let info = if self.has("process.info") { self.driver.process_info(&record.pane_id).ok() } else { None };
        let age = self.now().saturating_sub(record.allocated_at);
        if record.origin == Origin::Allocated
            && age >= older_than_ms.max(self.config.allocation_grace_ms)
            && info.as_ref().is_some_and(identity::is_bare_shell)
        {
            findings.push(note(
                FindingKind::AllocatedNotLaunchedBareShell,
                "allocated, never launched into, bare shell past the allocation grace; not closed",
            ));
        }
    }
}

fn env_pairs(request: &AllocateRequest) -> Vec<(String, String)> {
    request.env.iter().map(|(k, v)| (k.clone(), v.clone())).collect()
}

/// The shell line a launch types into the pane: change directory, set the
/// environment, run the command. The pane's shell stays as its parent: a pane
/// whose root process was replaced by the command closes with it, and a pane
/// kept for a person to read (`retain`) would be gone before they looked.
fn launch_line(spec: &LaunchSpec) -> Result<String, Refusal> {
    let mut line = format!("cd {} &&", shell_quote(&spec.cwd));
    if !spec.env.is_empty() {
        line.push_str(" env");
        for (name, value) in &spec.env {
            let mut chars = name.chars();
            let ok = chars.next().is_some_and(|c| c.is_ascii_alphabetic() || c == '_')
                && chars.all(|c| c.is_ascii_alphanumeric() || c == '_');
            if !ok {
                return Err(unknown(format!("invalid environment variable name `{name}`")));
            }
            line.push_str(&format!(" {name}={}", shell_quote(value)));
        }
    }
    line.push(' ');
    line.push_str(&shell_quote(&spec.command));
    for arg in &spec.args {
        line.push(' ');
        line.push_str(&shell_quote(arg));
    }
    Ok(line)
}

