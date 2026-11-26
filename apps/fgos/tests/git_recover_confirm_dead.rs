#![cfg(all(target_os = "linux", target_arch = "x86_64"))]
// `fgos git recover --confirm-writer-dead <id>` as a process: the owner's confirmation settles the unfinished Git
// operation of a writer Identity cannot prove dead, and is refused for a caller under an agent CLI and for the
// caller's own writer. The recovery itself (what is settled, what is kept, the wording) is owned by
// `packages/git/rust/tests/incidents.rs`; this file proves only the host's decision about who may confirm.
#![allow(dead_code)] // the shared fixture serves other test files too
include!("../../../packages/git/rust/tests/support/land.rs");

use serde_json::Value;
use std::process::Stdio;
use std::time::{Duration, Instant};

const DEAD_WRITER: &str = "forgotten-session";
const OWN_WRITER: &str = "owner-session";
const CONFIRM: &str = "--confirm-writer-dead";

fn fgos_bin() -> PathBuf {
    PathBuf::from(env!("CARGO_BIN_EXE_fgos"))
}

/// A ScopedCommit that `writer` began and never finished.
fn interrupt_scoped_commit_as(f: &Fixture, id: &str, writer: &str) {
    use fgos_git::wal::*;
    let baseline = f.driver.preflight_commit(&f.repo, vec![], None).unwrap();
    let request = CommitRequest {
        writes: vec!["a".into()],
        message: "interrupted commit".into(),
    };
    let wal = Wal::open(&f.repo).unwrap();
    let kind = OperationKind::ScopedCommit(Box::new(ScopedCommitIntent {
        worktree: baseline.worktree.clone(),
        baseline: serde_json::to_string(&baseline).unwrap(),
        request: serde_json::to_string(&request).unwrap(),
        paths: vec!["a".into()].into(),
        tree: baseline.head.clone(),
        retired_cutover_grant: None,
    }));
    struct AnyAuthority;
    impl PublicationAuthority for AnyAuthority {
        fn validate_publication_borrow(&self, _i: &Intent) -> WalResult<()> {
            Ok(())
        }
    }
    let intent = Intent {
        request_digest: canonical_digest(&(&baseline, &request, writer)).unwrap(),
        kind,
        repo_identity: wal.repository_identity().into(),
        resource_set: vec![format!("worktree:{}", baseline.worktree)],
        authority_binding: baseline.authority.clone(),
        writer_identity: writer.into(),
        object_format: f.repo.object_format(),
        expected: Tip::Oid(baseline.head.clone()),
        next: Tip::Oid(baseline.head.clone()),
    };
    let Begin::Created(chain) = wal.begin(id, intent, &AnyAuthority).unwrap() else {
        panic!("wal begin failed");
    };
    let chain = wal.append(&chain, Phase::Prepared).unwrap();
    wal.append(
        &chain,
        Phase::TargetAttempt {
            prior_target_attempt: None,
            expected: chain.intent().expected.clone(),
            next: chain.intent().next.clone(),
        },
    )
    .unwrap();
}

/// `fgos git recover --json <extra>` as the writer `OWN_WRITER`; the answer's JSON and exit code.
struct Answer {
    json: Value,
    /// Everything the call printed, a refusal's text included.
    text: String,
    code: i32,
}

/// The environment of the owner's call: the state root of the fixture and the writer `OWN_WRITER`.
fn as_own_writer<'a>(command: &'a mut Command, f: &Fixture) -> &'a mut Command {
    command
        .current_dir(&f.main)
        .env("FGOS_STATE_ROOT", f.temp.join("state"))
        .env_remove("FGOS_STATE_HOME")
        .env_remove("FGOS_CONFINED")
        .env_remove("FGOS_PARENT_WRITER_ID")
        .env_remove("FGOS_PIDNS_ANCHOR")
        .env("HOME", &f.temp)
        .env("FGOS_SESSION_ID", OWN_WRITER)
        .env_remove("CODEX_THREAD_ID")
        .env_remove("PI_SESSION_ID")
        .env_remove("CLAUDE_CODE_SESSION_ID")
        .stdin(Stdio::null())
}

fn parse(output: &[u8], code: i32) -> Answer {
    let text = String::from_utf8_lossy(output).into_owned();
    let json = serde_json::from_str(text.trim()).unwrap_or(Value::Null);
    Answer { json, text, code }
}

/// The call from a process no agent CLI is the ancestor of: it runs from a shell that exits at once, so the call is
/// re-parented away from this test's own ancestors, which may themselves be an agent CLI.
fn recover_as_owner(f: &Fixture, extra: &[&str]) -> Answer {
    let out = f.temp.join("owner.out");
    let rc = f.temp.join("owner.rc");
    let _ = fs::remove_file(&rc);
    let script =
        r#"( sleep 1; "$@" > "$OUT" 2>&1; echo $? > "$RC" ) < /dev/null > /dev/null 2>&1 &"#;
    let mut shell = Command::new("sh");
    as_own_writer(&mut shell, f)
        .arg("-c")
        .arg(script)
        .arg("sh")
        .arg(fgos_bin())
        .args(["git", "recover", "--json"])
        .args(extra)
        .env("OUT", &out)
        .env("RC", &rc);
    assert!(shell.status().unwrap().success());
    let until = Instant::now() + Duration::from_secs(60);
    while !rc.exists() {
        assert!(Instant::now() < until, "the owner's call never finished");
        std::thread::sleep(Duration::from_millis(100));
    }
    let code = fs::read_to_string(&rc).unwrap().trim().parse().unwrap();
    parse(&fs::read(&out).unwrap(), code)
}

/// The call from under a process the kernel names `claude`: a copy of the shell, which runs fgos as its child.
fn recover_under_agent(f: &Fixture, extra: &[&str]) -> Answer {
    let agent = f.temp.join("claude");
    fs::copy("/bin/sh", &agent).unwrap();
    let mut shell = Command::new(&agent);
    as_own_writer(&mut shell, f)
        .arg("-c")
        .arg(r#""$@""#)
        .arg("claude")
        .arg(fgos_bin())
        .args(["git", "recover", "--json"])
        .args(extra);
    let out = shell.output().unwrap();
    let printed = [out.stdout, out.stderr].concat();
    parse(&printed, out.status.code().unwrap_or(-1))
}

fn kept_ids(answer: &Answer) -> Vec<String> {
    answer.json["data"]["kept"]
        .as_array()
        .map(|kept| {
            kept.iter()
                .map(|k| k["operationId"].as_str().unwrap().to_owned())
                .collect()
        })
        .unwrap_or_default()
}

#[test]
fn the_owner_naming_a_writer_dead_settles_what_plain_recover_keeps() {
    let f = Fixture::new();
    interrupt_scoped_commit_as(&f, "forgotten-commit", DEAD_WRITER);

    let plain = recover_as_owner(&f, &[]);
    assert_eq!(kept_ids(&plain), ["forgotten-commit"], "{}", plain.text);

    let confirmed = recover_as_owner(&f, &[CONFIRM, DEAD_WRITER]);
    assert_eq!(confirmed.code, 0, "{}", confirmed.text);
    assert!(kept_ids(&confirmed).is_empty(), "{}", confirmed.text);
    let message = confirmed.json["data"]["message"].as_str().unwrap();
    assert!(
        message.contains(DEAD_WRITER) && message.contains(OWN_WRITER),
        "{message}"
    );
}

#[test]
fn a_caller_under_an_agent_cli_cannot_confirm_a_writer_dead() {
    let f = Fixture::new();
    interrupt_scoped_commit_as(&f, "forgotten-commit", DEAD_WRITER);

    let refused = recover_under_agent(&f, &[CONFIRM, DEAD_WRITER]);
    assert_ne!(refused.code, 0, "{}", refused.text);
    assert!(
        refused
            .text
            .contains("only the owner confirms a dead writer"),
        "{}",
        refused.text
    );
    let after = recover_as_owner(&f, &[]);
    assert_eq!(kept_ids(&after), ["forgotten-commit"], "{}", after.text);
}

#[test]
fn nobody_confirms_the_callers_own_writer_dead() {
    let f = Fixture::new();
    interrupt_scoped_commit_as(&f, "own-commit", OWN_WRITER);

    let refused = recover_as_owner(&f, &[CONFIRM, OWN_WRITER]);
    assert_ne!(refused.code, 0, "{}", refused.text);
    assert!(refused.text.contains("own writer"), "{}", refused.text);
}
