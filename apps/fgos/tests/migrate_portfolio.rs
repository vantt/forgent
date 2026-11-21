//! `fgos migrate portfolio` on a temporary fixture project: rows become item files with no row lost, discussions
//! move under minted ids with frontmatter, active references follow, history and plans stay as written, the legacy
//! backlog becomes a pointer, and a second run changes nothing. It runs on a project that is not a git checkout,
//! as an external project would be.

#[path = "../src/wiring/migrate.rs"]
mod migrate;
#[allow(dead_code)]
#[path = "../src/wiring/portfolio.rs"]
mod portfolio;

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
    put(
        &root,
        &format!("{OLD_DISCUSSIONS}/work-data-model/QUESTIONS.md"),
        "extra file\n",
    );
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
    put(
        &root,
        "docs/history/old.md",
        &format!("Old {OLD_DISCUSSIONS}/work/ stays.\n"),
    );
    put(
        &root,
        "plans/some-plan/plan.md",
        &format!("Plan cites {OLD_DISCUSSIONS}/work/ unchanged.\n"),
    );
    root
}

fn run(root: &Path, dry_run: bool) -> migrate::MigrateReport {
    migrate_portfolio(&MigrateRequest {
        root: root.to_path_buf(),
        dry_run,
    })
    .unwrap()
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
    let unified = items
        .iter()
        .find(|n| n.starts_with("p-rw5iadsp2p-unify-the-portfolio"))
        .unwrap();
    let text = read(&root, &format!("plans/backlog/{unified}"));
    for needle in [
        "priority: P1",
        "area: portfolio",
        "created: 2026-11-19",
        "# Why",
        "# Done when",
        "# Notes",
        "The check passes.",
    ] {
        assert!(text.contains(needle), "{needle} missing in {text}");
    }
    let done = read(
        &root,
        "plans/backlog/p-d2dc4f2e-old-hex-row-docs-priority-low.md",
    );
    assert!(
        done.contains("status: done") && done.contains("priority: P3"),
        "{done}"
    );
    let parked = items.iter().find(|n| n.starts_with("STR27-")).unwrap();
    assert!(read(&root, &format!("plans/backlog/{parked}")).contains("status: parked"));
    // The row whose id is not a valid shape keeps its text under a minted id and says what the old id was.
    let renamed = items
        .iter()
        .find(|n| n.contains("invalid-minted-shape"))
        .unwrap();
    let renamed_text = read(&root, &format!("plans/backlog/{renamed}"));
    assert!(!renamed.starts_with("p-xyz"), "{renamed}");
    assert!(
        renamed_text.contains("Original id: p-xyz."),
        "{renamed_text}"
    );
}

#[test]
fn discussions_move_with_ids_frontmatter_and_extra_files() {
    let root = project("discussions");
    let report = run(&root, false);
    assert_eq!(report.discussions_moved, 2);
    assert!(!root.join(OLD_DISCUSSIONS).exists());

    let dir = report
        .mapping
        .get(&format!("{OLD_DISCUSSIONS}/work-data-model"))
        .unwrap();
    assert!(
        dir.starts_with("plans/discussions/ds-") && dir.ends_with("-work-data-model"),
        "{dir}"
    );
    let text = read(&root, &format!("{dir}/DISCUSSION.md"));
    for needle in [
        "title: \"Work data model\"",
        "status: settled",
        "  - p-rw5iadsp2p",
        "created: 2026-11-19",
        "# Work data model",
    ] {
        assert!(text.contains(needle), "{needle} missing in {text}");
    }
    assert_eq!(read(&root, &format!("{dir}/QUESTIONS.md")), "extra file\n");
    assert!(read(
        &root,
        &format!(
            "{}/DISCUSSION.md",
            report
                .mapping
                .get(&format!("{OLD_DISCUSSIONS}/work"))
                .unwrap()
        )
    )
    .contains("status: open"));
    assert!(report.check_errors.is_empty(), "{:?}", report.check_errors);
}

#[test]
fn references_follow_except_in_plans_and_history() {
    let root = project("refs");
    let report = run(&root, false);
    let moved = report
        .mapping
        .get(&format!("{OLD_DISCUSSIONS}/work-data-model"))
        .unwrap();
    let guide = read(&root, "docs/guide.md");
    assert!(guide.contains(&format!("{moved}/DISCUSSION.md")), "{guide}");
    assert!(
        guide.contains(&format!(
            "{}/ and",
            report
                .mapping
                .get(&format!("{OLD_DISCUSSIONS}/work"))
                .unwrap()
        )),
        "{guide}"
    );
    assert!(guide.contains("plans/backlog.md"), "{guide}");
    assert!(!guide.contains(OLD_DISCUSSIONS) && !guide.contains(OLD_BACKLOG));
    // `work` must not have matched inside `work-data-model`.
    assert!(
        !guide.contains("plans/discussions/ds-") || guide.matches("-work-data-model").count() == 1
    );
    assert!(read(&root, "docs/history/old.md").contains(OLD_DISCUSSIONS));
    assert!(read(&root, "plans/some-plan/plan.md").contains(OLD_DISCUSSIONS));
}

#[test]
fn the_backlog_index_is_generated_and_the_legacy_file_is_a_pointer() {
    let root = project("index");
    run(&root, false);
    let index = read(&root, "plans/backlog.md");
    assert!(
        index.contains("| [p-rw5iadsp2p](backlog/p-rw5iadsp2p-"),
        "{index}"
    );
    assert!(
        index.contains("(settled)"),
        "the citing discussion is linked: {index}"
    );
    let pointer = read(&root, OLD_BACKLOG);
    assert!(
        pointer.contains("plans/backlog.md") && !pointer.contains("p-rw5iadsp2p"),
        "{pointer}"
    );
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

fn items_in(root: &Path) -> Vec<String> {
    let mut names: Vec<String> = fs::read_dir(root.join("plans/backlog"))
        .map(|dir| {
            dir.flatten()
                .map(|e| e.file_name().to_string_lossy().into_owned())
                .collect()
        })
        .unwrap_or_default();
    names.sort();
    names
}

fn done_section_backlog() -> String {
    format!(
        "{}\n## Done / Declined\n\n\
- [p-xbxdc6acdo] `cleanup-trust` lost a trust entry — done: owner decision 2026-11-02\n\
- [tsk-p7-shadow-binders] Retire the shadow binders — done: the placement binder went\n\
- [p-52815b3f] Extend the preflight gate — declined\n\
- [STR91] **Runner headless.** Wire it up — done\n",
        legacy_table()
    )
}

#[test]
fn the_done_and_declined_bullets_become_items_and_a_rerun_creates_no_duplicate() {
    let root = fixture("bullets");
    put(&root, OLD_BACKLOG, &done_section_backlog());
    let report = run(&root, false);
    assert_eq!(report.rows_found, 8);
    assert_eq!(report.items_created, 8);
    let items = items_in(&root);
    let pick = |needle: &str| {
        let name = items.iter().find(|n| n.contains(needle)).unwrap();
        read(&root, &format!("plans/backlog/{name}"))
    };
    assert!(pick("p-xbxdc6acdo-").contains("status: done"));
    assert!(pick("p-52815b3f-").contains("status: dropped"));
    // An id that is no valid shape is re-minted and the item says what it was.
    let renamed = pick("retire-the-shadow-binders");
    assert!(
        renamed.contains("Original id: tsk-p7-shadow-binders."),
        "{renamed}"
    );

    // The run stopped before the pointer: the legacy file is back, and no row is created twice.
    put(&root, OLD_BACKLOG, &done_section_backlog());
    let again = run(&root, false);
    assert_eq!(again.items_created, 0, "{:?}", again.to_json());
    assert_eq!(again.items_existing, 8);
    assert_eq!(items_in(&root).len(), 8);
}

#[test]
fn a_line_that_looks_like_an_item_but_is_not_read_refuses_before_any_write() {
    let root = fixture("unparsed");
    let text = format!("{}\n- [ ] a checkbox line\n", legacy_table());
    put(&root, OLD_BACKLOG, &text);
    let error = migrate_portfolio(&MigrateRequest {
        root: root.clone(),
        dry_run: false,
    })
    .unwrap_err();
    assert!(error.to_string().contains("unparsed-line"), "{error}");
    assert_eq!(read(&root, OLD_BACKLOG), text, "no pointer was written");
    assert!(!root.join("plans/backlog").exists());
}

#[test]
fn table_rows_follow_the_header_and_code_spans_and_refuse_a_mismatch() {
    let header = "| ID | Story | CoS | Status | Feature |\n|--|--|--|--|--|\n";
    let rows = parse_legacy_rows(&format!(
        "{header}| p-aaaaaaaaaa | **T.** Use `fgos head start|rotate` here. | x | declined | s |\n"
    ))
    .unwrap();
    assert_eq!(rows.len(), 1);
    assert!(rows[0].story.contains("start|rotate"), "{:?}", rows[0]);
    assert_eq!(rows[0].status, "declined");

    let extra = parse_legacy_rows(&format!(
        "{header}| p-bbbbbbbbbb | s | c | proposed | done | f |\n"
    ))
    .unwrap_err();
    assert!(extra.to_string().contains("p-bbbbbbbbbb"), "{extra}");

    let twice = parse_legacy_rows(&format!(
        "{header}| p-cccccccccc | s | c | proposed | f |\n| p-cccccccccc | s | c | proposed | f |\n"
    ))
    .unwrap_err();
    assert!(twice.to_string().contains("duplicate-id"), "{twice}");

    let root = fixture("declined");
    put(
        &root,
        OLD_BACKLOG,
        &format!("{header}| p-d2dc4f2e | **Withdrawn row.** why | x | declined | s |\n"),
    );
    run(&root, false);
    let name = items_in(&root).remove(0);
    assert!(read(&root, &format!("plans/backlog/{name}")).contains("status: dropped"));
}

#[test]
fn the_rewrite_touches_tracked_prose_only_and_never_a_nested_checkout() {
    let root = project("scope");
    let legacy_ref = format!("see {OLD_DISCUSSIONS}/work/ here\n");
    let untouched = [
        ".claude/worktrees/w1/docs/nested.md",
        ".agents/skills/s/SKILL.md",
        "plugins/fgOS/skills/s/SKILL.md",
        ".claude/skills/s/SKILL.md",
        "CHANGELOG.md",
        "scripts/reader.mjs",
        "packages/convention/contracts/rules.json",
        "archive/old.md",
    ];
    put(&root, ".claude/worktrees/w1/.git", "gitdir: elsewhere\n");
    for rel in untouched {
        put(&root, rel, &legacy_ref);
    }
    run(&root, false);
    for rel in untouched {
        assert_eq!(read(&root, rel), legacy_ref, "{rel} must stay as written");
    }
    assert!(!read(&root, "docs/guide.md").contains(OLD_DISCUSSIONS));
}

#[test]
fn in_a_git_checkout_an_untracked_file_is_never_rewritten() {
    let root = project("tracked");
    if !std::process::Command::new("git")
        .args(["init", "-q"])
        .current_dir(&root)
        .status()
        .is_ok_and(|s| s.success())
    {
        return;
    }
    let text = format!("see {OLD_DISCUSSIONS}/work/ here\n");
    put(&root, "docs/tracked.md", &text);
    put(&root, "docs/untracked.md", &text);
    assert!(std::process::Command::new("git")
        .args(["add", "docs/tracked.md"])
        .current_dir(&root)
        .status()
        .unwrap()
        .success());
    let report = run(&root, false);
    assert!(report
        .files_rewritten
        .contains(&"docs/tracked.md".to_owned()));
    assert_eq!(read(&root, "docs/untracked.md"), text);
    assert!(!read(&root, "docs/tracked.md").contains(OLD_DISCUSSIONS));
}

#[test]
fn a_rerun_after_an_interruption_rewrites_to_directories_that_exist_and_adds_the_frontmatter() {
    let root = fixture("resume-discussion");
    put(&root, OLD_BACKLOG, &legacy_table());
    // The directory was moved by the interrupted run, which stopped before its frontmatter and the rewrite.
    put(
        &root,
        "plans/discussions/ds-234567abcd-work/DISCUSSION.md",
        "# Work\n\ndiscussion: settled\n",
    );
    put(
        &root,
        "docs/guide.md",
        &format!("See {OLD_DISCUSSIONS}/work/DISCUSSION.md.\n"),
    );
    let report = run(&root, false);
    assert_eq!(report.discussions_moved, 0);
    assert!(
        read(&root, "docs/guide.md").contains("plans/discussions/ds-234567abcd-work/DISCUSSION.md")
    );
    let text = read(&root, "plans/discussions/ds-234567abcd-work/DISCUSSION.md");
    assert!(
        text.starts_with("---\nid: ds-234567abcd\n") && text.contains("status: settled"),
        "{text}"
    );
    assert!(report.check_errors.is_empty(), "{:?}", report.check_errors);
}

#[test]
fn a_front_block_without_portfolio_keys_is_merged_not_replaced() {
    let root = fixture("merge-front");
    put(&root, OLD_BACKLOG, &legacy_table());
    put(
        &root,
        &format!("{OLD_DISCUSSIONS}/cap/DISCUSSION.md"),
        "---\nitem: tsk-x\n---\n\n# Capacity\n\ndiscussion: paused\n",
    );
    put(
        &root,
        &format!("{OLD_DISCUSSIONS}/roll/DISCUSSION.md"),
        "---\ntype: discussion\ntitle: Rollup parent\ntimestamp: 2026-10-05T10:00:00Z\n---\n\n# Rollup\n\nBody\n",
    );
    let report = run(&root, false);
    assert_eq!(report.frontmatter_added, 2);
    assert!(report.check_errors.is_empty(), "{:?}", report.check_errors);
    let cap = read(
        &root,
        &format!(
            "{}/DISCUSSION.md",
            report.mapping[&format!("{OLD_DISCUSSIONS}/cap")]
        ),
    );
    assert!(
        cap.contains("id: ds-") && cap.contains("item: tsk-x") && cap.contains("status: paused"),
        "{cap}"
    );
    let roll = read(
        &root,
        &format!(
            "{}/DISCUSSION.md",
            report.mapping[&format!("{OLD_DISCUSSIONS}/roll")]
        ),
    );
    assert!(
        roll.contains("title: Rollup parent")
            && roll.contains("timestamp: 2026-10-05T10:00:00Z")
            && roll.contains("created: 2026-10-05"),
        "{roll}"
    );
}

#[test]
fn every_guessed_status_is_listed_in_the_report() {
    let root = project("guessed");
    put(
        &root,
        &format!("{OLD_DISCUSSIONS}/nomark/DISCUSSION.md"),
        "# No marker\n\nBody.\n",
    );
    let report = run(&root, false);
    assert!(
        report
            .guessed_statuses
            .iter()
            .any(|g| g.contains("-nomark") && g.contains("no status marker")),
        "{:?}",
        report.guessed_statuses
    );
    // The two discussions that name their status are not guesses.
    assert_eq!(
        report.guessed_statuses.len(),
        1,
        "{:?}",
        report.guessed_statuses
    );
}

#[cfg(unix)]
#[test]
fn a_rewritten_file_keeps_its_executable_bit() {
    use std::os::unix::fs::PermissionsExt;
    let root = project("mode");
    put(
        &root,
        "docs/run.md",
        &format!("see {OLD_DISCUSSIONS}/work/\n"),
    );
    let path = root.join("docs/run.md");
    fs::set_permissions(&path, fs::Permissions::from_mode(0o755)).unwrap();
    run(&root, false);
    assert!(!read(&root, "docs/run.md").contains(OLD_DISCUSSIONS));
    assert_eq!(
        fs::metadata(&path).unwrap().permissions().mode() & 0o777,
        0o755
    );
}

#[test]
fn relative_links_to_the_legacy_discussions_follow() {
    let root = project("relative");
    put(
        &root,
        "docs/platform/questions/spec.md",
        "[d](../../discussions/work/DISCUSSION.md) and [x](../../discussions/work-data-model/)\n",
    );
    // Two levels up from `docs/other/` leaves the docs tree: that link is not ours.
    put(&root, "docs/other/a.md", "[d](../../discussions/work/)\n");
    let report = run(&root, false);
    let work = &report.mapping[&format!("{OLD_DISCUSSIONS}/work")];
    let wdm = &report.mapping[&format!("{OLD_DISCUSSIONS}/work-data-model")];
    assert_eq!(
        read(&root, "docs/platform/questions/spec.md"),
        format!("[d](../../../{work}/DISCUSSION.md) and [x](../../../{wdm}/)\n")
    );
    assert_eq!(
        read(&root, "docs/other/a.md"),
        "[d](../../discussions/work/)\n"
    );
}

#[test]
fn a_dry_run_reports_what_a_real_run_does() {
    let build = |name: &str| {
        let root = project(name);
        put(
            &root,
            &format!("{OLD_DISCUSSIONS}/work/DISCUSSION.md"),
            &format!("# Work\n\ndiscussion: open\nsee {OLD_DISCUSSIONS}/work-data-model/\n"),
        );
        put(
            &root,
            &format!("{OLD_DISCUSSIONS}/nomark/DISCUSSION.md"),
            "# No marker\n",
        );
        root
    };
    let dry = run(&build("parity-dry"), true);
    let real_root = build("parity-real");
    let real = run(&real_root, false);
    assert_eq!(dry.rows_found, real.rows_found);
    assert_eq!(dry.items_created, real.items_created);
    assert_eq!(dry.items_existing, real.items_existing);
    assert_eq!(dry.discussions_moved, real.discussions_moved);
    assert_eq!(dry.discussions_existing, real.discussions_existing);
    assert_eq!(dry.frontmatter_added, real.frontmatter_added);
    assert_eq!(dry.files_rewritten, real.files_rewritten);
    assert_eq!(dry.index_written, real.index_written);
    assert!(dry.index_written && dry.pointer_written == real.pointer_written);
    assert_eq!(dry.mapping.len(), real.mapping.len());
    assert_eq!(dry.guessed_statuses.len(), real.guessed_statuses.len());
    // A moved discussion keeps the references it was written with, in a dry run and a real one.
    let work = &real.mapping[&format!("{OLD_DISCUSSIONS}/work")];
    assert!(read(&real_root, &format!("{work}/DISCUSSION.md")).contains(OLD_DISCUSSIONS));
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
