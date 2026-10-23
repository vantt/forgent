//! The mailbox's host routes as processes: the native `hook mailbox` kind
//! (served before the composition root, other hook kinds still legacy) and
//! the `mailbox send|inbox [--claim]` verbs. One wiring proof per path; the
//! behaviours behind them are owned by the store's tests
//! (`packages/mailbox/rust/store/tests/`).
#![cfg(unix)]

use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Command, Output, Stdio};

fn fgos_bin() -> PathBuf {
    PathBuf::from(env!("CARGO_BIN_EXE_fgos"))
}

fn repo_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..")
}

/// The writer key the recorded Claude Code payloads name.
const WRITER: &str = "00000000-0000-4000-8000-000000000001";

fn git(dir: &Path, args: &[&str]) {
    let out = Command::new("git")
        .arg("-C")
        .arg(dir)
        .args(args)
        .env("GIT_CONFIG_GLOBAL", "/dev/null")
        .env("GIT_CONFIG_NOSYSTEM", "1")
        .output()
        .unwrap();
    assert!(out.status.success(), "git {args:?}: {out:?}");
}

/// A temporary tree: a main checkout `main/` with `.fgos`, a `HOME`, and a
/// directory outside every repository.
struct Scene {
    root: PathBuf,
}

impl Scene {
    fn new(tag: &str) -> Self {
        let root = std::env::temp_dir().join(format!(
            "fgos-mailbox-routes-{tag}-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(root.join("outside")).unwrap();
        fs::create_dir_all(root.join("home/.claude/sessions")).unwrap();
        git(&root, &["init", "-q", "--initial-branch=trunk", "main"]);
        fs::create_dir_all(root.join("main/.fgos")).unwrap();
        Self {
            root: fs::canonicalize(root).unwrap(),
        }
    }

    fn main(&self) -> PathBuf {
        self.root.join("main")
    }

    fn home(&self) -> PathBuf {
        self.root.join("home")
    }

    fn mailbox_dir(&self) -> PathBuf {
        self.main().join(".fgos/runtime/mailbox")
    }

    /// A command with only the variables the mailbox reads, as `writer`.
    fn command(&self, cwd: &Path, writer: Option<&str>) -> Command {
        let mut command = Command::new(fgos_bin());
        command
            .current_dir(cwd)
            .env_clear()
            .env("HOME", self.home())
            .env("PATH", std::env::var_os("PATH").unwrap_or_default());
        if let Some(writer) = writer {
            command.env("FGOS_SESSION_ID", writer);
        }
        command
    }

    /// `fgos <args>` from `cwd` as `writer`, with `stdin`.
    fn run(&self, cwd: &Path, writer: Option<&str>, args: &[&str], stdin: &[u8]) -> Output {
        self.run_env(cwd, writer, args, stdin, &[])
    }

    /// [`Scene::run`] with `env` added to the command's variables.
    fn run_env(
        &self,
        cwd: &Path,
        writer: Option<&str>,
        args: &[&str],
        stdin: &[u8],
        env: &[(&str, &Path)],
    ) -> Output {
        let mut child = self
            .command(cwd, writer)
            .envs(env.iter().copied())
            .args(args)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .unwrap();
        let _ = child.stdin.take().unwrap().write_all(stdin);
        child.wait_with_output().unwrap()
    }

    /// The hook as Claude Code runs it: through `/bin/sh` (not exec'd), so
    /// this test process is the head; its session file names it.
    fn claude_hook(&self, event: &str, payload: &[u8]) -> Output {
        self.hook_as_head(&["--cli", "claude", "--event", event], payload)
    }

    /// `fgos hook mailbox <flags>` run the way [`Scene::claude_hook`] runs
    /// it, so a call that parses as Claude Code's reaches the record.
    fn hook_as_head(&self, flags: &[&str], payload: &[u8]) -> Output {
        self.hook_as_head_env(flags, payload, &[])
    }

    /// [`Scene::hook_as_head`] with `env` added to the hook's variables.
    fn hook_as_head_env(&self, flags: &[&str], payload: &[u8], env: &[(&str, &Path)]) -> Output {
        let own = fgos_process::facts::self_identity().unwrap();
        let pid = std::process::id();
        let session = serde_json::json!({
            "pid": pid,
            "sessionId": WRITER,
            "procStart": own.start_time,
            "kind": "interactive",
            "entrypoint": "sdk-cli",
            "name": "routes-test-5c",
            "nameSource": "derived",
        });
        fs::write(
            self.home().join(format!(".claude/sessions/{pid}.json")),
            session.to_string(),
        )
        .unwrap();
        let mut child = Command::new("/bin/sh")
            .args(["-c", "\"$0\" \"$@\"; :"])
            .arg(fgos_bin())
            .args(["hook", "mailbox"])
            .args(flags)
            .current_dir(self.main())
            .env_clear()
            .env("HOME", self.home())
            .env("PATH", std::env::var_os("PATH").unwrap_or_default())
            .env("CLAUDE_CODE_SESSION_ID", WRITER)
            .envs(env.iter().copied())
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .unwrap();
        child.stdin.take().unwrap().write_all(payload).unwrap();
        child.wait_with_output().unwrap()
    }

    /// The registered head's short name, from the snapshot.
    fn head_name(&self) -> String {
        let snapshot: serde_json::Value = serde_json::from_slice(
            &fs::read(self.mailbox_dir().join("record/snapshot.json")).unwrap(),
        )
        .unwrap();
        let bindings = snapshot["bindings"].as_object().unwrap();
        bindings.values().next().unwrap()["name"]
            .as_str()
            .unwrap()
            .to_string()
    }

    /// The state of every message in the snapshot.
    fn message_states(&self) -> Vec<String> {
        let snapshot: serde_json::Value = serde_json::from_slice(
            &fs::read(self.mailbox_dir().join("record/snapshot.json")).unwrap(),
        )
        .unwrap();
        snapshot["messages"]
            .as_array()
            .unwrap()
            .iter()
            .map(|m| {
                m["state"]
                    .as_str()
                    .map(String::from)
                    .or_else(|| {
                        m["state"]
                            .as_object()
                            .and_then(|o| o.keys().next().cloned())
                    })
                    .unwrap()
            })
            .collect()
    }
}

impl Drop for Scene {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.root);
    }
}

/// The recorded Claude Code `PostToolUse` payload.
fn post_tool_use() -> Vec<u8> {
    fs::read(
        repo_root().join("packages/mailbox/contracts/fixtures/hooks/claude/post-tool-use.json"),
    )
    .unwrap()
}

/// A spy `node` first on `PATH` that logs each start; returns its log.
fn node_spy(dir: &Path) -> (String, PathBuf) {
    use std::os::unix::fs::PermissionsExt;
    let real =
        String::from_utf8(Command::new("which").arg("node").output().unwrap().stdout).unwrap();
    let log = dir.join("spy.log");
    let spy = dir.join("node");
    fs::create_dir_all(dir).unwrap();
    fs::write(
        &spy,
        format!(
            "#!/bin/sh\necho start >> '{}'\nexec '{}' \"$@\"\n",
            log.display(),
            real.trim()
        ),
    )
    .unwrap();
    fs::set_permissions(&spy, fs::Permissions::from_mode(0o755)).unwrap();
    let path = format!(
        "{}:{}",
        dir.display(),
        std::env::var("PATH").unwrap_or_default()
    );
    (path, log)
}

#[test]
fn hook_mailbox_runs_natively_and_spawns_no_node() {
    let scene = Scene::new("native");
    let (path, log) = node_spy(&scene.root.join("spy"));
    let out = scene
        .command(&scene.main(), None)
        .env("PATH", path)
        .args([
            "hook",
            "mailbox",
            "--cli",
            "claude",
            "--event",
            "post-tool-use",
        ])
        .stdin(Stdio::null())
        .output()
        .unwrap();
    assert_eq!(out.status.code(), Some(0));
    assert!(out.stdout.is_empty() && out.stderr.is_empty(), "{out:?}");
    assert!(!log.exists(), "no node child ran");
}

#[test]
fn other_hook_kinds_still_reach_the_legacy_payload() {
    let scene = Scene::new("legacy");
    let (path, log) = node_spy(&scene.root.join("spy"));
    let out = scene
        .command(&scene.main(), None)
        .env("PATH", path)
        .env("FGOS_ACTIVE_RELEASE_PATH", repo_root())
        .env("FGOS_ACTIVE_MANIFEST_PATH", dev_manifest(&scene.root))
        .args(["hook", "decision-question"])
        .stdin(Stdio::null())
        .output()
        .unwrap();
    let starts = fs::read_to_string(&log).unwrap_or_default().lines().count();
    assert_eq!(starts, 1, "the legacy payload ran once: {out:?}");

    // A help request for the native kind is answered by legacy, which owns help.
    let out = scene
        .command(&scene.main(), None)
        .env(
            "PATH",
            std::env::var("PATH")
                .map(|p| format!("{}:{p}", scene.root.join("spy").display()))
                .unwrap(),
        )
        .env("FGOS_ACTIVE_RELEASE_PATH", repo_root())
        .env("FGOS_ACTIVE_MANIFEST_PATH", dev_manifest(&scene.root))
        .args(["hook", "mailbox", "--help"])
        .stdin(Stdio::null())
        .output()
        .unwrap();
    let starts = fs::read_to_string(&log).unwrap_or_default().lines().count();
    assert_eq!(starts, 2, "help reached the legacy payload: {out:?}");
}

/// A development manifest naming the checkout's legacy-node entry.
fn dev_manifest(dir: &Path) -> PathBuf {
    use sha2::{Digest, Sha256};
    let digest = format!(
        "sha256:{:x}",
        Sha256::digest(fs::read(repo_root().join("bin/fgos.mjs")).unwrap())
    );
    let mut manifest = serde_json::json!({
        "schemaVersion": 1,
        "entries": { "fgos": "target/debug/fgos" },
        "components": { "legacyNode": { "root": ".", "entry": "bin/fgos.mjs", "digest": digest } },
        "requires": { "node": ">=18" },
        "target": { "os": "linux", "arch": "x64" },
        "stateSchemas": { "read": ["2"], "write": ["2"], "migrations": [] },
        "files": [{ "path": "bin/fgos.mjs", "kind": "file", "digest": digest, "mode": "755", "class": "legacy-node" }],
    });
    let canonical = fgos_distribution::verify::to_canonical_json(&manifest);
    manifest["artifactDigest"] =
        serde_json::json!(format!("sha256:{:x}", Sha256::digest(canonical.as_bytes())));
    let path = dir.join("manifest.json");
    fs::write(&path, serde_json::to_string_pretty(&manifest).unwrap()).unwrap();
    path
}

#[test]
fn every_hook_mailbox_usage_error_exits_0_with_empty_stdout_and_stderr() {
    let scene = Scene::new("usage");
    let base = ["hook", "mailbox"];
    let cases: &[&[&str]] = &[
        &["--cli", "claude", "--event", "stop", "--x", "y"],
        &["--cli", "claude"],
        &["--cli", "agy", "--event", "stop"],
        &["--cli", "claude", "--event", "pre-tool-use"],
        &["--cli", "claude", "--event", "stop", "extra"],
        &["--cli", "claude", "--cli", "codex", "--event", "stop"],
        &["--cli"],
    ];
    for case in cases {
        let args: Vec<&str> = base.iter().chain(case.iter()).copied().collect();
        let out = scene.run(&scene.main(), Some(WRITER), &args, &post_tool_use());
        assert_eq!(out.status.code(), Some(0), "{case:?}");
        assert!(
            out.stdout.is_empty() && out.stderr.is_empty(),
            "{case:?}: {out:?}"
        );
    }
    // A repeated flag is a usage error even when its last value would make a
    // call that reaches the record: run as the head, it still touches nothing.
    let repeated: [&[&str]; 2] = [
        &[
            "--cli",
            "codex",
            "--cli",
            "claude",
            "--event",
            "post-tool-use",
        ],
        &[
            "--cli",
            "claude",
            "--event",
            "stop",
            "--event",
            "post-tool-use",
        ],
    ];
    for flags in repeated {
        let out = scene.hook_as_head(flags, &post_tool_use());
        assert_eq!(out.status.code(), Some(0), "{flags:?}");
    }
    assert!(
        !scene.mailbox_dir().exists(),
        "no usage error touched the record"
    );
}

#[test]
fn hook_mailbox_outside_a_repository_or_without_dot_fgos_or_home_is_quiet_and_exits_0() {
    let scene = Scene::new("quiet");
    let hook = ["hook", "mailbox", "--cli", "claude", "--event", "stop"];
    let outside = scene.root.join("outside");
    let out = scene.run(&outside, Some(WRITER), &hook, &post_tool_use());
    assert_eq!(out.status.code(), Some(0));
    assert!(out.stdout.is_empty() && out.stderr.is_empty());

    git(&scene.root, &["init", "-q", "bare-of-fgos"]);
    let out = scene.run(
        &scene.root.join("bare-of-fgos"),
        Some(WRITER),
        &hook,
        &post_tool_use(),
    );
    assert_eq!(out.status.code(), Some(0));
    assert!(out.stdout.is_empty() && out.stderr.is_empty());

    // HOME unset: quiet before anything is resolved, so nothing is created
    // relative to the cwd either (tsk-43x4).
    let out = Command::new(fgos_bin())
        .args(hook)
        .current_dir(scene.main())
        .env_clear()
        .env("PATH", std::env::var_os("PATH").unwrap_or_default())
        .env("FGOS_SESSION_ID", WRITER)
        .stdin(Stdio::null())
        .output()
        .unwrap();
    assert_eq!(out.status.code(), Some(0));
    assert!(out.stdout.is_empty() && out.stderr.is_empty(), "{out:?}");
    assert!(!scene.main().join(".local").exists());
    assert!(!scene.mailbox_dir().exists());
}

#[test]
fn hook_mailbox_and_the_verbs_use_the_main_checkouts_record_from_a_linked_worktree_a_subdirectory_and_claude_project_dir(
) {
    let scene = Scene::new("roots");
    git(
        &scene.main(),
        &[
            "-c",
            "user.name=F",
            "-c",
            "user.email=f@example.invalid",
            "commit",
            "-q",
            "--allow-empty",
            "-m",
            "first",
        ],
    );
    git(&scene.main(), &["worktree", "add", "-q", "../linked"]);
    let linked = scene.root.join("linked");
    fs::create_dir_all(linked.join(".fgos")).unwrap();
    fs::create_dir_all(linked.join("deep/er")).unwrap();
    let send = ["mailbox", "send", "--to", "nobody", "hi"];

    let out = scene.run(&linked.join("deep/er"), Some("sender-a"), &send, b"");
    assert_eq!(out.status.code(), Some(1), "{out:?}");
    assert!(
        scene.mailbox_dir().join("record").is_dir(),
        "the main checkout's record"
    );
    assert!(
        !linked.join(".fgos/runtime").exists(),
        "never the worktree's .fgos"
    );

    fs::remove_dir_all(scene.mailbox_dir()).unwrap();
    let out = scene
        .command(&scene.root.join("outside"), Some("sender-a"))
        .env("CLAUDE_PROJECT_DIR", &linked)
        .args(send)
        .stdin(Stdio::null())
        .output()
        .unwrap();
    assert_eq!(out.status.code(), Some(1), "{out:?}");
    assert!(
        scene.mailbox_dir().join("record").is_dir(),
        "CLAUDE_PROJECT_DIR, not the cwd, chose the repository"
    );
}

#[test]
fn the_verbs_name_a_place_with_no_record_as_permanent_and_a_relative_worktree_as_its_main_checkout()
{
    let scene = Scene::new("unavailable");
    let commit = [
        "-c",
        "user.name=F",
        "-c",
        "user.email=f@example.invalid",
        "commit",
        "-q",
        "--allow-empty",
        "-m",
        "first",
    ];
    git(&scene.main(), &commit);
    let inbox = ["mailbox", "inbox"];
    let permanent = |out: &Output, code: &str| {
        let stdout = String::from_utf8_lossy(&out.stdout);
        assert_eq!(out.status.code(), Some(1), "{out:?}");
        assert!(stdout.contains(&format!("({code})")), "{stdout}");
        assert!(
            stdout.contains("trying again will not change that"),
            "{stdout}"
        );
    };
    permanent(
        &scene.run(&scene.root.join("outside"), Some("a"), &inbox, b""),
        "no-repository",
    );

    git(
        &scene.root,
        &["init", "-q", "--initial-branch=trunk", "child"],
    );
    git(&scene.root.join("child"), &commit);
    git(
        &scene.main(),
        &[
            "-c",
            "protocol.file.allow=always",
            "submodule",
            "add",
            "-q",
            "../child",
            "sub",
        ],
    );
    permanent(
        &scene.run(&scene.main().join("sub"), Some("a"), &inbox, b""),
        "unsupported-checkout",
    );

    git(
        &scene.main(),
        &[
            "-c",
            "worktree.useRelativePaths=true",
            "worktree",
            "add",
            "-q",
            "../rel",
        ],
    );
    let out = scene.run(&scene.root.join("rel"), Some("a"), &inbox, b"");
    assert_eq!(
        out.status.code(),
        Some(0),
        "a relative worktree reads its main checkout: {out:?}"
    );
}

#[test]
fn a_send_then_a_post_tool_use_hook_with_a_recorded_payload_delivers_and_finishes() {
    let scene = Scene::new("deliver");
    let first = scene.claude_hook("post-tool-use", &post_tool_use());
    assert_eq!(first.status.code(), Some(0));
    assert!(
        first.stdout.is_empty(),
        "the first hook registers: {first:?}"
    );
    let name = scene.head_name();

    let sent = scene.run(
        &scene.main(),
        Some("sender-a"),
        &["mailbox", "send", "--to", &name, "hello from a peer"],
        b"",
    );
    assert_eq!(sent.status.code(), Some(0), "{sent:?}");

    let out = scene.claude_hook("post-tool-use", &post_tool_use());
    assert_eq!(out.status.code(), Some(0));
    let reply: serde_json::Value = serde_json::from_slice(&out.stdout).unwrap();
    let context = reply["hookSpecificOutput"]["additionalContext"]
        .as_str()
        .unwrap();
    assert!(context.contains("| hello from a peer"), "{context}");
    assert_eq!(scene.message_states(), vec!["offered".to_string()]);
}

#[test]
fn mailbox_send_inbox_and_inbox_claim_print_contract_text_and_exit_by_outcome() {
    let scene = Scene::new("verbs");
    let main = scene.main();
    let no_address = "This session has no mailbox address yet; it gets one at its first hook.\n";
    let out = scene.run(&main, Some(WRITER), &["mailbox", "inbox"], b"");
    assert_eq!(
        (
            out.status.code(),
            String::from_utf8_lossy(&out.stdout).into_owned()
        ),
        (Some(0), no_address.to_string())
    );
    let out = scene.run(&main, Some(WRITER), &["mailbox", "inbox", "--claim"], b"");
    assert_eq!(
        (
            out.status.code(),
            String::from_utf8_lossy(&out.stdout).into_owned()
        ),
        (Some(0), no_address.to_string())
    );
    let out = scene.run(
        &main,
        Some("sender-a"),
        &["mailbox", "send", "--to", "nobody", "hi"],
        b"",
    );
    assert_eq!(out.status.code(), Some(1));
    assert!(
        String::from_utf8_lossy(&out.stdout).starts_with("Refused: unknown-name."),
        "{out:?}"
    );
    let out = scene.run(&main, Some("sender-a"), &["mailbox", "send", "hi"], b"");
    assert_eq!(
        out.status.code(),
        Some(4),
        "a send without --to is a usage error"
    );
    assert!(out.stdout.is_empty());
    let out = scene.run(
        &main,
        Some("sender-a"),
        &["mailbox", "send", "--bogus", "hi"],
        b"",
    );
    assert_eq!(
        out.status.code(),
        Some(4),
        "an unknown flag is a usage error"
    );

    scene.claude_hook("post-tool-use", &post_tool_use());
    let name = scene.head_name();
    let out = scene.run(
        &main,
        Some("sender-a"),
        &[
            "mailbox",
            "send",
            "--to",
            &name,
            "--",
            "--looks like a flag",
        ],
        b"",
    );
    assert_eq!(out.status.code(), Some(0), "{out:?}");
    assert!(String::from_utf8_lossy(&out.stdout).starts_with("recorded "));
    let listed = scene.run(&main, Some(WRITER), &["mailbox", "inbox"], b"");
    assert!(
        String::from_utf8_lossy(&listed.stdout).contains("state=recorded"),
        "{listed:?}"
    );
}

#[test]
fn inbox_claim_writes_its_frames_once_and_finishes_only_after_the_write() {
    let scene = Scene::new("claim");
    let main = scene.main();
    scene.claude_hook("post-tool-use", &post_tool_use());
    let name = scene.head_name();
    scene.run(
        &main,
        Some("sender-a"),
        &["mailbox", "send", "--to", &name, "first"],
        b"",
    );

    // A stdout whose reader is gone: the write fails and nothing finishes.
    let mut child = scene
        .command(&main, Some(WRITER))
        .args(["mailbox", "inbox", "--claim"])
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .unwrap();
    drop(child.stdout.take());
    let status = child.wait().unwrap();
    assert_eq!(status.code(), Some(1), "an unwritten claim is not done");
    assert_eq!(scene.message_states(), vec!["in-flight".to_string()]);

    // A fresh message is claimed, written once and finished.
    scene.run(
        &main,
        Some("sender-a"),
        &["mailbox", "send", "--to", &name, "second"],
        b"",
    );
    let out = scene.run(&main, Some(WRITER), &["mailbox", "inbox", "--claim"], b"");
    assert_eq!(out.status.code(), Some(0), "{out:?}");
    let text = String::from_utf8_lossy(&out.stdout);
    assert_eq!(text.matches("| second").count(), 1, "{text}");
    assert_eq!(
        scene.message_states(),
        vec!["in-flight".to_string(), "offered".to_string()]
    );
}

#[test]
fn json_flag_wraps_the_same_answer_in_the_envelope() {
    let scene = Scene::new("json");
    let out = scene.run(
        &scene.main(),
        Some("sender-a"),
        &["mailbox", "send", "--to", "nobody", "hi", "--json"],
        b"",
    );
    assert_eq!(out.status.code(), Some(1));
    let envelope: serde_json::Value = serde_json::from_slice(&out.stdout).unwrap();
    assert_eq!(envelope["contract"], "fgos.v1");
    assert_eq!(envelope["data"]["recorded"], false);
    assert!(envelope["data"]["text"]
        .as_str()
        .unwrap()
        .starts_with("Refused: unknown-name."));
    let out = scene.run(
        &scene.main(),
        Some(WRITER),
        &["mailbox", "inbox", "--json"],
        b"",
    );
    let envelope: serde_json::Value = serde_json::from_slice(&out.stdout).unwrap();
    assert_eq!(
        envelope["data"]["text"],
        "This session has no mailbox address yet; it gets one at its first hook."
    );
}

/// A copy of `/bin/sh` named `codex`: an executable whose file name is the
/// one the adapters contract lists for Codex's head, standing at the direct
/// head position (the entry is its child; `; :` keeps it from exec'ing).
fn codex_like(dir: &Path) -> PathBuf {
    let bin = dir.join("bin/codex");
    if !bin.exists() {
        fs::create_dir_all(bin.parent().unwrap()).unwrap();
        // Copied by a child process, so no descriptor open for writing is
        // inherited by a sibling test's fork (which would make the exec
        // fail with "text file busy").
        let status = Command::new("install")
            .args(["-m", "755"])
            .arg(fs::canonicalize("/bin/sh").unwrap())
            .arg(&bin)
            .status()
            .unwrap();
        assert!(status.success());
    }
    bin
}

/// The Codex hook through `codex_like` with `home` (or none), and a
/// `CLAUDE_PROJECT_DIR` its environment may carry.
fn codex_hook(scene: &Scene, home: Option<&Path>, claude_project_dir: Option<&Path>) -> Output {
    let mut payload: serde_json::Value = serde_json::from_slice(
        &fs::read(
            repo_root().join("packages/mailbox/contracts/fixtures/hooks/codex/post-tool-use.json"),
        )
        .unwrap(),
    )
    .unwrap();
    payload["session_id"] = serde_json::Value::from(WRITER);
    let mut command = Command::new(codex_like(&scene.root));
    command
        .args(["-c", "\"$0\" \"$@\"; :"])
        .arg(fgos_bin())
        .args([
            "hook",
            "mailbox",
            "--cli",
            "codex",
            "--event",
            "post-tool-use",
        ])
        .current_dir(scene.main())
        .env_clear()
        .env("PATH", std::env::var_os("PATH").unwrap_or_default())
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    if let Some(home) = home {
        command.env("HOME", home);
    }
    if let Some(dir) = claude_project_dir {
        command.env("CLAUDE_PROJECT_DIR", dir);
    }
    let mut child = command.spawn().unwrap();
    child
        .stdin
        .take()
        .unwrap()
        .write_all(&serde_json::to_vec(&payload).unwrap())
        .unwrap();
    child.wait_with_output().unwrap()
}

#[test]
fn a_codex_hook_registers_from_its_payload_only_when_home_is_set() {
    let scene = Scene::new("codex-home");
    let out = codex_hook(&scene, None, None);
    assert_eq!(out.status.code(), Some(0));
    assert!(out.stdout.is_empty() && out.stderr.is_empty(), "{out:?}");
    assert!(
        !scene.mailbox_dir().exists(),
        "without HOME the hook resolves nothing"
    );
    assert!(!scene.main().join(".local").exists());

    // A Claude Code variable a Codex session inherited never picks the record.
    git(
        &scene.root,
        &["init", "-q", "--initial-branch=trunk", "other"],
    );
    fs::create_dir_all(scene.root.join("other/.fgos")).unwrap();
    let out = codex_hook(&scene, Some(&scene.home()), Some(&scene.root.join("other")));
    assert_eq!(out.status.code(), Some(0), "{out:?}");
    assert!(
        !scene.root.join("other/.fgos/runtime").exists(),
        "CLAUDE_PROJECT_DIR is read for Claude Code only"
    );
    assert!(
        scene.head_name().starts_with("main-codex"),
        "{}",
        scene.head_name()
    );
}

#[test]
fn a_hook_payload_over_the_read_cap_leaves_its_reason_in_the_hook_outcome_file() {
    let scene = Scene::new("outcome");
    // Identity can take the head, so the registering call is benign too.
    identity_root(&scene);
    // The file goes only into a mailbox directory that exists: the head's
    // first call registers it.
    let out = scene.claude_hook("post-tool-use", &post_tool_use());
    assert_eq!(out.status.code(), Some(0), "{out:?}");
    assert!(
        !scene.mailbox_dir().join("hook-outcome.json").exists(),
        "a benign call writes no outcome"
    );
    fs::write(
        scene.main().join(".fgos/config.json"),
        r#"{"mailbox":{"hook":{"maxReadBytes":16}}}"#,
    )
    .unwrap();
    let out = scene.claude_hook("post-tool-use", &post_tool_use());
    assert_eq!(out.status.code(), Some(0), "{out:?}");
    assert!(out.stdout.is_empty(), "{out:?}");
    let line: serde_json::Value = serde_json::from_slice(
        &fs::read(scene.mailbox_dir().join("hook-outcome.json"))
            .expect("the entry recorded the skipped drain"),
    )
    .unwrap();
    assert_eq!(line["reason"], "over-read-cap");
    assert_eq!(line["cli"], "claude");
}

#[test]
fn a_send_with_wake_to_a_codex_head_answers_that_it_takes_no_mail_at_its_turn_end_and_the_wake_was_not_used(
) {
    let scene = Scene::new("codex-no-stop");
    // The Codex head stays alive after its hook, so the send can reach it.
    let mut payload: serde_json::Value = serde_json::from_slice(
        &fs::read(
            repo_root().join("packages/mailbox/contracts/fixtures/hooks/codex/post-tool-use.json"),
        )
        .unwrap(),
    )
    .unwrap();
    payload["session_id"] = serde_json::Value::from(WRITER);
    let payload_file = scene.root.join("codex-payload.json");
    fs::write(&payload_file, serde_json::to_vec(&payload).unwrap()).unwrap();
    let mut head = Command::new(codex_like(&scene.root))
        .args([
            "-c",
            "\"$0\" hook mailbox --cli codex --event post-tool-use < \"$1\"; exec sleep 30",
        ])
        .arg(fgos_bin())
        .arg(&payload_file)
        .current_dir(scene.main())
        .env_clear()
        .env("HOME", scene.home())
        .env("PATH", std::env::var_os("PATH").unwrap_or_default())
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .unwrap();
    let snapshot = scene.mailbox_dir().join("record/snapshot.json");
    for _ in 0..200 {
        if snapshot.exists() {
            break;
        }
        std::thread::sleep(std::time::Duration::from_millis(25));
    }
    let name = scene.head_name();

    let sent = scene.run(
        &scene.main(),
        Some("sender-a"),
        &["mailbox", "send", "--wake", "--to", &name, "wake up"],
        b"",
    );
    assert_eq!(sent.status.code(), Some(0), "{sent:?}");
    let text = String::from_utf8_lossy(&sent.stdout);
    assert!(
        text.contains(
            "queued: it sees it at its next tool call. This CLI takes no mail when its turn ends"
        ),
        "{text}"
    );
    assert!(
        text.contains("Its CLI has no channel that can wake it; the wake was not used."),
        "{text}"
    );
    assert!(!text.contains("or when its turn ends."), "{text}");
    let _ = head.kill();
    let _ = head.wait();
}

/// Identity's state root of the scene: the default under its `HOME`, with a
/// machine id minted the way `fgos doctor --fix` mints it.
fn identity_root(scene: &Scene) -> PathBuf {
    let root = scene.home().join(".local/state/fgos");
    fs::create_dir_all(&root).unwrap();
    fgos_identity::machine::mint(&root, "routes-test").unwrap();
    root
}

/// Identity's id and handle of the session `key` of `source`.
fn identity_of(root: &Path, source: &str, key: &str) -> fgos_identity::SessionInfo {
    fgos_identity::session_for(
        root,
        &fgos_identity::resolve::WriterKey { source, value: key },
    )
    .unwrap()
    .info
}

/// Registers a session in Identity's directory through Identity's own door,
/// with this test process as its live head.
fn register_identity(root: &Path, source: &str, key: &str, roles: &[&str]) -> String {
    let info = identity_of(root, source, key);
    let entry = fgos_identity::directory::Entry::new(
        info.id,
        info.handle.clone(),
        "claude".to_string(),
        None,
        None,
        roles.iter().map(|r| r.to_string()).collect(),
        fgos_identity::current::os_record(std::process::id()),
    );
    fgos_identity::directory::register(root, entry, false, &fgos_process::facts::judge_here)
        .unwrap();
    info.handle
}

/// A scene whose record holds one live Claude Code head (this test process,
/// key `WRITER`), and Identity's root.
fn scene_with_head(tag: &str) -> (Scene, PathBuf) {
    let scene = Scene::new(tag);
    let root = identity_root(&scene);
    let out = scene.claude_hook("post-tool-use", &post_tool_use());
    assert_eq!(out.status.code(), Some(0), "{out:?}");
    (scene, root)
}

fn send_to(scene: &Scene, to: &str, json: bool) -> Output {
    let mut args = vec!["mailbox", "send", "--to", to];
    if json {
        args.push("--json");
    }
    args.push("hi");
    scene.run(&scene.main(), Some("sender-a"), &args, b"")
}

#[test]
fn a_handle_identity_resolves_to_a_session_that_is_not_a_head_of_this_record_is_refused_unknown_name_and_says_it_has_no_address_here(
) {
    let (scene, root) = scene_with_head("alias-elsewhere");
    let elsewhere = register_identity(
        &root,
        "CLAUDE_CODE_SESSION_ID",
        "00000000-0000-4000-8000-0000000000ee",
        &[],
    );

    let out = send_to(&scene, &elsewhere, false);

    assert_eq!(out.status.code(), Some(1), "{out:?}");
    assert_eq!(
        String::from_utf8_lossy(&out.stdout),
        "Refused: unknown-name. Candidates: none.\nThat session has no mailbox address in this project.\n"
    );
    assert!(scene.message_states().is_empty());
}

#[test]
fn send_to_a_role_reaches_the_head_of_this_record_that_holds_it_and_names_the_holder() {
    let (scene, root) = scene_with_head("alias-role");
    let handle = register_identity(&root, "CLAUDE_CODE_SESSION_ID", WRITER, &["lead:MAIL"]);

    let out = send_to(&scene, "lead:MAIL", false);

    assert_eq!(out.status.code(), Some(0), "{out:?}");
    let text = String::from_utf8_lossy(&out.stdout);
    assert!(
        text.starts_with("recorded ") && text.contains(&format!(" for {}", scene.head_name())),
        "{text}"
    );
    assert!(
        text.ends_with(&format!(
            "delivered to the current holder of lead:MAIL, {handle}\n"
        )),
        "{text}"
    );
    assert_eq!(scene.message_states(), vec!["recorded".to_string()]);
}

#[test]
fn send_to_an_alias_lists_only_this_records_heads_as_candidates() {
    let (scene, root) = scene_with_head("alias-candidates");
    let ours = register_identity(&root, "CLAUDE_CODE_SESSION_ID", WRITER, &[]);
    let foreign = register_identity(
        &root,
        "CLAUDE_CODE_SESSION_ID",
        "00000000-0000-4000-8000-0000000000ff",
        &[],
    );

    let out = send_to(&scene, "@", true);

    assert_eq!(out.status.code(), Some(1), "{out:?}");
    let envelope: serde_json::Value = serde_json::from_slice(&out.stdout).unwrap();
    let data = &envelope["data"];
    let text = data["text"].as_str().unwrap();
    assert!(text.contains(&ours), "{text}");
    assert!(!text.contains(&foreign), "{text}");
    let candidates = data["candidates"].as_array().unwrap();
    assert_eq!(candidates.len(), 1, "{candidates:?}");
    assert_eq!(candidates[0]["handle"], ours);
    assert_eq!(
        candidates[0]["id"],
        identity_of(&root, "CLAUDE_CODE_SESSION_ID", WRITER).id
    );
    assert_eq!(candidates[0]["liveness"], "alive");
}

#[test]
fn a_handle_identity_does_not_know_reaches_the_head_whose_derived_handle_it_is() {
    // The head registers before the machine has an id, so Identity never
    // took it; the id is minted afterwards.
    let scene = Scene::new("alias-derived");
    let out = scene.claude_hook("post-tool-use", &post_tool_use());
    assert_eq!(out.status.code(), Some(0), "{out:?}");
    let root = identity_root(&scene);
    assert!(identity_sessions(&root).is_empty());
    let handle = identity_of(&root, "CLAUDE_CODE_SESSION_ID", WRITER).handle;

    let out = send_to(&scene, &handle, false);

    assert_eq!(out.status.code(), Some(0), "{out:?}");
    assert!(
        String::from_utf8_lossy(&out.stdout).contains(&format!(" for {}", scene.head_name())),
        "{out:?}"
    );
}

/// The sessions Identity's directory under `root` holds.
fn identity_sessions(root: &Path) -> Vec<(String, String)> {
    fgos_identity::directory::list(root, None, false, &fgos_process::facts::judge_here)
        .unwrap()
        .sessions
        .into_iter()
        .map(|s| (s.id, s.handle))
        .collect()
}

fn hook_outcome(scene: &Scene) -> Option<String> {
    let bytes = fs::read(scene.mailbox_dir().join("hook-outcome.json")).ok()?;
    let line: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    line["reason"].as_str().map(String::from)
}

#[test]
fn a_registering_call_registers_the_head_with_identity_once_and_a_second_call_of_the_same_head_does_not_ask_identity(
) {
    let scene = Scene::new("ident-once");
    let root = identity_root(&scene);
    let own = identity_of(&root, "CLAUDE_CODE_SESSION_ID", WRITER);

    let first = scene.claude_hook("post-tool-use", &post_tool_use());

    assert_eq!(first.status.code(), Some(0), "{first:?}");
    assert_eq!(identity_sessions(&root), vec![(own.id, own.handle)]);
    assert_eq!(hook_outcome(&scene), None);
    // Gone from Identity: a refreshing call of the same head does not put it back.
    fs::remove_dir_all(fgos_identity::directory::directory(&root)).unwrap();
    let again = scene.claude_hook("post-tool-use", &post_tool_use());
    assert_eq!(again.status.code(), Some(0), "{again:?}");
    assert!(!fgos_identity::directory::directory(&root).exists());
}

#[test]
fn a_registering_call_whose_handle_identity_already_holds_for_another_id_registers_nothing_and_records_ident_handle_in_use(
) {
    let scene = Scene::new("ident-in-use");
    let root = identity_root(&scene);
    let own = identity_of(&root, "CLAUDE_CODE_SESSION_ID", WRITER);
    let machine = fgos_identity::machine_info(&root).unwrap().id;
    let squatter = format!("{machine}/someone-else");
    let entry = fgos_identity::directory::Entry::new(
        squatter.clone(),
        own.handle.clone(),
        "claude".to_string(),
        None,
        None,
        Vec::new(),
        fgos_identity::current::os_record(std::process::id()),
    );
    fgos_identity::directory::register(&root, entry, false, &fgos_process::facts::judge_here)
        .unwrap();

    let out = scene.claude_hook("post-tool-use", &post_tool_use());

    assert_eq!(out.status.code(), Some(0), "{out:?}");
    assert_eq!(identity_sessions(&root), vec![(squatter, own.handle)]);
    assert_eq!(hook_outcome(&scene).as_deref(), Some("ident-handle-in-use"));
}

#[test]
fn a_hook_call_whose_identity_step_fails_still_exits_0_with_empty_stdout_and_records_the_failure() {
    let scene = Scene::new("ident-fails");
    // No machine id: Identity refuses to name the session.

    let out = scene.claude_hook("post-tool-use", &post_tool_use());

    assert_eq!(out.status.code(), Some(0));
    assert!(out.stdout.is_empty() && out.stderr.is_empty(), "{out:?}");
    assert!(
        scene.head_name().starts_with("main-claude"),
        "still registered in the mailbox"
    );
    assert_eq!(
        hook_outcome(&scene).as_deref(),
        Some("ident:machine-id-missing")
    );
}

#[test]
fn the_hook_and_a_sender_resolve_the_same_identity_state_root_under_an_explicit_fgos_state_root() {
    let scene = Scene::new("ident-root");
    let pinned = scene.root.join("pinned-state");
    fs::create_dir_all(&pinned).unwrap();
    fgos_identity::machine::mint(&pinned, "routes-test").unwrap();
    let env = [("FGOS_STATE_ROOT", pinned.as_path())];

    let out = scene.hook_as_head_env(
        &["--cli", "claude", "--event", "post-tool-use"],
        &post_tool_use(),
        &env,
    );

    assert_eq!(out.status.code(), Some(0), "{out:?}");
    let own = identity_of(&pinned, "CLAUDE_CODE_SESSION_ID", WRITER);
    assert_eq!(
        identity_sessions(&pinned),
        vec![(own.id, own.handle.clone())]
    );
    assert!(
        !scene.home().join(".local/state/fgos").exists(),
        "HOME's root untouched"
    );
    let sent = scene.run_env(
        &scene.main(),
        Some("sender-a"),
        &["mailbox", "send", "--to", &own.handle, "hi"],
        b"",
        &env,
    );
    assert_eq!(sent.status.code(), Some(0), "{sent:?}");
    // Without the pinned root the sender reads HOME's, which knows no machine.
    let unpinned = send_to(&scene, &own.handle, false);
    assert_eq!(unpinned.status.code(), Some(1), "{unpinned:?}");
}

#[test]
fn mailbox_list_and_status_run_natively_read_the_record_and_create_nothing() {
    let scene = Scene::new("list-status");
    let (path, log) = node_spy(&scene.root.join("spy"));
    let native = |args: &[&str]| {
        scene
            .command(&scene.main(), Some("sender-a"))
            .env("PATH", &path)
            .args(args)
            .stdin(Stdio::null())
            .output()
            .unwrap()
    };

    let empty = native(&["mailbox", "status", "--json"]);
    assert_eq!(empty.status.code(), Some(0), "{empty:?}");
    let envelope: serde_json::Value = serde_json::from_slice(&empty.stdout).unwrap();
    assert_eq!(envelope["data"]["record"], "none");
    assert!(
        !scene.main().join(".fgos/runtime").exists(),
        "status created nothing"
    );
    let none = native(&["mailbox", "list"]);
    assert_eq!(
        String::from_utf8_lossy(&none.stdout),
        "No heads in this project's mailbox yet.\n"
    );
    assert!(
        !scene.main().join(".fgos/runtime").exists(),
        "list created nothing"
    );

    let root = identity_root(&scene);
    scene.claude_hook("post-tool-use", &post_tool_use());
    let handle = identity_of(&root, "CLAUDE_CODE_SESSION_ID", WRITER).handle;
    let listed = native(&["mailbox", "list"]);
    assert_eq!(listed.status.code(), Some(0), "{listed:?}");
    assert_eq!(
        String::from_utf8_lossy(&listed.stdout),
        format!(
            "{} {handle} agent=claude tier=turn alive\n",
            scene.head_name()
        )
    );
    let status = native(&["mailbox", "status", "--json"]);
    let envelope: serde_json::Value = serde_json::from_slice(&status.stdout).unwrap();
    assert_eq!(envelope["data"]["record"], "ok");
    assert_eq!(envelope["data"]["heads"], 1);
    assert!(!log.exists(), "no node child ran");
}
