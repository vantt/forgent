//! The mint door: random ids by kind, and sequence numbers claimed from a
//! counter ref on a real (local, bare) remote with real clones, so the
//! compare-and-swap is proven where the forge would enforce it.

use fgos_identity::mint::{random, Kind, RandomKind, SequenceKind, RANDOM_CHARS};
use fgos_identity::{claim_counter, claim_sequence, release_sequence};
use std::collections::BTreeSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};

static NEXT: AtomicU64 = AtomicU64::new(0);

fn scratch(label: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!(
        "fgos-identity-mint-{label}-{}-{}",
        std::process::id(),
        NEXT.fetch_add(1, Ordering::Relaxed)
    ));
    fs::create_dir_all(&dir).unwrap();
    fs::canonicalize(dir).unwrap()
}

fn git(dir: &Path, args: &[&str]) -> String {
    let out = Command::new("/usr/bin/git")
        .args([
            "-c",
            "user.name=t",
            "-c",
            "user.email=t@example.test",
            "-c",
            "commit.gpgsign=false",
        ])
        .args(args)
        .current_dir(dir)
        .output()
        .unwrap();
    assert!(
        out.status.success(),
        "git {args:?}: {}",
        String::from_utf8_lossy(&out.stderr)
    );
    String::from_utf8(out.stdout).unwrap().trim().to_owned()
}

/// A bare origin and `clones` clones of it, all sharing one state root.
struct World {
    root: PathBuf,
    state: PathBuf,
    clones: Vec<PathBuf>,
}

fn world(clones: usize) -> World {
    let root = scratch("world");
    let origin = root.join("origin");
    fs::create_dir_all(&origin).unwrap();
    git(&origin, &["init", "--bare", "--initial-branch=main"]);
    let paths = (0..clones)
        .map(|n| {
            let name = format!("clone{n}");
            git(&root, &["clone", "-q", origin.to_str().unwrap(), &name]);
            root.join(name)
        })
        .collect();
    World {
        state: root.join("state"),
        root,
        clones: paths,
    }
}

impl World {
    fn counter(&self, kind: &str) -> String {
        git(
            &self.root.join("origin"),
            &["log", "-1", "--format=%B", &format!("refs/fgos/seq/{kind}")],
        )
    }
}

#[test]
fn a_random_id_is_its_prefix_and_ten_base32_characters_that_pass_the_convention_kind() {
    let rules = fgos_convention::rules::packaged_rules();
    for (kind, prefix, rule) in [
        (RandomKind::Work, "tsk-", "work-item-id"),
        (RandomKind::Backlog, "p-", "backlog-id"),
    ] {
        let id = random(kind).unwrap();
        let tail = id
            .strip_prefix(prefix)
            .unwrap_or_else(|| panic!("{id} has no {prefix}"));
        assert_eq!(tail.len(), RANDOM_CHARS);
        assert!(
            tail.bytes().all(|b| matches!(b, b'a'..=b'z' | b'2'..=b'7')),
            "{id}"
        );
        assert_eq!(rules.identifier(rule).unwrap().check(&id), Ok(()), "{id}");
    }
    let many: BTreeSet<String> = (0..2000)
        .map(|_| random(RandomKind::Work).unwrap())
        .collect();
    assert_eq!(
        many.len(),
        2000,
        "50 random bits do not repeat in a few thousand draws"
    );
}

#[test]
fn kinds_parse_by_name_and_sequence_numbers_keep_their_exact_format() {
    for name in fgos_identity::KIND_NAMES {
        assert_eq!(Kind::parse(name).unwrap().name(), *name);
    }
    assert!(Kind::parse("title-hash").is_none());
    assert_eq!(SequenceKind::DAdr.format(73), "D-ADR0073");
    assert_eq!(SequenceKind::DecisionFile.format(21), "0021");
}

#[test]
fn concurrent_claims_from_different_clones_get_distinct_consecutive_numbers() {
    // Five writers race for one number at a time, so the slowest loses at most four times,
    // inside the five attempts a claim has.
    let w = world(5);
    let mut numbers = Vec::new();
    for _ in 0..2 {
        std::thread::scope(|scope| {
            let workers: Vec<_> = w
                .clones
                .iter()
                .map(|clone| {
                    scope.spawn(|| {
                        claim_sequence(&w.state, clone, SequenceKind::DecisionFile)
                            .unwrap()
                            .number
                    })
                })
                .collect();
            numbers.extend(workers.into_iter().map(|worker| worker.join().unwrap()));
        });
    }
    numbers.sort_unstable();
    assert_eq!(
        numbers,
        (1..=10).collect::<Vec<u64>>(),
        "ten racing claims: every number once, none skipped"
    );
    assert_eq!(w.counter("decision-file"), "10");
    let refs = git(&w.root.join("origin"), &["for-each-ref", "refs/fgos/seq"]);
    assert_eq!(
        refs.lines().count(),
        1,
        "one ref and one commit stay on the remote"
    );
}

#[test]
fn a_claim_starts_after_the_highest_number_the_documents_already_carry() {
    let w = world(1);
    let clone = &w.clones[0];
    fs::create_dir_all(clone.join("docs/specs")).unwrap();
    fs::create_dir_all(clone.join("docs/decisions")).unwrap();
    fs::write(
        clone.join("docs/specs/area.md"),
        "# Area\n\nA body line naming D-ADR0099 is not a heading.\n\n### D-ADR0072 (a decision), replaces D-ADR0056\n",
    )
    .unwrap();
    fs::write(clone.join("docs/decisions/0021-some-decision.md"), "# x\n").unwrap();
    fs::write(clone.join("docs/decisions/index.md"), "# index\n").unwrap();

    let adr = claim_sequence(&w.state, clone, SequenceKind::DAdr).unwrap();
    assert_eq!((adr.number, adr.id.as_str()), (73, "D-ADR0073"));
    assert_eq!(
        claim_sequence(&w.state, clone, SequenceKind::DAdr)
            .unwrap()
            .id,
        "D-ADR0074"
    );
    assert_eq!(
        claim_sequence(&w.state, clone, SequenceKind::DecisionFile)
            .unwrap()
            .id,
        "0022"
    );
}

#[test]
fn a_released_number_goes_back_only_while_nobody_claimed_after() {
    let w = world(2);
    let (a, b) = (&w.clones[0], &w.clones[1]);
    let first = claim_sequence(&w.state, a, SequenceKind::DecisionFile).unwrap();
    assert!(release_sequence(&w.state, a, SequenceKind::DecisionFile, first.number).unwrap());
    assert_eq!(w.counter("decision-file"), "0");
    assert_eq!(
        claim_sequence(&w.state, b, SequenceKind::DecisionFile)
            .unwrap()
            .number,
        1,
        "the freed number is claimed again"
    );

    let second = claim_sequence(&w.state, a, SequenceKind::DecisionFile).unwrap();
    let third = claim_sequence(&w.state, b, SequenceKind::DecisionFile).unwrap();
    assert!(
        !release_sequence(&w.state, a, SequenceKind::DecisionFile, second.number).unwrap(),
        "{} was claimed after",
        third.number
    );
    assert_eq!(w.counter("decision-file"), third.number.to_string());
}

#[test]
fn a_repository_without_a_remote_claims_against_its_own_ref() {
    let w = world(0);
    let alone = w.root.join("alone");
    fs::create_dir_all(&alone).unwrap();
    git(&alone, &["init", "-q", "--initial-branch=main"]);
    assert_eq!(
        claim_sequence(&w.state, &alone, SequenceKind::DAdr)
            .unwrap()
            .number,
        1
    );
    assert_eq!(
        claim_sequence(&w.state, &alone, SequenceKind::DAdr)
            .unwrap()
            .number,
        2
    );
    assert_eq!(
        git(&alone, &["log", "-1", "--format=%B", "refs/fgos/seq/d-adr"]),
        "2"
    );
}

#[test]
fn an_unreachable_remote_refuses_the_claim_and_never_changes_the_format() {
    let w = world(1);
    fs::remove_dir_all(w.root.join("origin")).unwrap();
    let refusal = claim_sequence(&w.state, &w.clones[0], SequenceKind::DAdr)
        .expect_err("no network, no number");
    assert_eq!(refusal.reason, "sequence-unreachable");
    assert!(
        refusal.detail.contains("no number was claimed"),
        "{}",
        refusal.detail
    );
}

#[test]
fn an_origin_of_an_unsupported_transport_refuses_the_claim_and_the_give_back_by_name() {
    // No other case proves it: the give-back used to fall back to a local counter when the
    // origin could not be read, silently leaving the number used on the origin.
    let w = world(1);
    let clone = &w.clones[0];
    let first = claim_sequence(&w.state, clone, SequenceKind::DecisionFile).unwrap();
    git(clone, &["config", "remote.origin.url", "git://example.invalid/r"]);

    let claim = claim_sequence(&w.state, clone, SequenceKind::DecisionFile).expect_err("no home");
    assert_eq!(claim.reason, "sequence-unreachable");
    assert!(claim.detail.contains("remote-protocol-not-supported"), "{}", claim.detail);

    let give_back = release_sequence(&w.state, clone, SequenceKind::DecisionFile, first.number)
        .expect_err("a give-back with no home is a refusal, never Ok(false)");
    assert!(
        give_back.detail.contains(&format!("number {} ", first.number))
            && give_back.detail.contains("remote-protocol-not-supported"),
        "{}",
        give_back.detail
    );
    assert_eq!(w.counter("decision-file"), first.number.to_string(), "the origin's counter is untouched");
}

/// The one live-forge check, run by hand: two fresh repositories race a claim on a probe
/// counter of the real remote of this checkout, then the probe ref is deleted.
/// `cargo test -p fgos-identity --test mint -- --ignored live_forge`
#[test]
#[ignore = "talks to the real remote of this checkout"]
fn live_forge_two_machines_race_a_probe_counter() {
    let checkout = Path::new(env!("CARGO_MANIFEST_DIR"));
    let url = git(checkout, &["remote", "get-url", "origin"]);
    let kind = format!("probe-{}", std::process::id());
    let counter = format!("refs/fgos/seq/{kind}");
    let root = scratch("live");
    let state = root.join("state");
    let machines: Vec<PathBuf> = ["a", "b"]
        .iter()
        .map(|name| {
            let dir = root.join(name);
            fs::create_dir_all(&dir).unwrap();
            git(&dir, &["init", "-q", "--initial-branch=main"]);
            git(&dir, &["remote", "add", "origin", &url]);
            dir
        })
        .collect();
    let claim = |dir: &PathBuf| claim_counter(&state, dir, &kind, 0).unwrap();
    let numbers: Vec<u64> = std::thread::scope(|scope| {
        let workers: Vec<_> = machines
            .iter()
            .map(|dir| scope.spawn(|| claim(dir)))
            .collect();
        workers
            .into_iter()
            .map(|worker| worker.join().unwrap())
            .collect()
    });
    let mut sorted = numbers.clone();
    sorted.sort_unstable();
    println!("live forge probe {counter}: two racing claims got {numbers:?}");
    // boundary: the probe ref lives on the real forge; deleting it is the cleanup of this test.
    let cleanup = Command::new("/usr/bin/git")
        .current_dir(&machines[0])
        .args(["push", "origin", "--delete", &counter])
        .output()
        .unwrap();
    println!("cleanup rc={}", cleanup.status.code().unwrap());
    let left = git(&machines[0], &["ls-remote", "origin", &counter]);
    assert!(
        cleanup.status.success() && left.is_empty(),
        "probe ref left behind: {left}"
    );
    assert_eq!(
        sorted,
        vec![1, 2],
        "the forge accepted exactly one claim per number"
    );
}
