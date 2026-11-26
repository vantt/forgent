#![cfg(feature = "store")]
//! The store: reading the three roots, the pkm index over them, the set in force, pkm's graph findings, and the
//! check and compile of a whole repository.

use std::fs;
use std::path::{Path, PathBuf};

use fgos_agent_context_engine::check::OwnerList;
use fgos_agent_context_engine::refusal::RefusalCode;
use fgos_agent_context_engine::set::EffectiveSet;
use fgos_agent_context_engine::store::{
    check_repository, compile_repository, read_corpus, RuleIndex, StorePaths,
};
use fgos_agent_context_engine::when_keys::NoLiveValues;
use tempfile::TempDir;

struct Repo {
    dir: TempDir,
    db_dir: TempDir,
}

fn owners() -> OwnerList {
    OwnerList(
        ["coding", "packaging-distribution"]
            .iter()
            .map(|s| s.to_string())
            .collect(),
    )
}

fn unit_text(id: &str, owner: &str, scope: &str, extra: &str) -> String {
    format!(
        "---\nid: {id}\nowner: {owner}\nkind: procedure\nmode: append\nscope: {scope}\nspecificity: 10\ntitle: Title of {id}\nlifecycle: live\nvalid_from: 2026-01-01\n{extra}---\n\nBody of {id}.\n"
    )
}

impl Repo {
    fn new() -> Repo {
        Repo {
            dir: TempDir::new().unwrap(),
            db_dir: TempDir::new().unwrap(),
        }
    }

    fn root(&self) -> &Path {
        self.dir.path()
    }

    fn write(&self, rel: &str, text: &str) {
        let path = self.root().join(rel);
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(path, text).unwrap();
    }

    fn core(&self, id: &str, extra: &str) {
        self.write(
            &format!("core/instructions/{id}.md"),
            &unit_text(id, "core", "repo", extra),
        );
    }

    fn domain(&self, domain: &str, id: &str, extra: &str) {
        self.write(
            &format!("domains/{domain}/instructions/{id}.md"),
            &unit_text(id, domain, "domain", extra),
        );
    }

    fn paths(&self) -> StorePaths {
        StorePaths {
            repo_root: self.root().to_path_buf(),
            graph_db: self.db_dir.path().join("rules.db"),
            profile: Path::new(env!("CARGO_MANIFEST_DIR")).join("../pkm/profile.yaml"),
        }
    }

    fn tree(&self) -> Vec<(PathBuf, Vec<u8>)> {
        fn walk(dir: &Path, out: &mut Vec<(PathBuf, Vec<u8>)>) {
            let mut entries: Vec<_> = fs::read_dir(dir).unwrap().filter_map(Result::ok).collect();
            entries.sort_by_key(|e| e.path());
            for e in entries {
                let p = e.path();
                if p.is_dir() {
                    walk(&p, out);
                } else {
                    out.push((p.clone(), fs::read(&p).unwrap()));
                }
            }
        }
        let mut out = Vec::new();
        walk(self.root(), &mut out);
        out
    }
}

fn codes(refusals: &[fgos_agent_context_engine::refusal::Refusal]) -> Vec<RefusalCode> {
    refusals.iter().map(|r| r.code).collect()
}

// --- reading the three roots

#[test]
fn reads_units_from_core_components_and_domains_with_their_sources() {
    let repo = Repo::new();
    repo.core("core-rule", "");
    repo.write(
        "components/packaging-distribution/instructions/verification.md",
        &unit_text("verification", "packaging-distribution", "component", ""),
    );
    repo.domain("coding", "worktree-safety", "when:\n  role: [producer]\n");
    repo.write(
        "core/instructions/nested/deeper-rule.md",
        &unit_text("deeper-rule", "core", "repo", ""),
    );
    let corpus = read_corpus(repo.root(), &owners()).unwrap();
    let sources: Vec<&str> = corpus.iter().map(|f| f.source.as_str()).collect();
    assert_eq!(
        sources,
        [
            "core/instructions/core-rule.md",
            "core/instructions/nested/deeper-rule.md",
            "components/packaging-distribution/instructions/verification.md",
            "domains/coding/instructions/worktree-safety.md"
        ]
    );
    assert_eq!(corpus[3].unit.when["role"], ["producer"]);
    assert_eq!(corpus[0].body, "Body of core-rule.");
    assert_eq!(corpus[0].unit.valid_from, "2026-01-01");
}

#[test]
fn missing_or_empty_roots_read_as_no_rules() {
    let repo = Repo::new();
    assert!(read_corpus(repo.root(), &owners()).unwrap().is_empty());
    fs::create_dir_all(repo.root().join("core/instructions")).unwrap();
    fs::create_dir_all(repo.root().join("domains/coding")).unwrap();
    assert!(read_corpus(repo.root(), &owners()).unwrap().is_empty());
}

#[test]
fn a_file_without_readable_frontmatter_is_refused_and_every_bad_file_is_reported_together() {
    let repo = Repo::new();
    repo.write("core/instructions/no-frontmatter.md", "# just text\n");
    repo.write(
        "core/instructions/unterminated.md",
        "---\nid: unterminated\n",
    );
    repo.write(
        "core/instructions/bad-yaml.md",
        "---\nid: [unclosed\n---\nbody\n",
    );
    repo.write(
        "core/instructions/not-a-mapping.md",
        "---\n- a\n- b\n---\nbody\n",
    );
    repo.core("fine-rule", "");
    let refusals = read_corpus(repo.root(), &owners()).unwrap_err();
    assert_eq!(refusals.len(), 4);
    assert!(refusals.iter().all(|r| r.code == RefusalCode::UnitInvalid));
    let mut sources: Vec<&str> = refusals
        .iter()
        .filter_map(|r| r.source.as_deref())
        .collect();
    sources.sort_unstable();
    assert_eq!(
        sources,
        [
            "core/instructions/bad-yaml.md",
            "core/instructions/no-frontmatter.md",
            "core/instructions/not-a-mapping.md",
            "core/instructions/unterminated.md"
        ]
    );
}

#[test]
fn a_component_or_domain_directory_outside_the_authority_model_is_refused() {
    let repo = Repo::new();
    repo.write(
        "components/ghost/instructions/x-rule.md",
        &unit_text("x-rule", "ghost", "component", ""),
    );
    repo.write(
        "domains/phantom/instructions/y-rule.md",
        &unit_text("y-rule", "phantom", "domain", ""),
    );
    let refusals = read_corpus(repo.root(), &owners()).unwrap_err();
    assert_eq!(
        codes(&refusals),
        [RefusalCode::OwnerUnknown, RefusalCode::OwnerUnknown]
    );
    let none = OwnerList(Default::default());
    repo.domain("coding", "z-rule", "");
    assert_eq!(read_corpus(repo.root(), &none).unwrap_err().len(), 3);
}

#[test]
fn a_symlink_that_leaves_the_repository_is_refused() {
    let repo = Repo::new();
    let outside = TempDir::new().unwrap();
    fs::write(
        outside.path().join("escaped-rule.md"),
        unit_text("escaped-rule", "core", "repo", ""),
    )
    .unwrap();
    fs::create_dir_all(repo.root().join("core/instructions")).unwrap();
    std::os::unix::fs::symlink(
        outside.path().join("escaped-rule.md"),
        repo.root().join("core/instructions/escaped-rule.md"),
    )
    .unwrap();
    let refusals = read_corpus(repo.root(), &owners()).unwrap_err();
    assert_eq!(refusals.len(), 1);
    assert!(refusals[0].message.contains("outside the repository"));
}

#[test]
fn only_lower_case_md_files_outside_dot_names_are_read() {
    let repo = Repo::new();
    repo.core("real-rule", "");
    repo.write("core/instructions/notes.txt", "not a rule");
    repo.write("core/instructions/Upper.MD", "not a rule");
    repo.write("core/instructions/.hidden.md", "not a rule");
    repo.write("core/instructions/.git/config.md", "not a rule");
    let corpus = read_corpus(repo.root(), &owners()).unwrap();
    assert_eq!(corpus.len(), 1);
}

// --- the pkm index

fn open(repo: &Repo) -> RuleIndex {
    RuleIndex::open(&repo.paths()).expect("the index opens")
}

#[test]
fn the_index_is_a_view_outside_the_tree_and_never_writes_into_the_repository() {
    let repo = Repo::new();
    repo.core("core-rule", "");
    repo.domain("coding", "domain-rule", "");
    let before = repo.tree();
    let corpus = read_corpus(repo.root(), &owners()).unwrap();
    let index = open(&repo);
    let in_force = index.in_force("2026-11-26", &corpus).unwrap();
    assert_eq!(in_force.ids.len(), 2);
    assert_eq!(repo.tree(), before);
    assert!(repo.paths().graph_db.exists());
}

#[test]
fn in_force_follows_lifecycle_and_dates_and_accounts_for_every_file() {
    let repo = Repo::new();
    repo.core("live-rule", "");
    repo.write(
        "core/instructions/draft-rule.md",
        &unit_text("draft-rule", "core", "repo", "").replace("lifecycle: live", "lifecycle: draft"),
    );
    repo.write(
        "core/instructions/retracted-rule.md",
        &unit_text("retracted-rule", "core", "repo", "")
            .replace("lifecycle: live", "lifecycle: retracted"),
    );
    repo.write(
        "core/instructions/deprecated-rule.md",
        &unit_text("deprecated-rule", "core", "repo", "")
            .replace("lifecycle: live", "lifecycle: deprecated"),
    );
    repo.write(
        "core/instructions/ending-rule.md",
        &unit_text(
            "ending-rule",
            "core",
            "repo",
            "superseded_by: \"[[live-rule]]\"\nvalid_to: 2027-06-01\n",
        )
        .replace("lifecycle: live", "lifecycle: replaced"),
    );
    repo.write(
        "core/instructions/ended-rule.md",
        &unit_text(
            "ended-rule",
            "core",
            "repo",
            "superseded_by: \"[[live-rule]]\"\nvalid_to: 2026-06-01\n",
        )
        .replace("lifecycle: live", "lifecycle: replaced"),
    );
    repo.write(
        "core/instructions/future-rule.md",
        &unit_text("future-rule", "core", "repo", "")
            .replace("valid_from: 2026-01-01", "valid_from: 2030-01-01"),
    );
    let corpus = read_corpus(repo.root(), &owners()).unwrap();
    let in_force = open(&repo).in_force("2026-11-26", &corpus).unwrap();
    let ids: Vec<&str> = in_force.ids.iter().map(String::as_str).collect();
    assert_eq!(ids, ["deprecated-rule", "ending-rule", "live-rule"]);
    assert_eq!(in_force.accounted, corpus.len());
}

#[test]
fn the_index_is_rebuilt_when_a_unit_changes() {
    let repo = Repo::new();
    repo.core("one-rule", "");
    let index = open(&repo);
    let corpus = read_corpus(repo.root(), &owners()).unwrap();
    assert_eq!(index.in_force("2026-11-26", &corpus).unwrap().ids.len(), 1);
    repo.write(
        "core/instructions/one-rule.md",
        &unit_text("one-rule", "core", "repo", "")
            .replace("lifecycle: live", "lifecycle: retracted"),
    );
    repo.core("two-rule", "");
    let corpus = read_corpus(repo.root(), &owners()).unwrap();
    let ids = index.in_force("2026-11-26", &corpus).unwrap().ids;
    assert_eq!(ids.into_iter().collect::<Vec<_>>(), ["two-rule"]);
}

#[test]
fn pkm_findings_become_refusals_with_the_rule_id_of_the_node() {
    let repo = Repo::new();
    repo.core("dangling-rule", "depends_on: [\"[[no-such-rule]]\"]\n");
    repo.core("twin-rule", "");
    repo.domain("coding", "twin-rule", "");
    let corpus = read_corpus(repo.root(), &owners()).unwrap();
    let found = open(&repo).validate(&corpus).unwrap();
    let dangling: Vec<_> = found
        .iter()
        .filter(|r| r.code == RefusalCode::DependencyNotInForce)
        .collect();
    assert_eq!(dangling.len(), 1);
    assert_eq!(dangling[0].ids, ["dangling-rule"]);
    assert!(found
        .iter()
        .any(|r| r.code == RefusalCode::IdDuplicate && r.ids == ["twin-rule"]));
}

#[test]
fn a_clean_corpus_gives_pkm_no_finding_and_links_resolve_across_roots_by_file_stem() {
    let repo = Repo::new();
    repo.core("core-law", "");
    repo.domain(
        "coding",
        "domain-rule",
        "depends_on: [\"[[core-law]]\"]\nrelated: [\"[[core-law]]\"]\n",
    );
    let corpus = read_corpus(repo.root(), &owners()).unwrap();
    assert_eq!(open(&repo).validate(&corpus).unwrap(), []);
}

// --- the repository check and compile

#[test]
fn a_clean_repository_checks_clean_and_compiles_to_a_set_a_reader_accepts() {
    let repo = Repo::new();
    repo.core("core-rule", "");
    repo.domain(
        "coding",
        "domain-rule",
        "depends_on: [\"[[core-rule]]\"]\nwhen:\n  role: [producer]\n",
    );
    let (_, ids, refusals) =
        check_repository(&repo.paths(), "2026-11-26", &owners(), &NoLiveValues).unwrap();
    assert_eq!(refusals, []);
    assert_eq!(ids.len(), 2);
    let set = compile_repository(&repo.paths(), "2026-11-26", &owners(), &NoLiveValues).unwrap();
    let ordered: Vec<&str> = set.rules.iter().map(|r| r.id.as_str()).collect();
    assert_eq!(ordered, ["core-rule", "domain-rule"]);
    assert_eq!(EffectiveSet::read(&set.to_bytes()).unwrap(), set);
}

#[test]
fn a_repository_with_conflicting_rules_in_force_is_refused_and_compiles_nothing() {
    let repo = Repo::new();
    repo.core("rule-a", "conflicts_with: [\"[[rule-b]]\"]\n");
    repo.core("rule-b", "");
    let (_, _, refusals) =
        check_repository(&repo.paths(), "2026-11-26", &owners(), &NoLiveValues).unwrap();
    assert_eq!(codes(&refusals), [RefusalCode::ConflictInForce]);
    let err =
        compile_repository(&repo.paths(), "2026-11-26", &owners(), &NoLiveValues).unwrap_err();
    assert_eq!(codes(&err), [RefusalCode::ConflictInForce]);
}

#[test]
fn a_dangling_link_is_one_refusal_even_though_the_unit_check_and_pkm_both_see_it() {
    let repo = Repo::new();
    repo.core("dangling-rule", "depends_on: [\"[[no-such-rule]]\"]\n");
    let (_, _, refusals) =
        check_repository(&repo.paths(), "2026-11-26", &owners(), &NoLiveValues).unwrap();
    assert_eq!(codes(&refusals), [RefusalCode::DependencyNotInForce]);
}

#[test]
fn an_unreadable_unit_stops_the_check_before_the_index() {
    let repo = Repo::new();
    repo.write("core/instructions/broken.md", "no frontmatter");
    let refusals =
        check_repository(&repo.paths(), "2026-11-26", &owners(), &NoLiveValues).unwrap_err();
    assert_eq!(codes(&refusals), [RefusalCode::UnitInvalid]);
    assert!(!repo.paths().graph_db.exists());
}

#[test]
fn a_replaced_rule_inside_its_window_stays_in_the_set_and_one_outside_it_leaves() {
    let repo = Repo::new();
    repo.core("new-rule", "");
    repo.write(
        "core/instructions/old-rule.md",
        &unit_text(
            "old-rule",
            "core",
            "repo",
            "superseded_by: \"[[new-rule]]\"\nvalid_to: 2027-06-01\n",
        )
        .replace("lifecycle: live", "lifecycle: replaced"),
    );
    let inside = compile_repository(&repo.paths(), "2026-11-26", &owners(), &NoLiveValues).unwrap();
    assert_eq!(inside.rules.len(), 2);
    let outside =
        compile_repository(&repo.paths(), "2028-01-01", &owners(), &NoLiveValues).unwrap();
    assert_eq!(
        outside
            .rules
            .iter()
            .map(|r| r.id.as_str())
            .collect::<Vec<_>>(),
        ["new-rule"]
    );
}

#[test]
fn a_long_list_of_rules_in_force_is_never_cut() {
    let repo = Repo::new();
    for n in 0..45 {
        repo.core(&format!("bulk-rule-{n}"), "");
    }
    let corpus = read_corpus(repo.root(), &owners()).unwrap();
    let in_force = open(&repo).in_force("2026-11-26", &corpus).unwrap();
    assert_eq!(in_force.ids.len(), 45);
    assert_eq!(in_force.accounted, 45);
}
