//! The locate use case: check the question, make sure an index worker runs, open the locator, keep the ten best.

use crate::port::{Answer, LocateError, Locator, Query, WorkerLauncher, CANDIDATES_MAX, PARTS_MAX};

/// Answers `query`. The question is checked before anything starts. When no index worker runs, one is started before
/// the locator is opened: a locator opened before a worker holds the index reads the missing index as broken. A
/// broken index is the worker's to refuse (it exits at once), so a start is always tried. A worker that fails to
/// start leaves the answer partial and names the failure in `action`.
pub fn locate<L: Locator>(
    open: impl FnOnce() -> L,
    launcher: &dyn WorkerLauncher,
    query: &Query,
) -> Result<Answer, LocateError> {
    let parts: Vec<String> = query
        .parts
        .iter()
        .map(|p| p.trim())
        .filter(|p| !p.is_empty())
        .map(str::to_owned)
        .collect();
    if parts.is_empty() {
        return Err(LocateError::Invalid(
            "locate needs at least one non-empty draft part".into(),
        ));
    }
    if parts.len() > PARTS_MAX {
        return Err(LocateError::Invalid(format!(
            "locate takes at most {PARTS_MAX} draft parts, got {}",
            parts.len()
        )));
    }
    let start_failure = ensure_worker(launcher).err();
    let locator = open();
    let query = Query {
        parts,
        ..query.clone()
    };
    let mut answer = locator.locate(&query)?;
    for part in &mut answer.parts {
        part.candidates.truncate(CANDIDATES_MAX);
    }
    if let Some(e) = start_failure {
        let note = format!("the index worker did not start: {e}");
        answer.action = Some(match answer.action.take() {
            Some(a) => format!("{a} ({note})"),
            None => note,
        });
    }
    Ok(answer)
}

/// Starts a worker when none runs; `Ok(true)` when it started one.
pub fn ensure_worker(launcher: &dyn WorkerLauncher) -> std::io::Result<bool> {
    if launcher.running() {
        return Ok(false);
    }
    launcher.start().map(|()| true)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::port::{Candidate, IndexKind, IndexState, Part};
    use std::cell::Cell;
    use std::collections::BTreeMap;

    struct FakeLocator {
        kind: IndexKind,
        candidates: usize,
    }

    impl Locator for FakeLocator {
        fn locate(&self, query: &Query) -> Result<Answer, LocateError> {
            let candidate = |rank| Candidate {
                rank,
                path: format!("docs/{rank}.md"),
                title: String::new(),
                section: Vec::new(),
                excerpt: None,
                axes: BTreeMap::new(),
                outside_region: false,
            };
            Ok(Answer {
                partial: self.kind != IndexKind::Ready,
                state: self.kind,
                action: None,
                parts: query
                    .parts
                    .iter()
                    .map(|_| Part {
                        candidates: (1..=self.candidates).map(candidate).collect(),
                        places: Vec::new(),
                    })
                    .collect(),
                group: None,
            })
        }
        fn state(&self) -> IndexState {
            IndexState {
                kind: self.kind,
                action: String::new(),
            }
        }
    }

    /// Records the order of events: `start` and `open`.
    struct FakeLauncher<'a> {
        running: bool,
        fails: bool,
        log: &'a Cell<Vec<&'static str>>,
    }

    impl FakeLauncher<'_> {
        fn note(&self, event: &'static str) {
            let mut log = self.log.take();
            log.push(event);
            self.log.set(log);
        }
    }

    impl WorkerLauncher for FakeLauncher<'_> {
        fn running(&self) -> bool {
            self.running
        }
        fn start(&self) -> std::io::Result<()> {
            self.note("start");
            if self.fails {
                Err(std::io::Error::other("no fork"))
            } else {
                Ok(())
            }
        }
    }

    fn query(parts: &[&str]) -> Query {
        Query {
            parts: parts.iter().map(|p| (*p).to_owned()).collect(),
            ..Query::default()
        }
    }

    fn run(
        running: bool,
        fails: bool,
        kind: IndexKind,
        candidates: usize,
        parts: &[&str],
    ) -> (Result<Answer, LocateError>, Vec<&'static str>) {
        let log = Cell::new(Vec::new());
        let launcher = FakeLauncher {
            running,
            fails,
            log: &log,
        };
        let answer = locate(
            || {
                launcher.note("open");
                FakeLocator { kind, candidates }
            },
            &launcher,
            &query(parts),
        );
        (answer, log.take())
    }

    #[test]
    fn a_worker_is_started_before_the_locator_opens_and_only_when_none_runs() {
        assert_eq!(
            run(false, false, IndexKind::Starting, 1, &["a draft"]).1,
            vec!["start", "open"]
        );
        assert_eq!(
            run(true, false, IndexKind::Indexing, 1, &["a draft"]).1,
            vec!["open"]
        );
    }

    #[test]
    fn a_worker_that_fails_to_start_leaves_a_partial_answer_that_names_the_failure() {
        let (answer, _) = run(false, true, IndexKind::Starting, 0, &["a draft"]);
        let answer = answer.unwrap();
        assert!(answer.partial);
        assert!(answer.action.unwrap().contains("did not start: no fork"));
    }

    #[test]
    fn a_question_needs_one_to_eight_non_empty_parts_and_keeps_ten_candidates_each() {
        let (empty, log) = run(false, false, IndexKind::Ready, 14, &[" ", ""]);
        assert!(matches!(empty, Err(LocateError::Invalid(_))));
        assert!(
            log.is_empty(),
            "a refused question starts and opens nothing"
        );
        assert!(matches!(
            run(true, false, IndexKind::Ready, 14, &["x"; 9]).0,
            Err(LocateError::Invalid(_))
        ));
        let answer = run(true, false, IndexKind::Ready, 14, &["one", "  ", "two"])
            .0
            .unwrap();
        assert_eq!(answer.parts.len(), 2);
        assert!(answer
            .parts
            .iter()
            .all(|p| p.candidates.len() == CANDIDATES_MAX));
    }
}
