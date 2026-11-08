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
        // A call refused before it reads its payload (a usage error) may close
        // stdin first; the broken pipe is then this writer's, not the hook's.
        let _ = child.stdin.take().unwrap().write_all(payload);
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
    cli_like(dir, "codex")
}

/// A shell under the file name `name`, so the direct head check reads that
/// CLI's head executable (`codex`; pi runs `node`; `omp`).
fn cli_like(dir: &Path, name: &str) -> PathBuf {
    let bin = dir.join("bin").join(name);
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

/// A live pi or omp head running the extension's hook call with `payload`,
/// alive until dropped: for pi, Node titled `pi` (the real head runs the
/// `node` executable and names itself `pi`); for omp, a shell under the file
/// name `omp` (omp's own binary).
struct ExtensionHead(std::process::Child);

impl ExtensionHead {
    fn start(scene: &Scene, cli: &str, key: &str) -> Self {
        let mut payload: serde_json::Value = serde_json::from_slice(
            &fs::read(repo_root().join(format!(
                "packages/mailbox/contracts/fixtures/hooks/{cli}/post-tool-use.json"
            )))
            .unwrap(),
        )
        .unwrap();
        payload["session_id"] = serde_json::Value::from(key);
        let hook = ["hook", "mailbox", "--cli", cli, "--event", "post-tool-use"];
        let mut command = if cli == "pi" {
            let mut node = Command::new("node");
            node.args([
                "-e",
                "process.title = 'pi'; const [bin, ...args] = process.argv.slice(1); \
                 require('child_process').spawnSync(bin, args, { input: require('fs').readFileSync(0), stdio: ['pipe', 'ignore', 'ignore'] }); \
                 setTimeout(() => {}, 60000);",
            ])
            .arg(fgos_bin())
            .args(hook);
            node
        } else {
            let mut sh = Command::new(cli_like(&scene.root, "omp"));
            sh.args(["-c", "\"$0\" \"$@\"; sleep 60"])
                .arg(fgos_bin())
                .args(hook);
            sh
        };
        let mut child = command
            .current_dir(scene.main())
            .env_clear()
            .env("PATH", std::env::var_os("PATH").unwrap_or_default())
            .env("HOME", scene.home())
            .stdin(Stdio::piped())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .unwrap();
        child
            .stdin
            .take()
            .unwrap()
            .write_all(&serde_json::to_vec(&payload).unwrap())
            .unwrap();
        Self(child)
    }

    fn pid(&self) -> u32 {
        self.0.id()
    }
}

impl Drop for ExtensionHead {
    fn drop(&mut self) {
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}

#[test]
fn a_pi_or_omp_head_registers_with_identity_under_its_own_cli_and_is_reached_by_handle_and_by_role()
{
    for cli in ["pi", "omp"] {
        let scene = Scene::new(&format!("{cli}-head"));
        let root = identity_root(&scene);
        let head = ExtensionHead::start(&scene, cli, WRITER);
        let entries = || {
            fgos_identity::directory::list(
                &root,
                None,
                false,
                &fgos_process::facts::judge_here,
                None,
            )
            .map(|listed| listed.sessions)
            .unwrap_or_default()
        };
        let deadline = std::time::Instant::now() + std::time::Duration::from_secs(20);
        while (entries().is_empty() || !scene.mailbox_dir().join("record/snapshot.json").exists())
            && std::time::Instant::now() < deadline
        {
            std::thread::sleep(std::time::Duration::from_millis(50));
        }
        assert!(
            scene.head_name().starts_with(&format!("main-{cli}")),
            "{cli}: {}",
            scene.head_name()
        );
        let outcome =
            fs::read_to_string(scene.mailbox_dir().join("hook-outcome.json")).unwrap_or_default();
        let listed = entries();
        assert_eq!(
            listed.len(),
            1,
            "{cli}: Identity knows the head; outcome {outcome}"
        );
        let entry = &listed[0];
        assert!(
            entry.handle.starts_with(&format!("{cli}-")),
            "{cli}: the handle names the CLI from the head's ancestry: {}",
            entry.handle
        );
        // The head takes a role through Identity's own door.
        let with_role = fgos_identity::directory::Entry::new(
            entry.id.clone(),
            entry.handle.clone(),
            entry.cli.clone(),
            None,
            None,
            vec!["lead:PIOMP".to_string()],
            fgos_identity::current::os_record(head.pid()),
        );
        fgos_identity::directory::register(
            &root,
            with_role,
            true,
            &fgos_process::facts::judge_here,
        )
        .unwrap();
        for to in [entry.handle.as_str(), "lead:PIOMP"] {
            let out = send_to(&scene, to, false);
            assert_eq!(out.status.code(), Some(0), "{cli} {to}: {out:?}");
            let text = String::from_utf8_lossy(&out.stdout);
            assert!(
                text.contains(&format!(" for {}", scene.head_name())),
                "{cli} {to}: {text}"
            );
        }
    }
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
fn a_send_with_wake_to_a_codex_head_on_an_untested_version_says_it_could_not_be_nudged_and_never_promises_its_turn_end(
) {
    let scene = Scene::new("codex-no-stop");
    let _head = CodexHead::start(&scene, WRITER);
    let name = scene.head_name();

    // The version the send reads is the `codex` first on PATH: a stand-in that names a version no contract lists.
    let bin = scene.root.join("untested-codex-bin");
    fs::create_dir_all(&bin).unwrap();
    let program = bin.join("codex");
    fs::write(&program, "#!/bin/sh\necho 'codex-cli 9.9.9'\n").unwrap();
    fs::set_permissions(
        &program,
        std::os::unix::fs::PermissionsExt::from_mode(0o755),
    )
    .unwrap();
    let path = std::env::join_paths(std::iter::once(bin).chain(std::env::split_paths(
        &std::env::var_os("PATH").unwrap_or_default(),
    )))
    .unwrap();
    let sent = scene.run_env(
        &scene.main(),
        Some("sender-a"),
        &["mailbox", "send", "--wake", "--to", &name, "wake up"],
        b"",
        &[("PATH", Path::new(&path))],
    );
    assert_eq!(sent.status.code(), Some(0), "{sent:?}");
    let text = String::from_utf8_lossy(&sent.stdout);
    assert!(
        text.contains("queued: it sees it at its next tool call."),
        "{text}"
    );
    assert!(
        text.contains("It could not be nudged (version-not-tested)"),
        "{text}"
    );
    assert!(!text.contains("or when its turn ends."), "{text}");
}

/// A Codex head that stays alive after its first hook (a copy of `/bin/sh`
/// named `codex` runs the hook with the payload naming `key`, then sleeps),
/// so a send can reach it; killed when dropped. `start` returns once that
/// first hook, its Identity step included, has finished.
struct CodexHead(std::process::Child);

impl CodexHead {
    fn start(scene: &Scene, key: &str) -> Self {
        let mut payload: serde_json::Value = serde_json::from_slice(
            &fs::read(
                repo_root()
                    .join("packages/mailbox/contracts/fixtures/hooks/codex/post-tool-use.json"),
            )
            .unwrap(),
        )
        .unwrap();
        payload["session_id"] = serde_json::Value::from(key);
        let payload_file = scene.root.join(format!("codex-payload-{key}.json"));
        let done = scene.root.join(format!("codex-hooked-{key}"));
        fs::write(&payload_file, serde_json::to_vec(&payload).unwrap()).unwrap();
        let head = Command::new(codex_like(&scene.root))
            .args([
                "-c",
                "\"$0\" hook mailbox --cli codex --event post-tool-use < \"$1\"; : > \"$2\"; exec sleep 60",
            ])
            .arg(fgos_bin())
            .arg(&payload_file)
            .arg(&done)
            .current_dir(scene.main())
            .env_clear()
            .env("HOME", scene.home())
            .env("PATH", std::env::var_os("PATH").unwrap_or_default())
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .unwrap();
        for _ in 0..400 {
            if done.exists() {
                break;
            }
            std::thread::sleep(std::time::Duration::from_millis(25));
        }
        assert!(done.exists(), "the Codex head's first hook did not finish");
        Self(head)
    }

    fn pid(&self) -> u32 {
        self.0.id()
    }
}

impl Drop for CodexHead {
    fn drop(&mut self) {
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}

/// The short name the record gave the head of `key`.
fn name_of_key(scene: &Scene, key: &str) -> String {
    let snapshot: serde_json::Value = serde_json::from_slice(
        &fs::read(scene.mailbox_dir().join("record/snapshot.json")).unwrap(),
    )
    .unwrap();
    snapshot["bindings"][key]["name"]
        .as_str()
        .unwrap()
        .to_string()
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
        None,
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
fn a_handle_identity_resolves_to_a_session_that_is_not_a_head_of_this_record_is_refused_as_unknown_like_a_name_no_session_has(
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
    // The same answer as for a name no session has: it does not tell that a
    // session elsewhere on this machine holds it.
    assert_eq!(
        String::from_utf8_lossy(&out.stdout),
        "Refused: unknown-name. Candidates: none.\n"
    );
    let nobody = send_to(&scene, "claude-zzzz@nowhere", false);
    assert_eq!(nobody.stdout, out.stdout);
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
    fgos_identity::directory::list(root, None, false, &fgos_process::facts::judge_here, None)
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

/// `fgos mailbox status --json` from the main checkout: its exit code and envelope data.
fn status_json(scene: &Scene) -> (Option<i32>, serde_json::Value) {
    let out = scene.run(
        &scene.main(),
        Some("sender-a"),
        &["mailbox", "status", "--json"],
        b"",
    );
    let envelope: serde_json::Value = serde_json::from_slice(&out.stdout).unwrap();
    (out.status.code(), envelope["data"].clone())
}

#[test]
fn a_project_migrated_to_config_yaml_has_its_mailbox_section_applied_through_the_config_door() {
    let scene = Scene::new("config-migrated");
    identity_root(&scene);
    scene.claude_hook("post-tool-use", &post_tool_use());
    let name = scene.head_name();
    // What `fgos config migrate` leaves: the section in config.yaml, the tombstone in config.json.
    fs::write(
        scene.main().join(".fgos/config.yaml"),
        "mailbox:\n  maxBodyBytes: 4\n",
    )
    .unwrap();
    fs::write(
        scene.main().join(".fgos/config.json"),
        format!("{}\n", fgos_config::files::TOMBSTONE),
    )
    .unwrap();
    let out = scene.claude_hook("post-tool-use", &post_tool_use());
    assert_eq!(out.status.code(), Some(0), "{out:?}");
    assert!(out.stdout.is_empty() && out.stderr.is_empty(), "{out:?}");
    assert_eq!(hook_outcome(&scene), None, "the migrated config reads");
    let (code, data) = status_json(&scene);
    assert_eq!((code, &data["config"]), (Some(0), &serde_json::Value::Null));

    let sent = scene.run(
        &scene.main(),
        Some("sender-a"),
        &["mailbox", "send", "--to", &name, "hello"],
        b"",
    );
    assert_eq!(sent.status.code(), Some(1), "{sent:?}");
    assert!(
        String::from_utf8_lossy(&sent.stdout).contains("too-large"),
        "config.yaml's body cap applies: {sent:?}"
    );
}

#[test]
fn a_pre_migration_config_json_with_a_wrong_mailbox_value_leaves_the_config_doors_reason_until_it_is_fixed(
) {
    let scene = Scene::new("config-wrong");
    identity_root(&scene);
    scene.claude_hook("post-tool-use", &post_tool_use());
    let config = scene.main().join(".fgos/config.json");
    fs::write(&config, r#"{"mailbox":{"hook":{"budgetMs":"fast"}}}"#).unwrap();
    let out = scene.claude_hook("post-tool-use", &post_tool_use());
    assert_eq!(out.status.code(), Some(0), "{out:?}");
    assert!(out.stdout.is_empty(), "{out:?}");
    // The schema refuses the read as a whole; the mailbox uses none of it.
    assert_eq!(
        hook_outcome(&scene).as_deref(),
        Some("config:config-schema")
    );
    let (code, data) = status_json(&scene);
    assert_eq!(
        (code, &data["config"]),
        (Some(1), &serde_json::json!("config:config-schema"))
    );

    fs::write(&config, r#"{"mailbox":{"hook":{"budgetMs":4000}}}"#).unwrap();
    let out = scene.claude_hook("post-tool-use", &post_tool_use());
    assert_eq!(out.status.code(), Some(0), "{out:?}");
    assert_eq!(
        hook_outcome(&scene),
        None,
        "a config read again clears its reason"
    );
    let (code, data) = status_json(&scene);
    assert_eq!((code, &data["config"]), (Some(0), &serde_json::Value::Null));
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

#[test]
fn a_role_and_a_handle_reach_the_head_identity_resolved_among_two_heads_and_the_holder_line_names_that_head(
) {
    let (scene, root) = scene_with_head("alias-two-heads");
    // The second head's key sorts after the first's, so a delivery to the
    // first head of the record would be wrong.
    let holder_key = "zzz-holder";
    let info = identity_of(&root, "CODEX_THREAD_ID", holder_key);
    let codex = CodexHead::start(&scene, holder_key);
    let entry = fgos_identity::directory::Entry::new(
        info.id.clone(),
        info.handle.clone(),
        "codex".to_string(),
        None,
        None,
        vec!["lead:PROBE".to_string(), "work:probe-run".to_string()],
        fgos_identity::current::os_record(codex.pid()),
    );
    fgos_identity::directory::register(&root, entry, true, &fgos_process::facts::judge_here)
        .unwrap();
    let holder = name_of_key(&scene, holder_key);

    let by_role = send_to(&scene, "lead:PROBE", false);
    let by_work_role = send_to(&scene, "work:probe-run", false);
    let by_handle = send_to(&scene, &info.handle, false);

    assert_eq!(by_work_role.status.code(), Some(0), "{by_work_role:?}");
    let text = String::from_utf8_lossy(&by_work_role.stdout);
    assert!(text.contains(&format!(" for {holder}\n")), "{text}");
    assert_eq!(by_role.status.code(), Some(0), "{by_role:?}");
    let text = String::from_utf8_lossy(&by_role.stdout);
    assert!(text.contains(&format!(" for {holder}\n")), "{text}");
    assert!(
        text.ends_with(&format!(
            "delivered to the current holder of lead:PROBE, {}\n",
            info.handle
        )),
        "{text}"
    );
    let text = String::from_utf8_lossy(&by_handle.stdout);
    assert!(text.contains(&format!(" for {holder}\n")), "{text}");
}

/// A Codex key whose Identity handle suffix equals `victim`'s: what a
/// same-user process can choose, since a handle keeps 4 characters.
fn colliding_codex_key(victim: &str) -> String {
    let target = fgos_identity::session::suffix(victim);
    (0u64..)
        .map(|i| format!("squat-{i}"))
        .find(|key| fgos_identity::session::suffix(key) == target)
        .unwrap()
}

#[test]
fn a_handle_two_heads_of_the_record_derive_is_refused_ambiguous_and_the_victim_is_still_reached_by_its_full_id(
) {
    let scene = Scene::new("alias-squat");
    let root = identity_root(&scene);
    let victim_key = "victim-key";
    let squatter_key = colliding_codex_key(victim_key);
    let victim = identity_of(&root, "CODEX_THREAD_ID", victim_key);
    let squatter = identity_of(&root, "CODEX_THREAD_ID", &squatter_key);
    assert_eq!(victim.handle, squatter.handle);
    // The squatter registers first and takes the handle in Identity.
    let _squatting = CodexHead::start(&scene, &squatter_key);
    let _victim_head = CodexHead::start(&scene, victim_key);
    assert_eq!(hook_outcome(&scene).as_deref(), Some("ident-handle-in-use"));

    let by_handle = send_to(&scene, &victim.handle, false);
    let by_id = send_to(&scene, &victim.id, false);
    let status = scene.run(
        &scene.main(),
        Some("sender-a"),
        &["mailbox", "status", "--json"],
        b"",
    );

    assert_eq!(by_handle.status.code(), Some(1), "{by_handle:?}");
    let text = String::from_utf8_lossy(&by_handle.stdout);
    assert!(text.starts_with("Refused: ambiguous-name."), "{text}");
    assert!(text.contains(&format!("({})", victim.id)), "{text}");
    assert!(text.contains(&format!("({})", squatter.id)), "{text}");
    assert_eq!(by_id.status.code(), Some(0), "{by_id:?}");
    assert!(
        String::from_utf8_lossy(&by_id.stdout)
            .contains(&format!(" for {}\n", name_of_key(&scene, victim_key))),
        "{by_id:?}"
    );
    let envelope: serde_json::Value = serde_json::from_slice(&status.stdout).unwrap();
    let conflicts = envelope["data"]["handleConflicts"].as_array().unwrap();
    assert!(
        conflicts
            .iter()
            .any(|c| c["id"] == victim.id && c["handle"] == victim.handle),
        "{conflicts:?}"
    );
}

#[test]
fn a_registering_call_of_a_head_identity_already_holds_under_its_own_id_records_nothing() {
    let scene = Scene::new("ident-own");
    let root = identity_root(&scene);
    register_identity(&root, "CLAUDE_CODE_SESSION_ID", WRITER, &[]);
    let before = identity_sessions(&root);

    let out = scene.claude_hook("post-tool-use", &post_tool_use());

    assert_eq!(out.status.code(), Some(0), "{out:?}");
    assert_eq!(hook_outcome(&scene), None);
    assert_eq!(identity_sessions(&root), before);
}

#[test]
fn a_head_that_registered_before_the_machine_had_an_id_is_registered_with_identity_at_its_next_quiet_call(
) {
    let scene = Scene::new("ident-retry");
    let first = scene.claude_hook("post-tool-use", &post_tool_use());
    assert_eq!(first.status.code(), Some(0));
    assert_eq!(
        hook_outcome(&scene).as_deref(),
        Some("ident:machine-id-missing")
    );
    let root = identity_root(&scene);

    let again = scene.claude_hook("post-tool-use", &post_tool_use());

    assert_eq!(again.status.code(), Some(0));
    assert!(
        again.stdout.is_empty() && again.stderr.is_empty(),
        "{again:?}"
    );
    let own = identity_of(&root, "CLAUDE_CODE_SESSION_ID", WRITER);
    assert_eq!(identity_sessions(&root), vec![(own.id, own.handle)]);
    assert_eq!(
        hook_outcome(&scene),
        None,
        "the repaired outcome is cleared"
    );
}

/// Holds the scene's mailbox lock for `ms` in a thread, as a hook writing a
/// registration does; returns once the lock is held.
fn hold_lock(scene: &Scene, ms: u64) -> std::thread::JoinHandle<()> {
    let fgos_dir = scene.main().join(".fgos");
    let (held, wait) = std::sync::mpsc::channel();
    let holder = std::thread::spawn(move || {
        let record = fgos_mailbox::record::Record::open(fgos_dir).unwrap();
        let limits = fgos_mailbox::limits::load(None).unwrap().limits;
        let now = fgos_mailbox_core::Timestamp::from_millis(
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64,
        );
        record
            .hold(fgos_mailbox::record::Wait::Try, now, &limits, |_, _| {
                held.send(()).unwrap();
                std::thread::sleep(std::time::Duration::from_millis(ms));
                fgos_mailbox::record::Reported {
                    value: (),
                    changed: false,
                }
            })
            .unwrap();
    });
    wait.recv().unwrap();
    holder
}

#[test]
fn a_send_racing_a_hook_that_holds_the_lock_longer_than_the_hooks_skip_budget_waits_and_records() {
    let scene = Scene::new("send-waits");
    let first = scene.claude_hook("post-tool-use", &post_tool_use());
    assert_eq!(first.status.code(), Some(0));
    let name = scene.head_name();
    let send = ["mailbox", "send", "--to", name.as_str(), "after the hook"];

    let holder = hold_lock(&scene, 400);
    let sent = scene.run(&scene.main(), Some("sender-a"), &send, b"");
    holder.join().unwrap();
    assert_eq!(sent.status.code(), Some(0), "{sent:?}");
    assert!(String::from_utf8_lossy(&sent.stdout).starts_with("recorded "));

    // The falsifier: with the hook's 100 ms as the verbs' wait, the same race is refused.
    fs::write(
        scene.main().join(".fgos/config.json"),
        r#"{"mailbox":{"verbs":{"lockWaitMs":100}}}"#,
    )
    .unwrap();
    let holder = hold_lock(&scene, 400);
    let refused = scene.run(&scene.main(), Some("sender-a"), &send, b"");
    holder.join().unwrap();
    assert_eq!(refused.status.code(), Some(1), "{refused:?}");
    assert!(
        String::from_utf8_lossy(&refused.stdout).contains("lock-busy"),
        "{refused:?}"
    );
}

/// The hook starts its detached sync child only when the project turned
/// cross-machine mail on and the last child that took mail started longer ago
/// than the interval; a recent plain Event Store sync does not count. The child's own start
/// leaves its log file beside the record.
#[test]
fn the_hook_starts_the_detached_sync_child_only_when_cross_machine_is_on_and_a_sync_is_due() {
    use fgos_event_store::layout::Layout;
    let scene = Scene::new("sync-child");
    fs::create_dir_all(scene.mailbox_dir()).unwrap();
    let log = scene.mailbox_dir().join("sync.log");
    let hook = || {
        let out = scene.run(
            &scene.main(),
            Some("writer"),
            &[
                "hook",
                "mailbox",
                "--cli",
                "claude",
                "--event",
                "post-tool-use",
            ],
            &post_tool_use(),
        );
        assert_eq!(out.status.code(), Some(0));
    };
    hook();
    assert!(
        !log.exists(),
        "cross-machine mail is off by default: no child"
    );

    fs::write(
        scene.main().join(".fgos/config.json"),
        r#"{"mailbox":{"crossMachine":{"enabled":true}}}"#,
    )
    .unwrap();
    let layout = Layout::from_common_dir(Some(&scene.main().join(".git"))).unwrap();
    let recent = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    fs::create_dir_all(&layout.root).unwrap();
    let attempt = format!(
        r#"{{"v":1,"time":{recent},"remote":"origin","tips":{{}},"error":null,"warnings":[],"unpublishedSince":null}}"#
    );
    let stamp = scene.mailbox_dir().join("mail-taken");
    fs::write(&stamp, "origin").unwrap();
    hook();
    assert!(
        !log.exists(),
        "a child that took mail inside the interval makes the next one not due: no child"
    );

    fs::remove_file(&stamp).unwrap();
    hook();
    assert!(
        !log.exists(),
        "a project that never migrated its events has nothing to sync: no child"
    );

    fs::write(scene.main().join(".fgos/events"), "fence\n").unwrap();
    fs::write(layout.root.join("sync.json"), attempt).unwrap();
    hook();
    assert!(
        log.exists(),
        "a plain sync inside the interval does not hold the child back"
    );
}

/// The main checkout of `scene` as a clone of a migrated project with a
/// remote: what the Event Store needs before anything is appended there.
fn migrate_main(scene: &Scene, state: &Path, project_id: &str) -> fgos_event_store::layout::Layout {
    let remote = scene.root.join("remote.git");
    git(
        &scene.root,
        &["init", "--bare", "-q", remote.to_str().unwrap()],
    );
    migrate_main_to(scene, state, project_id, &remote)
}

/// [`migrate_main`] with `origin` at an existing bare repository, so two scenes can share one remote.
fn migrate_main_to(
    scene: &Scene,
    state: &Path,
    project_id: &str,
    remote: &Path,
) -> fgos_event_store::layout::Layout {
    use fgos_event_store::layout::Layout;
    use fgos_git::{GitDriver, ResolveRepo};
    use std::os::unix::fs::PermissionsExt;
    let main = scene.main();
    git(
        &main,
        &["remote", "add", "origin", remote.to_str().unwrap()],
    );
    fs::set_permissions(&main, fs::Permissions::from_mode(0o700)).unwrap();
    fs::write(
        main.join(".fgos/project.json"),
        format!(r#"{{"v":1,"projectId":"{project_id}","handle":"demo","createdAt":"2026-10-24T00:00:00.000Z"}}"#),
    )
    .unwrap();
    let fence = main.join(".fgos/locks/activation.lock");
    fs::create_dir_all(&fence).unwrap();
    fs::write(
        fence.join("TOMBSTONE"),
        "{\"at\":\"fixture\",\"v\":1,\"lock\":\"activation\",\"by\":\"fgos git\"}\n",
    )
    .unwrap();
    fs::write(main.join(".fgos/events"), "fence\n").unwrap();
    fs::set_permissions(state, fs::Permissions::from_mode(0o700)).unwrap();
    let driver = GitDriver::new(state).unwrap();
    let repo = match driver.resolve_repo(&main, &main).unwrap() {
        ResolveRepo::Repository(repo) => repo,
        _ => panic!("the main checkout is a repository"),
    };
    let layout = Layout::from_common_dir(Some(repo.common_dir())).unwrap();
    fs::create_dir_all(layout.root.join("locks")).unwrap();
    for dir in [layout.common_dir.join("fgos"), layout.root.join("locks")] {
        fs::set_permissions(dir, fs::Permissions::from_mode(0o700)).unwrap();
    }
    fgos_git::RepositoryConfig::ensure_fetch_mapping(
        &driver,
        &repo,
        "origin",
        &fgos_git::publication_fetch_mappings("origin").unwrap(),
        "test-mapping-setup",
    )
    .unwrap();
    layout
}

/// A head the hook registered in a project's clone reaches the shared
/// directory only through the sync child, and only once: the entry carries
/// the project id the hook found in the clone, the child appends one signed
/// `identity.session-published`, and a second child appends nothing.
#[test]
fn the_sync_child_publishes_a_registered_head_into_the_shared_directory_once() {
    use fgos_event_store::layout::StreamId;
    let scene = Scene::new("publish-head");
    let root = identity_root(&scene);
    fgos_identity::signing::mint_key(&root).unwrap();
    let layout = migrate_main(&scene, &root, "0123456789abcdef0123456789abcdef");
    let out = scene.claude_hook("post-tool-use", &post_tool_use());
    assert_eq!(out.status.code(), Some(0), "{out:?}");
    let own = identity_of(&root, "CLAUDE_CODE_SESSION_ID", WRITER);
    let entry =
        fgos_identity::directory::list(&root, None, false, &fgos_process::facts::judge_here, None)
            .unwrap()
            .sessions
            .into_iter()
            .find(|listed| listed.id == own.id)
            .expect("the hook registered the head");
    assert_eq!(
        entry.project_id.as_deref(),
        Some("0123456789abcdef0123456789abcdef"),
        "the entry carries the project of the clone the hook ran in"
    );
    // Cross-machine mail goes on only now, so the hook above started no child of its own.
    fs::write(
        scene.main().join(".fgos/config.json"),
        r#"{"mailbox":{"crossMachine":{"enabled":true}}}"#,
    )
    .unwrap();

    // The child's sync seals the stream, so the events are the sealed ones plus those still open.
    let stream = layout.stream(&StreamId::parse("project:identity").unwrap());
    let published = || {
        let sealed = fgos_event_store::receipt::Receipt::read(&stream.sealed())
            .map_or(0, |receipt| receipt.last_seq as usize);
        let open = fs::read_to_string(stream.active())
            .map_or(0, |text| text.matches("identity.session-published").count());
        sealed + open
    };
    let child = || {
        let main = scene.main();
        let out = scene.run(
            &main,
            None,
            &[
                "hook",
                "mailbox-sync",
                "--dir",
                main.to_str().unwrap(),
                "--remote",
                "origin",
            ],
            b"",
        );
        assert_eq!(out.status.code(), Some(0), "{out:?}");
        String::from_utf8_lossy(&out.stderr).into_owned()
    };
    assert_eq!(published(), 0, "the hook publishes nothing");
    let said = child();
    assert_eq!(published(), 1, "the child published the head: {said}");
    child();
    assert_eq!(published(), 1, "an unchanged head is not published again");
}

/// Two machines of one project sharing a bare remote: each has its own state root with a machine id and
/// a signing key, a record with one registered head, and cross-machine mail on. Beta's head is published
/// into the shared directory and both sync children ran once, so alpha can address it by `target`.
struct Cross {
    alpha: Scene,
    beta: Scene,
    alpha_root: PathBuf,
    beta_root: PathBuf,
    target: String,
}

fn two_machines() -> Cross {
    const PROJECT: &str = "0123456789abcdef0123456789abcdef";
    let alpha = Scene::new("xsend-alpha");
    let beta = Scene::new("xsend-beta");
    let alpha_root = identity_root(&alpha);
    let beta_root = identity_root(&beta);
    for root in [&alpha_root, &beta_root] {
        fgos_identity::signing::mint_key(root).unwrap();
    }
    migrate_main(&alpha, &alpha_root, PROJECT);
    // Both clones share alpha's bare remote.
    migrate_main_to(&beta, &beta_root, PROJECT, &alpha.root.join("remote.git"));

    // Beta's head registers with Identity, then beta's sync child publishes and pushes it.
    let out = beta.claude_hook("post-tool-use", &post_tool_use());
    assert_eq!(out.status.code(), Some(0), "{out:?}");
    let target = identity_of(&beta_root, "CLAUDE_CODE_SESSION_ID", WRITER).id;
    let own = identity_of(&alpha_root, "CLAUDE_CODE_SESSION_ID", WRITER).id;
    assert_ne!(target, own, "the two machines name their sessions apart");
    let out = alpha.claude_hook("post-tool-use", &post_tool_use());
    assert_eq!(out.status.code(), Some(0), "{out:?}");
    for scene in [&beta, &alpha] {
        fs::write(
            scene.main().join(".fgos/config.json"),
            r#"{"mailbox":{"crossMachine":{"enabled":true}}}"#,
        )
        .unwrap();
        sync_child(scene);
    }

    Cross {
        alpha,
        beta,
        alpha_root,
        beta_root,
        target,
    }
}

/// One run of `scene`'s detached sync child, in the foreground; what it says on stderr.
fn sync_child_said(scene: &Scene) -> String {
    let main = scene.main();
    let out = scene.run(
        &main,
        None,
        &[
            "hook",
            "mailbox-sync",
            "--dir",
            main.to_str().unwrap(),
            "--remote",
            "origin",
        ],
        b"",
    );
    assert_eq!(out.status.code(), Some(0), "{out:?}");
    String::from_utf8_lossy(&out.stderr).into_owned()
}

/// One run of `scene`'s sync child; it says nothing but the outcome of a nudge it tried.
fn sync_child(scene: &Scene) {
    let stderr = sync_child_said(scene);
    assert!(
        stderr
            .lines()
            .all(|l| l.starts_with("mailbox-sync: nudge for ")),
        "{stderr}"
    );
}

/// Two machines sharing one remote: the session machine beta published into
/// the shared directory is reached from alpha by its full id. A send there is
/// recorded in the shared log, never delivered locally: the answer says so,
/// alpha's record gains no message, the event is signed by alpha's key (and
/// verifies under the domain of `remote.v1.json`), and a body over the wire
/// cap is refused without writing anything.
#[test]
fn a_send_to_a_session_on_another_machine_appends_one_signed_event_and_reports_recorded_not_delivered(
) {
    let Cross {
        alpha,
        beta,
        alpha_root,
        beta_root,
        target,
    } = two_machines();
    let send = |body: &str| {
        alpha.run(
            &alpha.main(),
            Some("sender-a"),
            &["mailbox", "send", "--to", &target, body],
            b"",
        )
    };
    let out = send("hello from alpha");
    let text = String::from_utf8_lossy(&out.stdout).into_owned();
    assert_eq!(
        out.status.code(),
        Some(0),
        "{text} {}",
        String::from_utf8_lossy(&out.stderr)
    );
    assert!(
        text.starts_with("recorded ") && text.contains("not delivered"),
        "{text}"
    );
    assert_eq!(
        alpha.message_states().len(),
        0,
        "a cross-machine send leaves no header in the local record"
    );

    let sent = || sent_events(&alpha_root, &alpha.main());
    let sent_now = sent();
    assert_eq!(sent_now.len(), 1, "{sent_now:?}");
    let sent = &sent_now;
    let payload = sent[0].clone();
    assert_eq!(payload["body"], "hello from alpha");
    assert_eq!(payload["to"]["id"], target.as_str());
    let machine = fgos_identity::machine::read(&alpha_root).unwrap();
    let sender = payload["from"]["id"].as_str().unwrap();
    assert!(
        sender.starts_with(&format!("{machine}/")),
        "the sender is named by its full session id: {sender}"
    );
    assert_eq!(payload["from"]["machine"], machine.as_str());
    let mut unsigned = payload.clone();
    let sig: fgos_identity::Signature =
        serde_json::from_value(unsigned.as_object_mut().unwrap().remove("sig").unwrap()).unwrap();
    let canonical = fgos_canonical_json::canonical_json(&unsigned).unwrap();
    let bytes = format!("fgos-mailbox-message/1\n{canonical}").into_bytes();
    let verified = fgos_identity::signing::verify(&beta_root, &bytes, &sig).unwrap();
    assert_eq!(
        verified.machine_id,
        payload["from"]["machine"].as_str().unwrap(),
        "the signer is the sender's machine"
    );

    // Alpha's sync child pushes the message; beta's fetches it and takes it into beta's record, where
    // the head beta registered receives it at its next tool call, once.
    let sync = sync_child;
    // Beta takes mail only from a machine whose key its owner confirmed: alpha's key is pinned as seen
    // once beta verifies anything of it, and the owner confirms it by the fingerprint alpha reports.
    let alpha_machine = fgos_identity::machine::read(&alpha_root).unwrap();
    let probe = fgos_identity::signing::sign(&alpha_root, b"probe").unwrap();
    fgos_identity::signing::verify(&beta_root, b"probe", &probe).unwrap();
    let fingerprint = fgos_identity::signing::key_fingerprint(&alpha_root)
        .unwrap()
        .unwrap();
    fgos_identity::pins::confirm(&beta_root, &alpha_machine, &fingerprint).unwrap();
    sync(&alpha);
    sync(&beta);
    let frame = beta.claude_hook("post-tool-use", &post_tool_use());
    let frame = String::from_utf8_lossy(&frame.stdout).into_owned();
    assert!(
        frame.contains("hello from alpha") && frame.contains("remote_"),
        "beta's head received the mail: {frame:?}"
    );
    sync(&beta);
    let again = beta.claude_hook("post-tool-use", &post_tool_use());
    assert!(
        !String::from_utf8_lossy(&again.stdout).contains("hello from alpha"),
        "the mail is delivered once"
    );

    // Until beta settles it, alpha shows the send as waiting; once beta's child tells alpha it was
    // offered (the head took it above), alpha's status folds that settlement, signed by beta.
    let status = || {
        let out = alpha.run(
            &alpha.main(),
            Some("sender-a"),
            &["mailbox", "status", "--json"],
            b"",
        );
        serde_json::from_slice::<serde_json::Value>(&out.stdout).unwrap()["data"]["crossMachine"]
            .clone()
    };
    let waiting = status();
    assert_eq!(waiting["waiting"], 1, "no settlement yet: {waiting}");
    assert_eq!(
        (
            &waiting["recent"][0]["preview"],
            &waiting["recent"][0]["answer"]["state"]
        ),
        (&"hello from alpha".into(), &"none".into()),
        "the send is listed with its body and no answer: {waiting}"
    );
    sync(&beta);
    sync(&alpha);
    let folded = status();
    assert_eq!(
        (
            folded["sent"].clone(),
            folded["offered"].clone(),
            folded["waiting"].clone()
        ),
        (1.into(), 1.into(), 0.into()),
        "{folded}"
    );
    assert_eq!(
        folded["recent"][0]["answer"]["state"], "offered",
        "the listed send carries beta's signed answer: {folded}"
    );

    let over = send(&"x".repeat(2049));
    assert_eq!(over.status.code(), Some(1), "{over:?}");
    assert!(
        String::from_utf8_lossy(&over.stdout).contains("too-large"),
        "{over:?}"
    );
    assert_eq!(
        sent_events(&alpha_root, &alpha.main()).len(),
        1,
        "a refused send writes no event"
    );
}

/// Beta takes mail only from a machine whose key its owner confirmed; this is that confirmation.
fn confirm_alpha_on_beta(cross: &Cross) {
    let alpha_machine = fgos_identity::machine::read(&cross.alpha_root).unwrap();
    let probe = fgos_identity::signing::sign(&cross.alpha_root, b"probe").unwrap();
    fgos_identity::signing::verify(&cross.beta_root, b"probe", &probe).unwrap();
    let fingerprint = fgos_identity::signing::key_fingerprint(&cross.alpha_root)
        .unwrap()
        .unwrap();
    fgos_identity::pins::confirm(&cross.beta_root, &alpha_machine, &fingerprint).unwrap();
}

/// The `wake` and `effective_wake` of each message in `scene`'s record, oldest first.
fn recorded_wakes(scene: &Scene) -> Vec<(bool, bool)> {
    let snapshot: serde_json::Value = serde_json::from_slice(
        &fs::read(scene.mailbox_dir().join("record/snapshot.json")).unwrap(),
    )
    .unwrap();
    snapshot["messages"]
        .as_array()
        .unwrap()
        .iter()
        .map(|m| {
            (
                m["wake"].as_bool().unwrap(),
                m["effective_wake"].as_bool().unwrap(),
            )
        })
        .collect()
}

/// A send with `--wake` to a session on another machine is signed as version 2 with its flag, a send
/// without it stays version 1, and the receiver decides: each verified sender session wakes up to the
/// receiver's own remote cap (set to 2 here), after which its mail still lands, as plain mail.
#[test]
fn a_wake_asked_from_another_machine_is_signed_as_version_two_and_takes_effect_only_up_to_the_receivers_own_cap(
) {
    let cross = two_machines();
    confirm_alpha_on_beta(&cross);
    fs::write(
        cross.beta.main().join(".fgos/config.json"),
        r#"{"mailbox":{"crossMachine":{"enabled":true},"wake":{"remoteLifetimeCap":2}}}"#,
    )
    .unwrap();
    let send = |args: &[&str]| {
        let mut argv = vec!["mailbox", "send"];
        argv.extend_from_slice(args);
        let out = cross
            .alpha
            .run(&cross.alpha.main(), Some("sender-a"), &argv, b"");
        assert_eq!(out.status.code(), Some(0), "{out:?}");
        String::from_utf8_lossy(&out.stdout).into_owned()
    };
    for body in ["wake one", "wake two", "wake three"] {
        let text = send(&["--wake", "--to", &cross.target, body]);
        assert!(text.contains("Wake requested"), "{text}");
    }
    let text = send(&["--to", &cross.target, "plain one"]);
    assert!(!text.contains("Wake requested"), "{text}");

    let events = sent_events(&cross.alpha_root, &cross.alpha.main());
    let shape = |body: &str| {
        let event = events.iter().find(|e| e["body"] == body).unwrap();
        (event["v"].clone(), event.get("wake").cloned())
    };
    assert_eq!(shape("wake one"), (2.into(), Some(true.into())));
    assert_eq!(
        shape("plain one"),
        (1.into(), None),
        "a send without --wake is unchanged"
    );

    // Each send started its own detached sync child, and a foreground run that finds one holding the
    // sync lock skips: beta may fetch before alpha's last push lands, which only delays the mail, so
    // the machines sync until the four messages are in or a bounded wait runs out.
    for _ in 0..40 {
        sync_child(&cross.alpha);
        sync_child(&cross.beta);
        if recorded_wakes(&cross.beta).len() == 4 {
            break;
        }
        std::thread::sleep(std::time::Duration::from_millis(250));
    }
    assert_eq!(
        recorded_wakes(&cross.beta),
        vec![(true, true), (true, true), (true, false), (false, false)],
        "the third wake is over the receiver's cap and its mail landed anyway"
    );
}

/// Mail that was already in the shared log when a machine took its first baseline is never delivered
/// there, and its sender is told so by a refusal it can read instead of waiting for good.
#[test]
fn mail_sent_before_the_receivers_first_sync_is_refused_to_its_sender_by_name() {
    let cross = two_machines();
    confirm_alpha_on_beta(&cross);
    // Beta's first ingest is still to come: take back the baseline its setup syncs took.
    let snapshot_path = cross.beta.mailbox_dir().join("record/snapshot.json");
    let mut snapshot: serde_json::Value =
        serde_json::from_slice(&fs::read(&snapshot_path).unwrap()).unwrap();
    snapshot["remote"]["baselined"] = false.into();
    snapshot["remote"]["cursor"] = serde_json::json!({});
    fs::write(&snapshot_path, serde_json::to_vec(&snapshot).unwrap()).unwrap();

    let out = cross.alpha.run(
        &cross.alpha.main(),
        Some("sender-a"),
        &[
            "mailbox",
            "send",
            "--to",
            &cross.target,
            "sent before your first sync",
        ],
        b"",
    );
    assert_eq!(out.status.code(), Some(0), "{out:?}");
    sync_child(&cross.alpha);
    sync_child(&cross.beta);
    sync_child(&cross.alpha);

    assert_eq!(
        cross.beta.message_states().len(),
        0,
        "the baseline delivers nothing older"
    );
    let status = cross.alpha.run(
        &cross.alpha.main(),
        Some("sender-a"),
        &["mailbox", "status", "--json"],
        b"",
    );
    let folded = serde_json::from_slice::<serde_json::Value>(&status.stdout).unwrap()["data"]
        ["crossMachine"]
        .clone();
    assert_eq!(folded["refused"]["before-first-sync"], 1, "{folded}");
    assert_eq!(folded["waiting"], 0, "{folded}");
}

/// The payloads of every `mailbox.message-sent` event the clone at `main` holds, sealed or still open.
fn sent_events(state: &Path, main: &Path) -> Vec<serde_json::Value> {
    use fgos_event_store::{
        identity::StoreIdentity,
        layout::{Layout, StreamId},
        read::{read, ReadRequest},
    };
    use fgos_git::{GitDriver, ResolveRepo};
    let driver = GitDriver::new(state).unwrap();
    let repo = match driver.resolve_repo(main, main).unwrap() {
        ResolveRepo::Repository(repo) => repo,
        _ => panic!("the main checkout is a repository"),
    };
    let layout = Layout::from_common_dir(Some(repo.common_dir())).unwrap();
    let machine = fgos_identity::machine::read(state).unwrap();
    let origin = StoreIdentity::open(&layout, &machine).unwrap().store_id;
    let stream = StreamId::parse("project:mailbox").unwrap();
    let result = read(
        &driver,
        &repo,
        ReadRequest {
            machine: &machine,
            layout: &layout,
            origin: &origin,
            streams: std::slice::from_ref(&stream),
            cursor: &Default::default(),
            folded: &[],
            project: true,
        },
    )
    .unwrap();
    result
        .sequence
        .into_iter()
        .filter(|event| event.event_type == "mailbox.message-sent")
        .map(|event| event.payload)
        .collect()
}

/// Mail from a machine whose key the owner did not confirm is not taken: the head receives nothing,
/// and the sender's status names the refusal, so its owner can see why and confirm the key.
#[test]
fn mail_from_a_machine_whose_key_is_not_confirmed_is_not_taken_and_the_sender_is_told_why() {
    let Cross {
        alpha,
        beta,
        alpha_root,
        target,
        ..
    } = two_machines();
    let out = alpha.run(
        &alpha.main(),
        Some("sender-a"),
        &["mailbox", "send", "--to", &target, "unconfirmed hello"],
        b"",
    );
    assert_eq!(out.status.code(), Some(0), "{out:?}");
    // Beta already folded alpha's published session, so alpha's key is pinned there as seen, never confirmed.
    for scene in [&alpha, &beta, &beta, &alpha] {
        sync_child(scene);
    }
    let frame = beta.claude_hook("post-tool-use", &post_tool_use());
    assert!(
        !String::from_utf8_lossy(&frame.stdout).contains("unconfirmed hello"),
        "{frame:?}"
    );
    let status = alpha.run(
        &alpha.main(),
        Some("sender-a"),
        &["mailbox", "status", "--json"],
        b"",
    );
    let status: serde_json::Value = serde_json::from_slice(&status.stdout).unwrap();
    assert_eq!(
        status["data"]["crossMachine"]["refused"]["remote-unconfirmed"], 1,
        "{status}"
    );
    let counted = beta.run(
        &beta.main(),
        Some(WRITER),
        &["mailbox", "status", "--json"],
        b"",
    );
    let counted: serde_json::Value = serde_json::from_slice(&counted.stdout).unwrap();
    assert_eq!(
        counted["data"]["signals"]["refusals"]["remote-unconfirmed"], 1,
        "{counted}"
    );
    assert_eq!(
        counted["data"]["crossMachine"]["acceptedPayloadVersions"],
        serde_json::json!([1, 2, 3]),
        "{counted}"
    );
    let alpha_machine = fgos_identity::machine::read(&alpha_root).unwrap();
    assert_eq!(
        counted["data"]["crossMachine"]["unconfirmedMachines"],
        serde_json::json!([alpha_machine]),
        "{counted}"
    );
    assert!(String::from_utf8_lossy(
        &beta
            .run(&beta.main(), Some(WRITER), &["mailbox", "status"], b"")
            .stdout
    )
    .contains("seen, not confirmed"));
    assert!(String::from_utf8_lossy(
        &beta
            .run(&beta.main(), Some(WRITER), &["mailbox", "status"], b"")
            .stdout
    )
    .contains("takes mail payload versions 1, 2, 3"));
}

/// A message alpha appends for beta's head: its text inline (version 1), or only the hash and length
/// of a body kept in alpha's mail-body ref (version 3).
enum Mail<'a> {
    Inline(&'a str),
    BodyRef(&'a str),
}

fn sha256_hex(text: &str) -> String {
    use sha2::{Digest, Sha256};
    Sha256::digest(text.as_bytes())
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect()
}

/// Appends to alpha's mailbox stream one signed `mailbox.message-sent` for beta's head, the way a
/// sender of that payload version would; the receiver tests use it for headers a real send never
/// leaves (a body that is not on the remote, an event ahead of its body).
fn append_mail(cross: &Cross, id: &str, mail: &Mail<'_>) {
    append_mail_at(cross, id, mail, &fgos_identity::text::iso_utc_now());
}

/// [`append_mail`] with the time the signed header says it was sent.
fn append_mail_at(cross: &Cross, id: &str, mail: &Mail<'_>, sent_at: &str) {
    use fgos_event_store::{
        append::{append, AppendRequest, EventInput},
        layout::{Layout, StreamId},
        registry::Registry,
    };
    use fgos_git::{GitDriver, ResolveRepo};
    let alpha_machine = fgos_identity::machine::read(&cross.alpha_root).unwrap();
    let beta_machine = fgos_identity::machine::read(&cross.beta_root).unwrap();
    let from = identity_of(&cross.alpha_root, "CLAUDE_CODE_SESSION_ID", WRITER).id;
    let mut payload = serde_json::json!({
        "id": id,
        "from": { "id": from, "machine": alpha_machine },
        "to": { "id": cross.target, "machine": beta_machine },
        "kind": "message",
        "sentAt": sent_at,
    });
    let domain = match mail {
        Mail::Inline(body) => {
            payload["v"] = 1.into();
            payload["body"] = (*body).into();
            "fgos-mailbox-message/1\n"
        }
        Mail::BodyRef(body) => {
            payload["v"] = 3.into();
            payload["bodyHash"] = sha256_hex(body).into();
            payload["bodyBytes"] = body.len().into();
            "fgos-mailbox-message/3\n"
        }
    };
    let canonical = fgos_canonical_json::canonical_json(&payload).unwrap();
    let signature =
        fgos_identity::signing::sign(&cross.alpha_root, format!("{domain}{canonical}").as_bytes())
            .unwrap();
    payload["sig"] = serde_json::to_value(signature).unwrap();
    let main = cross.alpha.main();
    let driver = GitDriver::new(&cross.alpha_root).unwrap();
    let repo = match driver.resolve_repo(&main, &main).unwrap() {
        ResolveRepo::Repository(repo) => repo,
        _ => panic!("the main checkout is a repository"),
    };
    let layout = Layout::from_common_dir(Some(repo.common_dir())).unwrap();
    append(
        &layout,
        &Registry::shipped().unwrap(),
        AppendRequest {
            stream: &StreamId::parse("project:mailbox").unwrap(),
            events: &[EventInput {
                event_type: "mailbox.message-sent".to_owned(),
                schema_version: 1,
                payload,
                ts: fgos_identity::text::iso_utc_now(),
            }],
            cursor: &Default::default(),
            writer: "test",
            machine: &alpha_machine,
            held_ranks: &[],
        },
    )
    .unwrap();
}

/// `git` with `args` in `dir`, `stdin` given to it; what it printed.
fn git_out(dir: &Path, args: &[&str], stdin: &str) -> String {
    git_out_env(dir, args, stdin, &[])
}

fn git_out_env(dir: &Path, args: &[&str], stdin: &str, env: &[(&str, &str)]) -> String {
    let mut child = Command::new("git")
        .arg("-C")
        .arg(dir)
        .args(args)
        .envs(env.iter().copied())
        .env("GIT_CONFIG_GLOBAL", "/dev/null")
        .env("GIT_CONFIG_NOSYSTEM", "1")
        .env("GIT_AUTHOR_NAME", "t")
        .env("GIT_AUTHOR_EMAIL", "t@t")
        .env("GIT_COMMITTER_NAME", "t")
        .env("GIT_COMMITTER_EMAIL", "t@t")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();
    child
        .stdin
        .take()
        .unwrap()
        .write_all(stdin.as_bytes())
        .unwrap();
    let out = child.wait_with_output().unwrap();
    assert!(out.status.success(), "git {args:?}: {out:?}");
    String::from_utf8_lossy(&out.stdout).trim().to_owned()
}

/// Alpha's mail-body ref becomes one commit holding `bodies`, a blob each named by its sha256, and
/// is pushed to the shared remote: what a sender does before it appends the event.
fn push_bodies(cross: &Cross, bodies: &[&str]) {
    push_bodies_at(cross, bodies, None);
}

/// [`push_bodies`] with the commit dated `committed` (git's raw date, `<seconds> +0000`).
fn push_bodies_at(cross: &Cross, bodies: &[&str], committed: Option<&str>) {
    let main = cross.alpha.main();
    let machine = fgos_identity::machine::read(&cross.alpha_root).unwrap();
    let mut entries = String::new();
    for body in bodies {
        let blob = git_out(&main, &["hash-object", "-w", "--stdin"], body);
        entries.push_str(&format!("100644 blob {blob}\t{}\n", sha256_hex(body)));
    }
    let tree = git_out(&main, &["mktree"], &entries);
    let dated: Vec<(&str, &str)> = committed
        .map(|d| ("GIT_COMMITTER_DATE", d))
        .into_iter()
        .collect();
    let commit = git_out_env(&main, &["commit-tree", &tree, "-m", "bodies"], "", &dated);
    let reference = format!("refs/fgos/mail-bodies/{machine}");
    git_out(&main, &["update-ref", &reference, &commit], "");
    git_out(
        &main,
        &["push", "-q", "origin", &format!("+{reference}:{reference}")],
        "",
    );
}

/// Beta's clone gets the mail-body fetch mapping, as `fgos doctor --fix` installs it.
fn install_body_mapping(cross: &Cross) {
    use fgos_git::{GitDriver, ResolveRepo};
    let main = cross.beta.main();
    let driver = GitDriver::new(&cross.beta_root).unwrap();
    let repo = match driver.resolve_repo(&main, &main).unwrap() {
        ResolveRepo::Repository(repo) => repo,
        _ => panic!("the main checkout is a repository"),
    };
    fgos_git::RepositoryConfig::ensure_fetch_mapping(
        &driver,
        &repo,
        "origin",
        &fgos_git::granted_fetch_mappings("origin").unwrap(),
        "test-body-mapping",
    )
    .unwrap();
}

/// How far beta's ingest cursor has read alpha's store origin (0: nothing).
fn cursor_on_alpha(cross: &Cross) -> u64 {
    use fgos_event_store::{identity::StoreIdentity, layout::Layout};
    use fgos_git::{GitDriver, ResolveRepo};
    let main = cross.alpha.main();
    let driver = GitDriver::new(&cross.alpha_root).unwrap();
    let repo = match driver.resolve_repo(&main, &main).unwrap() {
        ResolveRepo::Repository(repo) => repo,
        _ => panic!("the main checkout is a repository"),
    };
    let layout = Layout::from_common_dir(Some(repo.common_dir())).unwrap();
    let machine = fgos_identity::machine::read(&cross.alpha_root).unwrap();
    let origin = StoreIdentity::open(&layout, &machine).unwrap().store_id;
    let snapshot: serde_json::Value = serde_json::from_slice(
        &fs::read(cross.beta.mailbox_dir().join("record/snapshot.json")).unwrap(),
    )
    .unwrap();
    snapshot["remote"]["cursor"][origin.as_str()]
        .as_u64()
        .unwrap_or(0)
}

/// What alpha's status counts as refused by a receiver, by code.
fn alpha_refusals(cross: &Cross) -> serde_json::Value {
    let status = cross.alpha.run(
        &cross.alpha.main(),
        Some("sender-a"),
        &["mailbox", "status", "--json"],
        b"",
    );
    serde_json::from_slice::<serde_json::Value>(&status.stdout).unwrap()["data"]["crossMachine"]
        ["refused"]
        .clone()
}

/// Alpha's config with `mailbox.remote.bodyRef` on: its sends keep the body out of the event.
fn turn_on_body_ref(cross: &Cross) {
    fs::write(
        cross.alpha.main().join(".fgos/config.json"),
        r#"{"mailbox":{"crossMachine":{"enabled":true},"remote":{"bodyRef":true}}}"#,
    )
    .unwrap();
}

/// A send from alpha to beta's head; the verb's output.
fn alpha_send(cross: &Cross, args: &[&str]) -> Output {
    let mut argv = vec!["mailbox", "send", "--to", &cross.target];
    argv.extend_from_slice(args);
    cross
        .alpha
        .run(&cross.alpha.main(), Some("sender-a"), &argv, b"")
}

/// The remote's tree of alpha's mail-body ref: the blob named `hash`, if the ref has one.
fn remote_body(cross: &Cross, hash: &str) -> Option<String> {
    let machine = fgos_identity::machine::read(&cross.alpha_root).unwrap();
    let remote = cross.alpha.root.join("remote.git");
    let spec = format!("refs/fgos/mail-bodies/{machine}:{hash}");
    Command::new("git")
        .arg("-C")
        .arg(&remote)
        .args(["cat-file", "blob", &spec])
        .env("GIT_CONFIG_GLOBAL", "/dev/null")
        .env("GIT_CONFIG_NOSYSTEM", "1")
        .output()
        .ok()
        .filter(|out| out.status.success())
        .map(|out| String::from_utf8_lossy(&out.stdout).into_owned())
}

/// With `bodyRef` on a send is version 3: the signed event holds the body's hash and length (and the
/// wake flag, under the same domain), the body is a blob named by that hash on the sender's mail-body
/// ref at the remote, and one sync of the receiver delivers it to the head, wake included.
#[test]
fn a_send_with_the_body_ref_on_signs_a_version_three_header_and_the_body_reaches_the_head_through_the_body_ref(
) {
    let cross = two_machines();
    confirm_alpha_on_beta(&cross);
    install_body_mapping(&cross);
    turn_on_body_ref(&cross);
    let body = "body that travelled through the body ref";
    let out = alpha_send(&cross, &["--wake", body]);
    let text = String::from_utf8_lossy(&out.stdout).into_owned();
    assert_eq!(out.status.code(), Some(0), "{text} {out:?}");
    assert!(text.contains("Wake requested"), "{text}");

    let events = sent_events(&cross.alpha_root, &cross.alpha.main());
    assert_eq!(events.len(), 1, "{events:?}");
    let mut header = events[0].clone();
    let hash = sha256_hex(body);
    assert_eq!(header["v"], 3);
    assert_eq!(header["bodyHash"], hash.as_str());
    assert_eq!(header["bodyBytes"], body.len());
    assert_eq!(header["wake"], true);
    assert!(
        header.get("body").is_none(),
        "the body is not in the event: {header}"
    );
    let sig: fgos_identity::Signature =
        serde_json::from_value(header.as_object_mut().unwrap().remove("sig").unwrap()).unwrap();
    let canonical = fgos_canonical_json::canonical_json(&header).unwrap();
    let bytes = format!("fgos-mailbox-message/3\n{canonical}").into_bytes();
    let verified = fgos_identity::signing::verify(&cross.beta_root, &bytes, &sig).unwrap();
    assert_eq!(
        verified.machine_id,
        header["from"]["machine"].as_str().unwrap()
    );
    assert_eq!(
        remote_body(&cross, &hash).as_deref(),
        Some(body),
        "the remote holds the body under the sender's mail-body ref"
    );

    sync_child(&cross.alpha);
    sync_child(&cross.beta);
    assert_eq!(cross.beta.message_states().len(), 1);
    assert!(recorded_wakes(&cross.beta)[0].0, "the wake survived");
    let frame = cross.beta.claude_hook("post-tool-use", &post_tool_use());
    assert!(
        String::from_utf8_lossy(&frame.stdout).contains(body),
        "{frame:?}"
    );
}

/// Every commit of every event ref the remote holds, with its files, as text.
fn remote_event_history(cross: &Cross) -> String {
    let remote = cross.alpha.root.join("remote.git");
    let refs = git_out(
        &remote,
        &["for-each-ref", "--format=%(refname)", "refs/fgos/events/"],
        "",
    );
    refs.lines()
        .map(|name| git_out(&remote, &["log", "-p", "--format=%H", name], ""))
        .collect()
}

/// The body is on the remote, acknowledged, before the event exists. A remote that refuses the body
/// push makes the send refuse and record nothing: no event is appended, so no sync of either machine
/// can publish a header without its body; the same send repeated once the remote takes the push
/// records the event and delivers.
#[test]
fn a_body_push_the_remote_refuses_leaves_the_send_unrecorded_and_no_header_published_until_it_is_retried(
) {
    use std::os::unix::fs::PermissionsExt;
    let cross = two_machines();
    confirm_alpha_on_beta(&cross);
    install_body_mapping(&cross);
    turn_on_body_ref(&cross);
    // The remote cannot create a ref under the mail-body namespace: its directory is read-only.
    let namespace = cross.alpha.root.join("remote.git/refs/fgos/mail-bodies");
    fs::create_dir_all(&namespace).unwrap();
    fs::set_permissions(&namespace, fs::Permissions::from_mode(0o555)).unwrap();

    let body = "body the remote will not take at first";
    let out = alpha_send(&cross, &[body]);
    let text = String::from_utf8_lossy(&out.stdout).into_owned();
    assert_eq!(out.status.code(), Some(1), "{text} {out:?}");
    assert!(
        text.contains("not recorded") && text.contains("body-not-published"),
        "{text}"
    );
    assert_eq!(
        sent_events(&cross.alpha_root, &cross.alpha.main()).len(),
        0,
        "a refused body push appends no event"
    );
    sync_child(&cross.alpha);
    sync_child(&cross.beta);
    sync_child(&cross.alpha);
    assert!(
        !remote_event_history(&cross).contains("mailbox.message-sent"),
        "no header reached the remote while its body is not there"
    );
    assert_eq!(cross.beta.message_states().len(), 0);

    fs::set_permissions(&namespace, fs::Permissions::from_mode(0o755)).unwrap();
    let out = alpha_send(&cross, &[body]);
    assert_eq!(out.status.code(), Some(0), "{out:?}");
    assert_eq!(
        remote_body(&cross, &sha256_hex(body)).as_deref(),
        Some(body)
    );
    assert_eq!(sent_events(&cross.alpha_root, &cross.alpha.main()).len(), 1);
    sync_child(&cross.alpha);
    sync_child(&cross.beta);
    assert_eq!(cross.beta.message_states().len(), 1);
}

/// A clone without the mail-body fetch mapping cannot tell a gone body from one it never fetched, so
/// the header is held: the origin's cursor stays before it, nothing is refused to the sender, and the
/// mail after it is still taken, once, however often it is read again. When the mapping is installed
/// the next sync delivers the held mail.
#[test]
fn a_clone_without_the_body_mapping_holds_the_header_and_delivers_it_once_the_mapping_is_installed()
{
    let cross = two_machines();
    confirm_alpha_on_beta(&cross);
    let body = "body held for a clone without the mapping";
    push_bodies(&cross, &[body]);
    append_mail(&cross, "v3-held", &Mail::BodyRef(body));
    append_mail(
        &cross,
        "v1-after",
        &Mail::Inline("plain mail after the held one"),
    );
    sync_child(&cross.alpha);
    let before = cursor_on_alpha(&cross);

    let said = sync_child_said(&cross.beta);
    assert!(said.contains("mailbox-sync: held "), "{said}");
    assert_eq!(cross.beta.message_states().len(), 1, "only the plain mail");
    assert_eq!(
        cursor_on_alpha(&cross),
        before,
        "the cursor stays before the held header"
    );

    sync_child_said(&cross.beta);
    assert_eq!(
        cross.beta.message_states().len(),
        1,
        "reading the plain mail again takes nothing twice"
    );
    sync_child(&cross.alpha);
    assert_eq!(
        alpha_refusals(&cross),
        serde_json::json!({}),
        "a hold refuses nothing to the sender"
    );

    install_body_mapping(&cross);
    sync_child(&cross.beta);
    assert_eq!(
        cross.beta.message_states().len(),
        2,
        "the held mail arrived"
    );
    assert_ne!(cursor_on_alpha(&cross), before, "the cursor moved past it");
    sync_child(&cross.beta);
    assert_eq!(cross.beta.message_states().len(), 2);
}

/// A body fetch that ran after the event fetch and found the blob gone (the sender's ref was reset
/// without it) settles the header as expired, and the sender is told.
#[test]
fn a_header_whose_blob_is_absent_after_a_successful_body_fetch_is_expired_and_the_sender_is_told() {
    let cross = two_machines();
    confirm_alpha_on_beta(&cross);
    install_body_mapping(&cross);
    push_bodies(&cross, &["a different body the ref still holds"]);
    append_mail(
        &cross,
        "v3-expired",
        &Mail::BodyRef("a body the ref no longer holds"),
    );
    sync_child(&cross.alpha);
    let before = cursor_on_alpha(&cross);
    let said = sync_child_said(&cross.beta);
    assert!(!said.contains("held"), "{said}");
    assert_eq!(cross.beta.message_states().len(), 0);
    assert_ne!(
        cursor_on_alpha(&cross),
        before,
        "an expired header is settled, not held"
    );
    sync_child(&cross.alpha);
    assert_eq!(alpha_refusals(&cross)["remote-body-expired"], 1);
}

/// A body fetch that fails proves nothing about the blob: the header is held, not expired, and is
/// delivered by the first sync whose fetch works.
#[test]
fn a_failed_body_fetch_holds_the_header_instead_of_expiring_it() {
    let cross = two_machines();
    confirm_alpha_on_beta(&cross);
    install_body_mapping(&cross);
    let body = "body behind a broken advertisement";
    push_bodies(&cross, &[body]);
    append_mail(&cross, "v3-fetch-failed", &Mail::BodyRef(body));
    sync_child(&cross.alpha);
    // The remote advertises a mail-body ref whose object it does not have: the fetch of the
    // mail-body mirrors fails, while the event sync does not look at that namespace.
    let broken = cross
        .alpha
        .root
        .join("remote.git/refs/fgos/mail-bodies/zz-broken-aaaaaa");
    fs::write(&broken, "1234567890123456789012345678901234567890\n").unwrap();
    let before = cursor_on_alpha(&cross);

    let said = sync_child_said(&cross.beta);
    assert!(said.contains("mailbox-sync: held "), "{said}");
    assert_eq!(cross.beta.message_states().len(), 0);
    assert_eq!(cursor_on_alpha(&cross), before);
    sync_child(&cross.alpha);
    assert_eq!(alpha_refusals(&cross), serde_json::json!({}));

    fs::remove_file(&broken).unwrap();
    sync_child(&cross.beta);
    assert_eq!(
        cross.beta.message_states().len(),
        1,
        "delivered once the fetch worked"
    );
}

/// A second full clone of alpha's machine: same state root (so the same machine id and key), its own
/// checkout of the same remote, bodyRef on.
fn second_clone_of_alpha(cross: &Cross) -> Scene {
    let clone = Scene::new("xsend-alpha-two");
    let state = clone.home().join(".local/state");
    fs::create_dir_all(&state).unwrap();
    let copied = Command::new("cp")
        .arg("-a")
        .arg(&cross.alpha_root)
        .arg(state.join("fgos"))
        .status()
        .unwrap();
    assert!(copied.success());
    migrate_main_to(
        &clone,
        &state.join("fgos"),
        "0123456789abcdef0123456789abcdef",
        &cross.alpha.root.join("remote.git"),
    );
    let out = clone.claude_hook("post-tool-use", &post_tool_use());
    assert_eq!(out.status.code(), Some(0), "{out:?}");
    fs::write(
        clone.main().join(".fgos/config.json"),
        r#"{"mailbox":{"crossMachine":{"enabled":true},"remote":{"bodyRef":true}}}"#,
    )
    .unwrap();
    sync_child(&clone);
    clone
}

/// Two full clones of one machine share its machine id, so they share one mail-body ref, and each
/// builds on what the remote holds: the second clone fetches the mirror first and its tree is the
/// mirror's plus its own blob, so the remote ends with both bodies and nothing is replaced.
#[test]
fn two_clones_of_one_machine_sending_one_message_each_leave_both_bodies_on_the_remote() {
    let cross = two_machines();
    turn_on_body_ref(&cross);
    let other = second_clone_of_alpha(&cross);
    let first = "body sent from the first clone";
    let second = "body sent from the second clone";
    let out = alpha_send(&cross, &[first]);
    assert_eq!(out.status.code(), Some(0), "{out:?}");
    let out = other.run(
        &other.main(),
        Some("sender-a"),
        &["mailbox", "send", "--to", &cross.target, second],
        b"",
    );
    assert_eq!(
        out.status.code(),
        Some(0),
        "{} {}",
        String::from_utf8_lossy(&out.stdout),
        String::from_utf8_lossy(&out.stderr)
    );
    for body in [first, second] {
        assert_eq!(
            remote_body(&cross, &sha256_hex(body)).as_deref(),
            Some(body),
            "{body}"
        );
    }
}

fn unix_now() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs()
}

const DAY: u64 = 86_400;

/// Every object reachable from the remote's tip of alpha's mail-body ref, and how many commits lead
/// to it: what a clone of the remote could still read.
fn remote_reachable(cross: &Cross) -> (String, usize) {
    let machine = fgos_identity::machine::read(&cross.alpha_root).unwrap();
    let remote = cross.alpha.root.join("remote.git");
    let reference = format!("refs/fgos/mail-bodies/{machine}");
    let objects = git_out(&remote, &["rev-list", "--objects", &reference], "");
    let commits = git_out(&remote, &["rev-list", "--count", &reference], "");
    (objects, commits.parse().unwrap())
}

/// The owner machine's sync child resets its mail-body ref to a new root that holds only the bodies
/// whose message was sent less than the lifetime ago. A body the remote holds that this clone never
/// had, and that is young, survives (the root is built on what the fetch brought); an old body is not
/// reachable from the ref any more; a body no message names is dropped.
#[test]
fn the_owner_resets_its_body_ref_to_a_new_root_holding_only_the_bodies_younger_than_the_lifetime() {
    let cross = two_machines();
    turn_on_body_ref(&cross);
    let (old, young, remote_only, orphan) = (
        "body sent eight days ago",
        "body sent one day ago",
        "young body only the remote holds",
        "body no message names",
    );
    let now = unix_now();
    let sent = |ago: u64| fgos_identity::text::iso_utc(now - ago, 0);
    push_bodies_at(
        &cross,
        &[old, young, orphan],
        Some(&format!("{} +0000", now - 2 * 3600)),
    );
    append_mail_at(&cross, "old", &Mail::BodyRef(old), &sent(8 * DAY));
    append_mail_at(&cross, "young", &Mail::BodyRef(young), &sent(DAY));
    append_mail_at(
        &cross,
        "remote-only",
        &Mail::BodyRef(remote_only),
        &sent(DAY),
    );
    // Another clone of the machine pushed one more young body; this clone's own ref lacks it.
    let main = cross.alpha.main();
    let machine = fgos_identity::machine::read(&cross.alpha_root).unwrap();
    let reference = format!("refs/fgos/mail-bodies/{machine}");
    let listed = git_out(&main, &["ls-tree", &reference], "");
    let blob = git_out(&main, &["hash-object", "-w", "--stdin"], remote_only);
    let tree = git_out(
        &main,
        &["mktree"],
        &format!(
            "{listed}\n100644 blob {blob}\t{}\n",
            sha256_hex(remote_only)
        ),
    );
    let ahead = git_out_env(
        &main,
        &["commit-tree", &tree, "-p", &reference, "-m", "ahead"],
        "",
        &[("GIT_COMMITTER_DATE", &format!("{} +0000", now - 3600))],
    );
    git_out(
        &main,
        &["push", "-q", "origin", &format!("{ahead}:{reference}")],
        "",
    );
    let before = remote_reachable(&cross);
    assert!(before.0.contains(&sha256_hex(old)), "{}", before.0);

    sync_child(&cross.alpha);

    for gone in [old, orphan] {
        assert_eq!(remote_body(&cross, &sha256_hex(gone)), None, "{gone}");
    }
    for kept in [young, remote_only] {
        assert_eq!(
            remote_body(&cross, &sha256_hex(kept)).as_deref(),
            Some(kept)
        );
    }
    let (reachable, commits) = remote_reachable(&cross);
    assert_eq!(commits, 1, "a new root, no history");
    for gone in [old, orphan] {
        assert!(
            !reachable.contains(&sha256_hex(gone)),
            "{gone} is still reachable: {reachable}"
        );
    }
    // Nothing is left to cut: another sync changes nothing.
    let remote = cross.alpha.root.join("remote.git");
    let tip = git_out(&remote, &["rev-parse", &reference], "");
    sync_child(&cross.alpha);
    assert_eq!(git_out(&remote, &["rev-parse", &reference], ""), tip);
}

/// With `bodyRef` off nothing rotates: the ref keeps every body and its history.
#[test]
fn a_machine_whose_body_ref_setting_is_off_never_rotates_its_body_ref() {
    let cross = two_machines();
    let (old, orphan) = ("body sent eight days ago", "body no message names");
    let now = unix_now();
    push_bodies_at(
        &cross,
        &[old, orphan],
        Some(&format!("{} +0000", now - 2 * 3600)),
    );
    append_mail_at(
        &cross,
        "old",
        &Mail::BodyRef(old),
        &fgos_identity::text::iso_utc(now - 8 * DAY, 0),
    );
    let before = remote_reachable(&cross);
    sync_child(&cross.alpha);
    assert_eq!(remote_reachable(&cross), before);
    for body in [old, orphan] {
        assert_eq!(
            remote_body(&cross, &sha256_hex(body)).as_deref(),
            Some(body)
        );
    }
}

/// `fgos mailbox status` says whether the body ref is on and how old the oldest kept body is.
#[test]
fn status_names_the_body_ref_setting_and_the_age_of_the_oldest_body_kept() {
    let cross = two_machines();
    let status = || {
        let run = |flag: &[&str]| {
            let mut argv = vec!["mailbox", "status"];
            argv.extend_from_slice(flag);
            cross
                .alpha
                .run(&cross.alpha.main(), Some("sender-a"), &argv, b"")
        };
        let json: serde_json::Value = serde_json::from_slice(&run(&["--json"]).stdout).unwrap();
        (
            json["data"]["crossMachine"]["bodyRef"].clone(),
            String::from_utf8_lossy(&run(&[]).stdout).into_owned(),
        )
    };
    let (data, text) = status();
    assert_eq!(data, serde_json::json!({ "on": false }));
    assert!(text.contains("mailbox.remote.bodyRef is off"), "{text}");

    turn_on_body_ref(&cross);
    let (data, text) = status();
    assert_eq!(data["kept"], 0, "{data}");
    assert!(text.contains("bodyRef is on); none kept"), "{text}");

    let (older, newer) = ("the older body", "the newer body");
    let now = unix_now();
    push_bodies(&cross, &[older, newer]);
    append_mail_at(
        &cross,
        "older",
        &Mail::BodyRef(older),
        &fgos_identity::text::iso_utc(now - 3 * DAY, 0),
    );
    append_mail_at(
        &cross,
        "newer",
        &Mail::BodyRef(newer),
        &fgos_identity::text::iso_utc(now - DAY, 0),
    );
    let (data, text) = status();
    assert_eq!(data["kept"], 2, "{data}");
    assert_eq!(data["on"], true);
    let oldest = data["oldestSentSecs"].as_u64().unwrap();
    assert!(oldest.abs_diff(now - 3 * DAY) <= 2, "{data}");
    assert!(
        text.contains("2 kept, the oldest was sent 72 h ago"),
        "{text}"
    );
}
