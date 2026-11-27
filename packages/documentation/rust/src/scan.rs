//! The filesystem adapter of the mention scan: reads every Markdown file of the corpus on disk, one pass for all
//! terms, so the answer is complete and current whatever state the search index is in. The corpus is the one the
//! profile defines (same excluded folders), and paths carry the `docs/` prefix as candidates do.

use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use crate::port::{LocateError, Mention, MentionAt, MentionScanner, MENTION_SECTIONS_MAX};
use crate::profile::is_excluded_folder;

/// Scans the Markdown files under `docs_root` for literal terms.
pub struct FsMentionScanner {
    docs_root: PathBuf,
}

impl FsMentionScanner {
    pub fn new(docs_root: impl Into<PathBuf>) -> Self {
        Self {
            docs_root: docs_root.into(),
        }
    }
}

impl MentionScanner for FsMentionScanner {
    fn scan(&self, terms: &[String]) -> Result<Vec<Mention>, LocateError> {
        let mut found: Vec<Mention> = terms
            .iter()
            .map(|term| Mention {
                term: term.clone(),
                total: 0,
                truncated: false,
                sections: Vec::new(),
            })
            .collect();
        let mut files = Vec::new();
        collect(&self.docs_root, &self.docs_root, 0, &mut files).map_err(|e| {
            LocateError::Failed(format!(
                "cannot read the corpus {}: {e}",
                self.docs_root.display()
            ))
        })?;
        files.sort();
        for relative in files {
            let text = match fs::read_to_string(self.docs_root.join(&relative)) {
                Ok(text) => text,
                // Not text: not a document to search.
                Err(e) if e.kind() == io::ErrorKind::InvalidData => continue,
                Err(e) => {
                    return Err(LocateError::Failed(format!(
                        "cannot read {}: {e}",
                        relative.display()
                    )))
                }
            };
            let path = format!("docs/{}", slashed(&relative));
            scan_file(&path, &text, &mut found);
        }
        Ok(found)
    }
}

fn slashed(path: &Path) -> String {
    path.components()
        .map(|c| c.as_os_str().to_string_lossy())
        .collect::<Vec<_>>()
        .join("/")
}

/// Markdown files under `dir`, relative to `root`, leaving out the folders the profile excludes. Symbolic links are
/// not followed.
fn collect(root: &Path, dir: &Path, depth: usize, out: &mut Vec<PathBuf>) -> io::Result<()> {
    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let kind = entry.file_type()?;
        let path = entry.path();
        if kind.is_dir() {
            let name = entry.file_name();
            if !is_excluded_folder(&name.to_string_lossy(), depth) {
                collect(root, &path, depth + 1, out)?;
            }
        } else if kind.is_file() && path.extension().is_some_and(|e| e == "md") {
            if let Ok(relative) = path.strip_prefix(root) {
                out.push(relative.to_path_buf());
            }
        }
    }
    Ok(())
}

/// Records, for each term, each section of this file that holds it (the first line of it only).
fn scan_file(path: &str, text: &str, found: &mut [Mention]) {
    let mut headings: Vec<(usize, String)> = Vec::new();
    // The ordinal of the section each term was last recorded in, so a section counts once.
    let mut last: Vec<Option<usize>> = vec![None; found.len()];
    let mut ordinal = 0usize;
    let mut fence: Option<(char, usize)> = None;
    for (index, line) in text.lines().enumerate() {
        match fence_of(line) {
            Some((ch, len)) => match fence {
                None => fence = Some((ch, len)),
                Some((open, n)) if open == ch && len >= n && line.trim_start().len() == len => {
                    fence = None
                }
                _ => {}
            },
            None => {
                if fence.is_none() {
                    if let Some((level, title)) = heading_of(line) {
                        while headings.last().is_some_and(|(l, _)| *l >= level) {
                            headings.pop();
                        }
                        headings.push((level, title));
                        ordinal += 1;
                    }
                }
            }
        }
        for (slot, mention) in found.iter_mut().enumerate() {
            if mention.term.is_empty()
                || last[slot] == Some(ordinal)
                || !line.contains(&mention.term)
            {
                continue;
            }
            last[slot] = Some(ordinal);
            mention.total += 1;
            if mention.sections.len() < MENTION_SECTIONS_MAX {
                mention.sections.push(MentionAt {
                    path: path.to_owned(),
                    section: headings.iter().map(|(_, t)| t.clone()).collect(),
                    line: index + 1,
                    missed_by_search: false,
                });
            } else {
                mention.truncated = true;
            }
        }
    }
}

/// A code fence marker line: the fence character and its run length.
fn fence_of(line: &str) -> Option<(char, usize)> {
    let t = line.trim_start();
    if line.len() - t.len() > 3 {
        return None;
    }
    let ch = t.chars().next().filter(|c| *c == '`' || *c == '~')?;
    let len = t.chars().take_while(|c| *c == ch).count();
    (len >= 3).then_some((ch, len))
}

/// An ATX heading: its level and title.
fn heading_of(line: &str) -> Option<(usize, String)> {
    let t = line.trim_start();
    if line.len() - t.len() > 3 {
        return None;
    }
    let level = t.chars().take_while(|c| *c == '#').count();
    if !(1..=6).contains(&level) {
        return None;
    }
    let rest = &t[level..];
    if !rest.is_empty() && !rest.starts_with([' ', '\t']) {
        return None;
    }
    let title = rest.trim().trim_end_matches('#').trim_end().to_owned();
    Some((level, title))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn corpus(files: &[(&str, &str)]) -> tempfile::TempDir {
        let t = tempfile::tempdir().unwrap();
        for (name, body) in files {
            let p = t.path().join(name);
            fs::create_dir_all(p.parent().unwrap()).unwrap();
            fs::write(p, body).unwrap();
        }
        t
    }

    fn scan(t: &tempfile::TempDir, terms: &[&str]) -> Vec<Mention> {
        let terms: Vec<String> = terms.iter().map(|s| (*s).to_owned()).collect();
        FsMentionScanner::new(t.path()).scan(&terms).unwrap()
    }

    #[test]
    fn a_term_is_found_with_its_heading_path_line_and_docs_prefix() {
        let t = corpus(&[(
            "platform/git/spec.md",
            "# Git\n\nintro\n\n## Land\n\nthe `fgos land` verb\nagain `fgos land`\n\n## Other\n\nnothing\n",
        )]);
        let m = &scan(&t, &["fgos land"])[0];
        assert_eq!((m.total, m.truncated, m.sections.len()), (1, false, 1));
        let at = &m.sections[0];
        assert_eq!(at.path, "docs/platform/git/spec.md");
        assert_eq!(at.section, vec!["Git", "Land"]);
        assert_eq!(at.line, 7);
        assert!(!at.missed_by_search);
    }

    #[test]
    fn a_term_with_spaces_and_punctuation_is_matched_literally() {
        let t = corpus(&[("a.md", "# A\n\nuse a.b (c) [d] * x+y now\nuse aXb (c)\n")]);
        let m = scan(&t, &["a.b (c) [d] * x+y", "a.b (c)"]);
        assert_eq!(m[0].total, 1);
        assert_eq!(m[0].sections[0].line, 3);
        assert_eq!(m[1].total, 1, "one section, however many lines");
    }

    #[test]
    fn more_than_twenty_sections_report_the_full_total_and_truncate_the_list() {
        let body: String = (0..25).map(|i| format!("# S{i}\n\nneedle\n\n")).collect();
        let t = corpus(&[("a.md", &body)]);
        let m = &scan(&t, &["needle"])[0];
        assert_eq!(m.total, 25);
        assert!(m.truncated);
        assert_eq!(m.sections.len(), MENTION_SECTIONS_MAX);
    }

    #[test]
    fn excluded_folders_and_non_markdown_files_are_not_scanned() {
        let t = corpus(&[
            ("platform/runner/history/old.md", "# Old\n\nneedle\n"),
            ("distillery/reports/x.md", "# X\n\nneedle\n"),
            ("notes.txt", "needle\n"),
            ("platform/runner/spec.md", "# Spec\n\nneedle\n"),
        ]);
        let m = &scan(&t, &["needle"])[0];
        assert_eq!(m.total, 1);
        assert_eq!(m.sections[0].path, "docs/platform/runner/spec.md");
    }

    #[test]
    fn a_heading_inside_a_code_fence_is_not_a_section_but_its_text_is_scanned() {
        let t = corpus(&[("a.md", "# Real\n\n```sh\n# comment\nneedle\n```\n")]);
        let m = &scan(&t, &["needle"])[0];
        assert_eq!(m.sections[0].section, vec!["Real"]);
    }

    #[test]
    fn a_missing_corpus_is_a_failure_not_an_empty_answer() {
        let t = tempfile::tempdir().unwrap();
        let scanner = FsMentionScanner::new(t.path().join("nope"));
        assert!(matches!(
            scanner.scan(&["x".to_owned()]),
            Err(LocateError::Failed(_))
        ));
    }
}
