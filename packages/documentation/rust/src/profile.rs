//! The pkm profile for a documentation corpus, rendered from the corpus itself (document-identity spec sections 7.1
//! and 7.2). `area` values are the directories under `platform/` that carry a `spec.md`, never a hand-kept list, plus
//! `platform` for every document no area claims. `question` comes from folder names (`history`, `contracts`, ...)
//! and file names (`spec.md`, `vision.md`, ...). A corpus without that layout gets no `area` value but `platform`,
//! and locate still works. The vault is the docs root, so every path here is relative to it.

use std::fs;
use std::io;
use std::path::Path;

/// The `area` value of documents that govern every area (root files and folders no area claims).
pub const PLATFORM: &str = "platform";

/// Folder name to `question` value, tried from the outermost folder in.
const QUESTION_BY_FOLDER: &[(&str, &str)] = &[
    ("history", "past-state"),
    ("proposals", "past-state"),
    ("contracts", "obligation"),
    ("decisions", "choice"),
    ("architecture", "rationale"),
    ("verification", "proof"),
    ("proofs", "proof"),
];

/// File name to `question` value, for a document no folder classifies.
const QUESTION_BY_FILE: &[(&str, &str)] = &[
    ("spec.md", "current-truth"),
    ("vision.md", "direction"),
    ("roadmap.md", "direction"),
    ("architecture.md", "rationale"),
    ("README.md", "navigation"),
    ("index.md", "navigation"),
    ("reading-map.md", "navigation"),
];

/// Every `question` value (spec section 5.4), with whether new content may be placed in a document carrying it.
const QUESTION_VALUES: &[(&str, bool)] = &[
    ("current-truth", true),
    ("obligation", true),
    ("rationale", true),
    ("choice", true),
    ("direction", true),
    ("procedure", true),
    ("pitfall", true),
    ("lookup", true),
    ("proof", true),
    ("navigation", true),
    ("past-state", false),
];

/// Every `question` value, in spec order.
pub fn question_values() -> impl Iterator<Item = &'static str> {
    QUESTION_VALUES.iter().map(|(value, _)| *value)
}

/// Checks a guessed region against the corpus at `docs_root`: every `area` value must be an area of the corpus or
/// `platform`, every `question` value one of the spec's. The error names the first unknown value and the valid ones.
pub fn check_region(docs_root: &Path, area: &[String], question: &[String]) -> Result<(), String> {
    let areas = areas(docs_root)
        .map_err(|e| format!("cannot read the areas of {}: {e}", docs_root.display()))?;
    let valid_areas: Vec<&str> = std::iter::once(PLATFORM)
        .chain(areas.iter().map(String::as_str))
        .collect();
    if let Some(unknown) = area.iter().find(|a| !valid_areas.contains(&a.as_str())) {
        return Err(format!(
            "unknown area \"{unknown}\"; valid: {}",
            valid_areas.join(", ")
        ));
    }
    let valid_questions: Vec<&str> = question_values().collect();
    if let Some(unknown) = question
        .iter()
        .find(|q| !valid_questions.contains(&q.as_str()))
    {
        return Err(format!(
            "unknown question \"{unknown}\"; valid: {}",
            valid_questions.join(", ")
        ));
    }
    Ok(())
}

/// Deepest folder level a folder name is looked for at (`platform/<area>/subcomponents/<name>/history/...` is 5).
const FOLDER_DEPTH: usize = 6;

/// Folders that hold reading about other projects (the reference-learning area), never a unit of this project's own
/// claims.
const REFERENCE_FOLDERS: &[&str] = &["distillery"];

/// Folders the vault leaves out because they never answer a locate for a write: those whose documents record what was
/// true before (`past-state`; document-identity spec section 5.4: past-state content is never a locate target) and the
/// reference folders. The mention scan reads the same corpus, so it asks `is_excluded_folder` too.
fn excluded_folders() -> impl Iterator<Item = &'static str> {
    QUESTION_BY_FOLDER
        .iter()
        .filter(|(_, value)| {
            QUESTION_VALUES
                .iter()
                .any(|(v, target)| v == value && !target)
        })
        .map(|(folder, _)| *folder)
        .chain(REFERENCE_FOLDERS.iter().copied())
}

/// Whether the vault leaves out the folder `name` sitting `depth` folders below the docs root (0 is the root's own
/// children); the profile's globs reach `FOLDER_DEPTH` levels.
pub fn is_excluded_folder(name: &str, depth: usize) -> bool {
    depth < FOLDER_DEPTH && excluded_folders().any(|folder| folder == name)
}

fn excluded_globs() -> Vec<String> {
    excluded_folders()
        .flat_map(|folder| {
            (0..FOLDER_DEPTH).map(move |depth| format!("\"{}{folder}/**\"", "*/".repeat(depth)))
        })
        .collect()
}

/// The `area` values of the corpus at `docs_root`: directories under `platform/` with a `spec.md`, sorted.
pub fn areas(docs_root: &Path) -> io::Result<Vec<String>> {
    let platform = docs_root.join(PLATFORM);
    let mut out = Vec::new();
    match fs::read_dir(&platform) {
        Ok(entries) => {
            for entry in entries {
                let entry = entry?;
                if entry.file_type()?.is_dir() && entry.path().join("spec.md").is_file() {
                    if let Some(name) = entry.file_name().to_str() {
                        out.push(name.to_owned());
                    }
                }
            }
        }
        Err(e) if e.kind() == io::ErrorKind::NotFound => {}
        Err(e) => return Err(e),
    }
    out.sort();
    Ok(out)
}

fn quoted(s: &str) -> String {
    format!("{s:?}")
}

fn map(pairs: impl IntoIterator<Item = (String, String)>) -> String {
    let body: Vec<String> = pairs
        .into_iter()
        .map(|(k, v)| format!("{}: {}", quoted(&k), quoted(&v)))
        .collect();
    format!("{{{}}}", body.join(", "))
}

/// The profile YAML for the corpus at `docs_root`.
pub fn render(docs_root: &Path) -> io::Result<String> {
    let areas = areas(docs_root)?;
    let mut y = String::new();
    y.push_str("# Rendered by fgOS from the documentation corpus; edits are overwritten.\n");
    y.push_str("profile: fgos-docs\nversion: 1\nformat: 1\nrequires: {schema: \">=4\"}\n");
    y.push_str("vault:\n");
    y.push_str("  include: [\"**/*.md\"]\n");
    y.push_str(&format!("  exclude: [{}]\n", excluded_globs().join(", ")));
    y.push_str("  read: {body_edges: true}\n");
    y.push_str("  header: {fence: txt}\n");
    y.push_str("  types: [{path: \"**\", type: document}]\n");
    y.push_str("  writes: none\n");
    y.push_str("facets:\n");
    y.push_str("  area:\n    kind: locating\n    required: true\n");
    let area_map = map(areas.iter().map(|a| (a.clone(), a.clone())));
    y.push_str(&format!(
        "    from: [{{path: \"{PLATFORM}/{{value}}/**\", map: {area_map}}}, {{frontmatter: area}}, {{default: {PLATFORM}}}]\n"
    ));
    y.push_str(&format!("    home: \"{PLATFORM}/{{value}}/\"\n"));
    y.push_str("    values:\n");
    y.push_str(&format!(
        "      {}: \"documents that govern every area\"\n",
        quoted(PLATFORM)
    ));
    for a in &areas {
        y.push_str(&format!("      {}: {}\n", quoted(a), quoted(a)));
    }
    y.push_str("  question:\n    kind: locating\n    required: false\n    from:\n");
    let folder_map = map(QUESTION_BY_FOLDER
        .iter()
        .map(|(k, v)| ((*k).to_owned(), (*v).to_owned())));
    for depth in 0..FOLDER_DEPTH {
        y.push_str(&format!(
            "      - {{path: \"{}{{value}}/**\", map: {folder_map}}}\n",
            "*/".repeat(depth)
        ));
    }
    let file_map = map(QUESTION_BY_FILE
        .iter()
        .map(|(k, v)| ((*k).to_owned(), (*v).to_owned())));
    y.push_str(&format!(
        "      - {{path: \"**/{{value}}\", map: {file_map}}}\n"
    ));
    y.push_str("    values:\n");
    for (value, target) in QUESTION_VALUES {
        if *target {
            y.push_str(&format!("      {}: {}\n", quoted(value), quoted(value)));
        } else {
            y.push_str(&format!(
                "      {}: {{description: {}, target: false}}\n",
                quoted(value),
                quoted(value)
            ));
        }
    }
    Ok(y)
}

/// Writes the profile for `docs_root` to `file` only when its bytes differ, so pkm's profile digest (and with it the
/// placement of every document) changes only when the corpus layout does. Returns whether it wrote.
pub fn write_if_changed(docs_root: &Path, file: &Path) -> io::Result<bool> {
    let bytes = render(docs_root)?;
    if fs::read(file).ok().as_deref() == Some(bytes.as_bytes()) {
        return Ok(false);
    }
    if let Some(dir) = file.parent() {
        fs::create_dir_all(dir)?;
    }
    let partial = file.with_extension(format!("yaml.{}.partial", std::process::id()));
    fs::write(&partial, bytes)?;
    fs::rename(&partial, file)?;
    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;
    use pkm_core::structure::placement::{place_one, Facts};
    use pkm_core::structure::Profile;

    fn corpus() -> tempfile::TempDir {
        let t = tempfile::tempdir().unwrap();
        let root = t.path();
        for f in [
            "platform/runner/spec.md",
            "platform/runner/contracts/routing.md",
            "platform/runner/history/spec.md",
            "platform/notes/readme-only.md",
            "reading-map.md",
        ] {
            let p = root.join(f);
            fs::create_dir_all(p.parent().unwrap()).unwrap();
            fs::write(p, "# x\n").unwrap();
        }
        t
    }

    #[test]
    fn areas_are_the_platform_folders_that_carry_a_spec() {
        let t = corpus();
        assert_eq!(areas(t.path()).unwrap(), vec!["runner".to_owned()]);
        assert_eq!(
            areas(&t.path().join("missing")).unwrap(),
            Vec::<String>::new()
        );
    }

    #[test]
    fn the_rendered_profile_reads_in_pkm_and_places_each_kind_of_document() {
        let t = corpus();
        let file = t.path().join("profile.yaml");
        fs::write(&file, render(t.path()).unwrap()).unwrap();
        let profile = Profile::find(t.path(), Some(&file)).unwrap().unwrap();
        assert!(profile.read_only(), "the corpus is read-only to pkm");
        let area = profile.facet("area").unwrap();
        let names: Vec<&str> = area.values.keys().map(String::as_str).collect();
        assert_eq!(
            names,
            vec![PLATFORM, "runner"],
            "one area plus platform; a folder without spec.md is no area"
        );
        let question = profile.facet("question").unwrap();
        assert!(
            !question.is_target("past-state"),
            "past-state is never a place for new content"
        );
        assert!(question.is_target("current-truth"));
        let value = |facet: &str, path: &str| {
            place_one(profile.facet(facet).unwrap(), path, &Facts::default()).map(|p| p.value)
        };
        assert_eq!(
            value("area", "platform/runner/spec.md").as_deref(),
            Some("runner")
        );
        assert_eq!(
            value("area", "platform/notes/readme-only.md").as_deref(),
            Some(PLATFORM)
        );
        assert_eq!(value("area", "reading-map.md").as_deref(), Some(PLATFORM));
        assert_eq!(
            value("question", "platform/runner/spec.md").as_deref(),
            Some("current-truth")
        );
        assert_eq!(
            value("question", "platform/runner/contracts/routing.md").as_deref(),
            Some("obligation")
        );
        assert_eq!(
            value("question", "platform/runner/history/spec.md").as_deref(),
            Some("past-state")
        );
        assert_eq!(
            value("question", "reading-map.md").as_deref(),
            Some("navigation")
        );
        assert_eq!(value("question", "platform/notes/readme-only.md"), None);
    }

    #[test]
    fn a_region_names_only_corpus_areas_platform_and_spec_questions() {
        let t = corpus();
        let s = |v: &[&str]| v.iter().map(|x| (*x).to_owned()).collect::<Vec<_>>();
        assert!(check_region(t.path(), &s(&["runner", PLATFORM]), &s(&["choice"])).is_ok());
        let area = check_region(t.path(), &s(&["notes"]), &[]).unwrap_err();
        assert!(
            area.contains("unknown area \"notes\"") && area.contains("runner"),
            "{area}"
        );
        let question = check_region(t.path(), &[], &s(&["opinion"])).unwrap_err();
        assert!(
            question.contains("unknown question \"opinion\""),
            "{question}"
        );
    }

    #[test]
    fn the_profile_is_written_only_when_its_bytes_change() {
        let t = corpus();
        let file = t.path().join("out/profile.yaml");
        assert!(write_if_changed(t.path(), &file).unwrap());
        assert!(!write_if_changed(t.path(), &file).unwrap());
        fs::write(t.path().join("platform/notes/spec.md"), "# notes\n").unwrap();
        assert!(
            write_if_changed(t.path(), &file).unwrap(),
            "a new area changes the profile"
        );
    }
}
