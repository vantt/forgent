//! The locate use case: check the question, make sure an index worker runs, open the locator, keep the ten best, and
//! beside them list where the corpus files hold each literal term of the draft.

use crate::port::{
    Answer, LocateError, Locator, MentionScanner, Part, Query, WorkerLauncher, CANDIDATES_MAX,
    PARTS_MAX, TERMS_MAX, TERM_MIN_CHARS,
};

/// Answers `query`. The question is checked before anything starts. When no index worker runs, one is started before
/// the locator is opened: a locator opened before a worker holds the index reads the missing index as broken. A
/// broken index is the worker's to refuse (it exits at once), so a start is always tried. A worker that fails to
/// start leaves the answer partial and names the failure in `action`. The mention scan reads the files on disk after
/// the locator answers, so it runs whatever state the index is in; a failed scan leaves `mentions` empty and says so
/// in `action`, never failing the call.
pub fn locate<L: Locator>(
    open: impl FnOnce() -> L,
    launcher: &dyn WorkerLauncher,
    scanner: &dyn MentionScanner,
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
    if let Err(e) = attach_mentions(&mut answer, &query, scanner) {
        add_note(&mut answer, format!("the mention scan failed: {e}"));
    }
    if let Some(e) = start_failure {
        add_note(&mut answer, format!("the index worker did not start: {e}"));
    }
    Ok(answer)
}

fn add_note(answer: &mut Answer, note: String) {
    answer.action = Some(match answer.action.take() {
        Some(a) => format!("{a} ({note})"),
        None => note,
    });
}

/// The spans of `text` between matching backtick runs, trimmed, at least `TERM_MIN_CHARS` long, in order of first
/// appearance and without repeats. A span opens at a run of `n` backticks and closes at the next run of exactly `n`.
fn backticked(text: &str) -> Vec<String> {
    let chars: Vec<char> = text.chars().collect();
    let run_at = |from: usize| chars[from..].iter().take_while(|c| **c == '`').count();
    let mut out: Vec<String> = Vec::new();
    let mut i = 0;
    while i < chars.len() {
        if chars[i] != '`' {
            i += 1;
            continue;
        }
        let open = run_at(i);
        let start = i + open;
        let mut j = start;
        let mut close = None;
        while j < chars.len() {
            if chars[j] == '`' {
                let n = run_at(j);
                if n == open {
                    close = Some(j);
                    break;
                }
                j += n;
            } else {
                j += 1;
            }
        }
        match close {
            Some(end) => {
                let span: String = chars[start..end].iter().collect();
                let span = span.trim();
                if span.chars().count() >= TERM_MIN_CHARS && !out.iter().any(|t| t == span) {
                    out.push(span.to_owned());
                }
                i = end + open;
            }
            None => i = start,
        }
    }
    out
}

/// The terms of one part: its backticked spans, then each `exact` string not already present; the number cut at
/// `TERMS_MAX` is returned beside them.
fn terms(part: &str, exact: &[String]) -> (Vec<String>, usize) {
    let mut all = backticked(part);
    for e in exact {
        if !e.trim().is_empty() && !all.contains(e) {
            all.push(e.clone());
        }
    }
    let dropped = all.len().saturating_sub(TERMS_MAX);
    all.truncate(TERMS_MAX);
    (all, dropped)
}

/// Scans the corpus once for every part's terms, then gives each part its own mentions with `missed_by_search` set on
/// each section whose document is not among that part's candidates.
fn attach_mentions(
    answer: &mut Answer,
    query: &Query,
    scanner: &dyn MentionScanner,
) -> Result<(), LocateError> {
    let per_part: Vec<(Vec<String>, usize)> =
        query.parts.iter().map(|p| terms(p, &query.exact)).collect();
    let mut union: Vec<String> = Vec::new();
    for term in per_part.iter().flat_map(|(t, _)| t) {
        if !union.contains(term) {
            union.push(term.clone());
        }
    }
    if union.is_empty() {
        return Ok(());
    }
    // A partial answer may carry no parts; the mentions still need one per draft part.
    answer.parts.resize_with(query.parts.len(), Part::default);
    for (part, (_, dropped)) in answer.parts.iter_mut().zip(&per_part) {
        part.dropped_terms = *dropped;
    }
    let found = scanner.scan(&union)?;
    for (part, (part_terms, _)) in answer.parts.iter_mut().zip(&per_part) {
        part.mentions = part_terms
            .iter()
            .filter_map(|term| found.iter().find(|m| &m.term == term))
            .cloned()
            .map(|mut m| {
                for at in &mut m.sections {
                    at.missed_by_search = !part.candidates.iter().any(|c| c.path == at.path);
                }
                m
            })
            .collect();
    }
    Ok(())
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
    use crate::port::{Candidate, IndexKind, IndexState, Mention, MentionAt};
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
                        ..Part::default()
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
            &NoScan,
            &query(parts),
        );
        (answer, log.take())
    }

    /// A scanner that finds nothing anywhere.
    struct NoScan;

    impl MentionScanner for NoScan {
        fn scan(&self, terms: &[String]) -> Result<Vec<Mention>, LocateError> {
            Ok(terms.iter().map(|t| mention(t, &[])).collect())
        }
    }

    /// A scanner that finds every term in the given documents.
    struct FoundIn(Vec<&'static str>);

    impl MentionScanner for FoundIn {
        fn scan(&self, terms: &[String]) -> Result<Vec<Mention>, LocateError> {
            Ok(terms.iter().map(|t| mention(t, &self.0)).collect())
        }
    }

    struct BrokenScan;

    impl MentionScanner for BrokenScan {
        fn scan(&self, _: &[String]) -> Result<Vec<Mention>, LocateError> {
            Err(LocateError::Failed("disk gone".into()))
        }
    }

    fn mention(term: &str, paths: &[&str]) -> Mention {
        Mention {
            term: term.to_owned(),
            total: paths.len(),
            truncated: false,
            sections: paths
                .iter()
                .map(|p| MentionAt {
                    path: (*p).to_owned(),
                    section: Vec::new(),
                    line: 1,
                    missed_by_search: false,
                })
                .collect(),
        }
    }

    fn locate_with(
        scanner: &dyn MentionScanner,
        kind: IndexKind,
        candidates: usize,
        query: &Query,
    ) -> Answer {
        let log = Cell::new(Vec::new());
        let launcher = FakeLauncher {
            running: true,
            fails: false,
            log: &log,
        };
        locate(
            || FakeLocator { kind, candidates },
            &launcher,
            scanner,
            query,
        )
        .unwrap()
    }

    #[test]
    fn terms_are_the_backticked_spans_then_exact_strings_deduplicated_and_cut_at_sixteen() {
        let (t, dropped) = terms(
            "`fgos land` and ``a ` b`` and `ab` and ` fgos land ` and `x y z`",
            &["x y z".into(), "A.B (c)".into(), "  ".into()],
        );
        assert_eq!(t, vec!["fgos land", "a ` b", "x y z", "A.B (c)"]);
        assert_eq!(dropped, 0);
        let many: String = (0..20).map(|i| format!("`term{i:02}` ")).collect();
        let (t, dropped) = terms(&many, &[]);
        assert_eq!((t.len(), dropped), (TERMS_MAX, 4));
        assert_eq!(t[0], "term00");
    }

    #[test]
    fn a_mention_in_a_document_the_search_did_not_return_is_marked_missed_by_search() {
        let q = query(&["the `fgos land` verb"]);
        let answer = locate_with(
            &FoundIn(vec!["docs/1.md", "docs/elsewhere.md"]),
            IndexKind::Ready,
            2,
            &q,
        );
        let sections = &answer.parts[0].mentions[0].sections;
        assert!(!sections[0].missed_by_search, "docs/1.md is a candidate");
        assert!(sections[1].missed_by_search);
        assert_eq!(answer.parts[0].candidates.len(), 2, "candidates unchanged");
    }

    #[test]
    fn mentions_are_listed_for_a_partial_answer_with_no_parts_and_for_exact_terms_alone() {
        let q = Query {
            parts: vec!["no names here".into(), "none either".into()],
            exact: vec!["a literal; term".into()],
            ..Query::default()
        };
        let answer = locate_with(&FoundIn(vec!["docs/x.md"]), IndexKind::Starting, 0, &q);
        assert!(answer.partial);
        assert_eq!(answer.parts.len(), 2);
        for part in &answer.parts {
            assert_eq!(part.mentions[0].term, "a literal; term");
            assert!(part.mentions[0].sections[0].missed_by_search);
        }
    }

    #[test]
    fn a_draft_with_no_terms_scans_nothing_and_adds_no_parts() {
        let answer = locate_with(
            &BrokenScan,
            IndexKind::Starting,
            0,
            &query(&["plain prose"]),
        );
        assert!(answer.parts.is_empty() || answer.parts[0].mentions.is_empty());
        assert_eq!(answer.action, None, "a scan that never ran cannot fail");
    }

    #[test]
    fn a_failed_scan_leaves_mentions_empty_and_names_the_failure_in_action() {
        let answer = locate_with(&BrokenScan, IndexKind::Ready, 1, &query(&["a `term` here"]));
        assert!(answer.parts[0].mentions.is_empty());
        assert!(answer
            .action
            .unwrap()
            .contains("mention scan failed: disk gone"));
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
