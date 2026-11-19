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
            "---\ncontract: plan-v1\ntitle: demo\nstatus: ready\npriority: P2\nfootprint:\n  - src/**\ncreated: 2026-01-01\n---\n\n# Demo\n",
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
fn slots_answers_the_lane_view_and_an_unarmed_pool_has_no_ceiling() {
    let scene = Scene::new("slots", WATCHER_CONFIG);
    let view = scene.data(&["slots", "--json"]);
    let lanes = &view["lanes"];
    assert!(lanes["ceiling"].is_null(), "{view}");
    assert_eq!(lanes["live"], 0, "{view}");
    assert!(lanes["seats"].is_array(), "{view}");

    let armed = Scene::new("slots-armed", "# @fgos:v1\nworkerSlots:\n  ceiling: 3\n");
    let lanes = armed.data(&["slots", "--json"])["lanes"].clone();
    assert_eq!(lanes["ceiling"], 3, "{lanes}");
    assert_eq!(lanes["free"], 3, "{lanes}");
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
