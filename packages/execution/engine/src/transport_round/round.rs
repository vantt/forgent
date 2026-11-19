//! The herdr half of a terminal attempt's controller: what only the controller can prepare before the handover
//! (the brief on disk, the confinement homes, the folder-trust entry, the pane the Session Host opens for the
//! attempt's key) and the pane-follow display. Everything after the handover (starting the agent in the pane,
//! typing the brief, the deadlines, ending the agent, releasing the pane) belongs to the run supervisor.
//!
//! Three refusals shaped what stays here, each because doing the opposite failed in measured production: the
//! prompt never travels as keystrokes through a shell (it goes to disk and the supervisor types what the brief
//! file holds); `agent_status` never concludes a round (completion is the worker's own `outbox/result-<round>.json`
//! existing); a failed attempt keeps its pane (the screen is the only place the reason is still legible).

use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;

use fgos_run_supervisor::controller::error::DispatchError;
use fgos_run_supervisor::controller::proof::publish_mutable_projection;
use fgos_run_supervisor::controller::trust_store::{
    default_agy_settings_path, operator_claude_store_path, seed_agy_trust,
    seed_claude_config_trust, seed_codex_hook_trust, seed_codex_trust, seed_trust, trust_roots,
};
use fgos_session_host::{
    HostKind, OpenAnswer, OpenRequest, Placement, RetireAnswer, Retirement, SessionHost,
};
use serde_json::{json, Map, Value};

use crate::assignment::brief::{brief_paths, render_brief, render_pointer, BriefPaths};
use crate::confinement::policy::evaluate_bypass_pairing;
use crate::steps::cleanup_trust::{cleanup_trust, trust_context_file};
use crate::transport::terminal_slot::{herdr_endpoint_env, port_key, refusal_error, RefusalView};
use crate::transport::visibility_session::write_visibility;
use crate::transport::worker_home::{
    create_worker_home, redact_worker_home, remove_worker_home, CreateWorkerHome, HomeSweeper,
    PermissionMode, BYPASS_ACCEPTANCE_SETTINGS,
};
use crate::transport::worker_session::{Env, WorkerSessionError};
use crate::transport::worker_session_boot::WorkerSession;

/// The variables a pane sets for the program in it: the terminal type and the identity of the pane, tab and herdr
/// server. The controller's own must not reach the agent; `HERDR_SOCKET_PATH` of the operator's cockpit in
/// particular would hand a confined seat the cockpit.
pub const PANE_TERMINAL_ENV: [&str; 4] =
    ["TERM", "COLORTERM", "TERM_PROGRAM", "TERM_PROGRAM_VERSION"];

/// How long an agent in a pane may show no new words before the supervisor stops it.
pub const PANE_IDLE_TIMEOUT_MS: u64 = 1_200_000;

/// After a result file appeared while the supervisor is gone, how long the gate still waits for the report.
pub const ORPHAN_SETTLE_MS: u64 = 5_000;

const SCREEN_FOLLOW_MS: u64 = 3_000;

/// `env` without what a pane sets for its own program.
pub fn without_pane_env(env: &Env) -> Env {
    env.iter()
        .filter(|(name, _)| {
            !PANE_TERMINAL_ENV.contains(&name.as_str()) && !name.starts_with("HERDR_")
        })
        .map(|(k, v)| (k.clone(), v.clone()))
        .collect()
}

/// What a round touches outside the files it writes: the clock, the worker session boot (which needs a terminal
/// route and a lock), the process sweeper for homes, and the directories a home and a trust entry are made in.
pub struct RoundEffects<'a> {
    pub now_iso: &'a dyn Fn() -> String,
    pub now_ms: &'a dyn Fn() -> i64,
    pub local_offset_seconds: &'a dyn Fn(i64) -> i32,
    pub ensure_session: &'a dyn Fn(&Env, &str) -> Result<WorkerSession, WorkerSessionError>,
    pub sweeper: &'a dyn HomeSweeper,
    pub tmp_dir: PathBuf,
    pub home_dir: PathBuf,
    /// One diagnostic line for a person watching the controller's own stderr.
    pub diagnostic: &'a dyn Fn(&str),
}

/// What a backend that delivers the home and the session itself tells a round.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct ControlsDelivered {
    pub root_workspace_allowed: bool,
    pub backend_delivers: bool,
}

/// The terminal-control calls a round makes beside the Session Host's `open`/`retire`: joining a pane the caller
/// already sits in, and reading a screen. `fgos_terminal_control::core::Core` is the real one.
pub trait RoundPanes {
    fn attach(&self, key: &str, pane: &str, group_key: &str, display: &Value)
        -> Result<(), String>;
    fn read_visible(&self, key: &str) -> Result<String, String>;
}

impl RoundPanes for fgos_terminal_control::core::Core<'_> {
    fn attach(
        &self,
        key: &str,
        pane: &str,
        group_key: &str,
        display: &Value,
    ) -> Result<(), String> {
        let display = serde_json::from_value(display.clone()).ok();
        fgos_terminal_control::core::Core::attach(self, key, pane, Some(group_key), display)
            .map(|_| ())
            .map_err(|refusal| format!("{refusal:?}"))
    }

    fn read_visible(&self, key: &str) -> Result<String, String> {
        fgos_terminal_control::core::Core::read(self, key, None, Some("visible"))
            .map_err(|refusal| format!("{refusal:?}"))
    }
}

/// One round's identity, plus the two things every step does with it: `note` leaves a trace (never a gate: a
/// visibility write that fails must not take a working dispatch down) and `fail` builds the error a caller can
/// act on, carrying the pane id once it is known.
pub struct Round<'a> {
    pub run_dir: PathBuf,
    pub work_id: Option<String>,
    pub tier: Option<String>,
    pub model: Option<String>,
    pub agent_name: String,
    pub pane_id: Option<String>,
    pub terminal_key: Option<String>,
    pub herdr_session: Option<String>,
    /// True only when this round wrote a trust entry fgOS takes back afterwards (codex, agy).
    pub trust_written: bool,
    now_iso: &'a dyn Fn() -> String,
}

impl<'a> Round<'a> {
    pub fn open(
        run_dir: &Path,
        work_id: Option<&str>,
        tier: Option<&str>,
        model: Option<&str>,
        agent_name: &str,
        now_iso: &'a dyn Fn() -> String,
    ) -> Self {
        Round {
            run_dir: run_dir.to_path_buf(),
            work_id: work_id.map(String::from),
            tier: tier.map(String::from),
            model: model.map(String::from),
            agent_name: agent_name.to_string(),
            pane_id: None,
            terminal_key: None,
            herdr_session: None,
            trust_written: false,
            now_iso,
        }
    }

    pub fn note(&self, patch: Value) {
        let _ = write_visibility(&self.run_dir, &patch, self.now_iso);
    }

    pub fn fail(&self, error_class: &str, reason: &str, message: String) -> DispatchError {
        let text = |v: &Option<String>| v.as_ref().map_or(Value::Null, |s| json!(s));
        DispatchError::new(error_class, message)
            .with("workId", text(&self.work_id))
            .with("tier", text(&self.tier))
            .with("model", text(&self.model))
            .with("reason", json!(reason))
            .with("runDir", json!(self.run_dir.to_string_lossy()))
            .with("agentName", json!(self.agent_name))
            .with("paneId", text(&self.pane_id))
            .with("terminalKey", text(&self.terminal_key))
            .with("herdrSession", text(&self.herdr_session))
    }
}

fn truthy(value: Option<&Value>) -> bool {
    match value {
        None | Some(Value::Null) | Some(Value::Bool(false)) => false,
        Some(Value::String(s)) => !s.is_empty(),
        Some(Value::Number(n)) => n.as_f64() != Some(0.0),
        Some(_) => true,
    }
}

/// What confinement the round established.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Confined {
    pub worker_home_path: Option<PathBuf>,
    pub session_env: Env,
    pub confined: bool,
    pub status: &'static str,
}

/// What a seat declares about its confinement and where it runs.
#[derive(Debug, Clone, Copy)]
pub struct ConfineSeat<'a> {
    pub confinement: Option<&'a Value>,
    pub full_env: &'a Env,
    pub cwd: &'a Path,
    pub repo_root: Option<&'a Path>,
    pub permission_mode: Option<&'a str>,
    pub herdr_bin: &'a str,
    pub delivery: ControlsDelivered,
}

/// Apply declared confinement before anything is launched. A private HOME closes the default socket under
/// `$HOME`; it does not stop the worker reaching the cockpit, because herdr injects `HERDR_SOCKET_PATH` into every
/// pane it creates, so the worker also goes into a different session. Declared, never inferred: an executor that
/// declares nothing keeps the old behaviour. Confinement asked for and not deliverable is a refusal, not a
/// downgrade.
pub fn establish_confinement(
    seat: &ConfineSeat<'_>,
    round: &Round<'_>,
    effects: &RoundEffects<'_>,
) -> Result<Confined, DispatchError> {
    let ConfineSeat {
        confinement,
        full_env,
        cwd,
        repo_root,
        permission_mode,
        herdr_bin,
        delivery,
    } = *seat;
    let normalized =
        confinement.and_then(fgos_execution::runner_config::normalize_legacy_confinement);
    let effective = normalized.as_ref().or(confinement);
    let flag = |name: &str, control: &str, own: &str| {
        effective.is_some_and(|c| {
            truthy(c.get(name))
                || c.pointer(&format!("/controls/{control}"))
                    .and_then(Value::as_str)
                    == Some(own)
        })
    };
    let has_own_worktree = flag("ownWorktree", "workspace", "own");
    let has_private_home = flag("privateHome", "home", "private");
    let has_isolated_session = flag("isolatedSession", "session", "isolated");
    let work = round.work_id.as_deref().unwrap_or("undefined");

    // An incomplete bypass pairing is a refusal wherever the dispatch happens to run.
    let pairing = evaluate_bypass_pairing(
        permission_mode == Some("bypass"),
        has_own_worktree,
        has_private_home,
        has_isolated_session,
    );
    if !pairing.satisfied {
        return Err(round.fail(
            "invalid-config",
            "bypass-confinement-incomplete",
            format!(
                "executor for work \"{work}\" refused: permissionMode \"bypass\" requires full confinement (missing: {}).",
                pairing.missing.join(", ")
            ),
        ));
    }
    // A worker confined to its own worktree cannot be running in the checkout it was told to stay out of.
    if has_own_worktree && !delivery.root_workspace_allowed {
        if let Some(root) = repo_root {
            if absolute(cwd) == absolute(root) {
                return Err(round.fail(
                    "invalid-config",
                    "own-worktree-unavailable",
                    format!(
                        "executor for work \"{work}\" refused: confinement declares ownWorktree, but this dispatch runs in the repo root itself ({}) rather than a worktree of its own.",
                        absolute(cwd).display()
                    ),
                ));
            }
        }
    }
    // A required backend delivers the home and the session itself, so no host-side measure below is taken.
    if delivery.backend_delivers {
        return Ok(Confined {
            worker_home_path: None,
            session_env: full_env.clone(),
            confined: true,
            status: "confined",
        });
    }

    let mut worker_home: Option<PathBuf> = None;
    let outcome = (|| -> Result<Confined, (String, String)> {
        if has_private_home {
            let source_home = full_env
                .get("HOME")
                .map(PathBuf::from)
                .unwrap_or_else(|| effects.home_dir.clone());
            let workspace = absolute(cwd);
            let repo = repo_root.map(absolute).unwrap_or_else(|| workspace.clone());
            let mode = PermissionMode::parse(Some(permission_mode.unwrap_or("ask")))
                .map_err(|e| (e.code.to_string(), e.message.clone()))?;
            let home = create_worker_home(
                &effects.tmp_dir,
                &CreateWorkerHome {
                    run_id: &round.agent_name,
                    source_home: &source_home,
                    workspace_path: &workspace.to_string_lossy(),
                    repo_root: &repo.to_string_lossy(),
                    permission_mode: mode,
                },
            )
            .map_err(|e| (e.code.to_string(), e.message.clone()))?;
            round.note(json!({ "workerHome": home.home_path.to_string_lossy() }));
            worker_home = Some(home.home_path);
        }
        if has_isolated_session {
            // One worker session, never named by config: a config-supplied name could point at the operator's
            // own cockpit whenever that cockpit has a name and the dispatch runs outside herdr.
            let session = (effects.ensure_session)(full_env, herdr_bin)
                .map_err(|e| (e.code.to_string(), e.message.clone()))?;
            round.note(json!({ "workerSession": session.session_name }));
            return Ok(Confined {
                worker_home_path: worker_home.clone(),
                session_env: session.env,
                confined: true,
                status: "confined",
            });
        }
        let (confined, status) = if has_private_home {
            (true, "confined")
        } else if has_own_worktree {
            (false, "partial")
        } else {
            (false, "unconfined")
        };
        Ok(Confined {
            worker_home_path: worker_home.clone(),
            session_env: full_env.clone(),
            confined,
            status,
        })
    })();
    outcome.map_err(|(code, message)| {
        if let Some(home) = &worker_home {
            let _ = remove_worker_home(home, effects.sweeper);
        }
        round.fail(
            "invalid-config",
            &code,
            format!(
                "executor for work \"{work}\" refused: confinement was declared but could not be established: {message}"
            ),
        )
    })
}

fn absolute(path: &Path) -> PathBuf {
    if path.is_absolute() {
        path.to_path_buf()
    } else {
        std::env::current_dir().unwrap_or_default().join(path)
    }
}

/// The trust stores whose entry fgOS takes back when the attempt is over (`cleanup_trust`).
fn removable_trust_kind(kind: &str) -> bool {
    matches!(kind, "codex-toml" | "agy" | "agy-json")
}

/// Where the trust decision is read (`root`, the account's real store) and where the entry is written
/// (`target`). They differ only for a confined worker with a private home: it reads its store from the private
/// `CODEX_HOME` / `HOME` / `CLAUDE_CONFIG_DIR`, which starts empty, so the entry goes there and the account's own
/// store is never touched. `account_source` is the credential source of the account the capacity layer leased:
/// a private home carries THAT account's login, so the decision is read from that account's own store.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TrustStores {
    pub root: PathBuf,
    pub target: PathBuf,
}

pub fn trust_store_paths(
    trust_store: &Value,
    full_env: &Env,
    worker_env: Option<&Env>,
    account_source: Option<&Value>,
    home_dir: &Path,
) -> TrustStores {
    let kind = trust_store
        .get("kind")
        .and_then(Value::as_str)
        .unwrap_or("");
    let declared = trust_store
        .get("path")
        .and_then(Value::as_str)
        .map(PathBuf::from);
    let differs = |name: &str| {
        worker_env
            .and_then(|e| e.get(name))
            .is_some_and(|w| !w.is_empty() && Some(w) != full_env.get(name))
    };
    let leased = |source_kind: &str| {
        account_source
            .filter(|s| s.get("kind").and_then(Value::as_str) == Some(source_kind))
            .and_then(|s| s.get("home").and_then(Value::as_str))
            .and_then(|h| fgos_execution::accounts::expand_credential_home(h, home_dir.to_str()))
            .map(PathBuf::from)
    };
    match kind {
        "codex-toml" => {
            let own = differs("CODEX_HOME");
            let base = if own { leased("codex-home") } else { None }
                .or_else(|| full_env.get("CODEX_HOME").map(PathBuf::from))
                .unwrap_or_else(|| home_dir.join(".codex"));
            let real = declared.unwrap_or_else(|| base.join("config.toml"));
            let target = if own {
                Path::new(&worker_env.unwrap()["CODEX_HOME"]).join("config.toml")
            } else {
                real.clone()
            };
            TrustStores { root: real, target }
        }
        "agy" | "agy-json" => {
            let own = differs("HOME");
            let base = if own { leased("home-files") } else { None }
                .or_else(|| full_env.get("HOME").map(PathBuf::from))
                .unwrap_or_else(|| home_dir.to_path_buf());
            let real = declared.unwrap_or_else(|| default_agy_settings_path(&base));
            let target = if own {
                default_agy_settings_path(Path::new(&worker_env.unwrap()["HOME"]))
            } else {
                real.clone()
            };
            TrustStores { root: real, target }
        }
        _ => {
            let real = operator_claude_store_path(
                declared.as_deref(),
                full_env.get("CLAUDE_CONFIG_DIR").map(String::as_str),
                home_dir,
            );
            let target = if differs("CLAUDE_CONFIG_DIR") {
                Path::new(&worker_env.unwrap()["CLAUDE_CONFIG_DIR"]).join(".claude.json")
            } else {
                real.clone()
            };
            TrustStores { root: real, target }
        }
    }
}

/// What a trust seed is told: the workspace, the repo it derives trust from, the environments, and the
/// directories the agent is granted beyond the workspace.
pub struct TrustSeed<'a> {
    pub trust_store: &'a Value,
    pub cwd: &'a Path,
    pub repo_root: Option<&'a Path>,
    pub full_env: &'a Env,
    pub worker_env: Option<&'a Env>,
    pub account_source: Option<&'a Value>,
    pub also_trust: &'a [String],
}

/// Pre-trust the workspace, or the agent stops at a folder-trust dialog with nobody there to answer it. Never
/// fails: refusing here would be worse than trying, since the agent may already be trusted by another route and
/// the dialog it might still hit is reported by name by the very next step.
pub fn seed_workspace_trust(
    round: &mut Round<'_>,
    seed: &TrustSeed<'_>,
    effects: &RoundEffects<'_>,
) {
    let kind = seed
        .trust_store
        .get("kind")
        .and_then(Value::as_str)
        .unwrap_or("");
    let stores = trust_store_paths(
        seed.trust_store,
        seed.full_env,
        seed.worker_env,
        seed.account_source,
        &effects.home_dir,
    );
    // Only into a private home: every run directory is unique and a claude entry is never taken back, so in the
    // person's own store each run would leave a permanent entry.
    let granted: &[String] = if stores.target != stores.root {
        seed.also_trust
    } else {
        &[]
    };
    if !seed.also_trust.is_empty() && granted.is_empty() {
        round.note(json!({ "trustSkipped": "add-dir", "dirs": seed.also_trust }));
    }
    let dirs = std::iter::once(seed.cwd.to_path_buf()).chain(granted.iter().map(PathBuf::from));
    for dir in dirs {
        let project = absolute(&dir);
        let project_text = project.to_string_lossy().into_owned();
        let default_repo = project
            .parent()
            .unwrap_or(&project)
            .to_string_lossy()
            .into_owned();
        let repo = seed
            .repo_root
            .map_or(default_repo, |r| r.to_string_lossy().into_owned());
        let mut first_error: Option<String> = None;
        let mut seeded = false;
        for root in trust_roots(&project, &repo) {
            let wrote = match kind {
                "codex-toml" => {
                    seed_codex_trust(&stores.target, &project_text, &root, Some(&stores.root))
                        .inspect(|_| {
                            // Only into a worker's own private home: hook trust is never written to the real config.
                            if stores.target != stores.root {
                                seed_hook_trust(round, &stores, &project_text, &root);
                            }
                        })
                }
                "agy" | "agy-json" => {
                    seed_agy_trust(&stores.target, &project_text, &root, Some(&stores.root))
                }
                _ if stores.target != stores.root => {
                    seed_claude_config_trust(&stores.target, &project_text, &root, &stores.root)
                }
                _ => seed_trust(&stores.target, &project_text, &root),
            };
            match wrote {
                Ok(wrote) => {
                    // A seed that finds the entry already there wrote nothing: the person (or an earlier round)
                    // owns it, so this round must not remove it on teardown.
                    if wrote {
                        round.trust_written = round.trust_written || removable_trust_kind(kind);
                        round.note(json!({ "trustSeeded": kind }));
                    }
                    seeded = true;
                    break;
                }
                Err(err) => {
                    first_error.get_or_insert(err.to_string());
                }
            }
        }
        if !seeded {
            round.note(json!({
                "trustSeedFailed": first_error.unwrap_or_else(|| "no trust root to derive from".into())
            }));
        }
    }
}

/// codex hook review is a second dialog after folder trust; seed it from the same trusted root. A failure is
/// noted and the review it would have cleared is reported by name.
fn seed_hook_trust(round: &Round<'_>, stores: &TrustStores, project: &str, repo: &str) {
    match seed_codex_hook_trust(
        &stores.target,
        project,
        repo,
        Some(&stores.root),
        std::env::consts::OS,
    ) {
        Ok(done) => {
            if !done.keys.is_empty() {
                round.note(json!({ "hookTrustSeeded": done.keys.len() }));
            }
            if !done.skipped.is_empty() {
                let skipped: Vec<String> = done
                    .skipped
                    .iter()
                    .map(|s| format!("{} ({})", s.key, s.reason))
                    .collect();
                round.note(json!({ "hookTrustSkipped": skipped }));
            }
        }
        Err(err) => round.note(json!({ "hookTrustSeedFailed": err.to_string() })),
    }
}

/// A bypass launch of claude stops at a one-time acceptance screen unless its config directory says it was
/// accepted. Written only into a private config directory (never the operator's own), merged into what is there.
/// An unreadable settings file refuses the launch by name: guessing over it could drop the person's own settings.
pub fn seed_bypass_acceptance(
    permission_mode: Option<&str>,
    trust_store: Option<&Value>,
    round: &Round<'_>,
    full_env: &Env,
    attempt_env: Option<&Env>,
) -> Result<(), DispatchError> {
    let is_claude = trust_store
        .and_then(|t| t.get("kind"))
        .and_then(Value::as_str)
        == Some("claude-json");
    if permission_mode != Some("bypass") || !is_claude {
        return Ok(());
    }
    let dir = attempt_env
        .and_then(|e| e.get("CLAUDE_CONFIG_DIR"))
        .filter(|d| !d.is_empty());
    let Some(dir) = dir.filter(|d| Some(*d) != full_env.get("CLAUDE_CONFIG_DIR")) else {
        round.note(json!({ "bypassAcceptanceSkipped": "no-private-config-dir" }));
        return Ok(());
    };
    let dir = Path::new(dir);
    let file = dir.join("settings.json");
    let mut current = Map::new();
    match fs::read_to_string(&file) {
        Ok(text) => match serde_json::from_str::<Value>(&text) {
            Ok(Value::Object(map)) => current = map,
            Ok(_) => return Err(unseedable(round, &file, "not an object")),
            Err(err) => return Err(unseedable(round, &file, &err.to_string())),
        },
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => {}
        Err(err) => return Err(unseedable(round, &file, &err.to_string())),
    }
    let _ = fs::create_dir_all(dir);
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = fs::set_permissions(dir, fs::Permissions::from_mode(0o700));
    }
    current.insert(BYPASS_ACCEPTANCE_SETTINGS.into(), json!(true));
    let mut text = serde_json::to_string_pretty(&Value::Object(current)).unwrap_or_default();
    text.push('\n');
    fgos_durable_file::replace_durably_with_mode(dir, "settings.json", text.as_bytes(), 0o600)
        .map_err(|err| unseedable(round, &file, &err.to_string()))?;
    Ok(())
}

fn unseedable(round: &Round<'_>, file: &Path, why: &str) -> DispatchError {
    round.fail(
        "invalid-config",
        "bypass-acceptance-unseedable",
        format!(
            "{} cannot be merged with the bypass acceptance: {why}",
            file.display()
        ),
    )
}

/// What typed at the agent: `inline` types the whole brief so a person watching the pane sees it; `file-pointer`
/// types a one-line pointer to `brief-<round>.md`. The text goes to a file the supervisor reads, so the same bytes
/// reach the agent whoever delivers them.
pub fn write_typed_brief(
    delivery: &str,
    run_dir: &Path,
    round_number: u64,
    paths: &BriefPaths,
) -> std::io::Result<String> {
    if delivery != "file-pointer" {
        return Ok(paths.brief_path.clone());
    }
    let typed = run_dir.join(format!("brief-{round_number}.pointer.txt"));
    fs::write(
        &typed,
        render_pointer(&run_dir.to_string_lossy(), round_number),
    )?;
    Ok(typed.to_string_lossy().into_owned())
}

/// The folder-trust entry for this attempt, and the record `cleanup_trust` needs to take a codex or agy entry
/// back when the attempt is over. The record exists only when this call wrote such an entry.
fn seed_attempt_trust(
    round: &mut Round<'_>,
    run_dir: &Path,
    seed: &TrustSeed<'_>,
    effects: &RoundEffects<'_>,
) {
    seed_workspace_trust(round, seed, effects);
    if !round.trust_written {
        return;
    }
    let target = trust_store_paths(
        seed.trust_store,
        seed.full_env,
        seed.worker_env,
        None,
        &effects.home_dir,
    )
    .target;
    let kind = seed.trust_store.get("kind").cloned().unwrap_or(Value::Null);
    let _ = publish_mutable_projection(
        &run_dir.join(trust_context_file()),
        &json!({
            "v": 1, "kind": kind, "target": target.to_string_lossy(),
            "projectPath": absolute(seed.cwd).to_string_lossy(),
        }),
    );
}

/// What the executor resolved for one seat: the command and environment, the declared confinement and execution
/// posture, and, when the CLI has a folder-trust dialog, where it keeps it.
#[derive(Debug, Clone, Default)]
pub struct SeatBinding {
    pub command: Option<String>,
    pub args: Vec<String>,
    pub env: Env,
    pub confinement: Option<Value>,
    pub permission_mode: Option<String>,
    pub trust_store: Option<Value>,
    pub trust_also: Vec<String>,
    pub trust_account_source: Option<Value>,
}

/// Where a seat is placed: its run directory and working directory, the controller's environment and the
/// herdr binary, the environment the attempt will run with, and what the backend delivers itself.
#[derive(Debug, Clone, Copy)]
pub struct SeatPlace<'a> {
    pub run_dir: &'a Path,
    pub cwd: &'a Path,
    pub repo_root: Option<&'a Path>,
    pub full_env: &'a Env,
    pub herdr_bin: &'a str,
    pub attempt_env: Option<&'a Env>,
    pub delivery: ControlsDelivered,
}

/// A prepared seat. The caller owns what it returns: `worker_home_path` is its to remove, a codex or agy trust
/// entry is taken back by `cleanup_trust`.
#[derive(Debug, Clone, PartialEq)]
pub struct PreparedSeat {
    pub command: Option<String>,
    pub args: Vec<String>,
    pub env: Env,
    pub trust_seeded: bool,
    pub trust_store: Option<TrustStores>,
    pub worker_home_path: Option<PathBuf>,
    pub session_env: Env,
    pub confined: bool,
    pub status: &'static str,
}

/// Prepare an interactive seat from its binding: the private home (and the herdr session) its confinement
/// declares, and the folder-trust entry the agent would otherwise stop at. The one door both a worker attempt and
/// a head session go through, so a seat is confined and trusted the same way whoever places it.
pub fn prepare_seat(
    binding: &SeatBinding,
    place: &SeatPlace<'_>,
    round: &mut Round<'_>,
    effects: &RoundEffects<'_>,
) -> Result<PreparedSeat, DispatchError> {
    let SeatPlace {
        run_dir,
        cwd,
        repo_root,
        full_env,
        herdr_bin,
        attempt_env,
        delivery,
    } = *place;
    let confined = establish_confinement(
        &ConfineSeat {
            confinement: binding.confinement.as_ref(),
            full_env,
            cwd,
            repo_root,
            permission_mode: binding.permission_mode.as_deref(),
            herdr_bin,
            delivery,
        },
        round,
        effects,
    )?;
    seed_bypass_acceptance(
        binding.permission_mode.as_deref(),
        binding.trust_store.as_ref(),
        round,
        full_env,
        attempt_env,
    )?;
    round.note(
        json!({ "confinement": { "status": confined.status, "confined": confined.confined } }),
    );
    // A confined run with a private home needs no seeding: that home is provisioned with the workspace already
    // trusted, so writing to the operator's own store for a directory only the seat will ever see would be pure
    // side effect.
    let trusted = binding.trust_store.is_some() && confined.worker_home_path.is_none();
    let mut stores = None;
    if let (true, Some(store)) = (trusted, binding.trust_store.as_ref()) {
        seed_attempt_trust(
            round,
            run_dir,
            &TrustSeed {
                trust_store: store,
                cwd,
                repo_root,
                full_env,
                worker_env: attempt_env,
                account_source: binding.trust_account_source.as_ref(),
                also_trust: &binding.trust_also,
            },
            effects,
        );
        stores = Some(trust_store_paths(
            store,
            full_env,
            attempt_env,
            None,
            &effects.home_dir,
        ));
    }
    Ok(PreparedSeat {
        command: binding.command.clone(),
        args: binding.args.clone(),
        env: binding.env.clone(),
        trust_seeded: trusted,
        trust_store: stores,
        worker_home_path: confined.worker_home_path,
        session_env: confined.session_env,
        confined: confined.confined,
        status: confined.status,
    })
}

/// Give the pane of `key` back (`close` by default); true when the port answered `retired`.
pub fn retire_pane(host: &SessionHost<'_>, key: &str, disposition: Retirement) -> bool {
    let placement = Placement {
        host: HostKind::Terminal,
        key: key.to_string(),
        display: None,
    };
    matches!(host.retire(&placement, disposition), RetireAnswer::Retired)
}

/// Close the pane of `key` only when it is live now: a pane a settled round already closed is not closed again.
pub fn close_live_pane(host: &SessionHost<'_>, key: &str) -> bool {
    let placement = Placement {
        host: HostKind::Terminal,
        key: key.to_string(),
        display: None,
    };
    if host.alive(&placement).result != fgos_session_host::Liveness::Live {
        return false;
    }
    retire_pane(host, key, Retirement::Close)
}

/// Everything a terminal attempt needs before its supervisor can start.
pub struct TerminalAttempt<'a> {
    pub attempt_id: &'a str,
    pub run_dir: &'a Path,
    pub cwd: &'a Path,
    pub repo_root: Option<&'a Path>,
    pub prompt: &'a str,
    pub work_id: Option<&'a str>,
    pub tier: Option<&'a str>,
    pub model: Option<&'a str>,
    pub run_id: Option<&'a str>,
    pub herdr_bin: &'a str,
    pub full_env: &'a Env,
    pub binding: &'a SeatBinding,
    pub agent_kind: Option<&'a str>,
    /// `inline` (default) or `file-pointer`.
    pub delivery: &'a str,
    pub attempt_env: Option<&'a Env>,
    pub dispatch_batch_key: Option<&'a str>,
    pub dispatch_batch_size: Option<u32>,
    pub anchor_pane_id: Option<&'a str>,
    pub work_label: Option<&'a Value>,
    pub display: Option<Value>,
    pub effective_contract: Option<&'a Value>,
    /// `brief` renders the worker brief around the prompt; `verbatim` types the prompt as it is.
    pub opening: &'a str,
    pub beside: Option<&'a str>,
    pub controls_delivered: ControlsDelivered,
    pub role: Option<&'a str>,
}

/// What the envelope names, the herdr endpoint the supervisor is started with, and what `abandon` needs.
#[derive(Debug, Clone, PartialEq)]
pub struct PreparedAttempt {
    pub brief_path: String,
    pub outbox_dir: String,
    pub result_path: String,
    pub slot_key: String,
    pub group_key: String,
    pub pane_id: Option<String>,
    pub worker_home_path: Option<PathBuf>,
    /// The herdr endpoint the supervisor reaches the pane through (only `HERDR_*` / `FGOS_HERDR_BIN`).
    pub endpoint_env: Env,
    pub display: Value,
    run_dir: PathBuf,
}

impl PreparedAttempt {
    /// What a controller that fails before the handover calls to give back the pane, the credential and the trust
    /// entry. After the handover none of it is the controller's.
    pub fn abandon(&self, host: &SessionHost<'_>) {
        retire_pane(host, &self.slot_key, Retirement::Close);
        abandon_seat(&self.run_dir, self.worker_home_path.as_deref());
    }
}

fn abandon_seat(run_dir: &Path, worker_home: Option<&Path>) {
    let _ = cleanup_trust(run_dir);
    if let Some(home) = worker_home {
        let _ = redact_worker_home(home);
    }
}

/// The `agent name` a run is given: lower-case, `[a-z0-9_-]` only, at most 32 characters (a hash of the rest
/// replaces a longer tail).
pub fn normalize_agent_name(raw: &str, max_length: usize) -> String {
    let lowered = raw.to_lowercase();
    let mut cleaned = String::new();
    let mut gap = false;
    for c in lowered.chars() {
        if c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_' || c == '-' {
            cleaned.push(c);
            gap = false;
        } else if !gap {
            cleaned.push('-');
            gap = true;
        }
    }
    let cleaned = cleaned.trim_matches('-').to_string();
    if cleaned.chars().count() <= max_length {
        return if cleaned.is_empty() {
            "fgos-agent".into()
        } else {
            cleaned
        };
    }
    let hash_len = 8.min(max_length / 2);
    let hash = sha1_hex(cleaned.as_bytes())[..hash_len].to_string();
    let head: String = cleaned.chars().take(max_length - hash_len).collect();
    format!("{head}{hash}")
}

/// SHA-1 as lower-case hex. Only the agent name's short suffix uses it (the name has always carried the first
/// bytes of the SHA-1 of its text, so a name stays the same across the Node and Rust controllers); the workspace
/// has no SHA-1 crate and a name is no security boundary.
fn sha1_hex(data: &[u8]) -> String {
    let mut h: [u32; 5] = [
        0x6745_2301,
        0xEFCD_AB89,
        0x98BA_DCFE,
        0x1032_5476,
        0xC3D2_E1F0,
    ];
    let mut message = data.to_vec();
    message.push(0x80);
    while message.len() % 64 != 56 {
        message.push(0);
    }
    message.extend_from_slice(&((data.len() as u64) * 8).to_be_bytes());
    for block in message.chunks(64) {
        let mut w = [0u32; 80];
        for (i, word) in block.chunks(4).enumerate() {
            w[i] = u32::from_be_bytes([word[0], word[1], word[2], word[3]]);
        }
        for i in 16..80 {
            w[i] = (w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16]).rotate_left(1);
        }
        let [mut a, mut b, mut c, mut d, mut e] = h;
        for (i, word) in w.iter().enumerate() {
            let (f, k) = match i {
                0..=19 => ((b & c) | (!b & d), 0x5A82_7999),
                20..=39 => (b ^ c ^ d, 0x6ED9_EBA1),
                40..=59 => ((b & c) | (b & d) | (c & d), 0x8F1B_BCDC),
                _ => (b ^ c ^ d, 0xCA62_C1D6),
            };
            let next = a
                .rotate_left(5)
                .wrapping_add(f)
                .wrapping_add(e)
                .wrapping_add(k)
                .wrapping_add(*word);
            e = d;
            d = c;
            c = b.rotate_left(30);
            b = a;
            a = next;
        }
        for (slot, add) in h.iter_mut().zip([a, b, c, d, e]) {
            *slot = slot.wrapping_add(add);
        }
    }
    h.iter().map(|word| format!("{word:08x}")).collect()
}

/// Everything a terminal attempt needs before its supervisor can start, in the order that makes every failure
/// leave nothing behind but the pane's key: the stale-result check, the brief, the confinement homes, the pane,
/// the trust entry. `before_allocate({key, group_key}, endpoint_env)` is called right before the pane is
/// allocated so a controller killed from there on leaves a record naming the pane to give back.
pub fn prepare_terminal_attempt(
    attempt: &TerminalAttempt<'_>,
    host: &SessionHost<'_>,
    panes: &dyn RoundPanes,
    before_allocate: &mut dyn FnMut(&str, &str, &Env),
    effects: &RoundEffects<'_>,
) -> Result<PreparedAttempt, DispatchError> {
    let round_number = 1u64;
    let run_dir = absolute(attempt.run_dir);
    let paths = brief_paths(&run_dir.to_string_lossy(), round_number);
    let work = attempt.work_id.unwrap_or("undefined");

    // The key is the attempt id itself: the supervisor addresses the pane by it, and a key the port would rewrite
    // could never be found again.
    let key = port_key(Some(attempt.attempt_id), "terminal");
    let early = |reason: &str, message: String| {
        DispatchError::new("invalid-config", message)
            .with("workId", json!(attempt.work_id))
            .with("tier", json!(attempt.tier))
            .with("model", json!(attempt.model))
            .with("reason", json!(reason))
            .with("runDir", json!(run_dir.to_string_lossy()))
    };
    if key != attempt.attempt_id {
        return Err(early(
            "terminal-key-invalid",
            format!(
                "attempt id \"{}\" is not usable as a terminal key",
                attempt.attempt_id
            ),
        ));
    }
    fs::create_dir_all(&paths.outbox).map_err(|e| early("outbox-unwritable", e.to_string()))?;
    // A run directory that already holds this round's result would settle the attempt before the agent just
    // briefed has done anything.
    if fs::symlink_metadata(&paths.result_path).is_ok() {
        return Err(early(
            "stale-result-in-run-dir",
            format!(
                "executor for work \"{work}\" refused: {} already exists before this round started, so the attempt would settle on somebody else's result. Use a fresh run directory or a new round.",
                paths.result_path
            ),
        )
        .with("resultPath", json!(paths.result_path)));
    }

    let agent_name = normalize_agent_name(
        &format!(
            "fgos-{}-{}",
            attempt.run_id.or(attempt.work_id).unwrap_or("run"),
            attempt.attempt_id
        ),
        32,
    );
    let mut round = Round::open(
        &run_dir,
        attempt.work_id,
        attempt.tier,
        attempt.model,
        &agent_name,
        effects.now_iso,
    );
    round.terminal_key = Some(key.clone());

    let contract = attempt.effective_contract.map(|raw| {
        let mut contract = raw.clone();
        let claim = match raw.get("resultClaim") {
            Some(Value::Object(claim)) => {
                let mut claim = claim.clone();
                claim.insert("path".into(), json!(paths.result_path));
                Value::Object(claim)
            }
            _ => {
                json!({ "path": paths.result_path, "schema": "agent-result.v1", "required": true })
            }
        };
        contract["resultClaim"] = claim;
        contract
    });
    // `verbatim`: a session attempt's opening is typed as it is, with no result claim or outbox words around it.
    let brief_text = if attempt.opening == "verbatim" {
        attempt.prompt.to_string()
    } else {
        render_brief(
            attempt.prompt,
            round_number,
            &run_dir.to_string_lossy(),
            Some(&agent_name),
            contract.as_ref(),
            (effects.now_ms)(),
            effects.local_offset_seconds,
        )
    };
    fs::write(&paths.brief_path, &brief_text)
        .map_err(|e| early("brief-unwritable", e.to_string()))?;
    if let Some(contract) = &contract {
        if Path::new(&paths.effective_execution_contract_path).exists() {
            // The brief already names the claim path, so a failed projection costs nothing.
            let _ = publish_mutable_projection(
                Path::new(&paths.effective_execution_contract_path),
                contract,
            );
        }
    }
    let brief_path = write_typed_brief(attempt.delivery, &run_dir, round_number, &paths)
        .map_err(|e| early("brief-unwritable", e.to_string()))?;
    round.note(json!({ "status": "requested", "agentName": agent_name, "round": round_number, "terminalKey": key }));

    let seat = prepare_seat(
        &SeatBinding {
            command: None,
            args: Vec::new(),
            env: Env::new(),
            ..attempt.binding.clone()
        },
        &SeatPlace {
            run_dir: &run_dir,
            cwd: attempt.cwd,
            repo_root: attempt.repo_root,
            full_env: attempt.full_env,
            herdr_bin: attempt.herdr_bin,
            attempt_env: attempt.attempt_env,
            delivery: attempt.controls_delivered,
        },
        &mut round,
        effects,
    )?;
    // The seat's trust entry and private home exist from here on: a failure anywhere before the handover gives
    // them back.
    let group_key = port_key(
        Some(
            attempt
                .dispatch_batch_key
                .or(attempt.run_id)
                .or(attempt.work_id)
                .unwrap_or(&key),
        ),
        &key,
    );
    round.herdr_session = seat.session_env.get("HERDR_SESSION").cloned();
    if let Some(session) = &round.herdr_session {
        round.note(json!({ "herdrSession": session }));
    }
    let session_map: Map<String, Value> = seat
        .session_env
        .iter()
        .map(|(k, v)| (k.clone(), json!(v)))
        .collect();
    let mut endpoint_env = Env::new();
    if !attempt.herdr_bin.is_empty() {
        endpoint_env.insert("FGOS_HERDR_BIN".into(), attempt.herdr_bin.to_string());
    }
    for (name, value) in herdr_endpoint_env(&session_map) {
        if let Some(text) = value.as_str() {
            endpoint_env.insert(name, text.to_string());
        }
    }
    let display = attempt.display.clone().unwrap_or_else(|| {
        let mut fields = attempt.work_label.cloned().unwrap_or_else(|| json!({}));
        fields["agent"] = json!(attempt.agent_kind);
        fields["model"] = json!(attempt.model);
        fields["role"] = json!(attempt.role);
        crate::transport::terminal_slot::slot_display(&fields)
    });

    let mut open_pane = || -> Result<Option<String>, DispatchError> {
        // A pane already sitting in the caller's own tab joins the group, so the batch opens beside it. A pane
        // that cannot be taken is no anchor: the group simply opens its own tab.
        if let Some(anchor) = attempt.anchor_pane_id {
            let anchor_key = port_key(Some(&format!("anchor-{group_key}")), "anchor");
            let _ = panes.attach(&anchor_key, anchor, &group_key, &display);
        }
        before_allocate(&key, &group_key, &endpoint_env);
        let group_size = attempt.dispatch_batch_size.filter(|n| *n > 1);
        let request = OpenRequest {
            host: HostKind::Terminal,
            key: key.clone(),
            group_key: Some(group_key.clone()),
            beside: attempt.beside.map(String::from),
            group_size,
            cwd: attempt.cwd.to_string_lossy().into_owned(),
            env: BTreeMap::new(),
            display: Some(display.clone()),
        };
        match host.open(&request) {
            OpenAnswer::Opened { slot, .. } => Ok(slot.map(|s| s.pane_id)),
            OpenAnswer::Refused(refusal) => {
                let view = RefusalView {
                    result: if matches!(refusal.result, fgos_session_host::RefusalKind::Unsupported)
                    {
                        "unsupported"
                    } else {
                        "unknown"
                    },
                    reason: None,
                    detail: refusal.detail.as_deref(),
                    capability: refusal.capability.as_deref(),
                };
                let err = refusal_error(view, &format!("open {key}"));
                let reason = if err.code == "terminal_unknown" {
                    "pane_split_failed".to_string()
                } else {
                    err.code.clone()
                };
                Err(round.fail(
                    "worker-spawn-fail",
                    &reason,
                    format!(
                        "executor failed to start for work \"{work}\": terminal-control could not open a pane ({}): {}",
                        err.code, err.message
                    ),
                ))
            }
        }
    };
    let opened = open_pane();
    let pane_id = match opened {
        Ok(pane) => pane,
        Err(err) => {
            retire_pane(host, &key, Retirement::Close);
            abandon_seat(&run_dir, seat.worker_home_path.as_deref());
            return Err(err);
        }
    };
    round.pane_id = pane_id.clone();
    round.note(json!({ "status": "pane-created", "paneId": pane_id }));
    // One line so a person watching the controller's stderr can find the pane and the directory.
    (effects.diagnostic)(&format!(
        "fgos: herdr-spawn work={work} pane={} agent={agent_name} runDir={}",
        pane_id.as_deref().unwrap_or("null"),
        run_dir.display()
    ));

    Ok(PreparedAttempt {
        brief_path,
        outbox_dir: paths.outbox,
        result_path: paths.result_path,
        slot_key: key,
        group_key,
        pane_id,
        worker_home_path: seat.worker_home_path,
        endpoint_env,
        display,
        run_dir,
    })
}

/// Lines of `next` that `previous` did not already show: the screen scrolled, so the overlap is the longest tail
/// of `previous` that opens `next`.
pub fn screen_delta(previous: &str, next: &str) -> String {
    let before: Vec<&str> = previous.split('\n').collect();
    let after: Vec<&str> = next.split('\n').collect();
    for overlap in (1..=before.len().min(after.len())).rev() {
        if before[before.len() - overlap..] == after[..overlap] {
            return after[overlap..].join("\n");
        }
    }
    after.join("\n")
}

/// Stops a screen follow when dropped or when `stop` is called.
pub struct ScreenFollow {
    stopped: Arc<AtomicBool>,
}

impl ScreenFollow {
    pub fn stop(&self) {
        self.stopped.store(true, Ordering::SeqCst);
    }
}

impl Drop for ScreenFollow {
    fn drop(&mut self) {
        self.stop();
    }
}

/// Reads the pane's visible screen; an error means it cannot be read now.
pub type ScreenReader = Box<dyn Fn() -> Result<String, String> + Send>;

/// Receives `(stream, text)` of what the pane newly showed.
pub type ChunkSink = Box<dyn FnMut(&str, &str) + Send>;

/// Show a person who watches the controller what the pane shows, from the moment the attempt is bound until
/// `stop()`. Display only: a screen that cannot be read is skipped, and nothing is concluded from it.
pub fn follow_pane_screen(
    read_visible: ScreenReader,
    mut on_chunk: ChunkSink,
    interval: Option<Duration>,
) -> ScreenFollow {
    let stopped = Arc::new(AtomicBool::new(false));
    let flag = stopped.clone();
    let interval = interval.unwrap_or(Duration::from_millis(SCREEN_FOLLOW_MS));
    std::thread::spawn(move || {
        let mut previous = String::new();
        loop {
            std::thread::sleep(interval);
            if flag.load(Ordering::SeqCst) {
                return;
            }
            let Ok(screen) = read_visible() else { continue };
            let delta = screen_delta(&previous, &screen);
            previous = screen;
            let delta = delta.trim_end();
            if !delta.trim().is_empty() {
                on_chunk("stdout", &format!("{delta}\n"));
            }
        }
    });
    ScreenFollow { stopped }
}
