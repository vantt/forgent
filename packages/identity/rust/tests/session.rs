//! The session full id and handle. This file owns the rules of the local id's
//! name (CLI part, suffix, pid ids, unresolved) and the composition
//! `<cli>-<suffix>@<machine-handle>`; the writer-id rule itself is owned by
//! `golden.rs`.

use fgos_identity::session::{self, Local, PidFacts};
use fgos_identity::{
    env_identity, machine, HeadRef, machine_info, os_process_tree, pi_family_cli, resolve, session_for, session_info,
    tree_identity, writer_answer, ProcStat, ProcessTree, Source, WriterId, WriterIdentity, WriterKey, ENV_ORDER,
    MAX_ID_LENGTH,
};
use serde_json::json;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};

static NEXT: AtomicU64 = AtomicU64::new(0);

fn state_root() -> PathBuf {
    let dir = std::env::temp_dir().join(format!(
        "fgos-identity-session-{}-{}",
        std::process::id(),
        NEXT.fetch_add(1, Ordering::Relaxed)
    ));
    fs::create_dir_all(&dir).unwrap();
    dir
}

fn from_env(pairs: &[(&str, &str)]) -> WriterIdentity {
    let env: HashMap<String, String> = pairs
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect();
    env_identity(&|key| env.get(key).cloned(), None).expect("usable env id")
}

fn no_facts(_: u32) -> Option<PidFacts> {
    None
}

fn facts(boot: &str, start: &str) -> PidFacts {
    PidFacts {
        boot_id: Some(boot.into()),
        start_time: start.into(),
    }
}

struct Lone;
impl ProcessTree for Lone {
    fn stat(&self, pid: u32) -> Option<ProcStat> {
        (pid == 7).then_some(ProcStat {
            ppid: 1,
            session: 7,
            tty_nr: 0,
        })
    }
}

#[test]
fn each_env_source_names_its_cli() {
    let cli = |var: &str, value: &str| {
        let identity = from_env(&[(var, value)]);
        session::local(&identity, &no_facts).unwrap().cli
    };
    assert_eq!(cli("CLAUDE_CODE_SESSION_ID", "9493ac81"), "claude");
    assert_eq!(cli("CODEX_THREAD_ID", "01a13f6f"), "codex");
    assert_eq!(cli("PI_SESSION_ID", "01a1681b"), "pi");
    assert_eq!(cli("FGOS_SESSION_ID", "att-run-1"), "worker");
    assert_eq!(cli("FGOS_SESSION_ID", "fgos-a"), "fgos");
    // every variable the writer rule reads gives a session a CLI
    for var in ENV_ORDER {
        assert!(session::local(&from_env(&[(var, "x1")]), &no_facts).is_some(), "{var}");
    }
}

#[test]
fn a_registry_confirmed_id_names_the_cli_of_its_env_variable() {
    let dir = state_root();
    fs::write(dir.join("sessions.json"), r#"[{"sessionId":"thread-a"}]"#).unwrap();
    let identity = env_identity(
        &|key| (key == "CODEX_THREAD_ID").then(|| "thread-a".to_string()),
        Some(&dir),
    )
    .unwrap();
    assert_eq!(identity.source, Source::Registry);
    assert_eq!(session::local(&identity, &no_facts).unwrap().cli, "codex");
    let _ = fs::remove_dir_all(dir);
}

#[test]
fn the_same_local_id_always_gives_the_same_handle_and_other_ids_differ() {
    let local = |id: &str| Local { id: id.into(), cli: "claude" };
    let one = session::handle(&local("session-one"), "fg-server");
    assert_eq!(one, session::handle(&local("session-one"), "fg-server"));
    assert_ne!(one, session::handle(&local("session-two"), "fg-server"));
    // the suffix follows the Convention kind and the composition has one shape
    let rule = fgos_convention::rules::packaged_rules().identifier("session-suffix").unwrap();
    let suffix = session::suffix("session-one");
    assert_eq!(rule.check(&suffix), Ok(()));
    assert_eq!(one, format!("claude-{suffix}@fg-server"));
    assert_eq!(session::full_id("fg-server-abc234", &local("session-one")), "fg-server-abc234/session-one");
}

#[test]
fn a_pid_id_changes_with_boot_id_pid_and_start_time_only() {
    let base = session::pid_local_id(&facts("boot-a", "1000"), 7);
    assert!(base.starts_with("pid-"));
    assert_eq!(base, session::pid_local_id(&facts("boot-a", "1000"), 7));
    assert_ne!(base, session::pid_local_id(&facts("boot-b", "1000"), 7));
    assert_ne!(base, session::pid_local_id(&facts("boot-a", "1001"), 7));
    assert_ne!(base, session::pid_local_id(&facts("boot-a", "1000"), 8));
    assert_ne!(base, session::pid_local_id(&PidFacts { boot_id: None, start_time: "1000".into() }, 7));
}

#[test]
fn a_pid_session_is_a_shell_and_an_unreadable_or_unresolved_caller_has_no_handle() {
    let pid = tree_identity(&Lone, 7);
    assert_eq!(pid.source, Source::Pid);
    let local = session::local(&pid, &|p| (p == 7).then(|| facts("boot-a", "1000"))).unwrap();
    assert_eq!(local.cli, "shell");
    assert_eq!(local.id, session::pid_local_id(&facts("boot-a", "1000"), 7));
    // the process is gone between the walk and the read of its facts
    assert_eq!(session::local(&pid, &no_facts), None);
    let unresolved = tree_identity(&Lone, 99);
    assert_eq!(unresolved.source, Source::Unresolved);
    assert_eq!(session::local(&unresolved, &|_| Some(facts("boot-a", "1000"))), None);
    assert_eq!(unresolved.id, WriterId::Pid(99));
}

#[test]
fn bare_answer_keeps_id_and_source_and_never_fails_or_writes_without_a_machine_id() {
    let root = state_root();
    let identity = from_env(&[("CODEX_THREAD_ID", "thread-a")]);
    let answer = writer_answer(&identity, &root, &no_facts);
    assert_eq!(
        answer,
        json!({ "id": "thread-a", "source": "env", "machine": null, "session": null })
    );
    assert_eq!(fs::read_dir(&root).unwrap().count(), 0, "bare identity must not mint");

    fs::write(root.join("machine-id"), "fg-server-abc234\n").unwrap();
    let answer = writer_answer(&identity, &root, &no_facts);
    assert_eq!(answer["machine"], json!({ "id": "fg-server-abc234", "handle": "fg-server" }));
    assert_eq!(answer["session"]["id"], "fg-server-abc234/thread-a");
    let handle = answer["session"]["handle"].as_str().unwrap();
    assert!(handle.starts_with("codex-") && handle.ends_with("@fg-server"), "{handle}");
    let _ = fs::remove_dir_all(root);
}

#[test]
fn the_session_follows_the_machine_alias() {
    let root = state_root();
    fs::write(root.join("machine-id"), "fg-server-abc234\n").unwrap();
    machine::write_alias(&root, "owner").unwrap();
    let identity = from_env(&[("CLAUDE_CODE_SESSION_ID", "s-1")]);
    let info = session_info(&identity, &machine_info(&root).unwrap(), &no_facts).unwrap();
    assert!(info.handle.ends_with("@owner"), "{}", info.handle);
    assert_eq!(info.id, "fg-server-abc234/s-1", "the id keeps the machine id, never the alias");
    let _ = fs::remove_dir_all(root);
}

#[test]
fn a_hook_carried_key_names_the_session_the_env_path_names_and_refuses_what_the_rule_refuses() {
    let root = state_root();
    assert_eq!(
        session_for(&root, &WriterKey { source: "CODEX_THREAD_ID", value: "t-1" }, None).unwrap_err().reason,
        "machine-id-missing"
    );
    fs::write(root.join("machine-id"), "fg-server-abc234\n").unwrap();
    let machine = machine_info(&root).unwrap();
    for (source, value) in [
        ("CLAUDE_CODE_SESSION_ID", "9493ac81"),
        ("CODEX_THREAD_ID", " 01a13f6f "),
        ("FGOS_SESSION_ID", "att-run-1"),
        ("FGOS_SESSION_ID", "fgos-a"),
        ("PI_SESSION_ID", "01a1681b-5502-77ce-870e-b2a223ece46b"),
    ] {
        let by_env = session_info(&from_env(&[(source, value)]), &machine, &no_facts).unwrap();
        let by_key = session_for(&root, &WriterKey { source, value }, None).unwrap();
        assert_eq!(by_key.info, by_env, "{source}={value:?}");
        assert_eq!(by_key.local.cli, session::local(&from_env(&[(source, value)]), &no_facts).unwrap().cli);
    }
    for (source, value) in [
        ("OMP_SESSION_ID", "s-1"),
        ("PI_SESSION_ID", "has space"),
        ("CODEX_THREAD_ID", ""),
        ("CODEX_THREAD_ID", "has space"),
        ("CODEX_THREAD_ID", &"a".repeat(MAX_ID_LENGTH + 1)),
    ] {
        let refusal = session_for(&root, &WriterKey { source, value }, None).unwrap_err();
        assert_eq!(refusal.reason, "invalid-writer-key", "{source}={value:?}");
    }
    let _ = fs::remove_dir_all(root);
}

/// A process table where each process also has a command name.
struct Named(Vec<(u32, u32, &'static str)>);

impl ProcessTree for Named {
    fn stat(&self, pid: u32) -> Option<ProcStat> {
        self.0.iter().find(|(p, ..)| *p == pid).map(|(_, ppid, _)| ProcStat { ppid: *ppid, session: 1, tty_nr: 0 })
    }
    fn comm(&self, pid: u32) -> Option<String> {
        self.0.iter().find(|(p, ..)| *p == pid).map(|(.., name)| name.to_string())
    }
}

#[test]
fn a_pi_session_id_is_labelled_by_the_nearest_pi_or_omp_process_above_the_caller() {
    // tool (bash) -> omp -> zsh; and tool (bash) -> node titled pi -> zsh
    let omp = Named(vec![(30, 20, "bash"), (20, 10, "omp"), (10, 1, "zsh"), (1, 0, "init")]);
    let pi = Named(vec![(30, 20, "bash"), (20, 10, "pi"), (10, 1, "zsh"), (1, 0, "init")]);
    assert_eq!(pi_family_cli(&omp, Some(30)), "omp");
    assert_eq!(pi_family_cli(&pi, Some(30)), "pi");
    assert_eq!(pi_family_cli(&omp, Some(20)), "omp", "the reference pid itself counts");
    // the nearest wins: a pi run by an omp, and an omp run by a pi
    let nested_pi = Named(vec![(40, 30, "bash"), (30, 20, "pi"), (20, 10, "omp"), (10, 1, "zsh")]);
    let nested_omp = Named(vec![(40, 30, "bash"), (30, 20, "omp"), (20, 10, "pi"), (10, 1, "zsh")]);
    assert_eq!(pi_family_cli(&nested_pi, Some(40)), "pi");
    assert_eq!(pi_family_cli(&nested_omp, Some(40)), "omp");
    // no matching ancestor, no pid, an unreadable pid, or a cyclic chain: the neutral label
    let none = Named(vec![(30, 10, "bash"), (10, 1, "zsh")]);
    assert_eq!(pi_family_cli(&none, Some(30)), "pi");
    assert_eq!(pi_family_cli(&omp, None), "pi");
    assert_eq!(pi_family_cli(&omp, Some(999)), "pi");
    assert_eq!(pi_family_cli(&Named(vec![(5, 6, "a"), (6, 5, "b")]), Some(5)), "pi");
}

#[test]
fn the_resolved_pi_session_takes_its_handle_label_from_the_ancestry_and_other_ids_do_not() {
    let omp = Named(vec![(30, 20, "bash"), (20, 10, "omp"), (10, 1, "zsh")]);
    let env = |pairs: &'static [(&'static str, &'static str)]| {
        move |key: &str| pairs.iter().find(|(k, _)| *k == key).map(|(_, v)| v.to_string())
    };
    let cli = |identity: &WriterIdentity| session::local(identity, &no_facts).unwrap().cli;
    let pi_id = resolve(&env(&[("PI_SESSION_ID", "01a1681b-5502")]), &omp, 30, None);
    assert_eq!(pi_id.id, WriterId::Session("01a1681b-5502".into()));
    assert_eq!(cli(&pi_id), "omp");
    // Claude and Codex keep their labels and precedence whatever runs above them
    let both = env(&[("CODEX_THREAD_ID", "t-1"), ("PI_SESSION_ID", "01a1681b-5502")]);
    assert_eq!(cli(&resolve(&both, &omp, 30, None)), "codex");
    let claude = env(&[("CLAUDE_CODE_SESSION_ID", "c-1"), ("PI_SESSION_ID", "01a1681b-5502")]);
    let claude_id = resolve(&claude, &omp, 30, None);
    assert_eq!(claude_id.id, WriterId::Session("01a1681b-5502".into()), "pi outranks claude");
    // an invalid pi value falls through to the next variable
    let bad = env(&[("PI_SESSION_ID", "bad value"), ("CLAUDE_CODE_SESSION_ID", "c-1")]);
    let fell = resolve(&bad, &omp, 30, None);
    assert_eq!((fell.id.clone(), cli(&fell)), (WriterId::Session("c-1".into()), "claude"));
}

#[cfg(target_os = "linux")]
#[test]
fn a_hook_carried_pi_key_with_a_head_pid_gives_the_handle_the_env_path_gives_that_process() {
    let root = state_root();
    fs::write(root.join("machine-id"), "fg-server-abc234\n").unwrap();
    // A process whose kernel command name is `omp`: a shell run through a link of that name.
    let bin = root.join("omp");
    std::os::unix::fs::symlink("/bin/sh", &bin).unwrap();
    let mut child = std::process::Command::new(&bin).args(["-c", "sleep 5; true"]).spawn().unwrap();
    let head = child.id();
    let key = WriterKey { source: "PI_SESSION_ID", value: "01a1681b-5502" };
    let tree = os_process_tree();
    let by_env = resolve(&|k| (k == "PI_SESSION_ID").then(|| key.value.to_string()), tree.as_ref(), head, None);
    let machine = machine_info(&root).unwrap();
    let env_info = session_info(&by_env, &machine, &no_facts).unwrap();
    let start_time = fgos_process::facts::identity_of(fgos_process::ProcId(head)).unwrap().start_time;
    let head_ref = HeadRef { pid: head, start_time };
    let by_key = session_for(&root, &key, Some(&head_ref)).unwrap();
    let reused = HeadRef { start_time: format!("{}0", head_ref.start_time), ..head_ref.clone() };
    let untrusted = session_for(&root, &key, Some(&reused)).unwrap();
    child.kill().unwrap();
    child.wait().unwrap();
    assert_eq!(by_key.local.cli, "omp");
    // a start time that is not the process's means its ancestry is not trusted: neutral label, same id
    assert_eq!(untrusted.info.id, by_key.info.id);
    assert!(untrusted.info.handle.starts_with("pi-"), "{}", untrusted.info.handle);
    assert_eq!(by_key.info, env_info);
    assert!(by_key.info.handle.starts_with("omp-"), "{}", by_key.info.handle);
    // without a head pid the label is the neutral one, and the id stays the same
    let neutral = session_for(&root, &key, None).unwrap();
    assert_eq!(neutral.info.id, by_key.info.id);
    assert!(neutral.info.handle.starts_with("pi-"), "{}", neutral.info.handle);
    let _ = fs::remove_dir_all(root);
}
