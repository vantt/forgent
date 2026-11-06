#![cfg(target_os = "linux")]
//! How many git processes one seal and one checkpointed read start. The Git driver finds `git`
//! once per process on PATH, so this binary puts a logging `git` first on PATH before any driver
//! exists and keeps every case in one test.
mod common;
use common::Repo;
use fgos_event_store::{
    checkpoint::Checkpoint,
    cursor::Cursor,
    layout::StreamId,
    read::{read_checkpointed, ReadRequest},
    seal::{seal_checkpointed, SealRequest},
};
use fgos_git::{GitDriver, ResolveRepo};
use std::{fs, path::PathBuf};

/// A `git` on PATH that appends its arguments to a log and runs the real one.
fn logging_git(root: &std::path::Path) -> PathBuf {
    let real = std::env::split_paths(&std::env::var_os("PATH").unwrap())
        .map(|dir| dir.join("git"))
        .find(|candidate| candidate.is_file())
        .unwrap();
    let bin = root.join("bin");
    fs::create_dir(&bin).unwrap();
    let log = root.join("children.log");
    fs::write(
        bin.join("git"),
        format!(
            "#!/bin/sh\necho \"$*\" >> '{}'\nexec '{}' \"$@\"\n",
            log.display(),
            real.display()
        ),
    )
    .unwrap();
    use std::os::unix::fs::PermissionsExt;
    fs::set_permissions(bin.join("git"), fs::Permissions::from_mode(0o700)).unwrap();
    let mut path = vec![bin];
    path.extend(std::env::split_paths(&std::env::var_os("PATH").unwrap()));
    std::env::set_var("PATH", std::env::join_paths(path).unwrap());
    log
}

#[test]
fn a_seal_after_a_certified_one_and_a_read_continuing_a_checkpoint_spend_a_fixed_number_of_git_children(
) {
    let logs = Repo::new();
    let log = logging_git(&logs.root);
    let children = || fs::read_to_string(&log).unwrap_or_default().lines().count();
    // The commands started since `before`, without the driver's leading options.
    let since = |before: usize| {
        let text = fs::read_to_string(&log).unwrap_or_default();
        let commands: Vec<String> = text
            .lines()
            .skip(before)
            .map(|line| {
                let mut words = line.split(' ').peekable();
                while let Some(word) = words.next_if(|w| w.starts_with('-')) {
                    if word == "-c" || word == "-C" {
                        words.next();
                    }
                }
                words.collect::<Vec<_>>().join(" ")
            })
            .collect();
        commands.join("\n")
    };
    let r = Repo::new();
    let driver = GitDriver::new(&r.root).unwrap();
    let repo = match driver.resolve_repo(&r.root, &r.root).unwrap() {
        ResolveRepo::Repository(repo) => repo,
        _ => panic!(),
    };
    let cp = Checkpoint {
        path: r.root.join("cache/event-history.json"),
        reuse: true,
    };
    let origin = r.append(1).ack.origin;
    let seal = || {
        seal_checkpointed(
            &driver,
            &repo,
            SealRequest {
                layout: &r.layout,
                machine: "test-aa2345",
                stream: &r.stream,
                held_ranks: &[],
                hot_lock_depth: 0,
                opportunistic: false,
            },
            &fgos_event_store::fsio::OsFileSystem,
            None,
        )
        .unwrap()
    };
    let streams = [StreamId::parse("project").unwrap()];
    let empty = Cursor::default();
    let read = || {
        read_checkpointed(
            &driver,
            &repo,
            ReadRequest {
                layout: &r.layout,
                origin: &origin,
                machine: "test-aa2345",
                streams: &streams,
                cursor: &empty,
                folded: &[],
                project: true,
            },
            None,
            &cp,
            None,
        )
        .unwrap()
    };
    seal();
    assert!(read().checkpoint.written);
    r.append(1);
    seal();
    r.append(1);

    let before = children();
    assert_eq!(seal().last_seq, 3);
    assert_eq!(
        children() - before,
        21,
        "a seal whose parent the last receipt certified:\n{}",
        since(before)
    );

    let before = children();
    let next = read();
    assert!(next.checkpoint.continued, "{:?}", next.checkpoint);
    assert_eq!(next.sequence.len(), 3);
    assert_eq!(
        children() - before,
        8,
        "a read continuing a checkpoint two seals behind the tip:\n{}",
        since(before)
    );
}
