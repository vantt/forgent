//! The Claude Code and Codex head finders over real processes, real session
//! files and the adapters contract's facts. A head is a child the test
//! spawns (or, under a real one-shell hop, the test process itself).
#![cfg(unix)]
mod common;

use common::hook_limits;
use common::record::{mkfifo, TempFgos};
use fgos_mailbox::adapters::claude_head::find_head;
use fgos_mailbox::adapters::{payload_head, AdapterFacts, TestedClis};
use fgos_mailbox::ancestry::ancestry_of;
use fgos_mailbox::head::{Ancestry, NoHead};
use fgos_mailbox::hook::Adapter;
use fgos_mailbox_core::WriterKey;
use fgos_process::facts::relation_of;
use fgos_process::facts::{identity_of, self_identity, Record};
use fgos_process::ProcId;
use serde_json::{json, Value};
use std::path::Path;
use std::process::{Child, Command};
use std::time::{Duration, Instant};

/// Puts a session file (or something in its place) into a directory.
type Plant<'a> = Box<dyn Fn(&Path) + 'a>;

const WRITER: &str = "00000000-0000-4000-8000-000000000001";

/// A spawned process killed when the test ends.
struct Spawned(Child);

impl Drop for Spawned {
    fn drop(&mut self) {
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}

fn spawn(program: &str, args: &[&str]) -> Spawned {
    Spawned(Command::new(program).args(args).spawn().unwrap())
}

fn record_of(pid: u32) -> Record {
    identity_of(ProcId(pid)).unwrap().to_record()
}

fn writer() -> WriterKey {
    WriterKey::new(WRITER).unwrap()
}

/// A session file as Claude Code 2.1.308 writes it, for `pid`.
fn session(pid: u32, start_time: &str) -> Value {
    json!({
        "pid": pid,
        "sessionId": WRITER,
        "procStart": start_time,
        "kind": "interactive",
        "entrypoint": "sdk-cli",
        "name": "forgent-session-3a",
        "nameSource": "derived",
        "version": "2.1.308"
    })
}

fn write(dir: &Path, pid: u32, doc: &Value) {
    std::fs::write(dir.join(format!("{pid}.json")), doc.to_string()).unwrap();
}

fn facts(adapter: Adapter) -> AdapterFacts {
    TestedClis::embedded().facts(adapter).unwrap().clone()
}

/// An ancestry whose parent runs `exe` invoked as `argv0`, under
/// `grandparent`.
fn ancestry(parent: Record, exe: &str, argv0: &str, grandparent: Option<Record>) -> Ancestry {
    // A plain binary's command name is its file name.
    let comm = Path::new(exe)
        .file_name()
        .map(|n| n.to_string_lossy().into_owned());
    titled(parent, exe, argv0, comm.as_deref(), grandparent)
}

/// An ancestry whose parent runs `exe` and named itself `comm`.
fn titled(
    parent: Record,
    exe: &str,
    argv0: &str,
    comm: Option<&str>,
    grandparent: Option<Record>,
) -> Ancestry {
    Ancestry {
        parent,
        parent_relation: relation_of(ProcId(std::process::id())).unwrap(),
        parent_exe: Some(exe.into()),
        parent_argv0: Some(argv0.to_string()),
        parent_comm: comm.map(String::from),
        grandparent,
    }
}

/// A head the test spawns, as Claude Code's topology sees it: the
/// grandparent of the entry, under the contract's hook shell.
fn claude_head() -> (Spawned, u32, Ancestry) {
    let child = spawn("sleep", &["30"]);
    let pid = child.0.id();
    let shell = std::fs::canonicalize("/bin/sh").unwrap();
    let hop = ancestry(
        record_of(std::process::id()),
        shell.to_str().unwrap(),
        "/bin/sh",
        Some(record_of(pid)),
    );
    (child, pid, hop)
}

/// The first child of `parent`, waited for.
fn child_of(parent: u32) -> u32 {
    let tree = fgos_identity::os_process_tree();
    let deadline = Instant::now() + Duration::from_secs(5);
    loop {
        for entry in std::fs::read_dir("/proc").unwrap().flatten() {
            let Some(pid) = entry
                .file_name()
                .to_str()
                .and_then(|n| n.parse::<u32>().ok())
            else {
                continue;
            };
            if tree.stat(pid).is_some_and(|s| s.ppid == parent) {
                return pid;
            }
        }
        assert!(Instant::now() < deadline, "no child of {parent} appeared");
        std::thread::sleep(Duration::from_millis(20));
    }
}

fn find(dir: &Path, ancestry: &Ancestry) -> Result<fgos_mailbox::hook::HeadFacts, NoHead> {
    find_head(
        dir,
        ancestry,
        &facts(Adapter::Claude),
        &writer(),
        &hook_limits().hook,
    )
}

#[test]
fn a_session_file_naming_the_head_and_the_writer_gives_that_process_as_the_head() {
    let dir = TempFgos::new("head-finder");
    let (_child, pid, ancestry) = claude_head();
    let record = record_of(pid);
    write(
        dir.scratch().as_path(),
        pid,
        &session(pid, record.start_time.as_deref().unwrap()),
    );

    let head = find(dir.scratch().as_path(), &ancestry).unwrap();

    assert_eq!(head.record, record);
    assert_eq!(head.own_suffix.as_deref(), Some("3a"));
    assert_eq!(head.handle, None);
}

#[test]
fn under_one_shell_hop_the_head_is_the_shells_parent_and_any_other_parent_is_the_wrong_topology() {
    let dir = TempFgos::new("head-finder");
    // A shell that does not exec its last command, invoked as the path the
    // contract names, as Claude Code's hook runner was measured to start
    // the entry; its parent is this process. Every fact is the OS's.
    let shell = spawn("/bin/sh", &["-c", "sleep 30; :"]);
    let entry = child_of(shell.0.id());
    let hop = ancestry_of(entry).unwrap();
    assert_eq!(hop.parent_argv0.as_deref(), Some("/bin/sh"));
    let own = self_identity().unwrap().to_record();
    write(
        dir.scratch().as_path(),
        std::process::id(),
        &session(std::process::id(), own.start_time.as_deref().unwrap()),
    );

    let head = find(dir.scratch().as_path(), &hop).unwrap();
    assert_eq!(head.record, own);

    // The same shell program invoked as `sh` is not what the CLI invokes.
    let bare = spawn("sh", &["-c", "sleep 30; :"]);
    let entry = child_of(bare.0.id());
    assert_eq!(
        find(dir.scratch().as_path(), &ancestry_of(entry).unwrap()),
        Err(NoHead::WrongTopology)
    );
}

#[test]
fn a_session_file_of_another_session_gives_no_head() {
    let dir = TempFgos::new("head-finder");
    let (_child, pid, ancestry) = claude_head();
    let mut doc = session(pid, record_of(pid).start_time.as_deref().unwrap());
    doc["sessionId"] = json!("00000000-0000-4000-8000-000000000002");
    write(dir.scratch().as_path(), pid, &doc);

    assert_eq!(
        find(dir.scratch().as_path(), &ancestry),
        Err(NoHead::OtherSession)
    );
}

#[test]
fn a_session_file_whose_pid_is_not_the_head_gives_no_head() {
    let dir = TempFgos::new("head-finder");
    let (_child, pid, ancestry) = claude_head();
    let mut doc = session(pid, record_of(pid).start_time.as_deref().unwrap());
    doc["pid"] = json!(pid + 1);
    write(dir.scratch().as_path(), pid, &doc);

    assert_eq!(
        find(dir.scratch().as_path(), &ancestry),
        Err(NoHead::OtherProcess)
    );
}

#[test]
fn a_missing_unreadable_symlinked_fifo_or_oversized_session_file_gives_no_head_and_never_follows_the_link(
) {
    let limit = hook_limits().hook.max_read_bytes;
    let (_child, pid, ancestry) = claude_head();
    let valid = session(pid, record_of(pid).start_time.as_deref().unwrap());
    let file = move |dir: &Path| dir.join(format!("{pid}.json"));
    let cases: Vec<(&str, Plant, NoHead)> = vec![
        ("absent", Box::new(|_| {}), NoHead::NoSessionFile),
        (
            "a directory",
            Box::new(move |d| std::fs::create_dir(file(d)).unwrap()),
            NoHead::Unreadable,
        ),
        (
            "a symlink to a valid file",
            Box::new({
                let valid = valid.clone();
                move |d| {
                    let target = d.join("real.json");
                    std::fs::write(&target, valid.to_string()).unwrap();
                    std::os::unix::fs::symlink(&target, file(d)).unwrap();
                }
            }),
            NoHead::Unreadable,
        ),
        (
            "a FIFO",
            Box::new(move |d| mkfifo(&file(d))),
            NoHead::Unreadable,
        ),
        (
            "one byte over the cap",
            Box::new({
                let valid = valid.clone();
                move |d| {
                    let mut text = valid.to_string();
                    let pad = limit as usize + 1 - text.len();
                    text.push_str(&" ".repeat(pad));
                    std::fs::write(file(d), text).unwrap();
                }
            }),
            NoHead::Unreadable,
        ),
        (
            "invalid JSON",
            Box::new(move |d| std::fs::write(file(d), "{not json").unwrap()),
            NoHead::Unreadable,
        ),
    ];
    for (what, make, expected) in cases {
        let dir = TempFgos::new("head-finder");
        make(dir.scratch().as_path());
        assert_eq!(
            find(dir.scratch().as_path(), &ancestry),
            Err(expected),
            "{what}"
        );
    }
}

#[test]
fn a_start_time_the_session_file_disagrees_with_gives_no_head() {
    let dir = TempFgos::new("head-finder");
    let (_child, pid, ancestry) = claude_head();
    let start: u64 = record_of(pid).start_time.unwrap().parse().unwrap();
    write(
        dir.scratch().as_path(),
        pid,
        &session(pid, &(start + 1).to_string()),
    );

    assert_eq!(
        find(dir.scratch().as_path(), &ancestry),
        Err(NoHead::StartTimeMismatch)
    );
}

#[test]
fn a_name_that_is_not_derived_gives_no_own_suffix() {
    let dir = TempFgos::new("head-finder");
    let (_child, pid, ancestry) = claude_head();
    let mut doc = session(pid, record_of(pid).start_time.as_deref().unwrap());
    doc["nameSource"] = json!("auto");
    doc["name"] = json!("fix the login bug-4c");
    write(dir.scratch().as_path(), pid, &doc);

    let head = find(dir.scratch().as_path(), &ancestry).unwrap();
    assert_eq!(head.own_suffix, None);
}

#[test]
fn a_direct_head_must_run_one_of_the_adapters_head_executables() {
    // Each direct CLI's own head executable, as installed here: Codex's
    // release binary, pi's Node (its launcher execs the release through
    // `#!/usr/bin/env node`), omp's single binary.
    let heads = [
        (Adapter::Codex, "/home/u/.codex/releases/0.161.0/bin/codex"),
        (Adapter::Pi, "/home/u/.nvm/versions/node/v24.21.0/bin/node"),
        (Adapter::Omp, "/home/u/.local/bin/omp"),
    ];
    let child = spawn("sleep", &["30"]);
    let record = record_of(child.0.id());
    let at = |exe: &str| ancestry(record.clone(), exe, exe, None);
    // pi's head names itself `pi` on the `node` executable.
    let own_head = |adapter: Adapter, exe: &str| {
        if adapter == Adapter::Pi {
            titled(record.clone(), exe, "node", Some("pi"), None)
        } else {
            at(exe)
        }
    };
    for (adapter, own) in heads {
        let facts = facts(adapter);
        let head = payload_head::find_head(&own_head(adapter, own), &facts).unwrap();
        assert_eq!(head.record, record);
        assert_eq!(head.own_suffix, None);
        let others = heads
            .iter()
            .filter(|(a, _)| *a != adapter)
            .map(|(_, exe)| *exe);
        for wrong in [
            "/usr/lib/systemd/systemd",
            "/home/u/.local/bin/herdr",
            "/usr/bin/zsh",
        ]
        .into_iter()
        .chain(others)
        {
            assert_eq!(
                payload_head::find_head(&at(wrong), &facts),
                Err(NoHead::WrongExecutable),
                "{} {wrong}",
                adapter.word()
            );
        }
        if adapter == Adapter::Pi {
            // Any other Node program (an npm script, an MCP server) runs the
            // same executable under its own command name: refused.
            for comm in [Some("node"), Some("npm"), None] {
                assert_eq!(
                    payload_head::find_head(
                        &titled(record.clone(), own, "node", comm, None),
                        &facts
                    ),
                    Err(NoHead::WrongExecutable),
                    "pi head named {comm:?}"
                );
            }
            // Named `pi` on another executable is refused too.
            assert_eq!(
                payload_head::find_head(
                    &titled(record.clone(), "/usr/bin/zsh", "zsh", Some("pi"), None),
                    &facts
                ),
                Err(NoHead::WrongExecutable)
            );
        }
        // A real ancestry: the entry's parent is a shell, not the CLI.
        let shell = spawn("/bin/sh", &["-c", "sleep 30; :"]);
        let entry = child_of(shell.0.id());
        assert_eq!(
            payload_head::find_head(&ancestry_of(entry).unwrap(), &facts),
            Err(NoHead::WrongExecutable),
            "{}",
            adapter.word()
        );
    }
}

#[test]
fn the_claude_sessions_directory_follows_the_shared_config_dir_resolver() {
    use fgos_mailbox::hook::resolve::{resolver_for, HookEnv};
    let dir = TempFgos::new("head-finder-config-dir");
    let (_child, pid, hop) = claude_head();
    let custom = dir.scratch().join("custom-claude");
    std::fs::create_dir_all(custom.join("sessions")).unwrap();
    write(
        &custom.join("sessions"),
        pid,
        &session(pid, record_of(pid).start_time.as_deref().unwrap()),
    );
    let facts = facts(Adapter::Claude);
    let hook = hook_limits().hook;
    let env = |home: Option<&Path>, config: Option<&Path>| HookEnv {
        home: home.map(|p| p.as_os_str().to_owned()),
        claude_config_dir: config.map(|p| p.as_os_str().to_owned()),
        session_writer: Some(writer()),
        session_env: None,
    };

    let with_config = env(Some(&dir.scratch().join("home")), Some(&custom));
    let resolve = resolver_for(Adapter::Claude, &facts, &with_config, &hook);
    assert_eq!(resolve(b"{}", &hop).unwrap().head.record, record_of(pid));

    let home = dir.scratch().join("home");
    std::fs::create_dir_all(home.join(".claude")).unwrap();
    std::fs::rename(custom.join("sessions"), home.join(".claude/sessions")).unwrap();
    let from_home = env(Some(&home), None);
    let resolve = resolver_for(Adapter::Claude, &facts, &from_home, &hook);
    assert_eq!(resolve(b"{}", &hop).unwrap().head.record, record_of(pid));

    let neither = env(None, None);
    let resolve = resolver_for(Adapter::Claude, &facts, &neither, &hook);
    assert_eq!(resolve(b"{}", &hop).unwrap_err(), NoHead::NoSessionFile);
}

#[test]
fn a_codex_pi_or_omp_entry_resolves_its_writer_from_the_payload_and_its_head_at_the_direct_position(
) {
    use fgos_mailbox::hook::resolve::{resolver_for, HookEnv};
    let hook = hook_limits().hook;
    let env = HookEnv {
        home: None,
        claude_config_dir: None,
        session_writer: None,
        session_env: None,
    };
    let child = spawn("sleep", &["30"]);
    let record = record_of(child.0.id());
    let payload = format!(r#"{{"session_id":"{WRITER}"}}"#);
    for (adapter, exe) in [
        (Adapter::Codex, "/home/u/.codex/releases/0.161.0/bin/codex"),
        (Adapter::Pi, "/home/u/.nvm/versions/node/v24.21.0/bin/node"),
        (Adapter::Omp, "/home/u/.local/bin/omp"),
    ] {
        let facts = facts(adapter);
        let resolve = resolver_for(adapter, &facts, &env, &hook);
        let at = if adapter == Adapter::Pi {
            titled(record.clone(), exe, "node", Some("pi"), None)
        } else {
            ancestry(record.clone(), exe, exe, None)
        };
        let resolved = resolve(payload.as_bytes(), &at)
            .unwrap_or_else(|e| panic!("{}: {e:?}", adapter.word()));
        assert_eq!(resolved.writer, writer(), "{}", adapter.word());
        assert_eq!(resolved.head.record, record, "{}", adapter.word());
        assert_eq!(
            resolve(b"{}", &at).unwrap_err(),
            NoHead::NoWriter,
            "{}: a payload without a session names no writer",
            adapter.word()
        );
        // An entry whose own environment names another session is a tool
        // process piping someone else's payload: refused.
        let piped = HookEnv {
            session_env: Some("00000000-0000-4000-8000-00000000ffff".to_string()),
            ..env.clone()
        };
        let resolve = resolver_for(adapter, &facts, &piped, &hook);
        assert_eq!(
            resolve(payload.as_bytes(), &at).unwrap_err(),
            NoHead::WriterMismatch,
            "{}",
            adapter.word()
        );
    }
}

#[test]
fn a_codex_entry_takes_its_writer_from_the_payload_and_refuses_an_environment_naming_another_session(
) {
    let payload = br#"{"session_id":"00000000-0000-4000-8000-000000000001"}"#;
    assert_eq!(
        payload_head::payload_writer(payload, None).unwrap(),
        writer()
    );
    assert_eq!(
        payload_head::payload_writer(payload, Some(WRITER)).unwrap(),
        writer()
    );
    assert_eq!(
        payload_head::payload_writer(payload, Some("00000000-0000-4000-8000-000000000002")),
        Err(NoHead::WriterMismatch)
    );
    for bad in [
        &b"{}"[..],
        br#"{"session_id":""}"#,
        br#"{"session_id":"a b"}"#,
        b"not json",
    ] {
        assert_eq!(
            payload_head::payload_writer(bad, None),
            Err(NoHead::NoWriter)
        );
    }
}
