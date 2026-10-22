//! The sequence-counter port: a counter is one parentless commit on
//! `refs/fgos/seq/<kind>` replaced only through a compare-and-swap.
#![cfg(target_os = "linux")]
use fgos_git::*;
use std::{
    fs,
    os::unix::fs::PermissionsExt,
    path::{Path, PathBuf},
    process::Command,
    sync::atomic::{AtomicU64, Ordering},
};

static NEXT: AtomicU64 = AtomicU64::new(0);

fn git(path: &Path, args: &[&str]) -> String {
    let out = Command::new("git")
        .arg("-C")
        .arg(path)
        .args(args)
        .output()
        .unwrap();
    assert!(
        out.status.success(),
        "{args:?}: {}",
        String::from_utf8_lossy(&out.stderr)
    );
    String::from_utf8(out.stdout).unwrap().trim().into()
}

/// A bare `origin` and any number of clones of it, sharing one driver state root.
struct Fixture {
    root: PathBuf,
    driver: GitDriver,
}

impl Fixture {
    fn new() -> Self {
        let root = std::env::temp_dir().join(format!(
            "fgos-sequence-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir(&root).unwrap();
        fs::set_permissions(&root, fs::Permissions::from_mode(0o700)).unwrap();
        git(&root, &["init", "-q", "--bare", "origin.git"]);
        let driver = GitDriver::new(&root).unwrap();
        Self { root, driver }
    }

    fn origin(&self) -> String {
        self.root.join("origin.git").to_str().unwrap().into()
    }

    fn clone_named(&self, name: &str, with_origin: bool) -> RepoHandle {
        git(&self.root, &["init", "-q", "--initial-branch=trunk", name]);
        let path = self.root.join(name);
        if with_origin {
            git(&path, &["remote", "add", "origin", &self.origin()]);
        }
        match self.driver.resolve_repo(&path, &path).unwrap() {
            ResolveRepo::Repository(repo) => repo,
            _ => panic!("{name} is not a repository"),
        }
    }
}

impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.root);
    }
}

fn claimed(push: SequencePush) -> Oid {
    match push {
        SequencePush::Claimed(oid) => oid,
        SequencePush::Stale => panic!("the claim was refused as stale"),
    }
}

#[test]
fn a_repository_without_a_remote_keeps_its_counter_in_its_own_ref() {
    let f = Fixture::new();
    let repo = f.clone_named("alone", false);
    let home = f.driver.sequence_home(&repo).unwrap();
    assert!(matches!(home, SequenceHome::Local));
    assert_eq!(f.driver.sequence_tip(&repo, &home, "d-adr").unwrap(), None);

    let first = claimed(
        f.driver
            .sequence_push(&repo, &home, "d-adr", None, 63, "claim-a")
            .unwrap(),
    );
    let tip = f
        .driver
        .sequence_tip(&repo, &home, "d-adr")
        .unwrap()
        .unwrap();
    assert_eq!((tip.oid.clone(), tip.number), (first.clone(), 63));
    assert_eq!(
        git(&f.root.join("alone"), &["rev-parse", "refs/fgos/seq/d-adr"]),
        first.as_str()
    );
    // A commit with no parent: the counter never builds history.
    assert_eq!(
        git(
            &f.root.join("alone"),
            &["rev-list", "--parents", "-1", first.as_str()]
        ),
        first.as_str()
    );

    // The same lease twice: the second writer sees a moved counter.
    assert_eq!(
        f.driver
            .sequence_push(&repo, &home, "d-adr", None, 64, "claim-b")
            .unwrap(),
        SequencePush::Stale
    );
    let second = claimed(
        f.driver
            .sequence_push(&repo, &home, "d-adr", Some(&first), 64, "claim-c")
            .unwrap(),
    );
    assert_ne!(first, second);
}

#[test]
fn a_remote_counter_accepts_one_of_two_claims_made_from_the_same_tip() {
    let f = Fixture::new();
    let a = f.clone_named("a", true);
    let b = f.clone_named("b", true);
    let (home_a, home_b) = (f.driver.sequence_home(&a).unwrap(), f.driver.sequence_home(&b).unwrap());
    assert!(matches!(home_a, SequenceHome::Remote(_)));

    let first = claimed(
        f.driver
            .sequence_push(&a, &home_a, "decision-file", None, 1, "claim-a")
            .unwrap(),
    );
    assert_eq!(
        f.driver
            .sequence_push(&b, &home_b, "decision-file", None, 1, "claim-b")
            .unwrap(),
        SequencePush::Stale,
        "the second claim from an absent counter is refused"
    );

    // The two commits above carry the same number in the same second: the claimant is what tells them apart.
    // The loser reads the tip it has never seen (fetching its one commit) and claims the next number.
    let tip = f
        .driver
        .sequence_tip(&b, &home_b, "decision-file")
        .unwrap()
        .unwrap();
    assert_eq!((tip.oid.clone(), tip.number), (first.clone(), 1));
    let second = claimed(
        f.driver
            .sequence_push(&b, &home_b, "decision-file", Some(&tip.oid), 2, "claim-b")
            .unwrap(),
    );

    // Stale lease: a writer still holding the first tip is refused.
    assert_eq!(
        f.driver
            .sequence_push(&a, &home_a, "decision-file", Some(&first), 2, "claim-a")
            .unwrap(),
        SequencePush::Stale
    );
    assert_eq!(
        git(
            &f.root.join("origin.git"),
            &["rev-parse", "refs/fgos/seq/decision-file"]
        ),
        second.as_str()
    );
    assert_eq!(
        git(
            &f.root.join("origin.git"),
            &["for-each-ref", "refs/fgos/seq"]
        )
        .lines()
        .count(),
        1
    );
}

#[test]
fn an_unreachable_remote_is_a_failure_never_a_stale_answer() {
    let f = Fixture::new();
    let repo = f.clone_named("a", true);
    let home = f.driver.sequence_home(&repo).unwrap();
    fs::remove_dir_all(f.root.join("origin.git")).unwrap();
    assert!(f.driver.sequence_tip(&repo, &home, "d-adr").is_err());
    assert!(f
        .driver
        .sequence_push(&repo, &home, "d-adr", None, 1, "claim-a")
        .is_err());
}

#[test]
fn an_origin_that_cannot_be_used_is_a_refusal_not_a_local_counter() {
    // No other case proves it: an unreadable or unsupported origin used to read as "no origin",
    // and the claim went to a counter on this machine alone.
    let f = Fixture::new();
    let repo = f.clone_named("a", true);
    git(&f.root.join("a"), &["config", "remote.origin.url", "git://example.invalid/r"]);
    let refused = f.driver.sequence_home(&repo).expect_err("an unsupported origin");
    assert!(refused.cause.contains("remote-protocol-not-supported"), "{}", refused.cause);
    git(&f.root.join("a"), &["config", "--unset", "remote.origin.url"]);
    assert!(matches!(f.driver.sequence_home(&repo).unwrap(), SequenceHome::Local));
}

#[test]
fn a_claimant_that_is_not_a_plain_name_is_refused() {
    let f = Fixture::new();
    let repo = f.clone_named("alone", false);
    let home = f.driver.sequence_home(&repo).unwrap();
    for bad in ["", "two words", "a=b", &"x".repeat(65)] {
        assert!(
            f.driver
                .sequence_push(&repo, &home, "d-adr", None, 1, bad)
                .is_err(),
            "{bad:?}"
        );
    }
}

#[test]
fn a_kind_that_is_not_a_slug_is_refused_before_any_ref_is_touched() {
    let f = Fixture::new();
    let repo = f.clone_named("alone", false);
    let home = f.driver.sequence_home(&repo).unwrap();
    assert!(f
        .driver
        .sequence_push(&repo, &home, "../heads/trunk", None, 1, "claim-a")
        .is_err());
    assert!(f.driver.sequence_tip(&repo, &home, "D-ADR").is_err());
}
