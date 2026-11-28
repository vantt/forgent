//! The supervision verbs as processes: `watcher tick`, `supervisor wake|plans|queue|handled|done`, `land`, `slots`,
//! the confined call of a contract verb through a request socket, and the three supervision doctor rows. Every
//! rule behind a verb (detection, the queue, the wake rule, the landing, the lane view) is owned by the
//! `fgos-supervision` and run-supervisor crates; this file proves the wiring of the binary over them, on a real
//! repository with a bare remote and a private state root.
#![cfg(target_os = "linux")]

use serde_json::Value;
use sha2::{Digest, Sha256};
use std::fs;
use std::io::{Read, Write};
use std::os::unix::fs::PermissionsExt;
use std::os::unix::net::UnixListener;
use std::path::{Path, PathBuf};
use std::process::{Command, Output, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};

fn fgos_bin() -> PathBuf {
    PathBuf::from(env!("CARGO_BIN_EXE_fgos"))
}

const SESSION: &str = "00000000-0000-4000-8000-0000000000bb";
const PROJECT_ID: &str = "0123456789abcdef0123456789abcdef";
const PLAN: &str = "260101-0000-demo";
const DEFINITION: &str = "defs/discussion-settled.query.json";

fn git(dir: &Path, args: &[&str]) -> String {
    let out = Command::new("git")
        .arg("-C")
        .arg(dir)
        .args(["-c", "user.name=t", "-c", "user.email=t@example.invalid"])
        .args(args)
        .env("GIT_CONFIG_GLOBAL", "/dev/null")
        .env("GIT_CONFIG_NOSYSTEM", "1")
        .output()
        .unwrap();
    assert!(out.status.success(), "git {args:?}: {out:?}");
    String::from_utf8(out.stdout).unwrap().trim().to_owned()
}

fn digest(bytes: &[u8]) -> String {
    format!("sha256:{:x}", Sha256::digest(bytes))
}

/// The legacy payload of the release: one script that appends the arguments it was run with to `calls.log`, so a
/// verb the host hands to Node (`session start`) is seen with its argv and nothing else runs.
const RECORDING_ENTRY: &str = r#"
import fs from 'node:fs';
fs.appendFileSync(process.env.SUPERVISION_CALLS, JSON.stringify(process.argv.slice(2)) + '\n');
const args = process.argv.slice(2);
if (args[0] === 'session' && args[1] === 'stop') {
  // The host's answer to a stop; a test writes `stop-answer.json` beside the log to have the stop declined.
  const file = process.env.SUPERVISION_CALLS.replace(/calls\.log$/, 'stop-answer.json');
  const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { stopped: true };
  process.stdout.write(JSON.stringify({ data }) + '\n');
} else {
  process.stdout.write('{"started":true}\n');
}
"#;

fn release(root: &Path) {
    let dir = root.join("release");
    fs::create_dir_all(dir.join("bin")).unwrap();
    fs::write(dir.join("bin/fgos.mjs"), RECORDING_ENTRY).unwrap();
    let entry = RECORDING_ENTRY.as_bytes();
    let mut manifest = serde_json::json!({
        "schemaVersion": 1,
        "entries": { "fgos": "target/debug/fgos" },
        "components": { "legacyNode": { "root": ".", "entry": "bin/fgos.mjs", "digest": digest(entry) } },
        "requires": { "node": ">=18" },
        "target": { "os": "linux", "arch": "x64" },
        "stateSchemas": { "read": ["2"], "write": ["2"], "migrations": [] },
        "files": [serde_json::json!({
            "path": "bin/fgos.mjs", "kind": "file", "digest": digest(entry), "mode": "755", "class": "legacy-node",
        })],
    });
    let canonical = fgos_distribution::verify::to_canonical_json(&manifest);
    manifest["artifactDigest"] = serde_json::json!(digest(canonical.as_bytes()));
    fs::write(
        dir.join("manifest.json"),
        serde_json::to_string_pretty(&manifest).unwrap(),
    )
    .unwrap();
}

/// A project clone of a bare remote, with a plan, a settled discussion and the project id on the trunk, a private
/// state root and the release above.
struct Scene {
    root: PathBuf,
}

impl Scene {
    fn new(tag: &str, config: &str) -> Self {
        Self::build(tag, config, None)
    }

    /// A second machine's clone of the same bare remote: its own state root and machine id, no seed commit.
    fn clone_of(first: &Scene, tag: &str, config: &str) -> Self {
        Self::build(tag, config, Some(first.root.join("remote.git")))
    }

    fn build(tag: &str, config: &str, remote: Option<PathBuf>) -> Self {
        static NEXT: AtomicU64 = AtomicU64::new(0);
        let root = std::env::temp_dir().join(format!(
            "fgos-supervision-verbs-{tag}-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed),
        ));
        let _ = fs::remove_dir_all(&root);
        fs::create_dir_all(root.join("home")).unwrap();
        fs::create_dir_all(root.join("state")).unwrap();
        let root = fs::canonicalize(root).unwrap();
        let seeded = remote.is_none();
        match &remote {
            None => {
                git(
                    &root,
                    &[
                        "init",
                        "-q",
                        "--bare",
                        "--initial-branch=main",
                        "remote.git",
                    ],
                );
                git(&root, &["clone", "-q", "remote.git", "project"]);
            }
            Some(url) => {
                git(&root, &["clone", "-q", url.to_str().unwrap(), "project"]);
            }
        }
        let project = root.join("project");
        if seeded {
            git(&project, &["checkout", "-q", "-b", "main"]);
        }
        git(&project, &["config", "fgos.machineid", &format!("m-{tag}")]);
        // The Land port merges in a candidate checkout, which needs an author.
        git(&project, &["config", "user.name", "t"]);
        git(&project, &["config", "user.email", "t@example.invalid"]);
        if seeded {
            Self::seed(&project);
        }
        Self::fixture(&root, &project, config);
        release(&root);
        Self { root }
    }

    /// The first commit of the shared remote: the plan, a settled discussion and the project id.
    fn seed(project: &Path) {
        fs::create_dir_all(project.join(format!("plans/{PLAN}"))).unwrap();
        fs::write(
            project.join(format!("plans/{PLAN}/plan.md")),
            "---\ncontract: plan-v1\ntitle: demo\nstatus: ready\npriority: P2\nfootprint:\n  - src/**\ncreated: 2026-01-01\n---\n\n# Demo\n\n| id | title | dependson | footprint | wave | status |\n|---|---|---|---|---|---|\n| 1 | one | - | `src/**` | 1 | ready |\n",
        )
        .unwrap();
        fs::create_dir_all(project.join("plans/discussions/ds-aaaaaaaaaa-demo")).unwrap();
        fs::write(
            project.join("plans/discussions/ds-aaaaaaaaaa-demo/DISCUSSION.md"),
            "discussion: settled\n\n# Demo\n",
        )
        .unwrap();
        fs::create_dir_all(project.join(".fgos")).unwrap();
        fs::write(
            project.join(".fgos/project.json"),
            format!(
                "{{\"v\":1,\"projectId\":\"{PROJECT_ID}\",\"handle\":\"demo\",\"createdAt\":\"2026-01-01T00:00:00Z\"}}\n"
            ),
        )
        .unwrap();
        fs::write(project.join("src.txt"), "base\n").unwrap();
        git(&project, &["add", "-f", "."]);
        git(&project, &["commit", "-q", "-m", "init"]);
        git(&project, &["push", "-q", "-u", "origin", "main"]);
        git(project, &["remote", "set-head", "origin", "main"]);
    }

    /// What every clone holds beside the tracked files: fence, state root, machine id, definitions, config.
    fn fixture(root: &Path, project: &Path, config: &str) {
        // What an initialised project holds before its first append.
        let fence = project.join(".fgos/locks/activation.lock");
        fs::create_dir_all(&fence).unwrap();
        fs::write(
            fence.join("TOMBSTONE"),
            "{\"at\":\"fixture\",\"v\":1,\"lock\":\"activation\",\"by\":\"fgos git\"}\n",
        )
        .unwrap();
        let locks = project.join(".git/fgos/events/locks");
        fs::create_dir_all(&locks).unwrap();
        for dir in [root.join("state"), project.join(".git/fgos"), locks] {
            fs::set_permissions(dir, fs::Permissions::from_mode(0o700)).unwrap();
        }
        fgos_identity::machine::mint_here(&root.join("state")).unwrap();
        // The detection definition and the pace file, untracked beside the project.
        fs::create_dir_all(project.join("defs")).unwrap();
        let repo = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
        fs::copy(
            repo.join("core/watcher/definitions/discussion-settled.query.json"),
            project.join(DEFINITION),
        )
        .unwrap();
        fs::create_dir_all(project.join("core/watcher/pace")).unwrap();
        fs::copy(
            repo.join("core/watcher/pace/watcher-active.query.json"),
            project.join("core/watcher/pace/watcher-active.query.json"),
        )
        .unwrap();
        fs::write(project.join(".fgos/config.yaml"), config).unwrap();
        // The fixture files the verbs read are not changes a landing should find in the main checkout.
        fs::write(
            project.join(".git/info/exclude"),
            "defs/\ncore/\n.fgos/config.yaml\n.fgos/locks/\n.fgos/runtime/\n.fgos/observe/\n",
        )
        .unwrap();
    }

    fn project(&self) -> PathBuf {
        self.root.join("project")
    }

    /// The machine-level config (`watcher.enabled` belongs to the machine, never to a project).
    fn set_global(&self, config: &str) {
        let dir = self.root.join("home/.fgos");
        fs::create_dir_all(&dir).unwrap();
        fs::set_permissions(&dir, fs::Permissions::from_mode(0o700)).unwrap();
        fs::write(dir.join("config.yaml"), config).unwrap();
        fs::set_permissions(dir.join("config.yaml"), fs::Permissions::from_mode(0o600)).unwrap();
    }

    fn command(&self, args: &[&str]) -> Command {
        let mut cmd = Command::new(fgos_bin());
        cmd.current_dir(self.project())
            .env_clear()
            .env("HOME", self.root.join("home"))
            .env("PATH", std::env::var_os("PATH").unwrap_or_default())
            .env("FGOS_STATE_ROOT", self.root.join("state"))
            .env("FGOS_SESSION_ID", SESSION)
            .env("FGOS_ACTIVE_RELEASE_PATH", self.root.join("release"))
            .env("SUPERVISION_CALLS", self.root.join("calls.log"))
            .args(args)
            .stdin(Stdio::null());
        cmd
    }

    fn run(&self, args: &[&str]) -> Output {
        self.command(args).output().unwrap()
    }

    /// The `data` of a verb that answered, as `--json` prints it.
    fn data(&self, args: &[&str]) -> Value {
        let out = self.run(args);
        assert!(out.status.success(), "{args:?}: {out:?}");
        let parsed: Value = serde_json::from_slice(&out.stdout)
            .unwrap_or_else(|e| panic!("{args:?}: {e}: {}", text(&out)));
        parsed["data"].clone()
    }

    /// The argv lines the recording payload saw.
    fn payload_calls(&self) -> Vec<Value> {
        fs::read_to_string(self.root.join("calls.log"))
            .unwrap_or_default()
            .lines()
            .map(|l| serde_json::from_str(l).unwrap())
            .collect()
    }
}

impl Drop for Scene {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.root);
    }
}

fn text(out: &Output) -> String {
    format!(
        "stdout: {} stderr: {}",
        String::from_utf8_lossy(&out.stdout),
        String::from_utf8_lossy(&out.stderr)
    )
}

/// The config of a project whose watcher runs the one local definition, takes no action on a raised row, and ticks
/// in full on every call (the idle interval is the shortest the schema allows).
const WATCHER_CONFIG: &str = "# @fgos:v1\nwatcher:\n  idleIntervalSec: 1\n  definitions:\n    - defs/discussion-settled.query.json\n  defaultAction: none\nland:\n  gates:\n    - run: \"true\"\n";

/// The machine config that switches the watcher on.
const WATCHER_ON: &str = "# @fgos:v1\nwatcher:\n  enabled: true\n";

/// The one tick that raises the settled discussion; returns its report.
fn first_tick(scene: &Scene) -> Value {
    scene.data(&["watcher", "tick", "--json"])
}

#[test]
fn a_tick_raises_a_detected_row_once_and_a_second_full_tick_finds_it_a_duplicate() {
    let scene = Scene::new("tick", WATCHER_CONFIG);
    let first = first_tick(&scene);
    assert_eq!(first["raised"], 1, "{first}");
    assert_eq!(first["mode"], "active", "{first}");
    std::thread::sleep(std::time::Duration::from_millis(1200));
    let second = scene.data(&["watcher", "tick", "--json"]);
    assert_eq!(second["raised"], 0, "{second}");
    assert_eq!(second["duplicate"], 1, "{second}");

    // Each tick wrote its span through the Observe door: the declared kind answers a query with both.
    let spans = scene.data(&["metrics", "query", "--kind", "fgos.watcher.tick", "--json"]);
    assert_eq!(spans["rows"][0]["count"], 2, "{spans}");
}

#[test]
fn an_active_project_runs_a_full_tick_inside_the_idle_interval() {
    // Long idle interval: only the pace definition's answer can make the second tick a full one. The pace
    // definition here counts the first tick's own span, so it answers one group without a `row` template.
    let config = WATCHER_CONFIG.replace("idleIntervalSec: 1", "idleIntervalSec: 3600");
    let scene = Scene::new("active", &config);
    fs::write(
        scene
            .project()
            .join("core/watcher/pace/watcher-active.query.json"),
        r#"{"name":"watcher-active","requires":["fgos.watcher.tick"],"query":{"kind":["fgos.watcher.tick"],"agg":["count"]}}"#,
    )
    .unwrap();
    first_tick(&scene);
    let second = scene.data(&["watcher", "tick", "--json"]);
    assert_eq!(second["mode"], "active", "{second}");
    assert_eq!(second["duplicate"], 1, "{second}");
}

#[test]
fn a_row_routed_to_notify_runs_the_mailbox_verb_and_is_counted_as_a_notify_or_an_error() {
    let config = WATCHER_CONFIG.replace(
        "  defaultAction: none\n",
        "  defaultAction: none\n  actions:\n    discussion-settled: notify\n  notifyTo: someone\n",
    );
    let scene = Scene::new("notify", &config);
    let report = first_tick(&scene);
    assert_eq!(report["raised"], 1, "{report}");
    // The row's own action is a notify, which the real mailbox verb answers sent or refused; the wake that every
    // tick with an unhandled event runs is not that action.
    let notified = report["notifies"].as_u64().unwrap();
    assert!(notified <= 1, "{report}");
    assert_eq!(report["wakes"], 1, "{report}");
    if notified == 0 {
        assert!(report["errors"].as_u64().unwrap() >= 1, "{report}");
    }
}

#[test]
fn the_queue_lists_the_raised_event_and_done_refuses_until_it_is_handled() {
    let scene = Scene::new("queue", WATCHER_CONFIG);
    first_tick(&scene);
    let queue = scene.data(&["supervisor", "queue", "--json"]);
    let events = queue["events"].as_array().unwrap();
    assert_eq!(events.len(), 1, "{queue}");
    assert_eq!(events[0]["kind"], "discussion-settled");
    let id = events[0]["id"].as_str().unwrap().to_owned();

    let refused = scene.run(&["supervisor", "done", "--json"]);
    assert!(!refused.status.success(), "{}", text(&refused));
    assert!(
        text(&refused).contains("events-unhandled"),
        "{}",
        text(&refused)
    );

    let handled = scene.data(&["supervisor", "handled", &id, "--json"]);
    assert_eq!(handled["handled"], 1, "{handled}");
    let done = scene.data(&["supervisor", "done", "--json"]);
    assert_eq!(done["done"], true, "{done}");
}

#[test]
fn wake_with_no_live_supervisor_and_an_unhandled_event_starts_one_through_session_start() {
    let scene = Scene::new("wake", WATCHER_CONFIG);
    // Admission runs even without an event; only the supervisor has nothing to wake for.
    let idle = scene.data(&["supervisor", "wake", "--json"]);
    assert_eq!(idle["outcome"], "nothing-unhandled", "{idle}");
    let lead = serde_json::json!([
        "session",
        "start",
        "lead",
        "--name",
        "demo-260101-0000-demo",
        "--json"
    ]);
    assert_eq!(scene.payload_calls(), vec![lead.clone()]);
    let admitted = git(
        &scene.root.join("remote.git"),
        &["show", &format!("main:plans/{PLAN}/plan.md")],
    );
    assert!(admitted.contains("status: running\n"), "{admitted}");
    assert!(
        admitted.contains("lead: head:lead-demo-260101-0000-demo\n"),
        "{admitted}"
    );

    // A tick that leaves a judgement event unhandled starts the supervisor, not another lead.
    let report = first_tick(&scene);
    assert_eq!(report["wakes"], 1, "{report}");
    let start = serde_json::json!(["session", "start", "supervisor", "--name", "demo", "--json"]);
    assert_eq!(scene.payload_calls(), vec![lead.clone(), start.clone()]);
    // A wake inside the start window leaves that start alone.
    let again = scene.data(&["supervisor", "wake", "--json"]);
    assert_eq!(again["outcome"], "starting", "{again}");
    assert_eq!(scene.payload_calls(), vec![lead.clone(), start.clone()]);

    // With the last start long past and no live supervisor, the wake door starts one.
    fs::remove_file(scene.project().join(".fgos/runtime/supervision/wake.json")).unwrap();
    let woke = scene.data(&["supervisor", "wake", "--json"]);
    assert_eq!(woke["outcome"], "started", "{woke}");
    assert_eq!(scene.payload_calls(), vec![lead, start.clone(), start]);
}

/// The `fgos.supervisor.error` values this clone's wake spans recorded (an admission refusal is one of them).
fn wake_errors(scene: &Scene) -> Vec<String> {
    let spans = scene.data(&[
        "metrics",
        "query",
        "--kind",
        "fgos.supervisor.wake",
        "--by",
        "fgos.supervisor.error",
        "--json",
    ]);
    spans["rows"]
        .as_array()
        .unwrap()
        .iter()
        .filter_map(|row| row["group"]["fgos.supervisor.error"].as_str())
        .map(str::to_owned)
        .collect()
}

/// Two machines, each with its own state root, machine id and clone of one bare remote.
fn two_machines() -> (Scene, Scene, String, String) {
    let winner = Scene::new("claim-winner", WATCHER_CONFIG);
    let loser = Scene::clone_of(&winner, "claim-loser", WATCHER_CONFIG);
    let machine = |scene: &Scene| {
        fs::read_to_string(scene.root.join("state/machine-id"))
            .unwrap()
            .trim()
            .to_owned()
    };
    let (won, lost) = (machine(&winner), machine(&loser));
    assert_ne!(won, lost, "the two clones are two machines");
    let git_id = |scene: &Scene| git(&scene.project(), &["config", "fgos.machineid"]);
    assert_ne!(
        git_id(&winner),
        git_id(&loser),
        "the two clones are two git machines"
    );
    (winner, loser, won, lost)
}

fn claim_count(remote: &Path) -> usize {
    let plan_path = format!("plans/{PLAN}/plan.md");
    git(remote, &["log", "--format=%H", "main", "--", &plan_path])
        .lines()
        .count()
}

#[test]
fn a_clone_with_a_stale_trunk_refuses_the_plan_the_winner_already_claimed() {
    let (winner, loser, won, lost) = two_machines();
    let before = claim_count(&winner.root.join("remote.git"));
    winner.data(&["supervisor", "wake", "--json"]);
    // The loser's trunk is stale: it still reads the plan as ready when it wakes.
    loser.data(&["supervisor", "wake", "--json"]);
    let errors = wake_errors(&loser);
    assert!(
        errors
            .iter()
            .any(|e| e == "publish-failed:admission-plan-stale"),
        "{errors:?}"
    );
    assert_loser_converged(&winner, &loser, &won, &lost, before);
}

#[test]
fn a_clone_whose_push_loses_the_race_undoes_its_claim_and_reads_the_winners_host() {
    let (winner, loser, won, lost) = two_machines();
    let before = claim_count(&winner.root.join("remote.git"));
    // Between the loser's catch-up and its push the winner's whole wake runs and claims the plan on origin.
    let quote = |s: &std::ffi::OsStr| format!("'{}'", s.to_string_lossy().replace('\'', r"'\''"));
    let wake = winner.command(&["supervisor", "wake", "--json"]);
    let envs: Vec<String> = wake
        .get_envs()
        .filter_map(|(k, v)| v.map(|v| format!("{}={}", quote(k), quote(v))))
        .collect();
    let args: Vec<String> = wake.get_args().map(quote).collect();
    let script = format!(
        "#!/bin/sh\ncd {} || exit 0\nenv -i {} {} {} >/dev/null 2>&1\nexit 0\n",
        quote(wake.get_current_dir().unwrap().as_os_str()),
        envs.join(" "),
        quote(wake.get_program()),
        args.join(" ")
    );
    // The land door runs the project's gates after its catch-up and before its push; the loser's gate is that step.
    let gate = loser.root.join("race-gate.sh");
    fs::write(&gate, script).unwrap();
    fs::set_permissions(&gate, fs::Permissions::from_mode(0o755)).unwrap();
    fs::write(
        loser.project().join(".fgos/config.yaml"),
        WATCHER_CONFIG.replace("run: \"true\"", &format!("run: \"{}\"", gate.display())),
    )
    .unwrap();

    loser.data(&["supervisor", "wake", "--json"]);
    let errors = wake_errors(&loser);
    // Its catch-up found nothing new, so the claim was written and the land door refused it over the dirty file.
    assert!(
        errors
            .iter()
            .any(|e| e == "publish-failed:main-checkout-dirty-overlap"),
        "the loser's publish is refused after its catch-up: {errors:?}"
    );
    assert_loser_converged(&winner, &loser, &won, &lost, before);
}

#[test]
fn a_missing_or_invalid_machine_id_refuses_admission_without_a_lead_or_a_commit() {
    let scene = Scene::new("no-machine-id", WATCHER_CONFIG);
    let remote = scene.root.join("remote.git");
    let tip = git(&remote, &["rev-parse", "main"]);
    let local = git(&scene.project(), &["rev-parse", "main"]);
    let id_file = scene.root.join("state/machine-id");
    for (content, code) in [
        (None, "machine-id-missing"),
        (Some("Not A Machine\n"), "machine-id-invalid"),
    ] {
        match content {
            None => fs::remove_file(&id_file).unwrap(),
            Some(text) => fs::write(&id_file, text).unwrap(),
        }
        scene.data(&["supervisor", "wake", "--json"]);
        let errors = wake_errors(&scene);
        assert!(errors.iter().any(|e| e == code), "{code}: {errors:?}");
        assert!(scene.payload_calls().is_empty(), "no lead starts");
        assert_eq!(
            git(&remote, &["rev-parse", "main"]),
            tip,
            "nothing reaches origin"
        );
        assert_eq!(
            git(&scene.project(), &["rev-parse", "main"]),
            local,
            "no local commit"
        );
        assert!(git(&scene.project(), &["status", "--porcelain"]).is_empty());
    }
}

/// Origin holds exactly the winner's claim, and the loser's checkout has converged on it: the loser's own bytes
/// are gone, its trunk equals origin, and the portfolio read on the loser's checkout shows the winner's host.
fn assert_loser_converged(winner: &Scene, loser: &Scene, won: &str, lost: &str, before: usize) {
    let remote = winner.root.join("remote.git");
    let plan_path = format!("plans/{PLAN}/plan.md");
    let origin_plan = git(&remote, &["show", &format!("main:{plan_path}")]);
    assert!(origin_plan.contains("status: running\n"), "{origin_plan}");
    assert!(
        origin_plan.contains(&format!("host: {won}\n")),
        "{origin_plan}"
    );
    assert!(
        !origin_plan.contains(lost),
        "the loser's machine id never reaches origin"
    );
    assert_eq!(
        claim_count(&remote),
        before + 1,
        "exactly one claim reaches origin"
    );
    let loser_project = loser.project();
    assert_eq!(
        fs::read_to_string(loser_project.join(&plan_path))
            .unwrap()
            .trim_end(),
        origin_plan.trim_end(),
        "the loser's plan.md is origin's bytes"
    );
    assert_eq!(
        git(&loser_project, &["rev-parse", "main"]),
        git(&remote, &["rev-parse", "main"]),
        "the loser's local main equals origin"
    );
    let view = loser.data(&["supervisor", "plans", "--json"]);
    assert_eq!(view["plans"][0]["status"], "running", "{view}");
    let seen = portfolio_host(&fs::read_to_string(loser_project.join(&plan_path)).unwrap());
    assert_eq!(seen.as_deref(), Some(won));
}

/// The `host` the plan text names, read through the portfolio reader.
fn portfolio_host(text: &str) -> Option<String> {
    fgos_supervision::portfolio::read_plan(PLAN, text)
        .unwrap()
        .host
}

/// A fake herdr (the run-supervisor crate's stand-in CLI, answering from files) whose one allocated slot `key` reads as
/// an idle agent; the returned listener is the fake server's socket and stays open while the test runs.
struct IdleHerdr {
    env: Vec<(String, String)>,
    dir: PathBuf,
    _server: UnixListener,
}

impl Drop for IdleHerdr {
    /// Stops the agent process a test launched in the fake pane.
    fn drop(&mut self) {
        if let Ok(pid) = fs::read_to_string(self.dir.join("script.pid")) {
            let _ = Command::new("kill").arg(pid.trim()).status();
        }
    }
}

fn idle_herdr(scene: &Scene, key: &str) -> IdleHerdr {
    idle_herdr_with(scene, key, false)
}

/// [`idle_herdr`]; with `agent_running` the slot also runs a long-lived process in its foreground, and the screen
/// shows an idle Claude Code composer under an earlier exchange that already holds the line `continue`.
fn idle_herdr_with(scene: &Scene, key: &str, agent_running: bool) -> IdleHerdr {
    use fgos_terminal_control::{
        core::{Core, CoreConfig},
        driver::herdr::{HerdrConfig, HerdrDriver},
        policy::{policy_by_name, Limits},
        port::{AllocateRequest, Display},
    };
    let bin = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../packages/run-supervisor/rust/tests/fixtures/fake-herdr-pane.py");
    let dir = scene.root.join("herdr");
    fs::create_dir_all(&dir).unwrap();
    let socket = scene.root.join("herdr.sock");
    let server = UnixListener::bind(&socket).unwrap();
    fs::write(
        dir.join("explain.json"),
        r#"{"agent":"claude","state":"idle","visible_idle":true,"visible_working":false,"visible_blocker":false}"#,
    )
    .unwrap();

    let mut herdr = HerdrConfig::new(bin.to_string_lossy().into_owned());
    herdr.socket_path = Some(socket.to_string_lossy().into_owned());
    herdr
        .env
        .push(("FAKE_HERDR_DIR".into(), dir.to_string_lossy().into_owned()));
    let driver = HerdrDriver::new(herdr);
    let policy = policy_by_name(None).unwrap();
    let core = Core::new(
        &driver,
        policy.as_ref(),
        CoreConfig {
            state_root: scene.root.join("state"),
            limits: Limits {
                min_cols: 1,
                min_rows: 1,
                max_panes_per_tab: 8,
            },
            allocation_grace_ms: 60_000,
            launch_identify_timeout_ms: 5_000,
            shell_ready_timeout_ms: 10_000,
        },
    );
    core.allocate(&AllocateRequest {
        key: key.into(),
        group_key: "g".into(),
        display: Display {
            title: Some(key.into()),
            ..Default::default()
        },
        group_size: None,
        cwd: None,
        env: Default::default(),
    })
    .expect("allocate the lead's slot");
    if agent_running {
        let earlier: String = (1..=8).map(|n| format!("tool output line {n}\n")).collect();
        let screen = format!("> continue\n{earlier}❯\n──────\n");
        fs::write(dir.join("screen.txt"), screen).unwrap();
        core.launch(
            key,
            &fgos_terminal_control::port::LaunchSpec {
                command: "sh".into(),
                args: vec!["-c".into(), "sleep 300; true".into()],
                cwd: "/".into(),
                env: Default::default(),
                expect: None,
            },
        )
        .expect("launch the stand-in agent");
    }
    IdleHerdr {
        dir: dir.clone(),
        env: vec![
            ("FGOS_HERDR_BIN".into(), bin.to_string_lossy().into_owned()),
            ("FAKE_HERDR_DIR".into(), dir.to_string_lossy().into_owned()),
            (
                "HERDR_SOCKET_PATH".into(),
                socket.to_string_lossy().into_owned(),
            ),
        ],
        _server: server,
    }
}

#[test]
fn a_wake_stops_an_idle_finished_lead_through_the_real_adapter_and_session_stop_names_its_role() {
    // The host answers a declined stop with exit 0 and `stopped: false`: the span records the refusal, not a stop.
    for (answer, outcome, error) in [
        (None, "stopped-finished", ""),
        (
            Some(r#"{"stopped":false,"reason":"no-supervisor"}"#),
            "stop-failed",
            "no-supervisor",
        ),
    ] {
        a_finished_lead_is_woken_over(answer, outcome, error);
    }
}

fn a_finished_lead_is_woken_over(answer: Option<&str>, outcome: &str, error: &str) {
    let scene = Scene::new("idle-lead", WATCHER_CONFIG);
    if let Some(answer) = answer {
        fs::write(scene.root.join("stop-answer.json"), answer).unwrap();
    }
    let project = scene.project();
    let plan = project.join(format!("plans/{PLAN}/plan.md"));
    let body = fs::read_to_string(&plan).unwrap();
    fs::write(
        &plan,
        body.replace("status: ready\n", "status: done\nlead: lead:S1\n"),
    )
    .unwrap();
    git(&project, &["add", "-f", "."]);
    git(&project, &["commit", "-q", "-m", "finish plan"]);
    git(&project, &["push", "-q", "origin", "main"]);
    let herdr = idle_herdr(&scene, "slot-s1");
    register_lead_session(&scene, "lead:S1", "idle-lead-session", "slot-s1");

    let mut wake = scene.command(&["supervisor", "wake", "--json"]);
    for (k, v) in &herdr.env {
        wake.env(k, v);
    }
    let out = wake.output().unwrap();
    assert!(out.status.success(), "{}", text(&out));
    assert_eq!(
        scene.payload_calls(),
        vec![serde_json::json!([
            "session", "stop", "--role", "lead:S1", "--json"
        ])],
        "the idle finished lead is stopped by its role: {}",
        text(&out)
    );
    // The span of the stop names the lead and carries the host's reason when the stop was declined.
    let records = observe_records(&project.join(".fgos/observe"));
    let span = records
        .iter()
        .find(|r| r.contains("\"lead:S1\""))
        .unwrap_or_else(|| panic!("no span names the lead: {records:?}"));
    assert!(span.contains(&format!("\"{outcome}\"")), "{span}");
    assert!(span.contains(&format!("\"{error}\"")), "{span}");
}

/// The text of every record file under the observe directory.
fn observe_records(dir: &Path) -> Vec<String> {
    let mut found = Vec::new();
    let mut pending = vec![dir.to_path_buf()];
    while let Some(next) = pending.pop() {
        let Ok(entries) = fs::read_dir(&next) else {
            continue;
        };
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                pending.push(path);
            } else if let Ok(body) = fs::read_to_string(&path) {
                found.extend(body.lines().map(str::to_owned));
            }
        }
    }
    found
}

#[test]
fn plans_lists_the_trunk_portfolio_with_what_the_supervisor_may_start() {
    let scene = Scene::new("plans", WATCHER_CONFIG);
    let view = scene.data(&["supervisor", "plans", "--json"]);
    let plans = view["plans"].as_array().unwrap();
    assert_eq!(plans.len(), 1, "{view}");
    assert_eq!(plans[0]["dir"], PLAN);
    assert_eq!(plans[0]["status"], "ready");
    assert_eq!(plans[0]["admissible"], true);
    assert_eq!(view["maxLeads"], 4);
}

#[test]
fn plans_hold_a_ready_plan_of_another_machine_and_show_its_running_one_as_elsewhere() {
    let scene = Scene::new("plans-other-machine", WATCHER_CONFIG);
    let project = scene.project();
    let plan = project.join(format!("plans/{PLAN}/plan.md"));
    let text = fs::read_to_string(&plan).unwrap();
    let other = "fg-other-abc123";
    fs::write(
        &plan,
        text.replace(
            "status: ready\n",
            &format!("status: ready\nhost: {other}\n"),
        ),
    )
    .unwrap();
    git(&project, &["add", "-f", "."]);
    git(&project, &["commit", "-q", "-m", "pin plan"]);
    git(&project, &["push", "-q", "origin", "main"]);
    let view = scene.data(&["supervisor", "plans", "--json"]);
    assert_eq!(view["plans"][0]["admissible"], false, "{view}");
    scene.data(&["supervisor", "wake", "--json"]);
    assert!(wake_errors(&scene)
        .iter()
        .any(|e| e == &format!("held-other-machine:{other}")));

    let text = fs::read_to_string(&plan).unwrap();
    fs::write(
        &plan,
        text.replace("status: ready\n", "status: running\nlead: lead:S6A\n"),
    )
    .unwrap();
    git(&project, &["add", "-f", "."]);
    git(&project, &["commit", "-q", "-m", "take plan"]);
    git(&project, &["push", "-q", "origin", "main"]);
    let view = scene.data(&["supervisor", "plans", "--json"]);
    assert_eq!(view["plans"][0]["runningElsewhere"], true, "{view}");
    assert_eq!(view["plans"][0]["host"], other, "{view}");
    assert!(view["plans"][0].get("leadLive").is_none(), "{view}");
    assert_eq!(view["leadsLive"], 0, "{view}");
}

/// Takes the demo plan (`running`, lead `lead:S6A`) and registers a live session holding that role.
fn take_plan_with_live_lead(scene: &Scene) {
    let project = scene.project();
    let plan = project.join(format!("plans/{PLAN}/plan.md"));
    let text = fs::read_to_string(&plan).unwrap();
    fs::write(
        &plan,
        text.replace("status: ready\n", "status: running\nlead: lead:S6A\n"),
    )
    .unwrap();
    git(&project, &["add", "-f", "."]);
    git(&project, &["commit", "-q", "-m", "take plan"]);
    git(&project, &["push", "-q", "origin", "main"]);
    let state = scene.root.join("state");
    let info = fgos_identity::session_for(
        &state,
        &fgos_identity::resolve::WriterKey {
            source: "CLAUDE_CODE_SESSION_ID",
            value: "lead-session",
        },
        None,
    )
    .unwrap()
    .info;
    let entry = fgos_identity::directory::Entry::new(
        info.id,
        info.handle,
        "claude".to_string(),
        Some(PROJECT_ID.to_string()),
        None,
        vec!["lead:S6A".to_string()],
        fgos_identity::current::os_record(std::process::id()),
    );
    fgos_identity::directory::register(&state, entry, false, &fgos_process::facts::judge_here)
        .unwrap();
}

#[test]
fn a_running_plan_whose_named_lead_role_is_held_by_a_live_non_head_session_reports_lead_live() {
    let scene = Scene::new("plans-lead", WATCHER_CONFIG);
    take_plan_with_live_lead(&scene);
    let view = scene.data(&["supervisor", "plans", "--json"]);
    assert_eq!(view["plans"][0]["leadLive"], true, "{view}");
    assert_eq!(view["leadsLive"], 1, "{view}");
    assert_eq!(view["leadsWaiting"], 0, "{view}");
}

const PHASE_QUESTION: &str = r#"{"stage":"planning","headline":"Which store do we use?","blocks":"phase 1","parts":{"what":"choose a store","cause":"two stores exist","options":[{"label":"A","does":"d","gain":"g","harm":"h","cost":"c","recommended":true},{"label":"B","does":"d","gain":"g","harm":"h","cost":"c"}],"recommendation":"A","scope":{"allows":"A for this plan","forbids":"changing other plans"}}}"#;

#[test]
fn a_live_lead_whose_only_open_phase_has_an_open_question_in_the_store_is_counted_waiting() {
    let scene = Scene::new("plans-waiting", WATCHER_CONFIG);
    take_plan_with_live_lead(&scene);
    fs::write(
        scene
            .project()
            .join(format!("plans/{PLAN}/phase-01-one.md")),
        "# one\n",
    )
    .unwrap();
    let mut ask = scene.command(&[
        "questions",
        "ask",
        "--ref",
        &format!("plan:{PLAN}#phase-01"),
        "--input",
        "-",
    ]);
    let mut child = ask
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();
    child
        .stdin
        .take()
        .unwrap()
        .write_all(PHASE_QUESTION.as_bytes())
        .unwrap();
    let out = child.wait_with_output().unwrap();
    assert!(out.status.success(), "ask: {}", text(&out));
    let view = scene.data(&["supervisor", "plans", "--json"]);
    assert_eq!(view["leadsWaiting"], 1, "{view}");
    assert_eq!(view["leadsLive"], 0, "{view}");
}

#[test]
fn one_malformed_plan_is_named_and_does_not_hide_the_other_plans() {
    let scene = Scene::new("plans-malformed", WATCHER_CONFIG);
    let project = scene.project();
    fs::create_dir_all(project.join("plans/broken")).unwrap();
    fs::write(
        project.join("plans/broken/plan.md"),
        "---\ncontract: plan-v1\ntitle: broken\nstatus: sideways\npriority: P2\nfootprint:\n  - src/**\ncreated: 2026-01-01\n---\n\n# Broken\n",
    )
    .unwrap();
    git(&project, &["add", "-f", "plans/broken/plan.md"]);
    git(&project, &["commit", "-q", "-m", "broken plan"]);
    git(&project, &["push", "-q", "origin", "main"]);
    let view = scene.data(&["supervisor", "plans", "--json"]);
    let plans = view["plans"].as_array().unwrap();
    assert_eq!(plans.len(), 1, "{view}");
    assert_eq!(plans[0]["dir"], PLAN);
    assert_eq!(plans[0]["admissible"], true);
    let unreadable = view["unreadable"].as_array().unwrap();
    assert_eq!(unreadable.len(), 1, "{view}");
    assert_eq!(view["unreadableCount"], 1, "{view}");
    assert_eq!(unreadable[0]["dir"], "broken");
    assert_eq!(unreadable[0]["code"], "plan-status-unknown");
}

#[test]
fn land_gates_a_branch_pushes_it_and_fast_forwards_local_main() {
    let scene = Scene::new("land", WATCHER_CONFIG);
    let project = scene.project();
    git(&project, &["checkout", "-q", "-b", "topic"]);
    fs::write(project.join("src.txt"), "topic\n").unwrap();
    git(&project, &["commit", "-qam", "topic"]);
    git(&project, &["checkout", "-q", "main"]);
    let landed = scene.data(&["land", "topic", "--json"]);
    let remote_tip = git(
        &scene.root.join("remote.git"),
        &["rev-parse", "refs/heads/main"],
    );
    assert_eq!(landed["mainSha"], remote_tip, "{landed}");
    assert_eq!(landed["landedPaths"], serde_json::json!(["src.txt"]));
    assert_eq!(git(&project, &["rev-parse", "refs/heads/main"]), remote_tip);

    // With no gate the same verb refuses before touching anything.
    let ungated = Scene::new("land-gateless", "# @fgos:v1\n");
    git(&ungated.project(), &["checkout", "-q", "-b", "topic"]);
    let refused = ungated.run(&["land", "topic", "--json"]);
    assert!(!refused.status.success());
    assert!(
        text(&refused).contains("land-gate-missing"),
        "{}",
        text(&refused)
    );
}

#[test]
fn slots_answers_the_lane_view_of_the_standard_pool_of_four() {
    let scene = Scene::new("slots", WATCHER_CONFIG);
    let view = scene.data(&["slots", "--json"]);
    let lanes = &view["lanes"];
    assert_eq!(lanes["ceiling"], 4, "{view}");
    assert_eq!(lanes["free"], 4, "{view}");
    assert_eq!(lanes["live"], 0, "{view}");
    assert!(lanes["seats"].is_array(), "{view}");
}

#[test]
fn supervisor_widen_lands_both_copies_on_a_running_plan() {
    let scene = Scene::new("widen-running", WATCHER_CONFIG);
    let project = scene.project();
    let plan_path = project.join(format!("plans/{PLAN}/plan.md"));
    let content = "---\n\
contract: plan-v1\n\
title: demo\n\
status: running\n\
priority: P2\n\
footprint:\n\
  - src/**\n\
created: 2026-01-01\n\
lead: lead:S6A\n\
---\n\
\n\
# Demo\n\
\n\
## Acceptance criteria\n\
\n\
1. First criterion.\n\
2. The supervisor runs fgos supervisor widen for any running plan: apps/fgos/tests/supervision_verbs.rs.\n\
\n\
## Phases\n\
\n\
| id | title | dependson | footprint | wave | status |\n\
|---|---|---|---|---|---|\n\
| 1 | one | - | `src/**` | 1 | running |\n";
    fs::write(&plan_path, content).unwrap();
    git(&project, &["add", "-f", "."]);
    git(
        &project,
        &["commit", "-q", "-m", "plan running with criteria"],
    );
    git(&project, &["push", "-q", "origin", "main"]);

    let data = scene.data(&[
        "supervisor",
        "widen",
        PLAN,
        "--phase",
        "1",
        "--path",
        "tests/new_path.rs",
        "--criterion",
        "2",
        "--json",
    ]);

    assert_eq!(data["plan"], PLAN, "{data}");
    assert_eq!(data["phase"], "1", "{data}");
    assert_eq!(data["criterion"], 2, "{data}");
    assert_eq!(
        data["added"],
        serde_json::json!(["tests/new_path.rs"]),
        "{data}"
    );
    assert_eq!(data["unchanged"], serde_json::json!([]), "{data}");
    assert_eq!(data["overlaps"], serde_json::json!([]), "{data}");
    assert!(data["commit"].is_string(), "{data}");

    let commit_sha = data["commit"].as_str().unwrap();
    let remote_tip = git(
        &scene.root.join("remote.git"),
        &["rev-parse", "refs/heads/main"],
    );
    assert_eq!(commit_sha, remote_tip);
    assert_eq!(
        git(&project, &["rev-parse", "refs/remotes/origin/main"]),
        git(&project, &["rev-parse", "main"]),
        "the trunk reader must see the landed widened plan"
    );

    let committed_plan = git(&project, &["show", "main:plans/260101-0000-demo/plan.md"]);
    assert!(
        committed_plan.contains("- tests/new_path.rs"),
        "frontmatter footprint must contain tests/new_path.rs: {committed_plan}"
    );
    assert!(
        committed_plan.contains("`src/**`, `tests/new_path.rs`"),
        "phase table row must contain tests/new_path.rs: {committed_plan}"
    );

    let last_msg = git(&project, &["log", "-1", "--pretty=%B"]);
    assert!(
        last_msg.starts_with(
            "plan(260101-0000-demo): widen phase 1 footprint by tests/new_path.rs for criterion 2:"
        ),
        "commit message must match format: {last_msg}"
    );
}

#[test]
fn supervisor_widen_into_another_active_plans_footprint_lands_and_reports_overlaps() {
    let scene = Scene::new("widen-overlap", WATCHER_CONFIG);
    let project = scene.project();
    let plan_path = project.join(format!("plans/{PLAN}/plan.md"));
    let content = "---\n\
contract: plan-v1\n\
title: demo\n\
status: running\n\
priority: P2\n\
footprint:\n\
  - src/**\n\
created: 2026-01-01\n\
lead: lead:S6A\n\
---\n\
\n\
# Demo\n\
\n\
## Acceptance criteria\n\
\n\
1. First criterion.\n\
2. Criterion two.\n\
\n\
## Phases\n\
\n\
| id | title | dependson | footprint | wave | status |\n\
|---|---|---|---|---|---|\n\
| 1 | one | - | `src/**` | 1 | running |\n";
    fs::write(&plan_path, content).unwrap();

    let peer_dir = "260101-0001-peer";
    fs::create_dir_all(project.join(format!("plans/{peer_dir}"))).unwrap();
    let peer_content = "---\n\
contract: plan-v1\n\
title: peer\n\
status: running\n\
priority: P2\n\
footprint:\n\
  - shared/**\n\
created: 2026-01-01\n\
lead: lead:S6B\n\
---\n\
\n\
# Peer\n\
\n\
| id | title | dependson | footprint | wave | status |\n\
|---|---|---|---|---|---|\n\
| 1 | peer-one | - | `shared/**` | 1 | running |\n";
    fs::write(
        project.join(format!("plans/{peer_dir}/plan.md")),
        peer_content,
    )
    .unwrap();

    git(&project, &["add", "-f", "."]);
    git(&project, &["commit", "-q", "-m", "add peer running plan"]);
    git(&project, &["push", "-q", "origin", "main"]);

    let data = scene.data(&[
        "supervisor",
        "widen",
        PLAN,
        "--phase",
        "1",
        "--path",
        "shared/file.rs",
        "--criterion",
        "2",
        "--json",
    ]);

    assert!(data["commit"].is_string(), "{data}");
    assert_eq!(
        data["added"],
        serde_json::json!(["shared/file.rs"]),
        "{data}"
    );
    assert_eq!(
        data["overlaps"],
        serde_json::json!([
            {
                "plan": peer_dir,
                "paths": ["shared/file.rs"]
            }
        ]),
        "{data}"
    );

    let committed_plan = git(&project, &["show", "main:plans/260101-0000-demo/plan.md"]);
    assert!(committed_plan.contains("- shared/file.rs"));
    assert!(committed_plan.contains("`src/**`, `shared/file.rs`"));
}

#[test]
fn supervisor_widen_refuses_bad_args() {
    let scene = Scene::new("widen-bad-args", WATCHER_CONFIG);

    // Missing --criterion
    let out = scene
        .command(&[
            "supervisor",
            "widen",
            PLAN,
            "--phase",
            "1",
            "--path",
            "src/a.rs",
            "--json",
        ])
        .output()
        .unwrap();
    assert!(!out.status.success());
    assert!(text(&out).contains("bad-args"), "{}", text(&out));

    // plan-dir with '/'
    let out = scene
        .command(&[
            "supervisor",
            "widen",
            "nested/dir",
            "--phase",
            "1",
            "--path",
            "src/a.rs",
            "--criterion",
            "1",
            "--json",
        ])
        .output()
        .unwrap();
    assert!(!out.status.success());
    assert!(text(&out).contains("bad-args"), "{}", text(&out));
}

/// A fake request socket: answers the first request with `reply` and returns the request it read.
fn fake_socket(path: &Path, reply: Value) -> std::thread::JoinHandle<Value> {
    let listener = UnixListener::bind(path).unwrap();
    std::thread::spawn(move || {
        let (mut stream, _) = listener.accept().unwrap();
        let mut len = [0u8; 4];
        stream.read_exact(&mut len).unwrap();
        let mut body = vec![0u8; u32::from_be_bytes(len) as usize];
        stream.read_exact(&mut body).unwrap();
        let request: Value = serde_json::from_slice(&body).unwrap();
        let mut answer = reply;
        answer["id"] = request["id"].clone();
        let bytes = serde_json::to_vec(&answer).unwrap();
        stream
            .write_all(&(bytes.len() as u32).to_be_bytes())
            .unwrap();
        stream.write_all(&bytes).unwrap();
        request
    })
}

#[test]
fn a_confined_land_goes_through_the_request_socket_and_never_runs_the_native_verb() {
    let scene = Scene::new("confined-land", WATCHER_CONFIG);
    let socket = scene.root.join("head.sock");
    let server = fake_socket(
        &socket,
        serde_json::json!({"type": "REPLY", "result": "done", "data": {"ticket": "t1", "state": "running"}}),
    );
    let out = scene
        .command(&["land", "feature", "--test", "a.test", "--json"])
        .env("FGOS_CONFINED", "1")
        .env("FGOS_HEAD_REQUEST_SOCKET", &socket)
        .output()
        .unwrap();
    assert!(out.status.success(), "{}", text(&out));
    let request = server.join().unwrap();
    assert_eq!(request["verb"], "land");
    assert_eq!(
        request["args"],
        serde_json::json!({"branch": "feature", "tests": ["a.test"]})
    );
    let printed: Value = serde_json::from_slice(&out.stdout).unwrap();
    assert_eq!(printed["ticket"], "t1");
}

#[test]
fn a_confined_queue_read_and_a_multi_id_handled_go_through_the_request_socket() {
    let scene = Scene::new("confined-queue", WATCHER_CONFIG);
    let socket = scene.root.join("head.sock");
    let server = fake_socket(
        &socket,
        serde_json::json!({"type": "REPLY", "result": "done", "data": {"events": [{"id": "e1"}]}}),
    );
    let out = scene
        .command(&["supervisor", "queue", "--json"])
        .env("FGOS_CONFINED", "1")
        .env("FGOS_HEAD_REQUEST_SOCKET", &socket)
        .output()
        .unwrap();
    assert!(out.status.success(), "{}", text(&out));
    let request = server.join().unwrap();
    assert_eq!(request["verb"], "fgos");
    assert_eq!(
        request["args"],
        serde_json::json!({"argv": ["supervisor", "queue"]})
    );
    let printed: Value = serde_json::from_slice(&out.stdout).unwrap();
    assert_eq!(printed["events"][0]["id"], "e1");
    assert!(scene.payload_calls().is_empty());

    std::fs::remove_file(&socket).unwrap();
    let server = fake_socket(
        &socket,
        serde_json::json!({"type": "REPLY", "result": "done", "data": {"handled": 3}}),
    );
    let out = scene
        .command(&["supervisor", "handled", "a1", "b2", "c3", "--json"])
        .env("FGOS_CONFINED", "1")
        .env("FGOS_HEAD_REQUEST_SOCKET", &socket)
        .output()
        .unwrap();
    assert!(out.status.success(), "{}", text(&out));
    let request = server.join().unwrap();
    assert_eq!(request["verb"], "fgos");
    assert_eq!(
        request["args"],
        serde_json::json!({"argv": ["supervisor", "handled", "a1", "b2", "c3"]})
    );
}

#[test]
fn a_confined_refusal_keeps_the_sockets_code_and_session_stop_is_asked_the_same_way() {
    let scene = Scene::new("confined-stop", WATCHER_CONFIG);
    let socket = scene.root.join("head.sock");
    let server = fake_socket(
        &socket,
        serde_json::json!({"type": "REPLY", "result": "refused", "code": "verb-failed", "detail": "role-mismatch"}),
    );
    let out = scene
        .command(&["session", "stop", "lead", "--name", "demo-x", "--json"])
        .env("FGOS_CONFINED", "1")
        .env("FGOS_HEAD_REQUEST_SOCKET", &socket)
        .output()
        .unwrap();
    assert!(!out.status.success());
    let printed: Value = serde_json::from_slice(&out.stdout).unwrap();
    assert_eq!(printed["code"], "role-mismatch", "{}", text(&out));
    let request = server.join().unwrap();
    assert_eq!(request["verb"], "session stop");
    assert_eq!(
        request["args"],
        serde_json::json!({"persona": "lead", "name": "demo-x"})
    );
    // The Node payload never ran: the confined call did not reach it.
    assert!(scene.payload_calls().is_empty());
}

#[test]
fn a_confined_land_that_names_the_footprint_is_refused_before_the_socket() {
    let scene = Scene::new("confined-footprint", WATCHER_CONFIG);
    let out = scene
        .command(&["land", "feature", "--footprint", "src/**", "--json"])
        .env("FGOS_CONFINED", "1")
        .env("FGOS_HEAD_REQUEST_SOCKET", scene.root.join("missing.sock"))
        .output()
        .unwrap();
    assert!(!out.status.success());
    let printed: Value = serde_json::from_slice(&out.stdout).unwrap();
    assert_eq!(printed["code"], "bad-args", "{}", text(&out));
}

/// A live session of this project holding `role`, with a terminal pane in Identity; returns its handle.
fn register_session(scene: &Scene, role: &str, value: &str) -> String {
    register_session_at(scene, role, value, None, false)
}

/// [`register_lead_session`] whose CLI session carries this test process's pid, so the host can read the head's CLI
/// version from a Claude sessions file named after that pid.
fn register_claude_head(scene: &Scene, role: &str, value: &str, key: &str) -> String {
    register_session_at(scene, role, value, Some(key), true)
}

/// [`register_session`] whose terminal group names the slot `key`, as a lead's supervisor records it.
fn register_lead_session(scene: &Scene, role: &str, value: &str, key: &str) -> String {
    register_session_at(scene, role, value, Some(key), false)
}

fn register_session_at(
    scene: &Scene,
    role: &str,
    value: &str,
    key: Option<&str>,
    with_cli_session: bool,
) -> String {
    let state = scene.root.join("state");
    let info = fgos_identity::session_for(
        &state,
        &fgos_identity::resolve::WriterKey {
            source: "CLAUDE_CODE_SESSION_ID",
            value,
        },
        None,
    )
    .unwrap()
    .info;
    let mut entry = fgos_identity::directory::Entry::new(
        info.id,
        info.handle.clone(),
        "claude".to_string(),
        Some(PROJECT_ID.to_string()),
        None,
        vec![role.to_string()],
        fgos_identity::current::os_record(std::process::id()),
    );
    entry.ids = Some(fgos_identity::directory::Ids {
        cli_session: with_cli_session.then(|| fgos_identity::directory::CliSessionIds {
            source: "CLAUDE_CODE_SESSION_ID".to_string(),
            id: value.to_string(),
            name: None,
            name_source: None,
            socket: None,
            pid: Some(std::process::id()),
            start_time: None,
        }),
        terminal: Some(fgos_identity::directory::TerminalIds {
            driver: "herdr".to_string(),
            key: key.map(str::to_owned),
            pane_id: "p-test".to_string(),
            tab_id: None,
            workspace_id: None,
        }),
        ..Default::default()
    });
    fgos_identity::directory::register(&state, entry, false, &fgos_process::facts::judge_here)
        .unwrap();
    info.handle
}

#[test]
fn a_raised_coordination_event_reaches_the_queue_and_leaves_it_when_handled() {
    let scene = Scene::new("raise", WATCHER_CONFIG);
    let raised = scene.data(&[
        "supervisor",
        "raise",
        "--kind",
        "coordination-handoff",
        "--ref",
        "plans/x",
        "--reason",
        "ready for a lead",
        "--next",
        "fgos supervisor plans",
        "--json",
    ]);
    assert_eq!(raised["raised"], true, "{raised}");
    let id = raised["id"].as_str().unwrap().to_owned();
    let queue = scene.data(&["supervisor", "queue", "--json"]);
    let event = &queue["events"][0];
    assert_eq!(event["id"], id.as_str(), "{queue}");
    assert_eq!(event["kind"], "coordination-handoff");
    scene.data(&["supervisor", "handled", &id, "--json"]);
    let queue = scene.data(&["supervisor", "queue", "--json"]);
    assert_eq!(queue["events"].as_array().unwrap().len(), 0, "{queue}");

    let unknown = scene.run(&[
        "supervisor",
        "raise",
        "--kind",
        "discussion-settled",
        "--ref",
        "x",
        "--reason",
        "y",
        "--json",
    ]);
    assert_eq!(unknown.status.code(), Some(4), "{}", text(&unknown));
    assert!(text(&unknown).contains("bad-event"), "{}", text(&unknown));
}

#[test]
fn a_tuned_watcher_setting_lands_in_the_project_config_inside_the_schema_bounds() {
    let scene = Scene::new("tune", WATCHER_CONFIG);
    let tuned = scene.data(&[
        "watcher",
        "tune",
        "session-idle",
        "--set",
        "sessionIdleLimit=3",
        "--arm",
        "--json",
    ]);
    assert_eq!(
        tuned["applied"],
        serde_json::json!(["actions.session-idle=wake-supervisor", "sessionIdleLimit=3"]),
        "{tuned}"
    );
    let config = fs::read_to_string(scene.project().join(".fgos/config.yaml")).unwrap();
    assert!(config.contains("session-idle: wake-supervisor"), "{config}");
    assert!(config.contains("sessionIdleLimit: 3"), "{config}");

    let below_minimum = scene.run(&["watcher", "tune", "--set", "sessionIdleLimit=-1", "--json"]);
    assert_eq!(
        below_minimum.status.code(),
        Some(4),
        "{}",
        text(&below_minimum)
    );
    let above_maximum = scene.run(&[
        "watcher",
        "tune",
        "--set",
        "idleIntervalSec=99999999",
        "--json",
    ]);
    assert_eq!(
        above_maximum.status.code(),
        Some(4),
        "{}",
        text(&above_maximum)
    );
    let untunable = scene.run(&["watcher", "tune", "--set", "enabled=1", "--json"]);
    assert_eq!(untunable.status.code(), Some(4), "{}", text(&untunable));
    let config = fs::read_to_string(scene.project().join(".fgos/config.yaml")).unwrap();
    assert!(
        config.contains("sessionIdleLimit: 3"),
        "a refusal changes nothing: {config}"
    );
}

#[test]
fn session_read_resolves_its_target_through_identity_before_it_reaches_the_terminal() {
    let scene = Scene::new("read", WATCHER_CONFIG);
    let unknown = scene.run(&["session", "read", "lead:NOBODY", "--json"]);
    assert_eq!(unknown.status.code(), Some(4), "{}", text(&unknown));
    assert!(
        text(&unknown).contains("session-not-found"),
        "{}",
        text(&unknown)
    );
    // The session resolves; the scene has no terminal host, so the terminal port is what refuses.
    register_session(&scene, "lead:S6A", "read-target");
    let read = scene.run(&["session", "read", "lead:S6A", "--lines", "20", "--json"]);
    assert!(!read.status.success(), "{}", text(&read));
    assert!(text(&read).contains("terminal-refused"), "{}", text(&read));
    assert!(
        scene.payload_calls().is_empty(),
        "the host serves session read itself"
    );
}

#[test]
fn session_type_is_refused_until_an_open_event_names_the_target_session() {
    let scene = Scene::new("type", WATCHER_CONFIG);
    let handle = register_session(&scene, "lead:S6A", "type-target");
    let args = [
        "session", "type", "lead:S6A", "--text", "continue", "--json",
    ];
    let refused = scene.run(&args);
    assert_eq!(refused.status.code(), Some(2), "{}", text(&refused));
    assert!(
        text(&refused).contains("target-not-stuck"),
        "{}",
        text(&refused)
    );

    let raised = scene.data(&[
        "supervisor",
        "raise",
        "--kind",
        "coordination-help",
        "--ref",
        &handle,
        "--reason",
        "stuck on a prompt",
        "--json",
    ]);
    // With an event naming the session the gate opens; the session has no CLI version to judge, so nothing is typed.
    let typed = scene.run(&args);
    assert!(!typed.status.success(), "{}", text(&typed));
    assert!(
        text(&typed).contains("[unknown]"),
        "{}",
        text(&typed)
    );
    assert!(
        !text(&typed).contains("target-not-stuck"),
        "{}",
        text(&typed)
    );
    scene.data(&[
        "supervisor",
        "handled",
        raised["id"].as_str().unwrap(),
        "--json",
    ]);
    let closed = scene.run(&args);
    assert!(
        text(&closed).contains("target-not-stuck"),
        "a handled event no longer opens it: {}",
        text(&closed)
    );
    // A watcher event names a session by the agent CLI's own id, without the machine part.
    scene.data(&[
        "supervisor",
        "raise",
        "--kind",
        "coordination-help",
        "--ref",
        "type-target",
        "--reason",
        "named by the CLI session id",
        "--json",
    ]);
    let by_cli_id = scene.run(&args);
    assert!(
        !text(&by_cli_id).contains("target-not-stuck"),
        "the CLI session id names the session: {}",
        text(&by_cli_id)
    );

    // A stuck head whose pane shows an idle, empty composer takes the line: the verb submits it and answers
    // `submitted`, never `typed`; `--no-enter` leaves it typed and answers `held`.
    let herdr = idle_herdr_with(&scene, "slot-s6b", true);
    let head = register_claude_head(&scene, "lead:S6B", "submit-target", "slot-s6b");
    scene.data(&[
        "supervisor",
        "raise",
        "--kind",
        "coordination-help",
        "--ref",
        &head,
        "--reason",
        "stuck with an unsent wake line",
        "--json",
    ]);
    let config_dir = scene.root.join("claude-config");
    fs::create_dir_all(config_dir.join("sessions")).unwrap();
    fs::write(
        config_dir
            .join("sessions")
            .join(format!("{}.json", std::process::id())),
        format!(
            r#"{{"pid":{},"version":"{}"}}"#,
            std::process::id(),
            fgos_agent_protocol::terminal::adapter_for("claude")
                .unwrap()
                .pinned_version()
        ),
    )
    .unwrap();
    let type_to_head = |extra: &[&str]| {
        let mut args = vec!["session", "type", "lead:S6B", "--text", "continue", "--json"];
        args.extend_from_slice(extra);
        let mut command = scene.command(&args);
        command.env("CLAUDE_CONFIG_DIR", &config_dir);
        for (k, v) in &herdr.env {
            command.env(k, v);
        }
        command.output().unwrap()
    };
    let submitted = type_to_head(&[]);
    assert!(submitted.status.success(), "{}", text(&submitted));
    let answer: Value = serde_json::from_slice(&submitted.stdout).unwrap();
    assert_eq!(answer["data"]["submitted"], true, "{answer}");
    assert!(answer["data"].get("typed").is_none(), "{answer}");
    let sent = fs::read_to_string(scene.root.join("herdr/sent.jsonl")).unwrap();
    let kinds: Vec<Value> = sent
        .lines()
        .map(|line| serde_json::from_str(line).unwrap())
        .collect();
    assert_eq!(kinds[0]["text"], "continue", "{sent}");
    assert_eq!(kinds[1]["keys"][0], "Enter", "{sent}");

    let held = type_to_head(&["--no-enter"]);
    assert!(held.status.success(), "{}", text(&held));
    let answer: Value = serde_json::from_slice(&held.stdout).unwrap();
    assert_eq!(answer["data"]["held"], true, "{answer}");
    assert!(answer["data"].get("typed").is_none(), "{answer}");
}

#[test]
fn metrics_prune_reports_a_dry_run_unless_apply_is_given() {
    let scene = Scene::new("prune", WATCHER_CONFIG);
    let dry = scene.data(&["metrics", "prune", "--json"]);
    assert_eq!(dry["applied"], false, "{dry}");
    assert_eq!(dry["pruned"], 0, "{dry}");
    let applied = scene.data(&[
        "metrics",
        "prune",
        "--apply",
        "--settled",
        "session:none",
        "--json",
    ]);
    assert_eq!(applied["applied"], true, "{applied}");
    let bad = scene.run(&["metrics", "prune", "--settled", "nokind", "--json"]);
    assert!(!bad.status.success(), "{}", text(&bad));
}

#[test]
fn a_confined_head_sends_the_coordination_verbs_through_the_request_socket() {
    let scene = Scene::new("confined-coordination", WATCHER_CONFIG);
    let socket = scene.root.join("head.sock");
    let ask = |args: &[&str], stdin: Option<&str>| {
        let _ = std::fs::remove_file(&socket);
        let server = fake_socket(
            &socket,
            serde_json::json!({"type": "REPLY", "result": "done", "data": {"ok": true}}),
        );
        let mut command = scene.command(args);
        command
            .env("FGOS_CONFINED", "1")
            .env("FGOS_HEAD_REQUEST_SOCKET", &socket);
        let out = match stdin {
            None => command.output().unwrap(),
            Some(input) => {
                let mut child = command
                    .stdin(Stdio::piped())
                    .stdout(Stdio::piped())
                    .stderr(Stdio::piped())
                    .spawn()
                    .unwrap();
                child
                    .stdin
                    .take()
                    .unwrap()
                    .write_all(input.as_bytes())
                    .unwrap();
                child.wait_with_output().unwrap()
            }
        };
        assert!(out.status.success(), "{args:?}: {}", text(&out));
        server.join().unwrap()
    };
    let raise = ask(
        &[
            "supervisor",
            "raise",
            "--kind",
            "coordination-help",
            "--ref",
            "r",
            "--reason",
            "why",
            "--json",
        ],
        None,
    );
    assert_eq!(raise["verb"], "fgos");
    assert_eq!(
        raise["args"],
        serde_json::json!({"argv": ["supervisor", "raise", "--kind", "coordination-help", "--ref", "r", "--reason", "why"]})
    );
    let tune = ask(
        &[
            "watcher",
            "tune",
            "session-idle",
            "--set",
            "sessionIdleLimit=2",
            "--arm",
            "--json",
        ],
        None,
    );
    assert_eq!(tune["verb"], "fgos");
    assert_eq!(
        tune["args"],
        serde_json::json!({"argv": ["watcher", "tune", "session-idle", "--set", "sessionIdleLimit=2", "--arm"]})
    );
    let read = ask(
        &["session", "read", "head:lead-x", "--lines", "30", "--json"],
        None,
    );
    assert_eq!(read["verb"], "fgos");
    assert_eq!(
        read["args"],
        serde_json::json!({"argv": ["session", "read", "head:lead-x", "--lines", "30"]})
    );
    let typed = ask(
        &[
            "session",
            "type",
            "head:lead-x",
            "--text",
            "go on",
            "--json",
        ],
        None,
    );
    assert_eq!(typed["verb"], "fgos");
    assert_eq!(
        typed["args"],
        serde_json::json!({"argv": ["session", "type", "head:lead-x", "--text", "go on"]})
    );
    let prune = ask(
        &[
            "metrics",
            "prune",
            "--apply",
            "--settled",
            "session:a",
            "--json",
        ],
        None,
    );
    assert_eq!(prune["verb"], "fgos");
    assert_eq!(
        prune["args"],
        serde_json::json!({"argv": ["metrics", "prune", "--apply", "--settled", "session:a"]})
    );
    let record = ask(
        &["metrics", "record", "--json", "-"],
        Some(r#"{"kind":"fgos.coordination.act","subject":{"kind":"event","id":"e1"}}"#),
    );
    assert_eq!(record["verb"], "metrics record");
    assert_eq!(
        record["args"]["records"][0]["kind"],
        "fgos.coordination.act"
    );
    assert!(scene.payload_calls().is_empty());
}

/// The doctor row `id` of a `doctor --json` run, with the engine's level and message.
fn doctor_row(scene: &Scene, id: &str) -> Value {
    let out = scene.run(&["doctor", "--json"]);
    let parsed: Value = serde_json::from_slice(&out.stdout)
        .unwrap_or_else(|e| panic!("doctor: {e}: {}", text(&out)));
    let rows = parsed["data"]["checks"]
        .as_array()
        .or_else(|| parsed["data"]["rows"].as_array())
        .unwrap_or_else(|| panic!("no rows in {parsed}"));
    rows.iter()
        .find(|r| r["id"] == id || r["name"] == id)
        .cloned()
        .unwrap_or_else(|| panic!("no row {id} in {parsed}"))
}

/// The row's own words: its description names the codes it warns about, so only the message is read.
fn row_text(row: &Value) -> String {
    row["message"].as_str().unwrap_or_default().to_owned()
}

#[test]
fn the_unhandled_events_row_warns_with_the_count_and_passes_when_the_queue_is_empty() {
    let scene = Scene::new("doctor-queue", WATCHER_CONFIG);
    assert!(row_text(&doctor_row(&scene, "supervisor-events-unhandled")).contains("no unhandled"));
    first_tick(&scene);
    let row = row_text(&doctor_row(&scene, "supervisor-events-unhandled"));
    assert!(
        row.contains("1 unhandled, run `fgos supervisor queue`"),
        "{row}"
    );
}

#[test]
fn the_land_gates_row_warns_when_the_watcher_is_on_and_no_gate_is_set() {
    let on = Scene::new("doctor-gates-on", "# @fgos:v1\n");
    on.set_global(WATCHER_ON);
    let row = row_text(&doctor_row(&on, "land-gates-configured"));
    assert!(row.contains("land-gate-missing"), "{row}");
    let gated = Scene::new(
        "doctor-gates-ok",
        "# @fgos:v1\nland:\n  gates:\n    - run: \"true\"\n",
    );
    gated.set_global(WATCHER_ON);
    let row = row_text(&doctor_row(&gated, "land-gates-configured"));
    assert!(!row.contains("land-gate-missing"), "{row}");
}

#[test]
fn the_pace_row_is_not_judged_while_the_watcher_is_off_and_names_a_failed_read_when_it_is_on() {
    let off = Scene::new("doctor-pace-off", WATCHER_CONFIG);
    assert!(row_text(&doctor_row(&off, "supervision-pace")).contains("not judged"));
    let on = Scene::new("doctor-pace-on", "# @fgos:v1\n");
    on.set_global(WATCHER_ON);
    // The pace definitions are not in this release, so the read is named, never read as "on time".
    let row = row_text(&doctor_row(&on, "supervision-pace"));
    assert!(row.contains("warning"), "{row}");
}
