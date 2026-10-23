//! The session full id and handle. This file owns the rules of the local id's
//! name (CLI part, suffix, pid ids, unresolved) and the composition
//! `<cli>-<suffix>@<machine-handle>`; the writer-id rule itself is owned by
//! `golden.rs`.

use fgos_identity::session::{self, Local, PidFacts};
use fgos_identity::{
    env_identity, machine, machine_info, session_info, tree_identity, writer_answer, ProcStat,
    ProcessTree, Source, WriterId, WriterIdentity, ENV_ORDER,
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
