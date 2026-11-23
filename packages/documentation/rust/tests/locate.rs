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
    }
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
        &locator,
        &NoStart(&p),
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
        &locator,
        &NoStart(&p),
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
        &locator,
        &NoStart(&p),
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
        &locator,
        &NoStart(&p),
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
