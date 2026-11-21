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
process.stdout.write('{"started":true}\n');
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
        let project = root.join("project");
        git(&project, &["checkout", "-q", "-b", "main"]);
        git(&project, &["config", "fgos.machineid", "m-test"]);
        // The Land port merges in a candidate checkout, which needs an author.
        git(&project, &["config", "user.name", "t"]);
        git(&project, &["config", "user.email", "t@example.invalid"]);
        fs::create_dir_all(project.join(format!("plans/{PLAN}"))).unwrap();
        fs::write(
            project.join(format!("plans/{PLAN}/plan.md")),
            "---\ncontract: plan-v1\ntitle: demo\nstatus: ready\npriority: P2\nfootprint:\n  - src/**\ncreated: 2026-01-01\n---\n\n# Demo\n\n| id | title | dependson | footprint | wave | status |\n|---|---|---|---|---|---|\n| 1 | one | - | `src/**` | 1 | ready |\n",
        )
        .unwrap();
        fs::create_dir_all(project.join("docs/discussions/demo")).unwrap();
        fs::write(
            project.join("docs/discussions/demo/DISCUSSION.md"),
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
        git(&project, &["remote", "set-head", "origin", "main"]);
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
        release(&root);
        Self { root }
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
    // Nothing raised yet: nothing to wake for.
    let idle = scene.data(&["supervisor", "wake", "--json"]);
    assert_eq!(idle["outcome"], "nothing-unhandled", "{idle}");

    // A tick that leaves an event unhandled wakes the supervisor itself, once.
    let report = first_tick(&scene);
    assert_eq!(report["wakes"], 1, "{report}");
    let start = serde_json::json!(["session", "start", "supervisor", "--name", "demo", "--json"]);
    assert_eq!(scene.payload_calls(), vec![start.clone()]);
    // A wake inside the start window leaves that start alone.
    let again = scene.data(&["supervisor", "wake", "--json"]);
    assert_eq!(again["outcome"], "starting", "{again}");
    assert_eq!(scene.payload_calls().len(), 1);

    // With the last start long past and no live supervisor, the wake door starts one.
    fs::remove_file(scene.project().join(".fgos/runtime/supervision/wake.json")).unwrap();
    let woke = scene.data(&["supervisor", "wake", "--json"]);
    assert_eq!(woke["outcome"], "started", "{woke}");
    assert_eq!(scene.payload_calls(), vec![start.clone(), start]);
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
fn a_running_plan_whose_named_lead_role_is_held_by_a_live_non_head_session_reports_lead_live() {
    let scene = Scene::new("plans-lead", WATCHER_CONFIG);
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
    let view = scene.data(&["supervisor", "plans", "--json"]);
    assert_eq!(view["plans"][0]["leadLive"], true, "{view}");
    assert_eq!(view["leadsLive"], 1, "{view}");
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
    assert_eq!(request["verb"], "supervisor queue");
    assert_eq!(request["args"], serde_json::json!({}));
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
    assert_eq!(request["verb"], "supervisor handled");
    assert_eq!(
        request["args"],
        serde_json::json!({"events": ["a1", "b2", "c3"]})
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
        terminal: Some(fgos_identity::directory::TerminalIds {
            driver: "herdr".to_string(),
            key: None,
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
    // With an event naming the session the gate opens; the scene has no terminal host, so the terminal port refuses.
    let typed = scene.run(&args);
    assert!(!typed.status.success(), "{}", text(&typed));
    assert!(
        text(&typed).contains("terminal-refused"),
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
    assert_eq!(raise["verb"], "supervisor raise");
    assert_eq!(
        raise["args"],
        serde_json::json!({"kind": "coordination-help", "ref": "r", "reason": "why"})
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
    assert_eq!(tune["verb"], "watcher tune");
    assert_eq!(
        tune["args"],
        serde_json::json!({"definition": "session-idle", "arm": true, "set": ["sessionIdleLimit=2"]})
    );
    let read = ask(
        &["session", "read", "head:lead-x", "--lines", "30", "--json"],
        None,
    );
    assert_eq!(read["verb"], "session read");
    assert_eq!(
        read["args"],
        serde_json::json!({"target": "head:lead-x", "lines": 30})
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
    assert_eq!(typed["verb"], "session type");
    assert_eq!(
        typed["args"],
        serde_json::json!({"target": "head:lead-x", "text": "go on"})
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
    assert_eq!(prune["verb"], "metrics prune");
    assert_eq!(
        prune["args"],
        serde_json::json!({"apply": true, "settled": ["session:a"]})
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
