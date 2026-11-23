//! The locate use case: check the question, make sure an index worker runs, ask the locator, keep the ten best.

use crate::port::{
    Answer, IndexKind, LocateError, Locator, Query, WorkerLauncher, CANDIDATES_MAX, PARTS_MAX,
};

/// Answers `query`. Starts the index worker first when none runs and the index is not `broken` (a broken index does
/// not heal by restarting; its action says what does). A worker that fails to start leaves the answer partial and
/// names the failure in `action`.
pub fn locate(
    locator: &dyn Locator,
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
    let start_failure = ensure_worker(locator, launcher).err();
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

/// Starts a worker when none runs and the index is not broken.
pub fn ensure_worker(
    locator: &dyn Locator,
    launcher: &dyn WorkerLauncher,
) -> std::io::Result<bool> {
    if launcher.running() || locator.state().kind == IndexKind::Broken {
        return Ok(false);
    }
    launcher.start().map(|()| true)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::port::{Candidate, IndexState, Part};
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

    struct FakeLauncher {
        running: bool,
        fails: bool,
        started: Cell<u32>,
    }

    impl WorkerLauncher for FakeLauncher {
        fn running(&self) -> bool {
            self.running
        }
        fn start(&self) -> std::io::Result<()> {
            self.started.set(self.started.get() + 1);
            if self.fails {
                Err(std::io::Error::other("no fork"))
            } else {
                Ok(())
            }
        }
    }

    fn launcher(running: bool, fails: bool) -> FakeLauncher {
        FakeLauncher {
            running,
            fails,
            started: Cell::new(0),
        }
    }

    fn query(parts: &[&str]) -> Query {
        Query {
            parts: parts.iter().map(|p| (*p).to_owned()).collect(),
            ..Query::default()
        }
    }

    #[test]
    fn a_worker_starts_only_when_none_runs_and_the_index_is_not_broken() {
        for (kind, running, starts) in [
            (IndexKind::Starting, false, 1),
            (IndexKind::ModelMissing, false, 1),
            (IndexKind::Ready, false, 1),
            (IndexKind::Indexing, true, 0),
            (IndexKind::Broken, false, 0),
        ] {
            let l = launcher(running, false);
            locate(
                &FakeLocator {
                    kind,
                    candidates: 1,
                },
                &l,
                &query(&["a draft"]),
            )
            .unwrap();
            assert_eq!(l.started.get(), starts, "{kind:?}, running {running}");
        }
    }

    #[test]
    fn a_worker_that_fails_to_start_leaves_a_partial_answer_that_names_the_failure() {
        let l = launcher(false, true);
        let a = locate(
            &FakeLocator {
                kind: IndexKind::Starting,
                candidates: 0,
            },
            &l,
            &query(&["a draft"]),
        )
        .unwrap();
        assert!(a.partial);
        assert!(a.action.unwrap().contains("did not start: no fork"));
    }

    #[test]
    fn a_question_needs_one_to_eight_non_empty_parts_and_keeps_ten_candidates_each() {
        let l = launcher(true, false);
        let ready = FakeLocator {
            kind: IndexKind::Ready,
            candidates: 14,
        };
        assert!(matches!(
            locate(&ready, &l, &query(&[" ", ""])),
            Err(LocateError::Invalid(_))
        ));
        assert!(matches!(
            locate(&ready, &l, &query(&["x"; 9])),
            Err(LocateError::Invalid(_))
        ));
        let a = locate(&ready, &l, &query(&["one", "  ", "two"])).unwrap();
        assert_eq!(a.parts.len(), 2);
        assert!(a.parts.iter().all(|p| p.candidates.len() == CANDIDATES_MAX));
    }
}
