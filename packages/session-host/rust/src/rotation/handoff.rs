//! The lineage folder of a head session as the hook reads it: `.fgos/runtime/session-rotation/<persona>-<name>/`.
//! The Node handoff store writes `latest.json` and the handoff files, the rotation executor writes `rotation.json`
//! and `answered.json`; this module only reads them, per `packages/session-host/contracts/rotation-files.v1.json`.

use serde_json::Value;
use std::path::{Path, PathBuf};

/// Most characters of `additionalContext` a session start carries; Claude Code cuts a longer one.
pub const CONTEXT_LIMIT: usize = 10_000;
/// The line of a handoff that carries the rotation id; the successor echoes the id exactly.
pub const ROTATION_ID_PREFIX: &str = "Rotation id: ";
const QUESTION_HEADING: &str = "## Pending question (verbatim)";

#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum HandoffError {
    #[error("{what} must be a lowercase slug, got {got:?}")]
    BadName { what: &'static str, got: String },
    #[error("{path}: {why}")]
    Unreadable { path: String, why: String },
}

fn slug(what: &'static str, value: &str) -> Result<(), HandoffError> {
    let mut chars = value.chars();
    let ok = chars
        .next()
        .is_some_and(|c| c.is_ascii_lowercase() || c.is_ascii_digit())
        && chars.all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-');
    if ok {
        Ok(())
    } else {
        Err(HandoffError::BadName {
            what,
            got: value.to_string(),
        })
    }
}

/// `<fgos_dir>/runtime/session-rotation/<persona>-<name>`; both names are checked as slugs, so an environment
/// value can never leave the folder.
pub fn lineage_dir(fgos_dir: &Path, persona: &str, name: &str) -> Result<PathBuf, HandoffError> {
    slug("persona", persona)?;
    slug("name", name)?;
    Ok(fgos_dir
        .join("runtime")
        .join("session-rotation")
        .join(format!("{persona}-{name}")))
}

/// `<yymmdd>-<hhmm>-<sid8>.md`
fn handoff_file_name(file: &str) -> bool {
    let Some(stem) = file.strip_suffix(".md") else {
        return false;
    };
    let parts: Vec<&str> = stem.split('-').collect();
    parts.len() == 3
        && parts[0].len() == 6
        && parts[0].bytes().all(|c| c.is_ascii_digit())
        && parts[1].len() == 4
        && parts[1].bytes().all(|c| c.is_ascii_digit())
        && (1..=8).contains(&parts[2].len())
        && parts[2].bytes().all(|c| c.is_ascii_alphanumeric())
}

/// The newest handoff of a lineage: the pointer's fields and the file's text.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Latest {
    pub file: String,
    pub path: PathBuf,
    pub text: String,
    pub rotate: Option<String>,
}

fn read_json(file: &Path) -> Result<Option<Value>, HandoffError> {
    match std::fs::read_to_string(file) {
        Ok(text) => Ok(serde_json::from_str(&text).ok()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(HandoffError::Unreadable {
            path: file.display().to_string(),
            why: e.to_string(),
        }),
    }
}

/// The latest handoff, or `None` when the pointer is absent, malformed or names a file that is gone or not a
/// handoff file name.
pub fn read_latest(lineage: &Path) -> Result<Option<Latest>, HandoffError> {
    let Some(pointer) = read_json(&lineage.join("latest.json"))? else {
        return Ok(None);
    };
    let Some(file) = pointer
        .get("file")
        .and_then(Value::as_str)
        .filter(|f| handoff_file_name(f))
    else {
        return Ok(None);
    };
    let path = lineage.join(file);
    match std::fs::read_to_string(&path) {
        Ok(text) => Ok(Some(Latest {
            file: file.to_string(),
            path,
            text,
            rotate: pointer
                .get("rotate")
                .and_then(Value::as_str)
                .map(str::to_string),
        })),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(HandoffError::Unreadable {
            path: path.display().to_string(),
            why: e.to_string(),
        }),
    }
}

/// The rotation id a handoff text carries (16 lowercase hex characters on its own line), or `None`.
pub fn rotation_id_of(handoff: &str) -> Option<String> {
    handoff.lines().find_map(|line| {
        let id = line.strip_prefix(ROTATION_ID_PREFIX)?;
        (id.len() == 16
            && id
                .bytes()
                .all(|c| c.is_ascii_digit() || (b'a'..=b'f').contains(&c)))
        .then(|| id.to_string())
    })
}

/// Whether the lineage's pending rotation waits for generation `gen` and has no answer from it yet.
pub fn awaits_answer(lineage: &Path, gen: u64) -> Result<bool, HandoffError> {
    let Some(pending) = read_json(&lineage.join("rotation.json"))? else {
        return Ok(false);
    };
    if pending.get("gen").and_then(Value::as_u64) != Some(gen) {
        return Ok(false);
    }
    let answered = read_json(&lineage.join("answered.json"))?;
    Ok(answered.and_then(|a| a.get("gen").and_then(Value::as_u64)) != Some(gen))
}

fn pending_question(text: &str) -> Option<&str> {
    let start = text.find(QUESTION_HEADING)? + QUESTION_HEADING.len();
    let rest = text[start..].trim_start_matches('\n');
    let end = rest.find("\n## ").unwrap_or(rest.len());
    let question = rest[..end].trim();
    (!question.is_empty() && question != "(none)").then_some(question)
}

fn cut(text: &str, chars: usize) -> String {
    text.chars().take(chars).collect()
}

/// The `additionalContext` of a session start for `latest`: the handoff itself when it fits under
/// [`CONTEXT_LIMIT`], else a pointer to the file (relative to the project when `project_root` holds it) plus the
/// pending question verbatim.
pub fn session_start_context(latest: &Latest, project_root: Option<&Path>) -> String {
    if latest.text.chars().count() < CONTEXT_LIMIT {
        return latest.text.clone();
    }
    let shown = project_root
        .and_then(|root| latest.path.strip_prefix(root).ok())
        .unwrap_or(&latest.path)
        .display();
    let mut out = format!("A handoff from the previous session is too long to show here: read {shown} before acting. Verify against the repo before acting: it describes state as it was.");
    if let Some(question) = pending_question(&latest.text) {
        out.push_str("\n\n");
        out.push_str(QUESTION_HEADING);
        out.push_str("\n\n");
        let room = (CONTEXT_LIMIT - 1).saturating_sub(out.chars().count());
        out.push_str(&cut(question, room));
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn dir(tag: &str) -> PathBuf {
        let d = std::env::temp_dir().join(format!("rot-handoff-{}-{tag}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        std::fs::create_dir_all(&d).unwrap();
        d
    }
    fn store(d: &Path, file: &str, text: &str) {
        std::fs::write(d.join(file), text).unwrap();
        std::fs::write(d.join("latest.json"), format!("{{\"file\":\"{file}\",\"session\":\"s\",\"rotate\":\"hard\",\"writtenAt\":\"2026-11-18T00:00:00.000Z\"}}\n")).unwrap();
    }

    #[test]
    fn the_latest_handoff_is_read_as_the_pointer_names_it_and_a_gone_or_foreign_file_is_none() {
        let d = dir("a");
        assert_eq!(read_latest(&d).unwrap(), None);
        store(&d, "261118-1000-abc12345.md", "body\n");
        let got = read_latest(&d).unwrap().unwrap();
        assert_eq!(
            (got.file.as_str(), got.text.as_str(), got.rotate.as_deref()),
            ("261118-1000-abc12345.md", "body\n", Some("hard"))
        );
        std::fs::write(d.join("latest.json"), r#"{"file":"../../etc/passwd"}"#).unwrap();
        assert_eq!(read_latest(&d).unwrap(), None);
        std::fs::write(d.join("latest.json"), "not json").unwrap();
        assert_eq!(read_latest(&d).unwrap(), None);
        std::fs::write(d.join("latest.json"), r#"{"file":"261118-1000-gone.md"}"#).unwrap();
        assert_eq!(read_latest(&d).unwrap(), None);
    }

    #[test]
    fn the_rotation_id_is_the_exact_line_of_16_hex_characters() {
        assert_eq!(
            rotation_id_of("x\nRotation id: 0123456789abcdef\ny").as_deref(),
            Some("0123456789abcdef")
        );
        assert_eq!(rotation_id_of("Rotation id: 0123456789abcde"), None);
        assert_eq!(rotation_id_of("Rotation id: 0123456789ABCDEF"), None);
        assert_eq!(rotation_id_of("note Rotation id: 0123456789abcdef"), None);
    }

    #[test]
    fn a_lineage_name_that_is_not_a_slug_never_builds_a_path() {
        let fgos = Path::new("/p/.fgos");
        assert!(lineage_dir(fgos, "secretary", "miu")
            .unwrap()
            .ends_with("runtime/session-rotation/secretary-miu"));
        assert!(lineage_dir(fgos, "..", "x").is_err());
        assert!(lineage_dir(fgos, "a", "b/c").is_err());
        assert!(lineage_dir(fgos, "a", "").is_err());
    }

    #[test]
    fn a_successor_awaits_its_answer_only_while_its_generation_is_pending_and_unanswered() {
        let d = dir("b");
        assert!(!awaits_answer(&d, 2).unwrap());
        std::fs::write(
            d.join("rotation.json"),
            r#"{"id":"0123456789abcdef","gen":2}"#,
        )
        .unwrap();
        assert!(awaits_answer(&d, 2).unwrap());
        assert!(!awaits_answer(&d, 1).unwrap());
        std::fs::write(d.join("answered.json"), r#"{"gen":2}"#).unwrap();
        assert!(!awaits_answer(&d, 2).unwrap());
    }

    #[test]
    fn a_handoff_that_fits_is_the_context_and_a_long_one_is_a_pointer_with_the_pending_question_verbatim(
    ) {
        let d = dir("c");
        let short = Latest {
            file: "f.md".into(),
            path: d.join("f.md"),
            text: "short handoff".into(),
            rotate: None,
        };
        assert_eq!(session_start_context(&short, None), "short handoff");
        let body = format!("# Handoff\n\n## Delta\n\n{}\n\n## Pending question (verbatim)\n\nWhich database?\n\n## Next\n\nx\n", "y".repeat(CONTEXT_LIMIT));
        let long = Latest {
            file: "f.md".into(),
            path: d.join("f.md"),
            text: body,
            rotate: None,
        };
        let ctx = session_start_context(&long, Some(&d));
        assert!(ctx.chars().count() < CONTEXT_LIMIT);
        assert!(
            ctx.contains("read f.md before acting") && ctx.ends_with("Which database?"),
            "{ctx}"
        );
        let huge = Latest {
            text: format!("{QUESTION_HEADING}\n\n{}", "q".repeat(CONTEXT_LIMIT * 2)),
            ..long
        };
        assert!(session_start_context(&huge, None).chars().count() < CONTEXT_LIMIT);
    }
}
