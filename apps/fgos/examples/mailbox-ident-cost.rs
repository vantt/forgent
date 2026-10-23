//! What the hook's registering call costs once Identity is asked (spec §7.5,
//! V7b): the release-built host's `fgos hook mailbox` run as a process, the
//! way Claude Code runs it (through `/bin/sh`, not exec'd, so this process
//! is the head), against an Identity directory seeded with entries through
//! Identity's own `register`.
//!
//! Run by hand, release-built, never in `cargo test`:
//!
//! ```text
//! cargo build --release -p fgos
//! cargo run --release -p fgos --example mailbox-ident-cost -- <parent-dir> [seeded-entries]
//! ```
//!
//! It creates a fresh directory under `<parent-dir>` (a git repository with
//! `.fgos`, a `HOME` and a pinned state root), refuses one that exists, and
//! leaves it for inspection. Three series of 3 warm-up and 50 measured calls:
//! `registering` (each call names a new session key of the same head, so the
//! mailbox replaces the binding and the wiring asks Identity), the same
//! against an empty directory, and `steady` (the same key again: no mailbox
//! write, no Identity call). It prints one JSON object with p50, p95 and max
//! per series, and checks that every registering call added exactly one
//! Identity entry and left no hook-outcome line.
//!
//! The seed defaults to 447 so that the 50 measured registering calls see a
//! directory of 450 to 499 entries and the last one leaves 500: each call
//! adds one live entry, and the directory refuses a write past 512.
use fgos_identity::directory::{directory, list, register, Entry};
use fgos_identity::resolve::WriterKey;
use fgos_process::facts::judge_here;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::Instant;

const WARMUP: usize = 3;
const RUNS: usize = 50;
const SOURCE: &str = "CLAUDE_CODE_SESSION_ID";

fn fail(message: &str) -> ! {
    eprintln!("mailbox-ident-cost: {message}");
    std::process::exit(3)
}

/// The host binary built beside this example (`<target>/release/fgos`).
fn host() -> PathBuf {
    let exe = std::env::current_exe().unwrap_or_else(|_| fail("no current exe"));
    let bin = exe
        .parent()
        .and_then(Path::parent)
        .map(|dir| dir.join("fgos"))
        .unwrap_or_else(|| fail("no target directory"));
    if !bin.is_file() {
        fail(&format!(
            "{} is missing: cargo build --release -p fgos",
            bin.display()
        ));
    }
    bin
}

struct Scene {
    project: PathBuf,
    home: PathBuf,
    state: PathBuf,
}

fn key(series: &str, i: usize) -> String {
    format!("00000000-0000-4000-8000-{series}{i:010}")
}

impl Scene {
    fn new(parent: &Path) -> Self {
        let root = parent.join(format!("mailbox-ident-cost-{}", std::process::id()));
        if root.exists() {
            fail(&format!("{} exists", root.display()));
        }
        let scene = Self {
            project: root.join("project"),
            home: root.join("home"),
            state: root.join("state"),
        };
        for dir in [&scene.home.join(".claude/sessions"), &scene.state] {
            std::fs::create_dir_all(dir).unwrap_or_else(|e| fail(&e.to_string()));
        }
        let status = Command::new("git")
            .args(["init", "-q", "--initial-branch=trunk"])
            .arg(&scene.project)
            .status()
            .unwrap_or_else(|e| fail(&e.to_string()));
        if !status.success() {
            fail("git init failed");
        }
        std::fs::create_dir_all(scene.project.join(".fgos"))
            .unwrap_or_else(|e| fail(&e.to_string()));
        fgos_identity::machine::mint(&scene.state, "ident-cost")
            .unwrap_or_else(|e| fail(&e.to_string()));
        scene
    }

    /// Seeds `n` live entries (this process as their head) through Identity's
    /// own door.
    fn seed(&self, n: usize) {
        let head = fgos_identity::current::os_record(std::process::id());
        for i in 0..n {
            let value = key("5eed", i);
            let info = fgos_identity::session_for(
                &self.state,
                &WriterKey {
                    source: SOURCE,
                    value: &value,
                },
            )
            .unwrap_or_else(|r| fail(&r.detail))
            .info;
            let entry = Entry::new(
                info.id,
                info.handle,
                "claude".into(),
                None,
                None,
                Vec::new(),
                head.clone(),
            );
            register(&self.state, entry, false, &judge_here).unwrap_or_else(|r| fail(&r.detail));
        }
    }

    fn entries(&self) -> usize {
        if !directory(&self.state).exists() {
            return 0;
        }
        list(&self.state, None, false, &judge_here)
            .unwrap_or_else(|r| fail(&r.detail))
            .sessions
            .len()
    }

    /// One hook call as session `value`; its wall time in milliseconds.
    fn call(&self, host: &Path, value: &str) -> f64 {
        let start = fgos_process::facts::self_identity()
            .unwrap_or_else(|| fail("own process facts"))
            .start_time;
        let pid = std::process::id();
        let session = serde_json::json!({
            "pid": pid, "sessionId": value, "procStart": start, "kind": "interactive",
            "entrypoint": "sdk-cli", "name": "ident-cost-5c", "nameSource": "derived",
        });
        std::fs::write(
            self.home.join(format!(".claude/sessions/{pid}.json")),
            session.to_string(),
        )
        .unwrap_or_else(|e| fail(&e.to_string()));
        let payload = serde_json::json!({
            "session_id": value, "hook_event_name": "PostToolUse", "tool_name": "Bash",
            "tool_input": {"command": "true"}, "cwd": self.project,
        })
        .to_string();
        let began = Instant::now();
        let mut child = Command::new("/bin/sh")
            .args(["-c", "\"$0\" \"$@\"; :"])
            .arg(host)
            .args([
                "hook",
                "mailbox",
                "--cli",
                "claude",
                "--event",
                "post-tool-use",
            ])
            .current_dir(&self.project)
            .env_clear()
            .env("HOME", &self.home)
            .env("PATH", std::env::var_os("PATH").unwrap_or_default())
            .env("FGOS_STATE_ROOT", &self.state)
            .env(SOURCE, value)
            .stdin(Stdio::piped())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .unwrap_or_else(|e| fail(&e.to_string()));
        let _ = child
            .stdin
            .take()
            .map(|mut s| s.write_all(payload.as_bytes()));
        let _ = child.wait();
        began.elapsed().as_secs_f64() * 1000.0
    }

    fn outcome(&self) -> Option<String> {
        std::fs::read_to_string(self.project.join(".fgos/runtime/mailbox/hook-outcome.json")).ok()
    }
}

fn stats(mut ms: Vec<f64>) -> serde_json::Value {
    ms.sort_by(f64::total_cmp);
    let at = |p: f64| ms[((p * ms.len() as f64).ceil() as usize).clamp(1, ms.len()) - 1];
    serde_json::json!({ "n": ms.len(), "p50": at(0.5), "p95": at(0.95), "max": ms[ms.len() - 1] })
}

/// `RUNS` registering calls after `WARMUP`, each a new key; checks that each
/// added one Identity entry.
fn registering(scene: &Scene, host: &Path, series: &str) -> Vec<f64> {
    let mut times = Vec::new();
    for i in 0..WARMUP + RUNS {
        let before = scene.entries();
        let ms = scene.call(host, &key(series, i));
        if scene.entries() != before + 1 {
            fail(&format!("{series} call {i} did not add one Identity entry"));
        }
        if i >= WARMUP {
            times.push(ms);
        }
    }
    times
}

fn main() {
    let mut args = std::env::args().skip(1);
    let parent = PathBuf::from(
        args.next()
            .unwrap_or_else(|| fail("usage: <parent-dir> [seeded-entries]")),
    );
    let seeded: usize = args.next().map_or(447, |n| {
        n.parse().unwrap_or_else(|_| fail("seeded-entries"))
    });
    let host = host();

    let empty = Scene::new(&parent.join("empty"));
    let empty_times = registering(&empty, &host, "e000");

    let scene = Scene::new(&parent.join("seeded"));
    scene.seed(seeded);
    let seeded_times = registering(&scene, &host, "a000");
    // The last key is bound now: the same key again refreshes.
    let last = key("a000", WARMUP + RUNS - 1);
    let steady: Vec<f64> = (0..WARMUP + RUNS)
        .map(|_| scene.call(&host, &last))
        .skip(WARMUP)
        .collect();
    if let Some(line) = scene.outcome().or_else(|| empty.outcome()) {
        fail(&format!("a call left a hook-outcome line: {line}"));
    }
    println!(
        "{}",
        serde_json::json!({
            "seededEntries": seeded,
            "entriesAfter": scene.entries(),
            "registeringSeeded": stats(seeded_times),
            "registeringEmpty": stats(empty_times),
            "steady": stats(steady),
            "note": "wall ms from spawning /bin/sh to its exit, release host, FGOS_STATE_ROOT pinned",
        })
    );
}
