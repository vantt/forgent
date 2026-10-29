//! `fgos hook mailbox-sync --dir <project>`, the detached child of the
//! mailbox hook: it seals the clone's open streams and pushes them, ends with
//! status 0 and prints nothing, whatever it was pointed at. The schedule that
//! starts it is the hook's, proved with the hook; the Event Store's own sync
//! is proved by the store.
#![cfg(unix)]

use fgos_event_store::{
    append::{append, AppendRequest, EventInput},
    layout::{Layout, StreamId},
    registry::Registry,
};
use fgos_git::{GitDriver, ResolveRepo};
use std::fs;
use std::os::unix::fs::PermissionsExt;
use std::path::{Path, PathBuf};
use std::process::{Command, Output};

fn git(dir: &Path, args: &[&str]) -> String {
    let out = Command::new("git").arg("-C").arg(dir).args(args).output().unwrap();
    assert!(out.status.success(), "git {args:?}: {}", String::from_utf8_lossy(&out.stderr));
    String::from_utf8_lossy(&out.stdout).into_owned()
}

fn private_dir(path: &Path) {
    fs::create_dir_all(path).unwrap();
    fs::set_permissions(path, fs::Permissions::from_mode(0o700)).unwrap();
}

fn child(state: &Path, dir: &Path) -> Output {
    let home = state.with_extension("home");
    fs::create_dir_all(&home).unwrap();
    Command::new(env!("CARGO_BIN_EXE_fgos"))
        .args(["hook", "mailbox-sync", "--dir"])
        .arg(dir)
        .args(["--remote", "origin"])
        .env("FGOS_STATE_ROOT", state)
        .env("HOME", home)
        .env_remove("XDG_CONFIG_HOME")
        .current_dir(dir)
        .output()
        .unwrap()
}

#[test]
fn the_sync_child_pushes_an_unsealed_mailbox_event_and_stays_silent() {
    let world = std::env::temp_dir().join(format!("fgos_test_mailbox_sync_child_{}", std::process::id()));
    let _ = fs::remove_dir_all(&world);
    private_dir(&world);
    let remote = world.join("remote.git");
    git(&world, &["init", "--bare", "-q", remote.to_str().unwrap()]);
    let state = world.join("state");
    private_dir(&state);
    fs::write(state.join("machine-id"), "alpha-aaaaaa\n").unwrap();

    // A clone of a migrated project: the `.fgos/events` fence is there and the fetch mapping is set.
    let root = world.join("alpha");
    git(&world, &["clone", "-q", remote.to_str().unwrap(), root.to_str().unwrap()]);
    private_dir(&root);
    fs::create_dir_all(root.join(".fgos")).unwrap();
    fs::write(
        root.join(".fgos/project.json"),
        r#"{"v":1,"projectId":"0123456789abcdef0123456789abcdef","handle":"demo","createdAt":"2026-10-24T00:00:00.000Z"}"#,
    )
    .unwrap();
    let fence = root.join(".fgos/locks/activation.lock");
    fs::create_dir_all(&fence).unwrap();
    fs::write(fence.join("TOMBSTONE"), "{\"at\":\"fixture\",\"v\":1,\"lock\":\"activation\",\"by\":\"fgos git\"}\n").unwrap();
    fs::write(root.join(".fgos/events"), "fence\n").unwrap();
    let driver = GitDriver::new(&world).unwrap();
    let repo = match driver.resolve_repo(&root, &root).unwrap() {
        ResolveRepo::Repository(repo) => repo,
        _ => panic!("a clone is a repository"),
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

    // One mailbox event, appended and not sealed: nothing can reach the remote until a sync seals it.
    let stream = StreamId::parse("project:mailbox").unwrap();
    let event = EventInput {
        event_type: "mailbox.message-sent".to_owned(),
        schema_version: 1,
        payload: serde_json::json!({ "v": 1, "id": "m1" }),
        ts: "2026-10-29T00:00:00.000Z".to_owned(),
    };
    append(
        &layout,
        &Registry::shipped().unwrap(),
        AppendRequest { stream: &stream, events: &[event], cursor: &Default::default(), writer: "test", machine: "alpha-aaaaaa", held_ranks: &[] },
    )
    .unwrap();
    assert_eq!(git(&remote, &["for-each-ref", "refs/fgos/"]), "", "nothing is pushed before the child runs");

    let out = child(&state, &root);
    assert_eq!(out.status.code(), Some(0), "{}", String::from_utf8_lossy(&out.stderr));
    assert!(out.stdout.is_empty() && out.stderr.is_empty(), "a successful child prints nothing");
    let refs = git(&remote, &["for-each-ref", "refs/fgos/"]);
    assert!(refs.contains("alpha-aaaaaa"), "the sealed mailbox stream reached the remote: {refs:?}");
    let _ = fs::remove_dir_all(&world);
}

#[test]
fn the_sync_child_ends_quietly_with_status_zero_outside_a_repository_and_on_a_bad_flag() {
    let world: PathBuf = std::env::temp_dir().join(format!("fgos_test_mailbox_sync_child_none_{}", std::process::id()));
    let _ = fs::remove_dir_all(&world);
    private_dir(&world);
    let state = world.join("state");
    private_dir(&state);
    fs::write(state.join("machine-id"), "alpha-aaaaaa\n").unwrap();
    let plain = world.join("plain");
    private_dir(&plain);
    let out = child(&state, &plain);
    assert_eq!(out.status.code(), Some(0));
    assert!(out.stdout.is_empty() && out.stderr.is_empty());
    let out = Command::new(env!("CARGO_BIN_EXE_fgos")).args(["hook", "mailbox-sync", "--bogus"]).current_dir(&plain).output().unwrap();
    assert_eq!(out.status.code(), Some(0));
    assert!(out.stdout.is_empty() && out.stderr.is_empty());
    let _ = fs::remove_dir_all(&world);
}
