#![cfg(target_os = "linux")]
//! An Event Store read observes HEAD in the listing that reads the event refs: an attached HEAD costs
//! no separate HEAD children; a detached or unborn HEAD keeps the two-child observation.
mod reader_support;
use fgos_event_store::{
    cursor::Cursor,
    layout::StreamId,
    read::{read, ReadRequest},
};
use reader_support::*;
use std::{fs, os::unix::fs::PermissionsExt, path::{Path, PathBuf}, process::Command, sync::OnceLock};

static LOG: OnceLock<PathBuf> = OnceLock::new();
/// A `git` that records `<argv>` ahead of the real one on PATH, installed before any driver exists.
fn logging_git() -> &'static Path {
    LOG.get_or_init(|| {
        let dir = std::env::temp_dir().join(format!("es-read-head-bin-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir(&dir).unwrap();
        let real = Command::new("sh").args(["-c", "command -v git"]).output().unwrap().stdout;
        let real = String::from_utf8(real).unwrap().trim().to_owned();
        let log = dir.join("argv.log");
        let script = dir.join("git");
        fs::write(&script, format!("#!/bin/sh\nprintf '%s\\n' \"$*\" >> '{}'\nexec '{real}' \"$@\"\n", log.display())).unwrap();
        fs::set_permissions(&script, fs::Permissions::from_mode(0o755)).unwrap();
        let mut paths = vec![dir];
        paths.extend(std::env::split_paths(&std::env::var_os("PATH").unwrap_or_default()));
        std::env::set_var("PATH", std::env::join_paths(paths).unwrap());
        log
    })
}
fn logged_lines() -> usize {
    fs::read_to_string(logging_git()).map(|l| l.lines().count()).unwrap_or(0)
}
/// Subcommands of the children run against `f`'s repository after the first `from` logged lines.
fn children(f: &Fixture, from: usize) -> Vec<String> {
    let tag = format!("--git-dir={}", f.repo.git_dir().display());
    fs::read_to_string(logging_git())
        .unwrap_or_default()
        .lines()
        .skip(from)
        .filter_map(|l| {
            let mut words = l.split(' ').skip_while(|w| *w != tag).skip(1);
            loop {
                match words.next()? {
                    "-c" => {
                        words.next()?;
                    }
                    option if option.starts_with('-') => {}
                    verb => return Some(verb.to_owned()),
                }
            }
        })
        .collect()
}
fn git(f: &Fixture, args: &[&str]) {
    assert!(Command::new("/usr/bin/git").arg("-C").arg(f.root.join("repo")).args(args).status().unwrap().success(), "{args:?}");
}
fn commit(f: &Fixture) {
    git(f, &["-c", "user.name=T", "-c", "user.email=t@example.invalid", "commit", "-q", "--allow-empty", "-m", "one"]);
}
/// One read; the children it ran, after a first read that settles one-time validation.
fn read_children(f: &Fixture) -> Vec<String> {
    let streams = [StreamId::parse("project").unwrap()];
    let own = "d".repeat(32);
    let one = || {
        read(
            &f.driver,
            &f.repo,
            ReadRequest { layout: &f.layout, origin: &own, streams: &streams, cursor: &Cursor::default(), folded: &[], project: true },
        )
        .unwrap()
    };
    one();
    let from = logged_lines();
    one();
    children(f, from)
}
fn head_children(names: &[String]) -> usize {
    names.iter().filter(|n| *n == "symbolic-ref").count() + names.iter().filter(|n| *n == "rev-parse").count()
}

#[test]
fn an_attached_head_is_read_in_the_tip_listing_with_no_separate_head_children() {
    logging_git();
    let f = Fixture::new();
    commit(&f);
    let names = read_children(&f);
    assert_eq!(names.iter().filter(|n| *n == "for-each-ref").count(), 1, "{names:?}");
    assert_eq!(head_children(&names), 0, "{names:?}");
}

#[test]
fn a_detached_head_keeps_the_two_child_observation() {
    logging_git();
    let f = Fixture::new();
    commit(&f);
    git(&f, &["checkout", "-q", "--detach"]);
    let names = read_children(&f);
    assert!(names.iter().any(|n| n == "for-each-ref"), "{names:?}");
    assert_eq!(head_children(&names), 2, "{names:?}");
}

#[test]
fn an_unborn_head_keeps_the_two_child_observation() {
    logging_git();
    let f = Fixture::new();
    let names = read_children(&f);
    assert!(names.iter().any(|n| n == "for-each-ref"), "{names:?}");
    assert_eq!(head_children(&names), 2, "{names:?}");
}
