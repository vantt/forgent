//! The reader of the skill render's generated stamp: which skill directories of a project fgOS wrote, which
//! same-named ones it did not, and which skill names fgOS owns.
//!
//! The render (`src/setup/skill-wrappers.mjs`, repository tooling) is the only writer of the stamp. The stamp
//! forms, the owned-name rule and the vectors live in `packages/distribution/contracts/skill-stamp.v1.json`,
//! which this reader and the render's own test both read, so the rule has one source. Nothing here writes.

use serde_json::Value;
use std::collections::BTreeSet;
use std::io;
use std::path::{Path, PathBuf};
use std::sync::OnceLock;

const CONTRACT: &str = include_str!("../../contracts/skill-stamp.v1.json");

struct Stamps {
    wrapper: Vec<String>,
    assembled_prefix: String,
    always_owned: Vec<String>,
}

fn stamps() -> &'static Stamps {
    static STAMPS: OnceLock<Stamps> = OnceLock::new();
    STAMPS.get_or_init(|| {
        let contract: Value = serde_json::from_str(CONTRACT).unwrap_or(Value::Null);
        let strings = |pointer: &str| -> Vec<String> {
            contract
                .pointer(pointer)
                .and_then(Value::as_array)
                .map(|a| {
                    a.iter()
                        .filter_map(|s| s.as_str().map(str::to_string))
                        .collect()
                })
                .unwrap_or_default()
        };
        Stamps {
            wrapper: strings("/stamps/wrapper"),
            assembled_prefix: contract
                .pointer("/stamps/assembledHeaderPrefix")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string(),
            always_owned: strings("/owned/always"),
        }
    })
}

/// A directory fgOS generated, or one it did not.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Foreign {
    pub dir: PathBuf,
    pub why: &'static str,
}

/// The skill directories of a project that fgOS wrote, and the same-named ones it did not.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct GeneratedSkills {
    pub ours: Vec<PathBuf>,
    pub foreign: Vec<Foreign>,
}

/// JavaScript's `\s`: Unicode white space plus the byte-order mark, without U+0085.
fn is_space(c: char) -> bool {
    (c.is_whitespace() && c != '\u{85}') || c == '\u{feff}'
}

/// The text after a leading `---` fenced block (either line ending), or all of it when there is none.
fn cut_frontmatter_body(text: &str) -> &str {
    let content = match text
        .strip_prefix("---\r\n")
        .or_else(|| text.strip_prefix("---\n"))
    {
        Some(content) => content,
        None => return text,
    };
    for (at, _) in content.char_indices() {
        let rest = &content[at..];
        let rest = rest.strip_prefix('\r').unwrap_or(rest);
        let Some(rest) = rest.strip_prefix('\n') else {
            continue;
        };
        let Some(rest) = rest.strip_prefix("---") else {
            continue;
        };
        let rest = rest.strip_prefix('\r').unwrap_or(rest);
        if let Some(body) = rest.strip_prefix('\n') {
            return body;
        }
    }
    text
}

/// The one stamp test: `is_stamp` judges the first line after the frontmatter, so a foreign file that merely
/// quotes a stamp lower down is not ours.
fn carries_stamp(content: &str, is_stamp: impl Fn(&str) -> bool) -> bool {
    let body = cut_frontmatter_body(content).trim_start_matches(is_space);
    let first = body.split('\n').next().unwrap_or("");
    is_stamp(first.strip_suffix('\r').unwrap_or(first))
}

/// Whether `name` is the temporary form the render's atomic writes leave: `.tmp-<pid>-<id>[-<id>]-<tag>`.
pub fn is_own_tmp_file(name: &str) -> bool {
    name.match_indices(".tmp-").any(|(at, marker)| {
        let parts: Vec<&str> = name[at + marker.len()..].split('-').collect();
        let digits = |p: &&str| !p.is_empty() && p.bytes().all(|b| b.is_ascii_digit());
        let tag = |p: &&str| {
            !p.is_empty()
                && p.bytes()
                    .all(|b| b.is_ascii_digit() || b.is_ascii_lowercase())
        };
        (parts.len() == 3 || parts.len() == 4)
            && parts[..parts.len() - 1].iter().all(digits)
            && tag(&parts[parts.len() - 1])
    })
}

/// Whether `dir` holds a wrapper the render generated: absent, unreadable or unstamped all mean "not ours".
fn is_generated_wrapper(dir: &Path) -> bool {
    std::fs::read(dir.join("SKILL.md"))
        .map(|bytes| {
            carries_stamp(&String::from_utf8_lossy(&bytes), |line| {
                stamps().wrapper.iter().any(|stamp| stamp == line)
            })
        })
        .unwrap_or(false)
}

/// Whether the entry (a file, or a directory tree) holds a markdown file the render stamped with its header.
fn carries_assembled_header(entry: &Path) -> io::Result<bool> {
    let meta = std::fs::symlink_metadata(entry)?;
    if meta.is_dir() {
        for child in std::fs::read_dir(entry)? {
            let child = child?;
            if is_own_tmp_file(&child.file_name().to_string_lossy()) {
                continue;
            }
            if carries_assembled_header(&child.path())? {
                return Ok(true);
            }
        }
        return Ok(false);
    }
    if !meta.is_file() || entry.extension().is_none_or(|e| e != "md") {
        return Ok(false);
    }
    let text = String::from_utf8_lossy(&std::fs::read(entry)?).into_owned();
    Ok(carries_stamp(&text, |line| {
        line.starts_with(&stamps().assembled_prefix)
    }))
}

/// An `.agents/skills/<name>` directory fgOS wrote: an assembled header, or the wrapper under the same
/// project's `.claude/skills` that an earlier release generated beside an unstamped copy.
fn is_own_agents_dir(dir: &Path) -> io::Result<bool> {
    if carries_assembled_header(dir)? {
        return Ok(true);
    }
    let project = dir.parent().and_then(Path::parent).and_then(Path::parent);
    Ok(match (project, dir.file_name()) {
        (Some(project), Some(name)) => {
            is_generated_wrapper(&project.join(".claude").join("skills").join(name))
        }
        _ => false,
    })
}

/// The first symbolic link on the way from `root` down `relative` (each component below `root`, the last
/// included), or `None` when there is none or the path stops existing.
fn first_symlink_under(root: &Path, relative: &[&str]) -> Option<PathBuf> {
    let mut current = root.to_path_buf();
    for part in relative {
        current.push(part);
        match std::fs::symlink_metadata(&current) {
            Ok(meta) if meta.file_type().is_symlink() => return Some(current),
            Ok(_) => {}
            Err(_) => return None,
        }
    }
    None
}

/// The skill directories of the project at `project` that fgOS wrote, and the same-named ones it did not.
///
/// A `.claude/skills` entry is ours when it carries the wrapper stamp, a `.agents/skills` entry when it
/// carries the assembled header (or sits beside a stamped wrapper); a directory under an owned name without a
/// stamp is another tool's and is listed in `foreign`, as is a link under an owned name. Anything else is the
/// person's and is not named. A link in a skills root, or above it, is never walked. Reads only; each list is
/// sorted by path.
pub fn generated_skill_dirs(
    project: &Path,
    owned: &BTreeSet<String>,
) -> io::Result<GeneratedSkills> {
    let mut found = GeneratedSkills::default();
    type IsStamped = fn(&Path) -> io::Result<bool>;
    let roots: [([&str; 3], IsStamped); 2] = [
        ([".claude", "skills", ""], |dir| {
            Ok(is_generated_wrapper(dir))
        }),
        ([".agents", "skills", ""], is_own_agents_dir),
    ];
    for (parts, is_stamped) in roots {
        let relative = &parts[..2];
        let root = relative
            .iter()
            .fold(project.to_path_buf(), |p, part| p.join(part));
        if !root.exists() {
            continue;
        }
        if let Some(link) = first_symlink_under(project, relative) {
            found.foreign.push(Foreign {
                dir: link,
                why: "a symbolic link: left as it is",
            });
            continue;
        }
        for entry in std::fs::read_dir(&root)? {
            let entry = entry?;
            let name = entry.file_name().to_string_lossy().into_owned();
            if is_own_tmp_file(&name) {
                continue;
            }
            let dir = entry.path();
            let kind = entry.file_type()?;
            if kind.is_symlink() {
                if owned.contains(&name) {
                    found.foreign.push(Foreign {
                        dir,
                        why: "a symbolic link",
                    });
                }
            } else if kind.is_dir() {
                if is_stamped(&dir)? {
                    found.ours.push(dir);
                } else if owned.contains(&name) {
                    found.foreign.push(Foreign {
                        dir,
                        why: "it carries no fgOS generated marker",
                    });
                }
            }
        }
    }
    found.ours.sort();
    found.foreign.sort_by(|a, b| a.dir.cmp(&b.dir));
    Ok(found)
}

/// The skill names fgOS owns in the payload at `payload_root`: every directory with a `SKILL.md` directly
/// under `core/skills` and `domains/<domain>/skills`, plus the shared fragment folder. Links are not followed.
pub fn owned_skill_names(payload_root: &Path) -> io::Result<BTreeSet<String>> {
    let mut owned: BTreeSet<String> = stamps().always_owned.iter().cloned().collect();
    let mut roots = vec![payload_root.join("core").join("skills")];
    for domain in real_dirs(&payload_root.join("domains"))? {
        roots.push(domain.join("skills"));
    }
    for root in roots {
        for skill in real_dirs(&root)? {
            let name = skill
                .file_name()
                .map(|n| n.to_string_lossy().into_owned())
                .unwrap_or_default();
            if name != "_shared" && skill.join("SKILL.md").exists() {
                owned.insert(name);
            }
        }
    }
    Ok(owned)
}

/// The real directories (not links) directly under `dir` that are neither hidden nor a render temp name; an
/// absent or non-directory `dir` has none.
fn real_dirs(dir: &Path) -> io::Result<Vec<PathBuf>> {
    let entries = match std::fs::read_dir(dir) {
        Ok(entries) => entries,
        Err(e)
            if matches!(
                e.kind(),
                io::ErrorKind::NotFound | io::ErrorKind::NotADirectory
            ) =>
        {
            return Ok(Vec::new())
        }
        Err(e) => return Err(e),
    };
    let mut dirs = Vec::new();
    for entry in entries {
        let entry = entry?;
        let name = entry.file_name().to_string_lossy().into_owned();
        if entry.file_type()?.is_dir() && !name.starts_with('.') && !is_own_tmp_file(&name) {
            dirs.push(entry.path());
        }
    }
    dirs.sort();
    Ok(dirs)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn scratch(label: &str) -> PathBuf {
        use std::sync::atomic::{AtomicU32, Ordering};
        static NEXT: AtomicU32 = AtomicU32::new(0);
        let dir = std::env::temp_dir().join(format!(
            "fgos-stamp-{label}-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        ));
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    /// Builds the vector's tree under `root`.
    fn materialize(root: &Path, entries: &[Value]) {
        for entry in entries {
            let path = root.join(entry["path"].as_str().unwrap());
            if let Some(target) = entry["symlink"].as_str() {
                std::fs::create_dir_all(path.parent().unwrap()).unwrap();
                #[cfg(unix)]
                std::os::unix::fs::symlink(target, &path).unwrap();
                #[cfg(not(unix))]
                let _ = target;
            } else if entry["dir"].as_bool() == Some(true) {
                std::fs::create_dir_all(&path).unwrap();
            } else {
                std::fs::create_dir_all(path.parent().unwrap()).unwrap();
                std::fs::write(&path, entry["text"].as_str().unwrap()).unwrap();
            }
        }
    }

    fn relative(root: &Path, path: &Path) -> String {
        path.strip_prefix(root)
            .unwrap()
            .to_string_lossy()
            .replace('\\', "/")
    }

    fn has_links(entries: &[Value]) -> bool {
        entries.iter().any(|e| e["symlink"].is_string())
    }

    #[test]
    fn every_project_vector_of_the_contract_gets_the_answer_the_render_gave() {
        let contract: Value = serde_json::from_str(CONTRACT).unwrap();
        let vectors = contract["vectors"]["projects"].as_array().unwrap();
        assert!(vectors.len() >= 20);
        for vector in vectors {
            let entries = vector["entries"].as_array().unwrap();
            if cfg!(not(unix)) && has_links(entries) {
                continue;
            }
            let root = scratch("project");
            materialize(&root, entries);
            let owned: BTreeSet<String> = vector["owned"]
                .as_array()
                .unwrap()
                .iter()
                .map(|n| n.as_str().unwrap().to_string())
                .collect();
            let got = generated_skill_dirs(&root, &owned).unwrap();
            let ours: Vec<String> = got.ours.iter().map(|p| relative(&root, p)).collect();
            let want_ours: Vec<&str> = vector["expect"]["ours"]
                .as_array()
                .unwrap()
                .iter()
                .map(|v| v.as_str().unwrap())
                .collect();
            let name = vector["name"].as_str().unwrap();
            assert_eq!(ours, want_ours, "{name}: ours");
            let foreign: Vec<(String, String)> = got
                .foreign
                .iter()
                .map(|f| (relative(&root, &f.dir), f.why.to_string()))
                .collect();
            let want_foreign: Vec<(String, String)> = vector["expect"]["foreign"]
                .as_array()
                .unwrap()
                .iter()
                .map(|f| {
                    (
                        f["dir"].as_str().unwrap().to_string(),
                        f["why"].as_str().unwrap().to_string(),
                    )
                })
                .collect();
            assert_eq!(foreign, want_foreign, "{name}: foreign");
        }
    }

    #[test]
    fn every_payload_vector_of_the_contract_gets_the_owned_names_the_render_gave() {
        let contract: Value = serde_json::from_str(CONTRACT).unwrap();
        for vector in contract["vectors"]["payloads"].as_array().unwrap() {
            let entries = vector["entries"].as_array().unwrap();
            if cfg!(not(unix)) && has_links(entries) {
                continue;
            }
            let root = scratch("payload");
            materialize(&root, entries);
            let want: Vec<&str> = vector["expect"]
                .as_array()
                .unwrap()
                .iter()
                .map(|v| v.as_str().unwrap())
                .collect();
            let got = owned_skill_names(&root).unwrap();
            assert_eq!(
                got.iter().map(String::as_str).collect::<Vec<_>>(),
                want,
                "{}",
                vector["name"]
            );
        }
    }

    #[test]
    fn the_render_temp_form_is_recognised_exactly() {
        for yes in ["a.tmp-1-2-abc", "a.tmp-12-3-4-0f", "x.tmp-9-8-7a.tmp-1-2-b"] {
            assert!(is_own_tmp_file(yes), "{yes}");
        }
        for no in [
            "a.tmp-1-ab",
            "a.tmp-1-2-3-4-ab",
            "a.tmp-x-2-ab",
            "a.tmp-1-2-AB",
            "a.tmp-1-2-",
            "a.tmp-1-2-ab-",
            "plain",
            "tmp-1-2-ab",
        ] {
            assert!(!is_own_tmp_file(no), "{no}");
        }
    }

    #[test]
    fn the_frontmatter_cut_needs_a_closing_fence_line_and_leaves_other_text_whole() {
        assert_eq!(cut_frontmatter_body("---\na: 1\n---\nbody"), "body");
        assert_eq!(cut_frontmatter_body("---\r\na: 1\r\n---\r\nbody"), "body");
        assert_eq!(cut_frontmatter_body("---\na: 1\n---"), "---\na: 1\n---");
        assert_eq!(cut_frontmatter_body("no fence\n---\n"), "no fence\n---\n");
        assert_eq!(cut_frontmatter_body("---\n---\nx"), "---\n---\nx");
    }

    #[test]
    fn the_contract_and_the_reader_agree_on_the_stamp_forms() {
        assert_eq!(stamps().wrapper.len(), 2);
        assert!(stamps()
            .assembled_prefix
            .starts_with("<!-- Generated by fgOS skill assembly from "));
        assert_eq!(stamps().always_owned, vec!["_shared".to_string()]);
    }
}
