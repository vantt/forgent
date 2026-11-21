//! `fgos migrate portfolio` on a temporary fixture project: rows become item files with no row lost, discussions
//! move under minted ids with frontmatter, active references follow, history and plans stay as written, the legacy
//! backlog becomes a pointer, and a second run changes nothing. It runs on a project that is not a git checkout,
//! as an external project would be.

#[allow(dead_code)]
#[path = "../src/wiring/portfolio.rs"]
mod portfolio;
#[path = "../src/wiring/migrate.rs"]
mod migrate;

use migrate::{migrate_portfolio, parse_legacy_rows, MigrateRequest};
use std::fs;
use std::path::{Path, PathBuf};

const OLD_DISCUSSIONS: &str = concat!("docs/", "discussions");
const OLD_BACKLOG: &str = concat!("docs/", "backlog.md");

fn fixture(name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("fgos-migrate-{name}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    dir
}

fn put(root: &Path, rel: &str, text: &str) {
    let path = root.join(rel);
    fs::create_dir_all(path.parent().unwrap()).unwrap();
    fs::write(path, text).unwrap();
}

fn read(root: &Path, rel: &str) -> String {
    fs::read_to_string(root.join(rel)).unwrap()
}

fn legacy_table() -> String {
    "# Product Backlog\n\n\
| ID | Story | CoS | Status | Feature |\n\
|----|-------|-----|--------|---------|\n\
| p-rw5iadsp2p | **Unify the portfolio (portfolio, priority high; source: owner, 2026-11-19).** One schema for every row, with a pipe \\| inside. | The check passes. | proposed | portfolio |\n\
| p-d2dc4f2e | **Old hex row (docs, priority low).** Kept with its id. | Done when it is read. | done (landed 2026-10-01) | docs |\n\
| STR27 | **Streaming row.** Story with ## a heading mark. | | deferred until the release | streaming |\n\
| p-xyz | **Invalid minted shape.** Gets a minted id. | x | proposed | misc |\n"
        .to_owned()
}

fn project(name: &str) -> PathBuf {
    let root = fixture(name);
    put(&root, OLD_BACKLOG, &legacy_table());
    put(
        &root,
        &format!("{OLD_DISCUSSIONS}/work-data-model/DISCUSSION.md"),
        "# Work data model\n\n> Source: backlog `p-rw5iadsp2p`.\n> discussion: settled\n\nBody 2026-11-19.\n",
    );
    put(&root, &format!("{OLD_DISCUSSIONS}/work-data-model/QUESTIONS.md"), "extra file\n");
    put(
        &root,
        &format!("{OLD_DISCUSSIONS}/work/DISCUSSION.md"),
        "# Work\n\ndiscussion: open\n",
    );
    put(
        &root,
        "docs/guide.md",
        &format!("See {OLD_DISCUSSIONS}/work-data-model/DISCUSSION.md and {OLD_DISCUSSIONS}/work/ and {OLD_BACKLOG}.\n"),
    );
    put(&root, "docs/history/old.md", &format!("Old {OLD_DISCUSSIONS}/work/ stays.\n"));
    put(&root, "plans/some-plan/plan.md", &format!("Plan cites {OLD_DISCUSSIONS}/work/ unchanged.\n"));
    root
}

fn run(root: &Path, dry_run: bool) -> migrate::MigrateReport {
    migrate_portfolio(&MigrateRequest { root: root.to_path_buf(), dry_run }).unwrap()
}

#[test]
fn every_legacy_row_becomes_an_item_file_and_none_is_lost() {
    let rows = parse_legacy_rows(&legacy_table()).unwrap();
    assert_eq!(rows.len(), 4);
    assert_eq!(rows[0].feature, "portfolio");
    assert!(rows[0].story.contains("pipe | inside"));

    let root = project("rows");
    let report = run(&root, false);
    assert_eq!(report.rows_found, 4);
    assert_eq!(report.items_created, 4);

    let items: Vec<String> = fs::read_dir(root.join("plans/backlog"))
        .unwrap()
        .map(|e| e.unwrap().file_name().to_string_lossy().into_owned())
        .collect();
    assert_eq!(items.len(), 4, "{items:?}");
    let unified = items.iter().find(|n| n.starts_with("p-rw5iadsp2p-unify-the-portfolio")).unwrap();
    let text = read(&root, &format!("plans/backlog/{unified}"));
    for needle in ["priority: P1", "area: portfolio", "created: 2026-11-19", "# Why", "# Done when", "# Notes", "The check passes."] {
        assert!(text.contains(needle), "{needle} missing in {text}");
    }
    let done = read(&root, "plans/backlog/p-d2dc4f2e-old-hex-row-docs-priority-low.md");
    assert!(done.contains("status: done") && done.contains("priority: P3"), "{done}");
    let parked = items.iter().find(|n| n.starts_with("STR27-")).unwrap();
    assert!(read(&root, &format!("plans/backlog/{parked}")).contains("status: parked"));
    // The row whose id is not a valid shape keeps its text under a minted id and says what the old id was.
    let renamed = items.iter().find(|n| n.contains("invalid-minted-shape")).unwrap();
    let renamed_text = read(&root, &format!("plans/backlog/{renamed}"));
    assert!(!renamed.starts_with("p-xyz"), "{renamed}");
    assert!(renamed_text.contains("Original id: p-xyz."), "{renamed_text}");
}

#[test]
fn discussions_move_with_ids_frontmatter_and_extra_files() {
    let root = project("discussions");
    let report = run(&root, false);
    assert_eq!(report.discussions_moved, 2);
    assert!(!root.join(OLD_DISCUSSIONS).exists());

    let dir = report.mapping.get(&format!("{OLD_DISCUSSIONS}/work-data-model")).unwrap();
    assert!(dir.starts_with("plans/discussions/ds-") && dir.ends_with("-work-data-model"), "{dir}");
    let text = read(&root, &format!("{dir}/DISCUSSION.md"));
    for needle in ["title: \"Work data model\"", "status: settled", "  - p-rw5iadsp2p", "created: 2026-11-19", "# Work data model"] {
        assert!(text.contains(needle), "{needle} missing in {text}");
    }
    assert_eq!(read(&root, &format!("{dir}/QUESTIONS.md")), "extra file\n");
    assert!(read(&root, &format!("{}/DISCUSSION.md", report.mapping.get(&format!("{OLD_DISCUSSIONS}/work")).unwrap())).contains("status: open"));
    assert!(report.check_errors.is_empty(), "{:?}", report.check_errors);
}

#[test]
fn references_follow_except_in_plans_and_history() {
    let root = project("refs");
    let report = run(&root, false);
    let moved = report.mapping.get(&format!("{OLD_DISCUSSIONS}/work-data-model")).unwrap();
    let guide = read(&root, "docs/guide.md");
    assert!(guide.contains(&format!("{moved}/DISCUSSION.md")), "{guide}");
    assert!(guide.contains(&format!("{}/ and", report.mapping.get(&format!("{OLD_DISCUSSIONS}/work")).unwrap())), "{guide}");
    assert!(guide.contains("plans/backlog.md"), "{guide}");
    assert!(!guide.contains(OLD_DISCUSSIONS) && !guide.contains(OLD_BACKLOG));
    // `work` must not have matched inside `work-data-model`.
    assert!(!guide.contains("plans/discussions/ds-") || guide.matches("-work-data-model").count() == 1);
    assert!(read(&root, "docs/history/old.md").contains(OLD_DISCUSSIONS));
    assert!(read(&root, "plans/some-plan/plan.md").contains(OLD_DISCUSSIONS));
}

#[test]
fn the_backlog_index_is_generated_and_the_legacy_file_is_a_pointer() {
    let root = project("index");
    run(&root, false);
    let index = read(&root, "plans/backlog.md");
    assert!(index.contains("| [p-rw5iadsp2p](backlog/p-rw5iadsp2p-"), "{index}");
    assert!(index.contains("(settled)"), "the citing discussion is linked: {index}");
    let pointer = read(&root, OLD_BACKLOG);
    assert!(pointer.contains("plans/backlog.md") && !pointer.contains("p-rw5iadsp2p"), "{pointer}");
}

#[test]
fn a_second_run_changes_nothing() {
    let root = project("idempotent");
    let first = run(&root, false);
    assert!(first.changed());
    let snapshot = |root: &Path| {
        let mut all = Vec::new();
        let mut stack = vec![root.to_path_buf()];
        while let Some(dir) = stack.pop() {
            for entry in fs::read_dir(dir).unwrap().flatten() {
                let path = entry.path();
                if path.is_dir() {
                    stack.push(path);
                } else {
                    all.push((path.clone(), fs::read_to_string(&path).unwrap()));
                }
            }
        }
        all.sort();
        all
    };
    let before = snapshot(&root);
    let second = run(&root, false);
    assert!(!second.changed(), "{:?}", second.to_json());
    assert_eq!(snapshot(&root), before);
}

#[test]
fn a_dry_run_describes_and_writes_nothing() {
    let root = project("dry");
    let report = run(&root, true);
    assert!(report.changed() && report.dry_run);
    assert_eq!(report.items_created, 4);
    assert_eq!(report.discussions_moved, 2);
    assert!(root.join(OLD_DISCUSSIONS).is_dir());
    assert!(!root.join("plans/backlog").exists());
    assert!(read(&root, OLD_BACKLOG).contains("p-rw5iadsp2p"));
}

#[test]
fn an_interrupted_run_is_finished_by_running_again() {
    let root = project("resume");
    // A previous run wrote one item and stopped before the rest.
    let rows = parse_legacy_rows(&legacy_table()).unwrap();
    let first = &rows[0];
    put(
        &root,
        "plans/backlog/p-rw5iadsp2p-unify.md",
        &format!(
            "---\nid: {}\ntitle: Unify\nstatus: proposed\npriority: P1\narea: portfolio\ncreated: 2026-11-19\n---\n\n# Why\n\nw\n\n# Done when\n\nd\n\n# Notes\n\nn\n",
            first.id
        ),
    );
    let report = run(&root, false);
    assert_eq!(report.items_existing, 1);
    assert_eq!(report.items_created, 3);
    assert_eq!(fs::read_dir(root.join("plans/backlog")).unwrap().count(), 4);
    assert!(read(&root, OLD_BACKLOG).contains("pointer"));
}
