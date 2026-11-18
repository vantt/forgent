//! `--ref`: where a question comes from, checked in the caller's own checkout (its cwd worktree, or the
//! head's worktree from the envelope) because draft plans and discussions live on branches until they land.
//! Returns the ref with the branch and commit of that checkout.

use crate::record::Ref;
use crate::refusal::Refusal;
use fgos_git::{GitDriver, HeadFact, Inspect};
use std::path::Path;

fn invalid(value: &str, why: impl std::fmt::Display) -> Refusal {
    Refusal::new("ref-invalid", format!("{value:?}: {why}"))
}

/// A path segment of a ref: letters, digits, `.`, `_`, `-`, and not `.` or `..`.
fn segment(text: &str) -> bool {
    !text.is_empty()
        && text != "."
        && text != ".."
        && text
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '-'))
}

fn digits(text: &str) -> bool {
    !text.is_empty() && text.chars().all(|c| c.is_ascii_digit())
}

/// What a ref names, once its form is checked.
#[derive(Debug, PartialEq, Eq)]
enum Target<'a> {
    Discussion {
        topic: &'a str,
    },
    Plan {
        dir: &'a str,
        phase: Option<&'a str>,
    },
    Case {
        run_id: &'a str,
    },
}

fn parse(value: &str) -> Result<Target<'_>, Refusal> {
    let form = "discussion:<topic>#Q<n>, plan:<dir>[#phase-<nn>] or case:<runId>[#<gate>]";
    let (kind, rest) = value
        .split_once(':')
        .ok_or_else(|| invalid(value, format!("not one of {form}")))?;
    let (name, anchor) = match rest.split_once('#') {
        Some((name, anchor)) => (name, Some(anchor)),
        None => (rest, None),
    };
    if !segment(name) {
        return Err(invalid(value, "the name is not one path segment"));
    }
    match kind {
        "discussion" => match anchor.and_then(|a| a.strip_prefix('Q')) {
            Some(n) if digits(n) => Ok(Target::Discussion { topic: name }),
            _ => Err(invalid(value, "a discussion ref ends in #Q<n>")),
        },
        "plan" => match anchor {
            None => Ok(Target::Plan {
                dir: name,
                phase: None,
            }),
            Some(a) => match a.strip_prefix("phase-") {
                Some(nn) if nn.len() == 2 && digits(nn) => Ok(Target::Plan {
                    dir: name,
                    phase: Some(nn),
                }),
                _ => Err(invalid(value, "a plan anchor is #phase-<nn>")),
            },
        },
        "case" => match anchor {
            Some(gate) if !segment(gate) => Err(invalid(value, "the gate is not one path segment")),
            _ => Ok(Target::Case { run_id: name }),
        },
        _ => Err(invalid(value, format!("not one of {form}"))),
    }
}

fn exists(root: &Path, relative: &str) -> bool {
    root.join(relative).exists()
}

fn phase_file_exists(root: &Path, dir: &str, nn: &str) -> bool {
    let prefix = format!("phase-{nn}");
    std::fs::read_dir(root.join("plans").join(dir))
        .map(|entries| {
            entries.filter_map(Result::ok).any(|entry| {
                let name = entry.file_name();
                let name = name.to_string_lossy();
                name.starts_with(&prefix) && name.ends_with(".md")
            })
        })
        .unwrap_or(false)
}

/// The branch and commit of the checkout `root`.
fn head_of(root: &Path, value: &str) -> Result<(String, String), Refusal> {
    let fault =
        |e: &dyn std::fmt::Debug| invalid(value, format!("the checkout cannot be read: {e:?}"));
    let (driver, repo) = GitDriver::open_at(root)
        .map_err(|e| fault(&e))?
        .ok_or_else(|| invalid(value, format!("{} is not in a repository", root.display())))?;
    match driver.resolve_head(&repo).map_err(|e| fault(&e))? {
        HeadFact::Attached { target, commit } => {
            let name = target.as_str();
            Ok((
                name.strip_prefix("refs/heads/").unwrap_or(name).to_owned(),
                commit.as_str().to_owned(),
            ))
        }
        HeadFact::Detached { commit } => Ok(("HEAD".to_owned(), commit.as_str().to_owned())),
        HeadFact::Unborn { .. } => Err(invalid(value, "the checkout has no commit yet")),
    }
}

/// Checks `value` against the three forms and against the files of the checkout `root`:
/// `docs/discussions/<topic>/`, `plans/<dir>/plan.md` (and its `phase-<nn>-*.md`), or the case run directory
/// `.fgos/workflow-runs/<runId>`.
pub fn check(root: &Path, value: &str) -> Result<Ref, Refusal> {
    let found = match parse(value)? {
        Target::Discussion { topic } => exists(root, &format!("docs/discussions/{topic}")),
        Target::Plan { dir, phase: None } => exists(root, &format!("plans/{dir}/plan.md")),
        Target::Plan {
            dir,
            phase: Some(nn),
        } => exists(root, &format!("plans/{dir}/plan.md")) && phase_file_exists(root, dir, nn),
        Target::Case { run_id } => exists(root, &format!(".fgos/workflow-runs/{run_id}")),
    };
    if !found {
        return Err(invalid(
            value,
            format!("not found in the checkout {}", root.display()),
        ));
    }
    let (branch, commit) = head_of(root, value)?;
    Ok(Ref {
        value: value.to_owned(),
        branch,
        commit,
    })
}
