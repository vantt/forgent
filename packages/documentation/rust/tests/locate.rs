//! The locate use case over real pkm: the fixture corpus is indexed by pkm's own worker (in a thread here; a
//! detached process in production) with pkm's deterministic test embedder, so no model is needed.

use std::path::{Path, PathBuf};
use std::thread;
use std::time::Duration;

use fgos_documentation::locate::locate;
use fgos_documentation::pkm::{
    search_options, worker_running, EmbedderChoice, LocatePaths, PkmLocator,
};
use fgos_documentation::port::{IndexKind, Query, WorkerLauncher};
use fgos_documentation::profile;
use fgos_documentation::scan::FsMentionScanner;

const READY_WAIT: Duration = Duration::from_secs(120);

fn fixture() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/vault")
}

fn paths(state: &Path) -> LocatePaths {
    LocatePaths {
        docs_root: fixture(),
        graph_db: state.join("graph.db"),
        search_db: state.join("search/search.db"),
        model_dir: state.join("models"),
        profile: state.join("profile.yaml"),
    }
}

/// A launcher that reports what pkm's lock says and refuses to start anything: the test runs the worker itself.
struct NoStart<'a>(&'a LocatePaths);

impl WorkerLauncher for NoStart<'_> {
    fn running(&self) -> bool {
        worker_running(self.0)
    }
    fn start(&self) -> std::io::Result<()> {
        Err(std::io::Error::other("the test starts no process"))
    }
}

fn query(text: &str, area: &[&str]) -> Query {
    Query {
        parts: vec![text.to_owned()],
        area: area.iter().map(|a| (*a).to_owned()).collect(),
        question: Vec::new(),
        exact: Vec::new(),
    }
}

fn scanner(p: &LocatePaths) -> FsMentionScanner {
    FsMentionScanner::new(&p.docs_root)
}

#[test]
fn a_ready_index_answers_with_repository_paths_axes_and_the_region_flag() {
    let state = tempfile::tempdir().unwrap();
    let p = paths(state.path());
    profile::write_if_changed(&p.docs_root, &p.profile).unwrap();
    let mut opts = search_options(&p, EmbedderChoice::Fake);
    opts.worker_idle = Duration::from_secs(60);
    let worker = {
        let (root, opts) = (p.docs_root.clone(), opts.clone());
        thread::spawn(move || pkm_core::search::run_worker(&root, &opts, None))
    };
    // A session opened before the worker holds its lock reads a missing index as broken, so wait for the lock first,
    // as production does: the use case starts the worker before it asks the locator.
    let deadline = std::time::Instant::now() + READY_WAIT;
    while !worker_running(&p) {
        assert!(
            std::time::Instant::now() < deadline,
            "the worker never took its lock"
        );
        thread::sleep(Duration::from_millis(50));
    }
    let locator = PkmLocator::open(&p, EmbedderChoice::Fake);
    let ready = locator.wait_ready(READY_WAIT);
    assert_eq!(
        ready.kind,
        IndexKind::Ready,
        "the fixture index never became ready: {}",
        ready.action
    );

    let answer = locate(
        || &locator,
        &NoStart(&p),
        &scanner(&p),
        &query("the land door rebases and pushes branches to main", &[]),
    )
    .unwrap();
    assert!(!answer.partial);
    assert_eq!(answer.state, IndexKind::Ready);
    assert_eq!(answer.action, None);
    let top = &answer.parts[0].candidates[0];
    assert_eq!(top.path, "docs/platform/git/decisions/land-door.md");
    assert_eq!(top.rank, 1);
    assert_eq!(
        top.title, "land-door",
        "pkm titles a document by its file name"
    );
    assert_eq!(top.section.last().map(String::as_str), Some("Decision"));
    assert_eq!(top.axes.get("area").map(String::as_str), Some("git"));
    assert_eq!(top.axes.get("question").map(String::as_str), Some("choice"));
    assert!(
        !top.outside_region,
        "no region guessed, so nothing is outside it"
    );
    assert!(answer.parts[0]
        .candidates
        .iter()
        .all(|c| c.path.starts_with("docs/")));

    let guessed = locate(
        || &locator,
        &NoStart(&p),
        &scanner(&p),
        &query("the runner dispatches each unit to an executor", &["git"]),
    )
    .unwrap();
    let runner = guessed.parts[0]
        .candidates
        .iter()
        .find(|c| c.path == "docs/platform/runner/spec.md")
        .expect("the runner spec is a candidate");
    assert!(
        runner.outside_region,
        "a runner document lies outside the guessed git area"
    );
    assert_eq!(
        runner.axes.get("question").map(String::as_str),
        Some("current-truth")
    );
    let place = guessed.parts[0]
        .places
        .iter()
        .find(|pl| pl.axis == "area")
        .expect("an area place");
    assert!(place
        .home
        .as_deref()
        .is_some_and(|h| h.starts_with("docs/")));

    let two = locate(
        || &locator,
        &NoStart(&p),
        &scanner(&p),
        &Query {
            parts: vec!["worktree remove verb".into(), "land door".into()],
            ..Query::default()
        },
    )
    .unwrap();
    assert_eq!(two.parts.len(), 2);
    assert!(
        two.group.is_some(),
        "a call with two parts carries a group hint"
    );

    // A history document, or a reference note about another project, is never a candidate, even for a draft that
    // only it matches.
    for (draft, folder) in [
        (
            "the runner once polled the backlog with a background watch daemon every minute",
            "/history/",
        ),
        (
            "the other project's pollers read a queue of chores in the greenhouse every hour",
            "docs/distillery/",
        ),
    ] {
        let answer = locate(|| &locator, &NoStart(&p), &scanner(&p), &query(draft, &[])).unwrap();
        assert!(
            answer.parts[0]
                .candidates
                .iter()
                .all(|c| !c.path.contains(folder)),
            "{folder}: {:?}",
            answer.parts[0].candidates
        );
    }

    // A gold set written in repository paths is measured on vault paths and reported back in repository paths.
    let measured = locator
        .eval(
            "cases:\n  - id: land\n    text: \"the land door rebases and pushes branches to main\"\n    expect:\n      - {path: docs/platform/git/decisions/land-door.md, section: [\"Decision\"]}\n",
        )
        .unwrap();
    assert_eq!(measured["recall@3"], 1.0, "{measured}");
    assert_eq!(
        measured["results"][0]["top"][0], "docs/platform/git/decisions/land-door.md",
        "{measured}"
    );

    let stop = pkm_core::search::stop_worker(&p.docs_root, &opts, Duration::from_secs(30));
    assert!(stop.is_ok(), "{stop:?}");
    assert_eq!(worker.join().unwrap(), 0);
}

#[test]
fn with_no_worker_and_no_index_the_answer_is_partial_and_empty() {
    let state = tempfile::tempdir().unwrap();
    let p = paths(state.path());
    profile::write_if_changed(&p.docs_root, &p.profile).unwrap();
    let locator = PkmLocator::open(&p, EmbedderChoice::Fake);
    let answer = locate(
        || &locator,
        &NoStart(&p),
        &scanner(&p),
        &query("the runner dispatches each unit", &[]),
    )
    .unwrap();
    assert!(answer.partial);
    assert_eq!(answer.state, IndexKind::Starting);
    assert!(answer.parts.iter().all(|part| part.candidates.is_empty()));
    let action = answer.action.unwrap();
    assert!(
        action.contains("did not start"),
        "the launcher's refusal is named: {action}"
    );
}

#[test]
fn mentions_come_from_the_files_on_disk_even_with_no_index_and_skip_excluded_folders() {
    let state = tempfile::tempdir().unwrap();
    let corpus = tempfile::tempdir().unwrap();
    let write = |name: &str, body: &str| {
        let file = corpus.path().join(name);
        std::fs::create_dir_all(file.parent().unwrap()).unwrap();
        std::fs::write(file, body).unwrap();
    };
    write(
        "platform/git/spec.md",
        "# Git\n\n## Land\n\nthe `fgos land` verb\n",
    );
    write(
        "platform/git/history/old.md",
        "# Old\n\nthe `fgos land` verb\n",
    );
    let p = LocatePaths {
        docs_root: corpus.path().to_path_buf(),
        ..paths(state.path())
    };
    profile::write_if_changed(&p.docs_root, &p.profile).unwrap();
    let locator = PkmLocator::open(&p, EmbedderChoice::Fake);
    // A file that lands after the locator opened is still found: the scan reads disk, not the index.
    write(
        "platform/runner/spec.md",
        "# Runner\n\ncalls fgos land; a.b (c)\n",
    );
    let ask = Query {
        parts: vec!["the write door runs `fgos land` first".into()],
        exact: vec!["a.b (c)".into()],
        ..Query::default()
    };
    let answer = locate(|| &locator, &NoStart(&p), &scanner(&p), &ask).unwrap();
    assert!(answer.partial);
    let part = &answer.parts[0];
    assert!(part.candidates.is_empty());
    assert_eq!(part.mentions[0].term, "a.b (c)", "exact strings come first");
    let land = &part.mentions[1];
    assert_eq!((land.term.as_str(), land.total), ("fgos land", 2));
    let found: Vec<&str> = land.sections.iter().map(|s| s.path.as_str()).collect();
    assert_eq!(
        found,
        ["docs/platform/git/spec.md", "docs/platform/runner/spec.md"],
        "the history folder is excluded"
    );
    assert!(land.sections.iter().all(|s| s.missed_by_search));
    assert_eq!(part.mentions[0].sections[0].line, 3);
    let json = serde_json::to_value(&answer).unwrap();
    assert_eq!(
        json["parts"][0]["mentions"][0]["sections"][0]["missedBySearch"],
        true
    );
}

#[test]
fn ten_terms_scan_this_repository_docs_within_a_generous_bound() {
    use fgos_documentation::port::MentionScanner;
    let docs = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../docs");
    let terms: Vec<String> = [
        "fgos land",
        "fgos worktree",
        "locate",
        "L10",
        "D-ADR0035",
        "hexagonal",
        "write door",
        "fgos doc locate",
        "mention",
        "RUL104",
    ]
    .iter()
    .map(|t| (*t).to_owned())
    .collect();
    let started = std::time::Instant::now();
    let found = FsMentionScanner::new(&docs).scan(&terms).unwrap();
    let took = started.elapsed();
    eprintln!("ten-term scan over docs/: {took:?}");
    assert_eq!(found.len(), 10);
    assert!(took < Duration::from_secs(30), "took {took:?}");
}
