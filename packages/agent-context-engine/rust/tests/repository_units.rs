#![cfg(feature = "store")]
//! The repository's own rule units, read from the three real roots.

use std::path::Path;

use fgos_agent_context_engine::check::OwnerList;
use fgos_agent_context_engine::store::{
    check_repository, read_corpus, EmbedderChoice, Nearest, SearchPaths, StorePaths,
};
use fgos_agent_context_engine::when_keys::NoLiveValues;
use tempfile::TempDir;

fn unit_files(dir: &Path) -> usize {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return 0;
    };
    entries
        .filter_map(Result::ok)
        .map(|e| {
            let path = e.path();
            if path.is_dir() {
                unit_files(&path)
            } else {
                usize::from(path.extension().is_some_and(|x| x == "md"))
            }
        })
        .sum()
}

#[test]
fn the_repositorys_own_rule_units_pass_every_check_of_the_crate_and_compose_without_refusal() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../..");
    let mut expected = unit_files(&root.join("core/instructions"));
    for group in ["components", "domains"] {
        for dir in std::fs::read_dir(root.join(group))
            .unwrap()
            .filter_map(Result::ok)
        {
            expected += unit_files(&dir.path().join("instructions"));
        }
    }
    assert!(expected > 0, "the repository has rule units");

    let owners = OwnerList(
        ["coding", "council", "marketing", "packaging-distribution"]
            .iter()
            .map(|s| s.to_string())
            .collect(),
    );
    let corpus = read_corpus(&root, &owners).unwrap();
    assert_eq!(corpus.len(), expected);

    let db_dir = TempDir::new().unwrap();
    let paths = StorePaths {
        repo_root: root.clone(),
        graph_db: db_dir.path().join("rules.db"),
        profile: Path::new(env!("CARGO_MANIFEST_DIR")).join("../pkm/profile.yaml"),
        search: SearchPaths {
            db: db_dir.path().join("search.db"),
            model_dir: db_dir.path().join("models"),
            embedder: EmbedderChoice::Model,
        },
    };
    let checked =
        check_repository(&paths, "2026-11-26", &owners, &NoLiveValues, Nearest::Skip).unwrap();
    assert_eq!(checked.refusals, []);
    assert_eq!(checked.in_force.len(), expected);
}
