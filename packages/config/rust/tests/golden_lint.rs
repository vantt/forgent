//! Owning proof of the lint rules that need more than one node or file, and that the bundled set
//! is clean (the standing gate for every schema and standard file added later).
mod common;

use common::{cases, files, refs};
use fgos_config::lint::{cross_node, lint};
use fgos_config::schema::Schemas;
use fgos_config::standard::Standard;

#[test]
fn lint_cases() {
    for case in cases("lint.v1.json") {
        let (id, input, expect) = (
            case["id"].as_str().unwrap(),
            &case["input"],
            &case["expect"],
        );
        let (schema_files, standard_files) = (
            files(&input["schemas"], true),
            files(&input["standard"], false),
        );
        let schemas = Schemas::parse(&refs(&schema_files)).unwrap();
        let standard = Standard::parse(&refs(&standard_files), &schemas).unwrap();
        let found = cross_node(&schemas, &standard);
        let mut ids: Vec<&str> = found.iter().map(|f| f.id).collect();
        ids.sort();
        let mut want: Vec<&str> = expect["findings"]
            .as_array()
            .unwrap()
            .iter()
            .map(|i| i.as_str().unwrap())
            .collect();
        want.sort();
        assert_eq!(ids, want, "{id}: {found:?}");
        for at in expect["at"].as_array().into_iter().flatten() {
            let hit = found
                .iter()
                .find(|f| f.id == at["id"].as_str().unwrap())
                .unwrap();
            let got = (
                hit.file.as_str(),
                hit.line.map(u64::from),
                hit.column.map(u64::from),
            );
            assert_eq!(
                got,
                (
                    at["file"].as_str().unwrap(),
                    at["line"].as_u64(),
                    at["column"].as_u64()
                ),
                "{id}: position"
            );
        }
    }
}

#[test]
fn bundled_set_is_clean() {
    let (schemas, _) = Schemas::bundled().unwrap();
    let standard = Standard::bundled(&schemas).unwrap();
    assert_eq!(lint(&schemas, &standard), vec![]);
}
